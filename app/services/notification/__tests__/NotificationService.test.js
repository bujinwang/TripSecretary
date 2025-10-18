import NotificationService from '../NotificationService';
import * as Notifications from 'expo-notifications';

// Mock expo-notifications
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

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios'
  }
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the service state
    NotificationService.isInitialized = false;
    NotificationService.permissionStatus = null;
  });

  describe('initialize', () => {
    it('should request permissions and set up listeners', async () => {
      // Mock successful permission request
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Notifications.addNotificationReceivedListener.mockReturnValue({ remove: jest.fn() });
      Notifications.addNotificationResponseReceivedListener.mockReturnValue({ remove: jest.fn() });

      const result = await NotificationService.initialize();

      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      expect(result.granted).toBe(true);
      expect(NotificationService.isInitialized).toBe(true);
    });

    it('should request permissions if not already granted', async () => {
      // Mock permission flow
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Notifications.addNotificationReceivedListener.mockReturnValue({ remove: jest.fn() });
      Notifications.addNotificationResponseReceivedListener.mockReturnValue({ remove: jest.fn() });

      const result = await NotificationService.initialize();

      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(result.granted).toBe(true);
    });

    it('should handle permission denial gracefully', async () => {
      // Mock permission denial
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const result = await NotificationService.initialize();

      expect(result.granted).toBe(false);
      expect(result.status).toBe('denied');
    });
  });

  describe('scheduleNotification', () => {
    beforeEach(async () => {
      // Initialize service with granted permissions
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Notifications.addNotificationReceivedListener.mockReturnValue({ remove: jest.fn() });
      Notifications.addNotificationResponseReceivedListener.mockReturnValue({ remove: jest.fn() });
      await NotificationService.initialize();
    });

    it('should schedule a notification with Date trigger', async () => {
      const mockId = 'test-notification-id';
      Notifications.scheduleNotificationAsync.mockResolvedValue(mockId);

      const title = 'Test Notification';
      const body = 'This is a test notification';
      const date = new Date(Date.now() + 60000); // 1 minute from now
      const data = { testData: 'value' };

      const result = await NotificationService.scheduleNotification(title, body, date, data);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title,
          body,
          data: {
            ...data,
            scheduledAt: expect.any(String)
          },
          sound: 'default',
          priority: 'default'
        },
        trigger: { date }
      });
      expect(result).toBe(mockId);
    });

    it('should schedule a notification with seconds trigger', async () => {
      const mockId = 'test-notification-id';
      Notifications.scheduleNotificationAsync.mockResolvedValue(mockId);

      const title = 'Test Notification';
      const body = 'This is a test notification';
      const seconds = 60; // 1 minute from now

      const result = await NotificationService.scheduleNotification(title, body, seconds);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title,
          body,
          data: {
            scheduledAt: expect.any(String)
          },
          sound: 'default',
          priority: 'default'
        },
        trigger: { seconds }
      });
      expect(result).toBe(mockId);
    });

    it('should throw error for invalid date parameter', async () => {
      await expect(
        NotificationService.scheduleNotification('Title', 'Body', 'invalid-date')
      ).rejects.toThrow('Invalid date parameter');
    });

    it('should throw error if permissions not granted', async () => {
      // Reset service and mock denied permissions
      NotificationService.isInitialized = false;
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

      await expect(
        NotificationService.scheduleNotification('Title', 'Body', new Date())
      ).rejects.toThrow('Notification permissions not granted');
    });
  });

  describe('cancelNotification', () => {
    it('should cancel a notification by ID', async () => {
      const notificationId = 'test-id';
      Notifications.cancelScheduledNotificationAsync.mockResolvedValue();

      const result = await NotificationService.cancelNotification(notificationId);

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(notificationId);
      expect(result).toBe(true);
    });

    it('should handle cancellation errors gracefully', async () => {
      const notificationId = 'test-id';
      Notifications.cancelScheduledNotificationAsync.mockRejectedValue(new Error('Cancel failed'));

      const result = await NotificationService.cancelNotification(notificationId);

      expect(result).toBe(false);
    });
  });

  describe('cancelAllNotifications', () => {
    it('should cancel all notifications', async () => {
      Notifications.cancelAllScheduledNotificationsAsync.mockResolvedValue();

      const result = await NotificationService.cancelAllNotifications();

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('getScheduledNotifications', () => {
    it('should return scheduled notifications', async () => {
      const mockNotifications = [
        { identifier: 'id1', content: { title: 'Test 1' } },
        { identifier: 'id2', content: { title: 'Test 2' } }
      ];
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValue(mockNotifications);

      const result = await NotificationService.getScheduledNotifications();

      expect(Notifications.getAllScheduledNotificationsAsync).toHaveBeenCalled();
      expect(result).toEqual(mockNotifications);
    });

    it('should return empty array on error', async () => {
      Notifications.getAllScheduledNotificationsAsync.mockRejectedValue(new Error('Failed'));

      const result = await NotificationService.getScheduledNotifications();

      expect(result).toEqual([]);
    });
  });

  describe('areNotificationsEnabled', () => {
    it('should return true if permissions are granted', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });

      const result = await NotificationService.areNotificationsEnabled();

      expect(result).toBe(true);
    });

    it('should return false if permissions are not granted', async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const result = await NotificationService.areNotificationsEnabled();

      expect(result).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove listeners and reset state', () => {
      const mockListener1 = { remove: jest.fn() };
      const mockListener2 = { remove: jest.fn() };
      
      NotificationService.notificationListener = mockListener1;
      NotificationService.responseListener = mockListener2;
      NotificationService.isInitialized = true;

      NotificationService.cleanup();

      expect(Notifications.removeNotificationSubscription).toHaveBeenCalledWith(mockListener1);
      expect(Notifications.removeNotificationSubscription).toHaveBeenCalledWith(mockListener2);
      expect(NotificationService.isInitialized).toBe(false);
    });
  });
});