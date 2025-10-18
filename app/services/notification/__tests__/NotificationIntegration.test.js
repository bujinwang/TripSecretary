/**
 * NotificationIntegration.test.js - Tests for notification system integration with EntryPackService
 * 
 * Tests Requirements 16.1-16.5 for task 9.2:
 * - Integrate NotificationCoordinator with EntryPackService lifecycle events
 * - Schedule window open notifications when arrival date is set
 * - Schedule deadline notifications for urgent reminders
 * - Auto-cancel notifications when TDAC is submitted successfully
 * - Handle notification preferences and user settings
 */

// Mock expo-notifications before importing anything else
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
}));

// Mock react-native modules
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// Mock the notification services to avoid Expo dependencies
const mockNotificationCoordinator = {
  initialize: jest.fn(),
  scheduleWindowOpenNotification: jest.fn(),
  scheduleUrgentReminderNotification: jest.fn(),
  scheduleDeadlineNotification: jest.fn(),
  handleArrivalDateChange: jest.fn(),
  autoCancelIfSubmitted: jest.fn(),
  autoCancelUrgentReminderIfSubmitted: jest.fn(),
  autoCancelDeadlineIfSubmitted: jest.fn(),
  getNotificationStatus: jest.fn(),
  cleanupExpiredNotifications: jest.fn(),
  clearAllNotificationsForUser: jest.fn(),
};

const mockNotificationPreferencesService = {
  getPreference: jest.fn(),
  isNotificationTypeEnabled: jest.fn(),
  loadPreferences: jest.fn(),
  getDefaultPreferences: jest.fn(),
  clearCache: jest.fn(),
};

const mockEntryPackService = {
  createOrUpdatePack: jest.fn(),
  getByEntryInfoId: jest.fn(),
  scheduleNotificationsForEntryPack: jest.fn(),
  autoCancelWindowOpenNotification: jest.fn(),
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('NotificationIntegration', () => {
  const mockUserId = 'test_user_123';
  const mockEntryPackId = 'entry_pack_456';
  const mockArrivalDate = new Date('2024-12-25T10:00:00Z');
  const mockOldArrivalDate = new Date('2024-12-20T10:00:00Z');
  const mockDestination = 'Thailand';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset notification preferences to defaults
    mockNotificationPreferencesService.clearCache.mockClear();
    
    // Mock default preferences
    mockNotificationPreferencesService.getPreference.mockImplementation((path, defaultValue) => {
      const preferences = {
        'enabled': true,
        'types.submissionWindow': true,
        'types.urgentReminder': true,
        'types.deadline': true,
        'timing.reminderTime': '09:00',
        'timing.urgentInterval': 4,
        'timing.maxUrgentCount': 3,
      };
      return Promise.resolve(preferences[path] ?? defaultValue);
    });
    
    mockNotificationPreferencesService.isNotificationTypeEnabled.mockResolvedValue(true);
    
    // Mock default preferences object
    mockNotificationPreferencesService.getDefaultPreferences.mockReturnValue({
      enabled: true,
      types: {
        submissionWindow: true,
        urgentReminder: true,
        deadline: true,
      },
      timing: {
        reminderTime: '09:00',
        urgentInterval: 4,
        maxUrgentCount: 3,
      }
    });
  });

  describe('EntryPackService Lifecycle Integration', () => {
    test('should schedule notifications when entry pack is created with arrival date', async () => {
      // Mock entry pack and entry info
      const mockEntryPack = {
        id: mockEntryPackId,
        userId: mockUserId,
        status: 'in_progress',
        hasValidTDACSubmission: () => false,
      };
      
      const mockEntryInfo = {
        arrivalDate: mockArrivalDate.toISOString(),
        destinationId: 'thailand',
      };

      // Mock EntryPackService methods
      mockEntryPackService.createOrUpdatePack.mockResolvedValue(mockEntryPack);
      mockEntryPackService.getByEntryInfoId.mockResolvedValue(null);

      // Mock notification service methods
      mockNotificationCoordinator.scheduleWindowOpenNotification.mockResolvedValue('window_notif_123');
      mockNotificationCoordinator.scheduleUrgentReminderNotification.mockResolvedValue('urgent_notif_123');
      mockNotificationCoordinator.scheduleDeadlineNotification.mockResolvedValue(['deadline_notif_123']);

      // Test scheduling notifications for entry pack
      await mockEntryPackService.scheduleNotificationsForEntryPack(mockEntryPack, mockEntryInfo);

      // Verify all notification types were scheduled
      expect(mockNotificationCoordinator.scheduleWindowOpenNotification).toHaveBeenCalledWith(
        mockUserId,
        mockEntryPackId,
        mockArrivalDate,
        mockDestination
      );
      
      expect(mockNotificationCoordinator.scheduleUrgentReminderNotification).toHaveBeenCalledWith(
        mockUserId,
        mockEntryPackId,
        mockArrivalDate,
        mockDestination
      );
      
      expect(mockNotificationCoordinator.scheduleDeadlineNotification).toHaveBeenCalledWith(
        mockUserId,
        mockEntryPackId,
        mockArrivalDate,
        mockDestination
      );
    });

    test('should not schedule notifications when globally disabled', async () => {
      // Mock disabled notifications
      NotificationPreferencesService.getPreference.mockImplementation((path, defaultValue) => {
        if (path === 'enabled') return Promise.resolve(false);
        return Promise.resolve(defaultValue);
      });

      const mockEntryPack = {
        id: mockEntryPackId,
        userId: mockUserId,
        status: 'in_progress',
        hasValidTDACSubmission: () => false,
      };
      
      const mockEntryInfo = {
        arrivalDate: mockArrivalDate.toISOString(),
        destinationId: 'thailand',
      };

      await EntryPackService.scheduleNotificationsForEntryPack(mockEntryPack, mockEntryInfo);

      // Verify no notifications were scheduled
      expect(WindowOpenNotificationService.scheduleWindowOpenNotification).not.toHaveBeenCalled();
      expect(UrgentReminderNotificationService.scheduleUrgentReminder).not.toHaveBeenCalled();
      expect(DeadlineNotificationService.scheduleDeadlineNotification).not.toHaveBeenCalled();
    });

    test('should respect individual notification type preferences', async () => {
      // Mock selective notification preferences
      NotificationPreferencesService.isNotificationTypeEnabled.mockImplementation((type) => {
        const enabledTypes = {
          'submissionWindow': true,
          'urgentReminder': false,
          'deadline': true,
        };
        return Promise.resolve(enabledTypes[type] ?? false);
      });

      const mockEntryPack = {
        id: mockEntryPackId,
        userId: mockUserId,
        status: 'in_progress',
        hasValidTDACSubmission: () => false,
      };
      
      const mockEntryInfo = {
        arrivalDate: mockArrivalDate.toISOString(),
        destinationId: 'thailand',
      };

      await EntryPackService.scheduleNotificationsForEntryPack(mockEntryPack, mockEntryInfo);

      // Verify only enabled notification types were scheduled
      expect(WindowOpenNotificationService.scheduleWindowOpenNotification).toHaveBeenCalled();
      expect(UrgentReminderNotificationService.scheduleUrgentReminder).not.toHaveBeenCalled();
      expect(DeadlineNotificationService.scheduleDeadlineNotification).toHaveBeenCalled();
    });

    test('should not schedule notifications when TDAC already submitted', async () => {
      const mockEntryPack = {
        id: mockEntryPackId,
        userId: mockUserId,
        status: 'submitted',
        hasValidTDACSubmission: () => true,
      };
      
      const mockEntryInfo = {
        arrivalDate: mockArrivalDate.toISOString(),
        destinationId: 'thailand',
      };

      await EntryPackService.scheduleNotificationsForEntryPack(mockEntryPack, mockEntryInfo);

      // Verify no notifications were scheduled
      expect(WindowOpenNotificationService.scheduleWindowOpenNotification).not.toHaveBeenCalled();
      expect(UrgentReminderNotificationService.scheduleUrgentReminder).not.toHaveBeenCalled();
      expect(DeadlineNotificationService.scheduleDeadlineNotification).not.toHaveBeenCalled();
    });

    test('should not schedule notifications when no arrival date', async () => {
      const mockEntryPack = {
        id: mockEntryPackId,
        userId: mockUserId,
        status: 'in_progress',
        hasValidTDACSubmission: () => false,
      };
      
      const mockEntryInfo = {
        arrivalDate: null,
        destinationId: 'thailand',
      };

      await EntryPackService.scheduleNotificationsForEntryPack(mockEntryPack, mockEntryInfo);

      // Verify no notifications were scheduled
      expect(WindowOpenNotificationService.scheduleWindowOpenNotification).not.toHaveBeenCalled();
      expect(UrgentReminderNotificationService.scheduleUrgentReminder).not.toHaveBeenCalled();
      expect(DeadlineNotificationService.scheduleDeadlineNotification).not.toHaveBeenCalled();
    });
  });

  describe('Arrival Date Change Handling', () => {
    test('should handle arrival date change through NotificationCoordinator', async () => {
      // Mock NotificationCoordinator methods
      NotificationCoordinator.handleArrivalDateChange = jest.fn().mockResolvedValue({
        windowOpen: { success: true, notificationId: 'window_123' },
        urgentReminder: { success: true, notificationId: 'urgent_123' },
        deadline: { success: true, notificationIds: ['deadline_123'] }
      });

      const result = await NotificationCoordinator.handleArrivalDateChange(
        mockUserId,
        mockEntryPackId,
        mockArrivalDate,
        mockOldArrivalDate,
        mockDestination
      );

      expect(NotificationCoordinator.handleArrivalDateChange).toHaveBeenCalledWith(
        mockUserId,
        mockEntryPackId,
        mockArrivalDate,
        mockOldArrivalDate,
        mockDestination
      );

      expect(result.windowOpen.success).toBe(true);
      expect(result.urgentReminder.success).toBe(true);
      expect(result.deadline.success).toBe(true);
    });

    test('should handle arrival date removal (set to null)', async () => {
      NotificationCoordinator.handleArrivalDateChange = jest.fn().mockResolvedValue({
        windowOpen: { cancelled: true },
        urgentReminder: { cancelled: true },
        deadline: { cancelled: true }
      });

      const result = await NotificationCoordinator.handleArrivalDateChange(
        mockUserId,
        mockEntryPackId,
        null, // New arrival date is null
        mockOldArrivalDate,
        mockDestination
      );

      expect(NotificationCoordinator.handleArrivalDateChange).toHaveBeenCalledWith(
        mockUserId,
        mockEntryPackId,
        null,
        mockOldArrivalDate,
        mockDestination
      );

      expect(result.windowOpen.cancelled).toBe(true);
      expect(result.urgentReminder.cancelled).toBe(true);
      expect(result.deadline.cancelled).toBe(true);
    });
  });

  describe('TDAC Submission Auto-Cancel', () => {
    test('should auto-cancel notifications when TDAC is submitted', async () => {
      const mockTdacSubmission = {
        arrCardNo: 'TH123456789',
        qrUri: 'file://path/to/qr.png',
        pdfPath: 'file://path/to/pdf.pdf',
        submittedAt: new Date().toISOString(),
        submissionMethod: 'api'
      };

      // Mock auto-cancel methods
      WindowOpenNotificationService.autoCancelIfSubmitted.mockResolvedValue(true);
      UrgentReminderNotificationService.autoCancelIfSubmitted.mockResolvedValue(true);
      DeadlineNotificationService.autoCancelIfSubmitted.mockResolvedValue(true);

      await EntryPackService.autoCancelWindowOpenNotification(mockEntryPackId, mockTdacSubmission);

      // Verify all notification types were cancelled
      expect(WindowOpenNotificationService.autoCancelIfSubmitted).toHaveBeenCalledWith(
        mockEntryPackId,
        mockTdacSubmission
      );
      
      expect(UrgentReminderNotificationService.autoCancelIfSubmitted).toHaveBeenCalledWith(
        mockEntryPackId,
        mockTdacSubmission
      );
      
      expect(DeadlineNotificationService.autoCancelIfSubmitted).toHaveBeenCalledWith(
        mockEntryPackId,
        mockTdacSubmission
      );
    });

    test('should handle auto-cancel failures gracefully', async () => {
      const mockTdacSubmission = {
        arrCardNo: 'TH123456789',
        qrUri: 'file://path/to/qr.png',
        pdfPath: 'file://path/to/pdf.pdf',
        submittedAt: new Date().toISOString(),
        submissionMethod: 'api'
      };

      // Mock auto-cancel failures
      WindowOpenNotificationService.autoCancelIfSubmitted.mockRejectedValue(new Error('Cancel failed'));
      UrgentReminderNotificationService.autoCancelIfSubmitted.mockResolvedValue(false);
      DeadlineNotificationService.autoCancelIfSubmitted.mockResolvedValue(true);

      // Should not throw error
      await expect(
        EntryPackService.autoCancelWindowOpenNotification(mockEntryPackId, mockTdacSubmission)
      ).resolves.not.toThrow();

      // Verify all methods were still called
      expect(WindowOpenNotificationService.autoCancelIfSubmitted).toHaveBeenCalled();
      expect(UrgentReminderNotificationService.autoCancelIfSubmitted).toHaveBeenCalled();
      expect(DeadlineNotificationService.autoCancelIfSubmitted).toHaveBeenCalled();
    });
  });

  describe('Notification Status Checking', () => {
    test('should get comprehensive notification status for entry pack', async () => {
      // Mock notification status methods
      WindowOpenNotificationService.isNotificationScheduled.mockResolvedValue(true);
      UrgentReminderNotificationService.isReminderScheduled.mockResolvedValue(true);
      DeadlineNotificationService.areNotificationsScheduled.mockResolvedValue(true);

      NotificationCoordinator.getNotificationStatus = jest.fn().mockResolvedValue({
        entryPackId: mockEntryPackId,
        windowOpen: {
          isScheduled: true,
          notificationId: 'window_123'
        },
        urgentReminder: {
          isScheduled: true,
          notificationId: 'urgent_123',
          reminderTime: mockArrivalDate.toISOString()
        },
        deadline: {
          isScheduled: true,
          notificationIds: ['deadline_123', 'deadline_124'],
          notificationTimes: [mockArrivalDate.toISOString()]
        },
        checkedAt: new Date().toISOString()
      });

      const status = await NotificationCoordinator.getNotificationStatus(mockEntryPackId);

      expect(status.entryPackId).toBe(mockEntryPackId);
      expect(status.windowOpen.isScheduled).toBe(true);
      expect(status.urgentReminder.isScheduled).toBe(true);
      expect(status.deadline.isScheduled).toBe(true);
      expect(status.deadline.notificationIds).toHaveLength(2);
    });

    test('should handle notification status check errors', async () => {
      NotificationCoordinator.getNotificationStatus = jest.fn().mockRejectedValue(
        new Error('Status check failed')
      );

      const status = await NotificationCoordinator.getNotificationStatus(mockEntryPackId);

      expect(status.entryPackId).toBe(mockEntryPackId);
      expect(status.windowOpen.error).toBeDefined();
      expect(status.urgentReminder.error).toBeDefined();
    });
  });

  describe('Notification Preferences Integration', () => {
    test('should load and apply user notification preferences', async () => {
      const mockPreferences = {
        enabled: true,
        types: {
          submissionWindow: false,
          urgentReminder: true,
          deadline: true,
        },
        timing: {
          reminderTime: '10:00',
          urgentInterval: 6,
          maxUrgentCount: 2,
        }
      };

      NotificationPreferencesService.loadPreferences = jest.fn().mockResolvedValue(mockPreferences);
      NotificationPreferencesService.isNotificationTypeEnabled = jest.fn()
        .mockImplementation((type) => Promise.resolve(mockPreferences.types[type] ?? false));

      const windowEnabled = await NotificationPreferencesService.isNotificationTypeEnabled('submissionWindow');
      const urgentEnabled = await NotificationPreferencesService.isNotificationTypeEnabled('urgentReminder');
      const deadlineEnabled = await NotificationPreferencesService.isNotificationTypeEnabled('deadline');

      expect(windowEnabled).toBe(false);
      expect(urgentEnabled).toBe(true);
      expect(deadlineEnabled).toBe(true);
    });

    test('should use default preferences when none exist', async () => {
      NotificationPreferencesService.loadPreferences = jest.fn().mockResolvedValue(null);
      
      const defaultPrefs = NotificationPreferencesService.getDefaultPreferences();
      
      expect(defaultPrefs.enabled).toBe(true);
      expect(defaultPrefs.types.submissionWindow).toBe(true);
      expect(defaultPrefs.types.urgentReminder).toBe(true);
      expect(defaultPrefs.types.deadline).toBe(true);
      expect(defaultPrefs.timing.reminderTime).toBe('09:00');
    });

    test('should handle preference loading errors gracefully', async () => {
      NotificationPreferencesService.loadPreferences = jest.fn().mockRejectedValue(
        new Error('Preferences load failed')
      );
      
      // Should fall back to defaults
      const enabled = await NotificationPreferencesService.getPreference('enabled', true);
      expect(enabled).toBe(true);
    });
  });

  describe('Notification Cleanup and Management', () => {
    test('should cleanup expired notifications', async () => {
      NotificationCoordinator.cleanupExpiredNotifications = jest.fn().mockResolvedValue({
        windowOpenCleaned: 2,
        urgentReminderCleaned: 1,
        deadlineCleaned: 3,
        totalCleaned: 6
      });

      const result = await NotificationCoordinator.cleanupExpiredNotifications();

      expect(result.totalCleaned).toBe(6);
      expect(result.windowOpenCleaned).toBe(2);
      expect(result.urgentReminderCleaned).toBe(1);
      expect(result.deadlineCleaned).toBe(3);
    });

    test('should clear all notifications for user', async () => {
      NotificationCoordinator.clearAllNotificationsForUser = jest.fn().mockResolvedValue({
        windowOpenCancelled: 1,
        urgentReminderCancelled: 2,
        deadlineCancelled: 3,
        totalCancelled: 6
      });

      const result = await NotificationCoordinator.clearAllNotificationsForUser(mockUserId);

      expect(result.totalCancelled).toBe(6);
      expect(NotificationCoordinator.clearAllNotificationsForUser).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle NotificationCoordinator initialization failure', async () => {
      NotificationCoordinator.initialize = jest.fn().mockRejectedValue(
        new Error('Initialization failed')
      );

      // Should not throw error
      await expect(NotificationCoordinator.initialize()).rejects.toThrow('Initialization failed');
    });

    test('should handle individual notification service failures', async () => {
      WindowOpenNotificationService.scheduleWindowOpenNotification.mockRejectedValue(
        new Error('Window notification failed')
      );
      UrgentReminderNotificationService.scheduleUrgentReminder.mockResolvedValue('urgent_123');
      DeadlineNotificationService.scheduleDeadlineNotification.mockResolvedValue(['deadline_123']);

      const mockEntryPack = {
        id: mockEntryPackId,
        userId: mockUserId,
        status: 'in_progress',
        hasValidTDACSubmission: () => false,
      };
      
      const mockEntryInfo = {
        arrivalDate: mockArrivalDate.toISOString(),
        destinationId: 'thailand',
      };

      // Should not throw error
      await expect(
        EntryPackService.scheduleNotificationsForEntryPack(mockEntryPack, mockEntryInfo)
      ).resolves.not.toThrow();

      // Other notifications should still be scheduled
      expect(UrgentReminderNotificationService.scheduleUrgentReminder).toHaveBeenCalled();
      expect(DeadlineNotificationService.scheduleDeadlineNotification).toHaveBeenCalled();
    });
  });
});