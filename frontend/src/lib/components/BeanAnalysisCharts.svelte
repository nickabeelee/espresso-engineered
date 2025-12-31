<script lang="ts">
  import { onMount } from 'svelte';
  import ScatterPlot from './ScatterPlot.svelte';
  import { 
    transformBrewsForRatioChart, 
    transformBrewsForTimeChart,
    createAnalysisChartConfig,
    getChartDomains
  } from '$lib/utils/chart-data';
  import type { Brew } from '../../../../shared/types';
  import type { BrewDataPoint, RecencyPeriod } from '$lib/ui/viz/d3-integration';

  // Props
  export let brews: Brew[] = [];
  export let selectedBagId: string | null = null;
  export let recencyFilter: RecencyPeriod = 'M';
  export let containerWidth: number = 600;

  // Reactive data transformations
  $: ratioData = transformBrewsForRatioChart(brews);
  $: timeData = transformBrewsForTimeChart(brews);

  // Chart configurations
  $: ratioConfig = {
    ...createAnalysisChartConfig(containerWidth / 2 - 10, 'ratio', false),
    xDomain: getChartDomains(ratioData, 'x'),
    yDomain: getChartDomains(ratioData, 'y')
  };

  $: timeConfig = {
    ...createAnalysisChartConfig(containerWidth / 2 - 10, 'time', true),
    xDomain: getChartDomains(timeData, 'x'),
    yDomain: getChartDomains(timeData, 'y')
  };

  // Handle empty state
  $: hasData = ratioData.length > 0 || timeData.length > 0;
</script>

<div class="bean-analysis-charts" style="width: {containerWidth}px;">
  {#if hasData}
    <div class="charts-container">
      <div class="chart-wrapper">
        <h3 class="chart-title">Rating vs Ratio</h3>
        <ScatterPlot 
          data={ratioData} 
          config={ratioConfig}
          highlightedBagId={selectedBagId}
        />
      </div>
      
      <div class="chart-wrapper">
        <h3 class="chart-title">Rating vs Brew Time</h3>
        <ScatterPlot 
          data={timeData} 
          config={timeConfig}
          highlightedBagId={selectedBagId}
        />
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <p class="voice-text">Not enough data to show patterns yet. Keep brewing to see your analytics!</p>
    </div>
  {/if}
</div>

<style>
  .bean-analysis-charts {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .charts-container {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .chart-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .chart-title {
    font-family: var(--font-ui);
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-ink-secondary);
    margin: 0;
    text-align: center;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: 2rem;
  }

  .voice-text {
    font-family: 'Libre Baskerville', serif;
    color: var(--text-ink-muted);
    text-align: center;
    margin: 0;
    font-size: 1rem;
    line-height: 1.5;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .charts-container {
      flex-direction: column;
    }
    
    .chart-wrapper {
      width: 100%;
    }
  }
</style>