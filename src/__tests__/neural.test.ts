import { describe, it, expect } from 'vitest';
import {
  NeuralNetwork,
  tanh,
  relu,
  sigmoid,
  getActivation,
  applyActivation,
  initializeNeuralGenome,
  createNetworkFromGenome,
  cloneNeuralGenome,
  calculateWeightCount,
  validateNeuralGenome,
  gatherSensorInputs,
  NEURAL_INPUT_SIZE,
  SENSOR_NAMES,
  DEFAULT_NEURAL_CONFIG
} from '../neural';
import type { NeuralNetworkConfig, NeuralGenomeData, NeuralConfig } from '../neural';

describe('Neural Network Module', () => {
  describe('Activation Functions', () => {
    describe('tanh', () => {
      it('returns 0 for input 0', () => {
        expect(tanh(0)).toBe(0);
      });

      it('returns values in range [-1, 1]', () => {
        expect(tanh(-100)).toBeGreaterThanOrEqual(-1);
        expect(tanh(-100)).toBeLessThanOrEqual(1);
        expect(tanh(100)).toBeGreaterThanOrEqual(-1);
        expect(tanh(100)).toBeLessThanOrEqual(1);
      });

      it('is symmetric around 0', () => {
        expect(tanh(-2)).toBeCloseTo(-tanh(2));
      });

      it('approaches 1 for large positive values', () => {
        expect(tanh(10)).toBeCloseTo(1, 5);
      });

      it('approaches -1 for large negative values', () => {
        expect(tanh(-10)).toBeCloseTo(-1, 5);
      });
    });

    describe('relu', () => {
      it('returns 0 for negative inputs', () => {
        expect(relu(-5)).toBe(0);
        expect(relu(-0.1)).toBe(0);
      });

      it('returns input for positive values', () => {
        expect(relu(5)).toBe(5);
        expect(relu(0.1)).toBe(0.1);
      });

      it('returns 0 for input 0', () => {
        expect(relu(0)).toBe(0);
      });
    });

    describe('sigmoid', () => {
      it('returns 0.5 for input 0', () => {
        expect(sigmoid(0)).toBe(0.5);
      });

      it('returns values in range [0, 1]', () => {
        expect(sigmoid(-100)).toBeGreaterThanOrEqual(0);
        expect(sigmoid(-100)).toBeLessThanOrEqual(1);
        expect(sigmoid(100)).toBeGreaterThanOrEqual(0);
        expect(sigmoid(100)).toBeLessThanOrEqual(1);
      });

      it('approaches 1 for large positive values', () => {
        expect(sigmoid(10)).toBeCloseTo(1, 3);
      });

      it('approaches 0 for large negative values', () => {
        expect(sigmoid(-10)).toBeCloseTo(0, 3);
      });

      it('handles extreme values without overflow', () => {
        expect(sigmoid(1000)).toBe(1);
        expect(sigmoid(-1000)).toBeCloseTo(0, 10);
      });
    });

    describe('getActivation', () => {
      it('returns tanh function for "tanh"', () => {
        expect(getActivation('tanh')(0)).toBe(tanh(0));
      });

      it('returns relu function for "relu"', () => {
        expect(getActivation('relu')(-5)).toBe(relu(-5));
      });

      it('returns sigmoid function for "sigmoid"', () => {
        expect(getActivation('sigmoid')(0)).toBe(sigmoid(0));
      });

      it('defaults to tanh for unknown types', () => {
        // @ts-expect-error Testing unknown type
        expect(getActivation('unknown')(0)).toBe(tanh(0));
      });
    });

    describe('applyActivation', () => {
      it('applies activation to array of values', () => {
        const values = [0, 1, -1, 2, -2];
        const result = applyActivation(values, 'relu');
        expect(result).toEqual([0, 1, 0, 2, 0]);
      });

      it('returns new array without modifying original', () => {
        const values = [1, 2, 3];
        const result = applyActivation(values, 'tanh');
        expect(result).not.toBe(values);
        expect(values).toEqual([1, 2, 3]);
      });
    });
  });

  describe('NeuralNetwork Class', () => {
    const testConfig: NeuralNetworkConfig = {
      inputSize: 8,
      hiddenSize: 4,
      outputSize: 3,
      activation: 'tanh'
    };

    describe('initialize', () => {
      it('creates network with correct topology', () => {
        const network = NeuralNetwork.initialize(testConfig);
        const weights = network.toWeights();
        const expectedCount = calculateWeightCount({
          inputSize: 8,
          hiddenSize: 4,
          outputSize: 3
        });
        expect(weights.length).toBe(expectedCount);
      });

      it('uses Xavier initialization (weights in reasonable range)', () => {
        const network = NeuralNetwork.initialize(testConfig);
        const weights = network.toWeights();

        // Xavier weights should typically be in [-2, 2] range
        for (const w of weights) {
          expect(Math.abs(w)).toBeLessThan(3);
        }
      });
    });

    describe('fromWeights', () => {
      it('recreates network from weight array', () => {
        const network1 = NeuralNetwork.initialize(testConfig);
        const weights = network1.toWeights();
        const network2 = NeuralNetwork.fromWeights(weights, testConfig);

        expect(network2.toWeights()).toEqual(weights);
      });

      it('throws error for mismatched weight count', () => {
        expect(() => {
          NeuralNetwork.fromWeights([1, 2, 3], testConfig);
        }).toThrow();
      });
    });

    describe('forward', () => {
      it('returns correct number of outputs', () => {
        const network = NeuralNetwork.initialize(testConfig);
        const inputs = new Array(8).fill(0);
        const result = network.forward(inputs);

        expect(result.outputs.length).toBe(3);
      });

      it('returns hidden activations', () => {
        const network = NeuralNetwork.initialize(testConfig);
        const inputs = new Array(8).fill(0);
        const result = network.forward(inputs);

        expect(result.hidden.length).toBe(4);
      });

      it('outputs are in activation function range', () => {
        const network = NeuralNetwork.initialize(testConfig);
        const inputs = [1, 0, -1, 0.5, -0.5, 0.2, -0.2, 0];
        const result = network.forward(inputs);

        // tanh outputs should be in [-1, 1]
        for (const output of result.outputs) {
          expect(output).toBeGreaterThanOrEqual(-1);
          expect(output).toBeLessThanOrEqual(1);
        }
      });

      it('throws error for wrong input size', () => {
        const network = NeuralNetwork.initialize(testConfig);
        expect(() => {
          network.forward([1, 2, 3]); // Only 3 inputs instead of 8
        }).toThrow();
      });
    });

    describe('predict', () => {
      it('returns only outputs without internal state', () => {
        const network = NeuralNetwork.initialize(testConfig);
        const inputs = new Array(8).fill(0);
        const outputs = network.predict(inputs);

        expect(outputs.length).toBe(3);
        expect(Array.isArray(outputs)).toBe(true);
      });
    });

    describe('determinism', () => {
      it('produces same output for same input and weights', () => {
        const network = NeuralNetwork.initialize(testConfig);
        const inputs = [1, 0, -1, 0.5, -0.5, 0.2, -0.2, 0];

        const output1 = network.predict(inputs);
        const output2 = network.predict(inputs);

        expect(output1).toEqual(output2);
      });
    });
  });

  describe('Neural Genome', () => {
    describe('constants', () => {
      it('has correct input size', () => {
        expect(NEURAL_INPUT_SIZE).toBe(8);
      });

      it('has correct sensor names count', () => {
        expect(SENSOR_NAMES.length).toBe(NEURAL_INPUT_SIZE);
      });

      it('sensor names are all defined', () => {
        for (const name of SENSOR_NAMES) {
          expect(typeof name).toBe('string');
          expect(name.length).toBeGreaterThan(0);
        }
      });
    });

    describe('initializeNeuralGenome', () => {
      it('creates genome with correct topology', () => {
        const genome = initializeNeuralGenome(5);

        expect(genome.topology.inputSize).toBe(NEURAL_INPUT_SIZE);
        expect(genome.topology.hiddenSize).toBe(DEFAULT_NEURAL_CONFIG.hiddenSize);
        expect(genome.topology.outputSize).toBe(5);
      });

      it('respects custom config', () => {
        const config: NeuralConfig = {
          ...DEFAULT_NEURAL_CONFIG,
          hiddenSize: 16,
          activation: 'relu'
        };
        const genome = initializeNeuralGenome(5, config);

        expect(genome.topology.hiddenSize).toBe(16);
        expect(genome.activation).toBe('relu');
      });

      it('creates valid weight array', () => {
        const genome = initializeNeuralGenome(5);
        expect(validateNeuralGenome(genome)).toBe(true);
      });
    });

    describe('calculateWeightCount', () => {
      it('calculates correct count for simple network', () => {
        // 8 inputs, 4 hidden, 3 outputs
        // input->hidden: 8*4 = 32 weights + 4 biases = 36
        // hidden->output: 4*3 = 12 weights + 3 biases = 15
        // Total: 36 + 15 = 51
        const count = calculateWeightCount({
          inputSize: 8,
          hiddenSize: 4,
          outputSize: 3
        });
        expect(count).toBe(51);
      });
    });

    describe('validateNeuralGenome', () => {
      it('returns true for valid genome', () => {
        const genome = initializeNeuralGenome(5);
        expect(validateNeuralGenome(genome)).toBe(true);
      });

      it('returns false for mismatched weight count', () => {
        const genome = initializeNeuralGenome(5);
        genome.weights.pop(); // Remove one weight
        expect(validateNeuralGenome(genome)).toBe(false);
      });
    });

    describe('cloneNeuralGenome', () => {
      it('creates deep copy of genome', () => {
        const original = initializeNeuralGenome(5);
        const cloned = cloneNeuralGenome(original);

        // Same values
        expect(cloned.weights).toEqual(original.weights);
        expect(cloned.topology).toEqual(original.topology);
        expect(cloned.activation).toBe(original.activation);

        // Different references
        expect(cloned.weights).not.toBe(original.weights);
        expect(cloned.topology).not.toBe(original.topology);
      });

      it('modifications to clone do not affect original', () => {
        const original = initializeNeuralGenome(5);
        const originalFirstWeight = original.weights[0];

        const cloned = cloneNeuralGenome(original);
        cloned.weights[0] = 999;

        expect(original.weights[0]).toBe(originalFirstWeight);
      });
    });

    describe('createNetworkFromGenome', () => {
      it('creates functional network', () => {
        const genome = initializeNeuralGenome(5);
        const network = createNetworkFromGenome(genome);

        const inputs = new Array(NEURAL_INPUT_SIZE).fill(0);
        const outputs = network.predict(inputs);

        expect(outputs.length).toBe(5);
      });

      it('preserves weights', () => {
        const genome = initializeNeuralGenome(5);
        const network = createNetworkFromGenome(genome);

        expect(network.toWeights()).toEqual(genome.weights);
      });
    });
  });

  describe('Sensor Inputs', () => {
    describe('gatherSensorInputs', () => {
      it('returns correct number of inputs', () => {
        const inputs = gatherSensorInputs(
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 0, z: 1 },
          0.5,
          1.0
        );

        expect(inputs.length).toBe(NEURAL_INPUT_SIZE);
      });

      it('includes pellet direction', () => {
        const pelletDir = { x: 1, y: 0, z: 0 };
        const inputs = gatherSensorInputs(pelletDir, { x: 0, y: 0, z: 0 }, 0, 0);

        expect(inputs[0]).toBe(1); // pellet_dir_x
        expect(inputs[1]).toBe(0); // pellet_dir_y
        expect(inputs[2]).toBe(0); // pellet_dir_z
      });

      it('includes velocity direction', () => {
        const velocityDir = { x: 0, y: 1, z: 0 };
        const inputs = gatherSensorInputs({ x: 0, y: 0, z: 0 }, velocityDir, 0, 0);

        expect(inputs[3]).toBe(0); // velocity_x
        expect(inputs[4]).toBe(1); // velocity_y
        expect(inputs[5]).toBe(0); // velocity_z
      });

      it('includes normalized distance', () => {
        const inputs = gatherSensorInputs(
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 0, z: 0 },
          0.75,
          0
        );

        expect(inputs[6]).toBe(0.75); // pellet_dist
      });

      it('includes time phase as sin wave', () => {
        // At time 0, sin(0) = 0
        const inputs0 = gatherSensorInputs(
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 0, z: 0 },
          0,
          0
        );
        expect(inputs0[7]).toBeCloseTo(0, 5);

        // At time 0.25, sin(pi/2) = 1
        const inputs025 = gatherSensorInputs(
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 0, z: 0 },
          0,
          0.25
        );
        expect(inputs025[7]).toBeCloseTo(1, 5);
      });
    });
  });

  describe('Integration', () => {
    it('full pipeline: init -> network -> forward', () => {
      // Initialize genome for creature with 5 muscles
      const genome = initializeNeuralGenome(5);

      // Create network from genome
      const network = createNetworkFromGenome(genome);

      // Gather sensor inputs (simulating creature seeing a pellet)
      const pelletDir = { x: 0.7, y: 0.1, z: 0.7 };
      const velocity = { x: 0.5, y: 0, z: 0.5 };
      const distance = 0.3;
      const time = 1.5;

      const sensorInputs = gatherSensorInputs(pelletDir, velocity, distance, time);

      // Run forward pass
      const muscleActivations = network.predict(sensorInputs);

      // Should have 5 muscle outputs
      expect(muscleActivations.length).toBe(5);

      // All should be in valid range for tanh
      for (const activation of muscleActivations) {
        expect(activation).toBeGreaterThanOrEqual(-1);
        expect(activation).toBeLessThanOrEqual(1);
      }
    });

    it('weights can be evolved (mutated) and recreated', () => {
      const genome1 = initializeNeuralGenome(5);

      // Simulate mutation: perturb weights
      const mutatedWeights = genome1.weights.map(w => w + (Math.random() - 0.5) * 0.1);

      const genome2: NeuralGenomeData = {
        ...genome1,
        weights: mutatedWeights
      };

      // Should still be valid
      expect(validateNeuralGenome(genome2)).toBe(true);

      // Should create functional network
      const network = createNetworkFromGenome(genome2);
      const inputs = new Array(NEURAL_INPUT_SIZE).fill(0);
      const outputs = network.predict(inputs);

      expect(outputs.length).toBe(5);
    });
  });
});
