'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useEvolutionStore } from '../../stores/evolutionStore';
import { Modal } from '../common/Modal';
import * as PresetStorage from '../../../src/storage/PresetStorage';
import type { ConfigPreset } from '../../../src/storage/PresetStorage';

type SortOption = 'date-desc' | 'date-asc' | 'name';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'name', label: 'Name (A-Z)' },
];

/**
 * Modal for managing configuration presets.
 * Shows a grid of preset cards with name, date, config summary, and delete option.
 */
export function ConfigPresetsModal() {
  const configPresetsModalOpen = useEvolutionStore((s) => s.configPresetsModalOpen);
  const setConfigPresetsModalOpen = useEvolutionStore((s) => s.setConfigPresetsModalOpen);
  const setConfig = useEvolutionStore((s) => s.setConfig);
  const setLoadedPresetId = useEvolutionStore((s) => s.setLoadedPresetId);

  const [presets, setPresets] = useState<ConfigPreset[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Load presets when modal opens
  useEffect(() => {
    if (!configPresetsModalOpen) return;
    setPresets(PresetStorage.getAllPresets());
  }, [configPresetsModalOpen]);

  // Sort presets based on selected option
  const sortedPresets = useMemo(() => {
    return [...presets].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.createdAt - a.createdAt;
        case 'date-asc':
          return a.createdAt - b.createdAt;
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });
  }, [presets, sortBy]);

  const handleClose = () => {
    setConfigPresetsModalOpen(false);
  };

  const handleDeletePreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    PresetStorage.deletePreset(presetId);
    setPresets((prev) => prev.filter((p) => p.id !== presetId));
  };

  const handleApplyPreset = (preset: ConfigPreset) => {
    setConfig(preset.config);
    setLoadedPresetId(preset.id);
    setConfigPresetsModalOpen(false);
  };

  const handleRenamePreset = (presetId: string, newName: string) => {
    PresetStorage.updatePreset(presetId, { name: newName });
    setPresets((prev) =>
      prev.map((p) => (p.id === presetId ? { ...p, name: newName } : p))
    );
  };

  return (
    <Modal isOpen={configPresetsModalOpen} onClose={handleClose} title="Config Presets" maxWidth="800px">
      {/* Sort controls */}
      {presets.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            paddingLeft: '4px',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text)',
              fontSize: '12px',
              padding: '4px 8px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {presets.length} preset{presets.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div
        id="presets-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          maxHeight: '55vh',
          overflowY: 'auto',
          padding: '4px',
        }}
      >
        {presets.length === 0 && (
          <div
            style={{
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '40px',
              gridColumn: '1 / -1',
            }}
          >
            No presets saved yet. Configure your simulation and click &quot;Save as New Preset&quot; to save your first one!
          </div>
        )}

        {sortedPresets.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            onApply={() => handleApplyPreset(preset)}
            onDelete={(e) => handleDeletePreset(preset.id, e)}
            onRename={(newName) => handleRenamePreset(preset.id, newName)}
          />
        ))}
      </div>
    </Modal>
  );
}

interface PresetCardProps {
  preset: ConfigPreset;
  onApply: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onRename: (newName: string) => void;
}

function PresetCard({ preset, onApply, onDelete, onRename }: PresetCardProps) {
  const [name, setName] = useState(preset.name);
  const [isHovered, setIsHovered] = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const date = new Date(preset.createdAt);
  const dateStr = date.toLocaleDateString();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    onRename(newName);
  };

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    nameInputRef.current?.focus();
  };

  // Build config summary
  const config = preset.config;
  const neuralMode = config.use_neural_net
    ? config.neural_mode === 'neat'
      ? 'NEAT'
      : config.neural_mode === 'pure'
        ? 'Pure'
        : 'Hybrid'
    : 'None';

  return (
    <div
      className="preset-card"
      onClick={onApply}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'var(--bg-card)',
        border: '2px solid var(--border)',
        borderColor: isHovered ? 'var(--accent)' : 'var(--border)',
        borderRadius: '12px',
        padding: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Delete button */}
      <button
        onClick={onDelete}
        onMouseEnter={() => setDeleteHovered(true)}
        onMouseLeave={() => setDeleteHovered(false)}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(239, 68, 68, 0.2)',
          border: 'none',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          cursor: 'pointer',
          color: 'var(--danger)',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: deleteHovered ? 1 : 0.6,
          transition: 'opacity 0.2s',
        }}
        aria-label="Delete preset"
      >
        &times;
      </button>

      {/* Editable name */}
      <input
        ref={nameInputRef}
        type="text"
        value={name}
        onChange={handleNameChange}
        onClick={handleNameClick}
        placeholder="Name this preset..."
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid transparent',
          color: 'var(--text)',
          fontSize: '13px',
          fontWeight: 600,
          padding: '2px 0',
          marginBottom: '4px',
          outline: 'none',
          cursor: 'text',
        }}
        onFocus={(e) => {
          e.target.style.borderBottomColor = 'var(--accent)';
        }}
        onBlur={(e) => {
          e.target.style.borderBottomColor = 'transparent';
        }}
      />

      {/* Date */}
      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        {dateStr}
      </div>

      {/* Config summary */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
        <div>Pop: {config.population_size} | {config.max_nodes} nodes | {config.max_muscles} muscles</div>
        <div>Neural: {neuralMode} | {config.simulation_duration}s</div>
      </div>
    </div>
  );
}

export default ConfigPresetsModal;
