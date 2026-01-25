import json
import time
import uuid
import zlib
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, WebSocket
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models import Creature, CreaturePerformance, CreatureFrame, Generation, Run
from app.schemas.genome import CreatureGenome
from app.schemas.simulation import SimulationConfig
from app.services.simulator import SimulatorService
from app.genetics.population import (
    generate_population,
    evolve_population as genetics_evolve_population,
    GenomeConstraints,
    EvolutionConfig,
)

router = APIRouter()


def trimmed_mean(values: list[float]) -> float:
    """Compute trimmed mean (drop highest and lowest, then average).

    More robust to outliers than regular mean.
    For lists with < 3 values, returns regular mean.
    """
    if len(values) == 0:
        return 0.0
    if len(values) < 3:
        return sum(values) / len(values)

    sorted_vals = sorted(values)
    # Drop lowest and highest
    trimmed = sorted_vals[1:-1]
    return sum(trimmed) / len(trimmed)


def compute_adaptive_boost(
    best_fitness_history: list[float],
    current_boost: float,
    gens_since_change: int,
    config: SimulationConfig,
) -> tuple[float, int, str]:
    """Compute new adaptive boost level based on fitness history.

    Uses trimmed rolling mean to compare current window vs previous window.

    Returns:
        tuple of (new_boost_level, new_gens_since_change, decision)
        decision is one of: 'cooldown', 'stagnating', 'marginal', 'improving'
    """
    threshold = config.stagnation_threshold

    # Need at least 2 windows of history
    if len(best_fitness_history) < 2 * threshold:
        return current_boost, gens_since_change + 1, 'cooldown'

    # Increment counter
    new_gens_since_change = gens_since_change + 1

    # Still in cooldown period after last boost change
    if new_gens_since_change < threshold:
        return current_boost, new_gens_since_change, 'cooldown'

    # Compute trimmed means for current and previous windows
    current_window = best_fitness_history[-threshold:]
    previous_window = best_fitness_history[-2*threshold:-threshold]

    current_avg = trimmed_mean(current_window)
    previous_avg = trimmed_mean(previous_window)

    improvement = current_avg - previous_avg

    # Three-way decision
    if improvement >= config.improvement_threshold:
        # Real improvement - reduce boost (halve toward 1.0)
        new_boost = max(1.0, current_boost / 2)
        return new_boost, 0, 'improving'
    elif improvement <= 0:
        # Stagnation or regression - increase boost
        new_boost = min(config.max_adaptive_boost, current_boost * config.adaptive_mutation_boost)
        return new_boost, 0, 'stagnating'
    else:
        # Marginal improvement - maintain, keep watching
        return current_boost, new_gens_since_change, 'marginal'


async def run_generation(
    run_id: str,
    db: AsyncSession,
    simulator: SimulatorService,
) -> dict:
    """Run a single generation of evolution."""
    # Get the run
    result = await db.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    config = SimulationConfig(**run.config)
    current_gen = run.current_generation

    # Track survivor IDs for animation states
    survivor_ids: set[str] = set()

    # Get genomes for this generation
    if current_gen == 0:
        # Generate initial population with neural network support
        constraints = GenomeConstraints(
            min_nodes=config.min_nodes,
            max_nodes=config.max_nodes,
            max_muscles=config.max_muscles,
            max_frequency=config.max_allowed_frequency,
        )
        genomes = generate_population(
            size=config.population_size,
            constraints=constraints,
            use_neural_net=config.use_neural_net,
            neural_hidden_size=config.neural_hidden_size,
            neural_output_bias=config.neural_output_bias,
            neural_mode=config.neural_mode,
            time_encoding=config.time_encoding,
            use_proprioception=config.use_proprioception,
            proprioception_inputs=config.proprioception_inputs,
        )
    else:
        # Get previous generation performances (sorted by fitness)
        prev_result = await db.execute(
            select(CreaturePerformance)
            .where(
                CreaturePerformance.run_id == run_id,
                CreaturePerformance.generation == current_gen - 1
            )
            .order_by(CreaturePerformance.fitness.desc())
        )
        prev_performances = prev_result.scalars().all()

        if not prev_performances:
            raise HTTPException(status_code=400, detail="No creatures in previous generation")

        # Load the creature records for genomes
        creature_ids = [p.creature_id for p in prev_performances]
        creatures_result = await db.execute(
            select(Creature).where(Creature.id.in_(creature_ids))
        )
        prev_creatures_map = {c.id: c for c in creatures_result.scalars().all()}

        # Calculate survivor count based on cull percentage
        survivor_count = int(len(prev_performances) * (1 - config.cull_percentage))
        survivor_creature_ids = {prev_performances[i].creature_id for i in range(survivor_count)}

        # Mark culled creatures as dead
        for perf in prev_performances[survivor_count:]:
            creature = prev_creatures_map.get(perf.creature_id)
            if creature and creature.death_generation is None:
                creature.death_generation = current_gen - 1

        # Prepare genomes and fitness scores for evolution
        prev_genomes = [prev_creatures_map[p.creature_id].genome for p in prev_performances]
        prev_fitness = [p.fitness for p in prev_performances]

        # Build evolution config
        evolution_config = {
            'population_size': config.population_size,
            'elite_count': config.elite_count,
            'cull_percentage': config.cull_percentage,
            'selection_method': config.selection_method,
            'tournament_size': config.tournament_size,
            'crossover_rate': config.crossover_rate,
            'use_mutation': config.use_mutation,
            'use_crossover': config.use_crossover,
            'mutation_rate': config.mutation_rate,
            'mutation_magnitude': config.mutation_magnitude,
            'weight_mutation_rate': config.weight_mutation_rate,
            'weight_mutation_magnitude': config.weight_mutation_magnitude,
            'weight_mutation_decay': config.weight_mutation_decay,
            'use_neural_net': config.use_neural_net,
            'neural_hidden_size': config.neural_hidden_size,
            'neural_output_bias': config.neural_output_bias,
            'min_nodes': config.min_nodes,
            'max_nodes': config.max_nodes,
            'max_muscles': config.max_muscles,
            'max_frequency': config.max_allowed_frequency,
            'use_fitness_sharing': config.use_fitness_sharing,
            'sharing_radius': config.sharing_radius,
            'use_speciation': config.use_speciation,
            'compatibility_threshold': config.compatibility_threshold,
            'min_species_size': config.min_species_size,
        }

        # Compute adaptive mutation boost if enabled
        adaptive_boost_level = 1.0
        if config.use_adaptive_mutation:
            # Get best fitness from all previous generations
            gen_result = await db.execute(
                select(Generation.best_fitness)
                .where(Generation.run_id == run_id)
                .order_by(Generation.generation)
            )
            best_fitness_history = [row[0] for row in gen_result.all()]

            # Compute new boost level
            new_boost, new_gens_since_change, decision = compute_adaptive_boost(
                best_fitness_history=best_fitness_history,
                current_boost=run.adaptive_boost_level,
                gens_since_change=run.gens_since_boost_change,
                config=config,
            )

            # Update run state
            run.adaptive_boost_level = new_boost
            run.gens_since_boost_change = new_gens_since_change
            adaptive_boost_level = new_boost

        # Pass boost level to evolution config
        evolution_config['adaptive_boost_level'] = adaptive_boost_level

        # Evolve to get new genomes
        # Note: evolve_population preserves survivor IDs, gives new IDs to offspring
        genomes, _ = genetics_evolve_population(
            genomes=prev_genomes,
            fitness_scores=prev_fitness,
            config=evolution_config,
            generation=current_gen - 1,
        )

        # Only generate new IDs for offspring (survivalStreak == 0)
        # Survivors keep their original creature ID
        for genome in genomes:
            if genome.get('survivalStreak', 0) == 0:
                # New offspring - generate new unique ID
                genome['id'] = f"creature_{uuid.uuid4().hex[:8]}"
            # Survivors keep their original ID from evolve_population

        # Track survivor IDs for frontend animation
        survivor_ids = survivor_creature_ids

    # Simulate all creatures
    start_time = time.time()
    # Determine frame storage mode: if sparse, we still need to record all frames
    # for selection later; if none, don't record; if all, record all
    effective_frame_mode = "all" if config.frame_storage_mode == "sparse" else config.frame_storage_mode
    sim_results = await simulator.simulate_batch(
        genomes=genomes,
        config={
            "simulation_duration": config.simulation_duration,
            "frame_storage_mode": effective_frame_mode,
            "frame_rate": 15,
            "pellet_count": config.pellet_count,
            "arena_size": config.arena_size,
            "max_allowed_frequency": config.max_allowed_frequency,
            "fitness_pellet_points": config.fitness_pellet_points,
            "fitness_progress_max": config.fitness_progress_max,
            "fitness_distance_per_unit": config.fitness_distance_per_unit,
            "fitness_distance_traveled_max": config.fitness_distance_traveled_max,
            "fitness_regression_penalty": config.fitness_regression_penalty,
            "fitness_efficiency_penalty": config.fitness_efficiency_penalty,
            "neural_dead_zone": config.neural_dead_zone,
            "use_neural_net": config.use_neural_net,
            "neural_mode": config.neural_mode,
            "neural_hidden_size": config.neural_hidden_size,
            "time_encoding": config.time_encoding,
            "use_proprioception": config.use_proprioception,
            "proprioception_inputs": config.proprioception_inputs,
        },
    )
    simulation_time_ms = int((time.time() - start_time) * 1000)

    # Calculate statistics
    fitnesses = [r["fitness"] for r in sim_results]
    fitnesses.sort()
    best_fitness = max(fitnesses)
    avg_fitness = sum(fitnesses) / len(fitnesses)
    worst_fitness = min(fitnesses)
    median_fitness = fitnesses[len(fitnesses) // 2]

    # Calculate creature type distribution
    creature_types: dict[str, int] = {}
    for genome in genomes:
        node_count = str(len(genome["nodes"]))
        creature_types[node_count] = creature_types.get(node_count, 0) + 1

    # Create generation record
    generation = Generation(
        run_id=run_id,
        generation=current_gen,
        best_fitness=best_fitness,
        avg_fitness=avg_fitness,
        worst_fitness=worst_fitness,
        median_fitness=median_fitness,
        creature_types=creature_types,
        simulation_time_ms=simulation_time_ms,
    )
    db.add(generation)

    # Determine which creatures get frame storage based on config.frame_storage_mode
    sorted_results = sorted(
        zip(genomes, sim_results),
        key=lambda x: x[1]["fitness"],
        reverse=True,
    )
    keep_frames_ids = set()

    if config.frame_storage_mode == "all":
        # Store frames for all creatures
        for genome, _ in sorted_results:
            keep_frames_ids.add(genome["id"])
    elif config.frame_storage_mode == "sparse":
        # Use config values for sparse storage (top N + bottom N + random from middle)
        top_count = config.sparse_top_count
        bottom_count = config.sparse_bottom_count

        # Top N
        for genome, _ in sorted_results[:top_count]:
            keep_frames_ids.add(genome["id"])

        # Bottom N
        for genome, _ in sorted_results[-bottom_count:]:
            keep_frames_ids.add(genome["id"])

        # Random N from middle (use settings.frames_keep_random for middle selection)
        import random
        middle = sorted_results[top_count:-bottom_count] if bottom_count > 0 else sorted_results[top_count:]
        random.shuffle(middle)
        for genome, _ in middle[:settings.frames_keep_random]:
            keep_frames_ids.add(genome["id"])
    # else: frame_storage_mode == "none" -> keep_frames_ids stays empty

    # Create/update creature records and performance records
    for genome, sim_result in zip(genomes, sim_results):
        creature_id = genome["id"]
        survival_streak = genome.get("survivalStreak", genome.get("survival_streak", 0))
        is_survivor = survival_streak > 0 and current_gen > 0

        if is_survivor:
            # Survivor: Update existing creature record
            result = await db.execute(
                select(Creature).where(Creature.id == creature_id)
            )
            creature = result.scalar_one_or_none()
            if creature:
                creature.survival_streak = survival_streak
                # Update genome with new survivalStreak value
                updated_genome = dict(creature.genome)
                updated_genome['survivalStreak'] = survival_streak
                creature.genome = updated_genome
            else:
                # Shouldn't happen, but handle gracefully
                creature = Creature(
                    id=creature_id,
                    run_id=run_id,
                    genome=genome,
                    birth_generation=current_gen,
                    survival_streak=survival_streak,
                    is_elite=False,
                    parent_ids=genome.get("parentIds", genome.get("parent_ids", [])),
                )
                db.add(creature)
        else:
            # New offspring: Create new creature record
            creature = Creature(
                id=creature_id,
                run_id=run_id,
                genome=genome,
                birth_generation=current_gen,
                survival_streak=0,
                is_elite=False,
                parent_ids=genome.get("parentIds", genome.get("parent_ids", [])),
            )
            db.add(creature)

        # Create performance record for this generation
        performance = CreaturePerformance(
            creature_id=creature_id,
            generation=current_gen,
            run_id=run_id,
            fitness=sim_result["fitness"],
            pellets_collected=sim_result["pellets_collected"],
            disqualified=sim_result["disqualified"],
            disqualified_reason=sim_result.get("disqualified_reason"),
        )
        db.add(performance)

        # Store frames if this creature is in the keep set
        if creature_id in keep_frames_ids and sim_result.get("frames"):
            frames_data = zlib.compress(json.dumps(sim_result["frames"]).encode())

            # Convert pellets list to pellet_frames format for storage
            pellet_data = None
            if sim_result.get("pellets"):
                pellet_frames = []
                for p in sim_result["pellets"]:
                    pellet_frames.append({
                        "position": p["position"],
                        "collected_at_frame": p.get("collected_at_frame"),
                        "spawned_at_frame": p.get("spawned_at_frame", 0),
                        "initial_distance": p.get("initial_distance", 5.0),
                    })
                pellet_data = zlib.compress(json.dumps(pellet_frames).encode())

            # Store fitness over time (from backend simulation)
            fitness_over_time_data = None
            if sim_result.get("fitness_over_time"):
                fitness_over_time_data = zlib.compress(json.dumps(sim_result["fitness_over_time"]).encode())

            # Store neural network activations per frame
            activations_data = None
            if sim_result.get("activations_per_frame"):
                activations_data = zlib.compress(json.dumps(sim_result["activations_per_frame"]).encode())

            creature_frame = CreatureFrame(
                creature_id=creature_id,
                generation=current_gen,
                frames_data=frames_data,
                frame_count=sim_result.get("frame_count", 0),
                frame_rate=15,
                pellet_frames=pellet_data,
                fitness_over_time=fitness_over_time_data,
                activations_per_frame=activations_data,
            )
            db.add(creature_frame)

    # Update run
    run.current_generation = current_gen + 1
    run.generation_count = current_gen + 1

    if best_fitness > run.best_fitness:
        run.best_fitness = best_fitness
        # Find the best creature
        best_creature = max(zip(genomes, sim_results), key=lambda x: x[1]["fitness"])
        run.best_creature_id = best_creature[0]["id"]
        run.best_creature_generation = current_gen

    # Update longest survivor tracking
    for genome in genomes:
        streak = genome.get("survivalStreak", genome.get("survival_streak", 0))
        if streak > run.longest_survivor_streak:
            run.longest_survivor_streak = streak
            run.longest_survivor_id = genome["id"]
            run.longest_survivor_generation = current_gen

    await db.commit()

    # Build creature data for frontend display
    creatures_data = []
    for genome, sim_result in zip(genomes, sim_results):
        creature_id = genome["id"]
        creatures_data.append({
            "id": creature_id,
            "genome": genome,
            "fitness": sim_result["fitness"],
            "pellets_collected": sim_result["pellets_collected"],
            "disqualified": sim_result["disqualified"],
            "disqualified_reason": sim_result.get("disqualified_reason"),
            "is_survivor": creature_id in survivor_ids,
            "parent_ids": genome.get("parentIds", genome.get("parent_ids", [])),
            "has_frames": creature_id in keep_frames_ids,
            "survival_streak": genome.get("survivalStreak", genome.get("survival_streak", 0)),
        })

    return {
        "generation": current_gen,
        "best_fitness": best_fitness,
        "avg_fitness": avg_fitness,
        "worst_fitness": worst_fitness,
        "median_fitness": median_fitness,
        "simulation_time_ms": simulation_time_ms,
        "creature_count": len(genomes),
        "creatures": creatures_data,
    }


@router.post("/{run_id}/step")
async def evolution_step(
    run_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Run a single generation of evolution."""
    simulator = SimulatorService()

    result = await run_generation(run_id, db, simulator)
    return result


@router.post("/{run_id}/run")
async def run_evolution(
    run_id: str,
    generations: int,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Start running evolution for N generations in the background."""
    # Verify run exists
    result = await db.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    # Update status
    run.status = "running"
    await db.commit()

    # TODO: Add background task to run generations
    # For now, we'll use WebSocket for real-time updates

    return {"message": f"Started evolution for {generations} generations", "run_id": run_id}


@router.websocket("/{run_id}/ws")
async def evolution_websocket(
    websocket: WebSocket,
    run_id: str,
):
    """WebSocket for real-time evolution updates."""
    await websocket.accept()

    try:
        while True:
            # Wait for commands from client
            data = await websocket.receive_json()
            command = data.get("command")

            if command == "step":
                # Run one generation and send results
                # Note: Would need to create a new db session here
                await websocket.send_json({
                    "type": "generation_complete",
                    "data": {"message": "WebSocket evolution not yet implemented"},
                })

            elif command == "stop":
                await websocket.send_json({"type": "stopped"})
                break

    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})
    finally:
        await websocket.close()
