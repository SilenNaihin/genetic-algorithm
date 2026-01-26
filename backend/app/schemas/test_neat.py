"""Tests for NEAT genome schemas."""

import pytest

from app.schemas.neat import (
    ConnectionGene,
    InnovationCounter,
    NEATGenome,
    NeuronGene,
)


class TestNeuronGene:
    """Tests for NeuronGene schema."""

    def test_input_neuron(self):
        neuron = NeuronGene(id=0, type='input')
        assert neuron.id == 0
        assert neuron.type == 'input'
        assert neuron.bias == 0.0
        assert neuron.innovation is None

    def test_hidden_neuron_with_innovation(self):
        neuron = NeuronGene(id=10, type='hidden', bias=0.5, innovation=42)
        assert neuron.id == 10
        assert neuron.type == 'hidden'
        assert neuron.bias == 0.5
        assert neuron.innovation == 42

    def test_output_neuron_with_bias(self):
        neuron = NeuronGene(id=5, type='output', bias=-0.5)
        assert neuron.bias == -0.5
        assert neuron.innovation is None


class TestConnectionGene:
    """Tests for ConnectionGene schema."""

    def test_enabled_connection(self):
        conn = ConnectionGene(from_node=0, to_node=5, weight=0.5, innovation=1)
        assert conn.from_node == 0
        assert conn.to_node == 5
        assert conn.weight == 0.5
        assert conn.enabled is True
        assert conn.innovation == 1

    def test_disabled_connection(self):
        conn = ConnectionGene(
            from_node=0, to_node=5, weight=0.5, enabled=False, innovation=1
        )
        assert conn.enabled is False


class TestNEATGenome:
    """Tests for NEATGenome schema."""

    @pytest.fixture
    def minimal_genome(self) -> NEATGenome:
        """Create a minimal NEAT genome (2 inputs, 1 output, fully connected)."""
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

    def test_get_input_neurons(self, minimal_genome: NEATGenome):
        inputs = minimal_genome.get_input_neurons()
        assert len(inputs) == 2
        assert all(n.type == 'input' for n in inputs)

    def test_get_output_neurons(self, minimal_genome: NEATGenome):
        outputs = minimal_genome.get_output_neurons()
        assert len(outputs) == 1
        assert outputs[0].type == 'output'

    def test_get_hidden_neurons_empty(self, minimal_genome: NEATGenome):
        hidden = minimal_genome.get_hidden_neurons()
        assert len(hidden) == 0

    def test_get_hidden_neurons_with_hidden(self, minimal_genome: NEATGenome):
        minimal_genome.neurons.append(
            NeuronGene(id=3, type='hidden', innovation=0)
        )
        hidden = minimal_genome.get_hidden_neurons()
        assert len(hidden) == 1
        assert hidden[0].id == 3

    def test_get_enabled_connections(self, minimal_genome: NEATGenome):
        enabled = minimal_genome.get_enabled_connections()
        assert len(enabled) == 2

    def test_get_enabled_connections_with_disabled(self, minimal_genome: NEATGenome):
        minimal_genome.connections[0].enabled = False
        enabled = minimal_genome.get_enabled_connections()
        assert len(enabled) == 1
        assert enabled[0].innovation == 1

    def test_get_neuron_by_id(self, minimal_genome: NEATGenome):
        neuron = minimal_genome.get_neuron_by_id(2)
        assert neuron is not None
        assert neuron.type == 'output'

    def test_get_neuron_by_id_not_found(self, minimal_genome: NEATGenome):
        neuron = minimal_genome.get_neuron_by_id(99)
        assert neuron is None

    def test_connection_exists(self, minimal_genome: NEATGenome):
        assert minimal_genome.connection_exists(0, 2) is True
        assert minimal_genome.connection_exists(2, 0) is False
        assert minimal_genome.connection_exists(0, 1) is False

    def test_max_neuron_id(self, minimal_genome: NEATGenome):
        assert minimal_genome.max_neuron_id() == 2

    def test_max_innovation(self, minimal_genome: NEATGenome):
        assert minimal_genome.max_innovation() == 1

    def test_max_innovation_empty(self):
        genome = NEATGenome(neurons=[], connections=[])
        assert genome.max_innovation() == 0


class TestInnovationCounter:
    """Tests for InnovationCounter."""

    def test_initial_state(self):
        counter = InnovationCounter()
        assert counter.next_connection == 0
        assert counter.next_node == 0
        assert counter.connection_cache == {}
        assert counter.node_cache == {}

    def test_get_connection_innovation_new(self):
        counter = InnovationCounter()
        inn = counter.get_connection_innovation(0, 5)
        assert inn == 0
        assert counter.next_connection == 1

    def test_get_connection_innovation_same_generation(self):
        """Same connection in same generation gets same innovation."""
        counter = InnovationCounter()
        inn1 = counter.get_connection_innovation(0, 5)
        inn2 = counter.get_connection_innovation(0, 5)
        assert inn1 == inn2
        assert counter.next_connection == 1  # Only incremented once

    def test_get_connection_innovation_different_connections(self):
        counter = InnovationCounter()
        inn1 = counter.get_connection_innovation(0, 5)
        inn2 = counter.get_connection_innovation(1, 5)
        assert inn1 == 0
        assert inn2 == 1
        assert counter.next_connection == 2

    def test_get_node_innovation_new(self):
        counter = InnovationCounter()
        inn = counter.get_node_innovation(0)  # Split connection 0
        assert inn == 0
        assert counter.next_node == 1

    def test_get_node_innovation_same_split(self):
        """Same connection split in same generation gets same node innovation."""
        counter = InnovationCounter()
        inn1 = counter.get_node_innovation(0)
        inn2 = counter.get_node_innovation(0)
        assert inn1 == inn2
        assert counter.next_node == 1

    def test_clear_generation_cache(self):
        counter = InnovationCounter()
        counter.get_connection_innovation(0, 5)
        counter.get_node_innovation(0)

        counter.clear_generation_cache()

        assert counter.connection_cache == {}
        assert counter.node_cache == {}
        # Counters persist
        assert counter.next_connection == 1
        assert counter.next_node == 1

    def test_after_clear_new_innovation(self):
        """After clearing cache, same mutation gets new innovation."""
        counter = InnovationCounter()
        inn1 = counter.get_connection_innovation(0, 5)

        counter.clear_generation_cache()

        inn2 = counter.get_connection_innovation(0, 5)
        assert inn2 == 1  # New innovation after cache clear
        assert inn1 != inn2
