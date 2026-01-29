# Config Presets System

Documentation for working with the Evolution Lab configuration presets feature.

## Overview

The config presets system allows users to save, load, and manage simulation configurations. Presets are stored in `localStorage` under the key `evolution-lab-presets`.

A "Default" preset is automatically seeded with `DEFAULT_CONFIG` and loaded on startup.

## Key Files

- `src/storage/PresetStorage.ts` - Storage service with CRUD operations
- `app/components/modals/ConfigPresetsModal.tsx` - Modal UI for managing presets
- `app/stores/evolutionStore.ts` - State for `loadedPresetId` and `configPresetsModalOpen`
- `app/components/menu/MenuScreen.tsx` - Config button and Save as New Preset UI

## ConfigPreset Schema

```typescript
interface ConfigPreset {
  id: string;           // Unique ID (format: preset_{timestamp}_{counter})
  name: string;         // User-editable display name
  config: SimulationConfig;  // Full simulation configuration
  createdAt: number;    // Unix timestamp
  updatedAt: number;    // Unix timestamp
}
```

## Storage Functions

```typescript
// Get default preset ID (always 'preset_default')
getDefaultPresetId(): string

// Get all presets (auto-seeds default if missing)
getAllPresets(): ConfigPreset[]

// Get single preset
getPresetById(id: string): ConfigPreset | null

// Save new preset
savePreset(name: string, config: SimulationConfig): ConfigPreset

// Update preset name
updatePreset(id: string, updates: { name?: string }): void

// Delete preset
deletePreset(id: string): void

// Check for duplicate config
findDuplicatePreset(config: SimulationConfig): ConfigPreset | null

// Compare two configs
configsEqual(a: SimulationConfig, b: SimulationConfig): boolean
```

## Store State

```typescript
// evolutionStore state
loadedPresetId: string | null;        // ID of currently loaded preset
configPresetsModalOpen: boolean;      // Modal visibility

// Actions
setLoadedPresetId(id: string | null): void;
setConfigPresetsModalOpen(open: boolean): void;
```

## UI Features

1. **Default Preset** - Auto-seeded and loaded on startup
2. **Config Button** - Opens modal showing all saved presets (order: Config | Start | Load Run)
3. **Apply Preset** - Click preset card to apply its config
4. **Save as New Preset** - Only appears when config has deviated from loaded preset
5. **Duplicate Detection** - Error shown if saving identical config
6. **Config Modified Indicator** - Shows when config differs from loaded preset
7. **Inline Rename** - Click preset name to edit

## Browser Console Commands

```javascript
// View all presets
JSON.parse(localStorage.getItem('evolution-lab-presets'))

// Delete all presets
localStorage.removeItem('evolution-lab-presets')

// Export presets to JSON
copy(localStorage.getItem('evolution-lab-presets'))

// Import presets from JSON
localStorage.setItem('evolution-lab-presets', '<paste JSON here>')
```

## Debugging Tips

- Presets are stored as JSON in localStorage (~2KB per preset)
- Config comparison uses sorted JSON keys for order-independent matching
- The `loadedPresetId` tracks which preset is currently active
- Changes to config clear deviation when they match the loaded preset again
