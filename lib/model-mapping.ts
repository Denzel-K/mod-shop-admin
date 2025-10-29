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

// Map normalized make names to SVG filenames in public/car-model-icons/
const brandLogoMap: Record<string, string> = {
  'acura': 'acura.svg',
  'alfa romeo': 'alfa-romeo.svg',
  'aston martin': 'aston-martin.svg',
  'audi': 'audi.svg',
  'bentley': 'bentley.svg',
  'bmw': 'bmw.svg',
  'bugatti': 'bugatti.svg',
  'buick': 'buick.svg',
  'cadillac': 'cadillac.svg',
  'chevrolet': 'chevrolet.svg',
  'chrysler': 'chrysler.svg',
  'citroen': 'citroen.svg',
  'dacia': 'dacia.svg',
  'dodge': 'dodge.svg',
  'ferrari': 'ferrari.svg',
  'fiat': 'fiat.svg',
  'ford': 'ford.svg',
  'genesis': 'genesis.svg',
  'gmc': 'gmc.svg',
  'honda': 'honda.svg',
  'hyundai': 'hyundai.svg',
  'infiniti': 'infiniti.svg',
  'isuzu': 'isuzu.svg',
  'jaguar': 'jaguar-stroked.svg',
  'jeep': 'jeep.svg',
  'kia': 'kia.svg',
  'koenigsegg': 'koenigsegg.svg',
  'lamborghini': 'lamborghini-badge.svg',
  'land rover': 'land-rover.svg',
  'lexus': 'lexus.svg',
  'lincoln': 'lincoln.svg',
  'lotus': 'lotus.svg',
  'maserati': 'maserati.svg',
  'mazda': 'mazda.svg',
  'mclaren': 'mclaren.svg',
  'mercedes benz': 'mercedes-benz.svg',
  'mini': 'mini.svg',
  'mitsubishi': 'mitsubishi.svg',
  'nissan': 'nissan.svg',
  'opel': 'opel.svg',
  'pagani': 'pagani.svg',
  'peugeot': 'peugeot.svg',
  'porsche': 'porsche.svg',
  'ram': 'ram.svg',
  'renault': 'renault.svg',
  'rolls royce': 'rolls-royce.svg',
  'saab': 'saab.svg',
  'seat': 'seat.svg',
  'skoda': 'skoda.svg',
  'subaru': 'subaru.svg',
  'suzuki': 'suzuki.svg',
  'tesla': 'tesla.svg',
  'toyota': 'toyota.svg',
  'volkswagen': 'volkswagen.svg',
  'volvo': 'volvo.svg',
};

/**
 * Returns the public URL path to the brand logo SVG if available, otherwise null.
 * The path is relative to the Next.js public/ folder, e.g. "/car-model-icons/bmw.svg".
 */
export function getBrandLogo(make: string): string | null {
  if (!make) return null;
  const key = normalizeName(make).replace(/\s+/g, ' ').trim();
  const filename = brandLogoMap[key];
  if (!filename) return null;
  // If a filename is mapped but the actual file is missing at runtime, Next/Image will 404; components should handle nulls gracefully if desired.
  return `/car-model-icons/${filename}`;
}

