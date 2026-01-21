'use client';

import { GridView } from '../components/grid';

/**
 * Grid page for testing React GridView component.
 * Visit /grid to compare with vanilla app's grid view.
 */
export default function GridPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'var(--bg-primary)' }}>
      <GridView />
    </div>
  );
}
