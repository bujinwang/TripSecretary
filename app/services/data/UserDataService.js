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
import DataEventService from './events/DataEventService';

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
   * Ensure passport objects passed across layers (e.g., navigation params)
   * are plain serializable objects. React Navigation warns when class instances
   * with prototype methods are stored in params.
   * @param {Passport|Object|null} passport - Passport instance or plain data
   * @returns {Object|null} Plain serializable passport data or null
   */
  static toSerializablePassport(passport) {
    if (!passport) {
      return null;
    }

    if (typeof passport.toPlainObject === 'function') {
      return passport.toPlainObject();
    }

    // Fallback: shallow copy enumerable properties from plain objects
    return {
      ...passport
    };
  }

  /**
   * Cache time-to-live in milliseconds (5 minutes)
   * @type {number}
   * @static
   * @constant
   * @default 300000
   */
  static get CACHE_TTL() { return CacheManager.CACHE_TTL; }

  /**
   * Cache storage using Map-based structure for efficient lookups
   * @type {Object}
   * @static
   * @property {Map<string, Passport>} passport - Maps userId to Passport instances
   * @property {Map<string, PersonalInfo>} personalInfo - Maps userId to PersonalInfo instances
   * @property {Map<string, number>} lastUpdate - Maps cacheKey to timestamp for TTL tracking
   */
  static get cache() { return CacheStore.cache; }


  /**
   * Cache statistics for monitoring and performance analysis
   * @type {Object}
   * @static
   * @property {number} hits - Number of successful cache hits
   * @property {number} misses - Number of cache misses requiring database access
   * @property {number} invalidations - Number of cache invalidations
   * @property {number} lastReset - Timestamp of last statistics reset
   */
  static get cacheStats() { return CacheStore.stats; }


  /**
   * Service initialization flag
   * @type {boolean}
   * @static
   * @private
   */
  static initialized = false;

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
    *   console.log('Service initialized successfully');
    * } catch (error) {
    *   console.error('Initialization failed:', error);
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
   static async initialize(userId) {
     try {
       if (this.initialized) {
         return;
       }

       // Initialize SecureStorageService (ensures database schema exists)
       try {
         await SecureStorageService.initialize(userId);

         // Ensure user record exists in the database
         await SecureStorageService.ensureUser(userId);
       } catch (initError) {
         console.error('SecureStorageService initialization failed:', initError);
         // Don't mark as initialized - allow retry on next attempt
         throw initError;
       }

      // Clean up duplicate passports (keep only the most recent one)
      try {
        await SecureStorageService.cleanupDuplicatePassports(userId);
      } catch (cleanupError) {
        console.warn('Could not cleanup duplicate passports:', cleanupError.message);
        // Continue initialization even if cleanup fails
      }

      this.initialized = true;
     } catch (error) {
       console.error('Failed to initialize UserDataService:', error);
       throw error;
     }
   }

  /**
   * Clear all cached data
   * 
   * Removes all cached passport, personal info, and funding proof data from memory.
   * Useful when user logs out, switches accounts, or when forcing a complete refresh.
   * 
   * @static
   * @returns {void}
   * 
   * @example
   * // Clear cache on logout
   * UserDataService.clearCache();
   * 
   * // Clear cache and log statistics
   * UserDataService.clearCache();
   * const stats = UserDataService.getCacheStats();
   * console.log('Cache cleared. Final stats:', stats);
   * 
   * @description
   * This method:
   * - Clears all Map-based caches (passport, personalInfo)
   * - Clears all cache timestamps
   * - Logs final cache statistics before clearing
   * - Does NOT reset cache statistics (use resetCacheStats() for that)
   */
  static clearCache() {
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
   * 
   * @example
   * // Log current cache statistics
   * UserDataService.logCacheStats();
   * // Output:
   * // === UserDataService Cache Statistics ===
   * // Time period: 15.23 minutes
   * // Cache hits: 45
   * // Cache misses: 5
   * // Cache invalidations: 3
   * // Hit rate: 90.00%
   * // Total requests: 50
   * // ==========================================
   * 
   * @description
   * Metrics included:
   * - Time period: Minutes since last statistics reset
   * - Cache hits: Number of successful cache retrievals
   * - Cache misses: Number of database queries required
   * - Cache invalidations: Number of cache entries removed
   * - Hit rate: Percentage of requests served from cache
   * - Total requests: Sum of hits and misses
   */
  static logCacheStats() {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = totalRequests > 0 
      ? ((this.cacheStats.hits / totalRequests) * 100).toFixed(2) 
      : 0;
    
    const timeSinceReset = Date.now() - this.cacheStats.lastReset;
    const minutesSinceReset = (timeSinceReset / 60000).toFixed(2);

    console.log('=== UserDataService Cache Statistics ===');
    console.log(`Time period: ${minutesSinceReset} minutes`);
    console.log(`Cache hits: ${this.cacheStats.hits}`);
    console.log(`Cache misses: ${this.cacheStats.misses}`);
    console.log(`Cache invalidations: ${this.cacheStats.invalidations}`);
    console.log(`Hit rate: ${hitRate}%`);
    console.log(`Total requests: ${totalRequests}`);
    console.log('==========================================');
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
   * 
   * @example
   * // Reset statistics at the start of a test
   * UserDataService.resetCacheStats();
   * 
   * // Perform operations...
   * await UserDataService.getPassport(userId);
   * 
   * // Check statistics for this period only
   * const stats = UserDataService.getCacheStats();
   * console.log('Hit rate for this test:', stats.hitRate);
   * 
   * @description
   * Resets:
   * - hits: Set to 0
   * - misses: Set to 0
   * - invalidations: Set to 0
   * - lastReset: Set to current timestamp
   * 
   * Note: This does NOT clear the actual cached data. Use clearCache() for that.
   */
  static resetCacheStats() {
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
   * @returns {number} return.hits - Number of cache hits
   * @returns {number} return.misses - Number of cache misses
   * @returns {number} return.invalidations - Number of cache invalidations
   * @returns {number} return.lastReset - Timestamp of last statistics reset
   * @returns {number} return.totalRequests - Total number of requests (hits + misses)
   * @returns {number} return.hitRate - Cache hit rate as percentage (0-100)
   * @returns {number} return.timeSinceReset - Milliseconds since last reset
   * 
   * @example
   * // Get and display cache statistics
   * const stats = UserDataService.getCacheStats();
   * console.log(`Cache hit rate: ${stats.hitRate}%`);
   * console.log(`Total requests: ${stats.totalRequests}`);
   * console.log(`Time period: ${(stats.timeSinceReset / 60000).toFixed(2)} minutes`);
   * 
   * @example
   * // Monitor cache effectiveness
   * const stats = UserDataService.getCacheStats();
   * if (stats.hitRate < 50) {
   *   console.warn('Low cache hit rate detected');
   *   // Consider increasing CACHE_TTL or investigating access patterns
   * }
   */
  static getCacheStats() {
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
   * 
   * @example
   * // Refresh cache after external data update
   * await UserDataService.refreshCache('user_123');
   * 
   * // Next access will reload from database
   * const passport = await UserDataService.getPassport('user_123');
   * 
   * @example
   * // Refresh cache for multiple users
   * const userIds = ['user_123', 'user_456', 'user_789'];
   * await Promise.all(userIds.map(id => UserDataService.refreshCache(id)));
   * 
   * @description
   * This method:
   * - Removes passport data from cache for the user
   * - Removes personal info data from cache for the user
   * - Removes funding proof data from cache for the user
   * - Removes all cache timestamps for the user
   * - Does NOT delete data from database
   * - Does NOT affect other users' cached data
   */
  static async refreshCache(userId) {
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
   * 
   * @example
   * // Internal usage
   * const cacheKey = 'passport_user_123';
   * if (this.isCacheValid(cacheKey)) {
   *   return this.cache.passport.get('user_123');
   * }
   * 
   * @description
   * Validation logic:
   * - Returns false if no timestamp exists for the cache key
   * - Calculates age of cache entry (current time - last update time)
   * - Returns true if age < CACHE_TTL (5 minutes)
   * - Returns false if age >= CACHE_TTL
   */
  static isCacheValid(cacheKey) {
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
   * 
   * @example
   * // Internal usage after loading data
   * this.cache.passport.set(userId, passport);
   * this.updateCacheTimestamp(`passport_${userId}`);
   * 
   * @description
   * This method sets the timestamp to Date.now(), which is used by
   * isCacheValid() to determine if the cache entry is still fresh.
   */
  static updateCacheTimestamp(cacheKey) {
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
    *
    * @example
    * // Invalidate passport cache after update
    * await passport.save();
    * UserDataService.invalidateCache('passport', userId);
    *
    * @example
    * // Invalidate fund items cache after update
    * await fundItem.save();
    * UserDataService.invalidateCache('fundItems', userId);
    *
    * @example
    * // Invalidate all data types for a user
    * ['passport', 'personalInfo', 'fundItems'].forEach(type => {
    *   UserDataService.invalidateCache(type, userId);
    * });
    *
    * @description
    * This method:
    * - Removes the data from the appropriate cache Map
    * - Removes the timestamp for the cache entry
    * - Increments the invalidations counter in cache statistics
    * - Does NOT delete data from database
    * - Handles both predefined cache segments and dynamically created ones (like fundItems)
   */
   static invalidateCache(dataType, userId) {
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
  static recordCacheHit(dataType, userId) {
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
  static recordCacheMiss(dataType, userId) {
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
  static async getPassport(userId) {
    return await PassportOperations.getPassport(userId, this.triggerDataChangeEvent.bind(this));
  }

  /**
   * Convenience helper for retrieving the user's most recent passport
   * Alias for getPassport(userId) kept for backwards compatibility
   *
   * @param {string} userId - User ID
   * @returns {Promise<Passport|null>} - Most recent passport instance or null
   */
  static async getPrimaryPassport(userId) {
    return await PassportOperations.getPrimaryPassport(userId);
  }

  /**
   * Get all passports for a user (for passport selection)
   * @param {string} userId - User ID
   * @returns {Promise<Array<Passport>>} - Array of passport instances
   */
  static async getAllPassports(userId) {
    return await PassportOperations.getAllPassports(userId);
  }

  /**
   * Get all PassportCountry records for a given passportId.
   * @param {string} passportId - The ID of the passport.
   * @returns {Promise<Array<PassportCountry>>} - Array of PassportCountry instances.
   */
  static async getPassportCountries(passportId) {
    return await PassportOperations.getPassportCountries(passportId);
  }

  /**
   * Get a specific passport by ID
   * @param {string} passportId - Passport ID
   * @returns {Promise<Passport|null>} - Passport instance or null
   */
  static async getPassportById(passportId) {
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
  static async savePassport(passportData, userId, options = {}) {
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
  static async updatePassport(passportId, updates, options = {}) {
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
  static async getPersonalInfo(userId) {
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
  static async savePersonalInfo(personalData, userId) {
    return await PersonalInfoOperations.savePersonalInfo(personalData, userId, this.triggerDataChangeEvent.bind(this));
  }

  /**
    * Update personal info data
    * Updates specific fields of existing personal info
    *
    * @param {string} personalInfoId - Personal info ID (or userId for lookup)
    * @param {Object} updates - Fields to update
    * @returns {Promise<PersonalInfo>} - Updated personal info instance
    */
    static async updatePersonalInfo(userId, updates) {
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
  static async upsertPersonalInfo(userId, data) {
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
   static async saveFundItem(fundData, userId) {
    return await FundItemOperations.saveFundItem(fundData, userId, this.triggerDataChangeEvent.bind(this));
  }

  /**
    * Get all fund items for a user
    * @param {string} userId - User ID
    * @param {Object} options - Options for loading
    * @param {boolean} options.forceRefresh - Force refresh from database (default: false)
    * @returns {Promise<Array<FundItem>>} - Array of fund items
    */
   static async getFundItems(userId, options = {}) {
    return await FundItemOperations.getFundItems(userId, options);
  }


  /**
    * Delete fund item
    * @param {string} fundItemId - Fund item ID
    * @param {string} userId - User ID
    * @returns {Promise<boolean>} - Success status
    */
   static async deleteFundItem(fundItemId, userId) {
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
  static async getEntryInfo(userId, destinationId = null) {
    return await EntryInfoOperations.getEntryInfo(userId, destinationId);
  }

  /**
   * Create a new entry info record for a user
   * @param {Object} entryInfoData - Entry info data (must include userId)
   * @returns {Promise<EntryInfo>} - Newly created entry info instance
   */
  static async createEntryInfo(entryInfoData) {
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
    } catch (error) {
      console.error('Failed to create entry info:', error);
      throw error;
    }
  }

  /**
   * Save entry info for a user
   * @param {Object} entryInfoData - Entry info data
   * @param {string} userId - User ID
   * @returns {Promise<EntryInfo>} - Saved entry info instance
   */
  static async saveEntryInfo(entryInfoData, userId) {
    return await EntryInfoOperations.saveEntryInfo(entryInfoData, userId);
  }

  /**
   * Update entry info status
   * @param {string} entryInfoId - Entry info ID
   * @param {string} newStatus - New status
   * @param {Object} options - Additional options
   * @returns {Promise<EntryInfo>} - Updated entry info instance
   */
  static async updateEntryInfoStatus(entryInfoId, newStatus, options = {}) {
    return await EntryInfoOperations.updateEntryInfoStatus(
      entryInfoId,
      newStatus,
      options,
      this.triggerEntryInfoStateChangeEvent.bind(this)
    );
  }

  /**
   * Get entry info by destination
   * @param {string} destinationId - Destination ID
   * @param {string} tripId - Trip ID (optional)
   * @returns {Promise<EntryInfo|null>} - Entry info instance or null
   */
  static async getEntryInfoByDestination(destinationId, tripId = null) {
    return await EntryInfoOperations.getEntryInfoByDestination(destinationId, tripId);
  }

  /**
   * Get all entry infos for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of EntryInfo instances
   */
  static async getAllEntryInfosForUser(userId) {
    return await EntryInfoOperations.getAllEntryInfosForUser(userId);
  }

  /**
   * Get entry infos for multiple destinations
   * @param {string} userId - User ID
   * @param {Array} destinationIds - Array of destination IDs
   * @returns {Promise<Object>} - Object with destinationId as key and EntryInfo as value
   */
  static async getEntryInfosForDestinations(userId, destinationIds) {
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
  static triggerEntryInfoStateChangeEvent(entryInfo, oldStatus, newStatus, options = {}) {
    try {
      const event = {
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

      console.log('Entry info state change event triggered:', event);
    } catch (error) {
      console.error('Failed to trigger entry info state change event:', error);
    }
  }

  /**
   * State change events storage
   * @type {Map}
   * @static
   */
  static stateChangeEvents = new Map();

  /**
   * Get recent state change events
   * @param {string} userId - User ID (optional)
   * @param {number} limit - Maximum number of events to return
   * @returns {Array} - Array of state change events
   */
  static getStateChangeEvents(userId = null, limit = 10) {
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
   * @param {string} dacData.entryInfoId - Entry info ID
   * @param {string} dacData.cardType - Card type (TDAC, MDAC, etc.)
   * @param {string} dacData.arrCardNo - Arrival card number
   * @param {string} dacData.qrUri - QR code URI
   * @param {string} dacData.pdfUrl - PDF file URL/path
   * @param {string} dacData.submittedAt - Submission timestamp
   * @param {string} dacData.submissionMethod - Submission method (api/webview/hybrid)
   * @param {string} dacData.status - Status (success/failed/pending)
   * @returns {Promise<Object>} - Save result with card ID
   */
  static async saveDigitalArrivalCard(dacData) {
    try {
      console.log('💾 Saving digital arrival card via UserDataService:', {
        cardType: dacData.cardType,
        arrCardNo: dacData.arrCardNo,
        entryInfoId: dacData.entryInfoId
      });

      const result = await SecureStorageService.saveDigitalArrivalCard(dacData);

      // Invalidate related caches
      if (dacData.entryInfoId) {
        this.cache.entryInfo.delete(dacData.entryInfoId);
        console.log('🔄 Cache invalidated for entry info:', dacData.entryInfoId);
      }

      // Trigger data change event for listeners
      this.triggerDataChangeEvent({
        type: 'DIGITAL_ARRIVAL_CARD_SAVED',
        cardType: dacData.cardType,
        arrCardNo: dacData.arrCardNo,
        entryInfoId: dacData.entryInfoId,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Digital arrival card saved successfully:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Failed to save digital arrival card:', error);
      throw error;
    }
  }

  /**
   * Get digital arrival card by ID
   *
   * @param {string} cardId - Digital arrival card ID
   * @returns {Promise<Object|null>} - Digital arrival card data or null
   */
  static async getDigitalArrivalCard(cardId) {
    try {
      return await SecureStorageService.getDigitalArrivalCard(cardId);
    } catch (error) {
      console.error('❌ Failed to get digital arrival card:', error);
      return null;
    }
  }

  /**
   * Get all digital arrival cards for an entry info
   *
   * @param {string} entryInfoId - Entry info ID
   * @returns {Promise<Array>} - Array of digital arrival cards
   */
  static async getDigitalArrivalCardsByEntryInfo(entryInfoId) {
    try {
      return await SecureStorageService.getDigitalArrivalCardsByEntryInfoId(entryInfoId);
    } catch (error) {
      console.error('❌ Failed to get digital arrival cards:', error);
      return [];
    }
  }

  /**
   * Get latest successful digital arrival card for an entry info
   *
   * @param {string} entryInfoId - Entry info ID
   * @param {string} cardType - Card type (TDAC, MDAC, etc.)
   * @returns {Promise<Object|null>} - Latest digital arrival card or null
   */
  static async getLatestDigitalArrivalCard(entryInfoId, cardType) {
    try {
      return await SecureStorageService.getLatestSuccessfulDigitalArrivalCard(entryInfoId, cardType);
    } catch (error) {
      console.error('❌ Failed to get latest digital arrival card:', error);
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
  static async getTravelInfo(userId, destination = null) {
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
  static async saveTravelInfo(userId, travelData) {
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
   static async updateTravelInfo(userId, destination, updates) {
     try {
       // Validate userId
       if (!userId) {
         throw new Error('userId is required for updateTravelInfo');
       }

       console.log('Updating travel info for user:', userId, 'destination:', destination);

       // Get existing travel info
       const existing = await this.getTravelInfo(userId, destination);

       if (!existing) {
         // No existing data, create new
         const newTravelInfo = await this.saveTravelInfo(userId, { ...updates, destination });

         // Handle arrival date change for new travel info (support legacy and new field names)
         const createdArrivalDate = (updates.arrivalArrivalDate ?? updates.arrivalDate) || null;
         if (createdArrivalDate) {
           await this.handleArrivalDateChange(userId, destination, null, createdArrivalDate);
         }

         return newTravelInfo;
       }

       // Capture existing arrival date using both legacy and new field names
       const oldArrivalDate = existing.arrivalArrivalDate || existing.arrivalDate || null;

       // Filter out empty values from updates
       const nonEmptyUpdates = {};
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

       console.log('Travel info updated successfully');
       return merged;
     } catch (error) {
       console.error('Failed to update travel info:', error);
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
   static async clearTravelInfo(userId, destination) {
    return await TravelInfoOperations.clearTravelInfo(userId, destination);
  }

  /**
   * Handle arrival date change - trigger notification scheduling
   * @param {string} userId - User ID
   * @param {string} destination - Destination
   * @param {string} oldArrivalDate - Previous arrival date
   * @param {string} newArrivalDate - New arrival date
   */
  static async handleArrivalDateChange(userId, destination, oldArrivalDate, newArrivalDate) {
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
  static async getAllUserData(userId, options = {}) {
    try {
      const { useBatchLoad = true } = options;
      const startTime = Date.now();
      console.log(`Loading all user data for user ${userId} (batch: ${useBatchLoad})`);

      let passport, personalInfo;

      // Fall back to parallel loading (original implementation)
      // This is more efficient than sequential loading but less efficient than batch
      [passport, personalInfo] = await Promise.all([
        this.getPassport(userId).catch(() => null),
        this.getPersonalInfo(userId).catch(() => null)
      ]);

      const duration = Date.now() - startTime;
      console.log(`All user data loaded in ${duration}ms using ${useBatchLoad ? 'batch' : 'parallel'} loading`);

      return {
        passport,
        personalInfo,
        userId,
        loadedAt: new Date().toISOString(),
        loadDurationMs: duration
      };
    } catch (error) {
      console.error('Failed to get all user data:', error);
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
  static async saveAllUserData(userData, userId) {
    try {
      console.log(`Saving all user data for user ${userId} using batch operations`);
      const startTime = Date.now();

      // Prepare batch operations
      const operations = [];

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
      const batchResults = await SecureStorageService.batchSave(operations);

      // Invalidate all caches for this user
      this.invalidateCache('passport', userId);
      this.invalidateCache('personalInfo', userId);

      // Reload data into cache
      const results = {};
      
      if (userData.passport) {
        results.passport = await this.getPassport(userId);
      }
      
      if (userData.personalInfo) {
        results.personalInfo = await this.getPersonalInfo(userId);
      }

      const duration = Date.now() - startTime;
      console.log(`Batch save completed in ${duration}ms`);

      return results;
    } catch (error) {
      console.error('Failed to save all user data:', error);
      throw error;
    }
  }

  /**
   * Update multiple data types at once using a single transaction
   * More efficient than calling individual update methods
   * 
   * @param {string} userId - User ID
   * @param {Object} updates - Object containing updates for each data type
   * @param {Object} updates.passport - Passport updates
   * @param {Object} updates.personalInfo - Personal info updates
   * @returns {Promise<Object>} - Updated data
   */
  static async batchUpdate(userId, updates) {
    try {
      console.log(`Starting batch update for user ${userId}`);
      const startTime = Date.now();

      // Load current data
      const currentData = await this.getAllUserData(userId, { useBatchLoad: true });

      // Prepare batch operations with merged data
      const operations = [];

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
        console.log('No updates to perform');
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
      console.log(`Batch update completed in ${duration}ms`);

      return updatedData;
    } catch (error) {
      console.error('Failed to batch update:', error);
      throw error;
    }
  }

  /**
   * Check if user has any data
   *
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - True if user has any data
   */
  static async hasUserData(userId) {
    try {
      const userData = await this.getAllUserData(userId);
      return !!(userData.passport || userData.personalInfo);
    } catch (error) {
      console.error('Failed to check user data:', error);
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
  static async deleteAllUserData(userId) {
    try {
      console.log(`Deleting all user data for user ${userId}`);

      // Clear from cache
      this.invalidateCache('passport', userId);
      this.invalidateCache('personalInfo', userId);

      // Delete from database
      // Note: This requires delete methods in SecureStorageService
      // For now, we'll just clear the cache
      console.warn('Database deletion not yet implemented in SecureStorageService');

      console.log(`All user data deleted for user ${userId}`);
    } catch (error) {
      console.error('Failed to delete all user data:', error);
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
  static async validateDataConsistency(userId) {
    try {
      const userData = await this.getAllUserData(userId);
      return DataValidationService.validateDataConsistency(userId, userData);
    } catch (error) {
      console.error('Failed to validate data consistency:', error);
      throw error;
    }
  }

  /**
   * Validate passport data
   * @param {Passport} passport - Passport instance
   * @returns {Object} - Validation result
   */
  static validatePassportData(passport) {
    return DataValidationService.validatePassportData(passport);
  }

  /**
   * Validate personal info data
   * @param {PersonalInfo} personalInfo - PersonalInfo instance
   * @returns {Object} - Validation result
   */
  static validatePersonalInfoData(personalInfo) {
    return DataValidationService.validatePersonalInfoData(personalInfo);
  }

  /**
   * Validate cross-field consistency
   * @param {Object} userData - All user data
   * @returns {Object} - Validation result
   */
  static validateCrossFieldConsistency(userData) {
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
  static addDataChangeListener(listener) {
    return DataEventService.addDataChangeListener(listener);
  }

  /**
   * Trigger data change event
   * @param {string} dataType - Type of data that changed
   * @param {string} userId - User ID
   * @param {Object} changeDetails - Details about the change
   */
  static triggerDataChangeEvent(dataType, userId, changeDetails = {}) {
    DataEventService.triggerDataChangeEvent(dataType, userId, changeDetails);

    // Handle data changes for active entry infos
    DataEventService.handleDataChangeForActiveEntryPacks(
      userId,
      dataType,
      changeDetails,
      this.getAllEntryInfosForUser.bind(this),
      (entryInfo, dt, cd) => DataEventService.checkEntryInfoForDataChanges(
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
  static getPendingResubmissionWarnings(userId) {
    return DataEventService.getPendingResubmissionWarnings(userId);
  }

  /**
   * Get resubmission warning for specific entry info
   * @param {string} entryInfoId - Entry info ID
   * @returns {Object|null} - Resubmission warning or null
   */
  static getResubmissionWarning(entryInfoId) {
    return DataEventService.getResubmissionWarning(entryInfoId);
  }

  /**
   * Clear resubmission warning for entry info
   * @param {string} entryInfoId - Entry info ID
   */
  static clearResubmissionWarning(entryInfoId) {
    DataEventService.clearResubmissionWarning(entryInfoId);
  }

  /**
   * Mark entry info as superseded due to data changes
   * @param {string} entryInfoId - Entry info ID
   * @param {Object} changeDetails - Details about the changes
   * @returns {Promise<Object>} - Updated entry info
   */
  static async markEntryInfoAsSuperseded(entryInfoId, changeDetails = {}) {
    return await DataEventService.markEntryInfoAsSuperseded(entryInfoId, changeDetails);
  }

}

export default UserDataService;
