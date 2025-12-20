/**
 * Debounce utility for optimizing preview requests
 * Delays function execution until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Debounce utility specifically for async functions
 * Returns a promise that resolves with the result of the debounced function
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: ReturnType<typeof setTimeout>;
  let latestResolve: ((value: ReturnType<T>) => void) | null = null;
  let latestReject: ((reason?: any) => void) | null = null;
  
  return function executedFunction(...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise<ReturnType<T>>((resolve, reject) => {
      // Cancel previous timeout and reject previous promise if it exists
      if (timeout) {
        clearTimeout(timeout);
        if (latestReject) {
          latestReject(new Error('Debounced call cancelled'));
        }
      }
      
      // Store the latest resolve/reject functions
      latestResolve = resolve;
      latestReject = reject;
      
      timeout = setTimeout(async () => {
        try {
          const result = await func(...args);
          if (latestResolve) {
            latestResolve(result);
          }
        } catch (error) {
          if (latestReject) {
            latestReject(error);
          }
        } finally {
          // Clear the stored functions
          latestResolve = null;
          latestReject = null;
        }
      }, wait);
    });
  };
}