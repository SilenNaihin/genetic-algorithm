"""
Tests for NEAT compatibility distance.

Tests cover:
- Identical genomes have zero distance
- Matching, disjoint, and excess gene counting
- Weight difference calculation
- Coefficient weighting
- Edge cases (empty genomes, no matching genes)
- Integration with speciation
"""

import pytest

from app.genetics.neat_distance import (
    neat_genome_distance,
    neat_genome_distance_from_dict,
    create_neat_distance_fn,
    _extract_neat_genome,
)
from app.genetics.speciation import assign_species
from app.neural.neat_network import create_minimal_neat_genome
from app.schemas.neat import ConnectionGene, NEATGenome, NeuronGene


class TestNeatGenomeDistance:
    """Tests for the core distance function."""

    def test_identical_genomes_zero_distance(self):
        """Identical genomes have distance 0."""
        genome = create_minimal_neat_genome(input_size=3, output_size=2)

        distance = neat_genome_distance(genome, genome)

        assert distance == 0.0

    def test_different_weights_same_structure(self):
        """Same structure but different weights gives weight-based distance."""
        genome_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
        )

        genome_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=0.0, innovation=0),
            ],
        )

        # Weight diff = |1.0 - 0.0| = 1.0
        # Distance = 0 (excess) + 0 (disjoint) + 0.4 * 1.0 = 0.4
        distance = neat_genome_distance(genome_a, genome_b)

        assert distance == pytest.approx(0.4)

    def test_disjoint_genes(self):
        """Genomes with disjoint genes."""
        genome_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=1, weight=0.5, innovation=2),
            ],
        )

        genome_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=1, weight=0.5, innovation=1),
            ],
        )

        # Matching: innovation 0
        # Disjoint from A: innovation 2 (within B's range 0-1? No, 2 > 1, so excess)
        # Wait, 2 > max(B) which is 1, so it's excess from A
        # Disjoint from B: innovation 1 (within A's range 0-2, so disjoint)
        # Excess: 1, Disjoint: 1, N = 2
        # Weight diff: |1.0 - 1.0| = 0
        # Distance = 1/2 * 1.0 + 1/2 * 1.0 + 0.4 * 0 = 1.0
        distance = neat_genome_distance(genome_a, genome_b)

        assert distance == pytest.approx(1.0)

    def test_excess_genes_only(self):
        """One genome has extra genes beyond the other's max."""
        genome_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
        )

        genome_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=1, weight=0.5, innovation=10),
                ConnectionGene(from_node=0, to_node=1, weight=0.3, innovation=11),
            ],
        )

        # Matching: innovation 0
        # Excess from B: innovations 10, 11 (both > max(A) = 0)
        # Disjoint: 0
        # N = 3 (larger genome)
        # Weight diff: 0
        # Distance = 2/3 * 1.0 + 0 + 0 ≈ 0.667
        distance = neat_genome_distance(genome_a, genome_b)

        assert distance == pytest.approx(2/3)

    def test_no_matching_genes(self):
        """Genomes with completely different innovations."""
        genome_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=1, weight=0.5, innovation=1),
            ],
        )

        genome_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-1.0, innovation=10),
                ConnectionGene(from_node=0, to_node=1, weight=-0.5, innovation=11),
            ],
        )

        # No matching genes
        # A's genes (0, 1) are disjoint (within B's range 10-11? No, below min)
        # Actually they're disjoint because they're < max(B)=11
        # B's genes (10, 11) are excess (> max(A)=1)
        # Disjoint: 2, Excess: 2, N = 2
        distance = neat_genome_distance(genome_a, genome_b)

        # Distance = 2/2 * 1.0 + 2/2 * 1.0 + 0 = 2.0
        assert distance == pytest.approx(2.0)


class TestCoefficients:
    """Tests for coefficient weighting."""

    def test_excess_coefficient(self):
        """Excess coefficient scales excess gene contribution."""
        genome_a = create_minimal_neat_genome(input_size=2, output_size=1)
        genome_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=100),
            ],
        )

        # With default c1=1.0
        dist1 = neat_genome_distance(genome_a, genome_b, excess_coefficient=1.0)

        # With c1=2.0
        dist2 = neat_genome_distance(genome_a, genome_b, excess_coefficient=2.0)

        # Excess contribution should double
        assert dist2 > dist1

    def test_weight_coefficient(self):
        """Weight coefficient scales weight difference contribution."""
        genome_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
        )

        genome_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=0.0, innovation=0),
            ],
        )

        # With c3=0.4
        dist1 = neat_genome_distance(genome_a, genome_b, weight_coefficient=0.4)
        assert dist1 == pytest.approx(0.4)

        # With c3=1.0
        dist2 = neat_genome_distance(genome_a, genome_b, weight_coefficient=1.0)
        assert dist2 == pytest.approx(1.0)

    def test_normalize_by_size_false(self):
        """When normalize_by_size=False, N=1 (no normalization)."""
        # Two genomes with some matching and some excess
        genome_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=i)
                for i in range(5)  # innovations 0-4
            ],
        )

        genome_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),  # matching
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=1),  # matching
            ],
        )

        # A has 0-4, B has 0-1
        # Matching: 0, 1 (weight diff = 0)
        # Excess from A: 2, 3, 4 (all > max(B)=1)
        # With normalization: 3/5 = 0.6
        dist_normalized = neat_genome_distance(genome_a, genome_b, normalize_by_size=True)
        assert dist_normalized == pytest.approx(0.6)

        # Without normalization: 3/1 = 3.0
        dist_raw = neat_genome_distance(genome_a, genome_b, normalize_by_size=False)
        assert dist_raw == pytest.approx(3.0)


class TestEdgeCases:
    """Edge cases for distance calculation."""

    def test_both_empty_genomes(self):
        """Two empty genomes have zero distance."""
        genome_a = NEATGenome(neurons=[], connections=[])
        genome_b = NEATGenome(neurons=[], connections=[])

        distance = neat_genome_distance(genome_a, genome_b)

        assert distance == 0.0

    def test_one_empty_genome(self):
        """One empty genome, one with connections."""
        genome_a = create_minimal_neat_genome(input_size=3, output_size=2)
        genome_b = NEATGenome(neurons=[], connections=[])

        distance = neat_genome_distance(genome_a, genome_b)

        # All of A's genes are excess
        assert distance == pytest.approx(len(genome_a.connections))

    def test_single_connection_each(self):
        """Minimal case: one connection each."""
        genome_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=0.5, innovation=0),
            ],
        )

        genome_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-0.5, innovation=0),
            ],
        )

        # Only weight difference: |0.5 - (-0.5)| = 1.0
        distance = neat_genome_distance(genome_a, genome_b)
        assert distance == pytest.approx(0.4)  # c3 * 1.0

    def test_disabled_connections_still_counted(self):
        """Disabled connections are included in distance calculation."""
        genome_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, enabled=False, innovation=0),
            ],
        )

        genome_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=0.0, enabled=True, innovation=0),
            ],
        )

        # Disabled doesn't affect distance - genes still match
        distance = neat_genome_distance(genome_a, genome_b)
        assert distance == pytest.approx(0.4)


class TestDictInterface:
    """Tests for dict-based interface."""

    def test_direct_neat_genome_dict(self):
        """Accept raw NEAT genome dict."""
        genome_a = {
            'neurons': [
                {'id': 0, 'type': 'input'},
                {'id': 1, 'type': 'output'},
            ],
            'connections': [
                {'from_node': 0, 'to_node': 1, 'weight': 1.0, 'innovation': 0},
            ],
        }

        genome_b = {
            'neurons': [
                {'id': 0, 'type': 'input'},
                {'id': 1, 'type': 'output'},
            ],
            'connections': [
                {'from_node': 0, 'to_node': 1, 'weight': 0.0, 'innovation': 0},
            ],
        }

        distance = neat_genome_distance_from_dict(genome_a, genome_b)
        assert distance == pytest.approx(0.4)

    def test_creature_genome_wrapper(self):
        """Accept creature genome with neatGenome key."""
        genome_a = {
            'id': 'creature-1',
            'neatGenome': {
                'neurons': [
                    {'id': 0, 'type': 'input'},
                    {'id': 1, 'type': 'output'},
                ],
                'connections': [
                    {'from_node': 0, 'to_node': 1, 'weight': 1.0, 'innovation': 0},
                ],
            },
        }

        genome_b = {
            'id': 'creature-2',
            'neatGenome': {
                'neurons': [
                    {'id': 0, 'type': 'input'},
                    {'id': 1, 'type': 'output'},
                ],
                'connections': [
                    {'from_node': 0, 'to_node': 1, 'weight': 0.0, 'innovation': 0},
                ],
            },
        }

        distance = neat_genome_distance_from_dict(genome_a, genome_b)
        assert distance == pytest.approx(0.4)

    def test_neat_genome_object(self):
        """Accept NEATGenome objects directly."""
        genome_a = create_minimal_neat_genome(input_size=2, output_size=1)
        genome_b = create_minimal_neat_genome(input_size=2, output_size=1)

        # Modify weights
        for conn in genome_b.connections:
            conn.weight = 0.0

        distance = neat_genome_distance_from_dict(genome_a, genome_b)
        assert distance > 0


class TestCreateDistanceFn:
    """Tests for the distance function factory."""

    def test_create_with_custom_coefficients(self):
        """Create distance function with custom coefficients."""
        distance_fn = create_neat_distance_fn(
            excess_coefficient=2.0,
            disjoint_coefficient=2.0,
            weight_coefficient=1.0,
        )

        genome_a = {
            'neurons': [{'id': 0, 'type': 'input'}, {'id': 1, 'type': 'output'}],
            'connections': [{'from_node': 0, 'to_node': 1, 'weight': 1.0, 'innovation': 0}],
        }

        genome_b = {
            'neurons': [{'id': 0, 'type': 'input'}, {'id': 1, 'type': 'output'}],
            'connections': [{'from_node': 0, 'to_node': 1, 'weight': 0.0, 'innovation': 0}],
        }

        # Weight diff = 1.0, coefficient = 1.0
        distance = distance_fn(genome_a, genome_b)
        assert distance == pytest.approx(1.0)


class TestSpeciationIntegration:
    """Tests for integration with speciation system."""

    def test_speciation_with_neat_distance(self):
        """NEAT distance function works with speciation."""
        # Create genomes with different topologies
        genomes = []

        # Group 1: similar structure (innovations 0-5)
        for i in range(5):
            genome = {
                'id': f'creature-{i}',
                'neatGenome': {
                    'neurons': [
                        {'id': 0, 'type': 'input'},
                        {'id': 1, 'type': 'output'},
                    ],
                    'connections': [
                        {'from_node': 0, 'to_node': 1, 'weight': 0.5 + i * 0.01, 'innovation': j}
                        for j in range(5)
                    ],
                },
            }
            genomes.append(genome)

        # Group 2: different structure (innovations 100-105)
        for i in range(5):
            genome = {
                'id': f'creature-{i+5}',
                'neatGenome': {
                    'neurons': [
                        {'id': 0, 'type': 'input'},
                        {'id': 1, 'type': 'output'},
                    ],
                    'connections': [
                        {'from_node': 0, 'to_node': 1, 'weight': -0.5 + i * 0.01, 'innovation': 100 + j}
                        for j in range(5)
                    ],
                },
            }
            genomes.append(genome)

        fitness_scores = [1.0] * 10

        # Use NEAT distance for speciation
        distance_fn = create_neat_distance_fn()
        species_list = assign_species(
            genomes,
            fitness_scores,
            compatibility_threshold=1.5,  # Should separate the two groups
            distance_fn=distance_fn,
        )

        # Should have at least 2 species (the two groups)
        assert len(species_list) >= 2

    def test_similar_neat_genomes_same_species(self):
        """Similar NEAT genomes should be assigned to same species."""
        genomes = []

        # Create 10 similar genomes (same innovations, similar weights)
        for i in range(10):
            genome = {
                'id': f'creature-{i}',
                'neatGenome': {
                    'neurons': [
                        {'id': 0, 'type': 'input'},
                        {'id': 1, 'type': 'output'},
                    ],
                    'connections': [
                        {'from_node': 0, 'to_node': 1, 'weight': 0.5 + i * 0.001, 'innovation': 0},
                    ],
                },
            }
            genomes.append(genome)

        fitness_scores = [1.0] * 10

        distance_fn = create_neat_distance_fn()
        species_list = assign_species(
            genomes,
            fitness_scores,
            compatibility_threshold=0.5,
            distance_fn=distance_fn,
        )

        # All should be in same species (weight diff is tiny)
        assert len(species_list) == 1
        assert species_list[0].size == 10


class TestSymmetry:
    """Test that distance is symmetric."""

    def test_distance_is_symmetric(self):
        """Distance(A, B) == Distance(B, A)."""
        genome_a = create_minimal_neat_genome(input_size=3, output_size=2)
        genome_b = create_minimal_neat_genome(input_size=3, output_size=2)

        # Give B different structure
        genome_b.connections.append(
            ConnectionGene(from_node=0, to_node=3, weight=0.5, innovation=100)
        )

        dist_ab = neat_genome_distance(genome_a, genome_b)
        dist_ba = neat_genome_distance(genome_b, genome_a)

        assert dist_ab == pytest.approx(dist_ba)

    def test_distance_is_symmetric_complex(self):
        """Symmetry holds for complex genomes."""
        genome_a = NEATGenome(
            neurons=[
                NeuronGene(id=i, type='input') for i in range(5)
            ] + [
                NeuronGene(id=5, type='hidden', innovation=0),
                NeuronGene(id=6, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=i, to_node=5, weight=0.1 * i, innovation=i)
                for i in range(5)
            ] + [
                ConnectionGene(from_node=5, to_node=6, weight=1.0, innovation=5),
            ],
        )

        genome_b = NEATGenome(
            neurons=[
                NeuronGene(id=i, type='input') for i in range(5)
            ] + [
                NeuronGene(id=7, type='hidden', innovation=1),
                NeuronGene(id=6, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=7, weight=0.5, innovation=10),
                ConnectionGene(from_node=7, to_node=6, weight=-1.0, innovation=11),
            ],
        )

        dist_ab = neat_genome_distance(genome_a, genome_b)
        dist_ba = neat_genome_distance(genome_b, genome_a)

        assert dist_ab == pytest.approx(dist_ba)
