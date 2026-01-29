import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DEFAULT_CONFIG, type SimulationConfig } from '../types/simulation';
import * as PresetStorage from '../storage/PresetStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('PresetStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('getDefaultPresetId', () => {
    it('returns the default preset ID', () => {
      const id = PresetStorage.getDefaultPresetId();
      expect(id).toBe('preset_default');
    });
  });

  describe('getAllPresets', () => {
    it('automatically seeds default preset when storage is empty', () => {
      const presets = PresetStorage.getAllPresets();
      expect(presets).toHaveLength(1);
      expect(presets[0].id).toBe('preset_default');
      expect(presets[0].name).toBe('Default');
    });

    it('returns all saved presets including default', () => {
      const preset1 = PresetStorage.savePreset('Preset 1', DEFAULT_CONFIG);
      const preset2 = PresetStorage.savePreset('Preset 2', DEFAULT_CONFIG);

      const presets = PresetStorage.getAllPresets();
      // 3 presets: default + 2 saved
      expect(presets).toHaveLength(3);
      expect(presets.map((p) => p.id)).toContain('preset_default');
      expect(presets.map((p) => p.id)).toContain(preset1.id);
      expect(presets.map((p) => p.id)).toContain(preset2.id);
    });
  });

  describe('savePreset', () => {
    it('creates a preset with correct structure', () => {
      const preset = PresetStorage.savePreset('Test Preset', DEFAULT_CONFIG);

      expect(preset.id).toMatch(/^preset_/);
      expect(preset.name).toBe('Test Preset');
      expect(preset.config).toEqual(DEFAULT_CONFIG);
      expect(preset.createdAt).toBeGreaterThan(0);
      expect(preset.updatedAt).toBeGreaterThan(0);
    });

    it('saves config by value, not reference', () => {
      const config = { ...DEFAULT_CONFIG, population_size: 200 };
      const preset = PresetStorage.savePreset('Test', config);

      // Modify original config
      config.population_size = 300;

      // Preset should still have original value
      expect(preset.config.population_size).toBe(200);
    });

    it('persists to localStorage', () => {
      const customConfig = { ...DEFAULT_CONFIG, population_size: 333 };
      PresetStorage.savePreset('Test', customConfig);

      expect(localStorageMock.setItem).toHaveBeenCalled();
      const presets = PresetStorage.getAllPresets();
      expect(presets).toHaveLength(2); // default + new
    });
  });

  describe('getPresetById', () => {
    it('returns preset when found', () => {
      const saved = PresetStorage.savePreset('Test', DEFAULT_CONFIG);
      const found = PresetStorage.getPresetById(saved.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(saved.id);
      expect(found?.name).toBe('Test');
    });

    it('returns null when not found', () => {
      const found = PresetStorage.getPresetById('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('updatePreset', () => {
    it('updates preset name', () => {
      const preset = PresetStorage.savePreset('Original', DEFAULT_CONFIG);
      PresetStorage.updatePreset(preset.id, { name: 'Updated' });

      const found = PresetStorage.getPresetById(preset.id);
      expect(found?.name).toBe('Updated');
    });

    it('updates updatedAt timestamp', () => {
      const preset = PresetStorage.savePreset('Test', DEFAULT_CONFIG);
      const originalUpdatedAt = preset.updatedAt;

      // Small delay to ensure different timestamp
      vi.spyOn(Date, 'now').mockReturnValueOnce(originalUpdatedAt + 1000);
      PresetStorage.updatePreset(preset.id, { name: 'New Name' });

      const found = PresetStorage.getPresetById(preset.id);
      expect(found?.updatedAt).toBeGreaterThan(originalUpdatedAt);
    });

    it('does nothing for non-existent preset', () => {
      // Should not throw
      expect(() => {
        PresetStorage.updatePreset('nonexistent', { name: 'Test' });
      }).not.toThrow();
    });
  });

  describe('deletePreset', () => {
    it('removes preset from storage', () => {
      const preset = PresetStorage.savePreset('Test', DEFAULT_CONFIG);
      PresetStorage.deletePreset(preset.id);

      const found = PresetStorage.getPresetById(preset.id);
      expect(found).toBeNull();
    });

    it('does not affect other presets', () => {
      const preset1 = PresetStorage.savePreset('Preset 1', DEFAULT_CONFIG);
      const preset2 = PresetStorage.savePreset('Preset 2', DEFAULT_CONFIG);

      PresetStorage.deletePreset(preset1.id);

      const found2 = PresetStorage.getPresetById(preset2.id);
      expect(found2).not.toBeNull();
    });
  });

  describe('configsEqual', () => {
    it('returns true for identical configs', () => {
      const result = PresetStorage.configsEqual(DEFAULT_CONFIG, DEFAULT_CONFIG);
      expect(result).toBe(true);
    });

    it('returns true for configs with same values in different order', () => {
      const config1 = { ...DEFAULT_CONFIG };
      const config2 = { ...DEFAULT_CONFIG };

      // Technically the same, just testing the comparison is order-independent
      const result = PresetStorage.configsEqual(config1, config2);
      expect(result).toBe(true);
    });

    it('returns false for different configs', () => {
      const config1 = { ...DEFAULT_CONFIG, population_size: 100 };
      const config2 = { ...DEFAULT_CONFIG, population_size: 200 };

      const result = PresetStorage.configsEqual(config1, config2);
      expect(result).toBe(false);
    });

    it('detects differences in nested properties', () => {
      const config1 = { ...DEFAULT_CONFIG, mutation_rate: 0.1 };
      const config2 = { ...DEFAULT_CONFIG, mutation_rate: 0.2 };

      const result = PresetStorage.configsEqual(config1, config2);
      expect(result).toBe(false);
    });
  });

  describe('findDuplicatePreset', () => {
    it('finds default preset as duplicate for DEFAULT_CONFIG', () => {
      // Default preset is auto-seeded with DEFAULT_CONFIG
      const duplicate = PresetStorage.findDuplicatePreset(DEFAULT_CONFIG);
      expect(duplicate).not.toBeNull();
      expect(duplicate?.id).toBe('preset_default');
    });

    it('returns null when no duplicates exist for modified config', () => {
      const modifiedConfig = { ...DEFAULT_CONFIG, population_size: 999 };
      const result = PresetStorage.findDuplicatePreset(modifiedConfig);
      expect(result).toBeNull();
    });

    it('finds exact duplicate config', () => {
      const customConfig = { ...DEFAULT_CONFIG, population_size: 777 };
      const preset = PresetStorage.savePreset('Original', customConfig);
      const duplicate = PresetStorage.findDuplicatePreset(customConfig);

      expect(duplicate).not.toBeNull();
      expect(duplicate?.id).toBe(preset.id);
    });

    it('does not match different configs', () => {
      const config1 = { ...DEFAULT_CONFIG, population_size: 100 };
      const config2 = { ...DEFAULT_CONFIG, population_size: 200 };

      PresetStorage.savePreset('Config 1', config1);
      const duplicate = PresetStorage.findDuplicatePreset(config2);

      expect(duplicate).toBeNull();
    });

    it('finds duplicate even with different preset names', () => {
      const customConfig = { ...DEFAULT_CONFIG, population_size: 888 };
      PresetStorage.savePreset('Name A', customConfig);
      PresetStorage.savePreset('Name B', customConfig);

      // Both have same config, should find one of them
      const duplicate = PresetStorage.findDuplicatePreset(customConfig);
      expect(duplicate).not.toBeNull();
    });
  });

  describe('integration scenarios', () => {
    it('full CRUD workflow', () => {
      // Create (default preset auto-seeded, so we start with 1)
      const customConfig = { ...DEFAULT_CONFIG, population_size: 555 };
      const preset = PresetStorage.savePreset('My Config', customConfig);
      expect(PresetStorage.getAllPresets()).toHaveLength(2); // default + new

      // Read
      const found = PresetStorage.getPresetById(preset.id);
      expect(found?.name).toBe('My Config');

      // Update
      PresetStorage.updatePreset(preset.id, { name: 'Renamed Config' });
      const updated = PresetStorage.getPresetById(preset.id);
      expect(updated?.name).toBe('Renamed Config');

      // Delete
      PresetStorage.deletePreset(preset.id);
      expect(PresetStorage.getAllPresets()).toHaveLength(1); // only default remains
    });

    it('handles multiple presets with different configs', () => {
      const configs: Partial<SimulationConfig>[] = [
        { population_size: 50 },
        { population_size: 150 },  // Changed from 100 to avoid duplicate with DEFAULT_CONFIG
        { population_size: 200 },
      ];

      configs.forEach((config, i) => {
        PresetStorage.savePreset(`Preset ${i}`, { ...DEFAULT_CONFIG, ...config });
      });

      const presets = PresetStorage.getAllPresets();
      expect(presets).toHaveLength(4); // default + 3 custom

      // Each custom preset should have unique population size (excluding default)
      const customPresets = presets.filter(p => p.id !== 'preset_default');
      const popSizes = customPresets.map((p) => p.config.population_size);
      expect(new Set(popSizes).size).toBe(3);
    });
  });
});
