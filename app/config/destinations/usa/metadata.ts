// @ts-nocheck

/**
 * United States Destination Metadata
 */

export const metadata = {
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
