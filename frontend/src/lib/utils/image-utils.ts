/**
 * Image utility functions for handling Supabase Storage images
 */

type ImageEntityType = 'grinder' | 'machine' | 'bean';
type ImageTransform = {
  width: number;
  height: number;
  fit?: 'cover' | 'contain' | 'fill';
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
};

function resolveImageBucket(entityType: ImageEntityType): string {
  switch (entityType) {
    case 'grinder':
      return 'grinders';
    case 'machine':
      return 'machines';
    case 'bean':
      return 'beans';
  }
}

// Get the full public URL for an image stored in Supabase Storage
export function getImageUrl(imagePath: string | null | undefined, entityType: ImageEntityType): string {
  if (!imagePath) {
    return '';
  }

  // If it's already a full URL, return as-is (for backward compatibility)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Construct the Supabase Storage URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const bucketName = resolveImageBucket(entityType);
  
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${imagePath}`;
}

export function getTransformedImageUrl(
  imagePath: string | null | undefined,
  entityType: ImageEntityType,
  transform: ImageTransform
): string {
  if (!imagePath) {
    return '';
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const bucketName = resolveImageBucket(entityType);
  const params = new URLSearchParams({
    width: String(transform.width),
    height: String(transform.height),
    resize: transform.fit ?? 'cover'
  });

  if (transform.quality) {
    params.set('quality', String(transform.quality));
  }

  if (transform.format) {
    params.set('format', transform.format);
  }

  return `${supabaseUrl}/storage/v1/render/image/public/${bucketName}/${imagePath}?${params.toString()}`;
}

export function resolveApiBaseUrl(explicitBase?: string): string {
  return explicitBase || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
}

export function getImageUploadUrl(
  entityType: ImageEntityType,
  entityId: string,
  apiBaseUrl?: string
): string {
  const baseUrl = resolveApiBaseUrl(apiBaseUrl);
  return `${baseUrl}/${entityType}s/${entityId}/image`;
}

// Get a fallback image URL for when no image is available
export function getFallbackImageUrl(entityType: ImageEntityType): string {
  // Return a placeholder or empty string
  return '';
}

// Validate if an image URL is accessible
export async function validateImageUrl(url: string): Promise<boolean> {
  if (!url) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
