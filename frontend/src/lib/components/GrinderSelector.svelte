<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import IconButton from '$lib/components/IconButton.svelte';
  import { ChevronDown, MagnifyingGlass, Plus } from '$lib/icons';

  import InlineGrinderCreator from './InlineGrinderCreator.svelte';
  import { getImageUrl } from '$lib/utils/image-utils';

  export let value: string = '';
  export let disabled = false;

  const dispatch = createEventDispatcher<{
    selected: { id: string };
  }>();

  let grinders: Grinder[] = [];
  let loading = true;
  let error: string | null = null;
  let showCreateForm = false;
  let isOpen = false;
  let searchTerm = '';
  let searchInput: HTMLInputElement | null = null;
  let comboboxRoot: HTMLDivElement | null = null;
  let triggerButton: HTMLButtonElement | null = null;

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
    dispatch('selected', { id: newGrinder.id });
  }

  function formatGrinderDisplay(grinder: Grinder): string {
    return `${grinder.manufacturer} ${grinder.model}`;
  }

  $: selectedGrinder = grinders.find((grinder) => grinder.id === value) || null;
  $: selectedLabel = selectedGrinder ? formatGrinderDisplay(selectedGrinder) : 'Select a grinder...';

  $: filteredGrinders = grinders.filter((grinder) => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    return (
      formatGrinderDisplay(grinder).toLowerCase().includes(query)
      || grinder.manufacturer.toLowerCase().includes(query)
      || grinder.model.toLowerCase().includes(query)
    );
  });

  // Sort grinders by manufacturer, then model
  $: sortedGrinders = filteredGrinders.sort((a, b) => {
    const manufacturerCompare = a.manufacturer.localeCompare(b.manufacturer);
    if (manufacturerCompare !== 0) return manufacturerCompare;
    return a.model.localeCompare(b.model);
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

  function selectGrinder(grinder: Grinder) {
    value = grinder.id;
    isOpen = false;
    searchTerm = '';
    dispatch('selected', { id: grinder.id });
  }

  function closeIfEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isOpen = false;
    }
  }

  function handleSearchKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && sortedGrinders.length > 0) {
      event.preventDefault();
      selectGrinder(sortedGrinders[0]);
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
    <div class="grinder-select-row">
      <div class="grinder-combobox" class:open={isOpen} bind:this={comboboxRoot}>
        <button
          type="button"
          class="grinder-combobox-trigger"
          on:click={toggleOpen}
          on:keydown={closeIfEscape}
          {disabled}
          bind:this={triggerButton}
        >
          <span class:selection-placeholder={!selectedGrinder}>{selectedLabel}</span>
          <span class="chevron">
            <ChevronDown size={16} />
          </span>
        </button>
        {#if isOpen}
          <div class="grinder-combobox-panel" on:keydown={closeIfEscape}>
            <div class="search-field">
              <span class="search-icon" aria-hidden="true">
                <MagnifyingGlass size={18} />
              </span>
              <input
                bind:this={searchInput}
                type="text"
                bind:value={searchTerm}
                placeholder="e.g., Baratza Encore"
                class="grinder-search-input"
                {disabled}
                on:keydown={handleSearchKey}
              />
            </div>
            {#if grinders.length === 0}
              <div class="combobox-empty">
                <p>No grinders yet.</p>
                <button type="button" on:click={openCreateForm} class="btn-primary" {disabled}>
                  Add Your First Grinder
                </button>
              </div>
            {:else if sortedGrinders.length === 0}
              <div class="combobox-empty">
                <p>No grinders match your search.</p>
                <button type="button" on:click={() => { searchTerm = ''; }} class="btn-secondary" {disabled}>
                  Clear Search
                </button>
              </div>
            {:else}
              <ul class="grinder-options">
                {#each sortedGrinders as grinder}
                  <li>
                    <button
                      type="button"
                      class="grinder-option"
                      on:click={() => selectGrinder(grinder)}
                    >
                      <span class="option-title">{formatGrinderDisplay(grinder)}</span>
                      <span class="option-meta">{grinder.manufacturer}</span>
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
        ariaLabel="Add grinder"
        title="Add grinder"
        variant="accent"
        disabled={disabled}
      >
        <Plus />
      </IconButton>
    </div>

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

  .grinder-select-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .grinder-combobox {
    position: relative;
    flex: 1;
  }

  .grinder-combobox-trigger {
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

  .grinder-combobox-trigger:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .grinder-combobox-trigger:disabled {
    background: var(--bg-surface-paper-secondary);
    cursor: not-allowed;
  }

  .chevron {
    color: var(--text-ink-muted);
    display: inline-flex;
    align-items: center;
  }

  .grinder-combobox-panel {
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

  .grinder-search-input {
    width: 100%;
    font-size: 16px;
    padding: 0.6rem 0.75rem 0.6rem 2.3rem;
  }
  .selection-placeholder {
    color: var(--text-ink-placeholder);
  }

  .grinder-options {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 240px;
    overflow-y: auto;
  }

  .grinder-option {
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

  .grinder-option:hover {
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

  .selected-grinder-details {
    margin-top: 0.75rem;
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
    .grinder-select-row {
      flex-direction: column;
      align-items: stretch;
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
