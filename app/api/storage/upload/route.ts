import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { getStorageService } from '@/lib/enhanced-storage';
import { Writable } from 'stream';
import type { ReadableStream as WebReadableStream } from 'stream/web';

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

    // Stream the request body directly to GCS to avoid buffering large files in memory.
    if (!req.body) {
      return NextResponse.json({ error: 'Missing request body' }, { status: 400 });
    }

    const storage = getStorageService();
    const serviceAny = storage as unknown as { bucket?: import('@google-cloud/storage').Bucket };
    const bucket = serviceAny.bucket;
    if (!bucket) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    const file = bucket.file(objectPath);
    const writeStream = file.createWriteStream({
      resumable: true,
      // Use a reasonable chunk size; GCS will manage session state.
      // Defaults are acceptable but we explicitly set metadata.
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
      validation: 'crc32c',
    });

    // Pipe the web ReadableStream body to a web WritableStream converted from the Node writable
    const webWritable = Writable.toWeb(writeStream);
    await (req.body as unknown as WebReadableStream).pipeTo(webWritable);

    const [metadata] = await file.getMetadata();
    const bytes = Number(metadata.size || 0);

    return NextResponse.json({ ok: true, path: objectPath, bytes, provider: 'gcp' }, { status: 200 });
  } catch (error) {
    console.error('[Proxy Upload] Failed to upload via server:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

