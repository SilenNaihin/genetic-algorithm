import * as THREE from 'three';
import { generateRandomGenome } from '../core/Genome';
import { createCreatureMesh, updateMuscleMesh } from './CreatureMeshFactory';
import type { CreatureGenome, GenomeConstraints } from '../types';

export interface PreviewConfig {
  maxNodes: number;
  maxMuscles: number;
  maxAllowedFrequency: number;
  gravity: number;
}

/**
 * Renders an animated 3D creature preview for the menu screen.
 * Shows a randomly generated creature with pulsing muscle animations.
 */
export class PreviewRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private creature: THREE.Group | null = null;
  private genome: CreatureGenome | null = null;
  private time: number = 0;
  private animationId: number | null = null;
  private getConfig: () => PreviewConfig;

  constructor(container: HTMLElement, getConfig: () => PreviewConfig) {
    this.getConfig = getConfig;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f0f14);

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, 400 / 300, 0.1, 100);
    this.camera.position.set(4, 3, 6);
    this.camera.lookAt(0, 1, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(400, 300);
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
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Grid
    const grid = new THREE.GridHelper(20, 20, 0x252532, 0x252532);
    grid.position.y = 0.01;
    this.scene.add(grid);

    // Decorative pellets
    const pelletMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.3
    });
    for (let i = 0; i < 3; i++) {
      const pellet = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), pelletMaterial);
      pellet.position.set((Math.random() - 0.5) * 6, 0.25, (Math.random() - 0.5) * 6);
      this.scene.add(pellet);
    }

    // Initial creature
    this.regenerateCreature();
  }

  /**
   * Generate a new random creature at max complexity.
   */
  regenerateCreature(): void {
    // Remove old creature
    if (this.creature) {
      this.scene.remove(this.creature);
    }

    const config = this.getConfig();

    // Generate creature at MAX complexity so user can see what the limits look like
    const effectiveMaxNodes = Math.min(config.maxNodes, config.maxMuscles + 1);
    const constraints: GenomeConstraints = {
      minNodes: effectiveMaxNodes,
      maxNodes: effectiveMaxNodes,
      minMuscles: 1,
      maxMuscles: config.maxMuscles,
      minSize: 0.2,
      maxSize: 0.8,
      minStiffness: 50,
      maxStiffness: 500,
      minFrequency: 0.5,
      maxFrequency: config.maxAllowedFrequency,
      maxAmplitude: 0.4,
      spawnRadius: 2.0
    };

    this.genome = generateRandomGenome(constraints);
    this.creature = createCreatureMesh(this.genome);
    this.scene.add(this.creature);
  }

  /**
   * Start the animation loop.
   */
  startAnimation(): void {
    if (this.animationId !== null) return;
    this.animate();
  }

  /**
   * Stop the animation loop.
   */
  stopAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.time += 0.016;

    if (this.creature && this.genome) {
      const nodeMeshes = this.creature.userData.nodeMeshes as Map<string, THREE.Mesh>;
      const config = this.getConfig();

      // Gravity effect: stronger gravity = more sag
      const gravityStrength = Math.abs(config.gravity);
      const gravitySag = Math.max(0, (gravityStrength - 9.8) / 20) * 0.5;

      for (const node of this.genome.nodes) {
        const mesh = nodeMeshes.get(node.id);
        if (!mesh) continue;

        let x = node.position.x, y = node.position.y, z = node.position.z;

        for (const muscle of this.genome.muscles) {
          if (muscle.nodeA !== node.id && muscle.nodeB !== node.id) continue;

          const freq = muscle.frequency * this.genome.globalFrequencyMultiplier;
          const contraction = Math.sin(this.time * freq * Math.PI * 2 + muscle.phase);
          const amount = contraction * muscle.amplitude * 0.3;

          const otherNodeId = muscle.nodeA === node.id ? muscle.nodeB : muscle.nodeA;
          const otherNode = this.genome.nodes.find(n => n.id === otherNodeId);
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
    }

    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.stopAnimation();
    this.renderer.dispose();
  }
}
