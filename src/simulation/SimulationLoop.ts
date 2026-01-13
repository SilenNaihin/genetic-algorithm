import * as THREE from 'three';
import {
  SimulationPhase,
  SimulationConfig,
  DEFAULT_CONFIG,
  FitnessHistoryEntry
} from '../types';
import { SceneManager } from '../rendering/SceneManager';
import { CreatureRenderer } from '../rendering/CreatureRenderer';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { BodyFactory } from '../physics/BodyFactory';
import { Population } from '../genetics/Population';
import { Creature } from '../core/Creature';
import { Pellet, createRandomPellets } from '../core/Pellet';

export interface SimulationCallbacks {
  onPhaseChange?: (phase: SimulationPhase) => void;
  onGenerationComplete?: (stats: { generation: number; bestFitness: number; avgFitness: number }) => void;
  onFitnessUpdate?: (creatures: Creature[]) => void;
  onCreatureClick?: (creature: Creature) => void;
}

export class SimulationLoop {
  // State
  phase: SimulationPhase = SimulationPhase.MENU;
  config: SimulationConfig;

  // Core systems
  private sceneManager: SceneManager;
  private creatureRenderer: CreatureRenderer;
  private physicsWorld: PhysicsWorld;
  private bodyFactory: BodyFactory;
  private population: Population | null = null;

  // Simulation data
  private pellets: Map<string, Pellet[]> = new Map();  // Pellets per creature
  private simulationTime: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  // History
  fitnessHistory: FitnessHistoryEntry[] = [];

  // Callbacks
  private callbacks: SimulationCallbacks = {};

  // Grid layout
  private readonly GRID_SIZE = 10;
  private readonly CELL_SIZE = 12;  // World units per cell

  constructor(container: HTMLElement, config: SimulationConfig = DEFAULT_CONFIG) {
    this.config = { ...config };

    // Initialize scene
    this.sceneManager = new SceneManager(container);
    this.creatureRenderer = new CreatureRenderer(this.sceneManager.scene, false);

    // Initialize physics
    this.physicsWorld = new PhysicsWorld(this.config);
    this.bodyFactory = new BodyFactory(this.physicsWorld);

    // Setup camera for grid view
    this.setupGridCamera();

    // Setup click handling
    this.setupClickHandler(container);
  }

  private setupGridCamera(): void {
    const gridCenter = (this.GRID_SIZE * this.CELL_SIZE) / 2;
    this.sceneManager.camera.position.set(gridCenter, 80, gridCenter + 50);
    this.sceneManager.camera.lookAt(gridCenter, 0, gridCenter);
    this.sceneManager.controls.target.set(gridCenter, 0, gridCenter);
  }

  private setupClickHandler(container: HTMLElement): void {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    container.addEventListener('click', (event) => {
      if (this.phase !== SimulationPhase.SIMULATING && this.phase !== SimulationPhase.DISPLAYING) {
        return;
      }

      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.sceneManager.camera);

      const meshes: THREE.Object3D[] = [];
      this.sceneManager.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.userData.genomeId) {
          meshes.push(obj);
        }
      });

      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const genomeId = intersects[0].object.userData.genomeId;
        const creature = this.population?.getCreatureById(genomeId);
        if (creature && this.callbacks.onCreatureClick) {
          this.callbacks.onCreatureClick(creature);
        }
      }
    });
  }

  setCallbacks(callbacks: SimulationCallbacks): void {
    this.callbacks = callbacks;
  }

  private setPhase(phase: SimulationPhase): void {
    this.phase = phase;
    if (this.callbacks.onPhaseChange) {
      this.callbacks.onPhaseChange(phase);
    }
  }

  /**
   * Generate initial population
   */
  async generate(): Promise<void> {
    this.setPhase(SimulationPhase.GENERATING);

    // Clean up previous population
    if (this.population) {
      this.population.dispose();
    }

    // Clear pellets
    for (const pelletList of this.pellets.values()) {
      for (const pellet of pelletList) {
        pellet.dispose(this.sceneManager.scene);
      }
    }
    this.pellets.clear();

    // Reset physics world
    this.physicsWorld.reset();

    // Create new population
    this.population = Population.createInitial(this.config);

    // Initialize each creature with physics and rendering
    let index = 0;
    for (const creature of this.population.creatures) {
      const gridX = index % this.GRID_SIZE;
      const gridY = Math.floor(index / this.GRID_SIZE);

      const offset = {
        x: gridX * this.CELL_SIZE,
        y: 2,  // Start slightly above ground
        z: gridY * this.CELL_SIZE
      };

      creature.setGridPosition(gridX, gridY);
      creature.initializePhysics(this.physicsWorld, this.bodyFactory, offset);
      creature.initializeRendering(this.sceneManager.scene, this.creatureRenderer, {
        x: gridX * this.CELL_SIZE,
        y: 0,
        z: gridY * this.CELL_SIZE
      });

      // Create pellets for this creature's arena
      const creaturePellets = createRandomPellets(
        this.config.pelletCount,
        this.CELL_SIZE * 0.8,
        0.5
      ).map(config => {
        const pellet = new Pellet({
          ...config,
          position: {
            x: config.position.x + gridX * this.CELL_SIZE,
            y: config.position.y,
            z: config.position.z + gridY * this.CELL_SIZE
          }
        });
        pellet.createMesh(this.sceneManager.scene);
        return pellet;
      });

      this.pellets.set(creature.genome.id, creaturePellets);
      index++;
    }

    this.simulationTime = 0;
    this.fitnessHistory = [];

    // Small delay for visual effect
    await new Promise(resolve => setTimeout(resolve, 100));

    this.setPhase(SimulationPhase.SIMULATING);
  }

  /**
   * Start simulation
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  /**
   * Pause simulation
   */
  pause(): void {
    this.isRunning = false;
    this.setPhase(SimulationPhase.PAUSED);
  }

  /**
   * Resume simulation
   */
  resume(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.setPhase(SimulationPhase.SIMULATING);
    this.animate();
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (!this.isRunning) return;

    requestAnimationFrame(this.animate);

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.sceneManager.render();
  };

  /**
   * Update simulation
   */
  private update(deltaTime: number): void {
    if (this.phase !== SimulationPhase.SIMULATING || !this.population) {
      return;
    }

    // Step physics
    this.physicsWorld.step(deltaTime);

    // Update all creatures
    for (const creature of this.population.creatures) {
      creature.update(deltaTime);
      creature.syncMeshToPhysics();

      // Check pellet collisions
      const creaturePellets = this.pellets.get(creature.genome.id) || [];
      creature.checkPelletCollisions(creaturePellets);
      creature.calculateFitness(creaturePellets);
    }

    this.simulationTime += deltaTime;

    // Check if simulation duration is complete
    if (this.simulationTime >= this.config.simulationDuration) {
      this.endSimulation();
    }

    // Periodic fitness update callback
    if (this.callbacks.onFitnessUpdate && Math.random() < 0.1) {
      this.callbacks.onFitnessUpdate(this.population.creatures);
    }
  }

  /**
   * End current simulation and move to display phase
   */
  private async endSimulation(): Promise<void> {
    this.setPhase(SimulationPhase.DISPLAYING);

    if (!this.population) return;

    // Record fitness history
    const stats = this.population.getStats();
    this.fitnessHistory.push({
      generation: stats.generation,
      best: stats.bestFitness,
      average: stats.averageFitness,
      worst: stats.worstFitness
    });

    if (this.callbacks.onGenerationComplete) {
      this.callbacks.onGenerationComplete({
        generation: stats.generation,
        bestFitness: stats.bestFitness,
        avgFitness: stats.averageFitness
      });
    }

    // Sort creatures by fitness and animate to new positions
    await this.animateSortByFitness();

    // Move to evolution phase
    this.setPhase(SimulationPhase.EVOLVING);
  }

  /**
   * Animate creatures sorting by fitness
   */
  private async animateSortByFitness(): Promise<void> {
    if (!this.population) return;

    const sorted = this.population.rankByFitness();
    const duration = 1000;  // ms
    const startTime = performance.now();

    // Store current positions
    const startPositions = new Map<string, { x: number; z: number }>();
    for (const creature of sorted) {
      const meshes = this.creatureRenderer.getCreatureMeshes(creature.genome.id);
      if (meshes) {
        startPositions.set(creature.genome.id, {
          x: meshes.group.position.x,
          z: meshes.group.position.z
        });
      }
    }

    // Calculate target positions
    const targetPositions = new Map<string, { x: number; z: number }>();
    sorted.forEach((creature, index) => {
      const gridX = index % this.GRID_SIZE;
      const gridY = Math.floor(index / this.GRID_SIZE);
      targetPositions.set(creature.genome.id, {
        x: gridX * this.CELL_SIZE,
        z: gridY * this.CELL_SIZE
      });
      creature.setGridPosition(gridX, gridY);
    });

    // Animate
    return new Promise(resolve => {
      const animateSort = (): void => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);  // Ease out cubic

        for (const creature of sorted) {
          const start = startPositions.get(creature.genome.id);
          const target = targetPositions.get(creature.genome.id);
          if (!start || !target) continue;

          const x = start.x + (target.x - start.x) * eased;
          const z = start.z + (target.z - start.z) * eased;

          this.creatureRenderer.setCreatureOffset(creature.genome.id, { x, y: 0, z });
        }

        this.sceneManager.render();

        if (t < 1) {
          requestAnimationFrame(animateSort);
        } else {
          resolve();
        }
      };

      animateSort();
    });
  }

  /**
   * Evolve to next generation
   */
  async evolve(): Promise<void> {
    if (!this.population) return;

    this.setPhase(SimulationPhase.EVOLVING);

    // Get new genomes from evolution
    const newGenomes = this.population.evolve();

    // Clean up current creatures
    for (const creature of this.population.creatures) {
      creature.dispose();
    }

    // Clean up pellets
    for (const pelletList of this.pellets.values()) {
      for (const pellet of pelletList) {
        pellet.dispose(this.sceneManager.scene);
      }
    }
    this.pellets.clear();

    // Reset physics
    this.physicsWorld.reset();

    // Create new creatures from genomes
    this.population.replaceCreatures(newGenomes);

    // Re-initialize with physics and rendering
    let index = 0;
    for (const creature of this.population.creatures) {
      const gridX = index % this.GRID_SIZE;
      const gridY = Math.floor(index / this.GRID_SIZE);

      const offset = {
        x: gridX * this.CELL_SIZE,
        y: 2,
        z: gridY * this.CELL_SIZE
      };

      creature.setGridPosition(gridX, gridY);
      creature.initializePhysics(this.physicsWorld, this.bodyFactory, offset);
      creature.initializeRendering(this.sceneManager.scene, this.creatureRenderer, {
        x: gridX * this.CELL_SIZE,
        y: 0,
        z: gridY * this.CELL_SIZE
      });

      // Create new pellets
      const creaturePellets = createRandomPellets(
        this.config.pelletCount,
        this.CELL_SIZE * 0.8,
        0.5
      ).map(config => {
        const pellet = new Pellet({
          ...config,
          position: {
            x: config.position.x + gridX * this.CELL_SIZE,
            y: config.position.y,
            z: config.position.z + gridY * this.CELL_SIZE
          }
        });
        pellet.createMesh(this.sceneManager.scene);
        return pellet;
      });

      this.pellets.set(creature.genome.id, creaturePellets);
      index++;
    }

    this.simulationTime = 0;

    // Return to simulation
    this.setPhase(SimulationPhase.SIMULATING);
  }

  /**
   * Run a full generation cycle
   */
  async runGeneration(): Promise<void> {
    if (this.phase === SimulationPhase.MENU) {
      await this.generate();
    }

    this.start();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SimulationConfig>): void {
    Object.assign(this.config, config);
    this.physicsWorld.updateConfig(config);
    if (this.population) {
      this.population.updateConfig(config);
    }
  }

  /**
   * Get current stats
   */
  getStats(): { generation: number; bestFitness: number; avgFitness: number; phase: SimulationPhase; time: number } {
    const stats = this.population?.getStats();
    return {
      generation: stats?.generation || 0,
      bestFitness: stats?.bestFitness || 0,
      avgFitness: stats?.averageFitness || 0,
      phase: this.phase,
      time: this.simulationTime
    };
  }

  /**
   * Get population
   */
  getPopulation(): Population | null {
    return this.population;
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.isRunning = false;
    this.population?.dispose();

    for (const pelletList of this.pellets.values()) {
      for (const pellet of pelletList) {
        pellet.dispose(this.sceneManager.scene);
      }
    }

    this.physicsWorld.dispose();
    this.creatureRenderer.dispose();
    this.sceneManager.dispose();
  }
}
