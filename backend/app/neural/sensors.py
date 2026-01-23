"""
Batched sensor input gathering for neural network control.

Computes sensor inputs for all creatures in parallel:
- Pellet direction (3D unit vector toward pellet)
- Velocity direction (3D unit vector of movement)
- Pellet distance (normalized 0-1)
- Time phase (hybrid mode only, sin wave for rhythm)
"""

import torch
from typing import Literal

from app.simulation.tensors import CreatureBatch, get_center_of_mass
from app.simulation.physics import MAX_PELLET_DISTANCE


@torch.no_grad()
def gather_sensor_inputs_pure(
    pellet_direction: torch.Tensor,
    velocity_direction: torch.Tensor,
    normalized_distance: torch.Tensor,
) -> torch.Tensor:
    """
    Gather sensor inputs for pure mode (7 inputs).

    Pure mode: NN has full control over muscle timing, no time phase needed.

    Args:
        pellet_direction: [B, 3] unit vector toward pellet
        velocity_direction: [B, 3] unit vector of movement
        normalized_distance: [B] distance to pellet (0=at pellet, 1=far)

    Returns:
        inputs: [B, 7] sensor inputs
            [pellet_dir_x, pellet_dir_y, pellet_dir_z,
             velocity_x, velocity_y, velocity_z,
             pellet_dist]
    """
    batch_size = pellet_direction.shape[0]
    device = pellet_direction.device

    inputs = torch.zeros(batch_size, 7, device=device)
    inputs[:, 0:3] = pellet_direction
    inputs[:, 3:6] = velocity_direction
    inputs[:, 6] = normalized_distance

    return inputs


@torch.no_grad()
def gather_sensor_inputs_hybrid(
    pellet_direction: torch.Tensor,
    velocity_direction: torch.Tensor,
    normalized_distance: torch.Tensor,
    simulation_time: float,
) -> torch.Tensor:
    """
    Gather sensor inputs for hybrid mode (8 inputs).

    Hybrid mode: NN modulates base oscillation, time phase helps sync.

    Args:
        pellet_direction: [B, 3] unit vector toward pellet
        velocity_direction: [B, 3] unit vector of movement
        normalized_distance: [B] distance to pellet (0=at pellet, 1=far)
        simulation_time: Current simulation time in seconds

    Returns:
        inputs: [B, 8] sensor inputs
            [pellet_dir_x, pellet_dir_y, pellet_dir_z,
             velocity_x, velocity_y, velocity_z,
             pellet_dist, time_phase]
    """
    batch_size = pellet_direction.shape[0]
    device = pellet_direction.device

    # Time phase: sin wave for rhythmic behavior (matches TypeScript)
    time_phase = torch.sin(torch.tensor(simulation_time * torch.pi * 2, device=device))

    inputs = torch.zeros(batch_size, 8, device=device)
    inputs[:, 0:3] = pellet_direction
    inputs[:, 3:6] = velocity_direction
    inputs[:, 6] = normalized_distance
    inputs[:, 7] = time_phase

    return inputs


@torch.no_grad()
def gather_sensor_inputs(
    batch: CreatureBatch,
    pellet_positions: torch.Tensor,
    previous_com: torch.Tensor,
    simulation_time: float,
    mode: Literal['pure', 'hybrid'] = 'hybrid',
    max_pellet_distance: float = MAX_PELLET_DISTANCE,
) -> torch.Tensor:
    """
    Gather all sensor inputs from simulation state.

    This is the main entry point for computing neural network inputs.

    Args:
        batch: CreatureBatch with current positions
        pellet_positions: [B, 3] current target pellet positions
        previous_com: [B, 3] center of mass from previous frame
        simulation_time: Current simulation time
        mode: 'pure' (7 inputs) or 'hybrid' (8 inputs)
        max_pellet_distance: Max distance for normalization

    Returns:
        inputs: [B, 7] or [B, 8] depending on mode
    """
    device = batch.positions.device

    # Get current center of mass
    current_com = get_center_of_mass(batch)  # [B, 3]

    # Pellet direction: unit vector from COM to pellet
    to_pellet = pellet_positions - current_com  # [B, 3]
    pellet_dist = torch.norm(to_pellet, dim=1, keepdim=True).clamp(min=1e-8)  # [B, 1]
    pellet_direction = to_pellet / pellet_dist  # [B, 3]

    # Velocity direction: unit vector of movement
    velocity = current_com - previous_com  # [B, 3]
    velocity_mag = torch.norm(velocity, dim=1, keepdim=True).clamp(min=1e-8)  # [B, 1]
    velocity_direction = velocity / velocity_mag  # [B, 3]

    # Handle stationary creatures (velocity_mag ≈ 0)
    stationary_mask = velocity_mag.squeeze(-1) < 1e-6
    velocity_direction[stationary_mask] = 0

    # Normalized distance (0 = at pellet, 1 = far away)
    normalized_distance = (pellet_dist.squeeze(-1) / max_pellet_distance).clamp(0, 1)  # [B]

    if mode == 'pure':
        return gather_sensor_inputs_pure(pellet_direction, velocity_direction, normalized_distance)
    else:
        return gather_sensor_inputs_hybrid(pellet_direction, velocity_direction, normalized_distance, simulation_time)


@torch.no_grad()
def compute_pellet_direction_for_nn(
    batch: CreatureBatch,
    pellet_positions: torch.Tensor,
) -> torch.Tensor:
    """
    Compute unit vector from each creature's COM to its target pellet.

    Args:
        batch: CreatureBatch with current positions
        pellet_positions: [B, 3] target pellet positions

    Returns:
        direction: [B, 3] unit vectors toward pellet
    """
    com = get_center_of_mass(batch)  # [B, 3]
    to_pellet = pellet_positions - com  # [B, 3]
    dist = torch.norm(to_pellet, dim=1, keepdim=True).clamp(min=1e-8)  # [B, 1]
    return to_pellet / dist  # [B, 3]


@torch.no_grad()
def compute_velocity_direction_for_nn(
    current_com: torch.Tensor,
    previous_com: torch.Tensor,
) -> torch.Tensor:
    """
    Compute unit vector of creature's velocity (movement direction).

    Args:
        current_com: [B, 3] current center of mass
        previous_com: [B, 3] previous center of mass

    Returns:
        direction: [B, 3] unit vectors of movement (0 if stationary)
    """
    velocity = current_com - previous_com  # [B, 3]
    velocity_mag = torch.norm(velocity, dim=1, keepdim=True).clamp(min=1e-8)  # [B, 1]
    direction = velocity / velocity_mag  # [B, 3]

    # Handle stationary creatures
    stationary_mask = velocity_mag.squeeze(-1) < 1e-6
    direction[stationary_mask] = 0

    return direction  # [B, 3]


@torch.no_grad()
def compute_normalized_distance_for_nn(
    batch: CreatureBatch,
    pellet_positions: torch.Tensor,
    max_pellet_distance: float = MAX_PELLET_DISTANCE,
) -> torch.Tensor:
    """
    Compute normalized distance from each creature to its target pellet.

    Args:
        batch: CreatureBatch with current positions
        pellet_positions: [B, 3] target pellet positions
        max_pellet_distance: Max distance for normalization

    Returns:
        distance: [B] normalized distance (0=at pellet, 1=far away)
    """
    com = get_center_of_mass(batch)  # [B, 3]
    to_pellet = pellet_positions - com  # [B, 3]
    dist = torch.norm(to_pellet, dim=1)  # [B]
    return (dist / max_pellet_distance).clamp(0, 1)  # [B]
