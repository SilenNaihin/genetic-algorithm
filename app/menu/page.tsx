'use client';

import { useAppState } from '../stores/evolutionStore';
import { MenuScreen } from '../components/menu';
import { GridView } from '../components/grid';

/**
 * Main React app entry point.
 * Renders MenuScreen or GridView based on appState.
 */
export default function MenuPage() {
  const appState = useAppState();

  if (appState === 'grid') {
    return <GridView />;
  }

  return <MenuScreen />;
}
