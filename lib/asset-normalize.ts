export type MetadataMap = Partial<{
  wrappableSurfaces: string[];
  rims: string[];
  windows: string[];
  doors: string[];
  tyres: string[];
  interior: string[];
  lights: string[];
  other: Record<string, string[]>;
}>;

function uniqClean(values: (string | undefined | null)[]): string[] {
  const out = Array.from(
    new Set(
      values
        .map((v) => (typeof v === 'string' ? v.trim() : ''))
        .filter((v) => !!v)
    )
  );
  return out;
}

export function normalizeTags(tags: unknown): string[] | undefined {
  if (!tags) return undefined;
  if (Array.isArray(tags)) return uniqClean(tags.map((t) => String(t)));
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return uniqClean(parsed.map((t) => String(t)));
    } catch {}
    return uniqClean(String(tags).split(',').map((t) => t));
  }
  return undefined;
}

export function normalizeMetadata(input: unknown): MetadataMap | undefined {
  if (!input) return undefined;
  let obj: unknown = input;
  if (typeof input === 'string') {
    try { obj = JSON.parse(input); } catch { return undefined; }
  }
  if (typeof obj !== 'object' || obj === null) return undefined;
  const out: MetadataMap = {};
  const copyList = (key: keyof MetadataMap) => {
    const val = (obj as Record<string, unknown>)[key];
    if (!val) return;
    if (Array.isArray(val)) {
      (out as Record<string, unknown>)[key] = uniqClean(val.map((v) => String(v)));
    }
  };
  copyList('wrappableSurfaces');
  copyList('rims');
  copyList('windows');
  copyList('doors');
  copyList('tyres');
  copyList('interior');
  copyList('lights');
  const otherRaw = (obj as Record<string, unknown>).other;
  if (otherRaw && typeof otherRaw === 'object' && otherRaw !== null) {
    const other: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(otherRaw as Record<string, unknown>)) {
      if (Array.isArray(v)) other[k] = uniqClean(v.map((x) => String(x)));
    }
    if (Object.keys(other).length) out.other = other;
  }
  return Object.keys(out).length ? out : undefined;
}

export function normalizeAssetInput(body: Record<string, unknown>): {
  name?: string;
  description?: string;
  make?: string;
  model?: string;
  year?: number;
  variant?: string;
  assetSource?: 'sketchfab' | 'turbosquid' | 'internal' | 'other';
  creatorCredits?: {
    text?: string;
    creatorName?: string;
    profileUrl?: string;
    sourcePageUrl?: string;
    license?: string;
  };
  tags?: string[];
  metadata?: MetadataMap;
  scale?: number;
} {
  const out: Record<string, unknown> = {};
  if (typeof body.name === 'string') out.name = body.name.trim();
  if (typeof body.description === 'string') out.description = body.description.trim() || undefined;
  if (typeof body.make === 'string') out.make = body.make.trim() || undefined;
  if (typeof body.model === 'string') out.model = body.model.trim() || undefined;
  if (body.year !== undefined) {
    const y = Number(body.year as unknown as string);
    if (Number.isFinite(y)) out.year = y;
  }
  if (typeof body.variant === 'string') out.variant = body.variant.trim() || undefined;
  if (typeof body.assetSource === 'string' && ['sketchfab','turbosquid','internal','other'].includes(body.assetSource)) out.assetSource = body.assetSource as string;
  if (body.creatorCredits && typeof body.creatorCredits === 'object') {
    const cc = body.creatorCredits as Record<string, unknown>;
    out.creatorCredits = {
      text: typeof cc.text === 'string' ? cc.text.trim() : undefined,
      creatorName: typeof cc.creatorName === 'string' ? cc.creatorName.trim() : undefined,
      profileUrl: typeof cc.profileUrl === 'string' ? cc.profileUrl.trim() : undefined,
      sourcePageUrl: typeof cc.sourcePageUrl === 'string' ? cc.sourcePageUrl.trim() : undefined,
      license: typeof cc.license === 'string' ? cc.license.trim() : undefined,
    };
  }
  if (body.scale !== undefined) {
    const s = Number(body.scale as unknown as string);
    if (Number.isFinite(s) && s > 0) out.scale = Math.max(0.0001, Math.min(10000, s));
  }
  const meta = normalizeMetadata(body.metadata);
  if (meta) out.metadata = meta;
  const tags = normalizeTags(body.tags);
  if (tags) out.tags = tags;
  return out as {
    name?: string;
    description?: string;
    make?: string;
    model?: string;
    year?: number;
    variant?: string;
    assetSource?: 'sketchfab' | 'turbosquid' | 'internal' | 'other';
    creatorCredits?: {
      text?: string;
      creatorName?: string;
      profileUrl?: string;
      sourcePageUrl?: string;
      license?: string;
    };
    tags?: string[];
    metadata?: MetadataMap;
    scale?: number;
  };
}
