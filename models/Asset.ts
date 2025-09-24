import mongoose, { Document, Schema } from 'mongoose';

export type AssetFormat = 'glb' | 'gltf';
export type AssetSource = 'sketchfab' | 'turbosquid' | 'internal' | 'other';

export interface ICreatorCredits {
  text?: string;
  creatorName?: string;
  profileUrl?: string;
  sourcePageUrl?: string;
  license?: string;
}

export interface IAssetMetadata {
  wrappableSurfaces?: string[];
  rims?: string[];
  windows?: string[];
  doors?: string[];
  tyres?: string[];
  interior?: string[];
  lights?: string[];
  other?: Record<string, string[]>;
}

export interface IAsset extends Document {
  name: string;
  description?: string;
  modelUrl: string;
  modelPublicId: string;
  thumbnailUrl: string;
  thumbnailPublicId: string;
  format: AssetFormat;
  sizeBytes?: number;
  scale?: number; // standardized scale factor for viewer
  // New categorization & provenance
  assetSource?: AssetSource;
  creatorCredits?: ICreatorCredits;
  make?: string;
  model?: string;
  year?: number;
  variant?: string;
  tags?: string[];
  // Rich metadata for configurator
  metadata?: IAssetMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const CreditsSchema = new Schema<ICreatorCredits>(
  {
    text: { type: String, trim: true },
    creatorName: { type: String, trim: true },
    profileUrl: { type: String, trim: true },
    sourcePageUrl: { type: String, trim: true },
    license: { type: String, trim: true },
  },
  { _id: false }
);

const MetadataSchema = new Schema<IAssetMetadata>(
  {
    wrappableSurfaces: [{ type: String, trim: true }],
    rims: [{ type: String, trim: true }],
    windows: [{ type: String, trim: true }],
    doors: [{ type: String, trim: true }],
    tyres: [{ type: String, trim: true }],
    interior: [{ type: String, trim: true }],
    lights: [{ type: String, trim: true }],
    other: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const AssetSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    modelUrl: { type: String, required: true },
    modelPublicId: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    thumbnailPublicId: { type: String, required: true },
    format: { type: String, enum: ['glb', 'gltf'], required: true },
    sizeBytes: { type: Number },
    // Default standardized scale for car models for consistent sizing in viewer
    scale: { type: Number, default: 0.01 },
    // New fields
    assetSource: { type: String, enum: ['sketchfab', 'turbosquid', 'internal', 'other'], default: undefined },
    creatorCredits: { type: CreditsSchema, default: undefined },
    make: { type: String, trim: true },
    model: { type: String, trim: true },
    year: { type: Number },
    variant: { type: String, trim: true },
    tags: [{ type: String, index: true }],
    metadata: { type: MetadataSchema, default: undefined },
  },
  { timestamps: true }
);

AssetSchema.index({ createdAt: -1 });
AssetSchema.index({ name: 1 });
AssetSchema.index({ make: 1, model: 1, year: 1 });

export default mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);
