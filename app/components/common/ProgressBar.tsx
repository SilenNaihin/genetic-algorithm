'use client';

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

/**
 * Progress bar component
 *
 * Uses existing .progress-bar, .progress-fill classes from main.css
 * for visual parity during migration.
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`progress-container ${className}`}>
      {label && <span className="progress-label">{label}</span>}
      <div className="progress-bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <span className="progress-percentage">{Math.round(percentage)}%</span>
      )}
    </div>
  );
}

export default ProgressBar;
