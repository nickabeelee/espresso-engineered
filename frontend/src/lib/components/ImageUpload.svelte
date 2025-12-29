<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import { Trash } from '$lib/icons';
  import { getAuthToken } from '$lib/supabase';
  import { upload } from '$lib/ui/components/upload';
  import { toStyleString } from '$lib/ui/style';
  
  export let currentImageUrl: string = '';
  export let entityType: 'grinder' | 'machine';
  export let entityId: string = '';
  export let disabled: boolean = false;
  export let maxSizeMB: number = 5;
  
  const dispatch = createEventDispatcher<{
    upload: { file: File; imageUrl: string };
    delete: void;
    error: { message: string };
  }>();
  
  let fileInput: HTMLInputElement;
  let uploading = false;
  let dragOver = false;

  const style = toStyleString({
    '--upload-surface': upload.surface.background,
    '--upload-border': upload.surface.borderColor,
    '--upload-radius': upload.surface.radius,
    '--upload-text': upload.prompt.textColor,
    '--upload-text-muted': upload.prompt.mutedColor,
    '--upload-area-padding': upload.area.padding,
    '--upload-area-min-height': upload.area.minHeight,
    '--upload-area-hover-bg': upload.area.hoverBackground,
    '--upload-area-hover-border': upload.area.hoverBorder,
    '--upload-spinner-border': upload.spinner.borderColor,
    '--upload-spinner-accent': upload.spinner.accentColor,
    '--upload-spinner-size': upload.spinner.size,
    '--upload-image-max-width': upload.image.maxWidth,
    '--upload-image-max-height': upload.image.maxHeight
  });
  
  // Supported file types
  const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_FILE_SIZE = maxSizeMB * 1024 * 1024;
  
  function validateFile(file: File): string | null {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return `Unsupported file type. Please use: ${SUPPORTED_TYPES.map(t => t.split('/')[1]).join(', ')}`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }
    
    return null;
  }
  
  async function handleFileSelect(file: File) {
    const error = validateFile(file);
    if (error) {
      dispatch('error', { message: error });
      return;
    }
    
    if (!entityId) {
      dispatch('error', { message: 'Entity must be saved before uploading images' });
      return;
    }
    
    uploading = true;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = await getAuthToken();
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiBaseUrl}/api/${entityType}s/${entityId}/image`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }
      
      const result = await response.json();
      dispatch('upload', { file, imageUrl: result.image_url });
      
    } catch (error) {
      console.error('Upload error:', error);
      dispatch('error', { 
        message: error instanceof Error ? error.message : 'Failed to upload image' 
      });
    } finally {
      uploading = false;
    }
  }
  
  async function handleDelete() {
    if (!entityId || !currentImageUrl) return;
    
    uploading = true;
    
    try {
      const token = await getAuthToken();
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiBaseUrl}/api/${entityType}s/${entityId}/image`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete image');
      }
      
      dispatch('delete');
      
    } catch (error) {
      console.error('Delete error:', error);
      dispatch('error', { 
        message: error instanceof Error ? error.message : 'Failed to delete image' 
      });
    } finally {
      uploading = false;
    }
  }
  
  function handleInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }
  
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
    
    const file = event.dataTransfer?.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }
  
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }
  
  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
  }
  
  function triggerFileInput() {
    if (!disabled && !uploading) {
      fileInput.click();
    }
  }
</script>

<div class="image-upload" style={style}>
  <input
    bind:this={fileInput}
    type="file"
    accept={SUPPORTED_TYPES.join(',')}
    on:change={handleInputChange}
    style="display: none;"
    {disabled}
  />
  
  {#if currentImageUrl}
    <div class="current-image">
      <img src={currentImageUrl} alt="{entityType} image" loading="lazy" />
      <div class="image-actions">
        <button
          type="button"
          class="btn-secondary btn-small"
          on:click={triggerFileInput}
          disabled={disabled || uploading}
        >
          {uploading ? 'Uploading...' : 'Replace'}
        </button>
        <IconButton
          on:click={handleDelete}
          ariaLabel="Delete image"
          title="Delete"
          variant="danger"
          disabled={disabled || uploading}
        >
          <Trash />
        </IconButton>
      </div>
    </div>
  {:else}
    <div
      class="upload-area"
      class:drag-over={dragOver}
      class:disabled
      on:click={triggerFileInput}
      on:drop={handleDrop}
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      role="button"
      tabindex="0"
      on:keydown={(e) => e.key === 'Enter' && triggerFileInput()}
    >
      {#if uploading}
        <div class="upload-status">
          <div class="spinner"></div>
          <p>Uploading image...</p>
        </div>
      {:else}
        <div class="upload-prompt">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
          <p>Click to upload or drag and drop</p>
          <small>PNG, JPG, WebP, GIF up to {maxSizeMB}MB</small>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .image-upload {
    width: 100%;
    --color-surface: var(--upload-surface, var(--bg-surface-paper-secondary));
    --color-border: var(--upload-border, var(--border-subtle));
    --color-primary: var(--upload-area-hover-border, var(--accent-primary));
    --color-primary-light: var(--upload-area-hover-bg, rgba(176, 138, 90, 0.12));
    --color-text: var(--upload-text, var(--text-ink-primary));
    --color-text-secondary: var(--upload-text-muted, var(--text-ink-muted));
    --color-error: var(--semantic-error);
    --color-error-dark: rgba(122, 62, 47, 0.35);
  }
  
  .current-image {
    position: relative;
    display: inline-block;
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
  }
  
  .current-image img {
    display: block;
    max-width: var(--upload-image-max-width, 200px);
    max-height: var(--upload-image-max-height, 150px);
    width: auto;
    height: auto;
    object-fit: cover;
  }
  
  .image-actions {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(43, 33, 24, 0.72));
    padding: 0.5rem;
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .current-image:hover .image-actions {
    opacity: 1;
  }
  
  .upload-area {
    border: 2px dashed var(--color-border);
    border-radius: var(--upload-radius, var(--radius-md));
    padding: var(--upload-area-padding, 2rem);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--color-surface);
    min-height: var(--upload-area-min-height, 120px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .upload-area:hover:not(.disabled) {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
  }
  
  .upload-area.drag-over {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    transform: scale(1.02);
  }
  
  .upload-area.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .upload-prompt svg {
    color: var(--color-text-secondary);
    margin-bottom: 0.5rem;
  }
  
  .upload-prompt p {
    margin: 0.5rem 0;
    color: var(--color-text);
    font-weight: 500;
  }
  
  .upload-prompt small {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
  }
  
  .upload-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .upload-status p {
    margin: 0;
    color: var(--color-text);
  }
  
  .spinner {
    width: var(--upload-spinner-size, 24px);
    height: var(--upload-spinner-size, 24px);
    border: 2px solid var(--upload-spinner-border, var(--color-border));
    border-top: 2px solid var(--upload-spinner-accent, var(--color-primary));
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .btn-small {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    min-width: auto;
  }
  
  @media (max-width: 768px) {
    .current-image img {
      max-width: 150px;
      max-height: 100px;
    }
    
    .upload-area {
      padding: 1.5rem;
      min-height: 100px;
    }
    
    .image-actions {
      opacity: 1; /* Always show on mobile */
    }
  }
</style>
