"""
PyTorch-based simulation service.

Bridges the API layer to the PyTorch physics engine.
Handles genome conversion, batched simulation, and result formatting.
"""

import time
from typing import Any

import torch

from app.core.device import get_best_device

from app.schemas.simulation import (
    SimulationConfig as ApiSimulationConfig,
    SimulationResult,
    FitnessBreakdown,
    PelletResult,
)
from app.simulation.config import SimulationConfig as EngineConfig
from app.simulation.tensors import creature_genomes_to_batch, get_center_of_mass
from app.simulation.physics import (
    simulate_with_pellets,
    simulate_with_neural,
    simulate_with_fitness,
    simulate_with_fitness_neural,
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


def _safe_float(val: float, default: float = 0.0) -> float:
    """Convert float to JSON-safe value (handle NaN and Infinity)."""
    import math
    if math.isnan(val) or math.isinf(val):
        return default
    return val


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
            device = get_best_device()
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
        fitness_state = initialize_fitness_state(batch, pellet_batch)

        # Store initial pellet positions per creature for replay
        initial_pellet_positions = pellet_batch.positions.clone()
        initial_pellet_distances = pellet_batch.initial_distances.clone()

        # Calculate number of simulation steps based on configurable timestep
        dt = config.time_step
        num_steps = int(config.simulation_duration / dt)

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
                time_encoding=config.time_encoding,
            )

            network = BatchedNeuralNetwork.from_genomes(
                neural_genomes=neural_genomes,
                num_muscles=num_muscles,
                config=nn_config,
                device=self.device,
            )

            # Calculate frame interval based on physics FPS and desired frame rate
            physics_fps = int(1.0 / dt)
            frame_interval = max(1, physics_fps // config.frame_rate) if config.record_frames else 1

            # Run neural simulation with integrated fitness tracking
            result = simulate_with_fitness_neural(
                batch=batch,
                neural_network=network,
                pellets=pellet_batch,
                fitness_state=fitness_state,
                num_steps=num_steps,
                fitness_config=fitness_config,
                mode=config.neural_mode,
                dead_zone=config.neural_dead_zone,
                dt=dt,
                record_frames=config.record_frames,
                frame_interval=frame_interval,
                arena_size=config.arena_size,
                time_encoding=config.time_encoding,
                max_time=config.simulation_duration,
            )
            total_activation = result.get('total_activation', torch.zeros(batch.batch_size))
        else:
            # Calculate frame interval based on physics FPS and desired frame rate
            physics_fps = int(1.0 / dt)
            frame_interval = max(1, physics_fps // config.frame_rate) if config.record_frames else 1

            # Run oscillator simulation with integrated fitness tracking
            result = simulate_with_fitness(
                batch=batch,
                pellets=pellet_batch,
                fitness_state=fitness_state,
                num_steps=num_steps,
                fitness_config=fitness_config,
                dt=dt,
                record_frames=config.record_frames,
                frame_interval=frame_interval,
                arena_size=config.arena_size,
            )
            total_activation = torch.zeros(batch.batch_size, device=self.device)

        # Update batch positions from result
        batch.positions = result['final_positions']

        # Calculate fitness
        simulation_time = num_steps * dt
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

            # Calculate displacement metrics (with NaN guards for JSON serialization)
            final_com = result['final_com'][i]
            net_displacement = _safe_float(torch.norm(
                final_com[[0, 2]] - initial_com[i][[0, 2]]
            ).item())
            distance_traveled = _safe_float(fitness_state.distance_traveled[i].item())

            # Get pellet info from pellet_batch
            pellets_collected = int(pellet_batch.total_collected[i].item())

            # Calculate progress (estimate from current state)
            # Progress is based on how close we got to pellets
            progress_score = min(
                fitness_config.progress_max,
                net_displacement * fitness_config.distance_per_unit
            )

            # Build fitness breakdown (with NaN guards)
            # Efficiency penalty is normalized by simulation time and muscle count
            if use_neural and simulation_time > 0:
                num_muscles_i = len(genomes[i].get("muscles", []))
                if num_muscles_i > 0:
                    avg_activation = total_activation[i].item() / (simulation_time * num_muscles_i)
                    efficiency_penalty_val = _safe_float((avg_activation / 60) * 10 * fitness_config.efficiency_penalty)
                else:
                    efficiency_penalty_val = 0.0
            else:
                efficiency_penalty_val = 0.0

            breakdown = FitnessBreakdown(
                pellet_points=_safe_float(pellets_collected * fitness_config.pellet_points),
                progress=_safe_float(progress_score),
                distance_traveled=_safe_float(min(
                    distance_traveled * fitness_config.distance_per_unit,
                    fitness_config.distance_traveled_max
                )),
                efficiency_penalty=efficiency_penalty_val,
            )

            # Get frames if recorded
            frames = None
            frame_count = 0
            if config.record_frames and 'frames' in result:
                # Convert tensor frames [F, N, 3] to flat list format [time, x1,y1,z1, x2,y2,z2, ...]
                # This format matches what the frontend expects
                frames_tensor = result['frames'][i]  # [F, N, 3]
                frame_count = frames_tensor.shape[0]
                frames = []

                # Calculate time per frame: frame_index * frame_interval * dt
                for f_idx in range(frame_count):
                    time_val = f_idx * frame_interval * dt
                    frame_data = [_safe_float(time_val)]  # Start with time

                    # Flatten node positions: [N, 3] -> [x1,y1,z1, x2,y2,z2, ...]
                    node_positions = frames_tensor[f_idx].cpu().tolist()  # [N, 3]
                    for pos in node_positions:
                        frame_data.extend([_safe_float(pos[0]), _safe_float(pos[1]), _safe_float(pos[2])])

                    frames.append(frame_data)

            # Extract fitness and activation with NaN guards
            fitness_val = _safe_float(0.0 if disqualified else fitness_values[i].item())
            activation_val = _safe_float(total_activation[i].item())

            # Build pellet data from simulation's pellet_history
            pellet_list = []
            if 'pellet_history' in result and i < len(result['pellet_history']):
                for pellet_event in result['pellet_history'][i]:
                    pos = pellet_event['position']
                    pellet_list.append(PelletResult(
                        id=pellet_event['id'],
                        position={
                            "x": _safe_float(pos[0]),
                            "y": _safe_float(pos[1]),
                            "z": _safe_float(pos[2])
                        },
                        collected_at_frame=pellet_event['collected_at_frame'],
                        spawned_at_frame=pellet_event['spawned_at_frame'],
                        initial_distance=_safe_float(pellet_event['initial_distance']),
                    ))
            else:
                # Fallback: use initial positions if no history
                init_pos = initial_pellet_positions[i].cpu().tolist()
                init_dist = _safe_float(initial_pellet_distances[i].item())
                pellet_list.append(PelletResult(
                    id="pellet_0",
                    position={"x": _safe_float(init_pos[0]), "y": _safe_float(init_pos[1]), "z": _safe_float(init_pos[2])},
                    collected_at_frame=None,
                    spawned_at_frame=0,
                    initial_distance=init_dist,
                ))

            # Build fitness over time from simulation's per-frame fitness
            fitness_over_time_list = None
            if config.record_frames and 'fitness_per_frame' in result and frame_count > 0:
                fitness_tensor = result['fitness_per_frame'][i]  # [F]
                fitness_over_time_list = [_safe_float(f.item()) for f in fitness_tensor]

            # Build activations per frame from simulation's per-frame neural outputs
            # Format: list of {inputs, hidden, outputs} dicts for each frame
            activations_per_frame_list = None
            if config.record_frames and 'activations_per_frame' in result and frame_count > 0:
                act_data = result['activations_per_frame']
                # act_data is {inputs: [B, F, I], hidden: [B, F, H], outputs: [B, F, O]}
                inputs_tensor = act_data['inputs'][i]   # [F, I]
                hidden_tensor = act_data['hidden'][i]   # [F, H]
                outputs_tensor = act_data['outputs'][i]  # [F, O]

                activations_per_frame_list = []
                for f in range(inputs_tensor.shape[0]):
                    activations_per_frame_list.append({
                        'inputs': [_safe_float(v.item()) for v in inputs_tensor[f]],
                        'hidden': [_safe_float(v.item()) for v in hidden_tensor[f]],
                        'outputs': [_safe_float(v.item()) for v in outputs_tensor[f]],
                    })

            results.append(SimulationResult(
                genome_id=genome_id,
                fitness=fitness_val,
                pellets_collected=pellets_collected,
                disqualified=disqualified,
                disqualified_reason=disqualified_reason,
                fitness_breakdown=breakdown,
                net_displacement=net_displacement,
                distance_traveled=distance_traveled,
                total_activation=activation_val,
                frame_count=frame_count,
                frames=frames,
                pellets=pellet_list,
                fitness_over_time=fitness_over_time_list,
                activations_per_frame=activations_per_frame_list,
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
