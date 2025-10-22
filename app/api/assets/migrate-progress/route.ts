import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Asset, { type IAsset, type IAssetMetadata, type IAssetContribution, type MetadataCategory } from '@/models/Asset';
import Admin from '@/models/Admin';
import { verifyAdmin } from '@/lib/auth';
import { Types, type FilterQuery } from 'mongoose';

export const runtime = 'nodejs';

function hasPrimaryInfo(a: IAsset): boolean {
  return Boolean(a.make || a.model || a.year);
}

function nonEmpty(obj: unknown): boolean {
  return !!(obj && typeof obj === 'object' && Object.keys(obj as Record<string, unknown>).length > 0);
}

const META_CATEGORIES: Array<keyof IAssetMetadata> = [
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

function computeBreakdown(md?: IAssetMetadata | null) {
  const breakdown: Partial<Record<keyof IAssetMetadata, number>> = {};
  if (!md) return { breakdown, sum: 0 };
  let sum = 0;
  (META_CATEGORIES).forEach((k) => {
    if (nonEmpty((md as IAssetMetadata)[k])) {
      breakdown[k] = (breakdown[k] || 0) + PER_CATEGORY;
      sum += PER_CATEGORY;
    }
  });
  // round to 2 decimals to reduce float noise
  (Object.keys(breakdown) as Array<keyof IAssetMetadata>).forEach((k) => { if (breakdown[k] !== undefined) breakdown[k] = Math.round((breakdown[k] as number) * 100) / 100; });
  sum = Math.round(sum * 100) / 100;
  return { breakdown, sum };
}

export async function POST(req: NextRequest) {
  try {
    // Require authenticated admin (any role)
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const limit = Math.max(1, Math.min(1000, Number(body?.limit) || 500));
    const dryRun = Boolean(body?.dryRun ?? true);
    const onlyMissing = Boolean(body?.onlyMissing ?? true);

    // Fetch candidates
    const query: FilterQuery<IAsset> = onlyMissing
      ? ({
          $or: [
            { progress: { $exists: false } } as FilterQuery<IAsset>,
            { lastEditedBy: { $exists: false } } as FilterQuery<IAsset>,
          ],
        } as FilterQuery<IAsset>)
      : ({} as FilterQuery<IAsset>);

    const assets = await Asset.find(query)
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean<Array<IAsset & { _id: Types.ObjectId }>>();

    let updated = 0;
    const examined = assets.length;
    const updatesPreview: Array<{ id: string; name: string; primaryInfo: number; breakdownSum: number; overall: number } > = [];

    for (const a of assets) {
      const primaryInfo = hasPrimaryInfo(a) ? 50 : 0;
      const { breakdown, sum } = computeBreakdown(a.metadata as IAssetMetadata);
      const overall = Math.min(100, primaryInfo + sum);

      // Prepare lastEditedBy from curatedBy if absent
      let lastEditedBy = a.lastEditedBy;
      if (!lastEditedBy && a.curatedBy?.adminId) {
        // try to hydrate name/email
        let name: string | undefined = a.curatedBy.name;
        let email: string | undefined = a.curatedBy.email;
        if (!name || !email) {
          const adminDoc = await Admin.findById(a.curatedBy.adminId).lean<{ fullname?: string; email?: string } | null>();
          if (adminDoc) { name = name || adminDoc.fullname; email = email || adminDoc.email; }
        }
        lastEditedBy = {
          adminId: new Types.ObjectId(String(a.curatedBy.adminId)),
          name,
          email,
          at: a.updatedAt || a.createdAt || new Date(),
        };
      }

      const metadataCompleted: Partial<Record<keyof IAssetMetadata, boolean>> = {};
      (Object.keys(breakdown) as Array<keyof IAssetMetadata>).forEach((k) => { if ((breakdown[k] || 0) > 0) metadataCompleted[k] = true; });

      updatesPreview.push({ id: String(a._id), name: a.name, primaryInfo, breakdownSum: sum, overall });

      if (!dryRun) {
        const contributions: IAssetContribution[] | undefined = (() => {
          const list: IAssetContribution[] = [];
          if (primaryInfo === 50 && a.curatedBy?.adminId) {
            list.push({
              adminId: new Types.ObjectId(String(a.curatedBy.adminId)),
              name: a.curatedBy.name,
              email: a.curatedBy.email,
              at: a.curatedAt || a.createdAt || new Date(),
              delta: 50,
              categories: [],
            });
          }
          if (sum > 0 && a.curatedBy?.adminId) {
            list.push({
              adminId: new Types.ObjectId(String(a.curatedBy.adminId)),
              name: a.curatedBy.name,
              email: a.curatedBy.email,
              at: a.updatedAt || new Date(),
              delta: sum,
              categories: (Object.keys(breakdown) as Array<keyof IAssetMetadata>).filter((k) => (breakdown[k] || 0) > 0) as MetadataCategory[],
            });
          }
          return list.length ? list : undefined;
        })();

        await Asset.updateOne({ _id: a._id as unknown as Types.ObjectId }, {
          $set: {
            progress: {
              overall,
              primaryInfo,
              breakdown,
              metadataCompleted,
            },
            ...(lastEditedBy ? { lastEditedBy } : {}),
          },
          ...(contributions ? { $push: { contributions: { $each: contributions } } } : {}),
        });
        updated += 1;
      }
    }

    return NextResponse.json({ examined, wouldUpdate: dryRun ? examined : undefined, updated: dryRun ? undefined : updated, preview: updatesPreview.slice(0, 20) });
  } catch (e) {
    console.error('Migrate assets failed', e);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
