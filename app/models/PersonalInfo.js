/**
 * 入境通 - Personal Information Data Model
 * Defines the structure and validation for personal information
 *
 * Security: Sensitive fields are encrypted at field level
 */

import SecureStorageService from '../services/security/SecureStorageService';

class PersonalInfo {
  constructor(data = {}) {
    this.id = data.id || PersonalInfo.generateId();
    this.userId = data.userId;
    this.passportId = data.passportId || null; // NEW: Optional link to passport
    this.phoneNumber = data.phoneNumber; // 🔴 ENCRYPTED
    this.email = data.email; // 🔴 ENCRYPTED
    this.homeAddress = data.homeAddress; // 🔴 ENCRYPTED
    this.occupation = data.occupation; // 🟢 PLAINTEXT (not sensitive)
    this.provinceCity = data.provinceCity; // 🟢 PLAINTEXT (not sensitive)
    this.countryRegion = data.countryRegion; // 🟢 PLAINTEXT (not sensitive)
    this.phoneCode = data.phoneCode; // 🟢 PLAINTEXT (not sensitive)
    // NOTE: gender field removed - use passport.gender instead (single source of truth)
    this.isDefault = data.isDefault || 0; // NEW: default personal info for user
    this.label = data.label || null; // NEW: Label for personal info (e.g., "China", "Hong Kong")
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Generate unique personal info ID
   * @returns {string} - Unique personal info ID
   */
  static generateId() {
    return `personal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate personal information data
   * @returns {Object} - Validation result {isValid, errors}
   */
  validate() {
    const errors = [];

    // Email validation (if provided)
    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Invalid email format');
    }

    // Phone validation (if provided)
    if (this.phoneNumber && !this.isValidPhoneNumber(this.phoneNumber)) {
      errors.push('Invalid phone number format');
    }

    // Required fields check (at least one contact method)
    const hasEmail = this.email && this.email.trim().length > 0;
    const hasPhone = this.phoneNumber && this.phoneNumber.trim().length > 0;

    if (!hasEmail && !hasPhone) {
      errors.push('At least one contact method (email or phone) is required');
    }

    // Address validation (if provided)
    if (this.homeAddress && this.homeAddress.trim().length < 5) {
      errors.push('Home address must be at least 5 characters long');
    }

    // Occupation validation (if provided)
    if (this.occupation && this.occupation.trim().length < 2) {
      errors.push('Occupation must be at least 2 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   * @param {string} email - Email address
   * @returns {boolean} - Is valid email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format (basic validation)
   * @param {string} phone - Phone number
   * @returns {boolean} - Is valid phone
   */
  isValidPhoneNumber(phone) {
    // Remove all non-digit characters except + and spaces
    const cleanPhone = phone.replace(/[^\d+\s-()]/g, '');

    // Basic validation: at least 7 digits, may start with +
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,}$/;
    return phoneRegex.test(cleanPhone) && cleanPhone.replace(/\D/g, '').length >= 7;
  }

  /**
   * Format phone number for display
   * @returns {string} - Formatted phone number
   */
  getFormattedPhoneNumber() {
    if (!this.phoneNumber) return '';

    // Basic formatting for Chinese numbers
    const cleaned = this.phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('86') && cleaned.length === 13) {
      // Chinese mainland: +86 XXX XXXX XXXX
      return `+86 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`;
    } else if (cleaned.startsWith('852') && cleaned.length === 11) {
      // Hong Kong: +852 XXXX XXXX
      return `+852 ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
    } else if (cleaned.startsWith('853') && cleaned.length === 10) {
      // Macau: +853 XXXX XXXX
      return `+853 ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
    }

    // Default: return as-is
    return this.phoneNumber;
  }

  /**
   * Get primary contact method
   * @returns {string} - Primary contact (email or phone)
   */
  getPrimaryContact() {
    if (this.email) return this.email;
    if (this.phoneNumber) return this.getFormattedPhoneNumber();
    return '';
  }

  /**
   * Check if contact information is complete
   * @returns {boolean} - Has complete contact info
   */
  hasCompleteContactInfo() {
    return (this.email && this.isValidEmail(this.email)) ||
           (this.phoneNumber && this.isValidPhoneNumber(this.phoneNumber));
  }

  /**
   * Get location string
   * @returns {string} - Formatted location
   */
  getLocationString() {
    const parts = [];
    if (this.provinceCity) parts.push(this.provinceCity);
    if (this.countryRegion) parts.push(this.countryRegion);
    return parts.join(', ') || 'Not specified';
  }

  /**
   * Save personal information to secure storage
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
      const result = await SecureStorageService.savePersonalInfo({
        id: this.id,
        userId: this.userId,
        passportId: this.passportId, // NEW
        phoneNumber: this.phoneNumber,
        email: this.email,
        homeAddress: this.homeAddress,
        occupation: this.occupation,
        provinceCity: this.provinceCity,
        countryRegion: this.countryRegion,
        phoneCode: this.phoneCode,
        // NOTE: gender field removed - use passport.gender instead
        isDefault: this.isDefault, // NEW
        label: this.label, // NEW
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      });

      return result;
    } catch (error) {
      console.error('Failed to save personal info:', error);
      throw error;
    }
  }

  /**
     * Load personal information from secure storage
     * @param {string} userId - User ID
     * @returns {Promise<PersonalInfo>} - PersonalInfo instance
     */
    static async loadDefault(userId) {
      try {
        console.log('=== PERSONAL INFO LOAD DEBUG ===');
        console.log('PersonalInfo.loadDefault called with userId:', userId);
        console.log('Type of userId:', typeof userId);

        const data = await SecureStorageService.getPersonalInfo(userId); // This will return the default personal info
        console.log('SecureStorageService.getPersonalInfo result:', data);

        if (!data) {
          console.log('No default personal info data found in database for userId:', userId);
          return null;
        }

        console.log('Default personal info data found, creating instance...');
        const personalInfo = new PersonalInfo(data);
        console.log('PersonalInfo instance created with id:', personalInfo.id);
        return personalInfo;
      } catch (error) {
        console.error('Failed to load default personal info:', error);
        console.error('Error details:', error.message, error.stack);
        throw error;
      }
    }

  /**
   * Load personal information by ID from secure storage
   * @param {string} personalInfoId - Personal info ID
   * @returns {Promise<PersonalInfo>} - PersonalInfo instance
   */
  static async load(personalInfoId) {
    try {
      const data = await SecureStorageService.getPersonalInfoById(personalInfoId);
      if (!data) return null;
      return new PersonalInfo(data);
    } catch (error) {
      console.error('Failed to load personal info by ID:', error);
      throw error;
    }
  }

  /**
   * Get personal information by user ID
   * This is an alias for load() to provide a more explicit API
   * @param {string} userId - User ID
   * @returns {Promise<PersonalInfo>} - PersonalInfo instance
   */
  static async getByUserId(userId) {
    return await PersonalInfo.loadDefault(userId);
  }

  /**
   * Update specific fields
   * @param {Object} updates - Fields to update
   * @param {Object} options - Update options
   * @param {boolean} options.skipValidation - Skip validation for progressive filling
   * @returns {Promise<Object>} - Update result
   */
  async update(updates, options = {}) {
    try {
      // Update fields
      Object.assign(this, updates);
      this.updatedAt = new Date().toISOString();

      // Validate updated data (unless skipped for progressive filling)
      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Save updated data
      return await this.save(options);
    } catch (error) {
      console.error('Failed to update personal info:', error);
      throw error;
    }
  }

  /**
   * Merge updates without overwriting existing non-empty fields with empty values
   * This is useful for progressive data filling where we don't want to lose existing data
   * @param {Object} updates - Fields to merge
   * @param {Object} options - Update options
   * @param {boolean} options.skipValidation - Skip validation for progressive filling
   * @returns {Promise<Object>} - Update result
   */
   async mergeUpdates(updates, options = {}) {
     try {
       console.log('=== 🔍 PERSONAL INFO MERGE UPDATES DEBUG ===');
       console.log('mergeUpdates called with:');
       console.log('- updates:', JSON.stringify(updates, null, 2));
       console.log('- options:', options);

       console.log('Current PersonalInfo state before merge:');
       console.log('- phoneNumber:', this.phoneNumber);
       console.log('- email:', this.email);
       console.log('- occupation:', this.occupation);
       console.log('- provinceCity:', this.provinceCity);
       console.log('- countryRegion:', this.countryRegion);
       console.log('- phoneCode:', this.phoneCode);
       console.log('- gender:', this.gender);

       // Filter out only null/undefined values from updates
       // BUT preserve empty strings as they indicate intentional clearing of a field
       const nonEmptyUpdates = {};

       for (const [key, value] of Object.entries(updates)) {
         // Skip metadata fields that shouldn't be updated
         if (key === 'id' || key === 'createdAt') {
           continue;
         }

         // Include all values except null/undefined
         // Empty strings are kept as they indicate intentional field clearing
         if (value !== null && value !== undefined) {
           nonEmptyUpdates[key] = value;
           console.log(`✅ Including field ${key}:`, typeof value === 'string' ? `"${value}"` : value);
         } else {
           console.log(`❌ Skipping field ${key}: null/undefined`);
         }
       }

       console.log('Non-empty updates to apply:', JSON.stringify(nonEmptyUpdates, null, 2));

       // Update timestamp
       this.updatedAt = new Date().toISOString();

       // Merge non-empty updates into current instance
       Object.assign(this, nonEmptyUpdates);

       console.log('PersonalInfo state after merge:');
       console.log('- phoneNumber:', this.phoneNumber);
       console.log('- email:', this.email);
       console.log('- occupation:', this.occupation);
       console.log('- provinceCity:', this.provinceCity);
       console.log('- countryRegion:', this.countryRegion);
       console.log('- phoneCode:', this.phoneCode);
       console.log('- gender:', this.gender);

       // Validate merged data (unless skipped for progressive filling)
       if (!options.skipValidation) {
         const validation = this.validate();
         if (!validation.isValid) {
           throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
         }
       }

       // Save merged data
       console.log('About to save merged data...');
       const saveResult = await this.save(options);
       console.log('✅ Personal info merge and save completed successfully');

       return saveResult;
     } catch (error) {
       console.error('❌ Failed to merge personal info updates:', error);
       console.error('Error details:', error.message, error.stack);
       throw error;
     }
   }

  /**
   * Get personal info summary (safe for logging)
   * @returns {Object} - Sanitized personal info data
   */
  getSummary() {
    return {
      id: this.id,
      hasEmail: !!this.email,
      hasPhone: !!this.phoneNumber,
      hasAddress: !!this.homeAddress,
      occupation: this.occupation,
      location: this.getLocationString(),
      hasCompleteContact: this.hasCompleteContactInfo(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Export personal information for GDPR compliance
   * @returns {Object} - Exportable personal info data
   */
  exportData() {
    return {
      id: this.id,
      passportId: this.passportId, // NEW: Schema v2.0 field
      phoneNumber: this.phoneNumber, // Will be decrypted by storage service
      email: this.email,
      homeAddress: this.homeAddress,
      occupation: this.occupation,
      provinceCity: this.provinceCity,
      countryRegion: this.countryRegion,
      phoneCode: this.phoneCode,
      // NOTE: gender field removed - use passport.gender instead
      isDefault: this.isDefault, // NEW: Schema v2.0 field
      label: this.label, // NEW: Schema v2.0 field
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: {
        hasCompleteContact: this.hasCompleteContactInfo(),
        primaryContact: this.getPrimaryContact(),
        location: this.getLocationString()
      }
    };
  }

  /**
   * Create personal info from user input
   * @param {Object} inputData - User input data
   * @param {string} userId - User ID
   * @returns {PersonalInfo} - PersonalInfo instance
   */
  static fromUserInput(inputData, userId) {
    return new PersonalInfo({
      userId,
      passportId: inputData.passportId,
      phoneNumber: inputData.phoneNumber,
      email: inputData.email,
      homeAddress: inputData.homeAddress,
      occupation: inputData.occupation,
      provinceCity: inputData.provinceCity,
      countryRegion: inputData.countryRegion,
      phoneCode: inputData.phoneCode,
      // NOTE: gender field removed - use passport.gender instead
      isDefault: inputData.isDefault,
      label: inputData.label
    });
  }

  /**
   * Get display name for contact info
   * @returns {string} - Display name
   */
  getDisplayName() {
    const contact = this.getPrimaryContact();
    if (contact) {
      return contact;
    }
    return 'Contact information not provided';
  }

  /**
   * Check if information is complete for immigration purposes
   * @returns {Object} - Completeness check result
   */
  checkImmigrationCompleteness() {
    const required = {
      phoneNumber: !!this.phoneNumber,
      email: !!this.email,
      homeAddress: !!this.homeAddress,
      occupation: !!this.occupation
    };

    const completeness = {
      required,
      completeCount: Object.values(required).filter(Boolean).length,
      totalRequired: Object.keys(required).length,
      percentage: Math.round((Object.values(required).filter(Boolean).length / Object.keys(required).length) * 100),
      missingFields: Object.keys(required).filter(key => !required[key])
    };

    return completeness;
  }
}

export default PersonalInfo;