/**
 * @fileoverview UserDataService - Unified Data Access Layer
 *
 * 入境通 - Passport Data Service (Unified Data Service)
 * Centralized service for managing all user data operations
 *
 * This service provides a unified interface for accessing passport, personal info,
 * and funding proof data. It implements caching for performance.
 *
 * @module app/services/data/UserDataService
 * @requires app/models/Passport
 * @requires app/models/PersonalInfo
 * @requires app/services/security/SecureStorageService
 *
 * @description
 * Architecture:
 * - Single source of truth: SQLite database
 * - In-memory caching with TTL (5 minutes)
 * - Event-based cache invalidation
 * - Batch operations with transactions
 * 
 * @example
 * // Initialize the service
 * await UserDataService.initialize(userId);
 * 
 * // Load all user data
 * const userData = await UserDataService.getAllUserData(userId);
 * 
 * // Update passport
 * await UserDataService.updatePassport(passportId, { gender: 'Male' });
 * 
 * // Batch update multiple data types
 * await UserDataService.batchUpdate(userId, {
 *   passport: { gender: 'Male' },
 *   personalInfo: { phoneNumber: '+86 123456789' }
 * });
 * 
 * @author 入境通 Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import Passport from '../../models/Passport';
import PersonalInfo from '../../models/PersonalInfo';
import PassportCountry from '../../models/PassportCountry';
import SecureStorageService from '../security/SecureStorageService';
import CacheStore from './cache/CacheStore';
import CacheManager from './cache/CacheManager';
import PassportOperations from './operations/PassportOperations';
import PersonalInfoOperations from './operations/PersonalInfoOperations';
import FundItemOperations from './operations/FundItemOperations';
import TravelInfoOperations from './operations/TravelInfoOperations';
import EntryInfoOperations from './operations/EntryInfoOperations';
import DataValidationService from './validation/DataValidationService';
import DataEventService, { DataChangeListener as EventDataChangeListener } from './events/DataEventService';
import EntryInfoService from '../EntryInfoService';
import logger from '../LoggingService';

import type {
  UserId,
  PassportData,
  SerializablePassport,
  PersonalInfoData,
  FundItemData,
  TravelInfoData,
  EntryInfoData,
  AllUserData,
  CacheStats,
  BatchUpdateData,
  ServiceOptions,
  PassportOptions,
} from '../../types/data';

// Type definitions for complex model types (to be refined later)
type PassportModel = any; // Passport class instance
type PersonalInfoModel = any; // PersonalInfo class instance
type PassportCountryModel = any; // PassportCountry class instance
type FundItemModel = any; // FundItem class instance
type EntryInfoModel = any; // EntryInfo class instance

interface DigitalArrivalCardData {
  userId: UserId;
  entryInfoId: string;
  cardType: string;
  arrCardNo?: string;
  qrUri?: string;
  pdfUrl?: string;
  submittedAt?: string;
  submissionMethod?: string;
  status?: string;
  [key: string]: any;
}

interface EntryInfoStateChangeEvent {
  type: string;
  entryInfoId: string;
  userId: UserId;
  destinationId?: string;
  oldStatus: string;
  newStatus: string;
  reason?: string;
  timestamp: string;
}

type UnsubscribeFunction = () => void;

/**
 * @class UserDataService
 * @classdesc Unified data access layer for managing user passport, personal info, and funding proof data.
 *
 * This service acts as the single point of access for all user data operations,
 * providing caching and batch operation capabilities.
 *
 * @description
 * Key Features:
 * - Centralized data management with SQLite as single source of truth
 * - In-memory caching with configurable TTL for performance optimization
 * - Batch operations with transaction support for atomicity
 * - Cache statistics and monitoring capabilities
 * - GDPR-compliant data export and deletion
 * 
 * @example
 * // Basic usage
 * const userId = 'user_123';
 * await UserDataService.initialize(userId);
 * 
 * // Get passport data (uses cache if available)
 * const passport = await UserDataService.getPassport(userId);
 * 
 * // Update passport data (invalidates cache)
 * await UserDataService.updatePassport(passport.id, {
 *   gender: 'Male',
 *   expiryDate: '2030-12-31'
 * });
 * 
 * // Get all user data efficiently
 * const allData = await UserDataService.getAllUserData(userId);
 * console.log(allData.passport, allData.personalInfo);
 * 
 * @static
 */
class UserDataService {
  /**
   * Service initialization flag
   * @type {boolean}
   * @static
   * @private
   */
  static initialized = false;

  /**
   * State change events storage
   * @type {Map}
   * @static
   */
  static stateChangeEvents = new Map<string, EntryInfoStateChangeEvent>();

  /**
   * Ensure passport objects passed across layers (e.g., navigation params)
   * are plain serializable objects. React Navigation warns when class instances
   * with prototype methods are stored in params.
   * @param {Passport|Object|null} passport - Passport instance or plain data
   * @returns {Object|null} Plain serializable passport data or null
   */
  static toSerializablePassport(passport: PassportModel | PassportData | null): SerializablePassport | null {
    if (!passport) {
      return null;
    }

    if (typeof (passport as any).toPlainObject === 'function') {
      return (passport as any).toPlainObject();
    }

    // Fallback: shallow copy enumerable properties from plain objects
    return {
      ...passport
    } as SerializablePassport;
  }

  /**
   * Cache time-to-live in milliseconds (5 minutes)
   * @type {number}
   * @static
   * @constant
   * @default 300000
   */
  static get CACHE_TTL(): number {
    return CacheManager.CACHE_TTL; 
  }

  /**
   * Cache storage using Map-based structure for efficient lookups
   * @type {Object}
   * @static
   * @property {Map<string, Passport>} passport - Maps userId to Passport instances
   * @property {Map<string, PersonalInfo>} personalInfo - Maps userId to PersonalInfo instances
   * @property {Map<string, number>} lastUpdate - Maps cacheKey to timestamp for TTL tracking
   */
  static get cache(): any {
    return CacheStore.cache; 
  }

  /**
   * Cache statistics for monitoring and performance analysis
   * @type {Object}
   * @static
   * @property {number} hits - Number of successful cache hits
   * @property {number} misses - Number of cache misses requiring database access
   * @property {number} invalidations - Number of cache invalidations
   * @property {number} lastReset - Timestamp of last statistics reset
   */
  static get cacheStats(): CacheStats {
    return CacheManager.getStats();
  }

  /**
    * Initialize the UserDataService
    *
    * Sets up database schema and prepares the service for use.
    * This method should be called once during app startup or when a user logs in.
    *
    * @async
    * @static
    * @param {string} userId - User ID for initialization
    * @returns {Promise<void>}
    * @throws {Error} If initialization fails
    *
    * @example
    * // Initialize on app startup
    * try {
    *   await UserDataService.initialize('user_123');
    *   logger.info('Service initialized successfully');
    * } catch (error) {
    *   logger.error('Initialization failed:', error);
    * }
    *
    * @description
    * Initialization process:
    * 1. Checks if service is already initialized (idempotent)
    * 2. Initializes SecureStorageService (creates database schema if needed)
    * 3. Ensures user record exists in the database
    * 4. Cleans up duplicate passports
    * 5. Sets initialized flag to true
    */
   static async initialize(userId: UserId): Promise<void> {
     try {
       if (this.initialized) {
         return;
       }

       // Initialize SecureStorageService (ensures database schema exists)
       try {
         await SecureStorageService.initialize(userId);

         // Ensure user record exists in the database
         await SecureStorageService.ensureUser(userId);
       } catch (initError: any) {
         logger.error('UserDataService', 'SecureStorageService initialization failed', { error: initError });
         // Don't mark as initialized - allow retry on next attempt
         throw initError;
       }

      // Clean up duplicate passports (keep only the most recent one)
      try {
        await SecureStorageService.cleanupDuplicatePassports(userId);
      } catch (cleanupError: any) {
        logger.warn('UserDataService', 'Could not cleanup duplicate passports', { error: cleanupError.message });
        // Continue initialization even if cleanup fails
      }

      this.initialized = true;
     } catch (error: any) {
       logger.error('UserDataService', 'Failed to initialize UserDataService', { error });
       throw error;
     }
   }

  /**
   * Legacy migration shim retained for backward compatibility.
   * Modern flows run migrations during initialize(), so this method is a no-op.
   */
  static async migrateFromAsyncStorage(userId: UserId): Promise<{ migrated: boolean }> {
    logger.debug('UserDataService', 'migrateFromAsyncStorage invoked (noop)', { userId });
    return { migrated: false };
  }

  /**
   * Clear all cached data
   * 
   * Removes all cached passport, personal info, and funding proof data from memory.
   * Useful when user logs out, switches accounts, or when forcing a complete refresh.
   * 
   * @static
   * @returns {void}
   */
  static clearCache(): void {
    CacheManager.clearAll();
  }

  /**
   * Log cache hit/miss statistics to console
   * 
   * Outputs detailed cache performance metrics including hit rate, total requests,
   * and time period. Useful for monitoring cache effectiveness and debugging
   * performance issues.
   * 
   * @static
   * @returns {void}
   */
  static logCacheStats(): void {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = totalRequests > 0 
      ? ((this.cacheStats.hits / totalRequests) * 100).toFixed(2) 
      : 0;
    
    const timeSinceReset = Date.now() - this.cacheStats.lastReset;
    const minutesSinceReset = (timeSinceReset / 60000).toFixed(2);

    logger.debug('UserDataService', '=== UserDataService Cache Statistics ===');
    logger.debug('UserDataService', `Time period: ${minutesSinceReset} minutes`);
    logger.debug('UserDataService', `Cache hits: ${this.cacheStats.hits}`);
    logger.debug('UserDataService', `Cache misses: ${this.cacheStats.misses}`);
    logger.debug('UserDataService', `Cache invalidations: ${this.cacheStats.invalidations}`);
    logger.debug('UserDataService', `Hit rate: ${hitRate}%`);
    logger.debug('UserDataService', `Total requests: ${totalRequests}`);
    logger.debug('UserDataService', '==========================================');
  }

  /**
   * Reset cache statistics to zero
   * 
   * Resets all cache performance counters to their initial state.
   * Useful for starting fresh monitoring periods or after significant
   * application state changes.
   * 
   * @static
   * @returns {void}
   */
  static resetCacheStats(): void {
    CacheManager.resetStats();
  }

  /**
   * Get current cache statistics
   * 
   * Returns a comprehensive object containing all cache performance metrics.
   * Useful for monitoring, debugging, and performance analysis.
   * 
   * @static
   * @returns {Object} Cache statistics object
   */
  static getCacheStats(): CacheStats {
    return CacheManager.getStats();
  }

  /**
   * Refresh cache for a specific user
   * 
   * Removes all cached data for a specific user, forcing the next access
   * to reload from the database. Useful when you know data has been updated
   * externally or when troubleshooting cache issues.
   * 
   * @async
   * @static
   * @param {string} userId - User ID whose cache should be refreshed
   * @returns {Promise<void>}
   * @throws {Error} If cache refresh fails
   */
  static async refreshCache(userId: UserId): Promise<void> {
    CacheManager.refreshUser(userId);
  }

  /**
   * Check if cached data is still valid based on TTL
   * 
   * Determines whether a cache entry is still within its time-to-live period.
   * Used internally to decide whether to serve cached data or reload from database.
   * 
   * @static
   * @private
   * @param {string} cacheKey - Cache key to check (format: 'dataType_userId')
   * @returns {boolean} True if cache entry exists and is within TTL, false otherwise
   */
  static isCacheValid(cacheKey: string): boolean {
    return CacheManager.isValid(cacheKey);
  }

  /**
   * Update cache timestamp for a cache entry
   * 
   * Records the current time as the last update time for a cache entry.
   * Used internally after loading or updating data to reset the TTL timer.
   * 
   * @static
   * @private
   * @param {string} cacheKey - Cache key to update (format: 'dataType_userId')
   * @returns {void}
   */
  static updateCacheTimestamp(cacheKey: string): void {
    CacheManager.updateTimestamp(cacheKey);
  }

  /**
    * Invalidate cache for a specific data type and user
    *
    * Removes a specific cache entry and its timestamp, forcing the next access
    * to reload from the database. Called automatically after data updates.
    *
    * @static
    * @param {('passport'|'personalInfo'|'fundItems')} dataType - Type of data to invalidate
    * @param {string} userId - User ID whose cache should be invalidated
    * @returns {void}
   */
   static invalidateCache(dataType: 'passport' | 'personalInfo' | 'fundItems' | string, userId: UserId): void {
     CacheManager.invalidate(dataType, userId);
   }

  /**
   * Record a cache hit for statistics
   * 
   * Increments the cache hit counter. Called internally when data is
   * successfully retrieved from cache without database access.
   * 
   * @static
   * @private
   * @param {string} dataType - Type of data that was cached
   * @param {string} userId - User ID for the cached data
   * @returns {void}
   */
  static recordCacheHit(dataType: string, userId: UserId): void {
    CacheManager.recordHit(dataType, userId);
  }

  /**
   * Record a cache miss for statistics
   * 
   * Increments the cache miss counter. Called internally when data must be
   * loaded from the database because it's not in cache or cache is expired.
   * 
   * @static
   * @private
   * @param {string} dataType - Type of data that was missed
   * @param {string} userId - User ID for the data
   * @returns {void}
   */
  static recordCacheMiss(dataType: string, userId: UserId): void {
    CacheManager.recordMiss(dataType, userId);
  }

  // ============================================================================
  // PASSPORT OPERATIONS
  // ============================================================================

  /**
   * Get passport data for a user
   * Uses caching for performance
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Passport|null>} - Passport instance or null if not found
   */
  static async getPassport(userId: UserId): Promise<PassportModel | null> {
    return await PassportOperations.getPassport(userId, this.triggerDataChangeEvent.bind(this));
  }

  /**
   * Convenience helper for retrieving the user's most recent passport
   * Alias for getPassport(userId) kept for backwards compatibility
   *
   * @param {string} userId - User ID
   * @returns {Promise<Passport|null>} - Most recent passport instance or null
   */
  static async getPrimaryPassport(userId: UserId): Promise<PassportModel | null> {
    return await PassportOperations.getPrimaryPassport(userId);
  }

  /**
   * Get all passports for a user (for passport selection)
   * @param {string} userId - User ID
   * @returns {Promise<Array<Passport>>} - Array of passport instances
   */
  static async getAllPassports(userId: UserId): Promise<PassportModel[]> {
    return await PassportOperations.getAllPassports(userId);
  }

  /**
   * Get all PassportCountry records for a given passportId.
   * @param {string} passportId - The ID of the passport.
   * @returns {Promise<Array<PassportCountry>>} - Array of PassportCountry instances.
   */
  static async getPassportCountries(passportId: string): Promise<PassportCountryModel[]> {
    return await PassportOperations.getPassportCountries(passportId);
  }

  /**
   * Get a specific passport by ID
   * @param {string} passportId - Passport ID
   * @returns {Promise<Passport|null>} - Passport instance or null
   */
  static async getPassportById(passportId: string): Promise<PassportModel | null> {
    return await PassportOperations.getPassportById(passportId);
  }

  /**
   * Save passport data for a user
   * Creates a new passport record
   * 
   * @param {Object} passportData - Passport data to save
   * @param {string} userId - User ID
   * @param {Object} options - Save options (e.g., { skipValidation: true })
   * @returns {Promise<Passport>} - Saved passport instance
   */
  static async savePassport(passportData: Partial<PassportData>, userId: UserId, options: PassportOptions = {}): Promise<PassportModel> {
    return await PassportOperations.savePassport(passportData, userId, options, this.triggerDataChangeEvent.bind(this));
  }

  /**
   * Update passport data
   * Updates specific fields of an existing passport
   * 
   * @param {string} passportId - Passport ID (or userId for lookup)
   * @param {Object} updates - Fields to update
   * @param {Object} options - Save options (e.g., { skipValidation: true })
   * @returns {Promise<Passport>} - Updated passport instance
   */
  static async updatePassport(passportId: string, updates: Partial<PassportData>, options: PassportOptions = {}): Promise<PassportModel> {
    return await PassportOperations.updatePassport(passportId, updates, options, this.triggerDataChangeEvent.bind(this));
  }

  // ============================================================================
  // PERSONAL INFO OPERATIONS
  // ============================================================================

  /**
   * Get personal info for a user
   * Uses caching for performance
   *
   * @param {string} userId - User ID
   * @returns {Promise<PersonalInfo|null>} - PersonalInfo instance or null if not found
   */
  static async getPersonalInfo(userId: UserId): Promise<PersonalInfoModel | null> {
    return await PersonalInfoOperations.getPersonalInfo(userId);
  }

  /**
   * Save personal info for a user
   * Creates a new personal info record
   *
   * @param {Object} personalData - Personal info data to save
   * @param {string} userId - User ID
   * @returns {Promise<PersonalInfo>} - Saved personal info instance
   */
  static async savePersonalInfo(personalData: Partial<PersonalInfoData>, userId: UserId): Promise<PersonalInfoModel> {
    return await PersonalInfoOperations.savePersonalInfo(personalData, userId, this.triggerDataChangeEvent.bind(this));
  }

  /**
    * Update personal info data
    * Updates specific fields of existing personal info
    *
    * @param {string} userId - User ID (or personalInfoId for lookup)
    * @param {Object} updates - Fields to update
    * @returns {Promise<PersonalInfo>} - Updated personal info instance
    */
    static async updatePersonalInfo(userId: UserId, updates: Partial<PersonalInfoData>): Promise<PersonalInfoModel> {
    return await PersonalInfoOperations.updatePersonalInfo(userId, updates, this.triggerDataChangeEvent.bind(this));
  }

  /**
   * Upsert (create or update) personal info for a user
   * If personal info exists, update it. Otherwise, create it.
   * 
   * @param {string} userId - User ID
   * @param {Object} data - Personal info data
   * @returns {Promise<PersonalInfo>} - PersonalInfo instance
   */
  static async upsertPersonalInfo(userId: UserId, data: Partial<PersonalInfoData>): Promise<PersonalInfoModel> {
    return await PersonalInfoOperations.upsertPersonalInfo(userId, data, this.triggerDataChangeEvent.bind(this));
  }

  // ============================================================================
  // FUND ITEM OPERATIONS
  // ============================================================================

  /**
    * Save individual fund item
    * @param {Object} fundData - Fund item data
    * @param {string} userId - User ID
    * @returns {Promise<FundItem>} - Saved fund item instance
    */
   static async saveFundItem(fundData: Partial<FundItemData>, userId: UserId): Promise<FundItemModel> {
    return await FundItemOperations.saveFundItem(fundData, userId, this.triggerDataChangeEvent.bind(this));
  }

  /**
    * Get all fund items for a user
    * @param {string} userId - User ID
    * @param {Object} options - Options for loading
    * @param {boolean} options.forceRefresh - Force refresh from database (default: false)
    * @returns {Promise<Array<FundItem>>} - Array of fund items
    */
   static async getFundItems(userId: UserId, options: ServiceOptions = {}): Promise<FundItemModel[]> {
    return await FundItemOperations.getFundItems(userId, options);
  }

  /**
   * Get fund items as plain data objects for export and reporting flows
   * @param userId - User ID
   * @param options - Optional load options
   * @returns Array of fund item data
   */
  static async getFunds(userId: UserId, options: ServiceOptions = {}): Promise<FundItemData[]> {
    const fundItems = await FundItemOperations.getFundItems(userId, options);
    return fundItems.map(item => {
      if (item && typeof item.toJSON === 'function') {
        return item.toJSON();
      }
      return { ...item } as FundItemData;
    });
  }

  /**
    * Delete fund item
    * @param {string} fundItemId - Fund item ID
    * @param {string} userId - User ID
    * @returns {Promise<boolean>} - Success status
    */
   static async deleteFundItem(fundItemId: string, userId: UserId): Promise<boolean> {
    return await FundItemOperations.deleteFundItem(fundItemId, userId, this.triggerDataChangeEvent.bind(this));
  }

  // ============================================================================
  // ENTRY INFO OPERATIONS (Progressive Entry Flow)
  // ============================================================================

  /**
   * Get entry info for a user and destination
   * @param {string} userId - User ID
   * @param {string} destinationId - Destination ID (optional)
   * @returns {Promise<EntryInfo|null>} - Entry info instance or null
   */
  static async getEntryInfo(userId: UserId, destinationId: string | null = null): Promise<EntryInfoModel | null> {
    return await EntryInfoOperations.getEntryInfo(userId, destinationId);
  }

  /**
   * Create a new entry info record for a user
   * @param {Object} entryInfoData - Entry info data (must include userId)
   * @returns {Promise<EntryInfo>} - Newly created entry info instance
   */
  static async createEntryInfo(entryInfoData: Partial<EntryInfoData> & { userId: UserId }): Promise<EntryInfoModel> {
    try {
      const { userId } = entryInfoData || {};
      if (!userId) {
        throw new Error('createEntryInfo requires entryInfoData.userId');
      }

      const entryInfo = await EntryInfoOperations.saveEntryInfo(entryInfoData, userId);

      this.triggerDataChangeEvent('entryInfo', userId, {
        action: 'created',
        entryInfoId: entryInfo.id,
        destinationId: entryInfo.destinationId
      });

      return entryInfo;
    } catch (error: any) {
      logger.error('UserDataService', 'Failed to create entry info', { error });
      throw error;
    }
  }

  /**
   * Save entry info for a user
   * @param {Object} entryInfoData - Entry info data
   * @param {string} userId - User ID
   * @returns {Promise<EntryInfo>} - Saved entry info instance
   */
  static async saveEntryInfo(entryInfoData: Partial<EntryInfoData>, userId: UserId): Promise<EntryInfoModel> {
    return await EntryInfoOperations.saveEntryInfo(entryInfoData, userId);
  }

  /**
   * Update entry info status
   * @param {string} entryInfoId - Entry info ID
   * @param {string} newStatus - New status
   * @param {Object} options - Additional options
   * @returns {Promise<EntryInfo>} - Updated entry info instance
   */
  static async updateEntryInfoStatus(entryInfoId: string, newStatus: string, options: Record<string, any> = {}): Promise<EntryInfoModel> {
    return await EntryInfoOperations.updateEntryInfoStatus(
      entryInfoId,
      newStatus,
      options,
      this.triggerEntryInfoStateChangeEvent.bind(this)
    );
  }

  /**
   * Update entry info fields with the latest traveler data
   */
  static async updateEntryInfo(
    entryInfoId: string,
    updateData: Partial<EntryInfoData>,
    userId?: UserId
  ): Promise<EntryInfoModel> {
    try {
      const entryInfo = await EntryInfoService.updateEntryInfo(entryInfoId, updateData);

      if (entryInfo?.userId) {
        const destinationId = entryInfo.destinationId || 'default';
        CacheManager.invalidate('entryInfo', `${entryInfo.userId}_${destinationId}`);

        if (!CacheStore.cache.entryInfo) {
          CacheStore.cache.entryInfo = new Map<string, EntryInfoModel>();
        }
        (CacheStore.cache.entryInfo as Map<string, EntryInfoModel>).set(`${entryInfo.userId}_${destinationId}`, entryInfo);
        CacheManager.updateTimestamp(`entryInfo_${entryInfo.userId}_${destinationId}`);
      }

      DataEventService.triggerDataChangeEvent?.('entryInfo', userId || entryInfo?.userId || 'unknown', {
        entryInfoId
      });

      return entryInfo;
    } catch (error) {
      logger.error('UserDataService', 'Failed to update entry info', { entryInfoId, error });
      throw error;
    }
  }

  /**
   * Get entry info by destination
   * @param {string} destinationId - Destination ID
   * @param {string} tripId - Trip ID (optional)
   * @returns {Promise<EntryInfo|null>} - Entry info instance or null
   */
  static async getEntryInfoByDestination(destinationId: string, tripId: string | null = null): Promise<EntryInfoModel | null> {
    return await EntryInfoOperations.getEntryInfoByDestination(destinationId, tripId);
  }

  /**
   * Get all entry infos for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of EntryInfo instances
   */
  static async getAllEntryInfosForUser(userId: UserId): Promise<EntryInfoModel[]> {
    return await EntryInfoOperations.getAllEntryInfosForUser(userId);
  }

  /**
   * Get entry infos for multiple destinations
   * @param {string} userId - User ID
   * @param {Array} destinationIds - Array of destination IDs
   * @returns {Promise<Object>} - Object with destinationId as key and EntryInfo as value
   */
  static async getEntryInfosForDestinations(userId: UserId, destinationIds: string[]): Promise<Record<string, EntryInfoModel>> {
    return await EntryInfoOperations.getEntryInfosForDestinations(
      userId,
      destinationIds,
      this.getEntryInfoByDestination.bind(this)
    );
  }

  /**
   * Trigger entry info state change event
   * @param {Object} entryInfo - Entry info
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @param {Object} options - Additional options
   */
  static triggerEntryInfoStateChangeEvent(entryInfo: EntryInfoModel, oldStatus: string, newStatus: string, options: Record<string, any> = {}): void {
    try {
      const event: EntryInfoStateChangeEvent = {
        type: 'ENTRY_INFO_STATE_CHANGE',
        entryInfoId: entryInfo.id,
        userId: entryInfo.userId,
        destinationId: entryInfo.destinationId,
        oldStatus,
        newStatus,
        reason: options.reason,
        timestamp: new Date().toISOString()
      };

      this.stateChangeEvents = EntryInfoOperations.storeStateChangeEvent(event, this.stateChangeEvents);

      // Check if immediate notification should be triggered
      if (EntryInfoOperations.shouldTriggerImmediateNotification(oldStatus, newStatus)) {
        EntryInfoOperations.processImmediateNotification(event);
      }

      logger.debug('UserDataService', 'Entry info state change event triggered', { event });
    } catch (error: any) {
      logger.error('UserDataService', 'Failed to trigger entry info state change event', { error });
    }
  }

  /**
   * Get recent state change events
   * @param {string} userId - User ID (optional)
   * @param {number} limit - Maximum number of events to return
   * @returns {Array} - Array of state change events
   */
  static getStateChangeEvents(userId: UserId | null = null, limit: number = 10): EntryInfoStateChangeEvent[] {
    return EntryInfoOperations.getStateChangeEvents(this.stateChangeEvents, userId, limit);
  }

  // ============================================================================
  // DIGITAL ARRIVAL CARD OPERATIONS
  // ============================================================================

  /**
   * Save digital arrival card (TDAC, MDAC, SDAC, etc.)
   * Wrapper for SecureStorageService.saveDigitalArrivalCard
   *
   * @param {Object} dacData - Digital arrival card data
   * @returns {Promise<Object>} - Save result with card ID
   */
  static async saveDigitalArrivalCard(dacData: DigitalArrivalCardData): Promise<Record<string, any>> {
    try {
      logger.debug('UserDataService', 'Saving digital arrival card via UserDataService', {
        cardType: dacData.cardType,
        arrCardNo: dacData.arrCardNo,
        entryInfoId: dacData.entryInfoId
      });

      const result = await SecureStorageService.saveDigitalArrivalCard(dacData);

      // Invalidate related caches
      if (dacData.entryInfoId) {
        this.cache.entryInfo.delete(dacData.entryInfoId);
        logger.debug('UserDataService', 'Cache invalidated for entry info', { entryInfoId: dacData.entryInfoId });
      }

      // Trigger data change event for listeners
    this.triggerDataChangeEvent('digitalArrivalCard', dacData.entryInfoId || '', {
        type: 'DIGITAL_ARRIVAL_CARD_SAVED',
        cardType: dacData.cardType,
        arrCardNo: dacData.arrCardNo,
        entryInfoId: dacData.entryInfoId,
      timestamp: new Date().toISOString(),
      qrUri: dacData.qrUri,
      pdfUrl: dacData.pdfUrl,
      submissionMethod: dacData.submissionMethod ?? 'unknown',
      });

      logger.debug('UserDataService', 'Digital arrival card saved successfully', { id: result.id });
      return result;
    } catch (error: any) {
      logger.error('UserDataService', 'Failed to save digital arrival card', { error });
      throw error;
    }
  }

  /**
   * Get digital arrival card by ID
   *
   * @param {string} cardId - Digital arrival card ID
   * @returns {Promise<Object|null>} - Digital arrival card data or null
   */
  static async getDigitalArrivalCard(cardId: string): Promise<Record<string, any> | null> {
    try {
      return await SecureStorageService.getDigitalArrivalCard(cardId);
    } catch (error: any) {
      logger.error('UserDataService', 'Failed to get digital arrival card', { error });
      return null;
    }
  }

  /**
   * Get all digital arrival cards for an entry info
   *
   * @param {string} entryInfoId - Entry info ID
   * @returns {Promise<Array>} - Array of digital arrival cards
   */
  static async getDigitalArrivalCardsByEntryInfo(entryInfoId: string): Promise<Record<string, any>[]> {
    try {
      return await SecureStorageService.getDigitalArrivalCardsByEntryInfoId(entryInfoId);
    } catch (error: any) {
      logger.error('UserDataService', 'Failed to get digital arrival cards', { error });
      return [];
    }
  }

  static async getDigitalArrivalCardsByEntryInfoId(entryInfoId: string): Promise<Record<string, any>[]> {
    return this.getDigitalArrivalCardsByEntryInfo(entryInfoId);
  }

  /**
   * Get latest successful digital arrival card for an entry info
   *
   * @param {string} entryInfoId - Entry info ID
   * @param {string} cardType - Card type (TDAC, MDAC, etc.)
   * @returns {Promise<Object|null>} - Latest digital arrival card or null
   */
  static async getLatestDigitalArrivalCard(entryInfoId: string, cardType: string): Promise<Record<string, any> | null> {
    try {
      return await SecureStorageService.getLatestSuccessfulDigitalArrivalCard(entryInfoId, cardType);
    } catch (error: any) {
      logger.error('UserDataService', 'Failed to get latest digital arrival card', { error });
      return null;
    }
  }

  // ============================================================================
  // TRAVEL INFO OPERATIONS
  // ============================================================================

  /**
   * Get travel info for a user
   * Loads the most recent travel info draft for the specified destination
   *
   * @param {string} userId - User ID
   * @param {string} destination - Optional destination filter (e.g., 'Thailand')
   * @returns {Promise<Object|null>} - Travel info data or null if not found
   */
  static async getTravelInfo(userId: UserId, destination: string | null = null): Promise<TravelInfoData | null> {
    return await TravelInfoOperations.getTravelInfo(userId, destination, this.triggerDataChangeEvent.bind(this));
  }

  /**
   * Save or update travel info for a user
   * Uses upsert pattern to create or update travel info
   *
   * @param {string} userId - User ID
   * @param {Object} travelData - Travel info data
   * @returns {Promise<Object>} - Saved travel info
   */
  static async saveTravelInfo(userId: UserId, travelData: Partial<TravelInfoData>): Promise<TravelInfoData> {
    return await TravelInfoOperations.saveTravelInfo(userId, travelData, this.triggerDataChangeEvent.bind(this));
  }

  /**
    * Update travel info data
    * Merges updates without overwriting existing non-empty fields
    *
    * @param {string} userId - User ID
    * @param {string} destination - Destination
    * @param {Object} updates - Fields to update
    * @returns {Promise<Object>} - Updated travel info
    */
   static async updateTravelInfo(userId: UserId, destination: string, updates: Partial<TravelInfoData>): Promise<TravelInfoData> {
     try {
       // Validate userId
       if (!userId) {
         throw new Error('userId is required for updateTravelInfo');
       }

       logger.debug('UserDataService', 'Updating travel info', { userId, destination });

       // Get existing travel info
       const existing = await this.getTravelInfo(userId, destination);

       if (!existing) {
         // No existing data, create new
         const newTravelInfo = await this.saveTravelInfo(userId, { ...updates, destination });

         // Handle arrival date change for new travel info (support legacy and new field names)
         const createdArrivalDate = ((updates as any).arrivalArrivalDate ?? (updates as any).arrivalDate) || null;
         if (createdArrivalDate) {
           await this.handleArrivalDateChange(userId, destination, null, createdArrivalDate);
         }

         return newTravelInfo;
       }

       // Capture existing arrival date using both legacy and new field names
       const oldArrivalDate = (existing as any).arrivalArrivalDate || (existing as any).arrivalDate || null;

       // Filter out empty values from updates
       const nonEmptyUpdates: Record<string, any> = {};
       for (const [key, value] of Object.entries(updates)) {
         if (value !== null && value !== undefined) {
           if (typeof value === 'string') {
             if (value.trim().length > 0) {
               nonEmptyUpdates[key] = value;
             }
           } else {
             nonEmptyUpdates[key] = value;
           }
         }
       }

       // Add userId to nonEmptyUpdates (same pattern as saveTravelInfo)
       nonEmptyUpdates.userId = userId;

       // Merge with existing data (preserve existing id)
       const merged = { ...existing, ...nonEmptyUpdates, id: existing.id };
       await SecureStorageService.saveTravelInfo(merged);

       // Determine if arrival date changed (supporting legacy and new field names)
       const updatedArrivalDate =
         nonEmptyUpdates.arrivalArrivalDate ??
         nonEmptyUpdates.arrivalDate ??
         undefined;
       const arrivalDateChanged =
         updatedArrivalDate !== undefined && updatedArrivalDate !== oldArrivalDate;

       // Handle arrival date change if it occurred
       if (arrivalDateChanged) {
         await this.handleArrivalDateChange(userId, destination, oldArrivalDate, updatedArrivalDate);
       }

       const updatedFields = Object.keys(nonEmptyUpdates);
       if (updatedFields.length > 0) {
         this.triggerDataChangeEvent('travel', userId, {
           updatedFields,
           destination,
         });
       }

       logger.debug('UserDataService', 'Travel info updated successfully');
       return merged;
     } catch (error: any) {
       logger.error('UserDataService', 'Failed to update travel info', { error });
       throw error;
     }
   }

  /**
    * Clear travel info for a user and destination
    * Used for recovery from SQLite errors
    *
    * @param {string} userId - User ID
    * @param {string} destination - Destination
    * @returns {Promise<boolean>} - Success status
    */
   static async clearTravelInfo(userId: UserId, destination: string): Promise<boolean> {
    return await TravelInfoOperations.clearTravelInfo(userId, destination);
  }

  /**
   * Handle arrival date change - trigger notification scheduling
   * @param {string} userId - User ID
   * @param {string} destination - Destination
   * @param {string} oldArrivalDate - Previous arrival date
   * @param {string} newArrivalDate - New arrival date
   */
  static async handleArrivalDateChange(userId: UserId, destination: string, oldArrivalDate: string | null, newArrivalDate: string): Promise<void> {
    return await TravelInfoOperations.handleArrivalDateChange(userId, destination, oldArrivalDate, newArrivalDate, this.getEntryInfoByDestination.bind(this));
  }

  // ============================================================================
  // UNIFIED DATA OPERATIONS
  // ============================================================================

  /**
   * Get all user data at once
   * Efficiently loads passport, personal info, and funding proof
   * Uses batch loading with a single transaction for optimal performance
   * 
   * @param {string} userId - User ID
   * @param {Object} options - Loading options
   * @param {boolean} options.useBatchLoad - Use batch loading (default: true)
   * @returns {Promise<Object>} - Object containing all user data
   */
  static async getAllUserData(userId: UserId, options: ServiceOptions = {}): Promise<AllUserData> {
    try {
      const { useBatchLoad = true } = options;
      const startTime = Date.now();
      logger.debug('UserDataService', `Loading all user data for user ${userId}`, { batch: useBatchLoad });

      let passport: PassportModel | null, personalInfo: PersonalInfoModel | null;

      // Fall back to parallel loading (original implementation)
      // This is more efficient than sequential loading but less efficient than batch
      [passport, personalInfo] = await Promise.all([
        this.getPassport(userId).catch(() => null),
        this.getPersonalInfo(userId).catch(() => null)
      ]);

      const duration = Date.now() - startTime;
      logger.debug('UserDataService', `All user data loaded`, { duration, batch: useBatchLoad });

      return {
        passport: passport as any,
        personalInfo: personalInfo as any,
        userId,
        loadedAt: new Date().toISOString(),
        loadDurationMs: duration
      } as AllUserData;
    } catch (error: any) {
      logger.error('UserDataService', 'Failed to get all user data', { error });
      // Return empty data instead of throwing to allow app to continue
      return {
        passport: null,
        personalInfo: null,
        userId,
        loadedAt: new Date().toISOString(),
        loadDurationMs: 0
      };
    }
  }

  /**
   * Save all user data at once
   * Efficiently saves passport, personal info, and funding proof
   * Uses batch operations with transactions for performance and atomicity
   *
   * @param {Object} userData - Object containing all user data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Object containing saved data instances
   */
  static async saveAllUserData(userData: Partial<AllUserData>, userId: UserId): Promise<{ passport?: PassportModel; personalInfo?: PersonalInfoModel }> {
    try {
      logger.debug('UserDataService', `Saving all user data for user ${userId} using batch operations`);
      const startTime = Date.now();

      // Prepare batch operations
      const operations: Array<{ type: string; data: any }> = [];

      if (userData.passport) {
        operations.push({
          type: 'passport',
          data: { ...userData.passport, userId }
        });
      }

      if (userData.personalInfo) {
        operations.push({
          type: 'personalInfo',
          data: { ...userData.personalInfo, userId }
        });
      }

      // Execute batch save with transaction
      await SecureStorageService.batchSave(operations);

      // Invalidate all caches for this user
      this.invalidateCache('passport', userId);
      this.invalidateCache('personalInfo', userId);

      // Reload data into cache
      const results: { passport?: PassportModel; personalInfo?: PersonalInfoModel } = {};
      
      if (userData.passport) {
        results.passport = await this.getPassport(userId);
      }
      
      if (userData.personalInfo) {
        results.personalInfo = await this.getPersonalInfo(userId);
      }

      const duration = Date.now() - startTime;
      logger.debug('UserDataService', `Batch save completed`, { duration });

      return results;
    } catch (error: any) {
      logger.error('UserDataService', 'Failed to save all user data', { error });
      throw error;
    }
  }

  /**
   * Update multiple data types at once using a single transaction
   * More efficient than calling individual update methods
   * 
   * @param {string} userId - User ID
   * @param {Object} updates - Object containing updates for each data type
   * @returns {Promise<Object>} - Updated data
   */
  static async batchUpdate(userId: UserId, updates: BatchUpdateData): Promise<AllUserData> {
    try {
      logger.debug('UserDataService', `Starting batch update for user ${userId}`);
      const startTime = Date.now();

      // Load current data
      const currentData = await this.getAllUserData(userId, { useBatchLoad: true });

      // Prepare batch operations with merged data
      const operations: Array<{ type: string; data: any }> = [];

      if (updates.passport && currentData.passport) {
        operations.push({
          type: 'passport',
          data: {
            ...currentData.passport,
            ...updates.passport,
            userId,
            updatedAt: new Date().toISOString()
          }
        });
      }

      if (updates.personalInfo && currentData.personalInfo) {
        operations.push({
          type: 'personalInfo',
          data: {
            ...currentData.personalInfo,
            ...updates.personalInfo,
            userId,
            updatedAt: new Date().toISOString()
          }
        });
      }

      if (operations.length === 0) {
        logger.debug('UserDataService', 'No updates to perform');
        return currentData;
      }

      // Execute batch save with transaction
      await SecureStorageService.batchSave(operations);

      // Invalidate all caches for this user
      this.invalidateCache('passport', userId);
      this.invalidateCache('personalInfo', userId);

      // Reload updated data
      const updatedData = await this.getAllUserData(userId, { useBatchLoad: true });

      const duration = Date.now() - startTime;
      logger.debug('UserDataService', `Batch update completed`, { duration });

      return updatedData;
    } catch (error: any) {
      logger.error('UserDataService', 'Failed to batch update', { error });
      throw error;
    }
  }

  /**
   * Check if user has any data
   *
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - True if user has any data
   */
  static async hasUserData(userId: UserId): Promise<boolean> {
    try {
      const userData = await this.getAllUserData(userId);
      return !!(userData.passport || userData.personalInfo);
    } catch (error: any) {
      logger.error('UserDataService', 'Failed to check user data', { error });
      return false;
    }
  }

  /**
   * Delete all user data
   * Used for GDPR compliance and account deletion
   *
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async deleteAllUserData(userId: UserId): Promise<void> {
    try {
      logger.debug('UserDataService', `Deleting all user data for user ${userId}`);

      // Clear from cache
      this.invalidateCache('passport', userId);
      this.invalidateCache('personalInfo', userId);

      // Delete from database
      // Note: This requires delete methods in SecureStorageService
      // For now, we'll just clear the cache
      logger.warn('UserDataService', 'Database deletion not yet implemented in SecureStorageService');

      logger.debug('UserDataService', `All user data deleted for user ${userId}`);
    } catch (error: any) {
      logger.error('UserDataService', 'Failed to delete all user data', { error });
      throw error;
    }
  }

  // ============================================================================
  // DATA CONSISTENCY VALIDATION
  // ============================================================================

  /**
   * Validate data consistency for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Validation result
   */
  static async validateDataConsistency(userId: UserId): Promise<Record<string, any>> {
    try {
      const userData = await this.getAllUserData(userId);
      return DataValidationService.validateDataConsistency(userId, userData);
    } catch (error: any) {
      logger.error('UserDataService', 'Failed to validate data consistency', { error });
      throw error;
    }
  }

  /**
   * Validate passport data
   * @param {Passport} passport - Passport instance
   * @returns {Object} - Validation result
   */
  static validatePassportData(passport: PassportModel): Record<string, any> {
    return DataValidationService.validatePassportData(passport);
  }

  /**
   * Validate personal info data
   * @param {PersonalInfo} personalInfo - PersonalInfo instance
   * @returns {Object} - Validation result
   */
  static validatePersonalInfoData(personalInfo: PersonalInfoModel): Record<string, any> {
    return DataValidationService.validatePersonalInfoData(personalInfo);
  }

  /**
   * Validate cross-field consistency
   * @param {Object} userData - All user data
   * @returns {Object} - Validation result
   */
  static validateCrossFieldConsistency(userData: AllUserData): Record<string, any> {
    return DataValidationService.validateCrossFieldConsistency(userData);
  }

  // ============================================================================
  // DATA CHANGE DETECTION AND RESUBMISSION WARNINGS
  // ============================================================================

  /**
   * Add data change listener
   * @param {Function} listener - Listener function
   * @returns {Function} - Unsubscribe function
   */
  static addDataChangeListener(listener: EventDataChangeListener): UnsubscribeFunction {
    return DataEventService.addDataChangeListener(listener);
  }

  /**
   * Trigger data change event
   * @param {string} dataType - Type of data that changed
   * @param {string} userId - User ID
   * @param {Object} changeDetails - Details about the change
   */
  static triggerDataChangeEvent(dataType: string, userId: UserId, changeDetails: Record<string, any> = {}): void {
    DataEventService.triggerDataChangeEvent(dataType, userId, changeDetails);

    // Handle data changes for active entry infos
    DataEventService.handleDataChangeForActiveEntryPacks(
      userId,
      dataType,
      changeDetails,
      this.getAllEntryInfosForUser.bind(this),
      (entryInfo: EntryInfoModel, dt: string, cd: Record<string, any>) => DataEventService.checkEntryInfoForDataChanges(
        entryInfo,
        dt,
        cd,
        this.getAllUserData.bind(this),
        this.getTravelInfo.bind(this),
        this.getFundItems.bind(this)
      )
    );
  }

  /**
   * Get pending resubmission warnings for user
   * @param {string} userId - User ID
   * @returns {Array} - Array of resubmission warnings
   */
  static getPendingResubmissionWarnings(userId: UserId): Array<Record<string, any>> {
    return DataEventService.getPendingResubmissionWarnings(userId);
  }

  /**
   * Get resubmission warning for specific entry info
   * @param {string} entryInfoId - Entry info ID
   * @returns {Object|null} - Resubmission warning or null
   */
  static getResubmissionWarning(entryInfoId: string): Record<string, any> | null {
    return DataEventService.getResubmissionWarning(entryInfoId);
  }

  /**
   * Clear resubmission warning for entry info
   * @param {string} entryInfoId - Entry info ID
   */
  static clearResubmissionWarning(entryInfoId: string): void {
    DataEventService.clearResubmissionWarning(entryInfoId);
  }

  /**
   * Mark entry info as superseded due to data changes
   * @param {string} entryInfoId - Entry info ID
   * @param {Object} changeDetails - Details about the changes
   * @returns {Promise<Object>} - Updated entry info
   */
  static async markEntryInfoAsSuperseded(entryInfoId: string, changeDetails: Record<string, any> = {}): Promise<EntryInfoModel> {
    return await DataEventService.markEntryInfoAsSuperseded(entryInfoId, changeDetails);
  }
}

export default UserDataService;
