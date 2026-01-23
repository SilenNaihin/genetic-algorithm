'use client';

import { useRouter } from 'next/navigation';
import { useEvolutionStore, useEvolutionStep, useIsAutoRunning } from '../../stores/evolutionStore';
import { useSimulation } from '../../hooks/useSimulation';
import { Button } from '../common/Button';

/**
 * Control panel with evolution step controls.
 * Buttons: Step, Auto-run (1x, 10x, 100x), Graph, Reset
 * Controls are disabled when viewing historical generations.
 */
export function ControlPanel() {
  const evolutionStep = useEvolutionStep();
  const isAutoRunning = useIsAutoRunning();
  const viewingGeneration = useEvolutionStore((s) => s.viewingGeneration);
  const simulationProgress = useEvolutionStore((s) => s.simulationProgress);
  const router = useRouter();
  const setGraphsVisible = useEvolutionStore((s) => s.setGraphsVisible);
  const graphsVisible = useEvolutionStore((s) => s.graphsVisible);
  const reset = useEvolutionStore((s) => s.reset);
  const { executeNextStep, autoRun } = useSimulation();

  // Check if viewing history (not current generation)
  const isViewingHistory = viewingGeneration !== null;

  // Check if simulation is actively running
  const isSimulationRunning = simulationProgress !== null;

  const sortAnimationTriggered = useEvolutionStore((s) => s.sortAnimationTriggered);

  // Determine button text based on evolution step (matches vanilla)
  const getStepButtonText = () => {
    // Special case: actively simulating
    if (isSimulationRunning) {
      return 'Simulating...';
    }

    // Special case: sort animation in progress
    if (sortAnimationTriggered) {
      return 'Sorting...';
    }

    switch (evolutionStep) {
      case 'idle':
        return 'Mutate';
      case 'mutate':
        return 'Killing 50%...';
      case 'simulate':
        return 'Simulate';
      case 'sort':
        return 'Sort';
      default:
        return 'Mutate';
    }
  };

  // Button disabled during mutate animation, sort animation in progress, active simulation, auto-run, or viewing history
  const isStepDisabled = evolutionStep === 'mutate' || sortAnimationTriggered || isSimulationRunning || isAutoRunning || isViewingHistory;
  const isAutoRunDisabled = isAutoRunning || isViewingHistory;

  const handleStep = async () => {
    await executeNextStep();
  };

  const handleAutoRun = (generations: number) => {
    autoRun(generations);
  };

  const handleGraphToggle = () => {
    setGraphsVisible(!graphsVisible);
  };

  const handleReset = () => {
    reset();
    router.push('/');
  };

  return (
    <div className="control-panel glass">
      <Button
        variant="primary"
        onClick={handleStep}
        disabled={isStepDisabled}
      >
        {getStepButtonText()}
      </Button>

      <div className="control-divider" />

      <Button
        variant="secondary"
        size="small"
        onClick={() => handleAutoRun(1)}
        disabled={isAutoRunDisabled}
      >
        1x
      </Button>
      <Button
        variant="secondary"
        size="small"
        onClick={() => handleAutoRun(10)}
        disabled={isAutoRunDisabled}
      >
        10x
      </Button>
      <Button
        variant="secondary"
        size="small"
        onClick={() => handleAutoRun(100)}
        disabled={isAutoRunDisabled}
      >
        100x
      </Button>

      <div className="control-divider" />

      <Button
        variant="secondary"
        size="small"
        onClick={handleGraphToggle}
      >
        Graph
      </Button>
      <Button
        variant="secondary"
        size="small"
        onClick={handleReset}
      >
        Reset
      </Button>
    </div>
  );
}

export default ControlPanel;
