# NEAT Next Step

Execute the next pending task from the neat-prd.json implementation plan.

## Instructions

1. **Read the NEAT PRD and find the next pending task:**
   ```bash
   cat neat-prd.json | jq '.phase_1.tasks | to_entries[] | select(.value.status == "pending") | {id: .value.id, name: .value.name, file: .value.file, description: .value.description}' | head -30
   ```

2. **Announce the task:**
   - State the task ID and name
   - Show the target file
   - Summarize what will be implemented

3. **Execute the task:**
   - Follow the task description exactly
   - Reference `docs/NEAT.md` for technical details
   - Match the code patterns in existing genetics files
   - Add comprehensive tests

4. **Update the PRD status:**
   After completing the task, update `neat-prd.json`:
   - Change the task's `status` from `"pending"` to `"complete"`

5. **Update NEAT.md:**
   Update `docs/NEAT.md` implementation status table:
   - Change status to "Complete" or "In progress"
   - Add any implementation notes or deviations from plan
   - Update code examples if they differ from actual implementation

6. **Run tests:**
   ```bash
   cd backend && pytest -x -v
   npm test -- --run
   ```

7. **Commit the changes:**
   ```bash
   git add -A && git commit -m "feat(neat): <task name>

   <description of what was implemented>

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
   ```

## Task Order

Phase 1 tasks should be done roughly in order:
1. **1.1-1.5**: Core NEAT backend (schemas, network, mutations, crossover, distance)
2. **1.6-1.9**: Integration with existing genetics system
3. **1.10-1.15**: Config schemas, simulator, database, API
4. **1.16**: Backend tests
5. **1.17-1.21**: Frontend (types, UI, visualizer, stats, storage)
6. **1.22-1.23**: Documentation

## Dependencies

- **Prerequisite**: Speciation (genetics-prd.json Phase 10) must be complete
- **Phase 2** (Recurrent NEAT): Only start after Phase 1 is proven stable

## File Locations

| Component | File |
|-----------|------|
| Schemas | `backend/app/schemas/neat.py` |
| Network | `backend/app/neural/neat_network.py` |
| Mutations | `backend/app/genetics/neat_mutation.py` |
| Crossover | `backend/app/genetics/neat_crossover.py` |
| Distance | `backend/app/genetics/neat_distance.py` |
| Tests | `backend/app/genetics/test_neat_*.py` |

## Technical Reference

Always consult `docs/NEAT.md` for:
- Gene representation format
- Innovation number tracking
- Crossover rules (matching/disjoint/excess)
- Compatibility distance formula
- Speciation integration approach

## Checklist

Before marking a task complete:
- [ ] Implementation matches NEAT.md specification
- [ ] Tests added and passing
- [ ] neat-prd.json status updated
- [ ] docs/NEAT.md status table updated
- [ ] No regressions in existing tests
- [ ] Changes committed

## Allowed Operations

This command has permission to:
- Create and modify files in `backend/app/`
- Create and modify files in `src/` and `app/`
- Update `neat-prd.json` and `docs/NEAT.md`
- Run tests
- Create git commits
