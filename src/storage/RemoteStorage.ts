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
import type { SavedRun, CompactCreatureResult } from './RunStorage';
import { recalculateFitnessOverTime } from './RunStorage';
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

    // Convert results to API format
    const creatures: Api.CreatureResultCreate[] = results.map(r => ({
      genome: Api.toApiGenome(r.genome),
      fitness: r.finalFitness,
      pellets_collected: r.pelletsCollected,
      disqualified: r.disqualified !== null,
      disqualified_reason: r.disqualified,
      frames: this.compactFrames(r.frames, r.genome),
      pellet_data: r.pellets.map(p => ({
        position: {
          x: Math.round(p.position.x * 1000) / 1000,
          y: Math.round(p.position.y * 1000) / 1000,
          z: Math.round(p.position.z * 1000) / 1000
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
    return frames.map(f => {
      const arr: number[] = [Math.round(f.time * 1000) / 1000];
      for (const nodeId of nodeIds) {
        const pos = f.nodePositions.get(nodeId);
        if (pos) {
          arr.push(
            Math.round(pos.x * 1000) / 1000,
            Math.round(pos.y * 1000) / 1000,
            Math.round(pos.z * 1000) / 1000
          );
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

  async loadGeneration(runId: string, gen: number, config?: SimulationConfig): Promise<CreatureSimulationResult[] | null> {
    try {
      const { creatures } = await Api.getGeneration(runId, gen);

      const simConfig = config || DEFAULT_CONFIG;

      // Convert API creatures to CreatureSimulationResult
      const results: CreatureSimulationResult[] = await Promise.all(
        creatures.map(async (c) => {
          const genome = Api.fromApiGenome(c.genome);

          // Try to load frames if available
          let frames: SimulationFrame[] = [];
          let pellets: PelletData[] = [];

          try {
            const framesData = await Api.getCreatureFrames(c.id);
            if (framesData.frames_data && framesData.frames_data.length > 0) {
              frames = this.expandFrames(framesData.frames_data, genome);
            }
          } catch {
            // Frames not available, create empty
          }

          // Create dummy pellet data (backend doesn't store full pellet history yet)
          pellets = Array.from({ length: c.pellets_collected }, (_, i) => ({
            id: `pellet_${i}`,
            position: { x: 0, y: 0, z: 0 },
            collectedAtFrame: null,
            spawnedAtFrame: 0,
            initialDistance: 5
          }));

          const fitnessOverTime = frames.length > 0
            ? recalculateFitnessOverTime(frames, pellets, simConfig, c.disqualified_reason)
            : [];

          return {
            genome,
            frames,
            finalFitness: c.fitness,
            pelletsCollected: c.pellets_collected,
            distanceTraveled: 0,
            netDisplacement: 0,
            closestPelletDistance: 0,
            pellets,
            fitnessOverTime,
            disqualified: c.disqualified_reason as DisqualificationReason
          };
        })
      );

      return results;
    } catch (error) {
      console.error('[RemoteStorage] Failed to load generation:', error);
      return null;
    }
  }

  async getRun(runId: string): Promise<SavedRun | null> {
    try {
      const apiRun = await Api.getRun(runId);
      return apiRunToSavedRun(apiRun);
    } catch {
      return null;
    }
  }

  async getAllRuns(): Promise<SavedRun[]> {
    try {
      const apiRuns = await Api.listRuns();
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
