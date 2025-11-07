/**
 * Digital Arrival Card Repository
 * Data access layer for digital arrival card records
 *
 * Handles all database operations for digital arrival cards including
 * CRUD operations, queries, and submission tracking.
 *
 * Field Usage Clarification:
 * - qrUri: Currently stores PDF path, but SHOULD store QR code image path
 * - pdfUrl: Stores full PDF document path (correct usage)
 *
 * When QR extraction is implemented:
 * - qrUri: file:///.../Documents/tdac/QR_TH12345_timestamp.png
 * - pdfUrl: file:///.../Documents/tdac/TDAC_TH12345_timestamp.pdf
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

interface DigitalArrivalCardData {
  id?: string;
  entryInfoId: string;
  userId: string;
  cardType?: string | null;
  destinationId?: string | null;
  arrCardNo?: string | null;
  qrUri?: string | null;
  pdfUrl?: string | null;
  submittedAt?: string;
  submissionMethod?: string;
  status?: string;
  apiResponse?: unknown;
  processingTime?: number | null;
  retryCount?: number;
  errorDetails?: unknown;
  isSuperseded?: boolean;
  supersededAt?: string | null;
  supersededBy?: string | null;
  supersededReason?: string | null;
  version?: number;
  createdAt?: string;
  [key: string]: unknown;
}

interface DigitalArrivalCardRecord {
  id: string;
  entryInfoId: string;
  userId: string;
  [key: string]: unknown;
}

class DigitalArrivalCardRepository {
  private db: SQLiteDatabase;
  private serializer: typeof DataSerializer;
  private tableName: string;

  constructor(db: SQLiteDatabase) {
    this.db = db;
    this.serializer = DataSerializer;
    this.tableName = 'digital_arrival_cards';
  }

  /**
   * Save or update a digital arrival card record
   *
   * @param {Object} dacData - Digital arrival card data to save
   * @param {string} dacData.qrUri - QR code URI (currently PDF path, should be QR image)
   * @param {string} dacData.pdfUrl - Full PDF document path
   * @returns {Promise<Object>} - Saved digital arrival card record
   */
  async save(dacData: DigitalArrivalCardData): Promise<DigitalArrivalCardRecord> {
    if (!dacData || !dacData.userId || !dacData.entryInfoId) {
      throw new Error('Digital arrival card data, userId, and entryInfoId are required');
    }

    const id = dacData.id || this.serializer.generateId();
    const now = new Date().toISOString();

    const query = `
      INSERT OR REPLACE INTO ${this.tableName} (
        id, entry_info_id, user_id, card_type, destination_id, arr_card_no,
        qr_uri, pdf_url, submitted_at, submission_method, status,
        api_response, processing_time, retry_count, error_details,
        is_superseded, superseded_at, superseded_by, superseded_reason,
        version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      dacData.entryInfoId,
      dacData.userId,
      dacData.cardType || null,
      dacData.destinationId || null,
      dacData.arrCardNo || null,
      dacData.qrUri || null,
      dacData.pdfUrl || null,
      dacData.submittedAt || now,
      dacData.submissionMethod || 'api',
      dacData.status || 'success',
      dacData.apiResponse ? JSON.stringify(dacData.apiResponse) : null,
      dacData.processingTime || null,
      dacData.retryCount || 0,
      dacData.errorDetails ? JSON.stringify(dacData.errorDetails) : null,
      dacData.isSuperseded ? 1 : 0,
      dacData.supersededAt || null,
      dacData.supersededBy || null,
      dacData.supersededReason || null,
      dacData.version || 1,
      dacData.createdAt || now,
      now
    ];

    await this.db.runAsync(query, params);
    return this.getById(id) as Promise<DigitalArrivalCardRecord>;
  }

  /**
   * Get digital arrival card by ID
   * @param {string} id - Digital arrival card ID
   * @returns {Promise<Object|null>} - Digital arrival card record or null
   */
  async getById(id: string): Promise<DigitalArrivalCardRecord | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const row = await this.db.getFirstAsync(query, [id]);

    if (!row) {
      return null;
    }

    return this.serializer.deserializeDigitalArrivalCard(row) as DigitalArrivalCardRecord;
  }

  /**
   * Get all digital arrival cards for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of digital arrival card records
   */
  async getByUserId(userId: string): Promise<DigitalArrivalCardRecord[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY submitted_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeDigitalArrivalCard(row) as DigitalArrivalCardRecord);
  }

  /**
   * Get digital arrival cards by entry info
   * @param {string} entryInfoId - Entry info ID
   * @returns {Promise<Array>} - Array of digital arrival card records
   */
  async getByEntryInfo(entryInfoId: string): Promise<DigitalArrivalCardRecord[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE entry_info_id = ?
      ORDER BY submitted_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [entryInfoId]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeDigitalArrivalCard(row) as DigitalArrivalCardRecord);
  }

  /**
   * Get latest non-superseded digital arrival card for entry info
   * @param {string} entryInfoId - Entry info ID
   * @param {string} cardType - Card type
   * @returns {Promise<Object|null>} - Latest digital arrival card or null
   */
  async getLatestByEntryInfo(entryInfoId: string, cardType: string): Promise<DigitalArrivalCardRecord | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE entry_info_id = ? AND card_type = ? AND is_superseded = 0
      ORDER BY submitted_at DESC
      LIMIT 1
    `;

    const row = await this.db.getFirstAsync(query, [entryInfoId, cardType]);

    if (!row) {
      return null;
    }

    return this.serializer.deserializeDigitalArrivalCard(row) as DigitalArrivalCardRecord;
  }

  /**
   * Get digital arrival cards by status
   * @param {string} userId - User ID
   * @param {string} status - Status
   * @returns {Promise<Array>} - Array of digital arrival card records
   */
  async getByStatus(userId: string, status: string): Promise<DigitalArrivalCardRecord[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND status = ?
      ORDER BY submitted_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId, status]);

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => this.serializer.deserializeDigitalArrivalCard(row) as DigitalArrivalCardRecord);
  }

  /**
   * Delete digital arrival card
   * @param {string} id - Digital arrival card ID
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await this.db.runAsync(query, [id]);
  }

  /**
   * Delete all digital arrival cards for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of deleted records
   */
  async deleteByUserId(userId: string): Promise<number> {
    const query = `DELETE FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.runAsync(query, [userId]);
    return result.changes || 0;
  }

  /**
   * Count digital arrival cards for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of digital arrival cards
   */
  async countByUserId(userId: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.getFirstAsync(query, [userId]) as { count: number } | null;
    return result?.count || 0;
  }

  /**
   * Check if digital arrival card exists
   * @param {string} id - Digital arrival card ID
   * @returns {Promise<boolean>} - True if exists
   */
  async exists(id: string): Promise<boolean> {
    const query = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const result = await this.db.getFirstAsync(query, [id]);
    return !!result;
  }

  /**
   * Mark digital arrival card as superseded
   * @param {string} id - Digital arrival card ID
   * @param {string} supersededById - ID of the card that supersedes this one
   * @param {string} reason - Reason for superseding
   * @returns {Promise<void>}
   */
  async markSuperseded(id: string, supersededById: string, reason: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET is_superseded = 1, superseded_at = ?, superseded_by = ?, superseded_reason = ?
      WHERE id = ?
    `;

    await this.db.runAsync(query, [new Date().toISOString(), supersededById, reason, id]);
  }
}

export default DigitalArrivalCardRepository;

