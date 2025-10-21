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

export type MetadataCategory = keyof IAssetMetadata;

export interface IAssetProgressBreakdown {
  wrappableSurfaces?: number;
  rims?: number;
  windows?: number;
  doors?: number;
  tyres?: number;
  interior?: number;
  lights?: number;
  other?: number;
}

export interface IAssetProgressMetaCompleted {
  wrappableSurfaces?: boolean;
  rims?: boolean;
  windows?: boolean;
  doors?: boolean;
  tyres?: boolean;
  interior?: boolean;
  lights?: boolean;
  other?: boolean;
}

export interface IAssetProgress {
  overall?: number; // 0-100
  primaryInfo?: number; // e.g., 50 when created
  breakdown?: IAssetProgressBreakdown; // per-category percentages summing to 50
  metadataCompleted?: IAssetProgressMetaCompleted; // which metadata categories already counted
}

export interface IEditorRef {
  adminId?: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  at?: Date;
}

export interface IAssetContribution {
  adminId?: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  at?: Date;
  delta?: number; // awarded percentage for this edit
  categories?: MetadataCategory[]; // which categories contributed
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
  // Edit tracking
  lastEditedBy?: IEditorRef;
  contributions?: IAssetContribution[];
  progress?: IAssetProgress;
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

const EditorSchema = new Schema<IEditorRef>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', default: undefined },
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    at: { type: Date, default: undefined },
  },
  { _id: false }
);

const ProgressSchema = new Schema<IAssetProgress>(
  {
    overall: { type: Number, default: 0 },
    primaryInfo: { type: Number, default: 0 },
    breakdown: {
      wrappableSurfaces: { type: Number, default: 0 },
      rims: { type: Number, default: 0 },
      windows: { type: Number, default: 0 },
      doors: { type: Number, default: 0 },
      tyres: { type: Number, default: 0 },
      interior: { type: Number, default: 0 },
      lights: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    metadataCompleted: {
      wrappableSurfaces: { type: Boolean, default: false },
      rims: { type: Boolean, default: false },
      windows: { type: Boolean, default: false },
      doors: { type: Boolean, default: false },
      tyres: { type: Boolean, default: false },
      interior: { type: Boolean, default: false },
      lights: { type: Boolean, default: false },
      other: { type: Boolean, default: false },
    },
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
    // Edit tracking
    lastEditedBy: { type: EditorSchema, default: undefined },
    contributions: { type: [
      new Schema<IAssetContribution>({
        adminId: { type: Schema.Types.ObjectId, ref: 'Admin', default: undefined },
        name: { type: String, trim: true },
        email: { type: String, trim: true },
        at: { type: Date, default: undefined },
        delta: { type: Number, default: 0 },
        categories: { type: [String], default: undefined },
      }, { _id: false })
    ], default: undefined },
    progress: { type: ProgressSchema, default: undefined },
  },
  { timestamps: true }
);

AssetSchema.index({ createdAt: -1 });
AssetSchema.index({ name: 1 });
AssetSchema.index({ make: 1, model: 1, year: 1 });
AssetSchema.index({ 'curatedBy.adminId': 1 });
AssetSchema.index({ 'lastEditedBy.adminId': 1 });

export default (mongoose.models.Asset as mongoose.Model<IAsset>) || mongoose.model<IAsset>('Asset', AssetSchema);
