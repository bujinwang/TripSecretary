/**
 * NotificationActionSettingsScreen - Screen for managing notification action button preferences
 * 
 * Features:
 * - Toggle action buttons on/off
 * - Set default action preferences
 * - Configure remind later duration
 * - View action usage statistics
 * - Reset action data
 * 
 * Requirements: 16.3, 16.5
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import NotificationActionService from '../services/notification/NotificationActionService';
import NotificationPreferencesService from '../services/notification/NotificationPreferencesService';
import { colors, spacing, typography } from '../theme';
import { useLocale } from '../i18n/LocaleContext';
import type {
  ActionPreferences,
  ActionAnalytics,
} from '../services/notification/NotificationActionService';

type ActionPreferenceKey = Extract<keyof ActionPreferences, string>;

const NotificationActionSettingsScreen: React.FC = () => {
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<ActionPreferences>(
    NotificationActionService.getDefaultPreferences()
  );
  const [analytics, setAnalytics] = useState<ActionAnalytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const [actionPrefs, analytics] = await Promise.all([
        NotificationActionService.getActionPreferences(),
        NotificationActionService.getActionAnalytics()
      ]);
      
      setPreferences(actionPrefs);
      setAnalytics(analytics);
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error loading notification action settings:', err);
      Alert.alert('Error', 'Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async <K extends ActionPreferenceKey>(
    key: K,
    value: ActionPreferences[K]
  ): Promise<void> => {
    try {
      await NotificationActionService.updateActionPreference(key, value);
      setPreferences(prev => ({ ...prev, [key]: value }));
      
      // Also update in NotificationPreferencesService for consistency
      if (key === 'showQuickActions') {
        await NotificationPreferencesService.updatePreference('actions.showQuickActions', value);
      } else if (key === 'remindLaterDuration') {
        await NotificationPreferencesService.updatePreference('actions.remindLaterDuration', value);
      } else if (key === 'defaultAction') {
        await NotificationPreferencesService.updatePreference('actions.defaultAction', value);
      }
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error updating preference:', err);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  const resetActionData = () => {
    Alert.alert(
      'Reset Action Data',
      'This will reset all action statistics and preferences to defaults. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotificationActionService.resetActionData();
              await loadSettings();
              Alert.alert('Success', 'Action data has been reset to defaults.');
            } catch (error) {
              const err = error instanceof Error ? error : new Error(String(error));
              console.error('Error resetting action data:', err);
              Alert.alert('Error', 'Failed to reset action data.');
            }
          }
        }
      ]
    );
  };

  const exportActionData = async (): Promise<void> => {
    try {
      const exportData = await NotificationActionService.exportActionData();
      
      if (exportData) {
        // In a real app, you would save this to a file or share it
        Alert.alert(
          'Export Complete',
          `Action data exported successfully. ${exportData.summary.totalActions} total actions recorded.`
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error exporting action data:', err);
      Alert.alert('Error', 'Failed to export action data.');
    }
  };

  const renderRemindLaterDurationPicker = () => {
    const durations: readonly number[] = [15, 30, 60, 120, 240]; // minutes
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notifications.settings.remindLaterDuration', { defaultValue: 'Remind Later Duration' })}</Text>
        <Text style={styles.sectionDescription}>
          How long to wait before showing reminder again
        </Text>
        
        <View style={styles.durationContainer}>
          {durations.map(duration => (
            <TouchableOpacity
              key={duration}
              style={[
                styles.durationButton,
                preferences.remindLaterDuration === duration && styles.durationButtonSelected
              ]}
              onPress={() => updatePreference('remindLaterDuration', duration)}
            >
              <Text style={[
                styles.durationButtonText,
                preferences.remindLaterDuration === duration && styles.durationButtonTextSelected
              ]}>
                {duration < 60 ? `${duration}m` : `${duration / 60}h`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderDefaultActionPicker = () => {
    const actions = [
      { id: 'view', label: 'View' },
      { id: 'submit', label: 'Submit' },
      { id: 'continue', label: 'Continue' },
      { id: 'later', label: 'Remind Later' }
    ];
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notifications.settings.defaultAction', { defaultValue: 'Default Action' })}</Text>
        <Text style={styles.sectionDescription}>
          Default action when tapping notification (no action button)
        </Text>
        
        <View style={styles.actionContainer}>
          {actions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                preferences.defaultAction === action.id && styles.actionButtonSelected
              ]}
              onPress={() => updatePreference('defaultAction', action.id)}
            >
              <Text style={[
                styles.actionButtonText,
                preferences.defaultAction === action.id && styles.actionButtonTextSelected
              ]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderAnalytics = () => {
    if (!showAnalytics || !analytics) {
      return null;
    }

    const { summary } = analytics;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage Statistics</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Actions:</Text>
          <Text style={styles.statValue}>{summary.totalActions}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Remind Later Used:</Text>
          <Text style={styles.statValue}>{summary.totalRemindLater}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Notification Types Ignored:</Text>
          <Text style={styles.statValue}>{summary.totalIgnoreTypes}</Text>
        </View>
        
        {Object.keys(summary.mostUsedActions).length > 0 && (
          <View style={styles.mostUsedContainer}>
            <Text style={styles.mostUsedTitle}>Most Used Actions:</Text>
            {Object.entries(summary.mostUsedActions).map(([type, action]) => (
              <View key={type} style={styles.mostUsedRow}>
                <Text style={styles.mostUsedType}>{type}:</Text>
                <Text style={styles.mostUsedAction}>
                  {action.actionId} ({action.count}x)
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('notificationActions.loading', { defaultValue: 'Loading settings...' })}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notifications.settings.quickActions', { defaultValue: 'Quick Actions' })}</Text>
        <Text style={styles.sectionDescription}>
          Show action buttons on notifications for quick access
        </Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('notifications.settings.enableActionButtons', { defaultValue: 'Enable Action Buttons' })}</Text>
          <Switch
            value={preferences.showQuickActions}
            onValueChange={(value) => updatePreference('showQuickActions', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={preferences.showQuickActions ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      {preferences.showQuickActions && (
        <>
          {renderDefaultActionPicker()}
          {renderRemindLaterDurationPicker()}
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('notifications.settings.learningFeedback', { defaultValue: 'Learning & Feedback' })}</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Learn from Usage</Text>
              <Switch
                value={preferences.learnFromUsage}
                onValueChange={(value) => updatePreference('learnFromUsage', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={preferences.learnFromUsage ? '#007AFF' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Show Action Feedback</Text>
              <Switch
                value={preferences.actionFeedback}
                onValueChange={(value) => updatePreference('actionFeedback', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={preferences.actionFeedback ? '#007AFF' : '#f4f3f4'}
              />
            </View>
          </View>
        </>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notifications.settings.dataAnalytics', { defaultValue: 'Data & Analytics' })}</Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowAnalytics(!showAnalytics)}
        >
          <Text style={styles.buttonText}>
            {showAnalytics ? t('notifications.settings.hideUsageStats', { defaultValue: 'Hide' }) : t('notifications.settings.showUsageStats', { defaultValue: 'Show' })} {t('notifications.settings.usageStatistics', { defaultValue: 'Usage Statistics' })}
          </Text>
        </TouchableOpacity>
        
        {renderAnalytics()}
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={exportActionData}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Export Action Data
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={resetActionData}
        >
          <Text style={[styles.buttonText, styles.dangerButtonText]}>
            Reset All Action Data
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  settingLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  durationButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  durationButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationButtonText: {
    ...typography.body,
    color: colors.text,
  },
  durationButtonTextSelected: {
    color: colors.white,
  },
  actionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  actionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonText: {
    ...typography.body,
    color: colors.text,
  },
  actionButtonTextSelected: {
    color: colors.white,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.sm,
    marginVertical: spacing.xs,
  },
  buttonText: {
    ...typography.bodyBold,
    color: colors.white,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  dangerButtonText: {
    color: colors.white,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  statLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.body,
    color: colors.text,
  },
  mostUsedContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mostUsedTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: 4,
  },
  mostUsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  mostUsedType: {
    ...typography.body,
    color: colors.textSecondary,
  },
  mostUsedAction: {
    ...typography.body,
    color: colors.text,
  },
});

export default NotificationActionSettingsScreen;
