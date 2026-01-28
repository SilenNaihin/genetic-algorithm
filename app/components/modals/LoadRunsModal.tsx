'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEvolutionStore } from '../../stores/evolutionStore';
import { Modal } from '../common/Modal';
import * as StorageService from '../../../src/services/StorageService';
import type { SavedRun } from '../../../src/storage/types';

type SortOption = 'date-desc' | 'date-asc' | 'generations' | 'fitness' | 'name';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'generations', label: 'Most Generations' },
  { value: 'fitness', label: 'Best Fitness' },
  { value: 'name', label: 'Name (A-Z)' },
];

/**
 * Modal for loading saved evolution runs.
 * Shows a grid of run cards with name, date, generations, and delete option.
 */
export function LoadRunsModal() {
  const router = useRouter();
  const loadModalOpen = useEvolutionStore((s) => s.loadModalOpen);
  const setLoadModalOpen = useEvolutionStore((s) => s.setLoadModalOpen);

  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Load runs when modal opens
  useEffect(() => {
    if (!loadModalOpen) return;

    const fetchRuns = async () => {
      setLoading(true);
      setError(null);
      try {
        await StorageService.initStorage();
        const allRuns = await StorageService.getAllRuns();
        setRuns(allRuns);
      } catch (err) {
        console.error('Error loading runs:', err);
        setError('Error loading saved runs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, [loadModalOpen]);

  // Sort runs based on selected option
  const sortedRuns = useMemo(() => {
    const getBestFitness = (run: SavedRun) =>
      run.bestCreature?.result?.fitness ?? -Infinity;

    return [...runs].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.startTime - a.startTime;
        case 'date-asc':
          return a.startTime - b.startTime;
        case 'generations':
          return b.generationCount - a.generationCount;
        case 'fitness':
          return getBestFitness(b) - getBestFitness(a);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });
  }, [runs, sortBy]);

  const handleClose = () => {
    setLoadModalOpen(false);
  };

  const handleDeleteRun = async (runId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await StorageService.deleteRun(runId);
      setRuns((prev) => prev.filter((r) => r.id !== runId));
    } catch (err) {
      console.error('Error deleting run:', err);
    }
  };

  const handleLoadRun = (runId: string) => {
    setLoadModalOpen(false);
    router.push(`/run/${runId}`);
  };

  return (
    <Modal isOpen={loadModalOpen} onClose={handleClose} title="Load Saved Run" maxWidth="800px">
      {/* Sort controls */}
      {!loading && !error && runs.length > 1 && (
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
            {runs.length} run{runs.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div
        id="runs-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          maxHeight: '55vh',
          overflowY: 'auto',
          padding: '4px',
        }}
      >
        {loading && (
          <div
            style={{
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '40px',
              gridColumn: '1 / -1',
            }}
          >
            Loading saved runs...
          </div>
        )}

        {error && (
          <div
            style={{
              color: 'var(--danger)',
              textAlign: 'center',
              padding: '40px',
              gridColumn: '1 / -1',
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && runs.length === 0 && (
          <div
            style={{
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '40px',
              gridColumn: '1 / -1',
            }}
          >
            No saved runs found. Start a new evolution to create your first run!
          </div>
        )}

        {!loading &&
          !error &&
          sortedRuns.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              onLoad={() => handleLoadRun(run.id)}
              onDelete={(e) => handleDeleteRun(run.id, e)}
            />
          ))}
      </div>
    </Modal>
  );
}

interface RunCardProps {
  run: SavedRun;
  onLoad: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function RunCard({ run, onLoad, onDelete }: RunCardProps) {
  const [name, setName] = useState(run.name || '');
  const [isHovered, setIsHovered] = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const date = new Date(run.startTime);
  const dateStr =
    date.toLocaleDateString() +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    try {
      await StorageService.updateRunName(run.id, newName);
    } catch (err) {
      console.error('Error updating run name:', err);
    }
  };

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    nameInputRef.current?.focus();
  };

  return (
    <div
      className="run-card"
      onClick={onLoad}
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
        aria-label="Delete run"
      >
        &times;
      </button>

      {/* Editable name - matches vanilla exactly */}
      <input
        ref={nameInputRef}
        type="text"
        value={name}
        onChange={handleNameChange}
        onClick={handleNameClick}
        placeholder="Name this run..."
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

      {/* Gen count and date - single line like vanilla */}
      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        Gen {run.generationCount - 1} | {dateStr}
      </div>

      {/* Config summary - matches vanilla + duration */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
        <span>Gravity: {run.config.gravity} | Mut: {Math.round((run.config.mutation_rate || 0.1) * 100)}%</span>
        <span>
          {run.config.simulation_duration}s
          {run.bestCreature?.result?.fitness != null && (
            <span style={{ color: 'var(--accent)', marginLeft: '6px' }}>
              {run.bestCreature.result.fitness.toFixed(0)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

export default LoadRunsModal;
