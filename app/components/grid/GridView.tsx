'use client';

import { useState, useEffect, useRef } from 'react';
import { useEvolutionStore, useIsAutoRunning } from '../../stores/evolutionStore';
import { ControlPanel } from './ControlPanel';
import { StatsPanel } from './StatsPanel';
import { StepIndicator } from './StepIndicator';
import { SettingsInfoBox } from './SettingsInfoBox';
import { CreatureGrid } from './CreatureGrid';
import { GraphPanels } from './GraphPanels';
import { ReplayModal } from '../modals/ReplayModal';
import { BrainEvolutionModal } from '../modals/BrainEvolutionModal';
import { GenerationJumpModal } from '../modals/GenerationJumpModal';

/**
 * Main grid view container for the evolution simulation.
 * Contains: StatsPanel (top-left), StepIndicator (top-center),
 * SettingsInfoBox (top-right), CreatureGrid (center), ControlPanel (bottom-left)
 */
export function GridView() {
  const simulationProgress = useEvolutionStore((s) => s.simulationProgress);
  const evolutionStep = useEvolutionStore((s) => s.evolutionStep);
  const isAutoRunning = useIsAutoRunning();

  // Animated progress counter
  const [animatedCount, setAnimatedCount] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Animate progress from 0 to total when simulation starts
  useEffect(() => {
    if (simulationProgress) {
      const { total } = simulationProgress;
      // Reset and start animation
      setAnimatedCount(0);
      startTimeRef.current = performance.now();

      // Quick animation duration (matches the 800ms delay in runSimulateStep)
      const estimatedDuration = 750;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTimeRef.current;
        const progress = Math.min(elapsed / estimatedDuration, 1);

        // Ease out quad: starts fast, slows down toward end
        const eased = 1 - (1 - progress) * (1 - progress);

        // Animate to 100%
        const targetCount = Math.floor(eased * total);
        setAnimatedCount(targetCount);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      // Reset when simulation ends
      setAnimatedCount(0);
    }
  }, [simulationProgress]);

  // Calculate progress percentage for step-by-step mode
  const displayCount = simulationProgress ? animatedCount : 0;
  const progressPercent = simulationProgress
    ? Math.round((displayCount / simulationProgress.total) * 100)
    : 0;
  // Text depends on which step we're in
  const progressLabel = evolutionStep === 'mutate' ? 'Mutating' : 'Simulating';
  const progressText = simulationProgress
    ? `${progressLabel} creature ${displayCount}/${simulationProgress.total}...`
    : `${progressLabel} creatures...`;

  return (
    <div style={{ display: 'block', width: '100%', height: '100%', position: 'relative' }}>
      {/* Stats Panel - Top Left */}
      <StatsPanel />

      {/* Step Indicator - Top Center */}
      <StepIndicator />

      {/* Settings Info Box - Top Right */}
      <SettingsInfoBox />

      {/* Creature Grid - Center (CSS class handles positioning) */}
      <CreatureGrid />

      {/* Control Panel - Bottom Left (fixed) */}
      <ControlPanel />

      {/* Simple "Simulating..." indicator for autoRun (1x/10x/100x) */}
      {isAutoRunning && !simulationProgress && (
        <div
          className="glass"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 50,
            padding: '12px 20px',
            borderRadius: '8px',
          }}
        >
          <div style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
            Simulating...
          </div>
        </div>
      )}

      {/* Full progress bar for step-by-step simulation */}
      {simulationProgress && (
        <div
          className="progress-container glass"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 50,
            padding: '16px 24px',
          }}
        >
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="progress-text" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {progressText}
          </div>
        </div>
      )}

      {/* Graph Panels */}
      <GraphPanels />

      {/* Replay Modal */}
      <ReplayModal />

      {/* Brain Evolution Modal */}
      <BrainEvolutionModal />

      {/* Generation Jump Modal */}
      <GenerationJumpModal />
    </div>
  );
}

export default GridView;
