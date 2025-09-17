import { Storage } from '@google-cloud/storage';

const projectId = process.env.GCP_PROJECT_ID;
const clientEmail = process.env.GCP_CLIENT_EMAIL;
// Private key often contains literal \n in env files; replace with real newlines
const privateKey = (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const bucketName = process.env.GCS_BUCKET;

if (!projectId || !clientEmail || !privateKey || !bucketName) {
  // Throwing at import-time is acceptable for server-only modules used in API routes
  throw new Error('Missing GCS configuration. Ensure GCP_PROJECT_ID, GCP_CLIENT_EMAIL, GCP_PRIVATE_KEY, and GCS_BUCKET are set.');
}

export async function deleteObjectFromGCS(objectPath: string): Promise<boolean> {
  try {
    const file = bucket.file(objectPath);
    await file.delete({ ignoreNotFound: true });
    return true;
  } catch {
    return false;
  }
}

export const storage = new Storage({
  projectId,
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
  },
});

export const bucket = storage.bucket(bucketName);

export type UploadedFileInfo = {
  publicUrl: string;
  gcsPath: string;
  size: number;
};

export async function uploadBufferToGCS(params: {
  buffer: Buffer;
  destination: string; // e.g. 'models/filename.glb'
  contentType?: string;
  cacheControl?: string;
  makePublic?: boolean;
}): Promise<UploadedFileInfo> {
  const { buffer, destination, contentType, cacheControl = 'public, max-age=31536000, immutable', makePublic = true } = params;
  const file = bucket.file(destination);

  await file.save(buffer, {
    contentType,
    resumable: false, // single-shot upload since buffer in memory
    public: false, // we'll toggle explicitly
    metadata: { cacheControl },
    validation: 'crc32c',
  });

  if (makePublic) {
    try {
      await file.makePublic();
    } catch {
      // If makePublic fails due to bucket policy, we still return a URL that may require auth
    }
  }

  // Prefer virtual-hosted style URLs
  const publicUrl = `https://${bucketName}.storage.googleapis.com/${encodeURI(destination)}`;
  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size || buffer.byteLength);

  return { publicUrl, gcsPath: destination, size };
}
