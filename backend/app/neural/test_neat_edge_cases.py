"""Edge case and stress tests for NEAT implementation.

Tests cover:
- Numerical edge cases (extreme weights, overflow potential)
- Empty/minimal data scenarios
- Boundary conditions
- Complex topology scenarios
- Error handling
"""

import math
import pytest

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


class TestNumericalEdgeCases:
    """Tests for numerical stability and edge cases."""

    def test_extreme_positive_weight(self):
        """Very large positive weights should not cause overflow."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1000.0, innovation=0),
            ],
            activation='tanh',
        )
        # tanh saturates at ~1.0 for large inputs
        outputs = neat_forward(genome, [1.0])
        assert len(outputs) == 1
        assert abs(outputs[0] - 1.0) < 0.001  # Should be ~1.0 (saturated)

    def test_extreme_negative_weight(self):
        """Very large negative weights should not cause overflow."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-1000.0, innovation=0),
            ],
            activation='tanh',
        )
        outputs = neat_forward(genome, [1.0])
        assert abs(outputs[0] - (-1.0)) < 0.001  # Should be ~-1.0 (saturated)

    def test_extreme_bias(self):
        """Very large bias should not cause overflow."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=1000.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
            activation='tanh',
        )
        outputs = neat_forward(genome, [0.0])
        assert abs(outputs[0] - 1.0) < 0.001

    def test_zero_weight(self):
        """Zero weight should pass zero through."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=0.0, innovation=0),
            ],
            activation='tanh',
        )
        outputs = neat_forward(genome, [100.0])
        assert outputs[0] == 0.0

    def test_zero_input(self):
        """Zero input with non-zero bias."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.5),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
            activation='tanh',
        )
        outputs = neat_forward(genome, [0.0])
        assert abs(outputs[0] - math.tanh(0.5)) < 1e-6

    def test_sigmoid_overflow_protection(self):
        """Sigmoid activation should handle extreme inputs without overflow."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1000.0, innovation=0),
            ],
            activation='sigmoid',
        )
        # Should not raise overflow error
        outputs = neat_forward(genome, [1.0])
        assert 0.0 <= outputs[0] <= 1.0

    def test_sigmoid_underflow_protection(self):
        """Sigmoid should handle large negative inputs."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-1000.0, innovation=0),
            ],
            activation='sigmoid',
        )
        outputs = neat_forward(genome, [1.0])
        assert outputs[0] >= 0.0
        assert outputs[0] < 0.001

    def test_relu_negative_input(self):
        """ReLU should output 0 for negative weighted sums."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=-1.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=0.5, innovation=0),
            ],
            activation='relu',
        )
        outputs = neat_forward(genome, [1.0])  # 0.5 - 1.0 = -0.5 -> relu -> 0
        assert outputs[0] == 0.0

    def test_many_small_weights_accumulate(self):
        """Many small weights should accumulate correctly."""
        neurons = [NeuronGene(id=i, type='input') for i in range(100)]
        neurons.append(NeuronGene(id=100, type='output', bias=0.0))

        connections = [
            ConnectionGene(from_node=i, to_node=100, weight=0.01, innovation=i)
            for i in range(100)
        ]

        genome = NEATGenome(neurons=neurons, connections=connections, activation='tanh')

        # Sum = 100 * 1.0 * 0.01 = 1.0
        outputs = neat_forward(genome, [1.0] * 100)
        assert abs(outputs[0] - math.tanh(1.0)) < 1e-6

    def test_canceling_weights(self):
        """Positive and negative weights should cancel out."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='input'),
                NeuronGene(id=2, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=-1.0, innovation=1),
            ],
            activation='tanh',
        )
        outputs = neat_forward(genome, [0.5, 0.5])
        assert abs(outputs[0]) < 1e-6


class TestEmptyAndMinimalScenarios:
    """Tests for empty and minimal data scenarios."""

    def test_single_input_single_output(self):
        """Minimal topology: 1 input, 1 output."""
        genome = create_minimal_neat_genome(input_size=1, output_size=1)
        assert len(genome.get_input_neurons()) == 1
        assert len(genome.get_output_neurons()) == 1
        assert len(genome.connections) == 1

    def test_no_hidden_neurons(self):
        """Genome with no hidden neurons."""
        genome = create_minimal_neat_genome(input_size=3, output_size=2)
        assert len(genome.get_hidden_neurons()) == 0

    def test_disconnected_hidden_neuron(self):
        """Hidden neuron with no connections."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', bias=0.5, innovation=0),  # Disconnected
                NeuronGene(id=2, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=0),
            ],
        )
        # Should still work - hidden neuron just doesn't contribute
        outputs = neat_forward(genome, [0.5])
        assert abs(outputs[0] - math.tanh(0.5)) < 1e-6

    def test_all_connections_disabled(self):
        """All connections disabled - output should only use bias."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.3),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, enabled=False, innovation=0),
            ],
        )
        outputs = neat_forward(genome, [1.0])
        assert abs(outputs[0] - math.tanh(0.3)) < 1e-6

    def test_empty_connections_list(self):
        """Genome with no connections at all."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.5),
            ],
            connections=[],
        )
        # Output should just use bias
        outputs = neat_forward(genome, [1.0])
        assert abs(outputs[0] - math.tanh(0.5)) < 1e-6

    def test_multiple_outputs_no_connections(self):
        """Multiple outputs with no connections - each uses own bias."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.1),
                NeuronGene(id=2, type='output', bias=0.2),
                NeuronGene(id=3, type='output', bias=0.3),
            ],
            connections=[],
        )
        outputs = neat_forward(genome, [1.0])
        assert len(outputs) == 3
        assert abs(outputs[0] - math.tanh(0.1)) < 1e-6
        assert abs(outputs[1] - math.tanh(0.2)) < 1e-6
        assert abs(outputs[2] - math.tanh(0.3)) < 1e-6


class TestBoundaryConditions:
    """Tests for boundary conditions."""

    def test_large_input_count(self):
        """Large number of inputs."""
        genome = create_minimal_neat_genome(input_size=50, output_size=2)
        assert len(genome.get_input_neurons()) == 50
        assert len(genome.connections) == 100  # 50 * 2

        inputs = [0.1] * 50
        outputs = neat_forward(genome, inputs)
        assert len(outputs) == 2

    def test_large_output_count(self):
        """Large number of outputs."""
        genome = create_minimal_neat_genome(input_size=2, output_size=50)
        assert len(genome.get_output_neurons()) == 50
        assert len(genome.connections) == 100  # 2 * 50

        outputs = neat_forward(genome, [0.5, 0.5])
        assert len(outputs) == 50

    def test_max_neuron_id_accuracy(self):
        """max_neuron_id should return correct value."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=100, type='hidden', innovation=0),
                NeuronGene(id=50, type='output'),
            ],
            connections=[],
        )
        assert genome.max_neuron_id() == 100

    def test_max_innovation_with_gaps(self):
        """max_innovation should find max even with gaps."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=5),
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=100, enabled=False),
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=50),
            ],
        )
        assert genome.max_innovation() == 100

    def test_innovation_counter_high_values(self):
        """Innovation counter should handle high values."""
        counter = InnovationCounter(next_connection=1000000, next_node=500000)
        inn = counter.get_connection_innovation(0, 1)
        assert inn == 1000000
        assert counter.next_connection == 1000001


class TestComplexTopologies:
    """Tests for complex network topologies."""

    def test_deep_network(self):
        """Network with multiple hidden layers."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', bias=0.0, innovation=0),
                NeuronGene(id=2, type='hidden', bias=0.0, innovation=1),
                NeuronGene(id=3, type='hidden', bias=0.0, innovation=2),
                NeuronGene(id=4, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=1.0, innovation=1),
                ConnectionGene(from_node=2, to_node=3, weight=1.0, innovation=2),
                ConnectionGene(from_node=3, to_node=4, weight=1.0, innovation=3),
            ],
            activation='tanh',
        )

        assert get_network_depth(genome) == 4

        # tanh(tanh(tanh(tanh(1.0))))
        outputs = neat_forward(genome, [1.0])
        expected = math.tanh(math.tanh(math.tanh(math.tanh(1.0))))
        assert abs(outputs[0] - expected) < 1e-6

    def test_wide_hidden_layer(self):
        """Network with many hidden neurons in parallel."""
        neurons = [NeuronGene(id=0, type='input')]
        neurons.extend([
            NeuronGene(id=i, type='hidden', bias=0.0, innovation=i-1)
            for i in range(1, 11)  # 10 hidden neurons
        ])
        neurons.append(NeuronGene(id=11, type='output', bias=0.0))

        connections = []
        # Input to all hidden
        for i in range(1, 11):
            connections.append(
                ConnectionGene(from_node=0, to_node=i, weight=0.1, innovation=i-1)
            )
        # All hidden to output
        for i in range(1, 11):
            connections.append(
                ConnectionGene(from_node=i, to_node=11, weight=0.1, innovation=i+9)
            )

        genome = NEATGenome(neurons=neurons, connections=connections, activation='tanh')

        outputs = neat_forward(genome, [1.0])
        # 10 hidden neurons each get tanh(0.1), output sums them with 0.1 weight each
        hidden_activation = math.tanh(0.1)
        expected = math.tanh(10 * hidden_activation * 0.1)
        assert abs(outputs[0] - expected) < 1e-6

    def test_skip_connection(self):
        """Network with skip connection (input directly to output)."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', bias=0.0, innovation=0),
                NeuronGene(id=2, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=1.0, innovation=1),
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=2),  # Skip
            ],
            activation='tanh',
        )

        # Output = tanh(tanh(1.0) * 1.0 + 1.0 * 1.0)
        outputs = neat_forward(genome, [1.0])
        expected = math.tanh(math.tanh(1.0) + 1.0)
        assert abs(outputs[0] - expected) < 1e-6

    def test_diamond_topology(self):
        """Diamond pattern: input -> 2 hidden -> output."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', bias=0.0, innovation=0),
                NeuronGene(id=2, type='hidden', bias=0.0, innovation=1),
                NeuronGene(id=3, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=1),
                ConnectionGene(from_node=1, to_node=3, weight=0.5, innovation=2),
                ConnectionGene(from_node=2, to_node=3, weight=0.5, innovation=3),
            ],
            activation='tanh',
        )

        outputs = neat_forward(genome, [1.0])
        hidden_val = math.tanh(1.0)
        expected = math.tanh(hidden_val * 0.5 + hidden_val * 0.5)
        assert abs(outputs[0] - expected) < 1e-6

    def test_multiple_inputs_to_single_hidden(self):
        """Multiple inputs feeding single hidden neuron."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='input'),
                NeuronGene(id=2, type='input'),
                NeuronGene(id=3, type='hidden', bias=0.0, innovation=0),
                NeuronGene(id=4, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=3, weight=1.0, innovation=0),
                ConnectionGene(from_node=1, to_node=3, weight=1.0, innovation=1),
                ConnectionGene(from_node=2, to_node=3, weight=1.0, innovation=2),
                ConnectionGene(from_node=3, to_node=4, weight=1.0, innovation=3),
            ],
            activation='tanh',
        )

        outputs = neat_forward(genome, [0.1, 0.2, 0.3])
        hidden_val = math.tanh(0.1 + 0.2 + 0.3)
        expected = math.tanh(hidden_val)
        assert abs(outputs[0] - expected) < 1e-6


class TestCycleDetection:
    """Tests for cycle detection in various scenarios."""

    def test_no_cycle_in_tree(self):
        """Tree structure has no cycles."""
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

        # Any forward edge shouldn't create cycle
        assert would_create_cycle(genome, 1, 3) is False
        assert would_create_cycle(genome, 2, 3) is False

    def test_cycle_detection_long_path(self):
        """Cycle detection works for long paths."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=i, type='hidden' if i > 0 else 'input', innovation=i if i > 0 else None)
                for i in range(10)
            ],
            connections=[
                ConnectionGene(from_node=i, to_node=i+1, weight=1.0, innovation=i)
                for i in range(9)
            ],
        )

        # Adding 9->0 would create 0->1->...->9->0 cycle
        assert would_create_cycle(genome, 9, 0) is True

        # Adding 9->5 would create 5->6->...->9->5 cycle
        assert would_create_cycle(genome, 9, 5) is True

        # Adding 3->9 is fine (forward edge)
        assert would_create_cycle(genome, 3, 9) is False

    def test_cycle_detection_ignores_disabled(self):
        """Disabled connections don't count for cycle detection."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),
                NeuronGene(id=2, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=1.0, enabled=False, innovation=1),
            ],
        )

        # 2->0 would create cycle if 1->2 was enabled, but it's disabled
        assert would_create_cycle(genome, 2, 0) is False


class TestTopologicalSortEdgeCases:
    """Tests for topological sort edge cases."""

    def test_sort_with_isolated_hidden(self):
        """Isolated hidden neurons should still be in sort result."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),  # Isolated
                NeuronGene(id=2, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=0),
            ],
        )

        order = topological_sort(genome)
        assert 1 in order
        assert 2 in order

    def test_sort_preserves_dependencies(self):
        """Complex dependencies should be respected."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),
                NeuronGene(id=2, type='hidden', innovation=1),
                NeuronGene(id=3, type='hidden', innovation=2),
                NeuronGene(id=4, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=1),
                ConnectionGene(from_node=1, to_node=3, weight=1.0, innovation=2),
                ConnectionGene(from_node=2, to_node=3, weight=1.0, innovation=3),
                ConnectionGene(from_node=3, to_node=4, weight=1.0, innovation=4),
            ],
        )

        order = topological_sort(genome)

        # 1 and 2 can be in any order (parallel from input)
        # 3 must come after both 1 and 2
        # 4 must come after 3
        assert order.index(3) > order.index(1)
        assert order.index(3) > order.index(2)
        assert order.index(4) > order.index(3)


class TestDepthCalculation:
    """Tests for network depth calculation."""

    def test_depth_with_skip_connections(self):
        """Skip connections shouldn't reduce perceived depth."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),
                NeuronGene(id=2, type='hidden', innovation=1),
                NeuronGene(id=3, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=1.0, innovation=1),
                ConnectionGene(from_node=2, to_node=3, weight=1.0, innovation=2),
                ConnectionGene(from_node=0, to_node=3, weight=1.0, innovation=3),  # Skip
            ],
        )

        assert get_network_depth(genome) == 3

    def test_neuron_depths_with_parallel_paths(self):
        """Neuron depth should be max of all paths to it."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),
                NeuronGene(id=2, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=1),  # Direct
                ConnectionGene(from_node=1, to_node=2, weight=1.0, innovation=2),  # Through hidden
            ],
        )

        depths = get_neuron_depths(genome)
        assert depths[0] == 0  # Input
        assert depths[1] == 1  # Hidden
        assert depths[2] == 2  # Output at max depth

    def test_disconnected_neurons_depth_zero(self):
        """Disconnected neurons should have depth 0."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),  # Disconnected
                NeuronGene(id=2, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=0),
            ],
        )

        depths = get_neuron_depths(genome)
        assert depths[1] == 0  # Disconnected hidden


class TestErrorHandling:
    """Tests for error handling."""

    def test_wrong_input_count_raises(self):
        """Mismatched input count should raise ValueError."""
        genome = create_minimal_neat_genome(input_size=3, output_size=2)

        with pytest.raises(ValueError, match="Expected 3 inputs"):
            neat_forward(genome, [1.0, 2.0])  # Only 2

        with pytest.raises(ValueError, match="Expected 3 inputs"):
            neat_forward(genome, [1.0, 2.0, 3.0, 4.0])  # 4 instead of 3

    def test_empty_input_list_for_nonzero_inputs(self):
        """Empty input list when inputs expected should raise."""
        genome = create_minimal_neat_genome(input_size=2, output_size=1)

        with pytest.raises(ValueError, match="Expected 2 inputs"):
            neat_forward(genome, [])

    def test_forward_full_wrong_input_count(self):
        """neat_forward_full should also validate input count."""
        genome = create_minimal_neat_genome(input_size=2, output_size=1)

        with pytest.raises(ValueError, match="Expected 2 inputs"):
            neat_forward_full(genome, [1.0])


class TestInnovationCounterEdgeCases:
    """Tests for innovation counter edge cases."""

    def test_cache_key_order_matters(self):
        """Connection (a,b) should be different from (b,a)."""
        counter = InnovationCounter()
        inn1 = counter.get_connection_innovation(0, 1)
        inn2 = counter.get_connection_innovation(1, 0)

        assert inn1 != inn2
        assert inn1 == 0
        assert inn2 == 1

    def test_many_connections_same_generation(self):
        """Many unique connections in one generation."""
        counter = InnovationCounter()
        innovations = set()

        for i in range(100):
            for j in range(100):
                if i != j:
                    inn = counter.get_connection_innovation(i, j)
                    innovations.add(inn)

        # Should have 100*99 unique innovations
        assert len(innovations) == 100 * 99

    def test_cache_survives_many_operations(self):
        """Cache should work correctly after many operations."""
        counter = InnovationCounter()

        # Create many connections
        for i in range(50):
            counter.get_connection_innovation(i, i + 1)

        # Same connections should return same innovations
        for i in range(50):
            inn = counter.get_connection_innovation(i, i + 1)
            assert inn == i

        assert counter.next_connection == 50


class TestGenomeHelperMethods:
    """Tests for NEATGenome helper methods."""

    def test_connection_exists_with_disabled(self):
        """connection_exists should return True for disabled connections too."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, enabled=False, innovation=0),
            ],
        )

        assert genome.connection_exists(0, 1) is True

    def test_get_neuron_by_id_with_many_neurons(self):
        """get_neuron_by_id should work with many neurons."""
        neurons = [NeuronGene(id=i * 10, type='hidden', innovation=i) for i in range(100)]
        genome = NEATGenome(neurons=neurons, connections=[])

        assert genome.get_neuron_by_id(500) is not None
        assert genome.get_neuron_by_id(500).id == 500
        assert genome.get_neuron_by_id(501) is None

    def test_get_enabled_connections_preserves_order(self):
        """get_enabled_connections should maintain list order."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=1, weight=2.0, enabled=False, innovation=1),
                ConnectionGene(from_node=0, to_node=1, weight=3.0, innovation=2),
            ],
        )

        enabled = genome.get_enabled_connections()
        assert len(enabled) == 2
        assert enabled[0].innovation == 0
        assert enabled[1].innovation == 2
