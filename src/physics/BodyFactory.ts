import * as CANNON from 'cannon-es';
import type { CreatureGenome, MuscleGene, Vector3 } from '../types';
import { PhysicsWorld } from './PhysicsWorld';

export interface CreaturePhysics {
  nodeBodies: Map<string, CANNON.Body>;
  muscleSprings: Map<string, OscillatingSpring>;
}

export interface OscillatingSpring {
  spring: CANNON.Spring;
  muscle: MuscleGene;
  baseRestLength: number;
}

export class BodyFactory {
  private physicsWorld: PhysicsWorld;

  constructor(physicsWorld: PhysicsWorld) {
    this.physicsWorld = physicsWorld;
  }

  createCreaturePhysics(
    genome: CreatureGenome,
    offset: Vector3 = { x: 0, y: 0, z: 0 }
  ): CreaturePhysics {
    const nodeBodies = new Map<string, CANNON.Body>();
    const muscleSprings = new Map<string, OscillatingSpring>();

    // Create shared material for creature nodes
    const nodeMaterial = new CANNON.Material({
      friction: 0.5,
      restitution: 0.3
    });

    // Create physics bodies for each node
    for (const node of genome.nodes) {
      const radius = node.size * 0.5;  // Size is diameter, radius is half
      const shape = new CANNON.Sphere(radius);

      // Mass based on volume (sphere: 4/3 * pi * r^3)
      const mass = (4 / 3) * Math.PI * Math.pow(radius, 3) * 10;  // density ~10

      const body = new CANNON.Body({
        mass,
        shape,
        material: new CANNON.Material({
          friction: node.friction,
          restitution: 0.2
        }),
        position: new CANNON.Vec3(
          node.position.x + offset.x,
          node.position.y + offset.y,
          node.position.z + offset.z
        ),
        linearDamping: 0.1,
        angularDamping: 0.5
      });

      // Add some initial settling
      body.velocity.set(0, 0, 0);

      const bodyId = `${genome.id}_${node.id}`;
      this.physicsWorld.addBody(bodyId, body);
      nodeBodies.set(node.id, body);
    }

    // Create contact material between nodes and ground
    if (this.physicsWorld.world.bodies.length > 0) {
      const groundBody = this.physicsWorld.world.bodies[0];
      if (groundBody.material) {
        const contactMaterial = new CANNON.ContactMaterial(
          nodeMaterial,
          groundBody.material,
          {
            friction: 0.7,
            restitution: 0.2
          }
        );
        this.physicsWorld.world.addContactMaterial(contactMaterial);
      }
    }

    // Create springs for each muscle
    for (const muscle of genome.muscles) {
      const bodyA = nodeBodies.get(muscle.nodeA);
      const bodyB = nodeBodies.get(muscle.nodeB);

      if (!bodyA || !bodyB) {
        console.warn(`Missing body for muscle ${muscle.id}`);
        continue;
      }

      const spring = new CANNON.Spring(bodyA, bodyB, {
        restLength: muscle.restLength,
        stiffness: muscle.stiffness,
        damping: muscle.damping
      });

      const springId = `${genome.id}_${muscle.id}`;
      this.physicsWorld.addSpring(springId, spring);

      muscleSprings.set(muscle.id, {
        spring,
        muscle,
        baseRestLength: muscle.restLength
      });
    }

    return { nodeBodies, muscleSprings };
  }

  updateMuscleSprings(
    muscleSprings: Map<string, OscillatingSpring>,
    time: number,
    globalFrequencyMultiplier: number
  ): void {
    for (const oscillating of muscleSprings.values()) {
      const { spring, muscle, baseRestLength } = oscillating;

      // Calculate oscillation
      const frequency = muscle.frequency * globalFrequencyMultiplier;
      const phase = muscle.phase;
      const amplitude = muscle.amplitude;

      // Sinusoidal contraction
      const contraction = Math.sin(time * frequency * Math.PI * 2 + phase);
      const newRestLength = baseRestLength * (1 - contraction * amplitude);

      // Update spring rest length
      spring.restLength = Math.max(0.1, newRestLength);
    }
  }

  removeCreaturePhysics(genome: CreatureGenome): void {
    // Remove node bodies
    for (const node of genome.nodes) {
      const bodyId = `${genome.id}_${node.id}`;
      this.physicsWorld.removeBody(bodyId);
    }

    // Remove muscle springs
    for (const muscle of genome.muscles) {
      const springId = `${genome.id}_${muscle.id}`;
      this.physicsWorld.removeSpring(springId);
    }
  }

  getNodePositions(nodeBodies: Map<string, CANNON.Body>): Map<string, Vector3> {
    const positions = new Map<string, Vector3>();

    for (const [nodeId, body] of nodeBodies) {
      positions.set(nodeId, {
        x: body.position.x,
        y: body.position.y,
        z: body.position.z
      });
    }

    return positions;
  }

  getCenterOfMass(nodeBodies: Map<string, CANNON.Body>): Vector3 {
    let totalMass = 0;
    let cx = 0, cy = 0, cz = 0;

    for (const body of nodeBodies.values()) {
      cx += body.position.x * body.mass;
      cy += body.position.y * body.mass;
      cz += body.position.z * body.mass;
      totalMass += body.mass;
    }

    if (totalMass === 0) {
      return { x: 0, y: 0, z: 0 };
    }

    return {
      x: cx / totalMass,
      y: cy / totalMass,
      z: cz / totalMass
    };
  }
}
