/**
 * Thailand-Specific Validation Rules
 *
 * Defines validation rules for Thailand digital arrival card (TDAC) submission.
 * These rules extend the base validation engine with Thailand-specific requirements.
 *
 * @module destinations/thailand/validationRules
 */

import { PATTERNS } from '../../../utils/validation/ValidationRuleEngine';
import { findChinaProvince } from '../../../utils/validation/chinaProvinceValidator';

/**
 * Thailand-specific validation rules
 * Each rule can be:
 * - A function: (value, context) => { isValid, isWarning, errorMessage }
 * - A configuration object: { ruleType, ...options } to use default rule with custom config
 */
export const THAILAND_VALIDATION_RULES = {
  /**
   * Full name validation
   * TDAC requires English letters only, no Chinese characters
   */
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

  /**
   * Passport number validation
   */
  passportNo: {
    ruleType: 'alphanumeric',
    required: true,
    minLength: 6,
    maxLength: 12,
    pattern: PATTERNS.PASSPORT,
    patternMessage: 'Passport number must be 6-12 letters and numbers',
    fieldLabel: 'Passport number'
  },

  /**
   * Visa number validation (optional)
   */
  visaNumber: {
    ruleType: 'alphanumeric',
    required: false,
    minLength: 5,
    maxLength: 15,
    fieldLabel: 'Visa number'
  },

  /**
   * Date of birth validation
   */
  dob: {
    ruleType: 'date',
    required: true,
    beforeToday: true,
    beforeTodayMessage: 'Birth date must be in the past',
    minDate: '1900-01-01',
    fieldLabel: 'Birth date'
  },

  /**
   * Passport expiry date validation
   */
  expiryDate: {
    ruleType: 'date',
    required: true,
    afterToday: true,
    afterTodayMessage: 'Passport expiry date must be in the future',
    fieldLabel: 'Passport expiry date'
  },

  /**
   * Arrival date validation
   */
  arrivalArrivalDate: {
    ruleType: 'date',
    required: true,
    afterToday: true,
    afterTodayMessage: 'Arrival date must be tomorrow or later',
    fieldLabel: 'Arrival date'
  },

  /**
   * Departure date validation
   * Must be after arrival date (context-aware)
   */
  departureDepartureDate: (value, context) => {
    const { required = true, arrivalArrivalDate } = context;

    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: required,
        errorMessage: required ? 'Departure date is required' : ''
      };
    }

    if (!PATTERNS.DATE_ISO.test(value)) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Date must be in YYYY-MM-DD format'
      };
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Please enter a valid date'
      };
    }

    // Check against arrival date
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

  /**
   * Email validation
   */
  email: {
    ruleType: 'email',
    required: true,
    fieldLabel: 'Email address'
  },

  /**
   * Phone number validation
   */
  phoneNumber: {
    ruleType: 'phoneNumber',
    required: true,
    minLength: 7,
    maxLength: 15,
    fieldLabel: 'Phone number'
  },

  /**
   * Phone country code validation
   */
  phoneCode: {
    ruleType: 'phoneCode',
    required: true,
    fieldLabel: 'Country code'
  },

  /**
   * Occupation validation
   */
  occupation: {
    ruleType: 'text',
    required: true,
    minLength: 2,
    pattern: PATTERNS.ALPHA_SPACE_DASH,
    patternMessage: 'Please use English letters only',
    fieldLabel: 'Occupation'
  },

  /**
   * City of residence validation
   * Special handling for China - requires province name
   */
  cityOfResidence: (value, context) => {
    const { required = true, residentCountry } = context;

    if (!value || !value.trim()) {
      const label = residentCountry === 'CHN' ? 'Province' : 'Province or city';
      return {
        isValid: true,
        isWarning: required,
        errorMessage: required ? `${label} is required` : ''
      };
    }

    const trimmed = value.trim();

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

    // Special validation for China - must be a valid province
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

  /**
   * Recent stay country validation
   */
  recentStayCountry: {
    ruleType: 'countryCode',
    required: true,
    fieldLabel: '过去14天停留国家或地区'
  },

  /**
   * Arrival flight number validation
   */
  arrivalFlightNumber: {
    ruleType: 'flightNumber',
    required: true,
    fieldLabel: 'Arrival flight number'
  },

  /**
   * Departure flight number validation
   */
  departureFlightNumber: {
    ruleType: 'flightNumber',
    required: true,
    fieldLabel: 'Departure flight number'
  },

  /**
   * Custom travel purpose (when purpose is 'OTHER')
   * Context-aware: only required if travelPurpose is 'OTHER'
   */
  customTravelPurpose: (value, context) => {
    const { travelPurpose } = context;

    // Only validate if purpose is OTHER
    if (travelPurpose !== 'OTHER') {
      return { isValid: true, isWarning: false, errorMessage: '' };
    }

    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: true,
        errorMessage: 'Please specify your travel purpose'
      };
    }

    const trimmed = value.trim();

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

  /**
   * Custom accommodation type (when type is 'OTHER')
   * Context-aware: only required if accommodationType is 'OTHER'
   */
  customAccommodationType: (value, context) => {
    const { accommodationType } = context;

    // Only validate if type is OTHER
    if (accommodationType !== 'OTHER') {
      return { isValid: true, isWarning: false, errorMessage: '' };
    }

    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: true,
        errorMessage: 'Please specify your accommodation type'
      };
    }

    const trimmed = value.trim();

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

  /**
   * Hotel address validation
   * Context-aware: not required for transit passengers
   */
  hotelAddress: (value, context) => {
    const { isTransitPassenger } = context;

    // Not required for transit passengers
    if (isTransitPassenger) {
      return { isValid: true, isWarning: false, errorMessage: '' };
    }

    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: true,
        errorMessage: 'Address is required'
      };
    }

    if (value.trim().length < 10) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Address must be at least 10 characters long'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  /**
   * District validation
   * Context-aware: required for non-HOTEL accommodation (except transit passengers)
   */
  district: (value, context) => {
    const { isTransitPassenger, accommodationType } = context;

    // Not required for transit passengers or HOTEL
    if (isTransitPassenger || accommodationType === 'HOTEL') {
      return { isValid: true, isWarning: false, errorMessage: '' };
    }

    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: true,
        errorMessage: 'District is required'
      };
    }

    if (!PATTERNS.ALPHA_SPACE_DASH.test(value.trim())) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Please use English letters only'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  /**
   * Sub-district validation
   * Context-aware: required for non-HOTEL accommodation (except transit passengers)
   */
  subDistrict: (value, context) => {
    const { isTransitPassenger, accommodationType } = context;

    // Not required for transit passengers or HOTEL
    if (isTransitPassenger || accommodationType === 'HOTEL') {
      return { isValid: true, isWarning: false, errorMessage: '' };
    }

    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: true,
        errorMessage: 'Sub-district is required'
      };
    }

    if (!PATTERNS.ALPHA_SPACE_DASH.test(value.trim())) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Please use English letters only'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  /**
   * Postal code validation
   * Context-aware: required for non-HOTEL accommodation (except transit passengers)
   * Thailand postal codes are 5 digits
   */
  postalCode: (value, context) => {
    const { isTransitPassenger, accommodationType } = context;

    // Not required for transit passengers or HOTEL
    if (isTransitPassenger || accommodationType === 'HOTEL') {
      return { isValid: true, isWarning: false, errorMessage: '' };
    }

    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: true,
        errorMessage: 'Postal code is required'
      };
    }

    if (!PATTERNS.POSTAL_CODE_5DIGIT.test(value.trim())) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Postal code must be 5 digits'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  }
};

/**
 * Default export
 */
export default THAILAND_VALIDATION_RULES;
