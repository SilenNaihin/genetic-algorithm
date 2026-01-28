/**
 * Integration stress tests for bias_mode propagation.
 *
 * Tests that bias_mode is correctly preserved throughout the entire data flow.
 * Both frontend and backend now use snake_case consistently.
 */

import { describe, it, expect } from 'vitest';
import { toApiConfig, fromApiConfig } from '../services/ApiClient';
import { DEFAULT_CONFIG, SimulationConfig } from '../types/simulation';

describe('bias_mode Propagation', () => {
  describe('ApiClient conversion functions', () => {
    it('toApiConfig should include bias_mode', () => {
      const config: SimulationConfig = {
        ...DEFAULT_CONFIG,
        bias_mode: 'bias_node',
      };

      const apiConfig = toApiConfig(config);

      expect(apiConfig).toHaveProperty('bias_mode');
      expect(apiConfig.bias_mode).toBe('bias_node');
    });

    it('toApiConfig should preserve all three bias_mode values', () => {
      const modes: Array<'none' | 'node' | 'bias_node'> = ['none', 'node', 'bias_node'];

      for (const mode of modes) {
        const config: SimulationConfig = {
          ...DEFAULT_CONFIG,
          bias_mode: mode,
        };

        const apiConfig = toApiConfig(config);
        expect(apiConfig.bias_mode).toBe(mode);
      }
    });

    it('fromApiConfig should preserve bias_mode', () => {
      const apiConfig = {
        ...DEFAULT_CONFIG,
        use_neural_net: true,
        neural_mode: 'neat' as const,
        bias_mode: 'bias_node' as const,
      };

      const frontendConfig = fromApiConfig(apiConfig);

      expect(frontendConfig).toHaveProperty('bias_mode');
      expect(frontendConfig.bias_mode).toBe('bias_node');
    });

    it('fromApiConfig should preserve all three bias_mode values', () => {
      const modes: Array<'none' | 'node' | 'bias_node'> = ['none', 'node', 'bias_node'];

      for (const mode of modes) {
        const apiConfig = {
          ...DEFAULT_CONFIG,
          bias_mode: mode,
        };

        const frontendConfig = fromApiConfig(apiConfig);
        expect(frontendConfig.bias_mode).toBe(mode);
      }
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve bias_mode through toApiConfig -> fromApiConfig', () => {
      const originalConfig: SimulationConfig = {
        ...DEFAULT_CONFIG,
        bias_mode: 'bias_node',
        neural_mode: 'neat',
      };

      const apiConfig = toApiConfig(originalConfig);
      const roundTrippedConfig = fromApiConfig(apiConfig);

      expect(roundTrippedConfig.bias_mode).toBe(originalConfig.bias_mode);
    });

    it('should preserve all bias_mode values through round-trip', () => {
      const modes: Array<'none' | 'node' | 'bias_node'> = ['none', 'node', 'bias_node'];

      for (const mode of modes) {
        const originalConfig: SimulationConfig = {
          ...DEFAULT_CONFIG,
          bias_mode: mode,
        };

        const apiConfig = toApiConfig(originalConfig);
        const roundTrippedConfig = fromApiConfig(apiConfig);

        expect(roundTrippedConfig.bias_mode).toBe(mode);
      }
    });
  });

  describe('ApiSimulationConfig interface', () => {
    it('should have bias_mode field typed correctly', () => {
      const apiConfig = toApiConfig({
        ...DEFAULT_CONFIG,
        bias_mode: 'node',
      });

      // TypeScript compile-time check
      const biasMode: 'none' | 'node' | 'bias_node' = apiConfig.bias_mode;
      expect(biasMode).toBe('node');
    });
  });

  describe('Default value handling', () => {
    it('toApiConfig should use default bias_mode when not explicitly set', () => {
      // DEFAULT_CONFIG.bias_mode should be 'node'
      const apiConfig = toApiConfig(DEFAULT_CONFIG);

      expect(apiConfig.bias_mode).toBe('node');
    });

    it('fromApiConfig should handle missing bias_mode gracefully', () => {
      // Simulate old API response without bias_mode
      const oldApiConfig = {
        ...DEFAULT_CONFIG,
        bias_mode: undefined,
      };

      const frontendConfig = fromApiConfig(oldApiConfig as any);

      // Should default to 'node' when missing
      expect(frontendConfig.bias_mode).toBe('node');
    });
  });

  describe('NEAT mode auto-defaults', () => {
    it('NEAT mode should use node bias by default in frontend', () => {
      // Verify the frontend default for NEAT
      expect(DEFAULT_CONFIG.bias_mode).toBe('node');
      // Note: The NeuralPanel.tsx auto-switches to 'bias_node' when NEAT is selected
    });
  });

  describe('Integration with other NEAT config fields', () => {
    it('should preserve bias_mode alongside other NEAT settings', () => {
      const neatConfig: SimulationConfig = {
        ...DEFAULT_CONFIG,
        neural_mode: 'neat',
        bias_mode: 'bias_node',
        selection_method: 'speciation',
        use_fitness_sharing: false,
        neat_add_connection_rate: 0.05,
        neat_add_node_rate: 0.03,
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
        neural_mode: 'neat',
        neat_add_connection_rate: 0.1,
        neat_add_node_rate: 0.05,
        neat_enable_rate: 0.03,
        neat_disable_rate: 0.02,
        neat_excess_coefficient: 2.0,
        neat_disjoint_coefficient: 1.5,
        neat_weight_coefficient: 0.5,
        neat_max_hidden_nodes: 32,
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

    it('fromApiConfig should preserve all NEAT settings', () => {
      const apiConfig = {
        ...DEFAULT_CONFIG,
        neural_mode: 'neat' as const,
        bias_mode: 'bias_node' as const,
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

      expect(frontendConfig.neat_add_connection_rate).toBe(0.08);
      expect(frontendConfig.neat_add_node_rate).toBe(0.04);
      expect(frontendConfig.neat_enable_rate).toBe(0.05);
      expect(frontendConfig.neat_disable_rate).toBe(0.03);
      expect(frontendConfig.neat_excess_coefficient).toBe(1.5);
      expect(frontendConfig.neat_disjoint_coefficient).toBe(1.2);
      expect(frontendConfig.neat_weight_coefficient).toBe(0.6);
      expect(frontendConfig.neat_max_hidden_nodes).toBe(24);
    });

    it('should use defaults for missing NEAT settings', () => {
      const apiConfig = {
        ...DEFAULT_CONFIG,
        neural_mode: 'neat' as const,
        bias_mode: 'bias_node' as const,
        // NEAT settings missing - should use defaults
        neat_add_connection_rate: undefined,
        neat_add_node_rate: undefined,
      };

      const frontendConfig = fromApiConfig(apiConfig as any);

      // Should use default values
      expect(frontendConfig.neat_add_connection_rate).toBe(0.05);
      expect(frontendConfig.neat_add_node_rate).toBe(0.03);
      expect(frontendConfig.neat_enable_rate).toBe(0.02);
      expect(frontendConfig.neat_disable_rate).toBe(0.01);
      expect(frontendConfig.neat_excess_coefficient).toBe(1.0);
      expect(frontendConfig.neat_disjoint_coefficient).toBe(1.0);
      expect(frontendConfig.neat_weight_coefficient).toBe(0.4);
      expect(frontendConfig.neat_max_hidden_nodes).toBe(16);
    });

    it('should round-trip NEAT settings correctly', () => {
      const originalConfig: SimulationConfig = {
        ...DEFAULT_CONFIG,
        neural_mode: 'neat',
        neat_add_connection_rate: 0.07,
        neat_add_node_rate: 0.04,
        neat_enable_rate: 0.06,
        neat_disable_rate: 0.02,
        neat_excess_coefficient: 2.5,
        neat_disjoint_coefficient: 1.8,
        neat_weight_coefficient: 0.3,
        neat_max_hidden_nodes: 48,
      };

      const apiConfig = toApiConfig(originalConfig);
      const roundTripped = fromApiConfig(apiConfig);

      expect(roundTripped.neat_add_connection_rate).toBe(originalConfig.neat_add_connection_rate);
      expect(roundTripped.neat_add_node_rate).toBe(originalConfig.neat_add_node_rate);
      expect(roundTripped.neat_enable_rate).toBe(originalConfig.neat_enable_rate);
      expect(roundTripped.neat_disable_rate).toBe(originalConfig.neat_disable_rate);
      expect(roundTripped.neat_excess_coefficient).toBe(originalConfig.neat_excess_coefficient);
      expect(roundTripped.neat_disjoint_coefficient).toBe(originalConfig.neat_disjoint_coefficient);
      expect(roundTripped.neat_weight_coefficient).toBe(originalConfig.neat_weight_coefficient);
      expect(roundTripped.neat_max_hidden_nodes).toBe(originalConfig.neat_max_hidden_nodes);
    });
  });
});
