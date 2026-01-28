"""
Edge case and stress tests for NEAT genome schema serialization.

These tests intentionally try to break the implementation by exploring
how NEAT genomes are serialized through the CreatureGenome schema.

BUG BEING TESTED: CreatureGenome schema is missing neatGenome field,
causing NEAT genomes to be silently dropped during serialization.
"""

import pytest
from pydantic import ValidationError

from app.schemas.genome import CreatureGenome, NodeGene, MuscleGene, Vector3
from app.schemas.neat import NEATGenome, NeuronGene, ConnectionGene
from app.genetics.population import generate_random_genome, generate_population


def create_minimal_creature_dict(with_neat: bool = False, with_neural: bool = False) -> dict:
    """Create a minimal valid creature genome dict for testing."""
    genome = {
        'id': 'test_creature_1',
        'generation': 0,
        'survivalStreak': 0,
        'parentIds': [],
        'nodes': [
            {'id': 'node_1', 'position': {'x': 0, 'y': 0.5, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            {'id': 'node_2', 'position': {'x': 1, 'y': 0.5, 'z': 0}, 'size': 0.3, 'friction': 0.5},
        ],
        'muscles': [
            {
                'id': 'muscle_1',
                'nodeA': 'node_1',
                'nodeB': 'node_2',
                'restLength': 1.0,
                'stiffness': 100.0,
                'damping': 0.5,
                'frequency': 1.0,
                'amplitude': 0.3,
                'phase': 0.0,
            }
        ],
        'controllerType': 'neural' if (with_neat or with_neural) else 'oscillator',
        'globalFrequencyMultiplier': 1.0,
        'color': {'h': 0.5, 's': 0.7, 'l': 0.5},
    }

    if with_neat:
        genome['neatGenome'] = {
            'neurons': [
                {'id': 0, 'type': 'input', 'bias': 0.0},
                {'id': 1, 'type': 'output', 'bias': -0.5},
            ],
            'connections': [
                {'from_node': 0, 'to_node': 1, 'weight': 0.5, 'enabled': True, 'innovation': 0},
            ],
            'activation': 'tanh',
        }

    if with_neural:
        genome['neuralGenome'] = {
            'input_size': 8,
            'hidden_size': 4,
            'output_size': 1,
            'weights_ih': [0.1] * 32,
            'weights_ho': [0.1] * 4,
            'biases_h': [0.0] * 4,
            'biases_o': [-0.5],
        }

    return genome


class TestNeatGenomeSchemaPresence:
    """Tests verifying NEAT genome field exists and works in CreatureGenome."""

    def test_creature_genome_has_neat_genome_field(self):
        """CreatureGenome schema should have a neatGenome field.

        BUG: The schema currently only has neuralGenome, not neatGenome.
        This causes NEAT genomes to be silently dropped during serialization.
        """
        # Check that the field exists in the model
        field_names = set(CreatureGenome.model_fields.keys())
        assert 'neatGenome' in field_names or 'neat_genome' in field_names, (
            "CreatureGenome is missing neatGenome field! "
            "NEAT genomes will be silently dropped during serialization."
        )

    def test_neat_genome_preserved_through_validation(self):
        """NEAT genome should not be dropped when validating a creature dict.

        BUG: Currently neatGenome is dropped because it's not in the schema.
        """
        genome_dict = create_minimal_creature_dict(with_neat=True)

        # Validate through Pydantic
        creature = CreatureGenome.model_validate(genome_dict)

        # The NEAT genome should be preserved
        creature_dict = creature.model_dump()
        assert 'neatGenome' in creature_dict or 'neat_genome' in creature_dict, (
            "neatGenome was dropped during model_validate! "
            "This is the bug - NEAT genomes are being silently removed."
        )

    def test_neat_genome_preserved_in_model_dump(self):
        """NEAT genome should appear in model_dump output."""
        genome_dict = create_minimal_creature_dict(with_neat=True)

        creature = CreatureGenome.model_validate(genome_dict)
        dumped = creature.model_dump()

        # Check for either camelCase or snake_case
        has_neat = 'neatGenome' in dumped or 'neat_genome' in dumped
        neat_value = dumped.get('neatGenome') or dumped.get('neat_genome')

        assert has_neat and neat_value is not None, (
            f"NEAT genome missing from model_dump. "
            f"Got keys: {list(dumped.keys())}"
        )

    def test_neat_genome_preserved_in_json_output(self):
        """NEAT genome should appear in JSON serialization."""
        genome_dict = create_minimal_creature_dict(with_neat=True)

        creature = CreatureGenome.model_validate(genome_dict)
        json_str = creature.model_dump_json()

        assert 'neatGenome' in json_str or 'neat_genome' in json_str, (
            "neatGenome missing from JSON output"
        )


class TestNeatGenomeGenerationPipeline:
    """Tests for NEAT genome generation through the full pipeline."""

    def test_generate_random_genome_neat_preserved(self):
        """generate_random_genome with use_neat=True should create neatGenome."""
        genome = generate_random_genome(
            use_neural_net=True,
            use_neat=True,
            neural_mode='neat',
        )

        assert 'neatGenome' in genome, (
            "generate_random_genome did not create neatGenome field"
        )
        assert genome['neatGenome'] is not None, (
            "neatGenome is None"
        )

    def test_neat_genome_survives_schema_validation_after_generation(self):
        """NEAT genome from generate_random_genome should survive schema validation.

        This is the critical bug path: generation creates neatGenome,
        but schema validation drops it.
        """
        genome = generate_random_genome(
            use_neural_net=True,
            use_neat=True,
            neural_mode='neat',
        )

        # This is what happens in API endpoints
        validated = CreatureGenome.model_validate(genome)
        dumped = validated.model_dump()

        assert 'neatGenome' in dumped or 'neat_genome' in dumped, (
            "BUG REPRODUCED: neatGenome was dropped during schema validation! "
            "The CreatureGenome schema is missing the neatGenome field."
        )

    def test_generate_population_neat_all_have_neat_genome(self):
        """All creatures in NEAT population should have neatGenome."""
        genomes = generate_population(
            size=5,
            use_neural_net=True,
            use_neat=True,
            neural_mode='neat',
        )

        for i, genome in enumerate(genomes):
            assert 'neatGenome' in genome, f"Genome {i} missing neatGenome"
            assert genome['neatGenome'] is not None, f"Genome {i} has None neatGenome"

    def test_population_neat_genomes_survive_schema_validation(self):
        """All NEAT genomes should survive schema validation."""
        genomes = generate_population(
            size=5,
            use_neural_net=True,
            use_neat=True,
            neural_mode='neat',
        )

        for i, genome in enumerate(genomes):
            validated = CreatureGenome.model_validate(genome)
            dumped = validated.model_dump()

            has_neat = 'neatGenome' in dumped or 'neat_genome' in dumped
            neat_value = dumped.get('neatGenome') or dumped.get('neat_genome')

            assert has_neat and neat_value is not None, (
                f"BUG: Genome {i} lost its neatGenome during validation"
            )


class TestNeatVsNeuralGenome:
    """Tests for mutual exclusivity and correct handling of both genome types."""

    def test_neat_and_neural_mutually_exclusive_in_generation(self):
        """A generated genome should have either neatGenome OR neuralGenome, not both."""
        # NEAT genome
        neat_genome = generate_random_genome(use_neural_net=True, use_neat=True)
        has_neat = 'neatGenome' in neat_genome and neat_genome['neatGenome'] is not None
        has_neural = 'neuralGenome' in neat_genome and neat_genome['neuralGenome'] is not None

        assert has_neat and not has_neural, (
            "NEAT genome should have neatGenome only, not neuralGenome"
        )

        # Fixed topology genome
        fixed_genome = generate_random_genome(use_neural_net=True, use_neat=False)
        has_neat = 'neatGenome' in fixed_genome and fixed_genome['neatGenome'] is not None
        has_neural = 'neuralGenome' in fixed_genome and fixed_genome['neuralGenome'] is not None

        assert has_neural and not has_neat, (
            "Fixed topology genome should have neuralGenome only, not neatGenome"
        )

    def test_schema_accepts_neat_genome_without_neural_genome(self):
        """Schema should accept a creature with only neatGenome."""
        genome_dict = create_minimal_creature_dict(with_neat=True, with_neural=False)

        # Should not raise
        creature = CreatureGenome.model_validate(genome_dict)
        assert creature is not None

    def test_schema_accepts_neural_genome_without_neat_genome(self):
        """Schema should accept a creature with only neuralGenome."""
        genome_dict = create_minimal_creature_dict(with_neat=False, with_neural=True)

        # Should not raise
        creature = CreatureGenome.model_validate(genome_dict)
        assert creature.neuralGenome is not None


class TestNeatGenomeStructure:
    """Tests for NEAT genome structure integrity through serialization."""

    def test_neat_neurons_preserved(self):
        """NEAT neuron data should be preserved through serialization."""
        genome_dict = create_minimal_creature_dict(with_neat=True)
        genome_dict['neatGenome']['neurons'] = [
            {'id': 0, 'type': 'input', 'bias': 0.1},
            {'id': 1, 'type': 'input', 'bias': 0.2},
            {'id': 2, 'type': 'hidden', 'bias': 0.3, 'innovation': 100},
            {'id': 3, 'type': 'output', 'bias': -0.5},
        ]

        creature = CreatureGenome.model_validate(genome_dict)
        dumped = creature.model_dump()

        neat = dumped.get('neatGenome') or dumped.get('neat_genome')
        assert neat is not None, "NEAT genome missing"
        assert len(neat['neurons']) == 4, "Neurons lost during serialization"

    def test_neat_connections_preserved(self):
        """NEAT connection data should be preserved through serialization."""
        genome_dict = create_minimal_creature_dict(with_neat=True)
        genome_dict['neatGenome']['connections'] = [
            {'from_node': 0, 'to_node': 2, 'weight': 0.5, 'enabled': True, 'innovation': 0},
            {'from_node': 1, 'to_node': 2, 'weight': -0.3, 'enabled': True, 'innovation': 1},
            {'from_node': 2, 'to_node': 3, 'weight': 0.8, 'enabled': False, 'innovation': 2},
        ]

        creature = CreatureGenome.model_validate(genome_dict)
        dumped = creature.model_dump()

        neat = dumped.get('neatGenome') or dumped.get('neat_genome')
        assert neat is not None, "NEAT genome missing"
        assert len(neat['connections']) == 3, "Connections lost during serialization"

        # Check disabled connection preserved
        disabled = [c for c in neat['connections'] if not c['enabled']]
        assert len(disabled) == 1, "Disabled connection status not preserved"


class TestEdgeCases:
    """Edge cases and boundary conditions for NEAT genome handling."""

    def test_empty_neat_connections(self):
        """NEAT genome with no connections should be valid."""
        genome_dict = create_minimal_creature_dict(with_neat=True)
        genome_dict['neatGenome']['connections'] = []

        creature = CreatureGenome.model_validate(genome_dict)
        dumped = creature.model_dump()

        neat = dumped.get('neatGenome') or dumped.get('neat_genome')
        assert neat is not None
        assert neat['connections'] == []

    def test_large_neat_genome(self):
        """Large NEAT genome should be handled correctly."""
        genome_dict = create_minimal_creature_dict(with_neat=True)

        # Create many neurons and connections
        neurons = [{'id': 0, 'type': 'input', 'bias': 0.0}]
        for i in range(1, 50):
            neurons.append({'id': i, 'type': 'hidden', 'bias': 0.1 * i, 'innovation': i})
        neurons.append({'id': 50, 'type': 'output', 'bias': -0.5})

        connections = []
        for i in range(100):
            connections.append({
                'from_node': i % 50,
                'to_node': (i + 1) % 50 + 1,
                'weight': 0.1 * i,
                'enabled': i % 3 != 0,
                'innovation': i,
            })

        genome_dict['neatGenome']['neurons'] = neurons
        genome_dict['neatGenome']['connections'] = connections

        creature = CreatureGenome.model_validate(genome_dict)
        dumped = creature.model_dump()

        neat = dumped.get('neatGenome') or dumped.get('neat_genome')
        assert neat is not None
        assert len(neat['neurons']) == 51
        assert len(neat['connections']) == 100

    def test_neat_genome_camelcase_and_snake_case(self):
        """NEAT genome should work with both camelCase and snake_case keys."""
        # Try with snake_case key
        genome_dict = create_minimal_creature_dict(with_neat=False)
        genome_dict['neat_genome'] = {
            'neurons': [
                {'id': 0, 'type': 'input', 'bias': 0.0},
                {'id': 1, 'type': 'output', 'bias': -0.5},
            ],
            'connections': [
                {'from_node': 0, 'to_node': 1, 'weight': 0.5, 'enabled': True, 'innovation': 0},
            ],
            'activation': 'tanh',
        }
        genome_dict['controllerType'] = 'neural'

        creature = CreatureGenome.model_validate(genome_dict)
        dumped = creature.model_dump()

        # Should have the field regardless of input format
        has_neat = 'neatGenome' in dumped or 'neat_genome' in dumped
        assert has_neat, "snake_case neat_genome not accepted"
