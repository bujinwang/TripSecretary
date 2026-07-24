/**
 * United States Destination Metadata
 */

// Type definitions for destination metadata
export interface ArrivalCardConfig {
  type: 'none' | 'paper' | 'digital' | 'both';
  name: string;
  nameZh: string;
  hasDigitalOption: boolean;
  requires: boolean;
  submissionWindowHours: number | null;
}

export interface VisaRequirement {
  CHN: string;
  HKG: string;
  MAC: string;
  TWN: string;
  default: string;
}

export interface DestinationMetadata {
  id: string;
  code: string;
  code3: string;
  name: string;
  nameZh: string;
  nameZhTW: string;
  flag: string;
  enabled: boolean;
  currency: string;
  currencySymbol: string;
  currencyNameEn: string;
  currencyNameZh: string;
  dateFormat: string;
  timezone: string;
  flightTimeKey: string;
  typicalFlightTimeHours: number;
  arrivalCard: ArrivalCardConfig;
  visaRequirement: VisaRequirement;
  locales: string[];
  defaultLocale: string;
}

export const metadata: DestinationMetadata = {
  id: 'us',
  code: 'US',
  code3: 'USA',

  name: 'United States',
  nameZh: '美国',
  nameZhTW: '美國',

  flag: '🇺🇸',
  enabled: true,

  currency: 'USD',
  currencySymbol: '$',
  currencyNameEn: 'US Dollar',
  currencyNameZh: '美元',

  dateFormat: 'MM/DD/YYYY',
  timezone: 'America/New_York',

  flightTimeKey: 'home.destinations.usa.flightTime',
  typicalFlightTimeHours: 13.5,

  arrivalCard: {
    type: 'none',
    name: 'CBP Declaration',
    nameZh: '海关申报表',
    hasDigitalOption: true,
    requires: true,
    submissionWindowHours: null,
  },

  visaRequirement: {
    CHN: 'visa_required',
    HKG: 'visa_required',
    MAC: 'visa_required',
    TWN: 'visa_required',
    default: 'visa_required',
  },

  locales: ['zh-CN', 'zh-TW', 'en'],
  defaultLocale: 'zh-CN',
};

export default metadata;
