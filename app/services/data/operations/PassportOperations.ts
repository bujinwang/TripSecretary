/**
 * @fileoverview PassportOperations - CRUD operations for Passport data
 *
 * Handles all passport-related database operations including:
 * - Loading passport data (primary, all, by ID)
 * - Creating new passports
 * - Updating existing passports
 * - Loading passport countries
 *
 * @module app/services/data/operations/PassportOperations
 */

import Passport from '../../../models/Passport';
import PassportCountry from '../../../models/PassportCountry';
import SecureStorageService from '../../security/SecureStorageService';
import CacheManager from '../cache/CacheManager';
import CacheStore from '../cache/CacheStore';
import type { UserId } from '../../../types/data';

// Type definitions
type PassportModel = Passport;
type PassportCountryModel = PassportCountry;

interface SaveOptions {
  skipValidation?: boolean;
  [key: string]: any;
}

interface DataChangeEvent {
  passportId?: string;
  updatedFields: string[];
}

type TriggerDataChangeEvent = (type: string, userId: string, data: DataChangeEvent) => void;

/**
 * @class PassportOperations
 * @classdesc Handles all CRUD operations for passport data
 */
class PassportOperations {
  /**
   * Get passport data for a user
   * Uses caching for performance
   *
   * @param {string} userId - User ID
   * @param {Function} triggerDataChangeEvent - Event trigger callback
   * @returns {Promise<Passport|null>} - Passport instance or null if not found
   */
  static async getPassport(userId: UserId, triggerDataChangeEvent?: TriggerDataChangeEvent): Promise<PassportModel | null> {
    try {
      const cacheKey = `passport_${userId}`;

      // Check cache first
      if (CacheManager.isValid(cacheKey)) {
        const cached = CacheStore.get('passport', userId);
        if (cached) {
          CacheManager.recordHit('passport', userId);
          return cached as PassportModel;
        }
      }

      // Cache miss - load from database
      CacheManager.recordMiss('passport', userId);
      // Load the primary passport for the user
      const passport = await Passport.loadPrimary(userId);

      // Update cache
      if (passport) {
        CacheStore.set('passport', userId, passport);
        CacheManager.updateTimestamp(cacheKey);
      }

      return passport;
    } catch (error) {
      console.error('Failed to get passport:', error);
      throw error;
    }
  }

  /**
   * Convenience helper for retrieving the user's most recent passport
   * Alias for getPassport(userId) kept for backwards compatibility
   *
   * @param {string} userId - User ID
   * @returns {Promise<Passport|null>} - Most recent passport instance or null
   */
  static async getPrimaryPassport(userId: UserId): Promise<PassportModel | null> {
    try {
      const cacheKey = `primaryPassport_${userId}`;

      // Check cache first
      if (CacheManager.isValid(cacheKey)) {
        const cached = (CacheStore.cache.primaryPassport as Map<string, PassportModel> | undefined)?.get(userId);
        if (cached) {
          CacheManager.recordHit('primaryPassport', userId);
          return cached;
        }
      }

      // Cache miss - load from database
      CacheManager.recordMiss('primaryPassport', userId);
      const primaryPassport = await Passport.loadPrimary(userId);

      // Update cache
      if (primaryPassport) {
        if (!CacheStore.cache.primaryPassport) {
          CacheStore.cache.primaryPassport = new Map<string, PassportModel>();
        }
        (CacheStore.cache.primaryPassport as Map<string, PassportModel>).set(userId, primaryPassport);
        CacheManager.updateTimestamp(cacheKey);
      }

      return primaryPassport;
    } catch (error) {
      console.error('Failed to get primary passport:', error);
      throw error;
    }
  }

  /**
   * Get all passports for a user (for passport selection)
   * @param {string} userId - User ID
   * @returns {Promise<Array<Passport>>} - Array of passport instances
   */
  static async getAllPassports(userId: UserId): Promise<PassportModel[]> {
    try {
      const cacheKey = `allPassports_${userId}`;

      // Check cache first
      if (CacheManager.isValid(cacheKey)) {
        const cached = (CacheStore.cache.allPassports as Map<string, PassportModel[]> | undefined)?.get(userId);
        if (cached) {
          CacheManager.recordHit('allPassports', userId);
          return cached;
        }
      }

      // Cache miss - load from database
      CacheManager.recordMiss('allPassports', userId);
      const passportDataArray = await SecureStorageService.getAllUserPassports(userId);

      // Convert to Passport instances
      const passports = passportDataArray.map(data => new Passport(data));

      // Update cache
      if (!CacheStore.cache.allPassports) {
        CacheStore.cache.allPassports = new Map<string, PassportModel[]>();
      }
      (CacheStore.cache.allPassports as Map<string, PassportModel[]>).set(userId, passports);
      CacheManager.updateTimestamp(cacheKey);

      return passports;
    } catch (error) {
      console.error('Failed to get all passports:', error);
      throw error;
    }
  }

  /**
   * Get all PassportCountry records for a given passportId.
   * @param {string} passportId - The ID of the passport.
   * @returns {Promise<Array<PassportCountry>>} - Array of PassportCountry instances.
   */
  static async getPassportCountries(passportId: string): Promise<PassportCountryModel[]> {
    try {
      const cacheKey = `passportCountries_${passportId}`;

      // Check cache first
      if (CacheManager.isValid(cacheKey)) {
        const cached = (CacheStore.cache.passportCountries as Map<string, PassportCountryModel[]> | undefined)?.get(passportId);
        if (cached) {
          CacheManager.recordHit('passportCountries', passportId);
          return cached;
        }
      }

      // Cache miss - load from database
      CacheManager.recordMiss('passportCountries', passportId);
      const passportCountriesData = await SecureStorageService.getPassportCountriesByPassportId(passportId);

      // Convert to PassportCountry instances
      const passportCountries = passportCountriesData.map(data => new PassportCountry(data));

      // Update cache
      if (!CacheStore.cache.passportCountries) {
        CacheStore.cache.passportCountries = new Map<string, PassportCountryModel[]>();
      }
      (CacheStore.cache.passportCountries as Map<string, PassportCountryModel[]>).set(passportId, passportCountries);
      CacheManager.updateTimestamp(cacheKey);

      return passportCountries;
    } catch (error) {
      console.error('Failed to get passport countries:', error);
      throw error;
    }
  }

  /**
   * Get a specific passport by ID
   * @param {string} passportId - Passport ID
   * @returns {Promise<Passport|null>} - Passport instance or null
   */
  static async getPassportById(passportId: string): Promise<PassportModel | null> {
    try {
      const passport = await Passport.load(passportId);
      return passport;
    } catch (error) {
      console.error('Failed to get passport by ID:', error);
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
   * @param {Function} triggerDataChangeEvent - Event trigger callback
   * @returns {Promise<Passport>} - Saved passport instance
   */
  static async savePassport(
    passportData: Record<string, any>,
    userId: UserId,
    options: SaveOptions = {},
    triggerDataChangeEvent?: TriggerDataChangeEvent
  ): Promise<PassportModel> {
    if (!userId) {
      throw new Error('userId is required');
    }
    try {
      // Create passport instance
      const passport = new Passport({
        ...passportData,
        userId
      });

      // Save to database with options
      // Default to skipValidation: true to support incremental/progressive filling
      const saveOptions = { skipValidation: true, ...options };
      await passport.save(saveOptions);

      // Invalidate cache
      CacheManager.invalidate('passport', userId);
      CacheManager.invalidate('allPassports', userId); // Invalidate allPassports cache as well
      CacheManager.invalidate('passportCountries', passport.id || ''); // Invalidate passportCountries cache

      // Update cache with new data
      CacheStore.set('passport', userId, passport);
      CacheManager.updateTimestamp(`passport_${userId}`);

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
      if (updatedFields.length > 0 && triggerDataChangeEvent) {
        triggerDataChangeEvent('passport', userId, {
          passportId: passport.id || passportData.id,
          updatedFields,
        });
      }

      return passport;
    } catch (error: any) {
      console.error('Failed to save passport:', error.message);
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
   * @param {Function} triggerDataChangeEvent - Event trigger callback
   * @returns {Promise<Passport>} - Updated passport instance
   */
  static async updatePassport(
    passportId: string,
    updates: Record<string, any>,
    options: SaveOptions = {},
    triggerDataChangeEvent?: TriggerDataChangeEvent
  ): Promise<PassportModel> {
    try {
      // Load existing passport
      const passport = await Passport.load(passportId);

      if (!passport) {
        throw new Error(`Passport not found: ${passportId}`);
      }

      // Filter out empty values to avoid overwriting existing data
      const nonEmptyUpdates: Record<string, any> = {};
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
        CacheManager.invalidate('passport', passport.userId);

        // Update cache with new data
        CacheStore.set('passport', passport.userId, passport);
        CacheManager.updateTimestamp(`passport_${passport.userId}`);
      }

      const updatedFields = Object.keys(nonEmptyUpdates).filter(field => field !== 'userId');
      if (updatedFields.length > 0 && passport.userId && triggerDataChangeEvent) {
        triggerDataChangeEvent('passport', passport.userId, {
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
}

export default PassportOperations;

