import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Asset, { type IAsset } from '@/models/Asset';
import Admin from '@/models/Admin';
import type { Types } from 'mongoose';
import { verifyAdmin } from '@/lib/auth';
import { NodeIO } from '@gltf-transform/core';
import { getStorageService } from '@/lib/enhanced-storage';
import {
  FileValidator,
  FormDataParser,
  UploadProgressTracker,
  generateSafeFilename,
  getContentTypeForExtension,
} from '@/lib/upload-utils';
import { normalizeAssetInput } from '@/lib/asset-normalize';

export const runtime = 'nodejs';

// Increase body size limit for large file uploads
export const maxDuration = 300; // 5 minutes for large uploads

// GET /api/assets - list assets
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const sp = url.searchParams;
    const q = sp.get('q')?.trim();
    const make = sp.get('make')?.trim();
    const model = sp.get('model')?.trim();
    const yearStr = sp.get('year')?.trim();
    const assetSource = sp.get('assetSource')?.trim();
    const tag = sp.get('tag')?.trim();

    // Build a typed Mongo query
    const query: import('mongoose').FilterQuery<IAsset> = {};
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: rx },
        { make: rx },
        { model: rx },
        { tags: rx },
      ];
    }
    if (make) query.make = make;
    if (model) query.model = model;
    if (yearStr) {
      const y = Number(yearStr);
      if (Number.isFinite(y)) query.year = y;
    }
    if (assetSource && ['sketchfab','turbosquid','internal','other'].includes(assetSource)) query.assetSource = assetSource;
    if (tag) query.tags = tag;

    const assets = await Asset.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ assets }, { status: 200 });
  } catch (error) {
    console.error('List assets error:', error);
    return NextResponse.json({ error: 'Failed to list assets' }, { status: 500 });
  }
}

// POST /api/assets - upload new model (multipart/form-data)
export async function POST(req: NextRequest) {
  let uploadId: string | null = null;
  
  try {
    await connectDB();
    const storageService = getStorageService();

    // Parse form data
    const { fields, files } = await FormDataParser.parseMultipartForm(req);
    
    // Extract and validate required fields
    const name = FormDataParser.getRequiredField(fields, 'name');
    const description = FormDataParser.getOptionalField(fields, 'description');
    const scaleOverride = FormDataParser.getOptionalField(fields, 'scale');
    // New optional fields
    const assetSourceRaw = FormDataParser.getOptionalField(fields, 'assetSource');
    const make = FormDataParser.getOptionalField(fields, 'make');
    const model = FormDataParser.getOptionalField(fields, 'model');
    const yearRaw = FormDataParser.getOptionalField(fields, 'year');
    const variant = FormDataParser.getOptionalField(fields, 'variant');
    const tagsRaw = FormDataParser.getOptionalField(fields, 'tags');
    const metadataRaw = FormDataParser.getOptionalField(fields, 'metadata');
    const creatorCreditsRaw = FormDataParser.getOptionalField(fields, 'creatorCredits');
    // Or accept dot-notated individual creator credits (text only)
    const ccText = FormDataParser.getOptionalField(fields, 'creatorCredits.text') || FormDataParser.getOptionalField(fields, 'creditsText');

    // Extract and validate required files
    const modelFile = FormDataParser.getRequiredFile(files, 'model');
    const thumbFile = FormDataParser.getRequiredFile(files, 'thumbnail');

    // Create or attach to upload tracking
    const clientUploadId = fields.get('uploadId');
    if (clientUploadId && typeof clientUploadId === 'string' && clientUploadId.startsWith('upload_')) {
      uploadId = clientUploadId;
      // Initialize progress entry if not present
      if (!UploadProgressTracker.getProgress(uploadId)) {
        UploadProgressTracker.createUpload(modelFile.name);
      }
    } else {
      uploadId = UploadProgressTracker.createUpload(modelFile.name);
    }
    UploadProgressTracker.updateProgress(uploadId, 5, 'uploading');

    // Validate files
    let validatedModel, validatedThumb;
    try {
      validatedModel = await FileValidator.validateModelFile(modelFile);
      validatedThumb = await FileValidator.validateImageFile(thumbFile);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'File validation failed';
      UploadProgressTracker.setError(uploadId, errorMsg);
      return NextResponse.json({ error: errorMsg, uploadId }, { status: 400 });
    }

    UploadProgressTracker.updateProgress(uploadId, 15, 'processing');

    // Auto-scale computation (defaults to 1.0 if computation not possible)
    let computedScale = 1.0;

    // Generate safe filenames
    const timestamp = Date.now();
    const modelSafeBase = generateSafeFilename(name, timestamp);
    const modelFilename = `${modelSafeBase}.${validatedModel.extension}`;
    const thumbSafeBase = generateSafeFilename(name, timestamp);
    const thumbFilename = `${thumbSafeBase}.${validatedThumb.extension}`;

    console.log(`[Enhanced Upload] Processing ${name}: model=${modelFilename}, thumb=${thumbFilename}`);

    // Upload model with enhanced storage service
    UploadProgressTracker.updateProgress(uploadId, 25, 'uploading');
    let modelUpload;
    try {
      modelUpload = await storageService.upload({
        buffer: validatedModel.buffer,
        destination: `mod-shop/models/${modelFilename}`,
        contentType: getContentTypeForExtension(validatedModel.extension),
        retryAttempts: 3,
      });
      console.log(`[Enhanced Upload] Model uploaded via ${modelUpload.provider}: ${modelUpload.url}`);
    } catch (error) {
      const errorMsg = `Model upload failed: ${error instanceof Error ? error.message : 'unknown error'}`;
      UploadProgressTracker.setError(uploadId, errorMsg);
      return NextResponse.json({ error: errorMsg, uploadId }, { status: 500 });
    }

    UploadProgressTracker.updateProgress(uploadId, 50, 'processing');

    // Attempt auto-scaling using glTF-Transform by reading the uploaded buffer directly
    if (validatedModel.extension === 'glb') {
      try {
        const io = new NodeIO();
        // Read document from the original uploaded buffer
        const doc = await io.readBinary(validatedModel.buffer);
        const root = doc.getRoot();
        const min = [Infinity, Infinity, Infinity];
        const max = [-Infinity, -Infinity, -Infinity];
        // Aggregate bounds from POSITION attributes only
        for (const mesh of root.listMeshes()) {
          for (const prim of mesh.listPrimitives()) {
            const pos = prim.getAttribute('POSITION');
            if (!pos) continue;
            const aMin: number[] = [];
            const aMax: number[] = [];
            pos.getMin(aMin);
            pos.getMax(aMax);
            if (aMin.length === 3 && aMax.length === 3) {
              for (let i = 0; i < 3; i++) {
                if (Number.isFinite(aMin[i])) min[i] = Math.min(min[i], aMin[i]);
                if (Number.isFinite(aMax[i])) max[i] = Math.max(max[i], aMax[i]);
              }
            }
          }
        }
        const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]].map((v) => (Number.isFinite(v) ? v : 0));
        const maxDim = Math.max(size[0], size[1], size[2]);
        const targetMaxDim = 2.5; // aim to fit typical cars nicely in the viewer
        if (maxDim > 0) {
          computedScale = Math.max(0.001, Math.min(100, targetMaxDim / maxDim));
        }
        console.log(`[Enhanced Upload] Computed scale: ${computedScale} (maxDim: ${maxDim})`);
      } catch (error) {
        console.warn('[Enhanced Upload] Auto-scaling failed:', error);
        // Fallback to default if parsing fails
        computedScale = 1.0;
      }
    }

    // Optional scale override from form
    if (scaleOverride) {
      const so = Number(scaleOverride);
      if (Number.isFinite(so) && so > 0) {
        computedScale = Math.max(0.0001, Math.min(10000, so));
        console.log(`[Enhanced Upload] Scale override applied: ${computedScale}`);
      }
    }

    UploadProgressTracker.updateProgress(uploadId, 70, 'uploading');

    // Upload thumbnail with enhanced storage service
    let thumbUpload;
    try {
      thumbUpload = await storageService.upload({
        buffer: validatedThumb.buffer,
        destination: `mod-shop/thumbnails/${thumbFilename}`,
        contentType: getContentTypeForExtension(validatedThumb.extension),
        retryAttempts: 3,
      });
      console.log(`[Enhanced Upload] Thumbnail uploaded via ${thumbUpload.provider}: ${thumbUpload.url}`);
    } catch (error) {
      const errorMsg = `Thumbnail upload failed: ${error instanceof Error ? error.message : 'unknown error'}`;
      UploadProgressTracker.setError(uploadId, errorMsg);
      return NextResponse.json({ error: errorMsg, uploadId }, { status: 500 });
    }

    UploadProgressTracker.updateProgress(uploadId, 90, 'processing');

    // Normalize fields (tags, metadata, credits, etc.)
    const normalized = normalizeAssetInput({
      name,
      description,
      scale: scaleOverride,
      assetSource: assetSourceRaw,
      make,
      model,
      year: yearRaw,
      variant,
      tags: tagsRaw,
      metadata: metadataRaw,
      creatorCredits: (() => {
        if (creatorCreditsRaw) {
          try { return JSON.parse(String(creatorCreditsRaw)); } catch { /* fallthrough */ }
        }
        if (ccText) {
          return { text: ccText };
        }
        return undefined;
      })(),
    });

    // Validation: if Sketchfab, require at least credits text
    if (normalized.assetSource === 'sketchfab' && !(normalized.creatorCredits && normalized.creatorCredits.text)) {
      const errorMsg = 'creatorCredits.text is required when assetSource is sketchfab';
      UploadProgressTracker.setError(uploadId!, errorMsg);
      return NextResponse.json({ error: errorMsg, uploadId }, { status: 400 });
    }

    // Curator info from session
    const auth = await verifyAdmin();
    if (!auth) {
      const errorMsg = 'Unauthorized: admin session required';
      UploadProgressTracker.setError(uploadId!, errorMsg);
      return NextResponse.json({ error: errorMsg, uploadId }, { status: 401 });
    }
    const adminDoc = await Admin.findById(auth.adminId).lean<{ _id: Types.ObjectId; fullname: string; email: string } | null>();

    // Create asset record
    const asset = await Asset.create({
      name: normalized.name || name,
      description: normalized.description || undefined,
      modelUrl: modelUpload.url,
      modelPublicId: modelUpload.path,
      thumbnailUrl: thumbUpload.url,
      thumbnailPublicId: thumbUpload.path,
      format: validatedModel.extension as 'glb' | 'gltf',
      sizeBytes: modelUpload.bytes,
      scale: computedScale,
      assetSource: normalized.assetSource,
      creatorCredits: normalized.creatorCredits,
      make: normalized.make,
      model: normalized.model,
      year: normalized.year,
      variant: normalized.variant,
      tags: normalized.tags,
      metadata: normalized.metadata,
      curatedBy: {
        mode: 'self',
        adminId: adminDoc?._id,
        name: adminDoc?.fullname,
        email: adminDoc?.email,
      },
      curatedAt: new Date(),
    });

    UploadProgressTracker.complete(uploadId);
    console.log(`[Enhanced Upload] Asset created successfully: ${asset._id}`);

    // Get storage stats for monitoring
    const storageStats = await storageService.getUploadStats();
    
    return NextResponse.json({ 
      asset, 
      uploadId,
      storageStats: {
        provider: modelUpload.provider,
        activeUploads: storageStats.activeUploads,
        gcpConfigured: storageStats.gcpConfigured,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('[Enhanced Upload] Create asset error:', error);
    
    if (uploadId) {
      UploadProgressTracker.setError(uploadId, error instanceof Error ? error.message : 'Unknown error');
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload asset';
    return NextResponse.json({ 
      error: errorMessage, 
      uploadId,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  } finally {
    // Cleanup upload tracking after a delay
    if (uploadId) {
      setTimeout(() => {
        UploadProgressTracker.cleanup(uploadId!);
      }, 60000); // Clean up after 1 minute
    }
  }
}
