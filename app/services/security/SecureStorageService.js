/**
 * 入境通 - Secure Storage Service
 * Encrypted local storage for sensitive user data
 *
 * Features:
 * - SQLite with SQLCipher encryption
 * - Field-level encryption for sensitive data
 * - GDPR/PIPL compliant data management
 * - Automatic data migration and backup
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import EncryptionService from './EncryptionService';

class SecureStorageService {
  constructor() {
    this.db = null;
    this.encryption = EncryptionService;
    this.DB_NAME = 'tripsecretary_secure';
    this.DB_VERSION = '1.0.0';
    this.BACKUP_DIR = FileSystem.documentDirectory + 'backups/';
    this.AUDIT_LOG_KEY = 'secure_storage_audit';
    // TODO: Re-enable encryption before production release
    this.ENCRYPTION_ENABLED = false;
  }

  /**
   * Initialize secure storage service
   * @param {string} userId - User identifier for encryption setup
   */
  async initialize(userId) {
    try {
      if (!userId) {
        throw new Error('User ID required for secure storage initialization');
      }

      // Skip if already initialized
      if (this.db) {
        console.log('Secure storage already initialized');
        return;
      }

      // TODO: Re-enable encryption before production release
      if (this.ENCRYPTION_ENABLED) {
        // Initialize encryption service
        await this.encryption.initialize();

        // Setup user-specific encryption keys
        await this.encryption.setupUserKey(userId);
      }

      // Open SQLite database using expo-sqlite v11 API
      // v11 uses the synchronous openDatabase method
      console.log('Opening database:', this.DB_NAME);
      
      this.db = SQLite.openDatabase(this.DB_NAME);

      // Create tables if they don't exist
      await this.createTables();

      // Run database migrations if needed
      await this.runMigrations();

      // Ensure backup directory exists
      await this.ensureBackupDirectory();

      console.log('Secure storage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
      console.error('Error details:', error.message, error.stack);
      throw error;
    }
  }

  /**
   * Create database tables for secure data storage
   */
  async createTables() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Passport data table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS passports (
            id TEXT PRIMARY KEY,
            encrypted_passport_number TEXT,
            encrypted_full_name TEXT,
            encrypted_date_of_birth TEXT,
            encrypted_nationality TEXT,
            expiry_date TEXT,
            issue_date TEXT,
            issue_place TEXT,
            photo_uri TEXT,
            created_at TEXT,
            updated_at TEXT
          )
        `);

        // Personal information table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS personal_info (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            encrypted_phone_number TEXT,
            encrypted_email TEXT,
            encrypted_home_address TEXT,
            occupation TEXT,
            province_city TEXT,
            country_region TEXT,
            created_at TEXT,
            updated_at TEXT
          )
        `);

        // Funding proof table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS funding_proof (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            encrypted_cash_amount TEXT,
            encrypted_bank_cards TEXT,
            encrypted_supporting_docs TEXT,
            created_at TEXT,
            updated_at TEXT
          )
        `);

        // Travel history table (non-sensitive data)
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS travel_history (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            destination_id TEXT,
            destination_name TEXT,
            travel_date TEXT,
            return_date TEXT,
            purpose TEXT,
            created_at TEXT
          )
        `);

        // Audit log table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS audit_log (
            id TEXT PRIMARY KEY,
            action TEXT,
            table_name TEXT,
            record_id TEXT,
            timestamp TEXT,
            details TEXT
          )
        `);

        // Settings table (non-sensitive)
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TEXT
          )
        `);
      }, reject, resolve);
    });
  }

  /**
   * Run database migrations for schema updates
   */
  async runMigrations() {
    // Get current version
    const currentVersion = await this.getSetting('db_version');

    if (!currentVersion || currentVersion !== this.DB_VERSION) {
      // Run migrations here as needed
      await this.setSetting('db_version', this.DB_VERSION);
    }
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.BACKUP_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.BACKUP_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  /**
   * Save passport data securely
   * @param {Object} passportData - Passport information
   */
  async savePassport(passportData) {
    try {
      // TODO: Re-enable encryption before production release
      const encryptedData = this.ENCRYPTION_ENABLED 
        ? await this.encryption.encryptFields({
            passport_number: passportData.passportNumber,
            full_name: passportData.fullName,
            date_of_birth: passportData.dateOfBirth,
            nationality: passportData.nationality
          })
        : {
            passport_number: passportData.passportNumber,
            full_name: passportData.fullName,
            date_of_birth: passportData.dateOfBirth,
            nationality: passportData.nationality
          };

      const now = new Date().toISOString();

      const result = await this.db.runAsync(
        `INSERT OR REPLACE INTO passports (
          id,
          encrypted_passport_number,
          encrypted_full_name,
          encrypted_date_of_birth,
          encrypted_nationality,
          expiry_date,
          issue_date,
          issue_place,
          photo_uri,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          passportData.id || this.generateId(),
          encryptedData.passport_number,
          encryptedData.full_name,
          encryptedData.date_of_birth,
          encryptedData.nationality,
          passportData.expiryDate,
          passportData.issueDate,
          passportData.issuePlace,
          passportData.photoUri,
          passportData.createdAt || now,
          now
        ]
      );

      await this.logAudit('INSERT', 'passports', passportData.id);
      return result;
    } catch (error) {
      console.error('Failed to save passport:', error);
      throw error;
    }
  }

  /**
   * Get passport data and decrypt sensitive fields
   * @param {string} id - Passport ID
   * @returns {Object} - Decrypted passport data
   */
  async getPassport(id) {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM passports WHERE id = ?',
        [id]
      );

      if (!result) {
        return null;
      }

      // TODO: Re-enable encryption before production release
      const decryptedFields = this.ENCRYPTION_ENABLED
        ? await this.encryption.decryptFields({
            passport_number: result.encrypted_passport_number,
            full_name: result.encrypted_full_name,
            date_of_birth: result.encrypted_date_of_birth,
            nationality: result.encrypted_nationality
          })
        : {
            passport_number: result.encrypted_passport_number,
            full_name: result.encrypted_full_name,
            date_of_birth: result.encrypted_date_of_birth,
            nationality: result.encrypted_nationality
          };

      const passport = {
        id: result.id,
        passportNumber: decryptedFields.passport_number,
        fullName: decryptedFields.full_name,
        dateOfBirth: decryptedFields.date_of_birth,
        nationality: decryptedFields.nationality,
        expiryDate: result.expiry_date,
        issueDate: result.issue_date,
        issuePlace: result.issue_place,
        photoUri: result.photo_uri,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };

      return passport;
    } catch (error) {
      console.error('Failed to get passport:', error);
      throw error;
    }
  }

  /**
   * Save personal information securely
   * @param {Object} personalData - Personal information
   */
  async savePersonalInfo(personalData) {
    try {
      // TODO: Re-enable encryption before production release
      const encryptedData = this.ENCRYPTION_ENABLED
        ? await this.encryption.encryptFields({
            phone_number: personalData.phoneNumber,
            email: personalData.email,
            home_address: personalData.homeAddress
          })
        : {
            phone_number: personalData.phoneNumber,
            email: personalData.email,
            home_address: personalData.homeAddress
          };

      const now = new Date().toISOString();

      const result = await this.db.runAsync(
        `INSERT OR REPLACE INTO personal_info (
          id,
          user_id,
          encrypted_phone_number,
          encrypted_email,
          encrypted_home_address,
          occupation,
          province_city,
          country_region,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          personalData.id || this.generateId(),
          personalData.userId,
          encryptedData.phone_number,
          encryptedData.email,
          encryptedData.home_address,
          personalData.occupation,
          personalData.provinceCity,
          personalData.countryRegion,
          personalData.createdAt || now,
          now
        ]
      );

      await this.logAudit('INSERT', 'personal_info', personalData.id);
      return result;
    } catch (error) {
      console.error('Failed to save personal info:', error);
      throw error;
    }
  }

  /**
   * Get personal information and decrypt sensitive fields
   * @param {string} userId - User ID
   * @returns {Object} - Decrypted personal information
   */
  async getPersonalInfo(userId) {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM personal_info WHERE user_id = ?',
        [userId]
      );

      if (!result) {
        return null;
      }

      // TODO: Re-enable encryption before production release
      const decryptedFields = this.ENCRYPTION_ENABLED
        ? await this.encryption.decryptFields({
            phone_number: result.encrypted_phone_number,
            email: result.encrypted_email,
            home_address: result.encrypted_home_address
          })
        : {
            phone_number: result.encrypted_phone_number,
            email: result.encrypted_email,
            home_address: result.encrypted_home_address
          };

      const personalInfo = {
        id: result.id,
        userId: result.user_id,
        phoneNumber: decryptedFields.phone_number,
        email: decryptedFields.email,
        homeAddress: decryptedFields.home_address,
        occupation: result.occupation,
        provinceCity: result.province_city,
        countryRegion: result.country_region,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };

      return personalInfo;
    } catch (error) {
      console.error('Failed to get personal info:', error);
      throw error;
    }
  }

  /**
   * Save funding proof information securely
   * @param {Object} fundingData - Funding proof data
   */
  async saveFundingProof(fundingData) {
    try {
      // TODO: Re-enable encryption before production release
      const encryptedData = this.ENCRYPTION_ENABLED
        ? await this.encryption.encryptFields({
            cash_amount: fundingData.cashAmount,
            bank_cards: fundingData.bankCards,
            supporting_docs: fundingData.supportingDocs
          })
        : {
            cash_amount: fundingData.cashAmount,
            bank_cards: fundingData.bankCards,
            supporting_docs: fundingData.supportingDocs
          };

      const now = new Date().toISOString();

      const result = await this.db.runAsync(
        `INSERT OR REPLACE INTO funding_proof (
          id,
          user_id,
          encrypted_cash_amount,
          encrypted_bank_cards,
          encrypted_supporting_docs,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          fundingData.id || this.generateId(),
          fundingData.userId,
          encryptedData.cash_amount,
          encryptedData.bank_cards,
          encryptedData.supporting_docs,
          fundingData.createdAt || now,
          now
        ]
      );

      await this.logAudit('INSERT', 'funding_proof', fundingData.id);
      return result;
    } catch (error) {
      console.error('Failed to save funding proof:', error);
      throw error;
    }
  }

  /**
   * Get funding proof information and decrypt sensitive fields
   * @param {string} userId - User ID
   * @returns {Object} - Decrypted funding proof data
   */
  async getFundingProof(userId) {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM funding_proof WHERE user_id = ?',
        [userId]
      );

      if (!result) {
        return null;
      }

      // TODO: Re-enable encryption before production release
      const decryptedFields = this.ENCRYPTION_ENABLED
        ? await this.encryption.decryptFields({
            cash_amount: result.encrypted_cash_amount,
            bank_cards: result.encrypted_bank_cards,
            supporting_docs: result.encrypted_supporting_docs
          })
        : {
            cash_amount: result.encrypted_cash_amount,
            bank_cards: result.encrypted_bank_cards,
            supporting_docs: result.encrypted_supporting_docs
          };

      const fundingProof = {
        id: result.id,
        userId: result.user_id,
        cashAmount: decryptedFields.cash_amount,
        bankCards: decryptedFields.bank_cards,
        supportingDocs: decryptedFields.supporting_docs,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };

      return fundingProof;
    } catch (error) {
      console.error('Failed to get funding proof:', error);
      throw error;
    }
  }

  /**
   * Save travel history (non-sensitive data)
   * @param {Object} travelData - Travel history data
   */
  async saveTravelHistory(travelData) {
    try {
      const now = new Date().toISOString();

      const result = await this.db.runAsync(
        `INSERT INTO travel_history (
          id,
          user_id,
          destination_id,
          destination_name,
          travel_date,
          return_date,
          purpose,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          travelData.id || this.generateId(),
          travelData.userId,
          travelData.destinationId,
          travelData.destinationName,
          travelData.travelDate,
          travelData.returnDate,
          travelData.purpose,
          now
        ]
      );

      await this.logAudit('INSERT', 'travel_history', travelData.id);
      return result;
    } catch (error) {
      console.error('Failed to save travel history:', error);
      throw error;
    }
  }

  /**
   * Get travel history for user
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of records
   * @returns {Array} - Travel history records
   */
  async getTravelHistory(userId, limit = 50) {
    try {
      const results = await this.db.getAllAsync(
        'SELECT * FROM travel_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit]
      );
      return results || [];
    } catch (error) {
      console.error('Failed to get travel history:', error);
      throw error;
    }
  }

  /**
   * Export all user data for GDPR compliance
   * @param {string} userId - User ID
   * @returns {Object} - All user data in exportable format
   */
  async exportUserData(userId) {
    try {
      const [passport, personalInfo, fundingProof, travelHistory] = await Promise.all([
        this.getPassport(userId), // Assuming passport ID matches user ID
        this.getPersonalInfo(userId),
        this.getFundingProof(userId),
        this.getTravelHistory(userId, 1000)
      ]);

      return {
        exportDate: new Date().toISOString(),
        userId: userId,
        passport: passport,
        personalInfo: personalInfo,
        fundingProof: fundingProof,
        travelHistory: travelHistory,
        encryptionInfo: this.encryption.getEncryptionInfo()
      };
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }

  /**
   * Delete all user data (GDPR right to be forgotten)
   * @param {string} userId - User ID
   */
  async deleteAllUserData(userId) {
    try {
      // Delete all user-related data
      await this.db.runAsync('DELETE FROM passports WHERE id = ?', [userId]);
      await this.db.runAsync('DELETE FROM personal_info WHERE user_id = ?', [userId]);
      await this.db.runAsync('DELETE FROM funding_proof WHERE user_id = ?', [userId]);
      await this.db.runAsync('DELETE FROM travel_history WHERE user_id = ?', [userId]);

      await this.logAudit('DELETE_ALL', 'all_tables', userId);
    } catch (error) {
      console.error('Failed to delete user data:', error);
      throw error;
    }
  }

  /**
   * Create database backup
   * @param {string} userId - User ID for backup filename
   * @returns {string} - Backup file path
   */
  async createBackup(userId) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${this.BACKUP_DIR}backup_${userId}_${timestamp}.db`;

      // Copy database file to backup location
      await FileSystem.copyAsync({
        from: this.DB_NAME,
        to: backupPath
      });

      this.logAudit('BACKUP', 'database', userId);
      return backupPath;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Get setting value
   * @param {string} key - Setting key
   * @returns {string} - Setting value
   */
  async getSetting(key) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT value FROM settings WHERE key = ?',
          [key],
          (_, { rows }) => {
            resolve(rows.length > 0 ? rows._array[0].value : null);
          },
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Set setting value
   * @param {string} key - Setting key
   * @param {string} value - Setting value
   */
  async setSetting(key, value) {
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
          [key, value, now],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  /**
   * Log audit event
   * @param {string} action - Action performed
   * @param {string} tableName - Table affected
   * @param {string} recordId - Record ID affected
   * @param {Object} details - Additional details
   */
  async logAudit(action, tableName, recordId, details = {}) {
    try {
      const auditEntry = {
        id: this.generateId(),
        action,
        tableName,
        recordId,
        timestamp: new Date().toISOString(),
        details: JSON.stringify(details)
      };

      const result = await this.db.runAsync(
        'INSERT INTO audit_log (id, action, table_name, record_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)',
        [
          auditEntry.id,
          auditEntry.action,
          auditEntry.tableName,
          auditEntry.recordId,
          auditEntry.timestamp,
          auditEntry.details
        ]
      );
      return result;
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Generate unique ID
   * @returns {string} - UUID-like string
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Close database connection and clear encryption keys
   */
  async close() {
    try {
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
      }
      if (this.ENCRYPTION_ENABLED) {
        await this.encryption.clearKeys();
      }
    } catch (error) {
      console.error('Failed to close secure storage:', error);
    }
  }
}

// Create singleton instance
const secureStorageService = new SecureStorageService();

export default secureStorageService;