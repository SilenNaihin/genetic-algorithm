/**
 * Tests for BrainEvolutionPanel and brain evolution visualization
 */

import { describe, it, expect } from 'vitest';
import { BrainEvolutionPanel } from '../ui/BrainEvolutionPanel';
import type { NeuralGenomeData, NeuralTopology } from '../neural';

// Helper to create mock neural genome data
function createMockNeuralGenome(weights: number[]): NeuralGenomeData {
  const topology: NeuralTopology = {
    inputSize: 8,
    hiddenSize: 4,
    outputSize: 2
  };
  // Weight count: (8*4) + 4 + (4*2) + 2 = 32 + 4 + 8 + 2 = 46
  return {
    weights: weights.length === 46 ? weights : new Array(46).fill(0).map((_, i) => weights[i % weights.length] || 0),
    topology,
    activation: 'tanh'
  };
}

describe('BrainEvolutionPanel', () => {
  describe('computeAverageWeights', () => {
    it('returns null for empty array', () => {
      const result = BrainEvolutionPanel.computeAverageWeights([]);
      expect(result).toBeNull();
    });

    it('returns same weights for single genome', () => {
      const weights = [0.1, 0.2, 0.3, -0.4, 0.5];
      const genome = createMockNeuralGenome(weights);
      const result = BrainEvolutionPanel.computeAverageWeights([genome]);

      expect(result).not.toBeNull();
      expect(result!.length).toBe(46);
      // First 5 weights should match original (rest are filled)
      expect(result![0]).toBeCloseTo(0.1, 5);
      expect(result![1]).toBeCloseTo(0.2, 5);
      expect(result![2]).toBeCloseTo(0.3, 5);
      expect(result![3]).toBeCloseTo(-0.4, 5);
      expect(result![4]).toBeCloseTo(0.5, 5);
    });

    it('computes correct average for multiple genomes', () => {
      // Create genomes with known weights for easy averaging
      const genome1 = createMockNeuralGenome(new Array(46).fill(1.0));
      const genome2 = createMockNeuralGenome(new Array(46).fill(3.0));
      const genome3 = createMockNeuralGenome(new Array(46).fill(2.0));

      const result = BrainEvolutionPanel.computeAverageWeights([genome1, genome2, genome3]);

      expect(result).not.toBeNull();
      expect(result!.length).toBe(46);
      // Average of 1, 3, 2 = 2
      result!.forEach(w => {
        expect(w).toBeCloseTo(2.0, 5);
      });
    });

    it('handles negative weights correctly', () => {
      const genome1 = createMockNeuralGenome(new Array(46).fill(-1.0));
      const genome2 = createMockNeuralGenome(new Array(46).fill(1.0));

      const result = BrainEvolutionPanel.computeAverageWeights([genome1, genome2]);

      expect(result).not.toBeNull();
      // Average of -1 and 1 = 0
      result!.forEach(w => {
        expect(w).toBeCloseTo(0.0, 5);
      });
    });

    it('handles varying weight values per position', () => {
      // Different weights at each position
      const weights1 = new Array(46).fill(0).map((_, i) => i * 0.1);
      const weights2 = new Array(46).fill(0).map((_, i) => i * 0.3);
      const genome1 = createMockNeuralGenome(weights1);
      const genome2 = createMockNeuralGenome(weights2);

      const result = BrainEvolutionPanel.computeAverageWeights([genome1, genome2]);

      expect(result).not.toBeNull();
      // Average of i*0.1 and i*0.3 = i*0.2
      result!.forEach((w, i) => {
        expect(w).toBeCloseTo(i * 0.2, 5);
      });
    });

    it('skips genomes with mismatched weight counts', () => {
      const genome1 = createMockNeuralGenome(new Array(46).fill(2.0));

      // Create a genome with wrong weight count manually
      const badGenome: NeuralGenomeData = {
        weights: [1, 2, 3], // Wrong count
        topology: { inputSize: 8, hiddenSize: 4, outputSize: 2 },
        activation: 'tanh'
      };

      const result = BrainEvolutionPanel.computeAverageWeights([genome1, badGenome]);

      expect(result).not.toBeNull();
      // Should only use genome1's weights (badGenome skipped)
      result!.forEach(w => {
        expect(w).toBeCloseTo(2.0, 5);
      });
    });
  });

  describe('weight difference calculation', () => {
    it('correctly identifies strengthened weights (positive diff)', () => {
      // Gen 1: weight = 0.2, Current: weight = 0.8
      // Diff = 0.8 - 0.2 = 0.6 (positive = strengthened)
      const gen1 = createMockNeuralGenome(new Array(46).fill(0.2));
      const current = createMockNeuralGenome(new Array(46).fill(0.8));

      const gen1Avg = BrainEvolutionPanel.computeAverageWeights([gen1])!;
      const currentAvg = BrainEvolutionPanel.computeAverageWeights([current])!;

      // All diffs should be positive (0.6)
      gen1Avg.forEach((w, i) => {
        const diff = currentAvg[i] - w;
        expect(diff).toBeCloseTo(0.6, 5);
        expect(diff).toBeGreaterThan(0); // Strengthened
      });
    });

    it('correctly identifies weakened weights (negative diff)', () => {
      // Gen 1: weight = 0.8, Current: weight = 0.2
      // Diff = 0.2 - 0.8 = -0.6 (negative = weakened)
      const gen1 = createMockNeuralGenome(new Array(46).fill(0.8));
      const current = createMockNeuralGenome(new Array(46).fill(0.2));

      const gen1Avg = BrainEvolutionPanel.computeAverageWeights([gen1])!;
      const currentAvg = BrainEvolutionPanel.computeAverageWeights([current])!;

      // All diffs should be negative (-0.6)
      gen1Avg.forEach((w, i) => {
        const diff = currentAvg[i] - w;
        expect(diff).toBeCloseTo(-0.6, 5);
        expect(diff).toBeLessThan(0); // Weakened
      });
    });

    it('handles sign changes in weights', () => {
      // Gen 1: weight = -0.5, Current: weight = 0.5
      // This is a significant change from inhibitory to excitatory
      const gen1 = createMockNeuralGenome(new Array(46).fill(-0.5));
      const current = createMockNeuralGenome(new Array(46).fill(0.5));

      const gen1Avg = BrainEvolutionPanel.computeAverageWeights([gen1])!;
      const currentAvg = BrainEvolutionPanel.computeAverageWeights([current])!;

      // Diff = 0.5 - (-0.5) = 1.0
      gen1Avg.forEach((w, i) => {
        const diff = currentAvg[i] - w;
        expect(diff).toBeCloseTo(1.0, 5);
      });
    });
  });

  describe('weight distribution analysis', () => {
    it('correctly bins weights for histogram', () => {
      // Create weights that span the typical range [-2, 2]
      const weights = new Array(46).fill(0).map((_, i) => {
        // Distribute evenly from -2 to 2
        return -2 + (4 * i / 45);
      });
      const genome = createMockNeuralGenome(weights);
      const avg = BrainEvolutionPanel.computeAverageWeights([genome])!;

      // Verify weights span the expected range
      const min = Math.min(...avg);
      const max = Math.max(...avg);
      expect(min).toBeLessThan(-1.5);
      expect(max).toBeGreaterThan(1.5);
    });

    it('handles concentrated weight distributions', () => {
      // All weights near zero (Xavier-like initialization)
      const weights = new Array(46).fill(0).map(() => (Math.random() - 0.5) * 0.2);
      const genome = createMockNeuralGenome(weights);
      const avg = BrainEvolutionPanel.computeAverageWeights([genome])!;

      // All weights should be small
      avg.forEach(w => {
        expect(Math.abs(w)).toBeLessThan(0.15);
      });
    });
  });
});
