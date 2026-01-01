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
    barista_id: string;
    name?: string;
    x_ratio: number | null;
    x_brew_time: number | null;
    y_rating: number | null;
    bag_id: string;
    bag_name?: string;
    grind_setting?: string;
    date: string;
  };

  let analysisData: AnalysisPoint[] = [];
  let recencyFilter: RecencyPeriod = 'M'; // Default to 1 month
  let includeCommunity = false;
  let availableBags: Bag[] = [];
  let availableBeans: Bean[] = [];
  let lastUsedByBagId: Record<string, number> = {};
  let lastUsedByBeanId: Record<string, number> = {};
  let selectorRoot: HTMLDivElement | null = null;
  let beanMenuOpen = false;
  let bagMenuOpen = false;
  let ratioChartCard: HTMLDivElement | null = null;
  let chartCardWidth = 0;
  let cardResizeObserver: ResizeObserver | null = null;
  let recencyTrack: HTMLDivElement | null = null;
  let recencyIndicator: HTMLDivElement | null = null;
  let recencyResizeObserver: ResizeObserver | null = null;
  const recencyButtons = new Map<RecencyPeriod, HTMLButtonElement>();
  let recencyHasPositioned = false;
  let recencyAnimating = false;
  let ratioValues: number[] = [];
  let timeValues: number[] = [];
  let ratioRange = '—';
  let timeRange = '—';

  const sectionTitleStyle = toStyleString({
    ...textStyles.headingSecondary,
    color: colorCss.text.ink.primary,
    margin: '0 0 0.5rem 0'
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
    margin: { top: 12, right: 16, bottom: 32, left: 36 },
    showYAxisLabels: true,
    responsive: false
  };

  // Transform analysis data to scatter plot format
  function transformToScatterData(data: AnalysisPoint[], xField: 'x_ratio' | 'x_brew_time'): BrewDataPoint[] {
    return data.flatMap((item) => {
      const rawX = item[xField];
      const rawY = item.y_rating;
      if (rawX === null || rawX === undefined || rawY === null || rawY === undefined) {
        return [];
      }
      const x = Number(rawX);
      const y = Number(rawY);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return [];
      }
      return [{
        id: item.id,
        x,
        y,
        bagId: item.bag_id,
        date: new Date(item.date),
        brew: {
          id: item.id,
          created_at: item.date,
          barista_id: item.barista_id,
          rating: item.y_rating,
          ratio: item.x_ratio,
          brew_time_s: item.x_brew_time,
          grind_setting: item.grind_setting,
          name: item.name || item.bag_name || 'Brew'
        } as Brew
      }];
    });
  }

  // Reactive data transformations
  $: ratioData = transformToScatterData(analysisData, 'x_ratio');
  $: brewTimeData = transformToScatterData(analysisData, 'x_brew_time');

  onMount(async () => {
    await loadInitialData();
    initCardObserver();
    await tick();
    syncRecencyIndicator(recencyFilter);
    document.addEventListener('click', handleDocumentClick);
  });

  onDestroy(() => {
    cardResizeObserver?.disconnect();
    cardResizeObserver = null;
    recencyResizeObserver?.disconnect();
    recencyResizeObserver = null;
    document.removeEventListener('click', handleDocumentClick);
  });

  function initCardObserver() {
    if (!ratioChartCard || cardResizeObserver || !('ResizeObserver' in window)) return;
    cardResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          chartCardWidth = entry.contentRect.width;
        }
      }
    });
    cardResizeObserver.observe(ratioChartCard);
  }

  function initRecencyObserver() {
    if (!recencyTrack || recencyResizeObserver || !('ResizeObserver' in window)) return;
    recencyResizeObserver = new ResizeObserver(() => {
      syncRecencyIndicator(recencyFilter);
    });
    recencyResizeObserver.observe(recencyTrack);
  }

  $: if (ratioChartCard) {
    initCardObserver();
  }

  $: if (recencyTrack) {
    initRecencyObserver();
  }

  async function loadInitialData() {
    try {
      loading = true;
      error = null;

      await loadSelectorData();

      // Load user's last used bag as default selection
      const baristaId = $barista?.id;
      if (baristaId) {
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

    const response = await apiClient.getBrewAnalysis({
      ...params,
      include_community: includeCommunity
    });
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

  async function handleCommunityToggle() {
    await loadSelectorData();
    if (!includeCommunity && $barista?.id) {
      if (selectedBag && selectedBag.owner_id !== $barista?.id) {
        selectedBag = null;
        dispatch('bagChange', { bag: null });
      }
      if (selectedBean) {
        const hasOwnedBag = availableBags.some(bag => bag.bean_id === selectedBean?.id);
        if (!hasOwnedBag) {
          selectedBean = null;
          dispatch('beanChange', { bean: null });
        }
      }
    }
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

  function formatRange(values: number[], suffix = '') {
    if (values.length === 0) return 'No points';
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return 'No points';
    if (min === max) return `${min}${suffix}`;
    return `${min}${suffix}–${max}${suffix}`;
  }

  function formatRatioValue(value: number) {
    return `1:${value.toFixed(1)}`;
  }

  function formatTimeValue(value: number) {
    return `${Math.round(value)}s`;
  }

  function formatRating(value: number | null) {
    return value === null ? '—' : value.toString();
  }

  function formatRatio(value: number | null) {
    return value === null ? '—' : `1:${value.toFixed(2)}`;
  }

  function formatBrewTime(value: number | null) {
    return value === null ? '—' : `${Math.round(value)}s`;
  }

  function median(values: number[]): number | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  function percentile(values: number[], pct: number): number | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (sorted.length - 1) * pct;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  function calculateTarget(points: BrewDataPoint[], fallback: number, fallbackBand: number) {
    if (points.length === 0) {
      return { target: fallback, bandWidth: fallbackBand };
    }

    const ratings = points.map(point => point.y);
    const threshold = percentile(ratings, 0.75);
    const topPoints = threshold === null
      ? points
      : points.filter(point => point.y >= threshold);
    const pool = topPoints.length >= 3 ? topPoints : points;
    const poolValues = pool.map(point => point.x);
    const target = median(poolValues) ?? fallback;

    const p10 = percentile(poolValues, 0.1) ?? target;
    const p90 = percentile(poolValues, 0.9) ?? target;
    const spread = Math.max(p90 - p10, fallbackBand);

    return { target, bandWidth: spread };
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

  $: chartWidth = Math.max(240, chartCardWidth || chartConfig.width);
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

  $: ratioValues = ratioData.map(point => point.x);
  $: ratioRange = formatRange(ratioValues);
  $: ratioTargetData = calculateTarget(ratioData, 2.0, 0.12);
  $: ratioTarget = ratioTargetData.target;
  $: ratioBandWidth = ratioTargetData.bandWidth;
  $: ratioDomain = ratioValues.length > 0 ? undefined : [1.5, 2.5] as [number, number];
  $: ratioTicks = ratioValues.length > 0
    ? [Math.min(...ratioValues), ratioTarget, Math.max(...ratioValues)]
    : [1.5, ratioTarget, 2.5];

  $: ratioChartConfig = {
    ...chartConfig,
    width: chartWidth,
    height: chartHeight,
    xLabel: 'Ratio',
    yLabel: 'Rating',
    yDomain: [0, 10] as [number, number],
    xTickValues: ratioTicks,
    xDomain: ratioDomain,
    xTickFormat: (value: number) => `1:${value.toFixed(1)}`,
    pointRadius: 5,
    hoverRadius: 7,
    pointFill: (point: BrewDataPoint) =>
      point.brew.barista_id === $barista?.id ? colorCss.accent.primary : colorCss.text.ink.muted,
    pointStroke: 'none',
    targetBand: {
      value: ratioTarget,
      width: ratioBandWidth,
      color: colorCss.semantic.success,
      opacity: 0.22
    }
  };

  $: timeValues = brewTimeData.map(point => point.x);
  $: timeRange = formatRange(timeValues, 's');
  $: timeTargetData = calculateTarget(brewTimeData, 30, 2.5);
  $: timeTarget = timeTargetData.target;
  $: timeBandWidth = timeTargetData.bandWidth;
  $: timeDomain = timeValues.length > 0 ? undefined : [25, 35] as [number, number];
  $: timeTicks = timeValues.length > 0
    ? [Math.min(...timeValues), timeTarget, Math.max(...timeValues)]
    : [25, timeTarget, 35];

  $: brewTimeChartConfig = {
    ...chartConfig,
    width: chartWidth,
    height: chartHeight,
    xLabel: 'Brew Time',
    yLabel: 'Rating',
    yDomain: [0, 10] as [number, number],
    xTickValues: timeTicks,
    xDomain: timeDomain,
    xTickFormat: (value: number) => `${Math.round(value)}s`,
    pointRadius: 5,
    hoverRadius: 7,
    pointFill: (point: BrewDataPoint) =>
      point.brew.barista_id === $barista?.id ? colorCss.accent.primary : colorCss.text.ink.muted,
    pointStroke: 'none',
    targetBand: {
      value: timeTarget,
      width: timeBandWidth,
      color: colorCss.semantic.success,
      opacity: 0.22
    }
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
        <div class="charts-container">
          <div class="chart-wrapper" bind:this={ratioChartCard}>
            <div class="chart-header">
              <span class="chart-label">Ratio</span>
              <span class="chart-value">{formatRatioValue(ratioTarget)}</span>
              <span class="chart-debug">Range: {ratioRange}</span>
            </div>
            <ScatterPlot 
              data={ratioData}
              config={ratioChartConfig}
              highlightedBagId={selectedBag?.id || null}
            />
          </div>
          
          <div class="chart-wrapper">
            <div class="chart-header">
              <span class="chart-label">Brew Time</span>
              <span class="chart-value">{formatTimeValue(timeTarget)}</span>
              <span class="chart-debug">Range: {timeRange}</span>
            </div>
            <ScatterPlot 
              data={brewTimeData}
              config={brewTimeChartConfig}
              highlightedBagId={selectedBag?.id || null}
            />
          </div>
        </div>

        <div class="analysis-table">
          <table>
            <thead>
              <tr>
                <th>Brew</th>
                <th>Rating</th>
                <th>Ratio</th>
                <th>Brew Time</th>
                <th>Grind Setting</th>
              </tr>
            </thead>
            <tbody>
              {#each analysisData as brew}
                <tr>
                  <td>{brew.name || brew.bag_name || 'Brew'}</td>
                  <td>{formatRating(brew.y_rating)}</td>
                  <td>{formatRatio(brew.x_ratio)}</td>
                  <td>{formatBrewTime(brew.x_brew_time)}</td>
                  <td>{brew.grind_setting || '—'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
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
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: clamp(1.25rem, 2vw, 2rem);
    align-items: stretch;
  }

  .chart-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    min-width: 0;
    padding: 1rem 1rem 0.85rem;
    border-radius: var(--radius-md);
    border: 1px solid rgba(123, 94, 58, 0.2);
    background: var(--bg-surface-paper);
  }

  .chart-header {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .chart-label {
    font-family: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
    font-size: 0.85rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-ink-muted);
  }

  .chart-value {
    font-family: "Libre Baskerville", serif;
    font-size: 1.4rem;
    color: var(--text-ink-primary);
  }

  .chart-debug {
    font-family: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
    font-size: 0.75rem;
    color: var(--text-ink-muted);
  }

  .analysis-table {
    margin-top: 1.5rem;
    background: var(--bg-surface-paper);
    border-radius: var(--radius-md);
    border: 1px solid rgba(123, 94, 58, 0.2);
    overflow-x: auto;
  }

  .analysis-table table {
    width: 100%;
    border-collapse: collapse;
    min-width: 520px;
    font-family: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
  }

  .analysis-table th,
  .analysis-table td {
    padding: 0.75rem 0.9rem;
    text-align: left;
    font-size: 0.85rem;
    color: var(--text-ink-secondary);
    border-bottom: 1px solid rgba(123, 94, 58, 0.12);
  }

  .analysis-table th {
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.75rem;
    color: var(--text-ink-muted);
  }

  .analysis-table tbody tr:last-child td {
    border-bottom: none;
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
