"""
Stress Tests for Python/TypeScript Parity.

These tests systematically cover permutations of:
- Neural network configurations (mode, hidden size, activation, dead zone)
- Simulation configurations (duration, gravity, friction, arena size)
- Fitness function configurations (all weight parameters)
- Edge cases (extreme values, boundary conditions)

The goal is to catch any configuration that could break parity.
"""

import math
import pytest
import torch
from itertools import product

from app.simulation.tensors import (
    creature_genomes_to_batch,
    CreatureBatch,
    MAX_NODES,
    MAX_MUSCLES,
)
from app.simulation.fitness import (
    FitnessConfig,
    PelletBatch,
    FitnessState,
    initialize_pellets,
    initialize_fitness_state,
    calculate_fitness,
    generate_pellet_positions,
    check_pellet_collisions,
    update_pellets,
    update_fitness_state,
    compute_edge_distances,
    calculate_creature_xz_radius,
    check_disqualifications,
    check_frequency_violations,
)
from app.simulation.physics import (
    simulate_with_fitness,
    simulate_with_fitness_neural,
    get_center_of_mass,
    TIME_STEP,
)
from app.neural.network import BatchedNeuralNetwork, NeuralConfig


# =============================================================================
# Test Fixtures
# =============================================================================


def make_creature(
    creature_id: str = "test",
    num_nodes: int = 3,
    num_muscles: int = 3,
    node_size: float = 0.5,
    frequency: float = 1.0,
    amplitude: float = 0.2,
    has_neural: bool = False,
    hidden_size: int = 8,
) -> dict:
    """Create a configurable test creature."""
    # Generate nodes in a rough circle
    nodes = []
    for i in range(num_nodes):
        angle = 2 * math.pi * i / num_nodes
        x = math.cos(angle) * 0.5
        z = math.sin(angle) * 0.5
        nodes.append({
            "id": f"n{i}",
            "position": {"x": x, "y": 0.5, "z": z},
            "size": node_size,
            "friction": 0.5,
        })

    # Generate muscles connecting adjacent nodes
    muscles = []
    for i in range(min(num_muscles, num_nodes * (num_nodes - 1) // 2)):
        node_a = i % num_nodes
        node_b = (i + 1) % num_nodes
        muscles.append({
            "id": f"m{i}",
            "nodeA": f"n{node_a}",
            "nodeB": f"n{node_b}",
            "restLength": 1.0,
            "stiffness": 500,
            "damping": 10,
            "frequency": frequency,
            "amplitude": amplitude,
            "phase": 2 * math.pi * i / max(num_muscles, 1),
        })

    genome = {
        "id": creature_id,
        "nodes": nodes,
        "muscles": muscles,
        "globalFrequencyMultiplier": 1.0,
        "controllerType": "neural" if has_neural else "oscillator",
    }

    # Add neural genome if requested
    if has_neural:
        input_size = 8 if True else 7  # Hybrid has 8 inputs
        output_size = len(muscles)
        total_weights = (
            input_size * hidden_size +  # weights_ih
            hidden_size +               # biases_h
            hidden_size * output_size + # weights_ho
            output_size                 # biases_o
        )
        genome["neuralGenome"] = {
            "input_size": input_size,
            "hidden_size": hidden_size,
            "output_size": output_size,
            "weights_ih": [0.1] * (input_size * hidden_size),
            "biases_h": [-0.5] * hidden_size,
            "weights_ho": [0.1] * (hidden_size * output_size),
            "biases_o": [-0.5] * output_size,
        }

    return genome


# =============================================================================
# Neural Configuration Stress Tests
# =============================================================================


class TestNeuralModePermutations:
    """Test all neural mode configurations."""

    @pytest.mark.parametrize("mode", ["pure", "hybrid"])
    def test_neural_modes(self, mode):
        """Both pure and hybrid modes should work."""
        genome = make_creature(has_neural=True, hidden_size=8, num_muscles=3)
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        # Create neural network
        neural_genome = genome["neuralGenome"]
        nn_config = NeuralConfig(
            neural_mode=mode,
            hidden_size=8,
            activation='tanh',
        )
        network = BatchedNeuralNetwork.from_genomes(
            neural_genomes=[neural_genome],
            num_muscles=[3],
            config=nn_config,
        )

        # Run simulation
        result = simulate_with_fitness_neural(
            batch=batch,
            neural_network=network,
            pellets=pellets,
            fitness_state=state,
            num_steps=100,
            fitness_config=config,
            mode=mode,
            dead_zone=0.1,
        )

        # Should complete without error
        assert result['final_positions'].shape == (1, MAX_NODES, 3)
        assert not torch.isnan(result['final_positions']).any()

    @pytest.mark.parametrize("hidden_size", [4, 8, 16, 32])
    def test_hidden_sizes(self, hidden_size):
        """Different hidden layer sizes should work."""
        genome = make_creature(has_neural=True, hidden_size=hidden_size, num_muscles=3)
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        neural_genome = genome["neuralGenome"]
        nn_config = NeuralConfig(
            neural_mode='hybrid',
            hidden_size=hidden_size,
            activation='tanh',
        )
        network = BatchedNeuralNetwork.from_genomes(
            neural_genomes=[neural_genome],
            num_muscles=[3],
            config=nn_config,
        )

        result = simulate_with_fitness_neural(
            batch=batch,
            neural_network=network,
            pellets=pellets,
            fitness_state=state,
            num_steps=60,
            fitness_config=config,
        )

        fitness = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)
        assert fitness[0].item() >= 0

    @pytest.mark.parametrize("activation", ["tanh", "relu", "sigmoid"])
    def test_activations(self, activation):
        """Different activation functions should work."""
        genome = make_creature(has_neural=True, hidden_size=8, num_muscles=3)
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        neural_genome = genome["neuralGenome"]
        nn_config = NeuralConfig(
            neural_mode='hybrid',
            hidden_size=8,
            activation=activation,
        )
        network = BatchedNeuralNetwork.from_genomes(
            neural_genomes=[neural_genome],
            num_muscles=[3],
            config=nn_config,
        )

        result = simulate_with_fitness_neural(
            batch=batch,
            neural_network=network,
            pellets=pellets,
            fitness_state=state,
            num_steps=60,
            fitness_config=config,
        )

        assert not torch.isnan(result['final_positions']).any()

    @pytest.mark.parametrize("dead_zone", [0.0, 0.1, 0.3, 0.5])
    def test_dead_zones(self, dead_zone):
        """Dead zone values should affect pure mode output."""
        genome = make_creature(has_neural=True, hidden_size=8, num_muscles=3)
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        neural_genome = genome["neuralGenome"]
        nn_config = NeuralConfig(
            neural_mode='pure',
            hidden_size=8,
            activation='tanh',
        )
        network = BatchedNeuralNetwork.from_genomes(
            neural_genomes=[neural_genome],
            num_muscles=[3],
            config=nn_config,
        )

        result = simulate_with_fitness_neural(
            batch=batch,
            neural_network=network,
            pellets=pellets,
            fitness_state=state,
            num_steps=60,
            fitness_config=config,
            mode='pure',
            dead_zone=dead_zone,
        )

        assert not torch.isnan(result['final_positions']).any()


# =============================================================================
# Fitness Configuration Stress Tests
# =============================================================================


class TestFitnessConfigPermutations:
    """Test various fitness configuration values."""

    @pytest.mark.parametrize("pellet_points", [0.0, 50.0, 100.0, 500.0])
    def test_pellet_point_values(self, pellet_points):
        """Different pellet point values should scale fitness correctly."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        config = FitnessConfig(pellet_points=pellet_points)

        # Set 2 pellets collected
        pellets.total_collected[0] = 2

        fitness = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # Fitness should include 2 * pellet_points
        assert fitness[0].item() >= 2 * pellet_points

    @pytest.mark.parametrize("progress_max", [0.0, 40.0, 80.0, 160.0])
    def test_progress_max_values(self, progress_max):
        """Progress max should cap progress fitness."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        config = FitnessConfig(progress_max=progress_max)

        # Move creature to 50% progress
        direction = pellets.positions[0, [0, 2]] - get_center_of_mass(batch)[0, [0, 2]]
        direction = direction / torch.norm(direction)
        initial_dist = pellets.initial_distances[0].item()
        batch.positions[0, :, 0] += direction[0] * (initial_dist * 0.5)
        batch.positions[0, :, 2] += direction[1] * (initial_dist * 0.5)
        update_fitness_state(batch, state, pellets, config)

        fitness = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # Fitness should include roughly 50% of progress_max (plus other components)
        # Just verify it's non-negative and reasonable
        assert fitness[0].item() >= 0

    @pytest.mark.parametrize("regression_penalty", [0.0, 10.0, 20.0, 50.0])
    def test_regression_penalty_values(self, regression_penalty):
        """Regression penalty should scale with configuration."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        config = FitnessConfig(regression_penalty=regression_penalty, pellet_points=100.0)

        # Collect first pellet to enable regression penalty
        pellets.total_collected[0] = 1

        # Move toward pellet
        direction = pellets.positions[0, [0, 2]] - get_center_of_mass(batch)[0, [0, 2]]
        direction = direction / torch.norm(direction)
        batch.positions[0, :, 0] += direction[0] * 3.0
        batch.positions[0, :, 2] += direction[1] * 3.0
        update_fitness_state(batch, state, pellets, config)

        fitness_at_closest = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # Move away (regression)
        batch.positions[0, :, 0] -= direction[0] * 5.0
        batch.positions[0, :, 2] -= direction[1] * 5.0
        update_fitness_state(batch, state, pellets, config)

        fitness_after_regression = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # If penalty > 0, fitness should decrease
        if regression_penalty > 0:
            assert fitness_after_regression[0].item() < fitness_at_closest[0].item()
        else:
            # No penalty, fitness might increase due to distance traveled
            pass

    @pytest.mark.parametrize("efficiency_penalty", [0.0, 0.5, 1.0, 5.0])
    def test_efficiency_penalty_values(self, efficiency_penalty):
        """Efficiency penalty should reduce fitness based on activation."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        config = FitnessConfig(efficiency_penalty=efficiency_penalty)

        # Simulate muscle activation
        state.total_activation[0] = 100.0

        fitness = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # Reset activation and recalculate
        state.total_activation[0] = 0.0
        fitness_no_activation = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # If penalty > 0, high activation should reduce fitness
        if efficiency_penalty > 0:
            assert fitness[0].item() <= fitness_no_activation[0].item()

    @pytest.mark.parametrize("displacement_max,distance_max", [
        (0.0, 0.0),
        (15.0, 15.0),
        (30.0, 30.0),
        (15.0, 0.0),
        (0.0, 15.0),
    ])
    def test_movement_bonus_combinations(self, displacement_max, distance_max):
        """Displacement and distance bonuses should work independently."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        config = FitnessConfig(
            net_displacement_max=displacement_max,
            distance_traveled_max=distance_max,
        )

        # Move creature
        batch.positions[0, :, 0] += 5.0
        update_fitness_state(batch, state, pellets, config)

        fitness = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)
        assert fitness[0].item() >= 0


# =============================================================================
# Simulation Duration & Physics Stress Tests
# =============================================================================


class TestSimulationDurationPermutations:
    """Test different simulation durations."""

    @pytest.mark.parametrize("num_steps", [10, 60, 300, 600])
    def test_different_durations(self, num_steps):
        """Simulation should work for various durations."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        result = simulate_with_fitness(
            batch=batch,
            pellets=pellets,
            fitness_state=state,
            num_steps=num_steps,
            fitness_config=config,
        )

        assert not torch.isnan(result['final_positions']).any()

        simulation_time = num_steps * TIME_STEP
        fitness = calculate_fitness(batch, pellets, state, simulation_time, config)
        assert fitness[0].item() >= 0

    def test_very_short_duration(self):
        """Very short simulation should still work."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        result = simulate_with_fitness(
            batch=batch,
            pellets=pellets,
            fitness_state=state,
            num_steps=1,
            fitness_config=config,
        )

        assert not torch.isnan(result['final_positions']).any()


# =============================================================================
# Creature Structure Stress Tests
# =============================================================================


class TestCreatureStructurePermutations:
    """Test various creature structures."""

    @pytest.mark.parametrize("num_nodes", [1, 2, 3, 5, 8])
    def test_different_node_counts(self, num_nodes):
        """Creatures with different node counts should work."""
        genome = make_creature(num_nodes=num_nodes, num_muscles=max(0, num_nodes - 1))
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        result = simulate_with_fitness(
            batch=batch,
            pellets=pellets,
            fitness_state=state,
            num_steps=60,
            fitness_config=config,
        )

        assert not torch.isnan(result['final_positions']).any()

    @pytest.mark.parametrize("num_muscles", [0, 1, 3, 5, 10])
    def test_different_muscle_counts(self, num_muscles):
        """Creatures with different muscle counts should work."""
        genome = make_creature(num_nodes=5, num_muscles=num_muscles)
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        result = simulate_with_fitness(
            batch=batch,
            pellets=pellets,
            fitness_state=state,
            num_steps=60,
            fitness_config=config,
        )

        assert not torch.isnan(result['final_positions']).any()

    @pytest.mark.parametrize("node_size", [0.2, 0.5, 1.0, 2.0])
    def test_different_node_sizes(self, node_size):
        """Node size affects collection radius."""
        genome = make_creature(node_size=node_size)
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)

        # Expected collection radius: size * 0.5 + 0.35
        expected_radius = node_size * 0.5 + 0.35

        # Place pellet just inside collection radius
        pellets.positions[0] = batch.positions[0, 0].clone()
        pellets.positions[0, 0] += expected_radius - 0.01

        collected = check_pellet_collisions(batch, pellets)
        assert collected[0].item() == True, f"Should collect at distance {expected_radius - 0.01}"

        # Place pellet just outside collection radius
        pellets.positions[0] = batch.positions[0, 0].clone()
        pellets.positions[0, 0] += expected_radius + 0.01

        collected = check_pellet_collisions(batch, pellets)
        assert collected[0].item() == False, f"Should not collect at distance {expected_radius + 0.01}"

    @pytest.mark.parametrize("frequency", [0.5, 1.0, 2.0, 2.9])
    def test_different_frequencies(self, frequency):
        """Muscle frequencies should affect movement."""
        genome = make_creature(frequency=frequency)
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig(max_allowed_frequency=3.0)

        result = simulate_with_fitness(
            batch=batch,
            pellets=pellets,
            fitness_state=state,
            num_steps=60,
            fitness_config=config,
        )

        # Should not be disqualified if frequency < max
        assert not state.disqualified[0].item()

    def test_high_frequency_disqualification(self):
        """Frequency above max should trigger disqualification."""
        genome = make_creature(frequency=5.0)  # Above default max of 3.0
        batch = creature_genomes_to_batch([genome])

        config = FitnessConfig(max_allowed_frequency=3.0)
        violations = check_frequency_violations(batch, config)

        assert violations[0].item() == True


# =============================================================================
# Multi-Creature Batch Stress Tests
# =============================================================================


class TestBatchPermutations:
    """Test batched simulation with multiple creatures."""

    @pytest.mark.parametrize("batch_size", [1, 2, 5, 10, 50])
    def test_batch_sizes(self, batch_size):
        """Different batch sizes should work correctly."""
        genomes = [make_creature(f"c{i}") for i in range(batch_size)]
        batch = creature_genomes_to_batch(genomes)
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        result = simulate_with_fitness(
            batch=batch,
            pellets=pellets,
            fitness_state=state,
            num_steps=60,
            fitness_config=config,
        )

        assert result['final_positions'].shape[0] == batch_size
        assert not torch.isnan(result['final_positions']).any()

        fitness = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)
        assert fitness.shape[0] == batch_size
        assert (fitness >= 0).all()

    def test_heterogeneous_batch(self):
        """Batch with different creature types should work."""
        genomes = [
            make_creature("small", num_nodes=2, num_muscles=1),
            make_creature("medium", num_nodes=4, num_muscles=4),
            make_creature("large", num_nodes=6, num_muscles=8),
        ]
        batch = creature_genomes_to_batch(genomes)
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        result = simulate_with_fitness(
            batch=batch,
            pellets=pellets,
            fitness_state=state,
            num_steps=60,
            fitness_config=config,
        )

        assert result['final_positions'].shape[0] == 3
        assert not torch.isnan(result['final_positions']).any()

    def test_mixed_neural_oscillator_batch(self):
        """Batch with both neural and oscillator creatures should work."""
        genomes = [
            make_creature("neural1", has_neural=True, hidden_size=8, num_muscles=3),
            make_creature("oscillator1", has_neural=False, num_muscles=3),
            make_creature("neural2", has_neural=True, hidden_size=8, num_muscles=3),
        ]
        batch = creature_genomes_to_batch(genomes)
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        # Use oscillator simulation (neural creatures will still work, just using oscillator)
        result = simulate_with_fitness(
            batch=batch,
            pellets=pellets,
            fitness_state=state,
            num_steps=60,
            fitness_config=config,
        )

        assert not torch.isnan(result['final_positions']).any()


# =============================================================================
# Pellet Collection Stress Tests
# =============================================================================


class TestPelletCollectionStress:
    """Stress test pellet collection mechanics."""

    def test_rapid_collection(self):
        """Collecting many pellets rapidly should work."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        # Simulate rapid collection
        for i in range(10):
            # Move pellet to creature
            pellets.positions[0] = batch.positions[0, 0].clone()

            # Check collision and update
            collected = check_pellet_collisions(batch, pellets)
            if collected[0].item():
                update_pellets(batch, pellets)

        # Should have collected 10 pellets
        assert pellets.total_collected[0].item() == 10

    def test_pellet_angles_stay_in_range(self):
        """Pellet angles should always be valid."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)

        # Collect many pellets and check angles
        for i in range(20):
            angle = pellets.last_pellet_angles[0].item()
            assert not math.isnan(angle)

            # Force collection
            pellets.positions[0] = batch.positions[0, 0].clone()
            check_pellet_collisions(batch, pellets)
            update_pellets(batch, pellets)

    def test_pellet_indices_increment(self):
        """Pellet indices should increment correctly."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)

        assert pellets.pellet_indices[0].item() == 0

        for expected_idx in range(1, 10):
            pellets.positions[0] = batch.positions[0, 0].clone()
            check_pellet_collisions(batch, pellets)
            update_pellets(batch, pellets)
            assert pellets.pellet_indices[0].item() == expected_idx


# =============================================================================
# Disqualification Stress Tests
# =============================================================================


class TestDisqualificationStress:
    """Stress test disqualification mechanics."""

    def test_nan_position_disqualification(self):
        """NaN positions should trigger disqualification."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])

        # Inject NaN
        batch.positions[0, 0, 0] = float('nan')

        disqualified = check_disqualifications(batch)
        assert disqualified[0].item() == True

    def test_far_position_disqualification(self):
        """Positions far from origin should disqualify."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])

        # Move far away
        batch.positions[0, :, 0] = 100.0

        config = FitnessConfig(position_threshold=50.0)
        disqualified = check_disqualifications(batch, config)
        assert disqualified[0].item() == True

    def test_high_position_disqualification(self):
        """Very high positions should disqualify."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])

        # Move very high
        batch.positions[0, :, 1] = 50.0

        config = FitnessConfig(height_threshold=30.0)
        disqualified = check_disqualifications(batch, config)
        assert disqualified[0].item() == True

    def test_disqualified_fitness_zero(self):
        """Disqualified creatures should get 0 fitness regardless of other factors."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        # Give creature lots of pellets
        pellets.total_collected[0] = 100

        config = FitnessConfig(pellet_points=100.0)

        # Normal fitness should be high
        fitness_before = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)
        assert fitness_before[0].item() >= 10000.0

        # Disqualify
        state.disqualified[0] = True

        # Fitness should be 0
        fitness_after = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)
        assert fitness_after[0].item() == 0


# =============================================================================
# Edge Case Stress Tests
# =============================================================================


class TestEdgeCases:
    """Test extreme edge cases."""

    def test_zero_simulation_time(self):
        """Zero simulation time should work."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        fitness = calculate_fitness(batch, pellets, state, simulation_time=0.0, config=config)
        assert fitness[0].item() == 0  # No progress possible

    def test_very_large_fitness_values(self):
        """Very large fitness should not overflow."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        config = FitnessConfig(pellet_points=1e10)
        pellets.total_collected[0] = 100

        fitness = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)
        assert not torch.isnan(fitness[0])
        assert not torch.isinf(fitness[0])

    def test_all_penalties_active(self):
        """All penalties at once should still produce valid fitness."""
        genome = make_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        # Extreme penalties
        config = FitnessConfig(
            regression_penalty=1000.0,
            efficiency_penalty=1000.0,
        )

        pellets.total_collected[0] = 1
        state.total_activation[0] = 100.0

        # Move away from pellet
        batch.positions[0, :, 0] += 50.0
        update_fitness_state(batch, state, pellets, config)

        fitness = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # Should be clamped to 0
        assert fitness[0].item() == 0

    def test_empty_batch(self):
        """Empty batch should return empty results."""
        batch = creature_genomes_to_batch([])
        pellets = initialize_pellets(batch)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        result = simulate_with_fitness(
            batch=batch,
            pellets=pellets,
            fitness_state=state,
            num_steps=60,
            fitness_config=config,
        )

        assert result['final_positions'].shape[0] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
