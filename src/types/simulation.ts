import type { CreatureGenome, Vector3 } from './genome';
import type { ActivationType } from '../neural/activations';

export enum SimulationPhase {
  MENU = 'menu',
  GENERATING = 'generating',
  SIMULATING = 'simulating',
  DISPLAYING = 'displaying',
  EVOLVING = 'evolving',
  PAUSED = 'paused'
}

export interface SimulationConfig {
  // Physics
  gravity: number;              // -9.8 to -30
  groundFriction: number;       // 0.3 to 1.0
  timeStep: number;             // Physics timestep (1/physicsFPS)
  physicsFPS: number;           // Physics frames per second (15-120)
  simulationDuration: number;   // Seconds per generation

  // Evolution
  populationSize: number;       // 100
  cullPercentage: number;       // 0.5 (bottom 50%)
  mutationRate: number;         // Per-gene mutation rate (0.1-0.5)
  mutationMagnitude: number;    // How much values change
  crossoverRate: number;        // Probability of crossover vs mutation for new creatures (0-1)
  eliteCount: number;           // Deprecated - survivors determined by cullPercentage
  useMutation: boolean;         // Whether to apply mutation during evolution
  useCrossover: boolean;        // Whether to use crossover (vs mutation only)

  // Creature constraints
  minNodes: number;
  maxNodes: number;
  maxMuscles: number;
  maxAllowedFrequency: number;  // Max muscle frequency before creature is penalized

  // Environment
  pelletCount: number;          // Number of pellets per arena
  arenaSize: number;            // Size of simulation arena

  // Fitness function (simple model)
  fitnessPelletPoints: number;          // Points per pellet collected (default 20, on top of 80 progress = 100 total)
  fitnessProgressMax: number;           // Max points for progress toward pellet (default 80)
  fitnessDistancePerUnit: number;       // Points per unit of distance traveled (default 3)
  fitnessDistanceTraveledMax: number;   // Max points for distance traveled (default 20)
  fitnessRegressionPenalty: number;     // Max penalty for moving away after 1st pellet collection (default 20)

  // Neural network settings (neuroevolution)
  useNeuralNet: boolean;              // Enable neural network control
  neuralMode: 'hybrid' | 'pure';      // How NN output is used
  neuralHiddenSize: number;           // Neurons in hidden layer
  neuralActivation: ActivationType;   // Activation function
  weightMutationRate: number;         // Target/end probability each weight mutates
  weightMutationMagnitude: number;    // Std dev of weight perturbation
  weightMutationDecay: 'off' | 'linear' | 'exponential';  // Mutation rate decay mode
  neuralOutputBias: number;           // Initial output neuron bias (-2 to 0, more negative = muscles harder to activate)
  fitnessEfficiencyPenalty: number;   // Penalty per unit of total muscle activation (encourages efficient movement)
  neuralDeadZone: number;             // Dead zone threshold for pure mode (outputs < threshold become 0)

  // Frame storage mode for replay capability
  frameStorageMode: 'none' | 'sparse' | 'all';  // none = no replays, sparse = top/bottom only, all = all creatures
  sparseTopCount: number;             // Number of top performers to store frames for (sparse mode)
  sparseBottomCount: number;          // Number of bottom performers to store frames for (sparse mode)
}

export const DEFAULT_CONFIG: SimulationConfig = {
  gravity: -9.8,
  groundFriction: 0.5,
  timeStep: 1 / 60,
  physicsFPS: 60,
  simulationDuration: 10,

  populationSize: 100,
  cullPercentage: 0.5,
  mutationRate: 0.1,
  mutationMagnitude: 0.3,
  crossoverRate: 0.5,
  eliteCount: 5,
  useMutation: true,
  useCrossover: true,

  minNodes: 3,
  maxNodes: 8,
  maxMuscles: 15,
  maxAllowedFrequency: 3.0,

  pelletCount: 3,
  arenaSize: 10,

  // Fitness function defaults
  fitnessPelletPoints: 20,    // On top of 80 progress = 100 total per pellet
  fitnessProgressMax: 80,
  fitnessDistancePerUnit: 3,
  fitnessDistanceTraveledMax: 20,
  fitnessRegressionPenalty: 20,

  // Neural network defaults (enabled by default)
  useNeuralNet: true,
  neuralMode: 'hybrid',
  neuralHiddenSize: 8,
  neuralActivation: 'tanh',
  weightMutationRate: 0.1,
  weightMutationMagnitude: 0.3,
  weightMutationDecay: 'off',    // No decay by default
  neuralOutputBias: -0.5,        // Initial output neuron bias (-2 to 0, more negative = muscles harder to activate)
  fitnessEfficiencyPenalty: 0.5, // Subtract 0.5 * total_activation from fitness
  neuralDeadZone: 0.1,           // Outputs with absolute value < 0.1 become 0 in pure mode

  // Frame storage mode
  frameStorageMode: 'all',       // Store frames for all creatures by default (enables replays)
  sparseTopCount: 10,            // Store frames for top 10 performers in sparse mode
  sparseBottomCount: 5,          // Store frames for bottom 5 performers in sparse mode
};

export interface CreatureState {
  genome: CreatureGenome;

  // Physics state
  nodePositions: Map<string, Vector3>;
  nodeVelocities: Map<string, Vector3>;
  centerOfMass: Vector3;

  // Simulation results
  fitness: number;
  pelletsCollected: number;
  distanceTraveled: number;
  closestPelletDistance: number;

  // Grid position for display
  gridX: number;
  gridY: number;

  // Selection state
  isSelected: boolean;
}

export interface PelletState {
  id: string;
  position: Vector3;
  collected: boolean;
}

export interface FitnessHistoryEntry {
  generation: number;
  best: number;
  average: number;
  worst: number;
}

export interface ConfigHistoryEntry {
  generation: number;
  avgNodes: number;
  avgMuscles: number;
  avgBodySize: number;
}

export interface PopulationStats {
  generation: number;
  bestFitness: number;
  averageFitness: number;
  worstFitness: number;
  avgNodes: number;
  avgMuscles: number;
}

// =============================================================================
// Simulation Result Types (shared by frontend and backend)
// =============================================================================

export interface SimulationFrame {
  time: number;
  nodePositions: Map<string, Vector3>;
  centerOfMass: Vector3;
  activePelletIndex: number;
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
  netDisplacement: number;  // Straight-line distance from start to end (metric only, not fitness)
  closestPelletDistance: number;
  pellets: PelletData[];
  fitnessOverTime: number[];
  disqualified: DisqualificationReason;
}

export interface PelletData {
  id: string;
  position: Vector3;
  collectedAtFrame: number | null;
  spawnedAtFrame: number;
  initialDistance: number;  // Distance from creature edge when pellet spawned
}
