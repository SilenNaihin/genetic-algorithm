import type {
  CreatureGenome,
  SimulationConfig,
  PopulationStats,
  GenomeConstraints
} from '../types';
import { DEFAULT_CONFIG, DEFAULT_GENOME_CONSTRAINTS } from '../types';
import { generateRandomGenome } from '../core/Genome';
import { truncationSelection, rankBasedProbabilities, weightedRandomSelect } from './Selection';
import { mutateGenome, MutationConfig, DEFAULT_MUTATION_CONFIG } from './Mutation';
import { singlePointCrossover, cloneGenome } from './Crossover';
import { Creature } from '../core/Creature';

/**
 * Calculate decayed mutation rate based on generation.
 *
 * Industry-standard approach:
 * - Start rate: 5x the target rate (capped at 50%)
 * - Warmup period: ~50 generations to reach target rate
 *
 * @param endRate - Target mutation rate (from slider)
 * @param generation - Current generation number
 * @param decayMode - 'off', 'linear', or 'exponential'
 * @returns Effective mutation rate for this generation
 */
export function calculateDecayedRate(
  endRate: number,
  generation: number,
  decayMode: 'off' | 'linear' | 'exponential'
): number {
  if (decayMode === 'off') {
    return endRate;
  }

  // Start at 5x target rate, capped at 50%
  const startRate = Math.min(0.5, endRate * 5);

  // Warmup period: rate reaches target after ~50 generations
  const warmupGenerations = 50;

  if (decayMode === 'linear') {
    // Linear decay: rate = start - (start - end) * min(1, gen / warmup)
    const progress = Math.min(1, generation / warmupGenerations);
    return startRate - (startRate - endRate) * progress;
  } else {
    // Exponential decay: rate = end + (start - end) * exp(-gen / tau)
    // tau chosen so that after warmupGenerations, we're at ~5% of the way to end
    // exp(-50/tau) ≈ 0.05 => tau ≈ 16.7
    const tau = warmupGenerations / 3;
    return endRate + (startRate - endRate) * Math.exp(-generation / tau);
  }
}

export class Population {
  creatures: Creature[] = [];
  generation: number = 0;
  config: SimulationConfig;
  genomeConstraints: GenomeConstraints;
  mutationConfig: MutationConfig;

  constructor(
    config: SimulationConfig = DEFAULT_CONFIG,
    genomeConstraints: GenomeConstraints = DEFAULT_GENOME_CONSTRAINTS,
    mutationConfig: MutationConfig = DEFAULT_MUTATION_CONFIG
  ) {
    this.config = config;
    this.genomeConstraints = genomeConstraints;
    this.mutationConfig = {
      ...mutationConfig,
      rate: config.mutationRate,
      magnitude: config.mutationMagnitude,
      neuralRate: config.weightMutationRate,
      neuralMagnitude: config.weightMutationMagnitude
    };
  }

  /**
   * Create initial population with random genomes
   */
  static createInitial(
    config: SimulationConfig = DEFAULT_CONFIG,
    genomeConstraints: GenomeConstraints = DEFAULT_GENOME_CONSTRAINTS
  ): Population {
    const population = new Population(config, genomeConstraints);

    for (let i = 0; i < config.populationSize; i++) {
      // Pass simulation config to enable neural genome initialization if configured
      const genome = generateRandomGenome({
        constraints: genomeConstraints,
        simulationConfig: config
      });
      const creature = new Creature(genome);
      population.creatures.push(creature);
    }

    return population;
  }

  /**
   * Get all genomes in the population
   */
  getGenomes(): CreatureGenome[] {
    return this.creatures.map(c => c.genome);
  }

  /**
   * Sort creatures by fitness (descending)
   */
  rankByFitness(): Creature[] {
    return [...this.creatures].sort((a, b) => b.state.fitness - a.state.fitness);
  }

  /**
   * Get population statistics
   */
  getStats(): PopulationStats {
    const fitnesses = this.creatures.map(c => c.state.fitness);
    const sortedFitnesses = [...fitnesses].sort((a, b) => b - a);

    const avgNodes = this.creatures.reduce((sum, c) => sum + c.genome.nodes.length, 0) / this.creatures.length;
    const avgMuscles = this.creatures.reduce((sum, c) => sum + c.genome.muscles.length, 0) / this.creatures.length;

    return {
      generation: this.generation,
      bestFitness: sortedFitnesses[0] || 0,
      averageFitness: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length || 0,
      worstFitness: sortedFitnesses[sortedFitnesses.length - 1] || 0,
      avgNodes,
      avgMuscles
    };
  }

  /**
   * Evolve to next generation
   *
   * Survivors (top performers based on cullPercentage) pass through UNCHANGED.
   * New creatures are created to fill the culled slots via crossover or mutation.
   */
  evolve(): CreatureGenome[] {
    // Select survivors - these pass through unchanged
    const { survivors } = truncationSelection(this.creatures, 1 - this.config.cullPercentage);

    // Survivors pass through with incremented survivalStreak (unchanged otherwise)
    const survivorGenomes = survivors.map(c => ({
      ...c.genome,
      survivalStreak: c.genome.survivalStreak + 1
    }));

    // Calculate selection probabilities based on rank (for creating new creatures)
    const probabilities = rankBasedProbabilities(survivors);

    // Calculate decayed neural mutation rate for this generation
    const effectiveNeuralRate = calculateDecayedRate(
      this.config.weightMutationRate,
      this.generation,
      this.config.weightMutationDecay
    );

    // Create mutation config with decayed neural rate
    const currentMutationConfig: MutationConfig = {
      ...this.mutationConfig,
      neuralRate: effectiveNeuralRate
    };

    // Start with all survivors
    const newGenomes: CreatureGenome[] = [...survivorGenomes];
    const targetSize = this.config.populationSize;
    const newCreaturesNeeded = targetSize - survivors.length;

    // Create new creatures to fill the culled slots
    // All new creatures are either crossover or mutation (controlled by crossoverRate)
    for (let i = 0; i < newCreaturesNeeded; i++) {
      const useCrossover = this.config.useCrossover !== false;
      const useMutation = this.config.useMutation !== false;

      // Determine crossover vs mutation based on rates
      const crossoverProb = useCrossover ? this.config.crossoverRate : 0;
      const doCrossover = Math.random() < crossoverProb && survivors.length >= 2;

      if (doCrossover) {
        // Create via crossover of two survivors
        const parent1 = weightedRandomSelect(survivors, probabilities);
        let parent2 = weightedRandomSelect(survivors, probabilities);

        // Ensure different parents
        let attempts = 0;
        while (parent2.genome.id === parent1.genome.id && attempts < 10) {
          parent2 = weightedRandomSelect(survivors, probabilities);
          attempts++;
        }

        const child = singlePointCrossover(parent1.genome, parent2.genome, this.genomeConstraints);
        newGenomes.push(child);
      } else if (useMutation) {
        // Create via mutation of a survivor (clone + mutate)
        const parent = weightedRandomSelect(survivors, probabilities);
        const child = cloneGenome(parent.genome, this.genomeConstraints);
        const mutatedChild = mutateGenome(child, currentMutationConfig, this.genomeConstraints);
        newGenomes.push(mutatedChild);
      } else {
        // Only crossover enabled but couldn't do it (e.g., not enough survivors)
        // Fall back to clone
        const parent = weightedRandomSelect(survivors, probabilities);
        const child = cloneGenome(parent.genome, this.genomeConstraints);
        newGenomes.push(child);
      }
    }

    // Increment population generation counter
    this.generation++;

    return newGenomes;
  }

  /**
   * Replace current creatures with new genomes
   */
  replaceCreatures(genomes: CreatureGenome[]): void {
    // Dispose old creatures
    for (const creature of this.creatures) {
      creature.dispose();
    }

    // Create new creatures
    this.creatures = genomes.map(g => new Creature(g));
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<SimulationConfig>): void {
    Object.assign(this.config, config);

    if (config.mutationRate !== undefined) {
      this.mutationConfig.rate = config.mutationRate;
    }
    if (config.mutationMagnitude !== undefined) {
      this.mutationConfig.magnitude = config.mutationMagnitude;
    }
    if (config.weightMutationRate !== undefined) {
      this.mutationConfig.neuralRate = config.weightMutationRate;
    }
    if (config.weightMutationMagnitude !== undefined) {
      this.mutationConfig.neuralMagnitude = config.weightMutationMagnitude;
    }
  }

  /**
   * Get creature by index
   */
  getCreature(index: number): Creature | undefined {
    return this.creatures[index];
  }

  /**
   * Get creature by genome ID
   */
  getCreatureById(id: string): Creature | undefined {
    return this.creatures.find(c => c.genome.id === id);
  }

  /**
   * Get best creature
   */
  getBest(): Creature | undefined {
    return this.rankByFitness()[0];
  }

  /**
   * Dispose all creatures
   */
  dispose(): void {
    for (const creature of this.creatures) {
      creature.dispose();
    }
    this.creatures = [];
  }
}
