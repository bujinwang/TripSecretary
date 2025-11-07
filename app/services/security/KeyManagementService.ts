/**
 * 入境通 - Key Management Service
 * Centralized key management for encryption services
 *
 * Features:
 * - Hierarchical key derivation and management
 * - Secure key storage and rotation
 * - Key lifecycle management
 * - Emergency key recovery mechanisms
 */

import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { Directory, Paths } from 'expo-file-system';
import EncryptionService from './EncryptionService';

// Type definitions
export interface KeyMetadata {
  userId: string;
  setupDate: string;
  keyVersion: string;
  rotationDue: string;
  algorithm: string;
  derivation: string;
  rotatedFrom?: string;
}

export interface SetupUserKeysResult {
  success: boolean;
  keyMetadata: KeyMetadata;
  backupCreated: boolean;
}

export interface BackupFile {
  filename: string;
  path: string;
  createdAt: string;
  type: string;
}

export interface BackupData {
  userId: string;
  backupDate: string;
  keyMetadata: KeyMetadata | null;
  encryptionInfo: Record<string, any>;
  recoveryCode: string;
}

export interface RotateUserKeysResult {
  success: boolean;
  newKeyMetadata: KeyMetadata;
  backupCreated: boolean;
}

export interface RecoverKeysResult {
  success: boolean;
  recoveredMetadata: KeyMetadata;
  backupDate: string;
}

export interface DeleteUserKeysResult {
  success: boolean;
}

export type KeyHealthStatus = 'no_keys' | 'healthy' | 'rotation_needed' | 'error';

export interface KeyHealth {
  status: KeyHealthStatus;
  message?: string;
  keyVersion?: string;
  setupDate?: string;
  daysUntilRotation?: number;
  backupCount?: number;
  lastBackup?: string | null;
  algorithm?: string;
}

export interface ExportKeyMetadataResult {
  userId: string;
  exportDate: string;
  keyMetadata: KeyMetadata | null;
  keyHealth: KeyHealth;
  encryptionInfo: Record<string, any>;
}

// Type for EncryptionService methods used
interface EncryptionServiceInterface {
  initialize(masterKey?: string | null): Promise<void>;
  setupUserKey(userId: string): Promise<void>;
  generateRandomKey(): string;
  encrypt(data: string, context: string): Promise<string>;
  decrypt(data: string, context: string): Promise<string>;
  clearKeys(): Promise<void>;
  getEncryptionInfo(): Record<string, any>;
}

class KeyManagementService {
  private readonly encryption: EncryptionServiceInterface;
  private readonly KEY_STORE_PREFIX: string = 'tripsec_key_';
  private readonly BACKUP_PREFIX: string = 'tripsec_backup_';
  private readonly RECOVERY_PREFIX: string = 'tripsec_recovery_';
  private readonly KEY_ROTATION_DAYS: number = 90; // Rotate keys every 90 days

  constructor() {
    this.encryption = EncryptionService as unknown as EncryptionServiceInterface;
  }

  /**
   * Initialize key management system
   */
  async initialize(masterKey: string | null = null): Promise<void> {
    try {
      // Initialize encryption service
      await this.encryption.initialize(masterKey);

      // Ensure key backup directory exists
      await this.ensureKeyBackupDirectory();

      // Check for key rotation
      await this.checkKeyRotation();

      console.log('Key management system initialized');
    } catch (error) {
      console.error('Failed to initialize key management:', error);
      throw error;
    }
  }

  /**
   * Ensure key backup directory exists
   */
  async ensureKeyBackupDirectory(): Promise<void> {
    try {
      // Use Paths helper for new Directory API
      const keyBackupDir = new Directory(Paths.document, 'key_backups');
      if (!keyBackupDir.exists) {
        keyBackupDir.create();
      }
    } catch (error) {
      console.error('Failed to create key backup directory:', error);
    }
  }

  /**
   * Setup user-specific key hierarchy
   */
  async setupUserKeys(userId: string): Promise<SetupUserKeysResult> {
    try {
      if (!userId) {
        throw new Error('User ID required for key setup');
      }

      // Setup user key in encryption service
      await this.encryption.setupUserKey(userId);

      // Store key metadata
      const keyMetadata: KeyMetadata = {
        userId,
        setupDate: new Date().toISOString(),
        keyVersion: '1.0',
        rotationDue: new Date(Date.now() + this.KEY_ROTATION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        algorithm: 'AES-256-GCM',
        derivation: 'PBKDF2-SHA256'
      };

      await SecureStore.setItemAsync(
        `${this.KEY_STORE_PREFIX}metadata_${userId}`,
        JSON.stringify(keyMetadata)
      );

      // Create key backup
      await this.createKeyBackup(userId);

      return {
        success: true,
        keyMetadata,
        backupCreated: true
      };
    } catch (error) {
      console.error('Failed to setup user keys:', error);
      throw error;
    }
  }

  /**
   * Get key metadata for user
   */
  async getKeyMetadata(userId: string): Promise<KeyMetadata | null> {
    try {
      const metadataStr = await SecureStore.getItemAsync(`${this.KEY_STORE_PREFIX}metadata_${userId}`);
      return metadataStr ? JSON.parse(metadataStr) : null;
    } catch (error) {
      console.error('Failed to get key metadata:', error);
      return null;
    }
  }

  /**
   * Check if keys need rotation
   */
  async checkKeyRotation(): Promise<void> {
    try {
      // Get all key metadata
      const keys = await SecureStore.getItemAsync(`${this.KEY_STORE_PREFIX}all_users`);
      if (!keys) {
        return;
      }

      const userIds: string[] = JSON.parse(keys);
      const now = new Date();

      for (const userId of userIds) {
        const metadata = await this.getKeyMetadata(userId);
        if (metadata && metadata.rotationDue) {
          const rotationDue = new Date(metadata.rotationDue);
          if (now > rotationDue) {
            console.log(`Key rotation needed for user ${userId}`);
            // In production, you might want to trigger key rotation here
            // await this.rotateUserKeys(userId);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check key rotation:', error);
    }
  }

  /**
   * Rotate user keys (for security maintenance)
   */
  async rotateUserKeys(userId: string): Promise<RotateUserKeysResult> {
    try {
      console.log(`Rotating keys for user ${userId}`);

      // Create backup of current keys before rotation
      await this.createKeyBackup(userId, 'prerotation');

      // Generate new master key for this user
      const newMasterKey = this.encryption.generateRandomKey();

      // Re-initialize encryption with new key
      await this.encryption.initialize(newMasterKey);
      await this.encryption.setupUserKey(userId);

      // Update key metadata
      const keyMetadata: KeyMetadata = {
        userId,
        setupDate: new Date().toISOString(),
        keyVersion: '2.0',
        rotationDue: new Date(Date.now() + this.KEY_ROTATION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        algorithm: 'AES-256-GCM',
        derivation: 'PBKDF2-SHA256',
        rotatedFrom: new Date().toISOString()
      };

      await SecureStore.setItemAsync(
        `${this.KEY_STORE_PREFIX}metadata_${userId}`,
        JSON.stringify(keyMetadata)
      );

      // Create backup of new keys
      await this.createKeyBackup(userId, 'postrotation');

      return {
        success: true,
        newKeyMetadata: keyMetadata,
        backupCreated: true
      };
    } catch (error) {
      console.error('Failed to rotate user keys:', error);
      throw error;
    }
  }

  /**
   * Create encrypted backup of user keys
   */
  async createKeyBackup(userId: string, suffix: string = ''): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `${this.BACKUP_PREFIX}${userId}_${timestamp}${suffix ? '_' + suffix : ''}.json`;

      // Use Paths helper for path construction
      const backupDir = `${Paths.document}key_backups/`;
      const backupPath = backupDir + backupName;

      // Get key metadata
      const metadata = await this.getKeyMetadata(userId);

      // Create backup data (without actual keys, just metadata and recovery info)
      const backupData: BackupData = {
        userId,
        backupDate: new Date().toISOString(),
        keyMetadata: metadata,
        encryptionInfo: this.encryption.getEncryptionInfo(),
        recoveryCode: this.generateRecoveryCode()
      };

      // Encrypt backup data with recovery key
      const recoveryKey = await this.generateRecoveryKey();
      const encryptedBackup = await this.encryption.encrypt(
        JSON.stringify(backupData),
        'recovery'
      );

      // Save encrypted backup
      const { File } = await import('expo-file-system');
      const backupFile = new File(backupPath);
      await backupFile.write(encryptedBackup);

      // Store backup reference
      const backups = await this.getUserBackups(userId);
      backups.push({
        filename: backupName,
        path: backupPath,
        createdAt: backupData.backupDate,
        type: suffix || 'regular'
      });

      await SecureStore.setItemAsync(
        `${this.KEY_STORE_PREFIX}backups_${userId}`,
        JSON.stringify(backups)
      );

      console.log(`Key backup created: ${backupName}`);
      return backupPath;
    } catch (error) {
      console.error('Failed to create key backup:', error);
      throw error;
    }
  }

  /**
   * Get list of user key backups
   */
  async getUserBackups(userId: string): Promise<BackupFile[]> {
    try {
      const backupsStr = await SecureStore.getItemAsync(`${this.KEY_STORE_PREFIX}backups_${userId}`);
      return backupsStr ? JSON.parse(backupsStr) : [];
    } catch (error) {
      console.error('Failed to get user backups:', error);
      return [];
    }
  }

  /**
   * Generate recovery key for emergency key recovery
   */
  async generateRecoveryKey(): Promise<string> {
    // In production, this should be derived from user credentials or biometric data
    // For now, generate a strong random key
    return this.encryption.generateRandomKey();
  }

  /**
   * Generate recovery code for key recovery
   */
  generateRecoveryCode(): string {
    // Generate a 12-character recovery code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar-looking chars
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const formatted = code.match(/.{1,4}/g);
    return formatted ? formatted.join('-') : code; // Format as XXXX-XXXX-XXXX
  }

  /**
   * Emergency key recovery (for lost key scenarios)
   */
  async recoverKeys(userId: string, recoveryCode: string, backupPath: string): Promise<RecoverKeysResult> {
    try {
      console.log(`Attempting key recovery for user ${userId}`);

      // Read encrypted backup
      const { File } = await import('expo-file-system');
      const backupFile = new File(backupPath);
      const encryptedBackup = await backupFile.text();

      // Decrypt backup
      const decryptedBackup = await this.encryption.decrypt(encryptedBackup, 'recovery');
      const backupData: BackupData = JSON.parse(decryptedBackup);

      // Verify recovery code
      if (backupData.recoveryCode !== recoveryCode) {
        throw new Error('Invalid recovery code');
      }

      // Restore key metadata
      await SecureStore.setItemAsync(
        `${this.KEY_STORE_PREFIX}metadata_${userId}`,
        JSON.stringify(backupData.keyMetadata)
      );

      // Re-initialize encryption with recovered keys
      await this.encryption.initialize();
      await this.encryption.setupUserKey(userId);

      console.log(`Key recovery successful for user ${userId}`);
      return {
        success: true,
        recoveredMetadata: backupData.keyMetadata!,
        backupDate: backupData.backupDate
      };
    } catch (error) {
      console.error('Key recovery failed:', error);
      throw new Error('Key recovery failed - invalid recovery code or corrupted backup');
    }
  }

  /**
   * Securely delete user keys (for account deletion)
   */
  async deleteUserKeys(userId: string): Promise<DeleteUserKeysResult> {
    try {
      console.log(`Deleting keys for user ${userId}`);

      // Delete key metadata
      await SecureStore.deleteItemAsync(`${this.KEY_STORE_PREFIX}metadata_${userId}`);

      // Delete backup references
      await SecureStore.deleteItemAsync(`${this.KEY_STORE_PREFIX}backups_${userId}`);

      // Delete actual key backups (secure delete)
      const backups = await this.getUserBackups(userId);
      const { File } = await import('expo-file-system');
      for (const backup of backups) {
        try {
          const backupFile = new File(backup.path);
          if (backupFile.exists) {
            await backupFile.delete();
          }
        } catch (error) {
          console.error(`Failed to delete backup ${backup.filename}:`, error);
        }
      }

      // Clear encryption service keys
      await this.encryption.clearKeys();

      console.log(`Keys deleted for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete user keys:', error);
      throw error;
    }
  }

  /**
   * Get key health status
   */
  async getKeyHealth(userId: string): Promise<KeyHealth> {
    try {
      const metadata = await this.getKeyMetadata(userId);
      const backups = await this.getUserBackups(userId);

      if (!metadata) {
        return {
          status: 'no_keys',
          message: 'No encryption keys found for user'
        };
      }

      const now = new Date();
      const rotationDue = new Date(metadata.rotationDue);
      const daysUntilRotation = Math.ceil((rotationDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        status: daysUntilRotation > 0 ? 'healthy' : 'rotation_needed',
        keyVersion: metadata.keyVersion,
        setupDate: metadata.setupDate,
        daysUntilRotation: Math.max(0, daysUntilRotation),
        backupCount: backups.length,
        lastBackup: backups.length > 0 ? backups[backups.length - 1].createdAt : null,
        algorithm: metadata.algorithm
      };
    } catch (error) {
      console.error('Failed to get key health:', error);
      return {
        status: 'error',
        message: 'Failed to check key health'
      };
    }
  }

  /**
   * Export key metadata for compliance (without actual keys)
   */
  async exportKeyMetadata(userId: string): Promise<ExportKeyMetadataResult> {
    try {
      const metadata = await this.getKeyMetadata(userId);
      const health = await this.getKeyHealth(userId);

      return {
        userId,
        exportDate: new Date().toISOString(),
        keyMetadata: metadata,
        keyHealth: health,
        encryptionInfo: this.encryption.getEncryptionInfo()
      };
    } catch (error) {
      console.error('Failed to export key metadata:', error);
      throw error;
    }
  }

  /**
   * Clean up old backups (keep only recent ones)
   */
  async cleanupOldBackups(userId: string, keepCount: number = 5): Promise<void> {
    try {
      const backups = await this.getUserBackups(userId);
      if (backups.length <= keepCount) {
        return;
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Delete old backups
      const toDelete = backups.slice(keepCount);
      const { File } = await import('expo-file-system');
      for (const backup of toDelete) {
        try {
          const backupFile = new File(backup.path);
          if (backupFile.exists) {
            await backupFile.delete();
          }
          console.log(`Deleted old backup: ${backup.filename}`);
        } catch (error) {
          console.error(`Failed to delete backup ${backup.filename}:`, error);
        }
      }

      // Update backup list
      const remainingBackups = backups.slice(0, keepCount);
      await SecureStore.setItemAsync(
        `${this.KEY_STORE_PREFIX}backups_${userId}`,
        JSON.stringify(remainingBackups)
      );
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }
}

// Create singleton instance
const keyManagementService = new KeyManagementService();

export default keyManagementService;

