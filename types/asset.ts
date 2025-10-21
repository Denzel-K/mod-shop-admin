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
  lastEditedBy?: { adminId?: string; name?: string; email?: string; at?: string | Date };
  contributions?: Array<{ adminId?: string; name?: string; email?: string; at?: string | Date; delta?: number; categories?: Array<keyof AssetMetadata> }>;
  progress?: {
    overall?: number;
    primaryInfo?: number;
    breakdown?: {
      wrappableSurfaces?: number;
      rims?: number;
      windows?: number;
      doors?: number;
      tyres?: number;
      interior?: number;
      lights?: number;
      other?: number;
    };
    metadataCompleted?: {
      wrappableSurfaces?: boolean;
      rims?: boolean;
      windows?: boolean;
      doors?: boolean;
      tyres?: boolean;
      interior?: boolean;
      lights?: boolean;
      other?: boolean;
    }
  };
}
