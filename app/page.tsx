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

  // Check backend connection on startup
  useEffect(() => {
    SimulationService.checkBackendConnection().then((connected) => {
      console.log(`[HomePage] Backend: ${connected ? 'connected' : 'not available'}`);
    });
  }, []);

  return (
    <>
      {appState === 'grid' ? <GridView /> : <MenuScreen />}
      <Notification />
    </>
  );
}
