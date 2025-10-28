import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Asset, { type IAsset, type IAssetMetadata, type IAssetProgress, type IEditorRef, type IAssetContribution, type MetadataCategory } from '@/models/Asset';
import { verifyAdmin } from '@/lib/auth';
import { getStorageService } from '@/lib/enhanced-storage';
import { Types } from 'mongoose';

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

    // Any authenticated admin can edit; we'll track lastEditedBy and contributions

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
    
    // Handle progress updates (specifically for metadataValidated)
    let progressUpdate: Partial<IAssetProgress> | undefined;
    if (body.progress && typeof body.progress === 'object') {
      const progressBody = body.progress as Partial<IAssetProgress>;
      if (typeof progressBody.metadataValidated === 'boolean') {
        progressUpdate = { metadataValidated: progressBody.metadataValidated };
      }
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
    // Compute progress deltas based on metadata categories completed
    const adminId = auth.adminId;

    // Equal weighting across metadata categories (remaining 50%)
    const META_CATEGORIES: MetadataCategory[] = [
      'wrappableSurfaces',
      'rims',
      'windows',
      'doors',
      'tyres',
      'interior',
      'lights',
      'other',
    ];
    const PER_CATEGORY = 50 / META_CATEGORIES.length;

    // Fetch editor profile
    let editorMeta: { name?: string; email?: string } = {};
    try {
      const adminDoc = await (await import('@/models/Admin')).default.findById(adminId).lean<{ fullname?: string; email?: string } | null>();
      if (adminDoc) editorMeta = { name: adminDoc.fullname, email: adminDoc.email };
    } catch {}

    // Start with existing progress
    const progress: IAssetProgress = current.progress || { overall: 0, primaryInfo: 0, breakdown: {}, metadataCompleted: {} };
    // Ensure nested shapes are present and typed
    const breakdown: Partial<Record<MetadataCategory, number>> = (progress.breakdown as Partial<Record<MetadataCategory, number>>) || {};
    const metadataCompleted: Partial<Record<MetadataCategory, boolean>> = (progress.metadataCompleted as Partial<Record<MetadataCategory, boolean>>) || {};
    let awarded = 0;
    const now = new Date();

    // If metadata updated, mark categories completed and award weights once
    if (updates.metadata && typeof updates.metadata === 'object') {
      const newMeta = updates.metadata as IAssetMetadata;
      for (const cat of META_CATEGORIES) {
        const metaVal = newMeta[cat];
        const isNonEmpty = !!(metaVal && typeof metaVal === 'object' && Object.keys(metaVal).length > 0);
        const already = metadataCompleted[cat] === true;
        if (isNonEmpty && !already) {
          metadataCompleted[cat] = true;
          breakdown[cat] = (breakdown[cat] || 0) + PER_CATEGORY;
          awarded += PER_CATEGORY;
        }
      }
    }

    // Primary info inferred: if current had no make/model/year and now provided, consider awarding up to 50 if not already set
    if (progress.primaryInfo === undefined || progress.primaryInfo < 50) {
      const hadPrimary = Boolean(current.make || current.model || current.year);
      const nowPrimary = Boolean(updates.make || updates.model || updates.year || current.make || current.model || current.year);
      if (!hadPrimary && nowPrimary) {
        progress.primaryInfo = 50;
        awarded += Math.max(0, 50 - (progress.overall || 0));
      } else if (progress.primaryInfo === undefined) {
        progress.primaryInfo = 0;
      }
    }

    progress.breakdown = breakdown;
    progress.metadataCompleted = metadataCompleted;
    
    // Apply progress updates (like metadataValidated)
    if (progressUpdate) {
      Object.assign(progress, progressUpdate);
    }
    
    const breakdownSum = Object.values(breakdown).reduce((a, b) => a + (b || 0), 0);
    const newOverall = Math.min(100, Math.max(progress.overall || 0, (progress.primaryInfo || 0) + breakdownSum));
    progress.overall = newOverall;

    const setUpdate: Partial<IAsset> & { lastEditedBy: IEditorRef; progress: IAssetProgress } = {
      ...updates,
      lastEditedBy: {
        adminId: adminId ? new Types.ObjectId(String(adminId)) : undefined,
        name: editorMeta.name,
        email: editorMeta.email,
        at: now,
      },
      progress,
    };

    const pushUpdate: { contributions?: IAssetContribution } = {};
    if (awarded > 0) {
      pushUpdate.contributions = {
        adminId: adminId ? new Types.ObjectId(String(adminId)) : undefined,
        name: editorMeta.name,
        email: editorMeta.email,
        at: now,
        delta: awarded,
        categories: updates.metadata ? (Object.keys(updates.metadata as IAssetMetadata) as MetadataCategory[]) : [],
      };
    }

    // Use findByIdAndUpdate with $set and optional $push
    const updateDoc: { $set: typeof setUpdate; $push?: typeof pushUpdate } = { $set: setUpdate };
    if (pushUpdate.contributions) {
      updateDoc.$push = pushUpdate;
    }

    const asset = await Asset.findByIdAndUpdate(id, updateDoc as import('mongoose').UpdateQuery<IAsset>, { new: true }).lean<IAsset>();
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

    // Require authenticated admin
    const auth = await verifyAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized: admin session required' }, { status: 401 });
    }
    
    // Any authenticated admin can delete assets

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
