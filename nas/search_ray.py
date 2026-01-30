"""
Ray-based parallel search implementation.

This is an alternative to Optuna's default joblib backend that should handle
long-running trials better.

Installation:
    pip install "ray[default]" ray-on-aml

Usage:
    python search_ray.py search test -m pure -n 10 -g 150 -s 3 -p 500 --n-workers 5
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Literal

try:
    import ray
    from ray import tune
    from ray.tune.search.optuna import OptunaSearch
    HAS_RAY = True
except ImportError:
    HAS_RAY = False
    print("Warning: Ray not installed. Install with: pip install 'ray[default]'")

from configs import BASE_CONFIG
from runner import run_evolution


def suggest_neat_params_ray(config: dict) -> dict[str, Any]:
    """
    NEAT parameter space for Ray Tune.
    Uses Ray's tune.* functions instead of Optuna's trial.suggest_*.
    """
    from ray import tune

    return {
        # NEAT structural mutations
        'neat_initial_connectivity': tune.choice(['full', 'sparse_inputs', 'sparse_outputs', 'none']),
        'neat_add_connection_rate': tune.uniform(0.05, 0.6),
        'neat_add_node_rate': tune.uniform(0.01, 0.3),
        'neat_enable_rate': tune.uniform(0.0, 0.1),
        'neat_disable_rate': tune.uniform(0.0, 0.1),
        'neat_max_hidden_nodes': tune.randint(8, 49),  # 8-48 inclusive

        # Weight mutations
        'weight_mutation_rate': tune.uniform(0.4, 0.95),
        'weight_mutation_magnitude': tune.uniform(0.1, 0.8),

        # Speciation
        'compatibility_threshold': tune.uniform(1.0, 5.0),
        'neat_excess_coefficient': tune.uniform(0.5, 2.0),
        'neat_disjoint_coefficient': tune.uniform(0.5, 2.0),
        'neat_weight_coefficient': tune.uniform(0.1, 1.0),
        'min_species_size': tune.randint(1, 6),  # 1-5 inclusive

        # Body mutations
        'mutation_rate': tune.uniform(0.1, 0.6),
        'mutation_magnitude': tune.uniform(0.1, 0.5),

        # Selection
        'cull_percentage': tune.uniform(0.3, 0.8),

        # Crossover (fixed for NEAT)
        'crossover_rate': tune.uniform(0.2, 0.8),

        # Proprioception
        'use_proprioception': tune.choice([True, False]),

        # Body constraints
        'min_nodes': tune.randint(3, 5),  # 3-4 inclusive
        'max_nodes': tune.randint(5, 13),  # 5-12 inclusive
        'max_muscles': tune.randint(8, 21),  # 8-20 inclusive

        # Neural settings
        'time_encoding': tune.choice(['none', 'cyclic', 'sin', 'raw', 'sin_raw']),
        'bias_mode': tune.choice(['node', 'bias_node']),
        'neural_dead_zone': tune.uniform(0.0, 0.2),
        'neural_output_bias': tune.uniform(-0.5, 0.0),

        # Adaptive mutation
        'use_adaptive_mutation': tune.choice([True, False]),
    }


def create_ray_trainable(
    mode: Literal['neat', 'pure'],
    generations: int,
    seeds: list[int],
    device: str,
    results_dir: Path,
    population_size: int = 300,
    stagnation_limit: int = 50,
):
    """
    Create a Ray Tune trainable function.

    Ray Tune expects a function that:
    1. Takes a config dict as input
    2. Runs training/evolution
    3. Reports metrics via tune.report()
    """

    def trainable(config_params):
        """Ray Tune trainable - runs one trial."""
        # Build full config
        config = BASE_CONFIG.copy()
        config['neural_mode'] = mode
        config['population_size'] = population_size

        if mode == 'neat':
            # NEAT-required constraints
            config['selection_method'] = 'speciation'
            config['use_fitness_sharing'] = False
            config['use_crossover'] = True

        config.update(config_params)

        # Handle conditional params
        if not config.get('use_proprioception', False):
            config.pop('proprioception_inputs', None)
        if not config.get('use_adaptive_mutation', False):
            config.pop('stagnation_threshold', None)
            config.pop('adaptive_mutation_boost', None)

        # Run evolution for each seed
        all_best_fitness = []
        all_avg_fitness = []

        for seed_idx, seed in enumerate(seeds):
            try:
                result = run_evolution(
                    config=config,
                    generations=generations,
                    seed=seed,
                    device=device,
                    verbose=False,
                    stagnation_limit=stagnation_limit,
                )

                all_best_fitness.append(result.best_fitness)
                final_avg = result.generations[-1].avg_fitness if result.generations else 0.0
                all_avg_fitness.append(final_avg)

                # Report intermediate metrics (for early stopping)
                intermediate = sum(all_best_fitness) / len(all_best_fitness)
                tune.report(
                    best_fitness=intermediate,
                    seed_idx=seed_idx,
                )

            except Exception as e:
                print(f"Trial failed on seed {seed}: {e}")
                all_best_fitness.append(0.0)
                all_avg_fitness.append(0.0)

        # Final metrics
        mean_best = sum(all_best_fitness) / len(all_best_fitness)
        mean_avg = sum(all_avg_fitness) / len(all_avg_fitness)

        # Report final result
        tune.report(
            best_fitness=mean_best,
            avg_fitness=mean_avg,
            done=True,
        )

    return trainable


def run_ray_search(
    study_name: str,
    mode: Literal['neat', 'pure'],
    n_trials: int,
    generations: int,
    seeds: list[int],
    device: str = 'cpu',
    population_size: int = 300,
    stagnation_limit: int = 50,
    n_workers: int = 1,
    results_dir: str | None = None,
) -> Path:
    """
    Run hyperparameter search using Ray Tune.

    Args:
        study_name: Unique identifier
        mode: 'neat' or 'pure'
        n_trials: Number of trials
        generations: Generations per trial
        seeds: Seeds to average over
        device: PyTorch device
        population_size: Fixed population size
        stagnation_limit: Early stopping threshold
        n_workers: Number of parallel workers
        results_dir: Where to save results

    Returns:
        Path to results directory
    """
    if not HAS_RAY:
        raise ImportError("Ray not installed. Install with: pip install 'ray[default]'")

    # Initialize Ray
    ray.init(num_cpus=n_workers, ignore_reinit_error=True)

    # Setup results directory
    if results_dir is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        results_dir = Path(f"results/search_ray_{study_name}_{timestamp}")
    else:
        results_dir = Path(results_dir)
    results_dir.mkdir(parents=True, exist_ok=True)

    print(f"\nRay-based hyperparameter search: {study_name}")
    print(f"  Mode: {mode}")
    print(f"  Trials: {n_trials}")
    print(f"  Generations: {generations}")
    print(f"  Population: {population_size}")
    print(f"  Seeds: {seeds}")
    print(f"  Workers: {n_workers}")
    print(f"  Device: {device}")
    print(f"  Results: {results_dir}")
    print()

    # Create trainable
    trainable = create_ray_trainable(
        mode=mode,
        generations=generations,
        seeds=seeds,
        device=device,
        results_dir=results_dir,
        population_size=population_size,
        stagnation_limit=stagnation_limit,
    )

    # Get search space
    if mode == 'neat':
        search_space = suggest_neat_params_ray({})
    else:
        # Simplified for now - can add pure space later
        raise NotImplementedError("Pure mode not yet implemented for Ray")

    # Configure search algorithm (use Optuna via Ray)
    search_alg = OptunaSearch(
        metric="best_fitness",
        mode="max",
    )

    # Run optimization
    analysis = tune.run(
        trainable,
        config=search_space,
        num_samples=n_trials,
        search_alg=search_alg,
        resources_per_trial={"cpu": 1},  # Each trial gets 1 CPU
        local_dir=str(results_dir),
        name=study_name,
        verbose=1,
    )

    # Save results
    best_trial = analysis.best_trial
    best_config = analysis.best_config

    summary = {
        'study_name': study_name,
        'mode': mode,
        'n_trials': n_trials,
        'generations': generations,
        'seeds': seeds,
        'population_size': population_size,
        'best_trial': best_trial.trial_id,
        'best_fitness': best_trial.last_result['best_fitness'],
        'best_config': best_config,
    }

    with open(results_dir / 'summary.json', 'w') as f:
        json.dump(summary, f, indent=2)

    print("\nSearch complete!")
    print(f"Best fitness: {best_trial.last_result['best_fitness']:.1f}")
    print(f"Best config saved to: {results_dir / 'summary.json'}")

    ray.shutdown()

    return results_dir


if __name__ == "__main__":
    import typer
    app = typer.Typer()

    @app.command()
    def search(
        study_name: str,
        mode: str = typer.Option("neat", "--mode", "-m"),
        n_trials: int = typer.Option(50, "--trials", "-n"),
        generations: int = typer.Option(30, "--generations", "-g"),
        seeds: int = typer.Option(2, "--seeds", "-s"),
        population_size: int = typer.Option(300, "--population-size", "-p"),
        n_workers: int = typer.Option(5, "--n-workers", "-w"),
        device: str = typer.Option("cpu", "--device", "-d"),
    ):
        """Run Ray-based hyperparameter search."""
        seed_list = [42, 123, 456, 789, 1337][:seeds]

        run_ray_search(
            study_name=study_name,
            mode=mode,
            n_trials=n_trials,
            generations=generations,
            seeds=seed_list,
            device=device,
            population_size=population_size,
            n_workers=n_workers,
        )

    app()
