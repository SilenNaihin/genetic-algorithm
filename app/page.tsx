'use client';

import { useEffect } from 'react';

/**
 * Evolution Lab - Main Page
 *
 * This is a client component that bootstraps the vanilla EvolutionApp.
 * The "use client" directive is required because:
 * - Three.js requires browser APIs (WebGL, Canvas)
 * - The app manipulates the DOM directly
 * - IndexedDB is used for storage
 *
 * Migration strategy:
 * 1. Phase 16: Bootstrap vanilla app through Next.js (current)
 * 2. Phase 17: Convert extracted modules to React components
 * 3. Phase 18: Move state to React context/hooks
 * 4. Phase 19: Remove vanilla code
 */
export default function EvolutionLabPage() {
  useEffect(() => {
    // Dynamically import the vanilla app to avoid SSR issues
    // The import triggers EvolutionApp initialization
    import('../src/main').catch(console.error);
  }, []);

  return (
    <div id="app" className="evolution-app">
      {/* Vanilla EvolutionApp renders here */}
      {/* React components will gradually replace sections in Phase 17 */}
    </div>
  );
}
