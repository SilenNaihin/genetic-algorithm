import type { NeuralGenomeData } from '../neural/NeuralGenome';
import type { NEATGenome } from './simulation';

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

  // v1: Direction-modulated control (allows creatures to "see" pellets)
  directionBias: Vector3;  // Unit vector - muscle activates more when pellet is in this direction
  biasStrength: number;    // 0 = pure oscillator, 1 = heavily modulated by pellet direction

  // v2: Velocity sensing (proprioception - sense own movement)
  velocityBias: Vector3;   // Unit vector - muscle activates more when moving in this direction
  velocityStrength: number; // 0 = ignore velocity, 1 = heavily modulated by own movement

  // v2: Distance awareness (sense pellet distance)
  distanceBias: number;    // -1 = activate when far, +1 = activate when near
  distanceStrength: number; // 0 = ignore distance, 1 = heavily modulated by pellet distance
}

// Controller interface - allows swapping oscillator for neural net later
export interface MuscleController {
  getContraction(time: number, sensorInputs?: number[]): number;
}

export type ControllerType = 'oscillator' | 'neural';

// Embedded ancestor info for lineage display
export interface AncestorEntry {
  generation: number;
  fitness: number;
  nodeCount: number;
  muscleCount: number;
  color: HSL;
  reproductionType?: 'crossover' | 'mutation';
}

export interface CreatureGenome {
  id: string;
  generation: number;      // Lineage age (how many generations of ancestors)
  survivalStreak: number;  // How many consecutive generations THIS creature has survived
  parentIds: string[];     // For genealogy tracking
  nodes: NodeGene[];       // 2-10 nodes typically
  muscles: MuscleGene[];   // Connections between nodes

  // Global control parameter
  globalFrequencyMultiplier: number;  // Scales all muscle frequencies

  // Controller type (oscillator or neural network)
  controllerType: ControllerType;

  // Neural network weights (only used when controllerType === 'neural')
  neuralGenome?: NeuralGenomeData;

  // NEAT genome (variable topology neural network, alternative to neuralGenome)
  neatGenome?: NEATGenome;

  // Visual
  color: HSL;

  // Embedded ancestry chain - lineage info without DB lookups
  ancestryChain?: AncestorEntry[];

  // Internal: API creature ID for lazy frame loading (not saved to storage)
  _apiCreatureId?: string;
  // Internal: Generation to fetch frames from (for history view or specific replay)
  _bestPerformanceGeneration?: number;
  // Internal: If true, fetch frames from best fitness generation (for best/longest survivor)
  _fetchBestPerformance?: boolean;
}

// Creature constraints configuration
export interface GenomeConstraints {
  min_nodes: number;
  max_nodes: number;
  min_muscles: number;
  max_muscles: number;
  min_size: number;
  max_size: number;
  min_stiffness: number;
  max_stiffness: number;
  min_frequency: number;
  max_frequency: number;
  max_amplitude: number;
  spawn_radius: number;   // How far apart nodes can spawn
}

export const DEFAULT_GENOME_CONSTRAINTS: GenomeConstraints = {
  min_nodes: 2,
  max_nodes: 8,
  min_muscles: 1,
  max_muscles: 15,
  min_size: 0.2,
  max_size: 0.8,
  min_stiffness: 50,
  max_stiffness: 500,
  min_frequency: 0.5,
  max_frequency: 3.0,
  max_amplitude: 0.4,
  spawn_radius: 2.0
};
