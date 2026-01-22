"""
Batched tensor data structures for PyTorch physics simulation.

All creatures are represented as batched tensors for parallel simulation.
Variable-size creatures (2-8 nodes, 1-15 muscles) are padded to max size
with masks indicating valid elements.

Device-agnostic: works on CPU or CUDA with same code.
"""

from dataclasses import dataclass
from typing import Any

import torch

# Maximum sizes for padding (matches TypeScript GenomeConstraints)
MAX_NODES = 8
MAX_MUSCLES = 15


@dataclass
class CreatureBatch:
    """
    Batched representation of multiple creatures for parallel simulation.

    All tensors have batch dimension B (number of creatures).
    Masks indicate which elements are valid (not padding).
    """

    # Device (cpu or cuda)
    device: torch.device

    # Batch size
    batch_size: int

    # Node data [B, MAX_NODES, ...]
    positions: torch.Tensor      # [B, MAX_NODES, 3] - xyz positions
    velocities: torch.Tensor     # [B, MAX_NODES, 3] - xyz velocities
    masses: torch.Tensor         # [B, MAX_NODES] - node masses
    sizes: torch.Tensor          # [B, MAX_NODES] - node sizes (radii)
    frictions: torch.Tensor      # [B, MAX_NODES] - surface friction
    node_mask: torch.Tensor      # [B, MAX_NODES] - 1.0 where node exists, 0.0 for padding
    node_counts: torch.Tensor    # [B] - actual node count per creature

    # Spring/muscle data [B, MAX_MUSCLES, ...]
    spring_node_a: torch.Tensor  # [B, MAX_MUSCLES] - index of first node (0-7)
    spring_node_b: torch.Tensor  # [B, MAX_MUSCLES] - index of second node (0-7)
    spring_rest_length: torch.Tensor   # [B, MAX_MUSCLES] - rest length
    spring_stiffness: torch.Tensor     # [B, MAX_MUSCLES] - spring constant k
    spring_damping: torch.Tensor       # [B, MAX_MUSCLES] - damping coefficient
    spring_frequency: torch.Tensor     # [B, MAX_MUSCLES] - oscillation frequency (Hz)
    spring_amplitude: torch.Tensor     # [B, MAX_MUSCLES] - oscillation amplitude
    spring_phase: torch.Tensor         # [B, MAX_MUSCLES] - phase offset (radians)
    spring_mask: torch.Tensor          # [B, MAX_MUSCLES] - 1.0 where muscle exists
    muscle_counts: torch.Tensor        # [B] - actual muscle count per creature

    # Direction bias (v1) [B, MAX_MUSCLES, 3]
    direction_bias: torch.Tensor       # [B, MAX_MUSCLES, 3] - unit vector
    bias_strength: torch.Tensor        # [B, MAX_MUSCLES] - 0-1 modulation strength

    # Velocity sensing (v2) [B, MAX_MUSCLES, 3]
    velocity_bias: torch.Tensor        # [B, MAX_MUSCLES, 3] - unit vector
    velocity_strength: torch.Tensor    # [B, MAX_MUSCLES] - 0-1 modulation strength

    # Distance awareness (v2)
    distance_bias: torch.Tensor        # [B, MAX_MUSCLES] - -1 to 1
    distance_strength: torch.Tensor    # [B, MAX_MUSCLES] - 0-1 modulation strength

    # Global multipliers [B]
    global_freq_multiplier: torch.Tensor   # [B] - scales all frequencies

    # Creature metadata (not tensors, for tracking)
    genome_ids: list[str]              # Original genome IDs

    def to(self, device: torch.device) -> "CreatureBatch":
        """Move all tensors to specified device."""
        return CreatureBatch(
            device=device,
            batch_size=self.batch_size,
            positions=self.positions.to(device),
            velocities=self.velocities.to(device),
            masses=self.masses.to(device),
            sizes=self.sizes.to(device),
            frictions=self.frictions.to(device),
            node_mask=self.node_mask.to(device),
            node_counts=self.node_counts.to(device),
            spring_node_a=self.spring_node_a.to(device),
            spring_node_b=self.spring_node_b.to(device),
            spring_rest_length=self.spring_rest_length.to(device),
            spring_stiffness=self.spring_stiffness.to(device),
            spring_damping=self.spring_damping.to(device),
            spring_frequency=self.spring_frequency.to(device),
            spring_amplitude=self.spring_amplitude.to(device),
            spring_phase=self.spring_phase.to(device),
            spring_mask=self.spring_mask.to(device),
            muscle_counts=self.muscle_counts.to(device),
            direction_bias=self.direction_bias.to(device),
            bias_strength=self.bias_strength.to(device),
            velocity_bias=self.velocity_bias.to(device),
            velocity_strength=self.velocity_strength.to(device),
            distance_bias=self.distance_bias.to(device),
            distance_strength=self.distance_strength.to(device),
            global_freq_multiplier=self.global_freq_multiplier.to(device),
            genome_ids=self.genome_ids,
        )


def creature_genomes_to_batch(
    genomes: list[dict[str, Any]],
    device: torch.device | None = None,
) -> CreatureBatch:
    """
    Convert a list of creature genome dicts to batched tensors.

    Args:
        genomes: List of genome dicts (matching TypeScript CreatureGenome structure)
        device: Target device (cpu/cuda). Defaults to cpu.

    Returns:
        CreatureBatch with all creatures batched together
    """
    if device is None:
        device = torch.device("cpu")

    B = len(genomes)

    # Initialize tensors with zeros (padding)
    positions = torch.zeros(B, MAX_NODES, 3, device=device)
    velocities = torch.zeros(B, MAX_NODES, 3, device=device)
    masses = torch.zeros(B, MAX_NODES, device=device)
    sizes = torch.zeros(B, MAX_NODES, device=device)
    frictions = torch.zeros(B, MAX_NODES, device=device)
    node_mask = torch.zeros(B, MAX_NODES, device=device)
    node_counts = torch.zeros(B, dtype=torch.long, device=device)

    spring_node_a = torch.zeros(B, MAX_MUSCLES, dtype=torch.long, device=device)
    spring_node_b = torch.zeros(B, MAX_MUSCLES, dtype=torch.long, device=device)
    spring_rest_length = torch.zeros(B, MAX_MUSCLES, device=device)
    spring_stiffness = torch.zeros(B, MAX_MUSCLES, device=device)
    spring_damping = torch.zeros(B, MAX_MUSCLES, device=device)
    spring_frequency = torch.zeros(B, MAX_MUSCLES, device=device)
    spring_amplitude = torch.zeros(B, MAX_MUSCLES, device=device)
    spring_phase = torch.zeros(B, MAX_MUSCLES, device=device)
    spring_mask = torch.zeros(B, MAX_MUSCLES, device=device)
    muscle_counts = torch.zeros(B, dtype=torch.long, device=device)

    direction_bias = torch.zeros(B, MAX_MUSCLES, 3, device=device)
    bias_strength = torch.zeros(B, MAX_MUSCLES, device=device)
    velocity_bias = torch.zeros(B, MAX_MUSCLES, 3, device=device)
    velocity_strength = torch.zeros(B, MAX_MUSCLES, device=device)
    distance_bias = torch.zeros(B, MAX_MUSCLES, device=device)
    distance_strength = torch.zeros(B, MAX_MUSCLES, device=device)

    global_freq_multiplier = torch.ones(B, device=device)

    genome_ids = []

    for b, genome in enumerate(genomes):
        genome_ids.append(genome.get("id", f"genome_{b}"))

        nodes = genome.get("nodes", [])
        muscles = genome.get("muscles", [])

        # Build node ID -> index mapping
        node_id_to_idx: dict[str, int] = {}

        # Process nodes
        num_nodes = min(len(nodes), MAX_NODES)
        node_counts[b] = num_nodes

        for i, node in enumerate(nodes[:MAX_NODES]):
            node_id_to_idx[node["id"]] = i

            pos = node.get("position", {"x": 0, "y": 0.5, "z": 0})
            positions[b, i, 0] = pos.get("x", 0)
            positions[b, i, 1] = pos.get("y", 0.5) + 1.0  # Spawn above ground (matches TS)
            positions[b, i, 2] = pos.get("z", 0)

            # Calculate mass from size (matches TypeScript formula)
            size = node.get("size", 0.5)
            radius = size * 0.5
            mass = (4 / 3) * 3.14159 * (radius ** 3) * 10  # Density factor

            sizes[b, i] = size
            masses[b, i] = mass
            frictions[b, i] = node.get("friction", 0.5)
            node_mask[b, i] = 1.0

        # Process muscles
        num_muscles = 0
        for j, muscle in enumerate(muscles[:MAX_MUSCLES]):
            node_a_id = muscle.get("nodeA", muscle.get("node_a", ""))
            node_b_id = muscle.get("nodeB", muscle.get("node_b", ""))

            # Skip if nodes don't exist
            if node_a_id not in node_id_to_idx or node_b_id not in node_id_to_idx:
                continue

            idx_a = node_id_to_idx[node_a_id]
            idx_b = node_id_to_idx[node_b_id]

            spring_node_a[b, num_muscles] = idx_a
            spring_node_b[b, num_muscles] = idx_b
            spring_rest_length[b, num_muscles] = muscle.get("restLength", muscle.get("rest_length", 1.0))
            spring_stiffness[b, num_muscles] = muscle.get("stiffness", 100.0)
            spring_damping[b, num_muscles] = muscle.get("damping", 0.1)
            spring_frequency[b, num_muscles] = muscle.get("frequency", 1.0)
            spring_amplitude[b, num_muscles] = muscle.get("amplitude", 0.2)
            spring_phase[b, num_muscles] = muscle.get("phase", 0.0)
            spring_mask[b, num_muscles] = 1.0

            # Direction bias (v1)
            dir_bias = muscle.get("directionBias", muscle.get("direction_bias", {"x": 0, "y": 1, "z": 0}))
            direction_bias[b, num_muscles, 0] = dir_bias.get("x", 0)
            direction_bias[b, num_muscles, 1] = dir_bias.get("y", 1)
            direction_bias[b, num_muscles, 2] = dir_bias.get("z", 0)
            bias_strength[b, num_muscles] = muscle.get("biasStrength", muscle.get("bias_strength", 0))

            # Velocity sensing (v2)
            vel_bias = muscle.get("velocityBias", muscle.get("velocity_bias", {"x": 0, "y": 1, "z": 0}))
            velocity_bias[b, num_muscles, 0] = vel_bias.get("x", 0)
            velocity_bias[b, num_muscles, 1] = vel_bias.get("y", 1)
            velocity_bias[b, num_muscles, 2] = vel_bias.get("z", 0)
            velocity_strength[b, num_muscles] = muscle.get("velocityStrength", muscle.get("velocity_strength", 0))

            # Distance awareness (v2)
            distance_bias[b, num_muscles] = muscle.get("distanceBias", muscle.get("distance_bias", 0))
            distance_strength[b, num_muscles] = muscle.get("distanceStrength", muscle.get("distance_strength", 0))

            num_muscles += 1

        muscle_counts[b] = num_muscles

        # Global frequency multiplier
        global_freq_multiplier[b] = genome.get("globalFrequencyMultiplier",
                                                genome.get("global_frequency_multiplier", 1.0))

    return CreatureBatch(
        device=device,
        batch_size=B,
        positions=positions,
        velocities=velocities,
        masses=masses,
        sizes=sizes,
        frictions=frictions,
        node_mask=node_mask,
        node_counts=node_counts,
        spring_node_a=spring_node_a,
        spring_node_b=spring_node_b,
        spring_rest_length=spring_rest_length,
        spring_stiffness=spring_stiffness,
        spring_damping=spring_damping,
        spring_frequency=spring_frequency,
        spring_amplitude=spring_amplitude,
        spring_phase=spring_phase,
        spring_mask=spring_mask,
        muscle_counts=muscle_counts,
        direction_bias=direction_bias,
        bias_strength=bias_strength,
        velocity_bias=velocity_bias,
        velocity_strength=velocity_strength,
        distance_bias=distance_bias,
        distance_strength=distance_strength,
        global_freq_multiplier=global_freq_multiplier,
        genome_ids=genome_ids,
    )


def get_center_of_mass(batch: CreatureBatch) -> torch.Tensor:
    """
    Calculate center of mass for each creature in batch.

    Args:
        batch: CreatureBatch with positions and masses

    Returns:
        [B, 3] tensor of center of mass positions
    """
    # Weighted sum of positions by mass
    # positions: [B, N, 3], masses: [B, N]
    weighted_pos = batch.positions * batch.masses.unsqueeze(-1) * batch.node_mask.unsqueeze(-1)
    total_mass = (batch.masses * batch.node_mask).sum(dim=1, keepdim=True)  # [B, 1]

    # Avoid division by zero
    total_mass = torch.clamp(total_mass, min=1e-6)

    com = weighted_pos.sum(dim=1) / total_mass  # [B, 3]
    return com


def get_default_device() -> torch.device:
    """Get the best available device (CUDA if available, else CPU)."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")
