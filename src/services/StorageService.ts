/**
 * Storage Service
 *
 * Uses the backend PostgreSQL API for all storage.
 * Backend must be running for the application to work.
 */

import { RemoteStorage } from '../storage/RemoteStorage';
import type { CreatureSimulationResult } from '../simulation/BatchSimulator';
import type { SimulationConfig, FitnessHistoryEntry } from '../types/simulation';
import type { SavedRun, CompactCreatureResult } from '../storage/types';

export interface CreatureTypeHistoryEntry {
  generation: number;
  nodeCountDistribution: Map<number, number>;
}

// Single storage instance - always remote
const storage = new RemoteStorage();
let isInitialized = false;

/**
 * Initialize storage (connects to backend)
 */
export async function initStorage(): Promise<void> {
  if (isInitialized) return;

  await storage.init();
  isInitialized = true;
  console.log('[Storage] Connected to backend PostgreSQL storage');
}

/**
 * Create a new run
 */
export async function createRun(config: SimulationConfig): Promise<string> {
  await initStorage();
  return storage.createRun(config);
}

/**
 * Get current run ID
 */
export function getCurrentRunId(): string | null {
  return storage.getCurrentRunId();
}

/**
 * Set current run ID
 */
export function setCurrentRunId(id: string | null): void {
  storage.setCurrentRunId(id);
}

/**
 * Save generation results
 */
export async function saveGeneration(
  generation: number,
  results: CreatureSimulationResult[]
): Promise<void> {
  await storage.saveGeneration(generation, results);
}

/**
 * Load generation results
 */
export async function loadGeneration(
  runId: string,
  generation: number,
  config?: SimulationConfig
): Promise<CreatureSimulationResult[] | null> {
  return storage.loadGeneration(runId, generation, config);
}

/**
 * Get a single run by ID
 */
export async function getRun(runId: string): Promise<SavedRun | null> {
  return storage.getRun(runId);
}

/**
 * Get all saved runs
 */
export async function getAllRuns(): Promise<SavedRun[]> {
  return storage.getAllRuns();
}

/**
 * Delete a run
 */
export async function deleteRun(runId: string): Promise<void> {
  await storage.deleteRun(runId);
}

/**
 * Update run name
 */
export async function updateRunName(runId: string, name: string): Promise<void> {
  await storage.updateRunName(runId, name);
}

/**
 * Update fitness history for current run
 */
export async function updateFitnessHistory(
  fitnessHistory: FitnessHistoryEntry[]
): Promise<void> {
  await storage.updateFitnessHistory(fitnessHistory);
}

/**
 * Update creature type history for current run
 */
export async function updateCreatureTypeHistory(
  history: CreatureTypeHistoryEntry[]
): Promise<void> {
  await storage.updateCreatureTypeHistory(history);
}

/**
 * Update best creature for current run
 */
export async function updateBestCreature(
  creature: CreatureSimulationResult,
  generation: number
): Promise<void> {
  await storage.updateBestCreature(creature, generation);
}

/**
 * Update longest survivor for current run
 */
export async function updateLongestSurvivor(
  creature: CreatureSimulationResult,
  generations: number,
  diedAtGeneration: number
): Promise<void> {
  await storage.updateLongestSurvivor(creature, generations, diedAtGeneration);
}

/**
 * Get max generation for a run
 */
export async function getMaxGeneration(runId: string): Promise<number> {
  return storage.getMaxGeneration(runId);
}

/**
 * Fork a run up to a specific generation
 */
export async function forkRun(
  sourceRunId: string,
  upToGeneration: number,
  newName?: string
): Promise<string> {
  return storage.forkRun(sourceRunId, upToGeneration, newName);
}

/**
 * Expand a compact creature result (for replay)
 */
export function expandCreatureResult(
  compact: CompactCreatureResult,
  config: SimulationConfig
): CreatureSimulationResult {
  return storage.expandCreatureResult(compact, config);
}

/**
 * Compact a creature result (for storage)
 */
export function compactCreatureResult(
  result: CreatureSimulationResult
): CompactCreatureResult {
  return storage.compactCreatureResult(result);
}

/**
 * Check if storage is initialized
 */
export function isStorageInitialized(): boolean {
  return isInitialized;
}
