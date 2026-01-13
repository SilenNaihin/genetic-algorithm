import type {
  CreatureGenome,
  SimulationConfig,
  PopulationStats,
  GenomeConstraints
} from '../types';
import { DEFAULT_CONFIG, DEFAULT_GENOME_CONSTRAINTS } from '../types';
import { generateRandomGenome } from '../core/Genome';
import { truncationSelection, getElites, rankBasedProbabilities, weightedRandomSelect } from './Selection';
import { mutateGenome, MutationConfig, DEFAULT_MUTATION_CONFIG } from './Mutation';
import { singlePointCrossover, cloneGenome } from './Crossover';
import { Creature } from '../core/Creature';

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
      magnitude: config.mutationMagnitude
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
      const genome = generateRandomGenome(genomeConstraints);
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
   */
  evolve(): CreatureGenome[] {
    // Get elites - keep their genomes EXACTLY as-is (same ID) but increment survivalStreak
    const elites = getElites(this.creatures, this.config.eliteCount);
    const eliteGenomes = elites.map(c => ({
      ...c.genome,
      survivalStreak: c.genome.survivalStreak + 1
    }));

    // Select survivors
    const { survivors } = truncationSelection(this.creatures, 1 - this.config.cullPercentage);

    // Calculate selection probabilities based on rank
    const probabilities = rankBasedProbabilities(survivors);

    // Create next generation
    const newGenomes: CreatureGenome[] = [...eliteGenomes];
    const targetSize = this.config.populationSize;

    while (newGenomes.length < targetSize) {
      if (Math.random() < this.config.crossoverRate && survivors.length >= 2) {
        // Crossover
        const parent1 = weightedRandomSelect(survivors, probabilities);
        let parent2 = weightedRandomSelect(survivors, probabilities);

        // Ensure different parents
        let attempts = 0;
        while (parent2.genome.id === parent1.genome.id && attempts < 10) {
          parent2 = weightedRandomSelect(survivors, probabilities);
          attempts++;
        }

        let child = singlePointCrossover(parent1.genome, parent2.genome, this.genomeConstraints);

        // Apply mutation
        child = mutateGenome(child, this.mutationConfig, this.genomeConstraints);

        newGenomes.push(child);
      } else {
        // Clone and mutate
        const parent = weightedRandomSelect(survivors, probabilities);
        const child = mutateGenome(cloneGenome(parent.genome), this.mutationConfig, this.genomeConstraints);
        newGenomes.push(child);
      }
    }

    // Increment population generation counter
    this.generation++;

    // NOTE: genome.generation tracks lineage age (how many generations this creature's
    // ancestors have survived), which is already correctly set by crossover/clone functions.
    // We do NOT overwrite it here with this.generation.

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
