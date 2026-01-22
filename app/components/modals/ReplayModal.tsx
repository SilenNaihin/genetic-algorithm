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
  const generation = useEvolutionStore((s) => s.generation);
  const maxGeneration = useEvolutionStore((s) => s.maxGeneration);
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

  const isOpen = replayResult !== null;
  const totalFrames = replayResult?.frames.length ?? 0;
  const totalDuration = replayResult?.frames[totalFrames - 1]?.time ?? 0;

  // Initialize renderer when modal opens
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // Create renderer
    const renderer = new ReplayRenderer(containerRef.current);
    rendererRef.current = renderer;

    // Load result
    if (replayResult) {
      renderer.loadResult(replayResult);
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
  }, [isOpen, replayResult]);

  // Initialize neural visualizer
  useEffect(() => {
    if (!isOpen || !replayResult || !neuralVizContainerRef.current) return;

    const genome = replayResult.genome;

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
  }, [isOpen, replayResult]);

  // Build family tree
  const buildFamilyTree = useCallback(async (genome: CreatureGenome) => {
    setFamilyTreeLoading(true);

    const currentRunId = StorageService.getCurrentRunId();
    if (!currentRunId) {
      setFamilyTree({
        creature: genomeToAncestorInfo(genome, 0, 0),
        parents: [],
      });
      setFamilyTreeLoading(false);
      return;
    }

    // Build ancestor map
    const ancestorMap = new Map<string, AncestorInfo>();

    // Add current creature
    const currentResult = simulationResults.find((r) => r.genome.id === genome.id);
    ancestorMap.set(
      genome.id,
      genomeToAncestorInfo(genome, currentResult?.finalFitness || 0, currentResult?.pelletsCollected || 0)
    );

    // Add all creatures from current results
    for (const result of simulationResults) {
      if (!ancestorMap.has(result.genome.id)) {
        ancestorMap.set(
          result.genome.id,
          genomeToAncestorInfo(result.genome, result.finalFitness, result.pelletsCollected)
        );
      }
    }

    // Load previous generations
    const maxGen = Math.max(genome.generation, generation, maxGeneration);
    for (let gen = maxGen - 1; gen >= 0; gen--) {
      try {
        const results = await StorageService.loadGeneration(currentRunId, gen, config);
        if (results) {
          for (const result of results) {
            if (!ancestorMap.has(result.genome.id)) {
              ancestorMap.set(
                result.genome.id,
                genomeToAncestorInfo(result.genome, result.finalFitness, result.pelletsCollected)
              );
            }
          }
        }
      } catch {
        // Generation not found
      }
    }

    // Build tree
    const ancestorCount = { count: 0 };
    const tree = buildTreeNode(genome.id, ancestorMap, 0, 100, ancestorCount, lineageMode);
    setFamilyTree(tree);
    setFamilyTreeLoading(false);
  }, [simulationResults, generation, maxGeneration, config, lineageMode]);

  // Rebuild family tree when lineage mode changes
  useEffect(() => {
    if (isOpen && replayResult) {
      buildFamilyTree(replayResult.genome);
    }
  }, [isOpen, replayResult, lineageMode, buildFamilyTree]);

  // Animation loop - uses simulation time like vanilla app
  useEffect(() => {
    if (!isOpen || !isPlaying || !replayResult || !rendererRef.current) return;

    const frames = replayResult.frames;
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
      const fitness = replayResult.fitnessOverTime[frameIndex] || 0;
      setCurrentFitness(fitness);
      rendererRef.current?.renderFrame(frames[frameIndex], frameIndex);

      // Update neural visualization if creature has neural genome
      const genome = replayResult.genome;
      if (neuralVisualizerRef.current && genome.neuralGenome && genome.controllerType === 'neural') {
        const frame = frames[frameIndex];
        const com = frame.centerOfMass;

        // Find active pellet at this frame
        const activePelletData = replayResult.pellets.find((p) =>
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

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isOpen, isPlaying, replayResult, speed]);

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
    if (replayResult && replayResult.frames.length > 0) {
      const currentTime = replayResult.frames[currentFrame]?.time || 0;
      startTimeRef.current = performance.now() - (currentTime * 1000 / newSpeed);
    }
    setSpeed(newSpeed);
  };

  const handleTogglePlay = () => {
    if (!isPlaying && replayResult && replayResult.frames.length > 0) {
      // Resume from current position
      const currentTime = replayResult.frames[currentFrame]?.time || 0;
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

  const genome = replayResult.genome;
  const hasNeuralGenome = genome.neuralGenome && genome.controllerType === 'neural';

  // Calculate max fitness from fitnessOverTime for progress bar scaling
  const maxFitness = Math.max(...(replayResult.fitnessOverTime || [0]), 0.1);
  const fitnessProgress = Math.min(100, (currentFitness / maxFitness) * 100);

  // Get current time from frame
  const currentTime = replayResult.frames[currentFrame]?.time || 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Simulation Replay" maxWidth="1100px">
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Left: Replay viewer */}
        <div style={{ flex: '0 0 500px' }}>
          <div
            ref={containerRef}
            style={{
              width: '500px',
              height: '350px',
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
                {replayResult.pelletsCollected}/{replayResult.pellets.length}
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

        {/* Right: Neural Network + Family Tree side by side */}
        <div style={{ flex: '1 1 auto', display: 'flex', gap: '16px', minWidth: 0 }}>
          {/* Neural Network panel (only shown for neural creatures) */}
          {hasNeuralGenome && (
            <div
              style={{
                flex: '0 0 280px',
                maxHeight: '480px',
                background: 'var(--bg-tertiary)',
                borderRadius: '12px',
                padding: '16px',
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
              flex: '1 1 280px',
              minWidth: '250px',
              maxHeight: '480px',
              overflow: 'auto',
              background: 'var(--bg-tertiary)',
              borderRadius: '12px',
              padding: '16px',
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

// Helper functions
function genomeToAncestorInfo(
  genome: CreatureGenome,
  fitness: number,
  pelletsCollected: number
): AncestorInfo {
  return {
    id: genome.id,
    generation: genome.generation,
    fitness,
    pelletsCollected,
    nodeCount: genome.nodes.length,
    muscleCount: genome.muscles.length,
    color: genome.color,
    parentIds: genome.parentIds,
  };
}

function shouldFollowLineage(parentCount: number, mode: 'both' | 'crossover' | 'clone'): boolean {
  switch (mode) {
    case 'crossover':
      return parentCount > 1;
    case 'clone':
      return parentCount === 1;
    case 'both':
    default:
      return true;
  }
}

function buildTreeNode(
  creatureId: string,
  ancestorMap: Map<string, AncestorInfo>,
  depth: number,
  maxDepth: number,
  ancestorCount: { count: number },
  lineageMode: 'both' | 'crossover' | 'clone'
): FamilyTreeNode {
  const ancestor = ancestorMap.get(creatureId);

  if (!ancestor) {
    return {
      creature: {
        id: creatureId,
        generation: -1,
        fitness: 0,
        pelletsCollected: 0,
        nodeCount: 0,
        muscleCount: 0,
        color: { h: 0, s: 0, l: 0.5 },
        parentIds: [],
      },
      parents: [],
    };
  }

  ancestorCount.count++;

  const parents: FamilyTreeNode[] = [];

  if (
    depth < maxDepth &&
    ancestorCount.count < MAX_ANCESTORS &&
    shouldFollowLineage(ancestor.parentIds.length, lineageMode)
  ) {
    for (const parentId of ancestor.parentIds) {
      if (ancestorCount.count >= MAX_ANCESTORS) break;
      parents.push(buildTreeNode(parentId, ancestorMap, depth + 1, maxDepth, ancestorCount, lineageMode));
    }
  }

  return { creature: ancestor, parents };
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
    const relType =
      isRoot && knownParents.length > 0
        ? knownParents.length === 1
          ? '(mutated from)'
          : '(offspring of)'
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
