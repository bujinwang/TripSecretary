/**
 * Comprehensive Korea Travel Info Configuration
 *
 * Thailand-based configuration approach: Single comprehensive config file
 * that drives the entire enhanced template behavior.
 *
 * This replaces the need for custom hooks and manual state management.
 * Korea-specific features: K-ETA (Korean Electronic Travel Authorization)
 */

import { metadata } from './metadata';

export const koreaComprehensiveTravelInfoConfig = {
  // ============================================
  // BASIC METADATA
  // ============================================
  destinationId: 'kr' as const,
  name: 'South Korea',
  nameZh: '韩国',
  flag: '🇰🇷',
  currency: 'KRW',
  currencySymbol: '₩',

  // ============================================
  // HERO SECTION (Thailand-style rich hero)
  // ============================================
  hero: {
    type: 'rich' as const, // 'rich' uses LinearGradient, 'basic' uses simple layout
    titleKey: 'kr.travelInfo.hero.title',
    defaultTitle: '韩国入境准备指南',
    title: 'South Korea Entry Preparation Guide',
    subtitleKey: 'kr.travelInfo.hero.subtitle',
    defaultSubtitle: '别担心，我们来帮你！',
    subtitle: "Don't worry, we're here to help!",

    gradient: {
      colors: ['#1a3568', '#102347'], // Thai-style dark blue gradient
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },

    valuePropositions: [
      { icon: '⏱️', textKey: 'kr.travelInfo.hero.valuePropositions.0', defaultText: '3分钟完成', text: '3 minutes to complete' },
      { icon: '🔒', textKey: 'kr.travelInfo.hero.valuePropositions.1', defaultText: '100%隐私保护', text: '100% privacy protection' },
      { icon: '🎯', textKey: 'kr.travelInfo.hero.valuePropositions.2', defaultText: '避免通关延误', text: 'Avoid customs delays' },
    ],

    beginnerTip: {
      icon: '💡',
      textKey: 'kr.travelInfo.hero.beginnerTip',
      defaultText: '第一次过韩国海关？我们会一步步教你准备所有必需文件，确保顺利通关！',
      text: 'First time crossing Korean customs? We\'ll guide you step by step to prepare all necessary documents!',
    },
  },

  // ============================================
  // SECTIONS & FIELDS
  // ============================================
  sections: {
    // ------------------------------
    // PASSPORT SECTION
    // ------------------------------
    passport: {
      enabled: true,
      icon: '📘',
      sectionKey: 'passport',
      titleKey: 'kr.travelInfo.sections.passport.title',
      defaultTitle: '护照信息',
      subtitleKey: 'kr.travelInfo.sections.passport.subtitle',
      defaultSubtitle: '请填写护照相关信息',

      fields: {
        surname: {
          fieldName: 'surname',
          required: true,
          maxLength: 50,
          labelKey: 'kr.travelInfo.fields.surname',
          defaultLabel: '姓',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        middleName: {
          fieldName: 'middleName',
          required: false,
          maxLength: 50,
          labelKey: 'kr.travelInfo.fields.middleName',
          defaultLabel: '中间名',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        givenName: {
          fieldName: 'givenName',
          required: true,
          maxLength: 50,
          labelKey: 'kr.travelInfo.fields.givenName',
          defaultLabel: '名',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        passportNo: {
          fieldName: 'passportNo',
          required: true,
          pattern: /^[A-Z0-9]{5,20}$/,
          labelKey: 'kr.travelInfo.fields.passportNo',
          defaultLabel: '护照号码',
          validationMessage: '请输入有效的护照号码（5-20位字母或数字）',
          immediateSave: false,
        },
        nationality: {
          fieldName: 'nationality',
          required: true,
          type: 'countrySelect',
          labelKey: 'kr.travelInfo.fields.nationality',
          defaultLabel: '国籍',
          immediateSave: false,
        },
        dob: {
          fieldName: 'dob',
          required: true,
          type: 'date',
          labelKey: 'kr.travelInfo.fields.dob',
          defaultLabel: '出生日期',
          immediateSave: true, // Critical field - save immediately
          pastOnly: true,
        },
        expiryDate: {
          fieldName: 'expiryDate',
          required: true,
          type: 'date',
          labelKey: 'kr.travelInfo.fields.expiryDate',
          defaultLabel: '护照有效期',
          immediateSave: true, // Critical field - save immediately
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
          labelKey: 'kr.travelInfo.fields.sex',
          defaultLabel: '性别',
          immediateSave: true,
        },
      },
    },

    // ------------------------------
    // PERSONAL INFO SECTION
    // ------------------------------
    personal: {
      enabled: true,
      icon: '👤',
      sectionKey: 'personal',
      titleKey: 'kr.travelInfo.sections.personal.title',
      defaultTitle: '个人信息',
      subtitleKey: 'kr.travelInfo.sections.personal.subtitle',
      defaultSubtitle: '请填写个人信息',

      fields: {
        occupation: {
          fieldName: 'occupation',
          required: false,
          maxLength: 100,
          labelKey: 'kr.travelInfo.fields.occupation',
          defaultLabel: '职业',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        cityOfResidence: {
          fieldName: 'cityOfResidence',
          required: false,
          maxLength: 100,
          labelKey: 'kr.travelInfo.fields.cityOfResidence',
          defaultLabel: '居住城市',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        countryOfResidence: {
          fieldName: 'countryOfResidence',
          required: false,
          type: 'countrySelect',
          labelKey: 'kr.travelInfo.fields.countryOfResidence',
          defaultLabel: '居住国家',
          immediateSave: false,
        },
        phoneCode: {
          fieldName: 'phoneCode',
          required: false,
          type: 'phoneCode',
          labelKey: 'kr.travelInfo.fields.phoneCode',
          defaultLabel: '电话区号',
          smartDefault: 'fromNationality',
          immediateSave: false,
        },
        phoneNumber: {
          fieldName: 'phoneNumber',
          required: false,
          pattern: /^\d{7,15}$/,
          labelKey: 'kr.travelInfo.fields.phoneNumber',
          defaultLabel: '电话号码',
          validationMessage: '请输入7-15位数字的电话号码',
          immediateSave: false,
        },
        email: {
          fieldName: 'email',
          required: false,
          format: 'email',
          labelKey: 'kr.travelInfo.fields.email',
          defaultLabel: '电子邮箱',
          validationMessage: '请输入有效的邮箱地址',
          immediateSave: false,
        },
      },
    },

    // ------------------------------
    // FUNDS SECTION
    // ------------------------------
    funds: {
      enabled: true,
      icon: '💰',
      sectionKey: 'funds',
      titleKey: 'kr.travelInfo.sections.funds.title',
      defaultTitle: '资金证明',
      subtitleKey: 'kr.travelInfo.sections.funds.subtitle',
      defaultSubtitle: '韩国入境建议准备资金证明，如银行卡、现金等',
      minRequired: 0, // Optional but recommended
      maxAllowed: 10,

      types: [
        { value: 'CASH_KRW', label: '韩元现金', defaultAmount: 1000000 },
        { value: 'CASH_USD', label: '美元现金', defaultAmount: 500 },
        { value: 'CASH_CNY', label: '人民币现金', defaultAmount: 3000 },
        { value: 'CARD', label: '信用卡/借记卡', defaultAmount: 5000 },
        { value: 'TRAVELER_CHECK', label: '旅行支票', defaultAmount: 1000 },
        { value: 'OTHER', label: '其他', defaultAmount: 0 },
      ],

      modal: {
        enabled: true,
        component: 'FundItemDetailModal',
      },

      showPhotos: false, // Korea doesn't require fund photos
    },

    // ------------------------------
    // TRAVEL DETAILS SECTION
    // ------------------------------
    travel: {
      enabled: true,
      icon: '✈️',
      sectionKey: 'travel',
      titleKey: 'kr.travelInfo.sections.travel.title',
      defaultTitle: '旅行信息',
      subtitleKey: 'kr.travelInfo.sections.travel.subtitle',
      defaultSubtitle: '请填写旅行相关信息',

      fields: {
        travelPurpose: {
          fieldName: 'travelPurpose',
          required: false,
          maxLength: 100,
          labelKey: 'kr.travelInfo.fields.travelPurpose',
          defaultLabel: '旅行目的',
          placeholder: '例如：旅游、商务、探亲',
          smartDefault: 'TOURISM',
          immediateSave: false,
        },
        boardingCountry: {
          fieldName: 'boardingCountry',
          required: false,
          type: 'countrySelect',
          labelKey: 'kr.travelInfo.fields.boardingCountry',
          defaultLabel: '登机国家',
          smartDefault: 'fromNationality',
          immediateSave: false,
        },
        arrivalFlightNumber: {
          fieldName: 'arrivalFlightNumber',
          required: false,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'kr.travelInfo.fields.arrivalFlightNumber',
          defaultLabel: '抵达航班号',
          placeholder: '例如：KE123',
          uppercaseNormalize: true,
          immediateSave: false,
        },
        arrivalDate: {
          fieldName: 'arrivalDate',
          required: false,
          type: 'date',
          labelKey: 'kr.travelInfo.fields.arrivalDate',
          defaultLabel: '抵达日期',
          futureOnly: true,
          smartDefault: 'tomorrow',
          immediateSave: true,
          // Note: Template will also save as arrivalArrivalDate for compatibility
        },
        departureFlightNumber: {
          fieldName: 'departureFlightNumber',
          required: false,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'kr.travelInfo.fields.departureFlightNumber',
          defaultLabel: '离境航班号',
          placeholder: '例如：KE456',
          uppercaseNormalize: true,
          immediateSave: false,
        },
        departureDate: {
          fieldName: 'departureDate',
          required: false,
          type: 'date',
          labelKey: 'kr.travelInfo.fields.departureDate',
          defaultLabel: '离境日期',
          smartDefault: 'nextWeek',
          immediateSave: true,
          // Note: Template will also save as departureDepartureDate for compatibility
        },
        isTransitPassenger: {
          fieldName: 'isTransitPassenger',
          required: false,
          type: 'boolean',
          labelKey: 'kr.travelInfo.fields.isTransitPassenger',
          defaultLabel: '是否过境乘客',
          default: false,
          immediateSave: true,
        },
        accommodationType: {
          fieldName: 'accommodationType',
          required: false,
          type: 'select',
          options: [
            { value: 'HOTEL', defaultLabel: '酒店' },
            { value: 'HOSTEL', defaultLabel: '青年旅舍' },
            { value: 'AIRBNB', defaultLabel: '爱彼迎' },
            { value: 'FRIEND_FAMILY', defaultLabel: '朋友/家人' },
            { value: 'OTHER', defaultLabel: '其他' },
          ],
          allowCustom: true,
          customFieldName: 'customAccommodationType',
          labelKey: 'kr.travelInfo.fields.accommodationType',
          defaultLabel: '住宿类型',
          smartDefault: 'HOTEL',
          immediateSave: false,
        },
        // Note: accommodationAddress maps to hotelAddress in TravelDetailsSection
        hotelAddress: {
          fieldName: 'accommodationAddress',
          required: false,
          maxLength: 200,
          multiline: true,
          labelKey: 'kr.travelInfo.fields.accommodationAddress',
          defaultLabel: '住宿地址',
          placeholder: '请输入酒店或住宿地址',
          immediateSave: false,
        },
        accommodationPhone: {
          fieldName: 'accommodationPhone',
          required: false,
          maxLength: 50,
          labelKey: 'kr.travelInfo.fields.accommodationPhone',
          defaultLabel: '住宿电话',
          placeholder: '请输入酒店电话',
          immediateSave: false,
        },
        // Korea-specific: K-ETA number
        ketaNumber: {
          fieldName: 'ketaNumber',
          required: false,
          maxLength: 50,
          labelKey: 'kr.travelInfo.fields.ketaNumber',
          defaultLabel: 'K-ETA 编号',
          placeholder: '请输入K-ETA编号',
          conditional: {
            // This field is only shown if hasKeta is true
            // The template will handle this via a custom field renderer
            dependsOn: 'hasKeta',
            showWhen: true,
          },
          immediateSave: false,
        },
        hasKeta: {
          fieldName: 'hasKeta',
          required: false,
          type: 'boolean',
          labelKey: 'kr.travelInfo.fields.hasKeta',
          defaultLabel: '我已有 K-ETA',
          default: false,
          immediateSave: true,
        },
      },

      // Korea doesn't use location hierarchy (no province/district)
      locationHierarchy: null,

      // Photo uploads - disabled for Korea
      photoUploads: {
        flightTicket: { enabled: false },
        departureTicket: { enabled: false },
        hotelReservation: { enabled: false },
      },
    },
  },

  // ============================================
  // VALIDATION RULES
  // ============================================
  validation: {
    mode: 'standard' as const,
    validateOnBlur: true,
    showWarnings: true,

    // Completion requirements
    minCompletionPercent: 70,
    requiredSections: ['passport'],

    // Custom validation rules
    customRules: {},
  },

  // ============================================
  // FEATURES (Thailand-style)
  // ============================================
  features: {
    // Data persistence (V2 structure)
    autoSave: {
      enabled: true,
      delay: 1000,

      // Critical fields that save immediately
      immediateSaveFields: [
        'dob',
        'expiryDate',
        'sex',
        'nationality',
        'arrivalDate',
        'departureDate',
        'hasKeta',
      ],
    },

    // UI features
    saveStatusIndicator: true,
    lastEditedTimestamp: true,
    privacyNotice: true,

    // Advanced features
    scrollPositionRestore: true,
    fieldStateTracking: true,
    sessionStateManagement: false,
    performanceMonitoring: false,
    errorHandlingWithRetry: true,

    // Smart features
    smartDefaults: true,
    smartButton: true,

    // Removed features
    progressOverview: false,
  },

  // ============================================
  // NAVIGATION
  // ============================================
  navigation: {
    previous: 'KoreaRequirements' as const,
    next: 'KoreaEntryFlow' as const,
    saveBeforeNavigate: true,

    // Smart button configuration
    submitButton: {
      dynamic: true,

      thresholds: {
        incomplete: 0.7,
        almostDone: 0.9,
        ready: 0.9,
      },

      labels: {
        incomplete: 'kr.navigation.submitButton.incomplete' as const,
        almostDone: 'kr.navigation.submitButton.almostDone' as const,
        ready: 'kr.navigation.submitButton.ready' as const,
      },

      default: 'kr.navigation.submitButton.default' as const,
    },

    submitButtonLabel: {
      key: 'kr.travelInfo.submitButton' as const,
      default: '保存并继续',
    },
  },

  // ============================================
  // SCREEN MAPPINGS
  // ============================================
  screens: {
    travelInfo: 'KoreaTravelInfo' as const,
    entryFlow: 'KoreaEntryFlow' as const,
    entryPackPreview: 'KoreaEntryPackPreview' as const,
  },

  // ============================================
  // STYLING
  // ============================================
  colors: {
    background: '#F9FAFB',
    primary: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    heroGradientStart: '#1a3568',
    heroGradientEnd: '#102347',
  },

  // ============================================
  // DATA MODELS
  // ============================================
  dataModels: {
    passport: 'Passport',
    personalInfo: 'PersonalInfo',
    travelInfo: 'EntryData',
    entryInfo: 'EntryInfo',
  },

  // ============================================
  // USER INTERACTION TRACKING
  // ============================================
  tracking: {
    enabled: true,
    trackFieldModifications: true,
    trackScrollPosition: true,
    trackTimeSpent: false,
  },

  // ============================================
  // I18N
  // ============================================
  i18n: {
    namespace: 'kr.travelInfo',
    fallbackLanguage: 'zh-CN',
    labelSource: {
      passport: {
        subtitle: '请填写护照相关信息',
        introText: '请确保护照信息准确无误',
      },
      personal: {
        subtitle: '请填写个人信息',
        introText: '这些信息将用于入境卡填写',
      },
      funds: {
        subtitle: '韩国入境建议准备资金证明，如银行卡、现金等',
        introText: '资金证明有助于顺利通关',
      },
      travel: {
        subtitle: '请填写旅行相关信息',
        introText: '包括航班信息和住宿信息',
      },
    },
  },
} as const;

export default koreaComprehensiveTravelInfoConfig;