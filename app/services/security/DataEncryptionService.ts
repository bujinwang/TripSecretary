/**
 * DataEncryptionService - Enhanced encryption service for sensitive data
 * Provides encryption for snapshots, export files, and sensitive user data
 * 
 * Requirements: 19.1-19.5
 */

import * as FileSystem from 'expo-file-system';
import { Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import EncryptionService from './EncryptionService';
import SecureStorageService from './SecureStorageService';
import logger from '../LoggingService';

// Type definitions
export interface EncryptedSnapshotInfo {
  encrypted: boolean;
  filePath: string;
  encryptionMethod: string;
  fieldType?: string;
  originalSize?: number;
  encryptedSize?: number;
}

export interface PhotoFile {
  filePath: string;
  fundItemId: string;
  encrypted?: boolean;
  encryptedPath?: string;
  encryptionMethod?: string;
  fieldType?: string;
  originalSize?: number;
  encryptedSize?: number;
  encryptionError?: string;
  decryptedPath?: string;
  decryptedSize?: number;
  decryptionError?: string;
}

export interface EncryptedExportInfo {
  encrypted: boolean;
  originalPath: string;
  encryptedPath: string;
  encryptionMethod: string;
  fieldType: string;
  originalSize: number;
  encryptedSize: number;
  passwordProtected: boolean;
}

export interface DecryptedExportInfo {
  decrypted: boolean;
  encryptedPath: string;
  decryptedPath: string;
  decryptedSize: number;
}

export interface EncryptionStatus {
  enabled: boolean;
  algorithm: string;
  keyDerivation: string;
  deviceKeyExists: boolean;
  encryptionServiceInitialized: boolean;
  encryptedStorageDir: string;
  supportedDataTypes: string[];
}

interface SnapshotData {
  [key: string]: any;
}

interface UserData {
  [key: string]: any;
}

class DataEncryptionService {
  private readonly encryption: typeof EncryptionService = EncryptionService;
  private readonly encryptedStorageDir: string;
  private encryptionEnabled: boolean = true; // Enable encryption by default for sensitive data
  private readonly deviceKeyPrefix: string = 'device_encryption_key_';
  private readonly userKeyPrefix: string = 'user_encryption_key_';
  private deviceKey: string | null = null;

  constructor() {
    this.encryptedStorageDir = `${Paths.document}encrypted/`;
  }

  /**
   * Initialize data encryption service
   */
  async initialize(userId: string | null = null): Promise<void> {
    try {
      logger.info('DataEncryptionService', 'Initializing DataEncryptionService', { userId });

      // Ensure encrypted storage directory exists
      await this.ensureDirectoryExists(this.encryptedStorageDir);

      // Initialize base encryption service
      await this.encryption.initialize();

      // Set up user-specific encryption if userId provided
      if (userId) {
        await this.encryption.setupUserKey(userId);
      }

      // Generate or load device-specific encryption key
      await this.setupDeviceKey();

      logger.info('DataEncryptionService', 'DataEncryptionService initialized successfully');
    } catch (error) {
      logger.error('DataEncryptionService', error, { operation: 'initialize', userId });
      throw error;
    }
  }

  /**
   * Set up device-specific encryption key
   */
  async setupDeviceKey(): Promise<void> {
    try {
      const deviceKeyName = `${this.deviceKeyPrefix}main`;
      let deviceKey = await SecureStore.getItemAsync(deviceKeyName);

      if (!deviceKey) {
        // Generate new device key
        deviceKey = this.encryption.generateRandomKey();
        await SecureStore.setItemAsync(deviceKeyName, deviceKey);
        logger.info('DataEncryptionService', 'Generated new device encryption key');
      }

      // Store device key for use
      this.deviceKey = deviceKey;
    } catch (error) {
      logger.error('DataEncryptionService', error, { operation: 'setupDeviceKey' });
      throw error;
    }
  }

  /**
   * Encrypt snapshot data
   */
  async encryptSnapshotData(snapshotData: SnapshotData, snapshotId: string): Promise<EncryptedSnapshotInfo> {
    try {
      if (!this.encryptionEnabled) {
        logger.info('DataEncryptionService', 'Encryption disabled, storing snapshot data in plain text');
        return {
          encrypted: false,
          filePath: await this.saveSnapshotDataPlain(snapshotData, snapshotId),
          encryptionMethod: 'none'
        };
      }

      logger.info('DataEncryptionService', 'Encrypting snapshot data', { snapshotId });

      // Serialize snapshot data
      const serializedData = JSON.stringify(snapshotData, null, 2);

      // Encrypt using snapshot-specific field type
      const fieldType = `snapshot_${snapshotId}`;
      const encryptedData = await this.encryption.encrypt(serializedData, fieldType as any);

      // Save encrypted data to file
      const encryptedFilePath = `${this.encryptedStorageDir}snapshot_${snapshotId}.enc`;
      await FileSystem.writeAsStringAsync(encryptedFilePath, encryptedData);

      const encryptedInfo = await FileSystem.getInfoAsync(encryptedFilePath);
      if (!encryptedInfo.exists || encryptedInfo.isDirectory) {
        throw new Error('Failed to save encrypted snapshot data');
      }

      const encryptedSize = encryptedInfo.size ?? 0;

      logger.info('DataEncryptionService', 'Snapshot data encrypted successfully', {
        snapshotId,
        originalSize: serializedData.length,
        encryptedSize: encryptedSize
      });

      return {
        encrypted: true,
        filePath: encryptedFilePath,
        encryptionMethod: 'AES-256-GCM',
        fieldType: fieldType,
        originalSize: serializedData.length,
        encryptedSize
      };

    } catch (error) {
      logger.error('DataEncryptionService', error, { operation: 'encryptSnapshotData', snapshotId });
      throw error;
    }
  }

  /**
   * Decrypt snapshot data
   */
  async decryptSnapshotData(encryptedFilePath: string, snapshotId: string): Promise<SnapshotData> {
    try {
      logger.info('DataEncryptionService', 'Decrypting snapshot data', { snapshotId });

      // Check if file exists
      const encryptedInfo = await FileSystem.getInfoAsync(encryptedFilePath);
      if (!encryptedInfo.exists || encryptedInfo.isDirectory) {
        throw new Error(`Encrypted snapshot file not found: ${encryptedFilePath}`);
      }

      // Read encrypted data
      const encryptedData = await FileSystem.readAsStringAsync(encryptedFilePath);
      const encryptedSize = encryptedInfo.size ?? 0;

      // Decrypt using snapshot-specific field type
      const fieldType = `snapshot_${snapshotId}`;
      const decryptedData = await this.encryption.decrypt(encryptedData, fieldType as any);

      // Parse JSON data
      const snapshotData = JSON.parse(decryptedData);

      logger.info('DataEncryptionService', 'Snapshot data decrypted successfully', {
        snapshotId,
        encryptedSize: encryptedSize,
        decryptedSize: decryptedData.length
      });

      return snapshotData;

    } catch (error) {
      logger.error('DataEncryptionService', error, { operation: 'decryptSnapshotData', snapshotId });
      throw error;
    }
  }

  /**
   * Encrypt snapshot photos
   */
  async encryptSnapshotPhotos(photoFiles: PhotoFile[], snapshotId: string): Promise<PhotoFile[]> {
    try {
      if (!this.encryptionEnabled) {
        logger.info('DataEncryptionService', 'Encryption disabled, photos stored in plain text');
        return photoFiles.map(photo => ({
          ...photo,
          encrypted: false,
          encryptionMethod: 'none'
        }));
      }

      logger.info('DataEncryptionService', 'Encrypting snapshot photos', {
        snapshotId,
        photoCount: photoFiles.length
      });

      const encryptedPhotos: PhotoFile[] = [];
      const encryptedPhotoDir = `${this.encryptedStorageDir}photos/${snapshotId}/`;
      
      // Create encrypted photo directory
      await this.ensureDirectoryExists(encryptedPhotoDir);

      for (const photo of photoFiles) {
        try {
          const originalInfo = await FileSystem.getInfoAsync(photo.filePath);
          if (!originalInfo.exists || originalInfo.isDirectory) {
            throw new Error(`Photo file not found: ${photo.filePath}`);
          }

          // Read photo file as base64
          const photoData = await FileSystem.readAsStringAsync(photo.filePath, {
            encoding: FileSystem.EncodingType.Base64
          });

          // Encrypt photo data
          const fieldType = `photo_${snapshotId}_${photo.fundItemId}`;
          const encryptedPhotoData = await this.encryption.encrypt(photoData, fieldType as any);

          // Save encrypted photo
          const encryptedPhotoPath = `${encryptedPhotoDir}${photo.fundItemId}_encrypted.enc`;
          await FileSystem.writeAsStringAsync(encryptedPhotoPath, encryptedPhotoData);

          const encryptedInfo = await FileSystem.getInfoAsync(encryptedPhotoPath);
          if (!encryptedInfo.exists || encryptedInfo.isDirectory) {
            throw new Error(`Failed to save encrypted photo: ${photo.fundItemId}`);
          }

          const encryptedPhotoSize = encryptedInfo.size ?? 0;

          encryptedPhotos.push({
            ...photo,
            encryptedPath: encryptedPhotoPath,
            encrypted: true,
            encryptionMethod: 'AES-256-GCM',
            fieldType: fieldType,
            originalSize: photoData.length,
            encryptedSize: encryptedPhotoSize
          });

          logger.debug('DataEncryptionService', 'Photo encrypted successfully', {
            fundItemId: photo.fundItemId,
            originalPath: photo.filePath,
            encryptedPath: encryptedPhotoPath
          });

        } catch (photoError) {
          logger.error('DataEncryptionService', photoError, { 
            operation: 'encryptPhoto', 
            fundItemId: photo.fundItemId 
          });
          const errorMessage = photoError instanceof Error ? photoError.message : 'Unknown error';
          // Keep original photo info but mark as failed
          encryptedPhotos.push({
            ...photo,
            encrypted: false,
            encryptionError: errorMessage
          });
        }
      }

      return encryptedPhotos;

    } catch (error) {
      logger.error('DataEncryptionService', error, { operation: 'encryptSnapshotPhotos', snapshotId });
      throw error;
    }
  }

  /**
   * Decrypt snapshot photos
   */
  async decryptSnapshotPhotos(encryptedPhotos: PhotoFile[], snapshotId: string, outputDir: string): Promise<PhotoFile[]> {
    try {
      logger.info('DataEncryptionService', 'Decrypting snapshot photos', {
        snapshotId,
        photoCount: encryptedPhotos.length
      });

      const decryptedPhotos: PhotoFile[] = [];
      
      // Create output directory
      await this.ensureDirectoryExists(outputDir);

      for (const photo of encryptedPhotos) {
        try {
          if (!photo.encrypted || !photo.encryptedPath) {
            // Photo was not encrypted, copy original if it exists
            if (photo.filePath) {
              const originalInfo = await FileSystem.getInfoAsync(photo.filePath);
              if (originalInfo.exists && !originalInfo.isDirectory) {
                const outputPath = `${outputDir}${photo.fundItemId}_original.jpg`;
                await FileSystem.copyAsync({ from: photo.filePath, to: outputPath });
                decryptedPhotos.push({
                  ...photo,
                  decryptedPath: outputPath
                });
              }
            }
            continue;
          }

          // Read encrypted photo data
          const encryptedInfo = await FileSystem.getInfoAsync(photo.encryptedPath);
          if (!encryptedInfo.exists || encryptedInfo.isDirectory) {
            throw new Error(`Encrypted photo not found: ${photo.encryptedPath}`);
          }

          const encryptedPhotoData = await FileSystem.readAsStringAsync(photo.encryptedPath);

          // Decrypt photo data
          const fieldType = photo.fieldType || `photo_${snapshotId}_${photo.fundItemId}`;
          const decryptedPhotoData = await this.encryption.decrypt(encryptedPhotoData, fieldType as any);

          // Save decrypted photo
          const decryptedPhotoPath = `${outputDir}${photo.fundItemId}_decrypted.jpg`;
          await FileSystem.writeAsStringAsync(decryptedPhotoPath, decryptedPhotoData, {
            encoding: FileSystem.EncodingType.Base64
          });

          const decryptedInfo = await FileSystem.getInfoAsync(decryptedPhotoPath);
          if (!decryptedInfo.exists || decryptedInfo.isDirectory) {
            throw new Error(`Failed to save decrypted photo: ${photo.fundItemId}`);
          }

          const decryptedPhotoSize = decryptedInfo.size ?? 0;

          decryptedPhotos.push({
            ...photo,
            decryptedPath: decryptedPhotoPath,
            decryptedSize: decryptedPhotoSize
          });

          logger.debug('DataEncryptionService', 'Photo decrypted successfully', {
            fundItemId: photo.fundItemId,
            encryptedPath: photo.encryptedPath,
            decryptedPath: decryptedPhotoPath
          });

        } catch (photoError) {
          logger.error('DataEncryptionService', photoError, { 
            operation: 'decryptPhoto', 
            fundItemId: photo.fundItemId 
          });
          const errorMessage = photoError instanceof Error ? photoError.message : 'Unknown error';
          decryptedPhotos.push({
            ...photo,
            decryptionError: errorMessage
          });
        }
      }

      return decryptedPhotos;

    } catch (error) {
      logger.error('DataEncryptionService', error, { operation: 'decryptSnapshotPhotos', snapshotId });
      throw error;
    }
  }

  /**
   * Encrypt export file
   */
  async encryptExportFile(filePath: string, password: string | null = null): Promise<EncryptedExportInfo> {
    try {
      logger.info('DataEncryptionService', 'Encrypting export file', { filePath });

      // Read export file
      const exportInfo = await FileSystem.getInfoAsync(filePath);
      if (!exportInfo.exists || exportInfo.isDirectory) {
        throw new Error(`Export file not found: ${filePath}`);
      }

      const exportData = await FileSystem.readAsStringAsync(filePath);

      // Determine encryption field type
      let fieldType = 'export_data';
      if (password) {
        // Use password-derived field type for user-specific encryption
        fieldType = `export_${this.hashPassword(password)}`;
      }

      // Encrypt export data
      const encryptedData = await this.encryption.encrypt(exportData, fieldType as any);

      // Create encrypted file path
      const encryptedFilePath = filePath.replace(/\.(json|zip)$/, '.enc');
      await FileSystem.writeAsStringAsync(encryptedFilePath, encryptedData);

      const encryptedInfo = await FileSystem.getInfoAsync(encryptedFilePath);
      if (!encryptedInfo.exists || encryptedInfo.isDirectory) {
        throw new Error('Failed to save encrypted export file');
      }

      const encryptedSize = encryptedInfo.size ?? 0;

      logger.info('DataEncryptionService', 'Export file encrypted successfully', {
        originalPath: filePath,
        encryptedPath: encryptedFilePath,
        originalSize: exportData.length,
        encryptedSize: encryptedSize
      });

      return {
        encrypted: true,
        originalPath: filePath,
        encryptedPath: encryptedFilePath,
        encryptionMethod: 'AES-256-GCM',
        fieldType: fieldType,
        originalSize: exportData.length,
        encryptedSize,
        passwordProtected: !!password
      };

    } catch (error) {
      logger.error('DataEncryptionService', error, { operation: 'encryptExportFile', filePath });
      throw error;
    }
  }

  /**
   * Decrypt export file
   */
  async decryptExportFile(encryptedFilePath: string, password: string | null = null): Promise<DecryptedExportInfo> {
    try {
      logger.info('DataEncryptionService', 'Decrypting export file', { encryptedFilePath });

      // Read encrypted file
      const encryptedInfo = await FileSystem.getInfoAsync(encryptedFilePath);
      if (!encryptedInfo.exists || encryptedInfo.isDirectory) {
        throw new Error(`Encrypted export file not found: ${encryptedFilePath}`);
      }

      const encryptedData = await FileSystem.readAsStringAsync(encryptedFilePath);

      // Determine decryption field type
      let fieldType = 'export_data';
      if (password) {
        fieldType = `export_${this.hashPassword(password)}`;
      }

      // Decrypt export data
      const decryptedData = await this.encryption.decrypt(encryptedData, fieldType as any);

      // Create decrypted file path
      const decryptedFilePath = encryptedFilePath.replace('.enc', '_decrypted.json');
      await FileSystem.writeAsStringAsync(decryptedFilePath, decryptedData);

      const decryptedInfo = await FileSystem.getInfoAsync(decryptedFilePath);
      if (!decryptedInfo.exists || decryptedInfo.isDirectory) {
        throw new Error('Failed to save decrypted export file');
      }

      const decryptedSize = decryptedInfo.size ?? 0;

      logger.info('DataEncryptionService', 'Export file decrypted successfully', {
        encryptedPath: encryptedFilePath,
        decryptedPath: decryptedFilePath,
        decryptedSize: decryptedSize
      });

      return {
        decrypted: true,
        encryptedPath: encryptedFilePath,
        decryptedPath: decryptedFilePath,
        decryptedSize
      };

    } catch (error) {
      logger.error('DataEncryptionService', error, { operation: 'decryptExportFile', encryptedFilePath });
      throw error;
    }
  }

  /**
   * Encrypt sensitive user data fields
   */
  async encryptSensitiveFields(userData: UserData, sensitiveFields: string[] = []): Promise<UserData> {
    try {
      if (!this.encryptionEnabled) {
        return userData;
      }

      const encryptedData = { ...userData };
      const defaultSensitiveFields = [
        'passportNumber',
        'fullName',
        'dateOfBirth',
        'phoneNumber',
        'email',
        'homeAddress',
        'bankDetails',
        'creditCardNumber'
      ];

      const fieldsToEncrypt = sensitiveFields.length > 0 ? sensitiveFields : defaultSensitiveFields;

      for (const fieldName of fieldsToEncrypt) {
        if (userData[fieldName] && typeof userData[fieldName] === 'string') {
          try {
            encryptedData[fieldName] = await this.encryption.encrypt(userData[fieldName], fieldName as any);
            logger.debug('DataEncryptionService', `Encrypted field: ${fieldName}`);
          } catch (fieldError) {
            logger.error('DataEncryptionService', fieldError, { operation: 'encryptField', fieldName });
            // Keep original value if encryption fails
            encryptedData[fieldName] = userData[fieldName];
          }
        }
      }

      return encryptedData;

    } catch (error) {
      logger.error('DataEncryptionService', error, { operation: 'encryptSensitiveFields' });
      return userData;
    }
  }

  /**
   * Decrypt sensitive user data fields
   */
  async decryptSensitiveFields(encryptedData: UserData, sensitiveFields: string[] = []): Promise<UserData> {
    try {
      if (!this.encryptionEnabled) {
        return encryptedData;
      }

      const decryptedData = { ...encryptedData };
      const defaultSensitiveFields = [
        'passportNumber',
        'fullName',
        'dateOfBirth',
        'phoneNumber',
        'email',
        'homeAddress',
        'bankDetails',
        'creditCardNumber'
      ];

      const fieldsToDecrypt = sensitiveFields.length > 0 ? sensitiveFields : defaultSensitiveFields;

      for (const fieldName of fieldsToDecrypt) {
        if (encryptedData[fieldName] && typeof encryptedData[fieldName] === 'string') {
          try {
            // Only attempt decryption if the field looks encrypted (heuristic: length > 50)
            if (encryptedData[fieldName].length > 50) {
              decryptedData[fieldName] = await this.encryption.decrypt(encryptedData[fieldName], fieldName as any);
              logger.debug('DataEncryptionService', `Decrypted field: ${fieldName}`);
            }
          } catch (fieldError) {
            logger.error('DataEncryptionService', fieldError, { operation: 'decryptField', fieldName });
            // Keep original value if decryption fails (might not be encrypted)
            decryptedData[fieldName] = encryptedData[fieldName];
          }
        }
      }

      return decryptedData;

    } catch (error) {
      logger.error('DataEncryptionService', error, { operation: 'decryptSensitiveFields' });
      return encryptedData;
    }
  }

  /**
   * Get encryption status and configuration
   */
  getEncryptionStatus(): EncryptionStatus {
    return {
      enabled: this.encryptionEnabled,
      algorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2-SHA256',
      deviceKeyExists: !!this.deviceKey,
      encryptionServiceInitialized: true, // EncryptionService is initialized via initialize()
      encryptedStorageDir: this.encryptedStorageDir,
      supportedDataTypes: [
        'snapshots',
        'photos',
        'exports',
        'sensitive_fields'
      ]
    };
  }

  /**
   * Enable or disable encryption
   */
  async setEncryptionEnabled(enabled: boolean): Promise<void> {
    try {
      this.encryptionEnabled = enabled;
      
      // Store encryption preference
      await SecureStore.setItemAsync('encryption_enabled', enabled.toString());
      
      logger.info('DataEncryptionService', 'Encryption', { enabled: enabled ? 'enabled' : 'disabled' });
    } catch (error) {
      logger.error('DataEncryptionService', error, { operation: 'setEncryptionEnabled' });
    }
  }

  /**
   * Clean up encryption keys and temporary files
   */
  async cleanup(): Promise<void> {
    try {
      // Clear encryption service keys
      await this.encryption.clearKeys();
      
      // Clear device key from memory
      this.deviceKey = null;
      
      logger.info('DataEncryptionService', 'DataEncryptionService cleanup completed');
    } catch (error) {
      logger.error('DataEncryptionService', error, { operation: 'cleanup' });
    }
  }

  // Helper Methods

  /**
   * Save snapshot data in plain text (when encryption is disabled)
   */
  async saveSnapshotDataPlain(snapshotData: SnapshotData, snapshotId: string): Promise<string> {
    const plainFilePath = `${this.encryptedStorageDir}snapshot_${snapshotId}.json`;
    const serializedData = JSON.stringify(snapshotData, null, 2);

    await FileSystem.writeAsStringAsync(plainFilePath, serializedData);

    return plainFilePath;
  }

  /**
   * Hash password for consistent field type generation
   */
  hashPassword(password: string): string {
    // Simple hash for field type generation (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    if (dirInfo.exists) {
      if (!dirInfo.isDirectory) {
        throw new Error(`Expected directory at path: ${dirPath}`);
      }
      return;
    }

    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  }
}

// Export singleton instance
const dataEncryptionService = new DataEncryptionService();

export default dataEncryptionService;
