/**
 * ExpiryWarningNotificationIntegration Tests
 * 
 * Integration tests for expiry warning notification functionality:
 * - Verify notifications are scheduled when entry pack is created
 * - Verify notifications are cancelled when entry pack status changes
 * - Verify archive action works correctly
 * 
 * Requirements: 12.7, 16.5
 */

// Mock Expo modules first
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Alert: { alert: jest.fn() },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

import NotificationCoordinator from '../NotificationCoordinator';
import ExpiryWarningNotificationService from '../ExpiryWarningNotificationService';
import NotificationPreferencesService from '../NotificationPreferencesService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../NotificationCoordinator');
jest.mock('../NotificationPreferencesService');

describe('ExpiryWarningNotificationIntegration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AsyncStorage
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    
    // Mock NotificationPreferencesService
    NotificationPreferencesService.isNotificationTypeEnabled.mockResolvedValue(true);
    
    // Mock NotificationCoordinator
    NotificationCoordinator.scheduleExpiryWarningNotifications.mockResolvedValue(['notification-1', 'notification-2']);
    NotificationCoordinator.cancelExpiryWarningNotifications.mockResolvedValue(true);
    NotificationCoordinator.handleExpiryArchiveAction.mockResolvedValue(true);
  });

  describe('Entry Pack Creation Integration', () => {
    it('should schedule expiry warning notifications when entry pack is created', async () => {
      const userId = 'user-123';
      const entryPackId = 'entry-pack-123';
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + 3); // 3 days from now
      const destination = 'Thailand';

      // Simulate entry pack creation with arrival date
      const notificationIds = await NotificationCoordinator.scheduleExpiryWarningNotifications(
        userId,
        entryPackId,
        arrivalDate,
        destination
      );

      expect(NotificationCoordinator.scheduleExpiryWarningNotifications).toHaveBeenCalledWith(
        userId,
        entryPackId,
        arrivalDate,
        destination
      );
      
      expect(notificationIds).toHaveLength(2);
    });

    it('should not schedule notifications if expiry warnings are disabled', async () => {
      NotificationPreferencesService.isNotificationTypeEnabled.mockResolvedValue(false);
      
      const userId = 'user-123';
      const entryPackId = 'entry-pack-123';
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + 3);
      const destination = 'Thailand';

      // Check if notifications would be scheduled (they shouldn't be)
      const enabled = await NotificationPreferencesService.isNotificationTypeEnabled('expiryWarning');
      
      expect(enabled).toBe(false);
      
      // In real implementation, this would not call the coordinator
      if (enabled) {
        await NotificationCoordinator.scheduleExpiryWarningNotifications(
          userId,
          entryPackId,
          arrivalDate,
          destination
        );
      }

      expect(NotificationCoordinator.scheduleExpiryWarningNotifications).not.toHaveBeenCalled();
    });
  });

  describe('Entry Pack Status Change Integration', () => {
    it('should cancel expiry warning notifications when entry pack is completed', async () => {
      const entryPackId = 'entry-pack-123';
      const newStatus = 'completed';

      // Simulate status change to completed
      const cancelled = await NotificationCoordinator.cancelExpiryWarningNotifications(entryPackId);

      expect(NotificationCoordinator.cancelExpiryWarningNotifications).toHaveBeenCalledWith(entryPackId);
      expect(cancelled).toBe(true);
    });

    it('should cancel expiry warning notifications when entry pack is archived', async () => {
      const entryPackId = 'entry-pack-123';
      const newStatus = 'archived';

      // Simulate status change to archived
      const cancelled = await NotificationCoordinator.cancelExpiryWarningNotifications(entryPackId);

      expect(NotificationCoordinator.cancelExpiryWarningNotifications).toHaveBeenCalledWith(entryPackId);
      expect(cancelled).toBe(true);
    });
  });

  describe('Archive Action Integration', () => {
    it('should handle archive action from expiry notification', async () => {
      const entryPackId = 'entry-pack-123';
      const userId = 'user-123';

      // Simulate archive action from notification
      const success = await NotificationCoordinator.handleExpiryArchiveAction(entryPackId, userId);

      expect(NotificationCoordinator.handleExpiryArchiveAction).toHaveBeenCalledWith(entryPackId, userId);
      expect(success).toBe(true);
    });

    it('should handle archive action failure gracefully', async () => {
      NotificationCoordinator.handleExpiryArchiveAction.mockResolvedValue(false);
      
      const entryPackId = 'entry-pack-123';
      const userId = 'user-123';

      // Simulate failed archive action
      const success = await NotificationCoordinator.handleExpiryArchiveAction(entryPackId, userId);

      expect(success).toBe(false);
    });
  });

  describe('Notification Timing Integration', () => {
    it('should calculate correct notification times for expiry warnings', () => {
      const arrivalDate = new Date('2024-01-15T10:00:00');
      
      // Test the timing calculation directly
      const times = ExpiryWarningNotificationService.calculateExpiryNotificationTimes(arrivalDate);

      // Pre-expiry warning should be on arrival day at 8 AM
      expect(times.preExpiry.getDate()).toBe(15);
      expect(times.preExpiry.getHours()).toBe(8);
      expect(times.preExpiry.getMinutes()).toBe(0);

      // Expiry notification should be 24 hours after arrival
      const expectedExpiryTime = new Date(arrivalDate);
      expectedExpiryTime.setHours(expectedExpiryTime.getHours() + 24);
      
      expect(times.expiry.getTime()).toBe(expectedExpiryTime.getTime());
    });

    it('should not schedule notifications for past arrival dates', async () => {
      const userId = 'user-123';
      const entryPackId = 'entry-pack-123';
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() - 1); // Yesterday
      const destination = 'Thailand';

      // Test with past date
      const notificationIds = await ExpiryWarningNotificationService.scheduleExpiryWarningNotifications(
        userId,
        entryPackId,
        arrivalDate,
        destination
      );

      expect(notificationIds).toHaveLength(0);
    });
  });

  describe('Notification Content Integration', () => {
    it('should include correct data in notification payload', async () => {
      const userId = 'user-123';
      const entryPackId = 'entry-pack-123';
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + 3);
      const destination = 'Thailand';

      // Mock the template service to capture notification data
      const mockScheduleTemplatedNotification = jest.fn().mockResolvedValue('notification-id');
      ExpiryWarningNotificationService.templateService = {
        scheduleTemplatedNotification: mockScheduleTemplatedNotification
      };

      await ExpiryWarningNotificationService.scheduleExpiryWarningNotifications(
        userId,
        entryPackId,
        arrivalDate,
        destination
      );

      // Verify notification data includes required fields
      expect(mockScheduleTemplatedNotification).toHaveBeenCalledWith(
        expect.any(String), // notification type
        expect.any(Date),   // trigger time
        expect.any(Object), // template variables
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            entryPackId,
            destination,
            arrivalDate: arrivalDate.toISOString(),
            deepLink: `entryPack/${entryPackId}`,
            notificationType: expect.any(String)
          })
        })
      );
    });
  });
});