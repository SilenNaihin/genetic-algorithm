'use client';

import { useEffect, useRef, useState } from 'react';
import type { CreatureSimulationResult } from '../../../src/simulation/BatchSimulator';
import { getCreatureName } from '../../../src/ui/CreatureCardRenderer';

// Card size constants matching vanilla app
const CARD_SIZE = 80;

export interface CreatureCardProps {
  result: CreatureSimulationResult;
  isElite: boolean;
  isDead?: boolean;
  isMutated?: boolean;
  isFadingOut?: boolean;
  isSpawning?: boolean;
  isAnimatingPosition?: boolean;
  x: number;
  y: number;
  onClick?: () => void;
  onHover?: (event: React.MouseEvent) => void;
  onLeave?: () => void;
  renderToCanvas: (result: CreatureSimulationResult, canvas: HTMLCanvasElement) => void;
}

/**
 * Single creature card with canvas thumbnail.
 * Shows creature name, fitness score, and visual preview.
 */
export function CreatureCard({
  result,
  isElite,
  isDead = false,
  isMutated = false,
  isFadingOut = false,
  isSpawning = false,
  isAnimatingPosition = false,
  x,
  y,
  onClick,
  onHover,
  onLeave,
  renderToCanvas,
}: CreatureCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const isDisqualified = result.disqualified !== null;
  const hasFitness = !isNaN(result.finalFitness) && isFinite(result.finalFitness);
  const fitnessText = hasFitness ? result.finalFitness.toFixed(0) : '...';
  const creatureName = getCreatureName(result.genome);

  // Build CSS class list
  const classNames = ['creature-card'];
  if (isElite && !isDead && !isFadingOut) classNames.push('elite');
  if (isDead && !isFadingOut) classNames.push('dead');
  if (isFadingOut) classNames.push('fading-out');
  if (isMutated && !isDead && !isFadingOut) classNames.push('mutated');
  if (isSpawning) classNames.push('spawning');
  if (isAnimatingPosition) classNames.push('animating-position');

  // Render creature to canvas on mount and when result changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fill background first
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1e1e2a';
      ctx.fillRect(0, 0, 160, 160);
    }

    // Render creature
    renderToCanvas(result, canvas);
  }, [result, renderToCanvas]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsHovered(true);
    onHover?.(e);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onLeave?.();
  };

  const handleClick = () => {
    // Allow click if not disqualified - frames will be loaded lazily in ReplayModal
    // Also allow if frames already available (fresh simulation)
    const hasFramesOrCanLoad = result.frames.length > 0 || result.genome._apiCreatureId;
    if (!isDisqualified && hasFramesOrCanLoad) {
      onClick?.();
    }
  };

  return (
    <div
      className={classNames.join(' ')}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: `${CARD_SIZE}px`,
        height: `${CARD_SIZE}px`,
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        cursor: isDisqualified || isDead || isFadingOut ? 'not-allowed' : 'pointer',
        // Override opacity for disqualified (not dead or fading) creatures
        opacity: isDisqualified && !isDead && !isFadingOut ? 0.6 : undefined,
        // Hover states handled via CSS, but we still apply z-index
        zIndex: isHovered && !isDead && !isFadingOut ? 10 : 1,
        transform: isHovered && !isDead && !isFadingOut ? 'scale(1.05)' : undefined,
      }}
    >
      {/* Canvas for creature thumbnail */}
      <canvas
        ref={canvasRef}
        width={160}
        height={160}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* Creature name label (top-left) */}
      <span
        className="creature-card-rank"
        style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          fontSize: '9px',
          fontWeight: 600,
          color: '#7a8494',
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '2px 5px',
          borderRadius: '4px',
          zIndex: 10,
        }}
      >
        {isDisqualified ? `DQ: ${creatureName}` : creatureName}
      </span>

      {/* Fitness label (bottom-right) */}
      <span
        className="creature-card-fitness"
        style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          fontSize: '9px',
          fontWeight: 600,
          color: hasFitness ? '#10b981' : '#7a8494',
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '2px 5px',
          borderRadius: '4px',
          zIndex: 10,
        }}
      >
        {fitnessText}
      </span>
    </div>
  );
}

export default CreatureCard;
