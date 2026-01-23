"""
Comprehensive tests for tensor data structures.

Tests cover:
- Basic functionality
- Edge cases (empty, single, max capacity)
- Mixed batch sizes
- Numerical stability
- Device compatibility
"""

import pytest
import torch

from app.simulation.tensors import (
    MAX_NODES,
    MAX_MUSCLES,
    CreatureBatch,
    creature_genomes_to_batch,
    get_center_of_mass,
    get_default_device,
)


# =============================================================================
# Test Fixtures - Sample Genomes
# =============================================================================


def make_simple_genome(genome_id: str = "test-1", num_nodes: int = 3, num_muscles: int = 2):
    """Create a simple genome with specified number of nodes and muscles."""
    nodes = []
    for i in range(num_nodes):
        nodes.append({
            "id": f"node-{i}",
            "position": {"x": float(i), "y": 0.5, "z": 0.0},
            "size": 0.5,
            "friction": 0.5,
        })

    muscles = []
    for i in range(min(num_muscles, num_nodes - 1)):
        muscles.append({
            "id": f"muscle-{i}",
            "nodeA": f"node-{i}",
            "nodeB": f"node-{i + 1}",
            "restLength": 1.0,
            "stiffness": 100.0,
            "damping": 0.1,
            "frequency": 1.0,
            "amplitude": 0.2,
            "phase": 0.0,
            "directionBias": {"x": 1.0, "y": 0.0, "z": 0.0},
            "biasStrength": 0.5,
            "velocityBias": {"x": 0.0, "y": 1.0, "z": 0.0},
            "velocityStrength": 0.3,
            "distanceBias": 0.1,
            "distanceStrength": 0.2,
        })

    return {
        "id": genome_id,
        "nodes": nodes,
        "muscles": muscles,
        "globalFrequencyMultiplier": 1.0,
    }


def make_complex_genome():
    """Create a complex genome with max nodes and muscles."""
    nodes = []
    for i in range(MAX_NODES):
        nodes.append({
            "id": f"node-{i}",
            "position": {"x": float(i) * 0.5, "y": float(i) * 0.1 + 0.5, "z": float(i) * 0.2},
            "size": 0.3 + (i * 0.1),
            "friction": 0.3 + (i * 0.05),
        })

    muscles = []
    muscle_count = 0
    for i in range(MAX_NODES):
        for j in range(i + 1, MAX_NODES):
            if muscle_count >= MAX_MUSCLES:
                break
            muscles.append({
                "id": f"muscle-{muscle_count}",
                "nodeA": f"node-{i}",
                "nodeB": f"node-{j}",
                "restLength": 0.5 + (muscle_count * 0.1),
                "stiffness": 50.0 + (muscle_count * 10),
                "damping": 0.05 + (muscle_count * 0.01),
                "frequency": 0.5 + (muscle_count * 0.1),
                "amplitude": 0.1 + (muscle_count * 0.02),
                "phase": muscle_count * 0.5,
            })
            muscle_count += 1
        if muscle_count >= MAX_MUSCLES:
            break

    return {
        "id": "complex-genome",
        "nodes": nodes,
        "muscles": muscles,
        "globalFrequencyMultiplier": 1.5,
    }


# =============================================================================
# Test: creature_genomes_to_batch
# =============================================================================


class TestCreatureGenomesToBatch:
    """Tests for creature_genomes_to_batch function."""

    def test_single_genome_basic(self):
        """Test converting a single simple genome."""
        genome = make_simple_genome("test-1", num_nodes=3, num_muscles=2)
        batch = creature_genomes_to_batch([genome])

        assert batch.batch_size == 1
        assert batch.positions.shape == (1, MAX_NODES, 3)
        assert batch.velocities.shape == (1, MAX_NODES, 3)
        assert batch.masses.shape == (1, MAX_NODES)
        assert batch.node_mask.shape == (1, MAX_NODES)
        assert batch.spring_mask.shape == (1, MAX_MUSCLES)
        assert batch.genome_ids == ["test-1"]

    def test_node_positions_preserved(self):
        """Test that node positions are correctly transferred."""
        genome = make_simple_genome("test-1", num_nodes=3, num_muscles=2)
        batch = creature_genomes_to_batch([genome])

        # Check first 3 nodes have correct positions
        # Genome specifies y=0.5 and it's preserved directly (no offset)
        assert batch.positions[0, 0, 0].item() == 0.0  # x of node 0
        assert batch.positions[0, 1, 0].item() == 1.0  # x of node 1
        assert batch.positions[0, 2, 0].item() == 2.0  # x of node 2
        assert batch.positions[0, 0, 1].item() == 0.5  # y of node 0 (genome value preserved)

    def test_node_mask_correct(self):
        """Test that node mask correctly indicates valid nodes."""
        genome = make_simple_genome("test-1", num_nodes=3, num_muscles=2)
        batch = creature_genomes_to_batch([genome])

        # First 3 nodes should be marked as valid
        assert batch.node_mask[0, 0].item() == 1.0
        assert batch.node_mask[0, 1].item() == 1.0
        assert batch.node_mask[0, 2].item() == 1.0
        # Remaining nodes should be padding (0)
        assert batch.node_mask[0, 3].item() == 0.0
        assert batch.node_mask[0, 7].item() == 0.0

    def test_spring_connections_correct(self):
        """Test that spring node indices are correctly mapped."""
        genome = make_simple_genome("test-1", num_nodes=3, num_muscles=2)
        batch = creature_genomes_to_batch([genome])

        # Muscle 0 connects node 0 to node 1
        assert batch.spring_node_a[0, 0].item() == 0
        assert batch.spring_node_b[0, 0].item() == 1
        # Muscle 1 connects node 1 to node 2
        assert batch.spring_node_a[0, 1].item() == 1
        assert batch.spring_node_b[0, 1].item() == 2

    def test_spring_mask_correct(self):
        """Test that spring mask correctly indicates valid muscles."""
        genome = make_simple_genome("test-1", num_nodes=3, num_muscles=2)
        batch = creature_genomes_to_batch([genome])

        assert batch.spring_mask[0, 0].item() == 1.0
        assert batch.spring_mask[0, 1].item() == 1.0
        assert batch.spring_mask[0, 2].item() == 0.0  # padding
        assert batch.spring_mask[0, 14].item() == 0.0  # last slot

    def test_multiple_genomes_batched(self):
        """Test batching multiple genomes together."""
        genomes = [
            make_simple_genome("g1", num_nodes=2, num_muscles=1),
            make_simple_genome("g2", num_nodes=4, num_muscles=3),
            make_simple_genome("g3", num_nodes=3, num_muscles=2),
        ]
        batch = creature_genomes_to_batch(genomes)

        assert batch.batch_size == 3
        assert batch.genome_ids == ["g1", "g2", "g3"]
        assert batch.node_counts[0].item() == 2
        assert batch.node_counts[1].item() == 4
        assert batch.node_counts[2].item() == 3

    def test_max_nodes_handled(self):
        """Test genome with maximum number of nodes."""
        genome = make_complex_genome()
        batch = creature_genomes_to_batch([genome])

        assert batch.node_counts[0].item() == MAX_NODES
        assert batch.node_mask[0].sum().item() == MAX_NODES

    def test_max_muscles_handled(self):
        """Test genome with maximum number of muscles."""
        genome = make_complex_genome()
        batch = creature_genomes_to_batch([genome])

        assert batch.muscle_counts[0].item() == MAX_MUSCLES
        assert batch.spring_mask[0].sum().item() == MAX_MUSCLES

    def test_direction_bias_v1(self):
        """Test v1 direction bias fields are preserved."""
        genome = make_simple_genome("test-1", num_nodes=3, num_muscles=2)
        batch = creature_genomes_to_batch([genome])

        # First muscle has directionBias (1, 0, 0), biasStrength 0.5
        assert batch.direction_bias[0, 0, 0].item() == 1.0
        assert batch.direction_bias[0, 0, 1].item() == 0.0
        assert batch.bias_strength[0, 0].item() == 0.5

    def test_velocity_bias_v2(self):
        """Test v2 velocity sensing fields are preserved."""
        genome = make_simple_genome("test-1", num_nodes=3, num_muscles=2)
        batch = creature_genomes_to_batch([genome])

        # First muscle has velocityBias (0, 1, 0), velocityStrength 0.3
        assert batch.velocity_bias[0, 0, 0].item() == 0.0
        assert batch.velocity_bias[0, 0, 1].item() == 1.0
        assert abs(batch.velocity_strength[0, 0].item() - 0.3) < 1e-5

    def test_distance_bias_v2(self):
        """Test v2 distance awareness fields are preserved."""
        genome = make_simple_genome("test-1", num_nodes=3, num_muscles=2)
        batch = creature_genomes_to_batch([genome])

        assert abs(batch.distance_bias[0, 0].item() - 0.1) < 1e-5
        assert abs(batch.distance_strength[0, 0].item() - 0.2) < 1e-5

    def test_global_frequency_multiplier(self):
        """Test global frequency multiplier is preserved."""
        genome = make_simple_genome("test-1")
        genome["globalFrequencyMultiplier"] = 2.5
        batch = creature_genomes_to_batch([genome])

        assert batch.global_freq_multiplier[0].item() == 2.5

    def test_snake_case_field_names(self):
        """Test that snake_case field names (Python style) also work."""
        genome = {
            "id": "snake-case-test",
            "nodes": [
                {"id": "n1", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.5, "friction": 0.5},
                {"id": "n2", "position": {"x": 1, "y": 0.5, "z": 0}, "size": 0.5, "friction": 0.5},
            ],
            "muscles": [
                {
                    "id": "m1",
                    "node_a": "n1",  # snake_case
                    "node_b": "n2",  # snake_case
                    "rest_length": 1.0,  # snake_case
                    "stiffness": 100.0,
                    "damping": 0.1,
                    "frequency": 1.0,
                    "amplitude": 0.2,
                    "phase": 0.0,
                    "direction_bias": {"x": 1, "y": 0, "z": 0},  # snake_case
                    "bias_strength": 0.5,  # snake_case
                }
            ],
            "global_frequency_multiplier": 1.5,  # snake_case
        }
        batch = creature_genomes_to_batch([genome])

        assert batch.spring_node_a[0, 0].item() == 0
        assert batch.spring_node_b[0, 0].item() == 1
        assert batch.spring_rest_length[0, 0].item() == 1.0
        assert batch.global_freq_multiplier[0].item() == 1.5


# =============================================================================
# Test: Edge Cases
# =============================================================================


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_empty_genomes_list(self):
        """Test with empty list of genomes."""
        batch = creature_genomes_to_batch([])

        assert batch.batch_size == 0
        assert batch.positions.shape == (0, MAX_NODES, 3)
        assert batch.genome_ids == []

    def test_genome_with_no_muscles(self):
        """Test genome with nodes but no muscles."""
        genome = {
            "id": "no-muscles",
            "nodes": [
                {"id": "n1", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.5, "friction": 0.5},
                {"id": "n2", "position": {"x": 1, "y": 0.5, "z": 0}, "size": 0.5, "friction": 0.5},
            ],
            "muscles": [],
        }
        batch = creature_genomes_to_batch([genome])

        assert batch.node_counts[0].item() == 2
        assert batch.muscle_counts[0].item() == 0
        assert batch.spring_mask[0].sum().item() == 0

    def test_genome_with_single_node(self):
        """Test genome with only one node."""
        genome = {
            "id": "single-node",
            "nodes": [
                {"id": "n1", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.5, "friction": 0.5},
            ],
            "muscles": [],
        }
        batch = creature_genomes_to_batch([genome])

        assert batch.node_counts[0].item() == 1
        assert batch.node_mask[0, 0].item() == 1.0
        assert batch.node_mask[0, 1:].sum().item() == 0.0

    def test_muscle_with_invalid_node_reference(self):
        """Test that muscles referencing non-existent nodes are skipped."""
        genome = {
            "id": "invalid-muscle",
            "nodes": [
                {"id": "n1", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.5, "friction": 0.5},
                {"id": "n2", "position": {"x": 1, "y": 0.5, "z": 0}, "size": 0.5, "friction": 0.5},
            ],
            "muscles": [
                {"id": "m1", "nodeA": "n1", "nodeB": "n2", "restLength": 1.0, "stiffness": 100.0,
                 "damping": 0.1, "frequency": 1.0, "amplitude": 0.2, "phase": 0.0},
                {"id": "m2", "nodeA": "n1", "nodeB": "n3", "restLength": 1.0, "stiffness": 100.0,
                 "damping": 0.1, "frequency": 1.0, "amplitude": 0.2, "phase": 0.0},  # n3 doesn't exist
            ],
        }
        batch = creature_genomes_to_batch([genome])

        # Only first valid muscle should be counted
        assert batch.muscle_counts[0].item() == 1

    def test_missing_optional_fields_use_defaults(self):
        """Test that missing optional fields get reasonable defaults."""
        genome = {
            "id": "minimal",
            "nodes": [
                {"id": "n1"},  # minimal node
                {"id": "n2", "position": {"x": 1}},  # partial position
            ],
            "muscles": [
                {"id": "m1", "nodeA": "n1", "nodeB": "n2"},  # minimal muscle
            ],
        }
        batch = creature_genomes_to_batch([genome])

        # Should have defaults
        assert batch.node_counts[0].item() == 2
        assert batch.muscle_counts[0].item() == 1
        # Default position y = 0.5 (genome values preserved directly)
        assert batch.positions[0, 0, 1].item() == 0.5


# =============================================================================
# Test: get_center_of_mass
# =============================================================================


class TestGetCenterOfMass:
    """Tests for get_center_of_mass function."""

    def test_single_node_com(self):
        """Test COM of a single node is the node position."""
        genome = {
            "id": "single",
            "nodes": [
                {"id": "n1", "position": {"x": 2.0, "y": 1.0, "z": 3.0}, "size": 0.5, "friction": 0.5},
            ],
            "muscles": [],
        }
        batch = creature_genomes_to_batch([genome])
        com = get_center_of_mass(batch)

        # COM should be at the single node position (genome values preserved directly)
        assert com.shape == (1, 3)
        assert abs(com[0, 0].item() - 2.0) < 1e-5
        assert abs(com[0, 1].item() - 1.0) < 1e-5  # genome y value preserved
        assert abs(com[0, 2].item() - 3.0) < 1e-5

    def test_symmetric_nodes_com(self):
        """Test COM of symmetric nodes is at center."""
        genome = {
            "id": "symmetric",
            "nodes": [
                {"id": "n1", "position": {"x": -1.0, "y": 0.0, "z": 0.0}, "size": 0.5, "friction": 0.5},
                {"id": "n2", "position": {"x": 1.0, "y": 0.0, "z": 0.0}, "size": 0.5, "friction": 0.5},
            ],
            "muscles": [],
        }
        batch = creature_genomes_to_batch([genome])
        com = get_center_of_mass(batch)

        # COM should be at x=0 (average of -1 and 1)
        assert abs(com[0, 0].item()) < 1e-5

    def test_weighted_com_by_mass(self):
        """Test that COM is weighted by mass (larger nodes have more influence)."""
        # Node with size 1.0 has much more mass than node with size 0.2
        genome = {
            "id": "weighted",
            "nodes": [
                {"id": "n1", "position": {"x": 0.0, "y": 0.0, "z": 0.0}, "size": 1.0, "friction": 0.5},
                {"id": "n2", "position": {"x": 10.0, "y": 0.0, "z": 0.0}, "size": 0.2, "friction": 0.5},
            ],
            "muscles": [],
        }
        batch = creature_genomes_to_batch([genome])
        com = get_center_of_mass(batch)

        # COM should be closer to the larger node (x=0) than the smaller (x=10)
        assert com[0, 0].item() < 5.0  # Should be less than midpoint

    def test_batched_com(self):
        """Test COM calculation works for multiple creatures."""
        genomes = [
            make_simple_genome("g1", num_nodes=2, num_muscles=1),
            make_simple_genome("g2", num_nodes=3, num_muscles=2),
        ]
        batch = creature_genomes_to_batch(genomes)
        com = get_center_of_mass(batch)

        assert com.shape == (2, 3)


# =============================================================================
# Test: Numerical Stability
# =============================================================================


class TestNumericalStability:
    """Test numerical stability with edge values."""

    def test_no_nan_in_outputs(self):
        """Verify no NaN values in batch outputs."""
        genomes = [make_simple_genome(f"g{i}") for i in range(10)]
        batch = creature_genomes_to_batch(genomes)

        assert not torch.isnan(batch.positions).any()
        assert not torch.isnan(batch.velocities).any()
        assert not torch.isnan(batch.masses).any()
        assert not torch.isnan(batch.spring_rest_length).any()

    def test_no_inf_in_outputs(self):
        """Verify no Inf values in batch outputs."""
        genomes = [make_simple_genome(f"g{i}") for i in range(10)]
        batch = creature_genomes_to_batch(genomes)

        assert not torch.isinf(batch.positions).any()
        assert not torch.isinf(batch.velocities).any()
        assert not torch.isinf(batch.masses).any()

    def test_com_no_nan_with_zero_mass(self):
        """Test COM handles zero mass gracefully (padding nodes)."""
        genome = make_simple_genome("test", num_nodes=2, num_muscles=1)
        batch = creature_genomes_to_batch([genome])
        com = get_center_of_mass(batch)

        assert not torch.isnan(com).any()
        assert not torch.isinf(com).any()


# =============================================================================
# Test: Device Compatibility
# =============================================================================


class TestDeviceCompatibility:
    """Test CPU/GPU device compatibility."""

    def test_default_device_is_valid(self):
        """Test get_default_device returns valid device."""
        device = get_default_device()
        assert device.type in ["cpu", "cuda"]

    def test_batch_on_cpu(self):
        """Test batch creation on CPU."""
        device = torch.device("cpu")
        genome = make_simple_genome("test")
        batch = creature_genomes_to_batch([genome], device=device)

        assert batch.device == device
        assert batch.positions.device == device

    def test_batch_to_device(self):
        """Test moving batch between devices."""
        genome = make_simple_genome("test")
        batch = creature_genomes_to_batch([genome], device=torch.device("cpu"))

        # Move to same device (should work)
        batch2 = batch.to(torch.device("cpu"))
        assert batch2.device == torch.device("cpu")

    @pytest.mark.skipif(not torch.cuda.is_available(), reason="CUDA not available")
    def test_batch_on_cuda(self):
        """Test batch creation on CUDA (if available)."""
        device = torch.device("cuda")
        genome = make_simple_genome("test")
        batch = creature_genomes_to_batch([genome], device=device)

        assert batch.device == device
        assert batch.positions.device.type == "cuda"


# =============================================================================
# Test: CreatureBatch dataclass
# =============================================================================


class TestCreatureBatch:
    """Tests for CreatureBatch dataclass."""

    def test_to_method_preserves_data(self):
        """Test that to() method preserves all data."""
        genome = make_simple_genome("test", num_nodes=4, num_muscles=3)
        batch = creature_genomes_to_batch([genome])

        # Store original values
        orig_positions = batch.positions.clone()
        orig_node_mask = batch.node_mask.clone()

        # Move to same device
        batch2 = batch.to(torch.device("cpu"))

        # Values should be identical
        assert torch.allclose(batch2.positions, orig_positions)
        assert torch.allclose(batch2.node_mask, orig_node_mask)
        assert batch2.genome_ids == batch.genome_ids

    def test_batch_attributes_complete(self):
        """Test that CreatureBatch has all expected attributes."""
        genome = make_simple_genome("test")
        batch = creature_genomes_to_batch([genome])

        # Node attributes
        assert hasattr(batch, "positions")
        assert hasattr(batch, "velocities")
        assert hasattr(batch, "masses")
        assert hasattr(batch, "sizes")
        assert hasattr(batch, "frictions")
        assert hasattr(batch, "node_mask")
        assert hasattr(batch, "node_counts")

        # Spring attributes
        assert hasattr(batch, "spring_node_a")
        assert hasattr(batch, "spring_node_b")
        assert hasattr(batch, "spring_rest_length")
        assert hasattr(batch, "spring_stiffness")
        assert hasattr(batch, "spring_damping")
        assert hasattr(batch, "spring_frequency")
        assert hasattr(batch, "spring_amplitude")
        assert hasattr(batch, "spring_phase")
        assert hasattr(batch, "spring_mask")
        assert hasattr(batch, "muscle_counts")

        # V1 direction bias
        assert hasattr(batch, "direction_bias")
        assert hasattr(batch, "bias_strength")

        # V2 velocity/distance sensing
        assert hasattr(batch, "velocity_bias")
        assert hasattr(batch, "velocity_strength")
        assert hasattr(batch, "distance_bias")
        assert hasattr(batch, "distance_strength")

        # Global
        assert hasattr(batch, "global_freq_multiplier")
        assert hasattr(batch, "genome_ids")


# =============================================================================
# Test: Mass Calculation
# =============================================================================


class TestMassCalculation:
    """Test that mass is calculated correctly from size."""

    def test_mass_formula_matches_typescript(self):
        """Verify mass formula matches TypeScript: (4/3) * π * radius³ * 10."""
        import math

        genome = {
            "id": "mass-test",
            "nodes": [
                {"id": "n1", "position": {"x": 0, "y": 0, "z": 0}, "size": 1.0, "friction": 0.5},
            ],
            "muscles": [],
        }
        batch = creature_genomes_to_batch([genome])

        # size = 1.0, radius = 0.5
        radius = 1.0 * 0.5
        expected_mass = (4 / 3) * math.pi * (radius ** 3) * 10

        # Allow small floating point difference
        assert abs(batch.masses[0, 0].item() - expected_mass) < 0.01

    def test_different_sizes_different_masses(self):
        """Test that different node sizes produce different masses."""
        genome = {
            "id": "size-test",
            "nodes": [
                {"id": "n1", "position": {"x": 0, "y": 0, "z": 0}, "size": 0.5, "friction": 0.5},
                {"id": "n2", "position": {"x": 1, "y": 0, "z": 0}, "size": 1.0, "friction": 0.5},
            ],
            "muscles": [],
        }
        batch = creature_genomes_to_batch([genome])

        # Larger node should have larger mass
        assert batch.masses[0, 1].item() > batch.masses[0, 0].item()


# =============================================================================
# Run tests
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
