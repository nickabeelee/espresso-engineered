import { NamingService } from './naming.js';
import { supabase } from '../config/supabase.js';

// Mock supabase for testing
jest.mock('../config/supabase.js', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

describe('NamingService Concurrent Creation Safety', () => {
  let namingService: NamingService;
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    namingService = new NamingService();
    jest.clearAllMocks();
  });

  describe('concurrent bag name generation', () => {
    it('should handle concurrent requests for identical bag parameters', async () => {
      // Mock barista data
      const mockBaristaQuery = {
        single: jest.fn().mockResolvedValue({
          data: { display_name: 'Test Barista', first_name: 'Test' },
          error: null
        })
      };

      // Mock bean data
      const mockBeanQuery = {
        single: jest.fn().mockResolvedValue({
          data: { name: 'Test Bean' },
          error: null
        })
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'barista') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBaristaQuery)
            }))
          } as any;
        } else if (table === 'bean') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBeanQuery)
            }))
          } as any;
        }
        return {} as any;
      });

      const ownerId = 'barista-1';
      const beanId = 'bean-1';
      const roastDate = '2024-01-01';

      // Make multiple concurrent requests with identical parameters
      const promises = Array.from({ length: 5 }, () =>
        namingService.generateBagName(ownerId, beanId, roastDate)
      );

      const results = await Promise.all(promises);

      // All results should be identical
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBe("Test Barista's Test Bean 01/01/24");
      });

      // Database should only be queried once for each entity due to deduplication
      expect(mockBaristaQuery.single).toHaveBeenCalledTimes(1);
      expect(mockBeanQuery.single).toHaveBeenCalledTimes(1);
    });
  });

  describe('concurrent brew name generation', () => {
    it('should handle concurrent requests for different timestamps', async () => {
      // Mock barista data
      const mockBaristaQuery = {
        single: jest.fn().mockResolvedValue({
          data: { display_name: 'Test Barista', first_name: 'Test' },
          error: null
        })
      };

      // Mock bag with bean data
      const mockBagQuery = {
        single: jest.fn().mockResolvedValue({
          data: { bean: { name: 'Test Bean' } },
          error: null
        })
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'barista') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBaristaQuery)
            }))
          } as any;
        } else if (table === 'bag') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBagQuery)
            }))
          } as any;
        }
        return {} as any;
      });

      const baristaId = 'barista-1';
      const bagId = 'bag-1';

      // Make concurrent requests with different timestamps
      const baseTime = new Date('2024-01-01T10:00:00Z');
      const promises = Array.from({ length: 3 }, (_, i) =>
        namingService.generateBrewName(
          baristaId,
          bagId,
          new Date(baseTime.getTime() + i * 1000) // Different timestamps
        )
      );

      const results = await Promise.all(promises);

      // All results should be generated successfully
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toMatch(
          /^Test Barista[’']s (\d+(?:st|nd|rd|th) )?(morning|afternoon|evening|night) Test Bean \d{2}\/\d{2}\/\d{2}$/
        );
      });

      // Each request should have its own database queries since timestamps differ
      expect(mockBaristaQuery.single).toHaveBeenCalledTimes(3);
      expect(mockBagQuery.single).toHaveBeenCalledTimes(3);
    });

    it('should deduplicate concurrent requests with identical timestamps', async () => {
      // Mock barista data
      const mockBaristaQuery = {
        single: jest.fn().mockResolvedValue({
          data: { display_name: 'Test Barista', first_name: 'Test' },
          error: null
        })
      };

      // Mock bag with bean data
      const mockBagQuery = {
        single: jest.fn().mockResolvedValue({
          data: { bean: { name: 'Test Bean' } },
          error: null
        })
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'barista') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBaristaQuery)
            }))
          } as any;
        } else if (table === 'bag') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBagQuery)
            }))
          } as any;
        }
        return {} as any;
      });

      const baristaId = 'barista-1';
      const bagId = 'bag-1';
      const timestamp = new Date('2024-01-01T10:00:00Z');

      // Make multiple concurrent requests with identical parameters
      const promises = Array.from({ length: 4 }, () =>
        namingService.generateBrewName(baristaId, bagId, timestamp)
      );

      const results = await Promise.all(promises);

      // All results should be identical - may include UTC indicator due to time normalization
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toMatch(
          /^Test Barista[’']s (\d+(?:st|nd|rd|th) )?(morning|afternoon|evening|night) Test Bean \d{2}\/\d{2}\/\d{2}$/
        );
      });

      // Database should only be queried once due to deduplication
      expect(mockBaristaQuery.single).toHaveBeenCalledTimes(1);
      expect(mockBagQuery.single).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling in concurrent scenarios', () => {
    it('should handle errors gracefully without affecting other concurrent requests', async () => {
      // Mock one successful and one failing barista query
      let callCount = 0;
      const mockBaristaQuery = {
        single: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              data: { display_name: 'Test Barista', first_name: 'Test' },
              error: null
            });
          } else {
            return Promise.reject(new Error('Database error'));
          }
        })
      };

      const mockBeanQuery = {
        single: jest.fn().mockResolvedValue({
          data: { name: 'Test Bean' },
          error: null
        })
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'barista') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBaristaQuery)
            }))
          } as any;
        } else if (table === 'bean') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBeanQuery)
            }))
          } as any;
        }
        return {} as any;
      });

      // Make concurrent requests - first should succeed, second should use fallback
      const promises = [
        namingService.generateBagName('barista-1', 'bean-1', '2024-01-01'),
        namingService.generateBagName('barista-2', 'bean-1', '2024-01-01') // This should use fallback
      ];

      const results = await Promise.allSettled(promises);

      // Both requests should succeed (second uses fallback)
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('fulfilled');
      
      if (results[0].status === 'fulfilled') {
        expect(results[0].value).toBe("Test Barista's Test Bean 01/01/24");
      }
      
      if (results[1].status === 'fulfilled') {
        expect(results[1].value).toBe("Anonymous's Test Bean 01/01/24"); // Uses fallback
      }
    });
  });

  describe('concurrent request deduplication', () => {
    it('should properly clean up request cache after completion', async () => {
      // Mock successful responses
      const mockBaristaQuery = {
        single: jest.fn().mockResolvedValue({
          data: { display_name: 'Test Barista', first_name: 'Test' },
          error: null
        })
      };

      const mockBeanQuery = {
        single: jest.fn().mockResolvedValue({
          data: { name: 'Test Bean' },
          error: null
        })
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'barista') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBaristaQuery)
            }))
          } as any;
        } else if (table === 'bean') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBeanQuery)
            }))
          } as any;
        }
        return {} as any;
      });

      const ownerId = 'barista-1';
      const beanId = 'bean-1';
      const roastDate = '2024-01-01';

      // First batch of concurrent requests
      const firstBatch = Array.from({ length: 3 }, () =>
        namingService.generateBagName(ownerId, beanId, roastDate)
      );

      await Promise.all(firstBatch);

      // Reset mock call counts
      mockBaristaQuery.single.mockClear();
      mockBeanQuery.single.mockClear();

      // Second batch of concurrent requests with same parameters
      const secondBatch = Array.from({ length: 3 }, () =>
        namingService.generateBagName(ownerId, beanId, roastDate)
      );

      await Promise.all(secondBatch);

      // Second batch should make new database calls since cache was cleaned up
      expect(mockBaristaQuery.single).toHaveBeenCalledTimes(1);
      expect(mockBeanQuery.single).toHaveBeenCalledTimes(1);
    });

    it('should handle high-concurrency scenarios without memory leaks', async () => {
      // Mock successful responses
      const mockBaristaQuery = {
        single: jest.fn().mockResolvedValue({
          data: { display_name: 'Test Barista', first_name: 'Test' },
          error: null
        })
      };

      const mockBagQuery = {
        single: jest.fn().mockResolvedValue({
          data: { bean: { name: 'Test Bean' } },
          error: null
        })
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'barista') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBaristaQuery)
            }))
          } as any;
        } else if (table === 'bag') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBagQuery)
            }))
          } as any;
        }
        return {} as any;
      });

      const baristaId = 'barista-1';
      const bagId = 'bag-1';

      // Create many concurrent requests with different timestamps
      const baseTime = new Date('2024-01-01T10:00:00Z');
      const highConcurrencyPromises = Array.from({ length: 50 }, (_, i) =>
        namingService.generateBrewName(
          baristaId,
          bagId,
          new Date(baseTime.getTime() + i * 1000) // Different seconds
        )
      );

      const results = await Promise.all(highConcurrencyPromises);

      // All requests should succeed
      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(result).toMatch(
          /^Test Barista[’']s (\d+(?:st|nd|rd|th) )?(morning|afternoon|evening|night) Test Bean \d{2}\/\d{2}\/\d{2}$/
        );
      });

      // Each request should have made its own database calls (no deduplication due to different timestamps)
      expect(mockBaristaQuery.single).toHaveBeenCalledTimes(50);
      expect(mockBagQuery.single).toHaveBeenCalledTimes(50);
    });
  });

  describe('mixed concurrent operations', () => {
    it('should handle concurrent bag and brew name generation without interference', async () => {
      // Mock responses for both barista and bean queries
      const mockBaristaQuery = {
        single: jest.fn().mockResolvedValue({
          data: { display_name: 'Mixed Tester', first_name: 'Mixed' },
          error: null
        })
      };

      const mockBeanQuery = {
        single: jest.fn().mockResolvedValue({
          data: { name: 'Mixed Bean' },
          error: null
        })
      };

      const mockBagQuery = {
        single: jest.fn().mockResolvedValue({
          data: { bean: { name: 'Mixed Bean' } },
          error: null
        })
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'barista') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBaristaQuery)
            }))
          } as any;
        } else if (table === 'bean') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBeanQuery)
            }))
          } as any;
        } else if (table === 'bag') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBagQuery)
            }))
          } as any;
        }
        return {} as any;
      });

      // Create mixed concurrent requests
      const mixedPromises = [
        // Bag name generations
        namingService.generateBagName('barista-1', 'bean-1', '2024-01-01'),
        namingService.generateBagName('barista-1', 'bean-1', '2024-01-02'),
        
        // Brew name generations
        namingService.generateBrewName('barista-1', 'bag-1', new Date('2024-01-01T09:00:00Z')),
        namingService.generateBrewName('barista-1', 'bag-1', new Date('2024-01-01T10:00:00Z'))
      ];

      const results = await Promise.all(mixedPromises);

      // Verify all results are correct
      expect(results).toHaveLength(4);
      
      // Bag names should follow bag format
      expect(results[0]).toBe("Mixed Tester's Mixed Bean 01/01/24");
      expect(results[1]).toBe("Mixed Tester's Mixed Bean 01/02/24");
      
      // Brew names should follow brew format
      expect(results[2]).toMatch(
        /^Mixed Tester[’']s (\d+(?:st|nd|rd|th) )?(morning|afternoon|evening|night) Mixed Bean \d{2}\/\d{2}\/\d{2}$/
      );
      expect(results[3]).toMatch(
        /^Mixed Tester[’']s (\d+(?:st|nd|rd|th) )?(morning|afternoon|evening|night) Mixed Bean \d{2}\/\d{2}\/\d{2}$/
      );
      
      // Verify no cross-contamination between formats
      expect(results[2]).toMatch(/Tester[’']s/);
      expect(results[3]).toMatch(/Tester[’']s/);
    });
  });

  describe('timeout and safety mechanisms', () => {
    it('should handle timeout scenarios gracefully', async () => {
      // Create a naming service with very short timeout
      const shortTimeoutService = new NamingService({
        timeoutMs: 10 // Very short timeout
      });

      // Mock a slow response
      const mockBaristaQuery = {
        single: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            data: { display_name: 'Slow Barista', first_name: 'Slow' },
            error: null
          }), 50)) // Longer than timeout
        )
      };

      const mockBeanQuery = {
        single: jest.fn().mockResolvedValue({
          data: { name: 'Test Bean' },
          error: null
        })
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'barista') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBaristaQuery)
            }))
          } as any;
        } else if (table === 'bean') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBeanQuery)
            }))
          } as any;
        }
        return {} as any;
      });

      // This should timeout but gracefully degrade to emergency fallback
      const result = await shortTimeoutService.generateBagName('barista-1', 'bean-1', '2024-01-01');
      expect(result).toMatch(/^Bag \d{4}-\d{2}-\d{2}$/); // Emergency fallback pattern
    });

    it('should provide utility methods for monitoring concurrent requests', async () => {
      // Initially no pending requests
      expect(namingService.getPendingRequestCount()).toBe(0);

      // Mock successful responses
      const mockBaristaQuery = {
        single: jest.fn().mockResolvedValue({
          data: { display_name: 'Test Barista', first_name: 'Test' },
          error: null
        })
      };

      const mockBeanQuery = {
        single: jest.fn().mockResolvedValue({
          data: { name: 'Test Bean' },
          error: null
        })
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'barista') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBaristaQuery)
            }))
          } as any;
        } else if (table === 'bean') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => mockBeanQuery)
            }))
          } as any;
        }
        return {} as any;
      });

      // Start a request but don't await it yet
      const promise = namingService.generateBagName('barista-1', 'bean-1', '2024-01-01');
      
      // Should have one pending request
      expect(namingService.getPendingRequestCount()).toBe(1);

      // Complete the request
      await promise;
      
      // Should have no pending requests after completion
      expect(namingService.getPendingRequestCount()).toBe(0);

      // Test clear functionality
      const promise2 = namingService.generateBagName('barista-2', 'bean-2', '2024-01-01');
      expect(namingService.getPendingRequestCount()).toBe(1);
      
      namingService.clearPendingRequests();
      expect(namingService.getPendingRequestCount()).toBe(0);
      
      // The original promise should still resolve (it's already in progress)
      await expect(promise2).resolves.toBeDefined();
    });
  });
});
