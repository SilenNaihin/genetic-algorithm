import * as THREE from 'three';
import type { CreatureGenome } from '../types';

/**
 * Creates a Three.js Group representing a creature from its genome.
 * Nodes are colored by friction (cyan=slippery, orange=grippy).
 * Muscles are colored by frequency (blue=slow, red=fast) and sized by stiffness.
 */
export function createCreatureMesh(genome: CreatureGenome): THREE.Group {
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

  const muscleMeshes: THREE.Mesh[] = [];
  for (let muscleIdx = 0; muscleIdx < genome.muscles.length; muscleIdx++) {
    const muscle = genome.muscles[muscleIdx];
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
    mesh.userData = {
      nodeA: muscle.nodeA,
      nodeB: muscle.nodeB,
      muscleIndex: muscleIdx,
      baseColor: muscleColor.clone()
    };
    updateMuscleMesh(mesh, nodeA.position, nodeB.position);
    muscleMeshes.push(mesh);
    group.add(mesh);
  }

  group.userData = { genome, nodeMeshes, muscleMeshes };
  return group;
}

/**
 * Updates a muscle mesh to stretch between two node positions.
 */
export function updateMuscleMesh(mesh: THREE.Mesh, posA: THREE.Vector3, posB: THREE.Vector3): void {
  const direction = posB.clone().sub(posA);
  const length = direction.length();
  mesh.position.copy(posA.clone().add(posB).multiplyScalar(0.5));
  mesh.scale.set(1, length, 1);
  if (length > 0.001) {
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  }
}
