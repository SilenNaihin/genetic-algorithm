/**
 * Remote Storage - Backend API Implementation
 *
 * Implements the same interface as RunStorage but uses the backend API
 * instead of IndexedDB. This allows the frontend to use either local
 * or remote storage seamlessly.
 */

import * as Api from '../services/ApiClient';
import type { CreatureSimulationResult, PelletData, SimulationFrame } from '../simulation/BatchSimulator';
import type { SimulationConfig, FitnessHistoryEntry, Vector3 } from '../types';
import { DEFAULT_CONFIG } from '../types';
import type { SavedRun, CompactCreatureResult } from './types';
import { recalculateFitnessOverTime } from './types';
import type { DisqualificationReason } from '../simulation/BatchSimulator';

/**
 * Convert API run to SavedRun format
 */
function apiRunToSavedRun(apiRun: Api.ApiRun): SavedRun {
  const config = Api.fromApiConfig(apiRun.config as unknown as Api.ApiSimulationConfig);

  return {
    id: apiRun.id,
    name: apiRun.name,
    startTime: new Date(apiRun.created_at).getTime(),
    config: { ...DEFAULT_CONFIG, ...config } as SimulationConfig,
    generationCount: apiRun.generation_count,
    // These would need separate API calls to fully populate
    fitnessHistory: undefined,
    creatureTypeHistory: undefined,
    bestCreature: undefined,
    longestSurvivor: undefined,
  };
}

/**
 * Remote storage implementation using backend API.
 */
export class RemoteStorage {
  private currentRunId: string | null = null;

  async init(): Promise<void> {
    // Check backend connectivity
    const connected = await Api.checkConnection();
    if (!connected) {
      throw new Error('Cannot connect to backend API');
    }
  }

  async createRun(config: SimulationConfig): Promise<string> {
    const name = `Run ${new Date().toLocaleString()}`;
    const apiRun = await Api.createRun(name, config);
    this.currentRunId = apiRun.id;
    return apiRun.id;
  }

  getCurrentRunId(): string | null {
    return this.currentRunId;
  }

  setCurrentRunId(id: string | null): void {
    this.currentRunId = id;
  }

  async saveGeneration(gen: number, results: CreatureSimulationResult[]): Promise<void> {
    if (!this.currentRunId) return;

    // Helper to safely convert numbers (NaN/Infinity become 0)
    const safeNum = (v: number) => Number.isFinite(v) ? v : 0;

    // Convert results to API format
    const creatures: Api.CreatureResultCreate[] = results.map(r => ({
      genome: Api.toApiGenome(r.genome),
      fitness: safeNum(r.finalFitness),
      pellets_collected: r.pelletsCollected,
      disqualified: r.disqualified !== null,
      disqualified_reason: r.disqualified,
      frames: this.compactFrames(r.frames, r.genome),
      pellet_data: r.pellets.map(p => ({
        position: {
          x: safeNum(Math.round(p.position.x * 1000) / 1000),
          y: safeNum(Math.round(p.position.y * 1000) / 1000),
          z: safeNum(Math.round(p.position.z * 1000) / 1000)
        },
        collectedAtFrame: p.collectedAtFrame
      }))
    }));

    try {
      await Api.saveGeneration(this.currentRunId, gen, creatures);
      console.log(`[RemoteStorage] Generation ${gen} saved with ${results.length} creatures`);
    } catch (error) {
      console.error('[RemoteStorage] Failed to save generation:', error);
      throw error;
    }
  }

  compactCreatureResult(r: CreatureSimulationResult): CompactCreatureResult {
    return {
      genome: r.genome,
      fitness: Math.round(r.finalFitness * 1000) / 1000,
      pellets: r.pelletsCollected,
      disqualified: r.disqualified,
      frames: this.compactFrames(r.frames, r.genome),
      pelletData: r.pellets.map(p => ({
        position: {
          x: Math.round(p.position.x * 1000) / 1000,
          y: Math.round(p.position.y * 1000) / 1000,
          z: Math.round(p.position.z * 1000) / 1000
        },
        collectedAtFrame: p.collectedAtFrame
      }))
    };
  }

  private compactFrames(frames: SimulationFrame[], genome: { nodes: { id: string }[] }): number[][] {
    const nodeIds = genome.nodes.map(n => n.id);
    // Helper to safely round numbers (NaN/Infinity become 0)
    const safeRound = (v: number) => {
      const rounded = Math.round(v * 1000) / 1000;
      return Number.isFinite(rounded) ? rounded : 0;
    };
    return frames.map(f => {
      const arr: number[] = [safeRound(f.time)];
      for (const nodeId of nodeIds) {
        const pos = f.nodePositions.get(nodeId);
        if (pos) {
          arr.push(safeRound(pos.x), safeRound(pos.y), safeRound(pos.z));
        } else {
          arr.push(0, 0, 0);
        }
      }
      return arr;
    });
  }

  expandCreatureResult(r: CompactCreatureResult, config: SimulationConfig): CreatureSimulationResult {
    const frames = this.expandFrames(r.frames, r.genome);
    const pellets: PelletData[] = r.pelletData.map((p, i) => ({
      id: `pellet_${i}`,
      position: p.position,
      collectedAtFrame: p.collectedAtFrame,
      spawnedAtFrame: 0,
      initialDistance: 5
    }));
    const fitnessOverTime = recalculateFitnessOverTime(frames, pellets, config, r.disqualified);

    return {
      genome: r.genome,
      frames,
      finalFitness: r.fitness,
      pelletsCollected: r.pellets,
      distanceTraveled: 0,
      netDisplacement: 0,
      closestPelletDistance: 0,
      pellets,
      fitnessOverTime,
      disqualified: r.disqualified as DisqualificationReason
    };
  }

  private expandFrames(compactFrames: number[][], genome: { nodes: { id: string }[] }): SimulationFrame[] {
    const nodeIds = genome.nodes.map(n => n.id);
    return compactFrames.map(arr => {
      const nodePositions = new Map<string, Vector3>();
      for (let i = 0; i < nodeIds.length; i++) {
        nodePositions.set(nodeIds[i], {
          x: arr[1 + i * 3],
          y: arr[1 + i * 3 + 1],
          z: arr[1 + i * 3 + 2]
        });
      }

      let cx = 0, cy = 0, cz = 0;
      nodePositions.forEach(pos => {
        cx += pos.x;
        cy += pos.y;
        cz += pos.z;
      });
      const n = nodePositions.size || 1;

      return {
        time: arr[0],
        nodePositions,
        centerOfMass: { x: cx / n, y: cy / n, z: cz / n },
        activePelletIndex: 0
      };
    });
  }

  async loadGeneration(runId: string, gen: number, _config?: SimulationConfig): Promise<CreatureSimulationResult[] | null> {
    try {
      const { creatures } = await Api.getGeneration(runId, gen);

      // Convert API creatures to CreatureSimulationResult
      // NOTE: Frames are NOT loaded here - they are loaded lazily when replay modal opens
      // This avoids N+1 queries (100 individual frame requests)
      const results: CreatureSimulationResult[] = creatures.map((c) => {
        const genome = Api.fromApiGenome(c.genome);

        // Store creature ID in genome for later frame loading
        genome._apiCreatureId = c.id;

        // Create dummy pellet data
        const pellets: PelletData[] = Array.from({ length: c.pellets_collected }, (_, i) => ({
          id: `pellet_${i}`,
          position: { x: 0, y: 0, z: 0 },
          collectedAtFrame: null,
          spawnedAtFrame: 0,
          initialDistance: 5
        }));

        return {
          genome,
          frames: [], // Empty - loaded on demand via loadCreatureFrames
          finalFitness: c.fitness,
          pelletsCollected: c.pellets_collected,
          distanceTraveled: 0,
          netDisplacement: 0,
          closestPelletDistance: 0,
          pellets,
          fitnessOverTime: [], // Calculated when frames are loaded
          disqualified: c.disqualified_reason as DisqualificationReason
        };
      });

      return results;
    } catch (error) {
      console.error('[RemoteStorage] Failed to load generation:', error);
      return null;
    }
  }

  /**
   * Load frames for a specific creature (on-demand, for replay)
   */
  async loadCreatureFrames(
    creatureId: string,
    genome: { nodes: { id: string }[] },
    pelletsCollected: number,
    config: SimulationConfig,
    disqualified: string | null
  ): Promise<{ frames: SimulationFrame[]; fitnessOverTime: number[] }> {
    try {
      const framesData = await Api.getCreatureFrames(creatureId);
      if (!framesData.frames_data || framesData.frames_data.length === 0) {
        return { frames: [], fitnessOverTime: [] };
      }

      const frames = this.expandFrames(framesData.frames_data, genome);

      // Create pellet data for fitness calculation
      const pellets: PelletData[] = Array.from({ length: pelletsCollected }, (_, i) => ({
        id: `pellet_${i}`,
        position: { x: 0, y: 0, z: 0 },
        collectedAtFrame: null,
        spawnedAtFrame: 0,
        initialDistance: 5
      }));

      const fitnessOverTime = recalculateFitnessOverTime(frames, pellets, config, disqualified);

      return { frames, fitnessOverTime };
    } catch (error) {
      console.error('[RemoteStorage] Failed to load creature frames:', error);
      return { frames: [], fitnessOverTime: [] };
    }
  }

  async getRun(runId: string): Promise<SavedRun | null> {
    try {
      // Fetch run data and fitness history in parallel
      const [apiRun, fitnessHistory, creatureTypesHistory] = await Promise.all([
        Api.getRun(runId),
        Api.getFitnessHistory(runId).catch(() => []),
        Api.getCreatureTypesHistory(runId).catch(() => []),
      ]);

      const run = apiRunToSavedRun(apiRun);

      // Add fitness history from API
      run.fitnessHistory = fitnessHistory.map(entry => ({
        generation: entry.generation,
        best: entry.best,
        average: entry.avg,
        worst: entry.worst,
      }));

      // Add creature type history from API
      run.creatureTypeHistory = creatureTypesHistory.map(entry => ({
        generation: entry.generation,
        nodeCountDistribution: Object.entries(entry.types).map(([nodeCount, count]) => [
          parseInt(nodeCount),
          count,
        ]) as [number, number][],
      }));

      // Fetch best creature if available
      if (apiRun.best_creature_id) {
        try {
          const bestCreature = await Api.getCreature(apiRun.best_creature_id);
          const genome = Api.fromApiGenome(bestCreature.genome);
          genome._apiCreatureId = bestCreature.id;
          run.bestCreature = {
            result: {
              genome,
              fitness: bestCreature.fitness,
              pellets: bestCreature.pellets_collected,
              disqualified: bestCreature.disqualified_reason,
              frames: [], // Loaded lazily
              pelletData: [],
            },
            generation: apiRun.best_creature_generation ?? 0,
          };
        } catch (e) {
          console.warn('[RemoteStorage] Failed to fetch best creature:', e);
        }
      }

      // Fetch longest survivor if available
      if (apiRun.longest_survivor_id) {
        try {
          const longestSurvivor = await Api.getCreature(apiRun.longest_survivor_id);
          const genome = Api.fromApiGenome(longestSurvivor.genome);
          genome._apiCreatureId = longestSurvivor.id;
          run.longestSurvivor = {
            result: {
              genome,
              fitness: longestSurvivor.fitness,
              pellets: longestSurvivor.pellets_collected,
              disqualified: longestSurvivor.disqualified_reason,
              frames: [], // Loaded lazily
              pelletData: [],
            },
            generations: apiRun.longest_survivor_streak,
            diedAtGeneration: apiRun.longest_survivor_generation ?? 0,
          };
        } catch (e) {
          console.warn('[RemoteStorage] Failed to fetch longest survivor:', e);
        }
      }

      return run;
    } catch {
      return null;
    }
  }

  async getAllRuns(): Promise<SavedRun[]> {
    try {
      const apiRuns = await Api.listRuns();
      // For list view, we don't need full fitness history
      return apiRuns.map(apiRunToSavedRun);
    } catch (error) {
      console.error('[RemoteStorage] Failed to list runs:', error);
      return [];
    }
  }

  async deleteRun(runId: string): Promise<void> {
    await Api.deleteRun(runId);
  }

  async updateFitnessHistory(_fitnessHistory: FitnessHistoryEntry[]): Promise<void> {
    // Backend tracks this automatically during evolution
    // This is a no-op for remote storage
    console.log('[RemoteStorage] Fitness history update (handled by backend)');
  }

  async updateCreatureTypeHistory(_history: { generation: number; nodeCountDistribution: Map<number, number> }[]): Promise<void> {
    // Backend tracks this automatically during evolution
    console.log('[RemoteStorage] Creature type history update (handled by backend)');
  }

  async updateRunName(runId: string, name: string): Promise<void> {
    await Api.updateRun(runId, { name });
  }

  async updateBestCreature(_creature: CreatureSimulationResult, _generation: number): Promise<void> {
    // Backend tracks this automatically during evolution
    console.log('[RemoteStorage] Best creature update (handled by backend)');
  }

  async updateLongestSurvivor(_creature: CreatureSimulationResult, _generations: number, _diedAtGeneration: number): Promise<void> {
    // Backend tracks this automatically during evolution
    console.log('[RemoteStorage] Longest survivor update (handled by backend)');
  }

  async getMaxGeneration(runId: string): Promise<number> {
    const run = await this.getRun(runId);
    return run ? run.generationCount - 1 : -1;
  }

  async forkRun(sourceRunId: string, upToGeneration: number, newName?: string): Promise<string> {
    const name = newName || `Fork (Gen ${upToGeneration})`;
    const newRun = await Api.forkRun(sourceRunId, upToGeneration, name);
    this.currentRunId = newRun.id;
    return newRun.id;
  }
}
