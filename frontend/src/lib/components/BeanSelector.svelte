<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import IconButton from '$lib/components/IconButton.svelte';
  import RoastLevel from '$lib/components/RoastLevel.svelte';
  import { ChevronDown, MagnifyingGlass, Plus } from '$lib/icons';
  import { selector } from '$lib/ui/components/selector';
  import { toStyleString } from '$lib/ui/style';

  import InlineBeanCreator from './InlineBeanCreator.svelte';

  export let value: string = '';
  export let disabled = false;

  const dispatch = createEventDispatcher<{
    selected: { bean: Bean | null; roasterName: string | null };
  }>();

  let beans: Bean[] = [];
  let roasters: Roaster[] = [];
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
    '--selector-meta-secondary-size': selector.meta.secondarySize,
    '--selector-empty-color': selector.empty.textColor,
    '--selector-detail-bg': selector.detailCard.background,
    '--selector-detail-border': selector.detailCard.borderColor,
    '--selector-detail-radius': selector.detailCard.radius,
    '--selector-detail-padding': selector.detailCard.padding,
    '--selector-detail-title-size': selector.detailTitle.fontSize,
    '--selector-detail-title-color': selector.detailTitle.textColor
  });

  onMount(() => {
    loadData();
    document.addEventListener('click', handleDocumentClick);
  });

  onDestroy(() => {
    document.removeEventListener('click', handleDocumentClick);
  });

  async function loadData() {
    try {
      loading = true;
      error = null;

      const [beansResponse, roastersResponse] = await Promise.all([
        apiClient.getBeans(),
        apiClient.getRoasters()
      ]);

      beans = beansResponse.data;
      roasters = roastersResponse.data;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load beans';
      console.error('Failed to load beans:', err);
    } finally {
      loading = false;
    }
  }

  function handleBeanCreated(event: CustomEvent<Bean>) {
    const newBean = event.detail;
    beans = [newBean, ...beans];
    value = newBean.id;
    dispatch('selected', { bean: newBean, roasterName: getRoasterName(newBean.roaster_id) });
    showCreateForm = false;
  }

  function getRoasterName(roasterId: string): string {
    const roaster = roasters.find(r => r.id === roasterId);
    return roaster?.name || 'Unknown Roaster';
  }

  function toggleOpen() {
    if (disabled) return;
    isOpen = !isOpen;
    if (isOpen) {
      searchTerm = '';
      tick().then(() => searchInput?.focus());
    }
  }

  function selectBean(bean: Bean) {
    value = bean.id;
    isOpen = false;
    searchTerm = '';
    dispatch('selected', { bean, roasterName: getRoasterName(bean.roaster_id) });
  }

  function handleSearchKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && filteredBeans.length > 0) {
      event.preventDefault();
      selectBean(filteredBeans[0]);
    }
  }

  function closeIfEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isOpen = false;
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

  const matchesSearch = (bean: Bean) => {
    const roasterName = getRoasterName(bean.roaster_id);
    return !searchTerm ||
      bean.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roasterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bean.roast_level.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bean.country_of_origin && bean.country_of_origin.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  $: filteredBeans = beans.filter(matchesSearch);
  $: selectedBean = beans.find(bean => bean.id === value) || null;
  $: selectedLabel = selectedBean ? selectedBean.name : 'Select a bean...';
</script>

<div class="bean-selector" style={style}>
  {#if loading}
    <div class="loading">Loading beans...</div>
  {:else if error}
    <div class="error">
      Error: {error}
      <button on:click={loadData} class="retry-btn">Retry</button>
    </div>
  {:else if showCreateForm}
    <InlineBeanCreator 
      on:created={handleBeanCreated}
      on:cancel={() => showCreateForm = false}
    />
  {:else}
    <div class="bean-select-row">
      <div class="bean-combobox" class:open={isOpen} bind:this={comboboxRoot}>
        <button
          type="button"
          class="bean-combobox-trigger"
          on:click={toggleOpen}
          on:keydown={closeIfEscape}
          {disabled}
        >
          <span class:selection-placeholder={!selectedBean}>{selectedLabel}</span>
          <span class="chevron">
            <ChevronDown size={16} />
          </span>
        </button>
        {#if isOpen}
          <div class="bean-combobox-panel" on:keydown={closeIfEscape}>
            <div class="search-field">
              <span class="search-icon" aria-hidden="true">
                <MagnifyingGlass size={18} />
              </span>
              <input
                bind:this={searchInput}
                type="text"
                bind:value={searchTerm}
                placeholder="e.g., Ethiopia Yirgacheffe"
                class="bean-search-input"
                {disabled}
                on:keydown={handleSearchKey}
              />
            </div>
            {#if beans.length === 0}
              <div class="combobox-empty">
                <p>No beans available yet.</p>
                <button type="button" on:click={openCreateForm} class="btn-primary" {disabled}>
                  Add Your First Bean
                </button>
              </div>
            {:else if filteredBeans.length === 0}
              <div class="combobox-empty">
                <p>No beans match your search.</p>
                <button type="button" on:click={() => { searchTerm = ''; }} class="btn-secondary" {disabled}>
                  Clear Search
                </button>
              </div>
            {:else}
              <ul class="bean-options">
                {#each filteredBeans as bean}
                  <li>
                    <button
                      type="button"
                      class="bean-option"
                      on:click={() => selectBean(bean)}
                    >
                      <div class="option-header">
                        <span class="option-title">{bean.name}</span>
                        <div class="option-roast">
                          <RoastLevel value={bean.roast_level} size="small" />
                        </div>
                      </div>
                      <span class="option-meta">{getRoasterName(bean.roaster_id)}</span>
                      {#if bean.country_of_origin}
                        <span class="option-meta option-meta--secondary">{bean.country_of_origin}</span>
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
        ariaLabel="Add bean"
        title="Add bean"
        variant="accent"
        disabled={disabled}
      >
        <Plus />
      </IconButton>
    </div>

    {#if selectedBean}
      <div class="selected-bean-details">
        <div class="bean-info">
          <h4>{selectedBean.name}</h4>
          <div class="bean-meta">
            <span class="meta-pill roaster">{getRoasterName(selectedBean.roaster_id)}</span>
            <div class="roast-level">
              <RoastLevel value={selectedBean.roast_level} size="small" />
            </div>
            {#if selectedBean.country_of_origin}
              <span class="meta-pill origin">{selectedBean.country_of_origin}</span>
            {/if}
          </div>
          {#if selectedBean.tasting_notes}
            <p class="tasting-notes">{selectedBean.tasting_notes}</p>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .bean-selector {
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

  .bean-select-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .bean-combobox {
    position: relative;
    flex: 1;
  }

  .bean-combobox-trigger {
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

  .bean-combobox-trigger:focus-visible {
    outline: var(--selector-trigger-focus, 2px solid var(--accent-primary));
    outline-offset: var(--selector-trigger-focus-offset, 2px);
  }

  .bean-combobox-trigger:disabled {
    background: var(--selector-trigger-disabled-bg, var(--bg-surface-paper-secondary));
    cursor: not-allowed;
  }

  .chevron {
    color: var(--text-ink-muted);
    display: inline-flex;
    align-items: center;
  }

  .bean-combobox-panel {
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

  .bean-search-input {
    width: 100%;
    font-size: 16px;
    padding: 0.6rem 0.75rem 0.6rem 2.3rem;
  }

  .selection-placeholder {
    color: var(--text-ink-placeholder);
  }

  .bean-options {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 240px;
    overflow-y: auto;
  }

  .bean-option {
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
    gap: 0.2rem;
  }

  .bean-option:hover {
    background: var(--selector-option-hover-bg, rgba(214, 199, 174, 0.24));
    border-color: var(--selector-option-hover-border, rgba(123, 94, 58, 0.25));
  }

  .option-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .option-title {
    font-weight: 600;
    font-size: var(--selector-option-title-size, 1rem);
  }

  .option-roast {
    display: flex;
    align-items: center;
  }

  .option-meta {
    font-size: var(--selector-meta-size, 0.85rem);
    color: var(--selector-meta-color, var(--text-ink-muted));
  }

  .option-meta--secondary {
    font-size: var(--selector-meta-secondary-size, 0.78rem);
    opacity: 0.75;
  }

  .combobox-empty {
    text-align: center;
    color: var(--selector-empty-color, var(--text-ink-muted));
    padding: 0.5rem 0 0.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .selected-bean-details {
    margin-top: 0.75rem;
    background: var(--selector-detail-bg, var(--bg-surface-paper-secondary));
    border: 1px solid var(--selector-detail-border, var(--border-subtle));
    border-radius: var(--selector-detail-radius, var(--radius-md));
    padding: var(--selector-detail-padding, 1rem);
  }

  .bean-info h4 {
    margin: 0 0 0.5rem 0;
    color: var(--selector-detail-title-color, var(--text-ink-primary));
    font-size: var(--selector-detail-title-size, 1.1rem);
  }

  .bean-meta {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .meta-pill {
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    font-size: var(--selector-meta-size, 0.8rem);
    font-weight: 500;
  }

  .roaster {
    background: var(--bg-surface-paper-secondary);
    color: var(--text-ink-secondary);
  }

  .roast-level {
    display: flex;
    align-items: center;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    background: rgba(138, 106, 62, 0.18);
  }

  .origin {
    background: rgba(85, 98, 74, 0.18);
    color: var(--semantic-success);
  }

  .tasting-notes {
    margin: 0;
    color: var(--text-ink-secondary);
    font-size: 0.9rem;
    line-height: 1.4;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .bean-select-row {
      flex-direction: column;
      align-items: stretch;
    }

    .bean-meta {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>
