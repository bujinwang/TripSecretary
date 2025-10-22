import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationPreferencesService from './NotificationPreferencesService';
import NotificationLogService from './NotificationLogService';

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
class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.permissionStatus = null;
    this.notificationListener = null;
    this.responseListener = null;
    
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
  async initialize() {
    if (this.isInitialized) {
      return this.permissionStatus;
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
      console.error('Failed to initialize NotificationService:', error);
      // Don't throw in dev mode to prevent crashes
      if (__DEV__) {
        console.warn('Continuing without notifications in dev mode');
        this.permissionStatus = { granted: false, status: 'error' };
        this.isInitialized = true;
        return this.permissionStatus;
      }
      throw error;
    }
  }

  /**
   * Request notification permissions from the user
   * @returns {Promise<Object>} Permission status object
   */
  async requestPermissions() {
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
      console.error('Error requesting notification permissions:', error);
      return { granted: false, error: error.message };
    }
  }

  /**
   * Create notification channels for Android
   */
  async createNotificationChannels() {
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
  setupListeners() {
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
   * @param {Object} notification - The notification object
   */
  handleNotificationReceived(notification) {
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
   * @param {Object} response - The notification response object
   */
  async handleNotificationResponse(response) {
    // Log the interaction with comprehensive data
    await NotificationLogService.logEvent('interacted', response.notification, {
      actionIdentifier: response.actionIdentifier,
      userText: response.userText,
      appState: 'background', // User tapped notification from outside app
      interactionType: response.actionIdentifier === 'default' ? 'tap' : 'action_button'
    });

    const { data } = response.notification.request.content;
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
   * @param {string} actionIdentifier - The action button identifier
   * @param {Object} data - Notification data
   */
  async handleNotificationAction(actionIdentifier, data) {
    console.log('Handling notification action:', actionIdentifier, data);

    // Log the action for analytics and debugging
    await NotificationLogService.logEvent('action_clicked', { actionIdentifier }, {
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
        if (data.entryPackId) {
          this.handleDeepLink('entryPack/detail', data);
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
        if (data.entryPackId) {
          this.handleDeepLink('entryPack/detail', { 
            ...data, 
            showGuide: true 
          });
        }
        break;

      case 'itinerary':
        // Navigate to itinerary view (could be part of entry pack detail)
        if (data.entryPackId) {
          this.handleDeepLink('entryPack/detail', { 
            ...data, 
            showItinerary: true 
          });
        }
        break;

      case 'archive':
        // Handle archive action
        await this.handleArchiveAction(data);
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
   * @param {Object} data - Notification data
   */
  async handleArchiveAction(data) {
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
        // Fallback to direct EntryPackService if no userId provided
        const { EntryPackService } = await import('../entryPack/EntryPackService');
        
        await EntryPackService.archive(data.entryPackId, 'user_action_from_notification');
        console.log('Entry pack archived from notification action:', data.entryPackId);
        
        // Navigate to history to show the archived pack
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
   * @param {Object} data - Notification data
   */
  async handleRemindLaterAction(data) {
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
          priority: 'normal',
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
   * @param {Object} data - Notification data
   */
  async handleIgnoreAction(data) {
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
      
      console.log(`User ignored notification type: ${notificationType}, count: ${ignoreCount + 1}`);
      
    } catch (error) {
      console.error('Error handling ignore action:', error);
    }
  }

  /**
   * Update user action preferences based on their choices
   * @param {string} actionIdentifier - The action taken
   * @param {Object} data - Notification data
   */
  async updateActionPreferences(actionIdentifier, data) {
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
   * @param {string} actionType - Type of action (submit, view, etc.)
   * @param {Object} data - Notification data
   */
  async showActionFeedback(actionType, data) {
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
   * @param {Object} data - Original notification data
   * @param {Date} reminderTime - When the reminder is scheduled
   * @param {string} notificationId - New notification ID
   */
  async storeRemindLaterAction(data, reminderTime, notificationId) {
    try {
      const remindLaterData = await AsyncStorage.getItem('remindLaterActions');
      const actions = remindLaterData ? JSON.parse(remindLaterData) : [];
      
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
   * @param {string} notificationType - Type of notification ignored
   * @param {Object} data - Notification data
   */
  async storeIgnoreAction(notificationType, data) {
    try {
      const ignoreData = await AsyncStorage.getItem('notificationIgnoreActions');
      const actions = ignoreData ? JSON.parse(ignoreData) : {};
      
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
   * @param {string} notificationType - Type of notification
   * @returns {Promise<number>} Number of times this type was ignored
   */
  async getIgnoreCount(notificationType) {
    try {
      const ignoreData = await AsyncStorage.getItem('notificationIgnoreActions');
      const actions = ignoreData ? JSON.parse(ignoreData) : {};
      
      return actions[notificationType] ? actions[notificationType].length : 0;
      
    } catch (error) {
      console.error('Error getting ignore count:', error);
      return 0;
    }
  }

  /**
   * Get action statistics for learning user preferences
   * @returns {Promise<Object>} Action statistics object
   */
  async getActionStats() {
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
   * @param {string} notificationType - Type of notification
   */
  async suggestDisableNotificationType(notificationType) {
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
          priority: 'low',
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
   * @param {Array} actions - Array of action objects
   * @param {string} notificationType - Type of notification
   * @returns {Promise<Array>} Formatted actions for the platform
   */
  async prepareNotificationActions(actions, notificationType) {
    try {
      // Import the translation system
      const { getTranslationWithFallback } = await import('../../i18n/locales');
      
      // Get user's language preference
      const language = await NotificationPreferencesService.getPreference('language', 'auto');
      const locale = language === 'auto' ? 'zh-CN' : language;
      
      const preparedActions = [];
      
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
   * @returns {Promise<Object|null>} Pending feedback or null
   */
  async getPendingActionFeedback() {
    try {
      const feedbackData = await AsyncStorage.getItem('pendingActionFeedback');
      
      if (feedbackData) {
        const feedback = JSON.parse(feedbackData);
        
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
  async clearActionData() {
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
   * @returns {Promise<Object>} Complete action statistics
   */
  async getActionAnalytics() {
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
          return total + Object.values(typeStats).reduce((sum, count) => sum + count, 0);
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
   * @param {string} title - Notification title
   * @param {string} body - Notification body text
   * @param {Date|number} date - When to trigger (Date object or seconds from now)
   * @param {Object} data - Custom data to include with notification
   * @param {Object} options - Additional notification options
   * @returns {Promise<string>} Notification identifier
   */
  async scheduleNotification(title, body, date, data = {}, options = {}) {
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
      const content = {
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
      let trigger;
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
      }, {
        scheduledFor: date instanceof Date ? date.toISOString() : `${date} seconds from now`,
        priority: options.priority,
        hasActions: options.actions && options.actions.length > 0,
        categoryIdentifier: options.categoryIdentifier
      });

      console.log(`Notification scheduled with ID: ${identifier}`);
      return identifier;

    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   * @param {string} notificationId - The notification identifier to cancel
   * @returns {Promise<boolean>} Success status
   */
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      
      // Log the cancellation
      await NotificationLogService.logEvent('cancelled', { identifier: notificationId }, {
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
   * @returns {Promise<boolean>} Success status
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Log the cancellation
      await NotificationLogService.logEvent('cancelled_all', {}, {
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
   * @returns {Promise<Array>} Array of scheduled notifications
   */
  async getScheduledNotifications() {
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
   * @returns {Promise<boolean>} Whether notifications are enabled
   */
  async areNotificationsEnabled() {
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
   * @param {string} deepLink - The deep link URL
   * @param {Object} data - Additional notification data
   */
  handleDeepLink(deepLink, data) {
    console.log('Deep link from notification:', deepLink, data);
    
    // Store the deep link for the app to handle when it becomes active
    AsyncStorage.setItem('pendingNotificationDeepLink', JSON.stringify({
      deepLink,
      data,
      timestamp: new Date().toISOString()
    }));

    // If navigation is available, handle immediately
    if (this.navigationRef && this.navigationRef.current) {
      this.navigateFromDeepLink(deepLink, data);
    }
  }

  /**
   * Set navigation reference for deep link handling
   * @param {Object} navigationRef - React Navigation ref
   */
  setNavigationRef(navigationRef) {
    this.navigationRef = navigationRef;
  }

  /**
   * Navigate based on deep link
   * @param {string} deepLink - The deep link destination
   * @param {Object} data - Additional navigation data
   */
  navigateFromDeepLink(deepLink, data) {
    if (!this.navigationRef || !this.navigationRef.current) {
      console.warn('Navigation ref not available for deep link:', deepLink);
      return;
    }

    const navigation = this.navigationRef.current;

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
          if (data.entryPackId) {
            navigation.navigate('EntryPackDetail', {
              entryPackId: data.entryPackId,
              fromNotification: true,
              notificationData: data
            });
          } else {
            console.warn('Entry pack ID missing for entryPack/detail deep link');
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
  async handlePendingDeepLink() {
    try {
      const pendingDeepLinkData = await AsyncStorage.getItem('pendingNotificationDeepLink');
      
      if (pendingDeepLinkData) {
        const { deepLink, data, timestamp } = JSON.parse(pendingDeepLinkData);
        
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
   * @param {string} eventType - Type of event (scheduled, received, interacted, etc.)
   * @param {Object} notification - Notification object
   * @param {Object} metadata - Additional metadata
   */
  async logNotificationEvent(eventType, notification, metadata = {}) {
    try {
      // Use the new comprehensive logging service
      await NotificationLogService.logEvent(eventType, notification, metadata);
    } catch (error) {
      console.error('Error logging notification event:', error);
    }
  }

  /**
   * Schedule a notification with type checking
   * @param {string} type - Notification type (submissionWindow, urgentReminder, etc.)
   * @param {string} title - Notification title
   * @param {string} body - Notification body text
   * @param {Date|number} date - When to trigger
   * @param {Object} data - Additional data
   * @param {Object} options - Additional options
   * @returns {Promise<string|null>} Notification identifier or null if not scheduled
   */
  async scheduleTypedNotification(type, title, body, date, data = {}, options = {}) {
    const notificationData = {
      ...data,
      type,
      scheduledAt: new Date().toISOString()
    };

    return await this.scheduleNotification(title, body, date, notificationData, options);
  }

  /**
   * Check if notifications are enabled for a specific type
   * @param {string} type - Notification type
   * @returns {Promise<boolean>} Whether notifications are enabled for this type
   */
  async isNotificationTypeEnabled(type) {
    return await NotificationPreferencesService.isNotificationTypeEnabled(type);
  }

  /**
   * Get user's preferred reminder time
   * @returns {Promise<string>} Reminder time in HH:MM format
   */
  async getReminderTime() {
    return await NotificationPreferencesService.getReminderTime();
  }

  /**
   * Clean up listeners when service is destroyed
   */
  cleanup() {
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