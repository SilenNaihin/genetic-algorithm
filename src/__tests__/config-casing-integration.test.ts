/**
 * Integration stress tests for config camelCase/snake_case handling.
 *
 * BUG BEING TESTED: Frontend code expects camelCase config keys but API returns snake_case.
 * This causes settings like timeEncoding and useProprioception to be undefined,
 * leading to wrong defaults being used (e.g., expecting 7 inputs instead of 56).
 *
 * The fix must handle BOTH cases since old configs may have been saved in either format.
 */

import { describe, it, expect } from 'vitest';
import { fromApiConfig, toApiConfig, type ApiSimulationConfig } from '../services/ApiClient';
import { DEFAULT_CONFIG, type SimulationConfig } from '../types/simulation';

// Helper to create a minimal API config (snake_case as returned by backend)
function createSnakeCaseConfig(overrides: Partial<ApiSimulationConfig> = {}): ApiSimulationConfig {
  return {
    gravity: -9.8,
    ground_friction: 0.5,
    time_step: 1/30,
    simulation_duration: 20.0,
    population_size: 100,
    cull_percentage: 0.5,
    mutation_rate: 0.2,
    mutation_magnitude: 0.3,
    crossover_rate: 0.5,
    elite_count: 5,
    use_mutation: true,
    use_crossover: false,
    min_nodes: 3,
    max_nodes: 8,
    max_muscles: 15,
    max_allowed_frequency: 3.0,
    pellet_count: 3,
    arena_size: 10.0,
    fitness_pellet_points: 20.0,
    fitness_progress_max: 80.0,
    fitness_distance_per_unit: 3.0,
    fitness_distance_traveled_max: 20.0,
    fitness_regression_penalty: 20.0,
    use_neural_net: true,
    neural_mode: 'neat',
    time_encoding: 'sin_raw',
    neural_hidden_size: 8,
    neural_activation: 'tanh',
    weight_mutation_rate: 0.2,
    weight_mutation_magnitude: 0.05,
    weight_mutation_decay: 'linear',
    neural_output_bias: -0.1,
    fitness_efficiency_penalty: 0.1,
    neural_dead_zone: 0.1,
    frame_storage_mode: 'all',
    frame_rate: 15,
    sparse_top_count: 10,
    sparse_bottom_count: 10,
    use_proprioception: true,
    proprioception_inputs: 'all',
    ...overrides,
  };
}

// Helper to create a camelCase config (frontend format)
function createCamelCaseConfig(overrides: Partial<SimulationConfig> = {}): SimulationConfig {
  return {
    ...DEFAULT_CONFIG,
    neuralMode: 'neat',
    timeEncoding: 'sin_raw',
    useProprioception: true,
    proprioceptionInputs: 'all',
    ...overrides,
  };
}

// =============================================================================
// API Config Conversion Tests
// =============================================================================

describe('Config Casing Conversion', () => {
  describe('fromApiConfig (snake_case to camelCase)', () => {
    it('should convert time_encoding to timeEncoding', () => {
      const apiConfig = createSnakeCaseConfig({ time_encoding: 'sin_raw' });
      const frontendConfig = fromApiConfig(apiConfig);

      expect(frontendConfig.timeEncoding).toBe('sin_raw');
      // Should NOT have snake_case key
      expect((frontendConfig as Record<string, unknown>)['time_encoding']).toBeUndefined();
    });

    it('should convert use_proprioception to useProprioception', () => {
      const apiConfig = createSnakeCaseConfig({ use_proprioception: true });
      const frontendConfig = fromApiConfig(apiConfig);

      expect(frontendConfig.useProprioception).toBe(true);
      expect((frontendConfig as Record<string, unknown>)['use_proprioception']).toBeUndefined();
    });

    it('should convert proprioception_inputs to proprioceptionInputs', () => {
      const apiConfig = createSnakeCaseConfig({ proprioception_inputs: 'velocity' });
      const frontendConfig = fromApiConfig(apiConfig);

      expect(frontendConfig.proprioceptionInputs).toBe('velocity');
      expect((frontendConfig as Record<string, unknown>)['proprioception_inputs']).toBeUndefined();
    });

    it('should convert neural_mode to neuralMode', () => {
      const apiConfig = createSnakeCaseConfig({ neural_mode: 'neat' });
      const frontendConfig = fromApiConfig(apiConfig);

      expect(frontendConfig.neuralMode).toBe('neat');
    });

    it('should convert neural_dead_zone to neuralDeadZone', () => {
      const apiConfig = createSnakeCaseConfig({ neural_dead_zone: 0.15 });
      const frontendConfig = fromApiConfig(apiConfig);

      expect(frontendConfig.neuralDeadZone).toBe(0.15);
    });

    it('should handle all time encoding values', () => {
      const encodings: ApiSimulationConfig['time_encoding'][] = ['none', 'cyclic', 'sin', 'raw', 'sin_raw'];

      for (const encoding of encodings) {
        const apiConfig = createSnakeCaseConfig({ time_encoding: encoding });
        const frontendConfig = fromApiConfig(apiConfig);
        expect(frontendConfig.timeEncoding).toBe(encoding);
      }
    });

    it('should handle all proprioception_inputs values', () => {
      const inputs: ApiSimulationConfig['proprioception_inputs'][] = ['strain', 'velocity', 'ground', 'all'];

      for (const input of inputs) {
        const apiConfig = createSnakeCaseConfig({ proprioception_inputs: input });
        const frontendConfig = fromApiConfig(apiConfig);
        expect(frontendConfig.proprioceptionInputs).toBe(input);
      }
    });
  });

  describe('toApiConfig (camelCase to snake_case)', () => {
    it('should convert timeEncoding to time_encoding', () => {
      const frontendConfig = createCamelCaseConfig({ timeEncoding: 'cyclic' });
      const apiConfig = toApiConfig(frontendConfig);

      expect(apiConfig.time_encoding).toBe('cyclic');
    });

    it('should convert useProprioception to use_proprioception', () => {
      const frontendConfig = createCamelCaseConfig({ useProprioception: true });
      const apiConfig = toApiConfig(frontendConfig);

      expect(apiConfig.use_proprioception).toBe(true);
    });

    it('should convert proprioceptionInputs to proprioception_inputs', () => {
      const frontendConfig = createCamelCaseConfig({ proprioceptionInputs: 'ground' });
      const apiConfig = toApiConfig(frontendConfig);

      expect(apiConfig.proprioception_inputs).toBe('ground');
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve all config values through toApi -> fromApi round-trip', () => {
      const original = createCamelCaseConfig({
        timeEncoding: 'sin_raw',
        useProprioception: true,
        proprioceptionInputs: 'all',
        neuralMode: 'neat',
        neuralDeadZone: 0.15,
      });

      const apiConfig = toApiConfig(original);
      const recovered = fromApiConfig(apiConfig);

      expect(recovered.timeEncoding).toBe(original.timeEncoding);
      expect(recovered.useProprioception).toBe(original.useProprioception);
      expect(recovered.proprioceptionInputs).toBe(original.proprioceptionInputs);
      expect(recovered.neuralMode).toBe(original.neuralMode);
      expect(recovered.neuralDeadZone).toBe(original.neuralDeadZone);
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

    // Use camelCase - this is what the frontend code does
    const timeEncoding = config.timeEncoding || 'none';
    const useProprioception = config.useProprioception || false;
    const proprioceptionInputs = config.proprioceptionInputs || 'all';

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

  // Helper that handles BOTH snake_case and camelCase
  function calculateInputCountSafe(config: Record<string, unknown>, numMuscles: number, numNodes: number): number {
    let count = 7;

    // Handle both camelCase and snake_case
    const timeEncoding = (config.timeEncoding ?? config.time_encoding ?? 'none') as string;
    const useProprioception = (config.useProprioception ?? config.use_proprioception ?? false) as boolean;
    const proprioceptionInputs = (config.proprioceptionInputs ?? config.proprioception_inputs ?? 'all') as string;

    if (timeEncoding === 'cyclic' || timeEncoding === 'sin_raw') count += 2;
    else if (timeEncoding === 'sin' || timeEncoding === 'raw') count += 1;

    if (useProprioception) {
      if (proprioceptionInputs === 'strain') count += numMuscles;
      else if (proprioceptionInputs === 'velocity') count += numNodes * 3;
      else if (proprioceptionInputs === 'ground') count += numNodes;
      else count += numMuscles + numNodes * 3 + numNodes;
    }

    return count;
  }

  describe('With properly converted camelCase config', () => {
    it('should calculate correct count for NEAT with sin_raw encoding and proprioception', () => {
      const config = createCamelCaseConfig({
        timeEncoding: 'sin_raw',
        useProprioception: true,
        proprioceptionInputs: 'all',
      });

      // 7 (base) + 2 (sin_raw) + 15 (muscle strain) + 24 (node velocity 8*3) + 8 (ground) = 56
      const count = calculateInputCount(config, 15, 8);
      expect(count).toBe(56);
    });

    it('should calculate correct count for pure mode with no time encoding', () => {
      const config = createCamelCaseConfig({
        timeEncoding: 'none',
        useProprioception: false,
      });

      // 7 (base) + 0 (no time) + 0 (no proprio) = 7
      const count = calculateInputCount(config, 15, 8);
      expect(count).toBe(7);
    });

    it('should calculate correct count for hybrid mode with cyclic encoding', () => {
      const config = createCamelCaseConfig({
        timeEncoding: 'cyclic',
        useProprioception: false,
      });

      // 7 (base) + 2 (cyclic) = 9
      const count = calculateInputCount(config, 15, 8);
      expect(count).toBe(9);
    });
  });

  describe('With snake_case config (simulating the bug)', () => {
    it('should get WRONG count when using snake_case config directly', () => {
      // This simulates the bug: config has snake_case keys but code expects camelCase
      const snakeCaseConfig = {
        time_encoding: 'sin_raw',
        use_proprioception: true,
        proprioception_inputs: 'all',
      };

      // The buggy code does config.timeEncoding which is undefined
      const wrongCount = calculateInputCount(snakeCaseConfig as unknown as SimulationConfig, 15, 8);

      // This will be 7 because all settings default to their fallbacks
      expect(wrongCount).toBe(7);
      expect(wrongCount).not.toBe(56); // But it SHOULD be 56!
    });

    it('should get CORRECT count with safe calculation that handles both formats', () => {
      const snakeCaseConfig = {
        time_encoding: 'sin_raw',
        use_proprioception: true,
        proprioception_inputs: 'all',
      };

      const correctCount = calculateInputCountSafe(snakeCaseConfig, 15, 8);
      expect(correctCount).toBe(56);
    });
  });

  describe('Mixed case configs (edge cases)', () => {
    it('should handle config with some camelCase and some snake_case', () => {
      const mixedConfig = {
        timeEncoding: 'sin_raw',  // camelCase
        use_proprioception: true,  // snake_case
        proprioception_inputs: 'all',  // snake_case
      };

      const count = calculateInputCountSafe(mixedConfig, 15, 8);
      expect(count).toBe(56);
    });

    it('should prioritize camelCase over snake_case when both present', () => {
      const conflictingConfig = {
        timeEncoding: 'sin_raw',  // camelCase - should win
        time_encoding: 'none',    // snake_case - should be ignored
        useProprioception: true,
        use_proprioception: false,
        proprioceptionInputs: 'all',
        proprioception_inputs: 'strain',
      };

      const count = calculateInputCountSafe(conflictingConfig, 15, 8);
      // Should use camelCase values: sin_raw (2), proprioception=true, all
      expect(count).toBe(56);
    });
  });
});

// =============================================================================
// NeuralVisualizer Config Handling Tests
// =============================================================================

describe('NeuralVisualizer Config Handling', () => {
  // These test the same pattern used in ReplayModal when setting up the visualizer

  describe('setTimeEncoding parameter derivation', () => {
    it('should use camelCase timeEncoding when available', () => {
      const config = { timeEncoding: 'sin_raw' as const };
      const value = config.timeEncoding || 'none';
      expect(value).toBe('sin_raw');
    });

    it('should fall back to none when timeEncoding is undefined (simulating bug)', () => {
      const config = { time_encoding: 'sin_raw' };
      // This is how the buggy code works:
      const value = (config as unknown as SimulationConfig).timeEncoding || 'none';
      expect(value).toBe('none');  // BUG: should be 'sin_raw'
    });

    it('should handle both formats with nullish coalescing', () => {
      const config = { time_encoding: 'sin_raw' };
      // This is the fix:
      const value = (config as Record<string, unknown>).timeEncoding ??
                   (config as Record<string, unknown>).time_encoding ?? 'none';
      expect(value).toBe('sin_raw');
    });
  });

  describe('setProprioception parameter derivation', () => {
    it('should use camelCase values when available', () => {
      const config = {
        useProprioception: true,
        proprioceptionInputs: 'all' as const,
      };

      const proprioConfig = {
        enabled: config.useProprioception || false,
        inputs: config.proprioceptionInputs || 'all',
        numMuscles: 15,
        numNodes: 8,
      };

      expect(proprioConfig.enabled).toBe(true);
      expect(proprioConfig.inputs).toBe('all');
    });

    it('should get wrong values when config has snake_case (simulating bug)', () => {
      const config = {
        use_proprioception: true,
        proprioception_inputs: 'velocity',
      };

      // Buggy code:
      const proprioConfig = {
        enabled: (config as unknown as SimulationConfig).useProprioception || false,
        inputs: (config as unknown as SimulationConfig).proprioceptionInputs || 'all',
        numMuscles: 15,
        numNodes: 8,
      };

      expect(proprioConfig.enabled).toBe(false);  // BUG: should be true
      expect(proprioConfig.inputs).toBe('all');   // BUG: should be 'velocity'
    });

    it('should handle both formats with nullish coalescing', () => {
      const config = {
        use_proprioception: true,
        proprioception_inputs: 'velocity',
      } as Record<string, unknown>;

      // Fixed code:
      const proprioConfig = {
        enabled: (config.useProprioception ?? config.use_proprioception ?? false) as boolean,
        inputs: (config.proprioceptionInputs ?? config.proprioception_inputs ?? 'all') as string,
        numMuscles: 15,
        numNodes: 8,
      };

      expect(proprioConfig.enabled).toBe(true);
      expect(proprioConfig.inputs).toBe('velocity');
    });
  });
});

// =============================================================================
// Effect Dependencies Tests (for React useEffect hooks)
// =============================================================================

describe('Effect Dependency Tracking', () => {
  // ReplayModal has useEffect dependencies on config fields
  // If the config has snake_case keys, the dependencies won't trigger updates

  it('should track camelCase dependency correctly', () => {
    const configs = [
      { timeEncoding: 'none' as const },
      { timeEncoding: 'sin_raw' as const },
    ];

    // This is what React does - checks if dependency changed
    expect(configs[0].timeEncoding).not.toBe(configs[1].timeEncoding);
  });

  it('should NOT detect change when using wrong key name (bug scenario)', () => {
    const configs = [
      { time_encoding: 'none' as const },
      { time_encoding: 'sin_raw' as const },
    ];

    // If effect depends on config.timeEncoding, it won't see the change
    const dep1 = (configs[0] as unknown as SimulationConfig).timeEncoding;
    const dep2 = (configs[1] as unknown as SimulationConfig).timeEncoding;

    // Both are undefined, so React thinks nothing changed!
    expect(dep1).toBe(dep2);  // Both undefined
    expect(dep1).toBeUndefined();
  });
});

// =============================================================================
// Stored Config Format Tests (database/API format)
// =============================================================================

describe('Stored Config Format', () => {
  // The backend stores configs with snake_case keys
  // When loading a run, the config should be converted to camelCase

  it('should recognize backend config format (snake_case)', () => {
    const backendConfig = {
      neural_mode: 'neat',
      time_encoding: 'sin_raw',
      use_proprioception: true,
      proprioception_inputs: 'all',
    };

    // These are the snake_case keys from backend
    expect(backendConfig.time_encoding).toBe('sin_raw');
    expect(backendConfig.use_proprioception).toBe(true);
    expect(backendConfig.proprioception_inputs).toBe('all');
  });

  it('should convert backend format to frontend format', () => {
    const backendConfig = createSnakeCaseConfig({
      neural_mode: 'neat',
      time_encoding: 'sin_raw',
      use_proprioception: true,
      proprioception_inputs: 'all',
    });

    const frontendConfig = fromApiConfig(backendConfig);

    // These should now be camelCase
    expect(frontendConfig.neuralMode).toBe('neat');
    expect(frontendConfig.timeEncoding).toBe('sin_raw');
    expect(frontendConfig.useProprioception).toBe(true);
    expect(frontendConfig.proprioceptionInputs).toBe('all');
  });
});
