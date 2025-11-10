// @ts-nocheck

/**
 * DeadlineNotificationExample - Example usage of DeadlineNotificationService
 * 
 * Demonstrates:
 * - Scheduling deadline notifications on arrival day
 * - Repeating every 4 hours (maximum 3 times)
 * - "Remind Later" and "Submit Now" action buttons
 * - Auto-cancellation when TDAC is submitted
 * 
 * Requirements: 16.2, 16.3
 */

import DeadlineNotificationService from './DeadlineNotificationService';
import NotificationCoordinator from './NotificationCoordinator';

/**
 * Example: Schedule deadline notifications for an entry pack
 */
async function exampleScheduleDeadlineNotifications() {
  try {
    console.log('=== Deadline Notification Example ===');
    
    // Initialize the service
    await DeadlineNotificationService.initialize();
    
    // Example data
    const userId = 'user123';
    const entryPackId = 'pack456';
    const arrivalDate = new Date('2024-12-01T10:00:00Z'); // December 1st, 2024
    const destination = 'Thailand';
    
    console.log('Scheduling deadline notifications for:', {
      userId,
      entryPackId,
      arrivalDate: arrivalDate.toISOString(),
      destination
    });
    
    // Schedule deadline notifications
    const notificationIds = await DeadlineNotificationService.scheduleDeadlineNotification(
      userId,
      entryPackId,
      arrivalDate,
      destination
    );
    
    console.log('Scheduled notification IDs:', notificationIds);
    console.log('Number of notifications scheduled:', notificationIds.length);
    
    // The notifications will be scheduled for:
    // 1. 8:00 AM on arrival day (December 1st)
    // 2. 12:00 PM on arrival day (4 hours later)
    // 3. 4:00 PM on arrival day (8 hours later)
    // 4. 8:00 PM on arrival day (12 hours later)
    
    return notificationIds;
    
  } catch (error) {
    console.error('Error in deadline notification example:', error);
    throw error;
  }
}

/**
 * Example: Handle "Remind Later" action
 */
async function exampleHandleRemindLater() {
  try {
    console.log('=== Remind Later Action Example ===');
    
    const entryPackId = 'pack456';
    const currentRepeatNumber = 1; // First repeat
    
    console.log('Handling "Remind Later" action for:', {
      entryPackId,
      currentRepeatNumber
    });
    
    // Handle remind later action (schedules next reminder in 4 hours)
    const nextNotificationId = await DeadlineNotificationService.handleRemindLaterAction(
      entryPackId,
      currentRepeatNumber
    );
    
    if (nextNotificationId) {
      console.log('Next reminder scheduled with ID:', nextNotificationId);
    } else {
      console.log('No more reminders scheduled (max repeats reached)');
    }
    
    return nextNotificationId;
    
  } catch (error) {
    console.error('Error handling remind later action:', error);
    throw error;
  }
}

/**
 * Example: Auto-cancel notifications when TDAC is submitted
 */
async function exampleAutoCancelOnSubmission() {
  try {
    console.log('=== Auto-Cancel on Submission Example ===');
    
    const entryPackId = 'pack456';
    const tdacSubmission = {
      arrCardNo: 'CARD123456',
      submittedAt: new Date().toISOString(),
      qrUri: 'https://example.com/qr/CARD123456'
    };
    
    console.log('Auto-cancelling deadline notifications for:', {
      entryPackId,
      arrCardNo: tdacSubmission.arrCardNo
    });
    
    // Auto-cancel notifications when TDAC is submitted
    const cancelled = await DeadlineNotificationService.autoCancelIfSubmitted(
      entryPackId,
      tdacSubmission
    );
    
    console.log('Notifications cancelled:', cancelled);
    
    return cancelled;
    
  } catch (error) {
    console.error('Error auto-cancelling notifications:', error);
    throw error;
  }
}

/**
 * Example: Check if deadline notification should be sent
 */
async function exampleShouldSendCheck() {
  try {
    console.log('=== Should Send Check Example ===');
    
    const entryPackId = 'pack456';
    
    console.log('Checking if deadline notification should be sent for:', entryPackId);
    
    // Check if notification should be sent (validates submission status and arrival day)
    const shouldSend = await DeadlineNotificationService.shouldSendDeadlineNotification(entryPackId);
    
    console.log('Should send deadline notification:', shouldSend);
    
    return shouldSend;
    
  } catch (error) {
    console.error('Error checking if notification should be sent:', error);
    throw error;
  }
}

/**
 * Example: Get deadline notification statistics
 */
async function exampleGetStats() {
  try {
    console.log('=== Deadline Notification Stats Example ===');
    
    // Get comprehensive statistics
    const stats = await DeadlineNotificationService.getStats();
    
    console.log('Deadline notification statistics:', {
      total: stats.total,
      scheduled: stats.scheduled,
      cancelled: stats.cancelled,
      expired: stats.expired,
      totalNotificationIds: stats.totalNotificationIds
    });
    
    return stats;
    
  } catch (error) {
    console.error('Error getting deadline notification stats:', error);
    throw error;
  }
}

/**
 * Example: Integration with NotificationCoordinator
 */
async function exampleCoordinatorIntegration() {
  try {
    console.log('=== NotificationCoordinator Integration Example ===');
    
    // Initialize coordinator
    await NotificationCoordinator.initialize();
    
    const userId = 'user123';
    const entryPackId = 'pack456';
    const arrivalDate = new Date('2024-12-01T10:00:00Z');
    const destination = 'Thailand';
    
    console.log('Scheduling all notifications through coordinator...');
    
    // Schedule all notification types through coordinator
    const windowOpenId = await NotificationCoordinator.scheduleWindowOpenNotification(
      userId, entryPackId, arrivalDate, destination
    );
    
    const urgentReminderId = await NotificationCoordinator.scheduleUrgentReminderNotification(
      userId, entryPackId, arrivalDate, destination
    );
    
    const deadlineIds = await NotificationCoordinator.scheduleDeadlineNotification(
      userId, entryPackId, arrivalDate, destination
    );
    
    console.log('All notifications scheduled:', {
      windowOpen: windowOpenId,
      urgentReminder: urgentReminderId,
      deadline: deadlineIds
    });
    
    // Get notification status
    const status = await NotificationCoordinator.getNotificationStatus(entryPackId);
    console.log('Notification status:', status);
    
    return {
      windowOpen: windowOpenId,
      urgentReminder: urgentReminderId,
      deadline: deadlineIds,
      status
    };
    
  } catch (error) {
    console.error('Error in coordinator integration example:', error);
    throw error;
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🚀 Running Deadline Notification Examples...\n');
  
  try {
    // Example 1: Schedule deadline notifications
    await exampleScheduleDeadlineNotifications();
    console.log('✅ Schedule example completed\n');
    
    // Example 2: Handle remind later action
    await exampleHandleRemindLater();
    console.log('✅ Remind later example completed\n');
    
    // Example 3: Auto-cancel on submission
    await exampleAutoCancelOnSubmission();
    console.log('✅ Auto-cancel example completed\n');
    
    // Example 4: Should send check
    await exampleShouldSendCheck();
    console.log('✅ Should send check example completed\n');
    
    // Example 5: Get statistics
    await exampleGetStats();
    console.log('✅ Stats example completed\n');
    
    // Example 6: Coordinator integration
    await exampleCoordinatorIntegration();
    console.log('✅ Coordinator integration example completed\n');
    
    console.log('🎉 All deadline notification examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export examples for use in other files
export {
  exampleScheduleDeadlineNotifications,
  exampleHandleRemindLater,
  exampleAutoCancelOnSubmission,
  exampleShouldSendCheck,
  exampleGetStats,
  exampleCoordinatorIntegration,
  runAllExamples
};

// Export default for direct execution
export default {
  scheduleDeadlineNotifications: exampleScheduleDeadlineNotifications,
  handleRemindLater: exampleHandleRemindLater,
  autoCancelOnSubmission: exampleAutoCancelOnSubmission,
  shouldSendCheck: exampleShouldSendCheck,
  getStats: exampleGetStats,
  coordinatorIntegration: exampleCoordinatorIntegration,
  runAll: runAllExamples
};