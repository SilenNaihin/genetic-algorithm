/**
 * Storage Types and Utilities
 *
 * Shared types for storage implementations.
 */

import type { PelletData, SimulationFrame, FrameActivations } from '../types';
import type { SimulationConfig, CreatureGenome, FitnessHistoryEntry, Vector3 } from '../types';
import { DEFAULT_CONFIG } from '../types';

// Serializable creature type entry (Map converted to array of [nodeCount, count] pairs)
export interface StoredCreatureTypeEntry {
  generation: number;
  nodeCountDistribution: [number, number][]; // Array of [nodeCount, count] pairs
}

export interface SavedRun {
  id: string;
  name?: string;
  startTime: number;
  config: SimulationConfig;
  generationCount: number;
  fitnessHistory?: FitnessHistoryEntry[];
  creatureTypeHistory?: StoredCreatureTypeEntry[];
  bestCreature?: { result: CompactCreatureResult; generation: number };
  longestSurvivor?: { result: CompactCreatureResult; generations: number; diedAtGeneration: number };
}

export interface GenerationData {
  runId: string;
  generation: number;
  results: CompactCreatureResult[];
}

export interface CompactCreatureResult {
  genome: CreatureGenome;
  fitness: number;
  pellets: number;
  disqualified: string | null;
  frames: number[][];  // Compact: [[time, x1,y1,z1, x2,y2,z2, ...], ...]
  pelletData: { position: Vector3; collectedAtFrame: number | null }[];
  activationsPerFrame?: FrameActivations[];  // Full neural network activations per frame
}

/**
 * Recalculate fitness over time using simplified fitness model.
 * Used for replay visualization.
 */
export function recalculateFitnessOverTime(
  frames: SimulationFrame[],
  pellets: PelletData[],
  config: SimulationConfig,
  disqualified: string | null
): number[] {
  if (frames.length === 0) return [];
  if (disqualified) return frames.map(() => 0);

  const fitnessOverTime: number[] = [];
  const initialCOM = frames[0].centerOfMass;

  // Get fitness config (with defaults for legacy runs)
  const pelletPoints = config.fitness_pellet_points ?? DEFAULT_CONFIG.fitness_pellet_points;
  const progressMax = config.fitness_progress_max ?? DEFAULT_CONFIG.fitness_progress_max;
  const distancePerUnit = config.fitness_distance_per_unit ?? DEFAULT_CONFIG.fitness_distance_per_unit;
  const distanceTraveledMax = config.fitness_distance_traveled_max ?? DEFAULT_CONFIG.fitness_distance_traveled_max;

  // Track cumulative distance traveled (XZ only)
  let distanceTraveled = 0;
  let lastCOM = initialCOM;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const com = frame.centerOfMass;

    // Accumulate distance traveled (XZ only)
    if (i > 0) {
      const dx = com.x - lastCOM.x;
      const dz = com.z - lastCOM.z;
      distanceTraveled += Math.sqrt(dx * dx + dz * dz);
    }
    lastCOM = com;

    // Count pellets collected by this frame
    const pelletsCollected = pellets.filter(p =>
      p.collectedAtFrame !== null && p.collectedAtFrame <= i
    ).length;

    // Find active pellet (first uncollected at this frame)
    const activePellet = pellets.find(p =>
      p.collectedAtFrame === null || p.collectedAtFrame > i
    );

    // Base: points per pellet collected
    let f = pelletsCollected * pelletPoints;

    // Progress toward current pellet (0 to progressMax)
    if (activePellet && activePellet.initialDistance > 0) {
      const dx = com.x - activePellet.position.x;
      const dz = com.z - activePellet.position.z;
      const currentDist = Math.sqrt(dx * dx + dz * dz);
      const progress = Math.max(0, Math.min(1,
        (activePellet.initialDistance - currentDist) / activePellet.initialDistance
      ));
      f += progress * progressMax;
    }

    // Distance traveled bonus
    const distanceBonus = Math.min(distanceTraveled * distancePerUnit, distanceTraveledMax);
    f += distanceBonus;

    fitnessOverTime.push(Math.max(f, 0));
  }

  return fitnessOverTime;
}
