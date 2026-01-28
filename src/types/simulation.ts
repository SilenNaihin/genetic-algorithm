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
  ground_friction: number;       // 0.3 to 1.0
  time_step: number;             // Physics timestep (1/physics_fps)
  physics_fps: number;           // Physics frames per second (15-120)
  simulation_duration: number;   // Seconds per generation

  // Muscle constraints
  muscle_velocity_cap: number;       // Max muscle length change per second (0.1-20.0)
  muscle_damping_multiplier: number; // Global damping scale (0.1-5.0, higher = more resistance)
  max_extension_ratio: number;       // Max muscle stretch (1.2-5.0, 2.0 = 50%-200% of rest length)

  // Evolution
  population_size: number;       // 100
  cull_percentage: number;       // 0.5 (bottom 50%)
  selection_method: 'truncation' | 'tournament' | 'rank' | 'speciation';  // How survivors are selected
  tournament_size: number;       // For tournament selection: number of contestants per round
  mutation_rate: number;         // Per-gene mutation rate (0.1-0.5)
  mutation_magnitude: number;    // How much values change
  crossover_rate: number;        // Probability of crossover vs mutation for new creatures (0-1)
  elite_count: number;           // Deprecated - survivors determined by cull_percentage
  use_crossover: boolean;        // Whether to use crossover (vs clone-only)

  // Creature constraints
  min_nodes: number;
  max_nodes: number;
  max_muscles: number;
  max_allowed_frequency: number;  // Max muscle frequency before creature is penalized

  // Environment
  pellet_count: number;          // Number of pellets per arena
  arena_size: number;            // Size of simulation arena

  // Fitness function (simple model)
  fitness_pellet_points: number;          // Points per pellet collected (default 20, on top of 80 progress = 100 total)
  fitness_progress_max: number;           // Max points for progress toward pellet (default 80)
  fitness_distance_per_unit: number;       // Points per unit of distance traveled (default 3)
  fitness_distance_traveled_max: number;   // Max points for distance traveled (default 20)
  fitness_regression_penalty: number;     // Max penalty for moving away after 1st pellet collection (default 20)

  // Neural network settings (neuroevolution)
  use_neural_net: boolean;              // Enable neural network control
  neural_mode: 'hybrid' | 'pure' | 'neat';  // How NN output is used (neat = variable topology)
  bias_mode: 'none' | 'node' | 'bias_node';  // Bias implementation: none, per-node attribute, or bias input node
  time_encoding: 'none' | 'cyclic' | 'sin' | 'raw' | 'sin_raw';  // Time encoding (default: none for pure, cyclic for hybrid)
  neural_hidden_size: number;           // Neurons in hidden layer
  neural_activation: ActivationType;   // Activation function
  weight_mutation_rate: number;         // Target/end probability each weight mutates
  weight_mutation_magnitude: number;    // Std dev of weight perturbation
  weight_mutation_decay: 'off' | 'linear' | 'exponential';  // Mutation rate decay mode
  neural_output_bias: number;           // Initial output neuron bias (0 = neutral, inside dead zone)
  fitness_efficiency_penalty: number;   // Penalty per unit of total muscle activation (encourages efficient movement)
  neural_dead_zone: number;             // Dead zone threshold for pure mode (outputs < threshold become 0)
  neural_update_hz: number;             // NN update frequency in Hz (5-60, default 15)
  output_smoothing_alpha: number;       // Exponential smoothing factor (0.05-1.0, 1.0 = no smoothing)

  // Adaptive mutation (escape stagnation)
  use_adaptive_mutation: boolean;       // Auto-boost mutation when fitness stagnates
  stagnation_threshold: number;        // Window size for comparing fitness (default 20)
  adaptive_mutation_boost: number;      // Multiplier for mutation rate during stagnation (e.g., 2.0 = double)
  max_adaptive_boost: number;           // Maximum boost multiplier cap (e.g., 8.0)
  improvement_threshold: number;       // Minimum fitness improvement to count as progress (absolute points)

  // Crossover method for neural weights
  neural_crossover_method: 'interpolation' | 'uniform' | 'sbx';  // How neural weights are combined during crossover
  sbx_eta: number;                     // SBX distribution index (0.5-5.0, lower = more exploration)

  // Fitness sharing (diversity maintenance)
  use_fitness_sharing: boolean;         // Enable fitness sharing to penalize similar creatures
  sharing_radius: number;              // Genome distance threshold for sharing (0.1-2.0)

  // Speciation parameters (used when selection_method='speciation')
  compatibility_threshold: number;     // Genome distance threshold for same species (0.1-3.0)
  min_species_size: number;             // Minimum survivors per species (1-20)

  // NEAT (NeuroEvolution of Augmenting Topologies) - configured when neural_mode === 'neat'
  neat_initial_connectivity: 'full' | 'sparse_inputs' | 'sparse_outputs' | 'none';  // Initial network connectivity
  neat_add_connection_rate: number;      // Probability to add a new connection (0.01-0.2)
  neat_add_node_rate: number;            // Probability to add a new hidden node (0.01-0.1)
  neat_enable_rate: number;             // Probability to re-enable a disabled connection (0.01-0.1)
  neat_disable_rate: number;            // Probability to disable an enabled connection (0.01-0.1)
  neat_excess_coefficient: number;      // Weight for excess genes in compatibility distance (0-10)
  neat_disjoint_coefficient: number;    // Weight for disjoint genes in compatibility distance (0-10)
  neat_weight_coefficient: number;      // Weight for weight differences in compatibility distance (0-10)
  neat_max_hidden_nodes: number;         // Maximum hidden neurons to prevent bloat (1-128)

  // Proprioception (body-sensing inputs)
  use_proprioception: boolean;         // Enable body-sensing inputs (muscle strain, node velocities, ground contact)
  proprioception_inputs: 'strain' | 'velocity' | 'ground' | 'all';  // Which proprioception inputs to include

  // Frame storage mode for replay capability
  frame_storage_mode: 'none' | 'sparse' | 'all';  // none = no replays, sparse = top/bottom only, all = all creatures
  sparse_top_count: number;             // Number of top performers to store frames for (sparse mode)
  sparse_bottom_count: number;          // Number of bottom performers to store frames for (sparse mode)
}

export const DEFAULT_CONFIG: SimulationConfig = {
  gravity: -9.8,
  ground_friction: 0.5,
  time_step: 1 / 30,
  physics_fps: 30,
  simulation_duration: 20,

  // Muscle constraints
  muscle_velocity_cap: 5.0,       // Max muscle length change per second
  muscle_damping_multiplier: 1.0, // Default: no scaling (higher = more 'underwater' feel)
  max_extension_ratio: 2.0,       // Muscles can stretch 50%-200% of rest length

  population_size: 100,
  cull_percentage: 0.5,
  selection_method: 'rank',
  tournament_size: 3,
  mutation_rate: 0.2,
  mutation_magnitude: 0.3,
  crossover_rate: 0.5,
  elite_count: 5,
  use_crossover: true,

  min_nodes: 3,
  max_nodes: 8,
  max_muscles: 15,
  max_allowed_frequency: 3.0,

  pellet_count: 3,
  arena_size: 10,

  // Fitness function defaults
  fitness_pellet_points: 20,    // On top of 80 progress = 100 total per pellet
  fitness_progress_max: 80,
  fitness_distance_per_unit: 3,
  fitness_distance_traveled_max: 20,
  fitness_regression_penalty: 20,

  // Neural network defaults (enabled by default)
  use_neural_net: true,
  neural_mode: 'pure',
  bias_mode: 'node',      // Default: per-node biases (NEAT will auto-switch to 'bias_node')
  time_encoding: 'none',  // Default 'none' for pure mode; 'cyclic' recommended for hybrid
  neural_hidden_size: 8,
  neural_activation: 'tanh',
  weight_mutation_rate: 0.2,
  weight_mutation_magnitude: 0.05,
  weight_mutation_decay: 'linear',
  neural_output_bias: -0.1,        // Slight negative bias so muscles must evolve to activate
  fitness_efficiency_penalty: 0.1, // Subtle penalty for excessive activation
  neural_dead_zone: 0.1,           // Outputs with absolute value < 0.1 become 0 in pure mode
  neural_update_hz: 10,            // Update NN 10 times per second (smoother movement)
  output_smoothing_alpha: 0.15,    // Aggressive smoothing (0.15 = 15% new + 85% old)

  // Adaptive mutation defaults
  use_adaptive_mutation: false,    // Off by default - enable for long runs
  stagnation_threshold: 20,       // 20-generation window for comparison
  adaptive_mutation_boost: 2.0,    // Double mutation rate during stagnation
  max_adaptive_boost: 8.0,         // Cap at 8x mutation rate
  improvement_threshold: 5.0,     // Need 5+ fitness points improvement to count

  // Crossover method defaults
  neural_crossover_method: 'sbx',  // SBX produces smoother offspring distribution
  sbx_eta: 2.0,                   // Balanced exploration/exploitation

  // Fitness sharing defaults
  use_fitness_sharing: false,      // Off by default - enable to maintain diversity
  sharing_radius: 0.5,            // Moderate sharing radius

  // Speciation parameters (used when selection_method='speciation')
  compatibility_threshold: 1.0,   // Genome distance threshold for same species
  min_species_size: 2,             // Minimum survivors per species

  // NEAT defaults (used when neural_mode === 'neat')
  neat_initial_connectivity: 'full',  // Start with all inputs connected to all outputs
  neat_add_connection_rate: 0.05,   // 5% chance to add connection per genome
  neat_add_node_rate: 0.03,         // 3% chance to add node per genome
  neat_enable_rate: 0.02,          // 2% chance to re-enable disabled connection
  neat_disable_rate: 0.01,         // 1% chance to disable enabled connection
  neat_excess_coefficient: 1.0,    // Standard weight for excess genes
  neat_disjoint_coefficient: 1.0,  // Standard weight for disjoint genes
  neat_weight_coefficient: 0.4,    // Lower weight for weight differences (per NEAT paper)
  neat_max_hidden_nodes: 16,        // Reasonable limit for complexity

  // Proprioception defaults
  use_proprioception: false,      // Off by default - experimental feature
  proprioception_inputs: 'all',   // Include all proprioception inputs when enabled

  // Frame storage mode
  frame_storage_mode: 'all',       // Store frames for all creatures by default (enables replays)
  sparse_top_count: 10,            // Store frames for top 10 performers in sparse mode
  sparse_bottom_count: 5,          // Store frames for bottom 5 performers in sparse mode
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
  id: number;                                    // Unique neuron ID
  type: 'input' | 'hidden' | 'output' | 'bias';  // Neuron type (bias = always 1.0)
  bias: number;                                  // Bias value (0 for input/bias neurons)
  innovation?: number;                           // Innovation number (only for hidden neurons)
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
 * Migrate old configs that used useNEAT boolean to neural_mode='neat'.
 * Call this when loading configs from storage or API.
 */
export function migrateConfig(config: Partial<SimulationConfig> & { useNEAT?: boolean }): Partial<SimulationConfig> {
  const migrated = { ...config };
  if ('useNEAT' in migrated && migrated.useNEAT) {
    migrated.neural_mode = 'neat';
  }
  delete (migrated as { useNEAT?: boolean }).useNEAT;
  return migrated;
}
