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

  // Muscle constraints
  muscleVelocityCap: number;       // Max muscle length change per second (0.1-20.0)
  muscleDampingMultiplier: number; // Global damping scale (0.1-5.0, higher = more resistance)
  maxExtensionRatio: number;       // Max muscle stretch (1.2-5.0, 2.0 = 50%-200% of rest length)

  // Evolution
  populationSize: number;       // 100
  cullPercentage: number;       // 0.5 (bottom 50%)
  selectionMethod: 'truncation' | 'tournament' | 'rank';  // How survivors are selected
  tournamentSize: number;       // For tournament selection: number of contestants per round
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
  neuralMode: 'hybrid' | 'pure' | 'neat';  // How NN output is used (neat = variable topology)
  timeEncoding: 'none' | 'cyclic' | 'sin' | 'raw' | 'sin_raw';  // Time encoding (default: none for pure, cyclic for hybrid)
  neuralHiddenSize: number;           // Neurons in hidden layer
  neuralActivation: ActivationType;   // Activation function
  weightMutationRate: number;         // Target/end probability each weight mutates
  weightMutationMagnitude: number;    // Std dev of weight perturbation
  weightMutationDecay: 'off' | 'linear' | 'exponential';  // Mutation rate decay mode
  neuralOutputBias: number;           // Initial output neuron bias (0 = neutral, inside dead zone)
  fitnessEfficiencyPenalty: number;   // Penalty per unit of total muscle activation (encourages efficient movement)
  neuralDeadZone: number;             // Dead zone threshold for pure mode (outputs < threshold become 0)
  neuralUpdateHz: number;             // NN update frequency in Hz (5-60, default 15)
  outputSmoothingAlpha: number;       // Exponential smoothing factor (0.05-1.0, 1.0 = no smoothing)

  // Adaptive mutation (escape stagnation)
  useAdaptiveMutation: boolean;       // Auto-boost mutation when fitness stagnates
  stagnationThreshold: number;        // Window size for comparing fitness (default 20)
  adaptiveMutationBoost: number;      // Multiplier for mutation rate during stagnation (e.g., 2.0 = double)
  maxAdaptiveBoost: number;           // Maximum boost multiplier cap (e.g., 8.0)
  improvementThreshold: number;       // Minimum fitness improvement to count as progress (absolute points)

  // Crossover method for neural weights
  neuralCrossoverMethod: 'interpolation' | 'uniform' | 'sbx';  // How neural weights are combined during crossover
  sbxEta: number;                     // SBX distribution index (0.5-5.0, lower = more exploration)

  // Fitness sharing (diversity maintenance)
  useFitnessSharing: boolean;         // Enable fitness sharing to penalize similar creatures
  sharingRadius: number;              // Genome distance threshold for sharing (0.1-2.0)

  // Speciation (diversity protection)
  useSpeciation: boolean;             // Enable speciation to group creatures by similarity
  compatibilityThreshold: number;     // Genome distance threshold for same species (0.1-3.0)
  minSpeciesSize: number;             // Minimum survivors per species (1-20)

  // NEAT (NeuroEvolution of Augmenting Topologies) - configured when neuralMode === 'neat'
  neatAddConnectionRate: number;      // Probability to add a new connection (0.01-0.2)
  neatAddNodeRate: number;            // Probability to add a new hidden node (0.01-0.1)
  neatEnableRate: number;             // Probability to re-enable a disabled connection (0.01-0.1)
  neatDisableRate: number;            // Probability to disable an enabled connection (0.01-0.1)
  neatExcessCoefficient: number;      // Weight for excess genes in compatibility distance (0-10)
  neatDisjointCoefficient: number;    // Weight for disjoint genes in compatibility distance (0-10)
  neatWeightCoefficient: number;      // Weight for weight differences in compatibility distance (0-10)
  neatMaxHiddenNodes: number;         // Maximum hidden neurons to prevent bloat (1-128)

  // Proprioception (body-sensing inputs)
  useProprioception: boolean;         // Enable body-sensing inputs (muscle strain, node velocities, ground contact)
  proprioceptionInputs: 'strain' | 'velocity' | 'ground' | 'all';  // Which proprioception inputs to include

  // Frame storage mode for replay capability
  frameStorageMode: 'none' | 'sparse' | 'all';  // none = no replays, sparse = top/bottom only, all = all creatures
  sparseTopCount: number;             // Number of top performers to store frames for (sparse mode)
  sparseBottomCount: number;          // Number of bottom performers to store frames for (sparse mode)
}

export const DEFAULT_CONFIG: SimulationConfig = {
  gravity: -9.8,
  groundFriction: 0.5,
  timeStep: 1 / 30,
  physicsFPS: 30,
  simulationDuration: 20,

  // Muscle constraints
  muscleVelocityCap: 5.0,       // Max muscle length change per second
  muscleDampingMultiplier: 1.0, // Default: no scaling (higher = more 'underwater' feel)
  maxExtensionRatio: 2.0,       // Muscles can stretch 50%-200% of rest length

  populationSize: 100,
  cullPercentage: 0.5,
  selectionMethod: 'rank',
  tournamentSize: 3,
  mutationRate: 0.2,
  mutationMagnitude: 0.3,
  crossoverRate: 0.5,
  eliteCount: 5,
  useMutation: true,
  useCrossover: false,

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
  neuralMode: 'pure',
  timeEncoding: 'none',  // Default 'none' for pure mode; 'cyclic' recommended for hybrid
  neuralHiddenSize: 8,
  neuralActivation: 'tanh',
  weightMutationRate: 0.2,
  weightMutationMagnitude: 0.05,
  weightMutationDecay: 'linear',
  neuralOutputBias: -0.1,        // Slight negative bias so muscles must evolve to activate
  fitnessEfficiencyPenalty: 0.1, // Subtle penalty for excessive activation
  neuralDeadZone: 0.1,           // Outputs with absolute value < 0.1 become 0 in pure mode
  neuralUpdateHz: 10,            // Update NN 10 times per second (smoother movement)
  outputSmoothingAlpha: 0.15,    // Aggressive smoothing (0.15 = 15% new + 85% old)

  // Adaptive mutation defaults
  useAdaptiveMutation: false,    // Off by default - enable for long runs
  stagnationThreshold: 20,       // 20-generation window for comparison
  adaptiveMutationBoost: 2.0,    // Double mutation rate during stagnation
  maxAdaptiveBoost: 8.0,         // Cap at 8x mutation rate
  improvementThreshold: 5.0,     // Need 5+ fitness points improvement to count

  // Crossover method defaults
  neuralCrossoverMethod: 'sbx',  // SBX produces smoother offspring distribution
  sbxEta: 2.0,                   // Balanced exploration/exploitation

  // Fitness sharing defaults
  useFitnessSharing: false,      // Off by default - enable to maintain diversity
  sharingRadius: 0.5,            // Moderate sharing radius

  // Speciation defaults
  useSpeciation: false,          // Off by default - enable to protect diverse solutions
  compatibilityThreshold: 1.0,   // Genome distance threshold for same species
  minSpeciesSize: 2,             // Minimum survivors per species

  // NEAT defaults (used when neuralMode === 'neat')
  neatAddConnectionRate: 0.05,   // 5% chance to add connection per genome
  neatAddNodeRate: 0.03,         // 3% chance to add node per genome
  neatEnableRate: 0.02,          // 2% chance to re-enable disabled connection
  neatDisableRate: 0.01,         // 1% chance to disable enabled connection
  neatExcessCoefficient: 1.0,    // Standard weight for excess genes
  neatDisjointCoefficient: 1.0,  // Standard weight for disjoint genes
  neatWeightCoefficient: 0.4,    // Lower weight for weight differences (per NEAT paper)
  neatMaxHiddenNodes: 16,        // Reasonable limit for complexity

  // Proprioception defaults
  useProprioception: false,      // Off by default - experimental feature
  proprioceptionInputs: 'all',   // Include all proprioception inputs when enabled

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
  activationsPerFrame?: FrameActivations[];  // Full neural network activations per frame

  // UI-specific properties (set by frontend from evolution step response)
  _isSurvivor?: boolean;   // For animation: creature survived from previous generation
  _hasFrames?: boolean;    // For replay button: frames are available in database

  // Lifecycle tracking (from API)
  birthGeneration?: number;  // Generation this creature was created
  deathGeneration?: number;  // Generation this creature died (null = still alive)
}

export interface PelletData {
  id: string;
  position: Vector3;
  collectedAtFrame: number | null;
  spawnedAtFrame: number;
  initialDistance: number;  // Distance from creature edge when pellet spawned
}

/**
 * Full neural network activation data for a single frame.
 * Includes inputs, hidden layer activations, and outputs.
 */
export interface FrameActivations {
  inputs: number[];   // Sensor inputs fed to network
  hidden: number[];   // Hidden layer activations
  outputs: number[];  // Muscle outputs (post-dead-zone)
  outputs_raw?: number[];  // Raw muscle outputs before dead zone (pure mode only)
}

// =============================================================================
// NEAT (NeuroEvolution of Augmenting Topologies) Types
// =============================================================================

/**
 * NEAT neuron gene - represents a node in the neural network.
 */
export interface NeuronGene {
  id: number;                           // Unique neuron ID
  type: 'input' | 'hidden' | 'output';  // Neuron type
  bias: number;                         // Bias value (0 for input neurons)
  innovation?: number;                  // Innovation number (only for hidden neurons)
}

/**
 * NEAT connection gene - represents a connection between neurons.
 */
export interface ConnectionGene {
  fromNode: number;      // Source neuron ID
  toNode: number;        // Target neuron ID
  weight: number;        // Connection weight
  enabled: boolean;      // Whether connection is active
  innovation: number;    // Innovation number for gene alignment
}

/**
 * NEAT genome - variable topology neural network.
 */
export interface NEATGenome {
  neurons: NeuronGene[];        // All neurons (input, hidden, output)
  connections: ConnectionGene[];  // All connections
  activation: string;           // Activation function ('tanh', 'relu', etc.)
}

/**
 * Innovation counter state - persisted across generations for NEAT runs.
 */
export interface InnovationCounterState {
  nextConnection: number;  // Next connection innovation number
  nextNode: number;        // Next node innovation number
}

// =============================================================================
// Migration Utilities
// =============================================================================

/**
 * Migrate old configs that used useNEAT boolean to neuralMode='neat'.
 * Call this when loading configs from storage or API.
 */
export function migrateConfig(config: Partial<SimulationConfig> & { useNEAT?: boolean }): Partial<SimulationConfig> {
  const migrated = { ...config };
  if ('useNEAT' in migrated && migrated.useNEAT) {
    migrated.neuralMode = 'neat';
  }
  delete (migrated as { useNEAT?: boolean }).useNEAT;
  return migrated;
}
