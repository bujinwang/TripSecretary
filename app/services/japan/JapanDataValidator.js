/**
 * Japan Data Validator Service
 * Provides validation logic for Japan-specific data requirements
 * Validates passport, personal info, travel info, and fund data for Japan entry
 */
import JapanFormHelper from '../../utils/japan/JapanFormHelper';

class JapanDataValidator {
  /**
   * Validate passport data for Japan entry
   * @param {Object} passport - Passport data object
   * @returns {Object} - Validation result with completion status
   */
  static validatePassportData(passport) {
    const errors = [];
    const requiredFields = ['passportNumber', 'fullName', 'nationality', 'dateOfBirth', 'expiryDate'];
    const fieldStatus = {};
    
    // Check required fields
    requiredFields.forEach(field => {
      const hasValue = passport && passport[field] && passport[field].toString().trim().length > 0;
      fieldStatus[field] = hasValue;
      
      if (!hasValue) {
        errors.push(`Passport ${field} is required`);
      }
    });

    // Format validations
    if (passport) {
      // Passport number format
      if (passport.passportNumber && !this.isValidPassportNumber(passport.passportNumber)) {
        errors.push('Invalid passport number format');
        fieldStatus.passportNumber = false;
      }

      // Date validations
      if (passport.dateOfBirth && !this.isValidDate(passport.dateOfBirth)) {
        errors.push('Invalid date of birth format');
        fieldStatus.dateOfBirth = false;
      }

      if (passport.expiryDate && !this.isValidDate(passport.expiryDate)) {
        errors.push('Invalid expiry date format');
        fieldStatus.expiryDate = false;
      }

      // Check if passport is expired
      if (passport.expiryDate && this.isValidDate(passport.expiryDate)) {
        const expiryDate = JapanFormHelper.parseLocalDate(passport.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!expiryDate || expiryDate <= today) {
          errors.push('Passport has expired');
          fieldStatus.expiryDate = false;
        }
      }

      // Gender validation (optional but if provided must be valid)
      if (passport.gender && !['Male', 'Female', 'Undefined'].includes(passport.gender)) {
        errors.push('Invalid gender value');
      }
    }

    const filledCount = Object.values(fieldStatus).filter(Boolean).length;
    const totalCount = requiredFields.length;

    return {
      isValid: errors.length === 0,
      isComplete: filledCount === totalCount,
      errors,
      fieldCount: {
        filled: filledCount,
        total: totalCount
      }
    };
  }

  /**
   * Validate personal information for Japan entry
   * @param {Object} personalInfo - Personal info data object
   * @returns {Object} - Validation result with completion status
   */
  static validatePersonalInfo(personalInfo) {
    const errors = [];
    const requiredFields = ['occupation', 'cityOfResidence', 'residentCountry', 'phoneNumber', 'email', 'gender'];
    const fieldStatus = {};

    // Check required fields
    requiredFields.forEach(field => {
      const hasValue = personalInfo && personalInfo[field] && personalInfo[field].toString().trim().length > 0;
      fieldStatus[field] = hasValue;
      
      if (!hasValue) {
        errors.push(`Personal info ${field} is required`);
      }
    });

    // Format validations
    if (personalInfo) {
      // Email validation
      if (personalInfo.email && !this.isValidEmail(personalInfo.email)) {
        errors.push('Invalid email format');
        fieldStatus.email = false;
      }

      // Phone validation
      if (personalInfo.phoneNumber && !this.isValidPhoneNumber(personalInfo.phoneNumber)) {
        errors.push('Invalid phone number format');
        fieldStatus.phoneNumber = false;
      }

      // Occupation validation
      if (personalInfo.occupation && personalInfo.occupation.trim().length < 2) {
        errors.push('Occupation must be at least 2 characters');
        fieldStatus.occupation = false;
      }

      // Gender validation - removed from personalInfo, validated in passport instead
      // if (personalInfo.gender && !['Male', 'Female', 'Undefined'].includes(personalInfo.gender)) {
      //   errors.push('Invalid gender value');
      //   fieldStatus.gender = false;
      // }
    }

    const filledCount = Object.values(fieldStatus).filter(Boolean).length;
    const totalCount = requiredFields.length;

    return {
      isValid: errors.length === 0,
      isComplete: filledCount === totalCount,
      errors,
      fieldCount: {
        filled: filledCount,
        total: totalCount
      }
    };
  }

  /**
   * Validate travel information for Japan entry
   * Japan-specific: No departure flight info required, accommodation phone required
   * @param {Object} travelInfo - Travel info data object
   * @returns {Object} - Validation result with completion status
   */
  static validateTravelInfo(travelInfo) {
    const errors = [];
    // Japan-specific required fields (no departure flight info)
    const requiredFields = [
      'travelPurpose',
      'arrivalFlightNumber',
      'arrivalDate',
      'accommodationAddress',
      'accommodationPhone',
      'lengthOfStay'
    ];
    const fieldStatus = {};

    // Check required fields
    requiredFields.forEach(field => {
      const hasValue = travelInfo && travelInfo[field] && travelInfo[field].toString().trim().length > 0;
      fieldStatus[field] = hasValue;
      
      if (!hasValue) {
        errors.push(`Travel info ${field} is required`);
      }
    });

    // Format validations
    if (travelInfo) {
      // Flight number validation
      if (travelInfo.arrivalFlightNumber && !this.isValidFlightNumber(travelInfo.arrivalFlightNumber)) {
        errors.push('Invalid arrival flight number format');
        fieldStatus.arrivalFlightNumber = false;
      }

      // Date validation
      if (travelInfo.arrivalDate && !this.isValidDate(travelInfo.arrivalDate)) {
        errors.push('Invalid arrival date format');
        fieldStatus.arrivalDate = false;
      }

      // Arrival date must be today or in the future
      if (travelInfo.arrivalDate && this.isValidDate(travelInfo.arrivalDate)) {
        const arrivalDate = JapanFormHelper.parseLocalDate(travelInfo.arrivalDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        if (!arrivalDate || arrivalDate < now) {
          errors.push('Arrival date must be in the future');
          fieldStatus.arrivalDate = false;
        }
      }

      // Japan-specific: Accommodation phone validation
      if (travelInfo.accommodationPhone && !this.isValidPhoneNumber(travelInfo.accommodationPhone)) {
        errors.push('Invalid accommodation phone number format');
        fieldStatus.accommodationPhone = false;
      }

      // Length of stay validation (must be positive number)
      if (travelInfo.lengthOfStay) {
        const days = parseInt(travelInfo.lengthOfStay);
        if (isNaN(days) || days <= 0) {
          errors.push('Length of stay must be a positive number');
          fieldStatus.lengthOfStay = false;
        }
      }

      // Travel purpose validation
      const validPurposes = ['Tourism', 'Business', 'Visiting Relatives', 'Transit', 'Other'];
      if (travelInfo.travelPurpose) {
        const normalizedPurpose = JapanFormHelper.normalizeTravelPurpose(travelInfo.travelPurpose);
        if (!validPurposes.includes(normalizedPurpose)) {
          errors.push('Invalid travel purpose');
          fieldStatus.travelPurpose = false;
        } else if (normalizedPurpose !== travelInfo.travelPurpose) {
          // Normalize legacy values in-place so callers receive the updated value
          travelInfo.travelPurpose = normalizedPurpose;
        }
      }
    }

    const filledCount = Object.values(fieldStatus).filter(Boolean).length;
    const totalCount = requiredFields.length;

    return {
      isValid: errors.length === 0,
      isComplete: filledCount === totalCount,
      errors,
      fieldCount: {
        filled: filledCount,
        total: totalCount
      }
    };
  }

  /**
   * Validate fund items for Japan entry
   * @param {Array} fundItems - Array of fund item objects
   * @returns {Object} - Validation result with completion status
   */
  static validateFundItems(fundItems) {
    const errors = [];
    
    if (!fundItems || !Array.isArray(fundItems) || fundItems.length === 0) {
      return {
        isValid: false,
        isComplete: false,
        errors: ['At least one fund item is required'],
        fieldCount: {
          filled: 0,
          total: 1
        }
      };
    }

    let validItemCount = 0;
    
    fundItems.forEach((item, index) => {
      if (!item.type) {
        errors.push(`Fund item ${index + 1}: type is required`);
      } else {
        const validTypes = ['credit_card', 'cash', 'bank_balance', 'investment', 'other'];
        if (!validTypes.includes(item.type)) {
          errors.push(`Fund item ${index + 1}: invalid type`);
        } else {
          validItemCount++;
        }
      }

      // Amount validation (optional but if provided must be valid)
      if (item.amount !== null && item.amount !== undefined) {
        if (typeof item.amount !== 'number' || item.amount <= 0) {
          errors.push(`Fund item ${index + 1}: amount must be a positive number`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      isComplete: validItemCount > 0,
      errors,
      fieldCount: {
        filled: validItemCount,
        total: 1 // At least 1 valid fund item required
      }
    };
  }

  /**
   * Validate complete data set for Japan entry
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Complete validation result
   */
  static async validateComplete(userId) {
    try {
      // Import UserDataService dynamically to avoid circular dependencies
      const UserDataService = require('../data/UserDataService').default;
      
      // Get all data for Japan destination
      const [passport, personalInfo, travelInfo, fundItems] = await Promise.all([
        UserDataService.getPassport(userId),
        UserDataService.getPersonalInfo(userId),
        UserDataService.getTravelInfo(userId, 'japan'), // Japan-specific destination
        UserDataService.getFundItems(userId)
      ]);

      // Validate each category
      const passportValidation = this.validatePassportData(passport);
      const personalInfoValidation = this.validatePersonalInfo(personalInfo);
      const travelInfoValidation = this.validateTravelInfo(travelInfo);
      const fundItemsValidation = this.validateFundItems(fundItems);

      // Combine results
      const allErrors = [
        ...passportValidation.errors,
        ...personalInfoValidation.errors,
        ...travelInfoValidation.errors,
        ...fundItemsValidation.errors
      ];

      const allComplete = passportValidation.isComplete && 
                         personalInfoValidation.isComplete && 
                         travelInfoValidation.isComplete && 
                         fundItemsValidation.isComplete;

      const allValid = passportValidation.isValid && 
                      personalInfoValidation.isValid && 
                      travelInfoValidation.isValid && 
                      fundItemsValidation.isValid;

      return {
        isValid: allValid,
        isComplete: allComplete,
        errors: allErrors,
        categories: {
          passport: passportValidation,
          personalInfo: personalInfoValidation,
          travelInfo: travelInfoValidation,
          fundItems: fundItemsValidation
        }
      };
    } catch (error) {
      console.error('Failed to validate complete Japan data:', error);
      return {
        isValid: false,
        isComplete: false,
        errors: ['Failed to load data for validation'],
        categories: {
          passport: { isValid: false, isComplete: false, errors: ['Failed to load passport data'], fieldCount: { filled: 0, total: 5 } },
          personalInfo: { isValid: false, isComplete: false, errors: ['Failed to load personal info'], fieldCount: { filled: 0, total: 6 } },
          travelInfo: { isValid: false, isComplete: false, errors: ['Failed to load travel info'], fieldCount: { filled: 0, total: 8 } },
          fundItems: { isValid: false, isComplete: false, errors: ['Failed to load fund items'], fieldCount: { filled: 0, total: 1 } }
        }
      };
    }
  }

  // Helper validation methods

  /**
   * Validate passport number format
   * @param {string} passportNumber - Passport number
   * @returns {boolean} - Is valid format
   */
  static isValidPassportNumber(passportNumber) {
    if (!passportNumber) return false;
    const cleaned = passportNumber.replace(/\s/g, '');
    const passportRegex = /^[A-Z0-9]{6,12}$/i;
    return passportRegex.test(cleaned);
  }

  /**
   * Validate date format (YYYY-MM-DD)
   * @param {string} dateStr - Date string
   * @returns {boolean} - Is valid date
   */
  static isValidDate(dateStr) {
    if (!dateStr) return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return false;

    const parsedDate = JapanFormHelper.parseLocalDate(dateStr);
    return parsedDate instanceof Date && !isNaN(parsedDate);
  }

  /**
   * Validate email format
   * @param {string} email - Email address
   * @returns {boolean} - Is valid email
   */
  static isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number
   * @returns {boolean} - Is valid phone
   */
  static isValidPhoneNumber(phone) {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[^\d+\s-()]/g, '');
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,}$/;
    return phoneRegex.test(cleanPhone) && cleanPhone.replace(/\D/g, '').length >= 7;
  }

  /**
   * Validate flight number format
   * @param {string} flightNumber - Flight number
   * @returns {boolean} - Is valid format
   */
  static isValidFlightNumber(flightNumber) {
    if (!flightNumber) return false;
    const cleaned = flightNumber.replace(/\s/g, '');
    const flightRegex = /^[A-Z]{2,3}\d{1,4}$/i;
    return flightRegex.test(cleaned);
  }
}

export default JapanDataValidator;
