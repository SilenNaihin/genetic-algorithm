/**
 * Remote Storage - Backend API Implementation
 *
 * Read-only storage layer for the frontend.
 * Backend handles all writes during evolution via the evolution API.
 */

import * as Api from '../services/ApiClient';
import type { CreatureSimulationResult, PelletData, SimulationFrame, DisqualificationReason } from '../types';
import type { SimulationConfig, Vector3 } from '../types';
import { DEFAULT_CONFIG } from '../types';
import type { SavedRun, CompactCreatureResult } from './types';

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
    // Partial bestCreature with just fitness for list view sorting/display
    bestCreature: apiRun.best_fitness > 0 ? {
      result: {
        genome: {} as never, // Not needed for list view
        fitness: apiRun.best_fitness,
        pellets: 0,
        disqualified: null,
        frames: [],
        pelletData: [],
      },
      generation: apiRun.best_creature_generation ?? 0,
    } : undefined,
    longestSurvivor: undefined,
  };
}

/**
 * Remote storage implementation using backend API.
 * Frontend is read-only - all writes happen via evolution API.
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
      })),
      activationsPerFrame: r.activationsPerFrame,
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

  expandCreatureResult(r: CompactCreatureResult, _config: SimulationConfig): CreatureSimulationResult {
    const frames = this.expandFrames(r.frames, r.genome);
    const pellets: PelletData[] = r.pelletData.map((p, i) => ({
      id: `pellet_${i}`,
      position: p.position,
      collectedAtFrame: p.collectedAtFrame,
      spawnedAtFrame: 0,
      initialDistance: 5
    }));
    // Frontend does NOT recalculate fitness - all fitness calculations are backend-owned
    // fitnessOverTime should come from backend; empty for legacy data without stored fitness
    const fitnessOverTime: number[] = [];

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
      disqualified: r.disqualified as DisqualificationReason,
      activationsPerFrame: r.activationsPerFrame,
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
      const results: CreatureSimulationResult[] = creatures.map((c) => {
        const genome = Api.fromApiGenome(c.genome);

        // Store creature ID in genome for later frame loading
        genome._apiCreatureId = c.id;
        // Store the generation so clicking on history creatures loads the right frames
        genome._bestPerformanceGeneration = gen;

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
    genome: { nodes: { id: string }[]; _bestPerformanceGeneration?: number; _fetchBestPerformance?: boolean },
    pelletsCollected: number,
    _config: SimulationConfig,
    _disqualified: string | null,
    realPellets?: PelletData[],
    realFitnessOverTime?: number[]
  ): Promise<{ frames: SimulationFrame[]; fitnessOverTime: number[]; pellets: PelletData[]; activationsPerFrame?: Array<{ inputs: number[]; hidden: number[]; outputs: number[]; outputs_raw?: number[] }> }> {
    try {
      // Determine how to fetch frames:
      // 1. If _fetchBestPerformance is true, fetch frames from generation with best fitness
      // 2. If _bestPerformanceGeneration is set, fetch frames from that specific generation
      // 3. Otherwise, fetch latest (default for current gen grid clicks)
      const generation = genome._fetchBestPerformance ? undefined : genome._bestPerformanceGeneration;
      const fetchBest = genome._fetchBestPerformance ?? false;
      console.log('[RemoteStorage] Fetching frames for creature:', creatureId, 'generation:', generation, 'best:', fetchBest);
      const framesData = await Api.getCreatureFrames(creatureId, generation, fetchBest);
      console.log('[RemoteStorage] API response:', {
        hasFramesData: !!framesData.frames_data,
        framesDataLength: framesData.frames_data?.length,
        frameCount: framesData.frame_count,
        frameRate: framesData.frame_rate,
        hasPelletFrames: !!framesData.pellet_frames,
        pelletFramesLength: framesData.pellet_frames?.length,
      });

      if (!framesData.frames_data || framesData.frames_data.length === 0) {
        console.warn('[RemoteStorage] No frames data in API response');
        return { frames: [], fitnessOverTime: [], pellets: [], activationsPerFrame: undefined };
      }

      const frames = this.expandFrames(framesData.frames_data, genome);
      console.log('[RemoteStorage] Expanded frames:', frames.length, 'frames');

      // Convert API pellet_frames to PelletData format
      let pellets: PelletData[];
      if (framesData.pellet_frames && framesData.pellet_frames.length > 0) {
        pellets = framesData.pellet_frames.map((p, i) => ({
          id: `pellet_${i}`,
          position: p.position,
          collectedAtFrame: p.collected_at_frame,
          spawnedAtFrame: p.spawned_at_frame,
          initialDistance: p.initial_distance,
        }));
        console.log('[RemoteStorage] Using pellet_frames from API:', pellets.length, 'pellets');
      } else if (realPellets && realPellets.length > 0) {
        pellets = realPellets;
      } else {
        // Create placeholder pellets
        pellets = Array.from({ length: Math.max(1, pelletsCollected) }, (_, i) => ({
          id: `pellet_${i}`,
          position: { x: 0, y: 0, z: 0 },
          collectedAtFrame: null,
          spawnedAtFrame: 0,
          initialDistance: 5
        }));
      }

      // Get activations from API response
      const activationsPerFrame = framesData.activations_per_frame ?? undefined;
      if (activationsPerFrame) {
        console.log('[RemoteStorage] Using activations_per_frame from backend API:', activationsPerFrame.length, 'frames');
      }

      // Use backend fitness_over_time if available (preferred - accurate from simulation)
      if (framesData.fitness_over_time && framesData.fitness_over_time.length > 0) {
        console.log('[RemoteStorage] Using fitness_over_time from backend API:', framesData.fitness_over_time.length, 'entries');
        return { frames, fitnessOverTime: framesData.fitness_over_time, pellets, activationsPerFrame };
      }

      // Fallback: use real fitnessOverTime if provided and matches frame count
      if (realFitnessOverTime && realFitnessOverTime.length > 0) {
        if (realFitnessOverTime.length === frames.length) {
          console.log('[RemoteStorage] Using real fitnessOverTime from caller');
          return { frames, fitnessOverTime: realFitnessOverTime, pellets, activationsPerFrame };
        }
      }

      // No backend fitness_over_time available (legacy data) - return empty
      // Frontend does NOT recalculate - all fitness calculations are backend-owned
      console.log('[RemoteStorage] No backend fitness_over_time available (legacy data)');
      return { frames, fitnessOverTime: [], pellets, activationsPerFrame };
    } catch (error) {
      console.error('[RemoteStorage] Failed to load creature frames:', error);
      return { frames: [], fitnessOverTime: [], pellets: [], activationsPerFrame: undefined };
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

      // Fetch best creature if available - use dedicated endpoint for best performance
      if (apiRun.best_creature_id) {
        try {
          const bestCreature = await Api.getBestCreatureForRun(apiRun.id);
          const genome = Api.fromApiGenome(bestCreature.genome);
          genome._apiCreatureId = bestCreature.id;
          // Store the generation of best performance for frame loading
          genome._bestPerformanceGeneration = bestCreature.generation;
          run.bestCreature = {
            result: {
              genome,
              fitness: bestCreature.fitness,
              pellets: bestCreature.pellets_collected,
              disqualified: bestCreature.disqualified_reason,
              frames: [], // Loaded lazily
              pelletData: [],
            },
            generation: bestCreature.generation,
          };
        } catch (e) {
          console.warn('[RemoteStorage] Failed to fetch best creature:', e);
        }
      }

      // Fetch longest survivor if available - use dedicated endpoint for best performance
      if (apiRun.longest_survivor_id) {
        try {
          const longestSurvivor = await Api.getLongestSurvivorForRun(apiRun.id);
          const genome = Api.fromApiGenome(longestSurvivor.genome);
          genome._apiCreatureId = longestSurvivor.id;
          // Store the generation of best performance for frame loading
          genome._bestPerformanceGeneration = longestSurvivor.generation;
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

  async updateRunName(runId: string, name: string): Promise<void> {
    await Api.updateRun(runId, { name });
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
