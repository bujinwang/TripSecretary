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
import type { UserId } from '../../types/data';

// Type definitions
interface NotificationMetadata {
  notificationId: string;
  userId: UserId;
  destination: string;
  arrivalDate: string;
  notificationDate: string;
  scheduledAt: string;
}

interface NotificationOptions {
  data?: Record<string, any>;
  [key: string]: any;
}

interface ServiceStats {
  totalScheduled: number;
  activeNotifications: number;
  expiredNotifications: number;
  storageKey: string;
  lastChecked: string;
  error?: string;
}

interface ConsistencyIssue {
  entryPackId: string;
  issue: string;
  notificationId?: string;
}

interface ValidationResult {
  isConsistent: boolean;
  totalStored: number;
  validNotifications: number;
  inconsistencies: ConsistencyIssue[];
  validatedAt: string;
  error?: string;
}

interface ValidNotification {
  entryPackId: string;
  notificationId: string;
  scheduledFor: string | 'Unknown';
}

class WindowOpenNotificationService {
  private notificationTemplateService: typeof NotificationTemplateService;
  private notificationService: typeof NotificationService;
  private scheduledNotifications: Map<string, NotificationMetadata>;
  private storageKey: string;

  constructor() {
    this.notificationTemplateService = NotificationTemplateService;
    this.notificationService = NotificationService;
    this.scheduledNotifications = new Map();
    this.storageKey = 'windowOpenNotifications';
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
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
   * @param userId - User ID
   * @param entryPackId - Entry pack ID
   * @param arrivalDate - User's arrival date
   * @param destination - Destination name (default: Thailand)
   * @param options - Additional options
   * @returns Notification identifier or null if not scheduled
   */
  async scheduleWindowOpenNotification(
    userId: UserId,
    entryPackId: string,
    arrivalDate: Date,
    destination: string = 'Thailand',
    options: NotificationOptions = {}
  ): Promise<string | null> {
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
      const daysRemaining = Math.ceil((arrivalDate.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24));

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
   * @param entryPackId - Entry pack ID
   * @returns Success status
   */
  async cancelWindowOpenNotification(entryPackId: string): Promise<boolean> {
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
   * @param userId - User ID
   * @param entryPackId - Entry pack ID
   * @param newArrivalDate - New arrival date
   * @param oldArrivalDate - Previous arrival date (optional)
   * @param destination - Destination name
   * @returns New notification identifier
   */
  async handleArrivalDateChange(
    userId: UserId,
    entryPackId: string,
    newArrivalDate: Date,
    oldArrivalDate: Date | null = null,
    destination: string = 'Thailand'
  ): Promise<string | null> {
    try {
      console.log('Handling arrival date change:', {
        entryPackId,
        oldDate: oldArrivalDate?.toISOString(),
        newDate: newArrivalDate.toISOString(),
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
   * @param entryPackId - Entry pack ID
   * @param tdacSubmission - TDAC submission data
   * @returns Whether notification was cancelled
   */
  async autoCancelIfSubmitted(entryPackId: string, tdacSubmission: { arrCardNo?: string }): Promise<boolean> {
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
   * @returns Number of cleaned up notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
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
   * @param userId - User ID
   * @returns Array of scheduled notifications
   */
  async getScheduledNotificationsForUser(userId: UserId): Promise<Array<NotificationMetadata & { entryPackId: string }>> {
    try {
      const allNotifications = await this.loadScheduledNotifications();
      const userNotifications: Array<NotificationMetadata & { entryPackId: string }> = [];

      for (const [entryPackId, notificationData] of allNotifications.entries()) {
        if (notificationData.userId === userId) {
          userNotifications.push({
            entryPackId,
            ...notificationData
          });
        }
      }

      return userNotifications.sort((a, b) => 
        new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime()
      );

    } catch (error) {
      console.error('Failed to get scheduled notifications for user:', error);
      return [];
    }
  }

  /**
   * Check if window open notification is scheduled for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Whether notification is scheduled
   */
  async isNotificationScheduled(entryPackId: string): Promise<boolean> {
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
   * @param entryPackId - Entry pack ID
   * @returns Notification ID or null
   */
  async getScheduledNotificationId(entryPackId: string): Promise<string | null> {
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
   * @param entryPackId - Entry pack ID
   * @param notificationId - Notification ID
   * @param metadata - Additional metadata
   */
  private async storeNotificationMapping(
    entryPackId: string,
    notificationId: string,
    metadata: Omit<NotificationMetadata, 'notificationId'>
  ): Promise<void> {
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
   * @param entryPackId - Entry pack ID
   */
  private async removeNotificationMapping(entryPackId: string): Promise<void> {
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
   * @returns Map of entry pack ID to notification data
   */
  private async loadScheduledNotifications(): Promise<Map<string, NotificationMetadata>> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      
      if (!stored) {
        this.scheduledNotifications = new Map();
        return this.scheduledNotifications;
      }

      const notificationsObj = JSON.parse(stored) as Record<string, NotificationMetadata>;
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
   * @returns Service statistics
   */
  async getStats(): Promise<ServiceStats> {
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
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to get service stats:', err);
      return {
        totalScheduled: 0,
        activeNotifications: 0,
        expiredNotifications: 0,
        storageKey: this.storageKey,
        lastChecked: new Date().toISOString(),
        error: err.message
      };
    }
  }

  /**
   * Validate notification data consistency
   * @returns Validation result
   */
  async validateNotificationConsistency(): Promise<ValidationResult> {
    try {
      const scheduledNotifications = await this.loadScheduledNotifications();
      const systemScheduledNotifications = await this.notificationService.getScheduledNotifications();
      
      const inconsistencies: ConsistencyIssue[] = [];
      const validNotifications: ValidNotification[] = [];

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
            scheduledFor: (systemNotification.trigger as any)?.date?.toString() || 'Unknown'
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
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to validate notification consistency:', err);
      return {
        isConsistent: false,
        totalStored: 0,
        validNotifications: 0,
        inconsistencies: [],
        validatedAt: new Date().toISOString(),
        error: err.message
      };
    }
  }

  /**
   * Clear all scheduled window open notifications
   * @returns Number of notifications cleared
   */
  async clearAllNotifications(): Promise<number> {
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

