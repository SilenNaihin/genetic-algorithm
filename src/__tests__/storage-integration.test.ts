/**
 * Integration tests for RunStorage using actual IndexedDB (via fake-indexeddb)
 * These tests verify the real storage implementation, not a mock
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { RunStorage, CompactCreatureResult, recalculateFitnessOverTime } from '../storage/RunStorage';
import { generateRandomGenome } from '../core/Genome';
import { DEFAULT_CONFIG, type FitnessHistoryEntry, type Vector3, type SimulationConfig } from '../types';
import type { CreatureSimulationResult, SimulationFrame, PelletData } from '../simulation/BatchSimulator';

// Helper to create a mock simulation result
function createMockSimulationResult(
  fitness: number = 100,
  pelletsCollected: number = 2,
  frameCount: number = 10
): CreatureSimulationResult {
  const genome = generateRandomGenome();
  const frames: SimulationFrame[] = [];
  const fitnessOverTime: number[] = [];

  for (let i = 0; i < frameCount; i++) {
    const nodePositions = new Map<string, Vector3>();
    for (const node of genome.nodes) {
      nodePositions.set(node.id, {
        x: Math.random() * 10,
        y: 0.5 + Math.random(),
        z: Math.random() * 10
      });
    }

    frames.push({
      time: i * 0.1,
      nodePositions,
      centerOfMass: { x: i * 0.5, y: 0.5, z: i * 0.3 },
      activePelletIndex: 0
    });
    fitnessOverTime.push(fitness * (i / frameCount));
  }

  const pellets: PelletData[] = [
    { id: 'p1', position: { x: 5, y: 0.3, z: 5 }, collectedAtFrame: 5, spawnedAtFrame: 0, initialDistance: 7 },
    { id: 'p2', position: { x: 10, y: 0.5, z: 10 }, collectedAtFrame: null, spawnedAtFrame: 5, initialDistance: 8 }
  ];

  return {
    genome,
    frames,
    finalFitness: fitness,
    pelletsCollected,
    distanceTraveled: frameCount * 0.5,
    netDisplacement: frameCount * 0.3,
    closestPelletDistance: 2.5,
    pellets,
    fitnessOverTime,
    disqualified: null
  };
}

describe('RunStorage Integration', () => {
  let storage: RunStorage;

  beforeEach(async () => {
    // Clear IndexedDB before each test
    indexedDB = new IDBFactory();
    storage = new RunStorage();
    await storage.init();
  });

  afterEach(() => {
    // Reset for next test
    indexedDB = new IDBFactory();
  });

  describe('Database Initialization', () => {
    it('initializes without error', async () => {
      const newStorage = new RunStorage();
      await expect(newStorage.init()).resolves.not.toThrow();
    });

    it('can be initialized multiple times safely', async () => {
      const newStorage = new RunStorage();
      await newStorage.init();
      await expect(newStorage.init()).resolves.not.toThrow();
    });
  });

  describe('Run Lifecycle', () => {
    it('creates a run with unique ID', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);

      expect(runId).toBeDefined();
      expect(runId.startsWith('run_')).toBe(true);
      expect(storage.getCurrentRunId()).toBe(runId);
    });

    it('stores run config correctly', async () => {
      const customConfig = { ...DEFAULT_CONFIG, populationSize: 50, simulationDuration: 15 };
      const runId = await storage.createRun(customConfig);

      const run = await storage.getRun(runId);

      expect(run).not.toBeNull();
      expect(run?.config.populationSize).toBe(50);
      expect(run?.config.simulationDuration).toBe(15);
    });

    it('initializes run with generationCount 0', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const run = await storage.getRun(runId);

      expect(run?.generationCount).toBe(0);
    });

    it('creates multiple runs with different IDs', async () => {
      const runId1 = await storage.createRun(DEFAULT_CONFIG);
      await new Promise(resolve => setTimeout(resolve, 5)); // Ensure different timestamps
      const runId2 = await storage.createRun(DEFAULT_CONFIG);

      expect(runId1).not.toBe(runId2);
    });
  });

  describe('Generation Storage', () => {
    it('saves and loads generation results', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const results = [createMockSimulationResult(100), createMockSimulationResult(80)];

      await storage.saveGeneration(0, results);
      const loaded = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);

      expect(loaded).not.toBeNull();
      expect(loaded?.length).toBe(2);
    });

    it('preserves genome ID through save/load cycle', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult();
      const originalGenomeId = result.genome.id;

      await storage.saveGeneration(0, [result]);
      const loaded = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);

      expect(loaded?.[0].genome.id).toBe(originalGenomeId);
    });

    it('preserves fitness values through save/load cycle', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult(123.456);

      await storage.saveGeneration(0, [result]);
      const loaded = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);

      // Fitness is rounded to 3 decimal places
      expect(loaded?.[0].finalFitness).toBeCloseTo(123.456, 2);
    });

    it('preserves pellets collected through save/load cycle', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult(100, 5);

      await storage.saveGeneration(0, [result]);
      const loaded = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);

      expect(loaded?.[0].pelletsCollected).toBe(5);
    });

    it('updates generationCount after saving', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const results = [createMockSimulationResult()];

      await storage.saveGeneration(0, results);
      let run = await storage.getRun(runId);
      expect(run?.generationCount).toBe(1);

      await storage.saveGeneration(1, results);
      run = await storage.getRun(runId);
      expect(run?.generationCount).toBe(2);
    });

    it('returns null for non-existent generation', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const loaded = await storage.loadGeneration(runId, 99, DEFAULT_CONFIG);

      expect(loaded).toBeNull();
    });

    it('stores multiple generations independently', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const results0 = [createMockSimulationResult(100)];
      const results1 = [createMockSimulationResult(150)];

      await storage.saveGeneration(0, results0);
      await storage.saveGeneration(1, results1);

      const loaded0 = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);
      const loaded1 = await storage.loadGeneration(runId, 1, DEFAULT_CONFIG);

      expect(loaded0?.[0].finalFitness).toBeCloseTo(100, 2);
      expect(loaded1?.[0].finalFitness).toBeCloseTo(150, 2);
    });
  });

  describe('Frame Compaction and Expansion', () => {
    it('compacts frames to number arrays', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult(100, 2, 20);

      await storage.saveGeneration(0, [result]);
      const loaded = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);

      // Frames should be reconstructed
      expect(loaded?.[0].frames.length).toBe(20);
      expect(loaded?.[0].frames[0].nodePositions).toBeInstanceOf(Map);
    });

    it('preserves node positions through compaction', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult(100, 2, 5);
      const originalFirstFrame = result.frames[0];
      const firstNodeId = result.genome.nodes[0].id;
      const originalPosition = originalFirstFrame.nodePositions.get(firstNodeId)!;

      await storage.saveGeneration(0, [result]);
      const loaded = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);

      const loadedPosition = loaded?.[0].frames[0].nodePositions.get(firstNodeId);

      // Positions are rounded to 3 decimal places
      expect(loadedPosition?.x).toBeCloseTo(originalPosition.x, 2);
      expect(loadedPosition?.y).toBeCloseTo(originalPosition.y, 2);
      expect(loadedPosition?.z).toBeCloseTo(originalPosition.z, 2);
    });

    it('recalculates center of mass on expansion', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult(100, 2, 5);

      await storage.saveGeneration(0, [result]);
      const loaded = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);

      const frame = loaded?.[0].frames[0];
      expect(frame?.centerOfMass).toHaveProperty('x');
      expect(frame?.centerOfMass).toHaveProperty('y');
      expect(frame?.centerOfMass).toHaveProperty('z');
    });

    it('preserves pellet data through compaction', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult(100, 2, 10);

      await storage.saveGeneration(0, [result]);
      const loaded = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);

      expect(loaded?.[0].pellets.length).toBe(2);
      expect(loaded?.[0].pellets[0].collectedAtFrame).toBe(5);
      expect(loaded?.[0].pellets[1].collectedAtFrame).toBeNull();
    });
  });

  describe('Fitness History', () => {
    it('stores fitness history', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const history: FitnessHistoryEntry[] = [
        { generation: 0, best: 100, average: 50, worst: 10 },
        { generation: 1, best: 150, average: 75, worst: 20 }
      ];

      await storage.updateFitnessHistory(history);
      const run = await storage.getRun(runId);

      expect(run?.fitnessHistory).toEqual(history);
    });

    it('overwrites previous fitness history', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);

      await storage.updateFitnessHistory([{ generation: 0, best: 100, average: 50, worst: 10 }]);
      await storage.updateFitnessHistory([
        { generation: 0, best: 100, average: 50, worst: 10 },
        { generation: 1, best: 150, average: 75, worst: 20 }
      ]);

      const run = await storage.getRun(runId);

      expect(run?.fitnessHistory?.length).toBe(2);
    });

    it('fitness history persists after simulated reload', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);

      // Save multiple generations of fitness history
      const history = [
        { generation: 0, best: 100, average: 50, worst: 10 },
        { generation: 1, best: 150, average: 75, worst: 20 },
        { generation: 2, best: 180, average: 90, worst: 30 },
        { generation: 3, best: 200, average: 100, worst: 40 },
        { generation: 4, best: 220, average: 110, worst: 50 }
      ];
      await storage.updateFitnessHistory(history);

      // Also save some generations to make it realistic
      for (let gen = 0; gen <= 4; gen++) {
        const results = [createMockSimulationResult(100 + gen * 20)];
        await storage.saveGeneration(gen, results);
      }

      // Simulate app "restart" by clearing currentRunId
      storage.setCurrentRunId(null);

      // Load the run fresh (like loadRun does after restart)
      const loadedRun = await storage.getRun(runId);

      // Verify fitness history persisted
      expect(loadedRun?.fitnessHistory).toBeDefined();
      expect(loadedRun?.fitnessHistory?.length).toBe(5);
      expect(loadedRun?.fitnessHistory?.[0]).toEqual({ generation: 0, best: 100, average: 50, worst: 10 });
      expect(loadedRun?.fitnessHistory?.[4]).toEqual({ generation: 4, best: 220, average: 110, worst: 50 });
    });

    it('fitness history persists after saveGeneration calls (interleaved)', async () => {
      // This test mimics the actual app flow: after each generation,
      // saveGeneration and updateFitnessHistory are both called
      const runId = await storage.createRun(DEFAULT_CONFIG);

      // Simulate running 5 generations with interleaved saves
      for (let gen = 0; gen <= 4; gen++) {
        // Save generation data
        const results = [createMockSimulationResult(100 + gen * 20)];
        await storage.saveGeneration(gen, results);

        // Update fitness history (full array up to current gen)
        const history = [];
        for (let g = 0; g <= gen; g++) {
          history.push({
            generation: g,
            best: 100 + g * 20,
            average: 50 + g * 10,
            worst: 10 + g * 5
          });
        }
        await storage.updateFitnessHistory(history);
      }

      // Simulate app "restart"
      storage.setCurrentRunId(null);

      // Load run fresh
      const loadedRun = await storage.getRun(runId);

      // Verify all 5 generations of fitness history persisted
      expect(loadedRun?.fitnessHistory).toBeDefined();
      expect(loadedRun?.fitnessHistory?.length).toBe(5);
      expect(loadedRun?.generationCount).toBe(5);

      // Verify data integrity
      for (let g = 0; g <= 4; g++) {
        expect(loadedRun?.fitnessHistory?.[g]?.generation).toBe(g);
        expect(loadedRun?.fitnessHistory?.[g]?.best).toBe(100 + g * 20);
      }
    });
  });

  describe('Creature Type History', () => {
    it('stores creature type distribution', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const history = [
        { generation: 0, nodeCountDistribution: new Map([[3, 10], [4, 8], [5, 2]]) },
        { generation: 1, nodeCountDistribution: new Map([[3, 8], [4, 10], [5, 2]]) }
      ];

      await storage.updateCreatureTypeHistory(history);
      const run = await storage.getRun(runId);

      expect(run?.creatureTypeHistory).toBeDefined();
      expect(run?.creatureTypeHistory?.length).toBe(2);
    });

    it('converts Map to array format for storage', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const history = [
        { generation: 0, nodeCountDistribution: new Map([[3, 10], [4, 5]]) }
      ];

      await storage.updateCreatureTypeHistory(history);
      const run = await storage.getRun(runId);

      // Stored as array of [nodeCount, count] pairs
      expect(run?.creatureTypeHistory?.[0].nodeCountDistribution).toEqual([[3, 10], [4, 5]]);
    });
  });

  describe('Best Creature Tracking', () => {
    it('stores best creature', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult(250);

      await storage.updateBestCreature(result, 5);
      const run = await storage.getRun(runId);

      expect(run?.bestCreature).toBeDefined();
      expect(run?.bestCreature?.generation).toBe(5);
      expect(run?.bestCreature?.result.fitness).toBeCloseTo(250, 2);
    });

    it('stores best creature genome', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult(250);
      const genomeId = result.genome.id;

      await storage.updateBestCreature(result, 5);
      const run = await storage.getRun(runId);

      expect(run?.bestCreature?.result.genome.id).toBe(genomeId);
    });

    it('can expand best creature result', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult(250, 3, 15);

      await storage.updateBestCreature(result, 5);
      const run = await storage.getRun(runId);

      const expanded = storage.expandCreatureResult(run!.bestCreature!.result, DEFAULT_CONFIG);

      expect(expanded.genome.id).toBe(result.genome.id);
      expect(expanded.finalFitness).toBeCloseTo(250, 2);
      expect(expanded.frames.length).toBe(15);
    });

    it('bestCreature persists after saving more generations', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const bestResult = createMockSimulationResult(300);
      const bestGenomeId = bestResult.genome.id;

      // Save best creature at gen 5
      await storage.updateBestCreature(bestResult, 5);

      // Save more generations (simulating continued evolution)
      for (let gen = 6; gen <= 10; gen++) {
        const results = [createMockSimulationResult(100 + gen)]; // Lower fitness than best
        await storage.saveGeneration(gen, results);
      }

      // Verify best creature is still the one from gen 5
      const run = await storage.getRun(runId);
      expect(run?.bestCreature).toBeDefined();
      expect(run?.bestCreature?.generation).toBe(5);
      expect(run?.bestCreature?.result.fitness).toBeCloseTo(300, 2);
      expect(run?.bestCreature?.result.genome.id).toBe(bestGenomeId);
    });

    it('bestCreature persists after updating fitness history', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const bestResult = createMockSimulationResult(500);
      const bestGenomeId = bestResult.genome.id;

      // Save best creature
      await storage.updateBestCreature(bestResult, 10);

      // Update fitness history multiple times
      await storage.updateFitnessHistory([{ generation: 0, best: 100, average: 50, worst: 10 }]);
      await storage.updateFitnessHistory([
        { generation: 0, best: 100, average: 50, worst: 10 },
        { generation: 1, best: 150, average: 75, worst: 20 }
      ]);

      // Verify best creature is still there
      const run = await storage.getRun(runId);
      expect(run?.bestCreature).toBeDefined();
      expect(run?.bestCreature?.generation).toBe(10);
      expect(run?.bestCreature?.result.fitness).toBeCloseTo(500, 2);
      expect(run?.bestCreature?.result.genome.id).toBe(bestGenomeId);
    });

    it('bestCreature persists after reload (simulated)', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const bestResult = createMockSimulationResult(400);
      const bestGenomeId = bestResult.genome.id;

      // Save best creature
      await storage.updateBestCreature(bestResult, 7);

      // Simulate "closing" by clearing currentRunId and "reopening" by getting run fresh
      storage.setCurrentRunId(null);

      // Get the run as if loading it fresh
      const loadedRun = await storage.getRun(runId);

      expect(loadedRun?.bestCreature).toBeDefined();
      expect(loadedRun?.bestCreature?.generation).toBe(7);
      expect(loadedRun?.bestCreature?.result.fitness).toBeCloseTo(400, 2);
      expect(loadedRun?.bestCreature?.result.genome.id).toBe(bestGenomeId);
    });

    it('early generation best creature is preserved over lower-fitness later generations', async () => {
      // This test catches the bug where bestCreature shows recent generation's best
      // instead of the all-time best from an earlier generation
      const runId = await storage.createRun(DEFAULT_CONFIG);

      // Generation 5 has the all-time best (fitness 500)
      const allTimeBest = createMockSimulationResult(500);
      allTimeBest.genome.id = 'all-time-best-genome';
      await storage.updateBestCreature(allTimeBest, 5);

      // Save several later generations with LOWER fitness
      for (let gen = 6; gen <= 20; gen++) {
        const results = [
          createMockSimulationResult(200 + gen),  // Lower than 500
          createMockSimulationResult(150 + gen),
          createMockSimulationResult(100 + gen)
        ];
        await storage.saveGeneration(gen, results);
      }

      // Simulate app reload - clear currentRunId
      storage.setCurrentRunId(null);

      // Load the run fresh (like loadRun does)
      const loadedRun = await storage.getRun(runId);

      // Most recent generation (20) has best fitness of ~220, but all-time best is 500
      // The bug would show gen 20's best instead of gen 5's best
      expect(loadedRun?.bestCreature).toBeDefined();
      expect(loadedRun?.bestCreature?.generation).toBe(5);
      expect(loadedRun?.bestCreature?.result.fitness).toBeCloseTo(500, 2);
      expect(loadedRun?.bestCreature?.result.genome.id).toBe('all-time-best-genome');
    });
  });

  describe('Longest Survivor Tracking', () => {
    it('stores longest survivor with diedAtGeneration', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult(150);
      result.genome.survivalStreak = 12;

      await storage.updateLongestSurvivor(result, 12, 25);
      const run = await storage.getRun(runId);

      expect(run?.longestSurvivor).toBeDefined();
      expect(run?.longestSurvivor?.generations).toBe(12);
      expect(run?.longestSurvivor?.diedAtGeneration).toBe(25);
    });

    it('preserves survival streak in genome', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult(150);
      result.genome.survivalStreak = 8;

      await storage.updateLongestSurvivor(result, 8, 10);
      const run = await storage.getRun(runId);

      expect(run?.longestSurvivor?.result.genome.survivalStreak).toBe(8);
    });
  });

  describe('Run Management', () => {
    it('lists all runs', async () => {
      await storage.createRun(DEFAULT_CONFIG);
      await new Promise(resolve => setTimeout(resolve, 5));
      await storage.createRun(DEFAULT_CONFIG);

      const runs = await storage.getAllRuns();

      expect(runs.length).toBe(2);
    });

    it('returns runs sorted by startTime descending', async () => {
      const runId1 = await storage.createRun(DEFAULT_CONFIG);
      await new Promise(resolve => setTimeout(resolve, 10));
      const runId2 = await storage.createRun(DEFAULT_CONFIG);

      const runs = await storage.getAllRuns();

      expect(runs[0].id).toBe(runId2); // Most recent first
      expect(runs[1].id).toBe(runId1);
    });

    it('deletes run and all its generations', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const results = [createMockSimulationResult()];

      await storage.saveGeneration(0, results);
      await storage.saveGeneration(1, results);

      await storage.deleteRun(runId);

      const run = await storage.getRun(runId);
      const gen0 = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);
      const gen1 = await storage.loadGeneration(runId, 1, DEFAULT_CONFIG);

      expect(run).toBeNull();
      expect(gen0).toBeNull();
      expect(gen1).toBeNull();
    });

    it('updates run name', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);

      await storage.updateRunName(runId, 'My Awesome Run');
      const run = await storage.getRun(runId);

      expect(run?.name).toBe('My Awesome Run');
    });

    it('returns max generation correctly', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const results = [createMockSimulationResult()];

      await storage.saveGeneration(0, results);
      await storage.saveGeneration(1, results);
      await storage.saveGeneration(2, results);

      const maxGen = await storage.getMaxGeneration(runId);

      expect(maxGen).toBe(2);
    });
  });

  describe('Fork Run', () => {
    it('creates new run from existing run', async () => {
      const sourceId = await storage.createRun(DEFAULT_CONFIG);
      const results = [createMockSimulationResult(100)];
      await storage.saveGeneration(0, results);
      await storage.saveGeneration(1, results);
      await storage.saveGeneration(2, results);

      // Small delay to ensure different timestamp for fork
      await new Promise(resolve => setTimeout(resolve, 5));

      const newId = await storage.forkRun(sourceId, 1);

      expect(newId).not.toBe(sourceId);
      expect(storage.getCurrentRunId()).toBe(newId);
    });

    it('copies generations up to specified point', async () => {
      const sourceId = await storage.createRun(DEFAULT_CONFIG);
      const results0 = [createMockSimulationResult(100)];
      const results1 = [createMockSimulationResult(150)];
      const results2 = [createMockSimulationResult(200)];

      await storage.saveGeneration(0, results0);
      await storage.saveGeneration(1, results1);
      await storage.saveGeneration(2, results2);

      // Small delay to ensure different timestamp for fork
      await new Promise(resolve => setTimeout(resolve, 5));

      const newId = await storage.forkRun(sourceId, 1);

      // Verify forked run has correct generationCount
      const forkedRun = await storage.getRun(newId);
      expect(forkedRun?.generationCount).toBe(2); // 0 and 1

      const gen0 = await storage.loadGeneration(newId, 0, DEFAULT_CONFIG);
      const gen1 = await storage.loadGeneration(newId, 1, DEFAULT_CONFIG);
      const gen2 = await storage.loadGeneration(newId, 2, DEFAULT_CONFIG);

      expect(gen0).not.toBeNull();
      expect(gen1).not.toBeNull();
      // Gen2 should not exist in forked run
      expect(gen2).toBeNull();
    });

    it('copies fitness history up to fork point', async () => {
      const sourceId = await storage.createRun(DEFAULT_CONFIG);
      const results = [createMockSimulationResult()];

      await storage.saveGeneration(0, results);
      await storage.saveGeneration(1, results);
      await storage.saveGeneration(2, results);

      await storage.updateFitnessHistory([
        { generation: 0, best: 100, average: 50, worst: 10 },
        { generation: 1, best: 150, average: 75, worst: 20 },
        { generation: 2, best: 200, average: 100, worst: 30 }
      ]);

      const newId = await storage.forkRun(sourceId, 1);
      const newRun = await storage.getRun(newId);

      expect(newRun?.fitnessHistory?.length).toBe(2); // Only gen 0 and 1
    });

    it('copies creature type history up to fork point', async () => {
      const sourceId = await storage.createRun(DEFAULT_CONFIG);
      const results = [createMockSimulationResult()];

      await storage.saveGeneration(0, results);
      await storage.saveGeneration(1, results);

      await storage.updateCreatureTypeHistory([
        { generation: 0, nodeCountDistribution: new Map([[3, 10]]) },
        { generation: 1, nodeCountDistribution: new Map([[3, 8], [4, 2]]) }
      ]);

      const newId = await storage.forkRun(sourceId, 0);
      const newRun = await storage.getRun(newId);

      expect(newRun?.creatureTypeHistory?.length).toBe(1); // Only gen 0
    });

    it('preserves best creature if within fork range', async () => {
      const sourceId = await storage.createRun(DEFAULT_CONFIG);
      const results = [createMockSimulationResult(200)];

      await storage.saveGeneration(0, results);
      await storage.updateBestCreature(results[0], 0);
      await storage.saveGeneration(1, [createMockSimulationResult(100)]);

      const newId = await storage.forkRun(sourceId, 1);
      const newRun = await storage.getRun(newId);

      expect(newRun?.bestCreature?.generation).toBe(0);
    });

    it('excludes best creature if beyond fork range', async () => {
      const sourceId = await storage.createRun(DEFAULT_CONFIG);

      await storage.saveGeneration(0, [createMockSimulationResult(100)]);
      await storage.saveGeneration(1, [createMockSimulationResult(150)]);
      await storage.saveGeneration(2, [createMockSimulationResult(300)]);
      await storage.updateBestCreature(createMockSimulationResult(300), 2);

      const newId = await storage.forkRun(sourceId, 1);
      const newRun = await storage.getRun(newId);

      expect(newRun?.bestCreature).toBeUndefined();
    });

    it('sets correct generationCount on forked run', async () => {
      const sourceId = await storage.createRun(DEFAULT_CONFIG);

      await storage.saveGeneration(0, [createMockSimulationResult()]);
      await storage.saveGeneration(1, [createMockSimulationResult()]);
      await storage.saveGeneration(2, [createMockSimulationResult()]);

      const newId = await storage.forkRun(sourceId, 1);
      const newRun = await storage.getRun(newId);

      expect(newRun?.generationCount).toBe(2); // 0 and 1
    });

    it('throws error for non-existent source run', async () => {
      await expect(storage.forkRun('non_existent', 0)).rejects.toThrow('Source run not found');
    });
  });

  describe('Data Integrity', () => {
    it('genome nodes survive round-trip', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult();
      const originalNodeCount = result.genome.nodes.length;
      const originalNodeIds = result.genome.nodes.map(n => n.id);

      await storage.saveGeneration(0, [result]);
      const loaded = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);

      expect(loaded?.[0].genome.nodes.length).toBe(originalNodeCount);
      expect(loaded?.[0].genome.nodes.map(n => n.id)).toEqual(originalNodeIds);
    });

    it('genome muscles survive round-trip', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult();
      const originalMuscleCount = result.genome.muscles.length;

      await storage.saveGeneration(0, [result]);
      const loaded = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);

      expect(loaded?.[0].genome.muscles.length).toBe(originalMuscleCount);
    });

    it('genome parent IDs survive round-trip', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult();
      result.genome.parentIds = ['parent1', 'parent2'];

      await storage.saveGeneration(0, [result]);
      const loaded = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);

      expect(loaded?.[0].genome.parentIds).toEqual(['parent1', 'parent2']);
    });

    it('genome generation number survives round-trip', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult();
      result.genome.generation = 42;

      await storage.saveGeneration(0, [result]);
      const loaded = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);

      expect(loaded?.[0].genome.generation).toBe(42);
    });

    it('disqualified creatures are preserved', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult();
      (result as any).disqualified = 'frequency_exceeded';

      await storage.saveGeneration(0, [result]);
      const loaded = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);

      expect(loaded?.[0].disqualified).toBe('frequency_exceeded');
    });

    it('neural genome weights survive round-trip', async () => {
      const runId = await storage.createRun(DEFAULT_CONFIG);
      const result = createMockSimulationResult();
      result.genome.neuralGenome = {
        topology: { inputSize: 6, hiddenSize: 8, outputSize: 4 },
        weights: Array(104).fill(0).map(() => Math.random()), // 6*8 + 8 + 8*4 + 4 = 104
        activation: 'tanh'
      };

      await storage.saveGeneration(0, [result]);
      const loaded = await storage.loadGeneration(runId, 0, DEFAULT_CONFIG);

      expect(loaded?.[0].genome.neuralGenome).toBeDefined();
      expect(loaded?.[0].genome.neuralGenome?.weights.length).toBe(104);
    });
  });

  describe('Concurrent Access', () => {
    it('handles multiple simultaneous saves', async () => {
      await storage.createRun(DEFAULT_CONFIG);

      const results = Array.from({ length: 5 }, (_, i) => createMockSimulationResult(i * 10));

      // Save all generations concurrently
      await Promise.all([
        storage.saveGeneration(0, [results[0]]),
        storage.saveGeneration(1, [results[1]]),
        storage.saveGeneration(2, [results[2]]),
        storage.saveGeneration(3, [results[3]]),
        storage.saveGeneration(4, [results[4]])
      ]);

      // Verify all were saved
      const runId = storage.getCurrentRunId()!;
      for (let i = 0; i < 5; i++) {
        const loaded = await storage.loadGeneration(runId, i, DEFAULT_CONFIG);
        expect(loaded).not.toBeNull();
      }
    });
  });
});

describe('recalculateFitnessOverTime', () => {
  const createFrames = (count: number, movement: number = 1): SimulationFrame[] => {
    return Array.from({ length: count }, (_, i) => ({
      time: i * 0.1,
      nodePositions: new Map(),
      centerOfMass: { x: i * movement, y: 0.5, z: 0 },
      activePelletIndex: 0
    }));
  };

  it('returns empty array for no frames', () => {
    const result = recalculateFitnessOverTime([], [], DEFAULT_CONFIG, null);
    expect(result).toEqual([]);
  });

  it('returns array of 0s for disqualified creature', () => {
    const frames = createFrames(5);
    const result = recalculateFitnessOverTime(frames, [], DEFAULT_CONFIG, 'frequency_exceeded');
    expect(result).toEqual([0, 0, 0, 0, 0]);
  });

  it('increases fitness with pellet collection', () => {
    const frames = createFrames(3, 0);
    const pellets: PelletData[] = [
      { id: 'p1', position: { x: 0, y: 0, z: 0 }, collectedAtFrame: 1, spawnedAtFrame: 0, initialDistance: 5 }
    ];
    const config = { ...DEFAULT_CONFIG, fitnessPelletPoints: 100 };

    const result = recalculateFitnessOverTime(frames, pellets, config, null);

    // Frame 0: no pellet collected yet, only progress/movement bonus
    // Frame 1+: pellet collected, so 100 points
    expect(result[1]).toBeGreaterThanOrEqual(100); // After collection
    expect(result[2]).toBeGreaterThanOrEqual(100); // Still collected
  });

  it('returns array length matching frame count', () => {
    const frames = createFrames(100);
    const result = recalculateFitnessOverTime(frames, [], DEFAULT_CONFIG, null);

    expect(result.length).toBe(100);
  });
});
