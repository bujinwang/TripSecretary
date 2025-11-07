/**
 * NotificationService - Handles local notification scheduling and management
 * 
 * Features:
 * - Schedule notifications with custom data
 * - Cancel notifications by ID
 * - Request notification permissions
 * - Handle notification responses
 * - Support for action buttons
 * 
 * Requirements: 16.1-16.5
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationPreferencesService from './NotificationPreferencesService';
import NotificationLogService from './NotificationLogService';
import type { UserId } from '../../types/data';

// Type definitions
interface PermissionStatus {
  granted: boolean;
  status?: string;
  error?: string;
}

interface NotificationData {
  type?: string;
  entryPackId?: string;
  entryInfoId?: string;
  userId?: UserId;
  deepLink?: string;
  originalTitle?: string;
  originalBody?: string;
  notificationId?: string;
  remindLaterCount?: number;
  scheduledAt?: string;
  [key: string]: any;
}

interface NotificationAction {
  id: string;
  title: string;
  titleKey?: string;
  foreground?: boolean;
  destructive?: boolean;
  authenticationRequired?: boolean;
  icon?: string;
}

interface NotificationOptions {
  priority?: Notifications.AndroidImportance;
  sound?: boolean;
  ignoreQuietHours?: boolean;
  actions?: NotificationAction[];
  categoryIdentifier?: string;
  content?: Record<string, any>;
}

interface ActionStats {
  [notificationType: string]: {
    [actionIdentifier: string]: number;
  };
}

interface RemindLaterAction {
  originalNotificationId?: string;
  newNotificationId: string;
  reminderTime: string;
  notificationType?: string;
  entryPackId?: string;
  createdAt: string;
}

interface IgnoreAction {
  timestamp: string;
  entryPackId?: string;
  notificationId?: string;
}

interface ActionFeedback {
  title: string;
  message: string;
  actionType: string;
  timestamp: string;
  data: NotificationData;
}

interface ActionAnalytics {
  actionStats: ActionStats;
  remindLaterActions: RemindLaterAction[];
  ignoreActions: Record<string, IgnoreAction[]>;
  totalActions: number;
}

interface PendingDeepLink {
  deepLink: string;
  data: NotificationData;
  timestamp: string;
}

type NotificationListener = Notifications.Subscription;
type NavigationRef = React.RefObject<any> | { current: any } | null;

class NotificationService {
  private isInitialized: boolean = false;
  private permissionStatus: PermissionStatus | null = null;
  private notificationListener: NotificationListener | null = null;
  private responseListener: NotificationListener | null = null;
  private navigationRef: NavigationRef = null;
  
  constructor() {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  /**
   * Initialize the notification service
   * - Request permissions
   * - Set up listeners
   * - Configure notification behavior
   */
  async initialize(): Promise<PermissionStatus> {
    if (this.isInitialized) {
      return this.permissionStatus!;
    }

    try {
      // iOS 18.5 Simulator protection - skip permission request in dev mode
      if (Platform.OS === 'ios' && __DEV__) {
        console.log('Skipping notification permissions in iOS simulator (dev mode)');
        this.permissionStatus = { granted: false, status: 'simulator-skip' };
        this.isInitialized = true;
        return this.permissionStatus;
      }

      // Request permissions
      this.permissionStatus = await this.requestPermissions();
      
      // Set up notification listeners
      this.setupListeners();
      
      this.isInitialized = true;
      console.log('NotificationService initialized successfully');
      
      return this.permissionStatus;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to initialize NotificationService:', err);
      // Don't throw in dev mode to prevent crashes
      if (__DEV__) {
        console.warn('Continuing without notifications in dev mode');
        this.permissionStatus = { granted: false, status: 'error' };
        this.isInitialized = true;
        return this.permissionStatus;
      }
      throw err;
    }
  }

  /**
   * Request notification permissions from the user
   * @returns Promise resolving to permission status object
   */
  async requestPermissions(): Promise<PermissionStatus> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return { granted: false, status: finalStatus };
      }

      // For Android, we need to create a notification channel
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      return { granted: true, status: finalStatus };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error requesting notification permissions:', err);
      return { granted: false, error: err.message };
    }
  }

  /**
   * Create notification channels for Android
   */
  async createNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      // Default channel for general notifications
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      // High priority channel for urgent notifications
      await Notifications.setNotificationChannelAsync('urgent', {
        name: 'Urgent Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      // Low priority channel for informational notifications
      await Notifications.setNotificationChannelAsync('info', {
        name: 'Information',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0, 250],
        lightColor: '#FF231F7C',
      });

      console.log('Android notification channels created');
    } catch (error) {
      console.error('Error creating notification channels:', error);
    }
  }

  /**
   * Set up notification listeners for handling responses
   */
  setupListeners(): void {
    // Listen for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listen for user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle notification received while app is in foreground
   * @param notification - The notification object
   */
  handleNotificationReceived(notification: Notifications.Notification): void {
    // Log the notification for debugging and analytics
    NotificationLogService.logEvent('received', notification, {
      appState: 'foreground',
      receivedAt: new Date().toISOString()
    });
    
    // You can add custom logic here for handling foreground notifications
    // For example, updating UI state or showing in-app alerts
  }

  /**
   * Handle user interaction with notifications
   * @param response - The notification response object
   */
  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    // Log the interaction with comprehensive data
    await NotificationLogService.logEvent('interacted', response.notification, {
      actionIdentifier: response.actionIdentifier,
      userText: response.userText,
      appState: 'background', // User tapped notification from outside app
      interactionType: response.actionIdentifier === 'default' ? 'tap' : 'action_button'
    });

    const data = response.notification.request.content.data as NotificationData;
    const actionIdentifier = response.actionIdentifier;

    // Handle action button clicks
    if (actionIdentifier && actionIdentifier !== 'default') {
      // Record the action with NotificationActionService
      const { NotificationActionService } = await import('./NotificationActionService');
      await NotificationActionService.recordActionClick(actionIdentifier, data.type, {
        notificationId: response.notification.request.identifier,
        entryPackId: data.entryPackId,
        deepLink: data.deepLink
      });
      
      await this.handleNotificationAction(actionIdentifier, data);
    } else {
      // Handle default notification tap (no action button)
      if (data && data.deepLink) {
        this.handleDeepLink(data.deepLink, data);
      }
    }
  }

  /**
   * Handle notification action button clicks
   * @param actionIdentifier - The action button identifier
   * @param data - Notification data
   */
  async handleNotificationAction(actionIdentifier: string, data: NotificationData): Promise<void> {
    console.log('Handling notification action:', actionIdentifier, data);

    // Log the action for analytics and debugging
    await NotificationLogService.logEvent('action_clicked', { actionIdentifier } as any, {
      ...data,
      actionType: actionIdentifier,
      timestamp: new Date().toISOString()
    });

    // Update user preferences based on action
    await this.updateActionPreferences(actionIdentifier, data);

    // Handle "Remind Later" actions with custom timing
    if (actionIdentifier === 'later') {
      await this.handleRemindLaterAction(data);
      return;
    }

    switch (actionIdentifier) {
      case 'submit':
        // Navigate to submission screen
        this.handleDeepLink('thailand/entryFlow', { 
          ...data, 
          autoSubmit: true,
          fromAction: 'submit'
        });
        // Show feedback to user
        this.showActionFeedback('submit', data);
        break;

      case 'resubmit':
      case 'resubmitImmediately':
        // Navigate to travel info screen for resubmission
        this.handleDeepLink('thailand/travelInfo', { 
          ...data, 
          resubmissionMode: true,
          fromAction: 'resubmit'
        });
        this.showActionFeedback('resubmit', data);
        break;

      case 'view':
        // Navigate to appropriate view screen
        if (data.entryPackId || data.entryInfoId) {
          this.handleDeepLink('entryInfo/detail', data);
        } else {
          this.handleDeepLink('thailand/entryFlow', data);
        }
        this.showActionFeedback('view', data);
        break;

      case 'continue':
        // Navigate to travel info screen to continue filling
        this.handleDeepLink('thailand/travelInfo', { 
          ...data, 
          fromAction: 'continue'
        });
        this.showActionFeedback('continue', data);
        break;

      case 'guide':
        // Navigate to immigration guide
        if (data.entryPackId || data.entryInfoId) {
          this.handleDeepLink('entryInfo/detail', {
            ...data,
            showGuide: true
          });
        }
        break;

      case 'itinerary':
        // Navigate to itinerary view (could be part of entry info detail)
        if (data.entryPackId || data.entryInfoId) {
          this.handleDeepLink('entryInfo/detail', {
            ...data,
            showItinerary: true
          });
        }
        break;

      case 'archive':
        // Handle archive action
        await this.handleArchiveAction(data);
        break;

      case 'view_entry_pack':
        // Navigate to entry info detail (legacy compatibility)
        if (data.entryPackId || data.entryInfoId) {
          this.handleDeepLink('entryInfo/detail', { entryInfoId: data.entryPackId || data.entryInfoId });
        }
        break;

      case 'cleanup':
        // Navigate to storage cleanup
        this.handleDeepLink('profile/settings', { 
          ...data, 
          settingsSection: 'storage' 
        });
        break;

      case 'settings':
        // Navigate to notification settings
        this.handleDeepLink('profile/settings', { 
          ...data, 
          settingsSection: 'notifications' 
        });
        break;

      case 'viewHistory':
        // Navigate to history
        this.handleDeepLink('history', data);
        break;

      case 'viewBackup':
        // Navigate to backup settings
        this.handleDeepLink('profile/settings', {
          ...data,
          settingsSection: 'backup'
        });
        break;

      case 'ignore':
        // Handle ignore action - may affect future notifications
        await this.handleIgnoreAction(data);
        console.log('User chose to ignore notification');
        break;

      case 'dismiss':
        // Just log the dismissal
        console.log('User dismissed notification');
        break;

      default:
        console.warn('Unknown notification action:', actionIdentifier);
        // Fallback to default deep link handling
        if (data && data.deepLink) {
          this.handleDeepLink(data.deepLink, data);
        }
        break;
    }
  }

  /**
   * Handle archive action from notification
   * @param data - Notification data
   */
  async handleArchiveAction(data: NotificationData): Promise<void> {
    try {
      if (data.entryPackId && data.userId) {
        // Use ExpiryWarningNotificationService for proper archive handling
        const ExpiryWarningNotificationService = await import('./ExpiryWarningNotificationService');
        
        const success = await ExpiryWarningNotificationService.default.handleArchiveAction(
          data.entryPackId, 
          data.userId
        );
        
        if (success) {
          console.log('Entry pack archived from expiry notification action:', data.entryPackId);
          // Navigate to history to show the archived pack
          this.handleDeepLink('history', data);
        } else {
          throw new Error('Archive action failed');
        }
      } else {
        // Fallback to direct EntryInfoService if no userId provided
        const EntryInfoService = await import('../EntryInfoService');

        // For schema v2.0, we need to update the entry info status instead of archiving
        // Since EntryPackService is removed, we'll use EntryInfoService
        await EntryInfoService.default.updateEntryInfoStatus(data.entryInfoId || data.entryPackId, 'archived', {
          reason: 'user_action_from_notification',
          archivedAt: new Date().toISOString()
        });
        console.log('Entry info archived from notification action:', data.entryInfoId || data.entryPackId);

        // Navigate to history to show the archived entry info
        this.handleDeepLink('history', data);
      }
    } catch (error) {
      console.error('Error archiving entry pack from notification:', error);
      // Navigate to entry pack detail to let user handle manually
      this.handleDeepLink('entryPack/detail', data);
    }
  }

  /**
   * Handle "Remind Later" action with custom timing
   * @param data - Notification data
   */
  async handleRemindLaterAction(data: NotificationData): Promise<void> {
    try {
      // Get user's preferred remind later duration
      const remindLaterDuration = await NotificationPreferencesService.getPreference('actions.remindLaterDuration', 60);
      
      // Calculate reminder time
      const reminderTime = new Date();
      reminderTime.setMinutes(reminderTime.getMinutes() + remindLaterDuration);

      // Schedule a new reminder notification
      const notificationId = await this.scheduleNotification(
        data.originalTitle || 'Reminder',
        data.originalBody || 'You asked to be reminded about this.',
        reminderTime,
        {
          ...data,
          isReminder: true,
          originalNotificationId: data.notificationId,
          remindLaterCount: (data.remindLaterCount || 0) + 1
        },
        {
          priority: Notifications.AndroidImportance.DEFAULT,
          sound: false // Less intrusive for remind later
        }
      );

      if (notificationId) {
        console.log(`Remind later notification scheduled for ${remindLaterDuration} minutes from now`);
        
        // Store the reminder for tracking
        await this.storeRemindLaterAction(data, reminderTime, notificationId);
      }

    } catch (error) {
      console.error('Error handling remind later action:', error);
    }
  }

  /**
   * Handle ignore action - may affect future notification preferences
   * @param data - Notification data
   */
  async handleIgnoreAction(data: NotificationData): Promise<void> {
    try {
      const notificationType = data.type;
      
      if (notificationType) {
        // Check if user has ignored this type multiple times
        const ignoreCount = await this.getIgnoreCount(notificationType);
        const newIgnoreCount = ignoreCount + 1;
        
        // Store the ignore action
        await this.storeIgnoreAction(notificationType, data);
        
        // If user has ignored this type 3+ times, ask if they want to disable it
        if (newIgnoreCount >= 3) {
          await this.suggestDisableNotificationType(notificationType);
        }
      }
      
      console.log(`User ignored notification type: ${data.type}, count: ${await this.getIgnoreCount(data.type || '') + 1}`);
      
    } catch (error) {
      console.error('Error handling ignore action:', error);
    }
  }

  /**
   * Update user action preferences based on their choices
   * @param actionIdentifier - The action taken
   * @param data - Notification data
   */
  async updateActionPreferences(actionIdentifier: string, data: NotificationData): Promise<void> {
    try {
      // Track action frequency for learning user preferences
      const actionStats = await this.getActionStats();
      const notificationType = data.type || 'unknown';
      
      if (!actionStats[notificationType]) {
        actionStats[notificationType] = {};
      }
      
      if (!actionStats[notificationType][actionIdentifier]) {
        actionStats[notificationType][actionIdentifier] = 0;
      }
      
      actionStats[notificationType][actionIdentifier]++;
      
      // Store updated stats
      await AsyncStorage.setItem('notificationActionStats', JSON.stringify(actionStats));
      
      // Update default action preference if this action is used frequently
      const totalActions = Object.values(actionStats[notificationType]).reduce((sum, count) => sum + count, 0);
      const actionPercentage = actionStats[notificationType][actionIdentifier] / totalActions;
      
      if (totalActions >= 5 && actionPercentage >= 0.6) {
        // If user uses this action 60%+ of the time, make it the default
        await NotificationPreferencesService.updatePreference('actions.defaultAction', actionIdentifier);
        console.log(`Updated default action to ${actionIdentifier} based on usage patterns`);
      }
      
    } catch (error) {
      console.error('Error updating action preferences:', error);
    }
  }

  /**
   * Show feedback to user about the action they took
   * @param actionType - Type of action (submit, view, etc.)
   * @param data - Notification data
   */
  async showActionFeedback(actionType: string, data: NotificationData): Promise<void> {
    try {
      // Import the translation system
      const { getTranslationWithFallback } = await import('../../i18n/locales');
      
      // Get user's language preference
      const language = await NotificationPreferencesService.getPreference('language', 'auto');
      const locale = language === 'auto' ? 'zh-CN' : language; // Default to Chinese
      
      // Get feedback messages from translations
      const titleKey = `progressiveEntryFlow.notifications.feedback.${actionType}Title`;
      const messageKey = `progressiveEntryFlow.notifications.feedback.${actionType}Message`;
      
      const title = getTranslationWithFallback(titleKey, locale);
      const message = getTranslationWithFallback(messageKey, locale);
      
      // Store feedback for the app to display (could be a toast or banner)
      await AsyncStorage.setItem('pendingActionFeedback', JSON.stringify({
        title,
        message,
        actionType,
        timestamp: new Date().toISOString(),
        data
      }));
      
      console.log(`Action feedback prepared: ${actionType}`);
      
    } catch (error) {
      console.error('Error showing action feedback:', error);
    }
  }

  /**
   * Store remind later action for tracking
   * @param data - Original notification data
   * @param reminderTime - When the reminder is scheduled
   * @param notificationId - New notification ID
   */
  async storeRemindLaterAction(data: NotificationData, reminderTime: Date, notificationId: string): Promise<void> {
    try {
      const remindLaterData = await AsyncStorage.getItem('remindLaterActions');
      const actions: RemindLaterAction[] = remindLaterData ? JSON.parse(remindLaterData) : [];
      
      actions.push({
        originalNotificationId: data.notificationId,
        newNotificationId: notificationId,
        reminderTime: reminderTime.toISOString(),
        notificationType: data.type,
        entryPackId: data.entryPackId,
        createdAt: new Date().toISOString()
      });
      
      // Keep only the last 50 remind later actions
      if (actions.length > 50) {
        actions.splice(0, actions.length - 50);
      }
      
      await AsyncStorage.setItem('remindLaterActions', JSON.stringify(actions));
      
    } catch (error) {
      console.error('Error storing remind later action:', error);
    }
  }

  /**
   * Store ignore action for tracking
   * @param notificationType - Type of notification ignored
   * @param data - Notification data
   */
  async storeIgnoreAction(notificationType: string, data: NotificationData): Promise<void> {
    try {
      const ignoreData = await AsyncStorage.getItem('notificationIgnoreActions');
      const actions: Record<string, IgnoreAction[]> = ignoreData ? JSON.parse(ignoreData) : {};
      
      if (!actions[notificationType]) {
        actions[notificationType] = [];
      }
      
      actions[notificationType].push({
        timestamp: new Date().toISOString(),
        entryPackId: data.entryPackId,
        notificationId: data.notificationId
      });
      
      // Keep only the last 20 ignore actions per type
      if (actions[notificationType].length > 20) {
        actions[notificationType].splice(0, actions[notificationType].length - 20);
      }
      
      await AsyncStorage.setItem('notificationIgnoreActions', JSON.stringify(actions));
      
    } catch (error) {
      console.error('Error storing ignore action:', error);
    }
  }

  /**
   * Get ignore count for a notification type
   * @param notificationType - Type of notification
   * @returns Promise resolving to number of times this type was ignored
   */
  async getIgnoreCount(notificationType: string): Promise<number> {
    try {
      const ignoreData = await AsyncStorage.getItem('notificationIgnoreActions');
      const actions: Record<string, IgnoreAction[]> = ignoreData ? JSON.parse(ignoreData) : {};
      
      return actions[notificationType] ? actions[notificationType].length : 0;
      
    } catch (error) {
      console.error('Error getting ignore count:', error);
      return 0;
    }
  }

  /**
   * Get action statistics for learning user preferences
   * @returns Promise resolving to action statistics object
   */
  async getActionStats(): Promise<ActionStats> {
    try {
      const statsData = await AsyncStorage.getItem('notificationActionStats');
      return statsData ? JSON.parse(statsData) : {};
      
    } catch (error) {
      console.error('Error getting action stats:', error);
      return {};
    }
  }

  /**
   * Suggest disabling a notification type if ignored frequently
   * @param notificationType - Type of notification
   */
  async suggestDisableNotificationType(notificationType: string): Promise<void> {
    try {
      // Schedule a suggestion notification
      const suggestionTime = new Date();
      suggestionTime.setMinutes(suggestionTime.getMinutes() + 5); // 5 minutes later
      
      await this.scheduleNotification(
        'Notification Settings',
        `You've ignored ${notificationType} notifications multiple times. Would you like to disable them?`,
        suggestionTime,
        {
          type: 'settingsSuggestion',
          suggestedAction: 'disableNotificationType',
          notificationType,
          deepLink: 'profile/settings'
        },
        {
          priority: Notifications.AndroidImportance.LOW,
          sound: false,
          actions: [
            { id: 'disable', title: 'Disable' },
            { id: 'keep', title: 'Keep Enabled' }
          ],
          categoryIdentifier: 'settings_suggestion'
        }
      );
      
    } catch (error) {
      console.error('Error suggesting disable notification type:', error);
    }
  }

  /**
   * Prepare notification actions with proper formatting and translations
   * @param actions - Array of action objects
   * @param notificationType - Type of notification
   * @returns Promise resolving to formatted actions for the platform
   */
  async prepareNotificationActions(actions: NotificationAction[], notificationType?: string): Promise<any[]> {
    try {
      // Import the translation system
      const { getTranslationWithFallback } = await import('../../i18n/locales');
      
      // Get user's language preference
      const language = await NotificationPreferencesService.getPreference('language', 'auto');
      const locale = language === 'auto' ? 'zh-CN' : language;
      
      const preparedActions: any[] = [];
      
      for (const action of actions) {
        let title = action.title;
        
        // If action has a translation key, use it
        if (action.titleKey) {
          title = getTranslationWithFallback(action.titleKey, locale);
        }
        
        // Prepare action based on platform
        if (Platform.OS === 'ios') {
          preparedActions.push({
            identifier: action.id,
            title: title,
            options: {
              foreground: action.foreground !== false, // Default to foreground
              destructive: action.destructive === true,
              authenticationRequired: action.authenticationRequired === true
            }
          });
        } else {
          // Android format
          preparedActions.push({
            identifier: action.id,
            title: title,
            icon: action.icon || null
          });
        }
      }
      
      return preparedActions;
      
    } catch (error) {
      console.error('Error preparing notification actions:', error);
      return [];
    }
  }

  /**
   * Get pending action feedback for display in the app
   * @returns Promise resolving to pending feedback or null
   */
  async getPendingActionFeedback(): Promise<ActionFeedback | null> {
    try {
      const feedbackData = await AsyncStorage.getItem('pendingActionFeedback');
      
      if (feedbackData) {
        const feedback: ActionFeedback = JSON.parse(feedbackData);
        
        // Check if feedback is not too old (within 5 minutes)
        const feedbackAge = Date.now() - new Date(feedback.timestamp).getTime();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        if (feedbackAge < maxAge) {
          // Clear the feedback after retrieving it
          await AsyncStorage.removeItem('pendingActionFeedback');
          return feedback;
        } else {
          // Remove expired feedback
          await AsyncStorage.removeItem('pendingActionFeedback');
        }
      }
      
      return null;
      
    } catch (error) {
      console.error('Error getting pending action feedback:', error);
      return null;
    }
  }

  /**
   * Clear all action-related data (for testing or reset)
   */
  async clearActionData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'notificationActionStats',
        'remindLaterActions',
        'notificationIgnoreActions',
        'pendingActionFeedback'
      ]);
      
      console.log('All notification action data cleared');
      
    } catch (error) {
      console.error('Error clearing action data:', error);
    }
  }

  /**
   * Get action statistics for debugging and analytics
   * @returns Promise resolving to complete action statistics
   */
  async getActionAnalytics(): Promise<ActionAnalytics> {
    try {
      const [actionStats, remindLaterActions, ignoreActions] = await Promise.all([
        this.getActionStats(),
        AsyncStorage.getItem('remindLaterActions'),
        AsyncStorage.getItem('notificationIgnoreActions')
      ]);
      
      return {
        actionStats,
        remindLaterActions: remindLaterActions ? JSON.parse(remindLaterActions) : [],
        ignoreActions: ignoreActions ? JSON.parse(ignoreActions) : {},
        totalActions: Object.values(actionStats).reduce((total, typeStats) => {
          return total + Object.values(typeStats).reduce((sum: number, count: number) => sum + count, 0);
        }, 0)
      };
      
    } catch (error) {
      console.error('Error getting action analytics:', error);
      return {
        actionStats: {},
        remindLaterActions: [],
        ignoreActions: {},
        totalActions: 0
      };
    }
  }

  /**
   * Schedule a local notification
   * @param title - Notification title
   * @param body - Notification body text
   * @param date - When to trigger (Date object or seconds from now)
   * @param data - Custom data to include with notification
   * @param options - Additional notification options
   * @returns Promise resolving to notification identifier or null
   */
  async scheduleNotification(
    title: string, 
    body: string, 
    date: Date | number, 
    data: NotificationData = {}, 
    options: NotificationOptions = {}
  ): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.permissionStatus?.granted) {
        throw new Error('Notification permissions not granted');
      }

      // Check user preferences before scheduling
      const notificationType = data.type || 'general';
      const isTypeEnabled = await NotificationPreferencesService.isNotificationTypeEnabled(notificationType);
      
      if (!isTypeEnabled) {
        console.log(`Notification type '${notificationType}' is disabled by user preferences`);
        return null; // Don't schedule if disabled
      }

      // Check quiet hours
      const isQuietTime = await NotificationPreferencesService.isInQuietHours();
      if (isQuietTime && !options.ignoreQuietHours) {
        console.log('Notification not scheduled due to quiet hours');
        return null; // Don't schedule during quiet hours
      }

      // Prepare the notification content
      const content: any = {
        title,
        body,
        data: {
          ...data,
          scheduledAt: new Date().toISOString(),
        },
        sound: options.sound !== false ? 'default' : false,
        priority: options.priority || Notifications.AndroidImportance.DEFAULT,
        ...options.content
      };

      // Add action buttons if provided and enabled in preferences
      const showQuickActions = await NotificationPreferencesService.getPreference('actions.showQuickActions', true);
      
      if (showQuickActions && options.actions && options.actions.length > 0) {
        content.categoryIdentifier = options.categoryIdentifier || 'default';
        
        // Prepare actions for the platform
        const actions = await this.prepareNotificationActions(options.actions, data.type);
        
        // Register the category with actions (iOS)
        if (Platform.OS === 'ios' && actions.length > 0) {
          await Notifications.setNotificationCategoryAsync(content.categoryIdentifier, actions);
        }
        
        // For Android, actions are handled differently
        if (Platform.OS === 'android' && actions.length > 0) {
          content.actions = actions;
        }
      }

      // Prepare the trigger
      let trigger: Notifications.NotificationTriggerInput;
      if (date instanceof Date) {
        trigger = { date };
      } else if (typeof date === 'number') {
        trigger = { seconds: date };
      } else {
        throw new Error('Invalid date parameter. Must be Date object or number of seconds.');
      }

      // Schedule the notification
      const identifier = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });

      // Log the scheduling with comprehensive data
      await NotificationLogService.logEvent('scheduled', { 
        identifier, 
        title, 
        body, 
        ...data 
      } as any, {
        scheduledFor: date instanceof Date ? date.toISOString() : `${date} seconds from now`,
        priority: options.priority,
        hasActions: options.actions && options.actions.length > 0,
        categoryIdentifier: options.categoryIdentifier
      });

      console.log(`Notification scheduled with ID: ${identifier}`);
      return identifier;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error scheduling notification:', err);
      throw err;
    }
  }

  /**
   * Cancel a scheduled notification
   * @param notificationId - The notification identifier to cancel
   * @returns Promise resolving to success status
   */
  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      
      // Log the cancellation
      await NotificationLogService.logEvent('cancelled', { identifier: notificationId } as any, {
        reason: 'manual_cancellation',
        cancelledAt: new Date().toISOString()
      });
      
      console.log(`Notification ${notificationId} cancelled`);
      return true;
    } catch (error) {
      console.error('Error cancelling notification:', error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   * @returns Promise resolving to success status
   */
  async cancelAllNotifications(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Log the cancellation
      await NotificationLogService.logEvent('cancelled_all', {} as any, {
        reason: 'cancel_all_requested',
        cancelledAt: new Date().toISOString()
      });
      
      console.log('All notifications cancelled');
      return true;
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      return false;
    }
  }

  /**
   * Get all scheduled notifications
   * @returns Promise resolving to array of scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Check if notifications are enabled
   * @returns Promise resolving to whether notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Handle deep linking from notifications
   * @param deepLink - The deep link URL
   * @param data - Additional notification data
   */
  handleDeepLink(deepLink: string, data: NotificationData): void {
    console.log('Deep link from notification:', deepLink, data);
    
    // Store the deep link for the app to handle when it becomes active
    AsyncStorage.setItem('pendingNotificationDeepLink', JSON.stringify({
      deepLink,
      data,
      timestamp: new Date().toISOString()
    }));

    // If navigation is available, handle immediately
    if (this.navigationRef && (this.navigationRef as any).current) {
      this.navigateFromDeepLink(deepLink, data);
    }
  }

  /**
   * Set navigation reference for deep link handling
   * @param navigationRef - React Navigation ref
   */
  setNavigationRef(navigationRef: NavigationRef): void {
    this.navigationRef = navigationRef;
  }

  /**
   * Navigate based on deep link
   * @param deepLink - The deep link destination
   * @param data - Additional navigation data
   */
  navigateFromDeepLink(deepLink: string, data: NotificationData): void {
    const navRef = this.navigationRef as any;
    if (!navRef || !navRef.current) {
      console.warn('Navigation ref not available for deep link:', deepLink);
      return;
    }

    const navigation = navRef.current;

    try {
      switch (deepLink) {
        case 'thailand/entryFlow':
          navigation.navigate('ThailandEntryFlow', {
            fromNotification: true,
            notificationData: data
          });
          break;

        case 'thailand/travelInfo':
          navigation.navigate('ThailandTravelInfo', {
            fromNotification: true,
            notificationData: data,
            expandSection: data.expandSection || null
          });
          break;

        case 'entryPack/detail':
        case 'entryInfo/detail':
          const entryInfoId = data.entryPackId || data.entryInfoId;
          if (entryInfoId) {
            navigation.navigate('EntryInfoDetail', {
              entryInfoId: entryInfoId,
              fromNotification: true,
              notificationData: data
            });
          } else {
            console.warn('Entry info ID missing for entryInfo/detail deep link');
          }
          break;

        case 'profile/settings':
          navigation.navigate('MainTabs', { screen: 'Profile' });
          // Navigate to settings within profile if needed
          if (data.settingsSection) {
            setTimeout(() => {
              navigation.navigate('NotificationSettings', {
                section: data.settingsSection
              });
            }, 100);
          }
          break;

        case 'history':
          navigation.navigate('MainTabs', { screen: 'History' });
          break;

        case 'home':
        default:
          navigation.navigate('MainTabs', { screen: 'Home' });
          break;
      }

      // Clear the pending deep link after successful navigation
      AsyncStorage.removeItem('pendingNotificationDeepLink');
      
      console.log('Successfully navigated from notification deep link:', deepLink);
    } catch (error) {
      console.error('Error navigating from deep link:', error);
    }
  }

  /**
   * Check for and handle pending notification deep links
   * Call this when the app becomes active or navigation is ready
   */
  async handlePendingDeepLink(): Promise<void> {
    try {
      const pendingDeepLinkData = await AsyncStorage.getItem('pendingNotificationDeepLink');
      
      if (pendingDeepLinkData) {
        const { deepLink, data, timestamp }: PendingDeepLink = JSON.parse(pendingDeepLinkData);
        
        // Check if the deep link is not too old (within 5 minutes)
        const linkAge = Date.now() - new Date(timestamp).getTime();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        if (linkAge < maxAge) {
          console.log('Handling pending notification deep link:', deepLink);
          this.navigateFromDeepLink(deepLink, data);
        } else {
          console.log('Pending deep link expired, ignoring:', deepLink);
          AsyncStorage.removeItem('pendingNotificationDeepLink');
        }
      }
    } catch (error) {
      console.error('Error handling pending deep link:', error);
    }
  }

  /**
   * Log notification events for debugging and analytics
   * @deprecated Use NotificationLogService.logEvent() instead
   * @param eventType - Type of event (scheduled, received, interacted, etc.)
   * @param notification - Notification object
   * @param metadata - Additional metadata
   */
  async logNotificationEvent(eventType: string, notification: any, metadata: Record<string, any> = {}): Promise<void> {
    try {
      // Use the new comprehensive logging service
      await NotificationLogService.logEvent(eventType, notification, metadata);
    } catch (error) {
      console.error('Error logging notification event:', error);
    }
  }

  /**
   * Schedule a notification with type checking
   * @param type - Notification type (submissionWindow, urgentReminder, etc.)
   * @param title - Notification title
   * @param body - Notification body text
   * @param date - When to trigger
   * @param data - Additional data
   * @param options - Additional options
   * @returns Promise resolving to notification identifier or null if not scheduled
   */
  async scheduleTypedNotification(
    type: string, 
    title: string, 
    body: string, 
    date: Date | number, 
    data: NotificationData = {}, 
    options: NotificationOptions = {}
  ): Promise<string | null> {
    const notificationData: NotificationData = {
      ...data,
      type,
      scheduledAt: new Date().toISOString()
    };

    return await this.scheduleNotification(title, body, date, notificationData, options);
  }

  /**
   * Check if notifications are enabled for a specific type
   * @param type - Notification type
   * @returns Promise resolving to whether notifications are enabled for this type
   */
  async isNotificationTypeEnabled(type: string): Promise<boolean> {
    return await NotificationPreferencesService.isNotificationTypeEnabled(type);
  }

  /**
   * Get user's preferred reminder time
   * @returns Promise resolving to reminder time in HH:MM format
   */
  async getReminderTime(): Promise<string> {
    return await NotificationPreferencesService.getReminderTime();
  }

  /**
   * Clean up listeners when service is destroyed
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export default new NotificationService();

