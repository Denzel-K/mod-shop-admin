import mongoose, { Document, Schema } from 'mongoose';

export interface IAsset extends Document {
  name: string;
  description?: string;
  modelUrl: string;
  modelPublicId: string;
  thumbnailUrl: string;
  thumbnailPublicId: string;
  format: 'glb' | 'gltf';
  sizeBytes?: number;
  scale?: number; // standardized scale factor for viewer
  createdAt: Date;
  updatedAt: Date;
}

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
  },
  { timestamps: true }
);

AssetSchema.index({ createdAt: -1 });
AssetSchema.index({ name: 1 });

export default mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);
