/**
 * InfoTooltip - A reusable info icon with hover tooltip.
 *
 * Creates an (i) icon that displays explanatory text on hover.
 * Used to provide context for settings without cluttering the UI.
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

  // Create tooltip
  const tooltip = document.createElement('span');
  tooltip.className = 'info-tooltip-text';

  // Position styles
  const positionStyles: Record<string, string> = {
    top: `
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
    `,
    bottom: `
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
    `,
    left: `
      right: calc(100% + 8px);
      top: 50%;
      transform: translateY(-50%);
    `,
    right: `
      left: calc(100% + 8px);
      top: 50%;
      transform: translateY(-50%);
    `
  };

  tooltip.style.cssText = `
    position: absolute;
    ${positionStyles[position]}
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
    z-index: 1000;
    pointer-events: none;
  `;
  tooltip.textContent = text;

  // Add arrow
  const arrow = document.createElement('span');
  const arrowStyles: Record<string, string> = {
    top: `
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
    `,
    bottom: `
      top: -5px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
    `,
    left: `
      right: -5px;
      top: 50%;
      transform: translateY(-50%) rotate(45deg);
    `,
    right: `
      left: -5px;
      top: 50%;
      transform: translateY(-50%) rotate(45deg);
    `
  };

  const arrowBorderStyles: Record<string, string> = {
    top: 'border-right: 1px solid var(--border, #334155); border-bottom: 1px solid var(--border, #334155);',
    bottom: 'border-left: 1px solid var(--border, #334155); border-top: 1px solid var(--border, #334155);',
    left: 'border-right: 1px solid var(--border, #334155); border-top: 1px solid var(--border, #334155);',
    right: 'border-left: 1px solid var(--border, #334155); border-bottom: 1px solid var(--border, #334155);'
  };

  arrow.style.cssText = `
    position: absolute;
    ${arrowStyles[position]}
    width: 8px;
    height: 8px;
    background: var(--bg-tertiary, #1e1e2e);
    ${arrowBorderStyles[position]}
  `;
  tooltip.appendChild(arrow);

  // Hover events
  container.addEventListener('mouseenter', () => {
    icon.style.borderColor = 'var(--accent, #60a5fa)';
    icon.style.color = 'var(--accent, #60a5fa)';
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
  container.appendChild(tooltip);

  return container;
}

/**
 * Tooltip content for neural network settings.
 * Centralized here for easy updates and consistency.
 */
export const NEURAL_TOOLTIPS = {
  weightMutationRate: {
    text: 'Percentage of weights that mutate each generation. Higher values explore more but may lose good solutions. Start low (10-20%) for fine-tuning, higher (30-50%) for exploration.',
    position: 'left' as const
  },
  weightMutationMagnitude: {
    text: 'How much weights change when mutated (standard deviation). Small values (0.1-0.3) make gradual changes; larger values (0.5-1.0) allow bigger jumps in behavior.',
    position: 'left' as const
  },
  deadZone: {
    text: 'Pure mode only: Neural outputs below this threshold become exactly 0. Helps muscles stay truly "off" instead of constantly micro-activating. Higher values = more selective activation.',
    position: 'left' as const
  },
  efficiencyPenalty: {
    text: 'Subtracts from fitness based on total muscle activation. Encourages creatures to achieve goals with minimal effort. Set to 0 to disable, higher values favor efficiency over raw performance.',
    position: 'left' as const
  }
};
