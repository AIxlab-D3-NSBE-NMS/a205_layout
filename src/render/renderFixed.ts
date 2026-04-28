import Konva from 'konva';
import type { RoomConfig } from '../roomConfig';

function stripePattern(fg: string, bg: string, size = 10, lineWidth = 3): HTMLImageElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = fg;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'square';
  // Draw diagonal line; repeat at ±size for seamless tiling
  for (const offset of [-size, 0, size]) {
    ctx.beginPath();
    ctx.moveTo(offset, size);
    ctx.lineTo(size + offset, 0);
    ctx.stroke();
  }
  return c as unknown as HTMLImageElement;
}

export function renderRoom(group: Konva.Group, room: { widthCm: number; heightCm: number }) {
  const rect = new Konva.Rect({
    x: 0,
    y: 0,
    width: room.widthCm,
    height: room.heightCm,
    stroke: '#111827',
    strokeWidth: 2,
    fill: '#ffffff',
    listening: false,
  });
  group.add(rect);
  return rect;
}

export function renderPillar(group: Konva.Group, cfg: RoomConfig['pillar']) {
  const rect = new Konva.Rect({
    x: cfg.xCm,
    y: cfg.yCm,
    width: cfg.widthCm,
    height: cfg.heightCm,
    fillPatternImage: stripePattern('#000000', '#ffffff', 8, 2),
    fillPatternRepeat: 'repeat',
    stroke: '#374151',
    strokeWidth: 1,
    listening: false,
  });
  group.add(rect);
  return rect;
}

export function renderDoorsAndRamps(group: Konva.Group, cfg: RoomConfig) {
  const shapes: Konva.Shape[] = [];

  for (const door of cfg.doors) {
    if (door.wall === 'bottom') {
      const x0 = door.hingeCm.x;
      const y0 = 0;
      const x1 = x0 + door.widthCm;

      const doorLine = new Konva.Line({
        points: [x0, y0, x1, y0],
        stroke: '#2563eb',
        strokeWidth: 4,
        listening: false,
      });
      group.add(doorLine);
      shapes.push(doorLine);

      const ramp = cfg.ramps.find((r) => r.doorId === door.id);
      if (ramp) {
        const rampRect = new Konva.Rect({
          x: x0,
          y: 0,
          width: door.widthCm,
          height: ramp.depthCm,
          fillPatternImage: stripePattern('#000000', '#ffffff', 10, 2),
          fillPatternRepeat: 'repeat',
          opacity: 0.8,
          listening: false,
        });
        group.add(rampRect);
        shapes.push(rampRect);
      }

      // Swing arc drawn after ramp so it renders on top
      const swingArc = new Konva.Arc({
        x: x0,
        y: y0,
        innerRadius: door.widthCm,
        outerRadius: door.widthCm,
        angle: 90,
        rotation: 0,
        stroke: '#2563eb',
        strokeWidth: 3,
        listening: false,
      });
      group.add(swingArc);
      shapes.push(swingArc);
    }

    if (door.wall === 'left') {
      const x0 = 0;
      const y0 = door.hingeCm.y;
      const y1 = y0 + door.widthCm;

      const doorLine = new Konva.Line({
        points: [x0, y0, x0, y1],
        stroke: '#2563eb',
        strokeWidth: 4,
        listening: false,
      });
      group.add(doorLine);
      shapes.push(doorLine);

      const ramp = cfg.ramps.find((r) => r.doorId === door.id);
      if (ramp) {
        const rampRect = new Konva.Rect({
          x: 0,
          y: y0,
          width: ramp.depthCm,
          height: door.widthCm,
          fillPatternImage: stripePattern('#000000', '#ffffff', 10, 2),
          fillPatternRepeat: 'repeat',
          opacity: 0.8,
          listening: false,
        });
        group.add(rampRect);
        shapes.push(rampRect);
      }

      // Swing arc drawn after ramp so it renders on top
      const swingArc = new Konva.Arc({
        x: x0,
        y: y0,
        innerRadius: door.widthCm,
        outerRadius: door.widthCm,
        angle: 90,
        rotation: 0,
        stroke: '#2563eb',
        strokeWidth: 3,
        listening: false,
      });
      group.add(swingArc);
      shapes.push(swingArc);
    }
  }

  return shapes;
}

export function renderWindows(group: Konva.Group, cfg: RoomConfig) {
  const shapes: Konva.Shape[] = [];
  for (const win of cfg.windows) {
    if (win.wall === 'top') {
      const rect = new Konva.Rect({
        x: win.xCm,
        y: win.yCm,
        width: win.widthCm,
        height: win.heightCm,
        fill: '#bfdbfe',
        stroke: '#3b82f6',
        strokeWidth: 2,
        listening: false,
      });
      group.add(rect);
      shapes.push(rect);
    }
  }
  return shapes;
}

export function renderTechnicalCabinets(group: Konva.Group, cfg: RoomConfig) {
  const shapes: Konva.Shape[] = [];
  for (const tc of cfg.technicalCabinets) {
    const rect = new Konva.Rect({
      x: tc.xCm,
      y: tc.yCm,
      width: tc.widthCm,
      height: tc.heightCm,
      fillPatternImage: stripePattern('#000000', '#ffffff', 8, 2),
      fillPatternRepeat: 'repeat',
      stroke: '#b45309',
      strokeWidth: 2,
      listening: false,
    });
    group.add(rect);
    shapes.push(rect);
  }
  return shapes;
}
