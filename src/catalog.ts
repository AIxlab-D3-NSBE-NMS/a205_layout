import type { CatalogItemV1 } from './types';

export async function loadCatalogIndex(): Promise<string[]> {
  const res = await fetch('./catalog/index.json');
  if (!res.ok) throw new Error(`Failed to load catalog index: ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || !data.every((x) => typeof x === 'string')) {
    throw new Error('Invalid catalog/index.json (expected string[])');
  }
  return data;
}

export async function loadCatalogItem(path: string): Promise<CatalogItemV1> {
  const res = await fetch(path.startsWith('./') ? path : `./${path}`);
  if (!res.ok) throw new Error(`Failed to load catalog item: ${path} (${res.status})`);
  const data = (await res.json()) as unknown;
  if (!isCatalogItemV1(data)) throw new Error(`Invalid catalog item schema: ${path}`);
  return data;
}

export function isCatalogItemV1(v: unknown): v is CatalogItemV1 {
  const obj = v as Record<string, unknown>;
  return (
    typeof obj === 'object' &&
    obj !== null &&
    obj.version === 1 &&
    typeof obj.name === 'string' &&
    typeof obj.color === 'string' &&
    Array.isArray(obj.corners) &&
    obj.corners.every(
      (p) =>
        typeof p === 'object' &&
        p !== null &&
        typeof (p as any).x === 'number' &&
        typeof (p as any).y === 'number',
    )
  );
}
