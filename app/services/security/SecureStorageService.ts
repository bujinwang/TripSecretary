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

// Type definitions
// SQLiteDatabase type from expo-sqlite
interface SQLiteDatabase {
  runAsync(query: string, params?: any[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getAllAsync(query: string, params?: any[]): Promise<any[]>;
  getFirstAsync(query: string, params?: any[]): Promise<any | null>;
  closeAsync(): Promise<void>;
  execAsync(query: string): Promise<void>;
  withTransactionAsync<T>(callback: () => Promise<T>): Promise<T>;
}

interface SaveResult {
  id: string;
}

interface DeleteSnapshotResult {
  success: boolean;
  error?: string;
}

interface CountryData {
  [countryCode: string]: [number, number, string]; // [visaRequired, maxStayDays, notes]
}

interface PassportData {
  id?: string;
  userId: string;
  passportNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  gender?: string;
  expiryDate?: string;
  issueDate?: string;
  issuePlace?: string;
  photoUri?: string;
  isPrimary?: boolean;
  createdAt?: string;
  encryptedPassportNumber?: string;
  encryptedFullName?: string;
  encryptedDateOfBirth?: string;
  encryptedNationality?: string;
}

interface PersonalInfoData {
  id?: string;
  userId: string;
  phoneNumber?: string;
  email?: string;
  homeAddress?: string;
  encryptedPhoneNumber?: string;
  encryptedEmail?: string;
  encryptedHomeAddress?: string;
  [key: string]: any;
}

interface TravelInfoData {
  id?: string;
  userId: string;
  destination?: string;
  entryInfoId?: string;
  [key: string]: any;
}

interface FundItemData {
  id?: string;
  userId: string;
  [key: string]: any;
}

interface EntryInfoData {
  id?: string;
  userId: string;
  [key: string]: any;
}

interface DigitalArrivalCardData {
  id?: string;
  entryInfoId: string;
  cardType?: string;
  [key: string]: any;
}

interface SnapshotData {
  snapshotId?: string;
  userId?: string;
  exportData?: () => any;
  [key: string]: any;
}

class SecureStorageService {
  private modernDb: SQLiteDatabase | null = null;
  private readonly encryption: typeof EncryptionService = EncryptionService;
  private readonly serializer: typeof DataSerializer = DataSerializer;
  private readonly DB_NAME: string = 'tripsecretary_secure';
  private readonly DB_VERSION: string = '1.3.0';
  private BACKUP_DIR: string | null = null;
  private readonly AUDIT_LOG_KEY: string = 'secure_storage_audit';
  private readonly ENCRYPTION_ENABLED: boolean = false; // TODO: Re-enable before production

  // Repository instances
  private passportRepository: PassportRepository | null = null;
  private personalInfoRepository: PersonalInfoRepository | null = null;
  private travelInfoRepository: TravelInfoRepository | null = null;
  private fundItemRepository: FundItemRepository | null = null;
  private entryInfoRepository: EntryInfoRepository | null = null;
  private digitalArrivalCardRepository: DigitalArrivalCardRepository | null = null;
  private snapshotRepository: SnapshotRepository | null = null;

  /**
   * Initialize secure storage service
   */
  async initialize(userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User ID required for secure storage initialization');
      }

      if (this.modernDb) {
        console.log('Secure storage already initialized');
        // Force reinitialize if database file might have changed
        // This helps when database is replaced externally
        console.log('⚠️ Database connection already open. If database was replaced, you may need to restart the app.');
        return;
      }

      if (this.ENCRYPTION_ENABLED) {
        await this.encryption.initialize();
        await this.encryption.setupUserKey(userId);
      }

      console.log('Opening database:', this.DB_NAME);
      
      // Log database path for debugging
      try {
        const dbPath = `${FileSystem.documentDirectory}SQLite/${this.DB_NAME}.db`;
        console.log('Database path:', dbPath);
      } catch (e) {
        // Ignore if FileSystem is not available
      }
      
      this.modernDb = await openDatabaseAsync(this.DB_NAME) as SQLiteDatabase;

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
  async ensureInitialized(): Promise<void> {
    if (!this.modernDb) {
      throw new Error('Secure storage is not initialized. Call initialize() before accessing data.');
    }
  }

  /**
   * Get backup directory path
   */
  getBackupDir(): string {
    if (!this.BACKUP_DIR) {
      this.BACKUP_DIR = `${Paths.document}backups/`;
    }
    return this.BACKUP_DIR;
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory(): Promise<void> {
    try {
      // Use the new Directory API with Paths helper
      // Paths.document points to the document directory, 'backups' is the subdirectory
      const dir = new Directory(Paths.document, 'backups');
      if (!dir.exists) {
        dir.create();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Warning: Could not create backup directory.', errorMessage);
    }
  }

  /**
   * Generate unique ID
   */
  generateId(): string {
    return this.serializer.generateId();
  }

  /**
   * Log audit event
   */
  async logAudit(action: string, tableName: string, recordId: string): Promise<void> {
    try {
      if (!this.modernDb) {
        return;
      }
      await this.modernDb.runAsync(
        `INSERT INTO audit_log (id, action, table_name, record_id, timestamp, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [this.generateId(), action, tableName, recordId, new Date().toISOString(), null]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Failed to log audit event:', errorMessage);
    }
  }

  // ========================================
  // Passport Methods (delegate to repository)
  // ========================================

  async savePassport(passportData: PassportData): Promise<SaveResult> {
    try {
      await this.ensureInitialized();
      if (!this.passportRepository) {
        throw new Error('Passport repository not initialized');
      }

      const encryptedData = this.ENCRYPTION_ENABLED
        ? await this.encryption.encryptFields({
            passport_number: passportData.passportNumber || '',
            full_name: passportData.fullName || '',
            date_of_birth: passportData.dateOfBirth || '',
            nationality: passportData.nationality || ''
          })
        : {
            passport_number: passportData.passportNumber || '',
            full_name: passportData.fullName || '',
            date_of_birth: passportData.dateOfBirth || '',
            nationality: passportData.nationality || ''
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

  async getPassport(id: string): Promise<any> {
    try {
      await this.ensureInitialized();
      if (!this.passportRepository) {
        throw new Error('Passport repository not initialized');
      }
      return await this.passportRepository.getById(id);
    } catch (error) {
      console.error('Failed to get passport:', error);
      throw error;
    }
  }

  async getUserPassport(userId: string): Promise<any | null> {
    try {
      await this.ensureInitialized();
      if (!this.passportRepository) {
        throw new Error('Passport repository not initialized');
      }
      const passports = await this.passportRepository.getByUserId(userId);
      return passports.length > 0 ? passports[0] : null;
    } catch (error) {
      console.error('Failed to get user passport:', error);
      throw error;
    }
  }

  async getAllUserPassports(userId: string): Promise<any[]> {
    try {
      await this.ensureInitialized();
      if (!this.passportRepository) {
        throw new Error('Passport repository not initialized');
      }
      return await this.passportRepository.getByUserId(userId);
    } catch (error) {
      console.error('Failed to get all user passports:', error);
      throw error;
    }
  }

  async listUserPassports(userId: string): Promise<any[]> {
    try {
      await this.ensureInitialized();
      if (!this.passportRepository) {
        throw new Error('Passport repository not initialized');
      }
      return await this.passportRepository.getByUserId(userId);
    } catch (error) {
      console.error('Failed to list user passports:', error);
      throw error;
    }
  }

  async cleanupDuplicatePassports(userId: string): Promise<number> {
    try {
      await this.ensureInitialized();
      if (!this.passportRepository) {
        throw new Error('Passport repository not initialized');
      }
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

  async savePersonalInfo(personalData: PersonalInfoData): Promise<SaveResult> {
    try {
      await this.ensureInitialized();
      if (!this.personalInfoRepository) {
        throw new Error('Personal info repository not initialized');
      }

      const encryptedData = this.ENCRYPTION_ENABLED
        ? await this.encryption.encryptFields({
            phone_number: personalData.phoneNumber || '',
            email: personalData.email || '',
            home_address: personalData.homeAddress || ''
          })
        : {
            phone_number: personalData.phoneNumber || '',
            email: personalData.email || '',
            home_address: personalData.homeAddress || ''
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

  async getPersonalInfo(userId: string): Promise<any | null> {
    try {
      await this.ensureInitialized();
      if (!this.personalInfoRepository) {
        throw new Error('Personal info repository not initialized');
      }
      const results = await this.personalInfoRepository.getByUserId(userId);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Failed to get personal info:', error);
      throw error;
    }
  }

  async getPersonalInfoById(personalInfoId: string): Promise<any> {
    try {
      await this.ensureInitialized();
      if (!this.personalInfoRepository) {
        throw new Error('Personal info repository not initialized');
      }
      return await this.personalInfoRepository.getById(personalInfoId);
    } catch (error) {
      console.error('Failed to get personal info by ID:', error);
      throw error;
    }
  }

  // ========================================
  // Travel Info Methods (delegate to repository)
  // ========================================

  async saveTravelInfo(travelData: TravelInfoData): Promise<SaveResult> {
    try {
      await this.ensureInitialized();
      if (!this.travelInfoRepository) {
        throw new Error('Travel info repository not initialized');
      }
      const result = await this.travelInfoRepository.save(travelData);
      await this.logAudit('INSERT', 'travel_info', result.id);
      return { id: result.id };
    } catch (error) {
      console.error('Failed to save travel info:', error);
      throw error;
    }
  }

  async getTravelInfo(userId: string, destination: string | null = null): Promise<any | null> {
    try {
      await this.ensureInitialized();
      if (!this.travelInfoRepository) {
        throw new Error('Travel info repository not initialized');
      }
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

  async getTravelInfoById(id: string): Promise<any> {
    try {
      await this.ensureInitialized();
      if (!this.travelInfoRepository) {
        throw new Error('Travel info repository not initialized');
      }
      return await this.travelInfoRepository.getById(id);
    } catch (error) {
      console.error('Failed to get travel info by ID:', error);
      throw error;
    }
  }

  async getTravelInfoByEntryInfoId(entryInfoId: string): Promise<any> {
    try {
      await this.ensureInitialized();
      if (!this.travelInfoRepository) {
        throw new Error('Travel info repository not initialized');
      }
      return await this.travelInfoRepository.getByEntryInfoId(entryInfoId);
    } catch (error) {
      console.error('Failed to get travel info by entry info ID:', error);
      throw error;
    }
  }

  async linkTravelInfoToEntryInfo(travelInfoId: string, entryInfoId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      if (!this.travelInfoRepository) {
        throw new Error('Travel info repository not initialized');
      }
      await this.travelInfoRepository.linkToEntryInfo(travelInfoId, entryInfoId);
      await this.logAudit('UPDATE', 'travel_info', travelInfoId);
    } catch (error) {
      console.error('Failed to link travel info to entry info:', error);
      throw error;
    }
  }

  async unlinkTravelInfoFromEntryInfo(travelInfoId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      if (!this.travelInfoRepository) {
        throw new Error('Travel info repository not initialized');
      }
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

  async saveFundItem(fundItem: FundItemData): Promise<SaveResult> {
    try {
      await this.ensureInitialized();
      if (!this.fundItemRepository) {
        throw new Error('Fund item repository not initialized');
      }
      const result = await this.fundItemRepository.save(fundItem);
      await this.logAudit('INSERT', 'fund_items', result.id);
      return { id: result.id };
    } catch (error) {
      console.error('Failed to save fund item:', error);
      throw error;
    }
  }

  async getFundItem(id: string): Promise<any> {
    try {
      await this.ensureInitialized();
      if (!this.fundItemRepository) {
        throw new Error('Fund item repository not initialized');
      }
      return await this.fundItemRepository.getById(id);
    } catch (error) {
      console.error('Failed to get fund item:', error);
      throw error;
    }
  }

  async getFundItemsByUserId(userId: string): Promise<any[]> {
    try {
      await this.ensureInitialized();
      if (!this.fundItemRepository) {
        throw new Error('Fund item repository not initialized');
      }
      return await this.fundItemRepository.getByUserId(userId);
    } catch (error) {
      console.error('Failed to get fund items by user ID:', error);
      throw error;
    }
  }

  async getFundItems(userId: string): Promise<any[]> {
    try {
      await this.ensureInitialized();
      if (!this.fundItemRepository) {
        throw new Error('Fund item repository not initialized');
      }
      return await this.fundItemRepository.getByUserId(userId);
    } catch (error) {
      console.error('Failed to get fund items:', error);
      throw error;
    }
  }

  async deleteFundItem(id: string): Promise<void> {
    try {
      await this.ensureInitialized();
      if (!this.fundItemRepository) {
        throw new Error('Fund item repository not initialized');
      }
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

  async saveEntryInfo(entryData: EntryInfoData): Promise<SaveResult> {
    try {
      await this.ensureInitialized();
      if (!this.entryInfoRepository) {
        throw new Error('Entry info repository not initialized');
      }
      const result = await this.entryInfoRepository.save(entryData);
      await this.logAudit('INSERT', 'entry_info', result.id);
      return { id: result.id };
    } catch (error) {
      console.error('Failed to save entry info:', error);
      throw error;
    }
  }

  async getEntryInfo(idOrUserId: string, destinationId?: string): Promise<any> {
    try {
      await this.ensureInitialized();
      if (!this.entryInfoRepository) {
        throw new Error('Entry info repository not initialized');
      }
      
      // If destinationId is provided, treat first param as userId and get most recent entry for that destination
      if (destinationId !== undefined) {
        const userId = idOrUserId;
        const entries = await this.entryInfoRepository.getByDestination(userId, destinationId);
        // Return the most recent entry (already sorted by created_at DESC)
        return entries.length > 0 ? entries[0] : null;
      }
      
      // Otherwise, treat first param as entry info ID
      return await this.entryInfoRepository.getById(idOrUserId);
    } catch (error) {
      console.error('Failed to get entry info:', error);
      throw error;
    }
  }

  async getAllEntryInfos(userId: string): Promise<any[]> {
    try {
      await this.ensureInitialized();
      if (!this.entryInfoRepository) {
        throw new Error('Entry info repository not initialized');
      }
      console.log(`[SecureStorageService] Getting all entry infos for user: ${userId}`);
      const result = await this.entryInfoRepository.getByUserId(userId);
      console.log(`[SecureStorageService] Retrieved ${result.length} entry infos`);
      return result;
    } catch (error) {
      console.error('[SecureStorageService] Failed to get all entry infos:', error);
      console.error('[SecureStorageService] Error stack:', error.stack);
      throw error;
    }
  }

  async getAllEntryInfosForUser(userId: string): Promise<any[]> {
    try {
      await this.ensureInitialized();
      if (!this.entryInfoRepository) {
        throw new Error('Entry info repository not initialized');
      }
      return await this.entryInfoRepository.getByUserId(userId);
    } catch (error) {
      console.error('Failed to get all entry infos for user:', error);
      throw error;
    }
  }

  async deleteEntryInfo(id: string): Promise<void> {
    try {
      await this.ensureInitialized();
      if (!this.entryInfoRepository) {
        throw new Error('Entry info repository not initialized');
      }
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

  async saveDigitalArrivalCard(dacData: DigitalArrivalCardData): Promise<SaveResult> {
    try {
      await this.ensureInitialized();
      if (!this.digitalArrivalCardRepository) {
        throw new Error('Digital arrival card repository not initialized');
      }
      const result = await this.digitalArrivalCardRepository.save(dacData);
      await this.logAudit('INSERT', 'digital_arrival_cards', result.id);
      return { id: result.id };
    } catch (error) {
      console.error('Failed to save digital arrival card:', error);
      throw error;
    }
  }

  async getDigitalArrivalCard(id: string): Promise<any> {
    try {
      await this.ensureInitialized();
      if (!this.digitalArrivalCardRepository) {
        throw new Error('Digital arrival card repository not initialized');
      }
      return await this.digitalArrivalCardRepository.getById(id);
    } catch (error) {
      console.error('Failed to get digital arrival card:', error);
      throw error;
    }
  }

  async getDigitalArrivalCardsByEntryInfoId(entryInfoId: string): Promise<any[]> {
    try {
      await this.ensureInitialized();
      if (!this.digitalArrivalCardRepository) {
        throw new Error('Digital arrival card repository not initialized');
      }
      return await this.digitalArrivalCardRepository.getByEntryInfo(entryInfoId);
    } catch (error) {
      console.error('Failed to get digital arrival cards by entry info ID:', error);
      throw error;
    }
  }

  async getLatestSuccessfulDigitalArrivalCard(entryInfoId: string, cardType: string): Promise<any> {
    try {
      await this.ensureInitialized();
      if (!this.digitalArrivalCardRepository) {
        throw new Error('Digital arrival card repository not initialized');
      }
      return await this.digitalArrivalCardRepository.getLatestByEntryInfo(entryInfoId, cardType);
    } catch (error) {
      console.error('Failed to get latest successful digital arrival card:', error);
      throw error;
    }
  }

  // ========================================
  // Utility Methods
  // ========================================

  async seedPassportCountries(passportId: string, nationality: string): Promise<void> {
    try {
      if (!this.passportRepository) {
        return;
      }

      const countryData: Record<string, CountryData> = {
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Failed to seed passport countries:', errorMessage);
    }
  }

  async ensureUser(userId: string): Promise<void> {
    try {
      if (!this.modernDb) {
        throw new Error('Database not initialized');
      }
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

  async close(): Promise<void> {
    try {
      if (this.modernDb) {
        await this.modernDb.closeAsync();
        this.modernDb = null;
        // Also clear repository references
        this.passportRepository = null;
        this.personalInfoRepository = null;
        this.travelInfoRepository = null;
        this.fundItemRepository = null;
        this.entryInfoRepository = null;
        this.digitalArrivalCardRepository = null;
        this.snapshotRepository = null;
        console.log('Database connection closed and repositories cleared');
      }
    } catch (error) {
      console.error('Failed to close database:', error);
      // Don't throw - allow graceful degradation
    }
  }

  /**
   * Force reinitialize the database connection
   * Useful when database file has been replaced externally
   * Note: This will close the existing connection, so ensure no other operations are in progress
   */
  async forceReinitialize(userId: string): Promise<void> {
    console.log('Force reinitializing database connection...');
    try {
      await this.close();
      // Small delay to ensure all pending operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.initialize(userId);
      console.log('✅ Database connection force reinitialized successfully');
    } catch (error) {
      console.error('Failed to force reinitialize database:', error);
      // Try to reinitialize normally as fallback
      if (!this.modernDb) {
        await this.initialize(userId);
      }
      throw error;
    }
  }

  // ========================================
  // Snapshot Methods (Database-based storage)
  // Note: Snapshot metadata is stored in the database
  // Photos are stored in FileSystem.documentDirectory/snapshots/{snapshotId}/
  // ========================================

  async saveSnapshot(snapshot: SnapshotData): Promise<SaveResult> {
    try {
      await this.ensureInitialized();
      if (!this.snapshotRepository) {
        throw new Error('Snapshot repository not initialized');
      }

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

  async getSnapshot(snapshotId: string): Promise<any | null> {
    try {
      await this.ensureInitialized();
      if (!this.snapshotRepository) {
        throw new Error('Snapshot repository not initialized');
      }
      return await this.snapshotRepository.getById(snapshotId);
    } catch (error) {
      console.error('Failed to load snapshot from database:', error);
      return null;
    }
  }

  async getSnapshotsByUserId(userId: string): Promise<any[]> {
    try {
      await this.ensureInitialized();
      if (!this.snapshotRepository) {
        throw new Error('Snapshot repository not initialized');
      }
      return await this.snapshotRepository.getByUserId(userId);
    } catch (error) {
      console.error('Failed to load snapshots by user ID:', error);
      return [];
    }
  }

  async deleteSnapshot(snapshotId: string): Promise<DeleteSnapshotResult> {
    try {
      await this.ensureInitialized();

      if (!this.snapshotRepository) {
        throw new Error('Snapshot repository not initialized');
      }

      // Delete from database
      await this.snapshotRepository.delete(snapshotId);

      // Delete photo directory
      const snapshotPhotoDir = `${Paths.document}snapshots/${snapshotId}/`;
      const dirInfo = await LegacyFileSystem.getInfoAsync(snapshotPhotoDir);
      if (dirInfo.exists) {
        await LegacyFileSystem.deleteAsync(snapshotPhotoDir);
        console.log('Snapshot photo directory deleted:', snapshotPhotoDir);
      }

      await this.logAudit('DELETE', 'snapshots', snapshotId);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete all user data (for GDPR compliance)
   */
  async deleteAllUserData(userId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      if (!this.modernDb) {
        throw new Error('Database not initialized');
      }

      // Delete all user data from all tables
      const tables = [
        'passports',
        'personal_info',
        'travel_info',
        'fund_items',
        'entry_info',
        'digital_arrival_cards',
        'snapshots'
      ];

      for (const table of tables) {
        await this.modernDb.runAsync(`DELETE FROM ${table} WHERE user_id = ?`, [userId]);
      }

      // Delete user record
      await this.modernDb.runAsync('DELETE FROM users WHERE id = ?', [userId]);

      console.log(`✅ Deleted all data for user: ${userId}`);
    } catch (error) {
      console.error('Failed to delete all user data:', error);
      throw error;
    }
  }
}

// Create singleton instance
const secureStorageService = new SecureStorageService();

export default secureStorageService;

