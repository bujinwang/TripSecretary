/**
 * Hong Kong Travel Info Screen Constants
 *
 * Centralized constants for Hong Kong travel form including predefined options,
 * validation rules, and static data used throughout the component.
 */

/**
 * Predefined travel purpose options for Hong Kong entry
 */
export const PREDEFINED_TRAVEL_PURPOSES = [
  'TOURISM',
  'BUSINESS',
  'VISIT_FAMILY',
  'TRANSIT',
  'MEETING',
  'CONVENTION',
  'EDUCATION',
  'MEDICAL',
  'OTHER',
];

/**
 * Predefined accommodation type options for Hong Kong stay
 */
export const PREDEFINED_ACCOMMODATION_TYPES = [
  'HOTEL',
  'SERVICED_APARTMENT',
  'FRIEND_HOUSE',
  'RELATIVE_HOUSE',
  'HOSTEL',
  'AIRBNB',
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
 * Predefined occupation options for Hong Kong
 * Chinese labels with English values (submitted in uppercase)
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
  { value: 'FINANCE PROFESSIONAL', label: '金融从业者', icon: '💰' },
  { value: 'OTHER', label: '其他', icon: '📝' },
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
  OCCUPATION_OPTIONS,
  STORAGE_KEYS,
  SECTIONS,
  FIELD_NAMES,
  DEFAULT_VALUES,
  ANIMATION_CONFIG,
};
