import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * NotificationPreferencesService - Manages user notification preferences
 * 
 * Features:
 * - Save/load notification preferences
 * - Default configuration management
 * - Preference validation
 * - Real-time preference updates
 * 
 * Requirements: 16.1, 16.5
 */

// Type definitions
export interface NotificationTypes {
  submissionWindow: boolean;
  urgentReminder: boolean;
  deadline: boolean;
  arrivalReminder: boolean;
  arrivalDay: boolean;
  dataChange: boolean;
  expiry: boolean;
  superseded: boolean;
  autoArchival: boolean;
}

export interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
}

export interface TimingPreferences {
  reminderTime: string;
  urgentInterval: number;
  maxUrgentCount: number;
  quietHours: QuietHours;
}

export interface FrequencyPreferences {
  minInterval: number;
  dailySummary: boolean;
  summaryTime: string;
}

export interface ActionPreferences {
  showQuickActions: boolean;
  defaultAction: string;
  remindLaterDuration: number;
}

export interface NotificationPreferences {
  enabled: boolean;
  types: NotificationTypes;
  timing: TimingPreferences;
  frequency: FrequencyPreferences;
  actions: ActionPreferences;
  language: 'auto' | 'zh' | 'en' | 'es';
  version: number;
  updatedAt: string;
}

type PreferenceListener = (preferences: NotificationPreferences) => void;

class NotificationPreferencesService {
  private storageKey: string;
  private listeners: Set<PreferenceListener>;
  private cachedPreferences: NotificationPreferences | null;

  constructor() {
    this.storageKey = 'notification_preferences';
    this.listeners = new Set();
    this.cachedPreferences = null;
  }

  /**
   * Default notification preferences
   */
  getDefaultPreferences(): NotificationPreferences {
    return {
      // Global notification toggle
      enabled: true,
      
      // Notification types
      types: {
        submissionWindow: true,      // 72-hour window open notifications
        urgentReminder: true,        // 24-hour urgent reminders
        deadline: true,              // Arrival day deadline notifications
        arrivalReminder: true,       // 1 day before arrival
        arrivalDay: true,           // Arrival day morning
        dataChange: true,           // Data change detection
        expiry: true,               // Entry pack expiry warnings
        superseded: true,           // Superseded entry pack notifications
        autoArchival: true,         // Automatic archival notifications
      },
      
      // Timing preferences
      timing: {
        reminderTime: '09:00',      // Default reminder time (24h format)
        urgentInterval: 4,          // Hours between urgent reminders
        maxUrgentCount: 3,          // Maximum urgent reminder count
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      },
      
      // Frequency control
      frequency: {
        minInterval: 60,            // Minimum minutes between same-type notifications
        dailySummary: false,        // Send daily summary instead of individual notifications
        summaryTime: '18:00'        // Time for daily summary
      },
      
      // Action preferences
      actions: {
        showQuickActions: true,     // Show action buttons on notifications
        defaultAction: 'view',      // Default action when tapping notification
        remindLaterDuration: 60     // Minutes for "remind later" option
      },
      
      // Language and localization
      language: 'auto',             // 'auto', 'zh', 'en', 'es'
      
      // Version for migration purposes
      version: 1,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Load notification preferences from storage
   * @returns User preferences object
   */
  async loadPreferences(): Promise<NotificationPreferences> {
    try {
      if (this.cachedPreferences) {
        return this.cachedPreferences;
      }

      const stored = await AsyncStorage.getItem(this.storageKey);
      
      if (!stored) {
        // First time user - return defaults and save them
        const defaults = this.getDefaultPreferences();
        await this.savePreferences(defaults);
        return defaults;
      }

      const preferences = JSON.parse(stored) as Partial<NotificationPreferences>;
      
      // Validate and migrate if necessary
      const validatedPreferences = this.validateAndMigrate(preferences);
      
      // Cache the preferences
      this.cachedPreferences = validatedPreferences;
      
      return validatedPreferences;
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      // Return defaults on error
      return this.getDefaultPreferences();
    }
  }

  /**
   * Save notification preferences to storage
   * @param preferences - Preferences object to save
   * @returns Success status
   */
  async savePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      // Validate preferences structure
      const validatedPreferences = this.validatePreferences(preferences);
      
      // Add timestamp
      validatedPreferences.updatedAt = new Date().toISOString();
      
      // Save to storage
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(validatedPreferences));
      
      // Update cache
      this.cachedPreferences = validatedPreferences;
      
      // Notify listeners
      this.notifyListeners(validatedPreferences);
      
      console.log('Notification preferences saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      return false;
    }
  }

  /**
   * Update specific preference
   * @param path - Dot notation path (e.g., 'types.urgentReminder')
   * @param value - New value
   * @returns Success status
   */
  async updatePreference(path: string, value: any): Promise<boolean> {
    try {
      const preferences = await this.loadPreferences();
      
      // Update the specific path
      this.setNestedValue(preferences, path, value);
      
      // Save updated preferences
      return await this.savePreferences(preferences);
    } catch (error) {
      console.error('Error updating preference:', error);
      return false;
    }
  }

  /**
   * Get specific preference value
   * @param path - Dot notation path
   * @param defaultValue - Default value if not found
   * @returns Preference value
   */
  async getPreference(path: string, defaultValue: any = null): Promise<any> {
    try {
      const preferences = await this.loadPreferences();
      return this.getNestedValue(preferences, path, defaultValue);
    } catch (error) {
      console.error('Error getting preference:', error);
      return defaultValue;
    }
  }

  /**
   * Check if a specific notification type is enabled
   * @param type - Notification type
   * @returns Whether the type is enabled
   */
  async isNotificationTypeEnabled(type: keyof NotificationTypes): Promise<boolean> {
    try {
      const globalEnabled = await this.getPreference('enabled', true);
      if (!globalEnabled) {
        return false;
      }
      
      const typeEnabled = await this.getPreference(`types.${type}`, true);
      return typeEnabled;
    } catch (error) {
      console.error('Error checking notification type:', error);
      return false;
    }
  }

  /**
   * Check if we're in quiet hours
   * @returns Whether we're in quiet hours
   */
  async isInQuietHours(): Promise<boolean> {
    try {
      const quietEnabled = await this.getPreference('timing.quietHours.enabled', false);
      if (!quietEnabled) {
        return false;
      }
      
      const startTime = await this.getPreference('timing.quietHours.start', '22:00');
      const endTime = await this.getPreference('timing.quietHours.end', '08:00');
      
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Handle overnight quiet hours (e.g., 22:00 to 08:00)
      if (startTime > endTime) {
        return currentTime >= startTime || currentTime <= endTime;
      } else {
        return currentTime >= startTime && currentTime <= endTime;
      }
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return false;
    }
  }

  /**
   * Get reminder time preference
   * @returns Reminder time in HH:MM format
   */
  async getReminderTime(): Promise<string> {
    return await this.getPreference('timing.reminderTime', '09:00');
  }

  /**
   * Reset preferences to defaults
   * @returns Success status
   */
  async resetToDefaults(): Promise<boolean> {
    try {
      const defaults = this.getDefaultPreferences();
      return await this.savePreferences(defaults);
    } catch (error) {
      console.error('Error resetting preferences:', error);
      return false;
    }
  }

  /**
   * Add listener for preference changes
   * @param listener - Callback function
   */
  addListener(listener: PreferenceListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove listener
   * @param listener - Callback function to remove
   */
  removeListener(listener: PreferenceListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of preference changes
   * @param preferences - Updated preferences
   */
  private notifyListeners(preferences: NotificationPreferences): void {
    this.listeners.forEach(listener => {
      try {
        listener(preferences);
      } catch (error) {
        console.error('Error in preference listener:', error);
      }
    });
  }

  /**
   * Validate and migrate preferences from older versions
   * @param preferences - Stored preferences
   * @returns Validated and migrated preferences
   */
  private validateAndMigrate(preferences: Partial<NotificationPreferences>): NotificationPreferences {
    const defaults = this.getDefaultPreferences();
    
    // If no version, assume version 0 and migrate
    if (!preferences.version) {
      preferences = this.migrateFromV0(preferences);
    }
    
    // Merge with defaults to ensure all properties exist
    const merged = this.deepMerge(defaults, preferences);
    
    // Update version
    merged.version = defaults.version;
    
    return merged;
  }

  /**
   * Validate preferences structure
   * @param preferences - Preferences to validate
   * @returns Validated preferences
   */
  private validatePreferences(preferences: Partial<NotificationPreferences>): NotificationPreferences {
    const defaults = this.getDefaultPreferences();
    
    // Ensure all required properties exist
    const validated = this.deepMerge(defaults, preferences);
    
    // Validate specific values
    if (typeof validated.enabled !== 'boolean') {
      validated.enabled = true;
    }
    
    // Validate timing values
    if (!this.isValidTime(validated.timing.reminderTime)) {
      validated.timing.reminderTime = '09:00';
    }
    
    if (!this.isValidTime(validated.timing.quietHours.start)) {
      validated.timing.quietHours.start = '22:00';
    }
    
    if (!this.isValidTime(validated.timing.quietHours.end)) {
      validated.timing.quietHours.end = '08:00';
    }
    
    // Validate numeric values
    if (typeof validated.timing.urgentInterval !== 'number' || validated.timing.urgentInterval < 1) {
      validated.timing.urgentInterval = 4;
    }
    
    if (typeof validated.timing.maxUrgentCount !== 'number' || validated.timing.maxUrgentCount < 1) {
      validated.timing.maxUrgentCount = 3;
    }
    
    return validated;
  }

  /**
   * Migrate preferences from version 0 (no version)
   * @param oldPreferences - Old preferences
   * @returns Migrated preferences
   */
  private migrateFromV0(oldPreferences: Partial<NotificationPreferences>): Partial<NotificationPreferences> {
    // For now, just return the old preferences
    // Future migrations can be added here
    return oldPreferences;
  }

  /**
   * Deep merge two objects
   * @param target - Target object
   * @param source - Source object
   * @returns Merged object
   */
  private deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {} as any, source[key] as any);
      } else {
        result[key] = source[key] as any;
      }
    }
    
    return result;
  }

  setNestedValue(obj: object, path: string, value: unknown): void {
    const keys = path.split('.');
    let current = obj as Record<string, unknown>;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      const next = current[key];
      if (!next || typeof next !== 'object') {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value as unknown;
  }

  getNestedValue<T = unknown>(obj: object | null, path: string, defaultValue: T | null = null): T | null {
    if (!obj) {
      return defaultValue;
    }
    const keys = path.split('.');
    let current: unknown = obj;
    for (const key of keys) {
      if (!current || typeof current !== 'object' || !(key in (current as Record<string, unknown>))) {
        return defaultValue;
      }
      current = (current as Record<string, unknown>)[key];
    }
    return current as T;
  }

  /**
   * Validate time format (HH:MM)
   * @param time - Time string to validate
   * @returns Whether time is valid
   */
  private isValidTime(time: string): boolean {
    if (typeof time !== 'string') {
      return false;
    }
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cachedPreferences = null;
  }
}

// Export singleton instance
export default new NotificationPreferencesService();

