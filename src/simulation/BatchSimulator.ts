import * as CANNON from 'cannon-es';
import type { CreatureGenome, Vector3, SimulationConfig } from '../types';
import { DEFAULT_CONFIG } from '../types';
import { dot, normalize, subtract, length } from '../utils/math';
import {
  NeuralNetwork,
  createNetworkFromGenome,
  gatherSensorInputsPure,
  gatherSensorInputsHybrid
} from '../neural';

export interface SimulationFrame {
  time: number;
  nodePositions: Map<string, Vector3>;
  centerOfMass: Vector3;
  activePelletIndex: number;  // Which pellet is currently active
}

export type DisqualificationReason =
  | null  // Not disqualified
  | 'frequency_exceeded'  // Muscle frequency too high
  | 'physics_explosion'   // Creature flew off into space
  | 'nan_position';       // Position became NaN

export interface CreatureSimulationResult {
  genome: CreatureGenome;
  frames: SimulationFrame[];
  finalFitness: number;
  pelletsCollected: number;
  distanceTraveled: number;
  netDisplacement: number;  // Straight-line distance from start to end position
  closestPelletDistance: number;
  pellets: PelletData[];  // Store pellet data for replay
  fitnessOverTime: number[];  // Fitness at each frame
  disqualified: DisqualificationReason;  // Why creature was disqualified (null if not)
}

export interface PelletData {
  id: string;
  position: Vector3;
  collectedAtFrame: number | null;
  spawnedAtFrame: number;  // When this pellet appeared
  initialDistance: number; // Distance from creature when pellet spawned (for progress-based fitness)
}

// Track the angle of the last pellet relative to creature (for opposite-half spawning)
let lastPelletAngle: number | null = null;

// Generate a pellet position in the opposite 180° half from the last pellet
// Distance is measured from creature's EDGE (XZ radius), not center
function generatePelletPosition(
  arenaSize: number,
  pelletIndex: number,
  creaturePosition: Vector3,
  creatureXZRadius: number  // XZ-only radius (ground footprint)
): Vector3 {
  // Height increases with pellet index
  const baseHeight = 0.3;
  const heightIncrement = 0.4;
  const height = pelletIndex === 0 ? baseHeight : baseHeight + pelletIndex * heightIncrement;

  // Progressive distance FROM CREATURE'S EDGE (not center):
  // +4 buffer added to account for full muscle extension (chain of muscles can extend far)
  // Pellet 1: 7-8 units from edge, Pellet 2-3: 8-9 units, Pellet 4+: 9-10 units
  let minDistFromEdge: number, maxDistFromEdge: number;
  if (pelletIndex === 0) {
    minDistFromEdge = 7.0; maxDistFromEdge = 8.0;
  } else if (pelletIndex <= 2) {
    minDistFromEdge = 8.0; maxDistFromEdge = 9.0;
  } else {
    minDistFromEdge = 9.0; maxDistFromEdge = 10.0;
  }

  // Total distance from center = creature XZ radius + distance from edge
  const distFromEdge = minDistFromEdge + Math.random() * (maxDistFromEdge - minDistFromEdge);
  const totalDistFromCenter = creatureXZRadius + distFromEdge;

  // Opposite-half spawning:
  // If we have a last pellet angle, spawn in the opposite 180° arc
  let angle: number;
  if (lastPelletAngle === null) {
    // First pellet: random angle
    angle = Math.random() * Math.PI * 2;
  } else {
    // Spawn in opposite 180° arc: [lastAngle + 90°, lastAngle + 270°]
    // This is centered around lastAngle + 180° (opposite direction)
    const oppositeCenter = lastPelletAngle + Math.PI;
    // Random angle within ±90° of the opposite direction
    const offsetFromOpposite = (Math.random() - 0.5) * Math.PI;  // -90° to +90°
    angle = oppositeCenter + offsetFromOpposite;
  }

  // Calculate position relative to creature
  let x = creaturePosition.x + Math.cos(angle) * totalDistFromCenter;
  let z = creaturePosition.z + Math.sin(angle) * totalDistFromCenter;

  // Clamp to arena bounds
  const arenaBound = arenaSize * 0.45;
  x = Math.max(-arenaBound, Math.min(arenaBound, x));
  z = Math.max(-arenaBound, Math.min(arenaBound, z));

  // Store this pellet's angle for next spawn
  lastPelletAngle = angle;

  return { x, y: height, z };
}

// Calculate creature's XZ radius from genome (rest state, with buffer for extension)
// This uses the original genome positions, not current physics positions
function calculateCreatureXZRadiusFromGenome(genome: CreatureGenome): number {
  // Calculate center of genome nodes (XZ only)
  let centerX = 0, centerZ = 0;
  for (const node of genome.nodes) {
    centerX += node.position.x;
    centerZ += node.position.z;
  }
  centerX /= genome.nodes.length;
  centerZ /= genome.nodes.length;

  // Find max XZ distance from center to any node edge
  let maxDist = 0;
  for (const node of genome.nodes) {
    const dx = node.position.x - centerX;
    const dz = node.position.z - centerZ;
    const dist = Math.sqrt(dx * dx + dz * dz) + node.size * 0.5;  // Add node radius
    if (dist > maxDist) {
      maxDist = dist;
    }
  }

  // Add buffer (1.3x) to account for creature potentially being contracted at spawn
  // and muscle extension making it larger than rest state
  const bufferedRadius = maxDist * 1.3;

  // Minimum radius of 1.0 unit - even if creature evolved to be tiny/clustered,
  // we still treat it as having at least this radius for pellet spawning fairness
  const MIN_CREATURE_RADIUS = 1.0;
  return Math.max(MIN_CREATURE_RADIUS, bufferedRadius);
}

// Calculate XZ ground distance from creature's edge to a point
function edgeToPointGroundDistance(
  creatureCenter: Vector3,
  creatureXZRadius: number,
  point: Vector3
): number {
  const dx = point.x - creatureCenter.x;
  const dz = point.z - creatureCenter.z;
  const groundDistFromCenter = Math.sqrt(dx * dx + dz * dz);
  // Distance from edge = distance from center - radius (can be negative if point is inside)
  return Math.max(0, groundDistFromCenter - creatureXZRadius);
}

/**
 * Runs physics simulation for a single creature without rendering
 * Returns the full simulation history for later playback
 */
export function simulateCreature(
  genome: CreatureGenome,
  config: SimulationConfig = DEFAULT_CONFIG,
  frameRate: number = 15  // Reduced from 30 to lower memory usage
): CreatureSimulationResult {
  // Check if any muscle frequency exceeds the allowed maximum
  // Effective frequency = muscle.frequency * globalFrequencyMultiplier
  const maxAllowedFreq = config.maxAllowedFrequency || 3.0;
  let hasInvalidFrequency = false;

  for (const muscle of genome.muscles) {
    const effectiveFreq = muscle.frequency * genome.globalFrequencyMultiplier;
    if (effectiveFreq > maxAllowedFreq) {
      hasInvalidFrequency = true;
      break;
    }
  }

  // If frequency is invalid, return minimal result (creature "dies")
  if (hasInvalidFrequency) {
    return {
      genome,
      frames: [{
        time: 0,
        nodePositions: new Map(genome.nodes.map(n => [n.id, { ...n.position }])),
        centerOfMass: { x: 0, y: 0.5, z: 0 },
        activePelletIndex: 0
      }],
      finalFitness: 0,
      pelletsCollected: 0,
      distanceTraveled: 0,
      netDisplacement: 0,
      closestPelletDistance: Infinity,
      pellets: [],
      fitnessOverTime: [0],
      disqualified: 'frequency_exceeded'
    };
  }

  // Create isolated physics world
  const world = new CANNON.World();
  world.gravity.set(0, config.gravity, 0);
  world.broadphase = new CANNON.SAPBroadphase(world);
  (world.solver as CANNON.GSSolver).iterations = 10;

  // Ground
  const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
    material: new CANNON.Material({ friction: config.groundFriction, restitution: 0.3 })
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);

  // Create node bodies
  const nodeBodies = new Map<string, CANNON.Body>();
  for (const node of genome.nodes) {
    const radius = node.size * 0.5;
    const mass = (4 / 3) * Math.PI * Math.pow(radius, 3) * 10;

    const body = new CANNON.Body({
      mass,
      shape: new CANNON.Sphere(radius),
      position: new CANNON.Vec3(node.position.x, node.position.y + 1, node.position.z),
      linearDamping: 0.1,
      angularDamping: 0.5,
      material: new CANNON.Material({ friction: node.friction, restitution: 0.2 })
    });

    world.addBody(body);
    nodeBodies.set(node.id, body);
  }

  // Create springs for muscles
  interface OscillatingSpring {
    spring: CANNON.Spring;
    frequency: number;
    amplitude: number;
    phase: number;
    baseRestLength: number;
    // v1: Direction-modulated control
    directionBias: Vector3;  // Unit vector - activates more when pellet is in this direction
    biasStrength: number;    // 0 = pure oscillator, 1 = heavily modulated
    // v2: Velocity sensing (proprioception)
    velocityBias: Vector3;   // Unit vector - activates more when moving in this direction
    velocityStrength: number; // 0 = ignore velocity, 1 = heavily modulated
    // v2: Distance awareness
    distanceBias: number;    // -1 = activate when far, +1 = activate when near
    distanceStrength: number; // 0 = ignore distance, 1 = heavily modulated
  }

  const springs: OscillatingSpring[] = [];
  for (const muscle of genome.muscles) {
    const bodyA = nodeBodies.get(muscle.nodeA);
    const bodyB = nodeBodies.get(muscle.nodeB);
    if (!bodyA || !bodyB) continue;

    const spring = new CANNON.Spring(bodyA, bodyB, {
      restLength: muscle.restLength,
      stiffness: muscle.stiffness,
      damping: muscle.damping
    });

    springs.push({
      spring,
      frequency: muscle.frequency * genome.globalFrequencyMultiplier,
      amplitude: muscle.amplitude,
      phase: muscle.phase,
      baseRestLength: muscle.restLength,
      // v1
      directionBias: muscle.directionBias || { x: 0, y: 1, z: 0 },
      biasStrength: muscle.biasStrength ?? 0,
      // v2
      velocityBias: muscle.velocityBias || { x: 0, y: 1, z: 0 },
      velocityStrength: muscle.velocityStrength ?? 0,
      distanceBias: muscle.distanceBias ?? 0,
      distanceStrength: muscle.distanceStrength ?? 0
    });
  }

  // Create neural network if enabled
  let neuralNetwork: NeuralNetwork | null = null;
  const useNeural = config.useNeuralNet && genome.controllerType === 'neural' && genome.neuralGenome;
  const neuralMode = config.neuralMode || 'hybrid';
  const deadZone = config.neuralDeadZone ?? 0.1;

  if (useNeural && genome.neuralGenome) {
    neuralNetwork = createNetworkFromGenome(genome.neuralGenome);
  }

  // Reset pellet angle tracker for each new creature simulation
  lastPelletAngle = null;

  // Create pellets - one at a time, respawns when collected
  const pellets: PelletData[] = [];
  let currentPelletIndex = 0;

  // Calculate creature's XZ radius from genome (with buffer for extension)
  // This is consistent regardless of current physics state
  const creatureXZRadius = calculateCreatureXZRadiusFromGenome(genome);

  // Calculate initial center of mass
  let spawnCOMX = 0, spawnCOMY = 0, spawnCOMZ = 0, spawnMass = 0;
  for (const body of nodeBodies.values()) {
    spawnCOMX += body.position.x * body.mass;
    spawnCOMY += body.position.y * body.mass;
    spawnCOMZ += body.position.z * body.mass;
    spawnMass += body.mass;
  }
  const spawnCOM: Vector3 = spawnMass > 0
    ? { x: spawnCOMX / spawnMass, y: spawnCOMY / spawnMass, z: spawnCOMZ / spawnMass }
    : { x: 0, y: 0.5, z: 0 };

  // Create first pellet - spawn relative to creature's edge, in random direction
  const firstPelletPos = generatePelletPosition(config.arenaSize, 0, spawnCOM, creatureXZRadius);
  // Initial distance = XZ ground distance from creature's EDGE to pellet
  const firstPelletEdgeDist = edgeToPointGroundDistance(spawnCOM, creatureXZRadius, firstPelletPos);
  pellets.push({
    id: `pellet_0`,
    position: firstPelletPos,
    collectedAtFrame: null,
    spawnedAtFrame: 0,
    initialDistance: firstPelletEdgeDist  // Edge-based ground distance
  });

  // Simulation
  const frames: SimulationFrame[] = [];
  const fitnessOverTime: number[] = [];
  const timeStep = 1 / 60;
  const frameInterval = 1 / frameRate;
  const totalTime = config.simulationDuration;
  const totalSteps = Math.ceil(totalTime / timeStep);

  let simulationTime = 0;
  let lastFrameTime = 0;
  let distanceTraveled = 0;
  let lastCenterOfMass: Vector3 | null = null;
  let initialCenterOfMass: Vector3 | null = null;  // Track starting position
  let pelletsCollected = 0;
  let disqualified: DisqualificationReason = null;  // Track if creature gets disqualified mid-simulation
  let totalMuscleActivation = 0;  // Track total muscle activation for efficiency penalty

  // Thresholds for detecting physics explosion
  const POSITION_THRESHOLD = 50;  // If any node goes beyond 50 units from origin
  const HEIGHT_THRESHOLD = 30;    // If creature flies higher than 30 units

  // Helper to get active (uncollected) pellet
  const getActivePellet = (): PelletData | null => {
    return pellets.find(p => p.collectedAtFrame === null) || null;
  };

  // Track the closest the creature's edge has gotten to the current pellet (for penalty calculation)
  let closestEdgeDistanceToCurrentPellet = Infinity;

  // FITNESS MODEL (edge-based, XZ ground distance):
  // - Starts at 0
  // - 0-progressMax points for XZ progress toward current pellet
  // - +bonus points when pellet is actually collected (pelletPoints - progressMax)
  // - After first pellet: -regressionPenalty max if moving AWAY from next pellet
  // - Net displacement bonus: 0-netDisplacementMax points (rate-based)
  // - Distance traveled bonus: 0-distanceTraveledMax points (distancePerUnit pts per unit)
  // Get fitness values from config (with defaults for backwards compatibility)
  const pelletPoints = config.fitnessPelletPoints ?? 100;
  const progressMax = config.fitnessProgressMax ?? 80;
  const netDisplacementMax = config.fitnessNetDisplacementMax ?? 15;
  const distancePerUnit = config.fitnessDistancePerUnit ?? 3;
  const distanceTraveledMax = config.fitnessDistanceTraveledMax ?? 15;
  const regressionPenalty = config.fitnessRegressionPenalty ?? 20;
  const efficiencyPenalty = config.fitnessEfficiencyPenalty ?? 0.5;
  const TARGET_DISPLACEMENT_RATE = 1.0;  // Units/second for full bonus (net displacement)

  const calculateCurrentFitness = (
    centerOfMass: Vector3,
    pelletsCollectedCount: number,
    currentNetDisplacement: number,  // Straight-line distance from start (XZ only)
    currentDistanceTraveled: number, // Total distance traveled (XZ only)
    currentTime: number,
    currentMuscleActivation: number  // Total muscle activation (for efficiency penalty)
  ): number => {
    // If disqualified, always return 0
    if (disqualified) return 0;

    // Validate center of mass
    const validCOM = {
      x: isFinite(centerOfMass.x) ? centerOfMass.x : 0,
      y: isFinite(centerOfMass.y) ? centerOfMass.y : 0,
      z: isFinite(centerOfMass.z) ? centerOfMass.z : 0
    };

    // Base: pelletPoints per collected pellet
    let fitness = pelletsCollectedCount * pelletPoints;

    // Progress toward current pellet (0-progressMax points, using XZ ground distance from EDGE)
    const activePellet = getActivePellet();
    if (activePellet && activePellet.initialDistance > 0) {
      // Calculate current edge-to-pellet ground distance (XZ only)
      const currentEdgeDist = edgeToPointGroundDistance(validCOM, creatureXZRadius, activePellet.position);

      if (isFinite(currentEdgeDist)) {
        // Progress = how much closer the EDGE has gotten (0 = no progress, 1 = edge reached pellet horizontally)
        const progress = Math.max(0, Math.min(1,
          (activePellet.initialDistance - currentEdgeDist) / activePellet.initialDistance
        ));
        // Cap at progressMax points (remaining comes from actually collecting)
        fitness += progress * progressMax;

        // Track closest edge distance for penalty calculation
        if (currentEdgeDist < closestEdgeDistanceToCurrentPellet) {
          closestEdgeDistanceToCurrentPellet = currentEdgeDist;
        }

        // PENALTY: After first pellet, penalize up to -regressionPenalty for moving AWAY from pellet
        // Only apply if we've collected at least one pellet and are moving away
        if (pelletsCollectedCount > 0 && currentEdgeDist > closestEdgeDistanceToCurrentPellet) {
          // How much further we've moved from our closest approach
          const regressionDist = currentEdgeDist - closestEdgeDistanceToCurrentPellet;
          // Penalty scales with regression, max -regressionPenalty points
          // Full penalty when regression equals half the initial distance
          const regressionRatio = Math.min(1, regressionDist / (activePellet.initialDistance * 0.5));
          fitness -= regressionRatio * regressionPenalty;
        }
      }
    }

    // NET DISPLACEMENT BONUS: Reward straight-line distance from start (stepping stone for evolution)
    // Encourages creatures to move away from origin rather than circle back
    if (currentTime > 0.5) {  // Only apply after settling period
      const displacementRate = currentNetDisplacement / currentTime;  // Units per second
      const displacementRatio = Math.min(1, displacementRate / TARGET_DISPLACEMENT_RATE);
      fitness += displacementRatio * netDisplacementMax;
    }

    // DISTANCE TRAVELED BONUS: Reward total distance covered
    // distancePerUnit points per unit traveled, capped at distanceTraveledMax
    const distanceBonus = Math.min(currentDistanceTraveled * distancePerUnit, distanceTraveledMax);
    fitness += distanceBonus;

    // EFFICIENCY PENALTY: Penalize excessive muscle activation (neural mode only)
    // Encourages creatures to achieve results with less "effort"
    if (useNeural && efficiencyPenalty > 0) {
      fitness -= currentMuscleActivation * efficiencyPenalty;
    }

    // Ensure fitness is never negative (minimum 0)
    return Math.max(0, fitness);
  };

  // v2: Track previous center of mass for velocity calculation
  let prevCOM: Vector3 | null = null;
  const MAX_PELLET_DISTANCE = 20;  // For normalizing distance (matches proximity bonus max)

  for (let step = 0; step < totalSteps; step++) {
    // Calculate current center of mass for direction-modulated control
    let comX = 0, comY = 0, comZ = 0, comMass = 0;
    for (const body of nodeBodies.values()) {
      if (isFinite(body.position.x) && isFinite(body.position.y) && isFinite(body.position.z)) {
        comX += body.position.x * body.mass;
        comY += body.position.y * body.mass;
        comZ += body.position.z * body.mass;
        comMass += body.mass;
      }
    }
    const currentCOM: Vector3 = comMass > 0
      ? { x: comX / comMass, y: comY / comMass, z: comZ / comMass }
      : { x: 0, y: 0, z: 0 };

    // v2: Calculate velocity (change in COM since last step)
    let velocityDirection: Vector3 = { x: 0, y: 0, z: 0 };
    if (prevCOM) {
      const velocity = subtract(currentCOM, prevCOM);
      const speed = length(velocity);
      if (speed > 0.001) {  // Only normalize if actually moving
        velocityDirection = normalize(velocity);
      }
    }
    prevCOM = { ...currentCOM };

    // Calculate direction and distance to active pellet for muscle modulation
    const activePelletForModulation = getActivePellet();
    let pelletDirection: Vector3 = { x: 0, y: 0, z: 0 };
    let normalizedDistance = 1;  // 1 = far, 0 = at pellet
    if (activePelletForModulation) {
      const toPellet = subtract(activePelletForModulation.position, currentCOM);
      const dist = length(toPellet);
      if (dist > 0.01) {  // Avoid division by zero
        pelletDirection = normalize(toPellet);
      }
      // v2: Normalize distance (0 = at pellet, 1 = far away)
      normalizedDistance = Math.min(dist / MAX_PELLET_DISTANCE, 1);
    }

    // Get neural network outputs if enabled
    let neuralOutputs: number[] | null = null;
    if (neuralNetwork) {
      // Use mode-specific sensor inputs
      const sensorInputs = neuralMode === 'pure'
        ? gatherSensorInputsPure(pelletDirection, velocityDirection, normalizedDistance)
        : gatherSensorInputsHybrid(pelletDirection, velocityDirection, normalizedDistance, simulationTime);
      neuralOutputs = neuralNetwork.predict(sensorInputs);

      // Apply dead zone in pure mode (small outputs become 0)
      if (neuralMode === 'pure' && deadZone > 0) {
        neuralOutputs = neuralOutputs.map(output =>
          Math.abs(output) < deadZone ? 0 : output
        );
      }
    }

    // Update springs with multi-factor modulated oscillation (v2)
    // Or use neural network control if enabled
    for (let springIdx = 0; springIdx < springs.length; springIdx++) {
      const {
        spring, frequency, amplitude, phase, baseRestLength,
        directionBias, biasStrength,
        velocityBias, velocityStrength,
        distanceBias, distanceStrength
      } = springs[springIdx];

      let finalContraction: number;

      if (neuralOutputs && springIdx < neuralOutputs.length) {
        // Neural network control
        const nnOutput = neuralOutputs[springIdx];  // Already in [-1, 1] range from tanh

        // Track muscle activation (absolute value) for efficiency penalty
        totalMuscleActivation += Math.abs(nnOutput);

        if (neuralMode === 'pure') {
          // Pure mode: NN directly controls contraction
          // nnOutput is in [-1, 1], map to contraction range
          finalContraction = nnOutput * amplitude;
        } else {
          // Hybrid mode: NN output modulates base oscillator
          const baseContraction = Math.sin(simulationTime * frequency * Math.PI * 2 + phase);
          // NN output acts as a modulation factor (0.5 to 1.5 range)
          const nnModulation = 0.5 + (nnOutput + 1) * 0.5;  // Map [-1,1] to [0.5, 1.5]
          finalContraction = baseContraction * amplitude * nnModulation;
        }
      } else {
        // Oscillator-based control (original behavior)
        // Base oscillation
        const baseContraction = Math.sin(simulationTime * frequency * Math.PI * 2 + phase);

        // v1: Direction modulation
        // dot product gives -1 to 1: 1 = pellet in same direction as bias, -1 = opposite
        const directionMatch = dot(pelletDirection, directionBias);
        const directionMod = directionMatch * biasStrength;

        // v2: Velocity modulation (proprioception)
        // Activates when creature is moving in the muscle's preferred direction
        const velocityMatch = dot(velocityDirection, velocityBias);
        const velocityMod = velocityMatch * velocityStrength;

        // v2: Distance modulation
        // distanceBias > 0: activate more when NEAR (nearness = 1 - normalizedDistance)
        // distanceBias < 0: activate more when FAR
        const nearness = 1 - normalizedDistance;
        const distanceMod = (distanceBias * nearness) * distanceStrength;

        // Combined modulation (clamped to prevent extreme values)
        const modulation = Math.max(0.1, Math.min(2.5, 1 + directionMod + velocityMod + distanceMod));

        // Final contraction with modulation
        finalContraction = baseContraction * amplitude * modulation;
      }

      spring.restLength = baseRestLength * (1 - finalContraction);
      spring.applyForce();
    }

    // Step physics
    world.step(timeStep);
    simulationTime += timeStep;

    // Record frame at specified rate
    if (simulationTime - lastFrameTime >= frameInterval || step === 0) {
      const nodePositions = new Map<string, Vector3>();
      let cx = 0, cy = 0, cz = 0, totalMass = 0;

      for (const [nodeId, body] of nodeBodies) {
        // Check for NaN positions (physics explosion)
        if (!isFinite(body.position.x) || !isFinite(body.position.y) || !isFinite(body.position.z)) {
          disqualified = 'nan_position';
        }

        // Validate position - guard against physics explosion
        const px = isFinite(body.position.x) ? body.position.x : 0;
        const py = isFinite(body.position.y) ? body.position.y : 0;
        const pz = isFinite(body.position.z) ? body.position.z : 0;

        // Check if creature has launched into oblivion
        const distFromOrigin = Math.sqrt(px * px + py * py + pz * pz);
        if (distFromOrigin > POSITION_THRESHOLD || py > HEIGHT_THRESHOLD) {
          disqualified = 'physics_explosion';
        }

        const pos = { x: px, y: py, z: pz };
        nodePositions.set(nodeId, pos);
        cx += pos.x * body.mass;
        cy += pos.y * body.mass;
        cz += pos.z * body.mass;
        totalMass += body.mass;
      }

      // Guard against division by zero or NaN
      const centerOfMass = totalMass > 0 ? {
        x: isFinite(cx / totalMass) ? cx / totalMass : 0,
        y: isFinite(cy / totalMass) ? cy / totalMass : 0,
        z: isFinite(cz / totalMass) ? cz / totalMass : 0
      } : { x: 0, y: 0, z: 0 };

      // Track distance traveled (XZ only - vertical movement doesn't count)
      if (lastCenterOfMass) {
        const dx = centerOfMass.x - lastCenterOfMass.x;
        const dz = centerOfMass.z - lastCenterOfMass.z;
        const frameDist = Math.sqrt(dx * dx + dz * dz);
        // Only add if finite
        if (isFinite(frameDist)) {
          distanceTraveled += frameDist;
        }
      }
      lastCenterOfMass = { ...centerOfMass };

      // Store initial position on first frame
      if (initialCenterOfMass === null) {
        initialCenterOfMass = { ...centerOfMass };
      }

      // Calculate current net displacement (XZ only - ignore Y/falling)
      let currentNetDisplacement = 0;
      if (initialCenterOfMass) {
        const ndx = centerOfMass.x - initialCenterOfMass.x;
        const ndz = centerOfMass.z - initialCenterOfMass.z;
        // XZ only - falling doesn't count as movement
        currentNetDisplacement = Math.sqrt(ndx * ndx + ndz * ndz);
        if (!isFinite(currentNetDisplacement)) currentNetDisplacement = 0;
      }

      // Check pellet collection - only check active pellet
      const activePellet = getActivePellet();
      if (activePellet) {
        for (const [nodeId, body] of nodeBodies) {
          const node = genome.nodes.find(n => n.id === nodeId);
          if (!node) continue;

          const dx = body.position.x - activePellet.position.x;
          const dy = body.position.y - activePellet.position.y;
          const dz = body.position.z - activePellet.position.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < node.size * 0.5 + 0.35) {
            // Collected!
            activePellet.collectedAtFrame = frames.length;
            pelletsCollected++;
            currentPelletIndex++;

            // Reset closest edge distance tracker for the next pellet
            closestEdgeDistanceToCurrentPellet = Infinity;

            // Spawn next pellet (up to a max)
            // Use genome-based XZ radius (consistent, with buffer for extension)
            if (currentPelletIndex < 10) {  // Max 10 pellets per simulation
              const newPelletPos = generatePelletPosition(
                config.arenaSize,
                currentPelletIndex,
                centerOfMass,       // Creature's current position
                creatureXZRadius    // Genome-based XZ radius (consistent)
              );
              // Initial distance = XZ ground distance from creature's EDGE to pellet
              const newPelletEdgeDist = edgeToPointGroundDistance(centerOfMass, creatureXZRadius, newPelletPos);
              pellets.push({
                id: `pellet_${currentPelletIndex}`,
                position: newPelletPos,
                collectedAtFrame: null,
                spawnedAtFrame: frames.length,
                initialDistance: newPelletEdgeDist  // Edge-based ground distance
              });
            }
            break;
          }
        }
      }

      frames.push({
        time: simulationTime,
        nodePositions,
        centerOfMass,
        activePelletIndex: currentPelletIndex
      });

      // Track fitness at this frame
      // Normalize muscle activation by frames so far and muscle count to get average activation
      const avgMuscleActivation = springs.length > 0 ? totalMuscleActivation / ((step + 1) * springs.length) : 0;
      fitnessOverTime.push(calculateCurrentFitness(centerOfMass, pelletsCollected, currentNetDisplacement, distanceTraveled, simulationTime, avgMuscleActivation));

      lastFrameTime = simulationTime;
    }
  }

  // Find closest pellet distance from final position (to active pellet)
  const finalCOM = frames[frames.length - 1]?.centerOfMass || { x: 0, y: 0, z: 0 };

  // Validate finalCOM - if any value is NaN/Infinity, use default
  const validFinalCOM = {
    x: isFinite(finalCOM.x) ? finalCOM.x : 0,
    y: isFinite(finalCOM.y) ? finalCOM.y : 0,
    z: isFinite(finalCOM.z) ? finalCOM.z : 0
  };

  let closestPelletDistance = Infinity;
  const finalActivePellet = getActivePellet();
  if (finalActivePellet) {
    const dx = validFinalCOM.x - finalActivePellet.position.x;
    const dy = validFinalCOM.y - finalActivePellet.position.y;
    const dz = validFinalCOM.z - finalActivePellet.position.z;
    closestPelletDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Guard against NaN
    if (!isFinite(closestPelletDistance)) {
      closestPelletDistance = Infinity;
    }
  }

  // Calculate net displacement (straight-line distance from start to end)
  const validInitialCOM = initialCenterOfMass || { x: 0, y: 0, z: 0 };
  const netDx = validFinalCOM.x - validInitialCOM.x;
  const netDy = validFinalCOM.y - validInitialCOM.y;
  const netDz = validFinalCOM.z - validInitialCOM.z;
  // Full 3D net displacement for stats
  const netDisplacement = Math.sqrt(netDx * netDx + netDy * netDy + netDz * netDz);
  const validNetDisplacement = isFinite(netDisplacement) ? netDisplacement : 0;
  // XZ-only net displacement for fitness (falling doesn't count)
  const netDisplacementXZ = Math.sqrt(netDx * netDx + netDz * netDz);
  const validNetDisplacementXZ = isFinite(netDisplacementXZ) ? netDisplacementXZ : 0;

  // If disqualified during simulation, return with fitness 0
  if (disqualified) {
    return {
      genome,
      frames,
      finalFitness: 0,
      pelletsCollected,
      distanceTraveled,
      netDisplacement: validNetDisplacement,
      closestPelletDistance,
      pellets,
      fitnessOverTime,
      disqualified
    };
  }

  // SIMPLE FITNESS MODEL (values configurable via SimulationConfig):
  // - pelletPoints per collected pellet (default 100)
  // - 0-progressMax points for progress toward current pellet (default 80)
  // - Net displacement bonus: 0-netDisplacementMax points (default 15)
  // - Distance traveled bonus: distancePerUnit pts/unit up to distanceTraveledMax (default 15)
  // - After first pellet: up to -regressionPenalty for moving away (default 20)
  // - Efficiency penalty: penalizes average muscle activation (neural mode)
  // Normalize total activation by steps and muscles to get average activation (0-1 range)
  const avgMuscleActivation = springs.length > 0 ? totalMuscleActivation / (totalSteps * springs.length) : 0;
  const finalFitness = calculateCurrentFitness(validFinalCOM, pelletsCollected, validNetDisplacementXZ, distanceTraveled, simulationTime, avgMuscleActivation);

  return {
    genome,
    frames,
    finalFitness,
    pelletsCollected,
    distanceTraveled,
    netDisplacement: validNetDisplacement,
    closestPelletDistance,
    pellets,
    fitnessOverTime,
    disqualified: null
  };
}

/**
 * Simulate all creatures in a population
 */
export async function simulatePopulation(
  genomes: CreatureGenome[],
  config: SimulationConfig,
  onProgress?: (completed: number, total: number) => void
): Promise<CreatureSimulationResult[]> {
  const results: CreatureSimulationResult[] = [];

  for (let i = 0; i < genomes.length; i++) {
    const result = simulateCreature(genomes[i], config);
    results.push(result);

    if (onProgress) {
      onProgress(i + 1, genomes.length);
    }

    // Yield to UI every creature to prevent long GC pauses
    // This gives the garbage collector smaller chunks to work with
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
}
