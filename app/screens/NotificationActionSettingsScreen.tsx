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
import { getTranslation } from '../i18n/locales';

const NotificationActionSettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const [actionPrefs, analytics] = await Promise.all([
        NotificationActionService.getActionPreferences(),
        NotificationActionService.getActionAnalytics()
      ]);
      
      setPreferences(actionPrefs);
      setAnalytics(analytics);
      
    } catch (error) {
      console.error('Error loading notification action settings:', error);
      Alert.alert('Error', 'Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key, value) => {
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
      console.error('Error updating preference:', error);
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
              console.error('Error resetting action data:', error);
              Alert.alert('Error', 'Failed to reset action data.');
            }
          }
        }
      ]
    );
  };

  const exportActionData = async () => {
    try {
      const exportData = await NotificationActionService.exportActionData();
      
      if (exportData) {
        // In a real app, you would save this to a file or share it
        Alert.alert(
          'Export Complete',
          `Action data exported successfully. ${analytics.summary.totalActions} total actions recorded.`
        );
      }
    } catch (error) {
      console.error('Error exporting action data:', error);
      Alert.alert('Error', 'Failed to export action data.');
    }
  };

  const renderRemindLaterDurationPicker = () => {
    const durations = [15, 30, 60, 120, 240]; // minutes
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Remind Later Duration</Text>
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
        <Text style={styles.sectionTitle}>Default Action</Text>
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

    const { summary, stats } = analytics;
    
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
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Text style={styles.sectionDescription}>
          Show action buttons on notifications for quick access
        </Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Enable Action Buttons</Text>
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
            <Text style={styles.sectionTitle}>Learning & Feedback</Text>
            
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
        <Text style={styles.sectionTitle}>Data & Analytics</Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowAnalytics(!showAnalytics)}
        >
          <Text style={styles.buttonText}>
            {showAnalytics ? 'Hide' : 'Show'} Usage Statistics
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  durationButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  durationButtonText: {
    fontSize: 14,
    color: '#333',
  },
  durationButtonTextSelected: {
    color: '#fff',
  },
  actionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  actionButtonTextSelected: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#333',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  dangerButtonText: {
    color: '#fff',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  mostUsedContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  mostUsedTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  mostUsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  mostUsedType: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  mostUsedAction: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
});

export default NotificationActionSettingsScreen;