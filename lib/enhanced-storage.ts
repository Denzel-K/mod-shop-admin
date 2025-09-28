import { Storage, File, Bucket } from '@google-cloud/storage';
import fs from 'fs/promises';
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
}

// Enhanced Storage Service Class
export class EnhancedStorageService {
  private storage?: Storage;
  private bucket?: Bucket;
  private config: StorageConfig;
  private uploadQueue: Map<string, Promise<UploadResult>> = new Map();
  private activeUploads = 0;

  constructor(config: StorageConfig) {
    this.config = {
      maxConcurrentUploads: 5,
      retryAttempts: 3,
      chunkSizeBytes: 8 * 1024 * 1024, // 8MB chunks
      localStoragePath: path.join(process.cwd(), 'public'),
      ...config,
    };

    // Initialize GCP Storage if credentials are available
    if (this.isGcpConfigured()) {
      try {
        this.storage = new Storage({
          projectId: this.config.gcpProjectId,
          credentials: {
            client_email: this.config.gcpClientEmail!,
            private_key: this.config.gcpPrivateKey!.replace(/\\n/g, '\n'),
          },
        });
        this.bucket = this.storage.bucket(this.config.gcsBucket!);
        console.log('[EnhancedStorage] GCP Storage initialized successfully');
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

      // Make file public if requested
      if (makePublic) {
        try {
          await file.makePublic();
        } catch (error) {
          console.warn(`[EnhancedStorage] Failed to make file public: ${destination}`, error);
        }
      }

      // Get file metadata
      const [metadata] = await file.getMetadata();
      const publicUrl = `https://${this.config.gcsBucket}.storage.googleapis.com/${encodeURI(destination)}`;

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
    });
  }
  return storageService;
}

export default EnhancedStorageService;
