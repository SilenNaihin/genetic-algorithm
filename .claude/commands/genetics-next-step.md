# Genetics Next Step

Execute the next pending phase from the genetics-prd.json roadmap.

## Instructions

1. **Read the PRD and find the next pending phase:**
   ```bash
   cat genetics-prd.json | jq '.phases[] | select(.status == "pending") | {id, name, description, tasks, files, test_focus}' | head -50
   ```

2. **Announce the phase:**
   - State the phase ID and name
   - Summarize what will be implemented
   - List the files that will be modified

3. **Execute the tasks in order:**
   - Follow the task list exactly
   - Add config parameters to `src/types/simulation.ts` first
   - Update the implementation files
   - Add UI controls to `src/main.ts`
   - Add tests if applicable

4. **Update the PRD status:**
   After completing the phase, update `genetics-prd.json`:
   ```bash
   # Change status from "pending" to "completed" for the phase
   ```

5. **Update documentation:**
   - Add entry to CHANGELOG.md under [Unreleased]
   - Update CLAUDE.md if new conventions introduced
   - Update docs/NEURAL.md if neural architecture changed

6. **Run tests and build:**
   ```bash
   npm test -- --run
   npm run build
   ```

7. **Commit the changes:**
   Use `/commit-smart` or commit manually with:
   ```bash
   git add -A && git commit -m "feat(genetics): Phase X - <phase name>

   <description of what was implemented>

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
   ```

## Phase Dependencies

Some phases have dependencies:
- Phase 12 (API-First) depends on: Backend API migration (separate chat)
- Phase 13 (NAS) depends on: Phase 12
- Phase 14 (Human-in-the-Loop) depends on: Phase 12
- Phase 15 (NEAT) depends on: Phase 10 (Speciation)

If a phase has unmet dependencies, skip to the next phase without dependencies.

## Test Focus

Each phase has a `test_focus` field describing what to verify:
- Run the app and test manually
- Create automated tests for genetics functions
- Document any issues found

## Checklist

Before marking a phase complete:
- [ ] All tasks implemented
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Manual testing done
- [ ] PRD status updated
- [ ] Documentation updated
- [ ] Changes committed
