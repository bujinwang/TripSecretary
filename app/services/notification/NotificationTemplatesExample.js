/**
 * NotificationTemplatesExample - Example usage of notification templates
 * 
 * This file demonstrates how to use the notification template system
 * for scheduling various types of notifications in the progressive entry flow.
 * 
 * Requirements: 16.1-16.5
 */

import NotificationTemplateService from './NotificationTemplateService';
import { NOTIFICATION_TYPES } from './NotificationTemplates';

/**
 * Example: Schedule submission window notification
 * Called when user sets arrival date
 */
export async function scheduleSubmissionWindowExample() {
  try {
    const arrivalDate = new Date('2024-12-15T10:00:00Z'); // User's arrival date
    const destination = 'Thailand';

    const notificationId = await NotificationTemplateService.scheduleSubmissionWindowNotification(
      arrivalDate,
      destination
    );

    console.log('Submission window notification scheduled:', notificationId);
    return notificationId;

  } catch (error) {
    console.error('Error scheduling submission window notification:', error);
  }
}

/**
 * Example: Schedule urgent reminder notification
 * Called 24 hours before arrival if TDAC not submitted
 */
export async function scheduleUrgentReminderExample() {
  try {
    const arrivalDate = new Date('2024-12-15T10:00:00Z');
    const destination = 'Thailand';

    const notificationId = await NotificationTemplateService.scheduleUrgentReminderNotification(
      arrivalDate,
      destination,
      { urgent: true } // Mark as urgent for high priority
    );

    console.log('Urgent reminder notification scheduled:', notificationId);
    return notificationId;

  } catch (error) {
    console.error('Error scheduling urgent reminder notification:', error);
  }
}

/**
 * Example: Schedule arrival day notification
 * Called on the morning of arrival day
 */
export async function scheduleArrivalDayExample() {
  try {
    const arrivalDate = new Date('2024-12-15T10:00:00Z');
    const destination = 'Thailand';
    const entryPackId = 'entry_pack_123';
    const weather = 'Sunny, 28°C';

    const notificationId = await NotificationTemplateService.scheduleArrivalDayNotification(
      arrivalDate,
      destination,
      entryPackId,
      weather
    );

    console.log('Arrival day notification scheduled:', notificationId);
    return notificationId;

  } catch (error) {
    console.error('Error scheduling arrival day notification:', error);
  }
}

/**
 * Example: Schedule data change notification
 * Called when user edits data after TDAC submission
 */
export async function scheduleDataChangeExample() {
  try {
    const changedFields = ['passport number', 'travel dates'];
    const entryPackId = 'entry_pack_123';

    const notificationId = await NotificationTemplateService.scheduleDataChangeNotification(
      changedFields,
      entryPackId
    );

    console.log('Data change notification scheduled:', notificationId);
    return notificationId;

  } catch (error) {
    console.error('Error scheduling data change notification:', error);
  }
}

/**
 * Example: Schedule entry pack superseded notification
 * Called when entry pack is marked as superseded
 */
export async function scheduleSupersededExample() {
  try {
    const entryPackId = 'entry_pack_123';

    const notificationId = await NotificationTemplateService.scheduleSupersededNotification(
      entryPackId
    );

    console.log('Superseded notification scheduled:', notificationId);
    return notificationId;

  } catch (error) {
    console.error('Error scheduling superseded notification:', error);
  }
}

/**
 * Example: Schedule incomplete data reminder
 * Called daily for users with incomplete entry information
 */
export async function scheduleIncompleteDataReminderExample() {
  try {
    const destination = 'Thailand';
    const completionPercent = 75;

    const notificationId = await NotificationTemplateService.scheduleIncompleteDataReminder(
      destination,
      completionPercent
    );

    console.log('Incomplete data reminder scheduled:', notificationId);
    return notificationId;

  } catch (error) {
    console.error('Error scheduling incomplete data reminder:', error);
  }
}

/**
 * Example: Schedule storage warning notification
 * Called when storage usage exceeds threshold
 */
export async function scheduleStorageWarningExample() {
  try {
    const usedSpace = 150.5; // MB

    const notificationId = await NotificationTemplateService.scheduleStorageWarningNotification(
      usedSpace
    );

    console.log('Storage warning notification scheduled:', notificationId);
    return notificationId;

  } catch (error) {
    console.error('Error scheduling storage warning notification:', error);
  }
}

/**
 * Example: Cancel all notifications for an entry pack
 * Called when entry pack is deleted or archived
 */
export async function cancelEntryPackNotificationsExample() {
  try {
    const entryPackId = 'entry_pack_123';

    const success = await NotificationTemplateService.cancelEntryPackNotifications(entryPackId);

    console.log('Entry pack notifications cancelled:', success);
    return success;

  } catch (error) {
    console.error('Error cancelling entry pack notifications:', error);
  }
}

/**
 * Example: Get all scheduled templated notifications
 * Useful for debugging and displaying notification status
 */
export async function getScheduledNotificationsExample() {
  try {
    const notifications = await NotificationTemplateService.getScheduledTemplatedNotifications();

    console.log('Scheduled templated notifications:', notifications.length);
    
    notifications.forEach(notification => {
      console.log(`- ${notification.templateType}: ${notification.content.title}`);
      console.log(`  Scheduled for: ${new Date(notification.trigger.date).toLocaleString()}`);
      console.log(`  Deep link: ${notification.content.data.deepLink}`);
    });

    return notifications;

  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
  }
}

/**
 * Example: Check if specific notification type is already scheduled
 * Prevents duplicate notifications
 */
export async function checkNotificationScheduledExample() {
  try {
    const entryPackId = 'entry_pack_123';
    
    const isScheduled = await NotificationTemplateService.isNotificationTypeScheduled(
      NOTIFICATION_TYPES.URGENT_REMINDER,
      entryPackId
    );

    console.log('Urgent reminder already scheduled:', isScheduled);
    return isScheduled;

  } catch (error) {
    console.error('Error checking notification schedule:', error);
  }
}

/**
 * Example: Complete notification workflow for new entry pack
 * Schedules all relevant notifications for a new entry pack
 */
export async function scheduleCompleteNotificationWorkflow(entryPackData) {
  try {
    const { arrivalDate, destination, entryPackId, completionPercent } = entryPackData;
    const notificationIds = [];

    // Schedule submission window notification (7 days before arrival)
    if (completionPercent === 100) {
      const submissionId = await NotificationTemplateService.scheduleSubmissionWindowNotification(
        arrivalDate,
        destination
      );
      if (submissionId) {
notificationIds.push(submissionId);
}
    }

    // Schedule urgent reminder (24 hours before arrival)
    const urgentId = await NotificationTemplateService.scheduleUrgentReminderNotification(
      arrivalDate,
      destination
    );
    if (urgentId) {
notificationIds.push(urgentId);
}

    // Schedule deadline warning (on arrival day)
    const deadlineId = await NotificationTemplateService.scheduleDeadlineWarningNotification(
      arrivalDate,
      destination
    );
    if (deadlineId) {
notificationIds.push(deadlineId);
}

    // Schedule arrival reminder (day before arrival)
    const arrivalReminderId = await NotificationTemplateService.scheduleArrivalReminderNotification(
      arrivalDate,
      destination,
      entryPackId
    );
    if (arrivalReminderId) {
notificationIds.push(arrivalReminderId);
}

    // Schedule arrival day notification
    const arrivalDayId = await NotificationTemplateService.scheduleArrivalDayNotification(
      arrivalDate,
      destination,
      entryPackId
    );
    if (arrivalDayId) {
notificationIds.push(arrivalDayId);
}

    // Schedule incomplete data reminder if needed
    if (completionPercent < 100) {
      const incompleteId = await NotificationTemplateService.scheduleIncompleteDataReminder(
        destination,
        completionPercent
      );
      if (incompleteId) {
notificationIds.push(incompleteId);
}
    }

    console.log(`Scheduled ${notificationIds.length} notifications for entry pack ${entryPackId}`);
    return notificationIds;

  } catch (error) {
    console.error('Error scheduling complete notification workflow:', error);
    return [];
  }
}

/**
 * Example usage in a React component or service
 */
export const NotificationExamples = {
  // When user sets arrival date
  onArrivalDateSet: scheduleSubmissionWindowExample,
  
  // When TDAC submission fails or user hasn't submitted
  onSubmissionUrgent: scheduleUrgentReminderExample,
  
  // When user arrives at destination
  onArrivalDay: scheduleArrivalDayExample,
  
  // When user edits data after submission
  onDataChanged: scheduleDataChangeExample,
  
  // When entry pack becomes superseded
  onEntryPackSuperseded: scheduleSupersededExample,
  
  // Daily reminder for incomplete data
  onIncompleteDataCheck: scheduleIncompleteDataReminderExample,
  
  // When storage usage is high
  onStorageWarning: scheduleStorageWarningExample,
  
  // When entry pack is deleted
  onEntryPackDeleted: cancelEntryPackNotificationsExample,
  
  // For debugging and status display
  getScheduledNotifications: getScheduledNotificationsExample,
  
  // To prevent duplicate notifications
  checkIfScheduled: checkNotificationScheduledExample,
  
  // Complete workflow for new entry pack
  scheduleAllNotifications: scheduleCompleteNotificationWorkflow
};

export default NotificationExamples;