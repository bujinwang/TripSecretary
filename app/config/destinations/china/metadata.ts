export const metadata = {
  id: 'cn',
  code: 'CN',
  code3: 'CHN',
  name: 'China',
  nameZh: '中国',
  nameZhTW: '中國',
  flag: '🇨🇳',
  enabled: true,
  currency: 'CNY',
  currencySymbol: '¥',
  currencyNameEn: 'Chinese Yuan',
  currencyNameZh: '人民币',
  dateFormat: 'YYYY-MM-DD',
  timezone: 'Asia/Shanghai',
  flightTimeKey: 'home.destinations.china.flightTime',
  typicalFlightTimeHours: 2.5,
  arrivalCard: {
    type: 'none',
    name: 'Arrival Card',
    nameZh: '入境卡',
    hasDigitalOption: false,
    requires: false,
    submissionWindowHours: null,
  },
  visaRequirement: {
    CAN: 'visa_required',
    default: 'visa_required',
  },
  locales: ['zh', 'zh-CN', 'zh-TW', 'en'],
  defaultLocale: 'zh-CN',
};

export default metadata;