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

import { openDatabaseAsync } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import EncryptionService from './EncryptionService';

// Legacy wrapper classes removed - now using modern async/await API directly

class SecureStorageService {
  constructor() {
    this.modernDb = null;
    this.encryption = EncryptionService;
    this.DB_NAME = 'tripsecretary_secure';
    this.DB_VERSION = '1.3.0';
    this.BACKUP_DIR = null; // Will be set in getBackupDir()
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
      if (this.modernDb) {
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

      // Open SQLite database using modern API
      console.log('Opening database:', this.DB_NAME);

      this.modernDb = await openDatabaseAsync(this.DB_NAME);

      // Run database migrations FIRST to handle existing databases
      await this.runMigrations();

      // Create tables if they don't exist (after migration)
      await this.createTables();

      // Clean up legacy funding_proof table if it exists (one-time operation)
      await this.cleanupLegacyFundingProofTable();

      // Clean up obsolete Schema v1.0 tables (one-time operation)
      await this.cleanupObsoleteTables();

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
    if (!this.modernDb) {
      throw new Error('Secure storage is not initialized. Call initialize() before accessing data.');
    }
  }

  /**
   * Create database tables for secure data storage
   * Schema Version: 2.0 (Simplified)
   * Date: 2025-10-22
   *
   * Changes in v2.0:
  
   * - Removed trip_id field (single country per entry)
   * - Added passport_countries table
   * - Replaced tdac_submissions with generic digital_arrival_cards
   * - Added is_primary to passports
   * - Added passport_id, is_default, label to personal_info
   * - Added travel_info_id, documents, display_status to entry_info
   * - Added database triggers for data integrity
   */
  async createTables() {
    try {
      // Execute all DDL statements in a single transaction for better performance
      await this.modernDb.withTransactionAsync(async () => {
        // ========================================
        // Core Tables
        // ========================================

        // Users table (local reference for foreign keys)
        await this.modernDb.execAsync(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            external_id TEXT,
            display_name TEXT,
            created_at TEXT,
            updated_at TEXT
          )
        `);

        // Passports table (with is_primary field)
        await this.modernDb.execAsync(`
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
            is_primary INTEGER DEFAULT 0,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        // Passport-Countries mapping (NEW in v2.0)
        await this.modernDb.execAsync(`
          CREATE TABLE IF NOT EXISTS passport_countries (
            passport_id TEXT NOT NULL,
            country_code TEXT NOT NULL,
            visa_required INTEGER DEFAULT 0,
            max_stay_days INTEGER,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (passport_id, country_code),
            FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE CASCADE
          )
        `);

        // Personal information table (with passport_id, is_default, label)
        await this.modernDb.execAsync(`
          CREATE TABLE IF NOT EXISTS personal_info (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            passport_id TEXT,
            encrypted_phone_number TEXT,
            encrypted_email TEXT,
            encrypted_home_address TEXT,
            occupation TEXT,
            province_city TEXT,
            country_region TEXT,
            phone_code TEXT,
            gender TEXT,
            is_default INTEGER DEFAULT 0,
            label TEXT,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE SET NULL
          )
        `);

        // Travel info table (trip-specific draft data)
        await this.modernDb.execAsync(`
          CREATE TABLE IF NOT EXISTS travel_info (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            destination TEXT,
            travel_purpose TEXT DEFAULT 'HOLIDAY',
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
            accommodation_type TEXT DEFAULT 'HOTEL',
            province TEXT,
            district TEXT,
            sub_district TEXT,
            postal_code TEXT,
            hotel_name TEXT,
            hotel_address TEXT,
            accommodation_phone TEXT,
            length_of_stay TEXT,
            is_transit_passenger INTEGER DEFAULT 0,
            status TEXT DEFAULT 'draft',
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        // Fund items table
        await this.modernDb.execAsync(`
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
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        // ========================================
        // Entry Management Tables
        // ========================================

        // Entry info table (with travel_info_id, documents, display_status)
        
        await this.modernDb.execAsync(`
          CREATE TABLE IF NOT EXISTS entry_info (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            passport_id TEXT NOT NULL,
            personal_info_id TEXT,
            travel_info_id TEXT,
            destination_id TEXT,
            status TEXT DEFAULT 'incomplete',
            completion_metrics TEXT,
            documents TEXT,
            display_status TEXT,
            last_updated_at TEXT,
            created_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (passport_id) REFERENCES passports(id),
            FOREIGN KEY (personal_info_id) REFERENCES personal_info(id),
            FOREIGN KEY (travel_info_id) REFERENCES travel_info(id)
          )
        `);

        // Entry info to fund items mapping table
        await this.modernDb.execAsync(`
          CREATE TABLE IF NOT EXISTS entry_info_fund_items (
            entry_info_id TEXT NOT NULL,
            fund_item_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            linked_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (entry_info_id, fund_item_id),
            FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE CASCADE,
            FOREIGN KEY (fund_item_id) REFERENCES fund_items(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // Digital Arrival Cards table (generic - replaces tdac_submissions)
        
        await this.modernDb.execAsync(`
          CREATE TABLE IF NOT EXISTS digital_arrival_cards (
            id TEXT PRIMARY KEY,
            entry_info_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            card_type TEXT NOT NULL,
            destination_id TEXT,
            arr_card_no TEXT,
            qr_uri TEXT,
            pdf_url TEXT,
            submitted_at TEXT NOT NULL,
            submission_method TEXT DEFAULT 'api',
            status TEXT DEFAULT 'success',
            api_response TEXT,
            processing_time INTEGER,
            retry_count INTEGER DEFAULT 0,
            error_details TEXT,
            is_superseded INTEGER DEFAULT 0,
            superseded_at TEXT,
            superseded_by TEXT,
            superseded_reason TEXT,
            version INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // ========================================
        // Legacy/Utility Tables
        // ========================================

        // Travel history table (non-sensitive data)
        await this.modernDb.execAsync(`
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
        await this.modernDb.execAsync(`
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
        await this.modernDb.execAsync(`
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TEXT
          )
        `);

        // Migrations tracking table
        await this.modernDb.execAsync(`
          CREATE TABLE IF NOT EXISTS migrations (
            user_id TEXT PRIMARY KEY,
            migrated_at TEXT,
            source TEXT
          )
        `);

        // ========================================
        // Database Triggers
        // ========================================

        // Trigger: Ensure only one primary passport per user (UPDATE)
        await this.modernDb.execAsync(`
          CREATE TRIGGER IF NOT EXISTS ensure_one_primary_passport
          BEFORE UPDATE OF is_primary ON passports
          WHEN NEW.is_primary = 1
          BEGIN
            UPDATE passports
            SET is_primary = 0
            WHERE user_id = NEW.user_id AND id != NEW.id;
          END;
        `);

        // Trigger: Ensure only one primary passport per user (INSERT)
        await this.modernDb.execAsync(`
          CREATE TRIGGER IF NOT EXISTS ensure_one_primary_passport_insert
          BEFORE INSERT ON passports
          WHEN NEW.is_primary = 1
          BEGIN
            UPDATE passports
            SET is_primary = 0
            WHERE user_id = NEW.user_id;
          END;
        `);

        // Trigger: Ensure only one default personal_info per user (UPDATE)
        await this.modernDb.execAsync(`
          CREATE TRIGGER IF NOT EXISTS ensure_one_default_personal_info
          BEFORE UPDATE OF is_default ON personal_info
          WHEN NEW.is_default = 1
          BEGIN
            UPDATE personal_info
            SET is_default = 0
            WHERE user_id = NEW.user_id AND id != NEW.id;
          END;
        `);

        // Trigger: Ensure only one default personal_info per user (INSERT)
        await this.modernDb.execAsync(`
          CREATE TRIGGER IF NOT EXISTS ensure_one_default_personal_info_insert
          BEFORE INSERT ON personal_info
          WHEN NEW.is_default = 1
          BEGIN
            UPDATE personal_info
            SET is_default = 0
            WHERE user_id = NEW.user_id;
          END;
        `);

        // Trigger: Mark previous DAC submissions as superseded
        await this.modernDb.execAsync(`
          CREATE TRIGGER IF NOT EXISTS mark_previous_dac_superseded
          AFTER INSERT ON digital_arrival_cards
          WHEN NEW.status = 'success' AND NEW.is_superseded = 0
          BEGIN
            UPDATE digital_arrival_cards
            SET
              is_superseded = 1,
              superseded_at = CURRENT_TIMESTAMP,
              superseded_by = NEW.id,
              superseded_reason = 'Replaced by newer successful submission'
            WHERE
              entry_info_id = NEW.entry_info_id
              AND card_type = NEW.card_type
              AND id != NEW.id
              AND is_superseded = 0;
          END;
        `);

        // ========================================
        // Indexes
        // ========================================

        await this.modernDb.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_passports_user ON passports(user_id);
          CREATE INDEX IF NOT EXISTS idx_passports_primary ON passports(user_id, is_primary);
          CREATE INDEX IF NOT EXISTS idx_passports_nationality ON passports(encrypted_nationality);

          CREATE INDEX IF NOT EXISTS idx_passport_countries_passport ON passport_countries(passport_id);
          CREATE INDEX IF NOT EXISTS idx_passport_countries_country ON passport_countries(country_code);

          CREATE INDEX IF NOT EXISTS idx_personal_info_user ON personal_info(user_id);
          CREATE INDEX IF NOT EXISTS idx_personal_info_passport ON personal_info(passport_id);
          CREATE INDEX IF NOT EXISTS idx_personal_info_default ON personal_info(user_id, is_default);
          CREATE INDEX IF NOT EXISTS idx_personal_info_country ON personal_info(user_id, country_region);

          CREATE INDEX IF NOT EXISTS idx_travel_info_user ON travel_info(user_id);
          CREATE INDEX IF NOT EXISTS idx_travel_info_destination ON travel_info(user_id, destination);

          CREATE INDEX IF NOT EXISTS idx_fund_items_user ON fund_items(user_id);
          CREATE INDEX IF NOT EXISTS idx_fund_items_type ON fund_items(user_id, type);

          CREATE INDEX IF NOT EXISTS idx_entry_info_user ON entry_info(user_id);
          CREATE INDEX IF NOT EXISTS idx_entry_info_passport ON entry_info(passport_id);
          CREATE INDEX IF NOT EXISTS idx_entry_info_personal ON entry_info(personal_info_id);
          CREATE INDEX IF NOT EXISTS idx_entry_info_travel ON entry_info(travel_info_id);
          CREATE INDEX IF NOT EXISTS idx_entry_info_destination ON entry_info(user_id, destination_id);
          CREATE INDEX IF NOT EXISTS idx_entry_info_status ON entry_info(user_id, status);

          CREATE INDEX IF NOT EXISTS idx_entry_info_fund_items_entry ON entry_info_fund_items(entry_info_id);
          CREATE INDEX IF NOT EXISTS idx_entry_info_fund_items_fund ON entry_info_fund_items(fund_item_id);

          CREATE INDEX IF NOT EXISTS idx_dac_entry_info ON digital_arrival_cards(entry_info_id);
          CREATE INDEX IF NOT EXISTS idx_dac_user ON digital_arrival_cards(user_id);
          CREATE INDEX IF NOT EXISTS idx_dac_card_type ON digital_arrival_cards(card_type);
          CREATE INDEX IF NOT EXISTS idx_dac_status ON digital_arrival_cards(user_id, status);
          CREATE INDEX IF NOT EXISTS idx_dac_superseded ON digital_arrival_cards(entry_info_id, card_type, is_superseded);
          CREATE INDEX IF NOT EXISTS idx_dac_arr_card_no ON digital_arrival_cards(arr_card_no);
          CREATE INDEX IF NOT EXISTS idx_dac_latest ON digital_arrival_cards(entry_info_id, card_type, is_superseded, status);
        `);

      });

      console.log('✅ Database schema v2.0 created successfully');
    } catch (error) {
      console.error('❌ Failed to create tables:', error);
      throw error;
    }
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
      // Migration 5: Update entry_info schema for passport/personal references
      await this.migrateEntryInfoTable();
      // Migration 6: Add schema v2.0 columns (is_primary, passport_id, is_default, label, etc.)
      await this.addSchemaV2Columns();

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
    try {
      // Check and update passports table
      const passportColumns = await this.modernDb.getAllAsync(`PRAGMA table_info(passports)`);
      const passportColumnNames = passportColumns.map(col => col.name);
      
      if (!passportColumnNames.includes('gender')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE passports ADD COLUMN gender TEXT`);
          console.log('Added gender column to passports table');
        } catch (error) {
          console.error('Failed to add gender column:', error);
        }
      }
      
      if (!passportColumnNames.includes('user_id')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE passports ADD COLUMN user_id TEXT`);
          console.log('Added user_id column to passports table');
        } catch (error) {
          console.error('Failed to add user_id column:', error);
        }
      }

      if (!passportColumnNames.includes('is_primary')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE passports ADD COLUMN is_primary INTEGER DEFAULT 0`);
          console.log('Added is_primary column to passports table');
        } catch (error) {
          // Column might already exist or table might not exist yet
          console.log('ℹ️ is_primary column check for passports table:', error.message.includes('already exists') ? 'already exists' : 'skipped');
        }
      }

      // Check and update personal_info table
      const personalColumns = await this.modernDb.getAllAsync(`PRAGMA table_info(personal_info)`);
      const personalColumnNames = personalColumns.map(col => col.name);
      
      if (!personalColumnNames.includes('user_id')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE personal_info ADD COLUMN user_id TEXT`);
          console.log('Added user_id column to personal_info table');
        } catch (error) {
          console.error('Failed to add user_id column to personal_info:', error);
        }
      }
    } catch (error) {
      console.error('Failed to add passport fields:', error);
      // Don't throw - allow app to continue
    }
  }

  /**
   * Ensure travel_info table includes boarding_country column
   */
  async addTravelInfoBoardingCountryColumn() {
    try {
      const columns = await this.modernDb.getAllAsync(`PRAGMA table_info(travel_info)`);
      const columnNames = columns.map(col => col.name);

      if (!columnNames.includes('boarding_country')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE travel_info ADD COLUMN boarding_country TEXT`);
          console.log('Added boarding_country column to travel_info table');
        } catch (error) {
          console.error('Failed to add boarding_country column to travel_info table:', error);
        }
      }
    } catch (error) {
      console.error('Failed to check travel_info table schema:', error);
    }
  }

  /**
   * Ensure travel_info table includes recent_stay_country column
   */
  async addTravelInfoRecentStayCountryColumn() {
    try {
      const columns = await this.modernDb.getAllAsync(`PRAGMA table_info(travel_info)`);
      const columnNames = columns.map(col => col.name);

      if (!columnNames.includes('recent_stay_country')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE travel_info ADD COLUMN recent_stay_country TEXT`);
          console.log('Added recent_stay_country column to travel_info table');
        } catch (error) {
          console.error('Failed to add recent_stay_country column to travel_info table:', error);
        }
      }
    } catch (error) {
      console.error('Failed to check travel_info table schema:', error);
    }
  }

  /**
   * Ensure travel_info table includes visa_number column
   */
  async addTravelInfoVisaNumberColumn() {
    try {
      const columns = await this.modernDb.getAllAsync(`PRAGMA table_info(travel_info)`);
      const columnNames = columns.map(col => col.name);

      if (!columnNames.includes('visa_number')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE travel_info ADD COLUMN visa_number TEXT`);
          console.log('Added visa_number column to travel_info table');
        } catch (error) {
          console.error('Failed to add visa_number column to travel_info table:', error);
        }
      }
    } catch (error) {
      console.error('Failed to check travel_info table schema:', error);
    }
  }

  /**
   * Ensure personal_info table includes new optional columns
   */
  async addPersonalInfoPhoneCodeColumn() {
    try {
      const columns = await this.modernDb.getAllAsync(`PRAGMA table_info(personal_info)`);
      const columnNames = columns.map(col => col.name);

      if (!columnNames.includes('phone_code')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE personal_info ADD COLUMN phone_code TEXT`);
          console.log('Added phone_code column to personal_info table');
        } catch (error) {
          console.error('Failed to add phone_code column to personal_info table:', error);
        }
      }

      if (!columnNames.includes('gender')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE personal_info ADD COLUMN gender TEXT`);
          console.log('Added gender column to personal_info table');
        } catch (error) {
          console.error('Failed to add gender column to personal_info table:', error);
        }
      }
    } catch (error) {
      console.error('Failed to check personal_info table schema:', error);
    }
  }

  /**
   * Migrate entry_info table to include passport/personal references and remove tdac_submission column
   */
  async migrateEntryInfoTable() {
    try {
      const columns = await this.modernDb.getAllAsync(`PRAGMA table_info(entry_info)`);
      const columnNames = columns.map(col => col.name);
      const needsPassportColumn = !columnNames.includes('passport_id');
      const needsPersonalColumn = !columnNames.includes('personal_info_id');
      const hasTdacColumn = columnNames.includes('tdac_submission');

      if (!needsPassportColumn && !needsPersonalColumn && !hasTdacColumn) {
        return;
      }

      await this.modernDb.withTransactionAsync(async () => {
        // Drop temporary table if it exists
        await this.modernDb.execAsync('DROP TABLE IF EXISTS entry_info_migrating');

        // Create new table with correct schema
        await this.modernDb.execAsync(`
          CREATE TABLE entry_info_migrating (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            passport_id TEXT,
            personal_info_id TEXT,
            destination_id TEXT,
            status TEXT DEFAULT 'incomplete',
            completion_metrics TEXT,
            last_updated_at TEXT,
            created_at TEXT,
            arrival_date TEXT,
            departure_date TEXT,
            travel_purpose TEXT,
            flight_number TEXT,
            accommodation TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (passport_id) REFERENCES passports(id),
            FOREIGN KEY (personal_info_id) REFERENCES personal_info(id)
          )
        `);

        // Copy data from old table to new table
        await this.modernDb.execAsync(`
          INSERT INTO entry_info_migrating (
            id, user_id, passport_id, personal_info_id, destination_id,
            status, completion_metrics, last_updated_at, created_at,
            arrival_date, departure_date, travel_purpose, flight_number, accommodation
          )
          SELECT
            id, user_id, NULL, NULL, destination_id,
            status, completion_metrics, last_updated_at, created_at,
            arrival_date, departure_date, travel_purpose, flight_number, accommodation
          FROM entry_info
        `);

        // Drop old table and rename new one
        await this.modernDb.execAsync('DROP TABLE entry_info');
        await this.modernDb.execAsync('ALTER TABLE entry_info_migrating RENAME TO entry_info');

        // Ensure join table exists
        await this.modernDb.execAsync(`
          CREATE TABLE IF NOT EXISTS entry_info_fund_items (
            entry_info_id TEXT NOT NULL,
            fund_item_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            linked_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (entry_info_id, fund_item_id),
            FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE CASCADE,
            FOREIGN KEY (fund_item_id) REFERENCES fund_items(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);
      });

      await this.ensureEntryInfoIndexes();
    } catch (error) {
      console.error('Entry info migration failed:', error);
      // Don't throw - allow app to continue
    }
  }

  /**
   * Ensure indexes for entry_info and associated tables are present
   */
  async ensureEntryInfoIndexes() {
    try {
      const columns = await this.modernDb.getAllAsync(`PRAGMA table_info(entry_info)`);
      const columnNames = columns.map(column => column.name);

      // Create basic indexes
      await this.modernDb.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_entry_info_user_id
        ON entry_info(user_id)
      `);

      await this.modernDb.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_entry_info_destination
        ON entry_info(user_id, destination_id)
      `);

      // Add missing columns and their indexes
      if (!columnNames.includes('passport_id')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE entry_info ADD COLUMN passport_id TEXT`);
          console.info('Added passport_id column to entry_info during index ensure');
        } catch (error) {
          console.error('Failed to add passport_id column to entry_info during index ensure:', error);
        }
      }

      if (!columnNames.includes('personal_info_id')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE entry_info ADD COLUMN personal_info_id TEXT`);
          console.info('Added personal_info_id column to entry_info during index ensure');
        } catch (error) {
          console.error('Failed to add personal_info_id column to entry_info during index ensure:', error);
        }
      }

      // Create indexes for the columns (whether they existed or were just added)
      await this.modernDb.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_entry_info_passport_id
        ON entry_info(passport_id)
      `);

      await this.modernDb.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_entry_info_personal_info_id
        ON entry_info(personal_info_id)
      `);

      // Create indexes for join table
      await this.modernDb.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_entry_info_fund_items_entry_info_id
        ON entry_info_fund_items(entry_info_id);
        CREATE INDEX IF NOT EXISTS idx_entry_info_fund_items_fund_item_id
        ON entry_info_fund_items(fund_item_id);
        CREATE INDEX IF NOT EXISTS idx_entry_info_fund_items_user_id
        ON entry_info_fund_items(user_id);
      `);
    } catch (error) {
      console.error('Failed to ensure entry info indexes:', error);
      // Don't throw - allow app to continue
    }
  }

  /**
   * Add schema v2.0 columns to existing tables
   * Migration 6: Add missing columns for schema v2.0
   */
  async addSchemaV2Columns() {
    try {
      console.log('Adding schema v2.0 columns...');

      // Add is_primary column to passports table
      const passportColumns = await this.modernDb.getAllAsync(`PRAGMA table_info(passports)`);
      const passportColumnNames = passportColumns.map(col => col.name);

      if (!passportColumnNames.includes('is_primary')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE passports ADD COLUMN is_primary INTEGER DEFAULT 0`);
          console.log('✅ Added is_primary column to passports table');
        } catch (error) {
          // Column might already exist or table might not exist yet
          console.log('ℹ️ is_primary column check for passports table:', error.message.includes('already exists') ? 'already exists' : 'skipped');
        }
      }

      // Add missing columns to personal_info table
      const personalColumns = await this.modernDb.getAllAsync(`PRAGMA table_info(personal_info)`);
      const personalColumnNames = personalColumns.map(col => col.name);

      if (!personalColumnNames.includes('passport_id')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE personal_info ADD COLUMN passport_id TEXT`);
          console.log('✅ Added passport_id column to personal_info table');
        } catch (error) {
          console.error('Failed to add passport_id column to personal_info:', error);
        }
      }

      if (!personalColumnNames.includes('is_default')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE personal_info ADD COLUMN is_default INTEGER DEFAULT 0`);
          console.log('✅ Added is_default column to personal_info table');
        } catch (error) {
          console.error('Failed to add is_default column to personal_info:', error);
        }
      }

      if (!personalColumnNames.includes('label')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE personal_info ADD COLUMN label TEXT`);
          console.log('✅ Added label column to personal_info table');
        } catch (error) {
          console.error('Failed to add label column to personal_info:', error);
        }
      }

      // Add missing columns to entry_info table
      const entryColumns = await this.modernDb.getAllAsync(`PRAGMA table_info(entry_info)`);
      const entryColumnNames = entryColumns.map(col => col.name);

      if (!entryColumnNames.includes('travel_info_id')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE entry_info ADD COLUMN travel_info_id TEXT`);
          console.log('✅ Added travel_info_id column to entry_info table');
        } catch (error) {
          console.error('Failed to add travel_info_id column to entry_info:', error);
        }
      }

      if (!entryColumnNames.includes('documents')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE entry_info ADD COLUMN documents TEXT`);
          console.log('✅ Added documents column to entry_info table');
        } catch (error) {
          console.error('Failed to add documents column to entry_info:', error);
        }
      }

      if (!entryColumnNames.includes('display_status')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE entry_info ADD COLUMN display_status TEXT`);
          console.log('✅ Added display_status column to entry_info table');
        } catch (error) {
          console.error('Failed to add display_status column to entry_info:', error);
        }
      }

      // Remove trip_id column from entry_info if it exists (schema v2.0 removes this)
      if (entryColumnNames.includes('trip_id')) {
        try {
          await this.modernDb.execAsync(`ALTER TABLE entry_info DROP COLUMN trip_id`);
          console.log('✅ Removed trip_id column from entry_info table');
        } catch (error) {
          console.error('Failed to remove trip_id column from entry_info:', error);
        }
      }

      // Create new tables if they don't exist
      await this.createNewV2Tables();

      console.log('✅ Schema v2.0 column migration completed');
    } catch (error) {
      console.error('Failed to add schema v2.0 columns:', error);
      // Don't throw - allow app to continue
    }
  }

  /**
   * Create new tables for schema v2.0
   */
  async createNewV2Tables() {
    try {
      // Check if passport_countries table exists
      const tables = await this.modernDb.getAllAsync(`SELECT name FROM sqlite_master WHERE type='table'`);
      const tableNames = tables.map(t => t.name);

      if (!tableNames.includes('passport_countries')) {
        await this.modernDb.execAsync(`
          CREATE TABLE passport_countries (
            passport_id TEXT NOT NULL,
            country_code TEXT NOT NULL,
            visa_required INTEGER DEFAULT 0,
            max_stay_days INTEGER,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (passport_id, country_code),
            FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE CASCADE
          )
        `);
        console.log('✅ Created passport_countries table');
      }

      if (!tableNames.includes('digital_arrival_cards')) {
        await this.modernDb.execAsync(`
          CREATE TABLE digital_arrival_cards (
            id TEXT PRIMARY KEY,
            entry_info_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            card_type TEXT NOT NULL,
            destination_id TEXT,
            arr_card_no TEXT,
            qr_uri TEXT,
            pdf_url TEXT,
            submitted_at TEXT NOT NULL,
            submission_method TEXT DEFAULT 'api',
            status TEXT DEFAULT 'success',
            api_response TEXT,
            processing_time INTEGER,
            retry_count INTEGER DEFAULT 0,
            error_details TEXT,
            is_superseded INTEGER DEFAULT 0,
            superseded_at TEXT,
            superseded_by TEXT,
            superseded_reason TEXT,
            version INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);
        console.log('✅ Created digital_arrival_cards table');
      }

      // Create triggers for schema v2.0
      await this.createV2Triggers();

      // Create indexes for schema v2.0
      await this.createV2Indexes();

    } catch (error) {
      console.error('Failed to create new v2.0 tables:', error);
      // Don't throw - allow app to continue
    }
  }

  /**
   * Create triggers for schema v2.0
   */
  async createV2Triggers() {
    try {
      // Trigger: Ensure only one primary passport per user (UPDATE)
      await this.modernDb.execAsync(`
        CREATE TRIGGER IF NOT EXISTS ensure_one_primary_passport
        BEFORE UPDATE OF is_primary ON passports
        WHEN NEW.is_primary = 1
        BEGIN
          UPDATE passports
          SET is_primary = 0
          WHERE user_id = NEW.user_id AND id != NEW.id;
        END;
      `);

      // Trigger: Ensure only one primary passport per user (INSERT)
      await this.modernDb.execAsync(`
        CREATE TRIGGER IF NOT EXISTS ensure_one_primary_passport_insert
        BEFORE INSERT ON passports
        WHEN NEW.is_primary = 1
        BEGIN
          UPDATE passports
          SET is_primary = 0
          WHERE user_id = NEW.user_id;
        END;
      `);

      // Trigger: Ensure only one default personal_info per user (UPDATE)
      await this.modernDb.execAsync(`
        CREATE TRIGGER IF NOT EXISTS ensure_one_default_personal_info
        BEFORE UPDATE OF is_default ON personal_info
        WHEN NEW.is_default = 1
        BEGIN
          UPDATE personal_info
          SET is_default = 0
          WHERE user_id = NEW.user_id AND id != NEW.id;
        END;
      `);

      // Trigger: Ensure only one default personal_info per user (INSERT)
      await this.modernDb.execAsync(`
        CREATE TRIGGER IF NOT EXISTS ensure_one_default_personal_info_insert
        BEFORE INSERT ON personal_info
        WHEN NEW.is_default = 1
        BEGIN
          UPDATE personal_info
          SET is_default = 0
          WHERE user_id = NEW.user_id;
        END;
      `);

      // Trigger: Mark previous DAC submissions as superseded
      await this.modernDb.execAsync(`
        CREATE TRIGGER IF NOT EXISTS mark_previous_dac_superseded
        AFTER INSERT ON digital_arrival_cards
        WHEN NEW.status = 'success' AND NEW.is_superseded = 0
        BEGIN
          UPDATE digital_arrival_cards
          SET
            is_superseded = 1,
            superseded_at = CURRENT_TIMESTAMP,
            superseded_by = NEW.id,
            superseded_reason = 'Replaced by newer successful submission'
          WHERE
            entry_info_id = NEW.entry_info_id
            AND card_type = NEW.card_type
            AND id != NEW.id
            AND is_superseded = 0;
        END;
      `);

      console.log('✅ Created schema v2.0 triggers');
    } catch (error) {
      console.error('Failed to create v2.0 triggers:', error);
    }
  }

  /**
   * Create indexes for schema v2.0
   */
  async createV2Indexes() {
    try {
      await this.modernDb.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_passports_primary ON passports(user_id, is_primary);
        CREATE INDEX IF NOT EXISTS idx_passports_nationality ON passports(encrypted_nationality);

        CREATE INDEX IF NOT EXISTS idx_passport_countries_passport ON passport_countries(passport_id);
        CREATE INDEX IF NOT EXISTS idx_passport_countries_country ON passport_countries(country_code);

        CREATE INDEX IF NOT EXISTS idx_personal_info_default ON personal_info(user_id, is_default);
        CREATE INDEX IF NOT EXISTS idx_personal_info_country ON personal_info(user_id, country_region);

        CREATE INDEX IF NOT EXISTS idx_entry_info_travel ON entry_info(travel_info_id);
        CREATE INDEX IF NOT EXISTS idx_entry_info_status ON entry_info(user_id, status);

        CREATE INDEX IF NOT EXISTS idx_dac_entry_info ON digital_arrival_cards(entry_info_id);
        CREATE INDEX IF NOT EXISTS idx_dac_user ON digital_arrival_cards(user_id);
        CREATE INDEX IF NOT EXISTS idx_dac_card_type ON digital_arrival_cards(card_type);
        CREATE INDEX IF NOT EXISTS idx_dac_status ON digital_arrival_cards(user_id, status);
        CREATE INDEX IF NOT EXISTS idx_dac_superseded ON digital_arrival_cards(entry_info_id, card_type, is_superseded);
        CREATE INDEX IF NOT EXISTS idx_dac_arr_card_no ON digital_arrival_cards(arr_card_no);
        CREATE INDEX IF NOT EXISTS idx_dac_latest ON digital_arrival_cards(entry_info_id, card_type, is_superseded, status);
      `);

      console.log('✅ Created schema v2.0 indexes');
    } catch (error) {
      console.error('Failed to create v2.0 indexes:', error);
    }
  }



  /**
   * Get backup directory path
   */
  getBackupDir() {
    if (!this.BACKUP_DIR) {
      // Use documentDirectory with fallback to cacheDirectory if documentDirectory is unavailable
      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      if (!baseDir) {
        throw new Error('No available file system directory. FileSystem.documentDirectory and FileSystem.cacheDirectory are both undefined.');
      }
      this.BACKUP_DIR = baseDir + 'backups/';
    }
    return this.BACKUP_DIR;
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory() {
    try {
      const backupPath = this.getBackupDir();
      const info = await FileSystem.getInfoAsync(backupPath);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(backupPath, { intermediates: true });
      }
    } catch (error) {
      console.warn('Warning: Could not create backup directory. Backups may not be available.', error.message);
      // Don't throw - backups are optional, don't block initialization
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
      const passportId = passportData.id || this.generateId();

      await this.modernDb.runAsync(
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
          is_primary,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          passportData.isPrimary ? 1 : 0,
          passportData.createdAt || now,
          now
        ]
      );

      // Seed passport-countries data for this passport
      await this.seedPassportCountries(passportId, encryptedData.nationality);

      await this.logAudit('INSERT', 'passports', passportId);
      return { id: passportId };
    } catch (error) {
      console.error('Failed to save passport:', error);
      throw error;
    }
  }

  /**
   * Seed passport-countries data for a specific passport
   * Based on cloudflare-backend/src/db/seed-passport-countries.sql
   * @param {string} passportId - Passport ID
   * @param {string} nationality - Nationality code (e.g., 'CHN', 'HKG', 'MAC')
   */
  async seedPassportCountries(passportId, nationality) {
    try {
      // Country data mapping: {countryCode: [visaRequired, maxStayDays, notes]}
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

      const countries = countryData[nationality];
      if (!countries) {
        console.log(`No seed data for nationality: ${nationality}`);
        return;
      }

      // Insert country data for this passport
      for (const [countryCode, [visaRequired, maxStayDays, notes]] of Object.entries(countries)) {
        await this.modernDb.runAsync(
          `INSERT OR IGNORE INTO passport_countries (
            passport_id,
            country_code,
            visa_required,
            max_stay_days,
            notes,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [passportId, countryCode, visaRequired, maxStayDays, notes, new Date().toISOString()]
        );
      }

      console.log(`✅ Seeded ${Object.keys(countries).length} countries for passport ${passportId} (${nationality})`);
    } catch (error) {
      console.error('Failed to seed passport countries:', error);
      // Don't throw - seeding failure shouldn't block passport creation
    }
  }

  /**
   * Get passport data and decrypt sensitive fields
   * @param {string} id - Passport ID
   * @returns {Object} - Decrypted passport data
   */
  async getPassport(id) {
    try {
      const result = await this.modernDb.getFirstAsync(
        'SELECT * FROM passports WHERE id = ? LIMIT 1',
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
        isPrimary: result.is_primary === 1,
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
      const id = personalData.id || this.generateId();

      await this.modernDb.runAsync(
         `INSERT OR REPLACE INTO personal_info (
           id,
           user_id,
           passport_id,
           encrypted_phone_number,
           encrypted_email,
           encrypted_home_address,
           occupation,
           province_city,
           country_region,
           phone_code,
           gender,
           is_default,
           label,
           created_at,
           updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
         [
           id,
           personalData.userId,
           personalData.passportId || null,
           encryptedData.phone_number,
           encryptedData.email,
           encryptedData.home_address,
           personalData.occupation,
           personalData.provinceCity,
           personalData.countryRegion,
           personalData.phoneCode,
           personalData.gender,
           personalData.isDefault ? 1 : 0,
           personalData.label || null,
           personalData.createdAt || now,
           now
         ]
       );

      await this.logAudit('INSERT', 'personal_info', id);
      return { id };
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
       console.log('=== SECURE STORAGE DEBUG ===');
       console.log('getPersonalInfo called with userId:', userId);
       console.log('Type of userId:', typeof userId);
       console.log('userId length:', userId?.length);

       console.log('Executing SQL query: SELECT * FROM personal_info WHERE user_id = ? LIMIT 1');
       console.log('Query parameter:', userId);

       const result = await this.modernDb.getFirstAsync(
         'SELECT * FROM personal_info WHERE user_id = ? LIMIT 1',
         [userId]
       );

       console.log('Query executed, result:', result);

       if (!result) {
         console.log('No personal info records found for userId:', userId);
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
         passportId: result.passport_id,
         phoneNumber: decryptedFields.phone_number,
         email: decryptedFields.email,
         homeAddress: decryptedFields.home_address,
         occupation: result.occupation,
         provinceCity: result.province_city,
         countryRegion: result.country_region,
         phoneCode: result.phone_code,
         gender: result.gender,
         isDefault: result.is_default === 1,
         label: result.label,
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
   * Get personal information by personal info ID (not userId)
   * @param {string} personalInfoId - Personal info ID
   * @returns {Object} - Decrypted personal information
   */
  async getPersonalInfoById(personalInfoId) {
    try {
      console.log('=== SECURE STORAGE DEBUG ===');
      console.log('getPersonalInfoById called with personalInfoId:', personalInfoId);

      console.log('Executing SQL query: SELECT * FROM personal_info WHERE id = ? LIMIT 1');
      console.log('Query parameter:', personalInfoId);

      const result = await this.modernDb.getFirstAsync(
        'SELECT * FROM personal_info WHERE id = ? LIMIT 1',
        [personalInfoId]
      );

      console.log('Query executed, result:', result);

      if (!result) {
        console.log('No personal info records found for personalInfoId:', personalInfoId);
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
        passportId: result.passport_id,
        phoneNumber: decryptedFields.phone_number,
        email: decryptedFields.email,
        homeAddress: decryptedFields.home_address,
        occupation: result.occupation,
        provinceCity: result.province_city,
        countryRegion: result.country_region,
        phoneCode: result.phone_code,
        gender: result.gender,
        isDefault: result.is_default === 1,
        label: result.label,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };

      return personalInfo;
    } catch (error) {
      console.error('Failed to get personal info by ID:', error);
      throw error;
    }
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

      // Ensure database is initialized
      await this.ensureInitialized();

      const now = new Date().toISOString();

      const result = await this.modernDb.runAsync(
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
        ]
      );

      console.log('✅ Fund item SQL INSERT successful, rows affected:', result.changes);
      await this.logAudit('INSERT', 'fund_items', fundItem.id);
      return { ...fundItem.toJSON(), updatedAt: now };
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
      // Ensure database is initialized
      await this.ensureInitialized();

      const item = await this.modernDb.getFirstAsync(
        'SELECT * FROM fund_items WHERE id = ? LIMIT 1',
        [id]
      );

      if (!item) {
        return null;
      }

      return {
        id: item.id,
        userId: item.user_id,
        type: item.type,
        amount: item.amount,
        currency: item.currency,
        details: item.details,
        photoUri: item.photo_uri,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      };
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
      
      // Ensure database is initialized
      await this.ensureInitialized();
      console.log('Querying fund items for userId:', userId);

      const rows = await this.modernDb.getAllAsync(
        'SELECT * FROM fund_items WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      console.log('Fund items query result:', rows.length, 'rows');
      const items = rows.map(item => ({
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
      return items;
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
      
      // Ensure database is initialized
      await this.ensureInitialized();
      console.log('Deleting fund item:', id);

      const result = await this.modernDb.runAsync(
        'DELETE FROM fund_items WHERE id = ?',
        [id]
      );

      console.log('✅ Fund item deleted, rows affected:', result.changes);
      await this.logAudit('DELETE', 'fund_items', id);
      return result.changes > 0;
    } catch (error) {
      console.error('SecureStorageService.deleteFundItem failed:', error);
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
      
      // Ensure database is initialized
      await this.ensureInitialized();
      console.log('Deleting fund item:', id);

      const result = await this.modernDb.runAsync(
        'DELETE FROM fund_items WHERE id = ?',
        [id]
      );

      console.log('✅ Fund item deleted, rows affected:', result.changes);
      await this.logAudit('DELETE', 'fund_items', id);
      return result.changes > 0;
    } catch (error) {
      console.error('SecureStorageService.deleteFundItem failed:', error);
      throw error;
    }
  }

  /**
   * Get all EntryInfo records for a user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Array>} - An array of EntryInfo data.
   */
  async getAllEntryInfos(userId) {
    try {
      await this.ensureInitialized();

      const rows = await this.modernDb.getAllAsync(
        'SELECT * FROM entry_info WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      return rows.map(result => ({
        id: result.id,
        userId: result.user_id,
        passportId: result.passport_id,
        personalInfoId: result.personal_info_id,
        travelInfoId: result.travel_info_id,
        destinationId: result.destination_id,
        status: result.status,
        completionMetrics: result.completion_metrics ? JSON.parse(result.completion_metrics) : null,
        documents: result.documents ? JSON.parse(result.documents) : null,
        displayStatus: result.display_status ? JSON.parse(result.display_status) : null,
        lastUpdatedAt: result.last_updated_at,
        createdAt: result.created_at,
      }));
    } catch (error) {
      console.error('Failed to get all EntryInfos:', error);
      throw error;
    }
  }

  /**
   * Get a single EntryInfo record by its ID.
   * @param {string} id - The ID of the EntryInfo record.
   * @returns {Promise<Object|null>} - An EntryInfo data object or null if not found.
   */
  async getEntryInfo(id) {
    try {
      await this.ensureInitialized();

      const result = await this.modernDb.getFirstAsync(
        'SELECT * FROM entry_info WHERE id = ? LIMIT 1',
        [id]
      );

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        userId: result.user_id,
        passportId: result.passport_id,
        personalInfoId: result.personal_info_id,
        travelInfoId: result.travel_info_id,
        destinationId: result.destination_id,
        status: result.status,
        completionMetrics: result.completion_metrics ? JSON.parse(result.completion_metrics) : null,
        documents: result.documents ? JSON.parse(result.documents) : null,
        displayStatus: result.display_status ? JSON.parse(result.display_status) : null,
        lastUpdatedAt: result.last_updated_at,
        createdAt: result.created_at,
      };
    } catch (error) {
      console.error('Failed to get EntryInfo by ID:', error);
      throw error;
    }
  }

  /**
   * Delete an EntryInfo record by its ID.
   * @param {string} id - The ID of the EntryInfo record to delete.
   * @returns {Promise<boolean>} - True if deleted successfully, false otherwise.
   */
  async deleteEntryInfo(id) {
    try {
      await this.ensureInitialized();

      const result = await this.modernDb.runAsync(
        'DELETE FROM entry_info WHERE id = ?',
        [id]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Failed to delete EntryInfo:', error);
      throw error;
    }
  }

  /**
   * Save DigitalArrivalCard data securely
   * @param {Object} dacData - DigitalArrivalCard information
   * @returns {Promise<Object>} - Save result
   */
  async saveDigitalArrivalCard(dacData) {
    try {
      await this.ensureInitialized();

      const now = new Date().toISOString();
      const id = dacData.id || this.generateId();

      await this.modernDb.runAsync(
        `INSERT OR REPLACE INTO digital_arrival_cards (
          id, entry_info_id, user_id, card_type, destination_id, arr_card_no,
          qr_uri, pdf_url, submitted_at, submission_method, status,
          api_response, processing_time, retry_count, error_details,
          is_superseded, superseded_at, superseded_by, superseded_reason,
          version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ,
        [
          id,
          dacData.entryInfoId,
          dacData.userId,
          dacData.cardType,
          dacData.destinationId,
          dacData.arrCardNo,
          dacData.qrUri,
          dacData.pdfUrl,
          dacData.submittedAt,
          dacData.submissionMethod,
          dacData.status,
          dacData.apiResponse,
          dacData.processingTime,
          dacData.retryCount,
          dacData.errorDetails,
          dacData.isSuperseded ? 1 : 0,
          dacData.supersededAt,
          dacData.supersededBy,
          dacData.supersededReason,
          dacData.version,
          dacData.createdAt || now,
          now
        ]
      );

      await this.logAudit('INSERT', 'digital_arrival_cards', id);
      return { id };
    } catch (error) {
      console.error('Failed to save DigitalArrivalCard:', error);
      throw error;
    }
  }

  /**
   * Get DigitalArrivalCard by ID
   * @param {string} id - DigitalArrivalCard ID
   * @returns {Promise<Object|null>} - DigitalArrivalCard data or null
   */
  async getDigitalArrivalCard(id) {
    try {
      await this.ensureInitialized();

      const result = await this.modernDb.getFirstAsync(
        'SELECT * FROM digital_arrival_cards WHERE id = ? LIMIT 1',
        [id]
      );

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        entryInfoId: result.entry_info_id,
        userId: result.user_id,
        cardType: result.card_type,
        destinationId: result.destination_id,
        arrCardNo: result.arr_card_no,
        qrUri: result.qr_uri,
        pdfUrl: result.pdf_url,
        submittedAt: result.submitted_at,
        submissionMethod: result.submission_method,
        status: result.status,
        apiResponse: result.api_response,
        processingTime: result.processing_time,
        retryCount: result.retry_count,
        errorDetails: result.error_details,
        isSuperseded: result.is_superseded === 1,
        supersededAt: result.superseded_at,
        supersededBy: result.superseded_by,
        supersededReason: result.superseded_reason,
        version: result.version,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      };
    } catch (error) {
      console.error('Failed to get DigitalArrivalCard:', error);
      throw error;
    }
  }

  /**
   * Get all DigitalArrivalCards for a given entryInfoId
   * @param {string} entryInfoId - EntryInfo ID
   * @returns {Promise<Array>} - Array of DigitalArrivalCard data
   */
  async getDigitalArrivalCardsByEntryInfoId(entryInfoId) {
    try {
      await this.ensureInitialized();

      const rows = await this.modernDb.getAllAsync(
        'SELECT * FROM digital_arrival_cards WHERE entry_info_id = ? ORDER BY created_at DESC',
        [entryInfoId]
      );

      return rows.map(result => ({
        id: result.id,
        entryInfoId: result.entry_info_id,
        userId: result.user_id,
        cardType: result.card_type,
        destinationId: result.destination_id,
        arrCardNo: result.arr_card_no,
        qrUri: result.qr_uri,
        pdfUrl: result.pdf_url,
        submittedAt: result.submitted_at,
        submissionMethod: result.submission_method,
        status: result.status,
        apiResponse: result.api_response,
        processingTime: result.processing_time,
        retryCount: result.retry_count,
        errorDetails: result.error_details,
        isSuperseded: result.is_superseded === 1,
        supersededAt: result.superseded_at,
        supersededBy: result.superseded_by,
        supersededReason: result.superseded_reason,
        version: result.version,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      }));
    } catch (error) {
      console.error('Failed to get DigitalArrivalCards by entryInfoId:', error);
      throw error;
    }
  }

  /**
   * Get the latest successful DigitalArrivalCard for a given entryInfoId and cardType
   * @param {string} entryInfoId - EntryInfo ID
   * @param {string} cardType - Card type (e.g., 'TDAC')
   * @returns {Promise<Object|null>} - Latest successful DigitalArrivalCard data or null
   */
  async getLatestSuccessfulDigitalArrivalCard(entryInfoId, cardType) {
    try {
      await this.ensureInitialized();

      const result = await this.modernDb.getFirstAsync(
        `SELECT * FROM digital_arrival_cards
         WHERE entry_info_id = ? AND card_type = ? AND is_superseded = 0 AND status = 'success'
         ORDER BY submitted_at DESC LIMIT 1`,
        [entryInfoId, cardType]
      );

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        entryInfoId: result.entry_info_id,
        userId: result.user_id,
        cardType: result.card_type,
        destinationId: result.destination_id,
        arrCardNo: result.arr_card_no,
        qrUri: result.qr_uri,
        pdfUrl: result.pdf_url,
        submittedAt: result.submitted_at,
        submissionMethod: result.submission_method,
        status: result.status,
        apiResponse: result.api_response,
        processingTime: result.processing_time,
        retryCount: result.retry_count,
        errorDetails: result.error_details,
        isSuperseded: result.is_superseded === 1,
        supersededAt: result.superseded_at,
        supersededBy: result.superseded_by,
        supersededReason: result.superseded_reason,
        version: result.version,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      };
    } catch (error) {
      console.error('Failed to get latest successful DigitalArrivalCard:', error);
      throw error;
    }
  }

  /**
   * Save PassportCountry data.
   * @param {Object} passportCountryData - PassportCountry information.
   * @returns {Promise<Object>} - Save result.
   */
  async savePassportCountry(passportCountryData) {
    try {
      await this.ensureInitialized();

      const now = new Date().toISOString();

      await this.modernDb.runAsync(
        `INSERT OR REPLACE INTO passport_countries (
          passport_id, country_code, visa_required, max_stay_days, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`
        ,
        [
          passportCountryData.passportId,
          passportCountryData.countryCode,
          passportCountryData.visaRequired ? 1 : 0,
          passportCountryData.maxStayDays,
          passportCountryData.notes,
          passportCountryData.createdAt || now,
        ]
      );

      await this.logAudit('INSERT', 'passport_countries', `${passportCountryData.passportId}-${passportCountryData.countryCode}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to save PassportCountry:', error);
      throw error;
    }
  }

  /**
   * Get PassportCountry by passportId and countryCode.
   * @param {string} passportId - The ID of the passport.
   * @param {string} countryCode - The country code.
   * @returns {Promise<Object|null>} - PassportCountry data or null.
   */
  async getPassportCountry(passportId, countryCode) {
    try {
      await this.ensureInitialized();

      const result = await this.modernDb.getFirstAsync(
        'SELECT * FROM passport_countries WHERE passport_id = ? AND country_code = ? LIMIT 1',
        [passportId, countryCode]
      );

      if (!result) {
        return null;
      }

      return {
        passportId: result.passport_id,
        countryCode: result.country_code,
        visaRequired: result.visa_required === 1,
        maxStayDays: result.max_stay_days,
        notes: result.notes,
        createdAt: result.created_at,
      };
    } catch (error) {
      console.error('Failed to get PassportCountry:', error);
      throw error;
    }
  }

  /**
   * Get all PassportCountry records for a given passportId.
   * @param {string} passportId - The ID of the passport.
   * @returns {Promise<Array>} - Array of PassportCountry data.
   */
  async getPassportCountriesByPassportId(passportId) {
    try {
      await this.ensureInitialized();

      const rows = await this.modernDb.getAllAsync(
        'SELECT * FROM passport_countries WHERE passport_id = ? ORDER BY country_code ASC',
        [passportId]
      );

      return rows.map(result => ({
        passportId: result.passport_id,
        countryCode: result.country_code,
        visaRequired: result.visa_required === 1,
        maxStayDays: result.max_stay_days,
        notes: result.notes,
        createdAt: result.created_at,
      }));
    } catch (error) {
      console.error('Failed to get PassportCountries by passportId:', error);
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

      const result = await this.modernDb.runAsync(
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
        ]
      );

      await this.logAudit('INSERT', 'travel_info', id);
      return { id, result };
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
    try {
      const query = destination
        ? 'SELECT * FROM travel_info WHERE user_id = ? AND destination = ? ORDER BY updated_at DESC LIMIT 1'
        : 'SELECT * FROM travel_info WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1';
      
      const params = destination ? [userId, destination] : [userId];

      const result = await this.modernDb.getFirstAsync(query, params);

      if (!result) {
        return null;
      }

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

      return travelInfo;
    } catch (error) {
      console.error('Failed to get travel info:', error);
      throw error;
    }
  }

  /**
   * Get travel information by ID
   * @param {string} id - Travel info ID
   * @returns {Promise<Object>} - Travel info data
   */
  async getTravelInfoById(id) {
    try {
      const result = await this.modernDb.getFirstAsync('SELECT * FROM travel_info WHERE id = ?', [id]);

      if (!result) {
        return null;
      }

      return {
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
    } catch (error) {
      console.error('Failed to get travel info by id:', error);
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
      const id = travelData.id || this.generateId();

      const result = await this.modernDb.runAsync(
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
        ]
      );

      await this.logAudit('INSERT', 'travel_history', id);
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
      const results = await this.modernDb.getAllAsync(
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
    try {
      const result = await this.modernDb.getFirstAsync(
        'SELECT * FROM passports WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
        [userId]
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
        isPrimary: result.is_primary === 1,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };

      return passport;
    } catch (error) {
      console.error('Failed to get user passport:', error);
      throw error;
    }
  }

  /**
   * Get all passports for a user (for passport selection)
   * @param {string} userId - User ID
   * @returns {Array} - Array of passport objects
   */
  async getAllUserPassports(userId) {
    try {
      const results = await this.modernDb.getAllAsync(
        'SELECT * FROM passports WHERE user_id = ? ORDER BY updated_at DESC',
        [userId]
      );

      if (!results || results.length === 0) {
        return [];
      }

      const passports = [];
      for (const result of results) {
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

        passports.push(passport);
      }

      return passports;
    } catch (error) {
      console.error('Failed to get all user passports:', error);
      throw error;
    }
  }

  /**
   * Clean up duplicate passports for a user, keeping only the most recent one
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of duplicate passports deleted
   */
  async cleanupDuplicatePassports(userId) {
    try {
      // First, get all passports for this user
      const rows = await this.modernDb.getAllAsync(
        'SELECT id, updated_at FROM passports WHERE user_id = ? ORDER BY updated_at DESC',
        [userId]
      );

      if (rows.length <= 1) {
        // No duplicates
        return 0;
      }

      // Keep the first one (most recent), delete the rest
      const passportsToDelete = rows.slice(1);
      const idsToDelete = passportsToDelete.map(p => p.id);
      
      if (idsToDelete.length === 0) {
        return 0;
      }

      console.log(`Cleaning up ${idsToDelete.length} duplicate passport(s) for user ${userId}`);
      console.log('Keeping most recent passport, deleting:', idsToDelete);

      // Delete duplicates
      const placeholders = idsToDelete.map(() => '?').join(',');
      const result = await this.modernDb.runAsync(
        `DELETE FROM passports WHERE id IN (${placeholders})`,
        idsToDelete
      );

      console.log(`Successfully deleted ${result.changes} duplicate passport(s)`);
      return result.changes;
    } catch (error) {
      console.error('Failed to cleanup duplicate passports:', error);
      throw error;
    }
  }

  /**
   * List all passports for a user (multi-passport support)
   * @param {string} userId - User ID
   * @returns {Array} - Array of decrypted passport data
   */
  async listUserPassports(userId) {
    try {
      const results = await this.modernDb.getAllAsync(
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
    try {
      const result = await this.modernDb.getFirstAsync(
        'SELECT * FROM migrations WHERE user_id = ? LIMIT 1',
        [userId]
      );
      
      return !result;
    } catch (error) {
      console.error('Failed to check migration status:', error);
      return true; // Assume migration needed on error
    }
  }

  /**
   * Mark migration as complete for a user
   * @param {string} userId - User ID
   * @param {string} source - Migration source (e.g., 'AsyncStorage')
   */
  async markMigrationComplete(userId, source = 'AsyncStorage') {
    try {
      const now = new Date().toISOString();
      await this.modernDb.runAsync(
        'INSERT OR REPLACE INTO migrations (user_id, migrated_at, source) VALUES (?, ?, ?)',
        [userId, now, source]
      );
      console.log(`Migration marked complete for user ${userId} from ${source}`);
    } catch (error) {
      console.error('Failed to mark migration complete:', error);
      throw error;
    }
  }

  /**
   * Get migration status for a user
   * @param {string} userId - User ID
   * @returns {Object|null} - Migration status or null if not migrated
   */
  async getMigrationStatus(userId) {
    try {
      const result = await this.modernDb.getFirstAsync(
        'SELECT * FROM migrations WHERE user_id = ? LIMIT 1',
        [userId]
      );
      
      if (!result) {
        return null;
      }
      
      return {
        userId: result.user_id,
        migratedAt: result.migrated_at,
        source: result.source
      };
    } catch (error) {
      console.error('Failed to get migration status:', error);
      return null;
    }
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
                  id, user_id, passport_id, encrypted_phone_number, encrypted_email,
                  encrypted_home_address, occupation, province_city,
                  country_region, phone_code, gender, is_default, label, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                params: [
                  id, op.data.userId, op.data.passportId || null,
                  encryptedData.phone_number, encryptedData.email,
                  encryptedData.home_address, op.data.occupation,
                  op.data.provinceCity, op.data.countryRegion,
                  op.data.phoneCode, op.data.gender,
                  op.data.isDefault ? 1 : 0, op.data.label || null,
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
      const results = [];
      
      await this.modernDb.withTransactionAsync(async () => {
        // Execute all SQL statements within the transaction
        for (const op of validOperations) {
          try {
            const result = await this.modernDb.runAsync(op.sql, op.params);
            results.push({ type: op.type, id: op.id, result });
          } catch (error) {
            console.error(`Failed to save ${op.type}:`, error);
            throw error; // This will trigger transaction rollback
          }
        }
      });

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
      
      return results;
    } catch (error) {
      console.error('Batch save failed:', error);
      throw error;
    }
  }

  // Legacy transaction helper methods removed - no longer needed with modern async/await API

  /**
   * Batch load operations for efficient data retrieval
   * Uses modern async/await pattern for better error handling
   * OPTIMIZED: Fetches all data in transaction, then decrypts outside for better performance
   * @param {string} userId - User ID
   * @param {Array<string>} dataTypes - Array of data types to load ('passport', 'personalInfo', 'fundingProof')
   * @returns {Promise<Object>} - Object containing loaded data
   */
  async batchLoad(userId, dataTypes = ['passport', 'personalInfo', 'fundingProof']) {
    try {
      console.log(`Starting batch load for user ${userId} with types:`, dataTypes);
      
      // Ensure database is initialized
      await this.ensureInitialized();
      
      if (!this.modernDb) {
        throw new Error('Modern database API not available. Please reinitialize the service.');
      }
      
      const startTime = Date.now();
      
      // Use modern API directly - no transaction wrapper to avoid execAsync issues
      const rawData = {};
      
      // Load passport if requested
      if (dataTypes.includes('passport')) {
        const passportRows = await this.modernDb.getAllAsync(
          'SELECT * FROM passports WHERE user_id = ? LIMIT 1',
          [userId]
        );
        rawData.passport = passportRows.length > 0 ? passportRows[0] : null;
      }
      
      // Load personal info if requested
      if (dataTypes.includes('personalInfo')) {
        const personalRows = await this.modernDb.getAllAsync(
          'SELECT * FROM personal_info WHERE user_id = ? LIMIT 1',
          [userId]
        );
        rawData.personalInfo = personalRows.length > 0 ? personalRows[0] : null;
      }
      
      // Legacy funding_proof load removed - use fund_items instead
      if (dataTypes.includes('fundingProof')) {
        console.warn('fundingProof type is deprecated, use fund_items instead');
        rawData.fundingProof = null;
      }
      
      const encryptedData = rawData;

      
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
              passportId: result.passport_id,
              phoneNumber: decryptedFields.phone_number,
              email: decryptedFields.email,
              homeAddress: decryptedFields.home_address,
              occupation: result.occupation,
              provinceCity: result.province_city,
              countryRegion: result.country_region,
              phoneCode: result.phone_code,
              gender: result.gender,
              isDefault: result.is_default === 1,
              label: result.label,
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
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        modernDbAvailable: !!this.modernDb,
        dbAvailable: !!this.db,
        userId: userId,
        dataTypes: dataTypes
      });
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
      await this.modernDb.withTransactionAsync(async () => {
        await this.modernDb.runAsync('DELETE FROM passports WHERE user_id = ?', [userId]);
        await this.modernDb.runAsync('DELETE FROM personal_info WHERE user_id = ?', [userId]);
        await this.modernDb.runAsync('DELETE FROM fund_items WHERE user_id = ?', [userId]);
        await this.modernDb.runAsync('DELETE FROM travel_history WHERE user_id = ?', [userId]);
        await this.modernDb.runAsync('DELETE FROM migrations WHERE user_id = ?', [userId]);
      });
      
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
      const backupFileName = `backup_${userId}_${timestamp}.db`;
      
      // Create source and destination file objects
      const sourceFile = new File(this.DB_NAME);
      const backupFile = new File(this.BACKUP_DIR, backupFileName);

      // Copy database file to backup location
      sourceFile.copy(backupFile);

      await this.logAudit('BACKUP', 'database', userId);
      return backupFile.uri;
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
    try {
      const result = await this.modernDb.getFirstAsync(
        'SELECT value FROM settings WHERE key = ?',
        [key]
      );
      return result ? result.value : null;
    } catch (error) {
      console.error('Failed to get setting:', error);
      return null;
    }
  }

  /**
   * Set setting value
   * @param {string} key - Setting key
   * @param {string} value - Setting value
   */
  async setSetting(key, value) {
    try {
      const now = new Date().toISOString();
      const result = await this.modernDb.runAsync(
        'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
        [key, value, now]
      );
      return result;
    } catch (error) {
      console.error('Failed to set setting:', error);
      throw error;
    }
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

      const result = await this.modernDb.runAsync(
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
      // Don't throw - audit logging shouldn't break the main operation
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
      const indexes = await this.modernDb.getAllAsync(
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
          const plan = await this.modernDb.getAllAsync(
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
      const indexes = await this.modernDb.getAllAsync(
        `SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'index'`
      );

      stats.totalIndexes = indexes.length;
      stats.customIndexes = indexes.filter(idx => idx.name.startsWith('idx_'));

      // Get table row counts
      const tables = ['passports', 'personal_info', 'travel_history'];
      
      for (const table of tables) {
        try {
          const result = await this.modernDb.getFirstAsync(
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
     try {
       console.log('Resetting database - dropping all tables...');

       await this.modernDb.withTransactionAsync(async () => {
         // Drop all tables
         await this.modernDb.execAsync('DROP TABLE IF EXISTS passports');
         await this.modernDb.execAsync('DROP TABLE IF EXISTS personal_info');
         await this.modernDb.execAsync('DROP TABLE IF EXISTS funding_proof');
         await this.modernDb.execAsync('DROP TABLE IF EXISTS travel_history');
         await this.modernDb.execAsync('DROP TABLE IF EXISTS audit_log');
         await this.modernDb.execAsync('DROP TABLE IF EXISTS settings');

         console.log('All tables dropped');
       });

       console.log('Recreating tables...');
       // Recreate tables
       await this.createTables();
       console.log('Database reset complete');
     } catch (error) {
       console.error('Failed to reset database:', error);
       throw error;
     }
   }

  /**
    * Truncate all user data tables - clears data while preserving schema
    * This is safer than resetDatabase() as it keeps triggers and indexes
    * @param {boolean} createBackup - Whether to create a backup before truncating
    * @returns {Promise<Object>} - Truncation results
    */
   async truncateAllUserData(createBackup = true) {
     try {
       console.log('🗑️ Starting truncation of all user data tables...');

       // Create backup if requested
       if (createBackup) {
         console.log('📦 Creating backup before truncation...');
         try {
           await this.createBackup('pre_truncation_backup');
           console.log('✅ Backup created successfully');
         } catch (backupError) {
           console.warn('⚠️ Backup creation failed, continuing with truncation:', backupError.message);
         }
       }

       const tablesToTruncate = [
         'audit_log',
         'digital_arrival_cards',
         'entry_info',
         'entry_info_fund_items',
         'fund_items',
         'passport_countries',
         'passports',
         'personal_info',
         'travel_history',
         'travel_info',
         'users'
       ];

       const results = {
         truncated: [],
         errors: [],
         rowCounts: {}
       };

       await this.modernDb.withTransactionAsync(async () => {
         for (const tableName of tablesToTruncate) {
           try {
             // Get row count before truncation
             const countResult = await this.modernDb.getFirstAsync(`SELECT COUNT(*) as count FROM ${tableName}`);
             const rowCount = countResult ? countResult.count : 0;
             results.rowCounts[tableName] = rowCount;

             console.log(`📊 ${tableName}: ${rowCount} rows to truncate`);

             // Truncate the table (DELETE FROM is safer than TRUNCATE in SQLite)
             await this.modernDb.runAsync(`DELETE FROM ${tableName}`);

             // Verify truncation
             const verifyResult = await this.modernDb.getFirstAsync(`SELECT COUNT(*) as count FROM ${tableName}`);
             const remainingCount = verifyResult ? verifyResult.count : 0;

             if (remainingCount === 0) {
               results.truncated.push(tableName);
               console.log(`✅ ${tableName} truncated successfully (${rowCount} rows deleted)`);
             } else {
               throw new Error(`Truncation verification failed for ${tableName}: ${remainingCount} rows remaining`);
             }

           } catch (error) {
             console.error(`❌ Failed to truncate ${tableName}:`, error);
             results.errors.push({ table: tableName, error: error.message });
           }
         }
       });

       // Reset settings and migrations tables as well
       try {
         await this.modernDb.runAsync('DELETE FROM settings');
         await this.modernDb.runAsync('DELETE FROM migrations');
         console.log('✅ Settings and migrations tables cleared');
       } catch (error) {
         console.warn('⚠️ Failed to clear settings/migrations:', error.message);
       }

       // Log the truncation operation
       await this.logAudit('TRUNCATE_ALL', 'all_user_tables', 'system', {
         tablesTruncated: results.truncated.length,
         totalErrors: results.errors.length,
         rowCounts: results.rowCounts
       });

       console.log('🗑️ Truncation completed!');
       console.log(`✅ Successfully truncated: ${results.truncated.length} tables`);
       if (results.errors.length > 0) {
         console.warn(`⚠️ Errors during truncation: ${results.errors.length} tables`);
         results.errors.forEach(err => console.warn(`  - ${err.table}: ${err.error}`));
       }

       return results;

     } catch (error) {
       console.error('❌ Failed to truncate all user data:', error);
       throw error;
     }
   }

  /**
    * Clean up legacy funding_proof table from existing databases
    * This is a one-time cleanup method for existing installations
    */
  async cleanupLegacyFundingProofTable() {
    try {
      console.log('Cleaning up legacy funding_proof table...');

      await this.modernDb.execAsync('DROP TABLE IF EXISTS funding_proof');
      console.log('✅ Legacy funding_proof table removed successfully');
      console.log('✅ Legacy funding_proof cleanup completed');
    } catch (error) {
      console.error('❌ Failed to cleanup funding_proof table:', error);
      throw error;
    }
  }

  /**
    * Clean up obsolete tables from Schema v1.0 that are no longer needed
    * This removes tables that were replaced in Schema v2.0
    */
  async cleanupObsoleteTables() {
    try {
      console.log('🧹 Starting cleanup of obsolete Schema v1.0 tables...');

      // Check if cleanup has already been done
      const cleanupDone = await this.getSetting('obsolete_tables_cleaned');
      if (cleanupDone === 'true') {
        console.log('ℹ️ Obsolete tables cleanup already completed');
        return;
      }

      await this.modernDb.withTransactionAsync(async () => {
        // Remove obsolete tables (all are empty, so safe to drop)
        await this.modernDb.execAsync('DROP TABLE IF EXISTS entry_packs');
        console.log('✅ Removed obsolete entry_packs table');

        await this.modernDb.execAsync('DROP TABLE IF EXISTS tdac_submissions');
        console.log('✅ Removed obsolete tdac_submissions table');

        await this.modernDb.execAsync('DROP TABLE IF EXISTS entry_pack_snapshots');
        console.log('✅ Removed obsolete entry_pack_snapshots table');

        await this.modernDb.execAsync('DROP TABLE IF EXISTS audit_events');
        console.log('✅ Removed obsolete audit_events table');

        // Remove any indexes that were associated with these tables
        await this.modernDb.execAsync('DROP INDEX IF EXISTS idx_entry_packs_user_id');
        await this.modernDb.execAsync('DROP INDEX IF EXISTS idx_entry_packs_destination_id');
        await this.modernDb.execAsync('DROP INDEX IF EXISTS idx_entry_packs_status');
        await this.modernDb.execAsync('DROP INDEX IF EXISTS idx_entry_packs_trip_id');
        await this.modernDb.execAsync('DROP INDEX IF EXISTS idx_tdac_submissions_user_id');
        await this.modernDb.execAsync('DROP INDEX IF EXISTS idx_tdac_submissions_entry_pack_id');
        await this.modernDb.execAsync('DROP INDEX IF EXISTS idx_tdac_submissions_status');
        await this.modernDb.execAsync('DROP INDEX IF EXISTS idx_tdac_submissions_submitted_at');
        await this.modernDb.execAsync('DROP INDEX IF EXISTS idx_entry_pack_snapshots_entry_pack_id');
        await this.modernDb.execAsync('DROP INDEX IF EXISTS idx_entry_pack_snapshots_created_at');
        await this.modernDb.execAsync('DROP INDEX IF EXISTS idx_audit_events_table_name');
        await this.modernDb.execAsync('DROP INDEX IF EXISTS idx_audit_events_timestamp');
        await this.modernDb.execAsync('DROP INDEX IF EXISTS idx_audit_events_record_id');

        console.log('✅ Removed obsolete indexes');
      });

      // Mark cleanup as completed
      await this.setSetting('obsolete_tables_cleaned', 'true');
      console.log('✅ Schema v1.0 obsolete tables cleanup completed successfully');

    } catch (error) {
      console.error('❌ Failed to cleanup obsolete tables:', error);
      // Don't throw - cleanup failure shouldn't break the app
    }
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
    try {
      let query = `
        SELECT ei.*, GROUP_CONCAT(DISTINCT eifi.fund_item_id) AS fund_item_ids
        FROM entry_info ei
        LEFT JOIN entry_info_fund_items eifi ON eifi.entry_info_id = ei.id
        WHERE ei.user_id = ?
      `;
      let params = [userId];

      if (destinationId) {
        query += ' AND ei.destination_id = ?';
        params.push(destinationId);
      }

      query += ' GROUP BY ei.id ORDER BY ei.created_at DESC LIMIT 1';

      const row = await this.modernDb.getFirstAsync(query, params);
      
      if (row) {
        return this.deserializeEntryInfo(row);
      } else {
        return null;
      }
    } catch (error) {
      console.error('Failed to get entry info:', error);
      throw error;
    }
  }

  /**
   * Get entry info by destination
   * @param {string} destinationId - Destination ID
   * @param {string} tripId - Trip ID (optional)
   * @returns {Promise<Object|null>} - Entry info data or null
   */
  async getEntryInfoByDestination(destinationId, tripId = null) {
    try {
      let query = `
        SELECT ei.*, GROUP_CONCAT(DISTINCT eifi.fund_item_id) AS fund_item_ids
        FROM entry_info ei
        LEFT JOIN entry_info_fund_items eifi ON eifi.entry_info_id = ei.id
        WHERE ei.destination_id = ?
      `;
      let params = [destinationId];

      if (tripId) {
        query += ' AND ei.trip_id = ?';
        params.push(tripId);
      }

      query += ' GROUP BY ei.id ORDER BY ei.created_at DESC LIMIT 1';

      const row = await this.modernDb.getFirstAsync(query, params);
      
      if (row) {
        return this.deserializeEntryInfo(row);
      } else {
        return null;
      }
    } catch (error) {
      console.error('Failed to get entry info by destination:', error);
      throw error;
    }
  }

  /**
   * Get all entry infos for a user across all destinations
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of entry info data
   */
  async getAllEntryInfosForUser(userId) {
    try {
      const rows = await this.modernDb.getAllAsync(
        `
          SELECT ei.*, GROUP_CONCAT(DISTINCT eifi.fund_item_id) AS fund_item_ids
          FROM entry_info ei
          LEFT JOIN entry_info_fund_items eifi ON eifi.entry_info_id = ei.id
          WHERE ei.user_id = ?
          GROUP BY ei.id
          ORDER BY ei.last_updated_at DESC
        `,
        [userId]
      );

      const entryInfos = rows.map(row => this.deserializeEntryInfo(row));
      return entryInfos;
    } catch (error) {
      console.error('Failed to get all entry infos for user:', error);
      throw error;
    }
  }

  /**
   * Save entry info
   * @param {Object} entryInfoData - Entry info data
   * @returns {Promise<Object>} - Save result with ID
   */
  async saveEntryInfo(entryInfoData) {
    try {
      await this.ensureInitialized();
    } catch (initError) {
      console.error('Failed to initialize secure storage before saving entry info:', initError);
      throw initError;
    }

    try {
      const serialized = this.serializeEntryInfo(entryInfoData);
      const fundItemIds = this.extractFundItemIds(entryInfoData);
      const linkedAt = new Date().toISOString();

      let insertResult = null;

      await this.modernDb.withTransactionAsync(async () => {
        insertResult = await this.modernDb.runAsync(
           `INSERT OR REPLACE INTO entry_info (
             id, user_id, passport_id, personal_info_id, travel_info_id, destination_id, status,
             completion_metrics, documents, display_status, last_updated_at, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
           [
             serialized.id,
             serialized.user_id,
             serialized.passport_id,
             serialized.personal_info_id,
             serialized.travel_info_id,
             serialized.destination_id,
             serialized.status,
             serialized.completion_metrics,
             serialized.documents,
             serialized.display_status,
             serialized.last_updated_at,
             serialized.created_at
           ]
         );

        await this.modernDb.runAsync(
          'DELETE FROM entry_info_fund_items WHERE entry_info_id = ?',
          [serialized.id]
        );

        for (const fundItemId of fundItemIds) {
          await this.modernDb.runAsync(
            `INSERT OR REPLACE INTO entry_info_fund_items (
              entry_info_id, fund_item_id, user_id, linked_at
            ) VALUES (?, ?, ?, ?)`,
            [serialized.id, fundItemId, serialized.user_id, linkedAt]
          );
        }
      });

      return {
        id: serialized.id,
        insertId: insertResult?.lastInsertRowId,
        rowsAffected: insertResult?.changes ?? 0
      };
    } catch (error) {
      console.error('Failed to save entry info:', error);
      throw error;
    }
  }

  

  /**
   * Retrieve fund items associated with an entry info record
   * @param {string} entryInfoId - Entry info identifier
   * @returns {Promise<Array>} - Array of fund item objects with link metadata
   */
  async getFundItemsForEntryInfo(entryInfoId) {
    try {
      await this.ensureInitialized();
    } catch (initError) {
      console.error('Failed to initialize storage before loading fund items:', initError);
      throw initError;
    }

    try {
      const rows = await this.modernDb.getAllAsync(
        `
          SELECT fi.*, eifi.linked_at
          FROM entry_info_fund_items eifi
          JOIN fund_items fi ON fi.id = eifi.fund_item_id
          WHERE eifi.entry_info_id = ?
          ORDER BY eifi.linked_at DESC
        `,
        [entryInfoId]
      );

      const items = rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        amount: row.amount,
        currency: row.currency,
        details: row.details,
        photoUri: row.photo_uri,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        linkedAt: row.linked_at
      }));
      
      return items;
    } catch (error) {
      console.error('Failed to get fund items for entry info:', error);
      throw error;
    }
  }

  /**
   * Safely parse JSON columns while tolerating invalid data
   * @param {*} value - Raw value from SQLite result
   * @param {*} fallback - Value to return when parsing fails
   * @returns {*} - Parsed JSON or fallback
   */
  safeJsonParse(value, fallback = null) {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    if (typeof value === 'object') {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('Failed to parse JSON value in SecureStorageService:', {
        valuePreview: typeof value === 'string' ? value.slice(0, 200) : value,
        error: error.message
      });
      return fallback;
    }
  }

  /**
   * Normalize fund item identifiers from entry info payloads
   * @param {Object} entryInfoData - Entry info payload
   * @returns {Array<string>} - List of fund item IDs
  */
  extractFundItemIds(entryInfoData = {}) {
    const identifiers = [];

    if (!entryInfoData) {
      return identifiers;
    }

    if (Array.isArray(entryInfoData.fundItemIds)) {
      identifiers.push(...entryInfoData.fundItemIds);
    } else if (Array.isArray(entryInfoData.fundItems)) {
      identifiers.push(
        ...entryInfoData.fundItems.map(item => {
          if (!item) return null;
          if (typeof item === 'string') return item;
          return item.id || item.fundItemId || null;
        })
      );
    } else if (entryInfoData.fundItemId) {
      identifiers.push(entryInfoData.fundItemId);
    }

    return Array.from(
      new Set(
        identifiers
          .map(id => (typeof id === 'string' ? id.trim() : id))
          .filter(Boolean)
      )
    );
  }

  /**
   * Parse fund item IDs from aggregated SQL field
   * @param {string|null} aggregatedIds - Comma-separated fund item IDs
   * @returns {Array<string>} - List of fund item IDs
   */
  parseFundItemIds(aggregatedIds) {
    if (!aggregatedIds || typeof aggregatedIds !== 'string') {
      return [];
    }

    return aggregatedIds
      .split(',')
      .map(id => id?.trim())
      .filter(Boolean);
  }

  /**
   * Serialize entry info for database storage (v2.0 schema)
   * @param {Object} entryInfo - Entry info data
   * @returns {Object} - Serialized data
   */
  serializeEntryInfo(entryInfo) {
    return {
      id: entryInfo.id || this.generateId(),
      user_id: entryInfo.userId,
      passport_id: entryInfo.passportId,
      personal_info_id: entryInfo.personalInfoId || null,
      travel_info_id: entryInfo.travelInfoId || null,
      destination_id: entryInfo.destinationId,
      status: entryInfo.status || 'incomplete',
      completion_metrics: JSON.stringify(entryInfo.completionMetrics || {}),
      documents: JSON.stringify(entryInfo.documents || null),
      display_status: JSON.stringify(entryInfo.displayStatus || null),
      last_updated_at: entryInfo.lastUpdatedAt || new Date().toISOString(),
      created_at: entryInfo.createdAt || new Date().toISOString()
    };
  }

  /**
   * Deserialize entry info from database (v2.0 schema)
   * @param {Object} row - Database row
   * @returns {Object} - Deserialized entry info
   */
  deserializeEntryInfo(row) {
    return {
      id: row.id,
      userId: row.user_id,
      passportId: row.passport_id,
      personalInfoId: row.personal_info_id,
      travelInfoId: row.travel_info_id,
      destinationId: row.destination_id,
      status: row.status,
      completionMetrics: this.safeJsonParse(row.completion_metrics, {}),
      documents: this.safeJsonParse(row.documents, null),
      displayStatus: this.safeJsonParse(row.display_status, null),
      lastUpdatedAt: row.last_updated_at,
      createdAt: row.created_at
    };
  }



  // ===== TDAC SUBMISSION METADATA METHODS =====
  // Requirements: 10.1-10.6, 19.1-19.5

  /**
   * Save digital arrival card (v2.0 schema)
   * @param {Object} cardData - Digital arrival card data
   * @returns {Promise<Object>} - Save result
   */
  async saveDigitalArrivalCard(cardData) {
    try {
      await this.ensureInitialized();

      const result = await this.modernDb.runAsync(
        `INSERT OR REPLACE INTO digital_arrival_cards (
          id, entry_info_id, user_id, card_type, destination_id,
          arr_card_no, qr_uri, pdf_url, submitted_at, submission_method,
          status, api_response, processing_time, retry_count, error_details,
          is_superseded, superseded_at, superseded_reason, superseded_by,
          version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cardData.id,
          cardData.entryInfoId,
          cardData.userId,
          cardData.cardType || 'TDAC',
          cardData.destinationId,
          cardData.arrCardNo,
          cardData.qrUri,
          cardData.pdfUrl,
          cardData.submittedAt,
          cardData.submissionMethod || 'api',
          cardData.status || 'success',
          JSON.stringify(cardData.apiResponse || null),
          cardData.processingTime,
          cardData.retryCount || 0,
          JSON.stringify(cardData.errorDetails || null),
          cardData.isSuperseded ? 1 : 0,
          cardData.supersededAt,
          cardData.supersededReason,
          cardData.supersededBy,
          cardData.version || 1,
          cardData.createdAt,
          cardData.updatedAt
        ]
      );

      console.log('Digital arrival card saved:', {
        id: cardData.id,
        entryInfoId: cardData.entryInfoId,
        cardType: cardData.cardType || 'TDAC',
        insertId: result.lastInsertRowId
      });
      
      return { success: true, id: cardData.id };
    } catch (error) {
      console.error('Failed to save digital arrival card:', error);
      throw error;
    }
  }

  /**
   * Get digital arrival card by ID (v2.0 schema)
   * @param {string} cardId - Card ID
   * @returns {Promise<Object|null>} - Digital arrival card or null
   */
  async getDigitalArrivalCard(cardId) {
    try {
      await this.ensureInitialized();

      const row = await this.modernDb.getFirstAsync(
        'SELECT * FROM digital_arrival_cards WHERE id = ?',
        [cardId]
      );

      if (row) {
        const card = this.deserializeDigitalArrivalCard(row);
        return card;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Failed to get digital arrival card:', error);
      throw error;
    }
  }

  /**
   * Get digital arrival cards by user ID (v2.0 schema)
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Array of digital arrival cards
   */
  async getDigitalArrivalCardsByUserId(userId, filters = {}) {
    try {
      await this.ensureInitialized();

      let query = 'SELECT * FROM digital_arrival_cards WHERE user_id = ?';
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

      if (filters.entryInfoId) {
        query += ' AND entry_info_id = ?';
        params.push(filters.entryInfoId);
      }

      if (filters.cardType) {
        query += ' AND card_type = ?';
        params.push(filters.cardType);
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

      const rows = await this.modernDb.getAllAsync(query, params);
      const cards = rows.map(row => this.deserializeDigitalArrivalCard(row));
      return cards;
    } catch (error) {
      console.error('Failed to get digital arrival cards by user ID:', error);
      throw error;
    }
  }

  /**
   * Get digital arrival cards by entry info ID (v2.0 schema)
   * @param {string} entryInfoId - Entry info ID
   * @returns {Promise<Array>} - Array of digital arrival cards
   */
  async getDigitalArrivalCardsByEntryInfoId(entryInfoId) {
    try {
      await this.ensureInitialized();

      const rows = await this.modernDb.getAllAsync(
        'SELECT * FROM digital_arrival_cards WHERE entry_info_id = ? ORDER BY submitted_at DESC',
        [entryInfoId]
      );

      const cards = rows.map(row => this.deserializeDigitalArrivalCard(row));
      return cards;
    } catch (error) {
      console.error('Failed to get digital arrival cards by entry info ID:', error);
      throw error;
    }
  }

  /**
   * Update digital arrival card (v2.0 schema)
   * @param {Object} cardData - Updated card data
   * @returns {Promise<Object>} - Update result
   */
  async updateDigitalArrivalCard(cardData) {
    try {
      await this.ensureInitialized();

      const result = await this.modernDb.runAsync(
        `UPDATE digital_arrival_cards SET
          status = ?, api_response = ?, processing_time = ?, retry_count = ?,
          error_details = ?, is_superseded = ?, superseded_at = ?,
          superseded_reason = ?, superseded_by = ?, version = ?, updated_at = ?
        WHERE id = ?`,
        [
          cardData.status,
          JSON.stringify(cardData.apiResponse || null),
          cardData.processingTime,
          cardData.retryCount || 0,
          JSON.stringify(cardData.errorDetails || null),
          cardData.isSuperseded ? 1 : 0,
          cardData.supersededAt,
          cardData.supersededReason,
          cardData.supersededBy,
          cardData.version || 1,
          cardData.updatedAt || new Date().toISOString(),
          cardData.id
        ]
      );

      console.log('Digital arrival card updated:', {
        id: cardData.id,
        rowsAffected: result.changes
      });
      
      return { success: true, rowsAffected: result.changes };
    } catch (error) {
      console.error('Failed to update digital arrival card:', error);
      throw error;
    }
  }

  /**
   * Delete digital arrival card (v2.0 schema)
   * @param {string} cardId - Card ID
   * @returns {Promise<Object>} - Delete result
   */
  async deleteDigitalArrivalCard(cardId) {
    try {
      await this.ensureInitialized();

      const result = await this.modernDb.runAsync(
        'DELETE FROM digital_arrival_cards WHERE id = ?',
        [cardId]
      );

      console.log('Digital arrival card deleted:', {
        id: cardId,
        rowsAffected: result.changes
      });
      
      return { success: true, rowsAffected: result.changes };
    } catch (error) {
      console.error('Failed to delete digital arrival card:', error);
      throw error;
    }
  }

  /**
   * Deserialize digital arrival card from database (v2.0 schema)
   * @param {Object} row - Database row
   * @returns {Object} - Deserialized digital arrival card
   */
  deserializeDigitalArrivalCard(row) {
    return {
      id: row.id,
      entryInfoId: row.entry_info_id,
      userId: row.user_id,
      cardType: row.card_type,
      destinationId: row.destination_id,
      arrCardNo: row.arr_card_no,
      qrUri: row.qr_uri,
      pdfUrl: row.pdf_url,
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
      version: row.version || 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
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
      if (this.modernDb) {
        await this.modernDb.closeAsync();
        this.modernDb = null;
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
