'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEvolutionStore } from '../../stores/evolutionStore';
import { useSimulation } from '../../hooks/useSimulation';
import { GridView } from '../../components/grid';
import { Notification } from '../../components/ui/Notification';

/**
 * Dynamic route page for loading a specific run.
 * URL: /run/[runId]
 */
export default function RunPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.runId as string;

  const appState = useEvolutionStore((s) => s.appState);
  const showError = useEvolutionStore((s) => s.showError);
  const { loadRun } = useSimulation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load the run when the page mounts
  useEffect(() => {
    if (!runId) {
      setError('No run ID provided');
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

  // If we're on the menu state, redirect to /menu
  useEffect(() => {
    if (!loading && appState === 'menu') {
      router.push('/menu');
    }
  }, [loading, appState, router]);

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
          onClick={() => router.push('/menu')}
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
