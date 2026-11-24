/**
 * Hong Kong Travel Info Screen Constants
 *
 * Centralized constants for Hong Kong travel form including predefined options,
 * validation rules, and static data used throughout the component.
 */

/**
 * Predefined travel purpose options for Hong Kong entry
 * Based on Hong Kong Immigration Department Form ID 1003A categories
 * Note: As of Oct 2024, HK eliminated arrival cards, but these categories
 * still apply for visa applications and immigration interviews
 */
export const PREDEFINED_TRAVEL_PURPOSES = [
  'TOURISM',        // Leisure Visit - sightseeing, vacation
  'BUSINESS',       // Business Visit - meetings, presentations, contracts
  'VISIT_FAMILY',   // Family Visit - visiting relatives in HK
  'TRANSIT',        // Transit - passing through to another destination
  'OTHER',          // Other purposes not covered above
];

/**
 * Predefined accommodation type options for Hong Kong stay
 * Simplified to match HK immigration typical requirements
 */
export const PREDEFINED_ACCOMMODATION_TYPES = [
  'HOTEL',              // Hotel or serviced apartment
  'GUESTHOUSE',         // Guesthouse, hostel, or budget accommodation
  'FRIEND_HOUSE',       // Staying with friends
  'RELATIVE_HOUSE',     // Staying with family/relatives
  'OTHER',              // Other accommodation arrangements
];

/**
 * Gender/Sex options for passport information
 */
export const GENDER_OPTIONS = [
  { value: 'Female', translationKey: 'hongkong.travelInfo.fields.sex.options.female', defaultLabel: '女性' },
  { value: 'Male', translationKey: 'hongkong.travelInfo.fields.sex.options.male', defaultLabel: '男性' },
  { value: 'Undefined', translationKey: 'hongkong.travelInfo.fields.sex.options.undefined', defaultLabel: '未定义' },
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
  'FINANCE PROFESSIONAL',
  'OTHER',
];

/**
 * Get occupation options with internationalized labels
 * @param {Function} t - Translation function from i18n
 * @returns {Array} Occupation options with translated labels
 */
export const getOccupationOptions = (t) => [
  { value: 'SOFTWARE ENGINEER', label: t('hk.occupations.SOFTWARE_ENGINEER'), icon: '💻' },
  { value: 'STUDENT', label: t('hk.occupations.STUDENT'), icon: '📚' },
  { value: 'TEACHER', label: t('hk.occupations.TEACHER'), icon: '👨‍🏫' },
  { value: 'DOCTOR', label: t('hk.occupations.DOCTOR'), icon: '👨‍⚕️' },
  { value: 'ACCOUNTANT', label: t('hk.occupations.ACCOUNTANT'), icon: '📊' },
  { value: 'SALES MANAGER', label: t('hk.occupations.SALES_MANAGER'), icon: '📈' },
  { value: 'RETIRED', label: t('hk.occupations.RETIRED'), icon: '🏖️' },
  { value: 'ENGINEER', label: t('hk.occupations.ENGINEER'), icon: '⚙️' },
  { value: 'CIVIL SERVANT', label: t('hk.occupations.CIVIL_SERVANT'), icon: '🏛️' },
  { value: 'LAWYER', label: t('hk.occupations.LAWYER'), icon: '⚖️' },
  { value: 'NURSE', label: t('hk.occupations.NURSE'), icon: '👩‍⚕️' },
  { value: 'FREELANCER', label: t('hk.occupations.FREELANCER'), icon: '🎨' },
  { value: 'BUSINESS OWNER', label: t('hk.occupations.BUSINESS_OWNER'), icon: '💼' },
  { value: 'HOMEMAKER', label: t('hk.occupations.HOMEMAKER'), icon: '🏠' },
  { value: 'DESIGNER', label: t('hk.occupations.DESIGNER'), icon: '✏️' },
  { value: 'FINANCE PROFESSIONAL', label: t('hk.occupations.FINANCE_PROFESSIONAL'), icon: '💰' },
  { value: 'OTHER', label: t('hk.occupations.OTHER'), icon: '📝' },
];

/**
 * Storage keys for AsyncStorage
 */
export const STORAGE_KEYS = {
  SESSION_STATE: 'hongkong_session_state',
  EXPANDED_SECTION: 'hongkong_expanded_section',
  LAST_EDITED_FIELD: 'hongkong_last_edited_field',
  SCROLL_POSITION: 'hongkong_scroll_position',
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
  SURNAME: 'surname',
  MIDDLE_NAME: 'middleName',
  GIVEN_NAME: 'givenName',
  NATIONALITY: 'nationality',
  DOB: 'dob',
  EXPIRY_DATE: 'expiryDate',
  SEX: 'sex',

  // Personal info fields
  OCCUPATION: 'occupation',
  CITY_OF_RESIDENCE: 'cityOfResidence',
  RESIDENT_COUNTRY: 'residentCountry',
  PHONE_NUMBER: 'phoneNumber',
  EMAIL: 'email',

  // Travel info fields
  TRAVEL_PURPOSE: 'travelPurpose',
  CUSTOM_TRAVEL_PURPOSE: 'customTravelPurpose',
  ARRIVAL_DATE: 'arrivalArrivalDate',
  DEPARTURE_DATE: 'departureDepartureDate',
  ARRIVAL_FLIGHT_NUMBER: 'arrivalFlightNumber',
  DEPARTURE_FLIGHT_NUMBER: 'departureFlightNumber',
  RECENT_STAY_COUNTRY: 'recentStayCountry',
  BOARDING_COUNTRY: 'boardingCountry',

  // Accommodation fields
  ACCOMMODATION_TYPE: 'accommodationType',
  CUSTOM_ACCOMMODATION_TYPE: 'customAccommodationType',
  HOTEL_ADDRESS: 'hotelAddress',
  PROVINCE: 'province',
  DISTRICT: 'district',
  SUB_DISTRICT: 'subDistrict',
  POSTAL_CODE: 'postalCode',
  IS_TRANSIT_PASSENGER: 'isTransitPassenger',
};

/**
 * Default values for form fields
 */
export const DEFAULT_VALUES = {
  PHONE_CODE: '+86',
  NATIONALITY: 'China',
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

export default {
  PREDEFINED_TRAVEL_PURPOSES,
  PREDEFINED_ACCOMMODATION_TYPES,
  GENDER_OPTIONS,
  getOccupationOptions,
  STORAGE_KEYS,
  SECTIONS,
  FIELD_NAMES,
  DEFAULT_VALUES,
  ANIMATION_CONFIG,
};
