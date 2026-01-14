import { describe, it, expect } from 'vitest';
import { generateRandomGenome, getGenomeCenterOfMass } from '../core/Genome';
import { DEFAULT_GENOME_CONSTRAINTS, type GenomeConstraints } from '../types';

describe('Genome Generation', () => {
  describe('generateRandomGenome', () => {
    it('creates a genome with valid id', () => {
      const genome = generateRandomGenome();
      expect(genome.id).toBeDefined();
      expect(typeof genome.id).toBe('string');
      expect(genome.id.length).toBeGreaterThan(0);
    });

    it('creates genome with generation 0', () => {
      const genome = generateRandomGenome();
      expect(genome.generation).toBe(0);
    });

    it('creates genome with survivalStreak 0', () => {
      const genome = generateRandomGenome();
      expect(genome.survivalStreak).toBe(0);
    });

    it('creates genome with empty parentIds', () => {
      const genome = generateRandomGenome();
      expect(genome.parentIds).toEqual([]);
    });

    it('creates genome with correct controller type', () => {
      const genome = generateRandomGenome();
      expect(genome.controllerType).toBe('oscillator');
    });

    it('respects minNodes constraint', () => {
      const constraints: GenomeConstraints = {
        ...DEFAULT_GENOME_CONSTRAINTS,
        minNodes: 5,
        maxNodes: 8
      };

      for (let i = 0; i < 10; i++) {
        const genome = generateRandomGenome(constraints);
        expect(genome.nodes.length).toBeGreaterThanOrEqual(5);
      }
    });

    it('respects maxNodes constraint', () => {
      const constraints: GenomeConstraints = {
        ...DEFAULT_GENOME_CONSTRAINTS,
        minNodes: 2,
        maxNodes: 4
      };

      for (let i = 0; i < 10; i++) {
        const genome = generateRandomGenome(constraints);
        expect(genome.nodes.length).toBeLessThanOrEqual(4);
      }
    });

    it('respects maxMuscles constraint', () => {
      const constraints: GenomeConstraints = {
        ...DEFAULT_GENOME_CONSTRAINTS,
        maxMuscles: 5
      };

      for (let i = 0; i < 10; i++) {
        const genome = generateRandomGenome(constraints);
        expect(genome.muscles.length).toBeLessThanOrEqual(5);
      }
    });

    it('creates at least n-1 muscles to connect n nodes', () => {
      for (let i = 0; i < 10; i++) {
        const genome = generateRandomGenome();
        // For n nodes, we need at least n-1 edges to form a spanning tree
        expect(genome.muscles.length).toBeGreaterThanOrEqual(genome.nodes.length - 1);
      }
    });

    it('creates nodes with positions within spawn radius', () => {
      const constraints: GenomeConstraints = {
        ...DEFAULT_GENOME_CONSTRAINTS,
        spawnRadius: 2.0
      };

      const genome = generateRandomGenome(constraints);
      for (const node of genome.nodes) {
        expect(Math.abs(node.position.x)).toBeLessThanOrEqual(constraints.spawnRadius);
        expect(Math.abs(node.position.z)).toBeLessThanOrEqual(constraints.spawnRadius);
        expect(node.position.y).toBeGreaterThanOrEqual(0); // Above ground
      }
    });

    it('creates nodes with size within constraints', () => {
      const genome = generateRandomGenome();
      for (const node of genome.nodes) {
        expect(node.size).toBeGreaterThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.minSize);
        expect(node.size).toBeLessThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.maxSize);
      }
    });

    it('creates nodes with friction in valid range', () => {
      const genome = generateRandomGenome();
      for (const node of genome.nodes) {
        expect(node.friction).toBeGreaterThanOrEqual(0);
        expect(node.friction).toBeLessThanOrEqual(1);
      }
    });

    it('creates muscles with frequency within constraints', () => {
      const genome = generateRandomGenome();
      for (const muscle of genome.muscles) {
        expect(muscle.frequency).toBeGreaterThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.minFrequency);
        expect(muscle.frequency).toBeLessThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.maxFrequency);
      }
    });

    it('creates muscles with stiffness within constraints', () => {
      const genome = generateRandomGenome();
      for (const muscle of genome.muscles) {
        expect(muscle.stiffness).toBeGreaterThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.minStiffness);
        expect(muscle.stiffness).toBeLessThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.maxStiffness);
      }
    });

    it('creates muscles with amplitude within constraints', () => {
      const genome = generateRandomGenome();
      for (const muscle of genome.muscles) {
        expect(muscle.amplitude).toBeGreaterThanOrEqual(0);
        expect(muscle.amplitude).toBeLessThanOrEqual(DEFAULT_GENOME_CONSTRAINTS.maxAmplitude);
      }
    });

    it('creates muscles that reference valid node ids', () => {
      const genome = generateRandomGenome();
      const nodeIds = new Set(genome.nodes.map(n => n.id));

      for (const muscle of genome.muscles) {
        expect(nodeIds.has(muscle.nodeA)).toBe(true);
        expect(nodeIds.has(muscle.nodeB)).toBe(true);
        expect(muscle.nodeA).not.toBe(muscle.nodeB); // No self-loops
      }
    });

    it('creates unique node ids', () => {
      const genome = generateRandomGenome();
      const ids = genome.nodes.map(n => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('creates unique muscle ids', () => {
      const genome = generateRandomGenome();
      const ids = genome.muscles.map(m => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('creates color with valid HSL values', () => {
      const genome = generateRandomGenome();
      expect(genome.color.h).toBeGreaterThanOrEqual(0);
      expect(genome.color.h).toBeLessThanOrEqual(1);
      expect(genome.color.s).toBeGreaterThanOrEqual(0);
      expect(genome.color.s).toBeLessThanOrEqual(1);
      expect(genome.color.l).toBeGreaterThanOrEqual(0);
      expect(genome.color.l).toBeLessThanOrEqual(1);
    });

    it('creates globalFrequencyMultiplier in reasonable range', () => {
      const genome = generateRandomGenome();
      expect(genome.globalFrequencyMultiplier).toBeGreaterThan(0);
      expect(genome.globalFrequencyMultiplier).toBeLessThan(3);
    });
  });

  describe('getGenomeCenterOfMass', () => {
    it('returns origin for empty genome', () => {
      const genome = generateRandomGenome();
      genome.nodes = [];
      const com = getGenomeCenterOfMass(genome);
      expect(com.x).toBe(0);
      expect(com.y).toBe(0);
      expect(com.z).toBe(0);
    });

    it('returns node position for single node', () => {
      const genome = generateRandomGenome();
      genome.nodes = [{
        id: 'test',
        size: 1,
        friction: 0.5,
        position: { x: 5, y: 3, z: 2 }
      }];
      const com = getGenomeCenterOfMass(genome);
      expect(com.x).toBeCloseTo(5);
      expect(com.y).toBeCloseTo(3);
      expect(com.z).toBeCloseTo(2);
    });

    it('calculates weighted center of mass', () => {
      const genome = generateRandomGenome();
      // Two nodes of equal size, COM should be midpoint
      genome.nodes = [
        { id: 'a', size: 1, friction: 0.5, position: { x: 0, y: 0, z: 0 } },
        { id: 'b', size: 1, friction: 0.5, position: { x: 10, y: 0, z: 0 } }
      ];
      const com = getGenomeCenterOfMass(genome);
      expect(com.x).toBeCloseTo(5);
      expect(com.y).toBe(0);
      expect(com.z).toBe(0);
    });
  });
});
