"""
NEAT (NeuroEvolution of Augmenting Topologies) genome schemas.

Defines the gene-based representation for evolving network topology.
See docs/NEAT.md for technical details.
"""

from typing import Literal

from pydantic import BaseModel, Field


class NodeGene(BaseModel):
    """A node (neuron) in a NEAT genome.

    Input and output nodes are created at genome initialization.
    Hidden nodes are added through structural mutations.
    """

    id: int = Field(..., description="Unique node identifier within the genome")
    type: Literal['input', 'hidden', 'output'] = Field(
        ..., description="Node type determines position in network"
    )
    bias: float = Field(default=0.0, description="Bias term added before activation")
    # Innovation number for hidden nodes (None for input/output which are fixed)
    innovation: int | None = Field(
        default=None,
        description="Innovation ID for hidden nodes (enables crossover alignment)"
    )


class ConnectionGene(BaseModel):
    """A connection (synapse) between two nodes in a NEAT genome.

    Each connection has an innovation number for crossover alignment.
    Connections can be disabled without being deleted.
    """

    from_node: int = Field(..., description="Source node ID")
    to_node: int = Field(..., description="Target node ID")
    weight: float = Field(..., description="Connection weight")
    enabled: bool = Field(default=True, description="Whether this connection is active")
    innovation: int = Field(
        ..., description="Global innovation number for crossover alignment"
    )


class NEATGenome(BaseModel):
    """A complete NEAT genome with nodes and connections.

    Represents a neural network topology that can evolve through:
    - Weight mutations (perturb existing weights)
    - Add connection (connect two unconnected nodes)
    - Add node (split an existing connection)
    - Toggle connection (enable/disable)
    """

    nodes: list[NodeGene] = Field(
        default_factory=list,
        description="All nodes in the network (input, hidden, output)"
    )
    connections: list[ConnectionGene] = Field(
        default_factory=list,
        description="All connections between nodes"
    )
    activation: Literal['tanh', 'relu', 'sigmoid'] = Field(
        default='tanh',
        description="Activation function for hidden and output nodes"
    )

    def get_input_nodes(self) -> list[NodeGene]:
        """Get all input nodes."""
        return [n for n in self.nodes if n.type == 'input']

    def get_output_nodes(self) -> list[NodeGene]:
        """Get all output nodes."""
        return [n for n in self.nodes if n.type == 'output']

    def get_hidden_nodes(self) -> list[NodeGene]:
        """Get all hidden nodes."""
        return [n for n in self.nodes if n.type == 'hidden']

    def get_enabled_connections(self) -> list[ConnectionGene]:
        """Get all enabled connections."""
        return [c for c in self.connections if c.enabled]

    def get_node_by_id(self, node_id: int) -> NodeGene | None:
        """Find a node by its ID."""
        for node in self.nodes:
            if node.id == node_id:
                return node
        return None

    def connection_exists(self, from_node: int, to_node: int) -> bool:
        """Check if a connection already exists (enabled or disabled)."""
        return any(
            c.from_node == from_node and c.to_node == to_node
            for c in self.connections
        )

    def max_node_id(self) -> int:
        """Get the highest node ID in the genome."""
        if not self.nodes:
            return -1
        return max(n.id for n in self.nodes)

    def max_innovation(self) -> int:
        """Get the highest innovation number in connections."""
        if not self.connections:
            return 0
        return max(c.innovation for c in self.connections)


class InnovationCounter(BaseModel):
    """Tracks innovation numbers for structural mutations within a run.

    Same structural mutations occurring in the same generation get the same
    innovation number, enabling meaningful crossover between different topologies.
    """

    next_connection: int = Field(
        default=0,
        description="Next innovation number for new connections"
    )
    next_node: int = Field(
        default=0,
        description="Next innovation number for new hidden nodes"
    )
    # Caches for same-generation deduplication (reset each generation)
    connection_cache: dict[str, int] = Field(
        default_factory=dict,
        description="Maps (from,to) pairs to innovation IDs for this generation"
    )
    node_cache: dict[int, int] = Field(
        default_factory=dict,
        description="Maps split connection innovation to new node innovation"
    )

    def get_connection_innovation(self, from_node: int, to_node: int) -> int:
        """Get or create innovation number for a connection.

        Same connection created multiple times in one generation gets same ID.
        """
        key = f"{from_node},{to_node}"
        if key not in self.connection_cache:
            self.connection_cache[key] = self.next_connection
            self.next_connection += 1
        return self.connection_cache[key]

    def get_node_innovation(self, split_connection_innovation: int) -> int:
        """Get or create innovation number for a new hidden node.

        Same connection split multiple times in one generation creates same node ID.
        """
        if split_connection_innovation not in self.node_cache:
            self.node_cache[split_connection_innovation] = self.next_node
            self.next_node += 1
        return self.node_cache[split_connection_innovation]

    def clear_generation_cache(self) -> None:
        """Clear caches at the start of each generation.

        Innovation numbers persist, but same-generation deduplication resets.
        """
        self.connection_cache = {}
        self.node_cache = {}


class NEATConfig(BaseModel):
    """Configuration for NEAT evolution."""

    # Enable NEAT (vs fixed topology)
    use_neat: bool = Field(default=False, description="Use NEAT topology evolution")

    # Structural mutation rates
    add_connection_rate: float = Field(
        default=0.05, ge=0.0, le=0.5,
        description="Probability of adding a new connection per genome"
    )
    add_node_rate: float = Field(
        default=0.03, ge=0.0, le=0.3,
        description="Probability of adding a new node per genome"
    )
    enable_connection_rate: float = Field(
        default=0.02, ge=0.0, le=0.2,
        description="Probability of re-enabling a disabled connection"
    )
    disable_connection_rate: float = Field(
        default=0.01, ge=0.0, le=0.2,
        description="Probability of disabling an enabled connection"
    )

    # Weight mutation (applied to all connections)
    weight_mutate_rate: float = Field(
        default=0.8, ge=0.0, le=1.0,
        description="Probability of any weight mutation occurring"
    )
    weight_perturb_rate: float = Field(
        default=0.9, ge=0.0, le=1.0,
        description="Of mutations: probability of perturb vs full reset"
    )
    weight_perturb_magnitude: float = Field(
        default=0.2, ge=0.0, le=2.0,
        description="Std dev for weight perturbation"
    )

    # Compatibility distance coefficients (for speciation)
    excess_coefficient: float = Field(
        default=1.0, ge=0.0, le=5.0,
        description="Weight for excess genes in compatibility distance"
    )
    disjoint_coefficient: float = Field(
        default=1.0, ge=0.0, le=5.0,
        description="Weight for disjoint genes in compatibility distance"
    )
    weight_coefficient: float = Field(
        default=0.4, ge=0.0, le=3.0,
        description="Weight for weight differences in compatibility distance"
    )

    # Topology limits (prevent bloat)
    max_hidden_nodes: int = Field(
        default=16, ge=1, le=64,
        description="Maximum hidden nodes per genome"
    )
    max_connections: int = Field(
        default=128, ge=1, le=512,
        description="Maximum connections per genome"
    )

    # Initial topology
    initial_connection_density: float = Field(
        default=1.0, ge=0.0, le=1.0,
        description="Fraction of possible input->output connections at start (1.0 = fully connected)"
    )
