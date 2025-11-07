/**
 * SnapshotService - Service for managing entry info snapshots
 * Creates and manages immutable historical records of entry info
 *
 * Requirements: 11.1-11.7, 14.1-14.5, 15.1-15.7, 19.1-19.5
 */

import EntryPackSnapshot from '../../models/EntryPackSnapshot';
import * as FileSystem from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import DataEncryptionService from '../security/DataEncryptionService';
import logger from '../LoggingService';
import type { UserId } from '../../types';

// Type assertions for expo-file-system API (not fully typed)
type FileSystemDirectory = {
  exists(): Promise<boolean>;
  list(): Promise<string[]>;
  delete(): Promise<void>;
};

type FileSystemFile = {
  exists(): Promise<boolean>;
  copy(dest: string): Promise<void>;
  size: number;
};

// Type definitions
interface SnapshotMetadata {
  appVersion?: string;
  deviceInfo?: string;
  creationMethod?: 'auto' | 'manual';
  snapshotReason?: string;
  [key: string]: any;
}

interface PhotoManifestEntry {
  fundItemId: string;
  fundType?: string;
  originalPath: string | null;
  snapshotPath: string | null;
  fileName: string | null;
  fileSize: number;
  copiedAt: string;
  status: 'success' | 'missing' | 'failed' | 'no_photo';
  error?: string | null;
  encrypted?: boolean;
}

interface SnapshotFilters {
  status?: string;
  destinationId?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

interface RetentionPolicy {
  maxAge?: number; // days
  maxCount?: number;
  keepCompleted?: boolean;
}

interface StorageUsage {
  totalSize: number;
  snapshotCount: number;
  photoCount: number;
  averageSnapshotSize: number;
  formattedSize: string;
}

interface CleanupResult {
  deletedCount: number;
  freedSpace: number;
  formattedFreedSpace: string;
}

interface AuditEventMetadata {
  reason?: string;
  entryInfoId?: string;
  creationMethod?: string;
  viewedAt?: string;
  deletedAt?: string;
  photoCount?: number;
  exportedAt?: string;
  includePhotos?: boolean;
  [key: string]: any;
}

interface PhotoValidationResult {
  isValid: boolean;
  error?: string;
  size?: number;
  sizeMB?: string;
}

interface PhotoDisplayInfo {
  fundItemId: string;
  fundType: string;
  hasPhoto: boolean;
  photoPath: string | null;
  displayText: string;
  displayIcon: string;
  status: string;
  error: string | null;
}

interface OrphanedPhotoCleanupResult {
  scannedDirectories: number;
  orphanedDirectories: number;
  deletedDirectories: string[];
  reclaimedSpaceBytes: number;
  errors: Array<{ directory: string; error: string }>;
}

interface PhotoIntegrityVerificationResult {
  snapshotId: string;
  totalPhotos: number;
  validPhotos: number;
  corruptedPhotos: number;
  missingPhotos: number;
  issues: Array<{
    fundItemId: string;
    issue: string;
    path?: string;
    expected?: number;
    actual?: number;
    error?: string;
  }>;
}

interface ExportOptions {
  includePhotos?: boolean;
  [key: string]: any;
}

interface ServiceStats {
  storageDir: string;
  totalSize: number;
  snapshotCount: number;
  photoCount: number;
  averageSnapshotSize?: number;
  formattedSize?: string;
}

interface CompleteEntryInfoData {
  id: string;
  userId: UserId;
  destinationId: string;
  passport?: any;
  personalInfo?: any;
  funds?: any[];
  travel?: any;
  [key: string]: any;
}

interface FundItem {
  id: string;
  photoUri?: string;
  type?: string;
  [key: string]: any;
}

class SnapshotService {
  private snapshotStorageDir: string;
  private encryptionService: typeof DataEncryptionService;
  private encryptionEnabled: boolean;
  private initialized: boolean;

  constructor() {
    // Use type assertion for documentDirectory (not fully typed in expo-file-system)
    this.snapshotStorageDir = (FileSystem as any).documentDirectory + 'snapshots/';
    this.encryptionService = DataEncryptionService;
    this.encryptionEnabled = true; // Enable encryption for snapshots by default
    this.initialized = false;
    // Don't call initializeStorage() in constructor - it's async
  }

  /**
   * Initialize snapshot storage directory and encryption
   */
  async initializeStorage(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const snapshotDir = new FileSystem.Directory(this.snapshotStorageDir) as unknown as FileSystemDirectory;
      const dirExists = await snapshotDir.exists();
      if (!dirExists) {
        await LegacyFileSystem.makeDirectoryAsync(this.snapshotStorageDir, { intermediates: true });
        logger.info('SnapshotService', 'Snapshot storage directory created', { path: this.snapshotStorageDir });
      }
      this.initialized = true;
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'initializeStorage' });
    }
  }

  /**
   * Ensure service is initialized before operations
   */
  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeStorage();
    }
  }

  /**
   * Initialize encryption for snapshots
   * @param userId - User ID for encryption setup
   */
  async initializeEncryption(userId: UserId): Promise<void> {
    try {
      if (this.encryptionEnabled) {
        await this.encryptionService.initialize(userId);
        logger.info('SnapshotService', 'Snapshot encryption initialized for user', { userId });
      }
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'initializeEncryption', userId });
      // Don't throw error - allow snapshots to work without encryption
      this.encryptionEnabled = false;
    }
  }

  /**
   * Create snapshot from entry info
   * @param entryInfoId - Entry info ID
   * @param reason - Snapshot creation reason ('completed', 'expired', 'cancelled', 'manual_archive')
   * @param metadata - Additional metadata
   * @returns Created snapshot
   */
  async createSnapshot(
    entryInfoId: string,
    reason: string = 'completed',
    metadata: SnapshotMetadata = {}
  ): Promise<EntryPackSnapshot> {
    await this.ensureInitialized();

    try {
      logger.info('SnapshotService', 'Creating snapshot', {
        entryInfoId,
        reason,
        metadata
      });

      // Load complete entry info data
      const entryInfoData = await this.loadCompleteEntryInfoData(entryInfoId);
      if (!entryInfoData) {
        throw new Error(`Entry info not found: ${entryInfoId}`);
      }

      // Create snapshot instance
      const snapshot = EntryPackSnapshot.createFromEntryPack(entryInfoData, reason, {
        appVersion: metadata.appVersion || '1.0.0',
        deviceInfo: metadata.deviceInfo || 'unknown',
        creationMethod: metadata.creationMethod || 'auto'
      });

      // Copy photos to snapshot storage
      const photoManifest = await this.copyPhotosToSnapshotStorage(entryInfoData.funds || [], snapshot.snapshotId);

      // Encrypt photos if encryption is enabled
      let encryptedPhotos = photoManifest;
      if (this.encryptionEnabled) {
        try {
          encryptedPhotos = await this.encryptionService.encryptSnapshotPhotos(photoManifest, snapshot.snapshotId);
          logger.info('SnapshotService', 'Snapshot photos encrypted', {
            snapshotId: snapshot.snapshotId,
            photoCount: encryptedPhotos.length,
            encryptedCount: encryptedPhotos.filter((p: PhotoManifestEntry) => p.encrypted).length
          });
        } catch (encryptionError: any) {
          logger.error('SnapshotService', encryptionError, { operation: 'encryptSnapshotPhotos' });
          // Continue with unencrypted photos
        }
      }

      // Update photo manifest with encryption info
      snapshot.updatePhotoManifest(encryptedPhotos);

      // Encrypt snapshot data if encryption is enabled
      if (this.encryptionEnabled) {
        try {
          const snapshotData = snapshot.exportData();
          const encryptionResult = await this.encryptionService.encryptSnapshotData(snapshotData, snapshot.snapshotId);

          // Update snapshot with encryption info
          snapshot.setEncryptionInfo(encryptionResult);

          logger.info('SnapshotService', 'Snapshot data encrypted', {
            snapshotId: snapshot.snapshotId,
            encrypted: encryptionResult.encrypted,
            encryptionMethod: encryptionResult.encryptionMethod
          });
        } catch (encryptionError: any) {
          logger.error('SnapshotService', encryptionError, { operation: 'encryptSnapshotData' });
          // Continue with unencrypted snapshot
        }
      }

      // Save snapshot to storage
      await snapshot.save();

      // Record audit log
      await this.recordAuditEvent(snapshot.snapshotId, 'created', {
        reason,
        entryInfoId,
        creationMethod: metadata.creationMethod || 'auto'
      });

      logger.info('SnapshotService', 'Snapshot created successfully', {
        snapshotId: snapshot.snapshotId,
        entryInfoId,
        reason,
        photoCount: snapshot.getPhotoCount()
      });

      return snapshot;
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'createSnapshot', entryInfoId });
      throw error;
    }
  }

  /**
   * Load complete entry info data with all related information
   * @param entryInfoId - Entry info ID
   * @returns Complete entry info data
   */
  async loadCompleteEntryInfoData(entryInfoId: string): Promise<CompleteEntryInfoData | null> {
    try {
      // Load entry info
      const EntryInfo = require('../../models/EntryInfo').default;
      const entryInfo = await EntryInfo.load(entryInfoId);
      if (!entryInfo) {
        return null;
      }

      // Load complete data from entry info
      const completeData = await entryInfo.getCompleteData();

      // Load funds separately using UserDataService
      let funds: any[] = [];
      if (entryInfo.userId) {
        try {
          const UserDataService = require('../data/UserDataService').default;
          funds = await UserDataService.getFundItems(entryInfo.userId) || [];
          logger.debug('SnapshotService', 'Loaded funds for snapshot', {
            userId: entryInfo.userId,
            fundCount: funds.length
          });
        } catch (fundError: any) {
          logger.warn('SnapshotService', 'Failed to load funds for snapshot', { error: fundError.message });
        }
      }

      // Load travel info separately if not in completeData
      let travel = completeData.travel || {};
      if (entryInfo.userId && entryInfo.destinationId && (!travel || Object.keys(travel).length === 0)) {
        try {
          const UserDataService = require('../data/UserDataService').default;
          const travelInfo = await UserDataService.getTravelInfo(entryInfo.userId, entryInfo.destinationId);
          if (travelInfo) {
            travel = travelInfo;
            logger.debug('SnapshotService', 'Loaded travel info for snapshot', {
              userId: entryInfo.userId,
              destinationId: entryInfo.destinationId
            });
          }
        } catch (travelError: any) {
          logger.warn('SnapshotService', 'Failed to load travel info for snapshot', { error: travelError.message });
        }
      }

      // Combine all data
      return {
        ...entryInfo.exportData(),
        passport: completeData.passport,
        personalInfo: completeData.personalInfo,
        funds: funds,
        travel: travel
      };
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'loadCompleteEntryInfoData', entryInfoId });
      return null;
    }
  }

  /**
   * Copy photos to snapshot storage
   * @param funds - Fund items array
   * @param snapshotId - Snapshot ID
   * @returns Array of copied photo info
   */
  async copyPhotosToSnapshotStorage(funds: FundItem[], snapshotId: string): Promise<PhotoManifestEntry[]> {
    try {
      const copiedPhotos: PhotoManifestEntry[] = [];
      const failedPhotos: PhotoManifestEntry[] = [];
      const snapshotPhotoDir = `${this.snapshotStorageDir}${snapshotId}/`;

      // Create snapshot photo directory
      await LegacyFileSystem.makeDirectoryAsync(snapshotPhotoDir, { intermediates: true });

      logger.info('SnapshotService', `Copying ${funds.length} fund photos to snapshot storage`, { snapshotPhotoDir });

      for (const fund of funds) {
        if (fund.photoUri) {
          try {
            // Generate snapshot photo filename using naming convention
            const timestamp = Date.now();
            const fileName = `snapshot_${snapshotId}_${fund.id}_${timestamp}.jpg`;
            const snapshotPhotoPath = `${snapshotPhotoDir}${fileName}`;

            // Check if original photo exists
            const originalPhoto = new FileSystem.File(fund.photoUri) as unknown as FileSystemFile;
            if (await originalPhoto.exists()) {
              // Validate photo file size (prevent copying corrupted files)
              if (originalPhoto.size > 0) {
                // Copy photo to snapshot storage
                await originalPhoto.copy(snapshotPhotoPath);

                // Verify copy was successful
                const copiedPhoto = new FileSystem.File(snapshotPhotoPath) as unknown as FileSystemFile;
                if (await copiedPhoto.exists() && copiedPhoto.size === originalPhoto.size) {
                  copiedPhotos.push({
                    fundItemId: fund.id,
                    fundType: fund.type || 'unknown',
                    originalPath: fund.photoUri,
                    snapshotPath: snapshotPhotoPath,
                    fileName: fileName,
                    fileSize: originalPhoto.size, // Fixed: was originalInfo.size
                    copiedAt: new Date().toISOString(),
                    status: 'success'
                  });

                  logger.debug('SnapshotService', 'Photo copied successfully', {
                    fundItemId: fund.id,
                    fileName: fileName,
                    size: originalPhoto.size
                  });
                } else {
                  throw new Error('Copy verification failed - file sizes do not match');
                }
              } else {
                throw new Error('Original photo file is empty or corrupted');
              }
            } else {
              // Handle missing photo - create placeholder entry
              const placeholderEntry: PhotoManifestEntry = {
                fundItemId: fund.id,
                fundType: fund.type || 'unknown',
                originalPath: fund.photoUri,
                snapshotPath: null,
                fileName: null,
                fileSize: 0,
                copiedAt: new Date().toISOString(),
                status: 'missing',
                error: 'Original photo file not found'
              };

              failedPhotos.push(placeholderEntry);
              copiedPhotos.push(placeholderEntry); // Include in manifest for completeness

              logger.warn('SnapshotService', 'Original photo not found, added placeholder', {
                fundItemId: fund.id,
                originalPath: fund.photoUri
              });
            }
          } catch (photoError: any) {
            logger.error('SnapshotService', photoError, { operation: 'copyPhoto', fundItemId: fund.id });

            // Add failed photo entry to manifest
            const failedEntry: PhotoManifestEntry = {
              fundItemId: fund.id,
              fundType: fund.type || 'unknown',
              originalPath: fund.photoUri,
              snapshotPath: null,
              fileName: null,
              fileSize: 0,
              copiedAt: new Date().toISOString(),
              status: 'failed',
              error: photoError.message
            };

            failedPhotos.push(failedEntry);
            copiedPhotos.push(failedEntry); // Include in manifest for completeness
          }
        } else {
          // Fund item has no photo - add empty entry for completeness
          copiedPhotos.push({
            fundItemId: fund.id,
            fundType: fund.type || 'unknown',
            originalPath: null,
            snapshotPath: null,
            fileName: null,
            fileSize: 0,
            copiedAt: new Date().toISOString(),
            status: 'no_photo',
            error: null
          });
        }
      }

      // Log summary
      const successCount = copiedPhotos.filter(p => p.status === 'success').length;
      const failedCount = failedPhotos.length;
      const totalSize = copiedPhotos
        .filter(p => p.status === 'success')
        .reduce((sum, p) => sum + p.fileSize, 0);

      logger.info('SnapshotService', 'Photo copying completed', {
        snapshotId,
        totalFunds: funds.length,
        successfulCopies: successCount,
        failedCopies: failedCount,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
      });

      return copiedPhotos;
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'copyPhotosToSnapshotStorage' });
      throw error; // Re-throw to allow caller to handle
    }
  }

  /**
   * Update photo manifest in snapshot with actual copied paths
   * @param snapshot - Snapshot instance
   */
  async updatePhotoManifest(snapshot: EntryPackSnapshot): Promise<void> {
    try {
      // The photo manifest is already set during snapshot creation
      // This method can be used for additional processing if needed
      logger.debug('SnapshotService', 'Photo manifest updated for snapshot', { snapshotId: snapshot.snapshotId });
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'updatePhotoManifest' });
    }
  }

  /**
   * Load snapshot by ID
   * @param snapshotId - Snapshot ID
   * @returns Snapshot instance
   */
  async load(snapshotId: string): Promise<EntryPackSnapshot | null> {
    try {
      const snapshot = await EntryPackSnapshot.load(snapshotId);

      if (snapshot) {
        // Record view event
        await this.recordAuditEvent(snapshotId, 'viewed', {
          viewedAt: new Date().toISOString()
        });
      }

      return snapshot;
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'load', snapshotId });
      return null;
    }
  }

  /**
   * List snapshots for user with filters
   * @param userId - User ID
   * @param filters - Filter options
   * @returns Array of snapshots
   */
  async list(userId: UserId, filters: SnapshotFilters = {}): Promise<EntryPackSnapshot[]> {
    try {
      const snapshots = await EntryPackSnapshot.loadByUserId(userId, filters);

      // Sort by creation date (newest first)
      snapshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return snapshots;
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'list', userId });
      return [];
    }
  }

  /**
   * Delete snapshot and associated photos
   * @param snapshotId - Snapshot ID
   * @returns Success status
   */
  async delete(snapshotId: string): Promise<boolean> {
    try {
      logger.info('SnapshotService', 'Deleting snapshot', { snapshotId });

      // Load snapshot to get photo manifest
      const snapshot = await EntryPackSnapshot.load(snapshotId);
      if (!snapshot) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      // Delete snapshot photos
      await this.deleteSnapshotPhotos(snapshotId);

      // Delete snapshot record
      await snapshot.delete();

      // Record audit event
      await this.recordAuditEvent(snapshotId, 'deleted', {
        deletedAt: new Date().toISOString(),
        photoCount: snapshot.getPhotoCount()
      });

      logger.info('SnapshotService', 'Snapshot deleted successfully', { snapshotId });
      return true;
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'delete', snapshotId });
      return false;
    }
  }

  /**
   * Delete photos associated with snapshot
   * @param snapshotId - Snapshot ID
   */
  async deleteSnapshotPhotos(snapshotId: string): Promise<void> {
    try {
      const snapshotPhotoDir = `${this.snapshotStorageDir}${snapshotId}/`;

      // Check if directory exists
      const photoDir = new FileSystem.Directory(snapshotPhotoDir) as unknown as FileSystemDirectory;
      if (await photoDir.exists()) {
        // Delete entire snapshot photo directory
        await photoDir.delete();
        logger.info('SnapshotService', 'Snapshot photos deleted', { snapshotPhotoDir });
      }
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'deleteSnapshotPhotos', snapshotId });
    }
  }

  /**
   * Get storage usage for snapshots
   * @param userId - User ID (optional)
   * @returns Storage usage information
   */
  async getStorageUsage(userId: UserId | null = null): Promise<StorageUsage> {
    try {
      let totalSize = 0;
      let snapshotCount = 0;
      let photoCount = 0;

      // Get all snapshots for user or all users
      const snapshots = userId
        ? await this.list(userId)
        : await this.getAllSnapshots();

      for (const snapshot of snapshots) {
        snapshotCount++;

        // Calculate snapshot data size (rough estimate)
        const snapshotDataSize = JSON.stringify(snapshot.exportData()).length;
        totalSize += snapshotDataSize;

        // Add photo sizes
        for (const photo of snapshot.photoManifest) {
          try {
            if (photo.snapshotPath) {
              const photoFile = new FileSystem.File(photo.snapshotPath) as unknown as FileSystemFile;
              if (await photoFile.exists()) {
                totalSize += photoFile.size || 0;
                photoCount++;
              }
            }
          } catch (photoError) {
            // Photo might be missing, continue
          }
        }
      }

      return {
        totalSize,
        snapshotCount,
        photoCount,
        averageSnapshotSize: snapshotCount > 0 ? Math.round(totalSize / snapshotCount) : 0,
        formattedSize: this.formatBytes(totalSize)
      };
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'getStorageUsage', userId });
      return {
        totalSize: 0,
        snapshotCount: 0,
        photoCount: 0,
        averageSnapshotSize: 0,
        formattedSize: '0 B'
      };
    }
  }

  /**
   * Get all snapshots (admin function)
   * @returns All snapshots
   */
  async getAllSnapshots(): Promise<EntryPackSnapshot[]> {
    try {
      // For now, we'll scan the snapshot storage directory to find all snapshots
      // This is a temporary implementation until proper storage layer is implemented
      const snapshots: EntryPackSnapshot[] = [];

      const snapshotDir = new FileSystem.Directory(this.snapshotStorageDir) as unknown as FileSystemDirectory;
      if (!await snapshotDir.exists()) {
        return [];
      }

      const snapshotDirs = await snapshotDir.list();

      for (const dirName of snapshotDirs) {
        // dirName is a string from list()
        const dirNameStr = typeof dirName === 'string' ? dirName : String(dirName);
        try {
          // Try to load snapshot by ID (directory name should be snapshot ID)
          const snapshot = await EntryPackSnapshot.load(dirNameStr);
          if (snapshot) {
            snapshots.push(snapshot);
          }
        } catch (error: any) {
          logger.warn('SnapshotService', 'Failed to load snapshot', { snapshotId: dirNameStr, error: error.message });
          // Continue with other snapshots
        }
      }

      // Sort by creation date (newest first)
      snapshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return snapshots;
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'getAllSnapshots' });
      return [];
    }
  }

  /**
   * Clean up expired snapshots based on retention policy
   * @param retentionPolicy - Retention policy settings
   * @returns Cleanup results
   */
  async cleanupExpiredSnapshots(retentionPolicy: RetentionPolicy = {}): Promise<CleanupResult> {
    try {
      const {
        maxAge = 90, // days
        maxCount = 100,
        keepCompleted = true
      } = retentionPolicy;

      const now = new Date();
      const maxAgeMs = maxAge * 24 * 60 * 60 * 1000;

      let deletedCount = 0;
      let freedSpace = 0;

      // Get all snapshots (would need user context in real implementation)
      const allSnapshots = await this.getAllSnapshots();

      for (const snapshot of allSnapshots) {
        const age = now.getTime() - new Date(snapshot.createdAt).getTime();
        let shouldDelete = false;

        // Check age-based deletion
        if (age > maxAgeMs) {
          shouldDelete = true;
        }

        // Skip deletion for completed snapshots if policy says to keep them
        if (keepCompleted && snapshot.status === 'completed') {
          shouldDelete = false;
        }

        if (shouldDelete) {
          await this.delete(snapshot.snapshotId);
          deletedCount++;
          freedSpace += snapshot.getEstimatedSize();
        }
      }

      logger.info('SnapshotService', 'Snapshot cleanup completed', {
        deletedCount,
        freedSpace: this.formatBytes(freedSpace)
      });

      return {
        deletedCount,
        freedSpace,
        formattedFreedSpace: this.formatBytes(freedSpace)
      };
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'cleanupExpiredSnapshots' });
      return { deletedCount: 0, freedSpace: 0, formattedFreedSpace: '0 B' };
    }
  }

  /**
   * Record audit event for snapshot
   * @param snapshotId - Snapshot ID
   * @param eventType - Event type
   * @param metadata - Event metadata
   */
  async recordAuditEvent(snapshotId: string, eventType: string, metadata: AuditEventMetadata = {}): Promise<void> {
    try {
      // This would integrate with AuditLogService when implemented
      logger.debug('SnapshotService', 'Audit event recorded', {
        snapshotId,
        eventType,
        timestamp: new Date().toISOString(),
        metadata
      });
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'recordAuditEvent', snapshotId });
    }
  }

  /**
   * Format bytes to human readable format
   * @param bytes - Bytes
   * @returns Formatted string
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) {
      return '0 B';
    }

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Export snapshot data for backup
   * @param snapshotId - Snapshot ID
   * @param options - Export options
   * @returns Export data
   */
  async exportSnapshot(snapshotId: string, options: ExportOptions = {}): Promise<any> {
    try {
      const snapshot = await this.load(snapshotId);
      if (!snapshot) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      const exportData = snapshot.exportData();

      if (options.includePhotos) {
        // Add photo data as base64 if requested
        const photoData: Record<string, string> = {};
        for (const photo of snapshot.photoManifest) {
          try {
            if (photo.snapshotPath) {
              const photoInfo = await FileSystem.getInfoAsync(photo.snapshotPath);
              if (photoInfo.exists) {
                const base64 = await LegacyFileSystem.readAsStringAsync(photo.snapshotPath, {
                  encoding: LegacyFileSystem.EncodingType.Base64
                });
                photoData[photo.fundItemId] = base64;
              }
            }
          } catch (photoError: any) {
            logger.warn('SnapshotService', 'Failed to export photo', { fundItemId: photo.fundItemId, error: photoError.message });
          }
        }
        exportData.photoData = photoData;
      }

      // Record export event
      await this.recordAuditEvent(snapshotId, 'exported', {
        exportedAt: new Date().toISOString(),
        includePhotos: options.includePhotos
      });

      return exportData;
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'exportSnapshot', snapshotId });
      throw error;
    }
  }

  /**
   * Get service statistics
   * @returns Service statistics
   */
  async getStats(): Promise<ServiceStats> {
    try {
      const usage = await this.getStorageUsage();

      return {
        storageDir: this.snapshotStorageDir,
        ...usage
      };
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'getStats' });
      return {
        storageDir: this.snapshotStorageDir,
        totalSize: 0,
        snapshotCount: 0,
        photoCount: 0
      };
    }
  }

  // ===== ENHANCED PHOTO MANAGEMENT METHODS =====
  // Requirements: 21.1-21.5, 23.1-23.5

  /**
   * Validate photo before copying
   * @param photoUri - Photo URI to validate
   * @returns Validation result
   */
  async validatePhoto(photoUri: string): Promise<PhotoValidationResult> {
    try {
      if (!photoUri) {
        return { isValid: false, error: 'Photo URI is required' };
      }

      const photoFile = new FileSystem.File(photoUri) as unknown as FileSystemFile;

      if (!await photoFile.exists()) {
        return { isValid: false, error: 'Photo file does not exist' };
      }

      if (photoFile.size === 0) {
        return { isValid: false, error: 'Photo file is empty' };
      }

      // Check file size limits (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (photoFile.size > maxSize) {
        return {
          isValid: false,
          error: `Photo file too large: ${(photoFile.size / (1024 * 1024)).toFixed(2)}MB (max 10MB)`
        };
      }

      // Check if file is readable
      try {
      const base64 = await LegacyFileSystem.readAsStringAsync(photoUri, {
        encoding: LegacyFileSystem.EncodingType.Base64,
        length: 100 // Just read first 100 bytes to test
      });

        if (!base64) {
          return { isValid: false, error: 'Photo file is not readable' };
        }
      } catch (readError: any) {
        return { isValid: false, error: `Photo file read error: ${readError.message}` };
      }

      return {
        isValid: true,
        size: photoFile.size || 0,
        sizeMB: ((photoFile.size || 0) / (1024 * 1024)).toFixed(2)
      };
    } catch (error: any) {
      return { isValid: false, error: `Photo validation failed: ${error.message}` };
    }
  }

  /**
   * Create missing photo placeholder
   * @param snapshotId - Snapshot ID
   * @param fundItemId - Fund item ID
   * @returns Placeholder image path
   */
  async createMissingPhotoPlaceholder(snapshotId: string, fundItemId: string): Promise<string | null> {
    try {
      const snapshotPhotoDir = `${this.snapshotStorageDir}${snapshotId}/`;
      const placeholderFileName = `placeholder_${snapshotId}_${fundItemId}.txt`;
      const placeholderPath = `${snapshotPhotoDir}${placeholderFileName}`;

      // Create placeholder text file
      const placeholderContent = JSON.stringify({
        type: 'missing_photo_placeholder',
        snapshotId,
        fundItemId,
        message: 'Original photo was not available during snapshot creation',
        createdAt: new Date().toISOString()
      }, null, 2);

      await LegacyFileSystem.writeAsStringAsync(placeholderPath, placeholderContent);

      logger.debug('SnapshotService', 'Missing photo placeholder created', {
        snapshotId,
        fundItemId,
        placeholderPath
      });

      return placeholderPath;
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'createMissingPhotoPlaceholder', snapshotId, fundItemId });
      return null;
    }
  }

  /**
   * Get photo display info for UI
   * @param photoManifestEntry - Photo manifest entry
   * @returns Display info for UI
   */
  getPhotoDisplayInfo(photoManifestEntry: PhotoManifestEntry): PhotoDisplayInfo {
    const displayInfo: PhotoDisplayInfo = {
      fundItemId: photoManifestEntry.fundItemId,
      fundType: photoManifestEntry.fundType || 'unknown',
      hasPhoto: false,
      photoPath: null,
      displayText: 'No photo',
      displayIcon: '📄',
      status: photoManifestEntry.status || 'unknown',
      error: photoManifestEntry.error || null
    };

    switch (photoManifestEntry.status) {
      case 'success':
        displayInfo.hasPhoto = true;
        displayInfo.photoPath = photoManifestEntry.snapshotPath;
        displayInfo.displayText = `Photo (${(photoManifestEntry.fileSize / 1024).toFixed(1)}KB)`;
        displayInfo.displayIcon = '📷';
        break;

      case 'missing':
        displayInfo.displayText = 'Photo not found';
        displayInfo.displayIcon = '❌';
        break;

      case 'failed':
        displayInfo.displayText = 'Photo copy failed';
        displayInfo.displayIcon = '⚠️';
        break;

      case 'no_photo':
        displayInfo.displayText = 'No photo provided';
        displayInfo.displayIcon = '📄';
        break;

      default:
        displayInfo.displayText = 'Unknown status';
        displayInfo.displayIcon = '❓';
    }

    return displayInfo;
  }

  /**
   * Cleanup orphaned snapshot photos (photos without corresponding snapshots)
   * @returns Cleanup result
   */
  async cleanupOrphanedPhotos(): Promise<OrphanedPhotoCleanupResult> {
    try {
      logger.info('SnapshotService', 'Starting orphaned photo cleanup...');

      const cleanupResult: OrphanedPhotoCleanupResult = {
        scannedDirectories: 0,
        orphanedDirectories: 0,
        deletedDirectories: [],
        reclaimedSpaceBytes: 0,
        errors: []
      };

      // Get all snapshot directories
      const snapshotDir = new FileSystem.Directory(this.snapshotStorageDir) as unknown as FileSystemDirectory;
      if (!await snapshotDir.exists()) {
        return cleanupResult;
      }

      const snapshotDirs = await snapshotDir.list();
      cleanupResult.scannedDirectories = snapshotDirs.length;

      for (const dirName of snapshotDirs) {
        // dirName is a string from list()
        const dirNameStr = typeof dirName === 'string' ? dirName : String(dirName);
        try {
          // Check if snapshot record exists
          const snapshot = await EntryPackSnapshot.load(dirNameStr);

          if (!snapshot) {
            // Orphaned directory - calculate size and delete
            const dirPath = `${this.snapshotStorageDir}${dirNameStr}`;
            const dirSize = await this.calculateDirectorySize(dirPath);

            const orphanedDir = new FileSystem.Directory(dirPath) as unknown as FileSystemDirectory;
            await orphanedDir.delete();

            cleanupResult.orphanedDirectories++;
            cleanupResult.deletedDirectories.push(dirNameStr);
            cleanupResult.reclaimedSpaceBytes += dirSize;

            logger.info('SnapshotService', 'Deleted orphaned snapshot directory', {
              dirName: dirNameStr,
              sizeMB: (dirSize / (1024 * 1024)).toFixed(2)
            });
          }
        } catch (error: any) {
          logger.error('SnapshotService', error, { operation: 'cleanupOrphanedPhotos', directory: dirNameStr });
          cleanupResult.errors.push({
            directory: dirNameStr,
            error: error.message
          });
        }
      }

      logger.info('SnapshotService', 'Orphaned photo cleanup completed', {
        ...cleanupResult,
        reclaimedSpaceMB: (cleanupResult.reclaimedSpaceBytes / (1024 * 1024)).toFixed(2)
      });

      return cleanupResult;
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'cleanupOrphanedPhotos' });
      throw error;
    }
  }

  /**
   * Calculate directory size recursively
   * @param dirPath - Directory path
   * @returns Size in bytes
   */
  async calculateDirectorySize(dirPath: string): Promise<number> {
    try {
      let totalSize = 0;

      const dir = new FileSystem.Directory(dirPath) as unknown as FileSystemDirectory;
      if (!await dir.exists()) {
        return 0;
      }

      const items = await dir.list();

      for (const item of items) {
        const itemPath = `${dirPath}/${item}`;
        // Check if item is a directory or file
        try {
          const itemDir = new FileSystem.Directory(itemPath) as unknown as FileSystemDirectory;
          if (await itemDir.exists()) {
            totalSize += await this.calculateDirectorySize(itemPath);
          } else {
            const itemFile = new FileSystem.File(itemPath) as unknown as FileSystemFile;
            if (await itemFile.exists()) {
              totalSize += itemFile.size || 0;
            }
          }
        } catch {
          // Skip if can't determine type
        }
      }

      return totalSize;
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'calculateDirectorySize', dirPath });
      return 0;
    }
  }

  /**
   * Verify photo integrity in snapshot
   * @param snapshotId - Snapshot ID
   * @returns Verification result
   */
  async verifySnapshotPhotoIntegrity(snapshotId: string): Promise<PhotoIntegrityVerificationResult> {
    try {
      logger.info('SnapshotService', 'Verifying photo integrity for snapshot', { snapshotId });

      const snapshot = await EntryPackSnapshot.load(snapshotId);
      if (!snapshot) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      const verificationResult: PhotoIntegrityVerificationResult = {
        snapshotId,
        totalPhotos: snapshot.photoManifest.length,
        validPhotos: 0,
        corruptedPhotos: 0,
        missingPhotos: 0,
        issues: []
      };

      for (const photoEntry of snapshot.photoManifest) {
        if (photoEntry.status === 'success' && photoEntry.snapshotPath) {
          try {
            const photoFile = new FileSystem.File(photoEntry.snapshotPath) as unknown as FileSystemFile;

            if (!await photoFile.exists()) {
              verificationResult.missingPhotos++;
              verificationResult.issues.push({
                fundItemId: photoEntry.fundItemId,
                issue: 'Photo file missing',
                path: photoEntry.snapshotPath
              });
            } else if (photoFile.size !== photoEntry.fileSize) {
              verificationResult.corruptedPhotos++;
              verificationResult.issues.push({
                fundItemId: photoEntry.fundItemId,
                issue: 'File size mismatch',
                expected: photoEntry.fileSize,
                actual: photoFile.size,
                path: photoEntry.snapshotPath
              });
            } else {
              verificationResult.validPhotos++;
            }
          } catch (error: any) {
            verificationResult.corruptedPhotos++;
            verificationResult.issues.push({
              fundItemId: photoEntry.fundItemId,
              issue: 'File access error',
              error: error.message,
              path: photoEntry.snapshotPath
            });
          }
        }
      }

      logger.info('SnapshotService', 'Photo integrity verification completed', verificationResult);
      return verificationResult;
    } catch (error: any) {
      logger.error('SnapshotService', error, { operation: 'verifySnapshotPhotoIntegrity', snapshotId });
      throw error;
    }
  }
}

// Export singleton instance
const snapshotService = new SnapshotService();

export default snapshotService;
export { SnapshotService };
export type {
  SnapshotMetadata,
  PhotoManifestEntry,
  SnapshotFilters,
  RetentionPolicy,
  StorageUsage,
  CleanupResult,
  AuditEventMetadata,
  PhotoValidationResult,
  PhotoDisplayInfo,
  OrphanedPhotoCleanupResult,
  PhotoIntegrityVerificationResult,
  ExportOptions,
  ServiceStats,
  CompleteEntryInfoData,
  FundItem
};

