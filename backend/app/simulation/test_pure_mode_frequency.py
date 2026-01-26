"""
Test that pure mode creatures are NOT disqualified for high frequency.

In pure mode, the neural network directly controls muscle contraction.
The frequency parameter is vestigial and not used in the physics.
Therefore, creatures should NOT be disqualified for having high frequency
values when running in pure mode.

This test should FAIL until the bug is fixed.
"""

import pytest
import torch

from app.simulation.fitness import check_frequency_violations, FitnessConfig
from app.simulation.tensors import creature_genomes_to_batch


def make_genome_with_high_frequency(frequency: float = 10.0) -> dict:
    """Create a genome with a muscle frequency that exceeds typical max (3.0)."""
    return {
        "id": "high_freq_creature",
        "nodes": [
            {"id": "n0", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.3, "friction": 0.5},
            {"id": "n1", "position": {"x": 0.5, "y": 0.5, "z": 0}, "size": 0.3, "friction": 0.5},
            {"id": "n2", "position": {"x": 0.25, "y": 1.0, "z": 0}, "size": 0.3, "friction": 0.5},
        ],
        "muscles": [
            {
                "id": "m0",
                "nodeA": "n0",
                "nodeB": "n1",
                "stiffness": 100,  # Moderate stiffness
                "damping": 20,    # Good damping to prevent explosion
                "frequency": frequency,
                "amplitude": 0.3,
                "phase": 0,
            },
            {
                "id": "m1",
                "nodeA": "n1",
                "nodeB": "n2",
                "stiffness": 100,
                "damping": 20,
                "frequency": frequency,
                "amplitude": 0.3,
                "phase": 0,
            },
            {
                "id": "m2",
                "nodeA": "n2",
                "nodeB": "n0",
                "stiffness": 100,
                "damping": 20,
                "frequency": frequency,
                "amplitude": 0.3,
                "phase": 0,
            },
        ],
        "globalFrequencyMultiplier": 1.0,
        "neuralGenome": {
            "inputWeights": [[0.1] * 7 for _ in range(8)],
            "hiddenBiases": [0.0] * 8,
            "outputWeights": [[0.1] * 8 for _ in range(3)],  # 3 outputs for 3 muscles
            "outputBiases": [-0.5] * 3,
        },
    }


class TestPureModeFrequencyDisqualification:
    """Test that frequency violations don't apply to pure mode."""

    def test_high_frequency_detected_in_batch(self):
        """Verify that check_frequency_violations detects high frequency."""
        genome = make_genome_with_high_frequency(frequency=10.0)
        batch = creature_genomes_to_batch([genome])
        config = FitnessConfig(max_allowed_frequency=3.0)

        violations = check_frequency_violations(batch, config)

        # Should detect the violation (frequency 10 > max 3)
        assert violations[0].item() == True, "Should detect high frequency"

    def test_frequency_not_used_in_pure_mode_physics(self):
        """
        Verify that frequency parameter is NOT used in pure mode physics.

        In pure mode, muscle contraction comes directly from neural output,
        not from sin(time * frequency * 2π + phase).

        This test verifies the physics behavior documented in physics.py:1162-1166.
        """
        from app.simulation.physics import compute_neural_rest_lengths
        from app.simulation.tensors import creature_genomes_to_batch

        # Two genomes: one with normal frequency, one with very high frequency
        genome_normal = make_genome_with_high_frequency(frequency=1.0)
        genome_normal["id"] = "normal_freq"

        genome_high = make_genome_with_high_frequency(frequency=100.0)
        genome_high["id"] = "high_freq"

        batch = creature_genomes_to_batch([genome_normal, genome_high])

        # Same neural outputs for both
        nn_outputs = torch.tensor([[0.5], [0.5]])  # [B=2, M=1]
        base_rest_lengths = torch.tensor([[1.0], [1.0]])  # [B=2, M=1]
        time = 0.5  # Arbitrary time

        # Compute rest lengths in PURE mode
        rest_lengths = compute_neural_rest_lengths(
            batch, base_rest_lengths, nn_outputs, time, mode='pure'
        )

        # In pure mode, both should have IDENTICAL rest lengths
        # because frequency is not used - only nn_outputs matter
        assert torch.allclose(rest_lengths[0], rest_lengths[1]), (
            f"Pure mode should produce identical rest lengths regardless of frequency. "
            f"Got: normal={rest_lengths[0].item():.4f}, high={rest_lengths[1].item():.4f}"
        )

    def test_frequency_IS_used_in_hybrid_mode_physics(self):
        """
        Verify that frequency IS used in hybrid mode (sanity check).
        """
        from app.simulation.physics import compute_neural_rest_lengths
        from app.simulation.tensors import creature_genomes_to_batch

        genome_low = make_genome_with_high_frequency(frequency=0.5)
        genome_low["id"] = "low_freq"

        genome_high = make_genome_with_high_frequency(frequency=5.0)
        genome_high["id"] = "high_freq"

        batch = creature_genomes_to_batch([genome_low, genome_high])

        nn_outputs = torch.tensor([[0.0], [0.0]])  # Neutral modulation
        base_rest_lengths = torch.tensor([[1.0], [1.0]])
        time = 0.25  # Pick a time where different frequencies give different results

        # Compute rest lengths in HYBRID mode
        rest_lengths = compute_neural_rest_lengths(
            batch, base_rest_lengths, nn_outputs, time, mode='hybrid'
        )

        # In hybrid mode, different frequencies should give different rest lengths
        # (at most times - there might be specific times where they coincide)
        # Let's check at multiple times
        different_found = False
        for t in [0.1, 0.25, 0.33, 0.5, 0.75]:
            rest_lengths = compute_neural_rest_lengths(
                batch, base_rest_lengths, nn_outputs, t, mode='hybrid'
            )
            if not torch.allclose(rest_lengths[0], rest_lengths[1], atol=0.01):
                different_found = True
                break

        assert different_found, (
            "Hybrid mode should produce different rest lengths for different frequencies"
        )

    def test_pure_mode_creature_not_disqualified_for_high_frequency(self):
        """
        Pure mode creatures should NOT be disqualified for high frequency.

        In pure mode, frequency is not used - neural net directly controls muscles.
        The fix is in pytorch_simulator.py:97 - skip frequency check for pure mode.

        Note: The creature may be disqualified for OTHER reasons (physics_explosion)
        but NOT for high_frequency - that's what we're testing.
        """
        from app.services.pytorch_simulator import PyTorchSimulator
        from app.schemas.simulation import SimulationConfig

        # Create creature with frequency above max
        genome = make_genome_with_high_frequency(frequency=10.0)

        # Configure for PURE mode
        config = SimulationConfig(
            use_neural_net=True,
            neural_mode='pure',  # Pure mode - frequency not used
            max_allowed_frequency=3.0,  # Lower than genome's frequency
            simulation_duration=1.0,
        )

        simulator = PyTorchSimulator()
        results = simulator.simulate_batch([genome], config)

        # Should NOT be disqualified for HIGH_FREQUENCY
        # (may be disqualified for other reasons like physics_explosion)
        result = results[0]
        assert result.disqualified_reason != 'high_frequency', (
            f"Pure mode creature should NOT be disqualified for high_frequency. "
            f"Got disqualified_reason: {result.disqualified_reason}"
        )


class TestHybridModeFrequencyDisqualification:
    """Verify hybrid mode DOES check frequency (sanity check)."""

    def test_hybrid_mode_creature_disqualified_for_high_frequency(self):
        """Hybrid mode creatures SHOULD be disqualified for high frequency."""
        from app.services.pytorch_simulator import PyTorchSimulator
        from app.schemas.simulation import SimulationConfig

        genome = make_genome_with_high_frequency(frequency=10.0)

        config = SimulationConfig(
            use_neural_net=True,
            neural_mode='hybrid',  # Hybrid mode - frequency IS used
            max_allowed_frequency=3.0,
            simulation_duration=1.0,
        )

        simulator = PyTorchSimulator()
        results = simulator.simulate_batch([genome], config)

        # SHOULD be disqualified in hybrid mode
        result = results[0]
        assert result.disqualified, (
            "Hybrid mode creature SHOULD be disqualified for high frequency"
        )
        assert result.disqualified_reason == 'high_frequency'
