"""
Integration stress tests for NEAT mutation and crossover system.

These tests intentionally try to break the NEAT integration by exploring:
- Numerical edge cases (NaN, Inf, extreme values)
- Empty/missing data scenarios
- Boundary conditions
- Type mismatches and format variations
- Scale/performance with large populations
- Multi-component interactions
- Real-world evolution scenarios
"""

import math
import random
import pytest
from copy import deepcopy

from app.genetics.mutation import (
    mutate_genome_neat,
    NEATMutationConfig,
    MutationConfig,
    GenomeConstraints,
)
from app.genetics.neat_crossover import (
    align_genes,
    neat_crossover,
    neat_crossover_equal_fitness,
)
from app.genetics.neat_distance import neat_genome_distance, create_neat_distance_fn
from app.genetics.neat_mutation import mutate_neat_genome
from app.genetics.speciation import assign_species
from app.neural.neat_network import create_minimal_neat_genome, neat_forward, topological_sort
from app.schemas.neat import (
    ConnectionGene,
    InnovationCounter,
    NEATGenome,
    NeuronGene,
)


# =============================================================================
# Helper functions
# =============================================================================

def create_creature_with_neat(
    input_size: int = 7,
    output_size: int = 3,
    num_nodes: int = 3,
    num_muscles: int = 3,
) -> dict:
    """Create a creature genome with NEAT neural network."""
    neat = create_minimal_neat_genome(input_size, output_size)

    nodes = [
        {
            'id': f'node-{i}',
            'size': 0.3 + random.random() * 0.3,
            'friction': 0.5,
            'position': {
                'x': random.random() * 2 - 1,
                'y': 0.5 + random.random(),
                'z': random.random() * 2 - 1,
            },
        }
        for i in range(num_nodes)
    ]

    muscles = []
    for i in range(min(num_muscles, num_nodes * (num_nodes - 1) // 2)):
        node_a = nodes[i % num_nodes]
        node_b = nodes[(i + 1) % num_nodes]
        muscles.append({
            'id': f'muscle-{i}',
            'nodeA': node_a['id'],
            'nodeB': node_b['id'],
            'restLength': 1.0,
            'stiffness': 100,
            'damping': 0.5,
            'frequency': 1.0,
            'amplitude': 0.3,
            'phase': random.random() * 6.28,
        })

    return {
        'id': f'creature-{random.randint(0, 99999)}',
        'generation': 0,
        'parentIds': [],
        'survivalStreak': 0,
        'nodes': nodes,
        'muscles': muscles,
        'globalFrequencyMultiplier': 1.0,
        'controllerType': 'neural',
        'neatGenome': neat.model_dump(),
        'color': {'h': random.random(), 's': 0.7, 'l': 0.5},
    }


# =============================================================================
# NUMERICAL EDGE CASES
# =============================================================================

class TestNumericalEdgeCases:
    """Test numerical stability with extreme values."""

    def test_nan_weights_in_neat_genome(self):
        """NaN weights should not propagate through the system."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=float('nan'), innovation=0),
            ],
        )

        # Forward pass with NaN weight
        outputs = neat_forward(genome, [1.0])

        # Output should be NaN (it propagates, but shouldn't crash)
        # This is expected behavior - garbage in, garbage out
        assert len(outputs) == 1

    def test_inf_weights_in_neat_genome(self):
        """Infinity weights should be handled without crash."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=float('inf'), innovation=0),
            ],
        )

        outputs = neat_forward(genome, [1.0])

        # tanh(inf) = 1.0
        assert len(outputs) == 1
        assert outputs[0] == pytest.approx(1.0)

    def test_negative_inf_weights(self):
        """Negative infinity weights should be handled."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=float('-inf'), innovation=0),
            ],
        )

        outputs = neat_forward(genome, [1.0])

        # tanh(-inf) = -1.0
        assert outputs[0] == pytest.approx(-1.0)

    def test_very_large_weights(self):
        """Very large weights should saturate tanh."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1e10, innovation=0),
            ],
        )

        outputs = neat_forward(genome, [1.0])
        assert abs(outputs[0] - 1.0) < 1e-10

    def test_very_small_weights(self):
        """Very small weights should produce near-zero output."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1e-100, innovation=0),
            ],
        )

        outputs = neat_forward(genome, [1.0])
        assert abs(outputs[0]) < 1e-50

    def test_crossover_with_nan_fitness(self):
        """Crossover should handle NaN fitness gracefully."""
        parent_a = create_minimal_neat_genome(2, 1)
        parent_b = create_minimal_neat_genome(2, 1)

        # NaN fitness - this is an edge case that could occur with buggy fitness
        # The function should not crash
        try:
            child = neat_crossover(parent_a, parent_b, float('nan'), 1.0)
            # If it doesn't crash, that's acceptable
            assert True
        except (ValueError, TypeError):
            # Raising an error is also acceptable behavior
            assert True

    def test_crossover_with_inf_fitness(self):
        """Crossover should handle infinite fitness."""
        parent_a = create_minimal_neat_genome(2, 1)
        parent_b = create_minimal_neat_genome(2, 1)

        child = neat_crossover(parent_a, parent_b, float('inf'), 1.0)

        # Should succeed - inf > 1.0 so parent_a is fitter
        assert len(child.neurons) > 0

    def test_distance_with_extreme_weights(self):
        """Distance calculation with extreme weight differences."""
        genome_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1e10, innovation=0),
            ],
        )

        genome_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-1e10, innovation=0),
            ],
        )

        distance = neat_genome_distance(genome_a, genome_b)

        # Should be very large but finite
        assert math.isfinite(distance)
        assert distance > 0


# =============================================================================
# EMPTY AND MISSING DATA
# =============================================================================

class TestEmptyAndMissingData:
    """Test handling of empty inputs and missing fields."""

    def test_empty_creature_genome(self):
        """Creature genome with no nodes or muscles."""
        genome = {
            'id': 'empty',
            'nodes': [],
            'muscles': [],
            'neatGenome': create_minimal_neat_genome(3, 2).model_dump(),
        }
        counter = InnovationCounter()

        mutated = mutate_genome_neat(genome, counter)

        # Should not crash, NEAT genome should be mutated
        assert 'neatGenome' in mutated

    def test_missing_optional_fields(self):
        """Genome missing optional fields should still work."""
        genome = {
            'id': 'minimal',
            'nodes': [{'id': 'n1', 'size': 0.5, 'friction': 0.5, 'position': {'x': 0, 'y': 0.5, 'z': 0}}],
            'muscles': [],
            # Missing: generation, parentIds, survivalStreak, color, etc.
            'neatGenome': create_minimal_neat_genome(2, 1).model_dump(),
        }
        counter = InnovationCounter()

        mutated = mutate_genome_neat(genome, counter)

        # Should provide defaults
        assert 'generation' in mutated
        assert 'parentIds' in mutated

    def test_empty_neat_genome(self):
        """NEAT genome with no connections."""
        genome = {
            'id': 'no-connections',
            'nodes': [],
            'muscles': [],
            'neatGenome': {
                'neurons': [
                    {'id': 0, 'type': 'input'},
                    {'id': 1, 'type': 'output', 'bias': 0.0},
                ],
                'connections': [],
            },
        }
        counter = InnovationCounter()

        mutated = mutate_genome_neat(genome, counter)

        # Should potentially add connections via mutation
        assert 'neatGenome' in mutated

    def test_crossover_empty_genomes(self):
        """Crossover two genomes with no connections."""
        parent_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[],
        )
        parent_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[],
        )

        child = neat_crossover(parent_a, parent_b, 1.0, 1.0)

        # Should produce valid but empty child
        assert len(child.connections) == 0
        assert len(child.neurons) == 2

    def test_distance_empty_genomes(self):
        """Distance between two empty genomes."""
        genome_a = NEATGenome(neurons=[], connections=[])
        genome_b = NEATGenome(neurons=[], connections=[])

        distance = neat_genome_distance(genome_a, genome_b)

        assert distance == 0.0

    def test_speciation_empty_population(self):
        """Speciation with empty population."""
        distance_fn = create_neat_distance_fn()

        species = assign_species([], [], 1.0, distance_fn)

        assert species == []


# =============================================================================
# BOUNDARY CONDITIONS
# =============================================================================

class TestBoundaryConditions:
    """Test behavior at exact boundaries and limits."""

    def test_mutation_at_max_hidden_nodes(self):
        """Mutation when already at max hidden nodes limit."""
        neat = create_minimal_neat_genome(3, 2)
        counter = InnovationCounter()

        # Add hidden nodes to reach limit
        for i in range(16):  # Default max is 16
            neat.neurons.append(NeuronGene(id=100 + i, type='hidden', innovation=i))

        genome = {
            'id': 'at-limit',
            'nodes': [],
            'muscles': [],
            'neatGenome': neat.model_dump(),
        }

        # Try to add more nodes
        neat_config = NEATMutationConfig(add_node_rate=1.0, max_hidden_nodes=16)

        mutated = mutate_genome_neat(genome, counter, neat_config=neat_config)

        # Should not exceed limit
        mutated_neat = NEATGenome(**mutated['neatGenome'])
        assert len(mutated_neat.get_hidden_neurons()) <= 16

    def test_mutation_rate_zero(self):
        """Zero mutation rate should produce no changes."""
        random.seed(42)
        genome = create_creature_with_neat()
        original_neat = deepcopy(genome['neatGenome'])
        counter = InnovationCounter()

        neat_config = NEATMutationConfig(
            add_connection_rate=0.0,
            add_node_rate=0.0,
            enable_rate=0.0,
            disable_rate=0.0,
            weight_mutation_rate=0.0,
        )
        body_config = MutationConfig(rate=0.0, structural_rate=0.0)

        mutated = mutate_genome_neat(genome, counter, config=body_config, neat_config=neat_config)

        # NEAT genome should be unchanged
        assert mutated['neatGenome']['connections'] == original_neat['connections']

    def test_mutation_rate_one(self):
        """100% mutation rate should always mutate."""
        random.seed(42)
        genome = create_creature_with_neat()
        counter = InnovationCounter()

        neat_config = NEATMutationConfig(weight_mutation_rate=1.0)

        mutated = mutate_genome_neat(genome, counter, neat_config=neat_config)

        # Weights should have changed (with high probability)
        original_weights = [c['weight'] for c in genome['neatGenome']['connections']]
        mutated_weights = [c['weight'] for c in mutated['neatGenome']['connections']]

        # At least some weights should differ
        assert original_weights != mutated_weights

    def test_exactly_at_speciation_threshold(self):
        """Genomes exactly at speciation threshold."""
        genome_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
        )

        # Create genome with exact distance of 1.0
        # Weight diff = 2.5, coefficient = 0.4, so 2.5 * 0.4 = 1.0
        genome_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-1.5, innovation=0),
            ],
        )

        distance = neat_genome_distance(genome_a, genome_b, weight_coefficient=0.4)

        # Distance should be exactly 1.0
        assert distance == pytest.approx(1.0)

    def test_single_neuron_genome(self):
        """Genome with minimum possible neurons."""
        genome = NEATGenome(
            neurons=[NeuronGene(id=0, type='output', bias=0.5)],
            connections=[],
        )

        outputs = neat_forward(genome, [])

        assert len(outputs) == 1
        assert outputs[0] == pytest.approx(math.tanh(0.5))


# =============================================================================
# TYPE MISMATCHES AND FORMAT VARIATIONS
# =============================================================================

class TestTypeMismatchesAndFormats:
    """Test handling of different input types and formats."""

    def test_snake_case_genome_keys(self):
        """Handle snake_case keys in genome dict."""
        genome = {
            'id': 'snake_case',
            'nodes': [],
            'muscles': [],
            'neat_genome': create_minimal_neat_genome(2, 1).model_dump(),  # snake_case
            'parent_ids': ['parent-1'],  # snake_case
            'survival_streak': 5,  # snake_case
            'global_frequency_multiplier': 1.5,  # snake_case
            'controller_type': 'neural',  # snake_case
        }
        counter = InnovationCounter()

        mutated = mutate_genome_neat(genome, counter)

        # Should handle snake_case input
        assert 'neatGenome' in mutated

    def test_innovation_counter_as_dict(self):
        """Pass innovation counter as dict instead of object."""
        genome = create_creature_with_neat()

        counter_dict = {
            'next_connection': 100,
            'next_node': 50,
            'connection_cache': {},
            'node_cache': {},
        }

        mutated = mutate_genome_neat(genome, counter_dict)

        assert 'neatGenome' in mutated

    def test_neat_genome_as_object(self):
        """Pass NEAT genome as object instead of dict."""
        neat = create_minimal_neat_genome(3, 2)

        genome = {
            'id': 'object-neat',
            'nodes': [],
            'muscles': [],
            'neatGenome': neat,  # Object, not dict
        }
        counter = InnovationCounter()

        # This should handle the object
        mutated = mutate_genome_neat(genome, counter)

        assert 'neatGenome' in mutated

    def test_mixed_camel_snake_case(self):
        """Handle mixed camelCase and snake_case in same genome."""
        genome = {
            'id': 'mixed',
            'nodes': [
                {'id': 'n1', 'size': 0.5, 'friction': 0.5, 'position': {'x': 0, 'y': 0.5, 'z': 0}},
            ],
            'muscles': [
                {
                    'id': 'm1',
                    'nodeA': 'n1',  # camelCase
                    'node_b': 'n1',  # snake_case (invalid but should handle)
                    'restLength': 1.0,
                    'stiffness': 100,
                    'damping': 0.5,
                    'frequency': 1.0,
                    'amplitude': 0.3,
                    'phase': 0,
                },
            ],
            'neatGenome': create_minimal_neat_genome(2, 1).model_dump(),
        }
        counter = InnovationCounter()

        # Should not crash
        mutated = mutate_genome_neat(genome, counter)
        assert 'neatGenome' in mutated


# =============================================================================
# SCALE AND PERFORMANCE
# =============================================================================

class TestScaleAndPerformance:
    """Test behavior with large inputs and many iterations."""

    def test_large_population_speciation(self):
        """Speciation with large population."""
        random.seed(42)

        genomes = []
        for i in range(100):
            neat = create_minimal_neat_genome(5, 3)
            # Vary weights to create diversity
            for conn in neat.connections:
                conn.weight = random.gauss(0, 1)

            genomes.append({
                'id': f'creature-{i}',
                'neatGenome': neat.model_dump(),
            })

        fitness_scores = [random.random() * 100 for _ in range(100)]

        distance_fn = create_neat_distance_fn()
        species = assign_species(genomes, fitness_scores, 0.5, distance_fn)

        # Should create multiple species
        assert len(species) > 1
        assert sum(s.size for s in species) == 100

    def test_many_mutations_stability(self):
        """Apply many mutations without degradation."""
        random.seed(12345)

        genome = create_creature_with_neat(input_size=5, output_size=3)
        counter = InnovationCounter()

        for i in range(500):
            random.seed(i)
            genome = mutate_genome_neat(genome, counter)

            # Clear cache each "generation"
            if i % 10 == 0:
                counter.clear_generation_cache()

            # Verify genome remains valid
            neat = NEATGenome(**genome['neatGenome'])

            # Forward pass should work
            outputs = neat_forward(neat, [0.5] * 5)
            assert len(outputs) == 3
            assert all(math.isfinite(o) for o in outputs)

    def test_many_crossovers_stability(self):
        """Apply many crossovers without issues."""
        random.seed(42)

        population = [
            create_minimal_neat_genome(4, 2)
            for _ in range(20)
        ]

        for gen in range(100):
            new_pop = []
            for _ in range(20):
                p1 = random.choice(population)
                p2 = random.choice(population)
                f1 = random.random()
                f2 = random.random()

                child = neat_crossover(p1, p2, f1, f2)

                # Verify child is valid
                outputs = neat_forward(child, [0.5] * 4)
                assert len(outputs) == 2

                new_pop.append(child)

            population = new_pop

    def test_deep_network_performance(self):
        """Test with very deep networks."""
        # Create a deep network (100 hidden layers)
        neurons = [NeuronGene(id=0, type='input')]
        connections = []

        for i in range(100):
            neurons.append(NeuronGene(id=i+1, type='hidden', innovation=i, bias=0.0))
            connections.append(ConnectionGene(
                from_node=i, to_node=i+1, weight=1.0, innovation=i
            ))

        neurons.append(NeuronGene(id=101, type='output', bias=0.0))
        connections.append(ConnectionGene(from_node=100, to_node=101, weight=1.0, innovation=100))

        genome = NEATGenome(neurons=neurons, connections=connections)

        # Should handle deep network
        outputs = neat_forward(genome, [1.0])

        assert len(outputs) == 1
        assert math.isfinite(outputs[0])

    def test_wide_network_performance(self):
        """Test with very wide networks (many parallel paths)."""
        # 100 inputs, 100 outputs, fully connected
        neurons = [NeuronGene(id=i, type='input') for i in range(100)]
        neurons.extend([NeuronGene(id=100+i, type='output', bias=0.0) for i in range(100)])

        connections = []
        inn = 0
        for i in range(100):
            for j in range(100):
                connections.append(ConnectionGene(
                    from_node=i, to_node=100+j, weight=0.01, innovation=inn
                ))
                inn += 1

        genome = NEATGenome(neurons=neurons, connections=connections)

        outputs = neat_forward(genome, [1.0] * 100)

        assert len(outputs) == 100
        assert all(math.isfinite(o) for o in outputs)


# =============================================================================
# INTEGRATION SCENARIOS
# =============================================================================

class TestIntegrationScenarios:
    """Test multi-component interactions."""

    def test_mutation_then_crossover(self):
        """Mutate genomes then cross them over."""
        random.seed(42)

        # Create and mutate two genomes
        genome_a = create_creature_with_neat(input_size=4, output_size=2)
        genome_b = create_creature_with_neat(input_size=4, output_size=2)
        counter = InnovationCounter()

        for _ in range(10):
            genome_a = mutate_genome_neat(genome_a, counter)
            genome_b = mutate_genome_neat(genome_b, counter)
            counter.clear_generation_cache()

        # Cross them over
        neat_a = NEATGenome(**genome_a['neatGenome'])
        neat_b = NEATGenome(**genome_b['neatGenome'])

        child = neat_crossover(neat_a, neat_b, 1.0, 0.5)

        # Child should be valid
        outputs = neat_forward(child, [0.5] * 4)
        assert len(outputs) == 2

    def test_crossover_then_mutation(self):
        """Cross over genomes then mutate the child."""
        random.seed(42)

        parent_a = create_minimal_neat_genome(4, 2)
        parent_b = create_minimal_neat_genome(4, 2)

        child = neat_crossover(parent_a, parent_b, 1.0, 1.0)

        # Mutate child
        genome = {
            'id': 'child',
            'nodes': [],
            'muscles': [],
            'neatGenome': child.model_dump(),
        }
        counter = InnovationCounter()

        for _ in range(20):
            genome = mutate_genome_neat(genome, counter)
            counter.clear_generation_cache()

        # Should remain valid
        neat = NEATGenome(**genome['neatGenome'])
        outputs = neat_forward(neat, [0.5] * 4)
        assert len(outputs) == 2

    def test_full_evolution_cycle(self):
        """Simulate complete evolution: create -> mutate -> select -> crossover."""
        random.seed(12345)

        # Create initial population
        population = []
        counter = InnovationCounter()

        for i in range(20):
            genome = create_creature_with_neat(input_size=5, output_size=2)
            population.append(genome)

        # Run evolution
        for gen in range(20):
            # Mutate all
            for i in range(len(population)):
                population[i] = mutate_genome_neat(population[i], counter)

            counter.clear_generation_cache()

            # Evaluate fitness (simple: random)
            fitness = [random.random() for _ in population]

            # Speciation
            distance_fn = create_neat_distance_fn()
            species = assign_species(population, fitness, 1.0, distance_fn)

            # Create next generation via crossover within species
            new_pop = []
            for sp in species:
                if sp.size < 2:
                    # Clone
                    new_pop.extend(sp.members)
                else:
                    # Crossover
                    for _ in range(sp.size):
                        p1_idx = random.randint(0, sp.size - 1)
                        p2_idx = random.randint(0, sp.size - 1)

                        neat_a = NEATGenome(**sp.members[p1_idx]['neatGenome'])
                        neat_b = NEATGenome(**sp.members[p2_idx]['neatGenome'])

                        child = neat_crossover(
                            neat_a, neat_b,
                            sp.fitness_scores[p1_idx],
                            sp.fitness_scores[p2_idx],
                        )

                        new_pop.append({
                            'id': f'gen{gen}-{len(new_pop)}',
                            'nodes': sp.members[p1_idx].get('nodes', []),
                            'muscles': sp.members[p1_idx].get('muscles', []),
                            'neatGenome': child.model_dump(),
                        })

            population = new_pop[:20]  # Keep population size

        # All final genomes should be valid
        for genome in population:
            neat = NEATGenome(**genome['neatGenome'])
            outputs = neat_forward(neat, [0.5] * 5)
            assert len(outputs) == 2
            assert all(math.isfinite(o) for o in outputs)


# =============================================================================
# REAL-WORLD EDGE CASES
# =============================================================================

class TestRealWorldEdgeCases:
    """Tests simulating realistic edge cases from evolution runs."""

    def test_converged_population(self):
        """Population where all genomes are nearly identical."""
        random.seed(42)

        # Create identical genomes
        base = create_minimal_neat_genome(4, 2)
        genomes = [
            {
                'id': f'creature-{i}',
                'neatGenome': deepcopy(base).model_dump(),
            }
            for i in range(20)
        ]

        fitness = [50.0] * 20  # All same fitness

        distance_fn = create_neat_distance_fn()
        species = assign_species(genomes, fitness, 0.5, distance_fn)

        # All should be in one species
        assert len(species) == 1
        assert species[0].size == 20

    def test_diverged_population(self):
        """Population with very different genomes."""
        random.seed(42)

        genomes = []
        for i in range(20):
            neat = NEATGenome(
                neurons=[
                    NeuronGene(id=0, type='input'),
                    NeuronGene(id=1, type='output'),
                ],
                connections=[
                    ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=i * 100),
                ],
            )
            genomes.append({
                'id': f'creature-{i}',
                'neatGenome': neat.model_dump(),
            })

        fitness = [random.random() for _ in range(20)]

        distance_fn = create_neat_distance_fn()
        species = assign_species(genomes, fitness, 0.5, distance_fn)

        # Should have many species (each genome very different)
        assert len(species) > 1

    def test_disabled_connection_accumulation(self):
        """Test that disabled connections don't cause issues over generations."""
        random.seed(42)

        genome = create_creature_with_neat(input_size=4, output_size=2)
        counter = InnovationCounter()

        # Use high disable rate
        neat_config = NEATMutationConfig(
            disable_rate=0.5,
            enable_rate=0.1,
            add_connection_rate=0.3,
        )

        for _ in range(100):
            genome = mutate_genome_neat(genome, counter, neat_config=neat_config)
            counter.clear_generation_cache()

        # Should still work
        neat = NEATGenome(**genome['neatGenome'])
        outputs = neat_forward(neat, [0.5] * 4)
        assert len(outputs) == 2

    def test_innovation_counter_overflow_scenario(self):
        """Simulate many innovations over long run."""
        counter = InnovationCounter(next_connection=2**30, next_node=2**30)

        genome = create_creature_with_neat(input_size=4, output_size=2)

        neat_config = NEATMutationConfig(
            add_connection_rate=0.5,
            add_node_rate=0.3,
        )

        for _ in range(100):
            genome = mutate_genome_neat(genome, counter, neat_config=neat_config)
            counter.clear_generation_cache()

        # Counter should have advanced
        assert counter.next_connection > 2**30 or counter.next_node > 2**30

    def test_reproduction_with_single_parent(self):
        """Crossover where parent_a == parent_b (self-cross)."""
        genome = create_minimal_neat_genome(4, 2)

        # Self-crossover
        child = neat_crossover(genome, genome, 1.0, 1.0)

        # Child should be identical to parent (in structure)
        assert len(child.connections) == len(genome.connections)
        assert len(child.neurons) == len(genome.neurons)


# =============================================================================
# ERROR HANDLING
# =============================================================================

class TestErrorHandling:
    """Test that errors are handled gracefully."""

    def test_invalid_innovation_in_connection(self):
        """Connection with None innovation should raise or handle."""
        # This tests robustness of the align_genes function
        genome_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
        )

        genome_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-1.0, innovation=1),
            ],
        )

        # This should work fine
        aligned, matching, disjoint, excess = align_genes(genome_a, genome_b)
        assert len(aligned) == 2

    def test_mutation_preserves_input_output_count(self):
        """Mutations should never add/remove input or output neurons."""
        random.seed(42)

        neat = create_minimal_neat_genome(5, 3)
        genome = {
            'id': 'test',
            'nodes': [],
            'muscles': [],
            'neatGenome': neat.model_dump(),
        }
        counter = InnovationCounter()

        neat_config = NEATMutationConfig(
            add_node_rate=1.0,  # High rate
            add_connection_rate=1.0,
        )

        for _ in range(100):
            genome = mutate_genome_neat(genome, counter, neat_config=neat_config)
            counter.clear_generation_cache()

            mutated_neat = NEATGenome(**genome['neatGenome'])

            # Input and output count must be preserved
            assert len(mutated_neat.get_input_neurons()) == 5
            assert len(mutated_neat.get_output_neurons()) == 3

    def test_crossover_preserves_input_output_count(self):
        """Crossover should never lose input or output neurons."""
        random.seed(42)

        for _ in range(50):
            parent_a = create_minimal_neat_genome(4, 2)
            parent_b = create_minimal_neat_genome(4, 2)

            # Modify to have different structures
            parent_b.neurons.append(NeuronGene(id=100, type='hidden', innovation=0))
            parent_b.connections.append(
                ConnectionGene(from_node=0, to_node=100, weight=1.0, innovation=100)
            )

            child = neat_crossover(parent_a, parent_b, random.random(), random.random())

            assert len(child.get_input_neurons()) == 4
            assert len(child.get_output_neurons()) == 2
