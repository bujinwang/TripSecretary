/**
 * Japan Travel Info Screen Constants
 *
 * Centralized constants for Japan travel form including predefined options,
 * validation rules, and static data used throughout the component.
 */

/**
 * Predefined travel purpose options for Japan entry
 * Based on simplified 5-option approach for Japanese immigration
 */
export const PREDEFINED_TRAVEL_PURPOSES = [
  'TOURISM',
  'BUSINESS',
  'VISITING_RELATIVES',
  'TRANSIT',
  'OTHER',
];

/**
 * Travel purpose options with labels (Japanese/English) and icons for UI display
 */
export const TRAVEL_PURPOSE_OPTIONS = [
  { value: 'TOURISM', label: '観光 / Tourism', icon: '🏖️' },
  { value: 'BUSINESS', label: 'ビジネス / Business', icon: '💼' },
  { value: 'VISITING_RELATIVES', label: '親族訪問 / Visiting Relatives', icon: '👨‍👩‍👧‍👦' },
  { value: 'TRANSIT', label: 'トランジット / Transit', icon: '✈️' },
  { value: 'OTHER', label: 'その他 / Other', icon: '✏️' },
];

/**
 * Predefined accommodation type options for Japan stay
 * Based on Japanese immigration form requirements
 */
export const PREDEFINED_ACCOMMODATION_TYPES = [
  'HOTEL',
  'GUESTHOUSE',
  'FRIEND_HOUSE',
  'RELATIVE_HOUSE',
  'OTHER',
];

/**
 * Accommodation type options with labels (Japanese/English) and icons for UI display
 */
export const ACCOMMODATION_TYPE_OPTIONS = [
  { value: 'HOTEL', label: 'ホテル / Hotel', icon: '🏨' },
  { value: 'GUESTHOUSE', label: 'ゲストハウス / Guesthouse', icon: '🏠' },
  { value: 'FRIEND_HOUSE', label: '友人宅 / Friend\'s House', icon: '👥' },
  { value: 'RELATIVE_HOUSE', label: '親族宅 / Relative\'s House', icon: '👨‍👩‍👧' },
  { value: 'OTHER', label: 'その他 / Other', icon: '📝' },
];

/**
 * Gender/Sex options for passport information
 */
export const GENDER_OPTIONS = [
  { value: 'Female', translationKey: 'japan.travelInfo.fields.sex.options.female', defaultLabel: '女性 / Female' },
  { value: 'Male', translationKey: 'japan.travelInfo.fields.sex.options.male', defaultLabel: '男性 / Male' },
  { value: 'Undefined', translationKey: 'japan.travelInfo.fields.sex.options.undefined', defaultLabel: '未定義 / Undefined' },
];

/**
 * Predefined occupation options for Japan entry
 * Japanese labels with English values (submitted in uppercase)
 */
export const OCCUPATION_OPTIONS = [
  { value: 'SOFTWARE ENGINEER', label: 'ソフトウェアエンジニア / Software Engineer', icon: '💻' },
  { value: 'STUDENT', label: '学生 / Student', icon: '📚' },
  { value: 'TEACHER', label: '教師 / Teacher', icon: '👨‍🏫' },
  { value: 'DOCTOR', label: '医師 / Doctor', icon: '👨‍⚕️' },
  { value: 'ACCOUNTANT', label: '会計士 / Accountant', icon: '📊' },
  { value: 'SALES MANAGER', label: '営業マネージャー / Sales Manager', icon: '📈' },
  { value: 'RETIRED', label: '退職者 / Retired', icon: '🏖️' },
  { value: 'ENGINEER', label: 'エンジニア / Engineer', icon: '⚙️' },
  { value: 'CIVIL SERVANT', label: '公務員 / Civil Servant', icon: '🏛️' },
  { value: 'LAWYER', label: '弁護士 / Lawyer', icon: '⚖️' },
  { value: 'NURSE', label: '看護師 / Nurse', icon: '👩‍⚕️' },
  { value: 'FREELANCER', label: 'フリーランス / Freelancer', icon: '🎨' },
  { value: 'BUSINESS OWNER', label: '経営者 / Business Owner', icon: '💼' },
  { value: 'HOMEMAKER', label: '主婦・主夫 / Homemaker', icon: '🏠' },
  { value: 'DESIGNER', label: 'デザイナー / Designer', icon: '✏️' },
  { value: 'OTHER', label: 'その他 / Other', icon: '📝' },
];

/**
 * Storage keys for AsyncStorage
 */
export const STORAGE_KEYS = {
  SESSION_STATE: 'japan_session_state',
  EXPANDED_SECTION: 'japan_expanded_section',
  LAST_EDITED_FIELD: 'japan_last_edited_field',
  SCROLL_POSITION: 'japan_scroll_position',
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
  LENGTH_OF_STAY: 'lengthOfStay',
  IS_TRANSIT_PASSENGER: 'isTransitPassenger',

  // Accommodation fields
  ACCOMMODATION_TYPE: 'accommodationType',
  ACCOMMODATION_ADDRESS: 'accommodationAddress',
  ACCOMMODATION_PHONE: 'accommodationPhone',
};

/**
 * Default values for form fields
 */
export const DEFAULT_VALUES = {
  PHONE_CODE: '+86',
  NATIONALITY: 'China',
  TRAVEL_PURPOSE: 'TOURISM',
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
  TRAVEL_PURPOSE_OPTIONS,
  PREDEFINED_ACCOMMODATION_TYPES,
  ACCOMMODATION_TYPE_OPTIONS,
  GENDER_OPTIONS,
  OCCUPATION_OPTIONS,
  STORAGE_KEYS,
  SECTIONS,
  FIELD_NAMES,
  DEFAULT_VALUES,
  ANIMATION_CONFIG,
};
