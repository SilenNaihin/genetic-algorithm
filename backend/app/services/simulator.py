"""
Simulation service for running physics simulations.
This is a placeholder that will be replaced with proper physics.
For now, it provides a CPU-based simulation using simple spring physics.

Future options:
- PyBullet for accurate physics
- Custom PyTorch physics for GPU acceleration
- Rapier via Python bindings
"""

import asyncio
import math
import random
from concurrent.futures import ProcessPoolExecutor
from typing import Any

import numpy as np

from app.core.config import settings


class SimulatorService:
    """Service for simulating creatures and calculating fitness."""

    def __init__(self, max_workers: int | None = None):
        self.max_workers = max_workers or settings.max_workers

    async def simulate_batch(
        self,
        genomes: list[dict],
        config: dict,
    ) -> list[dict]:
        """Simulate a batch of creatures in parallel."""
        # Use process pool for CPU-bound simulation
        loop = asyncio.get_event_loop()

        with ProcessPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all simulations
            futures = [
                loop.run_in_executor(
                    executor,
                    simulate_creature,
                    genome,
                    config,
                )
                for genome in genomes
            ]

            # Gather results
            results = await asyncio.gather(*futures)

        return list(results)


def simulate_creature(genome: dict, config: dict) -> dict:
    """
    Simulate a single creature and return fitness results.

    This is a simplified physics simulation. For production, replace with:
    - PyBullet for accurate rigid body physics
    - Custom PyTorch simulation for GPU acceleration
    """
    duration = config.get("duration", 8.0)
    frame_rate = config.get("frame_rate", 15)
    record_frames = config.get("record_frames", True)
    pellet_count = config.get("pellet_count", 5)
    ground_size = config.get("ground_size", 30.0)
    max_allowed_frequency = config.get("max_allowed_frequency", 3.0)

    dt = 1.0 / 60.0  # Physics timestep
    steps = int(duration / dt)
    frame_interval = int(60 / frame_rate) if frame_rate > 0 else 0

    nodes = genome["nodes"]
    muscles = genome["muscles"]
    global_freq_mult = genome.get("global_frequency_multiplier", 1.0)
    global_amp_mult = genome.get("global_amplitude_multiplier", 1.0)

    # Check for disqualification (high frequency)
    for muscle in muscles:
        effective_freq = muscle["frequency"] * global_freq_mult
        if effective_freq > max_allowed_frequency:
            return {
                "genome_id": genome["id"],
                "fitness": 0.0,
                "pellets_collected": 0,
                "disqualified": True,
                "disqualified_reason": "high_frequency",
                "frame_count": 0,
            }

    # Initialize node positions and velocities
    num_nodes = len(nodes)
    positions = np.zeros((num_nodes, 3))
    velocities = np.zeros((num_nodes, 3))

    node_id_to_idx = {}
    for i, node in enumerate(nodes):
        node_id_to_idx[node["id"]] = i
        positions[i] = [
            node["position"]["x"],
            node["position"]["y"],
            node["position"]["z"],
        ]

    # Get node properties
    masses = np.array([node["mass"] for node in nodes])
    sizes = np.array([node["size"] for node in nodes])

    # Generate pellet positions
    pellet_positions = []
    for _ in range(pellet_count):
        angle = random.uniform(0, 2 * math.pi)
        radius = random.uniform(5, ground_size / 2 - 2)
        pellet_positions.append([
            math.cos(angle) * radius,
            0.5,  # Height above ground
            math.sin(angle) * radius,
        ])
    pellet_positions = np.array(pellet_positions) if pellet_positions else np.zeros((0, 3))
    pellet_collected = [False] * pellet_count

    # Recording
    frames = [] if record_frames else None
    pellet_frames = [] if record_frames and pellet_count > 0 else None

    # Initial center of mass
    initial_com = np.mean(positions, axis=0)

    # Simulation loop
    time = 0.0
    pellets_collected = 0

    for step in range(steps):
        # Calculate muscle forces
        forces = np.zeros((num_nodes, 3))

        for muscle in muscles:
            idx_a = node_id_to_idx.get(muscle["node_a"])
            idx_b = node_id_to_idx.get(muscle["node_b"])

            if idx_a is None or idx_b is None:
                continue

            # Vector from A to B
            delta = positions[idx_b] - positions[idx_a]
            distance = np.linalg.norm(delta)

            if distance < 0.001:
                continue

            direction = delta / distance

            # Spring force
            rest_length = muscle["rest_length"]

            # Oscillating rest length
            effective_freq = muscle["frequency"] * global_freq_mult
            effective_amp = muscle["amplitude"] * global_amp_mult
            oscillation = math.sin(time * effective_freq * 2 * math.pi + muscle["phase"])
            current_rest = rest_length * (1 + oscillation * effective_amp)

            displacement = distance - current_rest
            force_magnitude = muscle["strength"] * displacement

            force = direction * force_magnitude

            forces[idx_a] += force
            forces[idx_b] -= force

        # Apply gravity
        forces[:, 1] -= masses * 9.81

        # Ground collision and friction
        for i in range(num_nodes):
            ground_y = sizes[i] / 2  # Node radius
            if positions[i, 1] < ground_y:
                positions[i, 1] = ground_y
                if velocities[i, 1] < 0:
                    velocities[i, 1] *= -0.3  # Bounce with restitution

                # Friction
                friction = nodes[i]["friction"]
                velocities[i, 0] *= (1 - friction * 0.1)
                velocities[i, 2] *= (1 - friction * 0.1)

        # Damping
        velocities *= 0.99

        # Integration
        accelerations = forces / masses[:, np.newaxis]
        velocities += accelerations * dt
        positions += velocities * dt

        # Check pellet collection
        if pellet_count > 0:
            com = np.mean(positions, axis=0)
            for p_idx, pellet_pos in enumerate(pellet_positions):
                if not pellet_collected[p_idx]:
                    dist = np.linalg.norm(com[:2] - pellet_pos[:2])  # XZ distance
                    if dist < 1.5:  # Collection radius
                        pellet_collected[p_idx] = True
                        pellets_collected += 1

        # Record frame
        if record_frames and frame_interval > 0 and step % frame_interval == 0:
            frame_data = []
            for i in range(num_nodes):
                # Position + quaternion (simplified - just identity quaternion)
                frame_data.append([
                    float(positions[i, 0]),
                    float(positions[i, 1]),
                    float(positions[i, 2]),
                    0.0, 0.0, 0.0, 1.0,  # Identity quaternion
                ])
            frames.append(frame_data)

            if pellet_frames is not None:
                pellet_frame = []
                for p_idx, pellet_pos in enumerate(pellet_positions):
                    if not pellet_collected[p_idx]:
                        pellet_frame.append([
                            float(pellet_pos[0]),
                            float(pellet_pos[1]),
                            float(pellet_pos[2]),
                        ])
                pellet_frames.append(pellet_frame)

        time += dt

    # Calculate fitness
    final_com = np.mean(positions, axis=0)

    # Progress fitness: distance from edge of ground in XZ plane
    # Max progress is 80 (reaching center from spawn near edge)
    distance_from_center = math.sqrt(final_com[0] ** 2 + final_com[2] ** 2)
    edge_distance = ground_size / 2
    progress = max(0, edge_distance - distance_from_center)
    progress_fitness = min(80, progress * (80 / edge_distance))

    # Collection bonus: 20 points per pellet
    collection_fitness = pellets_collected * 20

    total_fitness = progress_fitness + collection_fitness

    result = {
        "genome_id": genome["id"],
        "fitness": float(total_fitness),
        "pellets_collected": pellets_collected,
        "disqualified": False,
        "disqualified_reason": None,
        "frame_count": len(frames) if frames else 0,
    }

    if record_frames and frames:
        result["frames"] = frames
        if pellet_frames:
            result["pellet_frames"] = pellet_frames

    return result
