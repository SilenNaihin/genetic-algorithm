import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { Vector3 } from '../types';

export interface PelletConfig {
  id: string;
  position: Vector3;
  radius?: number;
  color?: number;
}

export class Pellet {
  id: string;
  position: Vector3;
  radius: number;
  collected: boolean = false;

  // Three.js mesh
  mesh: THREE.Mesh | null = null;

  // Physics body (for collision detection)
  body: CANNON.Body | null = null;

  constructor(config: PelletConfig) {
    this.id = config.id;
    this.position = { ...config.position };
    this.radius = config.radius ?? 0.3;
  }

  createMesh(scene: THREE.Scene): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(this.radius, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x44ff88,
      emissive: 0x22aa44,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.5
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    scene.add(this.mesh);
    return this.mesh;
  }

  setCollected(collected: boolean): void {
    this.collected = collected;
    if (this.mesh) {
      this.mesh.visible = !collected;

      if (collected) {
        // Optionally change material to indicate collection
        const material = this.mesh.material as THREE.MeshStandardMaterial;
        material.opacity = 0.3;
        material.transparent = true;
      }
    }
  }

  distanceTo(point: Vector3): number {
    const dx = this.position.x - point.x;
    const dy = this.position.y - point.y;
    const dz = this.position.z - point.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  checkCollision(point: Vector3, collisionRadius: number): boolean {
    if (this.collected) return false;

    const distance = this.distanceTo(point);
    return distance < (this.radius + collisionRadius);
  }

  dispose(scene: THREE.Scene): void {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose();
      }
      this.mesh = null;
    }
  }
}

let pelletCounter = 0;

export function generatePelletId(): string {
  return `pellet_${Date.now()}_${pelletCounter++}`;
}

export function createRandomPellets(
  count: number,
  arenaSize: number,
  height: number = 0.5
): PelletConfig[] {
  const pellets: PelletConfig[] = [];

  for (let i = 0; i < count; i++) {
    pellets.push({
      id: generatePelletId(),
      position: {
        x: (Math.random() - 0.5) * arenaSize,
        y: height,
        z: (Math.random() - 0.5) * arenaSize
      }
    });
  }

  return pellets;
}
