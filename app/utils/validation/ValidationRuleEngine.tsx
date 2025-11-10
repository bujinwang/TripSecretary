// @ts-nocheck

/**
 * Validation Rule Engine
 *
 * Flexible validation system that supports:
 * - Default validation rules for common field types
 * - Country-specific rule overrides
 * - Rule composition and inheritance
 * - Context-aware validation (e.g., conditional requirements)
 *
 * @module utils/validation/ValidationRuleEngine
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the field value is valid
 * @property {boolean} isWarning - Whether to show as warning (soft validation)
 * @property {string} errorMessage - Error/warning message to display
 */

/**
 * @typedef {Function} ValidationRule
 * @param {*} value - Field value to validate
 * @param {Object} context - Additional context (other field values, config, etc.)
 * @returns {ValidationResult} Validation result
 */

/**
 * Common regex patterns for validation
 */
export const PATTERNS = {
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  ALPHA: /^[A-Za-z]+$/,
  ALPHA_SPACE: /^[A-Za-z\s]+$/,
  ALPHA_SPACE_DASH: /^[A-Za-z\s\-.]+$/,
  ALPHA_SPACE_COMMA: /^[A-Za-z\s,.-]+$/,
  ALPHANUMERIC: /^[A-Za-z0-9]+$/,
  NUMERIC: /^\d+$/,
  PHONE: /^[\+]?[\d\s\-()]{7,}$/,
  COUNTRY_CODE: /^\+\d{1,4}$/,
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
  FLIGHT_NUMBER: /^[A-Z]{2,3}\d{1,4}[A-Z]?$/i,
  PASSPORT: /^[A-Z0-9]{6,12}$/i,
  POSTAL_CODE_5DIGIT: /^\d{5}$/,
  CHINESE_CHARS: /[\u4e00-\u9fff]/,
  COUNTRY_CODE_3LETTER: /^[A-Z]{3}$/i
};

/**
 * Default validation rules for common field types
 * These provide baseline validation that can be overridden by country-specific rules
 */
export const DEFAULT_RULES = {
  /**
   * Email validation
   */
  email: (value, context) => {
    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: context.required !== false,
        errorMessage: context.required !== false ? 'Email address is required' : ''
      };
    }

    if (!PATTERNS.EMAIL.test(value.trim())) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Please enter a valid email address'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  /**
   * Phone number validation
   */
  phoneNumber: (value, context) => {
    const { minLength = 7, maxLength = 15, required = true } = context;

    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: required,
        errorMessage: required ? 'Phone number is required' : ''
      };
    }

    const cleanPhone = value.replace(/[^\d+]/g, '');

    if (cleanPhone.length < minLength) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: `Phone number must be at least ${minLength} digits`
      };
    }

    if (cleanPhone.length > maxLength) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: `Phone number must be no more than ${maxLength} digits`
      };
    }

    if (!PATTERNS.PHONE.test(value)) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Phone number contains invalid characters'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  /**
   * Phone country code validation
   */
  phoneCode: (value, context) => {
    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: context.required !== false,
        errorMessage: context.required !== false ? 'Country code is required' : ''
      };
    }

    if (!PATTERNS.COUNTRY_CODE.test(value.trim())) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Country code must start with + followed by 1-4 digits'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  /**
   * Date validation (ISO format)
   */
  date: (value, context) => {
    const { required = true, minDate, maxDate, beforeToday, afterToday } = context;

    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: required,
        errorMessage: required ? (context.fieldLabel || 'Date') + ' is required' : ''
      };
    }

    if (!PATTERNS.DATE_ISO.test(value)) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Date must be in YYYY-MM-DD format'
      };
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Please enter a valid date'
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (beforeToday && date >= today) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: context.beforeTodayMessage || 'Date must be in the past'
      };
    }

    if (afterToday && date <= today) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: context.afterTodayMessage || 'Date must be in the future'
      };
    }

    if (minDate) {
      const min = new Date(minDate);
      if (date < min) {
        return {
          isValid: false,
          isWarning: false,
          errorMessage: context.minDateMessage || `Date must be after ${minDate}`
        };
      }
    }

    if (maxDate) {
      const max = new Date(maxDate);
      if (date > max) {
        return {
          isValid: false,
          isWarning: false,
          errorMessage: context.maxDateMessage || `Date must be before ${maxDate}`
        };
      }
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  /**
   * Text validation (name, occupation, etc.)
   */
  text: (value, context) => {
    const {
      required = true,
      minLength = 2,
      maxLength = 100,
      pattern = PATTERNS.ALPHA_SPACE_DASH,
      patternMessage = 'Please use English letters only',
      allowChinese = false
    } = context;

    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: required,
        errorMessage: required ? (context.fieldLabel || 'This field') + ' is required' : ''
      };
    }

    const trimmed = value.trim();

    if (!allowChinese && PATTERNS.CHINESE_CHARS.test(trimmed)) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Please use English letters only (no Chinese characters)'
      };
    }

    if (!pattern.test(trimmed)) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: patternMessage
      };
    }

    if (trimmed.length < minLength) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: `Must be at least ${minLength} characters long`
      };
    }

    if (trimmed.length > maxLength) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: `Must be no more than ${maxLength} characters long`
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  /**
   * Alphanumeric validation (passport, visa, etc.)
   */
  alphanumeric: (value, context) => {
    const {
      required = true,
      minLength = 6,
      maxLength = 12,
      pattern = PATTERNS.ALPHANUMERIC
    } = context;

    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: required,
        errorMessage: required ? (context.fieldLabel || 'This field') + ' is required' : ''
      };
    }

    const cleaned = value.replace(/\s/g, '');

    if (!pattern.test(cleaned)) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: context.patternMessage || `Must contain only letters and numbers`
      };
    }

    if (cleaned.length < minLength || cleaned.length > maxLength) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: `Must be ${minLength}-${maxLength} characters`
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  /**
   * Country code validation (3-letter ISO code)
   */
  countryCode: (value, context) => {
    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: context.required !== false,
        errorMessage: context.required !== false ? 'Country is required' : ''
      };
    }

    if (!PATTERNS.COUNTRY_CODE_3LETTER.test(value.trim())) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Please select a valid country or territory'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  /**
   * Flight number validation
   */
  flightNumber: (value, context) => {
    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: context.required !== false,
        errorMessage: context.required !== false ? 'Flight number is required' : ''
      };
    }

    if (!PATTERNS.FLIGHT_NUMBER.test(value.trim())) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Flight number format: 2-3 letters + 1-4 digits (e.g., TG123)'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  }
};

/**
 * Validation Rule Engine Class
 */
export class ValidationRuleEngine {
  constructor(countryRules = {}) {
    this.countryRules = countryRules;
    this.defaultRules = DEFAULT_RULES;
  }

  /**
   * Validate a field using appropriate rule
   * @param {string} fieldName - Name of the field
   * @param {*} value - Value to validate
   * @param {Object} context - Additional context
   * @returns {ValidationResult} Validation result
   */
  validate(fieldName, value, context = {}) {
    // Check if there's a country-specific rule
    const countryRule = this.countryRules[fieldName];

    if (countryRule) {
      // Country-specific rule exists - use it
      if (typeof countryRule === 'function') {
        return countryRule(value, context);
      }

      // If it's a configuration object, use it to configure default rule
      const { ruleType, ...ruleConfig } = countryRule;
      const defaultRule = this.defaultRules[ruleType];

      if (defaultRule) {
        return defaultRule(value, { ...context, ...ruleConfig });
      }
    }

    // No country rule - check if field name matches a default rule type
    const defaultRule = this.defaultRules[fieldName];
    if (defaultRule) {
      return defaultRule(value, context);
    }

    // Generic fallback for unknown fields
    return this._genericValidation(value, context);
  }

  /**
   * Generic fallback validation
   * @private
   */
  _genericValidation(value, context) {
    const { required = false } = context;

    if (!value || (typeof value === 'string' && !value.trim())) {
      return {
        isValid: true,
        isWarning: required,
        errorMessage: required ? 'This field is required' : ''
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  }

  /**
   * Add or override a country-specific rule
   * @param {string} fieldName - Field name
   * @param {ValidationRule|Object} rule - Validation rule or configuration
   */
  addRule(fieldName, rule) {
    this.countryRules[fieldName] = rule;
  }

  /**
   * Get all available field rules
   * @returns {Array<string>} List of field names with rules
   */
  getAvailableFields() {
    return [
      ...Object.keys(this.defaultRules),
      ...Object.keys(this.countryRules)
    ];
  }
}

/**
 * Default export
 */
export default ValidationRuleEngine;
