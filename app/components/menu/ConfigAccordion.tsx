'use client';

import { CollapsibleAccordion } from '../common/CollapsibleAccordion';
import { PhysicsConfigPanel } from './PhysicsConfigPanel';
import { EvolutionPanel } from './EvolutionPanel';
import { FitnessPanelContent } from './FitnessPanel';

/**
 * Right-side panel containing Physics, Evolution, and Fitness in an accordion.
 * Only one section can be open at a time.
 */
export function ConfigAccordion() {
  const sections = [
    {
      id: 'physics',
      title: 'Physics Config',
      content: <PhysicsConfigPanel />,
    },
    {
      id: 'evolution',
      title: 'Evolution',
      content: <EvolutionPanel />,
    },
    {
      id: 'fitness',
      title: 'Fitness Function',
      content: <FitnessPanelContent />,
    },
  ];

  return (
    <div
      id="config-accordion-panel"
      style={{
        position: 'fixed',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        width: '260px',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
    >
      <CollapsibleAccordion sections={sections} defaultOpen="evolution" />
    </div>
  );
}

export default ConfigAccordion;
