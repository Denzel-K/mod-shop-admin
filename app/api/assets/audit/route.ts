import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Asset, { type IAsset, type IAssetMetadata } from '@/models/Asset';
import { verifyAdmin } from '@/lib/auth';
import { Types } from 'mongoose';

export const runtime = 'nodejs';

function hasPrimaryInfo(a: IAsset): boolean {
  return Boolean(a.make || a.model || a.year);
}

function nonEmpty(obj: unknown): boolean {
  return !!(obj && typeof obj === 'object' && Object.keys(obj as Record<string, unknown>).length > 0);
}

function computeSuggestedProgress(asset: IAsset) {
  const META_CATEGORIES: Array<keyof IAssetMetadata> = [
    'wrappableSurfaces', 'rims', 'windows', 'doors', 'tyres', 'interior', 'lights', 'other'
  ];
  const PER_CATEGORY = 50 / META_CATEGORIES.length;
  const primary = hasPrimaryInfo(asset) ? 50 : 0;
  let sum = 0;
  const md = asset.metadata || {} as IAssetMetadata;
  (META_CATEGORIES).forEach((k) => {
    if (nonEmpty((md as IAssetMetadata)[k])) sum += PER_CATEGORY;
  });
  sum = Math.round(sum * 100) / 100;
  const overall = Math.min(100, primary + sum);
  return { primary, overall, sumBreakdown: sum };
}

export async function GET(req: NextRequest) {
  try {
    // Require authenticated admin (any role)
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const url = new URL(req.url);
    const limitStr = url.searchParams.get('limit');
    const limit = limitStr ? Math.max(1, Math.min(500, parseInt(limitStr, 10) || 50)) : 200;

    const assets = await Asset.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<Array<IAsset & { _id: Types.ObjectId }>>();

    let missingProgress = 0;
    let missingLastEditedBy = 0;
    let withPrimary = 0;
    let withAnyMetadata = 0;

    const rows = assets.map((a) => {
      const suggested = computeSuggestedProgress(a);
      const anyMd = !!a.metadata && Object.values(a.metadata as IAssetMetadata).some(nonEmpty);
      if (!a.progress) missingProgress++;
      if (!a.lastEditedBy) missingLastEditedBy++;
      if (hasPrimaryInfo(a)) withPrimary++;
      if (anyMd) withAnyMetadata++;
      return {
        id: String(a._id),
        name: a.name,
        hasProgress: !!a.progress,
        hasLastEditedBy: !!a.lastEditedBy,
        hasPrimaryInfo: hasPrimaryInfo(a),
        anyMetadata: anyMd,
        suggestedOverall: suggested.overall,
      };
    });

    return NextResponse.json({
      total: assets.length,
      missingProgress,
      missingLastEditedBy,
      withPrimary,
      withAnyMetadata,
      sample: rows,
    });
  } catch (e) {
    console.error('Audit assets failed', e);
    return NextResponse.json({ error: 'Audit failed' }, { status: 500 });
  }
}
