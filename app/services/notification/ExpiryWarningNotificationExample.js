/**
 * ExpiryWarningNotificationExample - Demonstrates expiry warning notification functionality
 * 
 * This example shows how to:
 * - Schedule expiry warning notifications for entry packs
 * - Handle archive actions from notifications
 * - Cancel notifications when entry pack status changes
 * 
 * Requirements: 12.7, 16.5
 */

import ExpiryWarningNotificationService from './ExpiryWarningNotificationService';
import NotificationCoordinator from './NotificationCoordinator';

/**
 * Example: Schedule expiry warning notifications for a new entry pack
 */
export async function scheduleExpiryWarningExample() {
  try {
    console.log('=== Expiry Warning Notification Example ===');
    
    // Example entry pack data
    const userId = 'user_001';
    const entryPackId = 'thailand_entry_pack_001';
    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + 3); // Arriving in 3 days
    const destination = 'Thailand';
    
    console.log('Scheduling expiry warning notifications for:');
    console.log('- User ID:', userId);
    console.log('- Entry Pack ID:', entryPackId);
    console.log('- Arrival Date:', arrivalDate.toISOString());
    console.log('- Destination:', destination);
    
    // Schedule expiry warning notifications
    const notificationIds = await ExpiryWarningNotificationService.scheduleExpiryWarningNotifications(
      userId,
      entryPackId,
      arrivalDate,
      destination
    );
    
    console.log('✅ Scheduled notifications:', notificationIds);
    
    // Calculate when notifications will be sent
    const times = ExpiryWarningNotificationService.calculateExpiryNotificationTimes(arrivalDate);
    console.log('📅 Pre-expiry warning will be sent at:', times.preExpiry.toISOString());
    console.log('📅 Expiry notification will be sent at:', times.expiry.toISOString());
    
    return notificationIds;
    
  } catch (error) {
    console.error('❌ Error scheduling expiry warning notifications:', error);
    throw error;
  }
}

/**
 * Example: Handle archive action from expiry notification
 */
export async function handleArchiveActionExample() {
  try {
    console.log('=== Archive Action Example ===');
    
    const entryPackId = 'thailand_entry_pack_001';
    const userId = 'user_001';
    
    console.log('Handling archive action for:');
    console.log('- Entry Pack ID:', entryPackId);
    console.log('- User ID:', userId);
    
    // Handle archive action (this would be called when user taps "Archive" in notification)
    const success = await ExpiryWarningNotificationService.handleArchiveAction(entryPackId, userId);
    
    if (success) {
      console.log('✅ Entry pack archived successfully');
      console.log('📱 User will be navigated to history screen');
    } else {
      console.log('❌ Archive action failed');
    }
    
    return success;
    
  } catch (error) {
    console.error('❌ Error handling archive action:', error);
    throw error;
  }
}

/**
 * Example: Cancel expiry warning notifications when entry pack status changes
 */
export async function cancelExpiryWarningExample() {
  try {
    console.log('=== Cancel Expiry Warning Example ===');
    
    const entryPackId = 'thailand_entry_pack_001';
    const newStatus = 'completed';
    
    console.log('Cancelling expiry warnings for:');
    console.log('- Entry Pack ID:', entryPackId);
    console.log('- New Status:', newStatus);
    
    // Auto-cancel notifications when status changes
    const cancelled = await ExpiryWarningNotificationService.autoCancelIfStatusChanged(entryPackId, newStatus);
    
    if (cancelled) {
      console.log('✅ Expiry warning notifications cancelled');
    } else {
      console.log('ℹ️ No notifications to cancel or status does not require cancellation');
    }
    
    return cancelled;
    
  } catch (error) {
    console.error('❌ Error cancelling expiry warning notifications:', error);
    throw error;
  }
}

/**
 * Example: Check expiry warning notification statistics
 */
export async function getExpiryWarningStatsExample() {
  try {
    console.log('=== Expiry Warning Statistics Example ===');
    
    // Get comprehensive statistics
    const stats = await ExpiryWarningNotificationService.getStats();
    
    console.log('📊 Expiry Warning Notification Statistics:');
    console.log('- Total notifications:', stats.total);
    console.log('- Scheduled:', stats.scheduled);
    console.log('- Cancelled:', stats.cancelled);
    console.log('- Expired:', stats.expired);
    console.log('- Total notification IDs:', stats.totalNotificationIds);
    
    return stats;
    
  } catch (error) {
    console.error('❌ Error getting expiry warning statistics:', error);
    throw error;
  }
}

/**
 * Example: Complete workflow demonstration
 */
export async function completeExpiryWarningWorkflowExample() {
  try {
    console.log('=== Complete Expiry Warning Workflow Example ===');
    
    // Step 1: Schedule notifications for new entry pack
    console.log('\n1️⃣ Scheduling expiry warning notifications...');
    const notificationIds = await scheduleExpiryWarningExample();
    
    // Step 2: Show statistics
    console.log('\n2️⃣ Checking notification statistics...');
    await getExpiryWarningStatsExample();
    
    // Step 3: Simulate user completing the trip (status change)
    console.log('\n3️⃣ Simulating entry pack completion...');
    await cancelExpiryWarningExample();
    
    // Step 4: Show updated statistics
    console.log('\n4️⃣ Checking updated statistics...');
    await getExpiryWarningStatsExample();
    
    console.log('\n✅ Complete workflow demonstration finished');
    
  } catch (error) {
    console.error('❌ Error in complete workflow demonstration:', error);
    throw error;
  }
}

/**
 * Example: Integration with NotificationCoordinator
 */
export async function notificationCoordinatorIntegrationExample() {
  try {
    console.log('=== NotificationCoordinator Integration Example ===');
    
    const userId = 'user_001';
    const entryPackId = 'thailand_entry_pack_002';
    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + 5); // Arriving in 5 days
    const destination = 'Thailand';
    
    console.log('Using NotificationCoordinator to schedule expiry warnings...');
    
    // Schedule through coordinator (this is how it's done in real app)
    const notificationIds = await NotificationCoordinator.scheduleExpiryWarningNotifications(
      userId,
      entryPackId,
      arrivalDate,
      destination
    );
    
    console.log('✅ Scheduled through coordinator:', notificationIds);
    
    // Cancel through coordinator
    console.log('Cancelling through coordinator...');
    const cancelled = await NotificationCoordinator.cancelExpiryWarningNotifications(entryPackId);
    
    console.log('✅ Cancelled through coordinator:', cancelled);
    
  } catch (error) {
    console.error('❌ Error in coordinator integration example:', error);
    throw error;
  }
}

// Export all examples for easy testing
export default {
  scheduleExpiryWarningExample,
  handleArchiveActionExample,
  cancelExpiryWarningExample,
  getExpiryWarningStatsExample,
  completeExpiryWarningWorkflowExample,
  notificationCoordinatorIntegrationExample
};