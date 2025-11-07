// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 'default' }
}));

// Mock react-native
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Alert: { alert: jest.fn() }
}));

// Import after mocking
const NotificationPreferencesService = require('../../services/notification/NotificationPreferencesService').default;

describe('NotificationSettingsScreen Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have NotificationPreferencesService available', () => {
    expect(NotificationPreferencesService).toBeDefined();
    expect(typeof NotificationPreferencesService.loadPreferences).toBe('function');
    expect(typeof NotificationPreferencesService.savePreferences).toBe('function');
    expect(typeof NotificationPreferencesService.updatePreference).toBe('function');
  });

  it('should be able to create default preferences', () => {
    const defaults = NotificationPreferencesService.getDefaultPreferences();
    
    expect(defaults.enabled).toBe(true);
    expect(defaults.types.submissionWindow).toBe(true);
    expect(defaults.timing.reminderTime).toBe('09:00');
    expect(defaults.version).toBe(1);
  });

  it('should validate time format correctly', () => {
    expect(NotificationPreferencesService.isValidTime('09:00')).toBe(true);
    expect(NotificationPreferencesService.isValidTime('23:59')).toBe(true);
    expect(NotificationPreferencesService.isValidTime('24:00')).toBe(false);
    expect(NotificationPreferencesService.isValidTime('invalid')).toBe(false);
  });

  it('should handle nested value operations', () => {
    const obj = {
      types: {
        submissionWindow: true
      }
    };
    
    // Test getting nested value
    const value = NotificationPreferencesService.getNestedValue(obj, 'types.submissionWindow');
    expect(value).toBe(true);
    
    // Test setting nested value
    NotificationPreferencesService.setNestedValue(obj, 'types.urgentReminder', false);
    expect(obj.types.urgentReminder).toBe(false);
  });

  it('should validate and fix invalid preferences', () => {
    const invalidPrefs = {
      enabled: 'not-boolean',
      timing: {
        reminderTime: 'invalid-time',
        urgentInterval: -1
      }
    };
    
    const validated = NotificationPreferencesService.validatePreferences(invalidPrefs);
    
    expect(validated.enabled).toBe(true); // Fixed to boolean
    expect(validated.timing.reminderTime).toBe('09:00'); // Fixed to valid time
    expect(validated.timing.urgentInterval).toBe(4); // Fixed to valid number
  });

  it('should deep merge objects correctly', () => {
    const target = {
      enabled: true,
      types: {
        submissionWindow: true
      }
    };
    
    const source = {
      enabled: false,
      types: {
        urgentReminder: true
      },
      timing: {
        reminderTime: '10:00'
      }
    };
    
    const merged = NotificationPreferencesService.deepMerge(target, source);
    
    expect(merged.enabled).toBe(false); // Overridden
    expect(merged.types.submissionWindow).toBe(true); // Preserved
    expect(merged.types.urgentReminder).toBe(true); // Added
    expect(merged.timing.reminderTime).toBe('10:00'); // Added
  });

  it('should handle listener management', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    
    // Add listeners
    NotificationPreferencesService.addListener(listener1);
    NotificationPreferencesService.addListener(listener2);
    
    // Notify listeners
    const testPrefs = { enabled: false };
    NotificationPreferencesService.notifyListeners(testPrefs);
    
    expect(listener1).toHaveBeenCalledWith(testPrefs);
    expect(listener2).toHaveBeenCalledWith(testPrefs);
    
    // Remove listener
    NotificationPreferencesService.removeListener(listener1);
    
    // Notify again
    NotificationPreferencesService.notifyListeners(testPrefs);
    
    expect(listener1).toHaveBeenCalledTimes(1); // Not called again
    expect(listener2).toHaveBeenCalledTimes(2); // Called again
  });
});