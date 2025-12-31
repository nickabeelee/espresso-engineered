<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { apiClient } from '$lib/api-client';
  import { barista } from '$lib/auth';
  import BeanSelector from './BeanSelector.svelte';
  import BagSelector from './BagSelector.svelte';
  import ScatterPlot from './ScatterPlot.svelte';
  import LoadingIndicator from './LoadingIndicator.svelte';
  import ErrorDisplay from './ErrorDisplay.svelte';
  import type { Bean, Bag, Brew } from '@shared/types';
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
  let analysisData: any[] = [];
  let recencyFilter: RecencyPeriod = 'M'; // Default to 1 month
  let lastUsedBag: Bag | null = null;
  let availableBags: Bag[] = [];
  let availableBeans: Bean[] = [];

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
    width: 300,
    height: 250,
    margin: { top: 20, right: 20, bottom: 40, left: 20 },
    showYAxisLabels: false, // Per requirements: omit vertical axis labels
    responsive: true
  };

  // Transform analysis data to scatter plot format
  function transformToScatterData(data: any[], xField: 'x_ratio' | 'x_brew_time'): BrewDataPoint[] {
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

  // Chart configurations with proper domains
  $: ratioChartConfig = {
    ...chartConfig,
    xLabel: 'Ratio (1:x)',
    yLabel: 'Rating',
    xDomain: ratioData.length > 0 ? undefined : [10, 20] as [number, number], // Let D3 calculate or use default
    yDomain: [1, 5] as [number, number] // Rating is always 1-5
  };

  $: brewTimeChartConfig = {
    ...chartConfig,
    xLabel: 'Brew Time (s)',
    yLabel: 'Rating',
    xDomain: brewTimeData.length > 0 ? undefined : [20, 40] as [number, number], // Let D3 calculate or use default
    yDomain: [1, 5] as [number, number] // Rating is always 1-5
  };

  onMount(async () => {
    await loadInitialData();
  });

  async function loadInitialData() {
    try {
      loading = true;
      error = null;

      // Load user's last used bag as default selection
      const baristaId = $barista?.id;
      if (baristaId) {
        const brewsResponse = await apiClient.getBrews({ barista_id: baristaId });
        const recentBrews = brewsResponse.data;
        
        if (recentBrews.length > 0) {
          // Find the most recent brew's bag
          const mostRecentBrew = recentBrews[0];
          const bagResponse = await apiClient.getBag(mostRecentBrew.bag_id);
          lastUsedBag = bagResponse.data || null;
          
          // Set as default selection if no bag is already selected
          if (!selectedBag) {
            selectedBag = lastUsedBag;
            dispatch('bagChange', { bag: selectedBag });
          }
        }
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

  function handleBeanChange(event: CustomEvent<{ bean: Bean | null }>) {
    selectedBean = event.detail.bean;
    selectedBag = null; // Clear bag selection when bean changes
    dispatch('beanChange', { bean: selectedBean });
    dispatch('bagChange', { bag: null });
    loadAnalysisData();
  }

  function handleBagChange(event: CustomEvent<{ bag: Bag | null }>) {
    selectedBag = event.detail.bag;
    dispatch('bagChange', { bag: selectedBag });
    loadAnalysisData();
  }

  function handleRecencyChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    recencyFilter = target.value as RecencyPeriod;
    loadAnalysisData();
  }

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
</script>

<section class="bean-analysis-section">
  <div class="section-header">
    <h2>Bean Analysis</h2>
    <p class="voice-text">Discover patterns in your brewing technique</p>
  </div>

  {#if loading}
    <LoadingIndicator message="Loading analysis data..." />
  {:else if error}
    <ErrorDisplay {error} />
  {:else}
    <div class="analysis-controls">
      <div class="selector-row">
        <div class="selector-group">
          <label for="bean-selector">Bean</label>
          <BeanSelector 
            value={selectedBean?.id || ''}
            on:change={handleBeanChange}
          />
        </div>
        
        <div class="selector-group">
          <label for="bag-selector">Bag</label>
          <BagSelector 
            value={selectedBag?.id || ''}
            on:bagSelected={handleBagChange}
          />
        </div>
      </div>

      <div class="filter-row">
        <div class="filter-group">
          <label for="recency-filter">Time Period</label>
          <select 
            id="recency-filter"
            bind:value={recencyFilter}
            on:change={handleRecencyChange}
            class="recency-select"
          >
            {#each recencyOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    {#if analysisData.length === 0}
      <div class="empty-state">
        <p class="voice-text">{emptyStateMessage}</p>
      </div>
    {:else}
      <div class="charts-container">
        <div class="chart-wrapper">
          <h3>Rating vs Ratio</h3>
          <ScatterPlot 
            data={ratioData}
            config={ratioChartConfig}
            highlightedBagId={selectedBag?.id || null}
          />
        </div>
        
        <div class="chart-wrapper">
          <h3>Rating vs Brew Time</h3>
          <ScatterPlot 
            data={brewTimeData}
            config={brewTimeChartConfig}
            highlightedBagId={selectedBag?.id || null}
          />
        </div>
      </div>
    {/if}
  {/if}
</section>

<style>
  .bean-analysis-section {
    padding: 1.5rem;
    background: var(--bg-surface-paper);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-subtle);
  }

  .section-header {
    margin-bottom: 1.5rem;
  }

  .section-header h2 {
    margin: 0 0 0.5rem 0;
    color: var(--text-ink-primary);
    font-size: 1.5rem;
    font-weight: 600;
  }

  .voice-text {
    margin: 0;
    font-family: 'Libre Baskerville', serif;
    color: var(--text-ink-muted);
    font-size: 0.95rem;
    line-height: 1.4;
  }

  .analysis-controls {
    margin-bottom: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .selector-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .filter-row {
    display: flex;
    justify-content: flex-start;
  }

  .selector-group,
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .selector-group label,
  .filter-group label {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-ink-secondary);
  }

  .recency-select {
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    background: var(--bg-surface-paper);
    color: var(--text-ink-primary);
    font-size: 0.9rem;
    cursor: pointer;
    min-width: 120px;
  }

  .recency-select:focus {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
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

  .chart-wrapper h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-ink-primary);
    text-align: center;
  }

  @media (max-width: 768px) {
    .bean-analysis-section {
      padding: 1rem;
    }

    .selector-row {
      grid-template-columns: 1fr;
    }

    .charts-container {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }
</style>