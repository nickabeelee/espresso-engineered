/**
 * Tests for naming error handling utilities
 * Validates edge case handling and graceful degradation
 */

import { 
  NamingErrorHandler, 
  NamingTimeoutError, 
  NamingDatabaseError,
  NamingValidationError,
  EDGE_CASE_SCENARIOS,
  DEGRADATION_STRATEGIES
} from './naming-errors.js';

describe('NamingErrorHandler', () => {
  describe('validateInputs', () => {
    test('should validate correct inputs', () => {
      const result = NamingErrorHandler.validateInputs({
        baristaId: 'valid-uuid',
        beanId: 'another-uuid',
        roastDate: '2023-12-01'
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized.baristaId).toBe('valid-uuid');
    });

    test('should handle null and undefined inputs', () => {
      const result = NamingErrorHandler.validateInputs({
        baristaId: null as any,
        beanId: undefined,
        roastDate: ''
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.sanitized.baristaId).toBeUndefined();
    });

    test('should handle empty string inputs', () => {
      const result = NamingErrorHandler.validateInputs({
        baristaId: '   ',
        beanId: '',
        roastDate: '   '
      });

      expect(result.isValid).toBe(false);
      expect(result.sanitized.baristaId).toBeUndefined();
      expect(result.sanitized.beanId).toBeUndefined();
      expect(result.sanitized.roastDate).toBeUndefined();
    });

    test('should handle invalid date formats', () => {
      const result = NamingErrorHandler.validateInputs({
        roastDate: 'not-a-date'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid roast date format'))).toBe(true);
      expect(result.sanitized.roastDate).toBeUndefined();
    });
  });

  describe('sanitizeName', () => {
    test('should preserve normal names', () => {
      const result = NamingErrorHandler.sanitizeName("John's Ethiopian Coffee");
      expect(result).toBe("John's Ethiopian Coffee");
    });

    test('should handle Unicode characters', () => {
      const result = NamingErrorHandler.sanitizeName('Café Münchën ☕');
      expect(result).toBe('Café Münchën ☕');
    });

    test('should remove control characters', () => {
      const result = NamingErrorHandler.sanitizeName('Test\x00\x1F\x7FName');
      expect(result).toBe('TestName');
    });

    test('should truncate very long names', () => {
      const longName = 'A'.repeat(300);
      const result = NamingErrorHandler.sanitizeName(longName);
      expect(result.length).toBeLessThanOrEqual(255);
      expect(result.endsWith('...')).toBe(true);
    });

    test('should handle empty and null inputs', () => {
      expect(NamingErrorHandler.sanitizeName('')).toBe('');
      expect(NamingErrorHandler.sanitizeName(null as any)).toBe('');
      expect(NamingErrorHandler.sanitizeName(undefined as any)).toBe('');
    });
  });

  describe('handleEdgeCase', () => {
    test('should return operation result when successful', async () => {
      const result = await NamingErrorHandler.handleEdgeCase(
        'test_scenario',
        async () => 'success',
        'fallback',
        {
          entityType: 'bag',
          operationName: 'test'
        }
      );

      expect(result).toBe('success');
    });

    test('should return fallback when operation fails', async () => {
      const result = await NamingErrorHandler.handleEdgeCase(
        'test_scenario',
        async () => { throw new Error('test error'); },
        'fallback',
        {
          entityType: 'bag',
          operationName: 'test'
        }
      );

      expect(result).toBe('fallback');
    });
  });

  describe('retryWithBackoff', () => {
    test('should succeed on first attempt', async () => {
      let attempts = 0;
      const result = await NamingErrorHandler.retryWithBackoff(
        async () => {
          attempts++;
          return 'success';
        },
        3,
        10
      );

      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    test('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const result = await NamingErrorHandler.retryWithBackoff(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('temporary failure');
          }
          return 'success';
        },
        3,
        10
      );

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    test('should throw after max attempts', async () => {
      let attempts = 0;
      await expect(
        NamingErrorHandler.retryWithBackoff(
          async () => {
            attempts++;
            throw new Error('persistent failure');
          },
          2,
          10
        )
      ).rejects.toThrow('persistent failure');

      expect(attempts).toBe(2);
    });
  });

  describe('createEmergencyFallback', () => {
    test('should create bag fallback', () => {
      const result = NamingErrorHandler.createEmergencyFallback('bag');
      expect(result).toMatch(/^Bag \d{4}-\d{2}-\d{2}$/);
    });

    test('should create brew fallback', () => {
      const result = NamingErrorHandler.createEmergencyFallback('brew');
      expect(result).toMatch(/^Brew \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    test('should use provided timestamp', () => {
      const testDate = new Date('2023-12-01T15:30:00Z');
      const result = NamingErrorHandler.createEmergencyFallback('brew', testDate);
      expect(result).toBe('Brew 2023-12-01 15:30');
    });
  });

  describe('checkSystemHealth', () => {
    test('should return health status', () => {
      const health = NamingErrorHandler.checkSystemHealth();
      
      expect(health).toHaveProperty('memoryPressure');
      expect(health).toHaveProperty('databaseConnected');
      expect(health).toHaveProperty('recommendedAction');
      expect(['normal', 'degraded', 'emergency']).toContain(health.recommendedAction);
    });
  });
});

describe('Error Classes', () => {
  test('NamingTimeoutError should have correct properties', () => {
    const error = new NamingTimeoutError('test operation', 5000);
    expect(error.name).toBe('NamingTimeoutError');
    expect(error.message).toContain('test operation');
    expect(error.message).toContain('5000ms');
  });

  test('NamingDatabaseError should have correct properties', () => {
    const cause = new Error('connection failed');
    const error = new NamingDatabaseError('select', 'users', cause);
    expect(error.name).toBe('NamingDatabaseError');
    expect(error.message).toContain('select');
    expect(error.message).toContain('users');
    expect(error.cause).toBe(cause);
  });

  test('NamingValidationError should have correct properties', () => {
    const error = new NamingValidationError('email', 'invalid-email', 'not a valid email');
    expect(error.name).toBe('NamingValidationError');
    expect(error.message).toContain('email');
    expect(error.message).toContain('invalid-email');
    expect(error.message).toContain('not a valid email');
  });
});

describe('Edge Case Scenarios', () => {
  test('should have comprehensive edge case coverage', () => {
    expect(EDGE_CASE_SCENARIOS.length).toBeGreaterThan(10);
    
    const scenarios = EDGE_CASE_SCENARIOS.map(s => s.scenario);
    expect(scenarios).toContain('null_barista_id');
    expect(scenarios).toContain('database_connection_lost');
    expect(scenarios).toContain('malformed_date_strings');
    expect(scenarios).toContain('extreme_unicode_characters');
  });

  test('should have severity levels for all scenarios', () => {
    for (const scenario of EDGE_CASE_SCENARIOS) {
      expect(['low', 'medium', 'high', 'critical']).toContain(scenario.severity);
      expect(scenario.description).toBeTruthy();
      expect(scenario.fallbackStrategy).toBeTruthy();
    }
  });
});

describe('Degradation Strategies', () => {
  test('should have database unavailable strategy', () => {
    const strategy = DEGRADATION_STRATEGIES.DATABASE_UNAVAILABLE;
    expect(strategy.strategy).toBeTruthy();
    expect(typeof strategy.implementation).toBe('function');
    
    const result = strategy.implementation('bag');
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^Bag \d{4}-\d{2}-\d{2}$/);
  });

  test('should have memory pressure strategy', () => {
    const strategy = DEGRADATION_STRATEGIES.MEMORY_PRESSURE;
    expect(strategy.strategy).toBeTruthy();
    expect(typeof strategy.implementation).toBe('function');
    
    // Should not throw
    expect(() => strategy.implementation()).not.toThrow();
  });

  test('should have complete failure strategy', () => {
    const strategy = DEGRADATION_STRATEGIES.COMPLETE_FAILURE;
    expect(strategy.strategy).toBeTruthy();
    expect(typeof strategy.implementation).toBe('function');
    
    const result = strategy.implementation('brew', 'test-id');
    expect(result).toBeNull();
  });
});