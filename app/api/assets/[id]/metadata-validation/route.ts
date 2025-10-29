import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Asset from '@/models/Asset';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const asset = await Asset.findById(id).select('progress.metadataValidation').lean();
    
    if (!asset) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({
      metadataValidation: asset.progress?.metadataValidation || {},
    });
  } catch (error) {
    console.error('Error fetching metadata validation:', error);
    return NextResponse.json(
      { message: 'Failed to fetch metadata validation' },
      { status: 500 }
    );
  }
}
