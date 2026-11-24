/**
 * Singapore Destination Metadata
 *
 * Core identification, currency, and arrival card details for Singapore.
 */

import { DestinationMetadata } from '../types';

export const metadata: DestinationMetadata = {
  // Basic Identification
  id: 'sg',
  code: 'SG',
  code3: 'SGP',

  // Names
  name: 'Singapore',
  nameZh: '新加坡',
  nameZhTW: '新加坡',

  // Display
  flag: '🇸🇬',
  enabled: true,

  // Currency
  currency: 'SGD',
  currencySymbol: 'S$',
  currencyNameEn: 'Singapore Dollar',
  currencyNameZh: '新加坡元',

  // Date/Time
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Singapore',

  // Typical flight time key (used by UI cards)
  flightTimeKey: 'home.destinations.singapore.flightTime',
  typicalFlightTimeHours: 4.5,

  // Arrival card configuration (SG Arrival Card - digital)
  arrivalCard: {
    type: 'digital',
    name: 'SG Arrival Card',
    nameZh: '新加坡入境卡',
    hasDigitalOption: true,
    requires: true,
    submissionWindowHours: 72,
  },

  // Visa requirement defaults (for Chinese passport focus)
  visaRequirement: {
    CHN: 'visa_free',
    HKG: 'visa_free',
    MAC: 'visa_free',
    TWN: 'visa_free',
    default: 'visa_free',
  },

  // Localization
  locales: ['en', 'zh-CN', 'zh-TW'],
  defaultLocale: 'en',
};

export default metadata;
