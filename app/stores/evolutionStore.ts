import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SimulationConfig, FitnessHistoryEntry } from '../../src/types/simulation';
import type { CreatureSimulationResult } from '../../src/simulation/BatchSimulator';
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

  // Run metadata
  runName: string;
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
  graphsVisible: false,
  runName: '',
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

      // Reset to initial state
      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'evolution-store' }
  )
);

/**
 * Selector hooks for common state slices
 * Use these for better TypeScript inference and cleaner component code
 */
export const useAppState = () => useEvolutionStore((s) => s.appState);
export const useEvolutionStep = () => useEvolutionStore((s) => s.evolutionStep);
export const useGeneration = () => useEvolutionStore((s) => s.generation);
export const useConfig = () => useEvolutionStore((s) => s.config);
export const useSimulationResults = () => useEvolutionStore((s) => s.simulationResults);
export const useIsAutoRunning = () => useEvolutionStore((s) => s.isAutoRunning);
