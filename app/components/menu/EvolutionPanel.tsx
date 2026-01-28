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
              config.selection_method === 'truncation' ? TOOLTIPS.selectionTruncation :
              config.selection_method === 'tournament' ? TOOLTIPS.selectionTournament :
              config.selection_method === 'speciation' ? TOOLTIPS.selectionSpeciation :
              TOOLTIPS.selectionRank
            }
            width={280}
          />
        </div>
        <select
          value={config.selection_method}
          onChange={(e) => setConfig({ selection_method: e.target.value as 'truncation' | 'tournament' | 'rank' | 'speciation' })}
          style={selectStyle}
          disabled={config.neural_mode === 'neat'}  // NEAT requires speciation
        >
          <option value="rank">Rank</option>
          <option value="tournament">Tournament</option>
          <option value="truncation">Truncation</option>
          <option value="speciation">Speciation</option>
        </select>
        {config.neural_mode === 'neat' && (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
            NEAT mode requires speciation selection
          </div>
        )}
      </div>

      {/* Tournament size - only shown when tournament selected */}
      {config.selection_method === 'tournament' && (
        <div style={{ marginBottom: '16px' }}>
          <ParamSlider
            name="Tournament Size"
            value={config.tournament_size}
            displayValue={String(config.tournament_size)}
            min={2}
            max={10}
            step={1}
            tooltip={TOOLTIPS.tournamentSize}
            onChange={(v) => setConfig({ tournament_size: v })}
            width="100%"
          />
        </div>
      )}

      {/* Cull Percentage */}
      <div style={{ marginBottom: '16px' }}>
        <ParamSlider
          name="Cull %"
          value={config.cull_percentage * 100}
          displayValue={`${Math.round(config.cull_percentage * 100)}%`}
          min={10}
          max={90}
          tooltip={TOOLTIPS.cullPercentage}
          onChange={(v) => setConfig({ cull_percentage: v / 100 })}
          width="100%"
        />
      </div>

      {/* Mutation Section */}
      <div style={sectionStyle}>Mutation</div>

      {/* Mutation rate/magnitude always visible - used by both crossover and clone paths */}
      <div style={{ marginBottom: '16px' }}>
        <ParamSlider
          name="Mutation Rate"
          value={config.mutation_rate * 100}
          displayValue={`${Math.round(config.mutation_rate * 100)}%`}
          min={5}
          max={80}
          tooltip={TOOLTIPS.mutationRate}
          onChange={(v) => setConfig({ mutation_rate: v / 100 })}
          width="100%"
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <ParamSlider
          name="Mutation Magnitude"
          value={config.mutation_magnitude}
          displayValue={config.mutation_magnitude.toFixed(1)}
          min={0.1}
          max={1.0}
          step={0.1}
          tooltip={TOOLTIPS.mutationMagnitude}
          onChange={(v) => setConfig({ mutation_magnitude: v })}
          width="100%"
        />
      </div>

      {/* Breeding Mode */}
      <div style={sectionStyle}>Breeding</div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={!config.use_crossover}
            onChange={(e) => {
              if (e.target.checked) {
                setConfig({ use_crossover: false });
              }
            }}
            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
          />
          Clone + Mutation
          <InfoTooltip text="Clone a parent and apply mutations. Simpler than crossover." />
        </label>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={config.use_crossover}
            onChange={(e) => {
              if (e.target.checked) {
                setConfig({ use_crossover: true });
              }
            }}
            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
          />
          Crossover + Mutation
          <InfoTooltip text="Combine two parents then mutate. More exploration than cloning." />
        </label>
      </div>

      {config.use_crossover && (
        <>
          {/* Crossover method - only for fixed-topology neural networks (not NEAT) */}
          {config.use_neural_net && config.neural_mode !== 'neat' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <div style={labelStyle}>
                  Method
                  <InfoTooltip text={
                    config.neural_crossover_method === 'sbx' ? TOOLTIPS.crossoverSbx :
                    config.neural_crossover_method === 'uniform' ? TOOLTIPS.crossoverUniform :
                    TOOLTIPS.crossoverInterpolation
                  } />
                </div>
                <select
                  value={config.neural_crossover_method}
                  onChange={(e) => setConfig({ neural_crossover_method: e.target.value as 'interpolation' | 'uniform' | 'sbx' })}
                  style={selectStyle}
                >
                  <option value="sbx">SBX</option>
                  <option value="interpolation">Interpolation</option>
                  <option value="uniform">Uniform</option>
                </select>
              </div>

              {config.neural_crossover_method === 'sbx' && (
                <div style={{ marginBottom: '16px' }}>
                  <ParamSlider
                    name="SBX Eta"
                    value={config.sbx_eta}
                    displayValue={`${config.sbx_eta} ${config.sbx_eta <= 1 ? '(explore)' : config.sbx_eta >= 4 ? '(exploit)' : ''}`}
                    min={0.5}
                    max={5}
                    step={0.5}
                    tooltip={TOOLTIPS.sbxEta}
                    onChange={(v) => setConfig({ sbx_eta: v })}
                    width="100%"
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Diversity Section */}
      <div style={sectionStyle}>
        Diversity
        {config.neural_mode === 'neat' && (
          <span style={{ marginLeft: '8px', fontSize: '10px', color: 'var(--accent)', fontWeight: 'normal' }}>
            (NEAT mode)
          </span>
        )}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: config.neural_mode === 'neat' ? 'not-allowed' : 'pointer',
          color: config.neural_mode === 'neat' ? 'var(--text-muted)' : 'var(--text-primary)',
          fontSize: '13px',
        }}>
          <input
            type="checkbox"
            checked={config.use_fitness_sharing}
            disabled={config.neural_mode === 'neat'}
            onChange={(e) => setConfig({ use_fitness_sharing: e.target.checked })}
            style={{ width: '16px', height: '16px', cursor: config.neural_mode === 'neat' ? 'not-allowed' : 'pointer', accentColor: 'var(--accent)' }}
          />
          Fitness Sharing
          <InfoTooltip
            text={config.neural_mode === 'neat'
              ? "Disabled in NEAT mode (redundant with speciation)"
              : TOOLTIPS.fitnessSharing}
            width={280}
          />
        </label>
      </div>

      {config.use_fitness_sharing && config.neural_mode !== 'neat' && (
        <div style={{ marginBottom: '16px' }}>
          <ParamSlider
            name="Sharing Radius"
            value={config.sharing_radius}
            displayValue={`${config.sharing_radius.toFixed(1)} ${config.sharing_radius <= 0.3 ? '(narrow)' : config.sharing_radius >= 1.0 ? '(wide)' : ''}`}
            min={0.1}
            max={2.0}
            step={0.1}
            tooltip={TOOLTIPS.sharingRadius}
            onChange={(v) => setConfig({ sharing_radius: v })}
            width="100%"
          />
        </div>
      )}

      {/* Compatibility threshold - only shown when speciation selected */}
      {config.selection_method === 'speciation' && (
        <div style={{ marginBottom: '4px' }}>
          <ParamSlider
            name="Compatibility"
            value={config.compatibility_threshold}
            displayValue={`${config.compatibility_threshold.toFixed(1)} ${config.compatibility_threshold <= 0.5 ? '(many species)' : config.compatibility_threshold >= 2.0 ? '(few species)' : ''}`}
            min={0.1}
            max={3.0}
            step={0.1}
            tooltip={TOOLTIPS.compatibilityThreshold}
            onChange={(v) => setConfig({ compatibility_threshold: v })}
            width="100%"
          />
        </div>
      )}
    </div>
  );
}

export default EvolutionPanel;
