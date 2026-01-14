import { CreatureSimulationResult, PelletData, SimulationFrame } from '../simulation/BatchSimulator';
import { DEFAULT_FITNESS_WEIGHTS, SimulationConfig, CreatureGenome, FitnessHistoryEntry, Vector3, FitnessWeights } from '../types';

export interface SavedRun {
  id: string;
  name?: string;
  startTime: number;
  config: SimulationConfig;
  generationCount: number;
  fitnessHistory?: FitnessHistoryEntry[];
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
}

export function recalculateFitnessOverTime(
  frames: SimulationFrame[],
  pellets: PelletData[],
  weights: FitnessWeights,
  disqualified: string | null
): number[] {
  if (frames.length === 0) return [];
  if (disqualified) return frames.map(() => 1);

  const fitnessOverTime: number[] = [];
  const initialCOM = frames[0].centerOfMass;
  let distanceTraveled = 0;
  let lastCOM: Vector3 | null = null;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const com = frame.centerOfMass;

    // Track distance traveled
    if (lastCOM) {
      const dx = com.x - lastCOM.x;
      const dy = com.y - lastCOM.y;
      const dz = com.z - lastCOM.z;
      distanceTraveled += Math.sqrt(dx * dx + dy * dy + dz * dz);
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

    // Calculate fitness
    let f = weights.baseFitness;
    f += pelletsCollected * weights.pelletWeight;

    // Proximity bonus
    if (activePellet) {
      const pdx = com.x - activePellet.position.x;
      const pdy = com.y - activePellet.position.y;
      const pdz = com.z - activePellet.position.z;
      const pelletDist = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);
      f += Math.max(0, weights.proximityMaxDistance - pelletDist) * weights.proximityWeight;
    }

    // Movement bonus
    f += Math.min(distanceTraveled * weights.movementWeight, weights.movementCap);

    // Distance bonus (net displacement from start)
    if (weights.distanceWeight > 0) {
      const netDx = com.x - initialCOM.x;
      const netDy = com.y - initialCOM.y;
      const netDz = com.z - initialCOM.z;
      const netDisp = Math.sqrt(netDx * netDx + netDy * netDy + netDz * netDz);
      f += Math.min(netDisp * weights.distanceWeight, weights.distanceCap);
    }

    fitnessOverTime.push(Math.max(f, 1));
  }

  return fitnessOverTime;
}

export class RunStorage {
  private db: IDBDatabase | null = null;
  private currentRunId: string | null = null;
  private dbName = 'EvolutionLabDB';
  private dbVersion = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('runs')) {
          db.createObjectStore('runs', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('generations')) {
          const genStore = db.createObjectStore('generations', { keyPath: ['runId', 'generation'] });
          genStore.createIndex('runId', 'runId', { unique: false });
        }
      };
    });
  }

  async createRun(config: SimulationConfig): Promise<string> {
    const id = `run_${Date.now()}`;
    this.currentRunId = id;

    const run: SavedRun = {
      id,
      startTime: Date.now(),
      config: { ...config },
      generationCount: 0
    };

    await this.putRun(run);
    return id;
  }

  getCurrentRunId(): string | null {
    return this.currentRunId;
  }

  setCurrentRunId(id: string | null): void {
    this.currentRunId = id;
  }

  private async putRun(run: SavedRun): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const tx = this.db.transaction('runs', 'readwrite');
      const store = tx.objectStore('runs');
      const request = store.put(run);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveGeneration(gen: number, results: CreatureSimulationResult[]): Promise<void> {
    if (!this.db || !this.currentRunId) return;

    const compactResults: CompactCreatureResult[] = results.map(r => ({
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
    }));

    const genData: GenerationData = {
      runId: this.currentRunId,
      generation: gen,
      results: compactResults
    };

    await this.putGeneration(genData);

    const run = await this.getRun(this.currentRunId);
    if (run) {
      run.generationCount = gen + 1;
      await this.putRun(run);
    }
  }

  private compactFrames(frames: SimulationFrame[], genome: CreatureGenome): number[][] {
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

  private expandFrames(compactFrames: number[][], genome: CreatureGenome): SimulationFrame[] {
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

  private async putGeneration(genData: GenerationData): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const tx = this.db.transaction('generations', 'readwrite');
      const store = tx.objectStore('generations');
      const request = store.put(genData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadGeneration(runId: string, gen: number, fitnessWeights?: FitnessWeights): Promise<CreatureSimulationResult[] | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const tx = this.db.transaction('generations', 'readonly');
      const store = tx.objectStore('generations');
      const request = store.get([runId, gen]);

      request.onsuccess = () => {
        const genData = request.result as GenerationData | undefined;
        if (!genData) return resolve(null);

        const weights = fitnessWeights || DEFAULT_FITNESS_WEIGHTS;

        const results: CreatureSimulationResult[] = genData.results.map(r => {
          const frames = this.expandFrames(r.frames, r.genome);
          const pellets: PelletData[] = r.pelletData.map((p, i) => ({
            id: `pellet_${i}`,
            position: p.position,
            collectedAtFrame: p.collectedAtFrame,
            spawnedAtFrame: 0
          }));

          const fitnessOverTime = recalculateFitnessOverTime(frames, pellets, weights, r.disqualified);

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
            disqualified: r.disqualified as any
          };
        });

        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getRun(runId: string): Promise<SavedRun | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const tx = this.db.transaction('runs', 'readonly');
      const store = tx.objectStore('runs');
      const request = store.get(runId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllRuns(): Promise<SavedRun[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const tx = this.db.transaction('runs', 'readonly');
      const store = tx.objectStore('runs');
      const request = store.getAll();
      request.onsuccess = () => {
        const runs = request.result as SavedRun[];
        runs.sort((a, b) => b.startTime - a.startTime);
        resolve(runs);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteRun(runId: string): Promise<void> {
    if (!this.db) return;

    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction('generations', 'readwrite');
      const store = tx.objectStore('generations');
      const index = store.index('runId');
      const request = index.openCursor(IDBKeyRange.only(runId));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction('runs', 'readwrite');
      const store = tx.objectStore('runs');
      const request = store.delete(runId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateFitnessHistory(fitnessHistory: FitnessHistoryEntry[]): Promise<void> {
    if (!this.currentRunId) return;
    const run = await this.getRun(this.currentRunId);
    if (run) {
      run.fitnessHistory = fitnessHistory;
      await this.putRun(run);
    }
  }

  async updateRunName(runId: string, name: string): Promise<void> {
    const run = await this.getRun(runId);
    if (run) {
      run.name = name;
      await this.putRun(run);
    }
  }

  async getMaxGeneration(runId: string): Promise<number> {
    const run = await this.getRun(runId);
    return run ? run.generationCount - 1 : -1;
  }
}
