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
   * Update longest survivor tracking.
   * Keeps the BEST performance (highest fitness) for the longest survivor,
   * not necessarily the latest generation's result.
   * Also sets _bestPerformanceGeneration so replay fetches the correct frames.
   */
  const updateLongestSurvivor = useCallback(
    (results: CreatureSimulationResult[], gen: number) => {
      const validResults = results.filter(
        (r) => !isNaN(r.finalFitness) && isFinite(r.finalFitness)
      );
      if (validResults.length === 0) return;

      // Find creature with highest survivalStreak
      const newLongest = validResults.reduce((longest, r) =>
        (r.genome.survivalStreak || 0) > (longest.genome.survivalStreak || 0) ? r : longest
      , validResults[0]);

      const newStreak = newLongest.genome.survivalStreak || 0;
      if (newStreak <= 0) return;

      const state = useEvolutionStore.getState();
      const current = state.longestSurvivingCreature;
      const currentStreak = state.longestSurvivingGenerations;

      // No current longest -> set new one
      // DON'T set _bestPerformanceGeneration - the backend will figure out the best
      if (!current) {
        setLongestSurvivor(newLongest, newStreak, gen);
        return;
      }

      const isSameCreature = newLongest.genome.id === current.genome.id;
      const hasHigherStreak = newStreak > currentStreak;
      const hasHigherFitness = newLongest.finalFitness > current.finalFitness;

      if (!isSameCreature && hasHigherStreak) {
        // New creature with higher streak takes the title
        // DON'T set _bestPerformanceGeneration - we don't know their best generation
        // The backend will figure it out by ordering by fitness DESC
        setLongestSurvivor(newLongest, newStreak, gen);
      } else if (isSameCreature && hasHigherFitness) {
        // Same creature with better performance -> update result and generation
        const resultWithGen = {
          ...newLongest,
          genome: { ...newLongest.genome, _bestPerformanceGeneration: gen },
        };
        setLongestSurvivor(resultWithGen, newStreak, gen);
      } else if (isSameCreature && !hasHigherFitness) {
        // Same creature with worse/equal performance -> keep best result, preserve _bestPerformanceGeneration
        const updatedGenome = {
          ...current.genome,
          survivalStreak: newStreak,
          // Keep the original _bestPerformanceGeneration
        };
        const updatedResult = { ...current, genome: updatedGenome };
        setLongestSurvivor(updatedResult, newStreak, gen);
      }
      // Otherwise: different creature with equal/lower streak -> no update
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
   * Run the mutate step with animation + backend call in parallel:
   * 1. Start backend call immediately
   * 2. Run culling animation (mark dead, fade out) while backend processes
   * 3. When both complete, show real creatures with fitness hidden
   * 4. Spawn animation for offspring
   * 5. Wait for user to click "Simulate" to reveal fitness
   */
  const runMutateStep = useCallback(async (fastMode: boolean = false) => {
    const currentResults = useEvolutionStore.getState().simulationResults;
    const currentGen = useEvolutionStore.getState().generation;
    const currentConfig = useEvolutionStore.getState().config;

    const runId = StorageService.getCurrentRunId();
    if (!runId) {
      showError('No active run');
      return;
    }

    // Sort current results by fitness to find bottom cullPercentage%
    const sortedResults = [...currentResults].sort((a, b) => {
      const aFit = isNaN(a.finalFitness) ? -Infinity : a.finalFitness;
      const bFit = isNaN(b.finalFitness) ? -Infinity : b.finalFitness;
      return bFit - aFit;
    });

    const survivorCount = Math.floor(sortedResults.length * (1 - currentConfig.cullPercentage));
    const deadCreatures = sortedResults.slice(survivorCount);

    // Check for dying creatures that might be longest survivors
    // Use same smart logic: keep best performance, set _bestPerformanceGeneration for replay
    for (const dead of deadCreatures) {
      const streak = dead.genome.survivalStreak || 0;
      if (streak > 0) {
        const state = useEvolutionStore.getState();
        const current = state.longestSurvivingCreature;
        const currentStreak = state.longestSurvivingGenerations;

        if (streak > currentStreak) {
          const isSameCreature = current && dead.genome.id === current.genome.id;
          if (isSameCreature) {
            // Same creature dying - keep their best performance, preserve _bestPerformanceGeneration
            const hasHigherFitness = dead.finalFitness > current.finalFitness;
            if (hasHigherFitness) {
              const resultWithGen = {
                ...dead,
                genome: { ...dead.genome, _bestPerformanceGeneration: currentGen },
              };
              setLongestSurvivor(resultWithGen, streak, currentGen + 1);
            } else {
              // Keep best result with original _bestPerformanceGeneration
              const updatedGenome = { ...current.genome, survivalStreak: streak };
              const updatedResult = { ...current, genome: updatedGenome };
              setLongestSurvivor(updatedResult, streak, currentGen + 1);
            }
          } else {
            // New creature takes the title
            // DON'T set _bestPerformanceGeneration - we don't know their best generation
            // The backend will figure it out by ordering by fitness DESC
            setLongestSurvivor(dead, streak, currentGen + 1);
          }
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

    // === START BACKEND CALL IMMEDIATELY (runs in parallel with animation) ===
    const backendPromise = Api.evolutionStep(runId);

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

    // === WAIT FOR BACKEND TO COMPLETE ===
    // Show progress if backend is still running after animation completes
    if (!fastMode) {
      setSimulationProgress({ completed: 0, total: currentConfig.populationSize });
    }
    const response = await backendPromise;
    setSimulationProgress(null);
    const newResults = response.creatures.map(apiCreatureToResult);

    // Store the real fitness values but display with fitness hidden
    // We'll store actual fitness in a separate field and show NaN until "Simulate" is clicked
    const resultsWithHiddenFitness = newResults.map((result) => ({
      ...result,
      _actualFitness: result.finalFitness, // Store real fitness
      finalFitness: NaN, // Hide fitness until Simulate clicked
    }));

    // Update generation info
    setGeneration(response.generation);
    setMaxGeneration(response.generation);

    // === PHASE 3: Show real creatures with spawn animation ===
    if (!fastMode) {
      const newAnimStates = new Map<string, CardAnimationState>();
      for (const result of resultsWithHiddenFitness) {
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

    setSimulationResults(resultsWithHiddenFitness);

    if (!fastMode) {
      await delay(50);

      // Clear spawning state to trigger animation
      const transitionAnimStates = new Map<string, CardAnimationState>();
      for (const result of resultsWithHiddenFitness) {
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

    // Transition to simulate step - wait for user to click Simulate to reveal fitness
    setEvolutionStep('simulate');
  }, [setGeneration, setMaxGeneration, setSimulationResults, setEvolutionStep, setCardAnimationStates, setLongestSurvivor, setSimulationProgress]);

  /**
   * Run the simulate step: show progress animation then reveal fitness values.
   * Data is already loaded during mutate - this is just a visual effect.
   */
  const runSimulateStep = useCallback(async (fastMode: boolean = false) => {
    const currentResults = useEvolutionStore.getState().simulationResults;
    const currentConfig = useEvolutionStore.getState().config;

    // Show quick progress animation (data already loaded, this is just for UX)
    if (!fastMode) {
      setSimulationProgress({ completed: 0, total: currentConfig.populationSize });
      await delay(800); // Quick animation duration
      setSimulationProgress(null);
    }

    // Reveal the actual fitness values (stored in _actualFitness during mutate)
    const resultsWithFitness = currentResults.map((result) => ({
      ...result,
      finalFitness: (result as CreatureSimulationResult & { _actualFitness?: number })._actualFitness ?? result.finalFitness,
    }));

    setSimulationResults(resultsWithFitness);

    // Clear animation states (offspring are no longer "new")
    clearCardAnimationStates();

    // Transition to sort step
    setEvolutionStep('sort');
  }, [setSimulationResults, setEvolutionStep, clearCardAnimationStates, setSimulationProgress]);

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
   * Manual step-through flow: idle → mutate → simulate → sort → idle
   */
  const executeNextStep = useCallback(async () => {
    const currentStep = useEvolutionStore.getState().evolutionStep;

    if (currentStep === 'idle') {
      setEvolutionStep('mutate');
      await runMutateStep();
      // runMutateStep sets evolutionStep to 'simulate' when done
    } else if (currentStep === 'simulate') {
      await runSimulateStep();
      // runSimulateStep sets evolutionStep to 'sort' when done
    } else if (currentStep === 'sort') {
      await runSortStep();
      // runSortStep sets evolutionStep to 'idle' when done
    }
  }, [setEvolutionStep, runMutateStep, runSimulateStep, runSortStep]);

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

            // Use same smart logic: keep best performance, set _bestPerformanceGeneration for replay
            for (const dead of dyingCreatures) {
              const streak = dead.genome.survivalStreak || 0;
              if (streak > 0) {
                const state = useEvolutionStore.getState();
                const current = state.longestSurvivingCreature;
                const currentLongestGens = state.longestSurvivingGenerations;

                if (streak > currentLongestGens) {
                  const isSameCreature = current && dead.genome.id === current.genome.id;
                  if (isSameCreature) {
                    // Same creature dying - keep their best performance, preserve _bestPerformanceGeneration
                    const hasHigherFitness = dead.finalFitness > current.finalFitness;
                    if (hasHigherFitness) {
                      const resultWithGen = {
                        ...dead,
                        genome: { ...dead.genome, _bestPerformanceGeneration: currentGen },
                      };
                      setLongestSurvivor(resultWithGen, streak, currentGen + 1);
                    } else {
                      // Keep best result with original _bestPerformanceGeneration
                      const updatedGenome = { ...current.genome, survivalStreak: streak };
                      const updatedResult = { ...current, genome: updatedGenome };
                      setLongestSurvivor(updatedResult, streak, currentGen + 1);
                    }
                  } else {
                    // New creature takes the title
                    // DON'T set _bestPerformanceGeneration - we don't know their best generation
                    // The backend will figure it out by ordering by fitness DESC
                    setLongestSurvivor(dead, streak, currentGen + 1);
                  }
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
