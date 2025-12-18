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
    
    if (brew.ratio_dec) {
      fields.push(`Ratio: 1:${brew.ratio_dec.toFixed(2)}`);
    }
    
    if (brew.flow_rate_mg_per_s) {
      fields.push(`Flow Rate: ${brew.flow_rate_mg_per_s.toFixed(1)} mg/s`);
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
        <a href="/brews" class="back-link">← Back to Brews</a>
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
                  <span>{currentBrew.flow_rate_mg_per_s.toFixed(1)} mg/s</span>
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

          {#if !currentBrew.yield_mg || !currentBrew.rating}
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