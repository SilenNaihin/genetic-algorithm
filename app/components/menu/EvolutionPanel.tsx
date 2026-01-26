'use client';

import { useEvolutionStore, useConfig } from '../../stores/evolutionStore';
import { ParamSlider } from './ParamSlider';
import { InfoTooltip, TOOLTIPS } from '../ui/InfoTooltip';

/**
 * Evolution settings panel content - used inside CollapsibleAccordion.
 * Contains selection, mutation, crossover, and diversity settings.
 */
export function EvolutionPanel() {
  const config = useConfig();
  const setConfig = useEvolutionStore((s) => s.setConfig);

  const selectStyle = {
    width: '100%',
    padding: '6px 8px',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  };

  const labelStyle = {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginBottom: '4px',
    display: 'flex' as const,
    alignItems: 'center' as const,
  };

  const sectionStyle = {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '12px',
    paddingTop: '8px',
    borderTop: '1px solid var(--border)',
  };

  return (
    <div style={{ paddingTop: '12px' }}>
      {/* Selection */}
      <div style={{ marginBottom: '16px' }}>
        <div style={labelStyle}>
          Selection
          <InfoTooltip
            text={
              config.selectionMethod === 'truncation' ? TOOLTIPS.selectionTruncation :
              config.selectionMethod === 'tournament' ? TOOLTIPS.selectionTournament :
              TOOLTIPS.selectionRank
            }
            width={280}
          />
        </div>
        <select
          value={config.selectionMethod}
          onChange={(e) => setConfig({ selectionMethod: e.target.value as 'truncation' | 'tournament' | 'rank' })}
          style={selectStyle}
        >
          <option value="rank">Rank</option>
          <option value="tournament">Tournament</option>
          <option value="truncation">Truncation</option>
        </select>
      </div>

      {/* Tournament size - only shown when tournament selected */}
      {config.selectionMethod === 'tournament' && (
        <div style={{ marginBottom: '16px' }}>
          <ParamSlider
            name="Tournament Size"
            value={config.tournamentSize}
            displayValue={String(config.tournamentSize)}
            min={2}
            max={10}
            step={1}
            tooltip={TOOLTIPS.tournamentSize}
            onChange={(v) => setConfig({ tournamentSize: v })}
            width="100%"
          />
        </div>
      )}

      {/* Cull Percentage */}
      <div style={{ marginBottom: '16px' }}>
        <ParamSlider
          name="Cull %"
          value={config.cullPercentage * 100}
          displayValue={`${Math.round(config.cullPercentage * 100)}%`}
          min={10}
          max={90}
          tooltip={TOOLTIPS.cullPercentage}
          onChange={(v) => setConfig({ cullPercentage: v / 100 })}
          width="100%"
        />
      </div>

      {/* Mutation Section */}
      <div style={sectionStyle}>Mutation</div>

      <div style={{ marginBottom: '12px' }}>
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
          Enable Mutation
        </label>
      </div>

      {config.useMutation && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <ParamSlider
              name="Mutation Rate"
              value={config.mutationRate * 100}
              displayValue={`${Math.round(config.mutationRate * 100)}%`}
              min={5}
              max={80}
              tooltip={TOOLTIPS.mutationRate}
              onChange={(v) => setConfig({ mutationRate: v / 100 })}
              width="100%"
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <ParamSlider
              name="Mutation Magnitude"
              value={config.mutationMagnitude}
              displayValue={config.mutationMagnitude.toFixed(1)}
              min={0.1}
              max={1.0}
              step={0.1}
              tooltip={TOOLTIPS.mutationMagnitude}
              onChange={(v) => setConfig({ mutationMagnitude: v })}
              width="100%"
            />
          </div>
        </>
      )}

      {/* Crossover Section */}
      <div style={sectionStyle}>Crossover</div>

      <div style={{ marginBottom: '12px' }}>
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
          Enable Crossover
        </label>
      </div>

      {config.useCrossover && (
        <>
          {/* Cross/Mut Ratio - only when both enabled */}
          {config.useMutation && (
            <div style={{ marginBottom: '16px' }}>
              <ParamSlider
                name="Cross/Mut Ratio"
                value={config.crossoverRate * 100}
                displayValue={`${Math.round(config.crossoverRate * 100)}/${Math.round(100 - config.crossoverRate * 100)}`}
                min={0}
                max={100}
                tooltip={TOOLTIPS.crossoverRate}
                onChange={(v) => setConfig({ crossoverRate: v / 100 })}
                width="100%"
              />
            </div>
          )}

          {/* Crossover method - only for neural */}
          {config.useNeuralNet && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <div style={labelStyle}>
                  Method
                  <InfoTooltip text={
                    config.neuralCrossoverMethod === 'sbx' ? TOOLTIPS.crossoverSbx :
                    config.neuralCrossoverMethod === 'uniform' ? TOOLTIPS.crossoverUniform :
                    TOOLTIPS.crossoverInterpolation
                  } />
                </div>
                <select
                  value={config.neuralCrossoverMethod}
                  onChange={(e) => setConfig({ neuralCrossoverMethod: e.target.value as 'interpolation' | 'uniform' | 'sbx' })}
                  style={selectStyle}
                >
                  <option value="sbx">SBX</option>
                  <option value="interpolation">Interpolation</option>
                  <option value="uniform">Uniform</option>
                </select>
              </div>

              {config.neuralCrossoverMethod === 'sbx' && (
                <div style={{ marginBottom: '16px' }}>
                  <ParamSlider
                    name="SBX Eta"
                    value={config.sbxEta}
                    displayValue={`${config.sbxEta} ${config.sbxEta <= 1 ? '(explore)' : config.sbxEta >= 4 ? '(exploit)' : ''}`}
                    min={0.5}
                    max={5}
                    step={0.5}
                    tooltip={TOOLTIPS.sbxEta}
                    onChange={(v) => setConfig({ sbxEta: v })}
                    width="100%"
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Diversity Section */}
      <div style={sectionStyle}>Diversity</div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={config.useFitnessSharing}
            onChange={(e) => setConfig({ useFitnessSharing: e.target.checked })}
            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
          />
          Fitness Sharing
          <InfoTooltip text={TOOLTIPS.fitnessSharing} width={280} />
        </label>
      </div>

      {config.useFitnessSharing && (
        <div style={{ marginBottom: '16px' }}>
          <ParamSlider
            name="Sharing Radius"
            value={config.sharingRadius}
            displayValue={`${config.sharingRadius.toFixed(1)} ${config.sharingRadius <= 0.3 ? '(narrow)' : config.sharingRadius >= 1.0 ? '(wide)' : ''}`}
            min={0.1}
            max={2.0}
            step={0.1}
            tooltip={TOOLTIPS.sharingRadius}
            onChange={(v) => setConfig({ sharingRadius: v })}
            width="100%"
          />
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={config.useSpeciation}
            onChange={(e) => setConfig({ useSpeciation: e.target.checked })}
            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
          />
          Speciation
          <InfoTooltip text={TOOLTIPS.speciation} width={280} />
        </label>
      </div>

      {config.useSpeciation && (
        <div style={{ marginBottom: '4px' }}>
          <ParamSlider
            name="Compatibility"
            value={config.compatibilityThreshold}
            displayValue={`${config.compatibilityThreshold.toFixed(1)} ${config.compatibilityThreshold <= 0.5 ? '(many)' : config.compatibilityThreshold >= 2.0 ? '(few)' : ''}`}
            min={0.1}
            max={3.0}
            step={0.1}
            tooltip={TOOLTIPS.compatibilityThreshold}
            onChange={(v) => setConfig({ compatibilityThreshold: v })}
            width="100%"
          />
        </div>
      )}
    </div>
  );
}

export default EvolutionPanel;
