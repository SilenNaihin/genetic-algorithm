/**
 * InfoTooltip - A reusable info icon with hover tooltip.
 *
 * Creates an (i) icon that displays explanatory text on hover.
 * Used to provide context for settings without cluttering the UI.
 * Uses position:fixed to escape overflow:hidden containers.
 */

export interface TooltipConfig {
  text: string;           // The tooltip text to display
  width?: number;         // Tooltip width in pixels (default: 200)
  position?: 'top' | 'bottom' | 'left' | 'right';  // Tooltip position (default: 'top')
}

/**
 * Creates an info icon element with a hover tooltip.
 *
 * @param config - Tooltip configuration
 * @returns HTMLSpanElement containing the info icon and tooltip
 *
 * @example
 * const tooltip = createInfoTooltip({
 *   text: 'This setting controls...',
 *   position: 'top'
 * });
 * container.appendChild(tooltip);
 */
export function createInfoTooltip(config: TooltipConfig): HTMLSpanElement {
  const { text, width = 200, position = 'top' } = config;

  // Create container
  const container = document.createElement('span');
  container.className = 'info-tooltip-container';
  container.style.cssText = `
    position: relative;
    display: inline-flex;
    align-items: center;
    margin-left: 6px;
    cursor: help;
  `;

  // Create info icon
  const icon = document.createElement('span');
  icon.className = 'info-tooltip-icon';
  icon.textContent = 'i';
  icon.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1px solid var(--text-muted, #64748b);
    color: var(--text-muted, #64748b);
    font-size: 10px;
    font-style: italic;
    font-weight: 600;
    font-family: Georgia, serif;
    transition: all 0.15s ease;
  `;

  // Create tooltip (appended to body to escape overflow:hidden)
  const tooltip = document.createElement('span');
  tooltip.className = 'info-tooltip-text';
  tooltip.style.cssText = `
    position: fixed;
    width: ${width}px;
    padding: 10px 12px;
    background: var(--bg-tertiary, #1e1e2e);
    border: 1px solid var(--border, #334155);
    border-radius: 8px;
    color: var(--text-secondary, #cbd5e1);
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 1.5;
    white-space: normal;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.15s ease, visibility 0.15s ease;
    z-index: 10000;
    pointer-events: none;
  `;
  tooltip.textContent = text;

  // Add arrow
  const arrow = document.createElement('span');
  arrow.style.cssText = `
    position: absolute;
    width: 8px;
    height: 8px;
    background: var(--bg-tertiary, #1e1e2e);
  `;
  tooltip.appendChild(arrow);

  // Append tooltip to body so it escapes overflow:hidden
  document.body.appendChild(tooltip);

  // Position the tooltip relative to the icon
  const positionTooltip = () => {
    const rect = icon.getBoundingClientRect();
    const gap = 8;

    switch (position) {
      case 'top':
        tooltip.style.left = `${rect.left + rect.width / 2 - width / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - gap}px`;
        arrow.style.cssText = `
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 8px;
          height: 8px;
          background: var(--bg-tertiary, #1e1e2e);
          border-right: 1px solid var(--border, #334155);
          border-bottom: 1px solid var(--border, #334155);
        `;
        break;
      case 'bottom':
        tooltip.style.left = `${rect.left + rect.width / 2 - width / 2}px`;
        tooltip.style.top = `${rect.bottom + gap}px`;
        arrow.style.cssText = `
          position: absolute;
          top: -5px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 8px;
          height: 8px;
          background: var(--bg-tertiary, #1e1e2e);
          border-left: 1px solid var(--border, #334155);
          border-top: 1px solid var(--border, #334155);
        `;
        break;
      case 'left':
        tooltip.style.left = `${rect.left - width - gap}px`;
        tooltip.style.top = `${rect.top + rect.height / 2 - tooltip.offsetHeight / 2}px`;
        arrow.style.cssText = `
          position: absolute;
          right: -5px;
          top: 50%;
          transform: translateY(-50%) rotate(45deg);
          width: 8px;
          height: 8px;
          background: var(--bg-tertiary, #1e1e2e);
          border-right: 1px solid var(--border, #334155);
          border-top: 1px solid var(--border, #334155);
        `;
        break;
      case 'right':
        tooltip.style.left = `${rect.right + gap}px`;
        tooltip.style.top = `${rect.top + rect.height / 2 - tooltip.offsetHeight / 2}px`;
        arrow.style.cssText = `
          position: absolute;
          left: -5px;
          top: 50%;
          transform: translateY(-50%) rotate(45deg);
          width: 8px;
          height: 8px;
          background: var(--bg-tertiary, #1e1e2e);
          border-left: 1px solid var(--border, #334155);
          border-bottom: 1px solid var(--border, #334155);
        `;
        break;
    }
  };

  // Hover events
  container.addEventListener('mouseenter', () => {
    icon.style.borderColor = 'var(--accent, #60a5fa)';
    icon.style.color = 'var(--accent, #60a5fa)';
    positionTooltip();
    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';
  });

  container.addEventListener('mouseleave', () => {
    icon.style.borderColor = 'var(--text-muted, #64748b)';
    icon.style.color = 'var(--text-muted, #64748b)';
    tooltip.style.opacity = '0';
    tooltip.style.visibility = 'hidden';
  });

  container.appendChild(icon);

  return container;
}

/**
 * Tooltip content for neural network settings.
 * Centralized here for easy updates and consistency.
 */
export const NEURAL_TOOLTIPS = {
  mode: {
    text: 'Pure: NN has full control over muscles (7 inputs, no time). Hybrid: NN modulates base oscillation (8 inputs with time phase). Pure evolves from scratch; Hybrid guides existing movement.',
    position: 'top' as const
  },
  hiddenSize: {
    text: 'Number of neurons in the hidden layer. More neurons = more complex behaviors but slower evolution. 4-8 for simple tasks, 12-16 for complex coordination.',
    position: 'top' as const
  },
  activation: {
    text: 'How neurons transform inputs. Tanh (-1 to 1): smooth, good default. ReLU (0 to ∞): sparse, fast. Sigmoid (0 to 1): positive only, good for muscle-like outputs.',
    position: 'top' as const
  },
  weightMutationRate: {
    text: 'Target mutation rate (end rate if decay is on). Higher values explore more but may lose good solutions. With decay enabled, rate starts at 5x this value and decreases over 50 generations.',
    position: 'top' as const
  },
  rateDecay: {
    text: 'Decay mutation rate over generations. Off: constant rate. Linear: steady decrease to target over 50 gens. Exponential: fast initial drop, then gradual approach to target. Helps explore early, fine-tune later.',
    position: 'top' as const
  },
  weightMutationMagnitude: {
    text: 'How much weights change when mutated (standard deviation). Small values (0.1-0.3) make gradual changes; larger values (0.5-1.0) allow bigger jumps in behavior.',
    position: 'top' as const
  },
  deadZone: {
    text: 'Pure mode only: Neural outputs below this threshold become exactly 0. Helps muscles stay truly "off" instead of constantly micro-activating. Higher values = more selective activation.',
    position: 'top' as const
  },
  efficiencyPenalty: {
    text: 'Subtracts from fitness based on total muscle activation. Encourages creatures to achieve goals with minimal effort. Set to 0 to disable, higher values favor efficiency over raw performance.',
    position: 'top' as const
  }
};
