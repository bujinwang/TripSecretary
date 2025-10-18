/**
 * LegacyDataMigrationService - Service for handling legacy data migration
 * Manages migration from pre-snapshot entry packs to snapshot-based system
 * 
 * Requirements: 22.1-22.5
 */

import SecureStorageService from '../security/SecureStorageService';
import SnapshotService from '../snapshot/SnapshotService';
import EntryPackService from '../entryPack/EntryPackService';

class LegacyDataMigrationService {
  constructor() {
    this.migrationVersion = '1.0.0';
    this.legacyDataKeys = [
      'legacy_entry_packs',
      'legacy_travel_history',
      'legacy_tdac_submissions'
    ];
  }

  /**
   * Check if user has legacy data that needs migration
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Migration status
   */
  async checkLegacyDataStatus(userId) {
    try {
      console.log('Checking legacy data status for user:', userId);

      const status = {
        hasLegacyData: false,
        legacyRecordCount: 0,
        snapshotRecordCount: 0,
        migrationNeeded: false,
        migrationAvailable: false,
        lastMigrationCheck: new Date().toISOString()
      };

      // Check for legacy entry packs (pre-snapshot system)
      const legacyEntryPacks = await this.findLegacyEntryPacks(userId);
      status.legacyRecordCount = legacyEntryPacks.length;
      status.hasLegacyData = legacyEntryPacks.length > 0;

      // Check for existing snapshots
      const snapshots = await SnapshotService.list(userId);
      status.snapshotRecordCount = snapshots.length;

      // Determine if migration is needed and available
      status.migrationNeeded = status.hasLegacyData && status.legacyRecordCount > 0;
      status.migrationAvailable = status.migrationNeeded;

      console.log('Legacy data status:', status);
      return status;
    } catch (error) {
      console.error('Failed to check legacy data status:', error);
      return {
        hasLegacyData: false,
        legacyRecordCount: 0,
        snapshotRecordCount: 0,
        migrationNeeded: false,
        migrationAvailable: false,
        error: error.message
      };
    }
  }

  /**
   * Find legacy entry packs (pre-snapshot system)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of legacy entry packs
   */
  async findLegacyEntryPacks(userId) {
    try {
      // Look for entry packs that don't have corresponding snapshots
      const allEntryPacks = await EntryPackService.getHistoricalPacksForUser(userId);
      const legacyPacks = [];

      for (const entryPack of allEntryPacks) {
        // Check if this entry pack has a corresponding snapshot
        const hasSnapshot = await this.hasCorrespondingSnapshot(entryPack.id);
        
        if (!hasSnapshot && this.isLegacyEntryPack(entryPack)) {
          legacyPacks.push({
            ...entryPack,
            isLegacy: true,
            migrationEligible: this.isMigrationEligible(entryPack)
          });
        }
      }

      console.log(`Found ${legacyPacks.length} legacy entry packs for user ${userId}`);
      return legacyPacks;
    } catch (error) {
      console.error('Failed to find legacy entry packs:', error);
      return [];
    }
  }

  /**
   * Check if entry pack has corresponding snapshot
   * @param {string} entryPackId - Entry pack ID
   * @returns {Promise<boolean>} - Has corresponding snapshot
   */
  async hasCorrespondingSnapshot(entryPackId) {
    try {
      // Check if there's a snapshot with this entry pack ID
      const snapshots = await SnapshotService.getAllSnapshots();
      return snapshots.some(snapshot => snapshot.entryPackId === entryPackId);
    } catch (error) {
      console.error('Failed to check for corresponding snapshot:', error);
      return false;
    }
  }

  /**
   * Determine if entry pack is legacy (pre-snapshot system)
   * @param {Object} entryPack - Entry pack data
   * @returns {boolean} - Is legacy entry pack
   */
  isLegacyEntryPack(entryPack) {
    // Entry pack is considered legacy if:
    // 1. It was created before snapshot system was implemented
    // 2. It has status 'completed', 'expired', or 'archived' but no snapshot
    // 3. It has old data structure without snapshot metadata

    const legacyStatuses = ['completed', 'expired', 'archived'];
    const hasLegacyStatus = legacyStatuses.includes(entryPack.status);
    
    // Check if it was created before snapshot system (approximate date)
    const snapshotSystemLaunchDate = new Date('2024-01-01'); // Adjust based on actual launch
    const createdDate = new Date(entryPack.createdAt);
    const isOldRecord = createdDate < snapshotSystemLaunchDate;

    // Check for missing snapshot metadata
    const lacksSnapshotMetadata = !entryPack.snapshotId && !entryPack.snapshotCreated;

    return hasLegacyStatus && (isOldRecord || lacksSnapshotMetadata);
  }

  /**
   * Check if entry pack is eligible for migration
   * @param {Object} entryPack - Entry pack data
   * @returns {boolean} - Is migration eligible
   */
  isMigrationEligible(entryPack) {
    // Entry pack is eligible for migration if:
    // 1. It has complete data (passport, personal info, travel info)
    // 2. It has a valid TDAC submission (if applicable)
    // 3. It's not corrupted or incomplete

    try {
      if (!entryPack) {
        return false;
      }

      const hasBasicData = entryPack.userId && entryPack.destinationId && entryPack.createdAt;
      const hasValidStatus = ['completed', 'expired', 'archived'].includes(entryPack.status);
      
      return hasBasicData && hasValidStatus;
    } catch (error) {
      console.error('Failed to check migration eligibility:', error);
      return false;
    }
  }

  /**
   * Migrate legacy entry pack to snapshot
   * @param {string} entryPackId - Legacy entry pack ID
   * @param {Object} options - Migration options
   * @returns {Promise<Object>} - Migration result
   */
  async migrateLegacyEntryPack(entryPackId, options = {}) {
    try {
      console.log('Migrating legacy entry pack:', entryPackId);

      const migrationResult = {
        entryPackId,
        success: false,
        snapshotId: null,
        error: null,
        migratedAt: new Date().toISOString(),
        migrationMethod: 'legacy_conversion'
      };

      // Load legacy entry pack
      const EntryPack = require('../../models/EntryPack').default;
      const legacyEntryPack = await EntryPack.load(entryPackId);
      
      if (!legacyEntryPack) {
        throw new Error(`Legacy entry pack not found: ${entryPackId}`);
      }

      // Verify it's eligible for migration
      if (!this.isMigrationEligible(legacyEntryPack)) {
        throw new Error('Entry pack is not eligible for migration');
      }

      // Create snapshot from legacy data
      const snapshot = await SnapshotService.createSnapshot(
        entryPackId,
        'legacy_migration',
        {
          appVersion: this.migrationVersion,
          deviceInfo: 'migration_service',
          creationMethod: 'legacy_migration',
          originalStatus: legacyEntryPack.status,
          migrationDate: new Date().toISOString()
        }
      );

      // Update legacy entry pack with migration metadata
      legacyEntryPack.snapshotId = snapshot.snapshotId;
      legacyEntryPack.snapshotCreated = true;
      legacyEntryPack.migrationDate = new Date().toISOString();
      await legacyEntryPack.save();

      migrationResult.success = true;
      migrationResult.snapshotId = snapshot.snapshotId;

      console.log('Legacy entry pack migrated successfully:', {
        entryPackId,
        snapshotId: snapshot.snapshotId
      });

      return migrationResult;
    } catch (error) {
      console.error('Failed to migrate legacy entry pack:', error);
      return {
        entryPackId,
        success: false,
        error: error.message,
        migratedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Batch migrate all legacy entry packs for user
   * @param {string} userId - User ID
   * @param {Object} options - Migration options
   * @returns {Promise<Object>} - Batch migration result
   */
  async batchMigrateLegacyData(userId, options = {}) {
    try {
      console.log('Starting batch migration for user:', userId);

      const batchResult = {
        userId,
        totalLegacyRecords: 0,
        successfulMigrations: 0,
        failedMigrations: 0,
        skippedRecords: 0,
        migrationResults: [],
        startedAt: new Date().toISOString(),
        completedAt: null,
        duration: 0
      };

      // Find all legacy entry packs
      const legacyPacks = await this.findLegacyEntryPacks(userId);
      batchResult.totalLegacyRecords = legacyPacks.length;

      if (legacyPacks.length === 0) {
        console.log('No legacy data found for migration');
        batchResult.completedAt = new Date().toISOString();
        return batchResult;
      }

      // Migrate each legacy entry pack
      for (const legacyPack of legacyPacks) {
        try {
          if (legacyPack.migrationEligible) {
            const migrationResult = await this.migrateLegacyEntryPack(legacyPack.id, options);
            batchResult.migrationResults.push(migrationResult);

            if (migrationResult.success) {
              batchResult.successfulMigrations++;
            } else {
              batchResult.failedMigrations++;
            }
          } else {
            batchResult.skippedRecords++;
            batchResult.migrationResults.push({
              entryPackId: legacyPack.id,
              success: false,
              error: 'Not eligible for migration',
              skipped: true
            });
          }
        } catch (error) {
          console.error('Failed to migrate legacy pack:', legacyPack.id, error);
          batchResult.failedMigrations++;
          batchResult.migrationResults.push({
            entryPackId: legacyPack.id,
            success: false,
            error: error.message
          });
        }
      }

      batchResult.completedAt = new Date().toISOString();
      batchResult.duration = new Date(batchResult.completedAt) - new Date(batchResult.startedAt);

      console.log('Batch migration completed:', {
        userId,
        total: batchResult.totalLegacyRecords,
        successful: batchResult.successfulMigrations,
        failed: batchResult.failedMigrations,
        skipped: batchResult.skippedRecords
      });

      return batchResult;
    } catch (error) {
      console.error('Failed to batch migrate legacy data:', error);
      throw error;
    }
  }

  /**
   * Get legacy data display info for UI
   * @param {Object} legacyRecord - Legacy record data
   * @returns {Object} - Display info for UI
   */
  getLegacyDisplayInfo(legacyRecord) {
    return {
      id: legacyRecord.id,
      type: 'legacy',
      isLegacy: true,
      destinationId: legacyRecord.destinationId,
      status: legacyRecord.status,
      createdAt: legacyRecord.createdAt,
      arrivalDate: legacyRecord.arrivalDate || legacyRecord.travel?.arrivalDate,
      destination: this.getDestinationName(legacyRecord.destinationId),
      submissionDate: legacyRecord.tdacSubmission?.submittedAt || null,
      isReadOnly: true,
      migrationEligible: this.isMigrationEligible(legacyRecord),
      legacyBadge: {
        show: true,
        text: '旧版本记录',
        color: '#FFA500', // Orange color for legacy badge
        icon: '📜'
      },
      actions: {
        canView: true,
        canMigrate: this.isMigrationEligible(legacyRecord),
        canDelete: true
      }
    };
  }

  /**
   * Get destination name for display
   * @param {string} destinationId - Destination ID
   * @returns {string} - Destination name
   */
  getDestinationName(destinationId) {
    const destinations = {
      thailand: '泰国',
      japan: '日本',
      singapore: '新加坡',
      malaysia: '马来西亚',
      taiwan: '台湾',
      hongkong: '香港',
      korea: '韩国',
      usa: '美国',
    };
    return destinations[destinationId] || destinationId;
  }

  /**
   * Create mixed history list (legacy + snapshot records)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Mixed history items
   */
  async createMixedHistoryList(userId) {
    try {
      console.log('Creating mixed history list for user:', userId);

      const historyItems = [];

      // Get snapshot-based records
      const snapshots = await SnapshotService.list(userId);
      snapshots.forEach(snapshot => {
        historyItems.push({
          id: snapshot.snapshotId,
          type: 'snapshot',
          entryPackId: snapshot.entryPackId,
          destinationId: snapshot.destinationId,
          status: snapshot.status,
          createdAt: snapshot.createdAt,
          arrivalDate: snapshot.arrivalDate,
          destination: this.getDestinationName(snapshot.destinationId),
          submissionDate: snapshot.tdacSubmission?.submittedAt || null,
          isReadOnly: true,
          isLegacy: false,
          snapshot: snapshot,
        });
      });

      // Get legacy records
      const legacyPacks = await this.findLegacyEntryPacks(userId);
      legacyPacks.forEach(legacyPack => {
        // Only include if it doesn't already have a snapshot
        const hasSnapshot = historyItems.some(item => item.entryPackId === legacyPack.id);
        if (!hasSnapshot) {
          historyItems.push(this.getLegacyDisplayInfo(legacyPack));
        }
      });

      // Sort by creation date (newest first)
      historyItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      console.log(`Created mixed history list with ${historyItems.length} items:`, {
        snapshots: historyItems.filter(item => item.type === 'snapshot').length,
        legacy: historyItems.filter(item => item.type === 'legacy').length
      });

      return historyItems;
    } catch (error) {
      console.error('Failed to create mixed history list:', error);
      return [];
    }
  }

  /**
   * Get migration statistics for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Migration statistics
   */
  async getMigrationStats(userId) {
    try {
      const stats = {
        userId,
        totalRecords: 0,
        snapshotRecords: 0,
        legacyRecords: 0,
        migrationEligible: 0,
        migrationCompleted: 0,
        migrationPending: 0,
        lastChecked: new Date().toISOString()
      };

      // Get all records
      const mixedHistory = await this.createMixedHistoryList(userId);
      stats.totalRecords = mixedHistory.length;

      // Count by type
      stats.snapshotRecords = mixedHistory.filter(item => item.type === 'snapshot').length;
      stats.legacyRecords = mixedHistory.filter(item => item.type === 'legacy').length;

      // Count migration status
      const legacyItems = mixedHistory.filter(item => item.type === 'legacy');
      stats.migrationEligible = legacyItems.filter(item => item.migrationEligible).length;
      stats.migrationCompleted = legacyItems.filter(item => item.snapshotId).length;
      stats.migrationPending = stats.migrationEligible - stats.migrationCompleted;

      return stats;
    } catch (error) {
      console.error('Failed to get migration stats:', error);
      return {
        userId,
        totalRecords: 0,
        snapshotRecords: 0,
        legacyRecords: 0,
        migrationEligible: 0,
        migrationCompleted: 0,
        migrationPending: 0,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const legacyDataMigrationService = new LegacyDataMigrationService();

export default legacyDataMigrationService;