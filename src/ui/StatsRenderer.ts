import type { EvolutionStep, Config } from '../types/app';

/**
 * Step indicator data for the evolution cycle display.
 */
interface StepInfo {
  key: string;
  label: string;
  num: number;
}

const EVOLUTION_STEPS: StepInfo[] = [
  { key: 'mutate', label: 'Mutate', num: 1 },
  { key: 'simulate', label: 'Simulate', num: 2 },
  { key: 'sort', label: 'Sort', num: 3 }
];

/**
 * Generate HTML for the evolution step indicator.
 * Shows the current step in the mutate -> simulate -> sort cycle.
 */
export function getStepIndicatorHTML(evolutionStep: EvolutionStep, generation: number): string {
  const currentIndex = EVOLUTION_STEPS.findIndex(s => s.key === evolutionStep);

  return EVOLUTION_STEPS.map((step, i) => {
    const isActive = step.key === evolutionStep;
    const isDone = currentIndex > i || (evolutionStep === 'idle' && generation > 0);
    const circleClass = isActive ? 'active' : (isDone ? 'done' : '');
    const labelClass = isActive ? 'active' : (isDone ? 'done' : '');

    const connector = i < EVOLUTION_STEPS.length - 1
      ? `<div class="step-connector ${isDone || (currentIndex > i) ? 'done' : ''}"></div>`
      : '';

    return `
      <div class="step-item">
        <div class="step-circle ${circleClass}">${isDone && !isActive ? '✓' : step.num}</div>
        <span class="step-label ${labelClass}">${step.label}</span>
      </div>
      ${connector}
    `;
  }).join('');
}

/**
 * Generate HTML for the settings info panel.
 */
export function getSettingsInfoHTML(config: Config): string {
  return `
    <div style="color: var(--text-secondary); font-weight: 600; margin-bottom: 8px;">Settings</div>
    <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px;">
      <span>Gravity:</span><span style="color: var(--text-primary);">${config.gravity}</span>
      <span>Mutation:</span><span style="color: var(--text-primary);">${Math.round(config.mutationRate * 100)}%</span>
      <span>Max Freq:</span><span style="color: var(--text-primary);">${config.maxAllowedFrequency} Hz</span>
      <span>Duration:</span><span style="color: var(--text-primary);">${config.simulationDuration}s</span>
      <span>Max Nodes:</span><span style="color: var(--text-primary);">${config.maxNodes}</span>
      <span>Max Muscles:</span><span style="color: var(--text-primary);">${config.maxMuscles}</span>
    </div>
    <div id="fitness-dropdown-toggle" style="
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      color: var(--text-muted);
      font-size: 11px;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid var(--border);
    ">
      <svg id="fitness-dropdown-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.2s;">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
      <span>Fitness Config</span>
    </div>
    <div id="fitness-dropdown-content" style="display: none; margin-top: 6px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 6px;">
      <div style="display: grid; grid-template-columns: auto auto; gap: 2px 10px; font-size: 10px;">
        <span style="color: var(--text-muted);">Pellet Points:</span><span style="color: var(--text-secondary);">${config.fitnessPelletPoints}</span>
        <span style="color: var(--text-muted);">Progress Max:</span><span style="color: var(--text-secondary);">${config.fitnessProgressMax}</span>
        <span style="color: var(--text-muted);">Net Disp Max:</span><span style="color: var(--text-secondary);">${config.fitnessNetDisplacementMax}</span>
        <span style="color: var(--text-muted);">Dist/Unit:</span><span style="color: var(--text-secondary);">${config.fitnessDistancePerUnit}</span>
        <span style="color: var(--text-muted);">Dist Max:</span><span style="color: var(--text-secondary);">${config.fitnessDistanceTraveledMax}</span>
        <span style="color: var(--text-muted);">Regression Penalty:</span><span style="color: var(--text-secondary);">${config.fitnessRegressionPenalty}</span>
      </div>
    </div>
    ${config.useNeuralNet ? `
    <div id="neural-dropdown-toggle" style="
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      color: var(--text-muted);
      font-size: 11px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--border);
    ">
      <svg id="neural-dropdown-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.2s;">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
      <span>Neural Config</span>
    </div>
    <div id="neural-dropdown-content" style="display: none; margin-top: 6px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 6px;">
      <div style="display: grid; grid-template-columns: auto auto; gap: 2px 10px; font-size: 10px;">
        <span style="color: var(--text-muted);">Mode:</span><span style="color: var(--text-secondary);">${config.neuralMode}</span>
        <span style="color: var(--text-muted);">Hidden Size:</span><span style="color: var(--text-secondary);">${config.neuralHiddenSize}</span>
        <span style="color: var(--text-muted);">Activation:</span><span style="color: var(--text-secondary);">${config.neuralActivation}</span>
        <span style="color: var(--text-muted);">Weight Mut Rate:</span><span style="color: var(--text-secondary);">${Math.round(config.weightMutationRate * 100)}%</span>
        <span style="color: var(--text-muted);">Weight Mut Mag:</span><span style="color: var(--text-secondary);">${config.weightMutationMagnitude}</span>
        <span style="color: var(--text-muted);">Rate Decay:</span><span style="color: var(--text-secondary);">${config.weightMutationDecay}</span>
        <span style="color: var(--text-muted);">Dead Zone:</span><span style="color: var(--text-secondary);">${config.neuralDeadZone}</span>
        <span style="color: var(--text-muted);">Efficiency Penalty:</span><span style="color: var(--text-secondary);">${config.fitnessEfficiencyPenalty}</span>
      </div>
    </div>
    ` : ''}
  `;
}

/**
 * Setup dropdown toggle behavior for fitness and neural config sections.
 */
export function setupSettingsDropdowns(): void {
  // Fitness dropdown
  const fitnessToggle = document.getElementById('fitness-dropdown-toggle');
  const fitnessContent = document.getElementById('fitness-dropdown-content');
  const fitnessChevron = document.getElementById('fitness-dropdown-chevron');

  fitnessToggle?.addEventListener('click', () => {
    if (fitnessContent && fitnessChevron) {
      const isHidden = fitnessContent.style.display === 'none';
      fitnessContent.style.display = isHidden ? 'block' : 'none';
      fitnessChevron.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
    }
  });

  // Neural dropdown
  const neuralToggle = document.getElementById('neural-dropdown-toggle');
  const neuralContent = document.getElementById('neural-dropdown-content');
  const neuralChevron = document.getElementById('neural-dropdown-chevron');

  neuralToggle?.addEventListener('click', () => {
    if (neuralContent && neuralChevron) {
      const isHidden = neuralContent.style.display === 'none';
      neuralContent.style.display = isHidden ? 'block' : 'none';
      neuralChevron.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
    }
  });
}
