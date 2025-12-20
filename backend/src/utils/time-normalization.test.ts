import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  normalizeTimeFormatting,
  compareTimeFormattingConsistency,
  getServerEnvironmentInfo
} from './time-normalization.js';

describe('Time Normalization Utilities', () => {
  describe('normalizeTimeFormatting', () => {
    it('should format time consistently with valid timezone', () => {
      const date = new Date('2023-12-01T15:30:00Z');
      const result = normalizeTimeFormatting(date, 'UTC');
      
      expect(result.formattedTime).toBe('15:30');
      expect(result.timezone).toBe('UTC');
      expect(result.isNormalized).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });

    it('should normalize invalid timezone to fallback', () => {
      const date = new Date('2023-12-01T15:30:00Z');
      const result = normalizeTimeFormatting(date, 'Invalid/Timezone', {
        fallbackTimezone: 'UTC'
      });
      
      expect(result.timezone).toBe('UTC');
      expect(result.isNormalized).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Invalid timezone');
    });

    it('should use preferred timezone when original is invalid', () => {
      const date = new Date('2023-12-01T15:30:00Z');
      const result = normalizeTimeFormatting(date, 'Invalid/Timezone', {
        preferredTimezone: 'America/New_York',
        fallbackTimezone: 'UTC'
      });
      
      expect(result.timezone).toBe('America/New_York');
      expect(result.isNormalized).toBe(true);
      expect(result.warnings.some(w => w.includes('preferred timezone'))).toBe(true);
    });

    it('should handle different time formats', () => {
      const date = new Date('2023-12-01T15:30:45Z');
      
      const hhmmResult = normalizeTimeFormatting(date, 'UTC', { format: 'HH:MM' });
      expect(hhmmResult.formattedTime).toBe('15:30');
      
      const hhmmssResult = normalizeTimeFormatting(date, 'UTC', { format: 'HH:MM:SS' });
      expect(hhmmssResult.formattedTime).toBe('15:30:45');
      
      const withTzResult = normalizeTimeFormatting(date, 'UTC', { format: 'HH:MM z' });
      expect(withTzResult.formattedTime).toMatch(/15:30 \w+/);
    });

    it('should preserve original timezone context when requested', () => {
      const date = new Date('2023-12-01T15:30:00Z');
      const result = normalizeTimeFormatting(date, 'Invalid/Timezone', {
        preserveContext: true,
        fallbackTimezone: 'UTC'
      });
      
      expect(result.originalTimezone).toBe('Invalid/Timezone');
    });

    it('should not preserve original timezone context when not requested', () => {
      const date = new Date('2023-12-01T15:30:00Z');
      const result = normalizeTimeFormatting(date, 'Invalid/Timezone', {
        preserveContext: false,
        fallbackTimezone: 'UTC'
      });
      
      expect(result.originalTimezone).toBeUndefined();
    });

    it('should handle invalid dates gracefully', () => {
      const invalidDate = new Date('invalid');
      const result = normalizeTimeFormatting(invalidDate, 'UTC');
      
      // Should use current time as fallback and format successfully
      expect(result.formattedTime).toMatch(/^\d{2}:\d{2}$/);
      expect(result.isNormalized).toBe(true);
    });

    it('should normalize date to minute precision', () => {
      const dateWithSeconds = new Date('2023-12-01T15:30:45.123Z');
      const result = normalizeTimeFormatting(dateWithSeconds, 'UTC');
      
      // Should format to minute precision (ignoring seconds and milliseconds)
      expect(result.formattedTime).toBe('15:30');
    });
  });

  describe('compareTimeFormattingConsistency', () => {
    it('should compare different formatting methods', () => {
      const date = new Date('2023-12-01T15:30:00Z');
      const comparison = compareTimeFormattingConsistency(date, 'UTC');
      
      expect(comparison.results).toHaveLength(3);
      expect(comparison.results.some(r => r.method === 'Intl.DateTimeFormat')).toBe(true);
      expect(comparison.results.some(r => r.method === 'TimezoneUtility')).toBe(true);
      expect(comparison.results.some(r => r.method === 'Failsafe')).toBe(true);
    });

    it('should detect consistency across methods', () => {
      const date = new Date('2023-12-01T15:30:00Z');
      const comparison = compareTimeFormattingConsistency(date, 'UTC');
      
      // For UTC, all methods should produce consistent results
      const successfulResults = comparison.results.filter(r => !r.error && r.result);
      expect(successfulResults.length).toBeGreaterThan(0);
      
      // Check if results are consistent (allowing for minor format differences)
      const uniqueBaseTimes = new Set(
        successfulResults.map(r => r.result.replace(/ UTC$/, ''))
      );
      expect(uniqueBaseTimes.size).toBeLessThanOrEqual(1);
    });

    it('should handle invalid timezone in comparison', () => {
      const date = new Date('2023-12-01T15:30:00Z');
      const comparison = compareTimeFormattingConsistency(date, 'Invalid/Timezone');
      
      // Should still have results, some may have errors
      expect(comparison.results).toHaveLength(3);
      
      // Failsafe method should always work
      const failsafeResult = comparison.results.find(r => r.method === 'Failsafe');
      expect(failsafeResult).toBeDefined();
      expect(failsafeResult!.result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('getServerEnvironmentInfo', () => {
    it('should return server environment information', () => {
      const info = getServerEnvironmentInfo();
      
      expect(typeof info.nodeVersion).toBe('string');
      expect(info.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
      expect(typeof info.platform).toBe('string');
      expect(typeof info.timezone).toBe('string');
      expect(typeof info.locale).toBe('string');
      expect(typeof info.icuVersion).toBe('string');
    });

    it('should detect ICU support', () => {
      const info = getServerEnvironmentInfo();
      
      // Modern Node.js should support formatToParts
      expect(info.icuVersion).toBe('supported');
    });
  });

  describe('Cross-environment consistency', () => {
    it('should produce consistent results for common timezones', () => {
      const date = new Date('2023-12-01T15:30:00Z');
      const commonTimezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
      
      commonTimezones.forEach(timezone => {
        const result = normalizeTimeFormatting(date, timezone);
        
        // Should produce valid time format
        expect(result.formattedTime).toMatch(/^\d{2}:\d{2}( \w+)?$/);
        
        // Should not have critical errors
        expect(result.warnings.filter(w => w.includes('failed')).length).toBe(0);
      });
    });

    it('should handle edge cases consistently', () => {
      const edgeCases = [
        new Date('2023-01-01T00:00:00Z'), // Midnight
        new Date('2023-12-31T23:59:59Z'), // End of year
        new Date('2023-03-12T07:00:00Z'), // DST transition (US)
        new Date('2023-11-05T06:00:00Z')  // DST transition (US)
      ];
      
      edgeCases.forEach(date => {
        const result = normalizeTimeFormatting(date, 'America/New_York');
        
        // Should handle all edge cases without critical failures
        expect(result.formattedTime).toMatch(/^\d{2}:\d{2}( \w+)?$/);
        expect(result.timezone).toBeTruthy();
      });
    });
  });
});