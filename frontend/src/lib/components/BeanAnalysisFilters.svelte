<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { barista } from '$lib/auth';
  import { gsap } from '$lib/ui/animations';
  import { selector } from '$lib/ui/components/selector';
  import { fontFamilies } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';
  import { ChevronDown } from '$lib/icons';
  import type { Bean, Bag, Brew } from '@shared/types';
  import type { RecencyPeriod } from '$lib/ui/viz/d3-integration';

  export let selectedBean: Bean | null = null;
  export let selectedBag: Bag | null = null;
  export let includeCommunity = false;
  export let recencyFilter: RecencyPeriod = 'M';
  export let variant: 'inline' | 'sheet' = 'inline';

  let availableBags: Bag[] = [];
  let availableBeans: Bean[] = [];
  let lastUsedByBagId: Record<string, number> = {};
  let lastUsedByBeanId: Record<string, number> = {};
  let selectorRoot: HTMLDivElement | null = null;
  let beanMenuOpen = false;
  let bagMenuOpen = false;
  let recencyTrack: HTMLDivElement | null = null;
  let recencyIndicator: HTMLDivElement | null = null;
  let recencyResizeObserver: ResizeObserver | null = null;
  const recencyButtons = new Map<RecencyPeriod, HTMLButtonElement>();
  let recencyHasPositioned = false;
  let recencyAnimating = false;
  let initialized = false;

  const selectorStyle = toStyleString({
    '--font-ui': fontFamilies.ui,
    '--selector-trigger-padding': selector.trigger.padding,
    '--selector-trigger-border': selector.trigger.borderColor,
    '--selector-trigger-bg': selector.trigger.background,
    '--selector-trigger-color': selector.trigger.textColor,
    '--selector-trigger-radius': selector.trigger.radius,
    '--selector-trigger-font-size': selector.trigger.fontSize,
    '--selector-trigger-focus': selector.trigger.focusRing,
    '--selector-trigger-focus-offset': selector.trigger.focusOffset,
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
    '--selector-empty-color': selector.empty.textColor
  });

  const recencyOptions = [
    { value: '2D' as RecencyPeriod, label: '2 Days' },
    { value: 'W' as RecencyPeriod, label: 'Week' },
    { value: 'M' as RecencyPeriod, label: 'Month' },
    { value: '3M' as RecencyPeriod, label: '3 Months' },
    { value: 'Y' as RecencyPeriod, label: 'Year' }
  ];

  onMount(async () => {
    await loadInitialData();
    document.addEventListener('click', handleDocumentClick);
  });

  onDestroy(() => {
    recencyResizeObserver?.disconnect();
    recencyResizeObserver = null;
    document.removeEventListener('click', handleDocumentClick);
  });

  $: if (recencyTrack) {
    initRecencyObserver();
  }

  $: if (initialized) {
    tick().then(() => syncRecencyIndicator(recencyFilter, true));
  }

  $: beanBags = selectedBean
    ? availableBags.filter(bag => bag.bean_id === selectedBean?.id)
    : [];

  $: sortedBeans = [...availableBeans].sort((a, b) => {
    const lastA = lastUsedByBeanId[a.id] || 0;
    const lastB = lastUsedByBeanId[b.id] || 0;
    if (lastA !== lastB) return lastB - lastA;
    return a.name.localeCompare(b.name);
  });

  $: sortedBeanBags = [...beanBags].sort((a, b) => {
    const lastA = lastUsedByBagId[a.id] || 0;
    const lastB = lastUsedByBagId[b.id] || 0;
    if (lastA !== lastB) return lastB - lastA;
    return (a.name || '').localeCompare(b.name || '');
  });

  async function loadInitialData() {
    try {
      await loadSelectorData();
      await loadRecentDefaults();
      initialized = true;
    } catch (err) {
      console.error('Failed to load analysis filters:', err);
    }
  }

  async function loadSelectorData() {
    const [beansResponse, bagsResponse] = await Promise.all([
      apiClient.getBeans(includeCommunity ? undefined : { my_beans: true }),
      apiClient.getBags({ include_community: includeCommunity })
    ]);

    availableBeans = beansResponse.data;
    availableBags = bagsResponse.data;

    if (!includeCommunity && $barista?.id) {
      availableBags = availableBags.filter(bag => bag.owner_id === $barista?.id);
    }
  }

  async function loadRecentDefaults() {
    const baristaId = $barista?.id;
    if (!baristaId) return;
    const brewsResponse = await apiClient.getBrews({ barista_id: baristaId }, { limit: 250 });
    const recentBrews = brewsResponse.data;
    lastUsedByBagId = getLastUseByBagId(recentBrews);
    lastUsedByBeanId = getLastUseByBeanId(recentBrews, availableBags);

    if (!selectedBag && !selectedBean && recentBrews.length > 0) {
      const mostRecentBrew = recentBrews[0];
      let bag = availableBags.find(item => item.id === mostRecentBrew.bag_id) || null;

      if (!bag) {
        const bagResponse = await apiClient.getBag(mostRecentBrew.bag_id);
        bag = bagResponse.data || null;
      }

      if (bag) {
        selectedBag = bag;
        selectedBean = availableBeans.find(item => item.id === bag.bean_id) || null;
      }
    }

    if (selectedBag && !selectedBean) {
      selectedBean = availableBeans.find(item => item.id === selectedBag.bean_id) || null;
    }
  }

  async function handleRecencyChange(period: RecencyPeriod) {
    if (recencyFilter === period) return;
    recencyFilter = period;
    await tick();
    recencyAnimating = true;
    animateRecencyIndicator(period);
  }

  async function handleCommunityToggle() {
    await loadSelectorData();
    if (!includeCommunity && $barista?.id) {
      if (selectedBag && selectedBag.owner_id !== $barista?.id) {
        selectedBag = null;
      }
      if (selectedBean) {
        const hasOwnedBag = availableBags.some(bag => bag.bean_id === selectedBean?.id);
        if (!hasOwnedBag) {
          selectedBean = null;
        }
      }
    }
  }

  function handleDocumentClick(event: MouseEvent) {
    if (!selectorRoot) return;
    const path = event.composedPath() as EventTarget[];
    if (!path.includes(selectorRoot)) {
      beanMenuOpen = false;
      bagMenuOpen = false;
    }
  }

  function toggleBeanMenu() {
    beanMenuOpen = !beanMenuOpen;
    if (beanMenuOpen) {
      bagMenuOpen = false;
    }
  }

  function toggleBagMenu() {
    if (!selectedBean) return;
    bagMenuOpen = !bagMenuOpen;
    if (bagMenuOpen) {
      beanMenuOpen = false;
    }
  }

  function selectBean(bean: Bean | null) {
    beanMenuOpen = false;
    bagMenuOpen = false;
    selectedBean = bean;
    selectedBag = null;
  }

  function selectBag(bag: Bag | null) {
    bagMenuOpen = false;
    selectedBag = bag;
    if (bag) {
      selectedBean = availableBeans.find(item => item.id === bag.bean_id) || selectedBean;
    }
  }

  const recencyButtonAction = (node: HTMLButtonElement, period: RecencyPeriod) => {
    recencyButtons.set(period, node);
    if (!recencyHasPositioned) {
      tick().then(() => {
        syncRecencyIndicator(recencyFilter);
        recencyHasPositioned = true;
      });
    }
    return {
      destroy() {
        recencyButtons.delete(period);
      }
    };
  };

  function syncRecencyIndicator(period: RecencyPeriod, force = false) {
    if (!recencyTrack || !recencyIndicator) return;
    if (recencyAnimating && !force) return;
    const button = recencyButtons.get(period);
    if (!button) return;
    const left = button.offsetLeft;
    const top = button.offsetTop;
    gsap.set(recencyIndicator, {
      x: left,
      y: top,
      width: button.offsetWidth,
      height: button.offsetHeight,
      scaleX: 1,
      scaleY: 1
    });
  }

  function animateRecencyIndicator(period: RecencyPeriod) {
    if (!recencyTrack || !recencyIndicator) return;
    const button = recencyButtons.get(period);
    if (!button) return;
    const left = button.offsetLeft;
    const top = button.offsetTop;

    gsap.killTweensOf(recencyIndicator);
    const tl = gsap.timeline({
      onComplete: () => {
        recencyAnimating = false;
        syncRecencyIndicator(period, true);
      }
    });
    tl.to(recencyIndicator, {
      scaleX: 0.92,
      scaleY: 0.78,
      duration: 0.12,
      ease: 'power2.out'
    });
    tl.to(recencyIndicator, {
      x: left,
      y: top,
      width: button.offsetWidth,
      height: button.offsetHeight,
      duration: 0.28,
      ease: 'power3.out'
    }, 0);
    tl.to(recencyIndicator, {
      scaleX: 1,
      scaleY: 1,
      duration: 0.16,
      ease: 'back.out(2)'
    }, '-=0.08');
  }

  function initRecencyObserver() {
    if (!recencyTrack || recencyResizeObserver || !('ResizeObserver' in window)) return;
    recencyResizeObserver = new ResizeObserver(() => {
      syncRecencyIndicator(recencyFilter);
    });
    recencyResizeObserver.observe(recencyTrack);
  }

  function formatBeanLabel(bean: Bean | null) {
    return bean ? bean.name : 'Select a bean';
  }

  function formatBagLabel(bag: Bag | null) {
    if (!bag) return 'All bags';
    if (bag.name) return bag.name;
    if (bag.roast_date) {
      return `Roast ${new Date(bag.roast_date).toLocaleDateString()}`;
    }
    return 'Bag';
  }

  function formatRelativeTime(timestamp: number | null): string | null {
    if (timestamp === null) return null;
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
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

  function getLastUseByBeanId(brews: Brew[], bags: Bag[]): Record<string, number> {
    const bagById = new Map(bags.map(bag => [bag.id, bag]));
    return brews.reduce<Record<string, number>>((acc, brew) => {
      const bag = bagById.get(brew.bag_id);
      if (!bag || !brew.created_at) return acc;
      const brewedAt = new Date(brew.created_at).getTime();
      if (!acc[bag.bean_id] || brewedAt > acc[bag.bean_id]) {
        acc[bag.bean_id] = brewedAt;
      }
      return acc;
    }, {});
  }
</script>

<div
  class="analysis-controls"
  class:inline={variant === 'inline'}
  class:sheet={variant === 'sheet'}
  style={selectorStyle}
  bind:this={selectorRoot}
>
  <div class="filter-row filter-row-left">
    <label class="quick-toggle">
      <input
        type="checkbox"
        bind:checked={includeCommunity}
        on:change={handleCommunityToggle}
        disabled={!$barista?.id}
      />
      <span class="toggle-track" aria-hidden="true"></span>
      <span class="toggle-label">Include community data</span>
    </label>
  </div>

  <div class="selector-row">
    <div class="selector-group">
      <label>Bean</label>
      <div class="cascade-select">
        <button
          type="button"
          class="cascade-trigger"
          on:click={toggleBeanMenu}
        >
          <span class:selection-placeholder={!selectedBean}>{formatBeanLabel(selectedBean)}</span>
          <span class="chevron" aria-hidden="true">
            <ChevronDown size={16} />
          </span>
        </button>
        {#if beanMenuOpen}
          <div class="cascade-panel">
            <button
              type="button"
              class="cascade-option"
              on:click={() => selectBean(null)}
            >
              <span class="option-title">Clear selection</span>
              <span class="option-meta">Pause the analysis view</span>
            </button>
            {#if availableBeans.length === 0}
              <div class="cascade-empty">No beans yet.</div>
            {:else}
              {#each sortedBeans as bean (bean.id)}
                <button
                  type="button"
                  class="cascade-option"
                  on:click={() => selectBean(bean)}
                >
                  <span class="option-title">{bean.name}</span>
                  <span class="option-meta">
                    Roast: {bean.roast_level} | Last used {formatRelativeTime(lastUsedByBeanId[bean.id] ?? null) ?? 'never'}
                  </span>
                </button>
              {/each}
            {/if}
          </div>
        {/if}
      </div>
    </div>
    
    <div class="selector-group">
      <label>Bag</label>
      {#if selectedBean}
        <div class="cascade-select">
          <button
            type="button"
            class="cascade-trigger"
            on:click={toggleBagMenu}
          >
            <span>{formatBagLabel(selectedBag)}</span>
            <span class="chevron" aria-hidden="true">
              <ChevronDown size={16} />
            </span>
          </button>
          {#if bagMenuOpen}
            <div class="cascade-panel">
              <button
                type="button"
                class="cascade-option"
                on:click={() => selectBag(null)}
              >
                <span class="option-title">All bags</span>
                <span class="option-meta">Show every bag for this bean</span>
              </button>
              {#if beanBags.length === 0}
                <div class="cascade-empty">No bags for this bean yet.</div>
              {:else}
                {#each sortedBeanBags as bag (bag.id)}
                  <button
                    type="button"
                    class="cascade-option"
                    on:click={() => selectBag(bag)}
                  >
                    <span class="option-title">{formatBagLabel(bag)}</span>
                    <span class="option-meta">
                      Roast: {bag.roast_date ? new Date(bag.roast_date).toLocaleDateString() : 'Unknown'} | Last used {formatRelativeTime(lastUsedByBagId[bag.id] ?? null) ?? 'never'}
                    </span>
                  </button>
                {/each}
              {/if}
            </div>
          {/if}
        </div>
      {:else}
        <div class="bag-hint">Choose a bean to reveal its bags.</div>
      {/if}
    </div>
  </div>

  <div class="filter-row">
    <div class="filter-group">
      <label>Time Period</label>
      <div class="recency-tabs" role="tablist" aria-label="Recency filter" bind:this={recencyTrack}>
        <span class="recency-indicator" bind:this={recencyIndicator} aria-hidden="true"></span>
        {#each recencyOptions as option}
          <button
            type="button"
            class="recency-tab"
            class:active={recencyFilter === option.value}
            role="tab"
            aria-selected={recencyFilter === option.value}
            title={option.label}
            on:click={() => handleRecencyChange(option.value)}
            use:recencyButtonAction={option.value}
          >
            {option.value}
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .analysis-controls {
    margin-bottom: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .analysis-controls.inline {
    margin-bottom: 2rem;
  }

  .analysis-controls.sheet {
    margin-bottom: 0;
  }

  .cascade-select {
    position: relative;
    width: 100%;
  }

  .cascade-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: var(--selector-trigger-padding);
    border: 1px solid var(--selector-trigger-border);
    border-radius: var(--selector-trigger-radius);
    background: var(--selector-trigger-bg);
    color: var(--selector-trigger-color);
    font-size: var(--selector-trigger-font-size);
    cursor: pointer;
    text-align: left;
    font-family: var(--font-ui);
  }

  .cascade-trigger:focus-visible {
    outline: var(--selector-trigger-focus);
    outline-offset: var(--selector-trigger-focus-offset);
  }

  .selection-placeholder {
    color: var(--text-ink-placeholder);
  }

  .chevron {
    display: inline-flex;
    transition: transform 0.2s ease;
  }

  .cascade-panel {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background: var(--selector-panel-bg);
    border: 1px solid var(--selector-panel-border);
    border-radius: var(--selector-panel-radius);
    box-shadow: var(--selector-panel-shadow);
    padding: var(--selector-panel-padding);
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 280px;
    overflow-y: auto;
  }

  .cascade-option {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: var(--selector-option-padding);
    border-radius: var(--selector-option-radius);
    border: 1px solid transparent;
    background: transparent;
    color: var(--selector-option-color);
    cursor: pointer;
    text-align: left;
    font-family: var(--font-ui);
  }

  .cascade-option:hover,
  .cascade-option:focus-visible {
    background: var(--selector-option-hover-bg);
    border-color: var(--selector-option-hover-border);
  }

  .option-title {
    font-size: var(--selector-option-title-size);
    font-weight: 500;
  }

  .option-meta {
    color: var(--selector-meta-color);
    font-size: var(--selector-meta-size);
  }

  .cascade-empty {
    color: var(--selector-empty-color);
    font-size: var(--selector-meta-size);
    padding: 0.4rem 0.2rem;
  }

  .bag-hint {
    font-size: 0.9rem;
    color: var(--text-ink-muted);
    padding: 0.6rem 0.2rem;
  }

  .selector-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .filter-row {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .filter-row-left {
    justify-content: flex-start;
  }

  .selector-group,
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }

  .selector-group {
    align-items: stretch;
  }

  .selector-group label,
  .filter-group label {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-ink-secondary);
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

  .recency-tabs {
    display: inline-flex;
    gap: 0.35rem;
    padding: 0.3rem;
    border-radius: 999px;
    background: rgba(123, 94, 58, 0.12);
    border: 1px solid rgba(123, 94, 58, 0.3);
    position: relative;
  }

  .recency-tab {
    border: none;
    background: transparent;
    color: var(--text-ink-secondary);
    padding: 0.4rem 0.85rem;
    border-radius: 999px;
    font-size: 0.85rem;
    letter-spacing: 0.02em;
    cursor: pointer;
    font-family: var(--font-ui);
    transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .recency-tab:hover {
    background: rgba(123, 94, 58, 0.2);
  }

  .recency-tab.active {
    color: var(--text-ink-inverted);
  }

  .recency-indicator {
    position: absolute;
    top: 0;
    left: 0;
    background: var(--accent-primary);
    border-radius: 999px;
    z-index: 0;
  }

  @media (max-width: 768px) {
    .analysis-controls.inline {
      display: none;
    }

    .selector-row {
      grid-template-columns: 1fr;
    }

    .recency-tabs {
      width: 100%;
      justify-content: space-between;
    }

    .recency-tab {
      flex: 1;
      text-align: center;
    }
  }
</style>
