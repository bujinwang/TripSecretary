/**
 * Database Migration Manager
 * Handles schema versioning and incremental migrations
 */

interface MigrationDatabaseClient {
  getFirstAsync<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>;
  runAsync(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowId: number } | void>;
}

type MigrationFunction = (db: MigrationDatabaseClient) => Promise<void>;

type MigrationDescriptor = {
  name: string;
  apply: MigrationFunction;
};

type MigrationResult = {
  fromVersion: string | null;
  toVersion: string;
  migrationsApplied: string[];
  errors: Array<{ migration: string; error: string }>;
};

type ValidationResult = {
  isValid: boolean;
  checks: Array<{ table: string; status: string; count: number }>;
  errors: Array<{ table: string; error: string }>;
};

const runNoopMigration: MigrationFunction = async () => {
  // Placeholder for future implementation
};

class MigrationManager {
  private readonly DB_VERSION = '1.3.0';

  private readonly SETTINGS_TABLE = 'settings';

  private readonly VERSION_KEY = 'db_version';

  async getCurrentVersion(db: MigrationDatabaseClient): Promise<string | null> {
    try {
      const result = await db.getFirstAsync<{ value?: string }>(
        `SELECT value FROM ${this.SETTINGS_TABLE} WHERE key = ?`,
        [this.VERSION_KEY]
      );
      return result?.value ?? null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('Could not retrieve database version:', message);
      return null;
    }
  }

  async setCurrentVersion(db: MigrationDatabaseClient, version: string): Promise<void> {
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO ${this.SETTINGS_TABLE} (key, value, updated_at)
         VALUES (?, ?, ?)`,
        [this.VERSION_KEY, version, new Date().toISOString()]
      );
      console.log(`✅ Database version updated to ${version}`);
    } catch (error: unknown) {
      console.error('Failed to set database version:', error);
      throw error;
    }
  }

  async isMigrationNeeded(db: MigrationDatabaseClient): Promise<boolean> {
    const currentVersion = await this.getCurrentVersion(db);
    return currentVersion !== this.DB_VERSION;
  }

  async runMigrations(db: MigrationDatabaseClient): Promise<MigrationResult> {
    try {
      const currentVersion = await this.getCurrentVersion(db);
      const results: MigrationResult = {
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

      const migrations = this.getMigrationSequence(currentVersion);

      for (const migration of migrations) {
        try {
          console.log(`Applying migration: ${migration.name}`);
          await migration.apply(db);
          results.migrationsApplied.push(migration.name);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          results.errors.push({ migration: migration.name, error: message });
          console.error(`Migration failed: ${migration.name}`, message);
        }
      }

      if (results.errors.length === 0) {
        await this.setCurrentVersion(db, this.DB_VERSION);
      }

      return results;
    } catch (error: unknown) {
      console.error('Migration process failed:', error);
      throw error;
    }
  }

  getMigrationSequence(fromVersion: string): MigrationDescriptor[] {
    const migrationsMap: Record<string, MigrationDescriptor> = {
      '1.0.0_to_1.1.0': {
        name: 'Add passport fields (v1.0.0 -> v1.1.0)',
        apply: runNoopMigration
      },
      '1.1.0_to_1.2.0': {
        name: 'Add travel info columns (v1.1.0 -> v1.2.0)',
        apply: runNoopMigration
      },
      '1.2.0_to_1.3.0': {
        name: 'Add schema v2.0 tables (v1.2.0 -> v1.3.0)',
        apply: runNoopMigration
      }
    };

    const migrations: MigrationDescriptor[] = [];
    const versionPairs = Object.keys(migrationsMap);

    for (const pair of versionPairs) {
      const [from, to] = pair.split('_to_');
      if (this.isVersionGreaterOrEqual(fromVersion, from) && this.isVersionLess(fromVersion, to)) {
        migrations.push(migrationsMap[pair]);
      }
    }

    return migrations;
  }

  isVersionGreaterOrEqual(version1: string, version2: string): boolean {
    return this.compareVersions(version1, version2) >= 0;
  }

  isVersionLess(version1: string, version2: string): boolean {
    return this.compareVersions(version1, version2) < 0;
  }

  compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    const length = Math.max(parts1.length, parts2.length);
    for (let i = 0; i < length; i += 1) {
      const p1 = parts1[i] ?? 0;
      const p2 = parts2[i] ?? 0;

      if (p1 > p2) {
        return 1;
      }
      if (p1 < p2) {
        return -1;
      }
    }

    return 0;
  }

  async validateMigration(db: MigrationDatabaseClient): Promise<ValidationResult> {
    const results: ValidationResult = {
      isValid: true,
      checks: [],
      errors: []
    };

    try {
      const requiredTables = [
        'users',
        'passports',
        'personal_info',
        'travel_info',
        'fund_items',
        'entry_info',
        'digital_arrival_cards'
      ];

      for (const table of requiredTables) {
        try {
          const result = await db.getFirstAsync<{ count?: number }>(
            `SELECT COUNT(*) as count FROM ${table} LIMIT 1`
          );
          results.checks.push({
            table,
            status: 'exists',
            count: result?.count ?? 0
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          results.isValid = false;
          results.errors.push({ table, error: `Table does not exist: ${message}` });
        }
      }

      return results;
    } catch (error: unknown) {
      console.error('Migration validation failed:', error);
      throw error;
    }
  }
}

const migrationManager = new MigrationManager();

export default migrationManager;
