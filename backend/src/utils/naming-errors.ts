/**
 * Enhanced error handling utilities for the naming service
 * Provides graceful degradation and comprehensive edge case handling
 * Requirements: 3.5
 */

import { namingLogger } from './naming-logger.js';

/**
 * Specific error types for naming operations
 */
export class NamingTimeoutError extends Error {
  constructor(operation: string, timeoutMs: number) {
    super(`Naming operation '${operation}' timed out after ${timeoutMs}ms`);
    this.name = 'NamingTimeoutError';
  }
}

export class NamingDatabaseError extends Error {
  constructor(operation: string, table: string, cause?: Error) {
    super(`Database ${operation} failed on table '${table}': ${cause?.message || 'Unknown error'}`);
    this.name = 'NamingDatabaseError';
    this.cause = cause;
  }
}

export class NamingValidationError extends Error {
  constructor(field: string, value: any, reason: string) {
    super(`Validation failed for field '${field}' with value '${value}': ${reason}`);
    this.name = 'NamingValidationError';
  }
}

export class NamingConcurrencyError extends Error {
  constructor(operation: string, details: string) {
    super(`Concurrency issue in operation '${operation}': ${details}`);
    this.name = 'NamingConcurrencyError';
  }
}

/**
 * Edge case scenarios that the naming service must handle
 */
export interface EdgeCaseScenario {
  scenario: string;
  description: string;
  fallbackStrategy: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const EDGE_CASE_SCENARIOS: EdgeCaseScenario[] = [
  {
    scenario: 'null_barista_id',
    description: 'Barista ID is null or undefined',
    fallbackStrategy: 'Use "Anonymous" as barista name',
    severity: 'medium'
  },
  {
    scenario: 'invalid_uuid_format',
    description: 'Entity IDs are not valid UUID format',
    fallbackStrategy: 'Continue with provided ID, log warning',
    severity: 'low'
  },
  {
    scenario: 'empty_string_ids',
    description: 'Entity IDs are empty strings',
    fallbackStrategy: 'Use fallback names, log error',
    severity: 'high'
  },
  {
    scenario: 'database_connection_lost',
    description: 'Database connection is lost during operation',
    fallbackStrategy: 'Use cached data or fallback values',
    severity: 'critical'
  },
  {
    scenario: 'malformed_date_strings',
    description: 'Roast date strings are malformed or invalid',
    fallbackStrategy: 'Use "Unknown Roast" fallback',
    severity: 'low'
  },
  {
    scenario: 'extreme_unicode_characters',
    description: 'Names contain extreme Unicode characters or emojis',
    fallbackStrategy: 'Normalize and preserve characters',
    severity: 'low'
  },
  {
    scenario: 'very_long_names',
    description: 'Bean or barista names are extremely long',
    fallbackStrategy: 'Truncate with ellipsis, preserve readability',
    severity: 'medium'
  },
  {
    scenario: 'circular_references',
    description: 'Database relationships contain circular references',
    fallbackStrategy: 'Break cycles, use fallback data',
    severity: 'high'
  },
  {
    scenario: 'timezone_parsing_failure',
    description: 'Timezone information is invalid or unparseable',
    fallbackStrategy: 'Use UTC with clear indication',
    severity: 'medium'
  },
  {
    scenario: 'memory_pressure',
    description: 'System is under high memory pressure',
    fallbackStrategy: 'Cleanup caches, use minimal processing',
    severity: 'high'
  },
  {
    scenario: 'concurrent_modification',
    description: 'Entity data is modified during naming operation',
    fallbackStrategy: 'Retry with fresh data or use snapshot',
    severity: 'medium'
  },
  {
    scenario: 'template_corruption',
    description: 'Name templates are corrupted or invalid',
    fallbackStrategy: 'Use hardcoded fallback templates',
    severity: 'critical'
  }
];

/**
 * Comprehensive error handler for naming operations
 */
export class NamingErrorHandler {
  private static readonly MAX_NAME_LENGTH = 255;
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY_MS = 100;

  /**
   * Handle edge case scenarios with appropriate fallback strategies
   */
  static async handleEdgeCase<T>(
    scenario: string,
    operation: () => Promise<T>,
    fallbackValue: T,
    context: {
      entityType: 'bag' | 'brew';
      entityId?: string;
      baristaId?: string;
      operationName: string;
    }
  ): Promise<T> {
    const edgeCase = EDGE_CASE_SCENARIOS.find(ec => ec.scenario === scenario);
    
    try {
      return await operation();
    } catch (error) {
      // Log the edge case handling
      namingLogger.logFallbackUsed(
        context.operationName,
        context.entityType,
        scenario,
        String(fallbackValue),
        `Edge case: ${edgeCase?.description || scenario} - ${error}`,
        context.entityId,
        context.baristaId,
        { 
          scenario, 
          severity: edgeCase?.severity || 'unknown',
          fallbackStrategy: edgeCase?.fallbackStrategy || 'Use fallback value'
        }
      );

      return fallbackValue;
    }
  }

  /**
   * Validate and sanitize input parameters
   */
  static validateInputs(params: {
    baristaId?: string;
    entityId?: string;
    beanId?: string;
    bagId?: string;
    roastDate?: string;
  }): {
    isValid: boolean;
    errors: string[];
    sanitized: typeof params;
  } {
    const errors: string[] = [];
    const sanitized = { ...params };

    // Validate barista ID
    if (params.baristaId !== undefined) {
      if (!params.baristaId || typeof params.baristaId !== 'string') {
        errors.push('Barista ID must be a non-empty string');
        sanitized.baristaId = undefined;
      } else if (params.baristaId.trim().length === 0) {
        errors.push('Barista ID cannot be empty or whitespace only');
        sanitized.baristaId = undefined;
      }
    }

    // Validate entity IDs (similar pattern for all ID fields)
    for (const idField of ['entityId', 'beanId', 'bagId'] as const) {
      const value = params[idField];
      if (value !== undefined) {
        if (!value || typeof value !== 'string') {
          errors.push(`${idField} must be a non-empty string`);
          sanitized[idField] = undefined;
        } else if (value.trim().length === 0) {
          errors.push(`${idField} cannot be empty or whitespace only`);
          sanitized[idField] = undefined;
        }
      }
    }

    // Validate roast date
    if (params.roastDate !== undefined && params.roastDate !== null) {
      if (typeof params.roastDate !== 'string') {
        errors.push('Roast date must be a string');
        sanitized.roastDate = undefined;
      } else {
        const trimmed = params.roastDate.trim();
        if (trimmed.length === 0) {
          sanitized.roastDate = undefined;
        } else {
          // Try to parse the date to validate it
          const parsed = new Date(trimmed);
          if (isNaN(parsed.getTime())) {
            errors.push(`Invalid roast date format: ${trimmed}`);
            sanitized.roastDate = undefined;
          } else {
            sanitized.roastDate = trimmed;
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * Sanitize and truncate names to prevent issues
   */
  static sanitizeName(name: string, maxLength: number = NamingErrorHandler.MAX_NAME_LENGTH): string {
    if (!name || typeof name !== 'string') {
      return '';
    }

    // Normalize Unicode characters
    let sanitized = name.normalize('NFC');

    // Remove control characters but preserve printable Unicode
    sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Truncate if too long, preserving word boundaries when possible
    if (sanitized.length > maxLength) {
      const truncated = sanitized.substring(0, maxLength - 3);
      const lastSpace = truncated.lastIndexOf(' ');
      
      if (lastSpace > maxLength * 0.7) {
        // If we can break at a word boundary without losing too much, do so
        sanitized = truncated.substring(0, lastSpace) + '...';
      } else {
        // Otherwise, hard truncate
        sanitized = truncated + '...';
      }
    }

    return sanitized;
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = NamingErrorHandler.MAX_RETRY_ATTEMPTS,
    baseDelayMs: number = NamingErrorHandler.RETRY_DELAY_MS,
    context?: {
      operationName: string;
      entityType: 'bag' | 'brew';
      entityId?: string;
    }
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts) {
          // Final attempt failed, log and throw
          if (context) {
            namingLogger.logOperationFailure(
              context.operationName,
              context.entityType,
              lastError,
              0, // Duration not tracked in retry
              context.entityId,
              undefined,
              { 
                retryAttempts: maxAttempts,
                finalAttempt: true
              }
            );
          }
          throw lastError;
        }

        // Wait before retrying with exponential backoff
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (context) {
          namingLogger.logFallbackUsed(
            context.operationName,
            context.entityType,
            'retry',
            `Attempt ${attempt + 1}`,
            `Retry after error: ${lastError.message}`,
            context.entityId,
            undefined,
            { attempt, maxAttempts, delay }
          );
        }
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError!;
  }

  /**
   * Handle database connection issues gracefully
   */
  static async handleDatabaseOperation<T>(
    operation: () => Promise<T>,
    fallbackValue: T,
    context: {
      operationName: string;
      table: string;
      query: string;
      entityType: 'bag' | 'brew';
      entityId?: string;
    }
  ): Promise<T> {
    try {
      return await this.retryWithBackoff(
        operation,
        2, // Fewer retries for database operations
        50, // Shorter delay for database operations
        {
          operationName: context.operationName,
          entityType: context.entityType,
          entityId: context.entityId
        }
      );
    } catch (error) {
      // Log database failure
      namingLogger.logDatabaseFailure(
        context.operationName,
        context.table,
        context.query,
        error instanceof Error ? error : new Error(String(error)),
        context.entityId,
        { gracefulDegradation: true }
      );

      // Log fallback usage
      namingLogger.logFallbackUsed(
        context.operationName,
        context.entityType,
        'database_fallback',
        String(fallbackValue),
        `Database operation failed: ${error}`,
        context.entityId,
        undefined,
        { table: context.table, query: context.query }
      );

      return fallbackValue;
    }
  }

  /**
   * Ensure system continues to function even with complete naming failure
   */
  static createEmergencyFallback(
    entityType: 'bag' | 'brew',
    timestamp: Date = new Date()
  ): string {
    const dateStr = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toISOString().split('T')[1].substring(0, 5);
    
    if (entityType === 'bag') {
      return `Bag ${dateStr}`;
    } else {
      return `Brew ${dateStr} ${timeStr}`;
    }
  }

  /**
   * Check system health and adjust behavior accordingly
   */
  static checkSystemHealth(): {
    memoryPressure: boolean;
    databaseConnected: boolean;
    recommendedAction: 'normal' | 'degraded' | 'emergency';
  } {
    // Check memory usage (Node.js specific)
    const memUsage = process.memoryUsage();
    const memoryPressure = memUsage.heapUsed / memUsage.heapTotal > 0.9;

    // For now, assume database is connected (could be enhanced with actual health check)
    const databaseConnected = true;

    let recommendedAction: 'normal' | 'degraded' | 'emergency' = 'normal';
    
    if (memoryPressure && !databaseConnected) {
      recommendedAction = 'emergency';
    } else if (memoryPressure || !databaseConnected) {
      recommendedAction = 'degraded';
    }

    return {
      memoryPressure,
      databaseConnected,
      recommendedAction
    };
  }
}

/**
 * Graceful degradation strategies for different failure scenarios
 */
export const DEGRADATION_STRATEGIES = {
  /**
   * When database is completely unavailable
   */
  DATABASE_UNAVAILABLE: {
    strategy: 'Use cached data or generate minimal names with timestamps',
    implementation: (entityType: 'bag' | 'brew') => 
      NamingErrorHandler.createEmergencyFallback(entityType)
  },

  /**
   * When memory pressure is high
   */
  MEMORY_PRESSURE: {
    strategy: 'Disable caching, use minimal processing',
    implementation: () => {
      // Could trigger cleanup of caches, disable non-essential features
      console.warn('[NamingService] Memory pressure detected, switching to minimal processing mode');
    }
  },

  /**
   * When naming service is completely failing
   */
  COMPLETE_FAILURE: {
    strategy: 'Allow entity creation with null names, log for manual review',
    implementation: (entityType: 'bag' | 'brew', entityId?: string) => {
      namingLogger.logOperationFailure(
        'complete_failure',
        entityType,
        new Error('Complete naming service failure'),
        0,
        entityId,
        undefined,
        { severity: 'critical', requiresManualReview: true }
      );
      return null; // Allow creation with null name
    }
  }
} as const;