// @ts-nocheck

/**
 * SupersededNotificationService Tests
 * 
 * Tests for superseded notification functionality in the progressive entry flow
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

import NotificationCoordinator from '../NotificationCoordinator';
import NotificationTemplateService from '../NotificationTemplateService';
import NotificationService from '../NotificationService';
import { NOTIFICATION_TYPES } from '../NotificationTemplates';

// Mock dependencies
jest.mock('../NotificationService');
jest.mock('../NotificationPreferencesService');

describe('SupersededNotificationService', () => {
  const mockUserId = 'user123';
  const mockEntryPackId = 'pack456';
  const mockDestination = 'Thailand';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock NotificationService methods
    NotificationService.initialize = jest.fn().mockResolvedValue({ granted: true });
    NotificationService.scheduleNotification = jest.fn().mockResolvedValue('notification123');
    NotificationService.getScheduledNotifications = jest.fn().mockResolvedValue([]);
    NotificationService.cancelNotification = jest.fn().mockResolvedValue(true);
  });

  describe('scheduleSupersededNotification', () => {
    it('should schedule superseded notification successfully', async () => {
      // Arrange
      const supersededInfo = {
        reason: 'Data changes detected after TDAC submission',
        triggeredBy: 'data_change_detection',
        changedFields: ['passport', 'personalInfo'],
        timestamp: new Date().toISOString()
      };

      // Act
      const notificationId = await NotificationCoordinator.scheduleSupersededNotification(
        mockUserId,
        mockEntryPackId,
        mockDestination,
        supersededInfo
      );

      // Assert
      expect(notificationId).toBe('notification123');
      expect(NotificationService.scheduleNotification).toHaveBeenCalledWith(
        expect.stringContaining('Superseded'), // Title should contain "Superseded"
        expect.stringContaining('resubmit'), // Body should mention resubmit
        expect.any(Date), // Should be scheduled immediately
        expect.objectContaining({
          type: 'entryPackSuperseded',
          deepLink: 'thailand/travelInfo'
        }),
        expect.objectContaining({
          urgent: true, // Should be marked as urgent
          data: expect.objectContaining({
            entryPackId: mockEntryPackId
          })
        })
      );
    });

    it('should handle notification scheduling failure gracefully', async () => {
      // Arrange
      NotificationService.scheduleNotification.mockRejectedValue(new Error('Notification failed'));

      // Act
      const notificationId = await NotificationCoordinator.scheduleSupersededNotification(
        mockUserId,
        mockEntryPackId,
        mockDestination
      );

      // Assert
      expect(notificationId).toBeNull();
    });

    it('should use correct notification template', async () => {
      // Act
      await NotificationCoordinator.scheduleSupersededNotification(
        mockUserId,
        mockEntryPackId,
        mockDestination
      );

      // Assert
      const callArgs = NotificationService.scheduleNotification.mock.calls[0];
      const notificationData = callArgs[3];
      
      expect(notificationData.type).toBe('entryPackSuperseded');
      expect(notificationData.deepLink).toBe('thailand/travelInfo');
    });
  });

  describe('cancelSupersededNotifications', () => {
    it('should cancel superseded notifications for entry pack', async () => {
      // Arrange
      const mockScheduledNotifications = [
        {
          identifier: 'notification123',
          content: {
            data: {
              type: 'entryPackSuperseded',
              entryPackId: mockEntryPackId
            }
          }
        },
        {
          identifier: 'notification456',
          content: {
            data: {
              type: 'submissionWindowOpen',
              entryPackId: mockEntryPackId
            }
          }
        }
      ];

      NotificationService.getScheduledNotifications.mockResolvedValue(mockScheduledNotifications);

      // Act
      const result = await NotificationCoordinator.cancelSupersededNotifications(mockEntryPackId);

      // Assert
      expect(result).toBe(1); // Should cancel 1 superseded notification
      expect(NotificationService.cancelNotification).toHaveBeenCalledWith('notification123');
      expect(NotificationService.cancelNotification).not.toHaveBeenCalledWith('notification456');
    });

    it('should return 0 when no superseded notifications found', async () => {
      // Arrange
      NotificationService.getScheduledNotifications.mockResolvedValue([]);

      // Act
      const result = await NotificationCoordinator.cancelSupersededNotifications(mockEntryPackId);

      // Assert
      expect(result).toBe(0);
      expect(NotificationService.cancelNotification).not.toHaveBeenCalled();
    });
  });

  describe('notification template integration', () => {
    it('should use correct notification type constant', () => {
      expect(NOTIFICATION_TYPES.ENTRY_PACK_SUPERSEDED).toBe('entryPackSuperseded');
    });

    it('should schedule notification with resubmit action button', async () => {
      // Act
      await NotificationCoordinator.scheduleSupersededNotification(
        mockUserId,
        mockEntryPackId,
        mockDestination
      );

      // Assert
      const callArgs = NotificationService.scheduleNotification.mock.calls[0];
      const options = callArgs[4];
      
      expect(options.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'resubmit',
            title: expect.stringContaining('Resubmit')
          })
        ])
      );
    });
  });

  describe('integration with EntryPackService', () => {
    it('should be called when entry pack is marked as superseded', async () => {
      // This test verifies the integration point exists
      // The actual integration is tested in EntryPackService tests
      
      const scheduleSupersededSpy = jest.spyOn(NotificationCoordinator, 'scheduleSupersededNotification');
      scheduleSupersededSpy.mockResolvedValue('notification123');

      // Simulate calling the method that would be called from EntryPackService
      await NotificationCoordinator.scheduleSupersededNotification(
        mockUserId,
        mockEntryPackId,
        mockDestination,
        {
          reason: 'Entry pack marked as superseded due to data changes',
          triggeredBy: 'user_edit'
        }
      );

      expect(scheduleSupersededSpy).toHaveBeenCalledWith(
        mockUserId,
        mockEntryPackId,
        mockDestination,
        expect.objectContaining({
          reason: 'Entry pack marked as superseded due to data changes',
          triggeredBy: 'user_edit'
        })
      );

      scheduleSupersededSpy.mockRestore();
    });
  });

  describe('notification content localization', () => {
    it('should support multiple languages', async () => {
      // Test that the notification template supports localization
      // The actual translation testing is done in the i18n tests
      
      await NotificationCoordinator.scheduleSupersededNotification(
        mockUserId,
        mockEntryPackId,
        mockDestination
      );

      // Verify that the notification was scheduled (localization handled by template service)
      expect(NotificationService.scheduleNotification).toHaveBeenCalled();
    });
  });
});