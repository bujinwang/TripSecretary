/**
 * WindowOpenNotificationExample - Example usage of the window open notification system
 * 
 * This file demonstrates how to use the WindowOpenNotificationService
 * for scheduling notifications 7 days before arrival date.
 * 
 * Requirements: 16.1, 16.2
 */

import WindowOpenNotificationService from './WindowOpenNotificationService';
import NotificationCoordinator from './NotificationCoordinator';

/**
 * Example: Schedule window open notification when user sets arrival date
 */
export async function exampleScheduleNotification() {
  try {
    // Initialize the notification coordinator
    await NotificationCoordinator.initialize();

    // Example user data
    const userId = 'user123';
    const entryPackId = 'pack456';
    const arrivalDate = new Date('2024-12-01T10:00:00Z'); // December 1st, 2024
    const destination = 'Thailand';

    console.log('Scheduling window open notification...');
    console.log('Arrival Date:', arrivalDate.toISOString());
    console.log('Notification will be sent 7 days before:', 
      new Date(arrivalDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    );

    // Schedule the notification
    const notificationId = await NotificationCoordinator.scheduleWindowOpenNotification(
      userId,
      entryPackId,
      arrivalDate,
      destination
    );

    if (notificationId) {
      console.log('✅ Notification scheduled successfully!');
      console.log('Notification ID:', notificationId);
      
      // Check if notification is scheduled
      const isScheduled = await NotificationCoordinator.isWindowOpenNotificationScheduled(entryPackId);
      console.log('Is notification scheduled?', isScheduled);
      
      return notificationId;
    } else {
      console.log('❌ Notification was not scheduled (possibly due to past date or disabled preferences)');
      return null;
    }

  } catch (error) {
    console.error('Failed to schedule notification:', error);
    throw error;
  }
}

/**
 * Example: Handle arrival date change
 */
export async function exampleHandleArrivalDateChange() {
  try {
    await NotificationCoordinator.initialize();

    const userId = 'user123';
    const entryPackId = 'pack456';
    const oldArrivalDate = new Date('2024-12-01T10:00:00Z');
    const newArrivalDate = new Date('2024-12-15T10:00:00Z'); // Changed to December 15th
    const destination = 'Thailand';

    console.log('Handling arrival date change...');
    console.log('Old Date:', oldArrivalDate.toISOString());
    console.log('New Date:', newArrivalDate.toISOString());

    // Handle the date change (will cancel old notification and schedule new one)
    const newNotificationId = await NotificationCoordinator.handleArrivalDateChange(
      userId,
      entryPackId,
      newArrivalDate,
      oldArrivalDate,
      destination
    );

    if (newNotificationId) {
      console.log('✅ Notification rescheduled successfully!');
      console.log('New Notification ID:', newNotificationId);
      console.log('New notification will be sent 7 days before:', 
        new Date(newArrivalDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );
    } else {
      console.log('❌ Notification was not rescheduled');
    }

    return newNotificationId;

  } catch (error) {
    console.error('Failed to handle arrival date change:', error);
    throw error;
  }
}

/**
 * Example: Auto-cancel notification when TDAC is submitted
 */
export async function exampleAutoCancelOnSubmission() {
  try {
    await NotificationCoordinator.initialize();

    const entryPackId = 'pack456';
    
    // Example TDAC submission data
    const tdacSubmission = {
      arrCardNo: 'TDAC123456789',
      qrUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      pdfPath: '/path/to/entry-card.pdf',
      submittedAt: new Date().toISOString(),
      submissionMethod: 'api'
    };

    console.log('Auto-cancelling notification due to TDAC submission...');
    console.log('TDAC Arrival Card Number:', tdacSubmission.arrCardNo);

    // Auto-cancel the notification
    const cancelled = await NotificationCoordinator.autoCancelIfSubmitted(entryPackId, tdacSubmission);

    if (cancelled) {
      console.log('✅ Window open notification cancelled successfully!');
      console.log('Reason: TDAC already submitted');
    } else {
      console.log('ℹ️ No notification was cancelled (may not have been scheduled or invalid submission)');
    }

    return cancelled;

  } catch (error) {
    console.error('Failed to auto-cancel notification:', error);
    throw error;
  }
}

/**
 * Example: Get user's scheduled notifications
 */
export async function exampleGetUserNotifications() {
  try {
    await NotificationCoordinator.initialize();

    const userId = 'user123';

    console.log('Getting scheduled notifications for user:', userId);

    // Get all scheduled notifications for the user
    const notifications = await NotificationCoordinator.getScheduledNotificationsForUser(userId);

    console.log('📋 User Notifications Summary:');
    console.log('Total notifications:', notifications.total);
    console.log('Window open notifications:', notifications.windowOpen.length);

    if (notifications.windowOpen.length > 0) {
      console.log('\n📅 Scheduled Window Open Notifications:');
      notifications.windowOpen.forEach((notification, index) => {
        console.log(`${index + 1}. Entry Pack: ${notification.entryPackId}`);
        console.log(`   Destination: ${notification.destination}`);
        console.log(`   Arrival Date: ${notification.arrivalDate}`);
        console.log(`   Notification Date: ${notification.notificationDate}`);
        console.log(`   Scheduled At: ${notification.scheduledAt}`);
        console.log('');
      });
    } else {
      console.log('No window open notifications scheduled for this user.');
    }

    return notifications;

  } catch (error) {
    console.error('Failed to get user notifications:', error);
    throw error;
  }
}

/**
 * Example: Cleanup expired notifications
 */
export async function exampleCleanupExpiredNotifications() {
  try {
    await NotificationCoordinator.initialize();

    console.log('Cleaning up expired notifications...');

    // Cleanup expired notifications
    const cleanupResult = await NotificationCoordinator.cleanupExpiredNotifications();

    console.log('🧹 Cleanup Results:');
    console.log('Window open notifications cleaned:', cleanupResult.windowOpenCleaned);
    console.log('Total notifications cleaned:', cleanupResult.totalCleaned);

    if (cleanupResult.totalCleaned > 0) {
      console.log('✅ Expired notifications cleaned up successfully!');
    } else {
      console.log('ℹ️ No expired notifications found.');
    }

    return cleanupResult;

  } catch (error) {
    console.error('Failed to cleanup expired notifications:', error);
    throw error;
  }
}

/**
 * Example: Get notification system statistics
 */
export async function exampleGetNotificationStats() {
  try {
    await NotificationCoordinator.initialize();

    console.log('Getting notification system statistics...');

    // Get comprehensive stats
    const stats = await NotificationCoordinator.getStats();

    console.log('📊 Notification System Statistics:');
    console.log('System initialized:', stats.isInitialized);
    console.log('Last updated:', stats.lastUpdated);
    
    console.log('\n📱 Window Open Notifications:');
    console.log('Total scheduled:', stats.windowOpen.totalScheduled);
    console.log('Active notifications:', stats.windowOpen.activeNotifications);
    console.log('Expired notifications:', stats.windowOpen.expiredNotifications);
    
    console.log('\n📋 Template Notifications:');
    console.log('Total templated notifications:', stats.templated.total);
    if (stats.templated.byType && Object.keys(stats.templated.byType).length > 0) {
      console.log('By type:');
      Object.entries(stats.templated.byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }

    return stats;

  } catch (error) {
    console.error('Failed to get notification stats:', error);
    throw error;
  }
}

/**
 * Example: Validate notification system consistency
 */
export async function exampleValidateNotificationConsistency() {
  try {
    await NotificationCoordinator.initialize();

    console.log('Validating notification system consistency...');

    // Validate consistency
    const validation = await NotificationCoordinator.validateConsistency();

    console.log('🔍 Validation Results:');
    console.log('Overall consistency:', validation.overall.isConsistent ? '✅ Consistent' : '❌ Inconsistent');
    console.log('Validated at:', validation.overall.validatedAt);
    
    console.log('\n📱 Window Open Notifications:');
    console.log('Consistent:', validation.windowOpen.isConsistent ? '✅ Yes' : '❌ No');
    
    if (validation.windowOpen.inconsistencies && validation.windowOpen.inconsistencies.length > 0) {
      console.log('Inconsistencies found:');
      validation.windowOpen.inconsistencies.forEach((issue, index) => {
        console.log(`${index + 1}. Entry Pack: ${issue.entryPackId}`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   Notification ID: ${issue.notificationId}`);
      });
    }

    if (validation.windowOpen.validNotifications && validation.windowOpen.validNotifications.length > 0) {
      console.log(`Valid notifications: ${validation.windowOpen.validNotifications.length}`);
    }

    return validation;

  } catch (error) {
    console.error('Failed to validate notification consistency:', error);
    throw error;
  }
}

/**
 * Complete example workflow
 */
export async function exampleCompleteWorkflow() {
  console.log('🚀 Starting complete window open notification workflow example...\n');

  try {
    // 1. Schedule initial notification
    console.log('Step 1: Schedule initial notification');
    await exampleScheduleNotification();
    console.log('');

    // 2. Get user notifications
    console.log('Step 2: Check scheduled notifications');
    await exampleGetUserNotifications();
    console.log('');

    // 3. Handle arrival date change
    console.log('Step 3: Handle arrival date change');
    await exampleHandleArrivalDateChange();
    console.log('');

    // 4. Auto-cancel on TDAC submission
    console.log('Step 4: Auto-cancel on TDAC submission');
    await exampleAutoCancelOnSubmission();
    console.log('');

    // 5. Get final stats
    console.log('Step 5: Get final statistics');
    await exampleGetNotificationStats();
    console.log('');

    // 6. Validate consistency
    console.log('Step 6: Validate system consistency');
    await exampleValidateNotificationConsistency();
    console.log('');

    // 7. Cleanup
    console.log('Step 7: Cleanup expired notifications');
    await exampleCleanupExpiredNotifications();

    console.log('✅ Complete workflow example finished successfully!');

  } catch (error) {
    console.error('❌ Workflow example failed:', error);
    throw error;
  }
}

// Export all examples
export default {
  exampleScheduleNotification,
  exampleHandleArrivalDateChange,
  exampleAutoCancelOnSubmission,
  exampleGetUserNotifications,
  exampleCleanupExpiredNotifications,
  exampleGetNotificationStats,
  exampleValidateNotificationConsistency,
  exampleCompleteWorkflow
};