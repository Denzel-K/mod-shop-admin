import { NextRequest } from 'next/server';
import { createHash } from 'crypto';

// Types
export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  requireExtension?: boolean;
}

export interface ValidatedFile {
  file: File;
  buffer: Buffer;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
}

export interface UploadProgress {
  uploadId: string;
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: number;
  updatedAt: number;
}

// File validation utilities
export class FileValidator {
  private static readonly DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly MODEL_MIME_TYPES = [
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream', // .glb files often have this MIME type
  ];
  private static readonly IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  public static async validateFile(
    file: File,
    options: FileValidationOptions = {}
  ): Promise<ValidatedFile> {
    const {
      maxSizeBytes = this.DEFAULT_MAX_SIZE,
      allowedMimeTypes,
      allowedExtensions,
      requireExtension = true,
    } = options;

    // Basic file checks
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file object');
    }

    if (file.size === 0) {
      throw new Error('File is empty');
    }

    if (file.size > maxSizeBytes) {
      throw new Error(`File size (${this.formatBytes(file.size)}) exceeds maximum allowed size (${this.formatBytes(maxSizeBytes)})`);
    }

    // Extract extension
    const extension = this.extractExtension(file.name);
    if (requireExtension && !extension) {
      throw new Error('File must have a valid extension');
    }

    // Validate extension
    if (allowedExtensions && extension && !allowedExtensions.includes(extension.toLowerCase())) {
      throw new Error(`File extension '${extension}' is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
    }

    // Validate MIME type
    if (allowedMimeTypes && !allowedMimeTypes.includes(file.type)) {
      throw new Error(`File type '${file.type}' is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate checksum
    const checksum = createHash('sha256').update(buffer).digest('hex');

    // Additional validation based on file content
    await this.validateFileContent(buffer, extension, file.type);

    return {
      file,
      buffer,
      extension: extension || '',
      mimeType: file.type,
      sizeBytes: file.size,
      checksum,
    };
  }

  public static async validateModelFile(file: File): Promise<ValidatedFile> {
    return this.validateFile(file, {
      maxSizeBytes: 200 * 1024 * 1024, // 200MB for 3D models
      allowedMimeTypes: [...this.MODEL_MIME_TYPES],
      allowedExtensions: ['glb', 'gltf'],
    });
  }

  public static async validateImageFile(file: File): Promise<ValidatedFile> {
    return this.validateFile(file, {
      maxSizeBytes: 10 * 1024 * 1024, // 10MB for images
      allowedMimeTypes: [...this.IMAGE_MIME_TYPES],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    });
  }

  private static extractExtension(filename: string): string | null {
    if (!filename || typeof filename !== 'string') return null;
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : null;
  }

  private static async validateFileContent(
    buffer: Buffer,
    extension: string | null,
    mimeType: string
  ): Promise<void> {
    if (!buffer || buffer.length === 0) {
      throw new Error('File content is empty');
    }

    // Validate GLB files
    if (extension === 'glb') {
      if (buffer.length < 12) {
        throw new Error('GLB file is too small to be valid');
      }
      
      // Check GLB magic number (first 4 bytes should be "glTF")
      const magic = buffer.subarray(0, 4).toString('ascii');
      if (magic !== 'glTF') {
        throw new Error('Invalid GLB file: missing magic number');
      }
    }

    // Validate GLTF files
    if (extension === 'gltf') {
      try {
        const content = buffer.toString('utf8');
        const json = JSON.parse(content);
        if (!json.asset || !json.asset.version) {
          throw new Error('Invalid GLTF file: missing required asset information');
        }
      } catch (error) {
        throw new Error(`Invalid GLTF file: ${error instanceof Error ? error.message : 'parsing failed'}`);
      }
    }

    // Validate image files by checking magic numbers
    if (mimeType.startsWith('image/')) {
      const isValidImage = this.validateImageMagicNumber(buffer, extension);
      if (isValidImage === false) {
        throw new Error('Invalid image file: content does not match expected format');
      }
    }
  }

  private static validateImageMagicNumber(buffer: Buffer, extension: string | null): boolean {
    if (buffer.length < 4) return false;

    const first4 = buffer.subarray(0, 4);
    const first8 = buffer.length >= 8 ? buffer.subarray(0, 8) : null;

    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return first4[0] === 0xFF && first4[1] === 0xD8 && first4[2] === 0xFF;
      
      case 'png':
        return !!first8 && 
               first8[0] === 0x89 && first8[1] === 0x50 && 
               first8[2] === 0x4E && first8[3] === 0x47 &&
               first8[4] === 0x0D && first8[5] === 0x0A &&
               first8[6] === 0x1A && first8[7] === 0x0A;
      
      case 'gif':
        const gifHeader = first4.toString('ascii');
        return gifHeader === 'GIF8';
      
      case 'webp':
        return first4.toString('ascii') === 'RIFF' && 
               buffer.length >= 12 && 
               buffer.subarray(8, 12).toString('ascii') === 'WEBP';
      
      default:
        return true; // Allow other formats to pass through
    }
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Upload progress tracking
export class UploadProgressTracker {
  private static progressMap = new Map<string, UploadProgress>();

  public static createUpload(filename: string): string {
    const uploadId = this.generateUploadId();
    this.progressMap.set(uploadId, {
      uploadId,
      filename,
      progress: 0,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return uploadId;
  }

  /**
   * Register an upload entry with a specific, client-provided uploadId.
   * If an entry already exists for the id, it will not be overwritten.
   */
  public static registerUpload(uploadId: string, filename: string): void {
    if (!this.progressMap.has(uploadId)) {
      this.progressMap.set(uploadId, {
        uploadId,
        filename,
        progress: 0,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }

  public static updateProgress(
    uploadId: string,
    progress: number,
    status?: UploadProgress['status']
  ): void {
    const existing = this.progressMap.get(uploadId);
    if (existing) {
      this.progressMap.set(uploadId, {
        ...existing,
        progress: Math.max(0, Math.min(100, progress)),
        status: status || existing.status,
        updatedAt: Date.now(),
      });
    }
  }

  public static setError(uploadId: string, error: string): void {
    const existing = this.progressMap.get(uploadId);
    if (existing) {
      this.progressMap.set(uploadId, {
        ...existing,
        status: 'failed',
        error,
        updatedAt: Date.now(),
      });
    }
  }

  public static complete(uploadId: string): void {
    this.updateProgress(uploadId, 100, 'completed');
  }

  public static getProgress(uploadId: string): UploadProgress | null {
    return this.progressMap.get(uploadId) || null;
  }

  public static cleanup(uploadId: string): void {
    this.progressMap.delete(uploadId);
  }

  public static cleanupOld(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    // Clean up progress entries older than maxAgeMs (default 24 hours)
    // Note: In a production environment, you'd want to store this in a database
    // or Redis with proper TTL instead of in-memory storage
    const now = Date.now();
    for (const [uploadId, progress] of this.progressMap.entries()) {
      const age = now - (progress.updatedAt || progress.createdAt || now);
      // Remove entries that are completed/failed and older than threshold
      // Also remove any stale entries (any status) older than 2x threshold as a safety net
      if ((progress.status === 'completed' || progress.status === 'failed')) {
        if (age > maxAgeMs) this.progressMap.delete(uploadId);
      } else if (age > maxAgeMs * 2) {
        this.progressMap.delete(uploadId);
      }
    }
  }

  private static generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Form data parsing utilities
export class FormDataParser {
  public static async parseMultipartForm(request: NextRequest): Promise<{
    fields: Map<string, string>;
    files: Map<string, File>;
  }> {
    try {
      const formData = await request.formData();
      const fields = new Map<string, string>();
      const files = new Map<string, File>();

      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          files.set(key, value);
        } else {
          fields.set(key, String(value).trim());
        }
      }

      return { fields, files };
    } catch (error) {
      throw new Error(`Failed to parse form data: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  public static getRequiredField(fields: Map<string, string>, key: string): string {
    const value = fields.get(key);
    if (!value || value.trim() === '') {
      throw new Error(`Required field '${key}' is missing or empty`);
    }
    return value.trim();
  }

  public static getOptionalField(fields: Map<string, string>, key: string, defaultValue = ''): string {
    const value = fields.get(key);
    return value ? value.trim() : defaultValue;
  }

  public static getRequiredFile(files: Map<string, File>, key: string): File {
    const file = files.get(key);
    if (!file || !(file instanceof File)) {
      throw new Error(`Required file '${key}' is missing`);
    }
    return file;
  }

  public static getOptionalFile(files: Map<string, File>, key: string): File | null {
    const file = files.get(key);
    return file instanceof File ? file : null;
  }
}

// Utility functions
export function generateSafeFilename(name: string, timestamp?: number): string {
  const safeBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'file';
  
  const ts = timestamp || Date.now();
  return `${safeBase}-${ts}`;
}

export function getContentTypeForExtension(extension: string): string {
  const contentTypes: Record<string, string> = {
    'glb': 'model/gltf-binary',
    'gltf': 'model/gltf+json',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
  };
  
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
}
