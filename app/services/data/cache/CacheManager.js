/**
 * @fileoverview CacheManager - Cache management logic with TTL support
 *
 * Provides cache validation, invalidation, and TTL management.
 * Works with CacheStore to manage cached data lifecycle.
 *
 * @module app/services/data/cache/CacheManager
 */

import CacheStore from './CacheStore';

/**
 * @class CacheManager
 * @classdesc Manages cache TTL validation and invalidation logic
 *
 * Provides methods for:
 * - TTL-based cache validation
 * - Cache invalidation for specific data types
 * - Cache refresh operations
 * - Statistics tracking
 */
class CacheManager {
  /**
   * Cache time-to-live in milliseconds (5 minutes)
   * @type {number}
   * @constant
   */
  static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if cached data is still valid based on TTL
   *
   * @param {string} cacheKey - Cache key to check (format: 'dataType_userId')
   * @returns {boolean} True if cache entry exists and is within TTL
   *
   * @example
   * const isValid = CacheManager.isValid('passport_user123');
   * if (isValid) {
   *   return CacheStore.get('passport', 'user123');
   * }
   */
  static isValid(cacheKey) {
    const lastUpdate = CacheStore.getTimestamp(cacheKey);
    if (!lastUpdate) return false;

    const now = Date.now();
    const age = now - lastUpdate;
    return age < this.CACHE_TTL;
  }

  /**
   * Update cache timestamp for a cache entry
   *
   * @param {string} cacheKey - Cache key to update (format: 'dataType_userId')
   *
   * @example
   * CacheStore.set('passport', userId, passport);
   * CacheManager.updateTimestamp(`passport_${userId}`);
   */
  static updateTimestamp(cacheKey) {
    CacheStore.setTimestamp(cacheKey);
  }

  /**
   * Invalidate cache for a specific data type and user
   *
   * Removes cache entry and its timestamp, forcing next access
   * to reload from database.
   *
   * @param {string} dataType - Type of data to invalidate
   * @param {string} userId - User ID whose cache should be invalidated
   *
   * @example
   * await passport.save();
   * CacheManager.invalidate('passport', userId);
   */
  static invalidate(dataType, userId) {
    const cacheKey = `${dataType}_${userId}`;

    // Delete data from cache
    CacheStore.delete(dataType, userId);

    // Delete timestamp
    CacheStore.deleteTimestamp(cacheKey);

    // Record invalidation
    CacheStore.recordInvalidation();
  }

  /**
   * Refresh cache for a specific user
   *
   * Removes all cached data for a user, forcing reload from database.
   *
   * @param {string} userId - User ID whose cache should be refreshed
   *
   * @example
   * await CacheManager.refreshUser('user123');
   * const passport = await getPassport('user123'); // Will reload from DB
   */
  static refreshUser(userId) {
    CacheStore.clearUser(userId);
  }

  /**
   * Clear all cached data
   *
   * Removes all cached data from memory and logs final statistics.
   * Use when user logs out or for complete cache reset.
   *
   * @example
   * CacheManager.clearAll();
   */
  static clearAll() {
    CacheStore.clear();
    CacheStore.logStats();
  }

  /**
   * Record a cache hit
   *
   * @param {string} dataType - Type of data that was cached
   * @param {string} userId - User ID for the cached data
   */
  static recordHit(dataType, userId) {
    CacheStore.recordHit();
  }

  /**
   * Record a cache miss
   *
   * @param {string} dataType - Type of data that was missed
   * @param {string} userId - User ID for the data
   */
  static recordMiss(dataType, userId) {
    CacheStore.recordMiss();
  }

  /**
   * Get current cache statistics
   *
   * @returns {Object} Statistics object with hits, misses, hit rate, etc.
   *
   * @example
   * const stats = CacheManager.getStats();
   * console.log(`Cache hit rate: ${stats.hitRate}%`);
   */
  static getStats() {
    return CacheStore.getStats();
  }

  /**
   * Reset cache statistics to zero
   *
   * @example
   * CacheManager.resetStats();
   */
  static resetStats() {
    CacheStore.resetStats();
  }

  /**
   * Log cache statistics to console
   *
   * @example
   * CacheManager.logStats();
   */
  static logStats() {
    CacheStore.logStats();
  }

  /**
   * Get cached data with automatic TTL validation
   *
   * @param {string} dataType - Type of data to retrieve
   * @param {string} userId - User ID
   * @returns {*} Cached data if valid, undefined otherwise
   *
   * @example
   * const passport = CacheManager.get('passport', userId);
   * if (passport) {
   *   return passport; // Cache hit
   * }
   * // Cache miss - load from database
   */
  static get(dataType, userId) {
    const cacheKey = `${dataType}_${userId}`;

    // Check if cache is valid
    if (!this.isValid(cacheKey)) {
      return undefined;
    }

    // Get data from cache
    const data = CacheStore.get(dataType, userId);
    if (data) {
      this.recordHit(dataType, userId);
      return data;
    }

    return undefined;
  }

  /**
   * Set cached data with automatic timestamp
   *
   * @param {string} dataType - Type of data to cache
   * @param {string} userId - User ID
   * @param {*} data - Data to cache
   *
   * @example
   * const passport = await Passport.load(userId);
   * CacheManager.set('passport', userId, passport);
   */
  static set(dataType, userId, data) {
    CacheStore.set(dataType, userId, data);
    this.updateTimestamp(`${dataType}_${userId}`);
  }

  /**
   * Check if cache has valid data for a key
   *
   * @param {string} dataType - Type of data
   * @param {string} userId - User ID
   * @returns {boolean} True if valid cached data exists
   *
   * @example
   * if (CacheManager.has('passport', userId)) {
   *   return CacheManager.get('passport', userId);
   * }
   */
  static has(dataType, userId) {
    const cacheKey = `${dataType}_${userId}`;
    return this.isValid(cacheKey) && CacheStore.has(dataType, userId);
  }
}

export default CacheManager;
