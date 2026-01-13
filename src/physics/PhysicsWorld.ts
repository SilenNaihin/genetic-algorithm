import * as CANNON from 'cannon-es';
import type { SimulationConfig } from '../types';
import { DEFAULT_CONFIG } from '../types';

export class PhysicsWorld {
  world: CANNON.World;
  private ground: CANNON.Body | null = null;
  private config: SimulationConfig;

  // Track bodies and constraints
  bodies: Map<string, CANNON.Body> = new Map();
  constraints: Map<string, CANNON.Spring> = new Map();
  private pelletBodies: Map<string, CANNON.Body> = new Map();

  constructor(config: SimulationConfig = DEFAULT_CONFIG) {
    this.config = config;

    // Create physics world
    this.world = new CANNON.World();
    this.world.gravity.set(0, config.gravity, 0);

    // Broadphase for collision detection
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);

    // Solver iterations for stability
    (this.world.solver as CANNON.GSSolver).iterations = 10;

    // Create ground
    this.createGround();
  }

  private createGround(): void {
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0,  // Static body
      shape: groundShape,
      material: new CANNON.Material({
        friction: this.config.groundFriction,
        restitution: 0.3
      })
    });

    // Rotate to be horizontal (pointing up)
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    groundBody.position.set(0, 0, 0);

    this.world.addBody(groundBody);
    this.ground = groundBody;
  }

  addBody(id: string, body: CANNON.Body): void {
    this.bodies.set(id, body);
    this.world.addBody(body);
  }

  removeBody(id: string): void {
    const body = this.bodies.get(id);
    if (body) {
      this.world.removeBody(body);
      this.bodies.delete(id);
    }
  }

  addSpring(id: string, spring: CANNON.Spring): void {
    this.constraints.set(id, spring);
  }

  removeSpring(id: string): void {
    this.constraints.delete(id);
  }

  addPellet(id: string, position: { x: number; y: number; z: number }, radius: number = 0.3): CANNON.Body {
    const shape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({
      mass: 0,  // Static pellet
      shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      collisionResponse: false,  // Trigger only, no physical response
      isTrigger: true
    });

    this.world.addBody(body);
    this.pelletBodies.set(id, body);
    return body;
  }

  removePellet(id: string): void {
    const body = this.pelletBodies.get(id);
    if (body) {
      this.world.removeBody(body);
      this.pelletBodies.delete(id);
    }
  }

  getPelletBody(id: string): CANNON.Body | undefined {
    return this.pelletBodies.get(id);
  }

  step(deltaTime: number): void {
    // Apply spring forces manually since Cannon-ES springs need manual update
    for (const spring of this.constraints.values()) {
      spring.applyForce();
    }

    // Step the physics simulation
    this.world.step(this.config.timeStep, deltaTime, 3);
  }

  updateConfig(config: Partial<SimulationConfig>): void {
    if (config.gravity !== undefined) {
      this.world.gravity.set(0, config.gravity, 0);
    }
    if (config.groundFriction !== undefined && this.ground) {
      if (this.ground.material) {
        this.ground.material.friction = config.groundFriction;
      }
    }
    Object.assign(this.config, config);
  }

  reset(): void {
    // Remove all bodies except ground
    for (const id of this.bodies.keys()) {
      this.removeBody(id);
    }

    // Remove all springs
    this.constraints.clear();

    // Remove all pellets
    for (const id of this.pelletBodies.keys()) {
      this.removePellet(id);
    }
  }

  getBodyPosition(id: string): { x: number; y: number; z: number } | null {
    const body = this.bodies.get(id);
    if (!body) return null;
    return {
      x: body.position.x,
      y: body.position.y,
      z: body.position.z
    };
  }

  getBodyVelocity(id: string): { x: number; y: number; z: number } | null {
    const body = this.bodies.get(id);
    if (!body) return null;
    return {
      x: body.velocity.x,
      y: body.velocity.y,
      z: body.velocity.z
    };
  }

  dispose(): void {
    this.reset();
    if (this.ground) {
      this.world.removeBody(this.ground);
    }
  }
}
