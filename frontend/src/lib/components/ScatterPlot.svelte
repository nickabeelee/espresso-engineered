<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { ScatterPlot, type ScatterPlotConfig, type BrewDataPoint } from '$lib/ui/viz/d3-integration';
  
  // Props
  export let data: BrewDataPoint[] = [];
  export let config: ScatterPlotConfig;
  export let highlightedBagId: string | null = null;
  
  // Events
  const dispatch = createEventDispatcher<{
    pointClick: { point: BrewDataPoint };
    pointHover: { point: BrewDataPoint | null };
  }>();
  
  // Component state
  let containerElement: HTMLDivElement;
  let scatterPlot: ScatterPlot | null = null;
  
  // Reactive updates
  $: if (scatterPlot && config) {
    scatterPlot.updateConfig(config);
  }

  $: if (scatterPlot && data) {
    scatterPlot.updateData(data);
  }
  
  $: if (scatterPlot && highlightedBagId !== undefined) {
    scatterPlot.highlightBag(highlightedBagId);
  }
  
  onMount(() => {
    if (containerElement) {
      // Create scatter plot instance
      scatterPlot = new ScatterPlot(containerElement, config);
      
      // Initialize with config + data if available
      if (config) {
        scatterPlot.updateConfig(config);
      }
      if (data.length > 0) {
        scatterPlot.updateData(data);
      }
    }
  });
  
  onDestroy(() => {
    if (scatterPlot) {
      scatterPlot.destroy();
      scatterPlot = null;
    }
  });
</script>

<div 
  bind:this={containerElement}
  class="scatter-plot-container"
  style="width: 100%; height: {config.height}px;"
>
  <!-- D3 chart will be rendered here -->
</div>

<style>
  .scatter-plot-container {
    position: relative;
    overflow: visible;
    width: 100%;
  }
  
  /* Ensure proper styling for D3 elements */
  :global(.scatter-plot-container svg) {
    display: block;
  }
  
  :global(.scatter-plot-container .data-point) {
    transition: r 0.15s ease, opacity 0.15s ease;
  }
  
  :global(.scatter-plot-container .axis) {
    shape-rendering: crispEdges;
  }
  
  :global(.scatter-plot-container .axis path),
  :global(.scatter-plot-container .axis line) {
    fill: none;
    stroke: rgba(123, 94, 58, 0.3);
    stroke-width: 1;
  }
</style>
