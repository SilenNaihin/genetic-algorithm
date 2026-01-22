'use client';

import { useAppState } from './stores/evolutionStore';
import { MenuScreen } from './components/menu';
import { GridView } from './components/grid';
import { Notification } from './components/ui/Notification';

/**
 * Evolution Lab - Main Page
 * Renders MenuScreen or GridView based on appState.
 */
export default function HomePage() {
  const appState = useAppState();

  return (
    <>
      {appState === 'grid' ? <GridView /> : <MenuScreen />}
      <Notification />
    </>
  );
}
