/**
 * Storage Service
 *
 * Thin abstraction layer over IndexedDB storage.
 * This allows future backend migration by swapping implementations.
 *
 * Current: Uses RunStorage with IndexedDB (client-side)
 * Future: Could make API calls to PostgreSQL backend
 */

import { RunStorage, type SavedRun, type CompactCreatureResult } from '../storage/RunStorage';
import type { CreatureSimulationResult } from '../simulation/BatchSimulator';
import type { SimulationConfig, FitnessHistoryEntry } from '../types/simulation';

// Singleton instance of RunStorage
const runStorage = new RunStorage();

export interface CreatureTypeHistoryEntry {
  generation: number;
  nodeCountDistribution: Map<number, number>;
}

/**
 * Initialize storage (IndexedDB)
 */
export async function initStorage(): Promise<void> {
  await runStorage.init();
}

/**
 * Create a new run
 */
export async function createRun(config: SimulationConfig): Promise<string> {
  return runStorage.createRun(config);
}

/**
 * Get current run ID
 */
export function getCurrentRunId(): string | null {
  return runStorage.getCurrentRunId();
}

/**
 * Set current run ID
 */
export function setCurrentRunId(id: string | null): void {
  runStorage.setCurrentRunId(id);
}

/**
 * Save generation results
 */
export async function saveGeneration(
  generation: number,
  results: CreatureSimulationResult[]
): Promise<void> {
  await runStorage.saveGeneration(generation, results);
}

/**
 * Load generation results
 */
export async function loadGeneration(
  runId: string,
  generation: number,
  config?: SimulationConfig
): Promise<CreatureSimulationResult[] | null> {
  return runStorage.loadGeneration(runId, generation, config);
}

/**
 * Get a single run by ID
 */
export async function getRun(runId: string): Promise<SavedRun | null> {
  return runStorage.getRun(runId);
}

/**
 * Get all saved runs
 */
export async function getAllRuns(): Promise<SavedRun[]> {
  return runStorage.getAllRuns();
}

/**
 * Delete a run
 */
export async function deleteRun(runId: string): Promise<void> {
  await runStorage.deleteRun(runId);
}

/**
 * Update run name
 */
export async function updateRunName(runId: string, name: string): Promise<void> {
  await runStorage.updateRunName(runId, name);
}

/**
 * Update fitness history for current run
 */
export async function updateFitnessHistory(
  fitnessHistory: FitnessHistoryEntry[]
): Promise<void> {
  await runStorage.updateFitnessHistory(fitnessHistory);
}

/**
 * Update creature type history for current run
 */
export async function updateCreatureTypeHistory(
  history: CreatureTypeHistoryEntry[]
): Promise<void> {
  await runStorage.updateCreatureTypeHistory(history);
}

/**
 * Update best creature for current run
 */
export async function updateBestCreature(
  creature: CreatureSimulationResult,
  generation: number
): Promise<void> {
  await runStorage.updateBestCreature(creature, generation);
}

/**
 * Update longest survivor for current run
 */
export async function updateLongestSurvivor(
  creature: CreatureSimulationResult,
  generations: number,
  diedAtGeneration: number
): Promise<void> {
  await runStorage.updateLongestSurvivor(creature, generations, diedAtGeneration);
}

/**
 * Get max generation for a run
 */
export async function getMaxGeneration(runId: string): Promise<number> {
  return runStorage.getMaxGeneration(runId);
}

/**
 * Fork a run up to a specific generation
 */
export async function forkRun(
  sourceRunId: string,
  upToGeneration: number,
  newName?: string
): Promise<string> {
  return runStorage.forkRun(sourceRunId, upToGeneration, newName);
}

/**
 * Expand a compact creature result (for replay)
 */
export function expandCreatureResult(
  compact: CompactCreatureResult,
  config: SimulationConfig
): CreatureSimulationResult {
  return runStorage.expandCreatureResult(compact, config);
}

/**
 * Compact a creature result (for storage)
 */
export function compactCreatureResult(
  result: CreatureSimulationResult
): CompactCreatureResult {
  return runStorage.compactCreatureResult(result);
}
