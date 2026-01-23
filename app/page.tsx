'use client';

import { useEffect } from 'react';
import { MenuScreen } from './components/menu';
import { Notification } from './components/ui/Notification';
import * as SimulationService from '../src/services/SimulationService';

/**
 * Evolution Lab - Main Page
 * Shows MenuScreen. GridView is shown on /run/[runId] routes.
 */
export default function HomePage() {
  // Check backend connection on startup
  useEffect(() => {
    SimulationService.checkBackendConnection().then((connected) => {
      console.log(`[HomePage] Backend: ${connected ? 'connected' : 'not available'}`);
    });
  }, []);

  return (
    <>
      <MenuScreen />
      <Notification />
    </>
  );
}
