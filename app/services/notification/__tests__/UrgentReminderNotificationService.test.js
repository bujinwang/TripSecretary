/**
 * Tests for UrgentReminderNotificationService
 * 
 * Requirements: 16.2, 16.3
 */

// Mock expo-notifications first
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  AndroidImportance: {
    DEFAULT: 'default',
    HIGH: 'high',
    LOW: 'low'
  }
}));

// Mock react-native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios'
  }
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock other dependencies
jest.mock('../NotificationService');
jest.mock('../NotificationTemplateService');
jest.mock('../../entryPack/EntryPackService');

import UrgentReminderNotificationService from '../UrgentReminderNotificationService';
import NotificationService from '../NotificationService';
import NotificationTemplateService from '../NotificationTemplateService';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('UrgentReminderNotificationService', () => {
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
    NotificationTemplateService.scheduleUrgentReminderNotification.mockResolvedValue('notification-123');
  });

  describe('scheduleUrgentReminder', () => {
    it('should schedule urgent reminder 24 hours before arrival', async () => {
      const userId = 'user123';
      const entryPackId = 'pack456';
      const arrivalDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const destination = 'Thailand';

      const notificationId = await UrgentReminderNotificationService.scheduleUrgentReminder(
        userId,
        entryPackId,
        arrivalDate,
        destination
      );

      expect(notificationId).toBe('notification-123');
      expect(NotificationTemplateService.scheduleUrgentReminderNotification).toHaveBeenCalledWith(
        arrivalDate,
        destination,
        expect.objectContaining({
          urgent: true,
          data: expect.objectContaining({
            userId,
            entryPackId,
            destination,
            arrivalDate: arrivalDate.toISOString(),
            deepLink: 'thailand/travelInfo',
            notificationType: 'urgentReminder'
          })
        })
      );
    });

    it('should not schedule if arrival date is in the past', async () => {
      const userId = 'user123';
      const entryPackId = 'pack456';
      const pastDate = new Date('2020-01-01T10:00:00Z');

      const notificationId = await UrgentReminderNotificationService.scheduleUrgentReminder(
        userId,
        entryPackId,
        pastDate
      );

      expect(notificationId).toBeNull();
      expect(NotificationTemplateService.scheduleUrgentReminderNotification).not.toHaveBeenCalled();
    });

    it('should not schedule if reminder time is in the past', async () => {
      const userId = 'user123';
      const entryPackId = 'pack456';
      // Set arrival date to 12 hours from now (reminder would be in the past)
      const nearFutureDate = new Date(Date.now() + 12 * 60 * 60 * 1000);

      const notificationId = await UrgentReminderNotificationService.scheduleUrgentReminder(
        userId,
        entryPackId,
        nearFutureDate
      );

      expect(notificationId).toBeNull();
      expect(NotificationTemplateService.scheduleUrgentReminderNotification).not.toHaveBeenCalled();
    });

    it('should not schedule if notification already exists', async () => {
      const userId = 'user123';
      const entryPackId = 'pack456';
      const arrivalDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      // Mock existing notification
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [entryPackId]: {
          notificationId: 'existing-123',
          status: 'scheduled'
        }
      }));

      const notificationId = await UrgentReminderNotificationService.scheduleUrgentReminder(
        userId,
        entryPackId,
        arrivalDate
      );

      expect(notificationId).toBe('existing-123');
      expect(NotificationTemplateService.scheduleUrgentReminderNotification).not.toHaveBeenCalled();
    });

    it('should store notification metadata after scheduling', async () => {
      const userId = 'user123';
      const entryPackId = 'pack456';
      const arrivalDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      await UrgentReminderNotificationService.scheduleUrgentReminder(
        userId,
        entryPackId,
        arrivalDate
      );

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'urgentReminderNotifications',
        expect.stringContaining(entryPackId)
      );
    });
  });

  describe('cancelUrgentReminder', () => {
    it('should cancel existing urgent reminder', async () => {
      const entryPackId = 'pack456';

      // Mock existing notification
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [entryPackId]: {
          notificationId: 'notification-123',
          status: 'scheduled'
        }
      }));

      const result = await UrgentReminderNotificationService.cancelUrgentReminder(entryPackId);

      expect(result).toBe(true);
      expect(NotificationService.cancelNotification).toHaveBeenCalledWith('notification-123');
    });

    it('should return false if no notification exists', async () => {
      const entryPackId = 'pack456';

      const result = await UrgentReminderNotificationService.cancelUrgentReminder(entryPackId);

      expect(result).toBe(false);
      expect(NotificationService.cancelNotification).not.toHaveBeenCalled();
    });
  });

  describe('handleArrivalDateChange', () => {
    it('should cancel old and schedule new urgent reminder', async () => {
      const userId = 'user123';
      const entryPackId = 'pack456';
      const oldDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
      const newDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      // Mock existing notification for first call (cancel)
      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify({
          [entryPackId]: {
            notificationId: 'old-notification-123',
            status: 'scheduled'
          }
        }))
        // Mock no existing notification for second call (schedule)
        .mockResolvedValueOnce(null);

      const result = await UrgentReminderNotificationService.handleArrivalDateChange(
        userId,
        entryPackId,
        newDate,
        oldDate
      );

      expect(NotificationService.cancelNotification).toHaveBeenCalledWith('old-notification-123');
      expect(NotificationTemplateService.scheduleUrgentReminderNotification).toHaveBeenCalled();
      expect(result).toBe('notification-123');
    });

    it('should only cancel if new date is null', async () => {
      const userId = 'user123';
      const entryPackId = 'pack456';
      const oldDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
      const newDate = null;

      // Mock existing notification
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [entryPackId]: {
          notificationId: 'old-notification-123',
          status: 'scheduled'
        }
      }));

      const result = await UrgentReminderNotificationService.handleArrivalDateChange(
        userId,
        entryPackId,
        newDate,
        oldDate
      );

      expect(NotificationService.cancelNotification).toHaveBeenCalledWith('old-notification-123');
      expect(NotificationTemplateService.scheduleUrgentReminderNotification).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('autoCancelIfSubmitted', () => {
    it('should cancel urgent reminder if TDAC submitted', async () => {
      const entryPackId = 'pack456';
      const tdacSubmission = {
        arrCardNo: 'TDAC123456',
        submittedAt: new Date().toISOString()
      };

      // Mock existing notification
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [entryPackId]: {
          notificationId: 'notification-123',
          status: 'scheduled'
        }
      }));

      const result = await UrgentReminderNotificationService.autoCancelIfSubmitted(
        entryPackId,
        tdacSubmission
      );

      expect(result).toBe(true);
      expect(NotificationService.cancelNotification).toHaveBeenCalledWith('notification-123');
    });

    it('should not cancel if no valid TDAC submission', async () => {
      const entryPackId = 'pack456';
      const invalidSubmission = { submittedAt: new Date().toISOString() }; // No arrCardNo

      const result = await UrgentReminderNotificationService.autoCancelIfSubmitted(
        entryPackId,
        invalidSubmission
      );

      expect(result).toBe(false);
      expect(NotificationService.cancelNotification).not.toHaveBeenCalled();
    });

    it('should not cancel if no notification exists', async () => {
      const entryPackId = 'pack456';
      const tdacSubmission = {
        arrCardNo: 'TDAC123456',
        submittedAt: new Date().toISOString()
      };

      const result = await UrgentReminderNotificationService.autoCancelIfSubmitted(
        entryPackId,
        tdacSubmission
      );

      expect(result).toBe(false);
      expect(NotificationService.cancelNotification).not.toHaveBeenCalled();
    });
  });

  describe('checkFrequencyControl', () => {
    it('should allow notification if none sent before', async () => {
      const entryPackId = 'pack456';

      const canSend = await UrgentReminderNotificationService.checkFrequencyControl(entryPackId);

      expect(canSend).toBe(true);
    });

    it('should prevent notification if sent within minimum interval', async () => {
      const entryPackId = 'pack456';
      const recentTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [entryPackId]: recentTime.toISOString()
      }));

      const canSend = await UrgentReminderNotificationService.checkFrequencyControl(entryPackId);

      expect(canSend).toBe(false);
    });

    it('should allow notification if sent beyond minimum interval', async () => {
      const entryPackId = 'pack456';
      const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [entryPackId]: oldTime.toISOString()
      }));

      const canSend = await UrgentReminderNotificationService.checkFrequencyControl(entryPackId);

      expect(canSend).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      const mockNotifications = {
        'pack1': { status: 'scheduled' },
        'pack2': { status: 'cancelled' },
        'pack3': { status: 'expired' },
        'pack4': { status: 'scheduled' }
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockNotifications));

      const stats = await UrgentReminderNotificationService.getStats();

      expect(stats).toEqual({
        total: 4,
        scheduled: 2,
        cancelled: 1,
        expired: 1,
        sent: 0
      });
    });

    it('should return empty stats if no notifications', async () => {
      const stats = await UrgentReminderNotificationService.getStats();

      expect(stats).toEqual({
        total: 0,
        scheduled: 0,
        cancelled: 0,
        expired: 0,
        sent: 0
      });
    });
  });

  describe('cleanupExpiredNotifications', () => {
    it('should mark expired notifications', async () => {
      const pastTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

      const mockNotifications = {
        'pack1': {
          reminderTime: pastTime.toISOString(),
          status: 'scheduled'
        },
        'pack2': {
          reminderTime: futureTime.toISOString(),
          status: 'scheduled'
        }
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockNotifications));

      const cleanedCount = await UrgentReminderNotificationService.cleanupExpiredNotifications();

      expect(cleanedCount).toBe(1);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('isReminderScheduled', () => {
    it('should return true if reminder is scheduled', async () => {
      const entryPackId = 'pack456';

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [entryPackId]: {
          notificationId: 'notification-123',
          status: 'scheduled'
        }
      }));

      const isScheduled = await UrgentReminderNotificationService.isReminderScheduled(entryPackId);

      expect(isScheduled).toBe(true);
    });

    it('should return false if no reminder exists', async () => {
      const entryPackId = 'pack456';

      const isScheduled = await UrgentReminderNotificationService.isReminderScheduled(entryPackId);

      expect(isScheduled).toBe(false);
    });

    it('should return false if reminder is cancelled', async () => {
      const entryPackId = 'pack456';

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [entryPackId]: {
          notificationId: 'notification-123',
          status: 'cancelled'
        }
      }));

      const isScheduled = await UrgentReminderNotificationService.isReminderScheduled(entryPackId);

      expect(isScheduled).toBe(false);
    });
  });
});