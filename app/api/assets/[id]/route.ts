import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Asset, { type IAsset, type ICuratorInfo, type CuratorMode } from '@/models/Asset';
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
    type PatchBody = Partial<IAsset> & { curator?: CuratorMode };
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
      const cc = body.creatorCredits;
      updates.creatorCredits = {
        text: typeof cc.text === 'string' ? cc.text.trim() : undefined,
        creatorName: typeof cc.creatorName === 'string' ? cc.creatorName.trim() : undefined,
        profileUrl: typeof cc.profileUrl === 'string' ? cc.profileUrl.trim() : undefined,
        sourcePageUrl: typeof cc.sourcePageUrl === 'string' ? cc.sourcePageUrl.trim() : undefined,
        license: typeof cc.license === 'string' ? cc.license.trim() : undefined,
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

    // Optional curator update
    const allowedModes = new Set<CuratorMode>(['self', 'proxy', 'automation', 'import']);
    if (typeof body.curator === 'string' && allowedModes.has(body.curator)) {
      updates.curatedBy = { mode: body.curator };
      updates.curatedAt = new Date();
    } else if (body.curatedBy && typeof body.curatedBy === 'object') {
      const cb = body.curatedBy as ICuratorInfo;
      if (!cb.mode || allowedModes.has(cb.mode as CuratorMode)) {
        updates.curatedBy = {
          mode: cb.mode,
          name: cb.name,
          email: cb.email,
        };
        updates.curatedAt = new Date();
      }
    }

    // Validation rule: if sketchfab source is set or remains sketchfab, ensure credits.text exists
    if (updates.assetSource === 'sketchfab' || updates.creatorCredits?.text) {
      // fetch current to validate combined state
      const current = await Asset.findById(id).lean<IAsset | null>();
      if (!current) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
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
