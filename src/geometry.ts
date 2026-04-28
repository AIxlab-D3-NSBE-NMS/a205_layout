import type { Vec2 } from './types';

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function perp(v: Vec2): Vec2 {
  return { x: -v.y, y: v.x };
}

export function rotatePoint(p: Vec2, deg: number): Vec2 {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

export function polygonWorldPoints(
  cornersLocal: Vec2[],
  positionCm: Vec2,
  rotationDeg: number,
  scale: Vec2,
): Vec2[] {
  return cornersLocal.map((p) => {
    const scaled = { x: p.x * scale.x, y: p.y * scale.y };
    const rotated = rotatePoint(scaled, rotationDeg);
    return add(rotated, positionCm);
  });
}

export type Rect = { x: number; y: number; width: number; height: number };

export function rectCorners(r: Rect): Vec2[] {
  return [
    { x: r.x, y: r.y },
    { x: r.x + r.width, y: r.y },
    { x: r.x + r.width, y: r.y + r.height },
    { x: r.x, y: r.y + r.height },
  ];
}

function projectPolygon(axis: Vec2, points: Vec2[]): { min: number; max: number } {
  let min = dot(axis, points[0]);
  let max = min;
  for (let i = 1; i < points.length; i++) {
    const p = dot(axis, points[i]);
    if (p < min) min = p;
    if (p > max) max = p;
  }
  return { min, max };
}

function overlap1D(a: { min: number; max: number }, b: { min: number; max: number }): boolean {
  return a.max >= b.min && b.max >= a.min;
}

export function polygonIntersectsPolygonSAT(polyA: Vec2[], polyB: Vec2[]): boolean {
  const polys = [polyA, polyB];
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i];
      const p2 = poly[(i + 1) % poly.length];
      const edge = sub(p2, p1);
      const axis = perp(edge);
      const projA = projectPolygon(axis, polyA);
      const projB = projectPolygon(axis, polyB);
      if (!overlap1D(projA, projB)) return false;
    }
  }
  return true;
}

export function polygonIntersectsRectSAT(poly: Vec2[], rect: Rect): boolean {
  return polygonIntersectsPolygonSAT(poly, rectCorners(rect));
}

export function polygonInsideRect(poly: Vec2[], rect: Rect): boolean {
  return poly.every(
    (p) => p.x >= rect.x && p.x <= rect.x + rect.width && p.y >= rect.y && p.y <= rect.y + rect.height,
  );
}
