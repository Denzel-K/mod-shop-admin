import carModels from '@/lib/data/car-models.json';

export type Make = string;
export type Model = string;
export type CarBrand = {
  models: string[];
  icon: string;
  country: string;
};

type CarModelsData = Record<string, CarBrand>;

export function listMakes(): Make[] {
  return Object.keys(carModels).sort();
}

export function listModels(make?: Make): Model[] {
  if (!make) {
    const all = new Set<string>();
    for (const brand of Object.values(carModels as CarModelsData)) {
      for (const model of brand.models) all.add(model);
    }
    return Array.from(all).sort();
  }
  const brand = (carModels as CarModelsData)[make];
  return brand?.models ? [...brand.models].sort() : [];
}

export function getBrandInfo(make: string): CarBrand | null {
  return (carModels as CarModelsData)[make] || null;
}

export function getBrandIcon(make: string): string {
  const brand = getBrandInfo(make);
  return brand?.icon || 'car';
}

export function getBrandCountry(make: string): string {
  const brand = getBrandInfo(make);
  return brand?.country || '';
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
  for (const [make, brand] of Object.entries(carModels as CarModelsData)) {
    const nMake = normalizeName(make);
    if (nMake.includes(q)) {
      for (const model of brand.models) results.push({ make, model });
      continue;
    }
    for (const model of brand.models) {
      const nModel = normalizeName(model);
      if (nModel.includes(q)) results.push({ make, model });
    }
  }
  return results;
}
