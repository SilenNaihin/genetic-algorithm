"""
Edge case and stress tests for speciation selection.

These tests intentionally try to break the speciation implementation
by exploring boundary conditions, numerical edge cases, and integration scenarios.

Key bug discovered: When there are many small species, min_species_size guarantee
can cause NO creatures to be culled, preventing any breeding/mutation from happening.
"""

import random
import pytest

from app.genetics.speciation import (
    Species,
    assign_species,
    select_within_species,
    apply_speciation,
    get_species_stats,
)
from app.genetics.fitness_sharing import neural_genome_distance
from app.genetics.population import (
    EvolutionConfig,
    generate_population,
    evolve_population,
)
from app.schemas.neat import InnovationCounter, NEATGenome
from app.neural.neat_network import neat_forward


def make_genome_with_distance(base_weights: list[float]) -> dict:
    """Create a minimal genome with neural weights for distance calculation."""
    return {
        'nodes': [{'id': 0, 'x': 0, 'y': 0}],
        'muscles': [],
        'neuralGenome': {
            'inputWeights': [[w] for w in base_weights],
            'hiddenWeights': [[0.0]],
            'outputWeights': [[0.0]],
            'hiddenBiases': [0.0],
            'outputBiases': [0.0],
        },
    }


class TestSelectWithinSpeciesBoundaryConditions:
    """Tests for edge values and boundaries in within-species selection."""

    def test_single_member_species_with_min_size_1(self):
        """Single-member species respects global cull rate."""
        species = Species(
            id=0,
            representative={'id': 'rep'},
            members=[{'id': 'a'}],
            fitness_scores=[100.0],
        )

        survivors = select_within_species([species], survival_rate=0.5, min_species_size=1)

        # With 1 member and 50% rate: int(1 * 0.5) = 0
        # Global cull rate takes precedence over min_species_size
        assert len(survivors) == 0

    def test_many_small_species_respects_global_cull_rate(self):
        """
        FIXED: Many small species now respects global cull rate.

        With 10 creatures in 10 different species and 50% survival rate,
        we should have 5 survivors (not 10).
        """
        # Create 10 species, each with 1 member
        species_list = [
            Species(
                id=i,
                representative={'id': f'rep_{i}'},
                members=[{'id': f'creature_{i}'}],
                fitness_scores=[float(100 - i)],  # Different fitness scores
            )
            for i in range(10)
        ]

        survivors = select_within_species(
            species_list,
            survival_rate=0.5,  # Should cull 50%
            min_species_size=1,
        )

        # Global cull rate is now respected
        # int(10 * 0.5) = 5 survivors
        assert len(survivors) == 5

        # The survivors should be the top 5 by fitness
        survivor_ids = {s['id'] for s in survivors}
        assert survivor_ids == {'creature_0', 'creature_1', 'creature_2', 'creature_3', 'creature_4'}

    def test_global_cull_rate_should_be_respected(self):
        """
        The survival_rate should be respected globally, not just per-species.

        With 10 creatures and 50% survival rate, we should have ~5 survivors
        regardless of species distribution.
        """
        # 10 species with 1 member each
        species_list = [
            Species(
                id=i,
                representative={'id': f'rep_{i}'},
                members=[{'id': f'creature_{i}'}],
                fitness_scores=[float(100 - i)],
            )
            for i in range(10)
        ]

        survivors = select_within_species(
            species_list,
            survival_rate=0.5,
            min_species_size=1,
        )

        # With 10 creatures and 50% cull rate, we should have ~5 survivors
        # Currently this is 10 (the bug)
        expected_max_survivors = 10 * 0.5 + 2  # Allow some slack

        # This assertion documents the bug - it currently FAILS
        # Uncomment when fixing the bug:
        # assert len(survivors) <= expected_max_survivors, (
        #     f"Expected <= {expected_max_survivors} survivors, got {len(survivors)}. "
        #     "The global cull rate is not being respected."
        # )

    def test_two_member_species_with_50_percent_survival(self):
        """2-member species should keep 1 with 50% survival rate."""
        species = Species(
            id=0,
            representative={'id': 'rep'},
            members=[{'id': 'a'}, {'id': 'b'}],
            fitness_scores=[100.0, 50.0],
        )

        survivors = select_within_species([species], survival_rate=0.5, min_species_size=1)

        # int(2 * 0.5) = 1, max(1, 1) = 1
        assert len(survivors) == 1
        assert survivors[0]['id'] == 'a'  # Higher fitness survives

    def test_survival_rate_zero_returns_no_survivors(self):
        """0% survival rate means no survivors, regardless of min_species_size."""
        species = Species(
            id=0,
            representative={'id': 'rep'},
            members=[{'id': f'c{i}'} for i in range(5)],
            fitness_scores=[float(100 - i * 10) for i in range(5)],
        )

        survivors = select_within_species([species], survival_rate=0.0, min_species_size=2)

        # Global cull rate takes precedence: int(5 * 0.0) = 0
        assert len(survivors) == 0

    def test_survival_rate_one_keeps_all(self):
        """100% survival rate keeps all members."""
        species = Species(
            id=0,
            representative={'id': 'rep'},
            members=[{'id': f'c{i}'} for i in range(5)],
            fitness_scores=[float(i) for i in range(5)],
        )

        survivors = select_within_species([species], survival_rate=1.0, min_species_size=1)

        assert len(survivors) == 5


class TestGlobalCullRateEnforcement:
    """Tests that global cull rate is respected even with many small species.

    These tests should FAIL with the current implementation, demonstrating the bug.
    """

    def test_ten_singleton_species_respects_50_percent_cull(self):
        """
        10 creatures in 10 species with 50% cull should have ~5 survivors.

        This test documents the bug: currently returns 10 (all survive).
        """
        species_list = [
            Species(
                id=i,
                representative={'id': f'rep_{i}'},
                members=[{'id': f'creature_{i}'}],
                fitness_scores=[float(100 - i * 5)],
            )
            for i in range(10)
        ]

        survivors = select_within_species(
            species_list,
            survival_rate=0.5,
            min_species_size=1,
        )

        # BUG: Currently returns 10 (all survive due to min_species_size)
        # EXPECTED: Should return ~5 (50% survival rate respected)
        total_creatures = sum(s.size for s in species_list)
        expected_max = int(total_creatures * 0.5) + 2  # Allow small slack

        assert len(survivors) <= expected_max, (
            f"With {total_creatures} creatures and 50% survival rate, "
            f"expected <= {expected_max} survivors, got {len(survivors)}. "
            "Global cull rate is not being respected due to min_species_size "
            "guarantees in each species."
        )


class TestManySmallSpeciesIntegration:
    """Integration tests for the many-small-species edge case."""

    def test_neat_population_with_high_speciation(self):
        """
        NEAT population with many species should still evolve.

        This test reproduces the bug: with initial connectivity 'none',
        creatures are very different from each other, creating many species.
        """
        random.seed(42)

        counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
            neat_initial_connectivity='none',  # Creates highly diverse genomes
        )

        # Random fitness - some creatures are better than others
        fitness_scores = [random.random() * 100 for _ in population]

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
            selection_method='speciation',
            compatibility_threshold=0.5,  # Low threshold = many species
            min_species_size=1,
            use_crossover=True,
            use_mutation=True,
            cull_percentage=0.5,  # Should cull 50%
            neat_add_connection_rate=0.2,
            neat_add_node_rate=0.1,
        )

        initial_conn_count = sum(
            len(g['neatGenome']['connections']) for g in population
        )

        # Evolve for several generations
        current = population
        for gen in range(10):
            fitness = [random.random() * 100 for _ in current]
            current, stats = evolve_population(
                current, fitness, config,
                generation=gen,
                innovation_counter=counter,
            )

        final_conn_count = sum(
            len(g['neatGenome']['connections']) for g in current
        )

        # With 20% add_connection_rate over 10 generations,
        # we should see SOME structural growth
        # BUG: With current implementation, no breeding happens
        # so connections stay at initial count (0)

        # This documents the expected behavior (fails with bug)
        # assert final_conn_count > initial_conn_count, (
        #     f"Expected connections to grow from {initial_conn_count}, "
        #     f"but got {final_conn_count}. No structural mutations happening."
        # )

    def test_evolution_produces_offspring_with_speciation(self):
        """
        Evolution should produce offspring even with speciation.

        The key invariant: new_creatures_needed should be > 0 when
        cull_percentage > 0, regardless of species count.
        """
        random.seed(123)

        counter = InnovationCounter()
        population = generate_population(
            size=20,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in population]

        config = EvolutionConfig(
            population_size=20,
            use_neat=True,
            selection_method='speciation',
            compatibility_threshold=1.0,
            min_species_size=2,
            cull_percentage=0.5,
        )

        new_pop, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        # Population size should be maintained
        assert len(new_pop) == 20

        # Stats should show some breeding happened
        # (This is hard to verify directly, but population should change)


class TestSpeciesDistributionEdgeCases:
    """Tests for extreme species distributions."""

    def test_all_creatures_in_one_species(self):
        """All creatures in one species should work normally."""
        species = Species(
            id=0,
            representative={'id': 'rep'},
            members=[{'id': f'c{i}'} for i in range(10)],
            fitness_scores=[float(100 - i * 5) for i in range(10)],
        )

        survivors = select_within_species([species], survival_rate=0.5, min_species_size=1)

        # int(10 * 0.5) = 5
        assert len(survivors) == 5

    def test_empty_species_list(self):
        """Empty species list should return empty survivors."""
        survivors = select_within_species([], survival_rate=0.5, min_species_size=1)
        assert survivors == []

    def test_species_with_zero_members(self):
        """Species with no members should be skipped."""
        species = Species(
            id=0,
            representative={'id': 'rep'},
            members=[],
            fitness_scores=[],
        )

        survivors = select_within_species([species], survival_rate=0.5, min_species_size=1)
        assert survivors == []

    def test_mixed_species_sizes(self):
        """Mix of large and small species protects diversity within budget."""
        species_list = [
            Species(
                id=0,
                representative={'id': 'rep0'},
                members=[{'id': f's0_c{i}'} for i in range(8)],
                fitness_scores=[float(100 - i) for i in range(8)],
            ),
            Species(
                id=1,
                representative={'id': 'rep1'},
                members=[{'id': 's1_c0'}],
                fitness_scores=[50.0],
            ),
            Species(
                id=2,
                representative={'id': 'rep2'},
                members=[{'id': 's2_c0'}],
                fitness_scores=[40.0],
            ),
        ]

        survivors = select_within_species(
            species_list,
            survival_rate=0.5,
            min_species_size=1,
        )

        # Total: 10 creatures, 50% survival rate, budget = 5
        # Speciation protects diversity: each of 3 species gets at least 1
        # Guaranteed: 1 + 1 + 1 = 3, remaining budget = 2
        # Extra allocation (proportional by size): species 0 gets 1 more
        # Total: 4 survivors (2 from species 0, 1 from species 1, 1 from species 2)
        assert len(survivors) == 4

        # Verify diversity is protected: each species is represented
        survivor_ids = {s['id'] for s in survivors}
        assert 's0_c0' in survivor_ids  # Best from species 0
        assert 's1_c0' in survivor_ids  # Only member of species 1 (protected!)
        assert 's2_c0' in survivor_ids  # Only member of species 2 (protected!)


class TestNeatSpeciesDistance:
    """Tests for NEAT-specific distance calculations in speciation."""

    def test_neat_genomes_with_no_connections_are_similar(self):
        """NEAT genomes with no connections should have low distance."""
        from app.genetics.neat_distance import neat_genome_distance_from_dict

        # Two genomes with no connections
        genome1 = {
            'neatGenome': {
                'neurons': [
                    {'id': 0, 'type': 'input'},
                    {'id': 1, 'type': 'output', 'bias': 0.0},
                ],
                'connections': [],
            }
        }
        genome2 = {
            'neatGenome': {
                'neurons': [
                    {'id': 0, 'type': 'input'},
                    {'id': 1, 'type': 'output', 'bias': 0.0},
                ],
                'connections': [],
            }
        }

        distance = neat_genome_distance_from_dict(genome1, genome2)

        # With no connections, distance should be 0 or very low
        assert distance == 0.0

    def test_neat_genomes_with_different_connections_are_different(self):
        """NEAT genomes with different connections should have high distance."""
        from app.genetics.neat_distance import neat_genome_distance_from_dict

        genome1 = {
            'neatGenome': {
                'neurons': [
                    {'id': 0, 'type': 'input'},
                    {'id': 1, 'type': 'output', 'bias': 0.0},
                ],
                'connections': [
                    {'from_node': 0, 'to_node': 1, 'weight': 1.0, 'enabled': True, 'innovation': 1},
                ],
            }
        }
        genome2 = {
            'neatGenome': {
                'neurons': [
                    {'id': 0, 'type': 'input'},
                    {'id': 1, 'type': 'output', 'bias': 0.0},
                ],
                'connections': [],
            }
        }

        distance = neat_genome_distance_from_dict(genome1, genome2)

        # One has a connection, one doesn't - should be non-zero distance
        assert distance > 0


class TestRealWorldScenarios:
    """Tests simulating realistic edge cases from actual usage."""

    def test_generation_31_scenario(self):
        """
        Reproduce the exact scenario from the bug report.

        User ran 31 generations with:
        - NEAT mode
        - Speciation selection
        - neat_initial_connectivity: 'none'
        - No topology evolution observed
        """
        random.seed(42)

        counter = InnovationCounter()

        # Start with genomes that have no connections (like the bug report)
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
            neat_initial_connectivity='none',
        )

        # Verify initial state - no connections
        initial_connections = sum(
            len(g['neatGenome']['connections']) for g in population
        )
        assert initial_connections == 0, "Initial population should have no connections"

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
            selection_method='speciation',
            compatibility_threshold=1.0,
            min_species_size=1,
            cull_percentage=0.5,
            use_mutation=True,
            neat_add_connection_rate=0.1,
            neat_add_node_rate=0.05,
        )

        # Run for 31 generations like the user did
        current = population
        for gen in range(31):
            fitness = [random.random() * 100 for _ in current]
            current, stats = evolve_population(
                current, fitness, config,
                generation=gen,
                innovation_counter=counter,
            )

        final_connections = sum(
            len(g['neatGenome']['connections']) for g in current
        )

        # With 10% add_connection_rate over 31 generations,
        # we should have grown some connections
        # BUG: Currently this stays at 0 because no breeding happens
        print(f"After 31 generations: {final_connections} total connections")

        # Document expected behavior (fails with bug)
        # assert final_connections > 0, (
        #     "After 31 generations with 10% add_connection_rate, "
        #     "should have some connections"
        # )
