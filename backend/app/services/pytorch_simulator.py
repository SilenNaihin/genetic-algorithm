"""
PyTorch-based simulation service.

Bridges the API layer to the PyTorch physics engine.
Handles genome conversion, batched simulation, and result formatting.
"""

import time
from typing import Any

import torch

from app.schemas.simulation import (
    SimulationConfig as ApiSimulationConfig,
    SimulationResult,
    FitnessBreakdown,
)
from app.simulation.config import SimulationConfig as EngineConfig
from app.simulation.tensors import creature_genomes_to_batch, get_center_of_mass
from app.simulation.physics import (
    simulate_with_pellets,
    simulate_with_neural,
    TIME_STEP,
)
from app.simulation.fitness import (
    FitnessConfig,
    initialize_pellets,
    initialize_fitness_state,
    update_fitness_state,
    calculate_fitness,
    check_frequency_violations,
)
from app.neural.network import BatchedNeuralNetwork, NeuralConfig


class PyTorchSimulator:
    """
    Service for running batched physics simulations using PyTorch.

    Handles:
    - Genome format conversion (API -> tensor)
    - Batched simulation (oscillator or neural mode)
    - Result extraction and formatting (tensor -> API)
    """

    def __init__(self, device: torch.device | None = None):
        """Initialize simulator with optional device override."""
        if device is None:
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.device = device

    def simulate_batch(
        self,
        genomes: list[dict[str, Any]],
        config: ApiSimulationConfig | dict | None = None,
    ) -> list[SimulationResult]:
        """
        Simulate a batch of creatures and return results.

        Args:
            genomes: List of genome dicts (from API, may be camelCase or snake_case)
            config: Simulation configuration (API schema or dict)

        Returns:
            List of SimulationResult for each creature
        """
        if not genomes:
            return []

        # Convert config
        if config is None:
            config = ApiSimulationConfig()
        elif isinstance(config, dict):
            config = ApiSimulationConfig(**config)

        # Convert to engine config
        engine_config = self._api_to_engine_config(config)
        fitness_config = self._api_to_fitness_config(config)

        # Convert genomes to tensor batch
        batch = creature_genomes_to_batch(genomes, device=self.device)

        # Check for frequency violations before simulation
        freq_violations = check_frequency_violations(batch, fitness_config)

        # Initialize pellets and fitness state
        pellet_batch = initialize_pellets(batch, arena_size=config.arena_size)
        fitness_state = initialize_fitness_state(batch)

        # Calculate number of simulation steps
        num_steps = int(config.simulation_duration / TIME_STEP)

        # Get pellet positions for simulation - already [B, 3]
        pellet_positions = pellet_batch.positions

        # Store initial positions for displacement tracking
        initial_com = get_center_of_mass(batch).clone()

        # Run simulation based on controller type
        use_neural = config.use_neural_net and self._has_neural_genomes(genomes)

        if use_neural:
            # Create batched neural network
            neural_genomes = [g.get("neuralGenome") or g.get("neural_genome") for g in genomes]
            num_muscles = [len(g.get("muscles", [])) for g in genomes]

            nn_config = NeuralConfig(
                neural_mode=config.neural_mode,
                hidden_size=config.neural_hidden_size,
                activation=config.neural_activation,
            )

            network = BatchedNeuralNetwork.from_genomes(
                neural_genomes=neural_genomes,
                num_muscles=num_muscles,
                config=nn_config,
            )

            # Run neural simulation
            result = simulate_with_neural(
                batch=batch,
                neural_network=network,
                pellet_positions=pellet_positions,
                num_steps=num_steps,
                mode=config.neural_mode,
                dead_zone=config.neural_dead_zone,
                record_frames=config.record_frames,
                frame_interval=int(60 / config.frame_rate) if config.record_frames else 1,
            )
            total_activation = result.get('total_activation', torch.zeros(batch.batch_size))
        else:
            # Run oscillator simulation
            result = simulate_with_pellets(
                batch=batch,
                pellet_positions=pellet_positions,
                num_steps=num_steps,
                record_frames=config.record_frames,
                frame_interval=int(60 / config.frame_rate) if config.record_frames else 1,
            )
            total_activation = torch.zeros(batch.batch_size, device=self.device)

        # Update fitness state with final positions
        batch.positions = result['final_positions']
        update_fitness_state(batch, fitness_state, fitness_config)

        # Calculate fitness
        simulation_time = num_steps * TIME_STEP
        fitness_values = calculate_fitness(
            batch, pellet_batch, fitness_state, simulation_time, fitness_config
        )

        # Build results
        results = []
        for i in range(batch.batch_size):
            genome_id = genomes[i].get("id", f"creature_{i}")

            # Check disqualification
            disqualified = False
            disqualified_reason = None

            if freq_violations[i]:
                disqualified = True
                disqualified_reason = "high_frequency"
            elif torch.any(torch.isnan(result['final_positions'][i])):
                disqualified = True
                disqualified_reason = "physics_explosion"

            # Calculate displacement metrics
            final_com = result['final_com'][i]
            net_displacement = torch.norm(
                final_com[[0, 2]] - initial_com[i][[0, 2]]
            ).item()  # XZ only
            distance_traveled = fitness_state.distance_traveled[i].item()

            # Get pellet info from pellet_batch
            pellets_collected = int(pellet_batch.total_collected[i].item())

            # Calculate progress (estimate from current state)
            # Progress is based on how close we got to pellets
            progress_score = min(
                fitness_config.progress_max,
                net_displacement * fitness_config.distance_per_unit
            )

            # Build fitness breakdown
            breakdown = FitnessBreakdown(
                pellet_points=pellets_collected * fitness_config.pellet_points,
                progress=progress_score,
                net_displacement=min(
                    net_displacement * fitness_config.distance_per_unit,
                    fitness_config.net_displacement_max
                ),
                distance_traveled=min(
                    distance_traveled * fitness_config.distance_per_unit,
                    fitness_config.distance_traveled_max
                ),
                efficiency_penalty=total_activation[i].item() * fitness_config.efficiency_penalty if use_neural else 0.0,
            )

            # Get frames if recorded
            frames = None
            frame_count = 0
            if config.record_frames and 'frames' in result:
                # Convert tensor frames to list format
                frames_tensor = result['frames'][i]  # [F, N, 3]
                frame_count = frames_tensor.shape[0]
                frames = frames_tensor.cpu().tolist()

            results.append(SimulationResult(
                genome_id=genome_id,
                fitness=0.0 if disqualified else fitness_values[i].item(),
                pellets_collected=pellets_collected,
                disqualified=disqualified,
                disqualified_reason=disqualified_reason,
                fitness_breakdown=breakdown,
                net_displacement=net_displacement,
                distance_traveled=distance_traveled,
                total_activation=total_activation[i].item(),
                frame_count=frame_count,
                frames=frames,
            ))

        return results

    def _api_to_engine_config(self, api_config: ApiSimulationConfig) -> EngineConfig:
        """Convert API config to engine config."""
        return EngineConfig(
            gravity=api_config.gravity,
            ground_friction=api_config.ground_friction,
            time_step=api_config.time_step,
            simulation_duration=api_config.simulation_duration,
            population_size=api_config.population_size,
            cull_percentage=api_config.cull_percentage,
            mutation_rate=api_config.mutation_rate,
            mutation_magnitude=api_config.mutation_magnitude,
            crossover_rate=api_config.crossover_rate,
            elite_count=api_config.elite_count,
            use_mutation=api_config.use_mutation,
            use_crossover=api_config.use_crossover,
            min_nodes=api_config.min_nodes,
            max_nodes=api_config.max_nodes,
            max_muscles=api_config.max_muscles,
            max_allowed_frequency=api_config.max_allowed_frequency,
            pellet_count=api_config.pellet_count,
            arena_size=api_config.arena_size,
            fitness_pellet_points=api_config.fitness_pellet_points,
            fitness_progress_max=api_config.fitness_progress_max,
            fitness_net_displacement_max=api_config.fitness_net_displacement_max,
            fitness_distance_per_unit=api_config.fitness_distance_per_unit,
            fitness_distance_traveled_max=api_config.fitness_distance_traveled_max,
            fitness_regression_penalty=api_config.fitness_regression_penalty,
            use_neural_net=api_config.use_neural_net,
            neural_mode=api_config.neural_mode,
            neural_hidden_size=api_config.neural_hidden_size,
            neural_activation=api_config.neural_activation,
            weight_mutation_rate=api_config.weight_mutation_rate,
            weight_mutation_magnitude=api_config.weight_mutation_magnitude,
            weight_mutation_decay=api_config.weight_mutation_decay,
            neural_output_bias=api_config.neural_output_bias,
            fitness_efficiency_penalty=api_config.fitness_efficiency_penalty,
            neural_dead_zone=api_config.neural_dead_zone,
            position_threshold=api_config.position_threshold,
            height_threshold=api_config.height_threshold,
            pellet_collection_radius=api_config.pellet_collection_radius,
            max_pellet_distance=api_config.max_pellet_distance,
        )

    def _api_to_fitness_config(self, api_config: ApiSimulationConfig) -> FitnessConfig:
        """Convert API config to fitness config."""
        return FitnessConfig(
            pellet_points=api_config.fitness_pellet_points,
            progress_max=api_config.fitness_progress_max,
            net_displacement_max=api_config.fitness_net_displacement_max,
            distance_per_unit=api_config.fitness_distance_per_unit,
            distance_traveled_max=api_config.fitness_distance_traveled_max,
            regression_penalty=api_config.fitness_regression_penalty,
            efficiency_penalty=api_config.fitness_efficiency_penalty,
            max_allowed_frequency=api_config.max_allowed_frequency,
            position_threshold=api_config.position_threshold,
            height_threshold=api_config.height_threshold,
            pellet_collection_radius=api_config.pellet_collection_radius,
        )

    def _has_neural_genomes(self, genomes: list[dict]) -> bool:
        """Check if any genome has neural network weights."""
        for g in genomes:
            controller = g.get("controllerType") or g.get("controller_type", "oscillator")
            if controller == "neural":
                neural = g.get("neuralGenome") or g.get("neural_genome")
                if neural is not None:
                    return True
        return False
