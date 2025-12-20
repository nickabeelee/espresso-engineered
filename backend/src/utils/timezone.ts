/**
 * Timezone utilities for the naming service
 * Handles timezone detection, validation, and formatting
 */

/**
 * Interface for timezone information
 */
export interface TimezoneInfo {
  timezone: string;
  offset: number;
  abbreviation: string;
  isDST: boolean;
  isValid: boolean;
}

/**
 * Interface for timezone detection result
 */
export interface TimezoneDetectionResult {
  detected: string | null;
  fallback: string;
  source: 'browser' | 'header' | 'user' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Common timezone mappings for validation
 */
const VALID_TIMEZONES = new Set([
  // Major US timezones
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  
  // Major European timezones
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Stockholm',
  'Europe/Helsinki',
  
  // Major Asian timezones
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Seoul',
  'Asia/Kolkata',
  'Asia/Dubai',
  
  // Major Australian timezones
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Brisbane',
  
  // Other major timezones
  'UTC',
  'GMT',
  'America/Sao_Paulo',
  'America/Mexico_City',
  'America/Toronto',
  'America/Vancouver',
  'Africa/Cairo',
  'Africa/Johannesburg'
]);

/**
 * Detect timezone from various sources
 */
export function detectTimezone(
  browserTimezone?: string,
  userTimezone?: string,
  headerTimezone?: string
): TimezoneDetectionResult {
  // Priority order: user preference > browser detection > header > fallback
  
  // Check user preference first (highest confidence)
  if (userTimezone && isValidTimezone(userTimezone)) {
    return {
      detected: userTimezone,
      fallback: 'UTC',
      source: 'user',
      confidence: 'high'
    };
  }
  
  // Check browser detection (medium confidence)
  if (browserTimezone && isValidTimezone(browserTimezone)) {
    return {
      detected: browserTimezone,
      fallback: 'UTC',
      source: 'browser',
      confidence: 'medium'
    };
  }
  
  // Check header timezone (lower confidence)
  if (headerTimezone && isValidTimezone(headerTimezone)) {
    return {
      detected: headerTimezone,
      fallback: 'UTC',
      source: 'header',
      confidence: 'low'
    };
  }
  
  // Fallback to UTC
  return {
    detected: null,
    fallback: 'UTC',
    source: 'fallback',
    confidence: 'low'
  };
}

/**
 * Validate if a timezone string is valid
 */
export function isValidTimezone(timezone: string): boolean {
  if (!timezone || typeof timezone !== 'string') {
    return false;
  }
  
  // Check against our known valid timezones first (fast path)
  if (VALID_TIMEZONES.has(timezone)) {
    return true;
  }
  
  // For other timezones, try to use Intl.DateTimeFormat to validate
  try {
    // This will throw if the timezone is invalid
    Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get timezone information for a given timezone
 */
export function getTimezoneInfo(timezone: string, date: Date = new Date()): TimezoneInfo {
  const isValid = isValidTimezone(timezone);
  
  if (!isValid) {
    return {
      timezone,
      offset: 0,
      abbreviation: 'UTC',
      isDST: false,
      isValid: false
    };
  }
  
  try {
    // Get timezone offset in minutes
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });
    
    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    
    // Parse offset from format like "GMT-05:00"
    let offset = 0;
    if (offsetPart && offsetPart.value) {
      const match = offsetPart.value.match(/GMT([+-])(\d{2}):(\d{2})/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        const hours = parseInt(match[2], 10);
        const minutes = parseInt(match[3], 10);
        offset = sign * (hours * 60 + minutes);
      }
    }
    
    // Get timezone abbreviation
    const abbrevFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    const abbrevParts = abbrevFormatter.formatToParts(date);
    const abbrevPart = abbrevParts.find(part => part.type === 'timeZoneName');
    const abbreviation = abbrevPart?.value || timezone;
    
    // Detect DST by comparing with a date 6 months away
    const sixMonthsLater = new Date(date);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    
    const currentOffset = getTimezoneOffset(timezone, date);
    const futureOffset = getTimezoneOffset(timezone, sixMonthsLater);
    const isDST = currentOffset !== futureOffset;
    
    return {
      timezone,
      offset,
      abbreviation,
      isDST,
      isValid: true
    };
  } catch (error) {
    console.warn(`Failed to get timezone info for ${timezone}:`, error);
    return {
      timezone,
      offset: 0,
      abbreviation: 'UTC',
      isDST: false,
      isValid: false
    };
  }
}

/**
 * Get timezone offset in minutes for a specific date
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  try {
    const utcDate = new Date(date.toISOString());
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (utcDate.getTime() - localDate.getTime()) / (1000 * 60);
  } catch {
    return 0;
  }
}

/**
 * Format time with timezone awareness
 */
export function formatTimeWithTimezone(
  date: Date,
  timezone: string,
  format: 'HH:MM' | 'HH:MM:SS' | 'HH:MM z' = 'HH:MM'
): string {
  if (!isValidTimezone(timezone)) {
    timezone = 'UTC';
  }
  
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    };
    
    if (format === 'HH:MM:SS') {
      options.second = '2-digit';
    }
    
    if (format === 'HH:MM z') {
      options.timeZoneName = 'short';
    }
    
    const formatter = new Intl.DateTimeFormat('en-US', options);
    
    if (format === 'HH:MM z') {
      // Format with timezone abbreviation
      const parts = formatter.formatToParts(date);
      const hour = parts.find(p => p.type === 'hour')?.value || '00';
      const minute = parts.find(p => p.type === 'minute')?.value || '00';
      const timeZoneName = parts.find(p => p.type === 'timeZoneName')?.value || 'UTC';
      
      return `${hour}:${minute} ${timeZoneName}`;
    } else {
      // Format without timezone
      return formatter.format(date);
    }
  } catch (error) {
    console.warn(`Failed to format time for timezone ${timezone}:`, error);
    // Fallback to UTC formatting
    return date.toISOString().substring(11, format === 'HH:MM:SS' ? 19 : 16);
  }
}

/**
 * Handle daylight saving time transitions
 */
export function handleDSTTransition(
  date: Date,
  timezone: string
): { adjustedDate: Date; isDSTTransition: boolean; transitionType?: 'spring' | 'fall' } {
  if (!isValidTimezone(timezone)) {
    return { adjustedDate: date, isDSTTransition: false };
  }
  
  try {
    // Check if this is near a DST transition by comparing offsets
    const dayBefore = new Date(date);
    dayBefore.setDate(dayBefore.getDate() - 1);
    
    const dayAfter = new Date(date);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    const currentOffset = getTimezoneOffset(timezone, date);
    const beforeOffset = getTimezoneOffset(timezone, dayBefore);
    const afterOffset = getTimezoneOffset(timezone, dayAfter);
    
    // Detect DST transition
    if (currentOffset !== beforeOffset || currentOffset !== afterOffset) {
      const transitionType = currentOffset < beforeOffset ? 'spring' : 'fall';
      
      return {
        adjustedDate: date,
        isDSTTransition: true,
        transitionType
      };
    }
    
    return { adjustedDate: date, isDSTTransition: false };
  } catch (error) {
    console.warn(`Failed to handle DST transition for ${timezone}:`, error);
    return { adjustedDate: date, isDSTTransition: false };
  }
}

/**
 * Get user-friendly timezone display name
 */
export function getTimezoneDisplayName(timezone: string): string {
  if (!timezone) {
    return 'UTC';
  }
  
  if (!isValidTimezone(timezone)) {
    return timezone; // Return the original timezone string for invalid ones
  }
  
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'long'
    });
    
    const parts = formatter.formatToParts(new Date());
    const timeZoneName = parts.find(part => part.type === 'timeZoneName');
    
    return timeZoneName?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Convert timezone from various formats to IANA format
 */
export function normalizeTimezone(timezone: string): string {
  if (!timezone) {
    return 'UTC';
  }
  
  // Common timezone mappings - check abbreviations first before IANA validation
  const mappings: Record<string, string> = {
    'EST': 'America/New_York',
    'CST': 'America/Chicago',
    'MST': 'America/Denver',
    'PST': 'America/Los_Angeles',
    'GMT': 'UTC',
    'BST': 'Europe/London',
    'CET': 'Europe/Paris',
    'JST': 'Asia/Tokyo',
    'AEST': 'Australia/Sydney'
  };
  
  // Try to map from abbreviation first
  const upperTimezone = timezone.toUpperCase();
  const mapped = mappings[upperTimezone];
  
  if (mapped && isValidTimezone(mapped)) {
    return mapped;
  }
  
  // Check if it's already a valid IANA timezone
  if (isValidTimezone(timezone)) {
    return timezone;
  }
  
  // If no mapping found and it's not valid, return the original
  // This allows the calling code to handle invalid timezones appropriately
  return timezone;
}