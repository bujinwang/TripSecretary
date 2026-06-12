// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TDACSubmission = Record<string, any>;

interface TDACValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldErrors: Record<string, string[]>;
  metadata: {
    validatedAt: string;
    validationVersion: string;
    strictMode: boolean;
  };
}

interface TDACValidationRules {
  required: string[];
  recommended: string[];
  formats: Record<string, RegExp>;
  lengths: Record<string, { min: number; max: number }>;
}

interface TDACErrorMessages {
  missing: Record<string, string>;
  format: Record<string, string>;
  length: Record<string, string>;
  business: Record<string, string>;
}

interface TDACValidateOptions {
  strict?: boolean;
  checkFiles?: boolean;
}

/**
 * TDAC Validation Service
 * Comprehensive validation and error handling for TDAC submission metadata
 */
class TDACValidationService {
  validationRules: TDACValidationRules;
  errorMessages: TDACErrorMessages;

  constructor() {
    this.validationRules = {
      required: ['arrCardNo', 'qrUri', 'submittedAt', 'submissionMethod'],
      recommended: ['pdfUrl', 'travelerName', 'passportNo', 'arrivalDate'],
      formats: {
        arrCardNo: /^[A-Za-z0-9_-]+$/,
        qrUri: /^(data:|file:\/\/|https?:\/\/)/,
        pdfUrl: /^(file:\/\/|https?:\/\/)/,
        submittedAt: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
        submissionMethod: /^(api|webview|hybrid)$/,
        passportNo: /^[A-Za-z0-9]{6,12}$/,
        arrivalDate: /^\d{4}[-\/]\d{2}[-\/]\d{2}$/,
      },
      lengths: {
        arrCardNo: { min: 5, max: 50 },
        travelerName: { min: 2, max: 100 },
        passportNo: { min: 6, max: 12 },
        submissionMethod: { min: 3, max: 10 },
      },
    };

    this.errorMessages = {
      missing: {
        arrCardNo: 'Arrival card number is required for TDAC submission',
        qrUri: 'QR code URI is required for TDAC submission',
        submittedAt: 'Submission timestamp is required',
        submissionMethod: 'Submission method must be specified',
      },
      format: {
        arrCardNo: 'Arrival card number must contain only letters, numbers, underscores, and hyphens',
        qrUri: 'QR URI must be a valid data URL, file path, or HTTP(S) URL',
        pdfUrl: 'PDF path must be a valid file path or HTTP(S) URL',
        submittedAt: 'Submission timestamp must be in ISO 8601 format',
        submissionMethod: 'Submission method must be one of: api, webview, hybrid',
        passportNo: 'Passport number must be 6-12 alphanumeric characters',
        arrivalDate: 'Arrival date must be in YYYY-MM-DD or YYYY/MM/DD format',
      },
      length: {
        arrCardNo: 'Arrival card number must be 5-50 characters long',
        travelerName: 'Traveler name must be 2-100 characters long',
        passportNo: 'Passport number must be 6-12 characters long',
        submissionMethod: 'Submission method must be 3-10 characters long',
      },
      business: {
        futureSubmission: 'Submission timestamp cannot be in the future',
        oldSubmission: 'Submission timestamp is too old (more than 30 days)',
        invalidQrData: 'QR code data appears to be corrupted or invalid',
        missingFile: 'Referenced file does not exist or is not accessible',
        duplicateSubmission: 'This arrival card number has already been submitted',
      },
    };
  }

  validateTDACSubmission(
    tdacSubmission: TDACSubmission | null,
    options: TDACValidateOptions = {},
  ): TDACValidationResult {
    const result: TDACValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      fieldErrors: {},
      metadata: {
        validatedAt: new Date().toISOString(),
        validationVersion: '1.0.0',
        strictMode: options.strict || false,
      },
    };

    if (!tdacSubmission || typeof tdacSubmission !== 'object') {
      result.isValid = false;
      result.errors.push('TDAC submission data is required and must be an object');
      return result;
    }

    this.validateRequiredFields(tdacSubmission, result, options);
    this.validateFieldFormats(tdacSubmission, result, options);
    this.validateFieldLengths(tdacSubmission, result, options);
    this.validateBusinessLogic(tdacSubmission, result, options);
    this.checkRecommendedFields(tdacSubmission, result, options);

    if (options.checkFiles) {
      this.validateFileAccessibility(tdacSubmission, result, options);
    }

    result.isValid = result.errors.length === 0;

    return result;
  }

  private validateRequiredFields(
    submission: TDACSubmission,
    result: TDACValidationResult,
    _options: TDACValidateOptions,
  ): void {
    for (const field of this.validationRules.required) {
      const value = submission[field];
      if (value === undefined || value === null || String(value).trim() === '') {
        result.errors.push(
          this.errorMessages.missing[field] || `${field} is required`,
        );
        result.fieldErrors[field] = result.fieldErrors[field] || [];
        result.fieldErrors[field].push(
          this.errorMessages.missing[field] || `${field} is required`,
        );
      }
    }
  }

  private validateFieldFormats(
    submission: TDACSubmission,
    result: TDACValidationResult,
    options: TDACValidateOptions,
  ): void {
    for (const [field, pattern] of Object.entries(this.validationRules.formats)) {
      const value = submission[field];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        if (!pattern.test(String(value))) {
          if (options.strict || this.validationRules.required.includes(field)) {
            result.errors.push(
              this.errorMessages.format[field] || `${field} has an invalid format`,
            );
            result.fieldErrors[field] = result.fieldErrors[field] || [];
            result.fieldErrors[field].push(
              this.errorMessages.format[field] || `${field} has an invalid format`,
            );
          } else {
            result.warnings.push(
              this.errorMessages.format[field] || `${field} has an invalid format`,
            );
          }
        }
      }
    }
  }

  private validateFieldLengths(
    submission: TDACSubmission,
    result: TDACValidationResult,
    options: TDACValidateOptions,
  ): void {
    for (const [field, constraint] of Object.entries(this.validationRules.lengths)) {
      const value = submission[field];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        const len = String(value).length;
        if (len < constraint.min || len > constraint.max) {
          if (options.strict || this.validationRules.required.includes(field)) {
            result.errors.push(
              this.errorMessages.length[field] || `${field} has invalid length`,
            );
            result.fieldErrors[field] = result.fieldErrors[field] || [];
            result.fieldErrors[field].push(
              this.errorMessages.length[field] || `${field} has invalid length`,
            );
          } else {
            result.warnings.push(
              this.errorMessages.length[field] || `${field} has invalid length`,
            );
          }
        }
      }
    }
  }

  private validateBusinessLogic(
    submission: TDACSubmission,
    result: TDACValidationResult,
    _options: TDACValidateOptions,
  ): void {
    if (submission.submittedAt) {
      const submitted = new Date(submission.submittedAt);
      const now = new Date();

      if (isNaN(submitted.getTime())) {
        result.errors.push(this.errorMessages.format.submittedAt);
      } else {
        if (submitted > now) {
          result.errors.push(this.errorMessages.business.futureSubmission);
        }

        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (submitted < thirtyDaysAgo) {
          result.warnings.push(this.errorMessages.business.oldSubmission);
        }
      }
    }

    if (submission.qrUri) {
      const qrStr = String(submission.qrUri);
      if (qrStr.startsWith('data:') && qrStr.length < 100) {
        result.warnings.push(this.errorMessages.business.invalidQrData);
      }
    }
  }

  private checkRecommendedFields(
    submission: TDACSubmission,
    result: TDACValidationResult,
    _options: TDACValidateOptions,
  ): void {
    for (const field of this.validationRules.recommended) {
      const value = submission[field];
      if (value === undefined || value === null || String(value).trim() === '') {
        result.warnings.push(`${field} is recommended for TDAC submission`);
      }
    }
  }

  private validateFileAccessibility(
    _submission: TDACSubmission,
    _result: TDACValidationResult,
    _options: TDACValidateOptions,
  ): void {
    // File accessibility check stub — requires FileSystem API at runtime
  }

  validateTravelerData(travelerData: Record<string, unknown>): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const requiredFields = ['familyName', 'firstName', 'passportNo', 'nationality', 'birthDate', 'gender'];
    
    for (const field of requiredFields) {
      if (!travelerData[field]) {
        return { isValid: false, warnings: [`Missing required field: ${field}`] };
      }
    }
    
    return { isValid: true, warnings };
  }
}

export default new TDACValidationService();
