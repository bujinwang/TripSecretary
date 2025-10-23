/**
 * PassportCountry Model - Represents visa requirements for a specific passport and country.
 */

import SecureStorageService from '../services/security/SecureStorageService';

class PassportCountry {
  constructor(data = {}) {
    this.passportId = data.passportId;
    this.countryCode = data.countryCode;
    this.visaRequired = data.visaRequired || 0; // 0 for no, 1 for yes
    this.maxStayDays = data.maxStayDays || null;
    this.notes = data.notes || null;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  /**
   * Save PassportCountry to secure storage.
   * @returns {Promise<Object>} - Save result.
   */
  async save() {
    try {
      const result = await SecureStorageService.savePassportCountry({
        passportId: this.passportId,
        countryCode: this.countryCode,
        visaRequired: this.visaRequired,
        maxStayDays: this.maxStayDays,
        notes: this.notes,
        createdAt: this.createdAt,
      });
      return result;
    } catch (error) {
      console.error('Failed to save PassportCountry:', error);
      throw error;
    }
  }

  /**
   * Load PassportCountry from secure storage by passportId and countryCode.
   * @param {string} passportId - The ID of the passport.
   * @param {string} countryCode - The country code.
   * @returns {Promise<PassportCountry|null>} - PassportCountry instance or null.
   */
  static async load(passportId, countryCode) {
    try {
      const data = await SecureStorageService.getPassportCountry(passportId, countryCode);
      if (!data) {
        return null;
      }
      return new PassportCountry(data);
    } catch (error) {
      console.error('Failed to load PassportCountry:', error);
      throw error;
    }
  }

  /**
   * Get all PassportCountry records for a given passportId.
   * @param {string} passportId - The ID of the passport.
   * @returns {Promise<Array<PassportCountry>>} - Array of PassportCountry instances.
   */
  static async getByPassportId(passportId) {
    try {
      const data = await SecureStorageService.getPassportCountriesByPassportId(passportId);
      return data.map(item => new PassportCountry(item));
    } catch (error) {
      console.error('Failed to get PassportCountries by passportId:', error);
      throw error;
    }
  }
}

export default PassportCountry;
