import { metadata } from './metadata'
import { chinaProvinces, getDistrictsByProvince } from '../../../data/chinaLocations'

export const chinaComprehensiveTravelInfoConfig = {
  destinationId: 'cn' as const,
  name: 'China',
  nameZh: '中国',
  flag: '🇨🇳',

  hero: {
    type: 'rich' as const,
    titleKey: 'china.travelInfo.hero.title',
    defaultTitle: '中国入境准备指南',
    title: 'China Entry Preparation Guide',
    subtitleKey: 'china.travelInfo.hero.subtitle',
    defaultSubtitle: '一步步完成入境资料',
    subtitle: 'Step-by-step entry preparation',
    gradient: {
      colors: ['#DC2626', '#8B0000'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    valuePropositions: [
      { icon: '⏱️', textKey: 'china.travelInfo.hero.valuePropositions.0', defaultText: '3分钟完成', text: '3 minutes to complete' },
      { icon: '🔒', textKey: 'china.travelInfo.hero.valuePropositions.1', defaultText: '100%隐私保护', text: '100% privacy protection' },
      { icon: '🎯', textKey: 'china.travelInfo.hero.valuePropositions.2', defaultText: '避免通关延误', text: 'Avoid customs delays' },
    ],
    beginnerTip: {
      icon: '💡',
      textKey: 'china.travelInfo.hero.beginnerTip',
      defaultText: '准备护照与行程信息，随时更新即可。',
      text: 'Prepare passport and travel details, update anytime.',
    },
  },

  sections: {
    passport: {
      enabled: true,
      icon: '📘',
      sectionKey: 'passport',
      titleKey: 'china.travelInfo.sections.passport.title',
      defaultTitle: '护照信息',
      subtitleKey: 'china.travelInfo.sections.passport.subtitle',
      defaultSubtitle: '用于核验身份与签证信息',
      fields: {
        surname: { fieldName: 'surname', required: true, maxLength: 50, labelKey: 'china.travelInfo.fields.surname', defaultLabel: '姓' },
        middleName: { fieldName: 'middleName', required: false, maxLength: 50, labelKey: 'china.travelInfo.fields.middleName', defaultLabel: '中间名' },
        givenName: { fieldName: 'givenName', required: true, maxLength: 50, labelKey: 'china.travelInfo.fields.givenName', defaultLabel: '名' },
        passportNo: { fieldName: 'passportNo', required: true, labelKey: 'china.travelInfo.fields.passportNo', defaultLabel: '护照号' },
        nationality: { fieldName: 'nationality', required: true, type: 'countrySelect', labelKey: 'china.travelInfo.fields.nationality', defaultLabel: '国籍' },
        dob: { fieldName: 'dob', required: true, type: 'date', labelKey: 'china.travelInfo.fields.dob', defaultLabel: '出生日期' },
        expiryDate: { fieldName: 'expiryDate', required: true, type: 'date', labelKey: 'china.travelInfo.fields.expiryDate', defaultLabel: '护照有效期' },
        sex: { fieldName: 'sex', required: true, type: 'select', options: [ { label: '男性', value: 'M' }, { label: '女性', value: 'F' } ], labelKey: 'china.travelInfo.fields.sex', defaultLabel: '性别' },
        visaNumber: { fieldName: 'visaNumber', required: false, maxLength: 20, labelKey: 'china.travelInfo.fields.visaNumber', defaultLabel: '签证号' },
      },
    },

    personal: {
      enabled: true,
      icon: '👤',
      sectionKey: 'personal',
      titleKey: 'china.travelInfo.sections.personal.title',
      defaultTitle: '个人信息',
      subtitleKey: 'china.travelInfo.sections.personal.subtitle',
      defaultSubtitle: '联系方式与居住信息',
      fields: {
        occupation: { fieldName: 'occupation', required: true, type: 'select', options: [ { label: '学生', value: 'STUDENT' }, { label: '商务', value: 'BUSINESS' }, { label: '退休', value: 'RETIRED' }, { label: '旅游', value: 'TOURISM' }, { label: '其他', value: 'OTHER' } ], allowCustom: true, customFieldName: 'customOccupation', customLabel: '职业（自定义）', labelKey: 'china.travelInfo.fields.occupation', defaultLabel: '职业' },
        cityOfResidence: { fieldName: 'cityOfResidence', required: true, maxLength: 100, labelKey: 'china.travelInfo.fields.cityOfResidence', defaultLabel: '居住城市' },
        countryOfResidence: { fieldName: 'countryOfResidence', required: true, type: 'countrySelect', labelKey: 'china.travelInfo.fields.countryOfResidence', defaultLabel: '居住国家/地区' },
        phoneCode: { fieldName: 'phoneCode', required: false, type: 'phoneCode', labelKey: 'china.travelInfo.fields.phoneCode', defaultLabel: '区号' },
        phoneNumber: { fieldName: 'phoneNumber', required: false, labelKey: 'china.travelInfo.fields.phoneNumber', defaultLabel: '电话号码' },
        email: { fieldName: 'email', required: false, format: 'email', labelKey: 'china.travelInfo.fields.email', defaultLabel: '邮箱' },
      },
    },

    funds: {
      enabled: false,
      icon: '💰',
      sectionKey: 'funds',
      titleKey: 'china.travelInfo.sections.funds.title',
      defaultTitle: '资金证明',
      subtitleKey: 'china.travelInfo.sections.funds.subtitle',
      defaultSubtitle: '如有需要可补充',
    },

    travel: {
      enabled: true,
      icon: '✈️',
      sectionKey: 'travel',
      titleKey: 'china.travelInfo.sections.travel.title',
      defaultTitle: '行程信息',
      subtitleKey: 'china.travelInfo.sections.travel.subtitle',
      defaultSubtitle: '航班与住宿信息',
      fields: {
        travelPurpose: { fieldName: 'travelPurpose', required: true, type: 'select', options: [ { label: '旅游', value: 'TOURISM' }, { label: '商务', value: 'BUSINESS' }, { label: '探亲访友', value: 'FAMILY_VISIT' }, { label: '学习', value: 'EDUCATION' }, { label: '其他', value: 'OTHER' } ], allowCustom: true, customFieldName: 'customTravelPurpose', customLabel: '旅行目的（自定义）', labelKey: 'china.travelInfo.fields.travelPurpose', defaultLabel: '旅行目的' },
        boardingCountry: { fieldName: 'boardingCountry', required: true, type: 'countrySelect', labelKey: 'china.travelInfo.fields.boardingCountry', defaultLabel: '登机国家' },
        arrivalFlightNumber: { fieldName: 'arrivalFlightNumber', required: true, labelKey: 'china.travelInfo.fields.arrivalFlightNumber', defaultLabel: '入境航班号', uppercaseNormalize: true },
        arrivalDate: { fieldName: 'arrivalDate', required: true, type: 'datetime', labelKey: 'china.travelInfo.fields.arrivalDate', defaultLabel: '入境日期' },
        departureDate: { fieldName: 'departureDate', required: false, type: 'datetime', labelKey: 'china.travelInfo.fields.departureDate', defaultLabel: '离境日期' },
        isTransitPassenger: { fieldName: 'isTransitPassenger', required: false, type: 'boolean', labelKey: 'china.travelInfo.fields.isTransitPassenger', defaultLabel: '是否中转' },
        accommodationType: { fieldName: 'accommodationType', required: false, type: 'select', options: [ { value: 'HOTEL', label: '酒店' }, { value: 'HOSTEL', label: '旅馆' }, { value: 'AIRBNB', label: '民宿' }, { value: 'FRIEND_FAMILY', label: '朋友/家人' }, { value: 'OTHER', label: '其他' } ], allowCustom: true, customFieldName: 'customAccommodationType', customLabel: '住宿类型（自定义）', labelKey: 'china.travelInfo.fields.accommodationType', defaultLabel: '住宿类型' },
        province: { fieldName: 'province', required: false, type: 'location', level: 1, labelKey: 'china.travelInfo.fields.province', defaultLabel: '省份/直辖市', placeholder: '请选择省份' },
        district: { fieldName: 'district', required: false, type: 'location', level: 2, dependsOn: 'province', labelKey: 'china.travelInfo.fields.district', defaultLabel: '城市/区县', placeholder: '请选择城市/区县' },
        hotelAddress: { fieldName: 'hotelAddress', required: false, maxLength: 200, multiline: true, labelKey: 'china.travelInfo.fields.hotelAddress', defaultLabel: '住宿地址' },
      },
      locationHierarchy: { levels: 2, provincesData: chinaProvinces, getDistrictsFunc: getDistrictsByProvince, labels: { level1: { key: 'china.locations.province', default: '省份/直辖市' }, level2: { key: 'china.locations.city', default: '城市/区县' } } },
      photoUploads: {
        flightTicket: { enabled: false },
        departureTicket: { enabled: false },
        hotelReservation: { enabled: false },
      },
    },
  },

  validation: {
    mode: 'standard' as const,
    validateOnBlur: true,
    showWarnings: true,
    minCompletionPercent: 70,
    requiredSections: ['passport'],
    customRules: {},
  },

  features: {
    autoSave: { enabled: true, delay: 1000, immediateSaveFields: ['dob', 'expiryDate', 'sex', 'nationality', 'arrivalDate', 'departureDate'] },
    saveStatusIndicator: true,
    lastEditedTimestamp: true,
    privacyNotice: true,
    scrollPositionRestore: true,
    fieldStateTracking: true,
    errorHandlingWithRetry: true,
    smartDefaults: true,
    smartButton: true,
    progressOverview: false,
  },

  navigation: {
    previous: 'ChinaEntryFlow',
    next: 'ChinaEntryFlow',
    saveBeforeNavigate: true,
    submitButton: {
      dynamic: true,
      thresholds: { incomplete: 0.7, almostDone: 0.9, ready: 0.9 },
      labels: { incomplete: 'cn.navigation.submitButton.incomplete', almostDone: 'cn.navigation.submitButton.almostDone', ready: 'cn.navigation.submitButton.ready' },
      default: 'cn.navigation.submitButton.default',
    },
    submitButtonLabel: { key: 'china.travelInfo.submitButton', default: '继续' },
  },

  colors: {
    background: '#F9FAFB',
    primary: '#DC2626',
  },

  dataModels: {
    passport: 'Passport',
    personalInfo: 'PersonalInfo',
    travelInfo: 'EntryData',
    entryInfo: 'EntryInfo',
  },

  tracking: {
    enabled: true,
    trackFieldModifications: true,
    trackScrollPosition: true,
  },

  i18n: {
    namespace: 'china.travelInfo',
    fallbackLanguage: 'zh-CN',
    labelSource: {
      passport: { subtitle: '请填写护照信息', introText: '' },
      personal: { subtitle: '联系方式与居住信息', introText: '' },
      funds: { subtitle: '如有需要可补充', introText: '' },
      travel: { subtitle: '航班与住宿信息', introText: '' },
    },
  },
} as const

export default chinaComprehensiveTravelInfoConfig