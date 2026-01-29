'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEvolutionStore, useConfig } from '../../stores/evolutionStore';
import { useSimulation } from '../../hooks/useSimulation';
import { Button } from '../common/Button';
import { ParamSlider } from './ParamSlider';
import { PreviewCanvas } from './PreviewCanvas';
import { ConfigAccordion } from './ConfigAccordion';
import { NeuralPanel } from './NeuralPanel';
import { LoadRunsModal } from '../modals/LoadRunsModal';
import { ConfigPresetsModal } from '../modals/ConfigPresetsModal';
import { TOOLTIPS } from '../ui/InfoTooltip';
import * as PresetStorage from '../../../src/storage/PresetStorage';

/**
 * Main menu screen component.
 * Displays configuration sliders, 3D preview, and start/load buttons.
 */
export function MenuScreen() {
  const router = useRouter();
  const config = useConfig();
  const setConfig = useEvolutionStore((s) => s.setConfig);
  const setLoadModalOpen = useEvolutionStore((s) => s.setLoadModalOpen);
  const setConfigPresetsModalOpen = useEvolutionStore((s) => s.setConfigPresetsModalOpen);
  const loadedPresetId = useEvolutionStore((s) => s.loadedPresetId);
  const setLoadedPresetId = useEvolutionStore((s) => s.setLoadedPresetId);
  const showError = useEvolutionStore((s) => s.showError);
  const menuMountKey = useEvolutionStore((s) => s.menuMountKey);
  const { startSimulation } = useSimulation();
  const [presetName, setPresetName] = useState('');

  // Load default preset on mount if no preset is loaded
  useEffect(() => {
    if (!loadedPresetId) {
      const defaultId = PresetStorage.getDefaultPresetId();
      const defaultPreset = PresetStorage.getPresetById(defaultId);
      if (defaultPreset) {
        setLoadedPresetId(defaultId);
      }
    }
  }, [loadedPresetId, setLoadedPresetId]);

  // Check if config has deviated from loaded preset
  const hasDeviated = useMemo(() => {
    if (!loadedPresetId) return false;
    const preset = PresetStorage.getPresetById(loadedPresetId);
    if (!preset) return false;
    return !PresetStorage.configsEqual(config, preset.config);
  }, [config, loadedPresetId]);

  const handleStart = async () => {
    const result = await startSimulation();
    if (result?.runId) {
      router.push(`/run/${result.runId}`);
    }
  };

  const handleLoadRun = () => {
    setLoadModalOpen(true);
  };

  const handleOpenPresets = () => {
    setConfigPresetsModalOpen(true);
  };

  const handleSavePreset = () => {
    // Check for duplicate
    const duplicate = PresetStorage.findDuplicatePreset(config);
    if (duplicate) {
      showError(`A preset with this configuration already exists: "${duplicate.name || 'Unnamed'}"`);
      return;
    }

    // Save new preset and set it as the loaded preset
    const name = presetName.trim() || `Preset ${new Date().toLocaleDateString()}`;
    const newPreset = PresetStorage.savePreset(name, config);
    setLoadedPresetId(newPreset.id);
    setPresetName('');
  };

  return (
    <div className="menu-screen">
      <h1 className="menu-title">Evolution Lab</h1>
      <p className="menu-subtitle">Watch creatures evolve to collect pellets</p>

      <PreviewCanvas
        config={{
          max_nodes: config.max_nodes,
          max_muscles: config.max_muscles,
          max_allowed_frequency: config.max_allowed_frequency,
          gravity: config.gravity,
        }}
        mountKey={menuMountKey}
      />

      <div className="menu-controls" style={{ maxWidth: '700px', width: '100%' }}>
        {/* Main parameter sliders - 3 column grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px 24px',
          marginBottom: '24px'
        }}>
          <ParamSlider
            name="Population"
            value={config.population_size}
            displayValue={String(config.population_size)}
            min={10}
            max={1000}
            step={10}
            tooltip={TOOLTIPS.populationSize}
            onChange={(v) => setConfig({ population_size: v })}
          />
          <ParamSlider
            name="Max Nodes"
            value={config.max_nodes}
            displayValue={String(config.max_nodes)}
            min={2}
            max={15}
            tooltip={TOOLTIPS.maxNodes}
            onChange={(v) => setConfig({ max_nodes: v })}
          />
          <ParamSlider
            name="Max Muscles"
            value={config.max_muscles}
            displayValue={String(config.max_muscles)}
            min={1}
            max={30}
            tooltip={TOOLTIPS.maxMuscles}
            onChange={(v) => setConfig({ max_muscles: v })}
          />
        </div>

        {/* Replay Storage */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '20px',
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Replay Storage:</span>
          <select
            value={config.frame_storage_mode}
            onChange={(e) => setConfig({ frame_storage_mode: e.target.value as 'none' | 'sparse' | 'all' })}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px 8px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Creatures</option>
            <option value="sparse">Top/Bottom Only</option>
            <option value="none">Disabled</option>
          </select>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button variant="secondary" onClick={handleOpenPresets}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>Config</span>
          </Button>
          <Button variant="primary" onClick={handleStart}>
            <span>Start Evolution</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </Button>
          <Button variant="secondary" onClick={handleLoadRun}>
            <span>Load Run</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
          </Button>
        </div>

        {/* Save as New Preset - only shows when config has deviated from loaded preset */}
        {hasDeviated && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--warning)' }}>
              Config modified
            </span>
            <input
              type="text"
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                width: '140px',
              }}
            />
            <Button
              variant="secondary"
              onClick={handleSavePreset}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              <span>Save as New Preset</span>
            </Button>
          </div>
        )}
      </div>

      {/* Side panels */}
      <ConfigAccordion />
      <NeuralPanel />

      {/* Load runs modal */}
      <LoadRunsModal />

      {/* Config presets modal */}
      <ConfigPresetsModal />
    </div>
  );
}

export default MenuScreen;
