<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { barista } from '$lib/auth';


  export let barista_id: string | undefined = undefined;
  export let showDrafts = false;
  export let limit = 20;

  let brews: Brew[] = [];
  let loading = true;
  let error: string | null = null;
  let hasMore = false;
  let currentPage = 1;

  // Filter state
  let searchTerm = '';
  let ratingFilter: number | undefined = undefined;
  let dateFromFilter = '';
  let dateToFilter = '';

  onMount(() => {
    loadBrews();
  });

  async function loadBrews(page = 1, append = false) {
    try {
      loading = true;
      error = null;

      const filters: BrewFilters = {
        ...(barista_id && { barista_id }),
        ...(showDrafts && { is_draft: true }),
        ...(ratingFilter && { rating_min: ratingFilter }),
        ...(dateFromFilter && { date_from: dateFromFilter }),
        ...(dateToFilter && { date_to: dateToFilter })
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

  function loadMore() {
    if (!loading && hasMore) {
      loadBrews(currentPage + 1, true);
    }
  }

  function applyFilters() {
    currentPage = 1;
    loadBrews();
  }

  function clearFilters() {
    searchTerm = '';
    ratingFilter = undefined;
    dateFromFilter = '';
    dateToFilter = '';
    applyFilters();
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  function isDraft(brew: Brew): boolean {
    return !brew.yield_mg || !brew.rating;
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
</script>

<div class="brew-list">
  <!-- Filters -->
  <div class="filters">
    <div class="filter-row">
      <div class="search-group">
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Search brews..."
          class="search-input"
        />
      </div>

      <div class="filter-group">
        <select bind:value={ratingFilter} class="filter-select">
          <option value={undefined}>All Ratings</option>
          <option value={8}>8+ Stars</option>
          <option value={6}>6+ Stars</option>
          <option value={4}>4+ Stars</option>
        </select>
      </div>

      <div class="filter-group">
        <input
          type="date"
          bind:value={dateFromFilter}
          class="filter-input"
          placeholder="From date"
        />
      </div>

      <div class="filter-group">
        <input
          type="date"
          bind:value={dateToFilter}
          class="filter-input"
          placeholder="To date"
        />
      </div>

      <button on:click={applyFilters} class="btn-filter">
        Apply
      </button>

      <button on:click={clearFilters} class="btn-clear">
        Clear
      </button>
    </div>
  </div>

  <!-- Results Summary -->
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

  <!-- Error State -->
  {#if error}
    <div class="error-state">
      <p>Error: {error}</p>
      <button on:click={() => loadBrews()} class="btn-retry">
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
  <div class="brew-grid">
    {#each filteredBrews as brew (brew.id)}
      <div class="brew-card" class:draft={isDraft(brew)}>
        <div class="brew-header">
          <h3 class="brew-title">
            <a href="/brews/{brew.id}">{getBrewTitle(brew)}</a>
          </h3>
          {#if isDraft(brew)}
            <span class="draft-badge">Draft</span>
          {/if}
        </div>

        <div class="brew-meta">
          <span class="brew-date">
            {formatDate(brew.created_at)} at {formatTime(brew.created_at)}
          </span>
        </div>

        <div class="brew-details">
          <div class="detail-row">
            <span class="label">Dose:</span>
            <span class="value">{(brew.dose_mg / 1000).toFixed(1)}g</span>
          </div>

          {#if brew.yield_mg}
            <div class="detail-row">
              <span class="label">Yield:</span>
              <span class="value">{(brew.yield_mg / 1000).toFixed(1)}g</span>
            </div>
          {/if}

          {#if brew.ratio_dec}
            <div class="detail-row">
              <span class="label">Ratio:</span>
              <span class="value">1:{brew.ratio_dec.toFixed(2)}</span>
            </div>
          {/if}

          {#if brew.brew_time_ms}
            <div class="detail-row">
              <span class="label">Time:</span>
              <span class="value">{(brew.brew_time_ms / 1000).toFixed(1)}s</span>
            </div>
          {/if}

          {#if brew.rating}
            <div class="detail-row">
              <span class="label">Rating:</span>
              <span class="value rating">
                {'★'.repeat(Math.floor(brew.rating))}
                {brew.rating % 1 !== 0 ? '½' : ''}
                <span class="rating-number">({brew.rating}/10)</span>
              </span>
            </div>
          {/if}
        </div>

        {#if brew.tasting_notes}
          <div class="brew-notes">
            <p class="notes-preview">
              {brew.tasting_notes.length > 100 
                ? brew.tasting_notes.substring(0, 100) + '...' 
                : brew.tasting_notes}
            </p>
          </div>
        {/if}

        <div class="brew-actions">
          <a href="/brews/{brew.id}" class="btn-view">View</a>
          {#if isDraft(brew)}
            <a href="/brews/{brew.id}?edit=true" class="btn-complete">Complete</a>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <!-- Load More -->
  {#if hasMore && !loading}
    <div class="load-more">
      <button on:click={loadMore} class="btn-load-more">
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
    background: white;
    border: 1px solid #e5e5e5;
    border-radius: 0.5rem;
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

  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 1rem;
  }

  .search-input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .filter-select,
  .filter-input {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 0.9rem;
  }

  .btn-filter,
  .btn-clear {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .btn-filter {
    background: #007bff;
    color: white;
  }

  .btn-filter:hover {
    background: #0056b3;
  }

  .btn-clear {
    background: #6c757d;
    color: white;
  }

  .btn-clear:hover {
    background: #545b62;
  }

  .results-summary {
    margin-bottom: 1rem;
    color: #666;
    font-size: 0.9rem;
  }

  .error-state,
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    background: white;
    border: 1px solid #e5e5e5;
    border-radius: 0.5rem;
  }

  .error-state p {
    color: #dc3545;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    color: #333;
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    color: #666;
    margin-bottom: 1.5rem;
  }

  .btn-retry,
  .btn-primary {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    display: inline-block;
    cursor: pointer;
    font-weight: 500;
  }

  .btn-retry:hover,
  .btn-primary:hover {
    background: #0056b3;
  }

  .brew-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .brew-card {
    background: white;
    border: 1px solid #e5e5e5;
    border-radius: 0.5rem;
    padding: 1.5rem;
    transition: box-shadow 0.2s, border-color 0.2s;
  }

  .brew-card:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-color: #007bff;
  }

  .brew-card.draft {
    border-left: 4px solid #ffc107;
    background: #fffbf0;
  }

  .brew-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .brew-title {
    margin: 0;
    font-size: 1.25rem;
  }

  .brew-title a {
    color: #333;
    text-decoration: none;
  }

  .brew-title a:hover {
    color: #007bff;
    text-decoration: underline;
  }

  .draft-badge {
    background: #ffc107;
    color: #333;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .brew-meta {
    margin-bottom: 1rem;
    color: #666;
    font-size: 0.9rem;
  }

  .brew-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-row .label {
    font-weight: 500;
    color: #555;
    font-size: 0.9rem;
  }

  .detail-row .value {
    color: #333;
    font-weight: 600;
  }

  .value.rating {
    color: #ffc107;
  }

  .rating-number {
    color: #666;
    font-weight: normal;
    font-size: 0.8rem;
    margin-left: 0.25rem;
  }

  .brew-notes {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 0.25rem;
    border-left: 3px solid #007bff;
  }

  .notes-preview {
    margin: 0;
    color: #555;
    font-size: 0.9rem;
    line-height: 1.4;
    font-style: italic;
  }

  .brew-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .btn-view,
  .btn-complete {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    text-align: center;
  }

  .btn-view {
    background: #6c757d;
    color: white;
  }

  .btn-view:hover {
    background: #545b62;
  }

  .btn-complete {
    background: #28a745;
    color: white;
  }

  .btn-complete:hover {
    background: #218838;
  }

  .load-more,
  .loading-more {
    text-align: center;
    margin-top: 2rem;
  }

  .btn-load-more {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
  }

  .btn-load-more:hover {
    background: #0056b3;
  }

  .loading-more {
    color: #666;
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

    .brew-grid {
      grid-template-columns: 1fr;
    }

    .brew-details {
      grid-template-columns: 1fr;
    }
  }
</style>