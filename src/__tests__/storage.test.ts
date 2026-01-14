import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateRandomGenome } from '../core/Genome';
import { DEFAULT_CONFIG, DEFAULT_FITNESS_WEIGHTS, type FitnessHistoryEntry, type Vector3 } from '../types';

// Mock IndexedDB for testing
// The actual RunStorage class is in main.ts - we test the interface it should expose

interface MockSavedRun {
  id: string;
  name?: string;
  startTime: number;
  config: typeof DEFAULT_CONFIG;
  generationCount: number;
  fitnessHistory?: FitnessHistoryEntry[];
}

interface MockGenerationData {
  runId: string;
  generation: number;
  results: any[];
}

// Simple in-memory mock of RunStorage for testing the expected interface
class MockRunStorage {
  private runs: Map<string, MockSavedRun> = new Map();
  private generations: Map<string, MockGenerationData> = new Map();
  private currentRunId: string | null = null;

  async init(): Promise<void> {
    // No-op for mock
  }

  async createRun(config: typeof DEFAULT_CONFIG): Promise<string> {
    const id = `run_${Date.now()}`;
    this.currentRunId = id;

    const run: MockSavedRun = {
      id,
      startTime: Date.now(),
      config: { ...config },
      generationCount: 0
    };

    this.runs.set(id, run);
    return id;
  }

  getCurrentRunId(): string | null {
    return this.currentRunId;
  }

  setCurrentRunId(id: string | null): void {
    this.currentRunId = id;
  }

  async saveGeneration(gen: number, results: any[]): Promise<void> {
    if (!this.currentRunId) return;

    const key = `${this.currentRunId}_${gen}`;
    this.generations.set(key, {
      runId: this.currentRunId,
      generation: gen,
      results: results.map(r => ({
        genome: r.genome,
        fitness: r.finalFitness,
        pellets: r.pelletsCollected,
        disqualified: r.disqualified,
        frames: [],
        pelletData: []
      }))
    });

    const run = this.runs.get(this.currentRunId);
    if (run) {
      run.generationCount = gen + 1;
    }
  }

  async loadGeneration(runId: string, gen: number): Promise<any[] | null> {
    const key = `${runId}_${gen}`;
    const genData = this.generations.get(key);
    if (!genData) return null;

    return genData.results.map(r => ({
      genome: r.genome,
      frames: [],
      finalFitness: r.fitness,
      pelletsCollected: r.pellets,
      distanceTraveled: 0,
      netDisplacement: 0,
      closestPelletDistance: 0,
      pellets: [],
      fitnessOverTime: [],
      disqualified: r.disqualified
    }));
  }

  async getRun(runId: string): Promise<MockSavedRun | null> {
    return this.runs.get(runId) || null;
  }

  async getAllRuns(): Promise<MockSavedRun[]> {
    return Array.from(this.runs.values()).sort((a, b) => b.startTime - a.startTime);
  }

  async deleteRun(runId: string): Promise<void> {
    // Delete all generations for this run
    const keysToDelete: string[] = [];
    this.generations.forEach((_, key) => {
      if (key.startsWith(runId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.generations.delete(key));

    // Delete the run
    this.runs.delete(runId);
  }

  async updateRunName(runId: string, name: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      run.name = name;
    }
  }

  async updateFitnessHistory(fitnessHistory: FitnessHistoryEntry[]): Promise<void> {
    if (!this.currentRunId) return;
    const run = this.runs.get(this.currentRunId);
    if (run) {
      run.fitnessHistory = fitnessHistory;
    }
  }

  async getMaxGeneration(runId: string): Promise<number> {
    const run = this.runs.get(runId);
    return run ? run.generationCount - 1 : -1;
  }

  // For testing
  clear(): void {
    this.runs.clear();
    this.generations.clear();
    this.currentRunId = null;
  }
}

describe('RunStorage Interface', () => {
  let storage: MockRunStorage;

  beforeEach(() => {
    storage = new MockRunStorage();
  });

  afterEach(() => {
    storage.clear();
  });

  describe('createRun', () => {
    it('creates a run with unique id', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      expect(runId).toBeDefined();
      expect(runId.startsWith('run_')).toBe(true);
    });

    it('sets currentRunId', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      expect(storage.getCurrentRunId()).toBe(runId);
    });

    it('stores config in run', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const run = await storage.getRun(runId);
      expect(run?.config).toEqual(DEFAULT_CONFIG);
    });

    it('initializes generationCount to 0', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const run = await storage.getRun(runId);
      expect(run?.generationCount).toBe(0);
    });
  });

  describe('saveGeneration', () => {
    it('saves generation data', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const genome = generateRandomGenome();

      const results = [{
        genome,
        frames: [],
        finalFitness: 100,
        pelletsCollected: 2,
        distanceTraveled: 5,
        netDisplacement: 3,
        closestPelletDistance: 1,
        pellets: [],
        fitnessOverTime: [],
        disqualified: null
      }];

      await storage.saveGeneration(0, results);

      const loaded = await storage.loadGeneration(runId, 0);
      expect(loaded).not.toBeNull();
      expect(loaded?.length).toBe(1);
    });

    it('updates generationCount', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const genome = generateRandomGenome();

      const results = [{
        genome,
        frames: [],
        finalFitness: 100,
        pelletsCollected: 0,
        distanceTraveled: 0,
        netDisplacement: 0,
        closestPelletDistance: 0,
        pellets: [],
        fitnessOverTime: [],
        disqualified: null
      }];

      await storage.saveGeneration(0, results);
      let run = await storage.getRun(runId);
      expect(run?.generationCount).toBe(1);

      await storage.saveGeneration(1, results);
      run = await storage.getRun(runId);
      expect(run?.generationCount).toBe(2);
    });

    it('preserves genome data', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const genome = generateRandomGenome();

      const results = [{
        genome,
        frames: [],
        finalFitness: 100,
        pelletsCollected: 3,
        distanceTraveled: 10,
        netDisplacement: 5,
        closestPelletDistance: 2,
        pellets: [],
        fitnessOverTime: [],
        disqualified: null
      }];

      await storage.saveGeneration(0, results);
      const loaded = await storage.loadGeneration(runId, 0);

      expect(loaded?.[0].genome.id).toBe(genome.id);
    });

    it('preserves fitness data', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const genome = generateRandomGenome();

      const results = [{
        genome,
        frames: [],
        finalFitness: 123.456,
        pelletsCollected: 5,
        distanceTraveled: 0,
        netDisplacement: 0,
        closestPelletDistance: 0,
        pellets: [],
        fitnessOverTime: [],
        disqualified: null
      }];

      await storage.saveGeneration(0, results);
      const loaded = await storage.loadGeneration(runId, 0);

      expect(loaded?.[0].finalFitness).toBeCloseTo(123.456, 2);
      expect(loaded?.[0].pelletsCollected).toBe(5);
    });
  });

  describe('loadGeneration', () => {
    it('returns null for non-existent generation', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const loaded = await storage.loadGeneration(runId, 99);
      expect(loaded).toBeNull();
    });

    it('returns null for non-existent run', async () => {
      const loaded = await storage.loadGeneration('nonexistent', 0);
      expect(loaded).toBeNull();
    });
  });

  describe('getAllRuns', () => {
    it('returns empty array when no runs', async () => {
      const runs = await storage.getAllRuns();
      expect(runs).toEqual([]);
    });

    it('returns all runs', async () => {
      await storage.createRun(DEFAULT_CONFIG);
      // Small delay to ensure different timestamps for unique IDs
      await new Promise(resolve => setTimeout(resolve, 5));
      await storage.createRun(DEFAULT_CONFIG);

      const runs = await storage.getAllRuns();
      expect(runs.length).toBe(2);
    });

    it('returns runs sorted by startTime descending', async () => {
      const run1 = await storage.createRun(DEFAULT_CONFIG);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const run2 = await storage.createRun(DEFAULT_CONFIG);

      const runs = await storage.getAllRuns();

      expect(runs[0].id).toBe(run2); // Most recent first
      expect(runs[1].id).toBe(run1);
    });
  });

  describe('deleteRun', () => {
    it('removes run from storage', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);

      let run = await storage.getRun(runId);
      expect(run).not.toBeNull();

      await storage.deleteRun(runId);

      run = await storage.getRun(runId);
      expect(run).toBeNull();
    });

    it('removes all generations for deleted run', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const genome = generateRandomGenome();

      const results = [{
        genome,
        frames: [],
        finalFitness: 100,
        pelletsCollected: 0,
        distanceTraveled: 0,
        netDisplacement: 0,
        closestPelletDistance: 0,
        pellets: [],
        fitnessOverTime: [],
        disqualified: null
      }];

      await storage.saveGeneration(0, results);
      await storage.saveGeneration(1, results);

      await storage.deleteRun(runId);

      const gen0 = await storage.loadGeneration(runId, 0);
      const gen1 = await storage.loadGeneration(runId, 1);

      expect(gen0).toBeNull();
      expect(gen1).toBeNull();
    });
  });

  describe('updateRunName', () => {
    it('updates name for specified run', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const name = 'My Test Run';

      await storage.updateRunName(runId, name);

      const run = await storage.getRun(runId);
      expect(run?.name).toBe(name);
    });

    it('does nothing for non-existent run', async () => {
      // Non-existent run, should not throw
      await expect(storage.updateRunName('non_existent', 'test')).resolves.not.toThrow();
    });
  });

  describe('updateFitnessHistory', () => {
    it('updates fitness history for current run', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const history: FitnessHistoryEntry[] = [
        { generation: 0, best: 100, average: 50, worst: 10 },
        { generation: 1, best: 150, average: 75, worst: 20 }
      ];

      await storage.updateFitnessHistory(history);

      const run = await storage.getRun(runId);
      expect(run?.fitnessHistory).toEqual(history);
    });
  });

  describe('getMaxGeneration', () => {
    it('returns -1 for non-existent run', async () => {
      const maxGen = await storage.getMaxGeneration('nonexistent');
      expect(maxGen).toBe(-1);
    });

    it('returns correct max generation', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const genome = generateRandomGenome();

      const results = [{
        genome,
        frames: [],
        finalFitness: 100,
        pelletsCollected: 0,
        distanceTraveled: 0,
        netDisplacement: 0,
        closestPelletDistance: 0,
        pellets: [],
        fitnessOverTime: [],
        disqualified: null
      }];

      await storage.saveGeneration(0, results);
      await storage.saveGeneration(1, results);
      await storage.saveGeneration(2, results);

      const maxGen = await storage.getMaxGeneration(runId);
      expect(maxGen).toBe(2); // 0, 1, 2 = max is 2
    });
  });
});

describe('Fitness Recalculation', () => {
  // Test the recalculateFitnessOverTime function interface
  // This function is currently in main.ts but should work the same after extraction

  interface SimulationFrame {
    time: number;
    nodePositions: Map<string, Vector3>;
    centerOfMass: Vector3;
    activePelletIndex: number;
  }

  interface PelletData {
    id: string;
    position: Vector3;
    collectedAtFrame: number | null;
    spawnedAtFrame: number;
  }

  // Inline the function for testing (will be imported from storage/RunStorage.ts after refactor)
  function recalculateFitnessOverTime(
    frames: SimulationFrame[],
    pellets: PelletData[],
    weights: typeof DEFAULT_FITNESS_WEIGHTS,
    disqualified: string | null
  ): number[] {
    if (frames.length === 0) return [];
    if (disqualified) return frames.map(() => 1);

    const fitnessOverTime: number[] = [];
    let distanceTraveled = 0;
    let lastCOM: Vector3 | null = null;

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const com = frame.centerOfMass;

      if (lastCOM) {
        const dx = com.x - lastCOM.x;
        const dy = com.y - lastCOM.y;
        const dz = com.z - lastCOM.z;
        distanceTraveled += Math.sqrt(dx * dx + dy * dy + dz * dz);
      }
      lastCOM = com;

      const pelletsCollected = pellets.filter(p =>
        p.collectedAtFrame !== null && p.collectedAtFrame <= i
      ).length;

      let f = weights.baseFitness;
      f += pelletsCollected * weights.pelletWeight;
      f += Math.min(distanceTraveled * weights.movementWeight, weights.movementCap);

      fitnessOverTime.push(Math.max(f, 1));
    }

    return fitnessOverTime;
  }

  it('returns empty array for empty frames', () => {
    const result = recalculateFitnessOverTime([], [], DEFAULT_FITNESS_WEIGHTS, null);
    expect(result).toEqual([]);
  });

  it('returns all 1s for disqualified creature', () => {
    const frames: SimulationFrame[] = [
      { time: 0, nodePositions: new Map(), centerOfMass: { x: 0, y: 0, z: 0 }, activePelletIndex: 0 },
      { time: 0.1, nodePositions: new Map(), centerOfMass: { x: 1, y: 0, z: 0 }, activePelletIndex: 0 }
    ];

    const result = recalculateFitnessOverTime(frames, [], DEFAULT_FITNESS_WEIGHTS, 'high frequency');

    expect(result).toEqual([1, 1]);
  });

  it('applies base fitness', () => {
    const frames: SimulationFrame[] = [
      { time: 0, nodePositions: new Map(), centerOfMass: { x: 0, y: 0, z: 0 }, activePelletIndex: 0 }
    ];

    const weights = { ...DEFAULT_FITNESS_WEIGHTS, baseFitness: 50, pelletWeight: 0, movementWeight: 0 };
    const result = recalculateFitnessOverTime(frames, [], weights, null);

    expect(result[0]).toBe(50);
  });

  it('increases fitness with pellet collection', () => {
    const frames: SimulationFrame[] = [
      { time: 0, nodePositions: new Map(), centerOfMass: { x: 0, y: 0, z: 0 }, activePelletIndex: 0 },
      { time: 0.1, nodePositions: new Map(), centerOfMass: { x: 0, y: 0, z: 0 }, activePelletIndex: 0 }
    ];

    const pellets: PelletData[] = [
      { id: 'p1', position: { x: 1, y: 0, z: 0 }, collectedAtFrame: 0, spawnedAtFrame: 0 }
    ];

    const weights = { ...DEFAULT_FITNESS_WEIGHTS, baseFitness: 10, pelletWeight: 100, movementWeight: 0 };
    const result = recalculateFitnessOverTime(frames, pellets, weights, null);

    expect(result[0]).toBe(110); // 10 base + 100 pellet
    expect(result[1]).toBe(110); // Still collected
  });

  it('increases fitness with movement', () => {
    const frames: SimulationFrame[] = [
      { time: 0, nodePositions: new Map(), centerOfMass: { x: 0, y: 0, z: 0 }, activePelletIndex: 0 },
      { time: 0.1, nodePositions: new Map(), centerOfMass: { x: 5, y: 0, z: 0 }, activePelletIndex: 0 }
    ];

    const weights = {
      ...DEFAULT_FITNESS_WEIGHTS,
      baseFitness: 10,
      pelletWeight: 0,
      movementWeight: 2,
      movementCap: 100
    };

    const result = recalculateFitnessOverTime(frames, [], weights, null);

    expect(result[0]).toBe(10); // No movement yet
    expect(result[1]).toBe(20); // 10 base + 5 distance * 2 weight = 20
  });

  it('respects movement cap', () => {
    const frames: SimulationFrame[] = [
      { time: 0, nodePositions: new Map(), centerOfMass: { x: 0, y: 0, z: 0 }, activePelletIndex: 0 },
      { time: 0.1, nodePositions: new Map(), centerOfMass: { x: 100, y: 0, z: 0 }, activePelletIndex: 0 }
    ];

    const weights = {
      ...DEFAULT_FITNESS_WEIGHTS,
      baseFitness: 10,
      pelletWeight: 0,
      movementWeight: 10,
      movementCap: 50
    };

    const result = recalculateFitnessOverTime(frames, [], weights, null);

    // 100 distance * 10 weight = 1000, but capped at 50
    expect(result[1]).toBe(60); // 10 base + 50 capped
  });

  it('returns array with length matching frames', () => {
    const frames: SimulationFrame[] = Array.from({ length: 10 }, (_, i) => ({
      time: i * 0.1,
      nodePositions: new Map(),
      centerOfMass: { x: i, y: 0, z: 0 },
      activePelletIndex: 0
    }));

    const result = recalculateFitnessOverTime(frames, [], DEFAULT_FITNESS_WEIGHTS, null);

    expect(result.length).toBe(10);
  });
});
