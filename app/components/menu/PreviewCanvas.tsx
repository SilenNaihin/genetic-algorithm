'use client';

import { useEffect, useRef, useCallback } from 'react';
import { PreviewRenderer, type PreviewConfig } from '../../../src/rendering/PreviewRenderer';

export interface PreviewCanvasProps {
  config: PreviewConfig;
  isActive?: boolean;
  mountKey?: number;
}

/**
 * 3D creature preview canvas for the menu screen.
 * Wraps the imperative PreviewRenderer with React lifecycle management.
 *
 * Uses delayed initialization to handle React StrictMode's double-mount behavior
 * and prevent WebGL context exhaustion during rapid mount/unmount cycles.
 */
export function PreviewCanvas({ config, isActive = true, mountKey = 0 }: PreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PreviewRenderer | null>(null);
  const configRef = useRef(config);
  const lastMountKeyRef = useRef(mountKey);
  const mountedRef = useRef(true);

  // Keep config ref updated for the renderer's getConfig callback
  useEffect(() => {
    configRef.current = config;
    // Regenerate creature when complexity settings change
    rendererRef.current?.regenerateCreature();
  }, [config.maxNodes, config.maxMuscles, config.maxAllowedFrequency, config.gravity]);

  // Create renderer with a small delay to handle StrictMode double-mount
  useEffect(() => {
    mountedRef.current = true;
    const container = containerRef.current;
    if (!container) return;

    // Small delay to let React StrictMode settle
    const timerId = setTimeout(() => {
      if (!mountedRef.current || !containerRef.current) return;

      // Only create if we don't have one
      if (!rendererRef.current) {
        const renderer = new PreviewRenderer(containerRef.current, () => configRef.current);
        rendererRef.current = renderer;
        renderer.startAnimation();
      }
    }, 50);

    return () => {
      mountedRef.current = false;
      clearTimeout(timerId);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, []); // Empty deps - only run on mount/unmount

  // When mountKey changes (after reset), regenerate creature and restart animation
  useEffect(() => {
    if (mountKey !== lastMountKeyRef.current) {
      lastMountKeyRef.current = mountKey;
      const renderer = rendererRef.current;
      if (renderer) {
        renderer.regenerateCreature();
        renderer.startAnimation();
      }
    }
  }, [mountKey]);

  // Handle animation start/stop based on isActive prop
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (isActive) {
      renderer.startAnimation();
    } else {
      renderer.stopAnimation();
    }
  }, [isActive]);

  const handleClick = useCallback(() => {
    rendererRef.current?.regenerateCreature();
  }, []);

  return (
    <div
      ref={containerRef}
      className="menu-preview"
      onClick={handleClick}
      title="Click to generate new creature"
      style={{ cursor: 'pointer' }}
    />
  );
}

export default PreviewCanvas;
