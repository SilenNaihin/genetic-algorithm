"""
Integration and edge case tests for NEAT connectivity modes.

Tests the different initial connectivity options:
- full: all inputs connected to all outputs
- sparse_outputs: each output gets exactly one input (inputs may be reused)
- sparse_inputs: each input connects to at most one output (outputs may have 0 or 1 connection)
- none: no initial connections
"""

import random
from collections import Counter

import pytest

from app.neural.neat_network import create_minimal_neat_genome, neat_forward, topological_sort


class TestFullConnectivity:
    """Tests for full connectivity mode (all inputs to all outputs)."""

    def test_full_creates_all_connections(self):
        """Full mode should create input_size * output_size connections."""
        genome = create_minimal_neat_genome(
            input_size=5, output_size=3, connectivity='full'
        )
        # 5 inputs * 3 outputs = 15 connections
        assert len(genome.connections) == 15

    def test_full_every_input_connected_to_every_output(self):
        """Every input should connect to every output."""
        genome = create_minimal_neat_genome(
            input_size=4, output_size=2, connectivity='full'
        )

        input_ids = {n.id for n in genome.neurons if n.type == 'input'}
        output_ids = {n.id for n in genome.neurons if n.type == 'output'}

        # Check all combinations exist
        connections_set = {(c.from_node, c.to_node) for c in genome.connections}
        for inp in input_ids:
            for out in output_ids:
                assert (inp, out) in connections_set

    def test_full_with_bias_node(self):
        """Full + bias_node should add bias connections too."""
        genome = create_minimal_neat_genome(
            input_size=3, output_size=2, connectivity='full', bias_mode='bias_node'
        )
        # 3*2 input->output + 2 bias->output = 8
        assert len(genome.connections) == 8


class TestCurrentSparseConnectivity:
    """Tests documenting CURRENT sparse behavior (one input per output, inputs may repeat)."""

    def test_sparse_creates_output_count_connections(self):
        """Current sparse creates exactly output_size connections."""
        genome = create_minimal_neat_genome(
            input_size=7, output_size=3, connectivity='sparse'
        )
        assert len(genome.connections) == 3

    def test_sparse_each_output_has_one_connection(self):
        """Each output should have exactly one incoming connection."""
        genome = create_minimal_neat_genome(
            input_size=7, output_size=5, connectivity='sparse'
        )

        output_ids = {n.id for n in genome.neurons if n.type == 'output'}

        # Count incoming connections per output
        incoming_count = Counter(c.to_node for c in genome.connections)

        for out_id in output_ids:
            assert incoming_count[out_id] == 1, f"Output {out_id} should have exactly 1 connection"

    def test_sparse_inputs_can_be_reused(self):
        """Current sparse allows same input to connect to multiple outputs."""
        # Run multiple times to catch the random behavior
        random.seed(42)
        reuse_found = False

        for _ in range(20):
            genome = create_minimal_neat_genome(
                input_size=7, output_size=5, connectivity='sparse'
            )

            # Count how many times each input is used
            from_counts = Counter(c.from_node for c in genome.connections)

            if any(count > 1 for count in from_counts.values()):
                reuse_found = True
                break

        # With 7 inputs and 5 outputs, reuse should happen sometimes
        assert reuse_found, "Expected to find input reuse in sparse mode"

    def test_sparse_some_inputs_may_be_unused(self):
        """Current sparse may leave some inputs with no connections."""
        random.seed(42)
        unused_found = False

        for _ in range(20):
            genome = create_minimal_neat_genome(
                input_size=7, output_size=3, connectivity='sparse'
            )

            input_ids = {n.id for n in genome.neurons if n.type == 'input'}
            used_inputs = {c.from_node for c in genome.connections}
            unused_inputs = input_ids - used_inputs

            if len(unused_inputs) > 0:
                unused_found = True
                break

        # With 7 inputs and 3 outputs, some inputs should be unused
        assert unused_found, "Expected to find unused inputs in sparse mode"


class TestSparseInputsConnectivity:
    """Tests for sparse_inputs connectivity mode (one output per input)."""

    def test_sparse_inputs_creates_input_count_connections(self):
        """sparse_inputs creates exactly input_size connections."""
        genome = create_minimal_neat_genome(
            input_size=7, output_size=3, connectivity='sparse_inputs'
        )
        # 7 inputs = 7 connections
        assert len(genome.connections) == 7

    def test_sparse_inputs_each_input_has_one_connection(self):
        """Each input should have exactly one outgoing connection."""
        genome = create_minimal_neat_genome(
            input_size=5, output_size=3, connectivity='sparse_inputs'
        )

        input_ids = {n.id for n in genome.neurons if n.type == 'input'}

        # Count outgoing connections per input
        outgoing_count = Counter(c.from_node for c in genome.connections)

        for inp_id in input_ids:
            assert outgoing_count[inp_id] == 1, f"Input {inp_id} should have exactly 1 connection"

    def test_sparse_inputs_outputs_can_have_multiple(self):
        """sparse_inputs allows outputs to receive multiple connections."""
        random.seed(42)
        multiple_found = False

        for _ in range(20):
            genome = create_minimal_neat_genome(
                input_size=7, output_size=2, connectivity='sparse_inputs'
            )

            # Count incoming connections per output
            to_counts = Counter(c.to_node for c in genome.connections)

            if any(count > 1 for count in to_counts.values()):
                multiple_found = True
                break

        # With 7 inputs and 2 outputs, some outputs should get multiple
        assert multiple_found, "Expected to find outputs with multiple connections"

    def test_sparse_inputs_some_outputs_may_be_unused(self):
        """sparse_inputs may leave some outputs with no connections."""
        random.seed(42)
        unused_found = False

        for _ in range(20):
            genome = create_minimal_neat_genome(
                input_size=3, output_size=7, connectivity='sparse_inputs'
            )

            output_ids = {n.id for n in genome.neurons if n.type == 'output'}
            used_outputs = {c.to_node for c in genome.connections}
            unused_outputs = output_ids - used_outputs

            if len(unused_outputs) > 0:
                unused_found = True
                break

        # With 3 inputs and 7 outputs, some outputs should be unused
        assert unused_found, "Expected to find unused outputs in sparse_inputs mode"

    def test_sparse_inputs_with_bias_node(self):
        """sparse_inputs + bias_node should have input + output bias connections."""
        genome = create_minimal_neat_genome(
            input_size=5, output_size=3, connectivity='sparse_inputs', bias_mode='bias_node'
        )
        # 5 input->output + 3 bias->output = 8
        assert len(genome.connections) == 8


class TestSparseOutputsConnectivity:
    """Tests for sparse_outputs connectivity mode (one input per output)."""

    def test_sparse_outputs_creates_output_count_connections(self):
        """sparse_outputs creates exactly output_size connections."""
        genome = create_minimal_neat_genome(
            input_size=7, output_size=3, connectivity='sparse_outputs'
        )
        assert len(genome.connections) == 3

    def test_sparse_outputs_each_output_has_one_connection(self):
        """Each output should have exactly one incoming connection."""
        genome = create_minimal_neat_genome(
            input_size=7, output_size=5, connectivity='sparse_outputs'
        )

        output_ids = {n.id for n in genome.neurons if n.type == 'output'}

        incoming_count = Counter(c.to_node for c in genome.connections)

        for out_id in output_ids:
            assert incoming_count[out_id] == 1

    def test_sparse_outputs_backward_compat_with_sparse(self):
        """'sparse' should behave identically to 'sparse_outputs'."""
        random.seed(123)
        genome_sparse = create_minimal_neat_genome(
            input_size=5, output_size=3, connectivity='sparse'
        )

        random.seed(123)
        genome_sparse_outputs = create_minimal_neat_genome(
            input_size=5, output_size=3, connectivity='sparse_outputs'
        )

        # Same number of connections
        assert len(genome_sparse.connections) == len(genome_sparse_outputs.connections)

        # Same connection pattern (with same seed)
        for c1, c2 in zip(genome_sparse.connections, genome_sparse_outputs.connections):
            assert c1.from_node == c2.from_node
            assert c1.to_node == c2.to_node


class TestNoneConnectivity:
    """Tests for none connectivity mode (no initial connections)."""

    def test_none_creates_zero_connections(self):
        """None mode should create no connections from inputs."""
        genome = create_minimal_neat_genome(
            input_size=5, output_size=3, connectivity='none'
        )
        assert len(genome.connections) == 0

    def test_none_with_bias_node_only_bias_connections(self):
        """None + bias_node should only have bias->output connections."""
        genome = create_minimal_neat_genome(
            input_size=5, output_size=3, connectivity='none', bias_mode='bias_node'
        )
        # Only bias->output connections (3)
        assert len(genome.connections) == 3

        # All connections should be from bias node (id=0)
        bias_id = 0
        for conn in genome.connections:
            assert conn.from_node == bias_id

    def test_none_forward_pass_works(self):
        """Forward pass should work with no connections (outputs = bias only)."""
        genome = create_minimal_neat_genome(
            input_size=3, output_size=2, connectivity='none', bias_mode='node',
            output_bias=-0.5
        )

        outputs = neat_forward(genome, [1.0, 0.5, -0.5])

        # With no connections and bias=-0.5, outputs should be tanh(-0.5) ≈ -0.462
        assert len(outputs) == 2
        for out in outputs:
            assert abs(out - (-0.462)) < 0.01


class TestConnectivityWithBiasNode:
    """Tests for connectivity modes combined with bias_node mode."""

    def test_full_bias_node_connection_count(self):
        """Full + bias_node: input*output + output bias connections."""
        genome = create_minimal_neat_genome(
            input_size=4, output_size=3, connectivity='full', bias_mode='bias_node'
        )
        # 4*3 + 3 = 15
        assert len(genome.connections) == 15

    def test_sparse_bias_node_connection_count(self):
        """Sparse + bias_node: output + output bias connections."""
        genome = create_minimal_neat_genome(
            input_size=7, output_size=3, connectivity='sparse', bias_mode='bias_node'
        )
        # 3 sparse + 3 bias = 6
        assert len(genome.connections) == 6

    def test_none_bias_node_connection_count(self):
        """None + bias_node: only bias connections."""
        genome = create_minimal_neat_genome(
            input_size=7, output_size=3, connectivity='none', bias_mode='bias_node'
        )
        # 0 sparse + 3 bias = 3
        assert len(genome.connections) == 3


class TestTopologicalSortWithConnectivityModes:
    """Tests that topological sort works with all connectivity modes."""

    def test_topological_sort_full(self):
        """Topological sort should work with full connectivity."""
        genome = create_minimal_neat_genome(
            input_size=5, output_size=3, connectivity='full'
        )
        eval_order = topological_sort(genome)
        assert len(eval_order) == 3  # Only outputs (no hidden)

    def test_topological_sort_sparse(self):
        """Topological sort should work with sparse connectivity."""
        genome = create_minimal_neat_genome(
            input_size=5, output_size=3, connectivity='sparse'
        )
        eval_order = topological_sort(genome)
        assert len(eval_order) == 3

    def test_topological_sort_none(self):
        """Topological sort should work with no connectivity."""
        genome = create_minimal_neat_genome(
            input_size=5, output_size=3, connectivity='none'
        )
        eval_order = topological_sort(genome)
        assert len(eval_order) == 3

    def test_topological_sort_with_bias_node(self):
        """Topological sort should exclude bias neurons."""
        genome = create_minimal_neat_genome(
            input_size=5, output_size=3, connectivity='sparse', bias_mode='bias_node'
        )
        eval_order = topological_sort(genome)
        # Should only have outputs, not bias
        assert len(eval_order) == 3

        bias_ids = {n.id for n in genome.neurons if n.type == 'bias'}
        for neuron_id in eval_order:
            assert neuron_id not in bias_ids


class TestForwardPassWithConnectivityModes:
    """Tests that forward pass works correctly with all connectivity modes."""

    def test_forward_full_responds_to_all_inputs(self):
        """Full connectivity should respond to all inputs."""
        genome = create_minimal_neat_genome(
            input_size=3, output_size=2, connectivity='full', output_bias=0.0
        )

        # All zeros
        out1 = neat_forward(genome, [0.0, 0.0, 0.0])

        # Change one input
        out2 = neat_forward(genome, [1.0, 0.0, 0.0])

        # Outputs should change
        assert out1 != out2

    def test_forward_sparse_may_not_respond_to_all_inputs(self):
        """Sparse connectivity may not respond to some inputs."""
        random.seed(123)  # For reproducibility

        genome = create_minimal_neat_genome(
            input_size=5, output_size=2, connectivity='sparse', output_bias=0.0
        )

        # Find which inputs are connected
        connected_inputs = {c.from_node for c in genome.connections}
        input_neurons = [n for n in genome.neurons if n.type == 'input']
        input_ids = [n.id for n in sorted(input_neurons, key=lambda n: n.id)]

        base_inputs = [0.0] * 5
        base_outputs = neat_forward(genome, base_inputs)

        # Changing an unconnected input should not change outputs
        for i, inp_id in enumerate(input_ids):
            if inp_id not in connected_inputs:
                modified_inputs = base_inputs.copy()
                modified_inputs[i] = 1.0
                modified_outputs = neat_forward(genome, modified_inputs)
                assert base_outputs == modified_outputs, \
                    f"Changing unconnected input {i} should not affect outputs"

    def test_forward_none_ignores_all_inputs(self):
        """None connectivity should ignore all inputs (outputs from bias only)."""
        genome = create_minimal_neat_genome(
            input_size=3, output_size=2, connectivity='none', output_bias=-0.5
        )

        out1 = neat_forward(genome, [0.0, 0.0, 0.0])
        out2 = neat_forward(genome, [1.0, 1.0, 1.0])
        out3 = neat_forward(genome, [-1.0, 0.5, 0.0])

        # All outputs should be identical (only bias affects them)
        assert out1 == out2 == out3


class TestEdgeCases:
    """Edge cases for connectivity modes."""

    def test_single_input_single_output_full(self):
        """Full with 1 input, 1 output should have 1 connection."""
        genome = create_minimal_neat_genome(
            input_size=1, output_size=1, connectivity='full'
        )
        assert len(genome.connections) == 1

    def test_single_input_single_output_sparse(self):
        """Sparse with 1 input, 1 output should have 1 connection."""
        genome = create_minimal_neat_genome(
            input_size=1, output_size=1, connectivity='sparse'
        )
        assert len(genome.connections) == 1

    def test_single_input_single_output_none(self):
        """None with 1 input, 1 output should have 0 connections."""
        genome = create_minimal_neat_genome(
            input_size=1, output_size=1, connectivity='none'
        )
        assert len(genome.connections) == 0

    def test_many_inputs_few_outputs_sparse(self):
        """Sparse with many inputs, few outputs should only use few inputs."""
        genome = create_minimal_neat_genome(
            input_size=100, output_size=3, connectivity='sparse'
        )
        # Should have exactly 3 connections (one per output)
        assert len(genome.connections) == 3

        # At most 3 inputs used
        used_inputs = {c.from_node for c in genome.connections}
        assert len(used_inputs) <= 3

    def test_few_inputs_many_outputs_sparse(self):
        """Sparse with few inputs, many outputs will reuse inputs heavily."""
        genome = create_minimal_neat_genome(
            input_size=2, output_size=10, connectivity='sparse'
        )
        # Should have exactly 10 connections
        assert len(genome.connections) == 10

        # Only 2 possible inputs, so heavy reuse
        used_inputs = {c.from_node for c in genome.connections}
        assert len(used_inputs) <= 2
