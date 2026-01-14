import type {
  CreatureGenome,
  NodeGene,
  MuscleGene,
  GenomeConstraints
} from '../types';
import { DEFAULT_GENOME_CONSTRAINTS } from '../types';
import { generateId } from '../utils/id';
import { distance, lerp, lerpVector3, lerpHSL, normalize } from '../utils/math';

/**
 * Simple single-point crossover on genome properties
 * Takes structure from parent1 and some values from parent2
 */
export function singlePointCrossover(
  parent1: CreatureGenome,
  parent2: CreatureGenome,
  constraints: GenomeConstraints = DEFAULT_GENOME_CONSTRAINTS
): CreatureGenome {
  // Limit nodes based on muscle constraint (need N-1 muscles for N nodes)
  const effectiveMaxNodes = Math.min(constraints.maxNodes, constraints.maxMuscles + 1);
  const nodeCount = Math.min(parent1.nodes.length, effectiveMaxNodes);

  // Use parent1's structure as the base (limited by constraints)
  const childNodes: NodeGene[] = [];
  const childMuscles: MuscleGene[] = [];

  for (let i = 0; i < nodeCount; i++) {
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

  // Create muscles based on parent1's topology (limited by constraints)
  const oldToNewNodeId = new Map<string, string>();
  for (let i = 0; i < nodeCount; i++) {
    oldToNewNodeId.set(parent1.nodes[i].id, childNodes[i].id);
  }

  // Only copy muscles that connect nodes we kept, up to maxMuscles
  for (let i = 0; i < parent1.muscles.length && childMuscles.length < constraints.maxMuscles; i++) {
    const muscle1 = parent1.muscles[i];
    const muscle2 = parent2.muscles[i % parent2.muscles.length];
    const t = Math.random();

    const nodeA = oldToNewNodeId.get(muscle1.nodeA);
    const nodeB = oldToNewNodeId.get(muscle1.nodeB);

    // Skip if either node wasn't included in the child
    if (!nodeA || !nodeB) continue;

    // Calculate new rest length based on actual node positions
    const nodeAData = childNodes.find(n => n.id === nodeA);
    const nodeBData = childNodes.find(n => n.id === nodeB);
    const actualDistance = nodeAData && nodeBData
      ? distance(nodeAData.position, nodeBData.position)
      : lerp(muscle1.restLength, muscle2.restLength, t);

    // v1: Interpolate direction bias (lerp then normalize to keep it a unit vector)
    const lerpedDirectionBias = muscle1.directionBias && muscle2.directionBias
      ? normalize(lerpVector3(muscle1.directionBias, muscle2.directionBias, t))
      : muscle1.directionBias || { x: 0, y: 1, z: 0 };

    // v2: Interpolate velocity bias
    const lerpedVelocityBias = muscle1.velocityBias && muscle2.velocityBias
      ? normalize(lerpVector3(muscle1.velocityBias, muscle2.velocityBias, t))
      : muscle1.velocityBias || { x: 0, y: 1, z: 0 };

    childMuscles.push({
      id: generateId('muscle'),
      nodeA,
      nodeB,
      restLength: actualDistance * lerp(0.9, 1.1, Math.random()),
      stiffness: lerp(muscle1.stiffness, muscle2.stiffness, t),
      damping: lerp(muscle1.damping, muscle2.damping, t),
      frequency: lerp(muscle1.frequency, muscle2.frequency, t),
      amplitude: lerp(muscle1.amplitude, muscle2.amplitude, t),
      phase: lerp(muscle1.phase, muscle2.phase, t),
      // v1: Direction sensing
      directionBias: lerpedDirectionBias,
      biasStrength: lerp(muscle1.biasStrength ?? 0, muscle2.biasStrength ?? 0, t),
      // v2: Velocity sensing
      velocityBias: lerpedVelocityBias,
      velocityStrength: lerp(muscle1.velocityStrength ?? 0, muscle2.velocityStrength ?? 0, t),
      // v2: Distance awareness
      distanceBias: lerp(muscle1.distanceBias ?? 0, muscle2.distanceBias ?? 0, t),
      distanceStrength: lerp(muscle1.distanceStrength ?? 0, muscle2.distanceStrength ?? 0, t)
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
  constraints: GenomeConstraints = DEFAULT_GENOME_CONSTRAINTS
): CreatureGenome {
  // Randomly choose which parent provides the structure
  const structureParent = Math.random() < 0.5 ? parent1 : parent2;
  const otherParent = structureParent === parent1 ? parent2 : parent1;

  // Limit nodes based on muscle constraint (need N-1 muscles for N nodes)
  const effectiveMaxNodes = Math.min(constraints.maxNodes, constraints.maxMuscles + 1);
  const nodeCount = Math.min(structureParent.nodes.length, effectiveMaxNodes);

  const childNodes: NodeGene[] = [];
  const childMuscles: MuscleGene[] = [];

  // Create nodes (limited by constraints)
  for (let i = 0; i < nodeCount; i++) {
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
  for (let i = 0; i < nodeCount; i++) {
    oldToNewNodeId.set(structureParent.nodes[i].id, childNodes[i].id);
  }

  // Create muscles (limited by constraints)
  for (let i = 0; i < structureParent.muscles.length && childMuscles.length < constraints.maxMuscles; i++) {
    const muscle = structureParent.muscles[i];
    const otherMuscle = otherParent.muscles[i % otherParent.muscles.length];

    const nodeA = oldToNewNodeId.get(muscle.nodeA);
    const nodeB = oldToNewNodeId.get(muscle.nodeB);

    // Skip if either node wasn't included in the child
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
      phase: Math.random() < 0.5 ? muscle.phase : otherMuscle.phase,
      // v1: Direction sensing
      directionBias: Math.random() < 0.5
        ? (muscle.directionBias || { x: 0, y: 1, z: 0 })
        : (otherMuscle.directionBias || { x: 0, y: 1, z: 0 }),
      biasStrength: Math.random() < 0.5
        ? (muscle.biasStrength ?? 0)
        : (otherMuscle.biasStrength ?? 0),
      // v2: Velocity sensing
      velocityBias: Math.random() < 0.5
        ? (muscle.velocityBias || { x: 0, y: 1, z: 0 })
        : (otherMuscle.velocityBias || { x: 0, y: 1, z: 0 }),
      velocityStrength: Math.random() < 0.5
        ? (muscle.velocityStrength ?? 0)
        : (otherMuscle.velocityStrength ?? 0),
      // v2: Distance awareness
      distanceBias: Math.random() < 0.5
        ? (muscle.distanceBias ?? 0)
        : (otherMuscle.distanceBias ?? 0),
      distanceStrength: Math.random() < 0.5
        ? (muscle.distanceStrength ?? 0)
        : (otherMuscle.distanceStrength ?? 0)
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
export function cloneGenome(
  genome: CreatureGenome,
  constraints: GenomeConstraints = DEFAULT_GENOME_CONSTRAINTS
): CreatureGenome {
  // Limit nodes based on muscle constraint (need N-1 muscles for N nodes)
  const effectiveMaxNodes = Math.min(constraints.maxNodes, constraints.maxMuscles + 1);
  const nodeCount = Math.min(genome.nodes.length, effectiveMaxNodes);

  const newNodes = genome.nodes.slice(0, nodeCount).map(n => ({
    ...n,
    id: generateId('node'),
    position: { ...n.position }
  }));

  const oldToNewNodeId = new Map<string, string>();
  for (let i = 0; i < nodeCount; i++) {
    oldToNewNodeId.set(genome.nodes[i].id, newNodes[i].id);
  }

  // Only clone muscles that connect to included nodes, up to maxMuscles
  const newMuscles: MuscleGene[] = [];
  for (const m of genome.muscles) {
    if (newMuscles.length >= constraints.maxMuscles) break;

    const nodeA = oldToNewNodeId.get(m.nodeA);
    const nodeB = oldToNewNodeId.get(m.nodeB);

    // Skip if either node wasn't included
    if (!nodeA || !nodeB) continue;

    newMuscles.push({
      ...m,
      id: generateId('muscle'),
      nodeA,
      nodeB,
      // v1: Deep copy direction bias
      directionBias: m.directionBias ? { ...m.directionBias } : { x: 0, y: 1, z: 0 },
      // v2: Deep copy velocity bias
      velocityBias: m.velocityBias ? { ...m.velocityBias } : { x: 0, y: 1, z: 0 }
    });
  }

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
