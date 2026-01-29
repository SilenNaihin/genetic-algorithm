import type { SimulationConfig } from '../types/simulation';
import { DEFAULT_CONFIG } from '../types/simulation';
import { generateId } from '../utils/id';

const STORAGE_KEY = 'evolution-lab-presets';
const DEFAULT_PRESET_ID = 'preset_default';

/**
 * A saved configuration preset
 */
export interface ConfigPreset {
  id: string;
  name: string;
  config: SimulationConfig;
  createdAt: number;
  updatedAt: number;
}

/**
 * Get the default preset ID
 */
export function getDefaultPresetId(): string {
  return DEFAULT_PRESET_ID;
}

/**
 * Ensure the default preset exists in storage
 */
function ensureDefaultPreset(): void {
  if (typeof window === 'undefined') return;

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const presets: ConfigPreset[] = data ? JSON.parse(data) : [];

    // Check if default preset exists
    const hasDefault = presets.some((p) => p.id === DEFAULT_PRESET_ID);
    if (!hasDefault) {
      const now = Date.now();
      const defaultPreset: ConfigPreset = {
        id: DEFAULT_PRESET_ID,
        name: 'Default',
        config: { ...DEFAULT_CONFIG },
        createdAt: now,
        updatedAt: now,
      };
      presets.unshift(defaultPreset);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    }
  } catch (e) {
    console.error('Error ensuring default preset:', e);
  }
}

/**
 * Get all saved presets from localStorage
 */
export function getAllPresets(): ConfigPreset[] {
  if (typeof window === 'undefined') return [];

  // Ensure default preset exists
  ensureDefaultPreset();

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading presets from localStorage:', e);
    return [];
  }
}

/**
 * Get a preset by ID
 */
export function getPresetById(id: string): ConfigPreset | null {
  const presets = getAllPresets();
  return presets.find((p) => p.id === id) ?? null;
}

/**
 * Save all presets to localStorage
 */
function savePresets(presets: ConfigPreset[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('Error saving presets to localStorage:', e);
  }
}

/**
 * Save a new preset. Returns the created preset.
 */
export function savePreset(name: string, config: SimulationConfig): ConfigPreset {
  const presets = getAllPresets();
  const now = Date.now();
  const preset: ConfigPreset = {
    id: generateId('preset'),
    name,
    config: { ...config },
    createdAt: now,
    updatedAt: now,
  };
  presets.push(preset);
  savePresets(presets);
  return preset;
}

/**
 * Update an existing preset (name only - config is immutable)
 */
export function updatePreset(id: string, updates: { name?: string }): void {
  const presets = getAllPresets();
  const index = presets.findIndex((p) => p.id === id);
  if (index === -1) return;

  if (updates.name !== undefined) {
    presets[index].name = updates.name;
  }
  presets[index].updatedAt = Date.now();
  savePresets(presets);
}

/**
 * Delete a preset by ID
 */
export function deletePreset(id: string): void {
  const presets = getAllPresets();
  const filtered = presets.filter((p) => p.id !== id);
  savePresets(filtered);
}

/**
 * Normalize a config for comparison by sorting keys and removing undefined values
 */
function normalizeConfig(config: SimulationConfig): string {
  // Sort keys and create a stable JSON representation
  const sortedKeys = Object.keys(config).sort();
  const normalized: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    const value = config[key as keyof SimulationConfig];
    if (value !== undefined) {
      normalized[key] = value;
    }
  }
  return JSON.stringify(normalized);
}

/**
 * Check if two configs are equal (order-independent comparison)
 */
export function configsEqual(a: SimulationConfig, b: SimulationConfig): boolean {
  return normalizeConfig(a) === normalizeConfig(b);
}

/**
 * Find a preset with the same config (for duplicate detection)
 */
export function findDuplicatePreset(config: SimulationConfig): ConfigPreset | null {
  const presets = getAllPresets();
  const configStr = normalizeConfig(config);

  for (const preset of presets) {
    if (normalizeConfig(preset.config) === configStr) {
      return preset;
    }
  }
  return null;
}
