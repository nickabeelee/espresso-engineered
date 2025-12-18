<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import type { Grinder, CreateGrinderRequest } from '@shared/types';

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
        placeholder="https://example.com/grind-settings.pdf"
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
      <label for="image">Image URL</label>
      <input
        id="image"
        type="url"
        bind:value={image_path}
        placeholder="https://example.com/grinder-image.jpg"
        disabled={loading}
      />
      {#if validationErrors.image_path}
        <span class="error-text">{validationErrors.image_path}</span>
      {/if}
      <small class="help-text">
        Link to an image of the grinder (optional)
      </small>
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
      <button type="button" on:click={handleCancel} class="btn-cancel" disabled={loading}>
        Cancel
      </button>
      <button type="submit" class="btn-create" disabled={loading}>
        {loading ? 'Creating...' : 'Create Grinder'}
      </button>
    </div>
  </form>
</div>

<style>
  .inline-grinder-creator {
    background: white;
    border: 2px solid #007bff;
    border-radius: 0.5rem;
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
    color: #007bff;
    font-size: 1.1rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #666;
    padding: 0.25rem;
    line-height: 1;
  }

  .close-btn:hover:not(:disabled) {
    color: #dc3545;
  }

  .close-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .error-banner {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
    padding: 0.75rem;
    border-radius: 0.25rem;
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
    color: #333;
    font-size: 0.9rem;
  }

  .form-group input {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    font-family: inherit;
  }

  .form-group input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .form-group input:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }

  .manufacturer-presets {
    margin-top: 0.5rem;
  }

  .presets-label {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 0.5rem;
    display: block;
  }

  .preset-buttons {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .preset-btn {
    background: #e9ecef;
    color: #495057;
    border: 1px solid #ced4da;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .preset-btn:hover:not(:disabled) {
    background: #dee2e6;
    border-color: #adb5bd;
  }

  .preset-btn.selected {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  .preset-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .help-text {
    color: #666;
    font-size: 0.8rem;
    line-height: 1.3;
  }

  .error-text {
    color: #dc3545;
    font-size: 0.8rem;
  }

  .grinder-preview {
    background: #e7f3ff;
    border: 1px solid #b3d9ff;
    border-radius: 0.25rem;
    padding: 1rem;
  }

  .grinder-preview h5 {
    margin: 0 0 0.5rem 0;
    color: #004085;
    font-size: 0.9rem;
  }

  .preview-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .preview-content strong {
    color: #004085;
    font-size: 1rem;
  }

  .preview-link {
    font-size: 0.9rem;
  }

  .preview-link a {
    color: #007bff;
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
    border-radius: 0.25rem;
    border: 1px solid #ddd;
    object-fit: cover;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    font-weight: 500;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;
  }

  .btn-cancel {
    background: #6c757d;
    color: white;
  }

  .btn-cancel:hover:not(:disabled) {
    background: #545b62;
  }

  .btn-create {
    background: #007bff;
    color: white;
  }

  .btn-create:hover:not(:disabled) {
    background: #0056b3;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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