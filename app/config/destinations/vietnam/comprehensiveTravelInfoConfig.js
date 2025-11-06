/**
 * Comprehensive Vietnam Travel Info Configuration
 *
 * Thailand-based configuration approach: Single comprehensive config file
 * that drives the entire enhanced template behavior.
 *
 * This replaces the need for custom hooks and manual state management.
 */

import { vietnamLabels, vietnamConfig } from '../../labels/vietnam';
import { metadata } from './metadata';
import { vietnamProvinces, getDistrictsByProvince } from '../../../data/vietnamLocations';

export const vietnamComprehensiveTravelInfoConfig = {
  // ============================================
  // BASIC METADATA
  // ============================================
  destinationId: 'vn',
  name: 'Vietnam',
  nameZh: '越南',
  flag: '🇻🇳',
  currency: 'VND',
  currencySymbol: '₫',

  // ============================================
  // HERO SECTION (Thailand-style rich hero)
  // ============================================
  hero: {
    type: 'rich', // 'rich' uses LinearGradient, 'basic' uses simple layout
    title: '越南入境准备指南',
    titleEn: 'Vietnam Entry Preparation Guide',
    subtitle: '别担心，我们来帮你！',
    subtitleEn: "Don't worry, we're here to help!",

    gradient: {
      colors: ['#1a3568', '#102347'], // Thai-style dark blue gradient
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },

    valuePropositions: [
      { icon: '⏱️', text: '3分钟完成', textEn: '3 minutes to complete' },
      { icon: '🔒', text: '100%隐私保护', textEn: '100% privacy protection' },
      { icon: '🎯', text: '避免通关延误', textEn: 'Avoid customs delays' },
    ],

    beginnerTip: {
      icon: '💡',
      text: '第一次过越南海关？我们会一步步教你准备所有必需文件，确保顺利通关！',
      textEn: 'First time crossing Vietnam customs? We\'ll guide you step by step to prepare all necessary documents!',
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
      titleKey: 'vietnam.travelInfo.sections.passport.title',
      defaultTitle: vietnamLabels.passport.title,
      subtitleKey: 'vietnam.travelInfo.sections.passport.subtitle',
      defaultSubtitle: vietnamLabels.passport.subtitle,

      fields: {
        surname: {
          fieldName: 'surname',
          required: true,
          maxLength: 50,
          labelKey: 'vietnam.travelInfo.fields.surname',
          defaultLabel: '姓',
          immediateSave: false, // Save via debounce
          uppercaseNormalize: true, // Auto-uppercase
        },
        middleName: {
          fieldName: 'middleName',
          required: false,
          maxLength: 50,
          labelKey: 'vietnam.travelInfo.fields.middleName',
          defaultLabel: '中间名',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        givenName: {
          fieldName: 'givenName',
          required: true,
          maxLength: 50,
          labelKey: 'vietnam.travelInfo.fields.givenName',
          defaultLabel: '名',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        passportNo: {
          fieldName: 'passportNo',
          required: true,
          pattern: /^[A-Z0-9]{5,20}$/,
          labelKey: 'vietnam.travelInfo.fields.passportNo',
          defaultLabel: vietnamLabels.passport.passportNo,
          helpText: vietnamLabels.passport.passportNoHelp,
          validationMessage: '请输入有效的护照号码（5-20位字母或数字）',
          immediateSave: false,
        },
        nationality: {
          fieldName: 'nationality',
          required: true,
          type: 'countrySelect',
          labelKey: 'vietnam.travelInfo.fields.nationality',
          defaultLabel: vietnamLabels.passport.nationality,
          helpText: vietnamLabels.passport.nationalityHelp,
          immediateSave: false,
        },
        dob: {
          fieldName: 'dob',
          required: true,
          type: 'date',
          labelKey: 'vietnam.travelInfo.fields.dob',
          defaultLabel: vietnamLabels.passport.dob,
          helpText: vietnamLabels.passport.dobHelp,
          immediateSave: true, // Critical field - save immediately
          pastOnly: true, // Birth date must be in the past
        },
        expiryDate: {
          fieldName: 'expiryDate',
          required: true,
          type: 'date',
          labelKey: 'vietnam.travelInfo.fields.expiryDate',
          defaultLabel: vietnamLabels.passport.expiryDate,
          helpText: vietnamLabels.passport.expiryDateHelp,
          immediateSave: true, // Critical field - save immediately
          futureOnly: true, // Must be valid (future date)
          minMonthsValid: 6, // Must be valid for at least 6 months
        },
        sex: {
          fieldName: 'sex',
          required: true,
          type: 'select',
          options: [
            { label: '男性', value: 'M' },
            { label: '女性', value: 'F' },
          ],
          labelKey: 'vietnam.travelInfo.fields.sex',
          defaultLabel: vietnamLabels.passport.sex,
          immediateSave: true, // Save immediately on change
        },
        visaNumber: {
          fieldName: 'visaNumber',
          required: false,
          maxLength: 20,
          labelKey: 'vietnam.travelInfo.fields.visaNumber',
          defaultLabel: vietnamLabels.passport.visaNumber,
          helpText: vietnamLabels.passport.visaNumberHelp,
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
      titleKey: 'vietnam.travelInfo.sections.personal.title',
      defaultTitle: vietnamLabels.personalInfo.title,
      subtitleKey: 'vietnam.travelInfo.sections.personal.subtitle',
      defaultSubtitle: vietnamLabels.personalInfo.subtitle,

      fields: {
        occupation: {
          fieldName: 'occupation',
          required: true,
          type: 'select',
          options: [
            { label: '学生', value: 'STUDENT' },
            { label: '商务', value: 'BUSINESS' },
            { label: '退休', value: 'RETIRED' },
            { label: '旅游', value: 'TOURISM' },
            { label: '其他', value: 'OTHER' },
          ],
          allowCustom: true,
          customFieldName: 'customOccupation',
          customLabel: vietnamLabels.personalInfo.customOccupationLabel,
          customPlaceholder: vietnamLabels.personalInfo.customOccupationPlaceholder,
          labelKey: 'vietnam.travelInfo.fields.occupation',
          defaultLabel: vietnamLabels.personalInfo.occupation,
          helpText: vietnamLabels.personalInfo.occupationHelp,
          immediateSave: false,
          uppercaseNormalize: true,
        },
        cityOfResidence: {
          fieldName: 'cityOfResidence',
          required: true,
          maxLength: 100,
          labelKey: 'vietnam.travelInfo.fields.cityOfResidence',
          defaultLabel: vietnamLabels.personalInfo.cityOfResidence,
          helpText: vietnamLabels.personalInfo.cityOfResidenceHelp,
          immediateSave: false,
          uppercaseNormalize: true,
        },
        countryOfResidence: {
          fieldName: 'countryOfResidence',
          required: true,
          type: 'countrySelect',
          labelKey: 'vietnam.travelInfo.fields.countryOfResidence',
          defaultLabel: vietnamLabels.personalInfo.countryOfResidence,
          helpText: vietnamLabels.personalInfo.countryOfResidenceHelp,
          immediateSave: false,
        },
        phoneCode: {
          fieldName: 'phoneCode',
          required: false,
          type: 'phoneCode',
          labelKey: 'vietnam.travelInfo.fields.phoneCode',
          defaultLabel: vietnamLabels.personalInfo.phoneCodeLabel,
          helpText: vietnamLabels.personalInfo.phoneCodeHelp,
          smartDefault: 'fromNationality', // Auto-fill from nationality
          immediateSave: false,
        },
        phoneNumber: {
          fieldName: 'phoneNumber',
          required: false,
          pattern: /^\d{7,15}$/,
          labelKey: 'vietnam.travelInfo.fields.phoneNumber',
          defaultLabel: vietnamLabels.personalInfo.phoneNumberLabel,
          helpText: vietnamLabels.personalInfo.phoneNumberHelp,
          validationMessage: '请输入7-15位数字的电话号码',
          immediateSave: false,
        },
        email: {
          fieldName: 'email',
          required: false,
          format: 'email',
          labelKey: 'vietnam.travelInfo.fields.email',
          defaultLabel: vietnamLabels.personalInfo.email,
          helpText: vietnamLabels.personalInfo.emailHelp,
          placeholder: vietnamLabels.personalInfo.emailPlaceholder,
          validationMessage: vietnamLabels.validation.invalidEmail,
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
      titleKey: 'vietnam.travelInfo.sections.funds.title',
      defaultTitle: vietnamLabels.funds.title,
      subtitleKey: 'vietnam.travelInfo.sections.funds.subtitle',
      defaultSubtitle: vietnamLabels.funds.subtitle,
      minRequired: 1,
      maxAllowed: 10,

      types: [
        { value: 'CASH_VND', label: '越南盾现金', defaultAmount: 10000000 },
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

      showPhotos: false, // Vietnam doesn't require fund photos
    },

    // ------------------------------
    // TRAVEL DETAILS SECTION
    // ------------------------------
    travel: {
      enabled: true,
      icon: '✈️',
      sectionKey: 'travel',
      titleKey: 'vietnam.travelInfo.sections.travel.title',
      defaultTitle: vietnamLabels.travelDetails.title,
      subtitleKey: 'vietnam.travelInfo.sections.travel.subtitle',
      defaultSubtitle: vietnamLabels.travelDetails.subtitle,

      fields: {
        travelPurpose: {
          fieldName: 'travelPurpose',
          required: true,
          type: 'select',
          options: [
            { label: '旅游', value: 'TOURISM' },
            { label: '商务', value: 'BUSINESS' },
            { label: '探亲访友', value: 'FAMILY_VISIT' },
            { label: '学习', value: 'EDUCATION' },
            { label: '其他', value: 'OTHER' },
          ],
          allowCustom: true,
          customFieldName: 'customTravelPurpose',
          customLabel: vietnamLabels.travelDetails.customTravelPurposeLabel,
          customPlaceholder: vietnamLabels.travelDetails.customTravelPurposePlaceholder,
          labelKey: 'vietnam.travelInfo.fields.travelPurpose',
          defaultLabel: vietnamLabels.travelDetails.travelPurpose,
          helpText: vietnamLabels.travelDetails.travelPurposeHelp,
          smartDefault: 'TOURISM',
          immediateSave: false,
        },
        recentStayCountry: {
          fieldName: 'recentStayCountry',
          required: false,
          type: 'countrySelect',
          labelKey: 'vietnam.travelInfo.fields.recentStayCountry',
          defaultLabel: vietnamLabels.travelDetails.recentStayCountry,
          helpText: vietnamLabels.travelDetails.recentStayCountryHelp,
          immediateSave: true, // Important for health screening
        },
        boardingCountry: {
          fieldName: 'boardingCountry',
          required: true,
          type: 'countrySelect',
          labelKey: 'vietnam.travelInfo.fields.boardingCountry',
          defaultLabel: vietnamLabels.travelDetails.boardingCountry,
          helpText: vietnamLabels.travelDetails.boardingCountryHelp,
          smartDefault: 'fromNationality',
          immediateSave: false,
        },
        arrivalFlightNumber: {
          fieldName: 'arrivalFlightNumber',
          required: true,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'vietnam.travelInfo.fields.arrivalFlightNumber',
          defaultLabel: vietnamLabels.travelDetails.arrivalFlightNumber,
          helpText: vietnamLabels.travelDetails.arrivalFlightNumberHelp,
          placeholder: vietnamLabels.travelDetails.arrivalFlightNumberPlaceholder,
          uppercaseNormalize: true,
          immediateSave: false,
        },
        arrivalDate: {
          fieldName: 'arrivalDate',
          required: true,
          type: 'datetime',
          labelKey: 'vietnam.travelInfo.fields.arrivalDate',
          defaultLabel: vietnamLabels.travelDetails.arrivalDate,
          helpText: vietnamLabels.travelDetails.arrivalDateHelp,
          futureOnly: true,
          smartDefault: 'tomorrow',
          immediateSave: true, // Critical field
        },
        departureFlightNumber: {
          fieldName: 'departureFlightNumber',
          required: false,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'vietnam.travelInfo.fields.departureFlightNumber',
          defaultLabel: vietnamLabels.travelDetails.departureFlightNumber,
          helpText: vietnamLabels.travelDetails.departureFlightNumberHelp,
          placeholder: vietnamLabels.travelDetails.departureFlightNumberPlaceholder,
          uppercaseNormalize: true,
          immediateSave: false,
        },
        departureDate: {
          fieldName: 'departureDate',
          required: false,
          type: 'datetime',
          labelKey: 'vietnam.travelInfo.fields.departureDate',
          defaultLabel: vietnamLabels.travelDetails.departureDate,
          helpText: vietnamLabels.travelDetails.departureDateHelp,
          smartDefault: 'nextWeek',
          immediateSave: true, // Critical field
        },
        isTransitPassenger: {
          fieldName: 'isTransitPassenger',
          required: false,
          type: 'boolean',
          labelKey: 'vietnam.travelInfo.fields.isTransitPassenger',
          defaultLabel: vietnamLabels.travelDetails.isTransitPassenger,
          default: false,
          immediateSave: true,
        },
        accommodationType: {
          fieldName: 'accommodationType',
          required: true,
          type: 'select',
          options: vietnamConfig.travelDetails.accommodationOptions,
          allowCustom: true,
          customFieldName: 'customAccommodationType',
          customLabel: vietnamLabels.travelDetails.customAccommodationType,
          labelKey: 'vietnam.travelInfo.fields.accommodationType',
          defaultLabel: vietnamLabels.travelDetails.accommodationType,
          helpText: vietnamLabels.travelDetails.accommodationTypeHelp,
          smartDefault: 'HOTEL',
          immediateSave: false,
        },

        // Location fields (2-level hierarchy for Vietnam)
        province: {
          fieldName: 'province',
          required: true,
          type: 'location',
          level: 1,
          labelKey: 'vietnam.travelInfo.fields.province',
          defaultLabel: vietnamLabels.travelDetails.province,
          helpText: vietnamLabels.travelDetails.provinceHelp,
          placeholder: vietnamLabels.travelDetails.provincePlaceholder,
          immediateSave: false,
        },
        district: {
          fieldName: 'district',
          required: true,
          type: 'location',
          level: 2,
          dependsOn: 'province',
          labelKey: 'vietnam.travelInfo.fields.district',
          defaultLabel: vietnamLabels.travelDetails.district,
          helpText: vietnamLabels.travelDetails.districtHelp,
          placeholder: vietnamLabels.travelDetails.districtPlaceholder,
          immediateSave: false,
        },
        hotelAddress: {
          fieldName: 'hotelAddress',
          required: true,
          maxLength: 200,
          multiline: true,
          labelKey: 'vietnam.travelInfo.fields.hotelAddress',
          defaultLabel: vietnamLabels.travelDetails.hotelAddress,
          helpText: vietnamLabels.travelDetails.hotelAddressHelp,
          placeholder: vietnamLabels.travelDetails.hotelAddressPlaceholder,
          immediateSave: false,
        },
      },

      // Location hierarchy configuration
      locationHierarchy: {
        levels: 2, // Vietnam: Province → District (2 levels, no subDistrict)
        // Direct data/functions (no dynamic import - React Native doesn't support it)
        provincesData: vietnamProvinces,
        getDistrictsFunc: getDistrictsByProvince,
        labels: {
          level1: { key: 'vietnam.locations.province', default: '省份/城市' },
          level2: { key: 'vietnam.locations.district', default: '区/郡' },
        },
      },

      // Photo uploads - disabled for Vietnam
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
    mode: 'standard', // 'standard' or 'thailand' (thailand has special rules)
    validateOnBlur: true,
    showWarnings: true, // Show soft warnings vs only hard errors

    // Completion requirements
    minCompletionPercent: 70,
    requiredSections: ['passport'], // At minimum, passport must be complete

    // Custom validation rules (can be extended)
    customRules: {},
  },

  // ============================================
  // FEATURES (Thailand-style)
  // ============================================
  features: {
    // Data persistence (V2 structure)
    autoSave: {
      enabled: true,
      delay: 1000, // 1 second debounce (Vietnam uses 1s, Thailand uses 2s)

      // Critical fields that save immediately (bypass debounce)
      // These are identity/date fields that should persist right away
      immediateSaveFields: [
        'dob',
        'expiryDate',
        'sex',
        'nationality',
        'issueDate',
        'arrivalDate',
        'departureDate',
      ],
    },

    // UI features
    saveStatusIndicator: true, // Show ⏳💾✅❌ status
    lastEditedTimestamp: true, // Show "Last edited: HH:MM:SS"
    privacyNotice: true, // Show "💾 Data stored locally"

    // Advanced features
    scrollPositionRestore: true,
    fieldStateTracking: true, // Track user-modified vs. pre-filled fields
    sessionStateManagement: false, // Vietnam doesn't need this (simpler)
    performanceMonitoring: false, // Vietnam doesn't need this
    errorHandlingWithRetry: true,

    // Smart features
    smartDefaults: true, // Auto-fill common fields (tomorrow, next week, from nationality)
    smartButton: true, // Dynamic button label based on completion

    // Removed features
    progressOverview: false, // NO ProgressOverviewCard (following Thailand model)
  },

  // ============================================
  // NAVIGATION
  // ============================================
  navigation: {
    previous: 'VietnamRequirements',
    next: 'VietnamEntryFlow',
    saveBeforeNavigate: true, // Auto-save before navigation

    // Smart button configuration (V2 feature)
    submitButton: {
      dynamic: true, // Enable smart button with dynamic labels

      // Thresholds for label changes (0-1 scale)
    thresholds: {
      incomplete: 0.7,   // Below 70% shows "incomplete" label
      almostDone: 0.9,   // 70-90% shows "almostDone" label
      ready: 0.9,        // 90%+ shows "ready" label
    },

    // Labels for each state (using translation keys)
    labels: {
      incomplete: 'vn.navigation.submitButton.incomplete',
      almostDone: 'vn.navigation.submitButton.almostDone',
      ready: 'vn.navigation.submitButton.ready',
    },

    // Default fallback if dynamic is disabled
    default: 'vn.navigation.submitButton.default',
    },

    // Deprecated - kept for backward compatibility
    submitButtonLabel: {
      key: 'vietnam.travelInfo.submitButton',
      default: '继续',
    },
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
    trackTimeSpent: false, // Vietnam doesn't need this
  },

  // ============================================
  // I18N
  // ============================================
  i18n: {
    namespace: 'vietnam.travelInfo',
    fallbackLanguage: 'zh-CN',
    labelSource: {
      passport: {
        // Title resolved via titleKey in section config
        subtitle: vietnamLabels.passport.subtitle,
        introText: vietnamLabels.passport.introText,
      },
      personal: {
        // Title resolved via titleKey in section config
        subtitle: vietnamLabels.personalInfo.subtitle,
        introText: vietnamLabels.personalInfo.introText,
      },
      funds: {
        // Title resolved via titleKey in section config
        subtitle: vietnamLabels.funds.subtitle,
        introText: vietnamLabels.funds.introText,
      },
      travel: {
        // Title resolved via titleKey in section config
        subtitle: vietnamLabels.travelDetails.subtitle,
        introText: vietnamLabels.travelDetails.introText,
      },
    },
  },
};

export default vietnamComprehensiveTravelInfoConfig;
