import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  detectTimezone,
  isValidTimezone,
  getTimezoneInfo,
  formatTimeWithTimezone,
  handleDSTTransition,
  getTimezoneDisplayName,
  normalizeTimezone
} from './timezone.js';

describe('Timezone Utilities', () => {
  describe('detectTimezone', () => {
    it('should prioritize user timezone over browser timezone', () => {
      const result = detectTimezone(
        'America/Los_Angeles',
        'America/New_York',
        'Europe/London'
      );
      
      expect(result.detected).toBe('America/New_York');
      expect(result.source).toBe('user');
      expect(result.confidence).toBe('high');
    });

    it('should use browser timezone when user timezone is invalid', () => {
      const result = detectTimezone(
        'America/Los_Angeles',
        'Invalid/Timezone',
        'Europe/London'
      );
      
      expect(result.detected).toBe('America/Los_Angeles');
      expect(result.source).toBe('browser');
      expect(result.confidence).toBe('medium');
    });

    it('should use header timezone when browser timezone is invalid', () => {
      const result = detectTimezone(
        'Invalid/Browser',
        'Invalid/User',
        'Europe/London'
      );
      
      expect(result.detected).toBe('Europe/London');
      expect(result.source).toBe('header');
      expect(result.confidence).toBe('low');
    });

    it('should fallback to UTC when all timezones are invalid', () => {
      const result = detectTimezone(
        'Invalid/Browser',
        'Invalid/User',
        'Invalid/Header'
      );
      
      expect(result.detected).toBe(null);
      expect(result.fallback).toBe('UTC');
      expect(result.source).toBe('fallback');
      expect(result.confidence).toBe('low');
    });
  });

  describe('isValidTimezone', () => {
    it('should validate common timezones', () => {
      const validTimezones = [
        'UTC',
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney'
      ];

      validTimezones.forEach(tz => {
        expect(isValidTimezone(tz)).toBe(true);
      });
    });

    it('should reject invalid timezones', () => {
      const invalidTimezones = [
        '',
        'Invalid/Timezone',
        'America/NonExistent',
        'Not_A_Timezone',
        null,
        undefined
      ];

      invalidTimezones.forEach(tz => {
        expect(isValidTimezone(tz as any)).toBe(false);
      });
    });
  });

  describe('getTimezoneInfo', () => {
    it('should return timezone info for valid timezone', () => {
      const info = getTimezoneInfo('America/New_York');
      
      expect(info.timezone).toBe('America/New_York');
      expect(info.isValid).toBe(true);
      expect(typeof info.offset).toBe('number');
      expect(typeof info.abbreviation).toBe('string');
      expect(typeof info.isDST).toBe('boolean');
    });

    it('should return invalid info for invalid timezone', () => {
      const info = getTimezoneInfo('Invalid/Timezone');
      
      expect(info.timezone).toBe('Invalid/Timezone');
      expect(info.isValid).toBe(false);
      expect(info.offset).toBe(0);
      expect(info.abbreviation).toBe('UTC');
      expect(info.isDST).toBe(false);
    });
  });

  describe('formatTimeWithTimezone', () => {
    it('should format time in specified timezone', () => {
      const date = new Date('2023-12-01T15:30:00Z');
      const formatted = formatTimeWithTimezone(date, 'UTC', 'HH:MM');
      
      expect(formatted).toBe('15:30');
    });

    it('should format time with seconds', () => {
      const date = new Date('2023-12-01T15:30:45Z');
      const formatted = formatTimeWithTimezone(date, 'UTC', 'HH:MM:SS');
      
      expect(formatted).toBe('15:30:45');
    });

    it('should format time with timezone abbreviation', () => {
      const date = new Date('2023-12-01T15:30:00Z');
      const formatted = formatTimeWithTimezone(date, 'UTC', 'HH:MM z');
      
      expect(formatted).toMatch(/15:30 \w+/);
    });

    it('should fallback to UTC for invalid timezone', () => {
      const date = new Date('2023-12-01T15:30:00Z');
      const formatted = formatTimeWithTimezone(date, 'Invalid/Timezone', 'HH:MM');
      
      expect(formatted).toBe('15:30');
    });
  });

  describe('handleDSTTransition', () => {
    it('should detect non-DST transition dates', () => {
      const date = new Date('2023-06-01T12:00:00Z'); // Summer date
      const result = handleDSTTransition(date, 'America/New_York');
      
      expect(result.adjustedDate).toEqual(date);
      expect(result.isDSTTransition).toBe(false);
    });

    it('should handle invalid timezone gracefully', () => {
      const date = new Date('2023-06-01T12:00:00Z');
      const result = handleDSTTransition(date, 'Invalid/Timezone');
      
      expect(result.adjustedDate).toEqual(date);
      expect(result.isDSTTransition).toBe(false);
    });
  });

  describe('getTimezoneDisplayName', () => {
    it('should return display name for valid timezone', () => {
      const displayName = getTimezoneDisplayName('America/New_York');
      
      expect(typeof displayName).toBe('string');
      expect(displayName.length).toBeGreaterThan(0);
    });

    it('should return timezone itself for invalid timezone', () => {
      const displayName = getTimezoneDisplayName('Invalid/Timezone');
      
      expect(displayName).toBe('Invalid/Timezone');
    });

    it('should fallback to UTC for empty timezone', () => {
      const displayName = getTimezoneDisplayName('');
      
      expect(displayName).toBe('UTC');
    });
  });

  describe('normalizeTimezone', () => {
    it('should return valid IANA timezone as-is', () => {
      const normalized = normalizeTimezone('America/New_York');
      expect(normalized).toBe('America/New_York');
    });

    it('should map common abbreviations to IANA format', () => {
      const mappings = [
        ['EST', 'America/New_York'],
        ['PST', 'America/Los_Angeles'],
        ['GMT', 'UTC'],
        ['JST', 'Asia/Tokyo']
      ];

      mappings.forEach(([abbrev, expected]) => {
        expect(normalizeTimezone(abbrev)).toBe(expected);
      });
    });

    it('should return original timezone for unmapped invalid timezones', () => {
      const invalidTimezones = ['INVALID', 'XYZ', 'Unknown/Timezone'];
      
      invalidTimezones.forEach(tz => {
        expect(normalizeTimezone(tz)).toBe(tz);
      });
    });

    it('should fallback to UTC for empty timezones', () => {
      const emptyTimezones = ['', null, undefined];
      
      emptyTimezones.forEach(tz => {
        expect(normalizeTimezone(tz as any)).toBe('UTC');
      });
    });
  });
});