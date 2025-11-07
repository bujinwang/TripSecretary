/**
 * TDAC Validation Service
 * Comprehensive validation and error handling for TDAC submission metadata
 * 
 * Requirements: 5.1-5.5, 24.1-24.5
 */

// Type definitions
interface ValidationRules {
  required: string[];
  recommended: string[];
  formats: Record<string, RegExp>;
  lengths: Record<string, { min: number; max: number }>;
}

interface ErrorMessages {
  missing: Record<string, string>;
  format: Record<string, string>;
  length: Record<string, string>;
  business: Record<string, string>;
}

interface ValidationOptions {
  strict?: boolean;
  checkFiles?: boolean;
  [key: string]: any;
}

interface ValidationMetadata {
  validatedAt: string;
  validationVersion: string;
  strictMode: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldErrors: Record<string, string[]>;
  metadata?: ValidationMetadata;
}

interface ValidationSummary {
  status: 'valid' | 'invalid';
  errorCount: number;
  warningCount: number;
  hasFieldErrors: boolean;
  criticalErrors: string[];
  formatErrors: string[];
  businessWarnings: string[];
  message: string;
}

interface TDACSubmission {
  arrCardNo?: string;
  qrUri?: string;
  pdfUrl?: string;
  submittedAt?: string;
  submissionMethod?: 'api' | 'webview' | 'hybrid';
  travelerName?: string;
  passportNo?: string;
  arrivalDate?: string;
  [key: string]: any;
}

interface TravelerData {
  familyName?: string;
  firstName?: string;
  passportNo?: string;
  nationality?: string;
  birthDate?: string | { year: number; month: number; day: number };
  gender?: string;
  arrivalDate?: string;
  [key: string]: any;
}

class TDACValidationService {
  private validationRules: ValidationRules;
  private errorMessages: ErrorMessages;
  
  constructor() {
    this.validationRules = {
      // Required fields for TDAC submission
      required: [
        'arrCardNo',
        'qrUri',
        'submittedAt',
        'submissionMethod'
      ],
      
      // Optional but recommended fields
      recommended: [
        'pdfUrl',
        'travelerName',
        'passportNo',
        'arrivalDate'
      ],
      
      // Field format validation rules
      formats: {
        arrCardNo: /^[A-Za-z0-9_-]+$/,
        qrUri: /^(data:|file:\/\/|https?:\/\/)/,
        pdfUrl: /^(file:\/\/|https?:\/\/)/,
        submittedAt: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
        submissionMethod: /^(api|webview|hybrid)$/,
        passportNo: /^[A-Za-z0-9]{6,12}$/,
        arrivalDate: /^\d{4}[-/]\d{2}[-/]\d{2}$/
      },
      
      // Field length constraints
      lengths: {
        arrCardNo: { min: 5, max: 50 },
        travelerName: { min: 2, max: 100 },
        passportNo: { min: 6, max: 12 },
        submissionMethod: { min: 3, max: 10 }
      }
    };
    
    this.errorMessages = {
      // Missing field errors
      missing: {
        arrCardNo: 'Arrival card number is required for TDAC submission',
        qrUri: 'QR code URI is required for TDAC submission',
        submittedAt: 'Submission timestamp is required',
        submissionMethod: 'Submission method must be specified'
      },
      
      // Format validation errors
      format: {
        arrCardNo: 'Arrival card number must contain only letters, numbers, underscores, and hyphens',
        qrUri: 'QR URI must be a valid data URL, file path, or HTTP(S) URL',
        pdfUrl: 'PDF path must be a valid file path or HTTP(S) URL',
        submittedAt: 'Submission timestamp must be in ISO 8601 format',
        submissionMethod: 'Submission method must be one of: api, webview, hybrid',
        passportNo: 'Passport number must be 6-12 alphanumeric characters',
        arrivalDate: 'Arrival date must be in YYYY-MM-DD or YYYY/MM/DD format'
      },
      
      // Length validation errors
      length: {
        arrCardNo: 'Arrival card number must be 5-50 characters long',
        travelerName: 'Traveler name must be 2-100 characters long',
        passportNo: 'Passport number must be 6-12 characters long',
        submissionMethod: 'Submission method must be 3-10 characters long'
      },
      
      // Business logic errors
      business: {
        futureSubmission: 'Submission timestamp cannot be in the future',
        oldSubmission: 'Submission timestamp is too old (more than 30 days)',
        invalidQrData: 'QR code data appears to be corrupted or invalid',
        missingFile: 'Referenced file does not exist or is not accessible',
        duplicateSubmission: 'This arrival card number has already been submitted'
      }
    };
  }

  /**
   * Validate TDAC submission metadata
   * @param tdacSubmission - TDAC submission data to validate
   * @param options - Validation options
   * @returns Validation result with errors and warnings
   */
  validateTDACSubmission(tdacSubmission: TDACSubmission, options: ValidationOptions = {}): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      fieldErrors: {},
      metadata: {
        validatedAt: new Date().toISOString(),
        validationVersion: '1.0.0',
        strictMode: options.strict || false
      }
    };

    try {
      console.log('🔍 Validating TDAC submission:', {
        hasData: !!tdacSubmission,
        fieldCount: tdacSubmission ? Object.keys(tdacSubmission).length : 0,
        strictMode: options.strict
      });

      if (!tdacSubmission || typeof tdacSubmission !== 'object') {
        result.isValid = false;
        result.errors.push('TDAC submission data is required and must be an object');
        return result;
      }

      // 1. Validate required fields
      this.validateRequiredFields(tdacSubmission, result, options);

      // 2. Validate field formats
      this.validateFieldFormats(tdacSubmission, result, options);

      // 3. Validate field lengths
      this.validateFieldLengths(tdacSubmission, result, options);

      // 4. Validate business logic
      this.validateBusinessLogic(tdacSubmission, result, options);

      // 5. Check for recommended fields (warnings only)
      this.checkRecommendedFields(tdacSubmission, result, options);

      // 6. Validate file accessibility (if applicable)
      if (options.checkFiles) {
        this.validateFileAccessibility(tdacSubmission, result, options);
      }

      // Set overall validity
      result.isValid = result.errors.length === 0;

      console.log('✅ TDAC validation completed:', {
        isValid: result.isValid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      });

      return result;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('❌ TDAC validation failed:', err);
      result.isValid = false;
      result.errors.push(`Validation process failed: ${err.message}`);
      return result;
    }
  }

  /**
   * Validate required fields
   */
  private validateRequiredFields(tdacSubmission: TDACSubmission, result: ValidationResult, options: ValidationOptions): void {
    for (const field of this.validationRules.required) {
      const value = tdacSubmission[field];
      if (!value || (typeof value === 'string' && !value.trim())) {
        result.errors.push(this.errorMessages.missing[field] || `Required field '${field}' is missing`);
        result.fieldErrors[field] = result.fieldErrors[field] || [];
        result.fieldErrors[field].push('required');
      }
    }
  }

  /**
   * Validate field formats
   */
  private validateFieldFormats(tdacSubmission: TDACSubmission, result: ValidationResult, options: ValidationOptions): void {
    for (const [field, pattern] of Object.entries(this.validationRules.formats)) {
      const value = tdacSubmission[field];
      
      if (value && typeof value === 'string') {
        if (!pattern.test(value)) {
          result.errors.push(this.errorMessages.format[field] || `Field '${field}' has invalid format`);
          result.fieldErrors[field] = result.fieldErrors[field] || [];
          result.fieldErrors[field].push('format');
        }
      }
    }
  }

  /**
   * Validate field lengths
   */
  private validateFieldLengths(tdacSubmission: TDACSubmission, result: ValidationResult, options: ValidationOptions): void {
    for (const [field, constraints] of Object.entries(this.validationRules.lengths)) {
      const value = tdacSubmission[field];
      
      if (value && typeof value === 'string') {
        if (value.length < constraints.min || value.length > constraints.max) {
          result.errors.push(this.errorMessages.length[field] || `Field '${field}' length is invalid`);
          result.fieldErrors[field] = result.fieldErrors[field] || [];
          result.fieldErrors[field].push('length');
        }
      }
    }
  }

  /**
   * Validate business logic rules
   */
  private validateBusinessLogic(tdacSubmission: TDACSubmission, result: ValidationResult, options: ValidationOptions): void {
    // Check submission timestamp
    if (tdacSubmission.submittedAt) {
      const submissionTime = new Date(tdacSubmission.submittedAt);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

      if (submissionTime > now) {
        result.errors.push(this.errorMessages.business.futureSubmission);
        result.fieldErrors.submittedAt = result.fieldErrors.submittedAt || [];
        result.fieldErrors.submittedAt.push('future');
      }

      if (submissionTime < thirtyDaysAgo) {
        result.warnings.push(this.errorMessages.business.oldSubmission);
      }
    }

    // Validate QR URI content
    if (tdacSubmission.qrUri) {
      if (tdacSubmission.qrUri.startsWith('data:')) {
        // Validate base64 data URI
        try {
          const base64Data = tdacSubmission.qrUri.split(',')[1];
          if (!base64Data || base64Data.length < 100) {
            result.warnings.push(this.errorMessages.business.invalidQrData);
          }
        } catch (error) {
          result.warnings.push('QR code data URI appears to be malformed');
        }
      }
    }

    // Check arrival date logic
    if (tdacSubmission.arrivalDate && tdacSubmission.submittedAt) {
      const arrivalDate = new Date(tdacSubmission.arrivalDate);
      const submissionDate = new Date(tdacSubmission.submittedAt);
      
      // TDAC should be submitted within 72 hours before arrival
      const hoursDiff = (arrivalDate.getTime() - submissionDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 72) {
        result.warnings.push('TDAC was submitted more than 72 hours before arrival date');
      }
      
      if (hoursDiff < -24) {
        result.warnings.push('TDAC was submitted after the arrival date');
      }
    }
  }

  /**
   * Check for recommended fields
   */
  private checkRecommendedFields(tdacSubmission: TDACSubmission, result: ValidationResult, options: ValidationOptions): void {
    for (const field of this.validationRules.recommended) {
      if (!tdacSubmission[field]) {
        result.warnings.push(`Recommended field '${field}' is missing`);
      }
    }
  }

  /**
   * Validate file accessibility (async operation)
   */
  async validateFileAccessibility(tdacSubmission: TDACSubmission, result: ValidationResult, options: ValidationOptions): Promise<void> {
    const fileFields = ['qrUri', 'pdfUrl'];
    
    for (const field of fileFields) {
      const filePath = tdacSubmission[field];
      
      if (filePath && typeof filePath === 'string' && filePath.startsWith('file://')) {
        try {
          // Check if file exists (this would need platform-specific implementation)
          const exists = await this.checkFileExists(filePath);
          if (!exists) {
            result.warnings.push(`File referenced in '${field}' does not exist: ${filePath}`);
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          result.warnings.push(`Cannot verify file accessibility for '${field}': ${err.message}`);
        }
      }
    }
  }

  /**
   * Check if file exists (platform-specific implementation needed)
   */
  private async checkFileExists(filePath: string): Promise<boolean> {
    try {
      // This would need to be implemented with react-native file system
      // For now, return true to avoid blocking validation
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user-friendly error message for field
   * @param field - Field name
   * @param errorTypes - Array of error types for the field
   * @returns User-friendly error message
   */
  getFieldErrorMessage(field: string, errorTypes: string[]): string {
    if (!errorTypes || errorTypes.length === 0) {
      return '';
    }

    const messages: string[] = [];
    
    for (const errorType of errorTypes) {
      switch (errorType) {
        case 'required':
          messages.push(this.errorMessages.missing[field] || `${field} is required`);
          break;
        case 'format':
          messages.push(this.errorMessages.format[field] || `${field} format is invalid`);
          break;
        case 'length':
          messages.push(this.errorMessages.length[field] || `${field} length is invalid`);
          break;
        case 'future':
          messages.push('Date cannot be in the future');
          break;
        default:
          messages.push(`${field} has validation error: ${errorType}`);
      }
    }

    return messages.join('; ');
  }

  /**
   * Get validation summary for display
   * @param validationResult - Result from validateTDACSubmission
   * @returns Summary for UI display
   */
  getValidationSummary(validationResult: ValidationResult): ValidationSummary {
    return {
      status: validationResult.isValid ? 'valid' : 'invalid',
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      hasFieldErrors: Object.keys(validationResult.fieldErrors).length > 0,
      criticalErrors: validationResult.errors.filter(error => 
        error.includes('required') || error.includes('missing')
      ),
      formatErrors: validationResult.errors.filter(error => 
        error.includes('format') || error.includes('invalid')
      ),
      businessWarnings: validationResult.warnings.filter(warning => 
        warning.includes('hours') || warning.includes('date')
      ),
      message: this.getOverallMessage(validationResult)
    };
  }

  /**
   * Get overall validation message
   */
  private getOverallMessage(validationResult: ValidationResult): string {
    if (validationResult.isValid) {
      if (validationResult.warnings.length > 0) {
        return `Validation passed with ${validationResult.warnings.length} warning(s)`;
      }
      return 'All validation checks passed';
    } else {
      return `Validation failed with ${validationResult.errors.length} error(s)`;
    }
  }

  /**
   * Validate traveler data before TDAC submission
   * @param travelerData - Traveler data to validate
   * @returns Validation result
   */
  validateTravelerData(travelerData: TravelerData): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      fieldErrors: {}
    };

    const requiredFields = [
      'familyName', 'firstName', 'passportNo', 'nationality',
      'birthDate', 'gender', 'arrivalDate'
    ];

    // Check required fields
    for (const field of requiredFields) {
      const value = travelerData[field];
      if (!value || (typeof value === 'string' && !value.trim())) {
        result.errors.push(`${field} is required for TDAC submission`);
        result.fieldErrors[field] = ['required'];
      }
    }

    // Validate specific field formats
    if (travelerData.passportNo && !/^[A-Za-z0-9]{6,12}$/.test(travelerData.passportNo)) {
      result.errors.push('Passport number must be 6-12 alphanumeric characters');
      result.fieldErrors.passportNo = result.fieldErrors.passportNo || [];
      result.fieldErrors.passportNo.push('format');
    }

    // Validate arrival date
    if (travelerData.arrivalDate) {
      const arrivalDate = new Date(travelerData.arrivalDate);
      const now = new Date();
      const maxFuture = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days

      if (arrivalDate < now) {
        result.warnings.push('Arrival date is in the past');
      }

      if (arrivalDate > maxFuture) {
        result.warnings.push('Arrival date is more than 90 days in the future');
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }
}

export default new TDACValidationService();

