'use client';

import { useState, useEffect } from 'react';
import { useEvolutionStore, useGeneration } from '../../stores/evolutionStore';
import { Modal } from '../common/Modal';
import { useSimulation } from '../../hooks/useSimulation';

/**
 * Modal for jumping to a specific generation in history.
 * Allows user to input a generation number and navigate to it.
 */
export function GenerationJumpModal() {
  const isOpen = useEvolutionStore((s) => s.generationJumpModalOpen);
  const setIsOpen = useEvolutionStore((s) => s.setGenerationJumpModalOpen);
  const maxGeneration = useEvolutionStore((s) => s.maxGeneration);
  const generation = useGeneration();
  const { viewGeneration } = useSimulation();

  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset input when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setError(null);
    }
  }, [isOpen]);

  const maxAvailable = Math.max(maxGeneration, generation);

  const handleJump = async () => {
    const gen = parseInt(inputValue, 10);

    if (isNaN(gen)) {
      setError('Please enter a valid number');
      return;
    }

    if (gen < 0) {
      setError('Generation cannot be negative');
      return;
    }

    if (gen > maxAvailable) {
      setError(`Generation must be between 0 and ${maxAvailable}`);
      return;
    }

    setError(null);
    setIsOpen(false);
    await viewGeneration(gen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJump();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Jump to Generation" maxWidth="320px">
      <div style={{ padding: '8px 0' }}>
        <div style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          Enter a generation number (0-{maxAvailable})
        </div>

        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Generation number"
          min={0}
          max={maxAvailable}
          autoFocus
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text)',
            outline: 'none',
          }}
        />

        {error && (
          <div style={{
            marginTop: '8px',
            color: 'var(--danger)',
            fontSize: '12px'
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '16px',
          justifyContent: 'flex-end'
        }}>
          <button
            className="btn btn-secondary"
            onClick={handleClose}
            style={{ fontSize: '13px' }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleJump}
            style={{ fontSize: '13px' }}
          >
            Jump
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default GenerationJumpModal;
