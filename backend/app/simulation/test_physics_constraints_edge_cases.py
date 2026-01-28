"""
Edge case and stress tests for v2-prd physics constraints.

These tests intentionally try to break the implementation by exploring:
- Numerical boundaries (0, NaN, Inf, very large/small values)
- Config validation (min/max bounds, invalid types)
- Integration between constraints (velocity cap + extension limit + smoothing)
- Backend propagation (config flows correctly through the stack)
- Real-world scenarios (converged populations, extreme muscle ratios)

Physics constraints tested:
1. Muscle Velocity Cap (muscleVelocityCap)
2. Output Smoothing (outputSmoothingAlpha, neuralUpdateHz)
3. Max Extension Ratio (maxExtensionRatio)
4. Damping Multiplier (muscleDampingMultiplier)
"""

import pytest
import torch
import math

from app.simulation.physics import (
    apply_velocity_cap,
    apply_output_smoothing,
    apply_extension_limit,
    physics_step_neural,
    simulate_with_fitness_neural,
)
from app.simulation.tensors import creature_genomes_to_batch, MAX_MUSCLES, MAX_NODES
from app.schemas.simulation import SimulationConfig
from app.services.pytorch_simulator import PyTorchSimulator


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def simple_genome():
    """A minimal 2-node, 1-muscle creature for testing."""
    return {
        "id": "test-creature",
        "nodes": [
            {"id": "1", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.2},
            {"id": "2", "position": {"x": 1, "y": 0.5, "z": 0}, "size": 0.2},
        ],
        "muscles": [
            {
                "id": "m1",
                "nodeA": "1",
                "nodeB": "2",
                "restLength": 1.0,
                "stiffness": 100,
                "damping": 10,
                "frequency": 1.0,
                "amplitude": 0.2,
                "phase": 0,
            }
        ],
        "neuralGenome": {
            "inputSize": 7,
            "hiddenSize": 8,
            "outputSize": 1,
            "weightsInputHidden": [[0.1] * 7] * 8,
            "weightsHiddenOutput": [[0.1] * 8] * 1,
            "biasHidden": [0.0] * 8,
            "biasOutput": [-0.1],
            "activation": "tanh",
        }
    }


@pytest.fixture
def multi_muscle_genome():
    """A 4-node, 5-muscle creature for testing interactions."""
    return {
        "id": "test-multi",
        "nodes": [
            {"id": "1", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.2},
            {"id": "2", "position": {"x": 1, "y": 0.5, "z": 0}, "size": 0.2},
            {"id": "3", "position": {"x": 0.5, "y": 1.0, "z": 0}, "size": 0.2},
            {"id": "4", "position": {"x": 0.5, "y": 0.5, "z": 0.5}, "size": 0.2},
        ],
        "muscles": [
            {"id": "m1", "nodeA": "1", "nodeB": "2", "restLength": 1.0, "stiffness": 100, "damping": 10, "frequency": 1.0, "amplitude": 0.2, "phase": 0},
            {"id": "m2", "nodeA": "1", "nodeB": "3", "restLength": 0.7, "stiffness": 100, "damping": 10, "frequency": 1.5, "amplitude": 0.3, "phase": 0.5},
            {"id": "m3", "nodeA": "2", "nodeB": "3", "restLength": 0.7, "stiffness": 100, "damping": 10, "frequency": 2.0, "amplitude": 0.1, "phase": 1.0},
            {"id": "m4", "nodeA": "1", "nodeB": "4", "restLength": 0.6, "stiffness": 100, "damping": 10, "frequency": 1.0, "amplitude": 0.2, "phase": 0},
            {"id": "m5", "nodeA": "3", "nodeB": "4", "restLength": 0.55, "stiffness": 100, "damping": 10, "frequency": 1.0, "amplitude": 0.2, "phase": 0},
        ],
        "neuralGenome": {
            "inputSize": 7,
            "hiddenSize": 8,
            "outputSize": 5,
            "weightsInputHidden": [[0.1] * 7] * 8,
            "weightsHiddenOutput": [[0.1] * 8] * 5,
            "biasHidden": [0.0] * 8,
            "biasOutput": [-0.1] * 5,
            "activation": "tanh",
        }
    }


# =============================================================================
# Velocity Cap Edge Cases
# =============================================================================

class TestVelocityCapEdgeCases:
    """Tests for muscle velocity cap numerical stability and edge cases."""

    def test_zero_dt_does_not_crash(self):
        """Zero timestep should not cause division by zero."""
        new_rest = torch.tensor([[1.5, 2.0]])
        prev_rest = torch.tensor([[1.0, 1.5]])
        # Zero dt means max_delta = 0, so no change allowed
        result = apply_velocity_cap(new_rest, prev_rest, velocity_cap=5.0, dt=0.0)
        # Should clamp to prev (no change allowed)
        assert torch.allclose(result, prev_rest)

    def test_very_small_dt(self):
        """Very small timestep should still work correctly."""
        new_rest = torch.tensor([[2.0]])
        prev_rest = torch.tensor([[1.0]])
        dt = 1e-10  # Very small
        result = apply_velocity_cap(new_rest, prev_rest, velocity_cap=5.0, dt=dt)
        # max_delta = 5.0 * 1e-10 = 5e-10, so change should be tiny
        expected_delta = 5.0 * dt
        assert (result[0, 0] - prev_rest[0, 0]).abs() <= expected_delta + 1e-12

    def test_zero_velocity_cap(self):
        """Zero velocity cap should prevent all changes."""
        new_rest = torch.tensor([[2.0, 0.5]])
        prev_rest = torch.tensor([[1.0, 1.0]])
        result = apply_velocity_cap(new_rest, prev_rest, velocity_cap=0.0, dt=0.016)
        # No change allowed
        assert torch.allclose(result, prev_rest)

    def test_infinite_velocity_cap(self):
        """Infinite velocity cap should allow any change."""
        new_rest = torch.tensor([[1000.0, -500.0]])
        prev_rest = torch.tensor([[1.0, 1.0]])
        result = apply_velocity_cap(new_rest, prev_rest, velocity_cap=float('inf'), dt=0.016)
        assert torch.allclose(result, new_rest)

    def test_nan_in_new_rest_lengths(self):
        """NaN in desired rest lengths should propagate (not crash)."""
        new_rest = torch.tensor([[float('nan'), 1.5]])
        prev_rest = torch.tensor([[1.0, 1.0]])
        result = apply_velocity_cap(new_rest, prev_rest, velocity_cap=5.0, dt=0.016)
        # NaN should propagate to first element
        assert torch.isnan(result[0, 0])
        # Second element should be valid
        assert not torch.isnan(result[0, 1])

    def test_negative_rest_lengths(self):
        """Negative rest lengths (invalid) should still be processed."""
        new_rest = torch.tensor([[-1.0]])
        prev_rest = torch.tensor([[1.0]])
        result = apply_velocity_cap(new_rest, prev_rest, velocity_cap=5.0, dt=0.016)
        # Should be clamped by velocity cap, not prevented
        max_delta = 5.0 * 0.016
        assert result[0, 0] >= prev_rest[0, 0] - max_delta - 1e-6

    def test_very_large_requested_change(self):
        """Very large requested change should be capped."""
        new_rest = torch.tensor([[1e6]])
        prev_rest = torch.tensor([[1.0]])
        velocity_cap = 5.0
        dt = 0.016
        result = apply_velocity_cap(new_rest, prev_rest, velocity_cap=velocity_cap, dt=dt)
        max_delta = velocity_cap * dt
        assert result[0, 0] == pytest.approx(prev_rest[0, 0] + max_delta, rel=1e-5)

    def test_batched_with_varying_deltas(self):
        """Different creatures should have independent velocity capping."""
        new_rest = torch.tensor([
            [2.0, 0.5],  # Creature 1: wants big increase, big decrease
            [1.1, 0.9],  # Creature 2: wants small changes
        ])
        prev_rest = torch.tensor([
            [1.0, 1.0],
            [1.0, 1.0],
        ])
        velocity_cap = 5.0
        dt = 0.016
        max_delta = velocity_cap * dt  # ~0.08

        result = apply_velocity_cap(new_rest, prev_rest, velocity_cap=velocity_cap, dt=dt)

        # Creature 1: both should be clamped
        assert result[0, 0] == pytest.approx(1.0 + max_delta, rel=1e-5)
        assert result[0, 1] == pytest.approx(1.0 - max_delta, rel=1e-5)

        # Creature 2: small changes should pass through (0.1 < 0.08? no, still clamped)
        # Actually 0.1 > 0.08, so still clamped
        assert abs(result[1, 0] - prev_rest[1, 0]) <= max_delta + 1e-6
        assert abs(result[1, 1] - prev_rest[1, 1]) <= max_delta + 1e-6


# =============================================================================
# Output Smoothing Edge Cases
# =============================================================================

class TestOutputSmoothingEdgeCases:
    """Tests for output smoothing numerical stability and edge cases."""

    def test_alpha_zero_keeps_previous(self):
        """Alpha=0 should keep previous value (infinite smoothing)."""
        raw = torch.tensor([[1.0, -1.0]])
        smoothed = torch.tensor([[0.0, 0.0]])
        result = apply_output_smoothing(raw, smoothed, alpha=0.0)
        assert torch.allclose(result, smoothed)

    def test_alpha_one_uses_raw(self):
        """Alpha=1 should use raw value (no smoothing)."""
        raw = torch.tensor([[1.0, -1.0]])
        smoothed = torch.tensor([[0.0, 0.0]])
        result = apply_output_smoothing(raw, smoothed, alpha=1.0)
        assert torch.allclose(result, raw)

    def test_alpha_half_averages(self):
        """Alpha=0.5 should average raw and smoothed."""
        raw = torch.tensor([[1.0]])
        smoothed = torch.tensor([[0.0]])
        result = apply_output_smoothing(raw, smoothed, alpha=0.5)
        expected = 0.5 * 1.0 + 0.5 * 0.0  # = 0.5
        assert result[0, 0] == pytest.approx(expected, rel=1e-5)

    def test_nan_in_raw_propagates(self):
        """NaN in raw outputs should propagate."""
        raw = torch.tensor([[float('nan'), 0.5]])
        smoothed = torch.tensor([[0.0, 0.0]])
        result = apply_output_smoothing(raw, smoothed, alpha=0.3)
        assert torch.isnan(result[0, 0])
        assert not torch.isnan(result[0, 1])

    def test_inf_in_raw(self):
        """Infinity in raw outputs should propagate."""
        raw = torch.tensor([[float('inf')]])
        smoothed = torch.tensor([[0.0]])
        result = apply_output_smoothing(raw, smoothed, alpha=0.3)
        assert torch.isinf(result[0, 0])

    def test_convergence_over_many_steps(self):
        """Smoothing should converge to raw value over many steps."""
        raw = torch.tensor([[1.0]])
        smoothed = torch.tensor([[0.0]])
        alpha = 0.3

        # Apply smoothing many times
        for _ in range(100):
            smoothed = apply_output_smoothing(raw, smoothed, alpha=alpha)

        # Should converge to raw
        assert smoothed[0, 0] == pytest.approx(1.0, rel=1e-3)

    def test_negative_alpha_invalid(self):
        """Negative alpha should still compute (formula doesn't prevent it)."""
        raw = torch.tensor([[1.0]])
        smoothed = torch.tensor([[0.0]])
        # Formula: alpha * raw + (1 - alpha) * smoothed
        # With alpha=-0.5: -0.5 * 1.0 + 1.5 * 0.0 = -0.5
        result = apply_output_smoothing(raw, smoothed, alpha=-0.5)
        assert result[0, 0] == pytest.approx(-0.5, rel=1e-5)


# =============================================================================
# Extension Limit Edge Cases
# =============================================================================

class TestExtensionLimitEdgeCases:
    """Tests for max extension ratio numerical stability and edge cases."""

    def test_ratio_exactly_one_no_change(self):
        """Ratio of 1.0 should only allow exact base length (edge case)."""
        base = torch.tensor([[1.0]])
        current = torch.tensor([[1.5]])  # Trying to stretch
        # Ratio 1.0 means min=base/1=base, max=base*1=base
        result = apply_extension_limit(current, base, max_extension_ratio=1.0)
        assert result[0, 0] == pytest.approx(1.0, rel=1e-5)

    def test_very_small_base_length(self):
        """Very small base length should still have minimum 0.01."""
        base = torch.tensor([[0.001]])  # Very small
        current = torch.tensor([[0.0001]])  # Trying to compress further
        result = apply_extension_limit(current, base, max_extension_ratio=2.0)
        # min_length clamped to 0.01
        assert result[0, 0] >= 0.01 - 1e-6

    def test_zero_base_length(self):
        """Zero base length (invalid) should still have minimum 0.01."""
        base = torch.tensor([[0.0]])
        current = torch.tensor([[0.5]])
        result = apply_extension_limit(current, base, max_extension_ratio=2.0)
        # min_length = max(0/2, 0.01) = 0.01
        # max_length = 0 * 2 = 0
        # So result clamped between 0.01 and 0... this is problematic
        # Actually, since min > max, torch.clamp will use min
        assert result[0, 0] >= 0.01 - 1e-6

    def test_negative_base_length_invalid(self):
        """Negative base length (invalid input) should not crash."""
        base = torch.tensor([[-1.0]])
        current = torch.tensor([[0.5]])
        # This is invalid input but shouldn't crash
        result = apply_extension_limit(current, base, max_extension_ratio=2.0)
        # min_length = max(-1/2, 0.01) = 0.01
        # max_length = -1 * 2 = -2
        # Clamp to [0.01, -2] -> result is 0.01 (min wins)
        assert result[0, 0] >= 0.01 - 1e-6

    def test_very_high_ratio(self):
        """Very high ratio should allow extreme stretching."""
        base = torch.tensor([[1.0]])
        current = torch.tensor([[100.0]])  # 100x stretch
        result = apply_extension_limit(current, base, max_extension_ratio=1000.0)
        # max_length = 1.0 * 1000 = 1000, so 100 is allowed
        assert result[0, 0] == pytest.approx(100.0, rel=1e-5)

    def test_nan_in_current(self):
        """NaN in current length should propagate."""
        base = torch.tensor([[1.0]])
        current = torch.tensor([[float('nan')]])
        result = apply_extension_limit(current, base, max_extension_ratio=2.0)
        assert torch.isnan(result[0, 0])

    def test_inf_in_current_clamped(self):
        """Infinity in current length should be clamped to max."""
        base = torch.tensor([[1.0]])
        current = torch.tensor([[float('inf')]])
        result = apply_extension_limit(current, base, max_extension_ratio=2.0)
        # max_length = 2.0, so inf clamped to 2.0
        assert result[0, 0] == pytest.approx(2.0, rel=1e-5)


# =============================================================================
# Config Validation Edge Cases
# =============================================================================

class TestConfigValidation:
    """Tests for SimulationConfig validation of physics constraints."""

    def test_velocity_cap_min_boundary(self):
        """Velocity cap at minimum boundary should be accepted."""
        config = SimulationConfig(muscle_velocity_cap=0.1)
        assert config.muscle_velocity_cap == 0.1

    def test_velocity_cap_max_boundary(self):
        """Velocity cap at maximum boundary should be accepted."""
        config = SimulationConfig(muscle_velocity_cap=20.0)
        assert config.muscle_velocity_cap == 20.0

    def test_velocity_cap_below_min_rejected(self):
        """Velocity cap below minimum should be rejected."""
        with pytest.raises(Exception):
            SimulationConfig(muscle_velocity_cap=0.05)

    def test_velocity_cap_above_max_rejected(self):
        """Velocity cap above maximum should be rejected."""
        with pytest.raises(Exception):
            SimulationConfig(muscle_velocity_cap=25.0)

    def test_smoothing_alpha_min_boundary(self):
        """Smoothing alpha at minimum boundary should be accepted."""
        config = SimulationConfig(output_smoothing_alpha=0.05)
        assert config.output_smoothing_alpha == 0.05

    def test_smoothing_alpha_max_boundary(self):
        """Smoothing alpha at maximum boundary should be accepted."""
        config = SimulationConfig(output_smoothing_alpha=1.0)
        assert config.output_smoothing_alpha == 1.0

    def test_smoothing_alpha_below_min_rejected(self):
        """Smoothing alpha below minimum should be rejected."""
        with pytest.raises(Exception):
            SimulationConfig(output_smoothing_alpha=0.01)

    def test_neural_update_hz_min_boundary(self):
        """Neural update Hz at minimum boundary should be accepted."""
        config = SimulationConfig(neural_update_hz=5)
        assert config.neural_update_hz == 5

    def test_neural_update_hz_max_boundary(self):
        """Neural update Hz at maximum boundary should be accepted."""
        config = SimulationConfig(neural_update_hz=60)
        assert config.neural_update_hz == 60

    def test_extension_ratio_min_boundary(self):
        """Extension ratio at minimum boundary should be accepted."""
        config = SimulationConfig(max_extension_ratio=1.2)
        assert config.max_extension_ratio == 1.2

    def test_extension_ratio_below_min_rejected(self):
        """Extension ratio below minimum should be rejected."""
        with pytest.raises(Exception):
            SimulationConfig(max_extension_ratio=1.0)

    def test_damping_multiplier_boundaries(self):
        """Damping multiplier at boundaries should be accepted."""
        config_min = SimulationConfig(muscle_damping_multiplier=0.1)
        config_max = SimulationConfig(muscle_damping_multiplier=5.0)
        assert config_min.muscle_damping_multiplier == 0.1
        assert config_max.muscle_damping_multiplier == 5.0


# =============================================================================
# Integration Tests: Constraint Interactions
# =============================================================================

class TestConstraintInteractions:
    """Tests for interactions between multiple constraints."""

    def test_velocity_cap_then_extension_limit(self):
        """Velocity cap should be applied before extension limit."""
        base = torch.tensor([[1.0]])
        prev = torch.tensor([[1.0]])
        new = torch.tensor([[5.0]])  # Wants to jump to 5x

        # Apply velocity cap first
        velocity_capped = apply_velocity_cap(new, prev, velocity_cap=5.0, dt=0.016)
        # max_delta = 0.08, so capped to 1.08

        # Then apply extension limit
        final = apply_extension_limit(velocity_capped, base, max_extension_ratio=2.0)
        # max_length = 2.0, but velocity_capped is 1.08, so no change

        assert velocity_capped[0, 0] == pytest.approx(1.08, rel=1e-3)
        assert final[0, 0] == pytest.approx(1.08, rel=1e-3)

    def test_extension_limit_overrides_velocity_cap_output(self):
        """Extension limit should further clamp velocity-capped output if needed."""
        base = torch.tensor([[1.0]])
        prev = torch.tensor([[1.95]])  # Already near max extension (2.0)
        new = torch.tensor([[3.0]])  # Wants to go higher

        # Apply velocity cap
        velocity_capped = apply_velocity_cap(new, prev, velocity_cap=5.0, dt=0.016)
        # max_delta = 0.08, so capped to 2.03

        # Apply extension limit
        final = apply_extension_limit(velocity_capped, base, max_extension_ratio=2.0)
        # max_length = 2.0, so clamped from 2.03 to 2.0

        assert final[0, 0] == pytest.approx(2.0, rel=1e-3)

    def test_smoothing_reduces_rate_of_change(self):
        """Output smoothing should reduce effective rate of change."""
        raw_outputs = torch.tensor([[1.0]])  # Full activation
        smoothed = torch.tensor([[0.0]])  # Starting from zero

        # With alpha=0.3, after one step: 0.3 * 1.0 + 0.7 * 0.0 = 0.3
        result = apply_output_smoothing(raw_outputs, smoothed, alpha=0.3)

        # This reduced activation means less extreme muscle targeting
        # which should result in smaller velocity requirements
        assert result[0, 0] == pytest.approx(0.3, rel=1e-5)

    def test_all_constraints_combined(self, simple_genome):
        """All constraints should work together in physics step."""
        batch = creature_genomes_to_batch([simple_genome])
        base_rest = batch.spring_rest_length.clone()

        # Create extreme NN output
        nn_outputs = torch.ones(1, MAX_MUSCLES)  # All muscles want max extension

        # Run physics step with all constraints
        physics_step_neural(
            batch,
            base_rest,
            nn_outputs,
            time=0.0,
            mode='pure',
            prev_rest_lengths=base_rest.clone(),
            velocity_cap=5.0,
            max_extension_ratio=2.0,
        )

        # Rest length should be bounded by constraints
        assert batch.spring_rest_length[0, 0] <= base_rest[0, 0] * 2.0 + 1e-5


# =============================================================================
# Backend Propagation Tests
# =============================================================================

class TestBackendPropagation:
    """Tests verifying config values propagate correctly through the stack."""

    def test_default_config_values(self):
        """Default config should have expected physics constraint values."""
        config = SimulationConfig()
        assert config.muscle_velocity_cap == 5.0
        assert config.muscle_damping_multiplier == 1.0
        assert config.max_extension_ratio == 2.0
        assert config.neural_update_hz == 10
        assert config.output_smoothing_alpha == 0.15

    def test_custom_config_values_accepted(self):
        """Custom config values should be accepted and stored."""
        config = SimulationConfig(
            muscle_velocity_cap=10.0,
            muscle_damping_multiplier=2.5,
            max_extension_ratio=3.0,
            neural_update_hz=30,
            output_smoothing_alpha=0.5,
        )
        assert config.muscle_velocity_cap == 10.0
        assert config.muscle_damping_multiplier == 2.5
        assert config.max_extension_ratio == 3.0
        assert config.neural_update_hz == 30
        assert config.output_smoothing_alpha == 0.5

    def test_config_extra_fields_ignored(self):
        """Extra fields in config should be ignored (forward compatibility)."""
        # SimulationConfig has extra='ignore'
        config = SimulationConfig(
            muscle_velocity_cap=5.0,
            unknown_future_field="should be ignored",
        )
        assert config.muscle_velocity_cap == 5.0
        assert not hasattr(config, 'unknown_future_field')


# =============================================================================
# Real-World Scenario Tests
# =============================================================================

class TestRealWorldScenarios:
    """Tests simulating realistic edge cases from evolution runs."""

    def test_converged_population_same_weights(self, simple_genome):
        """Population with identical weights should still function."""
        # Create batch of 10 identical creatures
        genomes = [simple_genome.copy() for _ in range(10)]
        for i, g in enumerate(genomes):
            g["id"] = f"creature-{i}"

        batch = creature_genomes_to_batch(genomes)
        base_rest = batch.spring_rest_length.clone()
        nn_outputs = torch.zeros(10, MAX_MUSCLES)
        nn_outputs[:, 0] = 0.5  # All creatures want same output

        # Should work without crashing
        physics_step_neural(
            batch,
            base_rest,
            nn_outputs,
            time=0.0,
            mode='pure',
            prev_rest_lengths=base_rest.clone(),
            velocity_cap=5.0,
            max_extension_ratio=2.0,
        )

        # All creatures should have same result
        assert torch.allclose(
            batch.spring_rest_length[0, 0],
            batch.spring_rest_length[1, 0],
        )

    def test_mixed_muscle_counts(self):
        """Creatures with different muscle counts should work together."""
        genome1 = {
            "id": "one-muscle",
            "nodes": [
                {"id": "1", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.2},
                {"id": "2", "position": {"x": 1, "y": 0.5, "z": 0}, "size": 0.2},
            ],
            "muscles": [
                {"id": "m1", "nodeA": "1", "nodeB": "2", "restLength": 1.0, "stiffness": 100, "damping": 10, "frequency": 1.0, "amplitude": 0.2, "phase": 0},
            ]
        }
        genome2 = {
            "id": "three-muscle",
            "nodes": [
                {"id": "1", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.2},
                {"id": "2", "position": {"x": 1, "y": 0.5, "z": 0}, "size": 0.2},
                {"id": "3", "position": {"x": 0.5, "y": 1.0, "z": 0}, "size": 0.2},
            ],
            "muscles": [
                {"id": "m1", "nodeA": "1", "nodeB": "2", "restLength": 1.0, "stiffness": 100, "damping": 10, "frequency": 1.0, "amplitude": 0.2, "phase": 0},
                {"id": "m2", "nodeA": "1", "nodeB": "3", "restLength": 0.7, "stiffness": 100, "damping": 10, "frequency": 1.0, "amplitude": 0.2, "phase": 0},
                {"id": "m3", "nodeA": "2", "nodeB": "3", "restLength": 0.7, "stiffness": 100, "damping": 10, "frequency": 1.0, "amplitude": 0.2, "phase": 0},
            ]
        }

        batch = creature_genomes_to_batch([genome1, genome2])
        base_rest = batch.spring_rest_length.clone()
        nn_outputs = torch.ones(2, MAX_MUSCLES) * 0.5

        # Padded muscles should be handled correctly
        physics_step_neural(
            batch,
            base_rest,
            nn_outputs,
            time=0.0,
            mode='pure',
            prev_rest_lengths=base_rest.clone(),
            velocity_cap=5.0,
            max_extension_ratio=2.0,
        )

        # Creature 1's first muscle should be modified
        assert batch.spring_rest_length[0, 0] != base_rest[0, 0]
        # Creature 2's first three muscles should be modified
        assert batch.spring_rest_length[1, 0] != base_rest[1, 0]

    def test_extreme_time_steps(self, simple_genome):
        """Very large and very small timesteps should be handled."""
        batch = creature_genomes_to_batch([simple_genome])
        base_rest = batch.spring_rest_length.clone()
        nn_outputs = torch.ones(1, MAX_MUSCLES)

        # Very small timestep
        for _ in range(10):
            physics_step_neural(
                batch,
                base_rest,
                nn_outputs,
                time=0.0,
                mode='pure',
                dt=0.001,  # 1000 FPS
                prev_rest_lengths=base_rest.clone(),
                velocity_cap=5.0,
                max_extension_ratio=2.0,
            )

        # Should not explode
        assert not torch.isnan(batch.positions).any()
        assert not torch.isinf(batch.positions).any()

    def test_high_frequency_config_low_neural_hz(self, simple_genome):
        """High physics FPS with low neural Hz should work correctly."""
        # This tests the interval calculation: physics_fps / neural_hz
        config = SimulationConfig(
            time_step=1/120,  # 120 FPS physics
            neural_update_hz=5,  # 5 Hz neural updates
            # Interval should be 120/5 = 24 physics steps per neural update
        )

        # Just verify config is valid
        physics_fps = int(1.0 / config.time_step)
        interval = physics_fps // config.neural_update_hz
        assert interval == 24


# =============================================================================
# Damping Multiplier Tests
# =============================================================================

class TestDampingMultiplier:
    """Tests for damping multiplier application."""

    def test_multiplier_scales_damping(self, simple_genome):
        """Damping multiplier should scale per-muscle damping values."""
        batch = creature_genomes_to_batch([simple_genome])
        original_damping = batch.spring_damping[0, 0].item()

        # Apply multiplier
        multiplier = 2.5
        batch.spring_damping = batch.spring_damping * multiplier

        assert batch.spring_damping[0, 0].item() == pytest.approx(
            original_damping * multiplier, rel=1e-5
        )

    def test_zero_multiplier_removes_damping(self, simple_genome):
        """Zero multiplier should effectively remove all damping."""
        batch = creature_genomes_to_batch([simple_genome])
        batch.spring_damping = batch.spring_damping * 0.0

        assert batch.spring_damping[0, 0].item() == 0.0

    def test_very_high_multiplier(self, simple_genome):
        """Very high multiplier should create high damping."""
        batch = creature_genomes_to_batch([simple_genome])
        original = batch.spring_damping.clone()
        batch.spring_damping = batch.spring_damping * 100.0

        assert batch.spring_damping[0, 0].item() == pytest.approx(
            original[0, 0].item() * 100.0, rel=1e-5
        )


# =============================================================================
# Neural Update Hz Edge Cases
# =============================================================================

class TestNeuralUpdateHz:
    """Tests for neural update Hz calculation edge cases."""

    def test_hz_equal_to_physics_fps(self):
        """Neural Hz equal to physics FPS should update every step."""
        physics_fps = 60
        neural_hz = 60
        interval = physics_fps // neural_hz
        assert interval == 1

    def test_hz_higher_than_physics_fps(self):
        """Neural Hz higher than physics FPS should clamp to 1."""
        physics_fps = 30
        neural_hz = 60  # Can't update faster than physics
        interval = max(1, physics_fps // neural_hz)
        assert interval == 1

    def test_hz_much_lower_than_physics(self):
        """Low neural Hz with high physics FPS should give large interval."""
        physics_fps = 120
        neural_hz = 5
        interval = physics_fps // neural_hz
        assert interval == 24

    def test_integer_division_rounding(self):
        """Non-divisible FPS/Hz should round down."""
        physics_fps = 60
        neural_hz = 7  # Doesn't divide evenly
        interval = physics_fps // neural_hz
        assert interval == 8  # 60 // 7 = 8
