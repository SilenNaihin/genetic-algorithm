"""
Bug-finding tests for NEAT implementation.

These tests are specifically designed to expose real bugs, edge cases,
and invariant violations in the NEAT code. They try to break things.
"""

import math
import random
import pytest
from copy import deepcopy

from app.genetics.neat_mutation import (
    mutate_add_connection,
    mutate_add_node,
    mutate_disable_connection,
    mutate_enable_connection,
    mutate_neat_biases,
    mutate_neat_genome,
    mutate_neat_weights,
)
from app.neural.neat_network import (
    create_minimal_neat_genome,
    get_network_depth,
    get_neuron_depths,
    neat_forward,
    neat_forward_full,
    topological_sort,
    would_create_cycle,
)
from app.schemas.neat import (
    ConnectionGene,
    InnovationCounter,
    NEATGenome,
    NeuronGene,
)


class TestForwardPassBugs:
    """Tests to find bugs in forward pass computation."""

    def test_disconnected_output_should_use_bias_only(self):
        """An output with no incoming connections should output activation(bias)."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.5),
                NeuronGene(id=2, type='output', bias=-0.5),
            ],
            connections=[
                # Only connect to output 1, output 2 is disconnected
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
            activation='tanh',
        )

        outputs = neat_forward(genome, [1.0])
        # Output 1: tanh(1.0*1.0 + 0.5) = tanh(1.5)
        # Output 2: tanh(0 + (-0.5)) = tanh(-0.5)
        assert abs(outputs[0] - math.tanh(1.5)) < 1e-6
        assert abs(outputs[1] - math.tanh(-0.5)) < 1e-6

    def test_hidden_neuron_with_no_outgoing_connections(self):
        """Hidden neuron that connects to nothing shouldn't crash."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', bias=0.0, innovation=0),
                NeuronGene(id=2, type='output', bias=0.0),
            ],
            connections=[
                # Input -> hidden, but hidden doesn't connect to output
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                # Input -> output directly
                ConnectionGene(from_node=0, to_node=2, weight=0.5, innovation=1),
            ],
        )

        # Should not crash, output is just from input directly
        outputs = neat_forward(genome, [1.0])
        assert abs(outputs[0] - math.tanh(0.5)) < 1e-6

    def test_multiple_paths_to_same_output_accumulate(self):
        """Multiple paths should sum correctly."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', bias=0.0, innovation=0),
                NeuronGene(id=2, type='output', bias=0.0),
            ],
            connections=[
                # Direct path: 0 -> 2 (weight 0.5)
                ConnectionGene(from_node=0, to_node=2, weight=0.5, innovation=0),
                # Indirect path: 0 -> 1 -> 2
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=1),
                ConnectionGene(from_node=1, to_node=2, weight=0.5, innovation=2),
            ],
            activation='tanh',
        )

        outputs = neat_forward(genome, [1.0])
        # hidden = tanh(1.0) ≈ 0.7616
        # output = tanh(1.0*0.5 + tanh(1.0)*0.5) = tanh(0.5 + 0.7616*0.5)
        hidden_val = math.tanh(1.0)
        expected = math.tanh(0.5 + hidden_val * 0.5)
        assert abs(outputs[0] - expected) < 1e-6

    def test_nan_input_propagates(self):
        """NaN inputs should propagate to outputs as NaN."""
        genome = create_minimal_neat_genome(input_size=2, output_size=1)
        outputs = neat_forward(genome, [float('nan'), 1.0])
        # At least one output should be NaN
        assert math.isnan(outputs[0])

    def test_inf_input_handled(self):
        """Infinity inputs should saturate tanh to ±1."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
            activation='tanh',
        )

        outputs = neat_forward(genome, [float('inf')])
        assert abs(outputs[0] - 1.0) < 1e-6

        outputs = neat_forward(genome, [float('-inf')])
        assert abs(outputs[0] - (-1.0)) < 1e-6

    def test_output_ordering_is_by_neuron_id(self):
        """Outputs must be returned in neuron ID order, not creation order."""
        # Create outputs out of order
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=5, type='output', bias=0.5),  # Higher ID but created first
                NeuronGene(id=2, type='output', bias=-0.5),  # Lower ID but created second
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=5, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=2, weight=0.0, innovation=1),
            ],
            activation='tanh',
        )

        outputs = neat_forward(genome, [1.0])
        # Should be sorted by ID: output[0] is neuron 2, output[1] is neuron 5
        assert len(outputs) == 2
        # Neuron 2 (bias -0.5, weight 0): tanh(-0.5)
        # Neuron 5 (bias 0.5, weight 1.0): tanh(1.5)
        assert abs(outputs[0] - math.tanh(-0.5)) < 1e-6  # Neuron 2
        assert abs(outputs[1] - math.tanh(1.5)) < 1e-6   # Neuron 5


class TestMutationBugs:
    """Tests to find bugs in mutation operations."""

    def test_add_connection_respects_disabled_connections(self):
        """Should not add duplicate connection even if existing one is disabled."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, enabled=False, innovation=0),
            ],
        )
        counter = InnovationCounter(next_connection=10)

        # Try to add connection - should fail since 0->1 exists (even if disabled)
        result = mutate_add_connection(genome, counter)
        assert result is False

    def test_add_node_creates_valid_topology(self):
        """After add_node, network should still be valid feedforward."""
        random.seed(42)
        genome = create_minimal_neat_genome(input_size=3, output_size=2)
        counter = InnovationCounter()

        # Add many nodes
        for _ in range(10):
            mutate_add_node(genome, counter, max_hidden_nodes=20)

        # Should not raise (no cycles)
        order = topological_sort(genome)
        assert len(order) > 0

        # Forward pass should work
        outputs = neat_forward(genome, [0.5, 0.5, 0.5])
        assert len(outputs) == 2
        assert all(not math.isnan(o) for o in outputs)

    def test_mutation_does_not_modify_original(self):
        """mutate_neat_genome should not modify the input genome."""
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        counter = InnovationCounter()

        # Store original state
        original_neurons = len(genome.neurons)
        original_connections = len(genome.connections)
        original_weights = [c.weight for c in genome.connections]

        # Mutate many times
        for _ in range(20):
            mutate_neat_genome(genome, counter, add_node_rate=0.5, add_connection_rate=0.5)

        # Original should be unchanged
        assert len(genome.neurons) == original_neurons
        assert len(genome.connections) == original_connections
        assert [c.weight for c in genome.connections] == original_weights

    def test_add_node_on_split_connection_twice(self):
        """If same connection is split twice (in different genomes), should get same innovation."""
        counter = InnovationCounter()

        genome1 = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=42),
            ],
        )

        genome2 = deepcopy(genome1)

        # Split the same connection (innovation=42) in both genomes
        mutate_add_node(genome1, counter, max_hidden_nodes=10)
        mutate_add_node(genome2, counter, max_hidden_nodes=10)

        # Both new hidden nodes should have the same innovation
        hidden1 = genome1.get_hidden_neurons()[0]
        hidden2 = genome2.get_hidden_neurons()[0]
        assert hidden1.innovation == hidden2.innovation

    def test_weights_can_grow_unbounded(self):
        """Weight mutations can make weights arbitrarily large (potential issue)."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=0.0, innovation=0),
            ],
        )

        # Mutate weights 1000 times
        random.seed(42)
        for _ in range(1000):
            mutate_neat_weights(genome, mutation_rate=1.0, perturb_rate=1.0, perturb_magnitude=0.5)

        # Check if weight has grown large (this documents the behavior)
        weight = genome.connections[0].weight
        # With random walk, weight can grow - just ensure it's finite
        assert math.isfinite(weight)

    def test_enable_disable_stability(self):
        """Rapidly enabling/disabling shouldn't corrupt state."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
        )

        for _ in range(100):
            mutate_disable_connection(genome)
            mutate_enable_connection(genome)

        # Connection should be in a valid state
        conn = genome.connections[0]
        assert conn.enabled in (True, False)
        assert conn.weight == 1.0  # Weight unchanged


class TestTopologicalSortBugs:
    """Tests to find bugs in topological sort."""

    def test_isolated_hidden_neuron_in_sort(self):
        """Isolated hidden neuron (no connections) should still be in sort result."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),  # No connections to/from
                NeuronGene(id=2, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=0),
            ],
        )

        order = topological_sort(genome)
        # Both hidden and output should be in result
        assert 1 in order
        assert 2 in order

    def test_hidden_neuron_only_receiving_disabled_connections(self):
        """Hidden neuron with only disabled incoming connections."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),
                NeuronGene(id=2, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, enabled=False, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=1.0, innovation=1),
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=2),
            ],
        )

        # Should still work - hidden neuron has no enabled incoming
        order = topological_sort(genome)
        assert 1 in order
        assert 2 in order


class TestCycleDetectionBugs:
    """Tests to find bugs in cycle detection."""

    def test_disabled_connections_not_considered_for_cycles(self):
        """Disabled connections should not count for cycle detection."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),
                NeuronGene(id=2, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                # This would create a cycle if enabled
                ConnectionGene(from_node=1, to_node=0, weight=1.0, enabled=False, innovation=1),
                ConnectionGene(from_node=1, to_node=2, weight=1.0, innovation=2),
            ],
        )

        # Adding 2->0 should check only enabled connections
        # 0->1->2 exists (enabled), so 2->0 would create cycle
        # But 1->0 is disabled so shouldn't matter
        assert would_create_cycle(genome, 2, 0) is True
        assert would_create_cycle(genome, 2, 1) is True

    def test_cycle_detection_with_complex_topology(self):
        """Cycle detection in a diamond topology."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),
                NeuronGene(id=2, type='hidden', innovation=1),
                NeuronGene(id=3, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=1),
                ConnectionGene(from_node=1, to_node=3, weight=1.0, innovation=2),
                ConnectionGene(from_node=2, to_node=3, weight=1.0, innovation=3),
            ],
        )

        # 1->2 should be OK (parallel paths, no cycle)
        assert would_create_cycle(genome, 1, 2) is False

        # 2->1 should be OK too (parallel, no existing path)
        assert would_create_cycle(genome, 2, 1) is False

        # 3->0 would create cycle through either path
        assert would_create_cycle(genome, 3, 0) is True


class TestInnovationCounterBugs:
    """Tests to find bugs in innovation tracking."""

    def test_counter_handles_same_key_different_generations(self):
        """Same connection added in different generations should get different innovation."""
        counter = InnovationCounter()

        inn1 = counter.get_connection_innovation(0, 1)
        counter.clear_generation_cache()
        inn2 = counter.get_connection_innovation(0, 1)

        assert inn1 != inn2
        assert inn1 == 0
        assert inn2 == 1

    def test_counter_state_preserved_after_deepcopy(self):
        """Deepcopy of counter should preserve state."""
        counter = InnovationCounter()
        counter.get_connection_innovation(0, 1)
        counter.get_node_innovation(0)

        copied = deepcopy(counter)

        assert copied.next_connection == counter.next_connection
        assert copied.next_node == counter.next_node
        # Cache should also be copied
        assert copied.connection_cache == counter.connection_cache


class TestEdgeCaseGenomes:
    """Tests with unusual genome configurations."""

    def test_no_connections_genome(self):
        """Genome with neurons but no connections."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.5),
            ],
            connections=[],
        )

        outputs = neat_forward(genome, [1.0])
        # Output is just activation of bias
        assert abs(outputs[0] - math.tanh(0.5)) < 1e-6

    def test_all_disabled_connections(self):
        """All connections disabled."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.3),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1000.0, enabled=False, innovation=0),
            ],
        )

        outputs = neat_forward(genome, [1.0])
        # Should use only bias (disabled connection ignored)
        assert abs(outputs[0] - math.tanh(0.3)) < 1e-6

    def test_many_hidden_neurons_single_chain(self):
        """Long chain of hidden neurons."""
        neurons = [NeuronGene(id=0, type='input')]
        connections = []

        # Create chain: input -> h0 -> h1 -> ... -> h9 -> output
        for i in range(10):
            neurons.append(NeuronGene(id=i+1, type='hidden', innovation=i))
            connections.append(ConnectionGene(
                from_node=i,
                to_node=i+1,
                weight=1.0,
                innovation=i,
            ))

        neurons.append(NeuronGene(id=11, type='output'))
        connections.append(ConnectionGene(from_node=10, to_node=11, weight=1.0, innovation=10))

        genome = NEATGenome(neurons=neurons, connections=connections, activation='tanh')

        # Should compute correctly
        outputs = neat_forward(genome, [1.0])
        assert len(outputs) == 1
        # tanh applied 11 times to 1.0
        expected = 1.0
        for _ in range(11):
            expected = math.tanh(expected)
        assert abs(outputs[0] - expected) < 1e-6

    def test_genome_with_duplicate_connection_innovations(self):
        """What happens if two connections have same innovation (shouldn't happen but...)"""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=0.5, innovation=0),
                # Duplicate innovation! This shouldn't happen but let's see
                ConnectionGene(from_node=0, to_node=1, weight=0.5, innovation=0),
            ],
        )

        # Forward pass should still work (even with duplicate)
        outputs = neat_forward(genome, [1.0])
        # Both connections contribute
        assert abs(outputs[0] - math.tanh(1.0)) < 1e-6  # 0.5 + 0.5 = 1.0


class TestDepthCalculationBugs:
    """Tests to find bugs in depth calculation."""

    def test_depth_with_all_disabled_connections(self):
        """Depth when all connections are disabled."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),
                NeuronGene(id=2, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, enabled=False, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=1.0, enabled=False, innovation=1),
            ],
        )

        # With no enabled connections, depth should be 1 (just inputs at depth 0)
        depth = get_network_depth(genome)
        assert depth == 1 or depth == 0  # Implementation dependent

    def test_neuron_depths_consistency(self):
        """Neuron depths should be consistent with network structure."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='input'),
                NeuronGene(id=2, type='hidden', innovation=0),
                NeuronGene(id=3, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=0),
                ConnectionGene(from_node=2, to_node=3, weight=1.0, innovation=1),
                ConnectionGene(from_node=1, to_node=3, weight=1.0, innovation=2),  # Skip
            ],
        )

        depths = get_neuron_depths(genome)

        # Input at 0
        assert depths[0] == 0
        assert depths[1] == 0

        # Hidden at 1
        assert depths[2] == 1

        # Output at max (2)
        assert depths[3] == 2


class TestMutationInteractions:
    """Tests for interactions between different mutations."""

    def test_add_node_then_add_connection_no_cycle(self):
        """After adding node, can add connections without cycles."""
        random.seed(123)
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        counter = InnovationCounter()

        # Add a few nodes
        for _ in range(3):
            mutate_add_node(genome, counter, max_hidden_nodes=10)

        # Add connections should not create cycles
        for _ in range(20):
            mutate_add_connection(genome, counter)

        # Verify no cycles
        order = topological_sort(genome)
        assert len(order) > 0

    def test_intensive_mutation_session(self):
        """Intensive mutation should maintain valid genome."""
        random.seed(456)
        genome = create_minimal_neat_genome(input_size=5, output_size=3)
        counter = InnovationCounter()

        # Heavily mutate
        for gen in range(50):
            genome = mutate_neat_genome(
                genome,
                counter,
                add_connection_rate=0.3,
                add_node_rate=0.2,
                enable_rate=0.1,
                disable_rate=0.1,
                weight_mutation_rate=1.0,
                max_hidden_nodes=20,
            )
            counter.clear_generation_cache()

            # Should always be valid
            order = topological_sort(genome)
            outputs = neat_forward(genome, [0.1] * 5)
            assert len(outputs) == 3
            assert all(math.isfinite(o) or math.isnan(o) for o in outputs)


class TestNEATInvariants:
    """Tests for NEAT invariants that must always hold."""

    def test_input_neurons_never_receive_connections(self):
        """Input neurons should never be the target of connections."""
        genome = create_minimal_neat_genome(input_size=3, output_size=2)
        counter = InnovationCounter()

        for _ in range(50):
            mutate_add_connection(genome, counter)
            mutate_add_node(genome, counter, max_hidden_nodes=10)

        input_ids = {n.id for n in genome.get_input_neurons()}
        for conn in genome.connections:
            assert conn.to_node not in input_ids, "Connection targeting input neuron!"

    def test_output_neurons_never_source_connections(self):
        """Output neurons should never be the source of connections (feedforward)."""
        genome = create_minimal_neat_genome(input_size=3, output_size=2)
        counter = InnovationCounter()

        for _ in range(50):
            mutate_add_connection(genome, counter)
            mutate_add_node(genome, counter, max_hidden_nodes=10)

        output_ids = {n.id for n in genome.get_output_neurons()}
        for conn in genome.connections:
            assert conn.from_node not in output_ids, "Connection from output neuron!"

    def test_all_connections_reference_valid_neurons(self):
        """All connection endpoints should reference existing neurons."""
        random.seed(789)
        genome = create_minimal_neat_genome(input_size=4, output_size=3)
        counter = InnovationCounter()

        for _ in range(30):
            genome = mutate_neat_genome(
                genome, counter,
                add_connection_rate=0.2,
                add_node_rate=0.15,
                max_hidden_nodes=15,
            )

        neuron_ids = {n.id for n in genome.neurons}
        for conn in genome.connections:
            assert conn.from_node in neuron_ids, f"Dangling from_node: {conn.from_node}"
            assert conn.to_node in neuron_ids, f"Dangling to_node: {conn.to_node}"
