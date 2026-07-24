/**
 * Thailand-Specific Validation Rules
 *
 * Defines validation rules for Thailand digital arrival card (TDAC) submission.
 */

import { PATTERNS } from '../../../utils/validation/ValidationRuleEngine';
import { findChinaProvince } from '../../../utils/validation/chinaProvinceValidator';

interface ValidationResult {
  isValid: boolean;
  isWarning: boolean;
  errorMessage: string;
}

interface ValidationContext {
  required?: boolean;
  arrivalArrivalDate?: string;
  residentCountry?: string;
  travelPurpose?: string;
  accommodationType?: string;
  isTransitPassenger?: boolean;
  [key: string]: unknown;
}

type ValidationRule = (value: unknown, context: ValidationContext) => ValidationResult;

export const THAILAND_VALIDATION_RULES: Record<string, ValidationRule | { ruleType: string; [key: string]: unknown }> = {
  fullName: {
    ruleType: 'text',
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: PATTERNS.ALPHA_SPACE_COMMA,
    patternMessage: 'Name should contain only letters, spaces, commas, periods, and hyphens',
    allowChinese: false,
    fieldLabel: 'Full name'
  },

  passportNo: {
    ruleType: 'alphanumeric',
    required: true,
    minLength: 6,
    maxLength: 12,
    pattern: PATTERNS.PASSPORT,
    patternMessage: 'Passport number must be 6-12 letters and numbers',
    fieldLabel: 'Passport number'
  },

  visaNumber: {
    ruleType: 'alphanumeric',
    required: false,
    minLength: 5,
    maxLength: 15,
    fieldLabel: 'Visa number'
  },

  dob: {
    ruleType: 'date',
    required: true,
    beforeToday: true,
    beforeTodayMessage: 'Birth date must be in the past',
    minDate: '1900-01-01',
    fieldLabel: 'Birth date'
  },

  expiryDate: {
    ruleType: 'date',
    required: true,
    afterToday: true,
    afterTodayMessage: 'Passport expiry date must be in the future',
    fieldLabel: 'Passport expiry date'
  },

  arrivalArrivalDate: {
    ruleType: 'date',
    required: true,
    afterToday: true,
    afterTodayMessage: 'Arrival date must be tomorrow or later',
    fieldLabel: 'Arrival date'
  },

  departureDepartureDate: (value: unknown, context: ValidationContext): ValidationResult => {
    const { required = true, arrivalArrivalDate } = context;

    if (!value || !(value as string).trim()) {
      return {
        isValid: true,
        isWarning: required,
        errorMessage: required ? 'Departure date is required' : ''
      };
    }

    if (!PATTERNS.DATE_ISO.test(value as string)) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Date must be in YYYY-MM-DD format'
      };
    }

    const date = new Date(value as string);
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Please enter a valid date'
      };
    }

    if (arrivalArrivalDate) {
      const arrivalDate = new Date(arrivalArrivalDate);
      if (date <= arrivalDate) {
        return {
          isValid: false,
          isWarning: false,
          errorMessage: 'Departure date must be after arrival date'
        };
      }
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  email: {
    ruleType: 'email',
    required: true,
    fieldLabel: 'Email address'
  },

  phoneNumber: {
    ruleType: 'phoneNumber',
    required: true,
    minLength: 7,
    maxLength: 15,
    fieldLabel: 'Phone number'
  },

  phoneCode: {
    ruleType: 'phoneCode',
    required: true,
    fieldLabel: 'Country code'
  },

  occupation: {
    ruleType: 'text',
    required: true,
    minLength: 2,
    pattern: PATTERNS.ALPHA_SPACE_DASH,
    patternMessage: 'Please use English letters only',
    fieldLabel: 'Occupation'
  },

  cityOfResidence: (value: unknown, context: ValidationContext): ValidationResult => {
    const { required = true, residentCountry } = context;

    if (!value || !(value as string).trim()) {
      const label = residentCountry === 'CHN' ? 'Province' : 'Province or city';
      return {
        isValid: true,
        isWarning: required,
        errorMessage: required ? `${label} is required` : ''
      };
    }

    const trimmed = (value as string).trim();

    if (!PATTERNS.ALPHA_SPACE_DASH.test(trimmed)) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Please use English letters only'
      };
    }

    if (trimmed.length < 2) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Must be at least 2 characters long'
      };
    }

    if (residentCountry === 'CHN') {
      const provinceMatch = findChinaProvince(trimmed);
      if (!provinceMatch) {
        return {
          isValid: false,
          isWarning: false,
          errorMessage: 'For China, please enter a province name (e.g., Anhui, Guangdong)'
        };
      }
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  recentStayCountry: {
    ruleType: 'countryCode',
    required: true,
    fieldLabel: '过去14天停留国家或地区'
  },

  arrivalFlightNumber: {
    ruleType: 'flightNumber',
    required: true,
    fieldLabel: 'Arrival flight number'
  },

  departureFlightNumber: {
    ruleType: 'flightNumber',
    required: true,
    fieldLabel: 'Departure flight number'
  },

  customTravelPurpose: (value: unknown, context: ValidationContext): ValidationResult => {
    const { travelPurpose } = context;

    if (travelPurpose !== 'OTHER') {
      return { isValid: true, isWarning: false, errorMessage: '' };
    }

    if (!value || !(value as string).trim()) {
      return {
        isValid: true,
        isWarning: true,
        errorMessage: 'Please specify your travel purpose'
      };
    }

    const trimmed = (value as string).trim();

    if (!PATTERNS.ALPHA_SPACE_DASH.test(trimmed)) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Please use English letters only'
      };
    }

    if (trimmed.length < 3) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Travel purpose must be at least 3 characters'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  customAccommodationType: (value: unknown, context: ValidationContext): ValidationResult => {
    const { accommodationType } = context;

    if (accommodationType !== 'OTHER') {
      return { isValid: true, isWarning: false, errorMessage: '' };
    }

    if (!value || !(value as string).trim()) {
      return {
        isValid: true,
        isWarning: true,
        errorMessage: 'Please specify your accommodation type'
      };
    }

    const trimmed = (value as string).trim();

    if (!PATTERNS.ALPHA_SPACE_DASH.test(trimmed)) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Please use English letters only'
      };
    }

    if (trimmed.length < 3) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Accommodation type must be at least 3 characters'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  hotelAddress: (value: unknown, context: ValidationContext): ValidationResult => {
    const { isTransitPassenger } = context;

    if (isTransitPassenger) {
      return { isValid: true, isWarning: false, errorMessage: '' };
    }

    if (!value || !(value as string).trim()) {
      return {
        isValid: true,
        isWarning: true,
        errorMessage: 'Address is required'
      };
    }

    if ((value as string).trim().length < 10) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Address must be at least 10 characters long'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  district: (value: unknown, context: ValidationContext): ValidationResult => {
    const { isTransitPassenger, accommodationType } = context;

    if (isTransitPassenger || accommodationType === 'HOTEL') {
      return { isValid: true, isWarning: false, errorMessage: '' };
    }

    if (!value || !(value as string).trim()) {
      return {
        isValid: true,
        isWarning: true,
        errorMessage: 'District is required'
      };
    }

    if (!PATTERNS.ALPHA_SPACE_DASH.test((value as string).trim())) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Please use English letters only'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  subDistrict: (value: unknown, context: ValidationContext): ValidationResult => {
    const { isTransitPassenger, accommodationType } = context;

    if (isTransitPassenger || accommodationType === 'HOTEL') {
      return { isValid: true, isWarning: false, errorMessage: '' };
    }

    if (!value || !(value as string).trim()) {
      return {
        isValid: true,
        isWarning: true,
        errorMessage: 'Sub-district is required'
      };
    }

    if (!PATTERNS.ALPHA_SPACE_DASH.test((value as string).trim())) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Please use English letters only'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  postalCode: (value: unknown, context: ValidationContext): ValidationResult => {
    const { isTransitPassenger, accommodationType } = context;

    if (isTransitPassenger || accommodationType === 'HOTEL') {
      return { isValid: true, isWarning: false, errorMessage: '' };
    }

    if (!value || !(value as string).trim()) {
      return {
        isValid: true,
        isWarning: true,
        errorMessage: 'Postal code is required'
      };
    }

    if (!PATTERNS.POSTAL_CODE_5DIGIT.test((value as string).trim())) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Postal code must be 5 digits'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  }
};

export default THAILAND_VALIDATION_RULES;
