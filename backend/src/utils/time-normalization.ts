/**
 * Time normalization utilities for cross-environment consistency
 * Ensures that time formatting is consistent across different server environments
 */

import { isValidTimezone, formatTimeWithTimezone } from './timezone.js';

/**
 * Interface for normalized time result
 */
export interface NormalizedTimeResult {
  formattedTime: string;
  timezone: string;
  isNormalized: boolean;
  originalTimezone?: string;
  warnings: string[];
}

/**
 * Interface for time normalization options
 */
export interface TimeNormalizationOptions {
  preferredTimezone?: string;
  fallbackTimezone?: string;
  format?: 'HH:MM' | 'HH:MM:SS' | 'HH:MM z';
  strictValidation?: boolean;
  preserveContext?: boolean;
}

/**
 * Normalize time formatting for cross-environment consistency
 * This ensures that time formatting produces identical results regardless of:
 * - Server operating system
 * - Node.js version
 * - System locale settings
 * - ICU data version
 */
export function normalizeTimeFormatting(
  date: Date,
  timezone: string,
  options: TimeNormalizationOptions = {}
): NormalizedTimeResult {
  const {
    preferredTimezone,
    fallbackTimezone = 'UTC',
    format = 'HH:MM',
    strictValidation = true,
    preserveContext = true
  } = options;

  const warnings: string[] = [];
  let effectiveTimezone = timezone;
  let isNormalized = false;
  const originalTimezone = timezone;

  // Step 1: Validate and normalize timezone
  if (!isValidTimezone(effectiveTimezone)) {
    warnings.push(`Invalid timezone: ${effectiveTimezone}`);
    
    // Try preferred timezone first
    if (preferredTimezone && isValidTimezone(preferredTimezone)) {
      effectiveTimezone = preferredTimezone;
      isNormalized = true;
      warnings.push(`Using preferred timezone: ${preferredTimezone}`);
    } else {
      // Fall back to fallback timezone
      effectiveTimezone = fallbackTimezone;
      isNormalized = true;
      warnings.push(`Using fallback timezone: ${fallbackTimezone}`);
    }
  }

  // Step 2: Normalize date to ensure consistent handling
  const preserveSeconds = format === 'HH:MM:SS';
  const normalizedDate = normalizeDate(date, preserveSeconds);
  if (normalizedDate.getTime() !== date.getTime()) {
    warnings.push('Date was normalized for consistency');
    isNormalized = true;
  }

  // Step 3: Format time with cross-environment consistency
  let formattedTime: string;
  try {
    formattedTime = formatTimeWithTimezone(normalizedDate, effectiveTimezone, format);
    
    // Step 4: Validate formatting consistency
    if (strictValidation && !validateTimeFormat(formattedTime, format)) {
      warnings.push('Time format validation failed');
      formattedTime = getFailsafeTimeFormat(normalizedDate, format);
      isNormalized = true;
    }
  } catch (error) {
    warnings.push(`Time formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    formattedTime = getFailsafeTimeFormat(normalizedDate, format);
    isNormalized = true;
  }

  return {
    formattedTime,
    timezone: effectiveTimezone,
    isNormalized,
    originalTimezone: preserveContext ? originalTimezone : undefined,
    warnings
  };
}

/**
 * Normalize date object to ensure consistent behavior across environments
 */
function normalizeDate(date: Date, preserveSeconds: boolean = false): Date {
  // Ensure the date is valid
  if (isNaN(date.getTime())) {
    return new Date(); // Use current time as fallback
  }

  // Create a new date to avoid mutating the original
  const normalized = new Date(date.getTime());

  // For minute-precision formatting, zero out seconds and milliseconds
  // unless we need to preserve seconds for HH:MM:SS format
  if (!preserveSeconds) {
    normalized.setSeconds(0, 0);
  } else {
    // Only zero out milliseconds for second-precision formatting
    normalized.setMilliseconds(0);
  }

  return normalized;
}

/**
 * Validate time format string for consistency
 */
function validateTimeFormat(timeString: string, expectedFormat: string): boolean {
  try {
    switch (expectedFormat) {
      case 'HH:MM':
        return /^\d{2}:\d{2}$/.test(timeString.replace(/ UTC$/, ''));
      case 'HH:MM:SS':
        return /^\d{2}:\d{2}:\d{2}$/.test(timeString.replace(/ UTC$/, ''));
      case 'HH:MM z':
        return /^\d{2}:\d{2} \w+$/.test(timeString);
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Get failsafe time format that works across all environments
 */
function getFailsafeTimeFormat(date: Date, format: string): string {
  try {
    // Use UTC formatting as the most reliable cross-environment option
    const utcHours = date.getUTCHours().toString().padStart(2, '0');
    const utcMinutes = date.getUTCMinutes().toString().padStart(2, '0');
    const utcSeconds = date.getUTCSeconds().toString().padStart(2, '0');

    switch (format) {
      case 'HH:MM':
        return `${utcHours}:${utcMinutes}`;
      case 'HH:MM:SS':
        return `${utcHours}:${utcMinutes}:${utcSeconds}`;
      case 'HH:MM z':
        return `${utcHours}:${utcMinutes} UTC`;
      default:
        return `${utcHours}:${utcMinutes}`;
    }
  } catch {
    return '00:00'; // Ultimate fallback
  }
}

/**
 * Compare time formatting across different environments for consistency testing
 */
export function compareTimeFormattingConsistency(
  date: Date,
  timezone: string,
  format: string = 'HH:MM'
): {
  isConsistent: boolean;
  results: Array<{ method: string; result: string; error?: string }>;
} {
  const results: Array<{ method: string; result: string; error?: string }> = [];

  // Method 1: Using Intl.DateTimeFormat
  try {
    const intlResult = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      ...(format === 'HH:MM:SS' && { second: '2-digit' })
    }).format(date);
    
    results.push({ method: 'Intl.DateTimeFormat', result: intlResult });
  } catch (error) {
    results.push({ 
      method: 'Intl.DateTimeFormat', 
      result: '', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }

  // Method 2: Using our timezone utility
  try {
    const utilityResult = formatTimeWithTimezone(date, timezone, format as any);
    results.push({ method: 'TimezoneUtility', result: utilityResult });
  } catch (error) {
    results.push({ 
      method: 'TimezoneUtility', 
      result: '', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }

  // Method 3: Using failsafe formatting
  try {
    const failsafeResult = getFailsafeTimeFormat(date, format);
    results.push({ method: 'Failsafe', result: failsafeResult });
  } catch (error) {
    results.push({ 
      method: 'Failsafe', 
      result: '', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }

  // Check consistency
  const successfulResults = results.filter(r => !r.error && r.result);
  const uniqueResults = new Set(successfulResults.map(r => r.result));
  const isConsistent = uniqueResults.size <= 1;

  return { isConsistent, results };
}

/**
 * Get server environment information for debugging time consistency issues
 */
export function getServerEnvironmentInfo(): {
  nodeVersion: string;
  platform: string;
  timezone: string;
  locale: string;
  icuVersion?: string;
} {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: Intl.DateTimeFormat().resolvedOptions().locale,
    // ICU version is not directly accessible in Node.js, but we can infer support
    icuVersion: typeof Intl.DateTimeFormat.prototype.formatToParts === 'function' ? 'supported' : 'limited'
  };
}