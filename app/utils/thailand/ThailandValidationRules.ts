// @ts-nocheck

/**
 * Thailand Travel Info Validation Rules
 * Centralized validation logic for Thailand travel information fields
 *
 * This file now uses the ValidationRuleEngine for flexible, reusable validation.
 * The old switch-based implementation has been refactored into declarative rules.
 */

import ValidationRuleEngine from '../validation/ValidationRuleEngine';
import THAILAND_VALIDATION_RULES from '../../config/destinations/thailand/validationRules';

// Create validation engine instance with Thailand-specific rules
const thailandValidator = new ValidationRuleEngine(THAILAND_VALIDATION_RULES);

/**
 * Validate a field based on field-specific rules
 * @param {string} fieldName - Name of the field to validate
 * @param {*} fieldValue - Value to validate
 * @param {Object} context - Additional context (e.g., other field values)
 * @returns {Object} - Validation result {isValid, isWarning, errorMessage}
 */
export const validateField = (fieldName, fieldValue, context = {}) => {
  return thailandValidator.validate(fieldName, fieldValue, context);
};

/**
 * Export the validation engine instance for advanced use cases
 */
export { thailandValidator };

/**
 * Export default
 */
export default {
  validateField,
  thailandValidator
};
