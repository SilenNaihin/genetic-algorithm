/**
 * End-to-end integration tests for the evolution pipeline
 * Tests the complete flow: genome generation → simulation → selection → crossover/mutation → next generation
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { generateRandomGenome } from '../core/Genome';
import { Creature } from '../core/Creature';
import { Population } from '../genetics/Population';
import { simulatePopulation, simulateCreature } from '../simulation/BatchSimulator';
import { singlePointCrossover, uniformCrossover, cloneGenome } from '../genetics/Crossover';
import { mutateGenome, DEFAULT_MUTATION_CONFIG } from '../genetics/Mutation';
import { truncationSelection, getElites, rankBasedProbabilities, weightedRandomSelect } from '../genetics/Selection';
import { DEFAULT_CONFIG, DEFAULT_GENOME_CONSTRAINTS, type CreatureGenome } from '../types';

// Shorter config for faster tests
const TEST_CONFIG = {
  ...DEFAULT_CONFIG,
  simulationDuration: 0.5,  // Very short
  populationSize: 10,
  eliteCount: 2
};

describe('Evolution Pipeline', () => {
  describe('Full Generation Cycle', () => {
    it('completes generation 0 → 1 evolution cycle', async () => {
      // Create initial population
      const population = Population.createInitial(TEST_CONFIG);
      expect(population.creatures.length).toBe(10);
      expect(population.generation).toBe(0);

      // Simulate all creatures
      const genomes = population.getGenomes();
      const results = await simulatePopulation(genomes, TEST_CONFIG);

      // Assign fitness back to creatures
      for (let i = 0; i < results.length; i++) {
        population.creatures[i].state.fitness = results[i].finalFitness;
        population.creatures[i].state.pelletsCollected = results[i].pelletsCollected;
      }

      // Evolve to next generation
      const newGenomes = population.evolve();

      expect(newGenomes.length).toBe(10);
      expect(population.generation).toBe(1);
    });

    it('preserves elite genomes across generations', async () => {
      const population = Population.createInitial(TEST_CONFIG);

      // Assign distinct fitness values
      population.creatures.forEach((c, i) => {
        c.state.fitness = (i + 1) * 100;
      });

      // Get top 2 IDs before evolution
      const eliteIds = population.rankByFitness().slice(0, 2).map(c => c.genome.id);

      const newGenomes = population.evolve();

      // Elite genomes should be preserved (same IDs)
      const preservedElites = newGenomes.filter(g => eliteIds.includes(g.id));
      expect(preservedElites.length).toBe(2);
    });

    it('new offspring have incremented generation numbers', async () => {
      const population = Population.createInitial({ ...TEST_CONFIG, cullPercentage: 0.5 });

      population.creatures.forEach((c, i) => {
        c.state.fitness = i * 10;
        c.genome.generation = 0;
      });

      // Track survivor IDs before evolution
      const survivorCount = Math.ceil(population.creatures.length * (1 - TEST_CONFIG.cullPercentage));
      const sortedCreatures = [...population.creatures].sort((a, b) => b.state.fitness - a.state.fitness);
      const survivorIds = new Set(sortedCreatures.slice(0, survivorCount).map(c => c.genome.id));

      const newGenomes = population.evolve();

      // Survivors keep their generation, new offspring should have generation >= 1
      const newOffspring = newGenomes.filter(g => !survivorIds.has(g.id));
      expect(newOffspring.every(g => g.generation >= 1)).toBe(true);
    });

    it('runs 5 generations without error', async () => {
      const population = Population.createInitial(TEST_CONFIG);

      for (let gen = 0; gen < 5; gen++) {
        const genomes = population.getGenomes();
        const results = await simulatePopulation(genomes, TEST_CONFIG);

        for (let i = 0; i < results.length; i++) {
          population.creatures[i].state.fitness = results[i].finalFitness;
        }

        population.evolve();
      }

      expect(population.generation).toBe(5);
    });
  });

  describe('Genome Validity Through Evolution', () => {
    it('all genomes remain valid after crossover', () => {
      for (let i = 0; i < 20; i++) {
        const parent1 = generateRandomGenome();
        const parent2 = generateRandomGenome();
        const child = singlePointCrossover(parent1, parent2);

        // Child should have valid structure
        expect(child.nodes.length).toBeGreaterThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.minNodes);
        expect(child.nodes.length).toBeLessThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.maxNodes);

        // All muscle references should be valid
        const nodeIds = new Set(child.nodes.map(n => n.id));
        for (const muscle of child.muscles) {
          expect(nodeIds.has(muscle.nodeA)).toBe(true);
          expect(nodeIds.has(muscle.nodeB)).toBe(true);
        }
      }
    });

    it('all genomes remain valid after mutation', () => {
      for (let i = 0; i < 20; i++) {
        const original = generateRandomGenome();
        const mutated = mutateGenome(original, { ...DEFAULT_MUTATION_CONFIG, rate: 0.5, structuralRate: 0.3 });

        // Mutated should have valid structure
        expect(mutated.nodes.length).toBeGreaterThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.minNodes);
        expect(mutated.nodes.length).toBeLessThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.maxNodes);

        // All muscle references should be valid
        const nodeIds = new Set(mutated.nodes.map(n => n.id));
        for (const muscle of mutated.muscles) {
          expect(nodeIds.has(muscle.nodeA)).toBe(true);
          expect(nodeIds.has(muscle.nodeB)).toBe(true);
        }
      }
    });

    it('cloned genomes are independent', () => {
      const original = generateRandomGenome();
      const clone = cloneGenome(original);

      // Modify clone
      clone.nodes[0].size = 999;

      // Original should be unchanged
      expect(original.nodes[0].size).not.toBe(999);
    });

    it('crossover creates genomes with parent lineage', () => {
      const parent1 = generateRandomGenome();
      const parent2 = generateRandomGenome();
      const child = singlePointCrossover(parent1, parent2);

      expect(child.parentIds).toContain(parent1.id);
      expect(child.parentIds).toContain(parent2.id);
    });

    it('clone has single parent lineage', () => {
      const original = generateRandomGenome();
      const clone = cloneGenome(original);

      expect(clone.parentIds).toContain(original.id);
      expect(clone.parentIds.length).toBe(1);
    });
  });

  describe('Selection Pressure', () => {
    it('higher fitness creatures more likely to survive truncation', () => {
      const creatures: Creature[] = [];
      for (let i = 0; i < 100; i++) {
        const c = new Creature(generateRandomGenome());
        c.state.fitness = i;  // 0 to 99
        creatures.push(c);
      }

      const { survivors } = truncationSelection(creatures, 0.5);

      // Top 50 should survive
      const avgSurvivorFitness = survivors.reduce((sum, c) => sum + c.state.fitness, 0) / survivors.length;

      // Average should be around 75 (middle of top 50%)
      expect(avgSurvivorFitness).toBeGreaterThan(50);
    });

    it('rank-based selection favors higher fitness', () => {
      const creatures = [
        createCreatureWithFitness(10),
        createCreatureWithFitness(100)
      ];

      const probs = rankBasedProbabilities(creatures);

      const lowFitProb = probs.get(creatures[0].genome.id) || 0;
      const highFitProb = probs.get(creatures[1].genome.id) || 0;

      expect(highFitProb).toBeGreaterThan(lowFitProb);
    });

    it('elites are always preserved', () => {
      const creatures: Creature[] = [];
      for (let i = 0; i < 20; i++) {
        const c = new Creature(generateRandomGenome());
        c.state.fitness = i * 10;
        creatures.push(c);
      }

      const elites = getElites(creatures, 3);

      expect(elites.length).toBe(3);
      expect(elites[0].state.fitness).toBe(190);
      expect(elites[1].state.fitness).toBe(180);
      expect(elites[2].state.fitness).toBe(170);
    });
  });

  describe('Simulation Consistency', () => {
    it('same genome produces consistent simulation results', async () => {
      const genome = generateRandomGenome();

      // Run simulation twice with same genome
      const result1 = simulateCreature(genome, TEST_CONFIG);
      const result2 = simulateCreature(genome, TEST_CONFIG);

      // Both should complete without error
      expect(result1.finalFitness).toBeGreaterThanOrEqual(0);
      expect(result2.finalFitness).toBeGreaterThanOrEqual(0);

      // Frame counts should match
      expect(result1.frames.length).toBe(result2.frames.length);
    });

    it('all creatures in population get valid fitness', async () => {
      const genomes = Array.from({ length: 10 }, () => generateRandomGenome());
      const results = await simulatePopulation(genomes, TEST_CONFIG);

      for (const result of results) {
        expect(isFinite(result.finalFitness)).toBe(true);
        expect(result.finalFitness).toBeGreaterThanOrEqual(0);
      }
    });

    it('disqualified creatures get fitness 0', async () => {
      // Create a genome likely to be disqualified (extreme frequency)
      const genome = generateRandomGenome();
      for (const muscle of genome.muscles) {
        muscle.frequency = 100;
      }
      genome.globalFrequencyMultiplier = 10;

      const config = { ...TEST_CONFIG, maxAllowedFrequency: 2.0 };
      const result = simulateCreature(genome, config);

      if (result.disqualified) {
        expect(result.finalFitness).toBe(0);
      }
    });
  });

  describe('Survival Streak Tracking', () => {
    it('elite survivors get incremented survival streak', () => {
      const population = Population.createInitial({ ...TEST_CONFIG, eliteCount: 2 });

      // Assign fitness so we know who survives
      population.creatures.forEach((c, i) => {
        c.state.fitness = i * 100;
        c.genome.survivalStreak = 0;
      });

      const topCreatureIds = population.rankByFitness().slice(0, 2).map(c => c.genome.id);
      const newGenomes = population.evolve();

      // Elite genomes should have survivalStreak = 1
      const eliteGenomes = newGenomes.filter(g => topCreatureIds.includes(g.id));
      expect(eliteGenomes.every(g => g.survivalStreak === 1)).toBe(true);
    });

    it('offspring start with survival streak 0', () => {
      const parent1 = generateRandomGenome();
      const parent2 = generateRandomGenome();
      parent1.survivalStreak = 10;
      parent2.survivalStreak = 5;

      const child = singlePointCrossover(parent1, parent2);

      expect(child.survivalStreak).toBe(0);
    });

    it('clones start with survival streak 0', () => {
      const original = generateRandomGenome();
      original.survivalStreak = 15;

      const clone = cloneGenome(original);

      expect(clone.survivalStreak).toBe(0);
    });
  });

  describe('Mutation/Crossover Mode Toggle', () => {
    it('mutation-only mode creates new offspring via cloning', () => {
      const config = { ...TEST_CONFIG, useMutation: true, useCrossover: false, cullPercentage: 0.5 };
      const population = Population.createInitial(config);

      population.creatures.forEach((c, i) => {
        c.state.fitness = i * 10;
      });

      // Track survivor IDs before evolution
      const survivorCount = Math.ceil(population.creatures.length * (1 - config.cullPercentage));
      const sortedCreatures = [...population.creatures].sort((a, b) => b.state.fitness - a.state.fitness);
      const survivorIds = new Set(sortedCreatures.slice(0, survivorCount).map(c => c.genome.id));

      const newGenomes = population.evolve();

      // New offspring (not survivors) should be clones (single parent)
      const newOffspring = newGenomes.filter(g => !survivorIds.has(g.id));

      for (const offspring of newOffspring) {
        expect(offspring.parentIds.length).toBe(1);
      }
    });

    it('crossover-only mode uses two parents for new offspring when crossover rate is high', () => {
      const config = { ...TEST_CONFIG, useMutation: false, useCrossover: true, cullPercentage: 0.5, crossoverRate: 1.0 };
      const population = Population.createInitial(config);

      population.creatures.forEach((c, i) => {
        c.state.fitness = i * 10;
      });

      // Track survivor IDs before evolution
      const survivorCount = Math.ceil(population.creatures.length * (1 - config.cullPercentage));
      const sortedCreatures = [...population.creatures].sort((a, b) => b.state.fitness - a.state.fitness);
      const survivorIds = new Set(sortedCreatures.slice(0, survivorCount).map(c => c.genome.id));

      const newGenomes = population.evolve();

      // New offspring (not survivors) should have two parents (crossover) when crossoverRate is 1.0
      const newOffspring = newGenomes.filter(g => !survivorIds.has(g.id));
      const twoParentCount = newOffspring.filter(g => g.parentIds.length === 2).length;
      expect(twoParentCount).toBeGreaterThan(newOffspring.length / 2);
    });
  });

  describe('Edge Cases', () => {
    it('handles population of 1', async () => {
      const config = { ...TEST_CONFIG, populationSize: 1, eliteCount: 1 };
      const population = Population.createInitial(config);

      expect(population.creatures.length).toBe(1);

      population.creatures[0].state.fitness = 100;

      // Should not throw
      const newGenomes = population.evolve();
      expect(newGenomes.length).toBe(1);
    });

    it('handles all creatures having same fitness', async () => {
      const population = Population.createInitial(TEST_CONFIG);

      // All same fitness
      population.creatures.forEach(c => {
        c.state.fitness = 50;
      });

      // Should not throw
      const newGenomes = population.evolve();
      expect(newGenomes.length).toBe(TEST_CONFIG.populationSize);
    });

    it('handles creatures with 0 fitness', async () => {
      const population = Population.createInitial(TEST_CONFIG);

      population.creatures.forEach(c => {
        c.state.fitness = 0;
      });

      // Should not throw
      const newGenomes = population.evolve();
      expect(newGenomes.length).toBe(TEST_CONFIG.populationSize);
    });

    it('handles genome at minimum node count', () => {
      const constraints = { ...DEFAULT_GENOME_CONSTRAINTS, minNodes: 2, maxNodes: 2 };
      const genome = generateRandomGenome(constraints);

      expect(genome.nodes.length).toBe(2);

      // Mutation should not remove nodes below minimum
      for (let i = 0; i < 10; i++) {
        const mutated = mutateGenome(genome, { ...DEFAULT_MUTATION_CONFIG, structuralRate: 0.5 }, constraints);
        expect(mutated.nodes.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('handles genome at maximum node count', () => {
      const constraints = { ...DEFAULT_GENOME_CONSTRAINTS, minNodes: 5, maxNodes: 5 };
      const genome = generateRandomGenome(constraints);

      expect(genome.nodes.length).toBe(5);

      // Mutation should not add nodes above maximum
      for (let i = 0; i < 10; i++) {
        const mutated = mutateGenome(genome, { ...DEFAULT_MUTATION_CONFIG, structuralRate: 0.5 }, constraints);
        expect(mutated.nodes.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('Performance Characteristics', () => {
    it('simulation scales linearly with population size', async () => {
      const config5 = { ...TEST_CONFIG, populationSize: 5, simulationDuration: 0.2 };
      const config10 = { ...TEST_CONFIG, populationSize: 10, simulationDuration: 0.2 };

      const genomes5 = Array.from({ length: 5 }, () => generateRandomGenome());
      const genomes10 = Array.from({ length: 10 }, () => generateRandomGenome());

      const start5 = performance.now();
      await simulatePopulation(genomes5, config5);
      const time5 = performance.now() - start5;

      const start10 = performance.now();
      await simulatePopulation(genomes10, config10);
      const time10 = performance.now() - start10;

      // 10 creatures should take roughly 2x as long as 5
      expect(time10).toBeGreaterThan(time5);
      expect(time10).toBeLessThan(time5 * 4); // Allow some variance
    });

    it('crossover completes in reasonable time', async () => {
      const parent1 = generateRandomGenome();
      const parent2 = generateRandomGenome();

      const startCrossover = performance.now();
      for (let i = 0; i < 100; i++) {
        singlePointCrossover(parent1, parent2);
      }
      const crossoverTime = performance.now() - startCrossover;

      // 100 crossovers should complete in under 100ms
      expect(crossoverTime).toBeLessThan(100);
    });
  });
});

// Helper function
function createCreatureWithFitness(fitness: number): Creature {
  const genome = generateRandomGenome();
  const creature = new Creature(genome);
  creature.state.fitness = fitness;
  return creature;
}
