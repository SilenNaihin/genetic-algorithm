'use client';

import { useEvolutionStore, useConfig } from '../../stores/evolutionStore';
import { ParamSlider } from './ParamSlider';
import { TOOLTIPS } from '../ui/InfoTooltip';

/**
 * Physics configuration panel content - used inside CollapsibleAccordion.
 * Contains physics, muscle constraints, and neural update settings.
 */
export function PhysicsConfigPanel() {
  const config = useConfig();
  const setConfig = useEvolutionStore((s) => s.setConfig);

  return (
    <div style={{ paddingTop: '12px' }}>
      {/* Basic Physics */}
      <div style={{ marginBottom: '16px' }}>
        <ParamSlider
          name="Gravity"
          value={config.gravity}
          displayValue={String(config.gravity)}
          min={-30}
          max={-5}
          step={0.1}
          tooltip={TOOLTIPS.gravity}
          onChange={(v) => setConfig({ gravity: v })}
          width="100%"
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <ParamSlider
          name="Sim Duration"
          value={config.simulation_duration}
          displayValue={`${config.simulation_duration}s`}
          min={3}
          max={60}
          tooltip={TOOLTIPS.simulationDuration}
          onChange={(v) => setConfig({ simulation_duration: v })}
          width="100%"
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <ParamSlider
          name="Physics FPS"
          value={config.physics_fps}
          displayValue={`${config.physics_fps}`}
          min={15}
          max={120}
          step={15}
          tooltip={TOOLTIPS.physicsFPS}
          onChange={(v) => setConfig({ physics_fps: v, time_step: 1 / v })}
          width="100%"
        />
      </div>

      {/* Muscle Constraints Section */}
      <div style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        marginBottom: '12px',
        paddingTop: '8px',
        borderTop: '1px solid var(--border)',
      }}>
        Muscle Constraints
      </div>

      <div style={{ marginBottom: '16px' }}>
        <ParamSlider
          name="Damping"
          value={config.muscle_damping_multiplier}
          displayValue={`${config.muscle_damping_multiplier}x`}
          min={0.1}
          max={5}
          step={0.1}
          tooltip={TOOLTIPS.muscleDampingMultiplier}
          onChange={(v) => setConfig({ muscle_damping_multiplier: v })}
          width="100%"
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <ParamSlider
          name="Max Extension"
          value={config.max_extension_ratio}
          displayValue={`${config.max_extension_ratio}x`}
          min={1.2}
          max={5}
          step={0.1}
          tooltip={TOOLTIPS.maxExtensionRatio}
          onChange={(v) => setConfig({ max_extension_ratio: v })}
          width="100%"
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <ParamSlider
          name="Velocity Cap"
          value={config.muscle_velocity_cap}
          displayValue={`${config.muscle_velocity_cap}/s`}
          min={0.1}
          max={20}
          step={0.5}
          tooltip={TOOLTIPS.muscleVelocityCap}
          onChange={(v) => setConfig({ muscle_velocity_cap: v })}
          width="100%"
        />
      </div>

      {/* Max Frequency - hide in pure/NEAT modes since they use direct neural control */}
      {config.neural_mode === 'hybrid' && (
        <div style={{ marginBottom: '16px' }}>
          <ParamSlider
            name="Max Frequency"
            value={config.max_allowed_frequency}
            displayValue={`${config.max_allowed_frequency} Hz`}
            min={1}
            max={10}
            step={0.5}
            tooltip={TOOLTIPS.maxAllowedFrequency}
            onChange={(v) => setConfig({ max_allowed_frequency: v })}
            width="100%"
          />
        </div>
      )}

      {/* Neural Update Settings - only shown when neural net enabled */}
      {config.use_neural_net && (
        <>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px',
            marginBottom: '12px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border)',
          }}>
            Neural Timing
          </div>

          <div style={{ marginBottom: '16px' }}>
            <ParamSlider
              name="Update Rate"
              value={config.neural_update_hz}
              displayValue={`${config.neural_update_hz} Hz`}
              min={5}
              max={60}
              step={5}
              tooltip={TOOLTIPS.neuralUpdateHz}
              onChange={(v) => setConfig({ neural_update_hz: v })}
              width="100%"
            />
          </div>
          <div style={{ marginBottom: '4px' }}>
            <ParamSlider
              name="Output Smoothing"
              value={config.output_smoothing_alpha}
              displayValue={config.output_smoothing_alpha.toFixed(2)}
              min={0.05}
              max={1}
              step={0.05}
              tooltip={TOOLTIPS.outputSmoothingAlpha}
              onChange={(v) => setConfig({ output_smoothing_alpha: v })}
              width="100%"
            />
          </div>
        </>
      )}
    </div>
  );
}

export default PhysicsConfigPanel;
