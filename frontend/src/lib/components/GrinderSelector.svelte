<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import type { Grinder } from '@shared/types';
  import InlineGrinderCreator from './InlineGrinderCreator.svelte';

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
          placeholder="Search grinders..."
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
                      src={selectedGrinder.image_path} 
                      alt={formatGrinderDisplay(selectedGrinder)}
                      loading="lazy"
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

  .manufacturer-filter {
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

  .grinder-list {
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

  .grinder-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 1rem;
    background: white;
    margin-bottom: 1rem;
  }

  .grinder-select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .grinder-select:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }

  .selected-grinder-details {
    background: #f8f9fa;
    border: 1px solid #e5e5e5;
    border-radius: 0.25rem;
    padding: 1rem;
  }

  .grinder-info h4 {
    margin: 0 0 0.5rem 0;
    color: #333;
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
    border-radius: 0.25rem;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .manufacturer {
    background: #e7f3ff;
    color: #004085;
  }

  .model {
    background: #d4edda;
    color: #155724;
  }

  .grinder-links {
    margin-bottom: 0.75rem;
  }

  .guide-link {
    display: inline-block;
    padding: 0.5rem 0.75rem;
    background: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .guide-link:hover {
    background: #0056b3;
  }

  .grinder-image {
    margin-top: 0.75rem;
  }

  .grinder-image img {
    max-width: 200px;
    max-height: 150px;
    width: auto;
    height: auto;
    border-radius: 0.25rem;
    border: 1px solid #ddd;
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