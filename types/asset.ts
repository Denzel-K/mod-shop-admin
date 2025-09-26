export type AssetMetadata = {
  wrappableSurfaces?: string[];
  rims?: string[];
  windows?: string[];
  doors?: string[];
  tyres?: string[];
  interior?: string[];
  lights?: string[];
  other?: Record<string, string[]>;
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
