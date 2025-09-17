import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Asset from '@/models/Asset';
import { NodeIO } from '@gltf-transform/core';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

type GCSUploadResult = {
  url: string;
  path: string;
  bytes: number;
};

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
  try {
    await connectDB();

    const form = await req.formData();
    const name = String(form.get('name') || '').trim();
    const description = String(form.get('description') || '').trim();
    const modelFile = form.get('model');
    const thumbFile = form.get('thumbnail');

    if (!name || !modelFile || !thumbFile || !(modelFile instanceof File) || !(thumbFile instanceof File)) {
      return NextResponse.json({ error: 'name, model (.glb/.gltf) and thumbnail image are required' }, { status: 400 });
    }

    const modelExt = modelFile.name.toLowerCase().endsWith('.gltf') ? 'gltf' : modelFile.name.toLowerCase().endsWith('.glb') ? 'glb' : '';
    if (!modelExt) {
      return NextResponse.json({ error: 'Model must be a .glb or .gltf file' }, { status: 400 });
    }

    // Auto-scale computation (defaults to 1.0 if computation not possible)
    let computedScale = 1.0;

    // Decide storage provider
    const useGcp = String(process.env.USE_GCP).toLowerCase() === 'true';
    console.log('[upload] USE_GCP =', useGcp);

    // Upload model to selected storage
    const modelArrayBuffer = await modelFile.arrayBuffer();
    const modelBuffer = Buffer.from(modelArrayBuffer);
    const modelTimestamp = Date.now();
    const modelSafeBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'model';
    const modelFilename = `${modelSafeBase}-${modelTimestamp}.${modelExt}`;
    let modelUpload: GCSUploadResult;
    if (useGcp) {
      const { uploadBufferToGCS } = await import('@/lib/gcs');
      const modelDest = `mod-shop/models/${modelFilename}`;
      console.log('[upload] model -> GCS', modelDest);
      const modelUploadInfo = await uploadBufferToGCS({
        buffer: modelBuffer,
        destination: modelDest,
        contentType: modelExt === 'glb' ? 'model/gltf-binary' : 'model/gltf+json',
      });
      modelUpload = { url: modelUploadInfo.publicUrl, path: modelUploadInfo.gcsPath, bytes: modelUploadInfo.size };
    } else {
      const modelsDir = path.join(process.cwd(), 'public', 'models');
      await fs.promises.mkdir(modelsDir, { recursive: true });
      const modelDiskPath = path.join(modelsDir, modelFilename);
      await fs.promises.writeFile(modelDiskPath, modelBuffer);
      console.log('[upload] model -> local', modelDiskPath);
      modelUpload = { url: `/models/${modelFilename}`, path: `local:${modelFilename}`, bytes: modelBuffer.byteLength };
    }

    // Attempt auto-scaling using glTF-Transform by reading the uploaded buffer directly
    if (modelExt === 'glb') {
      try {
        const io = new NodeIO();
        // Read document from the original uploaded buffer
        const doc = await io.readBinary(modelBuffer);
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
      } catch {
        // Fallback to default if parsing fails
        computedScale = 1.0;
      }
    }

    // Optional scale override from form
    const scaleOverrideRaw = String(form.get('scale') || '').trim();
    if (scaleOverrideRaw) {
      const so = Number(scaleOverrideRaw);
      if (Number.isFinite(so) && so > 0) {
        computedScale = Math.max(0.0001, Math.min(10000, so));
      }
    }

    // Upload thumbnail to selected storage as image
    const thumbArrayBuffer = await thumbFile.arrayBuffer();
    const thumbBuffer = Buffer.from(thumbArrayBuffer);
    const thumbTimestamp = Date.now();
    const thumbSafeBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'thumbnail';
    const thumbExtFromName = (thumbFile.name?.split('.').pop() || '').toLowerCase();
    const thumbExt = thumbExtFromName || (thumbFile.type.split('/')[1] || 'jpg');
    const thumbFilename = `${thumbSafeBase}-${thumbTimestamp}.${thumbExt}`;
    let thumbUpload: GCSUploadResult;
    if (useGcp) {
      const { uploadBufferToGCS } = await import('@/lib/gcs');
      const thumbDest = `mod-shop/thumbnails/${thumbFilename}`;
      console.log('[upload] thumb -> GCS', thumbDest);
      const thumbUploadInfo = await uploadBufferToGCS({
        buffer: thumbBuffer,
        destination: thumbDest,
        contentType: thumbFile.type || `image/${thumbExt}`,
      });
      thumbUpload = { url: thumbUploadInfo.publicUrl, path: thumbUploadInfo.gcsPath, bytes: thumbUploadInfo.size };
    } else {
      const thumbsDir = path.join(process.cwd(), 'public', 'thumbnails');
      await fs.promises.mkdir(thumbsDir, { recursive: true });
      const thumbDiskPath = path.join(thumbsDir, thumbFilename);
      await fs.promises.writeFile(thumbDiskPath, thumbBuffer);
      console.log('[upload] thumb -> local', thumbDiskPath);
      thumbUpload = { url: `/thumbnails/${thumbFilename}`, path: `local:${thumbFilename}`, bytes: thumbBuffer.byteLength };
    }

    const asset = await Asset.create({
      name,
      description: description || undefined,
      modelUrl: modelUpload.url,
      modelPublicId: modelUpload.path,
      thumbnailUrl: thumbUpload.url,
      thumbnailPublicId: thumbUpload.path,
      format: modelExt,
      sizeBytes: modelUpload.bytes,
      scale: computedScale,
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error('Create asset error:', error);
    return NextResponse.json({ error: 'Failed to upload asset' }, { status: 500 });
  }
}
