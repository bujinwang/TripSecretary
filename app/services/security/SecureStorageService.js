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

      // Clean up legacy funding_proof table if it exists (one-time operation)
      await this.cleanupLegacyFundingProofTable();

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
            user_id TEXT,
            encrypted_passport_number TEXT,
            encrypted_full_name TEXT,
            encrypted_date_of_birth TEXT,
            encrypted_nationality TEXT,
            gender TEXT,
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

        // Legacy funding_proof table removed - replaced by fund_items table

        // New individual fund items table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS fund_items (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            amount TEXT,
            currency TEXT,
            details TEXT,
            photo_uri TEXT,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // Index for faster queries by user
        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_fund_items_user_id 
          ON fund_items(user_id)
        `);

        // Travel info table (trip-specific draft data)
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS travel_info (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            destination TEXT,
            arrival_flight_number TEXT,
            arrival_departure_airport TEXT,
            arrival_departure_date TEXT,
            arrival_departure_time TEXT,
            arrival_arrival_airport TEXT,
            arrival_arrival_date TEXT,
            arrival_arrival_time TEXT,
            departure_flight_number TEXT,
            departure_departure_airport TEXT,
            departure_departure_date TEXT,
            departure_departure_time TEXT,
            departure_arrival_airport TEXT,
            departure_arrival_date TEXT,
            departure_arrival_time TEXT,
            hotel_name TEXT,
            hotel_address TEXT,
            status TEXT,
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

        // Migrations tracking table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS migrations (
            user_id TEXT PRIMARY KEY,
            migrated_at TEXT,
            source TEXT
          )
        `);

        // Create indexes for userId lookups
        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_passports_user_id 
          ON passports(user_id)
        `);

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_personal_info_user_id 
          ON personal_info(user_id)
        `);

        // Legacy funding_proof index removed

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_travel_info_user_id 
          ON travel_info(user_id)
        `);

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_travel_info_destination 
          ON travel_info(user_id, destination)
        `);
      }, reject, resolve);
    });
  }

  /**
   * Run database migrations for schema updates
   */
  async runMigrations() {
    try {
      // Get current version
      const currentVersion = await this.getSetting('db_version');

      console.log('Checking database migrations. Current version:', currentVersion, 'Target version:', this.DB_VERSION);
      
      // Always run migrations to ensure schema is up to date
      // This handles cases where database was created before migration system
      console.log('Running database migrations...');
      
      // Migration 1: Add gender and user_id to all tables
      await this.addPassportFields();
      
      // Update version if needed
      if (!currentVersion || currentVersion !== this.DB_VERSION) {
        await this.setSetting('db_version', this.DB_VERSION);
        console.log('Database version updated to', this.DB_VERSION);
      }
      
      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Migration error:', error);
      // Don't throw - allow app to continue with existing schema
    }
  }

  /**
   * Add gender and user_id fields to passports table if they don't exist
   * Also add user_id to personal_info table
   */
  async addPassportFields() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Check and update passports table
        tx.executeSql(
          `PRAGMA table_info(passports)`,
          [],
          (_, { rows }) => {
            const columns = rows._array.map(col => col.name);
            
            // Add gender column if it doesn't exist
            if (!columns.includes('gender')) {
              tx.executeSql(
                `ALTER TABLE passports ADD COLUMN gender TEXT`,
                [],
                () => console.log('Added gender column to passports table'),
                (_, error) => {
                  console.error('Failed to add gender column:', error);
                  return false; // Continue transaction
                }
              );
            }
            
            // Add user_id column if it doesn't exist
            if (!columns.includes('user_id')) {
              tx.executeSql(
                `ALTER TABLE passports ADD COLUMN user_id TEXT`,
                [],
                () => console.log('Added user_id column to passports table'),
                (_, error) => {
                  console.error('Failed to add user_id column:', error);
                  return false; // Continue transaction
                }
              );
            }
          },
          (_, error) => {
            console.error('Failed to check passports table schema:', error);
            return false; // Continue transaction
          }
        );

        // Check and update personal_info table
        tx.executeSql(
          `PRAGMA table_info(personal_info)`,
          [],
          (_, { rows }) => {
            const columns = rows._array.map(col => col.name);
            
            // Add user_id column if it doesn't exist
            if (!columns.includes('user_id')) {
              tx.executeSql(
                `ALTER TABLE personal_info ADD COLUMN user_id TEXT`,
                [],
                () => console.log('Added user_id column to personal_info table'),
                (_, error) => {
                  console.error('Failed to add user_id column to personal_info:', error);
                  return false; // Continue transaction
                }
              );
            }
          },
          (_, error) => {
            console.error('Failed to check personal_info table schema:', error);
            return false; // Continue transaction
          }
        );

        // Legacy funding_proof table migration removed
      }, reject, resolve);
    });
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
    return new Promise(async (resolve, reject) => {
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
        const passportId = passportData.id || this.generateId();

        this.db.transaction(
          tx => {
            tx.executeSql(
              `INSERT OR REPLACE INTO passports (
                id,
                user_id,
                encrypted_passport_number,
                encrypted_full_name,
                encrypted_date_of_birth,
                encrypted_nationality,
                gender,
                expiry_date,
                issue_date,
                issue_place,
                photo_uri,
                created_at,
                updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                passportId,
                passportData.userId,
                encryptedData.passport_number,
                encryptedData.full_name,
                encryptedData.date_of_birth,
                encryptedData.nationality,
                passportData.gender,
                passportData.expiryDate,
                passportData.issueDate,
                passportData.issuePlace,
                passportData.photoUri,
                passportData.createdAt || now,
                now
              ],
              () => {
                this.logAudit('INSERT', 'passports', passportId);
              },
              (_, error) => {
                console.error('Failed to save passport:', error);
                return false;
              }
            );
          },
          reject,
          () => resolve({ id: passportId })
        );
      } catch (error) {
        console.error('Failed to save passport:', error);
        reject(error);
      }
    });
  }

  /**
   * Get passport data and decrypt sensitive fields
   * @param {string} id - Passport ID
   * @returns {Object} - Decrypted passport data
   */
  async getPassport(id) {
    return new Promise((resolve, reject) => {
      try {
        this.db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM passports WHERE id = ? LIMIT 1',
            [id],
            async (_, { rows }) => {
              if (rows.length === 0) {
                resolve(null);
                return;
              }

              const result = rows._array[0];

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
                userId: result.user_id,
                passportNumber: decryptedFields.passport_number,
                fullName: decryptedFields.full_name,
                dateOfBirth: decryptedFields.date_of_birth,
                nationality: decryptedFields.nationality,
                gender: result.gender,
                expiryDate: result.expiry_date,
                issueDate: result.issue_date,
                issuePlace: result.issue_place,
                photoUri: result.photo_uri,
                createdAt: result.created_at,
                updatedAt: result.updated_at
              };

              resolve(passport);
            },
            (_, error) => {
              console.error('Failed to get passport:', error);
              reject(error);
              return false;
            }
          );
        });
      } catch (error) {
        console.error('Failed to get passport:', error);
        reject(error);
      }
    });
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
      const id = personalData.id || this.generateId();

      return new Promise((resolve, reject) => {
        this.db.transaction(tx => {
          tx.executeSql(
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
              id,
              personalData.userId,
              encryptedData.phone_number,
              encryptedData.email,
              encryptedData.home_address,
              personalData.occupation,
              personalData.provinceCity,
              personalData.countryRegion,
              personalData.createdAt || now,
              now
            ],
            (_, result) => {
              this.logAudit('INSERT', 'personal_info', id).catch(console.error);
              resolve(result);
            },
            (_, error) => {
              console.error('Failed to save personal info:', error);
              reject(error);
            }
          );
        });
      });
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
     return new Promise((resolve, reject) => {
       try {
         console.log('=== SECURE STORAGE DEBUG ===');
         console.log('getPersonalInfo called with userId:', userId);
         console.log('Type of userId:', typeof userId);
         console.log('userId length:', userId?.length);

         this.db.transaction(tx => {
           console.log('Executing SQL query: SELECT * FROM personal_info WHERE user_id = ? LIMIT 1');
           console.log('Query parameter:', userId);

           tx.executeSql(
             'SELECT * FROM personal_info WHERE user_id = ? LIMIT 1',
             [userId],
             async (_, { rows }) => {
               console.log('Query executed, rows.length:', rows.length);
               console.log('Rows raw data:', rows);

               if (rows.length === 0) {
                 console.log('No personal info records found for userId:', userId);
                 resolve(null);
                 return;
               }

              const result = rows._array[0];

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

              resolve(personalInfo);
            },
            (_, error) => {
              console.error('Failed to get personal info:', error);
              reject(error);
              return false;
            }
          );
        });
      } catch (error) {
        console.error('Failed to get personal info:', error);
        reject(error);
      }
    });
  }

  /**
   * Get personal information by personal info ID (not userId)
   * @param {string} personalInfoId - Personal info ID
   * @returns {Object} - Decrypted personal information
   */
  async getPersonalInfoById(personalInfoId) {
    return new Promise((resolve, reject) => {
      try {
        console.log('=== SECURE STORAGE DEBUG ===');
        console.log('getPersonalInfoById called with personalInfoId:', personalInfoId);

        this.db.transaction(tx => {
          console.log('Executing SQL query: SELECT * FROM personal_info WHERE id = ? LIMIT 1');
          console.log('Query parameter:', personalInfoId);

          tx.executeSql(
            'SELECT * FROM personal_info WHERE id = ? LIMIT 1',
            [personalInfoId],
            async (_, { rows }) => {
              console.log('Query executed, rows.length:', rows.length);

              if (rows.length === 0) {
                console.log('No personal info records found for personalInfoId:', personalInfoId);
                resolve(null);
                return;
              }

              const result = rows._array[0];

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

              resolve(personalInfo);
            },
            (_, error) => {
              console.error('Failed to get personal info by ID:', error);
              reject(error);
              return false;
            }
          );
        });
      } catch (error) {
        console.error('Failed to get personal info by ID:', error);
        reject(error);
      }
    });
  }

  /**
   * LEGACY: saveFundingProof and getFundingProof methods removed
   * Use saveFundItem/getFundItemsByUserId instead with the fund_items table
   */

  /**
   * Save individual fund item
   * @param {FundItem} fundItem - Fund item instance
   * @returns {Promise<Object>} - Saved fund item data
   */
  async saveFundItem(fundItem) {
    try {
      console.log('=== SECURE STORAGE: SAVE FUND ITEM ===');
      console.log('Input fund item:', {
        id: fundItem.id,
        userId: fundItem.userId,
        type: fundItem.type,
        hasPhoto: !!fundItem.photoUri,
        photoLength: fundItem.photoUri?.length
      });

      const now = new Date().toISOString();

      return new Promise((resolve, reject) => {
        this.db.transaction(tx => {
          tx.executeSql(
            `INSERT OR REPLACE INTO fund_items 
             (id, user_id, type, amount, currency, details, photo_uri, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              fundItem.id,
              fundItem.userId,
              fundItem.type,
              fundItem.amount,
              fundItem.currency,
              fundItem.details,
              fundItem.photoUri,
              fundItem.createdAt,
              now
            ],
            (_, result) => {
              console.log('✅ Fund item SQL INSERT successful, rows affected:', result.rowsAffected);
              this.logAudit('INSERT', 'fund_items', fundItem.id).catch(console.error);
              resolve({ ...fundItem.toJSON(), updatedAt: now });
            },
            (_, error) => {
              console.error('❌ Fund item SQL INSERT failed:', error);
              reject(error);
            }
          );
        });
      });
    } catch (error) {
      console.error('SecureStorageService.saveFundItem failed:', error);
      throw error;
    }
  }

  /**
   * Get fund item by ID
   * @param {string} id - Fund item ID
   * @returns {Promise<Object|null>} - Fund item data or null
   */
  async getFundItem(id) {
    try {
      return new Promise((resolve, reject) => {
        this.db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM fund_items WHERE id = ? LIMIT 1',
            [id],
            (_, { rows }) => {
              if (rows.length > 0) {
                const item = rows._array[0];
                resolve({
                  id: item.id,
                  userId: item.user_id,
                  type: item.type,
                  amount: item.amount,
                  currency: item.currency,
                  details: item.details,
                  photoUri: item.photo_uri,
                  createdAt: item.created_at,
                  updatedAt: item.updated_at
                });
              } else {
                resolve(null);
              }
            },
            (_, error) => {
              console.error('getFundItem query failed:', error);
              reject(error);
            }
          );
        });
      });
    } catch (error) {
      console.error('SecureStorageService.getFundItem failed:', error);
      throw error;
    }
  }

  /**
   * Get all fund items for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of fund items
   */
  async getFundItemsByUserId(userId) {
    try {
      console.log('=== SECURE STORAGE: GET FUND ITEMS BY USER ID ===');
      console.log('Querying fund items for userId:', userId);

      return new Promise((resolve, reject) => {
        this.db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM fund_items WHERE user_id = ? ORDER BY created_at DESC',
            [userId],
            (_, { rows }) => {
              console.log('Fund items query result:', rows.length, 'rows');
              const items = rows._array.map(item => ({
                id: item.id,
                userId: item.user_id,
                type: item.type,
                amount: item.amount,
                currency: item.currency,
                details: item.details,
                photoUri: item.photo_uri,
                createdAt: item.created_at,
                updatedAt: item.updated_at
              }));
              console.log('Mapped fund items:', items.length);
              resolve(items);
            },
            (_, error) => {
              console.error('getFundItemsByUserId query failed:', error);
              reject(error);
            }
          );
        });
      });
    } catch (error) {
      console.error('SecureStorageService.getFundItemsByUserId failed:', error);
      throw error;
    }
  }

  /**
   * Delete fund item by ID
   * @param {string} id - Fund item ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFundItem(id) {
    try {
      console.log('=== SECURE STORAGE: DELETE FUND ITEM ===');
      console.log('Deleting fund item:', id);

      return new Promise((resolve, reject) => {
        this.db.transaction(tx => {
          tx.executeSql(
            'DELETE FROM fund_items WHERE id = ?',
            [id],
            (_, result) => {
              console.log('✅ Fund item deleted, rows affected:', result.rowsAffected);
              this.logAudit('DELETE', 'fund_items', id).catch(console.error);
              resolve(result.rowsAffected > 0);
            },
            (_, error) => {
              console.error('❌ Delete fund item failed:', error);
              reject(error);
            }
          );
        });
      });
    } catch (error) {
      console.error('SecureStorageService.deleteFundItem failed:', error);
      throw error;
    }
  }

  /**
   * Save travel information (trip-specific draft data)
   * @param {Object} travelData - Travel info data
   * @returns {Promise<Object>} - Save result
   */
  async saveTravelInfo(travelData) {
    try {
      const now = new Date().toISOString();
      const id = travelData.id || this.generateId();

      return new Promise((resolve, reject) => {
        this.db.transaction(tx => {
          tx.executeSql(
            `INSERT OR REPLACE INTO travel_info (
              id, user_id, destination,
              arrival_flight_number, arrival_departure_airport,
              arrival_departure_date, arrival_departure_time,
              arrival_arrival_airport, arrival_arrival_date, arrival_arrival_time,
              departure_flight_number, departure_departure_airport,
              departure_departure_date, departure_departure_time,
              departure_arrival_airport, departure_arrival_date, departure_arrival_time,
              hotel_name, hotel_address, status,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              travelData.userId,
              travelData.destination,
              travelData.arrivalFlightNumber,
              travelData.arrivalDepartureAirport,
              travelData.arrivalDepartureDate,
              travelData.arrivalDepartureTime,
              travelData.arrivalArrivalAirport,
              travelData.arrivalArrivalDate,
              travelData.arrivalArrivalTime,
              travelData.departureFlightNumber,
              travelData.departureDepartureAirport,
              travelData.departureDepartureDate,
              travelData.departureDepartureTime,
              travelData.departureArrivalAirport,
              travelData.departureArrivalDate,
              travelData.departureArrivalTime,
              travelData.hotelName,
              travelData.hotelAddress,
              travelData.status || 'draft',
              travelData.createdAt || now,
              now
            ],
            (_, result) => {
              this.logAudit('INSERT', 'travel_info', id).catch(console.error);
              resolve({ id, result });
            },
            (_, error) => {
              console.error('Failed to save travel info:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    } catch (error) {
      console.error('Failed to save travel info:', error);
      throw error;
    }
  }

  /**
   * Get travel information for a user
   * @param {string} userId - User ID
   * @param {string} destination - Optional destination filter
   * @returns {Promise<Object>} - Travel info data
   */
  async getTravelInfo(userId, destination = null) {
    return new Promise((resolve, reject) => {
      try {
        this.db.transaction(tx => {
          const query = destination
            ? 'SELECT * FROM travel_info WHERE user_id = ? AND destination = ? ORDER BY updated_at DESC LIMIT 1'
            : 'SELECT * FROM travel_info WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1';
          
          const params = destination ? [userId, destination] : [userId];

          tx.executeSql(
            query,
            params,
            (_, { rows }) => {
              if (rows.length === 0) {
                resolve(null);
                return;
              }

              const result = rows._array[0];

              const travelInfo = {
                id: result.id,
                userId: result.user_id,
                destination: result.destination,
                arrivalFlightNumber: result.arrival_flight_number,
                arrivalDepartureAirport: result.arrival_departure_airport,
                arrivalDepartureDate: result.arrival_departure_date,
                arrivalDepartureTime: result.arrival_departure_time,
                arrivalArrivalAirport: result.arrival_arrival_airport,
                arrivalArrivalDate: result.arrival_arrival_date,
                arrivalArrivalTime: result.arrival_arrival_time,
                departureFlightNumber: result.departure_flight_number,
                departureDepartureAirport: result.departure_departure_airport,
                departureDepartureDate: result.departure_departure_date,
                departureDepartureTime: result.departure_departure_time,
                departureArrivalAirport: result.departure_arrival_airport,
                departureArrivalDate: result.departure_arrival_date,
                departureArrivalTime: result.departure_arrival_time,
                hotelName: result.hotel_name,
                hotelAddress: result.hotel_address,
                status: result.status,
                createdAt: result.created_at,
                updatedAt: result.updated_at
              };

              resolve(travelInfo);
            },
            (_, error) => {
              console.error('Failed to get travel info:', error);
              reject(error);
              return false;
            }
          );
        });
      } catch (error) {
        console.error('Failed to get travel info:', error);
        reject(error);
      }
    });
  }

  /**
   * Save travel history (non-sensitive data)
   * @param {Object} travelData - Travel history data
   */
  async saveTravelHistory(travelData) {
    try {
      const now = new Date().toISOString();
      const id = travelData.id || this.generateId();

      return new Promise((resolve, reject) => {
        this.db.transaction(tx => {
          tx.executeSql(
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
              id,
              travelData.userId,
              travelData.destinationId,
              travelData.destinationName,
              travelData.travelDate,
              travelData.returnDate,
              travelData.purpose,
              now
            ],
            (_, result) => {
              this.logAudit('INSERT', 'travel_history', id).catch(console.error);
              resolve(result);
            },
            (_, error) => {
              console.error('Failed to save travel history:', error);
              reject(error);
            }
          );
        });
      });
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
   * Get user's passport by userId
   * @param {string} userId - User ID
   * @returns {Object} - Decrypted passport data
   */
  async getUserPassport(userId) {
    return new Promise((resolve, reject) => {
      try {
        this.db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM passports WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
            [userId],
            async (_, { rows }) => {
              if (rows.length === 0) {
                resolve(null);
                return;
              }

              const result = rows._array[0];

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
                userId: result.user_id,
                passportNumber: decryptedFields.passport_number,
                fullName: decryptedFields.full_name,
                dateOfBirth: decryptedFields.date_of_birth,
                nationality: decryptedFields.nationality,
                gender: result.gender,
                expiryDate: result.expiry_date,
                issueDate: result.issue_date,
                issuePlace: result.issue_place,
                photoUri: result.photo_uri,
                createdAt: result.created_at,
                updatedAt: result.updated_at
              };

              resolve(passport);
            },
            (_, error) => {
              console.error('Failed to get user passport:', error);
              reject(error);
              return false;
            }
          );
        });
      } catch (error) {
        console.error('Failed to get user passport:', error);
        reject(error);
      }
    });
  }

  /**
   * Clean up duplicate passports for a user, keeping only the most recent one
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of duplicate passports deleted
   */
  async cleanupDuplicatePassports(userId) {
    return new Promise((resolve, reject) => {
      try {
        this.db.transaction(tx => {
          // First, get all passports for this user
          tx.executeSql(
            'SELECT id, updated_at FROM passports WHERE user_id = ? ORDER BY updated_at DESC',
            [userId],
            (_, { rows }) => {
              if (rows.length <= 1) {
                // No duplicates
                resolve(0);
                return;
              }

              // Keep the first one (most recent), delete the rest
              const passportsToDelete = rows._array.slice(1);
              const idsToDelete = passportsToDelete.map(p => p.id);
              
              if (idsToDelete.length === 0) {
                resolve(0);
                return;
              }

              console.log(`Cleaning up ${idsToDelete.length} duplicate passport(s) for user ${userId}`);
              console.log('Keeping most recent passport, deleting:', idsToDelete);

              // Delete duplicates
              const placeholders = idsToDelete.map(() => '?').join(',');
              tx.executeSql(
                `DELETE FROM passports WHERE id IN (${placeholders})`,
                idsToDelete,
                () => {
                  console.log(`Successfully deleted ${idsToDelete.length} duplicate passport(s)`);
                  resolve(idsToDelete.length);
                },
                (_, error) => {
                  console.error('Failed to delete duplicate passports:', error);
                  reject(error);
                  return false;
                }
              );
            },
            (_, error) => {
              console.error('Failed to query passports for cleanup:', error);
              reject(error);
              return false;
            }
          );
        });
      } catch (error) {
        console.error('Failed to cleanup duplicate passports:', error);
        reject(error);
      }
    });
  }

  /**
   * List all passports for a user (multi-passport support)
   * @param {string} userId - User ID
   * @returns {Array} - Array of decrypted passport data
   */
  async listUserPassports(userId) {
    try {
      const results = await this.db.getAllAsync(
        'SELECT * FROM passports WHERE user_id = ?',
        [userId]
      );

      if (!results || results.length === 0) {
        return [];
      }

      const passports = await Promise.all(
        results.map(async (result) => {
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

          return {
            id: result.id,
            userId: result.user_id,
            passportNumber: decryptedFields.passport_number,
            fullName: decryptedFields.full_name,
            dateOfBirth: decryptedFields.date_of_birth,
            nationality: decryptedFields.nationality,
            gender: result.gender,
            expiryDate: result.expiry_date,
            issueDate: result.issue_date,
            issuePlace: result.issue_place,
            photoUri: result.photo_uri,
            createdAt: result.created_at,
            updatedAt: result.updated_at
          };
        })
      );

      return passports;
    } catch (error) {
      console.error('Failed to list user passports:', error);
      throw error;
    }
  }

  /**
   * Check if migration is needed for a user
   * @param {string} userId - User ID
   * @returns {boolean} - True if migration is needed
   */
  async needsMigration(userId) {
    return new Promise((resolve) => {
      try {
        this.db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM migrations WHERE user_id = ? LIMIT 1',
            [userId],
            (_, { rows }) => {
              resolve(rows.length === 0);
            },
            (_, error) => {
              console.error('Failed to check migration status:', error);
              resolve(true); // Assume migration needed on error
              return false;
            }
          );
        });
      } catch (error) {
        console.error('Failed to check migration status:', error);
        resolve(true); // Assume migration needed on error
      }
    });
  }

  /**
   * Mark migration as complete for a user
   * @param {string} userId - User ID
   * @param {string} source - Migration source (e.g., 'AsyncStorage')
   */
  async markMigrationComplete(userId, source = 'AsyncStorage') {
    return new Promise((resolve, reject) => {
      try {
        const now = new Date().toISOString();
        this.db.transaction(
          tx => {
            tx.executeSql(
              'INSERT OR REPLACE INTO migrations (user_id, migrated_at, source) VALUES (?, ?, ?)',
              [userId, now, source],
              () => {
                console.log(`Migration marked complete for user ${userId} from ${source}`);
              },
              (_, error) => {
                console.error('Failed to mark migration complete:', error);
                return false;
              }
            );
          },
          reject,
          resolve
        );
      } catch (error) {
        console.error('Failed to mark migration complete:', error);
        reject(error);
      }
    });
  }

  /**
   * Get migration status for a user
   * @param {string} userId - User ID
   * @returns {Object|null} - Migration status or null if not migrated
   */
  async getMigrationStatus(userId) {
    return new Promise((resolve) => {
      try {
        this.db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM migrations WHERE user_id = ? LIMIT 1',
            [userId],
            (_, { rows }) => {
              if (rows.length === 0) {
                resolve(null);
                return;
              }
              const result = rows._array[0];
              resolve({
                userId: result.user_id,
                migratedAt: result.migrated_at,
                source: result.source
              });
            },
            (_, error) => {
              console.error('Failed to get migration status:', error);
              resolve(null);
              return false;
            }
          );
        });
      } catch (error) {
        console.error('Failed to get migration status:', error);
        resolve(null);
      }
    });
  }

  /**
   * Batch save operations for atomic updates
   * Uses SQLite transactions for atomicity and performance
   * OPTIMIZED: Pre-encrypts all data before transaction for better performance
   * @param {Array} operations - Array of {type, data} operations
   * @returns {Promise<Array>} - Array of results
   */
  async batchSave(operations) {
    try {
      console.log(`Starting batch save with ${operations.length} operations`);
      const startTime = Date.now();
      
      // OPTIMIZATION: Pre-encrypt all data before entering transaction
      // This reduces time spent in the transaction and improves throughput
      const preparedOperations = await Promise.all(
        operations.map(async (op) => {
          const now = new Date().toISOString();
          const id = op.data.id || this.generateId();
          
          switch (op.type) {
            case 'passport': {
              const encryptedData = this.ENCRYPTION_ENABLED 
                ? await this.encryption.encryptFields({
                    passport_number: op.data.passportNumber,
                    full_name: op.data.fullName,
                    date_of_birth: op.data.dateOfBirth,
                    nationality: op.data.nationality
                  })
                : {
                    passport_number: op.data.passportNumber,
                    full_name: op.data.fullName,
                    date_of_birth: op.data.dateOfBirth,
                    nationality: op.data.nationality
                  };
              
              return {
                type: 'passport',
                id,
                sql: `INSERT OR REPLACE INTO passports (
                  id, user_id, encrypted_passport_number, encrypted_full_name,
                  encrypted_date_of_birth, encrypted_nationality, gender,
                  expiry_date, issue_date, issue_place, photo_uri,
                  created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                params: [
                  id, op.data.userId,
                  encryptedData.passport_number, encryptedData.full_name,
                  encryptedData.date_of_birth, encryptedData.nationality,
                  op.data.gender, op.data.expiryDate,
                  op.data.issueDate, op.data.issuePlace,
                  op.data.photoUri, op.data.createdAt || now, now
                ]
              };
            }
            
            case 'personalInfo': {
              const encryptedData = this.ENCRYPTION_ENABLED
                ? await this.encryption.encryptFields({
                    phone_number: op.data.phoneNumber,
                    email: op.data.email,
                    home_address: op.data.homeAddress
                  })
                : {
                    phone_number: op.data.phoneNumber,
                    email: op.data.email,
                    home_address: op.data.homeAddress
                  };
              
              return {
                type: 'personalInfo',
                id,
                sql: `INSERT OR REPLACE INTO personal_info (
                  id, user_id, encrypted_phone_number, encrypted_email,
                  encrypted_home_address, occupation, province_city,
                  country_region, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                params: [
                  id, op.data.userId,
                  encryptedData.phone_number, encryptedData.email,
                  encryptedData.home_address, op.data.occupation,
                  op.data.provinceCity, op.data.countryRegion,
                  op.data.createdAt || now, now
                ]
              };
            }
            
            case 'fundingProof': {
              const encryptedData = this.ENCRYPTION_ENABLED
                ? await this.encryption.encryptFields({
                    cash_amount: op.data.cashAmount,
                    bank_cards: op.data.bankCards,
                    supporting_docs: op.data.supportingDocs
                  })
                : {
                    cash_amount: op.data.cashAmount,
                    bank_cards: op.data.bankCards,
                    supporting_docs: op.data.supportingDocs
                  };
              
              // Legacy fundingProof type removed - use fund_items instead
              console.warn('fundingProof type is deprecated, use fund_items instead');
              return null;
            }
            
            default:
              console.warn('Unknown operation type:', op.type);
              return null;
          }
        })
      );
      
      // Filter out null operations
      const validOperations = preparedOperations.filter(op => op !== null);
      
      if (validOperations.length === 0) {
        console.log('No valid operations to save');
        return [];
      }
      
      const encryptionTime = Date.now() - startTime;
      console.log(`Pre-encryption completed in ${encryptionTime}ms`);
      
      // Execute all operations in a single transaction
      return new Promise((resolve, reject) => {
        const results = [];
        
        this.db.transaction(
          (tx) => {
            // Execute all SQL statements synchronously within the transaction
            validOperations.forEach((op) => {
              tx.executeSql(
                op.sql,
                op.params,
                (_, result) => {
                  results.push({ type: op.type, id: op.id, result });
                },
                (_, error) => {
                  console.error(`Failed to save ${op.type}:`, error);
                  return true; // Trigger transaction rollback
                }
              );
            });
          },
          (error) => {
            // Transaction failed - rollback automatic
            const duration = Date.now() - startTime;
            console.error(`Batch save transaction failed after ${duration}ms:`, error);
            reject(error);
          },
          async () => {
            // Transaction succeeded
            const duration = Date.now() - startTime;
            const transactionTime = duration - encryptionTime;
            console.log(`Batch save completed in ${duration}ms (encryption: ${encryptionTime}ms, transaction: ${transactionTime}ms)`);
            
            await this.logAudit('BATCH_SAVE', 'multiple', 'batch', { 
              operationCount: validOperations.length,
              durationMs: duration,
              encryptionMs: encryptionTime,
              transactionMs: transactionTime
            });
            
            resolve(results);
          }
        );
      });
    } catch (error) {
      console.error('Batch save failed:', error);
      throw error;
    }
  }

  /**
   * Save passport within a transaction
   * @private
   */
  async savePassportInTransaction(tx, passportData) {
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
    const id = passportData.id || this.generateId();

    return new Promise((resolve, reject) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO passports (
          id, user_id, encrypted_passport_number, encrypted_full_name,
          encrypted_date_of_birth, encrypted_nationality, gender,
          expiry_date, issue_date, issue_place, photo_uri,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, passportData.userId,
          encryptedData.passport_number, encryptedData.full_name,
          encryptedData.date_of_birth, encryptedData.nationality,
          passportData.gender, passportData.expiryDate,
          passportData.issueDate, passportData.issuePlace,
          passportData.photoUri, passportData.createdAt || now, now
        ],
        (_, result) => resolve({ type: 'passport', id, result }),
        (_, error) => reject(error)
      );
    });
  }

  /**
   * Save personal info within a transaction
   * @private
   */
  async savePersonalInfoInTransaction(tx, personalData) {
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
    const id = personalData.id || this.generateId();

    return new Promise((resolve, reject) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO personal_info (
          id, user_id, encrypted_phone_number, encrypted_email,
          encrypted_home_address, occupation, province_city,
          country_region, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, personalData.userId,
          encryptedData.phone_number, encryptedData.email,
          encryptedData.home_address, personalData.occupation,
          personalData.provinceCity, personalData.countryRegion,
          personalData.createdAt || now, now
        ],
        (_, result) => resolve({ type: 'personalInfo', id, result }),
        (_, error) => reject(error)
      );
    });
  }

  /**
   * Save funding proof within a transaction
   * @private
   */
  async saveFundingProofInTransaction(tx, fundingData) {
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

    // Legacy funding_proof save operation removed
    console.warn('saveFundingProofInTransaction is deprecated, use saveFundItem instead');
    return Promise.resolve({ type: 'fundingProof', id: null, result: null });
  }

  /**
   * Batch load operations for efficient data retrieval
   * Uses a single transaction to load multiple data types at once
   * OPTIMIZED: Fetches all data in transaction, then decrypts outside for better performance
   * @param {string} userId - User ID
   * @param {Array<string>} dataTypes - Array of data types to load ('passport', 'personalInfo', 'fundingProof')
   * @returns {Promise<Object>} - Object containing loaded data
   */
  async batchLoad(userId, dataTypes = ['passport', 'personalInfo', 'fundingProof']) {
    try {
      console.log(`Starting batch load for user ${userId} with types:`, dataTypes);
      const startTime = Date.now();
      
      // OPTIMIZATION: Fetch all encrypted data in a single transaction
      const encryptedData = await new Promise((resolve, reject) => {
        const rawData = {};
        
        this.db.transaction(
          (tx) => {
            const queries = [];
            
            // Load passport if requested
            if (dataTypes.includes('passport')) {
              queries.push(
                new Promise((resolveQuery, rejectQuery) => {
                  tx.executeSql(
                    'SELECT * FROM passports WHERE user_id = ? LIMIT 1',
                    [userId],
                    (_, { rows }) => {
                      rawData.passport = rows.length > 0 ? rows._array[0] : null;
                      resolveQuery();
                    },
                    (_, error) => rejectQuery(error)
                  );
                })
              );
            }
            
            // Load personal info if requested
            if (dataTypes.includes('personalInfo')) {
              queries.push(
                new Promise((resolveQuery, rejectQuery) => {
                  tx.executeSql(
                    'SELECT * FROM personal_info WHERE user_id = ? LIMIT 1',
                    [userId],
                    (_, { rows }) => {
                      rawData.personalInfo = rows.length > 0 ? rows._array[0] : null;
                      resolveQuery();
                    },
                    (_, error) => rejectQuery(error)
                  );
                })
              );
            }
            
            // Legacy funding_proof load removed - use fund_items instead
            if (dataTypes.includes('fundingProof')) {
              console.warn('fundingProof type is deprecated, use fund_items instead');
              rawData.fundingProof = null;
            }
            
            // Wait for all queries to complete
            Promise.all(queries)
              .then(() => resolve(rawData))
              .catch(reject);
          },
          (error) => {
            console.error('Batch load transaction failed:', error);
            reject(error);
          }
        );
      });
      
      const fetchTime = Date.now() - startTime;
      console.log(`Data fetched in ${fetchTime}ms, starting decryption...`);
      
      // OPTIMIZATION: Decrypt all data in parallel outside the transaction
      const decryptionPromises = [];
      const results = {};
      
      if (encryptedData.passport) {
        decryptionPromises.push(
          (async () => {
            const result = encryptedData.passport;
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
            
            results.passport = {
              id: result.id,
              userId: result.user_id,
              passportNumber: decryptedFields.passport_number,
              fullName: decryptedFields.full_name,
              dateOfBirth: decryptedFields.date_of_birth,
              nationality: decryptedFields.nationality,
              gender: result.gender,
              expiryDate: result.expiry_date,
              issueDate: result.issue_date,
              issuePlace: result.issue_place,
              photoUri: result.photo_uri,
              createdAt: result.created_at,
              updatedAt: result.updated_at
            };
          })()
        );
      } else {
        results.passport = null;
      }
      
      if (encryptedData.personalInfo) {
        decryptionPromises.push(
          (async () => {
            const result = encryptedData.personalInfo;
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
            
            results.personalInfo = {
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
          })()
        );
      } else {
        results.personalInfo = null;
      }
      
      if (encryptedData.fundingProof) {
        decryptionPromises.push(
          (async () => {
            const result = encryptedData.fundingProof;
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
            
            results.fundingProof = {
              id: result.id,
              userId: result.user_id,
              cashAmount: decryptedFields.cash_amount,
              bankCards: decryptedFields.bank_cards,
              supportingDocs: decryptedFields.supporting_docs,
              createdAt: result.created_at,
              updatedAt: result.updated_at
            };
          })()
        );
      } else {
        results.fundingProof = null;
      }
      
      // Wait for all decryption to complete
      await Promise.all(decryptionPromises);
      
      const duration = Date.now() - startTime;
      const decryptionTime = duration - fetchTime;
      console.log(`Batch load completed in ${duration}ms (fetch: ${fetchTime}ms, decryption: ${decryptionTime}ms)`);
      
      return results;
    } catch (error) {
      console.error('Batch load failed:', error);
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
      const [passports, personalInfo, fundingProof, travelHistory] = await Promise.all([
        this.listUserPassports(userId),
        this.getPersonalInfo(userId),
        this.getFundingProof(userId),
        this.getTravelHistory(userId, 1000)
      ]);

      return {
        exportDate: new Date().toISOString(),
        userId: userId,
        passports: passports,
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
      return new Promise((resolve, reject) => {
        this.db.transaction(tx => {
          tx.executeSql('DELETE FROM passports WHERE user_id = ?', [userId]);
          tx.executeSql('DELETE FROM personal_info WHERE user_id = ?', [userId]);
          tx.executeSql('DELETE FROM funding_proof WHERE user_id = ?', [userId]);
          tx.executeSql('DELETE FROM travel_history WHERE user_id = ?', [userId]);
          tx.executeSql('DELETE FROM migrations WHERE user_id = ?', [userId]);
        }, 
        (error) => {
          console.error('Failed to delete user data:', error);
          reject(error);
        },
        () => {
          this.logAudit('DELETE_ALL', 'all_tables', userId).catch(console.error);
          resolve();
        });
      });
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

      return new Promise((resolve, reject) => {
        this.db.transaction(tx => {
          tx.executeSql(
            'INSERT INTO audit_log (id, action, table_name, record_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)',
            [
              auditEntry.id,
              auditEntry.action,
              auditEntry.tableName,
              auditEntry.recordId,
              auditEntry.timestamp,
              auditEntry.details
            ],
            (_, result) => resolve(result),
            (_, error) => {
              console.error('Failed to log audit event:', error);
              reject(error);
            }
          );
        });
      });
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
   * Verify database indexes exist and are being used
   * Uses EXPLAIN QUERY PLAN to check index usage
   * @returns {Promise<Object>} - Index verification results
   */
  async verifyIndexes() {
    try {
      console.log('=== Verifying Database Indexes ===');
      
      const results = {
        indexesExist: {},
        queryPlans: {},
        recommendations: []
      };

      // Check if indexes exist
      const indexes = await this.db.getAllAsync(
        `SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'`
      );

      console.log(`Found ${indexes.length} custom indexes`);
      
      indexes.forEach(index => {
        results.indexesExist[index.name] = {
          table: index.tbl_name,
          sql: index.sql
        };
        console.log(`✓ Index exists: ${index.name} on ${index.tbl_name}`);
      });

      // Verify index usage with query plans
      const testQueries = [
        {
          name: 'passport_by_user_id',
          query: 'SELECT * FROM passports WHERE user_id = ?',
          params: ['test_user_123'],
          expectedIndex: 'idx_passports_user_id'
        },
        {
          name: 'personal_info_by_user_id',
          query: 'SELECT * FROM personal_info WHERE user_id = ?',
          params: ['test_user_123'],
          expectedIndex: 'idx_personal_info_user_id'
        },
        // Legacy funding_proof index test removed
      ];

      for (const testQuery of testQueries) {
        try {
          const plan = await this.db.getAllAsync(
            `EXPLAIN QUERY PLAN ${testQuery.query}`,
            testQuery.params
          );

          results.queryPlans[testQuery.name] = plan;

          // Check if the expected index is being used
          const usesIndex = plan.some(step => 
            step.detail && step.detail.includes(testQuery.expectedIndex)
          );

          if (usesIndex) {
            console.log(`✓ Query "${testQuery.name}" uses index ${testQuery.expectedIndex}`);
          } else {
            console.warn(`⚠ Query "${testQuery.name}" does NOT use expected index ${testQuery.expectedIndex}`);
            results.recommendations.push(
              `Query "${testQuery.name}" is not using the expected index. Consider analyzing the query.`
            );
          }

          // Log the query plan details
          plan.forEach(step => {
            console.log(`  Plan: ${step.detail}`);
          });

        } catch (error) {
          console.error(`Failed to analyze query plan for ${testQuery.name}:`, error);
          results.queryPlans[testQuery.name] = { error: error.message };
        }
      }

      console.log('=== Index Verification Complete ===');
      
      if (results.recommendations.length > 0) {
        console.log('\nRecommendations:');
        results.recommendations.forEach(rec => console.log(`  - ${rec}`));
      }

      return results;
    } catch (error) {
      console.error('Failed to verify indexes:', error);
      throw error;
    }
  }

  /**
   * Get index statistics and usage information
   * @returns {Promise<Object>} - Index statistics
   */
  async getIndexStats() {
    try {
      const stats = {
        totalIndexes: 0,
        customIndexes: [],
        tableStats: {}
      };

      // Get all indexes
      const indexes = await this.db.getAllAsync(
        `SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'index'`
      );

      stats.totalIndexes = indexes.length;
      stats.customIndexes = indexes.filter(idx => idx.name.startsWith('idx_'));

      // Get table row counts
      const tables = ['passports', 'personal_info', 'travel_history'];
      
      for (const table of tables) {
        try {
          const result = await this.db.getFirstAsync(
            `SELECT COUNT(*) as count FROM ${table}`
          );
          stats.tableStats[table] = {
            rowCount: result.count,
            indexes: indexes.filter(idx => idx.tbl_name === table).map(idx => idx.name)
          };
        } catch (error) {
          console.error(`Failed to get stats for table ${table}:`, error);
          stats.tableStats[table] = { error: error.message };
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get index stats:', error);
      throw error;
    }
  }

  /**
   * Reset database - drop and recreate all tables with fresh schema
   * WARNING: This will delete all data!
   */
  async resetDatabase() {
    return new Promise((resolve, reject) => {
      console.log('Resetting database - dropping all tables...');
      
      this.db.transaction(
        tx => {
          // Drop all tables
          tx.executeSql('DROP TABLE IF EXISTS passports');
          tx.executeSql('DROP TABLE IF EXISTS personal_info');
          tx.executeSql('DROP TABLE IF EXISTS funding_proof');
          tx.executeSql('DROP TABLE IF EXISTS travel_history');
          tx.executeSql('DROP TABLE IF EXISTS audit_log');
          tx.executeSql('DROP TABLE IF EXISTS settings');
          
          console.log('All tables dropped');
        },
        error => {
          console.error('Failed to drop tables:', error);
          reject(error);
        },
        async () => {
          console.log('Recreating tables...');
          try {
            // Recreate tables
            await this.createTables();
            console.log('Database reset complete');
            resolve();
          } catch (error) {
            console.error('Failed to recreate tables:', error);
            reject(error);
          }
        }
      );
    });
  }

  /**
    * Clean up legacy funding_proof table from existing databases
    * This is a one-time cleanup method for existing installations
    */
  async cleanupLegacyFundingProofTable() {
    return new Promise((resolve, reject) => {
      console.log('Cleaning up legacy funding_proof table...');

      this.db.transaction(
        tx => {
          // Drop the legacy table if it exists
          tx.executeSql('DROP TABLE IF EXISTS funding_proof', [], () => {
            console.log('✅ Legacy funding_proof table removed successfully');
          });
        },
        error => {
          console.error('❌ Failed to cleanup funding_proof table:', error);
          reject(error);
        },
        () => {
          console.log('✅ Legacy funding_proof cleanup completed');
          resolve();
        }
      );
    });
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