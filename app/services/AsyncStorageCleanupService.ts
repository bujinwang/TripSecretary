/**
 * AsyncStorage Cleanup Service
 *
 * Manages AsyncStorage cleanup and monitoring to prevent bloat.
 *
 * Features:
 * - Clean up old TDAC submission logs (> 30 days)
 * - Monitor AsyncStorage size
 * - List keys by category
 * - Safe cleanup (preserves critical data)
 *
 * Usage:
 *   await AsyncStorageCleanupService.cleanupOldLogs();
 *   const size = await AsyncStorageCleanupService.getStorageSize();
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './LoggingService';

// Type definitions
interface CleanupResult {
  success: boolean;
  deletedCount: number;
  deletedKeys?: string[];
  error?: string;
}

interface StorageSizeByCategory {
  entryGuides: number;
  biometric: number;
  backup: number;
  logs: number;
  errors: number;
  other: number;
}

interface StorageSizeResult {
  totalSize: number;
  totalKeys: number;
  sizeByCategory: StorageSizeByCategory;
  sizeInKB: string;
  sizeInMB: string;
  error?: string;
}

interface CategorizedKeys {
  entryGuides: string[];
  biometric: string[];
  backup: string[];
  logs: string[];
  errors: string[];
  protected: string[];
  other: string[];
  error?: string;
}

interface HealthReport {
  status: 'healthy' | 'warning' | 'error';
  size?: StorageSizeResult;
  keys?: CategorizedKeys;
  warnings?: string[];
  recommendations?: string[];
  lastChecked?: string;
  error?: string;
}

interface LogEntry {
  timestamp?: string;
  createdAt?: string;
  [key: string]: any;
}

class AsyncStorageCleanupService {
  // Keys that should NEVER be deleted
  static readonly PROTECTED_KEYS: readonly string[] = [
    // Biometric authentication
    'biometric_settings',
    'biometric_auth_attempts',
    'biometric_lockout',

    // Backup and recovery
    'last_backup_info',
    'backup_settings',
    'backup_schedule',
    'cloud_backup_status',
    'recovery_statistics',

    // Entry guide progress (until migrated to database)
    'canada_entry_progress',
    'vietnam_entry_progress',
    'japan_entry_progress',
    'thailand_entry_progress',
    'usa_entry_progress',
    'malaysia_entry_progress',
    'singapore_entry_progress',
    'korea_entry_progress',
  ] as const;

  // Age threshold for logs (in milliseconds)
  static readonly LOG_MAX_AGE: number = 30 * 24 * 60 * 60 * 1000; // 30 days
  static readonly ERROR_LOG_MAX_AGE: number = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Clean up old TDAC submission logs
   * Removes logs older than 30 days
   *
   * @returns Cleanup result
   */
  static async cleanupOldLogs(): Promise<CleanupResult> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const key of allKeys) {
        // TDAC submission logs with timestamp in key name
        if (key.startsWith('tdac_submission_log_')) {
          const timestamp = this.extractTimestampFromKey(key);
          if (timestamp && (now - timestamp) > this.LOG_MAX_AGE) {
            keysToDelete.push(key);
          }
        }

        // Error logs with timestamp in key name
        if (key.startsWith('tdac_submission_failure_')) {
          const timestamp = this.extractTimestampFromKey(key);
          if (timestamp && (now - timestamp) > this.ERROR_LOG_MAX_AGE) {
            keysToDelete.push(key);
          }
        }

        // Error logs without timestamp in key name
        // These should be checked by value age or simply deleted if old
        if (key === 'tdac_error_log' ||
            key === 'snapshot_creation_failures' ||
            key === 'entry_info_status_update_failures') {
          try {
            const value = await AsyncStorage.getItem(key);
            if (value) {
              // Try to parse and check timestamp from value
              let shouldDelete = false;
              try {
                const data = JSON.parse(value) as LogEntry | LogEntry[];
                // Check if it's an array of log entries
                if (Array.isArray(data) && data.length > 0) {
                  // Get the most recent entry's timestamp
                  const lastEntry = data[data.length - 1];
                  const lastTimestamp = lastEntry?.timestamp || lastEntry?.createdAt;
                  if (lastTimestamp) {
                    const timestampValue = typeof lastTimestamp === 'string' 
                      ? new Date(lastTimestamp).getTime() 
                      : lastTimestamp;
                    if (!isNaN(timestampValue) && (now - timestampValue) > this.ERROR_LOG_MAX_AGE) {
                      shouldDelete = true;
                    }
                  }
                } else if (!Array.isArray(data) && data.timestamp) {
                  // Single log entry with timestamp
                  const timestampValue = typeof data.timestamp === 'string'
                    ? new Date(data.timestamp).getTime()
                    : data.timestamp;
                  if (!isNaN(timestampValue) && (now - timestampValue) > this.ERROR_LOG_MAX_AGE) {
                    shouldDelete = true;
                  }
                }
              } catch (parseError: any) {
                // If we can't parse, consider deleting if the key exists
                // (safer to keep it if we can't determine age)
                logger.warn('AsyncStorageCleanupService', `Could not parse ${key} for age check`, { error: parseError.message });
              }

              if (shouldDelete) {
                keysToDelete.push(key);
              }
            }
          } catch (error: any) {
            logger.warn('AsyncStorageCleanupService', `Failed to check age for ${key}`, { error: error.message });
          }
        }
      }

      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
        logger.info('AsyncStorageCleanupService', `🧹 Cleaned up ${keysToDelete.length} old log entries`);
      } else {
        logger.info('AsyncStorageCleanupService', 'ℹ️  No old logs to clean up');
      }

      return {
        success: true,
        deletedCount: keysToDelete.length,
        deletedKeys: keysToDelete
      };
    } catch (error: any) {
      logger.error('AsyncStorageCleanupService', error, { operation: 'cleanupOldLogs' });
      return {
        success: false,
        error: error.message,
        deletedCount: 0
      };
    }
  }

  /**
   * Get total AsyncStorage size
   * Calculates size of all stored data
   *
   * @returns Storage size info
   */
  static async getStorageSize(): Promise<StorageSizeResult> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      const sizeByCategory: StorageSizeByCategory = {
        entryGuides: 0,
        biometric: 0,
        backup: 0,
        logs: 0,
        errors: 0,
        other: 0
      };

      // Fetch all values in parallel for better performance (10-100x faster)
      const keyValuePairs = await AsyncStorage.multiGet(allKeys);

      for (const [key, value] of keyValuePairs) {
        const size = value ? value.length : 0;
        totalSize += size;

        // Categorize
        if (key.includes('_entry_progress')) {
          sizeByCategory.entryGuides += size;
        } else if (key.startsWith('biometric_')) {
          sizeByCategory.biometric += size;
        } else if (key.includes('backup') || key.includes('recovery')) {
          sizeByCategory.backup += size;
        } else if (key.startsWith('tdac_submission_log_')) {
          sizeByCategory.logs += size;
        } else if (key.includes('error') || key.includes('failure')) {
          sizeByCategory.errors += size;
        } else {
          sizeByCategory.other += size;
        }
      }

      return {
        totalSize,
        totalKeys: allKeys.length,
        sizeByCategory,
        sizeInKB: (totalSize / 1024).toFixed(2),
        sizeInMB: (totalSize / 1024 / 1024).toFixed(2)
      };
    } catch (error: any) {
      logger.error('AsyncStorageCleanupService', error, { operation: 'getStorageSize' });
      return {
        totalSize: 0,
        totalKeys: 0,
        sizeByCategory: {
          entryGuides: 0,
          biometric: 0,
          backup: 0,
          logs: 0,
          errors: 0,
          other: 0
        },
        sizeInKB: '0.00',
        sizeInMB: '0.00',
        error: error.message
      };
    }
  }

  /**
   * List all AsyncStorage keys by category
   *
   * @returns Keys grouped by category
   */
  static async listKeysByCategory(): Promise<CategorizedKeys> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const categorized: CategorizedKeys = {
        entryGuides: [],
        biometric: [],
        backup: [],
        logs: [],
        errors: [],
        protected: [],
        other: []
      };

      for (const key of allKeys) {
        if (this.PROTECTED_KEYS.includes(key)) {
          categorized.protected.push(key);
        } else if (key.includes('_entry_progress')) {
          categorized.entryGuides.push(key);
        } else if (key.startsWith('biometric_')) {
          categorized.biometric.push(key);
        } else if (key.includes('backup') || key.includes('recovery')) {
          categorized.backup.push(key);
        } else if (key.startsWith('tdac_submission_log_')) {
          categorized.logs.push(key);
        } else if (key.includes('error') || key.includes('failure')) {
          categorized.errors.push(key);
        } else {
          categorized.other.push(key);
        }
      }

      return categorized;
    } catch (error: any) {
      logger.error('AsyncStorageCleanupService', error, { operation: 'listKeysByCategory' });
      return {
        entryGuides: [],
        biometric: [],
        backup: [],
        logs: [],
        errors: [],
        protected: [],
        other: [],
        error: error.message
      };
    }
  }

  /**
   * Clean up all non-protected keys (USE WITH CAUTION)
   *
   * @returns Cleanup result
   */
  static async cleanupAllNonProtected(): Promise<CleanupResult> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToDelete = allKeys.filter(
        key => !this.PROTECTED_KEYS.includes(key)
      );

      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
        logger.info('AsyncStorageCleanupService', `🧹 Cleaned up ${keysToDelete.length} non-protected keys`);
      }

      return {
        success: true,
        deletedCount: keysToDelete.length,
        deletedKeys: keysToDelete
      };
    } catch (error: any) {
      logger.error('AsyncStorageCleanupService', error, { operation: 'cleanupAllNonProtected' });
      return {
        success: false,
        error: error.message,
        deletedCount: 0
      };
    }
  }

  /**
   * Get storage health report
   *
   * @returns Health report
   */
  static async getHealthReport(): Promise<HealthReport> {
    try {
      const size = await this.getStorageSize();
      const keys = await this.listKeysByCategory();

      const warnings: string[] = [];
      const recommendations: string[] = [];

      // Check size
      const sizeInMB = parseFloat(size.sizeInMB);
      if (sizeInMB > 5) {
        warnings.push(`AsyncStorage size is ${sizeInMB}MB (threshold: 5MB)`);
        recommendations.push('Run cleanup to remove old logs');
      }

      // Check log count
      const logCount = keys.logs?.length || 0;
      if (logCount > 50) {
        warnings.push(`${logCount} TDAC submission logs stored`);
        recommendations.push('Clean up old submission logs (> 30 days)');
      }

      // Check error log count
      const errorCount = keys.errors?.length || 0;
      if (errorCount > 20) {
        warnings.push(`${errorCount} error logs stored`);
        recommendations.push('Clean up old error logs (> 7 days)');
      }

      return {
        status: warnings.length > 0 ? 'warning' : 'healthy',
        size,
        keys,
        warnings,
        recommendations,
        lastChecked: new Date().toISOString()
      };
    } catch (error: any) {
      logger.error('AsyncStorageCleanupService', error, { operation: 'getHealthReport' });
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Schedule automatic cleanup (call on app start)
   * Validates timestamp parsing to prevent NaN calculations
   */
  static async scheduleAutomaticCleanup(): Promise<void> {
    try {
      // Check if cleanup is needed
      const lastCleanup = await AsyncStorage.getItem('last_cleanup_date');
      const now = Date.now();

      let daysSinceCleanup = 999; // Default to "needs cleanup"

      if (lastCleanup) {
        const lastCleanupTimestamp = parseInt(lastCleanup, 10);
        // Validate parsed timestamp
        if (!isNaN(lastCleanupTimestamp) && lastCleanupTimestamp > 0 && lastCleanupTimestamp <= now) {
          daysSinceCleanup = (now - lastCleanupTimestamp) / (24 * 60 * 60 * 1000);
        } else {
          logger.warn('AsyncStorageCleanupService', `⚠️  Invalid last_cleanup_date: ${lastCleanup}, will run cleanup`);
        }
      }

      // Run cleanup weekly
      if (daysSinceCleanup > 7) {
        logger.info('AsyncStorageCleanupService', '🧹 Running scheduled AsyncStorage cleanup...');
        await this.cleanupOldLogs();
        await AsyncStorage.setItem('last_cleanup_date', now.toString());
        logger.info('AsyncStorageCleanupService', '✅ Scheduled cleanup complete');
      } else {
        logger.info('AsyncStorageCleanupService', `ℹ️  Next cleanup in ${Math.ceil(7 - daysSinceCleanup)} days`);
      }
    } catch (error: any) {
      logger.error('AsyncStorageCleanupService', error, { operation: 'scheduleAutomaticCleanup' });
    }
  }

  /**
   * Extract timestamp from log key name
   * @private
   */
  static extractTimestampFromKey(key: string): number | null {
    const match = key.match(/_(\d{13})$/);  // Matches 13-digit timestamp
    if (match) {
      const timestamp = parseInt(match[1], 10);
      return isNaN(timestamp) ? null : timestamp;
    }
    return null;
  }
}

export default AsyncStorageCleanupService;
export type {
  CleanupResult,
  StorageSizeByCategory,
  StorageSizeResult,
  CategorizedKeys,
  HealthReport,
  LogEntry
};

