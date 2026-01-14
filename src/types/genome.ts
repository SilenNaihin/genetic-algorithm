export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface HSL {
  h: number;  // 0-1
  s: number;  // 0-1
  l: number;  // 0-1
}

export interface NodeGene {
  id: string;
  size: number;         // 0.1-1.0, affects mass and visual size
  friction: number;     // 0.0-1.0, surface friction
  position: Vector3;    // Initial relative position from center
}

export interface MuscleGene {
  id: string;
  nodeA: string;        // Reference to NodeGene.id
  nodeB: string;        // Reference to NodeGene.id
  restLength: number;   // Natural spring length
  stiffness: number;    // Spring constant k (10-1000)
  damping: number;      // Damping coefficient (0-1)

  // Oscillation behavior (muscles contract/expand rhythmically)
  frequency: number;    // Hz (0.1-5.0)
  amplitude: number;    // Contraction amount (0-0.5 of restLength)
  phase: number;        // Phase offset (0-2*PI)

  // Direction-modulated control (allows creatures to "see" pellets)
  directionBias: Vector3;  // Unit vector - muscle activates more when pellet is in this direction
  biasStrength: number;    // 0 = pure oscillator, 1 = heavily modulated by pellet direction
}

// Controller interface - allows swapping oscillator for neural net later
export interface MuscleController {
  getContraction(time: number, sensorInputs?: number[]): number;
}

export type ControllerType = 'oscillator' | 'neural';

export interface CreatureGenome {
  id: string;
  generation: number;      // Lineage age (how many generations of ancestors)
  survivalStreak: number;  // How many consecutive generations THIS creature has survived
  parentIds: string[];     // For genealogy tracking
  nodes: NodeGene[];       // 2-10 nodes typically
  muscles: MuscleGene[];   // Connections between nodes

  // Global control parameter
  globalFrequencyMultiplier: number;  // Scales all muscle frequencies

  // Controller type (for future neural network support)
  controllerType: ControllerType;

  // Visual
  color: HSL;
}

// Creature constraints configuration
export interface GenomeConstraints {
  minNodes: number;
  maxNodes: number;
  minMuscles: number;
  maxMuscles: number;
  minSize: number;
  maxSize: number;
  minStiffness: number;
  maxStiffness: number;
  minFrequency: number;
  maxFrequency: number;
  maxAmplitude: number;
  spawnRadius: number;   // How far apart nodes can spawn
}

export const DEFAULT_GENOME_CONSTRAINTS: GenomeConstraints = {
  minNodes: 2,
  maxNodes: 8,
  minMuscles: 1,
  maxMuscles: 15,
  minSize: 0.2,
  maxSize: 0.8,
  minStiffness: 50,
  maxStiffness: 500,
  minFrequency: 0.5,
  maxFrequency: 3.0,
  maxAmplitude: 0.4,
  spawnRadius: 2.0
};
