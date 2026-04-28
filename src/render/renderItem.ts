import Konva from 'konva';
import type { PlacedItem } from '../types';

export type ItemNode = {
  group: Konva.Group;
  polygon: Konva.Shape;
};

export function createItemNode(item: PlacedItem): ItemNode {
  const group = new Konva.Group({
    x: item.positionCm.x,
    y: item.positionCm.y,
    rotation: item.rotationDeg,
    scaleX: item.scale.x,
    scaleY: item.scale.y,
    draggable: true,
    name: 'movable-item',
    id: item.id,
  });

  const c = item.corners;
  const isAxisRect =
    c.length === 4 &&
    c[0].x === 0 && c[0].y === 0 &&
    c[1].y === 0 &&
    c[3].x === 0;

  let polygon: Konva.Shape;
  if (isAxisRect) {
    polygon = new Konva.Rect({
      x: 0,
      y: 0,
      width: c[1].x,
      height: c[2].y,
      fill: item.color,
      opacity: 0.75,
      stroke: '#111827',
      strokeWidth: 1,
      cornerRadius: 6,
    });
  } else {
    polygon = new Konva.Line({
      points: c.flatMap((p) => [p.x, p.y]),
      closed: true,
      fill: item.color,
      opacity: 0.75,
      stroke: '#111827',
      strokeWidth: 1,
    });
  }

  group.add(polygon);

  // Store last valid transform snapshot in attrs.
  group.setAttr('lastValid', {
    x: group.x(),
    y: group.y(),
    rotation: group.rotation(),
    scaleX: group.scaleX(),
    scaleY: group.scaleY(),
  });

  return { group, polygon };
}

export function syncItemFromNode(item: PlacedItem, group: Konva.Group): PlacedItem {
  return {
    ...item,
    positionCm: { x: group.x(), y: group.y() },
    rotationDeg: group.rotation(),
    scale: { x: group.scaleX(), y: group.scaleY() },
  };
}
