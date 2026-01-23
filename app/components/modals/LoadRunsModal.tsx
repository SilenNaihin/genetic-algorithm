'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useEvolutionStore } from '../../stores/evolutionStore';
import { Modal } from '../common/Modal';
import * as StorageService from '../../../src/services/StorageService';
import type { SavedRun } from '../../../src/storage/types';

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
      <div
        id="runs-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          maxHeight: '60vh',
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
          runs.map((run) => (
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

  // Get best fitness from fitness history if available
  const bestFitness =
    run.fitnessHistory && run.fitnessHistory.length > 0
      ? Math.max(...run.fitnessHistory.map((h) => h.best))
      : null;

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
        {bestFitness !== null && <span> | Best: {bestFitness.toFixed(1)}</span>}
      </div>

      {/* Config summary - matches vanilla + duration */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
        Gravity: {run.config.gravity} | Mut: {Math.round((run.config.mutationRate || 0.1) * 100)}% | {run.config.simulationDuration}s
      </div>
    </div>
  );
}

export default LoadRunsModal;
