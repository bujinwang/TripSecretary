/**
 * @fileoverview FundItemOperations - CRUD operations for FundItem data
 *
 * Handles all fund item related database operations including:
 * - Loading fund items for a user
 * - Creating new fund items
 * - Deleting fund items
 *
 * @module app/services/data/operations/FundItemOperations
 */

import CacheManager from '../cache/CacheManager';
import CacheStore from '../cache/CacheStore';
import type { UserId } from '../../../types/data';

// Type definitions
type FundItemModel = any; // FundItem class instance

interface DataChangeEvent {
  action: 'added' | 'deleted';
  fundItemId?: string;
  fundType?: string;
}

interface GetFundItemsOptions {
  forceRefresh?: boolean;
  [key: string]: any;
}

type TriggerDataChangeEvent = (type: string, userId: string, data: DataChangeEvent) => void;

/**
 * @class FundItemOperations
 * @classdesc Handles all CRUD operations for fund item data
 */
class FundItemOperations {
   static async saveFundItem(
     fundData: Record<string, any>,
     userId: UserId,
     triggerDataChangeEvent?: TriggerDataChangeEvent
   ): Promise<FundItemModel> {
     try {
       const FundItem = require('../../../models/FundItem').default;

       // Create fund item instance
       const fundItem = new FundItem({
         ...fundData,
         userId
       });

       // Save to database
       await fundItem.save({ skipValidation: true });

       // Invalidate and clear cache for fund items to force refresh
       CacheManager.invalidate('fundItems', userId);

       // Also clear the cache entry to ensure fresh data on next load
       if (CacheStore.cache.fundItems) {
         (CacheStore.cache.fundItems as Map<string, FundItemModel[]>).delete(userId);
       }

       if (triggerDataChangeEvent) {
         triggerDataChangeEvent('funds', userId, {
           action: 'added',
           fundItemId: fundItem.id,
           fundType: fundItem.type || fundData.type,
         });
       }

       return fundItem;
     } catch (error: any) {
       console.error('Failed to save fund item:', error.message);
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
   static async getFundItems(userId: UserId, options: GetFundItemsOptions = {}): Promise<FundItemModel[]> {
     try {
       const { forceRefresh = false } = options;
       const cacheKey = `fundItems_${userId}`;

       // Check cache first (unless force refresh is requested)
       if (!forceRefresh && CacheStore.cache.fundItems && (CacheStore.cache.fundItems as Map<string, FundItemModel[]>).has(userId)) {
         const cached = (CacheStore.cache.fundItems as Map<string, FundItemModel[]>).get(userId);
         if (cached && CacheManager.isValid(cacheKey)) {
           CacheManager.recordHit('fundItems', userId);
           return cached;
         }
       }

       // Cache miss or force refresh - load from database
       CacheManager.recordMiss('fundItems', userId);
       const FundItem = require('../../../models/FundItem').default;
       const fundItems = await FundItem.loadByUserId(userId);

       // Update cache
       if (!CacheStore.cache.fundItems) {
         CacheStore.cache.fundItems = new Map<string, FundItemModel[]>();
       }
       (CacheStore.cache.fundItems as Map<string, FundItemModel[]>).set(userId, fundItems);
       CacheManager.updateTimestamp(cacheKey);

       return fundItems;
     } catch (error: any) {
       console.error('Failed to get fund items:', error.message);
       throw error;
     }
   }

  /**
    * Delete fund item
    * @param {string} fundItemId - Fund item ID
    * @param {string} userId - User ID
    * @returns {Promise<boolean>} - Success status
    */
   static async deleteFundItem(
     fundItemId: string,
     userId: UserId,
     triggerDataChangeEvent?: TriggerDataChangeEvent
   ): Promise<boolean> {
     try {
       const FundItem = require('../../../models/FundItem').default;
       const fundItem = await FundItem.load(fundItemId);

       if (!fundItem) {
         return false;
       }

       const result = await fundItem.delete();

       // Invalidate and clear cache for fund items to force refresh
       CacheManager.invalidate('fundItems', userId);

       // Also clear the cache entry to ensure fresh data on next load
       if (CacheStore.cache.fundItems) {
         (CacheStore.cache.fundItems as Map<string, FundItemModel[]>).delete(userId);
       }

       if (triggerDataChangeEvent) {
         triggerDataChangeEvent('funds', userId, {
           action: 'deleted',
           fundItemId,
           fundType: fundItem.type,
         });
       }

       return result;
     } catch (error: any) {
       console.error('Failed to delete fund item:', error.message);
       throw error;
     }
   }
}

export default FundItemOperations;

