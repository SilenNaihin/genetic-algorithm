'use client';

import { useEffect, useRef, useCallback } from 'react';
import { PreviewRenderer, type PreviewConfig } from '../../../src/rendering/PreviewRenderer';

export interface PreviewCanvasProps {
  config: PreviewConfig;
  isActive?: boolean;
}

/**
 * 3D creature preview canvas for the menu screen.
 * Wraps the imperative PreviewRenderer with React lifecycle management.
 */
export function PreviewCanvas({ config, isActive = true }: PreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PreviewRenderer | null>(null);
  const configRef = useRef(config);

  // Keep config ref updated for the renderer's getConfig callback
  useEffect(() => {
    configRef.current = config;
    // Regenerate creature when complexity settings change
    rendererRef.current?.regenerateCreature();
  }, [config.maxNodes, config.maxMuscles, config.maxAllowedFrequency, config.gravity]);

  // Create renderer on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new PreviewRenderer(container, () => configRef.current);
    rendererRef.current = renderer;
    renderer.startAnimation();

    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Handle animation start/stop
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
