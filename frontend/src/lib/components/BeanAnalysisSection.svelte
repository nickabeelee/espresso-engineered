<script lang="ts">
  import { onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { apiClient } from "$lib/api-client";
  import { barista } from "$lib/auth";
  import ScatterPlot from "./ScatterPlot.svelte";
  import ErrorDisplay from "./ErrorDisplay.svelte";
  import BeanAnalysisFilters from "$lib/components/BeanAnalysisFilters.svelte";
  import Popover from "$lib/components/Popover.svelte";
  import { ArrowTopRightOnSquareMini } from "$lib/icons";
  import type { Bean, Bag } from "@shared/types";
  import { recordListShell } from "$lib/ui/components/card";
  import { colorCss } from "$lib/ui/foundations/color";
  import { textStyles } from "$lib/ui/foundations/typography";
  import { toStyleString } from "$lib/ui/style";
  import { vizTheme } from "$lib/ui/viz/theme";
  import type {
    BrewDataPoint,
    ScatterPlotConfig,
    RecencyPeriod,
  } from "$lib/ui/viz/d3-integration";

  // Props
  export let selectedBean: Bean | null = null;
  export let selectedBag: Bag | null = null;
  export let includeCommunity = false;
  export let recencyFilter: RecencyPeriod = "M";
  export let showInlineFilters = true;

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
  let hasLoadedOnce = false;
  let isRefreshing = false;
  let defaultsLoading = false;
  let defaultsPromise: Promise<void> | null = null;
  let ratioChartCard: HTMLDivElement | null = null;
  let chartCardWidth = 0;
  let cardResizeObserver: ResizeObserver | null = null;
  let ratioValues: number[] = [];
  let timeValues: number[] = [];
  let ratioRange = "—";
  let timeRange = "—";
  let activeChart: "ratio" | "time" = "ratio";
  const recencyLabels: Record<RecencyPeriod, string> = {
    "2D": "the last 2 days",
    W: "the last week",
    M: "the last month",
    "3M": "the last 3 months",
    Y: "the last year",
  };
  let analysisFilterSummary = "";
  let filtersPopoverOpen = false;

  const sectionTitleStyle = toStyleString({
    ...textStyles.headingSecondary,
    color: colorCss.text.ink.primary,
    margin: "0 0 0.5rem 0",
  });

  const voiceLineStyle = toStyleString({
    ...textStyles.voice,
    color: colorCss.text.ink.muted,
    margin: 0,
  });

  const analysisShellStyle = toStyleString({
    "--record-list-bg": recordListShell.background,
    "--record-list-border": recordListShell.borderColor,
    "--record-list-border-width": recordListShell.borderWidth,
    "--record-list-border-style": recordListShell.borderStyle,
    "--record-list-radius": recordListShell.borderRadius,
    "--record-list-padding": recordListShell.padding,
  });

  let lastFiltersKey = "";

  // Chart configurations
  const chartConfig: ScatterPlotConfig = {
    width: 320,
    height: 220,
    margin: { top: 12, right: 16, bottom: 32, left: 36 },
    showYAxisLabels: true,
    responsive: false,
  };

  // Transform analysis data to scatter plot format
  function transformToScatterData(
    data: AnalysisPoint[],
    xField: "x_ratio" | "x_brew_time",
  ): BrewDataPoint[] {
    return data.flatMap((item) => {
      const rawX = item[xField];
      const rawY = item.y_rating;
      if (
        rawX === null ||
        rawX === undefined ||
        rawY === null ||
        rawY === undefined
      ) {
        return [];
      }
      const x = Number(rawX);
      const y = Number(rawY);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return [];
      }
      return [
        {
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
            name: item.name || item.bag_name || "Brew",
          } as Brew,
        },
      ];
    });
  }

  // Reactive data transformations
  $: ratioData = transformToScatterData(analysisData, "x_ratio");
  $: brewTimeData = transformToScatterData(analysisData, "x_brew_time");

  onDestroy(() => {
    cardResizeObserver?.disconnect();
    cardResizeObserver = null;
  });

  function initCardObserver() {
    if (!ratioChartCard || cardResizeObserver || !("ResizeObserver" in window))
      return;
    cardResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          chartCardWidth = entry.contentRect.width;
        }
      }
    });
    cardResizeObserver.observe(ratioChartCard);
  }

  $: if (ratioChartCard) {
    initCardObserver();
  }

  async function loadAnalysisData() {
    try {
      if (!selectedBag && !selectedBean) {
        analysisData = [];
        error = null;
        loading = false;
        isRefreshing = false;
        return;
      }

      if (analysisData.length > 0) {
        isRefreshing = true;
      } else {
        loading = true;
      }
      error = null;

      const params: any = { recency: recencyFilter };

      if (selectedBag) {
        params.bag_id = selectedBag.id;
      } else if (selectedBean) {
        params.bean_id = selectedBean.id;
      }

      const response = await apiClient.getBrewAnalysis({
        ...params,
        include_community: includeCommunity,
      });
      analysisData = response.data;
      hasLoadedOnce = true;
    } catch (err) {
      error =
        err instanceof Error ? err.message : "Failed to load analysis data";
      console.error("Failed to load analysis data:", err);
    } finally {
      loading = false;
      isRefreshing = false;
    }
  }

  $: {
    const nextKey = `${selectedBag?.id ?? "none"}|${selectedBean?.id ?? "none"}|${includeCommunity}|${recencyFilter}`;
    if (nextKey !== lastFiltersKey) {
      lastFiltersKey = nextKey;
      loadAnalysisData();
    }
  }

  async function loadDefaultSelection() {
    if (!$barista?.id) return;
    defaultsLoading = true;
    try {
      const brewsResponse = await apiClient.getBrews(
        { barista_id: $barista.id },
        { limit: 1 },
      );
      const recentBrews = brewsResponse.data;
      if (recentBrews.length === 0) return;
      const mostRecentBrew = recentBrews[0];
      if (!mostRecentBrew.bag_id) return;
      const bagResponse = await apiClient.getBag(mostRecentBrew.bag_id);
      const bag = bagResponse.data;
      if (!bag) return;
      selectedBag = bag;
      if (bag.bean_id) {
        const beanResponse = await apiClient.getBean(bag.bean_id);
        if (beanResponse.data) {
          selectedBean = beanResponse.data;
        }
      }
    } catch (err) {
      console.error("Failed to load default analysis selection:", err);
    } finally {
      defaultsLoading = false;
    }
  }

  $: if (
    browser &&
    $barista?.id &&
    !selectedBag &&
    !selectedBean &&
    !defaultsPromise
  ) {
    defaultsPromise = loadDefaultSelection();
  }

  function formatFilterSummary({
    selectedBag,
    selectedBean,
    includeCommunity,
    recencyFilter,
    baristaId,
  }: {
    selectedBag: Bag | null;
    selectedBean: Bean | null;
    includeCommunity: boolean;
    recencyFilter: RecencyPeriod;
    baristaId: string | null;
  }) {
    const recencyLabel = recencyLabels[recencyFilter] ?? "the last month";
    const communityText = includeCommunity
      ? "the brews from you and the community"
      : "your brews";
    const beanName = selectedBean?.name ?? null;
    const bagDate = selectedBag?.roast_date
      ? new Date(selectedBag.roast_date).toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
          year: "2-digit",
        })
      : null;
    const bagOwner = selectedBag
      ? selectedBag.owner_id === baristaId
        ? "your"
        : "a community"
      : null;
    const bagPart = selectedBag
      ? bagDate
        ? `${bagOwner} ${bagDate} bag`
        : `${bagOwner} bag`
      : beanName
        ? "all bags"
        : null;

    if (beanName && bagPart) {
      return `I pulled up ${communityText} for ${bagPart} of ${beanName} from ${recencyLabel}.`;
    }
    if (beanName) {
      return `I pulled up ${communityText} for ${beanName} from ${recencyLabel}.`;
    }
    return `I pulled up ${communityText} from ${recencyLabel}.`;
  }

  function formatRange(values: number[], suffix = "") {
    if (values.length === 0) return "No points";
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return "No points";
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
    return value === null ? "—" : value.toString();
  }

  function formatRatio(value: number | null) {
    return value === null ? "—" : `1:${value.toFixed(2)}`;
  }

  function formatBrewTime(value: number | null) {
    return value === null ? "—" : `${Math.round(value)}s`;
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

  function calculateTarget(
    points: BrewDataPoint[],
    fallback: number,
    fallbackBand: number,
  ) {
    if (points.length === 0) {
      return { target: fallback, bandWidth: fallbackBand };
    }

    const ratings = points.map((point) => point.y);
    const threshold = percentile(ratings, 0.75);
    const topPoints =
      threshold === null
        ? points
        : points.filter((point) => point.y >= threshold);
    const pool = topPoints.length >= 3 ? topPoints : points;
    const poolValues = pool.map((point) => point.x);
    const target = median(poolValues) ?? fallback;

    const p10 = percentile(poolValues, 0.1) ?? target;
    const p90 = percentile(poolValues, 0.9) ?? target;
    const spread = Math.max(p90 - p10, fallbackBand);

    return { target, bandWidth: spread };
  }

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

  $: ratioValues = ratioData.map((point) => point.x);
  $: ratioRange = formatRange(ratioValues);
  $: ratioTargetData = calculateTarget(ratioData, 2.0, 0.12);
  $: ratioTarget = ratioTargetData.target;
  $: ratioBandWidth = ratioTargetData.bandWidth;
  $: ratioDomain =
    ratioValues.length > 0 ? undefined : ([1.5, 2.5] as [number, number]);
  $: ratioChartConfig = {
    ...chartConfig,
    width: chartWidth,
    height: chartHeight,
    yDomain: [0, 10] as [number, number],
    xDomain: ratioDomain,
    xTickFormat: (value: number) => `1:${value.toFixed(1)}`,
    xTickCount: 4,
    xDomainPadding: 0.15,
    pointRadius: 5,
    hoverRadius: 7,
    pointFill: (point: BrewDataPoint) =>
      point.brew.barista_id === $barista?.id
        ? colorCss.accent.primary
        : colorCss.text.ink.muted,
    pointStroke: "none",
    targetBand: {
      value: ratioTarget,
      width: ratioBandWidth,
      color: colorCss.semantic.success,
      opacity: 0.22,
    },
    targetLine: {
      value: ratioTarget,
      color: colorCss.semantic.success,
      width: 1.6,
      opacity: 0.85,
      dashArray: "5 4",
    },
    trendLine: {
      enabled: true,
      type: "quadratic",
      color: vizTheme.trendLine.color,
      width: 2,
      opacity: 0.6,
    },
  };

  $: timeValues = brewTimeData.map((point) => point.x);
  $: timeRange = formatRange(timeValues, "s");
  $: timeTargetData = calculateTarget(brewTimeData, 30, 2.5);
  $: timeTarget = timeTargetData.target;
  $: timeBandWidth = timeTargetData.bandWidth;
  $: timeDomain =
    timeValues.length > 0 ? undefined : ([25, 35] as [number, number]);
  $: brewTimeChartConfig = {
    ...chartConfig,
    width: chartWidth,
    height: chartHeight,
    yDomain: [0, 10] as [number, number],
    xDomain: timeDomain,
    xTickFormat: (value: number) => `${Math.round(value)}s`,
    xTickCount: 4,
    xDomainPadding: 0.15,
    pointRadius: 5,
    hoverRadius: 7,
    pointFill: (point: BrewDataPoint) =>
      point.brew.barista_id === $barista?.id
        ? colorCss.accent.primary
        : colorCss.text.ink.muted,
    pointStroke: "none",
    targetBand: {
      value: timeTarget,
      width: timeBandWidth,
      color: colorCss.semantic.success,
      opacity: 0.22,
    },
    targetLine: {
      value: timeTarget,
      color: colorCss.semantic.success,
      width: 1.6,
      opacity: 0.85,
      dashArray: "5 4",
    },
    trendLine: {
      enabled: true,
      type: "quadratic",
      color: vizTheme.trendLine.color,
      width: 2,
      opacity: 0.6,
    },
  };

  $: analysisFilterSummary = formatFilterSummary({
    selectedBag,
    selectedBean,
    includeCommunity,
    recencyFilter,
    baristaId: $barista?.id ?? null,
  });

  $: showBlockingLoading =
    (loading && !hasLoadedOnce && analysisData.length === 0) ||
    (defaultsLoading && !selectedBag && !selectedBean);
</script>

<section class="bean-analysis-section">
  <div class="section-header">
    <div class="section-header-text">
      <h2 style={sectionTitleStyle}>Bean Analysis</h2>
      <p class="voice-text" style={voiceLineStyle}>
        Small shifts leave a trace.
      </p>
    </div>
  </div>

  <div class="analysis-shell" style={analysisShellStyle}>
    {#if showBlockingLoading}
      <div class="analysis-loading">
        <div class="loading-circle" aria-hidden="true"></div>
        <p class="voice-text loading-message" style={voiceLineStyle}>
          Loading analysis data...
        </p>
      </div>
    {:else if error}
      <ErrorDisplay {error} />
    {:else}
      <div class="analysis-mobile-tools">
        <Popover
          bind:open={filtersPopoverOpen}
          align="start"
          contentLabel="Analysis filters"
          contentOverflow="visible"
        >
          <svelte:fragment slot="trigger" let:toggle let:open>
            <button
              type="button"
              class="filter-trigger"
              aria-haspopup="dialog"
              aria-expanded={open}
              on:click={toggle}
            >
              Filters
            </button>
          </svelte:fragment>
          <svelte:fragment slot="content">
            <div class="analysis-popover-header">
              <h3>Filters</h3>
              <p>Refine the analysis view</p>
            </div>
            <BeanAnalysisFilters
              variant="popover"
              bind:selectedBean
              bind:selectedBag
              bind:includeCommunity
              bind:recencyFilter
            />
          </svelte:fragment>
        </Popover>
        <div class="chart-toggle" role="tablist" aria-label="Select chart">
          <button
            type="button"
            class="chart-toggle-button"
            class:active={activeChart === "ratio"}
            role="tab"
            aria-selected={activeChart === "ratio"}
            on:click={() => (activeChart = "ratio")}
          >
            Ratio
          </button>
          <button
            type="button"
            class="chart-toggle-button"
            class:active={activeChart === "time"}
            role="tab"
            aria-selected={activeChart === "time"}
            on:click={() => (activeChart = "time")}
          >
            Brew time
          </button>
        </div>
      </div>
      <p class="analysis-mobile-summary voice-text" style={voiceLineStyle}>
        {analysisFilterSummary}
      </p>

      {#if showInlineFilters}
        <BeanAnalysisFilters
          variant="inline"
          bind:selectedBean
          bind:selectedBag
          bind:includeCommunity
          bind:recencyFilter
        />
      {/if}

      {#if analysisData.length === 0}
        <div class="empty-state">
          <p class="voice-text" style={voiceLineStyle}>{emptyStateMessage}</p>
        </div>
      {:else}
        <div class="charts-container" class:is-refreshing={isRefreshing}>
          <div
            class="chart-wrapper"
            class:is-hidden={activeChart !== "ratio"}
            bind:this={ratioChartCard}
            aria-hidden={activeChart !== "ratio"}
          >
            <div class="chart-header">
              <span class="chart-label">Rating vs. Ratio</span>
              <span class="chart-value">{formatRatioValue(ratioTarget)}</span>
              <span class="chart-debug">Range: {ratioRange}</span>
            </div>
            <ScatterPlot
              data={ratioData}
              config={ratioChartConfig}
              highlightedBagId={selectedBag?.id || null}
            />
          </div>

          <div
            class="chart-wrapper"
            class:is-hidden={activeChart !== "time"}
            aria-hidden={activeChart !== "time"}
          >
            <div class="chart-header">
              <span class="chart-label">Rating vs. Brew Time</span>
              <span class="chart-value">{formatTimeValue(timeTarget)}</span>
              <span class="chart-debug">Range: {timeRange}</span>
            </div>
            <ScatterPlot
              data={brewTimeData}
              config={brewTimeChartConfig}
              highlightedBagId={selectedBag?.id || null}
            />
          </div>
          {#if isRefreshing}
            <div class="analysis-refresh-overlay" aria-hidden="true">
              <div class="loading-circle" aria-hidden="true"></div>
            </div>
          {/if}
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
                  <td class="analysis-brew-cell">
                    <a
                      class="analysis-brew-link"
                      href={`/brews/${brew.id}`}
                      aria-label={`View ${brew.name || brew.bag_name || "brew"}`}
                      title="View brew details"
                    >
                      <ArrowTopRightOnSquareMini />
                    </a>
                    <span>{brew.name || brew.bag_name || "Brew"}</span>
                  </td>
                  <td>{formatRating(brew.y_rating)}</td>
                  <td>{formatRatio(brew.x_ratio)}</td>
                  <td>{formatBrewTime(brew.x_brew_time)}</td>
                  <td>{brew.grind_setting || "—"}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="analysis-list">
          {#each analysisData as brew}
            <a class="analysis-list-item" href={`/brews/${brew.id}`}>
              <div class="analysis-list-title">
                {brew.name || brew.bag_name || "Brew"}
              </div>
              <div class="analysis-list-meta">
                Rating {formatRating(brew.y_rating)} · Ratio {formatRatio(
                  brew.x_ratio,
                )} · Time {formatBrewTime(brew.x_brew_time)}
                {#if brew.grind_setting}
                  · Grind {brew.grind_setting}
                {/if}
              </div>
            </a>
          {/each}
        </div>

        <div class="analysis-footer">
          <a class="back-to-top" href="#home-top">Back to top</a>
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
    border: var(--record-list-border-width, 1px)
      var(--record-list-border-style, solid)
      var(--record-list-border, rgba(123, 94, 58, 0.2));
  }

  .analysis-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
    padding: 2.5rem 1rem;
    text-align: center;
  }

  .loading-circle {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 3px solid rgba(214, 199, 174, 0.25);
    border-top-color: var(--accent-primary);
    animation: spin 0.9s linear infinite;
  }

  .loading-message {
    font-size: 0.95rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
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

  .analysis-mobile-tools {
    display: none;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .analysis-mobile-summary {
    display: none;
    margin: 0;
    padding-bottom: 1.5rem;
  }

  .analysis-popover-header {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    margin-bottom: 1rem;
  }

  .analysis-popover-header h3 {
    margin: 0;
    color: var(--text-ink-primary);
    font-size: 1rem;
    font-family:
      "IBM Plex Sans",
      system-ui,
      -apple-system,
      sans-serif;
  }

  .analysis-popover-header p {
    margin: 0;
    color: var(--text-ink-muted);
    font-size: 0.85rem;
    font-family:
      "IBM Plex Sans",
      system-ui,
      -apple-system,
      sans-serif;
  }

  .filter-trigger {
    border: 1px solid var(--border-subtle);
    background: var(--bg-surface-paper-secondary);
    color: var(--text-ink-secondary);
    border-radius: var(--radius-md);
    padding: 0.5rem 0.95rem;
    font-size: 0.9rem;
    font-family:
      "IBM Plex Sans",
      system-ui,
      -apple-system,
      sans-serif;
    cursor: pointer;
  }

  .chart-toggle {
    display: inline-flex;
    gap: 0.5rem;
    border-radius: 999px;
    border: 1px solid rgba(123, 94, 58, 0.3);
    padding: 0.2rem;
    background: rgba(123, 94, 58, 0.12);
  }

  .chart-toggle-button {
    border: none;
    background: transparent;
    color: var(--text-ink-secondary);
    padding: 0.35rem 0.85rem;
    border-radius: 999px;
    font-size: 0.85rem;
    cursor: pointer;
    font-family:
      "IBM Plex Sans",
      system-ui,
      -apple-system,
      sans-serif;
  }

  .chart-toggle-button.active {
    background: var(--accent-primary);
    color: var(--text-ink-inverted);
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
    position: relative;
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

  .charts-container.is-refreshing .chart-wrapper {
    opacity: 0.45;
  }

  .analysis-refresh-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 250, 242, 0.65);
    border-radius: var(--radius-md);
    pointer-events: none;
  }

  .chart-header {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .chart-label {
    font-family:
      "IBM Plex Sans",
      system-ui,
      -apple-system,
      sans-serif;
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
    font-family:
      "IBM Plex Sans",
      system-ui,
      -apple-system,
      sans-serif;
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
    font-family:
      "IBM Plex Sans",
      system-ui,
      -apple-system,
      sans-serif;
  }

  .analysis-table th,
  .analysis-table td {
    padding: 0.75rem 0.9rem;
    text-align: left;
    font-size: 0.85rem;
    color: var(--text-ink-secondary);
    border-bottom: 1px solid rgba(123, 94, 58, 0.12);
  }

  .analysis-brew-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .analysis-brew-link {
    display: inline-flex;
    align-items: center;
    color: inherit;
  }

  .analysis-brew-link :global(svg) {
    width: 16px;
    height: 16px;
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

  .analysis-list {
    display: none;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .analysis-list-item {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.85rem 1rem;
    border-radius: var(--radius-md);
    border: 1px solid rgba(123, 94, 58, 0.2);
    background: var(--bg-surface-paper);
    color: inherit;
    text-decoration: none;
  }

  .analysis-list-title {
    font-family: "Libre Baskerville", serif;
    font-size: 1rem;
    color: var(--text-ink-primary);
  }

  .analysis-list-meta {
    font-family:
      "IBM Plex Sans",
      system-ui,
      -apple-system,
      sans-serif;
    font-size: 0.85rem;
    color: var(--text-ink-muted);
  }

  .analysis-footer {
    display: flex;
    justify-content: center;
    margin-top: 1.5rem;
  }

  .back-to-top {
    font-family:
      "IBM Plex Sans",
      system-ui,
      -apple-system,
      sans-serif;
    font-size: 0.85rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-ink-muted);
  }

  @media (max-width: 768px) {
    .analysis-shell {
      padding: 0;
      background: transparent;
      border: none;
    }

    .analysis-mobile-tools {
      display: flex;
    }

    .analysis-mobile-summary {
      display: block;
    }

    .charts-container {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .chart-wrapper.is-hidden {
      display: none;
    }

    .analysis-table {
      display: none;
    }

    .analysis-list {
      display: flex;
    }
  }

  @media (min-width: 769px) {
    .chart-wrapper.is-hidden {
      display: flex;
    }
  }
</style>
