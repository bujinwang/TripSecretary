/**
 * NotificationTestScreen - Development mode notification testing tools
 * 
 * Features:
 * - Manual triggering of various notification types
 * - Display scheduled notification list
 * - Cancel all notifications option
 * - View notification logs
 * 
 * Requirements: 16.1-16.5
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme';
import NotificationService from '../services/notification/NotificationService';
import NotificationCoordinator from '../services/notification/NotificationCoordinator';
import WindowOpenNotificationService from '../services/notification/WindowOpenNotificationService';
import UrgentReminderNotificationService from '../services/notification/UrgentReminderNotificationService';
import DeadlineNotificationService from '../services/notification/DeadlineNotificationService';
import ExpiryWarningNotificationService from '../services/notification/ExpiryWarningNotificationService';

const NotificationTestScreen = ({ navigation }) => {
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationStats, setNotificationStats] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeServices();
    loadScheduledNotifications();
  }, []);

  const initializeServices = async () => {
    try {
      await NotificationCoordinator.initialize();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize notification services:', error);
      Alert.alert('Error', 'Failed to initialize notification services');
    }
  };

  const loadScheduledNotifications = async () => {
    try {
      const notifications = await NotificationService.getScheduledNotifications();
      setScheduledNotifications(notifications);
      
      const stats = await NotificationCoordinator.getStats();
      setNotificationStats(stats);
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScheduledNotifications();
    setRefreshing(false);
  };

  const triggerTestNotification = async (type) => {
    try {
      const testData = {
        userId: 'test_user',
        entryPackId: 'test_entry_pack_123',
        destination: 'Thailand',
      };

      let notificationId;
      const now = new Date();
      const testTime = new Date(now.getTime() + 5000); // 5 seconds from now

      switch (type) {
        case 'windowOpen':
          notificationId = await WindowOpenNotificationService.scheduleWindowOpenNotification(
            testData.userId,
            testData.entryPackId,
            testTime,
            testData.destination
          );
          break;

        case 'urgentReminder':
          notificationId = await UrgentReminderNotificationService.scheduleUrgentReminder(
            testData.userId,
            testData.entryPackId,
            testTime,
            testData.destination
          );
          break;

        case 'deadline':
          const deadlineIds = await DeadlineNotificationService.scheduleDeadlineNotification(
            testData.userId,
            testData.entryPackId,
            testTime,
            testData.destination
          );
          notificationId = deadlineIds?.[0];
          break;

        case 'expiry':
          const expiryIds = await ExpiryWarningNotificationService.scheduleExpiryWarningNotifications(
            testData.userId,
            testData.entryPackId,
            testTime,
            testData.destination
          );
          notificationId = expiryIds?.[0];
          break;

        case 'simple':
          notificationId = await NotificationService.scheduleNotification(
            'Test Notification',
            'This is a test notification from the development tools',
            testTime,
            { type: 'test', ...testData },
            {
              actions: [
                { id: 'view', title: 'View' },
                { id: 'dismiss', title: 'Dismiss' }
              ]
            }
          );
          break;

        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      if (notificationId) {
        Alert.alert(
          'Success',
          `${type} notification scheduled successfully!\nID: ${notificationId}\nWill appear in 5 seconds.`
        );
        await loadScheduledNotifications();
      } else {
        Alert.alert('Info', 'Notification was not scheduled (may be disabled in preferences)');
      }
    } catch (error) {
      console.error(`Error triggering ${type} notification:`, error);
      Alert.alert('Error', `Failed to schedule ${type} notification: ${error.message}`);
    }
  };

  const cancelAllNotifications = async () => {
    Alert.alert(
      'Cancel All Notifications',
      'Are you sure you want to cancel all scheduled notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Cancel All',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotificationService.cancelAllNotifications();
              Alert.alert('Success', 'All notifications cancelled');
              await loadScheduledNotifications();
            } catch (error) {
              console.error('Error cancelling notifications:', error);
              Alert.alert('Error', 'Failed to cancel notifications');
            }
          }
        }
      ]
    );
  };

  const cancelNotification = async (notificationId) => {
    try {
      await NotificationService.cancelNotification(notificationId);
      Alert.alert('Success', 'Notification cancelled');
      await loadScheduledNotifications();
    } catch (error) {
      console.error('Error cancelling notification:', error);
      Alert.alert('Error', 'Failed to cancel notification');
    }
  };

  const viewNotificationLogs = () => {
    navigation.navigate('NotificationLog');
  };

  const renderNotificationButton = (title, type, description) => (
    <TouchableOpacity
      key={type}
      style={styles.testButton}
      onPress={() => triggerTestNotification(type)}
    >
      <Text style={styles.testButtonTitle}>{title}</Text>
      <Text style={styles.testButtonDescription}>{description}</Text>
    </TouchableOpacity>
  );

  const renderScheduledNotification = (notification, index) => (
    <View key={index} style={styles.notificationItem}>
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle}>
          {notification.content?.title || 'No Title'}
        </Text>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => cancelNotification(notification.identifier)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.notificationBody}>
        {notification.content?.body || 'No Body'}
      </Text>
      <Text style={styles.notificationId}>ID: {notification.identifier}</Text>
      <Text style={styles.notificationTrigger}>
        Trigger: {new Date(notification.trigger?.date || Date.now()).toLocaleString()}
      </Text>
      {notification.content?.data?.type && (
        <Text style={styles.notificationType}>
          Type: {notification.content.data.type}
        </Text>
      )}
    </View>
  );

  const renderStatsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notification Statistics</Text>
      <View style={styles.statsContainer}>
        <Text style={styles.statItem}>
          Window Open: {notificationStats.windowOpen?.total || 0} scheduled
        </Text>
        <Text style={styles.statItem}>
          Urgent Reminder: {notificationStats.urgentReminder?.total || 0} scheduled
        </Text>
        <Text style={styles.statItem}>
          Deadline: {notificationStats.deadline?.total || 0} scheduled
        </Text>
        <Text style={styles.statItem}>
          Initialized: {isInitialized ? 'Yes' : 'No'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Notification Testing Tools</Text>
          <Text style={styles.subtitle}>Development Mode Only</Text>
        </View>

        {/* Test Notification Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>
          
          {renderNotificationButton(
            'Window Open Notification',
            'windowOpen',
            'Tests submission window opening notification'
          )}
          
          {renderNotificationButton(
            'Urgent Reminder',
            'urgentReminder',
            'Tests urgent reminder notification'
          )}
          
          {renderNotificationButton(
            'Deadline Warning',
            'deadline',
            'Tests deadline warning notification'
          )}
          
          {renderNotificationButton(
            'Expiry Warning',
            'expiry',
            'Tests entry pack expiry warning'
          )}
          
          {renderNotificationButton(
            'Simple Test',
            'simple',
            'Tests basic notification with actions'
          )}
        </View>

        {/* Statistics */}
        {renderStatsSection()}

        {/* Control Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={viewNotificationLogs}
          >
            <Text style={styles.actionButtonText}>View Notification Logs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={cancelAllNotifications}
          >
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              Cancel All Notifications
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scheduled Notifications List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Scheduled Notifications ({scheduledNotifications.length})
          </Text>
          
          {scheduledNotifications.length === 0 ? (
            <Text style={styles.emptyText}>No scheduled notifications</Text>
          ) : (
            scheduledNotifications.map(renderScheduledNotification)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  testButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  testButtonTitle: {
    ...typography.bodyBold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  testButtonDescription: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.9,
  },
  actionButton: {
    backgroundColor: colors.secondary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  actionButtonText: {
    ...typography.bodyBold,
    color: colors.white,
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  dangerButtonText: {
    color: colors.white,
  },
  statsContainer: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: 8,
  },
  statItem: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  notificationItem: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  notificationTitle: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  cancelButtonText: {
    ...typography.caption,
    color: colors.white,
  },
  notificationBody: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  notificationId: {
    ...typography.caption,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  notificationTrigger: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  notificationType: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: spacing.lg,
  },
});

export default NotificationTestScreen;