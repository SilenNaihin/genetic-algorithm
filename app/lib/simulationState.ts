/**
 * Shared simulation state module.
 *
 * This holds mutable state that needs to persist across component
 * remounts but shouldn't trigger re-renders (like the Population instance).
 *
 * Similar to how vanilla EvolutionApp class holds this.population.
 */

import type { Population } from '../../src/genetics/Population';

// Module-level state that persists across hook instances
let population: Population | null = null;
let autoRunning = false;

export function getPopulation(): Population | null {
  return population;
}

export function setPopulation(p: Population | null): void {
  population = p;
}

export function isAutoRunning(): boolean {
  return autoRunning;
}

export function setAutoRunning(running: boolean): void {
  autoRunning = running;
}
