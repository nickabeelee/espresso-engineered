import type { Brew } from '../../../../shared/types';
import type { BrewDataPoint, RecencyPeriod } from '$lib/ui/viz/d3-integration';

/**
 * Transform brew data for rating vs ratio scatter plot
 */
export function transformBrewsForRatioChart(brews: Brew[]): BrewDataPoint[] {
  return brews
    .filter(brew => brew.rating !== null && brew.rating !== undefined && brew.ratio !== null && brew.ratio !== undefined)
    .map(brew => ({
      id: brew.id,
      x: brew.ratio!,
      y: brew.rating!,
      bagId: brew.bag_id,
      date: new Date(brew.created_at),
      brew
    }));
}

/**
 * Transform brew data for rating vs brew time scatter plot
 */
export function transformBrewsForTimeChart(brews: Brew[]): BrewDataPoint[] {
  return brews
    .filter(brew => brew.rating !== null && brew.rating !== undefined && brew.brew_time_s !== null && brew.brew_time_s !== undefined)
    .map(brew => ({
      id: brew.id,
      x: brew.brew_time_s!,
      y: brew.rating!,
      bagId: brew.bag_id,
      date: new Date(brew.created_at),
      brew
    }));
}

/**
 * Filter brews by recency period
 */
export function filterBrewsByRecency(brews: Brew[], recency: RecencyPeriod): Brew[] {
  const now = new Date();
  const cutoffDate = new Date();
  
  switch (recency) {
    case '2D':
      cutoffDate.setDate(now.getDate() - 2);
      break;
    case 'W':
      cutoffDate.setDate(now.getDate() - 7);
      break;
    case 'M':
      cutoffDate.setMonth(now.getMonth() - 1);
      break;
    case '3M':
      cutoffDate.setMonth(now.getMonth() - 3);
      break;
    case 'Y':
      cutoffDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return brews; // No filtering
  }
  
  return brews.filter(brew => new Date(brew.created_at) >= cutoffDate);
}

/**
 * Calculate optimal chart dimensions based on container size
 */
export function calculateChartDimensions(containerWidth: number, aspectRatio: number = 0.6) {
  const width = Math.max(300, Math.min(600, containerWidth));
  const height = width * aspectRatio;
  
  return {
    width,
    height,
    margin: {
      top: 20,
      right: 20,
      bottom: 60,
      left: 60
    }
  };
}

/**
 * Get domain ranges for chart axes based on data
 */
export function getChartDomains(data: BrewDataPoint[], axis: 'x' | 'y'): [number, number] {
  if (data.length === 0) {
    return axis === 'y' ? [1, 5] : [0, 1]; // Default rating range for y, generic for x
  }
  
  const values = data.map(d => axis === 'x' ? d.x : d.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  if (axis === 'y') {
    // For ratings, ensure we show the full 1-5 range
    return [Math.min(1, min), Math.max(5, max)];
  } else {
    // For x-axis, add some padding
    const padding = (max - min) * 0.1;
    return [Math.max(0, min - padding), max + padding];
  }
}

/**
 * Generate chart configuration for bean analysis scatter plots
 */
export function createAnalysisChartConfig(
  containerWidth: number,
  chartType: 'ratio' | 'time',
  showYAxisLabels: boolean = false
) {
  const dimensions = calculateChartDimensions(containerWidth);
  
  return {
    ...dimensions,
    xLabel: chartType === 'ratio' ? 'Brew Ratio (1:x)' : 'Brew Time (seconds)',
    yLabel: showYAxisLabels ? 'Rating' : undefined,
    showYAxisLabels,
    responsive: true
  };
}