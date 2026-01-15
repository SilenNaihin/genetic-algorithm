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

```typescript
interface ConnectionGene {
  innovationNumber: number;  // Global unique ID
  inputNode: number;         // Source node ID
  outputNode: number;        // Target node ID
  weight: number;            // Connection weight
  enabled: boolean;          // Can be disabled by mutation
}

interface NodeGene {
  id: number;
  type: 'input' | 'hidden' | 'output';
  activationFn: string;
}

interface NEATGenome {
  nodes: NodeGene[];
  connections: ConnectionGene[];
}
```

### 2. Historical Markings

Every time a new connection is created (anywhere in the population), it gets a **unique innovation number**:

```typescript
let globalInnovationCounter = 0;

function createConnection(input: number, output: number, weight: number): ConnectionGene {
  return {
    innovationNumber: globalInnovationCounter++,
    inputNode: input,
    outputNode: output,
    weight,
    enabled: true
  };
}
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

```typescript
// Add a new connection between existing nodes
function mutateAddConnection(genome: NEATGenome): void {
  const input = randomNode(genome, ['input', 'hidden']);
  const output = randomNode(genome, ['hidden', 'output']);

  if (!connectionExists(genome, input, output)) {
    genome.connections.push(createConnection(input.id, output.id, randomWeight()));
  }
}

// Add a new node by splitting an existing connection
function mutateAddNode(genome: NEATGenome): void {
  const conn = randomEnabledConnection(genome);
  conn.enabled = false;  // Disable old connection

  const newNode: NodeGene = {
    id: nextNodeId++,
    type: 'hidden',
    activationFn: 'tanh'
  };
  genome.nodes.push(newNode);

  // Add two new connections through the new node
  genome.connections.push(createConnection(conn.inputNode, newNode.id, 1.0));
  genome.connections.push(createConnection(newNode.id, conn.outputNode, conn.weight));
}
```

### 5. Speciation

Networks are grouped into **species** based on structural similarity:

```typescript
function compatibilityDistance(g1: NEATGenome, g2: NEATGenome): number {
  const { matching, disjoint, excess } = alignGenes(g1, g2);

  const N = Math.max(g1.connections.length, g2.connections.length);
  const avgWeightDiff = matching.reduce((sum, [c1, c2]) =>
    sum + Math.abs(c1.weight - c2.weight), 0) / matching.length;

  return (c1 * excess / N) + (c2 * disjoint / N) + (c3 * avgWeightDiff);
}

function assignToSpecies(genome: NEATGenome, species: Species[]): void {
  for (const sp of species) {
    if (compatibilityDistance(genome, sp.representative) < threshold) {
      sp.members.push(genome);
      return;
    }
  }
  // No compatible species found, create new one
  species.push({ representative: genome, members: [genome] });
}
```

Selection happens **within species**, protecting novel structures.

---

## Migration Path

### Current Fixed-Topology Code

```typescript
// Current: flat weight array
const weights: number[] = [...];
const nn = NeuralNetwork.fromWeights(weights, config);
const output = nn.predict(inputs);
```

### NEAT Equivalent

```typescript
// NEAT: gene-based genome
const genome: NEATGenome = {
  nodes: [...],
  connections: [...]
};
const nn = NEATNetwork.fromGenome(genome);
const output = nn.predict(inputs);
```

### Shared Interface

Both should implement:

```typescript
interface NeuralController {
  predict(inputs: number[]): number[];
  getActivations(): { hidden: number[]; outputs: number[] };
}
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

```typescript
interface NEATConfig extends NeuralConfig {
  // Mutation probabilities
  addNodeProb: number;           // 0.03 default
  addConnectionProb: number;     // 0.05 default

  // Speciation
  compatibilityThreshold: number; // 3.0 default
  c1: number;                     // Excess coefficient
  c2: number;                     // Disjoint coefficient
  c3: number;                     // Weight difference coefficient

  // Species management
  speciesStagnationLimit: number; // Generations before removing stagnant species
  elitismPerSpecies: number;      // Top N from each species survive
}
```

---

## Testing NEAT

```typescript
describe('NEAT', () => {
  describe('Structural Mutations', () => {
    it('should add connections between valid nodes', () => {
      const genome = createMinimalGenome(8, 10);
      const beforeCount = genome.connections.length;
      mutateAddConnection(genome);
      expect(genome.connections.length).toBe(beforeCount + 1);
    });

    it('should split connection when adding node', () => {
      const genome = createMinimalGenome(8, 10);
      const conn = genome.connections[0];
      mutateAddNode(genome);
      expect(conn.enabled).toBe(false);
      expect(genome.nodes.filter(n => n.type === 'hidden').length).toBe(1);
    });
  });

  describe('Speciation', () => {
    it('should group similar genomes', () => {
      const g1 = createMinimalGenome(8, 10);
      const g2 = cloneGenome(g1);
      mutateWeights(g2, 0.1, 0.1);  // Small weight changes

      expect(compatibilityDistance(g1, g2)).toBeLessThan(3.0);
    });

    it('should separate structurally different genomes', () => {
      const g1 = createMinimalGenome(8, 10);
      const g2 = createMinimalGenome(8, 10);
      for (let i = 0; i < 5; i++) mutateAddNode(g2);

      expect(compatibilityDistance(g1, g2)).toBeGreaterThan(3.0);
    });
  });
});
```

---

## Performance Considerations

### Topological Sort for Forward Pass

NEAT networks can have arbitrary topology. Forward pass requires:

1. **Topological sort** of nodes (inputs → hidden → outputs)
2. **Handle recurrent connections** (optional: either disallow or use previous activation)

```typescript
function forwardPass(genome: NEATGenome, inputs: number[]): number[] {
  const nodeValues = new Map<number, number>();

  // Set input values
  genome.nodes
    .filter(n => n.type === 'input')
    .forEach((n, i) => nodeValues.set(n.id, inputs[i]));

  // Process nodes in topological order
  const sortedNodes = topologicalSort(genome);
  for (const node of sortedNodes) {
    if (node.type === 'input') continue;

    // Sum incoming connections
    let sum = 0;
    for (const conn of genome.connections) {
      if (conn.outputNode === node.id && conn.enabled) {
        sum += nodeValues.get(conn.inputNode)! * conn.weight;
      }
    }
    nodeValues.set(node.id, activate(sum, node.activationFn));
  }

  // Return output values
  return genome.nodes
    .filter(n => n.type === 'output')
    .map(n => nodeValues.get(n.id)!);
}
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
