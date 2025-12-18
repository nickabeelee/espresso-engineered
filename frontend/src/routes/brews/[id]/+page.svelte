<script lang="ts">
  // Individual brew view/edit page
  // This will be implemented in task 9 (Implement brew creation and editing workflows)
  
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import type { Brew } from '@shared/types';
  
  let brew: Brew | null = null;
  let loading = true;
  let error: string | null = null;
  let editing = false;
  let canEdit = false;

  $: brewId = $page.params.id;

  onMount(async () => {
    if (brewId) {
      await loadBrew(brewId);
    }
  });

  async function loadBrew(id: string) {
    loading = true;
    error = null;
    
    try {
      // Placeholder for brew loading logic
      // Will be implemented in task 9
      // For now, create a mock brew to satisfy TypeScript
      brew = {
        id: id,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString(),
        barista_id: 'mock-barista',
        machine_id: 'mock-machine',
        grinder_id: 'mock-grinder',
        bag_id: 'mock-bag',
        name: 'Mock Brew',
        dose_mg: 18000,
        yield_mg: 36000,
        brew_time_ms: 30000,
        grind_setting: '2.5',
        flow_rate_mg_per_s: 1200,
        ratio_dec: 2.0,
        rating: 8,
        tasting_notes: 'Mock tasting notes',
        reflections: 'Mock reflections'
      } as Brew;
      canEdit = true; // Mock: assume user can edit
      loading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load brew';
      loading = false;
    }
  }

  function toggleEdit() {
    editing = !editing;
  }

  async function handleSave(event: Event) {
    event.preventDefault();
    // Placeholder for save logic
    // Will be implemented in task 9
  }

  async function handleDelete() {
    if (!brew || !confirm('Are you sure you want to delete this brew?')) {
      return;
    }
    
    try {
      // Placeholder for delete logic
      // Will be implemented in task 9
      goto('/brews');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete brew';
    }
  }
</script>

<svelte:head>
  <title>{brew?.name || 'Brew'} - Espresso Engineered</title>
  <meta name="description" content="View and edit espresso brew details" />
</svelte:head>

<AuthGuard>
  <div class="brew-detail-page">
    <header>
      <div>
        <a href="/brews" class="back-link">← Back to Brews</a>
        <h1>{brew?.name || 'Untitled Brew'}</h1>
      </div>
      
      {#if canEdit && brew}
        <div class="actions">
          <button on:click={toggleEdit} class="btn-secondary">
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button on:click={handleDelete} class="btn-danger">
            Delete
          </button>
        </div>
      {/if}
    </header>

  {#if loading}
    <div class="loading">Loading brew...</div>
  {:else if error}
    <div class="error">Error: {error}</div>
  {:else if brew}
    <!-- TypeScript workaround: create local variable with proper type -->
    {@const currentBrew = brew}
    <div class="brew-content">
      {#if editing}
        <form on:submit={handleSave}>
          <div class="form-placeholder">
            <p>Brew edit form will be implemented in task 9</p>
            <p>This will use the same BrewForm component as the new brew page.</p>
          </div>
          
          <div class="form-actions">
            <button type="button" on:click={toggleEdit} class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      {:else}
        <div class="brew-details">
          <div class="detail-section">
            <h3>Basic Information</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Created:</label>
                <span>{new Date(currentBrew.created_at).toLocaleString()}</span>
              </div>
              <div class="detail-item">
                <label>Modified:</label>
                <span>{new Date(currentBrew.modified_at).toLocaleString()}</span>
              </div>
              <div class="detail-item">
                <label>Dose:</label>
                <span>{currentBrew.dose_mg}mg</span>
              </div>
              {#if currentBrew.yield_mg}
                <div class="detail-item">
                  <label>Yield:</label>
                  <span>{currentBrew.yield_mg}mg</span>
                </div>
              {/if}
              {#if currentBrew.brew_time_ms}
                <div class="detail-item">
                  <label>Brew Time:</label>
                  <span>{(currentBrew.brew_time_ms / 1000).toFixed(1)}s</span>
                </div>
              {/if}
              {#if currentBrew.ratio_dec}
                <div class="detail-item">
                  <label>Ratio:</label>
                  <span>1:{currentBrew.ratio_dec.toFixed(2)}</span>
                </div>
              {/if}
              {#if currentBrew.flow_rate_mg_per_s}
                <div class="detail-item">
                  <label>Flow Rate:</label>
                  <span>{currentBrew.flow_rate_mg_per_s.toFixed(1)}mg/s</span>
                </div>
              {/if}
              {#if currentBrew.rating}
                <div class="detail-item">
                  <label>Rating:</label>
                  <span>{currentBrew.rating}/10</span>
                </div>
              {/if}
            </div>
          </div>

          {#if currentBrew.tasting_notes}
            <div class="detail-section">
              <h3>Tasting Notes</h3>
              <p>{currentBrew.tasting_notes}</p>
            </div>
          {/if}

          {#if currentBrew.reflections}
            <div class="detail-section">
              <h3>Reflections</h3>
              <p>{currentBrew.reflections}</p>
            </div>
          {/if}

          {#if !currentBrew.yield_mg || !currentBrew.rating}
            <div class="incomplete-notice">
              <p>This brew is incomplete. <button on:click={toggleEdit} class="link-button">Complete it now</button>.</p>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <div class="not-found">Brew not found</div>
  {/if}
  </div>
</AuthGuard>

<style>
  .brew-detail-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
  }

  .back-link {
    color: #007bff;
    text-decoration: none;
    font-size: 0.9rem;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  h1 {
    color: #333;
    font-size: 2rem;
    margin: 0.5rem 0 0 0;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    font-weight: 500;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover {
    background: #0056b3;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background: #545b62;
  }

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover {
    background: #c82333;
  }

  .link-button {
    background: none;
    border: none;
    color: #007bff;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    font-size: inherit;
  }

  .loading, .error, .not-found {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .error {
    color: #dc3545;
  }

  .brew-content {
    background: white;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    padding: 2rem;
  }

  .form-placeholder {
    padding: 2rem;
    text-align: center;
    color: #666;
    background: #f8f9fa;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  .detail-section {
    margin-bottom: 2rem;
  }

  .detail-section:last-child {
    margin-bottom: 0;
  }

  .detail-section h3 {
    color: #333;
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-item label {
    font-weight: 600;
    color: #555;
    font-size: 0.9rem;
  }

  .detail-item span {
    color: #333;
  }

  .detail-section p {
    color: #333;
    line-height: 1.6;
    margin: 0;
  }

  .incomplete-notice {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-top: 2rem;
    color: #856404;
  }

  .incomplete-notice p {
    margin: 0;
  }
</style>