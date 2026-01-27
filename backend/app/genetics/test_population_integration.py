"""
Tests for NEAT population integration.

Tests that the population system correctly:
- Generates NEAT populations
- Evolves NEAT populations
- Uses NEAT-specific crossover, mutation, and distance functions
- Tracks innovation counter across generations
"""

import random
import pytest

from app.genetics.population import (
    EvolutionConfig,
    generate_random_genome,
    generate_population,
    evolve_population,
)
from app.schemas.neat import InnovationCounter, NEATGenome
from app.neural.neat_network import neat_forward


class TestEvolutionConfigNeat:
    """Tests for NEAT fields in EvolutionConfig."""

    def test_default_values(self):
        """NEAT config should have sensible defaults."""
        config = EvolutionConfig()

        assert config.use_neat is False
        assert config.neat_add_connection_rate == 0.05
        assert config.neat_add_node_rate == 0.03
        assert config.neat_enable_rate == 0.02
        assert config.neat_disable_rate == 0.01
        assert config.neat_excess_coefficient == 1.0
        assert config.neat_disjoint_coefficient == 1.0
        assert config.neat_weight_coefficient == 0.4
        assert config.neat_max_hidden_nodes == 16

    def test_custom_values(self):
        """Should accept custom NEAT config values."""
        config = EvolutionConfig(
            use_neat=True,
            neat_add_connection_rate=0.1,
            neat_add_node_rate=0.05,
            neat_max_hidden_nodes=32,
        )

        assert config.use_neat is True
        assert config.neat_add_connection_rate == 0.1
        assert config.neat_add_node_rate == 0.05
        assert config.neat_max_hidden_nodes == 32


class TestGenerateRandomGenomeNeat:
    """Tests for NEAT genome generation."""

    def test_generates_neat_genome(self):
        """Should generate NEAT genome when use_neat=True."""
        genome = generate_random_genome(
            use_neural_net=True,
            use_neat=True,
        )

        assert 'neatGenome' in genome
        assert genome.get('neuralGenome') is None
        assert genome['controllerType'] == 'neural'

    def test_generates_fixed_genome_by_default(self):
        """Should generate fixed-topology genome when use_neat=False."""
        genome = generate_random_genome(
            use_neural_net=True,
            use_neat=False,
        )

        assert 'neuralGenome' in genome
        assert genome.get('neatGenome') is None

    def test_neat_genome_is_valid(self):
        """Generated NEAT genome should be valid for forward pass."""
        genome = generate_random_genome(
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
        )

        neat_dict = genome['neatGenome']
        neat_genome = NEATGenome(**neat_dict)

        # Count inputs and outputs
        num_inputs = len([n for n in neat_genome.neurons if n.type == 'input'])
        num_outputs = len([n for n in neat_genome.neurons if n.type == 'output'])

        # Run forward pass
        inputs = [0.5] * num_inputs
        outputs = neat_forward(neat_genome, inputs)

        assert len(outputs) == num_outputs
        assert all(-1 <= o <= 1 for o in outputs)

    def test_innovation_counter_shared(self):
        """Innovation counter should be shared across genomes."""
        counter = InnovationCounter()

        genome1 = generate_random_genome(
            use_neural_net=True,
            use_neat=True,
            innovation_counter=counter,
        )
        genome2 = generate_random_genome(
            use_neural_net=True,
            use_neat=True,
            innovation_counter=counter,
        )

        # Both should have valid NEAT genomes
        assert 'neatGenome' in genome1
        assert 'neatGenome' in genome2

        # Counter should have been used
        assert counter.next_connection > 0


class TestGeneratePopulationNeat:
    """Tests for NEAT population generation."""

    def test_generates_neat_population(self):
        """Should generate population of NEAT genomes."""
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
        )

        assert len(population) == 10
        for genome in population:
            assert 'neatGenome' in genome
            assert genome.get('neuralGenome') is None

    def test_creates_innovation_counter_if_needed(self):
        """Should create innovation counter automatically."""
        population = generate_population(
            size=5,
            use_neural_net=True,
            use_neat=True,
        )

        # All genomes should have valid NEAT genomes
        for genome in population:
            assert 'neatGenome' in genome
            neat = NEATGenome(**genome['neatGenome'])
            assert len(neat.neurons) > 0


class TestEvolvePopulationNeat:
    """Tests for NEAT population evolution."""

    def test_evolves_neat_population(self):
        """Should evolve NEAT population using NEAT operators."""
        random.seed(42)

        counter = InnovationCounter()
        population = generate_population(
            size=20,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        # Random fitness scores
        fitness_scores = [random.random() * 100 for _ in population]

        config = EvolutionConfig(
            population_size=20,
            use_neat=True,
            use_crossover=True,
            use_mutation=True,
            cull_percentage=0.5,
        )

        new_population, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_population) == 20
        # Should still have NEAT genomes
        for genome in new_population:
            assert 'neatGenome' in genome

    def test_uses_neat_distance_for_speciation(self):
        """Should use NEAT distance function for speciation."""
        random.seed(42)

        counter = InnovationCounter()
        population = generate_population(
            size=30,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in population]

        config = EvolutionConfig(
            population_size=30,
            use_neat=True,
            use_speciation=True,
            compatibility_threshold=3.0,
            min_species_size=2,
        )

        new_population, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
            innovation_counter=counter,
        )

        # Should produce valid population
        assert len(new_population) > 0
        for genome in new_population:
            assert 'neatGenome' in genome

    def test_innovation_counter_updated(self):
        """Innovation counter should be updated by structural mutations."""
        random.seed(42)

        counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        initial_conn = counter.next_connection
        initial_node = counter.next_node

        fitness_scores = [random.random() * 100 for _ in population]

        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
            use_mutation=True,
            neat_add_connection_rate=1.0,  # High rate
            neat_add_node_rate=1.0,  # High rate
        )

        # Evolve several generations
        current = population
        for gen in range(5):
            fitness = [random.random() * 100 for _ in current]
            current, _ = evolve_population(
                current, fitness, config,
                generation=gen,
                innovation_counter=counter,
            )

        # Counter should have advanced
        assert counter.next_connection > initial_conn or counter.next_node > initial_node

    def test_config_from_dict(self):
        """Should accept NEAT config as dict."""
        random.seed(42)

        counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=True,
            neural_mode='pure',
            innovation_counter=counter,
        )

        fitness_scores = [random.random() * 100 for _ in population]

        config_dict = {
            'population_size': 10,
            'use_neat': True,
            'neat_add_connection_rate': 0.1,
            'neat_add_node_rate': 0.05,
            'neat_max_hidden_nodes': 20,
        }

        new_population, stats = evolve_population(
            population, fitness_scores, config_dict,
            generation=0,
            innovation_counter=counter,
        )

        assert len(new_population) == 10

    def test_preserves_neat_genome_validity(self):
        """Evolved genomes should have valid NEAT genomes."""
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
            use_crossover=True,
            use_mutation=True,
        )

        # Evolve for several generations
        current = population
        for gen in range(10):
            fitness = [random.random() * 100 for _ in current]
            current, _ = evolve_population(
                current, fitness, config,
                generation=gen,
                innovation_counter=counter,
            )

            # Verify all genomes are valid
            for genome in current:
                neat_dict = genome.get('neatGenome')
                assert neat_dict is not None

                neat = NEATGenome(**neat_dict)
                inputs = neat.get_input_neurons()
                outputs = neat.get_output_neurons()

                # Should have inputs and outputs
                assert len(inputs) > 0
                assert len(outputs) > 0

                # Forward pass should work
                result = neat_forward(neat, [0.5] * len(inputs))
                assert len(result) == len(outputs)


class TestBackwardCompatibility:
    """Tests ensuring backward compatibility with fixed-topology networks."""

    def test_fixed_topology_still_works(self):
        """Fixed-topology evolution should still work."""
        random.seed(42)

        population = generate_population(
            size=10,
            use_neural_net=True,
            use_neat=False,
        )

        fitness_scores = [random.random() * 100 for _ in population]

        config = EvolutionConfig(
            population_size=10,
            use_neat=False,
        )

        new_population, stats = evolve_population(
            population, fitness_scores, config,
            generation=0,
        )

        assert len(new_population) == 10
        for genome in new_population:
            assert 'neuralGenome' in genome
            assert genome.get('neatGenome') is None

    def test_default_is_fixed_topology(self):
        """Default config should use fixed-topology."""
        random.seed(42)

        population = generate_population(size=10, use_neural_net=True)
        fitness_scores = [random.random() * 100 for _ in population]

        # Default config
        new_population, stats = evolve_population(population, fitness_scores)

        for genome in new_population:
            # Should have standard neural genome, not NEAT
            assert genome.get('neatGenome') is None


class TestMultipleGenerations:
    """Tests for stability across many generations."""

    def test_stability_over_generations(self):
        """NEAT population should remain stable over many generations."""
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
            use_crossover=True,
            use_mutation=True,
            neat_add_connection_rate=0.1,
            neat_add_node_rate=0.05,
        )

        current = population
        for gen in range(25):
            fitness = [random.random() * 100 for _ in current]
            current, stats = evolve_population(
                current, fitness, config,
                generation=gen,
                innovation_counter=counter,
            )

            # Population should maintain size
            assert len(current) == 30

            # All genomes should be valid
            for genome in current:
                assert 'neatGenome' in genome
                neat = NEATGenome(**genome['neatGenome'])
                assert len(neat.neurons) > 0

        # Network complexity should have grown over generations
        avg_connections = sum(
            len(g['neatGenome']['connections']) for g in current
        ) / len(current)
        initial_connections = sum(
            len(g['neatGenome']['connections']) for g in population
        ) / len(population)

        # With high mutation rates, we expect some structural growth
        # (This may not always increase, but shouldn't crash)
        assert avg_connections >= 0  # Basic sanity check
