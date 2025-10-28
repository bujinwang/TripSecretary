/**
 * Thailand Travel Info Screen Constants
 *
 * Centralized constants for Thailand travel form including predefined options,
 * validation rules, and static data used throughout the component.
 */

/**
 * Get travel purpose options with internationalized labels
 * @param {Function} t - Translation function from i18n
 * @returns {Array} Travel purpose options with translated labels
 */
export const getTravelPurposeOptions = (t) => [
  { value: 'HOLIDAY', label: t('thailand.travelPurposes.HOLIDAY') },
  { value: 'MEETING', label: t('thailand.travelPurposes.MEETING') },
  { value: 'SPORTS', label: t('thailand.travelPurposes.SPORTS') },
  { value: 'BUSINESS', label: t('thailand.travelPurposes.BUSINESS') },
  { value: 'INCENTIVE', label: t('thailand.travelPurposes.INCENTIVE') },
  { value: 'CONVENTION', label: t('thailand.travelPurposes.CONVENTION') },
  { value: 'EDUCATION', label: t('thailand.travelPurposes.EDUCATION') },
  { value: 'EMPLOYMENT', label: t('thailand.travelPurposes.EMPLOYMENT') },
  { value: 'EXHIBITION', label: t('thailand.travelPurposes.EXHIBITION') },
  { value: 'MEDICAL', label: t('thailand.travelPurposes.MEDICAL') },
];

/**
 * Predefined travel purpose options for Thailand entry
 * @deprecated Use getTravelPurposeOptions(t) for i18n support
 */
export const PREDEFINED_TRAVEL_PURPOSES = [
  'HOLIDAY',
  'MEETING',
  'SPORTS',
  'BUSINESS',
  'INCENTIVE',
  'CONVENTION',
  'EDUCATION',
  'EMPLOYMENT',
  'EXHIBITION',
  'MEDICAL',
];

/**
 * Get accommodation type options with internationalized labels
 * @param {Function} t - Translation function from i18n
 * @returns {Array} Accommodation options with translated labels
 * @note These match the UI values from AccommodationSubSection
 * They are transformed to TDAC API values by ThailandTravelerContextBuilder
 */
export const getAccommodationTypeOptions = (t) => [
  { value: 'HOTEL', label: t('thailand.accommodationTypes.HOTEL') },
  { value: 'HOSTEL', label: t('thailand.accommodationTypes.HOSTEL') },      // Maps to YOUTH_HOSTEL in TDAC
  { value: 'GUESTHOUSE', label: t('thailand.accommodationTypes.GUESTHOUSE') },  // Maps to GUEST_HOUSE in TDAC
  { value: 'RESORT', label: t('thailand.accommodationTypes.RESORT') },      // Maps to HOTEL in TDAC (no resort option in TDAC)
  { value: 'APARTMENT', label: t('thailand.accommodationTypes.APARTMENT') },
  { value: 'FRIEND', label: t('thailand.accommodationTypes.FRIEND') },      // Maps to FRIEND_HOUSE in TDAC
];

/**
 * Predefined accommodation type options for Thailand stay
 * These match the UI values from AccommodationSubSection
 * They are transformed to TDAC API values by ThailandTravelerContextBuilder
 * @deprecated Use getAccommodationTypeOptions(t) for i18n support
 */
export const PREDEFINED_ACCOMMODATION_TYPES = [
  'HOTEL',
  'HOSTEL',      // Maps to YOUTH_HOSTEL in TDAC
  'GUESTHOUSE',  // Maps to GUEST_HOUSE in TDAC
  'RESORT',      // Maps to HOTEL in TDAC (no resort option in TDAC)
  'APARTMENT',
  'FRIEND',      // Maps to FRIEND_HOUSE in TDAC
];

/**
 * Gender/Sex options for passport information
 */
export const GENDER_OPTIONS = [
  { value: 'Female', translationKey: 'thailand.travelInfo.fields.sex.options.female', defaultLabel: '女性' },
  { value: 'Male', translationKey: 'thailand.travelInfo.fields.sex.options.male', defaultLabel: '男性' },
  { value: 'Undefined', translationKey: 'thailand.travelInfo.fields.sex.options.undefined', defaultLabel: '未定义' },
];

/**
 * Get occupation options with internationalized labels
 * @param {Function} t - Translation function from i18n
 * @returns {Array} Occupation options with translated labels
 */
export const getOccupationOptions = (t) => [
  { value: 'SOFTWARE ENGINEER', label: t('thailand.occupations.SOFTWARE_ENGINEER'), icon: '💻' },
  { value: 'STUDENT', label: t('thailand.occupations.STUDENT'), icon: '📚' },
  { value: 'TEACHER', label: t('thailand.occupations.TEACHER'), icon: '👨‍🏫' },
  { value: 'DOCTOR', label: t('thailand.occupations.DOCTOR'), icon: '👨‍⚕️' },
  { value: 'ACCOUNTANT', label: t('thailand.occupations.ACCOUNTANT'), icon: '📊' },
  { value: 'SALES MANAGER', label: t('thailand.occupations.SALES_MANAGER'), icon: '📈' },
  { value: 'RETIRED', label: t('thailand.occupations.RETIRED'), icon: '🏖️' },
  { value: 'ENGINEER', label: t('thailand.occupations.ENGINEER'), icon: '⚙️' },
  { value: 'CIVIL SERVANT', label: t('thailand.occupations.CIVIL_SERVANT'), icon: '🏛️' },
  { value: 'LAWYER', label: t('thailand.occupations.LAWYER'), icon: '⚖️' },
  { value: 'NURSE', label: t('thailand.occupations.NURSE'), icon: '👩‍⚕️' },
  { value: 'FREELANCER', label: t('thailand.occupations.FREELANCER'), icon: '🎨' },
  { value: 'BUSINESS OWNER', label: t('thailand.occupations.BUSINESS_OWNER'), icon: '💼' },
  { value: 'HOMEMAKER', label: t('thailand.occupations.HOMEMAKER'), icon: '🏠' },
  { value: 'DESIGNER', label: t('thailand.occupations.DESIGNER'), icon: '✏️' },
  { value: 'OTHER', label: t('thailand.occupations.OTHER'), icon: '📝' },
];

/**
 * Legacy export for backward compatibility
 * @deprecated Use getOccupationOptions(t) instead
 */
export const OCCUPATION_OPTIONS = [
  { value: 'SOFTWARE ENGINEER', label: '软件工程师', icon: '💻' },
  { value: 'STUDENT', label: '学生', icon: '📚' },
  { value: 'TEACHER', label: '教师', icon: '👨‍🏫' },
  { value: 'DOCTOR', label: '医生', icon: '👨‍⚕️' },
  { value: 'ACCOUNTANT', label: '会计师', icon: '📊' },
  { value: 'SALES MANAGER', label: '销售经理', icon: '📈' },
  { value: 'RETIRED', label: '退休人员', icon: '🏖️' },
  { value: 'ENGINEER', label: '工程师', icon: '⚙️' },
  { value: 'CIVIL SERVANT', label: '公务员', icon: '🏛️' },
  { value: 'LAWYER', label: '律师', icon: '⚖️' },
  { value: 'NURSE', label: '护士', icon: '👩‍⚕️' },
  { value: 'FREELANCER', label: '自由职业者', icon: '🎨' },
  { value: 'BUSINESS OWNER', label: '企业主', icon: '💼' },
  { value: 'HOMEMAKER', label: '家庭主妇', icon: '🏠' },
  { value: 'DESIGNER', label: '设计师', icon: '✏️' },
  { value: 'OTHER', label: '其他', icon: '📝' },
];

/**
 * Storage keys for AsyncStorage
 */
export const STORAGE_KEYS = {
  SESSION_STATE: 'thailand_session_state',
  EXPANDED_SECTION: 'thailand_expanded_section',
  LAST_EDITED_FIELD: 'thailand_last_edited_field',
  SCROLL_POSITION: 'thailand_scroll_position',
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

/**
 * Timeout values in milliseconds
 */
export const TIMEOUTS = {
  CLOUDFLARE_DETECTION: 1000, // Time to wait for Cloudflare checkbox to appear
  CLOUDFLARE_POLLING_INTERVAL: 500, // Interval for checking Cloudflare token
  CLOUDFLARE_MAX_WAIT: 30000, // Maximum time to wait for Cloudflare
  SUBMISSION_WINDOW: 5 * 60 * 1000, // 5 minutes submission window
  DEBOUNCE_DELAY: 300, // Debounce delay for form inputs
  RETRY_DELAY_BASE: 2000, // Base delay for exponential backoff retry
};

/**
 * Supported languages for TDAC submission
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'ko', label: 'Korean', native: '한국어' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
];

/**
 * Travel mode identifiers for TDAC API
 */
export const TRAVEL_MODES = {
  AIR: { id: '1', name: 'Air', label: '飞机' },
  SEA: { id: '2', name: 'Sea', label: '船舶' },
  LAND: { id: '3', name: 'Land', label: '陆路' },
  TRAIN: { id: '4', name: 'Train', label: '火车' },
};

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 2000, // 2 seconds
  MAX_DELAY: 16000, // 16 seconds
  EXPONENTIAL_BASE: 2, // For exponential backoff: 2s, 4s, 8s, 16s
};

/**
 * Validation rules
 */
export const VALIDATION = {
  PASSPORT_NO_MIN_LENGTH: 6,
  PASSPORT_NO_MAX_LENGTH: 20,
  PHONE_NUMBER_MIN_LENGTH: 8,
  PHONE_NUMBER_MAX_LENGTH: 15,
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 50,
};

/**
 * TDAC submission stages
 */
export const TDAC_STAGES = {
  LOADING: 'loading',
  EXTRACTING: 'extracting',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * QR code configuration
 */
export const QR_CODE = {
  SIZE: 300, // QR code size in pixels
  ERROR_CORRECTION_LEVEL: 'M', // Error correction level (L, M, Q, H)
  MARGIN: 4, // Quiet zone margin
};

export default {
  PREDEFINED_TRAVEL_PURPOSES,
  PREDEFINED_ACCOMMODATION_TYPES,
  GENDER_OPTIONS,
  OCCUPATION_OPTIONS,
  STORAGE_KEYS,
  SECTIONS,
  FIELD_NAMES,
  DEFAULT_VALUES,
  ANIMATION_CONFIG,
  TIMEOUTS,
  SUPPORTED_LANGUAGES,
  TRAVEL_MODES,
  RETRY_CONFIG,
  VALIDATION,
  TDAC_STAGES,
  QR_CODE,
};
