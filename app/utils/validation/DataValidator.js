/**
 * 入境通 - Data Validation Utility
 * Comprehensive validation for all data types with security considerations
 */

class DataValidator {
  constructor() {
    this.validationRules = {
      // Passport validation rules
      passport: {
        passportNumber: {
          required: true,
          minLength: 6,
          maxLength: 12,
          pattern: /^[A-Z0-9]{6,12}$/i,
          message: 'Passport number must be 6-12 alphanumeric characters'
        },
        fullName: {
          required: true,
          minLength: 2,
          maxLength: 100,
          pattern: /^[A-Z\s'-]+$/i,
          message: 'Full name must contain only letters, spaces, hyphens, and apostrophes'
        },
        dateOfBirth: {
          required: true,
          pattern: /^\d{4}-\d{2}-\d{2}$/,
          custom: this.validateDateOfBirth.bind(this),
          message: 'Invalid date of birth format (YYYY-MM-DD) or person too young/old'
        },
        nationality: {
          required: true,
          minLength: 2,
          maxLength: 3,
          pattern: /^[A-Z]{2,3}$/i,
          message: 'Nationality must be 2-3 letter country code'
        },
        expiryDate: {
          required: true,
          pattern: /^\d{4}-\d{2}-\d{2}$/,
          custom: this.validateExpiryDate.bind(this),
          message: 'Invalid expiry date or passport has expired'
        },
        issueDate: {
          required: true,
          pattern: /^\d{4}-\d{2}-\d{2}$/,
          message: 'Invalid issue date format (YYYY-MM-DD)'
        },
        issuePlace: {
          required: false,
          maxLength: 100,
          message: 'Issue place must be less than 100 characters'
        }
      },

      // Personal info validation rules
      personalInfo: {
        phoneNumber: {
          required: false, // Optional but validated if provided
          custom: this.validatePhoneNumber.bind(this),
          message: 'Invalid phone number format'
        },
        email: {
          required: false, // Optional but validated if provided
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Invalid email address format'
        },
        homeAddress: {
          required: false,
          maxLength: 500,
          message: 'Home address must be less than 500 characters'
        },
        occupation: {
          required: false,
          maxLength: 100,
          message: 'Occupation must be less than 100 characters'
        },
        provinceCity: {
          required: false,
          maxLength: 100,
          message: 'Province/City must be less than 100 characters'
        },
        countryRegion: {
          required: false,
          maxLength: 100,
          message: 'Country/Region must be less than 100 characters'
        }
      },

      // Entry data validation rules
      entryData: {
        destination: {
          required: true,
          custom: this.validateDestination.bind(this),
          message: 'Invalid destination'
        },
        purpose: {
          required: false,
          maxLength: 200,
          message: 'Purpose must be less than 200 characters'
        },
        arrivalDate: {
          required: true,
          pattern: /^\d{4}-\d{2}-\d{2}$/,
          custom: this.validateArrivalDate.bind(this),
          message: 'Invalid arrival date or date is in the past'
        },
        departureDate: {
          required: false,
          pattern: /^\d{4}-\d{2}-\d{2}$/,
          custom: this.validateDepartureDate.bind(this),
          message: 'Invalid departure date'
        },
        flightNumber: {
          required: false,
          pattern: /^[A-Z]{2,3}\d{1,4}$/i,
          message: 'Invalid flight number format (e.g., CA123, MU5678)'
        },
        accommodation: {
          required: false,
          maxLength: 500,
          message: 'Accommodation details must be less than 500 characters'
        }
      },

      // Funding proof validation rules
      fundingProof: {
        cashAmount: {
          required: false,
          custom: this.validateCashAmount.bind(this),
          message: 'Invalid cash amount format'
        },
        bankCards: {
          required: false,
          maxLength: 1000,
          message: 'Bank card details must be less than 1000 characters'
        },
        supportingDocs: {
          required: false,
          maxLength: 1000,
          message: 'Supporting documents description must be less than 1000 characters'
        }
      }
    };
  }

  /**
   * Validate complete passport data
   * @param {Object} data - Passport data
   * @returns {Object} - Validation result
   */
  validatePassport(data) {
    return this.validateData(data, this.validationRules.passport);
  }

  /**
   * Validate personal information data
   * @param {Object} data - Personal info data
   * @returns {Object} - Validation result
   */
  validatePersonalInfo(data) {
    return this.validateData(data, this.validationRules.personalInfo);
  }

  /**
   * Validate entry data
   * @param {Object} data - Entry data
   * @returns {Object} - Validation result
   */
  validateEntryData(data) {
    return this.validateData(data, this.validationRules.entryData);
  }

  /**
   * Validate funding proof data
   * @param {Object} data - Funding proof data
   * @returns {Object} - Validation result
   */
  validateFundingProof(data) {
    return this.validateData(data, this.validationRules.fundingProof);
  }

  /**
   * Validate complete entry (all components)
   * @param {Object} entry - Complete entry data
   * @returns {Object} - Validation result
   */
  validateCompleteEntry(entry) {
    const results = {
      isValid: true,
      errors: [],
      components: {}
    };

    // Validate each component
    if (entry.passport) {
      results.components.passport = this.validatePassport(entry.passport);
      if (!results.components.passport.isValid) {
        results.isValid = false;
        results.errors.push(...results.components.passport.errors.map(err => `Passport: ${err}`));
      }
    }

    if (entry.personalInfo) {
      results.components.personalInfo = this.validatePersonalInfo(entry.personalInfo);
      if (!results.components.personalInfo.isValid) {
        results.isValid = false;
        results.errors.push(...results.components.personalInfo.errors.map(err => `Personal Info: ${err}`));
      }
    }

    if (entry.entryData) {
      results.components.entryData = this.validateEntryData(entry.entryData);
      if (!results.components.entryData.isValid) {
        results.isValid = false;
        results.errors.push(...results.components.entryData.errors.map(err => `Entry Data: ${err}`));
      }
    }

    if (entry.fundingProof) {
      results.components.fundingProof = this.validateFundingProof(entry.fundingProof);
      if (!results.components.fundingProof.isValid) {
        results.isValid = false;
        results.errors.push(...results.components.fundingProof.errors.map(err => `Funding Proof: ${err}`));
      }
    }

    return results;
  }

  /**
   * Generic data validation function
   * @param {Object} data - Data to validate
   * @param {Object} rules - Validation rules
   * @returns {Object} - Validation result
   */
  validateData(data, rules) {
    const errors = [];
    const validatedFields = {};

    for (const [fieldName, rule] of Object.entries(rules)) {
      const value = data[fieldName];
      const fieldErrors = this.validateField(value, rule, fieldName);

      if (fieldErrors.length > 0) {
        errors.push(...fieldErrors);
        validatedFields[fieldName] = { isValid: false, errors: fieldErrors };
      } else {
        validatedFields[fieldName] = { isValid: true, value };
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      fields: validatedFields
    };
  }

  /**
   * Validate individual field
   * @param {*} value - Field value
   * @param {Object} rule - Validation rule
   * @param {string} fieldName - Field name
   * @returns {Array} - Validation errors
   */
  validateField(value, rule, fieldName) {
    const errors = [];

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName} is required`);
      return errors; // Don't continue validation if required field is missing
    }

    // Skip further validation if value is empty and field is not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return errors;
    }

    // Type checking
    if (rule.type && typeof value !== rule.type) {
      errors.push(`${fieldName} must be of type ${rule.type}`);
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${fieldName} must be at least ${rule.minLength} characters long`);
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${fieldName} must be no more than ${rule.maxLength} characters long`);
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(rule.message || `${fieldName} format is invalid`);
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${fieldName} must be at least ${rule.min}`);
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${fieldName} must be no more than ${rule.max}`);
      }
    }

    // Custom validation
    if (rule.custom && typeof rule.custom === 'function') {
      try {
        const customResult = rule.custom(value, fieldName);
        if (customResult !== true) {
          errors.push(customResult || rule.message || `${fieldName} validation failed`);
        }
      } catch (error) {
        errors.push(`${fieldName} validation error: ${error.message}`);
      }
    }

    return errors;
  }

  /**
   * Custom validation: Date of birth
   * @param {string} dateStr - Date string
   * @returns {boolean|string} - True if valid, error message if invalid
   */
  validateDateOfBirth(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();

    if (age < 0) {
      return 'Date of birth cannot be in the future';
    }

    if (age > 150) {
      return 'Invalid date of birth - person would be over 150 years old';
    }

    if (age < 16) {
      return 'Person must be at least 16 years old for international travel';
    }

    return true;
  }

  /**
   * Custom validation: Expiry date
   * @param {string} dateStr - Date string
   * @returns {boolean|string} - True if valid, error message if invalid
   */
  validateExpiryDate(dateStr) {
    const expiry = new Date(dateStr);
    const now = new Date();

    if (expiry <= now) {
      return 'Passport has expired';
    }

    // Check if expiry is too far in the future (max 20 years)
    const maxExpiry = new Date(now.getTime() + 20 * 365 * 24 * 60 * 60 * 1000);
    if (expiry > maxExpiry) {
      return 'Passport expiry date is too far in the future';
    }

    return true;
  }

  /**
   * Custom validation: Phone number
   * @param {string} phone - Phone number
   * @returns {boolean|string} - True if valid, error message if invalid
   */
  validatePhoneNumber(phone) {
    if (!phone || phone.trim().length === 0) {
      return true; // Optional field
    }

    // Remove all non-digit characters except + and spaces
    const cleanPhone = phone.replace(/[^\d+\s-()]/g, '');

    // Basic validation: at least 7 digits, may start with +
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return 'Phone number must contain at least 7 digits';
    }

    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 7) {
      return 'Phone number must have at least 7 digits';
    }

    if (digitsOnly.length > 15) {
      return 'Phone number is too long';
    }

    return true;
  }

  /**
   * Custom validation: Destination
   * @param {Object} destination - Destination object
   * @returns {boolean|string} - True if valid, error message if invalid
   */
  validateDestination(destination) {
    if (!destination || typeof destination !== 'object') {
      return 'Destination must be an object';
    }

    if (!destination.id || !destination.name) {
      return 'Destination must have id and name properties';
    }

    if (typeof destination.id !== 'string' || destination.id.trim().length === 0) {
      return 'Destination ID must be a non-empty string';
    }

    if (typeof destination.name !== 'string' || destination.name.trim().length === 0) {
      return 'Destination name must be a non-empty string';
    }

    return true;
  }

  /**
   * Custom validation: Arrival date
   * @param {string} dateStr - Date string
   * @returns {boolean|string} - True if valid, error message if invalid
   */
  validateArrivalDate(dateStr) {
    const arrival = new Date(dateStr);
    const now = new Date();

    // Allow booking up to 1 year in advance
    const maxAdvance = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (arrival > maxAdvance) {
      return 'Arrival date cannot be more than 1 year in the future';
    }

    // Allow past dates for historical entries (up to 1 year ago)
    const maxPast = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    if (arrival < maxPast) {
      return 'Arrival date cannot be more than 1 year in the past';
    }

    return true;
  }

  /**
   * Custom validation: Departure date
   * @param {string} dateStr - Date string
   * @param {string} fieldName - Field name
   * @param {Object} allData - All form data
   * @returns {boolean|string} - True if valid, error message if invalid
   */
  validateDepartureDate(dateStr, fieldName, allData) {
    if (!allData.arrivalDate) {
      return true; // Can't validate without arrival date
    }

    const departure = new Date(dateStr);
    const arrival = new Date(allData.arrivalDate);

    if (departure <= arrival) {
      return 'Departure date must be after arrival date';
    }

    // Check maximum stay duration (6 months)
    const maxStay = new Date(arrival.getTime() + 180 * 24 * 60 * 60 * 1000);
    if (departure > maxStay) {
      return 'Stay duration cannot exceed 6 months';
    }

    return true;
  }

  /**
   * Custom validation: Cash amount
   * @param {string} amount - Cash amount string
   * @returns {boolean|string} - True if valid, error message if invalid
   */
  validateCashAmount(amount) {
    if (!amount || amount.trim().length === 0) {
      return true; // Optional field
    }

    // Allow formats like: "10000 THB", "¥2000", "$500", "10,000 THB equivalent"
    const amountRegex = /^[\d,]+\s*(?:THB|USD|CNY|¥|\$|equivalent).*$/i;
    if (!amountRegex.test(amount)) {
      return 'Cash amount must include currency (e.g., "10000 THB", "¥2000")';
    }

    // Extract numeric value
    const numericMatch = amount.match(/[\d,]+/);
    if (!numericMatch) {
      return 'Cash amount must contain a valid number';
    }

    const numericValue = parseInt(numericMatch[0].replace(/,/g, ''));
    if (isNaN(numericValue) || numericValue <= 0) {
      return 'Cash amount must be a positive number';
    }

    // Reasonable upper limit (100,000 in any currency)
    if (numericValue > 100000) {
      return 'Cash amount seems unreasonably high';
    }

    return true;
  }

  /**
   * Sanitize data for safe storage/display
   * @param {Object} data - Data to sanitize
   * @param {Array} allowedFields - Fields to keep
   * @returns {Object} - Sanitized data
   */
  sanitizeData(data, allowedFields = null) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip if not in allowed fields
      if (allowedFields && !allowedFields.includes(key)) {
        continue;
      }

      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize string value
   * @param {string} str - String to sanitize
   * @returns {string} - Sanitized string
   */
  sanitizeString(str) {
    if (!str) return str;

    return str
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove control characters except newlines and tabs
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Trim whitespace
      .trim();
  }

  /**
   * Validate and sanitize input data
   * @param {Object} data - Input data
   * @param {string} dataType - Type of data (passport, personalInfo, etc.)
   * @returns {Object} - Validation and sanitization result
   */
  validateAndSanitize(data, dataType) {
    // Sanitize first
    const sanitized = this.sanitizeData(data);

    // Then validate
    let validationResult;
    switch (dataType) {
      case 'passport':
        validationResult = this.validatePassport(sanitized);
        break;
      case 'personalInfo':
        validationResult = this.validatePersonalInfo(sanitized);
        break;
      case 'entryData':
        validationResult = this.validateEntryData(sanitized);
        break;
      case 'fundingProof':
        validationResult = this.validateFundingProof(sanitized);
        break;
      case 'completeEntry':
        validationResult = this.validateCompleteEntry(sanitized);
        break;
      default:
        validationResult = { isValid: true, errors: [], fields: {} };
    }

    return {
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      sanitizedData: sanitized,
      validationDetails: validationResult
    };
  }
}

// Create singleton instance
const dataValidator = new DataValidator();

export default dataValidator;