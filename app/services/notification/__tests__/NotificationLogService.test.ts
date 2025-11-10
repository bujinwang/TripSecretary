// @ts-nocheck

import NotificationLogService from '../NotificationLogService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('NotificationLogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
  });

  describe('logEvent', () => {
    it('should log notification events with proper structure', async () => {
      const notificationData = {
        identifier: 'test_notification_123',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'submissionWindow',
        userId: 'user_123',
        entryPackId: 'entry_pack_456'
      };

      const metadata = {
        appState: 'foreground',
        actionIdentifier: 'view'
      };

      await NotificationLogService.logEvent('scheduled', notificationData, metadata);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'notificationLogs',
        expect.stringContaining('"eventType":"scheduled"')
      );
    });

    it('should handle interaction events and update analytics', async () => {
      const notificationData = {
        identifier: 'test_notification_123',
        type: 'submissionWindow'
      };

      await NotificationLogService.logEvent('clicked', notificationData);

      // Should call setItem for both logs and interactions
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3); // logs, interactions, analytics
    });
  });

  describe('getLogs', () => {
    it('should return filtered logs based on criteria', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          eventType: 'scheduled',
          timestamp: '2024-01-01T10:00:00.000Z',
          notification: { type: 'submissionWindow', userId: 'user_123' }
        },
        {
          id: 'log_2',
          eventType: 'clicked',
          timestamp: '2024-01-01T11:00:00.000Z',
          notification: { type: 'urgentReminder', userId: 'user_456' }
        }
      ];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockLogs));

      const filters = { eventType: 'scheduled' };
      const result = await NotificationLogService.getLogs(filters);

      expect(result).toHaveLength(1);
      expect(result[0].eventType).toBe('scheduled');
    });

    it('should return empty array when no logs exist', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await NotificationLogService.getLogs();

      expect(result).toEqual([]);
    });
  });

  describe('getAnalytics', () => {
    it('should return default analytics when no data exists', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await NotificationLogService.getAnalytics();

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('byType');
      expect(result).toHaveProperty('timing');
      expect(result.total.scheduled).toBe(0);
    });

    it('should return stored analytics when data exists', async () => {
      const mockAnalytics = {
        total: { scheduled: 5, sent: 4, clicked: 2, clickRate: '50.00' },
        byType: {
          submissionWindow: { scheduled: 3, sent: 3, clicked: 1, clickRate: '33.33' }
        },
        timing: { hourly: Array(24).fill(0), daily: Array(7).fill(0) }
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockAnalytics));

      const result = await NotificationLogService.getAnalytics();

      expect(result.total.scheduled).toBe(5);
      expect(result.byType.submissionWindow.clickRate).toBe('33.33');
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should generate recommendations based on analytics', async () => {
      const mockAnalytics = {
        total: { scheduled: 10, sent: 10, clicked: 1, clickRate: '10.00' },
        byType: {
          submissionWindow: { 
            scheduled: 10, 
            sent: 10, 
            clicked: 1, 
            ignored: 6,
            clickRate: '5.00', // Low click rate to trigger recommendation
            actionRate: '2.00'  // Low action rate to trigger recommendation
          }
        },
        timing: { bestHour: 14, bestDay: 1 }
      };

      // Mock the getAnalytics call specifically
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'notificationAnalytics') {
          return Promise.resolve(JSON.stringify(mockAnalytics));
        }
        return Promise.resolve(null);
      });

      const result = await NotificationLogService.getPerformanceMetrics('submissionWindow');

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      // Should have low engagement recommendation (click rate < 10%)
      const lowEngagementRec = result.recommendations.find(r => r.type === 'low_engagement');
      expect(lowEngagementRec).toBeDefined();
      expect(lowEngagementRec.priority).toBe('high');
    });
  });

  describe('exportLogs', () => {
    it('should export logs with summary information', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          eventType: 'scheduled',
          timestamp: '2024-01-01T10:00:00.000Z'
        }
      ];

      const mockAnalytics = {
        total: { scheduled: 1 }
      };

      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(mockLogs)) // logs
        .mockResolvedValueOnce(JSON.stringify(mockAnalytics)) // analytics
        .mockResolvedValueOnce('[]'); // interactions

      const result = await NotificationLogService.exportLogs();

      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('analytics');
      expect(result).toHaveProperty('interactions');
      expect(result).toHaveProperty('summary');
      expect(result.summary.totalLogs).toBe(1);
    });
  });

  describe('clearOldLogs', () => {
    it('should remove logs older than specified days', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
      const recentDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      const mockLogs = [
        {
          id: 'log_1',
          timestamp: oldDate.toISOString()
        },
        {
          id: 'log_2',
          timestamp: recentDate.toISOString()
        }
      ];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockLogs));

      const result = await NotificationLogService.clearOldLogs(30);

      expect(result.logsRemoved).toBe(1);
      expect(result.logsRemaining).toBe(1);
      
      // Should save filtered logs
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'notificationLogs',
        expect.stringContaining('log_2')
      );
    });
  });

  describe('clearAllLogs', () => {
    it('should remove all log storage keys', async () => {
      await NotificationLogService.clearAllLogs();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'notificationLogs',
        'notificationInteractions',
        'notificationAnalytics'
      ]);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate low engagement recommendation for poor click rates', () => {
      const typeAnalytics = {
        sent: 100,
        clicked: 5,
        clickRate: '5.00',
        actionClicked: 2,
        actionRate: '2.00',
        ignored: 80
      };

      const recommendations = NotificationLogService.generateRecommendations(typeAnalytics);

      expect(recommendations).toContainEqual(
        expect.objectContaining({
          type: 'low_engagement',
          priority: 'high'
        })
      );
    });

    it('should generate action rate recommendation for low action usage', () => {
      const typeAnalytics = {
        sent: 100,
        clicked: 20,
        clickRate: '20.00',
        actionClicked: 3,
        actionRate: '3.00',
        ignored: 30
      };

      const recommendations = NotificationLogService.generateRecommendations(typeAnalytics);

      expect(recommendations).toContainEqual(
        expect.objectContaining({
          type: 'low_action_rate',
          priority: 'medium'
        })
      );
    });

    it('should generate ignore rate recommendation for high ignore rates', () => {
      const typeAnalytics = {
        sent: 100,
        clicked: 15,
        clickRate: '15.00',
        actionClicked: 8,
        actionRate: '8.00',
        ignored: 60
      };

      const recommendations = NotificationLogService.generateRecommendations(typeAnalytics);

      expect(recommendations).toContainEqual(
        expect.objectContaining({
          type: 'high_ignore_rate',
          priority: 'high'
        })
      );
    });
  });
});