/**
 * @fileoverview TravelInfoOperations - CRUD operations for TravelInfo data
 *
 * Handles all travel information related database operations including:
 * - Loading travel info
 * - Saving/updating travel info
 * - Clearing travel info
 * - Handling arrival date changes
 *
 * @module app/services/data/operations/TravelInfoOperations
 */

import SecureStorageService from '../../security/SecureStorageService';
import CacheManager from '../cache/CacheManager';

/**
 * @class TravelInfoOperations
 * @classdesc Handles all CRUD operations for travel info data
 */
class TravelInfoOperations {
  static async getTravelInfo(userId, destination = null, triggerDataChangeEvent) {
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
  static async saveTravelInfo(userId, travelData, triggerDataChangeEvent) {
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
      const existing = await TravelInfoOperations.getTravelInfo(userId, travelData.destination);
      
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
        triggerDataChangeEvent('travel', userId, {
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
   static async updateTravelInfo(userId, destination, updates, triggerDataChangeEvent, getEntryInfoByDestination) {
     try {
       console.log('Updating travel info for user:', userId, 'destination:', destination);

       // Get existing travel info
       const existing = await TravelInfoOperations.getTravelInfo(userId, destination);

       if (!existing) {
         // No existing data, create new
         const newTravelInfo = await TravelInfoOperations.saveTravelInfo(userId, { ...updates, destination });

         // Handle arrival date change for new travel info (support legacy and new field names)
         const createdArrivalDate = (updates.arrivalArrivalDate ?? updates.arrivalDate) || null;
         if (createdArrivalDate) {
           await TravelInfoOperations.handleArrivalDateChange(userId, destination, null, createdArrivalDate);
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
         await TravelInfoOperations.handleArrivalDateChange(userId, destination, oldArrivalDate, updatedArrivalDate);
       }

       const updatedFields = Object.keys(nonEmptyUpdates);
       if (updatedFields.length > 0) {
         triggerDataChangeEvent('travel', userId, {
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
     try {
       console.log('Clearing travel info for user:', userId, 'destination:', destination);

       // Delete travel info from database
       await SecureStorageService.modernDb.runAsync(
         'DELETE FROM travel_info WHERE user_id = ? AND destination = ?',
         [userId, destination]
       );

       // Invalidate cache
       CacheManager.invalidate('travel', `${userId}_${destination}`);

       console.log('Travel info cleared successfully');
       return true;
     } catch (error) {
       console.error('Failed to clear travel info:', error);
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
  static async handleArrivalDateChange(userId, destination, oldArrivalDate, newArrivalDate, getEntryInfoByDestination) {
    try {
      // Only handle Thailand for now (as per requirements)
      if (destination !== 'thailand') {
        return;
      }

      // Import NotificationCoordinator dynamically to avoid circular dependencies
      const NotificationCoordinator = require('../notification/NotificationCoordinator').default;
      
      // Find entry info for this destination
      const entryInfo = await getEntryInfoByDestination(destination);
      if (!entryInfo) {
        console.log('No entry info found for destination:', destination);
        return;
      }

      // Parse dates
      const oldDate = oldArrivalDate ? new Date(oldArrivalDate) : null;
      const newDate = newArrivalDate ? new Date(newArrivalDate) : null;

      // Handle notification scheduling
      await NotificationCoordinator.handleArrivalDateChange(
        userId,
        entryInfo.id, // Use entryInfo.id instead of entryPack.id
        newDate,
        oldDate,
        'Thailand'
      );

      console.log('Arrival date change handled for notifications:', {
        userId,
        destination,
        entryInfoId: entryInfo.id,
        oldDate: oldDate?.toISOString(),
        newDate: newDate?.toISOString()
      });

    } catch (error) {
      console.error('Failed to handle arrival date change:', error);
      // Don't throw - this is a secondary operation that shouldn't break the main flow
    }
  }


}

export default TravelInfoOperations;
