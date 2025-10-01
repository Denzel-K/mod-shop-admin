import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { getStorageService } from '@/lib/enhanced-storage';
import { generateSafeFilename } from '@/lib/upload-utils';

export const runtime = 'nodejs';

// POST /api/uploads/sign
// Body: { name: string, uploadId: string, model: { filename: string, contentType: string }, thumbnail: { filename: string, contentType: string } }
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { name, uploadId, model, thumbnail } = body as {
      name: string;
      uploadId: string;
      model: { filename: string; contentType: string };
      thumbnail: { filename: string; contentType: string };
    };

    if (!name || !uploadId || !model?.filename || !model?.contentType || !thumbnail?.filename || !thumbnail?.contentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const storage = getStorageService();

    const ts = Date.now();
    const base = generateSafeFilename(name, ts);

    const modelExt = model.filename.split('.').pop()?.toLowerCase() || 'glb';
    const thumbExt = thumbnail.filename.split('.').pop()?.toLowerCase() || 'jpg';

    const modelPath = `mod-shop/models/${base}.${modelExt}`;
    const thumbPath = `mod-shop/thumbnails/${base}.${thumbExt}`;

    const [{ url: modelUrl }, { url: thumbnailUrl }] = await Promise.all([
      storage.getSignedUploadUrl({ destination: modelPath, contentType: model.contentType }),
      storage.getSignedUploadUrl({ destination: thumbPath, contentType: thumbnail.contentType }),
    ]);

    // Register uploadId as pending so progress endpoint doesn't 404
    // We use filename for display; either model filename or generated path
    const { UploadProgressTracker } = await import('@/lib/upload-utils');
    UploadProgressTracker.registerUpload(uploadId, model.filename);

    return NextResponse.json({
      uploadId,
      model: { url: modelUrl, path: modelPath },
      thumbnail: { url: thumbnailUrl, path: thumbPath },
    });
  } catch (error) {
    console.error('[Sign Upload] Error creating signed URLs:', error);
    return NextResponse.json({ error: 'Failed to create signed URLs' }, { status: 500 });
  }
}
