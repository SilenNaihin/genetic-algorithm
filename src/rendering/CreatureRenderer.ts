import * as THREE from 'three';
import type { CreatureGenome, Vector3 } from '../types';

export interface CreatureMeshes {
  group: THREE.Group;
  nodes: Map<string, THREE.Mesh>;
  muscles: Map<string, THREE.Mesh>;
}

export class CreatureRenderer {
  private scene: THREE.Scene;
  private creatures: Map<string, CreatureMeshes> = new Map();

  // Shared geometries for performance
  private nodeGeometry: THREE.SphereGeometry;
  private muscleGeometry: THREE.CylinderGeometry;

  constructor(scene: THREE.Scene, highDetail: boolean = false) {
    this.scene = scene;

    // Create shared geometries
    const segments = highDetail ? 32 : 12;
    this.nodeGeometry = new THREE.SphereGeometry(1, segments, segments);
    this.muscleGeometry = new THREE.CylinderGeometry(1, 1, 1, highDetail ? 12 : 6);
  }

  createCreatureMesh(genome: CreatureGenome, offset: Vector3 = { x: 0, y: 0, z: 0 }): CreatureMeshes {
    const group = new THREE.Group();
    group.position.set(offset.x, offset.y, offset.z);

    const nodes = new Map<string, THREE.Mesh>();
    const muscles = new Map<string, THREE.Mesh>();

    // Create material with creature's color
    const color = new THREE.Color().setHSL(genome.color.h, genome.color.s, genome.color.l);
    const nodeMaterial = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.1
    });

    const muscleMaterial = new THREE.MeshStandardMaterial({
      color: color.clone().multiplyScalar(0.7),
      roughness: 0.5,
      metalness: 0.2
    });

    // Create node meshes
    for (const node of genome.nodes) {
      const mesh = new THREE.Mesh(this.nodeGeometry, nodeMaterial.clone());
      mesh.scale.setScalar(node.size);
      mesh.position.set(node.position.x, node.position.y, node.position.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { nodeId: node.id, genomeId: genome.id };

      nodes.set(node.id, mesh);
      group.add(mesh);
    }

    // Create muscle meshes (cylinders connecting nodes)
    for (const muscle of genome.muscles) {
      const nodeA = genome.nodes.find(n => n.id === muscle.nodeA);
      const nodeB = genome.nodes.find(n => n.id === muscle.nodeB);

      if (!nodeA || !nodeB) continue;

      const mesh = this.createMuscleMesh(
        nodeA.position,
        nodeB.position,
        muscleMaterial.clone()
      );
      mesh.userData = { muscleId: muscle.id, genomeId: genome.id };

      muscles.set(muscle.id, mesh);
      group.add(mesh);
    }

    this.scene.add(group);
    this.creatures.set(genome.id, { group, nodes, muscles });

    return { group, nodes, muscles };
  }

  private createMuscleMesh(
    posA: Vector3,
    posB: Vector3,
    material: THREE.Material
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(this.muscleGeometry, material);

    this.updateMuscleMeshPosition(mesh, posA, posB);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  updateMuscleMeshPosition(mesh: THREE.Mesh, posA: Vector3, posB: Vector3): void {
    const start = new THREE.Vector3(posA.x, posA.y, posA.z);
    const end = new THREE.Vector3(posB.x, posB.y, posB.z);

    const direction = end.clone().sub(start);
    const length = direction.length();
    const center = start.clone().add(end).multiplyScalar(0.5);

    mesh.position.copy(center);
    mesh.scale.set(0.08, length, 0.08);  // Thin cylinder

    // Orient cylinder to point from start to end
    if (length > 0.001) {
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize()
      );
    }
  }

  updateCreaturePositions(
    genomeId: string,
    nodePositions: Map<string, Vector3>
  ): void {
    const creature = this.creatures.get(genomeId);
    if (!creature) return;

    // Update node positions
    for (const [nodeId, position] of nodePositions) {
      const mesh = creature.nodes.get(nodeId);
      if (mesh) {
        mesh.position.set(position.x, position.y, position.z);
      }
    }

  }

  updateCreatureFromGenome(
    genome: CreatureGenome,
    nodePositions: Map<string, Vector3>
  ): void {
    const creature = this.creatures.get(genome.id);
    if (!creature) return;

    // Update node positions
    for (const [nodeId, position] of nodePositions) {
      const mesh = creature.nodes.get(nodeId);
      if (mesh) {
        mesh.position.set(position.x, position.y, position.z);
      }
    }

    // Update muscle meshes
    for (const muscle of genome.muscles) {
      const mesh = creature.muscles.get(muscle.id);
      if (!mesh) continue;

      const posA = nodePositions.get(muscle.nodeA);
      const posB = nodePositions.get(muscle.nodeB);

      if (posA && posB) {
        this.updateMuscleMeshPosition(mesh, posA, posB);
      }
    }
  }

  removeCreature(genomeId: string): void {
    const creature = this.creatures.get(genomeId);
    if (!creature) return;

    this.scene.remove(creature.group);

    // Dispose meshes
    for (const mesh of creature.nodes.values()) {
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    }

    for (const mesh of creature.muscles.values()) {
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    }

    this.creatures.delete(genomeId);
  }

  removeAllCreatures(): void {
    for (const genomeId of this.creatures.keys()) {
      this.removeCreature(genomeId);
    }
  }

  getCreatureMeshes(genomeId: string): CreatureMeshes | undefined {
    return this.creatures.get(genomeId);
  }

  setCreatureVisibility(genomeId: string, visible: boolean): void {
    const creature = this.creatures.get(genomeId);
    if (creature) {
      creature.group.visible = visible;
    }
  }

  setCreatureOffset(genomeId: string, offset: Vector3): void {
    const creature = this.creatures.get(genomeId);
    if (creature) {
      creature.group.position.set(offset.x, offset.y, offset.z);
    }
  }

  dispose(): void {
    this.removeAllCreatures();
    this.nodeGeometry.dispose();
    this.muscleGeometry.dispose();
  }
}
