"""
Batched PyTorch physics simulation.

Implements spring physics, gravity, ground collision, and muscle oscillation
for parallel simulation of many creatures.

Includes v1/v2 muscle modulation:
- v1: Direction bias (muscles respond to pellet direction)
- v2: Velocity sensing (proprioception - muscles respond to movement)
- v2: Distance awareness (muscles respond to pellet distance)

All operations are vectorized using PyTorch tensors for CPU/GPU efficiency.
"""

import torch
import math

from app.simulation.tensors import CreatureBatch, get_center_of_mass, MAX_NODES, MAX_MUSCLES


# =============================================================================
# Physics Constants (matching TypeScript Cannon-ES defaults)
# =============================================================================

GRAVITY = -9.8  # m/s^2 (negative Y is down, matches TypeScript DEFAULT_CONFIG)
GROUND_Y = 0.0   # Ground plane at y=0
GROUND_FRICTION = 0.7  # Friction coefficient
GROUND_RESTITUTION = 0.2  # Bounce coefficient
LINEAR_DAMPING = 0.1  # Per-body velocity damping
TIME_STEP = 1.0 / 60.0  # Default physics timestep (60Hz)
MAX_PELLET_DISTANCE = 20.0  # For normalizing distance (matches TypeScript)


# =============================================================================
# Spring Force Calculation
# =============================================================================

@torch.no_grad()
def compute_spring_forces(batch: CreatureBatch) -> torch.Tensor:
    """
    Compute spring forces for all muscles in all creatures.

    Spring force formula (Hooke's law with damping):
        F = -k * (|x_b - x_a| - rest_length) * direction - c * relative_velocity_along_spring

    Where:
        k = stiffness (spring constant)
        c = damping coefficient
        x_a, x_b = positions of connected nodes
        rest_length = spring's natural length
        direction = unit vector from a to b

    Args:
        batch: CreatureBatch with current positions and velocities

    Returns:
        Forces tensor [B, MAX_NODES, 3] with accumulated spring forces per node
    """
    B = batch.batch_size
    device = batch.device

    if B == 0:
        return torch.zeros(0, MAX_NODES, 3, device=device)

    # Initialize forces to zero
    forces = torch.zeros(B, MAX_NODES, 3, device=device)

    # Get node positions for each spring endpoint
    # spring_node_a/b: [B, MAX_MUSCLES] indices into positions [B, MAX_NODES, 3]
    # We need to gather positions for each spring's endpoints

    # Expand indices for gathering: [B, MAX_MUSCLES, 1] -> [B, MAX_MUSCLES, 3]
    idx_a = batch.spring_node_a.unsqueeze(-1).expand(-1, -1, 3)  # [B, M, 3]
    idx_b = batch.spring_node_b.unsqueeze(-1).expand(-1, -1, 3)  # [B, M, 3]

    # Gather positions for spring endpoints
    pos_a = torch.gather(batch.positions, 1, idx_a)  # [B, M, 3]
    pos_b = torch.gather(batch.positions, 1, idx_b)  # [B, M, 3]

    # Gather velocities for spring endpoints
    vel_a = torch.gather(batch.velocities, 1, idx_a)  # [B, M, 3]
    vel_b = torch.gather(batch.velocities, 1, idx_b)  # [B, M, 3]

    # Vector from a to b
    delta = pos_b - pos_a  # [B, M, 3]

    # Current length of each spring
    length = torch.norm(delta, dim=2, keepdim=True)  # [B, M, 1]
    length = torch.clamp(length, min=1e-6)  # Avoid division by zero

    # Unit direction vector
    direction = delta / length  # [B, M, 3]

    # Spring extension (positive = stretched, negative = compressed)
    rest_length = batch.spring_rest_length.unsqueeze(-1)  # [B, M, 1]
    extension = length - rest_length  # [B, M, 1]

    # Spring force magnitude: F = -k * extension
    stiffness = batch.spring_stiffness.unsqueeze(-1)  # [B, M, 1]
    spring_force_mag = -stiffness * extension  # [B, M, 1]

    # Damping force (opposes relative velocity along spring)
    relative_vel = vel_b - vel_a  # [B, M, 3]
    vel_along_spring = (relative_vel * direction).sum(dim=2, keepdim=True)  # [B, M, 1]
    damping = batch.spring_damping.unsqueeze(-1)  # [B, M, 1]
    damping_force_mag = -damping * vel_along_spring  # [B, M, 1]

    # Total force magnitude
    total_force_mag = spring_force_mag + damping_force_mag  # [B, M, 1]

    # Force vector (direction from a to b)
    # Positive force pulls a toward b (and b toward a with opposite sign)
    force_on_a = -total_force_mag * direction  # [B, M, 3] - pulls a toward b
    force_on_b = total_force_mag * direction   # [B, M, 3] - pulls b toward a

    # Apply spring mask (zero out forces for padding muscles)
    spring_mask = batch.spring_mask.unsqueeze(-1)  # [B, M, 1]
    force_on_a = force_on_a * spring_mask
    force_on_b = force_on_b * spring_mask

    # Accumulate forces on nodes using scatter_add
    # For each spring, add force_on_a to node_a and force_on_b to node_b
    forces.scatter_add_(1, idx_a, force_on_a)
    forces.scatter_add_(1, idx_b, force_on_b)

    return forces


@torch.no_grad()
def update_muscle_rest_lengths(
    batch: CreatureBatch,
    time: float,
) -> None:
    """
    Update spring rest lengths based on muscle oscillation.

    Oscillation formula (matching TypeScript):
        contraction = sin(time * frequency * globalFreq * 2π + phase)
        new_rest_length = base_rest_length * (1 - contraction * amplitude)

    Args:
        batch: CreatureBatch (modified in place)
        time: Current simulation time in seconds
    """
    if batch.batch_size == 0:
        return

    # Get oscillation parameters
    freq = batch.spring_frequency  # [B, M]
    phase = batch.spring_phase     # [B, M]
    amplitude = batch.spring_amplitude  # [B, M]

    # Global frequency multiplier [B] -> [B, 1] for broadcasting
    global_freq = batch.global_freq_multiplier.unsqueeze(-1)  # [B, 1]

    # Calculate oscillation: sin(time * freq * globalFreq * 2π + phase)
    # Note: freq is in Hz, so freq * 2π gives angular frequency
    angular_freq = freq * global_freq * 2.0 * 3.141592653589793
    oscillation = torch.sin(time * angular_freq + phase)  # [B, M]

    # New rest length = base * (1 - oscillation * amplitude)
    # We need to track base rest length - for now, we'll store it initially
    # Actually, spring_rest_length IS the base rest length since we haven't modified it
    # For a proper implementation, we'd need to track base_rest_length separately
    # For now, we'll compute the current rest length directly

    # The base rest length should be stored separately, but for this implementation
    # we'll assume the initial spring_rest_length is the base
    # This means we need to call this function fresh each frame with original lengths

    # Calculate contraction factor
    contraction = oscillation * amplitude  # [B, M]

    # Clamp to reasonable range (muscles can't compress to zero or stretch infinitely)
    # new_length = base * (1 - contraction), contraction in [-amp, +amp]
    # So new_length in [base * (1 - amp), base * (1 + amp)]
    # We'll clamp the multiplier to [0.1, 2.0] for stability
    length_multiplier = torch.clamp(1.0 - contraction, 0.1, 2.0)  # [B, M]

    # Note: We need to track original rest lengths separately
    # For now, this function should be called with a copy of base lengths
    # The caller should manage base_rest_length vs current rest_length

    # Return the multiplier for the caller to apply
    # Actually, let's just store the computed oscillation and let update handle it


@torch.no_grad()
def compute_oscillating_rest_lengths(
    base_rest_length: torch.Tensor,
    frequency: torch.Tensor,
    amplitude: torch.Tensor,
    phase: torch.Tensor,
    global_freq_multiplier: torch.Tensor,
    time: float,
) -> torch.Tensor:
    """
    Compute current rest lengths based on muscle oscillation.

    Args:
        base_rest_length: [B, M] original rest lengths
        frequency: [B, M] oscillation frequencies in Hz
        amplitude: [B, M] oscillation amplitudes (0-1)
        phase: [B, M] phase offsets in radians
        global_freq_multiplier: [B] global frequency scaling
        time: Current simulation time in seconds

    Returns:
        [B, M] current rest lengths after oscillation
    """
    # Global freq: [B] -> [B, 1]
    global_freq = global_freq_multiplier.unsqueeze(-1)

    # Angular frequency
    angular_freq = frequency * global_freq * 2.0 * 3.141592653589793

    # Oscillation value
    oscillation = torch.sin(time * angular_freq + phase)

    # Contraction factor
    contraction = oscillation * amplitude

    # New rest length with clamping for stability
    # Minimum rest length = 0.1 (matching TypeScript)
    new_rest_length = base_rest_length * (1.0 - contraction)
    new_rest_length = torch.clamp(new_rest_length, min=0.1)

    return new_rest_length


# =============================================================================
# Muscle Modulation (v1/v2 features)
# =============================================================================

@torch.no_grad()
def compute_pellet_direction(
    com: torch.Tensor,
    pellet_positions: torch.Tensor,
) -> torch.Tensor:
    """
    Compute unit direction vectors from creature COMs to pellets.

    Args:
        com: [B, 3] creature centers of mass
        pellet_positions: [B, 3] pellet positions

    Returns:
        [B, 3] unit direction vectors (zeros if distance is too small)
    """
    B = com.shape[0]
    device = com.device

    if B == 0:
        return torch.zeros(0, 3, device=device)

    # Vector from COM to pellet
    to_pellet = pellet_positions - com  # [B, 3]

    # Distance to pellet
    dist = torch.norm(to_pellet, dim=1, keepdim=True)  # [B, 1]

    # Normalize (avoid division by zero)
    direction = torch.where(
        dist > 0.01,
        to_pellet / dist,
        torch.zeros_like(to_pellet)
    )

    return direction


@torch.no_grad()
def compute_velocity_direction(
    current_com: torch.Tensor,
    previous_com: torch.Tensor,
) -> torch.Tensor:
    """
    Compute unit direction vectors of creature movement (proprioception).

    Args:
        current_com: [B, 3] current centers of mass
        previous_com: [B, 3] previous centers of mass

    Returns:
        [B, 3] unit velocity direction vectors (zeros if speed is too low)
    """
    B = current_com.shape[0]
    device = current_com.device

    if B == 0:
        return torch.zeros(0, 3, device=device)

    # Velocity vector
    velocity = current_com - previous_com  # [B, 3]

    # Speed
    speed = torch.norm(velocity, dim=1, keepdim=True)  # [B, 1]

    # Normalize (only if actually moving)
    direction = torch.where(
        speed > 0.001,
        velocity / speed,
        torch.zeros_like(velocity)
    )

    return direction


@torch.no_grad()
def compute_normalized_distance(
    com: torch.Tensor,
    pellet_positions: torch.Tensor,
    max_distance: float = MAX_PELLET_DISTANCE,
) -> torch.Tensor:
    """
    Compute normalized distance from creatures to pellets.

    Args:
        com: [B, 3] creature centers of mass
        pellet_positions: [B, 3] pellet positions
        max_distance: Maximum distance for normalization

    Returns:
        [B] normalized distances (0 = at pellet, 1 = far away)
    """
    B = com.shape[0]
    device = com.device

    if B == 0:
        return torch.zeros(0, device=device)

    # 3D distance
    dist = torch.norm(pellet_positions - com, dim=1)  # [B]

    # Normalize and clamp to [0, 1]
    normalized = torch.clamp(dist / max_distance, 0, 1)

    return normalized


@torch.no_grad()
def compute_muscle_modulation(
    batch: CreatureBatch,
    pellet_direction: torch.Tensor,
    velocity_direction: torch.Tensor,
    normalized_distance: torch.Tensor,
) -> torch.Tensor:
    """
    Compute modulation factor for each muscle based on v1/v2 features.

    Modulation formula (matching TypeScript):
        directionMod = dot(pelletDirection, directionBias) * biasStrength
        velocityMod = dot(velocityDirection, velocityBias) * velocityStrength
        distanceMod = (distanceBias * nearness) * distanceStrength
        modulation = clamp(1 + directionMod + velocityMod + distanceMod, 0.1, 2.5)

    Args:
        batch: CreatureBatch with direction_bias, velocity_bias, distance_bias, etc.
        pellet_direction: [B, 3] unit direction to pellet
        velocity_direction: [B, 3] unit velocity direction
        normalized_distance: [B] normalized distance to pellet (0=near, 1=far)

    Returns:
        [B, M] modulation factor for each muscle
    """
    B = batch.batch_size
    M = MAX_MUSCLES
    device = batch.device

    if B == 0:
        return torch.zeros(0, M, device=device)

    # Expand directions for broadcasting with muscles
    # pellet_direction: [B, 3] -> [B, 1, 3] for dot product with [B, M, 3]
    pellet_dir = pellet_direction.unsqueeze(1)  # [B, 1, 3]
    velocity_dir = velocity_direction.unsqueeze(1)  # [B, 1, 3]

    # v1: Direction modulation
    # dot product gives -1 to 1: 1 = pellet in same direction as bias
    direction_match = (pellet_dir * batch.direction_bias).sum(dim=2)  # [B, M]
    direction_mod = direction_match * batch.bias_strength  # [B, M]

    # v2: Velocity modulation (proprioception)
    # Activates when creature is moving in muscle's preferred direction
    velocity_match = (velocity_dir * batch.velocity_bias).sum(dim=2)  # [B, M]
    velocity_mod = velocity_match * batch.velocity_strength  # [B, M]

    # v2: Distance modulation
    # distanceBias > 0: activate more when NEAR (nearness = 1 - normalizedDistance)
    # distanceBias < 0: activate more when FAR
    nearness = 1.0 - normalized_distance  # [B]
    nearness = nearness.unsqueeze(1)  # [B, 1]
    distance_mod = (batch.distance_bias * nearness) * batch.distance_strength  # [B, M]

    # Combined modulation (clamped to prevent extreme values)
    modulation = torch.clamp(
        1.0 + direction_mod + velocity_mod + distance_mod,
        0.1, 2.5
    )

    # Apply spring mask (padding muscles get modulation=1)
    modulation = torch.where(
        batch.spring_mask > 0.5,
        modulation,
        torch.ones_like(modulation)
    )

    return modulation


@torch.no_grad()
def compute_modulated_rest_lengths(
    base_rest_length: torch.Tensor,
    frequency: torch.Tensor,
    amplitude: torch.Tensor,
    phase: torch.Tensor,
    global_freq_multiplier: torch.Tensor,
    modulation: torch.Tensor,
    time: float,
) -> torch.Tensor:
    """
    Compute modulated rest lengths with v1/v2 environmental modulation.

    Formula (matching TypeScript):
        baseContraction = sin(time * freq * globalFreq * 2π + phase)
        finalContraction = baseContraction * amplitude * modulation
        new_rest_length = base * (1 - finalContraction)

    Args:
        base_rest_length: [B, M] original rest lengths
        frequency: [B, M] oscillation frequencies in Hz
        amplitude: [B, M] oscillation amplitudes (0-1)
        phase: [B, M] phase offsets in radians
        global_freq_multiplier: [B] global frequency scaling
        modulation: [B, M] modulation factors from compute_muscle_modulation
        time: Current simulation time in seconds

    Returns:
        [B, M] current rest lengths after modulated oscillation
    """
    # Global freq: [B] -> [B, 1]
    global_freq = global_freq_multiplier.unsqueeze(-1)

    # Angular frequency
    angular_freq = frequency * global_freq * 2.0 * math.pi

    # Base oscillation
    base_contraction = torch.sin(time * angular_freq + phase)

    # Apply amplitude and modulation
    final_contraction = base_contraction * amplitude * modulation

    # New rest length with clamping for stability
    # Minimum rest length = 0.1 (matching TypeScript)
    new_rest_length = base_rest_length * (1.0 - final_contraction)
    new_rest_length = torch.clamp(new_rest_length, min=0.1)

    return new_rest_length


# =============================================================================
# Gravity
# =============================================================================

@torch.no_grad()
def compute_gravity_forces(batch: CreatureBatch, gravity: float = GRAVITY) -> torch.Tensor:
    """
    Compute gravity forces for all nodes.

    F = m * g (in negative Y direction)

    Args:
        batch: CreatureBatch with masses
        gravity: Gravity acceleration (default: -9.81)

    Returns:
        [B, MAX_NODES, 3] gravity forces
    """
    B = batch.batch_size
    device = batch.device

    if B == 0:
        return torch.zeros(0, MAX_NODES, 3, device=device)

    # Initialize forces
    forces = torch.zeros(B, MAX_NODES, 3, device=device)

    # Gravity force: F_y = mass * gravity
    forces[:, :, 1] = batch.masses * gravity

    # Apply node mask (no force on padding nodes)
    forces = forces * batch.node_mask.unsqueeze(-1)

    return forces


# =============================================================================
# Ground Collision
# =============================================================================

@torch.no_grad()
def apply_ground_collision(
    batch: CreatureBatch,
    ground_y: float = GROUND_Y,
    restitution: float = GROUND_RESTITUTION,
) -> None:
    """
    Apply ground collision response (in-place).

    Prevents nodes from going below ground and applies bounce/friction.

    Args:
        batch: CreatureBatch (modified in place)
        ground_y: Y position of ground plane
        restitution: Bounce coefficient (0 = no bounce, 1 = perfect bounce)
    """
    if batch.batch_size == 0:
        return

    # Get node radii from sizes (size is diameter, radius is half)
    radii = batch.sizes * 0.5  # [B, N]

    # Check which nodes are below ground (accounting for radius)
    # Node center should be at least radius above ground
    min_y = ground_y + radii  # [B, N]

    # Current y positions
    current_y = batch.positions[:, :, 1]  # [B, N]

    # Nodes that penetrated ground
    below_ground = current_y < min_y  # [B, N] boolean mask

    # Also check node_mask (don't process padding nodes)
    below_ground = below_ground & (batch.node_mask > 0.5)

    if not below_ground.any():
        return

    # Clamp positions to be above ground
    batch.positions[:, :, 1] = torch.where(
        below_ground,
        min_y,
        batch.positions[:, :, 1]
    )

    # Bounce: reverse and dampen Y velocity for colliding nodes
    # But only if moving downward (negative Y velocity)
    moving_down = batch.velocities[:, :, 1] < 0
    should_bounce = below_ground & moving_down

    batch.velocities[:, :, 1] = torch.where(
        should_bounce,
        -batch.velocities[:, :, 1] * restitution,
        batch.velocities[:, :, 1]
    )

    # Apply ground friction to horizontal velocity
    # Simple model: reduce XZ velocity when in contact with ground
    in_contact = below_ground  # Nodes touching ground
    friction_factor = 1.0 - GROUND_FRICTION * 0.1  # Scale friction effect

    batch.velocities[:, :, 0] = torch.where(
        in_contact,
        batch.velocities[:, :, 0] * friction_factor,
        batch.velocities[:, :, 0]
    )
    batch.velocities[:, :, 2] = torch.where(
        in_contact,
        batch.velocities[:, :, 2] * friction_factor,
        batch.velocities[:, :, 2]
    )


# =============================================================================
# Integration
# =============================================================================

@torch.no_grad()
def integrate_euler(
    batch: CreatureBatch,
    forces: torch.Tensor,
    dt: float = TIME_STEP,
    linear_damping: float = LINEAR_DAMPING,
) -> None:
    """
    Euler integration step for positions and velocities.

    a = F / m
    v = v + a * dt
    x = x + v * dt

    Args:
        batch: CreatureBatch (modified in place)
        forces: [B, MAX_NODES, 3] total forces on each node
        dt: Time step in seconds
        linear_damping: Velocity damping factor (0-1)
    """
    if batch.batch_size == 0:
        return

    # Compute acceleration: a = F / m
    # masses: [B, N] -> [B, N, 1]
    masses = batch.masses.unsqueeze(-1)
    masses = torch.clamp(masses, min=1e-6)  # Avoid division by zero

    acceleration = forces / masses  # [B, N, 3]

    # Apply node mask (zero acceleration for padding nodes)
    acceleration = acceleration * batch.node_mask.unsqueeze(-1)

    # Update velocity: v = v + a * dt
    batch.velocities = batch.velocities + acceleration * dt

    # Apply linear damping (time-step scaled, matches Cannon-ES behavior)
    # Cannon-ES uses linearDamping as a per-second decay rate
    # If damping=0.1, velocity should be 90% after 1 second
    # Formula: v = v * (1 - damping)^dt
    import math
    damping_factor = math.pow(1.0 - linear_damping, dt)
    batch.velocities = batch.velocities * damping_factor

    # Update position: x = x + v * dt
    batch.positions = batch.positions + batch.velocities * dt


# =============================================================================
# Full Physics Step
# =============================================================================

@torch.no_grad()
def physics_step(
    batch: CreatureBatch,
    base_rest_lengths: torch.Tensor,
    time: float,
    dt: float = TIME_STEP,
    gravity: float = GRAVITY,
) -> None:
    """
    Perform a complete physics step.

    1. Update muscle rest lengths (oscillation)
    2. Compute spring forces
    3. Add gravity forces
    4. Integrate (update velocities and positions)
    5. Apply ground collision

    Args:
        batch: CreatureBatch (modified in place)
        base_rest_lengths: [B, M] original rest lengths before oscillation
        time: Current simulation time
        dt: Time step
        gravity: Gravity acceleration
    """
    if batch.batch_size == 0:
        return

    # 1. Update muscle rest lengths based on oscillation
    batch.spring_rest_length = compute_oscillating_rest_lengths(
        base_rest_lengths,
        batch.spring_frequency,
        batch.spring_amplitude,
        batch.spring_phase,
        batch.global_freq_multiplier,
        time,
    )

    # 2. Compute spring forces
    spring_forces = compute_spring_forces(batch)

    # 3. Add gravity forces
    gravity_forces = compute_gravity_forces(batch, gravity)

    # 4. Total forces
    total_forces = spring_forces + gravity_forces

    # 5. Integrate
    integrate_euler(batch, total_forces, dt)

    # 6. Ground collision
    apply_ground_collision(batch)


@torch.no_grad()
def simulate(
    batch: CreatureBatch,
    num_steps: int,
    dt: float = TIME_STEP,
    gravity: float = GRAVITY,
    record_frames: bool = False,
    frame_interval: int = 1,
) -> dict:
    """
    Run physics simulation for multiple steps.

    Args:
        batch: CreatureBatch (modified in place)
        num_steps: Number of physics steps to run
        dt: Time step per step
        gravity: Gravity acceleration
        record_frames: Whether to record position frames
        frame_interval: Record every N frames (if recording)

    Returns:
        Dict with:
            - 'final_positions': [B, N, 3] final positions
            - 'frames': [B, num_frames, N, 3] recorded frames (if record_frames=True)
    """
    # Store base rest lengths (before any oscillation)
    base_rest_lengths = batch.spring_rest_length.clone()

    frames = []
    time = 0.0

    for step in range(num_steps):
        # Physics step
        physics_step(batch, base_rest_lengths, time, dt, gravity)
        time += dt

        # Record frame if needed
        if record_frames and (step % frame_interval == 0):
            frames.append(batch.positions.clone())

    result = {
        'final_positions': batch.positions.clone(),
    }

    if record_frames and frames:
        result['frames'] = torch.stack(frames, dim=1)  # [B, F, N, 3]

    return result


# =============================================================================
# Modulated Physics Step (with v1/v2 environmental sensing)
# =============================================================================

@torch.no_grad()
def physics_step_modulated(
    batch: CreatureBatch,
    base_rest_lengths: torch.Tensor,
    pellet_positions: torch.Tensor,
    previous_com: torch.Tensor,
    time: float,
    dt: float = TIME_STEP,
    gravity: float = GRAVITY,
) -> torch.Tensor:
    """
    Perform a physics step with v1/v2 muscle modulation.

    Unlike the basic physics_step, this uses environmental sensing:
    - Direction to pellet (v1)
    - Velocity direction (v2 proprioception)
    - Distance to pellet (v2)

    Args:
        batch: CreatureBatch (modified in place)
        base_rest_lengths: [B, M] original rest lengths
        pellet_positions: [B, 3] current pellet positions
        previous_com: [B, 3] previous center of mass (for velocity calculation)
        time: Current simulation time
        dt: Time step
        gravity: Gravity acceleration

    Returns:
        [B, 3] current center of mass (for next step's velocity calculation)
    """
    if batch.batch_size == 0:
        return torch.zeros(0, 3, device=batch.device)

    # Get current center of mass
    current_com = get_center_of_mass(batch)

    # Compute modulation factors
    pellet_direction = compute_pellet_direction(current_com, pellet_positions)
    velocity_direction = compute_velocity_direction(current_com, previous_com)
    normalized_distance = compute_normalized_distance(current_com, pellet_positions)

    modulation = compute_muscle_modulation(
        batch, pellet_direction, velocity_direction, normalized_distance
    )

    # 1. Update muscle rest lengths with modulation
    batch.spring_rest_length = compute_modulated_rest_lengths(
        base_rest_lengths,
        batch.spring_frequency,
        batch.spring_amplitude,
        batch.spring_phase,
        batch.global_freq_multiplier,
        modulation,
        time,
    )

    # 2. Compute spring forces
    spring_forces = compute_spring_forces(batch)

    # 3. Add gravity forces
    gravity_forces = compute_gravity_forces(batch, gravity)

    # 4. Total forces
    total_forces = spring_forces + gravity_forces

    # 5. Integrate
    integrate_euler(batch, total_forces, dt)

    # 6. Ground collision
    apply_ground_collision(batch)

    return current_com


@torch.no_grad()
def simulate_with_pellets(
    batch: CreatureBatch,
    pellet_positions: torch.Tensor,
    num_steps: int,
    dt: float = TIME_STEP,
    gravity: float = GRAVITY,
    record_frames: bool = False,
    frame_interval: int = 1,
) -> dict:
    """
    Run physics simulation with v1/v2 muscle modulation.

    This version uses environmental sensing for muscle modulation:
    - Direction to pellet affects muscle contraction (v1)
    - Creature velocity affects muscle contraction (v2 proprioception)
    - Distance to pellet affects muscle contraction (v2)

    Args:
        batch: CreatureBatch (modified in place)
        pellet_positions: [B, 3] pellet positions (static for this simulation)
        num_steps: Number of physics steps to run
        dt: Time step per step
        gravity: Gravity acceleration
        record_frames: Whether to record position frames
        frame_interval: Record every N frames (if recording)

    Returns:
        Dict with:
            - 'final_positions': [B, N, 3] final positions
            - 'final_com': [B, 3] final center of mass
            - 'frames': [B, num_frames, N, 3] recorded frames (if record_frames=True)
    """
    B = batch.batch_size
    device = batch.device

    if B == 0:
        return {
            'final_positions': torch.zeros(0, MAX_NODES, 3, device=device),
            'final_com': torch.zeros(0, 3, device=device),
        }

    # Store base rest lengths (before any oscillation)
    base_rest_lengths = batch.spring_rest_length.clone()

    # Initialize previous COM for velocity calculation
    previous_com = get_center_of_mass(batch)

    frames = []
    time = 0.0

    for step in range(num_steps):
        # Physics step with modulation
        current_com = physics_step_modulated(
            batch, base_rest_lengths, pellet_positions, previous_com, time, dt, gravity
        )

        # Update previous COM for next step
        previous_com = current_com
        time += dt

        # Record frame if needed
        if record_frames and (step % frame_interval == 0):
            frames.append(batch.positions.clone())

    result = {
        'final_positions': batch.positions.clone(),
        'final_com': get_center_of_mass(batch),
    }

    if record_frames and frames:
        result['frames'] = torch.stack(frames, dim=1)  # [B, F, N, 3]

    return result


@torch.no_grad()
def simulate_with_fitness(
    batch: CreatureBatch,
    pellets: "PelletBatch",
    fitness_state: "FitnessState",
    num_steps: int,
    fitness_config: "FitnessConfig",
    dt: float = TIME_STEP,
    gravity: float = GRAVITY,
    record_frames: bool = False,
    frame_interval: int = 1,
    arena_size: float = 50.0,
) -> dict:
    """
    Run physics simulation with proper pellet collection tracking.

    This version integrates with the fitness system:
    - Checks for pellet collision each step
    - Spawns new pellets when collected (opposite-half spawning)
    - Tracks closest_edge_distance for regression penalty
    - Updates distance_traveled continuously
    - Records pellet history (positions, spawn/collection frames)
    - Records fitness at each frame

    Args:
        batch: CreatureBatch (modified in place)
        pellets: PelletBatch to update during simulation
        fitness_state: FitnessState to update during simulation
        num_steps: Number of physics steps to run
        fitness_config: FitnessConfig with parameters
        dt: Time step per step
        gravity: Gravity acceleration
        record_frames: Whether to record position frames
        frame_interval: Record every N frames (if recording)
        arena_size: Arena size for pellet spawning bounds

    Returns:
        Dict with:
            - 'final_positions': [B, N, 3] final positions
            - 'final_com': [B, 3] final center of mass
            - 'frames': [B, num_frames, N, 3] recorded frames (if record_frames=True)
            - 'total_collected': [B] pellets collected per creature
            - 'pellet_history': list of dicts per creature with pellet events
            - 'fitness_per_frame': [B, F] fitness at each recorded frame
    """
    # Import here to avoid circular import
    from app.simulation.fitness import (
        check_pellet_collisions,
        update_pellets,
        update_fitness_state,
        compute_edge_distances,
        calculate_creature_xz_radius,
        calculate_fitness,
    )

    B = batch.batch_size
    device = batch.device

    if B == 0:
        return {
            'final_positions': torch.zeros(0, MAX_NODES, 3, device=device),
            'final_com': torch.zeros(0, 3, device=device),
            'total_collected': torch.zeros(0, dtype=torch.long, device=device),
            'pellet_history': [],
            'fitness_per_frame': [],
        }

    # Store base rest lengths (before any oscillation)
    base_rest_lengths = batch.spring_rest_length.clone()

    # Initialize previous COM for velocity calculation
    previous_com = get_center_of_mass(batch)

    # Initialize pellet history tracking per creature
    # Each entry: {'position': [x,y,z], 'spawned_at_frame': int, 'collected_at_frame': int or None}
    pellet_history = [[] for _ in range(B)]

    # Record initial pellet positions (spawned at frame 0)
    initial_positions = pellets.positions.cpu().tolist()
    initial_distances = pellets.initial_distances.cpu().tolist()
    for i in range(B):
        pellet_history[i].append({
            'id': 'pellet_0',
            'position': initial_positions[i],
            'spawned_at_frame': 0,
            'collected_at_frame': None,
            'initial_distance': initial_distances[i],
        })

    frames = []
    fitness_per_frame = []
    time = 0.0
    frame_index = 0

    for step in range(num_steps):
        # Physics step with modulation (uses current pellet positions for direction)
        current_com = physics_step_modulated(
            batch, base_rest_lengths, pellets.positions, previous_com, time, dt, gravity
        )

        # Update fitness state (distance traveled, closest edge distance)
        update_fitness_state(batch, fitness_state, pellets, fitness_config)

        # Check for pellet collisions and spawn new pellets
        newly_collected = check_pellet_collisions(batch, pellets)

        if newly_collected.any():
            # Record collection frame for each creature that collected
            collected_indices = torch.where(newly_collected)[0].cpu().tolist()
            for idx in collected_indices:
                # Mark the current pellet as collected at this frame
                if pellet_history[idx]:
                    pellet_history[idx][-1]['collected_at_frame'] = frame_index

            # Update pellets (spawns new ones for collectors)
            update_pellets(batch, pellets, arena_size)

            # Record new pellet positions for creatures that collected
            new_positions = pellets.positions.cpu().tolist()
            new_distances = pellets.initial_distances.cpu().tolist()
            pellet_indices = pellets.pellet_indices.cpu().tolist()
            for idx in collected_indices:
                pellet_history[idx].append({
                    'id': f'pellet_{int(pellet_indices[idx])}',
                    'position': new_positions[idx],
                    'spawned_at_frame': frame_index,
                    'collected_at_frame': None,
                    'initial_distance': new_distances[idx],
                })

            # Reset closest_edge_distance for creatures that collected
            # New initial distance is already set in update_pellets
            fitness_state.closest_edge_distance = torch.where(
                newly_collected,
                pellets.initial_distances,
                fitness_state.closest_edge_distance
            )

        # Update previous COM for next step
        previous_com = current_com
        time += dt

        # Record frame if needed
        if record_frames and (step % frame_interval == 0):
            frames.append(batch.positions.clone())

            # Calculate and record fitness at this frame
            current_fitness = calculate_fitness(
                batch, pellets, fitness_state, time, fitness_config
            )
            fitness_per_frame.append(current_fitness.clone())
            frame_index += 1

    result = {
        'final_positions': batch.positions.clone(),
        'final_com': get_center_of_mass(batch),
        'total_collected': pellets.total_collected.clone(),
        'pellet_history': pellet_history,
    }

    if record_frames and frames:
        result['frames'] = torch.stack(frames, dim=1)  # [B, F, N, 3]
        if fitness_per_frame:
            result['fitness_per_frame'] = torch.stack(fitness_per_frame, dim=1)  # [B, F]

    return result


# =============================================================================
# Neural Network Integration
# =============================================================================

@torch.no_grad()
def compute_neural_rest_lengths(
    batch: CreatureBatch,
    base_rest_lengths: torch.Tensor,
    nn_outputs: torch.Tensor,
    time: float,
    mode: str = 'hybrid',
) -> torch.Tensor:
    """
    Compute muscle rest lengths from neural network outputs.

    Pure mode: NN directly controls contraction
        contraction = nn_output * amplitude
        rest_length = base * (1 - contraction)

    Hybrid mode: NN modulates base oscillator
        base_contraction = sin(time * frequency * 2*pi + phase)
        nn_modulation = 0.5 + (nn_output + 1) * 0.5  # Maps [-1,1] to [0.5, 1.5]
        contraction = base_contraction * amplitude * nn_modulation
        rest_length = base * (1 - contraction)

    Args:
        batch: CreatureBatch
        base_rest_lengths: [B, M] original rest lengths
        nn_outputs: [B, M] neural network outputs in [-1, 1] range
        time: Current simulation time
        mode: 'pure' or 'hybrid'

    Returns:
        [B, M] modulated rest lengths
    """
    if batch.batch_size == 0:
        return torch.zeros(0, MAX_MUSCLES, device=batch.device)

    # Get muscle parameters
    frequency = batch.spring_frequency  # [B, M]
    amplitude = batch.spring_amplitude  # [B, M]
    phase = batch.spring_phase          # [B, M]
    mask = batch.spring_mask            # [B, M]
    global_freq = batch.global_freq_multiplier.unsqueeze(1)  # [B, 1]

    # Apply global frequency multiplier
    effective_freq = frequency * global_freq

    if mode == 'pure':
        # Pure mode: NN directly controls contraction
        # NN output is already in [-1, 1], map to contraction
        contraction = nn_outputs * amplitude
    else:
        # Hybrid mode: NN modulates base oscillator
        base_contraction = torch.sin(time * effective_freq * 2 * math.pi + phase)
        # Map NN output [-1, 1] to modulation [0.5, 1.5]
        nn_modulation = 0.5 + (nn_outputs + 1) * 0.5
        contraction = base_contraction * amplitude * nn_modulation

    # Compute rest lengths
    rest_lengths = base_rest_lengths * (1 - contraction)

    # Clamp rest lengths (same as TypeScript: always positive)
    rest_lengths = torch.clamp(rest_lengths, min=0.01)

    # Mask invalid muscles
    rest_lengths = rest_lengths * mask + base_rest_lengths * (1 - mask)

    return rest_lengths


@torch.no_grad()
def physics_step_neural(
    batch: CreatureBatch,
    base_rest_lengths: torch.Tensor,
    nn_outputs: torch.Tensor,
    time: float,
    mode: str = 'hybrid',
    dt: float = TIME_STEP,
    gravity: float = GRAVITY,
) -> tuple[torch.Tensor, torch.Tensor]:
    """
    Perform a physics step with neural network control.

    Args:
        batch: CreatureBatch (modified in place)
        base_rest_lengths: [B, M] original rest lengths
        nn_outputs: [B, M] neural network outputs in [-1, 1] range
        time: Current simulation time
        mode: 'pure' or 'hybrid'
        dt: Time step
        gravity: Gravity acceleration

    Returns:
        Tuple of:
            - [B, 3] current center of mass
            - [B] total muscle activation (sum of |nn_output|) for efficiency penalty
    """
    if batch.batch_size == 0:
        return torch.zeros(0, 3, device=batch.device), torch.zeros(0, device=batch.device)

    # Compute rest lengths from NN outputs
    batch.spring_rest_length = compute_neural_rest_lengths(
        batch, base_rest_lengths, nn_outputs, time, mode
    )

    # Compute spring forces
    forces = compute_spring_forces(batch)

    # Add gravity
    gravity_forces = compute_gravity_forces(batch, gravity)
    forces = forces + gravity_forces

    # Integrate
    integrate_euler(batch, forces, dt)

    # Ground collision
    apply_ground_collision(batch)

    # Compute muscle activation for efficiency penalty
    # Sum of absolute NN outputs for valid muscles
    muscle_activation = (torch.abs(nn_outputs) * batch.spring_mask).sum(dim=1)  # [B]

    return get_center_of_mass(batch), muscle_activation


@torch.no_grad()
def simulate_with_neural(
    batch: CreatureBatch,
    neural_network,  # BatchedNeuralNetwork
    pellet_positions: torch.Tensor,
    num_steps: int,
    mode: str = 'hybrid',
    dead_zone: float = 0.1,
    dt: float = TIME_STEP,
    gravity: float = GRAVITY,
    record_frames: bool = False,
    frame_interval: int = 1,
) -> dict:
    """
    Run physics simulation with neural network control.

    Each timestep:
    1. Gather sensor inputs (pellet direction, velocity, distance, time phase)
    2. Run NN forward pass
    3. Apply outputs to muscles
    4. Run physics step

    Args:
        batch: CreatureBatch (modified in place)
        neural_network: BatchedNeuralNetwork instance
        pellet_positions: [B, 3] pellet positions
        num_steps: Number of physics steps
        mode: 'pure' or 'hybrid'
        dead_zone: Dead zone threshold for pure mode
        dt: Time step
        gravity: Gravity acceleration
        record_frames: Whether to record position frames
        frame_interval: Record every N frames

    Returns:
        Dict with:
            - 'final_positions': [B, N, 3] final positions
            - 'final_com': [B, 3] final center of mass
            - 'total_activation': [B] total muscle activation (for efficiency penalty)
            - 'frames': [B, F, N, 3] recorded frames (if record_frames=True)
    """
    from app.neural.sensors import gather_sensor_inputs

    B = batch.batch_size
    device = batch.device

    if B == 0:
        return {
            'final_positions': torch.zeros(0, MAX_NODES, 3, device=device),
            'final_com': torch.zeros(0, 3, device=device),
            'total_activation': torch.zeros(0, device=device),
        }

    # Store base rest lengths
    base_rest_lengths = batch.spring_rest_length.clone()

    # Initialize previous COM for velocity calculation
    previous_com = get_center_of_mass(batch)

    # Accumulators
    total_activation = torch.zeros(B, device=device)
    frames = []
    time = 0.0

    for step in range(num_steps):
        # 1. Gather sensor inputs
        sensor_inputs = gather_sensor_inputs(
            batch, pellet_positions, previous_com, time, mode=mode
        )

        # 2. Forward pass through NN
        if mode == 'pure':
            nn_outputs = neural_network.forward_with_dead_zone(sensor_inputs, dead_zone)
        else:
            nn_outputs = neural_network.forward(sensor_inputs)

        # 3. Physics step with neural control
        current_com, step_activation = physics_step_neural(
            batch, base_rest_lengths, nn_outputs, time, mode, dt, gravity
        )

        # 4. Accumulate activation
        total_activation += step_activation
        previous_com = current_com
        time += dt

        # Record frame if needed
        if record_frames and (step % frame_interval == 0):
            frames.append(batch.positions.clone())

    result = {
        'final_positions': batch.positions.clone(),
        'final_com': get_center_of_mass(batch),
        'total_activation': total_activation,
    }

    if record_frames and frames:
        result['frames'] = torch.stack(frames, dim=1)  # [B, F, N, 3]

    return result


@torch.no_grad()
def simulate_with_fitness_neural(
    batch: CreatureBatch,
    neural_network,  # BatchedNeuralNetwork
    pellets: "PelletBatch",
    fitness_state: "FitnessState",
    num_steps: int,
    fitness_config: "FitnessConfig",
    mode: str = 'hybrid',
    dead_zone: float = 0.1,
    dt: float = TIME_STEP,
    gravity: float = GRAVITY,
    record_frames: bool = False,
    frame_interval: int = 1,
    arena_size: float = 50.0,
) -> dict:
    """
    Run neural simulation with proper pellet collection tracking.

    Integrates neural network control with the fitness system:
    - Checks for pellet collision each step
    - Spawns new pellets when collected (opposite-half spawning)
    - Tracks closest_edge_distance for regression penalty
    - Updates distance_traveled continuously
    - Accumulates muscle activation for efficiency penalty
    - Records pellet history (positions, spawn/collection frames)
    - Records fitness at each frame

    Args:
        batch: CreatureBatch (modified in place)
        neural_network: BatchedNeuralNetwork for control
        pellets: PelletBatch to update during simulation
        fitness_state: FitnessState to update during simulation
        num_steps: Number of physics steps to run
        fitness_config: FitnessConfig with parameters
        mode: 'pure' or 'hybrid' neural control mode
        dead_zone: Dead zone threshold for pure mode
        dt: Time step per step
        gravity: Gravity acceleration
        record_frames: Whether to record position frames
        frame_interval: Record every N frames (if recording)
        arena_size: Arena size for pellet spawning bounds

    Returns:
        Dict with:
            - 'final_positions': [B, N, 3] final positions
            - 'final_com': [B, 3] final center of mass
            - 'total_activation': [B] total muscle activation
            - 'frames': [B, num_frames, N, 3] recorded frames (if record_frames=True)
            - 'total_collected': [B] pellets collected per creature
            - 'pellet_history': list of dicts per creature with pellet events
            - 'fitness_per_frame': [B, F] fitness at each recorded frame
    """
    # Import here to avoid circular import
    from app.simulation.fitness import (
        check_pellet_collisions,
        update_pellets,
        update_fitness_state,
        calculate_fitness,
    )
    from app.neural.sensors import gather_sensor_inputs

    B = batch.batch_size
    device = batch.device

    if B == 0:
        return {
            'final_positions': torch.zeros(0, MAX_NODES, 3, device=device),
            'final_com': torch.zeros(0, 3, device=device),
            'total_activation': torch.zeros(0, device=device),
            'total_collected': torch.zeros(0, dtype=torch.long, device=device),
            'pellet_history': [],
            'fitness_per_frame': [],
        }

    # Store base rest lengths
    base_rest_lengths = batch.spring_rest_length.clone()

    # Initialize previous COM for velocity calculation
    previous_com = get_center_of_mass(batch)

    # Initialize pellet history tracking per creature
    pellet_history = [[] for _ in range(B)]

    # Record initial pellet positions (spawned at frame 0)
    initial_positions = pellets.positions.cpu().tolist()
    initial_distances = pellets.initial_distances.cpu().tolist()
    for i in range(B):
        pellet_history[i].append({
            'id': 'pellet_0',
            'position': initial_positions[i],
            'spawned_at_frame': 0,
            'collected_at_frame': None,
            'initial_distance': initial_distances[i],
        })

    # Accumulators
    total_activation = torch.zeros(B, device=device)
    frames = []
    fitness_per_frame = []
    time = 0.0
    frame_index = 0

    for step in range(num_steps):
        # 1. Gather sensor inputs (uses current pellet positions)
        sensor_inputs = gather_sensor_inputs(
            batch, pellets.positions, previous_com, time, mode=mode
        )

        # 2. Forward pass through NN
        if mode == 'pure':
            nn_outputs = neural_network.forward_with_dead_zone(sensor_inputs, dead_zone)
        else:
            nn_outputs = neural_network.forward(sensor_inputs)

        # 3. Physics step with neural control
        current_com, step_activation = physics_step_neural(
            batch, base_rest_lengths, nn_outputs, time, mode, dt, gravity
        )

        # 4. Accumulate activation
        total_activation += step_activation

        # 5. Update fitness state (distance traveled, closest edge distance)
        update_fitness_state(batch, fitness_state, pellets, fitness_config)

        # 6. Also track total activation in fitness state
        fitness_state.total_activation += step_activation

        # 7. Check for pellet collisions and spawn new pellets
        newly_collected = check_pellet_collisions(batch, pellets)

        if newly_collected.any():
            # Record collection frame for each creature that collected
            collected_indices = torch.where(newly_collected)[0].cpu().tolist()
            for idx in collected_indices:
                if pellet_history[idx]:
                    pellet_history[idx][-1]['collected_at_frame'] = frame_index

            # Update pellets (spawns new ones for collectors)
            update_pellets(batch, pellets, arena_size)

            # Record new pellet positions
            new_positions = pellets.positions.cpu().tolist()
            new_distances = pellets.initial_distances.cpu().tolist()
            pellet_indices = pellets.pellet_indices.cpu().tolist()
            for idx in collected_indices:
                pellet_history[idx].append({
                    'id': f'pellet_{int(pellet_indices[idx])}',
                    'position': new_positions[idx],
                    'spawned_at_frame': frame_index,
                    'collected_at_frame': None,
                    'initial_distance': new_distances[idx],
                })

            # Reset closest_edge_distance for creatures that collected
            fitness_state.closest_edge_distance = torch.where(
                newly_collected,
                pellets.initial_distances,
                fitness_state.closest_edge_distance
            )

        # Update previous COM
        previous_com = current_com
        time += dt

        # Record frame if needed
        if record_frames and (step % frame_interval == 0):
            frames.append(batch.positions.clone())

            # Calculate and record fitness at this frame
            current_fitness = calculate_fitness(
                batch, pellets, fitness_state, time, fitness_config
            )
            fitness_per_frame.append(current_fitness.clone())
            frame_index += 1

    result = {
        'final_positions': batch.positions.clone(),
        'final_com': get_center_of_mass(batch),
        'total_activation': total_activation,
        'total_collected': pellets.total_collected.clone(),
        'pellet_history': pellet_history,
    }

    if record_frames and frames:
        result['frames'] = torch.stack(frames, dim=1)  # [B, F, N, 3]
        if fitness_per_frame:
            result['fitness_per_frame'] = torch.stack(fitness_per_frame, dim=1)  # [B, F]

    return result
