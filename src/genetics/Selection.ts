import type { Creature } from '../core/Creature';

export interface SelectionResult {
  survivors: Creature[];
  culled: Creature[];
}

/**
 * Truncation selection - keep top percentage of creatures
 */
export function truncationSelection(
  creatures: Creature[],
  survivalRate: number = 0.5
): SelectionResult {
  // Sort by fitness (descending)
  const sorted = [...creatures].sort((a, b) => b.state.fitness - a.state.fitness);

  const survivorCount = Math.max(1, Math.floor(sorted.length * survivalRate));

  return {
    survivors: sorted.slice(0, survivorCount),
    culled: sorted.slice(survivorCount)
  };
}

/**
 * Tournament selection - randomly select creatures and keep the best
 */
export function tournamentSelection(
  creatures: Creature[],
  tournamentSize: number = 3,
  numSurvivors: number
): Creature[] {
  const survivors: Creature[] = [];
  const available = [...creatures];

  while (survivors.length < numSurvivors && available.length > 0) {
    // Select tournament participants
    const tournament: Creature[] = [];
    for (let i = 0; i < Math.min(tournamentSize, available.length); i++) {
      const idx = Math.floor(Math.random() * available.length);
      tournament.push(available[idx]);
    }

    // Find winner (highest fitness)
    const winner = tournament.reduce((best, current) =>
      current.state.fitness > best.state.fitness ? current : best
    );

    survivors.push(winner);

    // Remove winner from available pool
    const winnerIdx = available.indexOf(winner);
    if (winnerIdx > -1) {
      available.splice(winnerIdx, 1);
    }
  }

  return survivors;
}

/**
 * Elitism - always keep the top N performers unchanged
 */
export function getElites(creatures: Creature[], count: number): Creature[] {
  const sorted = [...creatures].sort((a, b) => b.state.fitness - a.state.fitness);
  return sorted.slice(0, Math.min(count, sorted.length));
}

/**
 * Rank-based selection probability
 */
export function rankBasedProbabilities(creatures: Creature[]): Map<string, number> {
  const sorted = [...creatures].sort((a, b) => b.state.fitness - a.state.fitness);
  const probabilities = new Map<string, number>();

  const n = sorted.length;
  let totalRank = 0;

  // Calculate total rank sum
  for (let i = 0; i < n; i++) {
    totalRank += (n - i);
  }

  // Assign probabilities based on rank
  for (let i = 0; i < n; i++) {
    const rank = n - i;
    probabilities.set(sorted[i].genome.id, rank / totalRank);
  }

  return probabilities;
}

/**
 * Weighted random selection based on probabilities
 */
export function weightedRandomSelect(
  creatures: Creature[],
  probabilities: Map<string, number>
): Creature {
  const random = Math.random();
  let cumulative = 0;

  for (const creature of creatures) {
    cumulative += probabilities.get(creature.genome.id) || 0;
    if (random <= cumulative) {
      return creature;
    }
  }

  // Fallback to last creature
  return creatures[creatures.length - 1];
}
