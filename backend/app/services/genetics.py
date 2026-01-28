"""
Genetics service for evolution operations.
Ported from TypeScript genetics modules.
"""

import math
import random
import uuid
from typing import Any


class GeneticsService:
    """Service for genetic operations: selection, crossover, mutation."""

    def generate_id(self, prefix: str = "g") -> str:
        """Generate a unique ID."""
        return f"{prefix}_{uuid.uuid4().hex[:8]}"

    def generate_initial_population(
        self,
        size: int,
        constraints: dict,
    ) -> list[dict]:
        """Generate a random initial population."""
        return [self.generate_random_genome(constraints) for _ in range(size)]

    def generate_random_genome(self, constraints: dict) -> dict:
        """Generate a random genome within constraints."""
        min_nodes = constraints.get("min_nodes", 3)
        max_nodes = constraints.get("max_nodes", 8)
        min_muscles = constraints.get("min_muscles", 2)
        max_muscles = constraints.get("max_muscles", 15)
        spawn_radius = constraints.get("spawn_radius", 1.5)

        # Generate nodes
        num_nodes = random.randint(min_nodes, max_nodes)
        nodes = []
        for _ in range(num_nodes):
            # Random position within spawn radius
            angle = random.uniform(0, 2 * math.pi)
            radius = random.uniform(0, spawn_radius)
            height = random.uniform(0.3, 1.5)

            node = {
                "id": self.generate_id("n"),
                "position": {
                    "x": math.cos(angle) * radius,
                    "y": height,
                    "z": math.sin(angle) * radius,
                },
                "size": random.uniform(0.2, 0.8),
                "mass": random.uniform(0.5, 2.0),
                "friction": random.uniform(0.3, 0.9),
                "restitution": random.uniform(0.1, 0.5),
            }
            nodes.append(node)

        # Generate muscles connecting nodes
        num_muscles = min(random.randint(min_muscles, max_muscles), len(nodes) * (len(nodes) - 1) // 2)
        muscles = []
        used_pairs = set()

        # First ensure connectivity
        for i in range(1, len(nodes)):
            j = random.randint(0, i - 1)
            pair = (min(i, j), max(i, j))
            if pair not in used_pairs:
                muscle = self._create_muscle(nodes[i], nodes[j])
                muscles.append(muscle)
                used_pairs.add(pair)

        # Add additional random muscles
        while len(muscles) < num_muscles:
            i, j = random.sample(range(len(nodes)), 2)
            pair = (min(i, j), max(i, j))
            if pair not in used_pairs:
                muscle = self._create_muscle(nodes[i], nodes[j])
                muscles.append(muscle)
                used_pairs.add(pair)

        return {
            "id": self.generate_id("g"),
            "generation": 0,
            "nodes": nodes,
            "muscles": muscles,
            "parent_ids": [],
            "survival_streak": 0,
            "global_frequency_multiplier": random.uniform(0.8, 1.2),
            "global_amplitude_multiplier": random.uniform(0.8, 1.2),
            "controller_type": "oscillator",
            "color": {
                "h": random.random(),
                "s": 0.6 + random.random() * 0.3,
                "l": 0.4 + random.random() * 0.2,
            },
            "ancestry_chain": [],
        }

    def _create_muscle(self, node_a: dict, node_b: dict) -> dict:
        """Create a muscle connecting two nodes."""
        # Calculate rest length from node positions
        dx = node_a["position"]["x"] - node_b["position"]["x"]
        dy = node_a["position"]["y"] - node_b["position"]["y"]
        dz = node_a["position"]["z"] - node_b["position"]["z"]
        rest_length = math.sqrt(dx * dx + dy * dy + dz * dz)

        return {
            "id": self.generate_id("m"),
            "node_a": node_a["id"],
            "node_b": node_b["id"],
            "rest_length": max(0.2, rest_length),
            "stiffness": random.uniform(50.0, 200.0),
            "damping": random.uniform(2.0, 4.0),
            "frequency": random.uniform(0.5, 2.0),
            "amplitude": random.uniform(0.1, 0.5),
            "phase": random.uniform(0, 2 * math.pi),
        }

    def evolve_population(
        self,
        creatures: list[dict],  # [{"genome": {...}, "fitness": float}]
        config: dict,
    ) -> list[dict]:
        """Evolve a population to produce the next generation."""
        population_size = config.get("population_size", 20)
        elite_count = config.get("elite_count", 2)
        use_crossover = config.get("use_crossover", True)
        crossover_rate = config.get("crossover_rate", 0.3)
        mutation_rate = config.get("mutation_rate", 0.15)
        structural_rate = config.get("structural_mutation_rate", 0.1)
        constraints = config.get("genome_constraints", {})

        # Sort by fitness
        sorted_creatures = sorted(creatures, key=lambda c: c["fitness"], reverse=True)

        new_genomes = []

        # Keep elites
        for i in range(min(elite_count, len(sorted_creatures))):
            elite_genome = self._clone_genome(sorted_creatures[i]["genome"])
            elite_genome["survival_streak"] = sorted_creatures[i]["genome"].get("survival_streak", 0) + 1
            new_genomes.append(elite_genome)

        # Get survivors for breeding (top 50%)
        survivors = sorted_creatures[: len(sorted_creatures) // 2]
        if len(survivors) < 2:
            survivors = sorted_creatures

        # Calculate selection probabilities
        probs = self._rank_based_probabilities(survivors)

        # Breed offspring
        while len(new_genomes) < population_size:
            if use_crossover and random.random() < crossover_rate and len(survivors) >= 2:
                # Crossover
                parent1 = self._weighted_select(survivors, probs)
                parent2 = self._weighted_select(survivors, probs)
                while parent2["genome"]["id"] == parent1["genome"]["id"] and len(survivors) > 1:
                    parent2 = self._weighted_select(survivors, probs)

                child = self._crossover(parent1["genome"], parent2["genome"])
            else:
                # Clone
                parent = self._weighted_select(survivors, probs)
                child = self._clone_genome(parent["genome"])

            # Always mutate offspring - survivors are already kept unchanged
            child = self._mutate(child, mutation_rate, structural_rate, constraints)

            # Update generation
            child["generation"] = sorted_creatures[0]["genome"].get("generation", 0) + 1
            child["survival_streak"] = 0

            new_genomes.append(child)

        return new_genomes

    def _clone_genome(self, genome: dict) -> dict:
        """Deep clone a genome."""
        import copy

        clone = copy.deepcopy(genome)
        clone["id"] = self.generate_id("g")
        clone["parent_ids"] = [genome["id"]]
        clone["survival_streak"] = 0

        # Ensure required fields exist with defaults
        if "color" not in clone:
            clone["color"] = {
                "h": random.random(),
                "s": 0.6 + random.random() * 0.3,
                "l": 0.4 + random.random() * 0.2,
            }
        if "controller_type" not in clone:
            clone["controller_type"] = "oscillator"
        if "ancestry_chain" not in clone:
            clone["ancestry_chain"] = []

        return clone

    def _crossover(self, parent1: dict, parent2: dict) -> dict:
        """Single-point crossover between two genomes."""
        import copy

        # Use parent1 as base
        child = copy.deepcopy(parent1)
        child["id"] = self.generate_id("g")
        child["parent_ids"] = [parent1["id"], parent2["id"]]
        child["survival_streak"] = 0

        # Crossover nodes
        if len(parent2["nodes"]) > 0:
            crossover_point = random.randint(0, min(len(child["nodes"]), len(parent2["nodes"])))
            # Take some nodes from parent2
            for i in range(crossover_point, min(len(child["nodes"]), len(parent2["nodes"]))):
                if i < len(child["nodes"]) and i < len(parent2["nodes"]):
                    # Blend node properties
                    child["nodes"][i]["size"] = self._lerp(
                        child["nodes"][i]["size"],
                        parent2["nodes"][i]["size"],
                        0.5,
                    )
                    child["nodes"][i]["mass"] = self._lerp(
                        child["nodes"][i]["mass"],
                        parent2["nodes"][i]["mass"],
                        0.5,
                    )

        # Crossover muscles
        if len(parent2["muscles"]) > 0 and len(child["muscles"]) > 0:
            crossover_point = random.randint(0, min(len(child["muscles"]), len(parent2["muscles"])))
            for i in range(crossover_point, min(len(child["muscles"]), len(parent2["muscles"]))):
                if i < len(child["muscles"]) and i < len(parent2["muscles"]):
                    # Blend muscle properties
                    child["muscles"][i]["stiffness"] = self._lerp(
                        child["muscles"][i].get("stiffness", 100.0),
                        parent2["muscles"][i].get("stiffness", 100.0),
                        0.5,
                    )
                    child["muscles"][i]["damping"] = self._lerp(
                        child["muscles"][i].get("damping", 0.5),
                        parent2["muscles"][i].get("damping", 0.5),
                        0.5,
                    )
                    child["muscles"][i]["frequency"] = self._lerp(
                        child["muscles"][i]["frequency"],
                        parent2["muscles"][i]["frequency"],
                        0.5,
                    )
                    child["muscles"][i]["phase"] = self._lerp(
                        child["muscles"][i]["phase"],
                        parent2["muscles"][i]["phase"],
                        0.5,
                    )

        # Blend global multipliers
        child["global_frequency_multiplier"] = self._lerp(
            parent1.get("global_frequency_multiplier", 1.0),
            parent2.get("global_frequency_multiplier", 1.0),
            0.5,
        )
        child["global_amplitude_multiplier"] = self._lerp(
            parent1.get("global_amplitude_multiplier", 1.0),
            parent2.get("global_amplitude_multiplier", 1.0),
            0.5,
        )

        # Blend colors (or use parent1's if parent2 doesn't have one)
        color1 = parent1.get("color", {"h": 0.5, "s": 0.7, "l": 0.5})
        color2 = parent2.get("color", {"h": 0.5, "s": 0.7, "l": 0.5})
        child["color"] = {
            "h": self._lerp(color1["h"], color2["h"], 0.5),
            "s": self._lerp(color1["s"], color2["s"], 0.5),
            "l": self._lerp(color1["l"], color2["l"], 0.5),
        }

        # Ensure controller_type and ancestry_chain exist
        if "controller_type" not in child:
            child["controller_type"] = parent1.get("controller_type", "oscillator")
        if "ancestry_chain" not in child:
            child["ancestry_chain"] = []

        return child

    def _mutate(
        self,
        genome: dict,
        mutation_rate: float,
        structural_rate: float,
        constraints: dict,
    ) -> dict:
        """Apply mutations to a genome."""
        # Node mutations
        for node in genome["nodes"]:
            if random.random() < mutation_rate:
                node["size"] = self._clamp(
                    node["size"] + random.gauss(0, 0.1), 0.1, 2.0
                )
            if random.random() < mutation_rate:
                node["mass"] = self._clamp(
                    node["mass"] + random.gauss(0, 0.2), 0.1, 5.0
                )
            if random.random() < mutation_rate:
                node["friction"] = self._clamp(
                    node["friction"] + random.gauss(0, 0.1), 0.0, 1.0
                )

        # Muscle mutations
        for muscle in genome["muscles"]:
            if random.random() < mutation_rate:
                muscle["stiffness"] = self._clamp(
                    muscle.get("stiffness", 100.0) + random.gauss(0, 20.0), 50.0, 500.0
                )
            if random.random() < mutation_rate:
                muscle["damping"] = self._clamp(
                    muscle.get("damping", 3.0) + random.gauss(0, 0.5), 1.0, 6.0
                )
            if random.random() < mutation_rate:
                muscle["frequency"] = self._clamp(
                    muscle["frequency"] + random.gauss(0, 0.2), 0.1, 5.0
                )
            if random.random() < mutation_rate:
                muscle["phase"] = (muscle["phase"] + random.gauss(0, 0.3)) % (2 * math.pi)
            if random.random() < mutation_rate:
                muscle["amplitude"] = self._clamp(
                    muscle["amplitude"] + random.gauss(0, 0.1), 0.0, 1.0
                )

        # Global multiplier mutations
        if random.random() < mutation_rate:
            genome["global_frequency_multiplier"] = self._clamp(
                genome.get("global_frequency_multiplier", 1.0) + random.gauss(0, 0.1),
                0.1,
                3.0,
            )
        if random.random() < mutation_rate:
            genome["global_amplitude_multiplier"] = self._clamp(
                genome.get("global_amplitude_multiplier", 1.0) + random.gauss(0, 0.1),
                0.1,
                2.0,
            )

        # Structural mutations
        min_nodes = constraints.get("min_nodes", 3)
        max_nodes = constraints.get("max_nodes", 8)

        if random.random() < structural_rate:
            # Add or remove node
            if len(genome["nodes"]) < max_nodes and random.random() < 0.5:
                self._add_node(genome, constraints)
            elif len(genome["nodes"]) > min_nodes:
                self._remove_node(genome)

        if random.random() < structural_rate:
            # Add or remove muscle
            max_muscles = constraints.get("max_muscles", 15)
            if len(genome["muscles"]) < max_muscles and random.random() < 0.5:
                self._add_muscle(genome)
            elif len(genome["muscles"]) > 1:
                self._remove_muscle(genome)

        return genome

    def _add_node(self, genome: dict, constraints: dict) -> None:
        """Add a new node to the genome."""
        spawn_radius = constraints.get("spawn_radius", 1.5)
        angle = random.uniform(0, 2 * math.pi)
        radius = random.uniform(0, spawn_radius)

        new_node = {
            "id": self.generate_id("n"),
            "position": {
                "x": math.cos(angle) * radius,
                "y": random.uniform(0.3, 1.5),
                "z": math.sin(angle) * radius,
            },
            "size": random.uniform(0.2, 0.8),
            "mass": random.uniform(0.5, 2.0),
            "friction": random.uniform(0.3, 0.9),
            "restitution": random.uniform(0.1, 0.5),
        }
        genome["nodes"].append(new_node)

        # Connect to a random existing node
        if len(genome["nodes"]) > 1:
            other = random.choice(genome["nodes"][:-1])
            genome["muscles"].append(self._create_muscle(new_node, other))

    def _remove_node(self, genome: dict) -> None:
        """Remove a node and its connected muscles."""
        if len(genome["nodes"]) <= 2:
            return

        # Pick a random node to remove
        node = random.choice(genome["nodes"])
        node_id = node["id"]

        # Remove the node
        genome["nodes"] = [n for n in genome["nodes"] if n["id"] != node_id]

        # Remove muscles connected to this node
        genome["muscles"] = [
            m for m in genome["muscles"]
            if m["node_a"] != node_id and m["node_b"] != node_id
        ]

    def _add_muscle(self, genome: dict) -> None:
        """Add a muscle between two unconnected nodes."""
        if len(genome["nodes"]) < 2:
            return

        # Find pairs not connected
        connected = {(m["node_a"], m["node_b"]) for m in genome["muscles"]}
        # Add reverse pairs (must iterate over a copy to avoid modifying during iteration)
        connected.update((b, a) for a, b in list(connected))

        unconnected = []
        for i, n1 in enumerate(genome["nodes"]):
            for n2 in genome["nodes"][i + 1 :]:
                if (n1["id"], n2["id"]) not in connected:
                    unconnected.append((n1, n2))

        if unconnected:
            n1, n2 = random.choice(unconnected)
            genome["muscles"].append(self._create_muscle(n1, n2))

    def _remove_muscle(self, genome: dict) -> None:
        """Remove a random muscle."""
        if len(genome["muscles"]) <= 1:
            return
        idx = random.randint(0, len(genome["muscles"]) - 1)
        genome["muscles"].pop(idx)

    def _rank_based_probabilities(self, creatures: list[dict]) -> list[float]:
        """Calculate selection probabilities based on rank."""
        n = len(creatures)
        # Linear ranking: best gets rank n, worst gets rank 1
        total_rank = n * (n + 1) / 2
        return [(n - i) / total_rank for i in range(n)]

    def _weighted_select(self, creatures: list[dict], probs: list[float]) -> dict:
        """Select a creature using weighted random selection."""
        r = random.random()
        cumulative = 0
        for creature, prob in zip(creatures, probs):
            cumulative += prob
            if r <= cumulative:
                return creature
        return creatures[-1]

    def _lerp(self, a: float, b: float, t: float) -> float:
        """Linear interpolation."""
        return a + (b - a) * t

    def _clamp(self, value: float, min_val: float, max_val: float) -> float:
        """Clamp value between min and max."""
        return max(min_val, min(max_val, value))
