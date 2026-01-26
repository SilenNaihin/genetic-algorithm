/**
 * Tests for longest survivor best fitness tracking.
 *
 * BUG: When clicking on "longest survivor", it shows the LATEST generation's
 * simulation data, not the generation where the creature had its BEST fitness.
 *
 * Expected behavior: The stored longest survivor should always be from the
 * generation where that creature achieved its highest fitness.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useEvolutionStore } from '../../app/stores/evolutionStore';
import type { CreatureSimulationResult } from '../types/creature';
import type { CreatureGenome } from '../types/genome';

// Helper to create a mock creature result
function createMockCreatureResult(
  id: string,
  fitness: number,
  survivalStreak: number
): CreatureSimulationResult {
  const genome: CreatureGenome = {
    id,
    generation: 0,
    nodes: [
      { id: 'n1', position: { x: 0, y: 0.5, z: 0 }, size: 0.3, friction: 0.5 },
      { id: 'n2', position: { x: 1, y: 0.5, z: 0 }, size: 0.3, friction: 0.5 },
    ],
    muscles: [
      { id: 'm1', nodeA: 'n1', nodeB: 'n2', strength: 100, frequency: 1, amplitude: 0.3, phase: 0 },
    ],
    survivalStreak,
  };

  return {
    genome,
    frames: [],
    finalFitness: fitness,
    pelletsCollected: 0,
    distanceTraveled: 0,
    netDisplacement: 0,
    closestPelletDistance: 0,
    pellets: [],
    fitnessOverTime: [],
    disqualified: null,
  };
}

/**
 * Helper that implements the correct logic for updating longest survivor.
 * This is what useSimulation.ts should do.
 *
 * Rules:
 * 1. If new creature (different ID) with higher streak -> update
 * 2. If same creature with higher fitness -> update
 * 3. If same creature with lower fitness -> keep existing result, just update streak/gen
 */
function smartUpdateLongestSurvivor(
  newResult: CreatureSimulationResult,
  newStreak: number,
  diedAtGen: number
): void {
  const store = useEvolutionStore.getState();
  const current = store.longestSurvivingCreature;
  const currentStreak = store.longestSurvivingGenerations;

  // No current longest survivor -> set new one
  if (!current) {
    store.setLongestSurvivor(newResult, newStreak, diedAtGen);
    return;
  }

  const isSameCreature = newResult.genome.id === current.genome.id;
  const hasHigherStreak = newStreak > currentStreak;
  const hasHigherFitness = newResult.finalFitness > current.finalFitness;

  if (!isSameCreature && hasHigherStreak) {
    // New creature with higher streak takes the title
    store.setLongestSurvivor(newResult, newStreak, diedAtGen);
  } else if (isSameCreature && hasHigherFitness) {
    // Same creature with better performance -> update result
    store.setLongestSurvivor(newResult, newStreak, diedAtGen);
  } else if (isSameCreature && !hasHigherFitness) {
    // Same creature with worse performance -> keep best result, update streak
    // Create a copy with updated streak but original fitness/frames
    const updatedGenome = { ...current.genome, survivalStreak: newStreak };
    const updatedResult = { ...current, genome: updatedGenome };
    store.setLongestSurvivor(updatedResult, newStreak, diedAtGen);
  }
  // Otherwise: different creature with equal/lower streak -> no update
}

describe('Longest Survivor Best Fitness Tracking', () => {
  beforeEach(() => {
    // Reset store state
    useEvolutionStore.getState().setLongestSurvivor(null, 0, 0);
  });

  it('should store the best fitness when same creature survives multiple generations', () => {
    // Gen 1: Creature A gets high fitness (100)
    const creatureGen1 = createMockCreatureResult('creature-A', 100, 1);
    smartUpdateLongestSurvivor(creatureGen1, 1, 1);

    expect(useEvolutionStore.getState().longestSurvivingCreature?.finalFitness).toBe(100);
    expect(useEvolutionStore.getState().longestSurvivingGenerations).toBe(1);

    // Gen 2: Same creature survives but gets lower fitness (80)
    const creatureGen2 = createMockCreatureResult('creature-A', 80, 2);
    smartUpdateLongestSurvivor(creatureGen2, 2, 2);

    // The stored fitness should still be the best (100), not the latest (80)
    expect(useEvolutionStore.getState().longestSurvivingCreature?.finalFitness).toBe(100);
    // But the streak should be updated
    expect(useEvolutionStore.getState().longestSurvivingGenerations).toBe(2);
  });

  it('should update when a new creature takes the longest survivor title', () => {
    // Creature A has streak 3, fitness 50
    const creatureA = createMockCreatureResult('creature-A', 50, 3);
    smartUpdateLongestSurvivor(creatureA, 3, 3);

    expect(useEvolutionStore.getState().longestSurvivingCreature?.genome.id).toBe('creature-A');

    // Creature B takes over with streak 4, fitness 30
    const creatureB = createMockCreatureResult('creature-B', 30, 4);
    smartUpdateLongestSurvivor(creatureB, 4, 4);

    // Should update to creature B (new creature with higher streak)
    expect(useEvolutionStore.getState().longestSurvivingCreature?.genome.id).toBe('creature-B');
    expect(useEvolutionStore.getState().longestSurvivingCreature?.finalFitness).toBe(30);
  });

  it('should update same creature if new fitness is higher', () => {
    // Gen 1: Creature A gets low fitness (30)
    const creatureGen1 = createMockCreatureResult('creature-A', 30, 1);
    smartUpdateLongestSurvivor(creatureGen1, 1, 1);

    expect(useEvolutionStore.getState().longestSurvivingCreature?.finalFitness).toBe(30);

    // Gen 2: Same creature gets higher fitness (80)
    const creatureGen2 = createMockCreatureResult('creature-A', 80, 2);
    smartUpdateLongestSurvivor(creatureGen2, 2, 2);

    // Should update because fitness improved
    expect(useEvolutionStore.getState().longestSurvivingCreature?.finalFitness).toBe(80);
    expect(useEvolutionStore.getState().longestSurvivingGenerations).toBe(2);
  });

  it('should not replace with different creature having equal streak', () => {
    // Creature A has streak 3
    const creatureA = createMockCreatureResult('creature-A', 100, 3);
    smartUpdateLongestSurvivor(creatureA, 3, 3);

    // Creature B also has streak 3 (equal, not higher)
    const creatureB = createMockCreatureResult('creature-B', 150, 3);
    smartUpdateLongestSurvivor(creatureB, 3, 4);

    // Should keep creature A (first to achieve the streak)
    expect(useEvolutionStore.getState().longestSurvivingCreature?.genome.id).toBe('creature-A');
  });

  it('should preserve frames from best performance generation', () => {
    // Gen 1: Creature A with frames
    const creatureGen1 = createMockCreatureResult('creature-A', 100, 1);
    creatureGen1.frames = [
      { time: 0, nodePositions: [], centerOfMass: { x: 0, y: 0, z: 0 }, activePelletIndex: 0 },
      { time: 1, nodePositions: [], centerOfMass: { x: 1, y: 0, z: 0 }, activePelletIndex: 0 },
    ];
    smartUpdateLongestSurvivor(creatureGen1, 1, 1);

    // Gen 2: Same creature, lower fitness, different frames
    const creatureGen2 = createMockCreatureResult('creature-A', 50, 2);
    creatureGen2.frames = [
      { time: 0, nodePositions: [], centerOfMass: { x: 0, y: 0, z: 0 }, activePelletIndex: 0 },
    ];
    smartUpdateLongestSurvivor(creatureGen2, 2, 2);

    // Should keep Gen1's frames (from best performance)
    expect(useEvolutionStore.getState().longestSurvivingCreature?.frames.length).toBe(2);
  });
});

describe('Longest Survivor Store State', () => {
  beforeEach(() => {
    useEvolutionStore.getState().setLongestSurvivor(null, 0, 0);
  });

  it('should track generations survived and death generation separately', () => {
    const creature = createMockCreatureResult('creature-A', 50, 5);
    smartUpdateLongestSurvivor(creature, 5, 10); // 5 generations, died at gen 10

    const state = useEvolutionStore.getState();
    expect(state.longestSurvivingGenerations).toBe(5);
    expect(state.longestSurvivingDiedAt).toBe(10);
  });

  it('should handle null/initial state', () => {
    const state = useEvolutionStore.getState();

    expect(state.longestSurvivingCreature).toBeNull();
    expect(state.longestSurvivingGenerations).toBe(0);
    expect(state.longestSurvivingDiedAt).toBe(0);
  });
});

describe('Best Performance Generation Tracking', () => {
  beforeEach(() => {
    useEvolutionStore.getState().setLongestSurvivor(null, 0, 0);
  });

  it('should set _bestPerformanceGeneration when storing new longest survivor', () => {
    // Gen 1: Creature A gets high fitness
    const creatureGen1 = createMockCreatureResult('creature-A', 100, 1);
    // Simulate setting the generation when storing
    creatureGen1.genome._bestPerformanceGeneration = 1;
    smartUpdateLongestSurvivor(creatureGen1, 1, 1);

    const stored = useEvolutionStore.getState().longestSurvivingCreature;
    expect(stored?.genome._bestPerformanceGeneration).toBe(1);
  });

  it('should preserve _bestPerformanceGeneration when keeping best result', () => {
    // Gen 1: Creature A gets high fitness
    const creatureGen1 = createMockCreatureResult('creature-A', 100, 1);
    creatureGen1.genome._bestPerformanceGeneration = 1;
    smartUpdateLongestSurvivor(creatureGen1, 1, 1);

    // Gen 2: Same creature, lower fitness
    const creatureGen2 = createMockCreatureResult('creature-A', 50, 2);
    creatureGen2.genome._bestPerformanceGeneration = 2; // Would be set to current gen
    smartUpdateLongestSurvivor(creatureGen2, 2, 2);

    // Should still be gen 1 (where best performance was)
    const stored = useEvolutionStore.getState().longestSurvivingCreature;
    expect(stored?.genome._bestPerformanceGeneration).toBe(1);
  });

  it('should update _bestPerformanceGeneration when same creature gets higher fitness', () => {
    // Gen 1: Creature A gets low fitness
    const creatureGen1 = createMockCreatureResult('creature-A', 30, 1);
    creatureGen1.genome._bestPerformanceGeneration = 1;
    smartUpdateLongestSurvivor(creatureGen1, 1, 1);

    // Gen 2: Same creature, higher fitness
    const creatureGen2 = createMockCreatureResult('creature-A', 100, 2);
    creatureGen2.genome._bestPerformanceGeneration = 2;
    smartUpdateLongestSurvivor(creatureGen2, 2, 2);

    // Should be gen 2 (where better performance was)
    const stored = useEvolutionStore.getState().longestSurvivingCreature;
    expect(stored?.genome._bestPerformanceGeneration).toBe(2);
    expect(stored?.finalFitness).toBe(100);
  });

  it('should set new _bestPerformanceGeneration when different creature takes title', () => {
    // Creature A with streak 3
    const creatureA = createMockCreatureResult('creature-A', 100, 3);
    creatureA.genome._bestPerformanceGeneration = 2;
    smartUpdateLongestSurvivor(creatureA, 3, 3);

    // Creature B takes over with streak 4
    const creatureB = createMockCreatureResult('creature-B', 50, 4);
    creatureB.genome._bestPerformanceGeneration = 4;
    smartUpdateLongestSurvivor(creatureB, 4, 4);

    const stored = useEvolutionStore.getState().longestSurvivingCreature;
    expect(stored?.genome.id).toBe('creature-B');
    expect(stored?.genome._bestPerformanceGeneration).toBe(4);
  });
});
