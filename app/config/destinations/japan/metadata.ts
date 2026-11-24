/**
 * Japan Destination Metadata
 *
 * Core metadata for Japan as a destination including:
 * - Basic identification (ID, codes, names)
 * - Display information (flag, translations)
 * - Currency and financial settings
 * - Date and time format preferences
 * - Visa-free entry configuration for many countries
 */

import { DestinationMetadata } from '../types';

export const metadata: DestinationMetadata = {
  // Basic Identification
  id: 'jp',
  code: 'JP',
  code3: 'JPN',

  // Names and Translations
  name: 'Japan',
  nameZh: '日本',
  nameZhTW: '日本',
  nameJa: '日本国',

  // Display
  flag: '🇯🇵',
  enabled: true,

  // Currency
  currency: 'JPY',
  currencySymbol: '¥',
  currencyNameEn: 'Japanese Yen',
  currencyNameZh: '日元',

  // Date and Time
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Tokyo',

  // Flight Information
  flightTimeKey: 'home.destinations.japan.flightTime',
  typicalFlightTimeHours: 3.0, // From major Chinese cities to Tokyo/Osaka

  // Arrival Card Configuration (Paper-based)
  arrivalCard: {
    type: 'paper',
    name: 'Arrival Card',
    nameZh: '入境卡',
    nameJa: '入国カード',
    hasDigitalOption: false, // Japan still uses paper arrival cards
    requires: true, // Required for all visitors
    languages: ['ja', 'en', 'zh'], // Available in Japanese, English, and Chinese
  },

  // Visa Requirements (for Chinese passport holders by default)
  visaRequirement: {
    'CHN': 'visa_free', // China - Visa free for short-term tourism
    'HKG': 'visa_free', // Hong Kong - Visa free
    'MAC': 'visa_free', // Macau - Visa free  
    'TWN': 'visa_free', // Taiwan - Visa free
    'USA': 'visa_free', // USA - Visa free
    'GBR': 'visa_free', // UK - Visa free
    'CAN': 'visa_free', // Canada - Visa free
    'AUS': 'visa_free', // Australia - Visa free
    'SGP': 'visa_free', // Singapore - Visa free
    'MYS': 'visa_free', // Malaysia - Visa free
    'default': 'visa_free', // Most countries have visa-free access
  },

  // Country Priorities
  priority: 1, // High priority destination

  // Localization
  locales: ['en', 'ja', 'zh-CN', 'zh-TW'],
  defaultLocale: 'en',

  // Japan-specific information
  capital: 'Tokyo',
  majorCities: ['Tokyo', 'Osaka', 'Kyoto', 'Nagoya', 'Fukuoka'],
  typicalStayDuration: '90 days', // Visa-free stay duration for most countries
};

export default metadata;