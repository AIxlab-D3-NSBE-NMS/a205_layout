export async function loadExamplesIndex(): Promise<string[]> {
  const res = await fetch('./examples/index.json');
  if (!res.ok) throw new Error(`Failed to load examples index: ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || !data.every((x) => typeof x === 'string')) {
    throw new Error('Invalid examples/index.json (expected string[])');
  }
  return data;
}

export async function loadExample(path: string): Promise<unknown> {
  const res = await fetch(path.startsWith('./') ? path : `./${path}`);
  if (!res.ok) throw new Error(`Failed to load example: ${path} (${res.status})`);
  return (await res.json()) as unknown;
}
