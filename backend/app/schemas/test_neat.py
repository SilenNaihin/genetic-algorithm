"""Tests for NEAT genome schemas."""

import pytest

from app.schemas.neat import (
    ConnectionGene,
    InnovationCounter,
    NEATConfig,
    NEATGenome,
    NodeGene,
)


class TestNodeGene:
    """Tests for NodeGene schema."""

    def test_input_node(self):
        node = NodeGene(id=0, type='input')
        assert node.id == 0
        assert node.type == 'input'
        assert node.bias == 0.0
        assert node.innovation is None

    def test_hidden_node_with_innovation(self):
        node = NodeGene(id=10, type='hidden', bias=0.5, innovation=42)
        assert node.id == 10
        assert node.type == 'hidden'
        assert node.bias == 0.5
        assert node.innovation == 42

    def test_output_node_with_bias(self):
        node = NodeGene(id=5, type='output', bias=-0.5)
        assert node.bias == -0.5
        assert node.innovation is None


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
            nodes=[
                NodeGene(id=0, type='input'),
                NodeGene(id=1, type='input'),
                NodeGene(id=2, type='output', bias=-0.5),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=2, weight=0.5, innovation=0),
                ConnectionGene(from_node=1, to_node=2, weight=-0.3, innovation=1),
            ],
        )

    def test_get_input_nodes(self, minimal_genome: NEATGenome):
        inputs = minimal_genome.get_input_nodes()
        assert len(inputs) == 2
        assert all(n.type == 'input' for n in inputs)

    def test_get_output_nodes(self, minimal_genome: NEATGenome):
        outputs = minimal_genome.get_output_nodes()
        assert len(outputs) == 1
        assert outputs[0].type == 'output'

    def test_get_hidden_nodes_empty(self, minimal_genome: NEATGenome):
        hidden = minimal_genome.get_hidden_nodes()
        assert len(hidden) == 0

    def test_get_hidden_nodes_with_hidden(self, minimal_genome: NEATGenome):
        minimal_genome.nodes.append(
            NodeGene(id=3, type='hidden', innovation=0)
        )
        hidden = minimal_genome.get_hidden_nodes()
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

    def test_get_node_by_id(self, minimal_genome: NEATGenome):
        node = minimal_genome.get_node_by_id(2)
        assert node is not None
        assert node.type == 'output'

    def test_get_node_by_id_not_found(self, minimal_genome: NEATGenome):
        node = minimal_genome.get_node_by_id(99)
        assert node is None

    def test_connection_exists(self, minimal_genome: NEATGenome):
        assert minimal_genome.connection_exists(0, 2) is True
        assert minimal_genome.connection_exists(2, 0) is False
        assert minimal_genome.connection_exists(0, 1) is False

    def test_max_node_id(self, minimal_genome: NEATGenome):
        assert minimal_genome.max_node_id() == 2

    def test_max_innovation(self, minimal_genome: NEATGenome):
        assert minimal_genome.max_innovation() == 1

    def test_max_innovation_empty(self):
        genome = NEATGenome(nodes=[], connections=[])
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


class TestNEATConfig:
    """Tests for NEATConfig defaults and validation."""

    def test_defaults(self):
        config = NEATConfig()
        assert config.use_neat is False
        assert config.add_connection_rate == 0.05
        assert config.add_node_rate == 0.03
        assert config.max_hidden_nodes == 16

    def test_custom_values(self):
        config = NEATConfig(
            use_neat=True,
            add_connection_rate=0.1,
            max_hidden_nodes=32,
        )
        assert config.use_neat is True
        assert config.add_connection_rate == 0.1
        assert config.max_hidden_nodes == 32

    def test_validation_bounds(self):
        # Should not raise
        NEATConfig(add_connection_rate=0.0)
        NEATConfig(add_connection_rate=0.5)

        # Should raise
        with pytest.raises(ValueError):
            NEATConfig(add_connection_rate=-0.1)
        with pytest.raises(ValueError):
            NEATConfig(add_connection_rate=0.6)
