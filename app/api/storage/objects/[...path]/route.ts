import { NextRequest } from 'next/server';
import { getStorageService } from '@/lib/enhanced-storage';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    if (!Array.isArray(segments) || segments.length === 0) {
      return new Response('Missing object path', { status: 400 });
    }

    // The dynamic segment captures the full object path: e.g. ['mod-shop','models','file.glb']
    const objectPath = segments.join('/');
    const storage = getStorageService();
    // Access the underlying bucket from storageService via a small hack: recreate file handle through GCS client again
    // Since EnhancedStorageService encapsulates bucket, we'll initialize a new client using the same envs implicitly
    // by calling getStorageService(), which already set them up.
    const serviceAny = storage as unknown as { bucket?: import('@google-cloud/storage').Bucket };
    const bucket = serviceAny.bucket;
    if (!bucket) {
      return new Response('Storage not configured', { status: 500 });
    }

    const file = bucket.file(objectPath);
    // Fetch metadata for headers
    let metadata: import('@google-cloud/storage').FileMetadata | undefined;
    try {
      [metadata] = await file.getMetadata();
    } catch (e) {
      // If not found
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const code = (e as any)?.code;
      if (code === 404) return new Response('Not found', { status: 404 });
      throw e;
    }

    // Create a web ReadableStream from GCS Readable stream
    const nodeStream = file.createReadStream();
    const readable = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    const headers = new Headers();
    if (metadata?.contentType) headers.set('Content-Type', metadata.contentType);
    if (metadata?.size) headers.set('Content-Length', String(metadata.size));
    headers.set('Cache-Control', metadata?.cacheControl || 'public, max-age=31536000, immutable');

    return new Response(readable, { status: 200, headers });
  } catch (error) {
    console.error('[GCS Proxy] Error streaming object:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
