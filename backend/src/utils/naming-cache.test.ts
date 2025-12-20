/**
 * Tests for naming cache utilities
 */

import { 
  NamingCache, 
  BaristaNameCache, 
  BeanNameCache, 
  BagBeanCache,
  NamingCacheManager,
  getNamingCacheManager
} from './naming-cache.js';

// Clean up global cache manager after all tests
afterAll(() => {
  const globalManager = getNamingCacheManager();
  globalManager.destroy();
});

describe('NamingCache', () => {
  let cache: NamingCache<string>;

  beforeEach(() => {
    cache = new NamingCache<string>({
      defaultTtl: 1000,
      maxEntries: 5,
      cleanupInterval: 100,
      enableStats: true
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('basic operations', () => {
    test('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    test('should return undefined for missing keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    test('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    test('should delete keys', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.delete('key1')).toBe(false);
    });

    test('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });

  describe('TTL expiration', () => {
    test('should expire entries after TTL', async () => {
      cache.set('key1', 'value1', 100);
      expect(cache.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.get('key1')).toBeUndefined();
    });

    test('should use default TTL when not specified', async () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(cache.get('key1')).toBeUndefined();
    });

    test('should not return expired entries on has check', async () => {
      cache.set('key1', 'value1', 100);
      expect(cache.has('key1')).toBe(true);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('LRU eviction', () => {
    test('should evict entries when cache is full', () => {
      // Fill cache to max
      for (let i = 0; i < 5; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      // Cache should be at max capacity
      expect(cache.getStats().entries).toBe(5);

      // Add new entry, should trigger eviction
      cache.set('key5', 'value5');

      // Cache should still be at max capacity
      expect(cache.getStats().entries).toBe(5);
      
      // New entry should be there
      expect(cache.get('key5')).toBe('value5');
    });
  });

  describe('statistics', () => {
    test('should track hits and misses', () => {
      cache.set('key1', 'value1');
      
      cache.get('key1'); // hit
      cache.get('key2'); // miss
      cache.get('key1'); // hit
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.667, 2);
    });

    test('should track entry count', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      expect(stats.entries).toBe(2);
    });

    test('should estimate memory usage', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('pattern invalidation', () => {
    test('should invalidate entries matching pattern', () => {
      cache.set('user:1:name', 'Alice');
      cache.set('user:2:name', 'Bob');
      cache.set('bean:1:name', 'Ethiopian');
      
      const invalidated = cache.invalidatePattern(/^user:/);
      
      expect(invalidated).toBe(2);
      expect(cache.get('user:1:name')).toBeUndefined();
      expect(cache.get('user:2:name')).toBeUndefined();
      expect(cache.get('bean:1:name')).toBe('Ethiopian');
    });
  });

  describe('cleanup', () => {
    test('should automatically clean up expired entries', async () => {
      cache.set('key1', 'value1', 50);
      cache.set('key2', 'value2', 200);
      
      // Wait for cleanup interval
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
    });
  });
});

describe('BaristaNameCache', () => {
  let cache: BaristaNameCache;

  beforeEach(() => {
    cache = new BaristaNameCache();
  });

  afterEach(() => {
    cache.destroy();
  });

  test('should store and retrieve barista names', () => {
    cache.setBaristaName('barista-1', 'Alice', 'Alice Smith');
    
    const result = cache.getBaristaName('barista-1');
    expect(result).toEqual(['Alice', 'Alice Smith']);
  });

  test('should invalidate specific barista', () => {
    cache.setBaristaName('barista-1', 'Alice');
    cache.setBaristaName('barista-2', 'Bob');
    
    const invalidated = cache.invalidateBarista('barista-1');
    
    expect(invalidated).toBe(1);
    expect(cache.getBaristaName('barista-1')).toBeUndefined();
    expect(cache.getBaristaName('barista-2')).toEqual(['Bob', undefined]);
  });
});

describe('BeanNameCache', () => {
  let cache: BeanNameCache;

  beforeEach(() => {
    cache = new BeanNameCache();
  });

  afterEach(() => {
    cache.destroy();
  });

  test('should store and retrieve bean names', () => {
    cache.setBeanName('bean-1', 'Ethiopian Yirgacheffe');
    
    const result = cache.getBeanName('bean-1');
    expect(result).toBe('Ethiopian Yirgacheffe');
  });

  test('should invalidate specific bean', () => {
    cache.setBeanName('bean-1', 'Ethiopian');
    cache.setBeanName('bean-2', 'Colombian');
    
    const invalidated = cache.invalidateBean('bean-1');
    
    expect(invalidated).toBe(1);
    expect(cache.getBeanName('bean-1')).toBeUndefined();
    expect(cache.getBeanName('bean-2')).toBe('Colombian');
  });
});

describe('BagBeanCache', () => {
  let cache: BagBeanCache;

  beforeEach(() => {
    cache = new BagBeanCache();
  });

  afterEach(() => {
    cache.destroy();
  });

  test('should store and retrieve bag-bean relationships', () => {
    cache.setBeanNameForBag('bag-1', 'Ethiopian Yirgacheffe');
    
    const result = cache.getBeanNameFromBag('bag-1');
    expect(result).toBe('Ethiopian Yirgacheffe');
  });

  test('should invalidate specific bag', () => {
    cache.setBeanNameForBag('bag-1', 'Ethiopian');
    cache.setBeanNameForBag('bag-2', 'Colombian');
    
    const invalidated = cache.invalidateBag('bag-1');
    
    expect(invalidated).toBe(1);
    expect(cache.getBeanNameFromBag('bag-1')).toBeUndefined();
    expect(cache.getBeanNameFromBag('bag-2')).toBe('Colombian');
  });
});

describe('NamingCacheManager', () => {
  let manager: NamingCacheManager;

  beforeEach(() => {
    manager = new NamingCacheManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  test('should manage multiple caches', () => {
    manager.baristaNames.setBaristaName('barista-1', 'Alice');
    manager.beanNames.setBeanName('bean-1', 'Ethiopian');
    manager.bagBeans.setBeanNameForBag('bag-1', 'Colombian');
    
    expect(manager.baristaNames.getBaristaName('barista-1')).toEqual(['Alice', undefined]);
    expect(manager.beanNames.getBeanName('bean-1')).toBe('Ethiopian');
    expect(manager.bagBeans.getBeanNameFromBag('bag-1')).toBe('Colombian');
  });

  test('should get combined statistics', () => {
    manager.baristaNames.setBaristaName('barista-1', 'Alice');
    manager.beanNames.setBeanName('bean-1', 'Ethiopian');
    manager.bagBeans.setBeanNameForBag('bag-1', 'Colombian');
    
    const stats = manager.getStats();
    
    expect(stats.baristaNames.entries).toBe(1);
    expect(stats.beanNames.entries).toBe(1);
    expect(stats.bagBeans.entries).toBe(1);
    expect(stats.total.entries).toBe(3);
  });

  test('should clear all caches', () => {
    manager.baristaNames.setBaristaName('barista-1', 'Alice');
    manager.beanNames.setBeanName('bean-1', 'Ethiopian');
    manager.bagBeans.setBeanNameForBag('bag-1', 'Colombian');
    
    manager.clearAll();
    
    expect(manager.baristaNames.getBaristaName('barista-1')).toBeUndefined();
    expect(manager.beanNames.getBeanName('bean-1')).toBeUndefined();
    expect(manager.bagBeans.getBeanNameFromBag('bag-1')).toBeUndefined();
  });

  test('should invalidate barista across caches', () => {
    manager.baristaNames.setBaristaName('barista-1', 'Alice');
    manager.bagBeans.setBeanNameForBag('bag-1', 'Ethiopian');
    
    const invalidated = manager.invalidateBarista('barista-1');
    
    expect(invalidated).toBeGreaterThan(0);
    expect(manager.baristaNames.getBaristaName('barista-1')).toBeUndefined();
  });

  test('should invalidate bean across caches', () => {
    manager.beanNames.setBeanName('bean-1', 'Ethiopian');
    manager.bagBeans.setBeanNameForBag('bag-1', 'Ethiopian');
    
    const invalidated = manager.invalidateBean('bean-1');
    
    expect(invalidated).toBeGreaterThan(0);
    expect(manager.beanNames.getBeanName('bean-1')).toBeUndefined();
  });

  test('should invalidate bag', () => {
    manager.bagBeans.setBeanNameForBag('bag-1', 'Ethiopian');
    
    const invalidated = manager.invalidateBag('bag-1');
    
    expect(invalidated).toBe(1);
    expect(manager.bagBeans.getBeanNameFromBag('bag-1')).toBeUndefined();
  });
});
