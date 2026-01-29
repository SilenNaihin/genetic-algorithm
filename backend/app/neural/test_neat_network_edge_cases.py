"""
Edge case and stress tests for NEAT network forward pass.

These tests intentionally try to break the implementation by exploring
boundary conditions, numerical edge cases, and integration scenarios.

IMPORTANT: Run these tests before AND after any optimization to verify correctness.
"""

import math
import pytest
import torch

from app.schemas.neat import (
    ConnectionGene,
    InnovationCounter,
    NEATGenome,
    NeuronGene,
)
from app.neural.neat_network import (
    create_minimal_neat_genome,
    neat_forward,
    neat_forward_full,
    topological_sort,
    NEATBatchedNetwork,
    would_create_cycle,
    get_network_depth,
    ACTIVATIONS,
)


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def minimal_2in_1out() -> NEATGenome:
    """Minimal network: 2 inputs -> 1 output, full connectivity."""
    return NEATGenome(
        neurons=[
            NeuronGene(id=0, type='input'),
            NeuronGene(id=1, type='input'),
            NeuronGene(id=2, type='output', bias=-0.5),
        ],
        connections=[
            ConnectionGene(from_node=0, to_node=2, weight=0.5, innovation=0),
            ConnectionGene(from_node=1, to_node=2, weight=-0.3, innovation=1),
        ],
    )


@pytest.fixture
def genome_with_hidden() -> NEATGenome:
    """Network with one hidden neuron: 2 inputs -> 1 hidden -> 1 output."""
    return NEATGenome(
        neurons=[
            NeuronGene(id=0, type='input'),
            NeuronGene(id=1, type='input'),
            NeuronGene(id=3, type='hidden', bias=0.0, innovation=0),
            NeuronGene(id=2, type='output', bias=-0.5),
        ],
        connections=[
            ConnectionGene(from_node=0, to_node=3, weight=1.0, innovation=0),
            ConnectionGene(from_node=1, to_node=3, weight=1.0, innovation=1),
            ConnectionGene(from_node=3, to_node=2, weight=1.0, innovation=2),
        ],
    )


@pytest.fixture
def complex_genome() -> NEATGenome:
    """Complex network with multiple hidden layers."""
    return NEATGenome(
        neurons=[
            NeuronGene(id=0, type='input'),
            NeuronGene(id=1, type='input'),
            NeuronGene(id=2, type='input'),
            NeuronGene(id=10, type='hidden', bias=0.1, innovation=0),
            NeuronGene(id=11, type='hidden', bias=-0.1, innovation=1),
            NeuronGene(id=12, type='hidden', bias=0.0, innovation=2),
            NeuronGene(id=3, type='output', bias=-0.5),
            NeuronGene(id=4, type='output', bias=-0.5),
        ],
        connections=[
            # Input to hidden layer 1
            ConnectionGene(from_node=0, to_node=10, weight=0.5, innovation=0),
            ConnectionGene(from_node=1, to_node=10, weight=-0.5, innovation=1),
            ConnectionGene(from_node=1, to_node=11, weight=0.8, innovation=2),
            ConnectionGene(from_node=2, to_node=11, weight=0.3, innovation=3),
            # Hidden layer 1 to hidden layer 2
            ConnectionGene(from_node=10, to_node=12, weight=1.0, innovation=4),
            ConnectionGene(from_node=11, to_node=12, weight=-0.5, innovation=5),
            # Hidden to outputs
            ConnectionGene(from_node=12, to_node=3, weight=0.7, innovation=6),
            ConnectionGene(from_node=10, to_node=4, weight=0.4, innovation=7),
            ConnectionGene(from_node=11, to_node=4, weight=0.6, innovation=8),
        ],
    )


# =============================================================================
# Numerical Edge Cases
# =============================================================================

class TestNumericalEdgeCases:
    """Tests for numerical stability and edge cases."""

    def test_zero_inputs(self, minimal_2in_1out: NEATGenome):
        """Zero inputs should produce bias-only output."""
        outputs = neat_forward(minimal_2in_1out, [0.0, 0.0])
        # Output = tanh(bias) = tanh(-0.5) ≈ -0.462
        assert len(outputs) == 1
        expected = math.tanh(-0.5)
        assert abs(outputs[0] - expected) < 1e-6

    def test_large_positive_inputs(self, minimal_2in_1out: NEATGenome):
        """Large positive inputs should saturate to ±1."""
        outputs = neat_forward(minimal_2in_1out, [1000.0, 1000.0])
        assert len(outputs) == 1
        # With large inputs, tanh saturates near ±1
        assert -1.0 <= outputs[0] <= 1.0

    def test_large_negative_inputs(self, minimal_2in_1out: NEATGenome):
        """Large negative inputs should saturate to ±1."""
        outputs = neat_forward(minimal_2in_1out, [-1000.0, -1000.0])
        assert len(outputs) == 1
        assert -1.0 <= outputs[0] <= 1.0

    def test_very_small_inputs(self, minimal_2in_1out: NEATGenome):
        """Very small inputs close to zero."""
        outputs = neat_forward(minimal_2in_1out, [1e-10, 1e-10])
        assert len(outputs) == 1
        # Should be approximately tanh(bias)
        expected = math.tanh(-0.5)
        assert abs(outputs[0] - expected) < 0.01

    def test_mixed_extreme_inputs(self, minimal_2in_1out: NEATGenome):
        """Mixed large positive and negative inputs."""
        outputs = neat_forward(minimal_2in_1out, [1000.0, -1000.0])
        assert len(outputs) == 1
        assert -1.0 <= outputs[0] <= 1.0

    def test_inf_inputs_handled(self, minimal_2in_1out: NEATGenome):
        """Infinity inputs should not crash, produce finite output."""
        outputs = neat_forward(minimal_2in_1out, [float('inf'), 0.0])
        assert len(outputs) == 1
        # tanh(inf) = 1.0, so should be near 1 or -1
        assert math.isfinite(outputs[0])

    def test_negative_inf_inputs_handled(self, minimal_2in_1out: NEATGenome):
        """Negative infinity inputs should produce finite output."""
        outputs = neat_forward(minimal_2in_1out, [float('-inf'), 0.0])
        assert len(outputs) == 1
        assert math.isfinite(outputs[0])

    def test_weights_cancel_out(self, minimal_2in_1out: NEATGenome):
        """Equal and opposite weighted inputs should cancel."""
        # Modify genome to have canceling weights
        minimal_2in_1out.connections[0].weight = 1.0
        minimal_2in_1out.connections[1].weight = -1.0
        outputs = neat_forward(minimal_2in_1out, [1.0, 1.0])
        # Should be tanh(bias) since inputs cancel
        expected = math.tanh(-0.5)
        assert abs(outputs[0] - expected) < 1e-6


# =============================================================================
# Boundary Conditions
# =============================================================================

class TestBoundaryConditions:
    """Tests for edge values and boundaries."""

    def test_single_input_single_output(self):
        """Minimal possible network: 1 input -> 1 output."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
        )
        outputs = neat_forward(genome, [0.5])
        assert len(outputs) == 1
        expected = math.tanh(0.5)
        assert abs(outputs[0] - expected) < 1e-6

    def test_no_connections(self):
        """Network with no connections - outputs depend only on bias."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=-0.5),
            ],
            connections=[],
        )
        outputs = neat_forward(genome, [1.0])
        expected = math.tanh(-0.5)
        assert abs(outputs[0] - expected) < 1e-6

    def test_all_connections_disabled(self, minimal_2in_1out: NEATGenome):
        """All connections disabled - equivalent to no connections."""
        for conn in minimal_2in_1out.connections:
            conn.enabled = False
        outputs = neat_forward(minimal_2in_1out, [1.0, 1.0])
        expected = math.tanh(-0.5)  # Just bias
        assert abs(outputs[0] - expected) < 1e-6

    def test_zero_weight_connections(self, minimal_2in_1out: NEATGenome):
        """Zero weight connections have no effect."""
        for conn in minimal_2in_1out.connections:
            conn.weight = 0.0
        outputs = neat_forward(minimal_2in_1out, [1.0, 1.0])
        expected = math.tanh(-0.5)  # Just bias
        assert abs(outputs[0] - expected) < 1e-6

    def test_many_outputs(self):
        """Network with many output neurons."""
        num_outputs = 15  # Max muscles
        neurons = [NeuronGene(id=0, type='input')]
        connections = []
        for i in range(num_outputs):
            neurons.append(NeuronGene(id=i+1, type='output', bias=-0.1 * i))
            connections.append(ConnectionGene(
                from_node=0, to_node=i+1, weight=0.1 * i, innovation=i
            ))
        genome = NEATGenome(neurons=neurons, connections=connections)
        outputs = neat_forward(genome, [1.0])
        assert len(outputs) == num_outputs
        for out in outputs:
            assert -1.0 <= out <= 1.0

    def test_many_hidden_neurons(self):
        """Network with many hidden neurons."""
        num_hidden = 16  # Max hidden for NEAT
        neurons = [
            NeuronGene(id=0, type='input'),
            NeuronGene(id=1, type='input'),
        ]
        connections = []
        inn = 0

        # Hidden layer
        for i in range(num_hidden):
            neurons.append(NeuronGene(id=10+i, type='hidden', bias=0.0, innovation=i))
            connections.append(ConnectionGene(from_node=0, to_node=10+i, weight=0.1, innovation=inn))
            inn += 1
            connections.append(ConnectionGene(from_node=1, to_node=10+i, weight=0.1, innovation=inn))
            inn += 1

        # Output
        neurons.append(NeuronGene(id=100, type='output', bias=-0.5))
        for i in range(num_hidden):
            connections.append(ConnectionGene(from_node=10+i, to_node=100, weight=0.1, innovation=inn))
            inn += 1

        genome = NEATGenome(neurons=neurons, connections=connections)
        outputs = neat_forward(genome, [1.0, 1.0])
        assert len(outputs) == 1
        assert -1.0 <= outputs[0] <= 1.0

    def test_deep_network(self):
        """Network with many layers of hidden neurons."""
        depth = 5
        neurons = [
            NeuronGene(id=0, type='input'),
        ]
        connections = []
        inn = 0
        prev_id = 0

        for layer in range(depth):
            new_id = 10 + layer
            neurons.append(NeuronGene(id=new_id, type='hidden', bias=0.0, innovation=layer))
            connections.append(ConnectionGene(from_node=prev_id, to_node=new_id, weight=1.0, innovation=inn))
            inn += 1
            prev_id = new_id

        # Output
        neurons.append(NeuronGene(id=100, type='output', bias=0.0))
        connections.append(ConnectionGene(from_node=prev_id, to_node=100, weight=1.0, innovation=inn))

        genome = NEATGenome(neurons=neurons, connections=connections)
        outputs = neat_forward(genome, [0.5])
        assert len(outputs) == 1
        # After 5 layers of tanh(x), signal is significantly attenuated
        assert -1.0 <= outputs[0] <= 1.0


# =============================================================================
# Topological Sort Edge Cases
# =============================================================================

class TestTopologicalSort:
    """Tests for topological sort edge cases."""

    def test_simple_sort(self, minimal_2in_1out: NEATGenome):
        """Simple network has output neuron in eval order."""
        order = topological_sort(minimal_2in_1out)
        assert len(order) == 1  # Just output (inputs not included)
        assert 2 in order

    def test_hidden_before_output(self, genome_with_hidden: NEATGenome):
        """Hidden neuron must come before output in eval order."""
        order = topological_sort(genome_with_hidden)
        assert len(order) == 2  # hidden + output
        hidden_idx = order.index(3)
        output_idx = order.index(2)
        assert hidden_idx < output_idx

    def test_complex_ordering(self, complex_genome: NEATGenome):
        """Complex network maintains proper ordering."""
        order = topological_sort(complex_genome)
        # Build dependency graph
        deps = {}
        for conn in complex_genome.connections:
            if conn.enabled:
                if conn.to_node not in deps:
                    deps[conn.to_node] = set()
                deps[conn.to_node].add(conn.from_node)

        # Verify ordering - each neuron appears after all its dependencies
        seen = {0, 1, 2}  # Inputs are pre-set
        for neuron_id in order:
            if neuron_id in deps:
                for dep in deps[neuron_id]:
                    assert dep in seen, f"Neuron {neuron_id} depends on {dep} which hasn't been processed"
            seen.add(neuron_id)

    def test_disconnected_neurons(self):
        """Disconnected neurons should still be in eval order."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', bias=0.0, innovation=0),  # Disconnected!
                NeuronGene(id=2, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=0),
            ],
        )
        order = topological_sort(genome)
        # Both hidden and output should be in order
        assert 1 in order
        assert 2 in order


# =============================================================================
# Output Consistency Tests (Critical for optimization validation)
# =============================================================================

class TestOutputConsistency:
    """Tests to verify output consistency - run before AND after optimization."""

    def test_deterministic_output(self, minimal_2in_1out: NEATGenome):
        """Same inputs should always produce same outputs."""
        inputs = [0.5, -0.3]
        outputs1 = neat_forward(minimal_2in_1out, inputs)
        outputs2 = neat_forward(minimal_2in_1out, inputs)
        assert outputs1 == outputs2

    def test_output_range(self, complex_genome: NEATGenome):
        """All outputs should be in [-1, 1] for tanh activation."""
        for _ in range(100):
            inputs = [
                (torch.rand(1).item() * 2 - 1) * 10  # Random in [-10, 10]
                for _ in range(3)
            ]
            outputs = neat_forward(complex_genome, inputs)
            for out in outputs:
                assert -1.0 <= out <= 1.0, f"Output {out} out of range for inputs {inputs}"

    def test_known_output_values(self):
        """Test against pre-computed expected values."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
        )

        test_cases = [
            ([0.0], [math.tanh(0.0)]),
            ([1.0], [math.tanh(1.0)]),
            ([-1.0], [math.tanh(-1.0)]),
            ([0.5], [math.tanh(0.5)]),
        ]

        for inputs, expected in test_cases:
            outputs = neat_forward(genome, inputs)
            for out, exp in zip(outputs, expected):
                assert abs(out - exp) < 1e-6, f"Expected {exp}, got {out} for inputs {inputs}"

    def test_forward_full_matches_forward(self, complex_genome: NEATGenome):
        """forward_full should return same outputs as forward."""
        inputs = [0.5, -0.3, 0.7]
        outputs_simple = neat_forward(complex_genome, inputs)
        outputs_full = neat_forward_full(complex_genome, inputs)

        assert outputs_simple == outputs_full['outputs']


# =============================================================================
# Batched Network Tests
# =============================================================================

class TestNEATBatchedNetwork:
    """Tests for NEATBatchedNetwork wrapper."""

    @pytest.fixture
    def batch_genomes(self) -> list[NEATGenome]:
        """Create a batch of different genomes."""
        genomes = []
        for i in range(5):
            genome = create_minimal_neat_genome(
                input_size=7,
                output_size=3 + i,  # Variable output size
                output_bias=-0.5,
                innovation_counter=InnovationCounter(),
            )
            genomes.append(genome)
        return genomes

    def test_batch_forward(self, batch_genomes: list[NEATGenome]):
        """Batch forward should produce correct shapes."""
        num_muscles = [3, 4, 5, 6, 7]
        network = NEATBatchedNetwork(
            genomes=batch_genomes,
            num_muscles=num_muscles,
            max_muscles=15,
            device=torch.device('cpu'),
        )

        inputs = torch.randn(5, 7)
        outputs = network.forward(inputs)

        assert outputs.shape == (5, 15)
        # All outputs should be in valid range
        assert (outputs >= -1).all()
        assert (outputs <= 1).all()

    def test_batch_deterministic(self, batch_genomes: list[NEATGenome]):
        """Batch forward should be deterministic."""
        num_muscles = [3, 4, 5, 6, 7]
        network = NEATBatchedNetwork(
            genomes=batch_genomes,
            num_muscles=num_muscles,
            max_muscles=15,
            device=torch.device('cpu'),
        )

        inputs = torch.randn(5, 7)
        outputs1 = network.forward(inputs)
        outputs2 = network.forward(inputs)

        assert torch.allclose(outputs1, outputs2)

    def test_batch_matches_individual(self, batch_genomes: list[NEATGenome]):
        """Batch outputs should match individual forward passes."""
        num_muscles = [3, 4, 5, 6, 7]
        network = NEATBatchedNetwork(
            genomes=batch_genomes,
            num_muscles=num_muscles,
            max_muscles=15,
            device=torch.device('cpu'),
        )

        inputs = torch.randn(5, 7)
        batch_outputs = network.forward(inputs)

        for i, genome in enumerate(batch_genomes):
            individual_output = neat_forward(genome, inputs[i].tolist())
            for j in range(min(len(individual_output), num_muscles[i])):
                assert abs(batch_outputs[i, j].item() - individual_output[j]) < 1e-5

    def test_empty_batch(self):
        """Empty batch should not crash."""
        network = NEATBatchedNetwork(
            genomes=[],
            num_muscles=[],
            max_muscles=15,
            device=torch.device('cpu'),
        )
        assert network.batch_size == 0

    def test_single_creature_batch(self):
        """Single creature batch should work correctly."""
        genome = create_minimal_neat_genome(
            input_size=7,
            output_size=3,
            innovation_counter=InnovationCounter(),
        )
        network = NEATBatchedNetwork(
            genomes=[genome],
            num_muscles=[3],
            max_muscles=15,
            device=torch.device('cpu'),
        )

        inputs = torch.randn(1, 7)
        outputs = network.forward(inputs)

        assert outputs.shape == (1, 15)

    def test_dead_zone_zeroes_small_outputs(self):
        """Dead zone should zero small outputs."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),  # No bias, small output
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=0.01, innovation=0),
            ],
        )
        network = NEATBatchedNetwork(
            genomes=[genome],
            num_muscles=[1],
            max_muscles=15,
            device=torch.device('cpu'),
        )

        # Small input should produce small output
        inputs = torch.tensor([[0.1]])
        outputs_no_dz = network.forward(inputs)
        outputs_with_dz = network.forward_with_dead_zone(inputs, dead_zone=0.1)

        # Raw output should be very small (tanh(0.001) ≈ 0.001)
        assert abs(outputs_no_dz[0, 0].item()) < 0.1
        # Dead zone should zero it
        assert outputs_with_dz[0, 0].item() == 0.0


# =============================================================================
# Bias Mode Tests
# =============================================================================

class TestBiasModes:
    """Tests for different bias modes."""

    def test_node_bias_mode(self):
        """Node bias mode should add bias to each neuron."""
        genome = create_minimal_neat_genome(
            input_size=2,
            output_size=2,
            output_bias=-0.5,
            bias_mode='node',
        )

        # Check that output neurons have bias
        outputs = genome.get_output_neurons()
        for n in outputs:
            assert n.bias == -0.5

    def test_bias_node_mode(self):
        """Bias node mode should create a special bias neuron."""
        genome = create_minimal_neat_genome(
            input_size=2,
            output_size=2,
            output_bias=-0.5,
            bias_mode='bias_node',
        )

        # Check for bias neuron
        bias_neurons = [n for n in genome.neurons if n.type == 'bias']
        assert len(bias_neurons) == 1
        assert bias_neurons[0].id == 0

        # Output neurons should NOT have per-node bias in bias_node mode
        outputs = genome.get_output_neurons()
        for n in outputs:
            assert n.bias == 0.0

        # There should be connections from bias node to outputs
        bias_connections = [c for c in genome.connections if c.from_node == 0]
        assert len(bias_connections) >= 2

    def test_no_bias_mode(self):
        """No bias mode should have zero bias everywhere."""
        genome = create_minimal_neat_genome(
            input_size=2,
            output_size=2,
            output_bias=-0.5,  # This should be ignored
            bias_mode='none',
        )

        # No bias neurons
        bias_neurons = [n for n in genome.neurons if n.type == 'bias']
        assert len(bias_neurons) == 0

        # All neurons should have zero bias
        for n in genome.neurons:
            assert n.bias == 0.0


# =============================================================================
# Connectivity Mode Tests
# =============================================================================

class TestConnectivityModes:
    """Tests for different initial connectivity modes."""

    def test_full_connectivity(self):
        """Full connectivity should connect all inputs to all outputs."""
        genome = create_minimal_neat_genome(
            input_size=3,
            output_size=2,
            connectivity='full',
        )

        # Should have 3 * 2 = 6 connections
        assert len(genome.connections) == 6

        # Verify all pairs are connected
        input_ids = {n.id for n in genome.get_input_neurons()}
        output_ids = {n.id for n in genome.get_output_neurons()}

        connected_pairs = {(c.from_node, c.to_node) for c in genome.connections}
        for inp in input_ids:
            for out in output_ids:
                assert (inp, out) in connected_pairs

    def test_sparse_outputs_connectivity(self):
        """Sparse outputs should give each output one random input."""
        genome = create_minimal_neat_genome(
            input_size=5,
            output_size=3,
            connectivity='sparse_outputs',
        )

        # Should have exactly 3 connections (one per output)
        assert len(genome.connections) == 3

        # Each output should have exactly one incoming connection
        output_ids = {n.id for n in genome.get_output_neurons()}
        for out_id in output_ids:
            incoming = [c for c in genome.connections if c.to_node == out_id]
            assert len(incoming) == 1

    def test_sparse_inputs_connectivity(self):
        """Sparse inputs should give each input one random output."""
        genome = create_minimal_neat_genome(
            input_size=5,
            output_size=3,
            connectivity='sparse_inputs',
        )

        # Should have exactly 5 connections (one per input)
        assert len(genome.connections) == 5

        # Each input should have exactly one outgoing connection
        input_ids = {n.id for n in genome.get_input_neurons()}
        for inp_id in input_ids:
            outgoing = [c for c in genome.connections if c.from_node == inp_id]
            assert len(outgoing) == 1

    def test_no_connectivity(self):
        """No connectivity should have zero initial connections."""
        genome = create_minimal_neat_genome(
            input_size=5,
            output_size=3,
            connectivity='none',
        )

        # Should have zero connections
        assert len(genome.connections) == 0

        # Network should still work (outputs = bias only)
        outputs = neat_forward(genome, [1.0] * 5)
        assert len(outputs) == 3


# =============================================================================
# Activation Function Tests
# =============================================================================

class TestActivationFunctions:
    """Tests for different activation functions."""

    def test_tanh_activation(self):
        """Tanh should be the default and work correctly."""
        genome = create_minimal_neat_genome(
            input_size=1,
            output_size=1,
            activation='tanh',
        )
        genome.neurons[-1].bias = 0.0  # Clear bias for simple test
        genome.connections[0].weight = 1.0

        outputs = neat_forward(genome, [1.0])
        expected = math.tanh(1.0)
        assert abs(outputs[0] - expected) < 1e-6

    def test_relu_activation(self):
        """ReLU activation should work correctly."""
        genome = create_minimal_neat_genome(
            input_size=1,
            output_size=1,
            activation='relu',
        )
        genome.neurons[-1].bias = 0.0
        genome.connections[0].weight = 1.0

        # Positive input
        outputs = neat_forward(genome, [1.0])
        assert abs(outputs[0] - 1.0) < 1e-6

        # Negative input
        outputs = neat_forward(genome, [-1.0])
        assert abs(outputs[0] - 0.0) < 1e-6

    def test_sigmoid_activation(self):
        """Sigmoid activation should work correctly."""
        genome = create_minimal_neat_genome(
            input_size=1,
            output_size=1,
            activation='sigmoid',
        )
        genome.neurons[-1].bias = 0.0
        genome.connections[0].weight = 1.0

        outputs = neat_forward(genome, [0.0])
        expected = 1.0 / (1.0 + math.exp(0.0))  # sigmoid(0) = 0.5
        assert abs(outputs[0] - expected) < 1e-6


# =============================================================================
# Cycle Detection Tests
# =============================================================================

class TestCycleDetection:
    """Tests for cycle detection in feedforward networks."""

    def test_self_loop_detected(self, minimal_2in_1out: NEATGenome):
        """Self-loop should be detected as a cycle."""
        assert would_create_cycle(minimal_2in_1out, 2, 2) is True

    def test_valid_forward_connection(self, minimal_2in_1out: NEATGenome):
        """Valid forward connection should not be a cycle."""
        # Adding input -> output is valid (already exists but OK)
        assert would_create_cycle(minimal_2in_1out, 0, 2) is False
        assert would_create_cycle(minimal_2in_1out, 1, 2) is False

    def test_backward_connection_creates_cycle(self, minimal_2in_1out: NEATGenome):
        """Output -> input would create a cycle."""
        # Currently: inputs -> output
        # Adding output -> input would create cycle
        assert would_create_cycle(minimal_2in_1out, 2, 0) is True
        assert would_create_cycle(minimal_2in_1out, 2, 1) is True

    def test_indirect_cycle(self, genome_with_hidden: NEATGenome):
        """Indirect cycle through hidden should be detected."""
        # Currently: inputs -> hidden -> output
        # Adding output -> hidden would create cycle
        assert would_create_cycle(genome_with_hidden, 2, 3) is True


# =============================================================================
# Network Depth Tests
# =============================================================================

class TestNetworkDepth:
    """Tests for network depth calculation."""

    def test_direct_connection_depth(self, minimal_2in_1out: NEATGenome):
        """Direct input->output has depth 1."""
        depth = get_network_depth(minimal_2in_1out)
        assert depth == 1

    def test_hidden_increases_depth(self, genome_with_hidden: NEATGenome):
        """Hidden layer increases depth."""
        depth = get_network_depth(genome_with_hidden)
        assert depth == 2

    def test_deep_network_depth(self):
        """Deep network should report correct depth."""
        neurons = [NeuronGene(id=0, type='input')]
        connections = []

        # Chain of 5 hidden neurons
        for i in range(5):
            neurons.append(NeuronGene(id=i+1, type='hidden', innovation=i))
            connections.append(ConnectionGene(from_node=i, to_node=i+1, weight=1.0, innovation=i))

        # Output
        neurons.append(NeuronGene(id=6, type='output'))
        connections.append(ConnectionGene(from_node=5, to_node=6, weight=1.0, innovation=5))

        genome = NEATGenome(neurons=neurons, connections=connections)
        depth = get_network_depth(genome)
        assert depth == 6  # input(0) -> 5 hidden -> output


# =============================================================================
# Integration Stress Tests
# =============================================================================

class TestIntegrationStress:
    """High-level integration and stress tests."""

    def test_many_creatures_batch(self):
        """Test batch processing with many creatures."""
        batch_size = 100
        counter = InnovationCounter()

        genomes = []
        num_muscles = []
        for i in range(batch_size):
            n_muscles = 3 + (i % 10)  # 3-12 muscles
            genome = create_minimal_neat_genome(
                input_size=7,
                output_size=n_muscles,
                innovation_counter=counter,
            )
            genomes.append(genome)
            num_muscles.append(n_muscles)

        network = NEATBatchedNetwork(
            genomes=genomes,
            num_muscles=num_muscles,
            max_muscles=15,
            device=torch.device('cpu'),
        )

        inputs = torch.randn(batch_size, 7)
        outputs = network.forward(inputs)

        assert outputs.shape == (batch_size, 15)
        assert torch.isfinite(outputs).all()

    def test_repeated_forward_consistency(self):
        """Many repeated forwards should give consistent results."""
        genome = create_minimal_neat_genome(
            input_size=7,
            output_size=5,
            innovation_counter=InnovationCounter(),
        )

        fixed_inputs = [0.5, -0.3, 0.7, 0.1, -0.9, 0.2, 0.8]

        first_output = neat_forward(genome, fixed_inputs)

        for _ in range(100):
            output = neat_forward(genome, fixed_inputs)
            assert output == first_output

    def test_varied_topology_batch(self):
        """Batch with varied topologies should work."""
        counter = InnovationCounter()
        genomes = []
        num_muscles = []

        # Simple genome
        g1 = create_minimal_neat_genome(
            input_size=7,
            output_size=3,
            connectivity='full',
            innovation_counter=counter,
        )
        genomes.append(g1)
        num_muscles.append(3)

        # Sparse genome
        g2 = create_minimal_neat_genome(
            input_size=7,
            output_size=5,
            connectivity='sparse_outputs',
            innovation_counter=counter,
        )
        genomes.append(g2)
        num_muscles.append(5)

        # No connections
        g3 = create_minimal_neat_genome(
            input_size=7,
            output_size=4,
            connectivity='none',
            innovation_counter=counter,
        )
        genomes.append(g3)
        num_muscles.append(4)

        network = NEATBatchedNetwork(
            genomes=genomes,
            num_muscles=num_muscles,
            max_muscles=15,
            device=torch.device('cpu'),
        )

        inputs = torch.randn(3, 7)
        outputs = network.forward(inputs)

        assert outputs.shape == (3, 15)
        assert torch.isfinite(outputs).all()
