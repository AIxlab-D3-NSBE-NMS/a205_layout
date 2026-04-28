import type { LayoutV1, PlacedItem } from './types';

export function newLayout(
  room: { widthCm: number; heightCm: number },
  fixed: LayoutV1['fixed'],
): LayoutV1 {
  const now = new Date().toISOString();
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    room: { ...room },
    fixed: structuredClone(fixed),
    items: [],
  };
}

export function updateLayoutTimestamp(layout: LayoutV1): LayoutV1 {
  return { ...layout, updatedAt: new Date().toISOString() };
}

export function validateLayoutV1(v: unknown): v is LayoutV1 {
  const obj = v as any;
  if (!obj || typeof obj !== 'object') return false;
  if (obj.version !== 1) return false;
  if (typeof obj.createdAt !== 'string' || typeof obj.updatedAt !== 'string') return false;
  if (!obj.room || typeof obj.room.widthCm !== 'number' || typeof obj.room.heightCm !== 'number') return false;
  if (!obj.fixed || typeof obj.fixed !== 'object') return false;
  if (!obj.fixed.pillar) return false;
  if (!Array.isArray(obj.fixed.doors) || !Array.isArray(obj.fixed.ramps)) return false;
  if (!Array.isArray(obj.fixed.windows)) return false;
  if (!Array.isArray(obj.fixed.technicalCabinets)) return false;
  if (!Array.isArray(obj.items)) return false;
  return obj.items.every(isPlacedItem);
}

function isPlacedItem(v: unknown): v is PlacedItem {
  const o = v as any;
  return (
    o &&
    typeof o === 'object' &&
    typeof o.id === 'string' &&
    typeof o.catalogName === 'string' &&
    typeof o.color === 'string' &&
    Array.isArray(o.corners) &&
    typeof o.positionCm?.x === 'number' &&
    typeof o.positionCm?.y === 'number' &&
    typeof o.rotationDeg === 'number' &&
    typeof o.scale?.x === 'number' &&
    typeof o.scale?.y === 'number' &&
    typeof o.zIndex === 'number'
  );
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result ?? 'null')));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    };
    reader.readAsText(file);
  });
}

const LS_KEY = 'room-layout-editor:layout-v1';

export function saveToLocalStorage(layout: LayoutV1) {
  localStorage.setItem(LS_KEY, JSON.stringify(layout));
}

export function loadFromLocalStorage(): LayoutV1 | null {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return validateLayoutV1(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
