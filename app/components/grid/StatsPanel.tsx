'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  useEvolutionStore,
  useGeneration,
  useSimulationResults,
  useConfig,
} from '../../stores/evolutionStore';
import { CreatureCardRenderer, getCreatureName } from '../../../src/ui/CreatureCardRenderer';
import { useCreatureTooltip } from './CreatureTooltip';
import { useSimulation } from '../../hooks/useSimulation';

/**
 * Stats panel showing generation info, fitness stats, and hall of fame.
 * Uses stats-panel, stats-title, stat-row, stat-label, stat-value classes.
 */
export function StatsPanel() {
  const router = useRouter();
  const generation = useGeneration();
  const simulationResults = useSimulationResults();
  const config = useConfig();
  const runName = useEvolutionStore((s) => s.runName);
  const setRunName = useEvolutionStore((s) => s.setRunName);
  const viewingGeneration = useEvolutionStore((s) => s.viewingGeneration);
  const maxGeneration = useEvolutionStore((s) => s.maxGeneration);
  const setReplayResult = useEvolutionStore((s) => s.setReplayResult);
  const setBrainEvolutionModalOpen = useEvolutionStore((s) => s.setBrainEvolutionModalOpen);
  const setGenerationJumpModalOpen = useEvolutionStore((s) => s.setGenerationJumpModalOpen);
  const bestCreatureEver = useEvolutionStore((s) => s.bestCreatureEver);
  const bestCreatureGeneration = useEvolutionStore((s) => s.bestCreatureGeneration);
  const longestSurvivingCreature = useEvolutionStore((s) => s.longestSurvivingCreature);
  const longestSurvivingGenerations = useEvolutionStore((s) => s.longestSurvivingGenerations);
  const longestSurvivingDiedAt = useEvolutionStore((s) => s.longestSurvivingDiedAt);

  const { showTooltip, hideTooltip } = useCreatureTooltip();
  const { viewGeneration, returnToCurrentGeneration, forkFromGeneration } = useSimulation();

  // Renderer and canvas refs for hall of fame thumbnails
  const rendererRef = useRef<CreatureCardRenderer | null>(null);
  const bestCanvasRef = useRef<HTMLCanvasElement>(null);
  const longestCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize renderer
  useEffect(() => {
    rendererRef.current = new CreatureCardRenderer();
    return () => {
      rendererRef.current?.dispose();
    };
  }, []);

  // Render best creature thumbnail
  useEffect(() => {
    if (bestCreatureEver && bestCanvasRef.current && rendererRef.current) {
      const ctx = bestCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e1e2a';
        ctx.fillRect(0, 0, 160, 160);
      }
      rendererRef.current.renderToCanvas(bestCreatureEver, bestCanvasRef.current);
    }
  }, [bestCreatureEver]);

  // Render longest survivor thumbnail
  useEffect(() => {
    if (longestSurvivingCreature && longestCanvasRef.current && rendererRef.current) {
      const ctx = longestCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e1e2a';
        ctx.fillRect(0, 0, 160, 160);
      }
      rendererRef.current.renderToCanvas(longestSurvivingCreature, longestCanvasRef.current);
    }
  }, [longestSurvivingCreature]);

  // Calculate stats from results
  const validResults = simulationResults.filter(
    (r) => !isNaN(r.finalFitness) && isFinite(r.finalFitness)
  );
  const hasResults = validResults.length > 0;
  const best = hasResults ? Math.max(...validResults.map((r) => r.finalFitness)) : 0;
  const avg = hasResults
    ? validResults.reduce((sum, r) => sum + r.finalFitness, 0) / validResults.length
    : 0;
  const worst = hasResults ? Math.min(...validResults.map((r) => r.finalFitness)) : 0;

  // Navigation state
  const isViewingHistory = viewingGeneration !== null;
  const displayGen = viewingGeneration !== null ? viewingGeneration : generation;
  const canGoPrev = displayGen > 0;
  const canGoNext =
    isViewingHistory && (viewingGeneration! < maxGeneration || viewingGeneration! < generation);

  const handlePrevGen = async () => {
    if (canGoPrev) {
      await viewGeneration(displayGen - 1);
    }
  };

  const handleNextGen = async () => {
    if (canGoNext) {
      const nextGen = viewingGeneration! + 1;
      if (nextGen >= generation) {
        await returnToCurrentGeneration();
      } else {
        await viewGeneration(nextGen);
      }
    }
  };

  const handleGoToCurrent = async () => {
    await returnToCurrentGeneration();
  };

  return (
    <div className="stats-panel glass">
      {/* Run name input */}
      <div className="run-name-container" style={{ marginBottom: '8px' }}>
        <input
          type="text"
          id="run-name-input"
          value={runName}
          onChange={(e) => setRunName(e.target.value)}
          placeholder="Name this run..."
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid transparent',
            color: 'var(--text)',
            fontSize: '13px',
            fontWeight: 600,
            padding: '4px 0',
            outline: 'none',
          }}
        />
      </div>

      {/* Generation navigation */}
      <div className="stats-title gen-nav">
        <button
          className="gen-nav-btn"
          onClick={handlePrevGen}
          disabled={!canGoPrev}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span
          className="gen-display"
          title="Click to jump to a specific generation"
          onClick={() => setGenerationJumpModalOpen(true)}
          style={{ cursor: 'pointer' }}
        >
          {isViewingHistory ? (
            <>
              <span className="gen-viewing" style={{ color: 'var(--warning)' }}>
                {displayGen}
              </span>
              <span className="gen-separator" style={{ color: 'var(--text-muted)', margin: '0 4px' }}>
                /
              </span>
              <span
                className="gen-max"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGoToCurrent();
                }}
                style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                {generation}
              </span>
            </>
          ) : (
            `Generation ${displayGen}`
          )}
        </span>
        <button
          className="gen-nav-btn"
          onClick={handleNextGen}
          disabled={!canGoNext}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      {/* History badge */}
      {isViewingHistory && (
        <>
          <div
            className="history-badge"
            style={{
              background: 'var(--warning)',
              color: 'var(--bg-primary)',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              textAlign: 'center',
              marginBottom: '8px',
            }}
          >
            VIEWING HISTORY
          </div>
          <button
            className="btn btn-secondary btn-small"
            onClick={async () => {
              const newRunId = await forkFromGeneration();
              if (newRunId) {
                router.push(`/run/${newRunId}`);
              }
            }}
            style={{ marginTop: '8px', width: '100%', fontSize: '11px' }}
          >
            Fork from Gen {displayGen}
          </button>
        </>
      )}

      {/* Stats rows */}
      <div className="stat-row">
        <span className="stat-label">Creatures</span>
        <span className="stat-value">{simulationResults.length}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Best Fitness</span>
        <span className="stat-value success">{hasResults ? best.toFixed(1) : '-'}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Avg Fitness</span>
        <span className="stat-value accent">{hasResults ? avg.toFixed(1) : '-'}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Worst Fitness</span>
        <span className="stat-value danger">{hasResults ? worst.toFixed(1) : '-'}</span>
      </div>

      {/* NEAT topology stats - only show when NEAT mode is enabled */}
      {config.neuralMode === 'neat' && hasResults && (() => {
        const neatResults = validResults.filter(r => r.genome.neatGenome);
        if (neatResults.length === 0) return null;

        const avgHiddenNodes = neatResults.reduce((sum, r) => {
          const hidden = r.genome.neatGenome!.neurons.filter(n => n.type === 'hidden').length;
          return sum + hidden;
        }, 0) / neatResults.length;

        const avgConnections = neatResults.reduce((sum, r) => {
          const enabled = r.genome.neatGenome!.connections.filter(c => c.enabled).length;
          return sum + enabled;
        }, 0) / neatResults.length;

        const avgTotalConnections = neatResults.reduce((sum, r) => {
          return sum + r.genome.neatGenome!.connections.length;
        }, 0) / neatResults.length;

        return (
          <>
            <div className="stat-row" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              <span className="stat-label">Avg Hidden Nodes</span>
              <span className="stat-value">{avgHiddenNodes.toFixed(1)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Avg Connections</span>
              <span className="stat-value">
                {avgConnections.toFixed(1)}
                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}> / {avgTotalConnections.toFixed(1)}</span>
              </span>
            </div>
          </>
        );
      })()}

      {/* Longest Survivor */}
      {longestSurvivingCreature && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Longest Survivor{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              ({longestSurvivingGenerations} gens, to Gen {longestSurvivingDiedAt})
            </span>
          </div>
          <div
            onClick={() => {
              const hasFramesOrCanLoad = longestSurvivingCreature.frames.length > 0 || longestSurvivingCreature.genome._apiCreatureId;
              if (hasFramesOrCanLoad && !longestSurvivingCreature.disqualified) {
                // Mark to fetch best performance, not latest generation
                const resultWithBestFlag = {
                  ...longestSurvivingCreature,
                  genome: { ...longestSurvivingCreature.genome, _fetchBestPerformance: true },
                };
                setReplayResult(resultWithBestFlag);
              }
            }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              showTooltip(longestSurvivingCreature, rect);
            }}
            onMouseLeave={hideTooltip}
            style={{
              width: '80px',
              height: '80px',
              background: 'var(--bg-card)',
              border: '2px solid #a855f7',
              borderRadius: '8px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)',
            }}
          >
            <canvas
              ref={longestCanvasRef}
              width={160}
              height={160}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
            <span
              style={{
                position: 'absolute',
                top: '4px',
                left: '4px',
                fontSize: '9px',
                fontWeight: 600,
                color: '#a855f7',
                background: 'rgba(0, 0, 0, 0.6)',
                padding: '2px 5px',
                borderRadius: '4px',
              }}
            >
              {getCreatureName(longestSurvivingCreature.genome)}
            </span>
            <span
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                fontSize: '9px',
                fontWeight: 600,
                color: '#a855f7',
                background: 'rgba(0, 0, 0, 0.6)',
                padding: '2px 5px',
                borderRadius: '4px',
              }}
            >
              {longestSurvivingCreature.finalFitness.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* Best Creature Ever */}
      {bestCreatureEver && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Best Ever{' '}
            <span style={{ color: 'var(--text-secondary)' }}>(Gen {bestCreatureGeneration})</span>
          </div>
          <div
            onClick={() => {
              const hasFramesOrCanLoad = bestCreatureEver.frames.length > 0 || bestCreatureEver.genome._apiCreatureId;
              if (hasFramesOrCanLoad && !bestCreatureEver.disqualified) {
                // Set the specific generation where this was the best
                const resultWithGen = {
                  ...bestCreatureEver,
                  genome: { ...bestCreatureEver.genome, _bestPerformanceGeneration: bestCreatureGeneration },
                };
                setReplayResult(resultWithGen);
              }
            }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              showTooltip(bestCreatureEver, rect);
            }}
            onMouseLeave={hideTooltip}
            style={{
              width: '80px',
              height: '80px',
              background: 'var(--bg-card)',
              border: '2px solid var(--success)',
              borderRadius: '8px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
            }}
          >
            <canvas
              ref={bestCanvasRef}
              width={160}
              height={160}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
            <span
              style={{
                position: 'absolute',
                top: '4px',
                left: '4px',
                fontSize: '9px',
                fontWeight: 600,
                color: '#ffd700',
                background: 'rgba(0, 0, 0, 0.6)',
                padding: '2px 5px',
                borderRadius: '4px',
              }}
            >
              {getCreatureName(bestCreatureEver.genome)}
            </span>
            <span
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                fontSize: '9px',
                fontWeight: 600,
                color: '#ffd700',
                background: 'rgba(0, 0, 0, 0.6)',
                padding: '2px 5px',
                borderRadius: '4px',
              }}
            >
              {bestCreatureEver.finalFitness.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* Compare Brains button - only show in neural mode with history */}
      {config.neuralMode && generation > 0 && (
        <button
          className="btn btn-secondary"
          onClick={() => setBrainEvolutionModalOpen(true)}
          style={{
            marginTop: '12px',
            width: '100%',
            fontSize: '11px',
          }}
        >
          Compare Brains
        </button>
      )}
    </div>
  );
}

export default StatsPanel;
