# React Migration Notes

Track complex extractions and interconnections that will be handled during React migration (Phases 16-19).

## Deferred Extractions

### MenuBuilder (Phase 11 - Skipped)
**Why deferred:** The `createMenuScreen` method is 600+ lines with:
- Huge HTML template string (350+ lines)
- 200+ lines of event handler setup
- Deep coupling to `this.config`, `this.previewRenderer`, `this.updateSettingsInfoBox()`

**React approach:** Will become `<MenuScreen />` component with:
- Props: `config`, `onConfigChange`, `onStart`, `onLoad`
- Child components: `<ParamSlider />`, `<FitnessPanel />`, `<NeuralPanel />`
- State managed via React hooks instead of DOM manipulation

**Key interconnections:**
- `PreviewRenderer` - 3D preview in menu (already extracted)
- `config` object - passed down, changes trigger `updateSettingsInfoBox()`
- Slider values update config and regenerate preview creature

## Component Hierarchy (Planned)

```
<App>
├── <MenuScreen>              # Phase 11 deferred
│   ├── <PreviewCanvas>       # Uses PreviewRenderer
│   ├── <ParamSliders>
│   ├── <FitnessPanel>
│   └── <NeuralPanel>
├── <GridView>
│   ├── <StatsPanel>          # Uses StatsRenderer helpers
│   ├── <CreatureGrid>
│   │   └── <CreatureCard>    # Uses CreatureCardRenderer
│   └── <ControlPanel>
├── <ReplayModal>             # Uses ReplayRenderer
├── <LoadRunsModal>
└── <GraphPanel>              # Already a class
```

## Extracted Modules → React Components

| Current Module | React Component | Notes |
|---------------|-----------------|-------|
| PreviewRenderer | `<PreviewCanvas>` | Keep Three.js logic, wrap in useEffect |
| ReplayRenderer | `<ReplayModal>` | Modal + canvas |
| CreatureCardRenderer | `<CreatureCard>` | Card with canvas thumbnail |
| TooltipManager | `<Tooltip>` or use library | Consider Radix/Headless UI |
| GenerationNavigator | `<GenerationNav>` | Navigation state in context |
| StatsRenderer | `<StatsPanel>` | HTML generators become JSX |

## State to Lift to Context

- `config` - simulation configuration
- `generation`, `maxGeneration`, `viewingGeneration` - navigation state
- `simulationResults` - current generation results
- `bestCreatureEver`, `longestSurvivingCreature` - hall of fame
- `evolutionStep` - current step in cycle
- `appState` - menu/grid/replay

## Notes

- Tailwind class detection issue: v4 doesn't detect classes in JS template strings
  - Solution: Move to JSX where Tailwind works naturally
- Event handlers currently modify `this.config` directly
  - Solution: Use setState/dispatch pattern
