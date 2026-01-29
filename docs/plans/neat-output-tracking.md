# NEAT Output-Muscle Tracking Implementation Plan

## Problem Statement

When a muscle is removed during body mutation, the NEAT genome adaptation removes the wrong output neuron. Currently it removes the highest-numbered output ID, but it should remove the output that controlled the specific muscle that was removed.

**Example:**
- Creature has muscles [M0, M1, M2] controlled by outputs [O7, O8, O9]
- Body mutation removes M1 (the middle muscle)
- **Current behavior**: Removes O9 (highest ID) - WRONG
- **Correct behavior**: Remove O8 (controlled M1) - preserves M0→O7 and M2→O9 relationships

## Solution: Local Index Tracking

Track which muscle indices were removed during mutation, then remove outputs at those specific indices.

### Key Insight

Within a single genome's mutation operation, muscle IDs are stable. We can compare before/after to find removed indices:

```python
old_muscle_ids = ['m1', 'm2', 'm3', 'm4', 'm5']  # Before mutation
new_muscle_ids = ['m1', 'm3', 'm5']              # After mutation (m2, m4 removed)
removed_indices = [1, 3]                          # Indices of removed muscles
```

## Implementation Steps

### Step 1: Update `mutate_genome_neat` in mutation.py

**Location:** `backend/app/genetics/mutation.py` (~line 655)

**Changes:**
1. Save old muscle IDs before body mutation
2. After body mutation, find which indices were removed
3. Pass removed indices to `adapt_neat_topology`

```python
def mutate_genome_neat(genome, innovation_counter, config=None, constraints=None, neat_config=None):
    # ... existing setup ...

    # NEW: Save old muscle IDs before body mutation
    old_muscles = genome.get('muscles', [])
    old_muscle_ids = [m['id'] for m in old_muscles]

    # Do body mutation (existing code)
    new_genome = _mutate_body_only(genome, config, constraints)

    # NEW: Find which muscle indices were removed
    new_muscle_ids = {m['id'] for m in new_genome.get('muscles', [])}
    removed_indices = [i for i, mid in enumerate(old_muscle_ids)
                       if mid not in new_muscle_ids]

    # ... existing NEAT mutation code ...

    # Adapt NEAT topology with removed indices
    new_muscle_count = len(new_genome['muscles'])
    current_output_count = len([n for n in mutated_neat.neurons if n.type == 'output'])
    if removed_indices or current_output_count != new_muscle_count:
        mutated_neat = adapt_neat_topology(
            mutated_neat,
            new_muscle_count,
            removed_indices=removed_indices,  # NEW PARAMETER
        )
```

### Step 2: Update `adapt_neat_topology` in neat_network.py

**Location:** `backend/app/neural/neat_network.py` (~line 222)

**Changes:**
1. Add `removed_indices` parameter
2. When removing outputs, remove at specific indices (not highest IDs)
3. Maintain output order for remaining muscles

```python
def adapt_neat_topology(
    genome: NEATGenome,
    target_output_count: int,
    removed_indices: list[int] | None = None,  # NEW
    output_bias: float = -0.5,
    innovation_counter: InnovationCounter | None = None,
) -> NEATGenome:
    """
    Adapt NEAT genome when muscle count changes.

    Args:
        genome: NEAT genome to adapt
        target_output_count: Desired number of output neurons (= muscle count)
        removed_indices: Specific muscle indices that were removed (for correct output removal)
        output_bias: Initial bias for new output neurons
        innovation_counter: Optional counter for new connection innovations
    """
    from copy import deepcopy

    current_outputs = [n for n in genome.neurons if n.type == 'output']
    current_count = len(current_outputs)

    if current_count == target_output_count and not removed_indices:
        return genome  # No change needed

    adapted = deepcopy(genome)

    # Handle specific index removal (from mutation)
    if removed_indices:
        # Sort outputs by ID to establish index mapping
        outputs_sorted = sorted(
            [n for n in adapted.neurons if n.type == 'output'],
            key=lambda n: n.id
        )

        # Find output IDs to remove (by index)
        outputs_to_remove = set()
        for idx in removed_indices:
            if idx < len(outputs_sorted):
                outputs_to_remove.add(outputs_sorted[idx].id)

        # Remove neurons and their connections
        adapted.neurons = [n for n in adapted.neurons if n.id not in outputs_to_remove]
        adapted.connections = [
            c for c in adapted.connections
            if c.from_node not in outputs_to_remove and c.to_node not in outputs_to_remove
        ]

        # Update current count after removal
        current_outputs = [n for n in adapted.neurons if n.type == 'output']
        current_count = len(current_outputs)

    # Handle remaining count mismatch (muscles added)
    if target_output_count > current_count:
        # ... existing add logic (unchanged) ...

    elif target_output_count < current_count and not removed_indices:
        # Fallback: remove highest IDs (for crossover count adaptation)
        # ... existing remove logic (unchanged) ...

    return adapted
```

### Step 3: Update crossover functions

**Location:** `backend/app/genetics/crossover.py`

For crossover, we don't have "removed indices" - the child is a new creature with potentially different muscle count. Keep the current behavior (position-based, fitter parent's outputs):

```python
# In single_point_crossover and uniform_crossover:
# After NEAT crossover, adapt to child's muscle count
# No removed_indices - use count-based adaptation (existing behavior)
if neat_genome is not None:
    neat_obj = NEATGenome(**neat_genome) if isinstance(neat_genome, dict) else neat_genome
    output_count = len([n for n in neat_obj.neurons if n.type == 'output'])
    if output_count != len(child_muscles):
        adapted = adapt_neat_topology(neat_obj, len(child_muscles))
        # removed_indices=None means use count-based logic
        neat_genome = adapted.model_dump()
```

### Step 4: Add tests

**Location:** `backend/app/genetics/test_neat_topology_adaptation.py` (new file)

```python
class TestNeatTopologyAdaptation:
    def test_removes_correct_output_by_index(self):
        """When muscle at index 1 is removed, output at index 1 is removed."""
        genome = create_neat_genome_with_outputs(5)  # Outputs at indices 0-4

        adapted = adapt_neat_topology(genome, 4, removed_indices=[1])

        outputs = sorted([n for n in adapted.neurons if n.type == 'output'], key=lambda n: n.id)
        # Should have 4 outputs, with index 1 removed
        assert len(outputs) == 4

    def test_preserves_connections_for_remaining_outputs(self):
        """Connections to non-removed outputs are preserved."""
        ...

    def test_removes_connections_for_removed_output(self):
        """Connections to removed output are deleted."""
        ...

    def test_multiple_indices_removed(self):
        """Can remove multiple outputs at once."""
        genome = create_neat_genome_with_outputs(5)

        adapted = adapt_neat_topology(genome, 2, removed_indices=[1, 3, 4])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        assert len(outputs) == 2

    def test_fallback_to_count_based_when_no_indices(self):
        """Without removed_indices, falls back to count-based removal."""
        ...
```

## Files to Modify

| File | Change |
|------|--------|
| `backend/app/genetics/mutation.py` | Track removed indices, pass to adapt_neat_topology |
| `backend/app/neural/neat_network.py` | Add removed_indices parameter, implement index-based removal |
| `backend/app/genetics/crossover.py` | No changes needed (already uses count-based) |
| `backend/app/genetics/test_neat_topology_adaptation.py` | New test file |

## Edge Cases

1. **All muscles removed**: `removed_indices` contains all indices → all outputs removed
2. **Index out of range**: If `removed_indices` contains index >= output count, skip it
3. **Empty removed_indices**: Treat same as `None`, use count-based logic
4. **Duplicate indices**: Handle gracefully (set removes duplicates)

## Future Work

See `genetics-prd.json` → `future_enhancements.muscle_innovation_matching` for the planned enhancement to enable meaningful crossover alignment via muscle innovation IDs.

## Implementation Status

**✅ IMPLEMENTED** (2026-01-28)

Changes made:
- `backend/app/neural/neat_network.py`: Added `removed_indices` parameter to `adapt_neat_topology()`
- `backend/app/genetics/mutation.py`: Added `_mutate_body_only_with_tracking()` to track removed muscle indices
- `backend/app/genetics/test_neat_topology_adaptation.py`: New test file with 14 tests

## Testing Checklist

- [x] Unit test: correct output removed by index
- [x] Unit test: connections to removed output deleted
- [x] Unit test: multiple indices removed
- [x] Unit test: fallback to count-based when no indices
- [x] Integration test: mutation removes muscle → correct output removed
- [x] Integration test: crossover produces different muscle count → count-based adaptation works
- [x] Regression test: existing tests still pass (797 passed)
