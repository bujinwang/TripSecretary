/**
 * DataEncryptionService - Enhanced encryption service for sensitive data
 * Provides encryption for snapshots, export files, and sensitive user data
 * 
 * Requirements: 19.1-19.5
 */

import * as FileSystem from 'expo-file-system';
import { File, Directory, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import EncryptionService from './EncryptionService';
import SecureStorageService from './SecureStorageService';

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
      console.log('Initializing DataEncryptionService for user:', userId);

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

      console.log('DataEncryptionService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DataEncryptionService:', error);
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
        console.log('Generated new device encryption key');
      }

      // Store device key for use
      this.deviceKey = deviceKey;
    } catch (error) {
      console.error('Failed to setup device key:', error);
      throw error;
    }
  }

  /**
   * Encrypt snapshot data
   */
  async encryptSnapshotData(snapshotData: SnapshotData, snapshotId: string): Promise<EncryptedSnapshotInfo> {
    try {
      if (!this.encryptionEnabled) {
        console.log('Encryption disabled, storing snapshot data in plain text');
        return {
          encrypted: false,
          filePath: await this.saveSnapshotDataPlain(snapshotData, snapshotId),
          encryptionMethod: 'none'
        };
      }

      console.log('Encrypting snapshot data:', snapshotId);

      // Serialize snapshot data
      const serializedData = JSON.stringify(snapshotData, null, 2);

      // Encrypt using snapshot-specific field type
      const fieldType = `snapshot_${snapshotId}`;
      const encryptedData = await this.encryption.encrypt(serializedData, fieldType as any);

      // Save encrypted data to file
      const encryptedFilePath = `${this.encryptedStorageDir}snapshot_${snapshotId}.enc`;
      const encryptedFile = new File(encryptedFilePath);
      await encryptedFile.write(encryptedData);

      // Verify file was created
      if (!encryptedFile.exists) {
        throw new Error('Failed to save encrypted snapshot data');
      }

      const encryptedSize = encryptedFile.size || 0;

      console.log('Snapshot data encrypted successfully:', {
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
        encryptedSize: encryptedSize || 0
      };

    } catch (error) {
      console.error('Failed to encrypt snapshot data:', error);
      throw error;
    }
  }

  /**
   * Decrypt snapshot data
   */
  async decryptSnapshotData(encryptedFilePath: string, snapshotId: string): Promise<SnapshotData> {
    try {
      console.log('Decrypting snapshot data:', snapshotId);

      // Check if file exists
      const encryptedFile = new File(encryptedFilePath);
      if (!encryptedFile.exists) {
        throw new Error(`Encrypted snapshot file not found: ${encryptedFilePath}`);
      }

      // Read encrypted data
      const encryptedData = await encryptedFile.text();

      const encryptedSize = encryptedFile.size || 0;

      // Decrypt using snapshot-specific field type
      const fieldType = `snapshot_${snapshotId}`;
      const decryptedData = await this.encryption.decrypt(encryptedData, fieldType as any);

      // Parse JSON data
      const snapshotData = JSON.parse(decryptedData);

      console.log('Snapshot data decrypted successfully:', {
        snapshotId,
        encryptedSize: encryptedSize,
        decryptedSize: decryptedData.length
      });

      return snapshotData;

    } catch (error) {
      console.error('Failed to decrypt snapshot data:', error);
      throw error;
    }
  }

  /**
   * Encrypt snapshot photos
   */
  async encryptSnapshotPhotos(photoFiles: PhotoFile[], snapshotId: string): Promise<PhotoFile[]> {
    try {
      if (!this.encryptionEnabled) {
        console.log('Encryption disabled, photos stored in plain text');
        return photoFiles.map(photo => ({
          ...photo,
          encrypted: false,
          encryptionMethod: 'none'
        }));
      }

      console.log('Encrypting snapshot photos:', {
        snapshotId,
        photoCount: photoFiles.length
      });

      const encryptedPhotos: PhotoFile[] = [];
      const encryptedPhotoDir = `${this.encryptedStorageDir}photos/${snapshotId}/`;
      
      // Create encrypted photo directory
      await this.ensureDirectoryExists(encryptedPhotoDir);

      for (const photo of photoFiles) {
        try {
          // Read photo file as base64
          const photoFile = new File(photo.filePath);
          const photoData = await photoFile.base64();

          // Encrypt photo data
          const fieldType = `photo_${snapshotId}_${photo.fundItemId}`;
          const encryptedPhotoData = await this.encryption.encrypt(photoData, fieldType as any);

          // Save encrypted photo
          const encryptedPhotoPath = `${encryptedPhotoDir}${photo.fundItemId}_encrypted.enc`;
          const encryptedPhotoFile = new File(encryptedPhotoPath);
          await encryptedPhotoFile.write(encryptedPhotoData);

          // Verify encrypted file
          if (!encryptedPhotoFile.exists) {
            throw new Error(`Failed to save encrypted photo: ${photo.fundItemId}`);
          }

          const encryptedPhotoSize = encryptedPhotoFile.size || 0;

          encryptedPhotos.push({
            ...photo,
            encryptedPath: encryptedPhotoPath,
            encrypted: true,
            encryptionMethod: 'AES-256-GCM',
            fieldType: fieldType,
            originalSize: photoData.length,
            encryptedSize: encryptedPhotoSize || 0
          });

          console.log('Photo encrypted successfully:', {
            fundItemId: photo.fundItemId,
            originalPath: photo.filePath,
            encryptedPath: encryptedPhotoPath
          });

        } catch (photoError) {
          console.error(`Failed to encrypt photo ${photo.fundItemId}:`, photoError);
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
      console.error('Failed to encrypt snapshot photos:', error);
      throw error;
    }
  }

  /**
   * Decrypt snapshot photos
   */
  async decryptSnapshotPhotos(encryptedPhotos: PhotoFile[], snapshotId: string, outputDir: string): Promise<PhotoFile[]> {
    try {
      console.log('Decrypting snapshot photos:', {
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
              const originalFile = new File(photo.filePath) as any;
              if (originalFile.exists) {
                const outputPath = `${outputDir}${photo.fundItemId}_original.jpg`;
                await originalFile.copy(outputPath);
                decryptedPhotos.push({
                  ...photo,
                  decryptedPath: outputPath
                });
              }
            }
            continue;
          }

          // Read encrypted photo data
          const encryptedPhotoFile = new File(photo.encryptedPath);
          const encryptedPhotoData = await encryptedPhotoFile.text();

          // Decrypt photo data
          const fieldType = photo.fieldType || `photo_${snapshotId}_${photo.fundItemId}`;
          const decryptedPhotoData = await this.encryption.decrypt(encryptedPhotoData, fieldType as any);

          // Save decrypted photo
          const decryptedPhotoPath = `${outputDir}${photo.fundItemId}_decrypted.jpg`;
          // Convert base64 string to bytes and write
          const bytes = Uint8Array.from(atob(decryptedPhotoData), c => c.charCodeAt(0));
          const decryptedPhotoFile = new File(decryptedPhotoPath);
          await decryptedPhotoFile.write(bytes);

          // Verify decrypted file
          if (!decryptedPhotoFile.exists) {
            throw new Error(`Failed to save decrypted photo: ${photo.fundItemId}`);
          }

          const decryptedPhotoSize = decryptedPhotoFile.size || 0;

          decryptedPhotos.push({
            ...photo,
            decryptedPath: decryptedPhotoPath,
            decryptedSize: decryptedPhotoSize || 0
          });

          console.log('Photo decrypted successfully:', {
            fundItemId: photo.fundItemId,
            encryptedPath: photo.encryptedPath,
            decryptedPath: decryptedPhotoPath
          });

        } catch (photoError) {
          console.error(`Failed to decrypt photo ${photo.fundItemId}:`, photoError);
          const errorMessage = photoError instanceof Error ? photoError.message : 'Unknown error';
          decryptedPhotos.push({
            ...photo,
            decryptionError: errorMessage
          });
        }
      }

      return decryptedPhotos;

    } catch (error) {
      console.error('Failed to decrypt snapshot photos:', error);
      throw error;
    }
  }

  /**
   * Encrypt export file
   */
  async encryptExportFile(filePath: string, password: string | null = null): Promise<EncryptedExportInfo> {
    try {
      console.log('Encrypting export file:', filePath);

      // Read export file
      const exportFile = new File(filePath);
      const exportData = await exportFile.text();

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
      const encryptedFile = new File(encryptedFilePath);
      await encryptedFile.write(encryptedData);

      // Verify encrypted file
      if (!encryptedFile.exists) {
        throw new Error('Failed to save encrypted export file');
      }

      const encryptedSize = encryptedFile.size || 0;

      console.log('Export file encrypted successfully:', {
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
        encryptedSize: encryptedSize || 0,
        passwordProtected: !!password
      };

    } catch (error) {
      console.error('Failed to encrypt export file:', error);
      throw error;
    }
  }

  /**
   * Decrypt export file
   */
  async decryptExportFile(encryptedFilePath: string, password: string | null = null): Promise<DecryptedExportInfo> {
    try {
      console.log('Decrypting export file:', encryptedFilePath);

      // Read encrypted file
      const encryptedFile = new File(encryptedFilePath);
      const encryptedData = await encryptedFile.text();

      // Determine decryption field type
      let fieldType = 'export_data';
      if (password) {
        fieldType = `export_${this.hashPassword(password)}`;
      }

      // Decrypt export data
      const decryptedData = await this.encryption.decrypt(encryptedData, fieldType as any);

      // Create decrypted file path
      const decryptedFilePath = encryptedFilePath.replace('.enc', '_decrypted.json');
      const decryptedFile = new File(decryptedFilePath);
      await decryptedFile.write(decryptedData);

      // Verify decrypted file
      if (!decryptedFile.exists) {
        throw new Error('Failed to save decrypted export file');
      }

      const decryptedSize = decryptedFile.size || 0;

      console.log('Export file decrypted successfully:', {
        encryptedPath: encryptedFilePath,
        decryptedPath: decryptedFilePath,
        decryptedSize: decryptedSize
      });

      return {
        decrypted: true,
        encryptedPath: encryptedFilePath,
        decryptedPath: decryptedFilePath,
        decryptedSize: decryptedSize || 0
      };

    } catch (error) {
      console.error('Failed to decrypt export file:', error);
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
            console.log(`Encrypted field: ${fieldName}`);
          } catch (fieldError) {
            console.error(`Failed to encrypt field ${fieldName}:`, fieldError);
            // Keep original value if encryption fails
            encryptedData[fieldName] = userData[fieldName];
          }
        }
      }

      return encryptedData;

    } catch (error) {
      console.error('Failed to encrypt sensitive fields:', error);
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
              console.log(`Decrypted field: ${fieldName}`);
            }
          } catch (fieldError) {
            console.error(`Failed to decrypt field ${fieldName}:`, fieldError);
            // Keep original value if decryption fails (might not be encrypted)
            decryptedData[fieldName] = encryptedData[fieldName];
          }
        }
      }

      return decryptedData;

    } catch (error) {
      console.error('Failed to decrypt sensitive fields:', error);
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
      
      console.log('Encryption', enabled ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('Failed to set encryption enabled status:', error);
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
      
      console.log('DataEncryptionService cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup DataEncryptionService:', error);
    }
  }

  // Helper Methods

  /**
   * Save snapshot data in plain text (when encryption is disabled)
   */
  async saveSnapshotDataPlain(snapshotData: SnapshotData, snapshotId: string): Promise<string> {
    const plainFilePath = `${this.encryptedStorageDir}snapshot_${snapshotId}.json`;
    const serializedData = JSON.stringify(snapshotData, null, 2);

    const plainFile = new File(plainFilePath);
    await plainFile.write(serializedData);

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
    try {
      // Use LegacyFileSystem for directory creation (more reliable)
      const { makeDirectoryAsync } = await import('expo-file-system/legacy');
      await makeDirectoryAsync(dirPath, { intermediates: true });
    } catch (error) {
      // Directory might already exist, check if it's a different error
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        console.error('Failed to create directory:', dirPath, error);
        throw error;
      }
    }
  }
}

// Export singleton instance
const dataEncryptionService = new DataEncryptionService();

export default dataEncryptionService;

