import carModels from '@/lib/data/car-models.json';

export type Make = string;
export type Model = string;

export function listMakes(): Make[] {
  return Object.keys(carModels).sort();
}

export function listModels(make?: Make): Model[] {
  if (!make) {
    const all = new Set<string>();
    for (const models of Object.values(carModels)) {
      for (const m of models) all.add(m);
    }
    return Array.from(all).sort();
  }
  const models = (carModels as Record<string, string[]>)[make];
  return Array.isArray(models) ? [...models].sort() : [];
}

export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function search(query: string): { make: string; model: string }[] {
  const q = normalizeName(query);
  if (!q) return [];
  const results: { make: string; model: string }[] = [];
  for (const [make, models] of Object.entries(carModels as Record<string, string[]>)) {
    const nMake = normalizeName(make);
    if (nMake.includes(q)) {
      for (const model of models) results.push({ make, model });
      continue;
    }
    for (const model of models) {
      const nModel = normalizeName(model);
      if (nModel.includes(q)) results.push({ make, model });
    }
  }
  return results;
}
