'use client';

import { useCallback } from 'react';
import { useEvolutionStore, type CardAnimationState } from '../stores/evolutionStore';
import * as SimulationService from '../../src/services/SimulationService';
import * as StorageService from '../../src/services/StorageService';
import * as SimState from '../lib/simulationState';
import type { CreatureSimulationResult } from '../../src/simulation/BatchSimulator';

// Get showError from store for non-hook context
const showError = (message: string) => useEvolutionStore.getState().showError(message);

// Animation timing constants (matches vanilla app)
const MARK_DEAD_DELAY = 600;
const FADE_OUT_DELAY = 400;
const SPAWN_DELAY = 600;
const SORT_DELAY = 700;

// Helper: delay function
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Hook for managing simulation lifecycle.
 * Handles the evolution cycle: mutate -> simulate -> sort
 *
 * Uses shared module state (simulationState.ts) for population
 * so it persists across component remounts.
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

  /**
   * Record fitness history for current generation
   */
  const recordFitnessHistory = useCallback(
    async (results: CreatureSimulationResult[], gen: number, history: typeof fitnessHistory) => {
      const stats = SimulationService.calculateFitnessStats(results);
      if (stats.validCount === 0) return history;

      const newEntry = {
        generation: gen,
        best: stats.best,
        average: stats.average,
        worst: stats.worst,
      };

      const newHistory = [...history, newEntry];
      setFitnessHistory(newHistory);
      await StorageService.updateFitnessHistory(newHistory);
      return newHistory;
    },
    [setFitnessHistory]
  );

  /**
   * Record creature type history (node count distribution)
   */
  const recordCreatureTypeHistory = useCallback(
    async (results: CreatureSimulationResult[], gen: number) => {
      const nodeCountDistribution = new Map<number, number>();
      for (const result of results) {
        const nodeCount = result.genome.nodes.length;
        nodeCountDistribution.set(nodeCount, (nodeCountDistribution.get(nodeCount) || 0) + 1);
      }

      const newEntry = { generation: gen, nodeCountDistribution };
      const currentHistory = useEvolutionStore.getState().creatureTypeHistory;
      const newHistory = [...currentHistory, newEntry];
      setCreatureTypeHistory(newHistory);
      await StorageService.updateCreatureTypeHistory(newHistory);
    },
    [setCreatureTypeHistory]
  );

  /**
   * Update best creature tracking
   */
  const updateBestCreature = useCallback(
    (results: CreatureSimulationResult[], gen: number) => {
      const best = SimulationService.findBestCreature(results);
      if (!best) return;

      const currentBest = useEvolutionStore.getState().bestCreatureEver;
      if (!currentBest || best.finalFitness > currentBest.finalFitness) {
        setBestCreature(best, gen);
        StorageService.updateBestCreature(best, gen);
      }
    },
    [setBestCreature]
  );

  /**
   * Update longest survivor tracking (creature with highest survivalStreak)
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
        StorageService.updateLongestSurvivor(longestSurvivor, streak, gen);
      }
    },
    [setLongestSurvivor]
  );

  /**
   * Start a new evolution simulation
   */
  const startSimulation = useCallback(async () => {
    try {
      // Get config BEFORE any resets - this is what the user configured
      const currentConfig = useEvolutionStore.getState().config;

      // Reset evolution state but NOT config (matches vanilla behavior)
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

      // Create initial population
      const population = SimulationService.createInitialPopulation(currentConfig);
      SimState.setPopulation(population);

      // Switch to grid view FIRST, then show simulation progress there
      setEvolutionStep('simulate');
      setAppState('grid');

      // Run initial simulation (progress bar shows in grid view)
      const genomes = population.getGenomes();
      const results = await SimulationService.runSimulation(genomes, currentConfig, (progress) => {
        setSimulationProgress(progress);
      });
      setSimulationProgress(null);

      // Update population fitness
      SimulationService.updatePopulationFitness(population, results);

      // Update store with results
      setSimulationResults(results);

      // Record history for gen 0
      recordFitnessHistory(results, 0, []);
      recordCreatureTypeHistory(results, 0);
      updateBestCreature(results, 0);

      // Save to storage
      await StorageService.saveGeneration(0, results);

      // Reset to idle state after initial simulation
      setEvolutionStep('idle');

      return { results, runId };
    } catch (error) {
      console.error('Failed to start simulation:', error);
      showError('Failed to start simulation. Please try again.');
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
    recordFitnessHistory,
    recordCreatureTypeHistory,
    updateBestCreature,
  ]);

  /**
   * Run the mutate step with 3-phase animation:
   * Phase 1: Mark bottom 50% as dead (600ms)
   * Phase 2: Fade out dead cards (400ms)
   * Phase 3: Spawn new offspring from parent positions (600ms)
   */
  const runMutateStep = useCallback(async (fastMode: boolean = false) => {
    const population = SimState.getPopulation();
    if (!population) return;

    const currentResults = useEvolutionStore.getState().simulationResults;
    const currentGen = useEvolutionStore.getState().generation;

    // Sort current results by fitness to find bottom cullPercentage%
    const currentConfig = useEvolutionStore.getState().config;
    const sortedResults = [...currentResults].sort((a, b) => {
      const aFit = isNaN(a.finalFitness) ? -Infinity : a.finalFitness;
      const bFit = isNaN(b.finalFitness) ? -Infinity : b.finalFitness;
      return bFit - aFit;
    });

    // cullPercentage is the fraction killed, so survivors = 1 - cullPercentage
    const survivorCount = Math.floor(sortedResults.length * (1 - currentConfig.cullPercentage));
    const survivors = sortedResults.slice(0, survivorCount);
    const deadCreatures = sortedResults.slice(survivorCount);

    // Grid position helper
    const GRID_COLS = 10;
    const CARD_SIZE = 80;
    const CARD_GAP = 8;
    const getGridPosition = (index: number) => ({
      x: (index % GRID_COLS) * (CARD_SIZE + CARD_GAP),
      y: Math.floor(index / GRID_COLS) * (CARD_SIZE + CARD_GAP),
    });

    // Build map of survivor positions (by their sorted index)
    const survivorPositions: { x: number; y: number }[] = [];
    for (let i = 0; i < survivors.length; i++) {
      survivorPositions.push(getGridPosition(i));
    }

    // === PHASE 1: Mark dead creatures with red border (600ms) ===
    if (!fastMode) {
      const animStates = new Map<string, CardAnimationState>();
      for (const result of currentResults) {
        const isDead = deadCreatures.some((d) => d.genome.id === result.genome.id);
        animStates.set(result.genome.id, {
          isDead,
          isFadingOut: false, // Not fading yet, just marked red
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
      // Update dead cards to fade out
      const fadeStates = new Map<string, CardAnimationState>();
      for (const result of currentResults) {
        const isDead = deadCreatures.some((d) => d.genome.id === result.genome.id);
        fadeStates.set(result.genome.id, {
          isDead,
          isFadingOut: isDead, // Dead cards now fade out
          isMutated: false,
          isSpawning: false,
          spawnFromX: null,
          spawnFromY: null,
        });
      }
      setCardAnimationStates(fadeStates);
      await delay(FADE_OUT_DELAY);
    }

    // === PHASE 3: Evolve and spawn new offspring ===
    setGeneration(currentGen + 1);

    // Evolve the population (this kills bottom 50% and creates offspring)
    const newGenomes = SimulationService.evolvePopulation(population);

    // Create placeholder results for ALL creatures (including survivors)
    // All creatures show "..." until simulation runs
    const placeholderResults: CreatureSimulationResult[] = newGenomes.map((genome) => {
      return {
        genome,
        frames: [],
        finalFitness: NaN,
        pelletsCollected: 0,
        distanceTraveled: 0,
        netDisplacement: 0,
        closestPelletDistance: Infinity,
        pellets: [],
        fitnessOverTime: [],
        disqualified: null,
      };
    });

    // Set up animation states for spawn animation with parent positions
    if (!fastMode) {
      const newAnimStates = new Map<string, CardAnimationState>();
      for (const result of placeholderResults) {
        const isSurvivor = survivors.some((s) => s.genome.id === result.genome.id);

        // For new offspring, pick a random survivor position to spawn from
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
          isMutated: !isSurvivor, // New offspring are marked as mutated
          isSpawning: !isSurvivor, // New offspring spawn in
          spawnFromX,
          spawnFromY,
        });
      }
      setCardAnimationStates(newAnimStates);
    }

    setSimulationResults(placeholderResults);

    if (!fastMode) {
      // Small delay to let React render at spawn position first
      await delay(50);

      // Clear spawning state to trigger animation to final positions
      const transitionAnimStates = new Map<string, CardAnimationState>();
      for (const result of placeholderResults) {
        const isSurvivor = survivors.some((s) => s.genome.id === result.genome.id);
        transitionAnimStates.set(result.genome.id, {
          isDead: false,
          isFadingOut: false,
          isMutated: !isSurvivor,
          isSpawning: false, // Clear spawning to animate to final position
          spawnFromX: null,
          spawnFromY: null,
        });
      }
      setCardAnimationStates(transitionAnimStates);

      await delay(SPAWN_DELAY);
    }

    setEvolutionStep('simulate');
  }, [setGeneration, setSimulationResults, setEvolutionStep, setCardAnimationStates, setLongestSurvivor]);

  /**
   * Run the simulation step
   */
  const runSimulateStep = useCallback(async () => {
    const population = SimState.getPopulation();
    if (!population) return;

    const genomes = population.getGenomes();
    const currentGen = useEvolutionStore.getState().generation;
    const currentConfig = useEvolutionStore.getState().config;

    const results = await SimulationService.runSimulation(genomes, currentConfig, (progress) => {
      setSimulationProgress(progress);
    });
    setSimulationProgress(null);

    // Update population fitness
    SimulationService.updatePopulationFitness(population, results);

    // Update store
    setSimulationResults(results);
    setEvolutionStep('sort');

    // Save to storage
    await StorageService.saveGeneration(currentGen, results);
    setMaxGeneration(currentGen);

    return results;
  }, [setSimulationResults, setEvolutionStep, setMaxGeneration, setSimulationProgress]);

  const setSortAnimationTriggered = useEvolutionStore((s) => s.setSortAnimationTriggered);

  /**
   * Run the sort step (reorder by fitness with animation, record history)
   */
  const runSortStep = useCallback(async (fastMode: boolean = false) => {
    const currentGen = useEvolutionStore.getState().generation;
    const results = useEvolutionStore.getState().simulationResults;
    const history = useEvolutionStore.getState().fitnessHistory;

    // Clear mutated states - all cards are now normal
    clearCardAnimationStates();

    // Trigger sort animation (CreatureGrid will respond to this)
    if (!fastMode) {
      setSortAnimationTriggered(true);
      await delay(SORT_DELAY);
      setSortAnimationTriggered(false);
    }

    // Record history - must be sequential to avoid race condition on IndexedDB writes
    await recordFitnessHistory(results, currentGen, history);
    await recordCreatureTypeHistory(results, currentGen);
    updateBestCreature(results, currentGen);
    updateLongestSurvivor(results, currentGen);

    setEvolutionStep('idle');
  }, [setEvolutionStep, clearCardAnimationStates, setSortAnimationTriggered, recordFitnessHistory, recordCreatureTypeHistory, updateBestCreature, updateLongestSurvivor]);

  /**
   * Execute one step in the evolution cycle.
   * Each click advances one phase, matching vanilla app behavior:
   * - idle → mutate: kill 50%, create offspring, then set to 'simulate'
   * - simulate: run simulation, then set to 'sort'
   * - sort: animate sort, record history, then set to 'idle'
   */
  const executeNextStep = useCallback(async () => {
    const currentStep = useEvolutionStore.getState().evolutionStep;

    if (currentStep === 'idle') {
      // Start mutate phase
      setEvolutionStep('mutate');
      await runMutateStep();
      // runMutateStep sets evolutionStep to 'simulate' when done
    } else if (currentStep === 'simulate') {
      // Run simulation
      await runSimulateStep();
      // runSimulateStep sets evolutionStep to 'sort' when done
    } else if (currentStep === 'sort') {
      // Run sort step
      await runSortStep();
      // runSortStep sets evolutionStep to 'idle' when done
    }
    // If in 'mutate' state, button should be disabled
  }, [setEvolutionStep, runMutateStep, runSimulateStep, runSortStep]);

  /**
   * Auto-run for a specific number of generations
   * Uses fast mode to skip animations for better performance
   */
  const autoRun = useCallback(
    async (generations: number) => {
      if (SimState.isAutoRunning()) return;

      SimState.setAutoRunning(true);
      setIsAutoRunning(true);

      try {
        for (let i = 0; i < generations; i++) {
          if (!SimState.isAutoRunning()) break;

          // Mutate (fast mode - no animations)
          setEvolutionStep('mutate');
          await runMutateStep(true);

          if (!SimState.isAutoRunning()) break;

          // Simulate
          await runSimulateStep();

          if (!SimState.isAutoRunning()) break;

          // Sort (fast mode - no animations)
          await runSortStep(true);
        }
      } finally {
        SimState.setAutoRunning(false);
        setIsAutoRunning(false);
        setEvolutionStep('idle');
        clearCardAnimationStates();
      }
    },
    [setIsAutoRunning, setEvolutionStep, runMutateStep, runSimulateStep, runSortStep, clearCardAnimationStates]
  );

  /**
   * Stop auto-run
   */
  const stopAutoRun = useCallback(() => {
    SimState.setAutoRunning(false);
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

        // Recreate population from loaded genomes
        const population = SimulationService.createInitialPopulation(run.config);
        population.replaceCreatures(results.map((r) => r.genome));
        SimulationService.updatePopulationFitness(population, results);
        SimState.setPopulation(population);

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
   * Creates a new run starting from the viewing generation
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

      // Recreate population from loaded genomes
      const population = SimulationService.createInitialPopulation(run.config);
      population.replaceCreatures(results.map((r) => r.genome));
      SimulationService.updatePopulationFitness(population, results);
      SimState.setPopulation(population);

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
        viewingGeneration: null, // No longer viewing history
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
