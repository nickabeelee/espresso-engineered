import { describe, it, expect } from 'vitest';
import {
  transformBrewsForRatioChart,
  transformBrewsForTimeChart,
  filterBrewsByRecency,
  calculateChartDimensions,
  getChartDomains,
  createAnalysisChartConfig
} from './chart-data';
import type { Brew } from '../../../../shared/types';

describe('Chart Data Utilities', () => {
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

  const mockBrewWithoutRating: Brew = {
    ...mockBrew,
    id: 'brew-2',
    rating: undefined
  };

  const mockBrewWithoutRatio: Brew = {
    ...mockBrew,
    id: 'brew-3',
    ratio: undefined
  };

  describe('transformBrewsForRatioChart', () => {
    it('should transform brews with rating and ratio', () => {
      const brews = [mockBrew];
      const result = transformBrewsForRatioChart(brews);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'brew-1',
        x: 2.0,
        y: 4,
        bagId: 'bag-1'
      });
      expect(result[0].date).toBeInstanceOf(Date);
      expect(result[0].brew).toBe(mockBrew);
    });

    it('should filter out brews without rating or ratio', () => {
      const brews = [mockBrew, mockBrewWithoutRating, mockBrewWithoutRatio];
      const result = transformBrewsForRatioChart(brews);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('brew-1');
    });

    it('should handle empty array', () => {
      const result = transformBrewsForRatioChart([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('transformBrewsForTimeChart', () => {
    it('should transform brews with rating and brew time', () => {
      const brews = [mockBrew];
      const result = transformBrewsForTimeChart(brews);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'brew-1',
        x: 28.5,
        y: 4,
        bagId: 'bag-1'
      });
    });

    it('should filter out brews without rating or brew time', () => {
      const brewWithoutTime = { ...mockBrew, id: 'brew-4', brew_time_s: undefined };
      const brews = [mockBrew, mockBrewWithoutRating, brewWithoutTime];
      const result = transformBrewsForTimeChart(brews);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('brew-1');
    });
  });

  describe('filterBrewsByRecency', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000);

    const recentBrew = { ...mockBrew, id: 'recent', created_at: yesterday.toISOString() };
    const oldBrew = { ...mockBrew, id: 'old', created_at: lastMonth.toISOString() };

    it('should filter by 2 days', () => {
      const brews = [recentBrew, oldBrew];
      const result = filterBrewsByRecency(brews, '2D');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('recent');
    });

    it('should filter by week', () => {
      const weekOldBrew = { ...mockBrew, id: 'week-old', created_at: lastWeek.toISOString() };
      const brews = [recentBrew, weekOldBrew, oldBrew];
      const result = filterBrewsByRecency(brews, 'W');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('recent');
    });

    it('should handle all recency periods', () => {
      const brews = [recentBrew];
      
      expect(filterBrewsByRecency(brews, '2D')).toHaveLength(1);
      expect(filterBrewsByRecency(brews, 'W')).toHaveLength(1);
      expect(filterBrewsByRecency(brews, 'M')).toHaveLength(1);
      expect(filterBrewsByRecency(brews, '3M')).toHaveLength(1);
      expect(filterBrewsByRecency(brews, 'Y')).toHaveLength(1);
    });
  });

  describe('calculateChartDimensions', () => {
    it('should calculate dimensions with default aspect ratio', () => {
      const result = calculateChartDimensions(500);
      
      expect(result.width).toBe(500);
      expect(result.height).toBe(300); // 500 * 0.6
      expect(result.margin).toBeDefined();
    });

    it('should respect minimum width', () => {
      const result = calculateChartDimensions(200);
      
      expect(result.width).toBe(300); // Minimum width
    });

    it('should respect maximum width', () => {
      const result = calculateChartDimensions(800);
      
      expect(result.width).toBe(600); // Maximum width
    });

    it('should use custom aspect ratio', () => {
      const result = calculateChartDimensions(400, 0.8);
      
      expect(result.width).toBe(400);
      expect(result.height).toBe(320); // 400 * 0.8
    });
  });

  describe('getChartDomains', () => {
    const mockDataPoints = [
      { id: '1', x: 1.5, y: 3, bagId: 'bag-1', date: new Date(), brew: mockBrew },
      { id: '2', x: 2.5, y: 4, bagId: 'bag-1', date: new Date(), brew: mockBrew },
      { id: '3', x: 3.0, y: 5, bagId: 'bag-1', date: new Date(), brew: mockBrew }
    ];

    it('should calculate x-axis domain with padding', () => {
      const result = getChartDomains(mockDataPoints, 'x');
      
      expect(result[0]).toBeLessThan(1.5); // Min with padding
      expect(result[1]).toBeGreaterThan(3.0); // Max with padding
    });

    it('should calculate y-axis domain ensuring 1-5 range', () => {
      const result = getChartDomains(mockDataPoints, 'y');
      
      expect(result[0]).toBe(1); // Minimum rating
      expect(result[1]).toBe(5); // Maximum rating
    });

    it('should handle empty data', () => {
      const xResult = getChartDomains([], 'x');
      const yResult = getChartDomains([], 'y');
      
      expect(xResult).toEqual([0, 1]);
      expect(yResult).toEqual([1, 5]);
    });
  });

  describe('createAnalysisChartConfig', () => {
    it('should create ratio chart config', () => {
      const result = createAnalysisChartConfig(500, 'ratio', false);
      
      expect(result.width).toBe(500);
      expect(result.xLabel).toBe('Brew Ratio (1:x)');
      expect(result.showYAxisLabels).toBe(false);
      expect(result.responsive).toBe(true);
    });

    it('should create time chart config', () => {
      const result = createAnalysisChartConfig(500, 'time', true);
      
      expect(result.xLabel).toBe('Brew Time (seconds)');
      expect(result.yLabel).toBe('Rating');
      expect(result.showYAxisLabels).toBe(true);
    });

    it('should handle Y-axis labels correctly', () => {
      const withLabels = createAnalysisChartConfig(500, 'ratio', true);
      const withoutLabels = createAnalysisChartConfig(500, 'ratio', false);
      
      expect(withLabels.yLabel).toBe('Rating');
      expect(withLabels.showYAxisLabels).toBe(true);
      
      expect(withoutLabels.yLabel).toBeUndefined();
      expect(withoutLabels.showYAxisLabels).toBe(false);
    });
  });
});