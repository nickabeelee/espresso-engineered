<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { selector } from '$lib/ui/components/selector';
  import { toStyleString } from '$lib/ui/style';

  import InlineBeanCreator from './InlineBeanCreator.svelte';

  export let value: string = '';
  export let disabled = false;

  let beans: Bean[] = [];
  let roasters: Roaster[] = [];
  let loading = true;
  let error: string | null = null;
  let showCreateForm = false;

  // Search and filter
  let searchTerm = '';
  let selectedRoaster = '';

  const style = toStyleString({
    '--selector-trigger-padding': selector.trigger.padding,
    '--selector-trigger-border': selector.trigger.borderColor,
    '--selector-trigger-bg': selector.trigger.background,
    '--selector-trigger-color': selector.trigger.textColor,
    '--selector-trigger-radius': selector.trigger.radius,
    '--selector-trigger-font-size': selector.trigger.fontSize,
    '--selector-detail-bg': selector.detailCard.background,
    '--selector-detail-border': selector.detailCard.borderColor,
    '--selector-detail-radius': selector.detailCard.radius,
    '--selector-detail-padding': selector.detailCard.padding,
    '--selector-detail-title-size': selector.detailTitle.fontSize,
    '--selector-detail-title-color': selector.detailTitle.textColor,
    '--selector-pill-radius': selector.pill.radius,
    '--selector-pill-size': selector.pill.fontSize,
    '--selector-pill-weight': selector.pill.fontWeight
  });

  onMount(() => {
    loadData();
  });

  async function loadData() {
    try {
      loading = true;
      error = null;

      const [beansResponse, roastersResponse] = await Promise.all([
        apiClient.getBeans(),
        apiClient.getRoasters()
      ]);

      beans = beansResponse.data;
      roasters = roastersResponse.data;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load beans';
      console.error('Failed to load beans:', err);
    } finally {
      loading = false;
    }
  }

  function handleBeanCreated(event: CustomEvent<Bean>) {
    const newBean = event.detail;
    beans = [newBean, ...beans];
    value = newBean.id;
    showCreateForm = false;
  }

  function getRoasterName(roasterId: string): string {
    const roaster = roasters.find(r => r.id === roasterId);
    return roaster?.name || 'Unknown Roaster';
  }

  function formatBeanDisplay(bean: Bean): string {
    const roasterName = getRoasterName(bean.roaster_id);
    return `${bean.name} - ${roasterName} (${bean.roast_level})`;
  }

  // Filtered beans based on search and roaster selection
  $: filteredBeans = beans.filter(bean => {
    const matchesSearch = !searchTerm || 
      bean.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRoasterName(bean.roaster_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      bean.roast_level.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bean.country_of_origin && bean.country_of_origin.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRoaster = !selectedRoaster || bean.roaster_id === selectedRoaster;
    
    return matchesSearch && matchesRoaster;
  });
</script>

<div class="bean-selector" style={style}>
  {#if loading}
    <div class="loading">Loading beans...</div>
  {:else if error}
    <div class="error">
      Error: {error}
      <button on:click={loadData} class="retry-btn">Retry</button>
    </div>
  {:else if showCreateForm}
    <InlineBeanCreator 
      on:created={handleBeanCreated}
      on:cancel={() => showCreateForm = false}
    />
  {:else}
    <div class="selector-controls">
      <!-- Search -->
      <div class="search-group">
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="e.g., Ethiopia Yirgacheffe"
          class="search-input"
          {disabled}
        />
      </div>

      <!-- Roaster Filter -->
      <div class="filter-group">
        <select bind:value={selectedRoaster} class="roaster-filter" {disabled}>
          <option value="">All Roasters</option>
          {#each roasters as roaster}
            <option value={roaster.id}>{roaster.name}</option>
          {/each}
        </select>
      </div>

      <!-- Create New Button -->
      <button 
        type="button"
        on:click={() => showCreateForm = true}
        class="create-btn"
        {disabled}
      >
        + New Bean
      </button>
    </div>

    <!-- Bean Selection -->
    <div class="bean-list">
      {#if filteredBeans.length === 0}
        <div class="empty-state">
          {#if searchTerm || selectedRoaster}
            <p>No beans match your filters.</p>
            <button 
              type="button"
              on:click={() => { searchTerm = ''; selectedRoaster = ''; }}
              class="clear-filters-btn"
            >
              Clear Filters
            </button>
          {:else}
            <p>No beans available.</p>
            <button 
              type="button"
              on:click={() => showCreateForm = true}
              class="create-first-btn"
              {disabled}
            >
              Create Your First Bean
            </button>
          {/if}
        </div>
      {:else}
        <select bind:value={value} class="bean-select" {disabled} required>
          <option value="">Select a bean...</option>
          {#each filteredBeans as bean}
            <option value={bean.id}>
              {formatBeanDisplay(bean)}
            </option>
          {/each}
        </select>

        <!-- Selected Bean Details -->
        {#if value}
          {@const selectedBean = beans.find(b => b.id === value)}
          {#if selectedBean}
            <div class="selected-bean-details">
              <div class="bean-info">
                <h4>{selectedBean.name}</h4>
                <div class="bean-meta">
                  <span class="roaster">{getRoasterName(selectedBean.roaster_id)}</span>
                  <span class="roast-level">{selectedBean.roast_level}</span>
                  {#if selectedBean.country_of_origin}
                    <span class="origin">{selectedBean.country_of_origin}</span>
                  {/if}
                </div>
                {#if selectedBean.tasting_notes}
                  <p class="tasting-notes">{selectedBean.tasting_notes}</p>
                {/if}
              </div>
            </div>
          {/if}
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .bean-selector {
    width: 100%;
  }

  .loading,
  .error {
    padding: 1rem;
    text-align: center;
    color: var(--text-ink-muted);
    background: var(--bg-surface-paper-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
  }

  .error {
    color: var(--semantic-error);
    background: rgba(122, 62, 47, 0.12);
    border-color: rgba(122, 62, 47, 0.25);
  }

  .retry-btn {
    margin-left: 0.5rem;
    padding: 0.35rem 0.75rem;
    background: rgba(122, 62, 47, 0.2);
    color: var(--semantic-error);
    border: 1px solid rgba(122, 62, 47, 0.35);
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .retry-btn:hover {
    background: rgba(122, 62, 47, 0.35);
  }

  .selector-controls {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .search-group {
    flex: 1;
    min-width: 150px;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    background: var(--bg-surface-paper);
    color: var(--text-ink-primary);
  }

  .search-input::placeholder {
    color: var(--text-ink-placeholder);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.2);
  }

  .filter-group {
    min-width: 120px;
  }

  .roaster-filter {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    background: var(--bg-surface-paper);
  }

  .create-btn {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
    border: 1px solid var(--accent-primary);
    padding: 0.45rem 1.1rem;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .create-btn:hover:not(:disabled) {
    background: var(--accent-primary-dark);
  }

  .create-btn:disabled {
    background: rgba(123, 94, 58, 0.6);
    cursor: not-allowed;
  }

  .bean-list {
    width: 100%;
  }

  .empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--text-ink-muted);
    background: var(--bg-surface-paper-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .empty-state p {
    margin-bottom: 1rem;
  }

  .clear-filters-btn,
  .create-first-btn {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
    border: 1px solid var(--accent-primary);
    padding: 0.45rem 1.1rem;
    border-radius: 999px;
    cursor: pointer;
    font-weight: 500;
  }

  .clear-filters-btn:hover,
  .create-first-btn:hover:not(:disabled) {
    background: var(--accent-primary-dark);
  }

  .create-first-btn:disabled {
    background: rgba(123, 94, 58, 0.6);
    cursor: not-allowed;
  }

  .bean-select {
    width: 100%;
    padding: var(--selector-trigger-padding, 0.75rem);
    border: 1px solid var(--selector-trigger-border, var(--border-subtle));
    border-radius: var(--selector-trigger-radius, var(--radius-sm));
    font-size: var(--selector-trigger-font-size, 1rem);
    background: var(--selector-trigger-bg, var(--bg-surface-paper));
    margin-bottom: 1rem;
  }

  .bean-select:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.2);
  }

  .bean-select:disabled {
    background: var(--bg-surface-paper-secondary);
    cursor: not-allowed;
  }

  .selected-bean-details {
    background: var(--selector-detail-bg, var(--bg-surface-paper-secondary));
    border: 1px solid var(--selector-detail-border, var(--border-subtle));
    border-radius: var(--selector-detail-radius, var(--radius-md));
    padding: var(--selector-detail-padding, 1rem);
  }

  .bean-info h4 {
    margin: 0 0 0.5rem 0;
    color: var(--selector-detail-title-color, var(--text-ink-primary));
    font-size: var(--selector-detail-title-size, 1.1rem);
  }

  .bean-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .bean-meta span {
    padding: 0.25rem 0.5rem;
    border-radius: var(--selector-pill-radius, 999px);
    font-size: var(--selector-pill-size, 0.8rem);
    font-weight: var(--selector-pill-weight, 500);
  }

  .roaster {
    background: var(--bg-surface-paper-secondary);
    color: var(--text-ink-secondary);
  }

  .roast-level {
    background: rgba(138, 106, 62, 0.15);
    color: var(--semantic-warning);
  }

  .origin {
    background: rgba(85, 98, 74, 0.2);
    color: var(--semantic-success);
  }

  .tasting-notes {
    margin: 0;
    color: var(--text-ink-secondary);
    font-size: 0.9rem;
    line-height: 1.4;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .selector-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .search-group,
    .filter-group {
      min-width: auto;
    }

    .bean-meta {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>
