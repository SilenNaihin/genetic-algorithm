'use client';

import { useRouter } from 'next/navigation';
import { useEvolutionStore, useConfig } from '../../stores/evolutionStore';
import { useSimulation } from '../../hooks/useSimulation';
import { Button } from '../common/Button';
import { ParamSlider } from './ParamSlider';
import { PreviewCanvas } from './PreviewCanvas';
import { ConfigAccordion } from './ConfigAccordion';
import { NeuralPanel } from './NeuralPanel';
import { LoadRunsModal } from '../modals/LoadRunsModal';
import { TOOLTIPS } from '../ui/InfoTooltip';

/**
 * Main menu screen component.
 * Displays configuration sliders, 3D preview, and start/load buttons.
 */
export function MenuScreen() {
  const router = useRouter();
  const config = useConfig();
  const setConfig = useEvolutionStore((s) => s.setConfig);
  const setLoadModalOpen = useEvolutionStore((s) => s.setLoadModalOpen);
  const menuMountKey = useEvolutionStore((s) => s.menuMountKey);
  const { startSimulation } = useSimulation();

  const handleStart = async () => {
    const result = await startSimulation();
    if (result?.runId) {
      router.push(`/run/${result.runId}`);
    }
  };

  const handleLoadRun = () => {
    setLoadModalOpen(true);
  };

  return (
    <div className="menu-screen">
      <h1 className="menu-title">Evolution Lab</h1>
      <p className="menu-subtitle">Watch creatures evolve to collect pellets</p>

      <PreviewCanvas
        config={{
          maxNodes: config.maxNodes,
          maxMuscles: config.maxMuscles,
          maxAllowedFrequency: config.maxAllowedFrequency,
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
            value={config.populationSize}
            displayValue={String(config.populationSize)}
            min={10}
            max={1000}
            step={10}
            tooltip={TOOLTIPS.populationSize}
            onChange={(v) => setConfig({ populationSize: v })}
          />
          <ParamSlider
            name="Max Nodes"
            value={config.maxNodes}
            displayValue={String(config.maxNodes)}
            min={2}
            max={15}
            tooltip={TOOLTIPS.maxNodes}
            onChange={(v) => setConfig({ maxNodes: v })}
          />
          <ParamSlider
            name="Max Muscles"
            value={config.maxMuscles}
            displayValue={String(config.maxMuscles)}
            min={1}
            max={30}
            tooltip={TOOLTIPS.maxMuscles}
            onChange={(v) => setConfig({ maxMuscles: v })}
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
            value={config.frameStorageMode}
            onChange={(e) => setConfig({ frameStorageMode: e.target.value as 'none' | 'sparse' | 'all' })}
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
      </div>

      {/* Side panels */}
      <ConfigAccordion />
      <NeuralPanel />

      {/* Load runs modal */}
      <LoadRunsModal />
    </div>
  );
}

export default MenuScreen;
