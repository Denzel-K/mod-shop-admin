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
  curatedBy?: { mode?: 'self' | 'proxy' | 'automation' | 'import'; adminId?: string; name?: string; email?: string };
  curatedAt?: string | Date;
}
