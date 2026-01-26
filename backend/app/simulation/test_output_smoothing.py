"""
Tests for neural output smoothing feature.

Exponential smoothing on neural outputs prevents chaotic target-seeking
by smoothing the TARGET muscles are trying to reach.
"""

import pytest
import torch

from app.simulation.physics import apply_output_smoothing


class TestApplyOutputSmoothing:
    """Unit tests for the apply_output_smoothing function."""

    def test_alpha_1_no_smoothing(self):
        """Alpha=1.0 should return raw outputs unchanged."""
        raw = torch.tensor([[0.5, -0.3, 0.8]])
        smoothed = torch.tensor([[0.0, 0.0, 0.0]])
        alpha = 1.0

        result = apply_output_smoothing(raw, smoothed, alpha)

        torch.testing.assert_close(result, raw)

    def test_alpha_0_keep_previous(self):
        """Alpha=0 should keep previous smoothed outputs (edge case)."""
        raw = torch.tensor([[0.5, -0.3, 0.8]])
        smoothed = torch.tensor([[0.1, 0.2, 0.3]])
        alpha = 0.0

        result = apply_output_smoothing(raw, smoothed, alpha)

        torch.testing.assert_close(result, smoothed)

    def test_alpha_half_average(self):
        """Alpha=0.5 should give equal weight to raw and smoothed."""
        raw = torch.tensor([[1.0, 0.0]])
        smoothed = torch.tensor([[0.0, 1.0]])
        alpha = 0.5

        result = apply_output_smoothing(raw, smoothed, alpha)
        expected = torch.tensor([[0.5, 0.5]])

        torch.testing.assert_close(result, expected)

    def test_moderate_smoothing(self):
        """Alpha=0.3 should apply moderate smoothing."""
        raw = torch.tensor([[1.0]])
        smoothed = torch.tensor([[0.0]])
        alpha = 0.3

        result = apply_output_smoothing(raw, smoothed, alpha)
        expected = torch.tensor([[0.3]])  # 0.3 * 1.0 + 0.7 * 0.0

        torch.testing.assert_close(result, expected)

    def test_convergence_over_iterations(self):
        """Repeated smoothing should converge to target."""
        target = torch.tensor([[1.0]])
        smoothed = torch.tensor([[0.0]])
        alpha = 0.3

        # Apply smoothing multiple times
        for _ in range(20):
            smoothed = apply_output_smoothing(target, smoothed, alpha)

        # Should have converged close to target
        assert smoothed[0, 0].item() > 0.99

    def test_batched_smoothing(self):
        """Should work correctly with batched inputs."""
        raw = torch.tensor([
            [1.0, -1.0],
            [0.5, 0.5],
        ])
        smoothed = torch.tensor([
            [0.0, 0.0],
            [0.0, 0.0],
        ])
        alpha = 0.5

        result = apply_output_smoothing(raw, smoothed, alpha)

        # Each element should be average of raw and smoothed
        assert result[0, 0].item() == pytest.approx(0.5)
        assert result[0, 1].item() == pytest.approx(-0.5)
        assert result[1, 0].item() == pytest.approx(0.25)
        assert result[1, 1].item() == pytest.approx(0.25)


class TestOutputSmoothingConfig:
    """Test output smoothing configuration."""

    def test_config_has_output_smoothing_alpha(self):
        """SimulationConfig should have output_smoothing_alpha field."""
        from app.schemas.simulation import SimulationConfig

        config = SimulationConfig()
        assert hasattr(config, 'output_smoothing_alpha')
        assert config.output_smoothing_alpha == 0.3  # Default

    def test_config_has_neural_update_hz(self):
        """SimulationConfig should have neural_update_hz field."""
        from app.schemas.simulation import SimulationConfig

        config = SimulationConfig()
        assert hasattr(config, 'neural_update_hz')
        assert config.neural_update_hz == 15  # Default

    def test_output_smoothing_validation(self):
        """output_smoothing_alpha should validate range."""
        from app.schemas.simulation import SimulationConfig
        from pydantic import ValidationError

        # Valid values
        config = SimulationConfig(output_smoothing_alpha=0.05)
        assert config.output_smoothing_alpha == 0.05

        config = SimulationConfig(output_smoothing_alpha=1.0)
        assert config.output_smoothing_alpha == 1.0

        # Invalid: too low
        with pytest.raises(ValidationError):
            SimulationConfig(output_smoothing_alpha=0.01)

        # Invalid: too high
        with pytest.raises(ValidationError):
            SimulationConfig(output_smoothing_alpha=1.5)

    def test_neural_update_hz_validation(self):
        """neural_update_hz should validate range."""
        from app.schemas.simulation import SimulationConfig
        from pydantic import ValidationError

        # Valid values
        config = SimulationConfig(neural_update_hz=5)
        assert config.neural_update_hz == 5

        config = SimulationConfig(neural_update_hz=60)
        assert config.neural_update_hz == 60

        # Invalid: too low
        with pytest.raises(ValidationError):
            SimulationConfig(neural_update_hz=3)

        # Invalid: too high
        with pytest.raises(ValidationError):
            SimulationConfig(neural_update_hz=100)


class TestNeuralUpdateInterval:
    """Test dynamic NN update interval calculation."""

    def test_interval_calculation_60fps_15hz(self):
        """60 FPS / 15 Hz = 4 steps per update."""
        dt = 1/60
        neural_update_hz = 15
        physics_fps = 1.0 / dt
        nn_update_interval = max(1, int(physics_fps / neural_update_hz))
        assert nn_update_interval == 4

    def test_interval_calculation_30fps_15hz(self):
        """30 FPS / 15 Hz = 2 steps per update."""
        dt = 1/30
        neural_update_hz = 15
        physics_fps = 1.0 / dt
        nn_update_interval = max(1, int(physics_fps / neural_update_hz))
        assert nn_update_interval == 2

    def test_interval_calculation_60fps_60hz(self):
        """60 FPS / 60 Hz = 1 step per update (every step)."""
        dt = 1/60
        neural_update_hz = 60
        physics_fps = 1.0 / dt
        nn_update_interval = max(1, int(physics_fps / neural_update_hz))
        assert nn_update_interval == 1

    def test_interval_minimum_is_1(self):
        """Interval should never be less than 1."""
        dt = 1/30  # 30 FPS
        neural_update_hz = 60  # Request 60 Hz, but physics is only 30
        physics_fps = 1.0 / dt
        nn_update_interval = max(1, int(physics_fps / neural_update_hz))
        # 30 / 60 = 0.5, int = 0, max(1, 0) = 1
        assert nn_update_interval == 1
