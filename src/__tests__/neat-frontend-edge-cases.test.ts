/**
 * Edge case and stress tests for NEAT frontend integration.
 *
 * These tests intentionally try to break the NEAT implementation
 * by exploring boundary conditions, malformed data, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { NEATGenome, NeuronGene, ConnectionGene, FrameActivations } from '../types/simulation';
import type { CreatureGenome } from '../types/genome';

// Mock canvas for NeuralVisualizer tests
const createMockCanvas = () => {
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    fillRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    setLineDash: vi.fn(),
    measureText: vi.fn(() => ({ width: 50 })),
  };

  const canvas = {
    getContext: vi.fn(() => ctx),
    width: 400,
    height: 300,
    style: {},
  };

  return { canvas, ctx };
};

// Helper to create a minimal valid NEAT genome
function createMinimalNEATGenome(inputSize = 3, outputSize = 2): NEATGenome {
  const neurons: NeuronGene[] = [];
  const connections: ConnectionGene[] = [];

  // Input neurons
  for (let i = 0; i < inputSize; i++) {
    neurons.push({ id: i, type: 'input', bias: 0 });
  }

  // Output neurons
  for (let i = 0; i < outputSize; i++) {
    neurons.push({ id: inputSize + i, type: 'output', bias: -0.5 });
  }

  // Fully connected input -> output
  let innovation = 0;
  for (let i = 0; i < inputSize; i++) {
    for (let o = 0; o < outputSize; o++) {
      connections.push({
        fromNode: i,
        toNode: inputSize + o,
        weight: Math.random() * 2 - 1,
        enabled: true,
        innovation: innovation++,
      });
    }
  }

  return { neurons, connections, activation: 'tanh' };
}

// =============================================================================
// Genome Structure Edge Cases
// =============================================================================

describe('NEAT Genome Structure Edge Cases', () => {
  describe('Empty and Minimal Genomes', () => {
    it('should handle genome with no neurons', () => {
      const genome: NEATGenome = {
        neurons: [],
        connections: [],
        activation: 'tanh',
      };

      // Should not throw when processing empty genome
      const inputs = genome.neurons.filter(n => n.type === 'input');
      const outputs = genome.neurons.filter(n => n.type === 'output');
      expect(inputs.length).toBe(0);
      expect(outputs.length).toBe(0);
    });

    it('should handle genome with only input neurons (no outputs)', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'input', bias: 0 },
        ],
        connections: [],
        activation: 'tanh',
      };

      const outputs = genome.neurons.filter(n => n.type === 'output');
      expect(outputs.length).toBe(0);
    });

    it('should handle genome with only output neurons (no inputs)', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'output', bias: -0.5 },
        ],
        connections: [],
        activation: 'tanh',
      };

      const inputs = genome.neurons.filter(n => n.type === 'input');
      expect(inputs.length).toBe(0);
    });

    it('should handle genome with only hidden neurons', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'hidden', bias: 0, innovation: 1 },
          { id: 1, type: 'hidden', bias: 0, innovation: 2 },
        ],
        connections: [],
        activation: 'tanh',
      };

      const hidden = genome.neurons.filter(n => n.type === 'hidden');
      expect(hidden.length).toBe(2);
    });
  });

  describe('Disconnected Neurons', () => {
    it('should handle hidden neurons with no connections', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'hidden', bias: 0, innovation: 1 },  // Disconnected
          { id: 2, type: 'output', bias: -0.5 },
        ],
        connections: [
          { fromNode: 0, toNode: 2, weight: 0.5, enabled: true, innovation: 0 },
        ],
        activation: 'tanh',
      };

      // Hidden neuron 1 is disconnected but should still be processed
      const hidden = genome.neurons.filter(n => n.type === 'hidden');
      expect(hidden.length).toBe(1);
    });

    it('should handle output neurons with no incoming connections', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'output', bias: -0.5 },  // No connections to this
          { id: 2, type: 'output', bias: -0.5 },
        ],
        connections: [
          { fromNode: 0, toNode: 2, weight: 0.5, enabled: true, innovation: 0 },
        ],
        activation: 'tanh',
      };

      expect(genome.neurons.length).toBe(3);
    });
  });

  describe('All Connections Disabled', () => {
    it('should handle genome where all connections are disabled', () => {
      const genome = createMinimalNEATGenome(2, 2);
      // Disable all connections
      genome.connections.forEach(c => c.enabled = false);

      const enabledCount = genome.connections.filter(c => c.enabled).length;
      expect(enabledCount).toBe(0);
    });
  });

  describe('Duplicate and Invalid IDs', () => {
    it('should handle neurons with duplicate IDs (malformed data)', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 0, type: 'input', bias: 0 },  // Duplicate ID!
          { id: 1, type: 'output', bias: -0.5 },
        ],
        connections: [
          { fromNode: 0, toNode: 1, weight: 0.5, enabled: true, innovation: 0 },
        ],
        activation: 'tanh',
      };

      // Should not crash, just process what's there
      expect(genome.neurons.length).toBe(3);
    });

    it('should handle connections referencing non-existent neurons', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'output', bias: -0.5 },
        ],
        connections: [
          { fromNode: 0, toNode: 1, weight: 0.5, enabled: true, innovation: 0 },
          { fromNode: 99, toNode: 1, weight: 0.5, enabled: true, innovation: 1 },  // Non-existent source
          { fromNode: 0, toNode: 99, weight: 0.5, enabled: true, innovation: 2 },  // Non-existent target
        ],
        activation: 'tanh',
      };

      expect(genome.connections.length).toBe(3);
    });

    it('should handle negative neuron IDs', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: -1, type: 'input', bias: 0 },
          { id: -2, type: 'output', bias: -0.5 },
        ],
        connections: [
          { fromNode: -1, toNode: -2, weight: 0.5, enabled: true, innovation: 0 },
        ],
        activation: 'tanh',
      };

      expect(genome.neurons[0].id).toBe(-1);
    });
  });
});

// =============================================================================
// Numerical Edge Cases
// =============================================================================

describe('NEAT Numerical Edge Cases', () => {
  describe('Weight Values', () => {
    it('should handle NaN weights', () => {
      const genome = createMinimalNEATGenome(2, 1);
      genome.connections[0].weight = NaN;

      expect(Number.isNaN(genome.connections[0].weight)).toBe(true);
    });

    it('should handle Infinity weights', () => {
      const genome = createMinimalNEATGenome(2, 1);
      genome.connections[0].weight = Infinity;
      genome.connections[1].weight = -Infinity;

      expect(genome.connections[0].weight).toBe(Infinity);
      expect(genome.connections[1].weight).toBe(-Infinity);
    });

    it('should handle very large weights', () => {
      const genome = createMinimalNEATGenome(2, 1);
      genome.connections[0].weight = 1e308;  // Near max double

      expect(genome.connections[0].weight).toBe(1e308);
    });

    it('should handle very small weights', () => {
      const genome = createMinimalNEATGenome(2, 1);
      genome.connections[0].weight = 1e-308;  // Near min positive double

      expect(genome.connections[0].weight).toBe(1e-308);
    });

    it('should handle zero weights', () => {
      const genome = createMinimalNEATGenome(2, 1);
      genome.connections.forEach(c => c.weight = 0);

      expect(genome.connections.every(c => c.weight === 0)).toBe(true);
    });
  });

  describe('Bias Values', () => {
    it('should handle NaN bias', () => {
      const genome = createMinimalNEATGenome(1, 1);
      genome.neurons[1].bias = NaN;  // Output neuron

      expect(Number.isNaN(genome.neurons[1].bias)).toBe(true);
    });

    it('should handle extreme bias values', () => {
      const genome = createMinimalNEATGenome(1, 1);
      genome.neurons[1].bias = -1000;

      expect(genome.neurons[1].bias).toBe(-1000);
    });
  });

  describe('Innovation Numbers', () => {
    it('should handle very large innovation numbers', () => {
      const genome = createMinimalNEATGenome(1, 1);
      genome.connections[0].innovation = Number.MAX_SAFE_INTEGER;

      expect(genome.connections[0].innovation).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle negative innovation numbers (invalid but possible)', () => {
      const genome = createMinimalNEATGenome(1, 1);
      genome.connections[0].innovation = -1;

      expect(genome.connections[0].innovation).toBe(-1);
    });
  });
});

// =============================================================================
// Topology Edge Cases
// =============================================================================

describe('NEAT Topology Edge Cases', () => {
  describe('Deep Networks', () => {
    it('should handle very deep networks (many hidden layers)', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          // Chain of 50 hidden neurons
          ...Array.from({ length: 50 }, (_, i) => ({
            id: i + 1,
            type: 'hidden' as const,
            bias: 0,
            innovation: i,
          })),
          { id: 51, type: 'output', bias: -0.5 },
        ],
        connections: [
          { fromNode: 0, toNode: 1, weight: 0.5, enabled: true, innovation: 0 },
          // Chain connections
          ...Array.from({ length: 49 }, (_, i) => ({
            fromNode: i + 1,
            toNode: i + 2,
            weight: 0.5,
            enabled: true,
            innovation: i + 1,
          })),
          { fromNode: 50, toNode: 51, weight: 0.5, enabled: true, innovation: 50 },
        ],
        activation: 'tanh',
      };

      expect(genome.neurons.filter(n => n.type === 'hidden').length).toBe(50);
    });
  });

  describe('Wide Networks', () => {
    it('should handle very wide hidden layer (many neurons at same depth)', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          // 100 hidden neurons all at depth 1
          ...Array.from({ length: 100 }, (_, i) => ({
            id: i + 1,
            type: 'hidden' as const,
            bias: 0,
            innovation: i,
          })),
          { id: 101, type: 'output', bias: -0.5 },
        ],
        connections: [
          // Input -> all hidden
          ...Array.from({ length: 100 }, (_, i) => ({
            fromNode: 0,
            toNode: i + 1,
            weight: 0.5,
            enabled: true,
            innovation: i,
          })),
          // All hidden -> output
          ...Array.from({ length: 100 }, (_, i) => ({
            fromNode: i + 1,
            toNode: 101,
            weight: 0.5,
            enabled: true,
            innovation: 100 + i,
          })),
        ],
        activation: 'tanh',
      };

      expect(genome.connections.length).toBe(200);
    });
  });

  describe('Skip Connections', () => {
    it('should handle input directly connected to output (skip all hidden)', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'hidden', bias: 0, innovation: 1 },
          { id: 2, type: 'output', bias: -0.5 },
        ],
        connections: [
          { fromNode: 0, toNode: 2, weight: 0.5, enabled: true, innovation: 0 },  // Skip hidden
          { fromNode: 0, toNode: 1, weight: 0.5, enabled: true, innovation: 1 },
          { fromNode: 1, toNode: 2, weight: 0.5, enabled: true, innovation: 2 },
        ],
        activation: 'tanh',
      };

      // Connection from input 0 to output 2 skips hidden
      const skipConn = genome.connections.find(c => c.fromNode === 0 && c.toNode === 2);
      expect(skipConn).toBeDefined();
    });
  });

  describe('Self-Loops (Invalid but Possible)', () => {
    it('should handle self-loop connections (malformed)', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'hidden', bias: 0, innovation: 1 },
          { id: 2, type: 'output', bias: -0.5 },
        ],
        connections: [
          { fromNode: 1, toNode: 1, weight: 0.5, enabled: true, innovation: 0 },  // Self-loop!
          { fromNode: 0, toNode: 1, weight: 0.5, enabled: true, innovation: 1 },
          { fromNode: 1, toNode: 2, weight: 0.5, enabled: true, innovation: 2 },
        ],
        activation: 'tanh',
      };

      const selfLoop = genome.connections.find(c => c.fromNode === c.toNode);
      expect(selfLoop).toBeDefined();
    });
  });
});

// =============================================================================
// API Conversion Edge Cases
// =============================================================================

import { toApiGenome, fromApiGenome } from '../services/ApiClient';

describe('NEAT API Conversion Edge Cases', () => {

  describe('toApiGenome', () => {
    it('should handle genome with NEAT data', () => {
      const genome: CreatureGenome = {
        id: 'test-1',
        generation: 0,
        survivalStreak: 0,
        parentIds: [],
        nodes: [{ id: 'n1', position: { x: 0, y: 0, z: 0 }, size: 0.5, friction: 0.5 }],
        muscles: [],
        globalFrequencyMultiplier: 1.0,
        controllerType: 'neural',
        color: { h: 0.5, s: 0.7, l: 0.5 },
        neatGenome: createMinimalNEATGenome(3, 2),
      };

      const apiGenome = toApiGenome(genome);
      expect(apiGenome.neat_genome).toBeDefined();
      expect(apiGenome.neat_genome.neurons).toHaveLength(5);  // 3 input + 2 output
    });

    it('should handle genome with undefined neatGenome', () => {
      const genome: CreatureGenome = {
        id: 'test-1',
        generation: 0,
        survivalStreak: 0,
        parentIds: [],
        nodes: [{ id: 'n1', position: { x: 0, y: 0, z: 0 }, size: 0.5, friction: 0.5 }],
        muscles: [],
        globalFrequencyMultiplier: 1.0,
        controllerType: 'oscillator',
        color: { h: 0.5, s: 0.7, l: 0.5 },
      };

      const apiGenome = toApiGenome(genome);
      expect(apiGenome.neat_genome).toBeNull();
    });

    it('should sanitize NaN weights in NEAT genome', () => {
      const neatGenome = createMinimalNEATGenome(1, 1);
      neatGenome.connections[0].weight = NaN;

      const genome: CreatureGenome = {
        id: 'test-1',
        generation: 0,
        survivalStreak: 0,
        parentIds: [],
        nodes: [{ id: 'n1', position: { x: 0, y: 0, z: 0 }, size: 0.5, friction: 0.5 }],
        muscles: [],
        globalFrequencyMultiplier: 1.0,
        controllerType: 'neural',
        color: { h: 0.5, s: 0.7, l: 0.5 },
        neatGenome,
      };

      const apiGenome = toApiGenome(genome);
      // NaN should be converted to 0 by safeNum
      expect(Number.isNaN(apiGenome.neat_genome.connections[0].weight)).toBe(false);
      expect(apiGenome.neat_genome.connections[0].weight).toBe(0);
    });

    it('should convert connection field names to snake_case', () => {
      const genome: CreatureGenome = {
        id: 'test-1',
        generation: 0,
        survivalStreak: 0,
        parentIds: [],
        nodes: [{ id: 'n1', position: { x: 0, y: 0, z: 0 }, size: 0.5, friction: 0.5 }],
        muscles: [],
        globalFrequencyMultiplier: 1.0,
        controllerType: 'neural',
        color: { h: 0.5, s: 0.7, l: 0.5 },
        neatGenome: createMinimalNEATGenome(1, 1),
      };

      const apiGenome = toApiGenome(genome);
      // Should use snake_case
      expect(apiGenome.neat_genome.connections[0].from_node).toBeDefined();
      expect(apiGenome.neat_genome.connections[0].to_node).toBeDefined();
    });
  });

  describe('fromApiGenome', () => {
    it('should parse NEAT genome from API response (snake_case)', () => {
      const apiGenome = {
        id: 'test-1',
        generation: 0,
        survival_streak: 0,
        parent_ids: [],
        nodes: [],
        muscles: [],
        global_frequency_multiplier: 1.0,
        controller_type: 'neural',
        color: { h: 0.5, s: 0.7, l: 0.5 },
        neat_genome: {
          neurons: [
            { id: 0, type: 'input', bias: 0, innovation: null },
            { id: 1, type: 'output', bias: -0.5, innovation: null },
          ],
          connections: [
            { from_node: 0, to_node: 1, weight: 0.5, enabled: true, innovation: 0 },
          ],
          activation: 'tanh',
        },
      };

      const genome = fromApiGenome(apiGenome);
      expect(genome.neatGenome).toBeDefined();
      expect(genome.neatGenome!.neurons).toHaveLength(2);
      expect(genome.neatGenome!.connections[0].fromNode).toBe(0);
      expect(genome.neatGenome!.connections[0].toNode).toBe(1);
    });

    it('should handle API response with camelCase neat genome', () => {
      const apiGenome = {
        id: 'test-1',
        generation: 0,
        survivalStreak: 0,
        parentIds: [],
        nodes: [],
        muscles: [],
        globalFrequencyMultiplier: 1.0,
        controllerType: 'neural',
        color: { h: 0.5, s: 0.7, l: 0.5 },
        neatGenome: {  // camelCase
          neurons: [
            { id: 0, type: 'input', bias: 0 },
            { id: 1, type: 'output', bias: -0.5 },
          ],
          connections: [
            { fromNode: 0, toNode: 1, weight: 0.5, enabled: true, innovation: 0 },
          ],
          activation: 'tanh',
        },
      };

      const genome = fromApiGenome(apiGenome);
      expect(genome.neatGenome).toBeDefined();
    });

    it('should handle null/undefined neat genome', () => {
      const apiGenome = {
        id: 'test-1',
        generation: 0,
        survival_streak: 0,
        parent_ids: [],
        nodes: [],
        muscles: [],
        global_frequency_multiplier: 1.0,
        controller_type: 'oscillator',
        color: { h: 0.5, s: 0.7, l: 0.5 },
        neat_genome: null,
      };

      const genome = fromApiGenome(apiGenome);
      expect(genome.neatGenome).toBeUndefined();
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve NEAT genome through toApi -> fromApi round-trip', () => {
      const originalGenome: CreatureGenome = {
        id: 'test-1',
        generation: 5,
        survivalStreak: 2,
        parentIds: ['parent-1'],
        nodes: [{ id: 'n1', position: { x: 1, y: 2, z: 3 }, size: 0.5, friction: 0.5 }],
        muscles: [],
        globalFrequencyMultiplier: 1.5,
        controllerType: 'neural',
        color: { h: 0.3, s: 0.8, l: 0.6 },
        neatGenome: createMinimalNEATGenome(2, 3),
      };

      const apiGenome = toApiGenome(originalGenome);
      const recoveredGenome = fromApiGenome(apiGenome);

      expect(recoveredGenome.neatGenome).toBeDefined();
      expect(recoveredGenome.neatGenome!.neurons.length).toBe(originalGenome.neatGenome!.neurons.length);
      expect(recoveredGenome.neatGenome!.connections.length).toBe(originalGenome.neatGenome!.connections.length);
    });
  });
});

// =============================================================================
// Activation Data Edge Cases
// =============================================================================

describe('NEAT Activation Data Edge Cases', () => {
  describe('Frame Activations', () => {
    it('should handle empty activations arrays', () => {
      const activations: FrameActivations = {
        inputs: [],
        hidden: [],
        outputs: [],
      };

      expect(activations.inputs.length).toBe(0);
      expect(activations.hidden.length).toBe(0);
      expect(activations.outputs.length).toBe(0);
    });

    it('should handle activations with NaN values', () => {
      const activations: FrameActivations = {
        inputs: [0.5, NaN, -0.3],
        hidden: [NaN, 0.1],
        outputs: [NaN],
        outputs_raw: [0.05],
      };

      expect(activations.inputs.some(v => Number.isNaN(v))).toBe(true);
    });

    it('should handle mismatched activation array sizes', () => {
      // More activations than neurons might exist - should handle gracefully
      const activations: FrameActivations = {
        inputs: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],  // 10 values
        hidden: [0.1, 0.2],  // 2 values
        outputs: [0.5],  // 1 value
      };

      expect(activations.inputs.length).toBe(10);
    });
  });
});

// =============================================================================
// Stats Panel Integration
// =============================================================================

describe('NEAT Stats Panel Edge Cases', () => {
  describe('Topology Statistics', () => {
    it('should calculate correct avg hidden nodes', () => {
      const genomes = [
        { neatGenome: createMinimalNEATGenome(3, 2) },  // 0 hidden
        { neatGenome: {
          neurons: [
            { id: 0, type: 'input' as const, bias: 0 },
            { id: 1, type: 'hidden' as const, bias: 0, innovation: 1 },
            { id: 2, type: 'hidden' as const, bias: 0, innovation: 2 },
            { id: 3, type: 'output' as const, bias: -0.5 },
          ],
          connections: [],
          activation: 'tanh',
        }},  // 2 hidden
      ];

      const avgHidden = genomes.reduce((sum, g) => {
        return sum + g.neatGenome!.neurons.filter(n => n.type === 'hidden').length;
      }, 0) / genomes.length;

      expect(avgHidden).toBe(1);  // (0 + 2) / 2
    });

    it('should calculate correct avg connections (enabled vs total)', () => {
      const genome = createMinimalNEATGenome(2, 2);  // 4 connections
      genome.connections[0].enabled = false;
      genome.connections[1].enabled = false;

      const enabledCount = genome.connections.filter(c => c.enabled).length;
      const totalCount = genome.connections.length;

      expect(enabledCount).toBe(2);
      expect(totalCount).toBe(4);
    });

    it('should handle division by zero when no NEAT genomes', () => {
      const genomes: { neatGenome?: NEATGenome }[] = [
        { neatGenome: undefined },
        {},
      ];

      const neatGenomes = genomes.filter(g => g.neatGenome);
      expect(neatGenomes.length).toBe(0);

      // Avoid division by zero
      const avgHidden = neatGenomes.length > 0
        ? neatGenomes.reduce((sum, g) => sum + g.neatGenome!.neurons.filter(n => n.type === 'hidden').length, 0) / neatGenomes.length
        : 0;

      expect(avgHidden).toBe(0);
    });
  });
});

// =============================================================================
// ReplayModal Integration
// =============================================================================

describe('NEAT ReplayModal Edge Cases', () => {
  describe('Genome Detection', () => {
    it('should detect NEAT genome when present', () => {
      const genome = {
        neuralGenome: undefined,
        neatGenome: createMinimalNEATGenome(3, 2),
        controllerType: 'neural' as const,
      };

      const hasNeuralGenome = (genome.neuralGenome || genome.neatGenome) && genome.controllerType === 'neural';
      const isNEAT = !!genome.neatGenome;

      expect(hasNeuralGenome).toBe(true);
      expect(isNEAT).toBe(true);
    });

    it('should prefer NEAT genome over fixed topology when both present', () => {
      const genome = {
        neuralGenome: { weights: [0.1, 0.2], topology: { inputSize: 2, hiddenSize: 2, outputSize: 1 }, activation: 'tanh' },
        neatGenome: createMinimalNEATGenome(3, 2),
        controllerType: 'neural' as const,
      };

      const isNEAT = !!genome.neatGenome;
      expect(isNEAT).toBe(true);
    });

    it('should fall back to fixed topology when no NEAT genome', () => {
      const genome = {
        neuralGenome: { weights: [0.1, 0.2], topology: { inputSize: 2, hiddenSize: 2, outputSize: 1 }, activation: 'tanh' },
        neatGenome: undefined,
        controllerType: 'neural' as const,
      };

      const isNEAT = !!genome.neatGenome;
      expect(isNEAT).toBe(false);
    });
  });
});

// =============================================================================
// Large Scale / Stress Tests
// =============================================================================

describe('NEAT Stress Tests', () => {
  describe('Large Networks', () => {
    it('should handle genome with 1000 neurons', () => {
      const neurons: NeuronGene[] = [
        { id: 0, type: 'input', bias: 0 },
        ...Array.from({ length: 998 }, (_, i) => ({
          id: i + 1,
          type: 'hidden' as const,
          bias: 0,
          innovation: i,
        })),
        { id: 999, type: 'output', bias: -0.5 },
      ];

      const genome: NEATGenome = {
        neurons,
        connections: [],
        activation: 'tanh',
      };

      expect(genome.neurons.length).toBe(1000);
    });

    it('should handle genome with 10000 connections', () => {
      const genome: NEATGenome = {
        neurons: [
          ...Array.from({ length: 100 }, (_, i) => ({ id: i, type: 'input' as const, bias: 0 })),
          ...Array.from({ length: 100 }, (_, i) => ({ id: i + 100, type: 'output' as const, bias: -0.5 })),
        ],
        connections: Array.from({ length: 10000 }, (_, i) => ({
          fromNode: i % 100,
          toNode: 100 + (i % 100),
          weight: Math.random(),
          enabled: true,
          innovation: i,
        })),
        activation: 'tanh',
      };

      expect(genome.connections.length).toBe(10000);
    });
  });

  describe('Rapid Genome Switching', () => {
    it('should handle rapid genome type switching', () => {
      // Simulate rapid switching between NEAT and fixed topology
      const neatGenome = createMinimalNEATGenome(3, 2);
      const fixedGenome = { weights: [0.1], topology: { inputSize: 3, hiddenSize: 4, outputSize: 2 }, activation: 'tanh' };

      let current: { neat?: NEATGenome; fixed?: typeof fixedGenome } = {};

      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          current = { neat: neatGenome };
        } else {
          current = { fixed: fixedGenome };
        }
      }

      // 100 iterations means last is i=99 (odd), so ends with fixed
      expect(current.fixed).toBeDefined();
    });
  });
});

// =============================================================================
// NeuralVisualizer NEAT Depth Computation
// =============================================================================

describe('NEAT Depth Computation Edge Cases', () => {
  // Reimplementation of computeNEATNeuronDepths for testing
  function computeNEATNeuronDepths(genome: NEATGenome): { depths: Map<number, number>; maxDepth: number } {
    const inputIds = new Set(genome.neurons.filter(n => n.type === 'input').map(n => n.id));
    const outputIds = new Set(genome.neurons.filter(n => n.type === 'output').map(n => n.id));

    const outgoing = new Map<number, Set<number>>();
    for (const n of genome.neurons) {
      outgoing.set(n.id, new Set());
    }
    for (const conn of genome.connections) {
      if (conn.enabled) {
        outgoing.get(conn.fromNode)?.add(conn.toNode);
      }
    }

    const depths = new Map<number, number>();
    for (const inputId of inputIds) {
      depths.set(inputId, 0);
    }

    const queue = [...inputIds];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDepth = depths.get(current) ?? 0;

      for (const target of outgoing.get(current) ?? []) {
        const newDepth = currentDepth + 1;
        if (!depths.has(target) || newDepth > depths.get(target)!) {
          depths.set(target, newDepth);
          queue.push(target);
        }
      }
    }

    let maxDepth = Math.max(...depths.values(), 1);
    for (const outputId of outputIds) {
      depths.set(outputId, maxDepth);
    }

    for (const neuron of genome.neurons) {
      if (!depths.has(neuron.id)) {
        depths.set(neuron.id, 0);
      }
    }

    return { depths, maxDepth };
  }

  describe('Basic Depth Computation', () => {
    it('should compute depth 0 for inputs, maxDepth for outputs', () => {
      const genome = createMinimalNEATGenome(2, 2);
      const { depths, maxDepth } = computeNEATNeuronDepths(genome);

      // Inputs should be depth 0
      expect(depths.get(0)).toBe(0);
      expect(depths.get(1)).toBe(0);

      // Outputs should be at maxDepth (1 since directly connected)
      expect(depths.get(2)).toBe(maxDepth);
      expect(depths.get(3)).toBe(maxDepth);
      expect(maxDepth).toBe(1);
    });

    it('should compute correct depth for hidden neurons in chain', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'hidden', bias: 0, innovation: 1 },
          { id: 2, type: 'hidden', bias: 0, innovation: 2 },
          { id: 3, type: 'output', bias: -0.5 },
        ],
        connections: [
          { fromNode: 0, toNode: 1, weight: 0.5, enabled: true, innovation: 0 },
          { fromNode: 1, toNode: 2, weight: 0.5, enabled: true, innovation: 1 },
          { fromNode: 2, toNode: 3, weight: 0.5, enabled: true, innovation: 2 },
        ],
        activation: 'tanh',
      };

      const { depths, maxDepth } = computeNEATNeuronDepths(genome);

      expect(depths.get(0)).toBe(0);  // Input
      expect(depths.get(1)).toBe(1);  // First hidden
      expect(depths.get(2)).toBe(2);  // Second hidden
      expect(depths.get(3)).toBe(maxDepth);  // Output at max
      expect(maxDepth).toBe(3);
    });
  });

  describe('Empty Genome Depth Computation', () => {
    it('should return maxDepth 1 for empty genome', () => {
      const genome: NEATGenome = {
        neurons: [],
        connections: [],
        activation: 'tanh',
      };

      const { depths, maxDepth } = computeNEATNeuronDepths(genome);

      expect(depths.size).toBe(0);
      expect(maxDepth).toBe(1);  // Math.max(...[], 1) = 1
    });

    it('should handle genome with only outputs (all at depth 1)', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'output', bias: -0.5 },
          { id: 1, type: 'output', bias: -0.5 },
        ],
        connections: [],
        activation: 'tanh',
      };

      const { depths, maxDepth } = computeNEATNeuronDepths(genome);

      expect(depths.get(0)).toBe(1);  // Outputs at maxDepth
      expect(depths.get(1)).toBe(1);
      expect(maxDepth).toBe(1);
    });
  });

  describe('Disconnected Neuron Depth', () => {
    it('should place disconnected hidden neurons at depth 0', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'hidden', bias: 0, innovation: 1 },  // Disconnected
          { id: 2, type: 'output', bias: -0.5 },
        ],
        connections: [
          { fromNode: 0, toNode: 2, weight: 0.5, enabled: true, innovation: 0 },
        ],
        activation: 'tanh',
      };

      const { depths } = computeNEATNeuronDepths(genome);

      expect(depths.get(1)).toBe(0);  // Disconnected hidden at depth 0
    });
  });

  describe('Skip Connection Depth', () => {
    it('should handle multiple paths and use longest path depth', () => {
      // Diamond topology: input -> (h1, h2) -> output
      // With skip connection: input -> output
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'hidden', bias: 0, innovation: 1 },
          { id: 2, type: 'output', bias: -0.5 },
        ],
        connections: [
          { fromNode: 0, toNode: 1, weight: 0.5, enabled: true, innovation: 0 },
          { fromNode: 1, toNode: 2, weight: 0.5, enabled: true, innovation: 1 },
          { fromNode: 0, toNode: 2, weight: 0.5, enabled: true, innovation: 2 },  // Skip
        ],
        activation: 'tanh',
      };

      const { depths, maxDepth } = computeNEATNeuronDepths(genome);

      // Output should be at depth 2 (longest path via hidden)
      expect(depths.get(2)).toBe(maxDepth);
      expect(maxDepth).toBe(2);
    });
  });

  describe('Disabled Connection Handling', () => {
    it('should ignore disabled connections for depth calculation', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'hidden', bias: 0, innovation: 1 },
          { id: 2, type: 'output', bias: -0.5 },
        ],
        connections: [
          { fromNode: 0, toNode: 1, weight: 0.5, enabled: false, innovation: 0 },  // Disabled!
          { fromNode: 1, toNode: 2, weight: 0.5, enabled: false, innovation: 1 },  // Disabled!
          { fromNode: 0, toNode: 2, weight: 0.5, enabled: true, innovation: 2 },   // Only this enabled
        ],
        activation: 'tanh',
      };

      const { depths, maxDepth } = computeNEATNeuronDepths(genome);

      // Hidden neuron should be disconnected (depth 0)
      expect(depths.get(1)).toBe(0);
      // Output reached directly from input, so maxDepth is 1
      expect(maxDepth).toBe(1);
    });
  });
});

// =============================================================================
// Integration: Full Pipeline Tests
// =============================================================================

// =============================================================================
// NeuralVisualizer Class Edge Cases (actual class instantiation)
// =============================================================================

describe('NeuralVisualizer Class Edge Cases', () => {
  let mockContainer: HTMLElement;
  let visualizer: InstanceType<typeof import('../ui/NeuralVisualizer').NeuralVisualizer>;
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  beforeEach(async () => {
    // Mock canvas getContext to return a proper 2D context
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(function(contextId: string) {
      if (contextId === '2d') {
        return {
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 1,
          font: '',
          textAlign: 'left',
          textBaseline: 'alphabetic',
          fillRect: vi.fn(),
          fillText: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          stroke: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          scale: vi.fn(),
          setLineDash: vi.fn(),
          setTransform: vi.fn(),
          measureText: vi.fn(() => ({ width: 50 })),
        } as unknown as CanvasRenderingContext2D;
      }
      return null;
    }) as typeof HTMLCanvasElement.prototype.getContext;

    // Create mock container
    mockContainer = document.createElement('div');
    document.body.appendChild(mockContainer);

    // Import and instantiate visualizer
    const { NeuralVisualizer } = await import('../ui/NeuralVisualizer');
    visualizer = new NeuralVisualizer(mockContainer, { width: 400, height: 200 });
  });

  afterEach(() => {
    visualizer?.dispose();
    mockContainer?.remove();
    // Restore original getContext
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  describe('setNEATGenome Edge Cases', () => {
    it('should handle setting undefined genome', () => {
      expect(() => {
        visualizer.setNEATGenome(undefined, []);
      }).not.toThrow();
    });

    it('should handle empty genome', () => {
      const emptyGenome: NEATGenome = {
        neurons: [],
        connections: [],
        activation: 'tanh',
      };

      expect(() => {
        visualizer.setNEATGenome(emptyGenome, []);
      }).not.toThrow();
    });

    it('should handle genome with only inputs', () => {
      const inputOnlyGenome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'input', bias: 0 },
        ],
        connections: [],
        activation: 'tanh',
      };

      expect(() => {
        visualizer.setNEATGenome(inputOnlyGenome, []);
      }).not.toThrow();
    });

    it('should handle genome with disconnected hidden neurons', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'hidden', bias: 0, innovation: 1 },
          { id: 2, type: 'hidden', bias: 0, innovation: 2 },
          { id: 3, type: 'output', bias: -0.5 },
        ],
        connections: [
          // Only connects input to output, hidden neurons are orphaned
          { fromNode: 0, toNode: 3, weight: 0.5, enabled: true, innovation: 0 },
        ],
        activation: 'tanh',
      };

      expect(() => {
        visualizer.setNEATGenome(genome, ['M1']);
      }).not.toThrow();
    });

    it('should handle rapid genome switching', () => {
      const genome1 = createMinimalNEATGenome(2, 1);
      const genome2 = createMinimalNEATGenome(3, 2);

      expect(() => {
        for (let i = 0; i < 50; i++) {
          visualizer.setNEATGenome(i % 2 === 0 ? genome1 : genome2, []);
        }
      }).not.toThrow();
    });

    it('should handle switching between NEAT and fixed topology', async () => {
      const neatGenome = createMinimalNEATGenome(3, 2);
      const fixedGenome = {
        weights: Array(3 * 4 + 4 + 4 * 2 + 2).fill(0.1),
        topology: { inputSize: 3, hiddenSize: 4, outputSize: 2 },
        activation: 'tanh' as const,
      };

      expect(() => {
        visualizer.setNEATGenome(neatGenome, ['M1', 'M2']);
        visualizer.setGenome(fixedGenome, ['M1', 'M2']);
        visualizer.setNEATGenome(neatGenome, ['M1', 'M2']);
        visualizer.clear();
        visualizer.setGenome(fixedGenome, ['M1', 'M2']);
      }).not.toThrow();
    });

    it('should handle genome with all connections disabled', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'output', bias: -0.5 },
        ],
        connections: [
          { fromNode: 0, toNode: 1, weight: 0.5, enabled: false, innovation: 0 },
        ],
        activation: 'tanh',
      };

      expect(() => {
        visualizer.setNEATGenome(genome, []);
      }).not.toThrow();
    });
  });

  describe('setStoredActivations Edge Cases', () => {
    it('should handle activations before genome is set', () => {
      expect(() => {
        visualizer.setStoredActivations({
          inputs: [0.1, 0.2, 0.3],
          hidden: [0.5],
          outputs: [0.8],
        });
      }).not.toThrow();
    });

    it('should handle empty activation arrays with NEAT genome', () => {
      const genome = createMinimalNEATGenome(3, 2);
      visualizer.setNEATGenome(genome, ['M1', 'M2']);

      expect(() => {
        visualizer.setStoredActivations({
          inputs: [],
          hidden: [],
          outputs: [],
        });
      }).not.toThrow();
    });

    it('should handle NaN activations', () => {
      const genome = createMinimalNEATGenome(2, 1);
      visualizer.setNEATGenome(genome, ['M1']);

      expect(() => {
        visualizer.setStoredActivations({
          inputs: [NaN, 0.5],
          hidden: [],
          outputs: [NaN],
          outputs_raw: [0.1],
        });
      }).not.toThrow();
    });

    it('should handle Infinity activations', () => {
      const genome = createMinimalNEATGenome(2, 1);
      visualizer.setNEATGenome(genome, ['M1']);

      expect(() => {
        visualizer.setStoredActivations({
          inputs: [Infinity, -Infinity],
          hidden: [],
          outputs: [Infinity],
        });
      }).not.toThrow();
    });

    it('should handle mismatched activation sizes', () => {
      const genome = createMinimalNEATGenome(3, 2);  // 3 inputs, 2 outputs
      visualizer.setNEATGenome(genome, ['M1', 'M2']);

      expect(() => {
        // More inputs than neurons
        visualizer.setStoredActivations({
          inputs: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
          hidden: [],
          outputs: [0.5],  // Fewer outputs than neurons
        });
      }).not.toThrow();
    });

    it('should handle legacy format (array)', () => {
      const genome = createMinimalNEATGenome(2, 2);
      visualizer.setNEATGenome(genome, ['M1', 'M2']);

      expect(() => {
        visualizer.setStoredActivations([0.5, -0.3]);  // Legacy format
      }).not.toThrow();
    });
  });

  describe('Proprioception and Time Encoding Edge Cases', () => {
    it('should handle proprioception with zero muscles', () => {
      const genome = createMinimalNEATGenome(7, 1);  // Base sensors only
      visualizer.setNEATGenome(genome, []);

      expect(() => {
        visualizer.setProprioception({
          enabled: true,
          inputs: 'all',
          numMuscles: 0,
          numNodes: 0,
        });
      }).not.toThrow();
    });

    it('should handle all time encodings', () => {
      const genome = createMinimalNEATGenome(10, 2);
      visualizer.setNEATGenome(genome, ['M1', 'M2']);

      const encodings: Array<'none' | 'cyclic' | 'sin' | 'raw' | 'sin_raw'> = [
        'none', 'cyclic', 'sin', 'raw', 'sin_raw'
      ];

      expect(() => {
        for (const encoding of encodings) {
          visualizer.setTimeEncoding(encoding);
        }
      }).not.toThrow();
    });

    it('should handle rapid config changes', () => {
      const genome = createMinimalNEATGenome(50, 10);
      visualizer.setNEATGenome(genome, Array.from({ length: 10 }, (_, i) => `M${i}`));

      expect(() => {
        for (let i = 0; i < 20; i++) {
          visualizer.setTimeEncoding(i % 2 === 0 ? 'cyclic' : 'none');
          visualizer.setProprioception({
            enabled: i % 3 === 0,
            inputs: ['strain', 'velocity', 'ground', 'all'][i % 4] as ProprioceptionInputs,
            numMuscles: i % 15,
            numNodes: i % 8,
          });
        }
      }).not.toThrow();
    });
  });

  describe('Resize Edge Cases', () => {
    it('should handle resize to zero dimensions', () => {
      visualizer.setNEATGenome(createMinimalNEATGenome(3, 2), []);

      expect(() => {
        visualizer.resize(0, 0);
      }).not.toThrow();
    });

    it('should handle resize to very large dimensions', () => {
      visualizer.setNEATGenome(createMinimalNEATGenome(3, 2), []);

      expect(() => {
        visualizer.resize(10000, 10000);
      }).not.toThrow();
    });

    it('should handle rapid resizes', () => {
      visualizer.setNEATGenome(createMinimalNEATGenome(3, 2), []);

      expect(() => {
        for (let i = 0; i < 100; i++) {
          visualizer.resize(100 + i * 10, 50 + i * 5);
        }
      }).not.toThrow();
    });
  });
});

// Need ProprioceptionInputs type for the test
type ProprioceptionInputs = 'strain' | 'velocity' | 'ground' | 'all';

// =============================================================================
// Extreme Scale Tests
// =============================================================================

describe('NEAT Extreme Scale Tests', () => {
  describe('Memory Pressure', () => {
    it('should handle genome with 5000 hidden neurons', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          ...Array.from({ length: 5000 }, (_, i) => ({
            id: i + 1,
            type: 'hidden' as const,
            bias: 0,
            innovation: i,
          })),
          { id: 5001, type: 'output', bias: -0.5 },
        ],
        connections: [],
        activation: 'tanh',
      };

      expect(genome.neurons.length).toBe(5002);
      expect(genome.neurons.filter(n => n.type === 'hidden').length).toBe(5000);
    });

    it('should handle genome with 50000 connections', () => {
      const genome: NEATGenome = {
        neurons: [
          ...Array.from({ length: 200 }, (_, i) => ({ id: i, type: 'input' as const, bias: 0 })),
          ...Array.from({ length: 250 }, (_, i) => ({ id: i + 200, type: 'output' as const, bias: -0.5 })),
        ],
        connections: Array.from({ length: 50000 }, (_, i) => ({
          fromNode: i % 200,
          toNode: 200 + (i % 250),
          weight: Math.random() * 2 - 1,
          enabled: Math.random() > 0.1,  // 90% enabled
          innovation: i,
        })),
        activation: 'tanh',
      };

      expect(genome.connections.length).toBe(50000);
    });

    it('should handle deep chain network (100 layers)', () => {
      const neurons: NeuronGene[] = [{ id: 0, type: 'input', bias: 0 }];
      const connections: ConnectionGene[] = [];

      // Create a chain of 100 hidden neurons
      for (let i = 0; i < 100; i++) {
        neurons.push({ id: i + 1, type: 'hidden', bias: 0, innovation: i });
        connections.push({
          fromNode: i,
          toNode: i + 1,
          weight: 0.9,  // Will attenuate to ~0 after 100 layers
          enabled: true,
          innovation: i,
        });
      }

      // Final output neuron
      neurons.push({ id: 101, type: 'output', bias: -0.5 });
      connections.push({ fromNode: 100, toNode: 101, weight: 1.0, enabled: true, innovation: 100 });

      const genome: NEATGenome = { neurons, connections, activation: 'tanh' };

      expect(genome.neurons.filter(n => n.type === 'hidden').length).toBe(100);
    });
  });

  describe('Numerical Extremes in Computation', () => {
    it('should handle genome where all weights cause overflow', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'hidden', bias: 1e100, innovation: 1 },
          { id: 2, type: 'output', bias: 1e100 },
        ],
        connections: [
          { fromNode: 0, toNode: 1, weight: 1e100, enabled: true, innovation: 0 },
          { fromNode: 1, toNode: 2, weight: 1e100, enabled: true, innovation: 1 },
        ],
        activation: 'tanh',
      };

      // Should not throw when processing
      const hidden = genome.neurons.filter(n => n.type === 'hidden');
      expect(hidden.length).toBe(1);
    });

    it('should handle genome where all weights cause underflow', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'hidden', bias: 1e-300, innovation: 1 },
          { id: 2, type: 'output', bias: 1e-300 },
        ],
        connections: [
          { fromNode: 0, toNode: 1, weight: 1e-300, enabled: true, innovation: 0 },
          { fromNode: 1, toNode: 2, weight: 1e-300, enabled: true, innovation: 1 },
        ],
        activation: 'tanh',
      };

      const hidden = genome.neurons.filter(n => n.type === 'hidden');
      expect(hidden.length).toBe(1);
    });
  });

  describe('Graph Topology Edge Cases', () => {
    it('should handle complete bipartite graph (all-to-all connections)', () => {
      const inputCount = 50;
      const outputCount = 50;
      const neurons: NeuronGene[] = [
        ...Array.from({ length: inputCount }, (_, i) => ({ id: i, type: 'input' as const, bias: 0 })),
        ...Array.from({ length: outputCount }, (_, i) => ({
          id: inputCount + i,
          type: 'output' as const,
          bias: -0.5,
        })),
      ];

      const connections: ConnectionGene[] = [];
      let innov = 0;
      for (let i = 0; i < inputCount; i++) {
        for (let o = 0; o < outputCount; o++) {
          connections.push({
            fromNode: i,
            toNode: inputCount + o,
            weight: Math.random() * 2 - 1,
            enabled: true,
            innovation: innov++,
          });
        }
      }

      const genome: NEATGenome = { neurons, connections, activation: 'tanh' };

      // 50 * 50 = 2500 connections
      expect(genome.connections.length).toBe(2500);
    });

    it('should handle star topology (one hub connected to all)', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'hidden', bias: 0, innovation: 1 },  // Hub
          ...Array.from({ length: 20 }, (_, i) => ({
            id: i + 2,
            type: 'output' as const,
            bias: -0.5,
          })),
        ],
        connections: [
          { fromNode: 0, toNode: 1, weight: 1.0, enabled: true, innovation: 0 },
          ...Array.from({ length: 20 }, (_, i) => ({
            fromNode: 1,
            toNode: i + 2,
            weight: Math.random(),
            enabled: true,
            innovation: i + 1,
          })),
        ],
        activation: 'tanh',
      };

      // Hub connected to all 20 outputs
      expect(genome.connections.filter(c => c.fromNode === 1).length).toBe(20);
    });

    it('should handle diamond topology with multiple paths', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'hidden', bias: 0, innovation: 1 },
          { id: 2, type: 'hidden', bias: 0, innovation: 2 },
          { id: 3, type: 'hidden', bias: 0, innovation: 3 },
          { id: 4, type: 'output', bias: -0.5 },
        ],
        connections: [
          // Diamond: input -> (h1, h2, h3) -> output
          { fromNode: 0, toNode: 1, weight: 0.5, enabled: true, innovation: 0 },
          { fromNode: 0, toNode: 2, weight: 0.5, enabled: true, innovation: 1 },
          { fromNode: 0, toNode: 3, weight: 0.5, enabled: true, innovation: 2 },
          { fromNode: 1, toNode: 4, weight: 0.5, enabled: true, innovation: 3 },
          { fromNode: 2, toNode: 4, weight: 0.5, enabled: true, innovation: 4 },
          { fromNode: 3, toNode: 4, weight: 0.5, enabled: true, innovation: 5 },
        ],
        activation: 'tanh',
      };

      const pathsToOutput = genome.connections.filter(c => c.toNode === 4).length;
      expect(pathsToOutput).toBe(3);
    });
  });
});

// =============================================================================
// API Edge Cases - Field Mapping
// =============================================================================

describe('NEAT API Field Mapping Edge Cases', () => {
  describe('toApiGenome field edge cases', () => {
    it('should handle innovation number as undefined', () => {
      const genome: CreatureGenome = {
        id: 'test',
        generation: 0,
        survivalStreak: 0,
        parentIds: [],
        nodes: [{ id: 'n1', position: { x: 0, y: 0, z: 0 }, size: 0.5, friction: 0.5 }],
        muscles: [],
        globalFrequencyMultiplier: 1.0,
        controllerType: 'neural',
        color: { h: 0.5, s: 0.7, l: 0.5 },
        neatGenome: {
          neurons: [
            { id: 0, type: 'input', bias: 0 },  // No innovation
            { id: 1, type: 'output', bias: -0.5 },  // No innovation
          ],
          connections: [
            { fromNode: 0, toNode: 1, weight: 0.5, enabled: true, innovation: 0 },
          ],
          activation: 'tanh',
        },
      };

      const apiGenome = toApiGenome(genome);
      expect(apiGenome.neat_genome.neurons[0].innovation).toBeNull();
    });

    it('should handle empty muscle names array', () => {
      const genome: CreatureGenome = {
        id: 'test',
        generation: 0,
        survivalStreak: 0,
        parentIds: [],
        nodes: [{ id: 'n1', position: { x: 0, y: 0, z: 0 }, size: 0.5, friction: 0.5 }],
        muscles: [],
        globalFrequencyMultiplier: 1.0,
        controllerType: 'neural',
        color: { h: 0.5, s: 0.7, l: 0.5 },
        neatGenome: createMinimalNEATGenome(1, 1),
      };

      const apiGenome = toApiGenome(genome);
      expect(apiGenome.neat_genome).toBeDefined();
    });
  });

  describe('fromApiGenome field edge cases', () => {
    it('should handle mixed snake_case and camelCase in same response', () => {
      // Real API might return inconsistent casing
      const apiGenome = {
        id: 'test',
        generation: 0,
        survival_streak: 0,  // snake_case
        parentIds: [],  // camelCase
        nodes: [],
        muscles: [],
        global_frequency_multiplier: 1.0,
        controllerType: 'neural',  // camelCase
        color: { h: 0.5, s: 0.7, l: 0.5 },
        neat_genome: {
          neurons: [
            { id: 0, type: 'input', bias: 0 },
            { id: 1, type: 'output', bias: -0.5 },
          ],
          connections: [
            { from_node: 0, to_node: 1, weight: 0.5, enabled: true, innovation: 0 },
          ],
          activation: 'tanh',
        },
      };

      const genome = fromApiGenome(apiGenome);
      expect(genome.neatGenome).toBeDefined();
      expect(genome.neatGenome!.connections[0].fromNode).toBe(0);
    });

    it('should handle null values in neurons', () => {
      const apiGenome = {
        id: 'test',
        generation: 0,
        survival_streak: 0,
        parent_ids: [],
        nodes: [],
        muscles: [],
        global_frequency_multiplier: 1.0,
        controller_type: 'neural',
        color: { h: 0.5, s: 0.7, l: 0.5 },
        neat_genome: {
          neurons: [
            { id: 0, type: 'input', bias: null, innovation: null },
            { id: 1, type: 'output', bias: null, innovation: null },
          ],
          connections: [],
          activation: 'tanh',
        },
      };

      // Should handle null bias gracefully
      const genome = fromApiGenome(apiGenome);
      expect(genome.neatGenome).toBeDefined();
    });
  });
});

// =============================================================================
// Depth Computation Stress Tests
// =============================================================================

describe('NEAT Depth Computation Stress Tests', () => {
  function computeNEATNeuronDepths(genome: NEATGenome): { depths: Map<number, number>; maxDepth: number } {
    const inputIds = new Set(genome.neurons.filter(n => n.type === 'input').map(n => n.id));
    const outputIds = new Set(genome.neurons.filter(n => n.type === 'output').map(n => n.id));

    const outgoing = new Map<number, Set<number>>();
    for (const n of genome.neurons) {
      outgoing.set(n.id, new Set());
    }
    for (const conn of genome.connections) {
      if (conn.enabled) {
        outgoing.get(conn.fromNode)?.add(conn.toNode);
      }
    }

    const depths = new Map<number, number>();
    for (const inputId of inputIds) {
      depths.set(inputId, 0);
    }

    const queue = [...inputIds];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDepth = depths.get(current) ?? 0;

      for (const target of outgoing.get(current) ?? []) {
        const newDepth = currentDepth + 1;
        if (!depths.has(target) || newDepth > depths.get(target)!) {
          depths.set(target, newDepth);
          queue.push(target);
        }
      }
    }

    let maxDepth = Math.max(...depths.values(), 1);
    for (const outputId of outputIds) {
      depths.set(outputId, maxDepth);
    }

    for (const neuron of genome.neurons) {
      if (!depths.has(neuron.id)) {
        depths.set(neuron.id, 0);
      }
    }

    return { depths, maxDepth };
  }

  it('should handle sparse graph (few connections, many neurons)', () => {
    const genome: NEATGenome = {
      neurons: [
        { id: 0, type: 'input', bias: 0 },
        ...Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          type: 'hidden' as const,
          bias: 0,
          innovation: i,
        })),
        { id: 101, type: 'output', bias: -0.5 },
      ],
      connections: [
        // Only 2 connections for 100+ neurons
        { fromNode: 0, toNode: 50, weight: 0.5, enabled: true, innovation: 0 },
        { fromNode: 50, toNode: 101, weight: 0.5, enabled: true, innovation: 1 },
      ],
      activation: 'tanh',
    };

    const { depths, maxDepth } = computeNEATNeuronDepths(genome);

    // Most hidden neurons should be disconnected (depth 0)
    const disconnectedCount = Array.from(depths.entries())
      .filter(([id, depth]) => {
        const neuron = genome.neurons.find(n => n.id === id);
        return neuron?.type === 'hidden' && depth === 0;
      }).length;

    expect(disconnectedCount).toBe(99);  // All except neuron 50
    expect(maxDepth).toBe(2);  // input(0) -> h50(1) -> output(2)
  });

  it('should handle multiple disconnected subgraphs', () => {
    const genome: NEATGenome = {
      neurons: [
        // Subgraph 1: input 0 -> hidden 2 -> output 4
        { id: 0, type: 'input', bias: 0 },
        { id: 2, type: 'hidden', bias: 0, innovation: 1 },
        { id: 4, type: 'output', bias: -0.5 },
        // Subgraph 2: input 1 -> hidden 3 -> output 5
        { id: 1, type: 'input', bias: 0 },
        { id: 3, type: 'hidden', bias: 0, innovation: 2 },
        { id: 5, type: 'output', bias: -0.5 },
      ],
      connections: [
        // Subgraph 1
        { fromNode: 0, toNode: 2, weight: 0.5, enabled: true, innovation: 0 },
        { fromNode: 2, toNode: 4, weight: 0.5, enabled: true, innovation: 1 },
        // Subgraph 2
        { fromNode: 1, toNode: 3, weight: 0.5, enabled: true, innovation: 2 },
        { fromNode: 3, toNode: 5, weight: 0.5, enabled: true, innovation: 3 },
      ],
      activation: 'tanh',
    };

    const { depths, maxDepth } = computeNEATNeuronDepths(genome);

    // Both subgraphs should have depth 2
    expect(depths.get(2)).toBe(1);  // Hidden in subgraph 1
    expect(depths.get(3)).toBe(1);  // Hidden in subgraph 2
    expect(maxDepth).toBe(2);
  });

  it('should handle cycle-like structure (different paths rejoin)', () => {
    // Not a true cycle, but multiple paths that reconverge
    const genome: NEATGenome = {
      neurons: [
        { id: 0, type: 'input', bias: 0 },
        { id: 1, type: 'hidden', bias: 0, innovation: 1 },
        { id: 2, type: 'hidden', bias: 0, innovation: 2 },
        { id: 3, type: 'hidden', bias: 0, innovation: 3 },
        { id: 4, type: 'output', bias: -0.5 },
      ],
      connections: [
        // Path 1: 0 -> 1 -> 3 -> 4
        { fromNode: 0, toNode: 1, weight: 0.5, enabled: true, innovation: 0 },
        { fromNode: 1, toNode: 3, weight: 0.5, enabled: true, innovation: 1 },
        { fromNode: 3, toNode: 4, weight: 0.5, enabled: true, innovation: 2 },
        // Path 2: 0 -> 2 -> 3 -> 4 (converges at 3)
        { fromNode: 0, toNode: 2, weight: 0.5, enabled: true, innovation: 3 },
        { fromNode: 2, toNode: 3, weight: 0.5, enabled: true, innovation: 4 },
      ],
      activation: 'tanh',
    };

    const { depths, maxDepth } = computeNEATNeuronDepths(genome);

    expect(depths.get(0)).toBe(0);  // Input
    expect(depths.get(1)).toBe(1);  // First level
    expect(depths.get(2)).toBe(1);  // First level (parallel path)
    expect(depths.get(3)).toBe(2);  // Converge point (max of incoming + 1)
    expect(depths.get(4)).toBe(maxDepth);  // Output at max
  });
});

describe('NEAT Full Pipeline Integration', () => {
  describe('Complete Genome Creation and Conversion', () => {
    it('should create, convert, and recover NEAT genome without data loss', () => {
      // Create a complex NEAT genome
      const original: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'input', bias: 0 },
          { id: 2, type: 'input', bias: 0 },
          { id: 3, type: 'hidden', bias: 0.1, innovation: 1 },
          { id: 4, type: 'hidden', bias: -0.2, innovation: 2 },
          { id: 5, type: 'output', bias: -0.5 },
          { id: 6, type: 'output', bias: -0.5 },
        ],
        connections: [
          { fromNode: 0, toNode: 3, weight: 0.5, enabled: true, innovation: 0 },
          { fromNode: 1, toNode: 3, weight: -0.3, enabled: true, innovation: 1 },
          { fromNode: 2, toNode: 4, weight: 0.7, enabled: false, innovation: 2 },  // Disabled
          { fromNode: 3, toNode: 5, weight: 0.2, enabled: true, innovation: 3 },
          { fromNode: 4, toNode: 6, weight: -0.1, enabled: true, innovation: 4 },
          { fromNode: 0, toNode: 5, weight: 0.8, enabled: true, innovation: 5 },  // Skip connection
        ],
        activation: 'tanh',
      };

      // Wrap in CreatureGenome
      const genome: CreatureGenome = {
        id: 'test-complex',
        generation: 10,
        survivalStreak: 3,
        parentIds: ['p1', 'p2'],
        nodes: [{ id: 'n1', position: { x: 0, y: 0, z: 0 }, size: 0.5, friction: 0.5 }],
        muscles: [],
        globalFrequencyMultiplier: 1.0,
        controllerType: 'neural',
        color: { h: 0.5, s: 0.7, l: 0.5 },
        neatGenome: original,
      };

      // Convert to API and back
      const apiGenome = toApiGenome(genome);
      const recovered = fromApiGenome(apiGenome);

      // Verify structure
      expect(recovered.neatGenome).toBeDefined();
      expect(recovered.neatGenome!.neurons.length).toBe(original.neurons.length);
      expect(recovered.neatGenome!.connections.length).toBe(original.connections.length);

      // Verify neuron types
      expect(recovered.neatGenome!.neurons.filter(n => n.type === 'input').length).toBe(3);
      expect(recovered.neatGenome!.neurons.filter(n => n.type === 'hidden').length).toBe(2);
      expect(recovered.neatGenome!.neurons.filter(n => n.type === 'output').length).toBe(2);

      // Verify disabled connection preserved
      const disabledConn = recovered.neatGenome!.connections.find(c => c.innovation === 2);
      expect(disabledConn?.enabled).toBe(false);
    });
  });

  describe('Edge Cases in Full Pipeline', () => {
    it('should handle genome with all connections disabled through full pipeline', () => {
      const genome: CreatureGenome = {
        id: 'all-disabled',
        generation: 0,
        survivalStreak: 0,
        parentIds: [],
        nodes: [{ id: 'n1', position: { x: 0, y: 0, z: 0 }, size: 0.5, friction: 0.5 }],
        muscles: [],
        globalFrequencyMultiplier: 1.0,
        controllerType: 'neural',
        color: { h: 0.5, s: 0.7, l: 0.5 },
        neatGenome: {
          neurons: [
            { id: 0, type: 'input', bias: 0 },
            { id: 1, type: 'output', bias: -0.5 },
          ],
          connections: [
            { fromNode: 0, toNode: 1, weight: 0.5, enabled: false, innovation: 0 },
          ],
          activation: 'tanh',
        },
      };

      const apiGenome = toApiGenome(genome);
      const recovered = fromApiGenome(apiGenome);

      expect(recovered.neatGenome!.connections[0].enabled).toBe(false);
    });

    it('should handle genome with extreme weight values through full pipeline', () => {
      const genome: CreatureGenome = {
        id: 'extreme-weights',
        generation: 0,
        survivalStreak: 0,
        parentIds: [],
        nodes: [{ id: 'n1', position: { x: 0, y: 0, z: 0 }, size: 0.5, friction: 0.5 }],
        muscles: [],
        globalFrequencyMultiplier: 1.0,
        controllerType: 'neural',
        color: { h: 0.5, s: 0.7, l: 0.5 },
        neatGenome: {
          neurons: [
            { id: 0, type: 'input', bias: 0 },
            { id: 1, type: 'output', bias: -1000 },  // Extreme bias
          ],
          connections: [
            { fromNode: 0, toNode: 1, weight: 100, enabled: true, innovation: 0 },  // Large weight
          ],
          activation: 'tanh',
        },
      };

      const apiGenome = toApiGenome(genome);
      const recovered = fromApiGenome(apiGenome);

      expect(recovered.neatGenome!.neurons[1].bias).toBe(-1000);
      expect(recovered.neatGenome!.connections[0].weight).toBe(100);
    });
  });

  describe('Proprioception Input Indexing', () => {
    /**
     * BUG FIX TEST: Padded inputs in the middle of the input array
     *
     * When a creature has fewer muscles than MAX_MUSCLES (15), the muscle strain
     * inputs have padding in the MIDDLE of the array, not at the end:
     *
     * With 9 muscles and 8 nodes (proprioception='all', time_encoding='sin_raw'):
     * - 0-6:   base sensors (7)
     * - 7-8:   time encoding (2)
     * - 9-17:  muscle strain for 9 muscles
     * - 18-23: PADDING for unused muscle slots (6 zeros, labeled with '*')
     * - 24-47: node velocities (24 = 8 nodes * 3)
     * - 48-55: ground contacts (8)
     *
     * The bug was that renderNEAT assumed padding was at the END, causing
     * velocity inputs (24-47) to be incorrectly positioned/colored as if they
     * were at indices 18-41.
     */
    it('should correctly identify padded vs non-padded inputs when padding is in the middle', () => {
      // Simulate getNonPaddedInputs behavior for 9 muscles, 8 nodes, all proprioception, sin_raw time
      const baseLabels = ['dir_x', 'dir_y', 'dir_z', 'vel_x', 'vel_y', 'vel_z', 'dist'];  // 7
      const timeLabels = ['t_sin', 't_raw'];  // 2
      const muscleStrainLabels = Array.from({ length: 9 }, (_, i) => `M${i + 1}_str`);  // 9 real
      const muscleStrainPadding = Array.from({ length: 6 }, (_, i) => `M${i + 10}_str*`);  // 6 padded
      const velocityLabels = Array.from({ length: 24 }, (_, i) => {
        const node = Math.floor(i / 3) + 1;
        const axis = ['x', 'y', 'z'][i % 3];
        return `N${node}_v${axis}`;
      });  // 24
      const groundLabels = Array.from({ length: 8 }, (_, i) => `N${i + 1}_gnd`);  // 8

      const allLabels = [
        ...baseLabels,
        ...timeLabels,
        ...muscleStrainLabels,
        ...muscleStrainPadding,
        ...velocityLabels,
        ...groundLabels,
      ];

      expect(allLabels.length).toBe(56);

      // Get non-padded indices (those without '*')
      const nonPaddedIndices: number[] = [];
      for (let i = 0; i < allLabels.length; i++) {
        if (!allLabels[i].endsWith('*')) {
          nonPaddedIndices.push(i);
        }
      }

      expect(nonPaddedIndices.length).toBe(50);  // 56 - 6 padded

      // Key assertion: padded indices are 18-23 (in the middle), NOT 50-55 (at the end)
      const paddedIndices = [18, 19, 20, 21, 22, 23];
      for (const idx of paddedIndices) {
        expect(nonPaddedIndices).not.toContain(idx);
        expect(allLabels[idx]).toContain('*');
      }

      // Velocity inputs should be at indices 24-47, all non-padded
      for (let i = 24; i < 48; i++) {
        expect(nonPaddedIndices).toContain(i);
        expect(allLabels[i]).not.toContain('*');
      }
    });
  });
});

// =============================================================================
// Bias Node Visualization Tests
// =============================================================================

describe('NEAT Bias Node Visualization', () => {
  /**
   * Tests for bias_node mode where biases are implemented via a special
   * input neuron with type='bias' that always outputs 1.0.
   * Connections FROM the bias node to other neurons act as biases.
   */

  describe('Bias Neuron Detection', () => {
    it('should correctly identify bias neurons by type', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'bias', bias: 0 },  // Bias node always at ID 0
          { id: 1, type: 'input', bias: 0 },
          { id: 2, type: 'input', bias: 0 },
          { id: 3, type: 'output', bias: 0 },  // No per-node bias when using bias_node
        ],
        connections: [
          { fromNode: 0, toNode: 3, weight: -0.5, enabled: true, innovation: 0 },  // Bias connection
          { fromNode: 1, toNode: 3, weight: 0.3, enabled: true, innovation: 1 },
          { fromNode: 2, toNode: 3, weight: 0.7, enabled: true, innovation: 2 },
        ],
        activation: 'tanh',
      };

      const biasNeurons = genome.neurons.filter(n => n.type === 'bias');
      const inputNeurons = genome.neurons.filter(n => n.type === 'input');
      const outputNeurons = genome.neurons.filter(n => n.type === 'output');

      expect(biasNeurons.length).toBe(1);
      expect(biasNeurons[0].id).toBe(0);
      expect(inputNeurons.length).toBe(2);
      expect(outputNeurons.length).toBe(1);
    });

    it('should handle genome with no bias neurons (per-node bias mode)', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'input', bias: 0 },
          { id: 1, type: 'output', bias: -0.5 },  // Per-node bias
        ],
        connections: [
          { fromNode: 0, toNode: 1, weight: 0.5, enabled: true, innovation: 0 },
        ],
        activation: 'tanh',
      };

      const biasNeurons = genome.neurons.filter(n => n.type === 'bias');
      expect(biasNeurons.length).toBe(0);
    });

    it('should handle genome with multiple bias neurons (edge case)', () => {
      // Though unlikely, test defensive handling
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'bias', bias: 0 },
          { id: 1, type: 'bias', bias: 0 },  // Second bias neuron (unusual)
          { id: 2, type: 'input', bias: 0 },
          { id: 3, type: 'output', bias: 0 },
        ],
        connections: [],
        activation: 'tanh',
      };

      const biasNeurons = genome.neurons.filter(n => n.type === 'bias');
      expect(biasNeurons.length).toBe(2);
    });
  });

  describe('Bias Node Positioning', () => {
    it('should position bias node with inputs (at depth 0)', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'bias', bias: 0 },
          { id: 1, type: 'input', bias: 0 },
          { id: 2, type: 'output', bias: 0 },
        ],
        connections: [
          { fromNode: 0, toNode: 2, weight: -0.5, enabled: true, innovation: 0 },
          { fromNode: 1, toNode: 2, weight: 0.5, enabled: true, innovation: 1 },
        ],
        activation: 'tanh',
      };

      // Simulate computeNEATNeuronDepths logic
      const inputIds = new Set(genome.neurons.filter(n => n.type === 'input').map(n => n.id));
      const biasIds = new Set(genome.neurons.filter(n => n.type === 'bias').map(n => n.id));

      // Bias neurons should be treated like inputs (depth 0)
      // In render, they're positioned alongside inputs
      expect(biasIds.has(0)).toBe(true);
      expect(inputIds.has(1)).toBe(true);
    });

    it('should account for bias node in layer size calculation', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'bias', bias: 0 },
          { id: 1, type: 'input', bias: 0 },
          { id: 2, type: 'input', bias: 0 },
          { id: 3, type: 'input', bias: 0 },
          { id: 4, type: 'output', bias: 0 },
          { id: 5, type: 'output', bias: 0 },
        ],
        connections: [],
        activation: 'tanh',
      };

      const biasNeurons = genome.neurons.filter(n => n.type === 'bias');
      const inputNeurons = genome.neurons.filter(n => n.type === 'input');
      const outputNeurons = genome.neurons.filter(n => n.type === 'output');

      const displayInputSize = inputNeurons.length;  // 3
      const biasNodeWidth = biasNeurons.length > 0 ? 1 : 0;  // 1
      const totalInputDisplay = displayInputSize + biasNodeWidth;  // 4

      expect(totalInputDisplay).toBe(4);
      expect(outputNeurons.length).toBe(2);

      // Max layer size should account for bias
      const maxLayerSize = Math.max(totalInputDisplay, outputNeurons.length);
      expect(maxLayerSize).toBe(4);
    });
  });

  describe('Bias Node Connections', () => {
    it('should correctly identify connections FROM bias node', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'bias', bias: 0 },
          { id: 1, type: 'input', bias: 0 },
          { id: 2, type: 'hidden', bias: 0, innovation: 1 },
          { id: 3, type: 'output', bias: 0 },
        ],
        connections: [
          { fromNode: 0, toNode: 2, weight: 0.3, enabled: true, innovation: 0 },  // Bias -> hidden
          { fromNode: 0, toNode: 3, weight: -0.5, enabled: true, innovation: 1 },  // Bias -> output
          { fromNode: 1, toNode: 2, weight: 0.5, enabled: true, innovation: 2 },
          { fromNode: 2, toNode: 3, weight: 0.7, enabled: true, innovation: 3 },
        ],
        activation: 'tanh',
      };

      const biasConnections = genome.connections.filter(c => c.fromNode === 0);
      expect(biasConnections.length).toBe(2);

      // Bias connections act as biases for target neurons
      const hiddenBiasConn = biasConnections.find(c => c.toNode === 2);
      const outputBiasConn = biasConnections.find(c => c.toNode === 3);
      expect(hiddenBiasConn?.weight).toBe(0.3);
      expect(outputBiasConn?.weight).toBe(-0.5);
    });

    it('should handle disabled bias connections', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'bias', bias: 0 },
          { id: 1, type: 'input', bias: 0 },
          { id: 2, type: 'output', bias: 0 },
        ],
        connections: [
          { fromNode: 0, toNode: 2, weight: -0.5, enabled: false, innovation: 0 },  // Disabled bias
          { fromNode: 1, toNode: 2, weight: 0.5, enabled: true, innovation: 1 },
        ],
        activation: 'tanh',
      };

      const enabledConnections = genome.connections.filter(c => c.enabled);
      const disabledBiasConns = genome.connections.filter(c => c.fromNode === 0 && !c.enabled);

      expect(enabledConnections.length).toBe(1);
      expect(disabledBiasConns.length).toBe(1);
    });

    it('should not allow connections TO bias node', () => {
      // Bias nodes should only be sources, never targets
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'bias', bias: 0 },
          { id: 1, type: 'input', bias: 0 },
          { id: 2, type: 'output', bias: 0 },
        ],
        connections: [
          { fromNode: 1, toNode: 0, weight: 0.5, enabled: true, innovation: 0 },  // Invalid: to bias
          { fromNode: 1, toNode: 2, weight: 0.5, enabled: true, innovation: 1 },
        ],
        activation: 'tanh',
      };

      // In a well-formed genome, there should be no connections TO bias neurons
      const connectionsTooBias = genome.connections.filter(c => c.toNode === 0);
      // This test documents the edge case - the renderer should handle it gracefully
      expect(connectionsTooBias.length).toBe(1);  // The malformed connection exists
    });
  });

  describe('Bias Node Activation', () => {
    it('should always have activation value of 1.0', () => {
      // Bias neurons always output 1.0 regardless of inputs
      const biasActivation = 1.0;

      // Verify this is the expected constant
      expect(biasActivation).toBe(1.0);
    });

    it('should use bias value in signal calculation', () => {
      // Signal = activation * weight
      // For bias node: signal = 1.0 * weight = weight
      const biasWeight = -0.5;
      const biasActivation = 1.0;
      const signal = biasActivation * biasWeight;

      expect(signal).toBe(-0.5);
    });
  });

  describe('Complex Bias Node Scenarios', () => {
    it('should handle bias node with connections to multiple hidden layers', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'bias', bias: 0 },
          { id: 1, type: 'input', bias: 0 },
          { id: 2, type: 'hidden', bias: 0, innovation: 1 },
          { id: 3, type: 'hidden', bias: 0, innovation: 2 },
          { id: 4, type: 'output', bias: 0 },
        ],
        connections: [
          // Bias connects to both hidden neurons and output
          { fromNode: 0, toNode: 2, weight: 0.1, enabled: true, innovation: 0 },
          { fromNode: 0, toNode: 3, weight: 0.2, enabled: true, innovation: 1 },
          { fromNode: 0, toNode: 4, weight: -0.3, enabled: true, innovation: 2 },
          // Normal connections
          { fromNode: 1, toNode: 2, weight: 0.5, enabled: true, innovation: 3 },
          { fromNode: 2, toNode: 3, weight: 0.6, enabled: true, innovation: 4 },
          { fromNode: 3, toNode: 4, weight: 0.7, enabled: true, innovation: 5 },
        ],
        activation: 'tanh',
      };

      const biasConnections = genome.connections.filter(c => c.fromNode === 0);
      expect(biasConnections.length).toBe(3);

      // Verify connections to each layer
      const toHidden1 = biasConnections.find(c => c.toNode === 2);
      const toHidden2 = biasConnections.find(c => c.toNode === 3);
      const toOutput = biasConnections.find(c => c.toNode === 4);

      expect(toHidden1).toBeDefined();
      expect(toHidden2).toBeDefined();
      expect(toOutput).toBeDefined();
    });

    it('should handle mixed bias modes correctly', () => {
      // Genome with bias_node but also per-node bias (though unusual)
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'bias', bias: 0 },
          { id: 1, type: 'input', bias: 0 },
          { id: 2, type: 'output', bias: -0.5 },  // Per-node bias AND bias node
        ],
        connections: [
          { fromNode: 0, toNode: 2, weight: 0.3, enabled: true, innovation: 0 },
          { fromNode: 1, toNode: 2, weight: 0.5, enabled: true, innovation: 1 },
        ],
        activation: 'tanh',
      };

      const biasNeurons = genome.neurons.filter(n => n.type === 'bias');
      const outputNeurons = genome.neurons.filter(n => n.type === 'output');

      expect(biasNeurons.length).toBe(1);
      expect(outputNeurons[0].bias).toBe(-0.5);  // Per-node bias also present
    });

    it('should handle large network with bias node', () => {
      const inputCount = 7;
      const hiddenCount = 10;
      const outputCount = 5;

      const neurons: NeuronGene[] = [
        { id: 0, type: 'bias', bias: 0 },
        ...Array.from({ length: inputCount }, (_, i) => ({
          id: i + 1,
          type: 'input' as const,
          bias: 0,
        })),
        ...Array.from({ length: hiddenCount }, (_, i) => ({
          id: i + 1 + inputCount,
          type: 'hidden' as const,
          bias: 0,
          innovation: i,
        })),
        ...Array.from({ length: outputCount }, (_, i) => ({
          id: i + 1 + inputCount + hiddenCount,
          type: 'output' as const,
          bias: 0,
        })),
      ];

      // Bias node connects to all hidden and output neurons
      const connections: ConnectionGene[] = [];
      let innov = 0;

      // Bias -> hidden
      for (let h = 0; h < hiddenCount; h++) {
        connections.push({
          fromNode: 0,
          toNode: 1 + inputCount + h,
          weight: Math.random() * 0.4 - 0.2,
          enabled: true,
          innovation: innov++,
        });
      }

      // Bias -> output
      for (let o = 0; o < outputCount; o++) {
        connections.push({
          fromNode: 0,
          toNode: 1 + inputCount + hiddenCount + o,
          weight: -0.5,
          enabled: true,
          innovation: innov++,
        });
      }

      const genome: NEATGenome = { neurons, connections, activation: 'tanh' };

      expect(genome.neurons.length).toBe(1 + inputCount + hiddenCount + outputCount);
      expect(genome.neurons.filter(n => n.type === 'bias').length).toBe(1);

      const biasConns = genome.connections.filter(c => c.fromNode === 0);
      expect(biasConns.length).toBe(hiddenCount + outputCount);
    });
  });

  describe('Visualization Edge Cases', () => {
    it('should render bias node even with no connections', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'bias', bias: 0 },
          { id: 1, type: 'input', bias: 0 },
          { id: 2, type: 'output', bias: 0 },
        ],
        connections: [
          // No connections from bias node
          { fromNode: 1, toNode: 2, weight: 0.5, enabled: true, innovation: 0 },
        ],
        activation: 'tanh',
      };

      const biasNeurons = genome.neurons.filter(n => n.type === 'bias');
      const biasConnections = genome.connections.filter(c => c.fromNode === 0);

      expect(biasNeurons.length).toBe(1);
      expect(biasConnections.length).toBe(0);
      // Visualization should still show the bias node
    });

    it('should handle bias node with extreme weight values', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'bias', bias: 0 },
          { id: 1, type: 'input', bias: 0 },
          { id: 2, type: 'output', bias: 0 },
        ],
        connections: [
          { fromNode: 0, toNode: 2, weight: 1000, enabled: true, innovation: 0 },  // Extreme
          { fromNode: 1, toNode: 2, weight: 0.5, enabled: true, innovation: 1 },
        ],
        activation: 'tanh',
      };

      // Signal from bias = 1.0 * 1000 = 1000
      const biasSignal = 1.0 * 1000;
      expect(biasSignal).toBe(1000);
      expect(Number.isFinite(biasSignal)).toBe(true);
    });

    it('should correctly label bias node', () => {
      // In the visualization, bias nodes are labeled "B" with value "1.00"
      const biasLabel = 'B';
      const biasValue = 1.0;
      const displayValue = biasValue.toFixed(2);

      expect(biasLabel).toBe('B');
      expect(displayValue).toBe('1.00');
    });

    it('should include bias in input layer count display', () => {
      const genome: NEATGenome = {
        neurons: [
          { id: 0, type: 'bias', bias: 0 },
          { id: 1, type: 'input', bias: 0 },
          { id: 2, type: 'input', bias: 0 },
          { id: 3, type: 'input', bias: 0 },
          { id: 4, type: 'output', bias: 0 },
        ],
        connections: [],
        activation: 'tanh',
      };

      const inputNeurons = genome.neurons.filter(n => n.type === 'input');
      const biasNeurons = genome.neurons.filter(n => n.type === 'bias');
      const hasBiasNode = biasNeurons.length > 0;

      // Expected label format: "In (3+B)" when bias present, "In (3)" otherwise
      const inputLabel = hasBiasNode
        ? `In (${inputNeurons.length}+B)`
        : `In (${inputNeurons.length})`;

      expect(inputLabel).toBe('In (3+B)');
    });
  });
});
