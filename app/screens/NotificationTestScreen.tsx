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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing } from '../theme';
import NotificationService from '../services/notification/NotificationService';
import NotificationCoordinator from '../services/notification/NotificationCoordinator';
import WindowOpenNotificationService from '../services/notification/WindowOpenNotificationService';
import UrgentReminderNotificationService from '../services/notification/UrgentReminderNotificationService';
import DeadlineNotificationService from '../services/notification/DeadlineNotificationService';
import ExpiryWarningNotificationService from '../services/notification/ExpiryWarningNotificationService';
import type { NotificationStats } from '../services/notification/NotificationCoordinator';
import type { RootStackParamList } from '../types/navigation';
import { useTranslation } from '../i18n/LocaleContext';

type NotificationTestNavigation = NativeStackNavigationProp<RootStackParamList>;
type TestNotificationType = 'windowOpen' | 'urgentReminder' | 'deadline' | 'expiry' | 'simple';

const NotificationTestScreen: React.FC<{ navigation: NotificationTestNavigation }> = ({ navigation }) => {
  const { t } = useTranslation();
  const [scheduledNotifications, setScheduledNotifications] = useState<Notifications.NotificationRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationStats, setNotificationStats] = useState<NotificationStats | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeServices();
    loadScheduledNotifications();
  }, []);

  const initializeServices = async (): Promise<void> => {
    try {
      await NotificationCoordinator.initialize();
      setIsInitialized(true);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to initialize notification services:', err);
      Alert.alert('Error', 'Failed to initialize notification services');
    }
  };

  const loadScheduledNotifications = async (): Promise<void> => {
    try {
      const notifications = await NotificationService.getScheduledNotifications();
      setScheduledNotifications(notifications);
      
      const stats = await NotificationCoordinator.getStats();
      setNotificationStats(stats);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error loading scheduled notifications:', err);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadScheduledNotifications();
    setRefreshing(false);
  };

  const triggerTestNotification = async (type: TestNotificationType): Promise<void> => {
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

        case 'deadline': {
          const deadlineIds = await DeadlineNotificationService.scheduleDeadlineNotification(
            testData.userId,
            testData.entryPackId,
            testTime,
            testData.destination
          );
          notificationId = deadlineIds?.[0] ?? null;
          break;
        }

        case 'expiry': {
          const expiryIds = await ExpiryWarningNotificationService.scheduleExpiryWarningNotifications(
            testData.userId,
            testData.entryPackId,
            testTime,
            testData.destination
          );
          notificationId = expiryIds?.[0] ?? null;
          break;
        }

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
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`Error triggering ${type} notification:`, err);
      Alert.alert('Error', `Failed to schedule ${type} notification: ${err.message}`);
    }
  };

  const cancelAllNotifications = async (): Promise<void> => {
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
              const err = error instanceof Error ? error : new Error(String(error));
              console.error('Error cancelling notifications:', err);
              Alert.alert('Error', 'Failed to cancel notifications');
            }
          }
        }
      ]
    );
  };

  const cancelNotification = async (notificationId: string): Promise<void> => {
    try {
      await NotificationService.cancelNotification(notificationId);
      Alert.alert('Success', 'Notification cancelled');
      await loadScheduledNotifications();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error cancelling notification:', err);
      Alert.alert('Error', 'Failed to cancel notification');
    }
  };

  const viewNotificationLogs = (): void => {
    navigation.navigate('NotificationLog');
  };

  const renderNotificationButton = (
    title: string,
    type: TestNotificationType,
    description: string
  ) => (
    <TouchableOpacity
      key={type}
      style={styles.testButton}
      onPress={() => triggerTestNotification(type)}
    >
      <Text style={styles.testButtonTitle}>{title}</Text>
      <Text style={styles.testButtonDescription}>{description}</Text>
    </TouchableOpacity>
  );

  const getStatTotal = (stat: unknown, fallbackKey: string = 'total'): number => {
    if (!stat || typeof stat !== 'object') {
      return 0;
    }

    const record = stat as Record<string, unknown>;
    const primary = record[fallbackKey];
    if (typeof primary === 'number') {
      return primary;
    }

    const scheduled = record.totalScheduled;
    if (typeof scheduled === 'number') {
      return scheduled;
    }

    return 0;
  };

  const formatTrigger = (trigger: Notifications.NotificationTrigger | null): string => {
    if (!trigger) {
      return 'Immediate';
    }

    if ('type' in trigger) {
      switch (trigger.type) {
        case SchedulableTriggerInputTypes.DATE:
          if ('date' in trigger && trigger.date) {
            return new Date(trigger.date).toLocaleString();
          }
          return 'Date trigger';
        case SchedulableTriggerInputTypes.TIME_INTERVAL:
          if ('seconds' in trigger && typeof trigger.seconds === 'number') {
            return `${trigger.seconds}s`;
          }
          return 'Interval trigger';
        case SchedulableTriggerInputTypes.DAILY:
          return 'Daily trigger';
        case SchedulableTriggerInputTypes.WEEKLY:
          return 'Weekly trigger';
        default:
          break;
      }
    }

    return 'Unknown';
  };

  const renderScheduledNotification = (notification: Notifications.NotificationRequest, index: number) => {
    const contentData = notification.content?.data as Record<string, unknown> | undefined;
    const notificationType = typeof contentData?.type === 'string' ? contentData.type : undefined;

    return (
      <View key={notification.identifier ?? index.toString()} style={styles.notificationItem}>
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
          Trigger: {formatTrigger(notification.trigger)}
        </Text>
        {notificationType && (
          <Text style={styles.notificationType}>
            Type: {notificationType}
          </Text>
        )}
      </View>
    );
  };

  const renderStatsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('notifications.stats.title')}</Text>
      <View style={styles.statsContainer}>
        <Text style={styles.statItem}>
          Window Open: {getStatTotal(notificationStats?.windowOpen)} scheduled
        </Text>
        <Text style={styles.statItem}>
          Urgent Reminder: {getStatTotal(notificationStats?.urgentReminder)} scheduled
        </Text>
        <Text style={styles.statItem}>
          Deadline: {getStatTotal(notificationStats?.deadline)} scheduled
        </Text>
        <Text style={styles.statItem}>
          Initialized: {isInitialized ? t('common.confirm') : t('common.buttons.cancel')}
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
          <Text style={styles.title}>{t('notifications.testingTools.title')}</Text>
          <Text style={styles.subtitle}>{t('notifications.testingTools.developmentOnly')}</Text>
        </View>

        {/* Test Notification Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications.sections.test')}</Text>
          
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
          <Text style={styles.sectionTitle}>{t('notifications.sections.actions')}</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={viewNotificationLogs}
          >
            <Text style={styles.actionButtonText}>{t('notifications.actions.viewLogs')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={cancelAllNotifications}
          >
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              {t('notifications.actions.cancelAll')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scheduled Notifications List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('notifications.sections.scheduled', { count: scheduledNotifications.length })}
          </Text>
          
          {scheduledNotifications.length === 0 ? (
            <Text style={styles.emptyText}>{t('notifications.stats.empty')}</Text>
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
