import { describe, it, expect, beforeEach } from 'vitest';
import { Creature } from '../core/Creature';
import { generateRandomGenome } from '../core/Genome';
import {
  truncationSelection,
  tournamentSelection,
  getElites,
  rankBasedProbabilities,
  weightedRandomSelect
} from '../genetics/Selection';
import { singlePointCrossover, uniformCrossover, cloneGenome } from '../genetics/Crossover';
import { mutateGenome, mutateNode, mutateMuscle, DEFAULT_MUTATION_CONFIG } from '../genetics/Mutation';
import { DEFAULT_GENOME_CONSTRAINTS } from '../types';

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

