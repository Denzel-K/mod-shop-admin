// Progress helpers: equal per-category share of remaining 50%
function hasPrimaryInfoLike(a: { make?: string; model?: string; year?: number }): boolean {
  return Boolean(a.make || a.model || a.year);
}
function nonEmpty(obj: unknown): boolean {
  return !!(obj && typeof obj === 'object' && Object.keys(obj as Record<string, unknown>).length > 0);
}
const META_CATEGORIES: Array<keyof IAssetMetadata> = [
  'wrappableSurfaces','rims','windows','doors','tyres','interior','lights','other'
];
const PER_CATEGORY = 50 / META_CATEGORIES.length;
function computeCreationBreakdown(md?: IAssetMetadata | null) {
  const breakdown: Partial<Record<keyof IAssetMetadata, number>> = {};
  if (!md) return { breakdown, sum: 0, completed: {} as Partial<Record<keyof IAssetMetadata, boolean>> };
  let sum = 0;
  const completed: Partial<Record<keyof IAssetMetadata, boolean>> = {};
  META_CATEGORIES.forEach((k) => {
    if (nonEmpty((md as IAssetMetadata)[k])) { breakdown[k] = PER_CATEGORY; sum += PER_CATEGORY; completed[k] = true; }
  });
  (Object.keys(breakdown) as Array<keyof IAssetMetadata>).forEach((k) => { breakdown[k] = Math.round((breakdown[k] as number) * 100) / 100; });
  sum = Math.round(sum * 100) / 100;
  return { breakdown, sum, completed };
}
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Asset, { type IAsset, type IAssetMetadata } from '@/models/Asset';
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
    const curatedBy = sp.get('curatedBy')?.trim();
    const lastEditedBy = sp.get('lastEditedBy')?.trim();
    const limitStr = sp.get('limit')?.trim();

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
    if (curatedBy) query['curatedBy.adminId'] = curatedBy;
    if (lastEditedBy) query['lastEditedBy.adminId'] = lastEditedBy;

    // Parse limit parameter
    let limit = 50; // default limit
    if (limitStr) {
      const parsedLimit = parseInt(limitStr, 10);
      if (Number.isInteger(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
        limit = parsedLimit;
      }
    }

    const assets = await Asset.find(query).sort({ createdAt: -1 }).limit(limit).lean();
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
    const contentType = req.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    
    // Support two modes:
    // 1) Legacy multipart form-data upload (server receives files) -> subject to platform limits
    // 2) JSON finalize flow (direct-to-storage) with modelPath/thumbnailPath
    let fields: Map<string, string> = new Map();
    let files: Map<string, File> = new Map();
    let jsonBody: Record<string, unknown> | null = null;
    if (isJson) {
      jsonBody = await req.json();
      // Normalize JSON fields into Map for reuse of normalization logic
      const keys = [
        'name','description','scale','assetSource','make','model','year','variant','tags','metadata','creatorCredits','creatorCredits.text','creditsText','uploadId','modelPath','thumbnailPath'
      ];
      for (const k of keys) {
        if (jsonBody && typeof jsonBody === 'object' && k in jsonBody) {
          const v = (jsonBody as Record<string, unknown>)[k];
          if (v !== undefined && v !== null) {
            fields.set(k, typeof v === 'string' ? v : JSON.stringify(v));
          }
        }
      }
    } else {
      // Parse multipart form data
      const parsed = await FormDataParser.parseMultipartForm(req);
      fields = parsed.fields;
      files = parsed.files;
    }
    
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

    // Either we have direct paths from JSON, or files via multipart
    const directModelPath = fields.get('modelPath');
    const directThumbPath = fields.get('thumbnailPath');
    const hasDirectPaths = !!(directModelPath && directThumbPath);
    let modelFile: File | null = null;
    let thumbFile: File | null = null;
    if (!hasDirectPaths) {
      // Extract and validate required files (multipart mode)
      modelFile = FormDataParser.getRequiredFile(files, 'model');
      thumbFile = FormDataParser.getRequiredFile(files, 'thumbnail');
    }

    // Create or attach to upload tracking
    const clientUploadId = fields.get('uploadId');
    if (clientUploadId && typeof clientUploadId === 'string' && clientUploadId.startsWith('upload_')) {
      uploadId = clientUploadId;
      // Initialize progress entry if not present using the provided ID
      if (!UploadProgressTracker.getProgress(uploadId)) {
        UploadProgressTracker.registerUpload(uploadId, hasDirectPaths ? (directModelPath || 'model') : (modelFile as File).name);
      }
    } else {
      uploadId = UploadProgressTracker.createUpload(hasDirectPaths ? (directModelPath || 'model') : (modelFile as File).name);
    }
    UploadProgressTracker.updateProgress(uploadId, 5, 'uploading');

    // Branch: Direct paths vs Multipart upload
    let validatedModel: { extension: string; buffer?: Buffer } | undefined;
    let validatedThumb: { extension: string; buffer?: Buffer } | undefined;
    let modelUpload: { url: string; path: string; bytes?: number; provider?: string } | undefined;
    let thumbUpload: { url: string; path: string; bytes?: number; provider?: string } | undefined;

    if (hasDirectPaths) {
      // Direct-to-storage: paths already uploaded by client via signed URLs
      const modelPath = directModelPath as string;
      const thumbPath = directThumbPath as string;
      const modelExt = modelPath.split('.').pop()!.toLowerCase();
      const thumbExt = thumbPath.split('.').pop()!.toLowerCase();
      validatedModel = { extension: modelExt };
      validatedThumb = { extension: thumbExt };
      // Compute public read URLs
      const [modelUrl, thumbUrl] = await Promise.all([
        storageService.getPublicReadUrl(modelPath),
        storageService.getPublicReadUrl(thumbPath),
      ]);
      modelUpload = { url: modelUrl, path: modelPath, provider: 'gcp' };
      thumbUpload = { url: thumbUrl, path: thumbPath, provider: 'gcp' };
      UploadProgressTracker.updateProgress(uploadId, 50, 'processing');
    } else {
      // Validate files in multipart mode
      try {
        validatedModel = await FileValidator.validateModelFile(modelFile as File);
        validatedThumb = await FileValidator.validateImageFile(thumbFile as File);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'File validation failed';
        UploadProgressTracker.setError(uploadId!, errorMsg);
        return NextResponse.json({ error: errorMsg, uploadId }, { status: 400 });
      }
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

    if (!hasDirectPaths) {
      // Upload model with enhanced storage service
      UploadProgressTracker.updateProgress(uploadId!, 25, 'uploading');
      try {
        modelUpload = await storageService.upload({
          buffer: (validatedModel as { extension: string; buffer?: Buffer }).buffer!,
          destination: `mod-shop/models/${modelFilename}`,
          contentType: getContentTypeForExtension(validatedModel!.extension),
          retryAttempts: 3,
        });
        console.log(`[Enhanced Upload] Model uploaded via ${modelUpload.provider}: ${modelUpload.url}`);
      } catch (error) {
        const errorMsg = `Model upload failed: ${error instanceof Error ? error.message : 'unknown error'}`;
        UploadProgressTracker.setError(uploadId!, errorMsg);
        return NextResponse.json({ error: errorMsg, uploadId }, { status: 500 });
      }

      UploadProgressTracker.updateProgress(uploadId!, 50, 'processing');
    }

    // Attempt auto-scaling using glTF-Transform by reading the uploaded buffer directly
    if (!hasDirectPaths && validatedModel!.extension === 'glb') {
      try {
        const io = new NodeIO();
        // Read document from the original uploaded buffer
        const doc = await io.readBinary((validatedModel as { extension: string; buffer?: Buffer }).buffer!);
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

    if (!hasDirectPaths) {
      UploadProgressTracker.updateProgress(uploadId!, 70, 'uploading');
      // Upload thumbnail with enhanced storage service
      try {
        thumbUpload = await storageService.upload({
          buffer: (validatedThumb as { extension: string; buffer?: Buffer }).buffer!,
          destination: `mod-shop/thumbnails/${thumbFilename}`,
          contentType: getContentTypeForExtension(validatedThumb!.extension),
          retryAttempts: 3,
        });
        console.log(`[Enhanced Upload] Thumbnail uploaded via ${thumbUpload.provider}: ${thumbUpload.url}`);
      } catch (error) {
        const errorMsg = `Thumbnail upload failed: ${error instanceof Error ? error.message : 'unknown error'}`;
        UploadProgressTracker.setError(uploadId!, errorMsg);
        return NextResponse.json({ error: errorMsg, uploadId }, { status: 500 });
      }
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

    // Ensure uploads succeeded before creating the asset
    if (!modelUpload || !thumbUpload) {
      const errorMsg = 'Upload failed: model or thumbnail is missing';
      UploadProgressTracker.setError(uploadId!, errorMsg);
      return NextResponse.json({ error: errorMsg, uploadId }, { status: 500 });
    }

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
    const now = new Date();
    // Compute initial progress based on provided primary info and metadata
    const primaryInfo = hasPrimaryInfoLike({ make: normalized.make, model: normalized.model, year: normalized.year }) ? 50 : 0;
    const { breakdown, sum, completed } = computeCreationBreakdown(normalized.metadata as IAssetMetadata | undefined);
    const overall = Math.min(100, primaryInfo + sum);
    const asset = await Asset.create({
      name: normalized.name || name,
      description: normalized.description || undefined,
      modelUrl: modelUpload.url,
      modelPublicId: modelUpload.path,
      thumbnailUrl: thumbUpload.url,
      thumbnailPublicId: thumbUpload.path,
      format: validatedModel!.extension as 'glb' | 'gltf',
      sizeBytes: modelUpload?.bytes,
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
      curatedAt: now,
      lastEditedBy: {
        adminId: adminDoc?._id,
        name: adminDoc?.fullname,
        email: adminDoc?.email,
        at: now,
      },
      progress: {
        primaryInfo,
        overall,
        breakdown: breakdown as IAsset['progress']['breakdown'],
        metadataCompleted: completed as IAsset['progress']['metadataCompleted'],
      },
      contributions: [
        {
          adminId: adminDoc?._id,
          name: adminDoc?.fullname,
          email: adminDoc?.email,
          at: now,
          delta: Math.round((primaryInfo + sum) * 100) / 100,
          categories: (Object.keys(breakdown || {}) as Array<keyof IAssetMetadata>).filter(k => (breakdown as Record<string, number>)[k as string] > 0) as unknown as string[],
        }
      ],
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
