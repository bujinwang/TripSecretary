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

class NotificationCoordinator {
  constructor() {
    this.windowOpenService = WindowOpenNotificationService;
    this.templateService = NotificationTemplateService;
    this.notificationService = NotificationService;
    this.urgentReminderService = UrgentReminderNotificationService;
    this.deadlineService = DeadlineNotificationService;
    this.expiryWarningService = ExpiryWarningNotificationService;
    this.isInitialized = false;
  }

  /**
   * Initialize all notification services
   */
  async initialize() {
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
      console.error('Failed to initialize NotificationCoordinator:', error);
      throw error;
    }
  }

  /**
   * Schedule window open notification for entry pack
   * @param {string} userId - User ID
   * @param {string} entryPackId - Entry pack ID
   * @param {Date} arrivalDate - Arrival date
   * @param {string} destination - Destination name
   * @returns {Promise<string|null>} Notification ID
   */
  async scheduleWindowOpenNotification(userId, entryPackId, arrivalDate, destination = 'Thailand') {
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
        }, {
          service: 'WindowOpenNotificationService',
          arrivalDate: arrivalDate.toISOString(),
          coordinatedBy: 'NotificationCoordinator'
        });
      }
      
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule window open notification:', error);
      
      // Log the error
      await NotificationLogService.logEvent('coordinator_error', {
        type: 'submissionWindow',
        userId,
        entryPackId,
        destination
      }, {
        error: error.message,
        service: 'WindowOpenNotificationService',
        operation: 'schedule'
      });
      
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
      await this.ensureInitialized();
      
      const success = await this.windowOpenService.cancelWindowOpenNotification(entryPackId);

      // Log the coordination event
      await NotificationLogService.logEvent('coordinator_cancelled', {
        type: 'submissionWindow',
        entryPackId
      }, {
        service: 'WindowOpenNotificationService',
        success,
        coordinatedBy: 'NotificationCoordinator'
      });
      
      return success;
    } catch (error) {
      console.error('Failed to cancel window open notification:', error);
      
      // Log the error
      await NotificationLogService.logEvent('coordinator_error', {
        type: 'submissionWindow',
        entryPackId
      }, {
        error: error.message,
        service: 'WindowOpenNotificationService',
        operation: 'cancel'
      });
      
      return false;
    }
  }

  /**
   * Handle arrival date change
   * @param {string} userId - User ID
   * @param {string} entryPackId - Entry pack ID
   * @param {Date} newArrivalDate - New arrival date
   * @param {Date} oldArrivalDate - Old arrival date
   * @param {string} destination - Destination name
   * @returns {Promise<Object>} Results from both notification services
   */
  async handleArrivalDateChange(userId, entryPackId, newArrivalDate, oldArrivalDate, destination = 'Thailand') {
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
      console.error('Failed to handle arrival date change:', error);
      throw error;
    }
  }

  /**
   * Auto-cancel notification if TDAC submitted
   * @param {string} entryPackId - Entry pack ID
   * @param {Object} tdacSubmission - TDAC submission data
   * @returns {Promise<boolean>} Whether notification was cancelled
   */
  async autoCancelIfSubmitted(entryPackId, tdacSubmission) {
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
   * @param {string} userId - User ID
   * @param {string} entryPackId - Entry pack ID
   * @param {Date} arrivalDate - Arrival date
   * @param {string} destination - Destination name
   * @returns {Promise<string|null>} Notification ID
   */
  async scheduleUrgentReminderNotification(userId, entryPackId, arrivalDate, destination = 'Thailand') {
    try {
      await this.ensureInitialized();
      
      return await this.urgentReminderService.scheduleUrgentReminder(
        userId,
        entryPackId,
        arrivalDate,
        destination
      );
    } catch (error) {
      console.error('Failed to schedule urgent reminder notification:', error);
      throw error;
    }
  }

  /**
   * Cancel urgent reminder notification for entry pack
   * @param {string} entryPackId - Entry pack ID
   * @returns {Promise<boolean>} Success status
   */
  async cancelUrgentReminderNotification(entryPackId) {
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
   * @param {string} userId - User ID
   * @param {string} entryPackId - Entry pack ID
   * @param {Date} newArrivalDate - New arrival date
   * @param {Date} oldArrivalDate - Old arrival date
   * @param {string} destination - Destination name
   * @returns {Promise<string|null>} New notification ID
   */
  async handleUrgentReminderDateChange(userId, entryPackId, newArrivalDate, oldArrivalDate, destination = 'Thailand') {
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
      console.error('Failed to handle urgent reminder date change:', error);
      throw error;
    }
  }

  /**
   * Auto-cancel urgent reminder if TDAC submitted
   * @param {string} entryPackId - Entry pack ID
   * @param {Object} tdacSubmission - TDAC submission data
   * @returns {Promise<boolean>} Whether notification was cancelled
   */
  async autoCancelUrgentReminderIfSubmitted(entryPackId, tdacSubmission) {
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
   * @param {string} userId - User ID
   * @param {string} entryPackId - Entry pack ID
   * @param {Date} arrivalDate - Arrival date
   * @param {string} destination - Destination name
   * @returns {Promise<Array<string>>} Array of notification IDs
   */
  async scheduleDeadlineNotification(userId, entryPackId, arrivalDate, destination = 'Thailand') {
    try {
      await this.ensureInitialized();
      
      return await this.deadlineService.scheduleDeadlineNotification(
        userId,
        entryPackId,
        arrivalDate,
        destination
      );
    } catch (error) {
      console.error('Failed to schedule deadline notification:', error);
      throw error;
    }
  }

  /**
   * Cancel deadline notifications for entry pack
   * @param {string} entryPackId - Entry pack ID
   * @returns {Promise<boolean>} Success status
   */
  async cancelDeadlineNotifications(entryPackId) {
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
   * @param {string} entryPackId - Entry pack ID
   * @param {Object} tdacSubmission - TDAC submission data
   * @returns {Promise<boolean>} Whether notifications were cancelled
   */
  async autoCancelDeadlineIfSubmitted(entryPackId, tdacSubmission) {
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
   * @param {string} entryPackId - Entry pack ID
   * @param {number} repeatNumber - Current repeat number
   * @returns {Promise<string|null>} Next notification ID or null
   */
  async handleDeadlineRemindLater(entryPackId, repeatNumber) {
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
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of scheduled notifications
   */
  async getScheduledNotificationsForUser(userId) {
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
      return { windowOpen: [], urgentReminder: [], total: 0 };
    }
  }

  /**
   * Cleanup expired notifications
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupExpiredNotifications() {
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
      return { windowOpenCleaned: 0, urgentReminderCleaned: 0, totalCleaned: 0 };
    }
  }

  /**
   * Get comprehensive notification statistics
   * @returns {Promise<Object>} Notification statistics
   */
  async getStats() {
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
          byType: templateStats.reduce((acc, notification) => {
            const type = notification.templateType || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {})
        },
        isInitialized: this.isInitialized,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return {
        windowOpen: { error: error.message },
        urgentReminder: { error: error.message },
        templated: { error: error.message },
        isInitialized: this.isInitialized,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Validate notification system consistency
   * @returns {Promise<Object>} Validation results
   */
  async validateConsistency() {
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
      console.error('Failed to validate notification consistency:', error);
      return {
        windowOpen: { isConsistent: false, error: error.message },
        urgentReminder: { isConsistent: false, error: error.message },
        overall: { isConsistent: false, error: error.message, validatedAt: new Date().toISOString() }
      };
    }
  }

  /**
   * Clear all notifications for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Clear results
   */
  async clearAllNotificationsForUser(userId) {
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
      return { windowOpenCancelled: 0, urgentReminderCancelled: 0, totalCancelled: 0 };
    }
  }

  /**
   * Ensure the coordinator is initialized
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Check if notification is scheduled for entry pack
   * @param {string} entryPackId - Entry pack ID
   * @returns {Promise<boolean>} Whether notification is scheduled
   */
  async isWindowOpenNotificationScheduled(entryPackId) {
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
   * @param {string} entryPackId - Entry pack ID
   * @returns {Promise<boolean>} Whether urgent reminder is scheduled
   */
  async isUrgentReminderNotificationScheduled(entryPackId) {
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
   * @param {string} userId - User ID
   * @param {string} entryPackId - Entry pack ID
   * @param {Date} arrivalDate - Arrival date
   * @param {string} destination - Destination name
   * @returns {Promise<Array<string>>} Array of notification IDs
   */
  async scheduleExpiryWarningNotifications(userId, entryPackId, arrivalDate, destination = 'Thailand') {
    try {
      await this.ensureInitialized();
      
      return await this.expiryWarningService.scheduleExpiryWarningNotifications(
        userId,
        entryPackId,
        arrivalDate,
        destination
      );
    } catch (error) {
      console.error('Failed to schedule expiry warning notifications:', error);
      throw error;
    }
  }

  /**
   * Cancel expiry warning notifications for entry pack
   * @param {string} entryPackId - Entry pack ID
   * @returns {Promise<boolean>} Success status
   */
  async cancelExpiryWarningNotifications(entryPackId) {
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
   * @param {string} entryPackId - Entry pack ID
   * @param {string} newStatus - New entry pack status
   * @returns {Promise<boolean>} Whether notifications were cancelled
   */
  async autoCancelExpiryWarningIfStatusChanged(entryPackId, newStatus) {
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
   * @param {string} entryPackId - Entry pack ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether archival was successful
   */
  async handleExpiryArchiveAction(entryPackId, userId) {
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
   * @param {string} entryPackId - Entry pack ID
   * @returns {Promise<boolean>} Success status
   */
  async cancelSupersededNotifications(entryPackId) {
    try {
      await this.ensureInitialized();
      
      return await this.templateService.cancelNotificationsByType(
        'entryPackSuperseded',
        entryPackId
      );
    } catch (error) {
      console.error('Failed to cancel superseded notifications:', error);
      return false;
    }
  }

  /**
   * Schedule superseded notification for entry pack
   * @param {string} userId - User ID
   * @param {string} entryPackId - Entry pack ID
   * @param {string} destination - Destination name
   * @param {Object} supersededInfo - Superseded information
   * @returns {Promise<string|null>} Notification ID
   */
  async scheduleSupersededNotification(userId, entryPackId, destination = 'Thailand', supersededInfo = {}) {
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
   * @param {string} userId - User ID
   * @param {string} entryPackId - Entry pack ID
   * @param {string} destination - Destination name
   * @param {Object} archivalInfo - Archival information
   * @returns {Promise<string|null>} Notification ID
   */
  async scheduleArchivalNotification(userId, entryPackId, destination, archivalInfo = {}) {
    try {
      await this.ensureInitialized();
      
      // Get user's preferred language for notification
      const locale = 'zh'; // TODO: Get from user preferences
      
      // Create notification content
      const title = this.templateService.getLocalizedText('progressiveEntryFlow.notifications.autoArchived.title', locale, {
        destination: destination
      }) || `${destination} Entry Pack Archived`;
      
      const body = this.templateService.getLocalizedText('progressiveEntryFlow.notifications.autoArchived.body', locale, {
        destination: destination,
        reason: archivalInfo.reason || 'automatic archival'
      }) || `Your ${destination} entry pack has been automatically archived`;
      
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
   * @param {string} entryPackId - Entry pack ID
   * @returns {Promise<Object>} Notification status
   */
  async getNotificationStatus(entryPackId) {
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
      console.error('Failed to get notification status:', error);
      return {
        entryPackId,
        windowOpen: { isScheduled: false, notificationId: null, error: error.message },
        urgentReminder: { isScheduled: false, notificationId: null, error: error.message },
        checkedAt: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export default new NotificationCoordinator();