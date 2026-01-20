/**
 * React-specific UI types
 * Domain types stay in src/types/, this file is for component props and events
 */

import type { ReactNode } from 'react';
import type { CreatureSimulationResult } from '../../src/simulation/BatchSimulator';
import type { SimulationConfig } from '../../src/types/simulation';

/**
 * Common component props
 */
export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export interface ProgressBarProps {
  progress: number; // 0-100
  text?: string;
  className?: string;
}

/**
 * Menu component props
 */
export interface MenuScreenProps {
  onStart: () => void;
  onLoadRun: () => void;
}

export interface ParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  formatValue?: (value: number) => string;
}

export interface PreviewCanvasProps {
  config: SimulationConfig;
  className?: string;
}

/**
 * Grid component props
 */
export interface GridViewProps {
  className?: string;
}

export interface CreatureCardProps {
  result: CreatureSimulationResult;
  rank: number;
  isElite: boolean;
  isMutated: boolean;
  onClick: () => void;
  onHover?: (hovering: boolean) => void;
}

export interface CreatureGridProps {
  results: CreatureSimulationResult[];
  onCardClick: (result: CreatureSimulationResult) => void;
}

export interface StatsPanelProps {
  className?: string;
}

export interface ControlPanelProps {
  onStep: () => void;
  onAutoRun: (generations: number) => void;
  onToggleGraphs: () => void;
  onReset: () => void;
  disabled?: boolean;
}

/**
 * Modal component props
 */
export interface ReplayModalProps {
  result: CreatureSimulationResult | null;
  onClose: () => void;
}

export interface LoadRunsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadRun: (runId: string) => void;
}

/**
 * Three.js canvas props
 */
export interface ThreeCanvasProps {
  className?: string;
}

/**
 * Run card for load modal
 */
export interface RunCardData {
  id: string;
  name: string;
  generationCount: number;
  startTime: number;
  config: SimulationConfig;
}
