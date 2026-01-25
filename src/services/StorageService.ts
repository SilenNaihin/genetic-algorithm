/**
 * Storage Service
 *
 * Uses the backend PostgreSQL API for storage.
 * Backend handles all writes during evolution - frontend only reads.
 */

import { RemoteStorage } from '../storage/RemoteStorage';
import type { CreatureSimulationResult, SimulationFrame, PelletData } from '../types';
import type { SimulationConfig } from '../types/simulation';
import type { CreatureGenome } from '../types/genome';
import type { SavedRun, CompactCreatureResult } from '../storage/types';

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
 * Load frames for a specific creature (on-demand, for replay)
 */
export async function loadCreatureFrames(
  creatureId: string,
  genome: CreatureGenome,
  pelletsCollected: number,
  config: SimulationConfig,
  disqualified: string | null,
  pellets?: PelletData[],
  fitnessOverTime?: number[]
): Promise<{ frames: SimulationFrame[]; fitnessOverTime: number[]; pellets: PelletData[]; activationsPerFrame?: Array<{ inputs: number[]; hidden: number[]; outputs: number[] }> }> {
  return storage.loadCreatureFrames(creatureId, genome, pelletsCollected, config, disqualified, pellets, fitnessOverTime);
}

/**
 * Check if storage is initialized
 */
export function isStorageInitialized(): boolean {
  return isInitialized;
}
