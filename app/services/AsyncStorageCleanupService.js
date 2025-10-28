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

class AsyncStorageCleanupService {
  // Keys that should NEVER be deleted
  static PROTECTED_KEYS = [
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
  ];

  // Age threshold for logs (in milliseconds)
  static LOG_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
  static ERROR_LOG_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Clean up old TDAC submission logs
   * Removes logs older than 30 days
   *
   * @returns {Promise<Object>} - Cleanup result
   */
  static async cleanupOldLogs() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const now = Date.now();
      const keysToDelete = [];

      for (const key of allKeys) {
        // TDAC submission logs
        if (key.startsWith('tdac_submission_log_')) {
          const timestamp = this.extractTimestampFromKey(key);
          if (timestamp && (now - timestamp) > this.LOG_MAX_AGE) {
            keysToDelete.push(key);
          }
        }

        // Error logs
        if (key.startsWith('tdac_submission_failure_') ||
            key === 'tdac_error_log' ||
            key === 'snapshot_creation_failures' ||
            key === 'entry_info_status_update_failures') {
          // Keep error logs for shorter period
          const timestamp = this.extractTimestampFromKey(key);
          if (timestamp && (now - timestamp) > this.ERROR_LOG_MAX_AGE) {
            keysToDelete.push(key);
          }
        }
      }

      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
        console.log(`🧹 Cleaned up ${keysToDelete.length} old log entries`);
      } else {
        console.log('ℹ️  No old logs to clean up');
      }

      return {
        success: true,
        deletedCount: keysToDelete.length,
        deletedKeys: keysToDelete
      };
    } catch (error) {
      console.error('❌ Failed to clean up old logs:', error);
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
   * @returns {Promise<Object>} - Storage size info
   */
  static async getStorageSize() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      const sizeByCategory = {
        entryGuides: 0,
        biometric: 0,
        backup: 0,
        logs: 0,
        errors: 0,
        other: 0
      };

      for (const key of allKeys) {
        const value = await AsyncStorage.getItem(key);
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
    } catch (error) {
      console.error('❌ Failed to get storage size:', error);
      return {
        totalSize: 0,
        totalKeys: 0,
        error: error.message
      };
    }
  }

  /**
   * List all AsyncStorage keys by category
   *
   * @returns {Promise<Object>} - Keys grouped by category
   */
  static async listKeysByCategory() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const categorized = {
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
    } catch (error) {
      console.error('❌ Failed to list keys:', error);
      return {
        error: error.message
      };
    }
  }

  /**
   * Clean up all non-protected keys (USE WITH CAUTION)
   *
   * @returns {Promise<Object>} - Cleanup result
   */
  static async cleanupAllNonProtected() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToDelete = allKeys.filter(
        key => !this.PROTECTED_KEYS.includes(key)
      );

      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
        console.log(`🧹 Cleaned up ${keysToDelete.length} non-protected keys`);
      }

      return {
        success: true,
        deletedCount: keysToDelete.length,
        deletedKeys: keysToDelete
      };
    } catch (error) {
      console.error('❌ Failed to cleanup non-protected keys:', error);
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
   * @returns {Promise<Object>} - Health report
   */
  static async getHealthReport() {
    try {
      const size = await this.getStorageSize();
      const keys = await this.listKeysByCategory();

      const warnings = [];
      const recommendations = [];

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
    } catch (error) {
      console.error('❌ Failed to generate health report:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Schedule automatic cleanup (call on app start)
   *
   * @returns {Promise<void>}
   */
  static async scheduleAutomaticCleanup() {
    try {
      // Check if cleanup is needed
      const lastCleanup = await AsyncStorage.getItem('last_cleanup_date');
      const now = Date.now();
      const daysSinceCleanup = lastCleanup
        ? (now - parseInt(lastCleanup)) / (24 * 60 * 60 * 1000)
        : 999;

      // Run cleanup weekly
      if (daysSinceCleanup > 7) {
        console.log('🧹 Running scheduled AsyncStorage cleanup...');
        await this.cleanupOldLogs();
        await AsyncStorage.setItem('last_cleanup_date', now.toString());
        console.log('✅ Scheduled cleanup complete');
      } else {
        console.log(`ℹ️  Next cleanup in ${Math.ceil(7 - daysSinceCleanup)} days`);
      }
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error);
    }
  }

  /**
   * Extract timestamp from log key name
   * @private
   */
  static extractTimestampFromKey(key) {
    const match = key.match(/_(\d{13})$/);  // Matches 13-digit timestamp
    return match ? parseInt(match[1]) : null;
  }
}

export default AsyncStorageCleanupService;
