/**
 * NotificationService Usage Examples
 * 
 * This file demonstrates how to use the NotificationService
 * for various notification scenarios in the Progressive Entry Info Flow.
 * 
 * Requirements: 16.1-16.5
 */

import { NotificationService } from './index';

/**
 * Example 1: Schedule a simple reminder notification
 */
export async function scheduleSimpleReminder() {
  try {
    const notificationId = await NotificationService.scheduleNotification(
      'Complete Your Entry Information',
      'You have incomplete Thailand entry information. Tap to continue.',
      60, // 1 minute from now
      {
        type: 'entry_reminder',
        destinationId: 'thailand',
        deepLink: 'app://thailand-entry-flow'
      }
    );
    
    console.log('Simple reminder scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule simple reminder:', error);
    throw error;
  }
}

/**
 * Example 2: Schedule a submission window notification
 */
export async function scheduleSubmissionWindowNotification(arrivalDate) {
  try {
    // Calculate 72 hours before arrival
    const submissionDate = new Date(arrivalDate.getTime() - (72 * 60 * 60 * 1000));
    
    const notificationId = await NotificationService.scheduleNotification(
      'TDAC Submission Window Open',
      'You can now submit your Thailand entry card. Tap to submit.',
      submissionDate,
      {
        type: 'submission_window',
        destinationId: 'thailand',
        arrivalDate: arrivalDate.toISOString(),
        deepLink: 'app://thailand-entry-flow?action=submit'
      },
      {
        priority: 'high',
        sound: true,
        actions: [
          {
            identifier: 'submit_now',
            buttonTitle: 'Submit Now',
            options: { foreground: true }
          },
          {
            identifier: 'remind_later',
            buttonTitle: 'Remind Later',
            options: { foreground: false }
          }
        ],
        categoryIdentifier: 'submission_reminder'
      }
    );
    
    console.log('Submission window notification scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule submission window notification:', error);
    throw error;
  }
}

/**
 * Example 3: Schedule urgent deadline notification
 */
export async function scheduleUrgentDeadlineNotification(arrivalDate) {
  try {
    // Calculate 24 hours before arrival
    const urgentDate = new Date(arrivalDate.getTime() - (24 * 60 * 60 * 1000));
    
    const notificationId = await NotificationService.scheduleNotification(
      'Urgent: Submit Entry Card Soon',
      'Only 24 hours left to submit your Thailand entry card!',
      urgentDate,
      {
        type: 'urgent_deadline',
        destinationId: 'thailand',
        arrivalDate: arrivalDate.toISOString(),
        deepLink: 'app://thailand-entry-flow?action=submit&urgent=true'
      },
      {
        priority: 'high',
        sound: true,
        vibrate: true,
        actions: [
          {
            identifier: 'submit_immediately',
            buttonTitle: 'Submit Now',
            options: { foreground: true }
          }
        ],
        categoryIdentifier: 'urgent_reminder'
      }
    );
    
    console.log('Urgent deadline notification scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule urgent deadline notification:', error);
    throw error;
  }
}

/**
 * Example 4: Schedule arrival reminder notification
 */
export async function scheduleArrivalReminder(arrivalDate, entryPackId) {
  try {
    // Calculate 1 day before arrival
    const reminderDate = new Date(arrivalDate.getTime() - (24 * 60 * 60 * 1000));
    
    const notificationId = await NotificationService.scheduleNotification(
      'Arriving in Thailand Tomorrow',
      'Prepare your entry card and have a great trip!',
      reminderDate,
      {
        type: 'arrival_reminder',
        destinationId: 'thailand',
        entryPackId,
        arrivalDate: arrivalDate.toISOString(),
        deepLink: `app://entry-pack-detail/${entryPackId}`
      },
      {
        priority: 'default',
        sound: true,
        actions: [
          {
            identifier: 'view_entry_card',
            buttonTitle: 'View Entry Card',
            options: { foreground: true }
          },
          {
            identifier: 'view_itinerary',
            buttonTitle: 'View Itinerary',
            options: { foreground: true }
          }
        ],
        categoryIdentifier: 'arrival_reminder'
      }
    );
    
    console.log('Arrival reminder scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule arrival reminder:', error);
    throw error;
  }
}

/**
 * Example 5: Schedule data change notification
 */
export async function scheduleDataChangeNotification(entryPackId, changedFields) {
  try {
    const fieldsList = changedFields.join(', ');
    
    const notificationId = await NotificationService.scheduleNotification(
      'Entry Data Changed',
      `Your ${fieldsList} information has changed. You may need to resubmit your entry card.`,
      5, // 5 seconds from now (immediate)
      {
        type: 'data_change',
        entryPackId,
        changedFields,
        deepLink: `app://entry-pack-detail/${entryPackId}?action=review_changes`
      },
      {
        priority: 'default',
        sound: false, // Don't play sound for data change notifications
        actions: [
          {
            identifier: 'view_details',
            buttonTitle: 'View Details',
            options: { foreground: true }
          },
          {
            identifier: 'resubmit',
            buttonTitle: 'Resubmit',
            options: { foreground: true }
          },
          {
            identifier: 'ignore',
            buttonTitle: 'Ignore',
            options: { foreground: false }
          }
        ],
        categoryIdentifier: 'data_change'
      }
    );
    
    console.log('Data change notification scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule data change notification:', error);
    throw error;
  }
}

/**
 * Example 6: Cancel notifications for a specific entry pack
 */
export async function cancelEntryPackNotifications(entryPackId) {
  try {
    const scheduledNotifications = await NotificationService.getScheduledNotifications();
    
    const notificationsToCancel = scheduledNotifications.filter(notification => 
      notification.content.data?.entryPackId === entryPackId
    );
    
    const cancelPromises = notificationsToCancel.map(notification =>
      NotificationService.cancelNotification(notification.identifier)
    );
    
    await Promise.all(cancelPromises);
    
    console.log(`Cancelled ${notificationsToCancel.length} notifications for entry pack ${entryPackId}`);
    return notificationsToCancel.length;
  } catch (error) {
    console.error('Failed to cancel entry pack notifications:', error);
    throw error;
  }
}

/**
 * Example 7: Check notification permissions and guide user
 */
export async function checkAndRequestPermissions() {
  try {
    const isEnabled = await NotificationService.areNotificationsEnabled();
    
    if (!isEnabled) {
      console.log('Notifications are not enabled. User should be guided to enable them.');
      // In a real app, you would show a modal or alert here
      return false;
    }
    
    console.log('Notifications are enabled and ready to use.');
    return true;
  } catch (error) {
    console.error('Failed to check notification permissions:', error);
    return false;
  }
}

/**
 * Example 8: Get all scheduled notifications for debugging
 */
export async function debugScheduledNotifications() {
  try {
    const notifications = await NotificationService.getScheduledNotifications();
    
    console.log('Currently scheduled notifications:');
    notifications.forEach((notification, index) => {
      console.log(`${index + 1}. ${notification.content.title}`);
      console.log(`   ID: ${notification.identifier}`);
      console.log(`   Trigger: ${JSON.stringify(notification.trigger)}`);
      console.log(`   Data: ${JSON.stringify(notification.content.data)}`);
      console.log('');
    });
    
    return notifications;
  } catch (error) {
    console.error('Failed to get scheduled notifications:', error);
    return [];
  }
}

/**
 * Example usage in a React component:
 * 
 * import { scheduleSimpleReminder, scheduleSubmissionWindowNotification } from './NotificationServiceExample';
 * 
 * const MyComponent = () => {
 *   const handleScheduleReminder = async () => {
 *     try {
 *       const notificationId = await scheduleSimpleReminder();
 *       console.log('Reminder scheduled:', notificationId);
 *     } catch (error) {
 *       console.error('Failed to schedule reminder:', error);
 *     }
 *   };
 * 
 *   return (
 *     <Button title="Schedule Reminder" onPress={handleScheduleReminder} />
 *   );
 * };
 */