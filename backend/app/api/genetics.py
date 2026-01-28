"""
Genetics API endpoints.

Provides endpoints for evolution operations: generate initial population,
evolve to next generation, and population statistics.
"""

from fastapi import APIRouter

from app.schemas.genetics import (
    EvolveRequest,
    EvolveResponse,
    GeneratePopulationRequest,
    GeneratePopulationResponse,
    PopulationStats,
    EvolutionConfig,
    MutationConfig,
    SelectionConfig,
    DecayConfig,
)
from app.schemas.genome import CreatureGenome
from app.genetics import (
    generate_population,
    evolve_population,
    get_population_stats,
    GenomeConstraints,
    EvolutionConfig as InternalEvolutionConfig,
)

router = APIRouter()


@router.post("/generate", response_model=GeneratePopulationResponse)
def generate_initial_population(request: GeneratePopulationRequest):
    """
    Generate an initial population of random creatures.

    Creates random genomes with the specified constraints.
    Each genome will have neural network weights if use_neural_net is True.
    """
    # Convert API constraints to internal format
    constraints = GenomeConstraints(
        min_nodes=request.constraints.minNodes,
        max_nodes=request.constraints.maxNodes,
        min_muscles=request.constraints.minMuscles,
        max_muscles=request.constraints.maxMuscles,
        spawn_radius=request.constraints.spawnRadius,
        min_size=request.constraints.minSize,
        max_size=request.constraints.maxSize,
        min_stiffness=request.constraints.minStiffness,
        max_stiffness=request.constraints.maxStiffness,
        min_frequency=request.constraints.minFrequency,
        max_frequency=request.constraints.maxFrequency,
        max_amplitude=request.constraints.maxAmplitude,
    )

    # Derive use_neat from neural_mode
    use_neat = request.neural_mode == 'neat'

    # Default bias_mode to 'bias_node' for NEAT if not explicitly set
    bias_mode = request.bias_mode
    if use_neat and bias_mode == 'node':
        bias_mode = 'bias_node'  # NEAT prefers bias node approach

    genomes = generate_population(
        size=request.size,
        constraints=constraints,
        use_neural_net=request.use_neural_net,
        neural_hidden_size=request.neural_hidden_size,
        neural_output_bias=request.neural_output_bias,
        neural_mode=request.neural_mode,
        time_encoding=request.time_encoding,
        use_proprioception=request.use_proprioception,
        proprioception_inputs=request.proprioception_inputs,
        use_neat=use_neat,
        bias_mode=bias_mode,
        neat_initial_connectivity=request.neat_initial_connectivity,
    )

    return GeneratePopulationResponse(
        genomes=genomes,
        count=len(genomes),
    )


@router.post("/evolve", response_model=EvolveResponse)
def evolve_one_generation(request: EvolveRequest):
    """
    Evolve a population to the next generation.

    Takes current genomes with their fitness scores and produces:
    - Survivors (top performers kept unchanged, survivalStreak incremented)
    - New creatures (via crossover or mutation from survivors)

    The crossover_rate determines probability of crossover vs mutation.
    Mutation rates can decay over generations if decay is configured.
    """
    # Convert genomes to dicts (use field names, not aliases, for internal processing)
    genomes = [g.model_dump() for g in request.genomes]

    # Build internal config
    config = InternalEvolutionConfig(
        population_size=request.config.population_size,
        elite_count=request.config.elite_count,
        cull_percentage=request.config.cull_percentage,
        crossover_rate=request.config.crossover_rate,
        use_mutation=request.config.use_mutation,
        use_crossover=request.config.use_crossover,
        mutation_rate=request.config.mutation.rate,
        mutation_magnitude=request.config.mutation.magnitude,
        structural_rate=request.config.mutation.structural_rate,
        weight_mutation_rate=request.config.mutation.neural_rate,
        weight_mutation_magnitude=request.config.mutation.neural_magnitude,
        weight_mutation_decay=request.config.decay.mode,
        use_neural_net=request.config.use_neural_net,
        neural_hidden_size=8,  # Default
        neural_output_bias=request.config.neural_output_bias,
        min_nodes=request.config.constraints.minNodes,
        max_nodes=request.config.constraints.maxNodes,
        min_muscles=request.config.constraints.minMuscles,
        max_muscles=request.config.constraints.maxMuscles,
        spawn_radius=request.config.constraints.spawnRadius,
        min_size=request.config.constraints.minSize,
        max_size=request.config.constraints.maxSize,
        min_stiffness=request.config.constraints.minStiffness,
        max_stiffness=request.config.constraints.maxStiffness,
        min_frequency=request.config.constraints.minFrequency,
        max_frequency=request.config.constraints.maxFrequency,
        max_amplitude=request.config.constraints.maxAmplitude,
    )

    new_genomes, stats = evolve_population(
        genomes=genomes,
        fitness_scores=request.fitness_scores,
        config=config,
        generation=request.generation,
    )

    # Convert dicts to CreatureGenome models for proper serialization
    genome_models = [CreatureGenome.model_validate(g) for g in new_genomes]

    return EvolveResponse(
        genomes=genome_models,
        generation=request.generation + 1,
        stats=PopulationStats(
            generation=stats.generation,
            best_fitness=stats.best_fitness,
            average_fitness=stats.average_fitness,
            worst_fitness=stats.worst_fitness,
            avg_nodes=stats.avg_nodes,
            avg_muscles=stats.avg_muscles,
        ),
    )


@router.post("/stats", response_model=PopulationStats)
def get_stats(genomes: list[dict], fitness_scores: list[float], generation: int = 0):
    """
    Calculate population statistics.

    Returns best, average, and worst fitness, plus average node/muscle counts.
    """
    stats = get_population_stats(genomes, fitness_scores, generation)

    return PopulationStats(
        generation=stats.generation,
        best_fitness=stats.best_fitness,
        average_fitness=stats.average_fitness,
        worst_fitness=stats.worst_fitness,
        avg_nodes=stats.avg_nodes,
        avg_muscles=stats.avg_muscles,
    )
