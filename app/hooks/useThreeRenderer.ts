'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Generic interface for Three.js renderers in this project.
 * Renderers must implement these lifecycle methods.
 */
export interface ThreeRenderer {
  startAnimation?: () => void;
  stopAnimation?: () => void;
  dispose: () => void;
}

/**
 * Factory function type for creating renderers.
 * Takes a container element and returns a renderer instance.
 */
export type RendererFactory<T extends ThreeRenderer> = (container: HTMLElement) => T;

/**
 * Hook for managing Three.js renderer lifecycle in React.
 *
 * This hook:
 * - Creates the renderer when the container mounts
 * - Starts/stops animation based on isActive prop
 * - Disposes the renderer on unmount
 * - Re-creates the renderer if the factory function changes
 *
 * The renderers remain imperative (PreviewRenderer, ReplayRenderer, etc.)
 * while React only manages their lifecycle.
 *
 * @param factory - Function that creates the renderer given a container element
 * @param isActive - Whether animation should be running
 * @returns Object with containerRef to attach to DOM element and renderer instance
 */
export function useThreeRenderer<T extends ThreeRenderer>(
  factory: RendererFactory<T> | null,
  isActive: boolean = true
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<T | null>(null);

  // Create renderer when container mounts
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !factory) return;

    // Create renderer
    const renderer = factory(container);
    rendererRef.current = renderer;

    // Start animation if active
    if (isActive && renderer.startAnimation) {
      renderer.startAnimation();
    }

    // Cleanup on unmount or factory change
    return () => {
      renderer.stopAnimation?.();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [factory]); // Only recreate when factory changes

  // Handle animation start/stop separately from creation
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (isActive) {
      renderer.startAnimation?.();
    } else {
      renderer.stopAnimation?.();
    }
  }, [isActive]);

  return {
    containerRef,
    renderer: rendererRef.current,
  };
}

/**
 * Hook specifically for PreviewRenderer.
 * Provides type-safe access to PreviewRenderer methods.
 */
export function usePreviewRenderer(
  factory: RendererFactory<ThreeRenderer & { regenerateCreature: () => void }> | null,
  isActive: boolean = true
) {
  const { containerRef, renderer } = useThreeRenderer(factory, isActive);

  const regenerateCreature = useCallback(() => {
    if (renderer && 'regenerateCreature' in renderer) {
      (renderer as { regenerateCreature: () => void }).regenerateCreature();
    }
  }, [renderer]);

  return {
    containerRef,
    renderer,
    regenerateCreature,
  };
}

/**
 * Hook specifically for ReplayRenderer.
 * Provides type-safe access to replay controls.
 */
export function useReplayRenderer(
  factory: RendererFactory<ThreeRenderer & {
    setFrame: (frame: number) => void;
    getFrameCount: () => number;
  }> | null,
  isActive: boolean = true
) {
  const { containerRef, renderer } = useThreeRenderer(factory, isActive);

  const setFrame = useCallback((frame: number) => {
    if (renderer && 'setFrame' in renderer) {
      (renderer as { setFrame: (f: number) => void }).setFrame(frame);
    }
  }, [renderer]);

  const getFrameCount = useCallback((): number => {
    if (renderer && 'getFrameCount' in renderer) {
      return (renderer as { getFrameCount: () => number }).getFrameCount();
    }
    return 0;
  }, [renderer]);

  return {
    containerRef,
    renderer,
    setFrame,
    getFrameCount,
  };
}

export default useThreeRenderer;
