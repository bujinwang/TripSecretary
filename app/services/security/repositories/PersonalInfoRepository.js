/**
 * Personal Info Repository
 * Data access layer for personal information records
 *
 * Handles all database operations for personal info data including
 * CRUD operations, queries, and relationships.
 */

import DataSerializer from '../utils/DataSerializer';
import DecryptionHelper from '../utils/DecryptionHelper';

class PersonalInfoRepository {
  constructor(db) {
    this.db = db;
    this.serializer = DataSerializer;
    this.decryption = DecryptionHelper;
    this.tableName = 'personal_info';
  }

  /**
   * Save or update a personal info record
   * @param {Object} personalData - Personal info data to save
   * @returns {Promise<Object>} - Saved personal info record
   */
  async save(personalData) {
    if (!personalData || !personalData.userId) {
      throw new Error('Personal info data and userId are required');
    }

    const id = personalData.id || this.serializer.generateId();
    const now = new Date().toISOString();

    const query = `
      INSERT OR REPLACE INTO ${this.tableName} (
        id, user_id, passport_id, encrypted_phone_number, encrypted_email,
        encrypted_home_address, occupation, province_city, country_region,
        phone_code, gender, is_default, label, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      personalData.userId,
      personalData.passportId || null,
      personalData.encryptedPhoneNumber || personalData.phoneNumber,
      personalData.encryptedEmail || personalData.email,
      personalData.encryptedHomeAddress || personalData.homeAddress,
      personalData.occupation || null,
      personalData.provinceCity || null,
      personalData.countryRegion || null,
      personalData.phoneCode || null,
      personalData.gender || null,
      personalData.isDefault ? 1 : 0,
      personalData.label || null,
      personalData.createdAt || now,
      now
    ];

    await this.db.runAsync(query, params);
    return this.getById(id);
  }

  /**
   * Get personal info by ID
   * @param {string} id - Personal info ID
   * @returns {Promise<Object|null>} - Personal info record or null
   */
  async getById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const row = await this.db.getFirstAsync(query, [id]);

    if (!row) {
      return null;
    }

    const decryptedFields = await this.decryption.decryptPersonalInfoFields(row);
    return this.serializer.deserializePersonalInfo(row, decryptedFields);
  }

  /**
   * Get all personal info records for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of personal info records
   */
  async getByUserId(userId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY is_default DESC, created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId]);

    if (!rows || rows.length === 0) {
      return [];
    }

    const personalInfos = [];
    for (const row of rows) {
      const decryptedFields = await this.decryption.decryptPersonalInfoFields(row);
      personalInfos.push(this.serializer.deserializePersonalInfo(row, decryptedFields));
    }

    return personalInfos;
  }

  /**
   * Get default personal info for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Default personal info or null
   */
  async getDefaultByUserId(userId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND is_default = 1
      LIMIT 1
    `;

    const row = await this.db.getFirstAsync(query, [userId]);

    if (!row) {
      return null;
    }

    const decryptedFields = await this.decryption.decryptPersonalInfoFields(row);
    return this.serializer.deserializePersonalInfo(row, decryptedFields);
  }

  /**
   * Set personal info as default for a user
   * @param {string} personalInfoId - Personal info ID to set as default
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async setDefault(personalInfoId, userId) {
    await this.db.withTransactionAsync(async () => {
      // Unset all other default personal info for this user
      await this.db.runAsync(
        `UPDATE ${this.tableName} SET is_default = 0 WHERE user_id = ?`,
        [userId]
      );

      // Set this personal info as default
      await this.db.runAsync(
        `UPDATE ${this.tableName} SET is_default = 1, updated_at = ? WHERE id = ?`,
        [new Date().toISOString(), personalInfoId]
      );
    });
  }

  /**
   * Get personal info by passport ID
   * @param {string} passportId - Passport ID
   * @returns {Promise<Array>} - Array of personal info records
   */
  async getByPassportId(passportId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE passport_id = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [passportId]);

    if (!rows || rows.length === 0) {
      return [];
    }

    const personalInfos = [];
    for (const row of rows) {
      const decryptedFields = await this.decryption.decryptPersonalInfoFields(row);
      personalInfos.push(this.serializer.deserializePersonalInfo(row, decryptedFields));
    }

    return personalInfos;
  }

  /**
   * Delete personal info
   * @param {string} id - Personal info ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await this.db.runAsync(query, [id]);
  }

  /**
   * Delete all personal info for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of deleted records
   */
  async deleteByUserId(userId) {
    const query = `DELETE FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.runAsync(query, [userId]);
    return result.changes || 0;
  }

  /**
   * Count personal info records for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of personal info records
   */
  async countByUserId(userId) {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`;
    const result = await this.db.getFirstAsync(query, [userId]);
    return result?.count || 0;
  }

  /**
   * Check if personal info exists
   * @param {string} id - Personal info ID
   * @returns {Promise<boolean>} - True if exists
   */
  async exists(id) {
    const query = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const result = await this.db.getFirstAsync(query, [id]);
    return !!result;
  }

  /**
   * Update personal info label
   * @param {string} id - Personal info ID
   * @param {string} label - New label
   * @returns {Promise<void>}
   */
  async updateLabel(id, label) {
    const query = `
      UPDATE ${this.tableName}
      SET label = ?, updated_at = ?
      WHERE id = ?
    `;

    await this.db.runAsync(query, [label, new Date().toISOString(), id]);
  }

  /**
   * Get personal info by country region
   * @param {string} userId - User ID
   * @param {string} countryRegion - Country/region
   * @returns {Promise<Array>} - Array of personal info records
   */
  async getByCountryRegion(userId, countryRegion) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND country_region = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.getAllAsync(query, [userId, countryRegion]);

    if (!rows || rows.length === 0) {
      return [];
    }

    const personalInfos = [];
    for (const row of rows) {
      const decryptedFields = await this.decryption.decryptPersonalInfoFields(row);
      personalInfos.push(this.serializer.deserializePersonalInfo(row, decryptedFields));
    }

    return personalInfos;
  }
}

export default PersonalInfoRepository;

