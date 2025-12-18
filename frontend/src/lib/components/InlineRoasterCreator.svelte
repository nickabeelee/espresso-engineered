<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import type { Roaster, CreateRoasterRequest } from '@shared/types';

  const dispatch = createEventDispatcher<{
    created: Roaster;
    cancel: void;
  }>();

  // Form fields
  let name = '';
  let website_url = '';

  // UI state
  let loading = false;
  let error: string | null = null;
  let validationErrors: Record<string, string> = {};

  function validateForm(): boolean {
    validationErrors = {};

    if (!name.trim()) {
      validationErrors.name = 'Roaster name is required';
    }
    if (website_url && !isValidUrl(website_url)) {
      validationErrors.website_url = 'Please enter a valid URL';
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

      const roasterData: CreateRoasterRequest = {
        name: name.trim(),
        website_url: website_url.trim() || undefined
      };

      const response = await apiClient.createRoaster(roasterData);
      
      if (response.data) {
        dispatch('created', response.data);
      } else {
        throw new Error('Failed to create roaster');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create roaster';
      console.error('Failed to create roaster:', err);
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }

  // Common roaster names for quick selection
  const commonRoasters = [
    'Blue Bottle Coffee',
    'Stumptown Coffee',
    'Intelligentsia Coffee',
    'Counter Culture Coffee',
    'Ritual Coffee',
    'Verve Coffee',
    'La Colombe',
    'Onyx Coffee Lab',
    'George Howell Coffee',
    'Heart Coffee',
    'Coava Coffee',
    'Klatch Coffee'
  ];

  function selectRoaster(roasterName: string) {
    name = roasterName;
  }

  // Auto-suggest website URL based on roaster name
  function suggestWebsite() {
    if (!name.trim()) return;
    
    const cleanName = name.toLowerCase()
      .replace(/coffee/g, '')
      .replace(/roasters?/g, '')
      .replace(/\s+/g, '')
      .trim();
    
    if (cleanName && !website_url) {
      website_url = `https://www.${cleanName}.com`;
    }
  }
</script>

<div class="inline-roaster-creator">
  <div class="creator-header">
    <h4>Create New Roaster</h4>
    <button type="button" on:click={handleCancel} class="close-btn" disabled={loading}>
      ✕
    </button>
  </div>

  {#if error}
    <div class="error-banner">{error}</div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="creator-form">
    <div class="form-group">
      <label for="roaster-name">Roaster Name *</label>
      <input
        id="roaster-name"
        type="text"
        bind:value={name}
        on:blur={suggestWebsite}
        placeholder="e.g., Blue Bottle Coffee"
        disabled={loading}
        required
      />
      {#if validationErrors.name}
        <span class="error-text">{validationErrors.name}</span>
      {/if}
      
      <!-- Quick roaster selection -->
      <div class="roaster-presets">
        <span class="presets-label">Popular:</span>
        <div class="preset-buttons">
          {#each commonRoasters as roaster}
            <button 
              type="button" 
              on:click={() => selectRoaster(roaster)}
              class="preset-btn"
              class:selected={name === roaster}
              disabled={loading}
            >
              {roaster}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <div class="form-group">
      <label for="website">Website URL</label>
      <input
        id="website"
        type="url"
        bind:value={website_url}
        placeholder="https://www.roaster.com"
        disabled={loading}
      />
      {#if validationErrors.website_url}
        <span class="error-text">{validationErrors.website_url}</span>
      {/if}
      <small class="help-text">
        The roaster's official website (optional)
      </small>
    </div>

    <!-- Preview -->
    {#if name}
      <div class="roaster-preview">
        <h5>Preview:</h5>
        <div class="preview-content">
          <strong>{name}</strong>
          {#if website_url}
            <div class="preview-link">
              🌐 <a href={website_url} target="_blank" rel="noopener noreferrer">Visit Website</a>
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
        {loading ? 'Creating...' : 'Create Roaster'}
      </button>
    </div>
  </form>
</div>

<style>
  .inline-roaster-creator {
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

  .roaster-presets {
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

  .roaster-preview {
    background: #e7f3ff;
    border: 1px solid #b3d9ff;
    border-radius: 0.25rem;
    padding: 1rem;
  }

  .roaster-preview h5 {
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
  }
</style>