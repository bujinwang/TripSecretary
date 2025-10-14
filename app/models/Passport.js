/**
 * 入境通 - Passport Data Model
 * Defines the structure and validation for passport information
 *
 * Security: Sensitive fields are encrypted at field level
 */

import SecureStorageService from '../services/security/SecureStorageService';
import { getNationalityDisplayName, getNationalityCode } from '../data/nationalities';

class Passport {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.userId = data.userId;
    this.passportNumber = data.passportNumber; // 🔴 ENCRYPTED
    this.fullName = data.fullName; // 🔴 ENCRYPTED
    this.dateOfBirth = data.dateOfBirth; // 🔴 ENCRYPTED
    this.nationality = data.nationality; // 🔴 ENCRYPTED
    this.expiryDate = data.expiryDate; // 🟢 PLAINTEXT (not sensitive)
    this.issueDate = data.issueDate; // 🟢 PLAINTEXT (not sensitive)
    this.issuePlace = data.issuePlace; // 🟢 PLAINTEXT (not sensitive)
    this.photoUri = data.photoUri; // 🟢 PLAINTEXT (file reference)
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Generate unique passport ID
   * @returns {string} - Unique passport ID
   */
  static generateId() {
    return `passport_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get nationality display name (Chinese name)
   * @returns {string} - Display name in Chinese
   */
  getNationalityDisplayName() {
    return getNationalityDisplayName(this.nationality) || this.nationality;
  }

  /**
   * Set nationality from display name
   * @param {string} displayName - Chinese display name
   */
  setNationalityFromDisplayName(displayName) {
    this.nationality = getNationalityCode(displayName);
  }

  /**
   * Get nationality with code and display name format
   * @returns {string} - Formatted nationality (e.g., "CHN : 中国")
   */
  getFormattedNationality() {
    const displayName = this.getNationalityDisplayName();
    return this.nationality ? `${this.nationality} : ${displayName}` : displayName;
  }

  /**
   * Parse full name into surname and given name
   * @returns {Object} - Object with surname and givenName properties
   */
  parseFullName() {
    if (!this.fullName) {
      return { surname: '', givenName: '' };
    }

    const parts = this.fullName.split(',').map(part => part.trim());
    if (parts.length === 2) {
      return {
        surname: parts[0],
        givenName: parts[1]
      };
    }

    // If not in expected format, treat as given name only
    return {
      surname: '',
      givenName: this.fullName
    };
  }

  /**
   * Set full name from surname and given name
   * @param {string} surname - Surname/family name
   * @param {string} givenName - Given name
   */
  setFullNameFromParts(surname, givenName) {
    const parts = [surname, givenName].filter(Boolean);
    this.fullName = parts.join(', ');
  }

  /**
   * Get surname only
   * @returns {string} - Surname or empty string
   */
  getSurname() {
    return this.parseFullName().surname;
  }

  /**
   * Get given name only
   * @returns {string} - Given name or full name if not separated
   */
  getGivenName() {
    const parsed = this.parseFullName();
    return parsed.givenName || this.fullName || '';
  }

  /**
   * Validate passport data
   * @returns {Object} - Validation result {isValid, errors}
   */
  validate() {
    const errors = [];

    // Required fields
    if (!this.passportNumber || this.passportNumber.trim().length === 0) {
      errors.push('Passport number is required');
    }

    if (!this.fullName || this.fullName.trim().length === 0) {
      errors.push('Full name is required');
    }

    if (!this.dateOfBirth) {
      errors.push('Date of birth is required');
    }

    if (!this.nationality) {
      errors.push('Nationality is required');
    }

    // Format validations
    if (this.passportNumber && !this.isValidPassportNumber(this.passportNumber)) {
      errors.push('Invalid passport number format');
    }

    if (this.dateOfBirth && !this.isValidDate(this.dateOfBirth)) {
      errors.push('Invalid date of birth format');
    }

    if (this.expiryDate && !this.isValidDate(this.expiryDate)) {
      errors.push('Invalid expiry date format');
    }

    if (this.issueDate && !this.isValidDate(this.issueDate)) {
      errors.push('Invalid issue date format');
    }

    // Business logic validations
    if (this.expiryDate && this.issueDate) {
      const expiry = new Date(this.expiryDate);
      const issue = new Date(this.issueDate);
      if (expiry <= issue) {
        errors.push('Expiry date must be after issue date');
      }
    }

    if (this.expiryDate) {
      const expiry = new Date(this.expiryDate);
      const now = new Date();
      if (expiry <= now) {
        errors.push('Passport has expired');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate passport number format
   * @param {string} number - Passport number
   * @returns {boolean} - Is valid format
   */
  isValidPassportNumber(number) {
    // Basic validation: alphanumeric, 6-12 characters
    const passportRegex = /^[A-Z0-9]{6,12}$/i;
    return passportRegex.test(number.replace(/\s/g, ''));
  }

  /**
   * Validate date format (YYYY-MM-DD)
   * @param {string} dateStr - Date string
   * @returns {boolean} - Is valid date
   */
  isValidDate(dateStr) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return false;

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Check if passport is expired
   * @returns {boolean} - Is expired
   */
  isExpired() {
    if (!this.expiryDate) return false;
    const expiry = new Date(this.expiryDate);
    const now = new Date();
    return expiry <= now;
  }

  /**
   * Check if passport expires soon (within 6 months)
   * @returns {boolean} - Expires soon
   */
  expiresSoon() {
    if (!this.expiryDate) return false;
    const expiry = new Date(this.expiryDate);
    const now = new Date();
    const sixMonthsFromNow = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
    return expiry <= sixMonthsFromNow && expiry > now;
  }

  /**
   * Get days until expiry
   * @returns {number} - Days until expiry (negative if expired)
   */
  daysUntilExpiry() {
    if (!this.expiryDate) return null;
    const expiry = new Date(this.expiryDate);
    const now = new Date();
    const diffTime = expiry - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Save passport to secure storage
   * @param {Object} options - Save options
   * @param {boolean} options.skipValidation - Skip validation for progressive filling
   * @returns {Promise<Object>} - Save result
   */
  async save(options = {}) {
    try {
      // Validate before saving (unless skipped for progressive filling)
      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Update timestamp
      this.updatedAt = new Date().toISOString();

      // Save to secure storage
      const result = await SecureStorageService.savePassport({
        id: this.id,
        userId: this.userId,
        passportNumber: this.passportNumber,
        fullName: this.fullName,
        dateOfBirth: this.dateOfBirth,
        nationality: this.nationality,
        expiryDate: this.expiryDate,
        issueDate: this.issueDate,
        issuePlace: this.issuePlace,
        photoUri: this.photoUri,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      });

      return result;
    } catch (error) {
      console.error('Failed to save passport:', error);
      throw error;
    }
  }

  /**
   * Load passport from secure storage
   * @param {string} id - Passport ID
   * @returns {Promise<Passport>} - Passport instance
   */
  static async load(id) {
    try {
      const data = await SecureStorageService.getPassport(id);
      if (!data) return null;

      return new Passport(data);
    } catch (error) {
      console.error('Failed to load passport:', error);
      throw error;
    }
  }

  /**
   * Delete passport from storage
   * @returns {Promise<boolean>} - Success status
   */
  async delete() {
    try {
      // Note: SecureStorageService doesn't have deletePassport method yet
      // This would need to be implemented
      console.warn('Delete passport not yet implemented in SecureStorageService');
      return false;
    } catch (error) {
      console.error('Failed to delete passport:', error);
      throw error;
    }
  }

  /**
   * Get passport summary (safe for logging)
   * @returns {Object} - Sanitized passport data
   */
  getSummary() {
    return {
      id: this.id,
      nationality: this.nationality,
      expiryDate: this.expiryDate,
      isExpired: this.isExpired(),
      expiresSoon: this.expiresSoon(),
      daysUntilExpiry: this.daysUntilExpiry(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Export passport data for GDPR compliance
   * @returns {Object} - Exportable passport data
   */
  exportData() {
    return {
      id: this.id,
      passportNumber: this.passportNumber, // Will be decrypted by storage service
      fullName: this.fullName,
      dateOfBirth: this.dateOfBirth,
      nationality: this.nationality,
      expiryDate: this.expiryDate,
      issueDate: this.issueDate,
      issuePlace: this.issuePlace,
      photoUri: this.photoUri,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: {
        isExpired: this.isExpired(),
        expiresSoon: this.expiresSoon(),
        daysUntilExpiry: this.daysUntilExpiry()
      }
    };
  }

  /**
   * Create passport from OCR result
   * @param {Object} ocrResult - OCR recognition result
   * @param {string} userId - User ID
   * @returns {Passport} - Passport instance
   */
  static fromOCRResult(ocrResult, userId) {
    return new Passport({
      userId,
      passportNumber: ocrResult.passportNumber,
      fullName: ocrResult.fullName,
      dateOfBirth: ocrResult.dateOfBirth,
      nationality: ocrResult.nationality,
      expiryDate: ocrResult.expiryDate,
      issueDate: ocrResult.issueDate,
      issuePlace: ocrResult.issuePlace,
      photoUri: ocrResult.photoUri
    });
  }

  /**
   * Get display name for passport
   * @returns {string} - Display name
   */
  getDisplayName() {
    if (this.fullName && this.passportNumber) {
      return `${this.fullName} (${this.passportNumber})`;
    }
    return this.passportNumber || 'Unnamed Passport';
  }
}

export default Passport;