"""
Simple multiprocessing.Pool baseline for parallel trials.

This bypasses Optuna entirely to test if the issue is with Optuna's joblib backend
or with fundamental parallelism limits.

Usage:
    python search_processpool.py search test -m pure -n 10 -g 150 -s 3 -p 500 --n-workers 5
"""

import json
import random
import sys
from datetime import datetime
from multiprocessing import Pool
from pathlib import Path
from typing import Any, Literal

from configs import BASE_CONFIG
# NOTE: Don't import runner here - it loads PyTorch with default threading
# Import inside worker after setting thread limits


# Parameter sampling functions (same ranges as Optuna version)
def sample_neat_params() -> dict[str, Any]:
    """Sample NEAT parameters uniformly from search space."""
    params = {}

    # NEAT structural mutations
    params['neat_initial_connectivity'] = random.choice(['full', 'sparse_inputs', 'sparse_outputs', 'none'])
    params['neat_add_connection_rate'] = random.uniform(0.05, 0.6)
    params['neat_add_node_rate'] = random.uniform(0.01, 0.3)
    params['neat_enable_rate'] = random.uniform(0.0, 0.1)
    params['neat_disable_rate'] = random.uniform(0.0, 0.1)
    params['neat_max_hidden_nodes'] = random.randint(8, 48)

    # Weight mutations
    params['weight_mutation_rate'] = random.uniform(0.4, 0.95)
    params['weight_mutation_magnitude'] = random.uniform(0.1, 0.8)

    # Speciation
    params['compatibility_threshold'] = random.uniform(1.0, 5.0)
    params['neat_excess_coefficient'] = random.uniform(0.5, 2.0)
    params['neat_disjoint_coefficient'] = random.uniform(0.5, 2.0)
    params['neat_weight_coefficient'] = random.uniform(0.1, 1.0)
    params['min_species_size'] = random.randint(1, 5)

    # Body mutations
    params['mutation_rate'] = random.uniform(0.1, 0.6)
    params['mutation_magnitude'] = random.uniform(0.1, 0.5)

    # Selection
    params['cull_percentage'] = random.uniform(0.3, 0.8)

    # Crossover (fixed for NEAT)
    params['use_crossover'] = True
    params['crossover_rate'] = random.uniform(0.2, 0.8)

    # Proprioception
    params['use_proprioception'] = random.choice([True, False])
    if params['use_proprioception']:
        params['proprioception_inputs'] = random.choice(['all', 'strain', 'velocity', 'ground'])

    # Body constraints
    params['min_nodes'] = random.randint(3, 4)
    params['max_nodes'] = random.randint(5, 12)
    params['max_muscles'] = random.randint(8, 20)

    # Neural settings
    params['time_encoding'] = random.choice(['none', 'cyclic', 'sin', 'raw', 'sin_raw'])
    params['bias_mode'] = random.choice(['node', 'bias_node'])
    params['neural_dead_zone'] = random.uniform(0.0, 0.2)
    params['neural_output_bias'] = random.uniform(-0.5, 0.0)

    # Adaptive mutation
    params['use_adaptive_mutation'] = random.choice([True, False])
    if params['use_adaptive_mutation']:
        params['stagnation_threshold'] = random.randint(10, 30)
        params['adaptive_mutation_boost'] = random.uniform(1.5, 3.0)

    return params


def sample_pure_params() -> dict[str, Any]:
    """Sample Pure mode parameters uniformly from search space."""
    params = {}

    # Fixed topology size
    params['neural_hidden_size'] = random.choice([4, 8, 12, 16, 20, 24])

    # Weight mutations
    params['weight_mutation_rate'] = random.uniform(0.1, 0.5)
    params['weight_mutation_magnitude'] = random.uniform(0.1, 0.6)

    # Body mutations
    params['mutation_rate'] = random.uniform(0.1, 0.6)
    params['mutation_magnitude'] = random.uniform(0.1, 0.5)

    # Selection
    params['cull_percentage'] = random.uniform(0.3, 0.8)
    params['selection_method'] = random.choice(['truncation', 'tournament', 'rank'])
    if params['selection_method'] == 'tournament':
        params['tournament_size'] = random.randint(2, 7)

    # Crossover
    params['use_crossover'] = random.choice([True, False])
    if params['use_crossover']:
        params['crossover_rate'] = random.uniform(0.2, 0.8)

    # Proprioception
    params['use_proprioception'] = random.choice([True, False])
    if params['use_proprioception']:
        params['proprioception_inputs'] = random.choice(['all', 'strain', 'velocity', 'ground'])

    # Body constraints
    params['min_nodes'] = random.randint(3, 4)
    params['max_nodes'] = random.randint(5, 12)
    params['max_muscles'] = random.randint(8, 20)

    # Neural settings
    params['neural_dead_zone'] = random.uniform(0.0, 0.2)
    params['neural_output_bias'] = random.uniform(-0.5, 0.0)

    return params


def run_single_trial(args):
    """
    Run a single trial (complete evolution run with multiple seeds).

    This function is called in parallel by multiprocessing.Pool.

    Args:
        args: Tuple of (trial_id, config_params, generations, seeds, device, mode, population_size, stagnation_limit, threads_per_worker)

    Returns:
        Dict with trial results
    """
    import os

    trial_id, config_params, generations, seeds, device, mode, population_size, stagnation_limit, threads_per_worker = args

    # CRITICAL: Set thread limits INSIDE worker before importing PyTorch
    # Environment variables must be set BEFORE any torch import
    if threads_per_worker:
        os.environ['OMP_NUM_THREADS'] = str(threads_per_worker)
        os.environ['MKL_NUM_THREADS'] = str(threads_per_worker)
        os.environ['OPENBLAS_NUM_THREADS'] = str(threads_per_worker)
        os.environ['NUMEXPR_NUM_THREADS'] = str(threads_per_worker)
        os.environ['VECLIB_MAXIMUM_THREADS'] = str(threads_per_worker)
        os.environ['OMP_WAIT_POLICY'] = 'PASSIVE'  # Prevent busy-waiting

    # Import PyTorch - threading already configured via env vars above
    import torch
    if threads_per_worker:
        torch.set_num_threads(threads_per_worker)
        # NOTE: Don't call set_num_interop_threads() - it can only be called once
        # and causes errors in multiprocessing. Rely on env var instead.

    # NOW import runner
    from runner import run_evolution

    # Build full config
    config = BASE_CONFIG.copy()
    config['neural_mode'] = mode
    config['population_size'] = population_size

    if mode == 'neat':
        # NEAT-required constraints
        config['selection_method'] = 'speciation'
        config['use_fitness_sharing'] = False

    config.update(config_params)

    # Run evolution for each seed
    all_best_fitness = []
    all_avg_fitness = []

    for seed in seeds:
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

        except Exception as e:
            print(f"Trial {trial_id} seed {seed} failed: {e}")
            all_best_fitness.append(0.0)
            all_avg_fitness.append(0.0)

    # Compute metrics
    mean_best = sum(all_best_fitness) / len(all_best_fitness)
    mean_avg = sum(all_avg_fitness) / len(all_avg_fitness)

    return {
        'trial_id': trial_id,
        'params': config_params,
        'best_fitness_per_seed': all_best_fitness,
        'avg_fitness_per_seed': all_avg_fitness,
        'mean_best_fitness': mean_best,
        'mean_avg_fitness': mean_avg,
    }


def run_processpool_search(
    study_name: str,
    mode: Literal['neat', 'pure'],
    n_trials: int,
    generations: int,
    seeds: list[int],
    device: str = 'cpu',
    population_size: int = 300,
    stagnation_limit: int = 50,
    n_workers: int = 1,
    threads_per_worker: int | None = None,
    results_dir: str | None = None,
) -> Path:
    """
    Run hyperparameter search using simple multiprocessing.Pool.

    This version properly controls threading to prevent oversubscription.
    Key fix: Sets OMP_NUM_THREADS inside each worker process.

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
    # Setup results directory
    if results_dir is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        results_dir = Path(f"results/search_pool_{study_name}_{timestamp}")
    else:
        results_dir = Path(results_dir)
    results_dir.mkdir(parents=True, exist_ok=True)

    # Calculate optimal threads per worker
    if threads_per_worker is None and n_workers > 1:
        import os
        cpu_count = os.cpu_count() or 1
        threads_per_worker = max(1, cpu_count // n_workers)
        print(f"\nAuto-calculated threads_per_worker: {threads_per_worker} ({cpu_count} cores ÷ {n_workers} workers)")
    elif threads_per_worker is None:
        threads_per_worker = 0  # Let PyTorch use default for single worker

    print(f"\nProcess Pool hyperparameter search: {study_name}")
    print(f"  Mode: {mode}")
    print(f"  Trials: {n_trials}")
    print(f"  Generations: {generations}")
    print(f"  Population: {population_size}")
    print(f"  Seeds: {seeds}")
    print(f"  Workers: {n_workers}")
    if threads_per_worker > 0:
        print(f"  Threads per worker: {threads_per_worker} (prevents oversubscription)")
    print(f"  Device: {device}")
    print(f"  Results: {results_dir}")
    print()

    # Generate all trial configs upfront
    trial_args = []
    for trial_id in range(n_trials):
        if mode == 'neat':
            params = sample_neat_params()
        else:
            params = sample_pure_params()

        trial_args.append((
            trial_id,
            params,
            generations,
            seeds,
            device,
            mode,
            population_size,
            stagnation_limit,
            threads_per_worker,
        ))

    # Run trials in parallel
    print(f"Starting {n_trials} trials with {n_workers} workers...")
    print()

    results = []
    if n_workers == 1:
        # Sequential (for comparison)
        for i, args in enumerate(trial_args):
            result = run_single_trial(args)
            results.append(result)
            # Save immediately
            result_file = results_dir / f"trial_{result['trial_id']:04d}.json"
            with open(result_file, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"Trial {i+1}/{n_trials} completed: fitness={result['mean_best_fitness']:.1f}")
            sys.stdout.flush()
    else:
        # Parallel with incremental results
        with Pool(processes=n_workers) as pool:
            for i, result in enumerate(pool.imap_unordered(run_single_trial, trial_args)):
                results.append(result)
                # Save immediately
                result_file = results_dir / f"trial_{result['trial_id']:04d}.json"
                with open(result_file, 'w') as f:
                    json.dump(result, f, indent=2)
                print(f"Trial {i+1}/{n_trials} completed: fitness={result['mean_best_fitness']:.1f}")
            sys.stdout.flush()

    # Find best trial
    best_trial = max(results, key=lambda r: r['mean_best_fitness'])

    # Save summary
    summary = {
        'study_name': study_name,
        'mode': mode,
        'n_trials': n_trials,
        'generations': generations,
        'seeds': seeds,
        'population_size': population_size,
        'n_workers': n_workers,
        'best_trial': best_trial['trial_id'],
        'best_fitness': best_trial['mean_best_fitness'],
        'best_params': best_trial['params'],
        'all_fitness': [r['mean_best_fitness'] for r in results],
    }

    with open(results_dir / 'summary.json', 'w') as f:
        json.dump(summary, f, indent=2)

    print("\nSearch complete!")
    print(f"Best fitness: {best_trial['mean_best_fitness']:.1f}")
    print(f"Best trial: #{best_trial['trial_id']}")
    print(f"Results saved to: {results_dir}")

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
        threads_per_worker: int = typer.Option(None, "--threads-per-worker", "-t"),
        device: str = typer.Option("cpu", "--device", "-d"),
        stagnation_limit: int = typer.Option(50, "--stagnation-limit"),
    ):
        """
        Run Process Pool hyperparameter search with proper thread control.

        Key feature: Prevents thread oversubscription by limiting threads per worker.
        If --threads-per-worker not specified, auto-calculates as: cpu_count / n_workers
        """
        seed_list = [42, 123, 456, 789, 1337][:seeds]

        run_processpool_search(
            study_name=study_name,
            mode=mode,
            n_trials=n_trials,
            generations=generations,
            seeds=seed_list,
            device=device,
            population_size=population_size,
            stagnation_limit=stagnation_limit,
            n_workers=n_workers,
            threads_per_worker=threads_per_worker,
        )

    app()
