import type {
  CreatureGenome,
  SimulationConfig,
  GenomeConstraints
} from '../types';
import { DEFAULT_CONFIG, DEFAULT_GENOME_CONSTRAINTS } from '../types';
import { Creature } from '../core/Creature';

/**
 * Population - Thin state container for creatures.
 *
 * All genetics (generation, evolution) are handled by the backend.
 * This class only manages the local state of creatures for display.
 */
export class Population {
  creatures: Creature[] = [];
  config: SimulationConfig;
  genomeConstraints: GenomeConstraints;

  constructor(
    config: SimulationConfig = DEFAULT_CONFIG,
    genomeConstraints: GenomeConstraints = DEFAULT_GENOME_CONSTRAINTS
  ) {
    this.config = config;
    this.genomeConstraints = genomeConstraints;
  }

  /**
   * Create an empty population container (for backend-generated genomes)
   */
  static createEmpty(
    config: SimulationConfig = DEFAULT_CONFIG,
    genomeConstraints: GenomeConstraints = DEFAULT_GENOME_CONSTRAINTS
  ): Population {
    return new Population(config, genomeConstraints);
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
