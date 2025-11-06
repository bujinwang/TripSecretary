/**
 * Taiwan Destination Metadata
 */

export const metadata = {
  id: 'tw',
  code: 'TW',
  code3: 'TWN',
  name: 'Taiwan',
  nameZh: '臺灣',
  nameZhTW: '臺灣',
  flag: '🇹🇼',
  enabled: true,
  currency: 'TWD',
  currencySymbol: 'NT$',
  currencyNameEn: 'New Taiwan Dollar',
  currencyNameZh: '新臺幣',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Taipei',
  flightTimeKey: 'home.destinations.taiwan.flightTime',
  typicalFlightTimeHours: 2.5,
  arrivalCard: {
    type: 'digital',
    name: 'Taiwan Online Arrival Card',
    nameZh: '臺灣入境申報',
    hasDigitalOption: true,
    requires: true,
    submissionWindowHours: 72,
  },
  visaRequirement: {
    CHN: 'entry_permit',
    default: 'visa_free',
  },
  locales: ['en', 'zh-CN', 'zh-TW'],
  defaultLocale: 'zh-TW',
};

export default metadata;
