import { supabase } from '../config/supabase.js';
import { randomUUID } from 'crypto';
import path from 'path';

// Supported image types and their MIME types
export const SUPPORTED_IMAGE_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif']
};

// Maximum file size (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Image validation result
export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  mimeType?: string;
  extension?: string;
}

/**
 * Validate image file
 */
export function validateImageFile(file: Buffer, filename: string): ImageValidationResult {
  // Check file size
  if (file.length > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  // Get file extension
  const extension = path.extname(filename).toLowerCase();
  
  // Check if extension is supported
  const supportedExtensions = Object.values(SUPPORTED_IMAGE_TYPES).flat();
  if (!supportedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `Unsupported file type. Supported types: ${supportedExtensions.join(', ')}`
    };
  }

  // Determine MIME type from extension
  let mimeType: string | undefined;
  for (const [mime, extensions] of Object.entries(SUPPORTED_IMAGE_TYPES)) {
    if (extensions.includes(extension)) {
      mimeType = mime;
      break;
    }
  }

  // Basic file signature validation
  const signature = file.subarray(0, 4);
  const isValidSignature = validateFileSignature(signature, extension);
  
  if (!isValidSignature) {
    return {
      isValid: false,
      error: 'Invalid file format or corrupted file'
    };
  }

  return {
    isValid: true,
    mimeType,
    extension
  };
}

/**
 * Validate file signature (magic bytes)
 */
function validateFileSignature(signature: Buffer, extension: string): boolean {
  const hex = signature.toString('hex').toUpperCase();
  
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return hex.startsWith('FFD8');
    case '.png':
      return hex.startsWith('89504E47');
    case '.gif':
      return hex.startsWith('47494638');
    case '.webp':
      // WebP files start with 'RIFF' but we need to check more bytes
      return signature.length >= 4 && signature.toString('ascii', 0, 4) === 'RIFF';
    default:
      return false;
  }
}

/**
 * Generate unique filename for storage
 */
type ImageEntityType = 'grinder' | 'machine' | 'bean';

function resolveBucketName(entityType: ImageEntityType): string {
  switch (entityType) {
    case 'grinder':
      return 'grinders';
    case 'machine':
      return 'machines';
    case 'bean':
      return 'beans';
  }
}

export function generateImageFilename(originalFilename: string, entityType: ImageEntityType): string {
  const extension = path.extname(originalFilename).toLowerCase();
  const uuid = randomUUID();
  return `${uuid}${extension}`;
}

function normalizeImagePath(imagePath: string, entityType: ImageEntityType): string {
  if (!imagePath) {
    return '';
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    const bucketName = resolveBucketName(entityType);
    const marker = `/storage/v1/object/public/${bucketName}/`;
    const markerIndex = imagePath.indexOf(marker);

    if (markerIndex !== -1) {
      return imagePath.substring(markerIndex + marker.length);
    }
  }

  const normalized = imagePath.replace(/^\/+/, '');
  const entityPrefix = `${entityType}/`;
  if (normalized.startsWith(entityPrefix)) {
    return normalized.slice(entityPrefix.length);
  }

  return normalized;
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(
  file: Buffer,
  filename: string,
  entityType: ImageEntityType
): Promise<{ path: string; publicUrl: string }> {
  // Validate the image
  const validation = validateImageFile(file, filename);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Generate unique filename
  const storagePath = generateImageFilename(filename, entityType);
  
  // Determine bucket name based on entity type
  const bucketName = resolveBucketName(entityType);

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, file, {
      contentType: validation.mimeType,
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(storagePath);

  return {
    path: storagePath,
    publicUrl: publicUrlData.publicUrl
  };
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteImage(imagePath: string, entityType: ImageEntityType): Promise<void> {
  const normalizedPath = normalizeImagePath(imagePath, entityType);
  if (!normalizedPath) {
    return;
  }

  // Determine bucket name based on entity type
  const bucketName = resolveBucketName(entityType);

  const { error } = await supabase.storage
    .from(bucketName)
    .remove([normalizedPath]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Replace existing image with new one
 */
export async function replaceImage(
  oldImagePath: string | null,
  newFile: Buffer,
  newFilename: string,
  entityType: ImageEntityType
): Promise<{ path: string; publicUrl: string }> {
  // Upload new image first
  const uploadResult = await uploadImage(newFile, newFilename, entityType);

  // Delete old image if it exists
  if (oldImagePath) {
    try {
      await deleteImage(oldImagePath, entityType);
    } catch (error) {
      // Log error but don't fail the operation
      console.warn(`Failed to delete old image ${oldImagePath}:`, error);
    }
  }

  return uploadResult;
}

/**
 * Get public URL for stored image
 */
export function getImagePublicUrl(imagePath: string, entityType: ImageEntityType): string {
  if (!imagePath) {
    return '';
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Determine bucket name based on entity type
  const bucketName = resolveBucketName(entityType);

  const normalizedPath = normalizeImagePath(imagePath, entityType);
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(normalizedPath);

  return data.publicUrl;
}
