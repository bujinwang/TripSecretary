/**
 * DeadlineNotificationService - Handles deadline notifications for entry pack submissions
 * 
 * Features:
 * - Send notification on arrival day if not submitted: "Today is submission deadline"
 * - Repeat reminder every 4 hours (maximum 3 times)
 * - Provide "Remind Later" and "Submit Now" options
 * - Check submission status before sending
 * - Handle notification frequency control
 * 
 * Requirements: 16.2, 16.3
 */

import NotificationService from './NotificationService';
import NotificationTemplateService from './NotificationTemplateService';
import { NOTIFICATION_TYPES } from './NotificationTemplates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EntryInfoService from '../EntryInfoService';
import UserDataService from '../data/UserDataService';
import type { UserId } from '../../types/data';

// Type definitions
interface DeadlineNotificationMetadata {
  notificationIds: string[];
  userId: UserId;
  entryPackId: string;
  arrivalDate: string;
  destination: string;
  scheduledAt: string;
  notificationTimes: string[];
  status: 'scheduled' | 'cancelled' | 'expired' | 'sent';
  updatedAt?: string;
  expiredAt?: string;
}

interface NotificationOptions {
  urgent?: boolean;
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

class DeadlineNotificationService {
  private notificationService: typeof NotificationService;
  private templateService: typeof NotificationTemplateService;
  private storageKey: string;
  private repeatInterval: number;
  private maxRepeats: number;

  constructor() {
    this.notificationService = NotificationService;
    this.templateService = NotificationTemplateService;
    this.storageKey = 'deadlineNotifications';
    this.repeatInterval = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
    this.maxRepeats = 3; // Maximum 3 repeat notifications
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.notificationService.initialize();
    await this.templateService.initialize();
  }

  /**
   * Schedule deadline notification for entry pack
   * @param userId - User ID
   * @param entryPackId - Entry pack ID
   * @param arrivalDate - Arrival date
   * @param destination - Destination name
   * @param options - Additional options
   * @returns Array of notification IDs
   */
  async scheduleDeadlineNotification(
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
        console.log('Arrival date is in the past, not scheduling deadline notification');
        return [];
      }

      // Check if notification already exists for this entry pack
      const existingNotification = await this.getScheduledDeadlineNotification(entryPackId);
      if (existingNotification && existingNotification.notificationIds.length > 0) {
        console.log(`Deadline notification already scheduled for entry pack ${entryPackId}`);
        return existingNotification.notificationIds;
      }

      // Calculate notification times
      const notificationTimes = this.calculateNotificationTimes(arrival);
      const notificationIds: string[] = [];

      // Schedule initial notification and repeats
      for (let i = 0; i < notificationTimes.length; i++) {
        const notificationTime = notificationTimes[i];
        
        // Don't schedule if time is in the past
        if (notificationTime <= now) {
          continue;
        }

        const isRepeat = i > 0;
        const repeatNumber = i;

        const notificationId = await this.templateService.scheduleTemplatedNotification(
          NOTIFICATION_TYPES.DEADLINE_WARNING,
          notificationTime,
          {
            destination
          },
          {
            ...options,
            urgent: true,
            data: {
              userId,
              entryPackId,
              destination,
              arrivalDate: arrival.toISOString(),
              deepLink: 'thailand/travelInfo',
              notificationType: 'deadlineWarning',
              isRepeat,
              repeatNumber,
              totalRepeats: this.maxRepeats
            }
          }
        );

        if (notificationId) {
          notificationIds.push(notificationId);
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
          notificationTimes: notificationTimes.map(t => t.toISOString()),
          status: 'scheduled'
        });

        console.log(`Deadline notifications scheduled for entry pack ${entryPackId}: ${notificationIds.length} notifications`);
      }

      return notificationIds;

    } catch (error) {
      console.error('Error scheduling deadline notification:', error);
      throw error;
    }
  }

  /**
   * Calculate notification times (arrival day 8 AM, then every 4 hours)
   * @param arrivalDate - Arrival date
   * @returns Array of notification times
   */
  private calculateNotificationTimes(arrivalDate: Date): Date[] {
    const times: Date[] = [];
    const arrival = new Date(arrivalDate);
    
    // First notification: 8 AM on arrival day
    const firstNotification = new Date(arrival);
    firstNotification.setHours(8, 0, 0, 0);
    times.push(firstNotification);

    // Repeat notifications every 4 hours (12 PM, 4 PM, 8 PM)
    for (let i = 1; i <= this.maxRepeats; i++) {
      const repeatTime = new Date(firstNotification);
      repeatTime.setHours(firstNotification.getHours() + (i * 4));
      times.push(repeatTime);
    }

    return times;
  }

  /**
   * Cancel deadline notifications for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Success status
   */
  async cancelDeadlineNotifications(entryPackId: string): Promise<boolean> {
    try {
      const notification = await this.getScheduledDeadlineNotification(entryPackId);
      if (!notification || !notification.notificationIds) {
        console.log(`No deadline notifications found for entry pack ${entryPackId}`);
        return false;
      }

      let cancelledCount = 0;
      
      // Cancel all scheduled notifications
      for (const notificationId of notification.notificationIds) {
        const cancelled = await this.notificationService.cancelNotification(notificationId);
        if (cancelled) {
          cancelledCount++;
        }
      }

      if (cancelledCount > 0) {
        // Update metadata status
        await this.updateNotificationStatus(entryPackId, 'cancelled');
        console.log(`Cancelled ${cancelledCount} deadline notifications for entry pack ${entryPackId}`);
      }

      return cancelledCount > 0;

    } catch (error) {
      console.error('Error cancelling deadline notifications:', error);
      return false;
    }
  }

  /**
   * Handle arrival date change - reschedule deadline notifications
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
      // Cancel existing deadline notifications
      await this.cancelDeadlineNotifications(entryPackId);

      // Schedule new deadline notifications if new date is valid
      if (newArrivalDate) {
        return await this.scheduleDeadlineNotification(userId, entryPackId, newArrivalDate, destination);
      }

      return [];

    } catch (error) {
      console.error('Error handling arrival date change for deadline notifications:', error);
      throw error;
    }
  }

  /**
   * Auto-cancel deadline notifications if TDAC submitted
   * @param entryPackId - Entry pack ID
   * @param tdacSubmission - TDAC submission data
   * @returns Whether notifications were cancelled
   */
  async autoCancelIfSubmitted(entryPackId: string, tdacSubmission: { arrCardNo?: string }): Promise<boolean> {
    try {
      if (!tdacSubmission || !tdacSubmission.arrCardNo) {
        return false; // No valid submission
      }

      const notification = await this.getScheduledDeadlineNotification(entryPackId);
      if (!notification) {
        return false; // No notifications to cancel
      }

      // Cancel the notifications
      const cancelled = await this.cancelDeadlineNotifications(entryPackId);
      
      if (cancelled) {
        console.log(`Deadline notifications auto-cancelled for entry pack ${entryPackId} due to TDAC submission`);
      }

      return cancelled;

    } catch (error) {
      console.error('Error auto-cancelling deadline notifications:', error);
      return false;
    }
  }

  /**
   * Check if deadline notification should be sent (verify submission status)
   * @param entryInfoId - Entry info ID
   * @returns Whether notification should be sent
   */
  async shouldSendDeadlineNotification(entryInfoId: string): Promise<boolean> {
    try {
      // Check if entry info exists and is not submitted
      const entryInfo = await UserDataService.getEntryInfo('current_user', 'thailand'); // Assuming destination is Thailand for now
      if (!entryInfo || entryInfo.id !== entryInfoId) {
        console.log(`Entry info ${entryInfoId} not found, not sending deadline notification`);
        return false;
      }

      // Check if DAC is already submitted
      const digitalArrivalCards = await UserDataService.getDigitalArrivalCardsByEntryInfoId(entryInfoId);
      const hasSuccessfulSubmission = digitalArrivalCards.some((dac: any) => dac.status === 'success');

      if (hasSuccessfulSubmission) {
        console.log(`DAC already submitted for entry info ${entryInfoId}, not sending deadline notification`);
        return false;
      }

      // Check if it's actually the arrival day
      const now = new Date();
      const travel = await UserDataService.getTravelInfo('current_user', 'thailand');
      if (!travel || !(travel as any).arrivalDate) {
        console.log(`No arrival date found for entry info ${entryInfoId}, not sending deadline notification`);
        return false;
      }

      const arrivalDate = new Date((travel as any).arrivalDate);
      const isArrivalDay = now.toDateString() === arrivalDate.toDateString();

      if (!isArrivalDay) {
        console.log(`Not arrival day for entry info ${entryInfoId}, not sending deadline notification`);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Error checking if deadline notification should be sent:', error);
      return false;
    }
  }

  /**
   * Handle "Remind Later" action from notification
   * @param entryPackId - Entry pack ID
   * @param repeatNumber - Current repeat number
   * @returns Next notification ID or null
   */
  async handleRemindLaterAction(entryPackId: string, repeatNumber: number): Promise<string | null> {
    try {
      const notification = await this.getScheduledDeadlineNotification(entryPackId);
      if (!notification) {
        return null;
      }

      // Check if we've reached max repeats
      if (repeatNumber >= this.maxRepeats) {
        console.log(`Max repeats reached for entry pack ${entryPackId}, not scheduling more reminders`);
        return null;
      }

      // Schedule next reminder in 4 hours
      const nextReminderTime = new Date();
      nextReminderTime.setHours(nextReminderTime.getHours() + 4);

      const nextNotificationId = await this.templateService.scheduleTemplatedNotification(
        NOTIFICATION_TYPES.DEADLINE_WARNING,
        nextReminderTime,
        {
          destination: notification.destination
        },
        {
          urgent: true,
          data: {
            userId: notification.userId,
            entryPackId,
            destination: notification.destination,
            arrivalDate: notification.arrivalDate,
            deepLink: 'thailand/travelInfo',
            notificationType: 'deadlineWarning',
            isRepeat: true,
            repeatNumber: repeatNumber + 1,
            totalRepeats: this.maxRepeats
          }
        }
      );

      if (nextNotificationId) {
        // Update stored notification IDs
        notification.notificationIds.push(nextNotificationId);
        await this.storeNotificationMetadata(entryPackId, notification);
        
        console.log(`Next deadline reminder scheduled for entry pack ${entryPackId} in 4 hours`);
      }

      return nextNotificationId;

    } catch (error) {
      console.error('Error handling remind later action:', error);
      return null;
    }
  }

  /**
   * Get scheduled deadline notification for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Notification metadata or null
   */
  async getScheduledDeadlineNotification(entryPackId: string): Promise<DeadlineNotificationMetadata | null> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, DeadlineNotificationMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

      return notifications[entryPackId] || null;

    } catch (error) {
      console.error('Error getting scheduled deadline notification:', error);
      return null;
    }
  }

  /**
   * Store notification metadata
   * @param entryPackId - Entry pack ID
   * @param metadata - Notification metadata
   */
  private async storeNotificationMetadata(entryPackId: string, metadata: DeadlineNotificationMetadata): Promise<void> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, DeadlineNotificationMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

      notifications[entryPackId] = metadata;

      await AsyncStorage.setItem(this.storageKey, JSON.stringify(notifications));

    } catch (error) {
      console.error('Error storing notification metadata:', error);
    }
  }

  /**
   * Update notification status
   * @param entryPackId - Entry pack ID
   * @param status - New status
   */
  private async updateNotificationStatus(entryPackId: string, status: DeadlineNotificationMetadata['status']): Promise<void> {
    try {
      const notification = await this.getScheduledDeadlineNotification(entryPackId);
      if (notification) {
        notification.status = status;
        notification.updatedAt = new Date().toISOString();
        await this.storeNotificationMetadata(entryPackId, notification);
      }

    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  }

  /**
   * Get all scheduled deadline notifications for user
   * @param userId - User ID
   * @returns Array of scheduled notifications
   */
  async getScheduledNotificationsForUser(userId: UserId): Promise<DeadlineNotificationMetadata[]> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, DeadlineNotificationMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

      return Object.values(notifications).filter(notification => 
        notification.userId === userId && notification.status === 'scheduled'
      );

    } catch (error) {
      console.error('Error getting scheduled notifications for user:', error);
      return [];
    }
  }

  /**
   * Cleanup expired deadline notifications
   * @returns Number of cleaned up notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, DeadlineNotificationMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

      const now = new Date();
      let cleanedCount = 0;

      for (const [entryPackId, notification] of Object.entries(notifications)) {
        const arrivalDate = new Date(notification.arrivalDate);
        
        // If arrival date has passed by more than 1 day, mark as expired
        const dayAfterArrival = new Date(arrivalDate);
        dayAfterArrival.setDate(dayAfterArrival.getDate() + 1);
        
        if (now > dayAfterArrival && notification.status === 'scheduled') {
          notification.status = 'expired';
          notification.expiredAt = now.toISOString();
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(notifications));
        console.log(`Cleaned up ${cleanedCount} expired deadline notifications`);
      }

      return cleanedCount;

    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      return 0;
    }
  }

  /**
   * Get statistics about deadline notifications
   * @returns Statistics object
   */
  async getStats(): Promise<ServiceStats> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, DeadlineNotificationMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

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
      console.error('Error getting deadline notification stats:', error);
      return { total: 0, scheduled: 0, cancelled: 0, expired: 0, sent: 0, totalNotificationIds: 0 };
    }
  }

  /**
   * Check if deadline notifications are scheduled for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Whether notifications are scheduled
   */
  async areNotificationsScheduled(entryPackId: string): Promise<boolean> {
    try {
      const notification = await this.getScheduledDeadlineNotification(entryPackId);
      return !!(notification && notification.status === 'scheduled' && notification.notificationIds?.length > 0);

    } catch (error) {
      console.error('Error checking if notifications are scheduled:', error);
      return false;
    }
  }

  /**
   * Clear all deadline notifications for user
   * @param userId - User ID
   * @returns Number of cleared notifications
   */
  async clearAllNotificationsForUser(userId: UserId): Promise<number> {
    try {
      const userNotifications = await this.getScheduledNotificationsForUser(userId);
      let clearedCount = 0;

      for (const notification of userNotifications) {
        const cancelled = await this.cancelDeadlineNotifications(notification.entryPackId);
        if (cancelled) {
          clearedCount++;
        }
      }

      console.log(`Cleared ${clearedCount} deadline notifications for user ${userId}`);
      return clearedCount;

    } catch (error) {
      console.error('Error clearing all notifications for user:', error);
      return 0;
    }
  }
}

// Export singleton instance
export default new DeadlineNotificationService();

