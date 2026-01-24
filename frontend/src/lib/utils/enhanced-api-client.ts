/**
 * Enhanced API client with comprehensive error handling, retry mechanisms, and loading state management
 * Wraps the existing apiClient with additional error handling capabilities
 */

import { apiClient } from '../api-client';
import { 
  withRetry, 
  withTimeout, 
  AppError, 
  getUserFriendlyMessage,
  isRetryableError,
  type ErrorContext
} from './error-handling';
import { globalLoadingManager, LoadingKeys, withLoadingState } from './loading-state';
import type { 
  BeanWithContext, 
  Bean, 
  Bag, 
  Roaster, 
  BeanFilters, 
  PaginationParams,
  CreateBeanRequest,
  CreateBagRequest,
  UpdateBagRequest,
  CreateBeanRatingRequest,
  UpdateBeanRatingRequest,
  ListResponse,
  ApiResponse
} from '@shared/types';

/**
 * Enhanced API client configuration
 */
interface ApiClientConfig {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableLoading?: boolean;
}

const DEFAULT_CONFIG: Required<ApiClientConfig> = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000,
  enableLoading: true
};

/**
 * Enhanced API client class with error handling and retry mechanisms
 */
class EnhancedApiClient {
  private config: Required<ApiClientConfig>;
  
  constructor(config: ApiClientConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Execute an API operation with error handling and retry logic
   */
  private async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    loadingKey?: string
  ): Promise<T> {
    const wrappedOperation = async () => {
      try {
        const timeoutPromise = withTimeout(
          operation(),
          this.config.timeout,
          `${context.operation} timed out`
        );
        
        return await withRetry(
          () => timeoutPromise,
          {
            maxAttempts: this.config.retryAttempts,
            baseDelay: this.config.retryDelay
          }
        );
      } catch (error) {
        const appError = new AppError(
          getUserFriendlyMessage(error as Error, context),
          context,
          error as Error
        );
        throw appError;
      }
    };
    
    if (loadingKey && this.config.enableLoading) {
      return withLoadingState(loadingKey, wrappedOperation, context.operation);
    } else {
      return wrappedOperation();
    }
  }
  
  // Bean operations with enhanced error handling
  
  async getBeans(filters?: BeanFilters, pagination?: PaginationParams): Promise<ListResponse<BeanWithContext>> {
    return this.executeWithErrorHandling(
      () => apiClient.getBeans(filters, pagination),
      {
        operation: 'load beans',
        entityType: 'beans',
        retryable: true
      },
      LoadingKeys.BEANS_LIST
    );
  }
  
  async getBean(id: string): Promise<ApiResponse<BeanWithContext>> {
    return this.executeWithErrorHandling(
      () => apiClient.getBean(id),
      {
        operation: 'load bean details',
        entityType: 'bean',
        retryable: true
      },
      LoadingKeys.BEAN_DETAIL
    );
  }
  
  async createBean(bean: CreateBeanRequest): Promise<ApiResponse<Bean>> {
    return this.executeWithErrorHandling(
      () => apiClient.createBean(bean),
      {
        operation: 'create',
        entityType: 'bean',
        retryable: false
      },
      LoadingKeys.BEAN_CREATE
    );
  }
  
  async deleteBean(id: string): Promise<void> {
    return this.executeWithErrorHandling(
      () => apiClient.delete(`/admin/beans/${id}`),
      {
        operation: 'delete',
        entityType: 'bean',
        retryable: false
      },
      LoadingKeys.BEAN_DELETE
    );
  }
  
  // Bean rating operations
  
  async createBeanRating(beanId: string, rating: CreateBeanRatingRequest): Promise<ApiResponse<void>> {
    return this.executeWithErrorHandling(
      () => apiClient.createBeanRating(beanId, rating),
      {
        operation: 'create rating for',
        entityType: 'bean',
        retryable: false
      },
      LoadingKeys.RATING_CREATE
    );
  }
  
  async updateBeanRating(beanId: string, rating: UpdateBeanRatingRequest): Promise<ApiResponse<void>> {
    return this.executeWithErrorHandling(
      () => apiClient.updateBeanRating(beanId, rating),
      {
        operation: 'update rating for',
        entityType: 'bean',
        retryable: false
      },
      LoadingKeys.RATING_UPDATE
    );
  }
  
  async deleteBeanRating(beanId: string): Promise<ApiResponse<void>> {
    return this.executeWithErrorHandling(
      () => apiClient.deleteBeanRating(beanId),
      {
        operation: 'remove rating for',
        entityType: 'bean',
        retryable: false
      },
      LoadingKeys.RATING_DELETE
    );
  }
  
  // Bag operations
  
  async getBags(params?: { bean_id?: string; active_only?: boolean; inventory_status?: string; include_community?: boolean }): Promise<ListResponse<Bag>> {
    return this.executeWithErrorHandling(
      () => apiClient.getBags(params),
      {
        operation: 'load',
        entityType: 'bags',
        retryable: true
      },
      LoadingKeys.BAGS_LIST
    );
  }

  async getBagInventory(): Promise<ListResponse<Bag> & { current_week_start: string }> {
    return this.executeWithErrorHandling(
      () => apiClient.getBagInventory(),
      {
        operation: 'load',
        entityType: 'bag inventory',
        retryable: true
      },
      LoadingKeys.BAGS_LIST
    );
  }
  
  async createBag(bag: CreateBagRequest): Promise<ApiResponse<Bag>> {
    return this.executeWithErrorHandling(
      () => apiClient.createBag(bag),
      {
        operation: 'create',
        entityType: 'bag',
        retryable: false
      },
      LoadingKeys.BAG_CREATE
    );
  }
  
  async updateBag(id: string, bag: Partial<UpdateBagRequest>): Promise<ApiResponse<Bag>> {
    return this.executeWithErrorHandling(
      () => apiClient.updateBag(id, bag),
      {
        operation: 'update',
        entityType: 'bag',
        retryable: false
      },
      LoadingKeys.BAG_UPDATE
    );
  }
  
  async updateBagStatus(id: string, status: string): Promise<ApiResponse<Bag>> {
    return this.executeWithErrorHandling(
      () => apiClient.updateBag(id, { inventory_status: status as any }),
      {
        operation: 'update status for',
        entityType: 'bag',
        retryable: false
      },
      LoadingKeys.BAG_STATUS_UPDATE
    );
  }
  
  async deleteBag(id: string): Promise<void> {
    return this.executeWithErrorHandling(
      () => apiClient.delete(`/bags/${id}`),
      {
        operation: 'delete',
        entityType: 'bag',
        retryable: false
      },
      LoadingKeys.BAG_DELETE
    );
  }
  
  // Roaster operations
  
  async getRoasters(): Promise<ListResponse<Roaster>> {
    return this.executeWithErrorHandling(
      () => apiClient.getRoasters(),
      {
        operation: 'load',
        entityType: 'roasters',
        retryable: true
      },
      LoadingKeys.ROASTERS_LIST
    );
  }
  
  async createRoaster(roaster: { name: string; website_url?: string }): Promise<ApiResponse<Roaster>> {
    return this.executeWithErrorHandling(
      () => apiClient.createRoaster(roaster),
      {
        operation: 'create',
        entityType: 'roaster',
        retryable: false
      },
      LoadingKeys.ROASTER_CREATE
    );
  }
  
  // Search operations with debounced loading
  
  async searchBeans(
    searchTerm: string, 
    filters?: Omit<BeanFilters, 'search'>, 
    pagination?: PaginationParams
  ): Promise<ListResponse<BeanWithContext>> {
    return this.executeWithErrorHandling(
      () => apiClient.getBeans({ ...filters, search: searchTerm }, pagination),
      {
        operation: 'search',
        entityType: 'beans',
        retryable: true
      },
      LoadingKeys.SEARCH
    );
  }
  
  // Batch operations
  
  async batchUpdateBagStatus(updates: Array<{ id: string; status: string }>): Promise<void> {
    return this.executeWithErrorHandling(
      async () => {
        const promises = updates.map(({ id, status }) => 
          apiClient.updateBag(id, { inventory_status: status as any })
        );
        await Promise.all(promises);
      },
      {
        operation: 'batch update',
        entityType: 'bag statuses',
        retryable: false
      },
      LoadingKeys.BULK_UPDATE
    );
  }
}

/**
 * Enhanced API client instance with default configuration
 */
export const enhancedApiClient = new EnhancedApiClient();

/**
 * Create a custom enhanced API client with specific configuration
 */
export function createEnhancedApiClient(config: ApiClientConfig): EnhancedApiClient {
  return new EnhancedApiClient(config);
}

/**
 * Error recovery utilities
 */
export class ErrorRecovery {
  private static retryQueue: Array<{
    operation: () => Promise<any>;
    context: ErrorContext;
    attempts: number;
    maxAttempts: number;
  }> = [];
  
  /**
   * Add a failed operation to the retry queue
   */
  static addToRetryQueue(
    operation: () => Promise<any>,
    context: ErrorContext,
    maxAttempts: number = 3
  ): void {
    this.retryQueue.push({
      operation,
      context,
      attempts: 0,
      maxAttempts
    });
  }
  
  /**
   * Process the retry queue
   */
  static async processRetryQueue(): Promise<void> {
    const queue = [...this.retryQueue];
    this.retryQueue = [];
    
    for (const item of queue) {
      try {
        await item.operation();
      } catch (error) {
        item.attempts++;
        if (item.attempts < item.maxAttempts && isRetryableError(error as Error)) {
          this.retryQueue.push(item);
        } else {
          console.error(`Failed to retry operation after ${item.attempts} attempts:`, error);
        }
      }
    }
  }
  
  /**
   * Clear the retry queue
   */
  static clearRetryQueue(): void {
    this.retryQueue = [];
  }
  
  /**
   * Get the current retry queue size
   */
  static getRetryQueueSize(): number {
    return this.retryQueue.length;
  }
}

/**
 * Network status monitoring
 */
export class NetworkMonitor {
  private static listeners: Set<(online: boolean) => void> = new Set();
  private static isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  
  static {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners(true);
        // Process retry queue when coming back online
        ErrorRecovery.processRetryQueue();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners(false);
      });
    }
  }
  
  static addListener(listener: (online: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  static getStatus(): boolean {
    return this.isOnline;
  }
  
  private static notifyListeners(online: boolean): void {
    this.listeners.forEach(listener => listener(online));
  }
}
