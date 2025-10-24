/**
 * @fileoverview PersonalInfoOperations - CRUD operations for PersonalInfo data
 *
 * Handles all personal information related database operations including:
 * - Loading personal info
 * - Creating new personal info records
 * - Updating existing personal info
 * - Upserting (create or update)
 *
 * @module app/services/data/operations/PersonalInfoOperations
 */

import PersonalInfo from '../../../models/PersonalInfo';
import CacheManager from '../cache/CacheManager';
import CacheStore from '../cache/CacheStore';

/**
 * @class PersonalInfoOperations
 * @classdesc Handles all CRUD operations for personal info data
 */
class PersonalInfoOperations {
  static async getPersonalInfo(userId) {
    try {
      const cacheKey = `personalInfo_${userId}`;

      // Check cache first
      if (CacheManager.isValid(cacheKey)) {
        const cached = CacheStore.get('personalInfo', userId);
        if (cached) {
          CacheManager.recordHit('personalInfo', userId);
          return cached;
        }
      }

      // Cache miss - load from database
      CacheManager.recordMiss('personalInfo', userId);
      const personalInfo = await PersonalInfo.loadDefault(userId);

      // Update cache
      if (personalInfo) {
        CacheStore.set('personalInfo', userId, personalInfo);
        CacheManager.updateTimestamp(cacheKey);
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
  static async savePersonalInfo(personalData, userId, triggerDataChangeEvent) {
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
      CacheManager.invalidate('personalInfo', userId);

      // Update cache with new data
      CacheStore.set('personalInfo', userId, personalInfo);
      CacheManager.updateTimestamp(`personalInfo_${userId}`);

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
    static async updatePersonalInfo(userId, updates, triggerDataChangeEvent) {
      try {
        // Load existing personal info by userId
        let personalInfo = await PersonalInfo.loadDefault(userId);

        if (!personalInfo) {
          throw new Error(`Personal info not found for userId: ${userId}`);
        }

        // Apply updates using mergeUpdates to avoid overwriting existing data with empty values
        // This is important for progressive data filling where fields are filled incrementally
        // Default to skipValidation: true to support incremental/progressive filling
        await personalInfo.mergeUpdates(updates, { skipValidation: true });

        // Invalidate cache
        if (personalInfo.userId) {
          CacheManager.invalidate('personalInfo', personalInfo.userId);

          // Update cache with new data
          CacheStore.set('personalInfo', personalInfo.userId, personalInfo);
          CacheManager.updateTimestamp(`personalInfo_${personalInfo.userId}`);
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
          triggerDataChangeEvent('personalInfo', personalInfo.userId, {
            personalInfoId: personalInfo.id,
            updatedFields,
          });
        }

        return personalInfo;
      } catch (error) {
        console.error('Failed to update personal info:', error.message);
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
  static async upsertPersonalInfo(userId, data, triggerDataChangeEvent) {
    try {
      // Try to get existing personal info
      let personalInfo = await this.getPersonalInfo(userId);
      
      if (personalInfo && personalInfo.id) {
        try {
          // Try to update existing - pass userId instead of personalInfo.id
          // since updatePersonalInfo expects userId for lookup
          return await this.updatePersonalInfo(userId, data, triggerDataChangeEvent);
        } catch (updateError) {
          // If update fails (e.g., record not found), clear cache and create new
          CacheManager.invalidate('personalInfo', userId);
          personalInfo = null;
        }
      }
      
      // Create new if no existing record or update failed
      if (!personalInfo) {
        const personalData = {
          ...data,
          userId
        };
        return await this.savePersonalInfo(personalData, userId, triggerDataChangeEvent);
      }
    } catch (error) {
      console.error('Failed to upsert personal info:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  }

  // FUNDING PROOF OPERATIONS

  // FUND ITEM OPERATIONS

}

export default PersonalInfoOperations;
