/**
 * WindowOpenNotificationService - Handles submission window open notifications
 * 
 * Features:
 * - Schedule notifications 7 days before arrival date
 * - Auto-cancel notifications if TDAC already submitted
 * - Navigate to ThailandEntryFlowScreen on notification click
 * - Handle arrival date changes and reschedule notifications
 * 
 * Requirements: 16.1, 16.2
 */

import NotificationTemplateService from './NotificationTemplateService';
import NotificationService from './NotificationService';
import { NOTIFICATION_TYPES } from './NotificationTemplates';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WindowOpenNotificationService {
  constructor() {
    this.notificationTemplateService = NotificationTemplateService;
    this.notificationService = NotificationService;
    this.scheduledNotifications = new Map(); // Track scheduled notifications
    this.storageKey = 'windowOpenNotifications';
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      await this.notificationTemplateService.initialize();
      await this.loadScheduledNotifications();
      console.log('WindowOpenNotificationService initialized');
    } catch (error) {
      console.error('Failed to initialize WindowOpenNotificationService:', error);
      throw error;
    }
  }

  /**
   * Schedule submission window open notification
   * @param {string} userId - User ID
   * @param {string} entryPackId - Entry pack ID
   * @param {Date} arrivalDate - User's arrival date
   * @param {string} destination - Destination name (default: Thailand)
   * @param {Object} options - Additional options
   * @returns {Promise<string|null>} Notification identifier or null if not scheduled
   */
  async scheduleWindowOpenNotification(userId, entryPackId, arrivalDate, destination = 'Thailand', options = {}) {
    try {
      if (!arrivalDate || !(arrivalDate instanceof Date)) {
        console.warn('Invalid arrival date provided for window open notification');
        return null;
      }

      // Calculate notification date (7 days before arrival)
      const notificationDate = new Date(arrivalDate);
      notificationDate.setDate(notificationDate.getDate() - 7);

      // Don't schedule if notification date is in the past
      const now = new Date();
      if (notificationDate <= now) {
        console.log('Window open notification date is in the past, not scheduling');
        return null;
      }

      // Check if notification is already scheduled for this entry pack
      const existingNotificationId = await this.getScheduledNotificationId(entryPackId);
      if (existingNotificationId) {
        // Cancel existing notification before scheduling new one
        await this.cancelWindowOpenNotification(entryPackId);
      }

      // Calculate days remaining
      const daysRemaining = Math.ceil((arrivalDate - notificationDate) / (1000 * 60 * 60 * 24));

      // Schedule the notification using template service
      const notificationId = await this.notificationTemplateService.scheduleSubmissionWindowNotification(
        arrivalDate,
        destination,
        {
          ...options,
          data: {
            entryPackId,
            entryInfoId: entryPackId, // Also include as entryInfoId for compatibility
            userId,
            destination,
            arrivalDate: arrivalDate.toISOString(),
            deepLink: 'entryInfo/detail', // Navigate to entry info detail screen, not entry flow
            notificationType: 'windowOpen'
          }
        }
      );

      if (notificationId) {
        // Store notification mapping
        await this.storeNotificationMapping(entryPackId, notificationId, {
          userId,
          destination,
          arrivalDate: arrivalDate.toISOString(),
          notificationDate: notificationDate.toISOString(),
          scheduledAt: new Date().toISOString()
        });

        console.log('Window open notification scheduled:', {
          entryPackId,
          notificationId,
          destination,
          arrivalDate: arrivalDate.toISOString(),
          notificationDate: notificationDate.toISOString(),
          daysRemaining
        });
      }

      return notificationId;

    } catch (error) {
      console.error('Failed to schedule window open notification:', error);
      throw error;
    }
  }

  /**
   * Cancel window open notification for entry pack
   * @param {string} entryPackId - Entry pack ID
   * @returns {Promise<boolean>} Success status
   */
  async cancelWindowOpenNotification(entryPackId) {
    try {
      const notificationId = await this.getScheduledNotificationId(entryPackId);
      
      if (!notificationId) {
        console.log('No window open notification found for entry pack:', entryPackId);
        return false;
      }

      // Cancel the notification
      const cancelled = await this.notificationService.cancelNotification(notificationId);
      
      if (cancelled) {
        // Remove from storage
        await this.removeNotificationMapping(entryPackId);
        
        console.log('Window open notification cancelled:', {
          entryPackId,
          notificationId
        });
      }

      return cancelled;

    } catch (error) {
      console.error('Failed to cancel window open notification:', error);
      return false;
    }
  }

  /**
   * Handle arrival date change - reschedule notification
   * @param {string} userId - User ID
   * @param {string} entryPackId - Entry pack ID
   * @param {Date} newArrivalDate - New arrival date
   * @param {Date} oldArrivalDate - Previous arrival date (optional)
   * @param {string} destination - Destination name
   * @returns {Promise<string|null>} New notification identifier
   */
  async handleArrivalDateChange(userId, entryPackId, newArrivalDate, oldArrivalDate = null, destination = 'Thailand') {
    try {
      console.log('Handling arrival date change:', {
        entryPackId,
        oldDate: oldArrivalDate?.toISOString(),
        newDate: newArrivalDate?.toISOString(),
        destination
      });

      // Cancel existing notification
      await this.cancelWindowOpenNotification(entryPackId);

      // Schedule new notification if new date is provided
      if (newArrivalDate && newArrivalDate instanceof Date) {
        return await this.scheduleWindowOpenNotification(
          userId,
          entryPackId,
          newArrivalDate,
          destination
        );
      }

      return null;

    } catch (error) {
      console.error('Failed to handle arrival date change:', error);
      throw error;
    }
  }

  /**
   * Auto-cancel notification if TDAC already submitted
   * @param {string} entryPackId - Entry pack ID
   * @param {Object} tdacSubmission - TDAC submission data
   * @returns {Promise<boolean>} Whether notification was cancelled
   */
  async autoCancelIfSubmitted(entryPackId, tdacSubmission) {
    try {
      if (!tdacSubmission || !tdacSubmission.arrCardNo) {
        return false; // No valid submission, don't cancel
      }

      const cancelled = await this.cancelWindowOpenNotification(entryPackId);
      
      if (cancelled) {
        console.log('Window open notification auto-cancelled due to TDAC submission:', {
          entryPackId,
          arrCardNo: tdacSubmission.arrCardNo
        });
      }

      return cancelled;

    } catch (error) {
      console.error('Failed to auto-cancel notification:', error);
      return false;
    }
  }

  /**
   * Check and clean up expired notifications
   * @returns {Promise<number>} Number of cleaned up notifications
   */
  async cleanupExpiredNotifications() {
    try {
      const scheduledNotifications = await this.loadScheduledNotifications();
      const now = new Date();
      let cleanedCount = 0;

      for (const [entryPackId, notificationData] of scheduledNotifications.entries()) {
        const arrivalDate = new Date(notificationData.arrivalDate);
        
        // If arrival date has passed, clean up the notification
        if (arrivalDate <= now) {
          await this.cancelWindowOpenNotification(entryPackId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired window open notifications`);
      }

      return cleanedCount;

    } catch (error) {
      console.error('Failed to cleanup expired notifications:', error);
      return 0;
    }
  }

  /**
   * Get all scheduled window open notifications for user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of scheduled notifications
   */
  async getScheduledNotificationsForUser(userId) {
    try {
      const allNotifications = await this.loadScheduledNotifications();
      const userNotifications = [];

      for (const [entryPackId, notificationData] of allNotifications.entries()) {
        if (notificationData.userId === userId) {
          userNotifications.push({
            entryPackId,
            ...notificationData
          });
        }
      }

      return userNotifications.sort((a, b) => 
        new Date(a.arrivalDate) - new Date(b.arrivalDate)
      );

    } catch (error) {
      console.error('Failed to get scheduled notifications for user:', error);
      return [];
    }
  }

  /**
   * Check if window open notification is scheduled for entry pack
   * @param {string} entryPackId - Entry pack ID
   * @returns {Promise<boolean>} Whether notification is scheduled
   */
  async isNotificationScheduled(entryPackId) {
    try {
      const notificationId = await this.getScheduledNotificationId(entryPackId);
      return !!notificationId;
    } catch (error) {
      console.error('Failed to check if notification is scheduled:', error);
      return false;
    }
  }

  /**
   * Get scheduled notification ID for entry pack
   * @param {string} entryPackId - Entry pack ID
   * @returns {Promise<string|null>} Notification ID or null
   */
  async getScheduledNotificationId(entryPackId) {
    try {
      const scheduledNotifications = await this.loadScheduledNotifications();
      const notificationData = scheduledNotifications.get(entryPackId);
      return notificationData?.notificationId || null;
    } catch (error) {
      console.error('Failed to get scheduled notification ID:', error);
      return null;
    }
  }

  /**
   * Store notification mapping in AsyncStorage
   * @param {string} entryPackId - Entry pack ID
   * @param {string} notificationId - Notification ID
   * @param {Object} metadata - Additional metadata
   */
  async storeNotificationMapping(entryPackId, notificationId, metadata) {
    try {
      const scheduledNotifications = await this.loadScheduledNotifications();
      
      scheduledNotifications.set(entryPackId, {
        notificationId,
        ...metadata
      });

      // Convert Map to object for storage
      const notificationsObj = Object.fromEntries(scheduledNotifications);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(notificationsObj));

      // Update in-memory cache
      this.scheduledNotifications = scheduledNotifications;

    } catch (error) {
      console.error('Failed to store notification mapping:', error);
      throw error;
    }
  }

  /**
   * Remove notification mapping from AsyncStorage
   * @param {string} entryPackId - Entry pack ID
   */
  async removeNotificationMapping(entryPackId) {
    try {
      const scheduledNotifications = await this.loadScheduledNotifications();
      
      scheduledNotifications.delete(entryPackId);

      // Convert Map to object for storage
      const notificationsObj = Object.fromEntries(scheduledNotifications);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(notificationsObj));

      // Update in-memory cache
      this.scheduledNotifications = scheduledNotifications;

    } catch (error) {
      console.error('Failed to remove notification mapping:', error);
      throw error;
    }
  }

  /**
   * Load scheduled notifications from AsyncStorage
   * @returns {Promise<Map>} Map of entry pack ID to notification data
   */
  async loadScheduledNotifications() {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      
      if (!stored) {
        this.scheduledNotifications = new Map();
        return this.scheduledNotifications;
      }

      const notificationsObj = JSON.parse(stored);
      this.scheduledNotifications = new Map(Object.entries(notificationsObj));
      
      return this.scheduledNotifications;

    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
      this.scheduledNotifications = new Map();
      return this.scheduledNotifications;
    }
  }

  /**
   * Get service statistics
   * @returns {Promise<Object>} Service statistics
   */
  async getStats() {
    try {
      const scheduledNotifications = await this.loadScheduledNotifications();
      const now = new Date();
      
      let activeCount = 0;
      let expiredCount = 0;
      
      for (const [entryPackId, notificationData] of scheduledNotifications.entries()) {
        const arrivalDate = new Date(notificationData.arrivalDate);
        if (arrivalDate > now) {
          activeCount++;
        } else {
          expiredCount++;
        }
      }

      return {
        totalScheduled: scheduledNotifications.size,
        activeNotifications: activeCount,
        expiredNotifications: expiredCount,
        storageKey: this.storageKey,
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to get service stats:', error);
      return {
        totalScheduled: 0,
        activeNotifications: 0,
        expiredNotifications: 0,
        error: error.message
      };
    }
  }

  /**
   * Validate notification data consistency
   * @returns {Promise<Object>} Validation result
   */
  async validateNotificationConsistency() {
    try {
      const scheduledNotifications = await this.loadScheduledNotifications();
      const systemScheduledNotifications = await this.notificationService.getScheduledNotifications();
      
      const inconsistencies = [];
      const validNotifications = [];

      // Check each stored notification against system notifications
      for (const [entryPackId, notificationData] of scheduledNotifications.entries()) {
        const systemNotification = systemScheduledNotifications.find(
          n => n.identifier === notificationData.notificationId
        );

        if (!systemNotification) {
          inconsistencies.push({
            entryPackId,
            issue: 'Notification stored but not found in system',
            notificationId: notificationData.notificationId
          });
        } else {
          validNotifications.push({
            entryPackId,
            notificationId: notificationData.notificationId,
            scheduledFor: systemNotification.trigger?.date || 'Unknown'
          });
        }
      }

      return {
        isConsistent: inconsistencies.length === 0,
        totalStored: scheduledNotifications.size,
        validNotifications: validNotifications.length,
        inconsistencies,
        validatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to validate notification consistency:', error);
      return {
        isConsistent: false,
        error: error.message,
        validatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Clear all scheduled window open notifications
   * @returns {Promise<number>} Number of notifications cleared
   */
  async clearAllNotifications() {
    try {
      const scheduledNotifications = await this.loadScheduledNotifications();
      let clearedCount = 0;

      for (const [entryPackId] of scheduledNotifications.entries()) {
        const cancelled = await this.cancelWindowOpenNotification(entryPackId);
        if (cancelled) {
          clearedCount++;
        }
      }

      console.log(`Cleared ${clearedCount} window open notifications`);
      return clearedCount;

    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      return 0;
    }
  }
}

// Export singleton instance
export default new WindowOpenNotificationService();