/**
 * DataEncryptionService - Enhanced encryption service for sensitive data
 * Provides encryption for snapshots, export files, and sensitive user data
 * 
 * Requirements: 19.1-19.5
 */

import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import EncryptionService from './EncryptionService';
import SecureStorageService from './SecureStorageService';

class DataEncryptionService {
  constructor() {
    this.encryption = EncryptionService;
    this.encryptedStorageDir = FileSystem.documentDirectory + 'encrypted/';
    this.encryptionEnabled = true; // Enable encryption by default for sensitive data
    this.deviceKeyPrefix = 'device_encryption_key_';
    this.userKeyPrefix = 'user_encryption_key_';
  }

  /**
   * Initialize data encryption service
   * @param {string} userId - User ID for user-specific encryption
   * @returns {Promise<void>}
   */
  async initialize(userId) {
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
   * @returns {Promise<void>}
   */
  async setupDeviceKey() {
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
   * @param {Object} snapshotData - Snapshot data to encrypt
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<Object>} - Encrypted snapshot info
   */
  async encryptSnapshotData(snapshotData, snapshotId) {
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
      const encryptedData = await this.encryption.encrypt(serializedData, fieldType);

      // Save encrypted data to file
      const encryptedFilePath = `${this.encryptedStorageDir}snapshot_${snapshotId}.enc`;
      const encryptedFile = new FileSystem.File(encryptedFilePath);
      await encryptedFile.write(encryptedData);

      // Verify file was created
      if (!await encryptedFile.exists()) {
        throw new Error('Failed to save encrypted snapshot data');
      }

      console.log('Snapshot data encrypted successfully:', {
        snapshotId,
        originalSize: serializedData.length,
        encryptedSize: encryptedFile.size
      });

      return {
        encrypted: true,
        filePath: encryptedFilePath,
        encryptionMethod: 'AES-256-GCM',
        fieldType: fieldType,
        originalSize: serializedData.length,
        encryptedSize: fileInfo.size
      };

    } catch (error) {
      console.error('Failed to encrypt snapshot data:', error);
      throw error;
    }
  }

  /**
   * Decrypt snapshot data
   * @param {string} encryptedFilePath - Path to encrypted snapshot file
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<Object>} - Decrypted snapshot data
   */
  async decryptSnapshotData(encryptedFilePath, snapshotId) {
    try {
      console.log('Decrypting snapshot data:', snapshotId);

      // Check if file exists
      const encryptedFile = new FileSystem.File(encryptedFilePath);
      if (!await encryptedFile.exists()) {
        throw new Error(`Encrypted snapshot file not found: ${encryptedFilePath}`);
      }

      // Read encrypted data
      const encryptedData = await encryptedFile.text();

      // Decrypt using snapshot-specific field type
      const fieldType = `snapshot_${snapshotId}`;
      const decryptedData = await this.encryption.decrypt(encryptedData, fieldType);

      // Parse JSON data
      const snapshotData = JSON.parse(decryptedData);

      console.log('Snapshot data decrypted successfully:', {
        snapshotId,
        encryptedSize: fileInfo.size,
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
   * @param {Array} photoFiles - Array of photo file paths
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<Array>} - Array of encrypted photo info
   */
  async encryptSnapshotPhotos(photoFiles, snapshotId) {
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

      const encryptedPhotos = [];
      const encryptedPhotoDir = `${this.encryptedStorageDir}photos/${snapshotId}/`;
      
      // Create encrypted photo directory
      await this.ensureDirectoryExists(encryptedPhotoDir);

      for (const photo of photoFiles) {
        try {
          // Read photo file as base64
          const photoFile = new FileSystem.File(photo.filePath);
          const photoData = await photoFile.base64();

          // Encrypt photo data
          const fieldType = `photo_${snapshotId}_${photo.fundItemId}`;
          const encryptedPhotoData = await this.encryption.encrypt(photoData, fieldType);

          // Save encrypted photo
          const encryptedPhotoPath = `${encryptedPhotoDir}${photo.fundItemId}_encrypted.enc`;
          const encryptedPhotoFile = new FileSystem.File(encryptedPhotoPath);
          await encryptedPhotoFile.write(encryptedPhotoData);

          // Verify encrypted file
          if (!await encryptedPhotoFile.exists()) {
            throw new Error(`Failed to save encrypted photo: ${photo.fundItemId}`);
          }

          encryptedPhotos.push({
            ...photo,
            encryptedPath: encryptedPhotoPath,
            encrypted: true,
            encryptionMethod: 'AES-256-GCM',
            fieldType: fieldType,
            originalSize: photoData.length,
            encryptedSize: encryptedFileInfo.size
          });

          console.log('Photo encrypted successfully:', {
            fundItemId: photo.fundItemId,
            originalPath: photo.filePath,
            encryptedPath: encryptedPhotoPath
          });

        } catch (photoError) {
          console.error(`Failed to encrypt photo ${photo.fundItemId}:`, photoError);
          // Keep original photo info but mark as failed
          encryptedPhotos.push({
            ...photo,
            encrypted: false,
            encryptionError: photoError.message
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
   * @param {Array} encryptedPhotos - Array of encrypted photo info
   * @param {string} snapshotId - Snapshot ID
   * @param {string} outputDir - Output directory for decrypted photos
   * @returns {Promise<Array>} - Array of decrypted photo info
   */
  async decryptSnapshotPhotos(encryptedPhotos, snapshotId, outputDir) {
    try {
      console.log('Decrypting snapshot photos:', {
        snapshotId,
        photoCount: encryptedPhotos.length
      });

      const decryptedPhotos = [];
      
      // Create output directory
      await this.ensureDirectoryExists(outputDir);

      for (const photo of encryptedPhotos) {
        try {
          if (!photo.encrypted || !photo.encryptedPath) {
            // Photo was not encrypted, copy original if it exists
            if (photo.filePath) {
              const originalFile = new FileSystem.File(photo.filePath);
              if (await originalFile.exists()) {
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
          const encryptedPhotoFile = new FileSystem.File(photo.encryptedPath);
          const encryptedPhotoData = await encryptedPhotoFile.text();

          // Decrypt photo data
          const fieldType = photo.fieldType || `photo_${snapshotId}_${photo.fundItemId}`;
          const decryptedPhotoData = await this.encryption.decrypt(encryptedPhotoData, fieldType);

          // Save decrypted photo
          const decryptedPhotoPath = `${outputDir}${photo.fundItemId}_decrypted.jpg`;
          // Convert base64 string to bytes and write
          const bytes = Uint8Array.from(atob(decryptedPhotoData), c => c.charCodeAt(0));
          const decryptedPhotoFile = new FileSystem.File(decryptedPhotoPath);
          await decryptedPhotoFile.write(bytes);

          // Verify decrypted file
          if (!await decryptedPhotoFile.exists()) {
            throw new Error(`Failed to save decrypted photo: ${photo.fundItemId}`);
          }

          decryptedPhotos.push({
            ...photo,
            decryptedPath: decryptedPhotoPath,
            decryptedSize: decryptedFileInfo.size
          });

          console.log('Photo decrypted successfully:', {
            fundItemId: photo.fundItemId,
            encryptedPath: photo.encryptedPath,
            decryptedPath: decryptedPhotoPath
          });

        } catch (photoError) {
          console.error(`Failed to decrypt photo ${photo.fundItemId}:`, photoError);
          decryptedPhotos.push({
            ...photo,
            decryptionError: photoError.message
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
   * @param {string} filePath - Path to export file
   * @param {string} password - User-provided password (optional)
   * @returns {Promise<Object>} - Encrypted file info
   */
  async encryptExportFile(filePath, password = null) {
    try {
      console.log('Encrypting export file:', filePath);

      // Read export file
      const exportFile = new FileSystem.File(filePath);
      const exportData = await exportFile.text();

      // Determine encryption field type
      let fieldType = 'export_data';
      if (password) {
        // Use password-derived field type for user-specific encryption
        fieldType = `export_${this.hashPassword(password)}`;
      }

      // Encrypt export data
      const encryptedData = await this.encryption.encrypt(exportData, fieldType);

      // Create encrypted file path
      const encryptedFilePath = filePath.replace(/\.(json|zip)$/, '.enc');
      const encryptedFile = new FileSystem.File(encryptedFilePath);
      await encryptedFile.write(encryptedData);

      // Verify encrypted file
      if (!await encryptedFile.exists()) {
        throw new Error('Failed to save encrypted export file');
      }

      console.log('Export file encrypted successfully:', {
        originalPath: filePath,
        encryptedPath: encryptedFilePath,
        originalSize: exportData.length,
        encryptedSize: encryptedFile.size
      });

      return {
        encrypted: true,
        originalPath: filePath,
        encryptedPath: encryptedFilePath,
        encryptionMethod: 'AES-256-GCM',
        fieldType: fieldType,
        originalSize: exportData.length,
        encryptedSize: encryptedFileInfo.size,
        passwordProtected: !!password
      };

    } catch (error) {
      console.error('Failed to encrypt export file:', error);
      throw error;
    }
  }

  /**
   * Decrypt export file
   * @param {string} encryptedFilePath - Path to encrypted export file
   * @param {string} password - User-provided password (optional)
   * @returns {Promise<Object>} - Decrypted file info
   */
  async decryptExportFile(encryptedFilePath, password = null) {
    try {
      console.log('Decrypting export file:', encryptedFilePath);

      // Read encrypted file
      const encryptedFile = new FileSystem.File(encryptedFilePath);
      const encryptedData = await encryptedFile.text();

      // Determine decryption field type
      let fieldType = 'export_data';
      if (password) {
        fieldType = `export_${this.hashPassword(password)}`;
      }

      // Decrypt export data
      const decryptedData = await this.encryption.decrypt(encryptedData, fieldType);

      // Create decrypted file path
      const decryptedFilePath = encryptedFilePath.replace('.enc', '_decrypted.json');
      const decryptedFile = new FileSystem.File(decryptedFilePath);
      await decryptedFile.write(decryptedData);

      // Verify decrypted file
      if (!await decryptedFile.exists()) {
        throw new Error('Failed to save decrypted export file');
      }

      console.log('Export file decrypted successfully:', {
        encryptedPath: encryptedFilePath,
        decryptedPath: decryptedFilePath,
        decryptedSize: decryptedFileInfo.size
      });

      return {
        decrypted: true,
        encryptedPath: encryptedFilePath,
        decryptedPath: decryptedFilePath,
        decryptedSize: decryptedFileInfo.size
      };

    } catch (error) {
      console.error('Failed to decrypt export file:', error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive user data fields
   * @param {Object} userData - User data object
   * @param {Array} sensitiveFields - Array of field names to encrypt
   * @returns {Promise<Object>} - Object with encrypted sensitive fields
   */
  async encryptSensitiveFields(userData, sensitiveFields = []) {
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
            encryptedData[fieldName] = await this.encryption.encrypt(userData[fieldName], fieldName);
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
   * @param {Object} encryptedData - Encrypted user data object
   * @param {Array} sensitiveFields - Array of field names to decrypt
   * @returns {Promise<Object>} - Object with decrypted sensitive fields
   */
  async decryptSensitiveFields(encryptedData, sensitiveFields = []) {
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
              decryptedData[fieldName] = await this.encryption.decrypt(encryptedData[fieldName], fieldName);
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
   * @returns {Object} - Encryption status info
   */
  getEncryptionStatus() {
    return {
      enabled: this.encryptionEnabled,
      algorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2-SHA256',
      deviceKeyExists: !!this.deviceKey,
      encryptionServiceInitialized: !!this.encryption.masterKey,
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
   * @param {boolean} enabled - Whether to enable encryption
   * @returns {Promise<void>}
   */
  async setEncryptionEnabled(enabled) {
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
   * @returns {Promise<void>}
   */
  async cleanup() {
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
   * @param {Object} snapshotData - Snapshot data
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<string>} - File path
   */
  async saveSnapshotDataPlain(snapshotData, snapshotId) {
    const plainFilePath = `${this.encryptedStorageDir}snapshot_${snapshotId}.json`;
    const serializedData = JSON.stringify(snapshotData, null, 2);

    const plainFile = new FileSystem.File(plainFilePath);
    await plainFile.write(serializedData);

    return plainFilePath;
  }

  /**
   * Hash password for consistent field type generation
   * @param {string} password - Password to hash
   * @returns {string} - Hashed password (first 8 characters)
   */
  hashPassword(password) {
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
   * @param {string} dirPath - Directory path
   * @returns {Promise<void>}
   */
  async ensureDirectoryExists(dirPath) {
    try {
      const dir = new FileSystem.Directory(dirPath);
      if (!await dir.exists()) {
        await dir.create();
      }
    } catch (error) {
      console.error('Failed to create directory:', dirPath, error);
      throw error;
    }
  }
}

// Export singleton instance
const dataEncryptionService = new DataEncryptionService();

export default dataEncryptionService;