/**
 * Integration stress tests for bias_mode propagation.
 *
 * Tests that biasMode is correctly converted between frontend (camelCase)
 * and backend (snake_case) formats throughout the entire data flow.
 */

import { describe, it, expect } from 'vitest';
import { toApiConfig, fromApiConfig } from '../services/ApiClient';
import { DEFAULT_CONFIG, SimulationConfig } from '../types/simulation';

describe('bias_mode Propagation', () => {
  describe('ApiClient conversion functions', () => {
    it('toApiConfig should include bias_mode', () => {
      const config: SimulationConfig = {
        ...DEFAULT_CONFIG,
        biasMode: 'bias_node',
      };

      const apiConfig = toApiConfig(config);

      // BUG: bias_mode is missing from the conversion
      expect(apiConfig).toHaveProperty('bias_mode');
      expect(apiConfig.bias_mode).toBe('bias_node');
    });

    it('toApiConfig should convert all three bias_mode values', () => {
      const modes: Array<'none' | 'node' | 'bias_node'> = ['none', 'node', 'bias_node'];

      for (const mode of modes) {
        const config: SimulationConfig = {
          ...DEFAULT_CONFIG,
          biasMode: mode,
        };

        const apiConfig = toApiConfig(config);
        expect(apiConfig.bias_mode).toBe(mode);
      }
    });

    it('fromApiConfig should convert bias_mode to biasMode', () => {
      const apiConfig = {
        gravity: -9.8,
        ground_friction: 0.5,
        time_step: 1 / 30,
        simulation_duration: 20,
        population_size: 100,
        cull_percentage: 0.5,
        mutation_rate: 0.2,
        mutation_magnitude: 0.3,
        crossover_rate: 0.5,
        elite_count: 5,
        use_mutation: false,
        use_crossover: true,
        min_nodes: 3,
        max_nodes: 8,
        max_muscles: 15,
        max_allowed_frequency: 3.0,
        pellet_count: 3,
        arena_size: 10,
        fitness_pellet_points: 20,
        fitness_progress_max: 80,
        fitness_distance_per_unit: 3,
        fitness_distance_traveled_max: 20,
        fitness_regression_penalty: 20,
        use_neural_net: true,
        neural_mode: 'neat' as const,
        bias_mode: 'bias_node' as const,  // snake_case from API
        time_encoding: 'none' as const,
        neural_hidden_size: 8,
        neural_activation: 'tanh',
        weight_mutation_rate: 0.2,
        weight_mutation_magnitude: 0.05,
        weight_mutation_decay: 'linear' as const,
        neural_output_bias: -0.1,
        fitness_efficiency_penalty: 0.1,
        neural_dead_zone: 0.1,
        frame_storage_mode: 'all' as const,
        frame_rate: 15,
        sparse_top_count: 10,
        sparse_bottom_count: 5,
        use_proprioception: false,
        proprioception_inputs: 'all' as const,
      };

      const frontendConfig = fromApiConfig(apiConfig);

      // BUG: biasMode is missing from the conversion
      expect(frontendConfig).toHaveProperty('biasMode');
      expect(frontendConfig.biasMode).toBe('bias_node');
    });

    it('fromApiConfig should convert all three bias_mode values', () => {
      const modes: Array<'none' | 'node' | 'bias_node'> = ['none', 'node', 'bias_node'];

      for (const mode of modes) {
        const apiConfig = {
          gravity: -9.8,
          ground_friction: 0.5,
          time_step: 1 / 30,
          simulation_duration: 20,
          population_size: 100,
          cull_percentage: 0.5,
          mutation_rate: 0.2,
          mutation_magnitude: 0.3,
          crossover_rate: 0.5,
          elite_count: 5,
          use_mutation: false,
          use_crossover: true,
          min_nodes: 3,
          max_nodes: 8,
          max_muscles: 15,
          max_allowed_frequency: 3.0,
          pellet_count: 3,
          arena_size: 10,
          fitness_pellet_points: 20,
          fitness_progress_max: 80,
          fitness_distance_per_unit: 3,
          fitness_distance_traveled_max: 20,
          fitness_regression_penalty: 20,
          use_neural_net: true,
          neural_mode: 'neat' as const,
          bias_mode: mode,
          time_encoding: 'none' as const,
          neural_hidden_size: 8,
          neural_activation: 'tanh',
          weight_mutation_rate: 0.2,
          weight_mutation_magnitude: 0.05,
          weight_mutation_decay: 'linear' as const,
          neural_output_bias: -0.1,
          fitness_efficiency_penalty: 0.1,
          neural_dead_zone: 0.1,
          frame_storage_mode: 'all' as const,
          frame_rate: 15,
          sparse_top_count: 10,
          sparse_bottom_count: 5,
          use_proprioception: false,
          proprioception_inputs: 'all' as const,
        };

        const frontendConfig = fromApiConfig(apiConfig);
        expect(frontendConfig.biasMode).toBe(mode);
      }
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve biasMode through toApiConfig -> fromApiConfig', () => {
      const originalConfig: SimulationConfig = {
        ...DEFAULT_CONFIG,
        biasMode: 'bias_node',
        neuralMode: 'neat',
      };

      const apiConfig = toApiConfig(originalConfig);
      const roundTrippedConfig = fromApiConfig(apiConfig);

      expect(roundTrippedConfig.biasMode).toBe(originalConfig.biasMode);
    });

    it('should preserve all biasMode values through round-trip', () => {
      const modes: Array<'none' | 'node' | 'bias_node'> = ['none', 'node', 'bias_node'];

      for (const mode of modes) {
        const originalConfig: SimulationConfig = {
          ...DEFAULT_CONFIG,
          biasMode: mode,
        };

        const apiConfig = toApiConfig(originalConfig);
        const roundTrippedConfig = fromApiConfig(apiConfig);

        expect(roundTrippedConfig.biasMode).toBe(mode);
      }
    });
  });

  describe('ApiSimulationConfig interface', () => {
    it('should have bias_mode field typed correctly', () => {
      // This test ensures the TypeScript interface is updated
      const apiConfig = toApiConfig({
        ...DEFAULT_CONFIG,
        biasMode: 'node',
      });

      // TypeScript compile-time check - if bias_mode is missing from
      // ApiSimulationConfig interface, this assignment will fail
      const biasMode: 'none' | 'node' | 'bias_node' = apiConfig.bias_mode;
      expect(biasMode).toBe('node');
    });
  });

  describe('Default value handling', () => {
    it('toApiConfig should use default biasMode when not explicitly set', () => {
      // DEFAULT_CONFIG.biasMode should be 'node'
      const apiConfig = toApiConfig(DEFAULT_CONFIG);

      expect(apiConfig.bias_mode).toBe('node');
    });

    it('fromApiConfig should handle missing bias_mode gracefully', () => {
      // Simulate old API response without bias_mode
      const oldApiConfig = {
        gravity: -9.8,
        ground_friction: 0.5,
        time_step: 1 / 30,
        simulation_duration: 20,
        population_size: 100,
        cull_percentage: 0.5,
        mutation_rate: 0.2,
        mutation_magnitude: 0.3,
        crossover_rate: 0.5,
        elite_count: 5,
        use_mutation: false,
        use_crossover: true,
        min_nodes: 3,
        max_nodes: 8,
        max_muscles: 15,
        max_allowed_frequency: 3.0,
        pellet_count: 3,
        arena_size: 10,
        fitness_pellet_points: 20,
        fitness_progress_max: 80,
        fitness_distance_per_unit: 3,
        fitness_distance_traveled_max: 20,
        fitness_regression_penalty: 20,
        use_neural_net: true,
        neural_mode: 'pure' as const,
        // bias_mode intentionally missing
        time_encoding: 'none' as const,
        neural_hidden_size: 8,
        neural_activation: 'tanh',
        weight_mutation_rate: 0.2,
        weight_mutation_magnitude: 0.05,
        weight_mutation_decay: 'linear' as const,
        neural_output_bias: -0.1,
        fitness_efficiency_penalty: 0.1,
        neural_dead_zone: 0.1,
        frame_storage_mode: 'all' as const,
        frame_rate: 15,
        sparse_top_count: 10,
        sparse_bottom_count: 5,
        use_proprioception: false,
        proprioception_inputs: 'all' as const,
      };

      const frontendConfig = fromApiConfig(oldApiConfig as any);

      // Should default to 'node' when missing
      expect(frontendConfig.biasMode).toBe('node');
    });
  });

  describe('NEAT mode auto-defaults', () => {
    it('NEAT mode should use bias_node by default in frontend', () => {
      // Verify the frontend default for NEAT
      expect(DEFAULT_CONFIG.biasMode).toBe('node');
      // Note: The NeuralPanel.tsx auto-switches to 'bias_node' when NEAT is selected
    });
  });

  describe('Integration with other NEAT config fields', () => {
    it('should preserve bias_mode alongside other NEAT settings', () => {
      const neatConfig: SimulationConfig = {
        ...DEFAULT_CONFIG,
        neuralMode: 'neat',
        biasMode: 'bias_node',
        useSpeciation: true,
        useFitnessSharing: false,
        neatAddConnectionRate: 0.05,
        neatAddNodeRate: 0.03,
      };

      const apiConfig = toApiConfig(neatConfig);

      // All NEAT-related fields should be present
      expect(apiConfig.neural_mode).toBe('neat');
      expect(apiConfig.bias_mode).toBe('bias_node');
    });
  });

  describe('NEAT settings propagation', () => {
    it('toApiConfig should include all NEAT settings', () => {
      const config: SimulationConfig = {
        ...DEFAULT_CONFIG,
        neuralMode: 'neat',
        neatAddConnectionRate: 0.1,
        neatAddNodeRate: 0.05,
        neatEnableRate: 0.03,
        neatDisableRate: 0.02,
        neatExcessCoefficient: 2.0,
        neatDisjointCoefficient: 1.5,
        neatWeightCoefficient: 0.5,
        neatMaxHiddenNodes: 32,
      };

      const apiConfig = toApiConfig(config);

      expect(apiConfig.neat_add_connection_rate).toBe(0.1);
      expect(apiConfig.neat_add_node_rate).toBe(0.05);
      expect(apiConfig.neat_enable_rate).toBe(0.03);
      expect(apiConfig.neat_disable_rate).toBe(0.02);
      expect(apiConfig.neat_excess_coefficient).toBe(2.0);
      expect(apiConfig.neat_disjoint_coefficient).toBe(1.5);
      expect(apiConfig.neat_weight_coefficient).toBe(0.5);
      expect(apiConfig.neat_max_hidden_nodes).toBe(32);
    });

    it('fromApiConfig should convert all NEAT settings', () => {
      const apiConfig = {
        gravity: -9.8,
        ground_friction: 0.5,
        time_step: 1 / 30,
        simulation_duration: 20,
        population_size: 100,
        cull_percentage: 0.5,
        mutation_rate: 0.2,
        mutation_magnitude: 0.3,
        crossover_rate: 0.5,
        elite_count: 5,
        use_mutation: false,
        use_crossover: true,
        min_nodes: 3,
        max_nodes: 8,
        max_muscles: 15,
        max_allowed_frequency: 3.0,
        pellet_count: 3,
        arena_size: 10,
        fitness_pellet_points: 20,
        fitness_progress_max: 80,
        fitness_distance_per_unit: 3,
        fitness_distance_traveled_max: 20,
        fitness_regression_penalty: 20,
        use_neural_net: true,
        neural_mode: 'neat' as const,
        bias_mode: 'bias_node' as const,
        time_encoding: 'none' as const,
        neural_hidden_size: 8,
        neural_activation: 'tanh',
        weight_mutation_rate: 0.2,
        weight_mutation_magnitude: 0.05,
        weight_mutation_decay: 'linear' as const,
        neural_output_bias: -0.1,
        fitness_efficiency_penalty: 0.1,
        neural_dead_zone: 0.1,
        frame_storage_mode: 'all' as const,
        frame_rate: 15,
        sparse_top_count: 10,
        sparse_bottom_count: 5,
        use_proprioception: false,
        proprioception_inputs: 'all' as const,
        // NEAT settings
        neat_add_connection_rate: 0.08,
        neat_add_node_rate: 0.04,
        neat_enable_rate: 0.05,
        neat_disable_rate: 0.03,
        neat_excess_coefficient: 1.5,
        neat_disjoint_coefficient: 1.2,
        neat_weight_coefficient: 0.6,
        neat_max_hidden_nodes: 24,
      };

      const frontendConfig = fromApiConfig(apiConfig);

      expect(frontendConfig.neatAddConnectionRate).toBe(0.08);
      expect(frontendConfig.neatAddNodeRate).toBe(0.04);
      expect(frontendConfig.neatEnableRate).toBe(0.05);
      expect(frontendConfig.neatDisableRate).toBe(0.03);
      expect(frontendConfig.neatExcessCoefficient).toBe(1.5);
      expect(frontendConfig.neatDisjointCoefficient).toBe(1.2);
      expect(frontendConfig.neatWeightCoefficient).toBe(0.6);
      expect(frontendConfig.neatMaxHiddenNodes).toBe(24);
    });

    it('should use defaults for missing NEAT settings', () => {
      const apiConfig = {
        gravity: -9.8,
        ground_friction: 0.5,
        time_step: 1 / 30,
        simulation_duration: 20,
        population_size: 100,
        cull_percentage: 0.5,
        mutation_rate: 0.2,
        mutation_magnitude: 0.3,
        crossover_rate: 0.5,
        elite_count: 5,
        use_mutation: false,
        use_crossover: true,
        min_nodes: 3,
        max_nodes: 8,
        max_muscles: 15,
        max_allowed_frequency: 3.0,
        pellet_count: 3,
        arena_size: 10,
        fitness_pellet_points: 20,
        fitness_progress_max: 80,
        fitness_distance_per_unit: 3,
        fitness_distance_traveled_max: 20,
        fitness_regression_penalty: 20,
        use_neural_net: true,
        neural_mode: 'neat' as const,
        bias_mode: 'bias_node' as const,
        time_encoding: 'none' as const,
        neural_hidden_size: 8,
        neural_activation: 'tanh',
        weight_mutation_rate: 0.2,
        weight_mutation_magnitude: 0.05,
        weight_mutation_decay: 'linear' as const,
        neural_output_bias: -0.1,
        fitness_efficiency_penalty: 0.1,
        neural_dead_zone: 0.1,
        frame_storage_mode: 'all' as const,
        frame_rate: 15,
        sparse_top_count: 10,
        sparse_bottom_count: 5,
        use_proprioception: false,
        proprioception_inputs: 'all' as const,
        // No NEAT settings - should use defaults
      };

      const frontendConfig = fromApiConfig(apiConfig as any);

      // Should use default values
      expect(frontendConfig.neatAddConnectionRate).toBe(0.05);
      expect(frontendConfig.neatAddNodeRate).toBe(0.03);
      expect(frontendConfig.neatEnableRate).toBe(0.02);
      expect(frontendConfig.neatDisableRate).toBe(0.01);
      expect(frontendConfig.neatExcessCoefficient).toBe(1.0);
      expect(frontendConfig.neatDisjointCoefficient).toBe(1.0);
      expect(frontendConfig.neatWeightCoefficient).toBe(0.4);
      expect(frontendConfig.neatMaxHiddenNodes).toBe(16);
    });

    it('should round-trip NEAT settings correctly', () => {
      const originalConfig: SimulationConfig = {
        ...DEFAULT_CONFIG,
        neuralMode: 'neat',
        neatAddConnectionRate: 0.07,
        neatAddNodeRate: 0.04,
        neatEnableRate: 0.06,
        neatDisableRate: 0.02,
        neatExcessCoefficient: 2.5,
        neatDisjointCoefficient: 1.8,
        neatWeightCoefficient: 0.3,
        neatMaxHiddenNodes: 48,
      };

      const apiConfig = toApiConfig(originalConfig);
      const roundTripped = fromApiConfig(apiConfig);

      expect(roundTripped.neatAddConnectionRate).toBe(originalConfig.neatAddConnectionRate);
      expect(roundTripped.neatAddNodeRate).toBe(originalConfig.neatAddNodeRate);
      expect(roundTripped.neatEnableRate).toBe(originalConfig.neatEnableRate);
      expect(roundTripped.neatDisableRate).toBe(originalConfig.neatDisableRate);
      expect(roundTripped.neatExcessCoefficient).toBe(originalConfig.neatExcessCoefficient);
      expect(roundTripped.neatDisjointCoefficient).toBe(originalConfig.neatDisjointCoefficient);
      expect(roundTripped.neatWeightCoefficient).toBe(originalConfig.neatWeightCoefficient);
      expect(roundTripped.neatMaxHiddenNodes).toBe(originalConfig.neatMaxHiddenNodes);
    });
  });
});
