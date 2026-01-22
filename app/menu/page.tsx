'use client';

import { useAppState } from '../stores/evolutionStore';
import { MenuScreen } from '../components/menu';
import { GridView } from '../components/grid';
import { Notification } from '../components/ui/Notification';

/**
 * Main React app entry point.
 * Renders MenuScreen or GridView based on appState.
 */
export default function MenuPage() {
  const appState = useAppState();

  return (
    <>
      {appState === 'grid' ? <GridView /> : <MenuScreen />}
      <Notification />
    </>
  );
}
