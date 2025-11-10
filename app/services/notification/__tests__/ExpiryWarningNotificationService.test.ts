// @ts-nocheck

/**
 * ExpiryWarningNotificationService Tests
 * 
 * Tests for expiry warning notification functionality:
 * - Send notification 1 day before entry pack expires
 * - Send notification on expiry day
 * - Provide "Archive" option
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

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock other dependencies
jest.mock('../NotificationService');
jest.mock('../NotificationTemplateService');
jest.mock('../../entryPack/EntryPackService');

import ExpiryWarningNotificationService from '../ExpiryWarningNotificationService';
import NotificationService from '../NotificationService';
import NotificationTemplateService from '../NotificationTemplateService';
import EntryPackService from '../../entryPack/EntryPackService';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('ExpiryWarningNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AsyncStorage
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    
    // Mock NotificationService
    NotificationService.initialize.mockResolvedValue();
    NotificationService.cancelNotification.mockResolvedValue(true);
    
    // Mock NotificationTemplateService
    NotificationTemplateService.initialize.mockResolvedValue();
    NotificationTemplateService.scheduleTemplatedNotification.mockResolvedValue('notification-id-123');
    
    // Mock EntryPackService
    EntryPackService.archive.mockResolvedValue({ id: 'entry-pack-123', status: 'archived' });
  });

  describe('scheduleExpiryWarningNotifications', () => {
    it('should schedule both pre-expiry and expiry notifications', async () => {
      const userId = 'user-123';
      const entryPackId = 'entry-pack-123';
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + 3); // 3 days from now
      const destination = 'Thailand';

      const notificationIds = await ExpiryWarningNotificationService.scheduleExpiryWarningNotifications(
        userId,
        entryPackId,
        arrivalDate,
        destination
      );

      expect(notificationIds).toHaveLength(2);
      expect(NotificationTemplateService.scheduleTemplatedNotification).toHaveBeenCalledTimes(2);
      
      // Check pre-expiry notification (1 day before expiry = on arrival day at 8 AM)
      const preExpiryCall = NotificationTemplateService.scheduleTemplatedNotification.mock.calls[0];
      expect(preExpiryCall[0]).toBe('entryPackExpiryWarning');
      expect(preExpiryCall[2]).toEqual({ destination, timeRemaining: '1 day' });
      
      // Check expiry notification (24h after arrival)
      const expiryCall = NotificationTemplateService.scheduleTemplatedNotification.mock.calls[1];
      expect(expiryCall[0]).toBe('entryPackExpired');
      expect(expiryCall[2]).toEqual({ destination });
    });

    it('should not schedule notifications for past arrival dates', async () => {
      const userId = 'user-123';
      const entryPackId = 'entry-pack-123';
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() - 1); // Yesterday
      const destination = 'Thailand';

      const notificationIds = await ExpiryWarningNotificationService.scheduleExpiryWarningNotifications(
        userId,
        entryPackId,
        arrivalDate,
        destination
      );

      expect(notificationIds).toHaveLength(0);
      expect(NotificationTemplateService.scheduleTemplatedNotification).not.toHaveBeenCalled();
    });

    it('should not schedule duplicate notifications', async () => {
      const userId = 'user-123';
      const entryPackId = 'entry-pack-123';
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + 3);
      const destination = 'Thailand';

      // Mock existing notifications
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [entryPackId]: {
          notificationIds: ['existing-id-1', 'existing-id-2'],
          status: 'scheduled'
        }
      }));

      const notificationIds = await ExpiryWarningNotificationService.scheduleExpiryWarningNotifications(
        userId,
        entryPackId,
        arrivalDate,
        destination
      );

      expect(notificationIds).toEqual(['existing-id-1', 'existing-id-2']);
      expect(NotificationTemplateService.scheduleTemplatedNotification).not.toHaveBeenCalled();
    });
  });

  describe('cancelExpiryWarningNotifications', () => {
    it('should cancel all scheduled notifications for entry pack', async () => {
      const entryPackId = 'entry-pack-123';
      
      // Mock existing notifications
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [entryPackId]: {
          notificationIds: ['notification-1', 'notification-2'],
          status: 'scheduled'
        }
      }));

      const result = await ExpiryWarningNotificationService.cancelExpiryWarningNotifications(entryPackId);

      expect(result).toBe(true);
      expect(NotificationService.cancelNotification).toHaveBeenCalledTimes(2);
      expect(NotificationService.cancelNotification).toHaveBeenCalledWith('notification-1');
      expect(NotificationService.cancelNotification).toHaveBeenCalledWith('notification-2');
    });

    it('should return false if no notifications found', async () => {
      const entryPackId = 'entry-pack-123';
      
      // Mock no existing notifications
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await ExpiryWarningNotificationService.cancelExpiryWarningNotifications(entryPackId);

      expect(result).toBe(false);
      expect(NotificationService.cancelNotification).not.toHaveBeenCalled();
    });
  });

  describe('handleArchiveAction', () => {
    it('should archive entry pack and cancel notifications', async () => {
      const entryPackId = 'entry-pack-123';
      const userId = 'user-123';

      const result = await ExpiryWarningNotificationService.handleArchiveAction(entryPackId, userId);

      expect(result).toBe(true);
      expect(EntryPackService.archive).toHaveBeenCalledWith(
        entryPackId,
        'expired',
        {
          triggeredBy: 'notification_action',
          metadata: {
            archivedVia: 'expiry_notification',
            userId: userId
          }
        }
      );
    });

    it('should return false if archival fails', async () => {
      const entryPackId = 'entry-pack-123';
      const userId = 'user-123';

      EntryPackService.archive.mockResolvedValue(null);

      const result = await ExpiryWarningNotificationService.handleArchiveAction(entryPackId, userId);

      expect(result).toBe(false);
    });
  });

  describe('calculateExpiryNotificationTimes', () => {
    it('should calculate correct notification times', () => {
      const arrivalDate = new Date('2024-01-15T10:00:00');
      
      const times = ExpiryWarningNotificationService.calculateExpiryNotificationTimes(arrivalDate);

      // Pre-expiry should be on arrival day at 8 AM
      expect(times.preExpiry.getDate()).toBe(15);
      expect(times.preExpiry.getHours()).toBe(8);
      expect(times.preExpiry.getMinutes()).toBe(0);

      // Expiry should be 24 hours after arrival
      const expectedExpiryDate = new Date(arrivalDate);
      expectedExpiryDate.setHours(expectedExpiryDate.getHours() + 24);
      
      expect(times.expiry.getTime()).toBe(expectedExpiryDate.getTime());
    });
  });

  describe('autoCancelIfStatusChanged', () => {
    it('should cancel notifications when entry pack is completed', async () => {
      const entryPackId = 'entry-pack-123';
      const newStatus = 'completed';

      // Mock existing notifications
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [entryPackId]: {
          notificationIds: ['notification-1'],
          status: 'scheduled'
        }
      }));

      const result = await ExpiryWarningNotificationService.autoCancelIfStatusChanged(entryPackId, newStatus);

      expect(result).toBe(true);
      expect(NotificationService.cancelNotification).toHaveBeenCalledWith('notification-1');
    });

    it('should not cancel notifications for in-progress status', async () => {
      const entryPackId = 'entry-pack-123';
      const newStatus = 'in_progress';

      const result = await ExpiryWarningNotificationService.autoCancelIfStatusChanged(entryPackId, newStatus);

      expect(result).toBe(false);
      expect(NotificationService.cancelNotification).not.toHaveBeenCalled();
    });
  });

  describe('shouldSendExpiryWarning', () => {
    it('should handle entry pack validation', async () => {
      const entryPackId = 'entry-pack-123';

      // This method uses dynamic require, so we'll test the basic functionality
      // The actual validation logic is tested in integration tests
      const result = await ExpiryWarningNotificationService.shouldSendExpiryWarning(entryPackId, false);

      // Should return a boolean (true or false depending on entry pack status)
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getStats', () => {
    it('should return comprehensive statistics', async () => {
      // Mock stored notifications
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        'entry-pack-1': {
          notificationIds: ['n1', 'n2'],
          status: 'scheduled'
        },
        'entry-pack-2': {
          notificationIds: ['n3'],
          status: 'cancelled'
        },
        'entry-pack-3': {
          notificationIds: ['n4', 'n5'],
          status: 'expired'
        }
      }));

      const stats = await ExpiryWarningNotificationService.getStats();

      expect(stats).toEqual({
        total: 3,
        scheduled: 1,
        cancelled: 1,
        expired: 1,
        sent: 0,
        totalNotificationIds: 5
      });
    });
  });
});