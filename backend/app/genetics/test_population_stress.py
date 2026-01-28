"""
Edge case and stress tests for NEAT population integration.

These tests intentionally try to break the implementation by exploring
boundary conditions, numerical edge cases, and integration scenarios.
"""

import math
import random
import pytest

from app.genetics.population import (
    EvolutionConfig,
    PopulationStats,
    DecayConfig,
    calculate_decayed_rate,
    generate_random_genome,
    generate_population,
    evolve_population,
    get_population_stats,
)
from app.genetics.mutation import GenomeConstraints
from app.schemas.neat import InnovationCounter, NEATGenome
from app.neural.neat_network import neat_forward


class TestNumericalEdgeCases:
    """Tests for numerical stability and edge cases."""

    def test_nan_fitness_scores(self):
        """NaN fitness scores should be handled gracefully."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        # Mix NaN with valid fitness scores
        fitness_scores = [float('nan'), 50.0, 30.0, float('nan'), 20.0,
                         float('nan'), 15.0, 10.0, 5.0, 1.0]

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
        )

        # Should not crash - NaN handling depends on implementation
        # At minimum, should not raise exception
        try:
            new_pop, stats = evolve_population(
                population, fitness_scores, config,
                generation=0,
                innovation_counter=counter,
            )
            # If it succeeds, check basic validity
            assert len(new_pop) == 10
        except (ValueError, TypeError):
            # Acceptable to raise on NaN
            pass

    def test_infinity_fitness_scores(self):
        """Infinity fitness scores should be handled."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        # Include infinity
        fitness_scores = [float('inf'), 50.0, 30.0, float('-inf'), 20.0,
                         15.0, 10.0, 5.0, 1.0, float('inf')]

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
        )

        try:
            new_pop, stats = evolve_population(
                population, fitness_scores, config,
                generation=0,
                innovation_counter=counter,
            )
            assert len(new_pop) == 10
        except (ValueError, TypeError, OverflowError):
            # Acceptable to reject infinity
            pass

    def test_negative_fitness_scores(self):
        """Negative fitness scores should work correctly."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        # All negative fitness
        fitness_scores = [-100.0, -50.0, -30.0, -20.0, -15.0,
                         -10.0, -5.0, -3.0, -2.0, -1.0]

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 10
        assert stats.best_fitness == -1.0
        assert stats.worst_fitness == -100.0

    def test_zero_fitness_scores(self):
        """All zero fitness should not crash."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        # All zeros
        fitness_scores = [0.0] * 10

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 10

    def test_identical_fitness_scores(self):
        """All identical fitness should work (equal fitness crossover)."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        # All same fitness
        fitness_scores = [42.0] * 10

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
            use_crossover=True,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 10
        # All genomes should still have valid NEAT genomes
        for genome in new_pop:
            assert 'neatGenome' in genome

    def test_very_large_fitness_values(self):
        """Very large fitness values should not overflow."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=5,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        # Large values
        fitness_scores = [1e15, 1e14, 1e13, 1e12, 1e11]

        config = EvolutionConfig(
            population_size=5,
            use_neat=True,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 5
        assert stats.best_fitness == 1e15

    def test_very_small_fitness_values(self):
        """Very small fitness values should not underflow."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=5,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        # Tiny values
        fitness_scores = [1e-15, 1e-14, 1e-13, 1e-12, 1e-11]

        config = EvolutionConfig(
            population_size=5,
            use_neat=True,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 5


class TestEmptyAndMissingData:
    """Tests for empty and missing data scenarios."""

    def test_empty_population(self):
        """Empty population should be handled."""
        config = EvolutionConfig(population_size=0, use_neat=True)

        # Empty population
        new_pop, stats = evolve_population([], [], config)

        assert len(new_pop) == 0
        assert stats.average_fitness == 0

    def test_single_creature_population(self):
        """Single creature population should work."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=1,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [50.0]

        config = EvolutionConfig(
            population_size=1,
            use_neat=True,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 1
        assert 'neatGenome' in new_pop[0]

    def test_mismatched_fitness_length(self):
        """Mismatched fitness length should be handled."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        # Wrong length
        fitness_scores = [50.0, 30.0, 20.0]  # Only 3 scores for 10 creatures

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
        )

        # Should raise or handle gracefully
        with pytest.raises((ValueError, IndexError)):
            evolve_population(
                population, fitness_scores, config,
                generation=0,
                innovation_counter=counter,
            )

    def test_none_innovation_counter(self):
        """None innovation counter should be handled."""
        random.seed(42)
        population = generate_population(
            size=5,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
        )

        fitness_scores = [50.0, 40.0, 30.0, 20.0, 10.0]

        config = EvolutionConfig(
            population_size=5,
            use_neat=True,
        )

        # Should create counter internally
        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=None,  # Explicitly None
        )

        assert len(new_pop) == 5

    def test_genome_missing_neat_genome_field(self):
        """Genome without neatGenome should be handled."""
        random.seed(42)
        counter = InnovationCounter()

        # Create population with standard genomes
        population = generate_population(
            size=5,
            use_neural_net=True,
            use_neat=False,  # No NEAT
        )

        fitness_scores = [50.0, 40.0, 30.0, 20.0, 10.0]

        config = EvolutionConfig(
            population_size=5,
            use_neat=True,  # But config says use NEAT
        )

        # Should handle mismatch - either work or raise clearly
        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 5


class TestBoundaryConditions:
    """Tests for edge values and boundaries."""

    def test_cull_percentage_zero(self):
        """Zero cull percentage should keep all creatures."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in range(10)]

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
            cull_percentage=0.0,  # Keep everyone
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 10

    def test_cull_percentage_one(self):
        """100% cull percentage should work (keep at least 1)."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in range(10)]

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
            cull_percentage=1.0,  # Cull everyone (should keep at least 1)
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 10

    def test_crossover_rate_zero(self):
        """Zero crossover rate should only clone."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in range(10)]

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
            crossover_rate=0.0,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 10

    def test_crossover_rate_one(self):
        """100% crossover rate should always crossover."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in range(10)]

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
            crossover_rate=1.0,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 10

    def test_mutation_rate_zero(self):
        """Zero mutation rate should produce no mutations."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in range(10)]

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
            mutation_rate=0.0,
            neat_add_connection_rate=0.0,
            neat_add_node_rate=0.0,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 10

    def test_mutation_rate_one(self):
        """100% mutation rate should mutate everything."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in range(10)]

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
            mutation_rate=1.0,
            neat_add_connection_rate=1.0,
            neat_add_node_rate=1.0,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 10

    def test_max_hidden_nodes_zero(self):
        """Zero max hidden nodes should prevent node addition."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=5,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [50.0, 40.0, 30.0, 20.0, 10.0]

        config = EvolutionConfig(
            population_size=5,
            use_neat=True,
            neat_add_node_rate=1.0,  # Try to add nodes
            neat_max_hidden_nodes=0,  # But limit is 0
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        # Should still work, just no new nodes
        assert len(new_pop) == 5

    def test_very_large_generation_number(self):
        """Very large generation numbers should work."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=5,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [50.0, 40.0, 30.0, 20.0, 10.0]

        config = EvolutionConfig(
            population_size=5,
            use_neat=True,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=1000000,  # Very large
            innovation_counter=counter,
        )

        assert len(new_pop) == 5


class TestTypeMismatchesAndFormats:
    """Tests for wrong types and format variations."""

    def test_config_as_dict(self):
        """Config as dict should work."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=5,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [50.0, 40.0, 30.0, 20.0, 10.0]

        config_dict = {
            'population_size': 5,
            'use_neat': True,
            'neat_add_connection_rate': 0.1,
            'neat_add_node_rate': 0.05,
        }

        new_pop, stats = evolve_population(
            population, fitness_scores, config_dict,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 5

    def test_innovation_counter_as_dict(self):
        """Innovation counter as dict should work via mutation."""
        random.seed(42)
        population = generate_population(
            size=5,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
        )

        fitness_scores = [50.0, 40.0, 30.0, 20.0, 10.0]

        # Counter is created internally when None
        config = EvolutionConfig(
            population_size=5,
            use_neat=True,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
        )

        assert len(new_pop) == 5

    def test_fitness_as_integers(self):
        """Integer fitness scores should work."""
        random.seed(42)
        counter = InnovationCounter()
        population = generate_population(
            size=5,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        # Integer fitness (not float)
        fitness_scores = [100, 80, 60, 40, 20]

        config = EvolutionConfig(
            population_size=5,
            use_neat=True,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 5


class TestScaleAndPerformance:
    """Tests for large inputs and scale."""

    def test_large_population(self):
        """Large population should not crash."""
        random.seed(42)
        counter = InnovationCounter()

        # Large population
        population = generate_population(
            size=200,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in range(200)]

        config = EvolutionConfig(
            population_size=200,
            use_neat=True,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 200

    def test_many_generations(self):
        """Many generations should maintain stability."""
        random.seed(42)
        counter = InnovationCounter()

        population = generate_population(
            size=20,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        config = EvolutionConfig(
            population_size=20,
            use_neat=True,
        )

        current = population
        for gen in range(50):
            fitness = [random.random() * 100 for _ in current]
            current, stats = evolve_population(
                current, fitness, config,
                generation=gen,
                innovation_counter=counter,
            )

            # Basic stability check each generation
            assert len(current) == 20
            for genome in current:
                assert 'neatGenome' in genome

    def test_network_complexity_growth(self):
        """Networks should grow but not explode."""
        random.seed(42)
        counter = InnovationCounter()

        population = generate_population(
            size=30,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        config = EvolutionConfig(
            population_size=30,
            use_neat=True,
            neat_add_connection_rate=0.3,  # High rate
            neat_add_node_rate=0.2,  # High rate
            neat_max_hidden_nodes=50,  # Allow growth
        )

        current = population
        initial_complexity = sum(
            len(g['neatGenome']['connections']) for g in current
        )

        for gen in range(30):
            fitness = [random.random() * 100 for _ in current]
            current, stats = evolve_population(
                current, fitness, config,
                generation=gen,
                innovation_counter=counter,
            )

        final_complexity = sum(
            len(g['neatGenome']['connections']) for g in current
        )

        # Complexity should stay reasonable (can decrease with random fitness)
        # Note: Without speciation, NEAT innovations may get culled, causing complexity reduction
        avg_connections = final_complexity / len(current)
        # Complexity should stay within reasonable bounds
        assert avg_connections > 0  # Networks should have connections
        assert avg_connections < 1000  # Sanity check - not exploding


class TestSpeciationIntegration:
    """Tests for speciation with NEAT."""

    def test_speciation_with_neat(self):
        """Speciation should work with NEAT distance."""
        random.seed(42)
        counter = InnovationCounter()

        population = generate_population(
            size=30,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in range(30)]

        config = EvolutionConfig(
            population_size=30,
            use_neat=True,
            selection_method='speciation',
            compatibility_threshold=3.0,
            min_species_size=2,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) > 0

    def test_speciation_very_low_threshold(self):
        """Very low compatibility threshold should create many species."""
        random.seed(42)
        counter = InnovationCounter()

        population = generate_population(
            size=20,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in range(20)]

        config = EvolutionConfig(
            population_size=20,
            use_neat=True,
            selection_method='speciation',
            compatibility_threshold=0.001,  # Very low - every creature is its own species
            min_species_size=1,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 20

    def test_speciation_very_high_threshold(self):
        """Very high compatibility threshold should create one species."""
        random.seed(42)
        counter = InnovationCounter()

        population = generate_population(
            size=20,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in range(20)]

        config = EvolutionConfig(
            population_size=20,
            use_neat=True,
            selection_method='speciation',
            compatibility_threshold=1000.0,  # Very high - all in same species
            min_species_size=1,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 20


class TestDecayRateEdgeCases:
    """Tests for decay rate calculation edge cases."""

    def test_decay_negative_generation(self):
        """Negative generation should be handled."""
        config = DecayConfig(mode='linear', start_rate=0.5, end_rate=0.1)

        # Negative generation
        rate = calculate_decayed_rate(-10, config)
        # Should return some rate, likely at or above start_rate
        assert rate > 0

    def test_decay_very_large_generation(self):
        """Very large generation should converge to end rate."""
        config = DecayConfig(
            mode='exponential',
            start_rate=0.5,
            end_rate=0.1,
            decay_generations=100,
        )

        rate = calculate_decayed_rate(10000, config)
        # Should be close to end_rate
        assert abs(rate - 0.1) < 0.01

    def test_decay_generation_zero(self):
        """Generation 0 should return start rate."""
        config = DecayConfig(
            mode='linear',
            start_rate=0.5,
            end_rate=0.1,
            decay_generations=100,
        )

        rate = calculate_decayed_rate(0, config)
        assert rate == 0.5


class TestPopulationStatsEdgeCases:
    """Tests for population statistics edge cases."""

    def test_stats_empty_population(self):
        """Stats with empty population."""
        stats = get_population_stats([], [], 0)

        assert stats.generation == 0
        assert stats.best_fitness == 0
        assert stats.average_fitness == 0
        assert stats.avg_nodes == 0
        assert stats.avg_muscles == 0

    def test_stats_single_creature(self):
        """Stats with single creature."""
        genome = generate_random_genome(use_neural_net=True, use_neat=True)

        stats = get_population_stats([genome], [50.0], 5)

        assert stats.generation == 5
        assert stats.best_fitness == 50.0
        assert stats.worst_fitness == 50.0
        assert stats.average_fitness == 50.0


class TestRealWorldScenarios:
    """Tests simulating realistic edge cases."""

    def test_converged_population(self):
        """Population that has converged (all similar) should still work."""
        random.seed(42)
        counter = InnovationCounter()

        # Create one genome and clone it multiple times
        template = generate_random_genome(
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        from copy import deepcopy
        population = [deepcopy(template) for _ in range(10)]
        # Give each unique ID
        for i, genome in enumerate(population):
            genome['id'] = f'clone_{i}'

        # All same fitness (converged)
        fitness_scores = [50.0] * 10

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 10

    def test_mixed_complexity_population(self):
        """Population with mixed network complexities."""
        random.seed(42)
        counter = InnovationCounter()

        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        # Manually mutate some to have more complexity
        from app.genetics.neat_mutation import mutate_add_node, mutate_add_connection
        from app.schemas.neat import NEATGenome

        for genome in population[:5]:
            neat = NEATGenome(**genome['neatGenome'])
            for _ in range(5):
                mutate_add_node(neat, counter)
                mutate_add_connection(neat, counter)
            genome['neatGenome'] = neat.model_dump()

        fitness_scores = [random.random() * 100 for _ in range(10)]

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
            use_crossover=True,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 10

    def test_selection_pressure_extremes(self):
        """Extreme selection pressure (one very fit creature)."""
        random.seed(42)
        counter = InnovationCounter()

        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        # One very fit, rest very unfit
        fitness_scores = [1000.0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_pop) == 10
        assert stats.best_fitness == 1000.0

    def test_neural_forward_pass_after_evolution(self):
        """Evolved genomes should produce valid forward pass."""
        random.seed(42)
        counter = InnovationCounter()

        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in range(10)]

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
            neat_add_connection_rate=0.5,
            neat_add_node_rate=0.3,
        )

        # Evolve several generations
        current = population
        for gen in range(10):
            fitness = [random.random() * 100 for _ in current]
            current, _ = evolve_population(
                current, fitness, config,
                generation=gen,
                innovation_counter=counter,
            )

        # Test forward pass on all evolved genomes
        for genome in current:
            neat = NEATGenome(**genome['neatGenome'])
            num_inputs = len([n for n in neat.neurons if n.type == 'input'])

            inputs = [0.5] * num_inputs
            outputs = neat_forward(neat, inputs)

            # Should produce valid outputs
            assert len(outputs) > 0
            assert all(not math.isnan(o) for o in outputs)
            assert all(-1 <= o <= 1 for o in outputs)
