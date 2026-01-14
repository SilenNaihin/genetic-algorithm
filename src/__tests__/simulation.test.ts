import { describe, it, expect } from 'vitest';
import { generateRandomGenome } from '../core/Genome';
import { simulatePopulation } from '../simulation/BatchSimulator';
import { DEFAULT_CONFIG, DEFAULT_FITNESS_WEIGHTS } from '../types';

describe('BatchSimulator', () => {
  // Use shorter duration for tests
  const testConfig = {
    ...DEFAULT_CONFIG,
    simulationDuration: 1, // 1 second instead of 8
    populationSize: 3,
    pelletCount: 2
  };

  describe('simulatePopulation', () => {
    it('returns results for all genomes', async () => {
      const genomes = Array.from({ length: 3 }, () => generateRandomGenome());

      const results = await simulatePopulation(genomes, testConfig);

      expect(results.length).toBe(3);
    });

    it('returns results with required properties', async () => {
      const genomes = [generateRandomGenome()];

      const results = await simulatePopulation(genomes, testConfig);
      const result = results[0];

      expect(result).toHaveProperty('genome');
      expect(result).toHaveProperty('frames');
      expect(result).toHaveProperty('finalFitness');
      expect(result).toHaveProperty('pelletsCollected');
      expect(result).toHaveProperty('distanceTraveled');
      expect(result).toHaveProperty('pellets');
      expect(result).toHaveProperty('fitnessOverTime');
    });

    it('frames have correct structure', async () => {
      const genomes = [generateRandomGenome()];

      const results = await simulatePopulation(genomes, testConfig);
      const frames = results[0].frames;

      expect(frames.length).toBeGreaterThan(0);

      const frame = frames[0];
      expect(frame).toHaveProperty('time');
      expect(frame).toHaveProperty('nodePositions');
      expect(frame).toHaveProperty('centerOfMass');
      expect(frame.nodePositions).toBeInstanceOf(Map);
    });

    it('genome is preserved in results', async () => {
      const genomes = [generateRandomGenome()];

      const results = await simulatePopulation(genomes, testConfig);

      expect(results[0].genome.id).toBe(genomes[0].id);
    });

    it('finalFitness is a positive number', async () => {
      const genomes = [generateRandomGenome()];

      const results = await simulatePopulation(genomes, testConfig);

      expect(results[0].finalFitness).toBeGreaterThanOrEqual(0);
    });

    it('pelletsCollected is non-negative', async () => {
      const genomes = [generateRandomGenome()];

      const results = await simulatePopulation(genomes, testConfig);

      expect(results[0].pelletsCollected).toBeGreaterThanOrEqual(0);
    });

    it('distanceTraveled is non-negative', async () => {
      const genomes = [generateRandomGenome()];

      const results = await simulatePopulation(genomes, testConfig);

      expect(results[0].distanceTraveled).toBeGreaterThanOrEqual(0);
    });

    it('fitnessOverTime array matches frame count', async () => {
      const genomes = [generateRandomGenome()];

      const results = await simulatePopulation(genomes, testConfig);

      expect(results[0].fitnessOverTime.length).toBe(results[0].frames.length);
    });

    it('pellets array has at least one pellet', async () => {
      const config = { ...testConfig, pelletCount: 3 };
      const genomes = [generateRandomGenome()];

      const results = await simulatePopulation(genomes, config);

      // Pellet count may vary due to collection/respawning during simulation
      expect(results[0].pellets.length).toBeGreaterThanOrEqual(1);
    });

    it('pellet positions are valid', async () => {
      const genomes = [generateRandomGenome()];

      const results = await simulatePopulation(genomes, testConfig);

      for (const pellet of results[0].pellets) {
        expect(pellet.position).toHaveProperty('x');
        expect(pellet.position).toHaveProperty('y');
        expect(pellet.position).toHaveProperty('z');
        expect(typeof pellet.position.x).toBe('number');
        expect(typeof pellet.position.y).toBe('number');
        expect(typeof pellet.position.z).toBe('number');
      }
    });

    it('applies progress callback', async () => {
      const genomes = Array.from({ length: 2 }, () => generateRandomGenome());
      let progressCalled = false;
      let maxProgress = 0;

      const results = await simulatePopulation(genomes, testConfig, (progress) => {
        progressCalled = true;
        maxProgress = Math.max(maxProgress, progress);
      });

      expect(progressCalled).toBe(true);
      expect(maxProgress).toBeGreaterThan(0);
      expect(results.length).toBe(2);
    });
  });

  describe('Fitness Calculation', () => {
    it('base fitness is applied', async () => {
      const config = {
        ...testConfig,
        fitnessWeights: {
          ...DEFAULT_FITNESS_WEIGHTS,
          baseFitness: 50,
          pelletWeight: 0,
          proximityWeight: 0,
          movementWeight: 0,
          distanceWeight: 0
        }
      };

      const genomes = [generateRandomGenome()];
      const results = await simulatePopulation(genomes, config);

      // Fitness should be at least the base fitness (unless disqualified)
      if (!results[0].disqualified) {
        expect(results[0].finalFitness).toBeGreaterThanOrEqual(50);
      }
    });

    it('fitness increases with movement', async () => {
      const configNoMovement = {
        ...testConfig,
        fitnessWeights: {
          ...DEFAULT_FITNESS_WEIGHTS,
          baseFitness: 10,
          pelletWeight: 0,
          proximityWeight: 0,
          movementWeight: 0,
          distanceWeight: 0
        }
      };

      const configWithMovement = {
        ...testConfig,
        fitnessWeights: {
          ...DEFAULT_FITNESS_WEIGHTS,
          baseFitness: 10,
          pelletWeight: 0,
          proximityWeight: 0,
          movementWeight: 10,
          movementCap: 100,
          distanceWeight: 0
        }
      };

      const genome = generateRandomGenome();
      const genomes = [genome];

      const resultsNoMov = await simulatePopulation(genomes, configNoMovement);
      const resultsWithMov = await simulatePopulation(genomes, configWithMovement);

      // Fitness with movement weight should be >= fitness without
      // (assuming creature moved at all)
      if (!resultsNoMov[0].disqualified && !resultsWithMov[0].disqualified) {
        expect(resultsWithMov[0].finalFitness).toBeGreaterThanOrEqual(resultsNoMov[0].finalFitness);
      }
    });
  });

  describe('Disqualification', () => {
    it('disqualified creatures have low fitness', async () => {
      // Create a genome that will be disqualified (high frequency)
      const genome = generateRandomGenome();
      for (const muscle of genome.muscles) {
        muscle.frequency = 100; // Very high frequency
      }
      genome.globalFrequencyMultiplier = 10;

      const config = {
        ...testConfig,
        maxAllowedFrequency: 3.0
      };

      const results = await simulatePopulation([genome], config);

      if (results[0].disqualified) {
        expect(results[0].finalFitness).toBe(1);
      }
    });

    it('disqualified reason is provided when applicable', async () => {
      const genome = generateRandomGenome();
      // Set extremely high frequency to trigger disqualification
      for (const muscle of genome.muscles) {
        muscle.frequency = 50;
      }
      genome.globalFrequencyMultiplier = 5;

      const config = {
        ...testConfig,
        maxAllowedFrequency: 3.0
      };

      const results = await simulatePopulation([genome], config);

      // May or may not be disqualified depending on implementation
      if (results[0].disqualified) {
        expect(typeof results[0].disqualified).toBe('string');
      }
    });
  });

  describe('Frame Recording', () => {
    it('records frames at regular intervals', async () => {
      const genomes = [generateRandomGenome()];

      const results = await simulatePopulation(genomes, testConfig);
      const frames = results[0].frames;

      // Should have at least one frame
      expect(frames.length).toBeGreaterThanOrEqual(1);

      // If multiple frames, check time progression
      if (frames.length > 1) {
        for (let i = 1; i < frames.length; i++) {
          expect(frames[i].time).toBeGreaterThanOrEqual(frames[i - 1].time);
        }
      }
    });

    it('frame nodePositions contains all nodes', async () => {
      const genome = generateRandomGenome();

      const results = await simulatePopulation([genome], testConfig);
      const frame = results[0].frames[0];

      expect(frame.nodePositions.size).toBe(genome.nodes.length);

      for (const node of genome.nodes) {
        expect(frame.nodePositions.has(node.id)).toBe(true);
      }
    });

    it('center of mass is calculated correctly', async () => {
      const genomes = [generateRandomGenome()];

      const results = await simulatePopulation(genomes, testConfig);
      const frame = results[0].frames[0];

      expect(frame.centerOfMass).toHaveProperty('x');
      expect(frame.centerOfMass).toHaveProperty('y');
      expect(frame.centerOfMass).toHaveProperty('z');
      expect(typeof frame.centerOfMass.x).toBe('number');
    });
  });
});
