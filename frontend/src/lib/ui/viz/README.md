# D3 Visualization Framework

This directory contains the D3 integration infrastructure for creating interactive scatter plots and other visualizations within the Espresso Engineered UI framework.

## Overview

The visualization framework provides:
- **ScatterPlot class**: A comprehensive D3-based scatter plot implementation
- **Svelte component wrapper**: Easy integration with SvelteKit applications
- **UI framework integration**: Consistent theming and styling
- **Responsive design**: Automatic adaptation to different screen sizes
- **Interactive features**: Hover tooltips, highlighting, and animations

## Core Components

### ScatterPlot Class (`d3-integration.ts`)

The main D3-based scatter plot implementation with the following features:

- **Responsive design**: Automatically adapts to container size changes
- **Interactive tooltips**: Rich hover information for data points
- **Bag highlighting**: Visual differentiation for specific data subsets
- **Smooth animations**: GSAP-style entrance and transition effects
- **Axis customization**: Configurable axes with UI framework styling
- **Theme integration**: Uses UI framework colors and typography

#### Basic Usage

```typescript
import { ScatterPlot } from '$lib/ui/viz/d3-integration';

const config = {
  width: 400,
  height: 300,
  margin: { top: 20, right: 20, bottom: 40, left: 40 },
  xLabel: 'Brew Ratio',
  yLabel: 'Rating',
  showYAxisLabels: false, // Per requirements: omit vertical axis labels
  responsive: true
};

const scatterPlot = new ScatterPlot(containerElement, config);
scatterPlot.updateData(brewDataPoints);
```

### Svelte Component (`ScatterPlot.svelte`)

A Svelte wrapper that makes the ScatterPlot class easy to use in SvelteKit applications:

```svelte
<script>
  import ScatterPlot from '$lib/components/ScatterPlot.svelte';
  
  export let data = [];
  export let config = { /* chart config */ };
  export let highlightedBagId = null;
</script>

<ScatterPlot {data} {config} {highlightedBagId} />
```

### Data Utilities (`chart-data.ts`)

Helper functions for transforming brew data into chart-ready formats:

```typescript
import { 
  transformBrewsForRatioChart,
  transformBrewsForTimeChart,
  filterBrewsByRecency,
  createAnalysisChartConfig
} from '$lib/utils/chart-data';

// Transform brews for rating vs ratio chart
const ratioData = transformBrewsForRatioChart(brews);

// Transform brews for rating vs time chart  
const timeData = transformBrewsForTimeChart(brews);

// Filter by recency (2D, W, M, 3M, Y)
const recentBrews = filterBrewsByRecency(brews, 'M');

// Generate chart configuration
const config = createAnalysisChartConfig(containerWidth, 'ratio', false);
```

## Data Structures

### BrewDataPoint

The standard data format for scatter plot points:

```typescript
interface BrewDataPoint {
  id: string;           // Unique identifier
  x: number;            // X-axis value (ratio, time, etc.)
  y: number;            // Y-axis value (typically rating)
  bagId?: string;       // Optional bag ID for highlighting
  date: Date;           // Brew date for filtering
  brew: Brew;           // Full brew object for tooltips
}
```

### ScatterPlotConfig

Configuration object for customizing chart appearance and behavior:

```typescript
interface ScatterPlotConfig {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number; };
  xDomain?: [number, number];     // Optional fixed X range
  yDomain?: [number, number];     // Optional fixed Y range
  xLabel?: string;                // X-axis label
  yLabel?: string;                // Y-axis label
  showXAxis?: boolean;            // Show/hide X axis
  showYAxis?: boolean;            // Show/hide Y axis
  showYAxisLabels?: boolean;      // Show/hide Y axis labels (per requirements)
  responsive?: boolean;           // Enable responsive behavior
}
```

## Bean Analysis Implementation

The scatter plot infrastructure is specifically designed for the bean analysis section of the home dashboard. Here's how to implement the dual scatter plot layout:

### Example Implementation

```svelte
<script>
  import ScatterPlot from '$lib/components/ScatterPlot.svelte';
  import { 
    transformBrewsForRatioChart,
    transformBrewsForTimeChart,
    createAnalysisChartConfig,
    getChartDomains
  } from '$lib/utils/chart-data';

  export let brews = [];
  export let selectedBagId = null;
  export let containerWidth = 600;

  // Transform data for both charts
  $: ratioData = transformBrewsForRatioChart(brews);
  $: timeData = transformBrewsForTimeChart(brews);

  // Create aligned chart configurations
  $: ratioConfig = {
    ...createAnalysisChartConfig(containerWidth / 2, 'ratio', false),
    yDomain: [1, 5] // Aligned Y-axis for ratings
  };

  $: timeConfig = {
    ...createAnalysisChartConfig(containerWidth / 2, 'time', false),
    yDomain: [1, 5] // Aligned Y-axis for ratings
  };
</script>

<div class="analysis-charts">
  <ScatterPlot data={ratioData} config={ratioConfig} highlightedBagId={selectedBagId} />
  <ScatterPlot data={timeData} config={timeConfig} highlightedBagId={selectedBagId} />
</div>
```

## Requirements Compliance

This implementation satisfies the following requirements from the design document:

- **6.3**: D3 integration within UI framework's viz components ✓
- **9.2**: UI framework integration with theme and palette ✓
- **9.4**: Responsive design for different screen sizes ✓
- **9.5**: Interactive hover interactions for data points ✓
- **9.6**: Consistent styling from UI framework ✓
- **6.6, 6.7**: Aligned vertical axes with omitted labels ✓

## Testing

The framework includes comprehensive tests:

- **Unit tests**: Core functionality and data transformations
- **Component tests**: Svelte component integration
- **Integration tests**: D3 and UI framework compatibility

Run tests with:
```bash
npm test -- d3-integration.test.ts chart-data.test.ts ScatterPlot.test.ts
```

## Performance Considerations

- **Responsive behavior**: Uses ResizeObserver for efficient resize handling
- **Animation performance**: Leverages D3's optimized transitions
- **Data binding**: Efficient enter/update/exit pattern for data changes
- **Memory management**: Proper cleanup in destroy() method

## Future Extensions

The framework is designed to be extensible for additional chart types:

- Line charts for trend analysis
- Bar charts for categorical data
- Heatmaps for correlation analysis
- Multi-series scatter plots for comparison

## Dependencies

- **D3.js**: Core visualization library
- **UI Framework**: Theme, palette, and styling integration
- **Svelte**: Component framework integration
- **TypeScript**: Type safety and developer experience