"""
Integration tests for simulation API endpoints.

Tests the full pipeline from API request to PyTorch physics and back.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


class TestSimulationBatchEndpoint:
    """Test /api/simulation/batch endpoint."""

    def test_batch_simulation_basic(self, client):
        """Basic batch simulation should return results."""
        request = {
            "genomes": [
                {
                    "id": "test_creature_1",
                    "nodes": [
                        {"id": "n1", "position": {"x": 0, "y": 1, "z": 0}, "size": 0.3, "friction": 0.5},
                        {"id": "n2", "position": {"x": 0.5, "y": 1, "z": 0}, "size": 0.3, "friction": 0.5},
                    ],
                    "muscles": [
                        {
                            "id": "m1",
                            "nodeA": "n1",
                            "nodeB": "n2",
                            "restLength": 0.5,
                            "stiffness": 100,
                            "damping": 1.0,
                            "frequency": 1.0,
                            "amplitude": 0.3,
                            "phase": 0,
                        }
                    ],
                    "globalFrequencyMultiplier": 1.0,
                }
            ],
            "config": {
                "simulation_duration": 5.0,
                "use_neural_net": False,
            }
        }

        response = client.post("/api/simulation/batch", json=request)
        assert response.status_code == 200

        data = response.json()
        assert "results" in data
        assert len(data["results"]) == 1
        assert "fitness" in data["results"][0]
        assert "pellets_collected" in data["results"][0]
        assert "disqualified" in data["results"][0]
        assert data["total_time_ms"] > 0
        assert data["creatures_per_second"] > 0

    def test_batch_simulation_multiple_creatures(self, client):
        """Batch with multiple creatures should return results for each."""
        base_genome = {
            "nodes": [
                {"id": "n1", "position": {"x": 0, "y": 1, "z": 0}, "size": 0.3, "friction": 0.5},
                {"id": "n2", "position": {"x": 0.5, "y": 1, "z": 0}, "size": 0.3, "friction": 0.5},
            ],
            "muscles": [
                {
                    "id": "m1",
                    "nodeA": "n1",
                    "nodeB": "n2",
                    "restLength": 0.5,
                    "stiffness": 100,
                    "damping": 1.0,
                    "frequency": 1.0,
                    "amplitude": 0.3,
                    "phase": 0,
                }
            ],
            "globalFrequencyMultiplier": 1.0,
        }

        genomes = [
            {**base_genome, "id": f"creature_{i}"}
            for i in range(10)
        ]

        request = {
            "genomes": genomes,
            "config": {"simulation_duration": 3.0}
        }

        response = client.post("/api/simulation/batch", json=request)
        assert response.status_code == 200

        data = response.json()
        assert len(data["results"]) == 10
        for i, result in enumerate(data["results"]):
            assert result["genome_id"] == f"creature_{i}"

    def test_batch_simulation_with_fitness_breakdown(self, client):
        """Results should include fitness breakdown."""
        request = {
            "genomes": [
                {
                    "id": "test_creature",
                    "nodes": [
                        {"id": "n1", "position": {"x": 0, "y": 1, "z": 0}, "size": 0.3, "friction": 0.5},
                        {"id": "n2", "position": {"x": 0.5, "y": 1, "z": 0}, "size": 0.3, "friction": 0.5},
                        {"id": "n3", "position": {"x": 0.25, "y": 1, "z": 0.4}, "size": 0.3, "friction": 0.5},
                    ],
                    "muscles": [
                        {"id": "m1", "nodeA": "n1", "nodeB": "n2", "restLength": 0.5, "stiffness": 200, "damping": 1.0, "frequency": 1.5, "amplitude": 0.4, "phase": 0},
                        {"id": "m2", "nodeA": "n2", "nodeB": "n3", "restLength": 0.5, "stiffness": 200, "damping": 1.0, "frequency": 1.5, "amplitude": 0.4, "phase": 2.09},
                        {"id": "m3", "nodeA": "n3", "nodeB": "n1", "restLength": 0.5, "stiffness": 200, "damping": 1.0, "frequency": 1.5, "amplitude": 0.4, "phase": 4.18},
                    ],
                    "globalFrequencyMultiplier": 1.0,
                }
            ],
            "config": {"simulation_duration": 5.0}
        }

        response = client.post("/api/simulation/batch", json=request)
        assert response.status_code == 200

        data = response.json()
        result = data["results"][0]
        assert "fitness_breakdown" in result
        breakdown = result["fitness_breakdown"]
        assert "pellet_points" in breakdown
        assert "progress" in breakdown
        assert "distance_traveled" in breakdown

    def test_batch_simulation_default_config(self, client):
        """Simulation should work with default config."""
        request = {
            "genomes": [
                {
                    "id": "test_creature",
                    "nodes": [
                        {"id": "n1", "position": {"x": 0, "y": 1, "z": 0}, "size": 0.3, "friction": 0.5},
                        {"id": "n2", "position": {"x": 0.5, "y": 1, "z": 0}, "size": 0.3, "friction": 0.5},
                    ],
                    "muscles": [
                        {"id": "m1", "nodeA": "n1", "nodeB": "n2", "restLength": 0.5, "stiffness": 100, "damping": 1.0, "frequency": 1.0, "amplitude": 0.3, "phase": 0},
                    ],
                    "globalFrequencyMultiplier": 1.0,
                }
            ]
            # No config - use defaults
        }

        response = client.post("/api/simulation/batch", json=request)
        assert response.status_code == 200

    def test_batch_simulation_high_frequency_disqualification(self, client):
        """Creatures with too high frequency should be disqualified in hybrid mode."""
        # Use globalFrequencyMultiplier to push effective frequency above limit
        # frequency=2.0 * globalFrequencyMultiplier=2.0 = effective 4.0, above max 3.0
        # NOTE: Must use neural_mode='hybrid' - pure mode doesn't use frequency
        request = {
            "genomes": [
                {
                    "id": "high_freq_creature",
                    "nodes": [
                        {"id": "n1", "position": {"x": 0, "y": 1, "z": 0}, "size": 0.3, "friction": 0.5},
                        {"id": "n2", "position": {"x": 0.5, "y": 1, "z": 0}, "size": 0.3, "friction": 0.5},
                    ],
                    "muscles": [
                        {"id": "m1", "nodeA": "n1", "nodeB": "n2", "restLength": 0.5, "stiffness": 100, "damping": 1.0, "frequency": 2.0, "amplitude": 0.3, "phase": 0},
                    ],
                    "globalFrequencyMultiplier": 2.0,  # Effective freq = 2.0 * 2.0 = 4.0
                }
            ],
            "config": {
                "max_allowed_frequency": 3.0,
                "neural_mode": "hybrid",  # Frequency check only applies to hybrid mode
            }
        }

        response = client.post("/api/simulation/batch", json=request)
        assert response.status_code == 200

        data = response.json()
        result = data["results"][0]
        assert result["disqualified"] == True
        assert result["disqualified_reason"] == "frequency_exceeded"
        assert result["fitness"] == 0.0


class TestSimulationPerformance:
    """Test simulation performance meets targets."""

    def test_100_creatures_performance(self, client):
        """100 creatures should complete in under 2 seconds (API overhead included)."""
        import time

        base_genome = {
            "nodes": [
                {"id": "n1", "position": {"x": 0, "y": 1, "z": 0}, "size": 0.3, "friction": 0.5},
                {"id": "n2", "position": {"x": 0.5, "y": 1, "z": 0}, "size": 0.3, "friction": 0.5},
            ],
            "muscles": [
                {"id": "m1", "nodeA": "n1", "nodeB": "n2", "restLength": 0.5, "stiffness": 100, "damping": 1.0, "frequency": 1.0, "amplitude": 0.3, "phase": 0},
            ],
            "globalFrequencyMultiplier": 1.0,
        }

        genomes = [{**base_genome, "id": f"creature_{i}"} for i in range(100)]

        request = {
            "genomes": genomes,
            "config": {"simulation_duration": 10.0}
        }

        start = time.time()
        response = client.post("/api/simulation/batch", json=request)
        elapsed = time.time() - start

        assert response.status_code == 200
        assert elapsed < 2.0, f"100 creatures took {elapsed:.2f}s, should be < 2s"
