export type Vec2 = { x: number; y: number };

export type CatalogItemV1 = {
  version: 1;
  name: string;
  corners: Vec2[];
  color: string;
};

export type PlacedItem = {
  id: string;
  catalogName: string;
  color: string;
  corners: Vec2[];
  positionCm: Vec2;
  rotationDeg: number;
  scale: Vec2;
  zIndex: number;
};

export type LayoutV1 = {
  version: 1;
  createdAt: string;
  updatedAt: string;
  room: {
    widthCm: number;
    heightCm: number;
  };
  fixed: {
    pillar: { xCm: number; yCm: number; widthCm: number; heightCm: number };
    doors: Array<{
      id: string;
      wall: 'bottom' | 'left' | 'top' | 'right';
      hingeCm: Vec2;
      widthCm: number;
      opensInward: boolean;
      hingeSide: 'left' | 'right' | 'bottom' | 'top';
    }>;
    ramps: Array<{ id: string; doorId: string; depthCm: number }>;
    windows: Array<{
      id: string;
      wall: 'top' | 'bottom' | 'left' | 'right';
      xCm: number;
      yCm: number;
      widthCm: number;
      heightCm: number;
    }>;
    technicalCabinets: Array<{
      id: string;
      wall: 'left' | 'right' | 'top' | 'bottom';
      xCm: number;
      yCm: number;
      widthCm: number;
      heightCm: number;
    }>;
  };
  items: PlacedItem[];
};
