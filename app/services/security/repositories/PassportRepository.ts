/**
 * Passport Repository
 * Data access layer for passport records
 *
 * Handles all database operations for passport data including
 * CRUD operations, queries, and relationships.
 */

import DataSerializer from '../utils/DataSerializer';
import DecryptionHelper from '../utils/DecryptionHelper';

// Type definitions
interface SQLiteDatabase {
  runAsync(query: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getAllAsync(query: string, params?: unknown[]): Promise<unknown[]>;
  getFirstAsync(query: string, params?: unknown[]): Promise<unknown | null>;
  closeAsync(): Promise<void>;
  execAsync(query: string): Promise<void>;
  withTransactionAsync<T>(callback: () => Promise<T>): Promise<T>;
}

interface PassportData {
  id?: string;
  userId: string;
  passportNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  gender?: string;
  expiryDate?: string;
  issueDate?: string;
  issuePlace?: string;
  photoUri?: string;
  isPrimary?: boolean;
  createdAt?: string;
  encryptedPassportNumber?: string;
  encryptedFullName?: string;
  encryptedDateOfBirth?: string;
  encryptedNationality?: string;
  [key: string]: unknown;
}

interface CountryData {
  countryCode: string;
  visaRequired: boolean;
  maxStayDays?: number | null;
  notes?: string | null;
}

interface PassportRecord {
  id: string;
  userId: string;
  [key: string]: unknown;
}

type PassportRow = {
  id: string;
  user_id: string;
  gender?: string | null;
  expiry_date?: string | null;
  issue_date?: string | null;
  issue_place?: string | null;
  photo_uri?: string | null;
  is_primary?: number | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

class PassportRepository {
  private db: SQLiteDatabase;
  private serializer: typeof DataSerializer;
  private decryption: typeof DecryptionHelper;
  private tableName: string;

  constructor(db: SQLiteDatabase) {
    this.db = db;
    this.serializer = DataSerializer;
    this.decryption = DecryptionHelper;
    this.tableName = 'passports';
  }

  /**
   * Save or update a passport record
   * @param {Object} passportData - Passport data to save
   * @returns {Promise<Object>} - Saved passport record
   */
  async save(passportData: PassportData): Promise<PassportRecord> {
    if (!passportData || !passportData.userId) {
      throw new Error('Passport data and userId are required');
    }

    const id = passportData.id || this.serializer.generateId();
    const now = new Date().toISOString();

    const query = `
      INSERT OR REPLACE INTO ${this.tableName} (
        id, user_id, encrypted_passport_number, encrypted_full_name,
        encrypted_date_of_birth, encrypted_nationality, gender,
        expiry_date, issue_date, issue_place, photo_uri, is_primary,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      passportData.userId,
      passportData.encryptedPassportNumber || passportData.passportNumber,
      passportData.encryptedFullName || passportData.fullName,
      passportData.encryptedDateOfBirth || passportData.dateOfBirth,
      passportData.encryptedNationality || passportData.nationality,
      passportData.gender || null,
      passportData.expiryDate || null,
      passportData.issueDate || null,
      passportData.issuePlace || null,
      passportData.photoUri || null,
      passportData.isPrimary ? 1 : 0,
      passportData.createdAt || now,
      now
    ];

    await this.db.runAsync(query, params);
    return this.getById(id) as Promise<PassportRecord>;
  }

  /**
   * Get passport by ID
   * @param {string} id - Passport ID
   * @returns {Promise<Object|null>} - Passport record or null
   */
  async getById(id: string): Promise<PassportRecord | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const row = await this.db.getFirstAsync(query, [id]) as PassportRow | null;

    if (!row) {
      return null;
    }

    const decryptedFields = await this.decryption.decryptPassportFields(row);
    return this.serializer.deserializePassport(row, decryptedFields) as PassportRecord;
  }

  /**
   * Get all passports for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of passport records
   */
  async getByUserId(userId: string): Promise<PassportRecord[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY is_primary DESC, created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId]) as PassportRow[];

    if (!rows || rows.length === 0) {
      return [];
    }

    const passports: PassportRecord[] = [];
    for (const row of rows) {
      const decryptedFields = await this.decryption.decryptPassportFields(row);
      passports.push(this.serializer.deserializePassport(row, decryptedFields) as PassportRecord);
    }

    return passports;
  }

  /**
   * Get primary passport for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Primary passport or null
   */
  async getPrimaryByUserId(userId: string): Promise<PassportRecord | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND is_primary = 1
      LIMIT 1
    `;

    const row = await this.db.getFirstAsync(query, [userId]) as PassportRow | null;

    if (!row) {
      return null;
    }

    const decryptedFields = await this.decryption.decryptPassportFields(row);
    return this.serializer.deserializePassport(row, decryptedFields) as PassportRecord;
  }

  /**
   * Set a passport as primary for a user
   * @param {string} passportId - Passport ID to set as primary
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async setPrimary(passportId: string, userId: string): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      // Unset all other primary passports for this user
      await this.db.runAsync(
        `UPDATE ${this.tableName} SET is_primary = 0 WHERE user_id = ?`,
        [userId]
      );

      // Set this passport as primary
      await this.db.runAsync(
        `UPDATE ${this.tableName} SET is_primary = 1, updated_at = ? WHERE id = ?`,
        [new Date().toISOString(), passportId]
      );
    });
  }

  /**
   * Delete a passport
   * @param {string} id - Passport ID
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await this.db.runAsync(query, [id]);
  }

  /**
   * Delete all passports for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of deleted records
   */
  async deleteByUserId(userId: string): Promise<number> {
    const query = `DELETE FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.runAsync(query, [userId]);
    return result.changes || 0;
  }

  /**
   * Count passports for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of passports
   */
  async countByUserId(userId: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.getFirstAsync(query, [userId]) as { count: number } | null;
    return result?.count || 0;
  }

  /**
   * Check if passport exists
   * @param {string} id - Passport ID
   * @returns {Promise<boolean>} - True if exists
   */
  async exists(id: string): Promise<boolean> {
    const query = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const result = await this.db.getFirstAsync(query, [id]);
    return !!result;
  }

  /**
   * Get passport countries for a passport
   * @param {string} passportId - Passport ID
   * @returns {Promise<Array>} - Array of country records
   */
  async getCountries(passportId: string): Promise<unknown[]> {
    const query = `
      SELECT * FROM passport_countries
      WHERE passport_id = ?
      ORDER BY country_code ASC
    `;

    const rows = await this.db.getAllAsync(query, [passportId]);
    return rows || [];
  }

  /**
   * Get a specific country record for a passport
   * @param {string} passportId - Passport ID
   * @param {string} countryCode - Country code
   * @returns {Promise<Object|null>} - Country record or null
   */
  async getCountry(passportId: string, countryCode: string): Promise<unknown | null> {
    const query = `
      SELECT * FROM passport_countries
      WHERE passport_id = ? AND country_code = ?
      LIMIT 1
    `;

    const row = await this.db.getFirstAsync(query, [passportId, countryCode]);
    if (!row) {
      return null;
    }
    return row;
  }

  /**
   * Add country to passport
   * @param {string} passportId - Passport ID
   * @param {Object} countryData - Country data
   * @returns {Promise<void>}
   */
  async addCountry(passportId: string, countryData: CountryData): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO passport_countries (
        passport_id, country_code, visa_required, max_stay_days, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      passportId,
      countryData.countryCode,
      countryData.visaRequired ? 1 : 0,
      countryData.maxStayDays || null,
      countryData.notes || null,
      new Date().toISOString()
    ];

    await this.db.runAsync(query, params);
  }

  /**
   * Remove country from passport
   * @param {string} passportId - Passport ID
   * @param {string} countryCode - Country code
   * @returns {Promise<void>}
   */
  async removeCountry(passportId: string, countryCode: string): Promise<void> {
    const query = `
      DELETE FROM passport_countries
      WHERE passport_id = ? AND country_code = ?
    `;

    await this.db.runAsync(query, [passportId, countryCode]);
  }
}

export default PassportRepository;

