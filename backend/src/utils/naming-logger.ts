/**
 * Comprehensive logging utility for the automatic naming system
 * Provides detailed error logging, audit trails, and metrics collection
 * Requirements: 5.1, 5.4, 5.5
 */

export interface NamingLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  operation: string;
  entityType: 'bag' | 'brew';
  entityId?: string;
  baristaId?: string;
  success: boolean;
  generatedName?: string;
  duration?: number;
  error?: {
    message: string;
    code?: string;
    stack?: string;
    cause?: string;
  };
  context?: Record<string, any>;
}

export interface NamingMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorsByType: Record<string, number>;
  requestsByEntityType: Record<'bag' | 'brew', number>;
  successRateByEntityType: Record<'bag' | 'brew', number>;
  lastUpdated: string;
}

export interface NamingAuditEvent {
  timestamp: string;
  eventType: 'name_generated' | 'name_failed' | 'fallback_used' | 'admin_override';
  entityType: 'bag' | 'brew';
  entityId?: string;
  baristaId?: string;
  oldName?: string;
  newName?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Logger class for the naming service with comprehensive error tracking
 */
export class NamingLogger {
  private logs: NamingLogEntry[] = [];
  private auditTrail: NamingAuditEvent[] = [];
  private metrics: NamingMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    errorsByType: {},
    requestsByEntityType: { bag: 0, brew: 0 },
    successRateByEntityType: { bag: 0, brew: 0 },
    lastUpdated: new Date().toISOString()
  };
  private responseTimes: number[] = [];
  private maxLogEntries: number = 10000; // Prevent memory leaks
  private maxAuditEntries: number = 5000;

  /**
   * Log a naming operation start
   */
  logOperationStart(
    operation: string,
    entityType: 'bag' | 'brew',
    entityId?: string,
    baristaId?: string,
    context?: Record<string, any>
  ): string {
    const operationId = this.generateOperationId();
    
    this.addLogEntry({
      timestamp: new Date().toISOString(),
      level: 'info',
      operation: `${operation}_start`,
      entityType,
      entityId,
      baristaId,
      success: true,
      context: { ...context, operationId }
    });

    return operationId;
  }

  /**
   * Log a successful naming operation
   */
  logOperationSuccess(
    operation: string,
    entityType: 'bag' | 'brew',
    generatedName: string,
    duration: number,
    entityId?: string,
    baristaId?: string,
    context?: Record<string, any>
  ): void {
    this.addLogEntry({
      timestamp: new Date().toISOString(),
      level: 'info',
      operation: `${operation}_success`,
      entityType,
      entityId,
      baristaId,
      success: true,
      generatedName,
      duration,
      context
    });

    // Update metrics
    this.updateMetrics(entityType, true, duration);

    // Add audit event
    this.addAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'name_generated',
      entityType,
      entityId,
      baristaId,
      newName: generatedName,
      metadata: { duration, operation, ...context }
    });
  }

  /**
   * Log a naming operation failure with detailed error information
   */
  logOperationFailure(
    operation: string,
    entityType: 'bag' | 'brew',
    error: Error,
    duration: number,
    entityId?: string,
    baristaId?: string,
    context?: Record<string, any>
  ): void {
    const errorInfo = {
      message: error.message,
      code: (error as any).code,
      stack: error.stack,
      cause: error.cause ? String(error.cause) : undefined
    };

    this.addLogEntry({
      timestamp: new Date().toISOString(),
      level: 'error',
      operation: `${operation}_failure`,
      entityType,
      entityId,
      baristaId,
      success: false,
      duration,
      error: errorInfo,
      context
    });

    // Update metrics
    this.updateMetrics(entityType, false, duration);
    this.updateErrorMetrics(error);

    // Add audit event
    this.addAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'name_failed',
      entityType,
      entityId,
      baristaId,
      reason: error.message,
      metadata: { duration, operation, errorCode: (error as any).code, ...context }
    });

    // Log to console for immediate visibility
    console.error(`[NamingService] ${operation} failed for ${entityType}${entityId ? ` ${entityId}` : ''}:`, {
      error: errorInfo,
      entityType,
      entityId,
      baristaId,
      duration,
      context
    });
  }

  /**
   * Log when fallback values are used
   */
  logFallbackUsed(
    operation: string,
    entityType: 'bag' | 'brew',
    fallbackType: string,
    fallbackValue: string,
    reason: string,
    entityId?: string,
    baristaId?: string,
    context?: Record<string, any>
  ): void {
    this.addLogEntry({
      timestamp: new Date().toISOString(),
      level: 'warn',
      operation: `${operation}_fallback`,
      entityType,
      entityId,
      baristaId,
      success: true,
      context: { fallbackType, fallbackValue, reason, ...context }
    });

    // Add audit event
    this.addAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'fallback_used',
      entityType,
      entityId,
      baristaId,
      newName: fallbackValue,
      reason,
      metadata: { fallbackType, operation, ...context }
    });

    // Log warning to console
    console.warn(`[NamingService] Fallback used for ${entityType}${entityId ? ` ${entityId}` : ''}: ${fallbackType} = "${fallbackValue}" (${reason})`);
  }

  /**
   * Log admin override events
   */
  logAdminOverride(
    entityType: 'bag' | 'brew',
    entityId: string,
    oldName: string,
    newName: string,
    adminId: string,
    reason?: string
  ): void {
    this.addLogEntry({
      timestamp: new Date().toISOString(),
      level: 'info',
      operation: 'admin_override',
      entityType,
      entityId,
      baristaId: adminId,
      success: true,
      generatedName: newName,
      context: { oldName, reason, adminId }
    });

    // Add audit event
    this.addAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: 'admin_override',
      entityType,
      entityId,
      baristaId: adminId,
      oldName,
      newName,
      reason,
      metadata: { adminId }
    });

    // Log to console for admin actions
    console.info(`[NamingService] Admin override: ${entityType} ${entityId} name changed from "${oldName}" to "${newName}" by admin ${adminId}${reason ? ` (${reason})` : ''}`);
  }

  /**
   * Log database query failures with detailed context
   */
  logDatabaseFailure(
    operation: string,
    table: string,
    query: string,
    error: Error,
    entityId?: string,
    context?: Record<string, any>
  ): void {
    this.addLogEntry({
      timestamp: new Date().toISOString(),
      level: 'error',
      operation: `db_${operation}_failure`,
      entityType: 'bag', // Default, will be overridden by context if needed
      entityId,
      success: false,
      error: {
        message: error.message,
        code: (error as any).code,
        stack: error.stack
      },
      context: { table, query, ...context }
    });

    // Log to console for immediate visibility
    console.error(`[NamingService] Database ${operation} failed on table ${table}:`, {
      error: error.message,
      query,
      entityId,
      context
    });
  }

  /**
   * Get current metrics for monitoring
   */
  getMetrics(): NamingMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent log entries for debugging
   */
  getRecentLogs(limit: number = 100): NamingLogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get audit trail for compliance and debugging
   */
  getAuditTrail(limit: number = 100): NamingAuditEvent[] {
    return this.auditTrail.slice(-limit);
  }

  /**
   * Get error summary for troubleshooting
   */
  getErrorSummary(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: NamingLogEntry[];
    failureRate: number;
  } {
    const recentErrors = this.logs
      .filter(log => log.level === 'error')
      .slice(-50);

    return {
      totalErrors: this.metrics.failedRequests,
      errorsByType: { ...this.metrics.errorsByType },
      recentErrors,
      failureRate: this.metrics.totalRequests > 0 
        ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100 
        : 0
    };
  }

  /**
   * Clear old log entries to prevent memory leaks
   */
  cleanup(): void {
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    if (this.auditTrail.length > this.maxAuditEntries) {
      this.auditTrail = this.auditTrail.slice(-this.maxAuditEntries);
    }

    // Keep only recent response times for average calculation
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  /**
   * Export logs for external analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify({
        logs: this.logs,
        auditTrail: this.auditTrail,
        metrics: this.metrics,
        exportedAt: new Date().toISOString()
      }, null, 2);
    }

    // CSV format for logs
    const headers = ['timestamp', 'level', 'operation', 'entityType', 'entityId', 'baristaId', 'success', 'generatedName', 'duration', 'errorMessage'];
    const csvRows = [headers.join(',')];
    
    for (const log of this.logs) {
      const row = [
        log.timestamp,
        log.level,
        log.operation,
        log.entityType,
        log.entityId || '',
        log.baristaId || '',
        log.success.toString(),
        log.generatedName || '',
        log.duration?.toString() || '',
        log.error?.message || ''
      ].map(field => `"${field}"`);
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  private addLogEntry(entry: NamingLogEntry): void {
    this.logs.push(entry);
    
    // Cleanup if needed
    if (this.logs.length > this.maxLogEntries * 1.1) {
      this.cleanup();
    }
  }

  private addAuditEvent(event: NamingAuditEvent): void {
    this.auditTrail.push(event);
    
    // Cleanup if needed
    if (this.auditTrail.length > this.maxAuditEntries * 1.1) {
      this.cleanup();
    }
  }

  private updateMetrics(entityType: 'bag' | 'brew', success: boolean, duration: number): void {
    this.metrics.totalRequests++;
    this.metrics.requestsByEntityType[entityType]++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update response times
    this.responseTimes.push(duration);
    this.metrics.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    // Update success rates by entity type
    const entityRequests = this.metrics.requestsByEntityType[entityType];
    const entitySuccesses = this.logs
      .filter(log => log.entityType === entityType && log.success)
      .length;
    this.metrics.successRateByEntityType[entityType] = (entitySuccesses / entityRequests) * 100;

    this.metrics.lastUpdated = new Date().toISOString();
  }

  private updateErrorMetrics(error: Error): void {
    const errorType = error.constructor.name;
    this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Global naming logger instance
 */
export const namingLogger = new NamingLogger();