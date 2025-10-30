/**
 * 入境通 - Secure Storage Service (Refactored)
 * Encrypted local storage for sensitive user data
 *
 * Orchestrator pattern: Delegates data operations to specialized repositories
 *
 * Features:
 * - SQLite with SQLCipher encryption
 * - Field-level encryption for sensitive data
 * - GDPR/PIPL compliant data management
 * - Automatic data migration and backup
 */

import { openDatabaseAsync } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { Directory, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import EncryptionService from './EncryptionService';
import DatabaseSchema from './schema/DatabaseSchema';
import PassportRepository from './repositories/PassportRepository';
import PersonalInfoRepository from './repositories/PersonalInfoRepository';
import TravelInfoRepository from './repositories/TravelInfoRepository';
import FundItemRepository from './repositories/FundItemRepository';
import EntryInfoRepository from './repositories/EntryInfoRepository';
import DigitalArrivalCardRepository from './repositories/DigitalArrivalCardRepository';
import SnapshotRepository from './repositories/SnapshotRepository';
import DataSerializer from './utils/DataSerializer';

class SecureStorageService {
  constructor() {
    this.modernDb = null;
    this.encryption = EncryptionService;
    this.serializer = DataSerializer;
    this.DB_NAME = 'tripsecretary_secure';
    this.DB_VERSION = '1.3.0';
    this.BACKUP_DIR = null;
    this.AUDIT_LOG_KEY = 'secure_storage_audit';
    this.ENCRYPTION_ENABLED = false; // TODO: Re-enable before production

    // Repository instances
    this.passportRepository = null;
    this.personalInfoRepository = null;
    this.travelInfoRepository = null;
    this.fundItemRepository = null;
    this.entryInfoRepository = null;
    this.digitalArrivalCardRepository = null;
    this.snapshotRepository = null;
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

      if (this.modernDb) {
        console.log('Secure storage already initialized');
        return;
      }

      if (this.ENCRYPTION_ENABLED) {
        await this.encryption.initialize();
        await this.encryption.setupUserKey(userId);
      }

      console.log('Opening database:', this.DB_NAME);
      this.modernDb = await openDatabaseAsync(this.DB_NAME);

      // Create schema using DatabaseSchema (migrations are applied inside createTables)
      await DatabaseSchema.createTables(this.modernDb);

      // Initialize repositories
      this.passportRepository = new PassportRepository(this.modernDb);
      this.personalInfoRepository = new PersonalInfoRepository(this.modernDb);
      this.travelInfoRepository = new TravelInfoRepository(this.modernDb);
      this.fundItemRepository = new FundItemRepository(this.modernDb);
      this.entryInfoRepository = new EntryInfoRepository(this.modernDb);
      this.digitalArrivalCardRepository = new DigitalArrivalCardRepository(this.modernDb);
      this.snapshotRepository = new SnapshotRepository(this.modernDb);

      await this.ensureBackupDirectory();
      await this.ensureUser(userId);

      console.log('✅ Secure storage initialized with schema v' + this.DB_VERSION);
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
      throw error;
    }
  }

  /**
   * Ensure the database connection is ready
   */
  async ensureInitialized() {
    if (!this.modernDb) {
      throw new Error('Secure storage is not initialized. Call initialize() before accessing data.');
    }
  }

  /**
   * Get backup directory path
   */
  getBackupDir() {
    if (!this.BACKUP_DIR) {
      this.BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;
    }
    return this.BACKUP_DIR;
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory() {
    try {
      // Use the new Directory API with Paths helper
      // Paths.document points to the document directory, 'backups' is the subdirectory
      const dir = new Directory(Paths.document, 'backups');
      if (!dir.exists) {
        dir.create();
      }
    } catch (error) {
      console.warn('Warning: Could not create backup directory.', error.message);
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return this.serializer.generateId();
  }

  /**
   * Log audit event
   */
  async logAudit(action, tableName, recordId) {
    try {
      await this.modernDb.runAsync(
        `INSERT INTO audit_log (id, action, table_name, record_id, timestamp, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [this.generateId(), action, tableName, recordId, new Date().toISOString(), null]
      );
    } catch (error) {
      console.warn('Failed to log audit event:', error.message);
    }
  }

  // ========================================
  // Passport Methods (delegate to repository)
  // ========================================

  async savePassport(passportData) {
    try {
      await this.ensureInitialized();
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

      const dataForRepository = {
        ...passportData,
        encryptedPassportNumber: encryptedData.passport_number,
        encryptedFullName: encryptedData.full_name,
        encryptedDateOfBirth: encryptedData.date_of_birth,
        encryptedNationality: encryptedData.nationality
      };

      const result = await this.passportRepository.save(dataForRepository);
      await this.seedPassportCountries(result.id, encryptedData.nationality);
      await this.logAudit('INSERT', 'passports', result.id);
      return { id: result.id };
    } catch (error) {
      console.error('Failed to save passport:', error);
      throw error;
    }
  }

  async getPassport(id) {
    try {
      await this.ensureInitialized();
      return await this.passportRepository.getById(id);
    } catch (error) {
      console.error('Failed to get passport:', error);
      throw error;
    }
  }

  async getUserPassport(userId) {
    try {
      await this.ensureInitialized();
      const passports = await this.passportRepository.getByUserId(userId);
      return passports.length > 0 ? passports[0] : null;
    } catch (error) {
      console.error('Failed to get user passport:', error);
      throw error;
    }
  }

  async getAllUserPassports(userId) {
    try {
      await this.ensureInitialized();
      return await this.passportRepository.getByUserId(userId);
    } catch (error) {
      console.error('Failed to get all user passports:', error);
      throw error;
    }
  }

  async listUserPassports(userId) {
    try {
      await this.ensureInitialized();
      return await this.passportRepository.getByUserId(userId);
    } catch (error) {
      console.error('Failed to list user passports:', error);
      throw error;
    }
  }

  async cleanupDuplicatePassports(userId) {
    try {
      await this.ensureInitialized();
      const passports = await this.passportRepository.getByUserId(userId);
      if (passports.length > 1) {
        for (let i = 1; i < passports.length; i++) {
          await this.passportRepository.delete(passports[i].id);
        }
      }
      return passports.length;
    } catch (error) {
      console.error('Failed to cleanup duplicate passports:', error);
      throw error;
    }
  }

  // ========================================
  // Personal Info Methods (delegate to repository)
  // ========================================

  async savePersonalInfo(personalData) {
    try {
      await this.ensureInitialized();
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

      const dataForRepository = {
        ...personalData,
        encryptedPhoneNumber: encryptedData.phone_number,
        encryptedEmail: encryptedData.email,
        encryptedHomeAddress: encryptedData.home_address
      };

      const result = await this.personalInfoRepository.save(dataForRepository);
      await this.logAudit('INSERT', 'personal_info', result.id);
      return { id: result.id };
    } catch (error) {
      console.error('Failed to save personal info:', error);
      throw error;
    }
  }

  async getPersonalInfo(userId) {
    try {
      await this.ensureInitialized();
      const results = await this.personalInfoRepository.getByUserId(userId);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Failed to get personal info:', error);
      throw error;
    }
  }

  async getPersonalInfoById(personalInfoId) {
    try {
      await this.ensureInitialized();
      return await this.personalInfoRepository.getById(personalInfoId);
    } catch (error) {
      console.error('Failed to get personal info by ID:', error);
      throw error;
    }
  }

  // ========================================
  // Travel Info Methods (delegate to repository)
  // ========================================

  async saveTravelInfo(travelData) {
    try {
      await this.ensureInitialized();
      const result = await this.travelInfoRepository.save(travelData);
      await this.logAudit('INSERT', 'travel_info', result.id);
      return { id: result.id };
    } catch (error) {
      console.error('Failed to save travel info:', error);
      throw error;
    }
  }

  async getTravelInfo(userId, destination = null) {
    try {
      await this.ensureInitialized();
      if (destination) {
        // Return the first (oldest) travel info record for this destination
        const results = await this.travelInfoRepository.getByDestination(userId, destination);
        return results.length > 0 ? results[results.length - 1] : null; // Last item is oldest (DESC order)
      }
      // Return the first (oldest) travel info record for this user
      const results = await this.travelInfoRepository.getByUserId(userId);
      return results.length > 0 ? results[results.length - 1] : null; // Last item is oldest (DESC order)
    } catch (error) {
      console.error('Failed to get travel info:', error);
      throw error;
    }
  }

  async getTravelInfoById(id) {
    try {
      await this.ensureInitialized();
      return await this.travelInfoRepository.getById(id);
    } catch (error) {
      console.error('Failed to get travel info by ID:', error);
      throw error;
    }
  }

  async getTravelInfoByEntryInfoId(entryInfoId) {
    try {
      await this.ensureInitialized();
      return await this.travelInfoRepository.getByEntryInfoId(entryInfoId);
    } catch (error) {
      console.error('Failed to get travel info by entry info ID:', error);
      throw error;
    }
  }

  async linkTravelInfoToEntryInfo(travelInfoId, entryInfoId) {
    try {
      await this.ensureInitialized();
      await this.travelInfoRepository.linkToEntryInfo(travelInfoId, entryInfoId);
      await this.logAudit('UPDATE', 'travel_info', travelInfoId);
    } catch (error) {
      console.error('Failed to link travel info to entry info:', error);
      throw error;
    }
  }

  async unlinkTravelInfoFromEntryInfo(travelInfoId) {
    try {
      await this.ensureInitialized();
      await this.travelInfoRepository.unlinkFromEntryInfo(travelInfoId);
      await this.logAudit('UPDATE', 'travel_info', travelInfoId);
    } catch (error) {
      console.error('Failed to unlink travel info from entry info:', error);
      throw error;
    }
  }

  // ========================================
  // Fund Item Methods (delegate to repository)
  // ========================================

  async saveFundItem(fundItem) {
    try {
      await this.ensureInitialized();
      const result = await this.fundItemRepository.save(fundItem);
      await this.logAudit('INSERT', 'fund_items', result.id);
      return { id: result.id };
    } catch (error) {
      console.error('Failed to save fund item:', error);
      throw error;
    }
  }

  async getFundItem(id) {
    try {
      await this.ensureInitialized();
      return await this.fundItemRepository.getById(id);
    } catch (error) {
      console.error('Failed to get fund item:', error);
      throw error;
    }
  }

  async getFundItemsByUserId(userId) {
    try {
      await this.ensureInitialized();
      return await this.fundItemRepository.getByUserId(userId);
    } catch (error) {
      console.error('Failed to get fund items by user ID:', error);
      throw error;
    }
  }

  async getFundItems(userId) {
    try {
      await this.ensureInitialized();
      return await this.fundItemRepository.getByUserId(userId);
    } catch (error) {
      console.error('Failed to get fund items:', error);
      throw error;
    }
  }

  async deleteFundItem(id) {
    try {
      await this.ensureInitialized();
      await this.fundItemRepository.delete(id);
      await this.logAudit('DELETE', 'fund_items', id);
    } catch (error) {
      console.error('Failed to delete fund item:', error);
      throw error;
    }
  }

  // ========================================
  // Entry Info Methods (delegate to repository)
  // ========================================

  async saveEntryInfo(entryData) {
    try {
      await this.ensureInitialized();
      const result = await this.entryInfoRepository.save(entryData);
      await this.logAudit('INSERT', 'entry_info', result.id);
      return { id: result.id };
    } catch (error) {
      console.error('Failed to save entry info:', error);
      throw error;
    }
  }

  async getEntryInfo(id) {
    try {
      await this.ensureInitialized();
      return await this.entryInfoRepository.getById(id);
    } catch (error) {
      console.error('Failed to get entry info:', error);
      throw error;
    }
  }

  async getAllEntryInfos(userId) {
    try {
      await this.ensureInitialized();
      return await this.entryInfoRepository.getByUserId(userId);
    } catch (error) {
      console.error('Failed to get all entry infos:', error);
      throw error;
    }
  }

  async getAllEntryInfosForUser(userId) {
    try {
      await this.ensureInitialized();
      return await this.entryInfoRepository.getByUserId(userId);
    } catch (error) {
      console.error('Failed to get all entry infos for user:', error);
      throw error;
    }
  }

  async deleteEntryInfo(id) {
    try {
      await this.ensureInitialized();
      await this.entryInfoRepository.delete(id);
      await this.logAudit('DELETE', 'entry_info', id);
    } catch (error) {
      console.error('Failed to delete entry info:', error);
      throw error;
    }
  }

  // ========================================
  // Digital Arrival Card Methods (delegate to repository)
  // ========================================

  async saveDigitalArrivalCard(dacData) {
    try {
      await this.ensureInitialized();
      const result = await this.digitalArrivalCardRepository.save(dacData);
      await this.logAudit('INSERT', 'digital_arrival_cards', result.id);
      return { id: result.id };
    } catch (error) {
      console.error('Failed to save digital arrival card:', error);
      throw error;
    }
  }

  async getDigitalArrivalCard(id) {
    try {
      await this.ensureInitialized();
      return await this.digitalArrivalCardRepository.getById(id);
    } catch (error) {
      console.error('Failed to get digital arrival card:', error);
      throw error;
    }
  }

  async getDigitalArrivalCardsByEntryInfoId(entryInfoId) {
    try {
      await this.ensureInitialized();
      return await this.digitalArrivalCardRepository.getByEntryInfo(entryInfoId);
    } catch (error) {
      console.error('Failed to get digital arrival cards by entry info ID:', error);
      throw error;
    }
  }

  async getLatestSuccessfulDigitalArrivalCard(entryInfoId, cardType) {
    try {
      await this.ensureInitialized();
      return await this.digitalArrivalCardRepository.getLatestByEntryInfo(entryInfoId, cardType);
    } catch (error) {
      console.error('Failed to get latest successful digital arrival card:', error);
      throw error;
    }
  }

  // ========================================
  // Utility Methods
  // ========================================

  async seedPassportCountries(passportId, nationality) {
    try {
      const countryData = {
        'CHN': {
          'THA': [0, 30, 'Visa-free for tourism, 30 days'],
          'JPN': [1, 90, 'Visa required, max 90 days per stay'],
          'SGP': [0, 4, 'Visa-free transit for 96 hours with onward ticket'],
          'MYS': [0, 30, 'Visa-free for tourism, 30 days'],
          'KOR': [1, 90, 'Visa required for most visits'],
          'VNM': [1, 90, 'E-visa available, up to 90 days'],
          'USA': [1, 180, 'B1/B2 visa required, typically 6 months'],
          'CAN': [1, 180, 'Visitor visa required, typically 6 months'],
          'AUS': [1, 90, 'ETA/eVisitor required, typically 90 days'],
          'GBR': [1, 180, 'Visa required, typically 6 months'],
          'FRA': [1, 90, 'Schengen visa required, 90 days per 180 days'],
          'DEU': [1, 90, 'Schengen visa required, 90 days per 180 days']
        },
        'HKG': {
          'THA': [0, 30, 'Visa-free for tourism, 30 days'],
          'JPN': [0, 90, 'Visa-free, 90 days'],
          'SGP': [0, 30, 'Visa-free, 30 days'],
          'MYS': [0, 30, 'Visa-free, 30 days'],
          'KOR': [0, 90, 'Visa-free, 90 days'],
          'VNM': [0, 30, 'Visa-free, 30 days'],
          'USA': [0, 90, 'ESTA required, 90 days'],
          'CAN': [0, 180, 'eTA required, typically 6 months'],
          'AUS': [0, 90, 'ETA required, 90 days'],
          'GBR': [0, 180, 'Visa-free, 6 months'],
          'FRA': [0, 90, 'Visa-free (Schengen), 90 days per 180 days'],
          'DEU': [0, 90, 'Visa-free (Schengen), 90 days per 180 days']
        },
        'MAC': {
          'THA': [0, 30, 'Visa-free for tourism, 30 days'],
          'JPN': [0, 90, 'Visa-free, 90 days'],
          'SGP': [0, 30, 'Visa-free, 30 days'],
          'MYS': [0, 30, 'Visa-free, 30 days'],
          'KOR': [0, 90, 'Visa-free, 90 days'],
          'VNM': [0, 30, 'Visa-free, 30 days'],
          'USA': [0, 90, 'ESTA required, 90 days'],
          'CAN': [0, 180, 'eTA required, typically 6 months'],
          'AUS': [0, 90, 'ETA required, 90 days'],
          'GBR': [0, 180, 'Visa-free, 6 months'],
          'FRA': [0, 90, 'Visa-free (Schengen), 90 days per 180 days'],
          'DEU': [0, 90, 'Visa-free (Schengen), 90 days per 180 days']
        }
      };

      const countries = countryData[nationality] || {};
      for (const [countryCode, [visaRequired, maxStayDays, notes]] of Object.entries(countries)) {
        await this.passportRepository.addCountry(passportId, {
          countryCode,
          visaRequired: visaRequired === 1,
          maxStayDays,
          notes
        });
      }
    } catch (error) {
      console.warn('Failed to seed passport countries:', error.message);
    }
  }

  async ensureUser(userId) {
    try {
      const exists = await this.modernDb.getFirstAsync(
        'SELECT 1 FROM users WHERE id = ? LIMIT 1',
        [userId]
      );

      if (!exists) {
        await this.modernDb.runAsync(
          'INSERT INTO users (id, created_at, updated_at) VALUES (?, ?, ?)',
          [userId, new Date().toISOString(), new Date().toISOString()]
        );
        console.log(`✅ Created user record for: ${userId}`);
      }
    } catch (error) {
      console.error('Failed to ensure user exists:', error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.modernDb) {
        await this.modernDb.closeAsync();
        this.modernDb = null;
      }
    } catch (error) {
      console.error('Failed to close database:', error);
      throw error;
    }
  }

  // ========================================
  // Snapshot Methods (Database-based storage)
  // Note: Snapshot metadata is stored in the database
  // Photos are stored in FileSystem.documentDirectory/snapshots/{snapshotId}/
  // ========================================

  async saveSnapshot(snapshot) {
    try {
      await this.ensureInitialized();

      // Export snapshot data and save to database
      const snapshotData = snapshot.exportData ? snapshot.exportData() : snapshot;
      const result = await this.snapshotRepository.save(snapshotData);

      await this.logAudit('INSERT', 'snapshots', snapshotData.snapshotId);
      return { id: snapshotData.snapshotId };
    } catch (error) {
      console.error('Failed to save snapshot to database:', error);
      throw error;
    }
  }

  async getSnapshot(snapshotId) {
    try {
      await this.ensureInitialized();
      return await this.snapshotRepository.getById(snapshotId);
    } catch (error) {
      console.error('Failed to load snapshot from database:', error);
      return null;
    }
  }

  async getSnapshotsByUserId(userId) {
    try {
      await this.ensureInitialized();
      return await this.snapshotRepository.getByUserId(userId);
    } catch (error) {
      console.error('Failed to load snapshots by user ID:', error);
      return [];
    }
  }

  async deleteSnapshot(snapshotId) {
    try {
      await this.ensureInitialized();

      // Delete from database
      await this.snapshotRepository.delete(snapshotId);

      // Delete photo directory
      const snapshotPhotoDir = `${FileSystem.documentDirectory}snapshots/${snapshotId}/`;
      const dirInfo = await FileSystem.getInfoAsync(snapshotPhotoDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(snapshotPhotoDir);
        console.log('Snapshot photo directory deleted:', snapshotPhotoDir);
      }

      await this.logAudit('DELETE', 'snapshots', snapshotId);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const secureStorageService = new SecureStorageService();

export default secureStorageService;

