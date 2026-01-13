import * as THREE from 'three';
import type { CreatureGenome, Vector3, CreatureState } from '../types';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import { BodyFactory, CreaturePhysics } from '../physics/BodyFactory';
import { CreatureRenderer, CreatureMeshes } from '../rendering/CreatureRenderer';
import { Pellet } from './Pellet';

export class Creature {
  genome: CreatureGenome;
  state: CreatureState;

  // Physics
  private physics: CreaturePhysics | null = null;
  private bodyFactory: BodyFactory | null = null;

  // Rendering
  private meshes: CreatureMeshes | null = null;
  private renderer: CreatureRenderer | null = null;

  // Tracking
  private simulationTime: number = 0;

  constructor(genome: CreatureGenome) {
    this.genome = genome;
    this.state = this.createInitialState(genome);
  }

  private createInitialState(genome: CreatureGenome): CreatureState {
    const nodePositions = new Map<string, Vector3>();
    const nodeVelocities = new Map<string, Vector3>();

    for (const node of genome.nodes) {
      nodePositions.set(node.id, { ...node.position });
      nodeVelocities.set(node.id, { x: 0, y: 0, z: 0 });
    }

    return {
      genome,
      nodePositions,
      nodeVelocities,
      centerOfMass: { x: 0, y: 0, z: 0 },
      fitness: 0,
      pelletsCollected: 0,
      distanceTraveled: 0,
      closestPelletDistance: Infinity,
      gridX: 0,
      gridY: 0,
      isSelected: false
    };
  }

  initializePhysics(
    _physicsWorld: PhysicsWorld,
    bodyFactory: BodyFactory,
    offset: Vector3 = { x: 0, y: 0, z: 0 }
  ): void {
    this.bodyFactory = bodyFactory;
    this.physics = bodyFactory.createCreaturePhysics(this.genome, offset);
  }

  initializeRendering(
    _scene: THREE.Scene,
    renderer: CreatureRenderer,
    offset: Vector3 = { x: 0, y: 0, z: 0 }
  ): void {
    this.renderer = renderer;
    this.meshes = renderer.createCreatureMesh(this.genome, offset);
  }

  update(deltaTime: number): void {
    if (!this.physics || !this.bodyFactory) return;

    this.simulationTime += deltaTime;

    // Update muscle springs with oscillation
    this.bodyFactory.updateMuscleSprings(
      this.physics.muscleSprings,
      this.simulationTime,
      this.genome.globalFrequencyMultiplier
    );

    // Update state from physics
    const newPositions = this.bodyFactory.getNodePositions(this.physics.nodeBodies);
    const newCenterOfMass = this.bodyFactory.getCenterOfMass(this.physics.nodeBodies);

    // Calculate distance traveled
    const dx = newCenterOfMass.x - this.state.centerOfMass.x;
    const dy = newCenterOfMass.y - this.state.centerOfMass.y;
    const dz = newCenterOfMass.z - this.state.centerOfMass.z;
    this.state.distanceTraveled += Math.sqrt(dx * dx + dy * dy + dz * dz);

    this.state.nodePositions = newPositions;
    this.state.centerOfMass = newCenterOfMass;

    // Update velocities
    for (const [nodeId, body] of this.physics.nodeBodies) {
      this.state.nodeVelocities.set(nodeId, {
        x: body.velocity.x,
        y: body.velocity.y,
        z: body.velocity.z
      });
    }
  }

  syncMeshToPhysics(): void {
    if (!this.renderer || !this.meshes) return;

    this.renderer.updateCreatureFromGenome(this.genome, this.state.nodePositions);
  }

  checkPelletCollisions(pellets: Pellet[]): number {
    let newCollections = 0;

    for (const pellet of pellets) {
      if (pellet.collected) continue;

      // Check collision with any node
      for (const [nodeId, position] of this.state.nodePositions) {
        const node = this.genome.nodes.find(n => n.id === nodeId);
        if (!node) continue;

        const nodeRadius = node.size * 0.5;

        if (pellet.checkCollision(position, nodeRadius)) {
          pellet.setCollected(true);
          this.state.pelletsCollected++;
          newCollections++;
          break;
        }
      }

      // Track closest pellet distance for fitness
      if (!pellet.collected) {
        const distance = pellet.distanceTo(this.state.centerOfMass);
        if (distance < this.state.closestPelletDistance) {
          this.state.closestPelletDistance = distance;
        }
      }
    }

    return newCollections;
  }

  calculateFitness(pellets: Pellet[]): number {
    // Find minimum distance to any uncollected pellet
    let minPelletDistance = Infinity;
    for (const pellet of pellets) {
      if (!pellet.collected) {
        const distance = pellet.distanceTo(this.state.centerOfMass);
        if (distance < minPelletDistance) {
          minPelletDistance = distance;
        }
      }
    }

    // Fitness components:
    // 1. Base reward for pellets collected (major factor)
    const pelletReward = this.state.pelletsCollected * 100;

    // 2. Reward for getting close to pellets (minor factor)
    const proximityReward = minPelletDistance < Infinity
      ? Math.max(0, 20 - minPelletDistance) * 2
      : 0;

    // 3. Small reward for movement (to encourage exploration)
    const movementReward = Math.min(this.state.distanceTraveled * 0.5, 10);

    // 4. Penalty for staying too still (to discourage degenerate solutions)
    const stillnessPenalty = this.state.distanceTraveled < 0.5 ? -5 : 0;

    this.state.fitness = pelletReward + proximityReward + movementReward + stillnessPenalty;
    return this.state.fitness;
  }

  reset(offset: Vector3 = { x: 0, y: 0, z: 0 }): void {
    this.state = this.createInitialState(this.genome);
    this.simulationTime = 0;

    // Reset physics bodies to initial positions
    if (this.physics) {
      for (const node of this.genome.nodes) {
        const body = this.physics.nodeBodies.get(node.id);
        if (body) {
          body.position.set(
            node.position.x + offset.x,
            node.position.y + offset.y,
            node.position.z + offset.z
          );
          body.velocity.set(0, 0, 0);
          body.angularVelocity.set(0, 0, 0);
          body.force.set(0, 0, 0);
          body.torque.set(0, 0, 0);
        }
      }

      // Reset spring rest lengths
      for (const oscillating of this.physics.muscleSprings.values()) {
        oscillating.spring.restLength = oscillating.baseRestLength;
      }
    }

    // Update meshes to match
    this.syncMeshToPhysics();
  }

  dispose(): void {
    if (this.physics && this.bodyFactory) {
      this.bodyFactory.removeCreaturePhysics(this.genome);
    }

    if (this.renderer) {
      this.renderer.removeCreature(this.genome.id);
    }

    this.physics = null;
    this.meshes = null;
  }

  getPosition(): Vector3 {
    return this.state.centerOfMass;
  }

  setGridPosition(x: number, y: number): void {
    this.state.gridX = x;
    this.state.gridY = y;
  }

  setSelected(selected: boolean): void {
    this.state.isSelected = selected;
  }
}
