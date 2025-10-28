/**
 * Database Schema Definition
 * Schema Version: 2.0
 * Date: 2025-10-22
 *
 * Manages all database table definitions, triggers, and indexes
 * for the TripSecretary secure storage system.
 */

class DatabaseSchema {
  constructor() {
    this.DB_VERSION = '1.3.0';
  }

  /**
   * Create all database tables with schema v2.0
   * @param {Object} db - Modern database instance
   */
  async createTables(db) {
    try {
      await db.withTransactionAsync(async () => {
        // ========================================
        // Core Tables
        // ========================================

        // Users table (local reference for foreign keys)
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            external_id TEXT,
            display_name TEXT,
            created_at TEXT,
            updated_at TEXT
          )
        `);

        // Passports table (with is_primary field)
        await db.execAsync(`
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

        // Passport-Countries mapping
        await db.execAsync(`
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

        // Personal information table
        await db.execAsync(`
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

        // Fund items table
        await db.execAsync(`
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

        // Entry info table (created BEFORE travel_info to satisfy foreign key constraints)
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS entry_info (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            passport_id TEXT,              -- Nullable: allow creation without passport, can be added later
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
            FOREIGN KEY (personal_info_id) REFERENCES personal_info(id)
          )
        `);

        // Travel info table (trip-specific draft data)
        // Note: entry_info_id is nullable during creation, becomes set when linked to entry_info
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS travel_info (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            entry_info_id TEXT UNIQUE,
            destination TEXT,
            travel_purpose TEXT DEFAULT 'HOLIDAY',
            recent_stay_country TEXT,
            boarding_country TEXT,
            visa_number TEXT,
            arrival_flight_number TEXT,
            arrival_departure_airport TEXT,
            arrival_departure_date TEXT,
            arrival_arrival_airport TEXT,
            arrival_arrival_date TEXT,
            arrival_flight_ticket_photo_uri TEXT,
            departure_flight_number TEXT,
            departure_departure_airport TEXT,
            departure_departure_date TEXT,
            departure_arrival_airport TEXT,
            departure_arrival_date TEXT,
            departure_flight_ticket_photo_uri TEXT,
            accommodation_type TEXT DEFAULT 'HOTEL',
            province TEXT,
            district TEXT,
            sub_district TEXT,
            postal_code TEXT,
            hotel_name TEXT,
            hotel_address TEXT,
            hotel_booking_photo_uri TEXT,
            accommodation_phone TEXT,
            length_of_stay TEXT,
            is_transit_passenger INTEGER DEFAULT 0,
            status TEXT DEFAULT 'draft',
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE SET NULL
          )
        `);

        // Entry info to fund items mapping table
        await db.execAsync(`
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

        // Digital Arrival Cards table
        await db.execAsync(`
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
        await db.execAsync(`
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
        await db.execAsync(`
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
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TEXT
          )
        `);

        // ========================================
        // Database Triggers
        // ========================================
        await this.createTriggers(db);
      });

      // Apply any pending migrations BEFORE creating indexes
      // This ensures all columns exist before we try to create indexes on them
      await this.applyMigrations(db);

      // ========================================
      // Indexes (created after migrations to ensure all columns exist)
      // ========================================
      await this.createIndexes(db);

      console.log('✅ Database schema v2.0 created successfully');
    } catch (error) {
      console.error('❌ Failed to create tables:', error);
      throw error;
    }
  }

  /**
   * Create database triggers for data integrity
   * @param {Object} db - Modern database instance
   */
  async createTriggers(db) {
    // Trigger: Ensure only one primary passport per user (UPDATE)
    await db.execAsync(`
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
    await db.execAsync(`
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
    await db.execAsync(`
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
    await db.execAsync(`
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
    await db.execAsync(`
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
  }

  /**
   * Apply schema migrations for existing databases
   * @param {Object} db - Modern database instance
   */
  async applyMigrations(db) {
    try {
      // Migration: Add entry_info_id column to travel_info table (v1.3.0 -> v1.4.0)
      const travelInfoTableInfo = await db.getAllAsync("PRAGMA table_info(travel_info)");
      const hasEntryInfoId = travelInfoTableInfo.some(col => col.name === 'entry_info_id');

      if (!hasEntryInfoId) {
        console.log('Applying migration: Adding entry_info_id to travel_info table');
        // Note: SQLite doesn't support adding UNIQUE or foreign key constraints via ALTER TABLE
        // We add the column without UNIQUE constraint for existing databases
        // New databases will have the UNIQUE constraint from the initial schema
        await db.execAsync(`
          ALTER TABLE travel_info ADD COLUMN entry_info_id TEXT;
        `);
        console.log('✅ Migration completed: entry_info_id column added to travel_info');
      }

      // Migration for entry_info to make passport_id nullable
      const entryInfoTableInfo = await db.getAllAsync("PRAGMA table_info(entry_info)");
      const passportIdColumn = entryInfoTableInfo.find(col => col.name === 'passport_id');

      if (passportIdColumn && passportIdColumn.notnull) {
        console.log('Applying migration: Making passport_id in entry_info nullable');
        await db.withTransactionAsync(async () => {
          await db.execAsync('ALTER TABLE entry_info RENAME TO entry_info_old;');
          await db.execAsync(`
            CREATE TABLE entry_info (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              passport_id TEXT,
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
              FOREIGN KEY (personal_info_id) REFERENCES personal_info(id)
            );
          `);
          const columns = entryInfoTableInfo.map(col => col.name).join(', ');
          await db.execAsync(`INSERT INTO entry_info (${columns}) SELECT ${columns} FROM entry_info_old;`);
          await db.execAsync('DROP TABLE entry_info_old;');
        });
        console.log('✅ Migration completed: passport_id in entry_info is now nullable');
      }

      // Migration: Add photo columns to travel_info table
      const travelInfoColumns = await db.getAllAsync("PRAGMA table_info(travel_info)");
      const hasArrivalFlightTicketPhoto = travelInfoColumns.some(col => col.name === 'arrival_flight_ticket_photo_uri');
      const hasDepartureFlightTicketPhoto = travelInfoColumns.some(col => col.name === 'departure_flight_ticket_photo_uri');
      const hasHotelBookingPhoto = travelInfoColumns.some(col => col.name === 'hotel_booking_photo_uri');

      if (!hasArrivalFlightTicketPhoto) {
        console.log('Applying migration: Adding arrival_flight_ticket_photo_uri to travel_info table');
        await db.execAsync(`
          ALTER TABLE travel_info ADD COLUMN arrival_flight_ticket_photo_uri TEXT;
        `);
        console.log('✅ Migration completed: arrival_flight_ticket_photo_uri column added to travel_info');
      }

      if (!hasDepartureFlightTicketPhoto) {
        console.log('Applying migration: Adding departure_flight_ticket_photo_uri to travel_info table');
        await db.execAsync(`
          ALTER TABLE travel_info ADD COLUMN departure_flight_ticket_photo_uri TEXT;
        `);
        console.log('✅ Migration completed: departure_flight_ticket_photo_uri column added to travel_info');
      }

      if (!hasHotelBookingPhoto) {
        console.log('Applying migration: Adding hotel_booking_photo_uri to travel_info table');
        await db.execAsync(`
          ALTER TABLE travel_info ADD COLUMN hotel_booking_photo_uri TEXT;
        `);
        console.log('✅ Migration completed: hotel_booking_photo_uri column added to travel_info');
      }

      // Migration: Add entry_guide_progress table (v1.4.0)
      const entryGuideProgressExists = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='entry_guide_progress'");

      if (entryGuideProgressExists.length === 0) {
        console.log('Applying migration: Creating entry_guide_progress table');
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS entry_guide_progress (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            country_code TEXT NOT NULL,
            current_step INTEGER DEFAULT 0,
            total_steps INTEGER NOT NULL,
            completed_steps TEXT,
            answers TEXT,
            last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, country_code)
          );
        `);

        // Create trigger for auto-update timestamp
        await db.execAsync(`
          CREATE TRIGGER IF NOT EXISTS update_entry_guide_progress_timestamp
          AFTER UPDATE ON entry_guide_progress
          BEGIN
            UPDATE entry_guide_progress
            SET last_updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.id;
          END;
        `);

        console.log('✅ Migration completed: entry_guide_progress table created');
      }

      // Migration: Add tdac_submission_logs table (v1.4.0)
      const tdacSubmissionLogsExists = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='tdac_submission_logs'");

      if (tdacSubmissionLogsExists.length === 0) {
        console.log('Applying migration: Creating tdac_submission_logs table');
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS tdac_submission_logs (
            id TEXT PRIMARY KEY,
            user_id INTEGER,
            submission_method TEXT NOT NULL,
            arr_card_no TEXT,
            traveler_data TEXT,
            field_mappings TEXT,
            validation_results TEXT,
            cloudflare_token_length INTEGER,
            submission_timestamp DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
          );
        `);

        // Create trigger for auto-cleanup (delete logs older than 90 days)
        await db.execAsync(`
          CREATE TRIGGER IF NOT EXISTS cleanup_old_tdac_logs
          AFTER INSERT ON tdac_submission_logs
          BEGIN
            DELETE FROM tdac_submission_logs
            WHERE submission_timestamp < datetime('now', '-90 days');
          END;
        `);

        console.log('✅ Migration completed: tdac_submission_logs table created');
      }
    } catch (error) {
      console.error('Migration error:', error);
      // Don't throw - some migrations may fail on certain databases, but we can continue
    }
  }

  /**
   * Create database indexes for performance
   * @param {Object} db - Modern database instance
   */
  async createIndexes(db) {
    await db.execAsync(`
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
      CREATE INDEX IF NOT EXISTS idx_travel_info_entry_info ON travel_info(entry_info_id);

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

      CREATE INDEX IF NOT EXISTS idx_entry_guide_user ON entry_guide_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_entry_guide_country ON entry_guide_progress(country_code);
      CREATE INDEX IF NOT EXISTS idx_entry_guide_updated ON entry_guide_progress(last_updated_at);

      CREATE INDEX IF NOT EXISTS idx_tdac_logs_user ON tdac_submission_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_tdac_logs_method ON tdac_submission_logs(submission_method);
      CREATE INDEX IF NOT EXISTS idx_tdac_logs_timestamp ON tdac_submission_logs(submission_timestamp);
      CREATE INDEX IF NOT EXISTS idx_tdac_logs_created ON tdac_submission_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_tdac_logs_arr_card ON tdac_submission_logs(arr_card_no);
    `);
  }
}

export default new DatabaseSchema();
