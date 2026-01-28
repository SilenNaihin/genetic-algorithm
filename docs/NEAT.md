# NEAT Technical Reference

Technical details for NEAT (NeuroEvolution of Augmenting Topologies) implementation in Evolution Lab.

**Implementation checklist**: See `neat-prd.json`

> **Maintenance Note**: Keep this document updated with actual implementation details as we build.
> This is the living technical reference - update code examples to match real implementation.

---

## Implementation Status

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| NEAT Genome Schema | **Complete** | `backend/app/schemas/neat.py` | NeuronGene, ConnectionGene, NEATGenome, InnovationCounter |
| Network Execution | **Complete** | `backend/app/neural/neat_network.py` | create_minimal_neat_genome, topological_sort, neat_forward, would_create_cycle |
| Structural Mutations | **Complete** | `backend/app/genetics/neat_mutation.py` | mutate_add_connection, mutate_add_node, mutate_toggle_connection, mutate_neat_weights, mutate_neat_biases, mutate_neat_genome |
| NEAT Crossover | **Complete** | `backend/app/genetics/neat_crossover.py` | align_genes, neat_crossover, neat_crossover_equal_fitness, crossover_biases |
| Compatibility Distance | **Complete** | `backend/app/genetics/neat_distance.py` | neat_genome_distance, neat_genome_distance_from_dict, create_neat_distance_fn |
| Speciation Integration | **Complete** | `backend/app/genetics/speciation.py` | Already has `distance_fn` param |
| Mutation Integration | **Complete** | `backend/app/genetics/mutation.py` | mutate_genome_neat, NEATMutationConfig |
| Crossover Integration | **Complete** | `backend/app/genetics/crossover.py` | single_point_crossover, uniform_crossover, clone_genome now support use_neat param |
| Population Integration | **Complete** | `backend/app/genetics/population.py` | EvolutionConfig has NEAT fields, evolve_population uses NEAT operators when use_neat=True |
| Genetics Config Schema | **Complete** | `backend/app/schemas/genetics.py` | EvolutionConfig, InnovationCounterState, EvolveRequest/Response with NEAT fields |
| Simulation Config Schema | **Complete** | `backend/app/schemas/simulation.py` | SimulationConfig with NEAT fields (use_neat, mutation rates, distance coefficients) |
| Simulator NEAT Support | **Complete** | `backend/app/services/pytorch_simulator.py` | NEATBatchedNetwork wrapper for per-creature forward pass |
| Run Model/Migration | **Complete** | `backend/app/models/run.py`, `alembic/versions/005_...` | innovation_counter_connection, innovation_counter_node |
| API Changes | **Complete** | `backend/app/api/evolution.py` | Load/save innovation counter, pass NEAT config to evolve/simulate |
| Backend Tests | **Complete** | Various test files | 143 NEAT-related tests pass |
| Frontend Types | **Complete** | `src/types/simulation.ts` | NEAT config fields + NEATGenome, NeuronGene, ConnectionGene, InnovationCounterState |
| Frontend UI | **Complete** | `app/components/menu/NeuralPanel.tsx` | NEAT toggle, Add Connection/Node rates, Max Hidden Nodes sliders |
| Visualizer | **Complete** | `src/ui/NeuralVisualizer.ts` | renderNEAT() with depth-based layout, disabled connections shown dashed |
| Body-Neural Coupling | **Complete** | `backend/app/neural/neat_network.py` | adapt_neat_topology() syncs NEAT outputs to muscle count |
| Storage Service | Not started | `src/services/StorageService.ts` | |

*Update this table as implementation progresses.*

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Recurrent connections | Phase 2 (feedforward first) | Simpler execution, creatures get temporal info from velocity/time inputs |
| Initial topology | Option B (input→output connected) | Per NEAT paper, creatures can act immediately |
| Node deletion | No (follow paper) | Disabled genes can re-enable, simpler bookkeeping |
| Speciation | Reuse existing with pluggable distance | Same algorithm, different distance function for NEAT |
| Fitness sharing + NEAT | Disable sharing when NEAT enabled | Speciation already protects diversity |
| Batching strategy | Per-creature first, optimize later | Correctness over performance initially |
| Innovation scope | Per-run | Simpler, allows parallel runs |
| Config location | Add to existing SimulationConfig/EvolutionConfig | Keeps all evolution params together |
| UI approach | Option C - NEAT toggle transforms Neural panel | Shows NEAT is neural approach, shares time encoding/proprioception |
| Naming | `NeuronGene` not `NodeGene` | Avoids collision with body `NodeGene` in genome.py |

---

## Why NEAT?

Our current fixed-topology networks work but have limitations:

| Current (Fixed) | NEAT (Variable) |
|-----------------|-----------------|
| Manual choice of hidden size (8) | Topology evolves to fit problem |
| All creatures identical structure | Each creature unique architecture |
| Can't grow beyond initial capacity | Starts minimal, grows as needed |
| Wasted parameters for simple behaviors | Only active connections stored |

NEAT lets evolution discover both weights AND structure.

---

## Our Foundation

The proprioception work (Phase 7) already solved key challenges:

### 1. Variable Input Topology
```python
# We already handle variable inputs via masking
input_size = 7 + time_inputs + proprio_inputs  # 7 to 47 inputs
# Invalid inputs masked to 0
```

### 2. Batched Tensor Operations
```python
# Backend already batches across creatures
outputs = network.forward(inputs)  # [batch_size, max_muscles]
```

### 3. Topology Adaptation
```python
# Both fixed-topology and NEAT networks adapt when muscle count changes
def adapt_neural_topology(neural_genome, new_muscle_count):
    # For fixed: copy existing, random init new outputs

def adapt_neat_topology(genome, target_output_count):
    # For NEAT: add/remove output neurons to match muscle count
    # See "NEAT Body-Neural Coupling" section below
```

### 4. Genome Lineage Tracking
```python
# Genomes already have lineage info
genome = {
    'id': str,
    'generation': int,
    'parentIds': list[str],
    # ... can add innovation tracking here
}
```

**Key insight**: We don't need to rewrite everything. We extend what we have.

---

## NEAT Gene Representation

### Current: Flat Weight Arrays
```python
neural_genome = {
    'weights': [...],  # flat array
    'topology': {'inputSize': 8, 'hiddenSize': 8, 'outputSize': 10},
    'activation': 'tanh'
}
```

### NEAT: Connection + Neuron Genes
```python
# Note: We use "NeuronGene" (not "NodeGene") to avoid collision with body NodeGene
neat_genome = {
    'neurons': [
        {'id': 0, 'type': 'input', 'bias': 0.0},
        {'id': 1, 'type': 'input', 'bias': 0.0},
        # ... more inputs
        {'id': 8, 'type': 'output', 'bias': -0.5},
        # ... more outputs
        {'id': 18, 'type': 'hidden', 'bias': 0.0, 'innovation': 42},
    ],
    'connections': [
        {'from_node': 0, 'to_node': 8, 'weight': 0.5, 'enabled': True, 'innovation': 1},
        {'from_node': 1, 'to_node': 8, 'weight': -0.3, 'enabled': True, 'innovation': 2},
        # ...
    ],
    'activation': 'tanh'
}
```

### Innovation Numbers

Every new structural mutation gets a globally unique ID:

```python
# Run-level innovation counter (persisted with run)
innovation_counter = {
    'next_connection': 1000,
    'next_node': 100,
    # Track mutations this generation to avoid duplicates
    'connection_cache': {},  # (from, to) -> innovation_id
    'node_cache': {},        # split_connection_id -> new_node_id
}

def get_connection_innovation(from_node: int, to_node: int) -> int:
    """Same mutation in same generation gets same innovation ID."""
    key = (from_node, to_node)
    if key not in innovation_counter['connection_cache']:
        innovation_counter['connection_cache'][key] = innovation_counter['next_connection']
        innovation_counter['next_connection'] += 1
    return innovation_counter['connection_cache'][key]
```

**Why this matters**: Creatures that independently evolve the same structure (input 3 → hidden 1) get the same innovation ID, enabling meaningful crossover.

---

## Network Execution

### Challenge: Variable Topology in Batched Simulation

Current backend assumes all creatures have identical network shape. NEAT breaks this.

### Solution: Sparse Connection Representation

```python
class NEATBatchedNetwork:
    """Executes variable-topology networks in batch."""

    def __init__(self, genomes: list[dict], max_nodes: int = 64):
        self.batch_size = len(genomes)
        self.max_nodes = max_nodes

        # Sparse adjacency: [batch, max_nodes, max_nodes]
        # Most entries are 0 (no connection)
        self.weights = torch.zeros(self.batch_size, max_nodes, max_nodes)
        self.biases = torch.zeros(self.batch_size, max_nodes)
        self.enabled = torch.zeros(self.batch_size, max_nodes, max_nodes, dtype=torch.bool)

        # Node metadata
        self.node_types = torch.zeros(self.batch_size, max_nodes, dtype=torch.int)
        # 0=unused, 1=input, 2=hidden, 3=output

        # Populate from genomes
        for b, genome in enumerate(genomes):
            self._load_genome(b, genome)

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        """
        inputs: [batch, input_size]
        returns: [batch, output_size]
        """
        # Initialize activations
        activations = torch.zeros(self.batch_size, self.max_nodes)

        # Set input activations
        activations[:, :inputs.shape[1]] = inputs

        # Process in topological order (precomputed per genome)
        for layer_nodes in self.eval_order:
            # Sum incoming connections
            incoming = torch.einsum('bn,bnm->bm', activations, self.weights * self.enabled)
            # Add bias and activate
            activations[:, layer_nodes] = torch.tanh(incoming[:, layer_nodes] + self.biases[:, layer_nodes])

        # Extract outputs
        return activations[:, self.output_indices]
```

### Alternative: Per-Creature Forward Pass

For small populations, individual forward passes may be simpler:

```python
def forward_single(genome: dict, inputs: list[float]) -> list[float]:
    """Non-batched forward pass for a single NEAT genome."""
    node_values = {}

    # Set inputs
    for i, node in enumerate(genome['nodes']):
        if node['type'] == 'input':
            node_values[node['id']] = inputs[i]

    # Process in topological order
    for node_id in topological_sort(genome):
        if genome['nodes'][node_id]['type'] == 'input':
            continue

        total = genome['nodes'][node_id]['bias']
        for conn in genome['connections']:
            if conn['to'] == node_id and conn['enabled']:
                total += node_values[conn['from']] * conn['weight']
        node_values[node_id] = tanh(total)

    # Return outputs
    return [node_values[n['id']] for n in genome['nodes'] if n['type'] == 'output']
```

**Recommendation**: Start with per-creature forward pass for correctness, then optimize to batched if needed.

---

## Structural Mutations

### Add Connection

```python
def mutate_add_connection(genome: dict, innovation_counter: dict) -> bool:
    """Add a new connection between two unconnected nodes."""

    # Find valid source nodes (input or hidden)
    sources = [n for n in genome['nodes'] if n['type'] in ('input', 'hidden')]
    # Find valid target nodes (hidden or output)
    targets = [n for n in genome['nodes'] if n['type'] in ('hidden', 'output')]

    # Get existing connections
    existing = {(c['from'], c['to']) for c in genome['connections']}

    # Find a pair that isn't connected (and wouldn't create a cycle)
    candidates = [
        (s['id'], t['id'])
        for s in sources
        for t in targets
        if (s['id'], t['id']) not in existing
        and not would_create_cycle(genome, s['id'], t['id'])
    ]

    if not candidates:
        return False  # Fully connected

    from_id, to_id = random.choice(candidates)
    innovation = get_connection_innovation(innovation_counter, from_id, to_id)

    genome['connections'].append({
        'from': from_id,
        'to': to_id,
        'weight': random.uniform(-0.5, 0.5),
        'enabled': True,
        'innovation': innovation
    })
    return True
```

### Add Node

```python
def mutate_add_node(genome: dict, innovation_counter: dict) -> bool:
    """Split an existing connection with a new hidden node."""

    # Pick a random enabled connection
    enabled_conns = [c for c in genome['connections'] if c['enabled']]
    if not enabled_conns:
        return False

    conn = random.choice(enabled_conns)
    conn['enabled'] = False  # Disable original

    # Create new hidden node
    new_node_id = max(n['id'] for n in genome['nodes']) + 1
    node_innovation = get_node_innovation(innovation_counter, conn['innovation'])

    genome['nodes'].append({
        'id': new_node_id,
        'type': 'hidden',
        'bias': 0.0,
        'innovation': node_innovation
    })

    # Add two new connections through the new node
    # in -> new: weight 1.0 (preserves signal)
    # new -> out: original weight (preserves behavior initially)
    genome['connections'].append({
        'from': conn['from'],
        'to': new_node_id,
        'weight': 1.0,
        'enabled': True,
        'innovation': get_connection_innovation(innovation_counter, conn['from'], new_node_id)
    })
    genome['connections'].append({
        'from': new_node_id,
        'to': conn['to'],
        'weight': conn['weight'],
        'enabled': True,
        'innovation': get_connection_innovation(innovation_counter, new_node_id, conn['to'])
    })

    return True
```

### Mutation Probabilities

```python
NEAT_MUTATION_CONFIG = {
    'weight_mutate_rate': 0.8,      # Probability of any weight mutation
    'weight_perturb_rate': 0.9,     # Of mutations: perturb vs reset
    'weight_perturb_magnitude': 0.2,

    'add_connection_rate': 0.05,    # Per-genome probability
    'add_node_rate': 0.03,          # Per-genome probability
    'disable_connection_rate': 0.01,
    'enable_connection_rate': 0.02,
}
```

---

## NEAT Crossover

### Gene Alignment by Innovation

```
Parent A (fitness 85):  [1, 2, 3, 5, 6, 8, 9]
Parent B (fitness 70):  [1, 2, 4, 5, 7, 9, 10]
                         ↓  ↓  ↓  ↓  ↓  ↓  ↓
Aligned:                 M  M  D  D  M  D  D  D  E  E
                         1  2  3  4  5  6  7  8  9  10

M = Matching (both have it)
D = Disjoint (only one has it, within range)
E = Excess (only one has it, beyond other's max)
```

### Crossover Rules

```python
def neat_crossover(parent_a: dict, parent_b: dict, fitness_a: float, fitness_b: float) -> dict:
    """NEAT crossover: align genes by innovation, inherit from fitter parent."""

    # Ensure A is the fitter parent
    if fitness_b > fitness_a:
        parent_a, parent_b = parent_b, parent_a
        fitness_a, fitness_b = fitness_b, fitness_a

    child_connections = []

    # Index parent B connections by innovation
    b_by_innovation = {c['innovation']: c for c in parent_b['connections']}

    for conn_a in parent_a['connections']:
        inn = conn_a['innovation']

        if inn in b_by_innovation:
            # Matching gene: randomly inherit from either
            conn_b = b_by_innovation[inn]
            chosen = random.choice([conn_a, conn_b])
            child_connections.append(copy_connection(chosen))

            # If either parent has it disabled, 75% chance child disabled
            if not conn_a['enabled'] or not conn_b['enabled']:
                if random.random() < 0.75:
                    child_connections[-1]['enabled'] = False
        else:
            # Disjoint/Excess: inherit from fitter parent (A)
            child_connections.append(copy_connection(conn_a))

    # Inherit nodes from fitter parent
    child_nodes = [copy_node(n) for n in parent_a['nodes']]

    return {
        'nodes': child_nodes,
        'connections': child_connections,
        'activation': parent_a['activation']
    }
```

### Cycle Prevention in Crossover

Crossover can create cycles when combining disjoint/excess genes from both parents:

```
Parent A: H1 → H2 (innovation 5, disjoint)
Parent B: H2 → H1 (innovation 7, disjoint)

Equal fitness crossover inherits both → cycle: H1 → H2 → H1
```

**Solution**: Filter connections after gene alignment, processing by innovation order:

```python
def _filter_cycle_creating_connections(neurons, connections):
    """Process connections in order, keeping only those that don't create cycles."""
    filtered = []
    for conn in connections:
        if not would_create_cycle(neurons, filtered, conn.from_node, conn.to_node):
            filtered.append(conn)
    return filtered

# Applied before returning child genome:
child_connections = _filter_cycle_creating_connections(child_neurons, child_connections)
```

**Why lower innovation numbers win**: Connections are aligned and sorted by innovation number. When H1→H2 (inn 5) is processed first, it's accepted. Then H2→H1 (inn 7) is rejected because it would create a cycle. Lower innovation = older mutation = more established in the population, so it makes sense to prioritize these.

**Where cycles are prevented**:

| Location | Scenario |
|----------|----------|
| `mutate_add_connection` | New connection would close a loop |
| `mutate_enable_connection` | Re-enabling disabled connection that now forms cycle |
| `mutate_toggle_connection` | Same as above |
| `neat_crossover` | Combining disjoint/excess from both parents |
| `neat_crossover_equal_fitness` | More likely since both parents contribute |

**Why cycles can form from re-enabling**:
1. Add A→B (enabled)
2. Disable A→B
3. Add B→A (valid - A→B is disabled, no cycle)
4. Re-enable A→B → cycle!

The enable functions now check `would_create_cycle()` before re-enabling.

---

## Speciation

### Compatibility Distance

```python
def compatibility_distance(genome_a: dict, genome_b: dict, config: dict) -> float:
    """
    Measure how different two genomes are structurally and by weights.

    δ = (c1 × E / N) + (c2 × D / N) + (c3 × W̄)

    E = excess genes
    D = disjoint genes
    N = genes in larger genome (normalized)
    W̄ = average weight difference of matching genes
    """
    c1 = config.get('excess_coefficient', 1.0)
    c2 = config.get('disjoint_coefficient', 1.0)
    c3 = config.get('weight_coefficient', 0.4)

    a_innovations = {c['innovation'] for c in genome_a['connections']}
    b_innovations = {c['innovation'] for c in genome_b['connections']}

    matching = a_innovations & b_innovations
    disjoint_a = a_innovations - b_innovations
    disjoint_b = b_innovations - a_innovations

    max_a = max(a_innovations) if a_innovations else 0
    max_b = max(b_innovations) if b_innovations else 0

    # Excess = genes beyond other genome's max innovation
    excess = len([i for i in disjoint_a if i > max_b]) + \
             len([i for i in disjoint_b if i > max_a])

    # Disjoint = non-matching genes within range
    disjoint = len(disjoint_a) + len(disjoint_b) - excess

    # Average weight difference
    if matching:
        a_by_inn = {c['innovation']: c for c in genome_a['connections']}
        b_by_inn = {c['innovation']: c for c in genome_b['connections']}
        weight_diff = sum(
            abs(a_by_inn[i]['weight'] - b_by_inn[i]['weight'])
            for i in matching
        ) / len(matching)
    else:
        weight_diff = 0.0

    N = max(len(genome_a['connections']), len(genome_b['connections']), 1)

    return (c1 * excess / N) + (c2 * disjoint / N) + (c3 * weight_diff)
```

### Species Management

```python
class Species:
    id: int
    representative: dict      # Genome that defines the species
    members: list[dict]       # Current generation's members
    fitness_history: list[float]  # Best fitness per generation
    generations_stagnant: int

def assign_species(population: list[dict], species_list: list[Species], threshold: float):
    """Assign each genome to a species or create new one."""

    for genome in population:
        assigned = False

        for species in species_list:
            if compatibility_distance(genome, species.representative, {}) < threshold:
                species.members.append(genome)
                assigned = True
                break

        if not assigned:
            # Create new species
            species_list.append(Species(
                id=next_species_id(),
                representative=genome,
                members=[genome],
                fitness_history=[],
                generations_stagnant=0
            ))

def cull_stagnant_species(species_list: list[Species], stagnation_limit: int = 15):
    """Remove species that haven't improved in N generations."""
    return [
        s for s in species_list
        if s.generations_stagnant < stagnation_limit
    ]
```

---

## Integration with Current System

### Config Additions

```typescript
// src/types/simulation.ts
interface NEATConfig {
  useNEAT: boolean;                    // Toggle NEAT vs fixed topology

  // Structural mutation rates
  addConnectionRate: number;           // Default 0.05
  addNodeRate: number;                 // Default 0.03

  // Speciation
  compatibilityThreshold: number;      // Default 3.0
  excessCoefficient: number;           // Default 1.0
  disjointCoefficient: number;         // Default 1.0
  weightCoefficient: number;           // Default 0.4

  // Species management
  speciesStagnationLimit: number;      // Default 15
  speciesElitism: number;              // Default 1 (top N survive)

  // Topology limits
  maxHiddenNodes: number;              // Default 16 (prevent bloat)
  maxConnections: number;              // Default 128
}
```

### Database Schema

```python
# New columns for Run model
innovation_counter_connection = Column(Integer, default=0)
innovation_counter_node = Column(Integer, default=0)

# New table for species tracking
class SpeciesRecord(Base):
    __tablename__ = 'species'

    id = Column(Integer, primary_key=True)
    run_id = Column(UUID, ForeignKey('runs.id'))
    species_id = Column(Integer)
    generation_created = Column(Integer)
    generation_extinct = Column(Integer, nullable=True)
    best_fitness = Column(Float)
    representative_genome = Column(JSON)
```

### API Changes

```python
# POST /runs/{run_id}/generations/{gen}/evolve
# Request body gets new fields:
{
    "use_neat": true,
    "neat_config": {
        "add_connection_rate": 0.05,
        "add_node_rate": 0.03,
        ...
    }
}

# Response includes innovation counter state:
{
    "generation": 42,
    "genomes": [...],
    "innovation_state": {
        "next_connection": 1523,
        "next_node": 87
    },
    "species": [
        {"id": 1, "size": 15, "best_fitness": 234.5},
        {"id": 3, "size": 8, "best_fitness": 198.2},
        ...
    ]
}
```

---

## UI Architecture (Option C)

NEAT toggle transforms the Neural panel rather than creating a separate panel.
This keeps related params together since NEAT is fundamentally a neural approach.

### Neural Panel with NEAT

```
Neural Panel:
┌────────────────────────────────────────────────────┐
│ [x] Use NEAT (evolve topology)    ← Master toggle  │
├────────────────────────────────────────────────────┤
│ Time Encoding: [cyclic ▼]         ← Still applies  │
│ [x] Proprioception                ← Still applies  │
│ Activation: [tanh ▼]              ← Still applies  │
├────────────────────────────────────────────────────┤
│ Hidden Size: [8]          ← HIDDEN when NEAT on    │
├────────────────────────────────────────────────────┤
│ ▼ NEAT Topology (collapsible, shown when NEAT on)  │
│   Add Connection Rate: [====|----] 0.05            │
│   Add Node Rate:       [===|-----] 0.03            │
│   Max Hidden Neurons:  [16]                        │
│                                                    │
│ ▼ NEAT Speciation Coefficients (for distance fn)   │
│   Excess Coefficient:   [1.0]                      │
│   Disjoint Coefficient: [1.0]                      │
│   Weight Coefficient:   [0.4]                      │
└────────────────────────────────────────────────────┘
```

### Automatic Behavior When NEAT Enabled

- `selection_method` → **auto-set to 'speciation'** (NEAT requires speciation)
- `use_fitness_sharing` → **auto-disabled** (redundant with speciation)
- `neural_hidden_size` → **ignored** (topology evolves)
- Speciation distance function → **switches to `neat_genome_distance()`**

### Config Integration

NEAT params are added to existing configs (not a separate NEATConfig):

```python
# In SimulationConfig / EvolutionConfig:
use_neat: bool = False

# Structural mutations (only used when use_neat=True)
neat_add_connection_rate: float = 0.05
neat_add_node_rate: float = 0.03
neat_max_hidden_neurons: int = 16

# NEAT speciation coefficients (only used when use_neat=True)
neat_excess_coefficient: float = 1.0
neat_disjoint_coefficient: float = 1.0
neat_weight_coefficient: float = 0.4
```


### Network Visualizer

Current visualizer assumes fixed layers. NEAT needs:

1. **Graph layout** - Position nodes by layer depth (longest path from inputs)
2. **Skip connections** - Draw connections that skip layers
3. **Disabled connections** - Show as dashed/faded lines
4. **Node labels** - Show innovation IDs for debugging
5. **Species coloring** - Optional: color by species membership

```
Before (fixed):          After (NEAT):
●─●─●                    ●───────────●
●─●─●                    ●─●─────●───●
●─●─●                      └─●───┘
```

### Stats Panel

Add species info:

```
Generation 42
├── Best Fitness: 234.5
├── Species: 5 (↑2 new, ↓1 extinct)
├── Avg Nodes: 12.3 (max 18)
└── Avg Connections: 45.2 (max 67)
```

---

## Testing Strategy

### Unit Tests

```python
class TestNEATGenome:
    def test_create_minimal_genome_has_all_io_connections(self):
        genome = create_minimal_neat_genome(8, 10)
        assert len(genome['connections']) == 8 * 10  # Full input->output

    def test_forward_pass_matches_equivalent_fixed_topology(self):
        # Create identical networks, verify same output
        pass

class TestStructuralMutations:
    def test_add_connection_creates_valid_connection(self):
        genome = create_minimal_neat_genome(8, 10)
        before = len(genome['connections'])
        mutate_add_connection(genome, innovation_counter)
        assert len(genome['connections']) == before + 1

    def test_add_node_disables_original_connection(self):
        genome = create_minimal_neat_genome(8, 10)
        conn = genome['connections'][0]
        mutate_add_node(genome, innovation_counter)
        assert conn['enabled'] == False

    def test_same_mutation_gets_same_innovation(self):
        # Two genomes adding same connection get same innovation ID
        pass

class TestNEATCrossover:
    def test_matching_genes_inherited_from_either_parent(self):
        pass

    def test_disjoint_genes_inherited_from_fitter_parent(self):
        pass

class TestSpeciation:
    def test_similar_genomes_same_species(self):
        pass

    def test_different_topologies_different_species(self):
        pass

    def test_stagnant_species_culled(self):
        pass
```

### Integration Tests

```python
class TestNEATEvolution:
    def test_topology_grows_over_generations(self):
        """Networks should gain complexity over time."""
        run = create_run(use_neat=True)
        initial_avg_nodes = avg_hidden_nodes(run.genomes)

        for _ in range(50):
            evolve_generation(run)

        final_avg_nodes = avg_hidden_nodes(run.genomes)
        assert final_avg_nodes > initial_avg_nodes

    def test_species_form_and_persist(self):
        """Multiple species should coexist."""
        pass
```

---

## NEAT Body-Neural Coupling

Unlike fixed-topology networks, NEAT genomes have **structural complexity** (neurons, connections with innovation IDs). When the creature's body mutates (muscles added/removed), the NEAT genome must adapt.

### The Problem

Body mutations can change muscle count:
- `mutate_add_node` can create new muscles (connecting new body nodes)
- `mutate_remove_node` removes a body node and all its muscles
- Crossover can produce children with different muscle counts than parents

If NEAT outputs don't adapt:
- Extra outputs waste evolution effort (optimizing non-existent muscles)
- Missing outputs leave muscles uncontrolled
- Visualization shows misleading connections (O8 for a 3-muscle creature)

### The Solution: `adapt_neat_topology()`

```python
def adapt_neat_topology(genome: NEATGenome, target_output_count: int) -> NEATGenome:
    """Adapt NEAT genome when muscle count changes."""

    current_outputs = [n for n in genome.neurons if n.type == 'output']

    if target_output_count > len(current_outputs):
        # MUSCLES ADDED: Create new output neurons
        for i in range(target_output_count - len(current_outputs)):
            new_output = NeuronGene(id=next_id, type='output', bias=output_bias)
            # Add sparse connections from random input/bias
            # Add bias connection if using bias_node mode

    elif target_output_count < len(current_outputs):
        # MUSCLES REMOVED: Remove excess output neurons (highest IDs)
        outputs_to_remove = sorted_output_ids[target_output_count:]
        genome.neurons = [n for n in neurons if n.id not in outputs_to_remove]
        genome.connections = [c for c in connections
                            if c.from_node not in outputs_to_remove
                            and c.to_node not in outputs_to_remove]
```

### Why This Doesn't Need Innovation Scores

Innovation numbers enable **crossover alignment** - matching genes across parents to inherit correctly. But topology adaptation is different:

| Operation | Innovation Needed? | Why |
|-----------|-------------------|-----|
| Crossover | Yes | Must align matching genes between parents |
| Add Node mutation | Yes | Same split should get same innovation in population |
| Add Connection mutation | Yes | Same connection should get same innovation |
| **Topology Adaptation** | **No** | Single genome, no alignment needed |

When adapting topology:
- **Adding outputs**: We create NEW neurons that didn't exist before. They get fresh innovation IDs (or none - output neurons don't need innovation tracking for crossover since they're always present).
- **Removing outputs**: We delete neurons entirely. No need to track what was removed.

The key insight: **Innovation numbers are for crossover alignment, not for internal genome restructuring.**

### When Adaptation Happens

Adaptation is called in three places:

1. **After crossover** (`crossover.py`): Child may have different muscle count than parents
2. **After body mutation** (`mutation.py`): Structural mutation may add/remove muscles
3. **After cloning** (`crossover.py`): Constraints may reduce muscle count

```python
# In single_point_crossover():
neat_genome = crossover_neat_genomes(parent1, parent2, fitness1, fitness2)
if output_count != len(child_muscles):
    neat_genome = adapt_neat_topology(neat_genome, len(child_muscles))

# In mutate_genome_neat():
mutated_neat = mutate_neat_genome(neat_genome, counter, ...)
if output_count != len(new_genome['muscles']):
    mutated_neat = adapt_neat_topology(mutated_neat, len(new_genome['muscles']))
```

### Muscle Removal: What Happens to Evolved Connections?

When a muscle is removed (say muscle 5 of 6):
1. Output neuron O5 is removed
2. ALL connections to/from O5 are removed (including evolved hidden→O5 connections)
3. Remaining outputs (O0-O4) keep their evolved connections intact

This is "safe" because:
- The removed connections were specific to a muscle that no longer exists
- Evolution will naturally rebuild connections to the remaining muscles if needed
- It's simpler than trying to "remap" connections (which muscle should inherit O5's connections?)

### Muscle Addition: What Connections Are Created?

When a muscle is added:
1. New output neuron created with standard output bias
2. One sparse connection from a random input/bias neuron (weight random [-0.5, 0.5])
3. If using `bias_node` mode, also adds bias→new_output connection

The new output starts "underdeveloped" compared to existing ones, but NEAT mutations (add_connection, weight perturbation) will evolve it over generations.

---

## Edge Cases

1. **Fully connected genome**: `mutate_add_connection` returns False
2. **No enabled connections**: `mutate_add_node` returns False
3. **Cycle detection**: Adding connection A→B when path B→A exists
4. **Empty species**: Remove after all members culled
5. **Single species**: All creatures too similar, threshold too high
6. **Innovation overflow**: Use UUID or reset per run
7. **Recurrent connections**: Disallow for simplicity (feedforward only)
8. **Zero muscles**: Don't adapt (preserve original outputs for genomes without bodies)

---

## Configuration Defaults

```python
DEFAULT_NEAT_CONFIG = {
    # Structural mutations
    'add_connection_rate': 0.05,
    'add_node_rate': 0.03,
    'enable_connection_rate': 0.02,
    'disable_connection_rate': 0.01,

    # Weight mutations (same as current)
    'weight_mutate_rate': 0.8,
    'weight_perturb_rate': 0.9,
    'weight_perturb_magnitude': 0.2,

    # Speciation
    'compatibility_threshold': 3.0,
    'excess_coefficient': 1.0,
    'disjoint_coefficient': 1.0,
    'weight_coefficient': 0.4,
    'species_stagnation_limit': 15,
    'species_elitism': 1,

    # Limits
    'max_hidden_nodes': 16,
    'max_connections': 128,
}
```

---

## Migration Path

### Backward Compatibility

- `use_neat: false` (default) uses existing fixed topology
- Existing saved runs continue working unchanged
- NEAT is opt-in per new run

### Genome Conversion

```python
def fixed_to_neat_genome(fixed_genome: dict) -> dict:
    """Convert a fixed-topology genome to NEAT format."""
    topology = fixed_genome['topology']
    weights = fixed_genome['weights']

    nodes = []
    connections = []
    innovation = 0

    # Create input nodes
    for i in range(topology['inputSize']):
        nodes.append({'id': i, 'type': 'input', 'bias': 0.0})

    # Create hidden nodes
    hidden_start = topology['inputSize']
    for i in range(topology['hiddenSize']):
        nodes.append({
            'id': hidden_start + i,
            'type': 'hidden',
            'bias': weights[...],  # Extract from weight array
            'innovation': i
        })

    # Create output nodes
    output_start = hidden_start + topology['hiddenSize']
    for i in range(topology['outputSize']):
        nodes.append({
            'id': output_start + i,
            'type': 'output',
            'bias': weights[...],
            'innovation': topology['hiddenSize'] + i
        })

    # Create connections with sequential innovations
    # ... (extract from weight matrices)

    return {'nodes': nodes, 'connections': connections, 'activation': 'tanh'}
```

---

## References

### Papers

- **NEAT**: [Evolving Neural Networks through Augmenting Topologies](https://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf) - Stanley & Miikkulainen, 2002
  - The foundational paper. Introduces innovation numbers, speciation, and minimal topology initialization.

- **HyperNEAT**: [A Hypercube-Based Encoding for Evolving Large-Scale Neural Networks](http://eplex.cs.ucf.edu/papers/stanley_alife09.pdf) - Stanley et al., 2009
  - Uses CPPNs to generate weights for large networks. Future consideration for many-muscle creatures.

- **NEAT-MODS**: [Autonomous Evolution of Topographic Regularities](https://www.cs.ucf.edu/~kstanley/neat.html) - Stanley, 2004
  - Multi-objective variant. Could be useful for balancing fitness vs efficiency.

### Implementations

- [NEAT-Python](https://neat-python.readthedocs.io/) - Well-documented Python implementation
- [SharpNEAT](https://sharpneat.sourceforge.io/) - High-performance C# implementation
- [MarI/O](https://www.youtube.com/watch?v=qv6UVOQ0F44) - Famous demo of NEAT playing Super Mario World

### Related

- [Fitness Sharing Paper](https://www.complex-systems.com/abstracts/v01_i04_a04/) - Goldberg & Richardson, 1987
  - Original fitness sharing for GA diversity. We use speciation instead for NEAT.

---

## Speciation Integration

NEAT requires speciation but we're already implementing it (Phase 10). The only difference is the **distance function**:

### Fixed Topology (current)
```python
def neural_genome_distance(genome_a, genome_b):
    """Compare flat weight arrays."""
    weights_a = genome_a['neuralGenome']['weights']
    weights_b = genome_b['neuralGenome']['weights']
    return sum(abs(a - b) for a, b in zip(weights_a, weights_b)) / len(weights_a)
```

### NEAT
```python
def neat_genome_distance(genome_a, genome_b, config):
    """Compare by innovation IDs: excess + disjoint + weight diff."""
    # See Compatibility Distance section above
```

### Integration Approach

Make `assign_species()` accept a distance function parameter:

```python
def assign_species(
    genomes: list[dict],
    fitness_scores: list[float],
    threshold: float,
    distance_fn = neural_genome_distance  # Default for fixed topology
) -> list[Species]:
    """Assign genomes to species using provided distance function."""
    # Same algorithm, just uses distance_fn instead of hardcoded function
```

When NEAT is enabled:
```python
if config.use_neat:
    distance_fn = lambda a, b: neat_genome_distance(a, b, config)
    # Also auto-disable fitness sharing (redundant with speciation)
```

---

## Future Considerations

### Recurrent NEAT (Phase 2)

Feedforward-only is simpler but recurrent connections enable:
- Temporal memory (remember past states)
- Rhythm generation without external time input
- More complex behaviors

Implementation would require:
- Allow cycles in `mutate_add_connection()`
- Track previous activations per node
- Process nodes in fixed order (not topological)

### Node Pruning (Maybe Later)

Classic NEAT accumulates dead nodes. If bloat becomes problematic:
- Remove nodes with no enabled connections
- Would need to handle innovation ID implications

### HyperNEAT (Future)

For very large networks (many muscles), HyperNEAT uses a CPPN to generate weights:
- Scales better than direct encoding
- Exploits geometric regularities
- Significant additional complexity
