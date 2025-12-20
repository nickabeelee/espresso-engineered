<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';

  import ImageUpload from './ImageUpload.svelte';

  const dispatch = createEventDispatcher<{
    created: Machine;
    cancel: void;
  }>();

  // Form fields
  let manufacturer = '';
  let model = '';
  let user_manual_link = '';
  let image_path = '';

  // UI state
  let loading = false;
  let error: string | null = null;
  let validationErrors: Record<string, string> = {};
  let createdMachineId = '';

  function validateForm(): boolean {
    validationErrors = {};

    if (!manufacturer.trim()) {
      validationErrors.manufacturer = 'Manufacturer is required';
    }
    if (!model.trim()) {
      validationErrors.model = 'Model is required';
    }
    if (user_manual_link && !isValidUrl(user_manual_link)) {
      validationErrors.user_manual_link = 'Please enter a valid URL';
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

      const machineData: CreateMachineRequest = {
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        user_manual_link: user_manual_link.trim() || undefined,
        image_path: image_path.trim() || undefined
      };

      const response = await apiClient.createMachine(machineData);
      
      if (response.data) {
        createdMachineId = response.data.id;
        dispatch('created', response.data);
      } else {
        throw new Error('Failed to create machine');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create machine';
      console.error('Failed to create machine:', err);
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

  // Common espresso machine manufacturers for quick selection
  const commonManufacturers = [
    'Breville',
    'De\'Longhi',
    'Gaggia',
    'La Marzocco',
    'Rancilio',
    'Rocket Espresso',
    'Sage',
    'Lelit',
    'Profitec',
    'ECM',
    'Bezzera',
    'Quick Mill'
  ];

  function selectManufacturer(name: string) {
    manufacturer = name;
  }
</script>

<div class="inline-machine-creator">
  <div class="creator-header">
    <h4>Create New Machine</h4>
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
        placeholder="e.g., Breville"
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
        placeholder="e.g., Barista Express"
        disabled={loading}
        required
      />
      {#if validationErrors.model}
        <span class="error-text">{validationErrors.model}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="user-manual">User Manual URL</label>
      <input
        id="user-manual"
        type="url"
        bind:value={user_manual_link}
        placeholder="https://example.com/manual.pdf"
        disabled={loading}
      />
      {#if validationErrors.user_manual_link}
        <span class="error-text">{validationErrors.user_manual_link}</span>
      {/if}
      <small class="help-text">
        Link to the user manual or instruction guide (optional)
      </small>
    </div>

    <div class="form-group">
      <label>Machine Image (optional)</label>
      <ImageUpload
        entityType="machine"
        entityId={createdMachineId}
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
      <div class="machine-preview">
        <h5>Preview:</h5>
        <div class="preview-content">
          <strong>{manufacturer} {model}</strong>
          {#if user_manual_link}
            <div class="preview-link">
              📖 <a href={user_manual_link} target="_blank" rel="noopener noreferrer">User Manual</a>
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
        {loading ? 'Creating...' : 'Create Machine'}
      </button>
    </div>
  </form>
</div>

<style>
  .inline-machine-creator {
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

  .machine-preview {
    background: var(--bg-surface-paper-secondary);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: 999px;
    padding: 1rem;
  }

  .machine-preview h5 {
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

  button {
    padding: 0.45rem 1.1rem;
    border: 1px solid transparent;
    border-radius: 999px;
    font-weight: 500;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;
  }

  .btn-cancel {
    background: rgba(123, 94, 58, 0.6);
    color: var(--text-ink-inverted);
  }

  .btn-cancel:hover:not(:disabled) {
    background: rgba(123, 94, 58, 0.75);
  }

  .btn-create {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
  }

  .btn-create:hover:not(:disabled) {
    background: var(--accent-primary-dark);
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