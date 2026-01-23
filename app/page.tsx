'use client';

import { useEffect } from 'react';
import { useAppState } from './stores/evolutionStore';
import { MenuScreen } from './components/menu';
import { GridView } from './components/grid';
import { Notification } from './components/ui/Notification';
import * as SimulationService from '../src/services/SimulationService';

/**
 * Evolution Lab - Main Page
 * Renders MenuScreen or GridView based on appState.
 */
export default function HomePage() {
  const appState = useAppState();

  // Try to use remote (PyTorch) simulation on startup
  useEffect(() => {
    SimulationService.tryUseRemoteSimulation().then((usingRemote) => {
      console.log(`[HomePage] Simulation mode: ${usingRemote ? 'remote (PyTorch)' : 'local (Cannon-ES)'}`);
    });
  }, []);

  return (
    <>
      {appState === 'grid' ? <GridView /> : <MenuScreen />}
      <Notification />
    </>
  );
}
