/**
 * ExpiryWarningNotificationService - Handles expiry warning notifications for entry packs
 * 
 * Features:
 * - Send notification 1 day before entry pack expires: "Your entry pack will expire soon"
 * - Send notification on expiry day: "Your entry pack has expired"
 * - Provide "Archive" option
 * - Check entry pack status before sending
 * - Handle notification frequency control
 * 
 * Requirements: 12.7, 16.5
 */

import NotificationService from './NotificationService';
import NotificationTemplateService from './NotificationTemplateService';
import { NOTIFICATION_TYPES } from './NotificationTemplates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EntryInfoService from '../EntryInfoService';
import type { UserId } from '../../types/data';

// Type definitions
interface ExpiryWarningMetadata {
  notificationIds: string[];
  userId: UserId;
  entryPackId: string;
  arrivalDate: string;
  destination: string;
  scheduledAt: string;
  preExpiryTime: string | null;
  expiryTime: string;
  status: 'scheduled' | 'cancelled' | 'expired' | 'sent';
  updatedAt?: string;
  expiredAt?: string;
}

interface NotificationOptions {
  data?: Record<string, any>;
  [key: string]: any;
}

interface ServiceStats {
  total: number;
  scheduled: number;
  cancelled: number;
  expired: number;
  sent: number;
  totalNotificationIds: number;
}

interface ValidationResult {
  isConsistent: boolean;
  issues: string[];
  warnings: string[];
  totalNotifications: number;
  validatedAt: string;
}

interface ExpiryNotificationTimes {
  preExpiry: Date;
  expiry: Date;
}

class ExpiryWarningNotificationService {
  private notificationService: typeof NotificationService;
  private templateService: typeof NotificationTemplateService;
  private storageKey: string;
  private preExpiryHours: number;

  constructor() {
    this.notificationService = NotificationService;
    this.templateService = NotificationTemplateService;
    this.storageKey = 'expiryWarningNotifications';
    this.preExpiryHours = 24; // 24 hours before expiry
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.notificationService.initialize();
    await this.templateService.initialize();
  }

  /**
   * Schedule expiry warning notifications for entry pack
   * @param userId - User ID
   * @param entryPackId - Entry pack ID
   * @param arrivalDate - Arrival date
   * @param destination - Destination name
   * @param options - Additional options
   * @returns Array of notification IDs
   */
  async scheduleExpiryWarningNotifications(
    userId: UserId,
    entryPackId: string,
    arrivalDate: Date,
    destination: string = 'Thailand',
    options: NotificationOptions = {}
  ): Promise<string[]> {
    try {
      if (!userId || !entryPackId || !arrivalDate) {
        throw new Error('Missing required parameters: userId, entryPackId, or arrivalDate');
      }

      // Check if arrival date is valid and in the future
      const now = new Date();
      const arrival = new Date(arrivalDate);
      
      if (arrival <= now) {
        console.log('Arrival date is in the past, not scheduling expiry warning notifications');
        return [];
      }

      // Check if notifications already exist for this entry pack
      const existingNotifications = await this.getScheduledExpiryWarnings(entryPackId);
      if (existingNotifications && existingNotifications.notificationIds.length > 0) {
        console.log(`Expiry warning notifications already scheduled for entry pack ${entryPackId}`);
        return existingNotifications.notificationIds;
      }

      // Calculate notification times
      const notificationTimes = this.calculateExpiryNotificationTimes(arrival);
      const notificationIds: string[] = [];

      // Schedule pre-expiry warning (1 day before expiry)
      if (notificationTimes.preExpiry && notificationTimes.preExpiry > now) {
        const preExpiryId = await this.templateService.scheduleTemplatedNotification(
          NOTIFICATION_TYPES.ENTRY_PACK_EXPIRY_WARNING,
          notificationTimes.preExpiry,
          {
            destination,
            timeRemaining: '1 day'
          },
          {
            ...options,
            data: {
              userId,
              entryPackId,
              destination,
              arrivalDate: arrival.toISOString(),
              deepLink: `entryPack/${entryPackId}`,
              notificationType: 'expiryWarning',
              isPreExpiry: true,
              expiryTime: notificationTimes.expiry.toISOString()
            }
          }
        );

        if (preExpiryId) {
          notificationIds.push(preExpiryId);
        }
      }

      // Schedule expiry notification (on expiry day)
      if (notificationTimes.expiry && notificationTimes.expiry > now) {
        const expiryId = await this.templateService.scheduleTemplatedNotification(
          NOTIFICATION_TYPES.ENTRY_PACK_EXPIRED,
          notificationTimes.expiry,
          {
            destination
          },
          {
            ...options,
            data: {
              userId,
              entryPackId,
              destination,
              arrivalDate: arrival.toISOString(),
              deepLink: `entryPack/${entryPackId}`,
              notificationType: 'expired',
              isExpiry: true,
              expiryTime: notificationTimes.expiry.toISOString()
            }
          }
        );

        if (expiryId) {
          notificationIds.push(expiryId);
        }
      }

      if (notificationIds.length > 0) {
        // Store notification metadata
        await this.storeNotificationMetadata(entryPackId, {
          notificationIds,
          userId,
          entryPackId,
          arrivalDate: arrival.toISOString(),
          destination,
          scheduledAt: new Date().toISOString(),
          preExpiryTime: notificationTimes.preExpiry?.toISOString() || null,
          expiryTime: notificationTimes.expiry.toISOString(),
          status: 'scheduled'
        });

        console.log(`Expiry warning notifications scheduled for entry pack ${entryPackId}: ${notificationIds.length} notifications`);
      }

      return notificationIds;

    } catch (error) {
      console.error('Error scheduling expiry warning notifications:', error);
      throw error;
    }
  }

  /**
   * Calculate expiry notification times
   * Entry pack expires 24 hours after arrival date
   * Pre-expiry warning: 1 day before expiry (on arrival day)
   * Expiry notification: at expiry time (24h after arrival)
   * @param arrivalDate - Arrival date
   * @returns Notification times
   */
  private calculateExpiryNotificationTimes(arrivalDate: Date): ExpiryNotificationTimes {
    const arrival = new Date(arrivalDate);
    
    // Entry pack expires 24 hours after arrival
    const expiryTime = new Date(arrival);
    expiryTime.setHours(expiryTime.getHours() + 24);
    
    // Pre-expiry warning: 1 day before expiry (which is on arrival day at 8 AM)
    const preExpiryTime = new Date(arrival);
    preExpiryTime.setHours(8, 0, 0, 0); // 8 AM on arrival day
    
    return {
      preExpiry: preExpiryTime,
      expiry: expiryTime
    };
  }

  /**
   * Cancel expiry warning notifications for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Success status
   */
  async cancelExpiryWarningNotifications(entryPackId: string): Promise<boolean> {
    try {
      const notifications = await this.getScheduledExpiryWarnings(entryPackId);
      if (!notifications || !notifications.notificationIds) {
        console.log(`No expiry warning notifications found for entry pack ${entryPackId}`);
        return false;
      }

      let cancelledCount = 0;
      
      // Cancel all scheduled notifications
      for (const notificationId of notifications.notificationIds) {
        const cancelled = await this.notificationService.cancelNotification(notificationId);
        if (cancelled) {
          cancelledCount++;
        }
      }

      if (cancelledCount > 0) {
        // Update metadata status
        await this.updateNotificationStatus(entryPackId, 'cancelled');
        console.log(`Cancelled ${cancelledCount} expiry warning notifications for entry pack ${entryPackId}`);
      }

      return cancelledCount > 0;

    } catch (error) {
      console.error('Error cancelling expiry warning notifications:', error);
      return false;
    }
  }

  /**
   * Handle arrival date change - reschedule expiry warning notifications
   * @param userId - User ID
   * @param entryPackId - Entry pack ID
   * @param newArrivalDate - New arrival date
   * @param oldArrivalDate - Old arrival date
   * @param destination - Destination name
   * @returns New notification IDs
   */
  async handleArrivalDateChange(
    userId: UserId,
    entryPackId: string,
    newArrivalDate: Date,
    oldArrivalDate: Date,
    destination: string = 'Thailand'
  ): Promise<string[]> {
    try {
      // Cancel existing expiry warning notifications
      await this.cancelExpiryWarningNotifications(entryPackId);

      // Schedule new expiry warning notifications if new date is valid
      if (newArrivalDate) {
        return await this.scheduleExpiryWarningNotifications(userId, entryPackId, newArrivalDate, destination);
      }

      return [];

    } catch (error) {
      console.error('Error handling arrival date change for expiry warning notifications:', error);
      throw error;
    }
  }

  /**
   * Auto-cancel expiry warning notifications if entry pack is completed or archived
   * @param entryPackId - Entry pack ID
   * @param newStatus - New entry pack status
   * @returns Whether notifications were cancelled
   */
  async autoCancelIfStatusChanged(entryPackId: string, newStatus: string): Promise<boolean> {
    try {
      // Cancel notifications if entry pack is completed, archived, or cancelled
      const statusesToCancel = ['completed', 'archived', 'cancelled'];
      
      if (!statusesToCancel.includes(newStatus)) {
        return false; // No need to cancel
      }

      const notifications = await this.getScheduledExpiryWarnings(entryPackId);
      if (!notifications) {
        return false; // No notifications to cancel
      }

      // Cancel the notifications
      const cancelled = await this.cancelExpiryWarningNotifications(entryPackId);
      
      if (cancelled) {
        console.log(`Expiry warning notifications auto-cancelled for entry pack ${entryPackId} due to status change: ${newStatus}`);
      }

      return cancelled;

    } catch (error) {
      console.error('Error auto-cancelling expiry warning notifications:', error);
      return false;
    }
  }

  /**
   * Check if expiry warning notification should be sent
   * @param entryInfoId - Entry info ID
   * @param isPreExpiry - Whether this is a pre-expiry warning
   * @returns Whether notification should be sent
   */
  async shouldSendExpiryWarning(entryInfoId: string, isPreExpiry: boolean = false): Promise<boolean> {
    try {
      // Check if entry info exists and is in a state that can expire
      const EntryInfo = require('../../models/EntryInfo').default;
      const entryInfo = await EntryInfo.load(entryInfoId);

      if (!entryInfo) {
        console.log(`Entry info ${entryInfoId} not found, not sending expiry warning`);
        return false;
      }

      // Only send expiry warnings for submitted entry infos
      if ((entryInfo as any).displayStatus?.status !== 'submitted') {
        console.log(`Entry info ${entryInfoId} status is ${(entryInfo as any).displayStatus?.status}, not sending expiry warning`);
        return false;
      }

      // Check if entry info is already expired or completed
      const completedStatuses = ['completed', 'archived', 'cancelled'];
      if (completedStatuses.includes((entryInfo as any).displayStatus?.status)) {
        console.log(`Entry info ${entryInfoId} is already ${(entryInfo as any).displayStatus?.status}, not sending expiry warning`);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Error checking if expiry warning should be sent:', error);
      return false;
    }
  }

  /**
   * Handle "Archive" action from expiry notification
   * @param entryInfoId - Entry info ID
   * @param userId - User ID
   * @returns Whether archival was successful
   */
  async handleArchiveAction(entryInfoId: string, userId: UserId): Promise<boolean> {
    try {
      // Archive the entry info (update status to archived)
      const success = await EntryInfoService.updateEntryInfoStatus(entryInfoId, 'archived', {
        reason: 'expired',
        triggeredBy: 'notification_action',
        metadata: {
          archivedVia: 'expiry_notification',
          userId: userId
        }
      });

      if (success) {
        // Cancel any remaining expiry warning notifications
        await this.cancelExpiryWarningNotifications(entryInfoId);

        console.log(`Entry info ${entryInfoId} archived via expiry notification action`);
        return true;
      }

      return false;

    } catch (error) {
      console.error('Error handling archive action from expiry notification:', error);
      return false;
    }
  }

  /**
   * Get scheduled expiry warning notifications for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Notification metadata or null
   */
  async getScheduledExpiryWarnings(entryPackId: string): Promise<ExpiryWarningMetadata | null> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, ExpiryWarningMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

      return notifications[entryPackId] || null;

    } catch (error) {
      console.error('Error getting scheduled expiry warning notifications:', error);
      return null;
    }
  }

  /**
   * Store notification metadata
   * @param entryPackId - Entry pack ID
   * @param metadata - Notification metadata
   */
  private async storeNotificationMetadata(entryPackId: string, metadata: ExpiryWarningMetadata): Promise<void> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, ExpiryWarningMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

      notifications[entryPackId] = metadata;

      await AsyncStorage.setItem(this.storageKey, JSON.stringify(notifications));

    } catch (error) {
      console.error('Error storing expiry warning notification metadata:', error);
    }
  }

  /**
   * Update notification status
   * @param entryPackId - Entry pack ID
   * @param status - New status
   */
  private async updateNotificationStatus(entryPackId: string, status: ExpiryWarningMetadata['status']): Promise<void> {
    try {
      const notifications = await this.getScheduledExpiryWarnings(entryPackId);
      if (notifications) {
        notifications.status = status;
        notifications.updatedAt = new Date().toISOString();
        await this.storeNotificationMetadata(entryPackId, notifications);
      }

    } catch (error) {
      console.error('Error updating expiry warning notification status:', error);
    }
  }

  /**
   * Get all scheduled expiry warning notifications for user
   * @param userId - User ID
   * @returns Array of scheduled notifications
   */
  async getScheduledNotificationsForUser(userId: UserId): Promise<ExpiryWarningMetadata[]> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, ExpiryWarningMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

      return Object.values(notifications).filter(notification => 
        notification.userId === userId && notification.status === 'scheduled'
      );

    } catch (error) {
      console.error('Error getting scheduled expiry warning notifications for user:', error);
      return [];
    }
  }

  /**
   * Cleanup expired expiry warning notifications
   * @returns Number of cleaned up notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, ExpiryWarningMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

      const now = new Date();
      let cleanedCount = 0;

      for (const [entryPackId, notification] of Object.entries(notifications)) {
        const expiryTime = new Date(notification.expiryTime);
        
        // If expiry time has passed by more than 1 day, mark as expired
        const dayAfterExpiry = new Date(expiryTime);
        dayAfterExpiry.setDate(dayAfterExpiry.getDate() + 1);
        
        if (now > dayAfterExpiry && notification.status === 'scheduled') {
          notification.status = 'expired';
          notification.expiredAt = now.toISOString();
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(notifications));
        console.log(`Cleaned up ${cleanedCount} expired expiry warning notifications`);
      }

      return cleanedCount;

    } catch (error) {
      console.error('Error cleaning up expired expiry warning notifications:', error);
      return 0;
    }
  }

  /**
   * Get statistics about expiry warning notifications
   * @returns Statistics object
   */
  async getStats(): Promise<ServiceStats> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, ExpiryWarningMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

      const stats: ServiceStats = {
        total: Object.keys(notifications).length,
        scheduled: 0,
        cancelled: 0,
        expired: 0,
        sent: 0,
        totalNotificationIds: 0
      };

      Object.values(notifications).forEach(notification => {
        const status = notification.status;
        if (status in stats) {
          stats[status as keyof ServiceStats] = (stats[status as keyof ServiceStats] || 0) + 1;
        }
        stats.totalNotificationIds += notification.notificationIds?.length || 0;
      });

      return stats;

    } catch (error) {
      console.error('Error getting expiry warning notification stats:', error);
      return { total: 0, scheduled: 0, cancelled: 0, expired: 0, sent: 0, totalNotificationIds: 0 };
    }
  }

  /**
   * Check if expiry warning notifications are scheduled for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Whether notifications are scheduled
   */
  async areNotificationsScheduled(entryPackId: string): Promise<boolean> {
    try {
      const notifications = await this.getScheduledExpiryWarnings(entryPackId);
      return !!(notifications && notifications.status === 'scheduled' && notifications.notificationIds?.length > 0);

    } catch (error) {
      console.error('Error checking if expiry warning notifications are scheduled:', error);
      return false;
    }
  }

  /**
   * Clear all expiry warning notifications for user
   * @param userId - User ID
   * @returns Number of cleared notifications
   */
  async clearAllNotificationsForUser(userId: UserId): Promise<number> {
    try {
      const userNotifications = await this.getScheduledNotificationsForUser(userId);
      let clearedCount = 0;

      for (const notification of userNotifications) {
        const cancelled = await this.cancelExpiryWarningNotifications(notification.entryPackId);
        if (cancelled) {
          clearedCount++;
        }
      }

      console.log(`Cleared ${clearedCount} expiry warning notifications for user ${userId}`);
      return clearedCount;

    } catch (error) {
      console.error('Error clearing all expiry warning notifications for user:', error);
      return 0;
    }
  }

  /**
   * Validate notification consistency
   * @returns Validation results
   */
  async validateNotificationConsistency(): Promise<ValidationResult> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, ExpiryWarningMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

      const issues: string[] = [];
      const warnings: string[] = [];

      for (const [entryPackId, notification] of Object.entries(notifications)) {
        // Check if notification has required fields
        if (!notification.userId || !notification.entryPackId || !notification.expiryTime) {
          issues.push(`Notification ${entryPackId} missing required fields`);
        }

        // Check if expiry time is valid
        const expiryTime = new Date(notification.expiryTime);
        if (isNaN(expiryTime.getTime())) {
          issues.push(`Notification ${entryPackId} has invalid expiry time`);
        }

        // Check if notification IDs exist
        if (!notification.notificationIds || notification.notificationIds.length === 0) {
          warnings.push(`Notification ${entryPackId} has no notification IDs`);
        }
      }

      return {
        isConsistent: issues.length === 0,
        issues,
        warnings,
        totalNotifications: Object.keys(notifications).length,
        validatedAt: new Date().toISOString()
      };

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error validating expiry warning notification consistency:', err);
      return {
        isConsistent: false,
        issues: [`Validation failed: ${err.message}`],
        warnings: [],
        totalNotifications: 0,
        validatedAt: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export default new ExpiryWarningNotificationService();

