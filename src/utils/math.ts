import type { Vector3, HSL } from '../types';

export function distance(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVector3(a: Vector3, b: Vector3, t: number): Vector3 {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t)
  };
}

export function lerpHSL(a: HSL, b: HSL, t: number): HSL {
  // Handle hue wrapping
  let hDiff = b.h - a.h;
  if (hDiff > 0.5) hDiff -= 1;
  if (hDiff < -0.5) hDiff += 1;

  return {
    h: (a.h + hDiff * t + 1) % 1,
    s: lerp(a.s, b.s, t),
    l: lerp(a.l, b.l, t)
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}
