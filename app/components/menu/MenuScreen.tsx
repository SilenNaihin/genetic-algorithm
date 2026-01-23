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
      />

      <div className="menu-controls">
        {/* Main parameter sliders */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px', maxWidth: '450px' }}>
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
            name="Gene Mut. Rate"
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
        </div>

        {/* Cull percentage and evolution mode */}
        <div style={{ marginBottom: '12px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '12px 0' }}>
          <ParamSlider
            name="Cull Percentage"
            value={config.cullPercentage * 100}
            displayValue={`${Math.round(config.cullPercentage * 100)}%`}
            min={10}
            max={90}
            tooltip={TOOLTIPS.cullPercentage}
            onChange={(v) => setConfig({ cullPercentage: v / 100 })}
            width="200px"
          />
          {/* Crossover vs Mutation split slider - only shown when both enabled */}
          {config.useMutation && config.useCrossover && (
            <ParamSlider
              name="Crossover vs Mutation"
              value={config.crossoverRate * 100}
              displayValue={`${Math.round(config.crossoverRate * 100)}/${Math.round(100 - config.crossoverRate * 100)}`}
              min={0}
              max={100}
              tooltip={TOOLTIPS.crossoverRate}
              onChange={(v) => setConfig({ crossoverRate: v / 100 })}
              width="200px"
            />
          )}</div>

          {/* Evolution mode checkboxes */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', margin: '12px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={config.useMutation}
                onChange={(e) => {
                  // Ensure at least one is checked
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
                  // Ensure at least one is checked
                  if (!e.target.checked && !config.useMutation) return;
                  setConfig({ useCrossover: e.target.checked });
                }}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              Crossover
            </label>
          </div>

          
        </div>

        {/* Replay Storage Mode */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Replay Storage:</span>
            <select
              value={config.frameStorageMode}
              onChange={(e) => setConfig({ frameStorageMode: e.target.value as 'none' | 'sparse' | 'all' })}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '4px 8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <option value="all">All (full replays)</option>
              <option value="sparse">Sparse (top/bottom only)</option>
              <option value="none">None (fastest)</option>
            </select>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', opacity: 0.7 }}>
            {config.frameStorageMode === 'all' && 'Store frames for all creatures - slowest but full replay capability'}
            {config.frameStorageMode === 'sparse' && `Store frames for top ${config.sparseTopCount} and bottom ${config.sparseBottomCount} only`}
            {config.frameStorageMode === 'none' && 'No frame storage - fastest simulation but no replays'}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
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
