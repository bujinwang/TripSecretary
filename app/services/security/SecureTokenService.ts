/**
 * Secure Token Service
 *
 * Manages secure storage of sensitive data using expo-secure-store.
 * This service provides encrypted storage for:
 * - Authentication tokens
 * - API keys
 * - Other sensitive credentials
 *
 * SECURITY: All data is encrypted at rest using device-level encryption
 *
 * Migration from AsyncStorage:
 * - auth_token (API.js) → SecureStore
 * - qwen_api_key (QwenService.js) → SecureStore
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SecureTokenService {
  // Key names for secure storage
  static readonly AUTH_TOKEN_KEY: string = 'secure_auth_token';
  static readonly QWEN_API_KEY: string = 'secure_qwen_api_key';

  /**
   * Save authentication token securely
   * Replaces: AsyncStorage.setItem('auth_token', token)
   */
  static async saveAuthToken(token: string): Promise<void> {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid auth token: must be a non-empty string');
      }

      await SecureStore.setItemAsync(this.AUTH_TOKEN_KEY, token);
      console.log('✅ Auth token saved securely');
    } catch (error) {
      console.error('❌ Failed to save auth token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to save auth token: ${errorMessage}`);
    }
  }

  /**
   * Get authentication token securely
   * Replaces: AsyncStorage.getItem('auth_token')
   */
  static async getAuthToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(this.AUTH_TOKEN_KEY);
      if (token) {
        console.log('✅ Auth token retrieved securely');
      } else {
        console.log('ℹ️  No auth token found');
      }
      return token;
    } catch (error) {
      console.error('❌ Failed to retrieve auth token:', error);
      return null;
    }
  }

  /**
   * Delete authentication token
   * Replaces: AsyncStorage.removeItem('auth_token')
   */
  static async deleteAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.AUTH_TOKEN_KEY);
      console.log('✅ Auth token deleted securely');
    } catch (error) {
      console.error('❌ Failed to delete auth token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete auth token: ${errorMessage}`);
    }
  }

  /**
   * Save Qwen API key securely
   * Replaces: AsyncStorage.setItem('qwen_api_key', apiKey)
   */
  static async saveQwenAPIKey(apiKey: string): Promise<void> {
    try {
      if (!apiKey || typeof apiKey !== 'string') {
        throw new Error('Invalid API key: must be a non-empty string');
      }

      await SecureStore.setItemAsync(this.QWEN_API_KEY, apiKey);
      console.log('✅ Qwen API key saved securely');
    } catch (error) {
      console.error('❌ Failed to save Qwen API key:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to save Qwen API key: ${errorMessage}`);
    }
  }

  /**
   * Get Qwen API key securely
   * Replaces: AsyncStorage.getItem('qwen_api_key')
   */
  static async getQwenAPIKey(): Promise<string | null> {
    try {
      const apiKey = await SecureStore.getItemAsync(this.QWEN_API_KEY);
      if (apiKey) {
        console.log('✅ Qwen API key retrieved securely');
      } else {
        console.log('ℹ️  No Qwen API key found');
      }
      return apiKey;
    } catch (error) {
      console.error('❌ Failed to retrieve Qwen API key:', error);
      return null;
    }
  }

  /**
   * Delete Qwen API key
   * Replaces: AsyncStorage.removeItem('qwen_api_key')
   */
  static async deleteQwenAPIKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.QWEN_API_KEY);
      console.log('✅ Qwen API key deleted securely');
    } catch (error) {
      console.error('❌ Failed to delete Qwen API key:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete Qwen API key: ${errorMessage}`);
    }
  }

  /**
   * Generic method to save any secure value
   */
  static async saveSecureValue(key: string, value: string): Promise<void> {
    try {
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid key: must be a non-empty string');
      }
      if (!value || typeof value !== 'string') {
        throw new Error('Invalid value: must be a non-empty string');
      }

      await SecureStore.setItemAsync(key, value);
      console.log(`✅ Secure value saved: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to save secure value (${key}):`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to save secure value: ${errorMessage}`);
    }
  }

  /**
   * Generic method to get any secure value
   */
  static async getSecureValue(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value) {
        console.log(`✅ Secure value retrieved: ${key}`);
      } else {
        console.log(`ℹ️  No secure value found: ${key}`);
      }
      return value;
    } catch (error) {
      console.error(`❌ Failed to retrieve secure value (${key}):`, error);
      return null;
    }
  }

  /**
   * Generic method to delete any secure value
   */
  static async deleteSecureValue(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
      console.log(`✅ Secure value deleted: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to delete secure value (${key}):`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete secure value: ${errorMessage}`);
    }
  }

  /**
   * Migrate data from AsyncStorage to SecureStore
   * Use this for one-time migration of existing tokens
   */
  static async migrateFromAsyncStorage(asyncStorageKey: string, secureStoreKey: string): Promise<boolean> {
    try {
      // Check if SecureStore already has data (prevents overwriting newer data)
      const existingValue = await SecureStore.getItemAsync(secureStoreKey);
      if (existingValue) {
        console.log(`ℹ️  ${secureStoreKey} already exists, skipping migration`);
        // Still clean up old AsyncStorage key
        await AsyncStorage.removeItem(asyncStorageKey);
        return false;
      }

      // Get value from AsyncStorage
      const value = await AsyncStorage.getItem(asyncStorageKey);

      if (value) {
        // Save to SecureStore
        await SecureStore.setItemAsync(secureStoreKey, value);

        // Remove from AsyncStorage
        await AsyncStorage.removeItem(asyncStorageKey);

        console.log(`✅ Migrated ${asyncStorageKey} → ${secureStoreKey}`);
        return true;
      } else {
        console.log(`ℹ️  No value to migrate for ${asyncStorageKey}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Migration failed (${asyncStorageKey}):`, error);
      return false;
    }
  }

  /**
   * Check if SecureStore is available on this platform
   * Uses finally block to guarantee test key cleanup
   */
  static async isAvailable(): Promise<boolean> {
    const testKey = '__secure_store_test__';
    const testValue = 'test';

    try {
      // Try to perform a test operation
      await SecureStore.setItemAsync(testKey, testValue);
      const result = await SecureStore.getItemAsync(testKey);
      return result === testValue;
    } catch (error) {
      console.error('❌ SecureStore not available:', error);
      return false;
    } finally {
      // Always attempt cleanup, even if test failed
      try {
        await SecureStore.deleteItemAsync(testKey);
      } catch (cleanupError) {
        // Ignore cleanup errors - test key may not exist
      }
    }
  }

  /**
   * Clear all secure tokens (logout helper)
   * Deletes auth token and other sensitive data
   * Uses Promise.allSettled() to ensure all deletions are attempted
   */
  static async clearAllTokens(): Promise<void> {
    const results = await Promise.allSettled([
      this.deleteAuthToken(),
      this.deleteQwenAPIKey(),
    ]);

    const failures = results.filter(r => r.status === 'rejected');

    if (failures.length > 0) {
      console.error(`❌ Failed to clear ${failures.length} token(s)`);
      failures.forEach((failure, index) => {
        if (failure.status === 'rejected') {
          console.error(`  - Token ${index + 1}: ${failure.reason}`);
        }
      });
      throw new Error(`Failed to clear ${failures.length} token(s)`);
    }

    console.log('✅ All secure tokens cleared');
  }
}

export default SecureTokenService;

