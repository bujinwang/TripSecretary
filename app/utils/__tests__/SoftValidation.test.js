/**
 * @fileoverview SoftValidation Test Suite
 * 
 * Tests for the SoftValidation utility class
 * Requirements: 5.1-5.5
 */

import SoftValidation, { ValidationTypes, ValidationSeverity } from '../SoftValidation';

describe('SoftValidation', () => {
  describe('validateField', () => {
    test('should validate email format correctly', () => {
      // Valid email
      const validResult = SoftValidation.validateField('email', 'test@example.com');
      expect(validResult.type).toBe(ValidationTypes.SUCCESS);
      expect(validResult.isValid).toBe(true);

      // Invalid email format
      const invalidResult = SoftValidation.validateField('email', 'invalid-email');
      expect(invalidResult.type).toBe(ValidationTypes.ERROR);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.severity).toBe(ValidationSeverity.CRITICAL);
    });

    test('should handle empty required fields as warnings', () => {
      const result = SoftValidation.validateField('passportNumber', '');
      expect(result.type).toBe(ValidationTypes.WARNING);
      expect(result.isValid).toBe(false);
      expect(result.severity).toBe(ValidationSeverity.HIGH);
      expect(result.message).toContain('required');
    });

    test('should validate passport number format', () => {
      // Valid passport number
      const validResult = SoftValidation.validateField('passportNumber', 'E12345678');
      expect(validResult.type).toBe(ValidationTypes.SUCCESS);
      expect(validResult.isValid).toBe(true);

      // Invalid passport number
      const invalidResult = SoftValidation.validateField('passportNumber', '123');
      expect(invalidResult.type).toBe(ValidationTypes.ERROR);
      expect(invalidResult.isValid).toBe(false);
    });

    test('should handle unknown fields', () => {
      const result = SoftValidation.validateField('unknownField', 'value');
      expect(result.type).toBe(ValidationTypes.ERROR);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Unknown field');
    });
  });

  describe('collectWarnings', () => {
    test('should collect warnings and errors from entry info', () => {
      const entryInfo = {
        passport: {
          passportNumber: 'E12345678', // Valid
          fullName: 'John Doe',       // Valid
          // Missing other required fields
        },
        personalInfo: {
          email: 'invalid-email',     // Invalid format
          // Missing other required fields
        },
        funds: {
          fundItems: []               // Empty array - warning
        },
        travel: {
          // Missing all required fields
        }
      };

      const result = SoftValidation.collectWarnings(entryInfo);
      
      expect(result.isValid).toBe(false); // Has errors
      expect(result.canNavigate).toBe(true); // Always allow navigation
      expect(result.canSubmit).toBe(false); // Has errors and warnings
      expect(result.errors.length).toBeGreaterThan(0); // Invalid email
      expect(result.warnings.length).toBeGreaterThan(0); // Missing fields
      expect(result.summary.completionPercent).toBeLessThan(100);
    });

    test('should handle complete valid entry info', () => {
      // Use future dates
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const departureFutureDate = new Date();
      departureFutureDate.setDate(departureFutureDate.getDate() + 45);
      
      const entryInfo = {
        passport: {
          passportNumber: 'E12345678',
          fullName: 'John Doe',
          nationality: 'US',
          dateOfBirth: '1990-01-01',
          expiryDate: '2030-12-31'
        },
        personalInfo: {
          occupation: 'Engineer',
          provinceCity: 'New York',
          countryRegion: 'US',
          phoneNumber: '+1234567890',
          email: 'john@example.com',
          gender: 'male'
        },
        funds: {
          fundItems: [{
            type: 'credit_card',
            amount: 5000,
            currency: 'USD'
          }]
        },
        travel: {
          travelPurpose: 'tourism',
          arrivalDate: futureDate.toISOString().split('T')[0],
          departureDate: departureFutureDate.toISOString().split('T')[0],
          flightNumber: 'AA123',
          accommodation: 'Hotel ABC'
        }
      };

      const result = SoftValidation.collectWarnings(entryInfo);
      
      expect(result.canNavigate).toBe(true);
      // Should have minimal errors now
      expect(result.errors.length).toBeLessThanOrEqual(1);
      expect(result.summary.completionPercent).toBeGreaterThan(80);
    });

    test('should handle empty entry info', () => {
      const entryInfo = {};
      
      const result = SoftValidation.collectWarnings(entryInfo);
      
      expect(result.isValid).toBe(true); // No format errors
      expect(result.canSubmit).toBe(false); // Has warnings
      expect(result.canNavigate).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0); // All fields missing
      expect(result.summary.completionPercent).toBe(0);
    });
  });

  describe('getDisplaySummary', () => {
    test('should format validation result for UI display', () => {
      const entryInfo = {
        passport: {
          passportNumber: 'E12345678',
          fullName: 'John Doe'
        },
        personalInfo: {},
        funds: { fundItems: [] },
        travel: {}
      };

      const validationResult = SoftValidation.collectWarnings(entryInfo);
      const displaySummary = SoftValidation.getDisplaySummary(validationResult);
      
      expect(displaySummary).toHaveProperty('completionPercent');
      expect(displaySummary).toHaveProperty('status');
      expect(displaySummary).toHaveProperty('message');
      expect(displaySummary).toHaveProperty('categories');
      expect(displaySummary).toHaveProperty('canSubmit');
      expect(displaySummary).toHaveProperty('canNavigate');
      
      expect(Array.isArray(displaySummary.categories)).toBe(true);
      expect(displaySummary.categories.length).toBe(4); // passport, personalInfo, funds, travel
    });
  });

  describe('formatMessage', () => {
    test('should format validation messages with appropriate icons', () => {
      const errorResult = {
        type: ValidationTypes.ERROR,
        message: 'Invalid format'
      };
      
      const warningResult = {
        type: ValidationTypes.WARNING,
        message: 'Field required'
      };
      
      const successResult = {
        type: ValidationTypes.SUCCESS,
        message: null
      };

      expect(SoftValidation.formatMessage(errorResult)).toContain('❌');
      expect(SoftValidation.formatMessage(warningResult)).toContain('⚠️');
      expect(SoftValidation.formatMessage(successResult)).toBe('');
    });
  });

  describe('getFieldRules', () => {
    test('should return field rules for known fields', () => {
      const emailRules = SoftValidation.getFieldRules('email');
      
      expect(emailRules).toHaveProperty('required');
      expect(emailRules).toHaveProperty('validator');
      expect(emailRules).toHaveProperty('inputType');
      expect(emailRules.required).toBe(true);
      expect(emailRules.inputType).toBe('email');
    });

    test('should return null for unknown fields', () => {
      const unknownRules = SoftValidation.getFieldRules('unknownField');
      expect(unknownRules).toBeNull();
    });
  });
});