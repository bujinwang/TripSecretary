// @ts-nocheck

/**
 * DeadlineNotificationService Tests
 * 
 * Tests for deadline notification functionality:
 * - Send notification on arrival day if not submitted
 * - Repeat reminder every 4 hours (maximum 3 times)
 * - Provide "Remind Later" and "Submit Now" options
 * 
 * Requirements: 16.2, 16.3
 */

import DeadlineNotificationService from '../DeadlineNotificationService';
import NotificationTemplateService from '../NotificationTemplateService';
import EntryPackService from '../../entryPack/EntryPackService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../NotificationTemplateService');
jest.mock('../../entryPack/EntryPackService');
jest.mock('@react-native-async-storage/async-storage');

describe('DeadlineNotificationService', () => {
  const mockUserId = 'user123';
  const mockEntryPackId = 'pack456';
  const mockDestination = 'Thailand';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AsyncStorage
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    
    // Mock NotificationTemplateService
    NotificationTemplateService.initialize.mockResolvedValue();
    NotificationTemplateService.scheduleTemplatedNotification.mockResolvedValue('notification-123');
    
    // Mock EntryPackService
    EntryPackService.getEntryPack.mockResolvedValue({
      id: mockEntryPackId,
      userId: mockUserId,
      arrivalDate: '2024-12-01T10:00:00Z',
      tdacSubmission: null
    });
  });

  describe('scheduleDeadlineNotification', () => {
    it('should schedule deadline notifications for arrival day', async () => {
      const arrivalDate = new Date('2024-12-01T10:00:00Z');
      
      const notificationIds = await DeadlineNotificationService.scheduleDeadlineNotification(
        mockUserId,
        mockEntryPackId,
        arrivalDate,
        mockDestination
      );

      expect(notificationIds).toHaveLength(4); // Initial + 3 repeats
      expect(NotificationTemplateService.scheduleTemplatedNotification).toHaveBeenCalledTimes(4);
      
      // Check first notification is scheduled for 8 AM on arrival day
      const firstCall = NotificationTemplateService.scheduleTemplatedNotification.mock.calls[0];
      const firstNotificationTime = firstCall[1];
      expect(firstNotificationTime.getHours()).toBe(8);
      expect(firstNotificationTime.toDateString()).toBe(arrivalDate.toDateString());
    });

    it('should not schedule notifications for past arrival dates', async () => {
      const pastDate = new Date('2020-01-01T10:00:00Z');
      
      const notificationIds = await DeadlineNotificationService.scheduleDeadlineNotification(
        mockUserId,
        mockEntryPackId,
        pastDate,
        mockDestination
      );

      expect(notificationIds).toHaveLength(0);
      expect(NotificationTemplateService.scheduleTemplatedNotification).not.toHaveBeenCalled();
    });

    it('should not schedule duplicate notifications', async () => {
      const arrivalDate = new Date('2024-12-01T10:00:00Z');
      
      // Mock existing notification
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [mockEntryPackId]: {
          notificationIds: ['existing-123'],
          status: 'scheduled'
        }
      }));
      
      const notificationIds = await DeadlineNotificationService.scheduleDeadlineNotification(
        mockUserId,
        mockEntryPackId,
        arrivalDate,
        mockDestination
      );

      expect(notificationIds).toEqual(['existing-123']);
      expect(NotificationTemplateService.scheduleTemplatedNotification).not.toHaveBeenCalled();
    });
  });

  describe('calculateNotificationTimes', () => {
    it('should calculate correct notification times', async () => {
      const arrivalDate = new Date('2024-12-01T10:00:00Z');
      
      const times = DeadlineNotificationService.calculateNotificationTimes(arrivalDate);
      
      expect(times).toHaveLength(4);
      
      // First notification: 8 AM on arrival day
      expect(times[0].getHours()).toBe(8);
      expect(times[0].toDateString()).toBe(arrivalDate.toDateString());
      
      // Subsequent notifications: every 4 hours
      expect(times[1].getHours()).toBe(12); // 12 PM
      expect(times[2].getHours()).toBe(16); // 4 PM
      expect(times[3].getHours()).toBe(20); // 8 PM
    });
  });

  describe('shouldSendDeadlineNotification', () => {
    it('should return true for unsubmitted entry pack on arrival day', async () => {
      // Mock entry pack without TDAC submission
      EntryPackService.getEntryPack.mockResolvedValue({
        id: mockEntryPackId,
        arrivalDate: new Date().toISOString(), // Today
        tdacSubmission: null
      });
      
      const shouldSend = await DeadlineNotificationService.shouldSendDeadlineNotification(mockEntryPackId);
      
      expect(shouldSend).toBe(true);
    });

    it('should return false for already submitted entry pack', async () => {
      // Mock entry pack with TDAC submission
      EntryPackService.getEntryPack.mockResolvedValue({
        id: mockEntryPackId,
        arrivalDate: new Date().toISOString(),
        tdacSubmission: { arrCardNo: 'CARD123' }
      });
      
      const shouldSend = await DeadlineNotificationService.shouldSendDeadlineNotification(mockEntryPackId);
      
      expect(shouldSend).toBe(false);
    });

    it('should return false for non-arrival day', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      EntryPackService.getEntryPack.mockResolvedValue({
        id: mockEntryPackId,
        arrivalDate: tomorrow.toISOString(),
        tdacSubmission: null
      });
      
      const shouldSend = await DeadlineNotificationService.shouldSendDeadlineNotification(mockEntryPackId);
      
      expect(shouldSend).toBe(false);
    });
  });

  describe('handleRemindLaterAction', () => {
    it('should schedule next reminder when under max repeats', async () => {
      // Mock existing notification
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [mockEntryPackId]: {
          notificationIds: ['notification-1'],
          userId: mockUserId,
          destination: mockDestination,
          arrivalDate: new Date().toISOString(),
          status: 'scheduled'
        }
      }));
      
      const nextNotificationId = await DeadlineNotificationService.handleRemindLaterAction(
        mockEntryPackId,
        1 // First repeat
      );
      
      expect(nextNotificationId).toBe('notification-123');
      expect(NotificationTemplateService.scheduleTemplatedNotification).toHaveBeenCalledWith(
        'deadlineWarning',
        expect.any(Date),
        { destination: mockDestination },
        expect.objectContaining({
          urgent: true,
          data: expect.objectContaining({
            isRepeat: true,
            repeatNumber: 2
          })
        })
      );
    });

    it('should not schedule more reminders when max repeats reached', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [mockEntryPackId]: {
          notificationIds: ['notification-1', 'notification-2', 'notification-3'],
          status: 'scheduled'
        }
      }));
      
      const nextNotificationId = await DeadlineNotificationService.handleRemindLaterAction(
        mockEntryPackId,
        3 // Max repeats reached
      );
      
      expect(nextNotificationId).toBeNull();
      expect(NotificationTemplateService.scheduleTemplatedNotification).not.toHaveBeenCalled();
    });
  });

  describe('autoCancelIfSubmitted', () => {
    it('should cancel notifications when TDAC is submitted', async () => {
      // Mock existing notification
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        [mockEntryPackId]: {
          notificationIds: ['notification-1', 'notification-2'],
          status: 'scheduled'
        }
      }));
      
      const tdacSubmission = { arrCardNo: 'CARD123' };
      
      const cancelled = await DeadlineNotificationService.autoCancelIfSubmitted(
        mockEntryPackId,
        tdacSubmission
      );
      
      expect(cancelled).toBe(true);
    });

    it('should not cancel when no valid submission', async () => {
      const cancelled = await DeadlineNotificationService.autoCancelIfSubmitted(
        mockEntryPackId,
        null
      );
      
      expect(cancelled).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        'pack1': {
          notificationIds: ['n1', 'n2'],
          status: 'scheduled'
        },
        'pack2': {
          notificationIds: ['n3'],
          status: 'cancelled'
        }
      }));
      
      const stats = await DeadlineNotificationService.getStats();
      
      expect(stats).toEqual({
        total: 2,
        scheduled: 1,
        cancelled: 1,
        expired: 0,
        sent: 0,
        totalNotificationIds: 3
      });
    });
  });
});