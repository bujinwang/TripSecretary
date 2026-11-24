/**
 * @fileoverview EntryInfoOperations - CRUD operations for EntryInfo data
 *
 * Handles all entry info related database operations including:
 * - Loading entry info data (by user, by destination)
 * - Creating new entry infos
 * - Updating entry info status
 * - Managing entry info state changes
 * - Triggering notifications for entry info events
 *
 * @module app/services/data/operations/EntryInfoOperations
 */

import SecureStorageService from '../../security/SecureStorageService';
import CacheManager from '../cache/CacheManager';
import CacheStore from '../cache/CacheStore';
import type { UserId } from '../../../types/data';

// Type definitions
type EntryInfoModel = any; // EntryInfo class instance

interface EntryInfoStateChangeEvent {
  entryInfoId: string;
  userId: UserId;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
  type: string;
  [key: string]: any;
}

interface StatusUpdateOptions {
  reason?: string;
  digitalArrivalCard?: any;
  [key: string]: any;
}

type TriggerStateChangeEvent = (entryInfo: EntryInfoModel, oldStatus: string, newStatus: string, options: StatusUpdateOptions) => void;
type GetEntryInfoByDestination = (destinationId: string, tripId?: string | null) => Promise<EntryInfoModel | null>;

/**
 * @class EntryInfoOperations
 * @classdesc Handles all CRUD operations for entry info data
 */
class EntryInfoOperations {
  /**
   * Get entry info for a user and destination
   * @param {string} userId - User ID
   * @param {string} destinationId - Destination ID (optional)
   * @returns {Promise<EntryInfo|null>} - Entry info instance or null
   */
  static async getEntryInfo(userId: UserId, destinationId: string | null = null): Promise<EntryInfoModel | null> {
    try {
      const cacheKey = `entryInfo_${userId}_${destinationId || 'default'}`;

      // Check cache first
      if (CacheManager.isValid(cacheKey)) {
        const cached = (CacheStore.cache.entryInfo as Map<string, EntryInfoModel> | undefined)?.get(`${userId}_${destinationId || 'default'}`);
        if (cached) {
          CacheManager.recordHit('entryInfo', userId);
          return cached;
        }
      }

      // Cache miss - load from database
      CacheManager.recordMiss('entryInfo', userId);

      // Load entry info from storage
      const entryInfoData = await SecureStorageService.getEntryInfo(userId, destinationId);

      let entryInfo: EntryInfoModel | null = null;
      if (entryInfoData) {
        const EntryInfo = require('../../../models/EntryInfo').default;
        entryInfo = new EntryInfo(entryInfoData);
      }

      // Update cache
      if (entryInfo) {
        if (!CacheStore.cache.entryInfo) {
          CacheStore.cache.entryInfo = new Map<string, EntryInfoModel>();
        }
        (CacheStore.cache.entryInfo as Map<string, EntryInfoModel>).set(`${userId}_${destinationId || 'default'}`, entryInfo);
        CacheManager.updateTimestamp(cacheKey);
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
  static async saveEntryInfo(entryInfoData: Record<string, any>, userId: UserId): Promise<EntryInfoModel> {
    try {
      console.log('Saving entry info for user:', userId, 'with passport_id:', entryInfoData.passportId || 'NULL');

      const EntryInfo = require('../../../models/EntryInfo').default;

      // Create entry info instance
      const entryInfo = new EntryInfo({
        ...entryInfoData,
        userId
      });

      // Save to database (passport_id can be null)
      await entryInfo.save({ skipValidation: true });

      // Invalidate cache
      const destinationId = entryInfo.destinationId || 'default';
      CacheManager.invalidate('entryInfo', `${userId}_${destinationId}`);

      // Update cache with new data
      if (!CacheStore.cache.entryInfo) {
        CacheStore.cache.entryInfo = new Map<string, EntryInfoModel>();
      }
      (CacheStore.cache.entryInfo as Map<string, EntryInfoModel>).set(`${userId}_${destinationId}`, entryInfo);
      CacheManager.updateTimestamp(`entryInfo_${userId}_${destinationId}`);

      console.log(`Entry info saved for user ${userId} (passport_id: ${entryInfo.passportId || 'NULL'})`);
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
   * @param {Function} triggerStateChangeEvent - State change event callback
   * @returns {Promise<EntryInfo>} - Updated entry info instance
   */
  static async updateEntryInfoStatus(
    entryInfoId: string,
    newStatus: string,
    options: StatusUpdateOptions = {},
    triggerStateChangeEvent?: TriggerStateChangeEvent
  ): Promise<EntryInfoModel> {
    try {
      console.log(`Updating entry info status: ${entryInfoId} -> ${newStatus}`);

      const EntryInfo = require('../../../models/EntryInfo').default;

      // Load existing entry info
      const entryInfo = await EntryInfo.load(entryInfoId);
      if (!entryInfo) {
        throw new Error(`Entry info not found: ${entryInfoId}`);
      }

      const oldStatus = entryInfo.status;

      // Update status using the model's method
      entryInfo.updateStatus(newStatus, options.reason);

      // If marking as submitted, store Digital Arrival Card data
      if (newStatus === 'submitted' && options.digitalArrivalCard) {
        entryInfo.markAsSubmitted(options.digitalArrivalCard);
      }

      // Save updated entry info
      await entryInfo.save({ skipValidation: true });

      // Invalidate cache
      const destinationId = entryInfo.destinationId || 'default';
      CacheManager.invalidate('entryInfo', `${entryInfo.userId}_${destinationId}`);

      // Update cache with new data
      if (!CacheStore.cache.entryInfo) {
        CacheStore.cache.entryInfo = new Map<string, EntryInfoModel>();
      }
      (CacheStore.cache.entryInfo as Map<string, EntryInfoModel>).set(`${entryInfo.userId}_${destinationId}`, entryInfo);
      CacheManager.updateTimestamp(`entryInfo_${entryInfo.userId}_${destinationId}`);

      // Trigger state change event for notification system
      if (triggerStateChangeEvent) {
        triggerStateChangeEvent(entryInfo, oldStatus, newStatus, options);
      }

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
  static async getEntryInfoByDestination(destinationId: string, tripId: string | null = null): Promise<EntryInfoModel | null> {
    try {
      // Load from storage
      const entryInfoData = await SecureStorageService.getEntryInfoByDestination(destinationId, tripId);

      if (!entryInfoData) {
        return null;
      }

      const EntryInfo = require('../../../models/EntryInfo').default;
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
  static async getAllEntryInfosForUser(userId: UserId): Promise<EntryInfoModel[]> {
    try {
      console.log(`Getting all entry infos for user: ${userId}`);

      // Load all entry infos from storage
      const allEntryInfoData = await SecureStorageService.getAllEntryInfosForUser(userId);

      if (!allEntryInfoData || allEntryInfoData.length === 0) {
        console.log(`No entry infos found for user: ${userId}`);
        return [];
      }

      const EntryInfo = require('../../../models/EntryInfo').default;
      const entryInfos = allEntryInfoData.map((data: any) => new EntryInfo(data));

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
   * @param {Function} getEntryInfoByDestination - Callback to get entry info by destination
   * @returns {Promise<Object>} - Object with destinationId as key and EntryInfo as value
   */
  static async getEntryInfosForDestinations(
    userId: UserId,
    destinationIds: string[],
    getEntryInfoByDestination: GetEntryInfoByDestination
  ): Promise<Record<string, EntryInfoModel | null>> {
    try {
      const entryInfos: Record<string, EntryInfoModel | null> = {};

      // Load entry info for each destination
      for (const destinationId of destinationIds) {
        try {
          const entryInfo = await getEntryInfoByDestination(destinationId);
          entryInfos[destinationId] = entryInfo;
        } catch (error: any) {
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
   * Store state change event for processing
   * @param {Object} event - State change event
   * @param {Map} stateChangeEvents - State change events storage
   */
  static storeStateChangeEvent(
    event: EntryInfoStateChangeEvent,
    stateChangeEvents: Map<string, EntryInfoStateChangeEvent>
  ): Map<string, EntryInfoStateChangeEvent> {
    try {
      if (!stateChangeEvents) {
        stateChangeEvents = new Map<string, EntryInfoStateChangeEvent>();
      }

      stateChangeEvents.set(event.entryInfoId, event);

      // Keep only recent events (last 10)
      if (stateChangeEvents.size > 10) {
        const entries = Array.from(stateChangeEvents.entries());
        const oldestEntry = entries.sort((a, b) =>
          new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime()
        )[0];
        stateChangeEvents.delete(oldestEntry[0]);
      }

      console.log(`State change event stored. Queue size: ${stateChangeEvents.size}`);
      return stateChangeEvents;
    } catch (error) {
      console.error('Failed to store state change event:', error);
      return stateChangeEvents;
    }
  }

  /**
   * Check if immediate notification should be triggered
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @returns {boolean} - Should trigger immediate notification
   */
  static shouldTriggerImmediateNotification(oldStatus: string, newStatus: string): boolean {
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
  static processImmediateNotification(event: EntryInfoStateChangeEvent): void {
    try {
      console.log('Processing immediate notification for event:', event.type);

      const { oldStatus, newStatus } = event;

      if (oldStatus === 'ready' && newStatus === 'submitted') {
        console.log('Should send notification: Entry info submitted successfully');
      } else if (oldStatus === 'submitted' && newStatus === 'superseded') {
        console.log('Should send notification: Entry info superseded, resubmission required');
      } else if (oldStatus === 'submitted' && newStatus === 'expired') {
        console.log('Should send notification: Entry info expired');
      } else if (newStatus === 'archived') {
        console.log('Should send notification: Entry info archived');
      }

      // In a real implementation, this would call NotificationService
    } catch (error) {
      console.error('Failed to process immediate notification:', error);
    }
  }

  /**
   * Get recent state change events
   * @param {Map} stateChangeEvents - State change events storage
   * @param {string} userId - User ID (optional)
   * @param {number} limit - Maximum number of events to return
   * @returns {Array} - Array of state change events
   */
  static getStateChangeEvents(
    stateChangeEvents: Map<string, EntryInfoStateChangeEvent>,
    userId: UserId | null = null,
    limit: number = 10
  ): EntryInfoStateChangeEvent[] {
    try {
      if (!stateChangeEvents || stateChangeEvents.size === 0) {
        return [];
      }

      let events = Array.from(stateChangeEvents.values());

      // Filter by user if specified
      if (userId) {
        events = events.filter(event => event.userId === userId);
      }

      // Sort by timestamp (most recent first) and limit
      return events
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get state change events:', error);
      return [];
    }
  }
}

export default EntryInfoOperations;

