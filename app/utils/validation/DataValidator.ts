// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Validatable = Record<string, any>;

interface DataValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown, data: Validatable) => string | null;
  message?: string;
}

interface ValidationRuleSet {
  [fieldName: string]: DataValidationRule;
}

interface ValidationRulesConfig {
  passport: ValidationRuleSet;
  personalInfo: ValidationRuleSet;
  entryData: ValidationRuleSet;
  fundingProof: ValidationRuleSet;
}

interface FieldValidationDetail {
  isValid: boolean;
  errors: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fields?: Record<string, FieldValidationDetail>;
  components?: Record<string, ValidationResult>;
}

/**
 * 入境通 - Data Validation Utility
 * Comprehensive validation for all data types with security considerations
 */
class DataValidator {
  validationRules: ValidationRulesConfig;

  constructor() {
    this.validationRules = {
      passport: {
        passportNumber: {
          required: true,
          minLength: 6,
          maxLength: 12,
          pattern: /^[A-Z0-9]{6,12}$/i,
          message: 'Passport number must be 6-12 alphanumeric characters',
        },
        fullName: {
          required: true,
          minLength: 2,
          maxLength: 100,
          pattern: /^[A-Z\s'-]+$/i,
          message: 'Full name must contain only letters, spaces, hyphens, and apostrophes',
        },
        dateOfBirth: {
          required: true,
          pattern: /^\d{4}-\d{2}-\d{2}$/,
          custom: this.validateDateOfBirth.bind(this),
          message: 'Invalid date of birth format (YYYY-MM-DD) or person too young/old',
        },
        nationality: {
          required: true,
          minLength: 2,
          maxLength: 3,
          pattern: /^[A-Z]{2,3}$/i,
          message: 'Nationality must be 2-3 letter country code',
        },
        expiryDate: {
          required: true,
          pattern: /^\d{4}-\d{2}-\d{2}$/,
          custom: this.validateExpiryDate.bind(this),
          message: 'Invalid expiry date or passport has expired',
        },
        issueDate: {
          required: true,
          pattern: /^\d{4}-\d{2}-\d{2}$/,
          message: 'Invalid issue date format (YYYY-MM-DD)',
        },
        issuePlace: {
          required: false,
          maxLength: 100,
          message: 'Issue place must be less than 100 characters',
        },
      },
      personalInfo: {
        phoneNumber: {
          required: false,
          custom: this.validatePhoneNumber.bind(this),
          message: 'Invalid phone number format',
        },
        email: {
          required: false,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Invalid email address format',
        },
        homeAddress: {
          required: false,
          maxLength: 500,
          message: 'Home address must be less than 500 characters',
        },
        occupation: {
          required: false,
          maxLength: 100,
          message: 'Occupation must be less than 100 characters',
        },
        provinceCity: {
          required: false,
          maxLength: 100,
          message: 'Province/City must be less than 100 characters',
        },
        countryRegion: {
          required: false,
          maxLength: 100,
          message: 'Country/Region must be less than 100 characters',
        },
      },
      entryData: {
        destination: {
          required: true,
          custom: this.validateDestination.bind(this),
          message: 'Invalid destination',
        },
        purpose: {
          required: false,
          maxLength: 200,
          message: 'Purpose must be less than 200 characters',
        },
        arrivalDate: {
          required: true,
          pattern: /^\d{4}-\d{2}-\d{2}$/,
          custom: this.validateArrivalDate.bind(this),
          message: 'Invalid arrival date or date is in the past',
        },
        departureDate: {
          required: false,
          pattern: /^\d{4}-\d{2}-\d{2}$/,
          custom: this.validateDepartureDate.bind(this),
          message: 'Invalid departure date',
        },
        flightNumber: {
          required: false,
          pattern: /^[A-Z]{2,3}\d{1,4}$/i,
          message: 'Invalid flight number format (e.g., CA123, MU5678)',
        },
        accommodation: {
          required: false,
          maxLength: 500,
          message: 'Accommodation details must be less than 500 characters',
        },
      },
      fundingProof: {
        cashAmount: {
          required: false,
          custom: this.validateCashAmount.bind(this),
          message: 'Invalid cash amount format',
        },
        bankCards: {
          required: false,
          maxLength: 1000,
          message: 'Bank card details must be less than 1000 characters',
        },
        supportingDocs: {
          required: false,
          maxLength: 1000,
          message: 'Supporting documents description must be less than 1000 characters',
        },
      },
    };
  }

  validatePassport(data: Validatable): ValidationResult {
    return this.validateData(data, this.validationRules.passport);
  }

  validatePersonalInfo(data: Validatable): ValidationResult {
    return this.validateData(data, this.validationRules.personalInfo);
  }

  validateEntryData(data: Validatable): ValidationResult {
    return this.validateData(data, this.validationRules.entryData);
  }

  validateFundingProof(data: Validatable): ValidationResult {
    return this.validateData(data, this.validationRules.fundingProof);
  }

  validateCompleteEntry(entry: Validatable): ValidationResult {
    const results: ValidationResult = {
      isValid: true,
      errors: [],
      components: {},
    };

    if (entry.passport) {
      results.components!.passport = this.validatePassport(entry.passport);
      if (!results.components!.passport.isValid) {
        results.isValid = false;
        results.errors.push('Passport validation failed');
      }
    }

    if (entry.personalInfo) {
      results.components!.personalInfo = this.validatePersonalInfo(entry.personalInfo);
      if (!results.components!.personalInfo.isValid) {
        results.isValid = false;
        results.errors.push('Personal info validation failed');
      }
    }

    if (entry.entryData) {
      results.components!.entryData = this.validateEntryData(entry.entryData);
      if (!results.components!.entryData.isValid) {
        results.isValid = false;
        results.errors.push('Entry data validation failed');
      }
    }

    if (entry.fundingProof) {
      results.components!.fundingProof = this.validateFundingProof(entry.fundingProof);
      if (!results.components!.fundingProof.isValid) {
        results.isValid = false;
        results.errors.push('Funding proof validation failed');
      }
    }

    return results;
  }

  private validateData(data: Validatable, rules: ValidationRuleSet): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      fields: {},
    };

    for (const [fieldName, rule] of Object.entries(rules)) {
      const value = data[fieldName];
      const fieldResult: FieldValidationDetail = { isValid: true, errors: [] };

      if (rule.required && (value === undefined || value === null || value === '')) {
        fieldResult.isValid = false;
        fieldResult.errors.push(rule.message || `${fieldName} is required`);
      }

      if (value && rule.minLength !== undefined && String(value).length < rule.minLength) {
        fieldResult.isValid = false;
        fieldResult.errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
      }

      if (value && rule.maxLength !== undefined && String(value).length > rule.maxLength) {
        fieldResult.isValid = false;
        fieldResult.errors.push(`${fieldName} must be no more than ${rule.maxLength} characters`);
      }

      if (value && rule.pattern && !rule.pattern.test(String(value))) {
        fieldResult.isValid = false;
        fieldResult.errors.push(rule.message || `${fieldName} format is invalid`);
      }

      if (rule.custom && typeof rule.custom === 'function') {
        const customError = rule.custom(value, data);
        if (customError) {
          fieldResult.isValid = false;
          fieldResult.errors.push(customError);
        }
      }

      result.fields![fieldName] = fieldResult;

      if (!fieldResult.isValid) {
        result.isValid = false;
        result.errors.push(...fieldResult.errors);
      }
    }

    return result;
  }

  private validateDateOfBirth(value: unknown): string | null {
    if (!value || typeof value !== 'string') {
      return null;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Invalid date format';
    }

    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();
    if (age < 0 || age > 150) {
      return 'Date of birth is not valid';
    }

    return null;
  }

  private validateExpiryDate(value: unknown): string | null {
    if (!value || typeof value !== 'string') {
      return null;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Invalid date format';
    }

    const now = new Date();
    if (date < now) {
      return 'Passport has expired';
    }

    const sixMonthsFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    if (date < sixMonthsFromNow) {
      return 'Passport must be valid for at least 6 months from today';
    }

    return null;
  }

  private validatePhoneNumber(value: unknown): string | null {
    if (!value || String(value).trim() === '') {
      return null;
    }
    const cleaned = String(value).replace(/[\s\-()]/g, '');
    if (!/^\+?\d{7,15}$/.test(cleaned)) {
      return 'Phone number must be 7-15 digits with optional + prefix';
    }
    return null;
  }

  private validateDestination(value: unknown): string | null {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      return null;
    }

    const validDestinations = [
      'thailand', 'vietnam', 'malaysia', 'singapore',
      'japan', 'korea', 'china', 'hongkong', 'taiwan', 'usa', 'canada',
    ];

    if (!validDestinations.includes(value.toLowerCase())) {
      return `Invalid destination: ${value}`;
    }

    return null;
  }

  private validateArrivalDate(value: unknown, _data: Validatable): string | null {
    if (!value || typeof value !== 'string') {
      return null;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Invalid date format';
    }

    const now = new Date();
    if (date < now) {
      return 'Arrival date cannot be in the past';
    }

    return null;
  }

  private validateDepartureDate(value: unknown, _data: Validatable): string | null {
    if (!value || typeof value !== 'string') {
      return null;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Invalid date format';
    }

    return null;
  }

  private validateCashAmount(value: unknown): string | null {
    if (!value || String(value).trim() === '') {
      return null;
    }

    const amount = Number(value);
    if (isNaN(amount) || amount < 0) {
      return 'Cash amount must be a positive number';
    }

    return null;
  }
}

export default DataValidator;
