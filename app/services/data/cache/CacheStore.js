/**
 * @fileoverview CacheStore - In-memory cache data structures
 *
 * Provides the data structures for caching user data with TTL support.
 * Uses Map-based storage for efficient lookups and updates.
 *
 * @module app/services/data/cache/CacheStore
 */

/**
 * @class CacheStore
 * @classdesc In-memory cache storage with TTL tracking
 *
 * Maintains separate Map instances for different data types:
 * - passport: User passport data
 * - personalInfo: User personal information
 * - fundItems: User funding proof items
 * - entryInfo: Entry information by destination
 * - travel: Travel information
 * - lastUpdate: Timestamps for TTL validation
 *
 * Additional dynamic caches can be created on-demand.
 */
class CacheStore {
  /**
   * Initialize cache store with predefined segments
   */
  constructor() {
    this.cache = {
      passport: new Map(),           // userId -> Passport instance
      personalInfo: new Map(),       // userId -> PersonalInfo instance
      fundItems: new Map(),          // userId -> Array<FundItem>
      entryInfo: new Map(),          // userId_destinationId -> EntryInfo instance
      travel: new Map(),             // userId_destination -> TravelInfo data
      allPassports: new Map(),       // userId -> Array<Passport>
      primaryPassport: new Map(),    // userId -> Passport instance
      passportCountries: new Map(),  // passportId -> Array<PassportCountry>
      lastUpdate: new Map()          // cacheKey -> timestamp
    };

    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      lastReset: Date.now()
    };
  }

  /**
   * Get cache segment by type
   * Creates segment if it doesn't exist (lazy initialization)
   *
   * @param {string} dataType - Type of data (passport, personalInfo, etc.)
   * @returns {Map} Cache segment
   */
  getSegment(dataType) {
    if (!this.cache[dataType] && dataType !== 'lastUpdate') {
      this.cache[dataType] = new Map();
    }
    return this.cache[dataType];
  }

  /**
   * Get cached data for a user/key
   *
   * @param {string} dataType - Type of data
   * @param {string} key - Cache key (usually userId)
   * @returns {*} Cached data or undefined
   */
  get(dataType, key) {
    const segment = this.getSegment(dataType);
    return segment ? segment.get(key) : undefined;
  }

  /**
   * Set cached data for a user/key
   *
   * @param {string} dataType - Type of data
   * @param {string} key - Cache key (usually userId)
   * @param {*} value - Data to cache
   */
  set(dataType, key, value) {
    const segment = this.getSegment(dataType);
    if (segment) {
      segment.set(key, value);
    }
  }

  /**
   * Delete cached data for a user/key
   *
   * @param {string} dataType - Type of data
   * @param {string} key - Cache key (usually userId)
   * @returns {boolean} True if data was deleted
   */
  delete(dataType, key) {
    const segment = this.getSegment(dataType);
    if (segment && typeof segment.delete === 'function') {
      return segment.delete(key);
    }
    return false;
  }

  /**
   * Check if cache has data for a key
   *
   * @param {string} dataType - Type of data
   * @param {string} key - Cache key
   * @returns {boolean} True if data exists in cache
   */
  has(dataType, key) {
    const segment = this.getSegment(dataType);
    return segment ? segment.has(key) : false;
  }

  /**
   * Clear all cached data
   */
  clear() {
    Object.keys(this.cache).forEach(key => {
      if (this.cache[key] && typeof this.cache[key].clear === 'function') {
        this.cache[key].clear();
      }
    });
  }

  /**
   * Clear cache for a specific user across all data types
   *
   * @param {string} userId - User ID to clear
   */
  clearUser(userId) {
    const dataTypes = ['passport', 'personalInfo', 'fundItems', 'entryInfo', 'travel', 'allPassports', 'primaryPassport'];
    dataTypes.forEach(type => {
      this.delete(type, userId);
    });

    // Clear all timestamp entries for this user
    const keysToDelete = [];
    this.cache.lastUpdate.forEach((value, key) => {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.lastUpdate.delete(key));
  }

  /**
   * Get timestamp for a cache key
   *
   * @param {string} cacheKey - Cache key (format: 'dataType_userId')
   * @returns {number|undefined} Timestamp or undefined
   */
  getTimestamp(cacheKey) {
    return this.cache.lastUpdate.get(cacheKey);
  }

  /**
   * Set timestamp for a cache key
   *
   * @param {string} cacheKey - Cache key (format: 'dataType_userId')
   * @param {number} timestamp - Timestamp to set (default: now)
   */
  setTimestamp(cacheKey, timestamp = Date.now()) {
    this.cache.lastUpdate.set(cacheKey, timestamp);
  }

  /**
   * Delete timestamp for a cache key
   *
   * @param {string} cacheKey - Cache key
   * @returns {boolean} True if timestamp was deleted
   */
  deleteTimestamp(cacheKey) {
    return this.cache.lastUpdate.delete(cacheKey);
  }

  /**
   * Record a cache hit
   */
  recordHit() {
    this.stats.hits++;
  }

  /**
   * Record a cache miss
   */
  recordMiss() {
    this.stats.misses++;
  }

  /**
   * Record a cache invalidation
   */
  recordInvalidation() {
    this.stats.invalidations++;
  }

  /**
   * Get cache statistics
   *
   * @returns {Object} Statistics object with hits, misses, etc.
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0
      ? ((this.stats.hits / totalRequests) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      totalRequests,
      hitRate: parseFloat(hitRate),
      timeSinceReset: Date.now() - this.stats.lastReset
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      lastReset: Date.now()
    };
  }

  /**
   * Log cache statistics to console
   */
  logStats() {
    const stats = this.getStats();
    const minutesSinceReset = (stats.timeSinceReset / 60000).toFixed(2);

    console.log('=== UserDataService Cache Statistics ===');
    console.log(`Time period: ${minutesSinceReset} minutes`);
    console.log(`Cache hits: ${stats.hits}`);
    console.log(`Cache misses: ${stats.misses}`);
    console.log(`Cache invalidations: ${stats.invalidations}`);
    console.log(`Hit rate: ${stats.hitRate}%`);
    console.log(`Total requests: ${stats.totalRequests}`);
    console.log('==========================================');
  }
}

// Export singleton instance
export default new CacheStore();
