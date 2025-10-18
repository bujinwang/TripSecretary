/**
 * NotificationTemplates - Defines notification types and templates for the progressive entry flow
 * 
 * Features:
 * - Define notification types: submission window open, arrival imminent, data change, expiry warning
 * - Create title and body templates for each type
 * - Support multiple languages using i18n system (Chinese, English, Spanish)
 * - Include deep link data (navigate to relevant screens)
 * 
 * Requirements: 16.1-16.5, 20.1-20.5
 */

import { getTranslationWithFallback } from '../../i18n/locales';
import DateFormatter from '../../utils/DateFormatter';

/**
 * Notification types supported by the system
 */
export const NOTIFICATION_TYPES = {
  // Submission window notifications
  SUBMISSION_WINDOW_OPEN: 'submissionWindowOpen',
  URGENT_REMINDER: 'urgentReminder', 
  DEADLINE_WARNING: 'deadlineWarning',
  
  // Arrival notifications
  ARRIVAL_REMINDER: 'arrivalReminder',
  ARRIVAL_DAY: 'arrivalDay',
  
  // Data change notifications
  DATA_CHANGE_DETECTED: 'dataChangeDetected',
  
  // Entry pack lifecycle notifications
  ENTRY_PACK_SUPERSEDED: 'entryPackSuperseded',
  ENTRY_PACK_EXPIRY_WARNING: 'entryPackExpiryWarning',
  ENTRY_PACK_EXPIRED: 'entryPackExpired',
  ENTRY_PACK_ARCHIVED: 'entryPackArchived',
  
  // Completion notifications
  INCOMPLETE_DATA_REMINDER: 'incompleteDataReminder',
  
  // System notifications
  STORAGE_WARNING: 'storageWarning',
  BACKUP_COMPLETED: 'backupCompleted'
};

/**
 * Deep link destinations for notifications
 */
export const DEEP_LINK_DESTINATIONS = {
  THAILAND_ENTRY_FLOW: 'thailand/entryFlow',
  THAILAND_TRAVEL_INFO: 'thailand/travelInfo',
  ENTRY_PACK_DETAIL: 'entryPack/detail',
  PROFILE_SETTINGS: 'profile/settings',
  HISTORY: 'history',
  HOME: 'home'
};

/**
 * Notification template metadata (priority, sound, etc.)
 */
export const NOTIFICATION_METADATA = {
  [NOTIFICATION_TYPES.SUBMISSION_WINDOW_OPEN]: {
    deepLink: DEEP_LINK_DESTINATIONS.THAILAND_ENTRY_FLOW,
    priority: 'high',
    sound: true,
    actionButtons: [
      { id: 'submit', titleKey: 'progressiveEntryFlow.notifications.actions.submit' },
      { id: 'later', titleKey: 'progressiveEntryFlow.notifications.actions.later' }
    ]
  },

  [NOTIFICATION_TYPES.URGENT_REMINDER]: {
    deepLink: DEEP_LINK_DESTINATIONS.THAILAND_TRAVEL_INFO,
    priority: 'urgent',
    sound: true,
    vibration: true,
    actionButtons: [
      { id: 'submit', titleKey: 'progressiveEntryFlow.notifications.actions.submit' },
      { id: 'ignore', titleKey: 'progressiveEntryFlow.notifications.actions.ignore' }
    ]
  },

  [NOTIFICATION_TYPES.DEADLINE_WARNING]: {
    deepLink: DEEP_LINK_DESTINATIONS.THAILAND_ENTRY_FLOW,
    priority: 'urgent',
    sound: true,
    vibration: true,
    repeatInterval: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
    maxRepeats: 3,
    actionButtons: [
      { id: 'submit', titleKey: 'progressiveEntryFlow.notifications.actions.submit' },
      { id: 'later', titleKey: 'progressiveEntryFlow.notifications.actions.later' }
    ]
  },

  [NOTIFICATION_TYPES.ARRIVAL_REMINDER]: {
    deepLink: DEEP_LINK_DESTINATIONS.ENTRY_PACK_DETAIL,
    priority: 'high',
    sound: true,
    actionButtons: [
      { id: 'view', titleKey: 'progressiveEntryFlow.notifications.actions.view' },
      { id: 'guide', titleKey: 'progressiveEntryFlow.notifications.actions.guide' }
    ]
  },

  [NOTIFICATION_TYPES.ARRIVAL_DAY]: {
    deepLink: DEEP_LINK_DESTINATIONS.ENTRY_PACK_DETAIL,
    priority: 'normal',
    sound: true,
    actionButtons: [
      { id: 'view', titleKey: 'progressiveEntryFlow.notifications.actions.view' },
      { id: 'itinerary', titleKey: 'progressiveEntryFlow.notifications.actions.itinerary' }
    ]
  },

  [NOTIFICATION_TYPES.DATA_CHANGE_DETECTED]: {
    deepLink: DEEP_LINK_DESTINATIONS.ENTRY_PACK_DETAIL,
    priority: 'normal',
    sound: false,
    actionButtons: [
      { id: 'view', titleKey: 'progressiveEntryFlow.notifications.actions.view' },
      { id: 'resubmit', titleKey: 'progressiveEntryFlow.notifications.actions.resubmit' }
    ]
  },

  [NOTIFICATION_TYPES.ENTRY_PACK_SUPERSEDED]: {
    deepLink: DEEP_LINK_DESTINATIONS.THAILAND_TRAVEL_INFO,
    priority: 'high',
    sound: true,
    actionButtons: [
      { id: 'resubmit', titleKey: 'progressiveEntryFlow.notifications.actions.resubmitImmediately' },
      { id: 'later', titleKey: 'progressiveEntryFlow.notifications.actions.later' }
    ]
  },

  [NOTIFICATION_TYPES.ENTRY_PACK_EXPIRY_WARNING]: {
    deepLink: DEEP_LINK_DESTINATIONS.ENTRY_PACK_DETAIL,
    priority: 'normal',
    sound: true,
    actionButtons: [
      { id: 'view', titleKey: 'progressiveEntryFlow.notifications.actions.view' },
      { id: 'archive', titleKey: 'progressiveEntryFlow.notifications.actions.archive' }
    ]
  },

  [NOTIFICATION_TYPES.ENTRY_PACK_EXPIRED]: {
    deepLink: DEEP_LINK_DESTINATIONS.ENTRY_PACK_DETAIL,
    priority: 'normal',
    sound: false,
    actionButtons: [
      { id: 'archive', titleKey: 'progressiveEntryFlow.notifications.actions.archive' },
      { id: 'view', titleKey: 'progressiveEntryFlow.notifications.actions.view' }
    ]
  },

  [NOTIFICATION_TYPES.ENTRY_PACK_ARCHIVED]: {
    deepLink: DEEP_LINK_DESTINATIONS.HISTORY,
    priority: 'low',
    sound: false,
    actionButtons: [
      { id: 'view', titleKey: 'progressiveEntryFlow.notifications.actions.viewHistory' },
      { id: 'dismiss', titleKey: 'progressiveEntryFlow.notifications.actions.dismiss' }
    ]
  },

  [NOTIFICATION_TYPES.INCOMPLETE_DATA_REMINDER]: {
    deepLink: DEEP_LINK_DESTINATIONS.THAILAND_TRAVEL_INFO,
    priority: 'normal',
    sound: false,
    actionButtons: [
      { id: 'continue', titleKey: 'progressiveEntryFlow.notifications.actions.continue' },
      { id: 'later', titleKey: 'progressiveEntryFlow.notifications.actions.later' }
    ]
  },

  [NOTIFICATION_TYPES.STORAGE_WARNING]: {
    deepLink: DEEP_LINK_DESTINATIONS.PROFILE_SETTINGS,
    priority: 'normal',
    sound: false,
    actionButtons: [
      { id: 'cleanup', titleKey: 'progressiveEntryFlow.notifications.actions.cleanup' },
      { id: 'settings', titleKey: 'progressiveEntryFlow.notifications.actions.settings' }
    ]
  },

  [NOTIFICATION_TYPES.BACKUP_COMPLETED]: {
    deepLink: DEEP_LINK_DESTINATIONS.PROFILE_SETTINGS,
    priority: 'low',
    sound: false,
    actionButtons: [
      { id: 'view', titleKey: 'progressiveEntryFlow.notifications.actions.viewBackup' },
      { id: 'dismiss', titleKey: 'progressiveEntryFlow.notifications.actions.dismiss' }
    ]
  }
};

/**
 * Get notification template for a specific type and language using i18n
 * @param {string} type - Notification type from NOTIFICATION_TYPES
 * @param {string} language - Language code (zh-CN, en, es)
 * @returns {Object|null} Notification template or null if not found
 */
export function getNotificationTemplate(type, language = 'en') {
  const metadata = NOTIFICATION_METADATA[type];
  if (!metadata) {
    console.warn(`Notification template not found for type: ${type}`);
    return null;
  }

  // Map notification language codes to locale codes
  const localeMap = {
    'zh': 'zh-CN',
    'en': 'en',
    'es': 'es'
  };
  const locale = localeMap[language] || language;

  // Map notification types to translation keys
  const typeKeyMap = {
    [NOTIFICATION_TYPES.SUBMISSION_WINDOW_OPEN]: 'submissionWindowOpen',
    [NOTIFICATION_TYPES.URGENT_REMINDER]: 'urgentReminderNotification',
    [NOTIFICATION_TYPES.DEADLINE_WARNING]: 'deadlineWarning',
    [NOTIFICATION_TYPES.ARRIVAL_REMINDER]: 'arrivalReminder',
    [NOTIFICATION_TYPES.ARRIVAL_DAY]: 'arrivalDay',
    [NOTIFICATION_TYPES.DATA_CHANGE_DETECTED]: 'dataChangeDetected',
    [NOTIFICATION_TYPES.ENTRY_PACK_SUPERSEDED]: 'entryPackSuperseded',
    [NOTIFICATION_TYPES.ENTRY_PACK_EXPIRY_WARNING]: 'entryPackExpiryWarning',
    [NOTIFICATION_TYPES.ENTRY_PACK_EXPIRED]: 'entryPackExpired',
    [NOTIFICATION_TYPES.ENTRY_PACK_ARCHIVED]: 'entryPackArchived',
    [NOTIFICATION_TYPES.INCOMPLETE_DATA_REMINDER]: 'incompleteDataReminder',
    [NOTIFICATION_TYPES.STORAGE_WARNING]: 'storageWarning',
    [NOTIFICATION_TYPES.BACKUP_COMPLETED]: 'backupCompleted'
  };

  const translationKey = typeKeyMap[type];
  if (!translationKey) {
    console.warn(`No translation key mapping found for notification type: ${type}`);
    return null;
  }

  // Get title and body from i18n system
  const titleKey = `progressiveEntryFlow.notifications.${translationKey}.title`;
  const bodyKey = `progressiveEntryFlow.notifications.${translationKey}.body`;
  
  const title = getTranslationWithFallback(titleKey, locale);
  const body = getTranslationWithFallback(bodyKey, locale);

  // Get action button titles from i18n
  const actionButtons = metadata.actionButtons?.map(button => ({
    id: button.id,
    title: getTranslationWithFallback(button.titleKey, locale)
  })) || [];

  return {
    title,
    body,
    actionButtons
  };
}

/**
 * Get all metadata for a notification type (priority, sound, etc.)
 * @param {string} type - Notification type from NOTIFICATION_TYPES
 * @returns {Object} Notification metadata
 */
export function getNotificationMetadata(type) {
  const metadata = NOTIFICATION_METADATA[type];
  if (!metadata) {
    return {
      priority: 'normal',
      sound: false,
      vibration: false
    };
  }

  return {
    deepLink: metadata.deepLink,
    priority: metadata.priority || 'normal',
    sound: metadata.sound !== false,
    vibration: metadata.vibration || false,
    repeatInterval: metadata.repeatInterval,
    maxRepeats: metadata.maxRepeats
  };
}

/**
 * Interpolate template variables in notification text
 * @param {string} template - Template string with {{variable}} placeholders
 * @param {Object} variables - Variables to interpolate
 * @returns {string} Interpolated string
 */
export function interpolateTemplate(template, variables = {}) {
  if (!template || typeof template !== 'string') {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Create a complete notification object from template
 * @param {string} type - Notification type
 * @param {string} language - Language code
 * @param {Object} variables - Variables for interpolation
 * @param {Object} additionalData - Additional data to include
 * @returns {Object} Complete notification object
 */
export function createNotificationFromTemplate(type, language, variables = {}, additionalData = {}) {
  const template = getNotificationTemplate(type, language);
  const metadata = getNotificationMetadata(type);

  if (!template) {
    throw new Error(`Cannot create notification: template not found for type ${type} and language ${language}`);
  }

  return {
    title: interpolateTemplate(template.title, variables),
    body: interpolateTemplate(template.body, variables),
    data: {
      type,
      language,
      deepLink: metadata.deepLink,
      variables,
      ...additionalData
    },
    options: {
      priority: metadata.priority,
      sound: metadata.sound,
      vibration: metadata.vibration,
      actions: template.actionButtons || [],
      categoryIdentifier: `${type}_actions`,
      content: {
        sound: metadata.sound ? 'default' : false
      }
    },
    metadata: {
      repeatInterval: metadata.repeatInterval,
      maxRepeats: metadata.maxRepeats
    }
  };
}

/**
 * Get all available notification types
 * @returns {Array<string>} Array of notification type keys
 */
export function getAllNotificationTypes() {
  return Object.values(NOTIFICATION_TYPES);
}

/**
 * Check if a notification type exists
 * @param {string} type - Notification type to check
 * @returns {boolean} Whether the type exists
 */
export function isValidNotificationType(type) {
  return Object.values(NOTIFICATION_TYPES).includes(type);
}

/**
 * Get supported languages for notifications
 * @returns {Array<string>} Array of supported language codes
 */
export function getSupportedLanguages() {
  return ['zh', 'en', 'es'];
}

/**
 * Get notification types by priority level
 * @param {string} priority - Priority level (urgent, high, normal, low)
 * @returns {Array<string>} Array of notification types with that priority
 */
export function getNotificationTypesByPriority(priority) {
  return Object.keys(NOTIFICATION_METADATA).filter(type => {
    const metadata = getNotificationMetadata(type);
    return metadata.priority === priority;
  });
}

export default {
  NOTIFICATION_TYPES,
  DEEP_LINK_DESTINATIONS,
  NOTIFICATION_METADATA,
  getNotificationTemplate,
  getNotificationMetadata,
  interpolateTemplate,
  createNotificationFromTemplate,
  getAllNotificationTypes,
  isValidNotificationType,
  getSupportedLanguages,
  getNotificationTypesByPriority
};