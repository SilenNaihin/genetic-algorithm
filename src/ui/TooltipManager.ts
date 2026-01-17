/**
 * Manages a singleton tooltip element for displaying creature info on hover.
 * Handles DOM creation, positioning, and visibility.
 */
export class TooltipManager {
  private tooltip: HTMLElement;

  constructor() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'creature-tooltip glass';
    document.body.appendChild(this.tooltip);
  }

  /**
   * Show the tooltip with HTML content at a position relative to a target element.
   * Automatically adjusts position to stay within viewport.
   */
  show(html: string, targetRect: DOMRect, options: { preferLeft?: boolean } = {}): void {
    this.tooltip.innerHTML = html;

    const tooltipHeight = 320; // Approximate max height
    const tooltipWidth = 200;  // Approximate width

    let left = targetRect.right + 10;
    let top = targetRect.top;

    // If tooltip would go off the bottom, position from bottom up
    if (top + tooltipHeight > window.innerHeight) {
      top = Math.max(10, window.innerHeight - tooltipHeight - 10);
    }

    // If tooltip would go off the right (or preferLeft requested), position to left of target
    if (options.preferLeft || left + tooltipWidth > window.innerWidth) {
      left = targetRect.left - tooltipWidth - 10;
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
    this.tooltip.classList.add('visible');
  }

  /**
   * Hide the tooltip.
   */
  hide(): void {
    this.tooltip.classList.remove('visible');
  }

  /**
   * Clean up the tooltip element.
   */
  destroy(): void {
    this.tooltip.remove();
  }
}

/**
 * Helper to generate a tooltip row HTML.
 */
export function tooltipRow(label: string, value: string | number, valueStyle?: string): string {
  const style = valueStyle ? ` style="${valueStyle}"` : '';
  return `
    <div class="tooltip-row">
      <span class="tooltip-label">${label}</span>
      <span class="tooltip-value"${style}>${value}</span>
    </div>`;
}

/**
 * Helper to generate tooltip title HTML.
 */
export function tooltipTitle(title: string, subtitle?: string, titleStyle?: string): string {
  const style = titleStyle ? ` style="${titleStyle}"` : '';
  const sub = subtitle ? ` <span style="color: var(--text-muted); font-size: 12px;">${subtitle}</span>` : '';
  return `<div class="tooltip-title"${style}>${title}${sub}</div>`;
}
