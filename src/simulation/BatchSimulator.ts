import * as CANNON from 'cannon-es';
import type { CreatureGenome, Vector3, SimulationConfig } from '../types';
import { DEFAULT_CONFIG, DEFAULT_FITNESS_WEIGHTS } from '../types';

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
}

// Generate a pellet position that gets progressively harder
function generatePelletPosition(arenaSize: number, pelletIndex: number): Vector3 {
  // Progressive difficulty:
  // - First pellet: close to origin, on ground
  // - Later pellets: further away AND elevated (not on ground!)

  // Distance from origin increases with pellet index
  const minRadius = 1.0;  // First pellet very close
  const maxRadius = arenaSize * 0.4;
  const radiusProgress = Math.min(pelletIndex / 5, 1);  // Reaches max at pellet 5
  const radius = minRadius + (maxRadius - minRadius) * radiusProgress;

  // Height increases with pellet index
  // First pellet on ground, subsequent ones elevated
  // Heights: ground(0.3), then progressively higher (0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0)
  const baseHeight = 0.3;
  const heightIncrement = 0.4;
  const height = pelletIndex === 0 ? baseHeight : baseHeight + pelletIndex * heightIncrement;

  // Random angle for position
  const angle = Math.random() * Math.PI * 2;

  // Add some randomness to radius (±20%)
  const actualRadius = radius * (0.8 + Math.random() * 0.4);

  return {
    x: Math.cos(angle) * actualRadius,
    y: height,
    z: Math.sin(angle) * actualRadius
  };
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
      finalFitness: 1,
      pelletsCollected: 0,
      distanceTraveled: 0,
      netDisplacement: 0,
      closestPelletDistance: Infinity,
      pellets: [],
      fitnessOverTime: [1],
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
      baseRestLength: muscle.restLength
    });
  }

  // Create pellets - one at a time, respawns when collected
  const pellets: PelletData[] = [];
  let currentPelletIndex = 0;

  // Create first pellet
  pellets.push({
    id: `pellet_0`,
    position: generatePelletPosition(config.arenaSize, 0),
    collectedAtFrame: null,
    spawnedAtFrame: 0
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

  // Thresholds for detecting physics explosion
  const POSITION_THRESHOLD = 50;  // If any node goes beyond 50 units from origin
  const HEIGHT_THRESHOLD = 30;    // If creature flies higher than 30 units

  // Helper to get active (uncollected) pellet
  const getActivePellet = (): PelletData | null => {
    return pellets.find(p => p.collectedAtFrame === null) || null;
  };

  // Helper to calculate fitness at any point (with NaN protection)
  // Uses configurable weights from config.fitnessWeights
  const weights = config.fitnessWeights || DEFAULT_FITNESS_WEIGHTS;

  const calculateCurrentFitness = (centerOfMass: Vector3, pelletsCollectedCount: number, distTraveled: number, initialCOM: Vector3 | null): number => {
    // If disqualified, always return 1
    if (disqualified) return 1;

    // Validate inputs
    const validCOM = {
      x: isFinite(centerOfMass.x) ? centerOfMass.x : 0,
      y: isFinite(centerOfMass.y) ? centerOfMass.y : 0,
      z: isFinite(centerOfMass.z) ? centerOfMass.z : 0
    };
    const validDist = isFinite(distTraveled) ? distTraveled : 0;

    // Base fitness
    let f = weights.baseFitness;

    // PRIMARY: Pellet collection
    f += pelletsCollectedCount * weights.pelletWeight;

    // SECONDARY: Proximity bonus for being close to active pellet
    const activePellet = getActivePellet();
    if (activePellet) {
      const pdx = validCOM.x - activePellet.position.x;
      const pdy = validCOM.y - activePellet.position.y;
      const pdz = validCOM.z - activePellet.position.z;
      const pelletDist = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);
      if (isFinite(pelletDist)) {
        f += Math.max(0, weights.proximityMaxDistance - pelletDist) * weights.proximityWeight;
      }
    }

    // TERTIARY: Movement bonus (capped)
    f += Math.min(validDist * weights.movementWeight, weights.movementCap);

    // QUATERNARY: Net displacement bonus
    if (weights.distanceWeight > 0 && initialCOM) {
      const validInitialCOM = {
        x: isFinite(initialCOM.x) ? initialCOM.x : 0,
        y: isFinite(initialCOM.y) ? initialCOM.y : 0,
        z: isFinite(initialCOM.z) ? initialCOM.z : 0
      };
      const netDx = validCOM.x - validInitialCOM.x;
      const netDy = validCOM.y - validInitialCOM.y;
      const netDz = validCOM.z - validInitialCOM.z;
      const netDisp = Math.sqrt(netDx * netDx + netDy * netDy + netDz * netDz);
      if (isFinite(netDisp)) {
        f += Math.min(netDisp * weights.distanceWeight, weights.distanceCap);
      }
    }

    // Final validation
    return isFinite(f) ? Math.max(f, 1) : 1;
  };

  for (let step = 0; step < totalSteps; step++) {
    // Update springs with oscillation
    for (const { spring, frequency, amplitude, phase, baseRestLength } of springs) {
      const contraction = Math.sin(simulationTime * frequency * Math.PI * 2 + phase);
      spring.restLength = baseRestLength * (1 - contraction * amplitude);
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

      // Track distance traveled
      if (lastCenterOfMass) {
        const dx = centerOfMass.x - lastCenterOfMass.x;
        const dy = centerOfMass.y - lastCenterOfMass.y;
        const dz = centerOfMass.z - lastCenterOfMass.z;
        const frameDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
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

            // Spawn next pellet (up to a max)
            if (currentPelletIndex < 10) {  // Max 10 pellets per simulation
              pellets.push({
                id: `pellet_${currentPelletIndex}`,
                position: generatePelletPosition(config.arenaSize, currentPelletIndex),
                collectedAtFrame: null,
                spawnedAtFrame: frames.length
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
      fitnessOverTime.push(calculateCurrentFitness(centerOfMass, pelletsCollected, distanceTraveled, initialCenterOfMass));

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
  const netDisplacement = Math.sqrt(netDx * netDx + netDy * netDy + netDz * netDz);
  const validNetDisplacement = isFinite(netDisplacement) ? netDisplacement : 0;

  // If disqualified during simulation, return with fitness 1
  if (disqualified) {
    return {
      genome,
      frames,
      finalFitness: 1,
      pelletsCollected,
      distanceTraveled,
      netDisplacement: validNetDisplacement,
      closestPelletDistance,
      pellets,
      fitnessOverTime,
      disqualified
    };
  }

  // FITNESS CALCULATION - using configurable weights (weights already declared above)
  let fitness = weights.baseFitness;

  // PRIMARY: Pellet collection is the main driver
  fitness += pelletsCollected * weights.pelletWeight;

  // SECONDARY: Proximity bonus for being close to current target
  if (isFinite(closestPelletDistance)) {
    const proximityBonus = Math.max(0, weights.proximityMaxDistance - closestPelletDistance) * weights.proximityWeight;
    fitness += proximityBonus;
  }

  // TERTIARY: Movement bonus (capped) - rewards total path length
  const validDistanceTraveled = isFinite(distanceTraveled) ? distanceTraveled : 0;
  fitness += Math.min(validDistanceTraveled * weights.movementWeight, weights.movementCap);

  // QUATERNARY: Net displacement bonus - rewards straight-line distance from start
  if (weights.distanceWeight > 0) {
    fitness += Math.min(validNetDisplacement * weights.distanceWeight, weights.distanceCap);
  }

  // Final validation - ensure fitness is always a positive finite number
  if (!isFinite(fitness) || fitness < 1) {
    fitness = 1;
  }

  return {
    genome,
    frames,
    finalFitness: fitness,
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
