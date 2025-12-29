<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import IconButton from '$lib/components/IconButton.svelte';
  import { XMark } from '$lib/icons';
  import { inlineCreator } from '$lib/ui/components/inline-creator';
  import { toStyleString } from '$lib/ui/style';


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

  const style = toStyleString({
    '--inline-bg': inlineCreator.container.background,
    '--inline-border': inlineCreator.container.borderColor,
    '--inline-border-width': inlineCreator.container.borderWidth,
    '--inline-radius': inlineCreator.container.radius,
    '--inline-padding': inlineCreator.container.padding,
    '--inline-margin': inlineCreator.container.margin,
    '--inline-title-color': inlineCreator.header.titleColor,
    '--inline-title-size': inlineCreator.header.titleSize,
    '--inline-title-margin': inlineCreator.header.marginBottom,
    '--inline-close-color': inlineCreator.closeButton.color,
    '--inline-close-hover': inlineCreator.closeButton.hoverColor,
    '--inline-error-bg': inlineCreator.errorBanner.background,
    '--inline-error-border': inlineCreator.errorBanner.borderColor,
    '--inline-error-color': inlineCreator.errorBanner.textColor,
    '--inline-error-radius': inlineCreator.errorBanner.radius,
    '--inline-error-padding': inlineCreator.errorBanner.padding,
    '--inline-error-size': inlineCreator.errorBanner.fontSize,
    '--inline-form-gap': inlineCreator.form.gap,
    '--inline-row-gap': inlineCreator.form.rowGap,
    '--inline-label-color': inlineCreator.label.color,
    '--inline-label-size': inlineCreator.label.fontSize,
    '--inline-label-weight': inlineCreator.label.fontWeight,
    '--inline-input-padding': inlineCreator.input.padding,
    '--inline-input-border': inlineCreator.input.borderColor,
    '--inline-input-radius': inlineCreator.input.radius,
    '--inline-input-size': inlineCreator.input.fontSize,
    '--inline-input-focus': inlineCreator.input.focusRing,
    '--inline-input-disabled-bg': inlineCreator.input.disabledBackground,
    '--inline-actions-gap': inlineCreator.actions.gap
  });

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

<div class="inline-roaster-creator" style={style}>
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
        placeholder="e.g., https://roaster.com"
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
      <IconButton type="button" on:click={handleCancel} ariaLabel="Cancel roaster" title="Cancel" variant="neutral" disabled={loading}>
        <XMark />
      </IconButton>
      <button type="submit" class="btn-primary" disabled={loading}>
        {loading ? 'Creating...' : 'Create Roaster'}
      </button>
    </div>
  </form>
</div>

<style>
  .inline-roaster-creator {
    background: var(--inline-bg, var(--bg-surface-paper-secondary));
    border: var(--inline-border-width, 1px) solid var(--inline-border, rgba(123, 94, 58, 0.3));
    border-radius: var(--inline-radius, var(--radius-md));
    padding: var(--inline-padding, 1.5rem);
    margin: var(--inline-margin, 0.5rem 0);
  }

  .creator-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--inline-title-margin, 1rem);
  }

  .creator-header h4 {
    margin: 0;
    color: var(--inline-title-color, var(--accent-primary));
    font-size: var(--inline-title-size, 1.1rem);
  }

  .close-btn {
    background: none;
    border: 1px solid transparent;
    font-size: 1.2rem;
    cursor: pointer;
    color: var(--inline-close-color, var(--text-ink-muted));
    padding: 0.25rem;
    line-height: 1;
  }

  .close-btn:hover:not(:disabled) {
    color: var(--inline-close-hover, var(--semantic-error));
  }

  .close-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .error-banner {
    background: var(--inline-error-bg, rgba(122, 62, 47, 0.12));
    border: 1px solid var(--inline-error-border, rgba(122, 62, 47, 0.25));
    color: var(--inline-error-color, var(--semantic-error));
    padding: var(--inline-error-padding, 0.75rem);
    border-radius: var(--inline-error-radius, 999px);
    margin-bottom: 1rem;
    font-size: var(--inline-error-size, 0.9rem);
  }

  .creator-form {
    display: flex;
    flex-direction: column;
    gap: var(--inline-form-gap, 1rem);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: var(--inline-label-weight, 600);
    color: var(--inline-label-color, var(--text-ink-primary));
    font-size: var(--inline-label-size, 0.9rem);
  }

  .form-group input {
    padding: var(--inline-input-padding, 0.5rem);
    border: 1px solid var(--inline-input-border, var(--border-subtle));
    border-radius: var(--inline-input-radius, 999px);
    font-size: var(--inline-input-size, 0.9rem);
    font-family: inherit;
  }

  .form-group input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: var(--inline-input-focus, 0 0 0 2px rgba(176, 138, 90, 0.2));
  }

  .form-group input:disabled {
    background: var(--inline-input-disabled-bg, var(--bg-surface-paper-secondary));
    cursor: not-allowed;
  }

  .roaster-presets {
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

  .roaster-preview {
    background: var(--bg-surface-paper-secondary);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: 999px;
    padding: 1rem;
  }

  .roaster-preview h5 {
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
  }
</style>
