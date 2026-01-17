import { describe, it, expect, beforeEach } from 'vitest';
import { Creature } from '../core/Creature';
import { generateRandomGenome } from '../core/Genome';
import { Population } from '../genetics/Population';
import {
  truncationSelection,
  tournamentSelection,
  getElites,
  rankBasedProbabilities,
  weightedRandomSelect
} from '../genetics/Selection';
import { singlePointCrossover, uniformCrossover, cloneGenome } from '../genetics/Crossover';
import { mutateGenome, mutateNode, mutateMuscle, DEFAULT_MUTATION_CONFIG } from '../genetics/Mutation';
import { DEFAULT_CONFIG, DEFAULT_GENOME_CONSTRAINTS } from '../types';

// Helper to create creatures with known fitness values
function createCreatureWithFitness(fitness: number): Creature {
  const genome = generateRandomGenome();
  const creature = new Creature(genome);
  creature.state.fitness = fitness;
  return creature;
}

describe('Selection', () => {
  describe('truncationSelection', () => {
    it('keeps top 50% by default', () => {
      const creatures = [
        createCreatureWithFitness(100),
        createCreatureWithFitness(80),
        createCreatureWithFitness(60),
        createCreatureWithFitness(40),
        createCreatureWithFitness(20),
        createCreatureWithFitness(10)
      ];

      const { survivors, culled } = truncationSelection(creatures);

      expect(survivors.length).toBe(3);
      expect(culled.length).toBe(3);
    });

    it('keeps creatures with highest fitness', () => {
      const creatures = [
        createCreatureWithFitness(10),
        createCreatureWithFitness(100),
        createCreatureWithFitness(50)
      ];

      const { survivors } = truncationSelection(creatures, 0.5);

      // Should keep the top fitness creature
      expect(survivors.some(c => c.state.fitness === 100)).toBe(true);
    });

    it('culls creatures with lowest fitness', () => {
      const creatures = [
        createCreatureWithFitness(10),
        createCreatureWithFitness(100),
        createCreatureWithFitness(50)
      ];

      const { culled } = truncationSelection(creatures, 0.67);

      // Should cull the lowest fitness
      expect(culled.some(c => c.state.fitness === 10)).toBe(true);
    });

    it('keeps at least one creature', () => {
      const creatures = [createCreatureWithFitness(100)];

      const { survivors } = truncationSelection(creatures, 0.1);

      expect(survivors.length).toBeGreaterThanOrEqual(1);
    });

    it('does not modify original array', () => {
      const original = [
        createCreatureWithFitness(10),
        createCreatureWithFitness(100)
      ];
      const originalOrder = original.map(c => c.state.fitness);

      truncationSelection(original);

      expect(original.map(c => c.state.fitness)).toEqual(originalOrder);
    });
  });

  describe('tournamentSelection', () => {
    it('returns requested number of survivors', () => {
      const creatures = Array.from({ length: 10 }, (_, i) =>
        createCreatureWithFitness(i * 10)
      );

      const survivors = tournamentSelection(creatures, 3, 5);

      expect(survivors.length).toBe(5);
    });

    it('selects winner from tournament participants', () => {
      // Test that tournament selection works by selecting from available creatures
      const creatures = [
        createCreatureWithFitness(10),
        createCreatureWithFitness(50),
        createCreatureWithFitness(100)
      ];

      // Request 1 survivor from the population
      const survivors = tournamentSelection([...creatures], 3, 1);

      // Should select exactly one creature
      expect(survivors.length).toBe(1);
      // Should be one of the original creatures
      expect([10, 50, 100]).toContain(survivors[0].state.fitness);
    });
  });

  describe('getElites', () => {
    it('returns top N creatures by fitness', () => {
      const creatures = [
        createCreatureWithFitness(30),
        createCreatureWithFitness(100),
        createCreatureWithFitness(50),
        createCreatureWithFitness(80)
      ];

      const elites = getElites(creatures, 2);

      expect(elites.length).toBe(2);
      expect(elites[0].state.fitness).toBe(100);
      expect(elites[1].state.fitness).toBe(80);
    });

    it('returns all creatures if count exceeds population', () => {
      const creatures = [
        createCreatureWithFitness(50),
        createCreatureWithFitness(100)
      ];

      const elites = getElites(creatures, 10);

      expect(elites.length).toBe(2);
    });

    it('returns empty array for empty population', () => {
      const elites = getElites([], 5);
      expect(elites.length).toBe(0);
    });
  });

  describe('rankBasedProbabilities', () => {
    it('assigns higher probability to fitter creatures', () => {
      const creatures = [
        createCreatureWithFitness(10),
        createCreatureWithFitness(100)
      ];

      const probs = rankBasedProbabilities(creatures);

      const lowFitProb = probs.get(creatures[0].genome.id) || 0;
      const highFitProb = probs.get(creatures[1].genome.id) || 0;

      expect(highFitProb).toBeGreaterThan(lowFitProb);
    });

    it('probabilities sum to approximately 1', () => {
      const creatures = Array.from({ length: 10 }, (_, i) =>
        createCreatureWithFitness(i * 10)
      );

      const probs = rankBasedProbabilities(creatures);

      let sum = 0;
      probs.forEach(p => sum += p);

      expect(sum).toBeCloseTo(1, 5);
    });
  });

  describe('weightedRandomSelect', () => {
    it('returns a creature from the population', () => {
      const creatures = [
        createCreatureWithFitness(50),
        createCreatureWithFitness(100)
      ];
      const probs = rankBasedProbabilities(creatures);

      const selected = weightedRandomSelect(creatures, probs);

      expect(creatures).toContain(selected);
    });
  });
});

describe('Crossover', () => {
  let parent1: ReturnType<typeof generateRandomGenome>;
  let parent2: ReturnType<typeof generateRandomGenome>;

  beforeEach(() => {
    parent1 = generateRandomGenome();
    parent2 = generateRandomGenome();
  });

  describe('singlePointCrossover', () => {
    it('creates child with new id', () => {
      const child = singlePointCrossover(parent1, parent2);
      expect(child.id).not.toBe(parent1.id);
      expect(child.id).not.toBe(parent2.id);
    });

    it('sets correct parent ids', () => {
      const child = singlePointCrossover(parent1, parent2);
      expect(child.parentIds).toContain(parent1.id);
      expect(child.parentIds).toContain(parent2.id);
    });

    it('increments generation', () => {
      parent1.generation = 5;
      parent2.generation = 3;
      const child = singlePointCrossover(parent1, parent2);
      expect(child.generation).toBe(6); // max(5,3) + 1
    });

    it('resets survival streak to 0', () => {
      parent1.survivalStreak = 10;
      parent2.survivalStreak = 5;
      const child = singlePointCrossover(parent1, parent2);
      expect(child.survivalStreak).toBe(0);
    });

    it('creates valid muscle references', () => {
      const child = singlePointCrossover(parent1, parent2);
      const nodeIds = new Set(child.nodes.map(n => n.id));

      for (const muscle of child.muscles) {
        expect(nodeIds.has(muscle.nodeA)).toBe(true);
        expect(nodeIds.has(muscle.nodeB)).toBe(true);
      }
    });

    it('respects maxNodes constraint', () => {
      const constraints = { ...DEFAULT_GENOME_CONSTRAINTS, maxNodes: 3 };
      const child = singlePointCrossover(parent1, parent2, constraints);
      expect(child.nodes.length).toBeLessThanOrEqual(3);
    });

    it('respects maxMuscles constraint', () => {
      const constraints = { ...DEFAULT_GENOME_CONSTRAINTS, maxMuscles: 2 };
      const child = singlePointCrossover(parent1, parent2, constraints);
      expect(child.muscles.length).toBeLessThanOrEqual(2);
    });
  });

  describe('uniformCrossover', () => {
    it('creates child with new id', () => {
      const child = uniformCrossover(parent1, parent2);
      expect(child.id).not.toBe(parent1.id);
      expect(child.id).not.toBe(parent2.id);
    });

    it('sets correct parent ids', () => {
      const child = uniformCrossover(parent1, parent2);
      expect(child.parentIds).toContain(parent1.id);
      expect(child.parentIds).toContain(parent2.id);
    });

    it('creates valid muscle references', () => {
      const child = uniformCrossover(parent1, parent2);
      const nodeIds = new Set(child.nodes.map(n => n.id));

      for (const muscle of child.muscles) {
        expect(nodeIds.has(muscle.nodeA)).toBe(true);
        expect(nodeIds.has(muscle.nodeB)).toBe(true);
      }
    });
  });

  describe('cloneGenome', () => {
    it('creates clone with new id', () => {
      const clone = cloneGenome(parent1);
      expect(clone.id).not.toBe(parent1.id);
    });

    it('sets parent id', () => {
      const clone = cloneGenome(parent1);
      expect(clone.parentIds).toContain(parent1.id);
    });

    it('increments generation', () => {
      parent1.generation = 5;
      const clone = cloneGenome(parent1);
      expect(clone.generation).toBe(6);
    });

    it('preserves node count', () => {
      const clone = cloneGenome(parent1);
      expect(clone.nodes.length).toBe(parent1.nodes.length);
    });

    it('preserves muscle count', () => {
      const clone = cloneGenome(parent1);
      expect(clone.muscles.length).toBe(parent1.muscles.length);
    });

    it('creates new node ids', () => {
      const clone = cloneGenome(parent1);
      const originalIds = new Set(parent1.nodes.map(n => n.id));
      const cloneIds = new Set(clone.nodes.map(n => n.id));

      // No overlap
      for (const id of cloneIds) {
        expect(originalIds.has(id)).toBe(false);
      }
    });

    it('preserves color', () => {
      const clone = cloneGenome(parent1);
      expect(clone.color.h).toBeCloseTo(parent1.color.h);
      expect(clone.color.s).toBeCloseTo(parent1.color.s);
      expect(clone.color.l).toBeCloseTo(parent1.color.l);
    });
  });
});

describe('Mutation', () => {
  describe('mutateGenome', () => {
    it('creates mutated genome with new id', () => {
      const original = generateRandomGenome();
      const mutated = mutateGenome(original);
      expect(mutated.id).not.toBe(original.id);
    });

    it('preserves parent ids (mutation does not change lineage)', () => {
      const original = generateRandomGenome();
      original.parentIds = ['parent1', 'parent2'];
      const mutated = mutateGenome(original);
      expect(mutated.parentIds).toEqual(['parent1', 'parent2']);
    });

    it('preserves generation (mutation does not create new generation)', () => {
      const original = generateRandomGenome();
      original.generation = 5;
      const mutated = mutateGenome(original);
      expect(mutated.generation).toBe(5);
    });

    it('maintains valid muscle references after mutation', () => {
      const original = generateRandomGenome();
      const mutated = mutateGenome(original);
      const nodeIds = new Set(mutated.nodes.map(n => n.id));

      for (const muscle of mutated.muscles) {
        expect(nodeIds.has(muscle.nodeA)).toBe(true);
        expect(nodeIds.has(muscle.nodeB)).toBe(true);
      }
    });

    it('respects minNodes constraint during node removal', () => {
      const constraints = { ...DEFAULT_GENOME_CONSTRAINTS, minNodes: 3 };
      const original = generateRandomGenome(constraints);

      // Run multiple mutations
      let genome = original;
      for (let i = 0; i < 20; i++) {
        genome = mutateGenome(genome, { ...DEFAULT_MUTATION_CONFIG, structuralRate: 0.5 }, constraints);
      }

      expect(genome.nodes.length).toBeGreaterThanOrEqual(constraints.minNodes);
    });

    it('respects maxNodes constraint during node addition', () => {
      const constraints = { ...DEFAULT_GENOME_CONSTRAINTS, maxNodes: 5 };
      const original = generateRandomGenome(constraints);

      // Run multiple mutations with high structural rate
      let genome = original;
      for (let i = 0; i < 20; i++) {
        genome = mutateGenome(genome, { ...DEFAULT_MUTATION_CONFIG, structuralRate: 0.5 }, constraints);
      }

      expect(genome.nodes.length).toBeLessThanOrEqual(constraints.maxNodes);
    });
  });

  describe('mutateNode', () => {
    it('keeps size within constraints', () => {
      const node = {
        id: 'test',
        size: 0.5,
        friction: 0.5,
        position: { x: 0, y: 1, z: 0 }
      };

      for (let i = 0; i < 50; i++) {
        const mutated = mutateNode(node, { rate: 1, magnitude: 1, structuralRate: 0, neuralRate: 0.1, neuralMagnitude: 0.3 }, DEFAULT_GENOME_CONSTRAINTS);
        expect(mutated.size).toBeGreaterThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.minSize);
        expect(mutated.size).toBeLessThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.maxSize);
      }
    });
  });

  describe('mutateMuscle', () => {
    it('keeps frequency within constraints', () => {
      const muscle = {
        id: 'test',
        nodeA: 'a',
        nodeB: 'b',
        restLength: 1,
        stiffness: 100,
        damping: 0.3,
        frequency: 1,
        amplitude: 0.2,
        phase: 0,
        // v1
        directionBias: { x: 1, y: 0, z: 0 },
        biasStrength: 0.5,
        // v2
        velocityBias: { x: 0, y: 1, z: 0 },
        velocityStrength: 0.3,
        distanceBias: 0.5,
        distanceStrength: 0.3
      };

      for (let i = 0; i < 50; i++) {
        const mutated = mutateMuscle(muscle, { rate: 1, magnitude: 1, structuralRate: 0, neuralRate: 0.1, neuralMagnitude: 0.3 }, DEFAULT_GENOME_CONSTRAINTS);
        expect(mutated.frequency).toBeGreaterThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.minFrequency);
        expect(mutated.frequency).toBeLessThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.maxFrequency);
      }
    });

    it('keeps stiffness within constraints', () => {
      const muscle = {
        id: 'test',
        nodeA: 'a',
        nodeB: 'b',
        restLength: 1,
        stiffness: 100,
        damping: 0.3,
        frequency: 1,
        amplitude: 0.2,
        phase: 0,
        // v1
        directionBias: { x: 1, y: 0, z: 0 },
        biasStrength: 0.5,
        // v2
        velocityBias: { x: 0, y: 1, z: 0 },
        velocityStrength: 0.3,
        distanceBias: 0.5,
        distanceStrength: 0.3
      };

      for (let i = 0; i < 50; i++) {
        const mutated = mutateMuscle(muscle, { rate: 1, magnitude: 1, structuralRate: 0, neuralRate: 0.1, neuralMagnitude: 0.3 }, DEFAULT_GENOME_CONSTRAINTS);
        expect(mutated.stiffness).toBeGreaterThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.minStiffness);
        expect(mutated.stiffness).toBeLessThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.maxStiffness);
      }
    });
  });
});

describe('Population', () => {
  describe('createInitial', () => {
    it('creates population with correct size', () => {
      const config = { ...DEFAULT_CONFIG, populationSize: 50 };
      const population = Population.createInitial(config);
      expect(population.creatures.length).toBe(50);
    });

    it('starts at generation 0', () => {
      const population = Population.createInitial();
      expect(population.generation).toBe(0);
    });

    it('creates unique creature genomes', () => {
      const population = Population.createInitial();
      const ids = new Set(population.creatures.map(c => c.genome.id));
      expect(ids.size).toBe(population.creatures.length);
    });
  });

  describe('getGenomes', () => {
    it('returns all genomes', () => {
      const config = { ...DEFAULT_CONFIG, populationSize: 10 };
      const population = Population.createInitial(config);
      const genomes = population.getGenomes();
      expect(genomes.length).toBe(10);
    });
  });

  describe('rankByFitness', () => {
    it('returns creatures sorted by fitness descending', () => {
      const population = Population.createInitial({ ...DEFAULT_CONFIG, populationSize: 5 });

      // Assign known fitness values
      population.creatures[0].state.fitness = 30;
      population.creatures[1].state.fitness = 100;
      population.creatures[2].state.fitness = 50;
      population.creatures[3].state.fitness = 80;
      population.creatures[4].state.fitness = 10;

      const ranked = population.rankByFitness();

      expect(ranked[0].state.fitness).toBe(100);
      expect(ranked[1].state.fitness).toBe(80);
      expect(ranked[2].state.fitness).toBe(50);
      expect(ranked[3].state.fitness).toBe(30);
      expect(ranked[4].state.fitness).toBe(10);
    });
  });

  describe('getStats', () => {
    it('calculates correct statistics', () => {
      const population = Population.createInitial({ ...DEFAULT_CONFIG, populationSize: 4 });

      population.creatures[0].state.fitness = 10;
      population.creatures[1].state.fitness = 20;
      population.creatures[2].state.fitness = 30;
      population.creatures[3].state.fitness = 40;

      const stats = population.getStats();

      expect(stats.bestFitness).toBe(40);
      expect(stats.worstFitness).toBe(10);
      expect(stats.averageFitness).toBe(25);
    });

    it('includes generation number', () => {
      const population = Population.createInitial();
      population.generation = 5;
      const stats = population.getStats();
      expect(stats.generation).toBe(5);
    });
  });

  describe('evolve', () => {
    it('returns genomes for next generation', () => {
      const config = { ...DEFAULT_CONFIG, populationSize: 20 };
      const population = Population.createInitial(config);

      // Assign fitness
      population.creatures.forEach((c, i) => {
        c.state.fitness = i * 10;
      });

      const newGenomes = population.evolve();

      expect(newGenomes.length).toBe(20);
    });

    it('increments generation counter', () => {
      const population = Population.createInitial();
      population.creatures.forEach((c, i) => {
        c.state.fitness = i * 10;
      });

      expect(population.generation).toBe(0);
      population.evolve();
      expect(population.generation).toBe(1);
    });

    it('preserves elite genomes', () => {
      const config = { ...DEFAULT_CONFIG, populationSize: 10, eliteCount: 2 };
      const population = Population.createInitial(config);

      // Assign distinct fitness values
      population.creatures.forEach((c, i) => {
        c.state.fitness = i * 100;
      });

      const topCreatures = population.rankByFitness().slice(0, 2);
      const topIds = new Set(topCreatures.map(c => c.genome.id));

      const newGenomes = population.evolve();

      // Elite genomes should be preserved (with same ID)
      const preservedCount = newGenomes.filter(g => topIds.has(g.id)).length;
      expect(preservedCount).toBe(2);
    });
  });

  describe('getBest', () => {
    it('returns creature with highest fitness', () => {
      const population = Population.createInitial({ ...DEFAULT_CONFIG, populationSize: 5 });

      population.creatures[0].state.fitness = 30;
      population.creatures[1].state.fitness = 100;
      population.creatures[2].state.fitness = 50;

      const best = population.getBest();

      expect(best?.state.fitness).toBe(100);
    });
  });

  describe('dispose', () => {
    it('clears all creatures', () => {
      const population = Population.createInitial({ ...DEFAULT_CONFIG, populationSize: 10 });
      expect(population.creatures.length).toBe(10);

      population.dispose();

      expect(population.creatures.length).toBe(0);
    });
  });
});
