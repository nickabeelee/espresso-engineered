/**
 * Loading state management utilities for the Bean Inventory Management system
 * Provides centralized loading state tracking and UI feedback
 */

import { writable, derived, type Readable } from 'svelte/store';

export interface LoadingState {
  isLoading: boolean;
  operation?: string;
  progress?: number;
  message?: string;
}

/**
 * Loading state manager for tracking multiple concurrent operations
 */
export class LoadingStateManager {
  private states = writable<Map<string, LoadingState>>(new Map());
  
  /**
   * Start a loading operation
   */
  start(key: string, operation?: string, message?: string): void {
    this.states.update(states => {
      const newStates = new Map(states);
      newStates.set(key, {
        isLoading: true,
        operation,
        message
      });
      return newStates;
    });
  }
  
  /**
   * Update progress for a loading operation
   */
  updateProgress(key: string, progress: number, message?: string): void {
    this.states.update(states => {
      const newStates = new Map(states);
      const currentState = newStates.get(key);
      if (currentState) {
        newStates.set(key, {
          ...currentState,
          progress,
          message: message || currentState.message
        });
      }
      return newStates;
    });
  }
  
  /**
   * Complete a loading operation
   */
  complete(key: string): void {
    this.states.update(states => {
      const newStates = new Map(states);
      newStates.delete(key);
      return newStates;
    });
  }
  
  /**
   * Check if a specific operation is loading
   */
  isLoading(key: string): Readable<boolean> {
    return derived(this.states, $states => {
      const state = $states.get(key);
      return state?.isLoading ?? false;
    });
  }
  
  /**
   * Get loading state for a specific operation
   */
  getState(key: string): Readable<LoadingState | undefined> {
    return derived(this.states, $states => $states.get(key));
  }
  
  /**
   * Check if any operations are loading
   */
  get hasAnyLoading(): Readable<boolean> {
    return derived(this.states, $states => {
      return Array.from($states.values()).some(state => state.isLoading);
    });
  }
  
  /**
   * Get all current loading operations
   */
  get allStates(): Readable<LoadingState[]> {
    return derived(this.states, $states => Array.from($states.values()));
  }
  
  /**
   * Clear all loading states
   */
  clearAll(): void {
    this.states.set(new Map());
  }
}

// Global loading state manager
export const globalLoadingManager = new LoadingStateManager();

/**
 * Loading operation keys for bean inventory management
 */
export const LoadingKeys = {
  // Bean operations
  BEANS_LIST: 'beans-list',
  BEAN_DETAIL: 'bean-detail',
  BEAN_CREATE: 'bean-create',
  BEAN_UPDATE: 'bean-update',
  BEAN_DELETE: 'bean-delete',
  
  // Bean rating operations
  RATING_CREATE: 'rating-create',
  RATING_UPDATE: 'rating-update',
  RATING_DELETE: 'rating-delete',
  
  // Bag operations
  BAGS_LIST: 'bags-list',
  BAG_CREATE: 'bag-create',
  BAG_UPDATE: 'bag-update',
  BAG_DELETE: 'bag-delete',
  BAG_STATUS_UPDATE: 'bag-status-update',
  
  // Roaster operations
  ROASTERS_LIST: 'roasters-list',
  ROASTER_CREATE: 'roaster-create',
  
  // Search and filter operations
  SEARCH: 'search',
  FILTER: 'filter',
  
  // Batch operations
  BATCH_SYNC: 'batch-sync',
  BULK_UPDATE: 'bulk-update'
} as const;

/**
 * Helper function to wrap async operations with loading state
 */
export async function withLoadingState<T>(
  key: string,
  operation: () => Promise<T>,
  operationName?: string,
  progressCallback?: (progress: number, message?: string) => void
): Promise<T> {
  globalLoadingManager.start(key, operationName);
  
  try {
    if (progressCallback) {
      // Simulate progress for operations that don't provide it
      const progressInterval = setInterval(() => {
        progressCallback(Math.random() * 50 + 25, 'Processing...');
      }, 500);
      
      try {
        const result = await operation();
        clearInterval(progressInterval);
        progressCallback(100, 'Complete');
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    } else {
      return await operation();
    }
  } finally {
    globalLoadingManager.complete(key);
  }
}

/**
 * Debounced loading state for search operations
 */
export class DebouncedLoadingState {
  private timeoutId: NodeJS.Timeout | null = null;
  private manager: LoadingStateManager;
  
  constructor(manager: LoadingStateManager = globalLoadingManager) {
    this.manager = manager;
  }
  
  start(key: string, delay: number = 300, operation?: string): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    this.timeoutId = setTimeout(() => {
      this.manager.start(key, operation);
      this.timeoutId = null;
    }, delay);
  }
  
  complete(key: string): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.manager.complete(key);
  }
}

/**
 * Loading state store for individual components
 */
export function createLoadingStore(initialState: boolean = false) {
  const { subscribe, set, update } = writable(initialState);
  
  return {
    subscribe,
    start: () => set(true),
    stop: () => set(false),
    toggle: () => update(state => !state)
  };
}

/**
 * Loading state with timeout
 */
export function createTimedLoadingStore(timeoutMs: number = 30000) {
  const store = createLoadingStore();
  let timeoutId: NodeJS.Timeout | null = null;
  
  return {
    ...store,
    start: () => {
      store.start();
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        store.stop();
        console.warn(`Loading operation timed out after ${timeoutMs}ms`);
      }, timeoutMs);
    },
    stop: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      store.stop();
    }
  };
}

/**
 * Batch loading state for multiple operations
 */
export class BatchLoadingState {
  private operations = new Set<string>();
  private manager: LoadingStateManager;
  private batchKey: string;
  
  constructor(batchKey: string, manager: LoadingStateManager = globalLoadingManager) {
    this.batchKey = batchKey;
    this.manager = manager;
  }
  
  addOperation(operationKey: string): void {
    this.operations.add(operationKey);
    this.updateBatchState();
  }
  
  completeOperation(operationKey: string): void {
    this.operations.delete(operationKey);
    this.updateBatchState();
  }
  
  private updateBatchState(): void {
    if (this.operations.size > 0) {
      this.manager.start(
        this.batchKey,
        'batch-operation',
        `Processing ${this.operations.size} operations...`
      );
    } else {
      this.manager.complete(this.batchKey);
    }
  }
  
  clear(): void {
    this.operations.clear();
    this.manager.complete(this.batchKey);
  }
}