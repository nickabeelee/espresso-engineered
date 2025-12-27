<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { adminService } from '$lib/admin-service';
  import { barista } from '$lib/auth';
  import IconButton from '$lib/components/IconButton.svelte';
  import ImageUpload from '$lib/components/ImageUpload.svelte';
  import { PencilSquare, CheckCircle, XMark, Plus } from '$lib/icons';
  import { getImageUrl } from '$lib/utils/image-utils';
  import { formatMostUsedBy } from '$lib/utils/usage-stats';
  import type { Grinder, CreateGrinderRequest, Barista } from '@shared/types';

  // Props for existing grinder mode
  export let grinder: Grinder | null = null;
  
  // Props for new grinder mode
  export let isNewGrinder = false;

  // Props for usage stats
  export let usageCount: number = 0;
  export let mostUsedBy: Barista | undefined = undefined;

  const dispatch = createEventDispatcher<{
    updated: Grinder;
    created: Grinder;
    deleted: string;
    cancel: void;
  }>();

  let isEditing = isNewGrinder; // Start in edit mode for new grinders
  let isSaving = false;
  let error: string | null = null;
  let validationErrors: Record<string, string> = {};
  
  // Form data - works for both create and update
  let formData: Partial<CreateGrinderRequest> = {};

  $: canEdit = true; // Grinders are global, anyone can edit
  $: isAdmin = $barista?.is_admin === true;

  const commonManufacturers = [
    'Weber Workshops',
    'Niche',
    'Lagom',
    'Mazzer',
    'Eureka',
    'Ceado',
    'Fellow',
    'Comandante',
    'Timemore',
    'Baratza',
    'DF64',
    'Option-O'
  ];

  function initializeFormData() {
    if (isNewGrinder) {
      // Initialize for new grinder creation
      formData = {
        manufacturer: '',
        model: '',
        setting_guide_chart_url: '',
        image_path: ''
      };
    } else if (grinder) {
      // Initialize for editing existing grinder
      formData = {
        manufacturer: grinder.manufacturer || '',
        model: grinder.model || '',
        setting_guide_chart_url: grinder.setting_guide_chart_url || '',
        image_path: grinder.image_path || ''
      };
    }
  }

  function handleEdit() {
    if (!canEdit || isNewGrinder) return;
    
    initializeFormData();
    isEditing = true;
    error = null;
    validationErrors = {};
  }

  function handleCancel() {
    if (isNewGrinder) {
      dispatch('cancel');
      return;
    }
    
    isEditing = false;
    formData = {};
    error = null;
    validationErrors = {};
  }

  function isValidUrl(value: string): boolean {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  function validateForm(): boolean {
    validationErrors = {};

    if (!formData.manufacturer?.trim()) {
      validationErrors.manufacturer = 'Manufacturer is required';
    }

    if (!formData.model?.trim()) {
      validationErrors.model = 'Model is required';
    }

    if (formData.setting_guide_chart_url && !isValidUrl(formData.setting_guide_chart_url)) {
      validationErrors.setting_guide_chart_url = 'Please enter a valid URL';
    }

    return Object.keys(validationErrors).length === 0;
  }

  async function handleSave() {
    if (!canEdit) return;
    if (!validateForm()) {
      error = 'Please fix validation errors';
      return;
    }

    try {
      isSaving = true;
      error = null;

      const payload: CreateGrinderRequest = {
        manufacturer: formData.manufacturer!.trim(),
        model: formData.model!.trim(),
        setting_guide_chart_url: formData.setting_guide_chart_url?.trim() || undefined,
        image_path: formData.image_path?.trim() || undefined
      };

      if (isNewGrinder) {
        // Create new grinder
        const response = await apiClient.createGrinder(payload);
        
        if (response.data) {
          dispatch('created', response.data);
        } else {
          throw new Error('Failed to create grinder');
        }
      } else if (grinder) {
        // Update existing grinder
        const response = await apiClient.updateGrinder(grinder.id, payload);
        
        if (response.data) {
          dispatch('updated', response.data);
          isEditing = false;
          formData = {};
        } else {
          throw new Error('Failed to update grinder');
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : `Failed to ${isNewGrinder ? 'create' : 'update'} grinder`;
      console.error(`Failed to ${isNewGrinder ? 'create' : 'update'} grinder:`, err);
    } finally {
      isSaving = false;
    }
  }

  async function handleDelete() {
    if (!grinder || !canEdit) return;
    
    const confirmed = window.confirm('Delete this grinder? This cannot be undone.');
    if (!confirmed) return;

    try {
      isSaving = true;
      error = null;

      await apiClient.deleteGrinder(grinder.id);
      dispatch('deleted', grinder.id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete grinder';
      console.error('Failed to delete grinder:', err);
    } finally {
      isSaving = false;
    }
  }

  function handleImageUpload(event: CustomEvent<{ file: File; imageUrl: string }>) {
    formData.image_path = event.detail.imageUrl;
  }

  function handleImageDelete() {
    formData.image_path = '';
  }

  function selectManufacturer(name: string) {
    formData.manufacturer = name;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      handleSave();
    }
  }

  // Initialize form data when component mounts or props change
  $: if (isNewGrinder || grinder) {
    initializeFormData();
  }
</script>

<div class="grinder-card" class:editing={isEditing} class:new-grinder={isNewGrinder} on:keydown={handleKeydown} role="region" tabindex="-1">
  <div class="grinder-header">
    <div class="grinder-title">
      {#if isNewGrinder}
        <h4>New Grinder</h4>
        <span class="grinder-info">Add a new coffee grinder</span>
      {:else if grinder}
        <h4>{grinder.manufacturer} {grinder.model}</h4>
        <div class="grinder-info-row">
          <span class="grinder-info">Global equipment</span>
          {#if usageCount > 0}
            <span class="usage-badge">{usageCount} brews</span>
          {/if}
        </div>
      {/if}
    </div>
    
    <div class="grinder-actions">
      {#if canEdit && !isEditing && !isNewGrinder}
        <IconButton 
          on:click={handleEdit} 
          ariaLabel="Edit grinder" 
          title="Edit grinder" 
          variant="accent" 
          size="sm"
        >
          <PencilSquare />
        </IconButton>
      {/if}
      
      {#if isEditing}
        <div class="edit-actions">
          <IconButton 
            on:click={handleCancel} 
            ariaLabel="Cancel" 
            title="Cancel" 
            variant="neutral" 
            size="sm"
            disabled={isSaving}
          >
            <XMark />
          </IconButton>
          <IconButton 
            on:click={handleSave} 
            ariaLabel={isNewGrinder ? "Create grinder" : "Save changes"} 
            title={isNewGrinder ? "Create grinder" : "Save"} 
            variant="success" 
            size="sm"
            disabled={isSaving}
          >
            <CheckCircle />
          </IconButton>
        </div>
      {/if}
    </div>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}
  
  <div class="grinder-details">
    <div class="grinder-detail">
      <span class="detail-label">Manufacturer</span>
      {#if isEditing}
        <div class="manufacturer-input-group">
          <input
            type="text"
            bind:value={formData.manufacturer}
            class="detail-input"
            class:error={validationErrors.manufacturer}
            placeholder="e.g., Weber Workshops"
            disabled={isSaving}
          />
          {#if validationErrors.manufacturer}
            <span class="validation-error">{validationErrors.manufacturer}</span>
          {/if}
          <div class="manufacturer-suggestions">
            {#each commonManufacturers as name}
              <button
                type="button"
                class="manufacturer-suggestion"
                on:click={() => selectManufacturer(name)}
                disabled={isSaving}
              >
                {name}
              </button>
            {/each}
          </div>
        </div>
      {:else if grinder?.manufacturer}
        <span class="detail-value">{grinder.manufacturer}</span>
      {:else}
        <span class="detail-value detail-empty">Not specified</span>
      {/if}
    </div>
    
    <div class="grinder-detail">
      <span class="detail-label">Model</span>
      {#if isEditing}
        <input
          type="text"
          bind:value={formData.model}
          class="detail-input"
          class:error={validationErrors.model}
          placeholder="e.g., EG-1"
          disabled={isSaving}
        />
        {#if validationErrors.model}
          <span class="validation-error">{validationErrors.model}</span>
        {/if}
      {:else if grinder?.model}
        <span class="detail-value">{grinder.model}</span>
      {:else}
        <span class="detail-value detail-empty">Not specified</span>
      {/if}
    </div>
    
    <div class="grinder-detail">
      <span class="detail-label">Setting Guide</span>
      {#if isEditing}
        <input
          type="url"
          bind:value={formData.setting_guide_chart_url}
          class="detail-input"
          class:error={validationErrors.setting_guide_chart_url}
          placeholder="https://example.com/setting-guide"
          disabled={isSaving}
        />
        {#if validationErrors.setting_guide_chart_url}
          <span class="validation-error">{validationErrors.setting_guide_chart_url}</span>
        {/if}
      {:else if grinder?.setting_guide_chart_url}
        <a href={grinder.setting_guide_chart_url} target="_blank" rel="noopener noreferrer" class="detail-link">
          View Guide
        </a>
      {:else}
        <span class="detail-value detail-empty">Not specified</span>
      {/if}
    </div>

    {#if isEditing}
      <div class="grinder-detail image-detail">
        <span class="detail-label">Image</span>
        <ImageUpload
          currentImagePath={formData.image_path}
          on:uploaded={handleImageUpload}
          on:deleted={handleImageDelete}
          disabled={isSaving}
        />
      </div>
    {:else if grinder?.image_path}
      <div class="grinder-detail image-detail">
        <span class="detail-label">Image</span>
        <img 
          src={getImageUrl(grinder.image_path)} 
          alt="{grinder.manufacturer} {grinder.model}"
          class="grinder-image"
        />
      </div>
    {/if}
  </div>

  {#if !isEditing && !isNewGrinder && mostUsedBy}
    <div class="usage-stats">
      <span class="most-used-by">Most used by {mostUsedBy.display_name}</span>
    </div>
  {/if}

  {#if !isEditing && !isNewGrinder && canEdit}
    <div class="grinder-actions-section">
      <button
        type="button"
        class="delete-button"
        on:click={handleDelete}
        disabled={isSaving}
      >
        Delete Grinder
      </button>
    </div>
  {/if}
</div>

<style>
  .grinder-card {
    background: var(--bg-surface-paper);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 1rem;
    transition: border-color var(--motion-fast);
  }

  .grinder-card.editing {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.1);
  }

  .grinder-card.new-grinder {
    border-color: var(--accent-primary);
    border-style: dashed;
    background: var(--bg-surface-paper-secondary);
    margin-bottom: 1.5rem;
  }

  .grinder-card.new-grinder.editing {
    border-style: solid;
    background: var(--bg-surface-paper);
    margin-bottom: 1.5rem;
  }

  .grinder-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .grinder-title {
    flex: 1;
    min-width: 0;
  }

  .grinder-title h4 {
    margin: 0;
    color: var(--text-ink-primary);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 500;
    word-wrap: break-word;
  }

  .grinder-info {
    color: var(--text-ink-secondary);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.8rem;
    margin-top: 0.25rem;
    display: block;
  }

  .grinder-info-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .usage-badge {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-sm);
  }

  .grinder-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .edit-actions {
    display: flex;
    gap: 0.25rem;
  }

  .error-message {
    background: rgba(122, 62, 47, 0.1);
    color: var(--semantic-error);
    border: 1px solid rgba(122, 62, 47, 0.3);
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.75rem;
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.9rem;
  }

  .grinder-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }

  .grinder-detail {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .grinder-detail.image-detail {
    grid-column: 1 / -1;
  }

  .detail-label {
    font-weight: 500;
    color: var(--text-ink-secondary);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.8rem;
  }

  .detail-value {
    color: var(--text-ink-primary);
    font-family: "Libre Baskerville", serif;
    font-size: 0.9rem;
  }

  .detail-empty {
    color: var(--text-ink-muted);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-style: italic;
  }

  .detail-link {
    color: var(--accent-primary);
    text-decoration: none;
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.9rem;
    transition: color var(--motion-fast);
  }

  .detail-link:hover {
    color: var(--accent-primary-dark);
    text-decoration: underline;
  }

  .detail-input {
    color: var(--text-ink-primary);
    font-size: 0.9rem;
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    background: var(--bg-surface-paper);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    padding: 0.4rem 0.6rem;
    transition: border-color var(--motion-fast);
  }

  .detail-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.1);
  }

  .detail-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .detail-input.error {
    border-color: var(--semantic-error);
  }

  .manufacturer-input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .manufacturer-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .manufacturer-suggestion {
    background: var(--bg-surface-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    padding: 0.2rem 0.5rem;
    font-size: 0.8rem;
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    color: var(--text-ink-inverted);
    cursor: pointer;
    transition: all var(--motion-fast);
  }

  .manufacturer-suggestion:hover {
    background: var(--accent-primary);
    color: var(--text-ink-primary);
    border-color: var(--accent-primary);
  }

  .manufacturer-suggestion:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .validation-error {
    color: var(--semantic-error);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.8rem;
  }

  .grinder-image {
    max-width: 200px;
    max-height: 150px;
    object-fit: cover;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-subtle);
  }

  .usage-stats {
    padding: 0.75rem;
    background: var(--bg-surface-secondary);
    border-radius: var(--radius-sm);
    margin-top: 0.75rem;
  }

  .most-used-by {
    color: var(--text-ink-inverted-muted);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 0.8rem;
  }

  .grinder-actions-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-subtle);
  }

  .delete-button {
    background: transparent;
    border: 1px solid var(--semantic-error);
    color: var(--semantic-error);
    border-radius: var(--radius-sm);
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    cursor: pointer;
    transition: all var(--motion-fast);
  }

  .delete-button:hover {
    background: var(--semantic-error);
    color: var(--text-ink-inverted);
  }

  .delete-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>