import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import Admin from '@/models/Admin';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = params.id;
    const deleted = await Admin.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Revoke admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
