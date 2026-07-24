/**
 * @fileoverview DataValidationService - Data consistency validation
 *
 * Handles validation of user data for consistency and correctness:
 * - Passport data validation
 * - Personal info data validation
 * - Cross-field consistency validation
 * - Field format validation (email, phone, dates)
 *
 * @module app/services/data/validation/DataValidationService
 */

import type { UserId } from '../../../types/data';

// Type definitions
interface PassportData {
  passportNumber?: string;
  fullName?: string;
  nationality?: string;
  dateOfBirth?: string;
  expiryDate?: string;
  issueDate?: string;
  gender?: string;
  userId?: UserId;
  [key: string]: unknown;
}

interface PersonalInfoData {
  email?: string;
  phoneNumber?: string;
  userId?: UserId;
  countryRegion?: string;
  [key: string]: unknown;
}

interface UserData {
  passport?: PassportData | null;
  personalInfo?: PersonalInfoData | null;
  [key: string]: unknown;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface DataConsistencyResult {
  isConsistent: boolean;
  userId: UserId;
  validatedAt: string;
  passport: ValidationResult;
  personalInfo: ValidationResult;
  crossFieldValidation: ValidationResult;
}

/**
 * @class DataValidationService
 * @classdesc Provides data validation and consistency checking
 */
class DataValidationService {
  /**
   * Validate data consistency for a user
   * Checks that passport, personal info, and funding proof data are consistent
   *
   * @param {string} userId - User ID
   * @param {Object} userData - All user data (passport, personalInfo, etc.)
   * @returns {Object} - Validation result with any inconsistencies found
   */
  static validateDataConsistency(userId: UserId, userData: UserData): DataConsistencyResult {
    try {
      const validationResult: DataConsistencyResult = {
        isConsistent: true,
        userId,
        validatedAt: new Date().toISOString(),
        passport: { valid: true, errors: [] },
        personalInfo: { valid: true, errors: [] },
        crossFieldValidation: { valid: true, errors: [] }
      };

      // Validate passport data
      if (userData.passport) {
        const passportValidation = this.validatePassportData(userData.passport);
        validationResult.passport = passportValidation;
        if (!passportValidation.valid) {
          validationResult.isConsistent = false;
        }
      }

      // Validate personal info data
      if (userData.personalInfo) {
        const personalInfoValidation = this.validatePersonalInfoData(userData.personalInfo);
        validationResult.personalInfo = personalInfoValidation;
        if (!personalInfoValidation.valid) {
          validationResult.isConsistent = false;
        }
      }

      // Cross-field validation (e.g., nationality consistency)
      const crossFieldValidation = this.validateCrossFieldConsistency(userData);
      validationResult.crossFieldValidation = crossFieldValidation;
      if (!crossFieldValidation.valid) {
        validationResult.isConsistent = false;
      }

      return validationResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to validate data consistency:', errorMessage);
      throw error;
    }
  }

  /**
   * Validate passport data consistency
   *
   * @param {Passport} passport - Passport instance
   * @returns {Object} - Validation result
   */
  static validatePassportData(passport: PassportData): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [] };

    // Check required fields
    const requiredFields: Array<keyof PassportData> = ['passportNumber', 'fullName', 'nationality', 'dateOfBirth', 'expiryDate'];
    for (const field of requiredFields) {
      const value = passport[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        result.valid = false;
        result.errors.push(`Missing required field: ${String(field)}`);
      }
    }

    // Check date validity
    if (passport.dateOfBirth) {
      const dob = new Date(passport.dateOfBirth);
      if (isNaN(dob.getTime())) {
        result.valid = false;
        result.errors.push('Invalid date of birth format');
      } else if (dob > new Date()) {
        result.valid = false;
        result.errors.push('Date of birth cannot be in the future');
      }
    }

    if (passport.expiryDate) {
      const expiry = new Date(passport.expiryDate);
      if (isNaN(expiry.getTime())) {
        result.valid = false;
        result.errors.push('Invalid expiry date format');
      }
    }

    if (passport.issueDate) {
      const issue = new Date(passport.issueDate);
      if (isNaN(issue.getTime())) {
        result.valid = false;
        result.errors.push('Invalid issue date format');
      }
    }

    // Check date logic (issue < expiry, issue > dob)
    if (passport.issueDate && passport.expiryDate) {
      const issue = new Date(passport.issueDate);
      const expiry = new Date(passport.expiryDate);
      if (issue >= expiry) {
        result.valid = false;
        result.errors.push('Issue date must be before expiry date');
      }
    }

    if (passport.dateOfBirth && passport.issueDate) {
      const dob = new Date(passport.dateOfBirth);
      const issue = new Date(passport.issueDate);
      if (issue <= dob) {
        result.valid = false;
        result.errors.push('Issue date must be after date of birth');
      }
    }

    // Check gender field
    const validGenders = ['Male', 'Female', 'Undefined'];
    if (passport.gender && !validGenders.includes(passport.gender)) {
      result.valid = false;
      result.errors.push(`Invalid gender value: ${passport.gender}`);
    }

    // Check userId
    if (!passport.userId) {
      result.valid = false;
      result.errors.push('Missing userId');
    }

    return result;
  }

  /**
   * Validate personal info data consistency
   *
   * @param {PersonalInfo} personalInfo - PersonalInfo instance
   * @returns {Object} - Validation result
   */
  static validatePersonalInfoData(personalInfo: PersonalInfoData): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [] };

    // Check userId
    if (!personalInfo.userId) {
      result.valid = false;
      result.errors.push('Missing userId');
    }

    // Check email format if provided
    if (personalInfo.email && personalInfo.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personalInfo.email)) {
        result.valid = false;
        result.errors.push('Invalid email format');
      }
    }

    // Check phone number format if provided (basic check)
    if (personalInfo.phoneNumber && personalInfo.phoneNumber.trim() !== '') {
      // Remove common formatting characters
      const cleanPhone = personalInfo.phoneNumber.replace(/[\s\-\(\)]/g, '');
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        result.valid = false;
        result.errors.push('Invalid phone number length');
      }
    }

    return result;
  }

  /**
   * Validate cross-field consistency
   * Checks consistency across different data types
   *
   * @param {Object} userData - All user data
   * @returns {Object} - Validation result
   */
  static validateCrossFieldConsistency(userData: UserData): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [] };

    // Check userId consistency
    const userIds = new Set<UserId>();
    if (userData.passport?.userId) {
      userIds.add(userData.passport.userId);
    }
    if (userData.personalInfo?.userId) {
      userIds.add(userData.personalInfo.userId);
    }

    if (userIds.size > 1) {
      result.valid = false;
      result.errors.push(`Inconsistent userId across data types: ${Array.from(userIds).join(', ')}`);
    }

    // Check nationality consistency (if personal info has country/region)
    if (userData.passport?.nationality && userData.personalInfo?.countryRegion) {
      if (userData.passport.nationality !== userData.personalInfo.countryRegion) {
        // This is a warning, not necessarily an error
        result.errors.push(`Nationality mismatch: passport=${userData.passport.nationality}, personalInfo=${userData.personalInfo.countryRegion}`);
      }
    }

    return result;
  }
}

export default DataValidationService;

