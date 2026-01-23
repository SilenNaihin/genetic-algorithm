"""
Batched fitness calculation and pellet collision detection.

Handles:
- Pellet generation and collision detection
- Progress-based fitness calculation
- Net displacement and distance traveled tracking
- Disqualification detection (NaN, physics explosion, frequency violation)
"""

import torch
import math
from dataclasses import dataclass
from typing import Optional

from app.simulation.tensors import CreatureBatch, get_center_of_mass, MAX_NODES


# =============================================================================
# Configuration Defaults (matching TypeScript)
# =============================================================================

@dataclass
class FitnessConfig:
    """Configuration for fitness calculation."""
    pellet_points: float = 100.0        # Points per collected pellet
    progress_max: float = 80.0          # Max points for progress toward pellet
    net_displacement_max: float = 15.0  # Max points for net displacement
    distance_per_unit: float = 3.0      # Points per unit traveled
    distance_traveled_max: float = 15.0 # Max points for distance traveled
    regression_penalty: float = 20.0    # Penalty for moving away from pellet
    efficiency_penalty: float = 0.5     # Penalty for excessive muscle activation
    target_displacement_rate: float = 1.0  # Units/second for full displacement bonus
    max_allowed_frequency: float = 3.0  # Max muscle frequency before disqualification
    position_threshold: float = 50.0    # Max distance from origin before disqualification
    height_threshold: float = 30.0      # Max height before disqualification
    pellet_collection_radius: float = 0.75  # Distance to collect pellet


# =============================================================================
# Pellet Data Structure
# =============================================================================

@dataclass
class PelletBatch:
    """Batched pellet data for all creatures."""
    device: torch.device
    batch_size: int

    # Current pellet positions [B, 3]
    positions: torch.Tensor

    # Initial distance from creature edge to pellet (for progress calculation) [B]
    initial_distances: torch.Tensor

    # Pellet index per creature (how many have been spawned) [B]
    pellet_indices: torch.Tensor

    # Collected status [B] - True if current pellet is collected
    collected: torch.Tensor

    # Total pellets collected per creature [B]
    total_collected: torch.Tensor


# =============================================================================
# Creature XZ Radius Calculation
# =============================================================================

@torch.no_grad()
def calculate_creature_xz_radius(batch: CreatureBatch) -> torch.Tensor:
    """
    Calculate the XZ radius (ground footprint) of each creature from genome.

    This uses the original positions from the genome, not current physics state.
    Adds a 1.3x buffer for muscle extension.

    Args:
        batch: CreatureBatch with initial positions

    Returns:
        [B] tensor of XZ radii
    """
    B = batch.batch_size
    device = batch.device

    if B == 0:
        return torch.zeros(0, device=device)

    # Calculate XZ center of each creature
    # positions: [B, N, 3], node_mask: [B, N]
    pos_xz = batch.positions[:, :, [0, 2]]  # [B, N, 2] just X and Z
    mask = batch.node_mask.unsqueeze(-1)  # [B, N, 1]

    # Masked sum for XZ coordinates
    masked_pos = pos_xz * mask  # [B, N, 2]
    sum_pos = masked_pos.sum(dim=1)  # [B, 2]
    count = batch.node_mask.sum(dim=1, keepdim=True).clamp(min=1)  # [B, 1]
    center_xz = sum_pos / count  # [B, 2]

    # Calculate distance from center to each node edge (in XZ plane)
    # Distance = sqrt((x - cx)^2 + (z - cz)^2) + node_radius
    dx = pos_xz[:, :, 0] - center_xz[:, 0:1]  # [B, N]
    dz = pos_xz[:, :, 1] - center_xz[:, 1:2]  # [B, N]
    dist_to_center = torch.sqrt(dx**2 + dz**2)  # [B, N]

    # Add node radius (size * 0.5)
    dist_to_edge = dist_to_center + batch.sizes * 0.5  # [B, N]

    # Mask out invalid nodes
    dist_to_edge = dist_to_edge * batch.node_mask  # [B, N]

    # Get max distance per creature
    max_radius, _ = dist_to_edge.max(dim=1)  # [B]

    # Apply 1.3x buffer for muscle extension
    buffered_radius = max_radius * 1.3

    # Minimum radius of 1.0 unit
    final_radius = torch.clamp(buffered_radius, min=1.0)

    return final_radius


# =============================================================================
# Pellet Generation
# =============================================================================

@torch.no_grad()
def generate_pellet_positions(
    batch: CreatureBatch,
    pellet_indices: torch.Tensor,
    creature_xz_radii: torch.Tensor,
    arena_size: float = 50.0,
    seed: Optional[int] = None,
) -> torch.Tensor:
    """
    Generate pellet positions for each creature.

    Pellets spawn at progressive distances from creature's edge:
    - Pellet 0: 7-8 units from edge
    - Pellet 1-2: 8-9 units from edge
    - Pellet 3+: 9-10 units from edge

    Height increases with pellet index.

    Args:
        batch: CreatureBatch with current positions
        pellet_indices: [B] current pellet index per creature
        creature_xz_radii: [B] XZ radius of each creature
        arena_size: Arena boundary size
        seed: Optional random seed for reproducibility

    Returns:
        [B, 3] pellet positions
    """
    B = batch.batch_size
    device = batch.device

    if B == 0:
        return torch.zeros(0, 3, device=device)

    # Get creature centers of mass
    com = get_center_of_mass(batch)  # [B, 3]

    # Set random seed if provided
    if seed is not None:
        torch.manual_seed(seed)

    # Generate random angles [B]
    angles = torch.rand(B, device=device) * 2 * math.pi

    # Calculate distance from edge based on pellet index
    # Pellet 0: 7-8, Pellet 1-2: 8-9, Pellet 3+: 9-10
    min_dist = torch.where(pellet_indices == 0, 7.0,
                          torch.where(pellet_indices <= 2, 8.0, 9.0))
    max_dist = torch.where(pellet_indices == 0, 8.0,
                          torch.where(pellet_indices <= 2, 9.0, 10.0))

    # Random distance within range
    rand_dist = torch.rand(B, device=device)
    dist_from_edge = min_dist + rand_dist * (max_dist - min_dist)

    # Total distance from center = creature radius + distance from edge
    total_dist = creature_xz_radii + dist_from_edge

    # Calculate XZ position
    px = com[:, 0] + torch.cos(angles) * total_dist
    pz = com[:, 2] + torch.sin(angles) * total_dist

    # Height increases with pellet index
    base_height = 0.3
    height_increment = 0.4
    py = base_height + pellet_indices.float() * height_increment

    # Clamp to arena bounds
    arena_bound = arena_size * 0.45
    px = torch.clamp(px, -arena_bound, arena_bound)
    pz = torch.clamp(pz, -arena_bound, arena_bound)

    # Stack into [B, 3]
    positions = torch.stack([px, py, pz], dim=1)

    return positions


@torch.no_grad()
def initialize_pellets(
    batch: CreatureBatch,
    arena_size: float = 50.0,
    seed: Optional[int] = None,
) -> PelletBatch:
    """
    Initialize pellet data for all creatures.

    Creates first pellet for each creature at appropriate distance.

    Args:
        batch: CreatureBatch with initial positions
        arena_size: Arena boundary size
        seed: Optional random seed

    Returns:
        PelletBatch with initialized pellet data
    """
    B = batch.batch_size
    device = batch.device

    # Calculate creature radii
    creature_radii = calculate_creature_xz_radius(batch)

    # Initial pellet indices (all 0)
    pellet_indices = torch.zeros(B, dtype=torch.long, device=device)

    # Generate first pellet positions
    positions = generate_pellet_positions(
        batch, pellet_indices, creature_radii, arena_size, seed
    )

    # Calculate initial distances (XZ ground distance from edge to pellet)
    com = get_center_of_mass(batch)
    initial_distances = compute_edge_distances(com, creature_radii, positions)

    return PelletBatch(
        device=device,
        batch_size=B,
        positions=positions,
        initial_distances=initial_distances,
        pellet_indices=pellet_indices,
        collected=torch.zeros(B, dtype=torch.bool, device=device),
        total_collected=torch.zeros(B, dtype=torch.long, device=device),
    )


# =============================================================================
# Distance Calculations
# =============================================================================

@torch.no_grad()
def compute_edge_distances(
    com: torch.Tensor,
    creature_radii: torch.Tensor,
    target_positions: torch.Tensor,
) -> torch.Tensor:
    """
    Compute XZ ground distance from creature edge to target.

    Args:
        com: [B, 3] creature center of mass
        creature_radii: [B] XZ radius of each creature
        target_positions: [B, 3] target positions

    Returns:
        [B] ground distances from edge to target (clamped to >= 0)
    """
    # XZ distance from center to target
    dx = target_positions[:, 0] - com[:, 0]
    dz = target_positions[:, 2] - com[:, 2]
    dist_from_center = torch.sqrt(dx**2 + dz**2)

    # Distance from edge = distance from center - radius
    dist_from_edge = dist_from_center - creature_radii

    # Clamp to >= 0 (can't be negative)
    return torch.clamp(dist_from_edge, min=0)


@torch.no_grad()
def compute_3d_distances(
    com: torch.Tensor,
    target_positions: torch.Tensor,
) -> torch.Tensor:
    """
    Compute 3D distance from COM to target.

    Args:
        com: [B, 3] creature center of mass
        target_positions: [B, 3] target positions

    Returns:
        [B] 3D distances
    """
    diff = target_positions - com
    return torch.norm(diff, dim=1)


# =============================================================================
# Pellet Collision Detection
# =============================================================================

@torch.no_grad()
def check_pellet_collisions(
    batch: CreatureBatch,
    pellets: PelletBatch,
    collection_radius: float = 0.75,
) -> torch.Tensor:
    """
    Check which creatures have collected their current pellet.

    Collection is based on 3D distance from any node to pellet center.

    Args:
        batch: CreatureBatch with current positions
        pellets: PelletBatch with pellet positions
        collection_radius: Distance threshold for collection

    Returns:
        [B] boolean tensor - True where pellet was collected
    """
    B = batch.batch_size
    device = batch.device

    if B == 0:
        return torch.zeros(0, dtype=torch.bool, device=device)

    # For each creature, check distance from each node to pellet
    # positions: [B, N, 3], pellet_positions: [B, 3]
    pellet_pos_expanded = pellets.positions.unsqueeze(1)  # [B, 1, 3]

    # Distance from each node to pellet
    diff = batch.positions - pellet_pos_expanded  # [B, N, 3]
    node_to_pellet_dist = torch.norm(diff, dim=2)  # [B, N]

    # Mask out invalid nodes
    node_to_pellet_dist = torch.where(
        batch.node_mask > 0.5,
        node_to_pellet_dist,
        torch.full_like(node_to_pellet_dist, float('inf'))
    )

    # Check if any node is within collection radius
    min_dist, _ = node_to_pellet_dist.min(dim=1)  # [B]
    collected = min_dist < collection_radius

    return collected


@torch.no_grad()
def update_pellets(
    batch: CreatureBatch,
    pellets: PelletBatch,
    arena_size: float = 50.0,
) -> None:
    """
    Update pellet state after collision check.

    Spawns new pellets for creatures that collected their current pellet.
    Modifies pellets in-place.

    Args:
        batch: CreatureBatch with current positions
        pellets: PelletBatch to update
        arena_size: Arena boundary
    """
    # Check for collisions
    newly_collected = check_pellet_collisions(batch, pellets)

    # Update collected status and count
    pellets.collected = pellets.collected | newly_collected
    pellets.total_collected = pellets.total_collected + newly_collected.long()

    # For creatures that collected, spawn new pellet
    if newly_collected.any():
        # Increment pellet index for collectors
        pellets.pellet_indices = pellets.pellet_indices + newly_collected.long()

        # Calculate creature radii
        creature_radii = calculate_creature_xz_radius(batch)

        # Generate new positions for collectors
        new_positions = generate_pellet_positions(
            batch, pellets.pellet_indices, creature_radii, arena_size
        )

        # Update positions for collectors only
        pellets.positions = torch.where(
            newly_collected.unsqueeze(1).expand(-1, 3),
            new_positions,
            pellets.positions
        )

        # Reset collected flag and update initial distance for collectors
        pellets.collected = torch.where(
            newly_collected,
            torch.zeros_like(pellets.collected),
            pellets.collected
        )

        # Update initial distances
        com = get_center_of_mass(batch)
        new_initial_distances = compute_edge_distances(com, creature_radii, pellets.positions)
        pellets.initial_distances = torch.where(
            newly_collected,
            new_initial_distances,
            pellets.initial_distances
        )


# =============================================================================
# Disqualification Detection
# =============================================================================

@torch.no_grad()
def check_disqualifications(
    batch: CreatureBatch,
    config: FitnessConfig = FitnessConfig(),
) -> torch.Tensor:
    """
    Check which creatures should be disqualified.

    Reasons for disqualification:
    - NaN positions
    - Physics explosion (position > threshold)
    - Flying too high

    Args:
        batch: CreatureBatch with current positions
        config: FitnessConfig with thresholds

    Returns:
        [B] boolean tensor - True where creature is disqualified
    """
    B = batch.batch_size
    device = batch.device

    if B == 0:
        return torch.zeros(0, dtype=torch.bool, device=device)

    # Check for NaN positions
    has_nan = torch.isnan(batch.positions).any(dim=(1, 2))  # [B]

    # Check for physics explosion (any node too far from origin)
    # Only check valid nodes
    pos_magnitude = torch.norm(batch.positions[:, :, [0, 2]], dim=2)  # [B, N] XZ distance
    pos_magnitude = pos_magnitude * batch.node_mask  # Mask invalid
    max_pos, _ = pos_magnitude.max(dim=1)  # [B]
    too_far = max_pos > config.position_threshold

    # Check for flying too high
    max_height = (batch.positions[:, :, 1] * batch.node_mask).max(dim=1)[0]  # [B]
    too_high = max_height > config.height_threshold

    # Combined disqualification
    disqualified = has_nan | too_far | too_high

    return disqualified


@torch.no_grad()
def check_frequency_violations(
    batch: CreatureBatch,
    config: FitnessConfig = FitnessConfig(),
) -> torch.Tensor:
    """
    Check which creatures have invalid muscle frequencies.

    Effective frequency = muscle frequency * global multiplier

    Args:
        batch: CreatureBatch
        config: FitnessConfig with max frequency

    Returns:
        [B] boolean tensor - True where creature has invalid frequency
    """
    B = batch.batch_size
    device = batch.device

    if B == 0:
        return torch.zeros(0, dtype=torch.bool, device=device)

    # Calculate effective frequencies
    # spring_frequency: [B, M], global_freq_multiplier: [B]
    effective_freq = batch.spring_frequency * batch.global_freq_multiplier.unsqueeze(1)

    # Mask out invalid muscles
    effective_freq = effective_freq * batch.spring_mask

    # Check if any muscle exceeds max
    max_freq, _ = effective_freq.max(dim=1)  # [B]
    violated = max_freq > config.max_allowed_frequency

    return violated


# =============================================================================
# Fitness Calculation
# =============================================================================

@dataclass
class FitnessState:
    """Tracks fitness-related state during simulation."""
    device: torch.device
    batch_size: int

    # Starting positions for net displacement [B, 3]
    initial_com: torch.Tensor

    # Previous COM for distance traveled [B, 3]
    previous_com: torch.Tensor

    # Accumulated distance traveled (XZ only) [B]
    distance_traveled: torch.Tensor

    # Total muscle activation (for efficiency penalty) [B]
    total_activation: torch.Tensor

    # Disqualification status [B]
    disqualified: torch.Tensor

    # Creature XZ radii [B]
    creature_radii: torch.Tensor


@torch.no_grad()
def initialize_fitness_state(batch: CreatureBatch) -> FitnessState:
    """Initialize fitness tracking state."""
    B = batch.batch_size
    device = batch.device

    com = get_center_of_mass(batch)
    creature_radii = calculate_creature_xz_radius(batch)

    return FitnessState(
        device=device,
        batch_size=B,
        initial_com=com.clone(),
        previous_com=com.clone(),
        distance_traveled=torch.zeros(B, device=device),
        total_activation=torch.zeros(B, device=device),
        disqualified=torch.zeros(B, dtype=torch.bool, device=device),
        creature_radii=creature_radii,
    )


@torch.no_grad()
def update_fitness_state(
    batch: CreatureBatch,
    state: FitnessState,
    config: FitnessConfig = FitnessConfig(),
) -> None:
    """
    Update fitness state after a physics step.

    Updates distance traveled and checks for disqualification.
    Modifies state in-place.
    """
    com = get_center_of_mass(batch)

    # Update distance traveled (XZ only)
    dx = com[:, 0] - state.previous_com[:, 0]
    dz = com[:, 2] - state.previous_com[:, 2]
    step_distance = torch.sqrt(dx**2 + dz**2)
    state.distance_traveled = state.distance_traveled + step_distance

    # Update previous COM
    state.previous_com = com.clone()

    # Check for disqualification
    newly_disqualified = check_disqualifications(batch, config)
    state.disqualified = state.disqualified | newly_disqualified


@torch.no_grad()
def calculate_fitness(
    batch: CreatureBatch,
    pellets: PelletBatch,
    state: FitnessState,
    simulation_time: float,
    config: FitnessConfig = FitnessConfig(),
) -> torch.Tensor:
    """
    Calculate current fitness for all creatures.

    Fitness components:
    - pellet_points per collected pellet
    - 0-progress_max for progress toward current pellet
    - 0-net_displacement_max for net XZ displacement
    - 0-distance_traveled_max for total XZ distance
    - -efficiency_penalty * total_activation

    Args:
        batch: CreatureBatch with current positions
        pellets: PelletBatch with pellet state
        state: FitnessState with tracking data
        simulation_time: Current simulation time
        config: FitnessConfig with weights

    Returns:
        [B] fitness scores
    """
    B = batch.batch_size
    device = batch.device

    if B == 0:
        return torch.zeros(0, device=device)

    # Disqualified creatures get 0 fitness
    # We'll compute fitness then mask

    com = get_center_of_mass(batch)

    # 1. Base: pellet_points per collected pellet
    pellet_fitness = pellets.total_collected.float() * config.pellet_points

    # 2. Progress toward current pellet (0-progress_max)
    current_edge_dist = compute_edge_distances(
        com, state.creature_radii, pellets.positions
    )
    # Progress = (initial - current) / initial, clamped to [0, 1]
    progress = (pellets.initial_distances - current_edge_dist) / pellets.initial_distances.clamp(min=0.01)
    progress = torch.clamp(progress, 0, 1)
    progress_fitness = progress * config.progress_max

    # 3. Net displacement bonus (XZ only)
    dx = com[:, 0] - state.initial_com[:, 0]
    dz = com[:, 2] - state.initial_com[:, 2]
    net_displacement = torch.sqrt(dx**2 + dz**2)

    # Rate-based bonus
    if simulation_time > 0:
        displacement_rate = net_displacement / simulation_time
        displacement_ratio = displacement_rate / config.target_displacement_rate
        displacement_ratio = torch.clamp(displacement_ratio, 0, 1)
        displacement_fitness = displacement_ratio * config.net_displacement_max
    else:
        displacement_fitness = torch.zeros(B, device=device)

    # 4. Distance traveled bonus (XZ only)
    distance_fitness = state.distance_traveled * config.distance_per_unit
    distance_fitness = torch.clamp(distance_fitness, 0, config.distance_traveled_max)

    # 5. Efficiency penalty
    efficiency_cost = state.total_activation * config.efficiency_penalty

    # Total fitness
    fitness = pellet_fitness + progress_fitness + displacement_fitness + distance_fitness - efficiency_cost

    # Zero out disqualified creatures
    fitness = torch.where(state.disqualified, torch.zeros_like(fitness), fitness)

    return fitness
