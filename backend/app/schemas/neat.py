"""
NEAT (NeuroEvolution of Augmenting Topologies) genome schemas.

Defines the gene-based representation for evolving network topology.
See docs/NEAT.md for technical details.

Note: We use "NeuronGene" (not "NodeGene") to avoid collision with
the body NodeGene in genome.py which represents physical spheres.
"""

from typing import Literal

from pydantic import BaseModel, Field


class NeuronGene(BaseModel):
    """A neuron in a NEAT genome.

    Input and output neurons are created at genome initialization.
    Hidden neurons are added through structural mutations (add_node).

    Note: Named "NeuronGene" to avoid collision with body "NodeGene" in genome.py.
    """

    id: int = Field(..., description="Unique neuron identifier within the genome")
    type: Literal['input', 'hidden', 'output', 'bias'] = Field(
        ..., description="Neuron type: input, hidden, output, or bias (always=1.0)"
    )
    bias: float = Field(default=0.0, description="Bias term added before activation")
    # Innovation number for hidden neurons (None for input/output which are fixed)
    innovation: int | None = Field(
        default=None,
        description="Innovation ID for hidden neurons (enables crossover alignment)"
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
    """A complete NEAT genome with neurons and connections.

    Represents a neural network topology that can evolve through:
    - Weight mutations (perturb existing weights)
    - Add connection (connect two unconnected neurons)
    - Add node (split an existing connection with new hidden neuron)
    - Toggle connection (enable/disable)
    """

    neurons: list[NeuronGene] = Field(
        default_factory=list,
        description="All neurons in the network (input, hidden, output)"
    )
    connections: list[ConnectionGene] = Field(
        default_factory=list,
        description="All connections between neurons"
    )
    activation: Literal['tanh', 'relu', 'sigmoid'] = Field(
        default='tanh',
        description="Activation function for hidden and output neurons"
    )

    def get_input_neurons(self) -> list[NeuronGene]:
        """Get all input neurons."""
        return [n for n in self.neurons if n.type == 'input']

    def get_output_neurons(self) -> list[NeuronGene]:
        """Get all output neurons."""
        return [n for n in self.neurons if n.type == 'output']

    def get_hidden_neurons(self) -> list[NeuronGene]:
        """Get all hidden neurons."""
        return [n for n in self.neurons if n.type == 'hidden']

    def get_enabled_connections(self) -> list[ConnectionGene]:
        """Get all enabled connections."""
        return [c for c in self.connections if c.enabled]

    def get_neuron_by_id(self, neuron_id: int) -> NeuronGene | None:
        """Find a neuron by its ID."""
        for neuron in self.neurons:
            if neuron.id == neuron_id:
                return neuron
        return None

    def connection_exists(self, from_neuron: int, to_neuron: int) -> bool:
        """Check if a connection already exists (enabled or disabled)."""
        return any(
            c.from_node == from_neuron and c.to_node == to_neuron
            for c in self.connections
        )

    def max_neuron_id(self) -> int:
        """Get the highest neuron ID in the genome."""
        if not self.neurons:
            return -1
        return max(n.id for n in self.neurons)

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


# NEAT configuration parameters are added to existing configs:
# - SimulationConfig (src/types/simulation.ts, backend/app/schemas/simulation.py)
# - EvolutionConfig (backend/app/schemas/genetics.py)
#
# This keeps all evolution params in one place rather than a separate NEATConfig.
# See neat-prd.json tasks 1.10-1.11 for the integration.
#
# NEAT params to add:
#   use_neat: bool                     # Toggle NEAT vs fixed topology
#   neat_add_connection_rate: float    # Structural mutation rate
#   neat_add_node_rate: float          # Structural mutation rate
#   neat_max_hidden_neurons: int       # Bloat prevention
#   neat_excess_coefficient: float     # Speciation distance tuning
#   neat_disjoint_coefficient: float   # Speciation distance tuning
#   neat_weight_coefficient: float     # Speciation distance tuning
#
# When use_neat=True:
#   - use_speciation is auto-enabled (NEAT requires it)
#   - use_fitness_sharing is auto-disabled (redundant)
#   - neural_hidden_size is ignored (topology evolves)
#   - Speciation uses neat_genome_distance() instead of neural_genome_distance()
