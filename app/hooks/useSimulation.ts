'use client';

import { useCallback } from 'react';
import { useEvolutionStore, type CardAnimationState } from '../stores/evolutionStore';
import * as Api from '../../src/services/ApiClient';
import * as StorageService from '../../src/services/StorageService';
import type { CreatureSimulationResult, DisqualificationReason } from '../../src/types';

// Get showError from store for non-hook context
const showError = (message: string) => useEvolutionStore.getState().showError(message);

// Animation timing constants (matches vanilla app)
const MARK_DEAD_DELAY = 600;
const FADE_OUT_DELAY = 400;
const SPAWN_DELAY = 600;
const SORT_DELAY = 700;

// Helper: delay function
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Module-level state for auto-run control
let autoRunning = false;

/**
 * Convert API evolution creature to CreatureSimulationResult format
 */
function apiCreatureToResult(creature: Api.ApiEvolutionCreature): CreatureSimulationResult {
  const genome = Api.fromApiGenome(creature.genome);
  genome._apiCreatureId = creature.id;

  return {
    genome,
    frames: [], // Frames loaded lazily for replay
    finalFitness: creature.fitness,
    pelletsCollected: creature.pellets_collected,
    distanceTraveled: 0,
    netDisplacement: 0,
    closestPelletDistance: 0,
    pellets: [],
    fitnessOverTime: [],
    disqualified: creature.disqualified_reason as DisqualificationReason,
    // Store additional data for UI
    _isSurvivor: creature.is_survivor,
    _hasFrames: creature.has_frames,
  };
}

/**
 * Hook for managing simulation lifecycle.
 * Uses backend-owned evolution - frontend is a thin UI layer.
 *
 * Data flow:
 * 1. POST /api/runs → create run
 * 2. POST /api/evolution/{runId}/step → backend does genetics + simulation + storage
 * 3. Display creatures from response
 */
export function useSimulation() {

  // Get store state and actions
  const fitnessHistory = useEvolutionStore((s) => s.fitnessHistory);

  const setAppState = useEvolutionStore((s) => s.setAppState);
  const setEvolutionStep = useEvolutionStore((s) => s.setEvolutionStep);
  const setGeneration = useEvolutionStore((s) => s.setGeneration);
  const setMaxGeneration = useEvolutionStore((s) => s.setMaxGeneration);
  const setViewingGeneration = useEvolutionStore((s) => s.setViewingGeneration);
  const setIsAutoRunning = useEvolutionStore((s) => s.setIsAutoRunning);
  const setSimulationResults = useEvolutionStore((s) => s.setSimulationResults);
  const setFitnessHistory = useEvolutionStore((s) => s.setFitnessHistory);
  const setCreatureTypeHistory = useEvolutionStore((s) => s.setCreatureTypeHistory);
  const setBestCreature = useEvolutionStore((s) => s.setBestCreature);
  const setLongestSurvivor = useEvolutionStore((s) => s.setLongestSurvivor);
  const setSimulationProgress = useEvolutionStore((s) => s.setSimulationProgress);
  const setCardAnimationStates = useEvolutionStore((s) => s.setCardAnimationStates);
  const clearCardAnimationStates = useEvolutionStore((s) => s.clearCardAnimationStates);
  const setSortAnimationTriggered = useEvolutionStore((s) => s.setSortAnimationTriggered);

  /**
   * Update fitness history from evolution response
   */
  const updateFitnessHistory = useCallback(
    (response: Api.ApiEvolutionStepResponse, history: typeof fitnessHistory) => {
      const newEntry = {
        generation: response.generation,
        best: response.best_fitness,
        average: response.avg_fitness,
        worst: response.worst_fitness,
      };
      const newHistory = [...history, newEntry];
      setFitnessHistory(newHistory);
      return newHistory;
    },
    [setFitnessHistory]
  );

  /**
   * Update creature type history from results
   */
  const updateCreatureTypeHistory = useCallback(
    (results: CreatureSimulationResult[], gen: number) => {
      const nodeCountDistribution = new Map<number, number>();
      for (const result of results) {
        const nodeCount = result.genome.nodes.length;
        nodeCountDistribution.set(nodeCount, (nodeCountDistribution.get(nodeCount) || 0) + 1);
      }

      const newEntry = { generation: gen, nodeCountDistribution };
      const currentHistory = useEvolutionStore.getState().creatureTypeHistory;
      const newHistory = [...currentHistory, newEntry];
      setCreatureTypeHistory(newHistory);
    },
    [setCreatureTypeHistory]
  );

  /**
   * Update best creature tracking
   */
  const updateBestCreature = useCallback(
    (results: CreatureSimulationResult[], gen: number) => {
      const validResults = results.filter(
        (r) => !isNaN(r.finalFitness) && isFinite(r.finalFitness)
      );
      if (validResults.length === 0) return;

      const best = validResults.reduce((b, r) =>
        r.finalFitness > b.finalFitness ? r : b
      );

      const currentBest = useEvolutionStore.getState().bestCreatureEver;
      if (!currentBest || best.finalFitness > currentBest.finalFitness) {
        setBestCreature(best, gen);
      }
    },
    [setBestCreature]
  );

  /**
   * Update longest survivor tracking
   */
  const updateLongestSurvivor = useCallback(
    (results: CreatureSimulationResult[], gen: number) => {
      const validResults = results.filter(
        (r) => !isNaN(r.finalFitness) && isFinite(r.finalFitness)
      );
      if (validResults.length === 0) return;

      // Find creature with highest survivalStreak
      const longestSurvivor = validResults.reduce((longest, r) =>
        (r.genome.survivalStreak || 0) > (longest.genome.survivalStreak || 0) ? r : longest
      , validResults[0]);

      const streak = longestSurvivor.genome.survivalStreak || 0;
      const currentLongestGens = useEvolutionStore.getState().longestSurvivingGenerations;

      if (streak > 0 && streak > currentLongestGens) {
        setLongestSurvivor(longestSurvivor, streak, gen);
      }
    },
    [setLongestSurvivor]
  );

  /**
   * Start a new evolution simulation
   */
  const startSimulation = useCallback(async () => {
    try {
      // Get config BEFORE any resets
      const currentConfig = useEvolutionStore.getState().config;

      // Reset evolution state but NOT config
      setGeneration(0);
      setMaxGeneration(0);
      setViewingGeneration(null);
      setSimulationResults([]);
      setFitnessHistory([]);
      setCreatureTypeHistory([]);
      setBestCreature(null, 0);
      setLongestSurvivor(null, 0, 0);

      // Initialize storage and create new run
      await StorageService.initStorage();
      const runId = await StorageService.createRun(currentConfig);

      // Show progress UI
      setSimulationProgress({ completed: 0, total: currentConfig.populationSize });
      setEvolutionStep('simulate');
      setAppState('grid');

      // Run initial generation via backend
      const response = await Api.evolutionStep(runId);

      // Convert API creatures to results
      const results = response.creatures.map(apiCreatureToResult);

      setSimulationProgress(null);

      // Update store with results
      setSimulationResults(results);
      setGeneration(response.generation);
      setMaxGeneration(response.generation);

      // Record history
      updateFitnessHistory(response, []);
      updateCreatureTypeHistory(results, response.generation);
      updateBestCreature(results, response.generation);

      // Reset to idle state
      setEvolutionStep('idle');

      return { results, runId };
    } catch (error) {
      console.error('Failed to start simulation:', error);
      showError('Failed to start simulation. Please try again.');
      setSimulationProgress(null);
      throw error;
    }
  }, [
    setAppState,
    setEvolutionStep,
    setSimulationResults,
    setGeneration,
    setMaxGeneration,
    setViewingGeneration,
    setFitnessHistory,
    setCreatureTypeHistory,
    setBestCreature,
    setLongestSurvivor,
    setSimulationProgress,
    updateFitnessHistory,
    updateCreatureTypeHistory,
    updateBestCreature,
  ]);

  /**
   * Run the mutate step with 3-phase animation:
   * Phase 1: Mark bottom 50% as dead (600ms)
   * Phase 2: Fade out dead cards (400ms)
   * Phase 3: Spawn new offspring from parent positions (600ms)
   */
  const runMutateStep = useCallback(async (fastMode: boolean = false) => {
    const currentResults = useEvolutionStore.getState().simulationResults;
    const currentGen = useEvolutionStore.getState().generation;
    const currentConfig = useEvolutionStore.getState().config;

    // Sort current results by fitness to find bottom cullPercentage%
    const sortedResults = [...currentResults].sort((a, b) => {
      const aFit = isNaN(a.finalFitness) ? -Infinity : a.finalFitness;
      const bFit = isNaN(b.finalFitness) ? -Infinity : b.finalFitness;
      return bFit - aFit;
    });

    const survivorCount = Math.floor(sortedResults.length * (1 - currentConfig.cullPercentage));
    const deadCreatures = sortedResults.slice(survivorCount);

    // Check for dying creatures that might be longest survivors
    for (const dead of deadCreatures) {
      const streak = dead.genome.survivalStreak || 0;
      if (streak > 0) {
        const currentLongestGens = useEvolutionStore.getState().longestSurvivingGenerations;
        if (streak > currentLongestGens) {
          setLongestSurvivor(dead, streak, currentGen + 1);
        }
      }
    }

    // Grid position helper
    const GRID_COLS = 10;
    const CARD_SIZE = 80;
    const CARD_GAP = 8;
    const getGridPosition = (index: number) => ({
      x: (index % GRID_COLS) * (CARD_SIZE + CARD_GAP),
      y: Math.floor(index / GRID_COLS) * (CARD_SIZE + CARD_GAP),
    });

    // Build map of survivor positions
    const survivorPositions: { x: number; y: number }[] = [];
    for (let i = 0; i < survivorCount; i++) {
      survivorPositions.push(getGridPosition(i));
    }

    // === PHASE 1: Mark dead creatures with red border (600ms) ===
    if (!fastMode) {
      const animStates = new Map<string, CardAnimationState>();
      for (const result of currentResults) {
        const isDead = deadCreatures.some((d) => d.genome.id === result.genome.id);
        animStates.set(result.genome.id, {
          isDead,
          isFadingOut: false,
          isMutated: false,
          isSpawning: false,
          spawnFromX: null,
          spawnFromY: null,
        });
      }
      setCardAnimationStates(animStates);
      await delay(MARK_DEAD_DELAY);
    }

    // === PHASE 2: Fade out dead cards (400ms) ===
    if (!fastMode) {
      const fadeStates = new Map<string, CardAnimationState>();
      for (const result of currentResults) {
        const isDead = deadCreatures.some((d) => d.genome.id === result.genome.id);
        fadeStates.set(result.genome.id, {
          isDead,
          isFadingOut: isDead,
          isMutated: false,
          isSpawning: false,
          spawnFromX: null,
          spawnFromY: null,
        });
      }
      setCardAnimationStates(fadeStates);
      await delay(FADE_OUT_DELAY);
    }

    // === PHASE 3: Call backend evolution step ===
    setEvolutionStep('simulate');
    const runId = StorageService.getCurrentRunId();
    if (!runId) {
      showError('No active run');
      return;
    }

    const response = await Api.evolutionStep(runId);
    const newResults = response.creatures.map(apiCreatureToResult);

    // Set up animation states for spawn animation
    if (!fastMode) {
      const newAnimStates = new Map<string, CardAnimationState>();
      for (const result of newResults) {
        const isSurvivor = (result as CreatureSimulationResult & { _isSurvivor?: boolean })._isSurvivor;

        let spawnFromX: number | null = null;
        let spawnFromY: number | null = null;
        if (!isSurvivor && survivorPositions.length > 0) {
          const randomParentPos = survivorPositions[Math.floor(Math.random() * survivorPositions.length)];
          spawnFromX = randomParentPos.x;
          spawnFromY = randomParentPos.y;
        }

        newAnimStates.set(result.genome.id, {
          isDead: false,
          isFadingOut: false,
          isMutated: !isSurvivor,
          isSpawning: !isSurvivor,
          spawnFromX,
          spawnFromY,
        });
      }
      setCardAnimationStates(newAnimStates);
    }

    setSimulationResults(newResults);
    setGeneration(response.generation);
    setMaxGeneration(response.generation);

    if (!fastMode) {
      await delay(50);

      // Clear spawning state to trigger animation
      const transitionAnimStates = new Map<string, CardAnimationState>();
      for (const result of newResults) {
        const isSurvivor = (result as CreatureSimulationResult & { _isSurvivor?: boolean })._isSurvivor;
        transitionAnimStates.set(result.genome.id, {
          isDead: false,
          isFadingOut: false,
          isMutated: !isSurvivor,
          isSpawning: false,
          spawnFromX: null,
          spawnFromY: null,
        });
      }
      setCardAnimationStates(transitionAnimStates);
      await delay(SPAWN_DELAY);
    }

    setEvolutionStep('sort');
  }, [setGeneration, setMaxGeneration, setSimulationResults, setEvolutionStep, setCardAnimationStates, setLongestSurvivor]);

  /**
   * Run the sort step (reorder by fitness with animation, record history)
   */
  const runSortStep = useCallback(async (fastMode: boolean = false) => {
    const currentGen = useEvolutionStore.getState().generation;
    const results = useEvolutionStore.getState().simulationResults;
    const history = useEvolutionStore.getState().fitnessHistory;

    // Clear mutated states
    clearCardAnimationStates();

    // Trigger sort animation
    if (!fastMode) {
      setSortAnimationTriggered(true);
      await delay(SORT_DELAY);
      setSortAnimationTriggered(false);
    }

    // Get the latest response stats (we need to reconstruct from results)
    const validResults = results.filter(r => !isNaN(r.finalFitness) && isFinite(r.finalFitness));
    if (validResults.length > 0) {
      const fitnesses = validResults.map(r => r.finalFitness).sort((a, b) => b - a);
      const newEntry = {
        generation: currentGen,
        best: fitnesses[0],
        average: fitnesses.reduce((s, f) => s + f, 0) / fitnesses.length,
        worst: fitnesses[fitnesses.length - 1],
      };
      setFitnessHistory([...history, newEntry]);
    }

    updateCreatureTypeHistory(results, currentGen);
    updateBestCreature(results, currentGen);
    updateLongestSurvivor(results, currentGen);

    setEvolutionStep('idle');
  }, [setEvolutionStep, clearCardAnimationStates, setSortAnimationTriggered, setFitnessHistory, updateCreatureTypeHistory, updateBestCreature, updateLongestSurvivor]);

  /**
   * Execute one step in the evolution cycle.
   */
  const executeNextStep = useCallback(async () => {
    const currentStep = useEvolutionStore.getState().evolutionStep;

    if (currentStep === 'idle') {
      setEvolutionStep('mutate');
      await runMutateStep();
      // runMutateStep sets evolutionStep to 'sort' when done
    } else if (currentStep === 'sort') {
      await runSortStep();
      // runSortStep sets evolutionStep to 'idle' when done
    }
  }, [setEvolutionStep, runMutateStep, runSortStep]);

  /**
   * Auto-run for a specific number of generations
   */
  const autoRun = useCallback(
    async (generations: number) => {
      if (autoRunning) return;

      const runId = StorageService.getCurrentRunId();
      if (!runId) return;

      autoRunning = true;
      setIsAutoRunning(true);

      try {
        let history = useEvolutionStore.getState().fitnessHistory;

        for (let i = 0; i < generations; i++) {
          if (!autoRunning) break;

          // Check for dying creatures before evolution
          const previousResults = useEvolutionStore.getState().simulationResults;
          const currentConfig = useEvolutionStore.getState().config;
          const currentGen = useEvolutionStore.getState().generation;

          if (previousResults.length > 0) {
            const sortedPrev = [...previousResults].sort((a, b) => {
              const aFit = isNaN(a.finalFitness) ? -Infinity : a.finalFitness;
              const bFit = isNaN(b.finalFitness) ? -Infinity : b.finalFitness;
              return bFit - aFit;
            });
            const survivorCount = Math.floor(sortedPrev.length * (1 - currentConfig.cullPercentage));
            const dyingCreatures = sortedPrev.slice(survivorCount);

            for (const dead of dyingCreatures) {
              const streak = dead.genome.survivalStreak || 0;
              if (streak > 0) {
                const currentLongestGens = useEvolutionStore.getState().longestSurvivingGenerations;
                if (streak > currentLongestGens) {
                  setLongestSurvivor(dead, streak, currentGen + 1);
                }
              }
            }
          }

          // Run evolution step
          const response = await Api.evolutionStep(runId);
          const results = response.creatures.map(apiCreatureToResult);

          // Update fitness history
          const newEntry = {
            generation: response.generation,
            best: response.best_fitness,
            average: response.avg_fitness,
            worst: response.worst_fitness,
          };
          history = [...history, newEntry];

          // Update creature type history
          const nodeCountDistribution = new Map<number, number>();
          for (const result of results) {
            const nodeCount = result.genome.nodes.length;
            nodeCountDistribution.set(nodeCount, (nodeCountDistribution.get(nodeCount) || 0) + 1);
          }
          const typeEntry = { generation: response.generation, nodeCountDistribution };
          const currentTypeHistory = useEvolutionStore.getState().creatureTypeHistory;
          setCreatureTypeHistory([...currentTypeHistory, typeEntry]);

          // Update best creature
          updateBestCreature(results, response.generation);

          // Update longest survivor
          updateLongestSurvivor(results, response.generation);

          // Update UI
          setFitnessHistory(history);
          setGeneration(response.generation);
          setMaxGeneration(response.generation);

          // Only update creature grid on last iteration
          if (i === generations - 1 || !autoRunning) {
            setSimulationResults(results);
          }
        }
      } finally {
        autoRunning = false;
        setIsAutoRunning(false);
        setEvolutionStep('idle');
        clearCardAnimationStates();
      }
    },
    [setIsAutoRunning, setEvolutionStep, setSimulationResults, setGeneration, setMaxGeneration,
     setFitnessHistory, setCreatureTypeHistory, setLongestSurvivor, updateBestCreature, updateLongestSurvivor, clearCardAnimationStates]
  );

  /**
   * Stop auto-run
   */
  const stopAutoRun = useCallback(() => {
    autoRunning = false;
    setIsAutoRunning(false);
  }, [setIsAutoRunning]);

  /**
   * Load a saved run
   */
  const loadRun = useCallback(
    async (runId: string) => {
      try {
        await StorageService.initStorage();
        const run = await StorageService.getRun(runId);
        if (!run) {
          showError('Run not found');
          return;
        }

        const maxGen = run.generationCount - 1;
        if (maxGen < 0) {
          showError('No saved generations in this run');
          return;
        }

        // Load the most recent generation
        const results = await StorageService.loadGeneration(runId, maxGen, run.config);
        if (!results) {
          showError('Could not load generation data');
          return;
        }

        // Set up state
        StorageService.setCurrentRunId(runId);

        // Update store
        useEvolutionStore.setState({
          appState: 'grid',
          config: run.config,
          generation: maxGen,
          maxGeneration: maxGen,
          viewingGeneration: null,
          evolutionStep: 'idle',
          simulationResults: results,
          runName: run.name || '',
          fitnessHistory: run.fitnessHistory || [],
          creatureTypeHistory: run.creatureTypeHistory
            ? run.creatureTypeHistory.map((e) => ({
                generation: e.generation,
                nodeCountDistribution: new Map(e.nodeCountDistribution),
              }))
            : [],
          graphsVisible: true,
        });

        // Restore best creature
        if (run.bestCreature) {
          const expanded = StorageService.expandCreatureResult(run.bestCreature.result, run.config);
          setBestCreature(expanded, run.bestCreature.generation);
        }

        // Restore longest survivor
        if (run.longestSurvivor) {
          const expanded = StorageService.expandCreatureResult(
            run.longestSurvivor.result,
            run.config
          );
          setLongestSurvivor(
            expanded,
            run.longestSurvivor.generations,
            run.longestSurvivor.diedAtGeneration
          );
        }
      } catch (error) {
        console.error('Error loading run:', error);
        showError('Failed to load run');
      }
    },
    [setBestCreature, setLongestSurvivor]
  );

  /**
   * Navigate to a specific generation (view history)
   */
  const viewGeneration = useCallback(async (gen: number) => {
    const currentRunId = StorageService.getCurrentRunId();
    if (!currentRunId) return;

    const currentConfig = useEvolutionStore.getState().config;
    const results = await StorageService.loadGeneration(currentRunId, gen, currentConfig);
    if (results) {
      setSimulationResults(results);
      setViewingGeneration(gen);
    }
  }, [setSimulationResults, setViewingGeneration]);

  /**
   * Return to current (live) generation
   */
  const returnToCurrentGeneration = useCallback(async () => {
    const currentRunId = StorageService.getCurrentRunId();
    const currentGen = useEvolutionStore.getState().generation;
    const currentConfig = useEvolutionStore.getState().config;

    if (!currentRunId) return;

    const results = await StorageService.loadGeneration(currentRunId, currentGen, currentConfig);
    if (results) {
      setSimulationResults(results);
      setViewingGeneration(null);
    }
  }, [setSimulationResults, setViewingGeneration]);

  /**
   * Fork the current run from a specific generation
   */
  const forkFromGeneration = useCallback(async () => {
    const viewingGen = useEvolutionStore.getState().viewingGeneration;
    if (viewingGen === null) return;

    const currentRunId = StorageService.getCurrentRunId();
    if (!currentRunId) return;

    try {
      // Fork the run up to the viewing generation
      const newRunId = await StorageService.forkRun(currentRunId, viewingGen);

      // Load the forked run
      const run = await StorageService.getRun(newRunId);
      if (!run) throw new Error('Failed to load forked run');

      // Load the generation results
      const results = await StorageService.loadGeneration(newRunId, viewingGen, run.config);
      if (!results) throw new Error('Failed to load generation data');

      // Restore best creature
      let bestCreature: CreatureSimulationResult | null = null;
      let bestCreatureGen = 0;
      if (run.bestCreature) {
        try {
          bestCreature = StorageService.expandCreatureResult(run.bestCreature.result, run.config);
          bestCreatureGen = run.bestCreature.generation;
        } catch (e) {
          console.error('Failed to expand best creature in fork:', e);
        }
      }

      // Restore longest survivor
      let longestSurvivor: CreatureSimulationResult | null = null;
      let longestSurvivorGens = 0;
      let longestSurvivorDiedAt = 0;
      if (run.longestSurvivor) {
        try {
          longestSurvivor = StorageService.expandCreatureResult(run.longestSurvivor.result, run.config);
          longestSurvivorGens = run.longestSurvivor.generations;
          longestSurvivorDiedAt = run.longestSurvivor.diedAtGeneration ?? viewingGen;
        } catch (e) {
          console.error('Failed to expand longest survivor in fork:', e);
        }
      }

      // Update all state at once
      useEvolutionStore.setState({
        generation: viewingGen,
        maxGeneration: viewingGen,
        viewingGeneration: null,
        evolutionStep: 'idle',
        simulationResults: results,
        runName: run.name || '',
        fitnessHistory: run.fitnessHistory || [],
        creatureTypeHistory: run.creatureTypeHistory
          ? run.creatureTypeHistory.map((e) => ({
              generation: e.generation,
              nodeCountDistribution: new Map(e.nodeCountDistribution),
            }))
          : [],
        bestCreatureEver: bestCreature,
        bestCreatureGeneration: bestCreatureGen,
        longestSurvivingCreature: longestSurvivor,
        longestSurvivingGenerations: longestSurvivorGens,
        longestSurvivingDiedAt: longestSurvivorDiedAt,
      });

      // Clear any animation states
      clearCardAnimationStates();

      return newRunId;
    } catch (error) {
      console.error('Failed to fork run:', error);
      showError('Failed to fork run');
      return null;
    }
  }, [clearCardAnimationStates]);

  return {
    startSimulation,
    executeNextStep,
    autoRun,
    stopAutoRun,
    loadRun,
    viewGeneration,
    returnToCurrentGeneration,
    forkFromGeneration,
  };
}
