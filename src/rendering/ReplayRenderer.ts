import * as THREE from 'three';
import { createCreatureMesh, updateMuscleMesh } from './CreatureMeshFactory';
import type { CreatureSimulationResult, SimulationFrame, PelletData } from '../simulation/BatchSimulator';

/**
 * Handles 3D rendering for simulation replay.
 * Manages scene, camera, creature mesh, and pellet visualization.
 */
export class ReplayRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private creature: THREE.Group | null = null;
  private pellets: THREE.Mesh[] = [];
  private pelletLines: THREE.Line[] = [];

  constructor(container: HTMLElement) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f0f14);

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, 600 / 400, 0.1, 100);
    this.camera.position.set(8, 6, 12);
    this.camera.lookAt(0, 1, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(600, 400);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(5, 10, 5);
    this.scene.add(sun);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Grid
    const grid = new THREE.GridHelper(30, 30, 0x252532, 0x252532);
    grid.position.y = 0.01;
    this.scene.add(grid);
  }

  /**
   * Load a simulation result for replay.
   */
  loadResult(result: CreatureSimulationResult): void {
    // Clear previous
    if (this.creature) {
      this.scene.remove(this.creature);
    }
    this.pellets.forEach(p => this.scene.remove(p));
    this.pelletLines.forEach(l => this.scene.remove(l));
    this.pellets = [];
    this.pelletLines = [];

    // Create creature mesh
    this.creature = createCreatureMesh(result.genome);
    this.scene.add(this.creature);

    // Pellet material
    const pelletMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.3
    });

    // Line material for drop lines
    const lineMaterial = new THREE.LineDashedMaterial({
      color: 0x10b981,
      opacity: 0.3,
      transparent: true,
      dashSize: 0.1,
      gapSize: 0.1
    });

    // Create pellets and drop lines
    for (const pelletData of result.pellets) {
      const pellet = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), pelletMaterial.clone());
      pellet.position.set(pelletData.position.x, pelletData.position.y, pelletData.position.z);
      pellet.userData = { pelletData };
      this.scene.add(pellet);
      this.pellets.push(pellet);

      // Drop line from pellet to ground
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pelletData.position.x, pelletData.position.y, pelletData.position.z),
        new THREE.Vector3(pelletData.position.x, 0.01, pelletData.position.z)
      ]);
      const line = new THREE.Line(lineGeometry, lineMaterial.clone());
      line.computeLineDistances();
      line.userData = { pelletData };
      this.scene.add(line);
      this.pelletLines.push(line);
    }
  }

  /**
   * Update the replay to show a specific frame.
   */
  renderFrame(frame: SimulationFrame, frameIndex: number): void {
    if (!this.creature) return;

    const nodeMeshes = this.creature.userData.nodeMeshes as Map<string, THREE.Mesh>;

    // Update node positions
    for (const [nodeId, pos] of frame.nodePositions) {
      const mesh = nodeMeshes.get(nodeId);
      if (mesh) mesh.position.set(pos.x, pos.y, pos.z);
    }

    // Update muscle meshes
    for (const child of this.creature.children) {
      if (child.userData.nodeA) {
        const nodeA = nodeMeshes.get(child.userData.nodeA);
        const nodeB = nodeMeshes.get(child.userData.nodeB);
        if (nodeA && nodeB) {
          updateMuscleMesh(child as THREE.Mesh, nodeA.position, nodeB.position);
        }
      }
    }

    // Update pellet visibility
    for (let i = 0; i < this.pellets.length; i++) {
      const pellet = this.pellets[i];
      const line = this.pelletLines[i];
      const pelletData = pellet.userData.pelletData as PelletData;
      const hasSpawned = pelletData.spawnedAtFrame <= frameIndex;
      const isCollected = pelletData.collectedAtFrame !== null && frameIndex >= pelletData.collectedAtFrame;
      const isVisible = hasSpawned && !isCollected;
      pellet.visible = isVisible;
      if (line) line.visible = isVisible;
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Get the creature mesh for external manipulation (e.g., heatmap coloring).
   */
  getCreature(): THREE.Group | null {
    return this.creature;
  }

  /**
   * Render the current scene state.
   */
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.renderer.dispose();
  }
}
