/**
 * Migration Script: Clean up unused time fields from travel_info table
 *
 * This script removes the following unused fields from existing travel_info tables:
 * - arrival_departure_time
 * - arrival_arrival_time
 * - departure_departure_time
 * - departure_arrival_time
 *
 * Since SQLite doesn't support ALTER TABLE DROP COLUMN, we need to:
 * 1. Create a new table without the unused columns
 * 2. Copy data from old table to new table
 * 3. Drop old table
 * 4. Rename new table
 */

const { openDatabaseAsync } = require('expo-sqlite');

class TravelInfoMigration {
  constructor() {
    this.db = null;
  }

  async initialize() {
    try {
      console.log('🔄 Initializing travel_info schema migration...');
      this.db = await openDatabaseAsync('tripsecretary_secure');
      console.log('✅ Database connection established');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  async migrate() {
    try {
      console.log('🚀 Starting travel_info schema migration...');

      // Check if migration is needed
      const needsMigration = await this.checkIfMigrationNeeded();
      if (!needsMigration) {
        console.log('ℹ️ Migration not needed - table already clean');
        return;
      }

      // Create backup
      console.log('📦 Creating backup before migration...');
      await this.createBackup();

      // Perform migration
      await this.performMigration();

      console.log('✅ Travel info schema migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async checkIfMigrationNeeded() {
    try {
      const columns = await this.db.getAllAsync(`PRAGMA table_info(travel_info)`);
      const columnNames = columns.map(col => col.name);

      const unusedFields = [
        'arrival_departure_time',
        'arrival_arrival_time',
        'departure_departure_time',
        'departure_arrival_time'
      ];

      const hasUnusedFields = unusedFields.some(field => columnNames.includes(field));

      console.log('Current travel_info columns:', columnNames);
      console.log('Has unused time fields:', hasUnusedFields);

      return hasUnusedFields;
    } catch (error) {
      console.error('Failed to check migration need:', error);
      return false;
    }
  }

  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupTableName = `travel_info_backup_${timestamp}`;

      // Create backup table with all columns
      await this.db.execAsync(`
        CREATE TABLE ${backupTableName} AS SELECT * FROM travel_info
      `);

      console.log(`✅ Backup created: ${backupTableName}`);

      // Store backup info for potential rollback
      await this.db.runAsync(
        `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
        [`travel_info_backup_${timestamp}`, backupTableName, new Date().toISOString()]
      );

    } catch (error) {
      console.error('❌ Failed to create backup:', error);
      throw error;
    }
  }

  async performMigration() {
    try {
      console.log('🔄 Performing table recreation...');

      await this.db.withTransactionAsync(async () => {
        // Create new table without unused time fields
        await this.db.execAsync(`
          CREATE TABLE travel_info_new (
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
            arrival_arrival_airport TEXT,
            arrival_arrival_date TEXT,
            departure_flight_number TEXT,
            departure_departure_airport TEXT,
            departure_departure_date TEXT,
            departure_arrival_airport TEXT,
            departure_arrival_date TEXT,
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

        // Copy data from old table to new table (excluding unused time fields)
        await this.db.execAsync(`
          INSERT INTO travel_info_new (
            id, user_id, destination, travel_purpose, recent_stay_country,
            boarding_country, visa_number, arrival_flight_number,
            arrival_departure_airport, arrival_departure_date,
            arrival_arrival_airport, arrival_arrival_date,
            departure_flight_number, departure_departure_airport,
            departure_departure_date, departure_arrival_airport,
            departure_arrival_date, accommodation_type, province, district,
            sub_district, postal_code, hotel_name, hotel_address,
            accommodation_phone, length_of_stay, is_transit_passenger,
            status, created_at, updated_at
          )
          SELECT
            id, user_id, destination, travel_purpose, recent_stay_country,
            boarding_country, visa_number, arrival_flight_number,
            arrival_departure_airport, arrival_departure_date,
            arrival_arrival_airport, arrival_arrival_date,
            departure_flight_number, departure_departure_airport,
            departure_departure_date, departure_arrival_airport,
            departure_arrival_date, accommodation_type, province, district,
            sub_district, postal_code, hotel_name, hotel_address,
            accommodation_phone, length_of_stay, is_transit_passenger,
            status, created_at, updated_at
          FROM travel_info
        `);

        // Drop old table
        await this.db.execAsync('DROP TABLE travel_info');

        // Rename new table
        await this.db.execAsync('ALTER TABLE travel_info_new RENAME TO travel_info');

        // Recreate indexes
        await this.db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_travel_info_user ON travel_info(user_id);
          CREATE INDEX IF NOT EXISTS idx_travel_info_destination ON travel_info(user_id, destination);
        `);

        console.log('✅ Table recreation completed');
      });

    } catch (error) {
      console.error('❌ Failed to perform migration:', error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.db) {
        await this.db.closeAsync();
        console.log('✅ Database connection closed');
      }
    } catch (error) {
      console.error('❌ Failed to close database:', error);
    }
  }

  async rollback(backupTableName) {
    try {
      console.log(`🔄 Rolling back to backup: ${backupTableName}`);

      await this.db.withTransactionAsync(async () => {
        // Drop current table
        await this.db.execAsync('DROP TABLE IF EXISTS travel_info');

        // Restore from backup
        await this.db.execAsync(`
          CREATE TABLE travel_info AS SELECT * FROM ${backupTableName}
        `);

        // Clean up backup table
        await this.db.execAsync(`DROP TABLE ${backupTableName}`);

        console.log('✅ Rollback completed');
      });
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const migration = new TravelInfoMigration();

  try {
    await migration.initialize();
    await migration.migrate();
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await migration.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = TravelInfoMigration;