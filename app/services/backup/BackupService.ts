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
import EntryInfo from '../../models/EntryInfo';
import UserDataService from '../data/UserDataService';
import DataExportService from '../export/DataExportService';
import SecureStorageService from '../security/SecureStorageService';

// Type definitions
type BackupType = 'manual' | 'automatic' | 'cloud';
type BackupInterval = 'daily' | 'weekly' | 'monthly';
type CloudProvider = 'device' | 'icloud' | 'googledrive';
type SyncStatus = 'pending' | 'synced' | 'failed';
type BackupTypeFilter = 'local' | 'cloud';

interface BackupOptions {
  type?: BackupType;
  includePhotos?: boolean;
  onProgress?: (progress: ProgressInfo) => void;
  password?: string;
  provider?: CloudProvider;
  [key: string]: unknown;
}

interface ProgressInfo {
  current: number;
  total: number;
  status: 'exporting' | 'exported' | 'packaging' | 'completed';
  currentEntryInfo?: string;
}

interface BackupResult {
  success: boolean;
  backupId?: string;
  filename?: string;
  filePath?: string;
  fileSize?: number;
  entryInfoCount?: number;
  createdAt?: number;
  metadata?: BackupMetadata;
  message?: string;
  reason?: string;
}

interface BackupMetadata {
  backupId: string;
  createdAt: number;
  timestamp: string;
  type: BackupType;
  entryInfoCount: number;
  entryPackCount?: number;
  includePhotos: boolean;
  appVersion: string;
  deviceInfo: DeviceInfo;
  filename?: string;
  filePath?: string;
  fileSize?: number;
  exportResults?: unknown[];
  cloudBackupId?: string;
  encrypted?: boolean;
  encryptionMethod?: string;
  cloudProvider?: CloudProvider;
  uploadedAt?: number | null;
  syncStatus?: SyncStatus;
  lastSyncAttempt?: number;
  cloudFilePath?: string;
  encryptedSize?: number;
  syncError?: string | null;
}

interface DeviceInfo {
  platform?: string;
  version?: string;
  model?: string;
  [key: string]: unknown;
}

interface BackupInfo {
  backupId: string;
  filename: string;
  filePath: string;
  fileSize: number;
  createdAt: number;
  timestamp: string;
  type: BackupType;
  entryPackCount?: number;
  includePhotos: boolean;
  appVersion?: string;
}

interface BackupDetails extends BackupMetadata {
  fileExists: boolean;
  currentFileSize: number;
  isCorrupted: boolean;
}

interface CleanupResult {
  deletedCount: number;
  message?: string;
  error?: string;
}

interface BackupSettings {
  automaticBackup: boolean;
  backupInterval: BackupInterval;
  includePhotos: boolean;
  maxBackups: number;
  wifiOnly: boolean;
  cloudBackup: boolean;
  cloudProvider: CloudProvider;
  encryptCloudBackups: boolean;
  automaticCloudSync: boolean;
  cloudBackupInterval: BackupInterval;
}

interface BackupSchedule {
  nextBackupTime: number;
  interval: BackupInterval;
  scheduledAt: number;
}

interface LastBackupInfo {
  backupId: string;
  createdAt: number;
  type: BackupType;
  entryInfoCount: number;
}

interface BackupStatistics {
  totalBackups: number;
  automaticBackups: number;
  manualBackups: number;
  totalSize: number;
  oldestBackup: BackupInfo | null;
  newestBackup: BackupInfo | null;
  averageSize: number;
  cloudBackupsCount: number;
  cloudTotalSize: number;
  syncedCloudBackups: number;
  pendingCloudBackups: number;
  cloudSyncRate: number;
  totalAllBackups: number;
  totalAllSize: number;
}

interface CloudBackupResult {
  success: boolean;
  cloudBackupId?: string;
  localBackupId?: string;
  syncStatus?: SyncStatus;
  uploadResult?: UploadResult;
  metadata?: BackupMetadata;
}

interface CloudBackupInfo {
  cloudBackupId: string;
  filename: string;
  filePath: string;
  fileSize: number;
  encryptedSize?: number;
  createdAt: number;
  uploadedAt?: number | null;
  syncStatus: SyncStatus;
  cloudProvider: CloudProvider;
  entryInfoCount: number;
  encrypted: boolean;
}

interface UploadResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface CloudBackupStatus {
  enabled: boolean;
  lastCloudBackup: string | null;
  lastCloudBackupTime: number | null;
  cloudProvider: CloudProvider | null;
  syncStatus: SyncStatus | null;
  totalCloudBackups: number;
  pendingSyncs: number;
}

interface EncryptResult {
  filePath: string;
  fileSize: number;
  encrypted: boolean;
  fieldType: string;
}

interface DecryptResult {
  filePath: string;
  fileSize: number;
  decrypted: boolean;
}

interface AvailableBackupsResult {
  success: boolean;
  backups?: BackupListItem[];
  statistics?: BackupStatistics | null;
  error?: string;
}

interface BackupListItem extends BackupInfo {
  type: BackupTypeFilter;
}

interface RecoveryInfo {
  backupId: string;
  backupType: BackupTypeFilter;
  createdAt: number;
  entryPackCount: number;
  includePhotos: boolean;
  appVersion: string;
  fileExists: boolean;
  fileSize: number;
  encrypted: boolean;
  syncStatus: SyncStatus;
  canRecover: boolean;
  requiresPassword: boolean;
  estimatedRecoveryTime: number;
  exportResults: unknown[] | null;
  deviceInfo: DeviceInfo | null;
}

interface RecoveryResult {
  success: boolean;
  backupId?: string;
  backupType?: BackupTypeFilter;
  recoveredCount?: number;
  skippedCount?: number;
  conflicts?: unknown[];
  importResult?: unknown;
  recoveredAt?: number;
  error?: string;
}

interface RecoveryOptions {
  conflictResolution?: 'ask' | 'overwrite' | 'skip';
  onProgress?: (progress: ProgressInfo) => void;
  password?: string;
  selectedEntryPacks?: string[];
  dryRun?: boolean;
  [key: string]: unknown;
}

interface BackupPreview {
  backupId: string;
  backupType: BackupTypeFilter;
  createdAt: number;
  entryInfoCount: number;
  totalSize: number;
  entryInfos: EntryInfoPreview[];
  metadata: {
    appVersion: string;
    deviceInfo: DeviceInfo;
    includePhotos: boolean;
    exportMethod: string;
  };
}

interface EntryInfoPreview {
  id: string;
  destinationId: string;
  status?: string;
  createdAt: string;
  arrivalDate?: string;
  departureDate?: string;
  hasPhotos: boolean;
  photoCount: number;
  dacSubmitted: boolean;
}

interface ValidationResult {
  backupId: string;
  backupType: BackupTypeFilter;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    fileSize: number;
    entryInfoCount: number;
    hasPhotos: boolean;
    totalPhotos: number;
    appVersion: string;
    createdAt: number;
  };
}

interface RecoveryStatistics {
  totalRecoveries: number;
  lastFullRecovery: number | null;
  lastSelectiveRecovery: number | null;
  lastRecoveredBackupId: string | null;
  lastRecoveredBackupType: BackupTypeFilter | null;
  totalRecoveredEntryPacks: number;
  averageRecoveryTime: number;
  successfulRecoveries: number;
  failedRecoveries: number;
}

interface SyncResult {
  success: boolean;
  syncedCount?: number;
  totalPending?: number;
  syncResults?: SyncResultItem[];
  error?: string;
}

interface SyncResultItem {
  cloudBackupId: string;
  success: boolean;
  error?: string;
}

// FileSystem type assertions (expo-file-system types may not be complete)
interface FileSystemFile {
  exists(): Promise<boolean>;
  size(): Promise<number>;
  write(data: string): Promise<void>;
  text(): Promise<string>;
  move(dest: string): Promise<void>;
  delete(): Promise<void>;
  modificationTime(): Promise<number>;
}

interface FileSystemDirectory {
  exists(): Promise<boolean>;
  create(): Promise<void>;
  list(): Promise<string[]>;
}

class BackupService {
  private backupDirectory: string;
  private cloudBackupDirectory: string;
  private maxBackups: number;
  private backupInterval: number;
  private backupScheduleKey: string;
  private backupSettingsKey: string;
  private cloudBackupKey: string;
  private encryptionKey: string;

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
   */
  async initialize(): Promise<void> {
    try {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to initialize BackupService:', errorMessage);
    }
  }

  /**
   * Create automatic backup
   * @param options - Backup options
   * @returns Backup result
   */
  async createAutomaticBackup(options: BackupOptions = {}): Promise<BackupResult> {
    try {
      const settings = await this.getBackupSettings();
      if (!settings.automaticBackup) {
        return { success: false, reason: 'Automatic backup disabled' };
      }

      // Check if backup is needed
      const lastBackup = await this.getLastBackupInfo();
      const now = Date.now();
      
      if (lastBackup && (now - lastBackup.createdAt) < this.backupInterval) {
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

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to create automatic backup:', errorMessage);
      throw error;
    }
  }

  /**
   * Create manual backup
   * @param options - Backup options
   * @returns Backup result
   */
  async createManualBackup(options: BackupOptions = {}): Promise<BackupResult> {
    try {
      return await this.createBackup({
        type: 'manual',
        includePhotos: true,
        ...options
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to create manual backup:', errorMessage);
      throw error;
    }
  }

  /**
   * Create backup
   * @param options - Backup options
   * @returns Backup result
   */
  async createBackup(options: BackupOptions = {}): Promise<BackupResult> {
    try {
      const backupId = this.generateBackupId();
      const timestamp = new Date().toISOString();
      
      // Collect all entry info IDs
      const entryInfoIds = await this.getAllEntryInfoIds();
      
      if (entryInfoIds.length === 0) {
        return {
          success: true,
          backupId,
          entryInfoCount: 0,
          message: 'No data to backup'
        };
      }

      // Create backup metadata
      const backupMetadata: BackupMetadata = {
        backupId,
        createdAt: Date.now(),
        timestamp,
        type: (options.type || 'manual') as BackupType,
        entryInfoCount: entryInfoIds.length,
        includePhotos: options.includePhotos !== false,
        appVersion: '1.0.0', // TODO: Get from app config
        deviceInfo: await this.getDeviceInfo()
      };

      // Export all entry infos using DataExportService
      const exportResult = await DataExportService.exportMultipleEntryInfos(entryInfoIds, 'json', {
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
      
      const sourceFile = new FileSystem.File(exportResult.zipPackage.filePath) as unknown as FileSystemFile;
      await sourceFile.move(backupFilePath);

      // Update metadata with final file info
      const backupFile = new FileSystem.File(backupFilePath) as unknown as FileSystemFile;
      const fileSize = await backupFile.size();
      backupMetadata.filename = backupFilename;
      backupMetadata.filePath = backupFilePath;
      backupMetadata.fileSize = fileSize;
      backupMetadata.exportResults = exportResult.exportResults;

      // Save backup metadata
      await this.saveBackupMetadata(backupId, backupMetadata);

      // Update last backup info
      await AsyncStorage.setItem('last_backup_info', JSON.stringify({
        backupId,
        createdAt: backupMetadata.createdAt,
        type: backupMetadata.type,
        entryInfoCount: backupMetadata.entryInfoCount
      }));

      return {
        success: true,
        backupId,
        filename: backupFilename,
        filePath: backupFilePath,
        fileSize: fileSize,
        entryInfoCount: entryInfoIds.length,
        createdAt: backupMetadata.createdAt,
        metadata: backupMetadata
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to create backup:', errorMessage);
      throw error;
    }
  }

  /**
   * List available backups
   * @returns Array of backup info
   */
  async listBackups(): Promise<BackupInfo[]> {
    try {
      const backupDir = new FileSystem.Directory(this.backupDirectory) as unknown as FileSystemDirectory;
      const dirExists = await backupDir.exists();
      if (!dirExists) {
        return [];
      }

      const files = await backupDir.list();
      const backups: BackupInfo[] = [];

      for (const filename of files) {
        if (filename.startsWith('backup_') && filename.endsWith('.json')) {
          try {
            const backupId = this.extractBackupIdFromFilename(filename);
            if (!backupId) continue;

            const metadata = await this.loadBackupMetadata(backupId);

            if (metadata) {
              const filePath = this.backupDirectory + filename;
              const backupFile = new FileSystem.File(filePath) as unknown as FileSystemFile;
              const fileSize = await backupFile.size();
              const modificationTime = await backupFile.modificationTime();
              
              backups.push({
                backupId,
                filename,
                filePath,
                fileSize: fileSize,
                createdAt: metadata.createdAt,
                timestamp: metadata.timestamp,
                type: metadata.type,
                entryPackCount: metadata.entryPackCount,
                includePhotos: metadata.includePhotos,
                appVersion: metadata.appVersion
              });
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`Failed to load backup metadata for ${filename}:`, errorMessage);
          }
        }
      }

      // Sort by creation time (newest first)
      backups.sort((a, b) => b.createdAt - a.createdAt);

      return backups;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to list backups:', errorMessage);
      return [];
    }
  }

  /**
   * Get backup details
   * @param backupId - Backup ID
   * @returns Backup details
   */
  async getBackupDetails(backupId: string): Promise<BackupDetails> {
    try {
      const metadata = await this.loadBackupMetadata(backupId);
      if (!metadata) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      const backupFile = new FileSystem.File(metadata.filePath || '') as unknown as FileSystemFile;
      const fileExists = await backupFile.exists();
      const currentFileSize = fileExists ? await backupFile.size() : 0;

      return {
        ...metadata,
        fileExists: fileExists,
        currentFileSize: currentFileSize,
        isCorrupted: fileExists && currentFileSize !== (metadata.fileSize || 0)
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to get backup details:', errorMessage);
      throw error;
    }
  }

  /**
   * Delete backup
   * @param backupId - Backup ID
   * @returns Success status
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const metadata = await this.loadBackupMetadata(backupId);
      if (!metadata) {
        console.warn(`Backup metadata not found: ${backupId}`);
        return false;
      }

      // Delete backup file
      if (metadata.filePath) {
        const backupFile = new FileSystem.File(metadata.filePath) as unknown as FileSystemFile;
        const fileExists = await backupFile.exists();
        if (fileExists) {
          await backupFile.delete();
        }
      }

      // Delete metadata
      await this.deleteBackupMetadata(backupId);

      return true;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to delete backup:', errorMessage);
      return false;
    }
  }

  /**
   * Cleanup old backups (keep recent N backups)
   * @returns Cleanup result
   */
  async cleanupOldBackups(): Promise<CleanupResult> {
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

      return {
        deletedCount,
        message: `Cleaned up ${deletedCount} old backups`
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to cleanup old backups:', errorMessage);
      return { deletedCount: 0, error: errorMessage };
    }
  }

  /**
   * Get backup settings
   * @returns Backup settings
   */
  async getBackupSettings(): Promise<BackupSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(this.backupSettingsKey);
      const defaultSettings: BackupSettings = {
        automaticBackup: true,
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

      if (settingsJson) {
        return { ...defaultSettings, ...JSON.parse(settingsJson) };
      }

      return defaultSettings;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to get backup settings:', errorMessage);
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
   * @param settings - New settings
   */
  async updateBackupSettings(settings: Partial<BackupSettings>): Promise<void> {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to update backup settings:', errorMessage);
      throw error;
    }
  }

  /**
   * Schedule next automatic backup
   */
  async scheduleNextBackup(): Promise<void> {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to schedule next backup:', errorMessage);
    }
  }

  /**
   * Cancel scheduled backup
   */
  async cancelScheduledBackup(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.backupScheduleKey);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to cancel scheduled backup:', errorMessage);
    }
  }

  /**
   * Check if backup is due
   * @returns Whether backup is due
   */
  async isBackupDue(): Promise<boolean> {
    try {
      const scheduleJson = await AsyncStorage.getItem(this.backupScheduleKey);
      if (!scheduleJson) {
        return false;
      }

      const schedule = JSON.parse(scheduleJson) as BackupSchedule;
      return Date.now() >= schedule.nextBackupTime;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to check if backup is due:', errorMessage);
      return false;
    }
  }

  /**
   * Get last backup info
   * @returns Last backup info
   */
  async getLastBackupInfo(): Promise<LastBackupInfo | null> {
    try {
      const infoJson = await AsyncStorage.getItem('last_backup_info');
      return infoJson ? JSON.parse(infoJson) : null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to get last backup info:', errorMessage);
      return null;
    }
  }

  /**
   * Get backup statistics
   * @returns Backup statistics
   */
  async getBackupStatistics(): Promise<BackupStatistics> {
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
        totalBackups: backups.length,
        automaticBackups,
        manualBackups,
        totalSize,
        oldestBackup: backups.length > 0 ? backups[backups.length - 1] : null,
        newestBackup: backups.length > 0 ? backups[0] : null,
        averageSize: backups.length > 0 ? Math.round(totalSize / backups.length) : 0,
        cloudBackupsCount,
        cloudTotalSize,
        syncedCloudBackups,
        pendingCloudBackups,
        cloudSyncRate: cloudBackupsCount > 0 ? Math.round((syncedCloudBackups / cloudBackupsCount) * 100) : 0,
        totalAllBackups: backups.length + cloudBackupsCount,
        totalAllSize: totalSize + cloudTotalSize
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to get backup statistics:', errorMessage);
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
   * @param options - Cloud backup options
   * @returns Cloud backup result
   */
  async createCloudBackup(options: BackupOptions = {}): Promise<CloudBackupResult> {
    try {
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
      const encryptedBackup = await this.encryptBackupFile(localBackup.filePath || '', options.password);
      
      // Prepare cloud backup metadata
      const cloudBackupMetadata: BackupMetadata = {
        ...(localBackup.metadata || {} as BackupMetadata),
        cloudBackupId: this.generateCloudBackupId(),
        encrypted: true,
        encryptionMethod: 'AES-256',
        cloudProvider: (options.provider || 'device') as CloudProvider,
        uploadedAt: null,
        syncStatus: 'pending',
        lastSyncAttempt: Date.now()
      };

      // Save to cloud backup directory
      const cloudBackupPath = this.cloudBackupDirectory + `cloud_${cloudBackupMetadata.cloudBackupId}.enc`;
      const encryptedFile = new FileSystem.File(encryptedBackup.filePath) as unknown as FileSystemFile;
      await encryptedFile.move(cloudBackupPath);

      cloudBackupMetadata.cloudFilePath = cloudBackupPath;
      cloudBackupMetadata.encryptedSize = encryptedBackup.fileSize;

      // Save cloud backup metadata
      await this.saveCloudBackupMetadata(cloudBackupMetadata.cloudBackupId || '', cloudBackupMetadata);

      // Attempt cloud upload based on provider
      let uploadResult: UploadResult = { success: false, message: 'Cloud upload not implemented' };
      
      if (options.provider === 'device') {
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
      
      await this.saveCloudBackupMetadata(cloudBackupMetadata.cloudBackupId || '', cloudBackupMetadata);

      // Update cloud backup status
      await this.updateCloudBackupStatus({
        lastCloudBackup: cloudBackupMetadata.cloudBackupId || '',
        lastCloudBackupTime: Date.now(),
        cloudProvider: options.provider,
        syncStatus: cloudBackupMetadata.syncStatus
      });

      return {
        success: true,
        cloudBackupId: cloudBackupMetadata.cloudBackupId,
        localBackupId: localBackup.backupId,
        syncStatus: cloudBackupMetadata.syncStatus,
        uploadResult,
        metadata: cloudBackupMetadata
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to create cloud backup:', errorMessage);
      throw error;
    }
  }

  /**
   * List cloud backups
   * @returns Array of cloud backup info
   */
  async listCloudBackups(): Promise<CloudBackupInfo[]> {
    try {
      const cloudBackupDir = new FileSystem.Directory(this.cloudBackupDirectory) as unknown as FileSystemDirectory;
      const dirExists = await cloudBackupDir.exists();
      if (!dirExists) {
        return [];
      }

      const files = await cloudBackupDir.list();
      const cloudBackups: CloudBackupInfo[] = [];

      for (const filename of files) {
        if (filename.startsWith('cloud_') && filename.endsWith('.enc')) {
          try {
            const cloudBackupId = this.extractCloudBackupIdFromFilename(filename);
            if (!cloudBackupId) continue;

            const metadata = await this.loadCloudBackupMetadata(cloudBackupId);

            if (metadata) {
              const filePath = this.cloudBackupDirectory + filename;
              const cloudFile = new FileSystem.File(filePath) as unknown as FileSystemFile;
              const fileSize = await cloudFile.size();
              
              cloudBackups.push({
                cloudBackupId,
                filename,
                filePath,
                fileSize: fileSize,
                encryptedSize: metadata.encryptedSize,
                createdAt: metadata.createdAt,
                uploadedAt: metadata.uploadedAt,
                syncStatus: metadata.syncStatus || 'pending',
                cloudProvider: metadata.cloudProvider || 'device',
                entryInfoCount: metadata.entryInfoCount,
                encrypted: metadata.encrypted || false
              });
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`Failed to load cloud backup metadata for ${filename}:`, errorMessage);
          }
        }
      }

      // Sort by creation time (newest first)
      cloudBackups.sort((a, b) => b.createdAt - a.createdAt);

      return cloudBackups;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to list cloud backups:', errorMessage);
      return [];
    }
  }

  /**
   * Restore from cloud backup
   * @param cloudBackupId - Cloud backup ID
   * @param password - Decryption password
   * @param options - Restore options
   * @returns Restore result
   */
  async restoreFromCloudBackup(cloudBackupId: string, password: string, options: RecoveryOptions = {}): Promise<RecoveryResult> {
    try {
      const metadata = await this.loadCloudBackupMetadata(cloudBackupId);
      if (!metadata) {
        throw new Error(`Cloud backup not found: ${cloudBackupId}`);
      }

      // Check if encrypted backup file exists locally
      const encryptedFilePath = metadata.cloudFilePath;
      if (!encryptedFilePath) {
        throw new Error('Cloud backup file path not found');
      }

      const encryptedFile = new FileSystem.File(encryptedFilePath) as unknown as FileSystemFile;
      const fileExists = await encryptedFile.exists();
      
      if (!fileExists) {
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
      const decryptedFile = new FileSystem.File(decryptedBackup.filePath) as unknown as FileSystemFile;
      await decryptedFile.delete();

      return {
        success: true,
        cloudBackupId,
        importResult,
        recoveredAt: Date.now()
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to restore from cloud backup:', errorMessage);
      throw error;
    }
  }

  /**
   * Sync pending cloud backups
   * @returns Sync result
   */
  async syncPendingCloudBackups(): Promise<SyncResult> {
    try {
      const cloudBackups = await this.listCloudBackups();
      const pendingBackups = cloudBackups.filter(backup => backup.syncStatus === 'pending' || backup.syncStatus === 'failed');
      
      if (pendingBackups.length === 0) {
        return { success: true, syncedCount: 0, message: 'No pending backups to sync' };
      }

      let syncedCount = 0;
      const syncResults: SyncResultItem[] = [];

      for (const backup of pendingBackups) {
        try {
          const metadata = await this.loadCloudBackupMetadata(backup.cloudBackupId);

          let uploadResult: UploadResult = { success: false };

          if (metadata?.cloudProvider === 'icloud' && Platform.OS === 'ios') {
            uploadResult = await this.uploadToiCloud(backup.filePath, metadata);
          } else if (metadata?.cloudProvider === 'googledrive') {
            uploadResult = await this.uploadToGoogleDrive(backup.filePath, metadata);
          }

          // Update metadata
          if (metadata) {
            metadata.syncStatus = uploadResult.success ? 'synced' : 'failed';
            metadata.uploadedAt = uploadResult.success ? Date.now() : null;
            metadata.lastSyncAttempt = Date.now();
            metadata.syncError = uploadResult.success ? null : uploadResult.error;

            await this.saveCloudBackupMetadata(backup.cloudBackupId, metadata);
          }

          if (uploadResult.success) {
            syncedCount++;
          }

          syncResults.push({
            cloudBackupId: backup.cloudBackupId,
            success: uploadResult.success,
            error: uploadResult.error
          });

        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Failed to sync cloud backup ${backup.cloudBackupId}:`, errorMessage);
          syncResults.push({
            cloudBackupId: backup.cloudBackupId,
            success: false,
            error: errorMessage
          });
        }
      }

      return {
        success: true,
        syncedCount,
        totalPending: pendingBackups.length,
        syncResults
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to sync pending cloud backups:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get cloud backup status
   * @returns Cloud backup status
   */
  async getCloudBackupStatus(): Promise<CloudBackupStatus> {
    try {
      const statusJson = await AsyncStorage.getItem(this.cloudBackupKey);
      const defaultStatus: CloudBackupStatus = {
        enabled: false,
        lastCloudBackup: null,
        lastCloudBackupTime: null,
        cloudProvider: null,
        syncStatus: null,
        totalCloudBackups: 0,
        pendingSyncs: 0
      };

      let status: CloudBackupStatus = defaultStatus;
      if (statusJson) {
        status = { ...defaultStatus, ...JSON.parse(statusJson) };
      }

      // Update counts
      const cloudBackups = await this.listCloudBackups();
      status.totalCloudBackups = cloudBackups.length;
      status.pendingSyncs = cloudBackups.filter(b => b.syncStatus === 'pending' || b.syncStatus === 'failed').length;

      return status;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to get cloud backup status:', errorMessage);
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
   * @param status - Status update
   */
  async updateCloudBackupStatus(status: Partial<CloudBackupStatus>): Promise<void> {
    try {
      const currentStatus = await this.getCloudBackupStatus();
      const newStatus = { ...currentStatus, ...status };
      
      await AsyncStorage.setItem(this.cloudBackupKey, JSON.stringify(newStatus));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to update cloud backup status:', errorMessage);
    }
  }

  /**
   * Delete cloud backup
   * @param cloudBackupId - Cloud backup ID
   * @returns Success status
   */
  async deleteCloudBackup(cloudBackupId: string): Promise<boolean> {
    try {
      const metadata = await this.loadCloudBackupMetadata(cloudBackupId);
      if (!metadata) {
        console.warn(`Cloud backup metadata not found: ${cloudBackupId}`);
        return false;
      }

      // Delete local encrypted file
      if (metadata.cloudFilePath) {
        const cloudFile = new FileSystem.File(metadata.cloudFilePath) as unknown as FileSystemFile;
        if (await cloudFile.exists()) {
          await cloudFile.delete();
        }
      }

      // Delete metadata
      await this.deleteCloudBackupMetadata(cloudBackupId);

      return true;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to delete cloud backup:', errorMessage);
      return false;
    }
  }

  // Cloud Provider Methods

  /**
   * Share backup to device (user chooses cloud service)
   * @param filePath - Backup file path
   * @param metadata - Backup metadata
   * @returns Share result
   */
  async shareBackupToDevice(filePath: string, metadata: BackupMetadata): Promise<UploadResult> {
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

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to share backup to device:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Upload to iCloud (iOS only)
   * @param filePath - Backup file path
   * @param metadata - Backup metadata
   * @returns Upload result
   */
  async uploadToiCloud(filePath: string, metadata: BackupMetadata): Promise<UploadResult> {
    try {
      if (Platform.OS !== 'ios') {
        return { success: false, error: 'iCloud only available on iOS' };
      }

      // Note: This is a placeholder implementation
      // In a real app, you would use react-native-icloud-storage or similar
      console.log('iCloud upload not implemented - using device sharing instead');
      
      return await this.shareBackupToDevice(filePath, metadata);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to upload to iCloud:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Upload to Google Drive
   * @param filePath - Backup file path
   * @param metadata - Backup metadata
   * @returns Upload result
   */
  async uploadToGoogleDrive(filePath: string, metadata: BackupMetadata): Promise<UploadResult> {
    try {
      // Note: This is a placeholder implementation
      // In a real app, you would use Google Drive API
      console.log('Google Drive upload not implemented - using device sharing instead');
      
      return await this.shareBackupToDevice(filePath, metadata);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to upload to Google Drive:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Encryption Methods

  /**
   * Encrypt backup file
   * @param filePath - Source file path
   * @param password - Encryption password (optional, uses default field type if not provided)
   * @returns Encrypted file info
   */
  async encryptBackupFile(filePath: string, password?: string): Promise<EncryptResult> {
    try {
      // Read source file
      const sourceFile = new FileSystem.File(filePath) as unknown as FileSystemFile;
      const sourceData = await sourceFile.text();

      // Use EncryptionService for encryption
      // If password is provided, use it as a custom field type for key derivation
      const fieldType = password ? `backup_${password.slice(0, 8)}` : 'backup_data';
      const encryptedData = await SecureStorageService.encryption.encrypt(sourceData, fieldType);

      // Create encrypted file
      const encryptedFilePath = filePath.replace('.json', '.enc');
      const encryptedFile = new FileSystem.File(encryptedFilePath) as unknown as FileSystemFile;
      await encryptedFile.write(encryptedData);

      const fileSize = await encryptedFile.size();

      return {
        filePath: encryptedFilePath,
        fileSize: fileSize,
        encrypted: true,
        fieldType: fieldType
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to encrypt backup file:', errorMessage);
      throw error;
    }
  }

  /**
   * Decrypt backup file
   * @param encryptedFilePath - Encrypted file path
   * @param password - Decryption password (optional, uses default field type if not provided)
   * @returns Decrypted file info
   */
  async decryptBackupFile(encryptedFilePath: string, password?: string): Promise<DecryptResult> {
    try {
      // Read encrypted file
      const encryptedFile = new FileSystem.File(encryptedFilePath) as unknown as FileSystemFile;
      const encryptedData = await encryptedFile.text();

      // Use EncryptionService for decryption
      // If password is provided, use it as a custom field type for key derivation
      const fieldType = password ? `backup_${password.slice(0, 8)}` : 'backup_data';
      const decryptedData = await SecureStorageService.encryption.decrypt(encryptedData, fieldType);

      // Create decrypted file
      const decryptedFilePath = encryptedFilePath.replace('.enc', '_decrypted.json');
      const decryptedFile = new FileSystem.File(decryptedFilePath) as unknown as FileSystemFile;
      await decryptedFile.write(decryptedData);

      const fileSize = await decryptedFile.size();

      return {
        filePath: decryptedFilePath,
        fileSize: fileSize,
        decrypted: true
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to decrypt backup file:', errorMessage);
      throw error;
    }
  }

  // Data Recovery Methods

  /**
   * List available backups for recovery
   * @param options - Recovery options
   * @returns Available backups info
   */
  async listAvailableBackups(options: Record<string, unknown> = {}): Promise<AvailableBackupsResult> {
    try {
      const localBackups = await this.listBackups();
      const cloudBackups = await this.listCloudBackups();

      // Combine and sort by creation date
      const allBackups: BackupListItem[] = [
        ...localBackups.map(backup => ({ ...backup, type: 'local' as BackupTypeFilter })),
        ...cloudBackups.map(backup => ({ 
          backupId: backup.cloudBackupId,
          filename: backup.filename,
          filePath: backup.filePath,
          fileSize: backup.fileSize,
          createdAt: backup.createdAt,
          timestamp: new Date(backup.createdAt).toISOString(),
          type: backup.cloudProvider === 'device' ? 'local' : 'cloud' as BackupTypeFilter,
          entryPackCount: backup.entryInfoCount,
          includePhotos: backup.encrypted,
          appVersion: undefined
        }))
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
          newestBackup: allBackups.length > 0 ? allBackups[0] : null,
          automaticBackups: 0,
          manualBackups: 0,
          averageSize: 0,
          cloudBackupsCount: cloudCount,
          cloudTotalSize: cloudBackups.reduce((sum, b) => sum + b.fileSize, 0),
          syncedCloudBackups: 0,
          pendingCloudBackups: 0,
          cloudSyncRate: 0,
          totalAllBackups: allBackups.length,
          totalAllSize: totalSize
        }
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to list available backups:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        backups: [],
        statistics: null
      };
    }
  }

  /**
   * Get detailed backup information for recovery
   * @param backupId - Backup ID (local or cloud)
   * @param backupType - 'local' or 'cloud'
   * @returns Detailed backup info
   */
  async getBackupRecoveryInfo(backupId: string, backupType: BackupTypeFilter = 'local'): Promise<{ success: boolean; recoveryInfo?: RecoveryInfo; error?: string }> {
    try {
      let metadata: BackupMetadata | null = null;
      let fileExists = false;
      let fileSize = 0;

      if (backupType === 'local') {
        metadata = await this.loadBackupMetadata(backupId);
        if (metadata && metadata.filePath) {
          const backupFile = new FileSystem.File(metadata.filePath) as unknown as FileSystemFile;
          fileExists = await backupFile.exists();
          fileSize = await backupFile.size();
        }
      } else if (backupType === 'cloud') {
        metadata = await this.loadCloudBackupMetadata(backupId);
        if (metadata && metadata.cloudFilePath) {
          const cloudFile = new FileSystem.File(metadata.cloudFilePath) as unknown as FileSystemFile;
          fileExists = await cloudFile.exists();
          fileSize = await cloudFile.size();
        }
      }

      if (!metadata) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // Analyze backup contents
      const recoveryInfo: RecoveryInfo = {
        backupId,
        backupType,
        createdAt: metadata.createdAt,
        entryPackCount: metadata.entryInfoCount,
        includePhotos: metadata.includePhotos,
        appVersion: metadata.appVersion,
        fileExists,
        fileSize,
        encrypted: metadata.encrypted || false,
        syncStatus: metadata.syncStatus || 'local',
        canRecover: fileExists,
        requiresPassword: metadata.encrypted || false,
        estimatedRecoveryTime: this.estimateRecoveryTime(metadata.entryInfoCount, metadata.includePhotos),
        exportResults: metadata.exportResults || null,
        deviceInfo: metadata.deviceInfo || null
      };

      return {
        success: true,
        recoveryInfo
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to get backup recovery info:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        recoveryInfo: undefined
      };
    }
  }

  /**
   * Perform selective recovery (recover specific entry packs)
   * @param backupId - Backup ID
   * @param backupType - 'local' or 'cloud'
   * @param options - Recovery options
   * @returns Recovery result
   */
  async performSelectiveRecovery(backupId: string, backupType: BackupTypeFilter, options: RecoveryOptions = {}): Promise<RecoveryResult> {
    try {
      // Get backup file path
      let backupFilePath: string | null = null;
      let isEncrypted = false;

      if (backupType === 'local') {
        const metadata = await this.loadBackupMetadata(backupId);
        if (!metadata) {
          throw new Error(`Local backup not found: ${backupId}`);
        }
        backupFilePath = metadata.filePath || null;
        isEncrypted = metadata.encrypted || false;
      } else if (backupType === 'cloud') {
        const metadata = await this.loadCloudBackupMetadata(backupId);
        if (!metadata) {
          throw new Error(`Cloud backup not found: ${backupId}`);
        }
        backupFilePath = metadata.cloudFilePath || null;
        isEncrypted = metadata.encrypted || false;
      }

      if (!backupFilePath) {
        throw new Error('Backup file path not found');
      }

      // Check if file exists
      const backupFile = new FileSystem.File(backupFilePath) as unknown as FileSystemFile;
      if (!await backupFile.exists()) {
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
        const recoveryFile = new FileSystem.File(recoveryFilePath) as unknown as FileSystemFile;
        await recoveryFile.delete();
      }

      return {
        success: true,
        backupId,
        backupType,
        recoveredCount: (importResult as { importedCount?: number }).importedCount || 0,
        skippedCount: (importResult as { skippedCount?: number }).skippedCount || 0,
        conflicts: (importResult as { conflicts?: unknown[] }).conflicts || [],
        importResult,
        recoveredAt: Date.now()
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to perform selective recovery:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        backupId,
        backupType
      };
    }
  }

  /**
   * Perform full recovery (recover all data from backup)
   * @param backupId - Backup ID
   * @param backupType - 'local' or 'cloud'
   * @param options - Recovery options
   * @returns Recovery result
   */
  async performFullRecovery(backupId: string, backupType: BackupTypeFilter, options: RecoveryOptions = {}): Promise<RecoveryResult> {
    try {
      // Perform selective recovery with all entry packs
      const selectiveOptions: RecoveryOptions = {
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
          totalRecoveredEntryPacks: recoveryResult.recoveredCount || 0
        });
      }

      return recoveryResult;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to perform full recovery:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        backupId,
        backupType
      };
    }
  }

  /**
   * Preview backup contents before recovery
   * @param backupId - Backup ID
   * @param backupType - 'local' or 'cloud'
   * @param password - Password for encrypted backups
   * @returns Backup preview
   */
  async previewBackupContents(backupId: string, backupType: BackupTypeFilter, password: string | null = null): Promise<{ success: boolean; preview?: BackupPreview; error?: string }> {
    try {
      // Get backup file path
      let backupFilePath: string | null = null;
      let isEncrypted = false;
      let metadata: BackupMetadata | null = null;

      if (backupType === 'local') {
        metadata = await this.loadBackupMetadata(backupId);
        if (!metadata) {
          throw new Error(`Local backup not found: ${backupId}`);
        }
        backupFilePath = metadata.filePath || null;
        isEncrypted = metadata.encrypted || false;
      } else if (backupType === 'cloud') {
        metadata = await this.loadCloudBackupMetadata(backupId);
        if (!metadata) {
          throw new Error(`Cloud backup not found: ${backupId}`);
        }
        backupFilePath = metadata.cloudFilePath || null;
        isEncrypted = metadata.encrypted || false;
      }

      if (!backupFilePath) {
        throw new Error('Backup file path not found');
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
      const previewFile = new FileSystem.File(previewFilePath) as unknown as FileSystemFile;
      const backupData = await previewFile.text();

      const parsedData = JSON.parse(backupData) as { entryInfos?: unknown[]; exportMetadata?: { method?: string } };

      // Extract preview information
      const entryInfos = parsedData.entryInfos || [];
      const preview: BackupPreview = {
        backupId,
        backupType,
        createdAt: metadata?.createdAt || 0,
        entryInfoCount: entryInfos.length,
        totalSize: metadata?.fileSize || 0,
        entryInfos: entryInfos.map((info: any) => ({
          id: info.id || info.entryInfoId || '',
          destinationId: info.destinationId || '',
          status: info.displayStatus?.status,
          createdAt: info.createdAt || '',
          arrivalDate: info.travel?.arrivalDate,
          departureDate: info.travel?.departureDate,
          hasPhotos: (info.funds || []).some((fund: any) => fund.photoUri),
          photoCount: (info.funds || []).filter((fund: any) => fund.photoUri).length,
          dacSubmitted: (info.digitalArrivalCards || []).some((dac: any) => dac.status === 'success')
        })),
        metadata: {
          appVersion: metadata?.appVersion || 'unknown',
          deviceInfo: metadata?.deviceInfo || {},
          includePhotos: metadata?.includePhotos || false,
          exportMethod: parsedData.exportMetadata?.method || 'unknown'
        }
      };

      // Clean up decrypted file if it was created
      if (isEncrypted && previewFilePath !== backupFilePath) {
        const tempPreviewFile = new FileSystem.File(previewFilePath) as unknown as FileSystemFile;
        await tempPreviewFile.delete();
      }

      return {
        success: true,
        preview
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to preview backup contents:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        preview: undefined
      };
    }
  }

  /**
   * Validate backup integrity before recovery
   * @param backupId - Backup ID
   * @param backupType - 'local' or 'cloud'
   * @param password - Password for encrypted backups
   * @returns Validation result
   */
  async validateBackupIntegrity(backupId: string, backupType: BackupTypeFilter, password: string | null = null): Promise<{ success: boolean; validation?: ValidationResult; error?: string }> {
    try {
      const validationResult: ValidationResult = {
        backupId,
        backupType,
        isValid: false,
        errors: [],
        warnings: [],
        details: {
          fileSize: 0,
          entryInfoCount: 0,
          hasPhotos: false,
          totalPhotos: 0,
          appVersion: 'unknown',
          createdAt: 0
        }
      };

      // Get backup metadata
      let metadata: BackupMetadata | null = null;
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
      if (!filePath) {
        validationResult.errors.push('Backup file path not found');
        return { success: true, validation: validationResult };
      }

      const validationFile = new FileSystem.File(filePath) as unknown as FileSystemFile;

      if (!await validationFile.exists()) {
        validationResult.errors.push('Backup file does not exist');
        return { success: true, validation: validationResult };
      }

      // Check file size
      const fileSize = await validationFile.size();
      if (fileSize !== metadata.fileSize && !metadata.encrypted) {
        validationResult.warnings.push(`File size mismatch: expected ${metadata.fileSize}, actual ${fileSize}`);
      }

      // Try to preview contents (this validates decryption and JSON parsing)
      const previewResult = await this.previewBackupContents(backupId, backupType, password);
      
      if (!previewResult.success) {
        validationResult.errors.push(`Content validation failed: ${previewResult.error}`);
        return { success: true, validation: validationResult };
      }

      // Validate entry info count
      const actualCount = previewResult.preview?.entryInfoCount || 0;
      const expectedCount = metadata.entryInfoCount;

      if (actualCount !== expectedCount) {
        validationResult.warnings.push(`Entry info count mismatch: expected ${expectedCount}, actual ${actualCount}`);
      }

      // Check for required fields in each entry info
      const entryInfos = previewResult.preview?.entryInfos || [];
      let missingFieldsCount = 0;

      entryInfos.forEach((info) => {
        if (!info.id || !info.destinationId) {
          missingFieldsCount++;
        }
      });

      if (missingFieldsCount > 0) {
        validationResult.warnings.push(`${missingFieldsCount} entry infos have missing required fields`);
      }

      // Set validation result
      validationResult.isValid = validationResult.errors.length === 0;
      validationResult.details = {
        fileSize: fileSize,
        entryInfoCount: actualCount,
        hasPhotos: entryInfos.some(info => info.hasPhotos),
        totalPhotos: entryInfos.reduce((sum, info) => sum + info.photoCount, 0),
        appVersion: metadata.appVersion,
        createdAt: metadata.createdAt
      };

      return {
        success: true,
        validation: validationResult
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to validate backup integrity:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        validation: undefined
      };
    }
  }

  /**
   * Get recovery statistics
   * @returns Recovery statistics
   */
  async getRecoveryStatistics(): Promise<RecoveryStatistics> {
    try {
      const statsJson = await AsyncStorage.getItem('recovery_statistics');
      const defaultStats: RecoveryStatistics = {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to get recovery statistics:', errorMessage);
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
   * @param stats - Statistics update
   */
  async updateRecoveryStatistics(stats: Partial<RecoveryStatistics>): Promise<void> {
    try {
      const currentStats = await this.getRecoveryStatistics();
      const newStats = { ...currentStats, ...stats };
      
      await AsyncStorage.setItem('recovery_statistics', JSON.stringify(newStats));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to update recovery statistics:', errorMessage);
    }
  }

  /**
   * Estimate recovery time based on backup contents
   * @param entryPackCount - Number of entry packs
   * @param includePhotos - Whether backup includes photos
   * @returns Estimated time in milliseconds
   */
  estimateRecoveryTime(entryPackCount: number, includePhotos: boolean): number {
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
   * @returns Cloud backup ID
   */
  generateCloudBackupId(): string {
    return `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract cloud backup ID from filename
   * @param filename - Cloud backup filename
   * @returns Cloud backup ID
   */
  extractCloudBackupIdFromFilename(filename: string): string | null {
    const match = filename.match(/^cloud_([^.]+)\.enc$/);
    return match ? match[1] : null;
  }

  /**
   * Save cloud backup metadata
   * @param cloudBackupId - Cloud backup ID
   * @param metadata - Cloud backup metadata
   */
  async saveCloudBackupMetadata(cloudBackupId: string, metadata: BackupMetadata): Promise<void> {
    try {
      const metadataPath = this.cloudBackupDirectory + `${cloudBackupId}_metadata.json`;
      const metadataFile = new FileSystem.File(metadataPath) as unknown as FileSystemFile;
      await metadataFile.write(JSON.stringify(metadata, null, 2));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to save cloud backup metadata:', errorMessage);
      throw error;
    }
  }

  /**
   * Load cloud backup metadata
   * @param cloudBackupId - Cloud backup ID
   * @returns Cloud backup metadata
   */
  async loadCloudBackupMetadata(cloudBackupId: string): Promise<BackupMetadata | null> {
    try {
      const metadataPath = this.cloudBackupDirectory + `${cloudBackupId}_metadata.json`;
      const metadataFile = new FileSystem.File(metadataPath) as unknown as FileSystemFile;

      if (!await metadataFile.exists()) {
        return null;
      }

      const metadataJson = await metadataFile.text();

      return JSON.parse(metadataJson) as BackupMetadata;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to load cloud backup metadata:', errorMessage);
      return null;
    }
  }

  /**
   * Delete cloud backup metadata
   * @param cloudBackupId - Cloud backup ID
   */
  async deleteCloudBackupMetadata(cloudBackupId: string): Promise<void> {
    try {
      const metadataPath = this.cloudBackupDirectory + `${cloudBackupId}_metadata.json`;
      const metadataFile = new FileSystem.File(metadataPath) as unknown as FileSystemFile;

      if (await metadataFile.exists()) {
        await metadataFile.delete();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to delete cloud backup metadata:', errorMessage);
    }
  }

  // Helper methods

  /**
   * Generate unique backup ID
   * @returns Backup ID
   */
  generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract backup ID from filename
   * @param filename - Backup filename
   * @returns Backup ID
   */
  extractBackupIdFromFilename(filename: string): string | null {
    const match = filename.match(/^backup_([^_]+_[^_]+)_/);
    return match ? `backup_${match[1]}` : null;
  }

  /**
   * Get all entry info IDs
   * @returns Array of entry info IDs
   */
  async getAllEntryInfoIds(): Promise<string[]> {
    try {
      // Get all entry infos from SecureStorageService
      // Note: This requires a userId, but BackupService doesn't have access to it
      // For now, we'll need to get it from UserDataService or pass it as a parameter
      // This is a limitation that should be addressed in the future
      
      // Try to get all entry infos by querying the database directly
      // Since we don't have a userId, we'll need to get it from somewhere
      // For now, return empty array as placeholder - this needs to be implemented properly
      return [];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to get entry info IDs:', errorMessage);
      return [];
    }
  }

  /**
   * Save backup metadata
   * @param backupId - Backup ID
   * @param metadata - Backup metadata
   */
  async saveBackupMetadata(backupId: string, metadata: BackupMetadata): Promise<void> {
    try {
      const metadataPath = this.backupDirectory + `${backupId}_metadata.json`;
      const metadataFile = new FileSystem.File(metadataPath) as unknown as FileSystemFile;
      await metadataFile.write(JSON.stringify(metadata, null, 2));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to save backup metadata:', errorMessage);
      throw error;
    }
  }

  /**
   * Load backup metadata
   * @param backupId - Backup ID
   * @returns Backup metadata
   */
  async loadBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    try {
      const metadataPath = this.backupDirectory + `${backupId}_metadata.json`;
      const metadataFile = new FileSystem.File(metadataPath) as unknown as FileSystemFile;

      if (!await metadataFile.exists()) {
        return null;
      }

      const metadataJson = await metadataFile.text();

      return JSON.parse(metadataJson) as BackupMetadata;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to load backup metadata:', errorMessage);
      return null;
    }
  }

  /**
   * Delete backup metadata
   * @param backupId - Backup ID
   */
  async deleteBackupMetadata(backupId: string): Promise<void> {
    try {
      const metadataPath = this.backupDirectory + `${backupId}_metadata.json`;
      const metadataFile = new FileSystem.File(metadataPath) as unknown as FileSystemFile;

      if (await metadataFile.exists()) {
        await metadataFile.delete();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to delete backup metadata:', errorMessage);
    }
  }

  /**
   * Get interval in milliseconds
   * @param interval - Interval string ('daily', 'weekly', 'monthly')
   * @returns Interval in milliseconds
   */
  getIntervalMilliseconds(interval: BackupInterval): number {
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
   * @returns Device info
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      // This would typically use device info libraries
      // For now, return basic info
      return {
        platform: Platform.OS,
        version: Platform.Version.toString(),
        model: 'unknown'
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to get device info:', errorMessage);
      return {};
    }
  }

  /**
   * Ensure directory exists
   * @param dirPath - Directory path
   */
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      const directory = new FileSystem.Directory(dirPath) as unknown as FileSystemDirectory;
      const dirExists = await directory.exists();
      if (!dirExists) {
        await directory.create();
        console.log('Created directory:', dirPath);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to create directory:', dirPath, errorMessage);
      throw error;
    }
  }
}

// Export singleton instance
const backupService = new BackupService();

export default backupService;

