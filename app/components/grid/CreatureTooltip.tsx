'use client';

import { useEffect, useRef } from 'react';
import { TooltipManager, tooltipRow, tooltipTitle } from '../../../src/ui/TooltipManager';
import { getCreatureName } from '../../../src/ui/CreatureCardRenderer';
import { getNormalizedConfig } from '../../stores/evolutionStore';
import type { CreatureSimulationResult } from '../../../src/types';

/**
 * Generates tooltip HTML for a creature card.
 */
function generateTooltipHTML(result: CreatureSimulationResult, rank?: number, stackDepth?: number): string {
  const config = getNormalizedConfig();
  const isDirectNeural = config.neuralMode === 'pure' || config.neuralMode === 'neat';
  const genome = result.genome;
  const creatureName = getCreatureName(genome);
  const avgStiffness = genome.muscles.length > 0
    ? genome.muscles.reduce((sum, m) => sum + m.stiffness, 0) / genome.muscles.length
    : 0;
  const avgFrequency = genome.muscles.length > 0
    ? genome.muscles.reduce((sum, m) => sum + m.frequency, 0) / genome.muscles.length
    : 0;
  const isStacked = stackDepth && stackDepth > 1;

  const fitness = isNaN(result.finalFitness) ? 0 : result.finalFitness;

  // Disqualification reason text
  const getDisqualificationText = (): string => {
    switch (result.disqualified) {
      case 'frequency_exceeded':
        return 'Muscle frequency exceeded max allowed';
      case 'physics_explosion':
        return 'Physics simulation exploded';
      case 'nan_position':
        return 'Position became invalid';
      default:
        return '';
    }
  };
  const disqualificationText = getDisqualificationText();

  // Lifecycle info
  const birthGen = result.birthGeneration;
  const deathGen = result.deathGeneration;
  const isAlive = deathGen === undefined || deathGen === null;

  const rankStr = rank !== undefined ? `#${rank}` : '';
  const stackInfo = isStacked ? `<span style="color: #6b7280; font-size: 11px; margin-left: 6px;">(${stackDepth} stacked)</span>` : '';

  return `
    ${tooltipTitle(creatureName, rankStr)}${stackInfo}

    ${result.disqualified ? `
      <div style="margin-bottom: 8px; padding: 8px; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; border-radius: 4px;">
        <div style="color: #ef4444; font-weight: 600; font-size: 12px;">DISQUALIFIED</div>
        <div style="color: #fca5a5; font-size: 11px; margin-top: 2px;">${disqualificationText}</div>
      </div>
    ` : ''}

    <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
      ${tooltipRow('Fitness', fitness.toFixed(1), `color: ${result.disqualified ? '#ef4444' : 'var(--success)'}`)}
      ${tooltipRow('Pellets', `${result.pelletsCollected}/${result.pellets.length}`)}
      ${tooltipRow('Distance', result.distanceTraveled.toFixed(1))}
    </div>

    <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
      <div style="font-size: 11px; color: var(--accent-light); margin-bottom: 4px;">Lifecycle</div>
      ${birthGen !== undefined ? tooltipRow('Born', `Gen ${birthGen}`) : ''}
      ${!isAlive ? tooltipRow('Died', `Gen ${deathGen}`, 'color: #ef4444') : ''}
    </div>

    <div>
      <div style="font-size: 11px; color: var(--accent-light); margin-bottom: 4px;">Structure</div>
      ${tooltipRow('Nodes', genome.nodes.length)}
      ${tooltipRow('Muscles', genome.muscles.length)}
      ${tooltipRow('Avg Stiffness', avgStiffness.toFixed(0))}
      ${!isDirectNeural ? tooltipRow('Avg Frequency', `${avgFrequency.toFixed(1)} Hz`) : ''}
      ${!isDirectNeural ? tooltipRow('Global Speed', `${genome.globalFrequencyMultiplier.toFixed(2)}x`) : ''}
    </div>

    <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">${result.disqualified ? 'Replay unavailable' : 'Click to replay'}</div>
  `;
}

/**
 * Singleton tooltip manager hook.
 */
let tooltipManager: TooltipManager | null = null;

export function useCreatureTooltip() {
  const managerRef = useRef<TooltipManager | null>(null);

  useEffect(() => {
    if (!tooltipManager) {
      tooltipManager = new TooltipManager();
    }
    managerRef.current = tooltipManager;

    return () => {
      // Don't destroy on unmount - keep singleton alive
    };
  }, []);

  const showTooltip = (result: CreatureSimulationResult, targetRect: DOMRect, rank?: number, stackDepth?: number) => {
    const html = generateTooltipHTML(result, rank, stackDepth);
    managerRef.current?.show(html, targetRect);
  };

  const hideTooltip = () => {
    managerRef.current?.hide();
  };

  return { showTooltip, hideTooltip };
}

export default useCreatureTooltip;
