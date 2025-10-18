/**
 * BackupService - Service for automatic backup and recovery
 * Supports periodic automatic backup, backup management, data recovery, and cloud backup
 * 
 * Requirements: 22.1-22.5, 19.1-19.5
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import EntryPack from '../../models/EntryPack';
import PassportDataService from '../data/PassportDataService';
import DataExportService from '../export/DataExportService';
import SecureStorageService from '../security/SecureStorageService';

class BackupService {
  constructor() {
    this.backupDirectory = FileSystem.documentDirectory + 'backups/';
    this.cloudBackupDirectory = FileSystem.documentDirectory + 'cloud_backups/';
    this.maxBackups = 10; // Keep recent N backups
    this.backupInterval = 7 * 24 * 60 * 60 * 1000; // Weekly (7 days in milliseconds)
    this.backupScheduleKey = 'backup_schedule';
    this.backupSettingsKey = 'backup_settings';
    this.cloudBackupKey = 'cloud_backup_status';
    this.encryptionKey = 'backup_encryption_key';
  }

  /**
   * Initialize backup service and schedule automatic backups
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('Initializing BackupService');
      
      // Ensure backup directories exist
      await this.ensureDirectoryExists(this.backupDirectory);
      await this.ensureDirectoryExists(this.cloudBackupDirectory);
      
      // Load backup settings
      const settings = await this.getBackupSettings();
      
      // Schedule automatic backup if enabled
      if (settings.automaticBackup) {
        await this.scheduleNextBackup();
      }
      
      // Cleanup old backups
      await this.cleanupOldBackups();
      
      console.log('BackupService initialized');
    } catch (error) {
      console.error('Failed to initialize BackupService:', error);
    }
  }

  /**
   * Create automatic backup
   * @param {Object} options - Backup options
   * @returns {Promise<Object>} - Backup result
   */
  async createAutomaticBackup(options = {}) {
    try {
      console.log('Creating automatic backup');
      
      const settings = await this.getBackupSettings();
      if (!settings.automaticBackup) {
        console.log('Automatic backup is disabled');
        return { success: false, reason: 'Automatic backup disabled' };
      }

      // Check if backup is needed
      const lastBackup = await this.getLastBackupInfo();
      const now = Date.now();
      
      if (lastBackup && (now - lastBackup.createdAt) < this.backupInterval) {
        console.log('Backup not needed yet, last backup was recent');
        return { success: false, reason: 'Recent backup exists' };
      }

      // Create backup
      const backupResult = await this.createBackup({
        type: 'automatic',
        includePhotos: settings.includePhotos,
        ...options
      });

      // Schedule next backup
      await this.scheduleNextBackup();

      return backupResult;

    } catch (error) {
      console.error('Failed to create automatic backup:', error);
      throw error;
    }
  }

  /**
   * Create manual backup
   * @param {Object} options - Backup options
   * @returns {Promise<Object>} - Backup result
   */
  async createManualBackup(options = {}) {
    try {
      console.log('Creating manual backup');
      
      return await this.createBackup({
        type: 'manual',
        includePhotos: true,
        ...options
      });

    } catch (error) {
      console.error('Failed to create manual backup:', error);
      throw error;
    }
  }

  /**
   * Create backup
   * @param {Object} options - Backup options
   * @returns {Promise<Object>} - Backup result
   */
  async createBackup(options = {}) {
    try {
      const backupId = this.generateBackupId();
      const timestamp = new Date().toISOString();
      
      console.log('Creating backup:', backupId);

      // Collect all entry pack IDs
      const entryPackIds = await this.getAllEntryPackIds();
      
      if (entryPackIds.length === 0) {
        console.log('No entry packs to backup');
        return {
          success: true,
          backupId,
          entryPackCount: 0,
          message: 'No data to backup'
        };
      }

      // Create backup metadata
      const backupMetadata = {
        backupId,
        createdAt: Date.now(),
        timestamp,
        type: options.type || 'manual',
        entryPackCount: entryPackIds.length,
        includePhotos: options.includePhotos !== false,
        appVersion: '1.0.0', // TODO: Get from app config
        deviceInfo: await this.getDeviceInfo()
      };

      // Export all entry packs using DataExportService
      const exportResult = await DataExportService.exportMultipleEntryPacks(entryPackIds, 'json', {
        includePhotos: options.includePhotos,
        includeMetadata: true,
        onProgress: options.onProgress
      });

      if (!exportResult.success) {
        throw new Error('Failed to export entry packs for backup');
      }

      // Move export file to backup directory with proper naming
      const backupFilename = `backup_${backupId}_${timestamp.replace(/[:.]/g, '-')}.json`;
      const backupFilePath = this.backupDirectory + backupFilename;
      
      await FileSystem.moveAsync({
        from: exportResult.zipPackage.filePath,
        to: backupFilePath
      });

      // Update metadata with final file info
      const fileInfo = await FileSystem.getInfoAsync(backupFilePath);
      backupMetadata.filename = backupFilename;
      backupMetadata.filePath = backupFilePath;
      backupMetadata.fileSize = fileInfo.size;
      backupMetadata.exportResults = exportResult.exportResults;

      // Save backup metadata
      await this.saveBackupMetadata(backupId, backupMetadata);

      // Update last backup info
      await AsyncStorage.setItem('last_backup_info', JSON.stringify({
        backupId,
        createdAt: backupMetadata.createdAt,
        type: backupMetadata.type,
        entryPackCount: backupMetadata.entryPackCount
      }));

      console.log('Backup created successfully:', {
        backupId,
        filename: backupFilename,
        fileSize: fileInfo.size,
        entryPackCount: entryPackIds.length
      });

      return {
        success: true,
        backupId,
        filename: backupFilename,
        filePath: backupFilePath,
        fileSize: fileInfo.size,
        entryPackCount: entryPackIds.length,
        createdAt: backupMetadata.createdAt,
        metadata: backupMetadata
      };

    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * List available backups
   * @returns {Promise<Array>} - Array of backup info
   */
  async listBackups() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.backupDirectory);
      if (!dirInfo.exists) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(this.backupDirectory);
      const backups = [];

      for (const filename of files) {
        if (filename.startsWith('backup_') && filename.endsWith('.json')) {
          try {
            const backupId = this.extractBackupIdFromFilename(filename);
            const metadata = await this.loadBackupMetadata(backupId);
            
            if (metadata) {
              const filePath = this.backupDirectory + filename;
              const fileInfo = await FileSystem.getInfoAsync(filePath);
              
              backups.push({
                backupId,
                filename,
                filePath,
                fileSize: fileInfo.size,
                createdAt: metadata.createdAt,
                timestamp: metadata.timestamp,
                type: metadata.type,
                entryPackCount: metadata.entryPackCount,
                includePhotos: metadata.includePhotos,
                appVersion: metadata.appVersion
              });
            }
          } catch (error) {
            console.warn(`Failed to load backup metadata for ${filename}:`, error);
          }
        }
      }

      // Sort by creation time (newest first)
      backups.sort((a, b) => b.createdAt - a.createdAt);

      return backups;

    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Get backup details
   * @param {string} backupId - Backup ID
   * @returns {Promise<Object>} - Backup details
   */
  async getBackupDetails(backupId) {
    try {
      const metadata = await this.loadBackupMetadata(backupId);
      if (!metadata) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      const fileInfo = await FileSystem.getInfoAsync(metadata.filePath);
      
      return {
        ...metadata,
        fileExists: fileInfo.exists,
        currentFileSize: fileInfo.size,
        isCorrupted: fileInfo.exists && fileInfo.size !== metadata.fileSize
      };

    } catch (error) {
      console.error('Failed to get backup details:', error);
      throw error;
    }
  }

  /**
   * Delete backup
   * @param {string} backupId - Backup ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteBackup(backupId) {
    try {
      const metadata = await this.loadBackupMetadata(backupId);
      if (!metadata) {
        console.warn(`Backup metadata not found: ${backupId}`);
        return false;
      }

      // Delete backup file
      if (metadata.filePath) {
        const fileInfo = await FileSystem.getInfoAsync(metadata.filePath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(metadata.filePath);
          console.log('Deleted backup file:', metadata.filename);
        }
      }

      // Delete metadata
      await this.deleteBackupMetadata(backupId);

      console.log('Backup deleted:', backupId);
      return true;

    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  }

  /**
   * Cleanup old backups (keep recent N backups)
   * @returns {Promise<Object>} - Cleanup result
   */
  async cleanupOldBackups() {
    try {
      const backups = await this.listBackups();
      
      if (backups.length <= this.maxBackups) {
        return { deletedCount: 0, message: 'No cleanup needed' };
      }

      const backupsToDelete = backups.slice(this.maxBackups);
      let deletedCount = 0;

      for (const backup of backupsToDelete) {
        const success = await this.deleteBackup(backup.backupId);
        if (success) {
          deletedCount++;
        }
      }

      console.log(`Cleaned up ${deletedCount} old backups`);
      
      return {
        deletedCount,
        message: `Cleaned up ${deletedCount} old backups`
      };

    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      return { deletedCount: 0, error: error.message };
    }
  }

  /**
   * Get backup settings
   * @returns {Promise<Object>} - Backup settings
   */
  async getBackupSettings() {
    try {
      const settingsJson = await AsyncStorage.getItem(this.backupSettingsKey);
      const defaultSettings = {
        automaticBackup: true,
        backupInterval: 'weekly', // 'daily', 'weekly', 'monthly'
        includePhotos: true,
        maxBackups: 10,
        wifiOnly: true,
        // Cloud backup settings
        cloudBackup: false,
        cloudProvider: 'device', // 'device', 'icloud', 'googledrive'
        encryptCloudBackups: true,
        automaticCloudSync: false,
        cloudBackupInterval: 'monthly' // 'weekly', 'monthly'
      };

      if (settingsJson) {
        return { ...defaultSettings, ...JSON.parse(settingsJson) };
      }

      return defaultSettings;
    } catch (error) {
      console.error('Failed to get backup settings:', error);
      return {
        automaticBackup: false,
        backupInterval: 'weekly',
        includePhotos: true,
        maxBackups: 10,
        wifiOnly: true,
        cloudBackup: false,
        cloudProvider: 'device',
        encryptCloudBackups: true,
        automaticCloudSync: false,
        cloudBackupInterval: 'monthly'
      };
    }
  }

  /**
   * Update backup settings
   * @param {Object} settings - New settings
   * @returns {Promise<void>}
   */
  async updateBackupSettings(settings) {
    try {
      const currentSettings = await this.getBackupSettings();
      const newSettings = { ...currentSettings, ...settings };
      
      await AsyncStorage.setItem(this.backupSettingsKey, JSON.stringify(newSettings));
      
      // Reschedule backup if automatic backup setting changed
      if (settings.automaticBackup !== undefined) {
        if (settings.automaticBackup) {
          await this.scheduleNextBackup();
        } else {
          await this.cancelScheduledBackup();
        }
      }

      console.log('Backup settings updated:', newSettings);
    } catch (error) {
      console.error('Failed to update backup settings:', error);
      throw error;
    }
  }

  /**
   * Schedule next automatic backup
   * @returns {Promise<void>}
   */
  async scheduleNextBackup() {
    try {
      const settings = await this.getBackupSettings();
      if (!settings.automaticBackup) {
        return;
      }

      const intervalMs = this.getIntervalMilliseconds(settings.backupInterval);
      const nextBackupTime = Date.now() + intervalMs;

      await AsyncStorage.setItem(this.backupScheduleKey, JSON.stringify({
        nextBackupTime,
        interval: settings.backupInterval,
        scheduledAt: Date.now()
      }));

      console.log('Next backup scheduled for:', new Date(nextBackupTime).toISOString());
    } catch (error) {
      console.error('Failed to schedule next backup:', error);
    }
  }

  /**
   * Cancel scheduled backup
   * @returns {Promise<void>}
   */
  async cancelScheduledBackup() {
    try {
      await AsyncStorage.removeItem(this.backupScheduleKey);
      console.log('Scheduled backup cancelled');
    } catch (error) {
      console.error('Failed to cancel scheduled backup:', error);
    }
  }

  /**
   * Check if backup is due
   * @returns {Promise<boolean>} - Whether backup is due
   */
  async isBackupDue() {
    try {
      const scheduleJson = await AsyncStorage.getItem(this.backupScheduleKey);
      if (!scheduleJson) {
        return false;
      }

      const schedule = JSON.parse(scheduleJson);
      return Date.now() >= schedule.nextBackupTime;
    } catch (error) {
      console.error('Failed to check if backup is due:', error);
      return false;
    }
  }

  /**
   * Get last backup info
   * @returns {Promise<Object|null>} - Last backup info
   */
  async getLastBackupInfo() {
    try {
      const infoJson = await AsyncStorage.getItem('last_backup_info');
      return infoJson ? JSON.parse(infoJson) : null;
    } catch (error) {
      console.error('Failed to get last backup info:', error);
      return null;
    }
  }

  /**
   * Get backup statistics
   * @returns {Promise<Object>} - Backup statistics
   */
  async getBackupStatistics() {
    try {
      const backups = await this.listBackups();
      const cloudBackups = await this.listCloudBackups();
      
      const totalSize = backups.reduce((sum, backup) => sum + backup.fileSize, 0);
      const cloudTotalSize = cloudBackups.reduce((sum, backup) => sum + backup.fileSize, 0);
      
      const automaticBackups = backups.filter(b => b.type === 'automatic').length;
      const manualBackups = backups.filter(b => b.type === 'manual').length;
      const cloudBackupsCount = cloudBackups.length;
      
      const syncedCloudBackups = cloudBackups.filter(b => b.syncStatus === 'synced').length;
      const pendingCloudBackups = cloudBackups.filter(b => b.syncStatus === 'pending' || b.syncStatus === 'failed').length;

      return {
        // Local backups
        totalBackups: backups.length,
        automaticBackups,
        manualBackups,
        totalSize,
        oldestBackup: backups.length > 0 ? backups[backups.length - 1] : null,
        newestBackup: backups.length > 0 ? backups[0] : null,
        averageSize: backups.length > 0 ? Math.round(totalSize / backups.length) : 0,
        
        // Cloud backups
        cloudBackupsCount,
        cloudTotalSize,
        syncedCloudBackups,
        pendingCloudBackups,
        cloudSyncRate: cloudBackupsCount > 0 ? Math.round((syncedCloudBackups / cloudBackupsCount) * 100) : 0,
        
        // Combined
        totalAllBackups: backups.length + cloudBackupsCount,
        totalAllSize: totalSize + cloudTotalSize
      };
    } catch (error) {
      console.error('Failed to get backup statistics:', error);
      return {
        totalBackups: 0,
        automaticBackups: 0,
        manualBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null,
        averageSize: 0,
        cloudBackupsCount: 0,
        cloudTotalSize: 0,
        syncedCloudBackups: 0,
        pendingCloudBackups: 0,
        cloudSyncRate: 0,
        totalAllBackups: 0,
        totalAllSize: 0
      };
    }
  }

  // Cloud Backup Methods

  /**
   * Create encrypted cloud backup
   * @param {Object} options - Cloud backup options
   * @returns {Promise<Object>} - Cloud backup result
   */
  async createCloudBackup(options = {}) {
    try {
      console.log('Creating cloud backup');
      
      const settings = await this.getBackupSettings();
      if (!settings.cloudBackup) {
        throw new Error('Cloud backup is disabled');
      }

      // Create local backup first
      const localBackup = await this.createBackup({
        type: 'cloud',
        includePhotos: options.includePhotos !== false,
        onProgress: options.onProgress
      });

      if (!localBackup.success) {
        throw new Error('Failed to create local backup for cloud upload');
      }

      // Encrypt backup data
      const encryptedBackup = await this.encryptBackupFile(localBackup.filePath, options.password);
      
      // Prepare cloud backup metadata
      const cloudBackupMetadata = {
        ...localBackup.metadata,
        cloudBackupId: this.generateCloudBackupId(),
        encrypted: true,
        encryptionMethod: 'AES-256',
        cloudProvider: options.provider || 'device', // 'icloud', 'googledrive', 'device'
        uploadedAt: null,
        syncStatus: 'pending',
        lastSyncAttempt: Date.now()
      };

      // Save to cloud backup directory
      const cloudBackupPath = this.cloudBackupDirectory + `cloud_${cloudBackupMetadata.cloudBackupId}.enc`;
      await FileSystem.moveAsync({
        from: encryptedBackup.filePath,
        to: cloudBackupPath
      });

      cloudBackupMetadata.cloudFilePath = cloudBackupPath;
      cloudBackupMetadata.encryptedSize = encryptedBackup.fileSize;

      // Save cloud backup metadata
      await this.saveCloudBackupMetadata(cloudBackupMetadata.cloudBackupId, cloudBackupMetadata);

      // Attempt cloud upload based on provider
      let uploadResult = { success: false, message: 'Cloud upload not implemented' };
      
      if (options.provider === 'device') {
        // For device-based sharing (user manually saves to their preferred cloud)
        uploadResult = await this.shareBackupToDevice(cloudBackupPath, cloudBackupMetadata);
      } else if (options.provider === 'icloud' && Platform.OS === 'ios') {
        uploadResult = await this.uploadToiCloud(cloudBackupPath, cloudBackupMetadata);
      } else if (options.provider === 'googledrive') {
        uploadResult = await this.uploadToGoogleDrive(cloudBackupPath, cloudBackupMetadata);
      }

      // Update sync status
      cloudBackupMetadata.syncStatus = uploadResult.success ? 'synced' : 'failed';
      cloudBackupMetadata.uploadedAt = uploadResult.success ? Date.now() : null;
      cloudBackupMetadata.syncError = uploadResult.success ? null : uploadResult.error;
      
      await this.saveCloudBackupMetadata(cloudBackupMetadata.cloudBackupId, cloudBackupMetadata);

      // Update cloud backup status
      await this.updateCloudBackupStatus({
        lastCloudBackup: cloudBackupMetadata.cloudBackupId,
        lastCloudBackupTime: Date.now(),
        cloudProvider: options.provider,
        syncStatus: cloudBackupMetadata.syncStatus
      });

      console.log('Cloud backup created:', {
        cloudBackupId: cloudBackupMetadata.cloudBackupId,
        syncStatus: cloudBackupMetadata.syncStatus,
        provider: options.provider
      });

      return {
        success: true,
        cloudBackupId: cloudBackupMetadata.cloudBackupId,
        localBackupId: localBackup.backupId,
        syncStatus: cloudBackupMetadata.syncStatus,
        uploadResult,
        metadata: cloudBackupMetadata
      };

    } catch (error) {
      console.error('Failed to create cloud backup:', error);
      throw error;
    }
  }

  /**
   * List cloud backups
   * @returns {Promise<Array>} - Array of cloud backup info
   */
  async listCloudBackups() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cloudBackupDirectory);
      if (!dirInfo.exists) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(this.cloudBackupDirectory);
      const cloudBackups = [];

      for (const filename of files) {
        if (filename.startsWith('cloud_') && filename.endsWith('.enc')) {
          try {
            const cloudBackupId = this.extractCloudBackupIdFromFilename(filename);
            const metadata = await this.loadCloudBackupMetadata(cloudBackupId);
            
            if (metadata) {
              const filePath = this.cloudBackupDirectory + filename;
              const fileInfo = await FileSystem.getInfoAsync(filePath);
              
              cloudBackups.push({
                cloudBackupId,
                filename,
                filePath,
                fileSize: fileInfo.size,
                encryptedSize: metadata.encryptedSize,
                createdAt: metadata.createdAt,
                uploadedAt: metadata.uploadedAt,
                syncStatus: metadata.syncStatus,
                cloudProvider: metadata.cloudProvider,
                entryPackCount: metadata.entryPackCount,
                encrypted: metadata.encrypted
              });
            }
          } catch (error) {
            console.warn(`Failed to load cloud backup metadata for ${filename}:`, error);
          }
        }
      }

      // Sort by creation time (newest first)
      cloudBackups.sort((a, b) => b.createdAt - a.createdAt);

      return cloudBackups;

    } catch (error) {
      console.error('Failed to list cloud backups:', error);
      return [];
    }
  }

  /**
   * Restore from cloud backup
   * @param {string} cloudBackupId - Cloud backup ID
   * @param {string} password - Decryption password
   * @param {Object} options - Restore options
   * @returns {Promise<Object>} - Restore result
   */
  async restoreFromCloudBackup(cloudBackupId, password, options = {}) {
    try {
      console.log('Restoring from cloud backup:', cloudBackupId);

      const metadata = await this.loadCloudBackupMetadata(cloudBackupId);
      if (!metadata) {
        throw new Error(`Cloud backup not found: ${cloudBackupId}`);
      }

      // Check if encrypted backup file exists locally
      const encryptedFilePath = metadata.cloudFilePath;
      const fileInfo = await FileSystem.getInfoAsync(encryptedFilePath);
      
      if (!fileInfo.exists) {
        throw new Error('Encrypted backup file not found locally. Please download from cloud first.');
      }

      // Decrypt backup file
      const decryptedBackup = await this.decryptBackupFile(encryptedFilePath, password);
      
      // Use DataImportService to restore the data
      const DataImportService = require('../import/DataImportService').default;
      const importResult = await DataImportService.importFromFile(decryptedBackup.filePath, {
        conflictResolution: options.conflictResolution || 'ask',
        onProgress: options.onProgress
      });

      // Clean up decrypted file
      await FileSystem.deleteAsync(decryptedBackup.filePath);

      console.log('Cloud backup restored successfully:', {
        cloudBackupId,
        importedEntryPacks: importResult.importedCount,
        conflicts: importResult.conflicts?.length || 0
      });

      return {
        success: true,
        cloudBackupId,
        importResult,
        restoredAt: Date.now()
      };

    } catch (error) {
      console.error('Failed to restore from cloud backup:', error);
      throw error;
    }
  }

  /**
   * Sync pending cloud backups
   * @returns {Promise<Object>} - Sync result
   */
  async syncPendingCloudBackups() {
    try {
      const cloudBackups = await this.listCloudBackups();
      const pendingBackups = cloudBackups.filter(backup => backup.syncStatus === 'pending' || backup.syncStatus === 'failed');
      
      if (pendingBackups.length === 0) {
        return { success: true, syncedCount: 0, message: 'No pending backups to sync' };
      }

      let syncedCount = 0;
      const syncResults = [];

      for (const backup of pendingBackups) {
        try {
          const metadata = await this.loadCloudBackupMetadata(backup.cloudBackupId);
          
          let uploadResult = { success: false };
          
          if (metadata.cloudProvider === 'icloud' && Platform.OS === 'ios') {
            uploadResult = await this.uploadToiCloud(backup.filePath, metadata);
          } else if (metadata.cloudProvider === 'googledrive') {
            uploadResult = await this.uploadToGoogleDrive(backup.filePath, metadata);
          }

          // Update metadata
          metadata.syncStatus = uploadResult.success ? 'synced' : 'failed';
          metadata.uploadedAt = uploadResult.success ? Date.now() : null;
          metadata.lastSyncAttempt = Date.now();
          metadata.syncError = uploadResult.success ? null : uploadResult.error;
          
          await this.saveCloudBackupMetadata(backup.cloudBackupId, metadata);

          if (uploadResult.success) {
            syncedCount++;
          }

          syncResults.push({
            cloudBackupId: backup.cloudBackupId,
            success: uploadResult.success,
            error: uploadResult.error
          });

        } catch (error) {
          console.error(`Failed to sync cloud backup ${backup.cloudBackupId}:`, error);
          syncResults.push({
            cloudBackupId: backup.cloudBackupId,
            success: false,
            error: error.message
          });
        }
      }

      return {
        success: true,
        syncedCount,
        totalPending: pendingBackups.length,
        syncResults
      };

    } catch (error) {
      console.error('Failed to sync pending cloud backups:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cloud backup status
   * @returns {Promise<Object>} - Cloud backup status
   */
  async getCloudBackupStatus() {
    try {
      const statusJson = await AsyncStorage.getItem(this.cloudBackupKey);
      const defaultStatus = {
        enabled: false,
        lastCloudBackup: null,
        lastCloudBackupTime: null,
        cloudProvider: null,
        syncStatus: null,
        totalCloudBackups: 0,
        pendingSyncs: 0
      };

      let status = defaultStatus;
      if (statusJson) {
        status = { ...defaultStatus, ...JSON.parse(statusJson) };
      }

      // Update counts
      const cloudBackups = await this.listCloudBackups();
      status.totalCloudBackups = cloudBackups.length;
      status.pendingSyncs = cloudBackups.filter(b => b.syncStatus === 'pending' || b.syncStatus === 'failed').length;

      return status;
    } catch (error) {
      console.error('Failed to get cloud backup status:', error);
      return {
        enabled: false,
        lastCloudBackup: null,
        lastCloudBackupTime: null,
        cloudProvider: null,
        syncStatus: null,
        totalCloudBackups: 0,
        pendingSyncs: 0
      };
    }
  }

  /**
   * Update cloud backup status
   * @param {Object} status - Status update
   * @returns {Promise<void>}
   */
  async updateCloudBackupStatus(status) {
    try {
      const currentStatus = await this.getCloudBackupStatus();
      const newStatus = { ...currentStatus, ...status };
      
      await AsyncStorage.setItem(this.cloudBackupKey, JSON.stringify(newStatus));
      console.log('Cloud backup status updated:', newStatus);
    } catch (error) {
      console.error('Failed to update cloud backup status:', error);
    }
  }

  /**
   * Delete cloud backup
   * @param {string} cloudBackupId - Cloud backup ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteCloudBackup(cloudBackupId) {
    try {
      const metadata = await this.loadCloudBackupMetadata(cloudBackupId);
      if (!metadata) {
        console.warn(`Cloud backup metadata not found: ${cloudBackupId}`);
        return false;
      }

      // Delete local encrypted file
      if (metadata.cloudFilePath) {
        const fileInfo = await FileSystem.getInfoAsync(metadata.cloudFilePath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(metadata.cloudFilePath);
          console.log('Deleted cloud backup file:', metadata.cloudFilePath);
        }
      }

      // Delete metadata
      await this.deleteCloudBackupMetadata(cloudBackupId);

      console.log('Cloud backup deleted:', cloudBackupId);
      return true;

    } catch (error) {
      console.error('Failed to delete cloud backup:', error);
      return false;
    }
  }

  // Cloud Provider Methods

  /**
   * Share backup to device (user chooses cloud service)
   * @param {string} filePath - Backup file path
   * @param {Object} metadata - Backup metadata
   * @returns {Promise<Object>} - Share result
   */
  async shareBackupToDevice(filePath, metadata) {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        return { success: false, error: 'Sharing not available on this device' };
      }

      await Sharing.shareAsync(filePath, {
        mimeType: 'application/octet-stream',
        dialogTitle: 'Save Encrypted Backup to Cloud',
        UTI: 'public.data'
      });

      return { 
        success: true, 
        message: 'Backup shared to device. User can save to their preferred cloud service.' 
      };

    } catch (error) {
      console.error('Failed to share backup to device:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload to iCloud (iOS only)
   * @param {string} filePath - Backup file path
   * @param {Object} metadata - Backup metadata
   * @returns {Promise<Object>} - Upload result
   */
  async uploadToiCloud(filePath, metadata) {
    try {
      if (Platform.OS !== 'ios') {
        return { success: false, error: 'iCloud only available on iOS' };
      }

      // Note: This is a placeholder implementation
      // In a real app, you would use react-native-icloud-storage or similar
      console.log('iCloud upload not implemented - using device sharing instead');
      
      return await this.shareBackupToDevice(filePath, metadata);

    } catch (error) {
      console.error('Failed to upload to iCloud:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload to Google Drive
   * @param {string} filePath - Backup file path
   * @param {Object} metadata - Backup metadata
   * @returns {Promise<Object>} - Upload result
   */
  async uploadToGoogleDrive(filePath, metadata) {
    try {
      // Note: This is a placeholder implementation
      // In a real app, you would use Google Drive API
      console.log('Google Drive upload not implemented - using device sharing instead');
      
      return await this.shareBackupToDevice(filePath, metadata);

    } catch (error) {
      console.error('Failed to upload to Google Drive:', error);
      return { success: false, error: error.message };
    }
  }

  // Encryption Methods

  /**
   * Encrypt backup file
   * @param {string} filePath - Source file path
   * @param {string} password - Encryption password (optional, uses default field type if not provided)
   * @returns {Promise<Object>} - Encrypted file info
   */
  async encryptBackupFile(filePath, password) {
    try {
      console.log('Encrypting backup file');

      // Read source file
      const sourceData = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8
      });

      // Use EncryptionService for encryption
      // If password is provided, use it as a custom field type for key derivation
      const fieldType = password ? `backup_${password.slice(0, 8)}` : 'backup_data';
      const encryptedData = await SecureStorageService.encryption.encrypt(sourceData, fieldType);
      
      // Create encrypted file
      const encryptedFilePath = filePath.replace('.json', '.enc');
      await FileSystem.writeAsStringAsync(encryptedFilePath, encryptedData, {
        encoding: FileSystem.EncodingType.UTF8
      });

      const fileInfo = await FileSystem.getInfoAsync(encryptedFilePath);

      console.log('Backup file encrypted successfully');

      return {
        filePath: encryptedFilePath,
        fileSize: fileInfo.size,
        encrypted: true,
        fieldType: fieldType
      };

    } catch (error) {
      console.error('Failed to encrypt backup file:', error);
      throw error;
    }
  }

  /**
   * Decrypt backup file
   * @param {string} encryptedFilePath - Encrypted file path
   * @param {string} password - Decryption password (optional, uses default field type if not provided)
   * @returns {Promise<Object>} - Decrypted file info
   */
  async decryptBackupFile(encryptedFilePath, password) {
    try {
      console.log('Decrypting backup file');

      // Read encrypted file
      const encryptedData = await FileSystem.readAsStringAsync(encryptedFilePath, {
        encoding: FileSystem.EncodingType.UTF8
      });

      // Use EncryptionService for decryption
      // If password is provided, use it as a custom field type for key derivation
      const fieldType = password ? `backup_${password.slice(0, 8)}` : 'backup_data';
      const decryptedData = await SecureStorageService.encryption.decrypt(encryptedData, fieldType);
      
      // Create decrypted file
      const decryptedFilePath = encryptedFilePath.replace('.enc', '_decrypted.json');
      await FileSystem.writeAsStringAsync(decryptedFilePath, decryptedData, {
        encoding: FileSystem.EncodingType.UTF8
      });

      const fileInfo = await FileSystem.getInfoAsync(decryptedFilePath);

      console.log('Backup file decrypted successfully');

      return {
        filePath: decryptedFilePath,
        fileSize: fileInfo.size,
        decrypted: true
      };

    } catch (error) {
      console.error('Failed to decrypt backup file:', error);
      throw error;
    }
  }

  // Data Recovery Methods

  /**
   * List available backups for recovery
   * @param {Object} options - Recovery options
   * @returns {Promise<Object>} - Available backups info
   */
  async listAvailableBackups(options = {}) {
    try {
      const localBackups = await this.listBackups();
      const cloudBackups = await this.listCloudBackups();

      // Combine and sort by creation date
      const allBackups = [
        ...localBackups.map(backup => ({ ...backup, type: 'local' })),
        ...cloudBackups.map(backup => ({ ...backup, type: 'cloud' }))
      ].sort((a, b) => b.createdAt - a.createdAt);

      // Calculate recovery statistics
      const totalSize = allBackups.reduce((sum, backup) => sum + backup.fileSize, 0);
      const localCount = localBackups.length;
      const cloudCount = cloudBackups.length;

      return {
        success: true,
        backups: allBackups,
        statistics: {
          totalBackups: allBackups.length,
          localBackups: localCount,
          cloudBackups: cloudCount,
          totalSize,
          oldestBackup: allBackups.length > 0 ? allBackups[allBackups.length - 1] : null,
          newestBackup: allBackups.length > 0 ? allBackups[0] : null
        }
      };

    } catch (error) {
      console.error('Failed to list available backups:', error);
      return {
        success: false,
        error: error.message,
        backups: [],
        statistics: null
      };
    }
  }

  /**
   * Get detailed backup information for recovery
   * @param {string} backupId - Backup ID (local or cloud)
   * @param {string} backupType - 'local' or 'cloud'
   * @returns {Promise<Object>} - Detailed backup info
   */
  async getBackupRecoveryInfo(backupId, backupType = 'local') {
    try {
      let metadata = null;
      let fileExists = false;
      let fileSize = 0;

      if (backupType === 'local') {
        metadata = await this.loadBackupMetadata(backupId);
        if (metadata && metadata.filePath) {
          const fileInfo = await FileSystem.getInfoAsync(metadata.filePath);
          fileExists = fileInfo.exists;
          fileSize = fileInfo.size;
        }
      } else if (backupType === 'cloud') {
        metadata = await this.loadCloudBackupMetadata(backupId);
        if (metadata && metadata.cloudFilePath) {
          const fileInfo = await FileSystem.getInfoAsync(metadata.cloudFilePath);
          fileExists = fileInfo.exists;
          fileSize = fileInfo.size;
        }
      }

      if (!metadata) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // Analyze backup contents
      const recoveryInfo = {
        backupId,
        backupType,
        createdAt: metadata.createdAt,
        entryPackCount: metadata.entryPackCount,
        includePhotos: metadata.includePhotos,
        appVersion: metadata.appVersion,
        fileExists,
        fileSize,
        encrypted: metadata.encrypted || false,
        syncStatus: metadata.syncStatus || 'local',
        
        // Recovery options
        canRecover: fileExists,
        requiresPassword: metadata.encrypted || false,
        estimatedRecoveryTime: this.estimateRecoveryTime(metadata.entryPackCount, metadata.includePhotos),
        
        // Detailed contents
        exportResults: metadata.exportResults || null,
        deviceInfo: metadata.deviceInfo || null
      };

      return {
        success: true,
        recoveryInfo
      };

    } catch (error) {
      console.error('Failed to get backup recovery info:', error);
      return {
        success: false,
        error: error.message,
        recoveryInfo: null
      };
    }
  }

  /**
   * Perform selective recovery (recover specific entry packs)
   * @param {string} backupId - Backup ID
   * @param {string} backupType - 'local' or 'cloud'
   * @param {Object} options - Recovery options
   * @returns {Promise<Object>} - Recovery result
   */
  async performSelectiveRecovery(backupId, backupType, options = {}) {
    try {
      console.log('Starting selective recovery:', { backupId, backupType, options });

      // Get backup file path
      let backupFilePath = null;
      let isEncrypted = false;

      if (backupType === 'local') {
        const metadata = await this.loadBackupMetadata(backupId);
        if (!metadata) {
          throw new Error(`Local backup not found: ${backupId}`);
        }
        backupFilePath = metadata.filePath;
        isEncrypted = metadata.encrypted || false;
      } else if (backupType === 'cloud') {
        const metadata = await this.loadCloudBackupMetadata(backupId);
        if (!metadata) {
          throw new Error(`Cloud backup not found: ${backupId}`);
        }
        backupFilePath = metadata.cloudFilePath;
        isEncrypted = metadata.encrypted || false;
      }

      if (!backupFilePath) {
        throw new Error('Backup file path not found');
      }

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(backupFilePath);
      if (!fileInfo.exists) {
        throw new Error('Backup file does not exist');
      }

      // Decrypt if necessary
      let recoveryFilePath = backupFilePath;
      if (isEncrypted) {
        if (!options.password) {
          throw new Error('Password required for encrypted backup');
        }
        const decryptedBackup = await this.decryptBackupFile(backupFilePath, options.password);
        recoveryFilePath = decryptedBackup.filePath;
      }

      // Use DataImportService for selective recovery
      const DataImportService = require('../import/DataImportService').default;
      
      const importOptions = {
        selectiveImport: true,
        selectedEntryPacks: options.selectedEntryPacks || [],
        conflictResolution: options.conflictResolution || 'ask',
        onProgress: options.onProgress,
        dryRun: options.dryRun || false
      };

      const importResult = await DataImportService.importFromFile(recoveryFilePath, importOptions);

      // Clean up decrypted file if it was created
      if (isEncrypted && recoveryFilePath !== backupFilePath) {
        await FileSystem.deleteAsync(recoveryFilePath);
      }

      console.log('Selective recovery completed:', {
        backupId,
        recoveredCount: importResult.importedCount,
        conflicts: importResult.conflicts?.length || 0
      });

      return {
        success: true,
        backupId,
        backupType,
        recoveredCount: importResult.importedCount,
        skippedCount: importResult.skippedCount,
        conflicts: importResult.conflicts || [],
        importResult,
        recoveredAt: Date.now()
      };

    } catch (error) {
      console.error('Failed to perform selective recovery:', error);
      return {
        success: false,
        error: error.message,
        backupId,
        backupType
      };
    }
  }

  /**
   * Perform full recovery (recover all data from backup)
   * @param {string} backupId - Backup ID
   * @param {string} backupType - 'local' or 'cloud'
   * @param {Object} options - Recovery options
   * @returns {Promise<Object>} - Recovery result
   */
  async performFullRecovery(backupId, backupType, options = {}) {
    try {
      console.log('Starting full recovery:', { backupId, backupType, options });

      // Perform selective recovery with all entry packs
      const selectiveOptions = {
        ...options,
        selectedEntryPacks: [], // Empty array means recover all
        conflictResolution: options.conflictResolution || 'overwrite'
      };

      const recoveryResult = await this.performSelectiveRecovery(backupId, backupType, selectiveOptions);

      if (recoveryResult.success) {
        // Update recovery statistics
        await this.updateRecoveryStatistics({
          lastFullRecovery: Date.now(),
          lastRecoveredBackupId: backupId,
          lastRecoveredBackupType: backupType,
          totalRecoveredEntryPacks: recoveryResult.recoveredCount
        });

        console.log('Full recovery completed successfully:', {
          backupId,
          recoveredCount: recoveryResult.recoveredCount
        });
      }

      return recoveryResult;

    } catch (error) {
      console.error('Failed to perform full recovery:', error);
      return {
        success: false,
        error: error.message,
        backupId,
        backupType
      };
    }
  }

  /**
   * Preview backup contents before recovery
   * @param {string} backupId - Backup ID
   * @param {string} backupType - 'local' or 'cloud'
   * @param {string} password - Password for encrypted backups
   * @returns {Promise<Object>} - Backup preview
   */
  async previewBackupContents(backupId, backupType, password = null) {
    try {
      console.log('Previewing backup contents:', { backupId, backupType });

      // Get backup file path
      let backupFilePath = null;
      let isEncrypted = false;
      let metadata = null;

      if (backupType === 'local') {
        metadata = await this.loadBackupMetadata(backupId);
        if (!metadata) {
          throw new Error(`Local backup not found: ${backupId}`);
        }
        backupFilePath = metadata.filePath;
        isEncrypted = metadata.encrypted || false;
      } else if (backupType === 'cloud') {
        metadata = await this.loadCloudBackupMetadata(backupId);
        if (!metadata) {
          throw new Error(`Cloud backup not found: ${backupId}`);
        }
        backupFilePath = metadata.cloudFilePath;
        isEncrypted = metadata.encrypted || false;
      }

      // Decrypt if necessary
      let previewFilePath = backupFilePath;
      if (isEncrypted) {
        if (!password) {
          throw new Error('Password required for encrypted backup preview');
        }
        const decryptedBackup = await this.decryptBackupFile(backupFilePath, password);
        previewFilePath = decryptedBackup.filePath;
      }

      // Read and parse backup contents
      const backupData = await FileSystem.readAsStringAsync(previewFilePath, {
        encoding: FileSystem.EncodingType.UTF8
      });

      const parsedData = JSON.parse(backupData);

      // Extract preview information
      const entryPacks = parsedData.entryPacks || [];
      const preview = {
        backupId,
        backupType,
        createdAt: metadata.createdAt,
        entryPackCount: entryPacks.length,
        totalSize: metadata.fileSize,
        
        entryPacks: entryPacks.map(pack => ({
          id: pack.id,
          destinationId: pack.destinationId,
          status: pack.status,
          createdAt: pack.createdAt,
          arrivalDate: pack.travel?.arrivalDate,
          departureDate: pack.travel?.departureDate,
          hasPhotos: (pack.funds || []).some(fund => fund.photoUri),
          photoCount: (pack.funds || []).filter(fund => fund.photoUri).length,
          tdacSubmitted: !!pack.tdacSubmission
        })),

        metadata: {
          appVersion: metadata.appVersion,
          deviceInfo: metadata.deviceInfo,
          includePhotos: metadata.includePhotos,
          exportMethod: parsedData.exportMetadata?.method || 'unknown'
        }
      };

      // Clean up decrypted file if it was created
      if (isEncrypted && previewFilePath !== backupFilePath) {
        await FileSystem.deleteAsync(previewFilePath);
      }

      return {
        success: true,
        preview
      };

    } catch (error) {
      console.error('Failed to preview backup contents:', error);
      return {
        success: false,
        error: error.message,
        preview: null
      };
    }
  }

  /**
   * Validate backup integrity before recovery
   * @param {string} backupId - Backup ID
   * @param {string} backupType - 'local' or 'cloud'
   * @param {string} password - Password for encrypted backups
   * @returns {Promise<Object>} - Validation result
   */
  async validateBackupIntegrity(backupId, backupType, password = null) {
    try {
      console.log('Validating backup integrity:', { backupId, backupType });

      const validationResult = {
        backupId,
        backupType,
        isValid: false,
        errors: [],
        warnings: [],
        details: {}
      };

      // Get backup metadata
      let metadata = null;
      if (backupType === 'local') {
        metadata = await this.loadBackupMetadata(backupId);
      } else if (backupType === 'cloud') {
        metadata = await this.loadCloudBackupMetadata(backupId);
      }

      if (!metadata) {
        validationResult.errors.push('Backup metadata not found');
        return { success: true, validation: validationResult };
      }

      // Check file existence
      const filePath = backupType === 'local' ? metadata.filePath : metadata.cloudFilePath;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (!fileInfo.exists) {
        validationResult.errors.push('Backup file does not exist');
        return { success: true, validation: validationResult };
      }

      // Check file size
      if (fileInfo.size !== metadata.fileSize && !metadata.encrypted) {
        validationResult.warnings.push(`File size mismatch: expected ${metadata.fileSize}, actual ${fileInfo.size}`);
      }

      // Try to preview contents (this validates decryption and JSON parsing)
      const previewResult = await this.previewBackupContents(backupId, backupType, password);
      
      if (!previewResult.success) {
        validationResult.errors.push(`Content validation failed: ${previewResult.error}`);
        return { success: true, validation: validationResult };
      }

      // Validate entry pack count
      const actualCount = previewResult.preview.entryPackCount;
      const expectedCount = metadata.entryPackCount;
      
      if (actualCount !== expectedCount) {
        validationResult.warnings.push(`Entry pack count mismatch: expected ${expectedCount}, actual ${actualCount}`);
      }

      // Check for required fields in each entry pack
      const entryPacks = previewResult.preview.entryPacks;
      let missingFieldsCount = 0;
      
      entryPacks.forEach((pack, index) => {
        if (!pack.id || !pack.destinationId) {
          missingFieldsCount++;
        }
      });

      if (missingFieldsCount > 0) {
        validationResult.warnings.push(`${missingFieldsCount} entry packs have missing required fields`);
      }

      // Set validation result
      validationResult.isValid = validationResult.errors.length === 0;
      validationResult.details = {
        fileSize: fileInfo.size,
        entryPackCount: actualCount,
        hasPhotos: entryPacks.some(pack => pack.hasPhotos),
        totalPhotos: entryPacks.reduce((sum, pack) => sum + pack.photoCount, 0),
        appVersion: metadata.appVersion,
        createdAt: metadata.createdAt
      };

      return {
        success: true,
        validation: validationResult
      };

    } catch (error) {
      console.error('Failed to validate backup integrity:', error);
      return {
        success: false,
        error: error.message,
        validation: null
      };
    }
  }

  /**
   * Get recovery statistics
   * @returns {Promise<Object>} - Recovery statistics
   */
  async getRecoveryStatistics() {
    try {
      const statsJson = await AsyncStorage.getItem('recovery_statistics');
      const defaultStats = {
        totalRecoveries: 0,
        lastFullRecovery: null,
        lastSelectiveRecovery: null,
        lastRecoveredBackupId: null,
        lastRecoveredBackupType: null,
        totalRecoveredEntryPacks: 0,
        averageRecoveryTime: 0,
        successfulRecoveries: 0,
        failedRecoveries: 0
      };

      if (statsJson) {
        return { ...defaultStats, ...JSON.parse(statsJson) };
      }

      return defaultStats;
    } catch (error) {
      console.error('Failed to get recovery statistics:', error);
      return {
        totalRecoveries: 0,
        lastFullRecovery: null,
        lastSelectiveRecovery: null,
        lastRecoveredBackupId: null,
        lastRecoveredBackupType: null,
        totalRecoveredEntryPacks: 0,
        averageRecoveryTime: 0,
        successfulRecoveries: 0,
        failedRecoveries: 0
      };
    }
  }

  /**
   * Update recovery statistics
   * @param {Object} stats - Statistics update
   * @returns {Promise<void>}
   */
  async updateRecoveryStatistics(stats) {
    try {
      const currentStats = await this.getRecoveryStatistics();
      const newStats = { ...currentStats, ...stats };
      
      await AsyncStorage.setItem('recovery_statistics', JSON.stringify(newStats));
      console.log('Recovery statistics updated:', newStats);
    } catch (error) {
      console.error('Failed to update recovery statistics:', error);
    }
  }

  /**
   * Estimate recovery time based on backup contents
   * @param {number} entryPackCount - Number of entry packs
   * @param {boolean} includePhotos - Whether backup includes photos
   * @returns {number} - Estimated time in milliseconds
   */
  estimateRecoveryTime(entryPackCount, includePhotos) {
    // Base time per entry pack: 500ms
    let estimatedTime = entryPackCount * 500;
    
    // Add time for photos: 200ms per entry pack with photos
    if (includePhotos) {
      estimatedTime += entryPackCount * 200;
    }
    
    // Minimum 1 second, maximum 30 seconds
    return Math.max(1000, Math.min(30000, estimatedTime));
  }

  // Cloud Backup Helper Methods

  /**
   * Generate unique cloud backup ID
   * @returns {string} - Cloud backup ID
   */
  generateCloudBackupId() {
    return `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract cloud backup ID from filename
   * @param {string} filename - Cloud backup filename
   * @returns {string} - Cloud backup ID
   */
  extractCloudBackupIdFromFilename(filename) {
    const match = filename.match(/^cloud_([^.]+)\.enc$/);
    return match ? match[1] : null;
  }

  /**
   * Save cloud backup metadata
   * @param {string} cloudBackupId - Cloud backup ID
   * @param {Object} metadata - Cloud backup metadata
   * @returns {Promise<void>}
   */
  async saveCloudBackupMetadata(cloudBackupId, metadata) {
    try {
      const metadataPath = this.cloudBackupDirectory + `${cloudBackupId}_metadata.json`;
      await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata, null, 2), {
        encoding: FileSystem.EncodingType.UTF8
      });
    } catch (error) {
      console.error('Failed to save cloud backup metadata:', error);
      throw error;
    }
  }

  /**
   * Load cloud backup metadata
   * @param {string} cloudBackupId - Cloud backup ID
   * @returns {Promise<Object|null>} - Cloud backup metadata
   */
  async loadCloudBackupMetadata(cloudBackupId) {
    try {
      const metadataPath = this.cloudBackupDirectory + `${cloudBackupId}_metadata.json`;
      const fileInfo = await FileSystem.getInfoAsync(metadataPath);
      
      if (!fileInfo.exists) {
        return null;
      }

      const metadataJson = await FileSystem.readAsStringAsync(metadataPath, {
        encoding: FileSystem.EncodingType.UTF8
      });

      return JSON.parse(metadataJson);
    } catch (error) {
      console.error('Failed to load cloud backup metadata:', error);
      return null;
    }
  }

  /**
   * Delete cloud backup metadata
   * @param {string} cloudBackupId - Cloud backup ID
   * @returns {Promise<void>}
   */
  async deleteCloudBackupMetadata(cloudBackupId) {
    try {
      const metadataPath = this.cloudBackupDirectory + `${cloudBackupId}_metadata.json`;
      const fileInfo = await FileSystem.getInfoAsync(metadataPath);
      
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(metadataPath);
      }
    } catch (error) {
      console.error('Failed to delete cloud backup metadata:', error);
    }
  }

  // Helper methods

  /**
   * Generate unique backup ID
   * @returns {string} - Backup ID
   */
  generateBackupId() {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract backup ID from filename
   * @param {string} filename - Backup filename
   * @returns {string} - Backup ID
   */
  extractBackupIdFromFilename(filename) {
    const match = filename.match(/^backup_([^_]+_[^_]+)_/);
    return match ? `backup_${match[1]}` : null;
  }

  /**
   * Get all entry pack IDs
   * @returns {Promise<Array>} - Array of entry pack IDs
   */
  async getAllEntryPackIds() {
    try {
      // This would typically query the database or storage
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Failed to get entry pack IDs:', error);
      return [];
    }
  }

  /**
   * Save backup metadata
   * @param {string} backupId - Backup ID
   * @param {Object} metadata - Backup metadata
   * @returns {Promise<void>}
   */
  async saveBackupMetadata(backupId, metadata) {
    try {
      const metadataPath = this.backupDirectory + `${backupId}_metadata.json`;
      await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata, null, 2), {
        encoding: FileSystem.EncodingType.UTF8
      });
    } catch (error) {
      console.error('Failed to save backup metadata:', error);
      throw error;
    }
  }

  /**
   * Load backup metadata
   * @param {string} backupId - Backup ID
   * @returns {Promise<Object|null>} - Backup metadata
   */
  async loadBackupMetadata(backupId) {
    try {
      const metadataPath = this.backupDirectory + `${backupId}_metadata.json`;
      const fileInfo = await FileSystem.getInfoAsync(metadataPath);
      
      if (!fileInfo.exists) {
        return null;
      }

      const metadataJson = await FileSystem.readAsStringAsync(metadataPath, {
        encoding: FileSystem.EncodingType.UTF8
      });

      return JSON.parse(metadataJson);
    } catch (error) {
      console.error('Failed to load backup metadata:', error);
      return null;
    }
  }

  /**
   * Delete backup metadata
   * @param {string} backupId - Backup ID
   * @returns {Promise<void>}
   */
  async deleteBackupMetadata(backupId) {
    try {
      const metadataPath = this.backupDirectory + `${backupId}_metadata.json`;
      const fileInfo = await FileSystem.getInfoAsync(metadataPath);
      
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(metadataPath);
      }
    } catch (error) {
      console.error('Failed to delete backup metadata:', error);
    }
  }

  /**
   * Get interval in milliseconds
   * @param {string} interval - Interval string ('daily', 'weekly', 'monthly')
   * @returns {number} - Interval in milliseconds
   */
  getIntervalMilliseconds(interval) {
    switch (interval) {
      case 'daily':
        return 24 * 60 * 60 * 1000; // 1 day
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000; // 30 days
      default:
        return 7 * 24 * 60 * 60 * 1000; // Default to weekly
    }
  }

  /**
   * Get device info for backup metadata
   * @returns {Promise<Object>} - Device info
   */
  async getDeviceInfo() {
    try {
      // This would typically use device info libraries
      // For now, return basic info
      return {
        platform: 'unknown',
        version: 'unknown',
        model: 'unknown'
      };
    } catch (error) {
      console.error('Failed to get device info:', error);
      return {};
    }
  }

  /**
   * Ensure directory exists
   * @param {string} dirPath - Directory path
   */
  async ensureDirectoryExists(dirPath) {
    try {
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
        console.log('Created directory:', dirPath);
      }
    } catch (error) {
      console.error('Failed to create directory:', dirPath, error);
      throw error;
    }
  }
}

// Export singleton instance
const backupService = new BackupService();

export default backupService;