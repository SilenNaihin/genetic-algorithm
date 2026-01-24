'use client';

import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface InfoTooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  width?: number;
}

/**
 * Info icon (i) with hover tooltip.
 * Provides contextual help for settings without cluttering the UI.
 * Uses portal to render tooltip to body, escaping overflow:hidden containers.
 */
export function InfoTooltip({ text, position = 'top', width = 200 }: InfoTooltipProps) {
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const iconRef = useRef<HTMLSpanElement>(null);

  const showTooltip = useCallback(() => {
    if (!iconRef.current) return;

    const rect = iconRef.current.getBoundingClientRect();
    const gap = 8;
    // Estimate tooltip height (will be approximately this based on content)
    const estimatedHeight = 80;

    let style: React.CSSProperties = {
      position: 'fixed',
      width: `${width}px`,
      zIndex: 10000,
      padding: '10px 12px',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      color: 'var(--text-secondary)',
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: 1.5,
      whiteSpace: 'normal',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      pointerEvents: 'none',
    };

    switch (position) {
      case 'top':
        style.left = `${rect.left + rect.width / 2 - width / 2}px`;
        style.bottom = `${window.innerHeight - rect.top + gap}px`;
        break;
      case 'bottom':
        style.left = `${rect.left + rect.width / 2 - width / 2}px`;
        style.top = `${rect.bottom + gap}px`;
        break;
      case 'left':
        style.left = `${rect.left - width - gap}px`;
        style.top = `${rect.top + rect.height / 2 - estimatedHeight / 2}px`;
        break;
      case 'right':
        style.left = `${rect.right + gap}px`;
        style.top = `${rect.top + rect.height / 2 - estimatedHeight / 2}px`;
        break;
    }

    setTooltipStyle(style);
    setIsHovered(true);
  }, [position, width]);

  const hideTooltip = useCallback(() => {
    setTooltipStyle(null);
    setIsHovered(false);
  }, []);

  return (
    <>
      <span
        ref={iconRef}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '14px',
          height: '14px',
          marginLeft: '6px',
          borderRadius: '50%',
          border: `1px solid ${isHovered ? 'var(--accent)' : 'var(--text-muted)'}`,
          color: isHovered ? 'var(--accent)' : 'var(--text-muted)',
          fontSize: '10px',
          fontStyle: 'italic',
          fontWeight: 600,
          fontFamily: 'Georgia, serif',
          cursor: 'help',
          transition: 'border-color 0.15s ease, color 0.15s ease',
        }}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        i
      </span>
      {tooltipStyle && typeof document !== 'undefined' && createPortal(
        <div style={tooltipStyle}>{text}</div>,
        document.body
      )}
    </>
  );
}

/**
 * Tooltip content for settings.
 * Centralized here for easy updates and consistency.
 */
export const TOOLTIPS = {
  // Neural settings
  neuralMode: 'Pure: NN has full control over muscles (7 inputs, no time). Hybrid: NN modulates base oscillation (8 inputs with time phase). Pure evolves from scratch; Hybrid guides existing movement.',
  hiddenSize: 'Number of neurons in the hidden layer. More neurons = more complex behaviors but slower evolution. 4-8 for simple tasks, 12-16 for complex coordination.',
  activation: 'How neurons transform inputs. Tanh (-1 to 1): smooth, good default. ReLU (0 to ∞): sparse, fast. Sigmoid (0 to 1): positive only, good for muscle-like outputs.',
  weightMutationRate: 'Target mutation rate. With decay on, starts at 5× this value (max 50%) and decreases over 50 generations. Example: 10% target → starts at 50%, decays to 10%.',
  rateDecay: 'Decay from 5× target rate (max 50%) down to target over 50 generations. Linear: steady decrease. Exponential: fast initial drop, gradual finish. Explores early, fine-tunes later.',
  weightMutationMagnitude: 'How much weights change when mutated (standard deviation). Small values (0.1-0.3) make gradual changes; larger values (0.5-1.0) allow bigger jumps in behavior.',
  outputBias: 'Initial bias for output neurons. More negative = muscles harder to activate initially, must evolve to overcome bias. 0 = no bias (active by default), -2 = very hard to activate.',
  efficiencyPenalty: 'Subtracts from fitness based on total muscle activation. Encourages creatures to achieve goals with minimal effort. Set to 0 to disable, higher values favor efficiency.',

  // Evolution settings
  populationSize: 'Number of creatures per generation. Larger populations explore more solutions but simulate slower. 100 is a good balance.',
  mutationRate: 'Probability that each gene mutates when creating offspring. Higher rates explore more but may lose good solutions.',
  mutationMagnitude: 'How much genes change when mutated. Higher values make bigger changes to creature body structure.',
  crossoverRate: 'Probability of combining two parents vs just mutating one. Higher rates mix successful traits more often.',
  cullPercentage: 'Fraction of population replaced each generation. 50% means bottom half dies and is replaced by offspring of top half.',

  // Selection methods
  selectionTruncation: 'Sort all creatures by fitness, keep the top N%. Simple and fast but harsh - creatures just below the cutoff are discarded even if nearly as good. Can lose diversity quickly.',
  selectionTournament: 'Randomly pick N creatures, the fittest wins and gets to breed. Repeat until enough parents selected. Gives weaker creatures a chance if they avoid strong competitors. Tournament size controls pressure.',
  selectionRank: 'Sort by fitness and assign breeding probability by rank (1st place gets most chances, last place fewest). Unlike truncation, even low-ranked creatures can reproduce. Maintains diversity while favoring the fit.',
  tournamentSize: 'How many creatures compete in each tournament. Size 2 = weak pressure (50% chance the best wins). Size 5+ = strong pressure (best almost always wins). Lower for exploration, higher for exploitation.',

  // Simulation settings
  simulationDuration: 'How long each creature is simulated in seconds. Longer durations allow more complex behaviors but take more time.',
  physicsFPS: 'Physics frames per second. Higher FPS = more expressive movement but more compute. 60 FPS default, 30 FPS for faster runs, 120 FPS for precision.',
  gravity: 'Downward force on creatures. Stronger gravity (-30) makes movement harder; weaker gravity (-9.8) is more forgiving.',
  groundFriction: 'How much the ground resists sliding. Higher friction allows better grip for pushing off.',

  // Creature settings
  maxNodes: 'Maximum body parts (spheres) a creature can have. More nodes allow complex body shapes but increase simulation cost.',
  maxMuscles: 'Maximum connections between nodes. More muscles allow finer control but require more neural network outputs.',
  maxAllowedFrequency: 'Maximum muscle oscillation speed. Creatures exceeding this are penalized to prevent unrealistic vibration.',

  // Environment settings
  pelletCount: 'Number of food pellets in the arena. More pellets make the task easier and provide more learning opportunities.',
  arenaSize: 'Size of the simulation arena. Larger arenas require more exploration to find pellets.',
};

export default InfoTooltip;
