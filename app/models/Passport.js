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
    this.id = data.id || Passport.generateId();
    this.userId = data.userId;
    this.passportNumber = data.passportNumber; // 🔴 ENCRYPTED
    this.fullName = data.fullName; // 🔴 ENCRYPTED
    this.dateOfBirth = data.dateOfBirth; // 🔴 ENCRYPTED
    this.nationality = data.nationality; // 🔴 ENCRYPTED
    this.gender = data.gender; // 🟢 PLAINTEXT (Male/Female/Undefined)
    this.expiryDate = data.expiryDate; // 🟢 PLAINTEXT (not sensitive)
    this.issueDate = data.issueDate; // 🟢 PLAINTEXT (not sensitive)
    this.issuePlace = data.issuePlace; // 🟢 PLAINTEXT (not sensitive)
    this.photoUri = data.photoUri; // 🟢 PLAINTEXT (file reference)
    this.isPrimary = data.isPrimary || false; // 🟢 PLAINTEXT (primary passport flag)
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
   * Supports formats: "SURNAME, GIVENNAME" or "SURNAME GIVENNAME"
   * @returns {Object} - Object with surname and givenName properties
   */
  parseFullName() {
    if (!this.fullName) {
      return { surname: '', givenName: '' };
    }

    // Try comma-separated format first (e.g., "ZHANG, WEI")
    if (this.fullName.includes(',')) {
      const parts = this.fullName.split(',').map(part => part.trim());
      if (parts.length === 2) {
        return {
          surname: parts[0],
          givenName: parts[1]
        };
      }
    }

    // Try space-separated format (e.g., "ZHANG WEI")
    const spaceParts = this.fullName.trim().split(/\s+/);
    if (spaceParts.length >= 2) {
      return {
        surname: spaceParts[0],
        givenName: spaceParts.slice(1).join(' ')
      };
    }

    // If only one word, treat as given name
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
   * @param {Object} options - Validation options
   * @param {boolean} options.partial - If true, only validate non-null fields (for progressive filling)
   * @returns {Object} - Validation result {isValid, errors}
   */
  validate(options = {}) {
    const errors = [];
    const { partial = false } = options;

    // Helper to check if field has value
    const hasValue = (value) => value !== null && value !== undefined && value !== '';

    // Required fields (only check if not partial validation)
    if (!partial) {
      if (!hasValue(this.passportNumber)) {
        errors.push('Passport number is required');
      }

      if (!hasValue(this.fullName)) {
        errors.push('Full name is required');
      }

      if (!hasValue(this.dateOfBirth)) {
        errors.push('Date of birth is required');
      }

      if (!hasValue(this.nationality)) {
        errors.push('Nationality is required');
      }
    }

    // Gender validation (only if provided)
    if (hasValue(this.gender) && !['Male', 'Female', 'Undefined'].includes(this.gender)) {
      errors.push('Gender must be Male, Female, or Undefined');
    }

    // Format validations (only validate if field has value)
    if (hasValue(this.passportNumber) && !this.isValidPassportNumber(this.passportNumber)) {
      errors.push('Invalid passport number format');
    }

    if (hasValue(this.dateOfBirth) && !this.isValidDate(this.dateOfBirth)) {
      errors.push('Invalid date of birth format');
    }

    if (hasValue(this.expiryDate) && !this.isValidDate(this.expiryDate)) {
      errors.push('Invalid expiry date format');
    }

    if (hasValue(this.issueDate) && !this.isValidDate(this.issueDate)) {
      errors.push('Invalid issue date format');
    }

    // Business logic validations (only if both fields have values)
    if (hasValue(this.expiryDate) && hasValue(this.issueDate)) {
      const expiry = new Date(this.expiryDate);
      const issue = new Date(this.issueDate);
      if (expiry <= issue) {
        errors.push('Expiry date must be after issue date');
      }
    }

    if (hasValue(this.expiryDate)) {
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
      console.log('=== PASSPORT MODEL SAVE DEBUG ===');
      console.log('Passport.save called');
      console.log('Passport instance data:', {
        id: this.id,
        userId: this.userId,
        passportNumber: this.passportNumber,
        fullName: this.fullName,
        dateOfBirth: this.dateOfBirth,
        nationality: this.nationality,
        gender: this.gender,
        expiryDate: this.expiryDate
      });
      console.log('options received:', options);
      console.log('options.skipValidation:', options.skipValidation);
      console.log('options.partial:', options.partial);

      // Validate before saving (unless skipped for progressive filling)
      if (!options.skipValidation) {
        console.log('=== VALIDATION IS RUNNING ===');
        console.log('About to call this.validate()');
        const validation = this.validate({ partial: options.partial || false });
        console.log('Validation result:', validation);
        if (!validation.isValid) {
          console.log('Validation failed with errors:', validation.errors);
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        } else {
          console.log('Validation passed');
        }
      } else {
        console.log('=== SKIPPING VALIDATION ===');
        console.log('skipValidation is true, bypassing validation');
      }

      // Update timestamp
      this.updatedAt = new Date().toISOString();

      // Filter out null/undefined values for progressive filling
      const dataToSave = {
        id: this.id,
        userId: this.userId,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };

      // Only include fields that have values
      if (this.passportNumber !== null && this.passportNumber !== undefined && this.passportNumber !== '') {
        dataToSave.passportNumber = this.passportNumber;
      }
      if (this.fullName !== null && this.fullName !== undefined && this.fullName !== '') {
        dataToSave.fullName = this.fullName;
      }
      if (this.dateOfBirth !== null && this.dateOfBirth !== undefined && this.dateOfBirth !== '') {
        dataToSave.dateOfBirth = this.dateOfBirth;
      }
      if (this.nationality !== null && this.nationality !== undefined && this.nationality !== '') {
        dataToSave.nationality = this.nationality;
      }
      if (this.gender !== null && this.gender !== undefined && this.gender !== '') {
        dataToSave.gender = this.gender;
      }
      if (this.expiryDate !== null && this.expiryDate !== undefined && this.expiryDate !== '') {
        dataToSave.expiryDate = this.expiryDate;
      }
      if (this.issueDate !== null && this.issueDate !== undefined && this.issueDate !== '') {
        dataToSave.issueDate = this.issueDate;
      }
      if (this.issuePlace !== null && this.issuePlace !== undefined && this.issuePlace !== '') {
        dataToSave.issuePlace = this.issuePlace;
      }
      if (this.photoUri !== null && this.photoUri !== undefined && this.photoUri !== '') {
        dataToSave.photoUri = this.photoUri;
      }
      if (this.isPrimary !== null && this.isPrimary !== undefined) {
        dataToSave.isPrimary = this.isPrimary;
      }

      // Save to secure storage
      console.log('About to call SecureStorageService.savePassport with filtered data:', dataToSave);
      const result = await SecureStorageService.savePassport(dataToSave);

      console.log('SecureStorageService.savePassport completed successfully');
      return result;
    } catch (error) {
      console.error('=== PASSPORT MODEL SAVE ERROR ===');
      console.error('Error in Passport.save:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Load passport from secure storage
   * @param {string} idOrUserId - Passport ID or User ID
   * @param {Object} options - Load options
   * @param {boolean} options.byUserId - If true, treat first param as userId
   * @returns {Promise<Passport>} - Passport instance
   */
  static async load(idOrUserId, options = {}) {
    try {
      let data;
      
      if (options.byUserId) {
        // Load by userId - get primary passport
        data = await SecureStorageService.getUserPassport(idOrUserId);
      } else {
        // Load by passport ID
        data = await SecureStorageService.getPassport(idOrUserId);
      }
      
      if (!data) return null;

      return new Passport(data);
    } catch (error) {
      console.error('Failed to load passport:', error);
      throw error;
    }
  }

  /**
   * Get user's primary passport
   * @param {string} userId - User ID
   * @returns {Promise<Passport>} - Primary passport instance
   */
  static async getPrimaryPassport(userId) {
    try {
      const data = await SecureStorageService.getUserPassport(userId);
      if (!data) return null;

      return new Passport(data);
    } catch (error) {
      console.error('Failed to get primary passport:', error);
      throw error;
    }
  }

  /**
   * List all passports for a user
   * @param {string} userId - User ID
   * @returns {Promise<Passport[]>} - Array of passport instances
   */
  static async listPassports(userId) {
    try {
      const passportsData = await SecureStorageService.listUserPassports(userId);
      if (!passportsData || passportsData.length === 0) return [];

      return passportsData.map(data => new Passport(data));
    } catch (error) {
      console.error('Failed to list passports:', error);
      throw error;
    }
  }

  /**
   * Set this passport as the primary passport for the user
   * @returns {Promise<boolean>} - Success status
   */
  async setAsPrimary() {
    try {
      if (!this.userId) {
        throw new Error('Cannot set as primary: userId is not set');
      }

      // Get all user passports
      const allPassports = await Passport.listPassports(this.userId);

      // Update all passports: set this one as primary, others as non-primary
      for (const passport of allPassports) {
        if (passport.id === this.id) {
          passport.isPrimary = true;
        } else {
          passport.isPrimary = false;
        }
        await passport.save({ skipValidation: true });
      }

      // Update this instance
      this.isPrimary = true;

      return true;
    } catch (error) {
      console.error('Failed to set as primary passport:', error);
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
      gender: this.gender,
      expiryDate: this.expiryDate,
      issueDate: this.issueDate,
      issuePlace: this.issuePlace,
      photoUri: this.photoUri,
      isPrimary: this.isPrimary,
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
      gender: ocrResult.gender,
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