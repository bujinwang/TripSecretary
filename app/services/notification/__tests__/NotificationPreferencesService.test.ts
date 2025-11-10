// @ts-nocheck

import NotificationPreferencesService from '../NotificationPreferencesService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('NotificationPreferencesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear cache before each test
    NotificationPreferencesService.clearCache();
  });

  describe('loadPreferences', () => {
    it('should return default preferences for first-time users', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockResolvedValue();

      const preferences = await NotificationPreferencesService.loadPreferences();

      expect(preferences.enabled).toBe(true);
      expect(preferences.types.submissionWindow).toBe(true);
      expect(preferences.timing.reminderTime).toBe('09:00');
      expect(preferences.version).toBe(1);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should load and validate stored preferences', async () => {
      const storedPrefs = {
        enabled: false,
        types: { submissionWindow: false },
        timing: { reminderTime: '10:00' },
        version: 1
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedPrefs));

      const preferences = await NotificationPreferencesService.loadPreferences();

      expect(preferences.enabled).toBe(false);
      expect(preferences.types.submissionWindow).toBe(false);
      expect(preferences.timing.reminderTime).toBe('10:00');
    });

    it('should return defaults on JSON parse error', async () => {
      AsyncStorage.getItem.mockResolvedValue('invalid-json');

      const preferences = await NotificationPreferencesService.loadPreferences();

      expect(preferences.enabled).toBe(true);
      expect(preferences.version).toBe(1);
    });

    it('should cache preferences after loading', async () => {
      const storedPrefs = { enabled: true, version: 1 };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedPrefs));

      // First call
      await NotificationPreferencesService.loadPreferences();
      
      // Second call should use cache
      await NotificationPreferencesService.loadPreferences();

      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('savePreferences', () => {
    it('should save preferences to storage', async () => {
      AsyncStorage.setItem.mockResolvedValue();
      
      const preferences = {
        enabled: false,
        types: { submissionWindow: false }
      };

      const result = await NotificationPreferencesService.savePreferences(preferences);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'notification_preferences',
        expect.stringContaining('"enabled":false')
      );
    });

    it('should add timestamp when saving', async () => {
      AsyncStorage.setItem.mockResolvedValue();
      
      const preferences = { enabled: true };
      await NotificationPreferencesService.savePreferences(preferences);

      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData.updatedAt).toBeDefined();
      expect(new Date(savedData.updatedAt)).toBeInstanceOf(Date);
    });

    it('should handle save errors gracefully', async () => {
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
      
      const preferences = { enabled: true };
      const result = await NotificationPreferencesService.savePreferences(preferences);

      expect(result).toBe(false);
    });
  });

  describe('updatePreference', () => {
    beforeEach(async () => {
      // Set up initial preferences
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        enabled: true,
        types: { submissionWindow: true },
        timing: { reminderTime: '09:00' }
      }));
      AsyncStorage.setItem.mockResolvedValue();
    });

    it('should update nested preference values', async () => {
      const result = await NotificationPreferencesService.updatePreference('types.submissionWindow', false);

      expect(result).toBe(true);
      
      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData.types.submissionWindow).toBe(false);
    });

    it('should update top-level preference values', async () => {
      const result = await NotificationPreferencesService.updatePreference('enabled', false);

      expect(result).toBe(true);
      
      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData.enabled).toBe(false);
    });
  });

  describe('getPreference', () => {
    beforeEach(async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        enabled: true,
        types: { submissionWindow: false },
        timing: { reminderTime: '10:00' }
      }));
    });

    it('should get nested preference values', async () => {
      const value = await NotificationPreferencesService.getPreference('types.submissionWindow');
      expect(value).toBe(false);
    });

    it('should get top-level preference values', async () => {
      const value = await NotificationPreferencesService.getPreference('enabled');
      expect(value).toBe(true);
    });

    it('should return default value for non-existent paths', async () => {
      const value = await NotificationPreferencesService.getPreference('nonexistent.path', 'default');
      expect(value).toBe('default');
    });
  });

  describe('isNotificationTypeEnabled', () => {
    beforeEach(async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        enabled: true,
        types: { submissionWindow: false, urgentReminder: true }
      }));
    });

    it('should return false if global notifications are disabled', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        enabled: false,
        types: { submissionWindow: true }
      }));
      NotificationPreferencesService.clearCache();

      const result = await NotificationPreferencesService.isNotificationTypeEnabled('submissionWindow');
      expect(result).toBe(false);
    });

    it('should return false if specific type is disabled', async () => {
      const result = await NotificationPreferencesService.isNotificationTypeEnabled('submissionWindow');
      expect(result).toBe(false);
    });

    it('should return true if both global and type are enabled', async () => {
      const result = await NotificationPreferencesService.isNotificationTypeEnabled('urgentReminder');
      expect(result).toBe(true);
    });

    it('should return true for unknown types by default', async () => {
      const result = await NotificationPreferencesService.isNotificationTypeEnabled('unknownType');
      expect(result).toBe(true);
    });
  });

  describe('isInQuietHours', () => {
    beforeEach(() => {
      // Mock current time to 23:30 (11:30 PM)
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(23);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(30);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return false if quiet hours are disabled', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        timing: {
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          }
        }
      }));
      NotificationPreferencesService.clearCache();

      const result = await NotificationPreferencesService.isInQuietHours();
      expect(result).toBe(false);
    });

    it('should return true during overnight quiet hours', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        timing: {
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00'
          }
        }
      }));
      NotificationPreferencesService.clearCache();

      const result = await NotificationPreferencesService.isInQuietHours();
      expect(result).toBe(true);
    });

    it('should return false outside quiet hours', async () => {
      // Mock current time to 10:00 AM
      Date.prototype.getHours.mockReturnValue(10);
      Date.prototype.getMinutes.mockReturnValue(0);

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        timing: {
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00'
          }
        }
      }));
      NotificationPreferencesService.clearCache();

      const result = await NotificationPreferencesService.isInQuietHours();
      expect(result).toBe(false);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset preferences to default values', async () => {
      AsyncStorage.setItem.mockResolvedValue();

      const result = await NotificationPreferencesService.resetToDefaults();

      expect(result).toBe(true);
      
      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData.enabled).toBe(true);
      expect(savedData.types.submissionWindow).toBe(true);
      expect(savedData.timing.reminderTime).toBe('09:00');
    });
  });

  describe('validatePreferences', () => {
    it('should validate and fix invalid time formats', () => {
      const invalidPrefs = {
        timing: {
          reminderTime: 'invalid-time',
          quietHours: {
            start: '25:00', // Invalid hour
            end: 'not-a-time'
          }
        }
      };

      const validated = NotificationPreferencesService.validatePreferences(invalidPrefs);

      expect(validated.timing.reminderTime).toBe('09:00');
      expect(validated.timing.quietHours.start).toBe('22:00');
      expect(validated.timing.quietHours.end).toBe('08:00');
    });

    it('should validate and fix invalid numeric values', () => {
      const invalidPrefs = {
        timing: {
          urgentInterval: -1,
          maxUrgentCount: 'not-a-number'
        }
      };

      const validated = NotificationPreferencesService.validatePreferences(invalidPrefs);

      expect(validated.timing.urgentInterval).toBe(4);
      expect(validated.timing.maxUrgentCount).toBe(3);
    });
  });

  describe('listeners', () => {
    it('should add and notify listeners', async () => {
      const listener = jest.fn();
      AsyncStorage.setItem.mockResolvedValue();

      NotificationPreferencesService.addListener(listener);
      
      await NotificationPreferencesService.savePreferences({ enabled: false });

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        enabled: false
      }));
    });

    it('should remove listeners', async () => {
      const listener = jest.fn();
      AsyncStorage.setItem.mockResolvedValue();

      NotificationPreferencesService.addListener(listener);
      NotificationPreferencesService.removeListener(listener);
      
      await NotificationPreferencesService.savePreferences({ enabled: false });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});