'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEvolutionStore } from '../../stores/evolutionStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ReplayRenderer } from '../../../src/rendering/ReplayRenderer';
import { NeuralVisualizer } from '../../../src/ui/NeuralVisualizer';
import { gatherSensorInputsPure, gatherSensorInputsHybrid, NEURAL_INPUT_SIZE_PURE } from '../../../src/neural';
import * as StorageService from '../../../src/services/StorageService';
import type { CreatureGenome } from '../../../src/types';
import type { CreatureSimulationResult } from '../../../src/types';

// Sensor names for neural info display
const SENSOR_NAMES = ['dir_x', 'dir_y', 'dir_z', 'vel_x', 'vel_y', 'vel_z', 'dist', 'time'];

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
  const config = useEvolutionStore((s) => s.config);

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
        firstActivations: replayResult.activationsPerFrame?.[0]?.slice(0, 3),
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
    ).then(({ frames, fitnessOverTime, pellets }) => {
      console.log('[ReplayModal] Loaded frames:', {
        framesLength: frames.length,
        fitnessOverTimeLength: fitnessOverTime.length,
        pelletsLength: pellets.length,
        firstFrame: frames[0],
        lastFrame: frames[frames.length - 1],
      });
      setLoadedResult({
        ...replayResult,
        frames,
        fitnessOverTime,
        pellets: pellets.length > 0 ? pellets : replayResult.pellets,
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

    // Only create visualizer if creature has neural genome
    if (!genome.neuralGenome || genome.controllerType !== 'neural') {
      return;
    }

    // Create visualizer
    neuralVizContainerRef.current.innerHTML = '';
    const visualizer = new NeuralVisualizer(neuralVizContainerRef.current, {
      width: 248,
      height: 160,
      showLabels: true,
      showWeights: true,
    });
    neuralVisualizerRef.current = visualizer;

    // Get muscle names for labels
    const muscleNames = genome.muscles.map((m) => {
      const nodeAIndex = genome.nodes.findIndex((n) => n.id === m.nodeA) + 1;
      const nodeBIndex = genome.nodes.findIndex((n) => n.id === m.nodeB) + 1;
      return `${nodeAIndex}-${nodeBIndex}`;
    });

    visualizer.setGenome(genome.neuralGenome, muscleNames);

    return () => {
      if (neuralVisualizerRef.current) {
        neuralVisualizerRef.current.dispose();
        neuralVisualizerRef.current = null;
      }
    };
  }, [isOpen, loadedResult]);

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
    let currentNode = tree;
    for (let i = ancestryChain.length - 1; i >= 0; i--) {
      const ancestor = ancestryChain[i];
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

      // Update neural visualization if creature has neural genome
      const genome = loadedResult.genome;
      if (neuralVisualizerRef.current && genome.neuralGenome && genome.controllerType === 'neural') {
        // Prefer stored activations from simulation (accurate)
        if (loadedResult.activationsPerFrame && loadedResult.activationsPerFrame[frameIndex]) {
          neuralVisualizerRef.current.setStoredActivations(loadedResult.activationsPerFrame[frameIndex]);
        } else {
          // Fallback: recompute from sensor inputs (may differ from actual simulation)
          const frame = frames[frameIndex];
          const com = frame.centerOfMass;

          // Find active pellet at this frame
          const activePelletData = loadedResult.pellets.find((p) =>
            p.spawnedAtFrame <= frameIndex &&
            (p.collectedAtFrame === null || frameIndex < p.collectedAtFrame)
          );

          // Calculate pellet direction
          let pelletDir = { x: 0, y: 0, z: 0 };
          let normalizedDist = 1;

          if (activePelletData) {
            const dx = activePelletData.position.x - com.x;
            const dy = activePelletData.position.y - com.y;
            const dz = activePelletData.position.z - com.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist > 0.01) {
              pelletDir = { x: dx / dist, y: dy / dist, z: dz / dist };
            }
            normalizedDist = Math.min(dist / 20, 1);
          }

          // Calculate velocity from previous frame
          let velocityDir = { x: 0, y: 0, z: 0 };
          if (frameIndex > 0) {
            const prevFrame = frames[frameIndex - 1];
            const vx = com.x - prevFrame.centerOfMass.x;
            const vy = com.y - prevFrame.centerOfMass.y;
            const vz = com.z - prevFrame.centerOfMass.z;
            const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
            if (speed > 0.001) {
              velocityDir = { x: vx / speed, y: vy / speed, z: vz / speed };
            }
          }

          // Gather sensor inputs based on neural mode
          const isPureMode = genome.neuralGenome.topology.inputSize === NEURAL_INPUT_SIZE_PURE;
          const sensorInputs = isPureMode
            ? gatherSensorInputsPure(pelletDir, velocityDir, normalizedDist)
            : gatherSensorInputsHybrid(pelletDir, velocityDir, normalizedDist, targetTime);

          neuralVisualizerRef.current.updateActivations(sensorInputs);
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
      <Modal isOpen={isOpen} onClose={() => setReplayResult(null)} title="Simulation Replay" maxWidth="600px">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '300px',
          color: 'var(--text-muted)',
          fontSize: '16px',
        }}>
          Loading replay data...
        </div>
      </Modal>
    );
  }

  const genome = loadedResult.genome;
  const hasNeuralGenome = genome.neuralGenome && genome.controllerType === 'neural';

  // Calculate max fitness from fitnessOverTime for progress bar scaling
  const maxFitness = Math.max(...(loadedResult.fitnessOverTime || [0]), 0.1);
  const fitnessProgress = Math.min(100, (currentFitness / maxFitness) * 100);

  // Get current time from frame
  const currentTime = loadedResult.frames[currentFrame]?.time || 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Simulation Replay" maxWidth="1450px">
      <div style={{ display: 'flex', gap: '20px' }}>
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
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 4].map((s) => (
                    <Button
                      key={s}
                      variant="secondary"
                      size="small"
                      onClick={() => handleSpeedChange(s)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: speed === s ? 'var(--accent)' : undefined,
                        color: speed === s ? 'white' : undefined,
                      }}
                    >
                      {s}x
                    </Button>
                  ))}
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

        {/* Right: Genome Viewer + Neural Network + Family Tree */}
        <div style={{ display: 'flex', flex: 1, gap: '16px', minWidth: 0 }}>
          {/* Genome Viewer panel */}
          <div
            style={{
              flex: '0 0 260px',
              maxHeight: '480px',
              overflow: 'auto',
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
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ID</span>
                  <span style={{ color: 'var(--text-primary)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={genome.id}>{genome.id.slice(0, 12)}...</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Generation</span>
                  <span style={{ color: 'var(--text-primary)' }}>{genome.generation}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Survival Streak</span>
                  <span style={{ color: 'var(--success)' }}>{genome.survivalStreak}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Parents</span>
                  <span style={{ color: 'var(--text-primary)' }}>{genome.parentIds.length || 'Gen 0'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Freq Mult</span>
                  <span style={{ color: 'var(--text-primary)' }}>{genome.globalFrequencyMultiplier.toFixed(2)}×</span>
                </div>
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
                  const isPureNeural = hasNeuralGenome && config.neuralMode === 'pure';
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

                      {/* Oscillation - only for hybrid/oscillator mode */}
                      {!isPureNeural && (
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Oscillation</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '11px' }}>
                            <div><span style={{ color: 'var(--text-muted)' }}>frq</span> <span style={{ color: 'var(--accent-light)' }}>{muscle.frequency.toFixed(1)}</span></div>
                            <div><span style={{ color: 'var(--text-muted)' }}>amp</span> <span style={{ color: 'var(--accent-light)' }}>{muscle.amplitude.toFixed(2)}</span></div>
                            <div><span style={{ color: 'var(--text-muted)' }}>phs</span> <span style={{ color: 'var(--accent-light)' }}>{muscle.phase.toFixed(1)}</span></div>
                          </div>
                        </div>
                      )}

                      {/* Pure neural - just show amplitude (used as multiplier) */}
                      {isPureNeural && (
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Neural Control</div>
                          <div style={{ fontSize: '11px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>amplitude</span> <span style={{ color: 'var(--accent-light)' }}>{muscle.amplitude.toFixed(2)}</span>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>(multiplier)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Neural Network panel (only shown for neural creatures) */}
          {hasNeuralGenome && (
            <div
              style={{
                flex: '0 0 260px',
                maxHeight: '480px',
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
                NEURAL NETWORK
              </div>
              <div ref={neuralVizContainerRef} style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Mode:</span> {config.neuralMode || 'hybrid'}
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Topology:</span>{' '}
                  {genome.neuralGenome!.topology.inputSize} → {genome.neuralGenome!.topology.hiddenSize} →{' '}
                  {genome.neuralGenome!.topology.outputSize}
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Activation:</span> {genome.neuralGenome!.activation}
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Weights:</span> {genome.neuralGenome!.weights.length}
                </div>
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '4px' }}>SENSOR INPUTS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', fontSize: '9px' }}>
                    {SENSOR_NAMES.map((name, i) => (
                      <div
                        key={name}
                        style={{
                          color: i < 3 ? 'var(--accent)' : i < 6 ? 'var(--success)' : 'var(--text-secondary)',
                        }}
                      >
                        {name}
                      </div>
                    ))}
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
              maxHeight: '480px',
              overflow: 'auto',
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
    </Modal>
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
      isRoot && knownParents.length > 0
        ? firstParentRepType === 'crossover'
          ? '(crossover from)'
          : '(mutated from)'
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
