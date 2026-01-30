"""
In-memory evolution runner for NAS.

Runs evolution without database overhead for maximum speed.
Uses PyTorchSimulator + genetics directly.
"""

import sys
import time
from dataclasses import dataclass, field
from typing import Any, Callable

# Add backend to path (relative to this file)
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent / 'backend'))

import torch

from app.services.pytorch_simulator import PyTorchSimulator
from app.genetics.population import (
    generate_population,
    evolve_population,
    GenomeConstraints,
)
from app.schemas.simulation import SimulationConfig
from app.schemas.neat import InnovationCounter


@dataclass
class GenerationStats:
    """Stats for a single generation."""
    generation: int
    best_fitness: float
    avg_fitness: float
    median_fitness: float
    worst_fitness: float
    simulation_time_ms: int
    evolution_time_ms: int = 0


@dataclass
class RunResult:
    """Result of a complete evolution run."""
    config: dict[str, Any]
    seed: int
    generations: list[GenerationStats]
    best_genome: dict[str, Any] | None = None
    best_fitness: float = 0.0
    total_time_s: float = 0.0
    creatures_per_second: float = 0.0


def run_evolution(
    config: dict[str, Any],
    generations: int,
    seed: int = 42,
    device: torch.device | None = None,
    callback: Callable[[GenerationStats], None] | None = None,
    verbose: bool = True,
    stagnation_limit: int = 0,
) -> RunResult:
    """
    Run a complete evolution loop in memory.

    Args:
        config: Simulation configuration dict
        generations: Number of generations to run
        seed: Random seed for reproducibility
        device: PyTorch device (auto-detect if None)
        callback: Called after each generation with stats
        verbose: Print progress to console
        stagnation_limit: Stop early if no improvement for N generations (0 = disabled)

    Returns:
        RunResult with all generation stats and best genome
    """
    import random
    import numpy as np

    # Set seeds for reproducibility
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

    # Initialize simulator
    simulator = PyTorchSimulator(device=device)

    # Convert config to SimulationConfig for validation
    sim_config = SimulationConfig(**config)

    # Prepare evolution config
    use_neat = sim_config.neural_mode == 'neat'
    innovation_counter = InnovationCounter() if use_neat else None

    # Generate initial population
    constraints = GenomeConstraints(
        min_nodes=sim_config.min_nodes,
        max_nodes=sim_config.max_nodes,
        max_muscles=sim_config.max_muscles,
        max_frequency=sim_config.max_allowed_frequency,
    )

    genomes = generate_population(
        size=sim_config.population_size,
        constraints=constraints,
        use_neural_net=sim_config.use_neural_net,
        neural_hidden_size=sim_config.neural_hidden_size,
        neural_output_bias=sim_config.neural_output_bias,
        neural_mode=sim_config.neural_mode,
        time_encoding=sim_config.time_encoding,
        use_proprioception=sim_config.use_proprioception,
        proprioception_inputs=sim_config.proprioception_inputs,
        use_neat=use_neat,
        innovation_counter=innovation_counter,
        bias_mode=sim_config.bias_mode,
        neat_initial_connectivity=sim_config.neat_initial_connectivity,
    )

    # Evolution config for genetics
    evolution_config = {
        'population_size': sim_config.population_size,
        'elite_count': sim_config.elite_count,
        'cull_percentage': sim_config.cull_percentage,
        'selection_method': sim_config.selection_method,
        'tournament_size': sim_config.tournament_size,
        'crossover_rate': sim_config.crossover_rate,
        'use_crossover': sim_config.use_crossover,
        'mutation_rate': sim_config.mutation_rate,
        'mutation_magnitude': sim_config.mutation_magnitude,
        'weight_mutation_rate': sim_config.weight_mutation_rate,
        'weight_mutation_magnitude': sim_config.weight_mutation_magnitude,
        'weight_mutation_decay': sim_config.weight_mutation_decay,
        'use_neural_net': sim_config.use_neural_net,
        'neural_hidden_size': sim_config.neural_hidden_size,
        'neural_output_bias': sim_config.neural_output_bias,
        'min_nodes': sim_config.min_nodes,
        'max_nodes': sim_config.max_nodes,
        'max_muscles': sim_config.max_muscles,
        'max_frequency': sim_config.max_allowed_frequency,
        'use_fitness_sharing': sim_config.use_fitness_sharing,
        'sharing_radius': sim_config.sharing_radius,
        'compatibility_threshold': sim_config.compatibility_threshold,
        'min_species_size': sim_config.min_species_size,
        'use_neat': use_neat,
        'neat_add_connection_rate': sim_config.neat_add_connection_rate,
        'neat_add_node_rate': sim_config.neat_add_node_rate,
        'neat_enable_rate': sim_config.neat_enable_rate,
        'neat_disable_rate': sim_config.neat_disable_rate,
        'neat_excess_coefficient': sim_config.neat_excess_coefficient,
        'neat_disjoint_coefficient': sim_config.neat_disjoint_coefficient,
        'neat_weight_coefficient': sim_config.neat_weight_coefficient,
        'neat_max_hidden_nodes': sim_config.neat_max_hidden_nodes,
    }

    # Simulation config for batch simulation
    batch_config = {
        'simulation_duration': sim_config.simulation_duration,
        'frame_storage_mode': 'none',  # No frames for speed
        'frame_rate': 15,
        'pellet_count': sim_config.pellet_count,
        'arena_size': sim_config.arena_size,
        'max_allowed_frequency': sim_config.max_allowed_frequency,
        'fitness_pellet_points': sim_config.fitness_pellet_points,
        'fitness_progress_max': sim_config.fitness_progress_max,
        'fitness_distance_per_unit': sim_config.fitness_distance_per_unit,
        'fitness_distance_traveled_max': sim_config.fitness_distance_traveled_max,
        'fitness_regression_penalty': sim_config.fitness_regression_penalty,
        'fitness_efficiency_penalty': sim_config.fitness_efficiency_penalty,
        'neural_dead_zone': sim_config.neural_dead_zone,
        'use_neural_net': sim_config.use_neural_net,
        'neural_mode': sim_config.neural_mode,
        'neural_hidden_size': sim_config.neural_hidden_size,
        'time_encoding': sim_config.time_encoding,
        'use_proprioception': sim_config.use_proprioception,
        'proprioception_inputs': sim_config.proprioception_inputs,
        'neat_max_hidden_nodes': sim_config.neat_max_hidden_nodes,
        'max_muscles': sim_config.max_muscles,
    }

    # Run evolution
    gen_stats: list[GenerationStats] = []
    best_genome = None
    best_fitness = float('-inf')

    # Early stopping: track thresholds for both best and avg fitness
    # Improvement must exceed 5% to reset stagnation counter
    best_threshold = float('-inf')
    avg_threshold = float('-inf')
    gens_since_improvement = 0
    improvement_margin = 1.05  # 5% improvement required

    total_start = time.time()

    for gen in range(generations):
        # Simulate
        sim_start = time.time()
        results = simulator.simulate_batch(genomes, batch_config)
        sim_time_ms = int((time.time() - sim_start) * 1000)

        # Extract fitness scores
        fitness_scores = [r.fitness for r in results]
        sorted_fitness = sorted(fitness_scores, reverse=True)
        current_avg = sum(fitness_scores) / len(fitness_scores)

        # Stats
        stats = GenerationStats(
            generation=gen,
            best_fitness=sorted_fitness[0],
            avg_fitness=current_avg,
            median_fitness=sorted_fitness[len(sorted_fitness) // 2],
            worst_fitness=sorted_fitness[-1],
            simulation_time_ms=sim_time_ms,
        )

        # Track overall best genome
        if sorted_fitness[0] > best_fitness:
            best_fitness = sorted_fitness[0]
            best_idx = fitness_scores.index(sorted_fitness[0])
            best_genome = genomes[best_idx].copy()

        # Early stopping: check if EITHER best or avg improved by >5%
        improved = False
        if sorted_fitness[0] > best_threshold * improvement_margin:
            best_threshold = sorted_fitness[0]
            improved = True
        if current_avg > avg_threshold * improvement_margin:
            avg_threshold = current_avg
            improved = True

        if improved:
            gens_since_improvement = 0
        else:
            gens_since_improvement += 1

        # Evolve (if not last generation)
        if gen < generations - 1:
            evo_start = time.time()
            genomes, _ = evolve_population(
                genomes=genomes,
                fitness_scores=fitness_scores,
                config=evolution_config,
                generation=gen,
                innovation_counter=innovation_counter,
            )
            stats.evolution_time_ms = int((time.time() - evo_start) * 1000)

        gen_stats.append(stats)

        # Callback
        if callback:
            callback(stats)

        # Console output
        if verbose:
            print(f"  gen {gen+1:3d}/{generations} | best: {stats.best_fitness:6.1f} | avg: {stats.avg_fitness:6.1f} | {stats.simulation_time_ms}ms")

        # Early stopping check
        if stagnation_limit > 0 and gens_since_improvement >= stagnation_limit:
            if verbose:
                print(f"  Early stopping: no improvement for {stagnation_limit} generations")
            break

    total_time = time.time() - total_start
    actual_generations = len(gen_stats)
    total_creatures = actual_generations * sim_config.population_size

    return RunResult(
        config=config,
        seed=seed,
        generations=gen_stats,
        best_genome=best_genome,
        best_fitness=best_fitness,
        total_time_s=total_time,
        creatures_per_second=total_creatures / total_time if total_time > 0 else 0,
    )


def run_multi_seed(
    config: dict[str, Any],
    generations: int,
    seeds: list[int],
    device: torch.device | None = None,
    callback: Callable[[int, GenerationStats], None] | None = None,
    verbose: bool = True,
) -> list[RunResult]:
    """
    Run evolution with multiple seeds for statistical significance.

    Args:
        config: Simulation configuration dict
        generations: Number of generations per seed
        seeds: List of random seeds
        device: PyTorch device
        callback: Called with (seed_idx, stats) after each generation
        verbose: Print progress

    Returns:
        List of RunResults, one per seed
    """
    results = []

    for i, seed in enumerate(seeds):
        if verbose:
            print(f"\n[seed {i+1}/{len(seeds)}] Running with seed={seed}")

        def seed_callback(stats: GenerationStats):
            if callback:
                callback(i, stats)

        result = run_evolution(
            config=config,
            generations=generations,
            seed=seed,
            device=device,
            callback=seed_callback,
            verbose=verbose,
        )
        results.append(result)

    return results


def get_aggregate_stats(results: list[RunResult]) -> dict[str, Any]:
    """
    Aggregate stats across multiple seeds.

    Returns:
        Dict with mean, std, min, max for key metrics
    """
    import numpy as np

    best_fitnesses = [r.best_fitness for r in results]
    total_times = [r.total_time_s for r in results]

    # Get final generation stats
    final_avgs = [r.generations[-1].avg_fitness for r in results]

    return {
        'best_fitness': {
            'mean': float(np.mean(best_fitnesses)),
            'std': float(np.std(best_fitnesses)),
            'min': float(np.min(best_fitnesses)),
            'max': float(np.max(best_fitnesses)),
        },
        'final_avg_fitness': {
            'mean': float(np.mean(final_avgs)),
            'std': float(np.std(final_avgs)),
        },
        'total_time_s': {
            'mean': float(np.mean(total_times)),
            'std': float(np.std(total_times)),
        },
        'seeds': len(results),
    }


def run_multi_seed_batched(
    config: dict[str, Any],
    generations: int,
    seeds: list[int],
    device: torch.device | None = None,
    callback: Callable[[int, GenerationStats], None] | None = None,
    verbose: bool = True,
) -> list[RunResult]:
    """
    Run evolution with multiple seeds, batching all seeds together for simulation.

    This combines all seeds' populations into a single batch for simulation,
    maximizing GPU/Numba utilization, then splits results for independent evolution.

    Args:
        config: Simulation configuration dict
        generations: Number of generations per seed
        seeds: List of random seeds
        device: PyTorch device
        callback: Called with (seed_idx, stats) after each generation
        verbose: Print progress

    Returns:
        List of RunResults, one per seed
    """
    import random
    import numpy as np

    num_seeds = len(seeds)

    # Initialize simulator once
    simulator = PyTorchSimulator(device=device)

    # Convert config to SimulationConfig
    sim_config = SimulationConfig(**config)
    pop_size = sim_config.population_size

    # Prepare evolution config (same as run_evolution)
    use_neat = sim_config.neural_mode == 'neat'

    evolution_config = {
        'population_size': sim_config.population_size,
        'elite_count': sim_config.elite_count,
        'cull_percentage': sim_config.cull_percentage,
        'selection_method': sim_config.selection_method,
        'tournament_size': sim_config.tournament_size,
        'crossover_rate': sim_config.crossover_rate,
        'use_crossover': sim_config.use_crossover,
        'mutation_rate': sim_config.mutation_rate,
        'mutation_magnitude': sim_config.mutation_magnitude,
        'weight_mutation_rate': sim_config.weight_mutation_rate,
        'weight_mutation_magnitude': sim_config.weight_mutation_magnitude,
        'weight_mutation_decay': sim_config.weight_mutation_decay,
        'use_neural_net': sim_config.use_neural_net,
        'neural_hidden_size': sim_config.neural_hidden_size,
        'neural_output_bias': sim_config.neural_output_bias,
        'min_nodes': sim_config.min_nodes,
        'max_nodes': sim_config.max_nodes,
        'max_muscles': sim_config.max_muscles,
        'max_frequency': sim_config.max_allowed_frequency,
        'use_fitness_sharing': sim_config.use_fitness_sharing,
        'sharing_radius': sim_config.sharing_radius,
        'compatibility_threshold': sim_config.compatibility_threshold,
        'min_species_size': sim_config.min_species_size,
        'use_neat': use_neat,
        'neat_add_connection_rate': sim_config.neat_add_connection_rate,
        'neat_add_node_rate': sim_config.neat_add_node_rate,
        'neat_enable_rate': sim_config.neat_enable_rate,
        'neat_disable_rate': sim_config.neat_disable_rate,
        'neat_excess_coefficient': sim_config.neat_excess_coefficient,
        'neat_disjoint_coefficient': sim_config.neat_disjoint_coefficient,
        'neat_weight_coefficient': sim_config.neat_weight_coefficient,
        'neat_max_hidden_nodes': sim_config.neat_max_hidden_nodes,
    }

    batch_config = {
        'simulation_duration': sim_config.simulation_duration,
        'frame_storage_mode': 'none',
        'frame_rate': 15,
        'pellet_count': sim_config.pellet_count,
        'arena_size': sim_config.arena_size,
        'max_allowed_frequency': sim_config.max_allowed_frequency,
        'fitness_pellet_points': sim_config.fitness_pellet_points,
        'fitness_progress_max': sim_config.fitness_progress_max,
        'fitness_distance_per_unit': sim_config.fitness_distance_per_unit,
        'fitness_distance_traveled_max': sim_config.fitness_distance_traveled_max,
        'fitness_regression_penalty': sim_config.fitness_regression_penalty,
        'fitness_efficiency_penalty': sim_config.fitness_efficiency_penalty,
        'neural_dead_zone': sim_config.neural_dead_zone,
        'use_neural_net': sim_config.use_neural_net,
        'neural_mode': sim_config.neural_mode,
        'neural_hidden_size': sim_config.neural_hidden_size,
        'time_encoding': sim_config.time_encoding,
        'use_proprioception': sim_config.use_proprioception,
        'proprioception_inputs': sim_config.proprioception_inputs,
        'neat_max_hidden_nodes': sim_config.neat_max_hidden_nodes,
        'max_muscles': sim_config.max_muscles,
    }

    # Initialize populations for each seed
    populations: list[list[dict]] = []
    innovation_counters: list[InnovationCounter | None] = []

    constraints = GenomeConstraints(
        min_nodes=sim_config.min_nodes,
        max_nodes=sim_config.max_nodes,
        max_muscles=sim_config.max_muscles,
        max_frequency=sim_config.max_allowed_frequency,
    )

    for seed in seeds:
        random.seed(seed)
        np.random.seed(seed)
        torch.manual_seed(seed)

        innovation_counter = InnovationCounter() if use_neat else None
        innovation_counters.append(innovation_counter)

        genomes = generate_population(
            size=pop_size,
            constraints=constraints,
            use_neural_net=sim_config.use_neural_net,
            neural_hidden_size=sim_config.neural_hidden_size,
            neural_output_bias=sim_config.neural_output_bias,
            neural_mode=sim_config.neural_mode,
            time_encoding=sim_config.time_encoding,
            use_proprioception=sim_config.use_proprioception,
            proprioception_inputs=sim_config.proprioception_inputs,
            use_neat=use_neat,
            innovation_counter=innovation_counter,
            bias_mode=sim_config.bias_mode,
            neat_initial_connectivity=sim_config.neat_initial_connectivity,
        )
        populations.append(genomes)

    # Track results per seed
    gen_stats_per_seed: list[list[GenerationStats]] = [[] for _ in seeds]
    best_genomes: list[dict | None] = [None] * num_seeds
    best_fitnesses: list[float] = [float('-inf')] * num_seeds

    total_start = time.time()

    for gen in range(generations):
        # Combine all populations into single batch
        combined_genomes = []
        for pop in populations:
            combined_genomes.extend(pop)

        # Single batched simulation
        sim_start = time.time()
        all_results = simulator.simulate_batch(combined_genomes, batch_config)
        sim_time_ms = int((time.time() - sim_start) * 1000)

        # Split results and evolve each seed independently
        evo_start = time.time()
        for seed_idx in range(num_seeds):
            start_idx = seed_idx * pop_size
            end_idx = start_idx + pop_size

            seed_results = all_results[start_idx:end_idx]
            fitness_scores = [r.fitness for r in seed_results]
            sorted_fitness = sorted(fitness_scores, reverse=True)

            # Stats for this seed
            stats = GenerationStats(
                generation=gen,
                best_fitness=sorted_fitness[0],
                avg_fitness=sum(fitness_scores) / len(fitness_scores),
                median_fitness=sorted_fitness[len(sorted_fitness) // 2],
                worst_fitness=sorted_fitness[-1],
                simulation_time_ms=sim_time_ms // num_seeds,  # Amortized
            )

            # Track best
            if sorted_fitness[0] > best_fitnesses[seed_idx]:
                best_fitnesses[seed_idx] = sorted_fitness[0]
                best_idx = fitness_scores.index(sorted_fitness[0])
                best_genomes[seed_idx] = populations[seed_idx][best_idx].copy()

            # Evolve (if not last generation)
            if gen < generations - 1:
                populations[seed_idx], _ = evolve_population(
                    genomes=populations[seed_idx],
                    fitness_scores=fitness_scores,
                    config=evolution_config,
                    generation=gen,
                    innovation_counter=innovation_counters[seed_idx],
                )

            gen_stats_per_seed[seed_idx].append(stats)

            if callback:
                callback(seed_idx, stats)

        evo_time_ms = int((time.time() - evo_start) * 1000)

        # Update evolution time in stats
        for seed_idx in range(num_seeds):
            gen_stats_per_seed[seed_idx][-1].evolution_time_ms = evo_time_ms // num_seeds

        if verbose:
            # Print aggregate stats
            avg_best = sum(s[-1].best_fitness for s in gen_stats_per_seed) / num_seeds
            print(f"  gen {gen+1:3d}/{generations} | avg_best: {avg_best:6.1f} | sim: {sim_time_ms}ms | evo: {evo_time_ms}ms")

    total_time = time.time() - total_start
    total_creatures = generations * pop_size * num_seeds

    # Build results
    results = []
    for seed_idx, seed in enumerate(seeds):
        results.append(RunResult(
            config=config,
            seed=seed,
            generations=gen_stats_per_seed[seed_idx],
            best_genome=best_genomes[seed_idx],
            best_fitness=best_fitnesses[seed_idx],
            total_time_s=total_time / num_seeds,  # Amortized per seed
            creatures_per_second=total_creatures / total_time if total_time > 0 else 0,
        ))

    return results


def run_multi_seed_pipelined(
    config: dict[str, Any],
    generations: int,
    seeds: list[int],
    device: torch.device | None = None,
    callback: Callable[[int, GenerationStats], None] | None = None,
    verbose: bool = True,
) -> list[RunResult]:
    """
    Run evolution with pipelining: overlap simulation N+1 with evolution N.

    Uses threading to run simulation and evolution in parallel where possible.

    Args:
        config: Simulation configuration dict
        generations: Number of generations per seed
        seeds: List of random seeds
        device: PyTorch device
        callback: Called with (seed_idx, stats) after each generation
        verbose: Print progress

    Returns:
        List of RunResults, one per seed
    """
    import random
    import numpy as np
    from concurrent.futures import ThreadPoolExecutor

    num_seeds = len(seeds)

    # Initialize simulator once
    simulator = PyTorchSimulator(device=device)

    # Convert config to SimulationConfig
    sim_config = SimulationConfig(**config)
    pop_size = sim_config.population_size

    use_neat = sim_config.neural_mode == 'neat'

    evolution_config = {
        'population_size': sim_config.population_size,
        'elite_count': sim_config.elite_count,
        'cull_percentage': sim_config.cull_percentage,
        'selection_method': sim_config.selection_method,
        'tournament_size': sim_config.tournament_size,
        'crossover_rate': sim_config.crossover_rate,
        'use_crossover': sim_config.use_crossover,
        'mutation_rate': sim_config.mutation_rate,
        'mutation_magnitude': sim_config.mutation_magnitude,
        'weight_mutation_rate': sim_config.weight_mutation_rate,
        'weight_mutation_magnitude': sim_config.weight_mutation_magnitude,
        'weight_mutation_decay': sim_config.weight_mutation_decay,
        'use_neural_net': sim_config.use_neural_net,
        'neural_hidden_size': sim_config.neural_hidden_size,
        'neural_output_bias': sim_config.neural_output_bias,
        'min_nodes': sim_config.min_nodes,
        'max_nodes': sim_config.max_nodes,
        'max_muscles': sim_config.max_muscles,
        'max_frequency': sim_config.max_allowed_frequency,
        'use_fitness_sharing': sim_config.use_fitness_sharing,
        'sharing_radius': sim_config.sharing_radius,
        'compatibility_threshold': sim_config.compatibility_threshold,
        'min_species_size': sim_config.min_species_size,
        'use_neat': use_neat,
        'neat_add_connection_rate': sim_config.neat_add_connection_rate,
        'neat_add_node_rate': sim_config.neat_add_node_rate,
        'neat_enable_rate': sim_config.neat_enable_rate,
        'neat_disable_rate': sim_config.neat_disable_rate,
        'neat_excess_coefficient': sim_config.neat_excess_coefficient,
        'neat_disjoint_coefficient': sim_config.neat_disjoint_coefficient,
        'neat_weight_coefficient': sim_config.neat_weight_coefficient,
        'neat_max_hidden_nodes': sim_config.neat_max_hidden_nodes,
    }

    batch_config = {
        'simulation_duration': sim_config.simulation_duration,
        'frame_storage_mode': 'none',
        'frame_rate': 15,
        'pellet_count': sim_config.pellet_count,
        'arena_size': sim_config.arena_size,
        'max_allowed_frequency': sim_config.max_allowed_frequency,
        'fitness_pellet_points': sim_config.fitness_pellet_points,
        'fitness_progress_max': sim_config.fitness_progress_max,
        'fitness_distance_per_unit': sim_config.fitness_distance_per_unit,
        'fitness_distance_traveled_max': sim_config.fitness_distance_traveled_max,
        'fitness_regression_penalty': sim_config.fitness_regression_penalty,
        'fitness_efficiency_penalty': sim_config.fitness_efficiency_penalty,
        'neural_dead_zone': sim_config.neural_dead_zone,
        'use_neural_net': sim_config.use_neural_net,
        'neural_mode': sim_config.neural_mode,
        'neural_hidden_size': sim_config.neural_hidden_size,
        'time_encoding': sim_config.time_encoding,
        'use_proprioception': sim_config.use_proprioception,
        'proprioception_inputs': sim_config.proprioception_inputs,
        'neat_max_hidden_nodes': sim_config.neat_max_hidden_nodes,
        'max_muscles': sim_config.max_muscles,
    }

    # Initialize populations for each seed
    populations: list[list[dict]] = []
    innovation_counters: list[InnovationCounter | None] = []

    constraints = GenomeConstraints(
        min_nodes=sim_config.min_nodes,
        max_nodes=sim_config.max_nodes,
        max_muscles=sim_config.max_muscles,
        max_frequency=sim_config.max_allowed_frequency,
    )

    for seed in seeds:
        random.seed(seed)
        np.random.seed(seed)
        torch.manual_seed(seed)

        innovation_counter = InnovationCounter() if use_neat else None
        innovation_counters.append(innovation_counter)

        genomes = generate_population(
            size=pop_size,
            constraints=constraints,
            use_neural_net=sim_config.use_neural_net,
            neural_hidden_size=sim_config.neural_hidden_size,
            neural_output_bias=sim_config.neural_output_bias,
            neural_mode=sim_config.neural_mode,
            time_encoding=sim_config.time_encoding,
            use_proprioception=sim_config.use_proprioception,
            proprioception_inputs=sim_config.proprioception_inputs,
            use_neat=use_neat,
            innovation_counter=innovation_counter,
            bias_mode=sim_config.bias_mode,
            neat_initial_connectivity=sim_config.neat_initial_connectivity,
        )
        populations.append(genomes)

    # Track results per seed
    gen_stats_per_seed: list[list[GenerationStats]] = [[] for _ in seeds]
    best_genomes: list[dict | None] = [None] * num_seeds
    best_fitnesses: list[float] = [float('-inf')] * num_seeds

    total_start = time.time()

    # Pending evolution tasks from previous generation
    pending_evolution = None
    pending_fitness_scores = None
    pending_gen = -1

    def do_evolution(gen: int, fitness_scores_per_seed: list[list[float]]):
        """Evolve all seeds based on fitness scores."""
        for seed_idx in range(num_seeds):
            if gen < generations - 1:
                populations[seed_idx], _ = evolve_population(
                    genomes=populations[seed_idx],
                    fitness_scores=fitness_scores_per_seed[seed_idx],
                    config=evolution_config,
                    generation=gen,
                    innovation_counter=innovation_counters[seed_idx],
                )

    with ThreadPoolExecutor(max_workers=1) as executor:
        for gen in range(generations):
            # Wait for previous evolution to complete before using populations
            if pending_evolution is not None:
                pending_evolution.result()

            # Combine all populations into single batch
            combined_genomes = []
            for pop in populations:
                combined_genomes.extend(pop)

            # Simulate current generation
            sim_start = time.time()
            all_results = simulator.simulate_batch(combined_genomes, batch_config)
            sim_time_ms = int((time.time() - sim_start) * 1000)

            # Extract fitness scores for all seeds
            fitness_scores_per_seed = []
            for seed_idx in range(num_seeds):
                start_idx = seed_idx * pop_size
                end_idx = start_idx + pop_size
                seed_results = all_results[start_idx:end_idx]
                fitness_scores = [r.fitness for r in seed_results]
                fitness_scores_per_seed.append(fitness_scores)

                sorted_fitness = sorted(fitness_scores, reverse=True)

                # Stats for this seed
                stats = GenerationStats(
                    generation=gen,
                    best_fitness=sorted_fitness[0],
                    avg_fitness=sum(fitness_scores) / len(fitness_scores),
                    median_fitness=sorted_fitness[len(sorted_fitness) // 2],
                    worst_fitness=sorted_fitness[-1],
                    simulation_time_ms=sim_time_ms // num_seeds,
                )

                # Track best
                if sorted_fitness[0] > best_fitnesses[seed_idx]:
                    best_fitnesses[seed_idx] = sorted_fitness[0]
                    best_idx = fitness_scores.index(sorted_fitness[0])
                    best_genomes[seed_idx] = populations[seed_idx][best_idx].copy()

                gen_stats_per_seed[seed_idx].append(stats)

                if callback:
                    callback(seed_idx, stats)

            # Start evolution in background (overlaps with next simulation)
            if gen < generations - 1:
                pending_evolution = executor.submit(do_evolution, gen, fitness_scores_per_seed)

            if verbose:
                avg_best = sum(s[-1].best_fitness for s in gen_stats_per_seed) / num_seeds
                print(f"  gen {gen+1:3d}/{generations} | avg_best: {avg_best:6.1f} | sim: {sim_time_ms}ms")

    total_time = time.time() - total_start
    total_creatures = generations * pop_size * num_seeds

    # Build results
    results = []
    for seed_idx, seed in enumerate(seeds):
        results.append(RunResult(
            config=config,
            seed=seed,
            generations=gen_stats_per_seed[seed_idx],
            best_genome=best_genomes[seed_idx],
            best_fitness=best_fitnesses[seed_idx],
            total_time_s=total_time / num_seeds,
            creatures_per_second=total_creatures / total_time if total_time > 0 else 0,
        ))

    return results


def run_parallel_configs(
    configs: list[tuple[str, dict[str, Any]]],
    generations: int,
    seeds: list[int],
    devices: list[str] | None = None,
    verbose: bool = True,
) -> dict[str, list[RunResult]]:
    """
    Run multiple configs in parallel across GPUs using multiprocessing.

    Args:
        configs: List of (config_name, config_dict) tuples
        generations: Number of generations per run
        seeds: List of random seeds
        devices: List of device strings ('cuda:0', 'cuda:1'). Auto-detect if None.
        verbose: Print progress

    Returns:
        Dict mapping config_name to list of RunResults
    """
    import multiprocessing as mp
    from concurrent.futures import ProcessPoolExecutor, as_completed

    # Auto-detect GPUs
    if devices is None:
        if torch.cuda.is_available():
            devices = [f'cuda:{i}' for i in range(torch.cuda.device_count())]
        else:
            devices = ['cpu']

    if verbose:
        print(f"Running {len(configs)} configs across {len(devices)} devices")

    # Create work items: (config_name, config, seed, device)
    work_items = []
    for i, (config_name, config) in enumerate(configs):
        for seed in seeds:
            device = devices[i % len(devices)]  # Round-robin device assignment
            work_items.append((config_name, config, seed, device, generations))

    results_by_config: dict[str, list[RunResult]] = {name: [] for name, _ in configs}

    # Run sequentially (multiprocessing with CUDA is complex)
    # For true parallelism, use separate processes via CLI
    for config_name, config, seed, device, gens in work_items:
        if verbose:
            print(f"  Running {config_name} seed={seed} on {device}")

        result = run_evolution(
            config=config,
            generations=gens,
            seed=seed,
            device=torch.device(device),
            verbose=False,
        )
        results_by_config[config_name].append(result)

    return results_by_config
