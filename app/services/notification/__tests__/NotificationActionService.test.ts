// @ts-nocheck

/**
 * NotificationActionService Tests
 * 
 * Tests for notification action button functionality including:
 * - Action recording and statistics
 * - User preference learning
 * - Remind later functionality
 * - Ignore action handling
 * - Analytics and data export
 * 
 * Requirements: 16.3, 16.5
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationActionService from '../NotificationActionService';
import NotificationService from '../NotificationService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock NotificationService
jest.mock('../NotificationService', () => ({
  scheduleNotification: jest.fn(),
}));

describe('NotificationActionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
  });

  describe('Action Recording', () => {
    it('should record action clicks correctly', async () => {
      // Mock existing stats
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({}));

      await NotificationActionService.recordActionClick('submit', 'urgentReminder', {
        entryPackId: 'test-pack-1'
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'notificationActionStats',
        expect.stringContaining('submit')
      );
    });

    it('should increment action count for repeated actions', async () => {
      // Mock existing stats with previous action
      const existingStats = {
        urgentReminder: {
          submit: {
            count: 2,
            firstUsed: '2024-01-01T00:00:00.000Z',
            lastUsed: '2024-01-02T00:00:00.000Z',
            contexts: []
          }
        }
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingStats));

      await NotificationActionService.recordActionClick('submit', 'urgentReminder');

      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData.urgentReminder.submit.count).toBe(3);
    });

    it('should store action contexts with limit', async () => {
      // Mock existing stats with many contexts
      const existingStats = {
        urgentReminder: {
          submit: {
            count: 15,
            firstUsed: '2024-01-01T00:00:00.000Z',
            lastUsed: '2024-01-02T00:00:00.000Z',
            contexts: new Array(10).fill({ timestamp: '2024-01-01T00:00:00.000Z' })
          }
        }
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingStats));

      await NotificationActionService.recordActionClick('submit', 'urgentReminder', {
        entryPackId: 'test-pack-1'
      });

      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData.urgentReminder.submit.contexts).toHaveLength(10); // Should not exceed 10
    });
  });

  describe('Usage Pattern Learning', () => {
    it('should suggest default action change when usage exceeds threshold', async () => {
      // Mock stats showing high usage of 'view' action
      const stats = {
        urgentReminder: {
          view: { count: 6 },
          submit: { count: 2 },
          later: { count: 2 }
        }
      };

      // Mock preferences - need to mock getActionPreferences method
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ 
        learnFromUsage: true, 
        defaultAction: 'submit' 
      }));

      await NotificationActionService.learnFromUsagePattern('view', 'urgentReminder', stats);

      expect(NotificationService.scheduleNotification).toHaveBeenCalledWith(
        'Smart Action Suggestion',
        expect.stringContaining('60%'),
        expect.any(Date),
        expect.objectContaining({
          type: 'actionSuggestion',
          suggestedAction: 'view'
        }),
        expect.any(Object)
      );
    });

    it('should not suggest changes when learning is disabled', async () => {
      const stats = {
        urgentReminder: {
          view: { count: 8 },
          submit: { count: 2 }
        }
      };

      // Mock preferences with learning disabled
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ 
        learnFromUsage: false 
      }));

      await NotificationActionService.learnFromUsagePattern('view', 'urgentReminder', stats);

      expect(NotificationService.scheduleNotification).not.toHaveBeenCalled();
    });
  });

  describe('Ignore Action Handling', () => {
    it('should track ignore actions by notification type', async () => {
      // Mock getIgnoreActions and getActionPreferences
      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify({})) // getIgnoreActions
        .mockResolvedValueOnce(JSON.stringify({ maxIgnoreBeforeSuggestion: 3 })); // getActionPreferences

      await NotificationActionService.handleIgnoreAction('urgentReminder', {
        entryPackId: 'test-pack-1'
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'notificationIgnoreActions',
        expect.stringContaining('urgentReminder')
      );
    });

    it('should suggest disabling notification type after multiple ignores', async () => {
      // Mock existing ignore actions at threshold
      const existingIgnores = {
        urgentReminder: [
          { timestamp: '2024-01-01T00:00:00.000Z' },
          { timestamp: '2024-01-02T00:00:00.000Z' }
        ]
      };
      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(existingIgnores)) // getIgnoreActions
        .mockResolvedValueOnce(JSON.stringify({ maxIgnoreBeforeSuggestion: 3 })); // getActionPreferences

      await NotificationActionService.handleIgnoreAction('urgentReminder');

      expect(NotificationService.scheduleNotification).toHaveBeenCalledWith(
        'Notification Preferences',
        expect.stringContaining('3 times'),
        expect.any(Date),
        expect.objectContaining({
          type: 'disableSuggestion'
        }),
        expect.any(Object)
      );
    });

    it('should limit stored ignore actions to 20 per type', async () => {
      // Mock existing ignore actions at limit
      const existingIgnores = {
        urgentReminder: new Array(20).fill({ timestamp: '2024-01-01T00:00:00.000Z' })
      };
      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(existingIgnores)) // getIgnoreActions
        .mockResolvedValueOnce(JSON.stringify({ maxIgnoreBeforeSuggestion: 25 })); // getActionPreferences

      await NotificationActionService.handleIgnoreAction('urgentReminder');

      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData.urgentReminder).toHaveLength(20); // Should not exceed 20
    });
  });

  describe('Action Preferences', () => {
    it('should initialize default preferences on first use', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null); // No existing preferences

      await NotificationActionService.ensureDefaultActionPreferences();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'notificationActionPreferences',
        expect.stringContaining('showQuickActions')
      );
    });

    it('should update specific preferences', async () => {
      const existingPrefs = {
        version: 1,
        showQuickActions: true,
        defaultAction: 'view'
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingPrefs));

      await NotificationActionService.updateActionPreference('defaultAction', 'submit');

      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData.defaultAction).toBe('submit');
      expect(savedData.updatedAt).toBeDefined();
    });
  });

  describe('Analytics and Export', () => {
    it('should provide comprehensive analytics', async () => {
      const mockStats = {
        urgentReminder: {
          submit: { count: 5 },
          view: { count: 3 }
        },
        arrivalReminder: {
          view: { count: 2 }
        }
      };
      const mockRemindLater = [
        { notificationType: 'urgentReminder', reminderTime: '2024-01-01T00:00:00.000Z' }
      ];
      const mockIgnore = {
        urgentReminder: [{ timestamp: '2024-01-01T00:00:00.000Z' }]
      };
      const mockPrefs = { version: 1, showQuickActions: true };

      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(mockStats))
        .mockResolvedValueOnce(JSON.stringify(mockRemindLater))
        .mockResolvedValueOnce(JSON.stringify(mockIgnore))
        .mockResolvedValueOnce(JSON.stringify(mockPrefs));

      const analytics = await NotificationActionService.getActionAnalytics();

      expect(analytics.summary.totalActions).toBe(10);
      expect(analytics.summary.totalRemindLater).toBe(1);
      expect(analytics.summary.totalIgnoreTypes).toBe(1);
      expect(analytics.summary.mostUsedActions.urgentReminder.actionId).toBe('submit');
    });

    it('should export action data with metadata', async () => {
      // Mock analytics data
      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify({}))
        .mockResolvedValueOnce(JSON.stringify([]))
        .mockResolvedValueOnce(JSON.stringify({}))
        .mockResolvedValueOnce(JSON.stringify({ version: 1 }));

      const exportData = await NotificationActionService.exportActionData();

      expect(exportData).toHaveProperty('exportedAt');
      expect(exportData).toHaveProperty('version', 1);
      expect(exportData).toHaveProperty('stats');
      expect(exportData).toHaveProperty('summary');
    });

    it('should reset all action data', async () => {
      await NotificationActionService.resetActionData();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'notificationActionStats',
        'remindLaterActions',
        'notificationIgnoreActions',
        'pendingActionFeedback'
      ]);
    });
  });

  describe('Remind Later Optimization', () => {
    it('should suggest optimal remind later duration based on patterns', async () => {
      const remindLaterActions = [
        {
          notificationType: 'urgentReminder',
          reminderTime: '2024-01-01T10:00:00.000Z',
          actionTaken: { timestamp: '2024-01-01T10:30:00.000Z' } // 30 minutes later
        },
        {
          notificationType: 'urgentReminder',
          reminderTime: '2024-01-02T10:00:00.000Z',
          actionTaken: { timestamp: '2024-01-02T10:45:00.000Z' } // 45 minutes later
        },
        {
          notificationType: 'urgentReminder',
          reminderTime: '2024-01-03T10:00:00.000Z',
          actionTaken: { timestamp: '2024-01-03T10:40:00.000Z' } // 40 minutes later
        }
      ];

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(remindLaterActions));

      await NotificationActionService.learnRemindLaterPatterns('urgentReminder', { count: 5 });

      // Should suggest ~38 minutes (average of 30, 45, 40)
      expect(NotificationService.scheduleNotification).toHaveBeenCalledWith(
        'Optimize Remind Later',
        expect.stringContaining('38 minutes'),
        expect.any(Date),
        expect.objectContaining({
          type: 'remindLaterOptimization',
          suggestedDuration: 38
        }),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const stats = await NotificationActionService.getActionStats();
      expect(stats).toEqual({});
    });

    it('should handle malformed data gracefully', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce('invalid json');

      const preferences = await NotificationActionService.getActionPreferences();
      expect(preferences).toEqual({});
    });
  });
});