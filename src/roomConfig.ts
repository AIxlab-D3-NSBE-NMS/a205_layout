export type RoomConfig = {
  widthCm: number;
  heightCm: number;
  pillar: { xCm: number; yCm: number; widthCm: number; heightCm: number };
  doors: Array<{
    id: string;
    wall: 'bottom' | 'left' | 'top' | 'right';
    hingeCm: { x: number; y: number };
    widthCm: number;
    opensInward: boolean;
    hingeSide: 'left' | 'right' | 'bottom' | 'top';
  }>;
  ramps: Array<{
    id: string;
    doorId: string;
    depthCm: number;
  }>;
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

export const roomConfig: RoomConfig = {
  // 9m x 9m room (900 cm x 900 cm)
  widthCm: 900,
  heightCm: 900,

  // Blocking pillar
  // "300cm from top-left corner" => pillar top-left at (300, 800)
  // => bottom-left at (300, 700), w=50, h=100
  pillar: {
    xCm: 200,
    yCm: 500,
    widthCm: 50,
    heightCm: 100,
  },

  // Doors are visual only (boundary constraint is handled by room walls).
  doors: [
    {
      id: 'door-bottom',
      wall: 'bottom',
      hingeCm: { x: 450, y: 0 },
      widthCm: 90,
      opensInward: true,
      hingeSide: 'left',
    },
    {
      id: 'door-left',
      wall: 'left',
      hingeCm: { x: 0, y: 0 },
      widthCm: 90,
      opensInward: true,
      hingeSide: 'bottom',
    },
  ],

  // Ramps are visual only, rectangles just inside the room.
  ramps: [
    {
      id: 'ramp-bottom',
      doorId: 'door-bottom',
      depthCm: 120,
    },
    {
      id: 'ramp-left',
      doorId: 'door-left',
      depthCm: 120,
    },
  ],

  // Full-length window on north wall
  windows: [
    {
      id: 'window-north-full',
      wall: 'top',
      xCm: 0,
      yCm: 900,
      widthCm: 900,
      heightCm: 40,
    },
  ],

  // Fixed technical cabinet on the right wall
  technicalCabinets: [
    {
      id: 'cabinet-right-1',
      wall: 'right',
      xCm: 860,
      yCm: 500,
      widthCm: 40,
      heightCm: 100,
    },
  ],
};
