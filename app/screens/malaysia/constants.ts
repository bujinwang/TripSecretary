/**
 * Malaysia Travel Info Screen Constants
 *
 * Centralized constants for Malaysia travel form including predefined options,
 * validation rules, and static data used throughout the component.
 *
 * Based on Malaysia Digital Arrival Card (MDAC) requirements
 */

/**
 * Predefined travel purpose options for Malaysia entry
 * Based on official MDAC form categories
 */
export const PREDEFINED_TRAVEL_PURPOSES = [
  'TOURISM',           // Leisure/Holiday visit
  'BUSINESS',          // Business meetings, conferences
  'VISIT_FAMILY',      // Visiting family or friends
  'TRANSIT',           // Transit through Malaysia
  'EDUCATION',         // Educational purposes, attending courses
  'EMPLOYMENT',        // Work-related travel
  'MEDICAL',           // Medical treatment
  'OTHER',             // Other purposes
];

/**
 * Predefined accommodation type options for Malaysia stay
 * Common accommodation types in Malaysia
 */
export const PREDEFINED_ACCOMMODATION_TYPES = [
  'HOTEL',             // Hotel or serviced apartment
  'GUESTHOUSE',        // Guesthouse, hostel, budget accommodation
  'FRIEND_HOUSE',      // Staying with friends
  'RELATIVE_HOUSE',    // Staying with family
  'APARTMENT',         // Rented apartment
  'OTHER',             // Other accommodation
];

/**
 * Gender/Sex options for passport information
 */
export const GENDER_OPTIONS = [
  { value: 'Female', labelEn: 'Female', labelMs: 'Perempuan' },
  { value: 'Male', labelEn: 'Male', labelMs: 'Lelaki' },
  { value: 'Undefined', labelEn: 'Not Specified', labelMs: 'Tidak Dinyatakan' },
];

/**
 * Storage keys for AsyncStorage
 */
export const STORAGE_KEYS = {
  SESSION_STATE: 'malaysia_session_state',
  EXPANDED_SECTION: 'malaysia_expanded_section',
  LAST_EDITED_FIELD: 'malaysia_last_edited_field',
  SCROLL_POSITION: 'malaysia_scroll_position',
};

/**
 * Section identifiers for collapsible sections
 */
export const SECTIONS = {
  PASSPORT: 'passport',
  PERSONAL_INFO: 'personal',
  FUNDS: 'funds',
  TRAVEL: 'travel',
};

/**
 * Field names for form validation and tracking
 */
export const FIELD_NAMES = {
  // Passport fields
  PASSPORT_NO: 'passportNo',
  FULL_NAME: 'fullName',
  NATIONALITY: 'nationality',
  DOB: 'dob',
  EXPIRY_DATE: 'expiryDate',
  SEX: 'sex',

  // Personal info fields
  OCCUPATION: 'occupation',
  RESIDENT_COUNTRY: 'residentCountry',
  PHONE_CODE: 'phoneCode',
  PHONE_NUMBER: 'phoneNumber',
  EMAIL: 'email',

  // Travel info fields
  ARRIVAL_FLIGHT_NUMBER: 'arrivalFlightNumber',
  ARRIVAL_DATE: 'arrivalDate',
  HOTEL_ADDRESS: 'hotelAddress',
  STAY_DURATION: 'stayDuration',
};

/**
 * Default values for form fields
 */
export const DEFAULT_VALUES = {
  PHONE_CODE: '+60',  // Malaysia country code
  NATIONALITY: 'Malaysia',
};

/**
 * Animation configuration
 */
export const ANIMATION_CONFIG = {
  LAYOUT_SPRING: {
    duration: 300,
    create: {
      type: 'spring',
      property: 'opacity',
      springDamping: 0.7,
    },
    update: {
      type: 'spring',
      springDamping: 0.7,
    },
  },
};

/**
 * Malaysia-specific fund requirements
 * Minimum: ~MYR 350 per day (~$100 USD or ~500 THB per day)
 */
export const FUND_REQUIREMENTS = {
  MINIMUM_PER_DAY_MYR: 350,
  MINIMUM_PER_DAY_USD: 100,
  MINIMUM_PER_DAY_THB: 500,
  CURRENCY_CODE: 'MYR',
  CURRENCY_NAME_EN: 'Malaysian Ringgit',
  CURRENCY_NAME_MS: 'Ringgit Malaysia',
};

export default {
  PREDEFINED_TRAVEL_PURPOSES,
  PREDEFINED_ACCOMMODATION_TYPES,
  GENDER_OPTIONS,
  STORAGE_KEYS,
  SECTIONS,
  FIELD_NAMES,
  DEFAULT_VALUES,
  ANIMATION_CONFIG,
  FUND_REQUIREMENTS,
};
