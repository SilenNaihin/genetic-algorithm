"""
Optuna with multiprocessing.Pool backend (instead of joblib).

This provides Optuna's TPE sampler while using multiprocessing.Pool
for true parallel execution.

Key insight: Optuna's study.ask()/tell() API allows us to:
1. Sample parameters in main process (using TPE)
2. Run trials in parallel using Pool
3. Report results back to main process
4. Next batch uses updated TPE model

This gives us BOTH intelligent search AND parallelism.
"""

import json
import time
from datetime import datetime
from multiprocessing import Pool
from pathlib import Path
from typing import Any, Literal

import optuna
from optuna.samplers import TPESampler

from configs import BASE_CONFIG
from runner import run_evolution


def run_trial_with_params(args):
    """
    Run evolution with given parameters.

    This function is called in parallel by multiprocessing.Pool.

    Args:
        args: Tuple of (trial_id, params, mode, generations, seeds, device, population_size, stagnation_limit)

    Returns:
        Dict with trial results
    """
    trial_id, params, mode, generations, seeds, device, population_size, stagnation_limit = args

    # Build config
    config = BASE_CONFIG.copy()
    config['neural_mode'] = mode
    config['population_size'] = population_size

    if mode == 'neat':
        # NEAT-required constraints
        config['selection_method'] = 'speciation'
        config['use_fitness_sharing'] = False
        config['use_crossover'] = True

    config.update(params)

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

    # Compute final metrics
    mean_best = sum(all_best_fitness) / len(all_best_fitness)
    mean_avg = sum(all_avg_fitness) / len(all_avg_fitness)

    return {
        'trial_id': trial_id,
        'params': params,
        'mean_best_fitness': mean_best,
        'mean_avg_fitness': mean_avg,
        'best_fitness_per_seed': all_best_fitness,
        'avg_fitness_per_seed': all_avg_fitness,
    }


def run_optuna_pool_search(
    study_name: str,
    mode: Literal['neat', 'pure'],
    n_trials: int,
    generations: int,
    seeds: list[int],
    device: str = 'cpu',
    population_size: int = 300,
    stagnation_limit: int = 50,
    n_workers: int = 1,
    batch_size: int | None = None,
    storage: str | None = None,
    results_dir: str | None = None,
) -> tuple[optuna.Study, Path]:
    """
    Run Optuna hyperparameter search using multiprocessing.Pool.

    Strategy:
    1. Ask Optuna for N parameters (using TPE sampler)
    2. Run N trials in parallel using Pool
    3. Tell Optuna the results
    4. Repeat (TPE learns from previous batch)

    This gives us intelligent search (TPE) + true parallelism (Pool).

    Args:
        study_name: Unique identifier
        mode: 'neat' or 'pure'
        n_trials: Total number of trials
        generations: Generations per trial
        seeds: Seeds to average over
        device: PyTorch device
        population_size: Fixed population size
        stagnation_limit: Early stopping threshold
        n_workers: Number of parallel workers
        batch_size: Trials per batch (default: n_workers)
        storage: Optuna storage URL (optional)
        results_dir: Where to save results

    Returns:
        Tuple of (completed Optuna study, results directory path)
    """
    if batch_size is None:
        batch_size = n_workers

    # Setup results directory
    if results_dir is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        results_dir = Path(f"results/search_optuna_pool_{study_name}_{timestamp}")
    else:
        results_dir = Path(results_dir)
    results_dir.mkdir(parents=True, exist_ok=True)

    print(f"\nOptuna + Process Pool search: {study_name}")
    print(f"  Mode: {mode}")
    print(f"  Trials: {n_trials}")
    print(f"  Batch size: {batch_size}")
    print(f"  Workers: {n_workers}")
    print(f"  Generations: {generations}")
    print(f"  Population: {population_size}")
    print(f"  Seeds: {seeds}")
    print(f"  Device: {device}")
    print(f"  Results: {results_dir}")
    print()

    # Create Optuna study with TPE sampler
    sampler = TPESampler(seed=42)

    study = optuna.create_study(
        study_name=study_name,
        storage=storage,
        sampler=sampler,
        direction='maximize',
        load_if_exists=True,
    )

    print("Starting batched parallel search with TPE sampler\n")
    start_time = time.time()

    trial_count = 0
    batch_num = 0

    while trial_count < n_trials:
        # How many trials in this batch?
        remaining = n_trials - trial_count
        current_batch_size = min(batch_size, remaining)

        batch_num += 1
        print(f"Batch {batch_num}: Sampling {current_batch_size} parameter sets (trials {trial_count}-{trial_count + current_batch_size - 1})...")

        # Ask Optuna for parameters
        trials = [study.ask() for _ in range(current_batch_size)]
        trial_params = [trial.params for trial in trials]

        # Prepare arguments for parallel execution
        trial_args = [(trial_count + i, params, mode, generations, seeds, device, population_size, stagnation_limit)
                     for i, params in enumerate(trial_params)]

        print(f"Running {current_batch_size} trials in parallel with {n_workers} workers...")

        # Run trials in parallel
        if n_workers == 1:
            results = [run_trial_with_params(args) for args in trial_args]
        else:
            with Pool(processes=n_workers) as pool:
                results = pool.map(run_trial_with_params, trial_args)

        # Tell Optuna about the results
        for i, result in enumerate(results):
            study.tell(trials[i], result['mean_best_fitness'])

            # Save individual trial results
            trial_result = {
                'trial_number': result['trial_id'],
                'params': result['params'],
                'best_fitness_per_seed': result['best_fitness_per_seed'],
                'avg_fitness_per_seed': result['avg_fitness_per_seed'],
                'mean_best_fitness': result['mean_best_fitness'],
                'mean_avg_fitness': result['mean_avg_fitness'],
            }

            result_file = results_dir / f"trial_{result['trial_id']:04d}.json"
            with open(result_file, 'w') as f:
                json.dump(trial_result, f, indent=2)

            print(f"  Trial {result['trial_id']}: fitness={result['mean_best_fitness']:.1f}")

        trial_count += current_batch_size

        # Print batch summary
        batch_best = max(r['mean_best_fitness'] for r in results)
        print(f"Batch {batch_num} complete: best={batch_best:.1f}, overall best={study.best_value:.1f}\n")

    elapsed_time = time.time() - start_time

    # Save study summary
    summary = {
        'study_name': study_name,
        'mode': mode,
        'n_trials': n_trials,
        'generations': generations,
        'seeds': seeds,
        'population_size': population_size,
        'n_workers': n_workers,
        'batch_size': batch_size,
        'elapsed_time': elapsed_time,
        'completed_trials': trial_count,
        'best_trial': study.best_trial.number,
        'best_value': study.best_value,
        'best_params': study.best_params,
    }

    with open(results_dir / 'summary.json', 'w') as f:
        json.dump(summary, f, indent=2)

    print("\nSearch complete!")
    print(f"Best fitness: {study.best_value:.1f}")
    print(f"Best trial: #{study.best_trial.number}")
    print(f"Total time: {elapsed_time:.1f}s ({elapsed_time/60:.1f} minutes)")
    print(f"Results saved to: {results_dir}")

    return study, results_dir


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
        batch_size: int = typer.Option(None, "--batch-size", "-b"),
        device: str = typer.Option("cpu", "--device", "-d"),
        stagnation_limit: int = typer.Option(50, "--stagnation-limit"),
        storage: str = typer.Option(None, "--storage"),
    ):
        """
        Run Optuna hyperparameter search with multiprocessing.Pool backend.

        Combines Optuna's TPE sampler with true parallel execution.

        Batch strategy:
        - Ask Optuna for N parameter sets
        - Run N trials in parallel
        - Report results back to Optuna
        - Next batch uses updated TPE model

        Examples:
            # 100 trials, 3 workers, batches of 3
            python search_optuna_pool.py my-study -m pure -n 100 -g 150 -s 3 -p 500 -w 3

            # 100 trials, 10 workers, batches of 10 (faster batches)
            python search_optuna_pool.py my-study -m pure -n 100 -g 150 -s 3 -p 500 -w 10
        """
        seed_list = [42, 123, 456, 789, 1337][:seeds]

        run_optuna_pool_search(
            study_name=study_name,
            mode=mode,
            n_trials=n_trials,
            generations=generations,
            seeds=seed_list,
            device=device,
            population_size=population_size,
            stagnation_limit=stagnation_limit,
            n_workers=n_workers,
            batch_size=batch_size,
            storage=storage,
        )

    app()
