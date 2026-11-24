/**
 * Fund Item Repository
 * Data access layer for fund item records
 *
 * Handles all database operations for fund items including
 * CRUD operations, queries, and relationships.
 */

import DataSerializer, { type FundItemRow } from '../utils/DataSerializer';

// Type definitions
interface SQLiteDatabase {
  runAsync(query: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getAllAsync(query: string, params?: unknown[]): Promise<unknown[]>;
  getFirstAsync(query: string, params?: unknown[]): Promise<unknown | null>;
  closeAsync(): Promise<void>;
  execAsync(query: string): Promise<void>;
  withTransactionAsync<T>(callback: () => Promise<T>): Promise<T>;
}

interface FundItemData {
  id?: string;
  userId: string;
  type?: string | null;
  amount?: number | null;
  currency?: string | null;
  details?: string | null;
  photoUri?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

interface FundItemRecord {
  id: string;
  userId: string;
  [key: string]: unknown;
}

class FundItemRepository {
  private db: SQLiteDatabase;
  private serializer: typeof DataSerializer;
  private tableName: string;

  constructor(db: SQLiteDatabase) {
    this.db = db;
    this.serializer = DataSerializer;
    this.tableName = 'fund_items';
  }

  /**
   * Save or update a fund item record
   * @param {Object} fundData - Fund item data to save
   * @returns {Promise<Object>} - Saved fund item record
   */
  async save(fundData: FundItemData): Promise<FundItemRecord> {
    if (!fundData || !fundData.userId) {
      throw new Error('Fund item data and userId are required');
    }

    const id = fundData.id || this.serializer.generateId();
    const now = new Date().toISOString();

    const query = `
      INSERT OR REPLACE INTO ${this.tableName} (
        id, user_id, type, amount, currency, details, photo_uri,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      fundData.userId,
      fundData.type || null,
      fundData.amount || null,
      fundData.currency || null,
      fundData.details || null,
      fundData.photoUri || null,
      fundData.createdAt || now,
      now
    ];

    await this.db.runAsync(query, params);
    return this.getById(id) as Promise<FundItemRecord>;
  }

  /**
   * Get fund item by ID
   * @param {string} id - Fund item ID
   * @returns {Promise<Object|null>} - Fund item record or null
   */
  async getById(id: string): Promise<FundItemRecord | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const row = await this.db.getFirstAsync(query, [id]);

    if (!row) {
      return null;
    }

    return this.serializer.deserializeFundItem(this.assertRow(row)) as FundItemRecord;
  }

  /**
   * Get all fund items for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of fund item records
   */
  async getByUserId(userId: string): Promise<FundItemRecord[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeFundItem(this.assertRow(row)) as FundItemRecord);
  }

  /**
   * Get fund items by type for a user
   * @param {string} userId - User ID
   * @param {string} type - Fund item type
   * @returns {Promise<Array>} - Array of fund item records
   */
  async getByType(userId: string, type: string): Promise<FundItemRecord[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND type = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId, type]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeFundItem(this.assertRow(row)) as FundItemRecord);
  }

  /**
   * Get fund items with photos for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of fund item records with photos
   */
  async getWithPhotos(userId: string): Promise<FundItemRecord[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND photo_uri IS NOT NULL
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeFundItem(this.assertRow(row)) as FundItemRecord);
  }

  /**
   * Delete fund item
   * @param {string} id - Fund item ID
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await this.db.runAsync(query, [id]);
  }

  /**
   * Delete all fund items for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of deleted records
   */
  async deleteByUserId(userId: string): Promise<number> {
    const query = `DELETE FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.runAsync(query, [userId]);
    return result.changes || 0;
  }

  /**
   * Count fund items for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of fund items
   */
  async countByUserId(userId: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.getFirstAsync(query, [userId]) as { count: number } | null;
    return result?.count || 0;
  }

  private assertRow(row: unknown): FundItemRow {
    if (row && typeof row === 'object') {
      return row as FundItemRow;
    }
    throw new Error('Invalid fund item row retrieved from database');
  }

  /**
   * Count fund items by type for a user
   * @param {string} userId - User ID
   * @param {string} type - Fund item type
   * @returns {Promise<number>} - Count of fund items
   */
  async countByType(userId: string, type: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ? AND type = ?`;
    const result = await this.db.getFirstAsync(query, [userId, type]) as { count: number } | null;
    return result?.count || 0;
  }

  /**
   * Check if fund item exists
   * @param {string} id - Fund item ID
   * @returns {Promise<boolean>} - True if exists
   */
  async exists(id: string): Promise<boolean> {
    const query = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const result = await this.db.getFirstAsync(query, [id]);
    return !!result;
  }

  /**
   * Update fund item photo URI
   * @param {string} id - Fund item ID
   * @param {string} photoUri - New photo URI
   * @returns {Promise<void>}
   */
  async updatePhotoUri(id: string, photoUri: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET photo_uri = ?, updated_at = ?
      WHERE id = ?
    `;

    await this.db.runAsync(query, [photoUri, new Date().toISOString(), id]);
  }
}

export default FundItemRepository;

