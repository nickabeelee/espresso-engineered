<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/api-client';

  import InlineGrinderCreator from './InlineGrinderCreator.svelte';
  import { getImageUrl } from '$lib/utils/image-utils';

  export let value: string = '';
  export let disabled = false;

  let grinders: Grinder[] = [];
  let loading = true;
  let error: string | null = null;
  let showCreateForm = false;

  // Search and filter
  let searchTerm = '';
  let selectedManufacturer = '';

  onMount(() => {
    loadGrinders();
  });

  async function loadGrinders() {
    try {
      loading = true;
      error = null;

      const response = await apiClient.getGrinders();
      grinders = response.data;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load grinders';
      console.error('Failed to load grinders:', err);
    } finally {
      loading = false;
    }
  }

  function handleGrinderCreated(event: CustomEvent<Grinder>) {
    const newGrinder = event.detail;
    grinders = [newGrinder, ...grinders];
    value = newGrinder.id;
    showCreateForm = false;
  }

  function formatGrinderDisplay(grinder: Grinder): string {
    return `${grinder.manufacturer} ${grinder.model}`;
  }

  // Get unique manufacturers for filter
  $: manufacturers = [...new Set(grinders.map(g => g.manufacturer))].sort();

  // Filtered grinders based on search and manufacturer selection
  $: filteredGrinders = grinders.filter(grinder => {
    const grinderDisplay = formatGrinderDisplay(grinder);
    
    const matchesSearch = !searchTerm || 
      grinderDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grinder.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grinder.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesManufacturer = !selectedManufacturer || grinder.manufacturer === selectedManufacturer;
    
    return matchesSearch && matchesManufacturer;
  });

  // Sort grinders by manufacturer, then model
  $: sortedGrinders = filteredGrinders.sort((a, b) => {
    const manufacturerCompare = a.manufacturer.localeCompare(b.manufacturer);
    if (manufacturerCompare !== 0) return manufacturerCompare;
    return a.model.localeCompare(b.model);
  });
</script>

<div class="grinder-selector">
  {#if loading}
    <div class="loading">Loading grinders...</div>
  {:else if error}
    <div class="error">
      Error: {error}
      <button on:click={loadGrinders} class="retry-btn">Retry</button>
    </div>
  {:else if showCreateForm}
    <InlineGrinderCreator 
      on:created={handleGrinderCreated}
      on:cancel={() => showCreateForm = false}
    />
  {:else}
    <div class="selector-controls">
      <!-- Search -->
      <div class="search-group">
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Find a grinder"
          class="search-input"
          {disabled}
        />
      </div>

      <!-- Manufacturer Filter -->
      <div class="filter-group">
        <select bind:value={selectedManufacturer} class="manufacturer-filter" {disabled}>
          <option value="">All Manufacturers</option>
          {#each manufacturers as manufacturer}
            <option value={manufacturer}>{manufacturer}</option>
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
        + New Grinder
      </button>
    </div>

    <!-- Grinder Selection -->
    <div class="grinder-list">
      {#if sortedGrinders.length === 0}
        <div class="empty-state">
          {#if searchTerm || selectedManufacturer}
            <p>No grinders match your filters.</p>
            <button 
              type="button"
              on:click={() => { searchTerm = ''; selectedManufacturer = ''; }}
              class="clear-filters-btn"
            >
              Clear Filters
            </button>
          {:else}
            <p>No grinders available.</p>
            <button 
              type="button"
              on:click={() => showCreateForm = true}
              class="create-first-btn"
              {disabled}
            >
              Add Your First Grinder
            </button>
          {/if}
        </div>
      {:else}
        <select bind:value={value} class="grinder-select" {disabled} required>
          <option value="">Select a grinder...</option>
          {#each sortedGrinders as grinder}
            <option value={grinder.id}>
              {formatGrinderDisplay(grinder)}
            </option>
          {/each}
        </select>

        <!-- Selected Grinder Details -->
        {#if value}
          {@const selectedGrinder = grinders.find(g => g.id === value)}
          {#if selectedGrinder}
            <div class="selected-grinder-details">
              <div class="grinder-info">
                <h4>{formatGrinderDisplay(selectedGrinder)}</h4>
                
                <div class="grinder-meta">
                  <span class="manufacturer">{selectedGrinder.manufacturer}</span>
                  <span class="model">{selectedGrinder.model}</span>
                </div>

                <div class="grinder-links">
                  {#if selectedGrinder.setting_guide_chart_url}
                    <a 
                      href={selectedGrinder.setting_guide_chart_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      class="guide-link"
                    >
                      📊 Setting Guide
                    </a>
                  {/if}
                </div>

                {#if selectedGrinder.image_path}
                  <div class="grinder-image">
                    <img 
                      src={getImageUrl(selectedGrinder.image_path, 'grinder')} 
                      alt={formatGrinderDisplay(selectedGrinder)}
                      loading="lazy"
                      on:error={(e) => e.currentTarget.style.display = 'none'}
                    />
                  </div>
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
  .grinder-selector {
    width: 100%;
  }

  .loading,
  .error {
    padding: 1rem;
    text-align: center;
    color: var(--text-ink-muted);
    background: var(--bg-surface-paper-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
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
    color: var(--text-ink-muted);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.2);
  }

  .filter-group {
    min-width: 120px;
  }

  .manufacturer-filter {
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

  .grinder-list {
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

  .grinder-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: 1rem;
    background: var(--bg-surface-paper);
    margin-bottom: 1rem;
  }

  .grinder-select:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.2);
  }

  .grinder-select:disabled {
    background: var(--bg-surface-paper-secondary);
    cursor: not-allowed;
  }

  .selected-grinder-details {
    background: var(--bg-surface-paper-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 1rem;
  }

  .grinder-info h4 {
    margin: 0 0 0.5rem 0;
    color: var(--text-ink-primary);
    font-size: 1.1rem;
  }

  .grinder-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .grinder-meta span {
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .manufacturer {
    background: var(--bg-surface-paper-secondary);
    color: var(--text-ink-secondary);
  }

  .model {
    background: rgba(85, 98, 74, 0.2);
    color: var(--semantic-success);
  }

  .grinder-links {
    margin-bottom: 0.75rem;
  }

  .guide-link {
    display: inline-block;
    padding: 0.5rem 0.75rem;
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
    text-decoration: none;
    border-radius: 999px;
    font-size: 0.9rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .guide-link:hover {
    background: var(--accent-primary-dark);
  }

  .grinder-image {
    margin-top: 0.75rem;
  }

  .grinder-image img {
    max-width: 200px;
    max-height: 150px;
    width: auto;
    height: auto;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-subtle);
    object-fit: cover;
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

    .grinder-meta {
      flex-direction: column;
      gap: 0.5rem;
    }

    .grinder-image img {
      max-width: 100%;
    }
  }
</style>
