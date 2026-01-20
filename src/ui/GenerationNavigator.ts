/**
 * Handles generation navigation state and UI updates.
 * Works with the main app to manage history mode viewing.
 */

export interface GenerationState {
  current: number;        // Current live generation
  max: number;           // Max saved generation
  viewing: number | null; // Generation being viewed (null = live)
}

/**
 * Calculate navigation button states based on current viewing position.
 */
export function getNavigationState(state: GenerationState): {
  canGoPrev: boolean;
  canGoNext: boolean;
  isViewingHistory: boolean;
  displayGen: number;
} {
  const isViewingHistory = state.viewing !== null;
  const displayGen = state.viewing !== null ? state.viewing : state.current;

  const canGoPrev = displayGen > 0;
  const canGoNext = isViewingHistory && (state.viewing! < state.max || state.viewing! < state.current);

  return { canGoPrev, canGoNext, isViewingHistory, displayGen };
}

/**
 * Determine target generation when navigating prev/next.
 * Returns null if navigation is not possible.
 */
export function getTargetGeneration(
  direction: 'prev' | 'next',
  state: GenerationState
): { target: number; shouldGoToLive: boolean } | null {
  const currentViewGen = state.viewing !== null ? state.viewing : state.current;

  if (direction === 'prev') {
    const target = currentViewGen - 1;
    if (target < 0) return null;

    // If going to current live generation
    if (target === state.current) {
      return { target, shouldGoToLive: true };
    }
    return { target, shouldGoToLive: false };
  } else {
    const target = currentViewGen + 1;

    // Can't go beyond max saved
    if (target > state.max && target > state.current) {
      return null;
    }

    // If going to current live generation
    if (target === state.current) {
      return { target, shouldGoToLive: true };
    }

    // Can't go beyond max saved
    if (target > state.max) {
      return null;
    }

    return { target, shouldGoToLive: false };
  }
}

/**
 * Update evolution control buttons for history mode.
 * Disables controls when viewing historical generations.
 */
export function updateControlsForHistoryMode(
  isHistoryMode: boolean,
  updateNextButtonText?: () => void
): void {
  const nextStepBtn = document.getElementById('next-step-btn') as HTMLButtonElement;
  const run1xBtn = document.getElementById('run-1x-btn') as HTMLButtonElement;
  const run10xBtn = document.getElementById('run-10x-btn') as HTMLButtonElement;
  const run100xBtn = document.getElementById('run-100x-btn') as HTMLButtonElement;

  if (isHistoryMode) {
    // Disable evolution controls when viewing history
    if (nextStepBtn) {
      nextStepBtn.disabled = true;
      nextStepBtn.textContent = 'Viewing History';
    }
    if (run1xBtn) run1xBtn.disabled = true;
    if (run10xBtn) run10xBtn.disabled = true;
    if (run100xBtn) run100xBtn.disabled = true;
  } else {
    // Re-enable controls
    if (nextStepBtn) {
      nextStepBtn.disabled = false;
      updateNextButtonText?.();
    }
    if (run1xBtn) run1xBtn.disabled = false;
    if (run10xBtn) run10xBtn.disabled = false;
    if (run100xBtn) run100xBtn.disabled = false;
  }
}

/**
 * Validate a generation number for jumping.
 * Returns error message or null if valid.
 */
export function validateJumpTarget(target: number, maxGen: number): string | null {
  if (isNaN(target)) {
    return `Please enter a valid number`;
  }
  if (target < 0 || target > maxGen) {
    return `Please enter a number between 0 and ${maxGen}`;
  }
  return null;
}
