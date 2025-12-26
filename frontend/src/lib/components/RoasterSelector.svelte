<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import IconButton from '$lib/components/IconButton.svelte';
  import { ChevronDown, MagnifyingGlass, Plus } from '$lib/icons';

  import InlineRoasterCreator from './InlineRoasterCreator.svelte';

  export let value: string = '';
  export let disabled = false;

  const dispatch = createEventDispatcher<{
    roasterCreated: Roaster;
  }>();

  let roasters: Roaster[] = [];
  let loading = true;
  let error: string | null = null;
  let showCreateForm = false;
  let isOpen = false;
  let searchTerm = '';
  let searchInput: HTMLInputElement | null = null;
  let comboboxRoot: HTMLDivElement | null = null;

  onMount(() => {
    loadRoasters();
  });

  async function loadRoasters() {
    try {
      loading = true;
      error = null;

      const response = await apiClient.getRoasters();
      roasters = response.data;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load roasters';
      console.error('Failed to load roasters:', err);
    } finally {
      loading = false;
    }
  }

  function handleRoasterCreated(event: CustomEvent<Roaster>) {
    const newRoaster = event.detail;
    roasters = [newRoaster, ...roasters];
    value = newRoaster.id;
    showCreateForm = false;
    
    // Dispatch the event to parent components
    dispatch('roasterCreated', newRoaster);
  }

  function formatRoasterDisplay(roaster: Roaster): string {
    return roaster.name;
  }

  $: selectedRoaster = roasters.find((roaster) => roaster.id === value) || null;
  $: selectedLabel = selectedRoaster ? formatRoasterDisplay(selectedRoaster) : 'Select a roaster...';

  $: filteredRoasters = roasters.filter((roaster) => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    return roaster.name.toLowerCase().includes(query);
  });

  // Sort roasters alphabetically by name
  $: sortedRoasters = filteredRoasters.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  async function toggleOpen() {
    if (disabled) return;
    isOpen = !isOpen;
    if (isOpen) {
      searchTerm = '';
      await tick();
      searchInput?.focus();
    }
  }

  function selectRoaster(roaster: Roaster) {
    value = roaster.id;
    isOpen = false;
    searchTerm = '';
  }

  function closeIfEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isOpen = false;
    }
  }

  function handleSearchKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && sortedRoasters.length > 0) {
      event.preventDefault();
      selectRoaster(sortedRoasters[0]);
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
</script>

<div class="roaster-selector">
  {#if loading}
    <div class="loading">Loading roasters...</div>
  {:else if error}
    <div class="error">
      Error: {error}
      <button on:click={loadRoasters} class="retry-btn">Retry</button>
    </div>
  {:else if showCreateForm}
    <InlineRoasterCreator 
      on:created={handleRoasterCreated}
      on:cancel={() => showCreateForm = false}
    />
  {:else}
    <div class="roaster-select-row">
      <div class="roaster-combobox" class:open={isOpen} bind:this={comboboxRoot}>
        <button
          type="button"
          class="roaster-combobox-trigger"
          on:click={toggleOpen}
          on:keydown={closeIfEscape}
          {disabled}
        >
          <span class:selection-placeholder={!selectedRoaster}>{selectedLabel}</span>
          <span class="chevron">
            <ChevronDown size={16} />
          </span>
        </button>
        {#if isOpen}
          <div class="roaster-combobox-panel" on:keydown={closeIfEscape}>
            <div class="search-field">
              <span class="search-icon" aria-hidden="true">
                <MagnifyingGlass size={18} />
              </span>
              <input
                bind:this={searchInput}
                type="text"
                bind:value={searchTerm}
                placeholder="e.g., Blue Bottle Coffee"
                class="roaster-search-input"
                {disabled}
                on:keydown={handleSearchKey}
              />
            </div>
            {#if roasters.length === 0}
              <div class="combobox-empty">
                <p>No roasters yet.</p>
                <button type="button" on:click={openCreateForm} class="btn-primary" {disabled}>
                  Add Your First Roaster
                </button>
              </div>
            {:else if sortedRoasters.length === 0}
              <div class="combobox-empty">
                <p>No roasters match your search.</p>
                <button type="button" on:click={() => { searchTerm = ''; }} class="btn-secondary" {disabled}>
                  Clear Search
                </button>
              </div>
            {:else}
              <ul class="roaster-options">
                {#each sortedRoasters as roaster}
                  <li>
                    <button
                      type="button"
                      class="roaster-option"
                      on:click={() => selectRoaster(roaster)}
                    >
                      <span class="option-title">{formatRoasterDisplay(roaster)}</span>
                      {#if roaster.website_url}
                        <span class="option-meta">🌐 {roaster.website_url}</span>
                      {/if}
                    </button>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        {/if}
      </div>
      <IconButton
        type="button"
        on:click={openCreateForm}
        ariaLabel="Add roaster"
        title="Add roaster"
        variant="accent"
        disabled={disabled}
      >
        <Plus />
      </IconButton>
    </div>

    {#if selectedRoaster}
      <div class="selected-roaster-details">
        <div class="roaster-info">
          <h4>{formatRoasterDisplay(selectedRoaster)}</h4>
          
          {#if selectedRoaster.website_url}
            <div class="roaster-links">
              <a 
                href={selectedRoaster.website_url} 
                target="_blank" 
                rel="noopener noreferrer"
                class="website-link"
              >
                🌐 Visit Website
              </a>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .roaster-selector {
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

  .roaster-select-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .roaster-combobox {
    position: relative;
    flex: 1;
  }

  .roaster-combobox-trigger {
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

  .roaster-combobox-trigger:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .roaster-combobox-trigger:disabled {
    background: var(--bg-surface-paper-secondary);
    cursor: not-allowed;
  }

  .chevron {
    color: var(--text-ink-muted);
    display: inline-flex;
    align-items: center;
  }

  .roaster-combobox-panel {
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

  .roaster-search-input {
    width: 100%;
    font-size: 16px;
    padding: 0.6rem 0.75rem 0.6rem 2.3rem;
  }
  .selection-placeholder {
    color: var(--text-ink-muted);
    opacity: var(--text-placeholder-opacity);
  }

  .roaster-options {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 240px;
    overflow-y: auto;
  }

  .roaster-option {
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

  .roaster-option:hover {
    background: rgba(214, 199, 174, 0.24);
    border-color: rgba(123, 94, 58, 0.25);
  }

  .option-title {
    font-weight: 600;
  }

  .option-meta {
    font-size: 0.85rem;
    color: var(--text-ink-muted);
  }

  .combobox-empty {
    text-align: center;
    color: var(--text-ink-muted);
    padding: 0.5rem 0 0.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .selected-roaster-details {
    margin-top: 0.75rem;
    background: var(--bg-surface-paper-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 1rem;
  }

  .roaster-info h4 {
    margin: 0 0 0.5rem 0;
    color: var(--text-ink-primary);
    font-size: 1.1rem;
  }

  .roaster-links {
    margin-bottom: 0.75rem;
  }

  .website-link {
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

  .website-link:hover {
    background: var(--accent-primary-dark);
  }

  @media (max-width: 768px) {
    .roaster-select-row {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>