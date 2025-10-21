import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Asset from '@/models/Asset';
import Admin from '@/models/Admin';

type EditorAggRow = { _id: unknown; count: number };

export async function GET() {
  try {
    await connectDB();

    // Aggregate counts grouped by lastEditedBy.adminId
    const agg = await Asset.aggregate<EditorAggRow>([
      { $match: { 'lastEditedBy.adminId': { $ne: null } } },
      { $group: { _id: '$lastEditedBy.adminId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const total = await Asset.countDocuments({ 'lastEditedBy.adminId': { $ne: null } });

    // Fetch admin details for each id
    const ids = agg.map((a) => a._id).filter(Boolean);
    const admins = await Admin.find({ _id: { $in: ids } })
      .select('fullname email')
      .lean<{ _id: unknown; fullname: string; email: string }[]>();

    const byId = new Map<string, { fullname: string; email: string }>();
    for (const a of admins) {
      byId.set(String(a._id), { fullname: a.fullname, email: a.email });
    }

    const editors = agg.map((row) => {
      const id = String(row._id as string);
      const meta = byId.get(id) || { fullname: '', email: '' };
      return { id, fullname: meta.fullname, email: meta.email, count: row.count };
    });

    return NextResponse.json({ total, editors });
  } catch (e) {
    console.error('Editors list error:', e);
    return NextResponse.json({ error: 'Failed to list editors' }, { status: 500 });
  }
}
