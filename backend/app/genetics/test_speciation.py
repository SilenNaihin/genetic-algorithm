"""Tests for speciation module."""

import pytest

from app.genetics.speciation import (
    Species,
    assign_species,
    select_within_species,
    apply_speciation,
    get_species_stats,
)


def make_genome(weights: list[list[float]], genome_id: str = "test") -> dict:
    """Helper to create a genome with specific neural weights."""
    return {
        "id": genome_id,
        "neuralGenome": {
            "inputWeights": weights,
            "hiddenBiases": [0.0],
            "outputWeights": [[0.5]],
            "outputBiases": [-0.5],
        },
    }


class TestSpeciesDataclass:
    """Tests for Species dataclass."""

    def test_species_size(self):
        """Species size should equal member count."""
        species = Species(id=0, representative={})
        assert species.size == 0

        species.members = [{}, {}, {}]
        assert species.size == 3

    def test_species_avg_fitness(self):
        """Average fitness calculation."""
        species = Species(id=0, representative={})
        assert species.avg_fitness == 0.0

        species.fitness_scores = [100.0, 200.0, 300.0]
        assert species.avg_fitness == 200.0

    def test_species_max_fitness(self):
        """Max fitness calculation."""
        species = Species(id=0, representative={})
        assert species.max_fitness == 0.0

        species.fitness_scores = [50.0, 150.0, 100.0]
        assert species.max_fitness == 150.0


class TestAssignSpecies:
    """Tests for assign_species function."""

    def test_empty_population(self):
        """Empty population should return empty species list."""
        result = assign_species([], [], compatibility_threshold=1.0)
        assert result == []

    def test_single_genome_creates_one_species(self):
        """Single genome should create one species."""
        genome = make_genome([[0.5, 0.5]])
        result = assign_species([genome], [100.0], compatibility_threshold=1.0)

        assert len(result) == 1
        assert result[0].size == 1
        assert result[0].members[0] == genome

    def test_identical_genomes_same_species(self):
        """Identical genomes should be in the same species."""
        genome = make_genome([[0.5, 0.5]])
        genomes = [genome, genome, genome]
        fitness = [100.0, 90.0, 80.0]

        result = assign_species(genomes, fitness, compatibility_threshold=0.5)

        assert len(result) == 1
        assert result[0].size == 3

    def test_different_genomes_different_species(self):
        """Very different genomes should be in different species."""
        genome1 = make_genome([[0.0, 0.0]], "g1")
        genome2 = make_genome([[5.0, 5.0]], "g2")  # Far apart
        genomes = [genome1, genome2]
        fitness = [100.0, 100.0]

        # Small threshold ensures they're separate
        result = assign_species(genomes, fitness, compatibility_threshold=0.1)

        assert len(result) == 2
        assert result[0].size == 1
        assert result[1].size == 1

    def test_threshold_determines_grouping(self):
        """Compatibility threshold controls species membership."""
        genome1 = make_genome([[0.0, 0.0]], "g1")
        genome2 = make_genome([[0.3, 0.3]], "g2")  # Close
        genome3 = make_genome([[2.0, 2.0]], "g3")  # Far
        genomes = [genome1, genome2, genome3]
        fitness = [100.0, 100.0, 100.0]

        # Large threshold: all in one species
        result_large = assign_species(genomes, fitness, compatibility_threshold=5.0)
        assert len(result_large) == 1

        # Small threshold: all separate
        result_small = assign_species(genomes, fitness, compatibility_threshold=0.01)
        assert len(result_small) == 3

    def test_length_mismatch_raises(self):
        """Mismatched genome/fitness lengths should raise error."""
        genomes = [make_genome([[0.5]])]
        fitness = [100.0, 200.0]

        with pytest.raises(ValueError):
            assign_species(genomes, fitness, compatibility_threshold=1.0)


class TestSelectWithinSpecies:
    """Tests for select_within_species function."""

    def test_empty_species_list(self):
        """Empty species list should return empty survivors."""
        result = select_within_species([], survival_rate=0.5, min_species_size=1)
        assert result == []

    def test_single_member_species_survives(self):
        """Single member species keeps its member with min_species_size=1."""
        genome = make_genome([[0.5]])
        species = Species(
            id=0,
            representative=genome,
            members=[genome],
            fitness_scores=[100.0],
        )

        result = select_within_species([species], survival_rate=0.5, min_species_size=1)

        assert len(result) == 1
        assert result[0] == genome

    def test_survival_rate_respected(self):
        """Survival rate determines how many survive."""
        genomes = [make_genome([[i * 0.1]]) for i in range(10)]
        fitness = list(range(100, 0, -10))  # 100, 90, 80, ... 10

        species = Species(
            id=0,
            representative=genomes[0],
            members=genomes,
            fitness_scores=fitness,
        )

        # 50% survival rate, min_species_size=1
        result = select_within_species([species], survival_rate=0.5, min_species_size=1)

        assert len(result) == 5  # Half of 10

    def test_min_species_size_respected(self):
        """Minimum species size prevents extinction."""
        genomes = [make_genome([[i * 0.1]]) for i in range(5)]
        fitness = list(range(100, 50, -10))  # 100, 90, 80, 70, 60

        species = Species(
            id=0,
            representative=genomes[0],
            members=genomes,
            fitness_scores=fitness,
        )

        # 10% survival = 0.5 → would be 0, but min_species_size=2
        result = select_within_species([species], survival_rate=0.1, min_species_size=2)

        assert len(result) == 2

    def test_best_fitness_survives(self):
        """Higher fitness members should survive."""
        g1 = make_genome([[0.1]], "g1")
        g2 = make_genome([[0.2]], "g2")
        g3 = make_genome([[0.3]], "g3")

        species = Species(
            id=0,
            representative=g1,
            members=[g1, g2, g3],
            fitness_scores=[50.0, 100.0, 75.0],  # g2 is best
        )

        result = select_within_species([species], survival_rate=0.33, min_species_size=1)

        assert len(result) == 1
        assert result[0]["id"] == "g2"  # Best fitness survives

    def test_multiple_species_combined(self):
        """Survivors from all species are combined."""
        g1 = make_genome([[0.1]], "g1")
        g2 = make_genome([[0.2]], "g2")
        g3 = make_genome([[0.3]], "g3")
        g4 = make_genome([[0.4]], "g4")

        species1 = Species(
            id=0,
            representative=g1,
            members=[g1, g2],
            fitness_scores=[100.0, 50.0],
        )
        species2 = Species(
            id=1,
            representative=g3,
            members=[g3, g4],
            fitness_scores=[90.0, 80.0],
        )

        result = select_within_species(
            [species1, species2],
            survival_rate=0.5,
            min_species_size=1,
        )

        # 1 from each species
        assert len(result) == 2


class TestApplySpeciation:
    """Tests for apply_speciation function."""

    def test_full_pipeline(self):
        """Test the full speciation pipeline."""
        g1 = make_genome([[0.0, 0.0]], "g1")
        g2 = make_genome([[0.1, 0.1]], "g2")  # Similar to g1
        g3 = make_genome([[5.0, 5.0]], "g3")  # Different
        g4 = make_genome([[5.1, 5.1]], "g4")  # Similar to g3

        genomes = [g1, g2, g3, g4]
        fitness = [100.0, 90.0, 80.0, 70.0]

        survivors, species_list = apply_speciation(
            genomes,
            fitness,
            compatibility_threshold=0.5,
            survival_rate=0.5,
            min_species_size=1,
        )

        # Should have 2 species
        assert len(species_list) == 2

        # Each species keeps 1 (50% of 2)
        assert len(survivors) == 2

    def test_protects_diverse_solutions(self):
        """
        Speciation should protect diverse solutions that would be
        outcompeted in global selection.
        """
        # 3 high-fitness similar genomes
        g1 = make_genome([[0.5]], "high1")
        g2 = make_genome([[0.5]], "high2")
        g3 = make_genome([[0.5]], "high3")

        # 1 lower-fitness but unique genome
        g_unique = make_genome([[5.0]], "unique")

        genomes = [g1, g2, g3, g_unique]
        fitness = [100.0, 95.0, 90.0, 60.0]  # Unique has lowest fitness

        # Global selection (50%) would kill unique (fitness 60)
        # But speciation protects it in its own species

        survivors, species_list = apply_speciation(
            genomes,
            fitness,
            compatibility_threshold=0.5,
            survival_rate=0.5,
            min_species_size=1,
        )

        # Should have 2 species
        assert len(species_list) == 2

        # Unique should survive as the sole member of its species
        survivor_ids = [s["id"] for s in survivors]
        assert "unique" in survivor_ids


class TestGetSpeciesStats:
    """Tests for get_species_stats function."""

    def test_empty_species_list(self):
        """Empty list should return zero stats."""
        stats = get_species_stats([])

        assert stats["species_count"] == 0
        assert stats["avg_species_size"] == 0
        assert stats["species_sizes"] == []

    def test_single_species(self):
        """Single species stats."""
        species = Species(
            id=0,
            representative={},
            members=[{}, {}, {}],
            fitness_scores=[100.0, 90.0, 80.0],
        )

        stats = get_species_stats([species])

        assert stats["species_count"] == 1
        assert stats["avg_species_size"] == 3
        assert stats["max_species_size"] == 3
        assert stats["min_species_size"] == 3
        assert stats["species_sizes"] == [3]

    def test_multiple_species(self):
        """Multiple species stats."""
        s1 = Species(id=0, representative={}, members=[{}] * 5)
        s2 = Species(id=1, representative={}, members=[{}] * 3)
        s3 = Species(id=2, representative={}, members=[{}] * 2)

        stats = get_species_stats([s1, s2, s3])

        assert stats["species_count"] == 3
        assert stats["avg_species_size"] == pytest.approx(10 / 3)
        assert stats["max_species_size"] == 5
        assert stats["min_species_size"] == 2
        assert stats["species_sizes"] == [5, 3, 2]


class TestPluggableDistanceFunction:
    """Tests for custom distance functions (NEAT support)."""

    def test_custom_distance_function(self):
        """Custom distance function should be used instead of default."""
        g1 = {"id": "g1", "custom_value": 0}
        g2 = {"id": "g2", "custom_value": 10}
        g3 = {"id": "g3", "custom_value": 100}
        genomes = [g1, g2, g3]
        fitness = [100.0, 90.0, 80.0]

        # Custom distance based on custom_value field
        def custom_distance(a: dict, b: dict) -> float:
            return abs(a.get("custom_value", 0) - b.get("custom_value", 0))

        # With threshold 20, g1 and g2 should be same species, g3 different
        result = assign_species(
            genomes, fitness, compatibility_threshold=20.0, distance_fn=custom_distance
        )

        assert len(result) == 2
        # First species should have g1 and g2
        assert len(result[0].members) == 2
        # Second species should have g3
        assert len(result[1].members) == 1

    def test_distance_function_passthrough_in_apply_speciation(self):
        """apply_speciation should pass distance_fn to assign_species."""
        g1 = {"id": "g1", "group": "A"}
        g2 = {"id": "g2", "group": "A"}
        g3 = {"id": "g3", "group": "B"}
        genomes = [g1, g2, g3]
        fitness = [100.0, 90.0, 80.0]

        # Custom distance: 0 if same group, 100 if different
        def group_distance(a: dict, b: dict) -> float:
            return 0.0 if a.get("group") == b.get("group") else 100.0

        survivors, species_list = apply_speciation(
            genomes,
            fitness,
            compatibility_threshold=50.0,
            survival_rate=0.5,
            min_species_size=1,
            distance_fn=group_distance,
        )

        # Should have 2 species: A and B
        assert len(species_list) == 2

    def test_none_distance_fn_uses_default(self):
        """Passing None should use neural_genome_distance."""
        genome = make_genome([[0.5, 0.5]])
        genomes = [genome, genome]
        fitness = [100.0, 90.0]

        # Should work and put identical genomes in same species
        result = assign_species(
            genomes, fitness, compatibility_threshold=1.0, distance_fn=None
        )

        assert len(result) == 1
        assert len(result[0].members) == 2
