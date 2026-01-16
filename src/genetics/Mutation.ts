import type {
  CreatureGenome,
  NodeGene,
  MuscleGene,
  GenomeConstraints,
  Vector3
} from '../types';
import { DEFAULT_GENOME_CONSTRAINTS } from '../types';
import { generateId } from '../utils/id';
import { distance, clamp, normalize } from '../utils/math';
import type { NeuralGenomeData } from '../neural/NeuralGenome';
import { cloneNeuralGenome } from '../neural/NeuralGenome';

export interface MutationConfig {
  rate: number;           // Probability of mutation per gene
  magnitude: number;      // How much values change (0-1 scale)
  structuralRate: number; // Probability of adding/removing nodes/muscles
}

export const DEFAULT_MUTATION_CONFIG: MutationConfig = {
  rate: 0.3,
  magnitude: 0.5,
  structuralRate: 0.1
};

function mutateValue(
  value: number,
  min: number,
  max: number,
  magnitude: number
): number {
  const range = max - min;
  const delta = (Math.random() * 2 - 1) * range * magnitude;
  return clamp(value + delta, min, max);
}

/**
 * Mutate a node gene
 */
export function mutateNode(
  node: NodeGene,
  config: MutationConfig,
  constraints: GenomeConstraints
): NodeGene {
  const newNode = { ...node };

  if (Math.random() < config.rate) {
    newNode.size = mutateValue(
      node.size,
      constraints.minSize,
      constraints.maxSize,
      config.magnitude
    );
  }

  if (Math.random() < config.rate) {
    newNode.friction = mutateValue(node.friction, 0.1, 1.0, config.magnitude);
  }

  // Mutate position slightly
  if (Math.random() < config.rate) {
    newNode.position = {
      x: mutateValue(node.position.x, -constraints.spawnRadius, constraints.spawnRadius, config.magnitude * 0.5),
      y: mutateValue(node.position.y, 0.3, constraints.spawnRadius * 1.5, config.magnitude * 0.5),
      z: mutateValue(node.position.z, -constraints.spawnRadius, constraints.spawnRadius, config.magnitude * 0.5)
    };
  }

  return newNode;
}

/**
 * Mutate a muscle gene
 */
export function mutateMuscle(
  muscle: MuscleGene,
  config: MutationConfig,
  constraints: GenomeConstraints
): MuscleGene {
  const newMuscle = { ...muscle };

  if (Math.random() < config.rate) {
    newMuscle.stiffness = mutateValue(
      muscle.stiffness,
      constraints.minStiffness,
      constraints.maxStiffness,
      config.magnitude
    );
  }

  if (Math.random() < config.rate) {
    newMuscle.damping = mutateValue(muscle.damping, 0.05, 0.8, config.magnitude);
  }

  if (Math.random() < config.rate) {
    newMuscle.frequency = mutateValue(
      muscle.frequency,
      constraints.minFrequency,
      constraints.maxFrequency,
      config.magnitude
    );
  }

  if (Math.random() < config.rate) {
    newMuscle.amplitude = mutateValue(
      muscle.amplitude,
      0.05,
      constraints.maxAmplitude,
      config.magnitude
    );
  }

  if (Math.random() < config.rate) {
    newMuscle.phase = mutateValue(muscle.phase, 0, Math.PI * 2, config.magnitude);
  }

  if (Math.random() < config.rate) {
    newMuscle.restLength = mutateValue(muscle.restLength, 0.2, 4.0, config.magnitude * 0.3);
  }

  // v1: Mutate direction bias (the direction that activates this muscle)
  if (Math.random() < config.rate && muscle.directionBias) {
    // Perturb the direction vector and re-normalize
    const perturbedBias = {
      x: muscle.directionBias.x + (Math.random() * 2 - 1) * config.magnitude,
      y: muscle.directionBias.y + (Math.random() * 2 - 1) * config.magnitude,
      z: muscle.directionBias.z + (Math.random() * 2 - 1) * config.magnitude
    };
    newMuscle.directionBias = normalize(perturbedBias);
  }

  // v1: Mutate bias strength (how much direction affects this muscle)
  if (Math.random() < config.rate && muscle.biasStrength !== undefined) {
    newMuscle.biasStrength = mutateValue(muscle.biasStrength, 0, 1.0, config.magnitude);
  }

  // v2: Mutate velocity bias (proprioception - preferred movement direction)
  if (Math.random() < config.rate && muscle.velocityBias) {
    const perturbedVelocityBias = {
      x: muscle.velocityBias.x + (Math.random() * 2 - 1) * config.magnitude,
      y: muscle.velocityBias.y + (Math.random() * 2 - 1) * config.magnitude,
      z: muscle.velocityBias.z + (Math.random() * 2 - 1) * config.magnitude
    };
    newMuscle.velocityBias = normalize(perturbedVelocityBias);
  }

  // v2: Mutate velocity strength (how much own movement affects this muscle)
  if (Math.random() < config.rate && muscle.velocityStrength !== undefined) {
    newMuscle.velocityStrength = mutateValue(muscle.velocityStrength, 0, 1.0, config.magnitude);
  }

  // v2: Mutate distance bias (-1 = far, +1 = near)
  if (Math.random() < config.rate && muscle.distanceBias !== undefined) {
    newMuscle.distanceBias = mutateValue(muscle.distanceBias, -1.0, 1.0, config.magnitude);
  }

  // v2: Mutate distance strength (how much pellet distance affects this muscle)
  if (Math.random() < config.rate && muscle.distanceStrength !== undefined) {
    newMuscle.distanceStrength = mutateValue(muscle.distanceStrength, 0, 1.0, config.magnitude);
  }

  return newMuscle;
}

/**
 * Add a new node to the genome
 */
export function addNode(
  genome: CreatureGenome,
  constraints: GenomeConstraints
): { node: NodeGene; muscle: MuscleGene } | null {
  // Check both node and muscle limits (adding a node also requires adding a muscle)
  if (genome.nodes.length >= constraints.maxNodes || genome.muscles.length >= constraints.maxMuscles) {
    return null;
  }

  // Create new node near an existing node
  const parentNode = genome.nodes[Math.floor(Math.random() * genome.nodes.length)];

  const newNode: NodeGene = {
    id: generateId('node'),
    size: Math.random() * (constraints.maxSize - constraints.minSize) + constraints.minSize,
    friction: Math.random() * 0.5 + 0.3,
    position: {
      x: parentNode.position.x + (Math.random() * 2 - 1) * 1.5,
      y: parentNode.position.y + (Math.random() * 2 - 1) * 1.0,
      z: parentNode.position.z + (Math.random() * 2 - 1) * 1.5
    }
  };

  // Ensure node is above ground
  newNode.position.y = Math.max(newNode.size * 0.5, newNode.position.y);

  const restLength = distance(parentNode.position, newNode.position);

  // Create muscle connecting to parent
  const newMuscle: MuscleGene = {
    id: generateId('muscle'),
    nodeA: parentNode.id,
    nodeB: newNode.id,
    restLength: restLength * (Math.random() * 0.4 + 0.8),
    stiffness: Math.random() * (constraints.maxStiffness - constraints.minStiffness) + constraints.minStiffness,
    damping: Math.random() * 0.4 + 0.1,
    frequency: Math.random() * (constraints.maxFrequency - constraints.minFrequency) + constraints.minFrequency,
    amplitude: Math.random() * constraints.maxAmplitude,
    phase: Math.random() * Math.PI * 2,
    // v1: Direction sensing
    directionBias: randomUnitVector(),
    biasStrength: Math.random() * 0.8,
    // v2: Velocity sensing (proprioception)
    velocityBias: randomUnitVector(),
    velocityStrength: Math.random() * 0.5,
    // v2: Distance awareness
    distanceBias: Math.random() * 2 - 1,
    distanceStrength: Math.random() * 0.5
  };

  return { node: newNode, muscle: newMuscle };
}

// Generate a random unit vector for direction bias
function randomUnitVector(): Vector3 {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.sin(phi) * Math.sin(theta),
    z: Math.cos(phi)
  };
}

/**
 * Remove a node and its connected muscles
 */
export function removeNode(
  genome: CreatureGenome,
  constraints: GenomeConstraints
): { nodeId: string; muscleIds: string[] } | null {
  if (genome.nodes.length <= constraints.minNodes) {
    return null;
  }

  // Pick a random node to remove (not the one with most connections to maintain structure)
  const connectionCounts = new Map<string, number>();
  for (const node of genome.nodes) {
    connectionCounts.set(node.id, 0);
  }

  for (const muscle of genome.muscles) {
    connectionCounts.set(muscle.nodeA, (connectionCounts.get(muscle.nodeA) || 0) + 1);
    connectionCounts.set(muscle.nodeB, (connectionCounts.get(muscle.nodeB) || 0) + 1);
  }

  // Sort by connection count (ascending) and pick from the less connected ones
  const sortedNodes = [...genome.nodes].sort(
    (a, b) => (connectionCounts.get(a.id) || 0) - (connectionCounts.get(b.id) || 0)
  );

  // Pick from the bottom half
  const candidateCount = Math.max(1, Math.floor(sortedNodes.length / 2));
  const nodeToRemove = sortedNodes[Math.floor(Math.random() * candidateCount)];

  // Find all muscles connected to this node
  const muscleIds = genome.muscles
    .filter(m => m.nodeA === nodeToRemove.id || m.nodeB === nodeToRemove.id)
    .map(m => m.id);

  return { nodeId: nodeToRemove.id, muscleIds };
}

/**
 * Add a new muscle between existing nodes
 */
export function addMuscle(
  genome: CreatureGenome,
  constraints: GenomeConstraints
): MuscleGene | null {
  if (genome.muscles.length >= constraints.maxMuscles) {
    return null;
  }

  // Find pairs of nodes that aren't connected
  const existingConnections = new Set(
    genome.muscles.map(m => [m.nodeA, m.nodeB].sort().join('-'))
  );

  const possiblePairs: [NodeGene, NodeGene][] = [];

  for (let i = 0; i < genome.nodes.length; i++) {
    for (let j = i + 1; j < genome.nodes.length; j++) {
      const key = [genome.nodes[i].id, genome.nodes[j].id].sort().join('-');
      if (!existingConnections.has(key)) {
        possiblePairs.push([genome.nodes[i], genome.nodes[j]]);
      }
    }
  }

  if (possiblePairs.length === 0) {
    return null;
  }

  const [nodeA, nodeB] = possiblePairs[Math.floor(Math.random() * possiblePairs.length)];
  const restLength = distance(nodeA.position, nodeB.position);

  return {
    id: generateId('muscle'),
    nodeA: nodeA.id,
    nodeB: nodeB.id,
    restLength: restLength * (Math.random() * 0.4 + 0.8),
    stiffness: Math.random() * (constraints.maxStiffness - constraints.minStiffness) + constraints.minStiffness,
    damping: Math.random() * 0.4 + 0.1,
    frequency: Math.random() * (constraints.maxFrequency - constraints.minFrequency) + constraints.minFrequency,
    amplitude: Math.random() * constraints.maxAmplitude,
    phase: Math.random() * Math.PI * 2,
    // v1: Direction sensing
    directionBias: randomUnitVector(),
    biasStrength: Math.random() * 0.8,
    // v2: Velocity sensing (proprioception)
    velocityBias: randomUnitVector(),
    velocityStrength: Math.random() * 0.5,
    // v2: Distance awareness
    distanceBias: Math.random() * 2 - 1,
    distanceStrength: Math.random() * 0.5
  };
}

/**
 * Mutate an entire genome
 */
export function mutateGenome(
  genome: CreatureGenome,
  config: MutationConfig = DEFAULT_MUTATION_CONFIG,
  constraints: GenomeConstraints = DEFAULT_GENOME_CONSTRAINTS
): CreatureGenome {
  // Mutation modifies an existing creature - does NOT increment generation
  // Generation is set by crossover/clone, mutation just tweaks the genes
  const newGenome: CreatureGenome = {
    ...genome,
    id: generateId('creature'),
    parentIds: genome.parentIds,  // Keep same parents - mutation doesn't change lineage
    generation: genome.generation,  // Keep same generation - mutation doesn't create new generation
    nodes: genome.nodes.map(n => mutateNode({ ...n, id: generateId('node') }, config, constraints)),
    muscles: [],
    color: { ...genome.color }
  };

  // Update node references in muscles
  const oldToNewNodeId = new Map<string, string>();
  for (let i = 0; i < genome.nodes.length; i++) {
    oldToNewNodeId.set(genome.nodes[i].id, newGenome.nodes[i].id);
  }

  // Mutate muscles
  newGenome.muscles = genome.muscles.map(m => {
    const mutated = mutateMuscle({ ...m, id: generateId('muscle') }, config, constraints);
    mutated.nodeA = oldToNewNodeId.get(m.nodeA) || m.nodeA;
    mutated.nodeB = oldToNewNodeId.get(m.nodeB) || m.nodeB;
    return mutated;
  });

  // Mutate global parameters
  if (Math.random() < config.rate) {
    newGenome.globalFrequencyMultiplier = mutateValue(
      genome.globalFrequencyMultiplier,
      0.3,
      2.0,
      config.magnitude
    );
  }

  // Mutate color slightly
  if (Math.random() < config.rate * 0.5) {
    newGenome.color.h = (genome.color.h + (Math.random() * 0.1 - 0.05) + 1) % 1;
  }

  // Structural mutations
  if (Math.random() < config.structuralRate) {
    const addResult = addNode(newGenome, constraints);
    if (addResult) {
      newGenome.nodes.push(addResult.node);
      newGenome.muscles.push(addResult.muscle);
    }
  }

  if (Math.random() < config.structuralRate) {
    const removeResult = removeNode(newGenome, constraints);
    if (removeResult) {
      newGenome.nodes = newGenome.nodes.filter(n => n.id !== removeResult.nodeId);
      newGenome.muscles = newGenome.muscles.filter(m => !removeResult.muscleIds.includes(m.id));
    }
  }

  if (Math.random() < config.structuralRate) {
    const newMuscle = addMuscle(newGenome, constraints);
    if (newMuscle) {
      newGenome.muscles.push(newMuscle);
    }
  }

  // Mutate neural genome if present
  if (genome.neuralGenome) {
    newGenome.neuralGenome = mutateNeuralGenome(
      genome.neuralGenome,
      config.rate,
      config.magnitude
    );
  }

  return newGenome;
}

// =============================================================================
// NEURAL NETWORK WEIGHT MUTATION
// =============================================================================

/**
 * Generate a random number from standard normal distribution.
 * Uses Box-Muller transform.
 */
function randomGaussian(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Mutate neural network weights.
 *
 * Each weight has a probability of being perturbed by Gaussian noise.
 * This is the standard mutation operator for neuroevolution.
 *
 * @param weights - Flat array of network weights
 * @param mutationRate - Probability each weight mutates (0-1)
 * @param mutationMagnitude - Standard deviation of Gaussian perturbation
 * @returns New mutated weight array
 */
export function mutateNeuralWeights(
  weights: number[],
  mutationRate: number,
  mutationMagnitude: number
): number[] {
  return weights.map(w => {
    if (Math.random() < mutationRate) {
      // Gaussian perturbation
      return w + randomGaussian() * mutationMagnitude;
    }
    return w;
  });
}

/**
 * Mutate a complete neural genome.
 *
 * @param neuralGenome - Neural genome to mutate
 * @param mutationRate - Probability each weight mutates
 * @param mutationMagnitude - Standard deviation of perturbation
 * @returns New mutated neural genome
 */
export function mutateNeuralGenome(
  neuralGenome: NeuralGenomeData,
  mutationRate: number,
  mutationMagnitude: number
): NeuralGenomeData {
  return {
    ...cloneNeuralGenome(neuralGenome),
    weights: mutateNeuralWeights(
      neuralGenome.weights,
      mutationRate,
      mutationMagnitude
    )
  };
}
