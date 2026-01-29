/**
 * API Client for Python Backend
 *
 * Typed fetch wrapper for all backend endpoints.
 * Handles JSON serialization and error handling.
 * Both frontend and backend use snake_case field names.
 */

import type { SimulationConfig, NEATGenome } from '../types/simulation';
import type { CreatureGenome } from '../types/genome';

// Base URL for backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// -------------------------------------------------------------------
// API Types (matching backend Pydantic schemas)
// -------------------------------------------------------------------

/** API config - extends SimulationConfig with backend-specific fields */
export interface ApiSimulationConfig extends SimulationConfig {
  frame_rate?: number;  // Backend-only: frame capture rate for replays
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
  birth_generation: number | null;
  death_generation: number | null;
  avg_fitness: number | null;  // Average fitness across all generations survived
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
  culled_ids: string[];  // IDs of creatures from previous gen that died
}


// -------------------------------------------------------------------
// Conversion helpers
// -------------------------------------------------------------------

/** Convert frontend SimulationConfig to API format (identity - both use snake_case) */
export function toApiConfig(config: SimulationConfig): ApiSimulationConfig {
  return {
    // Physics
    gravity: config.gravity,
    ground_friction: config.ground_friction,
    time_step: config.time_step,
    physics_fps: config.physics_fps,
    simulation_duration: config.simulation_duration,

    // Muscle constraints
    muscle_velocity_cap: config.muscle_velocity_cap ?? 5.0,
    muscle_damping_multiplier: config.muscle_damping_multiplier ?? 1.0,
    max_extension_ratio: config.max_extension_ratio ?? 2.0,

    // Evolution
    population_size: config.population_size,
    cull_percentage: config.cull_percentage,
    selection_method: config.selection_method,
    tournament_size: config.tournament_size ?? 3,
    mutation_rate: config.mutation_rate,
    mutation_magnitude: config.mutation_magnitude,
    crossover_rate: config.crossover_rate,
    elite_count: config.elite_count,
    use_crossover: config.use_crossover,

    // Creature constraints
    min_nodes: config.min_nodes,
    max_nodes: config.max_nodes,
    max_muscles: config.max_muscles,
    max_allowed_frequency: config.max_allowed_frequency,

    // Environment
    pellet_count: config.pellet_count,
    arena_size: config.arena_size,

    // Fitness
    fitness_pellet_points: config.fitness_pellet_points,
    fitness_progress_max: config.fitness_progress_max,
    fitness_distance_per_unit: config.fitness_distance_per_unit,
    fitness_distance_traveled_max: config.fitness_distance_traveled_max,
    fitness_regression_penalty: config.fitness_regression_penalty,

    // Neural network
    use_neural_net: config.use_neural_net,
    neural_mode: config.neural_mode,
    bias_mode: config.bias_mode,
    time_encoding: config.time_encoding,
    neural_hidden_size: config.neural_hidden_size,
    neural_activation: config.neural_activation,
    weight_mutation_rate: config.weight_mutation_rate,
    weight_mutation_magnitude: config.weight_mutation_magnitude,
    weight_mutation_decay: config.weight_mutation_decay,
    neural_output_bias: config.neural_output_bias,
    fitness_efficiency_penalty: config.fitness_efficiency_penalty,
    neural_dead_zone: config.neural_dead_zone,
    neural_update_hz: config.neural_update_hz ?? 10,
    output_smoothing_alpha: config.output_smoothing_alpha ?? 0.15,

    // Adaptive mutation
    use_adaptive_mutation: config.use_adaptive_mutation ?? false,
    stagnation_threshold: config.stagnation_threshold ?? 20,
    adaptive_mutation_boost: config.adaptive_mutation_boost ?? 2.0,
    max_adaptive_boost: config.max_adaptive_boost ?? 8.0,
    improvement_threshold: config.improvement_threshold ?? 5.0,

    // Crossover method
    neural_crossover_method: config.neural_crossover_method ?? 'sbx',
    sbx_eta: config.sbx_eta ?? 2.0,

    // Fitness sharing
    use_fitness_sharing: config.use_fitness_sharing ?? false,
    sharing_radius: config.sharing_radius ?? 0.5,

    // Speciation
    compatibility_threshold: config.compatibility_threshold ?? 1.0,
    min_species_size: config.min_species_size ?? 2,

    // NEAT settings
    neat_initial_connectivity: config.neat_initial_connectivity ?? 'full',
    neat_add_connection_rate: config.neat_add_connection_rate,
    neat_add_node_rate: config.neat_add_node_rate,
    neat_enable_rate: config.neat_enable_rate,
    neat_disable_rate: config.neat_disable_rate,
    neat_excess_coefficient: config.neat_excess_coefficient,
    neat_disjoint_coefficient: config.neat_disjoint_coefficient,
    neat_weight_coefficient: config.neat_weight_coefficient,
    neat_max_hidden_nodes: config.neat_max_hidden_nodes,

    // Proprioception
    use_proprioception: config.use_proprioception ?? false,
    proprioception_inputs: config.proprioception_inputs ?? 'all',

    // Frame storage
    frame_storage_mode: config.frame_storage_mode,
    frame_rate: 15,
    sparse_top_count: config.sparse_top_count,
    sparse_bottom_count: config.sparse_bottom_count,
  };
}

/** Convert API SimulationConfig to frontend format (identity - both use snake_case) */
export function fromApiConfig(api: ApiSimulationConfig): Partial<SimulationConfig> {
  return {
    // Physics
    gravity: api.gravity,
    ground_friction: api.ground_friction,
    time_step: api.time_step,
    physics_fps: api.physics_fps,
    simulation_duration: api.simulation_duration,

    // Muscle constraints
    muscle_velocity_cap: api.muscle_velocity_cap ?? 5.0,
    muscle_damping_multiplier: api.muscle_damping_multiplier ?? 1.0,
    max_extension_ratio: api.max_extension_ratio ?? 2.0,

    // Evolution
    population_size: api.population_size,
    cull_percentage: api.cull_percentage,
    selection_method: api.selection_method ?? 'rank',
    tournament_size: api.tournament_size ?? 3,
    mutation_rate: api.mutation_rate,
    mutation_magnitude: api.mutation_magnitude,
    crossover_rate: api.crossover_rate,
    elite_count: api.elite_count,
    use_crossover: api.use_crossover,

    // Creature constraints
    min_nodes: api.min_nodes,
    max_nodes: api.max_nodes,
    max_muscles: api.max_muscles,
    max_allowed_frequency: api.max_allowed_frequency,

    // Environment
    pellet_count: api.pellet_count,
    arena_size: api.arena_size,

    // Fitness
    fitness_pellet_points: api.fitness_pellet_points,
    fitness_progress_max: api.fitness_progress_max,
    fitness_distance_per_unit: api.fitness_distance_per_unit,
    fitness_distance_traveled_max: api.fitness_distance_traveled_max,
    fitness_regression_penalty: api.fitness_regression_penalty,

    // Neural network
    use_neural_net: api.use_neural_net,
    neural_mode: api.neural_mode,
    bias_mode: api.bias_mode ?? 'node',
    time_encoding: api.time_encoding,
    neural_hidden_size: api.neural_hidden_size,
    neural_activation: api.neural_activation as SimulationConfig['neural_activation'],
    weight_mutation_rate: api.weight_mutation_rate,
    weight_mutation_magnitude: api.weight_mutation_magnitude,
    weight_mutation_decay: api.weight_mutation_decay,
    neural_output_bias: api.neural_output_bias,
    fitness_efficiency_penalty: api.fitness_efficiency_penalty,
    neural_dead_zone: api.neural_dead_zone,
    neural_update_hz: api.neural_update_hz ?? 10,
    output_smoothing_alpha: api.output_smoothing_alpha ?? 0.15,

    // Adaptive mutation
    use_adaptive_mutation: api.use_adaptive_mutation ?? false,
    stagnation_threshold: api.stagnation_threshold ?? 20,
    adaptive_mutation_boost: api.adaptive_mutation_boost ?? 2.0,
    max_adaptive_boost: api.max_adaptive_boost ?? 8.0,
    improvement_threshold: api.improvement_threshold ?? 5.0,

    // Crossover method
    neural_crossover_method: api.neural_crossover_method ?? 'sbx',
    sbx_eta: api.sbx_eta ?? 2.0,

    // Fitness sharing
    use_fitness_sharing: api.use_fitness_sharing ?? false,
    sharing_radius: api.sharing_radius ?? 0.5,

    // Speciation
    compatibility_threshold: api.compatibility_threshold ?? 1.0,
    min_species_size: api.min_species_size ?? 2,

    // NEAT settings
    neat_initial_connectivity: api.neat_initial_connectivity ?? 'full',
    neat_add_connection_rate: api.neat_add_connection_rate ?? 0.5,
    neat_add_node_rate: api.neat_add_node_rate ?? 0.2,
    neat_enable_rate: api.neat_enable_rate ?? 0.02,
    neat_disable_rate: api.neat_disable_rate ?? 0.01,
    neat_excess_coefficient: api.neat_excess_coefficient ?? 1.0,
    neat_disjoint_coefficient: api.neat_disjoint_coefficient ?? 1.0,
    neat_weight_coefficient: api.neat_weight_coefficient ?? 0.4,
    neat_max_hidden_nodes: api.neat_max_hidden_nodes ?? 16,

    // Proprioception
    use_proprioception: api.use_proprioception ?? false,
    proprioception_inputs: api.proprioception_inputs ?? 'all',

    // Frame storage
    frame_storage_mode: api.frame_storage_mode,
    sparse_top_count: api.sparse_top_count,
    sparse_bottom_count: api.sparse_bottom_count,
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

  // Convert NEATGenome to API format (snake_case)
  let neatGenome = null;
  if (genome.neatGenome) {
    neatGenome = {
      neurons: genome.neatGenome.neurons.map(n => ({
        id: n.id,
        type: n.type,
        bias: safeNum(n.bias, 0),
        innovation: n.innovation ?? null,
      })),
      connections: genome.neatGenome.connections.map(c => ({
        from_node: c.fromNode,
        to_node: c.toNode,
        weight: safeNum(c.weight, 0),
        enabled: c.enabled,
        innovation: c.innovation,
      })),
      activation: genome.neatGenome.activation,
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
    neat_genome: neatGenome,
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

  // Convert NEAT genome from API format
  const neatGenomeData = api.neat_genome ?? api.neatGenome;
  let neatGenome: NEATGenome | undefined = undefined;
  if (neatGenomeData) {
    const ng = neatGenomeData as Record<string, unknown>;
    const neurons = (ng.neurons as Array<Record<string, unknown>>).map(n => ({
      id: n.id as number,
      type: n.type as 'input' | 'hidden' | 'output',
      bias: n.bias as number,
      innovation: n.innovation as number | undefined,
    }));
    const connections = (ng.connections as Array<Record<string, unknown>>).map(c => ({
      fromNode: (c.from_node ?? c.fromNode) as number,
      toNode: (c.to_node ?? c.toNode) as number,
      weight: c.weight as number,
      enabled: c.enabled as boolean,
      innovation: c.innovation as number,
    }));
    neatGenome = {
      neurons,
      connections,
      activation: (ng.activation ?? 'tanh') as string,
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
    neatGenome,
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
  generation?: number,
  best?: boolean
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
  const params: string[] = [];
  if (generation !== undefined) params.push(`generation=${generation}`);
  if (best) params.push('best=true');
  const url = params.length > 0
    ? `/api/creatures/${creatureId}/frames?${params.join('&')}`
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
