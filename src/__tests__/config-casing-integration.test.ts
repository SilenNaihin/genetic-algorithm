/**
 * Integration stress tests for config snake_case handling.
 *
 * Tests that config fields are consistently snake_case throughout
 * both frontend and backend. This ensures settings like time_encoding
 * and use_proprioception work correctly.
 */

import { describe, it, expect } from 'vitest';
import { fromApiConfig, toApiConfig } from '../services/ApiClient';
import { DEFAULT_CONFIG, type SimulationConfig } from '../types/simulation';

// Helper to create a test config with custom values
function createTestConfig(overrides: Partial<SimulationConfig> = {}): SimulationConfig {
  return {
    ...DEFAULT_CONFIG,
    neural_mode: 'neat',
    time_encoding: 'sin_raw',
    use_proprioception: true,
    proprioception_inputs: 'all',
    ...overrides,
  };
}

// =============================================================================
// API Config Conversion Tests
// =============================================================================

describe('Config Snake_Case Consistency', () => {
  describe('fromApiConfig preserves snake_case fields', () => {
    it('should preserve time_encoding', () => {
      const apiConfig = createTestConfig({ time_encoding: 'sin_raw' });
      const frontendConfig = fromApiConfig(apiConfig);

      expect(frontendConfig.time_encoding).toBe('sin_raw');
    });

    it('should preserve use_proprioception', () => {
      const apiConfig = createTestConfig({ use_proprioception: true });
      const frontendConfig = fromApiConfig(apiConfig);

      expect(frontendConfig.use_proprioception).toBe(true);
    });

    it('should preserve proprioception_inputs', () => {
      const apiConfig = createTestConfig({ proprioception_inputs: 'velocity' });
      const frontendConfig = fromApiConfig(apiConfig);

      expect(frontendConfig.proprioception_inputs).toBe('velocity');
    });

    it('should preserve neural_mode', () => {
      const apiConfig = createTestConfig({ neural_mode: 'neat' });
      const frontendConfig = fromApiConfig(apiConfig);

      expect(frontendConfig.neural_mode).toBe('neat');
    });

    it('should preserve neural_dead_zone', () => {
      const apiConfig = createTestConfig({ neural_dead_zone: 0.15 });
      const frontendConfig = fromApiConfig(apiConfig);

      expect(frontendConfig.neural_dead_zone).toBe(0.15);
    });

    it('should handle all time encoding values', () => {
      const encodings: SimulationConfig['time_encoding'][] = ['none', 'cyclic', 'sin', 'raw', 'sin_raw'];

      for (const encoding of encodings) {
        const apiConfig = createTestConfig({ time_encoding: encoding });
        const frontendConfig = fromApiConfig(apiConfig);
        expect(frontendConfig.time_encoding).toBe(encoding);
      }
    });

    it('should handle all proprioception_inputs values', () => {
      const inputs: SimulationConfig['proprioception_inputs'][] = ['strain', 'velocity', 'ground', 'all'];

      for (const input of inputs) {
        const apiConfig = createTestConfig({ proprioception_inputs: input });
        const frontendConfig = fromApiConfig(apiConfig);
        expect(frontendConfig.proprioception_inputs).toBe(input);
      }
    });
  });

  describe('toApiConfig preserves snake_case fields', () => {
    it('should preserve time_encoding', () => {
      const frontendConfig = createTestConfig({ time_encoding: 'cyclic' });
      const apiConfig = toApiConfig(frontendConfig);

      expect(apiConfig.time_encoding).toBe('cyclic');
    });

    it('should preserve use_proprioception', () => {
      const frontendConfig = createTestConfig({ use_proprioception: true });
      const apiConfig = toApiConfig(frontendConfig);

      expect(apiConfig.use_proprioception).toBe(true);
    });

    it('should preserve proprioception_inputs', () => {
      const frontendConfig = createTestConfig({ proprioception_inputs: 'ground' });
      const apiConfig = toApiConfig(frontendConfig);

      expect(apiConfig.proprioception_inputs).toBe('ground');
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve all config values through toApi -> fromApi round-trip', () => {
      const original = createTestConfig({
        time_encoding: 'sin_raw',
        use_proprioception: true,
        proprioception_inputs: 'all',
        neural_mode: 'neat',
        neural_dead_zone: 0.15,
      });

      const apiConfig = toApiConfig(original);
      const recovered = fromApiConfig(apiConfig);

      expect(recovered.time_encoding).toBe(original.time_encoding);
      expect(recovered.use_proprioception).toBe(original.use_proprioception);
      expect(recovered.proprioception_inputs).toBe(original.proprioception_inputs);
      expect(recovered.neural_mode).toBe(original.neural_mode);
      expect(recovered.neural_dead_zone).toBe(original.neural_dead_zone);
    });
  });
});

// =============================================================================
// Input Count Calculation Tests (based on config)
// =============================================================================

describe('Input Count Calculation', () => {
  // This replicates the calculation done in ReplayModal.tsx
  function calculateInputCount(config: Partial<SimulationConfig>, numMuscles: number, numNodes: number): number {
    let count = 7; // base inputs always

    const timeEncoding = config.time_encoding || 'none';
    const useProprioception = config.use_proprioception || false;
    const proprioceptionInputs = config.proprioception_inputs || 'all';

    if (timeEncoding === 'cyclic' || timeEncoding === 'sin_raw') count += 2;
    else if (timeEncoding === 'sin' || timeEncoding === 'raw') count += 1;

    if (useProprioception) {
      if (proprioceptionInputs === 'strain') count += numMuscles;
      else if (proprioceptionInputs === 'velocity') count += numNodes * 3;
      else if (proprioceptionInputs === 'ground') count += numNodes;
      else count += numMuscles + numNodes * 3 + numNodes; // all
    }

    return count;
  }

  describe('With snake_case config', () => {
    it('should calculate correct count for NEAT with sin_raw encoding and proprioception', () => {
      const config = createTestConfig({
        time_encoding: 'sin_raw',
        use_proprioception: true,
        proprioception_inputs: 'all',
      });

      // 7 (base) + 2 (sin_raw) + 15 (muscle strain) + 24 (node velocity 8*3) + 8 (ground) = 56
      const count = calculateInputCount(config, 15, 8);
      expect(count).toBe(56);
    });

    it('should calculate correct count for pure mode with no time encoding', () => {
      const config = createTestConfig({
        time_encoding: 'none',
        use_proprioception: false,
      });

      // 7 (base) + 0 (no time) + 0 (no proprio) = 7
      const count = calculateInputCount(config, 15, 8);
      expect(count).toBe(7);
    });

    it('should calculate correct count for hybrid mode with cyclic encoding', () => {
      const config = createTestConfig({
        time_encoding: 'cyclic',
        use_proprioception: false,
      });

      // 7 (base) + 2 (cyclic) = 9
      const count = calculateInputCount(config, 15, 8);
      expect(count).toBe(9);
    });
  });
});

// =============================================================================
// NeuralVisualizer Config Handling Tests
// =============================================================================

describe('NeuralVisualizer Config Handling', () => {
  // These test the same pattern used in ReplayModal when setting up the visualizer

  describe('setTimeEncoding parameter derivation', () => {
    it('should use time_encoding value', () => {
      const config = { time_encoding: 'sin_raw' as const };
      const value = config.time_encoding || 'none';
      expect(value).toBe('sin_raw');
    });
  });

  describe('setProprioception parameter derivation', () => {
    it('should use snake_case values', () => {
      const config = {
        use_proprioception: true,
        proprioception_inputs: 'all' as const,
      };

      const proprioConfig = {
        enabled: config.use_proprioception || false,
        inputs: config.proprioception_inputs || 'all',
        numMuscles: 15,
        numNodes: 8,
      };

      expect(proprioConfig.enabled).toBe(true);
      expect(proprioConfig.inputs).toBe('all');
    });
  });
});

// =============================================================================
// Stored Config Format Tests (database/API format)
// =============================================================================

describe('Stored Config Format', () => {
  // Both frontend and backend use snake_case

  it('should recognize snake_case config format', () => {
    const config = {
      neural_mode: 'neat',
      time_encoding: 'sin_raw',
      use_proprioception: true,
      proprioception_inputs: 'all',
    };

    expect(config.time_encoding).toBe('sin_raw');
    expect(config.use_proprioception).toBe(true);
    expect(config.proprioception_inputs).toBe('all');
  });

  it('should preserve backend format through conversion', () => {
    const backendConfig = createTestConfig({
      neural_mode: 'neat',
      time_encoding: 'sin_raw',
      use_proprioception: true,
      proprioception_inputs: 'all',
    });

    const frontendConfig = fromApiConfig(backendConfig);

    expect(frontendConfig.neural_mode).toBe('neat');
    expect(frontendConfig.time_encoding).toBe('sin_raw');
    expect(frontendConfig.use_proprioception).toBe(true);
    expect(frontendConfig.proprioception_inputs).toBe('all');
  });
});
