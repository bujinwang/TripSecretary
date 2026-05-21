/**
 * @fileoverview SoftValidation - Progressive Entry Flow Validation Utility
 * 
 * Implements soft validation strategy that distinguishes between format errors
 * (blocking) and missing field warnings (non-blocking) for progressive entry flow.
 * 
 * Requirements: 5.1-5.5
 * 
 * @module app/utils/SoftValidation
 */

import { EntryFieldsConfig, validateFieldValue } from '../config/entryFieldsConfig';

/**
 * Validation result types
 */
export const ValidationTypes = {
  ERROR: 'error',     // Format error - blocks submission
  WARNING: 'warning', // Missing field - shows warning but allows navigation
  SUCCESS: 'success'  // Valid field
};

/**
 * Validation severity levels
 */
export const ValidationSeverity = {
  CRITICAL: 'critical', // Must be fixed before submission
  HIGH: 'high',        // Should be fixed but not blocking
  MEDIUM: 'medium',    // Recommended to fix
  LOW: 'low'          // Optional improvement
};

/**
 * @class SoftValidation
 * @classdesc Provides soft validation for progressive entry flow
 * 
 * Distinguishes between:
 * - Errors: Format/validation errors that prevent submission
 * - Warnings: Missing required fields that show warnings but allow navigation
 */
class SoftValidation {
  /**
   * Validate a single field value
   * @param {string} fieldName - Field name (e.g., 'passportNumber', 'email')
   * @param {*} value - Field value to validate
   * @param {Object} rules - Validation rules (optional, uses config if not provided)
   * @param {Object} allData - All form data for cross-field validation
   * @returns {Object} Validation result
   */
  static validateField(fieldName, value, rules = null, allData = {}) {
    try {
      // Find field configuration across all categories
      const fieldConfig = SoftValidation._findFieldConfig(fieldName);
      
      if (!fieldConfig) {
        return {
          type: ValidationTypes.ERROR,
          severity: ValidationSeverity.CRITICAL,
          isValid: false,
          message: `Unknown field: ${fieldName}`,
          fieldName,
          category: null
        };
      }

      // Use provided rules or field configuration validator
      const validator = rules?.validator || fieldConfig.validator;
      
      if (!validator) {
        return {
          type: ValidationTypes.SUCCESS,
          severity: ValidationSeverity.LOW,
          isValid: true,
          message: null,
          fieldName,
          category: fieldConfig.category
        };
      }

      // Handle empty/null values
      if (SoftValidation._isEmpty(value)) {
        if (fieldConfig.type === 'required') {
          return {
            type: ValidationTypes.WARNING,
            severity: ValidationSeverity.HIGH,
            isValid: false,
            message: `${fieldConfig.label} is required`,
            fieldName,
            category: fieldConfig.category,
            helpText: fieldConfig.helpText
          };
        } else {
          return {
            type: ValidationTypes.SUCCESS,
            severity: ValidationSeverity.LOW,
            isValid: true,
            message: null,
            fieldName,
            category: fieldConfig.category
          };
        }
      }

      // Validate format using field validator
      let validationResult;
      try {
        validationResult = validator(value, allData);
      } catch (error) {
        console.error(`Validation error for field ${fieldName}:`, error);
        validationResult = {
          isValid: false,
          message: 'Validation failed'
        };
      }
      
      return {
        type: validationResult.isValid ? ValidationTypes.SUCCESS : ValidationTypes.ERROR,
        severity: validationResult.isValid ? ValidationSeverity.LOW : ValidationSeverity.CRITICAL,
        isValid: validationResult.isValid,
        message: validationResult.message,
        fieldName,
        category: fieldConfig.category,
        helpText: fieldConfig.helpText
      };

    } catch (error) {
      console.error('SoftValidation.validateField error:', error);
      return {
        type: ValidationTypes.ERROR,
        severity: ValidationSeverity.CRITICAL,
        isValid: false,
        message: 'Validation error occurred',
        fieldName,
        category: null,
        error: error.message
      };
    }
  }

  /**
   * Collect all validation warnings and errors for entry info
   * @param {Object} entryInfo - Complete entry information object
   * @returns {Object} Validation summary with warnings and errors
   */
  static collectWarnings(entryInfo) {
    try {
      const warnings = [];
      const errors = [];
      const categoryResults = {};

      // Validate each category
      Object.keys(EntryFieldsConfig).forEach(categoryName => {
        const categoryConfig = EntryFieldsConfig[categoryName];
        const categoryData = entryInfo[categoryName] || {};
        
        const categoryResult = SoftValidation._validateCategory(
          categoryName, 
          categoryConfig, 
          categoryData, 
          entryInfo
        );

        categoryResults[categoryName] = categoryResult;
        warnings.push(...categoryResult.warnings);
        errors.push(...categoryResult.errors);
      });

      // Calculate overall completion
      const totalFields = Object.values(EntryFieldsConfig)
        .reduce((sum, config) => sum + config.requiredFieldCount, 0);
      
      const completedFields = Object.values(categoryResults)
        .reduce((sum, result) => sum + result.completedCount, 0);

      const completionPercent = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

      return {
        isValid: errors.length === 0,
        canSubmit: errors.length === 0 && warnings.length === 0,
        canNavigate: true, // Always allow navigation in soft validation
        warnings,
        errors,
        categoryResults,
        summary: {
          totalFields,
          completedFields,
          completionPercent,
          warningCount: warnings.length,
          errorCount: errors.length
        }
      };

    } catch (error) {
      console.error('SoftValidation.collectWarnings error:', error);
      return {
        isValid: false,
        canSubmit: false,
        canNavigate: true,
        warnings: [],
        errors: [{
          type: ValidationTypes.ERROR,
          severity: ValidationSeverity.CRITICAL,
          message: 'Validation system error',
          fieldName: 'system',
          category: 'system'
        }],
        categoryResults: {},
        summary: {
          totalFields: 0,
          completedFields: 0,
          completionPercent: 0,
          warningCount: 0,
          errorCount: 1
        }
      };
    }
  }

  /**
   * Validate a specific category of data
   * @param {string} categoryName - Category name (passport, personalInfo, funds, travel)
   * @param {Object} categoryConfig - Category configuration
   * @param {Object} categoryData - Category data to validate
   * @param {Object} allData - All entry info data for cross-validation
   * @returns {Object} Category validation result
   * @private
   */
  static _validateCategory(categoryName, categoryConfig, categoryData, allData) {
    const warnings = [];
    const errors = [];
    let completedCount = 0;

    // Handle array-type categories (like funds)
    if (categoryConfig.isArray) {
      const arrayData = categoryData[categoryConfig.fields[0].name] || [];
      
      // Use the array field's validator directly
      const arrayResult = categoryConfig.fields[0].validator(arrayData);
      
      if (!arrayResult.isValid) {
        if (arrayData.length === 0) {
          // Empty array is a warning (missing data)
          warnings.push({
            type: ValidationTypes.WARNING,
            severity: ValidationSeverity.HIGH,
            isValid: false,
            message: arrayResult.message,
            fieldName: categoryConfig.fields[0].name,
            category: categoryName,
            helpText: categoryConfig.fields[0].helpText
          });
        } else {
          // Invalid data format is an error
          errors.push({
            type: ValidationTypes.ERROR,
            severity: ValidationSeverity.CRITICAL,
            isValid: false,
            message: arrayResult.message,
            fieldName: categoryConfig.fields[0].name,
            category: categoryName,
            helpText: categoryConfig.fields[0].helpText
          });
        }
      } else {
        // Valid array data
        completedCount = 1;
      }
    } else {
      // Handle regular field categories
      categoryConfig.fields.forEach(fieldConfig => {
        const fieldValue = categoryData[fieldConfig.name];
        const fieldResult = SoftValidation.validateField(
          fieldConfig.name, 
          fieldValue, 
          { validator: fieldConfig.validator }, 
          allData
        );

        if (fieldResult.type === ValidationTypes.ERROR) {
          errors.push(fieldResult);
        } else if (fieldResult.type === ValidationTypes.WARNING) {
          warnings.push(fieldResult);
        } else if (fieldResult.type === ValidationTypes.SUCCESS) {
          completedCount++;
        }
      });
    }

    return {
      category: categoryName,
      warnings,
      errors,
      completedCount,
      totalCount: categoryConfig.requiredFieldCount,
      completionPercent: Math.round((completedCount / categoryConfig.requiredFieldCount) * 100),
      isComplete: completedCount === categoryConfig.requiredFieldCount,
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0
    };
  }

  /**
   * Find field configuration across all categories
   * @param {string} fieldName - Field name to find
   * @returns {Object|null} Field configuration with category info
   * @private
   */
  static _findFieldConfig(fieldName) {
    for (const [categoryName, categoryConfig] of Object.entries(EntryFieldsConfig)) {
      // Handle array-type categories
      if (categoryConfig.isArray) {
        const arrayField = categoryConfig.fields[0];
        if (arrayField.name === fieldName) {
          return {
            ...arrayField,
            category: categoryName
          };
        }
        
        // Check item fields within array
        if (arrayField.itemFields) {
          const itemField = arrayField.itemFields.find(field => field.name === fieldName);
          if (itemField) {
            return {
              ...itemField,
              category: categoryName,
              parentField: arrayField.name
            };
          }
        }
      } else {
        // Handle regular fields
        const field = categoryConfig.fields.find(field => field.name === fieldName);
        if (field) {
          return {
            ...field,
            category: categoryName
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Check if a value is empty
   * @param {*} value - Value to check
   * @returns {boolean} True if value is empty
   * @private
   */
  static _isEmpty(value) {
    if (value === null || value === undefined) {
return true;
}
    if (typeof value === 'string') {
return value.trim().length === 0;
}
    if (Array.isArray(value)) {
return value.length === 0;
}
    if (typeof value === 'object') {
return Object.keys(value).length === 0;
}
    return false;
  }

  /**
   * Get validation rules for a specific field
   * @param {string} fieldName - Field name
   * @returns {Object|null} Validation rules
   */
  static getFieldRules(fieldName) {
    const fieldConfig = SoftValidation._findFieldConfig(fieldName);
    if (!fieldConfig) {
return null;
}

    return {
      required: fieldConfig.type === 'required',
      validator: fieldConfig.validator,
      inputType: fieldConfig.inputType,
      maxLength: fieldConfig.maxLength,
      helpText: fieldConfig.helpText,
      placeholder: fieldConfig.placeholder
    };
  }

  /**
   * Format validation message for display
   * @param {Object} validationResult - Validation result object
   * @returns {string} Formatted message
   */
  static formatMessage(validationResult) {
    if (!validationResult.message) {
return '';
}

    const prefix = validationResult.type === ValidationTypes.ERROR ? '❌' : 
                   validationResult.type === ValidationTypes.WARNING ? '⚠️' : '✅';
    
    return `${prefix} ${validationResult.message}`;
  }

  /**
   * Get validation summary for UI display
   * @param {Object} validationResult - Result from collectWarnings()
   * @returns {Object} UI-friendly summary
   */
  static getDisplaySummary(validationResult) {
    const { summary, categoryResults } = validationResult;
    
    return {
      completionPercent: summary.completionPercent,
      status: summary.completionPercent === 100 ? 'complete' : 
              summary.errorCount > 0 ? 'error' : 'incomplete',
      message: SoftValidation._getStatusMessage(summary),
      categories: Object.entries(categoryResults).map(([name, result]) => ({
        name,
        label: EntryFieldsConfig[name].label,
        icon: EntryFieldsConfig[name].icon,
        status: result.hasErrors ? 'error' : 
                result.isComplete ? 'complete' : 'incomplete',
        completedCount: result.completedCount,
        totalCount: result.totalCount,
        completionPercent: result.completionPercent
      })),
      canSubmit: validationResult.canSubmit,
      canNavigate: validationResult.canNavigate
    };
  }

  /**
   * Get status message based on validation summary
   * @param {Object} summary - Validation summary
   * @returns {string} Status message
   * @private
   */
  static _getStatusMessage(summary) {
    if (summary.errorCount > 0) {
      return `${summary.errorCount} error${summary.errorCount > 1 ? 's' : ''} need to be fixed`;
    }
    
    if (summary.warningCount > 0) {
      return `${summary.warningCount} field${summary.warningCount > 1 ? 's' : ''} missing`;
    }
    
    if (summary.completionPercent === 100) {
      return 'All information complete';
    }
    
    return `${summary.completionPercent}% complete`;
  }
}

export default SoftValidation;