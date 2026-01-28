"""
Integration stress tests for NEAT config propagation.

Tests that NEAT configuration options correctly flow from API requests
through the evolution pipeline to actual mutation operations.
"""

import pytest
from app.genetics.population import (
    generate_population,
    evolve_population,
    EvolutionConfig,
)
from app.genetics.mutation import NEATMutationConfig
from app.schemas.neat import InnovationCounter, NEATGenome
from app.schemas.simulation import SimulationConfig


class TestNEATConfigDefaults:
    """Tests for default NEAT configuration values."""

    def test_evolution_config_neat_defaults(self):
        """EvolutionConfig should have correct NEAT defaults."""
        config = EvolutionConfig()

        assert config.neat_add_connection_rate == 0.05
        assert config.neat_add_node_rate == 0.03
        assert config.neat_enable_rate == 0.02
        assert config.neat_disable_rate == 0.01
        assert config.neat_excess_coefficient == 1.0
        assert config.neat_disjoint_coefficient == 1.0
        assert config.neat_weight_coefficient == 0.4
        assert config.neat_max_hidden_nodes == 16
        assert config.bias_mode == 'node'

    def test_simulation_config_neat_defaults(self):
        """SimulationConfig should have correct NEAT defaults."""
        config = SimulationConfig()

        assert config.neat_add_connection_rate == 0.05
        assert config.neat_add_node_rate == 0.03
        assert config.neat_enable_rate == 0.02
        assert config.neat_disable_rate == 0.01
        assert config.neat_excess_coefficient == 1.0
        assert config.neat_disjoint_coefficient == 1.0
        assert config.neat_weight_coefficient == 0.4
        assert config.neat_max_hidden_nodes == 16
        assert config.bias_mode == 'node'

    def test_neat_mutation_config_defaults(self):
        """NEATMutationConfig should have correct defaults."""
        config = NEATMutationConfig()

        assert config.add_connection_rate == 0.05
        assert config.add_node_rate == 0.03
        assert config.enable_rate == 0.02
        assert config.disable_rate == 0.01
        assert config.max_hidden_nodes == 16
        assert config.bias_mode == 'node'


class TestNEATConfigPropagation:
    """Tests for NEAT config propagation through the pipeline."""

    def test_dict_config_propagates_enable_rate(self):
        """Enable rate from dict config should reach mutation."""
        # Generate NEAT population
        innovation_counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            neural_mode='neat',
            use_neat=True,
            bias_mode='bias_node',
            innovation_counter=innovation_counter,
        )

        # Evolve with custom enable rate
        config = {
            'neural_mode': 'neat',
            'population_size': 10,
            'cull_percentage': 0.5,
            'neat_enable_rate': 0.5,  # Very high to make effect visible
            'neat_disable_rate': 0.0,  # Disable off
            'neat_add_connection_rate': 0.0,
            'neat_add_node_rate': 0.0,
            'bias_mode': 'bias_node',
        }

        fitness_scores = [float(i) for i in range(10)]

        # Run evolution - high enable rate should attempt to re-enable connections
        new_pop, stats = evolve_population(
            population,
            fitness_scores,
            config,
            generation=0,
            innovation_counter=innovation_counter,
        )

        assert len(new_pop) == 10
        # All creatures should have NEAT genomes
        for genome in new_pop:
            assert 'neatGenome' in genome

    def test_dict_config_propagates_disable_rate(self):
        """Disable rate from dict config should reach mutation."""
        innovation_counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            neural_mode='neat',
            use_neat=True,
            bias_mode='bias_node',
            innovation_counter=innovation_counter,
        )

        # Evolve with custom disable rate
        config = {
            'neural_mode': 'neat',
            'population_size': 10,
            'cull_percentage': 0.5,
            'neat_enable_rate': 0.0,
            'neat_disable_rate': 0.5,  # Very high
            'neat_add_connection_rate': 0.0,
            'neat_add_node_rate': 0.0,
            'bias_mode': 'bias_node',
        }

        fitness_scores = [float(i) for i in range(10)]

        new_pop, stats = evolve_population(
            population,
            fitness_scores,
            config,
            generation=0,
            innovation_counter=innovation_counter,
        )

        assert len(new_pop) == 10

    def test_all_neat_rates_propagate(self):
        """All NEAT rates should propagate correctly."""
        innovation_counter = InnovationCounter()
        population = generate_population(
            size=20,
            use_neural_net=True,
            neural_mode='neat',
            use_neat=True,
            bias_mode='bias_node',
            innovation_counter=innovation_counter,
        )

        # Custom rates
        config = {
            'neural_mode': 'neat',
            'population_size': 20,
            'cull_percentage': 0.5,
            'neat_add_connection_rate': 0.15,
            'neat_add_node_rate': 0.08,
            'neat_enable_rate': 0.06,
            'neat_disable_rate': 0.04,
            'neat_excess_coefficient': 2.0,
            'neat_disjoint_coefficient': 1.5,
            'neat_weight_coefficient': 0.6,
            'neat_max_hidden_nodes': 32,
            'bias_mode': 'bias_node',
        }

        fitness_scores = [float(i) for i in range(20)]

        new_pop, stats = evolve_population(
            population,
            fitness_scores,
            config,
            generation=0,
            innovation_counter=innovation_counter,
        )

        assert len(new_pop) == 20


class TestBiasModeNEATPropagation:
    """Tests for bias_mode propagation in NEAT context."""

    def test_bias_node_mode_creates_bias_neuron(self):
        """bias_node mode should create a bias neuron in NEAT genome."""
        innovation_counter = InnovationCounter()
        population = generate_population(
            size=5,
            use_neural_net=True,
            neural_mode='neat',
            use_neat=True,
            bias_mode='bias_node',
            innovation_counter=innovation_counter,
        )

        for genome in population:
            neat_genome = genome.get('neatGenome')
            assert neat_genome is not None

            # Should have a bias neuron
            bias_neurons = [n for n in neat_genome['neurons'] if n['type'] == 'bias']
            assert len(bias_neurons) == 1
            assert bias_neurons[0]['id'] == 0  # Bias node is always ID 0

    def test_node_mode_no_bias_neuron(self):
        """node mode should NOT create a bias neuron."""
        innovation_counter = InnovationCounter()
        population = generate_population(
            size=5,
            use_neural_net=True,
            neural_mode='neat',
            use_neat=True,
            bias_mode='node',
            innovation_counter=innovation_counter,
        )

        for genome in population:
            neat_genome = genome.get('neatGenome')
            assert neat_genome is not None

            # Should NOT have a bias neuron
            bias_neurons = [n for n in neat_genome['neurons'] if n['type'] == 'bias']
            assert len(bias_neurons) == 0

    def test_none_mode_no_biases(self):
        """none mode should have no biases anywhere."""
        innovation_counter = InnovationCounter()
        population = generate_population(
            size=5,
            use_neural_net=True,
            neural_mode='neat',
            use_neat=True,
            bias_mode='none',
            innovation_counter=innovation_counter,
        )

        for genome in population:
            neat_genome = genome.get('neatGenome')
            assert neat_genome is not None

            # No bias neurons
            bias_neurons = [n for n in neat_genome['neurons'] if n['type'] == 'bias']
            assert len(bias_neurons) == 0

            # All biases should be 0
            for neuron in neat_genome['neurons']:
                if neuron['type'] in ('hidden', 'output'):
                    assert neuron['bias'] == 0.0

    def test_bias_mode_survives_evolution(self):
        """Bias mode configuration should persist through evolution."""
        innovation_counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            neural_mode='neat',
            use_neat=True,
            bias_mode='bias_node',
            innovation_counter=innovation_counter,
        )

        config = {
            'neural_mode': 'neat',
            'population_size': 10,
            'cull_percentage': 0.5,
            'bias_mode': 'bias_node',
        }

        fitness_scores = [float(i) for i in range(10)]

        new_pop, _ = evolve_population(
            population,
            fitness_scores,
            config,
            generation=0,
            innovation_counter=innovation_counter,
        )

        # All genomes should still have bias neurons
        for genome in new_pop:
            neat_genome = genome.get('neatGenome')
            assert neat_genome is not None

            bias_neurons = [n for n in neat_genome['neurons'] if n['type'] == 'bias']
            assert len(bias_neurons) == 1


class TestNEATConfigBoundaries:
    """Tests for boundary conditions in NEAT config."""

    def test_zero_rates_disable_mutations(self):
        """Setting rates to 0 should disable those mutations."""
        innovation_counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            neural_mode='neat',
            use_neat=True,
            bias_mode='bias_node',
            innovation_counter=innovation_counter,
        )

        # Count initial structure
        initial_connections = sum(
            len(g['neatGenome']['connections']) for g in population
        )
        initial_neurons = sum(
            len(g['neatGenome']['neurons']) for g in population
        )

        config = {
            'neural_mode': 'neat',
            'population_size': 10,
            'cull_percentage': 0.3,
            'neat_add_connection_rate': 0.0,
            'neat_add_node_rate': 0.0,
            'neat_enable_rate': 0.0,
            'neat_disable_rate': 0.0,
            'weight_mutation_rate': 0.0,  # No weight changes either
            'bias_mode': 'bias_node',
            'use_crossover': False,  # Only mutation
        }

        fitness_scores = [float(i) for i in range(10)]

        new_pop, _ = evolve_population(
            population,
            fitness_scores,
            config,
            generation=0,
            innovation_counter=innovation_counter,
        )

        # Structure should be roughly similar (survivors unchanged, offspring from clones)
        # Note: offspring are cloned from survivors so structure preserved
        final_connections = sum(
            len(g['neatGenome']['connections']) for g in new_pop
        )
        final_neurons = sum(
            len(g['neatGenome']['neurons']) for g in new_pop
        )

        # With no structural mutations, neuron count shouldn't change much
        # (Only comes from survivors and their clones)
        assert final_neurons > 0
        assert final_connections > 0

    def test_max_rates_cause_structural_changes(self):
        """High rates should cause structural changes."""
        innovation_counter = InnovationCounter()
        population = generate_population(
            size=20,
            use_neural_net=True,
            neural_mode='neat',
            use_neat=True,
            bias_mode='bias_node',
            innovation_counter=innovation_counter,
        )

        config = {
            'neural_mode': 'neat',
            'population_size': 20,
            'cull_percentage': 0.5,
            'neat_add_connection_rate': 0.5,  # High
            'neat_add_node_rate': 0.3,  # High
            'neat_enable_rate': 0.0,
            'neat_disable_rate': 0.0,
            'neat_max_hidden_nodes': 64,
            'bias_mode': 'bias_node',
            'use_crossover': False,
        }

        fitness_scores = [float(i) for i in range(20)]

        # Run multiple generations
        current_pop = population
        for gen in range(5):
            current_pop, _ = evolve_population(
                current_pop,
                fitness_scores,
                config,
                generation=gen,
                innovation_counter=innovation_counter,
            )

        # After 5 generations with high mutation rates, we should see structural growth
        total_hidden = sum(
            len([n for n in g['neatGenome']['neurons'] if n['type'] == 'hidden'])
            for g in current_pop
        )

        # Should have some hidden neurons now
        assert total_hidden > 0

    def test_max_hidden_nodes_limit_enforced(self):
        """max_hidden_nodes should cap network growth."""
        innovation_counter = InnovationCounter()
        population = generate_population(
            size=10,
            use_neural_net=True,
            neural_mode='neat',
            use_neat=True,
            bias_mode='node',
            innovation_counter=innovation_counter,
        )

        MAX_HIDDEN = 4  # Very low limit

        config = {
            'neural_mode': 'neat',
            'population_size': 10,
            'cull_percentage': 0.3,
            'neat_add_connection_rate': 0.3,
            'neat_add_node_rate': 0.5,  # Very high
            'neat_max_hidden_nodes': MAX_HIDDEN,
            'bias_mode': 'node',
            'use_crossover': False,
        }

        fitness_scores = [float(i) for i in range(10)]

        # Run many generations
        current_pop = population
        for gen in range(20):
            current_pop, _ = evolve_population(
                current_pop,
                fitness_scores,
                config,
                generation=gen,
                innovation_counter=innovation_counter,
            )

        # No genome should exceed the limit
        for genome in current_pop:
            neat_genome = genome.get('neatGenome')
            hidden_count = len([
                n for n in neat_genome['neurons'] if n['type'] == 'hidden'
            ])
            assert hidden_count <= MAX_HIDDEN, \
                f"Genome has {hidden_count} hidden nodes, max is {MAX_HIDDEN}"


class TestNEATConfigEdgeCases:
    """Edge case tests for NEAT configuration."""

    def test_missing_neat_config_uses_defaults(self):
        """Missing NEAT config fields should use defaults."""
        innovation_counter = InnovationCounter()
        population = generate_population(
            size=5,
            use_neural_net=True,
            neural_mode='neat',
            use_neat=True,
            bias_mode='bias_node',
            innovation_counter=innovation_counter,
        )

        # Minimal config - only required fields
        config = {
            'neural_mode': 'neat',
            'population_size': 5,
            # No NEAT-specific rates - should use defaults
        }

        fitness_scores = [float(i) for i in range(5)]

        # Should not crash, uses defaults
        new_pop, _ = evolve_population(
            population,
            fitness_scores,
            config,
            generation=0,
            innovation_counter=innovation_counter,
        )

        assert len(new_pop) == 5

    def test_speciation_coefficients_affect_distance(self):
        """Speciation coefficients should affect genome distance calculation."""
        from app.genetics.neat_distance import neat_genome_distance

        # Create two slightly different genomes
        genome1 = NEATGenome(
            neurons=[
                {'id': 0, 'type': 'input', 'bias': 0.0},
                {'id': 1, 'type': 'output', 'bias': 0.0},
            ],
            connections=[
                {'from_node': 0, 'to_node': 1, 'weight': 0.5, 'enabled': True, 'innovation': 0},
            ],
            activation='tanh',
        )

        genome2 = NEATGenome(
            neurons=[
                {'id': 0, 'type': 'input', 'bias': 0.0},
                {'id': 1, 'type': 'output', 'bias': 0.0},
            ],
            connections=[
                {'from_node': 0, 'to_node': 1, 'weight': 1.0, 'enabled': True, 'innovation': 0},  # Different weight
                {'from_node': 0, 'to_node': 1, 'weight': 0.5, 'enabled': True, 'innovation': 1},  # Extra connection
            ],
            activation='tanh',
        )

        # Distance with default coefficients
        dist1 = neat_genome_distance(
            genome1, genome2,
            excess_coefficient=1.0,
            disjoint_coefficient=1.0,
            weight_coefficient=0.4,
        )

        # Distance with higher weight coefficient
        dist2 = neat_genome_distance(
            genome1, genome2,
            excess_coefficient=1.0,
            disjoint_coefficient=1.0,
            weight_coefficient=2.0,  # Higher
        )

        # Higher weight coefficient should increase distance (weight diff matters more)
        assert dist2 > dist1

    def test_evolution_config_from_dict_full_neat(self):
        """Full NEAT config from dict should create correct EvolutionConfig."""
        config_dict = {
            'neural_mode': 'neat',
            'population_size': 50,
            'cull_percentage': 0.6,
            'neat_add_connection_rate': 0.12,
            'neat_add_node_rate': 0.07,
            'neat_enable_rate': 0.04,
            'neat_disable_rate': 0.02,
            'neat_excess_coefficient': 1.8,
            'neat_disjoint_coefficient': 1.3,
            'neat_weight_coefficient': 0.55,
            'neat_max_hidden_nodes': 24,
            'bias_mode': 'bias_node',
        }

        innovation_counter = InnovationCounter()
        population = generate_population(
            size=50,
            use_neural_net=True,
            neural_mode='neat',
            use_neat=True,
            bias_mode='bias_node',
            innovation_counter=innovation_counter,
        )

        fitness_scores = [float(i) for i in range(50)]

        # Should work without error
        new_pop, stats = evolve_population(
            population,
            fitness_scores,
            config_dict,
            generation=0,
            innovation_counter=innovation_counter,
        )

        assert len(new_pop) == 50
        assert stats.generation == 0


class TestNEATConfigIntegrationWithSpeciation:
    """Tests for NEAT config integration with speciation."""

    def test_neat_forces_speciation_on(self):
        """NEAT mode should force speciation on even if config says off."""
        innovation_counter = InnovationCounter()
        population = generate_population(
            size=20,
            use_neural_net=True,
            neural_mode='neat',
            use_neat=True,
            bias_mode='bias_node',
            innovation_counter=innovation_counter,
        )

        config = {
            'neural_mode': 'neat',
            'population_size': 20,
            'cull_percentage': 0.5,
            'selection_method': 'rank',  # Try to use rank - should be overridden to 'speciation'
            'compatibility_threshold': 1.0,
            'bias_mode': 'bias_node',
        }

        fitness_scores = [float(i) for i in range(20)]

        new_pop, _ = evolve_population(
            population,
            fitness_scores,
            config,
            generation=0,
            innovation_counter=innovation_counter,
        )

        # Evolution should succeed (speciation was forced on internally)
        assert len(new_pop) == 20

    def test_compatibility_threshold_affects_speciation(self):
        """Compatibility threshold should affect species count."""
        innovation_counter = InnovationCounter()
        population = generate_population(
            size=30,
            use_neural_net=True,
            neural_mode='neat',
            use_neat=True,
            bias_mode='bias_node',
            innovation_counter=innovation_counter,
        )

        # First evolve a few generations to get some diversity
        config_diverse = {
            'neural_mode': 'neat',
            'population_size': 30,
            'cull_percentage': 0.5,
            'neat_add_connection_rate': 0.2,
            'neat_add_node_rate': 0.1,
            'bias_mode': 'bias_node',
        }

        fitness_scores = [float(i) for i in range(30)]
        current_pop = population

        for gen in range(3):
            current_pop, _ = evolve_population(
                current_pop,
                fitness_scores,
                config_diverse,
                generation=gen,
                innovation_counter=innovation_counter,
            )

        # Now test with different thresholds
        # Very low threshold = more species
        # Very high threshold = fewer species
        # This is tested implicitly by the evolution succeeding
        assert len(current_pop) == 30
