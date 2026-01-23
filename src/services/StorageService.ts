/**
 * Storage Service
 *
 * Abstraction layer over storage that supports both:
 * - Local: IndexedDB (RunStorage) - works offline
 * - Remote: Backend API (RemoteStorage) - requires backend
 *
 * Use setStorageMode('remote') to switch to backend storage.
 * Default is 'local' for backward compatibility.
 */

import { RunStorage, type SavedRun, type CompactCreatureResult } from '../storage/RunStorage';
import { RemoteStorage } from '../storage/RemoteStorage';
import type { CreatureSimulationResult } from '../simulation/BatchSimulator';
import type { SimulationConfig, FitnessHistoryEntry } from '../types/simulation';

export type StorageMode = 'local' | 'remote';

export interface CreatureTypeHistoryEntry {
  generation: number;
  nodeCountDistribution: Map<number, number>;
}

// Storage implementations
const localStorage = new RunStorage();
let remoteStorage: RemoteStorage | null = null;

// Current mode
let currentMode: StorageMode = 'local';
let isInitialized = false;

/**
 * Get the current storage mode
 */
export function getStorageMode(): StorageMode {
  return currentMode;
}

/**
 * Set the storage mode
 * @param mode 'local' for IndexedDB, 'remote' for backend API
 */
export async function setStorageMode(mode: StorageMode): Promise<void> {
  if (mode === currentMode && isInitialized) return;

  currentMode = mode;
  isInitialized = false;

  if (mode === 'remote') {
    if (!remoteStorage) {
      remoteStorage = new RemoteStorage();
    }
    await remoteStorage.init();
  } else {
    await localStorage.init();
  }

  isInitialized = true;
}

/**
 * Get the active storage instance
 */
function getStorage(): RunStorage | RemoteStorage {
  if (currentMode === 'remote' && remoteStorage) {
    return remoteStorage;
  }
  return localStorage;
}

/**
 * Initialize storage (IndexedDB or Remote)
 * Automatically tries to use backend if available.
 */
export async function initStorage(): Promise<void> {
  if (isInitialized) return;

  // Auto-detect backend on first init (tryUseRemoteStorage sets isInitialized)
  if (currentMode === 'local') {
    const usedRemote = await tryUseRemoteStorage();
    if (usedRemote) {
      // Remote storage already initialized by tryUseRemoteStorage
      return;
    }
  }

  if (currentMode === 'remote') {
    if (!remoteStorage) {
      remoteStorage = new RemoteStorage();
    }
    await remoteStorage.init();
  } else {
    await localStorage.init();
  }

  isInitialized = true;
}

/**
 * Create a new run
 */
export async function createRun(config: SimulationConfig): Promise<string> {
  await initStorage();
  return getStorage().createRun(config);
}

/**
 * Get current run ID
 */
export function getCurrentRunId(): string | null {
  return getStorage().getCurrentRunId();
}

/**
 * Set current run ID
 */
export function setCurrentRunId(id: string | null): void {
  getStorage().setCurrentRunId(id);
}

/**
 * Save generation results
 */
export async function saveGeneration(
  generation: number,
  results: CreatureSimulationResult[]
): Promise<void> {
  await getStorage().saveGeneration(generation, results);
}

/**
 * Load generation results
 */
export async function loadGeneration(
  runId: string,
  generation: number,
  config?: SimulationConfig
): Promise<CreatureSimulationResult[] | null> {
  return getStorage().loadGeneration(runId, generation, config);
}

/**
 * Get a single run by ID
 */
export async function getRun(runId: string): Promise<SavedRun | null> {
  return getStorage().getRun(runId);
}

/**
 * Get all saved runs
 */
export async function getAllRuns(): Promise<SavedRun[]> {
  return getStorage().getAllRuns();
}

/**
 * Delete a run
 */
export async function deleteRun(runId: string): Promise<void> {
  await getStorage().deleteRun(runId);
}

/**
 * Update run name
 */
export async function updateRunName(runId: string, name: string): Promise<void> {
  await getStorage().updateRunName(runId, name);
}

/**
 * Update fitness history for current run
 */
export async function updateFitnessHistory(
  fitnessHistory: FitnessHistoryEntry[]
): Promise<void> {
  await getStorage().updateFitnessHistory(fitnessHistory);
}

/**
 * Update creature type history for current run
 */
export async function updateCreatureTypeHistory(
  history: CreatureTypeHistoryEntry[]
): Promise<void> {
  await getStorage().updateCreatureTypeHistory(history);
}

/**
 * Update best creature for current run
 */
export async function updateBestCreature(
  creature: CreatureSimulationResult,
  generation: number
): Promise<void> {
  await getStorage().updateBestCreature(creature, generation);
}

/**
 * Update longest survivor for current run
 */
export async function updateLongestSurvivor(
  creature: CreatureSimulationResult,
  generations: number,
  diedAtGeneration: number
): Promise<void> {
  await getStorage().updateLongestSurvivor(creature, generations, diedAtGeneration);
}

/**
 * Get max generation for a run
 */
export async function getMaxGeneration(runId: string): Promise<number> {
  return getStorage().getMaxGeneration(runId);
}

/**
 * Fork a run up to a specific generation
 */
export async function forkRun(
  sourceRunId: string,
  upToGeneration: number,
  newName?: string
): Promise<string> {
  return getStorage().forkRun(sourceRunId, upToGeneration, newName);
}

/**
 * Expand a compact creature result (for replay)
 */
export function expandCreatureResult(
  compact: CompactCreatureResult,
  config: SimulationConfig
): CreatureSimulationResult {
  return getStorage().expandCreatureResult(compact, config);
}

/**
 * Compact a creature result (for storage)
 */
export function compactCreatureResult(
  result: CreatureSimulationResult
): CompactCreatureResult {
  return getStorage().compactCreatureResult(result);
}

/**
 * Check if backend is available and switch to remote mode
 */
export async function tryUseRemoteStorage(): Promise<boolean> {
  try {
    const { checkConnection } = await import('./ApiClient');
    const connected = await checkConnection();
    if (connected) {
      await setStorageMode('remote');
      console.log('[Storage] Using remote backend storage');
      return true;
    }
  } catch {
    // Backend not available
  }
  console.log('[Storage] Using local IndexedDB storage');
  return false;
}
