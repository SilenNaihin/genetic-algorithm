/**
 * API Client for Python Backend
 *
 * Typed fetch wrapper for all backend endpoints.
 * Handles JSON serialization, error handling, and type conversion.
 */

import type { SimulationConfig } from '../types/simulation';
import type { CreatureGenome } from '../types/genome';

// Base URL for backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// -------------------------------------------------------------------
// API Types (matching backend Pydantic schemas)
// -------------------------------------------------------------------

/** Backend uses snake_case, we convert to camelCase */
export interface ApiSimulationConfig {
  gravity: number;
  ground_friction: number;
  time_step: number;
  simulation_duration: number;
  population_size: number;
  cull_percentage: number;
  mutation_rate: number;
  mutation_magnitude: number;
  crossover_rate: number;
  elite_count: number;
  use_mutation: boolean;
  use_crossover: boolean;
  min_nodes: number;
  max_nodes: number;
  max_muscles: number;
  max_allowed_frequency: number;
  pellet_count: number;
  arena_size: number;
  fitness_pellet_points: number;
  fitness_progress_max: number;
  fitness_distance_per_unit: number;
  fitness_distance_traveled_max: number;
  fitness_regression_penalty: number;
  use_neural_net: boolean;
  neural_mode: 'hybrid' | 'pure';
  time_encoding: 'none' | 'cyclic' | 'sin' | 'raw' | 'sin_raw';
  neural_hidden_size: number;
  neural_activation: string;
  weight_mutation_rate: number;
  weight_mutation_magnitude: number;
  weight_mutation_decay: 'off' | 'linear' | 'exponential';
  neural_output_bias: number;
  fitness_efficiency_penalty: number;
  neural_dead_zone: number;
  frame_storage_mode: 'none' | 'all' | 'sparse';
  frame_rate: number;
  sparse_top_count: number;
  sparse_bottom_count: number;
  use_proprioception: boolean;
  proprioception_inputs: 'strain' | 'velocity' | 'ground' | 'all';
}


export interface ApiRun {
  id: string;
  name: string;
  config: Record<string, unknown>;
  generation_count: number;
  current_generation: number;
  best_fitness: number;
  best_creature_id: string | null;
  best_creature_generation: number | null;
  longest_survivor_id: string | null;
  longest_survivor_streak: number;
  longest_survivor_generation: number | null;
  status: 'idle' | 'running' | 'paused' | 'complete';
  created_at: string;
  updated_at: string;
}

export interface ApiGeneration {
  run_id: string;
  generation: number;
  best_fitness: number;
  avg_fitness: number;
  worst_fitness: number;
  median_fitness: number;
  creature_types: Record<string, number>;
  simulation_time_ms: number;
}

export interface ApiCreature {
  id: string;
  run_id: string;
  generation: number;
  genome: Record<string, unknown>;
  fitness: number;
  pellets_collected: number;
  disqualified: boolean;
  disqualified_reason: string | null;
  survival_streak: number;
  is_elite: boolean;
  parent_ids: string[];
}

/** Creature data from evolution step response */
export interface ApiEvolutionCreature {
  id: string;
  genome: Record<string, unknown>;
  fitness: number;
  pellets_collected: number;
  disqualified: boolean;
  disqualified_reason: string | null;
  is_survivor: boolean;
  parent_ids: string[];
  has_frames: boolean;
  survival_streak: number;
}

/** Evolution step response */
export interface ApiEvolutionStepResponse {
  generation: number;
  best_fitness: number;
  avg_fitness: number;
  worst_fitness: number;
  median_fitness: number;
  simulation_time_ms: number;
  creature_count: number;
  creatures: ApiEvolutionCreature[];
}


// -------------------------------------------------------------------
// Conversion helpers
// -------------------------------------------------------------------

/** Convert frontend SimulationConfig (camelCase) to API format (snake_case) */
export function toApiConfig(config: SimulationConfig): ApiSimulationConfig {
  return {
    gravity: config.gravity,
    ground_friction: config.groundFriction,
    time_step: config.timeStep,
    simulation_duration: config.simulationDuration,
    population_size: config.populationSize,
    cull_percentage: config.cullPercentage,
    mutation_rate: config.mutationRate,
    mutation_magnitude: config.mutationMagnitude,
    crossover_rate: config.crossoverRate,
    elite_count: config.eliteCount,
    use_mutation: config.useMutation,
    use_crossover: config.useCrossover,
    min_nodes: config.minNodes,
    max_nodes: config.maxNodes,
    max_muscles: config.maxMuscles,
    max_allowed_frequency: config.maxAllowedFrequency,
    pellet_count: config.pelletCount,
    arena_size: config.arenaSize,
    fitness_pellet_points: config.fitnessPelletPoints,
    fitness_progress_max: config.fitnessProgressMax,
    fitness_distance_per_unit: config.fitnessDistancePerUnit,
    fitness_distance_traveled_max: config.fitnessDistanceTraveledMax,
    fitness_regression_penalty: config.fitnessRegressionPenalty,
    use_neural_net: config.useNeuralNet,
    neural_mode: config.neuralMode,
    time_encoding: config.timeEncoding,
    neural_hidden_size: config.neuralHiddenSize,
    neural_activation: config.neuralActivation,
    weight_mutation_rate: config.weightMutationRate,
    weight_mutation_magnitude: config.weightMutationMagnitude,
    weight_mutation_decay: config.weightMutationDecay,
    neural_output_bias: config.neuralOutputBias,
    fitness_efficiency_penalty: config.fitnessEfficiencyPenalty,
    neural_dead_zone: config.neuralDeadZone,
    frame_storage_mode: config.frameStorageMode,
    frame_rate: 15,
    sparse_top_count: config.sparseTopCount,
    sparse_bottom_count: config.sparseBottomCount,
    use_proprioception: config.useProprioception ?? false,
    proprioception_inputs: config.proprioceptionInputs ?? 'all',
  };
}

/** Convert API SimulationConfig (snake_case) to frontend format (camelCase) */
export function fromApiConfig(api: ApiSimulationConfig): Partial<SimulationConfig> {
  return {
    gravity: api.gravity,
    groundFriction: api.ground_friction,
    timeStep: api.time_step,
    simulationDuration: api.simulation_duration,
    populationSize: api.population_size,
    cullPercentage: api.cull_percentage,
    mutationRate: api.mutation_rate,
    mutationMagnitude: api.mutation_magnitude,
    crossoverRate: api.crossover_rate,
    eliteCount: api.elite_count,
    useMutation: api.use_mutation,
    useCrossover: api.use_crossover,
    minNodes: api.min_nodes,
    maxNodes: api.max_nodes,
    maxMuscles: api.max_muscles,
    maxAllowedFrequency: api.max_allowed_frequency,
    pelletCount: api.pellet_count,
    arenaSize: api.arena_size,
    fitnessPelletPoints: api.fitness_pellet_points,
    fitnessProgressMax: api.fitness_progress_max,
    fitnessDistancePerUnit: api.fitness_distance_per_unit,
    fitnessDistanceTraveledMax: api.fitness_distance_traveled_max,
    fitnessRegressionPenalty: api.fitness_regression_penalty,
    useNeuralNet: api.use_neural_net,
    neuralMode: api.neural_mode,
    timeEncoding: api.time_encoding,
    neuralHiddenSize: api.neural_hidden_size,
    neuralActivation: api.neural_activation as SimulationConfig['neuralActivation'],
    weightMutationRate: api.weight_mutation_rate,
    weightMutationMagnitude: api.weight_mutation_magnitude,
    weightMutationDecay: api.weight_mutation_decay,
    neuralOutputBias: api.neural_output_bias,
    fitnessEfficiencyPenalty: api.fitness_efficiency_penalty,
    neuralDeadZone: api.neural_dead_zone,
    frameStorageMode: api.frame_storage_mode,
    sparseTopCount: api.sparse_top_count,
    sparseBottomCount: api.sparse_bottom_count,
    useProprioception: api.use_proprioception ?? false,
    proprioceptionInputs: api.proprioception_inputs ?? 'all',
  };
}

/** Convert genome to API format (ensure snake_case for nested objects) */
// Helper to safely convert numbers (NaN/Infinity become default)
const safeNum = (v: number | undefined, defaultVal: number = 0): number => {
  if (v === undefined || v === null) return defaultVal;
  return Number.isFinite(v) ? v : defaultVal;
};

// Helper to safely convert Vector3 (NaN/Infinity become 0)
const safeVec3 = (v: { x: number; y: number; z: number } | undefined | null, defaultVal = { x: 0, y: 0, z: 0 }) => {
  if (!v) return defaultVal;
  return {
    x: safeNum(v.x),
    y: safeNum(v.y),
    z: safeNum(v.z),
  };
};

export function toApiGenome(genome: CreatureGenome): Record<string, unknown> {
  // Convert NeuralGenomeData (flat weights) to API format (separate matrices)
  let neuralGenome = null;
  if (genome.neuralGenome) {
    const { topology, weights } = genome.neuralGenome;
    const { inputSize, hiddenSize, outputSize } = topology;

    // Reconstruct separate matrices from flat weights (with NaN guards)
    const ihSize = inputSize * hiddenSize;
    const hoSize = hiddenSize * outputSize;

    neuralGenome = {
      input_size: inputSize,
      hidden_size: hiddenSize,
      output_size: outputSize,
      weights_ih: weights.slice(0, ihSize).map(w => safeNum(w)),
      biases_h: weights.slice(ihSize, ihSize + hiddenSize).map(w => safeNum(w)),
      weights_ho: weights.slice(ihSize + hiddenSize, ihSize + hiddenSize + hoSize).map(w => safeNum(w)),
      biases_o: weights.slice(ihSize + hiddenSize + hoSize).map(w => safeNum(w)),
    };
  }

  return {
    id: genome.id,
    generation: safeNum(genome.generation, 0),
    survival_streak: safeNum(genome.survivalStreak, 0),
    parent_ids: genome.parentIds,
    nodes: genome.nodes.map(node => ({
      id: node.id,
      position: safeVec3(node.position),
      size: safeNum(node.size, 0.5),
      friction: safeNum(node.friction, 0.5),
    })),
    muscles: genome.muscles.map(muscle => ({
      id: muscle.id,
      node_a: muscle.nodeA,
      node_b: muscle.nodeB,
      rest_length: safeNum(muscle.restLength, 1.0),
      stiffness: safeNum(muscle.stiffness, 100.0),
      damping: safeNum(muscle.damping, 0.5),
      frequency: safeNum(muscle.frequency, 1.0),
      amplitude: safeNum(muscle.amplitude, 0.3),
      phase: safeNum(muscle.phase, 0.0),
      direction_bias: safeVec3(muscle.directionBias, { x: 1, y: 0, z: 0 }),
      bias_strength: safeNum(muscle.biasStrength, 0.0),
      velocity_bias: safeVec3(muscle.velocityBias, { x: 0, y: 0, z: 0 }),
      velocity_strength: safeNum(muscle.velocityStrength, 0.0),
      distance_bias: safeNum(muscle.distanceBias, 0.0),
      distance_strength: safeNum(muscle.distanceStrength, 0.0),
    })),
    global_frequency_multiplier: safeNum(genome.globalFrequencyMultiplier, 1.0),
    controller_type: genome.controllerType,
    neural_genome: neuralGenome,
    color: genome.color,
    ancestry_chain: genome.ancestryChain || [],
  };
}

/** Convert API genome to frontend format */
export function fromApiGenome(api: Record<string, unknown>): CreatureGenome {
  const nodes = (api.nodes as Array<Record<string, unknown>>).map(node => ({
    id: node.id as string,
    position: node.position as { x: number; y: number; z: number },
    size: node.size as number,
    friction: node.friction as number,
  }));

  const muscles = (api.muscles as Array<Record<string, unknown>>).map(muscle => ({
    id: muscle.id as string,
    nodeA: (muscle.node_a ?? muscle.nodeA) as string,
    nodeB: (muscle.node_b ?? muscle.nodeB) as string,
    restLength: (muscle.rest_length ?? muscle.restLength) as number,
    stiffness: muscle.stiffness as number,
    damping: muscle.damping as number,
    frequency: muscle.frequency as number,
    amplitude: muscle.amplitude as number,
    phase: muscle.phase as number,
    directionBias: (muscle.direction_bias ?? muscle.directionBias ?? { x: 1, y: 0, z: 0 }) as { x: number; y: number; z: number },
    biasStrength: (muscle.bias_strength ?? muscle.biasStrength ?? 0) as number,
    velocityBias: (muscle.velocity_bias ?? muscle.velocityBias ?? { x: 0, y: 0, z: 0 }) as { x: number; y: number; z: number },
    velocityStrength: (muscle.velocity_strength ?? muscle.velocityStrength ?? 0) as number,
    distanceBias: (muscle.distance_bias ?? muscle.distanceBias ?? 0) as number,
    distanceStrength: (muscle.distance_strength ?? muscle.distanceStrength ?? 0) as number,
  }));

  // Convert API neural genome (separate matrices) to frontend format (flat weights)
  const neuralGenomeData = api.neural_genome ?? api.neuralGenome;
  let neuralGenome = undefined;
  if (neuralGenomeData) {
    const ng = neuralGenomeData as Record<string, unknown>;
    const inputSize = ng.input_size as number;
    const hiddenSize = ng.hidden_size as number;
    const outputSize = ng.output_size as number;
    const weightsIH = ng.weights_ih as number[];
    const biasesH = ng.biases_h as number[];
    const weightsHO = ng.weights_ho as number[];
    const biasesO = ng.biases_o as number[];

    // Flatten into single array: weights_ih, biases_h, weights_ho, biases_o
    const weights = [...weightsIH, ...biasesH, ...weightsHO, ...biasesO];

    neuralGenome = {
      weights,
      topology: { inputSize, hiddenSize, outputSize },
      activation: 'tanh' as const,  // Default activation
    };
  }

  // Convert ancestry chain (supports both camelCase and snake_case)
  const rawAncestry = (api.ancestry_chain ?? api.ancestryChain ?? []) as Array<Record<string, unknown>>;
  const ancestryChain = rawAncestry.map(a => ({
    generation: a.generation as number,
    fitness: a.fitness as number,
    nodeCount: (a.nodeCount ?? a.node_count) as number,
    muscleCount: (a.muscleCount ?? a.muscle_count) as number,
    color: (a.color ?? { h: 0.5, s: 0.7, l: 0.5 }) as { h: number; s: number; l: number },
    reproductionType: (a.reproductionType ?? a.reproduction_type) as 'crossover' | 'mutation' | undefined,
  }));

  return {
    id: api.id as string,
    generation: (api.generation ?? 0) as number,
    survivalStreak: (api.survival_streak ?? api.survivalStreak ?? 0) as number,
    parentIds: (api.parent_ids ?? api.parentIds ?? []) as string[],
    nodes,
    muscles,
    globalFrequencyMultiplier: (api.global_frequency_multiplier ?? api.globalFrequencyMultiplier ?? 1.0) as number,
    controllerType: (api.controller_type ?? api.controllerType ?? 'oscillator') as 'oscillator' | 'neural',
    neuralGenome,
    color: (api.color ?? { h: 0.5, s: 0.7, l: 0.5 }) as { h: number; s: number; l: number },
    ancestryChain,
  };
}

// -------------------------------------------------------------------
// API Client
// -------------------------------------------------------------------

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }
    // Log the full error details for debugging
    console.error('[API] Error response:', { status: response.status, body });
    throw new ApiError(
      `API error: ${response.status} ${response.statusText}`,
      response.status,
      body
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// -------------------------------------------------------------------
// Runs API
// -------------------------------------------------------------------

export async function listRuns(): Promise<ApiRun[]> {
  return fetchJson<ApiRun[]>('/api/runs');
}

export async function createRun(
  name: string,
  config: SimulationConfig
): Promise<ApiRun> {
  return fetchJson<ApiRun>('/api/runs', {
    method: 'POST',
    body: JSON.stringify({
      name,
      config: toApiConfig(config),
    }),
  });
}

export async function getRun(runId: string): Promise<ApiRun> {
  return fetchJson<ApiRun>(`/api/runs/${runId}`);
}

export async function updateRun(
  runId: string,
  updates: { name?: string; status?: string }
): Promise<ApiRun> {
  return fetchJson<ApiRun>(`/api/runs/${runId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteRun(runId: string): Promise<void> {
  await fetchJson<void>(`/api/runs/${runId}`, { method: 'DELETE' });
}

export async function forkRun(
  runId: string,
  upToGeneration: number,
  name: string
): Promise<ApiRun> {
  return fetchJson<ApiRun>(`/api/runs/${runId}/fork`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      up_to_generation: upToGeneration,
    }),
  });
}

// -------------------------------------------------------------------
// Evolution API
// -------------------------------------------------------------------

/**
 * Run a single evolution step (generation).
 * Backend handles: genetics + simulation + storage.
 * Returns stats + creature data for immediate display.
 */
export async function evolutionStep(runId: string): Promise<ApiEvolutionStepResponse> {
  return fetchJson<ApiEvolutionStepResponse>(`/api/evolution/${runId}/step`, {
    method: 'POST',
  });
}

// -------------------------------------------------------------------
// Generations API
// -------------------------------------------------------------------

export async function listGenerations(runId: string): Promise<ApiGeneration[]> {
  return fetchJson<ApiGeneration[]>(`/api/runs/${runId}/generations`);
}

export async function getGeneration(
  runId: string,
  generation: number
): Promise<{ generation: ApiGeneration; creatures: ApiCreature[] }> {
  // Fetch generation metadata and creatures in parallel
  const [genData, creatures] = await Promise.all([
    fetchJson<ApiGeneration>(`/api/runs/${runId}/generations/${generation}`),
    fetchJson<ApiCreature[]>(`/api/runs/${runId}/generations/${generation}/creatures`),
  ]);

  return { generation: genData, creatures };
}

// -------------------------------------------------------------------
// Creatures API
// -------------------------------------------------------------------

export async function getCreature(creatureId: string, generation?: number): Promise<ApiCreature> {
  const url = generation !== undefined
    ? `/api/creatures/${creatureId}?generation=${generation}`
    : `/api/creatures/${creatureId}`;
  return fetchJson<ApiCreature>(url);
}

/**
 * Get the best creature for a run (highest fitness ever achieved).
 * Returns the creature with its best performance data.
 */
export async function getBestCreatureForRun(runId: string): Promise<ApiCreature> {
  return fetchJson<ApiCreature>(`/api/creatures/run/${runId}/best`);
}

/**
 * Get the longest surviving creature for a run.
 * Returns the creature with its best performance data (not death generation).
 */
export async function getLongestSurvivorForRun(runId: string): Promise<ApiCreature> {
  return fetchJson<ApiCreature>(`/api/creatures/run/${runId}/longest-survivor`);
}

export async function getCreatureFrames(
  creatureId: string,
  generation?: number
): Promise<{
  frames_data: number[][];
  frame_count: number;
  frame_rate: number;
  pellet_frames: Array<{
    position: { x: number; y: number; z: number };
    collected_at_frame: number | null;
    spawned_at_frame: number;
    initial_distance: number;
  }> | null;
  fitness_over_time: number[] | null;
  activations_per_frame: Array<{
    inputs: number[];
    hidden: number[];
    outputs: number[];
    outputs_raw?: number[];  // Pre-dead-zone values (pure mode only)
  }> | null;
  generation: number;
}> {
  const url = generation !== undefined
    ? `/api/creatures/${creatureId}/frames?generation=${generation}`
    : `/api/creatures/${creatureId}/frames`;
  return fetchJson(url);
}

export interface AncestorInfo {
  id: string;
  generation: number;
  fitness: number;
  pellets_collected: number;
  node_count: number;
  muscle_count: number;
  color: { h: number; s: number; l: number };
  parent_ids: string[];
}

export async function getCreatureAncestors(
  creatureId: string,
  maxDepth: number = 50
): Promise<{ ancestors: AncestorInfo[] }> {
  return fetchJson(`/api/creatures/${creatureId}/ancestors?max_depth=${maxDepth}`);
}

// -------------------------------------------------------------------
// Fitness History API
// -------------------------------------------------------------------

export interface ApiFitnessHistoryEntry {
  generation: number;
  best: number;
  avg: number;
  worst: number;
  median: number;
}

export async function getFitnessHistory(runId: string): Promise<ApiFitnessHistoryEntry[]> {
  return fetchJson<ApiFitnessHistoryEntry[]>(`/api/runs/${runId}/generations/fitness-history`);
}

export interface ApiCreatureTypesEntry {
  generation: number;
  types: Record<string, number>;
}

export async function getCreatureTypesHistory(runId: string): Promise<ApiCreatureTypesEntry[]> {
  return fetchJson<ApiCreatureTypesEntry[]>(`/api/runs/${runId}/generations/creature-types-history`);
}

// -------------------------------------------------------------------
// Health check
// -------------------------------------------------------------------

export async function healthCheck(): Promise<boolean> {
  try {
    await fetchJson('/api/health');
    return true;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------------
// Connection state
// -------------------------------------------------------------------

let _isConnected = false;
let _connectionCheckPromise: Promise<boolean> | null = null;

export async function checkConnection(): Promise<boolean> {
  if (_connectionCheckPromise) {
    return _connectionCheckPromise;
  }

  _connectionCheckPromise = healthCheck().then(result => {
    _isConnected = result;
    _connectionCheckPromise = null;
    return result;
  });

  return _connectionCheckPromise;
}

export function isConnected(): boolean {
  return _isConnected;
}
