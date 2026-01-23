'use client';

import { useRouter } from 'next/navigation';
import { useEvolutionStore, useConfig } from '../../stores/evolutionStore';
import { useSimulation } from '../../hooks/useSimulation';
import { Button } from '../common/Button';
import { ParamSlider } from './ParamSlider';
import { PreviewCanvas } from './PreviewCanvas';
import { FitnessPanel } from './FitnessPanel';
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
        {/* Main parameter sliders - 4 column grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px 24px',
          marginBottom: '24px'
        }}>
          <ParamSlider
            name="Gravity"
            value={config.gravity}
            displayValue={String(config.gravity)}
            min={-30}
            max={-5}
            step={0.1}
            tooltip={TOOLTIPS.gravity}
            onChange={(v) => setConfig({ gravity: v })}
          />
          <ParamSlider
            name="Mutation Rate"
            value={config.mutationRate * 100}
            displayValue={`${Math.round(config.mutationRate * 100)}%`}
            min={5}
            max={80}
            tooltip={TOOLTIPS.mutationRate}
            onChange={(v) => setConfig({ mutationRate: v / 100 })}
          />
          <ParamSlider
            name="Max Frequency"
            value={config.maxAllowedFrequency}
            displayValue={`${config.maxAllowedFrequency} Hz`}
            min={1}
            max={10}
            step={0.5}
            tooltip={TOOLTIPS.maxAllowedFrequency}
            onChange={(v) => setConfig({ maxAllowedFrequency: v })}
          />
          <ParamSlider
            name="Sim Duration"
            value={config.simulationDuration}
            displayValue={`${config.simulationDuration}s`}
            min={3}
            max={60}
            tooltip={TOOLTIPS.simulationDuration}
            onChange={(v) => setConfig({ simulationDuration: v })}
          />
          <ParamSlider
            name="Physics FPS"
            value={config.physicsFPS}
            displayValue={`${config.physicsFPS}`}
            min={15}
            max={120}
            step={15}
            tooltip={TOOLTIPS.physicsFPS}
            onChange={(v) => setConfig({ physicsFPS: v, timeStep: 1 / v })}
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
          <ParamSlider
            name="Cull %"
            value={config.cullPercentage * 100}
            displayValue={`${Math.round(config.cullPercentage * 100)}%`}
            min={10}
            max={90}
            tooltip={TOOLTIPS.cullPercentage}
            onChange={(v) => setConfig({ cullPercentage: v / 100 })}
          />
        </div>

        {/* Evolution settings row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          marginBottom: '20px',
          padding: '16px',
          background: 'var(--bg-tertiary)',
          borderRadius: '8px',
        }}>
          {/* Evolution mode checkboxes */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={config.useMutation}
                onChange={(e) => {
                  if (!e.target.checked && !config.useCrossover) return;
                  setConfig({ useMutation: e.target.checked });
                }}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              Mutation
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={config.useCrossover}
                onChange={(e) => {
                  if (!e.target.checked && !config.useMutation) return;
                  setConfig({ useCrossover: e.target.checked });
                }}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              Crossover
            </label>
          </div>

          {/* Crossover ratio slider - only shown when both enabled */}
          {config.useMutation && config.useCrossover && (
            <ParamSlider
              name="Cross/Mut Ratio"
              value={config.crossoverRate * 100}
              displayValue={`${Math.round(config.crossoverRate * 100)}/${Math.round(100 - config.crossoverRate * 100)}`}
              min={0}
              max={100}
              tooltip={TOOLTIPS.crossoverRate}
              onChange={(v) => setConfig({ crossoverRate: v / 100 })}
              width="160px"
            />
          )}

          {/* Replay Storage */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Replay:</span>
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
              <option value="all">All</option>
              <option value="sparse">Sparse</option>
              <option value="none">None</option>
            </select>
          </div>
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
      <FitnessPanel />
      <NeuralPanel />

      {/* Load runs modal */}
      <LoadRunsModal />
    </div>
  );
}

export default MenuScreen;
