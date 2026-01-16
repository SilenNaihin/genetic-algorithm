import type { CreatureGenome, Vector3 } from './genome';
import type { ActivationType } from '../neural/activations';

export interface FitnessWeights {
  baseFitness: number;           // Starting fitness value
  pelletWeight: number;          // Points per pellet collected
  progressWeight: number;        // Points for progress toward pellet (0-100 per pellet)
  proximityWeight: number;       // Multiplier for proximity bonus (closer to pellet)
  proximityMaxDistance: number;  // Distance at which proximity bonus starts
  movementWeight: number;        // Points for movement (capped)
  movementCap: number;           // Maximum movement bonus
  distanceWeight: number;        // Points per unit of net displacement
  distanceCap: number;           // Maximum distance bonus
}

export const DEFAULT_FITNESS_WEIGHTS: FitnessWeights = {
  baseFitness: 10,
  pelletWeight: 100,
  progressWeight: 1,           // 0-100 points per pellet based on progress toward it
  proximityWeight: 2.5,
  proximityMaxDistance: 20,
  movementWeight: 1,
  movementCap: 5,
  distanceWeight: 0,
  distanceCap: 50
};

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
  timeStep: number;             // Physics timestep (1/60)
  simulationDuration: number;   // Seconds per generation

  // Evolution
  populationSize: number;       // 100
  cullPercentage: number;       // 0.5 (bottom 50%)
  mutationRate: number;         // 0.1-0.5
  mutationMagnitude: number;    // How much values change
  crossoverRate: number;        // Probability of crossover vs cloning
  eliteCount: number;           // Number of top performers to keep unchanged
  useMutation: boolean;         // Whether to apply mutation during evolution
  useCrossover: boolean;        // Whether to use crossover (vs cloning only)

  // Creature constraints
  minNodes: number;
  maxNodes: number;
  maxMuscles: number;
  maxAllowedFrequency: number;  // Max muscle frequency before creature is penalized

  // Environment
  pelletCount: number;          // Number of pellets per arena
  arenaSize: number;            // Size of simulation arena

  // Fitness function
  fitnessWeights: FitnessWeights;

  // Neural network settings (neuroevolution)
  useNeuralNet: boolean;              // Enable neural network control
  neuralMode: 'hybrid' | 'pure';      // How NN output is used
  neuralHiddenSize: number;           // Neurons in hidden layer
  neuralActivation: ActivationType;   // Activation function
  weightMutationRate: number;         // Probability each weight mutates
  weightMutationMagnitude: number;    // Std dev of weight perturbation
}

export const DEFAULT_CONFIG: SimulationConfig = {
  gravity: -9.8,
  groundFriction: 0.5,
  timeStep: 1 / 60,
  simulationDuration: 10,

  populationSize: 100,
  cullPercentage: 0.5,
  mutationRate: 0.1,
  mutationMagnitude: 0.3,
  crossoverRate: 0.3,
  eliteCount: 5,
  useMutation: true,
  useCrossover: true,

  minNodes: 3,
  maxNodes: 8,
  maxMuscles: 15,
  maxAllowedFrequency: 3.0,

  pelletCount: 3,
  arenaSize: 10,

  fitnessWeights: DEFAULT_FITNESS_WEIGHTS,

  // Neural network defaults (disabled by default)
  useNeuralNet: false,
  neuralMode: 'hybrid',
  neuralHiddenSize: 8,
  neuralActivation: 'tanh',
  weightMutationRate: 0.1,
  weightMutationMagnitude: 0.3
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
