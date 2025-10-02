import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { getStorageService } from '@/lib/enhanced-storage';

export const runtime = 'nodejs';
export const maxDuration = 300;

// PUT /api/storage/upload?path=<gcs-object-path>&ct=<content-type>
// Body: raw file bytes
export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const objectPath = url.searchParams.get('path') || '';
    const queryCT = url.searchParams.get('ct') || '';

    if (!objectPath) {
      return NextResponse.json({ error: 'Missing path query param' }, { status: 400 });
    }

    const contentType = queryCT || req.headers.get('content-type') || 'application/octet-stream';

    // Read body as a single buffer. For very large files we rely on Next.js server limits and our configured maxDuration.
    const ab = await req.arrayBuffer();
    const buf = Buffer.from(ab);

    const storage = getStorageService();

    const result = await storage.upload({
      buffer: buf,
      destination: objectPath,
      contentType,
      retryAttempts: 3,
    });

    return NextResponse.json({ ok: true, path: result.path, bytes: result.bytes, provider: result.provider }, { status: 200 });
  } catch (error) {
    console.error('[Proxy Upload] Failed to upload via server:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
