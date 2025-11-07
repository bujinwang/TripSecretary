/**
 * 入境通 - Input Sanitization Utility
 * Security-focused input sanitization and cleaning
 */

class InputSanitizer {
  constructor() {
    // Dangerous patterns to remove
    this.dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, // Iframe tags
      /javascript:/gi, // JavaScript URLs
      /vbscript:/gi, // VBScript URLs
      /data:(?!image\/(?:png|jpg|jpeg|gif|webp|svg\+xml|bmp))[^;]/gi, // Dangerous data URLs
      /on\w+\s*=/gi, // Event handlers
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, // Object tags
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, // Embed tags
      /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, // Form tags
      /<input\b[^<]*(?:(?!<\/input>)<[^<]*)*\/?>/gi, // Input tags
      /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*\/?>/gi, // Meta tags
    ];

    // SQL injection patterns
    this.sqlInjectionPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /(-{2}|\/\*|\*\/)/g, // Comments
      /('|(\\x27)|(\\x2D))/g, // Quotes and dashes
      /(%27|%3B|%22)/gi, // URL encoded quotes
    ];

    // Path traversal patterns
    this.pathTraversalPatterns = [
      /\.\.[\/\\]/g, // Directory traversal
      /[\/\\]\.\./g,
      /%2e%2e[\/\\]/gi, // URL encoded
      /[\/\\]%2e%2e/gi,
    ];
  }

  /**
   * Sanitize text input for general use
   * @param {string} input - Input to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} - Sanitized input
   */
  sanitizeText(input, options = {}) {
    if (!input || typeof input !== 'string') {
      return input;
    }

    let sanitized = input;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove control characters (except newlines, tabs, carriage returns)
    sanitized = sanitized.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

    // Remove dangerous HTML/XSS content
    if (options.allowHtml !== true) {
      sanitized = this.removeDangerousHtml(sanitized);
    }

    // Remove SQL injection attempts
    if (options.checkSqlInjection !== false) {
      sanitized = this.removeSqlInjection(sanitized);
    }

    // Remove path traversal attempts
    if (options.checkPathTraversal !== false) {
      sanitized = this.removePathTraversal(sanitized);
    }

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length if specified
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    return sanitized;
  }

  /**
   * Sanitize email input
   * @param {string} email - Email to sanitize
   * @returns {string} - Sanitized email
   */
  sanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
      return email;
    }

    // Basic email sanitization
    let sanitized = email.toLowerCase().trim();

    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>'"&\\]/g, '');

    // Remove multiple spaces
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
  }

  /**
   * Sanitize phone number input
   * @param {string} phone - Phone number to sanitize
   * @returns {string} - Sanitized phone number
   */
  sanitizePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
      return phone;
    }

    // Remove all non-digit characters except + and spaces
    let sanitized = phone.replace(/[^\d+\s\-\(\)\.]/g, '');

    // Remove multiple spaces
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Limit length
    if (sanitized.length > 20) {
      sanitized = sanitized.substring(0, 20);
    }

    return sanitized.trim();
  }

  /**
   * Sanitize name input (passport names, personal names)
   * @param {string} name - Name to sanitize
   * @returns {string} - Sanitized name
   */
  sanitizeName(name) {
    if (!name || typeof name !== 'string') {
      return name;
    }

    // Allow only letters, spaces, hyphens, apostrophes, and periods
    let sanitized = name.replace(/[^A-Za-z\s\-'.À-ÿ]/g, '');

    // Remove multiple spaces
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Capitalize first letter of each word
    sanitized = sanitized.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

    // Limit length
    if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 100);
    }

    return sanitized.trim();
  }

  /**
   * Sanitize passport number
   * @param {string} passportNumber - Passport number to sanitize
   * @returns {string} - Sanitized passport number
   */
  sanitizePassportNumber(passportNumber) {
    if (!passportNumber || typeof passportNumber !== 'string') {
      return passportNumber;
    }

    // Remove all non-alphanumeric characters
    let sanitized = passportNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // Limit length to reasonable passport number length
    if (sanitized.length > 12) {
      sanitized = sanitized.substring(0, 12);
    }

    return sanitized;
  }

  /**
   * Sanitize address input
   * @param {string} address - Address to sanitize
   * @returns {string} - Sanitized address
   */
  sanitizeAddress(address) {
    if (!address || typeof address !== 'string') {
      return address;
    }

    // Remove dangerous characters but allow common address characters
    let sanitized = address.replace(/[<>'"&\\]/g, '');

    // Remove multiple spaces
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Limit length
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500);
    }

    return sanitized.trim();
  }

  /**
   * Sanitize date input
   * @param {string} dateStr - Date string to sanitize
   * @returns {string} - Sanitized date string
   */
  sanitizeDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
      return dateStr;
    }

    // Remove all non-numeric and non-dash characters
    const sanitized = dateStr.replace(/[^0-9\-]/g, '');

    // Ensure YYYY-MM-DD format
    const parts = sanitized.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      // Validate ranges
      const y = parseInt(year);
      const m = parseInt(month);
      const d = parseInt(day);

      if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    return '';
  }

  /**
   * Sanitize flight number
   * @param {string} flightNumber - Flight number to sanitize
   * @returns {string} - Sanitized flight number
   */
  sanitizeFlightNumber(flightNumber) {
    if (!flightNumber || typeof flightNumber !== 'string') {
      return flightNumber;
    }

    // Remove all non-alphanumeric characters
    let sanitized = flightNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // Limit length
    if (sanitized.length > 7) {
      sanitized = sanitized.substring(0, 7);
    }

    return sanitized;
  }

  /**
   * Sanitize currency amount
   * @param {string} amount - Amount to sanitize
   * @returns {string} - Sanitized amount
   */
  sanitizeCurrencyAmount(amount) {
    if (!amount || typeof amount !== 'string') {
      return amount;
    }

    // Allow numbers, commas, periods, spaces, and currency symbols
    let sanitized = amount.replace(/[^0-9\s\.,¥$€£THBUSD]/g, '');

    // Remove multiple spaces
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Limit length
    if (sanitized.length > 50) {
      sanitized = sanitized.substring(0, 50);
    }

    return sanitized.trim();
  }

  /**
   * Remove dangerous HTML content
   * @param {string} input - Input to clean
   * @returns {string} - Cleaned input
   */
  removeDangerousHtml(input) {
    let cleaned = input;

    // Remove dangerous tags and attributes
    this.dangerousPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    return cleaned;
  }

  /**
   * Remove SQL injection attempts
   * @param {string} input - Input to clean
   * @returns {string} - Cleaned input
   */
  removeSqlInjection(input) {
    let cleaned = input;

    this.sqlInjectionPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    return cleaned;
  }

  /**
   * Remove path traversal attempts
   * @param {string} input - Input to clean
   * @returns {string} - Cleaned input
   */
  removePathTraversal(input) {
    let cleaned = input;

    this.pathTraversalPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    return cleaned;
  }

  /**
   * Sanitize object recursively
   * @param {Object} obj - Object to sanitize
   * @param {Object} fieldSanitizers - Field-specific sanitizers
   * @returns {Object} - Sanitized object
   */
  sanitizeObject(obj, fieldSanitizers = {}) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      if (fieldSanitizers[key]) {
        // Use field-specific sanitizer
        sanitized[key] = fieldSanitizers[key](value);
      } else if (typeof value === 'string') {
        // Use default text sanitization
        sanitized[key] = this.sanitizeText(value);
      } else if (Array.isArray(value)) {
        // Sanitize array elements
        sanitized[key] = value.map(item =>
          typeof item === 'string' ? this.sanitizeText(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeObject(value, fieldSanitizers);
      } else {
        // Keep other types as-is
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Get field-specific sanitizers for different data types
   * @param {string} dataType - Type of data
   * @returns {Object} - Field sanitizers
   */
  getFieldSanitizers(dataType) {
    const sanitizers = {
      passport: {
        passportNumber: this.sanitizePassportNumber.bind(this),
        fullName: this.sanitizeName.bind(this),
        dateOfBirth: this.sanitizeDate.bind(this),
        expiryDate: this.sanitizeDate.bind(this),
        issueDate: this.sanitizeDate.bind(this),
        issuePlace: this.sanitizeAddress.bind(this),
        nationality: (value) => value ? value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3) : value
      },
      personalInfo: {
        phoneNumber: this.sanitizePhoneNumber.bind(this),
        email: this.sanitizeEmail.bind(this),
        homeAddress: this.sanitizeAddress.bind(this),
        occupation: this.sanitizeText.bind(this),
        provinceCity: this.sanitizeAddress.bind(this),
        countryRegion: this.sanitizeAddress.bind(this)
      },
      entryData: {
        destination: (value) => value, // Keep as object
        purpose: this.sanitizeText.bind(this),
        arrivalDate: this.sanitizeDate.bind(this),
        departureDate: this.sanitizeDate.bind(this),
        flightNumber: this.sanitizeFlightNumber.bind(this),
        accommodation: this.sanitizeAddress.bind(this)
      },
      fundingProof: {
        cashAmount: this.sanitizeCurrencyAmount.bind(this),
        bankCards: this.sanitizeText.bind(this),
        supportingDocs: this.sanitizeText.bind(this)
      }
    };

    return sanitizers[dataType] || {};
  }

  /**
   * Comprehensive sanitization for different data types
   * @param {Object} data - Data to sanitize
   * @param {string} dataType - Type of data
   * @returns {Object} - Sanitized data
   */
  sanitizeForStorage(data, dataType) {
    const fieldSanitizers = this.getFieldSanitizers(dataType);
    return this.sanitizeObject(data, fieldSanitizers);
  }

  /**
   * Check if input contains suspicious patterns
   * @param {string} input - Input to check
   * @returns {Object} - Security check result
   */
  checkForSuspiciousPatterns(input) {
    if (!input || typeof input !== 'string') {
      return { isSuspicious: false, patterns: [] };
    }

    const foundPatterns = [];

    // Check for dangerous HTML
    this.dangerousPatterns.forEach(pattern => {
      if (pattern.test(input)) {
        foundPatterns.push('dangerous_html');
      }
    });

    // Check for SQL injection
    this.sqlInjectionPatterns.forEach(pattern => {
      if (pattern.test(input)) {
        foundPatterns.push('sql_injection');
      }
    });

    // Check for path traversal
    this.pathTraversalPatterns.forEach(pattern => {
      if (pattern.test(input)) {
        foundPatterns.push('path_traversal');
      }
    });

    // Check for very long strings (potential DoS)
    if (input.length > 10000) {
      foundPatterns.push('excessive_length');
    }

    // Check for high entropy (potential encoded data)
    const entropy = this.calculateEntropy(input);
    if (entropy > 5.0) {
      foundPatterns.push('high_entropy');
    }

    return {
      isSuspicious: foundPatterns.length > 0,
      patterns: foundPatterns,
      entropy
    };
  }

  /**
   * Calculate Shannon entropy of a string
   * @param {string} str - String to analyze
   * @returns {number} - Entropy value
   */
  calculateEntropy(str) {
    const charCount = {};
    for (const char of str) {
      charCount[char] = (charCount[char] || 0) + 1;
    }

    let entropy = 0;
    const len = str.length;
    for (const count of Object.values(charCount)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Validate and sanitize input with security checks
   * @param {Object} data - Input data
   * @param {string} dataType - Type of data
   * @returns {Object} - Validation and sanitization result
   */
  secureSanitize(data, dataType) {
    const result = {
      isValid: true,
      sanitizedData: null,
      securityIssues: [],
      warnings: []
    };

    try {
      // First pass: security checks
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          const securityCheck = this.checkForSuspiciousPatterns(value);
          if (securityCheck.isSuspicious) {
            result.securityIssues.push({
              field: key,
              patterns: securityCheck.patterns
            });
            result.isValid = false;
          }
        }
      }

      // Second pass: sanitization
      result.sanitizedData = this.sanitizeForStorage(data, dataType);

      // Third pass: validation (basic checks)
      const validationWarnings = this.validateSanitizedData(result.sanitizedData, dataType);
      result.warnings = validationWarnings;

    } catch (error) {
      result.isValid = false;
      result.securityIssues.push({
        field: 'general',
        patterns: ['processing_error'],
        error: error.message
      });
    }

    return result;
  }

  /**
   * Basic validation of sanitized data
   * @param {Object} data - Sanitized data
   * @param {string} dataType - Type of data
   * @returns {Array} - Validation warnings
   */
  validateSanitizedData(data, dataType) {
    const warnings = [];

    // Basic length checks
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        if (value.length === 0 && this.isRequiredField(key, dataType)) {
          warnings.push(`${key} is required but empty after sanitization`);
        }
        if (value.length > 1000) {
          warnings.push(`${key} is very long (${value.length} chars) after sanitization`);
        }
      }
    }

    return warnings;
  }

  /**
   * Check if field is required for data type
   * @param {string} field - Field name
   * @param {string} dataType - Data type
   * @returns {boolean} - Whether field is required
   */
  isRequiredField(field, dataType) {
    const requiredFields = {
      passport: ['passportNumber', 'fullName', 'dateOfBirth', 'nationality', 'expiryDate'],
      personalInfo: [], // No required fields for personal info
      entryData: ['destination', 'arrivalDate'],
      fundingProof: [] // No required fields for funding proof
    };

    return (requiredFields[dataType] || []).includes(field);
  }
}

// Create singleton instance
const inputSanitizer = new InputSanitizer();

export default inputSanitizer;