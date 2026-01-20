# React Migration Notes

Track architecture decisions and migration progress for Phases 17-19.

## Architecture Decisions (Ensemble Consensus)

### State Management: Zustand
**Why:** Selective subscriptions prevent re-render storms, devtools for debugging, simpler than Context + useReducer for complex state.

```typescript
// app/stores/evolutionStore.ts
export const useEvolutionStore = create<EvolutionState>()((set, get) => ({
  // State slices
  appState: 'menu',
  evolutionStep: 'idle',
  generation: 0,
  config: DEFAULT_CONFIG,
  // ...

  // Actions colocated with state
  setGeneration: (gen) => set({ generation: gen }),
  runSimulation: async () => { /* calls service */ },
}));
```

### Service Layer: Yes (thin)
**Why:** Future backend migration - hooks call services, services call domain logic. When backend is ready, swap service implementations.

```
Component → Hook → Service → Domain Logic (src/)
                      ↓
              (future: API calls)
```

### Folder Structure: Feature-based
```
app/
├── layout.tsx
├── page.tsx
├── providers.tsx           # Zustand + any other providers
│
├── stores/
│   └── evolutionStore.ts   # Zustand store
│
├── services/
│   ├── SimulationService.ts
│   └── StorageService.ts
│
├── hooks/
│   ├── useSimulation.ts    # Orchestrates simulation via service
│   ├── useStorage.ts       # IndexedDB via service
│   └── useThreeRenderer.ts # Three.js lifecycle wrapper
│
├── components/
│   ├── common/             # Button, Modal, Tooltip, ProgressBar
│   ├── menu/               # MenuScreen, PreviewCanvas, ParamSliders
│   ├── grid/               # GridView, CreatureGrid, CreatureCard, StatsPanel
│   └── modals/             # ReplayModal, LoadRunsModal
│
└── types/
    └── ui.ts               # React-specific types (props, events)

src/
├── services/               # NEW - thin abstraction layer
│   ├── SimulationService.ts
│   └── StorageService.ts
├── types/                  # Domain types (keep as-is)
├── rendering/              # Three.js renderers (keep as-is)
├── genetics/               # Domain logic (keep as-is)
├── simulation/             # BatchSimulator (keep as-is)
└── storage/                # RunStorage (keep as-is)
```

### Three.js Integration
**Pattern:** Keep renderers imperative, React owns lifecycle only.

```typescript
// app/hooks/useThreeRenderer.ts
export function useReplayRenderer(
  containerRef: RefObject<HTMLDivElement>,
  result: CreatureSimulationResult | null
) {
  const rendererRef = useRef<ReplayRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    rendererRef.current = new ReplayRenderer(containerRef.current);
    return () => rendererRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (result) rendererRef.current?.loadResult(result);
  }, [result]);

  return rendererRef;
}
```

### Types Strategy
- **Domain types:** Keep in `src/types/` (framework-agnostic, shareable with backend)
- **UI props:** Colocate with components or in `app/types/ui.ts`

### Tailwind Migration
- Use arbitrary values for exact parity: `w-[372px]` not `w-96`
- Map CSS variables to Tailwind config
- Don't approximate - precision matters for visual parity

---

## Deferred Extractions (from pre-React phases)

### MenuBuilder (Phase 11)
**600+ lines** - HTML template + event handlers coupled to config.
**React:** `<MenuScreen>` with child components, state via Zustand.

### SimulationController (Phase 12)
**~500 lines** - 7 methods with card animation DOM manipulation.
**React:** `useSimulation` hook + Zustand + CSS transitions/Framer Motion.

### LoadRunsModal (Phase 13)
**~370 lines** - loadRun() sets 15+ instance variables.
**React:** `<LoadRunsModal>` component, load dispatches to Zustand store.

### ControlPanel (Phase 14)
**~35 lines** - trivial in React.

---

## Component Hierarchy

```
<EvolutionProvider>           # Zustand provider (in providers.tsx)
  <App>
    {appState === 'menu' && <MenuScreen />}
    {appState === 'grid' && <GridView />}

    <ReplayModal />           # Controlled by store.replayResult
    <LoadRunsModal />         # Controlled by store.loadModalOpen
  </App>
</EvolutionProvider>
```

### MenuScreen
```
<MenuScreen>
  <PreviewCanvas />           # 3D creature preview (usePreviewRenderer)
  <ConfigPanel>
    <ParamSliders />          # Gravity, mutation rate, etc.
    <FitnessPanel />          # Fitness config (collapsible)
    <NeuralPanel />           # Neural net config (collapsible)
  </ConfigPanel>
  <ActionButtons />           # Start, Load Run
</MenuScreen>
```

### GridView
```
<GridView>
  <StatsPanel />              # Generation info, step indicator, settings
  <CreatureGrid>
    <CreatureCard />          # × 100, with canvas thumbnail
  </CreatureGrid>
  <ControlPanel />            # Step, Auto (1x/10x/100x), Graph, Reset
  <ProgressBar />             # Shown during simulation
</GridView>
```

---

## State Shape (Zustand Store)

```typescript
interface EvolutionStore {
  // App state
  appState: 'menu' | 'grid';

  // Evolution state
  evolutionStep: 'idle' | 'mutate' | 'simulate' | 'sort';
  generation: number;
  maxGeneration: number;
  viewingGeneration: number | null;
  isAutoRunning: boolean;

  // Config
  config: SimulationConfig;

  // Results
  simulationResults: CreatureSimulationResult[];
  fitnessHistory: FitnessHistoryEntry[];

  // Hall of fame
  bestCreatureEver: CreatureSimulationResult | null;
  bestCreatureGeneration: number;
  longestSurvivingCreature: CreatureSimulationResult | null;
  longestSurvivingGenerations: number;

  // UI state
  selectedCreatureId: string | null;
  replayResult: CreatureSimulationResult | null;  // null = modal closed
  loadModalOpen: boolean;
  graphsVisible: boolean;

  // Run metadata
  runName: string;

  // Actions
  setAppState: (state: AppState) => void;
  setConfig: (partial: Partial<SimulationConfig>) => void;
  startSimulation: () => Promise<void>;
  executeNextStep: () => Promise<void>;
  autoRun: (generations: number) => Promise<void>;
  loadRun: (runId: string) => Promise<void>;
  reset: () => void;
}
```

---

## Migration Phases (17.x)

See prd.json for detailed phase breakdown.

| Phase | Description | Test Focus |
|-------|-------------|------------|
| 17.1 | Folder structure + Zustand store | Build passes |
| 17.2 | Services layer | Build passes |
| 17.3 | Common components (Button, Modal) | Visual check |
| 17.4 | MenuScreen | Menu renders, config works, start works |
| 17.5 | GridView shell | Grid renders empty |
| 17.6 | CreatureCard + CreatureGrid | Cards render with thumbnails |
| 17.7 | StatsPanel | Stats display correctly |
| 17.8 | ControlPanel + ProgressBar | Buttons work, progress shows |
| 17.9 | ReplayModal | Replay plays correctly |
| 17.10 | LoadRunsModal | Load/delete runs works |

---

## Notes

- Keep vanilla `main.ts` working until Phase 19 (final cleanup)
- Each phase should be independently testable
- Tailwind classes go directly in JSX (no CSS files for new components)
- Error boundaries around Three.js components
