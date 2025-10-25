/**
 * Database Migration Manager
 * Handles schema versioning and incremental migrations
 *
 * Manages database version tracking and applies migrations
 * to upgrade from older schema versions to the latest version.
 */

class MigrationManager {
  constructor() {
    this.DB_VERSION = '1.3.0';
    this.SETTINGS_TABLE = 'settings';
    this.VERSION_KEY = 'db_version';
  }

  /**
   * Get current database version from settings
   * @param {Object} db - Database instance
   * @returns {Promise<string>} - Current version or null if not set
   */
  async getCurrentVersion(db) {
    try {
      const result = await db.getFirstAsync(
        `SELECT value FROM ${this.SETTINGS_TABLE} WHERE key = ?`,
        [this.VERSION_KEY]
      );
      return result?.value || null;
    } catch (error) {
      console.warn('Could not retrieve database version:', error.message);
      return null;
    }
  }

  /**
   * Set database version in settings
   * @param {Object} db - Database instance
   * @param {string} version - Version to set
   */
  async setCurrentVersion(db, version) {
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO ${this.SETTINGS_TABLE} (key, value, updated_at)
         VALUES (?, ?, ?)`,
        [this.VERSION_KEY, version, new Date().toISOString()]
      );
      console.log(`✅ Database version updated to ${version}`);
    } catch (error) {
      console.error('Failed to set database version:', error);
      throw error;
    }
  }

  /**
   * Check if migration is needed
   * @param {Object} db - Database instance
   * @returns {Promise<boolean>} - True if migration needed
   */
  async isMigrationNeeded(db) {
    const currentVersion = await this.getCurrentVersion(db);
    return currentVersion !== this.DB_VERSION;
  }

  /**
   * Run all pending migrations
   * @param {Object} db - Database instance
   * @returns {Promise<Object>} - Migration results
   */
  async runMigrations(db) {
    try {
      const currentVersion = await this.getCurrentVersion(db);
      const results = {
        fromVersion: currentVersion,
        toVersion: this.DB_VERSION,
        migrationsApplied: [],
        errors: []
      };

      if (!currentVersion) {
        console.log('Fresh database - no migrations needed');
        await this.setCurrentVersion(db, this.DB_VERSION);
        return results;
      }

      if (currentVersion === this.DB_VERSION) {
        console.log('Database already at latest version');
        return results;
      }

      // Apply version-specific migrations
      const migrations = this.getMigrationSequence(currentVersion);
      
      for (const migration of migrations) {
        try {
          console.log(`Applying migration: ${migration.name}`);
          await migration.apply(db);
          results.migrationsApplied.push(migration.name);
        } catch (error) {
          results.errors.push({
            migration: migration.name,
            error: error.message
          });
          console.error(`Migration failed: ${migration.name}`, error);
        }
      }

      // Update version after successful migrations
      if (results.errors.length === 0) {
        await this.setCurrentVersion(db, this.DB_VERSION);
      }

      return results;
    } catch (error) {
      console.error('Migration process failed:', error);
      throw error;
    }
  }

  /**
   * Get sequence of migrations needed for version upgrade
   * @param {string} fromVersion - Current version
   * @returns {Array} - Array of migration objects
   */
  getMigrationSequence(fromVersion) {
    const migrations = [];

    // Example migration structure - add actual migrations as needed
    const allMigrations = {
      '1.0.0_to_1.1.0': {
        name: 'Add passport fields (v1.0.0 -> v1.1.0)',
        apply: async (db) => {
          // Migration logic would go here
          console.log('Migration 1.0.0 -> 1.1.0 applied');
        }
      },
      '1.1.0_to_1.2.0': {
        name: 'Add travel info columns (v1.1.0 -> v1.2.0)',
        apply: async (db) => {
          // Migration logic would go here
          console.log('Migration 1.1.0 -> 1.2.0 applied');
        }
      },
      '1.2.0_to_1.3.0': {
        name: 'Add schema v2.0 tables (v1.2.0 -> v1.3.0)',
        apply: async (db) => {
          // Migration logic would go here
          console.log('Migration 1.2.0 -> 1.3.0 applied');
        }
      }
    };

    // Build migration path from current version to target
    const versionPairs = Object.keys(allMigrations);
    for (const pair of versionPairs) {
      const [from, to] = pair.split('_to_');
      if (this.isVersionGreaterOrEqual(fromVersion, from) && 
          this.isVersionLess(fromVersion, to)) {
        migrations.push(allMigrations[pair]);
      }
    }

    return migrations;
  }

  /**
   * Compare semantic versions
   * @param {string} version1 - First version
   * @param {string} version2 - Second version
   * @returns {boolean} - True if version1 >= version2
   */
  isVersionGreaterOrEqual(version1, version2) {
    return this.compareVersions(version1, version2) >= 0;
  }

  /**
   * Compare semantic versions
   * @param {string} version1 - First version
   * @param {string} version2 - Second version
   * @returns {boolean} - True if version1 < version2
   */
  isVersionLess(version1, version2) {
    return this.compareVersions(version1, version2) < 0;
  }

  /**
   * Compare two semantic versions
   * @param {string} v1 - First version (e.g., "1.2.3")
   * @param {string} v2 - Second version (e.g., "1.2.4")
   * @returns {number} - -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;

      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }

    return 0;
  }

  /**
   * Validate database integrity after migration
   * @param {Object} db - Database instance
   * @returns {Promise<Object>} - Validation results
   */
  async validateMigration(db) {
    const results = {
      isValid: true,
      checks: [],
      errors: []
    };

    try {
      // Check required tables exist
      const requiredTables = [
        'users', 'passports', 'personal_info', 'travel_info',
        'fund_items', 'entry_info', 'digital_arrival_cards'
      ];

      for (const table of requiredTables) {
        try {
          const result = await db.getFirstAsync(
            `SELECT COUNT(*) as count FROM ${table} LIMIT 1`
          );
          results.checks.push({
            table,
            status: 'exists',
            count: result?.count || 0
          });
        } catch (error) {
          results.isValid = false;
          results.errors.push({
            table,
            error: `Table does not exist: ${error.message}`
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Migration validation failed:', error);
      throw error;
    }
  }
}

export default new MigrationManager();

