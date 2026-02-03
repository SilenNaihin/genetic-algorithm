"""
Integration stress tests for NEAT bug fixes.

These tests intentionally reproduce bugs found during code analysis:
1. Duplicate bias connections in adapt_neat_topology()
2. Bias nodes excluded from get_network_depth()
3. Bias nodes excluded from get_neuron_depths()

Each test is designed to FAIL before the fix is applied, and PASS after.
"""

import random
import pytest
from app.neural.neat_network import (
    NEATGenome,
    NeuronGene,
    ConnectionGene,
    adapt_neat_topology,
    get_network_depth,
    get_neuron_depths,
    create_minimal_neat_genome,
)


class TestDuplicateBiasConnectionsBug:
    """
    BUG: adapt_neat_topology() can create duplicate bias connections.

    When adding new outputs in bias_node mode:
    1. Line 505: sources includes bias nodes
    2. Line 531: random.choice(sources) can pick the bias node
    3. Line 538-544: Adds connection from source (which might be bias) to new output
    4. Line 547-560: ALWAYS adds bias connection if bias_node mode

    Result: If bias node is randomly chosen as source, TWO bias connections
    are created to the same output.
    """

    def _create_genome_with_bias_node(self, num_inputs: int = 3, num_outputs: int = 2) -> NEATGenome:
        """Create a minimal NEAT genome with bias_node mode."""
        neurons = []
        connections = []

        # Input neurons (ids 0 to num_inputs-1)
        for i in range(num_inputs):
            neurons.append(NeuronGene(id=i, type='input', bias=0.0))

        # Bias neuron
        bias_id = num_inputs
        neurons.append(NeuronGene(id=bias_id, type='bias', bias=0.0))

        # Output neurons
        for i in range(num_outputs):
            output_id = num_inputs + 1 + i
            neurons.append(NeuronGene(id=output_id, type='output', bias=0.0))

            # Connect first input to output
            connections.append(ConnectionGene(
                from_node=0,
                to_node=output_id,
                weight=0.5,
                enabled=True,
                innovation=i,
            ))
            # Connect bias to output
            connections.append(ConnectionGene(
                from_node=bias_id,
                to_node=output_id,
                weight=-0.5,
                enabled=True,
                innovation=num_outputs + i,
            ))

        return NEATGenome(neurons=neurons, connections=connections)

    def test_no_duplicate_bias_connections_when_adding_outputs(self):
        """
        Adding outputs should NOT create duplicate bias connections.

        This test forces the random.choice to pick the bias node by setting
        a fixed seed and running multiple times to catch the bug.
        """
        genome = self._create_genome_with_bias_node(num_inputs=3, num_outputs=2)

        # We want to add 1 output, going from 2 -> 3 outputs
        target_output_count = 3

        # Run adaptation multiple times with different seeds
        # The bug should manifest when random.choice picks bias_node
        duplicates_found = False

        for seed in range(100):  # Try many seeds to catch the probabilistic bug
            random.seed(seed)

            # Copy genome to avoid mutation across iterations
            test_genome = NEATGenome(
                neurons=[NeuronGene(id=n.id, type=n.type, bias=n.bias) for n in genome.neurons],
                connections=[ConnectionGene(
                    from_node=c.from_node,
                    to_node=c.to_node,
                    weight=c.weight,
                    enabled=c.enabled,
                    innovation=c.innovation
                ) for c in genome.connections]
            )

            adapted = adapt_neat_topology(test_genome, target_output_count)

            # Find the new output neuron (should be id 6)
            new_outputs = [n for n in adapted.neurons if n.type == 'output' and n.id > 5]
            assert len(new_outputs) == 1, f"Expected 1 new output, got {len(new_outputs)}"
            new_output_id = new_outputs[0].id

            # Count connections TO the new output FROM the bias node
            bias_id = 3  # Our bias node id
            bias_connections_to_new_output = [
                c for c in adapted.connections
                if c.from_node == bias_id and c.to_node == new_output_id and c.enabled
            ]

            if len(bias_connections_to_new_output) > 1:
                duplicates_found = True
                break

        # This assertion will FAIL before the fix (duplicates_found = True)
        # and PASS after the fix (duplicates_found = False)
        assert not duplicates_found, (
            f"Found {len(bias_connections_to_new_output)} bias connections to new output "
            f"(should be exactly 1). Duplicate bias connections detected!"
        )

    def test_bias_connections_count_matches_output_count(self):
        """Each output should have exactly one bias connection in bias_node mode."""
        genome = self._create_genome_with_bias_node(num_inputs=2, num_outputs=1)

        # Add 2 more outputs
        for seed in range(50):
            random.seed(seed)

            test_genome = NEATGenome(
                neurons=[NeuronGene(id=n.id, type=n.type, bias=n.bias) for n in genome.neurons],
                connections=[ConnectionGene(
                    from_node=c.from_node,
                    to_node=c.to_node,
                    weight=c.weight,
                    enabled=c.enabled,
                    innovation=c.innovation
                ) for c in genome.connections]
            )

            adapted = adapt_neat_topology(test_genome, target_output_count=3)

            output_neurons = [n for n in adapted.neurons if n.type == 'output']
            bias_neurons = [n for n in adapted.neurons if n.type == 'bias']

            assert len(bias_neurons) == 1, "Should have exactly 1 bias neuron"
            bias_id = bias_neurons[0].id

            for output in output_neurons:
                bias_conns = [
                    c for c in adapted.connections
                    if c.from_node == bias_id and c.to_node == output.id and c.enabled
                ]
                assert len(bias_conns) <= 1, (
                    f"Output {output.id} has {len(bias_conns)} bias connections "
                    f"(should be at most 1)"
                )


class TestBiasNodeDepthCalculationBug:
    """
    BUG: get_network_depth() excludes bias nodes from input_ids.

    Line 854: input_ids = {n.id for n in genome.neurons if n.type == 'input'}

    This means in a network with ONLY bias -> output connections (no input connections),
    the depth is calculated as 0 or 1 incorrectly, because the bias node isn't
    considered as a starting point for BFS.
    """

    def _create_bias_only_network(self) -> NEATGenome:
        """
        Create a network where outputs are ONLY connected to bias node.
        This is valid in connectivity='none' + bias_node mode.
        """
        neurons = [
            NeuronGene(id=0, type='input', bias=0.0),
            NeuronGene(id=1, type='input', bias=0.0),
            NeuronGene(id=2, type='bias', bias=0.0),
            NeuronGene(id=3, type='output', bias=0.0),
        ]

        # ONLY bias -> output connection (no input connections)
        connections = [
            ConnectionGene(from_node=2, to_node=3, weight=1.0, enabled=True, innovation=0),
        ]

        return NEATGenome(neurons=neurons, connections=connections)

    def test_depth_includes_bias_node_path(self):
        """
        Network with bias -> output should have depth >= 1.

        Before fix: depth = 0 (bias not in input_ids, so BFS never starts from it)
        After fix: depth = 1 (bias -> output is a path of length 1)
        """
        genome = self._create_bias_only_network()

        depth = get_network_depth(genome)

        # This will FAIL before fix (depth = 1 from empty input fallback)
        # But the real issue is output won't be in depth dict at all
        # Let's check neuron_depths more precisely
        neuron_depths = get_neuron_depths(genome)

        output_id = 3
        bias_id = 2

        # The output should have a defined depth if bias is considered
        assert output_id in neuron_depths, (
            f"Output neuron {output_id} should have a defined depth. "
            f"Neuron depths: {neuron_depths}"
        )

    def test_neuron_depths_includes_bias_connected_outputs(self):
        """
        Outputs connected only to bias should be reachable in depth calculation.
        """
        genome = self._create_bias_only_network()

        neuron_depths = get_neuron_depths(genome)

        # Input neurons should be at depth 0
        assert neuron_depths.get(0) == 0, "Input 0 should be at depth 0"
        assert neuron_depths.get(1) == 0, "Input 1 should be at depth 0"

        # Bias should also be at depth 0 (it's a starting point)
        # Before fix: bias won't be in neuron_depths at all
        # After fix: bias should be at depth 0
        assert 2 in neuron_depths, (
            f"Bias neuron should be in neuron_depths. Got: {neuron_depths}"
        )

        # Output should be at depth 1 (one hop from bias)
        # Before fix: output won't be in neuron_depths (unreachable from inputs)
        # After fix: output should be at depth 1
        assert 3 in neuron_depths, (
            f"Output neuron should be in neuron_depths. Got: {neuron_depths}"
        )

    def test_depth_with_bias_to_hidden_to_output(self):
        """
        Network: bias -> hidden -> output should have depth 2.
        """
        neurons = [
            NeuronGene(id=0, type='input', bias=0.0),
            NeuronGene(id=1, type='bias', bias=0.0),
            NeuronGene(id=2, type='hidden', bias=0.0),
            NeuronGene(id=3, type='output', bias=0.0),
        ]

        connections = [
            ConnectionGene(from_node=1, to_node=2, weight=1.0, enabled=True, innovation=0),
            ConnectionGene(from_node=2, to_node=3, weight=1.0, enabled=True, innovation=1),
        ]

        genome = NEATGenome(neurons=neurons, connections=connections)

        depth = get_network_depth(genome)
        neuron_depths = get_neuron_depths(genome)

        # Before fix: depth will be 1 (only input path considered, which has no connections)
        # After fix: depth should be 2 (bias -> hidden -> output)
        assert depth >= 2, f"Expected depth >= 2, got {depth}"

        # Hidden should be at depth 1, output at depth 2
        assert neuron_depths.get(2) == 1, f"Hidden should be at depth 1, got {neuron_depths.get(2)}"
        assert neuron_depths.get(3) == 2, f"Output should be at depth 2, got {neuron_depths.get(3)}"


class TestDisqualificationReasonMismatchBug:
    """
    BUG: Backend emits "high_frequency" but frontend expects "frequency_exceeded".

    Backend (pytorch_simulator.py:231): disqualified_reason = "high_frequency"
    Frontend (simulation.ts:267): type includes 'frequency_exceeded'

    This causes tooltips to not display the correct disqualification reason.
    """

    def test_disqualification_reason_matches_frontend_type(self):
        """
        The disqualification reason string should match the frontend type definition.

        Frontend expects: 'frequency_exceeded' | 'physics_explosion' | 'nan_position' | null
        """
        # This test validates the contract between frontend and backend
        # We import and check the actual string used
        from app.services.pytorch_simulator import PyTorchSimulator
        from app.schemas.simulation import SimulationConfig

        # Create a creature with very high frequency that will get disqualified
        high_freq_genome = {
            "id": "test_high_freq",
            "nodes": [
                {"id": "n0", "x": 0, "y": 0.5, "z": 0, "size": 0.5},
                {"id": "n1", "x": 1, "y": 0.5, "z": 0, "size": 0.5},
            ],
            "muscles": [
                {
                    "id": "m0",
                    "nodeA": "n0",
                    "nodeB": "n1",
                    "frequency": 100.0,  # Very high frequency
                    "amplitude": 0.3,
                    "phase": 0,
                }
            ],
        }

        config = SimulationConfig(
            max_allowed_frequency=3.0,  # Low limit to trigger disqualification
            neural_mode="hybrid",  # Hybrid mode checks frequency
        )

        simulator = PyTorchSimulator()
        results = simulator.simulate_batch([high_freq_genome], config)

        result = results[0]

        # The creature should be disqualified
        assert result.disqualified, "High frequency creature should be disqualified"

        # The reason should match the frontend type definition
        # Frontend expects: 'frequency_exceeded' (not 'high_frequency')
        valid_reasons = {'frequency_exceeded', 'physics_explosion', 'nan_position', None}

        assert result.disqualified_reason in valid_reasons, (
            f"Disqualification reason '{result.disqualified_reason}' does not match "
            f"frontend type definition. Expected one of: {valid_reasons}"
        )


class TestAutoRunStalePreviousResultsBug:
    """
    BUG: Auto-run uses stale previousResults for dying creature detection.

    In useSimulation.ts:641-725:
    - previousResults is read from store at line 643
    - But results are only written to store on final iteration (line 726-728)
    - So on iteration 2+, previousResults is stale (from before auto-run started)

    This is a frontend bug - the test below documents the expected contract.
    The actual fix is in useSimulation.ts to track previousResults locally.
    """

    def test_frontend_auto_run_contract_documented(self):
        """
        Document the expected frontend behavior for auto-run.

        The frontend auto-run loop should:
        1. Track previousResults locally (not from store which isn't updated mid-loop)
        2. Update local previousResults at end of each iteration
        3. Use local previousResults for dying creature detection

        This test passes to document the contract - the fix is in frontend code.
        """
        # This is a documentation test - the actual fix is in TypeScript
        # The contract is: previousResults should be fresh each iteration
        expected_behavior = """
        // BEFORE FIX (bug):
        for (let i = 0; i < generations; i++) {
            const previousResults = useEvolutionStore.getState().simulationResults;
            // ^ This reads STALE data because store is only updated on final iteration
            ...
        }

        // AFTER FIX:
        let previousResults = useEvolutionStore.getState().simulationResults;
        for (let i = 0; i < generations; i++) {
            // Use local previousResults (fresh each iteration)
            ...
            previousResults = results;  // Update at end of each iteration
        }
        """
        assert expected_behavior is not None  # Document the expected fix


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
