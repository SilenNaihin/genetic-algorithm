"""Tests for NEAT network execution."""

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


class TestCreateMinimalGenome:
    """Tests for create_minimal_neat_genome."""

    def test_creates_correct_neuron_counts(self):
        genome = create_minimal_neat_genome(input_size=3, output_size=2)

        assert len(genome.get_input_neurons()) == 3
        assert len(genome.get_output_neurons()) == 2
        assert len(genome.get_hidden_neurons()) == 0

    def test_creates_fully_connected(self):
        """Option B: all inputs connect to all outputs."""
        genome = create_minimal_neat_genome(input_size=3, output_size=2)

        # Should have 3 * 2 = 6 connections
        assert len(genome.connections) == 6

        # All connections should be enabled
        assert all(c.enabled for c in genome.connections)

    def test_neuron_ids_are_sequential(self):
        genome = create_minimal_neat_genome(input_size=3, output_size=2)

        # Inputs: 0, 1, 2
        # Outputs: 3, 4
        input_ids = [n.id for n in genome.get_input_neurons()]
        output_ids = [n.id for n in genome.get_output_neurons()]

        assert sorted(input_ids) == [0, 1, 2]
        assert sorted(output_ids) == [3, 4]

    def test_output_bias_applied(self):
        genome = create_minimal_neat_genome(
            input_size=2, output_size=2, output_bias=-0.5
        )

        for neuron in genome.get_output_neurons():
            assert neuron.bias == -0.5

    def test_input_neurons_have_zero_bias(self):
        genome = create_minimal_neat_genome(input_size=2, output_size=2)

        for neuron in genome.get_input_neurons():
            assert neuron.bias == 0.0

    def test_uses_innovation_counter(self):
        counter = InnovationCounter()
        genome = create_minimal_neat_genome(
            input_size=2, output_size=2, innovation_counter=counter
        )

        # Should have used 4 innovation IDs (2 inputs * 2 outputs)
        assert counter.next_connection == 4

        # Innovation IDs should be unique
        innovations = [c.innovation for c in genome.connections]
        assert len(innovations) == len(set(innovations))

    def test_weights_are_random(self):
        """Weights should vary between genomes."""
        genome1 = create_minimal_neat_genome(input_size=2, output_size=2)
        genome2 = create_minimal_neat_genome(input_size=2, output_size=2)

        weights1 = [c.weight for c in genome1.connections]
        weights2 = [c.weight for c in genome2.connections]

        # Very unlikely to be identical
        assert weights1 != weights2

    def test_activation_stored(self):
        genome = create_minimal_neat_genome(
            input_size=2, output_size=2, activation='relu'
        )
        assert genome.activation == 'relu'


class TestTopologicalSort:
    """Tests for topological_sort."""

    def test_minimal_genome_order(self):
        """For minimal genome, outputs should come after inputs."""
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        order = topological_sort(genome)

        # Order should only contain output neurons (inputs are excluded)
        output_ids = {n.id for n in genome.get_output_neurons()}
        assert set(order) == output_ids

    def test_with_hidden_neuron(self):
        """Hidden neuron should come between input and output."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),
                NeuronGene(id=2, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=1.0, innovation=1),
            ],
        )
        order = topological_sort(genome)

        # Hidden (1) must come before output (2)
        assert order.index(1) < order.index(2)

    def test_parallel_paths(self):
        """Multiple paths to output should work."""
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
        order = topological_sort(genome)

        # Hidden neurons must come before output
        assert 3 == order[-1] or (1 in order and 2 in order)  # Output last
        assert order.index(1) < order.index(3)
        assert order.index(2) < order.index(3)

    def test_disabled_connections_ignored(self):
        """Disabled connections shouldn't affect order."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),
                NeuronGene(id=2, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=1, weight=1.0, enabled=False, innovation=1),
                ConnectionGene(from_node=1, to_node=2, weight=1.0, enabled=False, innovation=2),
            ],
        )
        order = topological_sort(genome)

        # Hidden neuron has no enabled connections, but should still be in order
        assert 1 in order
        assert 2 in order


class TestNeatForward:
    """Tests for neat_forward."""

    def test_simple_passthrough(self):
        """Single input to single output with weight 1.0 and bias 0."""
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

        # tanh(0.5 * 1.0 + 0.0) = tanh(0.5) ≈ 0.462
        outputs = neat_forward(genome, [0.5])
        assert len(outputs) == 1
        assert abs(outputs[0] - math.tanh(0.5)) < 1e-6

    def test_weighted_sum(self):
        """Multiple inputs summed with weights."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='input'),
                NeuronGene(id=2, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=2, weight=0.5, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=-0.5, innovation=1),
            ],
            activation='tanh',
        )

        # tanh(1.0 * 0.5 + 1.0 * -0.5) = tanh(0) = 0
        outputs = neat_forward(genome, [1.0, 1.0])
        assert abs(outputs[0]) < 1e-6

    def test_bias_effect(self):
        """Bias should shift activation."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=-1.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
            activation='tanh',
        )

        # tanh(0.5 * 1.0 + (-1.0)) = tanh(-0.5)
        outputs = neat_forward(genome, [0.5])
        assert abs(outputs[0] - math.tanh(-0.5)) < 1e-6

    def test_hidden_layer(self):
        """Forward pass through hidden neuron."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', bias=0.0, innovation=0),
                NeuronGene(id=2, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=1.0, innovation=1),
            ],
            activation='tanh',
        )

        # hidden = tanh(1.0 * 1.0) = tanh(1.0)
        # output = tanh(tanh(1.0) * 1.0) = tanh(tanh(1.0))
        outputs = neat_forward(genome, [1.0])
        expected = math.tanh(math.tanh(1.0))
        assert abs(outputs[0] - expected) < 1e-6

    def test_disabled_connection_ignored(self):
        """Disabled connections shouldn't contribute."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=1, weight=100.0, enabled=False, innovation=1),
            ],
            activation='tanh',
        )

        # Only the enabled connection (weight=1.0) should matter
        outputs = neat_forward(genome, [0.5])
        assert abs(outputs[0] - math.tanh(0.5)) < 1e-6

    def test_multiple_outputs(self):
        """Multiple output neurons."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
                NeuronGene(id=2, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=2, weight=-1.0, innovation=1),
            ],
            activation='tanh',
        )

        outputs = neat_forward(genome, [0.5])
        assert len(outputs) == 2
        assert abs(outputs[0] - math.tanh(0.5)) < 1e-6
        assert abs(outputs[1] - math.tanh(-0.5)) < 1e-6

    def test_wrong_input_size_raises(self):
        genome = create_minimal_neat_genome(input_size=3, output_size=2)

        with pytest.raises(ValueError, match="Expected 3 inputs"):
            neat_forward(genome, [1.0, 2.0])  # Only 2 inputs

    def test_relu_activation(self):
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
            activation='relu',
        )

        # relu(-0.5) = 0, relu(0.5) = 0.5
        assert neat_forward(genome, [-0.5])[0] == 0.0
        assert neat_forward(genome, [0.5])[0] == 0.5


class TestNeatForwardFull:
    """Tests for neat_forward_full (returns all activations)."""

    def test_returns_all_layers(self):
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', bias=0.0, innovation=0),
                NeuronGene(id=2, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=1.0, innovation=1),
            ],
        )

        result = neat_forward_full(genome, [1.0])

        assert 'inputs' in result
        assert 'hidden' in result
        assert 'outputs' in result

        assert len(result['inputs']) == 1
        assert len(result['hidden']) == 1
        assert len(result['outputs']) == 1

        assert result['inputs'][0] == 1.0
        assert abs(result['hidden'][0] - math.tanh(1.0)) < 1e-6


class TestWouldCreateCycle:
    """Tests for cycle detection."""

    def test_self_loop_is_cycle(self):
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        assert would_create_cycle(genome, 0, 0) is True

    def test_input_to_output_no_cycle(self):
        """Direct input->output connection is fine."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[],
        )
        assert would_create_cycle(genome, 0, 1) is False

    def test_reverse_connection_creates_cycle(self):
        """If A->B exists, B->A would create cycle."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),
                NeuronGene(id=2, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=1.0, innovation=1),
            ],
        )

        # 0->1->2 exists, so 2->0 would create 0->1->2->0 cycle
        assert would_create_cycle(genome, 2, 0) is True

        # 1->0 would create 0->1->0 cycle
        assert would_create_cycle(genome, 1, 0) is True

    def test_parallel_path_no_cycle(self):
        """Parallel paths without cycles are fine."""
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
            ],
        )

        # 2->3 is fine (parallel path)
        assert would_create_cycle(genome, 2, 3) is False

        # 1->2 is fine (not creating cycle)
        assert would_create_cycle(genome, 1, 2) is False


class TestNetworkDepth:
    """Tests for depth calculation."""

    def test_minimal_genome_depth(self):
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        assert get_network_depth(genome) == 1  # Direct input->output

    def test_one_hidden_layer(self):
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),
                NeuronGene(id=2, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=1.0, innovation=1),
            ],
        )
        assert get_network_depth(genome) == 2  # input->hidden->output

    def test_neuron_depths(self):
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),
                NeuronGene(id=2, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=1.0, innovation=1),
            ],
        )
        depths = get_neuron_depths(genome)

        assert depths[0] == 0  # Input at depth 0
        assert depths[1] == 1  # Hidden at depth 1
        assert depths[2] == 2  # Output at max depth
