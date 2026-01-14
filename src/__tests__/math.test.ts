import { describe, it, expect } from 'vitest';
import type { Vector3 } from '../types';

// Test the math utilities that are currently duplicated across files
// These tests will still work after we extract them to utils/math.ts

// Inline the functions for now (they'll be imported from utils/math.ts after refactor)
function distance(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVector3(a: Vector3, b: Vector3, t: number): Vector3 {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t)
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

describe('Math Utilities', () => {
  describe('distance', () => {
    it('returns 0 for same points', () => {
      const point = { x: 1, y: 2, z: 3 };
      expect(distance(point, point)).toBe(0);
    });

    it('calculates distance along x axis', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 5, y: 0, z: 0 };
      expect(distance(a, b)).toBe(5);
    });

    it('calculates distance along y axis', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 0, y: 3, z: 0 };
      expect(distance(a, b)).toBe(3);
    });

    it('calculates distance along z axis', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 0, y: 0, z: 4 };
      expect(distance(a, b)).toBe(4);
    });

    it('calculates 3D distance correctly', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 3, y: 4, z: 0 };
      expect(distance(a, b)).toBe(5); // 3-4-5 triangle
    });

    it('handles negative coordinates', () => {
      const a = { x: -1, y: -1, z: -1 };
      const b = { x: 1, y: 1, z: 1 };
      expect(distance(a, b)).toBeCloseTo(Math.sqrt(12));
    });
  });

  describe('lerp', () => {
    it('returns a when t=0', () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });

    it('returns b when t=1', () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });

    it('returns midpoint when t=0.5', () => {
      expect(lerp(0, 100, 0.5)).toBe(50);
    });

    it('handles negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });

    it('extrapolates when t > 1', () => {
      expect(lerp(0, 10, 2)).toBe(20);
    });

    it('extrapolates when t < 0', () => {
      expect(lerp(0, 10, -1)).toBe(-10);
    });
  });

  describe('lerpVector3', () => {
    it('returns first vector when t=0', () => {
      const a = { x: 1, y: 2, z: 3 };
      const b = { x: 10, y: 20, z: 30 };
      const result = lerpVector3(a, b, 0);
      expect(result.x).toBe(1);
      expect(result.y).toBe(2);
      expect(result.z).toBe(3);
    });

    it('returns second vector when t=1', () => {
      const a = { x: 1, y: 2, z: 3 };
      const b = { x: 10, y: 20, z: 30 };
      const result = lerpVector3(a, b, 1);
      expect(result.x).toBe(10);
      expect(result.y).toBe(20);
      expect(result.z).toBe(30);
    });

    it('returns midpoint when t=0.5', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 10, y: 20, z: 30 };
      const result = lerpVector3(a, b, 0.5);
      expect(result.x).toBe(5);
      expect(result.y).toBe(10);
      expect(result.z).toBe(15);
    });
  });

  describe('clamp', () => {
    it('returns value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('clamps to min when below range', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('clamps to max when above range', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('handles negative range', () => {
      expect(clamp(-15, -10, -5)).toBe(-10);
    });

    it('returns min when min equals max', () => {
      expect(clamp(100, 5, 5)).toBe(5);
    });
  });
});
