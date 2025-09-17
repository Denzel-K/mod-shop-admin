import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Asset from '@/models/Asset';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const asset = await Asset.findById(id).lean();
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    return NextResponse.json({ asset }, { status: 200 });
  } catch (error) {
    console.error('Get asset error:', error);
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}
