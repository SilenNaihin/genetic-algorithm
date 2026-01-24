'use client';

import { useEvolutionStore, useConfig } from '../../stores/evolutionStore';
import { Button } from '../common/Button';
import { ParamSlider } from './ParamSlider';
import { DEFAULT_CONFIG } from '../../../src/types/simulation';

/**
 * Fitness function settings panel - fixed right side of menu screen.
 */
export function FitnessPanel() {
  const config = useConfig();
  const setConfig = useEvolutionStore((s) => s.setConfig);

  const handleReset = () => {
    setConfig({
      fitnessPelletPoints: DEFAULT_CONFIG.fitnessPelletPoints,
      fitnessProgressMax: DEFAULT_CONFIG.fitnessProgressMax,
      fitnessDistancePerUnit: DEFAULT_CONFIG.fitnessDistancePerUnit,
      fitnessDistanceTraveledMax: DEFAULT_CONFIG.fitnessDistanceTraveledMax,
      fitnessRegressionPenalty: DEFAULT_CONFIG.fitnessRegressionPenalty,
    });
  };

  return (
    <div
      id="fitness-settings-panel"
      style={{
        position: 'fixed',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        width: '240px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-light)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        Fitness Function
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ marginBottom: '12px' }}>
          <ParamSlider
            name="Pellet Points"
            value={config.fitnessPelletPoints}
            displayValue={String(config.fitnessPelletPoints)}
            min={10}
            max={200}
            hint="Points per pellet collected"
            onChange={(v) => setConfig({ fitnessPelletPoints: v })}
            width="100%"
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <ParamSlider
            name="Progress Max"
            value={config.fitnessProgressMax}
            displayValue={String(config.fitnessProgressMax)}
            min={0}
            max={150}
            hint="Max progress bonus toward pellet"
            onChange={(v) => setConfig({ fitnessProgressMax: v })}
            width="100%"
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <ParamSlider
            name="Distance Per Unit"
            value={config.fitnessDistancePerUnit}
            displayValue={String(config.fitnessDistancePerUnit)}
            min={0}
            max={10}
            hint="Points per unit of distance traveled"
            onChange={(v) => setConfig({ fitnessDistancePerUnit: v })}
            width="100%"
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <ParamSlider
            name="Distance Traveled Max"
            value={config.fitnessDistanceTraveledMax}
            displayValue={String(config.fitnessDistanceTraveledMax)}
            min={0}
            max={50}
            hint="Max bonus for total distance traveled"
            onChange={(v) => setConfig({ fitnessDistanceTraveledMax: v })}
            width="100%"
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <ParamSlider
            name="Regression Penalty"
            value={config.fitnessRegressionPenalty}
            displayValue={String(config.fitnessRegressionPenalty)}
            min={0}
            max={50}
            hint="Penalty for moving away after 1st pellet"
            onChange={(v) => setConfig({ fitnessRegressionPenalty: v })}
            width="100%"
          />
        </div>
        <Button variant="secondary" size="small" onClick={handleReset} style={{ width: '100%' }}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}

export default FitnessPanel;
