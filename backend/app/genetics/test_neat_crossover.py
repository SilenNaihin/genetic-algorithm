"""
Tests for NEAT crossover operations.

Tests cover:
- Gene alignment by innovation number
- Matching, disjoint, and excess gene classification
- Inheritance from fitter parent
- Disabled gene inheritance probability
- Neuron inheritance
- Equal fitness crossover
- Edge cases
"""

import random
import pytest
from copy import deepcopy

from app.genetics.neat_crossover import (
    align_genes,
    neat_crossover,
    neat_crossover_equal_fitness,
    crossover_biases,
)
from app.neural.neat_network import create_minimal_neat_genome, neat_forward
from app.schemas.neat import ConnectionGene, NEATGenome, NeuronGene


class TestAlignGenes:
    """Tests for gene alignment by innovation number."""

    def test_align_identical_genomes(self):
        """Identical genomes have all matching genes."""
        genome = create_minimal_neat_genome(input_size=2, output_size=2)

        aligned, matching, disjoint, excess = align_genes(genome, genome)

        # All genes should match
        assert len(matching) == len(genome.connections)
        assert len(disjoint) == 0
        assert len(excess) == 0

        # Each pair should have both genes
        for gene_a, gene_b in aligned:
            assert gene_a is not None
            assert gene_b is not None
            assert gene_a.innovation == gene_b.innovation

    def test_align_completely_different_genomes(self):
        """Genomes with no shared innovations."""
        # Create two genomes with different innovation numbers
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

        aligned, matching, disjoint, excess = align_genes(genome_a, genome_b)

        # No matching genes
        assert len(matching) == 0

        # All genes are either disjoint or excess
        # A's genes (0, 1) are disjoint (within B's range 10-11) - wait, they're below
        # Actually 0, 1 are below 10-11, so they're disjoint
        # B's genes (10, 11) are excess (above A's max of 1)
        assert 0 in disjoint
        assert 1 in disjoint
        assert 10 in excess
        assert 11 in excess

    def test_align_with_gaps(self):
        """Alignment with non-sequential innovation numbers."""
        genome_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=1, weight=0.5, innovation=5),
                ConnectionGene(from_node=0, to_node=1, weight=0.3, innovation=10),
            ],
        )

        genome_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=1, weight=-0.5, innovation=3),
                ConnectionGene(from_node=0, to_node=1, weight=-0.3, innovation=5),
            ],
        )

        aligned, matching, disjoint, excess = align_genes(genome_a, genome_b)

        # Matching: 0, 5
        assert matching == {0, 5}

        # Disjoint: 3 (in B, within A's range)
        assert 3 in disjoint

        # Excess: 10 (in A, beyond B's max of 5)
        assert 10 in excess

    def test_align_empty_genome(self):
        """Align when one genome has no connections."""
        genome_a = create_minimal_neat_genome(input_size=2, output_size=2)
        genome_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[],
        )

        aligned, matching, disjoint, excess = align_genes(genome_a, genome_b)

        # All of A's genes are excess (B has no genes)
        assert len(matching) == 0
        assert len(disjoint) == 0
        assert len(excess) == len(genome_a.connections)


class TestNeatCrossover:
    """Tests for NEAT crossover."""

    def test_fitter_parent_provides_disjoint_excess(self):
        """Disjoint/excess genes come from fitter parent."""
        random.seed(12345)

        # Create parent A with extra connection (higher fitness)
        parent_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=1, weight=0.5, innovation=10),  # Excess
            ],
        )

        # Create parent B with different extra connection (lower fitness)
        parent_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=1, weight=-0.5, innovation=5),  # Disjoint
            ],
        )

        child = neat_crossover(parent_a, parent_b, fitness_a=100.0, fitness_b=50.0)

        # Child should have innovation 10 (from fitter A)
        child_innovations = {c.innovation for c in child.connections}
        assert 10 in child_innovations

        # Child should NOT have innovation 5 (from less fit B)
        assert 5 not in child_innovations

    def test_less_fit_parent_disjoint_not_inherited(self):
        """Disjoint/excess from less fit parent are NOT inherited."""
        random.seed(12345)

        parent_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
        )

        parent_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
                NeuronGene(id=2, type='hidden', innovation=100),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=5),
                ConnectionGene(from_node=2, to_node=1, weight=1.0, innovation=6),
            ],
        )

        # A is fitter, so B's disjoint genes (5, 6) should not be inherited
        child = neat_crossover(parent_a, parent_b, fitness_a=100.0, fitness_b=50.0)

        child_innovations = {c.innovation for c in child.connections}
        assert 5 not in child_innovations
        assert 6 not in child_innovations

    def test_matching_genes_random_inheritance(self):
        """Matching genes are inherited from random parent."""
        # Run many trials to verify randomness
        a_count = 0
        b_count = 0

        parent_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
        )

        parent_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-1.0, innovation=0),
            ],
        )

        for i in range(1000):
            random.seed(i)
            child = neat_crossover(parent_a, parent_b, fitness_a=100.0, fitness_b=100.0)
            weight = child.connections[0].weight
            if weight == 1.0:
                a_count += 1
            else:
                b_count += 1

        # Should be roughly 50/50 (allow for randomness)
        assert 400 < a_count < 600
        assert 400 < b_count < 600

    def test_disabled_gene_inheritance(self):
        """Disabled genes have 75% chance to stay disabled when EITHER parent is disabled.

        When one parent has a gene enabled and one disabled:
        - 50% chance to inherit from disabled parent -> stays disabled
        - 50% chance to inherit from enabled parent -> 75% chance to disable
        Total disabled: 50% + 50% * 75% = 87.5%
        """
        disabled_count = 0
        enabled_count = 0

        parent_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, enabled=False, innovation=0),
            ],
        )

        parent_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-1.0, enabled=True, innovation=0),
            ],
        )

        for i in range(1000):
            random.seed(i)
            child = neat_crossover(parent_a, parent_b, fitness_a=100.0, fitness_b=100.0)
            if child.connections[0].enabled:
                enabled_count += 1
            else:
                disabled_count += 1

        # Expected: ~87.5% disabled (50% inherit disabled + 50% * 75% made disabled)
        assert 820 < disabled_count < 920
        assert 80 < enabled_count < 180

    def test_neuron_inheritance_from_fitter_parent(self):
        """Neurons are inherited from fitter parent."""
        random.seed(12345)

        parent_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
                NeuronGene(id=2, type='hidden', bias=0.5, innovation=10),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=0),
                ConnectionGene(from_node=2, to_node=1, weight=1.0, innovation=1),
            ],
        )

        parent_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-1.0, innovation=0),
            ],
        )

        # A is fitter, so child should have A's hidden neuron
        child = neat_crossover(parent_a, parent_b, fitness_a=100.0, fitness_b=50.0)

        child_neuron_ids = {n.id for n in child.neurons}
        assert 2 in child_neuron_ids

    def test_child_is_valid_for_forward_pass(self):
        """Child genome can execute forward pass."""
        random.seed(12345)

        parent_a = create_minimal_neat_genome(input_size=3, output_size=2)
        parent_b = create_minimal_neat_genome(input_size=3, output_size=2)

        # Modify weights to differentiate
        for conn in parent_b.connections:
            conn.weight *= -1

        child = neat_crossover(parent_a, parent_b, fitness_a=100.0, fitness_b=80.0)

        # Should be able to run forward pass
        outputs = neat_forward(child, [0.5, 0.5, 0.5])
        assert len(outputs) == 2
        assert all(-1 <= o <= 1 for o in outputs)

    def test_fitness_determines_parent_order(self):
        """Parent with higher fitness provides disjoint/excess."""
        random.seed(12345)

        # Parent A: has innovation 10
        parent_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=1, weight=0.5, innovation=10),
            ],
        )

        # Parent B: has innovation 5
        parent_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=1, weight=-0.5, innovation=5),
            ],
        )

        # When A is fitter: child has 10, not 5
        child1 = neat_crossover(parent_a, parent_b, fitness_a=100.0, fitness_b=50.0)
        inns1 = {c.innovation for c in child1.connections}
        assert 10 in inns1
        assert 5 not in inns1

        # When B is fitter: child has 5, not 10
        child2 = neat_crossover(parent_a, parent_b, fitness_a=50.0, fitness_b=100.0)
        inns2 = {c.innovation for c in child2.connections}
        assert 5 in inns2
        assert 10 not in inns2


class TestNeatCrossoverEqualFitness:
    """Tests for equal fitness crossover."""

    def test_disjoint_excess_from_both_parents(self):
        """With equal fitness, disjoint/excess can come from either parent."""
        # Track which innovations appear
        seen_5 = 0
        seen_10 = 0

        parent_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=1, weight=0.5, innovation=10),
            ],
        )

        parent_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-1.0, innovation=0),
                ConnectionGene(from_node=0, to_node=1, weight=-0.5, innovation=5),
            ],
        )

        for i in range(1000):
            random.seed(i)
            child = neat_crossover_equal_fitness(parent_a, parent_b)
            inns = {c.innovation for c in child.connections}
            if 5 in inns:
                seen_5 += 1
            if 10 in inns:
                seen_10 += 1

        # Both should be inherited roughly 50% of the time
        assert 400 < seen_5 < 600
        assert 400 < seen_10 < 600

    def test_matching_genes_still_random(self):
        """Matching genes are still randomly inherited."""
        a_count = 0

        parent_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0),
            ],
        )

        parent_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output'),
            ],
            connections=[
                ConnectionGene(from_node=0, to_node=1, weight=-1.0, innovation=0),
            ],
        )

        for i in range(1000):
            random.seed(i)
            child = neat_crossover_equal_fitness(parent_a, parent_b)
            if child.connections[0].weight == 1.0:
                a_count += 1

        assert 400 < a_count < 600


class TestCrossoverBiases:
    """Tests for bias crossover."""

    def test_interpolate_matching_biases(self):
        """Biases are interpolated for matching neurons."""
        random.seed(42)

        parent_a = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=1.0),
            ],
            connections=[],
        )

        parent_b = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=-1.0),
            ],
            connections=[],
        )

        child = NEATGenome(
            neurons=[
                NeuronGene(id=0, type='input'),
                NeuronGene(id=1, type='output', bias=0.0),
            ],
            connections=[],
        )

        crossover_biases(parent_a, parent_b, child)

        # Bias should be between -1.0 and 1.0
        output_neuron = child.get_neuron_by_id(1)
        assert -1.0 <= output_neuron.bias <= 1.0


class TestEdgeCases:
    """Edge cases for crossover."""

    def test_crossover_empty_genomes(self):
        """Crossover two empty genomes."""
        parent_a = NEATGenome(neurons=[], connections=[])
        parent_b = NEATGenome(neurons=[], connections=[])

        child = neat_crossover(parent_a, parent_b, fitness_a=0.0, fitness_b=0.0)

        assert child.neurons == []
        assert child.connections == []

    def test_crossover_with_many_hidden_neurons(self):
        """Crossover with complex topologies."""
        random.seed(12345)

        # Build a complex parent A
        neurons_a = [
            NeuronGene(id=0, type='input'),
            NeuronGene(id=1, type='input'),
            NeuronGene(id=10, type='output'),
            NeuronGene(id=2, type='hidden', innovation=0),
            NeuronGene(id=3, type='hidden', innovation=1),
        ]
        connections_a = [
            ConnectionGene(from_node=0, to_node=2, weight=1.0, innovation=0),
            ConnectionGene(from_node=1, to_node=2, weight=1.0, innovation=1),
            ConnectionGene(from_node=2, to_node=3, weight=1.0, innovation=2),
            ConnectionGene(from_node=3, to_node=10, weight=1.0, innovation=3),
        ]
        parent_a = NEATGenome(neurons=neurons_a, connections=connections_a)

        # Build parent B with different structure
        neurons_b = [
            NeuronGene(id=0, type='input'),
            NeuronGene(id=1, type='input'),
            NeuronGene(id=10, type='output'),
            NeuronGene(id=4, type='hidden', innovation=2),
        ]
        connections_b = [
            ConnectionGene(from_node=0, to_node=4, weight=-1.0, innovation=0),
            ConnectionGene(from_node=1, to_node=10, weight=-1.0, innovation=4),
            ConnectionGene(from_node=4, to_node=10, weight=-1.0, innovation=5),
        ]
        parent_b = NEATGenome(neurons=neurons_b, connections=connections_b)

        child = neat_crossover(parent_a, parent_b, fitness_a=100.0, fitness_b=50.0)

        # Child should have all of A's neurons (fitter parent)
        child_neuron_ids = {n.id for n in child.neurons}
        for neuron in parent_a.neurons:
            assert neuron.id in child_neuron_ids

        # Child should be valid
        outputs = neat_forward(child, [0.5, 0.5])
        assert len(outputs) == 1

    def test_crossover_preserves_activation(self):
        """Child inherits activation from fitter parent."""
        parent_a = NEATGenome(
            neurons=[NeuronGene(id=0, type='input'), NeuronGene(id=1, type='output')],
            connections=[ConnectionGene(from_node=0, to_node=1, weight=1.0, innovation=0)],
            activation='relu',
        )

        parent_b = NEATGenome(
            neurons=[NeuronGene(id=0, type='input'), NeuronGene(id=1, type='output')],
            connections=[ConnectionGene(from_node=0, to_node=1, weight=-1.0, innovation=0)],
            activation='sigmoid',
        )

        child = neat_crossover(parent_a, parent_b, fitness_a=100.0, fitness_b=50.0)
        assert child.activation == 'relu'

        child2 = neat_crossover(parent_a, parent_b, fitness_a=50.0, fitness_b=100.0)
        assert child2.activation == 'sigmoid'

    def test_many_generations_crossover(self):
        """Run crossover for many generations without errors."""
        random.seed(12345)

        population = [
            create_minimal_neat_genome(input_size=3, output_size=2)
            for _ in range(10)
        ]

        for gen in range(50):
            # Assign random fitness
            fitnesses = [random.random() * 100 for _ in population]

            # Create next generation via crossover
            new_pop = []
            for _ in range(10):
                # Pick two parents
                idx_a = random.randint(0, 9)
                idx_b = random.randint(0, 9)
                while idx_b == idx_a:
                    idx_b = random.randint(0, 9)

                child = neat_crossover(
                    population[idx_a],
                    population[idx_b],
                    fitnesses[idx_a],
                    fitnesses[idx_b],
                )

                # Verify child is valid
                outputs = neat_forward(child, [0.5, 0.5, 0.5])
                assert len(outputs) == 2
                assert all(-1 <= o <= 1 for o in outputs)

                new_pop.append(child)

            population = new_pop

        # All final genomes should still be valid
        for genome in population:
            outputs = neat_forward(genome, [0.5, 0.5, 0.5])
            assert len(outputs) == 2


class TestCrossoverInvariants:
    """Test invariants that must hold after crossover."""

    def test_input_output_count_preserved(self):
        """Crossover preserves input/output neuron count."""
        random.seed(12345)

        for _ in range(100):
            parent_a = create_minimal_neat_genome(input_size=4, output_size=3)
            parent_b = create_minimal_neat_genome(input_size=4, output_size=3)

            child = neat_crossover(parent_a, parent_b, random.random(), random.random())

            assert len(child.get_input_neurons()) == 4
            assert len(child.get_output_neurons()) == 3

    def test_all_connections_reference_valid_neurons(self):
        """All child connections reference neurons that exist."""
        random.seed(12345)

        for _ in range(100):
            parent_a = create_minimal_neat_genome(input_size=3, output_size=2)
            parent_b = create_minimal_neat_genome(input_size=3, output_size=2)

            child = neat_crossover(parent_a, parent_b, random.random(), random.random())

            neuron_ids = {n.id for n in child.neurons}
            for conn in child.connections:
                assert conn.from_node in neuron_ids, f"from_node {conn.from_node} not in neurons"
                assert conn.to_node in neuron_ids, f"to_node {conn.to_node} not in neurons"

    def test_no_duplicate_innovations(self):
        """Child should not have duplicate innovation numbers."""
        random.seed(12345)

        for _ in range(100):
            parent_a = create_minimal_neat_genome(input_size=3, output_size=2)
            parent_b = create_minimal_neat_genome(input_size=3, output_size=2)

            child = neat_crossover(parent_a, parent_b, random.random(), random.random())

            innovations = [c.innovation for c in child.connections]
            assert len(innovations) == len(set(innovations))
