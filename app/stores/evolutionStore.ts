import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SimulationConfig, FitnessHistoryEntry } from '../../src/types/simulation';
import type { CreatureSimulationResult } from '../../src/types';
import { DEFAULT_CONFIG } from '../../src/types/simulation';

/**
 * App-level state types
 */
export type AppState = 'menu' | 'grid';
export type EvolutionStep = 'idle' | 'mutate' | 'simulate' | 'sort';

/**
 * Creature type history entry for tracking population diversity
 */
export interface CreatureTypeHistoryEntry {
  generation: number;
  nodeCountDistribution: Map<number, number>;
}

/**
 * Card animation state for smooth position/visual transitions
 */
export interface CardAnimationState {
  isDead: boolean;     // Card is marked for culling (shows red border)
  isFadingOut: boolean; // Card is fading out (phase 2 of death animation)
  isMutated: boolean;  // Card is newly spawned (shows amber)
  isSpawning: boolean; // Card is spawning from parent position
  spawnFromX: number | null; // Start X position for spawn animation
  spawnFromY: number | null; // Start Y position for spawn animation
  isRepositioning: boolean; // Survivor animating to new grid position
}

/**
 * Evolution store state shape
 */
interface EvolutionState {
  // App state
  appState: AppState;

  // Evolution state
  evolutionStep: EvolutionStep;
  generation: number;
  maxGeneration: number;
  viewingGeneration: number | null;
  isAutoRunning: boolean;

  // Config
  config: SimulationConfig;

  // Results
  simulationResults: CreatureSimulationResult[];
  fitnessHistory: FitnessHistoryEntry[];
  creatureTypeHistory: CreatureTypeHistoryEntry[];

  // Hall of fame
  bestCreatureEver: CreatureSimulationResult | null;
  bestCreatureGeneration: number;
  longestSurvivingCreature: CreatureSimulationResult | null;
  longestSurvivingGenerations: number;
  longestSurvivingDiedAt: number;

  // UI state
  selectedCreatureId: string | null;
  replayResult: CreatureSimulationResult | null; // null = modal closed
  loadModalOpen: boolean;
  graphsVisible: boolean;

  // Simulation progress
  simulationProgress: { completed: number; total: number } | null;

  // Run metadata
  runName: string;

  // Card animation states (genome.id -> animation state)
  cardAnimationStates: Map<string, CardAnimationState>;

  // Sort animation trigger (set by runSortStep, cleared when animation completes)
  sortAnimationTriggered: boolean;

  // Brain evolution modal
  brainEvolutionModalOpen: boolean;

  // Generation jump modal
  generationJumpModalOpen: boolean;

  // Error notification
  notification: { message: string; type: 'error' | 'info' } | null;

  // Key to force MenuScreen remount on reset (increments each reset)
  menuMountKey: number;
}

/**
 * Evolution store actions
 */
interface EvolutionActions {
  // State setters
  setAppState: (state: AppState) => void;
  setEvolutionStep: (step: EvolutionStep) => void;
  setGeneration: (gen: number) => void;
  setMaxGeneration: (max: number) => void;
  setViewingGeneration: (gen: number | null) => void;
  setIsAutoRunning: (running: boolean) => void;
  setConfig: (partial: Partial<SimulationConfig>) => void;
  setSimulationResults: (results: CreatureSimulationResult[]) => void;
  setFitnessHistory: (history: FitnessHistoryEntry[]) => void;
  setCreatureTypeHistory: (history: CreatureTypeHistoryEntry[]) => void;
  setBestCreature: (result: CreatureSimulationResult | null, generation: number) => void;
  setLongestSurvivor: (result: CreatureSimulationResult | null, generations: number, diedAt: number) => void;
  setSelectedCreatureId: (id: string | null) => void;
  setReplayResult: (result: CreatureSimulationResult | null) => void;
  setLoadModalOpen: (open: boolean) => void;
  setGraphsVisible: (visible: boolean) => void;
  setRunName: (name: string) => void;
  setSimulationProgress: (progress: { completed: number; total: number } | null) => void;
  setCardAnimationStates: (states: Map<string, CardAnimationState>) => void;
  updateCardAnimationState: (id: string, state: Partial<CardAnimationState>) => void;
  clearCardAnimationStates: () => void;
  setSortAnimationTriggered: (triggered: boolean) => void;
  setBrainEvolutionModalOpen: (open: boolean) => void;
  setGenerationJumpModalOpen: (open: boolean) => void;
  setNotification: (notification: { message: string; type: 'error' | 'info' } | null) => void;
  showError: (message: string) => void;

  // Complex actions (will be implemented in later phases)
  // These are placeholders that will call services
  reset: () => void;
}

type EvolutionStore = EvolutionState & EvolutionActions;

const initialState: EvolutionState = {
  appState: 'menu',
  evolutionStep: 'idle',
  generation: 0,
  maxGeneration: 0,
  viewingGeneration: null,
  isAutoRunning: false,
  config: DEFAULT_CONFIG,
  simulationResults: [],
  fitnessHistory: [],
  creatureTypeHistory: [],
  bestCreatureEver: null,
  bestCreatureGeneration: 0,
  longestSurvivingCreature: null,
  longestSurvivingGenerations: 0,
  longestSurvivingDiedAt: 0,
  selectedCreatureId: null,
  replayResult: null,
  loadModalOpen: false,
  graphsVisible: true,
  simulationProgress: null,
  runName: '',
  cardAnimationStates: new Map(),
  sortAnimationTriggered: false,
  brainEvolutionModalOpen: false,
  generationJumpModalOpen: false,
  notification: null,
  menuMountKey: 0,
};

/**
 * Zustand store for evolution app state
 *
 * Usage:
 * ```tsx
 * // In component - selective subscription (only re-renders when generation changes)
 * const generation = useEvolutionStore(s => s.generation);
 *
 * // Get actions
 * const setGeneration = useEvolutionStore(s => s.setGeneration);
 * ```
 */
export const useEvolutionStore = create<EvolutionStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // State setters
      setAppState: (appState) => set({ appState }, false, 'setAppState'),
      setEvolutionStep: (evolutionStep) => set({ evolutionStep }, false, 'setEvolutionStep'),
      setGeneration: (generation) => set({ generation }, false, 'setGeneration'),
      setMaxGeneration: (maxGeneration) => set({ maxGeneration }, false, 'setMaxGeneration'),
      setViewingGeneration: (viewingGeneration) => set({ viewingGeneration }, false, 'setViewingGeneration'),
      setIsAutoRunning: (isAutoRunning) => set({ isAutoRunning }, false, 'setIsAutoRunning'),
      setConfig: (partial) => set(
        (state) => ({ config: { ...state.config, ...partial } }),
        false,
        'setConfig'
      ),
      setSimulationResults: (simulationResults) => set({ simulationResults }, false, 'setSimulationResults'),
      setFitnessHistory: (fitnessHistory) => set({ fitnessHistory }, false, 'setFitnessHistory'),
      setCreatureTypeHistory: (creatureTypeHistory) => set({ creatureTypeHistory }, false, 'setCreatureTypeHistory'),
      setBestCreature: (bestCreatureEver, bestCreatureGeneration) => set(
        { bestCreatureEver, bestCreatureGeneration },
        false,
        'setBestCreature'
      ),
      setLongestSurvivor: (longestSurvivingCreature, longestSurvivingGenerations, longestSurvivingDiedAt) => set(
        { longestSurvivingCreature, longestSurvivingGenerations, longestSurvivingDiedAt },
        false,
        'setLongestSurvivor'
      ),
      setSelectedCreatureId: (selectedCreatureId) => set({ selectedCreatureId }, false, 'setSelectedCreatureId'),
      setReplayResult: (replayResult) => set({ replayResult }, false, 'setReplayResult'),
      setLoadModalOpen: (loadModalOpen) => set({ loadModalOpen }, false, 'setLoadModalOpen'),
      setGraphsVisible: (graphsVisible) => set({ graphsVisible }, false, 'setGraphsVisible'),
      setRunName: (runName) => set({ runName }, false, 'setRunName'),
      setSimulationProgress: (simulationProgress) => set({ simulationProgress }, false, 'setSimulationProgress'),
      setCardAnimationStates: (cardAnimationStates) => set({ cardAnimationStates }, false, 'setCardAnimationStates'),
      updateCardAnimationState: (id, state) => set(
        (s) => {
          const newStates = new Map(s.cardAnimationStates);
          const existing = newStates.get(id) || { isDead: false, isFadingOut: false, isMutated: false, isSpawning: false, spawnFromX: null, spawnFromY: null, isRepositioning: false };
          newStates.set(id, { ...existing, ...state });
          return { cardAnimationStates: newStates };
        },
        false,
        'updateCardAnimationState'
      ),
      clearCardAnimationStates: () => set({ cardAnimationStates: new Map() }, false, 'clearCardAnimationStates'),
      setSortAnimationTriggered: (sortAnimationTriggered) => set({ sortAnimationTriggered }, false, 'setSortAnimationTriggered'),
      setBrainEvolutionModalOpen: (brainEvolutionModalOpen) => set({ brainEvolutionModalOpen }, false, 'setBrainEvolutionModalOpen'),
      setGenerationJumpModalOpen: (generationJumpModalOpen) => set({ generationJumpModalOpen }, false, 'setGenerationJumpModalOpen'),
      setNotification: (notification) => set({ notification }, false, 'setNotification'),
      showError: (message) => set({ notification: { message, type: 'error' } }, false, 'showError'),

      // Reset to initial state (increment menuMountKey to force MenuScreen remount)
      reset: () => set((state) => ({
        ...initialState,
        menuMountKey: state.menuMountKey + 1,
      }), false, 'reset'),
    }),
    { name: 'evolution-store' }
  )
);

/**
 * Selector hooks for common state slices
 * Use these for better TypeScript inference and cleaner component code
 */
export const useEvolutionStep = () => useEvolutionStore((s) => s.evolutionStep);
export const useGeneration = () => useEvolutionStore((s) => s.generation);

/**
 * Normalized config hook that handles both camelCase and snake_case keys.
 * Converts any legacy camelCase keys to snake_case for consistency.
 */
export const useConfig = () => {
  const rawConfig = useEvolutionStore((s) => s.config);
  // Normalize keys that might be in camelCase from legacy storage
  const rc = rawConfig as unknown as Record<string, unknown>;
  return {
    ...rawConfig,
    time_encoding: (rc.time_encoding ?? rc.timeEncoding ?? 'none') as typeof rawConfig.time_encoding,
    use_proprioception: (rc.use_proprioception ?? rc.useProprioception ?? false) as boolean,
    proprioception_inputs: (rc.proprioception_inputs ?? rc.proprioceptionInputs ?? 'all') as typeof rawConfig.proprioception_inputs,
    neural_mode: (rc.neural_mode ?? rc.neuralMode ?? 'hybrid') as typeof rawConfig.neural_mode,
    neural_dead_zone: (rc.neural_dead_zone ?? rc.neuralDeadZone ?? 0) as number,
  };
};

export const useSimulationResults = () => useEvolutionStore((s) => s.simulationResults);
export const useIsAutoRunning = () => useEvolutionStore((s) => s.isAutoRunning);
export const useCardAnimationStates = () => useEvolutionStore((s) => s.cardAnimationStates);

/**
 * Non-hook function to get normalized config (handles both camelCase and snake_case keys).
 * Use this when you need config outside of React hooks (e.g., in callbacks, event handlers).
 * Converts any legacy camelCase keys to snake_case for consistency.
 */
export function getNormalizedConfig(): SimulationConfig {
  const rawConfig = useEvolutionStore.getState().config;
  const rc = rawConfig as unknown as Record<string, unknown>;
  return {
    ...rawConfig,
    time_encoding: (rc.time_encoding ?? rc.timeEncoding ?? 'none') as typeof rawConfig.time_encoding,
    use_proprioception: (rc.use_proprioception ?? rc.useProprioception ?? false) as boolean,
    proprioception_inputs: (rc.proprioception_inputs ?? rc.proprioceptionInputs ?? 'all') as typeof rawConfig.proprioception_inputs,
    neural_mode: (rc.neural_mode ?? rc.neuralMode ?? 'hybrid') as typeof rawConfig.neural_mode,
    neural_dead_zone: (rc.neural_dead_zone ?? rc.neuralDeadZone ?? 0) as number,
  };
}
