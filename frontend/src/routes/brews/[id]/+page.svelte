<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AuthGuard from '$lib/components/AuthGuard.svelte';
  import BrewForm from '$lib/components/BrewForm.svelte';
  import { apiClient } from '$lib/api-client';
  import { barista } from '$lib/auth';

  
  let brew = null;
  let loading = true;
  let error = null;
  let editing = false;
  let canEdit = false;
  let deleting = false;

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
      const response = await apiClient.getBrew(id);
      if (response.data) {
        brew = response.data;
        
        // Check if current user can edit this brew
        const currentBarista = $barista;
        canEdit = currentBarista?.id === brew.barista_id;
      } else {
        throw new Error('Brew not found');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load brew';
    } finally {
      loading = false;
    }
  }

  function toggleEdit() {
    editing = !editing;
    error = null; // Clear any previous errors when toggling edit mode
  }

  async function handleSave(event: CustomEvent<CreateBrewRequest>) {
    if (!brew) return;
    
    const brewData = event.detail;
    loading = true;
    error = null;

    try {
      const response = await apiClient.updateBrew(brew.id, brewData);
      if (response.data) {
        brew = response.data;
        editing = false;
      } else {
        throw new Error('Failed to update brew');
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save changes';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    editing = false;
    error = null;
  }

  async function handleDelete() {
    if (!brew || deleting) return;
    
    const confirmMessage = `Are you sure you want to delete "${brew.name || 'this brew'}"? This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }
    
    deleting = true;
    error = null;
    
    try {
      await apiClient.deleteBrew(brew.id);
      goto('/brews');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete brew';
      deleting = false;
    }
  }

  // Helper function to format calculated fields
  function formatCalculatedFields(brew: Brew) {
    const fields = [];
    
    if (brew.ratio) {
      fields.push(`Ratio: 1:${brew.ratio.toFixed(2)}`);
    }
    
    if (brew.flow_rate_g_per_s) {
      fields.push(`Flow Rate: ${brew.flow_rate_g_per_s.toFixed(1)} g/s`);
    }
    
    return fields;
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
        <a href="/brews" class="back-link">Back to Brews</a>
        <h1>{brew?.name || 'Untitled Brew'}</h1>
      </div>
      
      {#if canEdit && brew}
        <div class="actions">
          <button on:click={toggleEdit} class="btn-secondary" disabled={loading}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button on:click={handleDelete} class="btn-danger" disabled={loading || deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
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
        <BrewForm 
          {brew}
          on:save={handleSave}
          on:cancel={handleCancel}
        />
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
                <span>{currentBrew.dose_g}g</span>
              </div>
              {#if currentBrew.yield_g}
                <div class="detail-item">
                  <label>Yield:</label>
                  <span>{currentBrew.yield_g}g</span>
                </div>
              {/if}
              {#if currentBrew.brew_time_s}
                <div class="detail-item">
                  <label>Brew Time:</label>
                  <span>{currentBrew.brew_time_s.toFixed(1)}s</span>
                </div>
              {/if}
              {#if currentBrew.ratio}
                <div class="detail-item">
                  <label>Ratio:</label>
                  <span>1:{currentBrew.ratio.toFixed(2)}</span>
                </div>
              {/if}
              {#if currentBrew.flow_rate_g_per_s}
                <div class="detail-item">
                  <label>Flow Rate:</label>
                  <span>{currentBrew.flow_rate_g_per_s.toFixed(1)} g/s</span>
                </div>
              {/if}
              {#if currentBrew.grind_setting}
                <div class="detail-item">
                  <label>Grind Setting:</label>
                  <span>{currentBrew.grind_setting}</span>
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

          {#if !currentBrew.yield_g || !currentBrew.rating}
            <div class="incomplete-notice">
              <p>This brew is incomplete. {#if canEdit}<button on:click={toggleEdit} class="link-button">Complete it now</button>.{/if}</p>
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
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
  }

  .back-link {
    color: var(--accent-primary);
    text-decoration: none;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .back-link:hover {
    color: var(--accent-primary-dark);
  }

  h1 {
    color: var(--text-ink-primary);
    font-size: 2rem;
    margin: 0.5rem 0 0 0;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: 1px solid transparent;
    border-radius: 999px;
    font-weight: 500;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .btn-primary {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
  }

  .btn-primary:hover {
    background: var(--accent-primary-dark);
  }

  .btn-secondary {
    background: transparent;
    color: var(--text-ink-secondary);
    border-color: var(--border-strong);
  }

  .btn-secondary:hover {
    background: rgba(123, 94, 58, 0.12);
  }

  .btn-danger {
    background: rgba(122, 62, 47, 0.15);
    color: var(--semantic-error);
    border-color: rgba(122, 62, 47, 0.35);
  }

  .btn-danger:hover {
    background: rgba(122, 62, 47, 0.25);
  }

  .link-button {
    background: none;
    border: none;
    color: var(--accent-primary);
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    font-size: inherit;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  button:disabled:hover {
    background: inherit;
  }

  .loading, .error, .not-found {
    text-align: center;
    padding: 2rem;
    color: var(--text-ink-muted);
  }

  .error {
    color: var(--semantic-error);
  }

  .brew-content {
    background: var(--bg-surface-paper-secondary);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 2rem;
  }



  .detail-section {
    margin-bottom: 2rem;
  }

  .detail-section:last-child {
    margin-bottom: 0;
  }

  .detail-section h3 {
    color: var(--text-ink-secondary);
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
    color: var(--text-ink-muted);
    font-size: 0.9rem;
  }

  .detail-item span {
    color: var(--text-ink-primary);
  }

  .detail-section p {
    color: var(--text-ink-secondary);
    line-height: 1.6;
    margin: 0;
  }

  .incomplete-notice {
    background: rgba(138, 106, 62, 0.15);
    border: 1px solid rgba(138, 106, 62, 0.25);
    border-radius: var(--radius-md);
    padding: 1rem;
    margin-top: 2rem;
    color: var(--semantic-warning);
  }

  .incomplete-notice p {
    margin: 0;
  }
</style>
