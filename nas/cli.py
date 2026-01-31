#!/usr/bin/env python3
"""
NAS CLI - Neural Architecture Search for Evolution Lab.

Run evolution experiments without database overhead for maximum speed.
"""

import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn, TimeElapsedColumn

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

app = typer.Typer(
    name="nas",
    help="Neural Architecture Search CLI for Evolution Lab",
    no_args_is_help=True,
)
console = Console()


@app.command()
def run(
    config: str = typer.Option("neat_baseline", "--config", "-c", help="Config name or 'custom'"),
    generations: int = typer.Option(100, "--generations", "-g", help="Number of generations"),
    seeds: int = typer.Option(3, "--seeds", "-s", help="Number of random seeds"),
    population_size: Optional[int] = typer.Option(None, "--population-size", "-p", help="Override population size"),
    device: Optional[str] = typer.Option(None, "--device", "-d", help="PyTorch device (cuda:0, cuda:1, cpu)"),
    quiet: bool = typer.Option(False, "--quiet", "-q", help="Minimal output"),
    batched: bool = typer.Option(True, "--batched/--no-batched", "-b", help="Batch all seeds together (1.4-1.6x faster)"),
    sparse_store: bool = typer.Option(False, "--sparse-store", help="Store frames for top 10 + bottom 10 creatures (for replays)"),
):
    """
    Run evolution experiment with specified config.

    Examples:
        nas run --config neat_baseline --generations 100 --seeds 3
        nas run -c neat_sparse -g 50 -s 1 --population-size 500
    """
    import torch
    from configs import get_config, list_configs, CONFIGS
    from runner import run_evolution, run_multi_seed, run_multi_seed_batched, get_aggregate_stats, GenerationStats
    from results_io import IncrementalResultWriter

    # Get config
    try:
        cfg = get_config(config)
    except ValueError as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)

    # Apply overrides
    if population_size:
        cfg['population_size'] = population_size

    # Enable sparse frame storage for replays
    if sparse_store:
        cfg['frame_storage_mode'] = 'sparse'
        cfg['sparse_top_count'] = 10
        cfg['sparse_bottom_count'] = 10

    # Parse device
    torch_device = None
    if device:
        torch_device = torch.device(device)
    elif torch.cuda.is_available():
        torch_device = torch.device('cuda:0')
        console.print(f"[green]Using GPU:[/green] {torch.cuda.get_device_name(0)}")

    # Seed list
    seed_list = [42, 123, 456, 789, 1337][:seeds]

    # Setup result writer
    writer = IncrementalResultWriter(config, cfg, seed_list)
    console.print(f"[blue]Results will be saved to:[/blue] {writer.path}")

    # Run
    console.print(f"\n[bold]Running {config}[/bold]")
    console.print(f"  Generations: {generations}")
    console.print(f"  Population: {cfg['population_size']}")
    console.print(f"  Seeds: {seed_list}")
    console.print(f"  Mode: {cfg.get('neural_mode', 'pure')}")
    console.print(f"  Batched: {batched}")
    console.print()

    results = []

    if batched and len(seed_list) > 1:
        # Use batched runner for better throughput
        console.print("[yellow]Using batched mode (all seeds simulated together)[/yellow]\n")

        # Track generation progress for each seed
        last_gen_per_seed = [-1] * len(seed_list)

        def on_generation_batched(seed_idx: int, stats: GenerationStats):
            # Initialize seed tracking on first generation
            if last_gen_per_seed[seed_idx] < 0:
                writer.start_seed(seed_idx)
            last_gen_per_seed[seed_idx] = stats.generation
            writer.add_generation(stats, seed_idx=seed_idx)
            if not quiet and stats.generation % 10 == 0 and seed_idx == 0:
                # Only print progress for first seed to avoid spam
                console.print(f"  gen {stats.generation+1:3d}/{generations} | best: {stats.best_fitness:6.1f} | avg: {stats.avg_fitness:6.1f}")

        results = run_multi_seed_batched(
            config=cfg,
            generations=generations,
            seeds=seed_list,
            device=torch_device,
            callback=on_generation_batched,
            verbose=not quiet,
        )

        # Complete each seed in the writer
        for i, result in enumerate(results):
            writer.complete_seed(result, seed_idx=i)
            console.print(f"  [green]Seed {seed_list[i]}:[/green] Best: {result.best_fitness:.1f}")

        console.print(f"\n  [green]Total:[/green] {results[0].creatures_per_second:.0f} creatures/s")

    else:
        # Use sequential runner
        for i, seed in enumerate(seed_list):
            console.print(f"[cyan][seed {i+1}/{len(seed_list)}][/cyan] seed={seed}")
            writer.start_seed(i)

            def on_generation(stats: GenerationStats):
                writer.add_generation(stats)
                if not quiet and stats.generation % 10 == 0:
                    console.print(f"  gen {stats.generation+1:3d}/{generations} | best: {stats.best_fitness:6.1f} | avg: {stats.avg_fitness:6.1f} | {stats.simulation_time_ms}ms")

            result = run_evolution(
                config=cfg,
                generations=generations,
                seed=seed,
                device=torch_device,
                callback=on_generation,
                verbose=not quiet,
            )
            results.append(result)
            writer.complete_seed(result)

            console.print(f"  [green]Done![/green] Best: {result.best_fitness:.1f} | Time: {result.total_time_s:.1f}s | {result.creatures_per_second:.0f} creatures/s\n")

    # Aggregate stats
    agg = get_aggregate_stats(results)
    writer.complete_all(agg)

    # Summary
    console.print("\n[bold]Summary[/bold]")
    console.print(f"  Config: {config}")
    console.print(f"  Best fitness: {agg['best_fitness']['mean']:.1f} +/- {agg['best_fitness']['std']:.1f}")
    console.print(f"  Final avg: {agg['final_avg_fitness']['mean']:.1f} +/- {agg['final_avg_fitness']['std']:.1f}")
    console.print(f"  Time: {agg['total_time_s']['mean']:.1f}s +/- {agg['total_time_s']['std']:.1f}s")
    console.print(f"\n[blue]Results saved to:[/blue] {writer.path}")


@app.command()
def configs():
    """List available configurations."""
    from configs import CONFIGS

    table = Table(title="Available Configurations")
    table.add_column("Name", style="cyan")
    table.add_column("Mode", style="green")
    table.add_column("Population")
    table.add_column("Description")

    descriptions = {
        'neat_baseline': 'NEAT with standard settings',
        'neat_sparse': 'NEAT starting with sparse connectivity',
        'neat_minimal': 'NEAT starting with no connections',
        'neat_aggressive': 'NEAT with high structural mutation',
        'neat_conservative': 'NEAT with tight speciation',
        'neat_high_mutation': 'NEAT with high mutation rates',
        'neat_low_mutation': 'NEAT with low mutation rates',
        'neat_proprio': 'NEAT with proprioception (body sensing)',
        'pure_baseline': 'Fixed topology, 8 hidden neurons',
        'pure_large': 'Fixed topology, 16 hidden neurons',
        'pure_small': 'Fixed topology, 4 hidden neurons',
        'pure_high_mutation': 'Pure with high mutation rates',
        'hybrid_baseline': 'Hybrid mode with cyclic time encoding',
        'hybrid_sin': 'Hybrid mode with sin time encoding',
        'pop_small': 'NEAT with small population (100)',
        'pop_medium': 'NEAT with medium population (300)',
        'pop_large': 'NEAT with large population (500)',
        'select_tournament': 'Pure with tournament selection',
        'select_truncation': 'Pure with truncation selection',
    }

    for name, cfg in CONFIGS.items():
        table.add_row(
            name,
            cfg.get('neural_mode', 'pure'),
            str(cfg.get('population_size', 200)),
            descriptions.get(name, ''),
        )

    console.print(table)


@app.command()
def results():
    """List all result files."""
    from results_io import list_results

    result_list = list_results()

    if not result_list:
        console.print("[yellow]No results found.[/yellow]")
        return

    table = Table(title="NAS Results")
    table.add_column("Config", style="cyan")
    table.add_column("Timestamp")
    table.add_column("Status", style="green")
    table.add_column("Seeds")
    table.add_column("Best Fitness")
    table.add_column("Path")

    for r in result_list:
        if 'error' in r:
            table.add_row(r.get('path', ''), '', '[red]error[/red]', '', '', str(r.get('error', '')))
        else:
            table.add_row(
                r.get('config_name', ''),
                r.get('timestamp', ''),
                r.get('status', ''),
                str(r.get('seeds', '')),
                f"{r.get('best_fitness', 0):.1f}" if r.get('best_fitness') else '',
                str(r.get('path', '')),
            )

    console.print(table)


@app.command()
def compare(
    configs_to_compare: list[str] = typer.Argument(..., help="Config names to compare (space-separated)"),
):
    """
    Compare results from multiple configs.

    Example:
        nas compare neat_baseline neat_sparse neat_minimal
    """
    from results_io import RESULTS_DIR, load_result

    # Find result files for each config
    results_data = []

    for config_name in configs_to_compare:
        # Find most recent result file for this config
        matching = list(RESULTS_DIR.glob(f"{config_name}_*.json"))
        if not matching:
            console.print(f"[yellow]No results found for '{config_name}'[/yellow]")
            continue

        latest = sorted(matching)[-1]
        try:
            data = load_result(latest)
            agg = data.get('aggregate', {})
            results_data.append({
                'config': config_name,
                'best_mean': agg.get('best_fitness', {}).get('mean', 0),
                'best_std': agg.get('best_fitness', {}).get('std', 0),
                'final_avg': agg.get('final_avg_fitness', {}).get('mean', 0),
                'time': agg.get('total_time_s', {}).get('mean', 0),
                'seeds': agg.get('seeds', 0),
            })
        except Exception as e:
            console.print(f"[red]Error loading {latest}: {e}[/red]")

    if not results_data:
        console.print("[red]No valid results to compare.[/red]")
        raise typer.Exit(1)

    # Sort by best fitness
    results_data.sort(key=lambda x: x['best_mean'], reverse=True)

    table = Table(title="Comparison Results")
    table.add_column("Rank", style="bold")
    table.add_column("Config", style="cyan")
    table.add_column("Best Fitness", style="green")
    table.add_column("Std")
    table.add_column("Final Avg")
    table.add_column("Time (s)")
    table.add_column("Seeds")

    for i, r in enumerate(results_data):
        table.add_row(
            str(i + 1),
            r['config'],
            f"{r['best_mean']:.1f}",
            f"{r['best_std']:.1f}",
            f"{r['final_avg']:.1f}",
            f"{r['time']:.1f}",
            str(r['seeds']),
        )

    console.print(table)


@app.command()
def show(
    config: str = typer.Argument(..., help="Config name to show details"),
):
    """Show detailed results for a config."""
    from results_io import RESULTS_DIR, load_result

    # Find result file
    matching = list(RESULTS_DIR.glob(f"{config}_*.json"))
    if not matching:
        console.print(f"[red]No results found for '{config}'[/red]")
        raise typer.Exit(1)

    latest = sorted(matching)[-1]
    data = load_result(latest)

    console.print(f"\n[bold]Results for {config}[/bold]")
    console.print(f"Timestamp: {data.get('timestamp', '')}")
    console.print(f"Status: {data.get('status', '')}")

    # Config summary
    cfg = data.get('config', {})
    console.print(f"\n[bold]Config:[/bold]")
    console.print(f"  Mode: {cfg.get('neural_mode', 'pure')}")
    console.print(f"  Population: {cfg.get('population_size', 0)}")
    if cfg.get('neural_mode') == 'neat':
        console.print(f"  NEAT connectivity: {cfg.get('neat_initial_connectivity', '')}")
        console.print(f"  NEAT add connection: {cfg.get('neat_add_connection_rate', 0)}")
        console.print(f"  NEAT add node: {cfg.get('neat_add_node_rate', 0)}")

    # Aggregate stats
    agg = data.get('aggregate', {})
    if agg:
        console.print(f"\n[bold]Aggregate Stats:[/bold]")
        bf = agg.get('best_fitness', {})
        console.print(f"  Best fitness: {bf.get('mean', 0):.1f} +/- {bf.get('std', 0):.1f} (min: {bf.get('min', 0):.1f}, max: {bf.get('max', 0):.1f})")
        faf = agg.get('final_avg_fitness', {})
        console.print(f"  Final avg: {faf.get('mean', 0):.1f} +/- {faf.get('std', 0):.1f}")
        ts = agg.get('total_time_s', {})
        console.print(f"  Time: {ts.get('mean', 0):.1f}s +/- {ts.get('std', 0):.1f}s")

    # Per-seed summary
    seed_results = data.get('seed_results', [])
    if seed_results:
        console.print(f"\n[bold]Per-Seed Results:[/bold]")
        for i, sr in enumerate(seed_results):
            console.print(f"  Seed {sr.get('seed', i)}: best={sr.get('best_fitness', 0):.1f}, time={sr.get('total_time_s', 0):.1f}s")


@app.command()
def benchmark(
    population_size: int = typer.Option(500, "--population-size", "-p", help="Population size to test"),
    generations: int = typer.Option(10, "--generations", "-g", help="Generations to test"),
    config: str = typer.Option("neat_baseline", "--config", "-c", help="Config to use"),
    device: Optional[str] = typer.Option(None, "--device", "-d", help="PyTorch device"),
):
    """
    Benchmark simulation speed.

    Useful for finding optimal batch size for your GPU.
    """
    import time
    import torch
    from configs import get_config
    from runner import run_evolution

    cfg = get_config(config)
    cfg['population_size'] = population_size

    torch_device = None
    if device:
        torch_device = torch.device(device)
    elif torch.cuda.is_available():
        torch_device = torch.device('cuda:0')

    console.print(f"[bold]Benchmarking[/bold]")
    console.print(f"  Config: {config}")
    console.print(f"  Mode: {cfg.get('neural_mode', 'pure')}")
    console.print(f"  Population: {population_size}")
    console.print(f"  Generations: {generations}")
    console.print(f"  Device: {torch_device or 'cpu'}")
    console.print()

    start = time.time()
    result = run_evolution(
        config=cfg,
        generations=generations,
        seed=42,
        device=torch_device,
        verbose=True,
    )
    elapsed = time.time() - start

    total_creatures = population_size * generations
    console.print(f"\n[bold]Results:[/bold]")
    console.print(f"  Total time: {elapsed:.2f}s")
    console.print(f"  Creatures simulated: {total_creatures}")
    console.print(f"  Creatures/second: {total_creatures/elapsed:.0f}")
    console.print(f"  Time per generation: {elapsed/generations*1000:.0f}ms")


@app.command()
def search(
    study_name: str = typer.Argument(..., help="Unique name for this search study"),
    mode: str = typer.Option("neat", "--mode", "-m", help="Mode: 'neat' or 'pure'"),
    n_trials: int = typer.Option(50, "--trials", "-n", help="Number of trials to run"),
    generations: int = typer.Option(30, "--generations", "-g", help="Generations per trial"),
    seeds: int = typer.Option(2, "--seeds", "-s", help="Seeds per trial (more = more reliable)"),
    population_size: int = typer.Option(300, "--population-size", "-p", help="Fixed population size (not optimized)"),
    device: Optional[str] = typer.Option(None, "--device", "-d", help="PyTorch device"),
    storage: Optional[str] = typer.Option(None, "--storage", help="Optuna storage URL for fANOVA importance (optional)"),
    multi_objective: bool = typer.Option(False, "--multi-objective", "-mo", help="Use NSGA-II for Pareto optimization"),
    stagnation_limit: int = typer.Option(50, "--stagnation-limit", help="Stop trial early if no improvement for N generations (0 to disable)"),
    n_jobs: int = typer.Option(1, "--n-jobs", "-j", help="Parallel workers (1=sequential, -1=all cores, recommended: 15-20 for 128-core)"),
    limit_threads: bool = typer.Option(False, "--limit-threads", help="Force single-threaded PyTorch (fixes nested parallelism when n_jobs > 1)"),
):
    """
    Run Optuna hyperparameter search.

    Results saved to JSON in results/search_<study>_<timestamp>/.

    Examples:
        # Quick screening (50 trials, 30 gens, 2 seeds) - sequential
        nas search exp-001 --mode neat --trials 50 --generations 30 --seeds 2

        # Full search with 20 parallel workers (recommended for 128-core)
        nas search neat-full -m neat -n 50 -g 50 -s 3 -p 200 --n-jobs 20

        # Multi-objective Pareto search with parallelism
        nas search exp-003 -m neat -n 100 --multi-objective --n-jobs 15
    """
    import torch
    from search import run_search, print_study_summary

    # Parse device
    torch_device = device or ('cuda:0' if torch.cuda.is_available() else 'cpu')

    seed_list = [42, 123, 456, 789, 1337][:seeds]

    console.print(f"\n[bold]Starting Hyperparameter Search[/bold]")
    console.print(f"  Study: {study_name}")
    console.print(f"  Mode: {mode}")
    console.print(f"  Trials: {n_trials}")
    console.print(f"  Generations: {generations}")
    console.print(f"  Population: {population_size}")
    console.print(f"  Seeds: {seed_list}")
    console.print(f"  Device: {torch_device}")
    console.print(f"  Multi-objective: {multi_objective}")
    console.print(f"  Parallel workers: {n_jobs if n_jobs > 0 else 'all cores'}")
    if limit_threads:
        console.print(f"  Thread limiting: ENABLED (prevents nested parallelism)")
    if stagnation_limit > 0:
        console.print(f"  Early stop: {stagnation_limit} gens without improvement")
    if storage:
        console.print(f"  Storage: {storage}")
    console.print()

    study, results_dir = run_search(
        study_name=study_name,
        mode=mode,
        n_trials=n_trials,
        generations=generations,
        seeds=seed_list,
        device=torch_device,
        storage=storage,
        multi_objective=multi_objective,
        population_size=population_size,
        stagnation_limit=stagnation_limit,
        n_jobs=n_jobs,
        limit_threads=limit_threads,
    )

    # Print summary
    print_study_summary(study)
    console.print(f"\n[bold green]Search complete![/bold green]")
    console.print(f"Results saved to: {results_dir}")

    # Print analysis command
    console.print(f"\n[bold cyan]To generate analysis notebook, run:[/bold cyan]")
    console.print(f'claude "Create nas_postmortem.ipynb following nas/post-mortem-nas.md. '
                  f'Results in {results_dir}. Be thorough."')


@app.command()
def importance(
    study_name: str = typer.Argument(..., help="Study name to analyze"),
    storage: str = typer.Option(..., "--storage", help="Optuna storage URL (required)"),
    top_n: int = typer.Option(15, "--top", "-n", help="Number of top parameters to show"),
):
    """
    Show parameter importance from a completed search.

    Uses fANOVA to analyze which parameters most affect fitness.
    Requires --storage flag to have been used during search.

    Example:
        nas importance exp-001 --storage postgresql://user:pass@host/db
    """
    import optuna
    from search import get_param_importance

    try:
        study = optuna.load_study(study_name=study_name, storage=storage)
    except Exception as e:
        console.print(f"[red]Error loading study '{study_name}': {e}[/red]")
        raise typer.Exit(1)

    completed = [t for t in study.trials if t.state == optuna.trial.TrialState.COMPLETE]
    console.print(f"\n[bold]Parameter Importance Analysis[/bold]")
    console.print(f"  Study: {study_name}")
    console.print(f"  Completed trials: {len(completed)}")

    if len(completed) < 10:
        console.print("[yellow]Warning: Need at least 10 completed trials for reliable importance analysis[/yellow]")

    importance = get_param_importance(study)

    if not importance:
        console.print("[red]Could not compute parameter importance[/red]")
        raise typer.Exit(1)

    console.print(f"\n[bold]Top {top_n} Most Important Parameters:[/bold]\n")

    # Sort by importance
    sorted_params = sorted(importance.items(), key=lambda x: -x[1])[:top_n]

    for name, score in sorted_params:
        bar_len = int(score * 40)
        bar = "█" * bar_len + "░" * (40 - bar_len)
        console.print(f"  {name:35s} {score:.3f} {bar}")

    # Best params
    if hasattr(study, 'best_params'):
        console.print(f"\n[bold]Best Trial Parameters:[/bold]")
        console.print(f"  Best fitness: {study.best_value:.1f}")
        for name, value in sorted(study.best_params.items()):
            if name in [p[0] for p in sorted_params[:10]]:  # Highlight important ones
                console.print(f"  [green]{name}[/green]: {value}")
            else:
                console.print(f"  {name}: {value}")


@app.command()
def parallel(
    configs_list: list[str] = typer.Argument(..., help="Config names to run in parallel"),
    generations: int = typer.Option(50, "--generations", "-g", help="Generations per config"),
    seeds: int = typer.Option(1, "--seeds", "-s", help="Seeds per config"),
):
    """
    Run multiple configs in parallel (one per GPU).

    Example:
        nas parallel neat_baseline neat_sparse -g 50 -s 3
    """
    import subprocess
    import os

    seed_list = [42, 123, 456, 789, 1337][:seeds]

    # Get available GPUs
    import torch
    num_gpus = torch.cuda.device_count() if torch.cuda.is_available() else 1

    console.print(f"[bold]Running {len(configs_list)} configs in parallel[/bold]")
    console.print(f"  GPUs available: {num_gpus}")
    console.print(f"  Generations: {generations}")
    console.print(f"  Seeds: {seed_list}")

    # Launch each config as a separate process
    processes = []
    for i, config_name in enumerate(configs_list):
        device = f"cuda:{i % num_gpus}" if torch.cuda.is_available() else "cpu"
        cmd = [
            "python", "cli.py", "run",
            "--config", config_name,
            "--generations", str(generations),
            "--seeds", str(seeds),
            "--device", device,
            "--quiet",
        ]
        console.print(f"  Starting {config_name} on {device}")
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        processes.append((config_name, proc))

    # Wait for all to complete
    console.print("\n[yellow]Waiting for processes to complete...[/yellow]")
    for config_name, proc in processes:
        proc.wait()
        console.print(f"  [green]{config_name} completed[/green]")

    console.print("\n[bold]All configs completed![/bold]")
    console.print("Use 'nas results' to see results or 'nas compare' to compare them.")


@app.command(name="store-trials")
def store_trials(
    top_best: Optional[int] = typer.Option(None, "--top-best", help="Run top N by max fitness"),
    top_avg: Optional[int] = typer.Option(None, "--top-avg", help="Run top N by avg fitness"),
    trials: Optional[list[int]] = typer.Option(None, "--trials", "-t", help="Run specific trial numbers"),
    generations: int = typer.Option(50, "--generations", "-g", help="Number of generations"),
    population_size: int = typer.Option(100, "--population-size", "-p", help="Population size"),
    search: str = typer.Option("neat", "--search", "-s", help="Search to use: 'neat' or 'pure'"),
):
    """
    Run NAS trials with database storage.

    Runs specific trials from hyperparameter searches and stores
    results in PostgreSQL for viewing in the frontend.

    Examples:
        # Run top 5 NEAT by max fitness
        nas store-trials --top-best 5 --generations 100 --search neat

        # Run top 5 Pure by max fitness
        nas store-trials --top-best 5 --generations 100 --search pure

        # Run specific trials
        nas store-trials --trials 68 57 90 --generations 50
    """
    import httpx
    import json
    import time
    from pathlib import Path

    API_BASE = "http://localhost:8000"

    # Select search directories
    if search == "neat":
        # Combine both NEAT searches (100 + 137 = 237 trials)
        RESULTS_DIRS = [
            Path(__file__).parent / "results" / "search_neat-full_20260129_190418",
            Path(__file__).parent / "results" / "search_pool_neat-full-200_20260131_100700",
        ]
        mode_name = "NEAT"
    elif search == "pure":
        RESULTS_DIRS = [
            Path(__file__).parent / "results" / "search_pool_pure-full-200_20260131_100700",
        ]
        mode_name = "Pure"
    else:
        console.print(f"[red]Error: Unknown search '{search}'. Use 'neat' or 'pure'.[/red]")
        raise typer.Exit(1)

    # Load trials from all directories
    all_trials = []
    for results_dir in RESULTS_DIRS:
        source = results_dir.name
        for f in results_dir.glob("trial_*.json"):
            with open(f) as fp:
                trial = json.load(fp)
                # Normalize trial_id vs trial_number
                trial["trial_number"] = trial.get("trial_number") or trial.get("trial_id")
                trial["source"] = source  # Track which search it came from
                all_trials.append(trial)

    # Create unique keys combining source + trial number
    trial_map = {(t["source"], t["trial_number"]): t for t in all_trials}
    console.print(f"  Loaded {len(all_trials)} trials from {len(RESULTS_DIRS)} search(es)")

    # Determine which trials to run
    to_run = []

    if top_best:
        sorted_trials = sorted(all_trials, key=lambda t: t["mean_best_fitness"], reverse=True)[:top_best]
        for t in sorted_trials:
            to_run.append((t, "top-best"))

    if top_avg:
        sorted_trials = sorted(all_trials, key=lambda t: t["mean_avg_fitness"], reverse=True)[:top_avg]
        for t in sorted_trials:
            to_run.append((t, "top-avg"))

    if trials:
        # For manual trials, search all sources
        for num in trials:
            found = False
            for t in all_trials:
                if t["trial_number"] == num:
                    to_run.append((t, "manual"))
                    found = True
                    break
            if not found:
                console.print(f"[yellow]Warning: Trial {num} not found[/yellow]")

    if not to_run:
        console.print("[red]Error: Must specify --top-best, --top-avg, or --trials[/red]")
        raise typer.Exit(1)

    # Deduplicate by (source, trial_number) to handle same trial numbers across searches
    seen = set()
    unique_runs = []
    for trial, category in to_run:
        key = (trial["source"], trial["trial_number"])
        if key not in seen:
            seen.add(key)
            unique_runs.append((trial, category))

    console.print(f"\n[bold]Running {len(unique_runs)} {mode_name} trials with database storage[/bold]")
    console.print(f"  Generations: {generations}")
    console.print(f"  Population: {population_size}")
    console.print(f"  Frame storage: sparse (top 10 + bottom 5)")

    # Check backend
    with httpx.Client() as client:
        try:
            response = client.get(f"{API_BASE}/api/health", timeout=5)
            response.raise_for_status()
            health = response.json()
            console.print(f"[green]Backend connected:[/green] {health.get('device', 'unknown')} mode\n")
        except Exception:
            console.print(f"[red]Error: Backend not available at {API_BASE}[/red]")
            console.print(f"  Start it with: cd backend && uvicorn app.main:app --reload --port 8000")
            raise typer.Exit(1)

        results = []
        for trial, category in unique_runs:
            trial_num = trial["trial_number"]
            source = trial["source"]
            # Shorten source name for display
            source_short = "n100" if "20260129" in source else "n200" if "neat" in source.lower() else "p200"
            run_name = f"{mode_name} {source_short} #{trial_num} ({category})"
            params = trial["params"]

            # Handle different fitness key names
            expected_fitness = trial.get("mean_best_fitness") or trial.get("best_fitness", 0)
            console.print(f"[cyan]Starting {source_short} Trial {trial_num}[/cyan] - expected best: {expected_fitness:.1f}")

            # Build base config
            cfg = {
                "gravity": -9.8,
                "ground_friction": 0.5,
                "time_step": 1/30,
                "simulation_duration": 30,  # Match original NAS search
                "muscle_velocity_cap": 5.0,
                "muscle_damping_multiplier": 1.0,
                "max_extension_ratio": 2.0,
                "population_size": population_size,
                "tournament_size": 3,
                "elite_count": 5,
                "pellet_count": 3,
                "arena_size": 10,
                "fitness_pellet_points": 20,
                "fitness_progress_max": 80,
                "fitness_distance_per_unit": 3,
                "fitness_distance_traveled_max": 20,
                "fitness_regression_penalty": 20,
                "use_neural_net": True,
                "neural_activation": "tanh",
                "weight_mutation_decay": "linear",
                "fitness_efficiency_penalty": 0.1,
                "neural_update_hz": 10,
                "output_smoothing_alpha": 0.15,
                "stagnation_threshold": 20,
                "adaptive_mutation_boost": 2.0,
                "max_adaptive_boost": 8.0,
                "improvement_threshold": 5.0,
                "neural_crossover_method": "sbx",
                "sbx_eta": 2.0,
                "use_fitness_sharing": False,
                "sharing_radius": 0.5,
                "frame_storage_mode": "sparse",
                "frame_rate": 15,
                "sparse_top_count": 10,
                "sparse_bottom_count": 5,
                # Common trial params
                "neural_hidden_size": params.get("neural_hidden_size", 8),
                "weight_mutation_rate": params.get("weight_mutation_rate", 0.5),
                "weight_mutation_magnitude": params.get("weight_mutation_magnitude", 0.3),
                "mutation_rate": params.get("mutation_rate", 0.3),
                "mutation_magnitude": params.get("mutation_magnitude", 0.3),
                "cull_percentage": params.get("cull_percentage", 0.5),
                "use_crossover": params.get("use_crossover", True),
                "crossover_rate": params.get("crossover_rate", 0.5),
                "use_proprioception": params.get("use_proprioception", False),
                "proprioception_inputs": params.get("proprioception_inputs", "all"),
                "min_nodes": params.get("min_nodes", 3),
                "max_nodes": params.get("max_nodes", 8),
                "max_muscles": params.get("max_muscles", 15),
                "neural_dead_zone": params.get("neural_dead_zone", 0.1),
                "neural_output_bias": params.get("neural_output_bias", -0.1),
                "use_adaptive_mutation": params.get("use_adaptive_mutation", False),
            }

            # Mode-specific settings
            if search == "neat":
                cfg.update({
                    "neural_mode": "neat",
                    "selection_method": "speciation",
                    "bias_mode": params.get("bias_mode", "bias_node"),
                    "time_encoding": params.get("time_encoding", "none"),
                    "neat_initial_connectivity": params.get("neat_initial_connectivity", "full"),
                    "neat_add_connection_rate": params.get("neat_add_connection_rate", 0.5),
                    "neat_add_node_rate": params.get("neat_add_node_rate", 0.2),
                    "neat_enable_rate": params.get("neat_enable_rate", 0.02),
                    "neat_disable_rate": params.get("neat_disable_rate", 0.01),
                    "neat_max_hidden_nodes": params.get("neat_max_hidden_nodes", 32),
                    "compatibility_threshold": params.get("compatibility_threshold", 3.0),
                    "neat_excess_coefficient": params.get("neat_excess_coefficient", 1.0),
                    "neat_disjoint_coefficient": params.get("neat_disjoint_coefficient", 1.0),
                    "neat_weight_coefficient": params.get("neat_weight_coefficient", 0.4),
                    "min_species_size": params.get("min_species_size", 2),
                })
            else:  # pure
                cfg.update({
                    "neural_mode": "pure",
                    "selection_method": params.get("selection_method", "rank"),
                    "time_encoding": "none",
                })

            # Create run
            response = client.post(
                f"{API_BASE}/api/runs",
                json={"name": run_name, "config": cfg},
                timeout=30,
            )
            response.raise_for_status()
            run_id = response.json()["id"]

            # Run generations
            start_time = time.time()
            best_fitness = 0.0

            for gen in range(generations):
                response = client.post(
                    f"{API_BASE}/api/evolution/{run_id}/step",
                    timeout=120,
                )
                response.raise_for_status()
                result = response.json()
                best_fitness = max(best_fitness, result["best_fitness"])

                if gen % 10 == 0 or gen == generations - 1:
                    console.print(f"  Gen {gen+1:3d}/{generations}: "
                                 f"best={result['best_fitness']:6.1f} "
                                 f"avg={result['avg_fitness']:5.1f}")

            total_time = time.time() - start_time
            console.print(f"  [green]Done![/green] Best: {best_fitness:.1f} in {total_time:.1f}s\n")

            results.append({
                "trial": trial_num,
                "source": source_short,
                "category": category,
                "run_id": run_id,
                "best_fitness": best_fitness,
                "expected_best": expected_fitness,
                "time": total_time,
            })

        # Summary
        console.print(f"\n[bold]Summary[/bold]")
        for r in results:
            console.print(f"  {r['source']} #{r['trial']:3d} ({r['category']:8s}): "
                         f"actual={r['best_fitness']:6.1f} "
                         f"expected={r['expected_best']:6.1f} "
                         f"run_id={r['run_id']}")

        console.print(f"\n[cyan]View runs in browser:[/cyan] http://localhost:3001")


@app.command()
def store(
    config: str = typer.Option("nas_optimal", "--config", "-c", help="Config name"),
    name: Optional[str] = typer.Option(None, "--name", "-n", help="Run name (default: config name)"),
    generations: int = typer.Option(50, "--generations", "-g", help="Number of generations"),
    population_size: Optional[int] = typer.Option(None, "--population-size", "-p", help="Override population size"),
    sparse_store: bool = typer.Option(True, "--sparse-store/--no-store", help="Store frames for top 10 + bottom 5"),
):
    """
    Run evolution with database storage via backend API.

    This stores everything in PostgreSQL for viewing in the frontend.

    Examples:
        nas store --config nas_optimal --generations 50
        nas store -c nas_balanced -g 100 -n "My Balanced Run"
        nas store --config neat_baseline --population-size 200 --no-store
    """
    import httpx
    import time
    from configs import get_config

    API_BASE = "http://localhost:8000"

    # Get config
    try:
        cfg = get_config(config)
    except ValueError as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)

    # Apply overrides
    if population_size:
        cfg['population_size'] = population_size

    # Frame storage
    if sparse_store:
        cfg['frame_storage_mode'] = 'sparse'
        cfg['sparse_top_count'] = 10
        cfg['sparse_bottom_count'] = 5
    else:
        cfg['frame_storage_mode'] = 'none'

    run_name = name or f"NAS: {config}"

    console.print(f"\n[bold]Running with Database Storage[/bold]")
    console.print(f"  Config: {config}")
    console.print(f"  Name: {run_name}")
    console.print(f"  Generations: {generations}")
    console.print(f"  Population: {cfg['population_size']}")
    console.print(f"  Mode: {cfg.get('neural_mode', 'pure')}")
    console.print(f"  Frame storage: {cfg['frame_storage_mode']}")
    console.print()

    # Check backend is running
    with httpx.Client() as client:
        try:
            response = client.get(f"{API_BASE}/api/health", timeout=5)
            response.raise_for_status()
            health = response.json()
            console.print(f"[green]Backend connected:[/green] {health.get('device', 'unknown')} mode")
        except Exception as e:
            console.print(f"[red]Error: Backend not available at {API_BASE}[/red]")
            console.print(f"  Start it with: cd backend && uvicorn app.main:app --reload --port 8000")
            raise typer.Exit(1)

        # Create run
        console.print(f"\n[blue]Creating run...[/blue]")
        response = client.post(
            f"{API_BASE}/api/runs",
            json={"name": run_name, "config": cfg},
            timeout=30,
        )
        response.raise_for_status()
        run_data = response.json()
        run_id = run_data["id"]
        console.print(f"  Run ID: {run_id}")

        # Run generations
        console.print(f"\n[blue]Running {generations} generations...[/blue]")
        start_time = time.time()
        best_fitness = 0.0

        for gen in range(generations):
            gen_start = time.time()

            response = client.post(
                f"{API_BASE}/api/evolution/{run_id}/step",
                timeout=120,
            )
            response.raise_for_status()
            result = response.json()

            gen_time = time.time() - gen_start
            best_fitness = max(best_fitness, result["best_fitness"])

            if gen % 10 == 0 or gen == generations - 1:
                console.print(f"  Gen {gen+1:3d}/{generations}: "
                             f"best={result['best_fitness']:6.1f} "
                             f"avg={result['avg_fitness']:5.1f} "
                             f"time={gen_time:.1f}s")

        total_time = time.time() - start_time

        console.print(f"\n[bold green]Complete![/bold green]")
        console.print(f"  Best fitness: {best_fitness:.1f}")
        console.print(f"  Total time: {total_time:.1f}s")
        console.print(f"  Run ID: {run_id}")
        console.print(f"\n[cyan]View in browser:[/cyan] http://localhost:3001/run/{run_id}")


if __name__ == "__main__":
    app()
