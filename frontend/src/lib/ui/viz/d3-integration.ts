// D3 integration utilities for the UI framework
import * as d3 from 'd3';
import { vizTheme } from './theme';
import { vizPalette } from './palette';
import { axisDefaults } from './axes';
import { tooltipDefaults } from './tooltip';
import { scaleDefaults } from './scales';
import type { Brew } from '../../../../shared/types';

/**
 * Test D3 integration and basic functionality
 */
export function testD3Integration(): boolean {
  try {
    // Test basic D3 functionality
    const testData = [1, 2, 3, 4, 5];
    
    // Test scale creation
    const xScale = d3.scaleLinear()
      .domain([0, 5])
      .range([0, 100]);
    
    // Test that scale works
    const testValue = xScale(2.5);
    
    // Test selection (without DOM)
    const selection = d3.select(document.createElement('div'));
    
    return typeof testValue === 'number' && 
           testValue === 50 && 
           selection.node() !== null;
  } catch (error) {
    console.error('D3 integration test failed:', error);
    return false;
  }
}

/**
 * Data point interface for scatter plots
 */
export interface BrewDataPoint {
  id: string;
  x: number;
  y: number;
  bagId?: string;
  date: Date;
  brew: Brew; // Full brew data for tooltips
}

/**
 * Scatter plot configuration interface
 */
export interface ScatterPlotConfig {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number; };
  xDomain?: [number, number];
  yDomain?: [number, number];
  xLabel?: string;
  yLabel?: string;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showYAxisLabels?: boolean; // Per requirements: omit vertical axis labels
  xTickValues?: number[];
  xTickFormat?: (value: number) => string;
  pointRadius?: number;
  hoverRadius?: number;
  pointFill?: string | ((point: BrewDataPoint) => string);
  pointStroke?: string | ((point: BrewDataPoint) => string);
  targetBand?: {
    value: number;
    width?: number;
    color?: string;
    opacity?: number;
  };
  trendLine?: {
    enabled: boolean;
    type?: 'linear';
    color?: string;
    width?: number;
    opacity?: number;
  };
  responsive?: boolean;
}

/**
 * Recency filter periods for brew data
 */
export type RecencyPeriod = '2D' | 'W' | 'M' | '3M' | 'Y';

/**
 * Tooltip data interface
 */
export interface TooltipData {
  x: number;
  y: number;
  content: string;
}

/**
 * Advanced scatter plot class for bean analysis with D3 integration
 * Follows UI framework patterns and supports responsive design
 */
export class ScatterPlot {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private container: HTMLElement;
  private config: ScatterPlotConfig;
  private xScale: d3.ScaleLinear<number, number>;
  private yScale: d3.ScaleLinear<number, number>;
  private colorScale: d3.ScaleOrdinal<string, string>;
  private tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private resizeObserver?: ResizeObserver;
  private data: BrewDataPoint[] = [];

  constructor(container: HTMLElement, config: ScatterPlotConfig) {
    this.container = container;
    this.config = { ...config };
    
    // Initialize color scale with UI framework palette
    this.colorScale = d3.scaleOrdinal<string>()
      .range(vizPalette.categorical);
    
    // Create tooltip
    this.createTooltip();
    
    // Create SVG
    this.createSVG();
    
    // Initialize scales
    this.initializeScales();
    
    // Set up responsive behavior if enabled
    if (config.responsive) {
      this.setupResponsive();
    }
  }

  private createTooltip() {
    this.tooltip = d3.select('body')
      .append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', tooltipDefaults.background)
      .style('border', `1px solid ${tooltipDefaults.borderColor}`)
      .style('border-radius', tooltipDefaults.borderRadius)
      .style('padding', tooltipDefaults.padding)
      .style('font-family', tooltipDefaults.text.fontFamily)
      .style('font-size', tooltipDefaults.text.fontSize)
      .style('color', tooltipDefaults.text.color)
      .style('box-shadow', tooltipDefaults.shadow)
      .style('pointer-events', 'none')
      .style('z-index', '1000');
  }

  private createSVG() {
    // Clear any existing SVG
    d3.select(this.container).selectAll('svg').remove();
    
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.config.width)
      .attr('height', this.config.height)
      .style('background', vizTheme.background);
    
    // Create main chart group
    this.svg.append('g')
      .attr('class', 'chart-area')
      .attr('transform', `translate(${this.config.margin.left}, ${this.config.margin.top})`);
  }

  private initializeScales() {
    const { width, height, margin } = this.config;
    
    // X scale
    this.xScale = d3.scaleLinear()
      .domain(this.config.xDomain || [0, 1])
      .range([0, width - margin.left - margin.right])
      .nice(scaleDefaults.linear.nice)
      .clamp(scaleDefaults.linear.clamp);
    
    // Y scale
    this.yScale = d3.scaleLinear()
      .domain(this.config.yDomain || [0, 1])
      .range([height - margin.top - margin.bottom, 0])
      .nice(scaleDefaults.linear.nice)
      .clamp(scaleDefaults.linear.clamp);
  }

  private setupResponsive() {
    if (!window.ResizeObserver) return;
    
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          this.resize(width);
        }
      }
    });
    
    this.resizeObserver.observe(this.container);
  }

  private resize(containerWidth: number) {
    const aspectRatio = this.config.height / this.config.width;
    const newWidth = Math.max(300, containerWidth);
    const newHeight = newWidth * aspectRatio;
    
    this.config.width = newWidth;
    this.config.height = newHeight;
    
    // Update SVG dimensions
    this.svg
      .attr('width', newWidth)
      .attr('height', newHeight);
    
    // Reinitialize scales with new dimensions
    this.initializeScales();
    
    // Re-render with current data
    if (this.data.length > 0) {
      this.render();
    }
  }

  private createAxes() {
    const chartArea = this.svg.select('.chart-area');
    
    // Remove existing axes
    chartArea.selectAll('.axis').remove();
    
    // X axis
    if (this.config.showXAxis !== false) {
      const xAxis = d3.axisBottom(this.xScale)
        .tickSize(axisDefaults.tickSize)
        .tickPadding(axisDefaults.tickPadding);

      if (this.config.xTickValues) {
        xAxis.tickValues(this.config.xTickValues);
      }

      if (this.config.xTickFormat) {
        xAxis.tickFormat(this.config.xTickFormat as any);
      }
      
      chartArea.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0, ${this.config.height - this.config.margin.top - this.config.margin.bottom})`)
        .call(xAxis)
        .selectAll('text')
        .style('font-family', axisDefaults.tickLabel.fontFamily)
        .style('font-size', axisDefaults.tickLabel.fontSize)
        .style('fill', axisDefaults.tickLabel.color);

      chartArea.selectAll('.x-axis .domain').remove();
      chartArea.selectAll('.x-axis line').remove();
      
      // X axis label
      if (this.config.xLabel) {
        chartArea.append('text')
          .attr('class', 'axis-label x-label')
          .attr('x', (this.config.width - this.config.margin.left - this.config.margin.right) / 2)
          .attr('y', this.config.height - this.config.margin.top - this.config.margin.bottom + 40)
          .style('text-anchor', 'middle')
          .style('font-family', axisDefaults.label.fontFamily)
          .style('font-size', axisDefaults.label.fontSize)
          .style('fill', axisDefaults.label.color)
          .text(this.config.xLabel);
      }
    }
    
    // Y axis (without labels per requirements)
    if (this.config.showYAxis !== false) {
      const yAxis = d3.axisLeft(this.yScale)
        .tickSize(axisDefaults.tickSize)
        .tickPadding(axisDefaults.tickPadding);
      
      // Hide tick labels if specified in config
      if (this.config.showYAxisLabels === false) {
        yAxis.tickFormat(() => '');
      }
      
      chartArea.append('g')
        .attr('class', 'axis y-axis')
        .call(yAxis)
        .selectAll('text')
        .style('font-family', axisDefaults.tickLabel.fontFamily)
        .style('font-size', axisDefaults.tickLabel.fontSize)
        .style('fill', axisDefaults.tickLabel.color);
      
      // Y axis label (only if labels are shown)
      if (this.config.yLabel && this.config.showYAxisLabels !== false) {
        chartArea.append('text')
          .attr('class', 'axis-label y-label')
          .attr('transform', 'rotate(-90)')
          .attr('x', -(this.config.height - this.config.margin.top - this.config.margin.bottom) / 2)
          .attr('y', -40)
          .style('text-anchor', 'middle')
          .style('font-family', axisDefaults.label.fontFamily)
          .style('font-size', axisDefaults.label.fontSize)
          .style('fill', axisDefaults.label.color)
          .text(this.config.yLabel);
      }
    }
  }

  private render() {
    const chartArea = this.svg.select('.chart-area');
    const chartWidth = Math.max(0, this.config.width - this.config.margin.left - this.config.margin.right);
    const chartHeight = Math.max(0, this.config.height - this.config.margin.top - this.config.margin.bottom);

    // Anchor chart area geometry so it spans the full plot region.
    const frame = chartArea.selectAll<SVGRectElement, null>('.chart-frame').data([null]);
    frame.enter()
      .append('rect')
      .attr('class', 'chart-frame')
      .attr('fill', 'transparent')
      .attr('pointer-events', 'none');
    chartArea.select<SVGRectElement>('.chart-frame')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', chartWidth)
      .attr('height', chartHeight);
    
    // Create axes
    this.createAxes();

    // Target band
    chartArea.selectAll('.target-band').remove();
    if (this.config.targetBand) {
      const domain = this.xScale.domain();
      const bandWidth = this.config.targetBand.width ?? (domain[1] - domain[0]) * 0.08;
      const bandValue = this.config.targetBand.value;
      const bandStart = this.xScale(bandValue - bandWidth / 2);
      const bandEnd = this.xScale(bandValue + bandWidth / 2);
      const bandHeight = this.config.height - this.config.margin.top - this.config.margin.bottom;
      
      chartArea.append('rect')
        .attr('class', 'target-band')
        .attr('x', bandStart)
        .attr('y', 0)
        .attr('width', Math.max(0, bandEnd - bandStart))
        .attr('height', bandHeight)
        .attr('fill', this.config.targetBand.color ?? 'rgba(123, 94, 58, 0.22)')
        .attr('opacity', this.config.targetBand.opacity ?? 1);
    }

    // Trend line
    chartArea.selectAll('.trend-line').remove();
    if (this.config.trendLine?.enabled && this.data.length > 2) {
      const domain = this.xScale.domain();
      const xValues = this.data.map(point => point.x);
      const yValues = this.data.map(point => point.y);
      const xMean = d3.mean(xValues) ?? 0;
      const yMean = d3.mean(yValues) ?? 0;
      const numerator = d3.sum(this.data, point => (point.x - xMean) * (point.y - yMean));
      const denominator = d3.sum(this.data, point => Math.pow(point.x - xMean, 2)) || 1;
      const slope = numerator / denominator;
      const intercept = yMean - slope * xMean;
      
      const linePoints: [number, number][] = [
        [domain[0], slope * domain[0] + intercept],
        [domain[1], slope * domain[1] + intercept]
      ];
      
      const line = d3.line<[number, number]>()
        .x(d => this.xScale(d[0]))
        .y(d => this.yScale(d[1]));
      
      chartArea.append('path')
        .attr('class', 'trend-line')
        .attr('d', line(linePoints))
        .attr('fill', 'none')
        .attr('stroke', this.config.trendLine.color ?? 'rgba(123, 94, 58, 0.5)')
        .attr('stroke-width', this.config.trendLine.width ?? 2)
        .attr('opacity', this.config.trendLine.opacity ?? 0.7);
    }
    
    // Bind data to circles
    const circles = chartArea.selectAll('.data-point')
      .data(this.data, (d: any) => d.id);
    
    // Enter new points
    const resolveFill = (point: BrewDataPoint) => {
      if (typeof this.config.pointFill === 'function') {
        return this.config.pointFill(point);
      }
      return this.config.pointFill ?? this.colorScale(point.bagId || 'default');
    };

    const resolveStroke = (point: BrewDataPoint) => {
      if (typeof this.config.pointStroke === 'function') {
        return this.config.pointStroke(point);
      }
      return this.config.pointStroke ?? vizTheme.palette.neutral;
    };

    const enterCircles = circles.enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => this.xScale(d.x))
      .attr('cy', d => this.yScale(d.y))
      .attr('r', this.config.pointRadius ?? 4)
      .attr('fill', d => resolveFill(d))
      .attr('stroke', d => resolveStroke(d))
      .attr('stroke-width', 1)
      .attr('opacity', 0.85)
      .style('cursor', 'pointer');
    
    // Add hover interactions
    enterCircles
      .on('mouseover', (event, d) => {
        // Highlight point
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('r', this.config.hoverRadius ?? 6)
          .attr('opacity', 1);
        
        // Show tooltip
        const tooltipContent = this.formatTooltip(d);
        this.tooltip
          .style('visibility', 'visible')
          .html(tooltipContent);
      })
      .on('mousemove', (event) => {
        this.tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', (event) => {
        // Reset point
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('r', this.config.pointRadius ?? 4)
          .attr('opacity', 0.85);
        
        // Hide tooltip
        this.tooltip.style('visibility', 'hidden');
      });
    
    // Animate entrance
    enterCircles
      .transition()
      .duration(200)
      .delay((d, i) => i * 20) // Staggered entrance
      .ease(d3.easeBackOut.overshoot(1.7))
      .attr('r', this.config.pointRadius ?? 4);
    
    // Update existing points
    circles.transition()
      .duration(300)
      .attr('cx', d => this.xScale(d.x))
      .attr('cy', d => this.yScale(d.y))
      .attr('r', this.config.pointRadius ?? 4)
      .attr('fill', d => resolveFill(d))
      .attr('stroke', d => resolveStroke(d));
    
    // Remove old points
    circles.exit()
      .transition()
      .duration(200)
      .attr('opacity', 0)
      .attr('r', 0)
      .remove();
  }

  private formatTooltip(d: BrewDataPoint): string {
    const brew = d.brew;
    const date = new Date(brew.created_at).toLocaleDateString();
    
    let content = `<strong>${brew.name || 'Brew'}</strong><br/>`;
    content += `Date: ${date}<br/>`;
    content += `Rating: ${brew.rating || 'Not rated'}<br/>`;
    
    if (brew.ratio) {
      content += `Ratio: 1:${brew.ratio.toFixed(1)}<br/>`;
    }
    
    if (brew.brew_time_s) {
      content += `Time: ${brew.brew_time_s}s<br/>`;
    }
    
    if (brew.dose_g) {
      content += `Dose: ${brew.dose_g}g<br/>`;
    }
    
    if (brew.yield_g) {
      content += `Yield: ${brew.yield_g}g`;
    }
    
    return content;
  }

  /**
   * Update the chart with new data
   */
  updateData(data: BrewDataPoint[]) {
    this.data = data;
    
    // Update domains if not explicitly set
    if (!this.config.xDomain && data.length > 0) {
      const xExtent = d3.extent(data, d => d.x) as [number, number];
      this.xScale.domain(xExtent).nice();
    }
    
    if (!this.config.yDomain && data.length > 0) {
      const yExtent = d3.extent(data, d => d.y) as [number, number];
      this.yScale.domain(yExtent).nice();
    }
    
    // Update color scale domain
    const bagIds = Array.from(new Set(data.map(d => d.bagId).filter(Boolean)));
    this.colorScale.domain(bagIds);
    
    this.render();
  }

  /**
   * Highlight specific bag data points
   */
  highlightBag(bagId: string | null) {
    const chartArea = this.svg.select('.chart-area');
    
    chartArea.selectAll('.data-point')
      .transition()
      .duration(200)
      .attr('opacity', bagId ? (d: any) => d.bagId === bagId ? 1 : 0.3 : 0.85)
      .attr('stroke-width', bagId ? (d: any) => d.bagId === bagId ? 2 : 1 : 1);
  }

  /**
   * Update configuration and re-render
   */
  updateConfig(newConfig: Partial<ScatterPlotConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.width || newConfig.height) {
      this.svg
        .attr('width', this.config.width)
        .attr('height', this.config.height);
      
      this.initializeScales();

      if (!this.config.xDomain && this.data.length > 0) {
        const xExtent = d3.extent(this.data, d => d.x) as [number, number];
        this.xScale.domain(xExtent).nice();
      }
      
      if (!this.config.yDomain && this.data.length > 0) {
        const yExtent = d3.extent(this.data, d => d.y) as [number, number];
        this.yScale.domain(yExtent).nice();
      }
    }
    
    if (this.data.length > 0) {
      this.render();
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    this.tooltip.remove();
    this.svg.remove();
  }
}

// Re-export D3 for direct access
export { d3 };
