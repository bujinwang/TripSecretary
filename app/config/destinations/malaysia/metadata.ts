// @ts-nocheck

/**
 * Malaysia Destination Metadata
 *
 * Core metadata for Malaysia destination.
 */

export const metadata = {
  id: 'my',
  code: 'MY',
  code3: 'MYS',

  name: 'Malaysia',
  nameZh: '马来西亚',
  nameZhTW: '馬來西亞',
  nameMs: 'Malaysia',

  flag: '🇲🇾',
  enabled: true,

  currency: 'MYR',
  currencySymbol: 'RM',
  currencyNameEn: 'Malaysian Ringgit',
  currencyNameZh: '马来西亚林吉特',

  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Kuala_Lumpur',

  locales: ['en', 'zh-CN', 'zh-TW', 'ms'],
  defaultLocale: 'zh-CN',

  flightTimeKey: 'home.destinations.malaysia.flightTime',
  typicalFlightTimeHours: 4,

  visaRequirement: {
    CHN: 'visa_free',
    HKG: 'visa_free',
    MAC: 'visa_free',
    TWN: 'visa_free',
    USA: 'visa_free',
    default: 'check_requirements',
  },
};

export default metadata;
