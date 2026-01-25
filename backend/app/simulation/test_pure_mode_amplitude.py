"""
Integration stress tests for pure mode neural network amplitude handling.

This test suite verifies that in pure mode:
1. Amplitude values in muscle genomes are completely IGNORED by physics
2. Creatures with different amplitude values behave identically
3. Extreme amplitude values do not affect simulation
4. Mutations and crossover still wastefully set amplitude (flagged for future optimization)

Key insight from compute_neural_rest_lengths() in physics.py:
- Pure mode: contraction = nn_output (amplitude NOT used)
- Hybrid mode: contraction = base_contraction * amplitude * nn_modulation
"""

import pytest
import torch
import math
import random

from app.simulation.physics import (
    compute_neural_rest_lengths,
    physics_step_neural,
    simulate_with_neural,
    TIME_STEP,
)
from app.simulation.tensors import CreatureBatch, creature_genomes_to_batch, MAX_MUSCLES
from app.neural.network import BatchedNeuralNetwork, NeuralConfig, get_input_size
from app.genetics.mutation import mutate_genome, MutationConfig, GenomeConstraints
from app.genetics.crossover import single_point_crossover
from app.genetics.population import generate_random_genome


# =============================================================================
# Helper Functions
# =============================================================================

def create_genome_with_amplitude(amplitude: float, num_muscles: int = 3):
    """Create a simple genome with specified amplitude for all muscles."""
    nodes = [
        {'id': 'n0', 'size': 0.35, 'friction': 0.5, 'position': {'x': -0.5, 'y': 0.8, 'z': 0.0}},
        {'id': 'n1', 'size': 0.35, 'friction': 0.5, 'position': {'x': 0.5, 'y': 0.8, 'z': 0.0}},
        {'id': 'n2', 'size': 0.3, 'friction': 0.5, 'position': {'x': 0.0, 'y': 1.4, 'z': 0.0}},
    ]

    muscles = [
        {
            'id': f'm{i}',
            'nodeA': nodes[i % len(nodes)]['id'],
            'nodeB': nodes[(i + 1) % len(nodes)]['id'],
            'restLength': 1.0,
            'stiffness': 120.0,
            'damping': 0.7,
            'frequency': 1.0,
            'amplitude': amplitude,  # This should be IGNORED in pure mode
            'phase': 0.0,
            'directionBias': {'x': 0.0, 'y': 0.0, 'z': 0.0},
            'biasStrength': 0.0,
            'velocityBias': {'x': 0.0, 'y': 0.0, 'z': 0.0},
            'velocityStrength': 0.0,
            'distanceBias': 0.0,
            'distanceStrength': 0.0,
        }
        for i in range(min(num_muscles, 3))
    ]

    return {
        'id': f'test_amp_{amplitude}',
        'generation': 0,
        'survivalStreak': 0,
        'parentIds': [],
        'nodes': nodes,
        'muscles': muscles,
        'globalFrequencyMultiplier': 1.0,
        'controllerType': 'neural',
        'color': {'h': 0.5, 's': 0.7, 'l': 0.5},
    }


def create_batch_with_amplitudes(amplitudes: list[float]) -> CreatureBatch:
    """Create a batch with creatures having different amplitude values."""
    genomes = [create_genome_with_amplitude(amp) for amp in amplitudes]
    for i, g in enumerate(genomes):
        g['id'] = f'test_{i}'
    return creature_genomes_to_batch(genomes)


def create_test_network(batch_size: int, num_muscles: int = 3) -> BatchedNeuralNetwork:
    """Create a test neural network for pure mode."""
    config = NeuralConfig(neural_mode='pure')
    return BatchedNeuralNetwork.initialize_random(
        batch_size=batch_size,
        num_muscles=[num_muscles] * batch_size,
        config=config,
    )


# =============================================================================
# Test: Pure Mode Ignores Amplitude in Physics
# =============================================================================

class TestPureModeIgnoresAmplitude:
    """
    CRITICAL TESTS: Verify that amplitude is completely ignored in pure mode physics.

    In pure mode, the formula is:
        contraction = nn_output  (amplitude NOT used)
        rest_length = base * (1 - contraction)

    Unlike hybrid mode:
        contraction = base_contraction * amplitude * nn_modulation
    """

    def test_amplitude_zero_vs_one_identical_behavior(self):
        """
        Pure mode: amplitude=0 and amplitude=1.0 should produce IDENTICAL rest lengths.

        This is the core test - if amplitude had any effect, these would differ.
        """
        # Create two creatures: one with amplitude=0, one with amplitude=1.0
        genome_amp0 = create_genome_with_amplitude(0.0)
        genome_amp1 = create_genome_with_amplitude(1.0)

        batch_amp0 = creature_genomes_to_batch([genome_amp0])
        batch_amp1 = creature_genomes_to_batch([genome_amp1])

        base_rest_0 = batch_amp0.spring_rest_length.clone()
        base_rest_1 = batch_amp1.spring_rest_length.clone()

        # Same NN output for both
        nn_outputs = torch.tensor([[0.5, 0.3, 0.7] + [0.0] * (MAX_MUSCLES - 3)])

        # Compute rest lengths in pure mode
        rest_0 = compute_neural_rest_lengths(
            batch_amp0, base_rest_0, nn_outputs, time=0.5, mode='pure'
        )
        rest_1 = compute_neural_rest_lengths(
            batch_amp1, base_rest_1, nn_outputs, time=0.5, mode='pure'
        )

        # They should be IDENTICAL since pure mode ignores amplitude
        valid_mask_0 = batch_amp0.spring_mask.bool()
        valid_mask_1 = batch_amp1.spring_mask.bool()

        assert torch.allclose(rest_0[valid_mask_0], rest_1[valid_mask_1], atol=1e-6), \
            f"Pure mode should ignore amplitude! amp=0 gave {rest_0[valid_mask_0]}, amp=1 gave {rest_1[valid_mask_1]}"

    def test_amplitude_extreme_value_100(self):
        """
        Pure mode: amplitude=100 (extreme) should work normally and match amplitude=0.

        In hybrid mode, amplitude=100 would cause extreme oscillation.
        In pure mode, it should have no effect.
        """
        genome_amp0 = create_genome_with_amplitude(0.0)
        genome_amp100 = create_genome_with_amplitude(100.0)

        batch_amp0 = creature_genomes_to_batch([genome_amp0])
        batch_amp100 = creature_genomes_to_batch([genome_amp100])

        base_rest_0 = batch_amp0.spring_rest_length.clone()
        base_rest_100 = batch_amp100.spring_rest_length.clone()

        nn_outputs = torch.tensor([[0.5, 0.3, 0.7] + [0.0] * (MAX_MUSCLES - 3)])

        rest_0 = compute_neural_rest_lengths(
            batch_amp0, base_rest_0, nn_outputs, time=1.0, mode='pure'
        )
        rest_100 = compute_neural_rest_lengths(
            batch_amp100, base_rest_100, nn_outputs, time=1.0, mode='pure'
        )

        valid_mask_0 = batch_amp0.spring_mask.bool()
        valid_mask_100 = batch_amp100.spring_mask.bool()

        assert torch.allclose(rest_0[valid_mask_0], rest_100[valid_mask_100], atol=1e-6), \
            "Pure mode should ignore extreme amplitude=100!"

    def test_amplitude_negative_ignored(self):
        """
        Pure mode: even negative amplitude should be ignored.
        """
        genome_amp_neg = create_genome_with_amplitude(-0.5)
        genome_amp_pos = create_genome_with_amplitude(0.5)

        batch_neg = creature_genomes_to_batch([genome_amp_neg])
        batch_pos = creature_genomes_to_batch([genome_amp_pos])

        base_rest_neg = batch_neg.spring_rest_length.clone()
        base_rest_pos = batch_pos.spring_rest_length.clone()

        nn_outputs = torch.tensor([[0.5, 0.3, 0.7] + [0.0] * (MAX_MUSCLES - 3)])

        rest_neg = compute_neural_rest_lengths(
            batch_neg, base_rest_neg, nn_outputs, time=0.0, mode='pure'
        )
        rest_pos = compute_neural_rest_lengths(
            batch_pos, base_rest_pos, nn_outputs, time=0.0, mode='pure'
        )

        valid_mask_neg = batch_neg.spring_mask.bool()
        valid_mask_pos = batch_pos.spring_mask.bool()

        assert torch.allclose(rest_neg[valid_mask_neg], rest_pos[valid_mask_pos], atol=1e-6), \
            "Pure mode should ignore negative amplitude!"

    def test_mixed_amplitudes_in_batch_identical(self):
        """
        Creatures with different amplitudes in the same batch should behave identically
        when given the same NN outputs in pure mode.
        """
        amplitudes = [0.0, 0.1, 0.5, 1.0, 2.0]
        batch = create_batch_with_amplitudes(amplitudes)
        base_rest_lengths = batch.spring_rest_length.clone()

        # Same NN output for all creatures
        nn_outputs = torch.tensor([[0.4, 0.4, 0.4] + [0.0] * (MAX_MUSCLES - 3)] * len(amplitudes))

        rest_lengths = compute_neural_rest_lengths(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='pure'
        )

        # All creatures should have identical rest lengths (within float tolerance)
        for i in range(1, len(amplitudes)):
            valid_mask_0 = batch.spring_mask[0].bool()
            valid_mask_i = batch.spring_mask[i].bool()

            assert torch.allclose(
                rest_lengths[0][valid_mask_0],
                rest_lengths[i][valid_mask_i],
                atol=1e-6
            ), f"Creature {i} with amp={amplitudes[i]} differs from amp={amplitudes[0]}!"

    def test_time_independence_in_pure_mode(self):
        """
        Pure mode rest lengths should NOT depend on time (unlike hybrid mode).

        This indirectly confirms amplitude is not used, since in hybrid mode:
        base_contraction = sin(time * freq * 2pi + phase) * amplitude
        """
        genome = create_genome_with_amplitude(0.5)
        batch = creature_genomes_to_batch([genome])
        base_rest_lengths = batch.spring_rest_length.clone()

        nn_outputs = torch.tensor([[0.5, 0.3, 0.7] + [0.0] * (MAX_MUSCLES - 3)])

        # Compute at different times
        rest_t0 = compute_neural_rest_lengths(batch, base_rest_lengths, nn_outputs, time=0.0, mode='pure')
        rest_t1 = compute_neural_rest_lengths(batch, base_rest_lengths, nn_outputs, time=0.25, mode='pure')
        rest_t2 = compute_neural_rest_lengths(batch, base_rest_lengths, nn_outputs, time=0.5, mode='pure')
        rest_t3 = compute_neural_rest_lengths(batch, base_rest_lengths, nn_outputs, time=1.0, mode='pure')

        valid_mask = batch.spring_mask.bool()

        assert torch.allclose(rest_t0[valid_mask], rest_t1[valid_mask], atol=1e-6)
        assert torch.allclose(rest_t0[valid_mask], rest_t2[valid_mask], atol=1e-6)
        assert torch.allclose(rest_t0[valid_mask], rest_t3[valid_mask], atol=1e-6)


# =============================================================================
# Test: Full Simulation with Different Amplitudes
# =============================================================================

class TestPureModeSimulationAmplitude:
    """Test that full simulations are identical regardless of amplitude in pure mode."""

    def test_full_simulation_amplitude_independence(self):
        """
        Run full simulations with different amplitudes - they should produce
        identical results in pure mode.
        """
        # Create genomes with very different amplitudes
        genome_amp0 = create_genome_with_amplitude(0.0)
        genome_amp1 = create_genome_with_amplitude(1.0)

        batch_amp0 = creature_genomes_to_batch([genome_amp0])
        batch_amp1 = creature_genomes_to_batch([genome_amp1])

        # Use same seed for network initialization
        torch.manual_seed(42)
        network_0 = create_test_network(1)
        torch.manual_seed(42)
        network_1 = create_test_network(1)

        pellet_positions = torch.tensor([[5.0, 0.0, 0.0]])

        result_0 = simulate_with_neural(
            batch_amp0, network_0, pellet_positions,
            num_steps=60, mode='pure', dead_zone=0.1
        )

        # Reset batch for second simulation
        batch_amp1 = creature_genomes_to_batch([genome_amp1])

        result_1 = simulate_with_neural(
            batch_amp1, network_1, pellet_positions,
            num_steps=60, mode='pure', dead_zone=0.1
        )

        # Final positions should be identical
        assert torch.allclose(result_0['final_com'], result_1['final_com'], atol=1e-5), \
            f"Final COM differs! amp=0: {result_0['final_com']}, amp=1: {result_1['final_com']}"

        # Total activation should be identical
        assert torch.allclose(result_0['total_activation'], result_1['total_activation'], atol=1e-5), \
            "Total activation differs despite same NN outputs!"

    def test_extreme_amplitude_no_nan_or_inf(self):
        """
        Extreme amplitude values should not cause NaN or Inf in pure mode.
        """
        genome = create_genome_with_amplitude(1000.0)  # Absurdly high
        batch = creature_genomes_to_batch([genome])
        network = create_test_network(1)
        pellet_positions = torch.tensor([[5.0, 0.0, 0.0]])

        result = simulate_with_neural(
            batch, network, pellet_positions,
            num_steps=120, mode='pure', dead_zone=0.1
        )

        assert not torch.any(torch.isnan(result['final_positions'])), "NaN in positions!"
        assert not torch.any(torch.isinf(result['final_positions'])), "Inf in positions!"
        assert not torch.any(torch.isnan(result['final_com'])), "NaN in COM!"


# =============================================================================
# Test: Contrast with Hybrid Mode (Amplitude DOES Matter)
# =============================================================================

class TestHybridModeUsesAmplitude:
    """
    Contrast tests: Verify that in HYBRID mode, amplitude DOES affect behavior.
    This confirms our pure mode tests are meaningful.
    """

    def test_hybrid_mode_amplitude_affects_rest_lengths(self):
        """
        In hybrid mode, amplitude=0 vs amplitude=1.0 should produce DIFFERENT rest lengths.
        """
        genome_amp0 = create_genome_with_amplitude(0.0)
        genome_amp1 = create_genome_with_amplitude(0.5)  # Use 0.5 for visible effect

        batch_amp0 = creature_genomes_to_batch([genome_amp0])
        batch_amp1 = creature_genomes_to_batch([genome_amp1])

        base_rest_0 = batch_amp0.spring_rest_length.clone()
        base_rest_1 = batch_amp1.spring_rest_length.clone()

        nn_outputs = torch.tensor([[0.5, 0.3, 0.7] + [0.0] * (MAX_MUSCLES - 3)])

        # Test at time=0.25 where base oscillation = sin(0.5*pi) = 1 (max effect)
        rest_0 = compute_neural_rest_lengths(
            batch_amp0, base_rest_0, nn_outputs, time=0.25, mode='hybrid'
        )
        rest_1 = compute_neural_rest_lengths(
            batch_amp1, base_rest_1, nn_outputs, time=0.25, mode='hybrid'
        )

        valid_mask_0 = batch_amp0.spring_mask.bool()
        valid_mask_1 = batch_amp1.spring_mask.bool()

        # In hybrid mode with amplitude=0, contraction should be 0 regardless of base oscillation
        # With amplitude=0.5, there should be visible contraction
        # So they should NOT be equal
        assert not torch.allclose(rest_0[valid_mask_0], rest_1[valid_mask_1], atol=1e-6), \
            "Hybrid mode should USE amplitude - amp=0 and amp=0.5 should differ!"


# =============================================================================
# Test: Genetics Still Sets Amplitude (Wasteful for Pure Mode)
# =============================================================================

class TestGeneticsAmplitudeWaste:
    """
    These tests document that mutation and crossover STILL modify amplitude
    for pure mode creatures. This is wasteful but currently by design.

    Future optimization: Skip amplitude mutations when controllerType='neural'
    and mode='pure'.
    """

    def test_mutation_modifies_amplitude_for_pure_mode(self):
        """
        Document: Mutation still modifies amplitude even for neural creatures.
        This is wasteful compute in pure mode.
        """
        # Generate a neural genome (pure mode)
        genome = generate_random_genome(
            use_neural_net=True,
            neural_mode='pure',
            time_encoding='cyclic'
        )

        assert genome['controllerType'] == 'neural'
        original_amplitudes = [m['amplitude'] for m in genome['muscles']]

        # Mutate many times and check if amplitude ever changes
        config = MutationConfig(rate=1.0, magnitude=1.0)  # High mutation rate
        constraints = GenomeConstraints()

        amplitude_changed = False
        for _ in range(20):
            mutated = mutate_genome(genome, config, constraints)
            new_amplitudes = [m['amplitude'] for m in mutated['muscles']]

            # Check if any amplitude changed
            if len(new_amplitudes) == len(original_amplitudes):
                for orig, new in zip(original_amplitudes, new_amplitudes):
                    if abs(orig - new) > 0.01:
                        amplitude_changed = True
                        break
            if amplitude_changed:
                break

        # This SHOULD be True (amplitude is being mutated)
        # This is documenting current behavior - not asserting it's correct
        assert amplitude_changed, \
            "Expected amplitude to be mutated (wasteful in pure mode)"

    def test_crossover_interpolates_amplitude_for_pure_mode(self):
        """
        Document: Crossover still interpolates amplitude even for neural creatures.
        This is wasteful compute in pure mode.
        """
        # Generate two neural genomes
        parent1 = generate_random_genome(use_neural_net=True, neural_mode='pure')
        parent2 = generate_random_genome(use_neural_net=True, neural_mode='pure')

        # Force very different amplitudes
        for m in parent1['muscles']:
            m['amplitude'] = 0.1
        for m in parent2['muscles']:
            m['amplitude'] = 0.9

        constraints = GenomeConstraints()

        # Crossover should produce child with interpolated amplitudes
        child = single_point_crossover(parent1, parent2, constraints)

        # Check if child amplitudes are between parents (interpolated)
        child_amplitudes = [m['amplitude'] for m in child['muscles']]

        # At least some should be interpolated (not exactly 0.1 or 0.9)
        has_interpolated = any(0.15 < amp < 0.85 for amp in child_amplitudes)

        # This documents that crossover is happening on amplitude
        # (wasteful for pure mode but current behavior)
        assert has_interpolated or len(child_amplitudes) < 2, \
            "Crossover should interpolate amplitude (wasteful in pure mode)"

    def test_new_muscles_get_amplitude_for_neural_creatures(self):
        """
        Document: When structural mutation adds a muscle to a neural creature,
        it still assigns a random amplitude (wasteful in pure mode).
        """
        genome = generate_random_genome(use_neural_net=True, neural_mode='pure')

        # Force structural mutation
        config = MutationConfig(rate=0.0, structural_rate=1.0)
        constraints = GenomeConstraints(max_muscles=15)

        original_muscle_count = len(genome['muscles'])

        # Try multiple times to get a muscle addition
        for _ in range(20):
            mutated = mutate_genome(genome, config, constraints)
            if len(mutated['muscles']) > original_muscle_count:
                new_muscles = mutated['muscles'][original_muscle_count:]

                # New muscles will have amplitude set
                for m in new_muscles:
                    assert 'amplitude' in m, "New muscle should have amplitude key"
                    assert m['amplitude'] > 0, \
                        "New muscle amplitude should be positive (wasteful in pure mode)"
                break


# =============================================================================
# Test: Verify Formula Correctness
# =============================================================================

class TestPureModeFormula:
    """
    Verify the exact formula used in pure mode:
        contraction = nn_output  (directly)
        rest_length = base * (1 - contraction)
    """

    def test_pure_mode_contraction_equals_nn_output(self):
        """
        Verify: In pure mode, contraction IS the NN output directly.
        rest_length = base * (1 - nn_output)
        """
        genome = create_genome_with_amplitude(0.5)  # Amplitude should be ignored
        batch = creature_genomes_to_batch([genome])
        base_rest = batch.spring_rest_length.clone()

        # Test with specific NN output
        nn_output_val = 0.6
        nn_outputs = torch.tensor([[nn_output_val, nn_output_val, nn_output_val] + [0.0] * (MAX_MUSCLES - 3)])

        rest_lengths = compute_neural_rest_lengths(
            batch, base_rest, nn_outputs, time=0.0, mode='pure'
        )

        # Expected: base * (1 - 0.6) = base * 0.4
        expected = base_rest[0] * (1 - nn_output_val)
        valid_mask = batch.spring_mask[0].bool()

        assert torch.allclose(rest_lengths[0][valid_mask], expected[valid_mask], atol=1e-5), \
            f"Pure mode formula incorrect! Got {rest_lengths[0][valid_mask]}, expected {expected[valid_mask]}"

    def test_pure_mode_max_contraction_clamps(self):
        """
        When nn_output = 1.0, rest_length = base * 0 = 0, clamped to 0.01
        """
        genome = create_genome_with_amplitude(0.3)
        batch = creature_genomes_to_batch([genome])
        base_rest = batch.spring_rest_length.clone()

        nn_outputs = torch.ones(1, MAX_MUSCLES)  # All 1.0

        rest_lengths = compute_neural_rest_lengths(
            batch, base_rest, nn_outputs, time=0.0, mode='pure'
        )

        valid_mask = batch.spring_mask.bool()

        # Should be clamped to 0.01 (minimum rest length)
        assert torch.allclose(
            rest_lengths[valid_mask],
            torch.full_like(rest_lengths[valid_mask], 0.01),
            atol=1e-5
        )

    def test_pure_mode_max_extension(self):
        """
        When nn_output = -1.0, rest_length = base * 2 (maximum extension)
        """
        genome = create_genome_with_amplitude(0.3)
        batch = creature_genomes_to_batch([genome])
        base_rest = batch.spring_rest_length.clone()

        nn_outputs = -torch.ones(1, MAX_MUSCLES)  # All -1.0

        rest_lengths = compute_neural_rest_lengths(
            batch, base_rest, nn_outputs, time=0.0, mode='pure'
        )

        expected = base_rest[0] * 2  # (1 - (-1)) = 2
        valid_mask = batch.spring_mask[0].bool()

        assert torch.allclose(rest_lengths[0][valid_mask], expected[valid_mask], atol=1e-5)


# =============================================================================
# Run Tests
# =============================================================================

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
