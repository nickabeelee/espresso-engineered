<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import type { Bean, Roaster } from '@shared/types';
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

<div class="bean-selector">
  {#if loading}
    <div class="loading">Loading beans...</div>
  {:else if error}
    <div class="error">
      Error: {error}
      <button on:click={loadData} class="retry-btn">Retry</button>
    </div>
  {:else if showCreateForm}
    <InlineBeanCreator 
      {roasters}
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
          placeholder="Search beans..."
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
    color: #666;
    background: #f8f9fa;
    border: 1px solid #e5e5e5;
    border-radius: 0.25rem;
  }

  .error {
    color: #dc3545;
    background: #f8d7da;
    border-color: #f5c6cb;
  }

  .retry-btn {
    margin-left: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .retry-btn:hover {
    background: #c82333;
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
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 0.9rem;
  }

  .search-input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .filter-group {
    min-width: 120px;
  }

  .roaster-filter {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    background: white;
  }

  .create-btn {
    background: #28a745;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .create-btn:hover:not(:disabled) {
    background: #218838;
  }

  .create-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  .bean-list {
    width: 100%;
  }

  .empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: #666;
    background: #f8f9fa;
    border: 1px solid #e5e5e5;
    border-radius: 0.25rem;
  }

  .empty-state p {
    margin-bottom: 1rem;
  }

  .clear-filters-btn,
  .create-first-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: 500;
  }

  .clear-filters-btn:hover,
  .create-first-btn:hover:not(:disabled) {
    background: #0056b3;
  }

  .create-first-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  .bean-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 1rem;
    background: white;
    margin-bottom: 1rem;
  }

  .bean-select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .bean-select:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }

  .selected-bean-details {
    background: #f8f9fa;
    border: 1px solid #e5e5e5;
    border-radius: 0.25rem;
    padding: 1rem;
  }

  .bean-info h4 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.1rem;
  }

  .bean-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .bean-meta span {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .roaster {
    background: #e7f3ff;
    color: #004085;
  }

  .roast-level {
    background: #fff3cd;
    color: #856404;
  }

  .origin {
    background: #d4edda;
    color: #155724;
  }

  .tasting-notes {
    margin: 0;
    color: #555;
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