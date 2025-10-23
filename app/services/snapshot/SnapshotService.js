/**
 * SnapshotService - Service for managing entry info snapshots
 * Creates and manages immutable historical records of entry info
 *
 * Requirements: 11.1-11.7, 14.1-14.5, 15.1-15.7, 19.1-19.5
 */

import EntryPackSnapshot from '../../models/EntryPackSnapshot';
import * as FileSystem from 'expo-file-system';
import DataEncryptionService from '../security/DataEncryptionService';

class SnapshotService {
  constructor() {
    this.snapshotStorageDir = FileSystem.documentDirectory + 'snapshots/';
    this.encryptionService = DataEncryptionService;
    this.encryptionEnabled = true; // Enable encryption for snapshots by default
    this.initialized = false;
    // Don't call initializeStorage() in constructor - it's async
  }

  /**
   * Initialize snapshot storage directory and encryption
   */
  async initializeStorage() {
    if (this.initialized) return;
    
    try {
      const snapshotDir = new FileSystem.Directory(this.snapshotStorageDir);
      const dirExists = await snapshotDir.exists();
      if (!dirExists) {
        await FileSystem.makeDirectoryAsync(this.snapshotStorageDir, { intermediates: true });
        console.log('Snapshot storage directory created:', this.snapshotStorageDir);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize snapshot storage:', error);
    }
  }

  /**
   * Ensure service is initialized before operations
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeStorage();
    }
  }

  /**
   * Initialize encryption for snapshots
   * @param {string} userId - User ID for encryption setup
   * @returns {Promise<void>}
   */
  async initializeEncryption(userId) {
    try {
      if (this.encryptionEnabled) {
        await this.encryptionService.initialize(userId);
        console.log('Snapshot encryption initialized for user:', userId);
      }
    } catch (error) {
      console.error('Failed to initialize snapshot encryption:', error);
      // Don't throw error - allow snapshots to work without encryption
      this.encryptionEnabled = false;
    }
  }

  /**
   * Create snapshot from entry info
   * @param {string} entryInfoId - Entry info ID
   * @param {string} reason - Snapshot creation reason ('completed', 'expired', 'cancelled', 'manual_archive')
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<EntryPackSnapshot>} - Created snapshot
   */
  async createSnapshot(entryInfoId, reason = 'completed', metadata = {}) {
    await this.ensureInitialized();

    try {
      console.log('Creating snapshot:', {
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
          console.log('Snapshot photos encrypted:', {
            snapshotId: snapshot.snapshotId,
            photoCount: encryptedPhotos.length,
            encryptedCount: encryptedPhotos.filter(p => p.encrypted).length
          });
        } catch (encryptionError) {
          console.error('Failed to encrypt snapshot photos:', encryptionError);
          // Continue with unencrypted photos
        }
      }

      // Update photo manifest with encryption info
      snapshot.updatePhotoManifest(encryptedPhotos);

      // Encrypt snapshot data if encryption is enabled
      let snapshotSaveResult = null;
      if (this.encryptionEnabled) {
        try {
          const snapshotData = snapshot.exportData();
          const encryptionResult = await this.encryptionService.encryptSnapshotData(snapshotData, snapshot.snapshotId);

          // Update snapshot with encryption info
          snapshot.setEncryptionInfo(encryptionResult);

          console.log('Snapshot data encrypted:', {
            snapshotId: snapshot.snapshotId,
            encrypted: encryptionResult.encrypted,
            encryptionMethod: encryptionResult.encryptionMethod
          });
        } catch (encryptionError) {
          console.error('Failed to encrypt snapshot data:', encryptionError);
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

      console.log('Snapshot created successfully:', {
        snapshotId: snapshot.snapshotId,
        entryInfoId,
        reason,
        photoCount: snapshot.getPhotoCount()
      });

      return snapshot;
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      throw error;
    }
  }

  /**
   * Load complete entry info data with all related information
   * @param {string} entryInfoId - Entry info ID
   * @returns {Promise<Object>} - Complete entry info data
   */
  async loadCompleteEntryInfoData(entryInfoId) {
    try {
      // Load entry info
      const EntryInfo = require('../../models/EntryInfo').default;
      const entryInfo = await EntryInfo.load(entryInfoId);
      if (!entryInfo) {
        return null;
      }

      // Load complete data from entry info
      const completeData = await entryInfo.getCompleteData();

      // Load funds separately using PassportDataService
      let funds = [];
      if (entryInfo.userId) {
        try {
          const PassportDataService = require('../data/PassportDataService').default;
          funds = await PassportDataService.getFundItems(entryInfo.userId) || [];
          console.log('Loaded funds for snapshot:', {
            userId: entryInfo.userId,
            fundCount: funds.length
          });
        } catch (fundError) {
          console.warn('Failed to load funds for snapshot:', fundError);
        }
      }

      // Load travel info separately if not in completeData
      let travel = completeData.travel || {};
      if (entryInfo.userId && entryInfo.destinationId && (!travel || Object.keys(travel).length === 0)) {
        try {
          const PassportDataService = require('../data/PassportDataService').default;
          const travelInfo = await PassportDataService.getTravelInfo(entryInfo.userId, entryInfo.destinationId);
          if (travelInfo) {
            travel = travelInfo;
            console.log('Loaded travel info for snapshot:', {
              userId: entryInfo.userId,
              destinationId: entryInfo.destinationId
            });
          }
        } catch (travelError) {
          console.warn('Failed to load travel info for snapshot:', travelError);
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
    } catch (error) {
      console.error('Failed to load complete entry info data:', error);
      return null;
    }
  }

  /**
   * Copy photos to snapshot storage
   * @param {Array} funds - Fund items array
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<Array>} - Array of copied photo info
   */
  async copyPhotosToSnapshotStorage(funds, snapshotId) {
    try {
      const copiedPhotos = [];
      const failedPhotos = [];
      const snapshotPhotoDir = `${this.snapshotStorageDir}${snapshotId}/`;

      // Create snapshot photo directory
      await FileSystem.makeDirectoryAsync(snapshotPhotoDir, { intermediates: true });

      console.log(`Copying ${funds.length} fund photos to snapshot storage:`, snapshotPhotoDir);

      for (const fund of funds) {
        if (fund.photoUri) {
          try {
            // Generate snapshot photo filename using naming convention
            const timestamp = Date.now();
            const fileName = `snapshot_${snapshotId}_${fund.id}_${timestamp}.jpg`;
            const snapshotPhotoPath = `${snapshotPhotoDir}${fileName}`;

            // Check if original photo exists
            const originalInfo = await FileSystem.getInfoAsync(fund.photoUri);
            if (originalInfo.exists) {
              // Validate photo file size (prevent copying corrupted files)
              if (originalInfo.size > 0) {
                // Copy photo to snapshot storage
                await FileSystem.copyAsync({
                  from: fund.photoUri,
                  to: snapshotPhotoPath
                });

                // Verify copy was successful
                const copiedInfo = await FileSystem.getInfoAsync(snapshotPhotoPath);
                if (copiedInfo.exists && copiedInfo.size === originalInfo.size) {
                  copiedPhotos.push({
                    fundItemId: fund.id,
                    fundType: fund.type || 'unknown',
                    originalPath: fund.photoUri,
                    snapshotPath: snapshotPhotoPath,
                    fileName: fileName,
                    fileSize: originalInfo.size,
                    copiedAt: new Date().toISOString(),
                    status: 'success'
                  });

                  console.log('Photo copied successfully:', {
                    fundItemId: fund.id,
                    fileName: fileName,
                    size: originalInfo.size
                  });
                } else {
                  throw new Error('Copy verification failed - file sizes do not match');
                }
              } else {
                throw new Error('Original photo file is empty or corrupted');
              }
            } else {
              // Handle missing photo - create placeholder entry
              const placeholderEntry = {
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

              console.warn('Original photo not found, added placeholder:', {
                fundItemId: fund.id,
                originalPath: fund.photoUri
              });
            }
          } catch (photoError) {
            console.error('Failed to copy photo for fund item:', fund.id, photoError);
            
            // Add failed photo entry to manifest
            const failedEntry = {
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

      console.log('Photo copying completed:', {
        snapshotId,
        totalFunds: funds.length,
        successfulCopies: successCount,
        failedCopies: failedCount,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
      });

      return copiedPhotos;
    } catch (error) {
      console.error('Failed to copy photos to snapshot storage:', error);
      throw error; // Re-throw to allow caller to handle
    }
  }

  /**
   * Update photo manifest in snapshot with actual copied paths
   * @param {EntryPackSnapshot} snapshot - Snapshot instance
   * @returns {Promise<void>}
   */
  async updatePhotoManifest(snapshot) {
    try {
      // The photo manifest is already set during snapshot creation
      // This method can be used for additional processing if needed
      console.log('Photo manifest updated for snapshot:', snapshot.snapshotId);
    } catch (error) {
      console.error('Failed to update photo manifest:', error);
    }
  }

  /**
   * Load snapshot by ID
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<EntryPackSnapshot|null>} - Snapshot instance
   */
  async load(snapshotId) {
    try {
      const snapshot = await EntryPackSnapshot.load(snapshotId);
      
      if (snapshot) {
        // Record view event
        await this.recordAuditEvent(snapshotId, 'viewed', {
          viewedAt: new Date().toISOString()
        });
      }

      return snapshot;
    } catch (error) {
      console.error('Failed to load snapshot:', error);
      return null;
    }
  }

  /**
   * List snapshots for user with filters
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Array of snapshots
   */
  async list(userId, filters = {}) {
    try {
      const snapshots = await EntryPackSnapshot.loadByUserId(userId, filters);
      
      // Sort by creation date (newest first)
      snapshots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return snapshots;
    } catch (error) {
      console.error('Failed to list snapshots:', error);
      return [];
    }
  }

  /**
   * Delete snapshot and associated photos
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete(snapshotId) {
    try {
      console.log('Deleting snapshot:', snapshotId);

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

      console.log('Snapshot deleted successfully:', snapshotId);
      return true;
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      return false;
    }
  }

  /**
   * Delete photos associated with snapshot
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<void>}
   */
  async deleteSnapshotPhotos(snapshotId) {
    try {
      const snapshotPhotoDir = `${this.snapshotStorageDir}${snapshotId}/`;
      
      // Check if directory exists
      const dirInfo = await FileSystem.getInfoAsync(snapshotPhotoDir);
      if (dirInfo.exists) {
        // Delete entire snapshot photo directory
        await FileSystem.deleteAsync(snapshotPhotoDir);
        console.log('Snapshot photos deleted:', snapshotPhotoDir);
      }
    } catch (error) {
      console.error('Failed to delete snapshot photos:', error);
    }
  }

  /**
   * Get storage usage for snapshots
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} - Storage usage information
   */
  async getStorageUsage(userId = null) {
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
            const photoInfo = await FileSystem.getInfoAsync(photo.snapshotPath);
            if (photoInfo.exists) {
              totalSize += photoInfo.size || 0;
              photoCount++;
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
    } catch (error) {
      console.error('Failed to get storage usage:', error);
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
   * @returns {Promise<Array>} - All snapshots
   */
  async getAllSnapshots() {
    try {
      // For now, we'll scan the snapshot storage directory to find all snapshots
      // This is a temporary implementation until proper storage layer is implemented
      const snapshots = [];
      
      const snapshotDirInfo = await FileSystem.getInfoAsync(this.snapshotStorageDir);
      if (!snapshotDirInfo.exists) {
        return [];
      }

      const snapshotDirs = await FileSystem.readDirectoryAsync(this.snapshotStorageDir);
      
      for (const dirName of snapshotDirs) {
        try {
          // Try to load snapshot by ID (directory name should be snapshot ID)
          const snapshot = await EntryPackSnapshot.load(dirName);
          if (snapshot) {
            snapshots.push(snapshot);
          }
        } catch (error) {
          console.warn('Failed to load snapshot:', dirName, error);
          // Continue with other snapshots
        }
      }

      // Sort by creation date (newest first)
      snapshots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return snapshots;
    } catch (error) {
      console.error('Failed to get all snapshots:', error);
      return [];
    }
  }

  /**
   * Clean up expired snapshots based on retention policy
   * @param {Object} retentionPolicy - Retention policy settings
   * @returns {Promise<Object>} - Cleanup results
   */
  async cleanupExpiredSnapshots(retentionPolicy = {}) {
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
          const usage = await this.getStorageUsage();
          await this.delete(snapshot.snapshotId);
          deletedCount++;
          freedSpace += snapshot.getEstimatedSize();
        }
      }

      console.log('Snapshot cleanup completed:', {
        deletedCount,
        freedSpace: this.formatBytes(freedSpace)
      });

      return {
        deletedCount,
        freedSpace,
        formattedFreedSpace: this.formatBytes(freedSpace)
      };
    } catch (error) {
      console.error('Failed to cleanup expired snapshots:', error);
      return { deletedCount: 0, freedSpace: 0 };
    }
  }

  /**
   * Record audit event for snapshot
   * @param {string} snapshotId - Snapshot ID
   * @param {string} eventType - Event type
   * @param {Object} metadata - Event metadata
   * @returns {Promise<void>}
   */
  async recordAuditEvent(snapshotId, eventType, metadata = {}) {
    try {
      // This would integrate with AuditLogService when implemented
      console.log('Audit event recorded:', {
        snapshotId,
        eventType,
        timestamp: new Date().toISOString(),
        metadata
      });
    } catch (error) {
      console.error('Failed to record audit event:', error);
    }
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Bytes
   * @returns {string} - Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Export snapshot data for backup
   * @param {string} snapshotId - Snapshot ID
   * @param {Object} options - Export options
   * @returns {Promise<Object>} - Export data
   */
  async exportSnapshot(snapshotId, options = {}) {
    try {
      const snapshot = await this.load(snapshotId);
      if (!snapshot) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      const exportData = snapshot.exportData();

      if (options.includePhotos) {
        // Add photo data as base64 if requested
        const photoData = {};
        for (const photo of snapshot.photoManifest) {
          try {
            const photoInfo = await FileSystem.getInfoAsync(photo.snapshotPath);
            if (photoInfo.exists) {
              const base64 = await FileSystem.readAsStringAsync(photo.snapshotPath, {
                encoding: FileSystem.EncodingType.Base64
              });
              photoData[photo.fundItemId] = base64;
            }
          } catch (photoError) {
            console.warn('Failed to export photo:', photo.fundItemId, photoError);
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
    } catch (error) {
      console.error('Failed to export snapshot:', error);
      throw error;
    }
  }

  /**
   * Get service statistics
   * @returns {Promise<Object>} - Service statistics
   */
  async getStats() {
    try {
      const usage = await this.getStorageUsage();
      
      return {
        storageDir: this.snapshotStorageDir,
        ...usage
      };
    } catch (error) {
      console.error('Failed to get service stats:', error);
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
   * @param {string} photoUri - Photo URI to validate
   * @returns {Promise<Object>} - Validation result
   */
  async validatePhoto(photoUri) {
    try {
      if (!photoUri) {
        return { isValid: false, error: 'Photo URI is required' };
      }

      const photoInfo = await FileSystem.getInfoAsync(photoUri);
      
      if (!photoInfo.exists) {
        return { isValid: false, error: 'Photo file does not exist' };
      }

      if (photoInfo.size === 0) {
        return { isValid: false, error: 'Photo file is empty' };
      }

      // Check file size limits (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (photoInfo.size > maxSize) {
        return { 
          isValid: false, 
          error: `Photo file too large: ${(photoInfo.size / (1024 * 1024)).toFixed(2)}MB (max 10MB)` 
        };
      }

      // Check if file is readable
      try {
        const base64 = await FileSystem.readAsStringAsync(photoUri, { 
          encoding: FileSystem.EncodingType.Base64,
          length: 100 // Just read first 100 bytes to test
        });
        
        if (!base64) {
          return { isValid: false, error: 'Photo file is not readable' };
        }
      } catch (readError) {
        return { isValid: false, error: `Photo file read error: ${readError.message}` };
      }

      return { 
        isValid: true, 
        size: photoInfo.size,
        sizeMB: (photoInfo.size / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      return { isValid: false, error: `Photo validation failed: ${error.message}` };
    }
  }

  /**
   * Create missing photo placeholder
   * @param {string} snapshotId - Snapshot ID
   * @param {string} fundItemId - Fund item ID
   * @returns {Promise<string>} - Placeholder image path
   */
  async createMissingPhotoPlaceholder(snapshotId, fundItemId) {
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

      console.log('Missing photo placeholder created:', {
        snapshotId,
        fundItemId,
        placeholderPath
      });

      return placeholderPath;
    } catch (error) {
      console.error('Failed to create missing photo placeholder:', error);
      return null;
    }
  }

  /**
   * Get photo display info for UI
   * @param {Object} photoManifestEntry - Photo manifest entry
   * @returns {Object} - Display info for UI
   */
  getPhotoDisplayInfo(photoManifestEntry) {
    const displayInfo = {
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
   * @returns {Promise<Object>} - Cleanup result
   */
  async cleanupOrphanedPhotos() {
    try {
      console.log('Starting orphaned photo cleanup...');

      const cleanupResult = {
        scannedDirectories: 0,
        orphanedDirectories: 0,
        deletedDirectories: [],
        reclaimedSpaceBytes: 0,
        errors: []
      };

      // Get all snapshot directories
      const snapshotDirInfo = await FileSystem.getInfoAsync(this.snapshotStorageDir);
      if (!snapshotDirInfo.exists) {
        return cleanupResult;
      }

      const snapshotDirs = await FileSystem.readDirectoryAsync(this.snapshotStorageDir);
      cleanupResult.scannedDirectories = snapshotDirs.length;

      for (const dirName of snapshotDirs) {
        try {
          // Check if snapshot record exists
          const snapshot = await EntryPackSnapshot.load(dirName);
          
          if (!snapshot) {
            // Orphaned directory - calculate size and delete
            const dirPath = `${this.snapshotStorageDir}${dirName}`;
            const dirSize = await this.calculateDirectorySize(dirPath);
            
            await FileSystem.deleteAsync(dirPath);
            
            cleanupResult.orphanedDirectories++;
            cleanupResult.deletedDirectories.push(dirName);
            cleanupResult.reclaimedSpaceBytes += dirSize;
            
            console.log('Deleted orphaned snapshot directory:', {
              dirName,
              sizeMB: (dirSize / (1024 * 1024)).toFixed(2)
            });
          }
        } catch (error) {
          console.error('Error processing snapshot directory:', dirName, error);
          cleanupResult.errors.push({
            directory: dirName,
            error: error.message
          });
        }
      }

      console.log('Orphaned photo cleanup completed:', {
        ...cleanupResult,
        reclaimedSpaceMB: (cleanupResult.reclaimedSpaceBytes / (1024 * 1024)).toFixed(2)
      });

      return cleanupResult;
    } catch (error) {
      console.error('Failed to cleanup orphaned photos:', error);
      throw error;
    }
  }

  /**
   * Calculate directory size recursively
   * @param {string} dirPath - Directory path
   * @returns {Promise<number>} - Size in bytes
   */
  async calculateDirectorySize(dirPath) {
    try {
      let totalSize = 0;
      
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists || !dirInfo.isDirectory) {
        return 0;
      }

      const items = await FileSystem.readDirectoryAsync(dirPath);
      
      for (const item of items) {
        const itemPath = `${dirPath}/${item}`;
        const itemInfo = await FileSystem.getInfoAsync(itemPath);
        
        if (itemInfo.isDirectory) {
          totalSize += await this.calculateDirectorySize(itemPath);
        } else {
          totalSize += itemInfo.size || 0;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to calculate directory size:', error);
      return 0;
    }
  }

  /**
   * Verify photo integrity in snapshot
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<Object>} - Verification result
   */
  async verifySnapshotPhotoIntegrity(snapshotId) {
    try {
      console.log('Verifying photo integrity for snapshot:', snapshotId);

      const snapshot = await EntryPackSnapshot.load(snapshotId);
      if (!snapshot) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      const verificationResult = {
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
            const photoInfo = await FileSystem.getInfoAsync(photoEntry.snapshotPath);
            
            if (!photoInfo.exists) {
              verificationResult.missingPhotos++;
              verificationResult.issues.push({
                fundItemId: photoEntry.fundItemId,
                issue: 'Photo file missing',
                path: photoEntry.snapshotPath
              });
            } else if (photoInfo.size !== photoEntry.fileSize) {
              verificationResult.corruptedPhotos++;
              verificationResult.issues.push({
                fundItemId: photoEntry.fundItemId,
                issue: 'File size mismatch',
                expected: photoEntry.fileSize,
                actual: photoInfo.size,
                path: photoEntry.snapshotPath
              });
            } else {
              verificationResult.validPhotos++;
            }
          } catch (error) {
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

      console.log('Photo integrity verification completed:', verificationResult);
      return verificationResult;
    } catch (error) {
      console.error('Failed to verify snapshot photo integrity:', error);
      throw error;
    }
  }
}

// Export singleton instance
const snapshotService = new SnapshotService();

export default snapshotService;