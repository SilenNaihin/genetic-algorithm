"""
Edge case and stress tests for proprioception inputs.

These tests intentionally try to break the implementation
by exploring boundary conditions, numerical edge cases, and integration scenarios.
"""

import pytest
import torch
import math

from app.simulation.tensors import (
    CreatureBatch,
    creature_genomes_to_batch,
    MAX_NODES,
    MAX_MUSCLES,
)
from app.neural.sensors import (
    compute_muscle_strain,
    compute_node_velocities,
    compute_ground_contact,
    gather_proprioception_inputs,
    get_proprioception_input_size,
    GROUND_CONTACT_THRESHOLD,
)
from app.neural.network import (
    get_input_size,
    get_proprioception_input_count,
    BatchedNeuralNetwork,
    NeuralConfig,
)


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def simple_genome():
    """A simple 3-node, 2-muscle creature for testing."""
    return {
        "id": "test_creature",
        "nodes": [
            {"id": "n0", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.5},
            {"id": "n1", "position": {"x": 1, "y": 0.5, "z": 0}, "size": 0.5},
            {"id": "n2", "position": {"x": 0.5, "y": 1.5, "z": 0}, "size": 0.5},
        ],
        "muscles": [
            {"nodeA": "n0", "nodeB": "n1", "restLength": 1.0, "frequency": 1.0, "amplitude": 0.2},
            {"nodeA": "n0", "nodeB": "n2", "restLength": 1.0, "frequency": 1.0, "amplitude": 0.2},
        ],
    }


@pytest.fixture
def minimal_genome():
    """Minimal creature: 2 nodes, 1 muscle."""
    return {
        "id": "minimal",
        "nodes": [
            {"id": "n0", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.5},
            {"id": "n1", "position": {"x": 1, "y": 0.5, "z": 0}, "size": 0.5},
        ],
        "muscles": [
            {"nodeA": "n0", "nodeB": "n1", "restLength": 1.0},
        ],
    }


@pytest.fixture
def maximal_genome():
    """Maximal creature: MAX_NODES nodes, MAX_MUSCLES muscles."""
    nodes = [
        {"id": f"n{i}", "position": {"x": i * 0.5, "y": 0.5, "z": 0}, "size": 0.3}
        for i in range(MAX_NODES)
    ]
    muscles = []
    for i in range(MAX_MUSCLES):
        a = i % MAX_NODES
        b = (i + 1) % MAX_NODES
        muscles.append({
            "nodeA": f"n{a}",
            "nodeB": f"n{b}",
            "restLength": 0.5,
            "frequency": 1.0,
            "amplitude": 0.2,
        })
    return {
        "id": "maximal",
        "nodes": nodes,
        "muscles": muscles,
    }


# =============================================================================
# Numerical Edge Cases - Muscle Strain
# =============================================================================

class TestMuscleStrainNumerical:
    """Tests for numerical stability in muscle strain calculation."""

    def test_zero_rest_length_handled(self, simple_genome):
        """Near-zero rest length should not cause division by zero."""
        batch = creature_genomes_to_batch([simple_genome])
        # Set rest length to very small value
        near_zero_rest = torch.full_like(batch.spring_rest_length, 1e-8)

        strain = compute_muscle_strain(batch, near_zero_rest)

        assert not torch.isnan(strain).any(), "Strain should not contain NaN with near-zero rest length"
        assert not torch.isinf(strain).any(), "Strain should not contain Inf with near-zero rest length"

    def test_extreme_extension(self, simple_genome):
        """Extreme muscle extension should be clamped."""
        batch = creature_genomes_to_batch([simple_genome])
        # Move nodes far apart
        batch.positions[0, 1, 0] = 100.0  # Move node 1 very far

        strain = compute_muscle_strain(batch, batch.spring_rest_length.clone())

        assert strain.min() >= -1.0, "Strain should be clamped to >= -1"
        assert strain.max() <= 1.0, "Strain should be clamped to <= 1"

    def test_extreme_compression(self, simple_genome):
        """Extreme muscle compression should be clamped."""
        batch = creature_genomes_to_batch([simple_genome])
        # Move nodes on top of each other
        batch.positions[0, 1] = batch.positions[0, 0].clone()

        strain = compute_muscle_strain(batch, batch.spring_rest_length.clone())

        assert strain.min() >= -1.0, "Strain should be clamped to >= -1"
        assert strain.max() <= 1.0, "Strain should be clamped to <= 1"

    def test_nan_position_produces_nan(self, simple_genome):
        """NaN positions should produce NaN strain (caller should handle)."""
        batch = creature_genomes_to_batch([simple_genome])
        batch.positions[0, 0, 0] = float('nan')

        strain = compute_muscle_strain(batch, batch.spring_rest_length.clone())

        # NaN in positions should propagate (this is expected behavior)
        # The simulation should prevent NaN positions from occurring

    def test_identical_node_positions(self, simple_genome):
        """Two nodes at same position should not cause NaN."""
        batch = creature_genomes_to_batch([simple_genome])
        # Make both muscle endpoints the same position
        batch.positions[0, 1] = batch.positions[0, 0].clone()
        batch.positions[0, 2] = batch.positions[0, 0].clone()

        strain = compute_muscle_strain(batch, batch.spring_rest_length.clone())

        # Current length is 0, rest length is 1, strain = (0-1)/1 = -1
        assert not torch.isnan(strain).any(), "Strain should not be NaN"


# =============================================================================
# Numerical Edge Cases - Node Velocities
# =============================================================================

class TestNodeVelocitiesNumerical:
    """Tests for numerical stability in node velocity calculation."""

    def test_zero_velocity(self, simple_genome):
        """Zero velocity should produce all zeros."""
        batch = creature_genomes_to_batch([simple_genome])
        batch.velocities[:] = 0

        velocities = compute_node_velocities(batch)

        assert (velocities == 0).all(), "Zero velocity should produce zero outputs"

    def test_extreme_velocity(self, simple_genome):
        """Extreme velocities should be clamped to [-1, 1]."""
        batch = creature_genomes_to_batch([simple_genome])
        batch.velocities[:] = 1000.0  # Very high velocity

        velocities = compute_node_velocities(batch)

        assert velocities.min() >= -1.0, "Velocities should be clamped to >= -1"
        assert velocities.max() <= 1.0, "Velocities should be clamped to <= 1"

    def test_negative_extreme_velocity(self, simple_genome):
        """Extreme negative velocities should be clamped."""
        batch = creature_genomes_to_batch([simple_genome])
        batch.velocities[:] = -1000.0

        velocities = compute_node_velocities(batch)

        assert velocities.min() >= -1.0
        assert velocities.max() <= 1.0

    def test_nan_velocity_propagates(self, simple_genome):
        """NaN velocity produces NaN output (expected)."""
        batch = creature_genomes_to_batch([simple_genome])
        batch.velocities[0, 0, 0] = float('nan')

        velocities = compute_node_velocities(batch)

        # NaN should propagate - caller must ensure no NaN velocities
        assert torch.isnan(velocities[0, 0, 0])

    def test_mixed_velocities(self, simple_genome):
        """Different velocity directions in same batch."""
        batch = creature_genomes_to_batch([simple_genome])
        batch.velocities[0, 0] = torch.tensor([5.0, 0.0, 0.0])  # +X
        batch.velocities[0, 1] = torch.tensor([0.0, -5.0, 0.0])  # -Y
        batch.velocities[0, 2] = torch.tensor([0.0, 0.0, 5.0])  # +Z

        velocities = compute_node_velocities(batch, max_velocity=10.0)

        assert velocities[0, 0, 0] == pytest.approx(0.5, abs=1e-6)  # 5/10
        assert velocities[0, 1, 1] == pytest.approx(-0.5, abs=1e-6)  # -5/10
        assert velocities[0, 2, 2] == pytest.approx(0.5, abs=1e-6)  # 5/10


# =============================================================================
# Numerical Edge Cases - Ground Contact
# =============================================================================

class TestGroundContactNumerical:
    """Tests for numerical stability in ground contact calculation."""

    def test_exactly_at_threshold(self, simple_genome):
        """Exactly at threshold should be considered NOT touching."""
        batch = creature_genomes_to_batch([simple_genome])
        batch.positions[0, :, 1] = GROUND_CONTACT_THRESHOLD

        contact = compute_ground_contact(batch)

        # At threshold means y < threshold is False
        assert (contact == 0).all(), "Exactly at threshold should NOT be touching"

    def test_just_below_threshold(self, simple_genome):
        """Just below threshold should be touching."""
        batch = creature_genomes_to_batch([simple_genome])
        batch.positions[0, :, 1] = GROUND_CONTACT_THRESHOLD - 0.001

        contact = compute_ground_contact(batch)

        valid_contacts = contact[0, :batch.node_counts[0].item()]
        assert (valid_contacts == 1).all(), "Just below threshold should be touching"

    def test_negative_y_position(self, simple_genome):
        """Negative Y (below ground) should be touching."""
        batch = creature_genomes_to_batch([simple_genome])
        batch.positions[0, 0, 1] = -1.0  # Below ground

        contact = compute_ground_contact(batch)

        assert contact[0, 0] == 1.0, "Below ground should be touching"

    def test_high_position_not_touching(self, simple_genome):
        """High Y position should not be touching."""
        batch = creature_genomes_to_batch([simple_genome])
        batch.positions[0, :, 1] = 10.0  # High in the air

        contact = compute_ground_contact(batch)

        assert (contact == 0).all(), "High positions should not be touching"

    def test_mixed_contacts(self, simple_genome):
        """Some nodes touching, some not."""
        batch = creature_genomes_to_batch([simple_genome])
        batch.positions[0, 0, 1] = 0.05  # Touching
        batch.positions[0, 1, 1] = 0.5   # Not touching
        batch.positions[0, 2, 1] = 0.1   # Touching

        contact = compute_ground_contact(batch)

        assert contact[0, 0] == 1.0
        assert contact[0, 1] == 0.0
        assert contact[0, 2] == 1.0


# =============================================================================
# Empty/Missing Data Tests
# =============================================================================

class TestEmptyInputs:
    """Tests for empty and missing data handling."""

    def test_empty_batch_strain(self):
        """Empty batch should return empty tensor."""
        batch = creature_genomes_to_batch([])
        base_rest = torch.zeros(0, MAX_MUSCLES)

        strain = compute_muscle_strain(batch, base_rest)

        assert strain.shape == (0, MAX_MUSCLES)

    def test_empty_batch_velocities(self):
        """Empty batch should return empty tensor."""
        batch = creature_genomes_to_batch([])

        velocities = compute_node_velocities(batch)

        assert velocities.shape == (0, MAX_NODES, 3)

    def test_empty_batch_ground_contact(self):
        """Empty batch should return empty tensor."""
        batch = creature_genomes_to_batch([])

        contact = compute_ground_contact(batch)

        assert contact.shape == (0, MAX_NODES)

    def test_empty_batch_gather_proprioception(self):
        """Empty batch gather_proprioception_inputs should return empty tensor."""
        batch = creature_genomes_to_batch([])
        base_rest = torch.zeros(0, MAX_MUSCLES)

        for prop_type in ['strain', 'velocity', 'ground', 'all']:
            inputs = gather_proprioception_inputs(batch, base_rest, prop_type)
            assert inputs.shape[0] == 0


# =============================================================================
# Boundary Conditions - Input Size Calculation
# =============================================================================

class TestInputSizeBoundaries:
    """Tests for input size calculation edge cases."""

    def test_all_proprioception_types(self):
        """All proprioception types should return correct sizes."""
        assert get_proprioception_input_count('strain') == MAX_MUSCLES  # 15
        assert get_proprioception_input_count('velocity') == MAX_NODES * 3  # 24
        assert get_proprioception_input_count('ground') == MAX_NODES  # 8
        assert get_proprioception_input_count('all') == MAX_MUSCLES + MAX_NODES * 4  # 47

    def test_combined_input_sizes(self):
        """Combined base + time + proprioception sizes should be correct."""
        # Pure mode, no time, no prop
        assert get_input_size('pure', 'none', False, 'all') == 7

        # Pure mode, no time, all prop
        assert get_input_size('pure', 'none', True, 'all') == 7 + 47

        # Hybrid mode, cyclic time, no prop
        assert get_input_size('hybrid', 'cyclic', False, 'all') == 7 + 2

        # Hybrid mode, cyclic time, strain prop
        assert get_input_size('hybrid', 'cyclic', True, 'strain') == 7 + 2 + 15

        # All combinations
        assert get_input_size('pure', 'sin', True, 'velocity') == 7 + 1 + 24
        assert get_input_size('hybrid', 'raw', True, 'ground') == 7 + 1 + 8

    def test_proprioception_size_per_type(self):
        """Individual proprioception input size functions."""
        assert get_proprioception_input_size('strain', MAX_NODES, MAX_MUSCLES) == MAX_MUSCLES
        assert get_proprioception_input_size('velocity', MAX_NODES, MAX_MUSCLES) == MAX_NODES * 3
        assert get_proprioception_input_size('ground', MAX_NODES, MAX_MUSCLES) == MAX_NODES
        assert get_proprioception_input_size('all', MAX_NODES, MAX_MUSCLES) == MAX_MUSCLES + MAX_NODES * 4


# =============================================================================
# Integration Tests - Full Pipeline
# =============================================================================

class TestIntegration:
    """Tests for component interactions."""

    def test_gather_proprioception_all_types(self, simple_genome):
        """Gather all proprioception inputs and verify structure."""
        batch = creature_genomes_to_batch([simple_genome])
        base_rest = batch.spring_rest_length.clone()

        for prop_type in ['strain', 'velocity', 'ground', 'all']:
            inputs = gather_proprioception_inputs(batch, base_rest, prop_type)
            expected_size = get_proprioception_input_count(prop_type)
            assert inputs.shape == (1, expected_size), f"Wrong shape for {prop_type}"
            assert not torch.isnan(inputs).any(), f"NaN in {prop_type} inputs"

    def test_proprioception_concatenation_order(self, simple_genome):
        """'all' proprioception should concatenate in correct order."""
        batch = creature_genomes_to_batch([simple_genome])
        base_rest = batch.spring_rest_length.clone()

        # Set distinct values to verify order
        batch.positions[0, 0, 1] = 0.05  # Ground contact for node 0
        batch.velocities[0, 1] = torch.tensor([5.0, 0.0, 0.0])

        all_inputs = gather_proprioception_inputs(batch, base_rest, 'all')

        # Verify order: strain, velocity, ground
        strain_end = MAX_MUSCLES
        velocity_end = strain_end + MAX_NODES * 3
        ground_end = velocity_end + MAX_NODES

        strain_part = all_inputs[0, :strain_end]
        velocity_part = all_inputs[0, strain_end:velocity_end]
        ground_part = all_inputs[0, velocity_end:ground_end]

        # Verify each part matches individual computation
        assert torch.allclose(strain_part, compute_muscle_strain(batch, base_rest)[0])
        assert torch.allclose(
            velocity_part,
            compute_node_velocities(batch)[0].flatten()
        )
        assert torch.allclose(ground_part, compute_ground_contact(batch)[0])

    def test_neural_network_with_proprioception(self, simple_genome):
        """Neural network should work with proprioception inputs."""
        config = NeuralConfig(
            neural_mode='pure',
            time_encoding='none',
            hidden_size=8,
            use_proprioception=True,
            proprioception_inputs='all',
        )

        input_size = get_input_size(
            config.neural_mode,
            config.time_encoding,
            config.use_proprioception,
            config.proprioception_inputs,
        )

        # Create network
        network = BatchedNeuralNetwork.initialize_random(
            batch_size=1,
            num_muscles=[2],
            config=config,
            max_muscles=MAX_MUSCLES,
        )

        # Create inputs
        inputs = torch.randn(1, input_size)

        # Forward pass should work
        outputs = network.forward(inputs)

        assert outputs.shape == (1, MAX_MUSCLES)
        assert not torch.isnan(outputs).any()

    def test_batched_proprioception(self, simple_genome, maximal_genome):
        """Proprioception should work with batched creatures of different sizes."""
        batch = creature_genomes_to_batch([simple_genome, maximal_genome])
        base_rest = batch.spring_rest_length.clone()

        inputs = gather_proprioception_inputs(batch, base_rest, 'all')

        assert inputs.shape == (2, MAX_MUSCLES + MAX_NODES * 4)
        assert not torch.isnan(inputs).any()

        # Verify masking - padding muscles/nodes should have 0 strain/contact
        # First creature has 2 muscles, second has MAX_MUSCLES
        strain_part = inputs[:, :MAX_MUSCLES]
        assert strain_part[0, 2:].sum() == 0, "Padding muscles should have 0 strain"


# =============================================================================
# Scale/Performance Tests
# =============================================================================

class TestScalePerformance:
    """Tests for scale and performance edge cases."""

    def test_large_batch(self, simple_genome):
        """Large batch should work without memory issues."""
        genomes = [simple_genome.copy() for _ in range(100)]
        for i, g in enumerate(genomes):
            g["id"] = f"creature_{i}"

        batch = creature_genomes_to_batch(genomes)
        base_rest = batch.spring_rest_length.clone()

        inputs = gather_proprioception_inputs(batch, base_rest, 'all')

        assert inputs.shape == (100, MAX_MUSCLES + MAX_NODES * 4)
        assert not torch.isnan(inputs).any()

    def test_repeated_computation(self, simple_genome):
        """Repeated computation should be consistent."""
        batch = creature_genomes_to_batch([simple_genome])
        base_rest = batch.spring_rest_length.clone()

        results = []
        for _ in range(10):
            inputs = gather_proprioception_inputs(batch, base_rest, 'all')
            results.append(inputs.clone())

        # All results should be identical (no randomness)
        for r in results[1:]:
            assert torch.allclose(results[0], r)


# =============================================================================
# Real-World Scenarios
# =============================================================================

class TestRealWorldScenarios:
    """Tests simulating realistic edge cases."""

    def test_resting_creature(self, simple_genome):
        """Creature at rest should have predictable proprioception."""
        batch = creature_genomes_to_batch([simple_genome])
        batch.velocities[:] = 0  # No movement
        base_rest = batch.spring_rest_length.clone()

        velocities = compute_node_velocities(batch)
        contact = compute_ground_contact(batch)

        # No velocity
        valid_velocities = velocities[0, :batch.node_counts[0].item()]
        assert (valid_velocities == 0).all()

        # Some nodes touching (depending on initial position)

    def test_falling_creature(self, simple_genome):
        """Creature falling should have downward velocity."""
        batch = creature_genomes_to_batch([simple_genome])
        # Simulate falling with gravity
        batch.velocities[0, :, 1] = -5.0  # Downward velocity

        velocities = compute_node_velocities(batch, max_velocity=10.0)

        # All Y velocities should be negative (normalized)
        valid_vels = velocities[0, :batch.node_counts[0].item()]
        assert (valid_vels[:, 1] < 0).all()

    def test_stretched_muscles_positive_strain(self, simple_genome):
        """Stretched muscles should have positive strain."""
        batch = creature_genomes_to_batch([simple_genome])
        base_rest = batch.spring_rest_length.clone()

        # Move nodes apart to stretch muscles
        batch.positions[0, 1, 0] += 0.5  # Move node 1 further right

        strain = compute_muscle_strain(batch, base_rest)

        # First muscle (n0-n1) should be stretched
        assert strain[0, 0] > 0, "Stretched muscle should have positive strain"

    def test_compressed_muscles_negative_strain(self, simple_genome):
        """Compressed muscles should have negative strain."""
        batch = creature_genomes_to_batch([simple_genome])
        base_rest = batch.spring_rest_length.clone()

        # Move nodes closer to compress muscles
        batch.positions[0, 1, 0] = batch.positions[0, 0, 0] + 0.5  # Closer than rest length

        strain = compute_muscle_strain(batch, base_rest)

        # First muscle should be compressed
        assert strain[0, 0] < 0, "Compressed muscle should have negative strain"


# =============================================================================
# Config and API Integration
# =============================================================================

class TestConfigIntegration:
    """Tests for config and API integration."""

    def test_neural_config_defaults(self):
        """NeuralConfig should have correct proprioception defaults."""
        config = NeuralConfig()
        assert config.use_proprioception == False
        assert config.proprioception_inputs == 'all'

    def test_neural_config_custom(self):
        """NeuralConfig should accept custom proprioception settings."""
        config = NeuralConfig(
            use_proprioception=True,
            proprioception_inputs='strain',
        )
        assert config.use_proprioception == True
        assert config.proprioception_inputs == 'strain'

    def test_input_size_respects_config(self):
        """get_input_size should respect config proprioception settings."""
        config = NeuralConfig(
            neural_mode='pure',
            time_encoding='none',
            use_proprioception=True,
            proprioception_inputs='strain',
        )

        size = get_input_size(
            config.neural_mode,
            config.time_encoding,
            config.use_proprioception,
            config.proprioception_inputs,
        )

        assert size == 7 + 15  # base + strain
