/**
 * Simulation Service
 *
 * Provides utility functions for simulation results.
 * Backend (PyTorch) handles all simulation via the evolution API.
 */

import type { CreatureSimulationResult } from '../types';
import * as Api from './ApiClient';

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
