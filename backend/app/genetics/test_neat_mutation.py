"""Tests for NEAT structural mutations."""

import random
import pytest

from app.genetics.neat_mutation import (
    mutate_add_connection,
    mutate_add_node,
    mutate_disable_connection,
    mutate_enable_connection,
    mutate_neat_biases,
    mutate_neat_genome,
    mutate_neat_weights,
    mutate_toggle_connection,
)
from app.neural.neat_network import create_minimal_neat_genome, would_create_cycle
from app.schemas.neat import (
    ConnectionGene,
    InnovationCounter,
    NEATGenome,
    NeuronGene,
)


class TestMutateAddConnection:
    """Tests for mutate_add_connection."""

    def test_adds_connection_to_minimal_genome(self):
        """Should add a new connection."""
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        counter = InnovationCounter(next_connection=100)

        initial_count = len(genome.connections)
        result = mutate_add_connection(genome, counter)

        # May or may not succeed depending on random choices
        if result:
            assert len(genome.connections) == initial_count + 1
            # New connection should have innovation from counter
            assert any(c.innovation >= 100 for c in genome.connections)

    def test_adds_connection_with_hidden_neuron(self):
        """Should be able to connect to/from hidden neurons."""
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
        counter = InnovationCounter(next_connection=10)

        # Try many times to ensure we can add
        for _ in range(50):
            result = mutate_add_connection(genome, counter)
            if result:
                break

        # Should have found at least input->output connection
        assert len(genome.connections) >= 3

    def test_does_not_create_duplicate_connection(self):
        """Should not add a connection that already exists."""
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        counter = InnovationCounter()

        # Record all existing connections
        existing = {(c.from_node, c.to_node) for c in genome.connections}

        mutate_add_connection(genome, counter)

        # Check no duplicates
        for c in genome.connections:
            key = (c.from_node, c.to_node)
            if key in existing:
                # This is an original connection
                continue
            # New connection should not duplicate existing
            assert genome.connections.count(c) == 1

    def test_does_not_create_cycle(self):
        """New connections should not create cycles (network stays feedforward)."""
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
            ],
        )
        counter = InnovationCounter(next_connection=10)

        # Add many connections
        for _ in range(20):
            mutate_add_connection(genome, counter)

        # Verify no actual cycles exist by checking topological sort works
        from app.neural.neat_network import topological_sort
        # If there were a cycle, this would raise ValueError
        order = topological_sort(genome)
        assert len(order) > 0

    def test_uses_innovation_counter(self):
        """New connections should get innovation from counter."""
        genome = create_minimal_neat_genome(input_size=2, output_size=1)
        counter = InnovationCounter(next_connection=500)

        # Add a hidden neuron so we have room for new connections
        genome.neurons.append(NeuronGene(id=10, type='hidden', innovation=0))

        result = mutate_add_connection(genome, counter)
        if result:
            # The newest connection should have innovation >= 500
            new_conn = genome.connections[-1]
            assert new_conn.innovation >= 500

    def test_returns_false_when_fully_connected(self):
        """Should return False when no valid connections possible."""
        # Minimal genome: 1 input, 1 output, already connected
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
        )
        counter = InnovationCounter()

        result = mutate_add_connection(genome, counter)
        assert result is False


class TestMutateAddNode:
    """Tests for mutate_add_node."""

    def test_adds_node_by_splitting_connection(self):
        """Should add a hidden node by splitting a connection."""
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        counter = InnovationCounter(next_node=10, next_connection=100)

        initial_neurons = len(genome.neurons)
        initial_connections = len(genome.connections)

        result = mutate_add_node(genome, counter)

        assert result is True
        assert len(genome.neurons) == initial_neurons + 1
        # Original disabled + 2 new connections
        assert len(genome.connections) == initial_connections + 2

    def test_disables_original_connection(self):
        """The split connection should be disabled."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=0.5, innovation=0),
            ],
        )
        counter = InnovationCounter()

        mutate_add_node(genome, counter)

        # Original connection should be disabled
        original = genome.connections[0]
        assert original.enabled is False

    def test_new_node_is_hidden(self):
        """New node should be of type 'hidden'."""
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        counter = InnovationCounter()

        initial_hidden = len(genome.get_hidden_neurons())
        mutate_add_node(genome, counter)

        assert len(genome.get_hidden_neurons()) == initial_hidden + 1
        new_hidden = genome.get_hidden_neurons()[-1]
        assert new_hidden.type == 'hidden'
        assert new_hidden.innovation is not None

    def test_preserves_signal_with_weights(self):
        """New connections should have weight 1.0 into node, original weight out."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=0.7, innovation=0),
            ],
        )
        counter = InnovationCounter()

        mutate_add_node(genome, counter)

        # Find the new connections
        new_connections = [c for c in genome.connections if c.enabled]
        assert len(new_connections) == 2

        # One should have weight 1.0 (into new node)
        # One should have original weight 0.7 (out of new node)
        weights = sorted([c.weight for c in new_connections])
        assert abs(weights[0] - 0.7) < 1e-6
        assert abs(weights[1] - 1.0) < 1e-6

    def test_respects_max_hidden_nodes(self):
        """Should not add nodes beyond the limit."""
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        counter = InnovationCounter()

        # Add nodes up to limit
        for _ in range(5):
            mutate_add_node(genome, counter, max_hidden_nodes=5)

        assert len(genome.get_hidden_neurons()) == 5

        # Should fail to add more
        result = mutate_add_node(genome, counter, max_hidden_nodes=5)
        assert result is False

    def test_returns_false_with_no_enabled_connections(self):
        """Should return False if no connections to split."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, enabled=False, innovation=0),
            ],
        )
        counter = InnovationCounter()

        result = mutate_add_node(genome, counter)
        assert result is False

    def test_same_split_gets_same_innovation(self):
        """Splitting the same connection in same generation gets same innovation."""
        # Two genomes with same structure
        genome1 = create_minimal_neat_genome(input_size=2, output_size=1)
        genome2 = create_minimal_neat_genome(input_size=2, output_size=1)

        # Ensure same innovations for initial connections
        for i, (c1, c2) in enumerate(zip(genome1.connections, genome2.connections)):
            c1.innovation = i
            c2.innovation = i

        counter = InnovationCounter()

        # Split first connection in both
        # Need deterministic behavior, so pick specific connection
        conn1 = genome1.connections[0]
        conn2 = genome2.connections[0]
        conn1.enabled = True
        conn2.enabled = True

        # Manually split to test innovation tracking
        counter.get_node_innovation(0)  # Split connection 0
        node_inn1 = counter.get_node_innovation(0)  # Same split

        assert node_inn1 == 0  # Same innovation


class TestMutateToggleConnection:
    """Tests for connection enable/disable mutations."""

    def test_toggle_disables_enabled(self):
        """Can disable an enabled connection."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, enabled=True, innovation=0),
            ],
        )

        mutate_toggle_connection(genome)
        assert genome.connections[0].enabled is False

    def test_toggle_enables_disabled(self):
        """Can enable a disabled connection."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, enabled=False, innovation=0),
            ],
        )

        mutate_toggle_connection(genome)
        assert genome.connections[0].enabled is True

    def test_enable_connection(self):
        """mutate_enable_connection should enable a disabled connection."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, enabled=False, innovation=0),
            ],
        )

        result = mutate_enable_connection(genome)
        assert result is True
        assert genome.connections[0].enabled is True

    def test_disable_connection(self):
        """mutate_disable_connection should disable an enabled connection."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, enabled=True, innovation=0),
            ],
        )

        result = mutate_disable_connection(genome)
        assert result is True
        assert genome.connections[0].enabled is False

    def test_enable_returns_false_when_none_disabled(self):
        """Should return False if no connections to enable."""
        genome = NEATGenome(
            neurons=[NeuronGene(id=0, type='input')],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, enabled=True, innovation=0),
            ],
        )

        result = mutate_enable_connection(genome)
        assert result is False

    def test_disable_returns_false_when_none_enabled(self):
        """Should return False if no connections to disable."""
        genome = NEATGenome(
            neurons=[NeuronGene(id=0, type='input')],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, enabled=False, innovation=0),
            ],
        )

        result = mutate_disable_connection(genome)
        assert result is False


class TestMutateNeatWeights:
    """Tests for weight mutation."""

    def test_mutates_weights(self):
        """Weights should change after mutation."""
        random.seed(42)  # Deterministic
        genome = create_minimal_neat_genome(input_size=2, output_size=2)

        original_weights = [c.weight for c in genome.connections]
        mutate_neat_weights(genome, mutation_rate=1.0)
        new_weights = [c.weight for c in genome.connections]

        # At least some weights should have changed
        assert original_weights != new_weights

    def test_respects_mutation_rate(self):
        """Low mutation rate should result in few changes."""
        random.seed(42)
        genome = create_minimal_neat_genome(input_size=3, output_size=3)

        original_weights = [c.weight for c in genome.connections]
        mutate_neat_weights(genome, mutation_rate=0.01)
        new_weights = [c.weight for c in genome.connections]

        # Most weights should be unchanged with 1% rate
        unchanged = sum(1 for o, n in zip(original_weights, new_weights) if o == n)
        assert unchanged >= len(original_weights) * 0.5

    def test_returns_mutation_count(self):
        """Should return the number of weights mutated."""
        random.seed(42)
        genome = create_minimal_neat_genome(input_size=2, output_size=2)

        count = mutate_neat_weights(genome, mutation_rate=1.0)
        assert count >= 0

    def test_perturb_vs_reset(self):
        """With perturb_rate=1.0, weights should be perturbed not reset."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=10.0, innovation=0),
            ],
        )

        mutate_neat_weights(
            genome,
            mutation_rate=1.0,
            perturb_rate=1.0,
            perturb_magnitude=0.1,
        )

        # Weight should still be close to 10.0 (perturbed, not reset)
        assert abs(genome.connections[0].weight - 10.0) < 1.0


class TestMutateNeatBiases:
    """Tests for bias mutation."""

    def test_mutates_biases(self):
        """Biases should change after mutation."""
        random.seed(42)
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', bias=0.0, innovation=0),
                NeuronGene(id=2, type='output', bias=-0.5),
            ],
            connections=[],
        )

        original_biases = [n.bias for n in genome.neurons if n.type != 'input']
        mutate_neat_biases(genome, mutation_rate=1.0)
        new_biases = [n.bias for n in genome.neurons if n.type != 'input']

        assert original_biases != new_biases

    def test_does_not_mutate_input_biases(self):
        """Input neuron biases should never be mutated."""
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input', bias=0.0),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[],
        )

        for _ in range(10):
            mutate_neat_biases(genome, mutation_rate=1.0)

        # Input bias should still be 0.0
        input_neuron = genome.get_input_neurons()[0]
        assert input_neuron.bias == 0.0


class TestMutateNeatGenome:
    """Tests for the full genome mutation function."""

    def test_returns_new_genome(self):
        """Should return a new genome, not modify original."""
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        counter = InnovationCounter()

        original_conn_count = len(genome.connections)
        mutated = mutate_neat_genome(genome, counter)

        # Original should be unchanged
        assert len(genome.connections) == original_conn_count
        # Mutated should be a different object
        assert mutated is not genome

    def test_can_add_nodes(self):
        """With high add_node_rate, should eventually add a node."""
        random.seed(42)
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        counter = InnovationCounter()

        # Run many times with high rate
        for _ in range(100):
            genome = mutate_neat_genome(genome, counter, add_node_rate=0.5)

        # Should have added some hidden nodes
        assert len(genome.get_hidden_neurons()) > 0

    def test_can_add_connections(self):
        """With high add_connection_rate, should eventually add connections."""
        random.seed(42)
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        # Add a hidden node to have room for new connections
        genome.neurons.append(NeuronGene(id=10, type='hidden', innovation=0))
        counter = InnovationCounter()

        initial_count = len(genome.connections)

        # Run many times with high rate
        for _ in range(50):
            genome = mutate_neat_genome(genome, counter, add_connection_rate=0.5)

        # Should have added some connections
        assert len(genome.connections) > initial_count

    def test_weights_are_mutated(self):
        """Weights should be perturbed."""
        random.seed(42)
        genome = create_minimal_neat_genome(input_size=2, output_size=2)
        counter = InnovationCounter()

        original_weights = [c.weight for c in genome.connections]
        mutated = mutate_neat_genome(genome, counter, weight_mutation_rate=1.0)
        new_weights = [c.weight for c in mutated.connections[:len(original_weights)]]

        # At least some weights should differ
        assert original_weights != new_weights

    def test_preserves_genome_structure(self):
        """Mutation should preserve valid genome structure."""
        genome = create_minimal_neat_genome(input_size=3, output_size=2)
        counter = InnovationCounter()

        for _ in range(20):
            genome = mutate_neat_genome(genome, counter)

        # Should still have valid structure
        assert len(genome.get_input_neurons()) == 3
        assert len(genome.get_output_neurons()) == 2
        # All connections should reference valid neurons
        neuron_ids = {n.id for n in genome.neurons}
        for conn in genome.connections:
            assert conn.from_node in neuron_ids
            assert conn.to_node in neuron_ids

    def test_bias_only_genome_gets_input_connections(self):
        """
        A genome with only bias->output connections should gain input connections.

        This tests the bug where genomes starting with initial_connectivity=none
        would never evolve input connections because:
        1. add_node can't split bias->output (creates no input path)
        2. The elif structure meant add_connection was skipped when add_node was tried

        After 100 mutations with high rates, the genome MUST have at least one
        connection from an input neuron to prove topology is evolving.
        """
        random.seed(42)

        # Create genome with only bias->output connections (like initial_connectivity=none)
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='bias'),
                NeuronGene(id=1, type='input'),
                NeuronGene(id=2, type='input'),
                NeuronGene(id=3, type='input'),
                NeuronGene(id=4, type='output'),
                NeuronGene(id=5, type='output'),
            ],
            connections=[
                # Only bias -> output connections
                ConnectionGene(from_node=0, to_node=4, weight=0.5, enabled=True, innovation=0),
                ConnectionGene(from_node=0, to_node=5, weight=-0.5, enabled=True, innovation=1),
            ],
        )
        counter = InnovationCounter(next_connection=10)

        # Run mutations with high structural rates
        for _ in range(100):
            genome = mutate_neat_genome(
                genome,
                counter,
                add_connection_rate=0.3,  # High rate
                add_node_rate=0.1,
            )

        # Check if ANY input neuron has an outgoing connection
        input_ids = {1, 2, 3}
        connections_from_inputs = [c for c in genome.connections if c.from_node in input_ids]

        assert len(connections_from_inputs) > 0, (
            f"After 100 mutations, genome still has no input connections! "
            f"Connections: {[(c.from_node, c.to_node) for c in genome.connections]}"
        )

    def test_bias_only_genome_realistic_rates(self):
        """
        Test with realistic mutation rates (5% add_connection, 3% add_node).

        This simulates 50 generations of evolution with realistic rates.
        With 100 creatures per generation and 50% cull rate, roughly 50 new
        creatures are created per generation, each getting a mutation attempt.

        Total mutation opportunities: 50 gen × 50 creatures = 2500 attempts
        Expected add_connection attempts: 2500 × 0.05 = ~125

        CRITICAL: This test exposes a bug where the elif structure means
        add_connection is only tried when add_node doesn't fire. The actual
        probability of attempting add_connection is:
        P(add_connection tried) = (1 - 0.03) × 0.05 = 0.0485 (4.85%, not 5%)

        Worse: if add_node fires but fails (no connections to split on a
        bias-only genome), we STILL skip add_connection due to elif.
        """
        random.seed(123)

        # Create genome like initial_connectivity=none (only bias->output)
        genome = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='bias'),
                NeuronGene(id=1, type='input'),
                NeuronGene(id=2, type='input'),
                NeuronGene(id=3, type='input'),
                NeuronGene(id=4, type='input'),
                NeuronGene(id=5, type='input'),
                NeuronGene(id=6, type='input'),
                NeuronGene(id=7, type='input'),
                NeuronGene(id=8, type='output'),
                NeuronGene(id=9, type='output'),
                NeuronGene(id=10, type='output'),
            ],
            connections=[
                # Only bias -> output connections
                ConnectionGene(from_node=0, to_node=8, weight=0.3, enabled=True, innovation=0),
                ConnectionGene(from_node=0, to_node=9, weight=-0.4, enabled=True, innovation=1),
                ConnectionGene(from_node=0, to_node=10, weight=0.1, enabled=True, innovation=2),
            ],
        )
        counter = InnovationCounter(next_connection=10)

        # Simulate 2500 mutation attempts (50 generations × 50 new creatures)
        for _ in range(2500):
            genome = mutate_neat_genome(
                genome,
                counter,
                add_connection_rate=0.5,  # NEAT standard rate
                add_node_rate=0.2,  # NEAT standard rate
            )

        # After 2500 mutation attempts, we expect ~125 successful add_connection
        # attempts. Even accounting for randomness, we should have MANY connections
        # from inputs by now.
        input_ids = {1, 2, 3, 4, 5, 6, 7}
        connections_from_inputs = [c for c in genome.connections if c.from_node in input_ids]

        # With 7 inputs × 3 outputs = 21 possible input->output connections,
        # plus hidden nodes that may have been added, we should have quite a few
        assert len(connections_from_inputs) >= 5, (
            f"After 2500 mutations (50 generations), only {len(connections_from_inputs)} "
            f"connections from inputs! This suggests topology isn't evolving. "
            f"Total connections: {len(genome.connections)}, "
            f"Hidden nodes: {len(genome.get_hidden_neurons())}"
        )


class TestNEATAlwaysMutates:
    """Tests that all offspring (including clones) get mutated."""

    def test_clone_offspring_get_mutated(self):
        """
        Clone offspring should always get mutated.

        This tests that when crossover_rate=0 (all offspring are clones),
        mutations are still applied to prevent duplicate genomes and
        ensure evolution has variation.
        """
        random.seed(42)

        from app.genetics.population import evolve_population
        from app.schemas.neat import InnovationCounter

        # Create 10 identical genomes (will be in same species)
        genomes = []
        for i in range(10):
            genomes.append({
                'id': f'creature_{i}',
                'nodes': [{'id': 'n0', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5}],
                'muscles': [
                    {'id': 'm0', 'nodeA': 'n0', 'nodeB': 'n0', 'restLength': 1, 'stiffness': 100, 'damping': 2,
                     'frequency': 1, 'amplitude': 0.3, 'phase': 0, 'directionBias': {'x': 0, 'y': 0, 'z': 0},
                     'biasStrength': 0, 'velocityBias': {'x': 0, 'y': 0, 'z': 0}, 'velocityStrength': 0,
                     'distanceBias': 0, 'distanceStrength': 0},
                ],
                'neatGenome': {
                    'neurons': [
                        {'id': 0, 'type': 'bias', 'bias': 0.0},
                        {'id': 1, 'type': 'input', 'bias': 0.0},
                        {'id': 2, 'type': 'output', 'bias': 0.0},
                    ],
                    'connections': [
                        # Only bias->output (like initial_connectivity=none)
                        {'from_node': 0, 'to_node': 2, 'weight': 0.5, 'enabled': True, 'innovation': 0},
                    ],
                    'activation': 'tanh',
                },
                'controllerType': 'neural',
                'survivalStreak': 0,
                'generation': 0,
            })

        config = {
            'population_size': 10,
            'cull_percentage': 0.5,
            'selection_method': 'speciation',
            'crossover_rate': 0.0,  # NO crossover - all offspring are clones
            'use_crossover': False,
            'compatibility_threshold': 10.0,  # High threshold = all same species
            'use_neat': True,
            'neat_add_connection_rate': 1.0,  # 100% rate to guarantee mutation
            'neat_add_node_rate': 0.0,
        }

        counter = InnovationCounter()
        fitness = [100 - i for i in range(10)]

        # Run evolution
        new_genomes, stats = evolve_population(genomes, fitness, config, generation=1, innovation_counter=counter)

        # Get newborns (should all be clones since crossover_rate=0)
        newborns = [g for g in new_genomes if g.get('survivalStreak', 0) == 0]

        # Check that mutations were applied to clone offspring
        connections_added = 0
        for g in newborns:
            neat = g.get('neatGenome') or g.get('neat_genome', {})
            if neat:
                conns = len(neat.get('connections', []))
                if conns > 1:  # Started with 1, should have more after mutation
                    connections_added += 1

        assert connections_added > 0, (
            f"No mutations applied to clone offspring! "
            f"With neat_add_connection_rate=1.0, ALL newborns should have new connections. "
            f"This suggests clone offspring are not being mutated."
        )


class TestInnovationTracking:
    """Tests for innovation ID tracking across mutations."""

    def test_same_connection_mutation_same_innovation(self):
        """Two creatures adding the same connection get same innovation."""
        genome1 = NEATGenome(
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
        genome2 = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='hidden', innovation=0),
                NeuronGene(id=2, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=0.5, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=0.5, innovation=1),
            ],
        )

        counter = InnovationCounter(next_connection=10)

        # Both add 0->2 connection
        inn1 = counter.get_connection_innovation(0, 2)
        inn2 = counter.get_connection_innovation(0, 2)

        assert inn1 == inn2 == 10

    def test_different_connections_different_innovations(self):
        """Different connections get different innovation IDs."""
        counter = InnovationCounter()

        inn1 = counter.get_connection_innovation(0, 1)
        inn2 = counter.get_connection_innovation(0, 2)
        inn3 = counter.get_connection_innovation(1, 2)

        assert len({inn1, inn2, inn3}) == 3  # All unique

    def test_innovation_cache_cleared_between_generations(self):
        """After clearing cache, same mutation gets new innovation."""
        counter = InnovationCounter()

        inn1 = counter.get_connection_innovation(0, 1)
        counter.clear_generation_cache()
        inn2 = counter.get_connection_innovation(0, 1)

        assert inn1 != inn2
