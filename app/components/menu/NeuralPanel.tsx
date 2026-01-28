'use client';

import { useEffect } from 'react';
import { useEvolutionStore, useConfig } from '../../stores/evolutionStore';
import { ParamSlider } from './ParamSlider';
import { InfoTooltip, TOOLTIPS } from '../ui/InfoTooltip';

/**
 * Neural network settings panel - fixed left side of menu screen.
 */
export function NeuralPanel() {
  const config = useConfig();
  const setConfig = useEvolutionStore((s) => s.setConfig);

  // ENFORCE NEAT defaults whenever neuralMode is 'neat'
  // These settings are REQUIRED for NEAT topology evolution to work
  useEffect(() => {
    if (config.neuralMode === 'neat') {
      const needsUpdate =
        !config.useSpeciation ||  // Speciation is REQUIRED
        config.useFitnessSharing;  // Should be off (redundant with speciation)

      if (needsUpdate) {
        setConfig({
          useSpeciation: true,
          useFitnessSharing: false,
        });
      }
    }
  }, [config.neuralMode, config.useSpeciation, config.useFitnessSharing, setConfig]);

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
              onChange={(e) => {
                const newMode = e.target.value as 'hybrid' | 'pure' | 'neat';
                // Auto-switch defaults when mode changes
                if (newMode === 'neat') {
                  // NEAT mode: enable speciation, disable fitness sharing, use bias node
                  setConfig({
                    neuralMode: newMode,
                    useSpeciation: true,
                    useFitnessSharing: false,
                    biasMode: 'bias_node',  // Original NEAT style
                  });
                } else if (newMode === 'hybrid') {
                  setConfig({ neuralMode: newMode, timeEncoding: 'cyclic', biasMode: 'node' });
                } else {
                  setConfig({ neuralMode: newMode, timeEncoding: 'none', biasMode: 'node' });
                }
              }}
              style={selectStyle}
            >
              <option value="hybrid">Hybrid</option>
              <option value="pure">Pure</option>
              <option value="neat">NEAT</option>
            </select>
          </div>

          {/* Time Encoding - available for all modes */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={labelStyle}>
                Time Encoding
                <InfoTooltip text={TOOLTIPS.timeEncoding} />
              </span>
            </div>
            <select
              value={config.timeEncoding}
              onChange={(e) => setConfig({ timeEncoding: e.target.value as 'none' | 'cyclic' | 'sin' | 'raw' | 'sin_raw' })}
              style={selectStyle}
            >
              <option value="none">None (7 inputs)</option>
              <option value="cyclic">Cyclic (9 inputs)</option>
              <option value="sin">Sin (8 inputs)</option>
              <option value="raw">Raw (8 inputs)</option>
              <option value="sin_raw">Sin+Raw (9 inputs)</option>
            </select>
          </div>

          {/* Hidden Size - hide when NEAT mode is enabled (topology is variable) */}
          {config.neuralMode !== 'neat' && (
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
          )}

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

          {/* Bias Mode */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={labelStyle}>
                Bias Mode
                <InfoTooltip text={
                  config.biasMode === 'none'
                    ? "No biases - neurons have no bias terms"
                    : config.biasMode === 'node'
                    ? "Per-node biases - each neuron has its own bias value"
                    : "Bias node - a special input always=1.0, connections from it act as biases (original NEAT style)"
                } />
              </span>
            </div>
            <select
              value={config.biasMode}
              onChange={(e) => setConfig({ biasMode: e.target.value as 'none' | 'node' | 'bias_node' })}
              style={selectStyle}
            >
              <option value="node">Per-Node Biases</option>
              <option value="bias_node">Bias Node (NEAT style)</option>
              <option value="none">No Biases</option>
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

          {/* Dead Zone - shown in Pure and NEAT modes */}
          {(config.neuralMode === 'pure' || config.neuralMode === 'neat') && (
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
                    name="Window Size"
                    value={config.stagnationThreshold}
                    displayValue={`${config.stagnationThreshold} gens`}
                    min={10}
                    max={50}
                    step={5}
                    onChange={(v) => setConfig({ stagnationThreshold: v })}
                    tooltip={TOOLTIPS.stagnationThreshold}
                    width="100%"
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <ParamSlider
                    name="Boost Factor"
                    value={config.adaptiveMutationBoost}
                    displayValue={`${config.adaptiveMutationBoost}x`}
                    min={1.5}
                    max={4}
                    step={0.5}
                    onChange={(v) => setConfig({ adaptiveMutationBoost: v })}
                    tooltip={TOOLTIPS.adaptiveMutationBoost}
                    width="100%"
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <ParamSlider
                    name="Max Boost"
                    value={config.maxAdaptiveBoost}
                    displayValue={`${config.maxAdaptiveBoost}x`}
                    min={2}
                    max={16}
                    step={2}
                    onChange={(v) => setConfig({ maxAdaptiveBoost: v })}
                    tooltip={TOOLTIPS.maxAdaptiveBoost}
                    width="100%"
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <ParamSlider
                    name="Improve Threshold"
                    value={config.improvementThreshold}
                    displayValue={`${config.improvementThreshold} pts`}
                    min={1}
                    max={20}
                    step={1}
                    onChange={(v) => setConfig({ improvementThreshold: v })}
                    tooltip={TOOLTIPS.improvementThreshold}
                    width="100%"
                  />
                </div>
              </>
            )}
          </div>

          {/* Proprioception Section (Experimental) */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={labelStyle}>
                Proprioception
                <InfoTooltip text={TOOLTIPS.proprioception} />
              </span>
              <input
                type="checkbox"
                checked={config.useProprioception}
                onChange={(e) => setConfig({ useProprioception: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </div>

            {config.useProprioception && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={labelStyle}>
                    Inputs
                    <InfoTooltip text={TOOLTIPS.proprioceptionInputs} />
                  </span>
                </div>
                <select
                  value={config.proprioceptionInputs}
                  onChange={(e) => setConfig({ proprioceptionInputs: e.target.value as 'strain' | 'velocity' | 'ground' | 'all' })}
                  style={selectStyle}
                >
                  <option value="all">All (strain + velocity + ground)</option>
                  <option value="strain">Muscle Strain (per muscle)</option>
                  <option value="velocity">Node Velocities (3 per node)</option>
                  <option value="ground">Ground Contact (per node)</option>
                </select>
              </div>
            )}
          </div>

          {/* NEAT Settings (shown when mode is 'neat') */}
          {config.neuralMode === 'neat' && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={labelStyle}>
                  NEAT Topology
                  <InfoTooltip text={TOOLTIPS.neat} />
                </span>
              </div>

              {/* Initial Connectivity */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={labelStyle}>
                    Initial Connectivity
                    <InfoTooltip text={TOOLTIPS.neatInitialConnectivity} />
                  </span>
                </div>
                <select
                  value={config.neatInitialConnectivity}
                  onChange={(e) => setConfig({ neatInitialConnectivity: e.target.value as 'full' | 'sparse_inputs' | 'sparse_outputs' | 'none' })}
                  style={selectStyle}
                >
                  <option value="full">Full (all inputs → all outputs)</option>
                  <option value="sparse_inputs">Sparse Inputs (1 output per input)</option>
                  <option value="sparse_outputs">Sparse Outputs (1 input per output)</option>
                  <option value="none">None (start empty)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <ParamSlider
                  name="Add Connection %"
                  value={config.neatAddConnectionRate * 100}
                  displayValue={`${Math.round(config.neatAddConnectionRate * 100)}%`}
                  min={1}
                  max={20}
                  step={1}
                  onChange={(v) => setConfig({ neatAddConnectionRate: v / 100 })}
                  tooltip={TOOLTIPS.neatAddConnectionRate}
                  width="100%"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <ParamSlider
                  name="Add Node %"
                  value={config.neatAddNodeRate * 100}
                  displayValue={`${Math.round(config.neatAddNodeRate * 100)}%`}
                  min={1}
                  max={10}
                  step={1}
                  onChange={(v) => setConfig({ neatAddNodeRate: v / 100 })}
                  tooltip={TOOLTIPS.neatAddNodeRate}
                  width="100%"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <ParamSlider
                  name="Max Hidden Nodes"
                  value={config.neatMaxHiddenNodes}
                  displayValue={String(config.neatMaxHiddenNodes)}
                  min={4}
                  max={64}
                  step={4}
                  onChange={(v) => setConfig({ neatMaxHiddenNodes: v })}
                  tooltip={TOOLTIPS.neatMaxHiddenNodes}
                  width="100%"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <ParamSlider
                  name="Enable Conn %"
                  value={config.neatEnableRate * 100}
                  displayValue={`${Math.round(config.neatEnableRate * 100)}%`}
                  min={0}
                  max={10}
                  step={1}
                  onChange={(v) => setConfig({ neatEnableRate: v / 100 })}
                  tooltip={TOOLTIPS.neatEnableRate}
                  width="100%"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <ParamSlider
                  name="Disable Conn %"
                  value={config.neatDisableRate * 100}
                  displayValue={`${Math.round(config.neatDisableRate * 100)}%`}
                  min={0}
                  max={10}
                  step={1}
                  onChange={(v) => setConfig({ neatDisableRate: v / 100 })}
                  tooltip={TOOLTIPS.neatDisableRate}
                  width="100%"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NeuralPanel;
