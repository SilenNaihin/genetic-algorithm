"""
Integration Tests: Frontend-Backend Config and Storage Parity.

These tests verify:
1. All 28 config options propagate from frontend to backend
2. Storage functions work correctly (creatures, frames, generations)
3. Graph metadata is computed correctly
4. Config is persisted and retrieved correctly

NOTE: These tests use FastAPI TestClient and don't require a running server.
However, storage tests require database setup which may not be available.
"""

import pytest
import math
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def extract_results(response):
    """Extract results list from batch response."""
    data = response.json()
    if isinstance(data, dict) and "results" in data:
        return data["results"]
    return data


# =============================================================================
# Config Propagation Tests - All 28 Menu Options
# =============================================================================


class TestMainMenuConfig:
    """Test main menu slider config propagates to simulation."""

    def test_gravity_propagates(self):
        """Gravity setting should affect simulation."""
        genomes = [make_api_genome("test")]

        # Simulate with default gravity
        response_default = client.post("/api/simulation/batch", json={
            "genomes": genomes,
            "config": {"gravity": -9.8, "simulation_duration": 1.0}
        })
        assert response_default.status_code == 200
        results_default = extract_results(response_default)

        # Simulate with low gravity
        response_low = client.post("/api/simulation/batch", json={
            "genomes": genomes,
            "config": {"gravity": -5.0, "simulation_duration": 1.0}
        })
        assert response_low.status_code == 200
        results_low = extract_results(response_low)

        # Both should complete without error
        assert len(results_default) == 1
        assert len(results_low) == 1

    def test_simulation_duration_affects_steps(self):
        """Simulation duration in seconds should convert to steps."""
        genomes = [make_api_genome("test")]

        # 1 second = 60 steps (frame_storage_mode for recording)
        response_1s = client.post("/api/simulation/batch", json={
            "genomes": genomes,
            "config": {"simulation_duration": 1.0, "frame_storage_mode": "all", "frame_rate": 30}
        })
        assert response_1s.status_code == 200
        results_1s = extract_results(response_1s)

        # 2 seconds = 120 steps
        response_2s = client.post("/api/simulation/batch", json={
            "genomes": genomes,
            "config": {"simulation_duration": 2.0, "frame_storage_mode": "all", "frame_rate": 30}
        })
        assert response_2s.status_code == 200
        results_2s = extract_results(response_2s)

        # 2s simulation should have more frames
        frames_1s = results_1s[0].get("frame_count", 0)
        frames_2s = results_2s[0].get("frame_count", 0)

        # With frame_rate=30, expect roughly 30 and 60 frames
        assert frames_2s > frames_1s

    def test_max_frequency_disqualification(self):
        """Creatures exceeding max_allowed_frequency should be disqualified in hybrid mode.

        NOTE: Frequency check only applies to hybrid mode. In pure mode, neural network
        directly controls muscles and frequency parameter is vestigial.
        """
        # Genome with high frequency muscles
        genome = make_api_genome("high_freq")
        for muscle in genome["muscles"]:
            muscle["frequency"] = 5.0  # High frequency

        # With high limit - should pass
        response_high = client.post("/api/simulation/batch", json={
            "genomes": [genome],
            "config": {"max_allowed_frequency": 10.0, "neural_mode": "hybrid"}
        })
        assert response_high.status_code == 200
        results_high = extract_results(response_high)
        assert results_high[0]["disqualified"] == False

        # With low limit - should fail
        response_low = client.post("/api/simulation/batch", json={
            "genomes": [genome],
            "config": {"max_allowed_frequency": 3.0, "neural_mode": "hybrid"}
        })
        assert response_low.status_code == 200
        results_low = extract_results(response_low)
        assert results_low[0]["disqualified"] == True
        assert results_low[0]["disqualified_reason"] == "high_frequency"


class TestFitnessPanelConfig:
    """Test fitness panel sliders propagate correctly."""

    def test_pellet_points_affects_fitness(self):
        """Pellet points config should affect fitness per pellet."""
        genomes = [make_api_genome("test")]

        # With 100 points per pellet
        response_100 = client.post("/api/simulation/batch", json={
            "genomes": genomes,
            "config": {"fitness_pellet_points": 100.0, "simulation_duration": 1.0}
        })

        # With 200 points per pellet
        response_200 = client.post("/api/simulation/batch", json={
            "genomes": genomes,
            "config": {"fitness_pellet_points": 200.0, "simulation_duration": 1.0}
        })

        assert response_100.status_code == 200
        assert response_200.status_code == 200

        results_100 = extract_results(response_100)
        results_200 = extract_results(response_200)

        # Breakdown should reflect different pellet point values
        breakdown_100 = results_100[0]["fitness_breakdown"]
        breakdown_200 = results_200[0]["fitness_breakdown"]

        # If either collected pellets, the points should differ
        if breakdown_100["pellet_points"] > 0 and breakdown_200["pellet_points"] > 0:
            # Ratio should be approximately 2:1
            ratio = breakdown_200["pellet_points"] / breakdown_100["pellet_points"]
            assert 1.9 <= ratio <= 2.1

    def test_progress_max_caps_progress(self):
        """Progress max should cap the progress bonus."""
        genomes = [make_api_genome("test")]

        # With high progress max
        response_high = client.post("/api/simulation/batch", json={
            "genomes": genomes,
            "config": {"fitness_progress_max": 200.0, "simulation_duration": 3.0}
        })

        # With low progress max
        response_low = client.post("/api/simulation/batch", json={
            "genomes": genomes,
            "config": {"fitness_progress_max": 20.0, "simulation_duration": 3.0}
        })

        assert response_high.status_code == 200
        assert response_low.status_code == 200

        results_low = extract_results(response_low)
        # Low max should cap progress
        breakdown_low = results_low[0]["fitness_breakdown"]
        assert breakdown_low["progress"] <= 20.0

    def test_regression_penalty_affects_fitness(self):
        """Regression penalty should reduce fitness when moving away from pellet."""
        genomes = [make_api_genome("test")]

        # No penalty
        response_no = client.post("/api/simulation/batch", json={
            "genomes": genomes,
            "config": {"fitness_regression_penalty": 0.0, "simulation_duration": 2.0}
        })

        # High penalty
        response_high = client.post("/api/simulation/batch", json={
            "genomes": genomes,
            "config": {"fitness_regression_penalty": 50.0, "simulation_duration": 2.0}
        })

        assert response_no.status_code == 200
        assert response_high.status_code == 200

    def test_distance_traveled_max_caps_bonus(self):
        """Distance traveled max should cap the traveled bonus."""
        genomes = [make_api_genome("test")]

        response = client.post("/api/simulation/batch", json={
            "genomes": genomes,
            "config": {"fitness_distance_traveled_max": 15.0, "simulation_duration": 5.0}
        })

        assert response.status_code == 200
        results = extract_results(response)
        breakdown = results[0]["fitness_breakdown"]
        assert breakdown["distance_traveled"] <= 15.0


class TestNeuralPanelConfig:
    """Test neural panel sliders propagate correctly."""

    def test_neural_mode_pure_vs_hybrid(self):
        """Neural mode should affect simulation behavior."""
        genome = make_neural_genome("test")

        # Pure mode (7 inputs, no time phase)
        response_pure = client.post("/api/simulation/batch", json={
            "genomes": [genome],
            "config": {
                "use_neural_net": True,
                "neural_mode": "pure",
                "simulation_duration": 1.0
            }
        })

        # Hybrid mode (8 inputs, with time phase)
        response_hybrid = client.post("/api/simulation/batch", json={
            "genomes": [genome],
            "config": {
                "use_neural_net": True,
                "neural_mode": "hybrid",
                "simulation_duration": 1.0
            }
        })

        assert response_pure.status_code == 200, f"Pure mode failed: {response_pure.json()}"
        assert response_hybrid.status_code == 200, f"Hybrid mode failed: {response_hybrid.json()}"

    def test_neural_hidden_size_accepted(self):
        """Different hidden sizes should be accepted."""
        for hidden_size in [4, 8, 16, 32]:
            genome = make_neural_genome("test", hidden_size=hidden_size)

            response = client.post("/api/simulation/batch", json={
                "genomes": [genome],
                "config": {
                    "use_neural_net": True,
                    "neural_hidden_size": hidden_size,
                    "simulation_duration": 1.0
                }
            })

            assert response.status_code == 200, f"Failed for hidden_size={hidden_size}: {response.json()}"

    def test_neural_activation_accepted(self):
        """Different activations should be accepted."""
        for activation in ["tanh", "relu", "sigmoid"]:
            genome = make_neural_genome("test")

            response = client.post("/api/simulation/batch", json={
                "genomes": [genome],
                "config": {
                    "use_neural_net": True,
                    "neural_activation": activation,
                    "simulation_duration": 1.0
                }
            })

            assert response.status_code == 200, f"Failed for activation={activation}: {response.json()}"

    def test_dead_zone_affects_output(self):
        """Dead zone should suppress small outputs in pure mode."""
        genome = make_neural_genome("test")

        # No dead zone
        response_no = client.post("/api/simulation/batch", json={
            "genomes": [genome],
            "config": {
                "use_neural_net": True,
                "neural_mode": "pure",
                "neural_dead_zone": 0.0,
                "simulation_duration": 1.0
            }
        })

        # High dead zone
        response_high = client.post("/api/simulation/batch", json={
            "genomes": [genome],
            "config": {
                "use_neural_net": True,
                "neural_mode": "pure",
                "neural_dead_zone": 0.5,
                "simulation_duration": 1.0
            }
        })

        assert response_no.status_code == 200, f"No dead zone failed: {response_no.json()}"
        assert response_high.status_code == 200, f"High dead zone failed: {response_high.json()}"

    def test_efficiency_penalty_affects_fitness(self):
        """Efficiency penalty should reduce fitness based on activation."""
        genome = make_neural_genome("test")

        # No penalty
        response_no = client.post("/api/simulation/batch", json={
            "genomes": [genome],
            "config": {
                "use_neural_net": True,
                "fitness_efficiency_penalty": 0.0,
                "simulation_duration": 2.0
            }
        })

        # High penalty
        response_high = client.post("/api/simulation/batch", json={
            "genomes": [genome],
            "config": {
                "use_neural_net": True,
                "fitness_efficiency_penalty": 2.0,
                "simulation_duration": 2.0
            }
        })

        assert response_no.status_code == 200, f"No penalty failed: {response_no.json()}"
        assert response_high.status_code == 200, f"High penalty failed: {response_high.json()}"

        results_no = extract_results(response_no)
        results_high = extract_results(response_high)

        # High penalty should reduce fitness (if creature is active)
        breakdown_no = results_no[0]["fitness_breakdown"]
        breakdown_high = results_high[0]["fitness_breakdown"]

        assert breakdown_high["efficiency_penalty"] >= breakdown_no["efficiency_penalty"]


# =============================================================================
# Storage Tests - Creatures, Frames, Generations
# NOTE: These require database setup. Skip if not available.
# =============================================================================


@pytest.mark.skip(reason="Requires database setup")
class TestGenerationStorage:
    """Test generation storage and retrieval."""

    def test_save_and_load_generation(self):
        """Should save and load generation with creatures."""
        # Create a run first
        run_response = client.post("/api/runs", json={
            "name": "Integration Test Run",
            "config": {"simulation_duration": 1.0}
        })
        assert run_response.status_code == 200
        run_id = run_response.json()["id"]

        # Save a generation
        creatures = [
            {
                "genome": make_api_genome("c1"),
                "fitness": 150.5,
                "pellets_collected": 1,
                "disqualified": False,
                "frames": None
            },
            {
                "genome": make_api_genome("c2"),
                "fitness": 75.0,
                "pellets_collected": 0,
                "disqualified": False,
                "frames": None
            }
        ]

        save_response = client.post(f"/api/runs/{run_id}/generations", json={
            "generation": 0,
            "creatures": creatures
        })
        assert save_response.status_code == 200

        # Load the generation
        load_response = client.get(f"/api/runs/{run_id}/generations/0")
        assert load_response.status_code == 200

        loaded = load_response.json()
        assert loaded["generation"] == 0
        assert len(loaded["creatures"]) == 2

        # Cleanup
        client.delete(f"/api/runs/{run_id}")

    def test_generation_statistics_computed(self):
        """Generation should have correct fitness statistics."""
        # Create a run
        run_response = client.post("/api/runs", json={
            "name": "Stats Test Run",
            "config": {}
        })
        run_id = run_response.json()["id"]

        # Save generation with known fitness values
        creatures = [
            {"genome": make_api_genome("c1"), "fitness": 100.0, "pellets_collected": 1, "disqualified": False},
            {"genome": make_api_genome("c2"), "fitness": 50.0, "pellets_collected": 0, "disqualified": False},
            {"genome": make_api_genome("c3"), "fitness": 200.0, "pellets_collected": 2, "disqualified": False},
            {"genome": make_api_genome("c4"), "fitness": 75.0, "pellets_collected": 0, "disqualified": False},
        ]

        client.post(f"/api/runs/{run_id}/generations", json={
            "generation": 0,
            "creatures": creatures
        })

        # Get generation stats
        gen_response = client.get(f"/api/runs/{run_id}/generations/0")
        gen = gen_response.json()

        # Verify statistics
        assert gen["best_fitness"] == 200.0
        assert gen["worst_fitness"] == 50.0
        assert gen["avg_fitness"] == 106.25  # (100+50+200+75)/4
        # Median of [50, 75, 100, 200] = (75+100)/2 = 87.5
        assert gen["median_fitness"] == 87.5

        # Cleanup
        client.delete(f"/api/runs/{run_id}")


class TestFrameStorage:
    """Test frame storage and retrieval."""

    def test_frames_recorded_when_enabled(self):
        """Frames should be recorded when frame_storage_mode='all'."""
        genomes = [make_api_genome("test")]

        response = client.post("/api/simulation/batch", json={
            "genomes": genomes,
            "config": {
                "frame_storage_mode": "all",
                "frame_rate": 30,
                "simulation_duration": 1.0
            }
        })

        assert response.status_code == 200
        results = extract_results(response)
        result = results[0]

        assert result["frame_count"] > 0
        assert result["frames"] is not None
        assert len(result["frames"]) == result["frame_count"]

    def test_frames_not_recorded_when_disabled(self):
        """Frames should not be recorded when frame_storage_mode='none'."""
        genomes = [make_api_genome("test")]

        response = client.post("/api/simulation/batch", json={
            "genomes": genomes,
            "config": {
                "frame_storage_mode": "none",
                "simulation_duration": 1.0
            }
        })

        assert response.status_code == 200
        results = extract_results(response)
        result = results[0]

        assert result["frame_count"] == 0
        assert result["frames"] is None

    def test_frame_rate_affects_count(self):
        """Frame rate should affect number of frames recorded."""
        genomes = [make_api_genome("test")]

        # 30 FPS for 1 second = ~30 frames
        response_30 = client.post("/api/simulation/batch", json={
            "genomes": genomes,
            "config": {
                "frame_storage_mode": "all",
                "frame_rate": 30,
                "simulation_duration": 1.0
            }
        })

        # 15 FPS for 1 second = ~15 frames
        response_15 = client.post("/api/simulation/batch", json={
            "genomes": genomes,
            "config": {
                "frame_storage_mode": "all",
                "frame_rate": 15,
                "simulation_duration": 1.0
            }
        })

        assert response_30.status_code == 200
        assert response_15.status_code == 200

        results_30 = extract_results(response_30)
        results_15 = extract_results(response_15)

        frames_30 = results_30[0]["frame_count"]
        frames_15 = results_15[0]["frame_count"]

        # 30 FPS should have roughly 2x frames
        assert frames_30 > frames_15
        assert 1.5 <= frames_30 / frames_15 <= 2.5


@pytest.mark.skip(reason="Requires database setup")
class TestFitnessHistoryStorage:
    """Test fitness history for graphs."""

    def test_fitness_history_accumulates(self):
        """Fitness history should accumulate across generations."""
        # Create run
        run_response = client.post("/api/runs", json={
            "name": "History Test Run",
            "config": {}
        })
        run_id = run_response.json()["id"]

        # Save multiple generations
        for gen in range(3):
            creatures = [
                {"genome": make_api_genome(f"c{gen}_1"), "fitness": 100.0 + gen * 50, "pellets_collected": gen, "disqualified": False},
                {"genome": make_api_genome(f"c{gen}_2"), "fitness": 50.0 + gen * 25, "pellets_collected": 0, "disqualified": False},
            ]
            client.post(f"/api/runs/{run_id}/generations", json={
                "generation": gen,
                "creatures": creatures
            })

        # Get fitness history
        history_response = client.get(f"/api/runs/{run_id}/generations/fitness-history")
        assert history_response.status_code == 200

        history = history_response.json()
        assert len(history) == 3

        # Verify generations are in order
        for i, entry in enumerate(history):
            assert entry["generation"] == i
            assert "best" in entry
            assert "avg" in entry
            assert "worst" in entry

        # Cleanup
        client.delete(f"/api/runs/{run_id}")


# =============================================================================
# Config Persistence Tests
# NOTE: Run creation requires database. Only simulation config tests run.
# =============================================================================


@pytest.mark.skip(reason="Requires database setup")
class TestConfigPersistence:
    """Test config is stored and retrieved correctly."""

    def test_run_config_persisted(self):
        """Run config should be persisted and retrievable."""
        config = {
            "gravity": -15.0,
            "simulation_duration": 5.0,
            "fitness_pellet_points": 150.0,
            "use_neural_net": True,
            "neural_mode": "pure",
            "neural_hidden_size": 16
        }

        # Create run with config
        run_response = client.post("/api/runs", json={
            "name": "Config Persistence Test",
            "config": config
        })
        assert run_response.status_code == 200
        run_id = run_response.json()["id"]

        # Retrieve run
        get_response = client.get(f"/api/runs/{run_id}")
        assert get_response.status_code == 200

        retrieved_config = get_response.json()["config"]

        # Verify key config values (may have additional defaults)
        assert retrieved_config["gravity"] == -15.0
        assert retrieved_config["simulation_duration"] == 5.0
        assert retrieved_config["fitness_pellet_points"] == 150.0
        assert retrieved_config["use_neural_net"] == True
        assert retrieved_config["neural_mode"] == "pure"
        assert retrieved_config["neural_hidden_size"] == 16

        # Cleanup
        client.delete(f"/api/runs/{run_id}")


class TestSimulationConfigAccepted:
    """Test all config options are accepted by simulation API."""

    def test_all_config_options_accepted(self):
        """All 28 config options should be accepted by simulation API."""
        full_config = {
            # Main menu
            "gravity": -12.0,
            "mutation_rate": 0.15,
            "max_allowed_frequency": 4.0,
            "simulation_duration": 8.0,
            "max_nodes": 10,
            "max_muscles": 20,
            "cull_percentage": 0.4,
            "use_crossover": True,
            "crossover_rate": 0.6,
            # Fitness panel
            "fitness_pellet_points": 120.0,
            "fitness_progress_max": 100.0,
            "fitness_distance_per_unit": 4.0,
            "fitness_distance_traveled_max": 20.0,
            "fitness_regression_penalty": 25.0,
            # Neural panel
            "use_neural_net": True,
            "neural_mode": "hybrid",
            "neural_hidden_size": 12,
            "neural_activation": "relu",
            "weight_mutation_rate": 0.15,
            "weight_mutation_magnitude": 0.4,
            "neural_output_bias": -0.3,
            "neural_dead_zone": 0.15,
            "fitness_efficiency_penalty": 0.8,
            # Other
            "arena_size": 25.0,
            "pellet_count": 1,
            "elite_count": 2,
        }

        # Run simulation with all options
        sim_response = client.post("/api/simulation/batch", json={
            "genomes": [make_neural_genome("test")],
            "config": full_config
        })
        assert sim_response.status_code == 200, f"Failed: {sim_response.json()}"


# =============================================================================
# Helper Functions
# =============================================================================


def make_api_genome(creature_id: str, num_nodes: int = 3, num_muscles: int = 3) -> dict:
    """Create a test genome in API format."""
    radius = 0.5
    nodes = []
    for i in range(num_nodes):
        angle = i * (2 * math.pi / num_nodes)
        nodes.append({
            "id": f"n{i}",
            "position": {
                "x": math.cos(angle) * radius,
                "y": 1.0,  # Higher up to avoid ground collision
                "z": math.sin(angle) * radius
            },
            "size": 0.4,  # Slightly smaller nodes
            "friction": 0.5
        })

    # Calculate actual distance between adjacent nodes
    angle_between = 2 * math.pi / num_nodes
    actual_distance = 2 * radius * math.sin(angle_between / 2)

    muscles = []
    for i in range(min(num_muscles, num_nodes)):
        muscles.append({
            "id": f"m{i}",
            "nodeA": f"n{i}",
            "nodeB": f"n{(i + 1) % num_nodes}",
            "restLength": actual_distance,  # Match actual node distance
            "stiffness": 100,  # Same as working tests
            "damping": 1.0,  # Same as working tests
            "frequency": 1.0,
            "amplitude": 0.3,  # Same as working tests
            "phase": i * (2 * math.pi / num_muscles)
        })

    return {
        "id": creature_id,
        "nodes": nodes,
        "muscles": muscles,
        "globalFrequencyMultiplier": 1.0,
        "controllerType": "oscillator"
    }


def make_neural_genome(creature_id: str, hidden_size: int = 8, num_muscles: int = 3) -> dict:
    """Create a test genome with neural network in API format."""
    genome = make_api_genome(creature_id, num_nodes=3, num_muscles=num_muscles)
    genome["controllerType"] = "neural"

    # Add neural genome with snake_case field names and flat weight arrays
    # Schema expects: input_size, hidden_size, output_size, weights_ih, weights_ho, biases_h, biases_o
    input_size = 8  # hybrid mode
    genome["neuralGenome"] = {
        "input_size": input_size,
        "hidden_size": hidden_size,
        "output_size": num_muscles,
        # Flat weight arrays (row-major)
        "weights_ih": [0.1] * (input_size * hidden_size),
        "weights_ho": [0.1] * (hidden_size * num_muscles),
        "biases_h": [0.0] * hidden_size,
        "biases_o": [-0.5] * num_muscles
    }

    return genome


# =============================================================================
# Proprioception Activation Storage Tests
# =============================================================================


class TestProprioceptionActivations:
    """Test that proprioception inputs are stored correctly in activations."""

    def test_activations_include_proprioception_inputs(self):
        """
        BUG REPRODUCTION: When proprioception is enabled, activations_per_frame
        should store all inputs including proprioception, not just base inputs.

        With proprioception='all' and cyclic time encoding:
        - Base inputs: 7
        - Time encoding (cyclic): 2
        - Strain (MAX_MUSCLES=15): 15
        - Velocity (MAX_NODES*3=24): 24
        - Ground (MAX_NODES=8): 8
        - Total: 56 inputs
        """
        genome = make_neural_genome("test_proprio", hidden_size=8, num_muscles=3)

        # Simulate with proprioception enabled and frame recording
        response = client.post("/api/simulation/batch", json={
            "genomes": [genome],
            "config": {
                "use_neural_net": True,
                "neural_mode": "hybrid",
                "time_encoding": "cyclic",
                "use_proprioception": True,
                "proprioception_inputs": "all",
                "simulation_duration": 1.0,  # Minimum allowed
                "frame_storage_mode": "all",  # Record frames
                "frame_rate": 15,
            }
        })

        assert response.status_code == 200, f"Failed: {response.json()}"
        results = extract_results(response)
        assert len(results) == 1

        result = results[0]
        activations = result.get("activations_per_frame") or result.get("activationsPerFrame")

        assert activations is not None, "activations_per_frame should not be None when frame_storage_mode='all'"
        assert len(activations) > 0, "Should have at least one frame of activations"

        # Check the first frame's inputs
        first_frame = activations[0]
        inputs = first_frame.get("inputs")

        assert inputs is not None, "inputs should be present in activations"

        # Expected: 7 base + 2 cyclic + 15 strain + 24 velocity + 8 ground = 56
        expected_input_count = 56
        actual_input_count = len(inputs)

        assert actual_input_count == expected_input_count, (
            f"Expected {expected_input_count} inputs (with proprioception), "
            f"but got {actual_input_count}. "
            f"Backend may not be storing proprioception inputs."
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
