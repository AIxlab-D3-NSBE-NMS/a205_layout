import type { PlacedItem, Vec2 } from './types';
import { polygonInsideRect, polygonIntersectsRectSAT, polygonWorldPoints, type Rect } from './geometry';

export type ConstraintResult = { ok: true } | { ok: false; reason: string };

export function validatePlacedItem(
  item: Pick<PlacedItem, 'corners' | 'positionCm' | 'rotationDeg' | 'scale'>,
  room: { widthCm: number; heightCm: number },
  pillarRect: Rect,
): ConstraintResult {
  const worldPoly = polygonWorldPoints(item.corners, item.positionCm, item.rotationDeg, item.scale);

  const roomRect: Rect = { x: 0, y: 0, width: room.widthCm, height: room.heightCm };
  if (!polygonInsideRect(worldPoly, roomRect)) {
    return { ok: false, reason: 'Item must stay inside room boundary.' };
  }

  if (polygonIntersectsRectSAT(worldPoly, pillarRect)) {
    return { ok: false, reason: 'Item cannot intersect the pillar.' };
  }

  return { ok: true };
}

export function defaultSpawnPosition(
  room: { widthCm: number; heightCm: number },
  corners: Vec2[],
): Vec2 {
  // Place near room center, and shift so polygon roughly centered around its own local bounds.
  let minX = corners[0]?.x ?? 0;
  let maxX = minX;
  let minY = corners[0]?.y ?? 0;
  let maxY = minY;
  for (const p of corners) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return { x: room.widthCm / 2 - cx, y: room.heightCm / 2 - cy };
}
