/**
 * NotificationActionService - Manages notification action buttons and user interactions
 * 
 * Features:
 * - Handle action button clicks and user preferences
 * - Track action usage patterns for learning
 * - Manage "Remind Later" functionality
 * - Handle ignore actions and suggestion system
 * - Provide action analytics and insights
 * 
 * Requirements: 16.3, 16.5
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import NotificationPreferencesService from './NotificationPreferencesService';
import NotificationService from './NotificationService';

// Type definitions
interface ActionPreferences {
  version?: number;
  showQuickActions?: boolean;
  defaultAction?: string;
  remindLaterDuration?: number;
  maxIgnoreBeforeSuggestion?: number;
  learnFromUsage?: boolean;
  actionFeedback?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ActionStats {
  [notificationType: string]: {
    [actionId: string]: {
      count: number;
      firstUsed: string;
      lastUsed: string | null;
      contexts: Array<{
        timestamp: string;
        [key: string]: any;
      }>;
    };
  };
}

interface RemindLaterAction {
  originalNotificationId?: string;
  newNotificationId: string;
  reminderTime: string;
  notificationType?: string;
  entryPackId?: string;
  createdAt: string;
  actionTaken?: {
    timestamp: string;
    [key: string]: any;
  };
}

interface IgnoreAction {
  timestamp: string;
  context?: Record<string, any>;
}

interface IgnoreActions {
  [notificationType: string]: IgnoreAction[];
}

interface ActionContext {
  notificationId?: string;
  entryPackId?: string;
  deepLink?: string;
  [key: string]: any;
}

interface ActionAnalytics {
  stats: ActionStats;
  remindLater: RemindLaterAction[];
  ignore: IgnoreActions;
  preferences: ActionPreferences;
  summary: {
    totalActions: number;
    mostUsedActions: Record<string, { actionId: string | null; count: number }>;
    totalRemindLater: number;
    totalIgnoreTypes: number;
  };
}

interface ExportedActionData extends ActionAnalytics {
  exportedAt: string;
  version: number;
}

interface StorageKeys {
  actionStats: string;
  remindLaterActions: string;
  ignoreActions: string;
  actionFeedback: string;
  userPreferences: string;
}

class NotificationActionService {
  private storageKeys: StorageKeys;

  constructor() {
    this.storageKeys = {
      actionStats: 'notificationActionStats',
      remindLaterActions: 'remindLaterActions',
      ignoreActions: 'notificationIgnoreActions',
      actionFeedback: 'pendingActionFeedback',
      userPreferences: 'notificationActionPreferences'
    };
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    try {
      // Ensure default action preferences exist
      await this.ensureDefaultActionPreferences();
      console.log('NotificationActionService initialized');
    } catch (error) {
      console.error('Error initializing NotificationActionService:', error);
    }
  }

  /**
   * Ensure default action preferences are set
   */
  private async ensureDefaultActionPreferences(): Promise<void> {
    try {
      const preferences = await this.getActionPreferences();
      
      if (!preferences.version) {
        // Set default preferences
        const defaultPreferences: ActionPreferences = {
          version: 1,
          showQuickActions: true,
          defaultAction: 'view',
          remindLaterDuration: 60, // minutes
          maxIgnoreBeforeSuggestion: 3,
          learnFromUsage: true,
          actionFeedback: true,
          createdAt: new Date().toISOString()
        };
        
        await this.saveActionPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Error ensuring default action preferences:', error);
    }
  }

  /**
   * Get action preferences
   * @returns Action preferences object
   */
  async getActionPreferences(): Promise<ActionPreferences> {
    try {
      const preferencesData = await AsyncStorage.getItem(this.storageKeys.userPreferences);
      return preferencesData ? JSON.parse(preferencesData) : {};
    } catch (error) {
      console.error('Error getting action preferences:', error);
      return {};
    }
  }

  /**
   * Save action preferences
   * @param preferences - Preferences to save
   */
  async saveActionPreferences(preferences: ActionPreferences): Promise<void> {
    try {
      preferences.updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(this.storageKeys.userPreferences, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving action preferences:', error);
    }
  }

  /**
   * Update a specific action preference
   * @param key - Preference key
   * @param value - New value
   */
  async updateActionPreference(key: string, value: unknown): Promise<void> {
    try {
      const preferences = await this.getActionPreferences();
      (preferences as Record<string, unknown>)[key] = value;
      await this.saveActionPreferences(preferences);
    } catch (error) {
      console.error('Error updating action preference:', error);
    }
  }

  /**
   * Record an action button click
   * @param actionId - Action identifier (submit, view, etc.)
   * @param notificationType - Type of notification
   * @param context - Additional context data
   */
  async recordActionClick(actionId: string, notificationType: string, context: ActionContext = {}): Promise<void> {
    try {
      // Get current stats
      const stats = await this.getActionStats();
      
      // Initialize if needed
      if (!stats[notificationType]) {
        stats[notificationType] = {};
      }
      
      if (!stats[notificationType][actionId]) {
        stats[notificationType][actionId] = {
          count: 0,
          firstUsed: new Date().toISOString(),
          lastUsed: null,
          contexts: []
        };
      }
      
      // Update stats
      stats[notificationType][actionId].count++;
      stats[notificationType][actionId].lastUsed = new Date().toISOString();
      
      // Store context (keep last 10)
      stats[notificationType][actionId].contexts.push({
        timestamp: new Date().toISOString(),
        ...context
      });
      
      if (stats[notificationType][actionId].contexts.length > 10) {
        stats[notificationType][actionId].contexts.shift();
      }
      
      // Save updated stats
      await AsyncStorage.setItem(this.storageKeys.actionStats, JSON.stringify(stats));
      
      // Learn from usage patterns
      await this.learnFromUsagePattern(actionId, notificationType, stats);
      
      console.log(`Recorded action: ${actionId} for ${notificationType}`);
      
    } catch (error) {
      console.error('Error recording action click:', error);
    }
  }

  /**
   * Learn from usage patterns and update preferences
   * @param actionId - Action that was used
   * @param notificationType - Type of notification
   * @param stats - Current action statistics
   */
  private async learnFromUsagePattern(actionId: string, notificationType: string, stats: ActionStats): Promise<void> {
    try {
      const preferences = await this.getActionPreferences();
      
      if (!preferences.learnFromUsage) {
        return; // Learning disabled
      }
      
      const typeStats = stats[notificationType];
      const totalActionsForType = Object.values(typeStats).reduce((sum, action) => sum + action.count, 0);
      
      // If user has used this action type enough times, consider updating defaults
      if (totalActionsForType >= 5) {
        const actionUsage = typeStats[actionId].count / totalActionsForType;
        
        // If this action is used 60%+ of the time for this notification type, suggest it as default
        if (actionUsage >= 0.6 && preferences.defaultAction !== actionId) {
          await this.suggestDefaultActionChange(actionId, notificationType, actionUsage);
        }
      }
      
      // Learn remind later patterns
      if (actionId === 'later') {
        await this.learnRemindLaterPatterns(notificationType, typeStats.later);
      }
      
    } catch (error) {
      console.error('Error learning from usage pattern:', error);
    }
  }

  /**
   * Suggest changing default action based on usage
   * @param actionId - Suggested action
   * @param notificationType - Notification type
   * @param usagePercentage - Usage percentage
   */
  private async suggestDefaultActionChange(actionId: string, notificationType: string, usagePercentage: number): Promise<void> {
    try {
      // Schedule a suggestion notification
      const suggestionTime = new Date();
      suggestionTime.setMinutes(suggestionTime.getMinutes() + 2);
      
      await NotificationService.scheduleNotification(
        'Smart Action Suggestion',
        `You use "${actionId}" ${Math.round(usagePercentage * 100)}% of the time for ${notificationType} notifications. Make it your default?`,
        suggestionTime,
        {
          type: 'actionSuggestion',
          suggestedAction: actionId,
          notificationType,
          usagePercentage,
          deepLink: 'profile/settings'
        },
        {
          priority: Notifications.AndroidImportance.LOW,
          sound: false,
          actions: [
            { id: 'accept', title: 'Yes, Make Default' },
            { id: 'decline', title: 'No Thanks' }
          ],
          categoryIdentifier: 'action_suggestion'
        }
      );
      
    } catch (error) {
      console.error('Error suggesting default action change:', error);
    }
  }

  /**
   * Learn remind later patterns to optimize timing
   * @param notificationType - Notification type
   * @param _laterStats - Remind later statistics (unused for now)
   */
  private async learnRemindLaterPatterns(notificationType: string, _laterStats: unknown): Promise<void> {
    try {
      // Analyze when user typically acts after "remind later"
      const remindLaterActions = await this.getRemindLaterActions();
      
      // Filter for this notification type
      const typeReminders = remindLaterActions.filter((action: RemindLaterAction) => 
        action.notificationType === notificationType
      );
      
      if (typeReminders.length >= 3) {
        // Calculate average time between reminder and action
        const actionTimes = typeReminders
          .filter((reminder: RemindLaterAction) => reminder.actionTaken)
          .map((reminder: RemindLaterAction) => {
            const reminderTime = new Date(reminder.reminderTime);
            const actionTime = new Date(reminder.actionTaken!.timestamp);
            return actionTime.getTime() - reminderTime.getTime();
          });
        
        if (actionTimes.length >= 2) {
          const averageDelay = actionTimes.reduce((sum, time) => sum + time, 0) / actionTimes.length;
          const optimalMinutes = Math.round(averageDelay / (1000 * 60));
          
          // If pattern is significantly different from current setting, suggest update
          const currentDuration = await NotificationPreferencesService.getPreference('actions.remindLaterDuration', 60);
          
          if (Math.abs(optimalMinutes - currentDuration) > 15) {
            await this.suggestRemindLaterDurationChange(optimalMinutes, notificationType);
          }
        }
      }
      
    } catch (error) {
      console.error('Error learning remind later patterns:', error);
    }
  }

  /**
   * Suggest changing remind later duration based on patterns
   * @param suggestedMinutes - Suggested duration in minutes
   * @param notificationType - Notification type
   */
  private async suggestRemindLaterDurationChange(suggestedMinutes: number, notificationType: string): Promise<void> {
    try {
      const suggestionTime = new Date();
      suggestionTime.setMinutes(suggestionTime.getMinutes() + 5);
      
      await NotificationService.scheduleNotification(
        'Optimize Remind Later',
        `Based on your patterns, ${suggestedMinutes} minutes might work better for "${notificationType}" reminders. Update?`,
        suggestionTime,
        {
          type: 'remindLaterOptimization',
          suggestedDuration: suggestedMinutes,
          notificationType,
          deepLink: 'profile/settings'
        },
        {
          priority: Notifications.AndroidImportance.LOW,
          sound: false,
          actions: [
            { id: 'update', title: 'Update Setting' },
            { id: 'keep', title: 'Keep Current' }
          ],
          categoryIdentifier: 'remind_later_optimization'
        }
      );
      
    } catch (error) {
      console.error('Error suggesting remind later duration change:', error);
    }
  }

  /**
   * Handle ignore action and track patterns
   * @param notificationType - Type of notification ignored
   * @param context - Additional context
   */
  async handleIgnoreAction(notificationType: string, context: ActionContext = {}): Promise<void> {
    try {
      // Record the ignore action
      const ignoreActions = await this.getIgnoreActions();
      
      if (!ignoreActions[notificationType]) {
        ignoreActions[notificationType] = [];
      }
      
      ignoreActions[notificationType].push({
        timestamp: new Date().toISOString(),
        context
      });
      
      // Keep only recent ignore actions (last 20)
      if (ignoreActions[notificationType].length > 20) {
        ignoreActions[notificationType] = ignoreActions[notificationType].slice(-20);
      }
      
      await AsyncStorage.setItem(this.storageKeys.ignoreActions, JSON.stringify(ignoreActions));
      
      // Check if we should suggest disabling this notification type
      const preferences = await this.getActionPreferences();
      const ignoreCount = ignoreActions[notificationType].length;
      
      if (ignoreCount >= (preferences.maxIgnoreBeforeSuggestion || 3)) {
        await this.suggestDisableNotificationType(notificationType, ignoreCount);
      }
      
    } catch (error) {
      console.error('Error handling ignore action:', error);
    }
  }

  /**
   * Suggest disabling a notification type
   * @param notificationType - Type to suggest disabling
   * @param ignoreCount - Number of times ignored
   */
  private async suggestDisableNotificationType(notificationType: string, ignoreCount: number): Promise<void> {
    try {
      const suggestionTime = new Date();
      suggestionTime.setMinutes(suggestionTime.getMinutes() + 1);
      
      await NotificationService.scheduleNotification(
        'Notification Preferences',
        `You've ignored ${notificationType} notifications ${ignoreCount} times. Would you like to disable them?`,
        suggestionTime,
        {
          type: 'disableSuggestion',
          notificationType,
          ignoreCount,
          deepLink: 'profile/settings'
        },
        {
          priority: Notifications.AndroidImportance.LOW,
          sound: false,
          actions: [
            { id: 'disable', title: 'Disable Type' },
            { id: 'reduce', title: 'Reduce Frequency' },
            { id: 'keep', title: 'Keep As Is' }
          ],
          categoryIdentifier: 'disable_suggestion'
        }
      );
      
    } catch (error) {
      console.error('Error suggesting disable notification type:', error);
    }
  }

  /**
   * Get action statistics
   * @returns Action statistics
   */
  async getActionStats(): Promise<ActionStats> {
    try {
      const statsData = await AsyncStorage.getItem(this.storageKeys.actionStats);
      return statsData ? JSON.parse(statsData) : {};
    } catch (error) {
      console.error('Error getting action stats:', error);
      return {};
    }
  }

  /**
   * Get remind later actions
   * @returns Remind later actions
   */
  async getRemindLaterActions(): Promise<RemindLaterAction[]> {
    try {
      const actionsData = await AsyncStorage.getItem(this.storageKeys.remindLaterActions);
      return actionsData ? JSON.parse(actionsData) : [];
    } catch (error) {
      console.error('Error getting remind later actions:', error);
      return [];
    }
  }

  /**
   * Get ignore actions
   * @returns Ignore actions by type
   */
  async getIgnoreActions(): Promise<IgnoreActions> {
    try {
      const actionsData = await AsyncStorage.getItem(this.storageKeys.ignoreActions);
      return actionsData ? JSON.parse(actionsData) : {};
    } catch (error) {
      console.error('Error getting ignore actions:', error);
      return {};
    }
  }

  /**
   * Get comprehensive action analytics
   * @returns Complete analytics data
   */
  async getActionAnalytics(): Promise<ActionAnalytics> {
    try {
      const [stats, remindLater, ignore, preferences] = await Promise.all([
        this.getActionStats(),
        this.getRemindLaterActions(),
        this.getIgnoreActions(),
        this.getActionPreferences()
      ]);
      
      // Calculate summary statistics
      const totalActions = Object.values(stats).reduce((total, typeStats) => {
        return total + Object.values(typeStats).reduce((sum, action) => sum + action.count, 0);
      }, 0);
      
      const mostUsedActions: Record<string, { actionId: string | null; count: number }> = {};
      Object.entries(stats).forEach(([type, typeStats]) => {
        const actions = Object.entries(typeStats);
        if (actions.length > 0) {
          const mostUsed = actions.reduce((max, [actionId, actionData]) => 
            actionData.count > max.count ? { actionId, count: actionData.count } : max
          , { actionId: null as string | null, count: 0 });
          mostUsedActions[type] = mostUsed;
        }
      });
      
      return {
        stats,
        remindLater,
        ignore,
        preferences,
        summary: {
          totalActions,
          mostUsedActions,
          totalRemindLater: remindLater.length,
          totalIgnoreTypes: Object.keys(ignore).length
        }
      };
      
    } catch (error) {
      console.error('Error getting action analytics:', error);
      return {
        stats: {},
        remindLater: [],
        ignore: {},
        preferences: {},
        summary: {
          totalActions: 0,
          mostUsedActions: {},
          totalRemindLater: 0,
          totalIgnoreTypes: 0
        }
      };
    }
  }

  /**
   * Reset all action data (for testing or user request)
   */
  async resetActionData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.storageKeys.actionStats,
        this.storageKeys.remindLaterActions,
        this.storageKeys.ignoreActions,
        this.storageKeys.actionFeedback
      ]);
      
      // Reset preferences to defaults
      await this.ensureDefaultActionPreferences();
      
      console.log('All action data reset to defaults');
      
    } catch (error) {
      console.error('Error resetting action data:', error);
    }
  }

  /**
   * Export action data for backup or analysis
   * @returns Exported action data
   */
  async exportActionData(): Promise<ExportedActionData | null> {
    try {
      const analytics = await this.getActionAnalytics();
      
      return {
        ...analytics,
        exportedAt: new Date().toISOString(),
        version: 1
      };
      
    } catch (error) {
      console.error('Error exporting action data:', error);
      return null;
    }
  }

  /**
   * Import action data from backup
   * @param data - Imported action data
   * @returns Success status
   */
  async importActionData(data: ExportedActionData): Promise<boolean> {
    try {
      if (!data || data.version !== 1) {
        throw new Error('Invalid or incompatible action data');
      }
      
      // Import each data type
      if (data.stats) {
        await AsyncStorage.setItem(this.storageKeys.actionStats, JSON.stringify(data.stats));
      }
      
      if (data.remindLater) {
        await AsyncStorage.setItem(this.storageKeys.remindLaterActions, JSON.stringify(data.remindLater));
      }
      
      if (data.ignore) {
        await AsyncStorage.setItem(this.storageKeys.ignoreActions, JSON.stringify(data.ignore));
      }
      
      if (data.preferences) {
        await this.saveActionPreferences(data.preferences);
      }
      
      console.log('Action data imported successfully');
      return true;
      
    } catch (error) {
      console.error('Error importing action data:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new NotificationActionService();

