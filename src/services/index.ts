/**
 * Services barrel export
 *
 * Import services from here:
 * import { runSimulation, createRun } from '../services';
 *
 * For API client (backend):
 * import * as Api from '../services/ApiClient';
 */

export * from './SimulationService';
export * from './StorageService';

// Export API client under namespace to avoid conflicts
export * as Api from './ApiClient';
