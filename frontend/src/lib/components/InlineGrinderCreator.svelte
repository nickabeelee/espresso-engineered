<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import IconButton from '$lib/components/IconButton.svelte';
  import { XMark } from '$lib/icons';

  import ImageUpload from './ImageUpload.svelte';

  const dispatch = createEventDispatcher<{
    created: Grinder;
    cancel: void;
  }>();

  // Form fields
  let manufacturer = '';
  let model = '';
  let setting_guide_chart_url = '';
  let image_path = '';

  // UI state
  let loading = false;
  let error: string | null = null;
  let validationErrors: Record<string, string> = {};
  let createdGrinderId = '';

  function validateForm(): boolean {
    validationErrors = {};

    if (!manufacturer.trim()) {
      validationErrors.manufacturer = 'Manufacturer is required';
    }
    if (!model.trim()) {
      validationErrors.model = 'Model is required';
    }
    if (setting_guide_chart_url && !isValidUrl(setting_guide_chart_url)) {
      validationErrors.setting_guide_chart_url = 'Please enter a valid URL';
    }
    if (image_path && !isValidUrl(image_path)) {
      validationErrors.image_path = 'Please enter a valid URL';
    }

    return Object.keys(validationErrors).length === 0;
  }

  function isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  async function handleSubmit() {
    if (!validateForm()) {
      error = 'Please fix validation errors';
      return;
    }

    try {
      loading = true;
      error = null;

      const grinderData: CreateGrinderRequest = {
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        setting_guide_chart_url: setting_guide_chart_url.trim() || undefined,
        image_path: image_path.trim() || undefined
      };

      const response = await apiClient.createGrinder(grinderData);
      
      if (response.data) {
        createdGrinderId = response.data.id;
        dispatch('created', response.data);
      } else {
        throw new Error('Failed to create grinder');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create grinder';
      console.error('Failed to create grinder:', err);
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function handleImageUpload(event: CustomEvent<{ file: File; imageUrl: string }>) {
    image_path = event.detail.imageUrl;
    // Clear any previous image validation errors
    delete validationErrors.image_path;
    validationErrors = { ...validationErrors };
  }

  function handleImageDelete() {
    image_path = '';
  }

  function handleImageError(event: CustomEvent<{ message: string }>) {
    validationErrors.image_path = event.detail.message;
    validationErrors = { ...validationErrors };
  }

  // Common grinder manufacturers for quick selection
  const commonManufacturers = [
    'Baratza',
    'Comandante',
    'Fellow',
    'Eureka',
    'Mazzer',
    'Niche',
    'Weber Workshops',
    'Timemore',
    'Hario',
    'Porlex'
  ];

  function selectManufacturer(name: string) {
    manufacturer = name;
  }
</script>

<div class="inline-grinder-creator">
  <div class="creator-header">
    <h4>Create New Grinder</h4>
    <button type="button" on:click={handleCancel} class="close-btn" disabled={loading}>
      ✕
    </button>
  </div>

  {#if error}
    <div class="error-banner">{error}</div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="creator-form">
    <div class="form-group">
      <label for="manufacturer">Manufacturer *</label>
      <input
        id="manufacturer"
        type="text"
        bind:value={manufacturer}
        placeholder="e.g., Baratza"
        disabled={loading}
        required
      />
      {#if validationErrors.manufacturer}
        <span class="error-text">{validationErrors.manufacturer}</span>
      {/if}
      
      <!-- Quick manufacturer selection -->
      <div class="manufacturer-presets">
        <span class="presets-label">Common:</span>
        <div class="preset-buttons">
          {#each commonManufacturers as mfg}
            <button 
              type="button" 
              on:click={() => selectManufacturer(mfg)}
              class="preset-btn"
              class:selected={manufacturer === mfg}
              disabled={loading}
            >
              {mfg}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <div class="form-group">
      <label for="model">Model *</label>
      <input
        id="model"
        type="text"
        bind:value={model}
        placeholder="e.g., Encore ESP"
        disabled={loading}
        required
      />
      {#if validationErrors.model}
        <span class="error-text">{validationErrors.model}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="setting-guide">Setting Guide Chart URL</label>
      <input
        id="setting-guide"
        type="url"
        bind:value={setting_guide_chart_url}
        placeholder="e.g., https://example.com/grind-settings.pdf"
        disabled={loading}
      />
      {#if validationErrors.setting_guide_chart_url}
        <span class="error-text">{validationErrors.setting_guide_chart_url}</span>
      {/if}
      <small class="help-text">
        Link to a grind setting guide or chart (optional)
      </small>
    </div>

    <div class="form-group">
      <label>Grinder Image (optional)</label>
      <ImageUpload
        entityType="grinder"
        entityId={createdGrinderId}
        currentImageUrl={image_path}
        disabled={loading}
        on:upload={handleImageUpload}
        on:delete={handleImageDelete}
        on:error={handleImageError}
      />
      {#if validationErrors.image_path}
        <span class="error-text">{validationErrors.image_path}</span>
      {/if}
    </div>

    <!-- Preview -->
    {#if manufacturer && model}
      <div class="grinder-preview">
        <h5>Preview:</h5>
        <div class="preview-content">
          <strong>{manufacturer} {model}</strong>
          {#if setting_guide_chart_url}
            <div class="preview-link">
              📊 <a href={setting_guide_chart_url} target="_blank" rel="noopener noreferrer">Setting Guide</a>
            </div>
          {/if}
          {#if image_path}
            <div class="preview-image">
              <img src={image_path} alt="{manufacturer} {model}" loading="lazy" />
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <div class="form-actions">
      <IconButton type="button" on:click={handleCancel} ariaLabel="Cancel grinder" title="Cancel" variant="neutral" disabled={loading}>
        <XMark />
      </IconButton>
      <button type="submit" class="btn-primary" disabled={loading}>
        {loading ? 'Creating...' : 'Create Grinder'}
      </button>
    </div>
  </form>
</div>

<style>
  .inline-grinder-creator {
    background: var(--bg-surface-paper-secondary);
    border: 1px solid rgba(123, 94, 58, 0.3);
    border-radius: var(--radius-md);
    padding: 1.5rem;
    margin: 0.5rem 0;
  }

  .creator-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .creator-header h4 {
    margin: 0;
    color: var(--accent-primary);
    font-size: 1.1rem;
  }

  .close-btn {
    background: none;
    border: 1px solid transparent;
    font-size: 1.2rem;
    cursor: pointer;
    color: var(--text-ink-muted);
    padding: 0.25rem;
    line-height: 1;
  }

  .close-btn:hover:not(:disabled) {
    color: var(--semantic-error);
  }

  .close-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .error-banner {
    background: rgba(122, 62, 47, 0.12);
    border: 1px solid rgba(122, 62, 47, 0.25);
    color: var(--semantic-error);
    padding: 0.75rem;
    border-radius: 999px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .creator-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: 600;
    color: var(--text-ink-primary);
    font-size: 0.9rem;
  }

  .form-group input {
    padding: 0.5rem;
    border: 1px solid var(--border-subtle);
    border-radius: 999px;
    font-size: 0.9rem;
    font-family: inherit;
  }

  .form-group input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.2);
  }

  .form-group input:disabled {
    background: var(--bg-surface-paper-secondary);
    cursor: not-allowed;
  }

  .manufacturer-presets {
    margin-top: 0.5rem;
  }

  .presets-label {
    font-size: 0.8rem;
    color: var(--text-ink-muted);
    margin-bottom: 0.5rem;
    display: block;
  }

  .preset-buttons {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .preset-btn {
    background: rgba(123, 94, 58, 0.12);
    color: var(--text-ink-secondary);
    border: 1px solid var(--border-subtle);
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .preset-btn:hover:not(:disabled) {
    background: rgba(123, 94, 58, 0.2);
    border-color: var(--border-strong);
  }

  .preset-btn.selected {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
    border-color: var(--accent-primary);
  }

  .preset-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .help-text {
    color: var(--text-ink-muted);
    font-size: 0.8rem;
    line-height: 1.3;
  }

  .error-text {
    color: var(--semantic-error);
    font-size: 0.8rem;
  }

  .grinder-preview {
    background: var(--bg-surface-paper-secondary);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: 999px;
    padding: 1rem;
  }

  .grinder-preview h5 {
    margin: 0 0 0.5rem 0;
    color: var(--text-ink-secondary);
    font-size: 0.9rem;
  }

  .preview-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .preview-content strong {
    color: var(--text-ink-secondary);
    font-size: 1rem;
  }

  .preview-link {
    font-size: 0.9rem;
  }

  .preview-link a {
    color: var(--accent-primary);
    text-decoration: none;
  }

  .preview-link a:hover {
    text-decoration: underline;
  }

  .preview-image {
    margin-top: 0.5rem;
  }

  .preview-image img {
    max-width: 150px;
    max-height: 100px;
    width: auto;
    height: auto;
    border-radius: 999px;
    border: 1px solid var(--border-subtle);
    object-fit: cover;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }

  @media (max-width: 768px) {
    .preset-buttons {
      justify-content: center;
    }

    .form-actions {
      flex-direction: column;
    }

    .preview-image img {
      max-width: 100%;
    }
  }
</style>
