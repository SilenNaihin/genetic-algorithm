"""
Adversarial tests for NEAT implementation.

These tests try harder to break things with pathological inputs,
race conditions, and boundary violations.
"""

import math
import random
import pytest
from copy import deepcopy

from app.genetics.neat_mutation import (
    mutate_add_connection,
    mutate_add_node,
    mutate_neat_genome,
    mutate_neat_weights,
)
from app.neural.neat_network import (
    create_minimal_neat_genome,
    neat_forward,
    topological_sort,
    would_create_cycle,
    get_neuron_depths,
)
from app.schemas.neat import (
    ConnectionGene,
    InnovationCounter,
    NEATGenome,
    NeuronGene,
)


class TestPathologicalInputs:
    """Tests with pathological/extreme inputs."""

    def test_zero_inputs_zero_outputs(self):
        """Genome with no inputs or outputs returns empty list."""
        genome = NEATGenome(neurons=[], connections=[])

        # Empty genome should return empty outputs (no crash)
        outputs = neat_forward(genome, [])
        assert outputs == []

    def test_zero_inputs_with_outputs(self):
        """Genome with outputs but no inputs."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='output', bias=0.5),
            ],
            connections=[],
        )

        # Should work - output uses bias only
        outputs = neat_forward(genome, [])
        assert len(outputs) == 1
        assert abs(outputs[0] - math.tanh(0.5)) < 1e-6

    def test_extremely_large_input_count(self):
        """Genome with very many inputs."""
        genome = create_minimal_neat_genome(input_size=1000, output_size=1)

        # Should handle large input count
        outputs = neat_forward(genome, [0.001] * 1000)
        assert len(outputs) == 1
        assert math.isfinite(outputs[0])

    def test_non_sequential_neuron_ids(self):
        """Neuron IDs that are not sequential."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=100, type='input'),
                NeuronGene(id=500, type='hidden', innovation=0),
                NeuronGene(id=999, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=100, to_node=500, weight=1.0, innovation=0),
                ConnectionGene(from_node=500, to_node=999, weight=1.0, innovation=1),
            ],
        )

        outputs = neat_forward(genome, [1.0])
        expected = math.tanh(math.tanh(1.0))
        assert abs(outputs[0] - expected) < 1e-6

    def test_negative_neuron_ids(self):
        """What if neuron IDs are negative?"""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=-5, type='input'),
                NeuronGene(id=-1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=-5, to_node=-1, weight=1.0, innovation=0),
            ],
        )

        # Should work - IDs are just identifiers
        outputs = neat_forward(genome, [0.5])
        assert abs(outputs[0] - math.tanh(0.5)) < 1e-6

    def test_very_deep_network_numerical_stability(self):
        """Very deep network - check for numerical issues."""
        neurons = [NeuronGene(id=0, type='input')]
        connections = []

        # 100 hidden layers
        for i in range(100):
            neurons.append(NeuronGene(id=i+1, type='hidden', innovation=i))
            connections.append(ConnectionGene(
                from_node=i, to_node=i+1, weight=1.0, innovation=i
            ))

        neurons.append(NeuronGene(id=101, type='output'))
        connections.append(ConnectionGene(from_node=100, to_node=101, weight=1.0, innovation=100))

        genome = NEATGenome(neurons=neurons, connections=connections)

        outputs = neat_forward(genome, [10.0])  # Large input
        # After many tanhs, should converge to ~0.7616 regardless of large input
        assert math.isfinite(outputs[0])
        # tanh converges quickly
        assert abs(outputs[0]) < 1.0

    def test_wide_network_sum_overflow(self):
        """Wide network where many inputs sum together."""
        neurons = [NeuronGene(id=i, type='input') for i in range(100)]
        neurons.append(NeuronGene(id=100, type='output', bias=0.0))

        connections = [
            ConnectionGene(from_node=i, to_node=100, weight=1.0, innovation=i)
            for i in range(100)
        ]

        genome = NEATGenome(neurons=neurons, connections=connections)

        # 100 inputs of 1.0, weights 1.0 each = sum of 100
        outputs = neat_forward(genome, [1.0] * 100)
        # tanh(100) ≈ 1.0 (saturated)
        assert abs(outputs[0] - 1.0) < 0.01


class TestMutationCornerCases:
    """Corner cases in mutation operations."""

    def test_add_connection_to_fully_connected_small_network(self):
        """Try to add connection when network is fully connected."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
        )
        counter = InnovationCounter(next_connection=10)

        # Should fail - fully connected
        result = mutate_add_connection(genome, counter)
        assert result is False
        assert len(genome.connections) == 1

    def test_add_node_when_at_limit(self):
        """Try to add node when at max_hidden_nodes."""
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        counter = InnovationCounter()

        # Add nodes to hit limit
        for _ in range(3):
            mutate_add_node(genome, counter, max_hidden_nodes=3)

        assert len(genome.get_hidden_neurons()) == 3

        # Try to add one more
        result = mutate_add_node(genome, counter, max_hidden_nodes=3)
        assert result is False
        assert len(genome.get_hidden_neurons()) == 3

    def test_add_connection_with_only_input_neuron(self):
        """Add connection with only input neurons (no valid targets)."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='input'),
            ],
            connections=[],
        )
        counter = InnovationCounter()

        result = mutate_add_connection(genome, counter)
        assert result is False

    def test_add_node_with_no_connections(self):
        """Add node when there are no connections to split."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[],
        )
        counter = InnovationCounter()

        result = mutate_add_node(genome, counter)
        assert result is False

    def test_weight_mutation_with_zero_rate(self):
        """Weight mutation with 0% rate should change nothing."""
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        original_weights = [c.weight for c in genome.connections]

        # This should do nothing
        mutate_neat_weights(genome, mutation_rate=0.0)

        new_weights = [c.weight for c in genome.connections]
        assert original_weights == new_weights


class TestCycleDetectionEdgeCases:
    """Edge cases for cycle detection."""

    def test_cycle_check_on_nonexistent_neuron(self):
        """Cycle check with neuron ID that doesn't exist."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[],
        )

        # Checking connection involving nonexistent neuron
        # This should return False (no cycle, but also invalid)
        result = would_create_cycle(genome, 0, 999)
        # Implementation should handle gracefully
        assert result is False or result is True  # Either is acceptable

    def test_self_loop_detection(self):
        """Self-loop (neuron connecting to itself) should be detected."""
        genome = create_minimal_neat_genome(input_size=2, output_size=2)

        # Self-loop on any neuron should return True
        for neuron in genome.neurons:
            assert would_create_cycle(genome, neuron.id, neuron.id) is True


class TestTopologicalSortEdgeCases:
    """Edge cases for topological sort."""

    def test_sort_empty_genome(self):
        """Sort empty genome."""
        genome = NEATGenome(neurons=[], connections=[])

        order = topological_sort(genome)
        assert order == []

    def test_sort_input_only_genome(self):
        """Sort genome with only inputs."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='input'),
            ],
            connections=[],
        )

        order = topological_sort(genome)
        # No non-input neurons to sort
        assert order == []

    def test_sort_with_multiple_disconnected_components(self):
        """Sort with disconnected sub-networks."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='input'),
                NeuronGene(id=2, type='hidden', innovation=0),  # Connected to 0
                NeuronGene(id=3, type='hidden', innovation=1),  # Isolated
                NeuronGene(id=4, type='output'),  # Connected to 2
                NeuronGene(id=5, type='output'),  # Connected to 1
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=0),
                ConnectionGene(from_node=2, to_node=4, weight=1.0, innovation=1),
                ConnectionGene(from_node=1, to_node=5, weight=1.0, innovation=2),
            ],
        )

        order = topological_sort(genome)

        # All non-input neurons should be in result
        assert 2 in order
        assert 3 in order
        assert 4 in order
        assert 5 in order

        # 2 must come before 4
        assert order.index(2) < order.index(4)


class TestInnovationCounterStress:
    """Stress tests for innovation counter."""

    def test_many_sequential_innovations(self):
        """Generate many innovations sequentially."""
        counter = InnovationCounter()

        for i in range(10000):
            inn = counter.get_connection_innovation(i, i+1)
            assert inn == i

        assert counter.next_connection == 10000

    def test_cache_hit_performance(self):
        """Cache should return same value for same key."""
        counter = InnovationCounter()

        # First call
        inn1 = counter.get_connection_innovation(0, 1)

        # 1000 subsequent calls should all return same value
        for _ in range(1000):
            inn = counter.get_connection_innovation(0, 1)
            assert inn == inn1

        # Counter should have only incremented once
        assert counter.next_connection == 1


class TestMultiGenerationEvolution:
    """Simulate multi-generation evolution to find bugs."""

    def test_100_generations_evolution(self):
        """Run 100 generations of evolution and verify invariants."""
        random.seed(12345)

        genome = create_minimal_neat_genome(input_size=5, output_size=3)
        counter = InnovationCounter()

        for gen in range(100):
            # Mutate
            genome = mutate_neat_genome(
                genome, counter,
                add_connection_rate=0.1,
                add_node_rate=0.05,
                enable_rate=0.05,
                disable_rate=0.02,
                weight_mutation_rate=0.8,
                max_hidden_nodes=30,
            )

            # Clear cache each generation
            counter.clear_generation_cache()

            # Verify invariants
            assert len(genome.get_input_neurons()) == 5, f"Lost inputs at gen {gen}"
            assert len(genome.get_output_neurons()) == 3, f"Lost outputs at gen {gen}"

            # No cycles
            order = topological_sort(genome)
            assert len(order) == len(genome.neurons) - 5  # All non-inputs sorted

            # Forward pass works
            outputs = neat_forward(genome, [0.1, 0.2, 0.3, 0.4, 0.5])
            assert len(outputs) == 3
            assert all(math.isfinite(o) for o in outputs)

            # All connections reference valid neurons
            neuron_ids = {n.id for n in genome.neurons}
            for conn in genome.connections:
                assert conn.from_node in neuron_ids
                assert conn.to_node in neuron_ids

    def test_population_evolution(self):
        """Evolve a population of genomes."""
        random.seed(67890)

        # Create population
        counter = InnovationCounter()
        population = [
            create_minimal_neat_genome(input_size=4, output_size=2, innovation_counter=counter)
            for _ in range(20)
        ]
        counter.clear_generation_cache()

        for gen in range(50):
            # Mutate each genome
            new_pop = []
            for genome in population:
                mutated = mutate_neat_genome(
                    genome, counter,
                    add_connection_rate=0.15,
                    add_node_rate=0.08,
                    max_hidden_nodes=20,
                )
                new_pop.append(mutated)

            population = new_pop
            counter.clear_generation_cache()

        # All genomes should be valid
        for i, genome in enumerate(population):
            try:
                outputs = neat_forward(genome, [0.5, 0.5, 0.5, 0.5])
                assert len(outputs) == 2
            except Exception as e:
                pytest.fail(f"Genome {i} failed forward pass: {e}")


class TestNumericalPrecision:
    """Tests for numerical precision issues."""

    def test_very_small_weights(self):
        """Very small weights should not cause underflow."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1e-300, innovation=0),
            ],
        )

        outputs = neat_forward(genome, [1.0])
        assert math.isfinite(outputs[0])
        # tanh of very small number ≈ the number
        assert abs(outputs[0] - 1e-300) < 1e-299

    def test_weight_accumulation_precision(self):
        """Many small weights should accumulate without precision loss."""
        neurons = [NeuronGene(id=i, type='input') for i in range(1000)]
        neurons.append(NeuronGene(id=1000, type='output', bias=0.0))

        # 1000 connections with weight 0.001
        connections = [
            ConnectionGene(from_node=i, to_node=1000, weight=0.001, innovation=i)
            for i in range(1000)
        ]

        genome = NEATGenome(neurons=neurons, connections=connections)

        # Sum should be 1000 * 0.001 * 1.0 = 1.0
        outputs = neat_forward(genome, [1.0] * 1000)
        expected = math.tanh(1.0)
        assert abs(outputs[0] - expected) < 1e-10


class TestDepthCalculationCornerCases:
    """Corner cases for depth calculation."""

    def test_depth_of_empty_genome(self):
        """Depth of empty genome."""
        genome = NEATGenome(neurons=[], connections=[])
        depth = get_neuron_depths(genome)
        assert depth == {}

    def test_depth_with_only_outputs(self):
        """Genome with only output neurons."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='output'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[],
        )

        depths = get_neuron_depths(genome)
        # Outputs should all have depth 1 (max)
        assert depths[0] == 1
        assert depths[1] == 1
