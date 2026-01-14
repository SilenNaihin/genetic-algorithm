import * as THREE from 'three';
import { generateRandomGenome } from './core/Genome';
import { simulatePopulation, CreatureSimulationResult, PelletData, SimulationFrame } from './simulation/BatchSimulator';
import { Population } from './genetics/Population';
import { DEFAULT_CONFIG, SimulationConfig, CreatureGenome, FitnessHistoryEntry, Vector3 } from './types';
import { GraphPanel } from './ui/GraphPanel';

// ============================================
// RUN STORAGE (IndexedDB persistence)
// ============================================

interface SavedRun {
  id: string;
  startTime: number;
  config: SimulationConfig;
  thumbnail?: string;
  generationCount: number;
}

interface GenerationData {
  runId: string;
  generation: number;
  results: CompactCreatureResult[];
}

interface CompactCreatureResult {
  genome: CreatureGenome;
  fitness: number;
  pellets: number;
  disqualified: string | null;
  frames: number[][];  // Compact: [[time, x1,y1,z1, x2,y2,z2, ...], ...]
  pelletData: { position: Vector3; collectedAtFrame: number | null }[];
}

class RunStorage {
  private db: IDBDatabase | null = null;
  private currentRunId: string | null = null;
  private dbName = 'EvolutionLabDB';
  private dbVersion = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for run metadata
        if (!db.objectStoreNames.contains('runs')) {
          db.createObjectStore('runs', { keyPath: 'id' });
        }

        // Store for generation data
        if (!db.objectStoreNames.contains('generations')) {
          const genStore = db.createObjectStore('generations', { keyPath: ['runId', 'generation'] });
          genStore.createIndex('runId', 'runId', { unique: false });
        }
      };
    });
  }

  async createRun(config: SimulationConfig): Promise<string> {
    const id = `run_${Date.now()}`;
    this.currentRunId = id;

    const run: SavedRun = {
      id,
      startTime: Date.now(),
      config: { ...config },
      generationCount: 0
    };

    await this.putRun(run);
    return id;
  }

  getCurrentRunId(): string | null {
    return this.currentRunId;
  }

  setCurrentRunId(id: string | null): void {
    this.currentRunId = id;
  }

  private async putRun(run: SavedRun): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const tx = this.db.transaction('runs', 'readwrite');
      const store = tx.objectStore('runs');
      const request = store.put(run);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveGeneration(gen: number, results: CreatureSimulationResult[]): Promise<void> {
    if (!this.db || !this.currentRunId) return;

    // Convert to compact format
    const compactResults: CompactCreatureResult[] = results.map(r => ({
      genome: r.genome,
      fitness: Math.round(r.finalFitness * 1000) / 1000,
      pellets: r.pelletsCollected,
      disqualified: r.disqualified,
      frames: this.compactFrames(r.frames, r.genome),
      pelletData: r.pellets.map(p => ({
        position: {
          x: Math.round(p.position.x * 1000) / 1000,
          y: Math.round(p.position.y * 1000) / 1000,
          z: Math.round(p.position.z * 1000) / 1000
        },
        collectedAtFrame: p.collectedAtFrame
      }))
    }));

    const genData: GenerationData = {
      runId: this.currentRunId,
      generation: gen,
      results: compactResults
    };

    await this.putGeneration(genData);

    // Update run metadata
    const run = await this.getRun(this.currentRunId);
    if (run) {
      run.generationCount = gen + 1;
      await this.putRun(run);
    }
  }

  private compactFrames(frames: SimulationFrame[], genome: CreatureGenome): number[][] {
    // Convert frames to compact format: [time, x1,y1,z1, x2,y2,z2, ...]
    const nodeIds = genome.nodes.map(n => n.id);
    return frames.map(f => {
      const arr: number[] = [Math.round(f.time * 1000) / 1000];
      for (const nodeId of nodeIds) {
        const pos = f.nodePositions.get(nodeId);
        if (pos) {
          arr.push(
            Math.round(pos.x * 1000) / 1000,
            Math.round(pos.y * 1000) / 1000,
            Math.round(pos.z * 1000) / 1000
          );
        } else {
          arr.push(0, 0, 0);
        }
      }
      return arr;
    });
  }

  private expandFrames(compactFrames: number[][], genome: CreatureGenome): SimulationFrame[] {
    const nodeIds = genome.nodes.map(n => n.id);
    return compactFrames.map(arr => {
      const nodePositions = new Map<string, Vector3>();
      for (let i = 0; i < nodeIds.length; i++) {
        nodePositions.set(nodeIds[i], {
          x: arr[1 + i * 3],
          y: arr[1 + i * 3 + 1],
          z: arr[1 + i * 3 + 2]
        });
      }

      // Calculate center of mass
      let cx = 0, cy = 0, cz = 0;
      nodePositions.forEach(pos => {
        cx += pos.x;
        cy += pos.y;
        cz += pos.z;
      });
      const n = nodePositions.size || 1;

      return {
        time: arr[0],
        nodePositions,
        centerOfMass: { x: cx / n, y: cy / n, z: cz / n },
        activePelletIndex: 0
      };
    });
  }

  private async putGeneration(genData: GenerationData): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const tx = this.db.transaction('generations', 'readwrite');
      const store = tx.objectStore('generations');
      const request = store.put(genData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadGeneration(runId: string, gen: number): Promise<CreatureSimulationResult[] | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const tx = this.db.transaction('generations', 'readonly');
      const store = tx.objectStore('generations');
      const request = store.get([runId, gen]);

      request.onsuccess = () => {
        const genData = request.result as GenerationData | undefined;
        if (!genData) return resolve(null);

        // Expand compact format back to full results
        const results: CreatureSimulationResult[] = genData.results.map(r => ({
          genome: r.genome,
          frames: this.expandFrames(r.frames, r.genome),
          finalFitness: r.fitness,
          pelletsCollected: r.pellets,
          distanceTraveled: 0,
          netDisplacement: 0,
          closestPelletDistance: 0,
          pellets: r.pelletData.map((p, i) => ({
            id: `pellet_${i}`,
            position: p.position,
            collectedAtFrame: p.collectedAtFrame,
            spawnedAtFrame: 0
          })),
          fitnessOverTime: [],
          disqualified: r.disqualified as any
        }));

        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getRun(runId: string): Promise<SavedRun | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const tx = this.db.transaction('runs', 'readonly');
      const store = tx.objectStore('runs');
      const request = store.get(runId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllRuns(): Promise<SavedRun[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const tx = this.db.transaction('runs', 'readonly');
      const store = tx.objectStore('runs');
      const request = store.getAll();
      request.onsuccess = () => {
        const runs = request.result as SavedRun[];
        // Sort by start time descending (newest first)
        runs.sort((a, b) => b.startTime - a.startTime);
        resolve(runs);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteRun(runId: string): Promise<void> {
    if (!this.db) return;

    // Delete all generations for this run
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction('generations', 'readwrite');
      const store = tx.objectStore('generations');
      const index = store.index('runId');
      const request = index.openCursor(IDBKeyRange.only(runId));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });

    // Delete the run metadata
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction('runs', 'readwrite');
      const store = tx.objectStore('runs');
      const request = store.delete(runId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateRunThumbnail(thumbnail: string): Promise<void> {
    if (!this.currentRunId) return;
    const run = await this.getRun(this.currentRunId);
    if (run) {
      run.thumbnail = thumbnail;
      await this.putRun(run);
    }
  }

  async getMaxGeneration(runId: string): Promise<number> {
    const run = await this.getRun(runId);
    return run ? run.generationCount - 1 : -1;
  }
}

// Global storage instance
const runStorage = new RunStorage();

type AppState = 'menu' | 'grid' | 'replay';
type EvolutionStep = 'idle' | 'mutate' | 'simulate' | 'sort';

interface Config extends SimulationConfig {
  gravity: number;
  mutationRate: number;
  simulationDuration: number;
  pelletCount: number;
}

interface CreatureCard {
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  result: CreatureSimulationResult | null;
  rank: number;
  gridIndex: number;
  isDead: boolean;
  isMutated: boolean;
  isElite: boolean;
  parentId: string | null;  // Track lineage
  // For animation
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
}

// Grid layout constants
const GRID_COLS = 10;
const GRID_ROWS = 10;
const CARD_SIZE = 80;
const CARD_GAP = 8;

class EvolutionApp {
  private container: HTMLElement;
  private state: AppState = 'menu';
  private evolutionStep: EvolutionStep = 'idle';

  // Shared renderer for thumbnail generation
  private sharedRenderer: THREE.WebGLRenderer | null = null;
  private sharedScene: THREE.Scene | null = null;
  private sharedCamera: THREE.PerspectiveCamera | null = null;

  // Preview for menu
  private previewScene: THREE.Scene | null = null;
  private previewCamera: THREE.PerspectiveCamera | null = null;
  private previewRenderer: THREE.WebGLRenderer | null = null;
  private previewCreature: THREE.Group | null = null;
  private previewGenome: CreatureGenome | null = null;
  private previewTime: number = 0;

  // Replay
  private replayScene: THREE.Scene | null = null;
  private replayCamera: THREE.PerspectiveCamera | null = null;
  private replayRenderer: THREE.WebGLRenderer | null = null;
  private replayCreature: THREE.Group | null = null;
  private replayPellets: THREE.Mesh[] = [];
  private replayPelletLines: THREE.Line[] = [];

  // Population & simulation
  private population: Population | null = null;
  private simulationResults: CreatureSimulationResult[] = [];
  private generation: number = 0;
  private fitnessHistory: FitnessHistoryEntry[] = [];

  // History navigation
  private viewingGeneration: number | null = null;  // null = viewing current live generation
  private maxGeneration: number = 0;  // Highest generation number for current run

  // Best creature tracking
  private bestCreatureEver: CreatureSimulationResult | null = null;
  private bestCreatureGeneration: number = 0;

  // Longest surviving creature tracking (most generations in lineage)
  private longestSurvivingCreature: CreatureSimulationResult | null = null;
  private longestSurvivingGenerations: number = 0;

  // Creature cards
  private creatureCards: CreatureCard[] = [];
  private gridContainer: HTMLElement | null = null;

  // Graph panel
  private graphPanel: GraphPanel | null = null;

  // Config
  private config: Config = {
    ...DEFAULT_CONFIG,
    simulationDuration: 8,
    pelletCount: 5,
    gravity: -9.8,
    mutationRate: 0.1
  };

  // UI elements
  private menuScreen: HTMLElement | null = null;
  private gridUI: HTMLElement | null = null;
  private statsPanel: HTMLElement | null = null;
  private controlPanel: HTMLElement | null = null;
  private progressContainer: HTMLElement | null = null;
  private tooltip: HTMLElement | null = null;
  private replayModal: HTMLElement | null = null;
  private stepIndicator: HTMLElement | null = null;
  private loadRunsModal: HTMLElement | null = null;

  // State
  private selectedResult: CreatureSimulationResult | null = null;
  private replayFrame: number = 0;
  private isReplaying: boolean = false;
  private replayAnimationId: number | null = null;
  private isAutoRunning: boolean = false;

  constructor() {
    this.container = document.getElementById('app')!;
    this.init();
  }

  private async init(): Promise<void> {
    // Initialize storage first
    await runStorage.init();

    this.setupSharedRenderer();
    this.createMenuScreen();
    this.createGridUI();
    this.createTooltip();
    this.createReplayModal();
    this.graphPanel = new GraphPanel();
    this.showMenu();
  }

  private setupSharedRenderer(): void {
    // Create a single shared renderer for generating thumbnails
    this.sharedRenderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.sharedRenderer.setSize(160, 160);
    this.sharedRenderer.setClearColor(0x1e1e2a, 1);

    this.sharedScene = new THREE.Scene();
    this.sharedScene.background = new THREE.Color(0x1e1e2a);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.sharedScene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 0.6);
    sun.position.set(3, 5, 3);
    this.sharedScene.add(sun);

    this.sharedCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.sharedCamera.position.set(3, 2.5, 3);
    this.sharedCamera.lookAt(0, 0.3, 0);
  }

  // ============================================
  // MENU SCREEN
  // ============================================

  private createMenuScreen(): void {
    this.menuScreen = document.createElement('div');
    this.menuScreen.className = 'menu-screen';
    this.menuScreen.innerHTML = `
      <h1 class="menu-title">Evolution Lab</h1>
      <p class="menu-subtitle">Watch creatures evolve to collect pellets</p>
      <div class="menu-preview" id="preview-container"></div>
      <div class="menu-controls">
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; max-width: 450px;">
          <div class="param-group" style="width: 200px;">
            <div class="param-label">
              <span class="param-name">Gravity</span>
              <span class="param-value" id="gravity-value">-9.8</span>
            </div>
            <input type="range" class="param-slider" id="gravity-slider" min="-30" max="-5" step="0.1" value="-9.8">
          </div>
          <div class="param-group" style="width: 200px;">
            <div class="param-label">
              <span class="param-name">Mutation Rate</span>
              <span class="param-value" id="mutation-value">10%</span>
            </div>
            <input type="range" class="param-slider" id="mutation-slider" min="5" max="80" value="10">
          </div>
          <div class="param-group" style="width: 200px;">
            <div class="param-label">
              <span class="param-name">Max Frequency</span>
              <span class="param-value" id="frequency-value">3.0 Hz</span>
            </div>
            <input type="range" class="param-slider" id="frequency-slider" min="1" max="10" step="0.5" value="3">
          </div>
          <div class="param-group" style="width: 200px;">
            <div class="param-label">
              <span class="param-name">Sim Duration</span>
              <span class="param-value" id="duration-value">8s</span>
            </div>
            <input type="range" class="param-slider" id="duration-slider" min="3" max="20" value="8">
          </div>
          <div class="param-group" style="width: 200px;">
            <div class="param-label">
              <span class="param-name">Max Nodes</span>
              <span class="param-value" id="maxnodes-value">8</span>
            </div>
            <input type="range" class="param-slider" id="maxnodes-slider" min="2" max="15" value="8">
          </div>
          <div class="param-group" style="width: 200px;">
            <div class="param-label">
              <span class="param-name">Max Muscles</span>
              <span class="param-value" id="maxmuscles-value">15</span>
            </div>
            <input type="range" class="param-slider" id="maxmuscles-slider" min="1" max="30" value="15">
          </div>
        </div>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-primary" id="start-btn">
            <span>Start Evolution</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
          <button class="btn btn-secondary" id="load-run-btn">
            <span>Load Run</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    this.container.appendChild(this.menuScreen);
    this.setupPreview();
    this.createLoadRunsModal();

    document.getElementById('start-btn')!.addEventListener('click', () => this.startSimulation());
    document.getElementById('load-run-btn')!.addEventListener('click', () => this.showLoadRunsModal());

    const gravitySlider = document.getElementById('gravity-slider') as HTMLInputElement;
    gravitySlider.addEventListener('input', () => {
      this.config.gravity = parseInt(gravitySlider.value);
      document.getElementById('gravity-value')!.textContent = gravitySlider.value;
      this.updateSettingsInfoBox();
    });

    const mutationSlider = document.getElementById('mutation-slider') as HTMLInputElement;
    mutationSlider.addEventListener('input', () => {
      this.config.mutationRate = parseInt(mutationSlider.value) / 100;
      document.getElementById('mutation-value')!.textContent = mutationSlider.value + '%';
      this.updateSettingsInfoBox();
    });

    const frequencySlider = document.getElementById('frequency-slider') as HTMLInputElement;
    frequencySlider.addEventListener('input', () => {
      this.config.maxAllowedFrequency = parseFloat(frequencySlider.value);
      document.getElementById('frequency-value')!.textContent = frequencySlider.value + ' Hz';
      this.updateSettingsInfoBox();
    });

    const durationSlider = document.getElementById('duration-slider') as HTMLInputElement;
    durationSlider.addEventListener('input', () => {
      this.config.simulationDuration = parseInt(durationSlider.value);
      document.getElementById('duration-value')!.textContent = durationSlider.value + 's';
      this.updateSettingsInfoBox();
    });

    const maxNodesSlider = document.getElementById('maxnodes-slider') as HTMLInputElement;
    maxNodesSlider.addEventListener('input', () => {
      this.config.maxNodes = parseInt(maxNodesSlider.value);
      document.getElementById('maxnodes-value')!.textContent = maxNodesSlider.value;
      this.regeneratePreviewCreature();
      this.updateSettingsInfoBox();
    });

    const maxMusclesSlider = document.getElementById('maxmuscles-slider') as HTMLInputElement;
    maxMusclesSlider.addEventListener('input', () => {
      this.config.maxMuscles = parseInt(maxMusclesSlider.value);
      document.getElementById('maxmuscles-value')!.textContent = maxMusclesSlider.value;
      this.regeneratePreviewCreature();
      this.updateSettingsInfoBox();
    });

    const frequencySlider2 = document.getElementById('frequency-slider') as HTMLInputElement;
    frequencySlider2.addEventListener('change', () => {
      // Regenerate on frequency change to show max frequency effect
      this.regeneratePreviewCreature();
    });
  }

  private setupPreview(): void {
    const container = document.getElementById('preview-container')!;

    this.previewScene = new THREE.Scene();
    this.previewScene.background = new THREE.Color(0x0f0f14);

    this.previewCamera = new THREE.PerspectiveCamera(50, 400 / 300, 0.1, 100);
    this.previewCamera.position.set(4, 3, 6);
    this.previewCamera.lookAt(0, 1, 0);

    this.previewRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.previewRenderer.setSize(400, 300);
    this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.previewRenderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.previewScene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(5, 10, 5);
    this.previewScene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.previewScene.add(ground);

    const grid = new THREE.GridHelper(20, 20, 0x252532, 0x252532);
    grid.position.y = 0.01;
    this.previewScene.add(grid);

    // Pellets
    const pelletMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.3
    });
    for (let i = 0; i < 3; i++) {
      const pellet = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), pelletMaterial);
      pellet.position.set((Math.random() - 0.5) * 6, 0.25, (Math.random() - 0.5) * 6);
      this.previewScene.add(pellet);
    }

    this.regeneratePreviewCreature();

    this.animatePreview();
  }

  private regeneratePreviewCreature(): void {
    if (!this.previewScene) return;

    // Remove old creature
    if (this.previewCreature) {
      this.previewScene.remove(this.previewCreature);
    }

    // Generate creature at MAX complexity so user can see what the limits look like
    // Node count is limited by muscle count (need N-1 muscles to connect N nodes)
    const effectiveMaxNodes = Math.min(this.config.maxNodes, this.config.maxMuscles + 1);
    const constraints = {
      minNodes: effectiveMaxNodes,  // Force max nodes (within muscle limit)
      maxNodes: effectiveMaxNodes,
      minMuscles: 1,
      maxMuscles: this.config.maxMuscles,
      minSize: 0.2,
      maxSize: 0.8,
      minStiffness: 50,
      maxStiffness: 500,
      minFrequency: 0.5,
      maxFrequency: this.config.maxAllowedFrequency,
      maxAmplitude: 0.4,
      spawnRadius: 2.0
    };

    this.previewGenome = generateRandomGenome(constraints);
    this.previewCreature = this.createCreatureMesh(this.previewGenome);
    this.previewScene.add(this.previewCreature);
  }

  private createCreatureMesh(genome: CreatureGenome): THREE.Group {
    const group = new THREE.Group();

    // Find min/max for normalization
    let maxStiffness = 0, minStiffness = Infinity;
    let maxFreq = 0, minFreq = Infinity;
    for (const muscle of genome.muscles) {
      if (muscle.stiffness > maxStiffness) maxStiffness = muscle.stiffness;
      if (muscle.stiffness < minStiffness) minStiffness = muscle.stiffness;
      const effectiveFreq = muscle.frequency * genome.globalFrequencyMultiplier;
      if (effectiveFreq > maxFreq) maxFreq = effectiveFreq;
      if (effectiveFreq < minFreq) minFreq = effectiveFreq;
    }

    const nodeMeshes = new Map<string, THREE.Mesh>();
    for (const node of genome.nodes) {
      // NODE COLOR BY FRICTION:
      // Low friction (0.3) = bright cyan (slippery, icy)
      // High friction (0.9) = dark orange/brown (grippy, rubber)
      const frictionNorm = (node.friction - 0.3) / 0.6; // Normalize 0.3-0.9 to 0-1
      const frictionHue = THREE.MathUtils.lerp(0.5, 0.08, frictionNorm); // Cyan to orange
      const frictionSat = THREE.MathUtils.lerp(0.9, 0.7, frictionNorm);
      const frictionLight = THREE.MathUtils.lerp(0.6, 0.35, frictionNorm); // Brighter when slippery
      const nodeColor = new THREE.Color().setHSL(frictionHue, frictionSat, frictionLight);
      const nodeMaterial = new THREE.MeshStandardMaterial({
        color: nodeColor,
        roughness: THREE.MathUtils.lerp(0.2, 0.8, frictionNorm), // Shiny when slippery
        metalness: THREE.MathUtils.lerp(0.4, 0.1, frictionNorm)
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(node.size * 0.5, 16, 16), nodeMaterial);
      mesh.position.set(node.position.x, node.position.y, node.position.z);
      mesh.userData = { nodeId: node.id, friction: node.friction, originalPos: { ...node.position } };
      nodeMeshes.set(node.id, mesh);
      group.add(mesh);
    }

    for (const muscle of genome.muscles) {
      const nodeA = nodeMeshes.get(muscle.nodeA);
      const nodeB = nodeMeshes.get(muscle.nodeB);
      if (!nodeA || !nodeB) continue;

      // MUSCLE COLOR BY FREQUENCY:
      // Slow frequency = deep blue (calm)
      // Fast frequency = bright red/orange (energetic)
      const effectiveFreq = muscle.frequency * genome.globalFrequencyMultiplier;
      const freqNorm = maxFreq > minFreq
        ? (effectiveFreq - minFreq) / (maxFreq - minFreq)
        : 0.5;
      // Blue (0.6) to Red (0.0)
      const freqHue = THREE.MathUtils.lerp(0.6, 0.0, freqNorm);
      const muscleColor = new THREE.Color().setHSL(freqHue, 0.9, 0.5);

      // MUSCLE THICKNESS BY STIFFNESS:
      // Low stiffness = thin (0.03)
      // High stiffness = thick (0.12)
      const stiffnessNorm = maxStiffness > minStiffness
        ? (muscle.stiffness - minStiffness) / (maxStiffness - minStiffness)
        : 0.5;
      const thickness = 0.03 + stiffnessNorm * 0.09;

      const muscleMaterial = new THREE.MeshStandardMaterial({
        color: muscleColor,
        roughness: 0.4,
        emissive: muscleColor,
        emissiveIntensity: 0.15
      });

      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(thickness, thickness, 1, 8),
        muscleMaterial
      );
      mesh.userData = { nodeA: muscle.nodeA, nodeB: muscle.nodeB };
      this.updateMuscleMesh(mesh, nodeA.position, nodeB.position);
      group.add(mesh);
    }

    group.userData = { genome, nodeMeshes };
    return group;
  }

  private updateMuscleMesh(mesh: THREE.Mesh, posA: THREE.Vector3, posB: THREE.Vector3): void {
    const direction = posB.clone().sub(posA);
    const length = direction.length();
    mesh.position.copy(posA.clone().add(posB).multiplyScalar(0.5));
    mesh.scale.set(1, length, 1);
    if (length > 0.001) {
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    }
  }

  private animatePreview = (): void => {
    if (this.state !== 'menu' || !this.previewRenderer || !this.previewScene || !this.previewCamera) return;

    requestAnimationFrame(this.animatePreview);
    this.previewTime += 0.016;

    if (this.previewCreature && this.previewGenome) {
      const nodeMeshes = this.previewCreature.userData.nodeMeshes as Map<string, THREE.Mesh>;

      // Gravity effect: stronger gravity (more negative) = more sag
      // Base gravity is -9.8, range is -5 to -30
      // Normalize: -9.8 = 0 sag, -30 = max sag
      const gravityStrength = Math.abs(this.config.gravity);
      const gravitySag = Math.max(0, (gravityStrength - 9.8) / 20) * 0.5; // 0 to 0.5 sag

      for (const node of this.previewGenome.nodes) {
        const mesh = nodeMeshes.get(node.id);
        if (!mesh) continue;

        let x = node.position.x, y = node.position.y, z = node.position.z;

        for (const muscle of this.previewGenome.muscles) {
          if (muscle.nodeA !== node.id && muscle.nodeB !== node.id) continue;

          const freq = muscle.frequency * this.previewGenome.globalFrequencyMultiplier;
          const contraction = Math.sin(this.previewTime * freq * Math.PI * 2 + muscle.phase);
          const amount = contraction * muscle.amplitude * 0.3;

          const otherNodeId = muscle.nodeA === node.id ? muscle.nodeB : muscle.nodeA;
          const otherNode = this.previewGenome.nodes.find(n => n.id === otherNodeId);
          if (!otherNode) continue;

          const dx = node.position.x - otherNode.position.x;
          const dy = node.position.y - otherNode.position.y;
          const dz = node.position.z - otherNode.position.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist > 0.01) {
            x += (dx / dist) * amount;
            y += (dy / dist) * amount;
            z += (dz / dist) * amount;
          }
        }

        // Apply gravity sag - nodes higher up sag more
        const heightFactor = Math.max(0, node.position.y - 0.5);
        const nodeSag = gravitySag * heightFactor;

        mesh.position.set(x, Math.max(node.size * 0.5, y - nodeSag), z);
      }

      for (const child of this.previewCreature.children) {
        if (child.userData.nodeA) {
          const nodeA = nodeMeshes.get(child.userData.nodeA);
          const nodeB = nodeMeshes.get(child.userData.nodeB);
          if (nodeA && nodeB) {
            this.updateMuscleMesh(child as THREE.Mesh, nodeA.position, nodeB.position);
          }
        }
      }
    }

    this.previewRenderer.render(this.previewScene, this.previewCamera);
  };

  private showMenu(): void {
    this.state = 'menu';
    if (this.menuScreen) this.menuScreen.style.display = 'flex';
    if (this.gridUI) this.gridUI.style.display = 'none';
    if (this.graphPanel) this.graphPanel.hide();
    this.animatePreview();
  }

  // ============================================
  // GRID VIEW
  // ============================================

  private createGridUI(): void {
    this.gridUI = document.createElement('div');
    this.gridUI.style.cssText = 'display: none; width: 100%; height: 100%; position: relative;';

    // Stats panel
    this.statsPanel = document.createElement('div');
    this.statsPanel.className = 'stats-panel glass';
    this.statsPanel.innerHTML = this.getStatsHTML();
    this.gridUI.appendChild(this.statsPanel);

    // Step indicator
    this.stepIndicator = document.createElement('div');
    this.stepIndicator.className = 'step-indicator glass';
    this.stepIndicator.innerHTML = this.getStepIndicatorHTML();
    this.gridUI.appendChild(this.stepIndicator);

    // Settings info box (top right)
    const settingsBox = document.createElement('div');
    settingsBox.className = 'glass';
    settingsBox.id = 'settings-info-box';
    settingsBox.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      font-size: 11px;
      color: var(--text-muted);
      border-radius: 8px;
    `;
    settingsBox.innerHTML = this.getSettingsInfoHTML();
    this.gridUI.appendChild(settingsBox);

    // Grid container for creature cards - use absolute positioning for animations
    this.gridContainer = document.createElement('div');
    this.gridContainer.className = 'creature-grid';
    const gridWidth = GRID_COLS * CARD_SIZE + (GRID_COLS - 1) * CARD_GAP;
    const gridHeight = GRID_ROWS * CARD_SIZE + (GRID_ROWS - 1) * CARD_GAP;
    this.gridContainer.style.cssText = `
      position: absolute;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      width: ${gridWidth}px;
      height: ${gridHeight}px;
      padding: 16px;
      border-radius: 12px;
    `;
    this.gridUI.appendChild(this.gridContainer);

    // Control panel
    this.controlPanel = document.createElement('div');
    this.controlPanel.className = 'control-panel glass';
    this.controlPanel.innerHTML = `
      <button class="btn btn-primary" id="next-step-btn">Start Simulation</button>
      <div class="control-divider"></div>
      <button class="btn btn-secondary btn-small" id="run-1x-btn">1x</button>
      <button class="btn btn-secondary btn-small" id="run-10x-btn">10x</button>
      <button class="btn btn-secondary btn-small" id="run-100x-btn">100x</button>
      <div class="control-divider"></div>
      <button class="btn btn-secondary btn-small" id="graph-btn">Graph</button>
      <button class="btn btn-secondary btn-small" id="reset-btn">Reset</button>
    `;
    this.gridUI.appendChild(this.controlPanel);

    // Progress container
    this.progressContainer = document.createElement('div');
    this.progressContainer.className = 'progress-container glass';
    this.progressContainer.style.display = 'none';
    this.progressContainer.innerHTML = `
      <div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div>
      <div class="progress-text">Simulating creatures...</div>
    `;
    this.gridUI.appendChild(this.progressContainer);

    this.container.appendChild(this.gridUI);

    // Bind events
    this.gridUI.querySelector('#next-step-btn')?.addEventListener('click', () => this.executeNextStep());
    this.gridUI.querySelector('#run-1x-btn')?.addEventListener('click', () => this.autoRun(1));
    this.gridUI.querySelector('#run-10x-btn')?.addEventListener('click', () => this.autoRun(10));
    this.gridUI.querySelector('#run-100x-btn')?.addEventListener('click', () => this.autoRun(100));
    this.gridUI.querySelector('#graph-btn')?.addEventListener('click', () => this.graphPanel?.toggle());
    this.gridUI.querySelector('#reset-btn')?.addEventListener('click', () => this.reset());
  }

  private getGridPosition(index: number): { x: number; y: number } {
    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);
    return {
      x: col * (CARD_SIZE + CARD_GAP),
      y: row * (CARD_SIZE + CARD_GAP)
    };
  }

  private getStatsHTML(): string {
    const validResults = this.simulationResults.filter(r => !isNaN(r.finalFitness) && isFinite(r.finalFitness));
    const hasResults = validResults.length > 0;

    const best = hasResults ? Math.max(...validResults.map(r => r.finalFitness)) : 0;
    const avg = hasResults
      ? validResults.reduce((sum, r) => sum + r.finalFitness, 0) / validResults.length
      : 0;
    const worst = hasResults ? Math.min(...validResults.map(r => r.finalFitness)) : 0;

    const bestEverFitness = this.bestCreatureEver
      ? this.bestCreatureEver.finalFitness.toFixed(1)
      : '-';

    const longestSurvivingFitness = this.longestSurvivingCreature
      ? this.longestSurvivingCreature.finalFitness.toFixed(1)
      : '-';

    // Determine if we're viewing history (not on the current live generation)
    const isViewingHistory = this.viewingGeneration !== null;
    const displayGen = this.viewingGeneration !== null ? this.viewingGeneration : this.generation;
    const canGoPrev = displayGen > 0;
    // Can go next if viewing history and there's either a saved gen ahead OR the current live gen is ahead
    const canGoNext = isViewingHistory && (this.viewingGeneration! < this.maxGeneration || this.viewingGeneration! < this.generation);

    return `
      <div class="stats-title gen-nav">
        <button class="gen-nav-btn" id="prev-gen-btn" ${canGoPrev ? '' : 'disabled'}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span class="gen-display" id="gen-display" title="Click to jump to a specific generation">
          ${isViewingHistory
            ? `<span class="gen-viewing">${displayGen}</span><span class="gen-separator">/</span><span class="gen-max" id="goto-current-gen">${this.generation}</span>`
            : `Generation ${displayGen}`}
        </span>
        <button class="gen-nav-btn" id="next-gen-btn" ${canGoNext ? '' : 'disabled'}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      ${isViewingHistory ? '<div class="history-badge">VIEWING HISTORY</div>' : ''}
      <div class="stat-row">
        <span class="stat-label">Creatures</span>
        <span class="stat-value">${this.creatureCards.length}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Best Fitness</span>
        <span class="stat-value success">${hasResults ? best.toFixed(1) : '-'}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Avg Fitness</span>
        <span class="stat-value accent">${hasResults ? avg.toFixed(1) : '-'}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Worst Fitness</span>
        <span class="stat-value danger">${hasResults ? worst.toFixed(1) : '-'}</span>
      </div>

      ${this.longestSurvivingCreature ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Longest Survivor: <span style="color: #a855f7;">${this.getCreatureName(this.longestSurvivingCreature.genome)}</span></div>
          <div id="longest-creature-card" style="
            width: 80px;
            height: 80px;
            background: var(--bg-card);
            border: 2px solid #a855f7;
            border-radius: 8px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 15px rgba(168, 85, 247, 0.3);
            transition: transform 0.2s;
          ">
            <canvas id="longest-creature-canvas" width="160" height="160" style="width: 100%; height: 100%;"></canvas>
            <span style="
              position: absolute;
              bottom: 4px;
              right: 4px;
              font-size: 9px;
              font-weight: 600;
              color: #a855f7;
              background: rgba(0, 0, 0, 0.6);
              padding: 2px 5px;
              border-radius: 4px;
            ">${longestSurvivingFitness}</span>
          </div>
        </div>
      ` : ''}

      ${this.bestCreatureEver ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Best Ever (Gen ${this.bestCreatureGeneration})</div>
          <div id="best-creature-card" style="
            width: 80px;
            height: 80px;
            background: var(--bg-card);
            border: 2px solid #ffd700;
            border-radius: 8px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
            transition: transform 0.2s;
          ">
            <canvas id="best-creature-canvas" width="160" height="160" style="width: 100%; height: 100%;"></canvas>
            <span style="
              position: absolute;
              bottom: 4px;
              right: 4px;
              font-size: 9px;
              font-weight: 600;
              color: #ffd700;
              background: rgba(0, 0, 0, 0.6);
              padding: 2px 5px;
              border-radius: 4px;
            ">${bestEverFitness}</span>
          </div>
        </div>
      ` : ''}
    `;
  }

  private getStepIndicatorHTML(): string {
    const steps = [
      { key: 'mutate', label: 'Mutate', num: 1 },
      { key: 'simulate', label: 'Simulate', num: 2 },
      { key: 'sort', label: 'Sort', num: 3 }
    ];

    const currentIndex = steps.findIndex(s => s.key === this.evolutionStep);

    return steps.map((step, i) => {
      const isActive = step.key === this.evolutionStep;
      const isDone = currentIndex > i || (this.evolutionStep === 'idle' && this.generation > 0);
      const circleClass = isActive ? 'active' : (isDone ? 'done' : '');
      const labelClass = isActive ? 'active' : (isDone ? 'done' : '');

      const connector = i < steps.length - 1
        ? `<div class="step-connector ${isDone || (currentIndex > i) ? 'done' : ''}"></div>`
        : '';

      return `
        <div class="step-item">
          <div class="step-circle ${circleClass}">${isDone && !isActive ? '✓' : step.num}</div>
          <span class="step-label ${labelClass}">${step.label}</span>
        </div>
        ${connector}
      `;
    }).join('');
  }

  private getSettingsInfoHTML(): string {
    return `
      <div style="color: var(--text-secondary); font-weight: 600; margin-bottom: 8px;">Settings</div>
      <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px;">
        <span>Gravity:</span><span style="color: var(--text-primary);">${this.config.gravity}</span>
        <span>Mutation:</span><span style="color: var(--text-primary);">${Math.round(this.config.mutationRate * 100)}%</span>
        <span>Max Freq:</span><span style="color: var(--text-primary);">${this.config.maxAllowedFrequency} Hz</span>
        <span>Duration:</span><span style="color: var(--text-primary);">${this.config.simulationDuration}s</span>
        <span>Max Nodes:</span><span style="color: var(--text-primary);">${this.config.maxNodes}</span>
        <span>Max Muscles:</span><span style="color: var(--text-primary);">${this.config.maxMuscles}</span>
      </div>
    `;
  }

  private updateSettingsInfoBox(): void {
    const settingsBox = document.getElementById('settings-info-box');
    if (settingsBox) {
      settingsBox.innerHTML = this.getSettingsInfoHTML();
    }
  }

  private updateStats(): void {
    if (this.statsPanel) {
      this.statsPanel.innerHTML = this.getStatsHTML();

      // Add generation navigation event handlers
      const prevBtn = document.getElementById('prev-gen-btn');
      const nextBtn = document.getElementById('next-gen-btn');
      const genDisplay = document.getElementById('gen-display');
      const gotoCurrentBtn = document.getElementById('goto-current-gen');

      prevBtn?.addEventListener('click', () => this.navigateToGeneration('prev'));
      nextBtn?.addEventListener('click', () => this.navigateToGeneration('next'));
      genDisplay?.addEventListener('click', () => this.promptJumpToGeneration());
      gotoCurrentBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.goToCurrentGeneration();
      });

      // Render longest surviving creature thumbnail and add event listeners
      if (this.longestSurvivingCreature) {
        const canvas = document.getElementById('longest-creature-canvas') as HTMLCanvasElement;
        const card = document.getElementById('longest-creature-card') as HTMLElement;

        if (canvas && card) {
          this.renderCreatureToCanvas(this.longestSurvivingCreature, canvas);

          card.addEventListener('mouseenter', (e) => {
            card.style.transform = 'scale(1.05)';
            this.showLongestSurvivingTooltip(e);
          });
          card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
            this.hideTooltip();
          });
          card.addEventListener('click', () => {
            if (this.longestSurvivingCreature) {
              this.showReplay(this.longestSurvivingCreature);
            }
          });
        }
      }

      // Render best creature thumbnail and add event listeners
      if (this.bestCreatureEver) {
        const canvas = document.getElementById('best-creature-canvas') as HTMLCanvasElement;
        const card = document.getElementById('best-creature-card') as HTMLElement;

        if (canvas && card) {
          this.renderCreatureToCanvas(this.bestCreatureEver, canvas);

          card.addEventListener('mouseenter', (e) => {
            card.style.transform = 'scale(1.05)';
            this.showBestCreatureTooltip(e);
          });
          card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
            this.hideTooltip();
          });
          card.addEventListener('click', () => {
            if (this.bestCreatureEver) {
              this.showReplay(this.bestCreatureEver);
            }
          });
        }
      }
    }
    if (this.stepIndicator) this.stepIndicator.innerHTML = this.getStepIndicatorHTML();
  }

  private showBestCreatureTooltip(e: MouseEvent): void {
    if (!this.tooltip || !this.bestCreatureEver) return;

    const result = this.bestCreatureEver;
    const genome = result.genome;

    this.tooltip.innerHTML = `
      <div class="tooltip-title" style="color: #ffd700;">Best Ever</div>
      <div class="tooltip-row">
        <span class="tooltip-label">Generation</span>
        <span class="tooltip-value">${this.bestCreatureGeneration}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Fitness</span>
        <span class="tooltip-value" style="color: #ffd700">${result.finalFitness.toFixed(1)}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Pellets</span>
        <span class="tooltip-value">${result.pelletsCollected}/${result.pellets.length}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Distance</span>
        <span class="tooltip-value">${result.distanceTraveled.toFixed(1)}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Nodes</span>
        <span class="tooltip-value">${genome.nodes.length}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Muscles</span>
        <span class="tooltip-value">${genome.muscles.length}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Parents</span>
        <span class="tooltip-value">${genome.parentIds.length > 0 ? genome.parentIds.length : 'None'}</span>
      </div>
      <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">Click to replay</div>
    `;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.tooltip.style.left = `${rect.right + 10}px`;
    this.tooltip.style.top = `${rect.top}px`;
    this.tooltip.classList.add('visible');
  }

  private showLongestSurvivingTooltip(e: MouseEvent): void {
    if (!this.tooltip || !this.longestSurvivingCreature) return;

    const result = this.longestSurvivingCreature;
    const genome = result.genome;
    const creatureName = this.getCreatureName(genome);

    this.tooltip.innerHTML = `
      <div class="tooltip-title" style="color: #a855f7;">${creatureName}</div>
      <div class="tooltip-row">
        <span class="tooltip-label">Survived</span>
        <span class="tooltip-value" style="color: #a855f7">${genome.survivalStreak} consecutive gens</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Fitness</span>
        <span class="tooltip-value">${result.finalFitness.toFixed(1)}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Pellets</span>
        <span class="tooltip-value">${result.pelletsCollected}/${result.pellets.length}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Distance</span>
        <span class="tooltip-value">${result.distanceTraveled.toFixed(1)}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Nodes</span>
        <span class="tooltip-value">${genome.nodes.length}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Muscles</span>
        <span class="tooltip-value">${genome.muscles.length}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Origin</span>
        <span class="tooltip-value">${genome.parentIds.length === 0 ? 'Original' : genome.parentIds.length === 1 ? 'Mutant' : 'Crossover'}</span>
      </div>
      <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">Click to replay</div>
    `;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.tooltip.style.left = `${rect.right + 10}px`;
    this.tooltip.style.top = `${rect.top}px`;
    this.tooltip.classList.add('visible');
  }

  private updateNextButton(customText?: string): void {
    const btn = document.getElementById('next-step-btn');
    if (!btn) return;

    if (customText) {
      btn.textContent = customText;
      return;
    }

    // Button shows the NEXT action to perform
    const labels: Record<EvolutionStep, string> = {
      'idle': this.generation === 0 ? 'Start Simulation' : 'Mutate',
      'mutate': 'Mutate',  // Shouldn't see this, we go straight to simulate
      'simulate': 'Simulate',
      'sort': 'Sort'
    };

    btn.textContent = labels[this.evolutionStep];
  }

  // Render a creature to a 2D canvas using the shared renderer
  private renderCreatureToCanvas(result: CreatureSimulationResult, canvas: HTMLCanvasElement): void {
    if (!this.sharedRenderer || !this.sharedScene || !this.sharedCamera) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous creatures from shared scene (keep lights)
    const toRemove: THREE.Object3D[] = [];
    this.sharedScene.traverse((obj) => {
      if (obj.type === 'Group') toRemove.push(obj);
    });
    toRemove.forEach(obj => this.sharedScene!.remove(obj));

    // Create and add creature
    const creature = this.createCreatureMesh(result.genome);
    this.sharedScene.add(creature);

    // Calculate bounds and center
    const box = new THREE.Box3().setFromObject(creature);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const targetSize = 2;
    const scaleFactor = maxDim > 0 ? targetSize / maxDim : 1;
    creature.scale.setScalar(scaleFactor);

    box.setFromObject(creature);
    box.getCenter(center);
    creature.position.sub(center);
    creature.position.y += 0.3;

    // Apply final frame positions if available
    const finalFrame = result.frames[result.frames.length - 1];
    if (finalFrame) {
      const nodeMeshes = creature.userData.nodeMeshes as Map<string, THREE.Mesh>;

      let cx = 0, cy = 0, cz = 0, count = 0;
      for (const [, pos] of finalFrame.nodePositions) {
        cx += pos.x; cy += pos.y; cz += pos.z; count++;
      }
      if (count > 0) { cx /= count; cy /= count; cz /= count; }

      for (const [nodeId, pos] of finalFrame.nodePositions) {
        const mesh = nodeMeshes.get(nodeId);
        if (mesh) {
          mesh.position.set(
            (pos.x - cx) * scaleFactor,
            (pos.y - cy) * scaleFactor + 0.3,
            (pos.z - cz) * scaleFactor
          );
        }
      }
      for (const child of creature.children) {
        if (child.userData.nodeA) {
          const nodeA = nodeMeshes.get(child.userData.nodeA);
          const nodeB = nodeMeshes.get(child.userData.nodeB);
          if (nodeA && nodeB) this.updateMuscleMesh(child as THREE.Mesh, nodeA.position, nodeB.position);
        }
      }
    }

    // Render
    this.sharedRenderer.render(this.sharedScene, this.sharedCamera);

    // Copy to 2D canvas
    ctx.drawImage(this.sharedRenderer.domElement, 0, 0, canvas.width, canvas.height);

    // Clean up
    this.sharedScene.remove(creature);
  }

  private createCreatureCards(): void {
    if (!this.gridContainer) return;

    this.gridContainer.innerHTML = '';
    this.creatureCards = [];

    // Sort by fitness for initial display
    const sorted = [...this.simulationResults]
      .map((r, i) => ({ result: r, originalIndex: i }))
      .sort((a, b) => {
        const aFit = isNaN(a.result.finalFitness) ? -Infinity : a.result.finalFitness;
        const bFit = isNaN(b.result.finalFitness) ? -Infinity : b.result.finalFitness;
        return bFit - aFit;
      });

    for (let i = 0; i < sorted.length; i++) {
      const { result } = sorted[i];
      const pos = this.getGridPosition(i);
      const card = this.createSingleCard(result, i + 1, i, pos.x, pos.y);
      this.creatureCards.push(card);
      this.gridContainer.appendChild(card.element);
    }
  }

  // Generate a short unique name from genome characteristics
  private getCreatureName(genome: CreatureGenome): string {
    // Extract unique number from ID (format: creature_timestamp_counter)
    const idParts = genome.id.split('_');
    const counter = parseInt(idParts[idParts.length - 1]) || 0;

    // First letter: based on color hue (26 letters for color spectrum)
    const hueLetters = 'ROYGBVPMCSTAWDELFHIJKNQUXZ';
    const hueLetter = hueLetters[Math.floor(genome.color.h * 26) % 26];

    // Second letter: based on body structure (nodes + muscles combo)
    const structLetters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const structIndex = (genome.nodes.length * 3 + genome.muscles.length) % structLetters.length;
    const structLetter = structLetters[structIndex];

    // Number: unique counter (mod 1000 to keep it short)
    const num = counter % 1000;

    // Base name like "RB42"
    const baseName = `${hueLetter}${structLetter}${num}`;

    // Add survival streak suffix if creature has survived generations
    if (genome.survivalStreak > 0) {
      return `${baseName}★${genome.survivalStreak}`;
    }
    return baseName;
  }

  private createSingleCard(
    result: CreatureSimulationResult,
    rank: number,
    gridIndex: number,
    x: number,
    y: number,
    parentId: string | null = null
  ): CreatureCard {
    const element = document.createElement('div');
    element.className = 'creature-card';
    element.style.cssText = `
      width: ${CARD_SIZE}px;
      height: ${CARD_SIZE}px;
      border-radius: 8px;
      background: #1e1e2a;
      border: 2px solid rgba(255,255,255,0.2);
      cursor: pointer;
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      overflow: hidden;
    `;

    const isElite = rank <= this.config.populationSize * 0.1;
    const isDisqualified = result.disqualified !== null;

    if (isDisqualified) {
      element.style.borderColor = '#ef4444';
      element.style.opacity = '0.6';
      element.style.cursor = 'not-allowed';
    } else if (isElite) {
      element.style.borderColor = '#10b981';
      element.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.3)';
    }

    const hasFitness = !isNaN(result.finalFitness) && isFinite(result.finalFitness);
    const fitnessValue = hasFitness ? result.finalFitness : 0;
    const fitnessText = hasFitness ? fitnessValue.toFixed(0) : '...';

    const creatureName = this.getCreatureName(result.genome);
    const rankLabel = document.createElement('span');
    rankLabel.className = 'creature-card-rank';
    // Show "DQ" prefix for disqualified creatures
    rankLabel.textContent = isDisqualified ? `DQ: ${creatureName}` : creatureName;
    rankLabel.style.cssText = `
      position: absolute;
      top: 4px;
      left: 4px;
      font-size: 9px;
      font-weight: 600;
      color: #7a8494;
      background: rgba(0, 0, 0, 0.6);
      padding: 2px 5px;
      border-radius: 4px;
      z-index: 10;
    `;

    const fitnessLabel = document.createElement('span');
    fitnessLabel.className = 'creature-card-fitness';
    fitnessLabel.textContent = fitnessText;
    fitnessLabel.style.cssText = `
      position: absolute;
      bottom: 4px;
      right: 4px;
      font-size: 9px;
      font-weight: 600;
      color: ${hasFitness ? '#10b981' : '#7a8494'};
      background: rgba(0, 0, 0, 0.6);
      padding: 2px 5px;
      border-radius: 4px;
      z-index: 10;
    `;

    // Use 2D canvas instead of WebGL
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    canvas.style.cssText = 'width: 100%; height: 100%; display: block;';

    element.appendChild(canvas);
    element.appendChild(rankLabel);
    element.appendChild(fitnessLabel);

    // Get 2D context
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1e1e2a';
    ctx.fillRect(0, 0, 160, 160);

    // Render creature (uses frames if available, otherwise renders from genome)
    this.renderCreatureToCanvas(result, canvas);

    // Create card object FIRST so event listeners can reference it
    const card: CreatureCard = {
      element,
      canvas,
      ctx,
      result,
      rank,
      gridIndex,
      isDead: false,
      isMutated: false,
      isElite,
      parentId,
      currentX: x,
      currentY: y,
      targetX: x,
      targetY: y
    };

    // Events - reference card object so they get updated values
    element.addEventListener('mouseenter', (e) => {
      element.style.transform = 'scale(1.05)';
      element.style.zIndex = '10';
      element.style.borderColor = '#6366f1';
      this.showCardTooltip(e, card);
    });
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'scale(1)';
      element.style.zIndex = '1';
      element.style.borderColor = card.isElite ? '#10b981' : 'rgba(255,255,255,0.2)';
      this.hideTooltip();
    });
    element.addEventListener('click', () => {
      // Don't allow replay for disqualified creatures
      if (card.result && card.result.frames.length > 0 && !card.result.disqualified) {
        this.showReplay(card.result);
      }
    });

    return card;
  }

  private showCardTooltip(e: MouseEvent, card: CreatureCard): void {
    const result = card.result;
    if (!result) return;
    if (!this.tooltip) return;

    const genome = result.genome;
    const creatureName = this.getCreatureName(genome);
    const avgStiffness = genome.muscles.length > 0
      ? genome.muscles.reduce((sum, m) => sum + m.stiffness, 0) / genome.muscles.length
      : 0;
    const avgFrequency = genome.muscles.length > 0
      ? genome.muscles.reduce((sum, m) => sum + m.frequency, 0) / genome.muscles.length
      : 0;

    const fitness = isNaN(result.finalFitness) ? 0 : result.finalFitness;

    // Disqualification reason text
    const getDisqualificationText = (): string => {
      switch (result.disqualified) {
        case 'frequency_exceeded':
          return 'Muscle frequency exceeded max allowed';
        case 'physics_explosion':
          return 'Physics simulation exploded';
        case 'nan_position':
          return 'Position became invalid';
        default:
          return '';
      }
    };
    const disqualificationText = getDisqualificationText();

    // Genetics info
    const genCount = genome.generation;
    const parentCount = genome.parentIds.length;
    const lineageText = parentCount === 0 ? 'Original' :
                        parentCount === 1 ? 'Mutant' :
                        `Crossover (${parentCount} parents)`;

    this.tooltip.innerHTML = `
      <div class="tooltip-title">${creatureName} <span style="color: var(--text-muted); font-size: 12px;">#${card.rank}</span></div>

      ${result.disqualified ? `
        <div style="margin-bottom: 8px; padding: 8px; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; border-radius: 4px;">
          <div style="color: #ef4444; font-weight: 600; font-size: 12px;">DISQUALIFIED</div>
          <div style="color: #fca5a5; font-size: 11px; margin-top: 2px;">${disqualificationText}</div>
        </div>
      ` : ''}

      <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div class="tooltip-row">
          <span class="tooltip-label">Fitness</span>
          <span class="tooltip-value" style="color: ${result.disqualified ? '#ef4444' : 'var(--success)'}">${fitness.toFixed(1)}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Pellets</span>
          <span class="tooltip-value">${result.pelletsCollected}/${result.pellets.length}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Distance</span>
          <span class="tooltip-value">${result.distanceTraveled.toFixed(1)}</span>
        </div>
      </div>

      <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div style="font-size: 11px; color: var(--accent-light); margin-bottom: 4px;">Genetics</div>
        <div class="tooltip-row">
          <span class="tooltip-label">Generation</span>
          <span class="tooltip-value">${genCount}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Origin</span>
          <span class="tooltip-value" style="color: ${parentCount === 0 ? '#7a8494' : parentCount === 1 ? '#f59e0b' : '#6366f1'}">${lineageText}</span>
        </div>
      </div>

      <div>
        <div style="font-size: 11px; color: var(--accent-light); margin-bottom: 4px;">Structure</div>
        <div class="tooltip-row">
          <span class="tooltip-label">Nodes</span>
          <span class="tooltip-value">${genome.nodes.length}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Muscles</span>
          <span class="tooltip-value">${genome.muscles.length}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Avg Stiffness</span>
          <span class="tooltip-value">${avgStiffness.toFixed(0)}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Avg Frequency</span>
          <span class="tooltip-value">${avgFrequency.toFixed(1)} Hz</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Global Speed</span>
          <span class="tooltip-value">${genome.globalFrequencyMultiplier.toFixed(2)}x</span>
        </div>
      </div>

      <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">${result.disqualified ? 'Replay unavailable' : 'Click to replay'}</div>
    `;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const tooltipHeight = 320; // Approximate height of tooltip

    // Position to the right of the card
    let left = rect.right + 10;
    let top = rect.top;

    // If tooltip would go off the bottom, position it to show from bottom up
    if (top + tooltipHeight > window.innerHeight) {
      top = Math.max(10, window.innerHeight - tooltipHeight - 10);
    }

    // If tooltip would go off the right, position to the left of the card
    if (left + 200 > window.innerWidth) {
      left = rect.left - 210;
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
    this.tooltip.classList.add('visible');
  }

  // ============================================
  // TOOLTIP
  // ============================================

  private createTooltip(): void {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'creature-tooltip glass';
    document.body.appendChild(this.tooltip);
  }

  private hideTooltip(): void {
    if (this.tooltip) this.tooltip.classList.remove('visible');
  }

  // ============================================
  // REPLAY MODAL
  // ============================================

  private createReplayModal(): void {
    this.replayModal = document.createElement('div');
    this.replayModal.className = 'modal-overlay';
    this.replayModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-title">Simulation Replay</span>
          <button class="btn-icon" id="close-replay">&times;</button>
        </div>
        <div class="modal-body">
          <div id="replay-container" style="width: 600px; height: 400px; border-radius: 12px; overflow: hidden;"></div>
          <div style="margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div id="replay-fitness" style="font-size: 24px; font-weight: 600; color: var(--success);">0.0</div>
              <div id="replay-frame" style="color: var(--text-muted); font-size: 13px;">Frame 0/0</div>
            </div>
            <div style="height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;">
              <div id="replay-fitness-fill" style="height: 100%; width: 0%; background: linear-gradient(90deg, var(--accent), var(--success)); transition: width 0.1s;"></div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
            <div id="replay-stats" style="color: var(--text-secondary); font-size: 13px;"></div>
            <button class="btn btn-secondary btn-small" id="replay-restart">Restart</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.replayModal);

    this.replayModal.querySelector('#close-replay')?.addEventListener('click', () => this.hideReplay());
    this.replayModal.querySelector('#replay-restart')?.addEventListener('click', () => { this.replayFrame = 0; });
    this.replayModal.addEventListener('click', (e) => { if (e.target === this.replayModal) this.hideReplay(); });
  }

  private createLoadRunsModal(): void {
    this.loadRunsModal = document.createElement('div');
    this.loadRunsModal.className = 'modal-overlay';
    this.loadRunsModal.innerHTML = `
      <div class="modal-content" style="max-width: 800px; width: 90vw;">
        <div class="modal-header">
          <span class="modal-title">Load Saved Run</span>
          <button class="btn-icon" id="close-load-runs">&times;</button>
        </div>
        <div class="modal-body">
          <div id="runs-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; max-height: 60vh; overflow-y: auto; padding: 4px;">
            <div style="color: var(--text-muted); text-align: center; padding: 40px;">Loading saved runs...</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.loadRunsModal);

    this.loadRunsModal.querySelector('#close-load-runs')?.addEventListener('click', () => this.hideLoadRunsModal());
    this.loadRunsModal.addEventListener('click', (e) => { if (e.target === this.loadRunsModal) this.hideLoadRunsModal(); });
  }

  private async showLoadRunsModal(): Promise<void> {
    if (!this.loadRunsModal) return;

    this.loadRunsModal.classList.add('visible');
    const runsGrid = this.loadRunsModal.querySelector('#runs-grid') as HTMLElement;

    try {
      const runs = await runStorage.getAllRuns();

      if (runs.length === 0) {
        runsGrid.innerHTML = `
          <div style="color: var(--text-muted); text-align: center; padding: 40px; grid-column: 1 / -1;">
            No saved runs found. Start a new evolution to create your first run!
          </div>
        `;
        return;
      }

      runsGrid.innerHTML = runs.map(run => {
        const date = new Date(run.startTime);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
          <div class="run-card" data-run-id="${run.id}" style="
            background: var(--bg-card);
            border: 2px solid var(--border);
            border-radius: 12px;
            padding: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
          ">
            <button class="delete-run-btn" data-run-id="${run.id}" style="
              position: absolute;
              top: 8px;
              right: 8px;
              background: rgba(239, 68, 68, 0.2);
              border: none;
              border-radius: 50%;
              width: 24px;
              height: 24px;
              cursor: pointer;
              color: var(--danger);
              font-size: 14px;
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0.6;
              transition: opacity 0.2s;
            ">&times;</button>
            <div style="
              width: 100%;
              height: 100px;
              background: var(--bg-tertiary);
              border-radius: 8px;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--text-muted);
              font-size: 12px;
            ">${run.thumbnail ? `<img src="${run.thumbnail}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : 'No preview'}</div>
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">Generation ${run.generationCount - 1}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${dateStr}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
              Gravity: ${run.config.gravity} | Mut: ${Math.round((run.config.mutationRate || 0.1) * 100)}%
            </div>
          </div>
        `;
      }).join('');

      // Add click handlers
      runsGrid.querySelectorAll('.run-card').forEach(card => {
        card.addEventListener('click', async (e) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains('delete-run-btn')) return;

          const runId = card.getAttribute('data-run-id');
          if (runId) {
            await this.loadRun(runId);
          }
        });

        card.addEventListener('mouseenter', () => {
          (card as HTMLElement).style.borderColor = 'var(--accent)';
          (card as HTMLElement).style.transform = 'translateY(-2px)';
        });

        card.addEventListener('mouseleave', () => {
          (card as HTMLElement).style.borderColor = 'var(--border)';
          (card as HTMLElement).style.transform = 'translateY(0)';
        });
      });

      // Add delete handlers
      runsGrid.querySelectorAll('.delete-run-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const runId = (btn as HTMLElement).getAttribute('data-run-id');
          if (runId && confirm('Delete this run? This cannot be undone.')) {
            await runStorage.deleteRun(runId);
            await this.showLoadRunsModal();  // Refresh the list
          }
        });

        btn.addEventListener('mouseenter', () => {
          (btn as HTMLElement).style.opacity = '1';
        });

        btn.addEventListener('mouseleave', () => {
          (btn as HTMLElement).style.opacity = '0.6';
        });
      });

    } catch (error) {
      console.error('Error loading runs:', error);
      runsGrid.innerHTML = `
        <div style="color: var(--danger); text-align: center; padding: 40px; grid-column: 1 / -1;">
          Error loading saved runs. Please try again.
        </div>
      `;
    }
  }

  private hideLoadRunsModal(): void {
    if (this.loadRunsModal) {
      this.loadRunsModal.classList.remove('visible');
    }
  }

  private async loadRun(runId: string): Promise<void> {
    try {
      const run = await runStorage.getRun(runId);
      if (!run) {
        alert('Run not found');
        return;
      }

      // Get the max generation for this run
      const maxGen = run.generationCount - 1;
      if (maxGen < 0) {
        alert('This run has no saved generations');
        return;
      }

      // Load the most recent generation
      const results = await runStorage.loadGeneration(runId, maxGen);
      if (!results) {
        alert('Could not load generation data');
        return;
      }

      // Set up state
      this.hideLoadRunsModal();
      runStorage.setCurrentRunId(runId);
      this.config = { ...this.config, ...run.config };
      this.generation = maxGen;
      this.maxGeneration = maxGen;
      this.viewingGeneration = maxGen;  // Viewing loaded generation
      this.simulationResults = results;
      this.fitnessHistory = [];  // Will be rebuilt if needed

      // Switch to grid view
      this.state = 'grid';
      if (this.menuScreen) this.menuScreen.style.display = 'none';
      if (this.gridUI) this.gridUI.style.display = 'block';

      // Create cards from loaded results
      this.createCreatureCardsFromResults(results);
      this.evolutionStep = 'idle';
      this.updateNextButton();
      this.updateStats();
      this.updateSettingsInfoBox();

    } catch (error) {
      console.error('Error loading run:', error);
      alert('Error loading run. Please try again.');
    }
  }

  private createCreatureCardsFromResults(results: CreatureSimulationResult[], shouldSort: boolean = true): void {
    if (!this.gridContainer) return;

    // Clear existing cards
    this.gridContainer.innerHTML = '';
    this.creatureCards = [];

    // Sort by fitness if requested
    const displayResults = shouldSort
      ? [...results].sort((a, b) => b.finalFitness - a.finalFitness)
      : results;

    for (let i = 0; i < displayResults.length; i++) {
      const result = displayResults[i];
      const pos = this.getGridPosition(i);

      const card = document.createElement('div');
      card.className = 'creature-card';
      card.innerHTML = `
        <div class="creature-card-rank">#${i + 1}</div>
        <canvas width="160" height="160"></canvas>
        <div class="creature-card-fitness">${result.finalFitness.toFixed(0)}</div>
      `;

      card.style.cssText = `
        position: absolute;
        left: ${pos.x}px;
        top: ${pos.y}px;
        width: ${CARD_SIZE}px;
        height: ${CARD_SIZE}px;
      `;

      const canvas = card.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;

      const creatureCard: CreatureCard = {
        element: card,
        canvas,
        ctx,
        result,
        rank: i + 1,
        gridIndex: i,
        isDead: false,
        isMutated: false,
        isElite: i < (this.config.eliteCount || 5),
        parentId: null,
        currentX: pos.x,
        currentY: pos.y,
        targetX: pos.x,
        targetY: pos.y
      };

      this.creatureCards.push(creatureCard);
      this.gridContainer.appendChild(card);

      // Render thumbnail
      this.renderCreatureToCanvas(result, canvas);

      // Add click handler for replay
      card.addEventListener('click', () => this.showReplay(result));

      // Add hover effect
      card.addEventListener('mouseenter', (e) => this.showCardTooltip(e, creatureCard));
      card.addEventListener('mouseleave', () => this.hideTooltip());
    }
  }

  // ============================================
  // GENERATION NAVIGATION
  // ============================================

  private async navigateToGeneration(direction: 'prev' | 'next'): Promise<void> {
    const currentRunId = runStorage.getCurrentRunId();
    if (!currentRunId) return;

    // Determine which generation we're currently viewing
    const currentViewGen = this.viewingGeneration !== null ? this.viewingGeneration : this.generation;

    let targetGen: number;
    if (direction === 'prev') {
      targetGen = currentViewGen - 1;
      if (targetGen < 0) return;
    } else {
      targetGen = currentViewGen + 1;
      // If going beyond saved generations
      if (targetGen > this.maxGeneration) {
        if (targetGen === this.generation) {
          // Go to the current live generation (exit history mode)
          await this.goToCurrentGeneration();
          return;
        }
        return;
      }
    }

    // If navigating to the current live generation, exit history mode instead of loading from storage
    if (targetGen === this.generation) {
      await this.goToCurrentGeneration();
      return;
    }

    await this.loadGenerationView(targetGen);
  }

  private async promptJumpToGeneration(): Promise<void> {
    const currentViewGen = this.viewingGeneration !== null ? this.viewingGeneration : this.generation;
    const input = prompt(`Jump to generation (0-${this.generation}):`, currentViewGen.toString());

    if (input === null) return;

    const targetGen = parseInt(input, 10);
    if (isNaN(targetGen) || targetGen < 0 || targetGen > this.generation) {
      alert(`Please enter a number between 0 and ${this.generation}`);
      return;
    }

    // If jumping to current live generation, exit history mode
    if (targetGen === this.generation) {
      await this.goToCurrentGeneration();
      return;
    }

    await this.loadGenerationView(targetGen);
  }

  private async goToCurrentGeneration(): Promise<void> {
    // Exit history mode and return to the current live generation
    this.viewingGeneration = null;
    this.updateControlsForHistoryMode(false);

    // Try to load current generation results from storage if they exist
    const currentRunId = runStorage.getCurrentRunId();
    if (currentRunId && this.generation <= this.maxGeneration) {
      const results = await runStorage.loadGeneration(currentRunId, this.generation);
      if (results && results.length > 0) {
        this.simulationResults = results;
        // If we're at 'simulate' step (before sort), don't sort the cards yet
        const shouldSort = this.evolutionStep !== 'simulate';
        this.createCreatureCardsFromResults(results, shouldSort);
        this.updateStats();
        return;
      }
    }

    // Otherwise create cards from population (unsimulated creatures)
    if (this.population && this.population.getGenomes().length > 0) {
      this.createCardsFromPopulation();
    }
    this.updateStats();
  }

  private createCardsFromPopulation(): void {
    if (!this.gridContainer || !this.population) return;

    this.gridContainer.innerHTML = '';
    this.creatureCards = [];

    const genomes = this.population.getGenomes();

    for (let i = 0; i < genomes.length; i++) {
      const genome = genomes[i];
      const pos = this.getGridPosition(i);

      // Create a placeholder result for the card
      const placeholderResult: CreatureSimulationResult = {
        genome,
        frames: [],
        finalFitness: NaN,  // Will show "..." in the UI
        pelletsCollected: 0,
        distanceTraveled: 0,
        netDisplacement: 0,
        closestPelletDistance: 0,
        pellets: [],
        fitnessOverTime: [],
        disqualified: null
      };

      const card = this.createSingleCard(placeholderResult, i + 1, i, pos.x, pos.y);
      this.creatureCards.push(card);
      this.gridContainer.appendChild(card.element);

      // Update fitness label to show pending state
      const fitnessLabel = card.element.querySelector('.creature-card-fitness') as HTMLElement;
      if (fitnessLabel) {
        fitnessLabel.textContent = '...';
        fitnessLabel.style.color = '#7a8494';
      }
    }
  }

  private async loadGenerationView(gen: number): Promise<void> {
    const currentRunId = runStorage.getCurrentRunId();
    if (!currentRunId) return;

    try {
      const results = await runStorage.loadGeneration(currentRunId, gen);
      if (!results) {
        alert(`Could not load generation ${gen}`);
        return;
      }

      this.viewingGeneration = gen;
      this.simulationResults = results;

      // Show history mode UI
      this.createCreatureCardsFromResults(results);
      this.updateStats();
      this.updateControlsForHistoryMode(true);

    } catch (error) {
      console.error('Error loading generation:', error);
      alert('Error loading generation data');
    }
  }

  private updateControlsForHistoryMode(isHistoryMode: boolean): void {
    const nextStepBtn = document.getElementById('next-step-btn') as HTMLButtonElement;
    const run1xBtn = document.getElementById('run-1x-btn') as HTMLButtonElement;
    const run10xBtn = document.getElementById('run-10x-btn') as HTMLButtonElement;
    const run100xBtn = document.getElementById('run-100x-btn') as HTMLButtonElement;

    if (isHistoryMode) {
      // Disable evolution controls when viewing history
      if (nextStepBtn) {
        nextStepBtn.disabled = true;
        nextStepBtn.textContent = 'Viewing History';
      }
      if (run1xBtn) run1xBtn.disabled = true;
      if (run10xBtn) run10xBtn.disabled = true;
      if (run100xBtn) run100xBtn.disabled = true;
    } else {
      // Re-enable controls
      if (nextStepBtn) {
        nextStepBtn.disabled = false;
        this.updateNextButton();
      }
      if (run1xBtn) run1xBtn.disabled = false;
      if (run10xBtn) run10xBtn.disabled = false;
      if (run100xBtn) run100xBtn.disabled = false;
    }
  }

  private setupReplayScene(): void {
    const container = document.getElementById('replay-container')!;
    container.innerHTML = '';

    // Dispose previous replay renderer if exists
    if (this.replayRenderer) {
      this.replayRenderer.dispose();
    }

    this.replayScene = new THREE.Scene();
    this.replayScene.background = new THREE.Color(0x0f0f14);

    this.replayCamera = new THREE.PerspectiveCamera(50, 600 / 400, 0.1, 100);
    this.replayCamera.position.set(8, 6, 12);
    this.replayCamera.lookAt(0, 1, 0);

    this.replayRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.replayRenderer.setSize(600, 400);
    this.replayRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.replayRenderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.replayScene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(5, 10, 5);
    this.replayScene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.replayScene.add(ground);

    const grid = new THREE.GridHelper(30, 30, 0x252532, 0x252532);
    grid.position.y = 0.01;
    this.replayScene.add(grid);
  }

  private showReplay(result: CreatureSimulationResult): void {
    // Cancel any existing animation loop before starting a new one
    if (this.replayAnimationId !== null) {
      cancelAnimationFrame(this.replayAnimationId);
      this.replayAnimationId = null;
    }

    this.selectedResult = result;
    this.replayFrame = 0;
    this.isReplaying = true;

    this.setupReplayScene();

    // Clear previous
    if (this.replayCreature) this.replayScene!.remove(this.replayCreature);
    this.replayPellets.forEach(p => this.replayScene!.remove(p));
    this.replayPelletLines.forEach(l => this.replayScene!.remove(l));
    this.replayPellets = [];
    this.replayPelletLines = [];

    this.replayCreature = this.createCreatureMesh(result.genome);
    this.replayScene!.add(this.replayCreature);

    const pelletMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.3
    });

    // Material for drop lines (dim green, dashed)
    const lineMaterial = new THREE.LineDashedMaterial({
      color: 0x10b981,
      opacity: 0.3,
      transparent: true,
      dashSize: 0.1,
      gapSize: 0.1
    });

    for (const pelletData of result.pellets) {
      const pellet = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), pelletMaterial.clone());
      pellet.position.set(pelletData.position.x, pelletData.position.y, pelletData.position.z);
      pellet.userData = { pelletData };
      this.replayScene!.add(pellet);
      this.replayPellets.push(pellet);

      // Create drop line from pellet to ground
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pelletData.position.x, pelletData.position.y, pelletData.position.z),
        new THREE.Vector3(pelletData.position.x, 0.01, pelletData.position.z)
      ]);
      const line = new THREE.Line(lineGeometry, lineMaterial.clone());
      line.computeLineDistances(); // Required for dashed lines
      line.userData = { pelletData };
      this.replayScene!.add(line);
      this.replayPelletLines.push(line);
    }

    document.getElementById('replay-stats')!.innerHTML = `
      Nodes: <strong>${result.genome.nodes.length}</strong> |
      Muscles: <strong>${result.genome.muscles.length}</strong> |
      Pellets: <strong>${result.pelletsCollected}/${result.pellets.length}</strong>
    `;

    this.replayModal!.classList.add('visible');
    this.animateReplay();
  }

  private hideReplay(): void {
    // Cancel any running animation loop
    if (this.replayAnimationId !== null) {
      cancelAnimationFrame(this.replayAnimationId);
      this.replayAnimationId = null;
    }

    this.isReplaying = false;
    this.selectedResult = null;
    this.replayModal!.classList.remove('visible');

    // Dispose replay renderer to free up WebGL context
    if (this.replayRenderer) {
      this.replayRenderer.dispose();
      this.replayRenderer = null;
    }
  }

  private animateReplay = (): void => {
    if (!this.isReplaying || !this.replayRenderer || !this.replayScene || !this.replayCamera) {
      this.replayAnimationId = null;
      return;
    }

    this.replayAnimationId = requestAnimationFrame(this.animateReplay);

    if (this.selectedResult && this.replayCreature) {
      const frame = this.selectedResult.frames[this.replayFrame];
      if (frame) {
        const nodeMeshes = this.replayCreature.userData.nodeMeshes as Map<string, THREE.Mesh>;

        for (const [nodeId, pos] of frame.nodePositions) {
          const mesh = nodeMeshes.get(nodeId);
          if (mesh) mesh.position.set(pos.x, pos.y, pos.z);
        }

        for (const child of this.replayCreature.children) {
          if (child.userData.nodeA) {
            const nodeA = nodeMeshes.get(child.userData.nodeA);
            const nodeB = nodeMeshes.get(child.userData.nodeB);
            if (nodeA && nodeB) this.updateMuscleMesh(child as THREE.Mesh, nodeA.position, nodeB.position);
          }
        }

        // Show only the active pellet and its drop line at this frame
        for (let i = 0; i < this.replayPellets.length; i++) {
          const pellet = this.replayPellets[i];
          const line = this.replayPelletLines[i];
          const pelletData = pellet.userData.pelletData as PelletData;
          const hasSpawned = pelletData.spawnedAtFrame <= this.replayFrame;
          const isCollected = pelletData.collectedAtFrame !== null && this.replayFrame >= pelletData.collectedAtFrame;
          const isVisible = hasSpawned && !isCollected;
          pellet.visible = isVisible;
          if (line) line.visible = isVisible;
        }

        const currentFitness = this.selectedResult.fitnessOverTime[this.replayFrame] || 0;
        const maxFitness = Math.max(...this.selectedResult.fitnessOverTime, 0.1);

        document.getElementById('replay-fitness')!.textContent = currentFitness.toFixed(1);
        document.getElementById('replay-frame')!.textContent = `Frame ${this.replayFrame + 1}/${this.selectedResult.frames.length}`;
        (document.getElementById('replay-fitness-fill') as HTMLElement).style.width = `${(currentFitness / maxFitness) * 100}%`;

        this.replayFrame++;
        if (this.replayFrame >= this.selectedResult.frames.length) this.replayFrame = 0;
      }
    }

    this.replayRenderer.render(this.replayScene, this.replayCamera);
  };

  // ============================================
  // SIMULATION & EVOLUTION
  // ============================================

  private async startSimulation(): Promise<void> {
    this.generation = 0;
    this.fitnessHistory = [];
    this.evolutionStep = 'idle';
    this.viewingGeneration = null;  // Viewing current (live) generation

    // Create a new run in storage
    await runStorage.createRun(this.config);

    // Create genome constraints from config
    const genomeConstraints = {
      minNodes: 2,
      maxNodes: this.config.maxNodes,
      minMuscles: 1,
      maxMuscles: this.config.maxMuscles,
      minSize: 0.2,
      maxSize: 0.8,
      minStiffness: 50,
      maxStiffness: 500,
      minFrequency: 0.5,
      maxFrequency: this.config.maxAllowedFrequency,
      maxAmplitude: 0.4,
      spawnRadius: 2.0
    };

    this.population = Population.createInitial(this.config, genomeConstraints);

    this.state = 'grid';
    if (this.menuScreen) this.menuScreen.style.display = 'none';
    if (this.gridUI) this.gridUI.style.display = 'block';

    // Initial simulation
    await this.runSimulationStep();
    this.createCreatureCards();
    this.evolutionStep = 'idle';
    this.recordFitnessHistory();

    // Auto-save generation 0
    await runStorage.saveGeneration(this.generation, this.simulationResults);
    this.maxGeneration = this.generation;

    this.updateNextButton();
    this.updateStats();
  }

  private async executeNextStep(): Promise<void> {
    if (this.isAutoRunning) return;

    const btn = document.getElementById('next-step-btn') as HTMLButtonElement;
    btn.disabled = true;

    try {
      if (this.evolutionStep === 'idle') {
        this.evolutionStep = 'mutate';
        this.updateNextButton('Killing 50%...');
        this.updateStats();
        await this.runMutateStep(false);
        this.evolutionStep = 'simulate';
      } else if (this.evolutionStep === 'mutate') {
        this.evolutionStep = 'simulate';
      } else if (this.evolutionStep === 'simulate') {
        this.updateNextButton('Simulating...');
        await this.runSimulationStep(false);
        // Auto-save this generation
        await runStorage.saveGeneration(this.generation, this.simulationResults);
        this.maxGeneration = this.generation;
        this.evolutionStep = 'sort';
      } else if (this.evolutionStep === 'sort') {
        this.updateNextButton('Sorting...');
        await this.runSortStep(false);
        this.evolutionStep = 'idle';
        this.recordFitnessHistory();
      }

      this.updateStats();
      this.updateNextButton();

      if (this.graphPanel && this.fitnessHistory.length > 0) {
        this.graphPanel.updateData(this.fitnessHistory);
      }
    } finally {
      btn.disabled = false;
    }
  }

  private async runMutateStep(fastMode: boolean = false): Promise<void> {
    if (!this.population || !this.gridContainer) return;

    this.generation++;

    // Sort current cards by fitness (best first, worst last)
    const sortedCards = [...this.creatureCards].sort((a, b) => {
      const aFit = a.result ? (isNaN(a.result.finalFitness) ? -Infinity : a.result.finalFitness) : -Infinity;
      const bFit = b.result ? (isNaN(b.result.finalFitness) ? -Infinity : b.result.finalFitness) : -Infinity;
      return bFit - aFit;
    });

    const cutoff = Math.floor(sortedCards.length * 0.5);
    const survivors = sortedCards.slice(0, cutoff);
    const deadCards = sortedCards.slice(cutoff);

    if (!fastMode) {
      // Phase 1: Mark bottom 50% as dead
      for (const card of deadCards) {
        card.isDead = true;
        card.element.style.opacity = '0.3';
        card.element.style.borderColor = '#ef4444';
        card.element.style.transform = 'scale(0.9)';
      }

      await this.delay(600);

      // Phase 2: Fade out dead cards
      for (const card of deadCards) {
        card.element.style.opacity = '0';
        card.element.style.transform = 'scale(0)';
      }

      await this.delay(400);
    }

    // Collect empty positions from dead cards
    const emptyPositions: number[] = [];
    for (const card of deadCards) {
      emptyPositions.push(card.gridIndex);
      card.element.remove();
    }

    // Keep survivor cards (they keep their thumbnails until next simulation)
    this.creatureCards = [...survivors];

    // Evolve the population
    const newGenomes = this.population.evolve();
    this.population.replaceCreatures(newGenomes);

    // Get all genomes from population
    const genomes = this.population.getGenomes();

    // Update survivor cards to reference new genomes (maintaining their visual appearance)
    // The new population has elites first, then offspring
    // We map survivors to elites by fitness rank
    for (let i = 0; i < survivors.length && i < genomes.length; i++) {
      const card = survivors[i];
      const newGenome = genomes[i]; // Elites come first in the new population

      // Update the card's result with new genome but keep old visual data
      if (card.result) {
        card.result = {
          ...card.result,
          genome: newGenome
        };
      }

      // Update fitness label to show "..." (pending simulation)
      const fitnessLabel = card.element.querySelector('.creature-card-fitness') as HTMLElement;
      if (fitnessLabel) {
        fitnessLabel.textContent = '...';
        fitnessLabel.style.color = '#7a8494';
      }
    }

    // Sort empty positions (fill from top-left)
    emptyPositions.sort((a, b) => a - b);

    // Create new cards for empty positions with offspring genomes
    // Offspring start after the survivors in the genome array
    const offspringStartIndex = survivors.length;

    for (let i = 0; i < emptyPositions.length; i++) {
      const genomeIndex = offspringStartIndex + i;
      if (genomeIndex >= genomes.length) break;

      const genome = genomes[genomeIndex];
      const gridPos = emptyPositions[i];
      const targetPos = this.getGridPosition(gridPos);

      // Pick a random survivor as visual "parent" for spawn animation
      const parentCard = survivors.length > 0
        ? survivors[Math.floor(Math.random() * survivors.length)]
        : null;
      const startPos = fastMode || !parentCard
        ? targetPos
        : { x: parentCard.currentX, y: parentCard.currentY };

      // Create placeholder result
      const placeholderResult: CreatureSimulationResult = {
        genome,
        frames: [],
        finalFitness: NaN,
        pelletsCollected: 0,
        distanceTraveled: 0,
        netDisplacement: 0,
        closestPelletDistance: Infinity,
        pellets: [],
        fitnessOverTime: [],
        disqualified: null
      };

      // Create card at parent/start position
      const card = this.createSingleCard(
        placeholderResult,
        0, // Rank will be set after simulation
        gridPos,
        startPos.x,
        startPos.y,
        genome.parentIds[0] || null
      );
      card.isMutated = true;
      card.targetX = targetPos.x;
      card.targetY = targetPos.y;

      if (fastMode) {
        card.element.style.borderColor = '#f59e0b';
        card.element.style.left = `${targetPos.x}px`;
        card.element.style.top = `${targetPos.y}px`;
        card.currentX = targetPos.x;
        card.currentY = targetPos.y;
      } else {
        // Start at parent position, invisible
        card.element.style.borderColor = '#f59e0b';
        card.element.style.opacity = '0';
        card.element.style.transform = 'scale(0.5)';
      }

      this.gridContainer.appendChild(card.element);
      this.creatureCards.push(card);
    }

    if (!fastMode) {
      // Phase 3: Animate new cards appearing and moving to their positions
      await this.delay(50);

      for (const card of this.creatureCards) {
        if (card.isMutated) {
          card.element.style.transition = 'opacity 0.3s ease, transform 0.3s ease, left 0.5s ease-out, top 0.5s ease-out';
          card.element.style.opacity = '1';
          card.element.style.transform = 'scale(1)';
          card.element.style.left = `${card.targetX}px`;
          card.element.style.top = `${card.targetY}px`;
          card.currentX = card.targetX;
          card.currentY = card.targetY;
        }
      }

      await this.delay(600);

      // Reset transitions
      for (const card of this.creatureCards) {
        card.element.style.transition = 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease';
      }
    }
  }

  private async runSimulationStep(fastMode: boolean = false): Promise<void> {
    if (!this.population) return;

    // Show progress bar only in normal mode
    if (!fastMode && this.progressContainer) {
      this.progressContainer.style.display = 'block';
    }

    const genomes = this.population.getGenomes();
    const progressFill = this.progressContainer?.querySelector('.progress-fill') as HTMLElement;
    const progressText = this.progressContainer?.querySelector('.progress-text') as HTMLElement;

    this.simulationResults = await simulatePopulation(genomes, this.config, (completed, total) => {
      if (!fastMode) {
        const percent = Math.round((completed / total) * 100);
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressText) progressText.textContent = `Simulating creature ${completed}/${total}...`;
      }
    });

    // Update population fitness
    for (const result of this.simulationResults) {
      const creature = this.population!.creatures.find(c => c.genome.id === result.genome.id);
      if (creature) {
        creature.state.fitness = result.finalFitness;
        creature.state.pelletsCollected = result.pelletsCollected;
        creature.state.distanceTraveled = result.distanceTraveled;
      }
    }

    if (this.progressContainer) this.progressContainer.style.display = 'none';

    // Update card results and re-render thumbnails
    for (const card of this.creatureCards) {
      if (!card.result) continue;
      const newResult = this.simulationResults.find(r => r.genome.id === card.result?.genome.id);
      if (newResult) {
        card.result = newResult;

        // Update fitness label
        const fitnessLabel = card.element.querySelector('.creature-card-fitness') as HTMLElement;
        if (fitnessLabel) {
          const hasFitness = !isNaN(newResult.finalFitness) && isFinite(newResult.finalFitness);
          fitnessLabel.textContent = hasFitness ? newResult.finalFitness.toFixed(0) : '...';
          fitnessLabel.style.color = hasFitness ? '#10b981' : '#7a8494';
        }

        // Re-render thumbnail (skip in fast mode for speed)
        if (!fastMode) {
          this.renderCreatureToCanvas(newResult, card.canvas);
        }
      }
    }

    // In fast mode, do a single batch render at the end
    if (fastMode) {
      for (const card of this.creatureCards) {
        if (card.result && card.result.frames.length > 0) {
          this.renderCreatureToCanvas(card.result, card.canvas);
        }
      }
    }
  }

  private async runSortStep(fastMode: boolean = false): Promise<void> {
    if (!this.gridContainer) return;

    // Sort cards by fitness
    const sortedCards = [...this.creatureCards].sort((a, b) => {
      const aFit = a.result ? (isNaN(a.result.finalFitness) ? -Infinity : a.result.finalFitness) : -Infinity;
      const bFit = b.result ? (isNaN(b.result.finalFitness) ? -Infinity : b.result.finalFitness) : -Infinity;
      return bFit - aFit;
    });

    // Calculate target positions for each card
    const animations: { card: CreatureCard; targetX: number; targetY: number; newRank: number }[] = [];

    for (let i = 0; i < sortedCards.length; i++) {
      const card = sortedCards[i];
      const pos = this.getGridPosition(i);
      animations.push({
        card,
        targetX: pos.x,
        targetY: pos.y,
        newRank: i + 1
      });
    }

    // Enable smooth transitions only in normal mode
    if (!fastMode) {
      for (const card of this.creatureCards) {
        card.element.style.transition = 'left 0.6s ease-in-out, top 0.6s ease-in-out, transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease';
      }
    }

    // Apply animations/positions
    for (const { card, targetX, targetY, newRank } of animations) {
      card.element.style.left = `${targetX}px`;
      card.element.style.top = `${targetY}px`;
      card.currentX = targetX;
      card.currentY = targetY;
      card.targetX = targetX;
      card.targetY = targetY;
      card.gridIndex = newRank - 1;
      card.rank = newRank;

      // Note: We keep the creature name label as-is (it doesn't change during sorting)
      // The rank is stored in card.rank for tooltip display

      // Update elite status
      const isElite = newRank <= this.config.populationSize * 0.1;
      card.isElite = isElite;
      card.element.style.borderColor = isElite ? '#10b981' : 'rgba(255,255,255,0.2)';
      card.element.style.boxShadow = isElite ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none';

      // Remove mutated styling
      if (card.isMutated) {
        card.isMutated = false;
      }
    }

    if (!fastMode) {
      // Wait for animations to complete
      await this.delay(700);

      // Reset transitions
      for (const card of this.creatureCards) {
        card.element.style.transition = 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease';
      }
    }
  }

  private recordFitnessHistory(): void {
    const validResults = this.simulationResults.filter(r => !isNaN(r.finalFitness) && isFinite(r.finalFitness));
    if (validResults.length === 0) return;

    const best = Math.max(...validResults.map(r => r.finalFitness));
    const avg = validResults.reduce((sum, r) => sum + r.finalFitness, 0) / validResults.length;
    const worst = Math.min(...validResults.map(r => r.finalFitness));

    // Track best creature ever
    const bestResult = validResults.find(r => r.finalFitness === best);
    if (bestResult) {
      if (!this.bestCreatureEver || bestResult.finalFitness > this.bestCreatureEver.finalFitness) {
        this.bestCreatureEver = bestResult;
        this.bestCreatureGeneration = this.generation;
        console.log(`New best creature ever! Fitness: ${bestResult.finalFitness.toFixed(1)} at generation ${this.generation}`);
      }
    }

    // Track longest surviving creature (highest survivalStreak = same creature surviving longest)
    const longestSurvivor = validResults.reduce((longest, r) =>
      r.genome.survivalStreak > longest.genome.survivalStreak ? r : longest
    , validResults[0]);

    if (longestSurvivor && longestSurvivor.genome.survivalStreak > this.longestSurvivingGenerations) {
      this.longestSurvivingCreature = longestSurvivor;
      this.longestSurvivingGenerations = longestSurvivor.genome.survivalStreak;
      console.log(`New longest surviving creature! ${this.getCreatureName(longestSurvivor.genome)} survived ${longestSurvivor.genome.survivalStreak} consecutive generations`);
    }

    this.fitnessHistory.push({
      generation: this.generation,
      best,
      average: avg,
      worst
    });

    if (this.graphPanel) {
      this.graphPanel.updateData(this.fitnessHistory);
      this.graphPanel.show();
    }

    console.log(`Generation ${this.generation}: Best=${best.toFixed(1)}, Avg=${avg.toFixed(1)}, Worst=${worst.toFixed(1)}`);
  }

  private async autoRun(generations: number): Promise<void> {
    if (this.isAutoRunning) return;

    this.isAutoRunning = true;

    const btn = document.getElementById('next-step-btn') as HTMLButtonElement;
    btn.disabled = true;

    try {
      for (let i = 0; i < generations; i++) {
        const remaining = generations - i;
        this.updateNextButton(`Gen ${this.generation + 1} (${remaining} left)`);

        // Run all steps in fast mode (skip animations)
        this.evolutionStep = 'mutate';
        this.updateStats();
        await this.runMutateStep(true);  // Fast mode

        this.evolutionStep = 'simulate';
        this.updateStats();
        await this.runSimulationStep(true);  // Fast mode
        // Auto-save this generation
        await runStorage.saveGeneration(this.generation, this.simulationResults);
        this.maxGeneration = this.generation;

        this.evolutionStep = 'sort';
        this.updateStats();
        await this.runSortStep(true);  // Fast mode

        this.evolutionStep = 'idle';
        this.recordFitnessHistory();
        this.updateStats();

        // Small yield to let UI update
        await this.delay(10);
      }
    } finally {
      this.isAutoRunning = false;
      btn.disabled = false;
      this.updateNextButton();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private reset(): void {
    // Dispose replay renderer
    if (this.replayRenderer) {
      this.replayRenderer.dispose();
      this.replayRenderer = null;
    }

    this.generation = 0;
    this.fitnessHistory = [];
    this.simulationResults = [];
    this.population = null;
    this.evolutionStep = 'idle';
    this.creatureCards = [];
    this.bestCreatureEver = null;
    this.bestCreatureGeneration = 0;
    this.longestSurvivingCreature = null;
    this.longestSurvivingGenerations = 0;
    if (this.gridContainer) this.gridContainer.innerHTML = '';
    if (this.graphPanel) this.graphPanel.hide();
    this.showMenu();
  }
}

// Start app
new EvolutionApp();
