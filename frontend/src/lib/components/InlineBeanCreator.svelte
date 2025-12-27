<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import IconButton from '$lib/components/IconButton.svelte';
  import RoasterSelector from '$lib/components/RoasterSelector.svelte';
  import { XMark, CheckCircle } from '$lib/icons';
  import type { Bean, Roaster, RoastLevel, CreateBeanRequest } from '@shared/types';

  const dispatch = createEventDispatcher<{
    created: Bean;
    cancel: void;
  }>();

  // Form fields
  let name = '';
  let roaster_id = '';
  let roast_level: RoastLevel = 'Medium';
  let country_of_origin = '';
  let tasting_notes = '';

  // UI state
  let loading = false;
  let error: string | null = null;
  let validationErrors: Record<string, string> = {};

  const roastLevels: RoastLevel[] = ['Light', 'Medium Light', 'Medium', 'Medium Dark', 'Dark'];

  function validateForm(): boolean {
    validationErrors = {};

    if (!name.trim()) {
      validationErrors.name = 'Bean name is required';
    }
    if (!roaster_id) {
      validationErrors.roaster_id = 'Roaster is required';
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
        roast_level,
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

<div class="inline-bean-creator">
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
        disabled={loading || !name.trim() || !roaster_id}
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
        <label for="roast-level">Roast Level *</label>
        <select id="roast-level" bind:value={roast_level} disabled={loading} required>
          {#each roastLevels as level}
            <option value={level}>{level}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="form-group">
      <label for="roaster">Roaster *</label>
      <RoasterSelector
        bind:value={roaster_id}
        disabled={loading}
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
    background: var(--bg-surface-paper-secondary);
    border: 2px solid var(--accent-primary);
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
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .edit-actions {
    display: flex;
    gap: 0.5rem;
  }

  .error-banner {
    background: rgba(122, 62, 47, 0.12);
    border: 1px solid rgba(122, 62, 47, 0.25);
    color: var(--semantic-error);
    padding: 0.75rem;
    border-radius: var(--radius-md);
    margin-bottom: 1rem;
    font-size: 0.9rem;
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
    gap: 1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }

  .form-group label {
    font-family: 'IBM Plex Sans', sans-serif;
    font-weight: 600;
    color: var(--text-ink-secondary);
    font-size: 14px;
    display: block;
    margin-bottom: 0.25rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: 16px;
    font-family: 'IBM Plex Sans', sans-serif;
    color: var(--text-ink-primary);
    background: var(--bg-surface-paper);
    transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.2);
  }

  .form-group input:disabled,
  .form-group select:disabled,
  .form-group textarea:disabled {
    background: var(--bg-surface-paper-secondary);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .form-group input::placeholder,
  .form-group textarea::placeholder {
    color: var(--text-ink-muted);
    font-family: 'IBM Plex Sans', sans-serif;
  }

  .form-group textarea {
    resize: vertical;
    min-height: 60px;
    font-family: 'IBM Plex Sans', sans-serif;
  }

  .error-text {
    color: var(--semantic-error);
    font-size: 14px;
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
