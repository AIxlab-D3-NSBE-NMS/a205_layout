export function newId(prefix: string): string {
  // Good enough for local-only layouts.
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
