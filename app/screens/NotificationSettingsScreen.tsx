import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocale } from '../i18n/LocaleContext';
import NotificationPreferencesService from '../services/notification/NotificationPreferencesService';
import NotificationService from '../services/notification/NotificationService';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

/**
 * NotificationSettingsScreen - Manage user notification preferences
 * 
 * Features:
 * - Toggle notification types on/off
 * - Configure timing preferences
 * - Set quiet hours
 * - Manage frequency settings
 * - Test notifications
 * 
 * Requirements: 16.1, 16.5
 */
export default function NotificationSettingsScreen({ navigation }) {
  const { t } = useLocale();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await NotificationPreferencesService.loadPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert(
        t('notificationSettings.error.loadTitle', { defaultValue: 'Error' }),
        t('notificationSettings.error.loadMessage', { defaultValue: 'Failed to load notification settings' })
      );
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (path, value) => {
    try {
      setSaving(true);
      
      // Update local state immediately for better UX
      const updatedPreferences = { ...preferences };
      NotificationPreferencesService.setNestedValue(updatedPreferences, path, value);
      setPreferences(updatedPreferences);
      
      // Save to storage
      const success = await NotificationPreferencesService.updatePreference(path, value);
      
      if (!success) {
        // Revert on failure
        await loadPreferences();
        Alert.alert(
          t('notificationSettings.error.saveTitle', { defaultValue: 'Error' }),
          t('notificationSettings.error.saveMessage', { defaultValue: 'Failed to save setting' })
        );
      }
    } catch (error) {
      console.error('Error updating preference:', error);
      await loadPreferences(); // Reload to ensure consistency
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      t('notificationSettings.reset.title', { defaultValue: 'Reset Settings' }),
      t('notificationSettings.reset.message', { defaultValue: 'This will reset all notification settings to default values. Continue?' }),
      [
        {
          text: t('common.cancel', { defaultValue: 'Cancel' }),
          style: 'cancel'
        },
        {
          text: t('common.reset', { defaultValue: 'Reset' }),
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const success = await NotificationPreferencesService.resetToDefaults();
              if (success) {
                await loadPreferences();
              } else {
                Alert.alert(
                  t('notificationSettings.error.resetTitle', { defaultValue: 'Error' }),
                  t('notificationSettings.error.resetMessage', { defaultValue: 'Failed to reset settings' })
                );
              }
            } catch (error) {
              console.error('Error resetting preferences:', error);
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleTestNotification = async () => {
    try {
      const enabled = await NotificationService.areNotificationsEnabled();
      if (!enabled) {
        Alert.alert(
          t('notificationSettings.test.permissionTitle', { defaultValue: 'Permission Required' }),
          t('notificationSettings.test.permissionMessage', { defaultValue: 'Please enable notifications in device settings first' })
        );
        return;
      }

      await NotificationService.scheduleNotification(
        t('notificationSettings.test.title', { defaultValue: 'Test Notification' }),
        t('notificationSettings.test.body', { defaultValue: 'This is a test notification from TripSecretary' }),
        2, // 2 seconds from now
        { type: 'test' }
      );

      Alert.alert(
        t('notificationSettings.test.scheduledTitle', { defaultValue: 'Test Scheduled' }),
        t('notificationSettings.test.scheduledMessage', { defaultValue: 'Test notification will appear in 2 seconds' })
      );
    } catch (error) {
      console.error('Error testing notification:', error);
      Alert.alert(
        t('notificationSettings.error.testTitle', { defaultValue: 'Error' }),
        t('notificationSettings.error.testMessage', { defaultValue: 'Failed to schedule test notification' })
      );
    }
  };

  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderToggleItem = (title, description, path, disabled = false) => {
    const value = NotificationPreferencesService.getNestedValue(preferences, path, false);
    
    return (
      <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, disabled && styles.settingTitleDisabled]}>
            {title}
          </Text>
          {description && (
            <Text style={[styles.settingDescription, disabled && styles.settingDescriptionDisabled]}>
              {description}
            </Text>
          )}
        </View>
        <Switch
          value={value}
          onValueChange={(newValue) => updatePreference(path, newValue)}
          disabled={disabled || saving}
          trackColor={{ false: colors.gray300, true: colors.primary }}
          thumbColor={value ? colors.white : colors.gray500}
        />
      </View>
    );
  };

  const renderTimeItem = (title, description, path) => {
    const value = NotificationPreferencesService.getNestedValue(preferences, path, '09:00');
    
    return (
      <TouchableOpacity
        style={styles.settingItem}
        onPress={() => {
          // TODO: Implement time picker modal
          Alert.alert(
            t('notificationSettings.timePicker.title', { defaultValue: 'Set Time' }),
            t('notificationSettings.timePicker.message', { defaultValue: 'Time picker will be implemented in a future update' })
          );
        }}
      >
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && (
            <Text style={styles.settingDescription}>{description}</Text>
          )}
        </View>
        <Text style={styles.settingValue}>{value}</Text>
      </TouchableOpacity>
    );
  };

  if (loading || !preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {t('notificationSettings.loading', { defaultValue: 'Loading settings...' })}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const globalEnabled = preferences.enabled;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Global Toggle */}
        {renderSectionHeader(t('notificationSettings.sections.general', { defaultValue: 'General' }))}
        
        {renderToggleItem(
          t('notificationSettings.general.enabled', { defaultValue: 'Enable Notifications' }),
          t('notificationSettings.general.enabledDescription', { defaultValue: 'Receive notifications for entry preparation reminders' }),
          'enabled'
        )}

        {/* Notification Types */}
        {renderSectionHeader(t('notificationSettings.sections.types', { defaultValue: 'Notification Types' }))}
        
        {renderToggleItem(
          t('notificationSettings.types.submissionWindow', { defaultValue: 'Submission Window' }),
          t('notificationSettings.types.submissionWindowDescription', { defaultValue: 'Notify when 72-hour submission window opens' }),
          'types.submissionWindow',
          !globalEnabled
        )}

        {renderToggleItem(
          t('notificationSettings.types.urgentReminder', { defaultValue: 'Urgent Reminders' }),
          t('notificationSettings.types.urgentReminderDescription', { defaultValue: 'Urgent reminders 24 hours before arrival' }),
          'types.urgentReminder',
          !globalEnabled
        )}

        {renderToggleItem(
          t('notificationSettings.types.deadline', { defaultValue: 'Deadline Alerts' }),
          t('notificationSettings.types.deadlineDescription', { defaultValue: 'Alerts on arrival day if not submitted' }),
          'types.deadline',
          !globalEnabled
        )}

        {renderToggleItem(
          t('notificationSettings.types.arrivalReminder', { defaultValue: 'Arrival Reminders' }),
          t('notificationSettings.types.arrivalReminderDescription', { defaultValue: 'Remind 1 day before arrival' }),
          'types.arrivalReminder',
          !globalEnabled
        )}

        {renderToggleItem(
          t('notificationSettings.types.arrivalDay', { defaultValue: 'Arrival Day' }),
          t('notificationSettings.types.arrivalDayDescription', { defaultValue: 'Good luck message on arrival day' }),
          'types.arrivalDay',
          !globalEnabled
        )}

        {renderToggleItem(
          t('notificationSettings.types.dataChange', { defaultValue: 'Data Changes' }),
          t('notificationSettings.types.dataChangeDescription', { defaultValue: 'Notify when data changes after submission' }),
          'types.dataChange',
          !globalEnabled
        )}

        {renderToggleItem(
          t('notificationSettings.types.expiry', { defaultValue: 'Expiry Warnings' }),
          t('notificationSettings.types.expiryDescription', { defaultValue: 'Warn when entry packs are about to expire' }),
          'types.expiry',
          !globalEnabled
        )}

        {renderToggleItem(
          t('notificationSettings.types.autoArchival', { defaultValue: 'Auto Archival' }),
          t('notificationSettings.types.autoArchivalDescription', { defaultValue: 'Notify when entry packs are automatically archived' }),
          'types.autoArchival',
          !globalEnabled
        )}

        {/* Timing Settings */}
        {renderSectionHeader(t('notificationSettings.sections.timing', { defaultValue: 'Timing' }))}
        
        {renderTimeItem(
          t('notificationSettings.timing.reminderTime', { defaultValue: 'Default Reminder Time' }),
          t('notificationSettings.timing.reminderTimeDescription', { defaultValue: 'Time of day for general reminders' }),
          'timing.reminderTime'
        )}

        {renderToggleItem(
          t('notificationSettings.timing.quietHours', { defaultValue: 'Quiet Hours' }),
          t('notificationSettings.timing.quietHoursDescription', { defaultValue: 'Disable notifications during quiet hours' }),
          'timing.quietHours.enabled',
          !globalEnabled
        )}

        {preferences.timing.quietHours.enabled && (
          <>
            {renderTimeItem(
              t('notificationSettings.timing.quietStart', { defaultValue: 'Quiet Hours Start' }),
              null,
              'timing.quietHours.start'
            )}
            {renderTimeItem(
              t('notificationSettings.timing.quietEnd', { defaultValue: 'Quiet Hours End' }),
              null,
              'timing.quietHours.end'
            )}
          </>
        )}

        {/* Frequency Settings */}
        {renderSectionHeader(t('notificationSettings.sections.frequency', { defaultValue: 'Frequency' }))}
        
        {renderToggleItem(
          t('notificationSettings.frequency.dailySummary', { defaultValue: 'Daily Summary' }),
          t('notificationSettings.frequency.dailySummaryDescription', { defaultValue: 'Receive one daily summary instead of individual notifications' }),
          'frequency.dailySummary',
          !globalEnabled
        )}

        {preferences.frequency.dailySummary && (
          renderTimeItem(
            t('notificationSettings.frequency.summaryTime', { defaultValue: 'Summary Time' }),
            t('notificationSettings.frequency.summaryTimeDescription', { defaultValue: 'Time for daily summary notification' }),
            'frequency.summaryTime'
          )
        )}

        {/* Action Settings */}
        {renderSectionHeader(t('notificationSettings.sections.actions', { defaultValue: 'Actions' }))}
        
        {renderToggleItem(
          t('notificationSettings.actions.quickActions', { defaultValue: 'Quick Actions' }),
          t('notificationSettings.actions.quickActionsDescription', { defaultValue: 'Show action buttons on notifications' }),
          'actions.showQuickActions',
          !globalEnabled
        )}

        {/* Test and Reset */}
        {renderSectionHeader(t('notificationSettings.sections.testing', { defaultValue: 'Testing & Reset' }))}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.testButton]}
          onPress={handleTestNotification}
          disabled={saving || !globalEnabled}
        >
          <Text style={styles.actionButtonText}>
            {t('notificationSettings.actions.test', { defaultValue: 'Test Notification' })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.resetButton]}
          onPress={handleResetToDefaults}
          disabled={saving}
        >
          <Text style={[styles.actionButtonText, styles.resetButtonText]}>
            {t('notificationSettings.actions.reset', { defaultValue: 'Reset to Defaults' })}
          </Text>
        </TouchableOpacity>

        {/* Status Info */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {t('notificationSettings.status.lastUpdated', { defaultValue: 'Last updated' })}: {' '}
            {new Date(preferences.updatedAt).toLocaleString()}
          </Text>
          <Text style={styles.statusText}>
            {t('notificationSettings.status.version', { defaultValue: 'Version' })}: {preferences.version}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  settingTitleDisabled: {
    color: colors.textSecondary,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  settingDescriptionDisabled: {
    color: colors.gray400,
  },
  settingValue: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  actionButton: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: colors.primary,
  },
  resetButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.error,
  },
  actionButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  resetButtonText: {
    color: colors.error,
  },
  statusContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
  },
  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});