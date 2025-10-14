/**
 * 入境通 - Validation Utilities Index
 * Centralized export of validation and sanitization utilities
 */

export { default as DataValidator } from './DataValidator';
export { default as InputSanitizer } from './InputSanitizer';

// Validation utilities
export const ValidationUtils = {
  /**
   * Comprehensive validation and sanitization pipeline
   * @param {Object} inputData - Raw input data
   * @param {string} dataType - Type of data (passport, personalInfo, etc.)
   * @returns {Object} - Validation and sanitization result
   */
  validateAndSanitize: async (inputData, dataType) => {
    const { DataValidator } = await import('./DataValidator');
    const { InputSanitizer } = await import('./InputSanitizer');

    try {
      // Step 1: Sanitize input for security
      const sanitizationResult = InputSanitizer.secureSanitize(inputData, dataType);

      if (!sanitizationResult.isValid) {
        return {
          success: false,
          stage: 'sanitization',
          errors: sanitizationResult.securityIssues,
          data: null
        };
      }

      // Step 2: Validate sanitized data
      const validationResult = DataValidator.validateAndSanitize(
        sanitizationResult.sanitizedData,
        dataType
      );

      // Step 3: Combine results
      return {
        success: validationResult.isValid,
        stage: validationResult.isValid ? 'completed' : 'validation',
        data: validationResult.sanitizedData,
        errors: validationResult.errors,
        warnings: [
          ...sanitizationResult.warnings,
          ...(validationResult.validationDetails?.warnings || [])
        ],
        securityCheck: {
          issues: sanitizationResult.securityIssues,
          patterns: sanitizationResult.securityIssues.flatMap(issue => issue.patterns)
        },
        validationDetails: validationResult.validationDetails
      };
    } catch (error) {
      console.error('Validation pipeline error:', error);
      return {
        success: false,
        stage: 'pipeline_error',
        errors: [{ message: error.message }],
        data: null
      };
    }
  },

  /**
   * Quick validation for form inputs
   * @param {string} value - Input value
   * @param {string} fieldType - Type of field
   * @returns {Object} - Quick validation result
   */
  quickValidate: (value, fieldType) => {
    const { InputSanitizer } = require('./InputSanitizer');

    const result = {
      isValid: true,
      errors: [],
      sanitized: value
    };

    try {
      // Basic sanitization
      let sanitized;
      switch (fieldType) {
        case 'email':
          sanitized = InputSanitizer.sanitizeEmail(value);
          result.isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized);
          if (!result.isValid) result.errors.push('Invalid email format');
          break;
        case 'phone':
          sanitized = InputSanitizer.sanitizePhoneNumber(value);
          result.isValid = sanitized && sanitized.replace(/\D/g, '').length >= 7;
          if (!result.isValid) result.errors.push('Invalid phone number');
          break;
        case 'passport':
          sanitized = InputSanitizer.sanitizePassportNumber(value);
          result.isValid = sanitized && sanitized.length >= 6;
          if (!result.isValid) result.errors.push('Invalid passport number');
          break;
        case 'date':
          sanitized = InputSanitizer.sanitizeDate(value);
          result.isValid = sanitized && sanitized.length === 10;
          if (!result.isValid) result.errors.push('Invalid date format (YYYY-MM-DD)');
          break;
        case 'name':
          sanitized = InputSanitizer.sanitizeName(value);
          result.isValid = sanitized && sanitized.length >= 2;
          if (!result.isValid) result.errors.push('Name must be at least 2 characters');
          break;
        default:
          sanitized = InputSanitizer.sanitizeText(value);
          result.isValid = sanitized && sanitized.length > 0;
      }

      result.sanitized = sanitized;

      // Security check
      const securityCheck = InputSanitizer.checkForSuspiciousPatterns(value);
      if (securityCheck.isSuspicious) {
        result.isValid = false;
        result.errors.push('Input contains suspicious patterns');
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push('Validation error');
    }

    return result;
  },

  /**
   * Validate form data with field-level feedback
   * @param {Object} formData - Form data object
   * @param {Object} fieldConfig - Field configuration
   * @returns {Object} - Field-level validation results
   */
  validateForm: (formData, fieldConfig) => {
    const { InputSanitizer } = require('./InputSanitizer');

    const results = {
      isValid: true,
      fields: {},
      errors: []
    };

    for (const [fieldName, config] of Object.entries(fieldConfig)) {
      const value = formData[fieldName];
      const fieldResult = {
        isValid: true,
        errors: [],
        sanitized: value
      };

      // Required check
      if (config.required && (!value || value.toString().trim().length === 0)) {
        fieldResult.isValid = false;
        fieldResult.errors.push(`${config.label || fieldName} is required`);
      }

      // Type validation
      if (value && config.type) {
        switch (config.type) {
          case 'email':
            fieldResult.sanitized = InputSanitizer.sanitizeEmail(value);
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldResult.sanitized)) {
              fieldResult.isValid = false;
              fieldResult.errors.push('Invalid email format');
            }
            break;
          case 'phone':
            fieldResult.sanitized = InputSanitizer.sanitizePhoneNumber(value);
            if (fieldResult.sanitized.replace(/\D/g, '').length < 7) {
              fieldResult.isValid = false;
              fieldResult.errors.push('Invalid phone number');
            }
            break;
          case 'date':
            fieldResult.sanitized = InputSanitizer.sanitizeDate(value);
            if (!fieldResult.sanitized) {
              fieldResult.isValid = false;
              fieldResult.errors.push('Invalid date format');
            }
            break;
          case 'passport':
            fieldResult.sanitized = InputSanitizer.sanitizePassportNumber(value);
            if (fieldResult.sanitized.length < 6) {
              fieldResult.isValid = false;
              fieldResult.errors.push('Invalid passport number');
            }
            break;
          case 'name':
            fieldResult.sanitized = InputSanitizer.sanitizeName(value);
            if (fieldResult.sanitized.length < 2) {
              fieldResult.isValid = false;
              fieldResult.errors.push('Name too short');
            }
            break;
          default:
            fieldResult.sanitized = InputSanitizer.sanitizeText(value, {
              maxLength: config.maxLength
            });
        }
      }

      // Length validation
      if (config.minLength && fieldResult.sanitized && fieldResult.sanitized.length < config.minLength) {
        fieldResult.isValid = false;
        fieldResult.errors.push(`Minimum ${config.minLength} characters required`);
      }

      if (config.maxLength && fieldResult.sanitized && fieldResult.sanitized.length > config.maxLength) {
        fieldResult.isValid = false;
        fieldResult.errors.push(`Maximum ${config.maxLength} characters allowed`);
      }

      // Pattern validation
      if (config.pattern && fieldResult.sanitized && !config.pattern.test(fieldResult.sanitized)) {
        fieldResult.isValid = false;
        fieldResult.errors.push(config.patternMessage || 'Invalid format');
      }

      // Custom validation
      if (config.customValidator && typeof config.customValidator === 'function') {
        try {
          const customResult = config.customValidator(fieldResult.sanitized, formData);
          if (customResult !== true) {
            fieldResult.isValid = false;
            fieldResult.errors.push(customResult);
          }
        } catch (error) {
          fieldResult.isValid = false;
          fieldResult.errors.push('Validation error');
        }
      }

      // Security check
      if (fieldResult.sanitized) {
        const securityCheck = InputSanitizer.checkForSuspiciousPatterns(fieldResult.sanitized);
        if (securityCheck.isSuspicious) {
          fieldResult.isValid = false;
          fieldResult.errors.push('Input contains suspicious content');
        }
      }

      results.fields[fieldName] = fieldResult;

      if (!fieldResult.isValid) {
        results.isValid = false;
        results.errors.push(...fieldResult.errors);
      }
    }

    return results;
  },

  /**
   * Get validation configuration for common forms
   * @param {string} formType - Type of form
   * @returns {Object} - Form validation configuration
   */
  getFormConfig: (formType) => {
    const configs = {
      passport: {
        passportNumber: {
          type: 'passport',
          required: true,
          label: 'Passport Number',
          minLength: 6,
          maxLength: 12
        },
        fullName: {
          type: 'name',
          required: true,
          label: 'Full Name',
          minLength: 2,
          maxLength: 100
        },
        dateOfBirth: {
          type: 'date',
          required: true,
          label: 'Date of Birth'
        },
        expiryDate: {
          type: 'date',
          required: true,
          label: 'Expiry Date'
        }
      },
      personalInfo: {
        email: {
          type: 'email',
          required: false,
          label: 'Email Address'
        },
        phoneNumber: {
          type: 'phone',
          required: false,
          label: 'Phone Number'
        },
        homeAddress: {
          type: 'text',
          required: false,
          label: 'Home Address',
          maxLength: 500
        }
      },
      entryData: {
        arrivalDate: {
          type: 'date',
          required: true,
          label: 'Arrival Date'
        },
        departureDate: {
          type: 'date',
          required: false,
          label: 'Departure Date'
        },
        flightNumber: {
          type: 'text',
          required: false,
          label: 'Flight Number',
          maxLength: 10,
          pattern: /^[A-Z]{2,3}\d{1,4}$/i,
          patternMessage: 'Flight number format: AA123 or AAA1234'
        }
      }
    };

    return configs[formType] || {};
  },

  /**
   * Sanitize data for display (less aggressive than storage sanitization)
   * @param {Object} data - Data to sanitize for display
   * @returns {Object} - Display-safe data
   */
  sanitizeForDisplay: (data) => {
    const { InputSanitizer } = require('./InputSanitizer');

    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // For display, only remove dangerous HTML but keep formatting
        sanitized[key] = InputSanitizer.sanitizeText(value, {
          allowHtml: false,
          maxLength: 1000
        });
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item =>
          typeof item === 'string'
            ? InputSanitizer.sanitizeText(item, { allowHtml: false, maxLength: 1000 })
            : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = ValidationUtils.sanitizeForDisplay(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  },

  /**
   * Check if data contains sensitive information
   * @param {Object} data - Data to check
   * @returns {Object} - Sensitivity analysis
   */
  analyzeSensitivity: (data) => {
    const sensitiveFields = [
      'passport', 'password', 'ssn', 'social', 'credit', 'card',
      'phone', 'email', 'address', 'birth', 'nationality'
    ];

    const analysis = {
      containsSensitiveData: false,
      sensitiveFields: [],
      riskLevel: 'low',
      recommendations: []
    };

    const checkField = (key, value) => {
      const keyLower = key.toLowerCase();
      const isSensitive = sensitiveFields.some(field => keyLower.includes(field));

      if (isSensitive && value && typeof value === 'string' && value.length > 0) {
        analysis.containsSensitiveData = true;
        analysis.sensitiveFields.push(key);

        // Assess risk level
        if (keyLower.includes('passport') || keyLower.includes('ssn')) {
          analysis.riskLevel = 'high';
        } else if (analysis.riskLevel !== 'high') {
          analysis.riskLevel = 'medium';
        }
      }
    };

    const analyzeObject = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          analyzeObject(value, fullKey);
        } else {
          checkField(fullKey, value);
        }
      }
    };

    if (data && typeof data === 'object') {
      analyzeObject(data);
    }

    // Generate recommendations
    if (analysis.containsSensitiveData) {
      analysis.recommendations.push('Data contains sensitive information');

      if (analysis.riskLevel === 'high') {
        analysis.recommendations.push('Implement field-level encryption');
        analysis.recommendations.push('Use secure storage mechanisms');
      } else if (analysis.riskLevel === 'medium') {
        analysis.recommendations.push('Consider encryption for sensitive fields');
      }

      analysis.recommendations.push('Implement proper access controls');
      analysis.recommendations.push('Regular security audits recommended');
    }

    return analysis;
  }
};

export default {
  DataValidator,
  InputSanitizer,
  ValidationUtils
};