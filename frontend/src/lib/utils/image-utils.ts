/**
 * Image utility functions for handling Supabase Storage images
 */

// Get the full public URL for an image stored in Supabase Storage
export function getImageUrl(imagePath: string | null | undefined, entityType: 'grinder' | 'machine'): string {
  if (!imagePath) {
    return '';
  }

  // If it's already a full URL, return as-is (for backward compatibility)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Construct the Supabase Storage URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const bucketName = entityType === 'grinder' ? 'grinders' : 'machines';
  
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${imagePath}`;
}

export function resolveApiBaseUrl(explicitBase?: string): string {
  return explicitBase || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
}

export function getImageUploadUrl(
  entityType: 'grinder' | 'machine',
  entityId: string,
  apiBaseUrl?: string
): string {
  const baseUrl = resolveApiBaseUrl(apiBaseUrl);
  return `${baseUrl}/${entityType}s/${entityId}/image`;
}

// Get a fallback image URL for when no image is available
export function getFallbackImageUrl(entityType: 'grinder' | 'machine'): string {
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
