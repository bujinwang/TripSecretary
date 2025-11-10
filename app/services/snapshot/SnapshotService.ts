/**
 * SnapshotService - Service for managing entry info snapshots
 * Creates and manages immutable historical records of entry info
 *
 * Requirements: 11.1-11.7, 14.1-14.5, 15.1-15.7, 19.1-19.5
 */

import EntryPackSnapshot from '../../models/EntryPackSnapshot';
import * as FileSystem from 'expo-file-system';
import DataEncryptionService, { type PhotoFile } from '../security/DataEncryptionService';
import logger from '../LoggingService';
import type { UserId } from '../../types';
import EntryInfo from '../../models/EntryInfo';
import UserDataService from '../data/UserDataService';

type FileEncoding = (typeof FileSystem.EncodingType)[keyof typeof FileSystem.EncodingType];

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
  encryptedPath?: string | null;
  encryptionMethod?: string | null;
  encryptionError?: string | null;
  encryptedSize?: number | null;
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
      await this.ensureDirectory(this.snapshotStorageDir);
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
          const photoFilesForEncryption: PhotoFile[] = photoManifest
            .filter(
              (photo): photo is PhotoManifestEntry & {
                snapshotPath: string;
                fundItemId: string;
              } =>
                photo.status === 'success' &&
                typeof photo.snapshotPath === 'string' &&
                typeof photo.fundItemId === 'string'
            )
            .map(photo => ({
              filePath: photo.snapshotPath,
              fundItemId: photo.fundItemId,
              originalSize: photo.fileSize ?? 0
            }));

          const encryptedResults = await this.encryptionService.encryptSnapshotPhotos(
            photoFilesForEncryption,
            snapshot.snapshotId
          );

          const encryptedByFundId = new Map(
            encryptedResults.map(result => [result.fundItemId, result])
          );

          encryptedPhotos = photoManifest.map(entry => {
            const encryptedResult = encryptedByFundId.get(entry.fundItemId);
            if (!encryptedResult) {
              return entry;
            }

            return {
              ...entry,
              encrypted: encryptedResult.encrypted ?? entry.encrypted ?? false,
              encryptedPath: encryptedResult.encryptedPath ?? null,
              encryptionMethod: encryptedResult.encryptionMethod ?? null,
              encryptionError: encryptedResult.encryptionError ?? null,
              encryptedSize: encryptedResult.encryptedSize ?? null
            };
          });

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
          const encryptionResult = await this.encryptionService.encryptSnapshotData(
            snapshotData,
            snapshot.snapshotId
          );

          // Update snapshot with encryption info
          snapshot.setEncryptionInfo({
            encrypted: encryptionResult.encrypted,
            encryptionMethod: encryptionResult.encryptionMethod ?? null,
            encryptedFilePath: encryptionResult.filePath ?? null
          });

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

      const baseData = (await entryInfo.exportData()) as Record<string, unknown>;

      const combined = {
        ...baseData,
        passport: completeData.passport,
        personalInfo: completeData.personalInfo,
        funds,
        travel
      } as CompleteEntryInfoData;

      return combined;
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
      await this.ensureDirectory(snapshotPhotoDir);

      logger.info('SnapshotService', `Copying ${funds.length} fund photos to snapshot storage`, { snapshotPhotoDir });

      for (const fund of funds) {
        if (fund.photoUri) {
          try {
            // Generate snapshot photo filename using naming convention
            const timestamp = Date.now();
            const fileName = `snapshot_${snapshotId}_${fund.id}_${timestamp}.jpg`;
            const snapshotPhotoPath = `${snapshotPhotoDir}${fileName}`;

            const originalInfo = await this.getFileInfo(fund.photoUri);
            if (originalInfo) {
              const originalSize = originalInfo.size ?? 0;
              if (originalSize <= 0) {
                throw new Error('Original photo file is empty or corrupted');
              }

              await this.copyFile(fund.photoUri, snapshotPhotoPath);

              const copiedInfo = await this.getFileInfo(snapshotPhotoPath);
              if (!copiedInfo) {
                throw new Error('Copy verification failed - destination file not found');
              }

              const copiedSize = copiedInfo.size ?? 0;
              if (copiedSize !== originalSize) {
                throw new Error('Copy verification failed - file sizes do not match');
              }

              copiedPhotos.push({
                fundItemId: fund.id,
                fundType: fund.type || 'unknown',
                originalPath: fund.photoUri,
                snapshotPath: snapshotPhotoPath,
                fileName,
                fileSize: originalSize,
                copiedAt: new Date().toISOString(),
                status: 'success'
              });

              logger.debug('SnapshotService', 'Photo copied successfully', {
                fundItemId: fund.id,
                fileName,
                size: originalSize
              });
            } else {
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
              copiedPhotos.push(placeholderEntry);

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
        .reduce((sum, p) => sum + (p.fileSize ?? 0), 0);

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

      const dirInfo = await FileSystem.getInfoAsync(snapshotPhotoDir);
      if (dirInfo.exists && dirInfo.isDirectory) {
        await FileSystem.deleteAsync(snapshotPhotoDir, { idempotent: true });
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
              const photoSize = await this.getFileSize(photo.snapshotPath);
              if (photoSize > 0) {
                totalSize += photoSize;
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

      const snapshotDirs = await this.listDirectory(this.snapshotStorageDir);
      if (snapshotDirs.length === 0) {
        return [];
      }

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

  private async ensureDirectory(path: string): Promise<void> {
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      if (!info.isDirectory) {
        throw new Error(`Expected directory at path: ${path}`);
      }
      return;
    }

    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }

  private async listDirectory(path: string): Promise<string[]> {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists || !info.isDirectory) {
      return [];
    }

    return FileSystem.readDirectoryAsync(path);
  }

  private async getFileInfo(path: string): Promise<FileSystem.FileInfo | null> {
    try {
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists || info.isDirectory) {
        return null;
      }
      return info;
    } catch {
      return null;
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    const info = await this.getFileInfo(path);
    return info !== null;
  }

  private async getFileSize(path: string): Promise<number> {
    const info = await this.getFileInfo(path);
    return info?.size ?? 0;
  }

  private async readFile(path: string, encoding?: FileEncoding): Promise<string> {
    return FileSystem.readAsStringAsync(path, encoding ? { encoding } : undefined);
  }

  private async writeFile(path: string, data: string, encoding?: FileEncoding): Promise<void> {
    await FileSystem.writeAsStringAsync(path, data, encoding ? { encoding } : undefined);
  }

  private async copyFile(from: string, to: string): Promise<void> {
    await FileSystem.copyAsync({ from, to });
  }

  private async deleteFile(path: string): Promise<void> {
    await FileSystem.deleteAsync(path, { idempotent: true });
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
              const photoInfo = await this.getFileInfo(photo.snapshotPath);
              if (photoInfo) {
                const base64 = await this.readFile(photo.snapshotPath, FileSystem.EncodingType.Base64);
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

      const photoInfo = await this.getFileInfo(photoUri);

      if (!photoInfo) {
        return { isValid: false, error: 'Photo file does not exist' };
      }

      const photoSize = photoInfo.size ?? 0;
      if (photoSize === 0) {
        return { isValid: false, error: 'Photo file is empty' };
      }

      // Check file size limits (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (photoSize > maxSize) {
        return {
          isValid: false,
          error: `Photo file too large: ${(photoSize / (1024 * 1024)).toFixed(2)}MB (max 10MB)`
        };
      }

      // Check if file is readable
      try {
        const base64 = await this.readFile(photoUri, FileSystem.EncodingType.Base64);

        if (!base64) {
          return { isValid: false, error: 'Photo file is not readable' };
        }
      } catch (readError: any) {
        return { isValid: false, error: `Photo file read error: ${readError.message}` };
      }

      return {
        isValid: true,
        size: photoSize,
        sizeMB: ((photoSize || 0) / (1024 * 1024)).toFixed(2)
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

      await FileSystem.writeAsStringAsync(placeholderPath, placeholderContent);

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
      const snapshotDirs = await this.listDirectory(this.snapshotStorageDir);
      if (snapshotDirs.length === 0) {
        return cleanupResult;
      }

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

            await FileSystem.deleteAsync(dirPath, { idempotent: true });

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

      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists || !dirInfo.isDirectory) {
        return 0;
      }

      const items = await FileSystem.readDirectoryAsync(dirPath);

      for (const item of items) {
        const itemPath = `${dirPath}/${item}`;
        // Check if item is a directory or file
        try {
          const itemInfo = await FileSystem.getInfoAsync(itemPath);
          if (!itemInfo.exists) {
            continue;
          }

          if (itemInfo.isDirectory) {
            totalSize += await this.calculateDirectorySize(itemPath);
          } else {
            totalSize += itemInfo.size ?? 0;
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
            const photoInfo = await this.getFileInfo(photoEntry.snapshotPath);

            if (!photoInfo) {
              verificationResult.missingPhotos++;
              verificationResult.issues.push({
                fundItemId: photoEntry.fundItemId,
                issue: 'Photo file missing',
                path: photoEntry.snapshotPath
              });
            } else if ((photoInfo.size ?? 0) !== photoEntry.fileSize) {
              verificationResult.corruptedPhotos++;
              verificationResult.issues.push({
                fundItemId: photoEntry.fundItemId,
                issue: 'File size mismatch',
                expected: photoEntry.fileSize,
                actual: photoInfo.size ?? 0,
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

