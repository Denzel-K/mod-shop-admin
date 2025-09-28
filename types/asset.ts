export type AssetMetadata = {
  wrappableSurfaces?: Record<string, string>;
  rims?: Record<string, string>;
  windows?: Record<string, string>;
  doors?: Record<string, string>;
  tyres?: Record<string, string>;
  interior?: Record<string, string>;
  lights?: Record<string, string>;
  other?: Record<string, Record<string, string>>;
};

export type Asset = {
  _id: string;
  name: string;
  description?: string;
  thumbnailUrl: string;
  modelUrl: string;
  format: 'glb' | 'gltf';
  scale?: number;
  assetSource?: 'sketchfab' | 'turbosquid' | 'internal' | 'other';
  creatorCredits?: { text?: string };
  make?: string;
  model?: string;
  year?: number;
  variant?: string;
  tags?: string[];
  metadata?: AssetMetadata;
  curatedBy?: { mode?: 'self' | 'proxy' | 'automation' | 'import'; adminId?: string; name?: string; email?: string };
  curatedAt?: string | Date;
}
