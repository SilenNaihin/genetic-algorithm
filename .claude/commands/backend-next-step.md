# Backend Next Step

Execute the next pending item from the backend-prd.json (PyTorch-first approach).

## CRITICAL: Incremental Approach

This is an **incremental migration**. After each item:

1. Tell the user what was done
2. **STOP and wait for user testing/approval**
3. Only continue when user says "next", "ok", "continue", etc.
4. When they approve, a set of changes /commit-smart the changes and continue to the next item.

## Instructions

1. **Read the PRD and find current item:**

   ```bash
   cat backend-prd.json | jq '{current_phase, current_item, phase: .phases[.current_phase - 1]}'
   ```

2. **Announce the item:**

   - State the item ID (e.g., "1.1") and name
   - Summarize what will be implemented
   - List the files that will be modified

3. **Execute the item:**

   - Make the minimal changes for this item only
   - PyTorch physics code in `backend/app/simulation/`
   - Neural network in `backend/app/neural/`
   - Add pytest tests in `backend/tests/`

4. **Verify:**

   ```bash
   cd backend && python -m pytest tests/ -v
   ```

   For physics items, also run a quick benchmark:

   ```python
   # Quick timing test
   import time
   start = time.time()
   # simulate 100 creatures
   print(f"100 creatures: {time.time() - start:.3f}s")
   ```

5. **Update the PRD:**

   - Mark current item as "completed"
   - Update `current_item` to next pending item
   - If phase complete, update `current_phase`

6. **Report to user:**
   - What was implemented
   - Files changed
   - Test status / benchmark results
   - **Ask for approval before continuing**

## After User Approves

Only after user confirms:

1. Commit the changes
2. Announce the next item (don't execute yet)

## Phase Priorities

1. **Phase 1: PyTorch Physics Core** - CRITICAL (the bottleneck)
2. **Phase 2: Neural Network** - HIGH (needed for neuroevolution)
3. **Phase 3: Validation** - HIGH (ensure correctness)
4. **Phases 4-6: Genetics, API, DB** - MEDIUM
5. **Phases 7-8: Testing, Frontend** - MEDIUM
6. **Phases 9-10: GPU Opt, Docs** - LOW (polish)

## File Structure

```
backend/
├── app/
│   ├── simulation/
│   │   ├── physics.py      # PyTorch batched physics
│   │   ├── tensors.py      # Tensor data structures
│   │   └── fitness.py      # Fitness calculation
│   ├── neural/
│   │   ├── network.py      # PyTorch nn.Module
│   │   └── sensors.py      # Sensor input gathering
│   ├── genetics/
│   │   ├── selection.py
│   │   ├── mutation.py
│   │   └── crossover.py
│   ├── api/                # FastAPI routers
│   ├── models/             # SQLAlchemy models
│   └── schemas/            # Pydantic schemas
├── tests/
│   ├── test_physics.py
│   ├── test_neural.py
│   └── test_genetics.py
└── fixtures/               # Test genomes from TypeScript
```

## PyTorch Best Practices

- Use `torch.no_grad()` for simulation (no backprop needed)
- Keep tensors on same device (cpu/cuda)
- Batch everything: [B, N, 3] not loops over creatures
- Use masks for variable-size creatures (pad to max)

## Checklist (Per Item)

- [ ] Code implemented with PyTorch tensors
- [ ] **Comprehensive tests added** (cover edge cases, error handling, all code paths)
- [ ] Tests pass: `cd backend && python -m pytest tests/ -v`
- [ ] Benchmark shows reasonable performance
- [ ] PRD updated
- [ ] User approved

## Testing Requirements

**MANDATORY**: Every item MUST have comprehensive tests before completion.

1. **Unit tests for each function** - test all parameters, edge cases
2. **Edge cases to always test:**
   - Empty inputs (0 creatures, 0 nodes, 0 muscles)
   - Single element (1 creature, 1 node, 1 muscle)
   - Maximum capacity (MAX_NODES=8, MAX_MUSCLES=15)
   - Mixed sizes in same batch
3. **Numerical stability:**
   - Test with very small/large values
   - Verify no NaN/Inf in outputs
4. **Device compatibility:**
   - Test on CPU (always)
   - Test on CUDA if available

## Critical Alignment Checks

At end of Phase 3, spawn `/claude-critic` to review:

- Physics behavior vs TypeScript Cannon-ES
- Edge cases (0 nodes, 0 muscles, etc.)
- Numerical stability (NaN, Inf handling)
