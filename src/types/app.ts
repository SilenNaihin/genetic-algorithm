/**
 * Application-level types for the Evolution Lab UI
 */

import type { SimulationConfig } from './index';
import type { CreatureSimulationResult } from '../simulation/BatchSimulator';

// Application state
export type AppState = 'menu' | 'grid' | 'replay';
export type EvolutionStep = 'idle' | 'mutate' | 'simulate' | 'sort';

// Extended config with UI-specific settings
export interface Config extends SimulationConfig {
  gravity: number;
  mutationRate: number;
  simulationDuration: number;
  pelletCount: number;
}

// Creature card in the grid view
export interface CreatureCard {
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  result: CreatureSimulationResult | null;
  rank: number;
  gridIndex: number;
  isDead: boolean;
  isMutated: boolean;
  isElite: boolean;
  parentId: string | null;
  // For animation
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
}

// Family tree types
export interface AncestorInfo {
  id: string;
  generation: number;
  fitness: number;
  pelletsCollected: number;
  nodeCount: number;
  muscleCount: number;
  color: { h: number; s: number; l: number };
  parentIds: string[];
}

export interface FamilyTreeNode {
  creature: AncestorInfo;
  parents: FamilyTreeNode[];
}

// Grid layout constants
export const GRID_COLS = 10;
export const GRID_ROWS = 10;
export const CARD_SIZE = 80;
export const CARD_GAP = 8;
