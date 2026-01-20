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

### SimulationController (Phase 12 - Skipped)
**Why deferred:** ~500 lines spanning 7 methods with deep DOM coupling:
- `startSimulation()` - initializes run, creates population
- `executeNextStep()` - evolution step state machine
- `runMutateStep()` - 166 lines of card animation (opacity, transform, spawn effects)
- `runSimulationStep()` - progress bar updates, thumbnail re-rendering
- `runSortStep()` - position animations for sorted cards
- `recordFitnessHistory()` - updates graph panels
- `autoRun()` - orchestrates multi-generation runs

**React approach:**
- Evolution state in context: `evolutionStep`, `isAutoRunning`, `generation`
- Card animations via React Transition Group or Framer Motion
- Progress tracked in state, rendered declaratively
- Simulation logic stays in `BatchSimulator`, orchestrated by `useEvolution` hook

**Key instance vars accessed:**
- `this.population`, `this.simulationResults`, `this.creatureCards`
- `this.graphPanel`, `this.creatureTypesPanel`
- `this.progressContainer`, `this.gridContainer`

### LoadRunsModal (Phase 13 - Skipped)
**Why deferred:** ~370 lines with `loadRun()` setting 15+ instance variables:
- Modal HTML + event handlers (160 lines) - extractable but pointless pre-React
- `loadRun()` (190 lines) - directly sets config, generation, simulationResults, creates Population/Creature objects

**React approach:** `<LoadRunsModal />` component with:
- Props: `isOpen`, `onClose`, `onLoadRun`
- Uses `useQuery` or similar for fetching runs
- `loadRun` becomes dispatch to global state/context
- Run cards rendered via map, not innerHTML

**State restored by loadRun:**
- `config`, `generation`, `maxGeneration`, `viewingGeneration`
- `simulationResults`, `fitnessHistory`, `creatureTypeHistory`
- `bestCreatureEver`, `longestSurvivingCreature`
- `population` (recreated from results)

### ControlPanel (Phase 14 - Skipped)
**Why deferred:** Only ~35 lines (PRD overestimated). Just button HTML + event bindings.
Not worth extracting standalone - becomes trivial `<ControlPanel />` in React.

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
