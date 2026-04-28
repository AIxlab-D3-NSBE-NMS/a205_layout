import Konva from 'konva';

export type WorldTransform = {
  group: Konva.Group;
  setScalePxPerCm: (s: number) => void;
  getScalePxPerCm: () => number;
};

export function createWorldTransform(layer: Konva.Layer, roomHeightCm: number): WorldTransform {
  const group = new Konva.Group({ x: 0, y: 0 });

  // World: origin bottom-left, +y up
  // Screen (Konva): origin top-left, +y down
  // Transform: translate by (0, roomHeightCm) then scale y by -1.
  // We also scale by px/cm for zoom.
  let scalePxPerCm = 1;

  function apply() {
    group.scale({ x: scalePxPerCm, y: -scalePxPerCm });
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
  };
}
