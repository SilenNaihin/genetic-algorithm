"""
Validation tests against TypeScript/Cannon-ES behavior.

These tests use fixture genomes to verify that our PyTorch physics
produces reasonable behavior matching the TypeScript implementation.

Note: Physics won't be identical (different engines), but creatures
should show similar behavior patterns and fitness ranges.
"""

import pytest
import json
import torch
import math
import os
from pathlib import Path

from app.simulation.tensors import creature_genomes_to_batch, get_center_of_mass
from app.simulation.config import SimulationConfig
from app.simulation.physics import (
    simulate,
    simulate_with_pellets,
    simulate_with_neural,
    TIME_STEP,
    GRAVITY,
)
from app.simulation.fitness import (
    FitnessConfig,
    initialize_pellets,
    initialize_fitness_state,
    update_fitness_state,
    calculate_fitness,
    check_disqualifications,
)
from app.neural.network import BatchedNeuralNetwork, NeuralConfig


# =============================================================================
# Load Fixtures
# =============================================================================

FIXTURES_PATH = Path(__file__).parent.parent.parent / "fixtures" / "test_genomes.json"


def load_fixtures():
    """Load test genome fixtures."""
    with open(FIXTURES_PATH) as f:
        return json.load(f)


@pytest.fixture(scope="module")
def fixtures():
    """Pytest fixture for test genomes."""
    return load_fixtures()


def genome_to_tensor_format(genome_data):
    """
    Convert TypeScript genome format to our tensor batch format.

    TypeScript uses:
    - nodes[].position as {x, y, z}
    - muscles[].directionBias as {x, y, z}

    Our tensors expect different field names.
    """
    # Convert nodes
    nodes = []
    for node in genome_data.get("nodes", []):
        pos = node.get("position", {"x": 0, "y": 1, "z": 0})
        nodes.append({
            "id": node.get("id", ""),
            "x": pos.get("x", 0),
            "y": pos.get("y", 1),
            "z": pos.get("z", 0),
            "size": node.get("size", 0.25),
            "friction": node.get("friction", 0.5),
        })

    # Convert muscles
    muscles = []
    for muscle in genome_data.get("muscles", []):
        dir_bias = muscle.get("directionBias", {"x": 0, "y": 0, "z": 0})
        vel_bias = muscle.get("velocityBias", {"x": 0, "y": 0, "z": 0})

        muscles.append({
            "id": muscle.get("id", ""),
            "nodeA": muscle.get("nodeA", ""),
            "nodeB": muscle.get("nodeB", ""),
            "restLength": muscle.get("restLength", 1.0),
            "stiffness": muscle.get("stiffness", 100.0),
            "damping": muscle.get("damping", 1.0),
            "frequency": muscle.get("frequency", 1.0),
            "amplitude": muscle.get("amplitude", 0.3),
            "phase": muscle.get("phase", 0.0),
            "directionBias": dir_bias,
            "biasStrength": muscle.get("biasStrength", 0.0),
            "velocityBias": vel_bias,
            "velocityStrength": muscle.get("velocityStrength", 0.0),
            "distanceBias": muscle.get("distanceBias", 0.0),
            "distanceStrength": muscle.get("distanceStrength", 0.0),
        })

    return {
        "id": genome_data.get("id", "test"),
        "nodes": nodes,
        "muscles": muscles,
        "globalFrequencyMultiplier": genome_data.get("globalFrequencyMultiplier", 1.0),
        "controllerType": genome_data.get("controllerType", "oscillator"),
        "neuralGenome": genome_data.get("neuralGenome"),
    }


# =============================================================================
# Basic Physics Validation
# =============================================================================

class TestBasicPhysics:
    """Test basic physics behavior matches expectations."""

    def test_gravity_pulls_down(self, fixtures):
        """Creatures should fall due to gravity."""
        genome = genome_to_tensor_format(fixtures["genomes"][0]["genome"])  # simple_two_node
        batch = creature_genomes_to_batch([genome])

        initial_y = batch.positions[0, :, 1].clone()

        # Run 60 steps (1 second)
        simulate(batch, num_steps=60)

        final_y = batch.positions[0, :, 1]

        # Nodes should have fallen (y decreased or stayed same if on ground)
        valid_mask = batch.node_mask[0].bool()
        assert torch.all(final_y[valid_mask] <= initial_y[valid_mask] + 0.1)  # Allow small numerical error

    def test_ground_collision_works(self, fixtures):
        """Creatures should not fall through ground (y=0)."""
        genome = genome_to_tensor_format(fixtures["genomes"][0]["genome"])
        batch = creature_genomes_to_batch([genome])

        # Run long simulation
        simulate(batch, num_steps=600)  # 10 seconds

        final_y = batch.positions[0, :, 1]
        valid_mask = batch.node_mask[0].bool()

        # All valid nodes should be above or at ground
        # Account for node radius (size/2)
        sizes = batch.sizes[0]
        min_y = sizes / 2  # Node center should be at least radius above ground

        assert torch.all(final_y[valid_mask] >= min_y[valid_mask] - 0.01)

    def test_spring_forces_work(self, fixtures):
        """Springs should prevent nodes from separating too far."""
        # Use triangle crawler which has properly connected muscles
        genome = genome_to_tensor_format(fixtures["genomes"][1]["genome"])  # triangle_crawler
        batch = creature_genomes_to_batch([genome])

        # Get initial distance between connected nodes
        base_rest_length = batch.spring_rest_length[0, 0].item()

        # Check if this genome has any valid muscles
        if batch.spring_mask[0, 0].item() == 0:
            pytest.skip("No valid muscles in this genome")

        # Run simulation
        pellet_positions = torch.tensor([[5.0, 0.5, 0.0]])
        result = simulate_with_pellets(batch, pellet_positions, num_steps=600)

        # Calculate final distance between nodes
        pos = result['final_positions'][0]
        idx_a = batch.spring_node_a[0, 0].item()
        idx_b = batch.spring_node_b[0, 0].item()
        final_dist = torch.norm(pos[idx_a] - pos[idx_b]).item()

        # Distance should be within reasonable range of rest length (accounting for amplitude)
        # Springs may be quite stretched or compressed during oscillation
        max_expected = base_rest_length * 2.5
        min_expected = base_rest_length * 0.1

        assert min_expected <= final_dist <= max_expected, \
            f"Spring distance {final_dist:.2f} outside range [{min_expected:.2f}, {max_expected:.2f}]"

    def test_oscillation_produces_movement(self, fixtures):
        """Oscillating muscles should cause some movement."""
        # Use triangle crawler which has phased oscillation
        genome = genome_to_tensor_format(fixtures["genomes"][1]["genome"])  # triangle_crawler
        batch = creature_genomes_to_batch([genome])

        initial_com = get_center_of_mass(batch).clone()

        # Run simulation with pellets (activates direction modulation)
        pellet_positions = torch.tensor([[5.0, 0.5, 0.0]])
        result = simulate_with_pellets(batch, pellet_positions, num_steps=600)

        final_com = result["final_com"]

        # Creature should have moved at least a little
        displacement = torch.norm(final_com - initial_com).item()
        assert displacement > 0.01, "Creature should show some movement"


# =============================================================================
# Direction Modulation (v1) Validation
# =============================================================================

class TestDirectionModulation:
    """Test that v1 direction modulation affects behavior."""

    def test_direction_bias_affects_movement(self, fixtures):
        """Creatures with direction bias should respond to pellet direction."""
        genome = genome_to_tensor_format(fixtures["genomes"][3]["genome"])  # direction_biased_tracker
        batch = creature_genomes_to_batch([genome])

        initial_com = get_center_of_mass(batch).clone()

        # Place pellet in +X direction
        pellet_positions = torch.tensor([[5.0, 0.5, 0.0]])
        result = simulate_with_pellets(batch, pellet_positions, num_steps=600)

        final_com = result["final_com"]

        # With strong direction bias toward pellet, creature should move
        displacement = final_com - initial_com
        total_displacement = torch.norm(displacement[0]).item()

        assert total_displacement > 0.05, "Direction-biased creature should move"


# =============================================================================
# Neural Network Integration Validation
# =============================================================================

class TestNeuralNetworkIntegration:
    """Test neural network modes work correctly."""

    def test_hybrid_mode_runs_without_error(self, fixtures):
        """Hybrid neural mode should complete simulation."""
        genome = genome_to_tensor_format(fixtures["genomes"][5]["genome"])  # neural_hybrid_basic
        batch = creature_genomes_to_batch([genome])

        # Create neural network from genome
        neural_genome = genome.get("neuralGenome")
        if neural_genome:
            num_muscles = len(genome["muscles"])
            config = NeuralConfig(neural_mode='hybrid', hidden_size=8)
            network = BatchedNeuralNetwork.from_genomes(
                neural_genomes=[neural_genome],
                num_muscles=[num_muscles],
                config=config,
            )

            pellet_positions = torch.tensor([[5.0, 0.5, 0.0]])

            result = simulate_with_neural(
                batch, network, pellet_positions,
                num_steps=300, mode='hybrid'
            )

            assert 'final_positions' in result
            assert 'total_activation' in result
            assert not torch.any(torch.isnan(result['final_com']))

    def test_pure_mode_runs_without_error(self, fixtures):
        """Pure neural mode should complete simulation."""
        genome = genome_to_tensor_format(fixtures["genomes"][6]["genome"])  # neural_pure_basic
        batch = creature_genomes_to_batch([genome])

        neural_genome = genome.get("neuralGenome")
        if neural_genome:
            num_muscles = len(genome["muscles"])
            config = NeuralConfig(neural_mode='pure', hidden_size=8)
            network = BatchedNeuralNetwork.from_genomes(
                neural_genomes=[neural_genome],
                num_muscles=[num_muscles],
                config=config,
            )

            pellet_positions = torch.tensor([[5.0, 0.5, 0.0]])

            result = simulate_with_neural(
                batch, network, pellet_positions,
                num_steps=300, mode='pure', dead_zone=0.1
            )

            assert 'final_positions' in result
            assert 'total_activation' in result
            assert not torch.any(torch.isnan(result['final_com']))

    def test_neural_mode_tracks_activation(self, fixtures):
        """Neural mode should track muscle activation for efficiency penalty."""
        genome = genome_to_tensor_format(fixtures["genomes"][5]["genome"])
        batch = creature_genomes_to_batch([genome])

        neural_genome = genome.get("neuralGenome")
        if neural_genome:
            num_muscles = len(genome["muscles"])
            config = NeuralConfig(neural_mode='hybrid', hidden_size=8)
            network = BatchedNeuralNetwork.from_genomes(
                neural_genomes=[neural_genome],
                num_muscles=[num_muscles],
                config=config,
            )

            pellet_positions = torch.tensor([[5.0, 0.5, 0.0]])

            result = simulate_with_neural(
                batch, network, pellet_positions,
                num_steps=300, mode='hybrid'
            )

            # Activation should be accumulated
            assert result['total_activation'][0].item() > 0


# =============================================================================
# Edge Cases Validation
# =============================================================================

class TestEdgeCases:
    """Test edge cases are handled correctly."""

    def test_single_node_creature(self, fixtures):
        """Single node creature should fall and stay on ground."""
        genome = genome_to_tensor_format(fixtures["genomes"][7]["genome"])  # edge_case_single_node
        batch = creature_genomes_to_batch([genome])

        # Run simulation
        simulate(batch, num_steps=600)

        # Node should be on ground
        final_y = batch.positions[0, 0, 1].item()
        node_size = batch.sizes[0, 0].item()
        expected_y = node_size / 2  # Center at radius above ground

        assert abs(final_y - expected_y) < 0.1, "Single node should rest on ground"

    def test_stiff_springs_stable(self, fixtures):
        """Very stiff springs should not cause numerical explosion."""
        genome = genome_to_tensor_format(fixtures["genomes"][8]["genome"])  # stiff_spring_test
        batch = creature_genomes_to_batch([genome])

        # Run long simulation
        pellet_positions = torch.tensor([[5.0, 0.5, 0.0]])
        result = simulate_with_pellets(batch, pellet_positions, num_steps=600)

        # Should not have NaN or Inf
        assert not torch.any(torch.isnan(result['final_positions']))
        assert not torch.any(torch.isinf(result['final_positions']))

        # Positions should be reasonable (not exploded)
        max_pos = torch.max(torch.abs(result['final_positions'])).item()
        assert max_pos < 50, "Stiff springs should not cause explosion"

    def test_complex_8_node_creature(self, fixtures):
        """Complex creature with many nodes/muscles should work."""
        genome = genome_to_tensor_format(fixtures["genomes"][4]["genome"])  # complex_8_node
        batch = creature_genomes_to_batch([genome])

        pellet_positions = torch.tensor([[5.0, 0.5, 0.0]])
        result = simulate_with_pellets(batch, pellet_positions, num_steps=600)

        assert not torch.any(torch.isnan(result['final_positions']))
        assert not torch.any(torch.isinf(result['final_positions']))


# =============================================================================
# Fitness Calculation Validation
# =============================================================================

class TestFitnessCalculation:
    """Test fitness calculation produces reasonable values."""

    def test_moving_creature_gets_fitness(self, fixtures):
        """A creature that moves should get some fitness."""
        genome = genome_to_tensor_format(fixtures["genomes"][1]["genome"])  # triangle_crawler
        batch = creature_genomes_to_batch([genome])

        # Initialize pellets and fitness state
        fitness_config = FitnessConfig()
        pellet_batch = initialize_pellets(batch)
        fitness_state = initialize_fitness_state(batch)

        # Run simulation
        pellet_positions = pellet_batch.positions[:, 0]  # First pellet
        result = simulate_with_pellets(batch, pellet_positions, num_steps=600)

        # Update batch positions to final state for fitness calculation
        batch.positions = result['final_positions']

        # Update fitness state (modifies in-place)
        update_fitness_state(batch, fitness_state, fitness_config)

        # Calculate fitness with proper arguments
        simulation_time = 600 * TIME_STEP  # 10 seconds
        fitness = calculate_fitness(batch, pellet_batch, fitness_state, simulation_time, fitness_config)

        # Should have some positive fitness (at least from displacement)
        assert fitness[0].item() >= 0

    def test_stationary_creature_gets_minimal_fitness(self, fixtures):
        """A creature that doesn't move much should get minimal fitness."""
        genome = genome_to_tensor_format(fixtures["genomes"][7]["genome"])  # single_node
        batch = creature_genomes_to_batch([genome])

        pellet_positions = torch.tensor([[5.0, 0.5, 0.0]])
        result = simulate_with_pellets(batch, pellet_positions, num_steps=600)

        # Single node shouldn't move much
        initial_com = torch.tensor([[0.0, 2.0, 0.0]])
        displacement = torch.norm(result['final_com'] - initial_com, dim=1)

        # Displacement should be minimal (just falling to ground)
        assert displacement[0].item() < 3.0


# =============================================================================
# Batching Validation
# =============================================================================

class TestBatching:
    """Test that batching produces same results as individual simulation."""

    def test_batch_same_as_individual(self, fixtures):
        """Running multiple creatures in batch should match individual runs."""
        # Get two different genomes
        genome1 = genome_to_tensor_format(fixtures["genomes"][0]["genome"])
        genome2 = genome_to_tensor_format(fixtures["genomes"][1]["genome"])

        # Run individually
        batch1 = creature_genomes_to_batch([genome1])
        batch2 = creature_genomes_to_batch([genome2])

        pellet_positions = torch.tensor([[5.0, 0.5, 0.0]])

        result1 = simulate_with_pellets(batch1, pellet_positions, num_steps=300)
        result2 = simulate_with_pellets(batch2, pellet_positions, num_steps=300)

        # Run as batch
        batch_combined = creature_genomes_to_batch([genome1, genome2])
        pellet_positions_batch = torch.tensor([[5.0, 0.5, 0.0], [5.0, 0.5, 0.0]])

        result_batch = simulate_with_pellets(batch_combined, pellet_positions_batch, num_steps=300)

        # Results should be similar (not exactly equal due to batching order, but close)
        com1_individual = result1['final_com'][0]
        com1_batch = result_batch['final_com'][0]

        # Allow some tolerance for numerical differences
        assert torch.allclose(com1_individual, com1_batch, atol=0.1)


# =============================================================================
# Performance Validation
# =============================================================================

class TestPerformance:
    """Test that simulation performance meets targets."""

    def test_100_creatures_under_1_second(self, fixtures):
        """Simulating 100 creatures should take less than 1 second."""
        import time

        genome = genome_to_tensor_format(fixtures["genomes"][1]["genome"])
        genomes = [genome] * 100

        batch = creature_genomes_to_batch(genomes)
        pellet_positions = torch.randn(100, 3) * 5

        start = time.time()
        result = simulate_with_pellets(batch, pellet_positions, num_steps=600)
        elapsed = time.time() - start

        assert elapsed < 1.0, f"100 creatures took {elapsed:.2f}s, should be < 1s"

    def test_500_creatures_under_5_seconds(self, fixtures):
        """Simulating 500 creatures should take less than 5 seconds."""
        import time

        genome = genome_to_tensor_format(fixtures["genomes"][1]["genome"])
        genomes = [genome] * 500

        batch = creature_genomes_to_batch(genomes)
        pellet_positions = torch.randn(500, 3) * 5

        start = time.time()
        result = simulate_with_pellets(batch, pellet_positions, num_steps=600)
        elapsed = time.time() - start

        assert elapsed < 5.0, f"500 creatures took {elapsed:.2f}s, should be < 5s"


# =============================================================================
# Run All Fixtures
# =============================================================================

class TestAllFixtures:
    """Run basic validation on all fixture genomes."""

    def test_all_genomes_simulate_without_nan(self, fixtures):
        """All fixture genomes should simulate without NaN."""
        for fixture in fixtures["genomes"]:
            genome = genome_to_tensor_format(fixture["genome"])
            batch = creature_genomes_to_batch([genome])

            pellet_positions = torch.tensor([[5.0, 0.5, 0.0]])
            result = simulate_with_pellets(batch, pellet_positions, num_steps=300)

            assert not torch.any(torch.isnan(result['final_positions'])), \
                f"Genome {fixture['name']} produced NaN"
            assert not torch.any(torch.isinf(result['final_positions'])), \
                f"Genome {fixture['name']} produced Inf"

    def test_all_genomes_stay_bounded(self, fixtures):
        """All fixture genomes should stay within reasonable bounds."""
        for fixture in fixtures["genomes"]:
            genome = genome_to_tensor_format(fixture["genome"])
            batch = creature_genomes_to_batch([genome])

            pellet_positions = torch.tensor([[5.0, 0.5, 0.0]])
            result = simulate_with_pellets(batch, pellet_positions, num_steps=600)

            max_pos = torch.max(torch.abs(result['final_positions'])).item()
            assert max_pos < 50, f"Genome {fixture['name']} exploded to position {max_pos}"


# =============================================================================
# Physics Constants Parity
# =============================================================================

class TestPhysicsConstantsParity:
    """Verify physics constants match TypeScript implementation."""

    def test_gravity_matches_typescript(self):
        """Gravity should match TypeScript DEFAULT_CONFIG (-9.8)."""
        from app.simulation.physics import GRAVITY
        from app.simulation.config import DEFAULT_CONFIG

        # TypeScript: gravity: -9.8
        assert GRAVITY == -9.8, f"GRAVITY constant should be -9.8, got {GRAVITY}"
        assert DEFAULT_CONFIG.gravity == -9.8, f"Config gravity should be -9.8, got {DEFAULT_CONFIG.gravity}"

    def test_timestep_matches_typescript(self):
        """Time step should match TypeScript DEFAULT_CONFIG (1/60)."""
        from app.simulation.physics import TIME_STEP
        from app.simulation.config import DEFAULT_CONFIG

        # TypeScript: timeStep: 1/60
        expected_timestep = 1.0 / 60.0
        assert abs(TIME_STEP - expected_timestep) < 1e-10
        assert abs(DEFAULT_CONFIG.time_step - expected_timestep) < 1e-10

    def test_linear_damping_matches_typescript(self):
        """Linear damping should match TypeScript BodyFactory (0.1)."""
        from app.simulation.physics import LINEAR_DAMPING

        # TypeScript BodyFactory: linearDamping: 0.1
        assert LINEAR_DAMPING == 0.1

    def test_ground_restitution_matches_typescript(self):
        """Ground restitution should match TypeScript BodyFactory (0.2)."""
        from app.simulation.physics import GROUND_RESTITUTION

        # TypeScript BodyFactory contactMaterial: restitution: 0.2
        assert GROUND_RESTITUTION == 0.2

    def test_mass_calculation_matches_typescript(self, fixtures):
        """Mass calculation should match TypeScript formula: (4/3)*π*r³*10."""
        genome = genome_to_tensor_format(fixtures["genomes"][0]["genome"])
        batch = creature_genomes_to_batch([genome])

        # Get first node's size and calculated mass
        node_size = batch.sizes[0, 0].item()
        calculated_mass = batch.masses[0, 0].item()

        # TypeScript: mass = (4/3) * PI * r^3 * 10 (BodyFactory.ts line 42)
        radius = node_size * 0.5
        expected_mass = (4.0 / 3.0) * math.pi * (radius ** 3) * 10

        assert abs(calculated_mass - expected_mass) < 0.01, \
            f"Mass calculation mismatch: got {calculated_mass}, expected {expected_mass}"

    def test_oscillation_formula_matches_typescript(self):
        """Oscillation formula should match TypeScript."""
        from app.simulation.physics import compute_oscillating_rest_lengths

        # Test with known values
        base_rest = torch.tensor([[1.0]])
        frequency = torch.tensor([[1.0]])
        amplitude = torch.tensor([[0.3]])
        phase = torch.tensor([[0.0]])
        global_freq = torch.tensor([1.0])

        # At time=0, sin(0) = 0, so rest_length = base * (1 - 0) = base
        result_t0 = compute_oscillating_rest_lengths(
            base_rest, frequency, amplitude, phase, global_freq, time=0.0
        )
        assert abs(result_t0[0, 0].item() - 1.0) < 0.01

        # At time=0.25 (quarter period), sin(2π * 0.25) = 1, so rest_length = base * (1 - amplitude)
        result_t025 = compute_oscillating_rest_lengths(
            base_rest, frequency, amplitude, phase, global_freq, time=0.25
        )
        expected_025 = 1.0 * (1.0 - 0.3)  # 0.7
        assert abs(result_t025[0, 0].item() - expected_025) < 0.01

    def test_fitness_config_matches_typescript(self):
        """Fitness config defaults should match TypeScript DEFAULT_CONFIG."""
        from app.simulation.config import DEFAULT_CONFIG

        # TypeScript fitness defaults (from simulation.ts)
        assert DEFAULT_CONFIG.fitness_pellet_points == 100.0
        assert DEFAULT_CONFIG.fitness_progress_max == 80.0
        assert DEFAULT_CONFIG.fitness_net_displacement_max == 15.0
        assert DEFAULT_CONFIG.fitness_distance_per_unit == 3.0
        assert DEFAULT_CONFIG.fitness_distance_traveled_max == 15.0
        assert DEFAULT_CONFIG.fitness_regression_penalty == 20.0

    def test_neural_config_matches_typescript(self):
        """Neural network config defaults should match TypeScript DEFAULT_CONFIG."""
        from app.simulation.config import DEFAULT_CONFIG

        # TypeScript neural defaults (from simulation.ts)
        assert DEFAULT_CONFIG.use_neural_net == True
        assert DEFAULT_CONFIG.neural_mode == 'hybrid'
        assert DEFAULT_CONFIG.neural_hidden_size == 8
        assert DEFAULT_CONFIG.neural_activation == 'tanh'
        assert DEFAULT_CONFIG.weight_mutation_rate == 0.1
        assert DEFAULT_CONFIG.weight_mutation_magnitude == 0.3
        assert DEFAULT_CONFIG.neural_output_bias == -0.5
        assert DEFAULT_CONFIG.fitness_efficiency_penalty == 0.5
        assert DEFAULT_CONFIG.neural_dead_zone == 0.1
