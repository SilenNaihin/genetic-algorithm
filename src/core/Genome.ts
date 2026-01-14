import type {
  CreatureGenome,
  NodeGene,
  MuscleGene,
  GenomeConstraints,
  Vector3,
  HSL
} from '../types';
import { DEFAULT_GENOME_CONSTRAINTS } from '../types';
import { generateId } from '../utils/id';
import { distance, randomRange, randomInt } from '../utils/math';

function randomVector3(radius: number): Vector3 {
  return {
    x: randomRange(-radius, radius),
    y: randomRange(0.5, radius * 1.5),  // Keep above ground
    z: randomRange(-radius, radius)
  };
}

function randomHSL(): HSL {
  return {
    h: Math.random(),
    s: randomRange(0.5, 0.9),
    l: randomRange(0.4, 0.6)
  };
}

// Generate a random unit vector for direction bias
function randomUnitVector(): Vector3 {
  // Use spherical coordinates for uniform distribution on sphere
  const theta = Math.random() * Math.PI * 2;  // Azimuthal angle
  const phi = Math.acos(2 * Math.random() - 1);  // Polar angle
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.sin(phi) * Math.sin(theta),
    z: Math.cos(phi)
  };
}

export function generateRandomGenome(
  constraints: GenomeConstraints = DEFAULT_GENOME_CONSTRAINTS
): CreatureGenome {
  const id = generateId('creature');

  // To connect N nodes, we need at least N-1 muscles (spanning tree)
  // So maxNodes is limited by maxMuscles + 1
  const effectiveMaxNodes = Math.min(constraints.maxNodes, constraints.maxMuscles + 1);
  const effectiveMinNodes = Math.min(constraints.minNodes, effectiveMaxNodes);

  // Generate nodes
  const nodeCount = randomInt(effectiveMinNodes, effectiveMaxNodes);
  const nodes: NodeGene[] = [];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: generateId('node'),
      size: randomRange(constraints.minSize, constraints.maxSize),
      friction: randomRange(0.3, 0.9),
      position: randomVector3(constraints.spawnRadius)
    });
  }

  // Generate muscles (connect nodes)
  const muscles: MuscleGene[] = [];
  const maxMuscles = Math.min(
    constraints.maxMuscles,
    (nodeCount * (nodeCount - 1)) / 2  // Max possible connections
  );

  // First, ensure connectivity by creating a spanning tree
  const connected = new Set<string>([nodes[0].id]);
  const unconnected = new Set(nodes.slice(1).map(n => n.id));

  while (unconnected.size > 0) {
    // Pick a random connected node and connect it to a random unconnected node
    const connectedArray = Array.from(connected);
    const unconnectedArray = Array.from(unconnected);

    const fromId = connectedArray[randomInt(0, connectedArray.length - 1)];
    const toId = unconnectedArray[randomInt(0, unconnectedArray.length - 1)];

    const fromNode = nodes.find(n => n.id === fromId)!;
    const toNode = nodes.find(n => n.id === toId)!;

    const restLength = distance(fromNode.position, toNode.position);

    muscles.push({
      id: generateId('muscle'),
      nodeA: fromId,
      nodeB: toId,
      restLength: restLength * randomRange(0.8, 1.2),
      stiffness: randomRange(constraints.minStiffness, constraints.maxStiffness),
      damping: randomRange(0.1, 0.5),
      frequency: randomRange(constraints.minFrequency, constraints.maxFrequency),
      amplitude: randomRange(0.1, constraints.maxAmplitude),
      phase: randomRange(0, Math.PI * 2),
      directionBias: randomUnitVector(),
      biasStrength: randomRange(0, 0.8)  // Start with moderate bias potential
    });

    connected.add(toId);
    unconnected.delete(toId);
  }

  // Add some extra random connections
  const extraMuscles = randomInt(0, maxMuscles - muscles.length);
  const existingConnections = new Set(
    muscles.map(m => [m.nodeA, m.nodeB].sort().join('-'))
  );

  for (let i = 0; i < extraMuscles; i++) {
    const nodeA = nodes[randomInt(0, nodes.length - 1)];
    const nodeB = nodes[randomInt(0, nodes.length - 1)];

    if (nodeA.id === nodeB.id) continue;

    const connectionKey = [nodeA.id, nodeB.id].sort().join('-');
    if (existingConnections.has(connectionKey)) continue;

    existingConnections.add(connectionKey);

    const restLength = distance(nodeA.position, nodeB.position);

    muscles.push({
      id: generateId('muscle'),
      nodeA: nodeA.id,
      nodeB: nodeB.id,
      restLength: restLength * randomRange(0.8, 1.2),
      stiffness: randomRange(constraints.minStiffness, constraints.maxStiffness),
      damping: randomRange(0.1, 0.5),
      frequency: randomRange(constraints.minFrequency, constraints.maxFrequency),
      amplitude: randomRange(0.1, constraints.maxAmplitude),
      phase: randomRange(0, Math.PI * 2),
      directionBias: randomUnitVector(),
      biasStrength: randomRange(0, 0.8)
    });
  }

  return {
    id,
    generation: 0,
    survivalStreak: 0,
    parentIds: [],
    nodes,
    muscles,
    globalFrequencyMultiplier: randomRange(0.5, 1.5),
    controllerType: 'oscillator',
    color: randomHSL()
  };
}

export function cloneGenome(genome: CreatureGenome): CreatureGenome {
  return {
    ...genome,
    id: generateId('creature'),
    parentIds: [genome.id],
    nodes: genome.nodes.map(n => ({ ...n, id: generateId('node') })),
    muscles: genome.muscles.map(m => ({ ...m, id: generateId('muscle') })),
    color: { ...genome.color }
  };
}

export function getGenomeCenterOfMass(genome: CreatureGenome): Vector3 {
  if (genome.nodes.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  let totalMass = 0;
  let cx = 0, cy = 0, cz = 0;

  for (const node of genome.nodes) {
    const mass = node.size * node.size * node.size;  // Volume as mass proxy
    cx += node.position.x * mass;
    cy += node.position.y * mass;
    cz += node.position.z * mass;
    totalMass += mass;
  }

  return {
    x: cx / totalMass,
    y: cy / totalMass,
    z: cz / totalMass
  };
}
