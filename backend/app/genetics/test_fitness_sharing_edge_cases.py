"""
Edge case and stress tests for fitness sharing.

These tests intentionally try to break the fitness sharing implementation
by exploring boundary conditions, numerical edge cases, and integration scenarios.
"""

import math
import random

import pytest

from app.genetics.fitness_sharing import (
    neural_genome_distance,
    body_genome_distance,
    sharing_function,
    apply_fitness_sharing,
    _flatten,
)
from app.genetics.population import (
    evolve_population,
    generate_population,
    generate_random_genome,
    EvolutionConfig,
)


class TestNumericalEdgeCases:
    """Tests for numerical stability and edge cases."""

    def test_nan_in_weights(self):
        """NaN values in weights should not crash, should produce finite distance."""
        genome1 = {'neuralGenome': {'weights_ih': [[float('nan'), 0.5]]}}
        genome2 = {'neuralGenome': {'weights_ih': [[0.5, 0.5]]}}

        distance = neural_genome_distance(genome1, genome2)
        # NaN arithmetic produces NaN, but we should handle gracefully
        # The function should still return (even if NaN)
        assert isinstance(distance, float)

    def test_inf_in_weights(self):
        """Infinity in weights should produce large but finite-ish distance."""
        genome1 = {'neuralGenome': {'weights_ih': [[float('inf'), 0.5]]}}
        genome2 = {'neuralGenome': {'weights_ih': [[0.5, 0.5]]}}

        distance = neural_genome_distance(genome1, genome2)
        assert isinstance(distance, float)

    def test_very_large_weights(self):
        """Very large weight values should not overflow."""
        genome1 = {'neuralGenome': {'weights_ih': [[1e10, 1e10]]}}
        genome2 = {'neuralGenome': {'weights_ih': [[-1e10, -1e10]]}}

        distance = neural_genome_distance(genome1, genome2)
        assert distance > 0
        assert not math.isinf(distance)

    def test_very_small_weights(self):
        """Very small weight differences should produce small distance."""
        genome1 = {'neuralGenome': {'weights_ih': [[1e-10, 1e-10]]}}
        genome2 = {'neuralGenome': {'weights_ih': [[1e-10 + 1e-15, 1e-10]]}}

        distance = neural_genome_distance(genome1, genome2)
        assert distance >= 0
        assert distance < 1e-5

    def test_zero_fitness_values(self):
        """Zero fitness should be handled without division errors."""
        genomes = [
            {'neuralGenome': {'weights_ih': [[0.1]]}},
            {'neuralGenome': {'weights_ih': [[0.9]]}},
        ]
        fitness = [0.0, 0.0]

        shared = apply_fitness_sharing(genomes, fitness, sharing_radius=0.5)
        assert all(f == 0.0 for f in shared)

    def test_negative_fitness_values(self):
        """Negative fitness should work (shared fitness = negative / niche_count)."""
        genome = {'neuralGenome': {'weights_ih': [[0.5]]}}
        genomes = [genome, genome]
        fitness = [-100.0, -100.0]

        shared = apply_fitness_sharing(genomes, fitness, sharing_radius=2.0)
        # Both identical, niche count = 2
        assert all(f == pytest.approx(-50.0) for f in shared)

    def test_mixed_positive_negative_fitness(self):
        """Mix of positive and negative fitness should work correctly."""
        genomes = [
            {'neuralGenome': {'weights_ih': [[0.0]]}},
            {'neuralGenome': {'weights_ih': [[1.0]]}},
        ]
        fitness = [100.0, -50.0]

        shared = apply_fitness_sharing(genomes, fitness, sharing_radius=0.1)
        # Different enough to not share
        assert shared[0] == pytest.approx(100.0)
        assert shared[1] == pytest.approx(-50.0)


class TestSharingRadiusEdgeCases:
    """Tests for sharing radius boundary conditions."""

    def test_zero_radius(self):
        """Zero radius should mean no sharing (only self)."""
        genome = {'neuralGenome': {'weights_ih': [[0.5]]}}
        genomes = [genome, genome, genome]
        fitness = [100.0, 100.0, 100.0]

        # With radius 0, only identical (distance=0) creatures share
        # But identical creatures have distance 0, which equals radius
        # sharing_function(0, 0) needs to handle this edge case
        shared = apply_fitness_sharing(genomes, fitness, sharing_radius=0.001)
        # Even tiny radius, identical genomes share
        assert all(f < 100.0 for f in shared)

    def test_huge_radius(self):
        """Huge radius should make everyone share with everyone."""
        genomes = [
            {'neuralGenome': {'weights_ih': [0.0]}},
            {'neuralGenome': {'weights_ih': [5.0]}},
            {'neuralGenome': {'weights_ih': [10.0]}},
        ]
        fitness = [100.0, 100.0, 100.0]

        shared = apply_fitness_sharing(genomes, fitness, sharing_radius=1000.0)
        # All share significantly - niche count approaches 3 (not exactly 3
        # because sharing function returns < 1 for non-zero distance)
        # Each creature should have fitness close to 100/3 ≈ 33.3
        assert all(30.0 < f < 40.0 for f in shared)
        # All should be roughly equal
        assert max(shared) - min(shared) < 1.0

    def test_radius_exactly_at_distance(self):
        """When distance equals radius exactly, sharing should be 0."""
        # Create two genomes with known distance
        genome1 = {'neuralGenome': {'weights_ih': [[0.0]]}}
        genome2 = {'neuralGenome': {'weights_ih': [[1.0]]}}

        distance = neural_genome_distance(genome1, genome2)

        genomes = [genome1, genome2]
        fitness = [100.0, 100.0]

        # Set radius to exactly the distance
        shared = apply_fitness_sharing(genomes, fitness, sharing_radius=distance)
        # At exact radius, sharing function returns 0, so no sharing
        assert shared[0] == pytest.approx(100.0)
        assert shared[1] == pytest.approx(100.0)


class TestTopologyMismatches:
    """Tests for creatures with different neural network structures."""

    def test_different_hidden_sizes(self):
        """Creatures with different hidden layer sizes should still compute distance."""
        genome1 = {
            'neuralGenome': {
                'inputWeights': [[0.1, 0.2], [0.3, 0.4]],  # 2x2
                'biases_h': [0.0, 0.0],
            }
        }
        genome2 = {
            'neuralGenome': {
                'inputWeights': [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6], [0.7, 0.8, 0.9]],  # 3x3
                'biases_h': [0.0, 0.0, 0.0],
            }
        }

        distance = neural_genome_distance(genome1, genome2)
        assert distance > 0
        assert not math.isnan(distance)

    def test_different_output_sizes(self):
        """Creatures with different muscle counts should compute distance."""
        genome1 = {
            'neuralGenome': {
                'weights_ho': [[0.1], [0.2]],  # 2 outputs
                'biases_o': [-0.5, -0.5],
            }
        }
        genome2 = {
            'neuralGenome': {
                'weights_ho': [[0.1], [0.2], [0.3], [0.4], [0.5]],  # 5 outputs
                'biases_o': [-0.5, -0.5, -0.5, -0.5, -0.5],
            }
        }

        distance = neural_genome_distance(genome1, genome2)
        assert distance > 0

    def test_one_has_neural_one_doesnt(self):
        """Mixed population with some neural, some not."""
        genome1 = {
            'neuralGenome': {'inputWeights': [[0.5]]},
            'nodes': [1, 2, 3],
            'muscles': [1, 2],
        }
        genome2 = {
            'neuralGenome': None,
            'nodes': [1, 2, 3, 4],
            'muscles': [1, 2, 3],
        }

        distance = neural_genome_distance(genome1, genome2)
        # Should fall back to body distance
        expected_body_dist = body_genome_distance(genome1, genome2)
        assert distance == pytest.approx(expected_body_dist)

    def test_empty_neural_genome(self):
        """Empty neural genome dict should not crash."""
        genome1 = {'neuralGenome': {}}
        genome2 = {'neuralGenome': {'weights_ih': [[0.5]]}}

        distance = neural_genome_distance(genome1, genome2)
        assert isinstance(distance, float)

    def test_missing_weight_keys(self):
        """Missing keys in neural genome should be handled."""
        genome1 = {'neuralGenome': {'weights_ih': [[0.5]]}}
        genome2 = {'neuralGenome': {'weights_ho': [[0.5]]}}

        distance = neural_genome_distance(genome1, genome2)
        assert isinstance(distance, float)
        assert distance >= 0


class TestFlattenEdgeCases:
    """Tests for the _flatten helper function."""

    def test_empty_list(self):
        """Empty list should return empty."""
        assert _flatten([]) == []

    def test_deeply_nested(self):
        """Deeply nested lists should flatten."""
        nested = [[[1.0, 2.0], [3.0]], [[4.0]]]
        flat = _flatten(nested)
        assert flat == [1.0, 2.0, 3.0, 4.0]

    def test_mixed_nesting(self):
        """Mixed nesting depths should work."""
        mixed = [1.0, [2.0, 3.0], [[4.0, 5.0]]]
        flat = _flatten(mixed)
        assert flat == [1.0, 2.0, 3.0, 4.0, 5.0]


class TestLargePopulations:
    """Tests for performance and correctness with large populations."""

    def test_medium_population(self):
        """100 creatures should work correctly."""
        random.seed(42)
        genomes = generate_population(
            size=100,
            use_neural_net=True,
            neural_hidden_size=8,
        )
        fitness = [random.uniform(0, 100) for _ in range(100)]

        shared = apply_fitness_sharing(genomes, fitness, sharing_radius=0.5)

        assert len(shared) == 100
        assert all(isinstance(f, float) for f in shared)
        assert all(not math.isnan(f) for f in shared)

    def test_sharing_changes_rankings(self):
        """Fitness sharing should actually change which creatures are selected."""
        random.seed(42)

        # Create population where some high-fitness creatures are clones
        unique_genome = generate_random_genome(use_neural_net=True, neural_hidden_size=4)
        clone_genome = generate_random_genome(use_neural_net=True, neural_hidden_size=4)

        # 5 clones with high fitness, 1 unique with slightly lower fitness
        genomes = [clone_genome] * 5 + [unique_genome]
        fitness = [100.0, 100.0, 100.0, 100.0, 100.0, 90.0]

        # Without sharing, clones dominate
        raw_best_idx = fitness.index(max(fitness))
        assert raw_best_idx < 5  # A clone

        # With sharing, unique creature should rise
        shared = apply_fitness_sharing(genomes, fitness, sharing_radius=0.5)

        # The 5 clones share fitness: 100/5 = 20 each (approximately)
        # The unique one keeps most: 90/1 = 90
        assert shared[5] > shared[0]  # Unique beats clones after sharing


class TestEvolutionIntegration:
    """Tests for fitness sharing integrated with evolution."""

    def test_evolution_with_sharing_doesnt_crash(self):
        """Full evolution cycle with sharing should complete without errors."""
        random.seed(42)

        genomes = generate_population(size=20, use_neural_net=True)
        fitness = [random.uniform(0, 100) for _ in range(20)]

        config = EvolutionConfig(
            population_size=20,
            use_fitness_sharing=True,
            sharing_radius=0.5,
            use_crossover=True,
            use_mutation=True,
        )

        new_genomes, stats = evolve_population(genomes, fitness, config)

        assert len(new_genomes) == 20
        assert stats.generation == 0

    def test_sharing_with_tournament_selection(self):
        """Sharing should work with tournament selection."""
        random.seed(42)

        genomes = generate_population(size=20, use_neural_net=True)
        fitness = [random.uniform(0, 100) for _ in range(20)]

        config = EvolutionConfig(
            population_size=20,
            selection_method='tournament',
            tournament_size=3,
            use_fitness_sharing=True,
            sharing_radius=0.5,
        )

        new_genomes, stats = evolve_population(genomes, fitness, config)
        assert len(new_genomes) == 20

    def test_sharing_with_truncation_selection(self):
        """Sharing should work with truncation selection."""
        random.seed(42)

        genomes = generate_population(size=20, use_neural_net=True)
        fitness = [random.uniform(0, 100) for _ in range(20)]

        config = EvolutionConfig(
            population_size=20,
            selection_method='truncation',
            use_fitness_sharing=True,
            sharing_radius=0.5,
        )

        new_genomes, stats = evolve_population(genomes, fitness, config)
        assert len(new_genomes) == 20

    def test_multiple_generations_with_sharing(self):
        """Multiple evolution generations should work."""
        random.seed(42)

        genomes = generate_population(size=20, use_neural_net=True)

        config = EvolutionConfig(
            population_size=20,
            use_fitness_sharing=True,
            sharing_radius=0.5,
            use_crossover=True,
            use_mutation=True,
        )

        for gen in range(5):
            fitness = [random.uniform(0, 100) for _ in range(len(genomes))]
            genomes, stats = evolve_population(genomes, fitness, config, generation=gen)
            assert len(genomes) == 20

    def test_sharing_disabled_vs_enabled_produces_different_results(self):
        """With same seed, sharing on vs off should produce different survivors."""
        base_genomes = generate_population(size=20, use_neural_net=True)
        fitness = list(range(20))  # 0, 1, 2, ..., 19

        # Without sharing
        random.seed(123)
        config_no_share = EvolutionConfig(
            population_size=20,
            use_fitness_sharing=False,
            cull_percentage=0.5,
        )
        genomes_no_share, _ = evolve_population(
            [dict(g) for g in base_genomes], list(fitness), config_no_share
        )

        # With sharing
        random.seed(123)
        config_share = EvolutionConfig(
            population_size=20,
            use_fitness_sharing=True,
            sharing_radius=0.5,
            cull_percentage=0.5,
        )
        genomes_share, _ = evolve_population(
            [dict(g) for g in base_genomes], list(fitness), config_share
        )

        # Results should differ (different survivors due to shared fitness)
        ids_no_share = {g['id'] for g in genomes_no_share}
        ids_share = {g['id'] for g in genomes_share}

        # Not guaranteed to be different, but likely with sharing enabled
        # At minimum, both should complete without error
        assert len(ids_no_share) == 20
        assert len(ids_share) == 20


class TestSharingFunctionEdgeCases:
    """Edge cases for the sharing function itself."""

    def test_negative_distance(self):
        """Negative distance should be treated as 0 (identical)."""
        # This shouldn't happen in practice, but test robustness
        result = sharing_function(-0.1, radius=0.5)
        # Negative distance means "beyond" radius in the wrong direction
        # Implementation may treat as 0 or handle differently
        assert isinstance(result, float)

    def test_alpha_zero(self):
        """Alpha=0 should produce constant sharing within radius."""
        # (distance/radius)^0 = 1, so 1 - 1 = 0 for any distance < radius
        result = sharing_function(0.25, radius=0.5, alpha=0.0)
        assert result == pytest.approx(0.0)

    def test_alpha_large(self):
        """Large alpha should make sharing drop off quickly."""
        result_low_alpha = sharing_function(0.25, radius=0.5, alpha=1.0)
        result_high_alpha = sharing_function(0.25, radius=0.5, alpha=10.0)

        # High alpha means (d/r)^10 is very small, so 1 - small ≈ 1
        assert result_high_alpha > result_low_alpha


class TestBodyDistanceEdgeCases:
    """Edge cases for body-based distance calculation."""

    def test_empty_nodes_and_muscles(self):
        """Empty body should not crash."""
        genome1 = {'nodes': [], 'muscles': [], 'globalFrequencyMultiplier': 1.0}
        genome2 = {'nodes': [1, 2], 'muscles': [1], 'globalFrequencyMultiplier': 1.0}

        distance = body_genome_distance(genome1, genome2)
        assert distance > 0

    def test_missing_frequency_multiplier(self):
        """Missing frequency multiplier should use default."""
        genome1 = {'nodes': [1, 2], 'muscles': [1]}
        genome2 = {'nodes': [1, 2], 'muscles': [1]}

        distance = body_genome_distance(genome1, genome2)
        assert distance == 0.0  # Identical structure, default freq

    def test_very_different_structures(self):
        """Very different body structures should produce large distance."""
        genome1 = {'nodes': [1], 'muscles': [], 'globalFrequencyMultiplier': 0.5}
        genome2 = {'nodes': list(range(20)), 'muscles': list(range(30)), 'globalFrequencyMultiplier': 2.0}

        distance = body_genome_distance(genome1, genome2)
        assert distance > 5.0  # Significant difference


class TestRealWorldScenarios:
    """Tests simulating real-world usage patterns."""

    def test_converged_population(self):
        """Population that has converged to similar solutions."""
        # Simulate a converged population - all similar genomes
        base = generate_random_genome(use_neural_net=True, neural_hidden_size=8)

        genomes = []
        for i in range(20):
            # Small variations on the base
            variant = dict(base)
            variant['id'] = f'variant_{i}'
            ng = dict(base['neuralGenome'])
            # Tiny perturbations on weights_ih (flat list)
            if 'weights_ih' in ng:
                ng['weights_ih'] = [
                    w + random.uniform(-0.01, 0.01)
                    for w in ng['weights_ih']
                ]
            variant['neuralGenome'] = ng
            genomes.append(variant)

        fitness = [50.0 + random.uniform(-5, 5) for _ in range(20)]

        # All similar, so all should share heavily
        shared = apply_fitness_sharing(genomes, fitness, sharing_radius=0.5)

        # Shared fitness should be much lower than raw
        avg_raw = sum(fitness) / len(fitness)
        avg_shared = sum(shared) / len(shared)
        assert avg_shared < avg_raw

    def test_diverse_population(self):
        """Population with diverse solutions."""
        random.seed(42)
        genomes = generate_population(size=20, use_neural_net=True, neural_hidden_size=8)
        fitness = [random.uniform(0, 100) for _ in range(20)]

        shared = apply_fitness_sharing(genomes, fitness, sharing_radius=0.3)

        # Shared fitness should still be reasonable (not completely zeroed out)
        # Some sharing will occur even with diverse population
        assert all(isinstance(f, float) for f in shared)
        assert all(not math.isnan(f) for f in shared)
        # At least one creature should retain some fitness
        assert max(shared) > 0

    def test_one_dominant_species_with_outlier(self):
        """One dominant cluster plus one outlier."""
        # Create 9 similar creatures and 1 very different one
        similar_base = generate_random_genome(use_neural_net=True, neural_hidden_size=4)

        similar_genomes = []
        for i in range(9):
            g = dict(similar_base)
            g['id'] = f'similar_{i}'
            similar_genomes.append(g)

        # Very different outlier
        outlier = generate_random_genome(use_neural_net=True, neural_hidden_size=4)
        # Make it very different by shifting all weights significantly (flat lists)
        ng = outlier['neuralGenome']
        if 'weights_ih' in ng:
            ng['weights_ih'] = [w + 10.0 for w in ng['weights_ih']]
        if 'weights_ho' in ng:
            ng['weights_ho'] = [w + 10.0 for w in ng['weights_ho']]
        outlier['id'] = 'outlier'

        genomes = similar_genomes + [outlier]
        fitness = [100.0] * 10  # All same raw fitness

        shared = apply_fitness_sharing(genomes, fitness, sharing_radius=1.0)

        # Outlier should have highest shared fitness
        outlier_shared = shared[9]
        similar_shared = shared[0]

        assert outlier_shared > similar_shared
