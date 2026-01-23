"""
Tests for survival streak tracking in evolution.

These tests verify:
1. Survivors get their survivalStreak incremented
2. New offspring start with survivalStreak = 0
3. SurvivalStreak persists correctly through multiple generations
"""

import pytest

from app.genetics.population import (
    generate_random_genome,
    generate_population,
    evolve_population,
    EvolutionConfig,
)


class TestSurvivalStreakInitialization:
    """Test initial survivalStreak values."""

    def test_new_genome_has_zero_streak(self):
        """Newly generated genomes should have survivalStreak = 0."""
        genome = generate_random_genome(use_neural_net=False)
        assert genome.get('survivalStreak', -1) == 0, \
            f"New genome should have survivalStreak=0, got {genome.get('survivalStreak')}"

    def test_population_all_zero_streak(self):
        """All genomes in initial population should have survivalStreak = 0."""
        population = generate_population(10, use_neural_net=False)

        for i, genome in enumerate(population):
            streak = genome.get('survivalStreak', -1)
            assert streak == 0, f"Genome {i} should have survivalStreak=0, got {streak}"


class TestSurvivalStreakEvolution:
    """Test survivalStreak updates during evolution."""

    def test_survivors_get_streak_incremented(self):
        """Survivors should have their survivalStreak incremented by 1."""
        # Create initial population
        population = generate_population(10, use_neural_net=False)

        # Assign fitness scores - top 5 will survive (cull_percentage=0.5)
        # Higher fitness = more likely to survive
        fitness_scores = [100 - i * 10 for i in range(10)]  # [100, 90, 80, ...]

        config = EvolutionConfig(
            population_size=10,
            cull_percentage=0.5,  # Kill bottom 50%
            use_mutation=True,
            use_crossover=False,
        )

        # Evolve
        new_genomes, _ = evolve_population(population, fitness_scores, config, generation=0)

        # Check that top performers survived with incremented streak
        # The survivors should be the ones with highest fitness (top 5)
        survivor_ids = {g['id'] for g in population[:5]}  # Top 5 survivors

        survivors_in_new = [g for g in new_genomes if g['id'] in survivor_ids]

        for genome in survivors_in_new:
            streak = genome.get('survivalStreak', 0)
            assert streak == 1, f"Survivor should have survivalStreak=1, got {streak}"

    def test_offspring_start_with_zero_streak(self):
        """New offspring from mutation/crossover should have survivalStreak = 0."""
        population = generate_population(10, use_neural_net=False)
        fitness_scores = [100 - i * 10 for i in range(10)]

        config = EvolutionConfig(
            population_size=10,
            cull_percentage=0.5,
            use_mutation=True,
            use_crossover=True,
        )

        new_genomes, _ = evolve_population(population, fitness_scores, config, generation=0)

        # Get original IDs (survivors keep their IDs, offspring get new IDs)
        original_ids = {g['id'] for g in population}

        # Find offspring (new genomes not in original population)
        offspring = [g for g in new_genomes if g['id'] not in original_ids]

        # Should have 5 offspring (to replace culled 50%)
        assert len(offspring) == 5, f"Expected 5 offspring, got {len(offspring)}"

        for genome in offspring:
            streak = genome.get('survivalStreak', -1)
            assert streak == 0, f"Offspring should have survivalStreak=0, got {streak}"

    def test_streak_accumulates_over_generations(self):
        """SurvivalStreak should accumulate for creatures that survive multiple generations."""
        population = generate_population(10, use_neural_net=False)

        config = EvolutionConfig(
            population_size=10,
            cull_percentage=0.5,
            use_mutation=True,
            use_crossover=False,
        )

        # Give consistent high fitness to first creature so it survives
        current_genomes = population

        for gen in range(3):
            # Always give first creature highest fitness
            fitness_scores = [0.0] * 10
            first_id = population[0]['id']

            for i, genome in enumerate(current_genomes):
                if genome['id'] == first_id or (gen > 0 and genome['survivalStreak'] > 0):
                    fitness_scores[i] = 100 + genome.get('survivalStreak', 0) * 10
                else:
                    fitness_scores[i] = 50 - i

            current_genomes, _ = evolve_population(
                current_genomes, fitness_scores, config, generation=gen
            )

        # Find the original first creature
        first_creature = next((g for g in current_genomes if g['id'] == first_id), None)

        if first_creature:
            streak = first_creature.get('survivalStreak', 0)
            assert streak == 3, f"Creature that survived 3 gens should have streak=3, got {streak}"

    def test_max_streak_in_population(self):
        """After evolution, max survivalStreak should match generations survived."""
        population = generate_population(20, use_neural_net=False)

        config = EvolutionConfig(
            population_size=20,
            cull_percentage=0.5,
            use_mutation=True,
            use_crossover=False,
        )

        current_genomes = population
        num_generations = 5

        for gen in range(num_generations):
            # Give random but consistent fitness based on ID hash
            # This way some creatures will consistently survive
            fitness_scores = [
                hash(g['id']) % 1000
                for g in current_genomes
            ]

            current_genomes, _ = evolve_population(
                current_genomes, fitness_scores, config, generation=gen
            )

        # Find max survivalStreak
        max_streak = max(g.get('survivalStreak', 0) for g in current_genomes)

        # Max possible streak is num_generations (creature that survived every gen)
        assert max_streak <= num_generations, \
            f"Max streak {max_streak} exceeds generations {num_generations}"

        # At least one creature should have survived at least 1 generation
        assert max_streak >= 1, "No survivors after 5 generations - something is wrong"


class TestSurvivalStreakFieldExists:
    """Test that survivalStreak field is always present."""

    def test_survival_streak_in_generated_genome(self):
        """Generated genomes must have survivalStreak field."""
        genome = generate_random_genome(use_neural_net=False)
        assert 'survivalStreak' in genome, "Generated genome missing survivalStreak field"

    def test_survival_streak_in_evolved_genome(self):
        """Evolved genomes must have survivalStreak field."""
        population = generate_population(10, use_neural_net=False)
        fitness_scores = [i for i in range(10)]

        config = EvolutionConfig(
            population_size=10,
            cull_percentage=0.5,
        )

        new_genomes, _ = evolve_population(population, fitness_scores, config, generation=0)

        for genome in new_genomes:
            assert 'survivalStreak' in genome, "Evolved genome missing survivalStreak field"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
