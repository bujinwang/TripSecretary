/**
 * Decryption Helper Utility
 * Handles decryption of sensitive fields from database records
 *
 * Provides utilities for decrypting encrypted fields from database rows
 * and managing decryption errors gracefully.
 */

import EncryptionService from '../EncryptionService';

class DecryptionHelper {
  constructor() {
    this.encryption = EncryptionService;
    this.ENCRYPTION_ENABLED = false; // TODO: Re-enable before production
  }

  /**
   * Decrypt a single encrypted field
   * @param {string} encryptedValue - Encrypted field value
   * @param {string} fieldType - Type of field (e.g., 'passport_number', 'email')
   * @returns {Promise<string|null>} - Decrypted value or null if decryption fails
   */
  async decryptField(encryptedValue, fieldType = 'general') {
    if (!encryptedValue) {
      return null;
    }

    if (!this.ENCRYPTION_ENABLED) {
      return encryptedValue;
    }

    try {
      return await this.encryption.decrypt(encryptedValue, fieldType);
    } catch (error) {
      console.error(`Failed to decrypt ${fieldType}:`, error.message);
      return null;
    }
  }

  /**
   * Decrypt multiple fields from a database row
   * @param {Object} row - Database row with encrypted fields
   * @param {Array<string>} fieldNames - Names of fields to decrypt
   * @returns {Promise<Object>} - Object with decrypted fields
   */
  async decryptFields(row, fieldNames = []) {
    const decrypted = {};

    if (!row) {
      return decrypted;
    }

    for (const fieldName of fieldNames) {
      if (row[fieldName]) {
        decrypted[fieldName] = await this.decryptField(row[fieldName], fieldName);
      } else {
        decrypted[fieldName] = null;
      }
    }

    return decrypted;
  }

  /**
   * Decrypt passport sensitive fields
   * @param {Object} passportRow - Passport database row
   * @returns {Promise<Object>} - Decrypted passport fields
   */
  async decryptPassportFields(passportRow) {
    if (!passportRow) {
      return {};
    }

    const fieldMapping = {
      encrypted_passport_number: 'passport_number',
      encrypted_full_name: 'full_name',
      encrypted_date_of_birth: 'date_of_birth',
      encrypted_nationality: 'nationality'
    };

    const decrypted = {};

    for (const [encryptedField, decryptedField] of Object.entries(fieldMapping)) {
      if (passportRow[encryptedField]) {
        decrypted[decryptedField] = await this.decryptField(
          passportRow[encryptedField],
          decryptedField
        );
      } else {
        decrypted[decryptedField] = null;
      }
    }

    return decrypted;
  }

  /**
   * Decrypt personal info sensitive fields
   * @param {Object} personalInfoRow - Personal info database row
   * @returns {Promise<Object>} - Decrypted personal info fields
   */
  async decryptPersonalInfoFields(personalInfoRow) {
    if (!personalInfoRow) {
      return {};
    }

    const fieldMapping = {
      encrypted_phone_number: 'phone_number',
      encrypted_email: 'email',
      encrypted_home_address: 'home_address'
    };

    const decrypted = {};

    for (const [encryptedField, decryptedField] of Object.entries(fieldMapping)) {
      if (personalInfoRow[encryptedField]) {
        decrypted[decryptedField] = await this.decryptField(
          personalInfoRow[encryptedField],
          decryptedField
        );
      } else {
        decrypted[decryptedField] = null;
      }
    }

    return decrypted;
  }

  /**
   * Decrypt digital arrival card sensitive fields
   * @param {Object} dacRow - Digital arrival card database row
   * @returns {Promise<Object>} - Decrypted DAC fields
   */
  async decryptDigitalArrivalCardFields(dacRow) {
    if (!dacRow) {
      return {};
    }

    const decrypted = {};

    // DAC typically has JSON fields that may contain sensitive data
    if (dacRow.api_response) {
      try {
        const parsed = typeof dacRow.api_response === 'string' 
          ? JSON.parse(dacRow.api_response) 
          : dacRow.api_response;
        decrypted.api_response = parsed;
      } catch (error) {
        console.warn('Failed to parse DAC api_response:', error.message);
        decrypted.api_response = null;
      }
    }

    if (dacRow.error_details) {
      try {
        const parsed = typeof dacRow.error_details === 'string' 
          ? JSON.parse(dacRow.error_details) 
          : dacRow.error_details;
        decrypted.error_details = parsed;
      } catch (error) {
        console.warn('Failed to parse DAC error_details:', error.message);
        decrypted.error_details = null;
      }
    }

    return decrypted;
  }

  /**
   * Batch decrypt multiple rows
   * @param {Array<Object>} rows - Array of database rows
   * @param {Array<string>} fieldNames - Fields to decrypt in each row
   * @returns {Promise<Array<Object>>} - Array of rows with decrypted fields
   */
  async batchDecryptFields(rows, fieldNames = []) {
    if (!Array.isArray(rows)) {
      return [];
    }

    const decryptedRows = [];

    for (const row of rows) {
      const decryptedFields = await this.decryptFields(row, fieldNames);
      decryptedRows.push({
        ...row,
        ...decryptedFields
      });
    }

    return decryptedRows;
  }

  /**
   * Set encryption enabled status
   * @param {boolean} enabled - Whether encryption is enabled
   */
  setEncryptionEnabled(enabled) {
    this.ENCRYPTION_ENABLED = enabled;
  }

  /**
   * Get encryption enabled status
   * @returns {boolean} - Whether encryption is enabled
   */
  isEncryptionEnabled() {
    return this.ENCRYPTION_ENABLED;
  }
}

export default new DecryptionHelper();

