"""Tests for fitness sharing module."""

import pytest

from app.genetics.fitness_sharing import (
    neural_genome_distance,
    body_genome_distance,
    sharing_function,
    apply_fitness_sharing,
)


class TestNeuralGenomeDistance:
    """Tests for neural_genome_distance function."""

    def test_identical_genomes_zero_distance(self):
        """Identical genomes should have zero distance."""
        genome = {
            'neuralGenome': {
                'inputWeights': [[0.1, 0.2], [0.3, 0.4]],
                'hiddenBiases': [0.0, 0.0],
                'outputWeights': [[0.5, 0.6]],
                'outputBiases': [-0.5],
            }
        }
        assert neural_genome_distance(genome, genome) == 0.0

    def test_different_genomes_positive_distance(self):
        """Different genomes should have positive distance."""
        genome1 = {
            'neuralGenome': {
                'inputWeights': [[0.1, 0.2]],
                'hiddenBiases': [0.0],
                'outputWeights': [[0.5]],
                'outputBiases': [-0.5],
            }
        }
        genome2 = {
            'neuralGenome': {
                'inputWeights': [[0.9, 0.8]],
                'hiddenBiases': [0.5],
                'outputWeights': [[0.1]],
                'outputBiases': [0.0],
            }
        }
        distance = neural_genome_distance(genome1, genome2)
        assert distance > 0

    def test_fallback_to_body_distance_when_no_neural(self):
        """Should use body distance when neural genome is missing."""
        genome1 = {'nodes': [1, 2, 3], 'muscles': [1, 2]}
        genome2 = {'nodes': [1, 2, 3, 4, 5], 'muscles': [1, 2, 3, 4]}

        distance = neural_genome_distance(genome1, genome2)
        # Should be body distance: node_diff * 0.3 + muscle_diff * 0.2
        expected = 2 * 0.3 + 2 * 0.2
        assert distance == pytest.approx(expected)


class TestBodyGenomeDistance:
    """Tests for body_genome_distance function."""

    def test_identical_structures_low_distance(self):
        """Same node/muscle count should have low distance."""
        genome1 = {
            'nodes': [1, 2, 3],
            'muscles': [1, 2],
            'globalFrequencyMultiplier': 1.0,
        }
        genome2 = {
            'nodes': [1, 2, 3],
            'muscles': [1, 2],
            'globalFrequencyMultiplier': 1.0,
        }
        assert body_genome_distance(genome1, genome2) == 0.0

    def test_different_node_counts(self):
        """Different node counts should increase distance."""
        genome1 = {'nodes': [1, 2, 3], 'muscles': [], 'globalFrequencyMultiplier': 1.0}
        genome2 = {'nodes': [1, 2, 3, 4, 5], 'muscles': [], 'globalFrequencyMultiplier': 1.0}

        distance = body_genome_distance(genome1, genome2)
        assert distance == pytest.approx(2 * 0.3)  # 2 node diff * 0.3 weight


class TestSharingFunction:
    """Tests for sharing_function."""

    def test_zero_distance_returns_one(self):
        """Zero distance (identical) should return 1."""
        assert sharing_function(0.0, radius=0.5) == 1.0

    def test_at_radius_returns_zero(self):
        """Distance at radius should return 0."""
        assert sharing_function(0.5, radius=0.5) == 0.0

    def test_beyond_radius_returns_zero(self):
        """Distance beyond radius should return 0."""
        assert sharing_function(1.0, radius=0.5) == 0.0

    def test_half_radius_returns_half(self):
        """Distance at half radius should return 0.5 with alpha=1."""
        assert sharing_function(0.25, radius=0.5, alpha=1.0) == pytest.approx(0.5)


class TestApplyFitnessSharing:
    """Tests for apply_fitness_sharing function."""

    def test_empty_population(self):
        """Empty population should return empty list."""
        assert apply_fitness_sharing([], []) == []

    def test_single_creature(self):
        """Single creature should keep full fitness (niche count = 1)."""
        genomes = [{'neuralGenome': {'inputWeights': [[0.5]]}}]
        fitness = [100.0]

        shared = apply_fitness_sharing(genomes, fitness, sharing_radius=0.5)
        assert shared[0] == pytest.approx(100.0)

    def test_identical_creatures_share_fitness(self):
        """Identical creatures should share fitness equally."""
        genome = {
            'neuralGenome': {
                'inputWeights': [[0.5, 0.5]],
                'hiddenBiases': [0.0],
                'outputWeights': [[0.5]],
                'outputBiases': [-0.5],
            }
        }
        genomes = [genome, genome, genome]
        fitness = [100.0, 100.0, 100.0]

        shared = apply_fitness_sharing(genomes, fitness, sharing_radius=0.5)

        # Each creature is identical to all others, so niche count = 3
        # Shared fitness = 100 / 3
        for f in shared:
            assert f == pytest.approx(100.0 / 3.0)

    def test_different_creatures_keep_fitness(self):
        """Very different creatures should keep most of their fitness."""
        genome1 = {
            'neuralGenome': {
                'inputWeights': [[0.0, 0.0]],
                'hiddenBiases': [0.0],
                'outputWeights': [[0.0]],
                'outputBiases': [0.0],
            }
        }
        genome2 = {
            'neuralGenome': {
                'inputWeights': [[2.0, 2.0]],
                'hiddenBiases': [2.0],
                'outputWeights': [[2.0]],
                'outputBiases': [2.0],
            }
        }
        genomes = [genome1, genome2]
        fitness = [100.0, 100.0]

        # Use small radius so they don't share
        shared = apply_fitness_sharing(genomes, fitness, sharing_radius=0.1)

        # Should keep close to full fitness since they're far apart
        assert shared[0] == pytest.approx(100.0)
        assert shared[1] == pytest.approx(100.0)

    def test_length_mismatch_raises(self):
        """Mismatched genome/fitness lengths should raise error."""
        genomes = [{'id': '1'}, {'id': '2'}]
        fitness = [100.0]

        with pytest.raises(ValueError):
            apply_fitness_sharing(genomes, fitness)


class TestIntegration:
    """Integration tests for fitness sharing with evolution."""

    def test_sharing_promotes_diversity(self):
        """
        With fitness sharing, a unique creature should have higher
        effective fitness than identical high-fitness creatures.
        """
        # 3 identical high-fitness creatures
        identical = {
            'neuralGenome': {
                'inputWeights': [[0.5, 0.5]],
                'hiddenBiases': [0.0],
                'outputWeights': [[0.5]],
                'outputBiases': [-0.5],
            }
        }
        # 1 unique creature with same raw fitness
        unique = {
            'neuralGenome': {
                'inputWeights': [[2.0, -2.0]],
                'hiddenBiases': [1.0],
                'outputWeights': [[-1.5]],
                'outputBiases': [0.5],
            }
        }

        genomes = [identical, identical, identical, unique]
        fitness = [100.0, 100.0, 100.0, 100.0]

        shared = apply_fitness_sharing(genomes, fitness, sharing_radius=0.5)

        # Unique creature should have higher shared fitness
        # because it's not sharing with anyone
        unique_fitness = shared[3]
        identical_fitness = shared[0]  # All identical creatures same

        assert unique_fitness > identical_fitness
