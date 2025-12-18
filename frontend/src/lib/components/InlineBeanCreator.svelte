<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';

  import InlineRoasterCreator from './InlineRoasterCreator.svelte';

  export let roasters: Roaster[] = [];

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
  let showRoasterCreator = false;

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
    const newRoaster = event.detail;
    roasters = [newRoaster, ...roasters];
    roaster_id = newRoaster.id;
    showRoasterCreator = false;
  }

  function getRoasterName(id: string): string {
    const roaster = roasters.find(r => r.id === id);
    return roaster?.name || 'Unknown Roaster';
  }
</script>

<div class="inline-bean-creator">
  <div class="creator-header">
    <h4>Create New Bean</h4>
    <button type="button" on:click={handleCancel} class="close-btn" disabled={loading}>
      ✕
    </button>
  </div>

  {#if error}
    <div class="error-banner">{error}</div>
  {/if}

  {#if showRoasterCreator}
    <div class="nested-creator">
      <InlineRoasterCreator 
        on:created={handleRoasterCreated}
        on:cancel={() => showRoasterCreator = false}
      />
    </div>
  {:else}
    <form on:submit|preventDefault={handleSubmit} class="creator-form">
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
        <div class="roaster-input-group">
          <select id="roaster" bind:value={roaster_id} disabled={loading} required>
            <option value="">Select a roaster...</option>
            {#each roasters as roaster}
              <option value={roaster.id}>{roaster.name}</option>
            {/each}
          </select>
          <button 
            type="button" 
            on:click={() => showRoasterCreator = true}
            class="add-roaster-btn"
            disabled={loading}
          >
            + New
          </button>
        </div>
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
          placeholder="Describe the flavor profile..."
          disabled={loading}
        />
      </div>

      <div class="form-actions">
        <button type="button" on:click={handleCancel} class="btn-cancel" disabled={loading}>
          Cancel
        </button>
        <button type="submit" class="btn-create" disabled={loading}>
          {loading ? 'Creating...' : 'Create Bean'}
        </button>
      </div>
    </form>
  {/if}
</div>

<style>
  .inline-bean-creator {
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

  .nested-creator {
    border: 1px solid #e5e5e5;
    border-radius: 0.25rem;
    padding: 0.5rem;
    background: #f8f9fa;
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
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: 600;
    color: #333;
    font-size: 0.9rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    font-family: inherit;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .form-group input:disabled,
  .form-group select:disabled,
  .form-group textarea:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }

  .roaster-input-group {
    display: flex;
    gap: 0.5rem;
  }

  .roaster-input-group select {
    flex: 1;
  }

  .add-roaster-btn {
    background: #28a745;
    color: white;
    border: none;
    padding: 0.5rem 0.75rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .add-roaster-btn:hover:not(:disabled) {
    background: #218838;
  }

  .add-roaster-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  .error-text {
    color: #dc3545;
    font-size: 0.8rem;
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
    .form-row {
      grid-template-columns: 1fr;
    }

    .roaster-input-group {
      flex-direction: column;
    }

    .form-actions {
      flex-direction: column;
    }
  }
</style>