/**
 * Singapore Travel Info Screen Constants
 *
 * Centralized constants for Singapore travel form including predefined options,
 * validation rules, and static data used throughout the component.
 */

/**
 * Predefined travel purpose options for Singapore entry
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
 * Travel purpose options with labels and icons for UI display
 * Labels are English-primary with Chinese secondary
 */
export const TRAVEL_PURPOSE_OPTIONS = [
  { value: 'HOLIDAY', label: 'Holiday / 度假旅游', icon: '🏖️' },
  { value: 'MEETING', label: 'Meeting / 会议', icon: '👔' },
  { value: 'SPORTS', label: 'Sports / 体育活动', icon: '⚽' },
  { value: 'BUSINESS', label: 'Business / 商务', icon: '💼' },
  { value: 'INCENTIVE', label: 'Incentive Travel / 奖励旅游', icon: '🎁' },
  { value: 'CONVENTION', label: 'Convention / 会展', icon: '🎪' },
  { value: 'EDUCATION', label: 'Education / 教育', icon: '📚' },
  { value: 'EMPLOYMENT', label: 'Employment / 就业', icon: '💻' },
  { value: 'EXHIBITION', label: 'Exhibition / 展览', icon: '🎨' },
  { value: 'MEDICAL', label: 'Medical / 医疗', icon: '🏥' },
  { value: 'OTHER', label: 'Other / 其他', icon: '✏️' },
];

/**
 * Predefined accommodation type options for Singapore stay
 * Based on official SGAC form requirements
 */
export const PREDEFINED_ACCOMMODATION_TYPES = [
  'HOTEL',
  'RESIDENTIAL',
  'DAY_TRIP',
  'TRANSIT',
];

/**
 * Accommodation type options with labels and icons for UI display
 * Matches the official Singapore Arrival Card (SGAC) form
 * Labels are English-primary with Chinese secondary
 */
export const ACCOMMODATION_TYPE_OPTIONS = [
  { value: 'HOTEL', label: 'Hotel/Guesthouse/Hostel / 酒店/宾馆/旅舍', icon: '🏨', tip: 'Includes hotels, hostels, guesthouses / 包括酒店、青旅、民宿' },
  { value: 'RESIDENTIAL', label: 'Residential/Friends House / 住宅/朋友家', icon: '🏠', tip: 'Includes apartments, staying with friends / 包括公寓、朋友家' },
  { value: 'DAY_TRIP', label: 'Day Trip / 当日往返', icon: '✈️' },
  { value: 'TRANSIT', label: 'Transit / 过境转机', icon: '🔄' },
];

/**
 * Gender/Sex options for passport information
 * Uses translation keys for internationalization support
 * Labels are English-primary with Chinese secondary
 */
export const GENDER_OPTIONS = [
  { value: 'Female', translationKey: 'sg.travelInfo.fields.sex.options.female', defaultLabel: 'Female / 女性' },
  { value: 'Male', translationKey: 'sg.travelInfo.fields.sex.options.male', defaultLabel: 'Male / 男性' },
  { value: 'Undefined', translationKey: 'sg.travelInfo.fields.sex.options.undefined', defaultLabel: 'Undefined / 未定义' },
];

/**
 * Storage keys for AsyncStorage
 */
export const STORAGE_KEYS = {
  SESSION_STATE: 'singapore_session_state',
  EXPANDED_SECTION: 'singapore_expanded_section',
  LAST_EDITED_FIELD: 'singapore_last_edited_field',
  SCROLL_POSITION: 'singapore_scroll_position',
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
  VISA_NUMBER: 'visaNumber',
  FULL_NAME: 'fullName',
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
  BOARDING_COUNTRY: 'boardingCountry',
  PREVIOUS_ARRIVAL_DATE: 'previousArrivalDate',

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
  SEX: 'Male',
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
  STORAGE_KEYS,
  SECTIONS,
  FIELD_NAMES,
  DEFAULT_VALUES,
  ANIMATION_CONFIG,
};
