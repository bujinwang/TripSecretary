import NotificationService from './NotificationService';
import NotificationActionService from './NotificationActionService';
import NotificationTemplates, { 
  NOTIFICATION_TYPES, 
  createNotificationFromTemplate,
  getNotificationMetadata,
  isValidNotificationType 
} from './NotificationTemplates';
import { getUserPreferredLocale } from '../../i18n/LocaleContext';

/**
 * NotificationTemplateService - High-level service for scheduling notifications using templates
 * 
 * Features:
 * - Schedule notifications using predefined templates
 * - Automatic language detection based on user preferences
 * - Template variable interpolation
 * - Deep link data generation
 * - Integration with NotificationService
 * 
 * Requirements: 16.1-16.5
 */
class NotificationTemplateService {
  constructor() {
    this.notificationService = NotificationService;
    this.actionService = NotificationActionService;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    await this.notificationService.initialize();
    await this.actionService.initialize();
  }

  /**
   * Schedule a notification using a template
   * @param {string} type - Notification type from NOTIFICATION_TYPES
   * @param {Date|number} date - When to trigger the notification
   * @param {Object} variables - Variables for template interpolation
   * @param {Object} options - Additional options
   * @returns {Promise<string|null>} Notification identifier or null if not scheduled
   */
  async scheduleTemplatedNotification(type, date, variables = {}, options = {}) {
    try {
      // Validate notification type
      if (!isValidNotificationType(type)) {
        throw new Error(`Invalid notification type: ${type}`);
      }

      // Get user's preferred language
      const language = options.language || await this.getUserLanguage();

      // Create notification from template
      const notification = createNotificationFromTemplate(type, language, variables, {
        templateType: type,
        scheduledAt: new Date().toISOString()
      });

      // Merge options
      const finalOptions = {
        ...notification.options,
        ...options,
        ignoreQuietHours: options.urgent || notification.options.priority === 'urgent'
      };

      // Schedule the notification
      const notificationId = await this.notificationService.scheduleNotification(
        notification.title,
        notification.body,
        date,
        notification.data,
        finalOptions
      );

      // Handle repeating notifications
      if (notification.metadata.repeatInterval && notification.metadata.maxRepeats) {
        await this.scheduleRepeatingNotification(
          type,
          date,
          variables,
          options,
          notification.metadata.repeatInterval,
          notification.metadata.maxRepeats
        );
      }

      return notificationId;

    } catch (error) {
      console.error('Error scheduling templated notification:', error);
      throw error;
    }
  }

  /**
   * Schedule submission window open notification
   * @param {Date} arrivalDate - User's arrival date
   * @param {string} destination - Destination name
   * @param {Object} options - Additional options
   * @returns {Promise<string|null>} Notification identifier
   */
  async scheduleSubmissionWindowNotification(arrivalDate, destination = 'Thailand', options = {}) {
    const submissionDate = new Date(arrivalDate);
    submissionDate.setDate(submissionDate.getDate() - 7); // 7 days before arrival

    const daysRemaining = Math.ceil((arrivalDate - submissionDate) / (1000 * 60 * 60 * 24));

    return await this.scheduleTemplatedNotification(
      NOTIFICATION_TYPES.SUBMISSION_WINDOW_OPEN,
      submissionDate,
      {
        destination,
        daysRemaining
      },
      options
    );
  }

  /**
   * Schedule urgent reminder notification
   * @param {Date} arrivalDate - User's arrival date
   * @param {string} destination - Destination name
   * @param {Object} options - Additional options
   * @returns {Promise<string|null>} Notification identifier
   */
  async scheduleUrgentReminderNotification(arrivalDate, destination = 'Thailand', options = {}) {
    const reminderDate = new Date(arrivalDate);
    reminderDate.setHours(reminderDate.getHours() - 24); // 24 hours before arrival

    const hoursRemaining = 24;

    return await this.scheduleTemplatedNotification(
      NOTIFICATION_TYPES.URGENT_REMINDER,
      reminderDate,
      {
        destination,
        hoursRemaining
      },
      { ...options, urgent: true }
    );
  }

  /**
   * Schedule deadline warning notification
   * @param {Date} arrivalDate - User's arrival date
   * @param {string} destination - Destination name
   * @param {Object} options - Additional options
   * @returns {Promise<string|null>} Notification identifier
   */
  async scheduleDeadlineWarningNotification(arrivalDate, destination = 'Thailand', options = {}) {
    const deadlineDate = new Date(arrivalDate);
    deadlineDate.setHours(8, 0, 0, 0); // 8 AM on arrival day

    return await this.scheduleTemplatedNotification(
      NOTIFICATION_TYPES.DEADLINE_WARNING,
      deadlineDate,
      {
        destination
      },
      { ...options, urgent: true }
    );
  }

  /**
   * Schedule arrival reminder notification
   * @param {Date} arrivalDate - User's arrival date
   * @param {string} destination - Destination name
   * @param {string} entryPackId - Entry pack identifier
   * @param {Object} options - Additional options
   * @returns {Promise<string|null>} Notification identifier
   */
  async scheduleArrivalReminderNotification(arrivalDate, destination = 'Thailand', entryPackId, options = {}) {
    const reminderDate = new Date(arrivalDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(18, 0, 0, 0); // 6 PM the day before

    return await this.scheduleTemplatedNotification(
      NOTIFICATION_TYPES.ARRIVAL_REMINDER,
      reminderDate,
      {
        destination
      },
      {
        ...options,
        data: {
          entryPackId,
          deepLink: `entryPack/detail/${entryPackId}`
        }
      }
    );
  }

  /**
   * Schedule arrival day notification
   * @param {Date} arrivalDate - User's arrival date
   * @param {string} destination - Destination name
   * @param {string} entryPackId - Entry pack identifier
   * @param {string} weather - Weather information (optional)
   * @param {Object} options - Additional options
   * @returns {Promise<string|null>} Notification identifier
   */
  async scheduleArrivalDayNotification(arrivalDate, destination = 'Thailand', entryPackId, weather = '', options = {}) {
    const notificationDate = new Date(arrivalDate);
    notificationDate.setHours(7, 0, 0, 0); // 7 AM on arrival day

    return await this.scheduleTemplatedNotification(
      NOTIFICATION_TYPES.ARRIVAL_DAY,
      notificationDate,
      {
        destination,
        weather: weather || 'Sunny'
      },
      {
        ...options,
        data: {
          entryPackId,
          deepLink: `entryPack/detail/${entryPackId}`
        }
      }
    );
  }

  /**
   * Schedule data change detection notification
   * @param {Array<string>} changedFields - List of changed field names
   * @param {string} entryPackId - Entry pack identifier
   * @param {Object} options - Additional options
   * @returns {Promise<string|null>} Notification identifier
   */
  async scheduleDataChangeNotification(changedFields, entryPackId, options = {}) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Schedule 5 minutes from now

    const changedFieldsText = changedFields.join(', ');

    return await this.scheduleTemplatedNotification(
      NOTIFICATION_TYPES.DATA_CHANGE_DETECTED,
      now,
      {
        changedFields: changedFieldsText
      },
      {
        ...options,
        data: {
          entryPackId,
          changedFields,
          deepLink: `entryPack/detail/${entryPackId}`
        }
      }
    );
  }

  /**
   * Schedule entry pack superseded notification
   * @param {string} entryPackId - Entry pack identifier
   * @param {Object} options - Additional options
   * @returns {Promise<string|null>} Notification identifier
   */
  async scheduleSupersededNotification(entryPackId, options = {}) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Schedule 1 minute from now

    return await this.scheduleTemplatedNotification(
      NOTIFICATION_TYPES.ENTRY_PACK_SUPERSEDED,
      now,
      {},
      {
        ...options,
        data: {
          entryPackId,
          deepLink: `thailand/travelInfo`
        }
      }
    );
  }

  /**
   * Schedule entry pack expiry warning notification
   * @param {Date} expiryDate - When the entry pack expires
   * @param {number} daysUntilExpiry - Days until expiry
   * @param {string} entryPackId - Entry pack identifier
   * @param {Object} options - Additional options
   * @returns {Promise<string|null>} Notification identifier
   */
  async scheduleExpiryWarningNotification(expiryDate, daysUntilExpiry, entryPackId, options = {}) {
    const warningDate = new Date(expiryDate);
    warningDate.setDate(warningDate.getDate() - 1); // 1 day before expiry

    return await this.scheduleTemplatedNotification(
      NOTIFICATION_TYPES.ENTRY_PACK_EXPIRED,
      warningDate,
      {
        daysUntilExpiry
      },
      {
        ...options,
        data: {
          entryPackId,
          deepLink: `entryPack/detail/${entryPackId}`
        }
      }
    );
  }

  /**
   * Schedule entry pack archived notification
   * @param {string} destination - Destination name
   * @param {string} entryPackId - Entry pack identifier
   * @param {Object} options - Additional options
   * @returns {Promise<string|null>} Notification identifier
   */
  async scheduleArchivedNotification(destination, entryPackId, options = {}) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 2); // Schedule 2 minutes from now

    return await this.scheduleTemplatedNotification(
      NOTIFICATION_TYPES.ENTRY_PACK_ARCHIVED,
      now,
      {
        destination
      },
      {
        ...options,
        data: {
          entryPackId,
          deepLink: 'history'
        }
      }
    );
  }

  /**
   * Schedule incomplete data reminder notification
   * @param {string} destination - Destination name
   * @param {number} completionPercent - Completion percentage
   * @param {Object} options - Additional options
   * @returns {Promise<string|null>} Notification identifier
   */
  async scheduleIncompleteDataReminder(destination, completionPercent, options = {}) {
    const reminderTime = await this.notificationService.getReminderTime();
    const [hours, minutes] = reminderTime.split(':').map(Number);
    
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 1); // Tomorrow
    reminderDate.setHours(hours, minutes, 0, 0);

    return await this.scheduleTemplatedNotification(
      NOTIFICATION_TYPES.INCOMPLETE_DATA_REMINDER,
      reminderDate,
      {
        destination,
        completionPercent
      },
      {
        ...options,
        data: {
          deepLink: 'thailand/travelInfo'
        }
      }
    );
  }

  /**
   * Schedule storage warning notification
   * @param {number} usedSpace - Used space in MB
   * @param {Object} options - Additional options
   * @returns {Promise<string|null>} Notification identifier
   */
  async scheduleStorageWarningNotification(usedSpace, options = {}) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10); // Schedule 10 minutes from now

    return await this.scheduleTemplatedNotification(
      NOTIFICATION_TYPES.STORAGE_WARNING,
      now,
      {
        usedSpace: Math.round(usedSpace)
      },
      {
        ...options,
        data: {
          deepLink: 'profile/settings'
        }
      }
    );
  }

  /**
   * Schedule backup completed notification
   * @param {number} backupSize - Backup size in MB
   * @param {Object} options - Additional options
   * @returns {Promise<string|null>} Notification identifier
   */
  async scheduleBackupCompletedNotification(backupSize, options = {}) {
    const now = new Date();
    now.setSeconds(now.getSeconds() + 30); // Schedule 30 seconds from now

    return await this.scheduleTemplatedNotification(
      NOTIFICATION_TYPES.BACKUP_COMPLETED,
      now,
      {
        backupSize: Math.round(backupSize * 100) / 100 // Round to 2 decimal places
      },
      {
        ...options,
        data: {
          deepLink: 'profile/settings'
        }
      }
    );
  }

  /**
   * Schedule repeating notification
   * @param {string} type - Notification type
   * @param {Date} initialDate - Initial notification date
   * @param {Object} variables - Template variables
   * @param {Object} options - Notification options
   * @param {number} interval - Repeat interval in milliseconds
   * @param {number} maxRepeats - Maximum number of repeats
   * @returns {Promise<Array<string>>} Array of notification identifiers
   */
  async scheduleRepeatingNotification(type, initialDate, variables, options, interval, maxRepeats) {
    const notificationIds = [];

    for (let i = 1; i <= maxRepeats; i++) {
      const repeatDate = new Date(initialDate.getTime() + (interval * i));
      
      try {
        const notificationId = await this.scheduleTemplatedNotification(
          type,
          repeatDate,
          variables,
          {
            ...options,
            data: {
              ...options.data,
              repeatNumber: i,
              isRepeat: true
            }
          }
        );
        
        if (notificationId) {
          notificationIds.push(notificationId);
        }
      } catch (error) {
        console.error(`Error scheduling repeat notification ${i}:`, error);
      }
    }

    return notificationIds;
  }

  /**
   * Cancel all notifications for a specific entry pack
   * @param {string} entryPackId - Entry pack identifier
   * @returns {Promise<boolean>} Success status
   */
  async cancelEntryPackNotifications(entryPackId) {
    try {
      const scheduledNotifications = await this.notificationService.getScheduledNotifications();
      
      const entryPackNotifications = scheduledNotifications.filter(notification => {
        const data = notification.content?.data;
        return data && data.entryPackId === entryPackId;
      });

      for (const notification of entryPackNotifications) {
        await this.notificationService.cancelNotification(notification.identifier);
      }

      console.log(`Cancelled ${entryPackNotifications.length} notifications for entry pack ${entryPackId}`);
      return true;

    } catch (error) {
      console.error('Error cancelling entry pack notifications:', error);
      return false;
    }
  }

  /**
   * Cancel notifications by type
   * @param {string} type - Notification type to cancel
   * @param {string} entryPackId - Optional entry pack ID to filter by
   * @returns {Promise<number>} Number of cancelled notifications
   */
  async cancelNotificationsByType(type, entryPackId = null) {
    try {
      const scheduledNotifications = await this.notificationService.getScheduledNotifications();
      
      const typeNotifications = scheduledNotifications.filter(notification => {
        const data = notification.content?.data;
        const matchesType = data && data.type === type;
        const matchesEntryPack = !entryPackId || data?.entryPackId === entryPackId;
        return matchesType && matchesEntryPack;
      });

      for (const notification of typeNotifications) {
        await this.notificationService.cancelNotification(notification.identifier);
      }

      console.log(`Cancelled ${typeNotifications.length} notifications of type ${type}${entryPackId ? ` for entry pack ${entryPackId}` : ''}`);
      return typeNotifications.length;

    } catch (error) {
      console.error('Error cancelling notifications by type:', error);
      return 0;
    }
  }

  /**
   * Get user's preferred language for notifications
   * @returns {Promise<string>} Language code (zh-CN, en, es)
   */
  async getUserLanguage() {
    try {
      const locale = await getUserPreferredLocale();
      
      // Map locale to supported notification languages
      if (locale.startsWith('zh')) return 'zh-CN';
      if (locale.startsWith('es')) return 'es';
      return 'en'; // Default to English
      
    } catch (error) {
      console.error('Error getting user language:', error);
      return 'en'; // Default to English
    }
  }

  /**
   * Get all scheduled notifications with template information
   * @returns {Promise<Array>} Array of scheduled notifications with template data
   */
  async getScheduledTemplatedNotifications() {
    try {
      const scheduledNotifications = await this.notificationService.getScheduledNotifications();
      
      return scheduledNotifications.map(notification => {
        const data = notification.content?.data;
        return {
          ...notification,
          templateType: data?.templateType,
          isTemplated: !!data?.templateType,
          variables: data?.variables,
          deepLink: data?.deepLink
        };
      });

    } catch (error) {
      console.error('Error getting scheduled templated notifications:', error);
      return [];
    }
  }

  /**
   * Check if a specific notification type is already scheduled
   * @param {string} type - Notification type
   * @param {string} entryPackId - Entry pack identifier (optional)
   * @returns {Promise<boolean>} Whether the notification type is already scheduled
   */
  async isNotificationTypeScheduled(type, entryPackId = null) {
    try {
      const scheduledNotifications = await this.getScheduledTemplatedNotifications();
      
      return scheduledNotifications.some(notification => {
        const matchesType = notification.templateType === type;
        const matchesEntryPack = !entryPackId || notification.content?.data?.entryPackId === entryPackId;
        return matchesType && matchesEntryPack;
      });

    } catch (error) {
      console.error('Error checking if notification type is scheduled:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new NotificationTemplateService();