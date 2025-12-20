/**
 * Caching utilities for the naming service
 * Implements in-memory caching with TTL and invalidation strategies
 * Requirements: 7.4, 7.5
 */

import { NAMING_LIMITS } from '../config/naming.js';

/**
 * Cache entry with TTL support
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  defaultTtl: number;
  maxEntries: number;
  cleanupInterval: number;
  enableStats: boolean;
}

/**
 * In-memory cache with TTL and LRU eviction
 * Optimized for frequently accessed naming data
 */
export class NamingCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats = {
    hits: 0,
    misses: 0
  };
  private cleanupTimer?: NodeJS.Timeout;
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTtl: NAMING_LIMITS.CACHE_TTL_MS,
      maxEntries: 1000,
      cleanupInterval: 60000, // 1 minute
      enableStats: true,
      ...config
    };

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      if (this.config.enableStats) {
        this.stats.misses++;
      }
      return undefined;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      if (this.config.enableStats) {
        this.stats.misses++;
      }
      return undefined;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    
    if (this.config.enableStats) {
      this.stats.hits++;
    }

    return entry.value;
  }

  /**
   * Set value in cache with optional TTL
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const effectiveTtl = ttl || this.config.defaultTtl;

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      value,
      timestamp: now,
      ttl: effectiveTtl,
      accessCount: 0,
      lastAccessed: now
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? this.stats.hits / (this.stats.hits + this.stats.misses) 
        : 0,
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry: entries.length > 0 
        ? Math.min(...entries.map(e => e.timestamp)) 
        : now,
      newestEntry: entries.length > 0 
        ? Math.max(...entries.map(e => e.timestamp)) 
        : now
    };
  }

  /**
   * Invalidate entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    return invalidated;
  }

  /**
   * Invalidate entries for a specific barista
   */
  invalidateBarista(baristaId: string): number {
    return this.invalidatePattern(new RegExp(`^barista:${baristaId}:`));
  }

  /**
   * Invalidate entries for a specific bean
   */
  invalidateBean(beanId: string): number {
    return this.invalidatePattern(new RegExp(`^bean:${beanId}$`));
  }

  /**
   * Invalidate entries for a specific bag
   */
  invalidateBag(bagId: string): number {
    return this.invalidatePattern(new RegExp(`^bag:${bagId}:`));
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop periodic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.debug(`[NamingCache] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Evict least recently used entries when cache is full
   */
  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) {
      return;
    }

    // Find the entry with the oldest lastAccessed time
    // If multiple entries have the same lastAccessed time, pick the first one
    let oldestKey: string | undefined;
    let oldestTime = Number.MAX_SAFE_INTEGER;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.debug(`[NamingCache] Evicted LRU entry: ${oldestKey}`);
    }
  }

  /**
   * Estimate memory usage of the cache
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // Rough estimation: key size + value size + metadata
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(entry.value).length * 2;
      size += 64; // Metadata overhead
    }

    return size;
  }

  /**
   * Destroy the cache and cleanup resources
   */
  destroy(): void {
    this.stopCleanup();
    this.clear();
  }
}

/**
 * Specialized cache for barista display names
 */
export class BaristaNameCache extends NamingCache<[string, string?]> {
  constructor() {
    super({
      defaultTtl: NAMING_LIMITS.CACHE_TTL_MS,
      maxEntries: 500, // Smaller cache for barista names
      cleanupInterval: 120000 // 2 minutes
    });
  }

  /**
   * Get cache key for barista
   */
  private getBaristaKey(baristaId: string): string {
    return `barista:${baristaId}:name`;
  }

  /**
   * Get barista display name from cache
   */
  getBaristaName(baristaId: string): [string, string?] | undefined {
    return this.get(this.getBaristaKey(baristaId));
  }

  /**
   * Set barista display name in cache
   */
  setBaristaName(baristaId: string, displayName: string, firstName?: string): void {
    this.set(this.getBaristaKey(baristaId), [displayName, firstName]);
  }

  /**
   * Invalidate specific barista
   */
  invalidateBarista(baristaId: string): number {
    return this.delete(this.getBaristaKey(baristaId)) ? 1 : 0;
  }
}

/**
 * Specialized cache for bean names
 */
export class BeanNameCache extends NamingCache<string> {
  constructor() {
    super({
      defaultTtl: NAMING_LIMITS.CACHE_TTL_MS * 2, // Beans change less frequently
      maxEntries: 1000,
      cleanupInterval: 300000 // 5 minutes
    });
  }

  /**
   * Get cache key for bean
   */
  private getBeanKey(beanId: string): string {
    return `bean:${beanId}`;
  }

  /**
   * Get bean name from cache
   */
  getBeanName(beanId: string): string | undefined {
    return this.get(this.getBeanKey(beanId));
  }

  /**
   * Set bean name in cache
   */
  setBeanName(beanId: string, name: string): void {
    this.set(this.getBeanKey(beanId), name);
  }

  /**
   * Invalidate specific bean
   */
  invalidateBean(beanId: string): number {
    return this.delete(this.getBeanKey(beanId)) ? 1 : 0;
  }
}

/**
 * Specialized cache for bag-to-bean relationships
 */
export class BagBeanCache extends NamingCache<string> {
  constructor() {
    super({
      defaultTtl: NAMING_LIMITS.CACHE_TTL_MS,
      maxEntries: 2000, // Bags are created frequently
      cleanupInterval: 180000 // 3 minutes
    });
  }

  /**
   * Get cache key for bag-bean relationship
   */
  private getBagBeanKey(bagId: string): string {
    return `bag:${bagId}:bean`;
  }

  /**
   * Get bean name from bag cache
   */
  getBeanNameFromBag(bagId: string): string | undefined {
    return this.get(this.getBagBeanKey(bagId));
  }

  /**
   * Set bean name for bag in cache
   */
  setBeanNameForBag(bagId: string, beanName: string): void {
    this.set(this.getBagBeanKey(bagId), beanName);
  }

  /**
   * Invalidate specific bag
   */
  invalidateBag(bagId: string): number {
    return this.delete(this.getBagBeanKey(bagId)) ? 1 : 0;
  }
}

/**
 * Cache manager that coordinates all naming caches
 */
export class NamingCacheManager {
  public readonly baristaNames = new BaristaNameCache();
  public readonly beanNames = new BeanNameCache();
  public readonly bagBeans = new BagBeanCache();

  /**
   * Get combined cache statistics
   */
  getStats() {
    return {
      baristaNames: this.baristaNames.getStats(),
      beanNames: this.beanNames.getStats(),
      bagBeans: this.bagBeans.getStats(),
      total: {
        entries: this.baristaNames.getStats().entries + 
                this.beanNames.getStats().entries + 
                this.bagBeans.getStats().entries,
        memoryUsage: this.baristaNames.getStats().memoryUsage + 
                    this.beanNames.getStats().memoryUsage + 
                    this.bagBeans.getStats().memoryUsage
      }
    };
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.baristaNames.clear();
    this.beanNames.clear();
    this.bagBeans.clear();
  }

  /**
   * Invalidate all entries for a barista
   */
  invalidateBarista(baristaId: string): number {
    return this.baristaNames.invalidateBarista(baristaId) +
           this.bagBeans.invalidatePattern(new RegExp(`^bag:.*:bean$`)); // Conservative invalidation
  }

  /**
   * Invalidate all entries for a bean
   */
  invalidateBean(beanId: string): number {
    return this.beanNames.invalidateBean(beanId) +
           this.bagBeans.invalidatePattern(new RegExp(`^bag:.*:bean$`)); // Conservative invalidation
  }

  /**
   * Invalidate all entries for a bag
   */
  invalidateBag(bagId: string): number {
    return this.bagBeans.invalidateBag(bagId);
  }

  /**
   * Destroy all caches and cleanup resources
   */
  destroy(): void {
    this.baristaNames.destroy();
    this.beanNames.destroy();
    this.bagBeans.destroy();
  }
}

/**
 * Global cache manager instance
 * Created lazily to avoid issues in testing
 */
let _namingCacheManager: NamingCacheManager | undefined;

export function getNamingCacheManager(): NamingCacheManager {
  if (!_namingCacheManager) {
    _namingCacheManager = new NamingCacheManager();
  }
  return _namingCacheManager;
}

export const namingCacheManager = getNamingCacheManager();