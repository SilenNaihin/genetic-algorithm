# NEAT Implementation Plan (Future)

This document outlines the plan for migrating from fixed-topology neural networks to NEAT (NeuroEvolution of Augmenting Topologies).

## Why NEAT?

### Limitations of Fixed Topology

1. **Manual architecture design**: We chose 8 hidden neurons, but is that optimal?
2. **Wasted capacity**: Simple behaviors don't need all connections
3. **Limited complexity**: Can't grow beyond initial architecture
4. **Uniform structure**: All creatures have identical network shape

### NEAT Advantages

1. **Minimal start**: Begin with no hidden nodes, grow as needed
2. **Automatic complexity**: Networks become as complex as needed
3. **Innovation protection**: New structures get time to optimize
4. **Efficient encoding**: Only store active connections

---

## NEAT Core Concepts

### 1. Genes as Connections

Instead of a weight matrix, NEAT uses **connection genes**:

```python
@dataclass
class ConnectionGene:
    innovation_number: int    # Global unique ID
    input_node: int           # Source node ID
    output_node: int          # Target node ID
    weight: float             # Connection weight
    enabled: bool = True      # Can be disabled by mutation

@dataclass
class NodeGene:
    id: int
    type: Literal['input', 'hidden', 'output']
    activation_fn: str = 'tanh'

@dataclass
class NEATGenome:
    nodes: list[NodeGene]
    connections: list[ConnectionGene]
```

### 2. Historical Markings

Every time a new connection is created (anywhere in the population), it gets a **unique innovation number**:

```python
global_innovation_counter = 0

def create_connection(input_node: int, output_node: int, weight: float) -> ConnectionGene:
    global global_innovation_counter
    conn = ConnectionGene(
        innovation_number=global_innovation_counter,
        input_node=input_node,
        output_node=output_node,
        weight=weight,
    )
    global_innovation_counter += 1
    return conn
```

This allows meaningful crossover between different topologies by aligning genes by innovation number.

### 3. Crossover by Alignment

```
Parent 1:  [1, 2, 3, 4, 5,  ,  , 8]  (more fit)
Parent 2:  [1, 2,  , 4,  , 6, 7,  ]

Child:     [1, 2, 3, 4, 5, ?, ?, 8]
                         ↑  ↑
                    Disjoint genes from fitter parent
```

- **Matching genes**: Randomly inherit from either parent
- **Disjoint/Excess genes**: Inherit from more fit parent

### 4. Structural Mutations

```python
def mutate_add_connection(genome: NEATGenome) -> None:
    """Add a new connection between existing nodes."""
    input_node = random_node(genome, ['input', 'hidden'])
    output_node = random_node(genome, ['hidden', 'output'])

    if not connection_exists(genome, input_node, output_node):
        genome.connections.append(
            create_connection(input_node.id, output_node.id, random_weight())
        )

def mutate_add_node(genome: NEATGenome) -> None:
    """Add a new node by splitting an existing connection."""
    conn = random_enabled_connection(genome)
    conn.enabled = False  # Disable old connection

    new_node = NodeGene(
        id=next_node_id(),
        type='hidden',
        activation_fn='tanh'
    )
    genome.nodes.append(new_node)

    # Add two new connections through the new node
    genome.connections.append(create_connection(conn.input_node, new_node.id, 1.0))
    genome.connections.append(create_connection(new_node.id, conn.output_node, conn.weight))
```

### 5. Speciation

Networks are grouped into **species** based on structural similarity:

```python
def compatibility_distance(g1: NEATGenome, g2: NEATGenome) -> float:
    matching, disjoint, excess = align_genes(g1, g2)

    N = max(len(g1.connections), len(g2.connections))
    avg_weight_diff = sum(
        abs(c1.weight - c2.weight) for c1, c2 in matching
    ) / len(matching) if matching else 0

    return (c1 * excess / N) + (c2 * disjoint / N) + (c3 * avg_weight_diff)

def assign_to_species(genome: NEATGenome, species: list[Species]) -> None:
    for sp in species:
        if compatibility_distance(genome, sp.representative) < threshold:
            sp.members.append(genome)
            return
    # No compatible species found, create new one
    species.append(Species(representative=genome, members=[genome]))
```

Selection happens **within species**, protecting novel structures.

---

## Migration Path

### Current Fixed-Topology Code

```python
# Current: flat weight array
weights = [...]
nn = NeuralNetwork.from_weights(weights, config)
output = nn.predict(inputs)
```

### NEAT Equivalent

```python
# NEAT: gene-based genome
genome = NEATGenome(
    nodes=[...],
    connections=[...]
)
nn = NEATNetwork.from_genome(genome)
output = nn.predict(inputs)
```

### Shared Interface

Both should implement:

```python
class NeuralController(Protocol):
    def predict(self, inputs: list[float]) -> list[float]: ...
    def get_activations(self) -> dict[str, list[float]]: ...
```

---

## Implementation Phases

### Phase A: Gene Representation

1. Define `ConnectionGene` and `NodeGene` interfaces
2. Implement genome creation with minimal topology (input→output only)
3. Implement `NEATNetwork.fromGenome()` with topological sort
4. Verify forward pass works

### Phase B: Structural Mutations

1. Implement global innovation counter
2. Implement `mutateAddConnection`
3. Implement `mutateAddNode`
4. Add to existing mutation system

### Phase C: NEAT Crossover

1. Implement gene alignment by innovation number
2. Implement crossover that respects fitness
3. Handle disjoint and excess genes

### Phase D: Speciation

1. Implement compatibility distance
2. Implement species assignment
3. Implement within-species selection
4. Implement species stagnation (remove species that don't improve)

### Phase E: Integration

1. Add NEAT toggle to menu
2. Visualize network topology (not just fixed grid)
3. Show species distribution
4. Track innovation history

---

## Visualization Changes

### Fixed Topology (Current)
```
Input ● ─────────────────● Hidden ●─────────────────● Output
      ●─────────────────●        ●─────────────────●
      ●─────────────────●        ●─────────────────●
```

### NEAT Topology (Variable)
```
      ●───────────────────────────────────────────● Output
Input ●─────●──────●──────────────────────────────●
      ●─────┼──────┼──────●───────────────────────●
            │      │      │
            Hidden nodes added by mutation
```

Visualization must handle:
- Variable number of hidden nodes
- Non-layered connections (skip connections)
- Disabled connections (show as dashed)

---

## Configuration Additions

```python
class NEATConfig(SimulationConfig):
    # Mutation probabilities
    add_node_prob: float = 0.03
    add_connection_prob: float = 0.05

    # Speciation
    compatibility_threshold: float = 3.0
    c1: float = 1.0  # Excess coefficient
    c2: float = 1.0  # Disjoint coefficient
    c3: float = 0.4  # Weight difference coefficient

    # Species management
    species_stagnation_limit: int = 15  # Generations before removing stagnant species
    elitism_per_species: int = 1        # Top N from each species survive
```

---

## Testing NEAT

```python
class TestNEAT:
    class TestStructuralMutations:
        def test_add_connections_between_valid_nodes(self):
            genome = create_minimal_genome(8, 10)
            before_count = len(genome.connections)
            mutate_add_connection(genome)
            assert len(genome.connections) == before_count + 1

        def test_split_connection_when_adding_node(self):
            genome = create_minimal_genome(8, 10)
            conn = genome.connections[0]
            mutate_add_node(genome)
            assert conn.enabled == False
            assert len([n for n in genome.nodes if n.type == 'hidden']) == 1

    class TestSpeciation:
        def test_group_similar_genomes(self):
            g1 = create_minimal_genome(8, 10)
            g2 = clone_genome(g1)
            mutate_weights(g2, 0.1, 0.1)  # Small weight changes

            assert compatibility_distance(g1, g2) < 3.0

        def test_separate_structurally_different_genomes(self):
            g1 = create_minimal_genome(8, 10)
            g2 = create_minimal_genome(8, 10)
            for _ in range(5):
                mutate_add_node(g2)

            assert compatibility_distance(g1, g2) > 3.0
```

---

## Performance Considerations

### Topological Sort for Forward Pass

NEAT networks can have arbitrary topology. Forward pass requires:

1. **Topological sort** of nodes (inputs → hidden → outputs)
2. **Handle recurrent connections** (optional: either disallow or use previous activation)

```python
def forward_pass(genome: NEATGenome, inputs: list[float]) -> list[float]:
    node_values: dict[int, float] = {}

    # Set input values
    input_nodes = [n for n in genome.nodes if n.type == 'input']
    for i, node in enumerate(input_nodes):
        node_values[node.id] = inputs[i]

    # Process nodes in topological order
    sorted_nodes = topological_sort(genome)
    for node in sorted_nodes:
        if node.type == 'input':
            continue

        # Sum incoming connections
        total = 0.0
        for conn in genome.connections:
            if conn.output_node == node.id and conn.enabled:
                total += node_values[conn.input_node] * conn.weight
        node_values[node.id] = activate(total, node.activation_fn)

    # Return output values
    output_nodes = [n for n in genome.nodes if n.type == 'output']
    return [node_values[n.id] for n in output_nodes]
```

### Memory for Large Populations

With speciation, we track more metadata:
- Innovation history (global)
- Species membership
- Species fitness history

Consider periodic cleanup of stagnant data.

---

## References

- Original NEAT Paper: https://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf
- NEAT-Python: https://neat-python.readthedocs.io/
- MarI/O (NEAT playing Mario): https://www.youtube.com/watch?v=qv6UVOQ0F44
