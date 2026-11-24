/**
 * Database Schema Definition
 * Schema Version: 2.0
 * Date: 2025-10-22
 *
 * Manages all database table definitions, triggers, and indexes
 * for the TripSecretary secure storage system.
 */

type TableInfoRow = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: unknown;
  pk: number;
};

type SQLiteMasterRow = {
  name: string;
};

type MigrationCountRow = {
  count: number;
};

interface DatabaseClient {
  withTransactionAsync<T>(fn: () => Promise<T>): Promise<T>;
  execAsync(sql: string): Promise<void>;
  getAllAsync<T = Record<string, unknown>>(sql: string): Promise<T[]>;
  getFirstAsync<T = Record<string, unknown>>(sql: string): Promise<T | null>;
}

class DatabaseSchema {
  readonly DB_VERSION = '1.3.0';

  async createTables(db: DatabaseClient): Promise<void> {
    try {
      await db.withTransactionAsync(async () => {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            external_id TEXT,
            display_name TEXT,
            created_at TEXT,
            updated_at TEXT
          )
        `);

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

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS entry_info (
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
          )
        `);

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

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TEXT
          )
        `);

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS snapshots (
            snapshot_id TEXT PRIMARY KEY,
            entry_info_id TEXT,
            user_id TEXT NOT NULL,
            destination_id TEXT,
            status TEXT NOT NULL CHECK (status IN ('completed', 'cancelled', 'expired')),
            created_at TEXT NOT NULL,
            arrival_date TEXT,
            version INTEGER DEFAULT 1,
            metadata TEXT,
            passport_data TEXT,
            personal_info_data TEXT,
            funds_data TEXT,
            travel_data TEXT,
            tdac_submission_data TEXT,
            completeness_indicator TEXT,
            photo_manifest TEXT,
            encryption_info TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE SET NULL
          )
        `);

        await this.createTriggers(db);
      });

      await this.applyMigrations(db);
      await this.createIndexes(db);

      console.log('✅ Database schema v2.0 created successfully');
    } catch (error: unknown) {
      console.error('❌ Failed to create tables:', error);
      throw error;
    }
  }

  async createTriggers(db: DatabaseClient): Promise<void> {
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

  async applyMigrations(db: DatabaseClient): Promise<void> {
    try {
      const travelInfoTableInfo = await db.getAllAsync<TableInfoRow>('PRAGMA table_info(travel_info)');
      const hasEntryInfoId = travelInfoTableInfo.some(col => col.name === 'entry_info_id');

      if (!hasEntryInfoId) {
        console.log('Applying migration: Adding entry_info_id to travel_info table');
        await db.execAsync(`
          ALTER TABLE travel_info ADD COLUMN entry_info_id TEXT;
        `);
        console.log('✅ Migration completed: entry_info_id column added to travel_info');
      }

      const entryInfoTableInfo = await db.getAllAsync<TableInfoRow>('PRAGMA table_info(entry_info)');
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

      const travelInfoColumns = await db.getAllAsync<TableInfoRow>('PRAGMA table_info(travel_info)');
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

      const entryGuideProgressExists = await db.getAllAsync<SQLiteMasterRow>("SELECT name FROM sqlite_master WHERE type='table' AND name='entry_guide_progress'");

      if (entryGuideProgressExists.length === 0) {
        console.log('Applying migration: Creating entry_guide_progress table');
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS entry_guide_progress (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
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

      const tdacSubmissionLogsExists = await db.getAllAsync<SQLiteMasterRow>("SELECT name FROM sqlite_master WHERE type='table' AND name='tdac_submission_logs'");

      if (tdacSubmissionLogsExists.length === 0) {
        console.log('Applying migration: Creating tdac_submission_logs table');
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS tdac_submission_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
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

      const snapshotsTableInfo = await db.getAllAsync<TableInfoRow>('PRAGMA table_info(snapshots)');
      const hasOldId = snapshotsTableInfo.some(col => col.name === 'id');
      const hasEntryPackId = snapshotsTableInfo.some(col => col.name === 'entry_pack_id');
      const hasTripId = snapshotsTableInfo.some(col => col.name === 'trip_id');

      if (hasOldId || hasEntryPackId || hasTripId) {
        console.log('Applying migration: Updating snapshots table schema');
        await db.withTransactionAsync(async () => {
          await db.execAsync('DROP TABLE IF EXISTS snapshots_old;');
          await db.execAsync('ALTER TABLE snapshots RENAME TO snapshots_old;');

          await db.execAsync(`
            CREATE TABLE snapshots (
              snapshot_id TEXT PRIMARY KEY,
              entry_info_id TEXT,
              user_id TEXT NOT NULL,
              destination_id TEXT,
              status TEXT NOT NULL CHECK (status IN ('completed', 'cancelled', 'expired')),
              created_at TEXT NOT NULL,
              arrival_date TEXT,
              version INTEGER DEFAULT 1,
              metadata TEXT,
              passport_data TEXT,
              personal_info_data TEXT,
              funds_data TEXT,
              travel_data TEXT,
              tdac_submission_data TEXT,
              completeness_indicator TEXT,
              photo_manifest TEXT,
              encryption_info TEXT,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE SET NULL
            );
          `);

          const oldSnapshotsCount = await db.getFirstAsync<MigrationCountRow>('SELECT COUNT(*) as count FROM snapshots_old');
          if (oldSnapshotsCount && oldSnapshotsCount.count > 0) {
            console.log(`Migrating ${oldSnapshotsCount.count} snapshots to new schema...`);

            const oldTableInfo = await db.getAllAsync<TableInfoRow>('PRAGMA table_info(snapshots_old)');
            const oldHasUserId = oldTableInfo.some(col => col.name === 'user_id');

            if (!oldHasUserId) {
              console.warn('⚠️ Old snapshots table missing user_id column, skipping data migration');
              await db.execAsync('DROP TABLE snapshots_old;');
              return;
            }

            await db.execAsync(`
              INSERT INTO snapshots (
                snapshot_id, entry_info_id, user_id, destination_id, status,
                created_at, arrival_date, version, metadata,
                passport_data, personal_info_data, funds_data, travel_data,
                tdac_submission_data, completeness_indicator, photo_manifest, encryption_info
              )
              SELECT
                snapshot_id,
                entry_pack_id as entry_info_id,
                user_id,
                destination_id,
                status,
                created_at,
                arrival_date,
                version,
                metadata,
                passport_data,
                personal_info_data,
                funds_data,
                travel_data,
                tdac_submission_data,
                completeness_indicator,
                photo_manifest,
                encryption_info
              FROM snapshots_old;
            `);

            console.log(`✅ Migrated ${oldSnapshotsCount.count} snapshots`);
          }

          await db.execAsync('DROP TABLE snapshots_old;');
        });
        console.log('✅ Migration completed: snapshots table updated to v1.5.0 schema');
      }
    } catch (error: unknown) {
      console.error('Migration error:', error);
    }
  }

  async createIndexes(db: DatabaseClient): Promise<void> {
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

      CREATE INDEX IF NOT EXISTS idx_snapshots_user ON snapshots(user_id);
      CREATE INDEX IF NOT EXISTS idx_snapshots_entry_info ON snapshots(entry_info_id);
      CREATE INDEX IF NOT EXISTS idx_snapshots_destination ON snapshots(user_id, destination_id);
      CREATE INDEX IF NOT EXISTS idx_snapshots_status ON snapshots(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_snapshots_created ON snapshots(created_at DESC);
    `);
  }
}

const databaseSchema = new DatabaseSchema();

export default databaseSchema;
