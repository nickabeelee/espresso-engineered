import { Barista } from '../types/index.js';
import { supabase } from '../config/supabase.js';
import {
  detectTimezone,
  TimezoneDetectionResult
} from '../utils/timezone.js';
import { namingLogger } from '../utils/naming-logger.js';
import {
  NamingErrorHandler, 
  NamingTimeoutError, 
  NamingDatabaseError,
  NamingValidationError,
  DEGRADATION_STRATEGIES
} from '../utils/naming-errors.js';
import { getNamingCacheManager, NamingCacheManager } from '../utils/naming-cache.js';
import { getNamingPerformanceMonitor, NamingPerformanceMonitor } from '../utils/naming-performance.js';

/**
 * Interface for naming context data used in name generation
 */
export interface NamingContext {
  baristaDisplayName: string;
  baristaFirstName?: string;
  beanName: string;
  roastDate?: string;
  createdAt: Date;
  timezone?: string;
}

/**
 * Interface for bag naming context
 */
export interface BagNamingContext {
  ownerDisplayName: string;
  ownerFirstName?: string;
  beanName: string;
  roastDate?: string;
}

/**
 * Interface for brew naming context
 */
export interface BrewNamingContext {
  baristaDisplayName: string;
  baristaFirstName?: string;
  beanName: string;
  createdAt: Date;
  timezone?: string;
  timezoneDetection?: TimezoneDetectionResult;
  brewSequence: number;
  timeOfDay: string;
  brewDate: string;
}

/**
 * Template configuration for name generation
 */
export interface NameTemplate {
  pattern: string;
  fallbacks: Record<string, string>;
}

/**
 * Configuration for the naming service
 */
export interface NamingServiceConfig {
  bagTemplate: NameTemplate;
  brewTemplate: NameTemplate;
  dateFormat: string;
  timeFormat: string;
  defaultTimezone: string;
  maxRetries: number;
  timeoutMs: number;
}

/**
 * Error thrown when name generation fails
 */
export class NamingError extends Error {
  constructor(
    message: string,
    public readonly entityType: 'bag' | 'brew',
    public readonly entityId?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'NamingError';
  }
}

/**
 * Service responsible for generating automatic names for bags and brews
 */
export class NamingService {
  private config: NamingServiceConfig;
  private concurrentRequests: Map<string, Promise<string>> = new Map();
  private cacheManager: NamingCacheManager;
  private performanceMonitor: NamingPerformanceMonitor;

  constructor(
    config?: Partial<NamingServiceConfig>,
    cacheManager?: NamingCacheManager,
    performanceMonitor?: NamingPerformanceMonitor
  ) {
    this.config = {
      bagTemplate: {
        pattern: "{ownerDisplayName}'s {beanName} {roastDate}",
        fallbacks: {
          ownerDisplayName: 'Anonymous',
          beanName: 'Unknown Bean',
          roastDate: 'Unknown Roast'
        }
      },
      brewTemplate: {
        pattern: "{baristaDisplayName}'s {ordinal} {timeOfDay} {beanName} {brewDate}",
        fallbacks: {
          baristaDisplayName: 'Anonymous',
          beanName: 'Unknown Bean',
          timeOfDay: 'brew',
          brewDate: 'Unknown Date'
        }
      },
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:MM',
      defaultTimezone: 'UTC',
      maxRetries: 3,
      timeoutMs: 5000,
      ...config
    };

    // Use provided instances or default global instances
    this.cacheManager = cacheManager || getNamingCacheManager();
    this.performanceMonitor = performanceMonitor || getNamingPerformanceMonitor();
  }

  /**
   * Generate a name for a bag based on owner, bean, and roast date
   * Implements concurrent creation safety by deduplicating identical requests
   * Enhanced with comprehensive edge case handling and graceful degradation
   * Now includes performance monitoring and caching
   */
  async generateBagName(
    ownerId: string,
    beanId: string,
    roastDate?: string
  ): Promise<string> {
    const operationId = `bag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Start performance monitoring
    this.performanceMonitor.startOperation(operationId, 'bagNaming', undefined, ownerId);

    try {
      // Check system health and adjust behavior
      const systemHealth = NamingErrorHandler.checkSystemHealth();
      if (systemHealth.recommendedAction === 'emergency') {
        const emergencyName = NamingErrorHandler.createEmergencyFallback('bag');
        namingLogger.logFallbackUsed(
          'generateBagName',
          'bag',
          'emergency_fallback',
          emergencyName,
          'System in emergency state (memory pressure + database issues)',
          undefined,
          ownerId,
          { systemHealth }
        );
        
        this.performanceMonitor.endOperation(operationId, true, undefined, ownerId, undefined, false);
        return emergencyName;
      }

      // Validate and sanitize inputs
      const validation = NamingErrorHandler.validateInputs({
        baristaId: ownerId,
        beanId,
        roastDate
      });

      if (!validation.isValid) {
        const error = new NamingValidationError(
          'bag_inputs',
          { ownerId, beanId, roastDate },
          validation.errors.join('; ')
        );
        
        // Try to continue with sanitized inputs if possible
        if (validation.sanitized.baristaId || validation.sanitized.beanId) {
          namingLogger.logFallbackUsed(
            'generateBagName',
            'bag',
            'input_sanitization',
            'Using sanitized inputs',
            `Input validation errors: ${validation.errors.join('; ')}`,
            undefined,
            ownerId,
            { originalInputs: { ownerId, beanId, roastDate }, sanitizedInputs: validation.sanitized }
          );
        } else {
          // Complete input failure - use emergency fallback
          const emergencyName = NamingErrorHandler.createEmergencyFallback('bag');
          namingLogger.logOperationFailure(
            'generateBagName',
            'bag',
            error,
            0,
            undefined,
            ownerId,
            { inputValidation: validation }
          );
          
          this.performanceMonitor.endOperation(operationId, false, undefined, ownerId, error.message, false);
          return emergencyName;
        }
      }

      const startTime = Date.now();
      const namingOperationId = namingLogger.logOperationStart(
        'generateBagName',
        'bag',
        undefined, // entityId not available yet
        validation.sanitized.baristaId || ownerId,
        { beanId: validation.sanitized.beanId || beanId, roastDate: validation.sanitized.roastDate }
      );

      // Create a unique key for this naming request to handle concurrent requests
      const requestKey = `bag:${validation.sanitized.baristaId || ownerId}:${validation.sanitized.beanId || beanId}:${validation.sanitized.roastDate || 'no-date'}`;
      
      // Check if there's already a pending request for the same parameters
      const existingRequest = this.concurrentRequests.get(requestKey);
      if (existingRequest) {
        // Return the existing promise to avoid duplicate work
        const result = await existingRequest;
        this.performanceMonitor.endOperation(operationId, true, undefined, ownerId, undefined, true);
        return result;
      }

      // Create and store the naming promise with timeout protection
      const namingPromise = this.withTimeout(
        this.performBagNaming(
          validation.sanitized.baristaId || ownerId, 
          validation.sanitized.beanId || beanId, 
          validation.sanitized.roastDate,
          namingOperationId, 
          startTime,
          systemHealth
        ),
        this.config.timeoutMs,
        `Bag naming timeout for owner ${ownerId}, bean ${beanId}`
      );
      
      this.concurrentRequests.set(requestKey, namingPromise);

      try {
        const result = await namingPromise;
        this.performanceMonitor.endOperation(operationId, true, undefined, ownerId, undefined, false);
        return result;
      } catch (error) {
        // Handle complete naming failure with graceful degradation
        if (error instanceof NamingTimeoutError || systemHealth.recommendedAction === 'degraded') {
          const emergencyName = NamingErrorHandler.createEmergencyFallback('bag');
          namingLogger.logFallbackUsed(
            'generateBagName',
            'bag',
            'complete_failure_fallback',
            emergencyName,
            `Complete naming failure: ${error}`,
            undefined,
            ownerId,
            { systemHealth, error: error instanceof Error ? error.message : String(error) }
          );
          
          this.performanceMonitor.endOperation(
            operationId, 
            false, 
            undefined, 
            ownerId, 
            error instanceof Error ? error.message : String(error),
            false
          );
          return emergencyName;
        }
        
        this.performanceMonitor.endOperation(
          operationId, 
          false, 
          undefined, 
          ownerId, 
          error instanceof Error ? error.message : String(error),
          false
        );
        throw error;
      } finally {
        // Clean up the request from the map when done
        this.concurrentRequests.delete(requestKey);
      }
    } catch (error) {
      this.performanceMonitor.endOperation(
        operationId, 
        false, 
        undefined, 
        ownerId, 
        error instanceof Error ? error.message : String(error),
        false
      );
      throw error;
    }
  }

  /**
   * Generate a name for a brew based on barista, bag, and creation time
   * Implements concurrent creation safety by using precise timestamps and deduplication
   * Supports timezone detection from browser, user preferences, or headers
   * Enhanced with comprehensive edge case handling and graceful degradation
   * Now includes performance monitoring and caching
   */
  async generateBrewName(
    baristaId: string,
    bagId: string,
    createdAt: Date = new Date(),
    timezoneOptions?: {
      browserTimezone?: string;
      userTimezone?: string;
      headerTimezone?: string;
    }
  ): Promise<string> {
    const operationId = `brew-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Start performance monitoring
    this.performanceMonitor.startOperation(operationId, 'brewNaming', undefined, baristaId);

    try {
      // Check system health and adjust behavior
      const systemHealth = NamingErrorHandler.checkSystemHealth();
      if (systemHealth.recommendedAction === 'emergency') {
        const emergencyName = NamingErrorHandler.createEmergencyFallback('brew', createdAt);
        namingLogger.logFallbackUsed(
          'generateBrewName',
          'brew',
          'emergency_fallback',
          emergencyName,
          'System in emergency state (memory pressure + database issues)',
          undefined,
          baristaId,
          { systemHealth }
        );
        
        this.performanceMonitor.endOperation(operationId, true, undefined, baristaId, undefined, false);
        return emergencyName;
      }

      // Validate and sanitize inputs
      const validation = NamingErrorHandler.validateInputs({
        baristaId,
        bagId
      });

      if (!validation.isValid) {
        const error = new NamingValidationError(
          'brew_inputs',
          { baristaId, bagId, createdAt: createdAt.toISOString() },
          validation.errors.join('; ')
        );
        
        // Try to continue with sanitized inputs if possible
        if (validation.sanitized.baristaId || validation.sanitized.bagId) {
          namingLogger.logFallbackUsed(
            'generateBrewName',
            'brew',
            'input_sanitization',
            'Using sanitized inputs',
            `Input validation errors: ${validation.errors.join('; ')}`,
            undefined,
            baristaId,
            { originalInputs: { baristaId, bagId }, sanitizedInputs: validation.sanitized }
          );
        } else {
          // Complete input failure - use emergency fallback
          const emergencyName = NamingErrorHandler.createEmergencyFallback('brew', createdAt);
          namingLogger.logOperationFailure(
            'generateBrewName',
            'brew',
            error,
            0,
            undefined,
            baristaId,
            { inputValidation: validation }
          );
          
          this.performanceMonitor.endOperation(operationId, false, undefined, baristaId, error.message, false);
          return emergencyName;
        }
      }

      const startTime = Date.now();
      const namingOperationId = namingLogger.logOperationStart(
        'generateBrewName',
        'brew',
        undefined, // entityId not available yet
        validation.sanitized.baristaId || baristaId,
        { bagId: validation.sanitized.bagId || bagId, createdAt: createdAt.toISOString(), timezoneOptions }
      );

      // For brews, we include the timestamp in the key to ensure uniqueness
      // even for concurrent requests from the same barista with the same bag
      const timestamp = createdAt.getTime();
      const requestKey = `brew:${validation.sanitized.baristaId || baristaId}:${validation.sanitized.bagId || bagId}:${timestamp}`;
      
      // Check if there's already a pending request for the same parameters
      const existingRequest = this.concurrentRequests.get(requestKey);
      if (existingRequest) {
        // Return the existing promise to avoid duplicate work
        const result = await existingRequest;
        this.performanceMonitor.endOperation(operationId, true, undefined, baristaId, undefined, true);
        return result;
      }

      // Create and store the naming promise with timeout protection
      const namingPromise = this.withTimeout(
        this.performBrewNaming(
          validation.sanitized.baristaId || baristaId, 
          validation.sanitized.bagId || bagId, 
          createdAt, 
          timezoneOptions, 
          namingOperationId, 
          startTime,
          systemHealth
        ),
        this.config.timeoutMs,
        `Brew naming timeout for barista ${baristaId}, bag ${bagId}`
      );
      
      this.concurrentRequests.set(requestKey, namingPromise);

      try {
        const result = await namingPromise;
        this.performanceMonitor.endOperation(operationId, true, undefined, baristaId, undefined, false);
        return result;
      } catch (error) {
        // Handle complete naming failure with graceful degradation
        if (error instanceof NamingTimeoutError || systemHealth.recommendedAction === 'degraded') {
          const emergencyName = NamingErrorHandler.createEmergencyFallback('brew', createdAt);
          namingLogger.logFallbackUsed(
            'generateBrewName',
            'brew',
            'complete_failure_fallback',
            emergencyName,
            `Complete naming failure: ${error}`,
            undefined,
            baristaId,
            { systemHealth, error: error instanceof Error ? error.message : String(error) }
          );
          
          this.performanceMonitor.endOperation(
            operationId, 
            false, 
            undefined, 
            baristaId, 
            error instanceof Error ? error.message : String(error),
            false
          );
          return emergencyName;
        }
        
        this.performanceMonitor.endOperation(
          operationId, 
          false, 
          undefined, 
          baristaId, 
          error instanceof Error ? error.message : String(error),
          false
        );
        throw error;
      } finally {
        // Clean up the request from the map when done
        this.concurrentRequests.delete(requestKey);
      }
    } catch (error) {
      this.performanceMonitor.endOperation(
        operationId, 
        false, 
        undefined, 
        baristaId, 
        error instanceof Error ? error.message : String(error),
        false
      );
      throw error;
    }
  }

  /**
   * Perform the actual bag naming logic
   * Enhanced with comprehensive error handling and graceful degradation
   */
  private async performBagNaming(
    ownerId: string,
    beanId: string,
    roastDate?: string,
    operationId?: string,
    startTime?: number,
    systemHealth?: { recommendedAction: 'normal' | 'degraded' | 'emergency' }
  ): Promise<string> {
    try {
      // Use degraded mode if system health is poor
      if (systemHealth?.recommendedAction === 'degraded') {
        DEGRADATION_STRATEGIES.MEMORY_PRESSURE.implementation();
      }

      const context = await this.buildBagNamingContext(ownerId, beanId, roastDate);
      const generatedName = this.applyBagTemplate(context);
      
      // Sanitize the generated name to handle edge cases
      const sanitizedName = NamingErrorHandler.sanitizeName(generatedName);
      
      // Log successful operation
      if (operationId && startTime) {
        const duration = Date.now() - startTime;
        namingLogger.logOperationSuccess(
          'generateBagName',
          'bag',
          sanitizedName,
          duration,
          undefined, // entityId not available
          ownerId,
          { beanId, roastDate, operationId, sanitized: sanitizedName !== generatedName }
        );
      }
      
      return sanitizedName;
    } catch (error) {
      const duration = startTime ? Date.now() - startTime : 0;
      
      // Try graceful degradation before complete failure
      const fallbackName = await NamingErrorHandler.handleEdgeCase(
        'bag_naming_failure',
        async () => { throw error; }, // Re-throw to trigger fallback
        NamingErrorHandler.createEmergencyFallback('bag'),
        {
          entityType: 'bag',
          entityId: undefined,
          baristaId: ownerId,
          operationName: 'performBagNaming'
        }
      );
      
      // If we got a fallback, return it instead of throwing
      if (fallbackName !== NamingErrorHandler.createEmergencyFallback('bag') || 
          !(error instanceof NamingError)) {
        return fallbackName;
      }
      
      const namingError = new NamingError(
        `Failed to generate bag name for owner ${ownerId}, bean ${beanId}`,
        'bag',
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
      
      // Log failure
      namingLogger.logOperationFailure(
        'generateBagName',
        'bag',
        namingError,
        duration,
        undefined, // entityId not available
        ownerId,
        { beanId, roastDate, operationId, systemHealth }
      );
      
      throw namingError;
    }
  }

  /**
   * Perform the actual brew naming logic
   * Enhanced with comprehensive error handling and graceful degradation
   */
  private async performBrewNaming(
    baristaId: string,
    bagId: string,
    createdAt: Date,
    timezoneOptions?: {
      browserTimezone?: string;
      userTimezone?: string;
      headerTimezone?: string;
    },
    operationId?: string,
    startTime?: number,
    systemHealth?: { recommendedAction: 'normal' | 'degraded' | 'emergency' }
  ): Promise<string> {
    try {
      // Use degraded mode if system health is poor
      if (systemHealth?.recommendedAction === 'degraded') {
        DEGRADATION_STRATEGIES.MEMORY_PRESSURE.implementation();
      }

      const context = await this.buildBrewNamingContext(baristaId, bagId, createdAt, timezoneOptions);
      const generatedName = this.applyBrewTemplate(context);
      
      // Sanitize the generated name to handle edge cases
      const sanitizedName = NamingErrorHandler.sanitizeName(generatedName);
      
      // Log successful operation
      if (operationId && startTime) {
        const duration = Date.now() - startTime;
        namingLogger.logOperationSuccess(
          'generateBrewName',
          'brew',
          sanitizedName,
          duration,
          undefined, // entityId not available
          baristaId,
          { bagId, createdAt: createdAt.toISOString(), timezoneOptions, operationId, sanitized: sanitizedName !== generatedName }
        );
      }
      
      return sanitizedName;
    } catch (error) {
      const duration = startTime ? Date.now() - startTime : 0;
      
      // Try graceful degradation before complete failure
      const fallbackName = await NamingErrorHandler.handleEdgeCase(
        'brew_naming_failure',
        async () => { throw error; }, // Re-throw to trigger fallback
        NamingErrorHandler.createEmergencyFallback('brew', createdAt),
        {
          entityType: 'brew',
          entityId: undefined,
          baristaId,
          operationName: 'performBrewNaming'
        }
      );
      
      // If we got a fallback, return it instead of throwing
      if (fallbackName !== NamingErrorHandler.createEmergencyFallback('brew', createdAt) || 
          !(error instanceof NamingError)) {
        return fallbackName;
      }
      
      const namingError = new NamingError(
        `Failed to generate brew name for barista ${baristaId}, bag ${bagId}`,
        'brew',
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
      
      // Log failure
      namingLogger.logOperationFailure(
        'generateBrewName',
        'brew',
        namingError,
        duration,
        undefined, // entityId not available
        baristaId,
        { bagId, createdAt: createdAt.toISOString(), timezoneOptions, operationId, systemHealth }
      );
      
      throw namingError;
    }
  }

  /**
   * Build naming context for bag name generation
   */
  private async buildBagNamingContext(
    ownerId: string,
    beanId: string,
    roastDate?: string
  ): Promise<BagNamingContext> {
    const [ownerDisplayName, ownerFirstName] = await this.getBaristaDisplayName(ownerId);
    const beanName = await this.getBeanName(beanId);

    return {
      ownerDisplayName,
      ownerFirstName,
      beanName,
      roastDate
    };
  }

  /**
   * Build naming context for brew name generation
   */
  private async buildBrewNamingContext(
    baristaId: string,
    bagId: string,
    createdAt: Date,
    timezoneOptions?: {
      browserTimezone?: string;
      userTimezone?: string;
      headerTimezone?: string;
    }
  ): Promise<BrewNamingContext> {
    const [baristaDisplayName, baristaFirstName] = await this.getBaristaDisplayName(baristaId);
    const beanName = await this.getBeanNameFromBag(bagId);

    // Detect timezone from available sources
    const timezoneDetection = detectTimezone(
      timezoneOptions?.browserTimezone,
      timezoneOptions?.userTimezone,
      timezoneOptions?.headerTimezone
    );

    // Use detected timezone or fallback
    const timezone = timezoneDetection.detected || timezoneDetection.fallback;

    const timeOfDay = this.getTimeOfDayLabel(createdAt, timezone);
    const brewSequence = await this.getBrewSequenceForDayAndTimeOfDay(baristaId, createdAt, timeOfDay, timezone);
    const brewDate = this.formatBrewDate(createdAt, timezone);

    return {
      baristaDisplayName,
      baristaFirstName,
      beanName,
      createdAt,
      timezone,
      timezoneDetection,
      brewSequence,
      timeOfDay,
      brewDate
    };
  }

  /**
   * Apply bag template to generate the final name
   * Special characters are preserved exactly as they appear in the source data
   */
  private applyBagTemplate(context: BagNamingContext): string {
    const template = this.config.bagTemplate;
    let name = template.pattern;

    // Replace owner display name with fallback if needed
    // Special characters in names are preserved exactly
    const ownerName = context.ownerDisplayName || 
                     context.ownerFirstName || 
                     template.fallbacks.ownerDisplayName;
    name = name.replace('{ownerDisplayName}', this.preserveSpecialCharacters(ownerName));

    // Replace bean name with fallback if needed
    // Special characters in bean names are preserved exactly
    const beanName = context.beanName || template.fallbacks.beanName;
    name = name.replace('{beanName}', this.preserveSpecialCharacters(beanName));

    // Replace roast date with formatted date or fallback
    const roastDate = this.formatRoastDate(context.roastDate);
    name = name.replace('{roastDate}', roastDate);

    return name;
  }

  /**
   * Apply brew template to generate the final name
   * Special characters are preserved exactly as they appear in the source data
   */
  private applyBrewTemplate(context: BrewNamingContext): string {
    const template = this.config.brewTemplate;
    const baristaName = this.preserveSpecialCharacters(
      context.baristaDisplayName || context.baristaFirstName || template.fallbacks.baristaDisplayName
    );

    const beanName = this.preserveSpecialCharacters(context.beanName || template.fallbacks.beanName);

    const ordinal = this.formatOrdinalLabel(context.brewSequence);
    const timeOfDay = context.timeOfDay || template.fallbacks.timeOfDay;
    const brewDate = context.brewDate || template.fallbacks.brewDate;

    const parts = [
      `${baristaName}'s`,
      ordinal,
      timeOfDay,
      beanName,
      brewDate
    ].filter((part) => Boolean(part && part.toString().trim().length));

    // If template is customized, honor placeholders while still removing empty ordinal spacing
    if (template.pattern.includes('{')) {
      let name = template.pattern;
      name = name.replace('{baristaDisplayName}', baristaName);
      name = name.replace('{ordinal}', ordinal);
      name = name.replace('{timeOfDay}', timeOfDay);
      name = name.replace('{beanName}', beanName);
      name = name.replace('{brewDate}', brewDate);
      // Collapse duplicate spaces from optional ordinal
      return name.replace(/\s{2,}/g, ' ').trim();
    }

    return parts.join(' ').trim();
  }

  /**
   * Get barista display name with fallback to first name
   * Returns [displayName, firstName] tuple
   * Enhanced with comprehensive error handling and graceful degradation
   * Now includes caching for improved performance
   */
  private async getBaristaDisplayName(baristaId: string): Promise<[string, string?]> {
    // Check cache first
    const cached = this.cacheManager.baristaNames.getBaristaName(baristaId);
    if (cached) {
      return cached;
    }

    return await NamingErrorHandler.handleDatabaseOperation(
      async () => {
        const { data, error } = await supabase
          .from('barista')
          .select('display_name, first_name')
          .eq('id', baristaId)
          .single();

        if (error) {
          throw new NamingDatabaseError('select', 'barista', new Error(error.message));
        }

        if (!data) {
          throw new Error('No barista data found');
        }

        const barista = data as Pick<Barista, 'display_name' | 'first_name'>;

        // Priority: display_name -> first_name -> fallback will be handled by caller
        let result: [string, string?];
        
        if (barista.display_name && barista.display_name.trim()) {
          result = [this.preserveSpecialCharacters(barista.display_name.trim()), barista.first_name];
        } else if (barista.first_name && barista.first_name.trim()) {
          namingLogger.logFallbackUsed(
            'getBaristaDisplayName',
            'bag',
            'ownerDisplayName',
            barista.first_name.trim(),
            'display_name is empty, using first_name',
            undefined,
            baristaId
          );
          result = [this.preserveSpecialCharacters(barista.first_name.trim()), barista.first_name];
        } else {
          // Both names are empty - let the error handler provide fallback
          throw new Error('Both display_name and first_name are empty');
        }

        // Cache the result before returning
        this.cacheManager.baristaNames.setBaristaName(baristaId, result[0], result[1]);
        
        return result;
      },
      [this.config.bagTemplate.fallbacks.ownerDisplayName] as [string, string?], // Fallback value
      {
        operationName: 'getBaristaDisplayName',
        table: 'barista',
        query: `SELECT display_name, first_name FROM barista WHERE id = '${baristaId}'`,
        entityType: 'bag',
        entityId: baristaId
      }
    );
  }

  /**
   * Get bean name by bean ID
   * Enhanced with comprehensive error handling and graceful degradation
   * Now includes caching for improved performance
   */
  private async getBeanName(beanId: string): Promise<string> {
    // Check cache first
    const cached = this.cacheManager.beanNames.getBeanName(beanId);
    if (cached) {
      return cached;
    }

    return await NamingErrorHandler.handleDatabaseOperation(
      async () => {
        const { data, error } = await supabase
          .from('bean')
          .select('name')
          .eq('id', beanId)
          .single();

        if (error) {
          throw new NamingDatabaseError('select', 'bean', new Error(error.message));
        }

        if (!data || !data.name || !data.name.trim()) {
          throw new Error('Bean name is empty or null');
        }

        const beanName = this.preserveSpecialCharacters(data.name.trim());
        
        // Cache the result before returning
        this.cacheManager.beanNames.setBeanName(beanId, beanName);
        
        return beanName;
      },
      this.config.bagTemplate.fallbacks.beanName, // Fallback value
      {
        operationName: 'getBeanName',
        table: 'bean',
        query: `SELECT name FROM bean WHERE id = '${beanId}'`,
        entityType: 'bag',
        entityId: beanId
      }
    );
  }

  /**
   * Get bean name from bag relationship
   * Enhanced with comprehensive error handling and graceful degradation
   * Now includes caching for improved performance
   */
  private async getBeanNameFromBag(bagId: string): Promise<string> {
    // Check cache first
    const cached = this.cacheManager.bagBeans.getBeanNameFromBag(bagId);
    if (cached) {
      return cached;
    }

    return await NamingErrorHandler.handleDatabaseOperation(
      async () => {
        const { data, error } = await supabase
          .from('bag')
          .select(`
            bean:bean_id (
              name
            )
          `)
          .eq('id', bagId)
          .single();

        if (error) {
          throw new NamingDatabaseError('select', 'bag', new Error(error.message));
        }

        // Type assertion for the nested bean data structure
        const bagWithBean = data as { bean: { name: string } | { name: string }[] | null };
        
        // Handle both single object and array responses from Supabase
        let beanName: string | null = null;
        if (bagWithBean && bagWithBean.bean) {
          if (Array.isArray(bagWithBean.bean)) {
            // If it's an array, take the first element
            beanName = bagWithBean.bean.length > 0 ? bagWithBean.bean[0].name : null;
          } else {
            // If it's a single object
            beanName = bagWithBean.bean.name;
          }
        }
        
        if (!beanName || !beanName.trim()) {
          throw new Error('Bean name from bag is empty or null');
        }

        const processedBeanName = this.preserveSpecialCharacters(beanName.trim());
        
        // Cache the result before returning
        this.cacheManager.bagBeans.setBeanNameForBag(bagId, processedBeanName);
        
        return processedBeanName;
      },
      this.config.brewTemplate.fallbacks.beanName, // Fallback value
      {
        operationName: 'getBeanNameFromBag',
        table: 'bag',
        query: `SELECT bean:bean_id(name) FROM bag WHERE id = '${bagId}'`,
        entityType: 'brew',
        entityId: bagId
      }
    );
  }

  /**
   * Format roast date as MM/DD/YY or return fallback
   */
  private formatRoastDate(roastDate?: string): string {
    if (!roastDate) {
      return this.config.bagTemplate.fallbacks.roastDate;
    }

    try {
      const date = new Date(roastDate);
      if (isNaN(date.getTime())) {
        return this.config.bagTemplate.fallbacks.roastDate;
      }

      const formatter = new Intl.DateTimeFormat('en-US', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
      });

      return formatter.format(date);
    } catch {
      return this.config.bagTemplate.fallbacks.roastDate;
    }
  }

  /**
   * Format brew date as a short, timezone-aware string (MM/DD/YY)
   */
  private formatBrewDate(createdAt: Date, timezone?: string): string {
    try {
      const effectiveTimezone = timezone || this.config.defaultTimezone;
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: effectiveTimezone,
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
      });

      return formatter.format(createdAt);
    } catch (error) {
      console.warn(`Failed to format brew date for timezone ${timezone}:`, error);
      return this.config.brewTemplate.fallbacks.brewDate;
    }
  }

  /**
   * Determine the time of day label based on the brew timestamp
   */
  private getTimeOfDayLabel(createdAt: Date, timezone?: string): string {
    try {
      const effectiveTimezone = timezone || this.config.defaultTimezone;
      const { hour } = this.getLocalDateParts(createdAt, effectiveTimezone);

      if (hour >= 5 && hour < 12) {
        return 'morning';
      }
      if (hour >= 12 && hour < 17) {
        return 'afternoon';
      }
      if (hour >= 17 && hour < 22) {
        return 'evening';
      }

      return 'night';
    } catch (error) {
      console.warn(`Failed to determine time of day for timezone ${timezone}:`, error);
      return this.config.brewTemplate.fallbacks.timeOfDay;
    }
  }

  /**
   * Get the brew sequence number for the day and time of day to build ordinal labels
   */
  private async getBrewSequenceForDayAndTimeOfDay(
    baristaId: string,
    createdAt: Date,
    timeOfDay: string,
    timezone?: string
  ): Promise<number> {
    const effectiveTimezone = timezone || this.config.defaultTimezone;
    const { start, end } = this.getTimeOfDayBounds(createdAt, timeOfDay, effectiveTimezone);

    return NamingErrorHandler.handleDatabaseOperation(
      async () => {
        const ranges = Array.isArray(start) ? start.map((rangeStart, index) => ({
          start: rangeStart,
          end: (end as Date[])[index]
        })) : [{ start: start as Date, end: end as Date }];

        let totalCount = 0;

        for (const range of ranges) {
          const { count, error } = await supabase
            .from('brew')
            .select('id', { count: 'exact', head: true })
            .eq('barista_id', baristaId)
            .gte('created_at', range.start.toISOString())
            .lt('created_at', range.end.toISOString());

          if (error) {
            throw new NamingDatabaseError('select', 'brew', new Error(error.message));
          }

          totalCount += count || 0;
        }

        return totalCount + 1;
      },
      1,
      {
        operationName: 'getBrewSequenceForDayAndTimeOfDay',
        table: 'brew',
        query: Array.isArray(start)
          ? `SELECT count(*) FROM brew WHERE barista_id = '${baristaId}' AND ((created_at >= '${(start as Date[])[0].toISOString()}' AND created_at < '${(end as Date[])[0].toISOString()}') OR (created_at >= '${(start as Date[])[1].toISOString()}' AND created_at < '${(end as Date[])[1].toISOString()}'))`
          : `SELECT count(*) FROM brew WHERE barista_id = '${baristaId}' AND created_at >= '${(start as Date).toISOString()}' AND created_at < '${(end as Date).toISOString()}'`,
        entityType: 'brew',
        entityId: baristaId
      }
    );
  }

  /**
   * Calculate the UTC bounds for the provided timezone-local date parts
   */
  private getLocalDateParts(date: Date, timezone: string): { year: number; month: number; day: number; hour: number } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const year = parseInt(parts.find((p) => p.type === 'year')?.value || `${date.getUTCFullYear()}`, 10);
    const month = parseInt(parts.find((p) => p.type === 'month')?.value || `${date.getUTCMonth() + 1}`, 10) - 1;
    const day = parseInt(parts.find((p) => p.type === 'day')?.value || `${date.getUTCDate()}`, 10);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || `${date.getUTCHours()}`, 10);

    return { year, month, day, hour };
  }

  /**
   * Calculate the UTC day bounds for the provided timezone-local date
   */
  private getDayBounds(date: Date, timezone: string): { start: Date; end: Date } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const parts = formatter.formatToParts(date);
    const year = parseInt(parts.find((p) => p.type === 'year')?.value || `${date.getUTCFullYear()}`, 10);
    const month = parseInt(parts.find((p) => p.type === 'month')?.value || `${date.getUTCMonth() + 1}`, 10) - 1;
    const day = parseInt(parts.find((p) => p.type === 'day')?.value || `${date.getUTCDate()}`, 10);

    const start = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, day + 1, 0, 0, 0));

    return { start, end };
  }

  /**
   * Calculate the UTC bounds for the provided timezone-local time-of-day window
   */
  private getTimeOfDayBounds(
    date: Date,
    timeOfDay: string,
    timezone: string
  ): { start: Date | Date[]; end: Date | Date[] } {
    const { year, month, day } = this.getLocalDateParts(date, timezone);

    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day + 1, 0, 0, 0));

    if (timeOfDay === 'morning') {
      return {
        start: new Date(Date.UTC(year, month, day, 5, 0, 0)),
        end: new Date(Date.UTC(year, month, day, 12, 0, 0))
      };
    }

    if (timeOfDay === 'afternoon') {
      return {
        start: new Date(Date.UTC(year, month, day, 12, 0, 0)),
        end: new Date(Date.UTC(year, month, day, 17, 0, 0))
      };
    }

    if (timeOfDay === 'evening') {
      return {
        start: new Date(Date.UTC(year, month, day, 17, 0, 0)),
        end: new Date(Date.UTC(year, month, day, 22, 0, 0))
      };
    }

    if (timeOfDay === 'night') {
      return {
        start: [startOfDay, new Date(Date.UTC(year, month, day, 22, 0, 0))],
        end: [new Date(Date.UTC(year, month, day, 5, 0, 0)), endOfDay]
      };
    }

    return { start: startOfDay, end: endOfDay };
  }

  /**
   * Format ordinal labels for the sequence (first brew has no ordinal)
   */
  private formatOrdinalLabel(sequence: number): string {
    if (sequence <= 1) {
      return '';
    }

    const remainder = sequence % 100;
    if (remainder >= 11 && remainder <= 13) {
      return `${sequence}th`;
    }

    switch (sequence % 10) {
      case 1:
        return `${sequence}st`;
      case 2:
        return `${sequence}nd`;
      case 3:
        return `${sequence}rd`;
      default:
        return `${sequence}th`;
    }
  }

  /**
   * Preserve special characters and ensure consistent character encoding
   * This method validates that the input string maintains proper Unicode encoding
   * and returns the string with all special characters preserved exactly
   */
  private preserveSpecialCharacters(input: string): string {
    if (!input) {
      return input;
    }

    // Ensure the string is properly normalized to handle various Unicode representations
    // NFC (Canonical Decomposition, followed by Canonical Composition) is the standard
    // for web applications and ensures consistent character representation
    const normalized = input.normalize('NFC');

    // Validate that the string contains valid Unicode characters
    // This check ensures character encoding consistency across different environments
    try {
      // Test that the string can be properly encoded/decoded
      const encoded = encodeURIComponent(normalized);
      const decoded = decodeURIComponent(encoded);
      
      // If encoding/decoding succeeds, the string has consistent character encoding
      if (decoded === normalized) {
        return normalized;
      }
    } catch (error) {
      // If encoding fails, log a warning but return the original string
      console.warn('Character encoding validation failed for string:', input, error);
    }

    // Return the normalized string even if validation fails
    // This ensures special characters are preserved even in edge cases
    return normalized;
  }

  /**
   * Preserve timezone context for accurate brew time representation
   * This ensures timezone context is maintained throughout the naming process
   * for cross-environment consistency and debugging purposes
   */
  private preserveTimezoneContext(
    effectiveTimezone: string,
    timezoneDetection: TimezoneDetectionResult,
    createdAt: Date
  ): void {
    try {
      // Log timezone context for debugging and audit purposes
      const contextInfo = {
        effectiveTimezone,
        detectedTimezone: timezoneDetection.detected,
        fallbackTimezone: timezoneDetection.fallback,
        source: timezoneDetection.source,
        confidence: timezoneDetection.confidence,
        timestamp: createdAt.toISOString(),
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // Store context for potential debugging (in production, this could be sent to logging service)
      console.debug('Timezone context preserved:', contextInfo);

      // In a production environment, you might want to store this in a database
      // or send to a monitoring service for timezone consistency analysis
    } catch (error) {
      console.warn('Failed to preserve timezone context:', error);
    }
  }

  /**
   * Wrap a promise with a timeout to prevent hanging requests
   * This is crucial for concurrent creation safety to avoid memory leaks
   * Enhanced with proper error typing
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        reject(new NamingTimeoutError(errorMessage, timeoutMs));
      }, timeoutMs);

      // Execute the original promise
      promise
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Get the current number of pending concurrent requests
   * Useful for monitoring and debugging concurrent creation scenarios
   */
  public getPendingRequestCount(): number {
    return this.concurrentRequests.size;
  }

  /**
   * Clear all pending concurrent requests
   * Should only be used in testing or emergency scenarios
   */
  public clearPendingRequests(): void {
    this.concurrentRequests.clear();
  }

  /**
   * Get naming service metrics for monitoring
   */
  public getMetrics() {
    const namingMetrics = namingLogger.getMetrics();
    const cacheStats = this.cacheManager.getStats();
    const performanceMetrics = this.performanceMonitor.getMetrics();
    
    return {
      ...namingMetrics,
      cache: cacheStats,
      performance: performanceMetrics
    };
  }

  /**
   * Get performance metrics specifically
   */
  public getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Get performance summary for monitoring dashboards
   */
  public getPerformanceSummary() {
    return this.performanceMonitor.getPerformanceSummary();
  }

  /**
   * Check if naming operations are meeting performance requirements
   */
  public checkPerformanceRequirements() {
    return this.performanceMonitor.checkPerformanceRequirements();
  }

  /**
   * Export performance data for analysis
   */
  public exportPerformanceData(format: 'json' | 'csv' = 'json') {
    return this.performanceMonitor.exportData(format);
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats() {
    return this.cacheManager.getStats();
  }

  /**
   * Clear all caches
   */
  public clearCaches(): void {
    this.cacheManager.clearAll();
  }

  /**
   * Invalidate cache entries for a specific barista
   */
  public invalidateBaristaCache(baristaId: string): number {
    return this.cacheManager.invalidateBarista(baristaId);
  }

  /**
   * Invalidate cache entries for a specific bean
   */
  public invalidateBeanCache(beanId: string): number {
    return this.cacheManager.invalidateBean(beanId);
  }

  /**
   * Invalidate cache entries for a specific bag
   */
  public invalidateBagCache(bagId: string): number {
    return this.cacheManager.invalidateBag(bagId);
  }

  /**
   * Get recent naming logs for debugging
   */
  public getRecentLogs(limit?: number) {
    return namingLogger.getRecentLogs(limit);
  }

  /**
   * Get audit trail for compliance and debugging
   */
  public getAuditTrail(limit?: number) {
    return namingLogger.getAuditTrail(limit);
  }

  /**
   * Get error summary for troubleshooting
   */
  public getErrorSummary() {
    return namingLogger.getErrorSummary();
  }

  /**
   * Export logs for external analysis
   */
  public exportLogs(format: 'json' | 'csv' = 'json') {
    return namingLogger.exportLogs(format);
  }

  /**
   * Log admin override of generated name
   */
  public logAdminOverride(
    entityType: 'bag' | 'brew',
    entityId: string,
    oldName: string,
    newName: string,
    adminId: string,
    reason?: string
  ) {
    namingLogger.logAdminOverride(entityType, entityId, oldName, newName, adminId, reason);
  }

  /**
   * Cleanup old logs to prevent memory leaks
   * Should be called periodically in production
   * Now also cleans up cache statistics
   */
  public cleanup(): void {
    namingLogger.cleanup();
    // Cache cleanup is handled automatically by each cache's internal timer
  }

  /**
   * Handle complete naming system failure gracefully
   * Ensures the system continues to function even when naming completely fails
   * Requirements: 3.5
   */
  public handleCompleteFailure(
    entityType: 'bag' | 'brew',
    entityId?: string,
    baristaId?: string,
    error?: Error
  ): null {
    return DEGRADATION_STRATEGIES.COMPLETE_FAILURE.implementation(entityType, entityId) as null;
  }

  /**
   * Check if the naming service is healthy and functioning
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    metrics: any;
    systemHealth: any;
    performance: any;
  }> {
    const issues: string[] = [];
    const systemHealth = NamingErrorHandler.checkSystemHealth();
    const metrics = this.getMetrics();
    const performanceCheck = this.checkPerformanceRequirements();

    // Check error rates
    const errorRate = metrics.totalRequests > 0 
      ? (metrics.failedRequests / metrics.totalRequests) * 100 
      : 0;

    if (errorRate > 50) {
      issues.push(`High error rate: ${errorRate.toFixed(1)}%`);
    }

    // Check response times
    if (metrics.averageResponseTime > 1000) {
      issues.push(`Slow response times: ${metrics.averageResponseTime.toFixed(0)}ms average`);
    }

    // Check system health
    if (systemHealth.memoryPressure) {
      issues.push('Memory pressure detected');
    }

    if (!systemHealth.databaseConnected) {
      issues.push('Database connection issues');
    }

    // Check pending requests
    const pendingCount = this.getPendingRequestCount();
    if (pendingCount > 100) {
      issues.push(`High number of pending requests: ${pendingCount}`);
    }

    // Add performance requirement issues
    if (!performanceCheck.withinRequirements) {
      issues.push(...performanceCheck.issues);
    }

    return {
      healthy: issues.length === 0,
      issues,
      metrics,
      systemHealth,
      performance: performanceCheck
    };
  }

  /**
   * Start periodic cleanup to prevent memory leaks
   * Should be called once when the service starts
   */
  public startPeriodicCleanup(intervalMs: number = 300000): NodeJS.Timeout { // 5 minutes default
    return setInterval(() => {
      try {
        this.cleanup();
        
        // Log cleanup activity
        const metrics = this.getMetrics();
        console.debug('[NamingService] Periodic cleanup completed', {
          totalRequests: metrics.totalRequests,
          pendingRequests: this.getPendingRequestCount(),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('[NamingService] Cleanup failed:', error);
      }
    }, intervalMs);
  }
}

/**
 * Default naming service instance
 */
export const namingService = new NamingService();
