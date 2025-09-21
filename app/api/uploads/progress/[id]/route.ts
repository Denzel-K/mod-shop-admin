import { NextRequest, NextResponse } from 'next/server';
import { UploadProgressTracker } from '@/lib/upload-utils';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const progress = UploadProgressTracker.getProgress(id);

    if (!progress) {
      return NextResponse.json({ error: 'Upload not found', uploadId: id }, { status: 404 });
    }

    return NextResponse.json({ uploadId: id, progress }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get upload progress' }, { status: 500 });
  }
}
