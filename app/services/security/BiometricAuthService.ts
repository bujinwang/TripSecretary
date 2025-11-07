/**
 * BiometricAuthService - Service for biometric authentication
 * Provides Face ID / Touch ID protection for sensitive operations
 * 
 * Requirements: 19.3, 19.4
 */

import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

// Type definitions
export interface BiometricCapabilities {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  supportsFaceID: boolean;
  supportsTouchID: boolean;
  supportsPasscode: boolean;
}

export interface BiometricSettings {
  enabled: boolean;
  requireForEntryPackView: boolean;
  requireForDataExport: boolean;
  requireForImmigrationView: boolean;
  requireForSettings: boolean;
  autoLockTimeout: number;
  maxFailedAttempts: number;
}

export interface InitializeResult {
  success: boolean;
  capabilities: BiometricCapabilities | null;
  settings: BiometricSettings | null;
  canUseBiometrics: boolean;
  error?: string;
}

export interface AuthenticationOptions {
  promptMessage?: string;
  cancelLabel?: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
  requireConfirmation?: boolean;
}

export interface AuthenticationResult {
  success: boolean;
  authType?: 'biometric';
  timestamp?: number;
  error?: string;
  errorType?: string;
  fallbackToPasscode?: boolean;
  isLockedOut?: boolean;
  remainingTime?: number;
  failedAttempts?: number;
  maxAttempts?: number;
  systemError?: string;
  skipped?: boolean;
  reason?: string;
}

export interface AvailabilityStatus {
  available: boolean;
  reason: string;
}

export interface LockoutStatus {
  isLockedOut: boolean;
  remainingTime: number;
}

export interface AuthAttempt {
  timestamp: number;
  success: boolean;
  type: 'biometric';
}

export interface AuthStatistics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  isCurrentlyLockedOut: boolean;
  lockoutRemainingTime: number;
  lastAttempt: AuthAttempt | null;
}

export type ExportType = 'json' | 'pdf' | 'image';

class BiometricAuthService {
  private readonly biometricSettingsKey: string = 'biometric_auth_settings';
  private readonly authAttemptKey: string = 'biometric_auth_attempts';
  private readonly maxFailedAttempts: number = 3;
  private readonly lockoutDuration: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Initialize biometric authentication service
   */
  async initialize(): Promise<InitializeResult> {
    try {
      console.log('Initializing BiometricAuthService');

      // Check if device supports biometric authentication
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const capabilities: BiometricCapabilities = {
        isAvailable,
        isEnrolled,
        supportedTypes,
        supportsFaceID: supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
        supportsTouchID: supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT),
        supportsPasscode: false // Passcode is not part of AuthenticationType enum, handled separately
      };

      console.log('Biometric capabilities:', capabilities);

      // Load settings
      const settings = await this.getBiometricSettings();

      return {
        success: true,
        capabilities,
        settings,
        canUseBiometrics: isAvailable && isEnrolled
      };

    } catch (error) {
      console.error('Failed to initialize BiometricAuthService:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        capabilities: null,
        settings: null,
        canUseBiometrics: false
      };
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(options: AuthenticationOptions = {}): Promise<AuthenticationResult> {
    try {
      const {
        promptMessage = 'Verify your identity',
        cancelLabel = 'Cancel',
        fallbackLabel = 'Use Passcode',
        disableDeviceFallback = false,
        requireConfirmation = true
      } = options;

      console.log('Starting biometric authentication');

      // Check if biometric auth is available and enabled
      const canUseBiometrics = await this.canUseBiometrics();
      if (!canUseBiometrics.available) {
        return {
          success: false,
          error: canUseBiometrics.reason,
          fallbackToPasscode: true
        };
      }

      // Check if user is locked out due to failed attempts
      const lockoutStatus = await this.checkLockoutStatus();
      if (lockoutStatus.isLockedOut) {
        return {
          success: false,
          error: `Too many failed attempts. Try again in ${Math.ceil(lockoutStatus.remainingTime / 60000)} minutes.`,
          isLockedOut: true,
          remainingTime: lockoutStatus.remainingTime
        };
      }

      // Perform biometric authentication
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel,
        fallbackLabel,
        disableDeviceFallback,
        requireConfirmation
      });

      if (authResult.success) {
        console.log('Biometric authentication successful');
        
        // Reset failed attempts on successful auth
        await this.resetFailedAttempts();
        
        // Record successful authentication
        await this.recordAuthAttempt(true);

        return {
          success: true,
          authType: 'biometric',
          timestamp: Date.now()
        };
      }
      
      // Handle failed authentication
      // TypeScript type narrowing: if success is false, error must exist
      const failedResult = authResult as Extract<typeof authResult, { success: false }>;
      const error = failedResult.error;
      console.log('Biometric authentication failed:', error);
      
      // Record failed attempt
      await this.recordAuthAttempt(false);
      
      // Check if user should be locked out
      const failedAttempts = await this.getFailedAttempts();
      if (failedAttempts >= this.maxFailedAttempts) {
        await this.setLockout();
      }

      return {
        success: false,
        error: this.getAuthErrorMessage(error),
        errorType: error,
        failedAttempts: failedAttempts + 1,
        maxAttempts: this.maxFailedAttempts
      };

    } catch (error) {
      console.error('Biometric authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: 'Authentication failed due to system error',
        systemError: errorMessage
      };
    }
  }

  /**
   * Authenticate for viewing entry pack details
   */
  async authenticateForEntryPackView(entryPackId: string): Promise<AuthenticationResult> {
    const settings = await this.getBiometricSettings();
    
    if (!settings.requireForEntryPackView) {
      return { success: true, skipped: true, reason: 'Not required by settings' };
    }

    return await this.authenticate({
      promptMessage: 'Verify your identity to view entry pack details',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Passcode'
    });
  }

  /**
   * Authenticate for data export
   */
  async authenticateForDataExport(exportType: ExportType): Promise<AuthenticationResult> {
    const settings = await this.getBiometricSettings();
    
    if (!settings.requireForDataExport) {
      return { success: true, skipped: true, reason: 'Not required by settings' };
    }

    return await this.authenticate({
      promptMessage: `Verify your identity to export data as ${exportType.toUpperCase()}`,
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Passcode'
    });
  }

  /**
   * Authenticate for immigration officer view
   */
  async authenticateForImmigrationView(): Promise<AuthenticationResult> {
    const settings = await this.getBiometricSettings();
    
    if (!settings.requireForImmigrationView) {
      return { success: true, skipped: true, reason: 'Not required by settings' };
    }

    return await this.authenticate({
      promptMessage: 'Verify your identity to show documents to immigration officer',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Passcode',
      requireConfirmation: true
    });
  }

  /**
   * Authenticate for sensitive settings changes
   */
  async authenticateForSettings(): Promise<AuthenticationResult> {
    const settings = await this.getBiometricSettings();
    
    if (!settings.requireForSettings) {
      return { success: true, skipped: true, reason: 'Not required by settings' };
    }

    return await this.authenticate({
      promptMessage: 'Verify your identity to change security settings',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Passcode'
    });
  }

  /**
   * Check if biometrics can be used
   */
  async canUseBiometrics(): Promise<AvailabilityStatus> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const settings = await this.getBiometricSettings();

      if (!isAvailable) {
        return {
          available: false,
          reason: 'Biometric hardware not available on this device'
        };
      }

      if (!isEnrolled) {
        return {
          available: false,
          reason: 'No biometric credentials enrolled. Please set up Face ID or Touch ID in device settings.'
        };
      }

      if (!settings.enabled) {
        return {
          available: false,
          reason: 'Biometric authentication is disabled in app settings'
        };
      }

      return {
        available: true,
        reason: 'Biometric authentication is available'
      };

    } catch (error) {
      console.error('Failed to check biometric availability:', error);
      return {
        available: false,
        reason: 'Failed to check biometric availability'
      };
    }
  }

  /**
   * Get biometric settings
   */
  async getBiometricSettings(): Promise<BiometricSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(this.biometricSettingsKey);
      const defaultSettings: BiometricSettings = {
        enabled: false,
        requireForEntryPackView: false,
        requireForDataExport: true,
        requireForImmigrationView: true,
        requireForSettings: true,
        autoLockTimeout: 5 * 60 * 1000, // 5 minutes
        maxFailedAttempts: 3
      };

      if (settingsJson) {
        return { ...defaultSettings, ...JSON.parse(settingsJson) };
      }

      return defaultSettings;
    } catch (error) {
      console.error('Failed to get biometric settings:', error);
      return {
        enabled: false,
        requireForEntryPackView: false,
        requireForDataExport: false,
        requireForImmigrationView: false,
        requireForSettings: false,
        autoLockTimeout: 5 * 60 * 1000,
        maxFailedAttempts: 3
      };
    }
  }

  /**
   * Update biometric settings
   */
  async updateBiometricSettings(settings: Partial<BiometricSettings>): Promise<void> {
    try {
      const currentSettings = await this.getBiometricSettings();
      const newSettings = { ...currentSettings, ...settings };
      
      await AsyncStorage.setItem(this.biometricSettingsKey, JSON.stringify(newSettings));
      
      console.log('Biometric settings updated:', newSettings);
    } catch (error) {
      console.error('Failed to update biometric settings:', error);
      throw error;
    }
  }

  /**
   * Enable biometric authentication
   */
  async enableBiometricAuth(): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      // First check if biometrics are available
      const canUse = await this.canUseBiometrics();
      if (!canUse.available && canUse.reason !== 'Biometric authentication is disabled in app settings') {
        return {
          success: false,
          error: canUse.reason
        };
      }

      // Test authentication to ensure it works
      const testAuth = await this.authenticate({
        promptMessage: 'Verify your identity to enable biometric authentication',
        cancelLabel: 'Cancel'
      });

      if (!testAuth.success) {
        return {
          success: false,
          error: 'Failed to verify biometric authentication'
        };
      }

      // Enable biometric auth in settings
      await this.updateBiometricSettings({ enabled: true });

      return {
        success: true,
        message: 'Biometric authentication enabled successfully'
      };

    } catch (error) {
      console.error('Failed to enable biometric auth:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometricAuth(): Promise<void> {
    try {
      await this.updateBiometricSettings({ enabled: false });
      console.log('Biometric authentication disabled');
    } catch (error) {
      console.error('Failed to disable biometric auth:', error);
      throw error;
    }
  }

  /**
   * Show biometric setup prompt
   */
  async showBiometricSetupPrompt(): Promise<void> {
    const capabilities = await this.initialize();
    
    if (!capabilities.capabilities?.isAvailable) {
      Alert.alert(
        'Biometric Authentication Not Available',
        'This device does not support biometric authentication.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!capabilities.capabilities?.isEnrolled) {
      Alert.alert(
        'Set Up Biometric Authentication',
        'To use biometric authentication, please set up Face ID or Touch ID in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                // On iOS, we can't directly open biometric settings
                Alert.alert('Open Settings', 'Go to Settings > Face ID & Passcode (or Touch ID & Passcode) to set up biometric authentication.');
              }
            }
          }
        ]
      );
      return;
    }

    // Biometrics are available, prompt to enable
    Alert.alert(
      'Enable Biometric Authentication',
      'Would you like to use Face ID or Touch ID to protect your sensitive data?',
      [
        { text: 'Not Now', style: 'cancel' },
        { 
          text: 'Enable', 
          onPress: async () => {
            const result = await this.enableBiometricAuth();
            if (!result.success) {
              Alert.alert('Error', result.error || 'Unknown error');
            }
          }
        }
      ]
    );
  }

  // Helper Methods

  /**
   * Get authentication error message
   */
  getAuthErrorMessage(errorType: LocalAuthentication.LocalAuthenticationError): string {
    switch (errorType) {
      case 'user_cancel':
        return 'Authentication was cancelled';
      case 'user_fallback':
        return 'User chose to use passcode instead';
      case 'system_cancel':
      case 'app_cancel':
        return 'Authentication was cancelled by the system';
      case 'passcode_not_set':
        return 'Passcode is not set on this device';
      case 'not_available':
        return 'Biometric authentication is not available';
      case 'not_enrolled':
        return 'No biometric credentials are enrolled';
      case 'lockout':
        return 'Too many failed attempts. Please try again later.';
      case 'authentication_failed':
        return 'Authentication failed. Please try again.';
      case 'timeout':
        return 'Authentication timed out. Please try again.';
      case 'unable_to_process':
        return 'Unable to process authentication. Please try again.';
      case 'invalid_context':
        return 'Invalid authentication context. Please try again.';
      case 'no_space':
        return 'Not enough storage space for authentication.';
      case 'unknown':
      default:
        return 'Authentication failed due to an unknown error';
    }
  }

  /**
   * Record authentication attempt
   */
  async recordAuthAttempt(success: boolean): Promise<void> {
    try {
      const attempts = await this.getAuthAttempts();
      attempts.push({
        timestamp: Date.now(),
        success,
        type: 'biometric'
      });

      // Keep only last 10 attempts
      const recentAttempts = attempts.slice(-10);
      
      await AsyncStorage.setItem(this.authAttemptKey, JSON.stringify(recentAttempts));
    } catch (error) {
      console.error('Failed to record auth attempt:', error);
    }
  }

  /**
   * Get authentication attempts
   */
  async getAuthAttempts(): Promise<AuthAttempt[]> {
    try {
      const attemptsJson = await AsyncStorage.getItem(this.authAttemptKey);
      return attemptsJson ? JSON.parse(attemptsJson) : [];
    } catch (error) {
      console.error('Failed to get auth attempts:', error);
      return [];
    }
  }

  /**
   * Get failed attempts count in recent period
   */
  async getFailedAttempts(): Promise<number> {
    try {
      const attempts = await this.getAuthAttempts();
      const recentTime = Date.now() - (30 * 60 * 1000); // Last 30 minutes
      
      return attempts.filter(attempt => 
        !attempt.success && 
        attempt.timestamp > recentTime
      ).length;
    } catch (error) {
      console.error('Failed to get failed attempts:', error);
      return 0;
    }
  }

  /**
   * Reset failed attempts counter
   */
  async resetFailedAttempts(): Promise<void> {
    try {
      await AsyncStorage.removeItem('biometric_lockout');
    } catch (error) {
      console.error('Failed to reset failed attempts:', error);
    }
  }

  /**
   * Set lockout due to too many failed attempts
   */
  async setLockout(): Promise<void> {
    try {
      const lockoutUntil = Date.now() + this.lockoutDuration;
      await AsyncStorage.setItem('biometric_lockout', lockoutUntil.toString());
      console.log('Biometric lockout set until:', new Date(lockoutUntil));
    } catch (error) {
      console.error('Failed to set lockout:', error);
    }
  }

  /**
   * Check lockout status
   */
  async checkLockoutStatus(): Promise<LockoutStatus> {
    try {
      const lockoutUntilStr = await AsyncStorage.getItem('biometric_lockout');
      if (!lockoutUntilStr) {
        return { isLockedOut: false, remainingTime: 0 };
      }

      const lockoutUntil = parseInt(lockoutUntilStr, 10);
      const now = Date.now();
      
      if (now >= lockoutUntil) {
        // Lockout expired, remove it
        await AsyncStorage.removeItem('biometric_lockout');
        return { isLockedOut: false, remainingTime: 0 };
      }

      return {
        isLockedOut: true,
        remainingTime: lockoutUntil - now
      };
    } catch (error) {
      console.error('Failed to check lockout status:', error);
      return { isLockedOut: false, remainingTime: 0 };
    }
  }

  /**
   * Get biometric authentication statistics
   */
  async getAuthStatistics(): Promise<AuthStatistics> {
    try {
      const attempts = await this.getAuthAttempts();
      const successful = attempts.filter(a => a.success).length;
      const failed = attempts.filter(a => !a.success).length;
      const lockoutStatus = await this.checkLockoutStatus();

      return {
        totalAttempts: attempts.length,
        successfulAttempts: successful,
        failedAttempts: failed,
        successRate: attempts.length > 0 ? Math.round((successful / attempts.length) * 100) : 0,
        isCurrentlyLockedOut: lockoutStatus.isLockedOut,
        lockoutRemainingTime: lockoutStatus.remainingTime,
        lastAttempt: attempts.length > 0 ? attempts[attempts.length - 1] : null
      };
    } catch (error) {
      console.error('Failed to get auth statistics:', error);
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        successRate: 0,
        isCurrentlyLockedOut: false,
        lockoutRemainingTime: 0,
        lastAttempt: null
      };
    }
  }
}

// Export singleton instance
const biometricAuthService = new BiometricAuthService();

export default biometricAuthService;

