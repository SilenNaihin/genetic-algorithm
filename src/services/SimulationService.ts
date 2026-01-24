/**
 * Simulation Service
 *
 * Thin abstraction layer that calls backend API for all simulation.
 * Backend (PyTorch) is required - no local simulation fallback.
 */

import type { CreatureSimulationResult, SimulationFrame, PelletData, DisqualificationReason } from '../types';
import { Population } from '../genetics/Population';
import type { SimulationConfig } from '../types/simulation';
import type { CreatureGenome, Vector3 } from '../types/genome';
import * as Api from './ApiClient';

export interface SimulationProgress {
  completed: number;
  total: number;
}

export type ProgressCallback = (progress: SimulationProgress) => void;

let backendAvailable = false;

/**
 * Check if backend is available. Backend is required for simulation.
 */
export async function checkBackendConnection(): Promise<boolean> {
  try {
    const connected = await Api.checkConnection();
    backendAvailable = connected;
    if (connected) {
      console.log('[SimulationService] Backend connected');
    } else {
      console.warn('[SimulationService] Backend not available! Simulation will fail.');
    }
    return connected;
  } catch {
    backendAvailable = false;
    return false;
  }
}

/**
 * Check if backend is available
 */
export function isBackendAvailable(): boolean {
  return backendAvailable;
}

// Helper to safely convert numbers (NaN/Infinity become 0)
const safeNum = (v: number | undefined | null): number => {
  if (v === undefined || v === null) return 0;
  return Number.isFinite(v) ? v : 0;
};

/**
 * Convert API simulation result to CreatureSimulationResult format
 */
function apiResultToCreatureResult(
  apiResult: Api.ApiSimulationResult,
  genome: CreatureGenome,
  _config: SimulationConfig
): CreatureSimulationResult {
  // Expand frames from API format (array of arrays) to SimulationFrame objects
  const frames: SimulationFrame[] = [];
  const nodeIds = genome.nodes.map(n => n.id);

  if (apiResult.frames && apiResult.frames.length > 0) {
    for (let i = 0; i < apiResult.frames.length; i++) {
      const frameData = apiResult.frames[i];
      const nodePositions = new Map<string, Vector3>();

      // First value is time, then x,y,z for each node (with NaN guards)
      const time = safeNum(frameData[0]);
      for (let j = 0; j < nodeIds.length; j++) {
        nodePositions.set(nodeIds[j], {
          x: safeNum(frameData[1 + j * 3]),
          y: safeNum(frameData[1 + j * 3 + 1]),
          z: safeNum(frameData[1 + j * 3 + 2]),
        });
      }

      // Calculate center of mass
      let cx = 0, cy = 0, cz = 0;
      nodePositions.forEach(pos => {
        cx += pos.x;
        cy += pos.y;
        cz += pos.z;
      });
      const n = nodePositions.size || 1;

      frames.push({
        time,
        nodePositions,
        centerOfMass: { x: safeNum(cx / n), y: safeNum(cy / n), z: safeNum(cz / n) },
        activePelletIndex: 0, // Backend doesn't track this per-frame currently
      });
    }
  } else {
    // Create single frame from initial positions if no frames returned
    const nodePositions = new Map<string, Vector3>();
    for (const node of genome.nodes) {
      nodePositions.set(node.id, { ...node.position });
    }

    let cx = 0, cy = 0, cz = 0;
    nodePositions.forEach(pos => {
      cx += pos.x;
      cy += pos.y;
      cz += pos.z;
    });
    const n = nodePositions.size || 1;

    frames.push({
      time: 0,
      nodePositions,
      centerOfMass: { x: cx / n, y: cy / n, z: cz / n },
      activePelletIndex: 0,
    });
  }

  // Use real pellet data from backend if available
  let pellets: PelletData[] = [];
  const apiPellets = (apiResult as { pellets?: { id: string; position: { x: number; y: number; z: number }; collected_at_frame: number | null; spawned_at_frame: number; initial_distance: number }[] }).pellets;
  if (apiPellets && apiPellets.length > 0) {
    pellets = apiPellets.map(p => ({
      id: p.id,
      position: { x: safeNum(p.position.x), y: safeNum(p.position.y), z: safeNum(p.position.z) },
      collectedAtFrame: p.collected_at_frame,
      spawnedAtFrame: p.spawned_at_frame,
      initialDistance: safeNum(p.initial_distance),
    }));
  } else {
    // Fallback: create dummy pellet data based on pellets collected
    pellets = Array.from({ length: Math.max(1, apiResult.pellets_collected) }, (_, i) => ({
      id: `pellet_${i}`,
      position: { x: 0, y: 1, z: 5 },  // Default position in front of creature
      collectedAtFrame: i < apiResult.pellets_collected ? Math.floor((i + 1) * frames.length / (apiResult.pellets_collected + 1)) : null,
      spawnedAtFrame: i === 0 ? 0 : Math.floor(i * frames.length / (apiResult.pellets_collected + 1)),
      initialDistance: 5,
    }));
  }

  // Use real fitness over time from backend if available
  const apiFitnessOverTime = (apiResult as { fitness_over_time?: number[] }).fitness_over_time;
  let fitnessOverTime: number[] = [];
  const safeFitness = safeNum(apiResult.fitness);
  if (apiFitnessOverTime && apiFitnessOverTime.length > 0) {
    fitnessOverTime = apiFitnessOverTime.map(f => safeNum(f));
  } else {
    // Fallback: generate fitness over time (interpolate to final)
    fitnessOverTime = frames.map((_, i) => {
      const progress = frames.length > 1 ? i / (frames.length - 1) : 1;
      return safeNum(safeFitness * progress);
    });
  }

  // Use real activations per frame from backend if available (neural creatures only)
  let activationsPerFrame: number[][] | undefined;
  if (apiResult.activations_per_frame && apiResult.activations_per_frame.length > 0) {
    activationsPerFrame = apiResult.activations_per_frame.map(frameActivations =>
      frameActivations.map(a => safeNum(a))
    );
  }

  return {
    genome,
    frames,
    finalFitness: safeFitness,
    pelletsCollected: apiResult.pellets_collected,
    distanceTraveled: safeNum(apiResult.distance_traveled),
    netDisplacement: safeNum(apiResult.net_displacement),
    closestPelletDistance: 0, // Backend doesn't return this currently
    pellets,
    fitnessOverTime,
    disqualified: apiResult.disqualified_reason as DisqualificationReason,
    activationsPerFrame,
  };
}

/**
 * Run simulation for a population of genomes
 * Uses backend (PyTorch) simulation
 */
export async function runSimulation(
  genomes: CreatureGenome[],
  config: SimulationConfig,
  onProgress?: ProgressCallback
): Promise<CreatureSimulationResult[]> {
  // Report initial progress
  onProgress?.({ completed: 0, total: genomes.length });

  // Call backend API
  const response = await Api.simulateBatch(genomes, config);

  // Convert API results to CreatureSimulationResult format
  // Results come in same order as input genomes
  const results: CreatureSimulationResult[] = [];

  for (let i = 0; i < response.results.length; i++) {
    const apiResult = response.results[i];
    // Find matching genome by ID or use index
    const genome = genomes.find(g => g.id === apiResult.genome_id) ?? genomes[i];

    const result = apiResultToCreatureResult(apiResult, genome, config);
    results.push(result);

    // Report progress
    onProgress?.({ completed: i + 1, total: genomes.length });
  }

  console.log(`[SimulationService] Simulation completed: ${response.results.length} creatures in ${response.total_time_ms}ms (${response.creatures_per_second.toFixed(1)} creatures/sec)`);

  return results;
}

/**
 * Create initial population using backend genetics
 */
export async function createInitialPopulation(config: SimulationConfig): Promise<Population> {
  // Generate genomes from backend
  const genomes = await Api.generateGenomes(config.populationSize, config);

  // Create population container with empty initial and replace with backend-generated genomes
  const genomeConstraints = {
    minNodes: 2,
    maxNodes: config.maxNodes,
    minMuscles: 1,
    maxMuscles: config.maxMuscles,
    minSize: 0.2,
    maxSize: 0.8,
    minStiffness: 50,
    maxStiffness: 500,
    minFrequency: 0.5,
    maxFrequency: config.maxAllowedFrequency,
    maxAmplitude: 0.4,
    spawnRadius: 2.0,
  };

  const population = Population.createEmpty(config, genomeConstraints);
  population.replaceCreatures(genomes);

  return population;
}

/**
 * Evolve population using backend genetics and get new genomes
 */
export async function evolvePopulation(
  population: Population,
  generation: number = 0
): Promise<CreatureGenome[]> {
  const genomes = population.getGenomes();
  const fitnesses = population.creatures.map(c => c.state.fitness);
  const config = population.config;

  // Call backend to evolve
  const newGenomes = await Api.evolveGenomes(genomes, fitnesses, config, generation);

  // Update population with new genomes
  population.replaceCreatures(newGenomes);

  return newGenomes;
}

/**
 * Update population fitness from simulation results
 */
export function updatePopulationFitness(
  population: Population,
  results: CreatureSimulationResult[]
): void {
  for (const result of results) {
    const creature = population.creatures.find((c) => c.genome.id === result.genome.id);
    if (creature) {
      creature.state.fitness = result.finalFitness;
      creature.state.pelletsCollected = result.pelletsCollected;
      creature.state.distanceTraveled = result.distanceTraveled;
    }
  }
}

/**
 * Calculate fitness statistics from results
 */
export function calculateFitnessStats(results: CreatureSimulationResult[]): {
  best: number;
  average: number;
  worst: number;
  validCount: number;
} {
  const validResults = results.filter(
    (r) => !isNaN(r.finalFitness) && isFinite(r.finalFitness)
  );

  if (validResults.length === 0) {
    return { best: 0, average: 0, worst: 0, validCount: 0 };
  }

  const fitnesses = validResults.map((r) => r.finalFitness);
  return {
    best: Math.max(...fitnesses),
    average: fitnesses.reduce((sum, f) => sum + f, 0) / fitnesses.length,
    worst: Math.min(...fitnesses),
    validCount: validResults.length,
  };
}

/**
 * Find best creature in results
 */
export function findBestCreature(
  results: CreatureSimulationResult[]
): CreatureSimulationResult | null {
  const validResults = results.filter(
    (r) => !isNaN(r.finalFitness) && isFinite(r.finalFitness)
  );

  if (validResults.length === 0) return null;

  return validResults.reduce((best, r) =>
    r.finalFitness > best.finalFitness ? r : best
  );
}

/**
 * Find longest surviving creature (highest survivalStreak)
 */
export function findLongestSurvivor(
  results: CreatureSimulationResult[]
): CreatureSimulationResult | null {
  const validResults = results.filter(
    (r) => !isNaN(r.finalFitness) && isFinite(r.finalFitness)
  );

  if (validResults.length === 0) return null;

  return validResults.reduce((longest, r) =>
    (r.genome.survivalStreak || 0) > (longest.genome.survivalStreak || 0) ? r : longest
  );
}
