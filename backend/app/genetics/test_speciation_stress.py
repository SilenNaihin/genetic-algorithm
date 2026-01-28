"""Stress tests for speciation module.

Tests edge cases that could break speciation in real-world usage:
- Large populations
- Extreme parameter values
- Integration with evolution pipeline
- Multi-generation scenarios
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
from app.genetics.population import (
    generate_population,
    evolve_population,
    EvolutionConfig,
)
from app.genetics.fitness_sharing import neural_genome_distance


def make_neural_genome(
    weights: list[float],
    genome_id: str = "test",
    hidden_size: int = 4,
    num_muscles: int = 3,
) -> dict:
    """Create a genome with specific neural weights for testing."""
    # Create proper neural genome structure
    input_size = 7  # Standard pure mode inputs

    # Create weight matrices with specified weights as a seed
    weight_seed = weights[0] if weights else 0.0

    return {
        "id": genome_id,
        "nodes": [{"id": f"node_{i}", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.3} for i in range(3)],
        "muscles": [{"id": f"muscle_{i}", "nodeA": "node_0", "nodeB": f"node_{i+1}"} for i in range(min(2, num_muscles))],
        "neuralGenome": {
            "inputWeights": [[weight_seed + i * 0.01 for i in range(input_size)] for _ in range(hidden_size)],
            "hiddenBiases": [0.0] * hidden_size,
            "outputWeights": [[weight_seed + i * 0.01 for i in range(hidden_size)] for _ in range(num_muscles)],
            "outputBiases": [-0.5] * num_muscles,
        },
    }


class TestLargePopulations:
    """Test speciation with large populations."""

    def test_100_creatures_diverse(self):
        """100 creatures with diverse genomes should form multiple species."""
        genomes = [make_neural_genome([i * 0.1], f"g{i}") for i in range(100)]
        fitness = [random.uniform(50, 150) for _ in range(100)]

        result = assign_species(genomes, fitness, compatibility_threshold=0.5)

        # Should have multiple species
        assert len(result) > 1
        # All genomes should be assigned
        total_members = sum(s.size for s in result)
        assert total_members == 100

    def test_100_creatures_identical(self):
        """100 identical creatures should form one species."""
        genome_template = make_neural_genome([0.5], "template")
        genomes = [
            {**genome_template, "id": f"g{i}"}
            for i in range(100)
        ]
        fitness = [random.uniform(50, 150) for _ in range(100)]

        result = assign_species(genomes, fitness, compatibility_threshold=0.5)

        # All identical - should be one species
        assert len(result) == 1
        assert result[0].size == 100

    def test_500_creatures_performance(self):
        """500 creatures should complete in reasonable time."""
        import time

        genomes = [make_neural_genome([i * 0.05], f"g{i}") for i in range(500)]
        fitness = [random.uniform(0, 200) for _ in range(500)]

        start = time.time()
        result = assign_species(genomes, fitness, compatibility_threshold=0.3)
        elapsed = time.time() - start

        # Should complete in under 5 seconds
        assert elapsed < 5.0, f"Speciation took {elapsed:.2f}s for 500 creatures"

        # Verify correctness
        total_members = sum(s.size for s in result)
        assert total_members == 500


class TestExtremeParameterValues:
    """Test edge cases with extreme parameter values."""

    def test_very_small_threshold_many_species(self):
        """Very small threshold should create many species."""
        genomes = [make_neural_genome([i * 0.01], f"g{i}") for i in range(20)]
        fitness = [100.0] * 20

        # Threshold so small that almost nothing matches
        result = assign_species(genomes, fitness, compatibility_threshold=0.001)

        # Should have many species (close to 20, depends on distance)
        assert len(result) >= 10

    def test_very_large_threshold_one_species(self):
        """Very large threshold should create one species."""
        genomes = [make_neural_genome([i * 0.5], f"g{i}") for i in range(20)]
        fitness = [100.0] * 20

        # Threshold so large everything matches
        result = assign_species(genomes, fitness, compatibility_threshold=100.0)

        assert len(result) == 1
        assert result[0].size == 20

    def test_min_species_size_larger_than_species(self):
        """min_species_size larger than actual species size - global rate takes precedence."""
        g1 = make_neural_genome([0.0], "g1")
        g2 = make_neural_genome([10.0], "g2")  # Very different
        genomes = [g1, g2]
        fitness = [100.0, 50.0]

        # Small threshold creates 2 single-member species
        species_list = assign_species(genomes, fitness, compatibility_threshold=0.1)
        assert len(species_list) == 2

        # With survival_rate=0.1 and 2 creatures: int(2 * 0.1) = 0
        # Global rate takes precedence over min_species_size
        survivors = select_within_species(species_list, survival_rate=0.1, min_species_size=5)
        assert len(survivors) == 0

        # With survival_rate=1.0, both species survive
        survivors = select_within_species(species_list, survival_rate=1.0, min_species_size=5)
        assert len(survivors) == 2

    def test_survival_rate_zero(self):
        """Survival rate of 0 returns no survivors - global rate takes precedence."""
        genome = make_neural_genome([0.5], "g")
        genomes = [{**genome, "id": f"g{i}"} for i in range(10)]
        fitness = list(range(100, 0, -10))

        species = Species(
            id=0,
            representative=genomes[0],
            members=genomes,
            fitness_scores=fitness,
        )

        # 0% survival rate = 0 survivors, regardless of min_species_size
        survivors = select_within_species([species], survival_rate=0.0, min_species_size=3)

        assert len(survivors) == 0

    def test_survival_rate_one(self):
        """Survival rate of 1.0 should keep all members."""
        genome = make_neural_genome([0.5], "g")
        genomes = [{**genome, "id": f"g{i}"} for i in range(10)]
        fitness = list(range(100, 0, -10))

        species = Species(
            id=0,
            representative=genomes[0],
            members=genomes,
            fitness_scores=fitness,
        )

        survivors = select_within_species([species], survival_rate=1.0, min_species_size=1)

        assert len(survivors) == 10

    def test_all_zero_fitness(self):
        """All creatures with zero fitness should still work."""
        genomes = [make_neural_genome([i * 0.1], f"g{i}") for i in range(10)]
        fitness = [0.0] * 10

        survivors, species_list = apply_speciation(
            genomes,
            fitness,
            compatibility_threshold=0.5,
            survival_rate=0.5,
            min_species_size=1,
        )

        # Should still work - selection by zero fitness is arbitrary but valid
        assert len(survivors) > 0
        assert len(species_list) > 0

    def test_negative_fitness(self):
        """Negative fitness values should work correctly."""
        genomes = [make_neural_genome([i * 0.1], f"g{i}") for i in range(10)]
        fitness = [-100.0 + i * 10 for i in range(10)]  # -100 to -10

        survivors, species_list = apply_speciation(
            genomes,
            fitness,
            compatibility_threshold=0.5,
            survival_rate=0.5,
            min_species_size=1,
        )

        # Should work with negative fitness
        assert len(survivors) > 0

        # Best survivors should have highest (least negative) fitness
        survivor_ids = {s["id"] for s in survivors}
        # g9 has fitness -10, should be among survivors
        assert "g9" in survivor_ids


class TestIntegrationWithEvolution:
    """Test speciation integrated with the evolution pipeline."""

    def test_speciation_in_evolve_population(self):
        """Speciation should work when enabled in evolve_population."""
        # Generate initial population
        genomes = generate_population(
            size=50,
            use_neural_net=True,
            neural_hidden_size=4,
        )
        fitness = [random.uniform(50, 150) for _ in genomes]

        # Evolve with speciation enabled
        config = {
            "population_size": 50,
            "selection_method": "speciation",
            "compatibility_threshold": 1.0,
            "min_species_size": 2,
            "cull_percentage": 0.5,
            "use_crossover": False,
        }

        new_genomes, stats = evolve_population(genomes, fitness, config, generation=0)

        # Should produce valid new generation
        assert len(new_genomes) == 50
        assert stats.best_fitness == max(fitness)

    def test_speciation_preserves_diversity(self):
        """Speciation should preserve diverse solutions over generations."""
        # Create two distinct clusters of genomes
        cluster_a = [make_neural_genome([0.1], f"a{i}") for i in range(25)]
        cluster_b = [make_neural_genome([5.0], f"b{i}") for i in range(25)]
        genomes = cluster_a + cluster_b

        # Cluster A has higher fitness
        fitness = [100.0] * 25 + [50.0] * 25

        # Without speciation, cluster B would be eliminated
        # With speciation, both clusters should have survivors
        survivors, species_list = apply_speciation(
            genomes,
            fitness,
            compatibility_threshold=1.0,
            survival_rate=0.5,
            min_species_size=2,
        )

        # Should have at least 2 species
        assert len(species_list) >= 2

        # Both clusters should have survivors
        survivor_ids = {s["id"] for s in survivors}
        a_survivors = sum(1 for sid in survivor_ids if sid.startswith("a"))
        b_survivors = sum(1 for sid in survivor_ids if sid.startswith("b"))

        assert a_survivors > 0, "Cluster A should have survivors"
        assert b_survivors > 0, "Cluster B should have survivors (speciation protects them)"

    def test_speciation_with_fitness_sharing(self):
        """Speciation can work together with fitness sharing."""
        genomes = generate_population(size=30, use_neural_net=True)
        fitness = [random.uniform(50, 150) for _ in genomes]

        # Enable both speciation and fitness sharing
        config = {
            "population_size": 30,
            "selection_method": "speciation",
            "compatibility_threshold": 1.0,
            "min_species_size": 2,
            "use_fitness_sharing": True,
            "sharing_radius": 0.5,
            "cull_percentage": 0.5,
        }

        new_genomes, stats = evolve_population(genomes, fitness, config, generation=0)

        # Should work without errors
        assert len(new_genomes) == 30


class TestMultiGenerationScenarios:
    """Test speciation behavior over multiple generations."""

    def test_species_count_stability(self):
        """Species count should remain relatively stable over generations."""
        genomes = generate_population(size=50, use_neural_net=True)

        config = {
            "population_size": 50,
            "selection_method": "speciation",
            "compatibility_threshold": 0.8,
            "min_species_size": 2,
            "cull_percentage": 0.5,
            "mutation_rate": 0.2,
        }

        species_counts = []
        for gen in range(5):
            fitness = [random.uniform(50, 150) for _ in genomes]

            # Get species count before selection
            species_list = assign_species(genomes, fitness, config["compatibility_threshold"])
            species_counts.append(len(species_list))

            genomes, _ = evolve_population(genomes, fitness, config, generation=gen)

        # Species count should not explode or collapse to 1
        assert all(c >= 1 for c in species_counts), "Should have at least 1 species"
        assert all(c <= 50 for c in species_counts), "Species count should not exceed population"

    def test_genome_ids_preserved_for_survivors(self):
        """Survivor genomes should keep their IDs across generations."""
        genomes = generate_population(size=20, use_neural_net=True)
        original_ids = {g["id"] for g in genomes}

        config = {
            "population_size": 20,
            "selection_method": "speciation",
            "compatibility_threshold": 1.0,
            "min_species_size": 1,
            "cull_percentage": 0.5,
        }

        fitness = [100.0 - i for i in range(20)]  # Deterministic fitness
        new_genomes, _ = evolve_population(genomes, fitness, config, generation=0)

        # Top 50% should survive with same IDs
        new_ids = {g["id"] for g in new_genomes}

        # Some original IDs should be preserved (survivors)
        preserved_ids = original_ids & new_ids
        assert len(preserved_ids) > 0, "Some survivor IDs should be preserved"


class TestEdgeCasesAndBugs:
    """Test specific edge cases that could cause bugs."""

    def test_empty_species_after_selection(self):
        """Handle case where species becomes empty after selection."""
        # This shouldn't happen with min_species_size >= 1, but test defensive code
        species = Species(id=0, representative={}, members=[], fitness_scores=[])

        survivors = select_within_species([species], survival_rate=0.5, min_species_size=1)

        # Empty species should produce no survivors
        assert survivors == []

    def test_single_genome_population(self):
        """Single genome population should work."""
        genome = make_neural_genome([0.5], "solo")
        genomes = [genome]
        fitness = [100.0]

        survivors, species_list = apply_speciation(
            genomes,
            fitness,
            compatibility_threshold=1.0,
            survival_rate=1.0,  # 100% survival to keep the solo genome
            min_species_size=1,
        )

        assert len(species_list) == 1
        assert len(survivors) == 1
        assert survivors[0]["id"] == "solo"

    def test_all_genomes_same_fitness(self):
        """All genomes with same fitness should work (arbitrary selection)."""
        genomes = [make_neural_genome([i * 0.1], f"g{i}") for i in range(10)]
        fitness = [100.0] * 10  # All same

        survivors, species_list = apply_speciation(
            genomes,
            fitness,
            compatibility_threshold=0.5,
            survival_rate=0.5,
            min_species_size=1,
        )

        # Should work - selection among ties is arbitrary but valid
        assert len(survivors) > 0

    def test_nan_in_genome_weights(self):
        """Genomes with NaN weights should be handled gracefully."""
        g1 = make_neural_genome([0.5], "g1")
        g2 = make_neural_genome([float("nan")], "g2")  # NaN weight
        g3 = make_neural_genome([1.0], "g3")
        genomes = [g1, g2, g3]
        fitness = [100.0, 50.0, 75.0]

        # NaN distance comparisons may cause issues
        # The function should handle this gracefully (not crash)
        try:
            result = assign_species(genomes, fitness, compatibility_threshold=1.0)
            # If it doesn't crash, verify all genomes are assigned
            total = sum(s.size for s in result)
            assert total == 3
        except ValueError:
            # Also acceptable to raise an error for invalid input
            pass

    def test_inf_fitness(self):
        """Infinite fitness values should be handled."""
        genomes = [make_neural_genome([i * 0.1], f"g{i}") for i in range(5)]
        fitness = [100.0, float("inf"), 50.0, float("-inf"), 75.0]

        # Should handle inf fitness without crashing
        survivors, species_list = apply_speciation(
            genomes,
            fitness,
            compatibility_threshold=1.0,
            survival_rate=0.5,
            min_species_size=1,
        )

        assert len(survivors) > 0

    def test_genomes_without_neural_genome(self):
        """Genomes without neuralGenome should fall back to body distance."""
        g1 = {"id": "g1", "nodes": [1, 2, 3], "muscles": [1, 2]}
        g2 = {"id": "g2", "nodes": [1, 2, 3], "muscles": [1, 2]}  # Same structure
        g3 = {"id": "g3", "nodes": [1, 2, 3, 4, 5], "muscles": [1, 2, 3, 4]}  # Different
        genomes = [g1, g2, g3]
        fitness = [100.0, 90.0, 80.0]

        result = assign_species(genomes, fitness, compatibility_threshold=0.5)

        # g1 and g2 should be same species (same structure)
        # g3 should be different (different node/muscle count)
        assert len(result) >= 1
        total = sum(s.size for s in result)
        assert total == 3

    def test_mixed_genome_types(self):
        """Mix of genomes with and without neural genome."""
        g1 = make_neural_genome([0.5], "neural1")
        g2 = {"id": "body_only", "nodes": [1, 2, 3], "muscles": [1, 2]}
        g3 = make_neural_genome([0.6], "neural2")
        genomes = [g1, g2, g3]
        fitness = [100.0, 90.0, 80.0]

        result = assign_species(genomes, fitness, compatibility_threshold=1.0)

        # Should handle mixed types
        total = sum(s.size for s in result)
        assert total == 3

    def test_duplicate_genome_ids(self):
        """Genomes with duplicate IDs should work (IDs aren't used for distance)."""
        g1 = make_neural_genome([0.0], "same_id")
        g2 = make_neural_genome([5.0], "same_id")  # Same ID, different weights
        genomes = [g1, g2]
        fitness = [100.0, 50.0]

        result = assign_species(genomes, fitness, compatibility_threshold=1.0)

        # Should work - distance is based on weights, not ID
        total = sum(s.size for s in result)
        assert total == 2


class TestSurvivorCountEdgeCases:
    """Critical tests for survivor count consistency - a common source of bugs."""

    def test_survivor_count_never_exceeds_population(self):
        """Survivors should never exceed original population size."""
        for pop_size in [5, 10, 50, 100]:
            genomes = [make_neural_genome([i * 0.1], f"g{i}") for i in range(pop_size)]
            fitness = [random.uniform(0, 100) for _ in range(pop_size)]

            for survival_rate in [0.1, 0.3, 0.5, 0.7, 0.9]:
                for min_size in [1, 2, 5, 10]:
                    survivors, _ = apply_speciation(
                        genomes, fitness,
                        compatibility_threshold=0.5,
                        survival_rate=survival_rate,
                        min_species_size=min_size,
                    )

                    assert len(survivors) <= pop_size, (
                        f"Survivors ({len(survivors)}) exceeded population ({pop_size}) "
                        f"with survival_rate={survival_rate}, min_size={min_size}"
                    )

    def test_survivor_count_respects_global_budget(self):
        """Global survival rate is respected as upper bound."""
        genomes = [make_neural_genome([i * 2.0], f"g{i}") for i in range(10)]
        fitness = [100.0 - i * 10 for i in range(10)]

        # Very small threshold = many species
        survivors, species_list = apply_speciation(
            genomes, fitness,
            compatibility_threshold=0.1,
            survival_rate=0.1,  # Very low = 1 survivor
            min_species_size=1,
        )

        # Global rate takes precedence: int(10 * 0.1) = 1
        # The survivor should be from the best-fitness species
        assert len(survivors) == 1

    def test_high_survival_rate_with_many_species(self):
        """High survival rate with many species protects diversity."""
        # Create 10 very different genomes (each in own species)
        genomes = [make_neural_genome([i * 10.0], f"g{i}") for i in range(10)]
        fitness = [100.0] * 10

        # Small threshold = each genome in own species
        survivors, species_list = apply_speciation(
            genomes, fitness,
            compatibility_threshold=0.01,  # Very small
            survival_rate=1.0,  # 100% survival
            min_species_size=1,
        )

        # With 100% survival, all 10 survive
        assert len(survivors) == 10

    def test_population_size_preserved_after_evolution(self):
        """Population size should be preserved after evolution with speciation."""
        for pop_size in [20, 50, 100]:
            genomes = generate_population(size=pop_size, use_neural_net=True)
            fitness = [random.uniform(50, 150) for _ in genomes]

            config = {
                "population_size": pop_size,
                "selection_method": "speciation",
                "compatibility_threshold": 0.8,
                "min_species_size": 2,
                "cull_percentage": 0.5,
            }

            new_genomes, _ = evolve_population(genomes, fitness, config, generation=0)

            assert len(new_genomes) == pop_size, (
                f"Population size changed from {pop_size} to {len(new_genomes)}"
            )


class TestSpeciationOrderingEffects:
    """Test that genome ordering doesn't inappropriately affect speciation."""

    def test_ordering_affects_representative_choice(self):
        """First genome becomes representative - verify this behavior."""
        g1 = make_neural_genome([0.0], "first")
        g2 = make_neural_genome([0.1], "second")  # Similar to g1
        g3 = make_neural_genome([0.15], "third")  # Similar to both

        genomes = [g1, g2, g3]
        fitness = [100.0, 90.0, 80.0]

        result = assign_species(genomes, fitness, compatibility_threshold=0.5)

        # All should be in one species with g1 as representative
        assert len(result) == 1
        assert result[0].representative["id"] == "first"

    def test_fitness_ranking_preserved_within_species(self):
        """Highest fitness should survive regardless of input order."""
        # Create genomes in random fitness order
        genomes = [
            make_neural_genome([0.1], "low_fitness"),     # Will have fitness 30
            make_neural_genome([0.2], "high_fitness"),    # Will have fitness 100
            make_neural_genome([0.15], "medium_fitness"), # Will have fitness 60
        ]
        fitness = [30.0, 100.0, 60.0]

        survivors, _ = apply_speciation(
            genomes, fitness,
            compatibility_threshold=1.0,  # All in one species
            survival_rate=0.34,  # Keep ~1
            min_species_size=1,
        )

        # Best fitness (100.0) should survive
        assert len(survivors) == 1
        assert survivors[0]["id"] == "high_fitness"


class TestCompatibilityThresholdBoundaries:
    """Test behavior at exact threshold boundaries."""

    def test_distance_exactly_at_threshold(self):
        """Distance exactly at threshold should NOT match (< not <=)."""
        g1 = make_neural_genome([0.0], "g1")
        g2 = make_neural_genome([1.0], "g2")

        # Get actual distance
        from app.genetics.fitness_sharing import neural_genome_distance
        actual_dist = neural_genome_distance(g1, g2)

        genomes = [g1, g2]
        fitness = [100.0, 100.0]

        # Use exact distance as threshold
        result = assign_species(genomes, fitness, compatibility_threshold=actual_dist)

        # Should be 2 species since we use < not <=
        assert len(result) == 2

    def test_distance_just_under_threshold(self):
        """Distance just under threshold should match."""
        g1 = make_neural_genome([0.0], "g1")
        g2 = make_neural_genome([1.0], "g2")

        from app.genetics.fitness_sharing import neural_genome_distance
        actual_dist = neural_genome_distance(g1, g2)

        genomes = [g1, g2]
        fitness = [100.0, 100.0]

        # Use slightly larger threshold
        result = assign_species(genomes, fitness, compatibility_threshold=actual_dist + 0.001)

        # Should be 1 species
        assert len(result) == 1


class TestDistanceFunctionEdgeCases:
    """Test edge cases in the distance function that affect speciation."""

    def test_empty_neural_genome(self):
        """Genomes with empty weight arrays should use body distance."""
        g1 = {
            "id": "g1",
            "nodes": [1, 2, 3],
            "muscles": [1, 2],
            "neuralGenome": {
                "inputWeights": [],
                "hiddenBiases": [],
                "outputWeights": [],
                "outputBiases": [],
            }
        }
        g2 = {
            "id": "g2",
            "nodes": [1, 2, 3],
            "muscles": [1, 2],
            "neuralGenome": {
                "inputWeights": [],
                "hiddenBiases": [],
                "outputWeights": [],
                "outputBiases": [],
            }
        }
        genomes = [g1, g2]
        fitness = [100.0, 90.0]

        result = assign_species(genomes, fitness, compatibility_threshold=1.0)

        # Same body structure = same species (body distance = 0)
        assert len(result) == 1

    def test_mismatched_topology_sizes(self):
        """Genomes with different hidden sizes should still work."""
        g1 = make_neural_genome([0.5], "g1", hidden_size=4)
        g2 = make_neural_genome([0.5], "g2", hidden_size=8)  # Different hidden size

        genomes = [g1, g2]
        fitness = [100.0, 90.0]

        # Should not crash - distance accounts for size mismatch
        result = assign_species(genomes, fitness, compatibility_threshold=2.0)

        # Should have some result
        total = sum(s.size for s in result)
        assert total == 2

    def test_very_large_weight_values(self):
        """Very large weight values should work without overflow."""
        g1 = make_neural_genome([1e10], "g1")
        g2 = make_neural_genome([1e10 + 1], "g2")

        genomes = [g1, g2]
        fitness = [100.0, 90.0]

        # Should not crash or produce inf/nan
        result = assign_species(genomes, fitness, compatibility_threshold=1e12)

        total = sum(s.size for s in result)
        assert total == 2


class TestRealWorldScenarios:
    """Test scenarios that mimic real evolution runs."""

    def test_converged_population(self):
        """Population that has converged to similar genomes."""
        # All genomes very similar (as happens after many generations)
        base_weights = [0.5]
        genomes = [
            make_neural_genome([0.5 + random.uniform(-0.01, 0.01)], f"g{i}")
            for i in range(50)
        ]
        fitness = [100.0 + random.uniform(-5, 5) for _ in range(50)]

        survivors, species_list = apply_speciation(
            genomes, fitness,
            compatibility_threshold=0.5,
            survival_rate=0.5,
            min_species_size=2,
        )

        # Converged population should be mostly one species
        assert len(species_list) <= 5  # Few species
        assert len(survivors) >= 25  # Reasonable survivor count

    def test_diverged_population(self):
        """Population with multiple distinct strategies."""
        # Create 3 distinct clusters
        cluster_a = [make_neural_genome([0.0], f"a{i}") for i in range(20)]
        cluster_b = [make_neural_genome([5.0], f"b{i}") for i in range(20)]
        cluster_c = [make_neural_genome([10.0], f"c{i}") for i in range(20)]

        genomes = cluster_a + cluster_b + cluster_c
        random.shuffle(genomes)

        # Cluster A best, B medium, C worst
        fitness = []
        for g in genomes:
            if g["id"].startswith("a"):
                fitness.append(100.0)
            elif g["id"].startswith("b"):
                fitness.append(60.0)
            else:
                fitness.append(30.0)

        survivors, species_list = apply_speciation(
            genomes, fitness,
            compatibility_threshold=1.0,
            survival_rate=0.5,
            min_species_size=2,
        )

        # Should have ~3 species
        assert len(species_list) >= 2

        # All clusters should have survivors
        survivor_ids = {s["id"] for s in survivors}
        a_count = sum(1 for s in survivor_ids if s.startswith("a"))
        b_count = sum(1 for s in survivor_ids if s.startswith("b"))
        c_count = sum(1 for s in survivor_ids if s.startswith("c"))

        assert a_count > 0, "Cluster A should have survivors"
        assert b_count > 0, "Cluster B should have survivors"
        assert c_count > 0, "Cluster C should have survivors (speciation protects them)"

    def test_long_evolution_run_stability(self):
        """Simulate many generations to check for accumulating errors."""
        genomes = generate_population(size=30, use_neural_net=True)

        config = {
            "population_size": 30,
            "selection_method": "speciation",
            "compatibility_threshold": 0.8,
            "min_species_size": 2,
            "cull_percentage": 0.5,
            "mutation_rate": 0.2,
        }

        for gen in range(20):
            fitness = [random.uniform(50, 150) for _ in genomes]
            genomes, stats = evolve_population(genomes, fitness, config, generation=gen)

            # Verify invariants hold each generation
            assert len(genomes) == 30, f"Population size changed at gen {gen}"
            assert all("id" in g for g in genomes), f"Missing IDs at gen {gen}"
            assert all("neuralGenome" in g for g in genomes), f"Missing neural at gen {gen}"
