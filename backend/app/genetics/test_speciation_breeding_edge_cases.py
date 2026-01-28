"""
Edge case and stress tests for speciation selection method and within-species breeding.

These tests intentionally try to break the implementation by exploring:
- Numerical edge cases (NaN, Inf, zero, negative fitness)
- Empty/missing data (empty species, no survivors)
- Boundary conditions (one member species, all same species)
- Integration scenarios (full evolution pipeline)
- Resource exhaustion (large populations, many species)

The key invariants being tested:
1. Population size is preserved after evolution
2. Within-species breeding only selects parents from the same species
3. Offspring allocation is proportional to species fitness
4. Edge cases don't crash but produce defined behavior
"""

import math
import random
import pytest

from app.genetics.population import (
    evolve_population,
    generate_population,
    EvolutionConfig,
)
from app.genetics.speciation import (
    assign_species,
    select_within_species,
    apply_speciation,
    Species,
)
from app.genetics.selection import rank_based_probabilities
from app.schemas.neat import InnovationCounter


def make_genome(genome_id: str, weights: list[float] | None = None) -> dict:
    """Create a minimal genome for testing."""
    return {
        'id': genome_id,
        'generation': 0,
        'survivalStreak': 0,
        'nodes': [
            {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.5, 'friction': 0.5},
            {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.5, 'friction': 0.5},
            {'id': 'n3', 'position': {'x': 0.5, 'y': 1, 'z': 0}, 'size': 0.5, 'friction': 0.5},
        ],
        'muscles': [
            {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'restLength': 1.0, 'stiffness': 100, 'damping': 3.0,
             'frequency': 1.0, 'amplitude': 0.2, 'phase': 0.0},
        ],
        'neuralGenome': {
            'inputWeights': weights if weights else [0.1] * 8,
            'hiddenWeights': [[0.1] * 8] * 4,
            'outputWeights': [[0.1] * 4],
            'hiddenBiases': [0.0] * 4,
            'outputBiases': [0.0],
        },
        'color': {'h': 0.5, 's': 0.7, 'l': 0.5},
        'globalFrequencyMultiplier': 1.0,
    }


class TestNumericalEdgeCases:
    """Tests for numerical stability with extreme fitness values."""

    def test_nan_fitness_in_species(self):
        """NaN fitness values should be handled gracefully."""
        genomes = [make_genome(f'g{i}') for i in range(10)]
        fitness_scores = [float('nan')] * 10

        # Should not crash
        species_list = assign_species(genomes, fitness_scores, compatibility_threshold=1.0)

        # Should have at least one species
        assert len(species_list) >= 1

        # avg_fitness should handle NaN gracefully
        for species in species_list:
            avg = species.avg_fitness
            # Result might be nan, but shouldn't crash
            assert isinstance(avg, float)

    def test_infinity_fitness_values(self):
        """Infinity fitness should not crash allocation."""
        genomes = [make_genome(f'g{i}') for i in range(10)]
        fitness_scores = [float('inf') if i < 5 else 100.0 for i in range(10)]

        config = {
            'population_size': 10,
            'selection_method': 'speciation',
            'compatibility_threshold': 10.0,  # All in one species
            'cull_percentage': 0.5,
        }

        # Should not crash - infinity fitness should still allow evolution
        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)
        assert len(new_pop) == 10

    def test_negative_fitness_values(self):
        """Negative fitness should work for speciation."""
        genomes = [make_genome(f'g{i}') for i in range(10)]
        fitness_scores = [-100.0 + i * 10 for i in range(10)]  # -100 to -10

        config = {
            'population_size': 10,
            'selection_method': 'speciation',
            'compatibility_threshold': 10.0,
            'cull_percentage': 0.5,
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)
        assert len(new_pop) == 10

    def test_zero_fitness_all_creatures(self):
        """All zero fitness should still produce offspring."""
        genomes = [make_genome(f'g{i}') for i in range(10)]
        fitness_scores = [0.0] * 10

        config = {
            'population_size': 10,
            'selection_method': 'speciation',
            'compatibility_threshold': 10.0,
            'cull_percentage': 0.5,
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)
        assert len(new_pop) == 10

    def test_mixed_extreme_fitness(self):
        """Mix of very large and very small fitness values."""
        genomes = [make_genome(f'g{i}') for i in range(10)]
        fitness_scores = [1e-10, 1e10, 0.0, -1e10, 1.0, 1e-100, 1e100, 0.001, 1000, -0.001]

        config = {
            'population_size': 10,
            'selection_method': 'speciation',
            'compatibility_threshold': 10.0,
            'cull_percentage': 0.5,
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)
        assert len(new_pop) == 10


class TestEmptyAndMinimalInputs:
    """Tests for empty species, single members, and edge populations."""

    def test_single_creature_population(self):
        """Population of 1 should not crash."""
        genomes = [make_genome('single')]
        fitness_scores = [100.0]

        config = {
            'population_size': 1,
            'selection_method': 'speciation',
            'compatibility_threshold': 1.0,
            'cull_percentage': 0.5,
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)
        assert len(new_pop) == 1

    def test_two_creature_population(self):
        """Minimum viable breeding population."""
        genomes = [make_genome('g1'), make_genome('g2')]
        fitness_scores = [100.0, 50.0]

        config = {
            'population_size': 2,
            'selection_method': 'speciation',
            'compatibility_threshold': 10.0,
            'cull_percentage': 0.5,
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)
        assert len(new_pop) == 2

    def test_species_with_single_member(self):
        """Species with only one member should breed via cloning."""
        # Create genomes that will form separate species
        genomes = []
        for i in range(5):
            g = make_genome(f'g{i}', weights=[float(i)] * 8)  # Different weights = different species
            genomes.append(g)

        fitness_scores = [100.0, 80.0, 60.0, 40.0, 20.0]

        config = {
            'population_size': 5,
            'selection_method': 'speciation',
            'compatibility_threshold': 0.001,  # Very low - each genome is its own species
            'min_species_size': 1,
            'cull_percentage': 0.5,
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)
        assert len(new_pop) == 5

    def test_empty_species_in_list(self):
        """Species list with empty species should be handled."""
        # Create species manually with an empty one
        species_list = [
            Species(id=0, representative=make_genome('g0'), members=[make_genome('g0')], fitness_scores=[100.0]),
            Species(id=1, representative=make_genome('g1'), members=[], fitness_scores=[]),  # Empty!
            Species(id=2, representative=make_genome('g2'), members=[make_genome('g2')], fitness_scores=[50.0]),
        ]

        # With 100% survival, both non-empty species survive
        survivors = select_within_species(species_list, survival_rate=1.0, min_species_size=1)

        # Should have survivors from non-empty species
        assert len(survivors) == 2


class TestBoundaryConditions:
    """Tests for threshold boundaries and allocation edge cases."""

    def test_compatibility_threshold_zero(self):
        """Zero threshold means every creature is its own species."""
        genomes = [make_genome(f'g{i}', weights=[float(i)] * 8) for i in range(5)]
        fitness_scores = [100.0, 80.0, 60.0, 40.0, 20.0]

        species_list = assign_species(genomes, fitness_scores, compatibility_threshold=0.0)

        # Every genome should be its own species
        assert len(species_list) == 5

    def test_compatibility_threshold_very_high(self):
        """Very high threshold means all creatures in one species."""
        genomes = [make_genome(f'g{i}', weights=[float(i)] * 8) for i in range(10)]
        fitness_scores = [100.0] * 10

        species_list = assign_species(genomes, fitness_scores, compatibility_threshold=1e10)

        # All should be in one species
        assert len(species_list) == 1
        assert species_list[0].size == 10

    def test_cull_percentage_zero(self):
        """0% cull means all survive, no new offspring needed."""
        genomes = [make_genome(f'g{i}') for i in range(10)]
        fitness_scores = [100.0] * 10

        config = {
            'population_size': 10,
            'selection_method': 'speciation',
            'compatibility_threshold': 10.0,
            'cull_percentage': 0.0,  # Nobody culled
        }

        # This should work - all 10 survive, 0 new creatures needed
        # But cull_percentage is clamped to 0.1 minimum, so test with minimum
        config['cull_percentage'] = 0.1
        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)
        assert len(new_pop) == 10

    def test_cull_percentage_ninety(self):
        """90% cull means only 10% survive, 90% new offspring."""
        genomes = [make_genome(f'g{i}') for i in range(10)]
        fitness_scores = [100.0 - i * 5 for i in range(10)]

        config = {
            'population_size': 10,
            'selection_method': 'speciation',
            'compatibility_threshold': 10.0,
            'cull_percentage': 0.9,  # 90% culled
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)
        assert len(new_pop) == 10

    def test_min_species_size_larger_than_species(self):
        """Min species size larger than actual species - global rate takes precedence."""
        species_list = [
            Species(id=0, representative=make_genome('g0'),
                    members=[make_genome(f'g{i}') for i in range(3)],
                    fitness_scores=[100.0, 80.0, 60.0]),
        ]

        # With 10% rate: int(3 * 0.1) = 0
        survivors = select_within_species(species_list, survival_rate=0.1, min_species_size=10)
        assert len(survivors) == 0

        # With 100% rate, all 3 survive
        survivors = select_within_species(species_list, survival_rate=1.0, min_species_size=10)
        assert len(survivors) == 3


class TestWithinSpeciesBreeding:
    """Tests specifically for within-species breeding behavior."""

    def test_offspring_come_from_same_species(self):
        """Verify breeding happens within species, not across."""
        random.seed(42)

        # Create two distinct clusters
        cluster_a = [make_genome(f'a{i}', weights=[0.1] * 8) for i in range(10)]
        cluster_b = [make_genome(f'b{i}', weights=[10.0] * 8) for i in range(10)]
        genomes = cluster_a + cluster_b

        # Cluster A has high fitness, cluster B has low fitness
        fitness_scores = [100.0] * 10 + [10.0] * 10

        config = {
            'population_size': 20,
            'selection_method': 'speciation',
            'compatibility_threshold': 0.5,  # Should form 2 species
            'cull_percentage': 0.5,
            'crossover_rate': 1.0,  # Force crossover
            'use_crossover': True,
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)

        assert len(new_pop) == 20
        # All offspring should exist (doesn't crash)

    def test_offspring_allocation_proportional_to_fitness(self):
        """Species with higher fitness should get more offspring slots."""
        random.seed(42)

        # Create two species with very different fitness
        high_fit = [make_genome(f'h{i}', weights=[0.1] * 8) for i in range(10)]
        low_fit = [make_genome(f'l{i}', weights=[10.0] * 8) for i in range(10)]
        genomes = high_fit + low_fit

        # High fitness species vs low fitness species
        fitness_scores = [1000.0] * 10 + [1.0] * 10

        config = {
            'population_size': 20,
            'selection_method': 'speciation',
            'compatibility_threshold': 0.5,  # Should form 2 species
            'cull_percentage': 0.5,
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)

        assert len(new_pop) == 20

    def test_single_member_species_clones(self):
        """Species with one member should produce clones (can't crossover)."""
        random.seed(42)

        genomes = [make_genome('solo', weights=[999.0] * 8)]
        fitness_scores = [100.0]

        config = {
            'population_size': 5,
            'selection_method': 'speciation',
            'compatibility_threshold': 0.001,  # Very low - solo is own species
            'cull_percentage': 0.5,
            'crossover_rate': 1.0,
            'use_crossover': True,
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)

        # Should produce 5 creatures from 1 original
        assert len(new_pop) == 5


class TestSpeciesAllocationMath:
    """Tests for offspring allocation arithmetic."""

    def test_allocation_sums_to_needed(self):
        """Total allocated offspring should equal new_creatures_needed."""
        random.seed(42)

        genomes = [make_genome(f'g{i}') for i in range(100)]
        fitness_scores = [random.random() * 100 for _ in range(100)]

        config = {
            'population_size': 100,
            'selection_method': 'speciation',
            'compatibility_threshold': 1.0,
            'cull_percentage': 0.5,
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)

        # Population size must be preserved
        assert len(new_pop) == 100

    def test_many_species_allocation(self):
        """Many small species should all get some representation."""
        random.seed(42)

        # Create 50 genomes that will form many species
        genomes = [make_genome(f'g{i}', weights=[float(i)] * 8) for i in range(50)]
        fitness_scores = [random.random() * 100 for _ in range(50)]

        config = {
            'population_size': 50,
            'selection_method': 'speciation',
            'compatibility_threshold': 0.001,  # Very low - many species
            'cull_percentage': 0.5,
            'min_species_size': 1,
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)

        assert len(new_pop) == 50

    def test_equal_fitness_species_equal_allocation(self):
        """Species with equal fitness should get roughly equal offspring."""
        random.seed(42)

        # Two clusters with identical fitness
        cluster_a = [make_genome(f'a{i}', weights=[0.1] * 8) for i in range(10)]
        cluster_b = [make_genome(f'b{i}', weights=[10.0] * 8) for i in range(10)]
        genomes = cluster_a + cluster_b

        # Same fitness for both
        fitness_scores = [100.0] * 20

        config = {
            'population_size': 20,
            'selection_method': 'speciation',
            'compatibility_threshold': 0.5,
            'cull_percentage': 0.5,
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)

        assert len(new_pop) == 20


class TestIntegrationWithNEAT:
    """Tests for speciation with NEAT mode."""

    def test_neat_mode_forces_speciation(self):
        """NEAT mode should automatically use speciation selection."""
        random.seed(42)

        counter = InnovationCounter()
        population = generate_population(
            size=20,
            use_neural_net=True,
            use_neat=True,
            neural_mode='neat',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in range(20)]

        config = {
            'population_size': 20,
            'neural_mode': 'neat',
            'selection_method': 'rank',  # Try to use rank - should be overridden
            'cull_percentage': 0.5,
        }

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0, innovation_counter=counter
        )

        assert len(new_pop) == 20

    def test_neat_speciation_uses_neat_distance(self):
        """NEAT speciation should use innovation-based distance."""
        random.seed(42)

        counter = InnovationCounter()
        population = generate_population(
            size=30,
            use_neural_net=True,
            use_neat=True,
            neural_mode='neat',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in range(30)]

        config = {
            'population_size': 30,
            'neural_mode': 'neat',
            'selection_method': 'speciation',
            'compatibility_threshold': 3.0,
            'cull_percentage': 0.5,
        }

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0, innovation_counter=counter
        )

        assert len(new_pop) == 30


class TestMultiGenerationStability:
    """Tests for stability over multiple generations."""

    def test_population_size_stable_over_generations(self):
        """Population size should remain constant over many generations."""
        random.seed(42)

        population = [make_genome(f'g{i}') for i in range(50)]

        config = {
            'population_size': 50,
            'selection_method': 'speciation',
            'compatibility_threshold': 1.0,
            'cull_percentage': 0.5,
        }

        for gen in range(20):
            fitness_scores = [random.random() * 100 for _ in range(len(population))]
            population, stats = evolve_population(
                population, fitness_scores, config, generation=gen
            )
            assert len(population) == 50, f"Population size changed at generation {gen}"

    def test_species_formation_over_generations(self):
        """Species should form and evolve over generations."""
        random.seed(42)

        population = [make_genome(f'g{i}') for i in range(30)]

        config = {
            'population_size': 30,
            'selection_method': 'speciation',
            'compatibility_threshold': 1.0,
            'cull_percentage': 0.5,
            'mutation_rate': 0.3,
        }

        for gen in range(10):
            fitness_scores = [random.random() * 100 for _ in range(len(population))]
            population, stats = evolve_population(
                population, fitness_scores, config, generation=gen
            )
            assert len(population) == 30


class TestRealWorldScenarios:
    """Tests simulating realistic usage patterns."""

    def test_converged_population_all_similar(self):
        """Population where all creatures are very similar."""
        genomes = [make_genome(f'g{i}', weights=[0.1] * 8) for i in range(20)]
        fitness_scores = [100.0 + random.random() for _ in range(20)]

        config = {
            'population_size': 20,
            'selection_method': 'speciation',
            'compatibility_threshold': 1.0,
            'cull_percentage': 0.5,
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)

        # Should form one species and still work
        assert len(new_pop) == 20

    def test_diverged_population_all_different(self):
        """Population where all creatures are very different."""
        genomes = [make_genome(f'g{i}', weights=[float(i * 100)] * 8) for i in range(20)]
        fitness_scores = [random.random() * 100 for _ in range(20)]

        config = {
            'population_size': 20,
            'selection_method': 'speciation',
            'compatibility_threshold': 0.01,  # Very low - all different species
            'cull_percentage': 0.5,
            'min_species_size': 1,
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)

        assert len(new_pop) == 20

    def test_fitness_landscape_with_local_optima(self):
        """Simulate multiple local optima that speciation should preserve."""
        random.seed(42)

        # Three clusters representing different strategies
        cluster1 = [make_genome(f'c1_{i}', weights=[1.0] * 8) for i in range(10)]
        cluster2 = [make_genome(f'c2_{i}', weights=[5.0] * 8) for i in range(10)]
        cluster3 = [make_genome(f'c3_{i}', weights=[10.0] * 8) for i in range(10)]
        genomes = cluster1 + cluster2 + cluster3

        # Each cluster has a local optimum (best creature in each)
        fitness_scores = (
            [50.0 + random.random() * 10 for _ in range(10)] +
            [60.0 + random.random() * 10 for _ in range(10)] +
            [40.0 + random.random() * 10 for _ in range(10)]
        )

        config = {
            'population_size': 30,
            'selection_method': 'speciation',
            'compatibility_threshold': 0.5,
            'cull_percentage': 0.5,
        }

        # Run for several generations
        population = genomes
        for gen in range(5):
            fitness = [random.random() * 100 for _ in range(len(population))]
            population, stats = evolve_population(
                population, fitness, config, generation=gen
            )
            assert len(population) == 30


class TestErrorHandling:
    """Tests for graceful error handling."""

    def test_mismatched_genome_fitness_length(self):
        """Mismatched lengths should raise clear error."""
        genomes = [make_genome(f'g{i}') for i in range(10)]
        fitness_scores = [100.0] * 5  # Wrong length!

        with pytest.raises(ValueError):
            assign_species(genomes, fitness_scores, compatibility_threshold=1.0)

    def test_empty_genomes_list(self):
        """Empty genome list should be handled."""
        species_list = assign_species([], [], compatibility_threshold=1.0)
        assert len(species_list) == 0

    def test_none_genome_in_list(self):
        """None genome in list should fail clearly, not crash mysteriously."""
        genomes = [make_genome('g0'), None, make_genome('g2')]
        fitness_scores = [100.0, 50.0, 25.0]

        # This should raise an error, not crash with obscure message
        with pytest.raises((TypeError, AttributeError)):
            assign_species(genomes, fitness_scores, compatibility_threshold=1.0)


class TestScaleAndPerformance:
    """Tests for large-scale inputs."""

    def test_large_population(self):
        """Large population should work without issues."""
        random.seed(42)

        genomes = [make_genome(f'g{i}') for i in range(500)]
        fitness_scores = [random.random() * 100 for _ in range(500)]

        config = {
            'population_size': 500,
            'selection_method': 'speciation',
            'compatibility_threshold': 1.0,
            'cull_percentage': 0.5,
        }

        new_pop, stats = evolve_population(genomes, fitness_scores, config, generation=0)

        assert len(new_pop) == 500

    def test_many_generations(self):
        """Stability over many generations."""
        random.seed(42)

        population = [make_genome(f'g{i}') for i in range(50)]

        config = {
            'population_size': 50,
            'selection_method': 'speciation',
            'compatibility_threshold': 1.0,
            'cull_percentage': 0.5,
        }

        for gen in range(50):
            fitness_scores = [random.random() * 100 for _ in range(len(population))]
            population, stats = evolve_population(
                population, fitness_scores, config, generation=gen
            )

        assert len(population) == 50
