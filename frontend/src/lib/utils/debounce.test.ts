import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, debounceAsync } from './debounce';

describe('Debounce Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should cancel previous calls when called multiple times', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      vi.advanceTimersByTime(50);
      
      debouncedFn('second');
      vi.advanceTimersByTime(50);
      
      debouncedFn('third');
      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });

    it('should preserve function context and arguments', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2', 'arg3');
      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });
  });

  describe('debounceAsync', () => {
    it('should delay async function execution', async () => {
      const mockAsyncFn = vi.fn().mockResolvedValue('result');
      const debouncedFn = debounceAsync(mockAsyncFn, 100);

      const promise = debouncedFn('test');
      expect(mockAsyncFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      const result = await promise;

      expect(mockAsyncFn).toHaveBeenCalledWith('test');
      expect(result).toBe('result');
    });

    it('should cancel previous calls and reject their promises', async () => {
      const mockAsyncFn = vi.fn().mockResolvedValue('result');
      const debouncedFn = debounceAsync(mockAsyncFn, 100);

      const promise1 = debouncedFn('first');
      vi.advanceTimersByTime(50);
      
      const promise2 = debouncedFn('second');
      
      // First promise should be rejected
      await expect(promise1).rejects.toThrow('Debounced call cancelled');
      
      vi.advanceTimersByTime(100);
      const result = await promise2;

      expect(mockAsyncFn).toHaveBeenCalledTimes(1);
      expect(mockAsyncFn).toHaveBeenCalledWith('second');
      expect(result).toBe('result');
    });

    it('should handle async function errors', async () => {
      const error = new Error('Async error');
      const mockAsyncFn = vi.fn().mockRejectedValue(error);
      const debouncedFn = debounceAsync(mockAsyncFn, 100);

      const promise = debouncedFn('test');
      vi.advanceTimersByTime(100);

      await expect(promise).rejects.toThrow('Async error');
      expect(mockAsyncFn).toHaveBeenCalledWith('test');
    });

    it('should handle multiple concurrent calls correctly', async () => {
      const mockAsyncFn = vi.fn()
        .mockResolvedValueOnce('result1')
        .mockResolvedValueOnce('result2');
      const debouncedFn = debounceAsync(mockAsyncFn, 100);

      // Start multiple calls
      const promise1 = debouncedFn('first');
      const promise2 = debouncedFn('second');
      const promise3 = debouncedFn('third');

      // Only the last call should succeed
      await expect(promise1).rejects.toThrow('Debounced call cancelled');
      await expect(promise2).rejects.toThrow('Debounced call cancelled');
      
      vi.advanceTimersByTime(100);
      const result = await promise3;

      expect(mockAsyncFn).toHaveBeenCalledTimes(1);
      expect(mockAsyncFn).toHaveBeenCalledWith('third');
      expect(result).toBe('result1');
    });

    it('should preserve async function arguments', async () => {
      const mockAsyncFn = vi.fn().mockResolvedValue('result');
      const debouncedFn = debounceAsync(mockAsyncFn, 100);

      const promise = debouncedFn('arg1', 'arg2', { key: 'value' });
      vi.advanceTimersByTime(100);
      await promise;

      expect(mockAsyncFn).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' });
    });
  });

  describe('Performance Optimization', () => {
    it('should optimize rapid successive calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 300); // 300ms like in components

      // Simulate rapid user input
      for (let i = 0; i < 10; i++) {
        debouncedFn(`input-${i}`);
        vi.advanceTimersByTime(50); // 50ms between calls
      }

      // Should not have been called yet
      expect(mockFn).not.toHaveBeenCalled();

      // Wait for debounce period
      vi.advanceTimersByTime(300);

      // Should only be called once with the last input
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('input-9');
    });

    it('should handle async preview requests efficiently', async () => {
      const mockPreviewFn = vi.fn().mockResolvedValue('preview-name');
      const debouncedPreviewFn = debounceAsync(mockPreviewFn, 300);

      // Simulate rapid form changes
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(debouncedPreviewFn(`bag-id-${i}`));
        vi.advanceTimersByTime(100);
      }

      // All but the last should be cancelled
      for (let i = 0; i < 4; i++) {
        await expect(promises[i]).rejects.toThrow('Debounced call cancelled');
      }

      vi.advanceTimersByTime(300);
      const result = await promises[4];

      expect(mockPreviewFn).toHaveBeenCalledTimes(1);
      expect(mockPreviewFn).toHaveBeenCalledWith('bag-id-4');
      expect(result).toBe('preview-name');
    });
  });
});