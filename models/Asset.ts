import mongoose, { Schema } from 'mongoose';

export type AssetFormat = 'glb' | 'gltf';
export type AssetSource = 'sketchfab' | 'turbosquid' | 'internal' | 'other';

export interface ICreatorCredits {
  text?: string;
}

export type CuratorMode = 'self' | 'proxy' | 'automation' | 'import';

export interface ICuratorInfo {
  mode?: CuratorMode;
  adminId?: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
}

export interface IAssetMetadata {
  wrappableSurfaces?: Record<string, string>;
  rims?: Record<string, string>;
  windows?: Record<string, string>;
  doors?: Record<string, string>;
  tyres?: Record<string, string>;
  interior?: Record<string, string>;
  lights?: Record<string, string>;
  other?: Record<string, Record<string, string>>;
}

export interface IAsset {
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
  // Curator info
  curatedBy?: ICuratorInfo;
  curatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CreditsSchema = new Schema<ICreatorCredits>(
  {
    text: { type: String, trim: true },
  },
  { _id: false }
);

const MetadataSchema = new Schema<IAssetMetadata>(
  {
    wrappableSurfaces: { type: Schema.Types.Mixed },
    rims: { type: Schema.Types.Mixed },
    windows: { type: Schema.Types.Mixed },
    doors: { type: Schema.Types.Mixed },
    tyres: { type: Schema.Types.Mixed },
    interior: { type: Schema.Types.Mixed },
    lights: { type: Schema.Types.Mixed },
    other: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const CuratorSchema = new Schema<ICuratorInfo>(
  {
    mode: { type: String, enum: ['self', 'proxy', 'automation', 'import'], default: undefined },
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', default: undefined },
    name: { type: String, trim: true },
    email: { type: String, trim: true },
  },
  { _id: false }
);

const AssetSchema: Schema<IAsset> = new Schema(
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
    // Curator fields
    curatedBy: { type: CuratorSchema, default: undefined },
    curatedAt: { type: Date, default: undefined },
  },
  { timestamps: true }
);

AssetSchema.index({ createdAt: -1 });
AssetSchema.index({ name: 1 });
AssetSchema.index({ make: 1, model: 1, year: 1 });
AssetSchema.index({ 'curatedBy.adminId': 1 });

export default (mongoose.models.Asset as mongoose.Model<IAsset>) || mongoose.model<IAsset>('Asset', AssetSchema);
