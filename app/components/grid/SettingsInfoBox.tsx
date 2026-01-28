'use client';

import { useState } from 'react';
import { useConfig } from '../../stores/evolutionStore';

/**
 * Settings info box showing current config in top-right corner.
 * Has collapsible sections for fitness and neural config.
 */
export function SettingsInfoBox() {
  const config = useConfig();
  const [fitnessExpanded, setFitnessExpanded] = useState(false);
  const [neuralExpanded, setNeuralExpanded] = useState(false);

  return (
    <div
      className="glass"
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        padding: '12px 16px',
        fontSize: '11px',
        color: 'var(--text-muted)',
        borderRadius: '8px',
      }}
    >
      <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>
        Settings
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '4px 12px' }}>
        <span>Gravity:</span>
        <span style={{ color: 'var(--text-primary)' }}>{config.gravity}</span>
        <span>Mutation:</span>
        <span style={{ color: 'var(--text-primary)' }}>{Math.round(config.mutation_rate * 100)}%</span>
        <span>Max Freq:</span>
        <span style={{ color: 'var(--text-primary)' }}>{config.max_allowed_frequency} Hz</span>
        <span>Duration:</span>
        <span style={{ color: 'var(--text-primary)' }}>{config.simulation_duration}s</span>
        <span>Max Nodes:</span>
        <span style={{ color: 'var(--text-primary)' }}>{config.max_nodes}</span>
        <span>Max Muscles:</span>
        <span style={{ color: 'var(--text-primary)' }}>{config.max_muscles}</span>
      </div>

      {/* Fitness dropdown */}
      <div
        onClick={() => setFitnessExpanded(!fitnessExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: '11px',
          marginTop: '10px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transition: 'transform 0.2s',
            transform: fitnessExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
        <span>Fitness Config</span>
      </div>
      {fitnessExpanded && (
        <div
          style={{
            marginTop: '6px',
            padding: '8px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto auto',
              gap: '2px 10px',
              fontSize: '10px',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Pellet Points:</span>
            <span style={{ color: 'var(--text-secondary)' }}>{config.fitness_pellet_points}</span>
            <span style={{ color: 'var(--text-muted)' }}>Progress Max:</span>
            <span style={{ color: 'var(--text-secondary)' }}>{config.fitness_progress_max}</span>
            <span style={{ color: 'var(--text-muted)' }}>Dist/Unit:</span>
            <span style={{ color: 'var(--text-secondary)' }}>{config.fitness_distance_per_unit}</span>
            <span style={{ color: 'var(--text-muted)' }}>Dist Max:</span>
            <span style={{ color: 'var(--text-secondary)' }}>{config.fitness_distance_traveled_max}</span>
            <span style={{ color: 'var(--text-muted)' }}>Regression Penalty:</span>
            <span style={{ color: 'var(--text-secondary)' }}>{config.fitness_regression_penalty}</span>
          </div>
        </div>
      )}

      {/* Neural dropdown - only if neural net enabled */}
      {config.use_neural_net && (
        <>
          <div
            onClick={() => setNeuralExpanded(!neuralExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '11px',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transition: 'transform 0.2s',
                transform: neuralExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span>Neural Config</span>
          </div>
          {neuralExpanded && (
            <div
              style={{
                marginTop: '6px',
                padding: '8px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '6px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto auto',
                  gap: '2px 10px',
                  fontSize: '10px',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Mode:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{config.neural_mode}</span>
                <span style={{ color: 'var(--text-muted)' }}>Hidden Size:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{config.neural_hidden_size}</span>
                <span style={{ color: 'var(--text-muted)' }}>Activation:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{config.neural_activation}</span>
                <span style={{ color: 'var(--text-muted)' }}>Weight Mut Rate:</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {Math.round(config.weight_mutation_rate * 100)}%
                </span>
                <span style={{ color: 'var(--text-muted)' }}>Weight Mut Mag:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{config.weight_mutation_magnitude}</span>
                <span style={{ color: 'var(--text-muted)' }}>Rate Decay:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{config.weight_mutation_decay}</span>
                <span style={{ color: 'var(--text-muted)' }}>Efficiency Penalty:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{config.fitness_efficiency_penalty}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SettingsInfoBox;
