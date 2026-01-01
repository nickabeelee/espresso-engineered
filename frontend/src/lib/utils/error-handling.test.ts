import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  categorizeError,
  isRetryableError,
  getUserFriendlyMessage,
  withRetry,
  AppError,
  ErrorType
} from './error-handling';

describe('Error Handling Utilities', () => {
  describe('categorizeError', () => {
    it('should categorize network errors', () => {
      const networkError = new Error('fetch failed');
      expect(categorizeError(networkError)).toBe(ErrorType.NETWORK);
    });

    it('should categorize validation errors', () => {
      const validationError = new Error('400 validation failed');
      expect(categorizeError(validationError)).toBe(ErrorType.VALIDATION);
    });

    it('should categorize permission errors', () => {
      const permissionError = new Error('403 forbidden');
      expect(categorizeError(permissionError)).toBe(ErrorType.PERMISSION);
    });

    it('should categorize not found errors', () => {
      const notFoundError = new Error('404 not found');
      expect(categorizeError(notFoundError)).toBe(ErrorType.NOT_FOUND);
    });

    it('should categorize server errors', () => {
      const serverError = new Error('500 internal server error');
      expect(categorizeError(serverError)).toBe(ErrorType.SERVER);
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable network errors', () => {
      const networkError = new Error('network connection failed');
      expect(isRetryableError(networkError)).toBe(true);
    });

    it('should identify retryable server errors', () => {
      const serverError = new Error('500 server error');
      expect(isRetryableError(serverError)).toBe(true);
    });

    it('should identify non-retryable validation errors', () => {
      const validationError = new Error('400 validation error');
      expect(isRetryableError(validationError)).toBe(false);
    });

    it('should identify non-retryable permission errors', () => {
      const permissionError = new Error('403 forbidden');
      expect(isRetryableError(permissionError)).toBe(false);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return custom user message when provided', () => {
      const error = new Error('Technical error');
      const context = {
        operation: 'load',
        entityType: 'bean',
        userMessage: 'Custom message'
      };
      
      expect(getUserFriendlyMessage(error, context)).toBe('Custom message');
    });

    it('should generate appropriate message for network errors', () => {
      const error = new Error('fetch failed');
      const context = { operation: 'load', entityType: 'bean' };
      
      const message = getUserFriendlyMessage(error, context);
      expect(message).toContain('connect to the server');
    });

    it('should generate appropriate message for validation errors', () => {
      const error = new Error('400 validation failed');
      const context = { operation: 'create', entityType: 'bean' };
      
      const message = getUserFriendlyMessage(error, context);
      expect(message).toContain('invalid');
    });
  });

  describe('withRetry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await withRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');
      
      const promise = withRetry(operation, { maxAttempts: 2, baseDelay: 100 });
      
      // Advance timers and wait for promise resolution
      await vi.runAllTimersAsync();
      const result = await promise;
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('403 forbidden'));
      
      await expect(withRetry(operation)).rejects.toThrow('403 forbidden');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should fail after max attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('network error'));
      
      // Use expect.rejects to properly handle the rejection
      const retryPromise = withRetry(operation, { maxAttempts: 2, baseDelay: 100 });
      
      // Run timers and wait for completion
      const testPromise = expect(retryPromise).rejects.toThrow('network error');
      await vi.runAllTimersAsync();
      await testPromise;
      
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('AppError', () => {
    it('should create error with context', () => {
      const originalError = new Error('Original message');
      const context = { operation: 'load', entityType: 'bean' };
      
      const appError = new AppError('User message', context, originalError);
      
      expect(appError.message).toBe('User message');
      expect(appError.context).toBe(context);
      expect(appError.originalError).toBe(originalError);
      expect(appError.type).toBe(ErrorType.UNKNOWN);
    });

    it('should generate user-friendly message', () => {
      const originalError = new Error('network failed');
      const context = { operation: 'load', entityType: 'bean' };
      
      const appError = new AppError('Technical error', context, originalError);
      
      const userMessage = appError.getUserMessage();
      expect(userMessage).toContain('connect to the server');
    });
  });
});