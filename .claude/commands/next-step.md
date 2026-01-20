# Continue to Next Step

Execute the next phase of the frontend refactoring from `prd.json`.

**IMPORTANT: This command should DO THE WORK, not just display instructions.**

## Steps to Execute

1. Read `prd.json` and find the next phase without `"status": "completed"`
2. Tell the user the phase name and test_focus (what to test after)
3. Find and extract the relevant code to a new module
4. Keep CSS classes in `main.css` (Tailwind deferred to React phase)
5. Run `npm run build && npm test` to verify
6. Report: line count changes, build/test status
7. **STOP and wait for user approval before committing**

## After User Approves

Only after user says "ok", "approved", "looks good", "next", "continue", etc:
1. Commit the changes (no Co-Authored-By line)
2. Then start the next phase

## Handling Complex Extractions

If an extraction is too complex (600+ lines, deep coupling):
1. **Don't force it** - some things are better handled in React migration
2. **Update `react-migration.md`** with:
   - Why it was deferred
   - Component hierarchy / interconnections
   - What the React approach will be
3. **Mark phase as "deferred" in prd.json** and move to next phase
4. Tell the user what was deferred and why

## Notes

- Tailwind v4 doesn't detect classes in JS strings - defer full conversion to React phase
- Keep CSS in main.css for now, just extract the JS logic
- `react-migration.md` tracks deferred work and component planning for phases 16-19
