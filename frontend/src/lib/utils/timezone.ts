/**
 * Frontend timezone detection utilities
 * Detects user's timezone from browser and provides it to the backend
 */

/**
 * Interface for browser timezone detection result
 */
export interface BrowserTimezoneInfo {
  timezone: string;
  offset: number;
  abbreviation: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'intl' | 'date' | 'fallback';
}

/**
 * Detect user's timezone from browser
 */
export function detectBrowserTimezone(): BrowserTimezoneInfo {
  try {
    // Try to get timezone from Intl.DateTimeFormat (most reliable)
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      if (timezone) {
        const offset = getTimezoneOffset(timezone);
        const abbreviation = getTimezoneAbbreviation(timezone);
        
        return {
          timezone,
          offset,
          abbreviation,
          confidence: 'high',
          source: 'intl'
        };
      }
    }
  } catch (error) {
    console.warn('Failed to detect timezone from Intl:', error);
  }
  
  try {
    // Fallback to Date.getTimezoneOffset() (less reliable)
    const date = new Date();
    const offset = -date.getTimezoneOffset(); // Convert to positive offset
    
    // Try to guess timezone from offset (not very reliable)
    const timezone = guessTimezoneFromOffset(offset);
    
    return {
      timezone,
      offset,
      abbreviation: 'Local',
      confidence: 'low',
      source: 'date'
    };
  } catch (error) {
    console.warn('Failed to detect timezone from Date:', error);
  }
  
  // Ultimate fallback
  return {
    timezone: 'UTC',
    offset: 0,
    abbreviation: 'UTC',
    confidence: 'low',
    source: 'fallback'
  };
}

/**
 * Get timezone offset in minutes
 */
function getTimezoneOffset(timezone: string): number {
  try {
    const date = new Date();
    const utcDate = new Date(date.toISOString());
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (localDate.getTime() - utcDate.getTime()) / (1000 * 60);
  } catch {
    return 0;
  }
}

/**
 * Get timezone abbreviation
 */
function getTimezoneAbbreviation(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    const parts = formatter.formatToParts(new Date());
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    
    return timeZonePart?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Guess timezone from offset (not very reliable, but better than nothing)
 */
function guessTimezoneFromOffset(offsetMinutes: number): string {
  const offsetHours = offsetMinutes / 60;
  
  // Common timezone mappings by offset
  const offsetMap: Record<number, string> = {
    [-12]: 'Pacific/Kwajalein',
    [-11]: 'Pacific/Midway',
    [-10]: 'Pacific/Honolulu',
    [-9]: 'America/Anchorage',
    [-8]: 'America/Los_Angeles',
    [-7]: 'America/Denver',
    [-6]: 'America/Chicago',
    [-5]: 'America/New_York',
    [-4]: 'America/Halifax',
    [-3]: 'America/Sao_Paulo',
    [-2]: 'Atlantic/South_Georgia',
    [-1]: 'Atlantic/Azores',
    [0]: 'UTC',
    [1]: 'Europe/Paris',
    [2]: 'Europe/Berlin',
    [3]: 'Europe/Moscow',
    [4]: 'Asia/Dubai',
    [5]: 'Asia/Karachi',
    [5.5]: 'Asia/Kolkata',
    [6]: 'Asia/Dhaka',
    [7]: 'Asia/Bangkok',
    [8]: 'Asia/Shanghai',
    [9]: 'Asia/Tokyo',
    [9.5]: 'Australia/Adelaide',
    [10]: 'Australia/Sydney',
    [11]: 'Pacific/Norfolk',
    [12]: 'Pacific/Auckland'
  };
  
  return offsetMap[offsetHours] || 'UTC';
}

/**
 * Format current time in user's timezone
 */
export function formatCurrentTimeInTimezone(timezone?: string): string {
  const detectedTimezone = timezone || detectBrowserTimezone().timezone;
  
  try {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      timeZone: detectedTimezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    // Fallback to local time
    const now = new Date();
    return now.toTimeString().substring(0, 5);
  }
}

/**
 * Check if timezone detection is supported in this browser
 */
export function isTimezoneDetectionSupported(): boolean {
  try {
    return typeof Intl !== 'undefined' && 
           typeof Intl.DateTimeFormat !== 'undefined' &&
           typeof Intl.DateTimeFormat().resolvedOptions === 'function';
  } catch {
    return false;
  }
}

/**
 * Get user-friendly timezone display name
 */
export function getTimezoneDisplayName(timezone?: string): string {
  const effectiveTimezone = timezone || detectBrowserTimezone().timezone;
  
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: effectiveTimezone,
      timeZoneName: 'long'
    });
    
    const parts = formatter.formatToParts(new Date());
    const timeZoneName = parts.find(part => part.type === 'timeZoneName');
    
    return timeZoneName?.value || effectiveTimezone;
  } catch {
    return effectiveTimezone;
  }
}

/**
 * Store user's timezone preference in localStorage
 */
export function storeTimezonePreference(timezone: string): void {
  try {
    localStorage.setItem('user-timezone', timezone);
  } catch (error) {
    console.warn('Failed to store timezone preference:', error);
  }
}

/**
 * Get user's timezone preference from localStorage
 */
export function getStoredTimezonePreference(): string | null {
  try {
    return localStorage.getItem('user-timezone');
  } catch (error) {
    console.warn('Failed to get stored timezone preference:', error);
    return null;
  }
}

/**
 * Get comprehensive timezone information for API requests
 */
export function getTimezoneForAPI(): {
  browserTimezone: string;
  userTimezone?: string;
  confidence: string;
} {
  const browserInfo = detectBrowserTimezone();
  const userPreference = getStoredTimezonePreference();
  
  return {
    browserTimezone: browserInfo.timezone,
    userTimezone: userPreference || undefined,
    confidence: browserInfo.confidence
  };
}