"""
Optuna-based hyperparameter search for Evolution Lab.

Supports:
- Single-objective (maximize fitness)
- Multi-objective (fitness + diversity) via NSGA-II
- fANOVA parameter importance analysis
- Pruning of poor trials
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Literal

import optuna
from optuna.samplers import TPESampler, NSGAIISampler
from optuna.pruners import MedianPruner

from configs import BASE_CONFIG
from runner import run_evolution


# =============================================================================
# PARAMETER SPACE DEFINITIONS
# =============================================================================

def suggest_neat_params(trial: optuna.Trial) -> dict[str, Any]:
    """
    Full NEAT parameter space for hyperparameter search.

    Organized by category with sensible ranges based on:
    - Canonical NEAT paper values
    - Our empirical testing
    - Domain knowledge about creature evolution
    """
    params = {}

    # =========================================================================
    # NEAT STRUCTURAL MUTATIONS (Critical for topology evolution)
    # =========================================================================
    params['neat_initial_connectivity'] = trial.suggest_categorical(
        'neat_initial_connectivity',
        ['full', 'sparse_inputs', 'sparse_outputs', 'none']
    )
    params['neat_add_connection_rate'] = trial.suggest_float(
        'neat_add_connection_rate', 0.05, 0.6
    )
    params['neat_add_node_rate'] = trial.suggest_float(
        'neat_add_node_rate', 0.01, 0.3
    )
    params['neat_enable_rate'] = trial.suggest_float(
        'neat_enable_rate', 0.0, 0.1
    )
    params['neat_disable_rate'] = trial.suggest_float(
        'neat_disable_rate', 0.0, 0.1
    )
    params['neat_max_hidden_nodes'] = trial.suggest_int(
        'neat_max_hidden_nodes', 8, 48
    )

    # =========================================================================
    # WEIGHT MUTATIONS (Critical for learning)
    # =========================================================================
    params['weight_mutation_rate'] = trial.suggest_float(
        'weight_mutation_rate', 0.4, 0.95
    )
    params['weight_mutation_magnitude'] = trial.suggest_float(
        'weight_mutation_magnitude', 0.1, 0.8
    )

    # =========================================================================
    # SPECIATION (Critical for NEAT diversity protection)
    # =========================================================================
    params['compatibility_threshold'] = trial.suggest_float(
        'compatibility_threshold', 1.0, 5.0
    )
    params['neat_excess_coefficient'] = trial.suggest_float(
        'neat_excess_coefficient', 0.5, 2.0
    )
    params['neat_disjoint_coefficient'] = trial.suggest_float(
        'neat_disjoint_coefficient', 0.5, 2.0
    )
    params['neat_weight_coefficient'] = trial.suggest_float(
        'neat_weight_coefficient', 0.1, 1.0
    )
    params['min_species_size'] = trial.suggest_int(
        'min_species_size', 1, 5
    )

    # =========================================================================
    # BODY MUTATIONS
    # =========================================================================
    params['mutation_rate'] = trial.suggest_float(
        'mutation_rate', 0.1, 0.6
    )
    params['mutation_magnitude'] = trial.suggest_float(
        'mutation_magnitude', 0.1, 0.5
    )

    # =========================================================================
    # SELECTION & POPULATION
    # =========================================================================
    params['population_size'] = trial.suggest_int(
        'population_size', 100, 500, step=50
    )
    params['cull_percentage'] = trial.suggest_float(
        'cull_percentage', 0.3, 0.8
    )

    # =========================================================================
    # CROSSOVER
    # =========================================================================
    params['use_crossover'] = trial.suggest_categorical(
        'use_crossover', [True, False]
    )
    if params['use_crossover']:
        params['crossover_rate'] = trial.suggest_float(
            'crossover_rate', 0.2, 0.8
        )
    else:
        params['crossover_rate'] = 0.0

    # =========================================================================
    # PROPRIOCEPTION (Important for body awareness!)
    # =========================================================================
    params['use_proprioception'] = trial.suggest_categorical(
        'use_proprioception', [True, False]
    )
    if params['use_proprioception']:
        params['proprioception_inputs'] = trial.suggest_categorical(
            'proprioception_inputs', ['all', 'lengths', 'velocities']
        )

    # =========================================================================
    # CREATURE BODY CONSTRAINTS
    # =========================================================================
    params['min_nodes'] = trial.suggest_int('min_nodes', 3, 4)
    params['max_nodes'] = trial.suggest_int('max_nodes', 5, 12)
    params['max_muscles'] = trial.suggest_int('max_muscles', 8, 20)

    # =========================================================================
    # NEURAL NETWORK SETTINGS
    # =========================================================================
    params['bias_mode'] = trial.suggest_categorical(
        'bias_mode', ['node', 'bias_node']
    )
    params['neural_dead_zone'] = trial.suggest_float(
        'neural_dead_zone', 0.0, 0.2
    )
    params['neural_output_bias'] = trial.suggest_float(
        'neural_output_bias', -0.5, 0.0
    )

    # =========================================================================
    # ADAPTIVE MUTATION (Optional boost when stagnating)
    # =========================================================================
    params['use_adaptive_mutation'] = trial.suggest_categorical(
        'use_adaptive_mutation', [True, False]
    )
    if params['use_adaptive_mutation']:
        params['stagnation_threshold'] = trial.suggest_int(
            'stagnation_threshold', 10, 30
        )
        params['adaptive_mutation_boost'] = trial.suggest_float(
            'adaptive_mutation_boost', 1.5, 3.0
        )

    return params


def suggest_pure_params(trial: optuna.Trial) -> dict[str, Any]:
    """
    Parameter space for pure (fixed topology) neural mode.
    Smaller space since no topology evolution.
    """
    params = {}

    # Fixed topology size
    params['neural_hidden_size'] = trial.suggest_int(
        'neural_hidden_size', 4, 24, step=4
    )

    # Weight mutations
    params['weight_mutation_rate'] = trial.suggest_float(
        'weight_mutation_rate', 0.1, 0.5
    )
    params['weight_mutation_magnitude'] = trial.suggest_float(
        'weight_mutation_magnitude', 0.1, 0.6
    )

    # Body mutations
    params['mutation_rate'] = trial.suggest_float(
        'mutation_rate', 0.1, 0.6
    )
    params['mutation_magnitude'] = trial.suggest_float(
        'mutation_magnitude', 0.1, 0.5
    )

    # Selection
    params['population_size'] = trial.suggest_int(
        'population_size', 100, 500, step=50
    )
    params['cull_percentage'] = trial.suggest_float(
        'cull_percentage', 0.3, 0.8
    )
    params['selection_method'] = trial.suggest_categorical(
        'selection_method', ['truncation', 'tournament', 'rank']
    )
    if params['selection_method'] == 'tournament':
        params['tournament_size'] = trial.suggest_int(
            'tournament_size', 2, 7
        )

    # Crossover
    params['use_crossover'] = trial.suggest_categorical(
        'use_crossover', [True, False]
    )
    if params['use_crossover']:
        params['crossover_rate'] = trial.suggest_float(
            'crossover_rate', 0.2, 0.8
        )

    # Proprioception
    params['use_proprioception'] = trial.suggest_categorical(
        'use_proprioception', [True, False]
    )
    if params['use_proprioception']:
        params['proprioception_inputs'] = trial.suggest_categorical(
            'proprioception_inputs', ['all', 'lengths', 'velocities']
        )

    # Body constraints
    params['min_nodes'] = trial.suggest_int('min_nodes', 3, 4)
    params['max_nodes'] = trial.suggest_int('max_nodes', 5, 12)
    params['max_muscles'] = trial.suggest_int('max_muscles', 8, 20)

    # Neural settings
    params['neural_dead_zone'] = trial.suggest_float(
        'neural_dead_zone', 0.0, 0.2
    )
    params['neural_output_bias'] = trial.suggest_float(
        'neural_output_bias', -0.5, 0.0
    )

    return params


# =============================================================================
# OBJECTIVE FUNCTIONS
# =============================================================================

def create_objective(
    mode: Literal['neat', 'pure'],
    generations: int,
    seeds: list[int],
    device: str,
    results_dir: Path,
    report_interval: int = 10,
):
    """
    Create an Optuna objective function for the given mode.

    Args:
        mode: 'neat' or 'pure'
        generations: Number of generations per trial
        seeds: Random seeds to average over
        device: PyTorch device
        results_dir: Where to save trial results
        report_interval: How often to report intermediate values (for pruning)
    """

    def objective(trial: optuna.Trial) -> float:
        # Build config from base + suggested params
        config = BASE_CONFIG.copy()
        config['neural_mode'] = mode

        if mode == 'neat':
            config['selection_method'] = 'speciation'  # Required for NEAT
            config['use_fitness_sharing'] = False      # Auto-disabled
            params = suggest_neat_params(trial)
        else:
            params = suggest_pure_params(trial)

        config.update(params)

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
                )

                all_best_fitness.append(result.best_fitness)
                # Get final avg fitness from last generation
                final_avg = result.generations[-1].avg_fitness if result.generations else 0.0
                all_avg_fitness.append(final_avg)

                # Report intermediate value for pruning
                # Use running average of best fitness
                intermediate = sum(all_best_fitness) / len(all_best_fitness)
                trial.report(intermediate, seed_idx)

                # Check if trial should be pruned
                if trial.should_prune():
                    raise optuna.TrialPruned()

            except Exception as e:
                # If evolution fails, report very low fitness
                print(f"Trial {trial.number} seed {seed} failed: {e}")
                all_best_fitness.append(0.0)
                all_avg_fitness.append(0.0)

        # Compute final metrics
        mean_best = sum(all_best_fitness) / len(all_best_fitness)
        mean_avg = sum(all_avg_fitness) / len(all_avg_fitness)

        # Save trial results
        trial_result = {
            'trial_number': trial.number,
            'params': params,
            'best_fitness_per_seed': all_best_fitness,
            'avg_fitness_per_seed': all_avg_fitness,
            'mean_best_fitness': mean_best,
            'mean_avg_fitness': mean_avg,
            'generations': generations,
            'seeds': seeds,
        }

        result_file = results_dir / f"trial_{trial.number:04d}.json"
        with open(result_file, 'w') as f:
            json.dump(trial_result, f, indent=2)

        return mean_best

    return objective


def create_multi_objective(
    mode: Literal['neat', 'pure'],
    generations: int,
    seeds: list[int],
    device: str,
    results_dir: Path,
):
    """
    Create a multi-objective function for Pareto optimization.

    Objectives:
    1. Maximize best fitness (exploitation)
    2. Maximize average fitness (population learning)
    """

    def objective(trial: optuna.Trial) -> tuple[float, float]:
        config = BASE_CONFIG.copy()
        config['neural_mode'] = mode

        if mode == 'neat':
            config['selection_method'] = 'speciation'
            config['use_fitness_sharing'] = False
            params = suggest_neat_params(trial)
        else:
            params = suggest_pure_params(trial)

        config.update(params)

        all_best = []
        all_avg = []

        for seed in seeds:
            try:
                result = run_evolution(
                    config=config,
                    generations=generations,
                    seed=seed,
                    device=device,
                    verbose=False,
                )
                all_best.append(result.best_fitness)
                final_avg = result.generations[-1].avg_fitness if result.generations else 0.0
                all_avg.append(final_avg)
            except Exception as e:
                print(f"Trial {trial.number} failed: {e}")
                all_best.append(0.0)
                all_avg.append(0.0)

        mean_best = sum(all_best) / len(all_best)
        mean_avg = sum(all_avg) / len(all_avg)

        # Save results
        trial_result = {
            'trial_number': trial.number,
            'params': params,
            'mean_best_fitness': mean_best,
            'mean_avg_fitness': mean_avg,
        }
        result_file = results_dir / f"trial_{trial.number:04d}.json"
        with open(result_file, 'w') as f:
            json.dump(trial_result, f, indent=2)

        return mean_best, mean_avg

    return objective


# =============================================================================
# STUDY MANAGEMENT
# =============================================================================

def create_study(
    study_name: str,
    mode: Literal['neat', 'pure'],
    storage: str | None = None,
    multi_objective: bool = False,
    load_if_exists: bool = True,
) -> optuna.Study:
    """
    Create or load an Optuna study.

    Args:
        study_name: Unique name for this study
        mode: 'neat' or 'pure'
        storage: Database URL (e.g., 'sqlite:///nas.db') or None for in-memory
        multi_objective: If True, use NSGA-II for Pareto optimization
        load_if_exists: If True, resume existing study
    """

    if multi_objective:
        sampler = NSGAIISampler(seed=42)
        directions = ['maximize', 'maximize']  # best_fitness, avg_fitness
        study = optuna.create_study(
            study_name=study_name,
            storage=storage,
            sampler=sampler,
            directions=directions,
            load_if_exists=load_if_exists,
        )
    else:
        sampler = TPESampler(seed=42)
        pruner = MedianPruner(
            n_startup_trials=10,
            n_warmup_steps=1,  # Prune after first seed
            interval_steps=1,
        )
        study = optuna.create_study(
            study_name=study_name,
            storage=storage,
            sampler=sampler,
            pruner=pruner,
            direction='maximize',
            load_if_exists=load_if_exists,
        )

    return study


def run_search(
    study_name: str,
    mode: Literal['neat', 'pure'],
    n_trials: int,
    generations: int,
    seeds: list[int],
    device: str = 'cpu',
    storage: str | None = None,
    multi_objective: bool = False,
    results_dir: str | None = None,
) -> optuna.Study:
    """
    Run hyperparameter search.

    Args:
        study_name: Unique identifier for this search
        mode: 'neat' or 'pure'
        n_trials: Number of configurations to try
        generations: Generations per trial
        seeds: Seeds to average over (more = more reliable but slower)
        device: PyTorch device
        storage: Database URL for persistence (None = in-memory)
        multi_objective: Use NSGA-II for Pareto optimization
        results_dir: Directory for trial results

    Returns:
        Completed Optuna study
    """

    # Setup results directory
    if results_dir is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        results_dir = Path(f"results/search_{study_name}_{timestamp}")
    else:
        results_dir = Path(results_dir)
    results_dir.mkdir(parents=True, exist_ok=True)

    # Create study
    study = create_study(
        study_name=study_name,
        mode=mode,
        storage=storage,
        multi_objective=multi_objective,
    )

    # Create objective
    if multi_objective:
        objective = create_multi_objective(
            mode=mode,
            generations=generations,
            seeds=seeds,
            device=device,
            results_dir=results_dir,
        )
    else:
        objective = create_objective(
            mode=mode,
            generations=generations,
            seeds=seeds,
            device=device,
            results_dir=results_dir,
        )

    # Run optimization
    print(f"\nStarting search: {study_name}")
    print(f"  Mode: {mode}")
    print(f"  Trials: {n_trials}")
    print(f"  Generations: {generations}")
    print(f"  Seeds: {seeds}")
    print(f"  Device: {device}")
    print(f"  Results: {results_dir}")
    print()

    study.optimize(
        objective,
        n_trials=n_trials,
        show_progress_bar=True,
    )

    # Save study summary
    summary = {
        'study_name': study_name,
        'mode': mode,
        'n_trials': n_trials,
        'generations': generations,
        'seeds': seeds,
        'completed_trials': len(study.trials),
    }

    if not multi_objective:
        summary['best_trial'] = study.best_trial.number
        summary['best_value'] = study.best_value
        summary['best_params'] = study.best_params

    with open(results_dir / 'summary.json', 'w') as f:
        json.dump(summary, f, indent=2)

    return study


# =============================================================================
# ANALYSIS
# =============================================================================

def get_param_importance(study: optuna.Study) -> dict[str, float]:
    """
    Get parameter importance using fANOVA.

    Returns dict mapping param name -> importance score (0-1).
    Higher = more important for fitness.
    """
    try:
        importance = optuna.importance.get_param_importances(study)
        return dict(importance)
    except Exception as e:
        print(f"Warning: Could not compute importance: {e}")
        return {}


def get_pareto_front(study: optuna.Study) -> list[optuna.trial.FrozenTrial]:
    """
    Get Pareto-optimal trials from a multi-objective study.
    """
    return study.best_trials


def print_study_summary(study: optuna.Study, top_n: int = 10):
    """Print a summary of the study results."""

    print("\n" + "=" * 60)
    print("STUDY SUMMARY")
    print("=" * 60)

    completed = [t for t in study.trials if t.state == optuna.trial.TrialState.COMPLETE]
    pruned = [t for t in study.trials if t.state == optuna.trial.TrialState.PRUNED]

    print(f"\nTrials: {len(completed)} completed, {len(pruned)} pruned")

    if hasattr(study, 'best_trial'):
        # Single-objective
        print(f"\nBest trial: #{study.best_trial.number}")
        print(f"Best fitness: {study.best_value:.1f}")
        print("\nBest parameters:")
        for name, value in sorted(study.best_params.items()):
            print(f"  {name}: {value}")

        # Parameter importance
        print("\nParameter importance (fANOVA):")
        importance = get_param_importance(study)
        for name, score in sorted(importance.items(), key=lambda x: -x[1])[:15]:
            bar = "█" * int(score * 30)
            print(f"  {name:35s} {score:.3f} {bar}")
    else:
        # Multi-objective
        pareto = get_pareto_front(study)
        print(f"\nPareto front: {len(pareto)} trials")
        for trial in pareto[:top_n]:
            print(f"  Trial {trial.number}: best={trial.values[0]:.1f}, avg={trial.values[1]:.1f}")

    print("\n" + "=" * 60)
