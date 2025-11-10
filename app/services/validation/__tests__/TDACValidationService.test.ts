// @ts-nocheck

/**
 * TDAC Validation Service Tests
 * Tests for comprehensive TDAC submission metadata validation
 */

import TDACValidationService from '../TDACValidationService';

describe('TDACValidationService', () => {
  describe('validateTDACSubmission', () => {
    it('should validate valid TDAC submission', () => {
      const validSubmission = {
        arrCardNo: 'TDAC123456',
        qrUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        pdfPath: 'file:///path/to/tdac.pdf',
        submittedAt: new Date().toISOString(),
        submissionMethod: 'api',
        travelerName: 'John Doe',
        passportNo: 'AB123456',
        arrivalDate: '2025-12-01'
      };

      const result = TDACValidationService.validateTDACSubmission(validSubmission);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata.validatedAt).toBeDefined();
    });

    it('should fail validation for missing required fields', () => {
      const invalidSubmission = {
        qrUri: 'data:image/png;base64,test',
        submittedAt: new Date().toISOString()
      };

      const result = TDACValidationService.validateTDACSubmission(invalidSubmission);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Arrival card number is required for TDAC submission');
      expect(result.errors).toContain('Submission method must be specified');
      expect(result.fieldErrors.arrCardNo).toContain('required');
      expect(result.fieldErrors.submissionMethod).toContain('required');
    });

    it('should fail validation for invalid field formats', () => {
      const invalidSubmission = {
        arrCardNo: 'TDAC@123!',
        qrUri: 'invalid-uri',
        submittedAt: 'invalid-date',
        submissionMethod: 'invalid-method'
      };

      const result = TDACValidationService.validateTDACSubmission(invalidSubmission);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Arrival card number must contain only letters, numbers, underscores, and hyphens');
      expect(result.errors).toContain('QR URI must be a valid data URL, file path, or HTTP(S) URL');
      expect(result.errors).toContain('Submission timestamp must be in ISO 8601 format');
      expect(result.errors).toContain('Submission method must be one of: api, webview, hybrid');
    });

    it('should warn about future submission timestamp', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const submission = {
        arrCardNo: 'TDAC123456',
        qrUri: 'data:image/png;base64,test',
        submittedAt: futureDate.toISOString(),
        submissionMethod: 'api'
      };

      const result = TDACValidationService.validateTDACSubmission(submission);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Submission timestamp cannot be in the future');
      expect(result.fieldErrors.submittedAt).toContain('future');
    });

    it('should warn about old submission timestamp', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      const submission = {
        arrCardNo: 'TDAC123456',
        qrUri: 'data:image/png;base64,test',
        submittedAt: oldDate.toISOString(),
        submissionMethod: 'api'
      };

      const result = TDACValidationService.validateTDACSubmission(submission);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Submission timestamp is too old (more than 30 days)');
    });

    it('should validate field lengths', () => {
      const submission = {
        arrCardNo: 'A', // Too short
        qrUri: 'data:image/png;base64,test',
        submittedAt: new Date().toISOString(),
        submissionMethod: 'api',
        travelerName: 'A'.repeat(101), // Too long
        passportNo: 'AB123' // Too short
      };

      const result = TDACValidationService.validateTDACSubmission(submission);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Arrival card number must be 5-50 characters long');
      expect(result.errors).toContain('Traveler name must be 2-100 characters long');
      expect(result.errors).toContain('Passport number must be 6-12 characters long');
    });

    it('should validate arrival date logic', () => {
      const now = new Date();
      const arrivalDate = new Date(now.getTime() + (80 * 60 * 60 * 1000)); // 80 hours in future

      const submission = {
        arrCardNo: 'TDAC123456',
        qrUri: 'data:image/png;base64,test',
        submittedAt: now.toISOString(),
        submissionMethod: 'api',
        arrivalDate: arrivalDate.toISOString().split('T')[0]
      };

      const result = TDACValidationService.validateTDACSubmission(submission);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('TDAC was submitted more than 72 hours before arrival date');
    });

    it('should check recommended fields', () => {
      const minimalSubmission = {
        arrCardNo: 'TDAC123456',
        qrUri: 'data:image/png;base64,test',
        submittedAt: new Date().toISOString(),
        submissionMethod: 'api'
      };

      const result = TDACValidationService.validateTDACSubmission(minimalSubmission);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("Recommended field 'pdfPath' is missing");
      expect(result.warnings).toContain("Recommended field 'travelerName' is missing");
      expect(result.warnings).toContain("Recommended field 'passportNo' is missing");
      expect(result.warnings).toContain("Recommended field 'arrivalDate' is missing");
    });
  });

  describe('validateTravelerData', () => {
    it('should validate complete traveler data', () => {
      const validTraveler = {
        familyName: 'Doe',
        firstName: 'John',
        passportNo: 'AB123456',
        nationality: 'USA',
        birthDate: { day: '15', month: '06', year: '1990' },
        gender: 'MALE',
        arrivalDate: '2025-12-01'
      };

      const result = TDACValidationService.validateTravelerData(validTraveler);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for missing required fields', () => {
      const incompleteTraveler = {
        firstName: 'John',
        nationality: 'USA'
      };

      const result = TDACValidationService.validateTravelerData(incompleteTraveler);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('familyName is required for TDAC submission');
      expect(result.errors).toContain('passportNo is required for TDAC submission');
      expect(result.errors).toContain('birthDate is required for TDAC submission');
      expect(result.errors).toContain('gender is required for TDAC submission');
      expect(result.errors).toContain('arrivalDate is required for TDAC submission');
    });

    it('should validate passport number format', () => {
      const traveler = {
        familyName: 'Doe',
        firstName: 'John',
        passportNo: 'AB@123!',
        nationality: 'USA',
        birthDate: { day: '15', month: '06', year: '1990' },
        gender: 'MALE',
        arrivalDate: '2025-12-01'
      };

      const result = TDACValidationService.validateTravelerData(traveler);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passport number must be 6-12 alphanumeric characters');
      expect(result.fieldErrors.passportNo).toContain('format');
    });

    it('should warn about past arrival date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const traveler = {
        familyName: 'Doe',
        firstName: 'John',
        passportNo: 'AB123456',
        nationality: 'USA',
        birthDate: { day: '15', month: '06', year: '1990' },
        gender: 'MALE',
        arrivalDate: pastDate.toISOString().split('T')[0]
      };

      const result = TDACValidationService.validateTravelerData(traveler);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Arrival date is in the past');
    });

    it('should warn about far future arrival date', () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 100);

      const traveler = {
        familyName: 'Doe',
        firstName: 'John',
        passportNo: 'AB123456',
        nationality: 'USA',
        birthDate: { day: '15', month: '06', year: '1990' },
        gender: 'MALE',
        arrivalDate: farFuture.toISOString().split('T')[0]
      };

      const result = TDACValidationService.validateTravelerData(traveler);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Arrival date is more than 90 days in the future');
    });
  });

  describe('getValidationSummary', () => {
    it('should create proper validation summary', () => {
      const validationResult = {
        isValid: false,
        errors: ['Required field missing', 'Invalid format'],
        warnings: ['Old submission'],
        fieldErrors: { arrCardNo: ['required'] }
      };

      const summary = TDACValidationService.getValidationSummary(validationResult);

      expect(summary.status).toBe('invalid');
      expect(summary.errorCount).toBe(2);
      expect(summary.warningCount).toBe(1);
      expect(summary.hasFieldErrors).toBe(true);
      expect(summary.criticalErrors).toHaveLength(1);
      expect(summary.formatErrors).toHaveLength(1);
      expect(summary.message).toBe('Validation failed with 2 error(s)');
    });
  });

  describe('getFieldErrorMessage', () => {
    it('should return appropriate error message', () => {
      const message = TDACValidationService.getFieldErrorMessage('arrCardNo', ['required']);
      expect(message).toBe('Arrival card number is required for TDAC submission');
    });

    it('should return empty string for no errors', () => {
      const message = TDACValidationService.getFieldErrorMessage('arrCardNo', []);
      expect(message).toBe('');
    });

    it('should handle multiple error types', () => {
      const message = TDACValidationService.getFieldErrorMessage('arrCardNo', ['required', 'format']);
      expect(message).toContain('required');
      expect(message).toContain('format');
    });
  });
});