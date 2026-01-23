'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEvolutionStore } from '../../stores/evolutionStore';
import { useSimulation } from '../../hooks/useSimulation';
import { GridView } from '../../components/grid';
import { Notification } from '../../components/ui/Notification';
import * as StorageService from '../../../src/services/StorageService';
import * as SimulationService from '../../../src/services/SimulationService';

/**
 * Dynamic route page for loading a specific run.
 * URL: /run/[runId]
 */
export default function RunPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.runId as string;

  const showError = useEvolutionStore((s) => s.showError);
  const { loadRun } = useSimulation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check backend connection on startup
  useEffect(() => {
    SimulationService.checkBackendConnection();
  }, []);

  // Load the run when the page mounts
  useEffect(() => {
    if (!runId) {
      setError('No run ID provided');
      setLoading(false);
      return;
    }

    // Check if data is already loaded for this run (e.g., after startSimulation)
    const currentRunId = StorageService.getCurrentRunId();
    const simulationResults = useEvolutionStore.getState().simulationResults;

    if (currentRunId === runId && simulationResults.length > 0) {
      // Data already in memory from startSimulation, no need to reload
      console.log('[RunPage] Data already in memory, skipping reload');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        await loadRun(runId);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load run:', err);
        setError('Failed to load run');
        showError('Failed to load run');
        setLoading(false);
      }
    };

    load();
  }, [runId, loadRun, showError]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontSize: '18px',
        }}
      >
        Loading run...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          gap: '16px',
        }}
      >
        <div style={{ color: 'var(--danger)', fontSize: '18px' }}>{error}</div>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '8px 16px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Go to Menu
        </button>
      </div>
    );
  }

  return (
    <>
      <GridView />
      <Notification />
    </>
  );
}
