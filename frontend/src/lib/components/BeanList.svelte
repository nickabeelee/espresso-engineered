<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { barista } from '$lib/auth';
  import BeanCard from '$lib/components/BeanCard.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import { ArrowPath, MagnifyingGlass } from '$lib/icons';
  import type { BeanWithContext, Roaster, BeanFilters, PaginationParams, RoastLevel } from '@shared/types';

  export let limit = 20;

  let beans: BeanWithContext[] = [];
  let roasters: Roaster[] = [];
  let loading = true;
  let error: string | null = null;
  let hasMore = false;
  let currentPage = 1;
  let searchTimeout: NodeJS.Timeout;

  // Filter state
  let searchTerm = '';
  let selectedRoaster = '';
  let selectedRoastLevel: RoastLevel | '' = '';
  let myBeansOnly = false;

  const roastLevels: RoastLevel[] = ['Light', 'Medium Light', 'Medium', 'Medium Dark', 'Dark'];

  onMount(() => {
    loadBeans();
    loadRoasters();
  });

  async function loadBeans(page = 1, append = false) {
    try {
      loading = true;
      error = null;

      const filters: BeanFilters = {
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRoaster && { roaster_id: selectedRoaster }),
        ...(selectedRoastLevel && { roast_level: selectedRoastLevel }),
        ...(myBeansOnly && { my_beans: true })
      };

      const pagination: PaginationParams = {
        page,
        limit,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      const response = await apiClient.getBeans(filters, pagination);
      
      if (append) {
        beans = [...beans, ...response.data];
      } else {
        beans = response.data;
      }

      hasMore = response.data.length === limit;
      currentPage = page;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load beans';
      console.error('Failed to load beans:', err);
    } finally {
      loading = false;
    }
  }

  async function loadRoasters() {
    try {
      const response = await apiClient.getRoasters();
      roasters = response.data;
    } catch (err) {
      roasters = [];
    }
  }

  function loadMore() {
    if (!loading && hasMore) {
      loadBeans(currentPage + 1, true);
    }
  }

  function refreshBeans() {
    loadBeans(1, false);
  }

  function applyFilters() {
    currentPage = 1;
    loadBeans();
  }

  function clearFilters() {
    searchTerm = '';
    selectedRoaster = '';
    selectedRoastLevel = '';
    myBeansOnly = false;
    applyFilters();
  }

  $: roastersById = roasters.reduce<Record<string, Roaster>>((acc, roaster) => {
    acc[roaster.id] = roaster;
    return acc;
  }, {});
</script>

<div class="bean-list">
  <!-- Filters -->
  <div class="filters">
    <div class="filter-row">
      <div class="search-group">
        <div class="search-field">
          <span class="search-icon" aria-hidden="true">
            <MagnifyingGlass size={18} />
          </span>
          <input
            type="text"
            bind:value={searchTerm}
            on:input={() => {
              // Debounce search
              clearTimeout(searchTimeout);
              searchTimeout = setTimeout(applyFilters, 300);
            }}
            placeholder="Search beans, tasting notes..."
            class="search-input"
          />
        </div>
      </div>

      <div class="filter-group">
        <label for="roaster-filter">Roaster</label>
        <select id="roaster-filter" bind:value={selectedRoaster} on:change={applyFilters} class="filter-select">
          <option value="">All roasters</option>
          {#each roasters as roaster}
            <option value={roaster.id}>{roaster.name}</option>
          {/each}
        </select>
      </div>

      <div class="filter-group">
        <label for="roast-level-filter">Roast Level</label>
        <select id="roast-level-filter" bind:value={selectedRoastLevel} on:change={applyFilters} class="filter-select">
          <option value="">All levels</option>
          {#each roastLevels as level}
            <option value={level}>{level}</option>
          {/each}
        </select>
      </div>

      <label class="quick-toggle">
        <input
          type="checkbox"
          bind:checked={myBeansOnly}
          on:change={applyFilters}
          disabled={!$barista?.id}
        />
        <span class="toggle-track" aria-hidden="true"></span>
        <span class="toggle-label">My Beans</span>
      </label>

      <button on:click={clearFilters} class="btn-secondary">
        Clear
      </button>
    </div>
  </div>

  <!-- Results Summary -->
  <div class="results-header">
    <div class="results-summary">
      {#if loading && beans.length === 0}
        <span>Loading beans...</span>
      {:else}
        <span>
          {beans.length} bean{beans.length !== 1 ? 's' : ''}
          {#if myBeansOnly}(my collection){/if}
        </span>
      {/if}
    </div>
    <IconButton
      type="button"
      ariaLabel="Refresh beans"
      title="Refresh"
      on:click={refreshBeans}
      disabled={loading}
    >
      <ArrowPath />
    </IconButton>
  </div>

  <!-- Error State -->
  {#if error}
    <div class="error-state">
      <p>Error: {error}</p>
      <button on:click={() => loadBeans()} class="btn-primary">
        Try Again
      </button>
    </div>
  {/if}

  <!-- Empty State -->
  {#if !loading && !error && beans.length === 0}
    <div class="empty-state">
      {#if myBeansOnly}
        <h3>No beans in your collection</h3>
        <p>Start adding beans to your collection to see them here.</p>
      {:else if searchTerm || selectedRoaster || selectedRoastLevel}
        <h3>No beans match your filters</h3>
        <p>Try adjusting your search or filter criteria.</p>
        <button on:click={clearFilters} class="btn-primary">Clear Filters</button>
      {:else}
        <h3>No beans found</h3>
        <p>The community hasn't added any beans yet.</p>
      {/if}
    </div>
  {/if}

  <!-- Bean Cards -->
  {#if beans.length > 0}
    <div class="bean-grid-shell">
      <div class="bean-grid">
        {#each beans as bean (bean.id)}
          {@const roasterRecord = roastersById[bean.roaster_id]}
          <BeanCard {bean} roaster={roasterRecord} />
        {/each}
      </div>
    </div>
  {/if}

  <!-- Load More -->
  {#if hasMore && !loading}
    <div class="load-more">
      <button on:click={loadMore} class="btn-primary">
        Load More Beans
      </button>
    </div>
  {/if}

  <!-- Loading More -->
  {#if loading && beans.length > 0}
    <div class="loading-more">
      <span>Loading more beans...</span>
    </div>
  {/if}
</div>

<style>
  .bean-list {
    width: 100%;
  }

  .filters {
    background: var(--bg-surface-paper-secondary);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .filter-row {
    display: flex;
    gap: 1rem;
    align-items: end;
    flex-wrap: wrap;
  }

  .search-group {
    flex: 1;
    min-width: 200px;
  }

  .search-field {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--text-ink-muted);
    display: inline-flex;
    align-items: center;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.6rem 0.75rem 0.6rem 2.3rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: 1rem;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.2);
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .filter-group label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-ink-secondary);
  }

  .filter-select {
    padding: 0.5rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    min-width: 120px;
  }

  .filter-select:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.2);
  }

  .quick-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-ink-secondary);
    cursor: pointer;
    user-select: none;
    margin-top: 1.2rem;
  }

  .quick-toggle input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .toggle-track {
    width: 44px;
    height: 24px;
    border-radius: 999px;
    background: rgba(123, 94, 58, 0.2);
    border: 1px solid rgba(123, 94, 58, 0.35);
    position: relative;
    transition: background var(--motion-fast), border-color var(--motion-fast);
  }

  .toggle-track::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--bg-surface-paper);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    transition: transform var(--motion-fast);
  }

  .quick-toggle input:checked + .toggle-track {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
  }

  .quick-toggle input:checked + .toggle-track::after {
    transform: translateX(20px);
  }

  .quick-toggle input:focus-visible + .toggle-track {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .quick-toggle input:disabled + .toggle-track {
    opacity: 0.5;
  }

  .quick-toggle input:disabled ~ .toggle-label {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .results-summary {
    color: var(--text-ink-muted);
    font-size: 0.9rem;
  }

  .error-state,
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    background: var(--bg-surface-paper-secondary);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
  }

  .error-state p {
    color: var(--semantic-error);
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    color: var(--text-ink-primary);
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    color: var(--text-ink-muted);
    margin-bottom: 1.5rem;
  }

  .bean-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .bean-grid-shell {
    background: var(--bg-surface-paper-secondary);
    border: 1px solid rgba(123, 94, 58, 0.2);
    border-radius: var(--radius-md);
    padding: 1.5rem;
  }

  .load-more,
  .loading-more {
    text-align: center;
    margin-top: 2rem;
  }

  .loading-more {
    color: var(--text-ink-muted);
    font-style: italic;
  }

  @media (max-width: 768px) {
    .filter-row {
      flex-direction: column;
      align-items: stretch;
    }

    .search-group {
      min-width: auto;
    }

    .quick-toggle {
      margin-top: 0;
    }

    .results-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .bean-grid {
      grid-template-columns: 1fr;
    }
  }
</style>