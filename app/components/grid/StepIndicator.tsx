'use client';

import { useEvolutionStep, useGeneration } from '../../stores/evolutionStore';

interface StepInfo {
  key: string;
  label: string;
  num: number;
}

const EVOLUTION_STEPS: StepInfo[] = [
  { key: 'mutate', label: 'Mutate', num: 1 },
  { key: 'simulate', label: 'Simulate', num: 2 },
  { key: 'sort', label: 'Sort', num: 3 },
];

/**
 * Step indicator showing current phase in evolution cycle.
 * Uses step-indicator, step-item, step-circle, step-label, step-connector classes.
 */
export function StepIndicator() {
  const evolutionStep = useEvolutionStep();
  const generation = useGeneration();

  const currentIndex = EVOLUTION_STEPS.findIndex((s) => s.key === evolutionStep);

  return (
    <div className="step-indicator glass">
      {EVOLUTION_STEPS.map((step, i) => {
        const isActive = step.key === evolutionStep;
        const isDone = currentIndex > i || (evolutionStep === 'idle' && generation > 0);

        return (
          <div key={step.key} style={{ display: 'contents' }}>
            <div className="step-item">
              <div className={`step-circle ${isActive ? 'active' : isDone ? 'done' : ''}`}>
                {isDone && !isActive ? '✓' : step.num}
              </div>
              <span className={`step-label ${isActive ? 'active' : isDone ? 'done' : ''}`}>
                {step.label}
              </span>
            </div>
            {i < EVOLUTION_STEPS.length - 1 && (
              <div className={`step-connector ${isDone || currentIndex > i ? 'done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StepIndicator;
