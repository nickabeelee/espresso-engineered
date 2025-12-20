import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  DEFAULT_NAMING_CONFIG, 
  NAMING_TEMPLATES, 
  NAMING_FALLBACKS, 
  NAMING_FORMATS,
  NAMING_LIMITS,
  NAMING_CHARACTER_RULES,
  getNamingConfig
} from './naming.js';

describe('Naming Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('DEFAULT_NAMING_CONFIG', () => {
    it('should have correct bag template configuration', () => {
      expect(DEFAULT_NAMING_CONFIG.bagTemplate.pattern).toBe(
        "{ownerDisplayName}'s {beanName} {roastDate}"
      );
      expect(DEFAULT_NAMING_CONFIG.bagTemplate.fallbacks).toEqual({
        ownerDisplayName: 'Anonymous',
        beanName: 'Unknown Bean',
        roastDate: 'Unknown Roast'
      });
    });

    it('should have correct brew template configuration', () => {
      expect(DEFAULT_NAMING_CONFIG.brewTemplate.pattern).toBe(
        '{baristaDisplayName} {beanName} {brewTime}'
      );
      expect(DEFAULT_NAMING_CONFIG.brewTemplate.fallbacks).toEqual({
        baristaDisplayName: 'Anonymous',
        beanName: 'Unknown Bean',
        brewTime: '00:00'
      });
    });

    it('should have correct format settings', () => {
      expect(DEFAULT_NAMING_CONFIG.dateFormat).toBe('YYYY-MM-DD');
      expect(DEFAULT_NAMING_CONFIG.timeFormat).toBe('HH:MM');
      expect(DEFAULT_NAMING_CONFIG.defaultTimezone).toBe('UTC');
    });

    it('should have correct performance settings', () => {
      expect(DEFAULT_NAMING_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_NAMING_CONFIG.timeoutMs).toBe(5000);
    });
  });

  describe('NAMING_TEMPLATES', () => {
    it('should have bag templates', () => {
      expect(NAMING_TEMPLATES.BAG.STANDARD).toBe(
        "{ownerDisplayName}'s {beanName} {roastDate}"
      );
      expect(NAMING_TEMPLATES.BAG.SIMPLE).toBe(
        "{ownerDisplayName}'s {beanName}"
      );
      expect(NAMING_TEMPLATES.BAG.WITH_WEIGHT).toBe(
        "{ownerDisplayName}'s {beanName} {roastDate} ({weight}g)"
      );
    });

    it('should have brew templates', () => {
      expect(NAMING_TEMPLATES.BREW.STANDARD).toBe(
        '{baristaDisplayName} {beanName} {brewTime}'
      );
      expect(NAMING_TEMPLATES.BREW.WITH_RATING).toBe(
        '{baristaDisplayName} {beanName} {brewTime} ({rating}★)'
      );
      expect(NAMING_TEMPLATES.BREW.SIMPLE).toBe(
        '{baristaDisplayName} {beanName}'
      );
    });
  });

  describe('NAMING_FALLBACKS', () => {
    it('should have barista fallbacks', () => {
      expect(NAMING_FALLBACKS.BARISTA.DISPLAY_NAME).toBe('Anonymous');
      expect(NAMING_FALLBACKS.BARISTA.FIRST_NAME).toBe('User');
    });

    it('should have bean fallbacks', () => {
      expect(NAMING_FALLBACKS.BEAN.NAME).toBe('Unknown Bean');
      expect(NAMING_FALLBACKS.BEAN.ROASTER).toBe('Unknown Roaster');
    });

    it('should have date fallbacks', () => {
      expect(NAMING_FALLBACKS.DATE.ROAST_DATE).toBe('Unknown Roast');
      expect(NAMING_FALLBACKS.DATE.BREW_TIME).toBe('00:00');
    });

    it('should have location fallbacks', () => {
      expect(NAMING_FALLBACKS.LOCATION.TIMEZONE).toBe('UTC');
    });
  });

  describe('NAMING_FORMATS', () => {
    it('should have date formats', () => {
      expect(NAMING_FORMATS.DATE.ROAST_DATE).toBe('YYYY-MM-DD');
      expect(NAMING_FORMATS.DATE.ISO_DATE).toBe('YYYY-MM-DDTHH:mm:ss.sssZ');
    });

    it('should have time formats', () => {
      expect(NAMING_FORMATS.TIME.BREW_TIME).toBe('HH:MM');
      expect(NAMING_FORMATS.TIME.FULL_TIME).toBe('HH:MM:SS');
      expect(NAMING_FORMATS.TIME.WITH_TIMEZONE).toBe('HH:MM z');
    });
  });

  describe('NAMING_LIMITS', () => {
    it('should have correct limit values', () => {
      expect(NAMING_LIMITS.MAX_RETRIES).toBe(3);
      expect(NAMING_LIMITS.TIMEOUT_MS).toBe(5000);
      expect(NAMING_LIMITS.MAX_NAME_LENGTH).toBe(255);
      expect(NAMING_LIMITS.MIN_NAME_LENGTH).toBe(1);
      expect(NAMING_LIMITS.CACHE_TTL_MS).toBe(300000);
      expect(NAMING_LIMITS.CONCURRENT_LIMIT).toBe(10);
    });
  });

  describe('NAMING_CHARACTER_RULES', () => {
    it('should have correct character handling rules', () => {
      expect(NAMING_CHARACTER_RULES.PRESERVE_UNICODE).toBe(true);
      expect(NAMING_CHARACTER_RULES.PRESERVE_EMOJI).toBe(true);
      expect(NAMING_CHARACTER_RULES.PRESERVE_ACCENTS).toBe(true);
      expect(NAMING_CHARACTER_RULES.TRIM_WHITESPACE).toBe(true);
      expect(NAMING_CHARACTER_RULES.COLLAPSE_SPACES).toBe(true);
    });
  });

  describe('getNamingConfig', () => {
    it('should return default config when no environment variables set', () => {
      const config = getNamingConfig();
      
      expect(config).toEqual(DEFAULT_NAMING_CONFIG);
    });

    it('should override maxRetries from environment', () => {
      process.env.NAMING_MAX_RETRIES = '5';
      
      const config = getNamingConfig();
      
      expect(config.maxRetries).toBe(5);
    });

    it('should override timeoutMs from environment', () => {
      process.env.NAMING_TIMEOUT_MS = '10000';
      
      const config = getNamingConfig();
      
      expect(config.timeoutMs).toBe(10000);
    });

    it('should override defaultTimezone from environment', () => {
      process.env.NAMING_DEFAULT_TIMEZONE = 'America/New_York';
      
      const config = getNamingConfig();
      
      expect(config.defaultTimezone).toBe('America/New_York');
    });

    it('should handle invalid environment values gracefully', () => {
      process.env.NAMING_MAX_RETRIES = 'invalid';
      process.env.NAMING_TIMEOUT_MS = 'invalid';
      
      const config = getNamingConfig();
      
      expect(config.maxRetries).toBe(NaN);
      expect(config.timeoutMs).toBe(NaN);
    });
  });
});