'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { FiCopy, FiX } from 'react-icons/fi';
import { useEvolutionStore } from '../../stores/evolutionStore';
import { Button } from '../common/Button';
import { ReplayRenderer } from '../../../src/rendering/ReplayRenderer';
import { NeuralVisualizer } from '../../../src/ui/NeuralVisualizer';
import type { TimeEncodingType } from '../../../src/neural';
import * as StorageService from '../../../src/services/StorageService';
import type { CreatureGenome } from '../../../src/types';
import type { CreatureSimulationResult } from '../../../src/types';

// Sensor names for neural info display - based on time encoding and proprioception
const BASE_SENSOR_NAMES = ['dir_x', 'dir_y', 'dir_z', 'vel_x', 'vel_y', 'vel_z', 'dist'];

type ProprioceptionInputs = 'strain' | 'velocity' | 'ground' | 'all';

interface ProprioceptionConfig {
  enabled: boolean;
  inputs: ProprioceptionInputs;
  numMuscles: number;
  numNodes: number;
}

/**
 * Custom tooltip component for the color key.
 * Shows tooltip on hover with description of what each color means.
 */
function ColorKeyTooltip({ label, color, description }: { label: string; color: string; description: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = React.useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
    }
    setShowTooltip(true);
  };

  return (
    <>
      <span
        ref={ref}
        style={{ color, cursor: 'help', fontWeight: 500 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {label}
      </span>
      {showTooltip && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            transform: 'translateX(-50%)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            maxWidth: '200px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            zIndex: 10001,
            pointerEvents: 'none',
            whiteSpace: 'normal',
            lineHeight: 1.4,
          }}
        >
          {description}
        </div>,
        document.body
      )}
    </>
  );
}

function getSensorNamesForEncoding(
  encoding: TimeEncodingType,
  proprioception?: ProprioceptionConfig,
  muscleNames?: string[]
): string[] {
  let names = [...BASE_SENSOR_NAMES];

  // Add time encoding
  switch (encoding) {
    case 'sin':
      names.push('t_sin');
      break;
    case 'raw':
      names.push('t_raw');
      break;
    case 'cyclic':
      names.push('t_sin', 't_cos');
      break;
    case 'sin_raw':
      names.push('t_sin', 't_raw');
      break;
  }

  // Add proprioception inputs if enabled
  if (proprioception?.enabled) {
    const { inputs, numMuscles, numNodes } = proprioception;

    // Strain: how stretched/compressed each muscle is
    if (inputs === 'strain' || inputs === 'all') {
      for (let i = 0; i < numMuscles; i++) {
        const muscleName = muscleNames?.[i] || `M${i + 1}`;
        names.push(`${muscleName}_str`);
      }
      // Padding (masked to 0)
      for (let i = numMuscles; i < 15; i++) names.push(`M${i + 1}_str*`);
    }

    // Velocity: how fast each node is moving (x, y, z)
    if (inputs === 'velocity' || inputs === 'all') {
      for (let i = 0; i < numNodes; i++) names.push(`N${i + 1}_vx`, `N${i + 1}_vy`, `N${i + 1}_vz`);
      for (let i = numNodes; i < 8; i++) names.push(`N${i + 1}_vx*`, `N${i + 1}_vy*`, `N${i + 1}_vz*`);
    }

    // Ground contact: is each node touching ground
    if (inputs === 'ground' || inputs === 'all') {
      for (let i = 0; i < numNodes; i++) names.push(`N${i + 1}_gnd`);
      for (let i = numNodes; i < 8; i++) names.push(`N${i + 1}_gnd*`);
    }
  }

  return names;
}

// Family tree types
interface AncestorInfo {
  id: string;
  generation: number;
  fitness: number;
  pelletsCollected: number;
  nodeCount: number;
  muscleCount: number;
  color: { h: number; s: number; l: number };
  parentIds: string[];
  reproductionType?: 'crossover' | 'mutation';
}

interface FamilyTreeNode {
  creature: AncestorInfo;
  parents: FamilyTreeNode[];
}

const MAX_ANCESTORS = 50;

/**
 * Replay modal for viewing creature simulation playback.
 * Shows 3D replay, fitness progress, speed controls, genome viewer,
 * neural network visualization, and family tree.
 */
export function ReplayModal() {
  const replayResult = useEvolutionStore((s) => s.replayResult);
  const setReplayResult = useEvolutionStore((s) => s.setReplayResult);
  const simulationResults = useEvolutionStore((s) => s.simulationResults);
  const rawConfig = useEvolutionStore((s) => s.config);

  // Access config directly since it now uses snake_case
  const config = rawConfig;

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ReplayRenderer | null>(null);
  const animationRef = useRef<number | null>(null);
  const neuralVizContainerRef = useRef<HTMLDivElement>(null);
  const neuralVisualizerRef = useRef<NeuralVisualizer | null>(null);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [currentFitness, setCurrentFitness] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [lineageMode, setLineageMode] = useState<'both' | 'crossover' | 'clone'>('both');
  const [familyTree, setFamilyTree] = useState<FamilyTreeNode | null>(null);
  const [familyTreeLoading, setFamilyTreeLoading] = useState(false);
  const startTimeRef = useRef<number>(0);

  // Lazy frame loading state
  const [framesLoading, setFramesLoading] = useState(false);
  const [loadedResult, setLoadedResult] = useState<CreatureSimulationResult | null>(null);

  const isOpen = replayResult !== null;

  // Load frames lazily when modal opens with empty frames
  useEffect(() => {
    if (!replayResult) {
      setLoadedResult(null);
      return;
    }

    // If frames are already loaded, use them directly
    if (replayResult.frames.length > 0) {
      console.log('[ReplayModal] Using in-memory frames:', {
        frameCount: replayResult.frames.length,
        fitnessOverTimeLength: replayResult.fitnessOverTime?.length,
        pelletsCount: replayResult.pellets?.length,
        firstFitness: replayResult.fitnessOverTime?.[0],
        lastFitness: replayResult.fitnessOverTime?.[replayResult.fitnessOverTime?.length - 1],
        activationsPerFrameLength: replayResult.activationsPerFrame?.length,
        firstActivations: replayResult.activationsPerFrame?.[0]?.outputs?.slice(0, 3),
      });
      setLoadedResult(replayResult);
      return;
    }

    // Need to load frames from backend
    const creatureId = replayResult.genome._apiCreatureId;
    if (!creatureId) {
      // No API creature ID - this is a fresh simulation result, use as is
      console.log('[ReplayModal] Fresh result (no creatureId), using as-is');
      setLoadedResult(replayResult);
      return;
    }

    console.log('[ReplayModal] Loading frames from API for creature:', creatureId);
    console.log('[ReplayModal] replayResult:', {
      genomeId: replayResult.genome.id,
      framesLength: replayResult.frames.length,
      pelletsCollected: replayResult.pelletsCollected,
      pelletsLength: replayResult.pellets.length,
    });

    // Load frames lazily
    setFramesLoading(true);
    setLoadedResult(null);

    StorageService.loadCreatureFrames(
      creatureId,
      replayResult.genome,
      replayResult.pelletsCollected,
      config,
      replayResult.disqualified,
      replayResult.pellets,  // Pass real pellet data
      replayResult.fitnessOverTime  // Pass real fitness over time
    ).then(({ frames, fitnessOverTime, pellets, activationsPerFrame }) => {
      console.log('[ReplayModal] Loaded frames:', {
        framesLength: frames.length,
        fitnessOverTimeLength: fitnessOverTime.length,
        pelletsLength: pellets.length,
        activationsPerFrameLength: activationsPerFrame?.length,
        firstFrame: frames[0],
        lastFrame: frames[frames.length - 1],
      });
      setLoadedResult({
        ...replayResult,
        frames,
        fitnessOverTime,
        pellets: pellets.length > 0 ? pellets : replayResult.pellets,
        activationsPerFrame,
      });
      setFramesLoading(false);
    }).catch((error) => {
      console.error('[ReplayModal] Failed to load frames:', error);
      setLoadedResult(replayResult); // Use result without frames
      setFramesLoading(false);
    });
  }, [replayResult, config]);

  const totalFrames = loadedResult?.frames.length ?? 0;
  const totalDuration = loadedResult?.frames[totalFrames - 1]?.time ?? 0;

  // Initialize renderer when modal opens and frames are loaded
  useEffect(() => {
    if (!isOpen || !containerRef.current || !loadedResult) return;

    // Create renderer
    const renderer = new ReplayRenderer(containerRef.current);
    rendererRef.current = renderer;

    // Load result only when frames are available
    if (loadedResult.frames.length > 0) {
      renderer.loadResult(loadedResult);
      setCurrentFrame(0);
      setIsPlaying(true);
      setSpeed(1);
      startTimeRef.current = performance.now();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [isOpen, loadedResult]);

  // Initialize neural visualizer
  useEffect(() => {
    if (!isOpen || !loadedResult || !neuralVizContainerRef.current) return;

    const genome = loadedResult.genome;

    // Dispose existing visualizer
    if (neuralVisualizerRef.current) {
      neuralVisualizerRef.current.dispose();
      neuralVisualizerRef.current = null;
    }

    // Only create visualizer if creature has neural genome (fixed-topology or NEAT)
    if ((!genome.neuralGenome && !genome.neatGenome) || genome.controllerType !== 'neural') {
      return;
    }

    // Calculate NON-PADDED input count (padded inputs are not shown in visualization)
    let nonPaddedInputCount = 7; // base inputs always shown
    if (config.time_encoding === 'cyclic' || config.time_encoding === 'sin_raw') nonPaddedInputCount += 2;
    else if (config.time_encoding === 'sin' || config.time_encoding === 'raw') nonPaddedInputCount += 1;

    if (config.use_proprioception) {
      const numMuscles = genome.muscles.length;
      const numNodes = genome.nodes.length;
      const propType = config.proprioception_inputs || 'all';
      // Only count actual inputs, not padded ones
      if (propType === 'strain') nonPaddedInputCount += numMuscles;
      else if (propType === 'velocity') nonPaddedInputCount += numNodes * 3;
      else if (propType === 'ground') nonPaddedInputCount += numNodes;
      else nonPaddedInputCount += numMuscles + numNodes * 3 + numNodes; // all
    }

    // Calculate width - if >20 inputs, make canvas wider for scrolling
    const containerParent = neuralVizContainerRef.current.parentElement;
    const containerWidth = containerParent ? containerParent.clientWidth : Math.min(1400, window.innerWidth - 150);

    // Min 50px per input node to keep labels readable, but at least fill container
    const minWidthForInputs = nonPaddedInputCount * 50;
    const vizWidth = nonPaddedInputCount > 20 ? Math.max(containerWidth, minWidthForInputs) : containerWidth;
    const vizHeight = Math.min(300, Math.max(180, nonPaddedInputCount * 4));

    // Create visualizer
    neuralVizContainerRef.current.innerHTML = '';
    const visualizer = new NeuralVisualizer(neuralVizContainerRef.current, {
      width: vizWidth,
      height: vizHeight,
      showWeights: true,
    });
    neuralVisualizerRef.current = visualizer;

    // Get muscle names for labels
    const muscleNames = genome.muscles.map((m) => {
      const nodeAIndex = genome.nodes.findIndex((n) => n.id === m.nodeA) + 1;
      const nodeBIndex = genome.nodes.findIndex((n) => n.id === m.nodeB) + 1;
      return `${nodeAIndex}-${nodeBIndex}`;
    });

    // Set genome - use NEAT or fixed topology
    if (genome.neatGenome) {
      visualizer.setNEATGenome(genome.neatGenome, muscleNames);
    } else {
      visualizer.setGenome(genome.neuralGenome, muscleNames);
    }
    // Set time encoding for accurate input labels
    visualizer.setTimeEncoding(config.time_encoding || 'none');
    // Set proprioception config for input labels
    visualizer.setProprioception({
      enabled: config.use_proprioception || false,
      inputs: config.proprioception_inputs || 'all',
      numMuscles: genome.muscles.length,
      numNodes: genome.nodes.length,
    });
    // Set dead zone for output node coloring (in pure and neat modes)
    if (config.neural_mode === 'pure' || config.neural_mode === 'neat') {
      visualizer.setDeadZone(config.neural_dead_zone || 0);
    }

    return () => {
      if (neuralVisualizerRef.current) {
        neuralVisualizerRef.current.dispose();
        neuralVisualizerRef.current = null;
      }
    };
  }, [isOpen, loadedResult, config.time_encoding, config.use_proprioception, config.proprioception_inputs, config.neural_mode, config.neural_dead_zone]);

  // Build family tree from embedded ancestry chain (no DB lookups needed)
  const buildFamilyTree = useCallback((genome: CreatureGenome) => {
    // Get current creature's fitness from simulation results
    const currentResult = simulationResults.find((r) => r.genome.id === genome.id);
    const currentFitness = currentResult?.finalFitness || 0;

    // Build simple linear ancestry from embedded chain
    const ancestryChain = genome.ancestryChain || [];

    // Create tree structure from the flat ancestry chain
    const tree: FamilyTreeNode = {
      creature: {
        id: genome.id,
        generation: genome.generation,
        fitness: currentFitness,
        pelletsCollected: currentResult?.pelletsCollected || 0,
        nodeCount: genome.nodes.length,
        muscleCount: genome.muscles.length,
        color: genome.color,
        parentIds: genome.parentIds,
      },
      parents: [],
    };

    // Build parent chain from ancestry (reverse order - most recent parent first)
    // Handle crossover parents as siblings (two consecutive entries with reproductionType='crossover')
    let currentNode = tree;
    let i = ancestryChain.length - 1;
    while (i >= 0) {
      const ancestor = ancestryChain[i];

      // Check if this and the previous entry are crossover parents (siblings)
      const isCrossover = ancestor.reproductionType === 'crossover';
      const prevAncestor = i > 0 ? ancestryChain[i - 1] : null;
      const prevIsCrossover = prevAncestor?.reproductionType === 'crossover';

      // Two consecutive crossover entries = sibling parents
      if (isCrossover && prevIsCrossover && prevAncestor) {
        // Add both as parents of current node
        const parent1Node: FamilyTreeNode = {
          creature: {
            id: `ancestor-${i}`,
            generation: ancestor.generation,
            fitness: ancestor.fitness,
            pelletsCollected: 0,
            nodeCount: ancestor.nodeCount,
            muscleCount: ancestor.muscleCount,
            color: ancestor.color || { h: 0.5, s: 0.7, l: 0.5 },
            parentIds: [],
            reproductionType: ancestor.reproductionType,
          },
          parents: [],
        };
        const parent2Node: FamilyTreeNode = {
          creature: {
            id: `ancestor-${i - 1}`,
            generation: prevAncestor.generation,
            fitness: prevAncestor.fitness,
            pelletsCollected: 0,
            nodeCount: prevAncestor.nodeCount,
            muscleCount: prevAncestor.muscleCount,
            color: prevAncestor.color || { h: 0.5, s: 0.7, l: 0.5 },
            parentIds: [],
            reproductionType: prevAncestor.reproductionType,
          },
          parents: [],
        };
        currentNode.parents.push(parent1Node, parent2Node);
        // Continue from the earlier ancestor's parent (skip both crossover entries)
        // The next entry after both crossover parents becomes their shared parent
        currentNode = parent1Node; // Continue lineage through first parent
        i -= 2;
      } else {
        // Single parent (mutation or clone)
        const parentNode: FamilyTreeNode = {
          creature: {
            id: `ancestor-${i}`,
            generation: ancestor.generation,
            fitness: ancestor.fitness,
            pelletsCollected: 0,
            nodeCount: ancestor.nodeCount,
            muscleCount: ancestor.muscleCount,
            color: ancestor.color || { h: 0.5, s: 0.7, l: 0.5 },
            parentIds: i > 0 ? [`ancestor-${i - 1}`] : [],
            reproductionType: ancestor.reproductionType,
          },
          parents: [],
        };
        currentNode.parents.push(parentNode);
        currentNode = parentNode;
        i--;
      }
    }

    setFamilyTree(tree);
    setFamilyTreeLoading(false);
  }, [simulationResults]);

  // Rebuild family tree when lineage mode changes
  useEffect(() => {
    if (isOpen && loadedResult) {
      buildFamilyTree(loadedResult.genome);
    }
  }, [isOpen, loadedResult, lineageMode, buildFamilyTree]);

  // Animation loop - uses simulation time like vanilla app
  useEffect(() => {
    if (!isOpen || !isPlaying || !loadedResult || !rendererRef.current) return;

    const frames = loadedResult.frames;
    if (frames.length === 0) return;

    const totalDurationMs = frames[frames.length - 1].time * 1000;

    const animate = () => {
      const now = performance.now();
      // Elapsed time is multiplied by speed (1x = real-time, 2x = 2x speed, etc.)
      const elapsedMs = (now - startTimeRef.current) * speed;

      // Loop back to start if we've reached the end
      let currentSimTime = elapsedMs;
      if (currentSimTime >= totalDurationMs) {
        startTimeRef.current = now;
        currentSimTime = 0;
      }

      // Find the frame that matches the current simulation time
      const targetTime = currentSimTime / 1000; // Convert to seconds
      let frameIndex = 0;
      for (let i = 0; i < frames.length; i++) {
        if (frames[i].time <= targetTime) {
          frameIndex = i;
        } else {
          break;
        }
      }

      // Update state and render
      setCurrentFrame(frameIndex);
      const fitness = loadedResult.fitnessOverTime[frameIndex] || 0;
      setCurrentFitness(fitness);
      rendererRef.current?.renderFrame(frames[frameIndex], frameIndex);

      // Update neural visualization if creature has neural genome and stored activations
      const genome = loadedResult.genome;
      if (neuralVisualizerRef.current && (genome.neuralGenome || genome.neatGenome) && genome.controllerType === 'neural') {
        const frameActivations = loadedResult.activationsPerFrame?.[frameIndex];
        if (frameActivations) {
          neuralVisualizerRef.current.setStoredActivations(frameActivations);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isOpen, isPlaying, loadedResult, speed]);

  const handleClose = () => {
    setReplayResult(null);
  };

  const handleRestart = () => {
    setCurrentFrame(0);
    startTimeRef.current = performance.now();
    setIsPlaying(true);
  };

  const handleSpeedChange = (newSpeed: number) => {
    // Preserve current position when changing speed
    if (loadedResult && loadedResult.frames.length > 0) {
      const currentTime = loadedResult.frames[currentFrame]?.time || 0;
      startTimeRef.current = performance.now() - (currentTime * 1000 / newSpeed);
    }
    setSpeed(newSpeed);
  };

  const handleTogglePlay = () => {
    if (!isPlaying && loadedResult && loadedResult.frames.length > 0) {
      // Resume from current position
      const currentTime = loadedResult.frames[currentFrame]?.time || 0;
      startTimeRef.current = performance.now() - (currentTime * 1000 / speed);
    }
    setIsPlaying(!isPlaying);
  };

  // Format time in MM:SS from seconds
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!replayResult) return null;

  // Show loading state while frames are being fetched
  if (framesLoading || !loadedResult) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setReplayResult(null)}
      >
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            padding: '40px 60px',
            color: 'var(--text-muted)',
            fontSize: '16px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          Loading replay data...
        </div>
      </div>
    );
  }

  const genome = loadedResult.genome;
  const hasNeuralGenome = (genome.neuralGenome || genome.neatGenome) && genome.controllerType === 'neural';
  const isNEAT = !!genome.neatGenome;

  // Calculate max fitness from fitnessOverTime for progress bar scaling
  const maxFitness = Math.max(...(loadedResult.fitnessOverTime || [0]), 0.1);
  const fitnessProgress = Math.min(100, (currentFitness / maxFitness) * 100);

  // Get current time from frame
  const currentTime = loadedResult.frames[currentFrame]?.time || 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          position: 'relative',
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '1600px',
          width: '95vw',
          maxHeight: '95vh',
          overflow: 'auto',
          border: '1px solid var(--border-light)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - top right corner */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'color 0.15s, background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.background = 'var(--bg-secondary)';
            e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'var(--bg-tertiary)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <FiX size={16} />
        </button>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top row: panels - height matches video (340px) + controls (~130px) */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch', height: '470px' }}>
            {/* Left: Replay viewer */}
            <div style={{ flex: '0 0 480px' }}>
              <div
                ref={containerRef}
                style={{
                  width: '480px',
                  height: '340px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#0f0f14',
                }}
              />

              {/* Fitness and controls */}
              <div style={{ marginTop: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      color: 'var(--success)',
                    }}
                  >
                    {currentFitness.toFixed(1)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {formatTime(currentTime)} / {formatTime(totalDuration)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="1"
                        value={(() => { const idx = [0.1, 0.25, 0.5, 1, 2, 4].indexOf(speed); return idx >= 0 ? idx : 3; })()}
                        onChange={(e) => {
                          const speeds = [0.1, 0.25, 0.5, 1, 2, 4];
                          handleSpeedChange(speeds[parseInt(e.target.value)]);
                        }}
                        style={{
                          width: '80px',
                          accentColor: 'var(--accent)',
                        }}
                      />
                      <span style={{
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        minWidth: '36px',
                        textAlign: 'right',
                      }}>
                        {speed}x
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fitness progress bar */}
                <div
                  style={{
                    height: '6px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${fitnessProgress}%`,
                      background: 'linear-gradient(90deg, var(--accent), var(--success))',
                      transition: 'width 0.1s',
                    }}
                  />
                </div>
              </div>

              {/* Stats and controls */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px',
                }}
              >
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Gen {genome.generation} | Nodes: <strong>{genome.nodes.length}</strong> | Muscles:{' '}
                  <strong>{genome.muscles.length}</strong> | Pellets:{' '}
                  <strong>
                    {loadedResult.pelletsCollected}/{loadedResult.pellets.length}
                  </strong>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" size="small" onClick={handleTogglePlay}>
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  <Button variant="secondary" size="small" onClick={handleRestart}>
                    Restart
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Genome Viewer + Neural Info + Family Tree */}
            <div style={{ display: 'flex', flex: 1, gap: '16px', minWidth: 0, alignItems: 'stretch' }}>
              {/* Genome Viewer panel */}
              <div
                style={{
                  flex: '0 0 260px',
                  overflowY: 'auto',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  border: '1px solid var(--border)',
                }}
              >
                {/* CREATURE INFO */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontSize: '13px',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border-light)',
                  }}>
                    Creature Info
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>ID</span>
                        <FiCopy
                          onClick={() => {
                            const runId = StorageService.getCurrentRunId();
                            const text = runId
                              ? `creature: ${genome.id} (run: ${runId})`
                              : genome.id;
                            navigator.clipboard.writeText(text);
                          }}
                          style={{
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            fontSize: '12px',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="Copy creature ID and run ID"
                        />
                      </div>
                      <span style={{ color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={genome.id}>{genome.id.slice(0, 12)}...</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Fitness</span>
                      <span style={{ color: loadedResult.disqualified ? '#ef4444' : 'var(--success)' }}>{loadedResult.finalFitness.toFixed(1)}</span>
                    </div>
                    {loadedResult.avgFitness !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Avg Fitness</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{loadedResult.avgFitness.toFixed(1)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Born</span>
                      <span style={{ color: 'var(--text-primary)' }}>Gen {loadedResult.birthGeneration ?? genome.generation}</span>
                    </div>
                    {loadedResult.deathGeneration !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Died</span>
                        <span style={{ color: '#ef4444' }}>Gen {loadedResult.deathGeneration}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Survival Streak</span>
                      <span style={{ color: 'var(--success)' }}>{genome.survivalStreak}</span>
                    </div>
                    {config.neural_mode === 'hybrid' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Freq Mult</span>
                        <span style={{ color: 'var(--text-primary)' }}>{genome.globalFrequencyMultiplier.toFixed(2)}×</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* NODES */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontSize: '13px',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border-light)',
                  }}>
                    Nodes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({genome.nodes.length})</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {genome.nodes.map((node, i) => (
                      <div key={node.id} style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        padding: '10px',
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{ color: 'var(--accent-light)', fontWeight: 500, marginBottom: '6px' }}>N{i + 1}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Size</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{node.size.toFixed(2)}</span>
                          <span style={{ color: 'var(--text-muted)' }}>Friction</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{node.friction.toFixed(2)}</span>
                        </div>
                        <div style={{ fontSize: '11px', marginTop: '4px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Pos </span>
                          <span style={{ color: 'var(--text-secondary)' }}>({node.position.x.toFixed(1)}, {node.position.y.toFixed(1)}, {node.position.z.toFixed(1)})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MUSCLES */}
                <div>
                  <h3 style={{
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontSize: '13px',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border-light)',
                  }}>
                    Muscles <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({genome.muscles.length})</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {genome.muscles.map((muscle, i) => {
                      const nodeAIndex = genome.nodes.findIndex((n) => n.id === muscle.nodeA) + 1;
                      const nodeBIndex = genome.nodes.findIndex((n) => n.id === muscle.nodeB) + 1;
                      const isDirectNeural = hasNeuralGenome && (config.neural_mode === 'pure' || config.neural_mode === 'neat');
                      return (
                        <div key={muscle.id} style={{
                          background: 'var(--bg-secondary)',
                          borderRadius: '8px',
                          padding: '10px',
                          border: '1px solid var(--border)',
                        }}>
                          <div style={{ color: 'var(--warning)', fontWeight: 500, marginBottom: '8px' }}>
                            M{i + 1} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>N{nodeAIndex} ↔ N{nodeBIndex}</span>
                          </div>

                          {/* Physical properties - always shown */}
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Physical</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '11px' }}>
                              <div><span style={{ color: 'var(--text-muted)' }}>len</span> <span style={{ color: 'var(--text-secondary)' }}>{muscle.restLength.toFixed(1)}</span></div>
                              <div><span style={{ color: 'var(--text-muted)' }}>stf</span> <span style={{ color: 'var(--text-secondary)' }}>{muscle.stiffness.toFixed(1)}</span></div>
                              <div><span style={{ color: 'var(--text-muted)' }}>dmp</span> <span style={{ color: 'var(--text-secondary)' }}>{muscle.damping.toFixed(2)}</span></div>
                            </div>
                          </div>

                          {/* Oscillation - only for hybrid mode */}
                          {!isDirectNeural && (
                            <div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Oscillation</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '11px' }}>
                                <div><span style={{ color: 'var(--text-muted)' }}>frq</span> <span style={{ color: 'var(--accent-light)' }}>{muscle.frequency.toFixed(1)}</span></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>amp</span> <span style={{ color: 'var(--accent-light)' }}>{muscle.amplitude.toFixed(2)}</span></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>phs</span> <span style={{ color: 'var(--accent-light)' }}>{muscle.phase.toFixed(1)}</span></div>
                              </div>
                            </div>
                          )}

                          {/* Direct neural - NN output directly controls contraction, no amplitude */}
                          {isDirectNeural && (
                            <div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Neural Control</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                Direct NN output → contraction
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Neural Info panel (only shown for neural creatures) */}
              {hasNeuralGenome && (
                <div
                  style={{
                    flex: '0 0 220px',
                    overflowY: 'auto',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      color: 'var(--accent)',
                      fontWeight: 600,
                      fontSize: '13px',
                      marginBottom: '12px',
                      borderBottom: '1px solid var(--border-light)',
                      paddingBottom: '4px',
                    }}
                  >
                    NEURAL INFO
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Mode:</span> {config.neural_mode || 'hybrid'}
                      {isNEAT && <span style={{ color: 'var(--accent)', marginLeft: '6px' }}>(NEAT)</span>}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Topology:</span>{' '}
                      {(() => {
                        let actualInputs = 7;
                        if (config.time_encoding === 'cyclic' || config.time_encoding === 'sin_raw') actualInputs += 2;
                        else if (config.time_encoding === 'sin' || config.time_encoding === 'raw') actualInputs += 1;
                        if (config.use_proprioception) {
                          const propType = config.proprioception_inputs || 'all';
                          if (propType === 'strain') actualInputs += 15;
                          else if (propType === 'velocity') actualInputs += 24;
                          else if (propType === 'ground') actualInputs += 8;
                          else actualInputs += 47;
                        }
                        return actualInputs;
                      })()}
                      {isNEAT ? (
                        (() => {
                          const hiddenCount = genome.neatGenome!.neurons.filter(n => n.type === 'hidden').length;
                          const outputCount = genome.neatGenome!.neurons.filter(n => n.type === 'output').length;
                          // Only show hidden layer if there are hidden neurons
                          return hiddenCount > 0
                            ? <>{' → '}{hiddenCount}{' → '}{outputCount}</>
                            : <>{' → '}{outputCount}</>;
                        })()
                      ) : (
                        <>
                          {' → '}
                          {genome.neuralGenome!.topology.hiddenSize}
                          {' → '}
                          {genome.neuralGenome!.topology.outputSize}
                        </>
                      )}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Activation:</span>{' '}
                      {isNEAT ? genome.neatGenome!.activation : genome.neuralGenome!.activation}
                    </div>
                    {isNEAT ? (
                      <div style={{ marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Connections:</span>{' '}
                        {genome.neatGenome!.connections.filter(c => c.enabled).length}
                        {' / '}
                        {genome.neatGenome!.connections.length}
                        {' (enabled/total)'}
                      </div>
                    ) : (
                      <div style={{ marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Weights:</span> {genome.neuralGenome!.weights.length}
                      </div>
                    )}

                    {/* Color key - above sensor inputs */}
                    <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '10px', marginBottom: '10px' }}>
                        <ColorKeyTooltip label="dir" color="var(--accent)" description="Direction to pellet - normalized xyz vector pointing from creature to nearest pellet" />
                        <ColorKeyTooltip label="vel" color="var(--success)" description="Creature velocity - normalized xyz velocity of the creature's center of mass" />
                        <ColorKeyTooltip label="dst" color="var(--text-secondary)" description="Distance to pellet - normalized distance from creature edge to pellet (0=touching, 1=far)" />
                        <ColorKeyTooltip label="t" color="var(--warning)" description="Time phase - cyclic or linear time encoding for rhythm synchronization" />
                        {(config.use_proprioception) && (
                          <>
                            <ColorKeyTooltip label="str" color="#e879f9" description="Muscle strain - how stretched/compressed each muscle is relative to rest length (-1 to 1)" />
                            <ColorKeyTooltip label="nv" color="#38bdf8" description="Node velocity - xyz velocity of each body node, showing how fast each part is moving" />
                            <ColorKeyTooltip label="gnd" color="#fbbf24" description="Ground contact - 1 if node is touching ground, 0 otherwise" />
                            <ColorKeyTooltip label="*" color="var(--text-muted)" description="Padded inputs - extra slots for tensor batching, always masked to 0" />
                          </>
                        )}
                      </div>

                      <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '4px' }}>SENSOR INPUTS</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', fontSize: '9px' }}>
                        {(() => {
                          const muscleNames = genome.muscles.map((m) => {
                            const nodeAIndex = genome.nodes.findIndex((n) => n.id === m.nodeA) + 1;
                            const nodeBIndex = genome.nodes.findIndex((n) => n.id === m.nodeB) + 1;
                            return `${nodeAIndex}-${nodeBIndex}`;
                          });
                          const allNames = getSensorNamesForEncoding(config.time_encoding || 'none', {
                            enabled: config.use_proprioception || false,
                            inputs: config.proprioception_inputs || 'all',
                            numMuscles: genome.muscles.length,
                            numNodes: genome.nodes.length,
                          }, muscleNames);

                          // Filter out padded inputs (ending with *) and count them
                          const regularInputs = allNames.filter(name => !name.endsWith('*'));
                          const paddedCount = allNames.filter(name => name.endsWith('*')).length;

                          const elements = regularInputs.map((name) => {
                            let color = 'var(--text-secondary)';
                            if (name.startsWith('dir_')) color = 'var(--accent)';
                            else if (name.startsWith('vel_')) color = 'var(--success)';
                            else if (name.startsWith('t_')) color = 'var(--warning)';
                            else if (name.includes('_str')) color = '#e879f9';
                            else if (name.includes('_v')) color = '#38bdf8';
                            else if (name.includes('_gnd')) color = '#fbbf24';
                            return (
                              <div key={name} style={{ color }}>
                                {name}
                              </div>
                            );
                          });

                          // Add padded count at end if any
                          if (paddedCount > 0) {
                            elements.push(
                              <ColorKeyTooltip
                                key="padded"
                                label={`+${paddedCount} padded`}
                                color="var(--text-muted)"
                                description={`${paddedCount} padded inputs for tensor batching - always masked to 0`}
                              />
                            );
                          }

                          return elements;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Family Tree panel */}
              <div
                style={{
                  flex: '1 1 240px',
                  minWidth: '220px',
                  overflowY: 'auto',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    borderBottom: '1px solid var(--border-light)',
                    paddingBottom: '4px',
                  }}
                >
                  <div style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '13px' }}>FAMILY TREE</div>
                  <select
                    value={lineageMode}
                    onChange={(e) => setLineageMode(e.target.value as 'both' | 'crossover' | 'clone')}
                    style={{
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="both">Both</option>
                    <option value="crossover">Crossover only</option>
                    <option value="clone">Clone only</option>
                  </select>
                </div>
                <div style={{ minHeight: '100px', minWidth: 'max-content' }}>
                  {familyTreeLoading ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                      Loading ancestry...
                    </div>
                  ) : familyTree ? (
                    <FamilyTreeDisplay tree={familyTree} lineageMode={lineageMode} />
                  ) : (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                      Select a creature to view ancestry
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row: Neural Network Visualization (full width) */}
          {hasNeuralGenome && (
            <div
              style={{
                borderRadius: '12px',
                border: '1px solid var(--border)',
                overflowX: 'auto',
                overflowY: 'hidden',
              }}
            >
              <div ref={neuralVizContainerRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Family tree display component
function FamilyTreeDisplay({
  tree,
  lineageMode,
}: {
  tree: FamilyTreeNode;
  lineageMode: 'both' | 'crossover' | 'clone';
}) {
  const seenIds = new Set<string>();

  const renderCreatureLabel = (creature: AncestorInfo, isRoot: boolean) => {
    const hue = creature.color.h * 360;
    const sat = creature.color.s * 100;
    const light = creature.color.l * 100;
    const color = `hsl(${hue}, ${sat}%, ${Math.min(light + 20, 80)}%)`;

    return (
      <>
        <span style={{ color, fontWeight: isRoot ? 600 : 400 }}>Gen {creature.generation}</span>
        <span style={{ color: 'var(--text-muted)' }}>
          {' '}
          · {creature.fitness.toFixed(0)}pts · {creature.nodeCount}N/{creature.muscleCount}M
        </span>
      </>
    );
  };

  const renderBranch = (
    node: FamilyTreeNode,
    indent: number,
    isLast: boolean,
    isRoot: boolean
  ): React.ReactElement | null => {
    const { creature } = node;

    if (creature.generation === -1) return null;
    if (seenIds.has(creature.id)) return null;
    seenIds.add(creature.id);

    const indentPx = indent * 16;
    const connector = indent === 0 ? '' : isLast ? '└─ ' : '├─ ';

    const knownParents = node.parents.filter((p) => p.creature.generation !== -1);
    // Get reproduction type from first parent (how this creature was created)
    const firstParentRepType = knownParents[0]?.creature.reproductionType;
    const relType =
      knownParents.length > 0
        ? firstParentRepType === 'crossover'
          ? '(crossover)'
          : '(mutated)'
        : null;

    const unseenParents = knownParents.filter((p) => !seenIds.has(p.creature.id));

    return (
      <div key={creature.id}>
        <div style={{ marginLeft: `${indentPx}px`, padding: '3px 0', fontSize: '11px', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--text-muted)' }}>{connector}</span>
          {renderCreatureLabel(creature, isRoot)}
          {relType && (
            <span style={{ color: 'var(--text-muted)', fontSize: '9px', marginLeft: '6px' }}>{relType}</span>
          )}
        </div>
        {unseenParents.map((parent, i) => renderBranch(parent, indent + 1, i === unseenParents.length - 1, false))}
      </div>
    );
  };

  // Handle generation 0
  if (tree.creature.generation === 0) {
    return (
      <div style={{ fontSize: '11px' }}>
        {renderCreatureLabel(tree.creature, true)}
        <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '8px' }}>
          Gen 0 - Randomly generated
        </div>
      </div>
    );
  }

  // Count unique ancestors
  const countUniqueAncestors = (node: FamilyTreeNode, seen: Set<string>): number => {
    if (node.creature.generation === -1) return 0;
    if (seen.has(node.creature.id)) return 0;
    seen.add(node.creature.id);
    let count = 1;
    for (const parent of node.parents) {
      count += countUniqueAncestors(parent, seen);
    }
    return count;
  };

  const findMinGeneration = (node: FamilyTreeNode): number => {
    if (node.creature.generation === -1) return Infinity;
    let min = node.creature.generation;
    for (const parent of node.parents) {
      const parentMin = findMinGeneration(parent);
      if (parentMin < min) min = parentMin;
    }
    return min;
  };

  const totalUnique = countUniqueAncestors(tree, new Set());
  const minGen = findMinGeneration(tree);
  const cappedText = totalUnique >= MAX_ANCESTORS ? ` (capped at ${MAX_ANCESTORS})` : '';
  const modeText = lineageMode !== 'both' ? ` [${lineageMode}]` : '';

  return (
    <>
      <div style={{ marginBottom: '8px', color: 'var(--text-muted)', fontSize: '10px' }}>
        {totalUnique} ancestors traced to Gen {minGen}
        {cappedText}
        {modeText}
      </div>
      <div style={{ fontFamily: 'monospace' }}>{renderBranch(tree, 0, true, true)}</div>
    </>
  );
}

export default ReplayModal;
