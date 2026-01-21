'use client';

import { useEffect, useRef } from 'react';
import { useEvolutionStore } from '../../stores/evolutionStore';
import { GraphPanel } from '../../../src/ui/GraphPanel';
import { CreatureTypesPanel } from '../../../src/ui/CreatureTypesPanel';

/**
 * React wrapper for vanilla GraphPanel and CreatureTypesPanel.
 * These panels show fitness history and creature type distribution graphs.
 */
export function GraphPanels() {
  const graphsVisible = useEvolutionStore((s) => s.graphsVisible);
  const fitnessHistory = useEvolutionStore((s) => s.fitnessHistory);
  const creatureTypeHistory = useEvolutionStore((s) => s.creatureTypeHistory);

  const graphPanelRef = useRef<GraphPanel | null>(null);
  const typesPanelRef = useRef<CreatureTypesPanel | null>(null);

  // Initialize panels on mount
  useEffect(() => {
    graphPanelRef.current = new GraphPanel();
    typesPanelRef.current = new CreatureTypesPanel();

    return () => {
      // Cleanup - remove from DOM
      graphPanelRef.current?.hide();
      typesPanelRef.current?.hide();
    };
  }, []);

  // Update visibility
  useEffect(() => {
    if (graphsVisible) {
      graphPanelRef.current?.show();
      typesPanelRef.current?.show();
    } else {
      graphPanelRef.current?.hide();
      typesPanelRef.current?.hide();
    }
  }, [graphsVisible]);

  // Update graph data when fitness history changes
  useEffect(() => {
    if (fitnessHistory.length > 0) {
      graphPanelRef.current?.updateData(fitnessHistory);
    }
  }, [fitnessHistory]);

  // Update creature types data
  useEffect(() => {
    if (creatureTypeHistory.length > 0) {
      // Convert from store format to panel format
      const panelData = creatureTypeHistory.map((entry) => ({
        generation: entry.generation,
        nodeCountDistribution: entry.nodeCountDistribution,
      }));
      typesPanelRef.current?.updateData(panelData);
    }
  }, [creatureTypeHistory]);

  // This component doesn't render anything - the vanilla panels add themselves to document.body
  return null;
}

export default GraphPanels;
