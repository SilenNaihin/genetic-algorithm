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
          value={config.simulationDuration}
          displayValue={`${config.simulationDuration}s`}
          min={3}
          max={60}
          tooltip={TOOLTIPS.simulationDuration}
          onChange={(v) => setConfig({ simulationDuration: v })}
          width="100%"
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <ParamSlider
          name="Physics FPS"
          value={config.physicsFPS}
          displayValue={`${config.physicsFPS}`}
          min={15}
          max={120}
          step={15}
          tooltip={TOOLTIPS.physicsFPS}
          onChange={(v) => setConfig({ physicsFPS: v, timeStep: 1 / v })}
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
          value={config.muscleDampingMultiplier}
          displayValue={`${config.muscleDampingMultiplier}x`}
          min={0.1}
          max={5}
          step={0.1}
          tooltip={TOOLTIPS.muscleDampingMultiplier}
          onChange={(v) => setConfig({ muscleDampingMultiplier: v })}
          width="100%"
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <ParamSlider
          name="Max Extension"
          value={config.maxExtensionRatio}
          displayValue={`${config.maxExtensionRatio}x`}
          min={1.2}
          max={5}
          step={0.1}
          tooltip={TOOLTIPS.maxExtensionRatio}
          onChange={(v) => setConfig({ maxExtensionRatio: v })}
          width="100%"
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <ParamSlider
          name="Velocity Cap"
          value={config.muscleVelocityCap}
          displayValue={`${config.muscleVelocityCap}/s`}
          min={0.1}
          max={20}
          step={0.5}
          tooltip={TOOLTIPS.muscleVelocityCap}
          onChange={(v) => setConfig({ muscleVelocityCap: v })}
          width="100%"
        />
      </div>

      {/* Max Frequency - hide in pure mode since it's irrelevant */}
      {config.neuralMode !== 'pure' && (
        <div style={{ marginBottom: '16px' }}>
          <ParamSlider
            name="Max Frequency"
            value={config.maxAllowedFrequency}
            displayValue={`${config.maxAllowedFrequency} Hz`}
            min={1}
            max={10}
            step={0.5}
            tooltip={TOOLTIPS.maxAllowedFrequency}
            onChange={(v) => setConfig({ maxAllowedFrequency: v })}
            width="100%"
          />
        </div>
      )}

      {/* Neural Update Settings - only shown when neural net enabled */}
      {config.useNeuralNet && (
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
              value={config.neuralUpdateHz}
              displayValue={`${config.neuralUpdateHz} Hz`}
              min={5}
              max={60}
              step={5}
              tooltip={TOOLTIPS.neuralUpdateHz}
              onChange={(v) => setConfig({ neuralUpdateHz: v })}
              width="100%"
            />
          </div>
          <div style={{ marginBottom: '4px' }}>
            <ParamSlider
              name="Output Smoothing"
              value={config.outputSmoothingAlpha}
              displayValue={config.outputSmoothingAlpha.toFixed(2)}
              min={0.05}
              max={1}
              step={0.05}
              tooltip={TOOLTIPS.outputSmoothingAlpha}
              onChange={(v) => setConfig({ outputSmoothingAlpha: v })}
              width="100%"
            />
          </div>
        </>
      )}
    </div>
  );
}

export default PhysicsConfigPanel;
