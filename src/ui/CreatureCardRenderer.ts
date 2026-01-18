import * as THREE from 'three';
import { createCreatureMesh, updateMuscleMesh } from '../rendering/CreatureMeshFactory';
import type { CreatureSimulationResult } from '../simulation/BatchSimulator';
import type { CreatureGenome } from '../types';

/**
 * Handles WebGL rendering for creature card thumbnails.
 * Uses a shared offscreen renderer for efficiency.
 */
export class CreatureCardRenderer {
  private sharedRenderer: THREE.WebGLRenderer;
  private sharedScene: THREE.Scene;
  private sharedCamera: THREE.PerspectiveCamera;

  constructor() {
    // Offscreen WebGL renderer for card thumbnails
    this.sharedRenderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.sharedRenderer.setSize(160, 160);
    this.sharedRenderer.setClearColor(0x1e1e2a, 1);

    this.sharedScene = new THREE.Scene();
    this.sharedScene.background = new THREE.Color(0x1e1e2a);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.sharedScene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(5, 10, 5);
    this.sharedScene.add(sun);

    this.sharedCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.sharedCamera.position.set(3, 2.5, 3);
    this.sharedCamera.lookAt(0, 0.3, 0);
  }

  /**
   * Render a creature to a 2D canvas for card thumbnails.
   * Shows the creature in its final frame pose if available.
   */
  renderToCanvas(result: CreatureSimulationResult, canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous creatures from shared scene (keep lights)
    const toRemove: THREE.Object3D[] = [];
    this.sharedScene.traverse((obj) => {
      if (obj.type === 'Group') toRemove.push(obj);
    });
    toRemove.forEach(obj => this.sharedScene.remove(obj));

    // Create and add creature
    const creature = createCreatureMesh(result.genome);
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
          if (nodeA && nodeB) updateMuscleMesh(child as THREE.Mesh, nodeA.position, nodeB.position);
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

  /**
   * Clean up WebGL resources.
   */
  dispose(): void {
    this.sharedRenderer.dispose();
  }
}

/**
 * Generate a short unique name from genome characteristics.
 * Format: [HueLetter][StructLetter][Counter] + optional survival star
 * Example: "RB42" or "RB42★3"
 */
export function getCreatureName(genome: CreatureGenome): string {
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
