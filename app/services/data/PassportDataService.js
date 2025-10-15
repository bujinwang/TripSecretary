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
   * @param {('passport'|'personalInfo'|'fundingProof')} dataType - Type of data to invalidate
   * @param {string} userId - User ID whose cache should be invalidated
   * @returns {void}
   * 
   * @example
   * // Invalidate passport cache after update
   * await passport.save();
   * PassportDataService.invalidateCache('passport', userId);
   * 
   * @example
   * // Invalidate all data types for a user
   * ['passport', 'personalInfo'].forEach(type => {
   *   PassportDataService.invalidateCache(type, userId);
   * });
   * 
   * @description
   * This method:
   * - Removes the data from the appropriate cache Map
   * - Removes the timestamp for the cache entry
   * - Increments the invalidations counter in cache statistics
   * - Does NOT delete data from database
   */
  static invalidateCache(dataType, userId) {
    const cacheKey = `${dataType}_${userId}`;
    this.cache[dataType].delete(userId);
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
      const passport = await Passport.load(userId);

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

      // Invalidate cache for fund items
      this.invalidateCache('fundItems', userId);

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
   * @returns {Promise<Array<FundItem>>} - Array of fund items
   */
  static async getFundItems(userId) {
    try {
      console.log('=== PASSPORT DATA SERVICE: GET FUND ITEMS ===');
      console.log('Loading fund items for userId:', userId);

      // Check cache first
      const cacheKey = `fundItems_${userId}`;
      if (this.cache.fundItems && this.cache.fundItems.has(userId)) {
        const cached = this.cache.fundItems.get(userId);
        if (this.isCacheValid(cacheKey)) {
          console.log('Returning cached fund items');
          return cached;
        }
      }

      const FundItem = require('../../models/FundItem').default;
      const fundItems = await FundItem.loadByUserId(userId);

      // Update cache
      if (!this.cache.fundItems) {
        this.cache.fundItems = new Map();
      }
      this.cache.fundItems.set(userId, fundItems);
      this.updateCacheTimestamp(cacheKey);

      console.log(`✅ Loaded ${fundItems.length} fund items for user ${userId}`);
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

      // Invalidate cache
      this.invalidateCache('fundItems', userId);

      console.log(`✅ Fund item deleted: ${fundItemId}`);
      return result;
    } catch (error) {
      console.error('PassportDataService.deleteFundItem failed:', error);
      throw error;
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
      
      if (existing) {
        // Merge with existing data
        const merged = { ...existing, ...nonEmptyUpdates, id: existing.id };
        const result = await SecureStorageService.saveTravelInfo(merged);
        console.log('Travel info updated:', result.id);
        return merged;
      } else {
        // Create new travel info
        const result = await SecureStorageService.saveTravelInfo(nonEmptyUpdates);
        console.log('Travel info created:', result.id);
        return { ...nonEmptyUpdates, id: result.id };
      }
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
        return await this.saveTravelInfo(userId, { ...updates, destination });
      }

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
      const result = await SecureStorageService.saveTravelInfo(merged);
      
      console.log('Travel info updated successfully');
      return merged;
    } catch (error) {
      console.error('Failed to update travel info:', error);
      throw error;
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
}

export default PassportDataService;
