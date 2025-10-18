/**
 * SupersededNotificationIntegration.test.js - Integration test for superseded notifications
 * 
 * Tests the integration between EntryPackService and NotificationCoordinator
 * for superseded notification functionality.
 * 
 * Requirements: 12.5, 12.6, 16.5
 */

// Mock expo-notifications before importing anything else
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
}));

// Mock react-native modules
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock the i18n system
jest.mock('../../../i18n/LocaleContext', () => ({
  getUserPreferredLocale: jest.fn().mockResolvedValue('en'),
}));

// Mock the models
jest.mock('../../../models/EntryPack', () => {
  return {
    default: class MockEntryPack {
      constructor(data) {
        Object.assign(this, data);
        this.id = data.id || 'test-pack-id';
        this.status = data.status || 'in_progress';
        this.displayStatus = data.displayStatus || {};
      }
      
      async save() {
        return this;
      }
      
      static async load(id) {
        return new this({ id, status: 'submitted' });
      }
    }
  };
});

jest.mock('../../../models/EntryInfo', () => {
  return {
    default: class MockEntryInfo {
      static async load(id) {
        return {
          id,
          userId: 'test-user',
          destinationId: 'th',
          status: 'ready'
        };
      }
    }
  };
});

// Mock NotificationPreferencesService
const mockNotificationPreferencesService = {
  getPreference: jest.fn().mockResolvedValue(true),
  isNotificationTypeEnabled: jest.fn().mockResolvedValue(true),
};

jest.mock('../../notification/NotificationPreferencesService', () => ({
  default: mockNotificationPreferencesService
}));

// Mock NotificationCoordinator
const mockNotificationCoordinator = {
  scheduleSupersededNotification: jest.fn().mockResolvedValue('notification-123'),
  initialize: jest.fn().mockResolvedValue(true),
};

jest.mock('../../notification/NotificationCoordinator', () => ({
  default: mockNotificationCoordinator
}));

import EntryPackService from '../EntryPackService';

describe('SupersededNotificationIntegration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('markAsSuperseded integration', () => {
    it('should schedule superseded notification when entry pack is marked as superseded', async () => {
      // Arrange
      const entryPackId = 'test-pack-123';
      const supersededOptions = {
        reason: 'Data changes detected after TDAC submission',
        metadata: {
          triggeredBy: 'data_change_detection',
          changedFields: ['passport', 'personalInfo']
        }
      };

      // Act
      await EntryPackService.markAsSuperseded(entryPackId, supersededOptions);

      // Assert
      expect(mockNotificationCoordinator.scheduleSupersededNotification).toHaveBeenCalledWith(
        'test-user', // userId from mocked EntryPack
        entryPackId,
        'Thailand', // destination display name for 'th'
        expect.objectContaining({
          reason: 'Data changes detected after TDAC submission',
          triggeredBy: 'data_change_detection',
          changedFields: ['passport', 'personalInfo'],
          timestamp: expect.any(String)
        })
      );
    });

    it('should not schedule notification when notifications are globally disabled', async () => {
      // Arrange
      mockNotificationPreferencesService.getPreference.mockImplementation((key, defaultValue) => {
        if (key === 'enabled') return Promise.resolve(false);
        return Promise.resolve(defaultValue);
      });

      const entryPackId = 'test-pack-123';

      // Act
      await EntryPackService.markAsSuperseded(entryPackId);

      // Assert
      expect(mockNotificationCoordinator.scheduleSupersededNotification).not.toHaveBeenCalled();
    });

    it('should not schedule notification when superseded notifications are disabled', async () => {
      // Arrange
      mockNotificationPreferencesService.getPreference.mockResolvedValue(true);
      mockNotificationPreferencesService.isNotificationTypeEnabled.mockImplementation((type) => {
        if (type === 'entryPackSuperseded') return Promise.resolve(false);
        return Promise.resolve(true);
      });

      const entryPackId = 'test-pack-123';

      // Act
      await EntryPackService.markAsSuperseded(entryPackId);

      // Assert
      expect(mockNotificationCoordinator.scheduleSupersededNotification).not.toHaveBeenCalled();
    });

    it('should handle notification scheduling failure gracefully', async () => {
      // Arrange
      mockNotificationCoordinator.scheduleSupersededNotification.mockRejectedValue(
        new Error('Notification scheduling failed')
      );

      const entryPackId = 'test-pack-123';

      // Act & Assert - should not throw
      await expect(EntryPackService.markAsSuperseded(entryPackId)).resolves.toBeDefined();
      
      // Verify the notification was attempted
      expect(mockNotificationCoordinator.scheduleSupersededNotification).toHaveBeenCalled();
    });

    it('should use correct destination display name', async () => {
      // Test different destination IDs
      const testCases = [
        { destinationId: 'th', expectedName: 'Thailand' },
        { destinationId: 'jp', expectedName: 'Japan' },
        { destinationId: 'sg', expectedName: 'Singapore' }
      ];

      for (const testCase of testCases) {
        // Mock EntryInfo to return different destination
        jest.doMock('../../models/EntryInfo', () => ({
          default: class MockEntryInfo {
            static async load(id) {
              return {
                id,
                userId: 'test-user',
                destinationId: testCase.destinationId,
                status: 'ready'
              };
            }
          }
        }));

        // Clear the module cache to pick up the new mock
        jest.resetModules();
        const EntryPackService = require('../EntryPackService').default;

        await EntryPackService.markAsSuperseded('test-pack-123');

        expect(mockNotificationCoordinator.scheduleSupersededNotification).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          testCase.expectedName,
          expect.any(Object)
        );

        jest.clearAllMocks();
      }
    });
  });

  describe('transitionState integration', () => {
    it('should schedule superseded notification during state transition', async () => {
      // Arrange
      const entryPackId = 'test-pack-123';
      const transitionOptions = {
        reason: 'User edited data after submission',
        metadata: {
          triggeredBy: 'user_edit',
          changedFields: ['travel']
        }
      };

      // Act
      await EntryPackService.transitionState(entryPackId, 'superseded', transitionOptions);

      // Assert
      expect(mockNotificationCoordinator.scheduleSupersededNotification).toHaveBeenCalledWith(
        'test-user',
        entryPackId,
        'Thailand',
        expect.objectContaining({
          reason: 'User edited data after submission',
          triggeredBy: 'user_edit',
          changedFields: ['travel']
        })
      );
    });
  });
});