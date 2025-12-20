/**
 * Tests for naming performance monitoring
 */

import { NamingPerformanceMonitor, getNamingPerformanceMonitor } from './naming-performance.js';

// Clean up global performance monitor after all tests
afterAll(() => {
  const globalMonitor = getNamingPerformanceMonitor();
  globalMonitor.destroy();
});

describe('NamingPerformanceMonitor', () => {
  let monitor: NamingPerformanceMonitor;

  beforeEach(() => {
    monitor = new NamingPerformanceMonitor({
      maxHistoryEntries: 100,
      slowOperationThreshold: 50,
      metricsRetentionMs: 60000,
      enableDetailedLogging: false
    });
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('operation timing', () => {
    test('should track operation start and end', async () => {
      const operationId = 'test-op-1';
      
      monitor.startOperation(operationId, 'bagNaming', 'entity-1', 'barista-1');
      
      // Simulate some work with a small delay
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const duration = monitor.endOperation(operationId, true, 'entity-1', 'barista-1');
      
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    test('should handle missing operation gracefully', () => {
      const duration = monitor.endOperation('nonexistent', true);
      expect(duration).toBe(0);
    });

    test('should track concurrent operations', () => {
      monitor.startOperation('op1', 'bagNaming');
      monitor.startOperation('op2', 'brewNaming');
      
      const metrics = monitor.getMetrics();
      expect(metrics.concurrentRequests).toBe(2);
      
      monitor.endOperation('op1', true);
      monitor.endOperation('op2', true);
    });
  });

  describe('metrics calculation', () => {
    test('should calculate basic metrics', async () => {
      // Add some test operations with small delays
      monitor.startOperation('op1', 'bagNaming');
      await new Promise(resolve => setTimeout(resolve, 1));
      monitor.endOperation('op1', true, undefined, undefined, undefined, false);
      
      monitor.startOperation('op2', 'brewNaming');
      await new Promise(resolve => setTimeout(resolve, 1));
      monitor.endOperation('op2', true, undefined, undefined, undefined, true);
      
      const metrics = monitor.getMetrics();
      
      expect(metrics.totalOperations).toBe(2);
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.operationsByType.bagNaming.count).toBe(1);
      expect(metrics.operationsByType.brewNaming.count).toBe(1);
    });

    test('should handle empty metrics', () => {
      const metrics = monitor.getMetrics();
      
      expect(metrics.totalOperations).toBe(0);
      expect(metrics.averageResponseTime).toBe(0);
      expect(metrics.operationsByType.bagNaming.count).toBe(0);
      expect(metrics.operationsByType.brewNaming.count).toBe(0);
    });

    test('should calculate percentiles correctly', async () => {
      // Add operations with known durations
      for (let i = 0; i < 100; i++) {
        const opId = `op${i}`;
        monitor.startOperation(opId, 'bagNaming');
        
        // Simulate different durations
        await new Promise(resolve => setTimeout(resolve, i % 10));
        
        monitor.endOperation(opId, true);
      }
      
      const metrics = monitor.getMetrics();
      
      expect(metrics.p95ResponseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.p99ResponseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.p99ResponseTime).toBeGreaterThanOrEqual(metrics.p95ResponseTime);
    });
  });

  describe('performance requirements', () => {
    test('should identify performance issues', () => {
      // Add slow operations
      monitor.startOperation('slow1', 'bagNaming');
      // Simulate slow operation by manually setting end time
      const slowDuration = 150; // Above 100ms threshold
      monitor['operations'].push({
        operationType: 'bagNaming',
        startTime: Date.now() - slowDuration,
        endTime: Date.now(),
        duration: slowDuration,
        success: true,
        concurrentRequests: 1
      });
      
      const check = monitor.checkPerformanceRequirements();
      
      expect(check.withinRequirements).toBe(false);
      expect(check.issues.length).toBeGreaterThan(0);
    });

    test('should pass when performance is good', () => {
      // Add fast operations
      monitor.startOperation('fast1', 'bagNaming');
      monitor.endOperation('fast1', true);
      
      const check = monitor.checkPerformanceRequirements();
      
      expect(check.withinRequirements).toBe(true);
      expect(check.issues.length).toBe(0);
    });
  });

  describe('performance summary', () => {
    test('should provide status summary', () => {
      monitor.startOperation('op1', 'bagNaming');
      monitor.endOperation('op1', true);
      
      const summary = monitor.getPerformanceSummary();
      
      expect(summary.status).toMatch(/healthy|warning|critical/);
      expect(summary.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(summary.operationsPerSecond).toBeGreaterThanOrEqual(0);
      expect(summary.errorRate).toBeGreaterThanOrEqual(0);
      expect(summary.concurrentRequests).toBeGreaterThanOrEqual(0);
    });

    test('should identify critical status for slow operations', () => {
      // Add very slow operation
      monitor['operations'].push({
        operationType: 'bagNaming',
        startTime: Date.now() - 300,
        endTime: Date.now(),
        duration: 300, // Very slow
        success: true,
        concurrentRequests: 1
      });
      
      const summary = monitor.getPerformanceSummary();
      
      expect(summary.status).toBe('critical');
    });
  });

  describe('data export', () => {
    test('should export JSON data', () => {
      monitor.startOperation('op1', 'bagNaming');
      monitor.endOperation('op1', true);
      
      const jsonData = monitor.exportData('json');
      const parsed = JSON.parse(jsonData);
      
      expect(parsed.exportTime).toBeDefined();
      expect(parsed.metrics).toBeDefined();
      expect(parsed.operations).toBeDefined();
    });

    test('should export CSV data', () => {
      monitor.startOperation('op1', 'bagNaming');
      monitor.endOperation('op1', true);
      
      const csvData = monitor.exportData('csv');
      
      expect(csvData).toContain('timestamp,operationType,duration');
      expect(csvData).toContain('bagNaming');
    });
  });

  describe('cleanup and memory management', () => {
    test('should reset metrics', () => {
      monitor.startOperation('op1', 'bagNaming');
      monitor.endOperation('op1', true);
      
      expect(monitor.getMetrics().totalOperations).toBe(1);
      
      monitor.reset();
      
      expect(monitor.getMetrics().totalOperations).toBe(0);
    });

    test('should handle recent operations filtering', () => {
      // Add old operation
      monitor['operations'].push({
        operationType: 'bagNaming',
        startTime: Date.now() - 120000, // 2 minutes ago
        endTime: Date.now() - 120000,
        duration: 50,
        success: true,
        concurrentRequests: 1
      });
      
      // Add recent operation
      monitor.startOperation('recent', 'bagNaming');
      monitor.endOperation('recent', true);
      
      const recentOps = monitor.getRecentOperations(60000); // Last minute
      
      expect(recentOps.length).toBe(1);
      expect(recentOps[0].operationType).toBe('bagNaming');
    });
  });

  describe('error tracking', () => {
    test('should track failed operations', () => {
      monitor.startOperation('failed', 'bagNaming');
      monitor.endOperation('failed', false, undefined, undefined, 'Test error');
      
      const metrics = monitor.getMetrics();
      
      expect(metrics.recentOperations[0].success).toBe(false);
      expect(metrics.recentOperations[0].error).toBe('Test error');
    });

    test('should track timeout operations', () => {
      monitor.startOperation('timeout', 'bagNaming');
      monitor.endOperation('timeout', false, undefined, undefined, 'timeout error');
      
      const check = monitor.checkPerformanceRequirements();
      
      // Should detect timeout in the error checking
      expect(check.metrics.timeoutCount).toBeGreaterThan(0);
    });
  });
});