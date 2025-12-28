<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { adminService } from '$lib/admin-service';
  import { barista } from '$lib/auth';
  import IconButton from '$lib/components/IconButton.svelte';
  import RoastLevel from '$lib/components/RoastLevel.svelte';
  import { ChevronDown, MagnifyingGlass, Plus } from '$lib/icons';

  import InlineBagCreator from './InlineBagCreator.svelte';

  export let value = '';
  export let disabled = false;

  const dispatch = createEventDispatcher<{
    bagSelected: { bag: Bag | null; bean: Bean | null };
    brewsLoaded: { brews: Brew[] };
    selected: { id: string };
  }>();

  let bags = [];
  let hasLoadedAdminBags = false;
  let beans = [];
  let roasters = [];
  let brewHistory: Brew[] = [];
  let lastUseByBagId: Record<string, number> = {};
  let loading = true;
  let error = null;
  let showCreateForm = false;
  let isOpen = false;
  let searchTerm = '';
  let searchInput: HTMLInputElement | null = null;
  let comboboxRoot: HTMLDivElement | null = null;
  let lastNotifiedBagId = '';
  let triggerButton: HTMLButtonElement | null = null;

  onMount(() => {
    loadData();
  });

  async function loadData() {
    try {
      loading = true;
      error = null;
      const baristaId = $barista?.id;
      const brewsPromise = baristaId
        ? apiClient.getBrews({ barista_id: baristaId })
        : Promise.resolve({ data: [], count: 0 });

      if (isAdmin) {
        const [adminBags, beansResponse, roastersResponse, brewsResponse] = await Promise.all([
          adminService.getAllBags(),
          apiClient.getBeans(),
          apiClient.getRoasters(),
          brewsPromise
        ]);
        bags = adminBags;
        beans = beansResponse.data;
        roasters = roastersResponse.data;
        brewHistory = brewsResponse.data;
        hasLoadedAdminBags = true;
        lastUseByBagId = getLastUseByBagId(brewsResponse.data);
        dispatch('brewsLoaded', { brews: brewHistory });
      } else {
        const [bagsResponse, beansResponse, roastersResponse, brewsResponse] = await Promise.all([
          apiClient.getBags(),
          apiClient.getBeans(),
          apiClient.getRoasters(),
          brewsPromise
        ]);

        bags = bagsResponse.data;
        beans = beansResponse.data;
        roasters = roastersResponse.data;
        brewHistory = brewsResponse.data;
        hasLoadedAdminBags = false;
        lastUseByBagId = getLastUseByBagId(brewsResponse.data);
        dispatch('brewsLoaded', { brews: brewHistory });
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load bags';
      console.error('Failed to load bags:', err);
      brewHistory = [];
      dispatch('brewsLoaded', { brews: brewHistory });
    } finally {
      loading = false;
    }
  }

  async function handleBagCreated(event: CustomEvent<Bag>) {
    const newBag = event.detail;
    showCreateForm = false;
    value = newBag.id;

    // Refresh selectors to include any newly created beans/roasters
    // (e.g., when a bean is created inline while creating a bag).
    await loadData();

    // Ensure the newly created bag remains selected even if the list reloads
    // without it (e.g., if caching fails).
    if (!bags.find(bag => bag.id === newBag.id)) {
      bags = [newBag, ...bags];
    }

    dispatch('selected', { id: newBag.id });
  }

  function getBeanInfo(beanId: string): Bean | undefined {
    return beans.find(b => b.id === beanId);
  }

  function getRoasterName(roasterId: string): string {
    const roaster = roasters.find(r => r.id === roasterId);
    return roaster?.name || 'Unknown Roaster';
  }

  function getStatusLabel(status: string): string {
    const statusLabels = {
      'unopened': 'Unopened',
      'plenty': 'Plenty',
      'getting_low': 'Getting Low',
      'empty': 'Empty'
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  }

  function formatBagDisplay(bag: Bag): string {
    const bean = getBeanInfo(bag.bean_id);
    if (!bean) return 'Unknown Bean';

    const status = bag.inventory_status ? ` (${getStatusLabel(bag.inventory_status)})` : '';
    const roastDate = bag.roast_date ? ` - ${new Date(bag.roast_date).toLocaleDateString()}` : '';

    return `${bean.name}${status}${roastDate}`;
  }

  function getLastUseByBagId(brews: Brew[]): Record<string, number> {
    return brews.reduce<Record<string, number>>((acc, brew) => {
      if (!brew.bag_id || !brew.created_at) return acc;
      const brewedAt = new Date(brew.created_at).getTime();
      if (!acc[brew.bag_id] || brewedAt > acc[brew.bag_id]) {
        acc[brew.bag_id] = brewedAt;
      }
      return acc;
    }, {});
  }

  function isExpired(bag: Bag): boolean {
    if (!bag.roast_date) return false;
    const roastDate = new Date(bag.roast_date);
    const now = new Date();
    const daysDiff = (now.getTime() - roastDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff > 30; // Consider expired after 30 days
  }

  function isLowOrEmpty(bag: Bag): boolean {
    return bag.inventory_status === 'getting_low' || bag.inventory_status === 'empty';
  }

  function isEmpty(bag: Bag): boolean {
    return bag.inventory_status === 'empty';
  }

  $: isAdmin = Boolean($barista?.is_admin);
  $: if (isAdmin && !hasLoadedAdminBags && !loading) {
    loadData();
  }

  // Filter bags to show only user's bags
  $: userBags = bags.filter(bag => bag.owner_id === $barista?.id);
  $: otherBags = isAdmin ? bags.filter(bag => bag.owner_id !== $barista?.id) : [];
  $: selectedBag = bags.find((bag) => bag.id === value) || null;
  $: selectedBean = selectedBag ? getBeanInfo(selectedBag.bean_id) || null : null;
  $: selectedLabel = selectedBag ? formatBagDisplay(selectedBag) : 'Select a bag...';
  $: {
    const currentBagId = selectedBag?.id || '';
    if (currentBagId !== lastNotifiedBagId) {
      lastNotifiedBagId = currentBagId;
      dispatch('bagSelected', { bag: selectedBag, bean: selectedBean });
    }
  }

  // Filtered bags based on search
  const matchesSearch = (bag: Bag) => {
    const bean = getBeanInfo(bag.bean_id);
    if (!bean) return false;

    const roasterName = getRoasterName(bean.roaster_id);
    const bagDisplay = formatBagDisplay(bag);
    
    return !searchTerm || 
      bagDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bean.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roasterName.toLowerCase().includes(searchTerm.toLowerCase());
  };

  $: filteredUserBags = userBags.filter(matchesSearch);
  $: filteredOtherBags = otherBags.filter(matchesSearch);

  function getLastUsedTimestamp(bag: Bag): number | null {
    return lastUseByBagId[bag.id] ?? null;
  }

  function formatRelativeTime(timestamp: number | null): string | null {
    if (timestamp === null) return null;
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  // Sort bags: last used first, then freshness and roast date
  const sortBags = (bagList: Bag[]) => {
    return [...bagList].sort((a, b) => {
      const aLastUsed = getLastUsedTimestamp(a);
      const bLastUsed = getLastUsedTimestamp(b);
      if (aLastUsed !== bLastUsed) {
        if (aLastUsed === null) return 1;
        if (bLastUsed === null) return -1;
        return bLastUsed - aLastUsed;
      }

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
  };
  $: sortedUserBags = sortBags(filteredUserBags);
  $: sortedOtherBags = sortBags(filteredOtherBags);
  $: selectableBags = [...sortedUserBags, ...sortedOtherBags];
  $: hasAnyBags = userBags.length > 0 || (isAdmin && otherBags.length > 0);
  $: hasMatches = sortedUserBags.length > 0 || (isAdmin && sortedOtherBags.length > 0);

  async function toggleOpen() {
    if (disabled) return;
    isOpen = !isOpen;
    if (isOpen) {
      searchTerm = '';
      await tick();
      searchInput?.focus();
    }
  }

  function selectBag(bag: Bag) {
    value = bag.id;
    isOpen = false;
    searchTerm = '';
    dispatch('selected', { id: bag.id });
  }

  function closeIfEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isOpen = false;
    }
  }

  function handleSearchKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && selectableBags.length > 0) {
      event.preventDefault();
      selectBag(selectableBags[0]);
    }
  }

  function openCreateForm() {
    isOpen = false;
    showCreateForm = true;
  }

  function handleDocumentClick(event: MouseEvent) {
    if (!isOpen || !comboboxRoot) return;
    const path = event.composedPath() as EventTarget[];
    if (!path.includes(comboboxRoot)) {
      isOpen = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleDocumentClick);
  });

  onDestroy(() => {
    document.removeEventListener('click', handleDocumentClick);
  });

  export function focusTrigger() {
    triggerButton?.focus();
  }
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
    <div class="bag-select-row">
      <div class="bag-combobox" class:open={isOpen} bind:this={comboboxRoot}>
        <button
          type="button"
          class="bag-combobox-trigger"
          on:click={toggleOpen}
          on:keydown={closeIfEscape}
          {disabled}
          bind:this={triggerButton}
        >
          <span class:selection-placeholder={!selectedBag}>{selectedLabel}</span>
          <span class="chevron">
            <ChevronDown size={16} />
          </span>
        </button>
        {#if isOpen}
          <div class="bag-combobox-panel" on:keydown={closeIfEscape}>
            <div class="search-field">
              <span class="search-icon" aria-hidden="true">
                <MagnifyingGlass size={18} />
              </span>
              <input
                bind:this={searchInput}
                type="text"
                bind:value={searchTerm}
                placeholder="e.g., Winter Blend"
                class="bag-search-input"
                {disabled}
                on:keydown={handleSearchKey}
              />
            </div>
            {#if !hasAnyBags}
              <div class="combobox-empty">
                <p>You don't have any coffee bags yet.</p>
                <button type="button" on:click={openCreateForm} class="btn-primary" {disabled}>
                  Add Your First Bag
                </button>
              </div>
            {:else if !hasMatches}
              <div class="combobox-empty">
                <p>No bags match your search.</p>
                <button type="button" on:click={() => { searchTerm = ''; }} class="btn-secondary" {disabled}>
                  Clear Search
                </button>
              </div>
            {:else}
              <ul class="bag-options">
                {#each sortedUserBags as bag}
                  {@const bean = getBeanInfo(bag.bean_id)}
                  {@const lastUsed = getLastUsedTimestamp(bag)}
                  <li>
                    <button
                      type="button"
                      class="bag-option"
                      on:click={() => selectBag(bag)}
                    >
                      <span class="option-title">{formatBagDisplay(bag)}</span>
                      <span class="option-meta">{bean ? getRoasterName(bean.roaster_id) : 'Unknown roaster'}</span>
                      {#if lastUsed !== null}
                        <span class="option-meta option-meta--secondary">Last used {formatRelativeTime(lastUsed)}</span>
                      {:else}
                        <span class="option-meta option-meta--secondary">Not used yet</span>
                      {/if}
                    </button>
                  </li>
                {/each}
                {#if isAdmin && sortedOtherBags.length > 0}
                  <li class="bag-divider" aria-hidden="true">
                    <span>Other baristas&apos; bags</span>
                  </li>
                  {#each sortedOtherBags as bag}
                    {@const bean = getBeanInfo(bag.bean_id)}
                    <li>
                      <button
                        type="button"
                        class="bag-option"
                        on:click={() => selectBag(bag)}
                      >
                        <span class="option-title">{formatBagDisplay(bag)}</span>
                        <span class="option-meta">{bean ? getRoasterName(bean.roaster_id) : 'Unknown roaster'}</span>
                      </button>
                    </li>
                  {/each}
                {/if}
              </ul>
            {/if}
          </div>
        {/if}
      </div>
      <IconButton
        type="button"
        on:click={openCreateForm}
        ariaLabel="Add bag"
        title="Add bag"
        variant="accent"
        disabled={disabled}
      >
        <Plus />
      </IconButton>
    </div>

    {#if selectedBag}
      {@const bean = getBeanInfo(selectedBag.bean_id)}
      <div class="selected-bag-details" class:expired={isExpired(selectedBag)}>
        <div class="bag-info">
          <h4>{bean?.name || 'Unknown Bean'}</h4>
          <div class="bag-meta">
            <span class="roaster">{bean ? getRoasterName(bean.roaster_id) : 'Unknown'}</span>
            {#if bean}
              <div class="roast-level-wrapper">
                <RoastLevel value={bean.roast_level} size="small" />
              </div>
            {/if}
            {#if selectedBag.roast_date}
              <span class="roast-date">
                Roasted {new Date(selectedBag.roast_date).toLocaleDateString()}
              </span>
            {/if}
            {#if selectedBag.inventory_status}
              <span class="status" class:low={isLowOrEmpty(selectedBag)} class:empty={isEmpty(selectedBag)}>
                {getStatusLabel(selectedBag.inventory_status)}
              </span>
            {/if}
          </div>

          {#if isExpired(selectedBag)}
            <div class="warning expired-warning">
              This coffee is over 30 days old and may be stale
            </div>
          {/if}
          {#if isLowOrEmpty(selectedBag)}
            <div class="warning low-status-warning">
              {#if isEmpty(selectedBag)}
                This bag is empty
              {:else}
                Running low on this coffee
              {/if}
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
</div>

<style>
  .bag-selector {
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
    background: rgba(122, 62, 47, 0.3);
  }

  .bag-select-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .bag-combobox {
    position: relative;
    flex: 1;
  }

  .bag-combobox-trigger {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: 1rem;
    background: var(--bg-surface-paper);
    color: var(--text-ink-primary);
    cursor: pointer;
  }

  .bag-combobox-trigger:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .bag-combobox-trigger:disabled {
    background: var(--bg-surface-paper-secondary);
    cursor: not-allowed;
  }

  .chevron {
    color: var(--text-ink-muted);
    display: inline-flex;
    align-items: center;
  }

  .bag-combobox-panel {
    position: absolute;
    top: calc(100% + 0.4rem);
    left: 0;
    right: 0;
    background: var(--bg-surface-paper);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-soft);
    padding: 0.75rem;
    z-index: 5;
  }

  .search-field {
    position: relative;
    display: flex;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .search-icon {
    position: absolute;
    top: 50%;
    left: 0.75rem;
    transform: translateY(-50%);
    color: var(--text-ink-muted);
    display: inline-flex;
    align-items: center;
    pointer-events: none;
  }

  .bag-search-input {
    width: 100%;
    font-size: 16px;
    padding: 0.6rem 0.75rem 0.6rem 2.3rem;
  }
  .selection-placeholder {
    color: var(--text-ink-placeholder);
  }

  .bag-options {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 240px;
    overflow-y: auto;
  }

  .bag-option {
    width: 100%;
    text-align: left;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.6rem;
    background: transparent;
    color: var(--text-ink-primary);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .bag-option:hover {
    background: rgba(214, 199, 174, 0.24);
    border-color: rgba(123, 94, 58, 0.25);
  }

  .bag-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-ink-muted);
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    margin: 0.35rem 0;
  }

  .bag-divider::before,
  .bag-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-subtle);
    opacity: 0.8;
  }

  .option-title {
    font-weight: 600;
  }

  .option-meta {
    font-size: 0.85rem;
    color: var(--text-ink-muted);
  }

  .option-meta--secondary {
    font-size: 0.78rem;
    opacity: 0.75;
  }

  .combobox-empty {
    text-align: center;
    color: var(--text-ink-muted);
    padding: 0.5rem 0 0.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .selected-bag-details {
    margin-top: 0.75rem;
    background: var(--bg-surface-paper-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 1rem;
  }

  .selected-bag-details.expired {
    background: rgba(138, 106, 62, 0.15);
    border-color: rgba(138, 106, 62, 0.25);
  }

  .bag-info h4 {
    margin: 0 0 0.5rem 0;
    color: var(--text-ink-primary);
    font-size: 1.1rem;
  }

  .bag-meta {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .bag-meta span {
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .roaster {
    background: var(--bg-surface-paper-secondary);
    color: var(--text-ink-secondary);
  }

  .roast-level-wrapper {
    display: flex;
    align-items: center;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    background: rgba(138, 106, 62, 0.18);
  }

  .roast-date {
    background: rgba(85, 98, 74, 0.18);
    color: var(--semantic-success);
  }

  .status {
    background: rgba(123, 94, 58, 0.15);
    color: var(--text-ink-secondary);
  }

  .status.low {
    background: rgba(138, 106, 62, 0.18);
    color: var(--semantic-warning);
  }

  .status.empty {
    background: rgba(122, 62, 47, 0.12);
    color: var(--semantic-error);
  }

  .warning {
    padding: 0.5rem;
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .expired-warning {
    background: rgba(138, 106, 62, 0.15);
    color: var(--semantic-warning);
    border: 1px solid rgba(138, 106, 62, 0.25);
  }

  .low-status-warning {
    background: rgba(122, 62, 47, 0.12);
    color: var(--semantic-error);
    border: 1px solid rgba(122, 62, 47, 0.25);
  }

  .purchase-info {
    margin: 0;
    color: var(--text-ink-secondary);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  @media (max-width: 768px) {
    .bag-select-row {
      flex-direction: column;
      align-items: stretch;
    }

    .bag-meta {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>
