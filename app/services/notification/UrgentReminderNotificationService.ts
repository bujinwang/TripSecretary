/**
 * UrgentReminderNotificationService - Handles urgent reminder notifications for entry pack submissions
 * 
 * Features:
 * - Send notification 24 hours before arrival if not submitted
 * - Use high priority notification (sound, vibration)
 * - Navigate to ThailandTravelInfoScreen on notification click
 * - Check submission status before sending
 * - Handle notification frequency control
 * 
 * Requirements: 16.2, 16.3
 */

import NotificationService from './NotificationService';
import NotificationTemplateService from './NotificationTemplateService';
import { NOTIFICATION_TYPES } from './NotificationTemplates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserDataService from '../data/UserDataService';
import type { UserId } from '../../types/data';

// Type definitions
interface UrgentReminderMetadata {
  notificationId: string;
  userId: UserId;
  entryPackId: string;
  arrivalDate: string;
  reminderTime: string;
  destination: string;
  scheduledAt: string;
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
}

interface ValidationResult {
  isConsistent: boolean;
  storedCount: number;
  systemCount: number;
  validatedAt: string;
  error?: string;
}

class UrgentReminderNotificationService {
  private notificationService: typeof NotificationService;
  private templateService: typeof NotificationTemplateService;
  private storageKey: string;
  private frequencyControlKey: string;
  private minIntervalHours: number;

  constructor() {
    this.notificationService = NotificationService;
    this.templateService = NotificationTemplateService;
    this.storageKey = 'urgentReminderNotifications';
    this.frequencyControlKey = 'urgentReminderFrequencyControl';
    this.minIntervalHours = 1; // Minimum 1 hour between same type notifications
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.notificationService.initialize();
    await this.templateService.initialize();
  }

  /**
   * Schedule urgent reminder notification for entry pack
   * @param userId - User ID
   * @param entryPackId - Entry pack ID
   * @param arrivalDate - Arrival date
   * @param destination - Destination name
   * @param options - Additional options
   * @returns Notification ID or null if not scheduled
   */
  async scheduleUrgentReminder(
    userId: UserId,
    entryPackId: string,
    arrivalDate: Date,
    destination: string = 'Thailand',
    options: NotificationOptions = {}
  ): Promise<string | null> {
    try {
      if (!userId || !entryPackId || !arrivalDate) {
        throw new Error('Missing required parameters: userId, entryPackId, or arrivalDate');
      }

      // Check if arrival date is valid and in the future
      const now = new Date();
      const arrival = new Date(arrivalDate);
      
      if (arrival <= now) {
        console.log('Arrival date is in the past, not scheduling urgent reminder');
        return null;
      }

      // Calculate reminder time (24 hours before arrival)
      const reminderTime = new Date(arrival);
      reminderTime.setHours(reminderTime.getHours() - 24);

      // Don't schedule if reminder time is in the past
      if (reminderTime <= now) {
        console.log('Reminder time is in the past, not scheduling urgent reminder');
        return null;
      }

      // Check if notification already exists for this entry pack
      const existingNotification = await this.getScheduledUrgentReminder(entryPackId);
      if (existingNotification) {
        console.log(`Urgent reminder already scheduled for entry pack ${entryPackId}`);
        return existingNotification.notificationId;
      }

      // Calculate hours remaining for template
      const hoursRemaining = Math.ceil((arrival.getTime() - reminderTime.getTime()) / (1000 * 60 * 60));

      // Schedule the notification using template service
      const notificationId = await this.templateService.scheduleUrgentReminderNotification(
        arrival,
        destination,
        {
          ...options,
          urgent: true,
          data: {
            userId,
            entryPackId,
            destination,
            arrivalDate: arrival.toISOString(),
            deepLink: 'thailand/travelInfo',
            notificationType: 'urgentReminder'
          }
        }
      );

      if (notificationId) {
        // Store notification metadata
        await this.storeNotificationMetadata(entryPackId, {
          notificationId,
          userId,
          entryPackId,
          arrivalDate: arrival.toISOString(),
          reminderTime: reminderTime.toISOString(),
          destination,
          scheduledAt: new Date().toISOString(),
          status: 'scheduled'
        });

        console.log(`Urgent reminder scheduled for entry pack ${entryPackId} at ${reminderTime.toISOString()}`);
      }

      return notificationId;

    } catch (error) {
      console.error('Error scheduling urgent reminder:', error);
      throw error;
    }
  }

  /**
   * Cancel urgent reminder notification for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Success status
   */
  async cancelUrgentReminder(entryPackId: string): Promise<boolean> {
    try {
      const notification = await this.getScheduledUrgentReminder(entryPackId);
      if (!notification) {
        console.log(`No urgent reminder found for entry pack ${entryPackId}`);
        return false;
      }

      // Cancel the notification
      const cancelled = await this.notificationService.cancelNotification(notification.notificationId);
      
      if (cancelled) {
        // Update metadata status
        await this.updateNotificationStatus(entryPackId, 'cancelled');
        console.log(`Urgent reminder cancelled for entry pack ${entryPackId}`);
      }

      return cancelled;

    } catch (error) {
      console.error('Error cancelling urgent reminder:', error);
      return false;
    }
  }

  /**
   * Handle arrival date change - reschedule urgent reminder
   * @param userId - User ID
   * @param entryPackId - Entry pack ID
   * @param newArrivalDate - New arrival date
   * @param oldArrivalDate - Old arrival date
   * @param destination - Destination name
   * @returns New notification ID
   */
  async handleArrivalDateChange(
    userId: UserId,
    entryPackId: string,
    newArrivalDate: Date,
    oldArrivalDate: Date,
    destination: string = 'Thailand'
  ): Promise<string | null> {
    try {
      // Cancel existing urgent reminder
      await this.cancelUrgentReminder(entryPackId);

      // Schedule new urgent reminder if new date is valid
      if (newArrivalDate) {
        return await this.scheduleUrgentReminder(userId, entryPackId, newArrivalDate, destination);
      }

      return null;

    } catch (error) {
      console.error('Error handling arrival date change for urgent reminder:', error);
      throw error;
    }
  }

  /**
   * Auto-cancel urgent reminder if TDAC submitted
   * @param entryPackId - Entry pack ID
   * @param tdacSubmission - TDAC submission data
   * @returns Whether notification was cancelled
   */
  async autoCancelIfSubmitted(entryPackId: string, tdacSubmission: { arrCardNo?: string }): Promise<boolean> {
    try {
      if (!tdacSubmission || !tdacSubmission.arrCardNo) {
        return false; // No valid submission
      }

      const notification = await this.getScheduledUrgentReminder(entryPackId);
      if (!notification) {
        return false; // No notification to cancel
      }

      // Cancel the notification
      const cancelled = await this.cancelUrgentReminder(entryPackId);
      
      if (cancelled) {
        console.log(`Urgent reminder auto-cancelled for entry pack ${entryPackId} due to TDAC submission`);
      }

      return cancelled;

    } catch (error) {
      console.error('Error auto-cancelling urgent reminder:', error);
      return false;
    }
  }

  /**
   * Check if urgent reminder should be sent (verify submission status)
   * @param entryInfoId - Entry info ID
   * @returns Whether reminder should be sent
   */
  async shouldSendUrgentReminder(entryInfoId: string): Promise<boolean> {
    try {
      // Check if entry info exists and is not submitted
      const entryInfo = await UserDataService.getEntryInfo('current_user', 'thailand'); // Assuming destination is Thailand for now
      if (!entryInfo || entryInfo.id !== entryInfoId) {
        console.log(`Entry info ${entryInfoId} not found, not sending urgent reminder`);
        return false;
      }

      // Check if DAC is already submitted
      const digitalArrivalCards = await UserDataService.getDigitalArrivalCardsByEntryInfoId(entryInfoId);
      const hasSuccessfulSubmission = digitalArrivalCards.some((dac: any) => dac.status === 'success');

      if (hasSuccessfulSubmission) {
        console.log(`DAC already submitted for entry info ${entryInfoId}, not sending urgent reminder`);
        return false;
      }

      // Check frequency control
      const canSend = await this.checkFrequencyControl(entryInfoId);
      if (!canSend) {
        console.log(`Frequency control prevents sending urgent reminder for entry info ${entryInfoId}`);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Error checking if urgent reminder should be sent:', error);
      return false;
    }
  }

  /**
   * Check frequency control to avoid spam notifications
   * @param entryPackId - Entry pack ID
   * @returns Whether notification can be sent
   */
  private async checkFrequencyControl(entryPackId: string): Promise<boolean> {
    try {
      const frequencyData = await AsyncStorage.getItem(this.frequencyControlKey);
      const frequencies: Record<string, string> = frequencyData ? JSON.parse(frequencyData) : {};

      const lastSent = frequencies[entryPackId];
      if (!lastSent) {
        return true; // No previous notification
      }

      const lastSentTime = new Date(lastSent);
      const now = new Date();
      const hoursSinceLastSent = (now.getTime() - lastSentTime.getTime()) / (1000 * 60 * 60);

      return hoursSinceLastSent >= this.minIntervalHours;

    } catch (error) {
      console.error('Error checking frequency control:', error);
      return true; // Allow sending on error
    }
  }

  /**
   * Record notification sent time for frequency control
   * @param entryPackId - Entry pack ID
   */
  async recordNotificationSent(entryPackId: string): Promise<void> {
    try {
      const frequencyData = await AsyncStorage.getItem(this.frequencyControlKey);
      const frequencies: Record<string, string> = frequencyData ? JSON.parse(frequencyData) : {};

      frequencies[entryPackId] = new Date().toISOString();

      await AsyncStorage.setItem(this.frequencyControlKey, JSON.stringify(frequencies));

    } catch (error) {
      console.error('Error recording notification sent time:', error);
    }
  }

  /**
   * Get scheduled urgent reminder for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Notification metadata or null
   */
  async getScheduledUrgentReminder(entryPackId: string): Promise<UrgentReminderMetadata | null> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, UrgentReminderMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

      return notifications[entryPackId] || null;

    } catch (error) {
      console.error('Error getting scheduled urgent reminder:', error);
      return null;
    }
  }

  /**
   * Store notification metadata
   * @param entryPackId - Entry pack ID
   * @param metadata - Notification metadata
   */
  private async storeNotificationMetadata(entryPackId: string, metadata: UrgentReminderMetadata): Promise<void> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, UrgentReminderMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

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
  private async updateNotificationStatus(entryPackId: string, status: UrgentReminderMetadata['status']): Promise<void> {
    try {
      const notification = await this.getScheduledUrgentReminder(entryPackId);
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
   * Get all scheduled urgent reminders for user
   * @param userId - User ID
   * @returns Array of scheduled notifications
   */
  async getScheduledRemindersForUser(userId: UserId): Promise<UrgentReminderMetadata[]> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, UrgentReminderMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

      return Object.values(notifications).filter(notification => 
        notification.userId === userId && notification.status === 'scheduled'
      );

    } catch (error) {
      console.error('Error getting scheduled reminders for user:', error);
      return [];
    }
  }

  /**
   * Cleanup expired urgent reminder notifications
   * @returns Number of cleaned up notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, UrgentReminderMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

      const now = new Date();
      let cleanedCount = 0;

      for (const [entryPackId, notification] of Object.entries(notifications)) {
        const reminderTime = new Date(notification.reminderTime);
        
        // If reminder time has passed, mark as expired
        if (reminderTime < now && notification.status === 'scheduled') {
          notification.status = 'expired';
          notification.expiredAt = now.toISOString();
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(notifications));
        console.log(`Cleaned up ${cleanedCount} expired urgent reminder notifications`);
      }

      return cleanedCount;

    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      return 0;
    }
  }

  /**
   * Get statistics about urgent reminder notifications
   * @returns Statistics object
   */
  async getStats(): Promise<ServiceStats> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, UrgentReminderMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

      const stats: ServiceStats = {
        total: Object.keys(notifications).length,
        scheduled: 0,
        cancelled: 0,
        expired: 0,
        sent: 0
      };

      Object.values(notifications).forEach(notification => {
        const status = notification.status;
        if (status in stats) {
          stats[status as keyof ServiceStats] = (stats[status as keyof ServiceStats] || 0) + 1;
        }
      });

      return stats;

    } catch (error) {
      console.error('Error getting urgent reminder stats:', error);
      return { total: 0, scheduled: 0, cancelled: 0, expired: 0, sent: 0 };
    }
  }

  /**
   * Validate notification consistency
   * @returns Validation results
   */
  async validateNotificationConsistency(): Promise<ValidationResult> {
    try {
      const notificationsData = await AsyncStorage.getItem(this.storageKey);
      const notifications: Record<string, UrgentReminderMetadata> = notificationsData ? JSON.parse(notificationsData) : {};

      const scheduledNotifications = await this.notificationService.getScheduledNotifications();
      const urgentReminderNotifications = scheduledNotifications.filter(n => 
        n.content?.data?.notificationType === 'urgentReminder'
      );

      const storedScheduled = Object.values(notifications).filter(n => n.status === 'scheduled');
      
      const isConsistent = storedScheduled.length === urgentReminderNotifications.length;

      return {
        isConsistent,
        storedCount: storedScheduled.length,
        systemCount: urgentReminderNotifications.length,
        validatedAt: new Date().toISOString()
      };

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error validating notification consistency:', err);
      return {
        isConsistent: false,
        storedCount: 0,
        systemCount: 0,
        validatedAt: new Date().toISOString(),
        error: err.message
      };
    }
  }

  /**
   * Clear all urgent reminder notifications for user
   * @param userId - User ID
   * @returns Number of cleared notifications
   */
  async clearAllRemindersForUser(userId: UserId): Promise<number> {
    try {
      const userNotifications = await this.getScheduledRemindersForUser(userId);
      let clearedCount = 0;

      for (const notification of userNotifications) {
        const cancelled = await this.cancelUrgentReminder(notification.entryPackId);
        if (cancelled) {
          clearedCount++;
        }
      }

      console.log(`Cleared ${clearedCount} urgent reminder notifications for user ${userId}`);
      return clearedCount;

    } catch (error) {
      console.error('Error clearing all reminders for user:', error);
      return 0;
    }
  }

  /**
   * Check if urgent reminder is scheduled for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Whether reminder is scheduled
   */
  async isReminderScheduled(entryPackId: string): Promise<boolean> {
    try {
      const notification = await this.getScheduledUrgentReminder(entryPackId);
      return !!(notification && notification.status === 'scheduled');

    } catch (error) {
      console.error('Error checking if reminder is scheduled:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new UrgentReminderNotificationService();

