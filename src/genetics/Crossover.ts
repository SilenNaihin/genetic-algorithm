import type {
  CreatureGenome,
  NodeGene,
  MuscleGene,
  GenomeConstraints,
  Vector3,
  HSL
} from '../types';
import { DEFAULT_GENOME_CONSTRAINTS } from '../types';

let idCounter = 0;
function generateId(prefix: string): string {
  return `${prefix}_cross_${Date.now()}_${idCounter++}`;
}

function distance(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVector3(a: Vector3, b: Vector3, t: number): Vector3 {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t)
  };
}

function lerpHSL(a: HSL, b: HSL, t: number): HSL {
  // Handle hue wrapping
  let hDiff = b.h - a.h;
  if (hDiff > 0.5) hDiff -= 1;
  if (hDiff < -0.5) hDiff += 1;

  return {
    h: (a.h + hDiff * t + 1) % 1,
    s: lerp(a.s, b.s, t),
    l: lerp(a.l, b.l, t)
  };
}

/**
 * Simple single-point crossover on genome properties
 * Takes structure from parent1 and some values from parent2
 */
export function singlePointCrossover(
  parent1: CreatureGenome,
  parent2: CreatureGenome,
  _constraints: GenomeConstraints = DEFAULT_GENOME_CONSTRAINTS
): CreatureGenome {
  // Use parent1's structure as the base
  const childNodes: NodeGene[] = [];
  const childMuscles: MuscleGene[] = [];

  for (let i = 0; i < parent1.nodes.length; i++) {
    const node1 = parent1.nodes[i];
    const node2 = parent2.nodes[i % parent2.nodes.length];
    const t = Math.random();

    childNodes.push({
      id: generateId('node'),
      size: lerp(node1.size, node2.size, t),
      friction: lerp(node1.friction, node2.friction, t),
      position: lerpVector3(node1.position, node2.position, t * 0.5)  // Less position mixing
    });
  }

  // Create muscles based on parent1's topology
  const oldToNewNodeId = new Map<string, string>();
  for (let i = 0; i < parent1.nodes.length; i++) {
    oldToNewNodeId.set(parent1.nodes[i].id, childNodes[i].id);
  }

  for (let i = 0; i < parent1.muscles.length; i++) {
    const muscle1 = parent1.muscles[i];
    const muscle2 = parent2.muscles[i % parent2.muscles.length];
    const t = Math.random();

    const nodeA = oldToNewNodeId.get(muscle1.nodeA);
    const nodeB = oldToNewNodeId.get(muscle1.nodeB);

    if (!nodeA || !nodeB) continue;

    // Calculate new rest length based on actual node positions
    const nodeAData = childNodes.find(n => n.id === nodeA);
    const nodeBData = childNodes.find(n => n.id === nodeB);
    const actualDistance = nodeAData && nodeBData
      ? distance(nodeAData.position, nodeBData.position)
      : lerp(muscle1.restLength, muscle2.restLength, t);

    childMuscles.push({
      id: generateId('muscle'),
      nodeA,
      nodeB,
      restLength: actualDistance * lerp(0.9, 1.1, Math.random()),
      stiffness: lerp(muscle1.stiffness, muscle2.stiffness, t),
      damping: lerp(muscle1.damping, muscle2.damping, t),
      frequency: lerp(muscle1.frequency, muscle2.frequency, t),
      amplitude: lerp(muscle1.amplitude, muscle2.amplitude, t),
      phase: lerp(muscle1.phase, muscle2.phase, t)
    });
  }

  return {
    id: generateId('creature'),
    generation: Math.max(parent1.generation, parent2.generation) + 1,
    survivalStreak: 0,  // New offspring start with 0 survival streak
    parentIds: [parent1.id, parent2.id],
    nodes: childNodes,
    muscles: childMuscles,
    globalFrequencyMultiplier: lerp(
      parent1.globalFrequencyMultiplier,
      parent2.globalFrequencyMultiplier,
      Math.random()
    ),
    controllerType: 'oscillator',
    color: lerpHSL(parent1.color, parent2.color, Math.random())
  };
}

/**
 * Uniform crossover - randomly pick each gene from either parent
 */
export function uniformCrossover(
  parent1: CreatureGenome,
  parent2: CreatureGenome,
  _constraints: GenomeConstraints = DEFAULT_GENOME_CONSTRAINTS
): CreatureGenome {
  // Randomly choose which parent provides the structure
  const structureParent = Math.random() < 0.5 ? parent1 : parent2;
  const otherParent = structureParent === parent1 ? parent2 : parent1;

  const childNodes: NodeGene[] = [];
  const childMuscles: MuscleGene[] = [];

  // Create nodes
  for (let i = 0; i < structureParent.nodes.length; i++) {
    const useOther = Math.random() < 0.5 && i < otherParent.nodes.length;
    const sourceNode = useOther ? otherParent.nodes[i] : structureParent.nodes[i];

    childNodes.push({
      id: generateId('node'),
      size: Math.random() < 0.5 ? structureParent.nodes[i].size : (otherParent.nodes[i % otherParent.nodes.length]?.size || structureParent.nodes[i].size),
      friction: Math.random() < 0.5 ? structureParent.nodes[i].friction : (otherParent.nodes[i % otherParent.nodes.length]?.friction || structureParent.nodes[i].friction),
      position: { ...sourceNode.position }
    });
  }

  // Map old node IDs to new ones
  const oldToNewNodeId = new Map<string, string>();
  for (let i = 0; i < structureParent.nodes.length; i++) {
    oldToNewNodeId.set(structureParent.nodes[i].id, childNodes[i].id);
  }

  // Create muscles
  for (let i = 0; i < structureParent.muscles.length; i++) {
    const muscle = structureParent.muscles[i];
    const otherMuscle = otherParent.muscles[i % otherParent.muscles.length];

    const nodeA = oldToNewNodeId.get(muscle.nodeA);
    const nodeB = oldToNewNodeId.get(muscle.nodeB);

    if (!nodeA || !nodeB) continue;

    childMuscles.push({
      id: generateId('muscle'),
      nodeA,
      nodeB,
      restLength: Math.random() < 0.5 ? muscle.restLength : otherMuscle.restLength,
      stiffness: Math.random() < 0.5 ? muscle.stiffness : otherMuscle.stiffness,
      damping: Math.random() < 0.5 ? muscle.damping : otherMuscle.damping,
      frequency: Math.random() < 0.5 ? muscle.frequency : otherMuscle.frequency,
      amplitude: Math.random() < 0.5 ? muscle.amplitude : otherMuscle.amplitude,
      phase: Math.random() < 0.5 ? muscle.phase : otherMuscle.phase
    });
  }

  return {
    id: generateId('creature'),
    generation: Math.max(parent1.generation, parent2.generation) + 1,
    survivalStreak: 0,  // New offspring start with 0 survival streak
    parentIds: [parent1.id, parent2.id],
    nodes: childNodes,
    muscles: childMuscles,
    globalFrequencyMultiplier: Math.random() < 0.5
      ? parent1.globalFrequencyMultiplier
      : parent2.globalFrequencyMultiplier,
    controllerType: 'oscillator',
    color: lerpHSL(parent1.color, parent2.color, 0.5)
  };
}

/**
 * Clone a genome (no crossover)
 */
export function cloneGenome(genome: CreatureGenome): CreatureGenome {
  const newNodes = genome.nodes.map(n => ({
    ...n,
    id: generateId('node'),
    position: { ...n.position }
  }));

  const oldToNewNodeId = new Map<string, string>();
  for (let i = 0; i < genome.nodes.length; i++) {
    oldToNewNodeId.set(genome.nodes[i].id, newNodes[i].id);
  }

  const newMuscles = genome.muscles.map(m => ({
    ...m,
    id: generateId('muscle'),
    nodeA: oldToNewNodeId.get(m.nodeA) || m.nodeA,
    nodeB: oldToNewNodeId.get(m.nodeB) || m.nodeB
  }));

  return {
    ...genome,
    id: generateId('creature'),
    parentIds: [genome.id],
    generation: genome.generation + 1,
    survivalStreak: 0,  // Clone is a new creature, starts fresh
    nodes: newNodes,
    muscles: newMuscles,
    color: { ...genome.color }
  };
}
