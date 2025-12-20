/**
 * Performance monitoring utilities for the naming service
 * Implements timing metrics and concurrent request monitoring
 * Requirements: 7.1, 7.2, 7.3
 */

import { NAMING_LIMITS } from '../config/naming.js';

/**
 * Performance metrics for naming operations
 */
export interface NamingPerformanceMetrics {
  totalOperations: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  operationsPerSecond: number;
  concurrentRequests: number;
  maxConcurrentRequests: number;
  timeoutCount: number;
  slowOperationCount: number;
  operationsByType: {
    bagNaming: OperationTypeMetrics;
    brewNaming: OperationTypeMetrics;
  };
  recentOperations: PerformanceEntry[];
}

/**
 * Metrics for a specific operation type
 */
export interface OperationTypeMetrics {
  count: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  timeoutCount: number;
  slowCount: number;
}

/**
 * Individual performance entry
 */
export interface PerformanceEntry {
  operationType: 'bagNaming' | 'brewNaming';
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  entityId?: string;
  baristaId?: string;
  error?: string;
  cacheHit?: boolean;
  concurrentRequests: number;
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  maxHistoryEntries: number;
  slowOperationThreshold: number;
  metricsRetentionMs: number;
  enableDetailedLogging: boolean;
}

/**
 * Performance monitor for naming operations
 */
export class NamingPerformanceMonitor {
  private config: PerformanceConfig;
  private operations: PerformanceEntry[] = [];
  private activeOperations = new Map<string, { startTime: number; operationType: 'bagNaming' | 'brewNaming' }>();
  private startTime = Date.now();
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      maxHistoryEntries: 1000,
      slowOperationThreshold: 100, // 100ms
      metricsRetentionMs: 3600000, // 1 hour
      enableDetailedLogging: false,
      ...config
    };

    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Start timing a naming operation
   */
  startOperation(
    operationId: string,
    operationType: 'bagNaming' | 'brewNaming',
    entityId?: string,
    baristaId?: string
  ): void {
    const startTime = Date.now();
    
    this.activeOperations.set(operationId, {
      startTime,
      operationType
    });

    if (this.config.enableDetailedLogging) {
      console.debug(`[NamingPerformance] Started ${operationType} operation ${operationId}`, {
        entityId,
        baristaId,
        concurrentRequests: this.activeOperations.size
      });
    }
  }

  /**
   * End timing a naming operation
   */
  endOperation(
    operationId: string,
    success: boolean,
    entityId?: string,
    baristaId?: string,
    error?: string,
    cacheHit?: boolean
  ): number {
    const endTime = Date.now();
    const activeOp = this.activeOperations.get(operationId);
    
    if (!activeOp) {
      console.warn(`[NamingPerformance] No active operation found for ID: ${operationId}`);
      return 0;
    }

    const duration = endTime - activeOp.startTime;
    const concurrentRequests = this.activeOperations.size;

    // Create performance entry
    const entry: PerformanceEntry = {
      operationType: activeOp.operationType,
      startTime: activeOp.startTime,
      endTime,
      duration,
      success,
      entityId,
      baristaId,
      error,
      cacheHit,
      concurrentRequests
    };

    // Add to history
    this.operations.push(entry);

    // Clean up active operation
    this.activeOperations.delete(operationId);

    // Log slow operations
    if (duration > this.config.slowOperationThreshold) {
      console.warn(`[NamingPerformance] Slow ${activeOp.operationType} operation`, {
        operationId,
        duration,
        threshold: this.config.slowOperationThreshold,
        entityId,
        baristaId,
        cacheHit
      });
    }

    // Check if operation exceeded performance requirements
    if (duration > NAMING_LIMITS.TIMEOUT_MS * 0.2) { // 20% of timeout threshold
      console.warn(`[NamingPerformance] Operation approaching timeout threshold`, {
        operationId,
        duration,
        threshold: NAMING_LIMITS.TIMEOUT_MS * 0.2,
        operationType: activeOp.operationType
      });
    }

    if (this.config.enableDetailedLogging) {
      console.debug(`[NamingPerformance] Completed ${activeOp.operationType} operation ${operationId}`, {
        duration,
        success,
        cacheHit,
        concurrentRequests
      });
    }

    // Trim history if needed
    this.trimHistory();

    return duration;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): NamingPerformanceMetrics {
    const now = Date.now();
    const recentOperations = this.getRecentOperations(this.config.metricsRetentionMs);
    
    if (recentOperations.length === 0) {
      return this.getEmptyMetrics();
    }

    // Calculate overall metrics
    const durations = recentOperations.map(op => op.duration);
    const sortedDurations = [...durations].sort((a, b) => a - b);
    
    const totalOperations = recentOperations.length;
    const averageResponseTime = durations.reduce((sum, d) => sum + d, 0) / totalOperations;
    const minResponseTime = Math.min(...durations);
    const maxResponseTime = Math.max(...durations);
    
    // Calculate percentiles
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p99Index = Math.floor(sortedDurations.length * 0.99);
    const p95ResponseTime = sortedDurations[p95Index] || 0;
    const p99ResponseTime = sortedDurations[p99Index] || 0;

    // Calculate operations per second
    const timeSpanMs = now - this.startTime;
    const operationsPerSecond = totalOperations / (timeSpanMs / 1000);

    // Count timeouts and slow operations
    const timeoutCount = recentOperations.filter(op => !op.success && op.error?.includes('timeout')).length;
    const slowOperationCount = recentOperations.filter(op => op.duration > this.config.slowOperationThreshold).length;

    // Calculate concurrent request metrics
    const concurrentRequests = this.activeOperations.size;
    const maxConcurrentRequests = Math.max(...recentOperations.map(op => op.concurrentRequests), concurrentRequests);

    // Calculate metrics by operation type
    const bagOperations = recentOperations.filter(op => op.operationType === 'bagNaming');
    const brewOperations = recentOperations.filter(op => op.operationType === 'brewNaming');

    return {
      totalOperations,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      operationsPerSecond,
      concurrentRequests,
      maxConcurrentRequests,
      timeoutCount,
      slowOperationCount,
      operationsByType: {
        bagNaming: this.calculateOperationTypeMetrics(bagOperations),
        brewNaming: this.calculateOperationTypeMetrics(brewOperations)
      },
      recentOperations: recentOperations.slice(-10) // Last 10 operations
    };
  }

  /**
   * Get operations within a time window
   */
  getRecentOperations(timeWindowMs: number): PerformanceEntry[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.operations.filter(op => op.endTime >= cutoff);
  }

  /**
   * Check if naming operations are meeting performance requirements
   */
  checkPerformanceRequirements(): {
    withinRequirements: boolean;
    issues: string[];
    metrics: NamingPerformanceMetrics;
  } {
    const metrics = this.getMetrics();
    const issues: string[] = [];

    // Check average response time (should be under 100ms per requirement 7.1)
    if (metrics.averageResponseTime > 100) {
      issues.push(`Average response time ${metrics.averageResponseTime.toFixed(1)}ms exceeds 100ms requirement`);
    }

    // Check P95 response time (should be reasonable)
    if (metrics.p95ResponseTime > 200) {
      issues.push(`P95 response time ${metrics.p95ResponseTime.toFixed(1)}ms is too high`);
    }

    // Check timeout rate
    const timeoutRate = metrics.totalOperations > 0 ? (metrics.timeoutCount / metrics.totalOperations) * 100 : 0;
    if (timeoutRate > 1) { // More than 1% timeouts
      issues.push(`Timeout rate ${timeoutRate.toFixed(1)}% is too high`);
    }

    // Check slow operation rate
    const slowRate = metrics.totalOperations > 0 ? (metrics.slowOperationCount / metrics.totalOperations) * 100 : 0;
    if (slowRate > 10) { // More than 10% slow operations
      issues.push(`Slow operation rate ${slowRate.toFixed(1)}% is too high`);
    }

    // Check concurrent request handling
    if (metrics.maxConcurrentRequests > NAMING_LIMITS.CONCURRENT_LIMIT) {
      issues.push(`Max concurrent requests ${metrics.maxConcurrentRequests} exceeds limit ${NAMING_LIMITS.CONCURRENT_LIMIT}`);
    }

    return {
      withinRequirements: issues.length === 0,
      issues,
      metrics
    };
  }

  /**
   * Get performance summary for monitoring dashboards
   */
  getPerformanceSummary(): {
    status: 'healthy' | 'warning' | 'critical';
    averageResponseTime: number;
    operationsPerSecond: number;
    errorRate: number;
    concurrentRequests: number;
  } {
    const metrics = this.getMetrics();
    const errorRate = metrics.totalOperations > 0 
      ? ((metrics.timeoutCount + metrics.slowOperationCount) / metrics.totalOperations) * 100 
      : 0;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (metrics.averageResponseTime > 200 || errorRate > 5) {
      status = 'critical';
    } else if (metrics.averageResponseTime > 100 || errorRate > 2) {
      status = 'warning';
    }

    return {
      status,
      averageResponseTime: metrics.averageResponseTime,
      operationsPerSecond: metrics.operationsPerSecond,
      errorRate,
      concurrentRequests: metrics.concurrentRequests
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.operations = [];
    this.activeOperations.clear();
    this.startTime = Date.now();
  }

  /**
   * Export performance data for analysis
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const metrics = this.getMetrics();
    
    if (format === 'csv') {
      const headers = ['timestamp', 'operationType', 'duration', 'success', 'cacheHit', 'concurrentRequests'];
      const rows = this.operations.map(op => [
        new Date(op.endTime).toISOString(),
        op.operationType,
        op.duration,
        op.success,
        op.cacheHit || false,
        op.concurrentRequests
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    return JSON.stringify({
      exportTime: new Date().toISOString(),
      metrics,
      operations: this.operations
    }, null, 2);
  }

  /**
   * Calculate metrics for a specific operation type
   */
  private calculateOperationTypeMetrics(operations: PerformanceEntry[]): OperationTypeMetrics {
    if (operations.length === 0) {
      return {
        count: 0,
        averageTime: 0,
        minTime: 0,
        maxTime: 0,
        timeoutCount: 0,
        slowCount: 0
      };
    }

    const durations = operations.map(op => op.duration);
    const timeoutCount = operations.filter(op => !op.success && op.error?.includes('timeout')).length;
    const slowCount = operations.filter(op => op.duration > this.config.slowOperationThreshold).length;

    return {
      count: operations.length,
      averageTime: durations.reduce((sum, d) => sum + d, 0) / operations.length,
      minTime: Math.min(...durations),
      maxTime: Math.max(...durations),
      timeoutCount,
      slowCount
    };
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(): NamingPerformanceMetrics {
    return {
      totalOperations: 0,
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      operationsPerSecond: 0,
      concurrentRequests: this.activeOperations.size,
      maxConcurrentRequests: 0,
      timeoutCount: 0,
      slowOperationCount: 0,
      operationsByType: {
        bagNaming: {
          count: 0,
          averageTime: 0,
          minTime: 0,
          maxTime: 0,
          timeoutCount: 0,
          slowCount: 0
        },
        brewNaming: {
          count: 0,
          averageTime: 0,
          minTime: 0,
          maxTime: 0,
          timeoutCount: 0,
          slowCount: 0
        }
      },
      recentOperations: []
    };
  }

  /**
   * Trim operation history to prevent memory leaks
   */
  private trimHistory(): void {
    if (this.operations.length > this.config.maxHistoryEntries) {
      const excess = this.operations.length - this.config.maxHistoryEntries;
      this.operations.splice(0, excess);
    }
  }

  /**
   * Start periodic cleanup of old operations
   */
  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const cutoff = Date.now() - this.config.metricsRetentionMs;
      const originalLength = this.operations.length;
      
      this.operations = this.operations.filter(op => op.endTime >= cutoff);
      
      const cleaned = originalLength - this.operations.length;
      if (cleaned > 0) {
        console.debug(`[NamingPerformance] Cleaned up ${cleaned} old performance entries`);
      }
    }, 300000); // Clean up every 5 minutes
  }

  /**
   * Destroy the monitor and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.operations = [];
    this.activeOperations.clear();
  }
}

/**
 * Global performance monitor instance
 * Created lazily to avoid issues in testing
 */
let _namingPerformanceMonitor: NamingPerformanceMonitor | undefined;

export function getNamingPerformanceMonitor(): NamingPerformanceMonitor {
  if (!_namingPerformanceMonitor) {
    _namingPerformanceMonitor = new NamingPerformanceMonitor({
      enableDetailedLogging: process.env.NODE_ENV === 'development'
    });
  }
  return _namingPerformanceMonitor;
}

export const namingPerformanceMonitor = getNamingPerformanceMonitor();