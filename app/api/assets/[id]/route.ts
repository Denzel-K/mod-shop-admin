import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Asset, { type IAsset } from '@/models/Asset';
import { verifyAdmin } from '@/lib/auth';
import { getStorageService } from '@/lib/enhanced-storage';

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
    // Require authenticated admin
    const auth = await verifyAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized: admin session required' }, { status: 401 });
    }

    // Fetch current asset for authorization and validation
    const current = await Asset.findById(id).lean<IAsset | null>();
    if (!current) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    // Enforce curator-only editing
    const curatorId = current.curatedBy?.adminId ? String(current.curatedBy.adminId) : null;
    if (!curatorId || curatorId !== String(auth.adminId)) {
      return NextResponse.json({ error: 'Forbidden: only the asset curator can edit this asset' }, { status: 403 });
    }

    type PatchBody = Partial<IAsset>;
    const body = (await req.json().catch(() => ({}))) as PatchBody;
    const updates: Partial<IAsset> = {};
    if (typeof body.name === 'string') updates.name = String(body.name).trim();
    if (typeof body.description === 'string') updates.description = String(body.description).trim() || undefined;
    if (body.scale !== undefined) {
      const s = Number(body.scale);
      if (Number.isFinite(s) && s > 0) updates.scale = Math.max(0.0001, Math.min(10000, s));
    }
    // New editable fields
    if (typeof body.assetSource === 'string' && ['sketchfab','turbosquid','internal','other'].includes(body.assetSource)) {
      updates.assetSource = body.assetSource;
    }
    if (body.creatorCredits && typeof body.creatorCredits === 'object') {
      const cc = body.creatorCredits as { text?: string };
      updates.creatorCredits = {
        text: typeof cc.text === 'string' ? cc.text.trim() : undefined,
      };
    }
    if (typeof body.make === 'string') updates.make = body.make.trim() || undefined;
    if (typeof body.model === 'string') updates.model = body.model.trim() || undefined;
    if (body.year !== undefined) {
      const y = Number(body.year);
      updates.year = Number.isFinite(y) ? y : undefined;
    }
    if (typeof body.variant === 'string') updates.variant = body.variant.trim() || undefined;
    if (Array.isArray(body.tags)) {
      updates.tags = Array.from(new Set(body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)));
    } else if (typeof body.tags === 'string') {
      updates.tags = Array.from(new Set(String(body.tags).split(',').map((t: string) => t.trim()).filter(Boolean)));
    }
    if (body.metadata && typeof body.metadata === 'object') {
      updates.metadata = body.metadata; // trust client; server schema enforces shape loosely
    }

    // Do NOT change curator on edit; keep original curator metadata intact

    // Validation rule: if sketchfab source is set or remains sketchfab, ensure credits.text exists
    if (updates.assetSource === 'sketchfab' || updates.creatorCredits?.text) {
      const finalSource = (updates.assetSource ?? current.assetSource);
      const finalCredits = updates.creatorCredits ?? (current.creatorCredits);
      if (finalSource === 'sketchfab' && !(finalCredits && typeof finalCredits.text === 'string' && finalCredits.text.trim())) {
        return NextResponse.json({ error: 'creatorCredits.text is required when assetSource is sketchfab' }, { status: 400 });
      }
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

    // Require authenticated admin and enforce curator-only deletion
    const auth = await verifyAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized: admin session required' }, { status: 401 });
    }
    const curatorId = asset.curatedBy?.adminId ? String(asset.curatedBy.adminId) : null;
    if (!curatorId || curatorId !== String(auth.adminId)) {
      return NextResponse.json({ error: 'Forbidden: only the asset curator can delete this asset' }, { status: 403 });
    }

    const storageService = getStorageService();
    const deletionResults: { model: boolean; thumbnail: boolean } = {
      model: false,
      thumbnail: false,
    };

    // Delete stored files using enhanced storage service
    try {
      // Delete model file
      if (typeof asset.modelPublicId === 'string') {
        deletionResults.model = await storageService.delete(asset.modelPublicId);
        console.log(`[Enhanced Delete] Model deletion ${deletionResults.model ? 'successful' : 'failed'}: ${asset.modelPublicId}`);
      }
      
      // Delete thumbnail file
      if (typeof asset.thumbnailPublicId === 'string') {
        deletionResults.thumbnail = await storageService.delete(asset.thumbnailPublicId);
        console.log(`[Enhanced Delete] Thumbnail deletion ${deletionResults.thumbnail ? 'successful' : 'failed'}: ${asset.thumbnailPublicId}`);
      }
    } catch (e) {
      console.warn('[Enhanced Delete] File deletion warnings:', e);
    }

    // Delete asset record from database
    await Asset.findByIdAndDelete(id);
    
    console.log(`[Enhanced Delete] Asset ${id} deleted successfully`);
    
    return NextResponse.json({ 
      success: true, 
      deletionResults,
      message: 'Asset deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('[Enhanced Delete] Delete asset error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete asset',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}
