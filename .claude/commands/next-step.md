# Continue to Next Step

Continue the frontend refactoring to the next phase in `prd.json`.

## Workflow

1. **Read prd.json** to find the next incomplete phase
2. **Tell the user** what functionality will be affected (test_focus field)
3. **Extract the code** to the new module
4. **Keep CSS classes in main.css** for now (Tailwind conversion deferred to React phase)
5. **Verify** with `npm run build && npm test`
6. **Report results** to user with line count changes
7. **WAIT for user approval** before committing - DO NOT auto-commit

## Tailwind Conversion Rules (Deferred to React Phase)

**Note:** Tailwind v4 doesn't reliably detect classes in JS template strings. Full Tailwind conversion will happen during React migration (Phase 16+) when we use JSX with proper tooling.

For now during vanilla JS extraction:

When extracting UI components, you MUST convert CSS classes to Tailwind:

### For component-specific styles:
- Convert inline styles and CSS classes to Tailwind utilities in the component
- Example: `style="padding: 16px; border-radius: 8px;"` → `className="p-4 rounded-lg"`

### For global/reusable styles:
- Keep in `src/styles/main.css` but convert to Tailwind `@apply` where possible
- Or extend the theme in `@theme` block with custom values

### CSS to Tailwind mapping (use our design tokens):
```
var(--bg-primary)     → bg-bg-primary
var(--bg-secondary)   → bg-bg-secondary
var(--bg-tertiary)    → bg-bg-tertiary
var(--bg-card)        → bg-bg-card
var(--accent)         → bg-accent / text-accent
var(--accent-light)   → bg-accent-light / text-accent-light
var(--success)        → bg-success / text-success
var(--warning)        → bg-warning / text-warning
var(--danger)         → bg-danger / text-danger
var(--text-primary)   → text-text-primary
var(--text-secondary) → text-text-secondary
var(--text-muted)     → text-text-muted
var(--border)         → border-border
var(--border-light)   → border-border-light
var(--glass)          → bg-glass
```

### Common conversions:
```
padding: 16px         → p-4
padding: 8px 16px     → px-4 py-2
margin-bottom: 8px    → mb-2
border-radius: 8px    → rounded-lg
border-radius: 12px   → rounded-xl
font-size: 14px       → text-sm
font-size: 12px       → text-xs
font-weight: 600      → font-semibold
display: flex         → flex
gap: 8px              → gap-2
```

## After User Approves

Only after user says "ok", "approved", "looks good", "next", etc:
1. Run `/commit-smart` to commit the changes
2. Proceed to next phase

## Example Flow

```
Assistant: Phase 6 extracts PreviewRenderer - the 3D creature animation on menu.
           Test: Menu screen bounce animation, regenerate button.
           [does the work, converts to Tailwind]
           Done! main.ts: 4017 → 3850 (-167 lines). Build passing.

User: looks good