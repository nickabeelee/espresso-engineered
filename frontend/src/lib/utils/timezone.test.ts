import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  detectBrowserTimezone,
  formatCurrentTimeInTimezone,
  isTimezoneDetectionSupported,
  getTimezoneDisplayName,
  storeTimezonePreference,
  getStoredTimezonePreference,
  getTimezoneForAPI
} from './timezone';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Frontend Timezone Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  describe('detectBrowserTimezone', () => {
    it('should detect timezone from Intl when available', () => {
      // Mock Intl.DateTimeFormat
      const mockResolvedOptions = vi.fn().mockReturnValue({
        timeZone: 'America/New_York'
      });
      
      global.Intl = {
        DateTimeFormat: vi.fn().mockImplementation(() => ({
          resolvedOptions: mockResolvedOptions
        }))
      } as any;

      const result = detectBrowserTimezone();
      
      expect(result.timezone).toBe('America/New_York');
      expect(result.source).toBe('intl');
      expect(result.confidence).toBe('high');
    });

    it('should fallback to Date offset when Intl is not available', () => {
      // Mock Intl as undefined
      global.Intl = undefined as any;
      
      // Mock Date.getTimezoneOffset
      const originalDate = global.Date;
      global.Date = class extends originalDate {
        getTimezoneOffset() {
          return -300; // EST offset (5 hours behind UTC)
        }
      } as any;

      const result = detectBrowserTimezone();
      
      expect(result.source).toBe('date');
      expect(result.confidence).toBe('low');
      expect(typeof result.timezone).toBe('string');
      
      // Restore Date
      global.Date = originalDate;
    });

    it('should fallback to UTC when all detection fails', () => {
      // Mock Intl to throw error
      global.Intl = {
        DateTimeFormat: vi.fn().mockImplementation(() => {
          throw new Error('Not supported');
        })
      } as any;
      
      // Mock Date to throw error
      const originalDate = global.Date;
      global.Date = class extends originalDate {
        getTimezoneOffset() {
          throw new Error('Not supported');
        }
      } as any;

      const result = detectBrowserTimezone();
      
      expect(result.timezone).toBe('UTC');
      expect(result.source).toBe('fallback');
      expect(result.confidence).toBe('low');
      
      // Restore Date
      global.Date = originalDate;
    });
  });

  describe('formatCurrentTimeInTimezone', () => {
    it('should format current time in specified timezone', () => {
      // Mock Intl.DateTimeFormat
      const mockFormat = vi.fn().mockReturnValue('14:30');
      global.Intl = {
        DateTimeFormat: vi.fn().mockImplementation(() => ({
          format: mockFormat
        }))
      } as any;

      const result = formatCurrentTimeInTimezone('America/New_York');
      
      expect(typeof result).toBe('string');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should fallback to local time when timezone formatting fails', () => {
      // Mock Intl to throw error
      global.Intl = {
        DateTimeFormat: vi.fn().mockImplementation(() => {
          throw new Error('Not supported');
        })
      } as any;

      const result = formatCurrentTimeInTimezone('Invalid/Timezone');
      
      expect(typeof result).toBe('string');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('isTimezoneDetectionSupported', () => {
    it('should return true when Intl is fully supported', () => {
      global.Intl = {
        DateTimeFormat: vi.fn().mockImplementation(() => ({
          resolvedOptions: vi.fn()
        }))
      } as any;

      expect(isTimezoneDetectionSupported()).toBe(true);
    });

    it('should return false when Intl is not supported', () => {
      global.Intl = undefined as any;
      
      expect(isTimezoneDetectionSupported()).toBe(false);
    });

    it('should return false when Intl.DateTimeFormat is not supported', () => {
      global.Intl = {} as any;
      
      expect(isTimezoneDetectionSupported()).toBe(false);
    });
  });

  describe('getTimezoneDisplayName', () => {
    it('should return display name for valid timezone', () => {
      // Mock Intl.DateTimeFormat
      const mockFormatToParts = vi.fn().mockReturnValue([
        { type: 'timeZoneName', value: 'Eastern Standard Time' }
      ]);
      
      global.Intl = {
        DateTimeFormat: vi.fn().mockImplementation(() => ({
          formatToParts: mockFormatToParts
        }))
      } as any;

      const result = getTimezoneDisplayName('America/New_York');
      
      expect(result).toBe('Eastern Standard Time');
    });

    it('should fallback to timezone name when formatting fails', () => {
      global.Intl = {
        DateTimeFormat: vi.fn().mockImplementation(() => {
          throw new Error('Not supported');
        })
      } as any;

      const result = getTimezoneDisplayName('America/New_York');
      
      expect(result).toBe('America/New_York');
    });
  });

  describe('localStorage operations', () => {
    it('should store timezone preference', () => {
      storeTimezonePreference('America/New_York');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user-timezone',
        'America/New_York'
      );
    });

    it('should handle localStorage errors when storing', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });

      // Should not throw
      expect(() => storeTimezonePreference('America/New_York')).not.toThrow();
    });

    it('should get stored timezone preference', () => {
      localStorageMock.getItem.mockReturnValue('America/Los_Angeles');
      
      const result = getStoredTimezonePreference();
      
      expect(result).toBe('America/Los_Angeles');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('user-timezone');
    });

    it('should handle localStorage errors when getting', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });

      const result = getStoredTimezonePreference();
      
      expect(result).toBe(null);
    });
  });

  describe('getTimezoneForAPI', () => {
    it('should return comprehensive timezone info for API', () => {
      // Mock browser detection
      global.Intl = {
        DateTimeFormat: vi.fn().mockImplementation(() => ({
          resolvedOptions: vi.fn().mockReturnValue({
            timeZone: 'America/New_York'
          })
        }))
      } as any;
      
      // Mock stored preference
      localStorageMock.getItem.mockReturnValue('America/Los_Angeles');

      const result = getTimezoneForAPI();
      
      expect(result).toEqual({
        browserTimezone: 'America/New_York',
        userTimezone: 'America/Los_Angeles',
        confidence: 'high'
      });
    });

    it('should handle missing user preference', () => {
      // Mock browser detection
      global.Intl = {
        DateTimeFormat: vi.fn().mockImplementation(() => ({
          resolvedOptions: vi.fn().mockReturnValue({
            timeZone: 'Europe/London'
          })
        }))
      } as any;
      
      // Mock no stored preference
      localStorageMock.getItem.mockReturnValue(null);

      const result = getTimezoneForAPI();
      
      expect(result).toEqual({
        browserTimezone: 'Europe/London',
        userTimezone: undefined,
        confidence: 'high'
      });
    });
  });
});