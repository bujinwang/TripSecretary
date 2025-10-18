/**
 * NotificationNavigationHelper - Utility functions for handling navigation from notifications
 * 
 * Features:
 * - Parse notification parameters from route params
 * - Handle notification-specific UI states
 * - Provide feedback for notification actions
 * 
 * Requirements: 16.1-16.5
 */

import { Alert } from 'react-native';
import { getTranslationWithFallback } from '../i18n/locales';

/**
 * Check if the current navigation came from a notification
 * @param {Object} route - React Navigation route object
 * @returns {boolean} Whether navigation came from notification
 */
export function isFromNotification(route) {
  return route.params?.fromNotification === true;
}

/**
 * Get notification data from route parameters
 * @param {Object} route - React Navigation route object
 * @returns {Object|null} Notification data or null if not from notification
 */
export function getNotificationData(route) {
  if (!isFromNotification(route)) {
    return null;
  }
  
  return route.params?.notificationData || {};
}

/**
 * Get notification action from route parameters
 * @param {Object} route - React Navigation route object
 * @returns {string|null} Action identifier or null
 */
export function getNotificationAction(route) {
  const notificationData = getNotificationData(route);
  return notificationData?.fromAction || null;
}

/**
 * Check if navigation should auto-submit TDAC
 * @param {Object} route - React Navigation route object
 * @returns {boolean} Whether to auto-submit
 */
export function shouldAutoSubmit(route) {
  const notificationData = getNotificationData(route);
  return notificationData?.autoSubmit === true;
}

/**
 * Check if navigation is in resubmission mode
 * @param {Object} route - React Navigation route object
 * @returns {boolean} Whether in resubmission mode
 */
export function isResubmissionMode(route) {
  const notificationData = getNotificationData(route);
  return notificationData?.resubmissionMode === true;
}

/**
 * Get section to expand from notification data
 * @param {Object} route - React Navigation route object
 * @returns {string|null} Section to expand or null
 */
export function getExpandSection(route) {
  const notificationData = getNotificationData(route);
  return notificationData?.expandSection || route.params?.expandSection || null;
}

/**
 * Check if should show immigration guide
 * @param {Object} route - React Navigation route object
 * @returns {boolean} Whether to show guide
 */
export function shouldShowGuide(route) {
  const notificationData = getNotificationData(route);
  return notificationData?.showGuide === true;
}

/**
 * Get entry pack ID from notification data
 * @param {Object} route - React Navigation route object
 * @returns {string|null} Entry pack ID or null
 */
export function getEntryPackId(route) {
  const notificationData = getNotificationData(route);
  return notificationData?.entryPackId || route.params?.entryPackId || null;
}

/**
 * Get user ID from notification data
 * @param {Object} route - React Navigation route object
 * @returns {string|null} User ID or null
 */
export function getUserId(route) {
  const notificationData = getNotificationData(route);
  return notificationData?.userId || route.params?.userId || null;
}

/**
 * Get destination ID from notification data
 * @param {Object} route - React Navigation route object
 * @returns {string|null} Destination ID or null
 */
export function getDestinationId(route) {
  const notificationData = getNotificationData(route);
  return notificationData?.destinationId || route.params?.destinationId || null;
}

/**
 * Show notification action feedback to user
 * @param {string} action - The action that was performed
 * @param {string} locale - User's locale for translations
 */
export function showNotificationActionFeedback(action, locale = 'en') {
  const feedbackMessages = {
    submit: {
      title: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.submitTitle', locale),
      message: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.submitMessage', locale)
    },
    resubmit: {
      title: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.resubmitTitle', locale),
      message: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.resubmitMessage', locale)
    },
    continue: {
      title: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.continueTitle', locale),
      message: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.continueMessage', locale)
    },
    view: {
      title: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.viewTitle', locale),
      message: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.viewMessage', locale)
    }
  };

  const feedback = feedbackMessages[action];
  if (feedback) {
    Alert.alert(feedback.title, feedback.message, [
      {
        text: getTranslationWithFallback('common.ok', locale),
        style: 'default'
      }
    ]);
  }
}

/**
 * Handle notification-specific screen initialization
 * @param {Object} route - React Navigation route object
 * @param {Function} callback - Callback function to execute with notification context
 */
export function handleNotificationScreenInit(route, callback) {
  if (!isFromNotification(route)) {
    return;
  }

  const notificationData = getNotificationData(route);
  const action = getNotificationAction(route);

  // Execute callback with notification context
  if (typeof callback === 'function') {
    callback({
      action,
      data: notificationData,
      entryPackId: getEntryPackId(route),
      userId: getUserId(route),
      destinationId: getDestinationId(route),
      shouldAutoSubmit: shouldAutoSubmit(route),
      isResubmissionMode: isResubmissionMode(route),
      expandSection: getExpandSection(route),
      shouldShowGuide: shouldShowGuide(route)
    });
  }
}

/**
 * Create notification-aware navigation params
 * @param {Object} baseParams - Base navigation parameters
 * @param {Object} notificationContext - Notification context
 * @returns {Object} Enhanced navigation parameters
 */
export function createNotificationAwareParams(baseParams = {}, notificationContext = {}) {
  return {
    ...baseParams,
    fromNotification: true,
    notificationData: {
      timestamp: new Date().toISOString(),
      ...notificationContext
    }
  };
}

/**
 * Log notification navigation event for analytics
 * @param {string} screenName - Screen name that was navigated to
 * @param {Object} route - React Navigation route object
 */
export function logNotificationNavigation(screenName, route) {
  if (!isFromNotification(route)) {
    return;
  }

  const notificationData = getNotificationData(route);
  const action = getNotificationAction(route);

  console.log('Notification navigation event:', {
    screenName,
    action,
    notificationType: notificationData?.type,
    entryPackId: getEntryPackId(route),
    timestamp: new Date().toISOString()
  });

  // Here you could integrate with analytics services like Firebase Analytics
  // analytics().logEvent('notification_navigation', {
  //   screen_name: screenName,
  //   notification_type: notificationData?.type,
  //   action: action
  // });
}

/**
 * Clear notification parameters from route to prevent re-processing
 * @param {Object} navigation - React Navigation navigation object
 */
export function clearNotificationParams(navigation) {
  navigation.setParams({
    fromNotification: undefined,
    notificationData: undefined
  });
}

/**
 * Check if notification is still relevant (not expired)
 * @param {Object} route - React Navigation route object
 * @param {number} maxAgeMinutes - Maximum age in minutes (default: 30)
 * @returns {boolean} Whether notification is still relevant
 */
export function isNotificationRelevant(route, maxAgeMinutes = 30) {
  const notificationData = getNotificationData(route);
  
  if (!notificationData || !notificationData.timestamp) {
    return true; // Assume relevant if no timestamp
  }

  const notificationTime = new Date(notificationData.timestamp);
  const now = new Date();
  const ageMinutes = (now - notificationTime) / (1000 * 60);

  return ageMinutes <= maxAgeMinutes;
}

export default {
  isFromNotification,
  getNotificationData,
  getNotificationAction,
  shouldAutoSubmit,
  isResubmissionMode,
  getExpandSection,
  shouldShowGuide,
  getEntryPackId,
  getUserId,
  getDestinationId,
  showNotificationActionFeedback,
  handleNotificationScreenInit,
  createNotificationAwareParams,
  logNotificationNavigation,
  clearNotificationParams,
  isNotificationRelevant
};