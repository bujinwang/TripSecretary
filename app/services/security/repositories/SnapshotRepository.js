/**
 * Snapshot Repository
 * Data access layer for snapshot records
 *
 * Handles all database operations for snapshots including
 * CRUD operations, queries, and historical data management.
 */

import DataSerializer from '../utils/DataSerializer';

class SnapshotRepository {
  constructor(db) {
    this.db = db;
    this.serializer = DataSerializer;
    this.tableName = 'snapshots';
  }

  /**
   * Save or update a snapshot record
   * @param {Object} snapshotData - Snapshot data to save
   * @returns {Promise<Object>} - Saved snapshot record
   */
  async save(snapshotData) {
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
    console.log('Snapshot saved to database:', {
      snapshotId: snapshotData.snapshotId,
      userId: snapshotData.userId,
      status: snapshotData.status
    });

    return this.getById(snapshotData.snapshotId);
  }

  /**
   * Get snapshot by snapshot ID
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<Object|null>} - Snapshot record or null
   */
  async getById(snapshotId) {
    const query = `SELECT * FROM ${this.tableName} WHERE snapshot_id = ?`;
    const row = await this.db.getFirstAsync(query, [snapshotId]);

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
  async getByUserId(userId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId]);
    return rows.map(row => this.deserializeSnapshot(row));
  }

  /**
   * Get snapshot by entry info ID
   * @param {string} entryInfoId - Entry info ID
   * @returns {Promise<Object|null>} - Snapshot record or null
   */
  async getByEntryInfoId(entryInfoId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE entry_info_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const row = await this.db.getFirstAsync(query, [entryInfoId]);

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
  async getByStatus(userId, status) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND status = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId, status]);
    return rows.map(row => this.deserializeSnapshot(row));
  }

  /**
   * Delete snapshot by snapshot ID
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<void>}
   */
  async delete(snapshotId) {
    const query = `DELETE FROM ${this.tableName} WHERE snapshot_id = ?`;
    await this.db.runAsync(query, [snapshotId]);

    console.log('Snapshot deleted from database:', snapshotId);
  }

  /**
   * Get snapshot count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of snapshots
   */
  async getCount(userId) {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`;
    const row = await this.db.getFirstAsync(query, [userId]);
    return row?.count || 0;
  }

  /**
   * Deserialize snapshot database row to object
   * @param {Object} row - Database row
   * @returns {Object} - Deserialized snapshot object
   */
  deserializeSnapshot(row) {
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
  safeJSONParse(jsonString, fallback) {
    try {
      return jsonString ? JSON.parse(jsonString) : fallback;
    } catch (error) {
      console.warn('Failed to parse JSON:', error.message);
      return fallback;
    }
  }
}

export default SnapshotRepository;
