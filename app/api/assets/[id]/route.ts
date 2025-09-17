import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Asset, { type IAsset } from '@/models/Asset';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const asset = await Asset.findById(id).lean<IAsset | null>();
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    return NextResponse.json({ asset }, { status: 200 });
  } catch (error) {
    console.error('Get asset error:', error);
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json().catch(() => ({} as unknown));
    const updates: Partial<Pick<IAsset, 'name' | 'description' | 'scale'>> = {};
    if (typeof body.name === 'string') updates.name = String(body.name).trim();
    if (typeof body.description === 'string') updates.description = String(body.description).trim() || undefined;
    if (body.scale !== undefined) {
      const s = Number(body.scale);
      if (Number.isFinite(s) && s > 0) updates.scale = Math.max(0.0001, Math.min(10000, s));
    }
    const asset = await Asset.findByIdAndUpdate(id, updates, { new: true }).lean<IAsset>();
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    return NextResponse.json({ asset }, { status: 200 });
  } catch (error) {
    console.error('Update asset error:', error);
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const asset = await Asset.findById(id).lean<IAsset | null>();
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    const useGcp = String(process.env.USE_GCP).toLowerCase() === 'true';

    // Delete stored files
    try {
      // Model
      if (typeof asset.modelPublicId === 'string') {
        if (useGcp && !asset.modelPublicId.startsWith('local:')) {
          const { deleteObjectFromGCS } = await import('@/lib/gcs');
          await deleteObjectFromGCS(asset.modelPublicId);
        } else if (asset.modelPublicId.startsWith('local:')) {
          const fname = asset.modelPublicId.slice('local:'.length);
          const p = path.join(process.cwd(), 'public', 'models', fname);
          await fs.promises.unlink(p).catch(() => {});
        }
      }
      // Thumbnail
      if (typeof asset.thumbnailPublicId === 'string') {
        if (useGcp && !asset.thumbnailPublicId.startsWith('local:')) {
          const { deleteObjectFromGCS } = await import('@/lib/gcs');
          await deleteObjectFromGCS(asset.thumbnailPublicId);
        } else if (asset.thumbnailPublicId.startsWith('local:')) {
          const fname = asset.thumbnailPublicId.slice('local:'.length);
          const p = path.join(process.cwd(), 'public', 'thumbnails', fname);
          await fs.promises.unlink(p).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('File deletion warnings:', e);
    }

    await Asset.findByIdAndDelete(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete asset error:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
