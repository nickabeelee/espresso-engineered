<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { barista } from '$lib/auth';
  import BrewCard from '$lib/components/BrewCard.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import { ArrowPath, MagnifyingGlass } from '$lib/icons';
  import { recordListShell } from '$lib/ui/components/card';
  import { toStyleString } from '$lib/ui/style';


  export let barista_id: string | undefined = undefined;
  export let showDrafts = false;
  export let limit = 20;

  let brews: Brew[] = [];
  let baristas: Barista[] = [];
  let loading = true;
  let error: string | null = null;
  let hasMore = false;
  let currentPage = 1;
  let onlyMyBrews = false;

  // Filter state
  let searchTerm = '';

  const gridShellStyle = toStyleString({
    '--record-list-bg': recordListShell.background,
    '--record-list-border': recordListShell.borderColor,
    '--record-list-border-width': recordListShell.borderWidth,
    '--record-list-border-style': recordListShell.borderStyle,
    '--record-list-radius': recordListShell.borderRadius,
    '--record-list-padding': recordListShell.padding
  });

  onMount(() => {
    loadBrews();
    loadBaristas();
  });

  async function loadBrews(page = 1, append = false) {
    try {
      loading = true;
      error = null;

      const effectiveBaristaId = onlyMyBrews ? $barista?.id : barista_id;
      const filters: BrewFilters = {
        ...(effectiveBaristaId && { barista_id: effectiveBaristaId }),
        ...(showDrafts && { is_draft: true })
      };

      const pagination: PaginationParams = {
        page,
        limit,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      const response = await apiClient.getBrews(filters, pagination);
      
      if (append) {
        brews = [...brews, ...response.data];
      } else {
        brews = response.data;
      }

      hasMore = response.data.length === limit;
      currentPage = page;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load brews';
      console.error('Failed to load brews:', err);
    } finally {
      loading = false;
    }
  }

  async function loadBaristas() {
    try {
      const response = await apiClient.getBaristas();
      baristas = response.data;
    } catch (err) {
      baristas = [];
    }
  }

  function loadMore() {
    if (!loading && hasMore) {
      loadBrews(currentPage + 1, true);
    }
  }

  function refreshBrews() {
    loadBrews(1, false);
  }

  function applyFilters() {
    currentPage = 1;
    loadBrews();
  }

  function clearFilters() {
    searchTerm = '';
    onlyMyBrews = false;
    applyFilters();
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  function getBrewTitle(brew: Brew): string {
    if (brew.name) return brew.name;
    return `Brew ${formatDate(brew.created_at)}`;
  }

  // Reactive filtering for search term
  $: filteredBrews = searchTerm 
    ? brews.filter(brew => 
        getBrewTitle(brew).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (brew.tasting_notes && brew.tasting_notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (brew.reflections && brew.reflections.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : brews;

  $: baristasById = baristas.reduce<Record<string, Barista>>((acc, entry) => {
    acc[entry.id] = entry;
    return acc;
  }, {});
</script>

<div class="brew-list">
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
            placeholder="e.g., marzipan"
            class="search-input"
          />
        </div>
      </div>

      <label class="quick-toggle">
        <input
          type="checkbox"
          bind:checked={onlyMyBrews}
          on:change={applyFilters}
          disabled={!$barista?.id}
        />
        <span class="toggle-track" aria-hidden="true"></span>
        <span class="toggle-label">Only my brews</span>
      </label>

      <button on:click={clearFilters} class="btn-secondary">
        Clear
      </button>
    </div>
  </div>

  <!-- Results Summary -->
  <div class="results-header">
    <div class="results-summary">
      {#if loading && brews.length === 0}
        <span>Loading brews...</span>
      {:else}
        <span>
          {filteredBrews.length} brew{filteredBrews.length !== 1 ? 's' : ''}
          {#if showDrafts}(drafts){/if}
        </span>
      {/if}
    </div>
    <IconButton
      type="button"
      ariaLabel="Refresh brews"
      title="Refresh"
      on:click={refreshBrews}
      disabled={loading}
    >
      <ArrowPath />
    </IconButton>
  </div>

  <!-- Error State -->
  {#if error}
    <div class="error-state">
      <p>Error: {error}</p>
      <button on:click={() => loadBrews()} class="btn-primary">
        Try Again
      </button>
    </div>
  {/if}

  <!-- Empty State -->
  {#if !loading && !error && filteredBrews.length === 0}
    <div class="empty-state">
      {#if showDrafts}
        <h3>No draft brews</h3>
        <p>All your brews are complete!</p>
      {:else}
        <h3>No brews found</h3>
        <p>Start logging your espresso brews to see them here.</p>
        <a href="/brews/new" class="btn-primary">Create Your First Brew</a>
      {/if}
    </div>
  {/if}

  <!-- Brew Cards -->
  {#if filteredBrews.length > 0}
    <div class="brew-grid-shell" style={gridShellStyle}>
    <div class="brew-grid">
      {#each filteredBrews as brew (brew.id)}
        {@const baristaRecord = baristasById[brew.barista_id]}
        <BrewCard brew={brew} baristaName={baristaRecord?.display_name ?? 'Unknown barista'} />
      {/each}
    </div>
  </div>
  {/if}

  <!-- Load More -->
  {#if hasMore && !loading}
    <div class="load-more">
      <button on:click={loadMore} class="btn-primary">
        Load More Brews
      </button>
    </div>
  {/if}

  <!-- Loading More -->
  {#if loading && brews.length > 0}
    <div class="loading-more">
      <span>Loading more brews...</span>
    </div>
  {/if}
</div>

<style>
  .brew-list {
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
    align-items: center;
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

  .filter-select,
  .filter-input {
    padding: 0.5rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
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

  .brew-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .brew-grid-shell {
    background: var(--record-list-bg, var(--bg-surface-paper-secondary));
    border: var(--record-list-border-width, 1px) var(--record-list-border-style, solid) var(--record-list-border, rgba(123, 94, 58, 0.2));
    border-radius: var(--record-list-radius, var(--radius-md));
    padding: var(--record-list-padding, 1.5rem);
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

    .results-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .brew-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
