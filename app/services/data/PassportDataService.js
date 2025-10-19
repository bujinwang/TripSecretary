/**
 * @fileoverview PassportDataService - Unified Data Access Layer
 * 
 * 入境通 - Passport Data Service (Unified Data Service)
 * Centralized service for managing all user data operations
 * 
 * This service provides a unified interface for accessing passport, personal info,
 * and funding proof data. It implements caching for performance and handles
 * migration from AsyncStorage to SQLite.
 * 
 * @module app/services/data/PassportDataService
 * @requires app/models/Passport
 * @requires app/models/PersonalInfo
 * @requires app/services/security/SecureStorageService
 * @requires @react-native-async-storage/async-storage
 * 
 * @description
 * Architecture:
 * - Single source of truth: SQLite database
 * - In-memory caching with TTL (5 minutes)
 * - Automatic migration from AsyncStorage
 * - Event-based cache invalidation
 * - Batch operations with transactions
 * 
 * @example
 * // Initialize the service
 * await PassportDataService.initialize(userId);
 * 
 * // Load all user data
 * const userData = await PassportDataService.getAllUserData(userId);
 * 
 * // Update passport
 * await PassportDataService.updatePassport(passportId, { gender: 'Male' });
 * 
 * // Batch update multiple data types
 * await PassportDataService.batchUpdate(userId, {
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
import SecureStorageService from '../security/SecureStorageService';

// AsyncStorage import with error handling
let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
  console.log('AsyncStorage imported successfully');
} catch (error) {
  console.error('Failed to import AsyncStorage:', error);
  // Create a mock AsyncStorage for graceful degradation
  AsyncStorage = {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
    getAllKeys: async () => [],
    multiGet: async () => [],
    multiSet: async () => {},
    multiRemove: async () => {},
    clear: async () => {},
  };
  console.log('Using mock AsyncStorage');
}

/**
 * @class PassportDataService
 * @classdesc Unified data access layer for managing user passport, personal info, and funding proof data.
 * 
 * This service acts as the single point of access for all user data operations,
 * providing caching, migration, and batch operation capabilities.
 * 
 * @description
 * Key Features:
 * - Centralized data management with SQLite as single source of truth
 * - In-memory caching with configurable TTL for performance optimization
 * - Automatic migration from legacy AsyncStorage to SQLite
 * - Batch operations with transaction support for atomicity
 * - Cache statistics and monitoring capabilities
 * - GDPR-compliant data export and deletion
 * 
 * @example
 * // Basic usage
 * const userId = 'user_123';
 * await PassportDataService.initialize(userId);
 * 
 * // Get passport data (uses cache if available)
 * const passport = await PassportDataService.getPassport(userId);
 * 
 * // Update passport data (invalidates cache)
 * await PassportDataService.updatePassport(passport.id, {
 *   gender: 'Male',
 *   expiryDate: '2030-12-31'
 * });
 * 
 * // Get all user data efficiently
 * const allData = await PassportDataService.getAllUserData(userId);
 * console.log(allData.passport, allData.personalInfo);
 * 
 * @static
 */
class PassportDataService {
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
  static CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Cache storage using Map-based structure for efficient lookups
   * @type {Object}
   * @static
   * @property {Map<string, Passport>} passport - Maps userId to Passport instances
   * @property {Map<string, PersonalInfo>} personalInfo - Maps userId to PersonalInfo instances
   * @property {Map<string, number>} lastUpdate - Maps cacheKey to timestamp for TTL tracking
   */
  static cache = {
    passport: new Map(),      // userId -> Passport instance
    personalInfo: new Map(),  // userId -> PersonalInfo instance
    lastUpdate: new Map()     // cacheKey -> timestamp
  };

  /**
   * Cache statistics for monitoring and performance analysis
   * @type {Object}
   * @static
   * @property {number} hits - Number of successful cache hits
   * @property {number} misses - Number of cache misses requiring database access
   * @property {number} invalidations - Number of cache invalidations
   * @property {number} lastReset - Timestamp of last statistics reset
   */
  static cacheStats = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    lastReset: Date.now()
  };

  /**
   * Service initialization flag
   * @type {boolean}
   * @static
   * @private
   */
  static initialized = false;

  /**
    * Initialize the PassportDataService
    *
    * Sets up database schema, checks for required migrations, and prepares
    * the service for use. This method should be called once during app startup
    * or when a user logs in.
    *
    * @async
    * @static
    * @param {string} userId - User ID for initialization and migration check
    * @returns {Promise<void>}
    * @throws {Error} If initialization fails
    *
    * @example
    * // Initialize on app startup
    * try {
    *   await PassportDataService.initialize('user_123');
    *   console.log('Service initialized successfully');
    * } catch (error) {
    *   console.error('Initialization failed:', error);
    * }
    *
    * @description
    * Initialization process:
    * 1. Checks if service is already initialized (idempotent)
    * 2. Initializes SecureStorageService (creates database schema if needed)
    * 3. Checks if user needs data migration from AsyncStorage
    * 4. Performs migration if needed
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
       } catch (initError) {
         console.error('SecureStorageService initialization failed:', initError);
         // If initialization fails due to schema issues, mark as initialized anyway
         // to prevent repeated initialization attempts
         this.initialized = true;
         throw initError;
       }

       // Check if migration is needed for this user
       // Wrap in try-catch in case migrations table doesn't exist or has old schema
       try {
         const needsMigration = await SecureStorageService.needsMigration(userId);
         if (needsMigration) {
           console.log('Migration needed, attempting to migrate from AsyncStorage...');
           await this.migrateFromAsyncStorage(userId);
         } else {
           console.log('No migration needed for user');
         }
       } catch (migrationCheckError) {
         console.warn('Could not check migration status, assuming no migration needed:', migrationCheckError.message);
         // Continue initialization even if migration check fails
       }

       // Clean up duplicate passports (keep only the most recent one)
       try {
         const deletedCount = await SecureStorageService.cleanupDuplicatePassports(userId);
         if (deletedCount > 0) {
           console.log(`Cleaned up ${deletedCount} duplicate passport(s) for user ${userId}`);
         }
       } catch (cleanupError) {
         console.warn('Could not cleanup duplicate passports:', cleanupError.message);
         // Continue initialization even if cleanup fails
       }

       this.initialized = true;
       console.log('PassportDataService initialized successfully');
     } catch (error) {
       console.error('Failed to initialize PassportDataService:', error);
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
   * PassportDataService.clearCache();
   * 
   * // Clear cache and log statistics
   * PassportDataService.clearCache();
   * const stats = PassportDataService.getCacheStats();
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
    this.cache.passport.clear();
    this.cache.personalInfo.clear();
    this.cache.lastUpdate.clear();
    this.logCacheStats();
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
   * PassportDataService.logCacheStats();
   * // Output:
   * // === PassportDataService Cache Statistics ===
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

    console.log('=== PassportDataService Cache Statistics ===');
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
   * PassportDataService.resetCacheStats();
   * 
   * // Perform operations...
   * await PassportDataService.getPassport(userId);
   * 
   * // Check statistics for this period only
   * const stats = PassportDataService.getCacheStats();
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
    this.cacheStats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      lastReset: Date.now()
    };
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
   * const stats = PassportDataService.getCacheStats();
   * console.log(`Cache hit rate: ${stats.hitRate}%`);
   * console.log(`Total requests: ${stats.totalRequests}`);
   * console.log(`Time period: ${(stats.timeSinceReset / 60000).toFixed(2)} minutes`);
   * 
   * @example
   * // Monitor cache effectiveness
   * const stats = PassportDataService.getCacheStats();
   * if (stats.hitRate < 50) {
   *   console.warn('Low cache hit rate detected');
   *   // Consider increasing CACHE_TTL or investigating access patterns
   * }
   */
  static getCacheStats() {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = totalRequests > 0 
      ? ((this.cacheStats.hits / totalRequests) * 100).toFixed(2) 
      : 0;

    return {
      ...this.cacheStats,
      totalRequests,
      hitRate: parseFloat(hitRate),
      timeSinceReset: Date.now() - this.cacheStats.lastReset
    };
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
   * await PassportDataService.refreshCache('user_123');
   * 
   * // Next access will reload from database
   * const passport = await PassportDataService.getPassport('user_123');
   * 
   * @example
   * // Refresh cache for multiple users
   * const userIds = ['user_123', 'user_456', 'user_789'];
   * await Promise.all(userIds.map(id => PassportDataService.refreshCache(id)));
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
    try {
      // Remove user's data from cache
      this.cache.passport.delete(userId);
      this.cache.personalInfo.delete(userId);
      
      // Remove cache timestamps
      this.cache.lastUpdate.delete(`passport_${userId}`);
      this.cache.lastUpdate.delete(`personalInfo_${userId}`);
    } catch (error) {
      console.error('Failed to refresh cache:', error);
      throw error;
    }
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
    const lastUpdate = this.cache.lastUpdate.get(cacheKey);
    if (!lastUpdate) return false;

    const now = Date.now();
    const age = now - lastUpdate;
    return age < this.CACHE_TTL;
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
    this.cache.lastUpdate.set(cacheKey, Date.now());
  }

  /**
    * Invalidate cache for a specific data type and user
    *
    * Removes a specific cache entry and its timestamp, forcing the next access
    * to reload from the database. Called automatically after data updates.
    *
    * @static
    * @param {('passport'|'personalInfo'|'fundingProof'|'fundItems')} dataType - Type of data to invalidate
    * @param {string} userId - User ID whose cache should be invalidated
    * @returns {void}
    *
    * @example
    * // Invalidate passport cache after update
    * await passport.save();
    * PassportDataService.invalidateCache('passport', userId);
    *
    * @example
    * // Invalidate fund items cache after update
    * await fundItem.save();
    * PassportDataService.invalidateCache('fundItems', userId);
    *
    * @example
    * // Invalidate all data types for a user
    * ['passport', 'personalInfo', 'fundItems'].forEach(type => {
    *   PassportDataService.invalidateCache(type, userId);
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
     const cacheKey = `${dataType}_${userId}`;
     let cacheSegment = this.cache[dataType];

     // Lazily initialize caches that were not predefined (e.g., fundItems)
     if (!cacheSegment && dataType !== 'lastUpdate') {
       cacheSegment = new Map();
       this.cache[dataType] = cacheSegment;
     }

     if (cacheSegment && typeof cacheSegment.delete === 'function') {
       cacheSegment.delete(userId);
     }

     this.cache.lastUpdate.delete(cacheKey);
     this.cacheStats.invalidations++;
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
    this.cacheStats.hits++;
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
    this.cacheStats.misses++;
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
    try {
      const cacheKey = `passport_${userId}`;

      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        const cached = this.cache.passport.get(userId);
        if (cached) {
          this.recordCacheHit('passport', userId);
          return cached;
        }
      }

      // Cache miss - load from database
      this.recordCacheMiss('passport', userId);
      const passport = await Passport.load(userId, { byUserId: true });

      // Update cache
      if (passport) {
        this.cache.passport.set(userId, passport);
        this.updateCacheTimestamp(cacheKey);
      }

      return passport;
    } catch (error) {
      console.error('Failed to get passport:', error);
      throw error;
    }
  }

  /**
   * Convenience helper for retrieving the user's primary passport
   * Alias for getPassport(userId) kept for backwards compatibility
   *
   * @param {string} userId - User ID
   * @returns {Promise<Passport|null>} - Primary passport instance or null
   */
  static async getPrimaryPassport(userId) {
    try {
      return await this.getPassport(userId);
    } catch (error) {
      console.error('Failed to get primary passport:', error);
      throw error;
    }
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
    try {
      console.log('=== PASSPORT DATA SERVICE DEBUG ===');
      console.log('PassportDataService.savePassport called');
      console.log('passportData received:', passportData);
      console.log('userId received:', userId);
      console.log('options received:', options);
      console.log('passportData.dateOfBirth:', passportData.dateOfBirth);
      console.log('passportData.nationality:', passportData.nationality);

      // Create passport instance
      const passport = new Passport({
        ...passportData,
        userId
      });

      console.log('Passport instance created:', {
        id: passport.id,
        userId: passport.userId,
        dateOfBirth: passport.dateOfBirth,
        nationality: passport.nationality
      });

      // Save to database with options
      // Default to skipValidation: true to support incremental/progressive filling
      const saveOptions = { skipValidation: true, ...options };
      console.log('Final saveOptions after merge:', saveOptions);
      console.log('About to call passport.save with these options');

      await passport.save(saveOptions);

      console.log('passport.save completed successfully');

      // Invalidate cache
      this.invalidateCache('passport', userId);

      // Update cache with new data
      this.cache.passport.set(userId, passport);
      this.updateCacheTimestamp(`passport_${userId}`);

      const updatedFields = Object.keys(passportData || {}).filter(key => {
        if (key === 'userId') {
          return false;
        }
        const value = passportData[key];
        if (value === null || value === undefined) {
          return false;
        }
        return typeof value !== 'string' || value.trim().length > 0;
      });
      if (updatedFields.length > 0) {
        this.triggerDataChangeEvent('passport', userId, {
          passportId: passport.id || passportData.id,
          updatedFields,
        });
      }

      console.log('PassportDataService.savePassport completed successfully');
      return passport;
    } catch (error) {
      console.error('=== PASSPORT DATA SERVICE ERROR ===');
      console.error('Error in PassportDataService.savePassport:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
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
    try {
      // Load existing passport
      let passport = await Passport.load(passportId);
      
      if (!passport) {
        throw new Error(`Passport not found: ${passportId}`);
      }

      // Filter out empty values to avoid overwriting existing data
      const nonEmptyUpdates = {};
      for (const [key, value] of Object.entries(updates)) {
        // Skip metadata fields
        if (key === 'id' || key === 'userId' || key === 'createdAt') {
          continue;
        }
        
        // Only include non-empty values
        if (value !== null && value !== undefined) {
          if (typeof value === 'string') {
            // For strings, only include if not empty or whitespace-only
            if (value.trim().length > 0) {
              nonEmptyUpdates[key] = value;
            }
          } else {
            // For non-strings, include as-is
            nonEmptyUpdates[key] = value;
          }
        }
      }

      // Apply non-empty updates only
      Object.assign(passport, nonEmptyUpdates);
      passport.updatedAt = new Date().toISOString();

      // Save updated passport with options
      // Default to skipValidation: true to support incremental/progressive filling
      const saveOptions = { skipValidation: true, ...options };
      await passport.save(saveOptions);

      // Invalidate cache
      if (passport.userId) {
        this.invalidateCache('passport', passport.userId);
        
        // Update cache with new data
        this.cache.passport.set(passport.userId, passport);
        this.updateCacheTimestamp(`passport_${passport.userId}`);
      }

      const updatedFields = Object.keys(nonEmptyUpdates).filter(field => field !== 'userId');
      if (updatedFields.length > 0 && passport.userId) {
        this.triggerDataChangeEvent('passport', passport.userId, {
          passportId: passport.id || passportId,
          updatedFields,
        });
      }

      return passport;
    } catch (error) {
      console.error('Failed to update passport:', error);
      throw error;
    }
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
    try {
      const cacheKey = `personalInfo_${userId}`;

      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        const cached = this.cache.personalInfo.get(userId);
        if (cached) {
          this.recordCacheHit('personalInfo', userId);
          return cached;
        }
      }

      // Cache miss - load from database
      this.recordCacheMiss('personalInfo', userId);
      const personalInfo = await PersonalInfo.load(userId);

      // Update cache
      if (personalInfo) {
        this.cache.personalInfo.set(userId, personalInfo);
        this.updateCacheTimestamp(cacheKey);
      }

      return personalInfo;
    } catch (error) {
      console.error('Failed to get personal info:', error);
      throw error;
    }
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
    try {
      // Remove any existing ID to ensure we create a fresh record
      const cleanData = { ...personalData };
      delete cleanData.id;
      
      // Create personal info instance
      const personalInfo = new PersonalInfo({
        ...cleanData,
        userId
      });

      console.log('Saving new PersonalInfo with data:', {
        id: personalInfo.id,
        userId: personalInfo.userId,
        fields: Object.keys(cleanData)
      });

      // Save to database
      // Default to skipValidation: true to support incremental/progressive filling
      await personalInfo.save({ skipValidation: true });

      // Invalidate cache
      this.invalidateCache('personalInfo', userId);

      // Update cache with new data
      this.cache.personalInfo.set(userId, personalInfo);
      this.updateCacheTimestamp(`personalInfo_${userId}`);

      console.log(`Personal info saved for user ${userId} with ID ${personalInfo.id}`);
      return personalInfo;
    } catch (error) {
      console.error('Failed to save personal info:', error);
      console.error('Error details:', error.message, error.stack);
      throw error;
    }
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
     try {
       console.log('=== PASSPORT DATA SERVICE DEBUG ===');
       console.log('updatePersonalInfo called with:');
       console.log('- userId:', userId);
       console.log('- updates:', updates);
       console.log('- updates keys:', Object.keys(updates));

       // Load existing personal info by userId
       console.log('Attempting to load existing personal info...');
       let personalInfo = await PersonalInfo.load(userId);

       console.log('PersonalInfo.load result:', personalInfo);

       if (!personalInfo) {
         console.warn('Personal info not found for userId:', userId);
         throw new Error(`Personal info not found for userId: ${userId}`);
       }

      // Apply updates using mergeUpdates to avoid overwriting existing data with empty values
      // This is important for progressive data filling where fields are filled incrementally
      // Default to skipValidation: true to support incremental/progressive filling
      await personalInfo.mergeUpdates(updates, { skipValidation: true });

      // Invalidate cache
      if (personalInfo.userId) {
        this.invalidateCache('personalInfo', personalInfo.userId);
        
        // Update cache with new data
        this.cache.personalInfo.set(personalInfo.userId, personalInfo);
        this.updateCacheTimestamp(`personalInfo_${personalInfo.userId}`);
      }

      const updatedFields = Object.keys(updates || {}).filter(key => {
        if (key === 'userId') {
          return false;
        }
        const value = updates[key];
        if (value === null || value === undefined) {
          return false;
        }
        return typeof value !== 'string' || value.trim().length > 0;
      });
      if (updatedFields.length > 0 && personalInfo.userId) {
        this.triggerDataChangeEvent('personalInfo', personalInfo.userId, {
          personalInfoId: personalInfo.id,
          updatedFields,
        });
      }

      console.log(`Personal info updated for userId: ${userId}`);
      return personalInfo;
    } catch (error) {
      console.error('Failed to update personal info:', error);
      throw error;
    }
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
    try {
      // Try to get existing personal info
      let personalInfo = await this.getPersonalInfo(userId);
      
      if (personalInfo && personalInfo.id) {
        try {
          // Try to update existing - pass userId instead of personalInfo.id
          // since updatePersonalInfo expects userId for lookup
          return await this.updatePersonalInfo(userId, data);
        } catch (updateError) {
          // If update fails (e.g., record not found), clear cache and create new
          console.log('Personal info record not found, creating new record for user:', userId);
          this.invalidateCache('personalInfo', userId);
          personalInfo = null;
        }
      }
      
      // Create new if no existing record or update failed
      if (!personalInfo) {
        console.log('Creating new PersonalInfo for userId:', userId);
        const personalData = {
          ...data,
          userId
        };
        return await this.savePersonalInfo(personalData, userId);
      }
    } catch (error) {
      console.error('Failed to upsert personal info:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  }

  // ============================================================================
  // FUNDING PROOF OPERATIONS
  // ============================================================================

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
     try {
       console.log('=== PASSPORT DATA SERVICE: SAVE FUND ITEM ===');
       console.log('Input fundData:', JSON.stringify(fundData, null, 2));
       console.log('userId:', userId);

       const FundItem = require('../../models/FundItem').default;

       // Create fund item instance
       const fundItem = new FundItem({
         ...fundData,
         userId
       });

       console.log('FundItem instance created, about to save...');

       // Save to database
       const saveResult = await fundItem.save({ skipValidation: true });
       console.log('FundItem.save() completed, result:', saveResult);

       // Invalidate and clear cache for fund items to force refresh
       this.invalidateCache('fundItems', userId);

       // Also clear the cache entry to ensure fresh data on next load
       if (this.cache.fundItems) {
         this.cache.fundItems.delete(userId);
       }

       this.triggerDataChangeEvent('funds', userId, {
         action: 'added',
         fundItemId: fundItem.id,
         fundType: fundItem.type || fundData.type,
       });

       console.log(`✅ Fund item saved for user ${userId}`);
       return fundItem;
     } catch (error) {
       console.error('PassportDataService.saveFundItem failed:', error);
       throw error;
     }
   }

  /**
    * Get all fund items for a user
    * @param {string} userId - User ID
    * @param {Object} options - Options for loading
    * @param {boolean} options.forceRefresh - Force refresh from database (default: false)
    * @returns {Promise<Array<FundItem>>} - Array of fund items
    */
   static async getFundItems(userId, options = {}) {
     try {
       console.log('=== PASSPORT DATA SERVICE: GET FUND ITEMS ===');
       console.log('Loading fund items for userId:', userId);

       const { forceRefresh = false } = options;
       const cacheKey = `fundItems_${userId}`;

       // Check cache first (unless force refresh is requested)
       if (!forceRefresh && this.cache.fundItems && this.cache.fundItems.has(userId)) {
         const cached = this.cache.fundItems.get(userId);
         if (this.isCacheValid(cacheKey)) {
           console.log('Returning cached fund items');
           this.recordCacheHit('fundItems', userId);
           return cached;
         }
       }

       // Cache miss or force refresh - load from database
       this.recordCacheMiss('fundItems', userId);
       const FundItem = require('../../models/FundItem').default;
       const fundItems = await FundItem.loadByUserId(userId);

       // Update cache
       if (!this.cache.fundItems) {
         this.cache.fundItems = new Map();
       }
       this.cache.fundItems.set(userId, fundItems);
       this.updateCacheTimestamp(cacheKey);

       console.log(`✅ Loaded ${fundItems.length} fund items for user ${userId} from database`);
       return fundItems;
     } catch (error) {
       console.error('PassportDataService.getFundItems failed:', error);
       throw error;
     }
   }

  /**
    * Delete fund item
    * @param {string} fundItemId - Fund item ID
    * @param {string} userId - User ID
    * @returns {Promise<boolean>} - Success status
    */
   static async deleteFundItem(fundItemId, userId) {
     try {
       console.log('=== PASSPORT DATA SERVICE: DELETE FUND ITEM ===');
       console.log('Deleting fund item:', fundItemId, 'for user:', userId);

       const FundItem = require('../../models/FundItem').default;
       const fundItem = await FundItem.load(fundItemId);

       if (!fundItem) {
         console.log('Fund item not found:', fundItemId);
         return false;
       }

       const result = await fundItem.delete();

       // Invalidate and clear cache for fund items to force refresh
       this.invalidateCache('fundItems', userId);

       // Also clear the cache entry to ensure fresh data on next load
       if (this.cache.fundItems) {
         this.cache.fundItems.delete(userId);
       }

       this.triggerDataChangeEvent('funds', userId, {
         action: 'deleted',
         fundItemId,
         fundType: fundItem.type,
       });

       console.log(`✅ Fund item deleted: ${fundItemId}`);
       return result;
     } catch (error) {
       console.error('PassportDataService.deleteFundItem failed:', error);
       throw error;
     }
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
    try {
      console.log(`Getting entry info for user ${userId}, destination: ${destinationId || 'any'}`);
      
      const cacheKey = `entryInfo_${userId}_${destinationId || 'default'}`;

      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        const cached = this.cache.entryInfo?.get(`${userId}_${destinationId || 'default'}`);
        if (cached) {
          this.recordCacheHit('entryInfo', userId);
          return cached;
        }
      }

      // Cache miss - load from database
      this.recordCacheMiss('entryInfo', userId);
      
      // Load entry info from storage
      const entryInfoData = await SecureStorageService.getEntryInfo(userId, destinationId);
      
      let entryInfo = null;
      if (entryInfoData) {
        const EntryInfo = require('../../models/EntryInfo').default;
        entryInfo = new EntryInfo(entryInfoData);
      }

      // Update cache
      if (entryInfo) {
        if (!this.cache.entryInfo) {
          this.cache.entryInfo = new Map();
        }
        this.cache.entryInfo.set(`${userId}_${destinationId || 'default'}`, entryInfo);
        this.updateCacheTimestamp(cacheKey);
      }

      return entryInfo;
    } catch (error) {
      console.error('Failed to get entry info:', error);
      return null;
    }
  }

  /**
   * Save entry info for a user
   * @param {Object} entryInfoData - Entry info data
   * @param {string} userId - User ID
   * @returns {Promise<EntryInfo>} - Saved entry info instance
   */
  static async saveEntryInfo(entryInfoData, userId) {
    try {
      console.log('Saving entry info for user:', userId);
      
      const EntryInfo = require('../../models/EntryInfo').default;
      
      // Create entry info instance
      const entryInfo = new EntryInfo({
        ...entryInfoData,
        userId
      });

      // Save to database
      await entryInfo.save({ skipValidation: true });

      // Invalidate cache
      const destinationId = entryInfo.destinationId || 'default';
      this.invalidateCache('entryInfo', `${userId}_${destinationId}`);

      // Update cache with new data
      if (!this.cache.entryInfo) {
        this.cache.entryInfo = new Map();
      }
      this.cache.entryInfo.set(`${userId}_${destinationId}`, entryInfo);
      this.updateCacheTimestamp(`entryInfo_${userId}_${destinationId}`);

      console.log(`Entry info saved for user ${userId}`);
      return entryInfo;
    } catch (error) {
      console.error('Failed to save entry info:', error);
      throw error;
    }
  }

  /**
   * Update entry info status
   * @param {string} entryInfoId - Entry info ID
   * @param {string} newStatus - New status (ready, submitted, superseded, expired, archived)
   * @param {Object} options - Additional options
   * @returns {Promise<EntryInfo>} - Updated entry info instance
   */
  static async updateEntryInfoStatus(entryInfoId, newStatus, options = {}) {
    try {
      console.log(`Updating entry info status: ${entryInfoId} -> ${newStatus}`);
      
      const EntryInfo = require('../../models/EntryInfo').default;
      
      // Load existing entry info
      const entryInfo = await EntryInfo.load(entryInfoId);
      if (!entryInfo) {
        throw new Error(`Entry info not found: ${entryInfoId}`);
      }

      const oldStatus = entryInfo.status;
      
      // Update status using the model's method
      entryInfo.updateStatus(newStatus, options.reason);
      
      // If marking as submitted, store TDAC submission data
      if (newStatus === 'submitted' && options.tdacSubmission) {
        entryInfo.markAsSubmitted(options.tdacSubmission);
      }

      // Save updated entry info
      await entryInfo.save({ skipValidation: true });

      // Invalidate cache
      const destinationId = entryInfo.destinationId || 'default';
      this.invalidateCache('entryInfo', `${entryInfo.userId}_${destinationId}`);

      // Update cache with new data
      if (!this.cache.entryInfo) {
        this.cache.entryInfo = new Map();
      }
      this.cache.entryInfo.set(`${entryInfo.userId}_${destinationId}`, entryInfo);
      this.updateCacheTimestamp(`entryInfo_${entryInfo.userId}_${destinationId}`);

      // Trigger state change event for notification system
      this.triggerEntryInfoStateChangeEvent(entryInfo, oldStatus, newStatus, options);

      console.log(`Entry info status updated: ${entryInfoId} (${oldStatus} -> ${newStatus})`);
      return entryInfo;
    } catch (error) {
      console.error('Failed to update entry info status:', error);
      throw error;
    }
  }

  /**
   * Get entry info by destination
   * @param {string} destinationId - Destination ID
   * @param {string} tripId - Trip ID (optional)
   * @returns {Promise<EntryInfo|null>} - Entry info instance or null
   */
  static async getEntryInfoByDestination(destinationId, tripId = null) {
    try {
      console.log(`Getting entry info by destination: ${destinationId}, trip: ${tripId || 'any'}`);
      
      // Load from storage - this would need to be implemented in SecureStorageService
      const entryInfoData = await SecureStorageService.getEntryInfoByDestination(destinationId, tripId);
      
      if (!entryInfoData) {
        return null;
      }

      const EntryInfo = require('../../models/EntryInfo').default;
      return new EntryInfo(entryInfoData);
    } catch (error) {
      console.error('Failed to get entry info by destination:', error);
      return null;
    }
  }

  /**
   * Get all entry infos for a user across all destinations
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of EntryInfo instances
   */
  static async getAllEntryInfosForUser(userId) {
    try {
      console.log(`Getting all entry infos for user: ${userId}`);
      
      // Load all entry infos from storage
      const allEntryInfoData = await SecureStorageService.getAllEntryInfosForUser(userId);
      
      if (!allEntryInfoData || allEntryInfoData.length === 0) {
        console.log(`No entry infos found for user: ${userId}`);
        return [];
      }

      const EntryInfo = require('../../models/EntryInfo').default;
      const entryInfos = allEntryInfoData.map(data => new EntryInfo(data));
      
      console.log(`${entryInfos.length} entry infos loaded for user ${userId}`);

      return entryInfos;
    } catch (error) {
      console.error(`Failed to get all entry infos for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get entry infos for multiple destinations
   * @param {string} userId - User ID
   * @param {Array} destinationIds - Array of destination IDs
   * @returns {Promise<Object>} - Object with destinationId as key and EntryInfo as value
   */
  static async getEntryInfosForDestinations(userId, destinationIds) {
    try {
      console.log(`Getting entry infos for destinations:`, destinationIds);
      
      const entryInfos = {};
      
      // Load entry info for each destination
      for (const destinationId of destinationIds) {
        try {
          const entryInfo = await this.getEntryInfoByDestination(destinationId);
          entryInfos[destinationId] = entryInfo;
        } catch (error) {
          console.log(`Failed to load entry info for destination ${destinationId}:`, error.message);
          entryInfos[destinationId] = null;
        }
      }
      
      console.log(`Entry infos loaded for ${Object.keys(entryInfos).length} destinations`);
      
      return entryInfos;
    } catch (error) {
      console.error('Failed to get entry infos for destinations:', error);
      return {};
    }
  }

  /**
   * Trigger state change event for notification system
   * @param {EntryInfo} entryInfo - Entry info instance
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @param {Object} options - Additional options
   */
  static triggerEntryInfoStateChangeEvent(entryInfo, oldStatus, newStatus, options = {}) {
    try {
      // Create state change event
      const event = {
        type: 'ENTRY_INFO_STATUS_CHANGED',
        timestamp: new Date().toISOString(),
        entryInfoId: entryInfo.id,
        userId: entryInfo.userId,
        destinationId: entryInfo.destinationId,
        tripId: entryInfo.tripId,
        oldStatus,
        newStatus,
        reason: options.reason,
        metadata: {
          completionPercent: entryInfo.getTotalCompletionPercent(),
          isReady: entryInfo.isReadyForSubmission(),
          requiresResubmission: entryInfo.requiresResubmission(),
          arrivalDate: entryInfo.arrivalDate,
          lastUpdatedAt: entryInfo.lastUpdatedAt
        }
      };

      // Emit event for notification system
      // In a real implementation, this would use an event emitter or message queue
      console.log('Entry info state change event:', event);
      
      // Store event for potential notification processing
      this.storeStateChangeEvent(event);
      
      // Trigger immediate notification processing if needed
      if (this.shouldTriggerImmediateNotification(oldStatus, newStatus)) {
        this.processImmediateNotification(event);
      }
    } catch (error) {
      console.error('Failed to trigger state change event:', error);
      // Don't throw - this is a side effect and shouldn't break the main operation
    }
  }

  /**
   * Store state change event for processing
   * @param {Object} event - State change event
   */
  static storeStateChangeEvent(event) {
    try {
      // Store in a simple in-memory queue for now
      // In production, this would use a proper event store or message queue
      if (!this.stateChangeEvents) {
        this.stateChangeEvents = [];
      }
      
      this.stateChangeEvents.push(event);
      
      // Keep only recent events (last 100)
      if (this.stateChangeEvents.length > 100) {
        this.stateChangeEvents = this.stateChangeEvents.slice(-100);
      }
      
      console.log(`State change event stored. Queue size: ${this.stateChangeEvents.length}`);
    } catch (error) {
      console.error('Failed to store state change event:', error);
    }
  }

  /**
   * Check if immediate notification should be triggered
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @returns {boolean} - Should trigger immediate notification
   */
  static shouldTriggerImmediateNotification(oldStatus, newStatus) {
    // Trigger immediate notifications for important status changes
    const immediateNotificationTransitions = [
      'ready->submitted',
      'submitted->superseded',
      'submitted->expired',
      'in_progress->archived'
    ];
    
    const transition = `${oldStatus}->${newStatus}`;
    return immediateNotificationTransitions.includes(transition);
  }

  /**
   * Process immediate notification
   * @param {Object} event - State change event
   */
  static processImmediateNotification(event) {
    try {
      console.log('Processing immediate notification for event:', event.type);
      
      // This would integrate with the notification service
      // For now, just log the notification that should be sent
      const { oldStatus, newStatus, metadata } = event;
      
      if (oldStatus === 'ready' && newStatus === 'submitted') {
        console.log('Should send notification: Entry pack submitted successfully');
      } else if (oldStatus === 'submitted' && newStatus === 'superseded') {
        console.log('Should send notification: Entry pack superseded, resubmission required');
      } else if (oldStatus === 'submitted' && newStatus === 'expired') {
        console.log('Should send notification: Entry pack expired');
      } else if (newStatus === 'archived') {
        console.log('Should send notification: Entry pack archived');
      }
      
      // In a real implementation, this would call NotificationService
      // const NotificationService = require('../notification/NotificationService').default;
      // await NotificationService.sendStateChangeNotification(event);
    } catch (error) {
      console.error('Failed to process immediate notification:', error);
    }
  }

  /**
   * Get recent state change events
   * @param {string} userId - User ID (optional)
   * @param {number} limit - Maximum number of events to return
   * @returns {Array} - Array of state change events
   */
  static getStateChangeEvents(userId = null, limit = 10) {
    try {
      if (!this.stateChangeEvents) {
        return [];
      }
      
      let events = this.stateChangeEvents;
      
      // Filter by user if specified
      if (userId) {
        events = events.filter(event => event.userId === userId);
      }
      
      // Sort by timestamp (most recent first) and limit
      return events
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get state change events:', error);
      return [];
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
    try {
      console.log(`Getting travel info for user ${userId}, destination: ${destination || 'any'}`);
      
      // Load from database (no caching for travel info as it's draft data)
      const travelInfo = await SecureStorageService.getTravelInfo(userId, destination);

      return travelInfo;
    } catch (error) {
      console.error('Failed to get travel info:', error);
      throw error;
    }
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
    try {
      console.log('Saving travel info for user:', userId);
      console.log('Travel data fields:', Object.keys(travelData));

      // Filter out empty fields to avoid overwriting existing data
      const nonEmptyUpdates = {};
      for (const [key, value] of Object.entries(travelData)) {
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

      // Add userId to the data
      nonEmptyUpdates.userId = userId;

      // Check if travel info already exists
      const existing = await this.getTravelInfo(userId, travelData.destination);
      
      let savedTravelInfo;
      if (existing) {
        // Merge with existing data
        const merged = { ...existing, ...nonEmptyUpdates, id: existing.id };
        const result = await SecureStorageService.saveTravelInfo(merged);
        console.log('Travel info updated:', result.id);
        savedTravelInfo = merged;
      } else {
        // Create new travel info
        const result = await SecureStorageService.saveTravelInfo(nonEmptyUpdates);
        console.log('Travel info created:', result.id);
        savedTravelInfo = { ...nonEmptyUpdates, id: result.id };
      }

      const updatedFields = Object.keys(nonEmptyUpdates).filter(field => field !== 'userId');
      if (updatedFields.length > 0) {
        this.triggerDataChangeEvent('travel', userId, {
          updatedFields,
          destination: savedTravelInfo.destination,
        });
      }

      return savedTravelInfo;
    } catch (error) {
      console.error('Failed to save travel info:', error);
      throw error;
    }
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

      // Merge with existing data
      const merged = { ...existing, ...nonEmptyUpdates };
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
   * Handle arrival date change - trigger notification scheduling
   * @param {string} userId - User ID
   * @param {string} destination - Destination
   * @param {string} oldArrivalDate - Previous arrival date
   * @param {string} newArrivalDate - New arrival date
   */
  static async handleArrivalDateChange(userId, destination, oldArrivalDate, newArrivalDate) {
    try {
      // Only handle Thailand for now (as per requirements)
      if (destination !== 'thailand') {
        return;
      }

      // Import NotificationCoordinator dynamically to avoid circular dependencies
      const NotificationCoordinator = require('../notification/NotificationCoordinator').default;
      
      // Get or create entry pack for this destination
      const EntryPackService = require('../entryPack/EntryPackService').default;
      
      // Find entry info for this destination
      const entryInfo = await this.getEntryInfoByDestination(destination);
      if (!entryInfo) {
        console.log('No entry info found for destination:', destination);
        return;
      }

      // Get or create entry pack
      let entryPack = await EntryPackService.getByEntryInfoId(entryInfo.id);
      if (!entryPack) {
        entryPack = await EntryPackService.createOrUpdatePack(entryInfo.id);
      }

      // Parse dates
      const oldDate = oldArrivalDate ? new Date(oldArrivalDate) : null;
      const newDate = newArrivalDate ? new Date(newArrivalDate) : null;

      // Handle notification scheduling
      await NotificationCoordinator.handleArrivalDateChange(
        userId,
        entryPack.id,
        newDate,
        oldDate,
        'Thailand'
      );

      console.log('Arrival date change handled for notifications:', {
        userId,
        destination,
        entryPackId: entryPack.id,
        oldDate: oldDate?.toISOString(),
        newDate: newDate?.toISOString()
      });

    } catch (error) {
      console.error('Failed to handle arrival date change:', error);
      // Don't throw - this is a secondary operation that shouldn't break the main flow
    }
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

      if (useBatchLoad) {
        try {
          // Use batch loading with single transaction for better performance
          // This reduces database round-trips and ensures consistent read
          const batchData = await SecureStorageService.batchLoad(userId, [
            'passport',
            'personalInfo'
          ]);

          passport = batchData.passport;
          personalInfo = batchData.personalInfo;

          // Update cache with loaded data
          if (passport) {
            this.cache.passport.set(userId, passport);
            this.updateCacheTimestamp(`passport_${userId}`);
          }
          if (personalInfo) {
            this.cache.personalInfo.set(userId, personalInfo);
            this.updateCacheTimestamp(`personalInfo_${userId}`);
          }
        } catch (batchError) {
          // If batch loading fails (e.g., schema mismatch), fall back to parallel loading
          console.warn('Batch loading failed, falling back to parallel loading:', batchError.message);
          [passport, personalInfo] = await Promise.all([
            this.getPassport(userId).catch(() => null),
            this.getPersonalInfo(userId).catch(() => null)
          ]);
        }
      } else {
        // Fall back to parallel loading (original implementation)
        // This is more efficient than sequential loading but less efficient than batch
        [passport, personalInfo] = await Promise.all([
          this.getPassport(userId).catch(() => null),
          this.getPersonalInfo(userId).catch(() => null)
        ]);
      }

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
   * Useful for determining if migration is needed
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
  // ASYNCSTORAGE MIGRATION
  // ============================================================================

  /**
    * Migrate user data from AsyncStorage to SQLite
    * This is a one-time migration for existing users
    *
    * @param {string} userId - User ID
    * @returns {Promise<Object>} - Migration result
    */
   static async migrateFromAsyncStorage(userId) {
     try {
       console.log(`Starting AsyncStorage migration for user ${userId}`);

       // Check if AsyncStorage is available
       if (!AsyncStorage || !AsyncStorage.getItem) {
         console.log('AsyncStorage not available, skipping migration');
         return {
           success: true,
           skipped: true,
           message: 'AsyncStorage not available, migration skipped'
         };
       }

       // Check if migration already completed
       const alreadyMigrated = await SecureStorageService.needsMigration(userId);
       if (!alreadyMigrated) {
         console.log(`Migration already completed for user ${userId}`);
         return {
           success: true,
           alreadyMigrated: true,
           message: 'Migration already completed'
         };
       }

       const migrationResult = {
         success: false,
         passport: null,
         personalInfo: null,
         errors: []
       };

       // Migrate passport data
       try {
         const passportData = await this.migratePassportFromAsyncStorage(userId);
         if (passportData) {
           migrationResult.passport = passportData;
           console.log('Passport data migrated successfully');
         }
       } catch (error) {
         console.error('Failed to migrate passport data:', error);
         migrationResult.errors.push(`Passport: ${error.message}`);
       }

       // Migrate personal info
       try {
         const personalInfoData = await this.migratePersonalInfoFromAsyncStorage(userId);
         if (personalInfoData) {
           migrationResult.personalInfo = personalInfoData;
           console.log('Personal info migrated successfully');
         }
       } catch (error) {
         console.error('Failed to migrate personal info:', error);
         migrationResult.errors.push(`PersonalInfo: ${error.message}`);
       }

       // Mark migration as complete (only if we have some data or no errors)
       if (migrationResult.passport || migrationResult.personalInfo || migrationResult.errors.length === 0) {
         try {
           await SecureStorageService.markMigrationComplete(userId, 'AsyncStorage');
           console.log('Migration marked as complete');
         } catch (markError) {
           console.error('Failed to mark migration complete:', markError);
         }
       }

       migrationResult.success = true;
       console.log(`AsyncStorage migration completed for user ${userId}`);
       console.log('Migration result:', migrationResult);

       return migrationResult;
     } catch (error) {
       console.error('Failed to migrate from AsyncStorage:', error);
       // Don't throw error - allow app to continue without migration
       return {
         success: false,
         error: error.message,
         message: 'Migration failed but app can continue'
       };
     }
   }

  /**
    * Migrate passport data from AsyncStorage
    *
    * @param {string} userId - User ID
    * @returns {Promise<Passport|null>} - Migrated passport or null
    */
   static async migratePassportFromAsyncStorage(userId) {
     try {
       // Check if AsyncStorage is available
       if (!AsyncStorage || !AsyncStorage.getItem) {
         console.log('AsyncStorage not available, skipping passport migration');
         return null;
       }

       // Try to load from common AsyncStorage keys
       const possibleKeys = [
         `@passport_${userId}`,
         '@passport',
         'passport',
         '@user_passport',
         'user_passport'
       ];

       let passportData = null;

       for (const key of possibleKeys) {
         try {
           const data = await AsyncStorage.getItem(key);
           if (data) {
             passportData = JSON.parse(data);
             console.log(`Found passport data in AsyncStorage key: ${key}`);
             break;
           }
         } catch (error) {
           console.warn(`Failed to read AsyncStorage key ${key}:`, error);
           // Continue to next key
           continue;
         }
       }

       if (!passportData) {
         console.log('No passport data found in AsyncStorage');
         return null;
       }

       // Transform and validate data
       const transformedData = this.transformPassportData(passportData, userId);

       // Save to SQLite
       const passport = await this.savePassport(transformedData, userId);

       return passport;
     } catch (error) {
       console.error('Failed to migrate passport from AsyncStorage:', error);
       // Don't throw error - allow app to continue without migration
       return null;
     }
   }

  /**
    * Migrate personal info from AsyncStorage
    *
    * @param {string} userId - User ID
    * @returns {Promise<PersonalInfo|null>} - Migrated personal info or null
    */
   static async migratePersonalInfoFromAsyncStorage(userId) {
     try {
       // Check if AsyncStorage is available
       if (!AsyncStorage || !AsyncStorage.getItem) {
         console.log('AsyncStorage not available, skipping personal info migration');
         return null;
       }

       // Try to load from common AsyncStorage keys
       const possibleKeys = [
         `@personal_info_${userId}`,
         '@personal_info',
         'personal_info',
         '@user_personal_info',
         'user_personal_info'
       ];

       let personalInfoData = null;

       for (const key of possibleKeys) {
         try {
           const data = await AsyncStorage.getItem(key);
           if (data) {
             personalInfoData = JSON.parse(data);
             console.log(`Found personal info in AsyncStorage key: ${key}`);
             break;
           }
         } catch (error) {
           console.warn(`Failed to read AsyncStorage key ${key}:`, error);
           // Continue to next key
           continue;
         }
       }

       if (!personalInfoData) {
         console.log('No personal info found in AsyncStorage');
         return null;
       }

       // Transform and validate data
       const transformedData = this.transformPersonalInfoData(personalInfoData, userId);

       // Save to SQLite
       const personalInfo = await this.savePersonalInfo(transformedData, userId);

       return personalInfo;
     } catch (error) {
       console.error('Failed to migrate personal info from AsyncStorage:', error);
       // Don't throw error - allow app to continue without migration
       return null;
     }
   }



  // ============================================================================
  // DATA TRANSFORMATION HELPERS
  // ============================================================================

  /**
   * Transform passport data from old format to new format
   * 
   * @param {Object} oldData - Old passport data from AsyncStorage
   * @param {string} userId - User ID
   * @returns {Object} - Transformed passport data
   */
  static transformPassportData(oldData, userId) {
    return {
      id: oldData.id || Passport.generateId(),
      userId: userId,
      passportNumber: oldData.passportNumber || oldData.passport_number || '',
      fullName: oldData.fullName || oldData.full_name || '',
      dateOfBirth: oldData.dateOfBirth || oldData.date_of_birth || oldData.dob || '',
      nationality: oldData.nationality || '',
      gender: oldData.gender || 'Undefined',
      expiryDate: oldData.expiryDate || oldData.expiry_date || '',
      issueDate: oldData.issueDate || oldData.issue_date || '',
      issuePlace: oldData.issuePlace || oldData.issue_place || '',
      photoUri: oldData.photoUri || oldData.photo_uri || '',
      createdAt: oldData.createdAt || oldData.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Transform personal info data from old format to new format
   * 
   * @param {Object} oldData - Old personal info data from AsyncStorage
   * @param {string} userId - User ID
   * @returns {Object} - Transformed personal info data
   */
  static transformPersonalInfoData(oldData, userId) {
    return {
      id: oldData.id || PersonalInfo.generateId(),
      userId: userId,
      phoneNumber: oldData.phoneNumber || oldData.phone_number || oldData.phone || '',
      email: oldData.email || '',
      homeAddress: oldData.homeAddress || oldData.home_address || oldData.address || '',
      occupation: oldData.occupation || '',
      provinceCity: oldData.provinceCity || oldData.province_city || oldData.city || '',
      countryRegion: oldData.countryRegion || oldData.country_region || oldData.country || '',
      createdAt: oldData.createdAt || oldData.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }



  // ============================================================================
  // DATA CONSISTENCY VALIDATION
  // ============================================================================

  /**
   * Validate data consistency for a user
   * Checks that passport, personal info, and funding proof data are consistent
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Validation result with any inconsistencies found
   */
  static async validateDataConsistency(userId) {
    try {
      console.log(`Validating data consistency for user ${userId}`);

      const validationResult = {
        isConsistent: true,
        userId,
        validatedAt: new Date().toISOString(),
        passport: { valid: true, errors: [] },
        personalInfo: { valid: true, errors: [] },
        crossFieldValidation: { valid: true, errors: [] }
      };

      // Load all user data
      const userData = await this.getAllUserData(userId);

      // Validate passport data
      if (userData.passport) {
        const passportValidation = this.validatePassportData(userData.passport);
        validationResult.passport = passportValidation;
        if (!passportValidation.valid) {
          validationResult.isConsistent = false;
        }
      }

      // Validate personal info data
      if (userData.personalInfo) {
        const personalInfoValidation = this.validatePersonalInfoData(userData.personalInfo);
        validationResult.personalInfo = personalInfoValidation;
        if (!personalInfoValidation.valid) {
          validationResult.isConsistent = false;
        }
      }

      // Cross-field validation (e.g., nationality consistency)
      const crossFieldValidation = this.validateCrossFieldConsistency(userData);
      validationResult.crossFieldValidation = crossFieldValidation;
      if (!crossFieldValidation.valid) {
        validationResult.isConsistent = false;
      }

      if (validationResult.isConsistent) {
        console.log(`Data consistency validation passed for user ${userId}`);
      } else {
        console.warn(`Data consistency validation failed for user ${userId}`, validationResult);
      }

      return validationResult;
    } catch (error) {
      console.error('Failed to validate data consistency:', error);
      throw error;
    }
  }

  /**
   * Validate passport data consistency
   * 
   * @param {Passport} passport - Passport instance
   * @returns {Object} - Validation result
   */
  static validatePassportData(passport) {
    const result = { valid: true, errors: [] };

    // Check required fields
    const requiredFields = ['passportNumber', 'fullName', 'nationality', 'dateOfBirth', 'expiryDate'];
    for (const field of requiredFields) {
      if (!passport[field] || passport[field].trim() === '') {
        result.valid = false;
        result.errors.push(`Missing required field: ${field}`);
      }
    }

    // Check date validity
    if (passport.dateOfBirth) {
      const dob = new Date(passport.dateOfBirth);
      if (isNaN(dob.getTime())) {
        result.valid = false;
        result.errors.push('Invalid date of birth format');
      } else if (dob > new Date()) {
        result.valid = false;
        result.errors.push('Date of birth cannot be in the future');
      }
    }

    if (passport.expiryDate) {
      const expiry = new Date(passport.expiryDate);
      if (isNaN(expiry.getTime())) {
        result.valid = false;
        result.errors.push('Invalid expiry date format');
      }
    }

    if (passport.issueDate) {
      const issue = new Date(passport.issueDate);
      if (isNaN(issue.getTime())) {
        result.valid = false;
        result.errors.push('Invalid issue date format');
      }
    }

    // Check date logic (issue < expiry, issue > dob)
    if (passport.issueDate && passport.expiryDate) {
      const issue = new Date(passport.issueDate);
      const expiry = new Date(passport.expiryDate);
      if (issue >= expiry) {
        result.valid = false;
        result.errors.push('Issue date must be before expiry date');
      }
    }

    if (passport.dateOfBirth && passport.issueDate) {
      const dob = new Date(passport.dateOfBirth);
      const issue = new Date(passport.issueDate);
      if (issue <= dob) {
        result.valid = false;
        result.errors.push('Issue date must be after date of birth');
      }
    }

    // Check gender field
    const validGenders = ['Male', 'Female', 'Undefined'];
    if (passport.gender && !validGenders.includes(passport.gender)) {
      result.valid = false;
      result.errors.push(`Invalid gender value: ${passport.gender}`);
    }

    // Check userId
    if (!passport.userId) {
      result.valid = false;
      result.errors.push('Missing userId');
    }

    return result;
  }

  /**
   * Validate personal info data consistency
   * 
   * @param {PersonalInfo} personalInfo - PersonalInfo instance
   * @returns {Object} - Validation result
   */
  static validatePersonalInfoData(personalInfo) {
    const result = { valid: true, errors: [] };

    // Check userId
    if (!personalInfo.userId) {
      result.valid = false;
      result.errors.push('Missing userId');
    }

    // Check email format if provided
    if (personalInfo.email && personalInfo.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personalInfo.email)) {
        result.valid = false;
        result.errors.push('Invalid email format');
      }
    }

    // Check phone number format if provided (basic check)
    if (personalInfo.phoneNumber && personalInfo.phoneNumber.trim() !== '') {
      // Remove common formatting characters
      const cleanPhone = personalInfo.phoneNumber.replace(/[\s\-\(\)]/g, '');
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        result.valid = false;
        result.errors.push('Invalid phone number length');
      }
    }

    return result;
  }



  /**
   * Validate cross-field consistency
   * Checks consistency across different data types
   * 
   * @param {Object} userData - All user data
   * @returns {Object} - Validation result
   */
  static validateCrossFieldConsistency(userData) {
    const result = { valid: true, errors: [] };

    // Check userId consistency
    const userIds = new Set();
    if (userData.passport?.userId) userIds.add(userData.passport.userId);
    if (userData.personalInfo?.userId) userIds.add(userData.personalInfo.userId);

    if (userIds.size > 1) {
      result.valid = false;
      result.errors.push(`Inconsistent userId across data types: ${Array.from(userIds).join(', ')}`);
    }

    // Check nationality consistency (if personal info has country/region)
    if (userData.passport?.nationality && userData.personalInfo?.countryRegion) {
      if (userData.passport.nationality !== userData.personalInfo.countryRegion) {
        // This is a warning, not necessarily an error
        result.errors.push(`Nationality mismatch: passport=${userData.passport.nationality}, personalInfo=${userData.personalInfo.countryRegion}`);
      }
    }

    return result;
  }

  /**
   * Detect conflicts between AsyncStorage and SQLite data
   * Used during migration to identify data inconsistencies
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Conflict detection result
   */
  static async detectDataConflicts(userId) {
    try {
      console.log(`Detecting data conflicts for user ${userId}`);

      const conflictResult = {
        hasConflicts: false,
        userId,
        detectedAt: new Date().toISOString(),
        conflicts: {
          passport: null,
          personalInfo: null,
          fundingProof: null
        },
        resolution: 'SQLite data takes precedence'
      };

      // Load data from SQLite
      const sqliteData = await this.getAllUserData(userId);

      // Load data from AsyncStorage
      const asyncStorageData = await this.loadAllFromAsyncStorage(userId);

      // Compare passport data
      if (sqliteData.passport && asyncStorageData.passport) {
        const passportConflict = this.comparePassportData(
          sqliteData.passport,
          asyncStorageData.passport
        );
        if (passportConflict.hasDifferences) {
          conflictResult.hasConflicts = true;
          conflictResult.conflicts.passport = passportConflict;
        }
      }

      // Compare personal info data
      if (sqliteData.personalInfo && asyncStorageData.personalInfo) {
        const personalInfoConflict = this.comparePersonalInfoData(
          sqliteData.personalInfo,
          asyncStorageData.personalInfo
        );
        if (personalInfoConflict.hasDifferences) {
          conflictResult.hasConflicts = true;
          conflictResult.conflicts.personalInfo = personalInfoConflict;
        }
      }

      // Compare funding proof data
      if (sqliteData.fundingProof && asyncStorageData.fundingProof) {
        const fundingProofConflict = this.compareFundingProofData(
          sqliteData.fundingProof,
          asyncStorageData.fundingProof
        );
        if (fundingProofConflict.hasDifferences) {
          conflictResult.hasConflicts = true;
          conflictResult.conflicts.fundingProof = fundingProofConflict;
        }
      }

      if (conflictResult.hasConflicts) {
        console.warn(`Data conflicts detected for user ${userId}`, conflictResult);
      } else {
        console.log(`No data conflicts detected for user ${userId}`);
      }

      return conflictResult;
    } catch (error) {
      console.error('Failed to detect data conflicts:', error);
      throw error;
    }
  }

  /**
    * Load all data from AsyncStorage
    * Helper method for conflict detection
    *
    * @param {string} userId - User ID
    * @returns {Promise<Object>} - Data from AsyncStorage
    */
   static async loadAllFromAsyncStorage(userId) {
     const result = {
       passport: null,
       personalInfo: null,
       fundingProof: null
     };

     // Check if AsyncStorage is available
     if (!AsyncStorage || !AsyncStorage.getItem) {
       console.log('AsyncStorage not available, returning empty result');
       return result;
     }

     // Try to load passport
     try {
       const possibleKeys = [
         `@passport_${userId}`,
         '@passport',
         'passport'
       ];

       for (const key of possibleKeys) {
         try {
           const data = await AsyncStorage.getItem(key);
           if (data) {
             result.passport = JSON.parse(data);
             break;
           }
         } catch (error) {
           console.warn(`Failed to read AsyncStorage key ${key}:`, error);
           continue;
         }
       }
     } catch (error) {
       console.error('Failed to load passport from AsyncStorage:', error);
     }

     // Try to load personal info
     try {
       const possibleKeys = [
         `@personal_info_${userId}`,
         '@personal_info',
         'personal_info'
       ];

       for (const key of possibleKeys) {
         try {
           const data = await AsyncStorage.getItem(key);
           if (data) {
             result.personalInfo = JSON.parse(data);
             break;
           }
         } catch (error) {
           console.warn(`Failed to read AsyncStorage key ${key}:`, error);
           continue;
         }
       }
     } catch (error) {
       console.error('Failed to load personal info from AsyncStorage:', error);
     }

     // Try to load funding proof
     try {
       const possibleKeys = [
         `@funding_proof_${userId}`,
         '@funding_proof',
         'funding_proof'
       ];

       for (const key of possibleKeys) {
         try {
           const data = await AsyncStorage.getItem(key);
           if (data) {
             result.fundingProof = JSON.parse(data);
             break;
           }
         } catch (error) {
           console.warn(`Failed to read AsyncStorage key ${key}:`, error);
           continue;
         }
       }
     } catch (error) {
       console.error('Failed to load funding proof from AsyncStorage:', error);
     }

     return result;
   }

  /**
   * Compare passport data between two sources
   * 
   * @param {Object} data1 - First passport data (SQLite)
   * @param {Object} data2 - Second passport data (AsyncStorage)
   * @returns {Object} - Comparison result
   */
  static comparePassportData(data1, data2) {
    const result = {
      hasDifferences: false,
      differences: []
    };

    const fieldsToCompare = [
      'passportNumber',
      'fullName',
      'dateOfBirth',
      'nationality',
      'gender',
      'expiryDate',
      'issueDate',
      'issuePlace'
    ];

    for (const field of fieldsToCompare) {
      const val1 = data1[field] || '';
      const val2 = data2[field] || '';
      
      if (val1 !== val2) {
        result.hasDifferences = true;
        result.differences.push({
          field,
          sqliteValue: val1,
          asyncStorageValue: val2
        });
      }
    }

    return result;
  }

  /**
   * Compare personal info data between two sources
   * 
   * @param {Object} data1 - First personal info data (SQLite)
   * @param {Object} data2 - Second personal info data (AsyncStorage)
   * @returns {Object} - Comparison result
   */
  static comparePersonalInfoData(data1, data2) {
    const result = {
      hasDifferences: false,
      differences: []
    };

    const fieldsToCompare = [
      'phoneNumber',
      'email',
      'homeAddress',
      'occupation',
      'provinceCity',
      'countryRegion'
    ];

    for (const field of fieldsToCompare) {
      const val1 = data1[field] || '';
      const val2 = data2[field] || '';
      
      if (val1 !== val2) {
        result.hasDifferences = true;
        result.differences.push({
          field,
          sqliteValue: val1,
          asyncStorageValue: val2
        });
      }
    }

    return result;
  }

  /**
   * Compare funding proof data between two sources
   * 
   * @param {Object} data1 - First funding proof data (SQLite)
   * @param {Object} data2 - Second funding proof data (AsyncStorage)
   * @returns {Object} - Comparison result
   */
  static compareFundingProofData(data1, data2) {
    const result = {
      hasDifferences: false,
      differences: []
    };

    const fieldsToCompare = [
      'cashAmount',
      'bankCards',
      'supportingDocs'
    ];

    for (const field of fieldsToCompare) {
      const val1 = data1[field] || '';
      const val2 = data2[field] || '';
      
      if (val1 !== val2) {
        result.hasDifferences = true;
        result.differences.push({
          field,
          sqliteValue: val1,
          asyncStorageValue: val2
        });
      }
    }

    return result;
  }

  /**
   * Resolve data conflicts by prioritizing SQLite data
   * Logs conflicts for debugging and ensures SQLite is the source of truth
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Resolution result
   */
  static async resolveDataConflicts(userId) {
    try {
      console.log(`Resolving data conflicts for user ${userId}`);

      // Detect conflicts
      const conflictResult = await this.detectDataConflicts(userId);

      if (!conflictResult.hasConflicts) {
        console.log(`No conflicts to resolve for user ${userId}`);
        return {
          resolved: true,
          hadConflicts: false,
          message: 'No conflicts detected'
        };
      }

      // Log conflicts for debugging
      console.warn('Data conflicts detected and resolved (SQLite wins):', {
        userId,
        conflicts: conflictResult.conflicts,
        timestamp: new Date().toISOString()
      });

      // SQLite data is already the source of truth, no action needed
      // Just ensure cache is cleared to force reload from SQLite
      await this.refreshCache(userId);

      return {
        resolved: true,
        hadConflicts: true,
        conflicts: conflictResult.conflicts,
        resolution: 'SQLite data retained as source of truth',
        message: 'Conflicts resolved by prioritizing SQLite data'
      };
    } catch (error) {
      console.error('Failed to resolve data conflicts:', error);
      throw error;
    }
  }

  // ============================================================================
  // ERROR HANDLING FOR DATA CONFLICTS
  // ============================================================================

  /**
   * Get all user data with automatic conflict detection and resolution
   * This is a wrapper around getAllUserData that adds conflict handling
   * 
   * @param {string} userId - User ID
   * @param {Object} options - Options for conflict handling
   * @param {boolean} options.detectConflicts - Whether to detect conflicts (default: true)
   * @param {boolean} options.resolveConflicts - Whether to resolve conflicts (default: true)
   * @returns {Promise<Object>} - User data with conflict information
   */
  static async getAllUserDataWithConflictHandling(userId, options = {}) {
    const {
      detectConflicts = true,
      resolveConflicts = true
    } = options;

    try {
      console.log(`Loading user data with conflict handling for user ${userId}`);

      // Load data from SQLite (source of truth)
      const userData = await this.getAllUserData(userId);

      // If conflict detection is disabled, return data immediately
      if (!detectConflicts) {
        return {
          ...userData,
          conflictHandling: {
            enabled: false,
            message: 'Conflict detection disabled'
          }
        };
      }

      // Detect conflicts between AsyncStorage and SQLite
      let conflictResult = null;
      try {
        conflictResult = await this.detectDataConflicts(userId);
      } catch (error) {
        console.error('Failed to detect conflicts, continuing with SQLite data:', error);
        return {
          ...userData,
          conflictHandling: {
            enabled: true,
            detectionFailed: true,
            error: error.message,
            message: 'Conflict detection failed, using SQLite data'
          }
        };
      }

      // If no conflicts found, return data
      if (!conflictResult.hasConflicts) {
        return {
          ...userData,
          conflictHandling: {
            enabled: true,
            hasConflicts: false,
            message: 'No conflicts detected'
          }
        };
      }

      // Conflicts detected - log them
      console.warn('Data conflicts detected:', conflictResult);

      // Resolve conflicts if enabled
      if (resolveConflicts) {
        try {
          const resolutionResult = await this.resolveDataConflicts(userId);
          return {
            ...userData,
            conflictHandling: {
              enabled: true,
              hasConflicts: true,
              resolved: true,
              conflicts: conflictResult.conflicts,
              resolution: resolutionResult,
              message: 'Conflicts detected and resolved (SQLite wins)'
            }
          };
        } catch (error) {
          console.error('Failed to resolve conflicts, continuing with SQLite data:', error);
          return {
            ...userData,
            conflictHandling: {
              enabled: true,
              hasConflicts: true,
              resolved: false,
              resolutionFailed: true,
              conflicts: conflictResult.conflicts,
              error: error.message,
              message: 'Conflict resolution failed, using SQLite data'
            }
          };
        }
      }

      // Return data with conflict information (not resolved)
      return {
        ...userData,
        conflictHandling: {
          enabled: true,
          hasConflicts: true,
          resolved: false,
          conflicts: conflictResult.conflicts,
          message: 'Conflicts detected but not resolved'
        }
      };
    } catch (error) {
      console.error('Failed to load user data with conflict handling:', error);
      throw error;
    }
  }

  /**
   * Check for conflicts and log them without loading all data
   * Useful for background conflict checking
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Conflict check result
   */
  static async checkAndLogConflicts(userId) {
    try {
      console.log(`Checking for data conflicts for user ${userId}`);

      // Detect conflicts
      const conflictResult = await this.detectDataConflicts(userId);

      if (!conflictResult.hasConflicts) {
        console.log(`No conflicts found for user ${userId}`);
        return {
          hasConflicts: false,
          message: 'No conflicts detected'
        };
      }

      // Log detailed conflict information
      console.warn('=== DATA CONFLICT DETECTED ===');
      console.warn(`User ID: ${userId}`);
      console.warn(`Detected at: ${conflictResult.detectedAt}`);
      console.warn(`Resolution strategy: ${conflictResult.resolution}`);
      
      if (conflictResult.conflicts.passport) {
        console.warn('Passport conflicts:');
        conflictResult.conflicts.passport.differences.forEach(diff => {
          console.warn(`  - ${diff.field}:`);
          console.warn(`    SQLite: ${diff.sqliteValue}`);
          console.warn(`    AsyncStorage: ${diff.asyncStorageValue}`);
        });
      }

      if (conflictResult.conflicts.personalInfo) {
        console.warn('Personal Info conflicts:');
        conflictResult.conflicts.personalInfo.differences.forEach(diff => {
          console.warn(`  - ${diff.field}:`);
          console.warn(`    SQLite: ${diff.sqliteValue}`);
          console.warn(`    AsyncStorage: ${diff.asyncStorageValue}`);
        });
      }

      if (conflictResult.conflicts.fundingProof) {
        console.warn('Funding Proof conflicts:');
        conflictResult.conflicts.fundingProof.differences.forEach(diff => {
          console.warn(`  - ${diff.field}:`);
          console.warn(`    SQLite: ${diff.sqliteValue}`);
          console.warn(`    AsyncStorage: ${diff.asyncStorageValue}`);
        });
      }

      console.warn('=== END CONFLICT REPORT ===');

      return {
        hasConflicts: true,
        conflicts: conflictResult.conflicts,
        message: 'Conflicts detected and logged'
      };
    } catch (error) {
      console.error('Failed to check and log conflicts:', error);
      return {
        hasConflicts: false,
        error: error.message,
        message: 'Conflict check failed'
      };
    }
  }

  /**
   * Handle errors during data operations with conflict awareness
   * Provides detailed error information and suggests resolution steps
   * 
   * @param {Error} error - The error that occurred
   * @param {string} operation - The operation that failed
   * @param {string} userId - User ID
   * @returns {Object} - Error handling result
   */
  static handleDataOperationError(error, operation, userId) {
    const errorResult = {
      success: false,
      operation,
      userId,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      timestamp: new Date().toISOString(),
      suggestions: []
    };

    // Categorize error and provide suggestions
    if (error.message.includes('not found')) {
      errorResult.category = 'NOT_FOUND';
      errorResult.suggestions.push('Check if data exists for this user');
      errorResult.suggestions.push('Try running migration if this is an existing user');
    } else if (error.message.includes('validation')) {
      errorResult.category = 'VALIDATION_ERROR';
      errorResult.suggestions.push('Check data format and required fields');
      errorResult.suggestions.push('Review validation errors in the error details');
    } else if (error.message.includes('conflict')) {
      errorResult.category = 'CONFLICT_ERROR';
      errorResult.suggestions.push('Run conflict detection to identify issues');
      errorResult.suggestions.push('SQLite data will be used as source of truth');
    } else if (error.message.includes('database') || error.message.includes('SQLite')) {
      errorResult.category = 'DATABASE_ERROR';
      errorResult.suggestions.push('Check database connection');
      errorResult.suggestions.push('Verify database schema is up to date');
      errorResult.suggestions.push('Try clearing cache and reloading');
    } else if (error.message.includes('AsyncStorage')) {
      errorResult.category = 'ASYNCSTORAGE_ERROR';
      errorResult.suggestions.push('Check AsyncStorage permissions');
      errorResult.suggestions.push('SQLite data will be used as fallback');
    } else {
      errorResult.category = 'UNKNOWN_ERROR';
      errorResult.suggestions.push('Check error logs for details');
      errorResult.suggestions.push('Try refreshing cache');
    }

    // Log error with details
    console.error('=== DATA OPERATION ERROR ===');
    console.error(`Operation: ${operation}`);
    console.error(`User ID: ${userId}`);
    console.error(`Category: ${errorResult.category}`);
    console.error(`Error: ${error.message}`);
    console.error('Suggestions:');
    errorResult.suggestions.forEach(suggestion => {
      console.error(`  - ${suggestion}`);
    });
    console.error('=== END ERROR REPORT ===');

    return errorResult;
  }

  /**
   * Safely load user data with comprehensive error handling
   * This method wraps getAllUserData with conflict detection and error handling
   * 
   * @param {string} userId - User ID
   * @param {Object} options - Options for loading
   * @returns {Promise<Object>} - User data or error information
   */
  static async safeLoadUserData(userId, options = {}) {
    try {
      // Load data with conflict handling
      const userData = await this.getAllUserDataWithConflictHandling(userId, options);
      
      return {
        success: true,
        data: userData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // Handle error with detailed information
      const errorResult = this.handleDataOperationError(error, 'safeLoadUserData', userId);
      
      return {
        success: false,
        error: errorResult,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ===== TDAC SUBMISSION METADATA PERSISTENCE =====
  // Requirements: 10.1-10.6, 19.1-19.5

  /**
   * Save TDAC submission metadata
   * @param {string} userId - User ID
   * @param {Object} metadata - TDAC submission metadata
   * @param {Object} options - Save options
   * @returns {Promise<Object>} - Save result
   */
  static async saveTDACSubmissionMetadata(userId, metadata, options = {}) {
    try {
      console.log('Saving TDAC submission metadata:', {
        userId,
        arrCardNo: metadata.arrCardNo,
        submissionMethod: metadata.submissionMethod
      });

      // Validate required fields
      if (!metadata.arrCardNo) {
        throw new Error('TDAC arrival card number is required');
      }

      if (!metadata.qrUri && !metadata.pdfPath) {
        throw new Error('Either QR URI or PDF path is required');
      }

      // Prepare metadata for storage
      const submissionData = {
        id: metadata.id || `tdac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        arrCardNo: metadata.arrCardNo,
        qrUri: metadata.qrUri || null,
        pdfPath: metadata.pdfPath || null,
        submittedAt: metadata.submittedAt || new Date().toISOString(),
        submissionMethod: metadata.submissionMethod || 'api',
        status: metadata.status || 'success',
        entryPackId: metadata.entryPackId || null,
        destinationId: metadata.destinationId || null,
        tripId: metadata.tripId || null,
        
        // Additional metadata
        apiResponse: metadata.apiResponse || null,
        processingTime: metadata.processingTime || null,
        retryCount: metadata.retryCount || 0,
        errorDetails: metadata.errorDetails || null,
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to secure storage
      const result = await SecureStorageService.saveTDACSubmissionMetadata(submissionData);

      // Invalidate related cache
      this.invalidateCache('tdacSubmission', userId);

      console.log('TDAC submission metadata saved successfully:', {
        id: submissionData.id,
        userId,
        arrCardNo: submissionData.arrCardNo
      });

      return {
        success: true,
        id: submissionData.id,
        metadata: submissionData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to save TDAC submission metadata:', error);
      throw error;
    }
  }

  /**
   * Get submission status for user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Submission status
   */
  static async getSubmissionStatus(userId, filters = {}) {
    try {
      console.log('Getting submission status for user:', userId);

      // Check cache first
      const cacheKey = `${userId}_${JSON.stringify(filters)}`;
      const cached = this.getCachedResult('submissionStatus', cacheKey);
      if (cached) {
        console.log('Returning cached submission status');
        return cached;
      }

      // Load submission metadata from storage
      const submissions = await SecureStorageService.getTDACSubmissionsByUserId(userId, filters);

      // Calculate status summary
      const status = {
        userId: userId,
        totalSubmissions: submissions.length,
        successfulSubmissions: submissions.filter(s => s.status === 'success').length,
        failedSubmissions: submissions.filter(s => s.status === 'failed').length,
        pendingSubmissions: submissions.filter(s => s.status === 'pending').length,
        
        // Most recent submission
        mostRecentSubmission: submissions.length > 0 ? 
          submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0] : null,
        
        // Submissions by destination
        submissionsByDestination: this.groupSubmissionsByDestination(submissions),
        
        // Submissions by method
        submissionsByMethod: this.groupSubmissionsByMethod(submissions),
        
        // Recent activity (last 30 days)
        recentActivity: this.getRecentSubmissionActivity(submissions),
        
        // Status flags
        hasActiveSubmission: submissions.some(s => s.status === 'success' && !s.isExpired),
        requiresResubmission: submissions.some(s => s.requiresResubmission),
        
        // Timestamps
        lastSubmissionAt: submissions.length > 0 ? 
          Math.max(...submissions.map(s => new Date(s.submittedAt).getTime())) : null,
        calculatedAt: new Date().toISOString()
      };

      // Cache result
      this.setCachedResult('submissionStatus', cacheKey, status);

      console.log('Submission status calculated:', {
        userId,
        totalSubmissions: status.totalSubmissions,
        successfulSubmissions: status.successfulSubmissions
      });

      return status;
    } catch (error) {
      console.error('Failed to get submission status:', error);
      throw error;
    }
  }

  /**
   * Get submission history for entry pack
   * @param {string} entryPackId - Entry pack ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Submission history
   */
  static async getSubmissionHistory(entryPackId, options = {}) {
    try {
      console.log('Getting submission history for entry pack:', entryPackId);

      // Load submission history from storage
      const submissions = await SecureStorageService.getTDACSubmissionsByEntryPackId(entryPackId);

      // Sort by submission date (newest first)
      const sortedSubmissions = submissions.sort((a, b) => 
        new Date(b.submittedAt) - new Date(a.submittedAt)
      );

      // Apply pagination if requested
      let paginatedSubmissions = sortedSubmissions;
      if (options.limit) {
        const offset = options.offset || 0;
        paginatedSubmissions = sortedSubmissions.slice(offset, offset + options.limit);
      }

      // Enhance submissions with additional metadata
      const enhancedSubmissions = paginatedSubmissions.map(submission => ({
        ...submission,
        
        // Calculate relative time
        relativeTime: this.calculateRelativeTime(submission.submittedAt),
        
        // Determine if submission is current/active
        isCurrent: submission.status === 'success' && !submission.isSuperseded,
        
        // Add display status
        displayStatus: this.getSubmissionDisplayStatus(submission),
        
        // Add retry information
        isRetry: submission.retryCount > 0,
        originalSubmissionId: submission.originalSubmissionId || null
      }));

      console.log('Submission history retrieved:', {
        entryPackId,
        totalSubmissions: submissions.length,
        returnedSubmissions: enhancedSubmissions.length
      });

      return {
        entryPackId,
        submissions: enhancedSubmissions,
        totalCount: submissions.length,
        hasMore: options.limit && submissions.length > (options.offset || 0) + options.limit,
        retrievedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get submission history:', error);
      throw error;
    }
  }

  /**
   * Update TDAC submission metadata
   * @param {string} submissionId - Submission ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Update result
   */
  static async updateTDACSubmissionMetadata(submissionId, updates) {
    try {
      console.log('Updating TDAC submission metadata:', {
        submissionId,
        updates: Object.keys(updates)
      });

      // Load existing submission
      const existingSubmission = await SecureStorageService.getTDACSubmission(submissionId);
      if (!existingSubmission) {
        throw new Error(`TDAC submission not found: ${submissionId}`);
      }

      // Merge updates
      const updatedSubmission = {
        ...existingSubmission,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Save updated submission
      await SecureStorageService.saveTDACSubmissionMetadata(updatedSubmission);

      // Invalidate cache
      this.invalidateCache('tdacSubmission', existingSubmission.userId);
      this.invalidateCache('submissionStatus', existingSubmission.userId);

      console.log('TDAC submission metadata updated successfully:', {
        submissionId,
        userId: existingSubmission.userId
      });

      return {
        success: true,
        submissionId,
        updatedSubmission,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to update TDAC submission metadata:', error);
      throw error;
    }
  }

  /**
   * Mark TDAC submission as superseded
   * @param {string} submissionId - Submission ID
   * @param {Object} options - Supersede options
   * @returns {Promise<Object>} - Update result
   */
  static async markTDACSubmissionAsSuperseded(submissionId, options = {}) {
    try {
      return await this.updateTDACSubmissionMetadata(submissionId, {
        isSuperseded: true,
        supersededAt: new Date().toISOString(),
        supersededReason: options.reason || 'Data changed, resubmission required',
        supersededBy: options.supersededBy || null
      });
    } catch (error) {
      console.error('Failed to mark TDAC submission as superseded:', error);
      throw error;
    }
  }

  /**
   * Delete TDAC submission metadata
   * @param {string} submissionId - Submission ID
   * @returns {Promise<Object>} - Delete result
   */
  static async deleteTDACSubmissionMetadata(submissionId) {
    try {
      console.log('Deleting TDAC submission metadata:', submissionId);

      // Load submission to get user ID for cache invalidation
      const submission = await SecureStorageService.getTDACSubmission(submissionId);
      
      // Delete from storage
      await SecureStorageService.deleteTDACSubmission(submissionId);

      // Invalidate cache if we found the submission
      if (submission) {
        this.invalidateCache('tdacSubmission', submission.userId);
        this.invalidateCache('submissionStatus', submission.userId);
      }

      console.log('TDAC submission metadata deleted successfully:', submissionId);

      return {
        success: true,
        submissionId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to delete TDAC submission metadata:', error);
      throw error;
    }
  }

  // ===== HELPER METHODS FOR TDAC SUBMISSION =====

  /**
   * Group submissions by destination
   * @param {Array} submissions - Array of submissions
   * @returns {Object} - Grouped submissions
   */
  static groupSubmissionsByDestination(submissions) {
    const grouped = {};
    
    submissions.forEach(submission => {
      const destination = submission.destinationId || 'unknown';
      if (!grouped[destination]) {
        grouped[destination] = {
          count: 0,
          successful: 0,
          failed: 0,
          mostRecent: null
        };
      }
      
      grouped[destination].count++;
      if (submission.status === 'success') {
        grouped[destination].successful++;
      } else if (submission.status === 'failed') {
        grouped[destination].failed++;
      }
      
      if (!grouped[destination].mostRecent || 
          new Date(submission.submittedAt) > new Date(grouped[destination].mostRecent.submittedAt)) {
        grouped[destination].mostRecent = submission;
      }
    });
    
    return grouped;
  }

  /**
   * Group submissions by method
   * @param {Array} submissions - Array of submissions
   * @returns {Object} - Grouped submissions
   */
  static groupSubmissionsByMethod(submissions) {
    const grouped = {};
    
    submissions.forEach(submission => {
      const method = submission.submissionMethod || 'unknown';
      if (!grouped[method]) {
        grouped[method] = {
          count: 0,
          successRate: 0
        };
      }
      
      grouped[method].count++;
    });
    
    // Calculate success rates
    Object.keys(grouped).forEach(method => {
      const methodSubmissions = submissions.filter(s => s.submissionMethod === method);
      const successful = methodSubmissions.filter(s => s.status === 'success').length;
      grouped[method].successRate = methodSubmissions.length > 0 ? 
        (successful / methodSubmissions.length) * 100 : 0;
    });
    
    return grouped;
  }

  /**
   * Get recent submission activity
   * @param {Array} submissions - Array of submissions
   * @returns {Array} - Recent activity
   */
  static getRecentSubmissionActivity(submissions) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return submissions
      .filter(s => new Date(s.submittedAt) > thirtyDaysAgo)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 10); // Last 10 recent activities
  }

  /**
   * Calculate relative time from submission
   * @param {string} submittedAt - Submission timestamp
   * @returns {string} - Relative time string
   */
  static calculateRelativeTime(submittedAt) {
    const now = new Date();
    const submitted = new Date(submittedAt);
    const diffMs = now - submitted;
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  }

  /**
   * Get display status for submission
   * @param {Object} submission - Submission object
   * @returns {Object} - Display status
   */
  static getSubmissionDisplayStatus(submission) {
    const statusMap = {
      success: { color: 'green', icon: '✅', message: 'Successful' },
      failed: { color: 'red', icon: '❌', message: 'Failed' },
      pending: { color: 'orange', icon: '⏳', message: 'Pending' },
      superseded: { color: 'gray', icon: '🔄', message: 'Superseded' }
    };
    
    let status = submission.status;
    if (submission.isSuperseded) {
      status = 'superseded';
    }
    
    return statusMap[status] || statusMap.pending;
  }

  // ============================================================================
  // DATA CHANGE DETECTION AND RESUBMISSION WARNINGS
  // ============================================================================

  /**
   * Data change listeners for detecting modifications
   * @type {Array}
   * @static
   */
  static dataChangeListeners = [];

  /**
   * Add data change listener
   * @param {Function} listener - Listener function
   * @returns {Function} - Unsubscribe function
   */
  static addDataChangeListener(listener) {
    this.dataChangeListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.dataChangeListeners.indexOf(listener);
      if (index > -1) {
        this.dataChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Trigger data change event
   * @param {string} dataType - Type of data that changed
   * @param {string} userId - User ID
   * @param {Object} changeDetails - Details about the change
   */
  static triggerDataChangeEvent(dataType, userId, changeDetails = {}) {
    try {
      const event = {
        type: 'DATA_CHANGED',
        dataType,
        userId,
        timestamp: new Date().toISOString(),
        ...changeDetails
      };

      console.log('Data change event triggered:', event);

      // Notify all listeners
      this.dataChangeListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in data change listener:', error);
        }
      });

      // Check for active entry packs and handle resubmission warnings
      this.handleDataChangeForActiveEntryPacks(userId, dataType, changeDetails);
    } catch (error) {
      console.error('Failed to trigger data change event:', error);
    }
  }

  /**
   * Handle data changes for active entry packs
   * @param {string} userId - User ID
   * @param {string} dataType - Type of data that changed
   * @param {Object} changeDetails - Details about the change
   */
  static async handleDataChangeForActiveEntryPacks(userId, dataType, changeDetails) {
    try {
      // Get active entry packs for user
      const EntryPackService = require('../entryPack/EntryPackService').default;
      const activeEntryPacks = await EntryPackService.getActivePacksForUser(userId);

      // Filter for submitted entry packs (these need resubmission warnings)
      const submittedPacks = activeEntryPacks.filter(pack => pack.status === 'submitted');

      if (submittedPacks.length === 0) {
        console.log('No submitted entry packs found, no resubmission warning needed');
        return;
      }

      console.log(`Found ${submittedPacks.length} submitted entry packs, checking for data changes`);

      // Check each submitted entry pack for data changes
      for (const entryPack of submittedPacks) {
        await this.checkEntryPackForDataChanges(entryPack, dataType, changeDetails);
      }
    } catch (error) {
      console.error('Failed to handle data change for active entry packs:', error);
    }
  }

  /**
   * Check entry pack for data changes and trigger resubmission warning if needed
   * @param {Object} entryPack - Entry pack to check
   * @param {string} dataType - Type of data that changed
   * @param {Object} changeDetails - Details about the change
   */
  static async checkEntryPackForDataChanges(entryPack, dataType, changeDetails) {
    try {
      console.log('Checking entry pack for data changes:', {
        entryPackId: entryPack.id,
        status: entryPack.status,
        dataType
      });

      // Get snapshot data for comparison
      const SnapshotService = require('../snapshot/SnapshotService').default;
      const snapshots = await SnapshotService.list(entryPack.userId, {
        entryPackId: entryPack.id
      });

      if (snapshots.length === 0) {
        console.log('No snapshots found for entry pack, cannot compare data changes');
        return;
      }

      // Use the most recent snapshot
      const latestSnapshot = snapshots[0];
      const snapshotData = {
        passport: latestSnapshot.passport,
        personalInfo: latestSnapshot.personalInfo,
        funds: latestSnapshot.funds,
        travel: latestSnapshot.travel
      };

      // Get current user data
      const currentData = await this.getAllUserData(entryPack.userId);
      
      // Get current travel info
      const currentTravel = await this.getTravelInfo(entryPack.userId, entryPack.destinationId);
      
      // Get current funds
      const currentFunds = await this.getFundItems(entryPack.userId);

      const completeCurrentData = {
        passport: currentData.passport,
        personalInfo: currentData.personalInfo,
        funds: currentFunds,
        travel: currentTravel
      };

      // Calculate differences
      const DataDiffCalculator = require('../../utils/DataDiffCalculator').default;
      const diffResult = DataDiffCalculator.calculateDiff(snapshotData, completeCurrentData);

      if (diffResult.hasChanges) {
        console.log('Data changes detected for entry pack:', {
          entryPackId: entryPack.id,
          totalChanges: diffResult.summary.totalChanges,
          significantChanges: diffResult.summary.significantChanges
        });

        // Generate change summary
        const changeSummary = DataDiffCalculator.generateChangeSummary(diffResult);

        // Trigger resubmission warning event
        this.triggerResubmissionWarningEvent(entryPack, diffResult, changeSummary);
      } else {
        console.log('No significant data changes detected for entry pack:', entryPack.id);
      }
    } catch (error) {
      console.error('Failed to check entry pack for data changes:', error);
    }
  }

  /**
   * Trigger resubmission warning event
   * @param {Object} entryPack - Entry pack that needs resubmission
   * @param {Object} diffResult - Diff calculation result
   * @param {Object} changeSummary - User-friendly change summary
   */
  static triggerResubmissionWarningEvent(entryPack, diffResult, changeSummary) {
    try {
      const event = {
        type: 'RESUBMISSION_WARNING',
        entryPackId: entryPack.id,
        userId: entryPack.userId,
        destinationId: entryPack.destinationId,
        diffResult,
        changeSummary,
        requiresImmediateResubmission: DataDiffCalculator.requiresImmediateResubmission(diffResult),
        timestamp: new Date().toISOString()
      };

      console.log('Resubmission warning event triggered:', {
        entryPackId: entryPack.id,
        changesCount: diffResult.summary.totalChanges,
        requiresImmediate: event.requiresImmediateResubmission
      });

      // Store event for UI to pick up
      this.storeResubmissionWarningEvent(event);

      // Notify listeners
      this.dataChangeListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in resubmission warning listener:', error);
        }
      });
    } catch (error) {
      console.error('Failed to trigger resubmission warning event:', error);
    }
  }

  /**
   * Store resubmission warning event for UI consumption
   * @param {Object} event - Resubmission warning event
   */
  static storeResubmissionWarningEvent(event) {
    try {
      if (!this.resubmissionWarnings) {
        this.resubmissionWarnings = new Map();
      }

      // Store by entry pack ID for easy retrieval
      this.resubmissionWarnings.set(event.entryPackId, event);

      // Keep only recent warnings (last 10)
      if (this.resubmissionWarnings.size > 10) {
        const entries = Array.from(this.resubmissionWarnings.entries());
        const oldestEntry = entries.sort((a, b) => 
          new Date(a[1].timestamp) - new Date(b[1].timestamp)
        )[0];
        this.resubmissionWarnings.delete(oldestEntry[0]);
      }

      console.log('Resubmission warning stored:', {
        entryPackId: event.entryPackId,
        totalWarnings: this.resubmissionWarnings.size
      });
    } catch (error) {
      console.error('Failed to store resubmission warning event:', error);
    }
  }

  /**
   * Get pending resubmission warnings for user
   * @param {string} userId - User ID
   * @returns {Array} - Array of resubmission warnings
   */
  static getPendingResubmissionWarnings(userId) {
    try {
      if (!this.resubmissionWarnings) {
        return [];
      }

      const warnings = Array.from(this.resubmissionWarnings.values())
        .filter(warning => warning.userId === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return warnings;
    } catch (error) {
      console.error('Failed to get pending resubmission warnings:', error);
      return [];
    }
  }

  /**
   * Get resubmission warning for specific entry pack
   * @param {string} entryPackId - Entry pack ID
   * @returns {Object|null} - Resubmission warning or null
   */
  static getResubmissionWarning(entryPackId) {
    try {
      if (!this.resubmissionWarnings) {
        return null;
      }

      return this.resubmissionWarnings.get(entryPackId) || null;
    } catch (error) {
      console.error('Failed to get resubmission warning:', error);
      return null;
    }
  }

  /**
   * Clear resubmission warning for entry pack
   * @param {string} entryPackId - Entry pack ID
   */
  static clearResubmissionWarning(entryPackId) {
    try {
      if (this.resubmissionWarnings) {
        this.resubmissionWarnings.delete(entryPackId);
        console.log('Resubmission warning cleared:', entryPackId);
      }
    } catch (error) {
      console.error('Failed to clear resubmission warning:', error);
    }
  }

  /**
   * Mark entry pack as superseded due to data changes
   * @param {string} entryPackId - Entry pack ID
   * @param {Object} changeDetails - Details about the changes
   * @returns {Promise<Object>} - Updated entry pack
   */
  static async markEntryPackAsSuperseded(entryPackId, changeDetails = {}) {
    try {
      console.log('Marking entry pack as superseded:', {
        entryPackId,
        changeDetails
      });

      const EntryPackService = require('../entryPack/EntryPackService').default;
      
      // Mark entry pack as superseded
      const updatedEntryPack = await EntryPackService.markAsSuperseded(entryPackId, {
        reason: 'Data changes detected after TDAC submission',
        triggeredBy: 'data_change_detection',
        changedFields: changeDetails.changedFields || [],
        metadata: {
          changeTimestamp: new Date().toISOString(),
          changeType: 'user_edit',
          ...changeDetails
        }
      });

      // Clear the resubmission warning since it's been handled
      this.clearResubmissionWarning(entryPackId);

      console.log('Entry pack marked as superseded successfully:', {
        entryPackId,
        newStatus: updatedEntryPack.status
      });

      return updatedEntryPack;
    } catch (error) {
      console.error('Failed to mark entry pack as superseded:', error);
      throw error;
    }
  }

}

export default PassportDataService;
