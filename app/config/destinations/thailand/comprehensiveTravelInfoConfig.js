/**
 * Comprehensive Thailand Travel Info Configuration
 *
 * Thailand-based configuration approach: Single comprehensive config file
 * that drives the entire enhanced template behavior.
 *
 * This replaces the need for custom hooks and manual state management.
 * Thailand-specific features: 3-level location hierarchy, photo uploads
 */

import { metadata } from './metadata';
import { getAllTravelPurposes } from './travelPurposes';
import { getAllAccommodationTypes } from './accommodationTypes';
import { getLocationLoaders } from '../../../utils/locationDataLoader';

// Get Thailand location data
const { provinces: thailandProvinces, getDistricts, getSubDistricts } = getLocationLoaders('th');

// Convert travel purposes to options format
const travelPurposeOptions = getAllTravelPurposes().map(purpose => ({
  label: purpose.displayZh || purpose.displayEn,
  value: purpose.key,
}));

// Convert accommodation types to options format
const accommodationTypeOptions = getAllAccommodationTypes().map(type => ({
  label: type.displayZh || type.displayEn,
  value: type.key,
}));

export const thailandComprehensiveTravelInfoConfig = {
  // ============================================
  // BASIC METADATA
  // ============================================
  destinationId: 'th',
  name: 'Thailand',
  nameZh: '泰国',
  flag: '🇹🇭',
  currency: 'THB',
  currencySymbol: '฿',

  // ============================================
  // HERO SECTION (Thailand-style rich hero)
  // ============================================
  hero: {
    type: 'rich',
    titleKey: 'thailand.travelInfo.hero.title',
    defaultTitle: '泰国入境准备指南',
    title: 'Thailand Entry Preparation Guide',
    subtitleKey: 'thailand.travelInfo.hero.subtitle',
    defaultSubtitle: '别担心，我们来帮你！',
    subtitle: "Don't worry, we're here to help!",

    gradient: {
      colors: ['#1a3568', '#102347'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },

    valuePropositions: [
      { icon: '⏱️', textKey: 'thailand.travelInfo.hero.valuePropositions.0', defaultText: '3分钟完成', text: '3 minutes to complete' },
      { icon: '🔒', textKey: 'thailand.travelInfo.hero.valuePropositions.1', defaultText: '100%隐私保护', text: '100% privacy protection' },
      { icon: '🎯', textKey: 'thailand.travelInfo.hero.valuePropositions.2', defaultText: '避免通关延误', text: 'Avoid customs delays' },
    ],

    beginnerTip: {
      icon: '💡',
      textKey: 'thailand.travelInfo.hero.beginnerTip',
      defaultText: '第一次过泰国海关？我们会一步步教你准备所有必需文件，确保顺利通关！',
      text: 'First time crossing Thai customs? We\'ll guide you step by step to prepare all necessary documents!',
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
      titleKey: 'thailand.travelInfo.sections.passport.title',
      defaultTitle: '护照信息',
      subtitleKey: 'thailand.travelInfo.sections.passport.subtitle',
      defaultSubtitle: '请填写护照相关信息',

      fields: {
        surname: {
          fieldName: 'surname',
          required: true,
          maxLength: 50,
          labelKey: 'thailand.travelInfo.fields.surname',
          defaultLabel: '姓',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        middleName: {
          fieldName: 'middleName',
          required: false,
          maxLength: 50,
          labelKey: 'thailand.travelInfo.fields.middleName',
          defaultLabel: '中间名',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        givenName: {
          fieldName: 'givenName',
          required: true,
          maxLength: 50,
          labelKey: 'thailand.travelInfo.fields.givenName',
          defaultLabel: '名',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        passportNo: {
          fieldName: 'passportNo',
          required: true,
          pattern: /^[A-Z0-9]{5,20}$/,
          labelKey: 'thailand.travelInfo.fields.passportNo',
          defaultLabel: '护照号码',
          validationMessage: '请输入有效的护照号码（5-20位字母或数字）',
          immediateSave: false,
        },
        nationality: {
          fieldName: 'nationality',
          required: true,
          type: 'countrySelect',
          labelKey: 'thailand.travelInfo.fields.nationality',
          defaultLabel: '国籍',
          immediateSave: false,
        },
        dob: {
          fieldName: 'dob',
          required: true,
          type: 'date',
          labelKey: 'thailand.travelInfo.fields.dob',
          defaultLabel: '出生日期',
          immediateSave: true,
          pastOnly: true,
        },
        expiryDate: {
          fieldName: 'expiryDate',
          required: true,
          type: 'date',
          labelKey: 'thailand.travelInfo.fields.expiryDate',
          defaultLabel: '护照有效期',
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
          labelKey: 'thailand.travelInfo.fields.sex',
          defaultLabel: '性别',
          immediateSave: true,
        },
        visaNumber: {
          fieldName: 'visaNumber',
          required: false,
          maxLength: 20,
          labelKey: 'thailand.travelInfo.fields.visaNumber',
          defaultLabel: '签证号码',
          immediateSave: false,
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
      titleKey: 'thailand.travelInfo.sections.personal.title',
      defaultTitle: '个人信息',
      subtitleKey: 'thailand.travelInfo.sections.personal.subtitle',
      defaultSubtitle: '请填写个人信息',

      fields: {
        occupation: {
          fieldName: 'occupation',
          required: false,
          maxLength: 100,
          labelKey: 'thailand.travelInfo.fields.occupation',
          defaultLabel: '职业',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        cityOfResidence: {
          fieldName: 'cityOfResidence',
          required: false,
          maxLength: 100,
          labelKey: 'thailand.travelInfo.fields.cityOfResidence',
          defaultLabel: '居住城市',
          // Note: When residentCountry is CHN, this becomes a province selector
          immediateSave: false,
          uppercaseNormalize: true,
        },
        countryOfResidence: {
          fieldName: 'countryOfResidence',
          required: false,
          type: 'countrySelect',
          labelKey: 'thailand.travelInfo.fields.countryOfResidence',
          defaultLabel: '居住国家',
          immediateSave: false,
        },
        phoneCode: {
          fieldName: 'phoneCode',
          required: false,
          type: 'phoneCode',
          labelKey: 'thailand.travelInfo.fields.phoneCode',
          defaultLabel: '电话区号',
          smartDefault: 'fromNationality',
          immediateSave: false,
        },
        phoneNumber: {
          fieldName: 'phoneNumber',
          required: false,
          pattern: /^\d{7,15}$/,
          labelKey: 'thailand.travelInfo.fields.phoneNumber',
          defaultLabel: '电话号码',
          validationMessage: '请输入7-15位数字的电话号码',
          immediateSave: false,
        },
        email: {
          fieldName: 'email',
          required: false,
          format: 'email',
          labelKey: 'thailand.travelInfo.fields.email',
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
      titleKey: 'thailand.travelInfo.sections.funds.title',
      defaultTitle: '资金证明',
      subtitleKey: 'thailand.travelInfo.sections.funds.subtitle',
      defaultSubtitle: '请提供资金证明',
      minRequired: 0,
      maxAllowed: 10,

      types: [
        { value: 'CASH_THB', label: '泰铢现金', defaultAmount: 20000 },
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

      showPhotos: false,
    },

    // ------------------------------
    // TRAVEL DETAILS SECTION
    // ------------------------------
    travel: {
      enabled: true,
      icon: '✈️',
      sectionKey: 'travel',
      titleKey: 'thailand.travelInfo.sections.travel.title',
      defaultTitle: '旅行信息',
      subtitleKey: 'thailand.travelInfo.sections.travel.subtitle',
      defaultSubtitle: '请填写旅行相关信息',

      fields: {
        travelPurpose: {
          fieldName: 'travelPurpose',
          required: true,
          type: 'select',
          options: travelPurposeOptions,
          allowCustom: true,
          customFieldName: 'customTravelPurpose',
          labelKey: 'thailand.travelInfo.fields.travelPurpose',
          defaultLabel: '旅行目的',
          smartDefault: 'HOLIDAY',
          immediateSave: false,
        },
        recentStayCountry: {
          fieldName: 'recentStayCountry',
          required: false,
          type: 'countrySelect',
          labelKey: 'thailand.travelInfo.fields.recentStayCountry',
          defaultLabel: '最近30天访问国家',
          immediateSave: true,
        },
        boardingCountry: {
          fieldName: 'boardingCountry',
          required: true,
          type: 'countrySelect',
          labelKey: 'thailand.travelInfo.fields.boardingCountry',
          defaultLabel: '登机国家',
          smartDefault: 'fromNationality',
          immediateSave: false,
        },
        arrivalFlightNumber: {
          fieldName: 'arrivalFlightNumber',
          required: true,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'thailand.travelInfo.fields.arrivalFlightNumber',
          defaultLabel: '抵达航班号',
          placeholder: '例如：TG123',
          uppercaseNormalize: true,
          immediateSave: false,
        },
        arrivalDate: {
          fieldName: 'arrivalDate',
          required: true,
          type: 'date',
          labelKey: 'thailand.travelInfo.fields.arrivalDate',
          defaultLabel: '抵达日期',
          futureOnly: true,
          smartDefault: 'tomorrow',
          immediateSave: true,
        },
        flightTicketPhoto: {
          fieldName: 'flightTicketPhoto',
          required: false,
          type: 'photo',
          labelKey: 'thailand.travelInfo.fields.flightTicketPhoto',
          defaultLabel: '抵达航班票照片',
          immediateSave: true,
        },
        departureFlightNumber: {
          fieldName: 'departureFlightNumber',
          required: false,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'thailand.travelInfo.fields.departureFlightNumber',
          defaultLabel: '离境航班号',
          placeholder: '例如：TG456',
          uppercaseNormalize: true,
          immediateSave: false,
        },
        departureDate: {
          fieldName: 'departureDate',
          required: false,
          type: 'date',
          labelKey: 'thailand.travelInfo.fields.departureDate',
          defaultLabel: '离境日期',
          smartDefault: 'nextWeek',
          immediateSave: true,
        },
        departureFlightTicketPhoto: {
          fieldName: 'departureFlightTicketPhoto',
          required: false,
          type: 'photo',
          labelKey: 'thailand.travelInfo.fields.departureFlightTicketPhoto',
          defaultLabel: '离境航班票照片',
          immediateSave: true,
        },
        isTransitPassenger: {
          fieldName: 'isTransitPassenger',
          required: false,
          type: 'boolean',
          labelKey: 'thailand.travelInfo.fields.isTransitPassenger',
          defaultLabel: '是否过境旅客',
          default: false,
          immediateSave: true,
        },
        accommodationType: {
          fieldName: 'accommodationType',
          required: true,
          type: 'select',
          options: accommodationTypeOptions,
          allowCustom: true,
          customFieldName: 'customAccommodationType',
          labelKey: 'thailand.travelInfo.fields.accommodationType',
          defaultLabel: '住宿类型',
          smartDefault: 'HOTEL',
          immediateSave: false,
        },
        province: {
          fieldName: 'province',
          required: true,
          type: 'location',
          level: 1,
          labelKey: 'thailand.travelInfo.fields.province',
          defaultLabel: '省份',
          immediateSave: false,
        },
        district: {
          fieldName: 'district',
          required: true,
          type: 'location',
          level: 2,
          dependsOn: 'province',
          labelKey: 'thailand.travelInfo.fields.district',
          defaultLabel: '区/郡',
          immediateSave: false,
        },
        subDistrict: {
          fieldName: 'subDistrict',
          required: true,
          type: 'location',
          level: 3,
          dependsOn: 'district',
          labelKey: 'thailand.travelInfo.fields.subDistrict',
          defaultLabel: '街道/区',
          immediateSave: false,
        },
        subDistrictId: {
          fieldName: 'subDistrictId',
          required: true,
          type: 'locationId',
          dependsOn: 'district',
          immediateSave: false,
        },
        postalCode: {
          fieldName: 'postalCode',
          required: false,
          maxLength: 10,
          labelKey: 'thailand.travelInfo.fields.postalCode',
          defaultLabel: '邮政编码',
          immediateSave: false,
        },
        hotelAddress: {
          fieldName: 'hotelAddress',
          required: true,
          maxLength: 200,
          multiline: true,
          labelKey: 'thailand.travelInfo.fields.hotelAddress',
          defaultLabel: '住宿地址',
          placeholder: '请输入详细地址',
          immediateSave: false,
        },
        hotelReservationPhoto: {
          fieldName: 'hotelReservationPhoto',
          required: false,
          type: 'photo',
          labelKey: 'thailand.travelInfo.fields.hotelReservationPhoto',
          defaultLabel: '酒店预订照片',
          immediateSave: true,
        },
      },

      // Location hierarchy configuration (3-level for Thailand)
      locationHierarchy: {
        levels: 3, // Thailand: Province → District → SubDistrict (3 levels)
        provincesData: thailandProvinces,
        getDistrictsFunc: getDistricts,
        getSubDistrictsFunc: getSubDistricts,
        labels: {
          level1: { key: 'thailand.locations.province', default: '省份' },
          level2: { key: 'thailand.locations.district', default: '区/郡' },
          level3: { key: 'thailand.locations.subDistrict', default: '街道/区' },
        },
      },

      // Photo uploads - enabled for Thailand
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
    mode: 'thailand', // Thailand has special validation rules
    validateOnBlur: true,
    showWarnings: true,

    // Completion requirements
    minCompletionPercent: 80,
    requiredSections: ['passport', 'travel'],

    // Custom validation rules
    customRules: {
      // China province validation for cityOfResidence
      cityOfResidence: {
        when: (formState) => formState.countryOfResidence === 'CHN',
        validate: (value) => {
          // Validate against China provinces
          const { findChinaProvince } = require('../../../utils/validation/chinaProvinceValidator');
          return findChinaProvince(value) !== null;
        },
        message: '请输入有效的中国省份',
      },
    },
  },

  // ============================================
  // FEATURES (Thailand-style)
  // ============================================
  features: {
    // Data persistence
    autoSave: {
      enabled: true,
      delay: 2000, // Thailand uses 2s debounce

      immediateSaveFields: [
        'dob',
        'expiryDate',
        'sex',
        'nationality',
        'arrivalDate',
        'departureDate',
        'recentStayCountry',
        'isTransitPassenger',
        'flightTicketPhoto',
        'departureFlightTicketPhoto',
        'hotelReservationPhoto',
      ],
    },

    // UI features
    saveStatusIndicator: true,
    lastEditedTimestamp: true,
    privacyNotice: true,

    // Advanced features
    scrollPositionRestore: true,
    fieldStateTracking: true,
    sessionStateManagement: true,
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
    previous: 'ThailandRequirements',
    next: 'ThailandEntryFlow',
    saveBeforeNavigate: true,

    submitButton: {
      dynamic: true,

      thresholds: {
        incomplete: 0.7,
        almostDone: 0.9,
        ready: 0.9,
      },

      labels: {
        incomplete: 'thailand.navigation.submitButton.incomplete',
        almostDone: 'thailand.navigation.submitButton.almostDone',
        ready: 'thailand.navigation.submitButton.ready',
      },

      default: 'thailand.navigation.submitButton.default',
    },

    submitButtonLabel: {
      key: 'thailand.travelInfo.submitButton',
      default: '保存并继续',
    },
  },

  // ============================================
  // SCREEN MAPPINGS
  // ============================================
  screens: {
    travelInfo: 'ThailandTravelInfo',
    entryFlow: 'ThailandEntryFlow',
    entryPackPreview: 'ThailandEntryPackPreview',
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
    namespace: 'thailand.travelInfo',
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
        subtitle: '请提供资金证明',
        introText: '资金证明有助于顺利通关',
      },
      travel: {
        subtitle: '请填写旅行相关信息',
        introText: '包括航班信息和住宿信息',
      },
    },
  },
};

export default thailandComprehensiveTravelInfoConfig;

