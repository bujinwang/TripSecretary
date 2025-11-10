/**
 * NotificationCoordinator - Coordinates all notification services for the progressive entry flow
 * 
 * Features:
 * - Initialize all notification services
 * - Coordinate between different notification types
 * - Handle notification cleanup and management
 * - Provide unified interface for notification operations
 * 
 * Requirements: 16.1-16.5
 */

import WindowOpenNotificationService from './WindowOpenNotificationService';
import NotificationTemplateService from './NotificationTemplateService';
import NotificationService from './NotificationService';
import UrgentReminderNotificationService from './UrgentReminderNotificationService';
import DeadlineNotificationService from './DeadlineNotificationService';
import ExpiryWarningNotificationService from './ExpiryWarningNotificationService';
import NotificationLogService from './NotificationLogService';
import type { UserId } from '../../types/data';

// Type definitions
export type ArrivalDateChangeResult = string | string[] | null;

interface ScheduledNotifications {
  windowOpen: any[];
  urgentReminder: any[];
  deadline: any[];
  expiryWarning: any[];
  total: number;
}

interface CleanupResults {
  windowOpenCleaned: number;
  urgentReminderCleaned: number;
  deadlineCleaned: number;
  totalCleaned: number;
}

export interface NotificationStats {
  windowOpen: unknown;
  urgentReminder: unknown;
  deadline: unknown;
  templated: {
    total: number;
    byType: Record<string, number>;
    [key: string]: unknown;
  };
  isInitialized: boolean;
  lastUpdated: string;
  [key: string]: unknown;
}

interface ValidationResult {
  isConsistent: boolean;
  validatedAt?: string;
  error?: string;
}

interface ConsistencyValidation {
  windowOpen: ValidationResult;
  urgentReminder: ValidationResult;
  overall: ValidationResult;
}

interface ClearResults {
  windowOpenCancelled: number;
  urgentReminderCancelled: number;
  deadlineCancelled: number;
  totalCancelled: number;
}

interface NotificationStatus {
  entryPackId: string;
  windowOpen: {
    isScheduled: boolean;
    notificationId: string | null;
    error?: string;
  };
  urgentReminder: {
    isScheduled: boolean;
    notificationId: string | null;
    reminderTime: string | null;
    error?: string;
  };
  deadline: {
    isScheduled: boolean;
    notificationIds: string[];
    notificationTimes: string[];
  };
  checkedAt: string;
}

interface SupersededInfo {
  reason?: string;
  [key: string]: any;
}

interface ArchivalInfo {
  reason?: string;
  arrivalDate?: string;
  hoursOverdue?: number;
  [key: string]: any;
}

class NotificationCoordinator {
  private windowOpenService: typeof WindowOpenNotificationService;
  private templateService: typeof NotificationTemplateService;
  private notificationService: typeof NotificationService;
  private urgentReminderService: typeof UrgentReminderNotificationService;
  private deadlineService: typeof DeadlineNotificationService;
  private expiryWarningService: typeof ExpiryWarningNotificationService;
  private isInitialized: boolean = false;

  constructor() {
    this.windowOpenService = WindowOpenNotificationService;
    this.templateService = NotificationTemplateService;
    this.notificationService = NotificationService;
    this.urgentReminderService = UrgentReminderNotificationService;
    this.deadlineService = DeadlineNotificationService;
    this.expiryWarningService = ExpiryWarningNotificationService;
  }

  /**
   * Initialize all notification services
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Initialize core notification service first
      await this.notificationService.initialize();
      
      // Initialize template service
      await this.templateService.initialize();
      
      // Initialize window open service
      await this.windowOpenService.initialize();
      
      // Initialize urgent reminder service
      await this.urgentReminderService.initialize();
      
      // Initialize deadline notification service
      await this.deadlineService.initialize();
      
      // Initialize expiry warning notification service
      await this.expiryWarningService.initialize();
      
      this.isInitialized = true;
      console.log('NotificationCoordinator initialized successfully');
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to initialize NotificationCoordinator:', err);
      throw err;
    }
  }

  /**
   * Schedule window open notification for entry pack
   * @param userId - User ID
   * @param entryPackId - Entry pack ID
   * @param arrivalDate - Arrival date
   * @param destination - Destination name
   * @returns Promise resolving to notification ID or null
   */
  async scheduleWindowOpenNotification(
    userId: UserId, 
    entryPackId: string, 
    arrivalDate: Date, 
    destination: string = 'Thailand'
  ): Promise<string | null> {
    try {
      await this.ensureInitialized();
      
      const notificationId = await this.windowOpenService.scheduleWindowOpenNotification(
        userId,
        entryPackId,
        arrivalDate,
        destination
      );

      // Log the coordination event
      if (notificationId) {
        await NotificationLogService.logEvent('coordinator_scheduled', {
          identifier: notificationId,
          type: 'submissionWindow',
          userId,
          entryPackId,
          destination
        } as any, {
          service: 'WindowOpenNotificationService',
          arrivalDate: arrivalDate.toISOString(),
          coordinatedBy: 'NotificationCoordinator'
        });
      }
      
      return notificationId;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to schedule window open notification:', err);
      
      // Log the error
      await NotificationLogService.logEvent('coordinator_error', {
        type: 'submissionWindow',
        userId,
        entryPackId,
        destination
      } as any, {
        error: err.message,
        service: 'WindowOpenNotificationService',
        operation: 'schedule'
      });
      
      throw err;
    }
  }

  /**
   * Cancel window open notification for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Promise resolving to success status
   */
  async cancelWindowOpenNotification(entryPackId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const success = await this.windowOpenService.cancelWindowOpenNotification(entryPackId);

      // Log the coordination event
      await NotificationLogService.logEvent('coordinator_cancelled', {
        type: 'submissionWindow',
        entryPackId
      } as any, {
        service: 'WindowOpenNotificationService',
        success,
        coordinatedBy: 'NotificationCoordinator'
      });
      
      return success;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to cancel window open notification:', err);
      
      // Log the error
      await NotificationLogService.logEvent('coordinator_error', {
        type: 'submissionWindow',
        entryPackId
      } as any, {
        error: err.message,
        service: 'WindowOpenNotificationService',
        operation: 'cancel'
      });
      
      return false;
    }
  }

  /**
   * Handle arrival date change
   * @param userId - User ID
   * @param entryPackId - Entry pack ID
   * @param newArrivalDate - New arrival date
   * @param oldArrivalDate - Old arrival date
   * @param destination - Destination name
   * @returns Promise resolving to results from all notification services
   */
  async handleArrivalDateChange(
    userId: UserId, 
    entryPackId: string, 
    newArrivalDate: Date, 
    oldArrivalDate: Date, 
    destination: string = 'Thailand'
  ): Promise<{
    windowOpen: ArrivalDateChangeResult;
    urgentReminder: ArrivalDateChangeResult;
    deadline: ArrivalDateChangeResult;
    expiryWarning: ArrivalDateChangeResult;
  }> {
    try {
      await this.ensureInitialized();
      
      // Handle window open notification change
      const windowOpenResult = await this.windowOpenService.handleArrivalDateChange(
        userId,
        entryPackId,
        newArrivalDate,
        oldArrivalDate,
        destination
      );

      // Handle urgent reminder notification change
      const urgentReminderResult = await this.urgentReminderService.handleArrivalDateChange(
        userId,
        entryPackId,
        newArrivalDate,
        oldArrivalDate,
        destination
      );

      // Handle deadline notification change
      const deadlineResult = await this.deadlineService.handleArrivalDateChange(
        userId,
        entryPackId,
        newArrivalDate,
        oldArrivalDate,
        destination
      );

      // Handle expiry warning notification change
      const expiryWarningResult = await this.expiryWarningService.handleArrivalDateChange(
        userId,
        entryPackId,
        newArrivalDate,
        oldArrivalDate,
        destination
      );

      return {
        windowOpen: windowOpenResult,
        urgentReminder: urgentReminderResult,
        deadline: deadlineResult,
        expiryWarning: expiryWarningResult
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to handle arrival date change:', err);
      throw err;
    }
  }

  /**
   * Auto-cancel notification if TDAC submitted
   * @param entryPackId - Entry pack ID
   * @param tdacSubmission - TDAC submission data
   * @returns Promise resolving to whether notification was cancelled
   */
  async autoCancelIfSubmitted(entryPackId: string, tdacSubmission: any): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      return await this.windowOpenService.autoCancelIfSubmitted(entryPackId, tdacSubmission);
    } catch (error) {
      console.error('Failed to auto-cancel notification:', error);
      return false;
    }
  }

  /**
   * Schedule urgent reminder notification for entry pack
   * @param userId - User ID
   * @param entryPackId - Entry pack ID
   * @param arrivalDate - Arrival date
   * @param destination - Destination name
   * @returns Promise resolving to notification ID or null
   */
  async scheduleUrgentReminderNotification(
    userId: UserId, 
    entryPackId: string, 
    arrivalDate: Date, 
    destination: string = 'Thailand'
  ): Promise<string | null> {
    try {
      await this.ensureInitialized();
      
      return await this.urgentReminderService.scheduleUrgentReminder(
        userId,
        entryPackId,
        arrivalDate,
        destination
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to schedule urgent reminder notification:', err);
      throw err;
    }
  }

  /**
   * Cancel urgent reminder notification for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Promise resolving to success status
   */
  async cancelUrgentReminderNotification(entryPackId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      return await this.urgentReminderService.cancelUrgentReminder(entryPackId);
    } catch (error) {
      console.error('Failed to cancel urgent reminder notification:', error);
      return false;
    }
  }

  /**
   * Handle urgent reminder for arrival date change
   * @param userId - User ID
   * @param entryPackId - Entry pack ID
   * @param newArrivalDate - New arrival date
   * @param oldArrivalDate - Old arrival date
   * @param destination - Destination name
   * @returns Promise resolving to new notification ID or null
   */
  async handleUrgentReminderDateChange(
    userId: UserId, 
    entryPackId: string, 
    newArrivalDate: Date, 
    oldArrivalDate: Date, 
    destination: string = 'Thailand'
  ): Promise<string | null> {
    try {
      await this.ensureInitialized();
      
      return await this.urgentReminderService.handleArrivalDateChange(
        userId,
        entryPackId,
        newArrivalDate,
        oldArrivalDate,
        destination
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to handle urgent reminder date change:', err);
      throw err;
    }
  }

  /**
   * Auto-cancel urgent reminder if TDAC submitted
   * @param entryPackId - Entry pack ID
   * @param tdacSubmission - TDAC submission data
   * @returns Promise resolving to whether notification was cancelled
   */
  async autoCancelUrgentReminderIfSubmitted(entryPackId: string, tdacSubmission: any): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      return await this.urgentReminderService.autoCancelIfSubmitted(entryPackId, tdacSubmission);
    } catch (error) {
      console.error('Failed to auto-cancel urgent reminder notification:', error);
      return false;
    }
  }

  /**
   * Schedule deadline notification for entry pack
   * @param userId - User ID
   * @param entryPackId - Entry pack ID
   * @param arrivalDate - Arrival date
   * @param destination - Destination name
   * @returns Promise resolving to array of notification IDs
   */
  async scheduleDeadlineNotification(
    userId: UserId, 
    entryPackId: string, 
    arrivalDate: Date, 
    destination: string = 'Thailand'
  ): Promise<string[]> {
    try {
      await this.ensureInitialized();
      
      return await this.deadlineService.scheduleDeadlineNotification(
        userId,
        entryPackId,
        arrivalDate,
        destination
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to schedule deadline notification:', err);
      throw err;
    }
  }

  /**
   * Cancel deadline notifications for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Promise resolving to success status
   */
  async cancelDeadlineNotifications(entryPackId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      return await this.deadlineService.cancelDeadlineNotifications(entryPackId);
    } catch (error) {
      console.error('Failed to cancel deadline notifications:', error);
      return false;
    }
  }

  /**
   * Auto-cancel deadline notifications if TDAC submitted
   * @param entryPackId - Entry pack ID
   * @param tdacSubmission - TDAC submission data
   * @returns Promise resolving to whether notifications were cancelled
   */
  async autoCancelDeadlineIfSubmitted(entryPackId: string, tdacSubmission: any): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      return await this.deadlineService.autoCancelIfSubmitted(entryPackId, tdacSubmission);
    } catch (error) {
      console.error('Failed to auto-cancel deadline notifications:', error);
      return false;
    }
  }

  /**
   * Handle "Remind Later" action from deadline notification
   * @param entryPackId - Entry pack ID
   * @param repeatNumber - Current repeat number
   * @returns Promise resolving to next notification ID or null
   */
  async handleDeadlineRemindLater(entryPackId: string, repeatNumber: number): Promise<string | null> {
    try {
      await this.ensureInitialized();
      
      return await this.deadlineService.handleRemindLaterAction(entryPackId, repeatNumber);
    } catch (error) {
      console.error('Failed to handle deadline remind later action:', error);
      return null;
    }
  }

  /**
   * Get all scheduled notifications for user
   * @param userId - User ID
   * @returns Promise resolving to scheduled notifications
   */
  async getScheduledNotificationsForUser(userId: UserId): Promise<ScheduledNotifications> {
    try {
      await this.ensureInitialized();
      
      const windowOpenNotifications = await this.windowOpenService.getScheduledNotificationsForUser(userId);
      const urgentReminderNotifications = await this.urgentReminderService.getScheduledRemindersForUser(userId);
      const deadlineNotifications = await this.deadlineService.getScheduledNotificationsForUser(userId);
      const expiryWarningNotifications = await this.expiryWarningService.getScheduledNotificationsForUser(userId);
      
      return {
        windowOpen: windowOpenNotifications,
        urgentReminder: urgentReminderNotifications,
        deadline: deadlineNotifications,
        expiryWarning: expiryWarningNotifications,
        total: windowOpenNotifications.length + urgentReminderNotifications.length + deadlineNotifications.length + expiryWarningNotifications.length
      };
    } catch (error) {
      console.error('Failed to get scheduled notifications for user:', error);
      return { windowOpen: [], urgentReminder: [], deadline: [], expiryWarning: [], total: 0 };
    }
  }

  /**
   * Cleanup expired notifications
   * @returns Promise resolving to cleanup results
   */
  async cleanupExpiredNotifications(): Promise<CleanupResults> {
    try {
      await this.ensureInitialized();
      
      const windowOpenCleaned = await this.windowOpenService.cleanupExpiredNotifications();
      const urgentReminderCleaned = await this.urgentReminderService.cleanupExpiredNotifications();
      const deadlineCleaned = await this.deadlineService.cleanupExpiredNotifications();
      
      return {
        windowOpenCleaned,
        urgentReminderCleaned,
        deadlineCleaned,
        totalCleaned: windowOpenCleaned + urgentReminderCleaned + deadlineCleaned
      };
    } catch (error) {
      console.error('Failed to cleanup expired notifications:', error);
      return { windowOpenCleaned: 0, urgentReminderCleaned: 0, deadlineCleaned: 0, totalCleaned: 0 };
    }
  }

  /**
   * Get comprehensive notification statistics
   * @returns Promise resolving to notification statistics
   */
  async getStats(): Promise<NotificationStats> {
    try {
      await this.ensureInitialized();
      
      const windowOpenStats = await this.windowOpenService.getStats();
      const urgentReminderStats = await this.urgentReminderService.getStats();
      const deadlineStats = await this.deadlineService.getStats();
      const templateStats = await this.templateService.getScheduledTemplatedNotifications();
      
      return {
        windowOpen: windowOpenStats,
        urgentReminder: urgentReminderStats,
        deadline: deadlineStats,
        templated: {
          total: templateStats.length,
          byType: templateStats.reduce((acc: Record<string, number>, notification: any) => {
            const type = notification.templateType || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {})
        },
        isInitialized: this.isInitialized,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to get notification stats:', err);
      return {
        windowOpen: { error: err.message },
        urgentReminder: { error: err.message },
        deadline: { error: err.message },
        templated: { total: 0, byType: {}, error: err.message },
        isInitialized: this.isInitialized,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Validate notification system consistency
   * @returns Promise resolving to validation results
   */
  async validateConsistency(): Promise<ConsistencyValidation> {
    try {
      await this.ensureInitialized();
      
      const windowOpenValidation = await this.windowOpenService.validateNotificationConsistency();
      const urgentReminderValidation = await this.urgentReminderService.validateNotificationConsistency();
      
      const overallConsistent = windowOpenValidation.isConsistent && urgentReminderValidation.isConsistent;
      
      return {
        windowOpen: windowOpenValidation,
        urgentReminder: urgentReminderValidation,
        overall: {
          isConsistent: overallConsistent,
          validatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to validate notification consistency:', err);
      return {
        windowOpen: { isConsistent: false, error: err.message },
        urgentReminder: { isConsistent: false, error: err.message },
        overall: { isConsistent: false, error: err.message, validatedAt: new Date().toISOString() }
      };
    }
  }

  /**
   * Clear all notifications for user
   * @param userId - User ID
   * @returns Promise resolving to clear results
   */
  async clearAllNotificationsForUser(userId: UserId): Promise<ClearResults> {
    try {
      await this.ensureInitialized();
      
      // Get user's notifications first
      const userNotifications = await this.getScheduledNotificationsForUser(userId);
      
      // Cancel window open notifications
      let windowOpenCancelled = 0;
      for (const notification of userNotifications.windowOpen) {
        const cancelled = await this.windowOpenService.cancelWindowOpenNotification(notification.entryPackId);
        if (cancelled) {
          windowOpenCancelled++;
        }
      }
      
      // Cancel urgent reminder notifications
      const urgentReminderCancelled = await this.urgentReminderService.clearAllRemindersForUser(userId);
      
      // Cancel deadline notifications
      const deadlineCancelled = await this.deadlineService.clearAllNotificationsForUser(userId);
      
      return {
        windowOpenCancelled,
        urgentReminderCancelled,
        deadlineCancelled,
        totalCancelled: windowOpenCancelled + urgentReminderCancelled + deadlineCancelled
      };
    } catch (error) {
      console.error('Failed to clear all notifications for user:', error);
      return { windowOpenCancelled: 0, urgentReminderCancelled: 0, deadlineCancelled: 0, totalCancelled: 0 };
    }
  }

  /**
   * Ensure the coordinator is initialized
   */
  async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Check if notification is scheduled for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Promise resolving to whether notification is scheduled
   */
  async isWindowOpenNotificationScheduled(entryPackId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      return await this.windowOpenService.isNotificationScheduled(entryPackId);
    } catch (error) {
      console.error('Failed to check if notification is scheduled:', error);
      return false;
    }
  }

  /**
   * Check if urgent reminder notification is scheduled for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Promise resolving to whether urgent reminder is scheduled
   */
  async isUrgentReminderNotificationScheduled(entryPackId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      return await this.urgentReminderService.isReminderScheduled(entryPackId);
    } catch (error) {
      console.error('Failed to check if urgent reminder notification is scheduled:', error);
      return false;
    }
  }

  /**
   * Schedule expiry warning notifications for entry pack
   * @param userId - User ID
   * @param entryPackId - Entry pack ID
   * @param arrivalDate - Arrival date
   * @param destination - Destination name
   * @returns Promise resolving to array of notification IDs
   */
  async scheduleExpiryWarningNotifications(
    userId: UserId, 
    entryPackId: string, 
    arrivalDate: Date, 
    destination: string = 'Thailand'
  ): Promise<string[]> {
    try {
      await this.ensureInitialized();
      
      return await this.expiryWarningService.scheduleExpiryWarningNotifications(
        userId,
        entryPackId,
        arrivalDate,
        destination
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to schedule expiry warning notifications:', err);
      throw err;
    }
  }

  /**
   * Cancel expiry warning notifications for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Promise resolving to success status
   */
  async cancelExpiryWarningNotifications(entryPackId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      return await this.expiryWarningService.cancelExpiryWarningNotifications(entryPackId);
    } catch (error) {
      console.error('Failed to cancel expiry warning notifications:', error);
      return false;
    }
  }

  /**
   * Auto-cancel expiry warning notifications if entry pack status changed
   * @param entryPackId - Entry pack ID
   * @param newStatus - New entry pack status
   * @returns Promise resolving to whether notifications were cancelled
   */
  async autoCancelExpiryWarningIfStatusChanged(entryPackId: string, newStatus: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      return await this.expiryWarningService.autoCancelIfStatusChanged(entryPackId, newStatus);
    } catch (error) {
      console.error('Failed to auto-cancel expiry warning notifications:', error);
      return false;
    }
  }

  /**
   * Handle archive action from expiry notification
   * @param entryPackId - Entry pack ID
   * @param userId - User ID
   * @returns Promise resolving to whether archival was successful
   */
  async handleExpiryArchiveAction(entryPackId: string, userId: UserId): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      return await this.expiryWarningService.handleArchiveAction(entryPackId, userId);
    } catch (error) {
      console.error('Failed to handle expiry archive action:', error);
      return false;
    }
  }

  /**
   * Cancel superseded notifications for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Promise resolving to success status
   */
  async cancelSupersededNotifications(entryPackId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const cancelledCount = await this.templateService.cancelNotificationsByType(
        'entryPackSuperseded',
        entryPackId
      );

      return cancelledCount > 0;
    } catch (error) {
      console.error('Failed to cancel superseded notifications:', error);
      return false;
    }
  }

  /**
   * Schedule superseded notification for entry pack
   * @param userId - User ID
   * @param entryPackId - Entry pack ID
   * @param destination - Destination name
   * @param supersededInfo - Superseded information
   * @returns Promise resolving to notification ID or null
   */
  async scheduleSupersededNotification(
    userId: UserId, 
    entryPackId: string, 
    destination: string = 'Thailand', 
    supersededInfo: SupersededInfo = {}
  ): Promise<string | null> {
    try {
      await this.ensureInitialized();
      
      // Schedule superseded notification using template service
      const notificationId = await this.templateService.scheduleSupersededNotification(
        entryPackId,
        {
          userId: userId,
          destination: destination,
          supersededInfo: supersededInfo,
          urgent: true // Superseded notifications should be high priority
        }
      );
      
      console.log('Superseded notification scheduled:', {
        notificationId,
        userId,
        entryPackId,
        destination,
        reason: supersededInfo.reason
      });
      
      return notificationId;
      
    } catch (error) {
      console.error('Failed to schedule superseded notification:', error);
      return null;
    }
  }

  /**
   * Schedule archival notification for entry pack
   * @param userId - User ID
   * @param entryPackId - Entry pack ID
   * @param destination - Destination name
   * @param archivalInfo - Archival information
   * @returns Promise resolving to notification ID or null
   */
  async scheduleArchivalNotification(
    userId: UserId, 
    entryPackId: string, 
    destination: string, 
    archivalInfo: ArchivalInfo = {}
  ): Promise<string | null> {
    try {
      await this.ensureInitialized();
      
      const title = `${destination} Entry Pack Archived`;
      const reason = archivalInfo.reason || 'automatic archival';
      const body = `Your ${destination} entry pack has been archived (${reason}).`;
      
      // Schedule immediate notification
      const notificationId = await this.notificationService.scheduleNotification(
        title,
        body,
        new Date(), // Send immediately
        {
          type: 'archival',
          entryPackId: entryPackId,
          userId: userId,
          destination: destination,
          archivalInfo: archivalInfo,
          deepLink: `entryPack/${entryPackId}`,
          actions: [
            {
              id: 'view_history',
              title: 'View History'
            },
            {
              id: 'dismiss',
              title: 'Dismiss'
            }
          ]
        }
      );
      
      console.log('Archival notification scheduled:', {
        notificationId,
        userId,
        entryPackId,
        destination
      });
      
      return notificationId;
      
    } catch (error) {
      console.error('Failed to schedule archival notification:', error);
      return null;
    }
  }

  /**
   * Get notification status for entry pack
   * @param entryPackId - Entry pack ID
   * @returns Promise resolving to notification status
   */
  async getNotificationStatus(entryPackId: string): Promise<NotificationStatus> {
    try {
      await this.ensureInitialized();
      
      const isWindowOpenScheduled = await this.windowOpenService.isNotificationScheduled(entryPackId);
      const windowOpenNotificationId = await this.windowOpenService.getScheduledNotificationId(entryPackId);
      
      const isUrgentReminderScheduled = await this.urgentReminderService.isReminderScheduled(entryPackId);
      const urgentReminderNotification = await this.urgentReminderService.getScheduledUrgentReminder(entryPackId);
      
      const areDeadlineNotificationsScheduled = await this.deadlineService.areNotificationsScheduled(entryPackId);
      const deadlineNotification = await this.deadlineService.getScheduledDeadlineNotification(entryPackId);
      
      return {
        entryPackId,
        windowOpen: {
          isScheduled: isWindowOpenScheduled,
          notificationId: windowOpenNotificationId
        },
        urgentReminder: {
          isScheduled: isUrgentReminderScheduled,
          notificationId: urgentReminderNotification?.notificationId || null,
          reminderTime: urgentReminderNotification?.reminderTime || null
        },
        deadline: {
          isScheduled: areDeadlineNotificationsScheduled,
          notificationIds: deadlineNotification?.notificationIds || [],
          notificationTimes: deadlineNotification?.notificationTimes || []
        },
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to get notification status:', err);
      return {
        entryPackId,
        windowOpen: { isScheduled: false, notificationId: null, error: err.message },
        urgentReminder: { isScheduled: false, notificationId: null, reminderTime: null, error: err.message },
        deadline: { isScheduled: false, notificationIds: [], notificationTimes: [] },
        checkedAt: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export default new NotificationCoordinator();

