/**
 * Comprehensive Malaysia Travel Info Configuration
 *
 * Malaysia implementation of EnhancedTravelInfoTemplate V2.
 * Mirrors the Vietnam setup but with MDAC-specific copy and fields.
 */

import { malaysiaLabels, malaysiaConfig } from '../../../config/labels/malaysia';
import { malaysiaStates, getDistrictsByState } from '../../../data/malaysiaLocations';

export const malaysiaComprehensiveTravelInfoConfig = {
  // ============================================
  // BASIC METADATA
  // ============================================
  destinationId: 'my',
  name: 'Malaysia',
  nameZh: '马来西亚',
  flag: '🇲🇾',
  currency: 'MYR',
  currencySymbol: 'RM',

  // ============================================
  // HERO SECTION
  // ============================================
  hero: {
    type: 'rich', // 'rich' uses LinearGradient, 'basic' uses simple layout
    titleKey: 'my.travelInfo.hero.title',
    defaultTitle: '马来西亚入境准备指南',
    subtitleKey: 'my.travelInfo.hero.subtitle',
    defaultSubtitle: '3分钟完成MDAC，轻松入境！',

    gradient: {
      colors: ['#1D4ED8', '#1E3A8A'], // Malaysia blue gradient
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },

    valuePropositions: [
      { 
        icon: '⏱️', 
        textKey: 'my.travelInfo.hero.valuePropositions.0',
        defaultText: '3分钟完成',
        text: '3分钟完成' 
      },
      { 
        icon: '🛂', 
        textKey: 'my.travelInfo.hero.valuePropositions.1',
        defaultText: '智能MDAC提醒',
        text: '智能MDAC提醒' 
      },
      { 
        icon: '🔒', 
        textKey: 'my.travelInfo.hero.valuePropositions.2',
        defaultText: '离线友好，安全存储',
        text: '离线友好，安全存储' 
      },
    ],

    beginnerTip: {
      icon: '💡',
      textKey: 'my.travelInfo.hero.beginnerTip',
      defaultText: 'MDAC必须在入境前3天内提交。我们在最佳时间提醒您。',
      text: 'MDAC必须在入境前3天内提交。我们在最佳时间提醒您。',
    },
  },

  // ============================================
  // SECTION CONFIGURATION
  // ============================================
  sections: {
    // PASSPORT SECTION
    passport: {
      enabled: true,
      icon: '📘',
      sectionKey: 'passport',
      titleKey: 'my.travelInfo.sections.passport.title',
      defaultTitle: '护照信息',
      subtitleKey: 'my.travelInfo.sections.passport.subtitle',
      defaultSubtitle: '请准确填写护照信息',
      fields: {
        surname: {
          fieldName: 'surname',
          required: true,
          maxLength: 50,
          labelKey: 'my.travelInfo.fields.surname',
          defaultLabel: '姓',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        middleName: {
          fieldName: 'middleName',
          required: false,
          maxLength: 50,
          labelKey: 'my.travelInfo.fields.middleName',
          defaultLabel: '中间名',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        givenName: {
          fieldName: 'givenName',
          required: true,
          maxLength: 50,
          labelKey: 'my.travelInfo.fields.givenName',
          defaultLabel: '名',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        passportNo: {
          fieldName: 'passportNo',
          required: true,
          pattern: /^[A-Z0-9]{5,20}$/,
          labelKey: 'my.travelInfo.fields.passportNo',
          defaultLabel: '护照号',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        nationality: {
          fieldName: 'nationality',
          required: true,
          type: 'countrySelect',
          labelKey: 'my.travelInfo.fields.nationality',
          defaultLabel: '国籍',
          immediateSave: true,
        },
        dob: {
          fieldName: 'dob',
          required: true,
          type: 'date',
          labelKey: 'my.travelInfo.fields.dob',
          defaultLabel: '出生日期',
          immediateSave: true,
          pastOnly: true,
        },
        expiryDate: {
          fieldName: 'expiryDate',
          required: true,
          type: 'date',
          labelKey: 'my.travelInfo.fields.expiryDate',
          defaultLabel: '有效期',
          immediateSave: true,
          futureOnly: true,
          minMonthsValid: 6,
        },
        sex: {
          fieldName: 'sex',
          required: true,
          type: 'select',
          options: [
            { label: '男性', value: 'M' },
            { label: '女性', value: 'F' },
          ],
          labelKey: 'my.travelInfo.fields.sex',
          defaultLabel: '性别',
          immediateSave: true,
        },
        visaNumber: {
          fieldName: 'visaNumber',
          required: false,
          maxLength: 20,
          labelKey: 'my.travelInfo.fields.visaNumber',
          defaultLabel: '签证号',
          immediateSave: false,
        },
      },
    },

    // PERSONAL SECTION
    personal: {
      enabled: true,
      icon: '👤',
      sectionKey: 'personal',
      titleKey: 'my.travelInfo.sections.personal.title',
      defaultTitle: malaysiaLabels.personalInfo.title,
      subtitleKey: 'my.travelInfo.sections.personal.subtitle',
      defaultSubtitle: '联系方式和职业',
      fields: {
        occupation: {
          fieldName: 'occupation',
          required: true,
          type: 'select',
          options: [
            { label: '上班族', value: 'OFFICE' },
            { label: '自由职业者', value: 'FREELANCER' },
            { label: '学生', value: 'STUDENT' },
            { label: '个体经营', value: 'SELF_EMPLOYED' },
            { label: '家庭主妇/主夫', value: 'HOMEMAKER' },
            { label: '退休人员', value: 'RETIRED' },
            { label: '其他', value: 'OTHER' },
          ],
          allowCustom: true,
          customFieldName: 'customOccupation',
          customLabel: malaysiaLabels.personalInfo.customOccupationLabel,
          customPlaceholder: malaysiaLabels.personalInfo.customOccupationPlaceholder,
          labelKey: 'my.travelInfo.fields.occupation',
          defaultLabel: '职业',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        cityOfResidence: {
          fieldName: 'cityOfResidence',
          required: true,
          maxLength: 80,
          labelKey: 'my.travelInfo.fields.cityOfResidence',
          defaultLabel: '居住城市',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        residentCountry: {
          fieldName: 'residentCountry',
          required: true,
          type: 'countrySelect',
          labelKey: 'my.travelInfo.fields.countryOfResidence',
          defaultLabel: '居住国家',
          immediateSave: true,
        },
        phoneCode: {
          fieldName: 'phoneCode',
          required: true,
          type: 'phoneCode',
          labelKey: 'my.travelInfo.fields.phoneCode',
          defaultLabel: '电话区号',
          immediateSave: true,
        },
        phoneNumber: {
          fieldName: 'phoneNumber',
          required: true,
          pattern: /^[0-9]{6,15}$/,
          labelKey: 'my.travelInfo.fields.phoneNumber',
          defaultLabel: '电话号码',
          immediateSave: true,
        },
        email: {
          fieldName: 'email',
          required: true,
          format: 'email',
          labelKey: 'my.travelInfo.fields.email',
          defaultLabel: '电子邮箱',
          immediateSave: false,
        },
      },
    },

    // FUNDS SECTION
    funds: {
      enabled: true,
      icon: '💰',
      sectionKey: 'funds',
      titleKey: 'my.travelInfo.sections.funds.title',
      defaultTitle: '资金证明',
      subtitleKey: 'my.travelInfo.sections.funds.subtitle',
      defaultSubtitle: '旅游资金和支付方式',
      minRequired: 1,
      maxAllowed: 10,
      fundTypes: malaysiaConfig.funds.fundTypes,
      allowPhoto: true,
      defaultCurrency: 'MYR',
      labels: {
        addFundTitle: malaysiaLabels.funds.addFundTitle,
        emptyTitle: malaysiaLabels.funds.emptyTitle,
        emptyMessage: malaysiaLabels.funds.emptyMessage,
      },
    },

    // TRAVEL SECTION
    travel: {
      enabled: true,
      icon: '✈️',
      sectionKey: 'travel',
      titleKey: 'my.travelInfo.sections.travel.title',
      defaultTitle: malaysiaLabels.travelDetails.title,
      subtitleKey: 'my.travelInfo.sections.travel.subtitle',
      defaultSubtitle: '航班和住宿信息',
      fields: {
        travelPurpose: {
          fieldName: 'travelPurpose',
          required: true,
          type: 'select',
          options: [
            { label: '旅游', value: 'TOURISM' },
            { label: '商务', value: 'BUSINESS' },
            { label: '探亲访友', value: 'VISITING_RELATIVES' },
            { label: '过境', value: 'TRANSIT' },
            { label: '其他', value: 'OTHER' },
          ],
          allowCustom: true,
          customFieldName: 'customTravelPurpose',
          customLabel: '其他目的',
          customPlaceholder: '请说明',
          labelKey: 'my.travelInfo.fields.travelPurpose',
          defaultLabel: '旅行目的',
          smartDefault: 'TOURISM',
          immediateSave: false,
        },
        recentStayCountry: {
          fieldName: 'recentStayCountry',
          required: false,
          type: 'countrySelect',
          labelKey: 'my.travelInfo.fields.recentStayCountry',
          defaultLabel: '最近停留国家',
          immediateSave: true,
        },
        boardingCountry: {
          fieldName: 'boardingCountry',
          required: true,
          type: 'countrySelect',
          labelKey: 'my.travelInfo.fields.boardingCountry',
          defaultLabel: '登机国家',
          smartDefault: 'fromNationality',
          immediateSave: false,
        },
        arrivalFlightNumber: {
          fieldName: 'arrivalFlightNumber',
          required: true,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'my.travelInfo.fields.arrivalFlightNumber',
          defaultLabel: '抵达航班号',
          placeholder: '例如：MH123',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        arrivalDate: {
          fieldName: 'arrivalDate',
          required: true,
          type: 'datetime',
          labelKey: 'my.travelInfo.fields.arrivalDate',
          defaultLabel: '抵达日期',
          futureOnly: true,
          smartDefault: 'tomorrow',
          immediateSave: true,
        },
        departureFlightNumber: {
          fieldName: 'departureFlightNumber',
          required: false,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'my.travelInfo.fields.departureFlightNumber',
          defaultLabel: '离境航班号',
          placeholder: '例如：MH456',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        departureDate: {
          fieldName: 'departureDate',
          required: false,
          type: 'datetime',
          labelKey: 'my.travelInfo.fields.departureDate',
          defaultLabel: '离境日期',
          smartDefault: 'nextWeek',
          immediateSave: true,
        },
        isTransitPassenger: {
          fieldName: 'isTransitPassenger',
          required: false,
          type: 'boolean',
          labelKey: 'my.travelInfo.fields.isTransitPassenger',
          defaultLabel: '是否过境旅客',
          default: false,
          immediateSave: true,
        },
        accommodationType: {
          fieldName: 'accommodationType',
          required: true,
          type: 'select',
          options: malaysiaConfig.travelDetails.accommodationOptions,
          allowCustom: true,
          customFieldName: 'customAccommodationType',
          customLabel: '其他住宿类型',
          labelKey: 'my.travelInfo.fields.accommodationType',
          defaultLabel: '住宿类型',
          smartDefault: 'HOTEL',
          immediateSave: false,
        },
        province: {
          fieldName: 'province',
          required: true,
          type: 'location',
          level: 1,
          labelKey: 'my.travelInfo.fields.province',
          defaultLabel: '州/省',
          placeholder: '请选择州/省',
          immediateSave: false,
        },
        district: {
          fieldName: 'district',
          required: true,
          type: 'location',
          level: 2,
          dependsOn: 'province',
          labelKey: 'my.travelInfo.fields.district',
          defaultLabel: '区/县',
          placeholder: '请选择区/县',
          immediateSave: false,
        },
        hotelAddress: {
          fieldName: 'hotelAddress',
          required: true,
          maxLength: 200,
          multiline: true,
          labelKey: 'my.travelInfo.fields.hotelAddress',
          defaultLabel: '住宿地址',
          placeholder: '请输入详细地址',
          immediateSave: false,
        },
      },
      locationHierarchy: {
        levels: 2,
        provincesData: malaysiaStates,
        getDistrictsFunc: getDistrictsByState,
        labels: {
          level1: { key: 'malaysia.travelInfo.locations.state', default: 'State' },
          level2: { key: 'malaysia.travelInfo.locations.district', default: 'District' },
        },
      },
      photoUploads: {
        flightTicket: { enabled: true },
        departureTicket: { enabled: true },
        hotelReservation: { enabled: true },
      },
    },
  },

  // ============================================
  // VALIDATION RULES
  // ============================================
  validation: {
    mode: 'standard',
    validateOnBlur: true,
    showWarnings: true,
    minCompletionPercent: 75,
    requiredSections: ['passport', 'travel'],
    customRules: {
      arrivalDateWithinWindow: {
        field: 'arrivalDate',
        validator: (value) => {
          if (!value) {
            return true;
          }
          const arrival = new Date(value);
          const now = new Date();
          const diffHours = (arrival - now) / 36e5;
          return diffHours >= 0 && diffHours <= 720; // 30 days window sanity check
        },
        messageKey: 'my.travelInfo.validation.arrivalDateWithinWindow',
        defaultMessage: '抵达日期必须在未来30天内才能符合MDAC提交时间窗口。',
      },
    },
  },

  // ============================================
  // FEATURES
  // ============================================
  features: {
    autoSave: {
      enabled: true,
      delay: 1500,
      immediateSaveFields: [
        'dob',
        'expiryDate',
        'sex',
        'nationality',
        'arrivalDate',
        'departureDate',
        'isTransitPassenger',
        'phoneCode',
        'phoneNumber',
      ],
    },
    saveStatusIndicator: true,
    lastEditedTimestamp: true,
    privacyNotice: true,
    scrollPositionRestore: true,
    fieldStateTracking: true,
    smartDefaults: true,
    smartButton: true,
    progressOverview: false,
  },

  // ============================================
  // NAVIGATION
  // ============================================
  navigation: {
    previous: 'MalaysiaRequirements',
    next: 'MalaysiaEntryFlow',
    saveBeforeNavigate: true,
    submitButton: {
      dynamic: true, // Enable smart button with dynamic labels

      // Thresholds for label changes (0-1 scale)
      thresholds: {
        incomplete: 0.6,   // Below 60% shows "incomplete" label
        almostDone: 0.8,   // 60-80% shows "almostDone" label
        ready: 0.9,        // 90%+ shows "ready" label
      },

      // Labels for each state (using i18n keys)
      labels: {
        incomplete: {
          key: 'my.travelInfo.buttonLabels.incomplete',
          default: '完成必填项',
        },
        almostDone: {
          key: 'my.travelInfo.buttonLabels.almostDone',
          default: '快完成了',
        },
        ready: {
          key: 'my.travelInfo.buttonLabels.ready',
          default: '继续',
        },
      },

      // Default fallback if dynamic is disabled
      default: {
        key: 'my.travelInfo.continue',
        default: '继续',
      },

      readyAction: {
        type: 'navigate',
        screen: 'MalaysiaEntryFlow',
      },
    },

    // Fallback submit button label
    submitButtonLabel: {
      key: 'my.travelInfo.continue',
      default: '继续',
    },
  },

  // ============================================
  // I18N
  // ============================================
  i18n: {
    defaultLocale: 'zh-CN',
    supportedLocales: ['zh-CN', 'en', 'ms', 'zh-TW'],
    labelSource: malaysiaLabels,
  },
};

export default malaysiaComprehensiveTravelInfoConfig;
