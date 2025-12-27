<script lang="ts">
  import { onMount } from 'svelte';
  import { barista } from '$lib/auth';
  import BeanCard from '$lib/components/BeanCard.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
  import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import RoastLevel from '$lib/components/RoastLevel.svelte';
  import { ArrowPath, MagnifyingGlass } from '$lib/icons';
  import { enhancedApiClient } from '$lib/utils/enhanced-api-client';
  import { globalLoadingManager, LoadingKeys } from '$lib/utils/loading-state';
  import { AppError, debounce } from '$lib/utils/error-handling';
  import { NetworkMonitor } from '$lib/utils/enhanced-api-client';
  import type { BeanWithContext, Roaster, BeanFilters, PaginationParams, RoastLevel } from '@shared/types';

  export let limit = 20;

  let beans: BeanWithContext[] = [];
  let roasters: Roaster[] = [];
  let error: AppError | null = null;
  let roasterError: AppError | null = null;
  let hasMore = false;
  let currentPage = 1;
  let isOnline = true;

  // Filter state
  let searchTerm = '';
  let selectedRoaster = '';
  let selectedRoastLevel: RoastLevel | null = null;
  let myBeansOnly = false;

  // Loading states
  $: isLoading = globalLoadingManager.isLoading(LoadingKeys.BEANS_LIST);
  $: isSearching = globalLoadingManager.isLoading(LoadingKeys.SEARCH);

  // Debounced search function
  const debouncedSearch = debounce(() => {
    applyFilters();
  }, 300);

  onMount(() => {
    loadBeans();
    loadRoasters();
    
    // Monitor network status
    const unsubscribeNetwork = NetworkMonitor.addListener((online) => {
      isOnline = online;
      if (online && error) {
        // Retry loading when coming back online
        loadBeans();
      }
    });
    
    return unsubscribeNetwork;
  });

  async function loadBeans(page = 1, append = false) {
    try {
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

      const response = await enhancedApiClient.getBeans(filters, pagination);
      
      if (append) {
        beans = [...beans, ...response.data];
      } else {
        beans = response.data;
      }

      hasMore = response.data.length === limit;
      currentPage = page;
    } catch (err) {
      error = err instanceof AppError ? err : new AppError(
        'Failed to load beans',
        { operation: 'load', entityType: 'beans', retryable: true },
        err as Error
      );
      console.error('Failed to load beans:', err);
    }
  }

  async function loadRoasters() {
    try {
      roasterError = null;
      const response = await enhancedApiClient.getRoasters();
      roasters = response.data;
    } catch (err) {
      roasterError = err instanceof AppError ? err : new AppError(
        'Failed to load roasters',
        { operation: 'load', entityType: 'roasters', retryable: true },
        err as Error
      );
      // Don't block the main interface if roasters fail to load
      roasters = [];
    }
  }

  function loadMore() {
    if (!$isLoading && hasMore) {
      loadBeans(currentPage + 1, true);
    }
  }

  function refreshBeans() {
    error = null;
    loadBeans(1, false);
  }

  // Export function for parent components
  export { refreshBeans };

  function refreshRoasters() {
    roasterError = null;
    loadRoasters();
  }

  function applyFilters() {
    currentPage = 1;
    error = null;
    loadBeans();
  }

  function clearFilters() {
    searchTerm = '';
    selectedRoaster = '';
    selectedRoastLevel = null;
    myBeansOnly = false;
    applyFilters();
  }

  function handleSearchInput() {
    debouncedSearch();
  }

  function handleRoastLevelChange(event: CustomEvent<RoastLevel>) {
    selectedRoastLevel = event.detail;
    applyFilters();
  }

  function handleRoastLevelClear() {
    selectedRoastLevel = null;
    applyFilters();
  }

  function handleRetryBeans() {
    refreshBeans();
  }

  function handleRetryRoasters() {
    refreshRoasters();
  }

  function handleDismissError() {
    error = null;
  }

  function handleDismissRoasterError() {
    roasterError = null;
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
            on:input={handleSearchInput}
            placeholder="Search beans, tasting notes..."
            class="search-input"
            disabled={!isOnline}
          />
        </div>
      </div>

      <div class="filter-group">
        <label for="roaster-filter">Roaster</label>
        <select id="roaster-filter" bind:value={selectedRoaster} on:change={applyFilters} class="filter-select" disabled={!isOnline}>
          <option value="">All roasters</option>
          {#each roasters as roaster}
            <option value={roaster.id}>{roaster.name}</option>
          {/each}
        </select>
      </div>

      <div class="filter-group">
        <label for="roast-level-filter">Roast Level</label>
        <div class="roast-level-filter">
          <RoastLevel
            value={selectedRoastLevel}
            editable={isOnline}
            size="small"
            showLabel={false}
            on:change={handleRoastLevelChange}
          />
          {#if selectedRoastLevel}
            <button
              type="button"
              class="clear-roast-level"
              on:click={handleRoastLevelClear}
              disabled={!isOnline}
              title="Clear roast level filter"
              aria-label="Clear roast level filter"
            >
              ×
            </button>
          {/if}
          <span class="roast-level-hint">
            {selectedRoastLevel || 'All levels'}
          </span>
        </div>
      </div>

      <label class="quick-toggle">
        <input
          type="checkbox"
          bind:checked={myBeansOnly}
          on:change={applyFilters}
          disabled={!$barista?.id || !isOnline}
        />
        <span class="toggle-track" aria-hidden="true"></span>
        <span class="toggle-label">My Beans</span>
      </label>

      <button on:click={clearFilters} class="btn-secondary" disabled={!isOnline}>
        Clear
      </button>
    </div>
  </div>

  <!-- Network Status Warning -->
  {#if !isOnline}
    <ErrorDisplay
      error="You're currently offline. Some features may not be available."
      variant="banner"
      showRetry={false}
      showDismiss={false}
      title="Offline"
    />
  {/if}

  <!-- Roaster Loading Error (Non-blocking) -->
  {#if roasterError}
    <ErrorDisplay
      error={roasterError}
      variant="inline"
      size="sm"
      context="roaster loading"
      on:retry={handleRetryRoasters}
      on:dismiss={handleDismissRoasterError}
    />
  {/if}

  <!-- Results Summary -->
  <div class="results-header">
    <div class="results-summary">
      {#if $isLoading && beans.length === 0}
        <LoadingIndicator variant="dots" size="sm" inline message="Loading beans..." />
      {:else if $isSearching}
        <LoadingIndicator variant="dots" size="sm" inline message="Searching..." />
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
      disabled={$isLoading || !isOnline}
    >
      <ArrowPath />
    </IconButton>
  </div>

  <!-- Main Error State -->
  {#if error}
    <ErrorDisplay
      error={error}
      variant="banner"
      context="bean loading"
      on:retry={handleRetryBeans}
      on:dismiss={handleDismissError}
    />
  {/if}

  <!-- Empty State -->
  {#if !$isLoading && !error && beans.length === 0}
    {#if myBeansOnly}
      <EmptyState
        title="No beans in your collection"
        description="Start adding beans to your collection to see them here."
        icon="add"
        actionLabel="Browse All Beans"
        on:action={() => { myBeansOnly = false; applyFilters(); }}
      />
    {:else if searchTerm || selectedRoaster || selectedRoastLevel}
      <EmptyState
        title="No beans match your filters"
        description="Try adjusting your search or filter criteria to find what you're looking for."
        icon="search"
        actionLabel="Clear Filters"
        secondaryActionLabel="Browse All Beans"
        on:action={clearFilters}
        on:secondaryAction={() => { clearFilters(); }}
      />
    {:else}
      <EmptyState
        title="No beans found"
        description="The community hasn't added any beans yet. Be the first to contribute!"
        icon="add"
        actionLabel="Add First Bean"
        on:action={() => console.log('Navigate to add bean')}
      />
    {/if}
  {/if}

  <!-- Bean Cards -->
  {#if beans.length > 0}
    <div class="bean-grid-shell">
      <div class="bean-grid">
        {#each beans as bean (bean.id)}
          {@const roasterRecord = roastersById[bean.roaster_id]}
          <BeanCard 
            {bean} 
            roaster={roasterRecord} 
          />
        {/each}
      </div>
    </div>
  {/if}

  <!-- Load More -->
  {#if hasMore && !$isLoading}
    <div class="load-more">
      <button on:click={loadMore} class="btn-primary" disabled={!isOnline}>
        Load More Beans
      </button>
    </div>
  {/if}

  <!-- Loading More -->
  {#if $isLoading && beans.length > 0}
    <div class="loading-more">
      <LoadingIndicator variant="dots" size="sm" inline message="Loading more beans..." />
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

  .roast-level-filter {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    background: var(--bg-surface-paper);
    min-width: 120px;
    position: relative;
  }

  .roast-level-filter:focus-within {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.2);
  }

  .clear-roast-level {
    position: absolute;
    top: 2px;
    right: 2px;
    background: var(--bg-surface-paper-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    line-height: 1;
    color: var(--text-ink-muted);
    cursor: pointer;
    transition: all var(--motion-fast);
  }

  .clear-roast-level:hover {
    background: var(--semantic-error);
    color: white;
    border-color: var(--semantic-error);
  }

  .clear-roast-level:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .roast-level-hint {
    font-size: 0.75rem;
    color: var(--text-ink-muted);
    text-align: center;
    font-weight: 500;
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