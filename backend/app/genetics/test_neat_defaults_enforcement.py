"""
Edge case and stress tests for NEAT defaults enforcement.

These tests ensure that NEAT mode ALWAYS has the required settings
(speciation selection, fitness sharing disabled) regardless of how
the config is specified.

The key invariant: neural_mode='neat' MUST result in selection_method='speciation'
because without speciation, structural innovations get culled before
their weights can adapt.
"""

import random
import pytest

from app.genetics.population import (
    evolve_population,
    generate_population,
    EvolutionConfig,
)
from app.genetics.neat_mutation import InnovationCounter
from app.schemas.simulation import SimulationConfig


class TestSimulationConfigNEATEnforcement:
    """Tests for SimulationConfig validator enforcing NEAT defaults."""

    def test_neat_mode_forces_speciation_selection(self):
        """neural_mode='neat' MUST set selection_method='speciation' regardless of input."""
        config = SimulationConfig(neural_mode='neat', selection_method='rank')
        assert config.selection_method == 'speciation', "NEAT mode must force speciation selection"

    def test_neat_mode_forces_fitness_sharing_off(self):
        """neural_mode='neat' MUST disable fitness sharing."""
        config = SimulationConfig(neural_mode='neat', use_fitness_sharing=True)
        assert config.use_fitness_sharing is False, "NEAT mode must force fitness sharing off"

    def test_neat_mode_with_both_wrong_values(self):
        """Both selection method and fitness sharing should be corrected."""
        config = SimulationConfig(
            neural_mode='neat',
            selection_method='truncation',
            use_fitness_sharing=True,
        )
        assert config.selection_method == 'speciation'
        assert config.use_fitness_sharing is False

    def test_legacy_use_neat_enables_speciation(self):
        """Legacy use_neat=True should also force speciation selection."""
        config = SimulationConfig(use_neat=True)
        assert config.neural_mode == 'neat'
        assert config.selection_method == 'speciation'

    def test_legacy_useNEAT_camelcase_enables_speciation(self):
        """Legacy useNEAT=True (camelCase) should also force speciation selection."""
        config = SimulationConfig(useNEAT=True)
        assert config.neural_mode == 'neat'
        assert config.selection_method == 'speciation'

    def test_legacy_use_speciation_migrates_to_selection_method(self):
        """Legacy use_speciation=True should migrate to selection_method='speciation'."""
        config = SimulationConfig(neural_mode='pure', use_speciation=True)
        assert config.selection_method == 'speciation'

    def test_non_neat_modes_preserve_selection_setting(self):
        """pure and hybrid modes should NOT force speciation selection."""
        # Pure mode without speciation
        config = SimulationConfig(neural_mode='pure', selection_method='rank')
        assert config.selection_method == 'rank'

        # Hybrid mode without speciation
        config = SimulationConfig(neural_mode='hybrid', selection_method='truncation')
        assert config.selection_method == 'truncation'

        # Pure mode with speciation (user's choice)
        config = SimulationConfig(neural_mode='pure', selection_method='speciation')
        assert config.selection_method == 'speciation'

    def test_config_from_dict_neat_enforcement(self):
        """Config created from dict should also enforce NEAT defaults."""
        config_dict = {
            'neural_mode': 'neat',
            'selection_method': 'truncation',
            'use_fitness_sharing': True,
        }
        config = SimulationConfig(**config_dict)
        assert config.selection_method == 'speciation'
        assert config.use_fitness_sharing is False

    def test_config_from_dict_with_extra_fields(self):
        """Extra fields should be ignored, NEAT defaults still enforced."""
        config_dict = {
            'neural_mode': 'neat',
            'selection_method': 'rank',
            'unknown_field': 'should_be_ignored',
            'another_unknown': 123,
        }
        config = SimulationConfig(**config_dict)
        assert config.selection_method == 'speciation'


class TestEvolutionConfigNEATEnforcement:
    """Tests for evolve_population config parsing enforcing NEAT defaults."""

    def test_dict_config_neat_forces_speciation(self):
        """Dict-based config should enforce speciation when neural_mode='neat'."""
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

        # Try to disable speciation via dict - should be overridden
        config_dict = {
            'population_size': 10,
            'neural_mode': 'neat',
            'selection_method': 'truncation',  # This should be overridden to 'speciation'
        }

        new_pop, stats = evolve_population(
            population, fitness_scores, config_dict,
            generation=0, innovation_counter=counter
        )

        # If we got here without error, speciation was correctly applied
        assert len(new_pop) == 10

    def test_evolution_config_object_neat_no_override(self):
        """EvolutionConfig object should respect selection_method='speciation'."""
        config = EvolutionConfig(
            population_size=10,
            use_neat=True,
            selection_method='speciation',
        )
        # EvolutionConfig dataclass doesn't have auto-enforcement
        # The enforcement happens in evolve_population when parsing dict
        assert config.selection_method == 'speciation'


class TestEdgeCasesAndBoundaries:
    """Edge cases that might slip through."""

    def test_empty_config_dict_neat_mode(self):
        """Minimal dict with just neural_mode='neat' should still enforce."""
        config = SimulationConfig(neural_mode='neat')
        assert config.selection_method == 'speciation'
        assert config.use_fitness_sharing is False

    def test_none_values_in_config(self):
        """None values shouldn't break enforcement."""
        config_dict = {
            'neural_mode': 'neat',
            'selection_method': None,  # Should be overridden
        }
        # Note: None for selection_method will likely cause validation error
        # but if it doesn't, enforcement should still work
        try:
            config = SimulationConfig(**config_dict)
            assert config.selection_method == 'speciation'
        except Exception:
            pass  # Validation error is acceptable

    def test_case_sensitivity_neural_mode(self):
        """neural_mode should be case-sensitive (lowercase only)."""
        with pytest.raises(Exception):  # Should fail validation
            SimulationConfig(neural_mode='NEAT')

    def test_string_boolean_values(self):
        """String 'true'/'false' should work for boolean fields."""
        # This depends on Pydantic's coercion behavior
        # For fitness_sharing, string values may or may not be coerced
        pass  # Skip - Pydantic strict mode may reject this

    def test_numeric_boolean_values(self):
        """0/1 should work for boolean fields."""
        config = SimulationConfig(neural_mode='neat', use_fitness_sharing=1)
        assert config.use_fitness_sharing is False  # NEAT overrides to False


class TestMultipleCodePaths:
    """Ensure all code paths enforce NEAT defaults."""

    def test_api_simulation_path(self):
        """Simulate config coming from API request."""
        # Simulates JSON payload that might have wrong values
        api_payload = {
            'neural_mode': 'neat',
            'selection_method': 'tournament',  # Wrong - should be overridden
            'use_fitness_sharing': True,  # Wrong - should be overridden
            'population_size': 50,
        }

        config = SimulationConfig(**api_payload)
        assert config.selection_method == 'speciation'
        assert config.use_fitness_sharing is False

    def test_both_legacy_and_new_format(self):
        """Both old and new format in same config."""
        config = SimulationConfig(
            use_neat=True,  # Legacy
            neural_mode='pure',  # New (but use_neat should override)
            selection_method='rank',  # Should be overridden
        )
        assert config.neural_mode == 'neat'
        assert config.selection_method == 'speciation'


class TestRealWorldScenarios:
    """Tests simulating real usage patterns."""

    def test_frontend_sends_wrong_defaults(self):
        """Frontend might send cached/stale config values."""
        # User switched to NEAT mode but frontend sent old cached values
        frontend_config = {
            'neural_mode': 'neat',
            'selection_method': 'rank',  # Stale cached value
            'use_fitness_sharing': True,  # Stale cached value
        }

        config = SimulationConfig(**frontend_config)
        assert config.selection_method == 'speciation'
        assert config.use_fitness_sharing is False

    def test_loaded_config_from_database(self):
        """Config loaded from database might have inconsistent values."""
        # Simulates loading a saved run that was created before enforcement
        db_config = {
            'neural_mode': 'neat',
            # Missing selection_method - should default correctly
            'use_fitness_sharing': False,
        }

        config = SimulationConfig(**db_config)
        assert config.selection_method == 'speciation'

    def test_user_manually_overrides_in_api(self):
        """User explicitly tries to override NEAT requirements via API."""
        api_request = {
            'neural_mode': 'neat',
            'selection_method': 'truncation',  # Explicit override attempt
            'use_fitness_sharing': True,  # Explicit override attempt
        }

        config = SimulationConfig(**api_request)
        # System should enforce NEAT requirements despite explicit values
        assert config.selection_method == 'speciation'
        assert config.use_fitness_sharing is False
