import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte/svelte5';
import ScatterPlot from './ScatterPlot.svelte';
import type { BrewDataPoint } from '$lib/ui/viz/d3-integration';
import type { Brew } from '../../../../shared/types';

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

describe('ScatterPlot Component', () => {
  const mockBrew: Brew = {
    id: 'brew-1',
    created_at: '2024-01-01T10:00:00Z',
    modified_at: '2024-01-01T10:00:00Z',
    barista_id: 'barista-1',
    machine_id: 'machine-1',
    grinder_id: 'grinder-1',
    bag_id: 'bag-1',
    name: 'Test Brew',
    dose_g: 18.0,
    yield_g: 36.0,
    brew_time_s: 28.5,
    ratio: 2.0,
    rating: 4
  };

  const mockData: BrewDataPoint[] = [
    {
      id: 'brew-1',
      x: 2.0,
      y: 4,
      bagId: 'bag-1',
      date: new Date('2024-01-01T10:00:00Z'),
      brew: mockBrew
    },
    {
      id: 'brew-2',
      x: 2.5,
      y: 3,
      bagId: 'bag-2',
      date: new Date('2024-01-02T10:00:00Z'),
      brew: { ...mockBrew, id: 'brew-2', ratio: 2.5, rating: 3 }
    }
  ];

  const mockConfig = {
    width: 400,
    height: 300,
    margin: { top: 20, right: 20, bottom: 40, left: 40 },
    xLabel: 'Brew Ratio',
    yLabel: 'Rating',
    showYAxisLabels: false,
    responsive: true
  };

  afterEach(() => {
    cleanup();
  });

  it('should render without crashing', () => {
    const { container } = render(ScatterPlot, {
      props: {
        data: mockData,
        config: mockConfig
      }
    });

    expect(container).toBeTruthy();
    expect(container.querySelector('.scatter-plot-container')).toBeTruthy();
  });

  it('should render with empty data', () => {
    const { container } = render(ScatterPlot, {
      props: {
        data: [],
        config: mockConfig
      }
    });

    expect(container).toBeTruthy();
    expect(container.querySelector('.scatter-plot-container')).toBeTruthy();
  });

  it('should apply correct container dimensions', () => {
    const { container } = render(ScatterPlot, {
      props: {
        data: mockData,
        config: mockConfig
      }
    });

    const plotContainer = container.querySelector('.scatter-plot-container') as HTMLElement;
    expect(plotContainer).toBeTruthy();
    expect(plotContainer.style.width).toBe('100%');
    expect(plotContainer.style.height).toBe('300px');
  });

  it('should handle config updates', () => {
    const { component } = render(ScatterPlot, {
      props: {
        data: mockData,
        config: mockConfig
      }
    });

    const newConfig = {
      ...mockConfig,
      width: 500,
      height: 400
    };

    // Test that config updates don't throw errors
    expect(() => {
      component.$set({ config: newConfig });
    }).not.toThrow();
  });

  it('should handle data updates', () => {
    const { component } = render(ScatterPlot, {
      props: {
        data: mockData,
        config: mockConfig
      }
    });

    const newData = [mockData[0]]; // Remove one data point
    
    expect(() => {
      component.$set({ data: newData });
    }).not.toThrow();
  });

  it('should handle highlighted bag updates', () => {
    const { component } = render(ScatterPlot, {
      props: {
        data: mockData,
        config: mockConfig,
        highlightedBagId: null
      }
    });

    expect(() => {
      component.$set({ highlightedBagId: 'bag-1' });
    }).not.toThrow();

    expect(() => {
      component.$set({ highlightedBagId: null });
    }).not.toThrow();
  });
});
