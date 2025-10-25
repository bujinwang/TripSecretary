/**
 * Entry Info Repository
 * Data access layer for entry information records
 *
 * Handles all database operations for entry info data including
 * CRUD operations, queries, and relationships with fund items.
 */

import DataSerializer from '../utils/DataSerializer';

class EntryInfoRepository {
  constructor(db) {
    this.db = db;
    this.serializer = DataSerializer;
    this.tableName = 'entry_info';
  }

  /**
   * Save or update an entry info record
   * @param {Object} entryData - Entry info data to save
   * @returns {Promise<Object>} - Saved entry info record
   */
  async save(entryData) {
    if (!entryData || !entryData.userId) {
      throw new Error('Entry info data and userId are required');
    }

    const id = entryData.id || this.serializer.generateId();
    const now = new Date().toISOString();

    const query = `
      INSERT OR REPLACE INTO ${this.tableName} (
        id, user_id, passport_id, personal_info_id, travel_info_id,
        destination_id, status, completion_metrics, documents,
        display_status, last_updated_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      entryData.userId,
      entryData.passportId,
      entryData.personalInfoId || null,
      entryData.travelInfoId || null,
      entryData.destinationId || null,
      entryData.status || 'incomplete',
      entryData.completionMetrics ? JSON.stringify(entryData.completionMetrics) : null,
      entryData.documents ? JSON.stringify(entryData.documents) : null,
      entryData.displayStatus || null,
      entryData.lastUpdatedAt || now,
      entryData.createdAt || now
    ];

    await this.db.runAsync(query, params);
    return this.getById(id);
  }

  /**
   * Get entry info by ID
   * @param {string} id - Entry info ID
   * @returns {Promise<Object|null>} - Entry info record or null
   */
  async getById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const row = await this.db.getFirstAsync(query, [id]);

    if (!row) {
      return null;
    }

    return this.serializer.deserializeEntryInfo(row);
  }

  /**
   * Get all entry info records for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of entry info records
   */
  async getByUserId(userId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeEntryInfo(row));
  }

  /**
   * Get entry info by destination
   * @param {string} userId - User ID
   * @param {string} destinationId - Destination ID
   * @returns {Promise<Array>} - Array of entry info records
   */
  async getByDestination(userId, destinationId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND destination_id = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId, destinationId]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeEntryInfo(row));
  }

  /**
   * Get entry info by status
   * @param {string} userId - User ID
   * @param {string} status - Status
   * @returns {Promise<Array>} - Array of entry info records
   */
  async getByStatus(userId, status) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND status = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId, status]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeEntryInfo(row));
  }

  /**
   * Delete entry info
   * @param {string} id - Entry info ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await this.db.runAsync(query, [id]);
  }

  /**
   * Delete all entry info for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of deleted records
   */
  async deleteByUserId(userId) {
    const query = `DELETE FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.runAsync(query, [userId]);
    return result.changes || 0;
  }

  /**
   * Count entry info records for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of entry info records
   */
  async countByUserId(userId) {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.getFirstAsync(query, [userId]);
    return result?.count || 0;
  }

  /**
   * Check if entry info exists
   * @param {string} id - Entry info ID
   * @returns {Promise<boolean>} - True if exists
   */
  async exists(id) {
    const query = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const result = await this.db.getFirstAsync(query, [id]);
    return !!result;
  }

  /**
   * Update entry info status
   * @param {string} id - Entry info ID
   * @param {string} status - New status
   * @returns {Promise<void>}
   */
  async updateStatus(id, status) {
    const query = `
      UPDATE ${this.tableName}
      SET status = ?, last_updated_at = ?
      WHERE id = ?
    `;

    await this.db.runAsync(query, [status, new Date().toISOString(), id]);
  }

  /**
   * Link fund item to entry info
   * @param {string} entryInfoId - Entry info ID
   * @param {string} fundItemId - Fund item ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async linkFundItem(entryInfoId, fundItemId, userId) {
    const query = `
      INSERT OR REPLACE INTO entry_info_fund_items (
        entry_info_id, fund_item_id, user_id, linked_at
      ) VALUES (?, ?, ?, ?)
    `;

    await this.db.runAsync(query, [entryInfoId, fundItemId, userId, new Date().toISOString()]);
  }

  /**
   * Unlink fund item from entry info
   * @param {string} entryInfoId - Entry info ID
   * @param {string} fundItemId - Fund item ID
   * @returns {Promise<void>}
   */
  async unlinkFundItem(entryInfoId, fundItemId) {
    const query = `
      DELETE FROM entry_info_fund_items
      WHERE entry_info_id = ? AND fund_item_id = ?
    `;

    await this.db.runAsync(query, [entryInfoId, fundItemId]);
  }

  /**
   * Get fund items linked to entry info
   * @param {string} entryInfoId - Entry info ID
   * @returns {Promise<Array>} - Array of fund item IDs
   */
  async getLinkedFundItems(entryInfoId) {
    const query = `
      SELECT fund_item_id FROM entry_info_fund_items
      WHERE entry_info_id = ?
      ORDER BY linked_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [entryInfoId]);
    return rows ? rows.map(row => row.fund_item_id) : [];
  }
}

export default EntryInfoRepository;

