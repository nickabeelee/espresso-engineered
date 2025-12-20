import { NamingServiceConfig } from '../services/naming.js';

/**
 * Default configuration for the naming service
 */
export const DEFAULT_NAMING_CONFIG: NamingServiceConfig = {
  bagTemplate: {
    pattern: "{ownerDisplayName}'s {beanName} {roastDate}",
    fallbacks: {
      ownerDisplayName: 'Anonymous',
      beanName: 'Unknown Bean',
      roastDate: 'Unknown Roast'
    }
  },
  brewTemplate: {
    pattern: '{baristaDisplayName} {beanName} {brewTime}',
    fallbacks: {
      baristaDisplayName: 'Anonymous',
      beanName: 'Unknown Bean',
      brewTime: '00:00'
    }
  },
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:MM',
  defaultTimezone: 'UTC',
  maxRetries: 3,
  timeoutMs: 5000
};

/**
 * Template patterns used for name generation
 */
export const NAMING_TEMPLATES = {
  BAG: {
    STANDARD: "{ownerDisplayName}'s {beanName} {roastDate}",
    SIMPLE: "{ownerDisplayName}'s {beanName}",
    WITH_WEIGHT: "{ownerDisplayName}'s {beanName} {roastDate} ({weight}g)"
  },
  BREW: {
    STANDARD: '{baristaDisplayName} {beanName} {brewTime}',
    WITH_RATING: '{baristaDisplayName} {beanName} {brewTime} ({rating}★)',
    SIMPLE: '{baristaDisplayName} {beanName}'
  }
} as const;

/**
 * Fallback values for missing data
 */
export const NAMING_FALLBACKS = {
  BARISTA: {
    DISPLAY_NAME: 'Anonymous',
    FIRST_NAME: 'User'
  },
  BEAN: {
    NAME: 'Unknown Bean',
    ROASTER: 'Unknown Roaster'
  },
  DATE: {
    ROAST_DATE: 'Unknown Roast',
    BREW_TIME: '00:00'
  },
  LOCATION: {
    TIMEZONE: 'UTC'
  }
} as const;

/**
 * Format patterns for dates and times
 */
export const NAMING_FORMATS = {
  DATE: {
    ROAST_DATE: 'YYYY-MM-DD',
    ISO_DATE: 'YYYY-MM-DDTHH:mm:ss.sssZ'
  },
  TIME: {
    BREW_TIME: 'HH:MM',
    FULL_TIME: 'HH:MM:SS',
    WITH_TIMEZONE: 'HH:MM z'
  }
} as const;

/**
 * Performance and reliability settings
 */
export const NAMING_LIMITS = {
  MAX_RETRIES: 3,
  TIMEOUT_MS: 5000,
  MAX_NAME_LENGTH: 255,
  MIN_NAME_LENGTH: 1,
  CACHE_TTL_MS: 300000, // 5 minutes
  CONCURRENT_LIMIT: 10
} as const;

/**
 * Special character handling settings
 */
export const NAMING_CHARACTER_RULES = {
  PRESERVE_UNICODE: true,
  PRESERVE_EMOJI: true,
  PRESERVE_ACCENTS: true,
  TRIM_WHITESPACE: true,
  COLLAPSE_SPACES: true
} as const;

/**
 * Get naming configuration from environment or use defaults
 */
export function getNamingConfig(): NamingServiceConfig {
  return {
    ...DEFAULT_NAMING_CONFIG,
    // Override with environment variables if needed
    maxRetries: parseInt(process.env.NAMING_MAX_RETRIES || '3'),
    timeoutMs: parseInt(process.env.NAMING_TIMEOUT_MS || '5000'),
    defaultTimezone: process.env.NAMING_DEFAULT_TIMEZONE || 'UTC'
  };
}