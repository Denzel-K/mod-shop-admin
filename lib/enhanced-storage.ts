import { Storage, File, Bucket } from '@google-cloud/storage';
import fs from 'fs/promises';
import { readFileSync } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

// Types
export interface UploadResult {
  url: string;
  path: string;
  bytes: number;
  provider: 'gcp' | 'local';
  checksum?: string;
}

export interface UploadOptions {
  buffer: Buffer;
  destination: string;
  contentType?: string;
  cacheControl?: string;
  makePublic?: boolean;
  retryAttempts?: number;
  chunkSize?: number;
}

export interface StorageConfig {
  gcpProjectId?: string;
  gcpClientEmail?: string;
  gcpPrivateKey?: string;
  gcsBucket?: string;
  localStoragePath?: string;
  maxConcurrentUploads?: number;
  retryAttempts?: number;
  chunkSizeBytes?: number;
  gcsCdnDomain?: string;
}

// Enhanced Storage Service Class
export class EnhancedStorageService {
  private storage?: Storage;
  private bucket?: Bucket;
  private config: StorageConfig;
  private uploadQueue: Map<string, Promise<UploadResult>> = new Map();
  private activeUploads = 0;
  private bucketUsesUniformAcl = false;
  private ublaChecked = false;

  constructor(config: StorageConfig) {
    this.config = {
      maxConcurrentUploads: 5,
      retryAttempts: 3,
      chunkSizeBytes: 8 * 1024 * 1024, // 8MB chunks
      // Default local storage under Next.js public/ so URLs are served statically
      localStoragePath: path.join(process.cwd(), 'public'),
      ...config,
    };
    // If a relative localStoragePath is provided, make it absolute
    if (this.config.localStoragePath && !path.isAbsolute(this.config.localStoragePath)) {
      this.config.localStoragePath = path.join(process.cwd(), this.config.localStoragePath);
    }
    // Initialize GCP Storage if credentials are available
    if (this.isGcpConfigured()) {
      try {
        const { clientEmail, privateKey, projectId } = this.resolveGcpCredentials();
        this.storage = new Storage({
          projectId,
          credentials: {
            client_email: clientEmail,
            private_key: privateKey,
          },
        });
        this.bucket = this.storage.bucket(this.config.gcsBucket!);
        // Fire-and-forget UBLA detection; do not await in constructor
        this.detectUniformBucketLevelAccess().catch((e) => {
          console.warn('[EnhancedStorage] UBLA detection deferred error:', e);
        });
      } catch (error) {
        console.warn('[EnhancedStorage] Failed to initialize GCP Storage:', error);
        this.storage = undefined;
        this.bucket = undefined;
      }
    }
  }

  private isGcpConfigured(): boolean {
    return !!(
      this.config.gcpProjectId &&
      this.config.gcpClientEmail &&
      this.config.gcpPrivateKey &&
      this.config.gcsBucket
    );
  }

  private async detectUniformBucketLevelAccess(): Promise<void> {
    if (!this.bucket || this.ublaChecked) return;
    try {
      const [meta] = await this.bucket.getMetadata();
      const ublaEnabled = !!meta.iamConfiguration?.uniformBucketLevelAccess?.enabled;
      this.bucketUsesUniformAcl = ublaEnabled;
      this.ublaChecked = true;
      console.log('[EnhancedStorage] Bucket metadata read', ublaEnabled ? '(UBLA enabled)' : '(ACLs allowed)');
    } catch (e) {
      this.ublaChecked = true; // avoid repeated attempts on every upload
      console.warn('[EnhancedStorage] Failed to detect UBLA from bucket metadata. Proceeding with defaults.', e);
    }
  }

  // Normalize various ways the service account key can be supplied to avoid OpenSSL decoder errors
  private resolveGcpCredentials(): { projectId: string; clientEmail: string; privateKey: string } {
    // Prefer explicit fields from config
    let projectId = this.config.gcpProjectId || '';
    let clientEmail = this.config.gcpClientEmail || '';
    let privateKeyRaw = this.config.gcpPrivateKey || '';

    // If private key looks like JSON (whole service account JSON), parse it
    try {
      const parsed = JSON.parse(privateKeyRaw);
      if (parsed && typeof parsed === 'object') {
        projectId = parsed.project_id || projectId;
        clientEmail = parsed.client_email || clientEmail;
        privateKeyRaw = parsed.private_key || privateKeyRaw;
      }
    } catch {
      // not JSON, keep as is
    }

    // Also support GOOGLE_APPLICATION_CREDENTIALS_JSON env var as a fallback
    if ((!projectId || !clientEmail || !privateKeyRaw) && typeof process !== 'undefined') {
      const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.SERVICE_ACCOUNT_JSON;
      if (json) {
        try {
          const parsed = JSON.parse(json);
          projectId = parsed.project_id || projectId;
          clientEmail = parsed.client_email || clientEmail;
          privateKeyRaw = parsed.private_key || privateKeyRaw;
        } catch {
          // ignore
        }
      }
    }

    // Support GOOGLE_APPLICATION_CREDENTIALS path to JSON file
    if ((!projectId || !clientEmail || !privateKeyRaw) && typeof process !== 'undefined') {
      const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (credPath) {
        try {
          const jsonStr = readFileSync(credPath, 'utf-8');
          const parsed = JSON.parse(jsonStr);
          projectId = parsed.project_id || projectId;
          clientEmail = parsed.client_email || clientEmail;
          privateKeyRaw = parsed.private_key || privateKeyRaw;
        } catch (e) {
          console.warn('[EnhancedStorage] Failed to read GOOGLE_APPLICATION_CREDENTIALS file:', e);
        }
      }
    }

    const privateKey = this.normalizePrivateKey(privateKeyRaw);
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Incomplete GCP credentials after normalization');
    }
    return { projectId, clientEmail, privateKey };
  }

  private async buildReadUrlForPath(destination: string): Promise<string> {
    if (!this.bucket) {
      // Fallback local-style URL (shouldn't happen here)
      return `/${encodeURI(destination)}`;
    }
    // If UBLA (private bucket) is enabled, generate a V4 signed URL
    if (this.bucketUsesUniformAcl) {
      try {
        const file = this.bucket.file(destination);
        const expires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          version: 'v4',
          expires,
        });
        return signedUrl;
      } catch (e) {
        console.warn('[EnhancedStorage] Failed to generate signed URL, falling back to host URL:', e);
      }
    }
    const publicHost = this.config.gcsCdnDomain || `${this.config.gcsBucket}.storage.googleapis.com`;
    return `https://${publicHost}/${encodeURI(destination)}`;
  }

  private normalizePrivateKey(key: string): string {
    if (!key) return key;
    let k = key.trim();
    // Handle wrapped quotes from env files
    if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
      k = k.slice(1, -1);
    }
    // Replace literal \n and \r\n sequences with real newlines
    k = k.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
    // Ensure header/footer are correct and each on their own line
    if (k.includes('BEGIN PRIVATE KEY') && !k.includes('\n-----END')) {
      // Some providers inline everything; attempt to insert newlines safely
      k = k
        .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
        .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
    }
    // If key is RSA PRIVATE KEY (PKCS#1), OpenSSL 3 may fail to decode without legacy provider.
    // Recommend converting to PKCS#8, but attempt to work with it by just normalizing newlines.
    return k;
  }

  private generateChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private async waitForUploadSlot(): Promise<void> {
    while (this.activeUploads >= this.config.maxConcurrentUploads!) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async uploadToGcp(options: UploadOptions): Promise<UploadResult> {
    if (!this.storage || !this.bucket) {
      throw new Error('GCP Storage not configured or initialized');
    }
    // Ensure UBLA detection has occurred
    await this.detectUniformBucketLevelAccess();

    const { buffer, destination, contentType, cacheControl = 'public, max-age=31536000, immutable', makePublic = true } = options;
    const file: File = this.bucket.file(destination);
    const checksum = this.generateChecksum(buffer);

    // Use resumable uploads for large files
    const useResumable = buffer.byteLength > (this.config.chunkSizeBytes! / 2);
    
    console.log(`[EnhancedStorage] Uploading to GCP: ${destination} (${buffer.byteLength} bytes, resumable: ${useResumable})`);

    try {
      if (useResumable) {
        // Resumable upload for large files
        const stream = file.createWriteStream({
          resumable: true,
          chunkSize: this.config.chunkSizeBytes,
          metadata: {
            contentType,
            cacheControl,
            metadata: {
              checksum,
              uploadedAt: new Date().toISOString(),
            },
          },
          validation: 'crc32c',
        });

        await new Promise<void>((resolve, reject) => {
          stream.on('error', reject);
          stream.on('finish', resolve);
          stream.end(buffer);
        });
      } else {
        // Single-shot upload for smaller files
        await file.save(buffer, {
          contentType,
          resumable: false,
          metadata: {
            cacheControl,
            metadata: {
              checksum,
              uploadedAt: new Date().toISOString(),
            },
          },
          validation: 'crc32c',
        });
      }

      // Make file public if requested and UBLA is NOT enabled. With UBLA, per-object ACLs are not allowed.
      if (makePublic) {
        if (this.bucketUsesUniformAcl) {
          console.log('[EnhancedStorage] Skipping makePublic because UBLA is enabled on the bucket. Use bucket-level IAM or CDN.');
        } else {
          try {
            await file.makePublic();
          } catch (error) {
            console.warn(`[EnhancedStorage] Failed to make file public: ${destination}`, error);
          }
        }
      }

      // Get file metadata and compute a usable read URL (signed if private bucket)
      const [metadata] = await file.getMetadata();
      const publicUrl = await this.buildReadUrlForPath(destination);

      return {
        url: publicUrl,
        path: destination,
        bytes: Number(metadata.size || buffer.byteLength),
        provider: 'gcp',
        checksum,
      };
    } catch (error) {
      console.error(`[EnhancedStorage] GCP upload failed for ${destination}:`, error);
      throw error;
    }
  }

  private async uploadToLocal(options: UploadOptions): Promise<UploadResult> {
    const { buffer, destination, contentType } = options;
    const checksum = this.generateChecksum(buffer);
    
    // Create local path structure
    const fullPath = path.join(this.config.localStoragePath!, destination);
    const dir = path.dirname(fullPath);
    
    console.log(`[EnhancedStorage] Uploading to local: ${fullPath} (${buffer.byteLength} bytes)`);

    try {
      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });
      
      // Write file
      await fs.writeFile(fullPath, buffer);
      
      // Create metadata file for tracking
      const metadataPath = `${fullPath}.meta`;
      const metadata = {
        contentType,
        checksum,
        uploadedAt: new Date().toISOString(),
        size: buffer.byteLength,
      };
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      // Generate public URL (relative to public directory)
      const relativePath = path.relative(this.config.localStoragePath!, fullPath);
      const publicUrl = `/${relativePath.replace(/\\/g, '/')}`;

      return {
        url: publicUrl,
        path: `local:${destination}`,
        bytes: buffer.byteLength,
        provider: 'local',
        checksum,
      };
    } catch (error) {
      console.error(`[EnhancedStorage] Local upload failed for ${destination}:`, error);
      throw error;
    }
  }

  public async upload(options: UploadOptions): Promise<UploadResult> {
    const { destination, retryAttempts = this.config.retryAttempts! } = options;
    
    // Check if upload is already in progress
    const existingUpload = this.uploadQueue.get(destination);
    if (existingUpload) {
      console.log(`[EnhancedStorage] Upload already in progress for ${destination}, waiting...`);
      return existingUpload;
    }

    // Create upload promise
    const uploadPromise = this.performUpload(options, retryAttempts);
    this.uploadQueue.set(destination, uploadPromise);

    try {
      const result = await uploadPromise;
      return result;
    } finally {
      this.uploadQueue.delete(destination);
    }
  }

  private async performUpload(options: UploadOptions, retryAttempts: number): Promise<UploadResult> {
    await this.waitForUploadSlot();
    this.activeUploads++;

    try {
      // Try GCP first if configured
      if (this.storage && this.bucket) {
        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
          try {
            return await this.uploadToGcp(options);
          } catch (error) {
            console.warn(`[EnhancedStorage] GCP upload attempt ${attempt}/${retryAttempts} failed:`, error);
            
            if (attempt === retryAttempts) {
              console.log('[EnhancedStorage] All GCP attempts failed, falling back to local storage');
              break;
            }
            
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }

      // Fallback to local storage
      for (let attempt = 1; attempt <= retryAttempts; attempt++) {
        try {
          return await this.uploadToLocal(options);
        } catch (error) {
          console.error(`[EnhancedStorage] Local upload attempt ${attempt}/${retryAttempts} failed:`, error);
          
          if (attempt === retryAttempts) {
            throw new Error(`Upload failed after ${retryAttempts} attempts on both GCP and local storage`);
          }
          
          // Short delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      throw new Error('Upload failed: No storage provider available');
    } finally {
      this.activeUploads--;
    }
  }

  public async delete(filePath: string): Promise<boolean> {
    let success = false;

    // Try to delete from GCP if it's a GCP path
    if (this.storage && this.bucket && !filePath.startsWith('local:')) {
      try {
        const file = this.bucket.file(filePath);
        await file.delete({ ignoreNotFound: true });
        console.log(`[EnhancedStorage] Deleted from GCP: ${filePath}`);
        success = true;
      } catch (error) {
        console.warn(`[EnhancedStorage] Failed to delete from GCP: ${filePath}`, error);
      }
    }

    // Try to delete from local storage if it's a local path
    if (filePath.startsWith('local:')) {
      try {
        const localPath = filePath.slice('local:'.length);
        const fullPath = path.join(this.config.localStoragePath!, localPath);
        await fs.unlink(fullPath);
        
        // Also delete metadata file if it exists
        try {
          await fs.unlink(`${fullPath}.meta`);
        } catch {
          // Ignore if metadata file doesn't exist
        }
        
        console.log(`[EnhancedStorage] Deleted from local: ${fullPath}`);
        success = true;
      } catch (error) {
        console.warn(`[EnhancedStorage] Failed to delete from local: ${filePath}`, error);
      }
    }

    return success;
  }

  public async getUploadStats(): Promise<{
    activeUploads: number;
    queuedUploads: number;
    gcpConfigured: boolean;
  }> {
    return {
      activeUploads: this.activeUploads,
      queuedUploads: this.uploadQueue.size,
      gcpConfigured: !!(this.storage && this.bucket),
    };
  }

  public async healthCheck(): Promise<{
    gcp: boolean;
    local: boolean;
    overall: boolean;
  }> {
    let gcpHealthy = false;
    let localHealthy = false;

    // Test GCP connectivity
    if (this.storage && this.bucket) {
      try {
        await this.bucket.getMetadata();
        gcpHealthy = true;
      } catch (error) {
        console.warn('[EnhancedStorage] GCP health check failed:', error);
      }
    }

    // Test local storage
    try {
      await fs.access(this.config.localStoragePath!);
      localHealthy = true;
    } catch (error) {
      console.warn('[EnhancedStorage] Local storage health check failed:', error);
    }

    return {
      gcp: gcpHealthy,
      local: localHealthy,
      overall: gcpHealthy || localHealthy,
    };
  }
}

// Create singleton instance
let storageService: EnhancedStorageService | null = null;

export function getStorageService(): EnhancedStorageService {
  if (!storageService) {
    storageService = new EnhancedStorageService({
      gcpProjectId: process.env.GCP_PROJECT_ID,
      gcpClientEmail: process.env.GCP_CLIENT_EMAIL,
      gcpPrivateKey: process.env.GCP_PRIVATE_KEY,
      gcsBucket: process.env.GCS_BUCKET,
      gcsCdnDomain: process.env.GCS_CDN_DOMAIN,
      localStoragePath: process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'public'),
    });
  }
  return storageService;
}

export default EnhancedStorageService;
