<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import IconButton from '$lib/components/IconButton.svelte';
  import { ChevronDown, MagnifyingGlass, Plus } from '$lib/icons';
  import { selector } from '$lib/ui/components/selector';
  import { toStyleString } from '$lib/ui/style';

  import InlineMachineCreator from './InlineMachineCreator.svelte';
  import { getImageUrl } from '$lib/utils/image-utils';

  export let value: string = '';
  export let disabled = false;

  const dispatch = createEventDispatcher<{
    selected: { id: string };
  }>();

  let machines: Machine[] = [];
  let loading = true;
  let error: string | null = null;
  let showCreateForm = false;
  let isOpen = false;
  let searchTerm = '';
  let searchInput: HTMLInputElement | null = null;
  let comboboxRoot: HTMLDivElement | null = null;

  const style = toStyleString({
    '--selector-trigger-padding': selector.trigger.padding,
    '--selector-trigger-border': selector.trigger.borderColor,
    '--selector-trigger-bg': selector.trigger.background,
    '--selector-trigger-color': selector.trigger.textColor,
    '--selector-trigger-radius': selector.trigger.radius,
    '--selector-trigger-font-size': selector.trigger.fontSize,
    '--selector-trigger-focus': selector.trigger.focusRing,
    '--selector-trigger-focus-offset': selector.trigger.focusOffset,
    '--selector-trigger-disabled-bg': selector.trigger.disabledBackground,
    '--selector-panel-bg': selector.panel.background,
    '--selector-panel-border': selector.panel.borderColor,
    '--selector-panel-radius': selector.panel.radius,
    '--selector-panel-shadow': selector.panel.shadow,
    '--selector-panel-padding': selector.panel.padding,
    '--selector-option-padding': selector.option.padding,
    '--selector-option-radius': selector.option.radius,
    '--selector-option-color': selector.option.textColor,
    '--selector-option-hover-bg': selector.option.hoverBackground,
    '--selector-option-hover-border': selector.option.hoverBorder,
    '--selector-option-title-size': selector.option.titleSize,
    '--selector-meta-color': selector.meta.textColor,
    '--selector-meta-size': selector.meta.fontSize,
    '--selector-empty-color': selector.empty.textColor,
    '--selector-detail-bg': selector.detailCard.background,
    '--selector-detail-border': selector.detailCard.borderColor,
    '--selector-detail-radius': selector.detailCard.radius,
    '--selector-detail-padding': selector.detailCard.padding,
    '--selector-detail-title-size': selector.detailTitle.fontSize,
    '--selector-detail-title-color': selector.detailTitle.textColor
  });
  let triggerButton: HTMLButtonElement | null = null;

  onMount(() => {
    loadMachines();
  });

  async function loadMachines() {
    try {
      loading = true;
      error = null;

      const response = await apiClient.getMachines();
      machines = response.data;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load machines';
      console.error('Failed to load machines:', err);
    } finally {
      loading = false;
    }
  }

  function handleMachineCreated(event: CustomEvent<Machine>) {
    const newMachine = event.detail;
    machines = [newMachine, ...machines];
    value = newMachine.id;
    showCreateForm = false;
    dispatch('selected', { id: newMachine.id });
  }

  function formatMachineDisplay(machine: Machine): string {
    return `${machine.manufacturer} ${machine.model}`;
  }

  $: selectedMachine = machines.find((machine) => machine.id === value) || null;
  $: selectedLabel = selectedMachine ? formatMachineDisplay(selectedMachine) : 'Select a machine...';

  $: filteredMachines = machines.filter((machine) => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    return (
      formatMachineDisplay(machine).toLowerCase().includes(query)
      || machine.manufacturer.toLowerCase().includes(query)
      || machine.model.toLowerCase().includes(query)
    );
  });

  $: sortedMachines = filteredMachines.sort((a, b) => {
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

  function selectMachine(machine: Machine) {
    value = machine.id;
    isOpen = false;
    searchTerm = '';
    dispatch('selected', { id: machine.id });
  }

  function openCreateForm() {
    isOpen = false;
    showCreateForm = true;
  }

  function closeIfEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isOpen = false;
    }
  }

  function handleSearchKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && sortedMachines.length > 0) {
      event.preventDefault();
      selectMachine(sortedMachines[0]);
    }
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

<div class="machine-selector" style={style}>
  {#if loading}
    <div class="loading">Loading machines...</div>
  {:else if error}
    <div class="error">
      Error: {error}
      <button on:click={loadMachines} class="retry-btn">Retry</button>
    </div>
  {:else if showCreateForm}
    <InlineMachineCreator 
      on:created={handleMachineCreated}
      on:cancel={() => showCreateForm = false}
    />
  {:else}
    <div class="machine-select-row">
      <div class="machine-combobox" class:open={isOpen} bind:this={comboboxRoot}>
        <button
          type="button"
          class="machine-combobox-trigger"
          on:click={toggleOpen}
          on:keydown={closeIfEscape}
          {disabled}
          bind:this={triggerButton}
        >
          <span class:selection-placeholder={!selectedMachine}>{selectedLabel}</span>
          <span class="chevron">
            <ChevronDown size={16} />
          </span>
        </button>
        {#if isOpen}
          <div class="machine-combobox-panel" on:keydown={closeIfEscape}>
            <div class="search-field">
              <span class="search-icon" aria-hidden="true">
                <MagnifyingGlass size={18} />
              </span>
              <input
                bind:this={searchInput}
                type="text"
                bind:value={searchTerm}
                placeholder="e.g., Linea Mini"
                class="machine-search-input"
                {disabled}
                on:keydown={handleSearchKey}
              />
            </div>
            {#if machines.length === 0}
              <div class="combobox-empty">
                <p>No machines yet.</p>
                <button type="button" on:click={openCreateForm} class="btn-primary" {disabled}>
                  Add Your First Machine
                </button>
              </div>
            {:else if sortedMachines.length === 0}
              <div class="combobox-empty">
                <p>No machines match your search.</p>
                <button type="button" on:click={() => { searchTerm = ''; }} class="btn-secondary" {disabled}>
                  Clear Search
                </button>
              </div>
            {:else}
              <ul class="machine-options">
                {#each sortedMachines as machine}
                  <li>
                    <button
                      type="button"
                      class="machine-option"
                      on:click={() => selectMachine(machine)}
                    >
                      <span class="option-title">{formatMachineDisplay(machine)}</span>
                      <span class="option-meta">{machine.manufacturer}</span>
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
        ariaLabel="Add machine"
        title="Add machine"
        variant="accent"
        disabled={disabled}
      >
        <Plus />
      </IconButton>
    </div>

    <!-- Selected Machine Details -->
    {#if selectedMachine}
      <div class="selected-machine-details">
        <div class="machine-info">
          <h4>{formatMachineDisplay(selectedMachine)}</h4>
          
          <div class="machine-meta">
            <span class="manufacturer">{selectedMachine.manufacturer}</span>
            <span class="model">{selectedMachine.model}</span>
          </div>

          <div class="machine-links">
            {#if selectedMachine.user_manual_link}
              <a 
                href={selectedMachine.user_manual_link} 
                target="_blank" 
                rel="noopener noreferrer"
                class="manual-link"
              >
                User Manual
              </a>
            {/if}
          </div>

          {#if selectedMachine.image_path}
            <div class="machine-image">
              <img 
                src={getImageUrl(selectedMachine.image_path, 'machine')} 
                alt={formatMachineDisplay(selectedMachine)}
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
  .machine-selector {
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

  .machine-select-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .machine-combobox {
    position: relative;
    flex: 1;
  }

  .machine-combobox-trigger {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: var(--selector-trigger-padding, 0.6rem 0.75rem);
    border: 1px solid var(--selector-trigger-border, var(--border-subtle));
    border-radius: var(--selector-trigger-radius, var(--radius-sm));
    font-size: var(--selector-trigger-font-size, 1rem);
    background: var(--selector-trigger-bg, var(--bg-surface-paper));
    color: var(--selector-trigger-color, var(--text-ink-primary));
    cursor: pointer;
  }

  .machine-combobox-trigger:focus-visible {
    outline: var(--selector-trigger-focus, 2px solid var(--accent-primary));
    outline-offset: var(--selector-trigger-focus-offset, 2px);
  }

  .machine-combobox-trigger:disabled {
    background: var(--selector-trigger-disabled-bg, var(--bg-surface-paper-secondary));
    cursor: not-allowed;
  }

  .chevron {
    color: var(--text-ink-muted);
    display: inline-flex;
    align-items: center;
  }

  .machine-combobox-panel {
    position: absolute;
    top: calc(100% + 0.4rem);
    left: 0;
    right: 0;
    background: var(--selector-panel-bg, var(--bg-surface-paper));
    border: 1px solid var(--selector-panel-border, var(--border-subtle));
    border-radius: var(--selector-panel-radius, var(--radius-md));
    box-shadow: var(--selector-panel-shadow, var(--shadow-soft));
    padding: var(--selector-panel-padding, 0.75rem);
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

  .machine-search-input {
    width: 100%;
    font-size: 16px;
    padding: 0.6rem 0.75rem 0.6rem 2.3rem;
  }
  .selection-placeholder {
    color: var(--text-ink-placeholder);
  }

  .machine-options {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 240px;
    overflow-y: auto;
  }

  .machine-option {
    width: 100%;
    text-align: left;
    border: 1px solid transparent;
    border-radius: var(--selector-option-radius, var(--radius-sm));
    padding: var(--selector-option-padding, 0.5rem 0.6rem);
    background: transparent;
    color: var(--selector-option-color, var(--text-ink-primary));
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .machine-option:hover {
    background: var(--selector-option-hover-bg, rgba(214, 199, 174, 0.24));
    border-color: var(--selector-option-hover-border, rgba(123, 94, 58, 0.25));
  }

  .option-title {
    font-weight: 600;
    font-size: var(--selector-option-title-size, 1rem);
  }

  .option-meta {
    font-size: var(--selector-meta-size, 0.85rem);
    color: var(--selector-meta-color, var(--text-ink-muted));
  }

  .combobox-empty {
    text-align: center;
    color: var(--selector-empty-color, var(--text-ink-muted));
    padding: 0.5rem 0 0.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .selected-machine-details {
    margin-top: 0.75rem;
    background: var(--selector-detail-bg, var(--bg-surface-paper-secondary));
    border: 1px solid var(--selector-detail-border, var(--border-subtle));
    border-radius: var(--selector-detail-radius, var(--radius-md));
    padding: var(--selector-detail-padding, 1rem);
  }

  .machine-info h4 {
    margin: 0 0 0.5rem 0;
    color: var(--selector-detail-title-color, var(--text-ink-primary));
    font-size: var(--selector-detail-title-size, 1.1rem);
  }

  .machine-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .machine-meta span {
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

  .machine-links {
    margin-bottom: 0.75rem;
  }

  .manual-link {
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

  .manual-link:hover {
    background: var(--accent-primary-dark);
  }

  .machine-image {
    margin-top: 0.75rem;
  }

  .machine-image img {
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

    .machine-meta {
      flex-direction: column;
      gap: 0.5rem;
    }

    .machine-image img {
      max-width: 100%;
    }
  }
</style>
