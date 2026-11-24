/**
 * Thailand Destination Metadata
 *
 * Core metadata for Thailand as a destination including:
 * - Basic identification (ID, codes, names)
 * - Display information (flag, translations)
 * - Currency and financial settings
 * - Date and time format preferences
 * - Digital arrival card configuration
 */

import { DestinationMetadata } from '../types';

export const metadata: DestinationMetadata = {
  // Basic Identification
  id: 'th',
  code: 'TH',
  code3: 'THA',

  // Names and Translations
  name: 'Thailand',
  nameZh: '泰国',
  nameZhTW: '泰國',
  nameTh: 'ไทย',

  // Display
  flag: '🇹🇭',
  enabled: true,

  // Currency
  currency: 'THB',
  currencySymbol: '฿',
  currencyNameEn: 'Thai Baht',
  currencyNameZh: '泰铢',

  // Date and Time
  dateFormat: 'YYYY-MM-DD',
  timezone: 'Asia/Bangkok',

  // Flight Information
  flightTimeKey: 'home.destinations.thailand.flightTime',
  typicalFlightTimeHours: 4.5, // From major Chinese cities

  // Digital Arrival Card Configuration
  digitalCard: {
    type: 'TDAC',
    name: 'Thailand Digital Arrival Card',
    nameZh: '泰国电子入境卡',
    nameShort: 'TDAC',
    submissionWindowHours: 72, // Can submit up to 72 hours before arrival
    required: true,
    apiEndpoint: 'https://www.eservices.immigration.go.th/eTAC',
    sessionBased: true, // IDs change per session
  },

  // Visa Requirements (for Chinese passport holders by default)
  visaRequirement: {
    'CHN': 'visa_free', // China - Visa free
    'HKG': 'visa_free', // Hong Kong - Visa free
    'MAC': 'visa_free', // Macau - Visa free
    'TWN': 'visa_free', // Taiwan - Visa free
    'USA': 'visa_free', // USA - Visa free (various durations)
    'GBR': 'visa_free', // UK - Visa free
    'default': 'check_requirements', // Default - Check individual requirements
  },

  // Country Priorities
  priority: 2, // Higher priority (lower number) = shown earlier in lists

  // Localization
  locales: ['en', 'th', 'zh-CN', 'zh-TW'],
  defaultLocale: 'en',
};

export default metadata;
