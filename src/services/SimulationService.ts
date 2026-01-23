/**
 * Simulation Service
 *
 * Thin abstraction layer over domain simulation logic.
 * Supports two modes:
 * - Local: Calls BatchSimulator directly (client-side Cannon-ES)
 * - Remote: Calls backend API (server-side PyTorch)
 *
 * Use setSimulationMode('remote') to switch to backend simulation.
 * Default is 'local' for backward compatibility.
 */

import { simulatePopulation, type CreatureSimulationResult, type SimulationFrame, type PelletData, type DisqualificationReason } from '../simulation/BatchSimulator';
import { Population } from '../genetics/Population';
import type { SimulationConfig } from '../types/simulation';
import type { CreatureGenome, Vector3 } from '../types/genome';
import * as Api from './ApiClient';

export interface SimulationProgress {
  completed: number;
  total: number;
}

export type ProgressCallback = (progress: SimulationProgress) => void;

export type SimulationMode = 'local' | 'remote';

let currentSimulationMode: SimulationMode = 'local';

/**
 * Get the current simulation mode
 */
export function getSimulationMode(): SimulationMode {
  return currentSimulationMode;
}

/**
 * Set the simulation mode
 * @param mode 'local' for client-side Cannon-ES, 'remote' for backend PyTorch
 */
export function setSimulationMode(mode: SimulationMode): void {
  currentSimulationMode = mode;
  console.log(`[SimulationService] Mode set to: ${mode}`);
}

/**
 * Check if backend is available and switch to remote mode
 */
export async function tryUseRemoteSimulation(): Promise<boolean> {
  try {
    const connected = await Api.checkConnection();
    if (connected) {
      setSimulationMode('remote');
      console.log('[SimulationService] Using remote backend simulation');
      return true;
    }
  } catch {
    // Backend not available
  }
  console.log('[SimulationService] Using local simulation');
  return false;
}

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

      // First value is time, then x,y,z for each node
      const time = frameData[0];
      for (let j = 0; j < nodeIds.length; j++) {
        nodePositions.set(nodeIds[j], {
          x: frameData[1 + j * 3] ?? 0,
          y: frameData[1 + j * 3 + 1] ?? 0,
          z: frameData[1 + j * 3 + 2] ?? 0,
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
        centerOfMass: { x: cx / n, y: cy / n, z: cz / n },
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

  // Create dummy pellet data based on pellets collected
  const pellets: PelletData[] = Array.from({ length: apiResult.pellets_collected }, (_, i) => ({
    id: `pellet_${i}`,
    position: { x: 0, y: 0, z: 0 },
    collectedAtFrame: null,
    spawnedAtFrame: 0,
    initialDistance: 5,
  }));

  // Generate fitness over time from frames (simplified - just interpolate to final)
  const fitnessOverTime: number[] = frames.map((_, i) => {
    // Linear interpolation from 0 to final fitness
    const progress = frames.length > 1 ? i / (frames.length - 1) : 1;
    return apiResult.fitness * progress;
  });

  return {
    genome,
    frames,
    finalFitness: apiResult.fitness,
    pelletsCollected: apiResult.pellets_collected,
    distanceTraveled: apiResult.distance_traveled,
    netDisplacement: apiResult.net_displacement,
    closestPelletDistance: 0, // Backend doesn't return this currently
    pellets,
    fitnessOverTime,
    disqualified: apiResult.disqualified_reason as DisqualificationReason,
  };
}

/**
 * Run simulation for a population of genomes
 * Uses local or remote simulation based on current mode
 */
export async function runSimulation(
  genomes: CreatureGenome[],
  config: SimulationConfig,
  onProgress?: ProgressCallback
): Promise<CreatureSimulationResult[]> {
  if (currentSimulationMode === 'remote') {
    return runRemoteSimulation(genomes, config, onProgress);
  }
  return runLocalSimulation(genomes, config, onProgress);
}

/**
 * Run simulation locally using Cannon-ES
 */
async function runLocalSimulation(
  genomes: CreatureGenome[],
  config: SimulationConfig,
  onProgress?: ProgressCallback
): Promise<CreatureSimulationResult[]> {
  return simulatePopulation(genomes, config, (completed, total) => {
    onProgress?.({ completed, total });
  });
}

/**
 * Run simulation remotely using backend API
 */
async function runRemoteSimulation(
  genomes: CreatureGenome[],
  config: SimulationConfig,
  onProgress?: ProgressCallback
): Promise<CreatureSimulationResult[]> {
  // Report initial progress
  onProgress?.({ completed: 0, total: genomes.length });

  try {
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

    console.log(`[SimulationService] Remote simulation completed: ${response.results.length} creatures in ${response.total_time_ms}ms (${response.creatures_per_second.toFixed(1)} creatures/sec)`);

    return results;
  } catch (error) {
    console.error('[SimulationService] Remote simulation failed, falling back to local:', error);
    // Fall back to local simulation
    return runLocalSimulation(genomes, config, onProgress);
  }
}

/**
 * Create initial population
 */
export function createInitialPopulation(config: SimulationConfig): Population {
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

  return Population.createInitial(config, genomeConstraints);
}

/**
 * Evolve population and get new genomes
 */
export function evolvePopulation(population: Population): CreatureGenome[] {
  const newGenomes = population.evolve();
  population.replaceCreatures(newGenomes);
  return population.getGenomes();
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
