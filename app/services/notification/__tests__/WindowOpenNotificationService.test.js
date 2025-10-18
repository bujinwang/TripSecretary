/**
 * WindowOpenNotificationService Tests
 * 
 * Tests for window open notification scheduling, cancellation, and management
 * Requirements: 16.1, 16.2
 */

import WindowOpenNotificationService from '../WindowOpenNotificationService';
import NotificationService from '../NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../NotificationService');
jest.mock('../NotificationTemplateService');
jest.mock('@react-native-async-storage/async-storage');

describe('WindowOpenNotificationService', () => {
  const mockUserId = 'user123';
  const mockEntryPackId = 'pack456';
  const mockDestination = 'Thailand';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AsyncStorage
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    
    // Mock NotificationService
    NotificationService.initialize.mockResolvedValue({ granted: true });
    NotificationService.scheduleNotification.mockResolvedValue('notification123');
    NotificationService.cancelNotification.mockResolvedValue(true);
    NotificationService.getScheduledNotifications.mockResolvedValue([]);
  });

  describe('scheduleWindowOpenNotification', () => {
    it('should schedule notification 7 days before arrival', async () => {
      const arrivalDate = new Date('2024-12-01T10:00:00Z');
      const expectedNotificationDate = new Date('2024-11-24T10:00:00Z');
      
      const notificationId = await WindowOpenNotificationService.scheduleWindowOpenNotification(
        mockUserId,
        mockEntryPackId,
        arrivalDate,
        mockDestination
      );
      
      expect(notificationId).toBe('notification123');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'windowOpenNotifications',
        expect.stringContaining(mockEntryPackId)
      );
    });

    it('should not schedule notification if arrival date is in the past', async () => {
      const pastDate = new Date('2020-01-01T10:00:00Z');
      
      const notificationId = await WindowOpenNotificationService.scheduleWindowOpenNotification(
        mockUserId,
        mockEntryPackId,
        pastDate,
        mockDestination
      );
      
      expect(notificationId).toBeNull();
      expect(NotificationService.scheduleNotification).not.toHaveBeenCalled();
    });

    it('should not schedule notification if arrival date is invalid', async () => {
      const notificationId = await WindowOpenNotificationService.scheduleWindowOpenNotification(
        mockUserId,
        mockEntryPackId,
        null,
        mockDestination
      );
      
      expect(notificationId).toBeNull();
      expect(NotificationService.scheduleNotification).not.toHaveBeenCalled();
    });

    it('should cancel existing notification before scheduling new one', async () => {
      // Mock existing notification
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [mockEntryPackId]: {
          notificationId: 'existing123',
          userId: mockUserId,
          destination: mockDestination
        }
      }));
      
      const arrivalDate = new Date('2024-12-01T10:00:00Z');
      
      await WindowOpenNotificationService.scheduleWindowOpenNotification(
        mockUserId,
        mockEntryPackId,
        arrivalDate,
        mockDestination
      );
      
      expect(NotificationService.cancelNotification).toHaveBeenCalledWith('existing123');
    });
  });

  describe('cancelWindowOpenNotification', () => {
    it('should cancel notification and remove from storage', async () => {
      // Mock existing notification
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [mockEntryPackId]: {
          notificationId: 'notification123',
          userId: mockUserId,
          destination: mockDestination
        }
      }));
      
      const cancelled = await WindowOpenNotificationService.cancelWindowOpenNotification(mockEntryPackId);
      
      expect(cancelled).toBe(true);
      expect(NotificationService.cancelNotification).toHaveBeenCalledWith('notification123');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'windowOpenNotifications',
        '{}'
      );
    });

    it('should return false if no notification found', async () => {
      const cancelled = await WindowOpenNotificationService.cancelWindowOpenNotification(mockEntryPackId);
      
      expect(cancelled).toBe(false);
      expect(NotificationService.cancelNotification).not.toHaveBeenCalled();
    });
  });

  describe('handleArrivalDateChange', () => {
    it('should cancel old notification and schedule new one', async () => {
      const oldDate = new Date('2024-11-01T10:00:00Z');
      const newDate = new Date('2024-12-01T10:00:00Z');
      
      // Mock existing notification
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [mockEntryPackId]: {
          notificationId: 'old123',
          userId: mockUserId,
          destination: mockDestination
        }
      }));
      
      const newNotificationId = await WindowOpenNotificationService.handleArrivalDateChange(
        mockUserId,
        mockEntryPackId,
        newDate,
        oldDate,
        mockDestination
      );
      
      expect(NotificationService.cancelNotification).toHaveBeenCalledWith('old123');
      expect(newNotificationId).toBe('notification123');
    });

    it('should only cancel if new date is null', async () => {
      const oldDate = new Date('2024-11-01T10:00:00Z');
      
      // Mock existing notification
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [mockEntryPackId]: {
          notificationId: 'old123',
          userId: mockUserId,
          destination: mockDestination
        }
      }));
      
      const result = await WindowOpenNotificationService.handleArrivalDateChange(
        mockUserId,
        mockEntryPackId,
        null,
        oldDate,
        mockDestination
      );
      
      expect(NotificationService.cancelNotification).toHaveBeenCalledWith('old123');
      expect(result).toBeNull();
    });
  });

  describe('autoCancelIfSubmitted', () => {
    it('should cancel notification if valid TDAC submission provided', async () => {
      const tdacSubmission = {
        arrCardNo: 'TDAC123456',
        qrUri: 'data:image/png;base64,abc123',
        submittedAt: new Date().toISOString()
      };
      
      // Mock existing notification
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [mockEntryPackId]: {
          notificationId: 'notification123',
          userId: mockUserId,
          destination: mockDestination
        }
      }));
      
      const cancelled = await WindowOpenNotificationService.autoCancelIfSubmitted(
        mockEntryPackId,
        tdacSubmission
      );
      
      expect(cancelled).toBe(true);
      expect(NotificationService.cancelNotification).toHaveBeenCalledWith('notification123');
    });

    it('should not cancel if TDAC submission is invalid', async () => {
      const invalidSubmission = {
        qrUri: 'data:image/png;base64,abc123'
        // Missing arrCardNo
      };
      
      const cancelled = await WindowOpenNotificationService.autoCancelIfSubmitted(
        mockEntryPackId,
        invalidSubmission
      );
      
      expect(cancelled).toBe(false);
      expect(NotificationService.cancelNotification).not.toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredNotifications', () => {
    it('should clean up notifications for past arrival dates', async () => {
      const pastDate = new Date('2020-01-01T10:00:00Z');
      const futureDate = new Date('2025-01-01T10:00:00Z');
      
      // Mock notifications with mixed dates
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        'pack1': {
          notificationId: 'notification1',
          arrivalDate: pastDate.toISOString(),
          userId: mockUserId
        },
        'pack2': {
          notificationId: 'notification2',
          arrivalDate: futureDate.toISOString(),
          userId: mockUserId
        }
      }));
      
      const cleanedCount = await WindowOpenNotificationService.cleanupExpiredNotifications();
      
      expect(cleanedCount).toBe(1);
      expect(NotificationService.cancelNotification).toHaveBeenCalledWith('notification1');
      expect(NotificationService.cancelNotification).not.toHaveBeenCalledWith('notification2');
    });
  });

  describe('getScheduledNotificationsForUser', () => {
    it('should return user notifications sorted by arrival date', async () => {
      const date1 = new Date('2024-12-01T10:00:00Z');
      const date2 = new Date('2024-11-01T10:00:00Z');
      
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        'pack1': {
          notificationId: 'notification1',
          arrivalDate: date1.toISOString(),
          userId: mockUserId,
          destination: 'Thailand'
        },
        'pack2': {
          notificationId: 'notification2',
          arrivalDate: date2.toISOString(),
          userId: mockUserId,
          destination: 'Thailand'
        },
        'pack3': {
          notificationId: 'notification3',
          arrivalDate: date1.toISOString(),
          userId: 'otherUser',
          destination: 'Thailand'
        }
      }));
      
      const notifications = await WindowOpenNotificationService.getScheduledNotificationsForUser(mockUserId);
      
      expect(notifications).toHaveLength(2);
      expect(notifications[0].entryPackId).toBe('pack2'); // Earlier date first
      expect(notifications[1].entryPackId).toBe('pack1');
    });
  });

  describe('validateNotificationConsistency', () => {
    it('should detect inconsistencies between stored and system notifications', async () => {
      // Mock stored notifications
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        'pack1': {
          notificationId: 'notification1',
          userId: mockUserId
        },
        'pack2': {
          notificationId: 'notification2',
          userId: mockUserId
        }
      }));
      
      // Mock system notifications (missing notification2)
      NotificationService.getScheduledNotifications.mockResolvedValue([
        { identifier: 'notification1', trigger: { date: new Date() } }
      ]);
      
      const validation = await WindowOpenNotificationService.validateNotificationConsistency();
      
      expect(validation.isConsistent).toBe(false);
      expect(validation.inconsistencies).toHaveLength(1);
      expect(validation.inconsistencies[0].entryPackId).toBe('pack2');
      expect(validation.validNotifications).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should return service statistics', async () => {
      const futureDate = new Date('2025-01-01T10:00:00Z');
      const pastDate = new Date('2020-01-01T10:00:00Z');
      
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        'pack1': {
          notificationId: 'notification1',
          arrivalDate: futureDate.toISOString(),
          userId: mockUserId
        },
        'pack2': {
          notificationId: 'notification2',
          arrivalDate: pastDate.toISOString(),
          userId: mockUserId
        }
      }));
      
      const stats = await WindowOpenNotificationService.getStats();
      
      expect(stats.totalScheduled).toBe(2);
      expect(stats.activeNotifications).toBe(1);
      expect(stats.expiredNotifications).toBe(1);
      expect(stats.storageKey).toBe('windowOpenNotifications');
    });
  });
});