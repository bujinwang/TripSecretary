/**
 * Snapshot Repository
 * Data access layer for snapshot records
 *
 * Handles all database operations for snapshots including
 * CRUD operations, queries, and historical data management.
 */

import DataSerializer from '../utils/DataSerializer';

// Type definitions
interface SQLiteDatabase {
  runAsync(query: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getAllAsync(query: string, params?: unknown[]): Promise<unknown[]>;
  getFirstAsync(query: string, params?: unknown[]): Promise<unknown | null>;
  closeAsync(): Promise<void>;
  execAsync(query: string): Promise<void>;
  withTransactionAsync<T>(callback: () => Promise<T>): Promise<T>;
}

interface SnapshotData {
  snapshotId: string;
  userId: string;
  entryInfoId?: string | null;
  destinationId?: string | null;
  status: string;
  createdAt?: string;
  arrivalDate?: string | null;
  version?: number;
  metadata?: Record<string, unknown>;
  passport?: unknown;
  personalInfo?: unknown;
  funds?: unknown[];
  travel?: unknown;
  tdacSubmission?: unknown;
  completenessIndicator?: Record<string, unknown>;
  photoManifest?: unknown[];
  encryptionInfo?: Record<string, unknown>;
  [key: string]: unknown;
}

interface SnapshotRecord {
  snapshotId: string;
  entryInfoId: string | null;
  userId: string;
  destinationId: string | null;
  status: string;
  createdAt: string;
  arrivalDate: string | null;
  version: number;
  metadata: Record<string, unknown>;
  passport: unknown;
  personalInfo: unknown;
  funds: unknown[];
  travel: unknown;
  tdacSubmission: unknown;
  completenessIndicator: Record<string, unknown>;
  photoManifest: unknown[];
  encryptionInfo: Record<string, unknown>;
  [key: string]: unknown;
}

interface DatabaseRow {
  snapshot_id: string;
  entry_info_id: string | null;
  user_id: string;
  destination_id: string | null;
  status: string;
  created_at: string;
  arrival_date: string | null;
  version: number;
  metadata: string;
  passport_data: string;
  personal_info_data: string;
  funds_data: string;
  travel_data: string;
  tdac_submission_data: string;
  completeness_indicator: string;
  photo_manifest: string;
  encryption_info: string;
  [key: string]: unknown;
}

class SnapshotRepository {
  private db: SQLiteDatabase;
  private serializer: typeof DataSerializer;
  private tableName: string;

  constructor(db: SQLiteDatabase) {
    this.db = db;
    this.serializer = DataSerializer;
    this.tableName = 'snapshots';
  }

  /**
   * Save or update a snapshot record
   * @param {Object} snapshotData - Snapshot data to save
   * @returns {Promise<Object>} - Saved snapshot record
   */
  async save(snapshotData: SnapshotData): Promise<SnapshotRecord> {
    if (!snapshotData || !snapshotData.snapshotId || !snapshotData.userId) {
      throw new Error('Snapshot data, snapshotId, and userId are required');
    }

    const now = new Date().toISOString();

    const query = `
      INSERT OR REPLACE INTO ${this.tableName} (
        snapshot_id, entry_info_id, user_id, destination_id,
        status, created_at, arrival_date, version,
        metadata, passport_data, personal_info_data, funds_data, travel_data,
        tdac_submission_data, completeness_indicator, photo_manifest, encryption_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      snapshotData.snapshotId,
      snapshotData.entryInfoId || null,
      snapshotData.userId,
      snapshotData.destinationId || null,
      snapshotData.status,
      snapshotData.createdAt || now,
      snapshotData.arrivalDate || null,
      snapshotData.version || 1,
      JSON.stringify(snapshotData.metadata || {}),
      JSON.stringify(snapshotData.passport || null),
      JSON.stringify(snapshotData.personalInfo || null),
      JSON.stringify(snapshotData.funds || []),
      JSON.stringify(snapshotData.travel || null),
      JSON.stringify(snapshotData.tdacSubmission || null),
      JSON.stringify(snapshotData.completenessIndicator || {}),
      JSON.stringify(snapshotData.photoManifest || []),
      JSON.stringify(snapshotData.encryptionInfo || {})
    ];

    await this.db.runAsync(query, params);

    return this.getById(snapshotData.snapshotId) as Promise<SnapshotRecord>;
  }

  /**
   * Get snapshot by snapshot ID
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<Object|null>} - Snapshot record or null
   */
  async getById(snapshotId: string): Promise<SnapshotRecord | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE snapshot_id = ?`;
    const row = await this.db.getFirstAsync(query, [snapshotId]) as DatabaseRow | null;

    if (!row) {
      return null;
    }

    return this.deserializeSnapshot(row);
  }

  /**
   * Get all snapshots for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of snapshot records
   */
  async getByUserId(userId: string): Promise<SnapshotRecord[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId]) as DatabaseRow[];
    return rows.map(row => this.deserializeSnapshot(row));
  }

  /**
   * Get snapshot by entry info ID
   * @param {string} entryInfoId - Entry info ID
   * @returns {Promise<Object|null>} - Snapshot record or null
   */
  async getByEntryInfoId(entryInfoId: string): Promise<SnapshotRecord | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE entry_info_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const row = await this.db.getFirstAsync(query, [entryInfoId]) as DatabaseRow | null;

    if (!row) {
      return null;
    }

    return this.deserializeSnapshot(row);
  }

  /**
   * Get snapshots by status
   * @param {string} userId - User ID
   * @param {string} status - Snapshot status (completed, cancelled, expired)
   * @returns {Promise<Array>} - Array of snapshot records
   */
  async getByStatus(userId: string, status: string): Promise<SnapshotRecord[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND status = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId, status]) as DatabaseRow[];
    return rows.map(row => this.deserializeSnapshot(row));
  }

  /**
   * Delete snapshot by snapshot ID
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<void>}
   */
  async delete(snapshotId: string): Promise<void> {
    const query = `DELETE FROM ${this.tableName} WHERE snapshot_id = ?`;
    await this.db.runAsync(query, [snapshotId]);
  }

  /**
   * Get snapshot count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of snapshots
   */
  async getCount(userId: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`;
    const row = await this.db.getFirstAsync(query, [userId]) as { count: number } | null;
    return row?.count || 0;
  }

  /**
   * Deserialize snapshot database row to object
   * @param {Object} row - Database row
   * @returns {Object} - Deserialized snapshot object
   */
  private deserializeSnapshot(row: DatabaseRow): SnapshotRecord {
    return {
      snapshotId: row.snapshot_id,
      entryInfoId: row.entry_info_id,
      userId: row.user_id,
      destinationId: row.destination_id,
      status: row.status,
      createdAt: row.created_at,
      arrivalDate: row.arrival_date,
      version: row.version,
      metadata: this.safeJSONParse(row.metadata, {}),
      passport: this.safeJSONParse(row.passport_data, null),
      personalInfo: this.safeJSONParse(row.personal_info_data, null),
      funds: this.safeJSONParse(row.funds_data, []),
      travel: this.safeJSONParse(row.travel_data, null),
      tdacSubmission: this.safeJSONParse(row.tdac_submission_data, null),
      completenessIndicator: this.safeJSONParse(row.completeness_indicator, {}),
      photoManifest: this.safeJSONParse(row.photo_manifest, []),
      encryptionInfo: this.safeJSONParse(row.encryption_info, {})
    };
  }

  /**
   * Safe JSON parse with fallback
   * @param {string} jsonString - JSON string to parse
   * @param {*} fallback - Fallback value if parse fails
   * @returns {*} - Parsed object or fallback
   */
  private safeJSONParse<T>(jsonString: string | null | undefined, fallback: T): T {
    try {
      return jsonString ? (JSON.parse(jsonString) as T) : fallback;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Failed to parse JSON:', errorMessage);
      return fallback;
    }
  }
}

export default SnapshotRepository;

