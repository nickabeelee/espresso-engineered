<script lang="ts">
  import { onMount, onDestroy, tick, createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { barista } from '$lib/auth';
  import ScatterPlot from './ScatterPlot.svelte';
  import LoadingIndicator from './LoadingIndicator.svelte';
  import ErrorDisplay from './ErrorDisplay.svelte';
  import { ChevronDown } from '$lib/icons';
  import { gsap } from '$lib/ui/animations';
  import type { Bean, Bag, Brew } from '@shared/types';
  import { recordListShell } from '$lib/ui/components/card';
  import { selector } from '$lib/ui/components/selector';
  import { colorCss } from '$lib/ui/foundations/color';
  import { textStyles, fontFamilies } from '$lib/ui/foundations/typography';
  import { toStyleString } from '$lib/ui/style';
  import type { BrewDataPoint, ScatterPlotConfig, RecencyPeriod } from '$lib/ui/viz/d3-integration';

  // Props
  export let selectedBean: Bean | null = null;
  export let selectedBag: Bag | null = null;

  // Events
  const dispatch = createEventDispatcher<{
    beanChange: { bean: Bean | null };
    bagChange: { bag: Bag | null };
  }>();

  // Component state
  let loading = true;
  let error: string | null = null;
  type AnalysisPoint = {
    id: string;
    x_ratio: number | null;
    x_brew_time: number | null;
    y_rating: number | null;
    bag_id: string;
    bag_name?: string;
    date: string;
  };

  let analysisData: AnalysisPoint[] = [];
  let recencyFilter: RecencyPeriod = 'M'; // Default to 1 month
  let availableBags: Bag[] = [];
  let availableBeans: Bean[] = [];
  let selectorRoot: HTMLDivElement | null = null;
  let beanMenuOpen = false;
  let bagMenuOpen = false;
  let chartsShell: HTMLDivElement | null = null;
  let chartsWidth = 0;
  let resizeObserver: ResizeObserver | null = null;
  let recencyTrack: HTMLDivElement | null = null;
  let recencyIndicator: HTMLDivElement | null = null;
  let recencyResizeObserver: ResizeObserver | null = null;
  const recencyButtons = new Map<RecencyPeriod, HTMLButtonElement>();
  let recencyHasPositioned = false;
  let recencyAnimating = false;

  const sectionTitleStyle = toStyleString({
    ...textStyles.headingSecondary,
    color: colorCss.text.ink.primary,
    margin: '0 0 0.5rem 0'
  });

  const chartTitleStyle = toStyleString({
    ...textStyles.headingTertiary,
    color: colorCss.text.ink.primary,
    margin: 0,
    textAlign: 'center'
  });

  const voiceLineStyle = toStyleString({
    ...textStyles.voice,
    color: colorCss.text.ink.muted,
    margin: 0
  });

  const analysisShellStyle = toStyleString({
    '--record-list-bg': recordListShell.background,
    '--record-list-border': recordListShell.borderColor,
    '--record-list-border-width': recordListShell.borderWidth,
    '--record-list-border-style': recordListShell.borderStyle,
    '--record-list-radius': recordListShell.borderRadius,
    '--record-list-padding': recordListShell.padding
  });

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

  // Recency filter options
  const recencyOptions = [
    { value: '2D' as RecencyPeriod, label: '2 Days' },
    { value: 'W' as RecencyPeriod, label: 'Week' },
    { value: 'M' as RecencyPeriod, label: 'Month' },
    { value: '3M' as RecencyPeriod, label: '3 Months' },
    { value: 'Y' as RecencyPeriod, label: 'Year' }
  ];

  // Chart configurations
  const chartConfig: ScatterPlotConfig = {
    width: 320,
    height: 220,
    margin: { top: 20, right: 20, bottom: 40, left: 20 },
    showYAxisLabels: false, // Per requirements: omit vertical axis labels
    responsive: true
  };

  // Transform analysis data to scatter plot format
  function transformToScatterData(data: AnalysisPoint[], xField: 'x_ratio' | 'x_brew_time'): BrewDataPoint[] {
    return data
      .filter(item => item[xField] !== null && item.y_rating !== null)
      .map(item => ({
        id: item.id,
        x: item[xField],
        y: item.y_rating,
        bagId: item.bag_id,
        date: new Date(item.date),
        brew: {
          id: item.id,
          created_at: item.date,
          rating: item.y_rating,
          ratio: item.x_ratio,
          brew_time_s: item.x_brew_time,
          name: item.bag_name || 'Brew'
        } as Brew
      }));
  }

  // Reactive data transformations
  $: ratioData = transformToScatterData(analysisData, 'x_ratio');
  $: brewTimeData = transformToScatterData(analysisData, 'x_brew_time');

  onMount(async () => {
    await loadInitialData();
    initResizeObserver();
    await tick();
    syncRecencyIndicator(recencyFilter);
    document.addEventListener('click', handleDocumentClick);
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
    recencyResizeObserver?.disconnect();
    recencyResizeObserver = null;
    document.removeEventListener('click', handleDocumentClick);
  });

  function initResizeObserver() {
    if (!chartsShell || resizeObserver || !('ResizeObserver' in window)) return;
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          chartsWidth = entry.contentRect.width;
        }
      }
    });
    resizeObserver.observe(chartsShell);
  }

  function initRecencyObserver() {
    if (!recencyTrack || recencyResizeObserver || !('ResizeObserver' in window)) return;
    recencyResizeObserver = new ResizeObserver(() => {
      syncRecencyIndicator(recencyFilter);
    });
    recencyResizeObserver.observe(recencyTrack);
  }

  $: if (chartsShell) {
    initResizeObserver();
  }

  $: if (recencyTrack) {
    initRecencyObserver();
  }

  async function loadInitialData() {
    try {
      loading = true;
      error = null;

      const [beansResponse, bagsResponse] = await Promise.all([
        apiClient.getBeans(),
        apiClient.getBags()
      ]);

      availableBeans = beansResponse.data;
      availableBags = bagsResponse.data;

      // Load user's last used bag as default selection
      const baristaId = $barista?.id;
      if (baristaId && !selectedBag && !selectedBean) {
        const brewsResponse = await apiClient.getBrews({ barista_id: baristaId });
        const recentBrews = brewsResponse.data;

        if (recentBrews.length > 0) {
          const mostRecentBrew = recentBrews[0];
          let bag = availableBags.find(item => item.id === mostRecentBrew.bag_id) || null;

          if (!bag) {
            const bagResponse = await apiClient.getBag(mostRecentBrew.bag_id);
            bag = bagResponse.data || null;
          }

          if (bag) {
            selectedBag = bag;
            selectedBean = availableBeans.find(item => item.id === bag.bean_id) || null;
            dispatch('bagChange', { bag: selectedBag });
            dispatch('beanChange', { bean: selectedBean });
          }
        }
      }

      if (selectedBag && !selectedBean) {
        selectedBean = availableBeans.find(item => item.id === selectedBag.bean_id) || null;
        dispatch('beanChange', { bean: selectedBean });
      }

      // Load analysis data with current selection
      await loadAnalysisData();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load analysis data';
      console.error('Failed to load initial data:', err);
    } finally {
      loading = false;
    }
  }

  async function loadAnalysisData() {
    try {
      if (!selectedBag && !selectedBean) {
        analysisData = [];
        return;
      }

      const params: any = { recency: recencyFilter };
      
      if (selectedBag) {
        params.bag_id = selectedBag.id;
      } else if (selectedBean) {
        params.bean_id = selectedBean.id;
      }

      const response = await apiClient.getBrewAnalysis(params);
      analysisData = response.data;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load analysis data';
      console.error('Failed to load analysis data:', err);
    }
  }

  async function handleRecencyChange(period: RecencyPeriod) {
    if (recencyFilter === period) return;
    recencyFilter = period;
    await tick();
    recencyAnimating = true;
    animateRecencyIndicator(period);
    loadAnalysisData();
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
    dispatch('beanChange', { bean: selectedBean });
    dispatch('bagChange', { bag: null });
    loadAnalysisData();
  }

  function selectBag(bag: Bag | null) {
    bagMenuOpen = false;
    selectedBag = bag;
    if (bag) {
      selectedBean = availableBeans.find(item => item.id === bag.bean_id) || selectedBean;
      dispatch('beanChange', { bean: selectedBean });
    }
    dispatch('bagChange', { bag: selectedBag });
    loadAnalysisData();
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

  $: beanBags = selectedBean
    ? availableBags.filter(bag => bag.bean_id === selectedBean?.id)
    : [];

  $: chartColumns = chartsWidth < 720 ? 1 : 2;
  $: chartGap = chartColumns === 1 ? 0 : 32;
  $: chartWidth = chartsWidth
    ? Math.max(280, Math.floor((chartsWidth - chartGap) / chartColumns))
    : chartConfig.width;
  $: chartHeight = Math.round(chartWidth * 0.68);

  // Voice message for empty state
  $: emptyStateMessage = getEmptyStateMessage();

  function getEmptyStateMessage(): string {
    if (selectedBag) {
      return "Not enough data to show patterns for this bag yet.";
    } else if (selectedBean) {
      return "Not enough data to show patterns for this bean yet.";
    } else {
      return "Select a bean or bag to see brewing patterns.";
    }
  }

  $: ratioChartConfig = {
    ...chartConfig,
    width: chartWidth,
    height: chartHeight,
    xLabel: 'Ratio (1:x)',
    yLabel: 'Rating',
    xDomain: ratioData.length > 0 ? undefined : [10, 20] as [number, number],
    yDomain: [1, 5] as [number, number]
  };

  $: brewTimeChartConfig = {
    ...chartConfig,
    width: chartWidth,
    height: chartHeight,
    xLabel: 'Brew Time (s)',
    yLabel: 'Rating',
    xDomain: brewTimeData.length > 0 ? undefined : [20, 40] as [number, number],
    yDomain: [1, 5] as [number, number]
  };
</script>

<section class="bean-analysis-section">
  <div class="section-header">
    <div class="section-header-text">
      <h2 style={sectionTitleStyle}>Bean Analysis</h2>
      <p class="voice-text" style={voiceLineStyle}>Small shifts leave a trace.</p>
    </div>
  </div>

  <div class="analysis-shell" style={analysisShellStyle}>
    {#if loading}
      <LoadingIndicator message="Loading analysis data..." />
    {:else if error}
      <ErrorDisplay {error} />
    {:else}
      <div class="analysis-controls" style={selectorStyle} bind:this={selectorRoot}>
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
                    {#each availableBeans as bean (bean.id)}
                      <button
                        type="button"
                        class="cascade-option"
                        on:click={() => selectBean(bean)}
                      >
                        <span class="option-title">{bean.name}</span>
                        <span class="option-meta">{bean.roast_level}</span>
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
                      {#each beanBags as bag (bag.id)}
                        <button
                          type="button"
                          class="cascade-option"
                          on:click={() => selectBag(bag)}
                        >
                          <span class="option-title">{formatBagLabel(bag)}</span>
                          <span class="option-meta">
                            {bag.roast_date ? new Date(bag.roast_date).toLocaleDateString() : 'No roast date'}
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

      {#if analysisData.length === 0}
        <div class="empty-state">
          <p class="voice-text" style={voiceLineStyle}>{emptyStateMessage}</p>
        </div>
      {:else}
        <div class="charts-container" bind:this={chartsShell}>
          <div class="chart-wrapper">
            <h3 style={chartTitleStyle}>Rating vs Ratio</h3>
            <ScatterPlot 
              data={ratioData}
              config={ratioChartConfig}
              highlightedBagId={selectedBag?.id || null}
            />
          </div>
          
          <div class="chart-wrapper">
            <h3 style={chartTitleStyle}>Rating vs Brew Time</h3>
            <ScatterPlot 
              data={brewTimeData}
              config={brewTimeChartConfig}
              highlightedBagId={selectedBag?.id || null}
            />
          </div>
        </div>
      {/if}
    {/if}
  </div>
</section>

<style>
  .bean-analysis-section {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding-top: 0.5rem;
  }

  .analysis-shell {
    padding: var(--record-list-padding, 1.5rem);
    background: var(--record-list-bg, var(--bg-surface-paper-secondary));
    border-radius: var(--record-list-radius, var(--radius-md));
    border: var(--record-list-border-width, 1px) var(--record-list-border-style, solid) var(--record-list-border, rgba(123, 94, 58, 0.2));
  }

  .section-header {
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .section-header-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }


  .analysis-controls {
    margin-bottom: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
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

  .recency-tabs {
    display: inline-flex;
    gap: 0.35rem;
    padding: 0.3rem;
    border-radius: 999px;
    border: 1px solid rgba(123, 94, 58, 0.3);
    background: rgba(123, 94, 58, 0.12);
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

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-ink-muted);
  }

  .empty-state .voice-text {
    font-size: 1.1rem;
  }

  .charts-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: start;
  }

  .chart-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  @media (max-width: 768px) {
    .analysis-shell {
      padding: 1rem;
    }

    .selector-row {
      grid-template-columns: 1fr;
    }

    .charts-container {
      grid-template-columns: 1fr;
      gap: 1.5rem;
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
