/**
 * Edge case and stress tests for NeuralVisualizer and sensor input labeling.
 *
 * These tests intentionally try to break the implementation by exploring:
 * - Numerical edge cases (NaN, Infinity, very large/small values)
 * - Empty and missing data
 * - Boundary conditions (0 nodes, max nodes, topology mismatches)
 * - Integration scenarios (proprioception + time encoding combinations)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NeuralGenomeData, NeuralTopology } from '../neural';
import type { FrameActivations } from '../types';

// Mock canvas for Node.js environment
const mockCanvas = {
  width: 800,
  height: 200,
  style: { width: '', height: '', borderRadius: '', background: '' },
  getContext: () => ({
    scale: vi.fn(),
    fillStyle: '',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    font: '',
    textAlign: '',
    textBaseline: '',
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    measureText: (text: string) => ({ width: text.length * 6 }),
    setTransform: vi.fn(),
  }),
  remove: vi.fn(),
};

vi.stubGlobal('document', {
  createElement: () => mockCanvas,
});

vi.stubGlobal('window', {
  devicePixelRatio: 1,
  innerWidth: 1920,
});

// Import after mocking
const { NeuralVisualizer } = await import('../ui/NeuralVisualizer');

// Helper to create test genome data
function createTestGenome(
  inputSize: number,
  hiddenSize: number,
  outputSize: number,
  activation: 'tanh' | 'relu' | 'sigmoid' = 'tanh'
): NeuralGenomeData {
  const topology: NeuralTopology = { inputSize, hiddenSize, outputSize };
  // Calculate correct weight count: IH weights + H biases + HO weights + O biases
  const weightCount = (inputSize * hiddenSize) + hiddenSize + (hiddenSize * outputSize) + outputSize;
  const weights = Array(weightCount).fill(0).map((_, i) => Math.sin(i) * 0.5);
  return { topology, weights, activation };
}

// Helper to create mock container
function createMockContainer(): HTMLElement {
  return {
    appendChild: vi.fn(),
    innerHTML: '',
  } as unknown as HTMLElement;
}

describe('NeuralVisualizer Edge Cases', () => {
  describe('Numerical Edge Cases', () => {
    it('should handle NaN activation values without crashing', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      const genome = createTestGenome(7, 8, 5);
      visualizer.setGenome(genome, ['1-2', '2-3', '3-4', '4-5', '5-1']);

      const activations: FrameActivations = {
        inputs: [NaN, 0.5, -0.3, NaN, 0, 0.1, NaN],
        hidden: [NaN, 0, 0, NaN, 0, 0, 0, 0],
        outputs: [NaN, 0.5, -0.5, NaN, 0],
      };

      // Should not throw
      expect(() => visualizer.setStoredActivations(activations)).not.toThrow();
      visualizer.dispose();
    });

    it('should handle Infinity activation values', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      const genome = createTestGenome(7, 8, 5);
      visualizer.setGenome(genome, ['1-2', '2-3', '3-4', '4-5', '5-1']);

      const activations: FrameActivations = {
        inputs: [Infinity, -Infinity, 0, 0, 0, 0, 0],
        hidden: [Infinity, 0, 0, 0, 0, 0, 0, 0],
        outputs: [-Infinity, 0, 0, 0, 0],
      };

      expect(() => visualizer.setStoredActivations(activations)).not.toThrow();
      visualizer.dispose();
    });

    it('should handle very large activation values', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      const genome = createTestGenome(7, 8, 5);
      visualizer.setGenome(genome, ['1-2', '2-3', '3-4', '4-5', '5-1']);

      const activations: FrameActivations = {
        inputs: [1e308, -1e308, 1e-308, -1e-308, 0, 0, 0],
        hidden: Array(8).fill(1e100),
        outputs: Array(5).fill(-1e100),
      };

      expect(() => visualizer.setStoredActivations(activations)).not.toThrow();
      visualizer.dispose();
    });

    it('should handle zero-weight genome', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });

      const topology: NeuralTopology = { inputSize: 7, hiddenSize: 8, outputSize: 5 };
      const weightCount = (7 * 8) + 8 + (8 * 5) + 5;
      const genome: NeuralGenomeData = {
        topology,
        weights: Array(weightCount).fill(0),
        activation: 'tanh',
      };

      expect(() => visualizer.setGenome(genome, [])).not.toThrow();
      visualizer.dispose();
    });
  });

  describe('Empty and Missing Data', () => {
    it('should handle undefined genome gracefully', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });

      expect(() => visualizer.setGenome(undefined, [])).not.toThrow();
      visualizer.dispose();
    });

    it('should handle empty muscle names array', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      const genome = createTestGenome(7, 8, 5);

      expect(() => visualizer.setGenome(genome, [])).not.toThrow();
      visualizer.dispose();
    });

    it('should handle empty activations arrays', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      const genome = createTestGenome(7, 8, 5);
      visualizer.setGenome(genome, []);

      const activations: FrameActivations = {
        inputs: [],
        hidden: [],
        outputs: [],
      };

      expect(() => visualizer.setStoredActivations(activations)).not.toThrow();
      visualizer.dispose();
    });

    it('should handle legacy format (just outputs array)', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      const genome = createTestGenome(7, 8, 5);
      visualizer.setGenome(genome, ['1-2', '2-3', '3-4', '4-5', '5-1']);

      // Legacy format: just an array of output values
      expect(() => visualizer.setStoredActivations([0.5, -0.3, 0.1, 0, -0.2])).not.toThrow();
      visualizer.dispose();
    });

    it('should handle missing inputs/hidden in FrameActivations', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      const genome = createTestGenome(7, 8, 5);
      visualizer.setGenome(genome, []);

      // Missing fields
      const activations = { outputs: [0.5, -0.3, 0.1, 0, -0.2] } as FrameActivations;

      expect(() => visualizer.setStoredActivations(activations)).not.toThrow();
      visualizer.dispose();
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle minimum topology (1-1-1)', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      const genome = createTestGenome(1, 1, 1);

      expect(() => visualizer.setGenome(genome, ['M1'])).not.toThrow();
      expect(visualizer.getActualInputSize()).toBe(1);
      visualizer.dispose();
    });

    it('should handle large topology (56 inputs with proprioception)', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 1200, height: 300, showWeights: true });

      // Base 7 + cyclic 2 + strain 15 + velocity 24 + ground 8 = 56
      const genome = createTestGenome(9, 16, 10); // Stored topology is smaller
      visualizer.setGenome(genome, Array(10).fill('M'));
      visualizer.setTimeEncoding('cyclic');
      visualizer.setProprioception({
        enabled: true,
        inputs: 'all',
        numMuscles: 10,
        numNodes: 6,
      });

      const labels = visualizer.getInputLabels();
      expect(labels.length).toBe(56); // 7 + 2 + 15 + 24 + 8
      visualizer.dispose();
    });

    it('should handle topology mismatch (more activations than stored weights)', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });

      // Genome has 7 inputs but we provide more activations
      const genome = createTestGenome(7, 8, 5);
      visualizer.setGenome(genome, ['1-2', '2-3', '3-4', '4-5', '5-1']);
      visualizer.setProprioception({
        enabled: true,
        inputs: 'all',
        numMuscles: 5,
        numNodes: 4,
      });
      // No time encoding set, so: 7 base + 0 time + 15 strain + 24 velocity + 8 ground = 54

      const activations: FrameActivations = {
        inputs: Array(54).fill(0.5),
        hidden: Array(8).fill(0.3),
        outputs: Array(5).fill(0.1),
      };

      expect(() => visualizer.setStoredActivations(activations)).not.toThrow();
      expect(visualizer.getActualInputSize()).toBe(54);
      visualizer.dispose();
    });

    it('should handle 0 muscles and nodes in proprioception', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      const genome = createTestGenome(7, 8, 5);
      visualizer.setGenome(genome, []);
      visualizer.setProprioception({
        enabled: true,
        inputs: 'all',
        numMuscles: 0,
        numNodes: 0,
      });

      const labels = visualizer.getInputLabels();
      // Base 7 + 15 padded strain + 24 padded velocity + 8 padded ground
      expect(labels.length).toBe(7 + 15 + 24 + 8);
      // All proprioception should be padded (end with *)
      const propLabels = labels.slice(7);
      expect(propLabels.every(l => l.endsWith('*'))).toBe(true);
      visualizer.dispose();
    });

    /**
     * BUG REPRODUCTION TEST: When proprioception is enabled but stored activations
     * have a small inputs array (from topology.inputSize), getActualInputSize()
     * should still return the full proprioception input count (56), not the small
     * stored array size (9).
     */
    it('should return full proprioception input count even when stored activations have fewer inputs', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 1200, height: 300, showWeights: true });

      // Genome topology has 9 inputs (base 7 + cyclic 2)
      const genome = createTestGenome(9, 8, 5);
      visualizer.setGenome(genome, ['1-2', '2-3', '3-4', '4-5', '5-1']);
      visualizer.setTimeEncoding('cyclic');
      visualizer.setProprioception({
        enabled: true,
        inputs: 'all',
        numMuscles: 5,
        numNodes: 4,
      });

      // Stored activations only have 9 inputs (from backend topology, not full proprioception)
      // This simulates the real bug where backend stores fewer inputs than frontend expects
      const activations: FrameActivations = {
        inputs: Array(9).fill(0.5),  // Only 9, not 56!
        hidden: Array(8).fill(0.3),
        outputs: Array(5).fill(0.1),
      };

      visualizer.setStoredActivations(activations);

      // BUG: This was returning 9 (stored inputs length) instead of 56 (proprioception count)
      // Expected: 7 base + 2 cyclic + 15 strain + 24 velocity + 8 ground = 56
      expect(visualizer.getActualInputSize()).toBe(56);
      visualizer.dispose();
    });

    it('should handle max muscles (15) and max nodes (8)', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 800, height: 200, showWeights: true });
      const genome = createTestGenome(9, 16, 15);
      visualizer.setGenome(genome, Array(15).fill('M'));
      visualizer.setProprioception({
        enabled: true,
        inputs: 'all',
        numMuscles: 15,
        numNodes: 8,
      });

      const labels = visualizer.getInputLabels();
      // No padding needed when at max
      const propLabels = labels.slice(7);
      expect(propLabels.filter(l => l.endsWith('*')).length).toBe(0);
      visualizer.dispose();
    });
  });

  describe('Time Encoding Combinations', () => {
    it.each([
      ['none', 7],
      ['sin', 8],
      ['raw', 8],
      ['cyclic', 9],
      ['sin_raw', 9],
    ] as const)('should generate correct input count for %s encoding', (encoding, expectedCount) => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      const genome = createTestGenome(expectedCount, 8, 5);
      visualizer.setGenome(genome, []);
      visualizer.setTimeEncoding(encoding);

      expect(visualizer.getInputLabels().length).toBe(expectedCount);
      visualizer.dispose();
    });
  });

  describe('Proprioception Input Types', () => {
    it('should generate correct labels for strain-only proprioception', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      visualizer.setGenome(createTestGenome(7, 8, 5), ['1-2', '2-3', '3-4']);
      visualizer.setProprioception({
        enabled: true,
        inputs: 'strain',
        numMuscles: 3,
        numNodes: 4,
      });

      const labels = visualizer.getInputLabels();
      // 7 base + 15 strain (3 real + 12 padded)
      expect(labels.length).toBe(22);
      expect(labels.filter(l => l.includes('_str')).length).toBe(15);
      visualizer.dispose();
    });

    it('should generate correct labels for velocity-only proprioception', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      visualizer.setGenome(createTestGenome(7, 8, 5), []);
      visualizer.setProprioception({
        enabled: true,
        inputs: 'velocity',
        numMuscles: 3,
        numNodes: 4,
      });

      const labels = visualizer.getInputLabels();
      // 7 base + 24 velocity (12 real + 12 padded)
      expect(labels.length).toBe(31);
      expect(labels.filter(l => l.includes('_v')).length).toBe(24);
      visualizer.dispose();
    });

    it('should generate correct labels for ground-only proprioception', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      visualizer.setGenome(createTestGenome(7, 8, 5), []);
      visualizer.setProprioception({
        enabled: true,
        inputs: 'ground',
        numMuscles: 3,
        numNodes: 4,
      });

      const labels = visualizer.getInputLabels();
      // 7 base + 8 ground (4 real + 4 padded)
      expect(labels.length).toBe(15);
      expect(labels.filter(l => l.includes('_gnd')).length).toBe(8);
      visualizer.dispose();
    });
  });

  describe('Resize Edge Cases', () => {
    it('should handle resize to very small dimensions', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      visualizer.setGenome(createTestGenome(7, 8, 5), []);

      expect(() => visualizer.resize(10, 10)).not.toThrow();
      visualizer.dispose();
    });

    it('should handle resize to very large dimensions', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      visualizer.setGenome(createTestGenome(7, 8, 5), []);

      expect(() => visualizer.resize(10000, 5000)).not.toThrow();
      visualizer.dispose();
    });

    it('should handle resize to zero dimensions', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      visualizer.setGenome(createTestGenome(7, 8, 5), []);

      // This might cause issues but shouldn't crash
      expect(() => visualizer.resize(0, 0)).not.toThrow();
      visualizer.dispose();
    });
  });

  describe('Clear and Dispose', () => {
    it('should handle clear after setting genome', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      visualizer.setGenome(createTestGenome(7, 8, 5), []);
      visualizer.setTimeEncoding('cyclic');
      visualizer.setProprioception({ enabled: true, inputs: 'all', numMuscles: 5, numNodes: 4 });

      expect(() => visualizer.clear()).not.toThrow();

      // After clear, should reset to defaults
      expect(visualizer.getActualInputSize()).toBe(7);
      visualizer.dispose();
    });

    it('should handle multiple dispose calls', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });

      expect(() => {
        visualizer.dispose();
        visualizer.dispose();
        visualizer.dispose();
      }).not.toThrow();
    });
  });

  describe('Integration: Full Pipeline', () => {
    it('should handle complete flow with all proprioception + cyclic encoding', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 1200, height: 300, showWeights: true });

      // Setup
      const genome = createTestGenome(9, 16, 10);
      visualizer.setGenome(genome, ['1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '8-1', '1-3', '2-4']);
      visualizer.setTimeEncoding('cyclic');
      visualizer.setProprioception({
        enabled: true,
        inputs: 'all',
        numMuscles: 10,
        numNodes: 6,
      });

      // Verify setup
      const labels = visualizer.getInputLabels();
      expect(labels.length).toBe(56);

      // Set full activations
      const activations: FrameActivations = {
        inputs: Array(56).fill(0).map((_, i) => Math.sin(i / 10)),
        hidden: Array(16).fill(0).map((_, i) => Math.cos(i / 5)),
        outputs: Array(10).fill(0).map((_, i) => Math.sin(i / 3) * 0.5),
      };

      expect(() => visualizer.setStoredActivations(activations)).not.toThrow();

      // Update activations
      expect(() => visualizer.updateActivations(Array(56).fill(0.3))).not.toThrow();

      // Resize
      expect(() => visualizer.resize(800, 200)).not.toThrow();

      // Clear and reset
      expect(() => visualizer.clear()).not.toThrow();

      visualizer.dispose();
    });

    it('should handle rapid sequential updates', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      const genome = createTestGenome(7, 8, 5);
      visualizer.setGenome(genome, []);

      // Rapid updates shouldn't cause issues
      for (let i = 0; i < 100; i++) {
        visualizer.setStoredActivations({
          inputs: Array(7).fill(Math.sin(i)),
          hidden: Array(8).fill(Math.cos(i)),
          outputs: Array(5).fill(Math.tan(i % 1)),
        });
      }

      visualizer.dispose();
    });
  });
});

describe('getSensorNamesForEncoding Edge Cases', () => {
  // We'll test the function from ReplayModal indirectly through label generation

  describe('Muscle Name Edge Cases', () => {
    it('should use provided muscle names in labels', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      visualizer.setGenome(createTestGenome(7, 8, 5), ['A-B', 'C-D', 'E-F']);
      visualizer.setProprioception({
        enabled: true,
        inputs: 'strain',
        numMuscles: 3,
        numNodes: 0,
      });

      const labels = visualizer.getInputLabels();
      expect(labels).toContain('A-B_str');
      expect(labels).toContain('C-D_str');
      expect(labels).toContain('E-F_str');
      visualizer.dispose();
    });

    it('should fallback to M{i} for missing muscle names', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      visualizer.setGenome(createTestGenome(7, 8, 5), []); // No muscle names
      visualizer.setProprioception({
        enabled: true,
        inputs: 'strain',
        numMuscles: 3,
        numNodes: 0,
      });

      const labels = visualizer.getInputLabels();
      expect(labels).toContain('M1_str');
      expect(labels).toContain('M2_str');
      expect(labels).toContain('M3_str');
      visualizer.dispose();
    });

    it('should handle special characters in muscle names', () => {
      const container = createMockContainer();
      const visualizer = new NeuralVisualizer(container, { width: 400, height: 200, showWeights: true });
      visualizer.setGenome(createTestGenome(7, 8, 5), ['1-2', '3-4', '5-6']);
      visualizer.setProprioception({
        enabled: true,
        inputs: 'strain',
        numMuscles: 3,
        numNodes: 0,
      });

      const labels = visualizer.getInputLabels();
      expect(labels).toContain('1-2_str');
      visualizer.dispose();
    });
  });
});
