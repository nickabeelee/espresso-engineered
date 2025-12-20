<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { barista } from '$lib/auth';

  import InlineBagCreator from './InlineBagCreator.svelte';

  export let value = '';
  export let disabled = false;

  let bags = [];
  let beans = [];
  let roasters = [];
  let loading = true;
  let error = null;
  let showCreateForm = false;

  // Search and filter
  let searchTerm = '';
  let selectedBean = '';

  onMount(() => {
    loadData();
  });

  async function loadData() {
    try {
      loading = true;
      error = null;

      const [bagsResponse, beansResponse, roastersResponse] = await Promise.all([
        apiClient.getBags(),
        apiClient.getBeans(),
        apiClient.getRoasters()
      ]);

      bags = bagsResponse.data;
      beans = beansResponse.data;
      roasters = roastersResponse.data;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load bags';
      console.error('Failed to load bags:', err);
    } finally {
      loading = false;
    }
  }

  function handleBagCreated(event: CustomEvent<Bag>) {
    const newBag = event.detail;
    bags = [newBag, ...bags];
    value = newBag.id;
    showCreateForm = false;
  }

  function getBeanInfo(beanId: string): Bean | undefined {
    return beans.find(b => b.id === beanId);
  }

  function getRoasterName(roasterId: string): string {
    const roaster = roasters.find(r => r.id === roasterId);
    return roaster?.name || 'Unknown Roaster';
  }

  function formatBagDisplay(bag: Bag): string {
    const bean = getBeanInfo(bag.bean_id);
    if (!bean) return 'Unknown Bean';
    
    const roasterName = getRoasterName(bean.roaster_id);
    const weight = bag.weight_g ? ` (${bag.weight_g.toFixed(0)}g)` : '';
    const roastDate = bag.roast_date ? ` - ${new Date(bag.roast_date).toLocaleDateString()}` : '';
    
    return `${bean.name} - ${roasterName}${weight}${roastDate}`;
  }

  function isExpired(bag: Bag): boolean {
    if (!bag.roast_date) return false;
    const roastDate = new Date(bag.roast_date);
    const now = new Date();
    const daysDiff = (now.getTime() - roastDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff > 30; // Consider expired after 30 days
  }

  function isLowWeight(bag: Bag): boolean {
    if (!bag.weight_g) return false;
    return bag.weight_g < 50; // Less than 50g
  }

  // Filter bags to show only user's bags
  $: userBags = bags.filter(bag => bag.owner_id === $barista?.id);

  // Filtered bags based on search and bean selection
  $: filteredBags = userBags.filter(bag => {
    const bean = getBeanInfo(bag.bean_id);
    if (!bean) return false;

    const roasterName = getRoasterName(bean.roaster_id);
    const bagDisplay = formatBagDisplay(bag);
    
    const matchesSearch = !searchTerm || 
      bagDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bean.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roasterName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBean = !selectedBean || bag.bean_id === selectedBean;
    
    return matchesSearch && matchesBean;
  });

  // Sort bags: fresh first, then by roast date
  $: sortedBags = filteredBags.sort((a, b) => {
    // Fresh bags first
    const aExpired = isExpired(a);
    const bExpired = isExpired(b);
    if (aExpired !== bExpired) {
      return aExpired ? 1 : -1;
    }

    // Then by roast date (newest first)
    if (a.roast_date && b.roast_date) {
      return new Date(b.roast_date).getTime() - new Date(a.roast_date).getTime();
    }
    if (a.roast_date) return -1;
    if (b.roast_date) return 1;

    // Finally by creation date
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
</script>

<div class="bag-selector">
  {#if loading}
    <div class="loading">Loading bags...</div>
  {:else if error}
    <div class="error">
      Error: {error}
      <button on:click={loadData} class="retry-btn">Retry</button>
    </div>
  {:else if showCreateForm}
    <InlineBagCreator 
      {beans}
      {roasters}
      on:created={handleBagCreated}
      on:cancel={() => showCreateForm = false}
    />
  {:else}
    <div class="selector-controls">
      <!-- Search -->
      <div class="search-group">
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Search your bags..."
          class="search-input"
          {disabled}
        />
      </div>

      <!-- Bean Filter -->
      <div class="filter-group">
        <select bind:value={selectedBean} class="bean-filter" {disabled}>
          <option value="">All Beans</option>
          {#each beans as bean}
            <option value={bean.id}>{bean.name} - {getRoasterName(bean.roaster_id)}</option>
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
        + New Bag
      </button>
    </div>

    <!-- Bag Selection -->
    <div class="bag-list">
      {#if sortedBags.length === 0}
        <div class="empty-state">
          {#if searchTerm || selectedBean}
            <p>No bags match your filters.</p>
            <button 
              type="button"
              on:click={() => { searchTerm = ''; selectedBean = ''; }}
              class="clear-filters-btn"
            >
              Clear Filters
            </button>
          {:else}
            <p>You don't have any coffee bags yet.</p>
            <button 
              type="button"
              on:click={() => showCreateForm = true}
              class="create-first-btn"
              {disabled}
            >
              Add Your First Bag
            </button>
          {/if}
        </div>
      {:else}
        <select bind:value={value} class="bag-select" {disabled} required>
          <option value="">Select a bag...</option>
          {#each sortedBags as bag}
            <option value={bag.id} class:expired={isExpired(bag)} class:low-weight={isLowWeight(bag)}>
              {formatBagDisplay(bag)}
            </option>
          {/each}
        </select>

        <!-- Selected Bag Details -->
        {#if value}
          {@const selectedBag = bags.find(b => b.id === value)}
          {#if selectedBag}
            {@const bean = getBeanInfo(selectedBag.bean_id)}
            <div class="selected-bag-details" class:expired={isExpired(selectedBag)}>
              <div class="bag-info">
                <h4>{bean?.name || 'Unknown Bean'}</h4>
                <div class="bag-meta">
                  <span class="roaster">{bean ? getRoasterName(bean.roaster_id) : 'Unknown'}</span>
                  {#if bean}
                    <span class="roast-level">{bean.roast_level}</span>
                  {/if}
                  {#if selectedBag.roast_date}
                    <span class="roast-date">
                      Roasted {new Date(selectedBag.roast_date).toLocaleDateString()}
                    </span>
                  {/if}
                  {#if selectedBag.weight_g}
                    <span class="weight" class:low={isLowWeight(selectedBag)}>
                      {selectedBag.weight_g.toFixed(0)}g remaining
                    </span>
                  {/if}
                </div>

                <!-- Warnings -->
                {#if isExpired(selectedBag)}
                  <div class="warning expired-warning">
                    ⚠️ This coffee is over 30 days old and may be stale
                  </div>
                {/if}
                {#if isLowWeight(selectedBag)}
                  <div class="warning low-weight-warning">
                    📉 Running low on this coffee
                  </div>
                {/if}

                {#if selectedBag.purchase_location}
                  <p class="purchase-info">
                    Purchased from: {selectedBag.purchase_location}
                    {#if selectedBag.price}
                      (${selectedBag.price.toFixed(2)})
                    {/if}
                  </p>
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
  .bag-selector {
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
    min-width: 150px;
  }

  .bean-filter {
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

  .bag-list {
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

  .bag-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    font-size: 1rem;
    background: white;
    margin-bottom: 1rem;
  }

  .bag-select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .bag-select:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }

  .selected-bag-details {
    background: #f8f9fa;
    border: 1px solid #e5e5e5;
    border-radius: 0.25rem;
    padding: 1rem;
  }

  .selected-bag-details.expired {
    background: #fff3cd;
    border-color: #ffeaa7;
  }

  .bag-info h4 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.1rem;
  }

  .bag-meta {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .bag-meta span {
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

  .roast-date {
    background: #d4edda;
    color: #155724;
  }

  .weight {
    background: #e2e3e5;
    color: #383d41;
  }

  .weight.low {
    background: #f8d7da;
    color: #721c24;
  }

  .warning {
    padding: 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .expired-warning {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
  }

  .low-weight-warning {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .purchase-info {
    margin: 0;
    color: #555;
    font-size: 0.9rem;
    line-height: 1.4;
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

    .bag-meta {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>
