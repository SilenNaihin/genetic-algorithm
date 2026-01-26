"""
Tests for muscle velocity cap feature.

The velocity cap limits how fast muscle rest lengths can change per timestep,
preventing physically impossible muscle speeds regardless of neural output.
"""

import pytest
import torch

from app.simulation.physics import apply_velocity_cap, physics_step_neural
from app.simulation.tensors import creature_genomes_to_batch


class TestApplyVelocityCap:
    """Unit tests for the apply_velocity_cap function."""

    def test_no_change_within_cap(self):
        """Changes within the cap should pass through unchanged."""
        prev = torch.tensor([[1.0, 1.0, 1.0]])
        new = torch.tensor([[1.01, 0.99, 1.0]])  # Small changes
        velocity_cap = 5.0
        dt = 1/60  # 60 FPS
        max_delta = velocity_cap * dt  # 0.0833

        result = apply_velocity_cap(new, prev, velocity_cap, dt)

        torch.testing.assert_close(result, new)

    def test_large_increase_clamped(self):
        """Large increases should be clamped to max_delta."""
        prev = torch.tensor([[1.0]])
        new = torch.tensor([[2.0]])  # +1.0 change
        velocity_cap = 5.0
        dt = 1/60
        max_delta = velocity_cap * dt  # ~0.0833

        result = apply_velocity_cap(new, prev, velocity_cap, dt)
        expected = prev + max_delta

        torch.testing.assert_close(result, expected)

    def test_large_decrease_clamped(self):
        """Large decreases should be clamped to -max_delta."""
        prev = torch.tensor([[1.0]])
        new = torch.tensor([[0.0]])  # -1.0 change
        velocity_cap = 5.0
        dt = 1/60
        max_delta = velocity_cap * dt  # ~0.0833

        result = apply_velocity_cap(new, prev, velocity_cap, dt)
        expected = prev - max_delta

        torch.testing.assert_close(result, expected)

    def test_batched_clamping(self):
        """Should work correctly with batched inputs."""
        prev = torch.tensor([
            [1.0, 1.0],  # Creature 0
            [1.0, 1.0],  # Creature 1
        ])
        new = torch.tensor([
            [2.0, 0.95],   # Creature 0: one large increase, one small decrease within cap
            [1.01, 0.0],   # Creature 1: one tiny change, one large decrease
        ])
        velocity_cap = 5.0
        dt = 1/60
        max_delta = velocity_cap * dt  # ~0.0833

        result = apply_velocity_cap(new, prev, velocity_cap, dt)

        # Creature 0, muscle 0: clamped to prev + max_delta (change +1.0 > max_delta)
        assert result[0, 0].item() == pytest.approx(1.0 + max_delta, rel=1e-5)
        # Creature 0, muscle 1: within cap (change -0.05 < max_delta), unchanged
        assert result[0, 1].item() == pytest.approx(0.95, rel=1e-5)
        # Creature 1, muscle 0: within cap, unchanged
        assert result[1, 0].item() == pytest.approx(1.01, rel=1e-5)
        # Creature 1, muscle 1: clamped to prev - max_delta (change -1.0 < -max_delta)
        assert result[1, 1].item() == pytest.approx(1.0 - max_delta, rel=1e-5)

    def test_high_fps_smaller_delta(self):
        """Higher FPS should result in smaller max_delta per step."""
        prev = torch.tensor([[1.0]])
        new = torch.tensor([[2.0]])
        velocity_cap = 5.0

        # At 60 FPS
        result_60 = apply_velocity_cap(new, prev, velocity_cap, 1/60)
        # At 120 FPS
        result_120 = apply_velocity_cap(new, prev, velocity_cap, 1/120)

        # 120 FPS should have smaller delta
        delta_60 = (result_60 - prev).abs().item()
        delta_120 = (result_120 - prev).abs().item()
        assert delta_120 < delta_60
        assert delta_120 == pytest.approx(delta_60 / 2, rel=1e-5)

    def test_higher_cap_allows_more_change(self):
        """Higher velocity cap should allow larger changes."""
        prev = torch.tensor([[1.0]])
        new = torch.tensor([[2.0]])
        dt = 1/60

        result_low = apply_velocity_cap(new, prev, velocity_cap=2.0, dt=dt)
        result_high = apply_velocity_cap(new, prev, velocity_cap=10.0, dt=dt)

        delta_low = (result_low - prev).item()
        delta_high = (result_high - prev).item()
        assert delta_high > delta_low
        assert delta_high == pytest.approx(delta_low * 5)


class TestVelocityCapIntegration:
    """Integration tests for velocity cap in the simulation."""

    # MAX_MUSCLES = 15 in the batch tensor system
    MAX_MUSCLES = 15

    def make_simple_genome(self, frequency: float = 1.0) -> dict:
        """Create a simple genome for testing."""
        return {
            "id": "test_creature",
            "nodes": [
                {"id": "n0", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.3, "friction": 0.5},
                {"id": "n1", "position": {"x": 0.5, "y": 0.5, "z": 0}, "size": 0.3, "friction": 0.5},
                {"id": "n2", "position": {"x": 0.25, "y": 1.0, "z": 0}, "size": 0.3, "friction": 0.5},
            ],
            "muscles": [
                {"id": "m0", "nodeA": "n0", "nodeB": "n1", "stiffness": 100, "damping": 20,
                 "frequency": frequency, "amplitude": 0.3, "phase": 0},
                {"id": "m1", "nodeA": "n1", "nodeB": "n2", "stiffness": 100, "damping": 20,
                 "frequency": frequency, "amplitude": 0.3, "phase": 0},
                {"id": "m2", "nodeA": "n2", "nodeB": "n0", "stiffness": 100, "damping": 20,
                 "frequency": frequency, "amplitude": 0.3, "phase": 0},
            ],
            "globalFrequencyMultiplier": 1.0,
            "neuralGenome": {
                "inputWeights": [[0.1] * 7 for _ in range(8)],
                "hiddenBiases": [0.0] * 8,
                "outputWeights": [[0.1] * 8 for _ in range(3)],
                "outputBiases": [0.0] * 3,
            },
        }

    def test_physics_step_neural_with_velocity_cap(self):
        """Physics step should apply velocity cap when provided."""
        genome = self.make_simple_genome()
        batch = creature_genomes_to_batch([genome])

        base_rest_lengths = batch.spring_rest_length.clone()
        prev_rest_lengths = base_rest_lengths.clone()

        # NN outputs must match MAX_MUSCLES dimension
        # Strong contraction signal for first 3 muscles (the valid ones)
        nn_outputs = torch.zeros(1, self.MAX_MUSCLES)
        nn_outputs[0, :3] = 0.9  # Strong contraction for valid muscles

        dt = 1/60
        velocity_cap = 1.0  # Low cap for testing

        # Run physics step with velocity cap
        physics_step_neural(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='pure',
            dt=dt, gravity=-9.8,
            prev_rest_lengths=prev_rest_lengths, velocity_cap=velocity_cap
        )

        # Check that rest length changes are limited (only check valid muscles)
        delta = (batch.spring_rest_length - prev_rest_lengths).abs()
        max_delta = velocity_cap * dt
        # Only check the first 3 muscles (the valid ones)
        valid_delta = delta[0, :3]
        assert (valid_delta <= max_delta + 1e-6).all(), f"Delta {valid_delta} exceeds max {max_delta}"

    def test_physics_step_neural_without_velocity_cap(self):
        """Physics step without velocity cap should allow large changes."""
        genome = self.make_simple_genome()
        batch = creature_genomes_to_batch([genome])

        base_rest_lengths = batch.spring_rest_length.clone()

        # NN outputs must match MAX_MUSCLES dimension
        nn_outputs = torch.zeros(1, self.MAX_MUSCLES)
        nn_outputs[0, :3] = 0.9  # Strong contraction for valid muscles

        # Run physics step WITHOUT velocity cap
        physics_step_neural(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='pure',
            dt=1/60, gravity=-9.8,
            prev_rest_lengths=None, velocity_cap=None
        )

        # Rest lengths should have changed significantly (only check valid muscles)
        delta = (batch.spring_rest_length - base_rest_lengths).abs()
        valid_delta = delta[0, :3]
        assert valid_delta.max() > 0.1, f"Expected significant change, got delta={valid_delta}"

    def test_velocity_cap_over_multiple_steps(self):
        """Over multiple steps, velocity cap should allow gradual convergence."""
        genome = self.make_simple_genome()
        batch = creature_genomes_to_batch([genome])

        base_rest_lengths = batch.spring_rest_length.clone()
        prev_rest_lengths = base_rest_lengths.clone()

        # NN outputs must match MAX_MUSCLES dimension
        nn_outputs = torch.zeros(1, self.MAX_MUSCLES)
        nn_outputs[0, :3] = 0.9  # Strong contraction for valid muscles

        dt = 1/60
        velocity_cap = 1.0  # 1 unit/sec max change

        # Run multiple steps
        for step in range(10):
            physics_step_neural(
                batch, base_rest_lengths, nn_outputs, time=step * dt, mode='pure',
                dt=dt, gravity=-9.8,
                prev_rest_lengths=prev_rest_lengths, velocity_cap=velocity_cap
            )
            prev_rest_lengths = batch.spring_rest_length.clone()

        # After 10 steps, should have moved closer to target but limited by cap
        total_change = (batch.spring_rest_length - base_rest_lengths).abs()
        max_possible_change = velocity_cap * dt * 10
        # Only check valid muscles
        valid_change = total_change[0, :3]
        assert (valid_change <= max_possible_change + 1e-6).all()


class TestVelocityCapConfig:
    """Test velocity cap configuration propagation."""

    def test_config_has_muscle_velocity_cap(self):
        """SimulationConfig should have muscle_velocity_cap field."""
        from app.schemas.simulation import SimulationConfig

        config = SimulationConfig()
        assert hasattr(config, 'muscle_velocity_cap')
        assert config.muscle_velocity_cap == 5.0  # Default

    def test_config_validation(self):
        """muscle_velocity_cap should validate range."""
        from app.schemas.simulation import SimulationConfig
        from pydantic import ValidationError

        # Valid values
        config = SimulationConfig(muscle_velocity_cap=0.1)
        assert config.muscle_velocity_cap == 0.1

        config = SimulationConfig(muscle_velocity_cap=20.0)
        assert config.muscle_velocity_cap == 20.0

        # Invalid: too low
        with pytest.raises(ValidationError):
            SimulationConfig(muscle_velocity_cap=0.05)

        # Invalid: too high
        with pytest.raises(ValidationError):
            SimulationConfig(muscle_velocity_cap=25.0)
