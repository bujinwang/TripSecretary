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

interface CategoryValidationResult {
  category: string;
  warnings: unknown[];
  errors: unknown[];
  completedCount: number;
  totalCount: number;
  completionPercent: number;
  isComplete: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
}

export interface FieldValidationResult {
  type: string;
  severity: string;
  isValid: boolean;
  message: string | null;
  fieldName: string;
  category: string | null;
  helpText?: string;
  error?: string;
}

interface CategoryConfig {
  label?: string;
  icon?: string;
  isArray?: boolean;
  requiredFieldCount: number;
  fields: Array<{
    name: string;
    type?: string;
    validator?: (value: unknown) => { isValid: boolean; message: string };
    inputType?: string;
    maxLength?: number;
    helpText?: string;
    placeholder?: string;
    label?: string;
    itemFields?: Array<{ name: string }>;
  }>;
}

interface ValidationSummary {
  isValid: boolean;
  canSubmit: boolean;
  canNavigate: boolean;
  warnings: unknown[];
  errors: unknown[];
  categoryResults: Record<string, CategoryValidationResult>;
  summary: {
    totalFields: number;
    completedFields: number;
    completionPercent: number;
    warningCount: number;
    errorCount: number;
  };
}

interface DisplaySummary {
  completionPercent: number;
  status: string;
  message: string;
  categories: Array<{
    name: string;
    label: string;
    icon: string;
    status: string;
    completedCount: number;
    totalCount: number;
    completionPercent: number;
  }>;
  canSubmit: boolean;
  canNavigate: boolean;
}

export const ValidationTypes = {
  ERROR: 'error',
  WARNING: 'warning',
  SUCCESS: 'success'
} as const;

export const ValidationSeverity = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const;

class SoftValidation {
  static validateField(fieldName: string, value: unknown, rules: { validator?: (value: unknown, allData?: Record<string, unknown>) => { isValid: boolean; message: string } } | null = null, allData: Record<string, unknown> = {}): FieldValidationResult {
    try {
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

      let validationResult: { isValid: boolean; message: string };
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
        error: (error as Error).message
      };
    }
  }

  static collectWarnings(entryInfo: Record<string, unknown>): ValidationSummary {
    try {
      const warnings: unknown[] = [];
      const errors: unknown[] = [];
      const categoryResults: Record<string, CategoryValidationResult> = {};

      Object.keys(EntryFieldsConfig).forEach(categoryName => {
        const categoryConfig = (EntryFieldsConfig as Record<string, CategoryConfig>)[categoryName];
        const categoryData = (entryInfo[categoryName] as Record<string, unknown>) || {};
        
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

      const totalFields = Object.values(EntryFieldsConfig as Record<string, CategoryConfig>)
        .reduce((sum, config) => sum + config.requiredFieldCount, 0);
      
      const completedFields = Object.values(categoryResults)
        .reduce((sum, result) => sum + result.completedCount, 0);

      const completionPercent = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

      return {
        isValid: errors.length === 0,
        canSubmit: errors.length === 0 && warnings.length === 0,
        canNavigate: true,
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

  static _validateCategory(categoryName: string, categoryConfig: CategoryConfig, categoryData: Record<string, unknown>, allData: Record<string, unknown>): CategoryValidationResult {
    const warnings: unknown[] = [];
    const errors: unknown[] = [];
    let completedCount = 0;

    if (categoryConfig.isArray) {
      const arrayData = (categoryData[categoryConfig.fields[0].name] as unknown[]) || [];
      
      const arrayResult = categoryConfig.fields[0].validator ? categoryConfig.fields[0].validator(arrayData) : { isValid: false, message: 'No validator' };
      
      if (!arrayResult.isValid) {
        if (arrayData.length === 0) {
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
        completedCount = 1;
      }
    } else {
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

  static _findFieldConfig(fieldName: string): (CategoryConfig['fields'][0] & { category: string; parentField?: string }) | null {
    for (const [categoryName, categoryConfig] of Object.entries(EntryFieldsConfig as Record<string, CategoryConfig>)) {
      if (categoryConfig.isArray) {
        const arrayField = categoryConfig.fields[0];
        if (arrayField.name === fieldName) {
          return {
            ...arrayField,
            category: categoryName
          };
        }
        
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

  static _isEmpty(value: unknown): boolean {
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
      return Object.keys(value as object).length === 0;
    }
    return false;
  }

  static getFieldRules(fieldName: string): Record<string, unknown> | null {
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

  static formatMessage(validationResult: FieldValidationResult): string {
    if (!validationResult.message) {
      return '';
    }

    const prefix = validationResult.type === ValidationTypes.ERROR ? '❌' : 
                   validationResult.type === ValidationTypes.WARNING ? '⚠️' : '✅';
    
    return `${prefix} ${validationResult.message}`;
  }

  static getDisplaySummary(validationResult: ValidationSummary): DisplaySummary {
    const { summary, categoryResults } = validationResult;
    
    return {
      completionPercent: summary.completionPercent,
      status: summary.completionPercent === 100 ? 'complete' : 
              summary.errorCount > 0 ? 'error' : 'incomplete',
      message: SoftValidation._getStatusMessage(summary),
      categories: (Object.entries(categoryResults) as [string, CategoryValidationResult][]).map(([name, result]) => ({
        name,
        label: (EntryFieldsConfig as Record<string, CategoryConfig>)[name].label || name,
        icon: (EntryFieldsConfig as Record<string, CategoryConfig>)[name].icon || '',
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

  static _getStatusMessage(summary: ValidationSummary['summary']): string {
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
