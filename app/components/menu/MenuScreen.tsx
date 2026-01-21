'use client';

import { useEvolutionStore, useConfig } from '../../stores/evolutionStore';
import { useSimulation } from '../../hooks/useSimulation';
import { Button } from '../common/Button';
import { ParamSlider } from './ParamSlider';
import { PreviewCanvas } from './PreviewCanvas';
import { FitnessPanel } from './FitnessPanel';
import { NeuralPanel } from './NeuralPanel';
import { LoadRunsModal } from '../modals/LoadRunsModal';

/**
 * Main menu screen component.
 * Displays configuration sliders, 3D preview, and start/load buttons.
 */
export function MenuScreen() {
  const config = useConfig();
  const setConfig = useEvolutionStore((s) => s.setConfig);
  const setLoadModalOpen = useEvolutionStore((s) => s.setLoadModalOpen);
  const { startSimulation } = useSimulation();

  const handleStart = async () => {
    await startSimulation();
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', maxWidth: '450px' }}>
          <ParamSlider
            name="Gravity"
            value={config.gravity}
            displayValue={String(config.gravity)}
            min={-30}
            max={-5}
            step={0.1}
            onChange={(v) => setConfig({ gravity: v })}
          />
          <ParamSlider
            name="Gene Mut. Rate"
            value={config.mutationRate * 100}
            displayValue={`${Math.round(config.mutationRate * 100)}%`}
            min={5}
            max={80}
            hint="Per-gene change probability"
            onChange={(v) => setConfig({ mutationRate: v / 100 })}
          />
          <ParamSlider
            name="Max Frequency"
            value={config.maxAllowedFrequency}
            displayValue={`${config.maxAllowedFrequency} Hz`}
            min={1}
            max={10}
            step={0.5}
            onChange={(v) => setConfig({ maxAllowedFrequency: v })}
          />
          <ParamSlider
            name="Sim Duration"
            value={config.simulationDuration}
            displayValue={`${config.simulationDuration}s`}
            min={3}
            max={20}
            onChange={(v) => setConfig({ simulationDuration: v })}
          />
          <ParamSlider
            name="Max Nodes"
            value={config.maxNodes}
            displayValue={String(config.maxNodes)}
            min={2}
            max={15}
            onChange={(v) => setConfig({ maxNodes: v })}
          />
          <ParamSlider
            name="Max Muscles"
            value={config.maxMuscles}
            displayValue={String(config.maxMuscles)}
            min={1}
            max={30}
            onChange={(v) => setConfig({ maxMuscles: v })}
          />
        </div>

        {/* Cull percentage and evolution mode */}
        <div style={{ marginBottom: '12px', textAlign: 'center' }}>
          <ParamSlider
            name="Cull Percentage"
            value={config.cullPercentage * 100}
            displayValue={`${Math.round(config.cullPercentage * 100)}%`}
            min={10}
            max={90}
            hint="Bottom % removed each gen"
            onChange={(v) => setConfig({ cullPercentage: v / 100 })}
            width="200px"
          />

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

          {/* Crossover vs Mutation split slider - only shown when both enabled */}
          {config.useMutation && config.useCrossover && (
            <ParamSlider
              name="Crossover vs Mutation"
              value={config.crossoverRate * 100}
              displayValue={`${Math.round(config.crossoverRate * 100)}/${Math.round(100 - config.crossoverRate * 100)}`}
              min={0}
              max={100}
              hint="Crossover <- -> Mutation"
              onChange={(v) => setConfig({ crossoverRate: v / 100 })}
              width="200px"
            />
          )}
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
