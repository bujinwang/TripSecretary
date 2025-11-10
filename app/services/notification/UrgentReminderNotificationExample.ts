// @ts-nocheck

/**
 * UrgentReminderNotificationExample - Examples of using UrgentReminderNotificationService
 * 
 * This file demonstrates how to use the urgent reminder notification service
 * for scheduling notifications 24 hours before arrival if TDAC not submitted.
 * 
 * Requirements: 16.2, 16.3
 */

import UrgentReminderNotificationService from './UrgentReminderNotificationService';
import NotificationCoordinator from './NotificationCoordinator';

/**
 * Example 1: Schedule urgent reminder for new entry pack
 */
export async function scheduleUrgentReminderExample() {
  try {
    console.log('=== Scheduling Urgent Reminder Example ===');
    
    const userId = 'user123';
    const entryPackId = 'pack456';
    const arrivalDate = new Date('2024-12-15T10:00:00Z'); // User's arrival date
    const destination = 'Thailand';

    console.log('Scheduling urgent reminder for:', {
      userId,
      entryPackId,
      arrivalDate: arrivalDate.toISOString(),
      destination
    });

    const notificationId = await UrgentReminderNotificationService.scheduleUrgentReminder(
      userId,
      entryPackId,
      arrivalDate,
      destination
    );

    if (notificationId) {
      console.log('✅ Urgent reminder scheduled successfully:', notificationId);
      
      // The notification will be sent 24 hours before arrival (2024-12-14T10:00:00Z)
      // with high priority (sound + vibration)
      // and will navigate to ThailandTravelInfoScreen when clicked
    } else {
      console.log('❌ Urgent reminder not scheduled (may be too late or already exists)');
    }

    return notificationId;

  } catch (error) {
    console.error('Failed to schedule urgent reminder:', error);
    throw error;
  }
}

/**
 * Example 2: Handle arrival date change
 */
export async function handleArrivalDateChangeExample() {
  try {
    console.log('=== Handling Arrival Date Change Example ===');
    
    const userId = 'user123';
    const entryPackId = 'pack456';
    const oldArrivalDate = new Date('2024-12-01T10:00:00Z');
    const newArrivalDate = new Date('2024-12-15T10:00:00Z'); // Changed to December 15th
    const destination = 'Thailand';

    console.log('Handling arrival date change:', {
      userId,
      entryPackId,
      oldDate: oldArrivalDate.toISOString(),
      newDate: newArrivalDate.toISOString(),
      destination
    });

    // This will cancel the old notification and schedule a new one
    const newNotificationId = await UrgentReminderNotificationService.handleArrivalDateChange(
      userId,
      entryPackId,
      newArrivalDate,
      oldArrivalDate,
      destination
    );

    if (newNotificationId) {
      console.log('✅ Urgent reminder rescheduled successfully:', newNotificationId);
    } else {
      console.log('❌ Urgent reminder not rescheduled');
    }

    return newNotificationId;

  } catch (error) {
    console.error('Failed to handle arrival date change:', error);
    throw error;
  }
}

/**
 * Example 3: Auto-cancel when TDAC submitted
 */
export async function autoCancelWhenSubmittedExample() {
  try {
    console.log('=== Auto-Cancel When TDAC Submitted Example ===');
    
    const entryPackId = 'pack456';
    const tdacSubmission = {
      arrCardNo: 'TDAC123456789',
      qrUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
      pdfPath: '/path/to/tdac.pdf',
      submittedAt: new Date().toISOString(),
      submissionMethod: 'api'
    };

    console.log('Auto-cancelling urgent reminder due to TDAC submission:', {
      entryPackId,
      arrCardNo: tdacSubmission.arrCardNo
    });

    const cancelled = await UrgentReminderNotificationService.autoCancelIfSubmitted(
      entryPackId,
      tdacSubmission
    );

    if (cancelled) {
      console.log('✅ Urgent reminder cancelled successfully');
    } else {
      console.log('❌ No urgent reminder to cancel or cancellation failed');
    }

    return cancelled;

  } catch (error) {
    console.error('Failed to auto-cancel urgent reminder:', error);
    throw error;
  }
}

/**
 * Example 4: Check notification status
 */
export async function checkNotificationStatusExample() {
  try {
    console.log('=== Check Notification Status Example ===');
    
    const entryPackId = 'pack456';

    // Check if urgent reminder is scheduled
    const isScheduled = await UrgentReminderNotificationService.isReminderScheduled(entryPackId);
    console.log('Is urgent reminder scheduled:', isScheduled);

    // Get detailed notification info
    const notification = await UrgentReminderNotificationService.getScheduledUrgentReminder(entryPackId);
    if (notification) {
      console.log('Urgent reminder details:', {
        notificationId: notification.notificationId,
        reminderTime: notification.reminderTime,
        status: notification.status,
        destination: notification.destination
      });
    } else {
      console.log('No urgent reminder found for entry pack');
    }

    return { isScheduled, notification };

  } catch (error) {
    console.error('Failed to check notification status:', error);
    throw error;
  }
}

/**
 * Example 5: Get service statistics
 */
export async function getServiceStatsExample() {
  try {
    console.log('=== Get Service Statistics Example ===');
    
    const stats = await UrgentReminderNotificationService.getStats();
    
    console.log('Urgent reminder service statistics:', {
      totalNotifications: stats.total,
      scheduledNotifications: stats.scheduled,
      cancelledNotifications: stats.cancelled,
      expiredNotifications: stats.expired
    });

    return stats;

  } catch (error) {
    console.error('Failed to get service stats:', error);
    throw error;
  }
}

/**
 * Example 6: Cleanup expired notifications
 */
export async function cleanupExpiredExample() {
  try {
    console.log('=== Cleanup Expired Notifications Example ===');
    
    const cleanedCount = await UrgentReminderNotificationService.cleanupExpiredNotifications();
    
    console.log(`✅ Cleaned up ${cleanedCount} expired urgent reminder notifications`);

    return cleanedCount;

  } catch (error) {
    console.error('Failed to cleanup expired notifications:', error);
    throw error;
  }
}

/**
 * Example 7: Using NotificationCoordinator (recommended approach)
 */
export async function useNotificationCoordinatorExample() {
  try {
    console.log('=== Using NotificationCoordinator Example ===');
    
    const userId = 'user123';
    const entryPackId = 'pack456';
    const arrivalDate = new Date('2024-12-15T10:00:00Z');
    const destination = 'Thailand';

    // Initialize coordinator
    await NotificationCoordinator.initialize();

    // Schedule urgent reminder through coordinator
    const notificationId = await NotificationCoordinator.scheduleUrgentReminderNotification(
      userId,
      entryPackId,
      arrivalDate,
      destination
    );

    console.log('Urgent reminder scheduled via coordinator:', notificationId);

    // Get comprehensive notification status
    const status = await NotificationCoordinator.getNotificationStatus(entryPackId);
    console.log('Complete notification status:', {
      windowOpen: status.windowOpen,
      urgentReminder: status.urgentReminder
    });

    // Get comprehensive stats
    const stats = await NotificationCoordinator.getStats();
    console.log('All notification service stats:', {
      windowOpen: stats.windowOpen,
      urgentReminder: stats.urgentReminder
    });

    return { notificationId, status, stats };

  } catch (error) {
    console.error('Failed to use notification coordinator:', error);
    throw error;
  }
}

/**
 * Example 8: Complete workflow simulation
 */
export async function completeWorkflowExample() {
  try {
    console.log('=== Complete Urgent Reminder Workflow Example ===');
    
    const userId = 'user123';
    const entryPackId = 'pack456';
    let arrivalDate = new Date('2024-12-15T10:00:00Z');
    const destination = 'Thailand';

    // Step 1: User sets arrival date - schedule urgent reminder
    console.log('Step 1: Scheduling urgent reminder...');
    let notificationId = await UrgentReminderNotificationService.scheduleUrgentReminder(
      userId,
      entryPackId,
      arrivalDate,
      destination
    );
    console.log('Urgent reminder scheduled:', notificationId);

    // Step 2: User changes arrival date - reschedule
    console.log('Step 2: User changes arrival date...');
    const newArrivalDate = new Date('2024-12-20T10:00:00Z');
    notificationId = await UrgentReminderNotificationService.handleArrivalDateChange(
      userId,
      entryPackId,
      newArrivalDate,
      arrivalDate,
      destination
    );
    console.log('Urgent reminder rescheduled:', notificationId);
    arrivalDate = newArrivalDate;

    // Step 3: Check status before submission
    console.log('Step 3: Checking notification status...');
    const isScheduled = await UrgentReminderNotificationService.isReminderScheduled(entryPackId);
    console.log('Is urgent reminder scheduled:', isScheduled);

    // Step 4: User submits TDAC - auto-cancel urgent reminder
    console.log('Step 4: User submits TDAC...');
    const tdacSubmission = {
      arrCardNo: 'TDAC123456789',
      submittedAt: new Date().toISOString()
    };
    const cancelled = await UrgentReminderNotificationService.autoCancelIfSubmitted(
      entryPackId,
      tdacSubmission
    );
    console.log('Urgent reminder auto-cancelled:', cancelled);

    // Step 5: Verify cancellation
    console.log('Step 5: Verifying cancellation...');
    const finalStatus = await UrgentReminderNotificationService.isReminderScheduled(entryPackId);
    console.log('Final urgent reminder status (should be false):', finalStatus);

    console.log('✅ Complete workflow executed successfully');

    return {
      initialNotificationId: notificationId,
      rescheduledNotificationId: notificationId,
      wasCancelled: cancelled,
      finalStatus
    };

  } catch (error) {
    console.error('Failed to execute complete workflow:', error);
    throw error;
  }
}

// Export all examples for easy testing
export default {
  scheduleUrgentReminderExample,
  handleArrivalDateChangeExample,
  autoCancelWhenSubmittedExample,
  checkNotificationStatusExample,
  getServiceStatsExample,
  cleanupExpiredExample,
  useNotificationCoordinatorExample,
  completeWorkflowExample
};