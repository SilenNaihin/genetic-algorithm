"""
Results persistence for NAS.

Writes fitness curves to JSON incrementally (crash-safe).
Stores config + per-gen stats + best genome.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any

from runner import RunResult, GenerationStats, get_aggregate_stats


RESULTS_DIR = Path(__file__).parent / "results"


def ensure_results_dir():
    """Ensure results directory exists."""
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def get_result_path(config_name: str, timestamp: str | None = None) -> Path:
    """Get path for a result file."""
    if timestamp is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return RESULTS_DIR / f"{config_name}_{timestamp}.json"


def generation_stats_to_dict(stats: GenerationStats) -> dict[str, Any]:
    """Convert GenerationStats to dict."""
    return {
        'generation': stats.generation,
        'best_fitness': stats.best_fitness,
        'avg_fitness': stats.avg_fitness,
        'median_fitness': stats.median_fitness,
        'worst_fitness': stats.worst_fitness,
        'simulation_time_ms': stats.simulation_time_ms,
        'evolution_time_ms': stats.evolution_time_ms,
    }


def run_result_to_dict(result: RunResult) -> dict[str, Any]:
    """Convert RunResult to dict for JSON serialization."""
    return {
        'config': result.config,
        'seed': result.seed,
        'generations': [generation_stats_to_dict(g) for g in result.generations],
        'best_genome': result.best_genome,
        'best_fitness': result.best_fitness,
        'total_time_s': result.total_time_s,
        'creatures_per_second': result.creatures_per_second,
    }


class IncrementalResultWriter:
    """
    Writes results incrementally to JSON file.

    Crash-safe: partial results are still valid JSON.
    """

    def __init__(self, config_name: str, config: dict[str, Any], seeds: list[int]):
        """Initialize writer with config metadata."""
        ensure_results_dir()
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.path = get_result_path(config_name, self.timestamp)
        self.config_name = config_name
        self.config = config
        self.seeds = seeds
        self.seed_results: list[dict[str, Any]] = []
        self.current_seed_idx = 0
        self.current_generations: list[dict[str, Any]] = []

        # Write initial structure
        self._write()

    def _write(self):
        """Write current state to file."""
        data = {
            'config_name': self.config_name,
            'config': self.config,
            'seeds': self.seeds,
            'timestamp': self.timestamp,
            'status': 'in_progress',
            'seed_results': self.seed_results,
            'current_seed': {
                'seed_idx': self.current_seed_idx,
                'seed': self.seeds[self.current_seed_idx] if self.current_seed_idx < len(self.seeds) else None,
                'generations': self.current_generations,
            } if self.current_seed_idx < len(self.seeds) else None,
        }

        with open(self.path, 'w') as f:
            json.dump(data, f, indent=2)

    def start_seed(self, seed_idx: int):
        """Start a new seed run."""
        self.current_seed_idx = seed_idx
        self.current_generations = []
        self._write()

    def add_generation(self, stats: GenerationStats):
        """Add a generation's stats."""
        self.current_generations.append(generation_stats_to_dict(stats))
        # Write every 10 generations to reduce I/O
        if len(self.current_generations) % 10 == 0:
            self._write()

    def complete_seed(self, result: RunResult):
        """Complete a seed run."""
        self.seed_results.append(run_result_to_dict(result))
        self.current_generations = []
        self._write()

    def complete_all(self, aggregate_stats: dict[str, Any] | None = None):
        """Mark run as complete with aggregate stats."""
        data = {
            'config_name': self.config_name,
            'config': self.config,
            'seeds': self.seeds,
            'timestamp': self.timestamp,
            'status': 'completed',
            'seed_results': self.seed_results,
            'aggregate': aggregate_stats,
        }

        with open(self.path, 'w') as f:
            json.dump(data, f, indent=2)


def load_result(path: str | Path) -> dict[str, Any]:
    """Load a result file."""
    with open(path) as f:
        return json.load(f)


def list_results() -> list[dict[str, Any]]:
    """List all result files with summary info."""
    ensure_results_dir()
    results = []

    for path in sorted(RESULTS_DIR.glob("*.json"), reverse=True):
        try:
            data = load_result(path)
            results.append({
                'path': str(path),
                'config_name': data.get('config_name', 'unknown'),
                'timestamp': data.get('timestamp', ''),
                'status': data.get('status', 'unknown'),
                'seeds': len(data.get('seed_results', [])),
                'best_fitness': data.get('aggregate', {}).get('best_fitness', {}).get('mean', 0),
            })
        except Exception as e:
            results.append({
                'path': str(path),
                'error': str(e),
            })

    return results


def compare_results(paths: list[str | Path]) -> list[dict[str, Any]]:
    """Load and compare multiple result files."""
    comparisons = []

    for path in paths:
        try:
            data = load_result(path)
            agg = data.get('aggregate', {})
            comparisons.append({
                'config_name': data.get('config_name', 'unknown'),
                'timestamp': data.get('timestamp', ''),
                'best_fitness_mean': agg.get('best_fitness', {}).get('mean', 0),
                'best_fitness_std': agg.get('best_fitness', {}).get('std', 0),
                'final_avg_mean': agg.get('final_avg_fitness', {}).get('mean', 0),
                'total_time_mean': agg.get('total_time_s', {}).get('mean', 0),
                'seeds': agg.get('seeds', 0),
            })
        except Exception as e:
            comparisons.append({
                'path': str(path),
                'error': str(e),
            })

    return comparisons
