import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { NamingService, NamingError, BagNamingContext, BrewNamingContext } from './naming.js';
import { getNamingCacheManager } from '../utils/naming-cache.js';
import { getNamingPerformanceMonitor } from '../utils/naming-performance.js';

// Clean up global instances after all tests
afterAll(() => {
  const globalCacheManager = getNamingCacheManager();
  globalCacheManager.destroy();
  
  const globalPerformanceMonitor = getNamingPerformanceMonitor();
  globalPerformanceMonitor.destroy();
});

describe('NamingService Foundation', () => {
  let namingService: NamingService;

  beforeEach(() => {
    namingService = new NamingService();
  });

  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      expect(namingService).toBeDefined();
      expect(namingService).toBeInstanceOf(NamingService);
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        maxRetries: 5,
        timeoutMs: 10000,
        defaultTimezone: 'America/New_York'
      };
      
      const customService = new NamingService(customConfig);
      expect(customService).toBeDefined();
    });
  });

  describe('Template Processing', () => {
    it('should format roast date correctly', () => {
      const service = namingService as any; // Access private methods for testing
      
      // Test valid date
      const validDate = '2023-12-01';
      const formatted = service.formatRoastDate(validDate);
      expect(formatted).toBe('2023-12-01');
    });

    it('should handle invalid roast date with fallback', () => {
      const service = namingService as any;
      
      // Test invalid date
      const invalidDate = 'invalid-date';
      const formatted = service.formatRoastDate(invalidDate);
      expect(formatted).toBe('Unknown Roast');
    });

    it('should handle missing roast date with fallback', () => {
      const service = namingService as any;
      
      // Test undefined date
      const formatted = service.formatRoastDate(undefined);
      expect(formatted).toBe('Unknown Roast');
    });

    it('should format brew time correctly', () => {
      const service = namingService as any;
      
      // Test time formatting
      const testDate = new Date('2023-12-01T14:30:00Z');
      const formatted = service.formatBrewTime(testDate, 'UTC');
      expect(formatted).toBe('14:30');
    });

    it('should handle brew time formatting errors with fallback', () => {
      const service = namingService as any;
      
      // Test with invalid timezone - should normalize to UTC
      const testDate = new Date('2023-12-01T14:30:00Z');
      const formatted = service.formatBrewTime(testDate, 'Invalid/Timezone');
      // Without timezone detection info, no UTC indicator is added
      expect(formatted).toBe('14:30');
    });
  });

  describe('Template Application', () => {
    it('should apply bag template correctly', () => {
      const service = namingService as any;
      
      const context: BagNamingContext = {
        ownerDisplayName: 'John Doe',
        beanName: 'Ethiopian Yirgacheffe',
        roastDate: '2023-12-01'
      };

      const result = service.applyBagTemplate(context);
      expect(result).toBe("John Doe's Ethiopian Yirgacheffe 2023-12-01");
    });

    it('should apply bag template with fallbacks', () => {
      const service = namingService as any;
      
      const context: BagNamingContext = {
        ownerDisplayName: '',
        ownerFirstName: 'John',
        beanName: '',
        roastDate: undefined
      };

      const result = service.applyBagTemplate(context);
      expect(result).toBe("John's Unknown Bean Unknown Roast");
    });

    it('should apply brew template correctly', () => {
      const service = namingService as any;
      
      const context: BrewNamingContext = {
        baristaDisplayName: 'Jane Smith',
        beanName: 'Colombian Supremo',
        createdAt: new Date('2023-12-01T09:15:00Z'),
        timezone: 'UTC'
      };

      const result = service.applyBrewTemplate(context);
      expect(result).toBe('Jane Smith Colombian Supremo 09:15');
    });

    it('should apply brew template with fallbacks', () => {
      const service = namingService as any;
      
      const context: BrewNamingContext = {
        baristaDisplayName: '',
        baristaFirstName: 'Jane',
        beanName: '',
        createdAt: new Date('2023-12-01T09:15:00Z')
      };

      const result = service.applyBrewTemplate(context);
      expect(result).toBe('Jane Unknown Bean 09:15');
    });
  });

  describe('Error Handling', () => {
    it('should create NamingError correctly', () => {
      const error = new NamingError('Test error', 'bag', 'test-id');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NamingError);
      expect(error.message).toBe('Test error');
      expect(error.entityType).toBe('bag');
      expect(error.entityId).toBe('test-id');
      expect(error.name).toBe('NamingError');
    });

    it('should handle naming errors with cause', () => {
      const cause = new Error('Database connection failed');
      const error = new NamingError('Naming failed', 'brew', 'brew-123', cause);
      
      expect(error.cause).toBe(cause);
    });
  });

  describe('Name Generation with Database Fallbacks', () => {
    it('should generate bag name with fallbacks when database queries fail', async () => {
      const result = await namingService.generateBagName('owner-123', 'bean-456', '2023-12-01');
      
      // Should use fallback values when database is not available
      expect(result).toBe("Anonymous's Unknown Bean 2023-12-01");
    });

    it('should generate brew name with fallbacks when database queries fail', async () => {
      const result = await namingService.generateBrewName('barista-123', 'bag-456');

      // Should use fallback values when database is not available
      expect(result).toMatch(
        /^Anonymous[’']s (\d+(?:st|nd|rd|th) )?(morning|afternoon|evening|night) Unknown Bean \d{4}-\d{2}-\d{2}$/
      );
    });

    it('should preserve special characters in names', () => {
      const service = namingService as any;
      
      // Test various special characters and Unicode
      const testCases = [
        'José María',
        'Café Münchën',
        'Björk & Björk',
        'Naïve Café',
        'Résumé Roasters',
        '東京コーヒー',
        'Café Français',
        'Straße Coffee',
        'Piñata Beans'
      ];

      testCases.forEach(testName => {
        const result = service.preserveSpecialCharacters(testName);
        expect(result).toBe(testName);
        expect(result.length).toBe(testName.length);
      });
    });

    it('should handle empty and null inputs for special character preservation', () => {
      const service = namingService as any;
      
      expect(service.preserveSpecialCharacters('')).toBe('');
      expect(service.preserveSpecialCharacters(null)).toBe(null);
      expect(service.preserveSpecialCharacters(undefined)).toBe(undefined);
    });
  });
});
