import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export type StorageProvider = 'local' | 's3';

export interface UploadResult {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  storageProvider: StorageProvider;
}

export interface StorageConfig {
  provider: StorageProvider;
  uploadDir?: string;
  s3?: {
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    region: string;
    endpoint?: string;
    publicUrl?: string;
  };
}

let s3Client: S3Client | null = null;

function getS3Client(config: NonNullable<StorageConfig['s3']>): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: config.endpoint || undefined,
      forcePathStyle: !!config.endpoint,
    });
  }
  return s3Client;
}

function getStorageConfig(): StorageConfig {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageProvider;
  
  if (provider === 's3') {
    return {
      provider: 's3',
      s3: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        bucketName: process.env.S3_BUCKET_NAME || '',
        region: process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT,
        publicUrl: process.env.S3_PUBLIC_URL,
      },
    };
  }
  
  return {
    provider: 'local',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  };
}

export async function uploadFile(
  file: File | Buffer,
  originalName: string,
  mimeType: string,
  folder: string = 'blog'
): Promise<UploadResult> {
  const config = getStorageConfig();
  
  const ext = path.extname(originalName);
  const filename = `${uuidv4()}${ext}`;
  const filePath = folder ? `${folder}/${filename}` : filename;
  
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
  const size = buffer.length;
  
  if (config.provider === 's3' && config.s3) {
    return uploadToS3(buffer, filename, filePath, originalName, mimeType, size, config.s3);
  } else {
    return uploadToLocal(buffer, filename, filePath, originalName, mimeType, size, config.uploadDir!);
  }
}

async function uploadToS3(
  buffer: Buffer,
  filename: string,
  filePath: string,
  originalName: string,
  mimeType: string,
  size: number,
  s3Config: NonNullable<StorageConfig['s3']>
): Promise<UploadResult> {
  const client = getS3Client(s3Config);
  
  await client.send(new PutObjectCommand({
    Bucket: s3Config.bucketName,
    Key: filePath,
    Body: buffer,
    ContentType: mimeType,
    ACL: 'public-read',
  }));
  
  let url: string;
  if (s3Config.publicUrl) {
    url = `${s3Config.publicUrl}/${filePath}`;
  } else if (s3Config.endpoint) {
    url = `${s3Config.endpoint}/${s3Config.bucketName}/${filePath}`;
  } else {
    url = `https://${s3Config.bucketName}.s3.${s3Config.region}.amazonaws.com/${filePath}`;
  }
  
  return {
    filename,
    originalName,
    mimeType,
    size,
    path: filePath,
    url,
    storageProvider: 's3',
  };
}

async function uploadToLocal(
  buffer: Buffer,
  filename: string,
  filePath: string,
  originalName: string,
  mimeType: string,
  size: number,
  uploadDir: string
): Promise<UploadResult> {
  const fullPath = path.join(uploadDir, filePath);
  const dir = path.dirname(fullPath);
  
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(fullPath, buffer);
  
  const url = `/uploads/${filePath}`;
  
  return {
    filename,
    originalName,
    mimeType,
    size,
    path: filePath,
    url,
    storageProvider: 'local',
  };
}

export async function deleteFile(filePath: string, storageProvider: StorageProvider): Promise<void> {
  const config = getStorageConfig();
  
  if (storageProvider === 's3' && config.s3) {
    const client = getS3Client(config.s3);
    await client.send(new DeleteObjectCommand({
      Bucket: config.s3.bucketName,
      Key: filePath,
    }));
  } else {
    const fullPath = path.join(config.uploadDir || './uploads', filePath);
    try {
      await fs.unlink(fullPath);
    } catch {
      // File might not exist
    }
  }
}

export async function getSignedUploadUrl(
  filename: string,
  mimeType: string,
  folder: string = 'blog'
): Promise<{ url: string; filePath: string }> {
  const config = getStorageConfig();
  
  if (config.provider !== 's3' || !config.s3) {
    throw new Error('Signed URLs are only available for S3 storage');
  }
  
  const ext = path.extname(filename);
  const uniqueFilename = `${uuidv4()}${ext}`;
  const filePath = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;
  
  const client = getS3Client(config.s3);
  
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: config.s3.bucketName,
      Key: filePath,
      ContentType: mimeType,
    }),
    { expiresIn: 3600 }
  );
  
  return { url, filePath };
}

export function getPublicUrl(filePath: string): string {
  const config = getStorageConfig();
  
  if (config.provider === 's3' && config.s3) {
    if (config.s3.publicUrl) {
      return `${config.s3.publicUrl}/${filePath}`;
    } else if (config.s3.endpoint) {
      return `${config.s3.endpoint}/${config.s3.bucketName}/${filePath}`;
    } else {
      return `https://${config.s3.bucketName}.s3.${config.s3.region}.amazonaws.com/${filePath}`;
    }
  }
  
  return `/uploads/${filePath}`;
}

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function validateFileType(mimeType: string, allowedTypes: string[] = ALLOWED_IMAGE_TYPES): boolean {
  return allowedTypes.includes(mimeType);
}

export function validateFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size <= maxBytes;
}
