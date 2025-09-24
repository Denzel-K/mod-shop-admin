import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Asset from '@/models/Asset';
import { NodeIO } from '@gltf-transform/core';
import { getStorageService } from '@/lib/enhanced-storage';
import {
  FileValidator,
  FormDataParser,
  UploadProgressTracker,
  generateSafeFilename,
  getContentTypeForExtension,
} from '@/lib/upload-utils';

export const runtime = 'nodejs';

// Increase body size limit for large file uploads
export const maxDuration = 300; // 5 minutes for large uploads

// GET /api/assets - list assets
export async function GET() {
  try {
    await connectDB();
    const assets = await Asset.find().sort({ createdAt: -1 }).lean();
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
    // Or accept dot-notated individual creator credits
    const ccText = FormDataParser.getOptionalField(fields, 'creatorCredits.text') || FormDataParser.getOptionalField(fields, 'creditsText');
    const ccName = FormDataParser.getOptionalField(fields, 'creatorCredits.creatorName') || FormDataParser.getOptionalField(fields, 'creatorName');
    const ccProfile = FormDataParser.getOptionalField(fields, 'creatorCredits.profileUrl') || FormDataParser.getOptionalField(fields, 'creatorProfileUrl');
    const ccSourcePage = FormDataParser.getOptionalField(fields, 'creatorCredits.sourcePageUrl') || FormDataParser.getOptionalField(fields, 'sourcePageUrl');
    const ccLicense = FormDataParser.getOptionalField(fields, 'creatorCredits.license') || FormDataParser.getOptionalField(fields, 'license');

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

    // Parse new fields
    const assetSource = assetSourceRaw && ['sketchfab','turbosquid','internal','other'].includes(assetSourceRaw) ? (assetSourceRaw) : undefined;
    const year = yearRaw ? Number(yearRaw) : undefined;
    const creatorCredits = (() => {
      if (creatorCreditsRaw) {
        try {
          const parsed = JSON.parse(String(creatorCreditsRaw));
          return {
            text: typeof parsed.text === 'string' ? parsed.text.trim() : undefined,
            creatorName: typeof parsed.creatorName === 'string' ? parsed.creatorName.trim() : undefined,
            profileUrl: typeof parsed.profileUrl === 'string' ? parsed.profileUrl.trim() : undefined,
            sourcePageUrl: typeof parsed.sourcePageUrl === 'string' ? parsed.sourcePageUrl.trim() : undefined,
            license: typeof parsed.license === 'string' ? parsed.license.trim() : undefined,
          };
        } catch {}
      }
      if (ccText || ccName || ccProfile || ccSourcePage || ccLicense) {
        return {
          text: ccText?.trim() || undefined,
          creatorName: ccName?.trim() || undefined,
          profileUrl: ccProfile?.trim() || undefined,
          sourcePageUrl: ccSourcePage?.trim() || undefined,
          license: ccLicense?.trim() || undefined,
        };
      }
      return undefined;
    })();
    const tags: string[] | undefined = (() => {
      if (!tagsRaw) return undefined;
      try {
        const arr = JSON.parse(String(tagsRaw));
        return Array.isArray(arr) ? Array.from(new Set(arr.map((t) => String(t).trim()).filter(Boolean))) : undefined;
      } catch {
        return Array.from(new Set(String(tagsRaw).split(',').map((t) => t.trim()).filter(Boolean)));
      }
    })();
    const metadata = (() => {
      if (!metadataRaw) return undefined;
      try {
        const obj = JSON.parse(String(metadataRaw));
        return obj && typeof obj === 'object' ? obj : undefined;
      } catch {
        return undefined;
      }
    })();

    // Validation: if Sketchfab, require at least credits text
    if (assetSource === 'sketchfab' && !(creatorCredits && creatorCredits.text)) {
      const errorMsg = 'creatorCredits.text is required when assetSource is sketchfab';
      UploadProgressTracker.setError(uploadId!, errorMsg);
      return NextResponse.json({ error: errorMsg, uploadId }, { status: 400 });
    }

    // Create asset record
    const asset = await Asset.create({
      name,
      description: description || undefined,
      modelUrl: modelUpload.url,
      modelPublicId: modelUpload.path,
      thumbnailUrl: thumbUpload.url,
      thumbnailPublicId: thumbUpload.path,
      format: validatedModel.extension as 'glb' | 'gltf',
      sizeBytes: modelUpload.bytes,
      scale: computedScale,
      assetSource,
      creatorCredits,
      make: make?.trim() || undefined,
      model: model?.trim() || undefined,
      year: Number.isFinite(year as number) ? year : undefined,
      variant: variant?.trim() || undefined,
      tags,
      metadata,
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
