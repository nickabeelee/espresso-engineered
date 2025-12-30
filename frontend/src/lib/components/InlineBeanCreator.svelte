<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import IconButton from '$lib/components/IconButton.svelte';
  import RoasterSelector from '$lib/components/RoasterSelector.svelte';
  import RoastLevel from '$lib/components/RoastLevel.svelte';
  import { inlineCreator } from '$lib/ui/components/inline-creator';
  import { toStyleString } from '$lib/ui/style';
  import { XMark, CheckCircle } from '$lib/icons';
  import type { Bean, Roaster, RoastLevel as RoastLevelType, CreateBeanRequest } from '@shared/types';

  const dispatch = createEventDispatcher<{
    created: Bean;
    cancel: void;
  }>();

  // Form fields
  let name = '';
  let roaster_id = '';
  let roast_level: RoastLevelType | null = null;
  let country_of_origin = '';
  let tasting_notes = '';

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
    '--inline-input-bg': inlineCreator.input.background,
    '--inline-input-radius': inlineCreator.input.radius,
    '--inline-input-size': inlineCreator.input.fontSize,
    '--inline-input-focus': inlineCreator.input.focusRing,
    '--inline-input-disabled-bg': inlineCreator.input.disabledBackground,
    '--inline-actions-gap': inlineCreator.actions.gap
  });

  function validateForm(): boolean {
    validationErrors = {};

    if (!name.trim()) {
      validationErrors.name = 'Bean name is required';
    }
    if (!roaster_id) {
      validationErrors.roaster_id = 'Roaster is required';
    }
    if (!roast_level) {
      validationErrors.roast_level = 'Roast level is required';
    }

    return Object.keys(validationErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      error = 'Please fix validation errors';
      return;
    }

    try {
      loading = true;
      error = null;

      const beanData: CreateBeanRequest = {
        name: name.trim(),
        roaster_id,
        roast_level: roast_level as RoastLevelType,
        country_of_origin: country_of_origin.trim() || undefined,
        tasting_notes: tasting_notes.trim() || undefined
      };

      const response = await apiClient.createBean(beanData);
      
      if (response.data) {
        dispatch('created', response.data);
      } else {
        throw new Error('Failed to create bean');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create bean';
      console.error('Failed to create bean:', err);
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function handleRoasterCreated(event: CustomEvent<Roaster>) {
    // RoasterSelector handles updating its own roaster list and selection
    // No additional action needed here
  }
</script>

<div class="inline-bean-creator" style={style}>
  <div class="creator-header">
    <h4>Create New Bean</h4>
    <div class="edit-actions">
      <IconButton 
        type="button" 
        on:click={handleCancel} 
        ariaLabel="Cancel bean" 
        title="Cancel" 
        variant="neutral" 
        disabled={loading}
      >
        <XMark />
      </IconButton>
      <IconButton 
        type="submit" 
        form="bean-create-form"
        ariaLabel="Create bean" 
        title="Create Bean" 
        variant="success" 
        disabled={loading || !name.trim() || !roaster_id || !roast_level}
      >
        <CheckCircle />
      </IconButton>
    </div>
  </div>

  {#if error}
    <div class="error-banner">{error}</div>
  {/if}

  <form id="bean-create-form" on:submit|preventDefault={handleSubmit} class="creator-form">
    <div class="form-row">
      <div class="form-group">
        <label for="bean-name">Bean Name *</label>
        <input
          id="bean-name"
          type="text"
          bind:value={name}
          placeholder="e.g., Ethiopian Yirgacheffe"
          disabled={loading}
          required
        />
        {#if validationErrors.name}
          <span class="error-text">{validationErrors.name}</span>
        {/if}
      </div>

      <div class="form-group">
        <label>Roast Level *</label>
        <div class="roast-level-picker" aria-disabled={loading}>
          <RoastLevel
            bind:value={roast_level}
            editable={!loading}
            size="medium"
            showLabel={true}
          />
        </div>
        {#if validationErrors.roast_level}
          <span class="error-text">{validationErrors.roast_level}</span>
        {/if}
      </div>
    </div>

    <div class="form-group">
      <label for="roaster">Roaster *</label>
      <RoasterSelector
        bind:value={roaster_id}
        disabled={loading}
        showDetails={false}
        on:roasterCreated={handleRoasterCreated}
      />
      {#if validationErrors.roaster_id}
        <span class="error-text">{validationErrors.roaster_id}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="country">Country of Origin</label>
      <input
        id="country"
        type="text"
        bind:value={country_of_origin}
        placeholder="e.g., Ethiopia"
        disabled={loading}
      />
    </div>

    <div class="form-group">
      <label for="tasting-notes">Tasting Notes</label>
      <textarea
        id="tasting-notes"
        bind:value={tasting_notes}
        rows="2"
        placeholder="e.g., stone fruit and florals"
        disabled={loading}
      />
    </div>
  </form>
</div>

<style>
  .inline-bean-creator {
    background: var(--inline-bg, var(--bg-surface-paper-secondary));
    border: var(--inline-border-width, 2px) solid var(--inline-border, var(--accent-primary));
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
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: var(--inline-title-size, 1.1rem);
    font-weight: 600;
  }

  .edit-actions {
    display: flex;
    gap: 0.5rem;
  }

  .error-banner {
    background: var(--inline-error-bg, rgba(122, 62, 47, 0.12));
    border: 1px solid var(--inline-error-border, rgba(122, 62, 47, 0.25));
    color: var(--inline-error-color, var(--semantic-error));
    padding: var(--inline-error-padding, 0.75rem);
    border-radius: var(--inline-error-radius, var(--radius-md));
    margin-bottom: 1rem;
    font-size: var(--inline-error-size, 0.9rem);
    font-family: 'IBM Plex Sans', sans-serif;
  }

  .nested-creator {
    border: 1px solid var(--border-subtle);
    border-radius: 999px;
    padding: 0.5rem;
    background: var(--bg-surface-paper-secondary);
  }

  .creator-form {
    display: flex;
    flex-direction: column;
    gap: var(--inline-form-gap, 1rem);
  }

  .form-row {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--inline-row-gap, 1rem);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }

  .form-group label {
    font-family: 'IBM Plex Sans', sans-serif;
    font-weight: var(--inline-label-weight, 600);
    color: var(--inline-label-color, var(--text-ink-secondary));
    font-size: var(--inline-label-size, 14px);
    display: block;
    margin-bottom: 0.25rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: var(--inline-input-padding, 0.5rem 0.75rem);
    border: 1px solid var(--inline-input-border, var(--border-subtle));
    border-radius: var(--inline-input-radius, var(--radius-sm));
    font-size: var(--inline-input-size, 16px);
    font-family: 'IBM Plex Sans', sans-serif;
    color: var(--text-ink-primary);
    background: var(--inline-input-bg, var(--bg-surface-paper));
    transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
  }

  .roast-level-picker {
    display: flex;
    align-items: center;
    min-height: 2.5rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    background: var(--inline-input-bg, var(--bg-surface-paper));
  }

  .roast-level-picker:focus-within {
    border-color: var(--accent-primary);
    box-shadow: var(--inline-input-focus, 0 0 0 2px rgba(176, 138, 90, 0.2));
  }

  .roast-level-picker[aria-disabled='true'] {
    background: var(--bg-surface-paper-secondary);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: var(--inline-input-focus, 0 0 0 2px rgba(176, 138, 90, 0.2));
  }

  .form-group input:disabled,
  .form-group select:disabled,
  .form-group textarea:disabled {
    background: var(--inline-input-disabled-bg, var(--bg-surface-paper-secondary));
    cursor: not-allowed;
    opacity: 0.6;
  }

  .form-group input::placeholder,
  .form-group textarea::placeholder {
    color: var(--text-ink-placeholder);
    font-family: 'IBM Plex Sans', sans-serif;
  }

  .form-group textarea {
    resize: vertical;
    min-height: 60px;
    font-family: 'IBM Plex Sans', sans-serif;
  }

  .error-text {
    color: var(--inline-error-color, var(--semantic-error));
    font-size: var(--inline-label-size, 14px);
    font-family: 'IBM Plex Sans', sans-serif;
    margin-top: 0.125rem;
    display: block;
  }

  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }
</style>
