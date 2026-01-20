/**
 * Simulation Service
 *
 * Thin abstraction layer over domain simulation logic.
 * This allows future backend migration by swapping implementations.
 *
 * Current: Calls BatchSimulator directly (client-side)
 * Future: Could make API calls to server-side simulation
 */

import { simulatePopulation, type CreatureSimulationResult } from '../simulation/BatchSimulator';
import { Population } from '../genetics/Population';
import type { SimulationConfig } from '../types/simulation';
import type { CreatureGenome } from '../types/genome';

export interface SimulationProgress {
  completed: number;
  total: number;
}

export type ProgressCallback = (progress: SimulationProgress) => void;

/**
 * Run simulation for a population of genomes
 */
export async function runSimulation(
  genomes: CreatureGenome[],
  config: SimulationConfig,
  onProgress?: ProgressCallback
): Promise<CreatureSimulationResult[]> {
  return simulatePopulation(genomes, config, (completed, total) => {
    onProgress?.({ completed, total });
  });
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
