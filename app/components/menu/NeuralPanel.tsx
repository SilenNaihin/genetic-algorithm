'use client';

import { useEvolutionStore, useConfig } from '../../stores/evolutionStore';
import { ParamSlider } from './ParamSlider';
import { InfoTooltip, TOOLTIPS } from '../ui/InfoTooltip';

/**
 * Neural network settings panel - fixed left side of menu screen.
 */
export function NeuralPanel() {
  const config = useConfig();
  const setConfig = useEvolutionStore((s) => s.setConfig);

  const selectStyle = {
    width: '100%',
    padding: '8px 12px',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'block' as const,
  };

  const labelStyle = {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    display: 'flex' as const,
    alignItems: 'center' as const,
  };

  return (
    <div
      id="neural-settings-panel"
      style={{
        position: 'fixed',
        top: '50%',
        left: '20px',
        transform: 'translateY(-50%)',
        width: '280px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-light)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Header with toggle */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>Neural Network</span>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.useNeuralNet}
            onChange={(e) => setConfig({ useNeuralNet: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent)' }}
          />
        </label>
      </div>

      {/* Options - only shown when neural net enabled */}
      {config.useNeuralNet && (
        <div style={{ padding: '16px 20px' }}>
          {/* Mode */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={labelStyle}>
                Mode
                <InfoTooltip text={TOOLTIPS.neuralMode} />
              </span>
            </div>
            <select
              value={config.neuralMode}
              onChange={(e) => setConfig({ neuralMode: e.target.value as 'hybrid' | 'pure' })}
              style={selectStyle}
            >
              <option value="hybrid">Hybrid</option>
              <option value="pure">Pure</option>
            </select>
          </div>

          {/* Hidden Size */}
          <div style={{ marginBottom: '16px' }}>
            <ParamSlider
              name="Hidden Size"
              value={config.neuralHiddenSize}
              displayValue={String(config.neuralHiddenSize)}
              min={4}
              max={32}
              step={4}
              onChange={(v) => setConfig({ neuralHiddenSize: v })}
              tooltip={TOOLTIPS.hiddenSize}
              width="100%"
            />
          </div>

          {/* Activation */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={labelStyle}>
                Activation
                <InfoTooltip text={TOOLTIPS.activation} />
              </span>
            </div>
            <select
              value={config.neuralActivation}
              onChange={(e) => setConfig({ neuralActivation: e.target.value as 'tanh' | 'relu' | 'sigmoid' })}
              style={selectStyle}
            >
              <option value="tanh">tanh</option>
              <option value="relu">ReLU</option>
              <option value="sigmoid">sigmoid</option>
            </select>
          </div>

          {/* Weight Mutation Rate */}
          <div style={{ marginBottom: '16px' }}>
            <ParamSlider
              name="Weight Mut. Rate"
              value={config.weightMutationRate * 100}
              displayValue={`${Math.round(config.weightMutationRate * 100)}%`}
              min={1}
              max={50}
              onChange={(v) => setConfig({ weightMutationRate: v / 100 })}
              tooltip={TOOLTIPS.weightMutationRate}
              width="100%"
            />
          </div>

          {/* Rate Decay */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={labelStyle}>
                Rate Decay
                <InfoTooltip text={TOOLTIPS.rateDecay} />
              </span>
            </div>
            <select
              value={config.weightMutationDecay}
              onChange={(e) => setConfig({ weightMutationDecay: e.target.value as 'off' | 'linear' | 'exponential' })}
              style={selectStyle}
            >
              <option value="off">Off</option>
              <option value="linear">Linear</option>
              <option value="exponential">Exponential</option>
            </select>
          </div>

          {/* Weight Mutation Magnitude */}
          <div style={{ marginBottom: '16px' }}>
            <ParamSlider
              name="Weight Mut. Mag"
              value={config.weightMutationMagnitude}
              displayValue={String(config.weightMutationMagnitude)}
              min={0.1}
              max={1.0}
              step={0.1}
              onChange={(v) => setConfig({ weightMutationMagnitude: v })}
              tooltip={TOOLTIPS.weightMutationMagnitude}
              width="100%"
            />
          </div>

          {/* Output Bias (how hard muscles are to activate) */}
          <div style={{ marginBottom: '16px' }}>
            <ParamSlider
              name="Output Bias"
              value={config.neuralOutputBias}
              displayValue={String(config.neuralOutputBias)}
              min={-2}
              max={0}
              step={0.1}
              onChange={(v) => setConfig({ neuralOutputBias: v })}
              tooltip={TOOLTIPS.outputBias}
              width="100%"
            />
          </div>

          {/* Dead Zone - only shown in Pure mode */}
          {config.neuralMode === 'pure' && (
            <div style={{ marginBottom: '16px' }}>
              <ParamSlider
                name="Dead Zone"
                value={config.neuralDeadZone}
                displayValue={String(config.neuralDeadZone)}
                min={0}
                max={0.5}
                step={0.05}
                onChange={(v) => setConfig({ neuralDeadZone: v })}
                tooltip="Outputs with absolute value below this threshold become 0. Higher values make muscles harder to activate, encouraging sparse activation patterns."
                width="100%"
              />
            </div>
          )}

          {/* Efficiency Penalty */}
          <div style={{ marginBottom: '16px' }}>
            <ParamSlider
              name="Efficiency Penalty"
              value={config.fitnessEfficiencyPenalty}
              displayValue={String(config.fitnessEfficiencyPenalty)}
              min={0}
              max={2}
              step={0.1}
              onChange={(v) => setConfig({ fitnessEfficiencyPenalty: v })}
              tooltip={TOOLTIPS.efficiencyPenalty}
              width="100%"
            />
          </div>

          {/* Adaptive Mutation Section */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={labelStyle}>
                Adaptive Mutation
                <InfoTooltip text={TOOLTIPS.adaptiveMutation} />
              </span>
              <input
                type="checkbox"
                checked={config.useAdaptiveMutation}
                onChange={(e) => setConfig({ useAdaptiveMutation: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </div>

            {config.useAdaptiveMutation && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <ParamSlider
                    name="Stagnation Gens"
                    value={config.stagnationThreshold}
                    displayValue={String(config.stagnationThreshold)}
                    min={5}
                    max={50}
                    step={5}
                    onChange={(v) => setConfig({ stagnationThreshold: v })}
                    tooltip={TOOLTIPS.stagnationThreshold}
                    width="100%"
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <ParamSlider
                    name="Boost Multiplier"
                    value={config.adaptiveMutationBoost}
                    displayValue={`${config.adaptiveMutationBoost}x`}
                    min={1.5}
                    max={5}
                    step={0.5}
                    onChange={(v) => setConfig({ adaptiveMutationBoost: v })}
                    tooltip={TOOLTIPS.adaptiveMutationBoost}
                    width="100%"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NeuralPanel;
