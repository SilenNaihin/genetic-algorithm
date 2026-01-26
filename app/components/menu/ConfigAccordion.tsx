'use client';

import { CollapsibleAccordion } from '../common/CollapsibleAccordion';
import { PhysicsConfigPanel } from './PhysicsConfigPanel';
import { FitnessPanelContent } from './FitnessPanel';

/**
 * Right-side panel containing Physics Config and Fitness Function in an accordion.
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
      <CollapsibleAccordion sections={sections} defaultOpen="physics" />
    </div>
  );
}

export default ConfigAccordion;
