/**
 * NotificationClickHandling.test.js - Tests for notification click handling functionality
 * 
 * Tests:
 * - Deep link parsing and navigation
 * - Action button handling
 * - Pending deep link management
 * - Navigation parameter passing
 * 
 * Requirements: 16.1-16.5
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../NotificationService';
import { DEEP_LINK_DESTINATIONS } from '../NotificationTemplates';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationChannelAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('test-id')),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  AndroidImportance: {
    DEFAULT: 3,
    HIGH: 4,
    LOW: 2,
  },
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('NotificationService - Click Handling', () => {
  let mockNavigationRef;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock navigation ref
    mockNavigationRef = {
      current: {
        navigate: jest.fn(),
      },
    };
    
    // Reset AsyncStorage mocks
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.removeItem.mockResolvedValue();
  });

  describe('Deep Link Handling', () => {
    test('should store deep link when navigation ref not available', () => {
      const deepLink = 'thailand/entryFlow';
      const data = { entryPackId: 'test-123' };

      NotificationService.handleDeepLink(deepLink, data);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'pendingNotificationDeepLink',
        expect.stringContaining('"deepLink":"thailand/entryFlow"')
      );
    });

    test('should navigate immediately when navigation ref available', () => {
      NotificationService.setNavigationRef(mockNavigationRef);
      
      const deepLink = 'thailand/entryFlow';
      const data = { entryPackId: 'test-123' };

      NotificationService.handleDeepLink(deepLink, data);

      expect(mockNavigationRef.current.navigate).toHaveBeenCalledWith(
        'ThailandEntryFlow',
        {
          fromNotification: true,
          notificationData: data,
        }
      );
    });

    test('should navigate to entry pack detail with correct parameters', () => {
      NotificationService.setNavigationRef(mockNavigationRef);
      
      const deepLink = 'entryPack/detail';
      const data = { entryPackId: 'test-123', userId: 'user-456' };

      NotificationService.handleDeepLink(deepLink, data);

      expect(mockNavigationRef.current.navigate).toHaveBeenCalledWith(
        'EntryPackDetail',
        {
          entryPackId: 'test-123',
          fromNotification: true,
          notificationData: data,
        }
      );
    });

    test('should navigate to travel info with expand section', () => {
      NotificationService.setNavigationRef(mockNavigationRef);
      
      const deepLink = 'thailand/travelInfo';
      const data = { expandSection: 'funds' };

      NotificationService.handleDeepLink(deepLink, data);

      expect(mockNavigationRef.current.navigate).toHaveBeenCalledWith(
        'ThailandTravelInfo',
        {
          fromNotification: true,
          notificationData: data,
          expandSection: 'funds',
        }
      );
    });

    test('should navigate to profile settings with section', () => {
      NotificationService.setNavigationRef(mockNavigationRef);
      
      const deepLink = 'profile/settings';
      const data = { settingsSection: 'notifications' };

      NotificationService.handleDeepLink(deepLink, data);

      expect(mockNavigationRef.current.navigate).toHaveBeenCalledWith(
        'MainTabs',
        { screen: 'Profile' }
      );
    });

    test('should navigate to home for unknown deep links', () => {
      NotificationService.setNavigationRef(mockNavigationRef);
      
      const deepLink = 'unknown/path';
      const data = {};

      NotificationService.handleDeepLink(deepLink, data);

      expect(mockNavigationRef.current.navigate).toHaveBeenCalledWith(
        'MainTabs',
        { screen: 'Home' }
      );
    });
  });

  describe('Action Button Handling', () => {
    beforeEach(() => {
      NotificationService.setNavigationRef(mockNavigationRef);
    });

    test('should handle submit action', () => {
      const data = { entryPackId: 'test-123' };
      
      NotificationService.handleNotificationAction('submit', data);

      expect(mockNavigationRef.current.navigate).toHaveBeenCalledWith(
        'ThailandEntryFlow',
        {
          fromNotification: true,
          notificationData: {
            ...data,
            autoSubmit: true,
            fromAction: 'submit',
          },
        }
      );
    });

    test('should handle resubmit action', () => {
      const data = { entryPackId: 'test-123' };
      
      NotificationService.handleNotificationAction('resubmit', data);

      expect(mockNavigationRef.current.navigate).toHaveBeenCalledWith(
        'ThailandTravelInfo',
        {
          fromNotification: true,
          notificationData: {
            ...data,
            resubmissionMode: true,
            fromAction: 'resubmit',
          },
          expandSection: null,
        }
      );
    });

    test('should handle view action with entry pack ID', () => {
      const data = { entryPackId: 'test-123' };
      
      NotificationService.handleNotificationAction('view', data);

      expect(mockNavigationRef.current.navigate).toHaveBeenCalledWith(
        'EntryPackDetail',
        {
          entryPackId: 'test-123',
          fromNotification: true,
          notificationData: data,
        }
      );
    });

    test('should handle continue action', () => {
      const data = { entryPackId: 'test-123' };
      
      NotificationService.handleNotificationAction('continue', data);

      expect(mockNavigationRef.current.navigate).toHaveBeenCalledWith(
        'ThailandTravelInfo',
        {
          fromNotification: true,
          notificationData: {
            ...data,
            fromAction: 'continue',
          },
          expandSection: null,
        }
      );
    });

    test('should handle guide action', () => {
      const data = { entryPackId: 'test-123' };
      
      NotificationService.handleNotificationAction('guide', data);

      expect(mockNavigationRef.current.navigate).toHaveBeenCalledWith(
        'EntryPackDetail',
        {
          entryPackId: 'test-123',
          fromNotification: true,
          notificationData: {
            ...data,
            showGuide: true,
          },
        }
      );
    });

    test('should handle dismiss actions without navigation', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      NotificationService.handleNotificationAction('later', {});
      NotificationService.handleNotificationAction('ignore', {});
      NotificationService.handleNotificationAction('dismiss', {});

      expect(mockNavigationRef.current.navigate).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('User chose to later notification');
      expect(consoleSpy).toHaveBeenCalledWith('User chose to ignore notification');
      expect(consoleSpy).toHaveBeenCalledWith('User chose to dismiss notification');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Pending Deep Link Management', () => {
    test('should handle pending deep link within time limit', async () => {
      const pendingData = {
        deepLink: 'thailand/entryFlow',
        data: { entryPackId: 'test-123' },
        timestamp: new Date().toISOString(),
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(pendingData));
      NotificationService.setNavigationRef(mockNavigationRef);

      await NotificationService.handlePendingDeepLink();

      expect(mockNavigationRef.current.navigate).toHaveBeenCalledWith(
        'ThailandEntryFlow',
        {
          fromNotification: true,
          notificationData: pendingData.data,
        }
      );

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('pendingNotificationDeepLink');
    });

    test('should ignore expired pending deep link', async () => {
      const expiredTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const pendingData = {
        deepLink: 'thailand/entryFlow',
        data: { entryPackId: 'test-123' },
        timestamp: expiredTime.toISOString(),
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(pendingData));
      NotificationService.setNavigationRef(mockNavigationRef);

      await NotificationService.handlePendingDeepLink();

      expect(mockNavigationRef.current.navigate).not.toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('pendingNotificationDeepLink');
    });

    test('should handle no pending deep link gracefully', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      NotificationService.setNavigationRef(mockNavigationRef);

      await NotificationService.handlePendingDeepLink();

      expect(mockNavigationRef.current.navigate).not.toHaveBeenCalled();
      expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    });

    test('should handle malformed pending deep link data', async () => {
      AsyncStorage.getItem.mockResolvedValue('invalid-json');
      NotificationService.setNavigationRef(mockNavigationRef);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await NotificationService.handlePendingDeepLink();

      expect(mockNavigationRef.current.navigate).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error handling pending deep link:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Notification Response Handling', () => {
    beforeEach(() => {
      NotificationService.setNavigationRef(mockNavigationRef);
    });

    test('should handle default notification tap', () => {
      const response = {
        notification: {
          request: {
            content: {
              data: {
                deepLink: 'thailand/entryFlow',
                entryPackId: 'test-123',
              },
            },
          },
        },
        actionIdentifier: 'default',
      };

      NotificationService.handleNotificationResponse(response);

      expect(mockNavigationRef.current.navigate).toHaveBeenCalledWith(
        'ThailandEntryFlow',
        {
          fromNotification: true,
          notificationData: response.notification.request.content.data,
        }
      );
    });

    test('should handle action button tap', () => {
      const response = {
        notification: {
          request: {
            content: {
              data: {
                entryPackId: 'test-123',
              },
            },
          },
        },
        actionIdentifier: 'submit',
      };

      NotificationService.handleNotificationResponse(response);

      expect(mockNavigationRef.current.navigate).toHaveBeenCalledWith(
        'ThailandEntryFlow',
        {
          fromNotification: true,
          notificationData: {
            entryPackId: 'test-123',
            autoSubmit: true,
            fromAction: 'submit',
          },
        }
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle navigation error gracefully', () => {
      const mockNavRef = {
        current: {
          navigate: jest.fn(() => {
            throw new Error('Navigation error');
          }),
        },
      };

      NotificationService.setNavigationRef(mockNavRef);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      NotificationService.navigateFromDeepLink('thailand/entryFlow', {});

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error navigating from deep link:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('should warn when navigation ref not available', () => {
      NotificationService.setNavigationRef(null);
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      NotificationService.navigateFromDeepLink('thailand/entryFlow', {});

      expect(consoleSpy).toHaveBeenCalledWith(
        'Navigation ref not available for deep link:',
        'thailand/entryFlow'
      );

      consoleSpy.mockRestore();
    });
  });
});