'use client';

import { InfoTooltip } from '../ui/InfoTooltip';

export interface ParamSliderProps {
  name: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step?: number;
  hint?: string;
  tooltip?: string;
  onChange: (value: number) => void;
  width?: string;
}

/**
 * Parameter slider component matching vanilla app styling.
 * Uses existing .param-group, .param-label, .param-slider classes.
 */
export function ParamSlider({
  name,
  value,
  displayValue,
  min,
  max,
  step = 1,
  hint,
  tooltip,
  onChange,
  width = '200px',
}: ParamSliderProps) {
  return (
    <div className="param-group" style={{ width }}>
      <div className="param-label">
        <span className="param-name">
          {name}
          {tooltip && <InfoTooltip text={tooltip} />}
        </span>
        <span className="param-value">{displayValue}</span>
      </div>
      <input
        type="range"
        className="param-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      {hint && (
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {hint}
        </div>
      )}
    </div>
  );
}

export default ParamSlider;
