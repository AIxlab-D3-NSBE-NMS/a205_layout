import Konva from 'konva';

export type WorldTransform = {
  group: Konva.Group;
  setScalePxPerCm: (s: number) => void;
  getScalePxPerCm: () => number;
  setRotationDeg: (r: number) => void;
  getRotationDeg: () => number;
};

export function createWorldTransform(layer: Konva.Layer, roomWidthCm: number, roomHeightCm: number): WorldTransform {
  const group = new Konva.Group({ x: 0, y: 0 });

  // World: origin bottom-left, +y up
  // Screen (Konva): origin top-left, +y down
  // Transform: scale, then rotate, then translate.
  // We also scale by px/cm for zoom.
  let scalePxPerCm = 1;
  let rotationDeg = 0;

  function apply() {
    group.scale({ x: scalePxPerCm, y: -scalePxPerCm });
    group.rotation(rotationDeg);
    // Keep group position fixed at original position
    group.position({ x: 0, y: roomHeightCm * scalePxPerCm });
  }

  apply();
  layer.add(group);

  return {
    group,
    setScalePxPerCm(s: number) {
      scalePxPerCm = s;
      apply();
    },
    getScalePxPerCm() {
      return scalePxPerCm;
    },
    setRotationDeg(r: number) {
      rotationDeg = ((r % 360) + 360) % 360;
      apply();
    },
    getRotationDeg() {
      return rotationDeg;
    },
  };
}
