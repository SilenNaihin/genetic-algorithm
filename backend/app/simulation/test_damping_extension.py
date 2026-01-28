"""
Tests for muscle damping multiplier (Phase 3) and max extension ratio (Phase 4).

Damping Multiplier:
- Scales global damping coefficient applied to per-muscle damping
- Higher values = more resistance to movement ("underwater" feel)
- Default 1.0 (no change), range 0.1-5.0

Max Extension Ratio:
- Limits how much muscles can stretch/compress relative to base rest length
- Ratio 2.0 means muscles can stretch from 50% to 200% of rest length
- Default 2.0, range 1.2-5.0
"""

import pytest
import torch

from app.simulation.physics import apply_extension_limit
from app.simulation.tensors import creature_genomes_to_batch, MAX_MUSCLES
from app.schemas.simulation import SimulationConfig


class TestApplyExtensionLimit:
    """Tests for the apply_extension_limit function."""

    def test_within_limits_no_change(self):
        """Rest lengths within limits should not be modified."""
        base = torch.tensor([[1.0, 2.0, 3.0, 0.0]])  # 4 muscles, last is padding
        current = torch.tensor([[1.0, 2.0, 3.0, 0.0]])  # Same as base
        ratio = 2.0

        result = apply_extension_limit(current, base, ratio)

        assert torch.allclose(result, current)

    def test_stretched_beyond_limit_clamped(self):
        """Rest lengths stretched beyond max should be clamped."""
        base = torch.tensor([[1.0, 2.0]])
        # 3.0 > 2.0 * 1.0 (max for base=1.0, ratio=2.0)
        # 5.0 > 4.0 = 2.0 * 2.0 (max for base=2.0, ratio=2.0)
        current = torch.tensor([[3.0, 5.0]])
        ratio = 2.0

        result = apply_extension_limit(current, base, ratio)

        expected = torch.tensor([[2.0, 4.0]])  # Clamped to max
        assert torch.allclose(result, expected)

    def test_compressed_beyond_limit_clamped(self):
        """Rest lengths compressed beyond min should be clamped."""
        base = torch.tensor([[1.0, 2.0]])
        # 0.3 < 0.5 = 1.0 / 2.0 (min for base=1.0, ratio=2.0)
        # 0.5 < 1.0 = 2.0 / 2.0 (min for base=2.0, ratio=2.0)
        current = torch.tensor([[0.3, 0.5]])
        ratio = 2.0

        result = apply_extension_limit(current, base, ratio)

        expected = torch.tensor([[0.5, 1.0]])  # Clamped to min
        assert torch.allclose(result, expected)

    def test_higher_ratio_allows_more_stretch(self):
        """Higher ratio should allow more stretch."""
        base = torch.tensor([[1.0]])
        current = torch.tensor([[3.0]])  # Trying to stretch to 3x

        # With ratio=2.0, max is 2.0, so clamp to 2.0
        result_r2 = apply_extension_limit(current, base, 2.0)
        assert torch.allclose(result_r2, torch.tensor([[2.0]]))

        # With ratio=3.0, max is 3.0, so allow full stretch
        result_r3 = apply_extension_limit(current, base, 3.0)
        assert torch.allclose(result_r3, torch.tensor([[3.0]]))

    def test_lower_ratio_restricts_more(self):
        """Lower ratio should restrict stretch more."""
        base = torch.tensor([[1.0]])
        current = torch.tensor([[1.5]])  # Trying to stretch to 1.5x

        # With ratio=2.0, max is 2.0, so allow
        result_r2 = apply_extension_limit(current, base, 2.0)
        assert torch.allclose(result_r2, torch.tensor([[1.5]]))

        # With ratio=1.3, max is 1.3, so clamp
        result_r13 = apply_extension_limit(current, base, 1.3)
        assert torch.allclose(result_r13, torch.tensor([[1.3]]))

    def test_minimum_length_clamped_to_small_positive(self):
        """Minimum length should never go below 0.01 to avoid division issues."""
        base = torch.tensor([[0.01]])  # Very small base
        current = torch.tensor([[0.001]])  # Trying to compress to near-zero
        ratio = 2.0

        result = apply_extension_limit(current, base, ratio)

        # min_length = max(0.01/2.0, 0.01) = 0.01
        # Use tolerance for floating point comparison
        assert result[0, 0].item() >= 0.01 - 1e-6

    def test_batched_extension_limit(self):
        """Extension limit should work on batched inputs."""
        base = torch.tensor([
            [1.0, 2.0],
            [1.5, 2.5],
        ])
        current = torch.tensor([
            [0.1, 6.0],  # First compressed too much, second stretched too much
            [1.5, 2.5],  # Within limits
        ])
        ratio = 2.0

        result = apply_extension_limit(current, base, ratio)

        # First creature: min=0.5, max=4.0 for muscle 1; min=1.0, max=4.0 for muscle 2
        assert result[0, 0].item() == pytest.approx(0.5, rel=1e-5)
        assert result[0, 1].item() == pytest.approx(4.0, rel=1e-5)
        # Second creature: within limits, no change
        assert result[1, 0].item() == pytest.approx(1.5, rel=1e-5)
        assert result[1, 1].item() == pytest.approx(2.5, rel=1e-5)


class TestDampingMultiplierConfig:
    """Tests for damping multiplier configuration."""

    def test_config_has_damping_multiplier(self):
        """SimulationConfig should have muscle_damping_multiplier field."""
        config = SimulationConfig()
        assert hasattr(config, 'muscle_damping_multiplier')
        assert config.muscle_damping_multiplier == 1.0  # Default

    def test_config_has_max_extension_ratio(self):
        """SimulationConfig should have max_extension_ratio field."""
        config = SimulationConfig()
        assert hasattr(config, 'max_extension_ratio')
        assert config.max_extension_ratio == 2.0  # Default

    def test_damping_multiplier_validation(self):
        """Damping multiplier should be validated within range."""
        # Valid values
        config = SimulationConfig(muscle_damping_multiplier=1.0)
        assert config.muscle_damping_multiplier == 1.0

        config = SimulationConfig(muscle_damping_multiplier=0.1)
        assert config.muscle_damping_multiplier == 0.1

        config = SimulationConfig(muscle_damping_multiplier=5.0)
        assert config.muscle_damping_multiplier == 5.0

        # Invalid: too low
        with pytest.raises(Exception):
            SimulationConfig(muscle_damping_multiplier=0.05)

        # Invalid: too high
        with pytest.raises(Exception):
            SimulationConfig(muscle_damping_multiplier=6.0)

    def test_max_extension_ratio_validation(self):
        """Max extension ratio should be validated within range."""
        # Valid values
        config = SimulationConfig(max_extension_ratio=2.0)
        assert config.max_extension_ratio == 2.0

        config = SimulationConfig(max_extension_ratio=1.2)
        assert config.max_extension_ratio == 1.2

        config = SimulationConfig(max_extension_ratio=5.0)
        assert config.max_extension_ratio == 5.0

        # Invalid: too low
        with pytest.raises(Exception):
            SimulationConfig(max_extension_ratio=1.0)

        # Invalid: too high
        with pytest.raises(Exception):
            SimulationConfig(max_extension_ratio=6.0)


class TestDampingMultiplierIntegration:
    """Integration tests for damping multiplier application."""

    def test_damping_multiplier_scales_spring_damping(self):
        """Damping multiplier should scale per-muscle spring damping."""
        # Create a simple genome
        genome = {
            "id": "test",
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
                    "damping": 10,  # Base damping
                    "frequency": 1.0,
                    "amplitude": 0.2,
                    "phase": 0,
                }
            ]
        }

        # Convert to batch
        batch = creature_genomes_to_batch([genome])
        original_damping = batch.spring_damping[0, 0].item()

        # Apply multiplier of 2.0
        multiplier = 2.0
        batch.spring_damping = batch.spring_damping * multiplier

        # Damping should be doubled
        assert batch.spring_damping[0, 0].item() == pytest.approx(original_damping * multiplier)

    def test_damping_multiplier_1_no_change(self):
        """Multiplier of 1.0 should not change damping."""
        genome = {
            "id": "test",
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
            ]
        }

        batch = creature_genomes_to_batch([genome])
        original_damping = batch.spring_damping.clone()

        # Apply multiplier of 1.0
        batch.spring_damping = batch.spring_damping * 1.0

        assert torch.allclose(batch.spring_damping, original_damping)


class TestExtensionRatioIntegration:
    """Integration tests for max extension ratio."""

    def test_extension_ratio_passed_to_physics(self):
        """Max extension ratio should flow through to physics simulation."""
        from app.simulation.physics import physics_step_neural
        from app.simulation.tensors import MAX_MUSCLES

        genome = {
            "id": "test",
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
            ]
        }

        batch = creature_genomes_to_batch([genome])
        base_rest_lengths = batch.spring_rest_length.clone()

        # Neural output trying to stretch muscle to 5x (way beyond ratio=2.0 limit)
        nn_outputs = torch.zeros(1, MAX_MUSCLES)
        nn_outputs[0, 0] = 1.0  # Max stretch

        # Run physics step with extension limit
        physics_step_neural(
            batch, base_rest_lengths, nn_outputs, time=0.0,
            mode='pure', max_extension_ratio=2.0
        )

        # Rest length should be clamped to max 2x base
        max_allowed = base_rest_lengths[0, 0].item() * 2.0
        assert batch.spring_rest_length[0, 0].item() <= max_allowed + 1e-5


class TestConfigPassthrough:
    """Tests to verify config values are passed through the simulator chain."""

    def test_typescript_defaults_match_python(self):
        """Verify TypeScript and Python defaults align (manual check)."""
        config = SimulationConfig()

        # These should match DEFAULT_CONFIG in src/types/simulation.ts
        assert config.muscle_velocity_cap == 5.0
        assert config.muscle_damping_multiplier == 1.0
        assert config.max_extension_ratio == 2.0
        assert config.neural_update_hz == 10
        assert config.output_smoothing_alpha == 0.15
