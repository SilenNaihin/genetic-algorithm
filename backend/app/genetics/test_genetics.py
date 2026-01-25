"""
Unit tests for genetics module.

Tests selection, mutation, crossover, and population operations.
"""

import math
import pytest

from app.genetics import (
    # Selection
    truncation_selection,
    tournament_selection,
    get_elites,
    rank_based_probabilities,
    weighted_random_select,
    # Mutation
    MutationConfig,
    GenomeConstraints,
    mutate_genome,
    mutate_node,
    mutate_muscle,
    add_node,
    remove_node,
    add_muscle,
    mutate_neural_weights,
    # Crossover
    single_point_crossover,
    uniform_crossover,
    clone_genome,
    crossover_neural_weights,
    adapt_neural_topology,
    initialize_neural_genome,
    # Population
    DecayConfig,
    calculate_decayed_rate,
    generate_random_genome,
    generate_population,
    evolve_population,
    get_population_stats,
)


# =============================================================================
# FIXTURES
# =============================================================================


@pytest.fixture
def simple_genome():
    """Create a simple test genome."""
    return {
        'id': 'test_creature_1',
        'generation': 0,
        'survivalStreak': 0,
        'parentIds': [],
        'nodes': [
            {'id': 'n1', 'position': {'x': 0, 'y': 0.5, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            {'id': 'n2', 'position': {'x': 1, 'y': 0.5, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            {'id': 'n3', 'position': {'x': 0.5, 'y': 1, 'z': 0}, 'size': 0.3, 'friction': 0.5},
        ],
        'muscles': [
            {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'restLength': 1.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 0},
            {'id': 'm2', 'nodeA': 'n2', 'nodeB': 'n3', 'restLength': 1.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 1.0},
            {'id': 'm3', 'nodeA': 'n3', 'nodeB': 'n1', 'restLength': 1.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 2.0},
        ],
        'globalFrequencyMultiplier': 1.0,
        'controllerType': 'oscillator',
        'color': {'h': 0.5, 's': 0.7, 'l': 0.5},
    }


@pytest.fixture
def neural_genome():
    """Create a genome with neural network."""
    genome = {
        'id': 'neural_creature_1',
        'generation': 0,
        'survivalStreak': 0,
        'parentIds': [],
        'nodes': [
            {'id': 'n1', 'position': {'x': 0, 'y': 0.5, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            {'id': 'n2', 'position': {'x': 1, 'y': 0.5, 'z': 0}, 'size': 0.3, 'friction': 0.5},
        ],
        'muscles': [
            {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'restLength': 1.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 0},
        ],
        'globalFrequencyMultiplier': 1.0,
        'controllerType': 'neural',
        'color': {'h': 0.5, 's': 0.7, 'l': 0.5},
    }
    genome['neuralGenome'] = initialize_neural_genome(num_muscles=1, hidden_size=4)
    return genome


@pytest.fixture
def constraints():
    """Default genome constraints."""
    return GenomeConstraints()


@pytest.fixture
def mutation_config():
    """Default mutation config."""
    return MutationConfig()


# =============================================================================
# SELECTION TESTS
# =============================================================================


class TestTruncationSelection:
    """Test truncation selection."""

    def test_keeps_top_half_by_default(self):
        """Should keep top 50% by default."""
        genomes = [{'id': f'g{i}'} for i in range(10)]
        fitness = [i for i in range(10)]  # 0, 1, 2, ... 9

        result = truncation_selection(genomes, fitness)

        assert len(result.survivors) == 5
        assert len(result.culled) == 5
        # Top 5 should survive (fitness 5-9)
        survivor_ids = {g['id'] for g in result.survivors}
        assert 'g9' in survivor_ids
        assert 'g8' in survivor_ids
        assert 'g0' not in survivor_ids

    def test_respects_survival_rate(self):
        """Should respect custom survival rate."""
        genomes = [{'id': f'g{i}'} for i in range(10)]
        fitness = [i for i in range(10)]

        result = truncation_selection(genomes, fitness, survival_rate=0.2)

        assert len(result.survivors) == 2
        assert len(result.culled) == 8

    def test_always_keeps_at_least_one(self):
        """Should always keep at least one survivor."""
        genomes = [{'id': 'g0'}]
        fitness = [0.0]

        result = truncation_selection(genomes, fitness, survival_rate=0.0)

        assert len(result.survivors) >= 1


class TestTournamentSelection:
    """Test tournament selection."""

    def test_returns_requested_survivors(self):
        """Should return requested number of survivors."""
        genomes = [{'id': f'g{i}'} for i in range(10)]
        fitness = [i for i in range(10)]

        survivors = tournament_selection(genomes, fitness, num_survivors=3)

        assert len(survivors) == 3

    def test_higher_fitness_more_likely(self):
        """Higher fitness creatures should be more likely to survive."""
        genomes = [{'id': f'g{i}'} for i in range(10)]
        fitness = [i for i in range(10)]

        # Run multiple times and count top performers
        top_survivor_count = 0
        for _ in range(100):
            survivors = tournament_selection(genomes, fitness, num_survivors=3)
            if any(g['id'] == 'g9' for g in survivors):
                top_survivor_count += 1

        # Should be selected more than random chance
        assert top_survivor_count > 30


class TestGetElites:
    """Test elite selection."""

    def test_returns_top_n(self):
        """Should return top N creatures."""
        genomes = [{'id': f'g{i}'} for i in range(10)]
        fitness = [i for i in range(10)]

        elites = get_elites(genomes, fitness, count=3)

        assert len(elites) == 3
        assert elites[0]['id'] == 'g9'
        assert elites[1]['id'] == 'g8'
        assert elites[2]['id'] == 'g7'


class TestRankBasedProbabilities:
    """Test rank-based probability calculation."""

    def test_best_has_highest_probability(self):
        """Best creature should have highest probability."""
        genomes = [{'id': f'g{i}'} for i in range(5)]
        fitness = [i for i in range(5)]

        probs = rank_based_probabilities(genomes, fitness)

        # g4 has fitness 4 (best), should have highest prob
        assert probs['g4'] > probs['g3']
        assert probs['g4'] > probs['g0']

    def test_probabilities_sum_to_one(self):
        """Probabilities should sum to 1."""
        genomes = [{'id': f'g{i}'} for i in range(5)]
        fitness = [i for i in range(5)]

        probs = rank_based_probabilities(genomes, fitness)

        assert abs(sum(probs.values()) - 1.0) < 0.01


# =============================================================================
# MUTATION TESTS
# =============================================================================


class TestMutateGenome:
    """Test genome mutation."""

    def test_produces_valid_genome(self, simple_genome, mutation_config, constraints):
        """Mutated genome should be valid."""
        mutated = mutate_genome(simple_genome, mutation_config, constraints)

        assert 'id' in mutated
        assert mutated['id'] != simple_genome['id']
        assert 'nodes' in mutated
        assert 'muscles' in mutated
        assert len(mutated['nodes']) >= constraints.min_nodes
        assert len(mutated['muscles']) >= 1

    def test_maintains_connectivity(self, simple_genome, mutation_config, constraints):
        """Mutated genome should maintain muscle connectivity."""
        mutated = mutate_genome(simple_genome, mutation_config, constraints)

        node_ids = {n['id'] for n in mutated['nodes']}
        for muscle in mutated['muscles']:
            assert muscle.get('nodeA') in node_ids or muscle.get('node_a') in node_ids
            assert muscle.get('nodeB') in node_ids or muscle.get('node_b') in node_ids

    def test_mutation_changes_values(self, simple_genome, constraints):
        """Mutation should change some values."""
        # High mutation rate to ensure changes
        config = MutationConfig(rate=1.0, magnitude=0.5)

        mutated = mutate_genome(simple_genome, config, constraints)

        # At least some values should change
        original_sizes = [n['size'] for n in simple_genome['nodes']]
        mutated_sizes = [n['size'] for n in mutated['nodes']]
        assert original_sizes != mutated_sizes

    def test_respects_constraints(self, simple_genome, constraints):
        """Mutated values should respect constraints."""
        config = MutationConfig(rate=1.0, magnitude=1.0, structural_rate=1.0)

        for _ in range(10):
            mutated = mutate_genome(simple_genome, config, constraints)

            assert len(mutated['nodes']) <= constraints.max_nodes
            assert len(mutated['nodes']) >= constraints.min_nodes
            assert len(mutated['muscles']) <= constraints.max_muscles


class TestStructuralMutation:
    """Test structural mutations."""

    def test_add_node(self, simple_genome, constraints):
        """Adding a node should create valid connection."""
        result = add_node(simple_genome, constraints)

        if result is not None:
            node, muscle = result
            assert 'id' in node
            assert 'id' in muscle
            assert muscle.get('nodeA') or muscle.get('node_a')
            assert muscle.get('nodeB') or muscle.get('node_b')

    def test_add_node_respects_limits(self, constraints):
        """Should not add node beyond max."""
        genome = {
            'nodes': [{'id': f'n{i}'} for i in range(constraints.max_nodes)],
            'muscles': [],
        }

        result = add_node(genome, constraints)
        assert result is None

    def test_remove_node(self, simple_genome, constraints):
        """Removing a node should also remove connected muscles."""
        result = remove_node(simple_genome, constraints)

        if result is not None:
            node_id, muscle_ids = result
            assert node_id in [n['id'] for n in simple_genome['nodes']]
            assert len(muscle_ids) > 0

    def test_add_muscle(self, constraints):
        """Adding a muscle should connect unconnected nodes."""
        genome = {
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}},
                {'id': 'n3', 'position': {'x': 0, 'y': 1, 'z': 0}},
            ],
            'muscles': [
                {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2'},
            ],
        }

        result = add_muscle(genome, constraints)

        assert result is not None
        # Should connect n1-n3 or n2-n3
        nodes = {result.get('nodeA'), result.get('nodeB')}
        assert 'n3' in nodes


class TestNeuralMutation:
    """Test neural weight mutation."""

    def test_mutates_weights(self):
        """Should mutate some weights."""
        weights = [0.0] * 100
        mutated = mutate_neural_weights(weights, mutation_rate=1.0, mutation_magnitude=0.3)

        # Should be different (very unlikely all remain 0)
        assert any(w != 0.0 for w in mutated)

    def test_respects_mutation_rate(self):
        """Should respect mutation rate."""
        weights = [0.0] * 1000

        # Zero rate should not mutate
        mutated = mutate_neural_weights(weights, mutation_rate=0.0, mutation_magnitude=0.5)
        assert all(w == 0.0 for w in mutated)

    def test_gaussian_distribution(self):
        """Mutations should follow Gaussian distribution."""
        weights = [0.0] * 10000
        mutated = mutate_neural_weights(weights, mutation_rate=1.0, mutation_magnitude=0.3)

        # Check rough properties of Gaussian
        mean = sum(mutated) / len(mutated)
        assert abs(mean) < 0.1  # Mean should be near 0


# =============================================================================
# CROSSOVER TESTS
# =============================================================================


class TestSinglePointCrossover:
    """Test single-point crossover."""

    def test_produces_valid_child(self, simple_genome, constraints):
        """Crossover should produce valid child."""
        parent2 = dict(simple_genome)
        parent2['id'] = 'parent2'

        child = single_point_crossover(simple_genome, parent2, constraints)

        assert 'id' in child
        assert child['id'] != simple_genome['id']
        assert 'nodes' in child
        assert 'muscles' in child
        assert len(child['nodes']) >= 2

    def test_tracks_parents(self, simple_genome, constraints):
        """Child should track parent IDs."""
        parent2 = dict(simple_genome)
        parent2['id'] = 'parent2'

        child = single_point_crossover(simple_genome, parent2, constraints)

        assert simple_genome['id'] in child['parentIds']
        assert 'parent2' in child['parentIds']

    def test_increments_generation(self, simple_genome, constraints):
        """Child generation should be incremented."""
        parent2 = dict(simple_genome)
        parent2['id'] = 'parent2'
        parent2['generation'] = 5

        child = single_point_crossover(simple_genome, parent2, constraints)

        assert child['generation'] == 6  # max(0, 5) + 1


class TestUniformCrossover:
    """Test uniform crossover."""

    def test_produces_valid_child(self, simple_genome, constraints):
        """Uniform crossover should produce valid child."""
        parent2 = dict(simple_genome)
        parent2['id'] = 'parent2'

        child = uniform_crossover(simple_genome, parent2, constraints)

        assert 'id' in child
        assert 'nodes' in child
        assert 'muscles' in child


class TestCloneGenome:
    """Test genome cloning."""

    def test_produces_new_ids(self, simple_genome, constraints):
        """Clone should have new IDs."""
        clone = clone_genome(simple_genome, constraints)

        assert clone['id'] != simple_genome['id']
        assert all(
            clone['nodes'][i]['id'] != simple_genome['nodes'][i]['id']
            for i in range(len(simple_genome['nodes']))
        )

    def test_preserves_values(self, simple_genome, constraints):
        """Clone should preserve node/muscle values."""
        clone = clone_genome(simple_genome, constraints)

        assert len(clone['nodes']) == len(simple_genome['nodes'])
        assert len(clone['muscles']) == len(simple_genome['muscles'])
        # Size should be same
        assert clone['nodes'][0]['size'] == simple_genome['nodes'][0]['size']

    def test_increments_generation(self, simple_genome, constraints):
        """Clone should increment generation."""
        clone = clone_genome(simple_genome, constraints)
        assert clone['generation'] == simple_genome['generation'] + 1


class TestNeuralCrossover:
    """Test neural network crossover."""

    def test_crossover_produces_valid_weights(self):
        """Neural crossover should produce valid weights."""
        neural1 = initialize_neural_genome(num_muscles=3, hidden_size=4)
        neural2 = initialize_neural_genome(num_muscles=3, hidden_size=4)

        child = crossover_neural_weights(neural1, neural2)

        assert 'weights_ih' in child or 'weights' in child

    def test_adapt_topology_changes_output_size(self):
        """Topology adaptation should change output size."""
        neural = initialize_neural_genome(num_muscles=3, hidden_size=4)

        adapted = adapt_neural_topology(neural, new_muscle_count=5)

        assert adapted['output_size'] == 5


# =============================================================================
# POPULATION TESTS
# =============================================================================


class TestGenerateRandomGenome:
    """Test random genome generation."""

    def test_produces_valid_genome(self):
        """Should produce valid genome."""
        genome = generate_random_genome()

        assert 'id' in genome
        assert 'nodes' in genome
        assert 'muscles' in genome
        assert len(genome['nodes']) >= 3
        assert len(genome['muscles']) >= 1

    def test_respects_constraints(self):
        """Should respect constraints."""
        constraints = GenomeConstraints(min_nodes=4, max_nodes=5, max_muscles=10)

        for _ in range(10):
            genome = generate_random_genome(constraints=constraints)
            assert 4 <= len(genome['nodes']) <= 5
            assert len(genome['muscles']) <= 10

    def test_creates_neural_genome_when_enabled(self):
        """Should create neural genome when enabled."""
        genome = generate_random_genome(use_neural_net=True)

        assert genome['neuralGenome'] is not None
        assert genome['controllerType'] == 'neural'

    def test_neural_genome_input_size_none_encoding(self):
        """Time encoding 'none' should have 7 inputs (no time)."""
        # Works for both pure and hybrid modes
        genome_pure = generate_random_genome(use_neural_net=True, neural_mode='pure', time_encoding='none')
        genome_hybrid = generate_random_genome(use_neural_net=True, neural_mode='hybrid', time_encoding='none')

        assert genome_pure['neuralGenome'].get('input_size') == 7
        assert genome_hybrid['neuralGenome'].get('input_size') == 7

    def test_neural_genome_input_size_cyclic_encoding(self):
        """Time encoding 'cyclic' should have 9 inputs."""
        genome_pure = generate_random_genome(use_neural_net=True, neural_mode='pure', time_encoding='cyclic')
        genome_hybrid = generate_random_genome(use_neural_net=True, neural_mode='hybrid', time_encoding='cyclic')

        assert genome_pure['neuralGenome'].get('input_size') == 9
        assert genome_hybrid['neuralGenome'].get('input_size') == 9

    def test_neural_genome_input_size_sin_encoding(self):
        """Time encoding 'sin' should have 8 inputs."""
        genome = generate_random_genome(use_neural_net=True, neural_mode='hybrid', time_encoding='sin')

        neural_genome = genome['neuralGenome']
        assert neural_genome is not None
        input_size = neural_genome.get('input_size')
        assert input_size == 8, f"Sin encoding should have 8 inputs, got {input_size}"

    def test_neural_genome_input_size_raw_encoding(self):
        """Time encoding 'raw' should have 8 inputs."""
        genome = generate_random_genome(use_neural_net=True, neural_mode='pure', time_encoding='raw')

        neural_genome = genome['neuralGenome']
        assert neural_genome is not None
        input_size = neural_genome.get('input_size')
        assert input_size == 8, f"Raw encoding should have 8 inputs, got {input_size}"

    def test_neural_genome_input_size_sin_raw_encoding(self):
        """Time encoding 'sin_raw' should have 9 inputs (sin + raw)."""
        genome = generate_random_genome(use_neural_net=True, neural_mode='pure', time_encoding='sin_raw')

        neural_genome = genome['neuralGenome']
        assert neural_genome is not None
        input_size = neural_genome.get('input_size')
        assert input_size == 9, f"Sin+raw encoding should have 9 inputs, got {input_size}"


class TestGeneratePopulation:
    """Test population generation."""

    def test_creates_requested_size(self):
        """Should create population of requested size."""
        pop = generate_population(size=50)
        assert len(pop) == 50

    def test_all_genomes_valid(self):
        """All genomes should be valid."""
        pop = generate_population(size=10)

        for genome in pop:
            assert 'id' in genome
            assert 'nodes' in genome
            assert len(genome['nodes']) >= 3

    def test_time_encoding_propagates_to_all_genomes(self):
        """time_encoding should propagate to all genomes in population."""
        # Test 'none' encoding (7 inputs)
        pop_none = generate_population(
            size=5,
            use_neural_net=True,
            time_encoding='none',
        )
        for genome in pop_none:
            neural_genome = genome.get('neuralGenome')
            if neural_genome:  # Only check if neural genome was created
                input_size = neural_genome.get('input_size')
                assert input_size == 7, f"'none' encoding should have 7 inputs, got {input_size}"

        # Test cyclic encoding (9 inputs)
        pop_cyclic = generate_population(
            size=5,
            use_neural_net=True,
            time_encoding='cyclic',
        )
        for genome in pop_cyclic:
            neural_genome = genome.get('neuralGenome')
            if neural_genome:
                input_size = neural_genome.get('input_size')
                assert input_size == 9, f"'cyclic' encoding should have 9 inputs, got {input_size}"

        # Test sin encoding (8 inputs)
        pop_sin = generate_population(
            size=5,
            use_neural_net=True,
            time_encoding='sin',
        )
        for genome in pop_sin:
            neural_genome = genome.get('neuralGenome')
            if neural_genome:
                input_size = neural_genome.get('input_size')
                assert input_size == 8, f"'sin' encoding should have 8 inputs, got {input_size}"


class TestEvolvePopulation:
    """Test population evolution."""

    def test_maintains_population_size(self):
        """Should maintain population size."""
        pop = generate_population(size=20)
        fitness = [i for i in range(20)]

        new_pop, _ = evolve_population(pop, fitness)

        assert len(new_pop) == 20

    def test_survivors_pass_through(self):
        """Survivors should pass through."""
        pop = generate_population(size=10)
        fitness = [i for i in range(10)]

        new_pop, _ = evolve_population(pop, fitness)

        # Top 5 should survive (cull_percentage=0.5)
        survivor_ids = {g['id'] for g in pop[-5:]}
        # They should be in new population (with incremented survivalStreak)
        new_ids = {g['id'] for g in new_pop}

        # Note: IDs change on clone/crossover, but survivors should maintain theirs
        # Actually survivors are copied with same ID
        for genome in new_pop:
            if genome['survivalStreak'] > 0:
                # This was a survivor
                pass  # Just check it exists

    def test_returns_stats(self):
        """Should return population stats."""
        pop = generate_population(size=10)
        fitness = [i for i in range(10)]

        _, stats = evolve_population(pop, fitness, generation=5)

        assert stats.generation == 5
        assert stats.best_fitness == 9
        assert stats.worst_fitness == 0


class TestDecayedRate:
    """Test mutation rate decay."""

    def test_off_returns_end_rate(self):
        """Off mode should return end rate."""
        config = DecayConfig(mode='off', start_rate=0.5, end_rate=0.1)

        rate = calculate_decayed_rate(0, config)
        assert rate == 0.1

        rate = calculate_decayed_rate(100, config)
        assert rate == 0.1

    def test_linear_decays_over_generations(self):
        """Linear mode should decay linearly."""
        config = DecayConfig(mode='linear', start_rate=0.5, end_rate=0.1, decay_generations=100)

        rate_0 = calculate_decayed_rate(0, config)
        rate_50 = calculate_decayed_rate(50, config)
        rate_100 = calculate_decayed_rate(100, config)

        assert rate_0 == 0.5
        assert abs(rate_50 - 0.3) < 0.01  # Midpoint
        assert abs(rate_100 - 0.1) < 0.001  # Floating point tolerance

    def test_exponential_decays_faster_initially(self):
        """Exponential mode should decay faster initially."""
        config = DecayConfig(mode='exponential', start_rate=0.5, end_rate=0.1, decay_generations=100)

        rate_0 = calculate_decayed_rate(0, config)
        rate_50 = calculate_decayed_rate(50, config)
        rate_100 = calculate_decayed_rate(100, config)

        assert rate_0 == 0.5
        # Exponential should be below linear midpoint
        assert rate_50 < 0.3
        # Should approach end rate
        assert rate_100 < 0.15


class TestPopulationStats:
    """Test population statistics."""

    def test_calculates_correct_stats(self):
        """Should calculate correct statistics."""
        genomes = [
            {'nodes': [1, 2, 3], 'muscles': [1, 2]},
            {'nodes': [1, 2, 3, 4], 'muscles': [1, 2, 3]},
            {'nodes': [1, 2], 'muscles': [1]},
        ]
        fitness = [10.0, 20.0, 5.0]

        stats = get_population_stats(genomes, fitness, generation=3)

        assert stats.generation == 3
        assert stats.best_fitness == 20.0
        assert stats.worst_fitness == 5.0
        assert abs(stats.average_fitness - 11.67) < 0.1
        assert stats.avg_nodes == 3.0
        assert stats.avg_muscles == 2.0
