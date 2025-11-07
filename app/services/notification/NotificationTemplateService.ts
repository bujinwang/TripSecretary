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

import NotificationService from './NotificationService';
import NotificationActionService from './NotificationActionService';
import NotificationTemplates, { 
  NOTIFICATION_TYPES, 
  createNotificationFromTemplate,
  getNotificationMetadata,
  isValidNotificationType 
} from './NotificationTemplates';
import { getUserPreferredLocale } from '../../i18n/LocaleContext';

// Type definitions
type NotificationType = string;
type LanguageCode = 'zh-CN' | 'en' | 'es';
type NotificationId = string | null;

interface TemplateVariables {
  destination?: string;
  daysRemaining?: number;
  hoursRemaining?: number;
  changedFields?: string;
  daysUntilExpiry?: number;
  completionPercent?: number;
  usedSpace?: number;
  backupSize?: number;
  weather?: string;
  [key: string]: any;
}

interface NotificationOptions {
  language?: LanguageCode;
  urgent?: boolean;
  data?: Record<string, any>;
  [key: string]: any;
}

interface ScheduledNotification {
  identifier: string;
  content: {
    title: string;
    body: string;
    data?: {
      type?: string;
      entryPackId?: string;
      templateType?: string;
      variables?: TemplateVariables;
      deepLink?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

interface TemplatedNotification extends ScheduledNotification {
  templateType?: string;
  isTemplated?: boolean;
  variables?: TemplateVariables;
  deepLink?: string;
}

class NotificationTemplateService {
  private notificationService: typeof NotificationService;
  private actionService: typeof NotificationActionService;

  constructor() {
    this.notificationService = NotificationService;
    this.actionService = NotificationActionService;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.notificationService.initialize();
    await this.actionService.initialize();
  }

  /**
   * Schedule a notification using a template
   * @param type - Notification type from NOTIFICATION_TYPES
   * @param date - When to trigger the notification
   * @param variables - Variables for template interpolation
   * @param options - Additional options
   * @returns Notification identifier or null if not scheduled
   */
  async scheduleTemplatedNotification(
    type: NotificationType,
    date: Date | number,
    variables: TemplateVariables = {},
    options: NotificationOptions = {}
  ): Promise<NotificationId> {
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
   * @param arrivalDate - User's arrival date
   * @param destination - Destination name
   * @param options - Additional options
   * @returns Notification identifier
   */
  async scheduleSubmissionWindowNotification(
    arrivalDate: Date,
    destination: string = 'Thailand',
    options: NotificationOptions = {}
  ): Promise<NotificationId> {
    const submissionDate = new Date(arrivalDate);
    submissionDate.setDate(submissionDate.getDate() - 7); // 7 days before arrival

    const daysRemaining = Math.ceil((arrivalDate.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));

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
   * @param arrivalDate - User's arrival date
   * @param destination - Destination name
   * @param options - Additional options
   * @returns Notification identifier
   */
  async scheduleUrgentReminderNotification(
    arrivalDate: Date,
    destination: string = 'Thailand',
    options: NotificationOptions = {}
  ): Promise<NotificationId> {
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
   * @param arrivalDate - User's arrival date
   * @param destination - Destination name
   * @param options - Additional options
   * @returns Notification identifier
   */
  async scheduleDeadlineWarningNotification(
    arrivalDate: Date,
    destination: string = 'Thailand',
    options: NotificationOptions = {}
  ): Promise<NotificationId> {
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
   * @param arrivalDate - User's arrival date
   * @param destination - Destination name
   * @param entryPackId - Entry pack identifier
   * @param options - Additional options
   * @returns Notification identifier
   */
  async scheduleArrivalReminderNotification(
    arrivalDate: Date,
    destination: string = 'Thailand',
    entryPackId: string,
    options: NotificationOptions = {}
  ): Promise<NotificationId> {
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
   * @param arrivalDate - User's arrival date
   * @param destination - Destination name
   * @param entryPackId - Entry pack identifier
   * @param weather - Weather information (optional)
   * @param options - Additional options
   * @returns Notification identifier
   */
  async scheduleArrivalDayNotification(
    arrivalDate: Date,
    destination: string = 'Thailand',
    entryPackId: string,
    weather: string = '',
    options: NotificationOptions = {}
  ): Promise<NotificationId> {
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
   * @param changedFields - List of changed field names
   * @param entryPackId - Entry pack identifier
   * @param options - Additional options
   * @returns Notification identifier
   */
  async scheduleDataChangeNotification(
    changedFields: string[],
    entryPackId: string,
    options: NotificationOptions = {}
  ): Promise<NotificationId> {
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
   * @param entryPackId - Entry pack identifier
   * @param options - Additional options
   * @returns Notification identifier
   */
  async scheduleSupersededNotification(
    entryPackId: string,
    options: NotificationOptions = {}
  ): Promise<NotificationId> {
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
   * @param expiryDate - When the entry pack expires
   * @param daysUntilExpiry - Days until expiry
   * @param entryPackId - Entry pack identifier
   * @param options - Additional options
   * @returns Notification identifier
   */
  async scheduleExpiryWarningNotification(
    expiryDate: Date,
    daysUntilExpiry: number,
    entryPackId: string,
    options: NotificationOptions = {}
  ): Promise<NotificationId> {
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
   * @param destination - Destination name
   * @param entryPackId - Entry pack identifier
   * @param options - Additional options
   * @returns Notification identifier
   */
  async scheduleArchivedNotification(
    destination: string,
    entryPackId: string,
    options: NotificationOptions = {}
  ): Promise<NotificationId> {
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
   * @param destination - Destination name
   * @param completionPercent - Completion percentage
   * @param options - Additional options
   * @returns Notification identifier
   */
  async scheduleIncompleteDataReminder(
    destination: string,
    completionPercent: number,
    options: NotificationOptions = {}
  ): Promise<NotificationId> {
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
   * @param usedSpace - Used space in MB
   * @param options - Additional options
   * @returns Notification identifier
   */
  async scheduleStorageWarningNotification(
    usedSpace: number,
    options: NotificationOptions = {}
  ): Promise<NotificationId> {
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
   * @param backupSize - Backup size in MB
   * @param options - Additional options
   * @returns Notification identifier
   */
  async scheduleBackupCompletedNotification(
    backupSize: number,
    options: NotificationOptions = {}
  ): Promise<NotificationId> {
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
   * @param type - Notification type
   * @param initialDate - Initial notification date
   * @param variables - Template variables
   * @param options - Notification options
   * @param interval - Repeat interval in milliseconds
   * @param maxRepeats - Maximum number of repeats
   * @returns Array of notification identifiers
   */
  async scheduleRepeatingNotification(
    type: NotificationType,
    initialDate: Date | number,
    variables: TemplateVariables,
    options: NotificationOptions,
    interval: number,
    maxRepeats: number
  ): Promise<string[]> {
    const notificationIds: string[] = [];
    const initialDateObj = typeof initialDate === 'number' ? new Date(initialDate) : initialDate;

    for (let i = 1; i <= maxRepeats; i++) {
      const repeatDate = new Date(initialDateObj.getTime() + (interval * i));
      
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
   * @param entryPackId - Entry pack identifier
   * @returns Success status
   */
  async cancelEntryPackNotifications(entryPackId: string): Promise<boolean> {
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
   * @param type - Notification type to cancel
   * @param entryPackId - Optional entry pack ID to filter by
   * @returns Number of cancelled notifications
   */
  async cancelNotificationsByType(
    type: NotificationType,
    entryPackId: string | null = null
  ): Promise<number> {
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
   * @returns Language code (zh-CN, en, es)
   */
  async getUserLanguage(): Promise<LanguageCode> {
    try {
      const locale = await getUserPreferredLocale();
      
      // Map locale to supported notification languages
      if (locale.startsWith('zh')) {
        return 'zh-CN';
      }
      if (locale.startsWith('es')) {
        return 'es';
      }
      return 'en'; // Default to English
      
    } catch (error) {
      console.error('Error getting user language:', error);
      return 'en'; // Default to English
    }
  }

  /**
   * Get all scheduled notifications with template information
   * @returns Array of scheduled notifications with template data
   */
  async getScheduledTemplatedNotifications(): Promise<TemplatedNotification[]> {
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
   * @param type - Notification type
   * @param entryPackId - Entry pack identifier (optional)
   * @returns Whether the notification type is already scheduled
   */
  async isNotificationTypeScheduled(
    type: NotificationType,
    entryPackId: string | null = null
  ): Promise<boolean> {
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

