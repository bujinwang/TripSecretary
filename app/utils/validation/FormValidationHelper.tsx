// @ts-nocheck

/**
 * Form Validation Helper
 * Provides comprehensive validation utilities for TDAC forms and user input
 * 
 * Requirements: 5.1-5.5, 24.1-24.5
 */

class FormValidationHelper {
  constructor() {
    this.validationRules = {
      // Personal information validation rules
      personal: {
        familyName: {
          required: true,
          minLength: 1,
          maxLength: 50,
          pattern: /^[A-Za-z\s\-'\.]+$/,
          message: 'Family name must contain only letters, spaces, hyphens, apostrophes, and periods'
        },
        firstName: {
          required: true,
          minLength: 1,
          maxLength: 50,
          pattern: /^[A-Za-z\s\-'\.]+$/,
          message: 'First name must contain only letters, spaces, hyphens, apostrophes, and periods'
        },
        middleName: {
          required: false,
          minLength: 0,
          maxLength: 50,
          pattern: /^[A-Za-z\s\-'\.]*$/,
          message: 'Middle name must contain only letters, spaces, hyphens, apostrophes, and periods'
        },
        passportNo: {
          required: true,
          minLength: 6,
          maxLength: 12,
          pattern: /^[A-Za-z0-9]+$/,
          message: 'Passport number must be 6-12 alphanumeric characters'
        },
        nationality: {
          required: true,
          minLength: 2,
          maxLength: 3,
          pattern: /^[A-Z]{2,3}$/,
          message: 'Nationality must be a valid 2-3 letter country code'
        },
        gender: {
          required: true,
          enum: ['MALE', 'FEMALE', 'UNDEFINED'],
          message: 'Gender must be MALE, FEMALE, or UNDEFINED'
        },
        occupation: {
          required: true,
          minLength: 2,
          maxLength: 100,
          pattern: /^[A-Za-z\s\-'\.]+$/,
          message: 'Occupation must contain only letters, spaces, hyphens, apostrophes, and periods'
        }
      },

      // Contact information validation rules
      contact: {
        phoneCode: {
          required: true,
          pattern: /^\d{1,4}$/,
          message: 'Phone code must be 1-4 digits'
        },
        phoneNo: {
          required: true,
          minLength: 7,
          maxLength: 15,
          pattern: /^\d+$/,
          message: 'Phone number must be 7-15 digits'
        },
        email: {
          required: false,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Email must be a valid email address'
        }
      },

      // Travel information validation rules
      travel: {
        arrivalDate: {
          required: true,
          pattern: /^\d{4}[-\/]\d{2}[-\/]\d{2}$/,
          message: 'Arrival date must be in YYYY-MM-DD or YYYY/MM/DD format',
          customValidation: (value) => {
            const date = new Date(value);
            const now = new Date();
            const maxFuture = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));
            
            if (date < now) {
              return 'Arrival date cannot be in the past';
            }
            if (date > maxFuture) {
              return 'Arrival date cannot be more than 90 days in the future';
            }
            
            // TDAC submission window check (within 72 hours)
            const hoursDiff = (date - now) / (1000 * 60 * 60);
            if (hoursDiff > 72) {
              return 'TDAC can only be submitted within 72 hours before arrival';
            }
            
            return null;
          }
        },
        departureDate: {
          required: false,
          pattern: /^\d{4}[-\/]\d{2}[-\/]\d{2}$/,
          message: 'Departure date must be in YYYY-MM-DD or YYYY/MM/DD format',
          customValidation: (value, formData) => {
            if (!value) {
return null;
}
            
            const departureDate = new Date(value);
            const arrivalDate = new Date(formData.arrivalDate);
            
            if (departureDate <= arrivalDate) {
              return 'Departure date must be after arrival date';
            }
            
            return null;
          }
        },
        flightNo: {
          required: true,
          minLength: 2,
          maxLength: 10,
          pattern: /^[A-Z0-9]+$/,
          message: 'Flight number must be 2-10 alphanumeric characters'
        },
        purpose: {
          required: true,
          enum: ['HOLIDAY', 'BUSINESS', 'MEETING', 'SPORTS', 'INCENTIVE', 'MEDICAL', 'EDUCATION', 'CONVENTION', 'EMPLOYMENT', 'EXHIBITION', 'OTHERS'],
          message: 'Purpose must be a valid travel purpose'
        }
      },

      // Accommodation validation rules
      accommodation: {
        accommodationType: {
          required: true,
          enum: ['HOTEL', 'YOUTH_HOSTEL', 'GUEST_HOUSE', 'FRIEND_HOUSE', 'APARTMENT', 'OTHERS'],
          message: 'Accommodation type must be a valid type'
        },
        address: {
          required: true,
          minLength: 10,
          maxLength: 200,
          message: 'Address must be 10-200 characters long'
        },
        province: {
          required: true,
          minLength: 2,
          maxLength: 50,
          message: 'Province is required'
        },
        district: {
          required: false,
          minLength: 0,
          maxLength: 50,
          message: 'District must be less than 50 characters'
        },
        subDistrict: {
          required: false,
          minLength: 0,
          maxLength: 50,
          message: 'Sub-district must be less than 50 characters'
        },
        postCode: {
          required: false,
          pattern: /^\d{5}$/,
          message: 'Post code must be 5 digits'
        }
      },

      // Birth date validation rules
      birthDate: {
        day: {
          required: true,
          pattern: /^(0?[1-9]|[12][0-9]|3[01])$/,
          message: 'Day must be 1-31'
        },
        month: {
          required: true,
          pattern: /^(0?[1-9]|1[0-2])$/,
          message: 'Month must be 1-12'
        },
        year: {
          required: true,
          pattern: /^\d{4}$/,
          message: 'Year must be 4 digits',
          customValidation: (value) => {
            const year = parseInt(value);
            const currentYear = new Date().getFullYear();
            const minYear = currentYear - 120;
            const maxYear = currentYear - 16;
            
            if (year < minYear || year > maxYear) {
              return `Year must be between ${minYear} and ${maxYear}`;
            }
            
            return null;
          }
        }
      }
    };
  }

  /**
   * Validate a single field
   * @param {string} category - Field category (personal, contact, travel, etc.)
   * @param {string} fieldName - Field name
   * @param {*} value - Field value
   * @param {Object} formData - Complete form data for cross-field validation
   * @returns {Object} - Validation result
   */
  validateField(category, fieldName, value, formData = {}) {
    try {
      const rules = this.validationRules[category]?.[fieldName];
      
      if (!rules) {
        return { isValid: true, errors: [], warnings: [] };
      }

      const errors = [];
      const warnings = [];

      // Check required field
      if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors.push(`${fieldName} is required`);
        return { isValid: false, errors, warnings };
      }

      // Skip other validations if field is empty and not required
      if (!value || (typeof value === 'string' && !value.trim())) {
        return { isValid: true, errors, warnings };
      }

      const stringValue = value.toString().trim();

      // Check length constraints
      if (rules.minLength !== undefined && stringValue.length < rules.minLength) {
        errors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
      }

      if (rules.maxLength !== undefined && stringValue.length > rules.maxLength) {
        errors.push(`${fieldName} must be no more than ${rules.maxLength} characters long`);
      }

      // Check pattern
      if (rules.pattern && !rules.pattern.test(stringValue)) {
        errors.push(rules.message || `${fieldName} format is invalid`);
      }

      // Check enum values
      if (rules.enum && !rules.enum.includes(stringValue.toUpperCase())) {
        errors.push(`${fieldName} must be one of: ${rules.enum.join(', ')}`);
      }

      // Custom validation
      if (rules.customValidation && typeof rules.customValidation === 'function') {
        const customError = rules.customValidation(stringValue, formData);
        if (customError) {
          if (customError.includes('warning:')) {
            warnings.push(customError.replace('warning:', '').trim());
          } else {
            errors.push(customError);
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Field validation error:', error);
      return {
        isValid: false,
        errors: [`Validation error for ${fieldName}: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate complete form data
   * @param {Object} formData - Complete form data
   * @returns {Object} - Comprehensive validation result
   */
  validateForm(formData) {
    try {
      const result = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {},
        fieldWarnings: {},
        summary: {
          totalFields: 0,
          validFields: 0,
          fieldsWithErrors: 0,
          fieldsWithWarnings: 0
        }
      };

      // Validate each category
      for (const [category, fields] of Object.entries(this.validationRules)) {
        if (category === 'birthDate') {
          // Special handling for birth date
          const birthDateResult = this.validateBirthDate(formData.birthDate || {});
          if (!birthDateResult.isValid) {
            result.errors.push(...birthDateResult.errors);
            result.fieldErrors.birthDate = birthDateResult.errors;
          }
          if (birthDateResult.warnings.length > 0) {
            result.warnings.push(...birthDateResult.warnings);
            result.fieldWarnings.birthDate = birthDateResult.warnings;
          }
          result.summary.totalFields += 3; // day, month, year
          result.summary.validFields += birthDateResult.isValid ? 3 : 0;
          result.summary.fieldsWithErrors += birthDateResult.isValid ? 0 : 1;
          continue;
        }

        const categoryData = formData[category] || formData;

        for (const [fieldName, rules] of Object.entries(fields)) {
          const fieldValue = categoryData[fieldName];
          const fieldResult = this.validateField(category, fieldName, fieldValue, formData);

          result.summary.totalFields++;

          if (fieldResult.isValid) {
            result.summary.validFields++;
          } else {
            result.summary.fieldsWithErrors++;
            result.errors.push(...fieldResult.errors);
            result.fieldErrors[fieldName] = fieldResult.errors;
          }

          if (fieldResult.warnings.length > 0) {
            result.summary.fieldsWithWarnings++;
            result.warnings.push(...fieldResult.warnings);
            result.fieldWarnings[fieldName] = fieldResult.warnings;
          }
        }
      }

      // Cross-field validations
      const crossFieldResult = this.validateCrossFields(formData);
      if (!crossFieldResult.isValid) {
        result.errors.push(...crossFieldResult.errors);
      }
      result.warnings.push(...crossFieldResult.warnings);

      result.isValid = result.errors.length === 0;

      return result;

    } catch (error) {
      console.error('Form validation error:', error);
      return {
        isValid: false,
        errors: [`Form validation failed: ${error.message}`],
        warnings: [],
        fieldErrors: {},
        fieldWarnings: {},
        summary: {
          totalFields: 0,
          validFields: 0,
          fieldsWithErrors: 1,
          fieldsWithWarnings: 0
        }
      };
    }
  }

  /**
   * Validate birth date components
   */
  validateBirthDate(birthDate) {
    const result = { isValid: true, errors: [], warnings: [] };

    if (!birthDate || typeof birthDate !== 'object') {
      result.isValid = false;
      result.errors.push('Birth date is required');
      return result;
    }

    // Validate individual components
    const dayResult = this.validateField('birthDate', 'day', birthDate.day);
    const monthResult = this.validateField('birthDate', 'month', birthDate.month);
    const yearResult = this.validateField('birthDate', 'year', birthDate.year);

    result.errors.push(...dayResult.errors, ...monthResult.errors, ...yearResult.errors);
    result.warnings.push(...dayResult.warnings, ...monthResult.warnings, ...yearResult.warnings);

    // Validate date combination
    if (dayResult.isValid && monthResult.isValid && yearResult.isValid) {
      const day = parseInt(birthDate.day);
      const month = parseInt(birthDate.month);
      const year = parseInt(birthDate.year);

      const date = new Date(year, month - 1, day);
      
      if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        result.errors.push('Invalid date combination');
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate cross-field relationships
   */
  validateCrossFields(formData) {
    const result = { isValid: true, errors: [], warnings: [] };

    try {
      // Validate arrival vs departure dates
      if (formData.arrivalDate && formData.departureDate) {
        const arrivalDate = new Date(formData.arrivalDate);
        const departureDate = new Date(formData.departureDate);

        if (departureDate <= arrivalDate) {
          result.errors.push('Departure date must be after arrival date');
        }

        const stayDuration = (departureDate - arrivalDate) / (1000 * 60 * 60 * 24);
        if (stayDuration > 90) {
          result.warnings.push('Stay duration exceeds 90 days - may require special visa');
        }
      }

      // Validate phone number format with country code
      if (formData.phoneCode && formData.phoneNo) {
        const fullPhone = `+${formData.phoneCode}${formData.phoneNo}`;
        if (fullPhone.length > 20) {
          result.warnings.push('Phone number appears unusually long');
        }
      }

      // Validate accommodation consistency
      if (formData.accommodationType === 'HOTEL' && formData.address) {
        if (!formData.address.toLowerCase().includes('hotel') && 
            !formData.address.toLowerCase().includes('resort')) {
          result.warnings.push('Address may not match selected accommodation type (Hotel)');
        }
      }

      result.isValid = result.errors.length === 0;
      return result;

    } catch (error) {
      console.error('Cross-field validation error:', error);
      result.errors.push(`Cross-field validation failed: ${error.message}`);
      result.isValid = false;
      return result;
    }
  }

  /**
   * Get user-friendly error message for field
   */
  getFieldErrorMessage(category, fieldName, errors) {
    if (!errors || errors.length === 0) {
      return '';
    }

    const rules = this.validationRules[category]?.[fieldName];
    const customMessage = rules?.message;

    // Use custom message if available and relevant
    if (customMessage && errors.some(error => error.includes('format') || error.includes('pattern'))) {
      return customMessage;
    }

    return errors.join('; ');
  }

  /**
   * Get validation summary for display
   */
  getValidationSummary(validationResult) {
    const { summary, errors, warnings } = validationResult;
    
    return {
      completionPercentage: summary.totalFields > 0 
        ? Math.round((summary.validFields / summary.totalFields) * 100) 
        : 0,
      status: validationResult.isValid ? 'valid' : 'invalid',
      message: this.getOverallMessage(validationResult),
      criticalErrors: errors.filter(error => error.includes('required')),
      formatErrors: errors.filter(error => !error.includes('required')),
      businessWarnings: warnings.filter(warning => 
        warning.includes('date') || warning.includes('duration') || warning.includes('visa')
      ),
      fieldCount: {
        total: summary.totalFields,
        valid: summary.validFields,
        withErrors: summary.fieldsWithErrors,
        withWarnings: summary.fieldsWithWarnings
      }
    };
  }

  /**
   * Get overall validation message
   */
  getOverallMessage(validationResult) {
    const { summary, errors, warnings } = validationResult;

    if (validationResult.isValid) {
      if (warnings.length > 0) {
        return `Form is valid with ${warnings.length} warning(s)`;
      }
      return 'All fields are valid';
    } else {
      const criticalErrors = errors.filter(error => error.includes('required')).length;
      const formatErrors = errors.length - criticalErrors;
      
      if (criticalErrors > 0 && formatErrors > 0) {
        return `${criticalErrors} required field(s) missing, ${formatErrors} format error(s)`;
      } else if (criticalErrors > 0) {
        return `${criticalErrors} required field(s) missing`;
      } else {
        return `${formatErrors} format error(s) found`;
      }
    }
  }
}

export default new FormValidationHelper();