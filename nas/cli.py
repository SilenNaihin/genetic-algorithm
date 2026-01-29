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
):
    """
    Run evolution experiment with specified config.

    Examples:
        nas run --config neat_baseline --generations 100 --seeds 3
        nas run -c neat_sparse -g 50 -s 1 --population-size 500
    """
    import torch
    from configs import get_config, list_configs, CONFIGS
    from runner import run_evolution, run_multi_seed, get_aggregate_stats, GenerationStats
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
    console.print()

    results = []

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


if __name__ == "__main__":
    app()
