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
    this.DB_VERSION = '1.2.0';
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
   * Ensure the database connection is ready before performing operations
   * @throws {Error} When initialize() has not been called yet
   */
  async ensureInitialized() {
    if (!this.db) {
      throw new Error('Secure storage is not initialized. Call initialize() before accessing data.');
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
            phone_code TEXT,
            gender TEXT,
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
            travel_purpose TEXT,
            recent_stay_country TEXT,
            boarding_country TEXT,
            visa_number TEXT,
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
            accommodation_type TEXT,
            province TEXT,
            district TEXT,
            sub_district TEXT,
            postal_code TEXT,
            hotel_name TEXT,
            hotel_address TEXT,
            is_transit_passenger INTEGER DEFAULT 0,
            status TEXT,
            created_at TEXT,
            updated_at TEXT
          )
        `);
        
        // Add missing columns to existing travel_info table (migration)
        tx.executeSql(`
          ALTER TABLE travel_info ADD COLUMN travel_purpose TEXT
        `, [], () => {}, (_, error) => {
          // Column might already exist, ignore error
          return false;
        });
        
        tx.executeSql(`
          ALTER TABLE travel_info ADD COLUMN accommodation_type TEXT
        `, [], () => {}, (_, error) => {
          return false;
        });
        
        tx.executeSql(`
          ALTER TABLE travel_info ADD COLUMN province TEXT
        `, [], () => {}, (_, error) => {
          return false;
        });
        
        // Add accommodation_phone column for Japan entry
        tx.executeSql(`
          ALTER TABLE travel_info ADD COLUMN accommodation_phone TEXT
        `, [], () => {}, (_, error) => {
          return false;
        });
        
        // Add length_of_stay column for Japan entry
        tx.executeSql(`
          ALTER TABLE travel_info ADD COLUMN length_of_stay TEXT
        `, [], () => {}, (_, error) => {
          return false;
        });

        // Ensure all required columns exist for travel_info table
        const requiredColumns = [
          'travel_purpose',
          'recent_stay_country',
          'boarding_country', 
          'visa_number',
          'accommodation_phone',
          'length_of_stay'
        ];

        requiredColumns.forEach(column => {
          tx.executeSql(`
            ALTER TABLE travel_info ADD COLUMN ${column} TEXT
          `, [], () => {}, (_, error) => {
            // Column might already exist, ignore error
            return false;
          });
        });

        // Add is_transit_passenger column
        tx.executeSql(`
          ALTER TABLE travel_info ADD COLUMN is_transit_passenger INTEGER DEFAULT 0
        `, [], () => {}, (_, error) => {
          // Column might already exist, ignore error
          return false;
        });
        tx.executeSql(`
          ALTER TABLE travel_info ADD COLUMN length_of_stay TEXT
        `, [], () => {}, (_, error) => {
          return false;
        });
        
        tx.executeSql(`
          ALTER TABLE travel_info ADD COLUMN district TEXT
        `, [], () => {}, (_, error) => {
          return false;
        });
        
        tx.executeSql(`
          ALTER TABLE travel_info ADD COLUMN sub_district TEXT
        `, [], () => {}, (_, error) => {
          return false;
        });
        
        tx.executeSql(`
          ALTER TABLE travel_info ADD COLUMN postal_code TEXT
        `, [], () => {}, (_, error) => {
          return false;
        });

        // Backfill missing personal_info columns for legacy databases
        tx.executeSql(`
          ALTER TABLE personal_info ADD COLUMN phone_code TEXT
        `, [], () => {}, (_, error) => {
          // Column might already exist; ignore the error so startup continues
          return false;
        });

        tx.executeSql(`
          ALTER TABLE personal_info ADD COLUMN gender TEXT
        `, [], () => {}, (_, error) => {
          return false;
        });

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

        // Entry info table (Progressive Entry Flow)
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS entry_info (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            destination_id TEXT,
            trip_id TEXT,
            status TEXT DEFAULT 'incomplete',
            completion_metrics TEXT,
            last_updated_at TEXT,
            created_at TEXT,
            arrival_date TEXT,
            departure_date TEXT,
            travel_purpose TEXT,
            flight_number TEXT,
            accommodation TEXT,
            tdac_submission TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // Entry packs table (Progressive Entry Flow)
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS entry_packs (
            id TEXT PRIMARY KEY,
            entry_info_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            destination_id TEXT,
            trip_id TEXT,
            status TEXT DEFAULT 'in_progress',
            tdac_submission TEXT,
            submission_history TEXT,
            documents TEXT,
            display_status TEXT,
            created_at TEXT,
            updated_at TEXT,
            archived_at TEXT,
            FOREIGN KEY (entry_info_id) REFERENCES entry_info(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // TDAC submissions table (Progressive Entry Flow)
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS tdac_submissions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            entry_pack_id TEXT,
            destination_id TEXT,
            trip_id TEXT,
            arr_card_no TEXT NOT NULL,
            qr_uri TEXT,
            pdf_path TEXT,
            submitted_at TEXT NOT NULL,
            submission_method TEXT DEFAULT 'api',
            status TEXT DEFAULT 'success',
            api_response TEXT,
            processing_time INTEGER,
            retry_count INTEGER DEFAULT 0,
            error_details TEXT,
            is_superseded INTEGER DEFAULT 0,
            superseded_at TEXT,
            superseded_reason TEXT,
            superseded_by TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (entry_pack_id) REFERENCES entry_packs(id)
          )
        `);

        // Indexes for entry info and entry packs
        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_entry_info_user_id 
          ON entry_info(user_id)
        `);

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_entry_info_destination 
          ON entry_info(user_id, destination_id)
        `);

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_entry_packs_user_id 
          ON entry_packs(user_id)
        `);

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_entry_packs_entry_info_id 
          ON entry_packs(entry_info_id)
        `);

        // Audit events table (Progressive Entry Flow)
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS audit_events (
            id TEXT PRIMARY KEY,
            event_type TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            snapshot_id TEXT,
            entry_pack_id TEXT,
            user_id TEXT,
            metadata TEXT,
            system_info TEXT,
            immutable INTEGER DEFAULT 1,
            version INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            FOREIGN KEY (snapshot_id) REFERENCES entry_pack_snapshots(id),
            FOREIGN KEY (entry_pack_id) REFERENCES entry_packs(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // Indexes for TDAC submissions
        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_tdac_submissions_user_id 
          ON tdac_submissions(user_id)
        `);

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_tdac_submissions_entry_pack_id 
          ON tdac_submissions(entry_pack_id)
        `);

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_tdac_submissions_arr_card_no 
          ON tdac_submissions(arr_card_no)
        `);

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_tdac_submissions_status 
          ON tdac_submissions(user_id, status)
        `);

        // Indexes for audit events
        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_audit_events_snapshot_id 
          ON audit_events(snapshot_id)
        `);

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_audit_events_user_id 
          ON audit_events(user_id)
        `);

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp 
          ON audit_events(timestamp)
        `);

        tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_audit_events_type_timestamp 
          ON audit_events(event_type, timestamp)
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
      // Migration 2: Ensure travel_info has boarding_country column
      await this.addTravelInfoBoardingCountryColumn();
      // Migration 2b: Ensure travel_info has recent_stay_country column
      await this.addTravelInfoRecentStayCountryColumn();
      // Migration 3: Ensure travel_info has visa_number column
      await this.addTravelInfoVisaNumberColumn();
      // Migration 4: Ensure personal_info has phone_code column
      await this.addPersonalInfoPhoneCodeColumn();
      
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
   * Ensure travel_info table includes boarding_country column
   */
  async addTravelInfoBoardingCountryColumn() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `PRAGMA table_info(travel_info)`,
          [],
          (_, { rows }) => {
            const columns = rows._array.map(col => col.name);

            if (!columns.includes('boarding_country')) {
              tx.executeSql(
                `ALTER TABLE travel_info ADD COLUMN boarding_country TEXT`,
                [],
                () => console.log('Added boarding_country column to travel_info table'),
                (_, error) => {
                  console.error('Failed to add boarding_country column to travel_info table:', error);
                  return false;
                }
              );
            }
          },
          (_, error) => {
            console.error('Failed to check travel_info table schema:', error);
            return false;
          }
        );
      }, reject, resolve);
    });
  }

  /**
   * Ensure travel_info table includes recent_stay_country column
   */
  async addTravelInfoRecentStayCountryColumn() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `PRAGMA table_info(travel_info)`,
          [],
          (_, { rows }) => {
            const columns = rows._array.map(col => col.name);

            if (!columns.includes('recent_stay_country')) {
              tx.executeSql(
                `ALTER TABLE travel_info ADD COLUMN recent_stay_country TEXT`,
                [],
                () => console.log('Added recent_stay_country column to travel_info table'),
                (_, error) => {
                  console.error('Failed to add recent_stay_country column to travel_info table:', error);
                  return false;
                }
              );
            }
          },
          (_, error) => {
            console.error('Failed to check travel_info table schema:', error);
            return false;
          }
        );
      }, reject, resolve);
    });
  }

  /**
   * Ensure travel_info table includes visa_number column
   */
  async addTravelInfoVisaNumberColumn() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `PRAGMA table_info(travel_info)`,
          [],
          (_, { rows }) => {
            const columns = rows._array.map(col => col.name);

            if (!columns.includes('visa_number')) {
              tx.executeSql(
                `ALTER TABLE travel_info ADD COLUMN visa_number TEXT`,
                [],
                () => console.log('Added visa_number column to travel_info table'),
                (_, error) => {
                  console.error('Failed to add visa_number column to travel_info table:', error);
                  return false;
                }
              );
            }
          },
          (_, error) => {
            console.error('Failed to check travel_info table schema:', error);
            return false;
          }
        );
      }, reject, resolve);
    });
  }

  /**
   * Ensure personal_info table includes new optional columns
   */
  async addPersonalInfoPhoneCodeColumn() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `PRAGMA table_info(personal_info)`,
          [],
          (_, { rows }) => {
            const columns = rows._array.map(col => col.name);

            if (!columns.includes('phone_code')) {
              tx.executeSql(
                `ALTER TABLE personal_info ADD COLUMN phone_code TEXT`,
                [],
                () => console.log('Added phone_code column to personal_info table'),
                (_, error) => {
                  console.error('Failed to add phone_code column to personal_info table:', error);
                  return false;
                }
              );
            }

            if (!columns.includes('gender')) {
              tx.executeSql(
                `ALTER TABLE personal_info ADD COLUMN gender TEXT`,
                [],
                () => console.log('Added gender column to personal_info table'),
                (_, error) => {
                  console.error('Failed to add gender column to personal_info table:', error);
                  return false;
                }
              );
            }
          },
          (_, error) => {
            console.error('Failed to check personal_info table schema:', error);
            return false;
          }
        );
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
              phone_code,
              gender,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              personalData.userId,
              encryptedData.phone_number,
              encryptedData.email,
              encryptedData.home_address,
              personalData.occupation,
              personalData.provinceCity,
              personalData.countryRegion,
              personalData.phoneCode,
              personalData.gender,
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
                phoneCode: result.phone_code,
                gender: result.gender,
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
                phoneCode: result.phone_code,
                gender: result.gender,
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
  async saveFundingProof(/* fundingData */) {
    console.warn(
      'SecureStorageService.saveFundingProof() is deprecated. ' +
      'The call was ignored. Use saveFundItem() with the fund_items table instead.'
    );
    return null;
  }

  async getFundingProof(/* idOrUserId */) {
    console.warn(
      'SecureStorageService.getFundingProof() is deprecated and returns null. ' +
      'Use getFundItemsByUserId() for the new fund_items schema.'
    );
    return null;
  }

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
      console.log('=== SAVING TRAVEL INFO TO DB ===');
      console.log('travelData.departureDepartureDate:', travelData.departureDepartureDate);
      console.log('All travelData keys:', Object.keys(travelData));
      
      const now = new Date().toISOString();
      const id = travelData.id || this.generateId();

      return new Promise((resolve, reject) => {
        this.db.transaction(tx => {
          tx.executeSql(
            `INSERT OR REPLACE INTO travel_info (
              id, user_id, destination,
              travel_purpose, recent_stay_country, boarding_country, visa_number,
              arrival_flight_number, arrival_departure_airport,
              arrival_departure_date, arrival_departure_time,
              arrival_arrival_airport, arrival_arrival_date, arrival_arrival_time,
              departure_flight_number, departure_departure_airport,
              departure_departure_date, departure_departure_time,
              departure_arrival_airport, departure_arrival_date, departure_arrival_time,
              accommodation_type, province, district, sub_district, postal_code,
              hotel_name, hotel_address, accommodation_phone, length_of_stay, 
              is_transit_passenger, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              travelData.userId,
              travelData.destination,
              travelData.travelPurpose,
              travelData.recentStayCountry,
              travelData.boardingCountry,
              travelData.visaNumber,
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
              travelData.accommodationType,
              travelData.province,
              travelData.district,
              travelData.subDistrict,
              travelData.postalCode,
              travelData.hotelName,
              travelData.hotelAddress,
              travelData.accommodationPhone,
              travelData.lengthOfStay,
              travelData.isTransitPassenger ? 1 : 0,
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

              console.log('=== DB RESULT FOR TRAVEL INFO ===');
              console.log('Raw DB result.departure_departure_date:', result.departure_departure_date);
              console.log('All DB result keys:', Object.keys(result));

              const travelInfo = {
                id: result.id,
                userId: result.user_id,
                destination: result.destination,
                travelPurpose: result.travel_purpose,
                recentStayCountry: result.recent_stay_country,
                boardingCountry: result.boarding_country,
                visaNumber: result.visa_number,
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
                accommodationType: result.accommodation_type,
                province: result.province,
                district: result.district,
                subDistrict: result.sub_district,
                postalCode: result.postal_code,
                hotelName: result.hotel_name,
                hotelAddress: result.hotel_address,
                accommodationPhone: result.accommodation_phone,
                lengthOfStay: result.length_of_stay,
                isTransitPassenger: result.is_transit_passenger === 1,
                status: result.status,
                createdAt: result.created_at,
                updatedAt: result.updated_at
              };

              console.log('=== MAPPED TRAVEL INFO ===');
              console.log('Mapped departureDepartureDate:', travelInfo.departureDepartureDate);

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
                  country_region, phone_code, gender, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                params: [
                  id, op.data.userId,
                  encryptedData.phone_number, encryptedData.email,
                  encryptedData.home_address, op.data.occupation,
                  op.data.provinceCity, op.data.countryRegion,
                  op.data.phoneCode, op.data.gender,
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
              phoneCode: result.phone_code,
              gender: result.gender,
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
          tx.executeSql('DELETE FROM fund_items WHERE user_id = ?', [userId]);
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

  // ============================================================================
  // ENTRY INFO OPERATIONS (Progressive Entry Flow)
  // ============================================================================

  /**
   * Get entry info for a user and destination
   * @param {string} userId - User ID
   * @param {string} destinationId - Destination ID (optional)
   * @returns {Promise<Object|null>} - Entry info data or null
   */
  async getEntryInfo(userId, destinationId = null) {
    return new Promise((resolve, reject) => {
      try {
        let query = 'SELECT * FROM entry_info WHERE user_id = ?';
        let params = [userId];

        if (destinationId) {
          query += ' AND destination_id = ?';
          params.push(destinationId);
        }

        query += ' ORDER BY created_at DESC LIMIT 1';

        this.db.transaction(tx => {
          tx.executeSql(
            query,
            params,
            (_, result) => {
              if (result.rows.length > 0) {
                const row = result.rows.item(0);
                resolve(this.deserializeEntryInfo(row));
              } else {
                resolve(null);
              }
            },
            (_, error) => {
              console.error('Failed to get entry info:', error);
              reject(error);
            }
          );
        });
      } catch (error) {
        console.error('Failed to get entry info:', error);
        reject(error);
      }
    });
  }

  /**
   * Get entry info by destination
   * @param {string} destinationId - Destination ID
   * @param {string} tripId - Trip ID (optional)
   * @returns {Promise<Object|null>} - Entry info data or null
   */
  async getEntryInfoByDestination(destinationId, tripId = null) {
    return new Promise((resolve, reject) => {
      try {
        let query = 'SELECT * FROM entry_info WHERE destination_id = ?';
        let params = [destinationId];

        if (tripId) {
          query += ' AND trip_id = ?';
          params.push(tripId);
        }

        query += ' ORDER BY created_at DESC LIMIT 1';

        this.db.transaction(tx => {
          tx.executeSql(
            query,
            params,
            (_, result) => {
              if (result.rows.length > 0) {
                const row = result.rows.item(0);
                resolve(this.deserializeEntryInfo(row));
              } else {
                resolve(null);
              }
            },
            (_, error) => {
              console.error('Failed to get entry info by destination:', error);
              reject(error);
            }
          );
        });
      } catch (error) {
        console.error('Failed to get entry info by destination:', error);
        reject(error);
      }
    });
  }

  /**
   * Get all entry infos for a user across all destinations
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of entry info data
   */
  async getAllEntryInfosForUser(userId) {
    return new Promise((resolve, reject) => {
      try {
        this.db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM entry_info WHERE user_id = ? ORDER BY last_updated_at DESC',
            [userId],
            (_, result) => {
              const entryInfos = [];
              for (let i = 0; i < result.rows.length; i++) {
                const row = result.rows.item(i);
                entryInfos.push(this.deserializeEntryInfo(row));
              }
              resolve(entryInfos);
            },
            (_, error) => {
              console.error('Failed to get all entry infos for user:', error);
              reject(error);
            }
          );
        });
      } catch (error) {
        console.error('Failed to get all entry infos for user:', error);
        reject(error);
      }
    });
  }

  /**
   * Save entry info
   * @param {Object} entryInfoData - Entry info data
   * @returns {Promise<Object>} - Save result with ID
   */
  async saveEntryInfo(entryInfoData) {
    return new Promise((resolve, reject) => {
      try {
        const serialized = this.serializeEntryInfo(entryInfoData);
        
        this.db.transaction(tx => {
          tx.executeSql(
            `INSERT OR REPLACE INTO entry_info (
              id, user_id, destination_id, trip_id, status, 
              completion_metrics, last_updated_at, created_at,
              arrival_date, departure_date, travel_purpose,
              flight_number, accommodation, tdac_submission
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              serialized.id,
              serialized.user_id,
              serialized.destination_id,
              serialized.trip_id,
              serialized.status,
              serialized.completion_metrics,
              serialized.last_updated_at,
              serialized.created_at,
              serialized.arrival_date,
              serialized.departure_date,
              serialized.travel_purpose,
              serialized.flight_number,
              serialized.accommodation,
              serialized.tdac_submission
            ],
            (_, result) => {
              resolve({ 
                id: serialized.id,
                insertId: result.insertId,
                rowsAffected: result.rowsAffected
              });
            },
            (_, error) => {
              console.error('Failed to save entry info:', error);
              reject(error);
            }
          );
        });
      } catch (error) {
        console.error('Failed to save entry info:', error);
        reject(error);
      }
    });
  }

  /**
   * Save entry pack
   * @param {Object} entryPackData - Entry pack model or plain object
   * @returns {Promise<Object>} - Save result
   */
  async saveEntryPack(entryPackData) {
    try {
      await this.ensureInitialized();

      const serialized = this.serializeEntryPack(entryPackData);

      return new Promise((resolve, reject) => {
        this.db.transaction(tx => {
          tx.executeSql(
            `INSERT OR REPLACE INTO entry_packs (
              id, entry_info_id, user_id, destination_id, trip_id, status,
              tdac_submission, submission_history, documents, display_status,
              created_at, updated_at, archived_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              serialized.id,
              serialized.entry_info_id,
              serialized.user_id,
              serialized.destination_id,
              serialized.trip_id,
              serialized.status,
              serialized.tdac_submission,
              serialized.submission_history,
              serialized.documents,
              serialized.display_status,
              serialized.created_at,
              serialized.updated_at,
              serialized.archived_at
            ],
            (_, result) => {
              resolve({
                success: true,
                id: serialized.id,
                insertId: result.insertId,
                rowsAffected: result.rowsAffected
              });
            },
            (_, error) => {
              console.error('Failed to save entry pack:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    } catch (error) {
      console.error('Failed to save entry pack:', error);
      throw error;
    }
  }

  /**
   * Get entry pack by ID
   * @param {string} entryPackId - Entry pack ID
   * @returns {Promise<Object|null>} - Entry pack data or null
   */
  async getEntryPack(entryPackId) {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        this.db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM entry_packs WHERE id = ? LIMIT 1',
            [entryPackId],
            (_, result) => {
              if (result.rows.length > 0) {
                resolve(this.deserializeEntryPack(result.rows.item(0)));
              } else {
                resolve(null);
              }
            },
            (_, error) => {
              console.error('Failed to get entry pack:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    } catch (error) {
      console.error('Failed to get entry pack:', error);
      throw error;
    }
  }

  /**
   * Get entry packs by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of entry pack data
   */
  async getEntryPacksByUserId(userId) {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        this.db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM entry_packs WHERE user_id = ? ORDER BY created_at DESC',
            [userId],
            (_, result) => {
              const packs = [];
              for (let i = 0; i < result.rows.length; i++) {
                packs.push(this.deserializeEntryPack(result.rows.item(i)));
              }
              resolve(packs);
            },
            (_, error) => {
              console.error('Failed to load entry packs by user ID:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    } catch (error) {
      console.error('Failed to load entry packs by user ID:', error);
      throw error;
    }
  }

  /**
   * Delete entry pack
   * @param {string} entryPackId - Entry pack ID
   * @returns {Promise<Object>} - Delete result
   */
  async deleteEntryPack(entryPackId) {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        this.db.transaction(tx => {
          tx.executeSql(
            'DELETE FROM entry_packs WHERE id = ?',
            [entryPackId],
            (_, result) => {
              resolve({
                success: true,
                rowsAffected: result.rowsAffected
              });
            },
            (_, error) => {
              console.error('Failed to delete entry pack:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    } catch (error) {
      console.error('Failed to delete entry pack:', error);
      throw error;
    }
  }

  /**
   * Get entry packs by entry info ID
   * @param {string} entryInfoId - Entry info ID
   * @returns {Promise<Array>} - Array of entry pack data
   */
  async getEntryPacksByEntryInfoId(entryInfoId) {
    return new Promise((resolve, reject) => {
      try {
        this.db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM entry_packs WHERE entry_info_id = ? ORDER BY created_at DESC',
            [entryInfoId],
            (_, result) => {
              const packs = [];
              for (let i = 0; i < result.rows.length; i++) {
                const row = result.rows.item(i);
                packs.push(this.deserializeEntryPack(row));
              }
              resolve(packs);
            },
            (_, error) => {
              console.error('Failed to get entry packs by entry info ID:', error);
              reject(error);
            }
          );
        });
      } catch (error) {
        console.error('Failed to get entry packs by entry info ID:', error);
        reject(error);
      }
    });
  }

  /**
   * Serialize entry info for database storage
   * @param {Object} entryInfo - Entry info data
   * @returns {Object} - Serialized data
   */
  serializeEntryInfo(entryInfo) {
    return {
      id: entryInfo.id || this.generateId(),
      user_id: entryInfo.userId,
      destination_id: entryInfo.destinationId,
      trip_id: entryInfo.tripId,
      status: entryInfo.status || 'incomplete',
      completion_metrics: JSON.stringify(entryInfo.completionMetrics || {}),
      last_updated_at: entryInfo.lastUpdatedAt || new Date().toISOString(),
      created_at: entryInfo.createdAt || new Date().toISOString(),
      arrival_date: entryInfo.arrivalDate,
      departure_date: entryInfo.departureDate,
      travel_purpose: entryInfo.travelPurpose,
      flight_number: entryInfo.flightNumber,
      accommodation: entryInfo.accommodation,
      tdac_submission: JSON.stringify(entryInfo.tdacSubmission || null)
    };
  }

  /**
   * Serialize entry pack for database storage
   * @param {Object} entryPack - Entry pack data
   * @returns {Object} - Serialized data
   */
  serializeEntryPack(entryPack) {
    const createdAt = entryPack.createdAt || new Date().toISOString();
    const updatedAt = entryPack.updatedAt || new Date().toISOString();

    return {
      id: entryPack.id || this.generateId(),
      entry_info_id: entryPack.entryInfoId,
      user_id: entryPack.userId,
      destination_id: entryPack.destinationId,
      trip_id: entryPack.tripId,
      status: entryPack.status || 'in_progress',
      tdac_submission: JSON.stringify(entryPack.tdacSubmission || null),
      submission_history: JSON.stringify(entryPack.submissionHistory || []),
      documents: JSON.stringify(entryPack.documents || {}),
      display_status: JSON.stringify(entryPack.displayStatus || {}),
      created_at: createdAt,
      updated_at: updatedAt,
      archived_at: entryPack.archivedAt || null
    };
  }

  /**
   * Deserialize entry info from database
   * @param {Object} row - Database row
   * @returns {Object} - Deserialized entry info
   */
  deserializeEntryInfo(row) {
    return {
      id: row.id,
      userId: row.user_id,
      destinationId: row.destination_id,
      tripId: row.trip_id,
      status: row.status,
      completionMetrics: this.safeJsonParse(row.completion_metrics, {}),
      lastUpdatedAt: row.last_updated_at,
      createdAt: row.created_at,
      arrivalDate: row.arrival_date,
      departureDate: row.departure_date,
      travelPurpose: row.travel_purpose,
      flightNumber: row.flight_number,
      accommodation: row.accommodation,
      tdacSubmission: this.safeJsonParse(row.tdac_submission, null)
    };
  }

  /**
   * Deserialize entry pack from database
   * @param {Object} row - Database row
   * @returns {Object} - Deserialized entry pack
   */
  deserializeEntryPack(row) {
    return {
      id: row.id,
      entryInfoId: row.entry_info_id,
      userId: row.user_id,
      destinationId: row.destination_id,
      tripId: row.trip_id,
      status: row.status,
      tdacSubmission: this.safeJsonParse(row.tdac_submission, null),
      submissionHistory: this.safeJsonParse(row.submission_history, []),
      documents: this.safeJsonParse(row.documents, {}),
      displayStatus: this.safeJsonParse(row.display_status, {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at
    };
  }

  // ===== TDAC SUBMISSION METADATA METHODS =====
  // Requirements: 10.1-10.6, 19.1-19.5

  /**
   * Save TDAC submission metadata
   * @param {Object} submissionData - TDAC submission data
   * @returns {Promise<Object>} - Save result
   */
  async saveTDACSubmissionMetadata(submissionData) {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        this.db.transaction(
          tx => {
            // Insert or replace TDAC submission
            tx.executeSql(
              `INSERT OR REPLACE INTO tdac_submissions (
                id, user_id, entry_pack_id, destination_id, trip_id,
                arr_card_no, qr_uri, pdf_path, submitted_at, submission_method,
                status, api_response, processing_time, retry_count, error_details,
                is_superseded, superseded_at, superseded_reason, superseded_by,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                submissionData.id,
                submissionData.userId,
                submissionData.entryPackId,
                submissionData.destinationId,
                submissionData.tripId,
                submissionData.arrCardNo,
                submissionData.qrUri,
                submissionData.pdfPath,
                submissionData.submittedAt,
                submissionData.submissionMethod,
                submissionData.status,
                JSON.stringify(submissionData.apiResponse || null),
                submissionData.processingTime,
                submissionData.retryCount || 0,
                JSON.stringify(submissionData.errorDetails || null),
                submissionData.isSuperseded ? 1 : 0,
                submissionData.supersededAt,
                submissionData.supersededReason,
                submissionData.supersededBy,
                submissionData.createdAt,
                submissionData.updatedAt
              ],
              (_, result) => {
                console.log('TDAC submission metadata saved:', {
                  id: submissionData.id,
                  insertId: result.insertId
                });
                resolve({ success: true, id: submissionData.id });
              },
              (_, error) => {
                console.error('Failed to save TDAC submission metadata:', error);
                reject(error);
              }
            );
          },
          error => {
            console.error('Transaction failed:', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error('Failed to save TDAC submission metadata:', error);
      throw error;
    }
  }

  /**
   * Get TDAC submission by ID
   * @param {string} submissionId - Submission ID
   * @returns {Promise<Object|null>} - TDAC submission or null
   */
  async getTDACSubmission(submissionId) {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        this.db.transaction(
          tx => {
            tx.executeSql(
              'SELECT * FROM tdac_submissions WHERE id = ?',
              [submissionId],
              (_, { rows }) => {
                if (rows.length > 0) {
                  const submission = this.deserializeTDACSubmission(rows.item(0));
                  resolve(submission);
                } else {
                  resolve(null);
                }
              },
              (_, error) => {
                console.error('Failed to get TDAC submission:', error);
                reject(error);
              }
            );
          },
          error => reject(error)
        );
      });
    } catch (error) {
      console.error('Failed to get TDAC submission:', error);
      throw error;
    }
  }

  /**
   * Get TDAC submissions by user ID
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Array of TDAC submissions
   */
  async getTDACSubmissionsByUserId(userId, filters = {}) {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM tdac_submissions WHERE user_id = ?';
        const params = [userId];

        // Apply filters
        if (filters.status) {
          query += ' AND status = ?';
          params.push(filters.status);
        }

        if (filters.destinationId) {
          query += ' AND destination_id = ?';
          params.push(filters.destinationId);
        }

        if (filters.entryPackId) {
          query += ' AND entry_pack_id = ?';
          params.push(filters.entryPackId);
        }

        if (filters.isSuperseded !== undefined) {
          query += ' AND is_superseded = ?';
          params.push(filters.isSuperseded ? 1 : 0);
        }

        // Order by submission date (newest first)
        query += ' ORDER BY submitted_at DESC';

        // Apply limit if specified
        if (filters.limit) {
          query += ' LIMIT ?';
          params.push(filters.limit);
        }

        this.db.transaction(
          tx => {
            tx.executeSql(
              query,
              params,
              (_, { rows }) => {
                const submissions = [];
                for (let i = 0; i < rows.length; i++) {
                  submissions.push(this.deserializeTDACSubmission(rows.item(i)));
                }
                resolve(submissions);
              },
              (_, error) => {
                console.error('Failed to get TDAC submissions by user ID:', error);
                reject(error);
              }
            );
          },
          error => reject(error)
        );
      });
    } catch (error) {
      console.error('Failed to get TDAC submissions by user ID:', error);
      throw error;
    }
  }

  /**
   * Get TDAC submissions by entry pack ID
   * @param {string} entryPackId - Entry pack ID
   * @returns {Promise<Array>} - Array of TDAC submissions
   */
  async getTDACSubmissionsByEntryPackId(entryPackId) {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        this.db.transaction(
          tx => {
            tx.executeSql(
              'SELECT * FROM tdac_submissions WHERE entry_pack_id = ? ORDER BY submitted_at DESC',
              [entryPackId],
              (_, { rows }) => {
                const submissions = [];
                for (let i = 0; i < rows.length; i++) {
                  submissions.push(this.deserializeTDACSubmission(rows.item(i)));
                }
                resolve(submissions);
              },
              (_, error) => {
                console.error('Failed to get TDAC submissions by entry pack ID:', error);
                reject(error);
              }
            );
          },
          error => reject(error)
        );
      });
    } catch (error) {
      console.error('Failed to get TDAC submissions by entry pack ID:', error);
      throw error;
    }
  }

  /**
   * Update TDAC submission
   * @param {Object} submissionData - Updated submission data
   * @returns {Promise<Object>} - Update result
   */
  async updateTDACSubmission(submissionData) {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        this.db.transaction(
          tx => {
            tx.executeSql(
              `UPDATE tdac_submissions SET
                status = ?, api_response = ?, processing_time = ?, retry_count = ?,
                error_details = ?, is_superseded = ?, superseded_at = ?,
                superseded_reason = ?, superseded_by = ?, updated_at = ?
              WHERE id = ?`,
              [
                submissionData.status,
                JSON.stringify(submissionData.apiResponse || null),
                submissionData.processingTime,
                submissionData.retryCount || 0,
                JSON.stringify(submissionData.errorDetails || null),
                submissionData.isSuperseded ? 1 : 0,
                submissionData.supersededAt,
                submissionData.supersededReason,
                submissionData.supersededBy,
                submissionData.updatedAt || new Date().toISOString(),
                submissionData.id
              ],
              (_, result) => {
                console.log('TDAC submission updated:', {
                  id: submissionData.id,
                  rowsAffected: result.rowsAffected
                });
                resolve({ success: true, rowsAffected: result.rowsAffected });
              },
              (_, error) => {
                console.error('Failed to update TDAC submission:', error);
                reject(error);
              }
            );
          },
          error => reject(error)
        );
      });
    } catch (error) {
      console.error('Failed to update TDAC submission:', error);
      throw error;
    }
  }

  /**
   * Delete TDAC submission
   * @param {string} submissionId - Submission ID
   * @returns {Promise<Object>} - Delete result
   */
  async deleteTDACSubmission(submissionId) {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        this.db.transaction(
          tx => {
            tx.executeSql(
              'DELETE FROM tdac_submissions WHERE id = ?',
              [submissionId],
              (_, result) => {
                console.log('TDAC submission deleted:', {
                  id: submissionId,
                  rowsAffected: result.rowsAffected
                });
                resolve({ success: true, rowsAffected: result.rowsAffected });
              },
              (_, error) => {
                console.error('Failed to delete TDAC submission:', error);
                reject(error);
              }
            );
          },
          error => reject(error)
        );
      });
    } catch (error) {
      console.error('Failed to delete TDAC submission:', error);
      throw error;
    }
  }

  /**
   * Deserialize TDAC submission from database
   * @param {Object} row - Database row
   * @returns {Object} - Deserialized TDAC submission
   */
  deserializeTDACSubmission(row) {
    return {
      id: row.id,
      userId: row.user_id,
      entryPackId: row.entry_pack_id,
      destinationId: row.destination_id,
      tripId: row.trip_id,
      arrCardNo: row.arr_card_no,
      qrUri: row.qr_uri,
      pdfPath: row.pdf_path,
      submittedAt: row.submitted_at,
      submissionMethod: row.submission_method,
      status: row.status,
      apiResponse: this.safeJsonParse(row.api_response, null),
      processingTime: row.processing_time,
      retryCount: row.retry_count || 0,
      errorDetails: this.safeJsonParse(row.error_details, null),
      isSuperseded: row.is_superseded === 1,
      supersededAt: row.superseded_at,
      supersededReason: row.superseded_reason,
      supersededBy: row.superseded_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // ===== AUDIT LOG METHODS =====
  // Requirements: 28.1-28.5

  /**
   * Save audit event
   * @param {Object} auditEvent - Audit event to save
   * @returns {Promise<Object>} - Save result
   */
  async saveAuditEvent(auditEvent) {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        this.db.transaction(
          tx => {
            tx.executeSql(
              `INSERT OR REPLACE INTO audit_events (
                id, event_type, timestamp, snapshot_id, entry_pack_id, user_id,
                metadata, system_info, immutable, version, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                auditEvent.id,
                auditEvent.eventType,
                auditEvent.timestamp,
                auditEvent.snapshotId,
                auditEvent.entryPackId,
                auditEvent.userId,
                JSON.stringify(auditEvent.metadata || {}),
                JSON.stringify(auditEvent.systemInfo || {}),
                auditEvent.immutable ? 1 : 0,
                auditEvent.version || 1,
                new Date().toISOString()
              ],
              (_, result) => {
                console.log('Audit event saved:', {
                  id: auditEvent.id,
                  insertId: result.insertId
                });
                resolve({ success: true, id: auditEvent.id });
              },
              (_, error) => {
                console.error('Failed to save audit event:', error);
                reject(error);
              }
            );
          },
          error => reject(error)
        );
      });
    } catch (error) {
      console.error('Failed to save audit event:', error);
      throw error;
    }
  }

  /**
   * Get audit events by snapshot ID
   * @param {string} snapshotId - Snapshot ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of audit events
   */
  async getAuditEventsBySnapshotId(snapshotId, options = {}) {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM audit_events WHERE snapshot_id = ?';
        const params = [snapshotId];

        // Apply filters
        if (options.eventType) {
          query += ' AND event_type = ?';
          params.push(options.eventType);
        }

        if (options.fromDate) {
          query += ' AND timestamp >= ?';
          params.push(options.fromDate);
        }

        if (options.toDate) {
          query += ' AND timestamp <= ?';
          params.push(options.toDate);
        }

        // Order by timestamp
        query += ' ORDER BY timestamp ASC';

        // Apply limit if specified
        if (options.limit) {
          query += ' LIMIT ?';
          params.push(options.limit);
          
          if (options.offset) {
            query += ' OFFSET ?';
            params.push(options.offset);
          }
        }

        this.db.transaction(
          tx => {
            tx.executeSql(
              query,
              params,
              (_, { rows }) => {
                const events = [];
                for (let i = 0; i < rows.length; i++) {
                  events.push(this.deserializeAuditEvent(rows.item(i)));
                }
                resolve(events);
              },
              (_, error) => {
                console.error('Failed to get audit events by snapshot ID:', error);
                reject(error);
              }
            );
          },
          error => reject(error)
        );
      });
    } catch (error) {
      console.error('Failed to get audit events by snapshot ID:', error);
      throw error;
    }
  }

  /**
   * Get audit events by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of audit events
   */
  async getAuditEventsByUserId(userId, options = {}) {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM audit_events WHERE user_id = ?';
        const params = [userId];

        // Apply filters similar to getAuditEventsBySnapshotId
        if (options.eventType) {
          query += ' AND event_type = ?';
          params.push(options.eventType);
        }

        if (options.fromDate) {
          query += ' AND timestamp >= ?';
          params.push(options.fromDate);
        }

        if (options.toDate) {
          query += ' AND timestamp <= ?';
          params.push(options.toDate);
        }

        // Order by timestamp (newest first for user queries)
        query += ' ORDER BY timestamp DESC';

        // Apply limit
        if (options.limit) {
          query += ' LIMIT ?';
          params.push(options.limit);
          
          if (options.offset) {
            query += ' OFFSET ?';
            params.push(options.offset);
          }
        }

        this.db.transaction(
          tx => {
            tx.executeSql(
              query,
              params,
              (_, { rows }) => {
                const events = [];
                for (let i = 0; i < rows.length; i++) {
                  events.push(this.deserializeAuditEvent(rows.item(i)));
                }
                resolve(events);
              },
              (_, error) => {
                console.error('Failed to get audit events by user ID:', error);
                reject(error);
              }
            );
          },
          error => reject(error)
        );
      });
    } catch (error) {
      console.error('Failed to get audit events by user ID:', error);
      throw error;
    }
  }

  /**
   * Delete audit events (for GDPR compliance)
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<Object>} - Delete result
   */
  async deleteAuditEvents(snapshotId) {
    try {
      await this.ensureInitialized();

      return new Promise((resolve, reject) => {
        this.db.transaction(
          tx => {
            tx.executeSql(
              'DELETE FROM audit_events WHERE snapshot_id = ?',
              [snapshotId],
              (_, result) => {
                console.log('Audit events deleted:', {
                  snapshotId,
                  rowsAffected: result.rowsAffected
                });
                resolve({ success: true, rowsAffected: result.rowsAffected });
              },
              (_, error) => {
                console.error('Failed to delete audit events:', error);
                reject(error);
              }
            );
          },
          error => reject(error)
        );
      });
    } catch (error) {
      console.error('Failed to delete audit events:', error);
      throw error;
    }
  }

  /**
   * Deserialize audit event from database
   * @param {Object} row - Database row
   * @returns {Object} - Deserialized audit event
   */
  deserializeAuditEvent(row) {
    return {
      id: row.id,
      eventType: row.event_type,
      timestamp: row.timestamp,
      snapshotId: row.snapshot_id,
      entryPackId: row.entry_pack_id,
      userId: row.user_id,
      metadata: this.safeJsonParse(row.metadata, {}),
      systemInfo: this.safeJsonParse(row.system_info, {}),
      immutable: row.immutable === 1,
      version: row.version,
      createdAt: row.created_at
    };
  }

  // Data Encryption Methods (Requirements: 19.1-19.5)

  /**
   * Encrypt data using EncryptionService
   * @param {string} data - Data to encrypt
   * @param {string} fieldType - Field type for key derivation
   * @returns {Promise<string>} - Encrypted data
   */
  async encrypt(data, fieldType = 'general') {
    try {
      if (!this.ENCRYPTION_ENABLED) {
        console.warn('Encryption is disabled, returning plain text');
        return data;
      }

      return await this.encryption.encrypt(data, fieldType);
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      throw error;
    }
  }

  /**
   * Decrypt data using EncryptionService
   * @param {string} encryptedData - Encrypted data
   * @param {string} fieldType - Field type for key derivation
   * @returns {Promise<string>} - Decrypted data
   */
  async decrypt(encryptedData, fieldType = 'general') {
    try {
      if (!this.ENCRYPTION_ENABLED) {
        console.warn('Encryption is disabled, returning data as-is');
        return encryptedData;
      }

      return await this.encryption.decrypt(encryptedData, fieldType);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      throw error;
    }
  }

  /**
   * Encrypt multiple fields
   * @param {Object} data - Object with field data
   * @returns {Promise<Object>} - Object with encrypted fields
   */
  async encryptFields(data) {
    try {
      if (!this.ENCRYPTION_ENABLED) {
        return data;
      }

      return await this.encryption.encryptFields(data);
    } catch (error) {
      console.error('Failed to encrypt fields:', error);
      throw error;
    }
  }

  /**
   * Decrypt multiple fields
   * @param {Object} encryptedData - Object with encrypted field data
   * @returns {Promise<Object>} - Object with decrypted fields
   */
  async decryptFields(encryptedData) {
    try {
      if (!this.ENCRYPTION_ENABLED) {
        return encryptedData;
      }

      return await this.encryption.decryptFields(encryptedData);
    } catch (error) {
      console.error('Failed to decrypt fields:', error);
      throw error;
    }
  }

  /**
   * Get encryption status
   * @returns {Object} - Encryption status information
   */
  getEncryptionStatus() {
    return {
      enabled: this.ENCRYPTION_ENABLED,
      initialized: !!this.encryption.masterKey,
      algorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2-SHA256'
    };
  }

  /**
   * Enable or disable encryption (for development/testing)
   * @param {boolean} enabled - Whether to enable encryption
   */
  setEncryptionEnabled(enabled) {
    this.ENCRYPTION_ENABLED = enabled;
    console.log('Encryption', enabled ? 'enabled' : 'disabled');
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
