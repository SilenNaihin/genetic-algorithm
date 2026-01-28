'use client';

import { useEvolutionStore, useConfig } from '../../stores/evolutionStore';
import { Button } from '../common/Button';
import { ParamSlider } from './ParamSlider';
import { DEFAULT_CONFIG } from '../../../src/types/simulation';

/**
 * Fitness function settings panel content - used inside CollapsibleAccordion.
 */
export function FitnessPanelContent() {
  const config = useConfig();
  const setConfig = useEvolutionStore((s) => s.setConfig);

  const handleReset = () => {
    setConfig({
      fitness_pellet_points: DEFAULT_CONFIG.fitness_pellet_points,
      fitness_progress_max: DEFAULT_CONFIG.fitness_progress_max,
      fitness_distance_per_unit: DEFAULT_CONFIG.fitness_distance_per_unit,
      fitness_distance_traveled_max: DEFAULT_CONFIG.fitness_distance_traveled_max,
      fitness_regression_penalty: DEFAULT_CONFIG.fitness_regression_penalty,
    });
  };

  return (
    <div style={{ paddingTop: '12px' }}>
        <div style={{ marginBottom: '12px' }}>
          <ParamSlider
            name="Pellet Points"
            value={config.fitness_pellet_points}
            displayValue={String(config.fitness_pellet_points)}
            min={10}
            max={200}
            hint="Points per pellet collected"
            onChange={(v) => setConfig({ fitness_pellet_points: v })}
            width="100%"
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <ParamSlider
            name="Progress Max"
            value={config.fitness_progress_max}
            displayValue={String(config.fitness_progress_max)}
            min={0}
            max={150}
            hint="Max progress bonus toward pellet"
            onChange={(v) => setConfig({ fitness_progress_max: v })}
            width="100%"
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <ParamSlider
            name="Distance Per Unit"
            value={config.fitness_distance_per_unit}
            displayValue={String(config.fitness_distance_per_unit)}
            min={0}
            max={10}
            hint="Points per unit of distance traveled"
            onChange={(v) => setConfig({ fitness_distance_per_unit: v })}
            width="100%"
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <ParamSlider
            name="Distance Traveled Max"
            value={config.fitness_distance_traveled_max}
            displayValue={String(config.fitness_distance_traveled_max)}
            min={0}
            max={50}
            hint="Max bonus for total distance traveled"
            onChange={(v) => setConfig({ fitness_distance_traveled_max: v })}
            width="100%"
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <ParamSlider
            name="Regression Penalty"
            value={config.fitness_regression_penalty}
            displayValue={String(config.fitness_regression_penalty)}
            min={0}
            max={50}
            hint="Penalty for moving away after 1st pellet"
            onChange={(v) => setConfig({ fitness_regression_penalty: v })}
            width="100%"
          />
        </div>
      <Button variant="secondary" size="small" onClick={handleReset} style={{ width: '100%' }}>
        Reset to Defaults
      </Button>
    </div>
  );
}

// Legacy export for backwards compatibility
export const FitnessPanel = FitnessPanelContent;
export default FitnessPanelContent;
