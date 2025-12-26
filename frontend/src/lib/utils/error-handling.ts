/**
 * Comprehensive error handling utilities for the Bean Inventory Management system
 * Provides network error handling, retry mechanisms, validation feedback, and user-friendly messaging
 */

export interface ErrorContext {
  operation: string;
  entityType?: string;
  retryable?: boolean;
  userMessage?: string;
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

export interface NetworkError extends Error {
  status?: number;
  code?: string;
  retryable?: boolean;
}

/**
 * Error types that can occur in the application
 */
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

/**
 * Categorize errors based on their characteristics
 */
export function categorizeError(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return ErrorType.NETWORK;
  }
  
  // HTTP status-based categorization
  if (message.includes('400') || message.includes('validation')) {
    return ErrorType.VALIDATION;
  }
  
  if (message.includes('401') || message.includes('403') || message.includes('unauthorized') || message.includes('forbidden')) {
    return ErrorType.PERMISSION;
  }
  
  if (message.includes('404') || message.includes('not found')) {
    return ErrorType.NOT_FOUND;
  }
  
  if (message.includes('409') || message.includes('conflict')) {
    return ErrorType.CONFLICT;
  }
  
  if (message.includes('429') || message.includes('rate limit')) {
    return ErrorType.RATE_LIMIT;
  }
  
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
    return ErrorType.SERVER;
  }
  
  return ErrorType.UNKNOWN;
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const errorType = categorizeError(error);
  const message = error.message.toLowerCase();
  
  // Network errors are generally retryable
  if (errorType === ErrorType.NETWORK) {
    return true;
  }
  
  // Server errors (5xx) are retryable
  if (errorType === ErrorType.SERVER) {
    return true;
  }
  
  // Rate limit errors are retryable after delay
  if (errorType === ErrorType.RATE_LIMIT) {
    return true;
  }
  
  // Timeout errors are retryable
  if (message.includes('timeout') || message.includes('timed out')) {
    return true;
  }
  
  // Client errors (4xx) are generally not retryable
  return false;
}

/**
 * Generate user-friendly error messages
 */
export function getUserFriendlyMessage(error: Error, context: ErrorContext): string {
  if (context.userMessage) {
    return context.userMessage;
  }
  
  const errorType = categorizeError(error);
  const { operation, entityType = 'item' } = context;
  
  switch (errorType) {
    case ErrorType.NETWORK:
      return `Unable to connect to the server. Please check your internet connection and try again.`;
    
    case ErrorType.VALIDATION:
      return `The ${entityType} information is invalid. Please check your input and try again.`;
    
    case ErrorType.PERMISSION:
      return `You don't have permission to ${operation} this ${entityType}.`;
    
    case ErrorType.NOT_FOUND:
      return `The ${entityType} you're looking for could not be found.`;
    
    case ErrorType.CONFLICT:
      return `This ${entityType} conflicts with existing data. Please check for duplicates.`;
    
    case ErrorType.RATE_LIMIT:
      return `Too many requests. Please wait a moment and try again.`;
    
    case ErrorType.SERVER:
      return `The server is experiencing issues. Please try again in a few moments.`;
    
    default:
      return `Failed to ${operation} ${entityType}. Please try again.`;
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on last attempt or non-retryable errors
      if (attempt === maxAttempts || !isRetryableError(lastError)) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  throw lastError!;
}

/**
 * Enhanced error class with additional context
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly retryable: boolean;
  public readonly context: ErrorContext;
  public readonly originalError?: Error;
  
  constructor(
    message: string,
    context: ErrorContext,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.context = context;
    this.originalError = originalError;
    this.type = originalError ? categorizeError(originalError) : ErrorType.UNKNOWN;
    this.retryable = originalError ? isRetryableError(originalError) : false;
  }
  
  getUserMessage(): string {
    return getUserFriendlyMessage(this.originalError || this, this.context);
  }
}

/**
 * Validation error handling for forms
 */
export interface ValidationError {
  field: string;
  message: string;
}

export function parseValidationErrors(error: Error): ValidationError[] {
  try {
    // Try to parse Zod validation errors
    const errorData = JSON.parse(error.message);
    if (errorData.details && Array.isArray(errorData.details)) {
      return errorData.details.map((detail: any) => ({
        field: detail.path?.join('.') || 'unknown',
        message: detail.message || 'Invalid value'
      }));
    }
  } catch {
    // If parsing fails, return generic validation error
  }
  
  return [{
    field: 'general',
    message: error.message || 'Validation failed'
  }];
}

/**
 * Network status detection
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Create a timeout promise for operations
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Debounce function for search and input handling
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Error boundary helper for Svelte components
 */
export class ErrorBoundary {
  private errors: Map<string, AppError> = new Map();
  private listeners: Set<(errors: Map<string, AppError>) => void> = new Set();
  
  addError(key: string, error: Error, context: ErrorContext): void {
    const appError = error instanceof AppError ? error : new AppError(error.message, context, error);
    this.errors.set(key, appError);
    this.notifyListeners();
  }
  
  removeError(key: string): void {
    this.errors.delete(key);
    this.notifyListeners();
  }
  
  clearErrors(): void {
    this.errors.clear();
    this.notifyListeners();
  }
  
  getError(key: string): AppError | undefined {
    return this.errors.get(key);
  }
  
  hasErrors(): boolean {
    return this.errors.size > 0;
  }
  
  getAllErrors(): AppError[] {
    return Array.from(this.errors.values());
  }
  
  subscribe(listener: (errors: Map<string, AppError>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(new Map(this.errors)));
  }
}

// Global error boundary instance
export const globalErrorBoundary = new ErrorBoundary();