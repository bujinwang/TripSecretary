/**
 * USA Travel Info Screen Constants
 *
 * Centralized constants for USA travel form including predefined options,
 * validation rules, and static data used throughout the component.
 *
 * Based on official I-94 (Arrival/Departure Record) requirements
 */

/**
 * Predefined travel purpose options for USA entry
 * Based on US Customs and Border Protection (CBP) I-94 form
 */
export const PREDEFINED_TRAVEL_PURPOSES = [
  'TOURISM',        // Tourism/Pleasure (B-2 visa category)
  'BUSINESS',       // Business (B-1 visa category)
  'VISITING_RELATIVES',  // Visiting friends or relatives
  'TRANSIT',        // In transit to another country
  'OTHER',          // Other purposes
];

/**
 * Predefined accommodation type options for USA stay
 * Note: I-94 only requires address, but these help users organize their information
 */
export const PREDEFINED_ACCOMMODATION_TYPES = [
  'HOTEL',          // Hotel or serviced apartment
  'FRIEND_HOUSE',   // Staying with friends
  'RELATIVE_HOUSE', // Staying with family
  'RENTAL',         // Airbnb, vacation rental, etc.
  'OTHER',          // Other accommodation
];

/**
 * Gender/Sex options for passport information
 */
export const GENDER_OPTIONS = [
  { value: 'Female', translationKey: 'us.travelInfo.fields.gender.options.female', defaultLabel: 'Female / 女性' },
  { value: 'Male', translationKey: 'us.travelInfo.fields.gender.options.male', defaultLabel: 'Male / 男性' },
  { value: 'Undefined', translationKey: 'us.travelInfo.fields.gender.options.undefined', defaultLabel: 'Other / 其他' },
];

/**
 * Predefined occupation values (for validation)
 * Use this array to check if a value is a predefined option
 */
export const OCCUPATION_VALUES = [
  'SOFTWARE ENGINEER',
  'STUDENT',
  'TEACHER',
  'DOCTOR',
  'ACCOUNTANT',
  'SALES MANAGER',
  'RETIRED',
  'ENGINEER',
  'CIVIL SERVANT',
  'LAWYER',
  'NURSE',
  'FREELANCER',
  'BUSINESS OWNER',
  'HOMEMAKER',
  'DESIGNER',
  'OTHER',
];

/**
 * Get occupation options with internationalized labels
 * @param {Function} t - Translation function from i18n
 * @returns {Array} Occupation options with translated labels
 */
export const getOccupationOptions = (t) => [
  { value: 'SOFTWARE ENGINEER', label: t('us.occupations.SOFTWARE_ENGINEER'), icon: '💻' },
  { value: 'STUDENT', label: t('us.occupations.STUDENT'), icon: '📚' },
  { value: 'TEACHER', label: t('us.occupations.TEACHER'), icon: '👨‍🏫' },
  { value: 'DOCTOR', label: t('us.occupations.DOCTOR'), icon: '👨‍⚕️' },
  { value: 'ACCOUNTANT', label: t('us.occupations.ACCOUNTANT'), icon: '📊' },
  { value: 'SALES MANAGER', label: t('us.occupations.SALES_MANAGER'), icon: '📈' },
  { value: 'RETIRED', label: t('us.occupations.RETIRED'), icon: '🏖️' },
  { value: 'ENGINEER', label: t('us.occupations.ENGINEER'), icon: '⚙️' },
  { value: 'CIVIL SERVANT', label: t('us.occupations.CIVIL_SERVANT'), icon: '🏛️' },
  { value: 'LAWYER', label: t('us.occupations.LAWYER'), icon: '⚖️' },
  { value: 'NURSE', label: t('us.occupations.NURSE'), icon: '👩‍⚕️' },
  { value: 'FREELANCER', label: t('us.occupations.FREELANCER'), icon: '🎨' },
  { value: 'BUSINESS OWNER', label: t('us.occupations.BUSINESS_OWNER'), icon: '💼' },
  { value: 'HOMEMAKER', label: t('us.occupations.HOMEMAKER'), icon: '🏠' },
  { value: 'DESIGNER', label: t('us.occupations.DESIGNER'), icon: '✏️' },
  { value: 'OTHER', label: t('us.occupations.OTHER'), icon: '📝' },
];

/**
 * Storage keys for AsyncStorage
 */
export const STORAGE_KEYS = {
  SESSION_STATE: 'usa_session_state',
  EXPANDED_SECTION: 'usa_expanded_section',
  LAST_EDITED_FIELD: 'usa_last_edited_field',
  SCROLL_POSITION: 'usa_scroll_position',
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
  GENDER: 'gender',

  // Personal info fields
  OCCUPATION: 'occupation',
  CITY_OF_RESIDENCE: 'cityOfResidence',
  RESIDENT_COUNTRY: 'residentCountry',
  PHONE_CODE: 'phoneCode',
  PHONE_NUMBER: 'phoneNumber',
  EMAIL: 'email',

  // Travel info fields
  TRAVEL_PURPOSE: 'travelPurpose',
  CUSTOM_TRAVEL_PURPOSE: 'customTravelPurpose',
  ARRIVAL_DATE: 'arrivalDate',
  ARRIVAL_FLIGHT_NUMBER: 'arrivalFlightNumber',
  IS_TRANSIT_PASSENGER: 'isTransitPassenger',
  LENGTH_OF_STAY: 'lengthOfStay',

  // Accommodation fields (US uses simple address instead of province/district)
  ACCOMMODATION_ADDRESS: 'accommodationAddress',
  ACCOMMODATION_PHONE: 'accommodationPhone',
};

/**
 * Default values for form fields
 */
export const DEFAULT_VALUES = {
  PHONE_CODE: '+1',  // US country code
  NATIONALITY: 'China',
  LENGTH_OF_STAY: '7',  // 7 days default
};

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  PASSPORT_NO: {
    minLength: 6,
    maxLength: 20,
    pattern: /^[A-Z0-9]+$/i,
  },
  PHONE_NUMBER: {
    minLength: 7,
    maxLength: 15,
  },
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
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
 * USA-specific notes
 */
export const USA_NOTES = {
  I94_INFO: 'The I-94 form is typically completed digitally at the airport kiosk or online for visa waiver program travelers.',
  CBP_OFFICER: 'Be prepared to answer questions from the U.S. Customs and Border Protection (CBP) officer.',
  FUNDS_REQUIREMENT: 'There is no specific minimum fund requirement, but you should be able to support yourself during your stay.',
};

export default {
  PREDEFINED_TRAVEL_PURPOSES,
  PREDEFINED_ACCOMMODATION_TYPES,
  GENDER_OPTIONS,
  getOccupationOptions,
  STORAGE_KEYS,
  SECTIONS,
  FIELD_NAMES,
  DEFAULT_VALUES,
  VALIDATION_RULES,
  ANIMATION_CONFIG,
  USA_NOTES,
};
