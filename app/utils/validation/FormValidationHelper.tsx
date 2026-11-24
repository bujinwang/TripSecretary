// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormData = Record<string, any>;

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
  enum?: string[];
  customValidation?: (value: string, formData: FormData) => string | null;
}

interface RuleSet {
  [fieldName: string]: ValidationRule;
}

interface ValidationRules {
  personal: RuleSet;
  contact: RuleSet;
  travel: RuleSet;
  accommodation: RuleSet;
  birthDate: RuleSet;
}

interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface FormValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldErrors: Record<string, string[]>;
  fieldWarnings: Record<string, string[]>;
  summary: {
    totalFields: number;
    validFields: number;
    fieldsWithErrors: number;
    fieldsWithWarnings: number;
  };
}

/**
 * Form Validation Helper
 * Provides comprehensive validation utilities for TDAC forms and user input
 */
class FormValidationHelper {
  validationRules: ValidationRules;

  constructor() {
    this.validationRules = {
      personal: {
        familyName: {
          required: true,
          minLength: 1,
          maxLength: 50,
          pattern: /^[A-Za-z\s\-'.]+$/,
          message: 'Family name must contain only letters, spaces, hyphens, apostrophes, and periods',
        },
        firstName: {
          required: true,
          minLength: 1,
          maxLength: 50,
          pattern: /^[A-Za-z\s\-'.]+$/,
          message: 'First name must contain only letters, spaces, hyphens, apostrophes, and periods',
        },
        middleName: {
          required: false,
          minLength: 0,
          maxLength: 50,
          pattern: /^[A-Za-z\s\-'.]*$/,
          message: 'Middle name must contain only letters, spaces, hyphens, apostrophes, and periods',
        },
        passportNo: {
          required: true,
          minLength: 6,
          maxLength: 12,
          pattern: /^[A-Za-z0-9]+$/,
          message: 'Passport number must be 6-12 alphanumeric characters',
        },
        nationality: {
          required: true,
          minLength: 2,
          maxLength: 3,
          pattern: /^[A-Z]{2,3}$/,
          message: 'Nationality must be a valid 2-3 letter country code',
        },
        gender: {
          required: true,
          enum: ['MALE', 'FEMALE', 'UNDEFINED'],
          message: 'Gender must be MALE, FEMALE, or UNDEFINED',
        },
        occupation: {
          required: true,
          minLength: 2,
          maxLength: 100,
          pattern: /^[A-Za-z\s\-'.]+$/,
          message: 'Occupation must contain only letters, spaces, hyphens, apostrophes, and periods',
        },
      },
      contact: {
        phoneCode: {
          required: true,
          pattern: /^\d{1,4}$/,
          message: 'Phone code must be 1-4 digits',
        },
        phoneNo: {
          required: true,
          minLength: 7,
          maxLength: 15,
          pattern: /^\d+$/,
          message: 'Phone number must be 7-15 digits',
        },
        email: {
          required: false,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Email must be a valid email address',
        },
      },
      travel: {
        arrivalDate: {
          required: true,
          pattern: /^\d{4}[-\/]\d{2}[-\/]\d{2}$/,
          message: 'Arrival date must be in YYYY-MM-DD or YYYY/MM/DD format',
          customValidation: (value: string): string | null => {
            const date = new Date(value);
            const now = new Date();
            const maxFuture = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

            if (date < now) {
              return 'Arrival date cannot be in the past';
            }
            if (date > maxFuture) {
              return 'Arrival date cannot be more than 90 days in the future';
            }

            const hoursDiff = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursDiff > 72) {
              return 'TDAC can only be submitted within 72 hours before arrival';
            }

            return null;
          },
        },
        departureDate: {
          required: false,
          pattern: /^\d{4}[-\/]\d{2}[-\/]\d{2}$/,
          message: 'Departure date must be in YYYY-MM-DD or YYYY/MM/DD format',
          customValidation: (value: string, formData: FormData): string | null => {
            if (!value) {
              return null;
            }

            const departureDate = new Date(value);
            const arrivalDate = new Date(formData.arrivalDate);

            if (departureDate <= arrivalDate) {
              return 'Departure date must be after arrival date';
            }

            return null;
          },
        },
        flightNo: {
          required: true,
          minLength: 2,
          maxLength: 10,
          pattern: /^[A-Z0-9]+$/,
          message: 'Flight number must be 2-10 alphanumeric characters',
        },
        purpose: {
          required: true,
          enum: ['HOLIDAY', 'BUSINESS', 'MEETING', 'SPORTS', 'INCENTIVE', 'MEDICAL', 'EDUCATION', 'CONVENTION', 'EMPLOYMENT', 'EXHIBITION', 'OTHERS'],
          message: 'Purpose must be a valid travel purpose',
        },
      },
      accommodation: {
        accommodationType: {
          required: true,
          enum: ['HOTEL', 'YOUTH_HOSTEL', 'GUEST_HOUSE', 'FRIEND_HOUSE', 'APARTMENT', 'OTHERS'],
          message: 'Accommodation type must be a valid type',
        },
        address: {
          required: true,
          minLength: 10,
          maxLength: 200,
          message: 'Address must be 10-200 characters long',
        },
        province: {
          required: true,
          minLength: 2,
          maxLength: 50,
          message: 'Province is required',
        },
        district: {
          required: false,
          minLength: 0,
          maxLength: 50,
          message: 'District must be less than 50 characters',
        },
        subDistrict: {
          required: false,
          minLength: 0,
          maxLength: 50,
          message: 'Sub-district must be less than 50 characters',
        },
        postCode: {
          required: false,
          pattern: /^\d{5}$/,
          message: 'Post code must be 5 digits',
        },
      },
      birthDate: {
        day: {
          required: true,
          pattern: /^(0?[1-9]|[12][0-9]|3[01])$/,
          message: 'Day must be 1-31',
        },
        month: {
          required: true,
          pattern: /^(0?[1-9]|1[0-2])$/,
          message: 'Month must be 1-12',
        },
        year: {
          required: true,
          pattern: /^\d{4}$/,
          message: 'Year must be 4 digits',
          customValidation: (value: string): string | null => {
            const year = parseInt(value);
            const currentYear = new Date().getFullYear();
            const minYear = currentYear - 120;
            const maxYear = currentYear - 16;

            if (year < minYear || year > maxYear) {
              return `Year must be between ${minYear} and ${maxYear}`;
            }

            return null;
          },
        },
      },
    };
  }

  validateField(
    category: string,
    fieldName: string,
    value: unknown,
    formData: FormData = {},
  ): FieldValidationResult {
    try {
      const rules = (this.validationRules as Record<string, RuleSet>)[category]?.[fieldName];

      if (!rules) {
        return { isValid: true, errors: [], warnings: [] };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors.push(`${fieldName} is required`);
        return { isValid: false, errors, warnings };
      }

      if (!value || (typeof value === 'string' && !value.trim())) {
        return { isValid: true, errors, warnings };
      }

      const stringValue = value.toString().trim();

      if (rules.minLength !== undefined && stringValue.length < rules.minLength) {
        errors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
      }

      if (rules.maxLength !== undefined && stringValue.length > rules.maxLength) {
        errors.push(`${fieldName} must be no more than ${rules.maxLength} characters long`);
      }

      if (rules.pattern && !rules.pattern.test(stringValue)) {
        errors.push(rules.message || `${fieldName} format is invalid`);
      }

      if (rules.enum && !rules.enum.includes(stringValue.toUpperCase())) {
        errors.push(`${fieldName} must be one of: ${rules.enum.join(', ')}`);
      }

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
        warnings,
      };
    } catch (error: unknown) {
      console.error('Field validation error:', error);
      return {
        isValid: false,
        errors: [
          `Validation error for ${fieldName}: ${error instanceof Error ? error.message : String(error)}`,
        ],
        warnings: [],
      };
    }
  }

  validateForm(formData: FormData): FormValidationResult {
    try {
      const result: FormValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: {},
        fieldWarnings: {},
        summary: {
          totalFields: 0,
          validFields: 0,
          fieldsWithErrors: 0,
          fieldsWithWarnings: 0,
        },
      };

      for (const [category, fields] of Object.entries(this.validationRules)) {
        if (category === 'birthDate') {
          const birthDateResult = this.validateBirthDate(formData.birthDate || {});
          if (!birthDateResult.isValid) {
            result.errors.push(...birthDateResult.errors);
            result.fieldErrors.birthDate = birthDateResult.errors;
          }
          if (birthDateResult.warnings.length > 0) {
            result.warnings.push(...birthDateResult.warnings);
            result.fieldWarnings.birthDate = birthDateResult.warnings;
          }
          result.summary.totalFields += 3;
          result.summary.validFields += birthDateResult.isValid ? 3 : 0;
          result.summary.fieldsWithErrors += birthDateResult.isValid ? 0 : 1;
          continue;
        }

        const categoryData = formData[category] || formData;

        for (const [fieldName] of Object.entries(fields as RuleSet)) {
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

      const crossFieldResult = this.validateCrossFields(formData);
      if (!crossFieldResult.isValid) {
        result.errors.push(...crossFieldResult.errors);
      }
      result.warnings.push(...crossFieldResult.warnings);

      result.isValid = result.errors.length === 0;

      return result;
    } catch (error: unknown) {
      console.error('Form validation error:', error);
      return {
        isValid: false,
        errors: [
          `Form validation failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
        warnings: [],
        fieldErrors: {},
        fieldWarnings: {},
        summary: {
          totalFields: 0,
          validFields: 0,
          fieldsWithErrors: 1,
          fieldsWithWarnings: 0,
        },
      };
    }
  }

  validateBirthDate(birthDate: FormData): FieldValidationResult {
    const result: FieldValidationResult = { isValid: true, errors: [], warnings: [] };

    if (!birthDate || typeof birthDate !== 'object') {
      result.isValid = false;
      result.errors.push('Birth date is required');
      return result;
    }

    const dayResult = this.validateField('birthDate', 'day', birthDate.day);
    const monthResult = this.validateField('birthDate', 'month', birthDate.month);
    const yearResult = this.validateField('birthDate', 'year', birthDate.year);

    if (!dayResult.isValid) {
      result.isValid = false;
      result.errors.push(...dayResult.errors);
    }
    if (!monthResult.isValid) {
      result.isValid = false;
      result.errors.push(...monthResult.errors);
    }
    if (!yearResult.isValid) {
      result.isValid = false;
      result.errors.push(...yearResult.errors);
    }

    return result;
  }

  validateCrossFields(formData: FormData): FieldValidationResult {
    const result: FieldValidationResult = { isValid: true, errors: [], warnings: [] };

    if (formData.arrivalDate && formData.departureDate) {
      const arrival = new Date(formData.arrivalDate);
      const departure = new Date(formData.departureDate);
      if (departure <= arrival) {
        result.isValid = false;
        result.errors.push('Departure date must be after arrival date');
      }
    }

    return result;
  }
}

export default new FormValidationHelper();
