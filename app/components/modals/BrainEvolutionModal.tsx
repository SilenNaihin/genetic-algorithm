'use client';

import { useEffect, useRef, useState } from 'react';
import { useEvolutionStore } from '../../stores/evolutionStore';
import { Modal } from '../common/Modal';
import { BrainEvolutionPanel, type BrainEvolutionData } from '../../../src/ui/BrainEvolutionPanel';
import * as StorageService from '../../../src/services/StorageService';
import type { NeuralGenomeData } from '../../../src/neural';

/**
 * Modal for comparing neural network weight evolution between generations.
 * Shows how average weights have changed from Gen 1 to current generation.
 */
export function BrainEvolutionModal() {
  const isOpen = useEvolutionStore((s) => s.brainEvolutionModalOpen);
  const setIsOpen = useEvolutionStore((s) => s.setBrainEvolutionModalOpen);
  const config = useEvolutionStore((s) => s.config);
  const generation = useEvolutionStore((s) => s.generation);
  const simulationResults = useEvolutionStore((s) => s.simulationResults);

  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<BrainEvolutionPanel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize panel when modal opens
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // Create panel
    panelRef.current = new BrainEvolutionPanel(containerRef.current, {
      width: 450,
      height: 350,
    });

    // Load comparison data
    loadComparisonData();

    return () => {
      panelRef.current?.dispose();
      panelRef.current = null;
    };
  }, [isOpen]);

  const loadComparisonData = async () => {
    setLoading(true);
    setError(null);

    try {
      const currentRunId = StorageService.getCurrentRunId();
      if (!currentRunId) {
        setError('No run loaded');
        setLoading(false);
        return;
      }

      // Get current generation's neural genomes
      const currentNeuralGenomes: NeuralGenomeData[] = [];
      for (const result of simulationResults) {
        if (result.genome.neuralGenome && result.genome.controllerType === 'neural') {
          currentNeuralGenomes.push(result.genome.neuralGenome);
        }
      }

      if (currentNeuralGenomes.length === 0) {
        setError('No neural creatures in current generation');
        setLoading(false);
        return;
      }

      // Load gen 1 data (or earliest available)
      const gen1Results = await StorageService.loadGeneration(currentRunId, 1, config);
      if (!gen1Results) {
        // Try gen 0
        const gen0Results = await StorageService.loadGeneration(currentRunId, 0, config);
        if (!gen0Results) {
          setError('Could not load early generation data');
          setLoading(false);
          return;
        }
      }

      const earlyGenResults = gen1Results || await StorageService.loadGeneration(currentRunId, 0, config);
      if (!earlyGenResults) {
        setError('Could not load early generation data');
        setLoading(false);
        return;
      }

      // Get gen 1 neural genomes
      const gen1NeuralGenomes: NeuralGenomeData[] = [];
      for (const result of earlyGenResults) {
        if (result.genome.neuralGenome && result.genome.controllerType === 'neural') {
          gen1NeuralGenomes.push(result.genome.neuralGenome);
        }
      }

      if (gen1NeuralGenomes.length === 0) {
        setError('No neural creatures in early generation');
        setLoading(false);
        return;
      }

      // Compute average weights
      const gen1Weights = BrainEvolutionPanel.computeAverageWeights(gen1NeuralGenomes);
      const currentWeights = BrainEvolutionPanel.computeAverageWeights(currentNeuralGenomes);

      if (!gen1Weights || !currentWeights) {
        setError('Could not compute average weights');
        setLoading(false);
        return;
      }

      // Set data on panel
      const data: BrainEvolutionData = {
        gen1Weights,
        currentWeights,
        topology: currentNeuralGenomes[0].topology,
        gen1Label: 'Gen 1',
        currentLabel: `Gen ${generation}`,
      };

      panelRef.current?.setData(data);
      panelRef.current?.show();
      setLoading(false);
    } catch (err) {
      console.error('Error loading brain comparison data:', err);
      setError('Failed to load comparison data');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Brain Evolution Comparison" maxWidth="500px">
      <div style={{ minHeight: '400px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading comparison data...
          </div>
        )}
        {error && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
            {error}
          </div>
        )}
        <div
          ref={containerRef}
          style={{
            display: loading || error ? 'none' : 'block',
          }}
        />
        {!loading && !error && (
          <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Green connections have strengthened, red connections have weakened since Gen 1
          </div>
        )}
      </div>
    </Modal>
  );
}

export default BrainEvolutionModal;
