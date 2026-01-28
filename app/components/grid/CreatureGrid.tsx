'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useEvolutionStore, useSimulationResults, useConfig, useCardAnimationStates, useEvolutionStep } from '../../stores/evolutionStore';
import { CreatureCard } from './CreatureCard';
import { CreatureCardRenderer } from '../../../src/ui/CreatureCardRenderer';
import { useCreatureTooltip } from './CreatureTooltip';
import type { CreatureSimulationResult } from '../../../src/types';

// Grid constants matching vanilla app
const GRID_COLS = 10;
const GRID_ROWS = 10;
const GRID_CELLS = GRID_COLS * GRID_ROWS; // 100 cells
const CARD_SIZE = 80;
const CARD_GAP = 8;

// Stacking constants
const TOP_INDIVIDUAL_COUNT = 10; // First 10 cells show individual creatures
const REMAINING_CELLS = GRID_CELLS - TOP_INDIVIDUAL_COUNT; // 90 cells for stacking

interface CellData {
  creatures: CreatureSimulationResult[];
  stackDepth: number;
  topCreature: CreatureSimulationResult | null;
  startRank: number; // 1-indexed rank of best creature in this cell
}

/**
 * Grid of creature cards showing the current population.
 * Supports stacking for populations > 100.
 * - Cells 0-9: Top 10 creatures individually
 * - Cells 10-99: Remaining creatures stacked (worst stacked at bottom)
 */
export function CreatureGrid() {
  const simulationResults = useSimulationResults();
  const config = useConfig();
  const setReplayResult = useEvolutionStore((s) => s.setReplayResult);
  const cardAnimationStates = useCardAnimationStates();
  const evolutionStep = useEvolutionStep();
  const sortAnimationTriggered = useEvolutionStore((s) => s.sortAnimationTriggered);
  const { showTooltip, hideTooltip } = useCreatureTooltip();

  // Track whether we should display sorted order
  // This is separate from evolutionStep to allow delayed transitions
  const [isSorted, setIsSorted] = useState(true);
  const prevStepRef = useRef(evolutionStep);

  // Track renderer ready state to force re-render when ready
  const [rendererReady, setRendererReady] = useState(false);

  // Handle step transitions for sorting
  useEffect(() => {
    const prevStep = prevStepRef.current;
    prevStepRef.current = evolutionStep;

    if (evolutionStep === 'mutate' && prevStep === 'idle') {
      // Entering mutate from idle - keep sorted (don't flicker)
      // Cards stay in place while death animation plays
    } else if (evolutionStep === 'simulate' && prevStep === 'mutate') {
      // Entering simulate from mutate - now show unsorted
      // New offspring have replaced dead creatures
      setIsSorted(false);
    } else if (evolutionStep === 'idle' && prevStep === 'sort') {
      // Returned to idle from sort - ensure sorted
      setIsSorted(true);
    }
    // Note: we don't auto-sort when entering 'sort' - wait for sortAnimationTriggered
  }, [evolutionStep]);

  // Handle sort animation trigger from runSortStep
  useEffect(() => {
    if (sortAnimationTriggered) {
      // Use setTimeout to ensure the animation class is applied before positions change
      // RAF alone isn't enough due to React batching
      const timer = setTimeout(() => {
        setIsSorted(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [sortAnimationTriggered]);

  // Whether we're in sort animation phase (for CSS transition class)
  const isAnimatingSort = sortAnimationTriggered;

  // Shared renderer for all card thumbnails
  const rendererRef = useRef<CreatureCardRenderer | null>(null);

  // Initialize renderer on mount
  useEffect(() => {
    rendererRef.current = new CreatureCardRenderer();
    setRendererReady(true);
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
      setRendererReady(false);
    };
  }, []);

  // Render function passed to each card
  const renderToCanvas = useCallback((result: CreatureSimulationResult, canvas: HTMLCanvasElement) => {
    rendererRef.current?.renderToCanvas(result, canvas);
  }, []);

  // Calculate position for each creature based on sort state
  // We always render in the same order (by genome.id) but calculate visual positions
  // This allows CSS to animate position changes
  const positionMap = useMemo(() => {
    const map = new Map<string, { sortedIndex: number; originalIndex: number }>();

    // Get sorted indices
    const sortedResults = [...simulationResults]
      .map((result, originalIndex) => ({ result, originalIndex }))
      .sort((a, b) => {
        const aFit = isNaN(a.result.finalFitness) ? -Infinity : a.result.finalFitness;
        const bFit = isNaN(b.result.finalFitness) ? -Infinity : b.result.finalFitness;
        return bFit - aFit;
      });

    sortedResults.forEach((item, sortedIndex) => {
      map.set(item.result.genome.id, {
        sortedIndex,
        originalIndex: item.originalIndex,
      });
    });

    return map;
  }, [simulationResults]);

  // Always render in stable order (by original index) for consistent DOM
  const displayResults = useMemo(() => {
    return simulationResults.map((result, originalIndex) => ({ result, originalIndex }));
  }, [simulationResults]);

  // Compute cell assignments for stacking
  // Returns array of 100 cells, each containing the creatures assigned to it
  const cellData = useMemo((): CellData[] => {
    const totalCreatures = simulationResults.length;

    // Get sorted results (best fitness first)
    const sortedResults = [...simulationResults].sort((a, b) => {
      const aFit = isNaN(a.finalFitness) ? -Infinity : a.finalFitness;
      const bFit = isNaN(b.finalFitness) ? -Infinity : b.finalFitness;
      return bFit - aFit;
    });

    const cells: CellData[] = [];

    if (totalCreatures <= GRID_CELLS) {
      // No stacking needed - one creature per cell (or empty)
      for (let i = 0; i < GRID_CELLS; i++) {
        const creature = sortedResults[i] || null;
        cells.push({
          creatures: creature ? [creature] : [],
          stackDepth: creature ? 1 : 0,
          topCreature: creature,
          startRank: i + 1,
        });
      }
    } else {
      // Stacking needed
      // First 10 cells: individual top creatures
      for (let i = 0; i < TOP_INDIVIDUAL_COUNT; i++) {
        cells.push({
          creatures: [sortedResults[i]],
          stackDepth: 1,
          topCreature: sortedResults[i],
          startRank: i + 1,
        });
      }

      // Remaining 90 cells: stack the rest
      const remaining = totalCreatures - TOP_INDIVIDUAL_COUNT;
      const baseStackSize = Math.floor(remaining / REMAINING_CELLS);
      const extraCreatures = remaining % REMAINING_CELLS;

      // Stack from bottom: last cells get extra creatures
      let creatureIndex = TOP_INDIVIDUAL_COUNT;
      for (let cellIdx = 0; cellIdx < REMAINING_CELLS; cellIdx++) {
        // Cells toward the end (higher index = worse creatures) get extra stacking
        const isExtraCell = cellIdx >= (REMAINING_CELLS - extraCreatures);
        const stackSize = baseStackSize + (isExtraCell ? 1 : 0);

        const cellCreatures: CreatureSimulationResult[] = [];
        for (let j = 0; j < stackSize && creatureIndex < totalCreatures; j++) {
          cellCreatures.push(sortedResults[creatureIndex]);
          creatureIndex++;
        }

        cells.push({
          creatures: cellCreatures,
          stackDepth: cellCreatures.length,
          topCreature: cellCreatures[0] || null,
          startRank: TOP_INDIVIDUAL_COUNT + cellIdx * baseStackSize + Math.max(0, cellIdx - (REMAINING_CELLS - extraCreatures - 1)) + 1,
        });
      }
    }

    return cells;
  }, [simulationResults]);

  // Get grid position for a given index
  const getGridPosition = (index: number) => {
    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);
    return {
      x: col * (CARD_SIZE + CARD_GAP),
      y: row * (CARD_SIZE + CARD_GAP),
    };
  };

  // Calculate grid dimensions
  const gridWidth = GRID_COLS * CARD_SIZE + (GRID_COLS - 1) * CARD_GAP;
  const gridHeight = GRID_ROWS * CARD_SIZE + (GRID_ROWS - 1) * CARD_GAP;

  // Elite threshold (top 10%)
  const eliteCount = Math.floor(config.population_size * 0.1);

  const handleCardClick = (result: CreatureSimulationResult) => {
    // Don't allow replay for disqualified creatures
    // Allow click if frames are available OR if we can load them lazily (has API creature ID)
    const hasFramesOrCanLoad = result.frames.length > 0 || result.genome._apiCreatureId;
    if (hasFramesOrCanLoad && !result.disqualified) {
      setReplayResult(result);
    }
  };

  const handleCardHover = (event: React.MouseEvent, result: CreatureSimulationResult, rank: number, stackDepth?: number) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    showTooltip(result, rect, rank, stackDepth);
  };

  const handleCardLeave = () => {
    hideTooltip();
  };

  // Show loading state while waiting for results
  if (displayResults.length === 0) {
    return (
      <div
        className="creature-grid"
        style={{
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: '14px',
        }}
      >
        Loading creatures...
      </div>
    );
  }

  // Wait for renderer to be ready (should be fast)
  if (!rendererReady) {
    return null;
  }

  // Use stacking mode when population > 100
  const useStacking = simulationResults.length > GRID_CELLS;

  return (
    <div
      className="creature-grid"
      style={{
        width: `${gridWidth}px`,
        height: `${gridHeight}px`,
      }}
    >
      {useStacking ? (
        // Stacking mode: render cells with stackDepth
        cellData.map((cell, cellIndex) => {
          if (!cell.topCreature) return null;

          const pos = getGridPosition(cellIndex);
          // In stacking mode, only the top 10 individual cells (0-9) are elite
          const isElite = cellIndex < TOP_INDIVIDUAL_COUNT;
          const rank = cell.startRank;

          // Get animation state for top creature
          const animState = cardAnimationStates.get(cell.topCreature.genome.id);
          const isDead = animState?.isDead ?? false;
          const isFadingOut = animState?.isFadingOut ?? false;
          const isMutated = animState?.isMutated ?? false;
          const isSpawning = animState?.isSpawning ?? false;
          const isRepositioning = animState?.isRepositioning ?? false;

          // Use spawn position if spawning OR repositioning (for survivors moving to new positions)
          const useSpawnPos = (isSpawning || isRepositioning) && animState?.spawnFromX != null;
          const displayX = useSpawnPos ? animState.spawnFromX! : pos.x;
          const displayY = useSpawnPos && animState?.spawnFromY != null ? animState.spawnFromY : pos.y;

          return (
            <CreatureCard
              key={cell.topCreature.genome.id}
              result={cell.topCreature}
              isElite={isElite}
              isDead={isDead}
              isMutated={isMutated}
              isSpawning={isSpawning}
              isFadingOut={isFadingOut}
              isAnimatingPosition={isAnimatingSort}
              isRepositioning={isRepositioning}
              x={displayX}
              y={displayY}
              onClick={() => handleCardClick(cell.topCreature!)}
              onHover={(e) => handleCardHover(e, cell.topCreature!, rank, cell.stackDepth)}
              onLeave={handleCardLeave}
              renderToCanvas={renderToCanvas}
              stackDepth={cell.stackDepth}
            />
          );
        })
      ) : (
        // Normal mode: render individual creatures
        displayResults.map(({ result, originalIndex }) => {
          // Get position info from map
          const posInfo = positionMap.get(result.genome.id);
          const sortedIndex = posInfo?.sortedIndex ?? originalIndex;

          // Calculate visual position based on sort state
          const visualIndex = isSorted ? sortedIndex : originalIndex;
          const pos = getGridPosition(visualIndex);

          // Elite status is based on sorted position
          const isElite = sortedIndex < eliteCount;
          const rank = sortedIndex + 1;

          // Get animation state for this card
          const animState = cardAnimationStates.get(result.genome.id);
          const isDead = animState?.isDead ?? false;
          const isFadingOut = animState?.isFadingOut ?? false;
          const isMutated = animState?.isMutated ?? false;
          const isSpawning = animState?.isSpawning ?? false;
          const isRepositioning = animState?.isRepositioning ?? false;

          // Use spawn position if spawning OR repositioning (for survivors moving to new positions)
          const useSpawnPos = (isSpawning || isRepositioning) && animState?.spawnFromX != null;
          const displayX = useSpawnPos ? animState.spawnFromX! : pos.x;
          const displayY = useSpawnPos && animState?.spawnFromY != null ? animState.spawnFromY : pos.y;

          return (
            <CreatureCard
              key={result.genome.id}
              result={result}
              isElite={isElite}
              isDead={isDead}
              isMutated={isMutated}
              isSpawning={isSpawning}
              isFadingOut={isFadingOut}
              isAnimatingPosition={isAnimatingSort}
              isRepositioning={isRepositioning}
              x={displayX}
              y={displayY}
              onClick={() => handleCardClick(result)}
              onHover={(e) => handleCardHover(e, result, rank)}
              onLeave={handleCardLeave}
              renderToCanvas={renderToCanvas}
            />
          );
        })
      )}
    </div>
  );
}

export default CreatureGrid;
