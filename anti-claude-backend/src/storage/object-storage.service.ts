import { createWriteStream, createReadStream, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { pipeline } from 'stream/promises';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { UPLOAD_CONFIG } from '../config/constants.js';
import { AppError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export interface StoredFile {
  storageKey: string;
  filename: string;
  mimeType: string;
  size: number;
}

class ObjectStorageService {
  private localDir: string;

  constructor() {
    this.localDir = env.STORAGE_LOCAL_DIR;
    if (env.STORAGE_TYPE === 'local') {
      if (!existsSync(this.localDir)) {
        mkdirSync(this.localDir, { recursive: true });
      }
      logger.info({ dir: this.localDir }, 'Local storage initialized');
    }
  }

  /**
   * Upload a file. Returns storage key and metadata.
   * Uses local disk in hackathon mode, S3 when configured.
   */
  async upload(
    fileStream: NodeJS.ReadableStream,
    originalFilename: string,
    mimeType: string,
    sizeBytes: number,
  ): Promise<StoredFile> {
    // Validate MIME type
    if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new AppError(
        'INVALID_FILE_TYPE',
        `File type ${mimeType} is not allowed`,
        415,
      );
    }

    // Validate size
    if (sizeBytes > UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES) {
      throw new AppError(
        'FILE_TOO_LARGE',
        `File exceeds maximum size of ${UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
        413,
      );
    }

    const ext = extname(originalFilename) || '';
    const storageKey = `${uuidv4()}${ext}`;

    if (env.STORAGE_TYPE === 'local') {
      return this.uploadLocal(fileStream, storageKey, originalFilename, mimeType, sizeBytes);
    } else {
      return this.uploadS3(fileStream, storageKey, originalFilename, mimeType, sizeBytes);
    }
  }

  private async uploadLocal(
    fileStream: NodeJS.ReadableStream,
    storageKey: string,
    originalFilename: string,
    mimeType: string,
    size: number,
  ): Promise<StoredFile> {
    const filePath = join(this.localDir, storageKey);
    const writeStream = createWriteStream(filePath);

    await pipeline(fileStream, writeStream);
    logger.debug({ storageKey, filePath }, 'File saved to local storage');

    return { storageKey, filename: originalFilename, mimeType, size };
  }

  private async uploadS3(
    fileStream: NodeJS.ReadableStream,
    storageKey: string,
    originalFilename: string,
    mimeType: string,
    size: number,
  ): Promise<StoredFile> {
    // Dynamically import AWS SDK only if S3 is configured
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

    const chunks: Buffer[] = [];
    for await (const chunk of fileStream) {
      chunks.push(Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks);

    const s3 = new S3Client({
      endpoint: env.STORAGE_ENDPOINT,
      region: env.STORAGE_REGION,
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY!,
        secretAccessKey: env.STORAGE_SECRET_KEY!,
      },
    });

    await s3.send(new PutObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: storageKey,
      Body: body,
      ContentType: mimeType,
    }));

    logger.debug({ storageKey, bucket: env.STORAGE_BUCKET }, 'File uploaded to S3');
    return { storageKey, filename: originalFilename, mimeType, size };
  }

  /**
   * Get a readable stream or URL for a stored file.
   */
  getLocalPath(storageKey: string): string {
    return join(this.localDir, storageKey);
  }
}

export const objectStorageService = new ObjectStorageService();
