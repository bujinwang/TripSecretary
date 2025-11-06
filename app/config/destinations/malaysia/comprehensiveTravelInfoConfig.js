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
    title: '马来西亚入境准备指南',
    subtitle: '3分钟完成MDAC，轻松入境！',

    gradient: {
      colors: ['#1D4ED8', '#1E3A8A'], // Malaysia blue gradient
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },

    valuePropositions: [
      { icon: '⏱️', text: '3分钟完成' },
      { icon: '🛂', text: '智能MDAC提醒' },
      { icon: '🔒', text: '离线友好，安全存储' },
    ],

    beginnerTip: {
      icon: '💡',
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
      titleKey: 'malaysia.travelInfo.sections.passport.title',
      defaultTitle: malaysiaLabels.passport.title,
      fields: {
        surname: {
          fieldName: 'surname',
          required: true,
          maxLength: 50,
          labelKey: 'malaysia.travelInfo.fields.surname',
          defaultLabel: malaysiaLabels.passport.surnameLabel || '姓',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        middleName: {
          fieldName: 'middleName',
          required: false,
          maxLength: 50,
          labelKey: 'malaysia.travelInfo.fields.middleName',
          defaultLabel: malaysiaLabels.passport.middleNameLabel || '中间名',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        givenName: {
          fieldName: 'givenName',
          required: true,
          maxLength: 50,
          labelKey: 'malaysia.travelInfo.fields.givenName',
          defaultLabel: malaysiaLabels.passport.givenNameLabel || '名',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        passportNo: {
          fieldName: 'passportNo',
          required: true,
          pattern: /^[A-Z0-9]{5,20}$/,
          labelKey: 'malaysia.travelInfo.fields.passportNo',
          defaultLabel: malaysiaLabels.passport.passportNo,
          helpText: malaysiaLabels.passport.passportNoHelp,
          immediateSave: false,
          uppercaseNormalize: true,
        },
        nationality: {
          fieldName: 'nationality',
          required: true,
          type: 'countrySelect',
          labelKey: 'malaysia.travelInfo.fields.nationality',
          defaultLabel: malaysiaLabels.passport.nationality,
          helpText: malaysiaLabels.passport.nationalityHelp,
          immediateSave: true,
        },
        dob: {
          fieldName: 'dob',
          required: true,
          type: 'date',
          labelKey: 'malaysia.travelInfo.fields.dob',
          defaultLabel: malaysiaLabels.passport.dob,
          helpText: malaysiaLabels.passport.dobHelp,
          immediateSave: true,
          pastOnly: true,
        },
        expiryDate: {
          fieldName: 'expiryDate',
          required: true,
          type: 'date',
          labelKey: 'malaysia.travelInfo.fields.expiryDate',
          defaultLabel: malaysiaLabels.passport.expiryDate,
          helpText: malaysiaLabels.passport.expiryDateHelp,
          immediateSave: true,
          futureOnly: true,
          minMonthsValid: 6,
        },
        sex: {
          fieldName: 'sex',
          required: true,
          type: 'select',
          options: malaysiaConfig.passport.genderOptions,
          labelKey: 'malaysia.travelInfo.fields.sex',
          defaultLabel: malaysiaLabels.passport.sex,
          immediateSave: true,
        },
        visaNumber: {
          fieldName: 'visaNumber',
          required: false,
          maxLength: 20,
          labelKey: 'malaysia.travelInfo.fields.visaNumber',
          defaultLabel: malaysiaLabels.passport.visaNumber,
          helpText: malaysiaLabels.passport.visaNumberHelp,
          immediateSave: false,
        },
      },
    },

    // PERSONAL SECTION
    personal: {
      enabled: true,
      icon: '👤',
      sectionKey: 'personal',
      titleKey: 'malaysia.travelInfo.sections.personal.title',
      defaultTitle: malaysiaLabels.personalInfo.title,
      fields: {
        occupation: {
          fieldName: 'occupation',
          required: true,
          type: 'select',
          options: [
            { labelKey: 'malaysia.travelInfo.personal.occupationOptions.OFFICE', defaultLabel: '上班族', value: 'OFFICE' },
            { labelKey: 'malaysia.travelInfo.personal.occupationOptions.FREELANCER', defaultLabel: '自由职业者', value: 'FREELANCER' },
            { labelKey: 'malaysia.travelInfo.personal.occupationOptions.STUDENT', defaultLabel: '学生', value: 'STUDENT' },
            { labelKey: 'malaysia.travelInfo.personal.occupationOptions.SELF_EMPLOYED', defaultLabel: '个体经营', value: 'SELF_EMPLOYED' },
            { labelKey: 'malaysia.travelInfo.personal.occupationOptions.HOMEMAKER', defaultLabel: '家庭主妇/主夫', value: 'HOMEMAKER' },
            { labelKey: 'malaysia.travelInfo.personal.occupationOptions.RETIRED', defaultLabel: '退休人员', value: 'RETIRED' },
            { labelKey: 'malaysia.travelInfo.personal.occupationOptions.OTHER', defaultLabel: '其他', value: 'OTHER' },
          ],
          allowCustom: true,
          customFieldName: 'customOccupation',
          customLabel: malaysiaLabels.personalInfo.customOccupationLabel,
          customPlaceholder: malaysiaLabels.personalInfo.customOccupationPlaceholder,
          labelKey: 'malaysia.travelInfo.fields.occupation',
          defaultLabel: malaysiaLabels.personalInfo.occupation,
          helpText: malaysiaLabels.personalInfo.occupationHelp,
          immediateSave: false,
          uppercaseNormalize: true,
        },
        cityOfResidence: {
          fieldName: 'cityOfResidence',
          required: true,
          maxLength: 80,
          labelKey: 'malaysia.travelInfo.fields.cityOfResidence',
          defaultLabel: malaysiaLabels.personalInfo.cityOfResidence,
          helpText: malaysiaLabels.personalInfo.cityOfResidenceHelp,
          immediateSave: false,
          uppercaseNormalize: true,
        },
        residentCountry: {
          fieldName: 'residentCountry',
          required: true,
          type: 'countrySelect',
          labelKey: 'malaysia.travelInfo.fields.countryOfResidence',
          defaultLabel: malaysiaLabels.personalInfo.countryOfResidence,
          helpText: malaysiaLabels.personalInfo.countryOfResidenceHelp,
          immediateSave: true,
        },
        phoneCode: {
          fieldName: 'phoneCode',
          required: true,
          type: 'phoneCode',
          labelKey: 'malaysia.travelInfo.fields.phoneCode',
          defaultLabel: malaysiaLabels.personalInfo.phoneCodeLabel,
          helpText: malaysiaLabels.personalInfo.phoneCodeHelp,
          immediateSave: true,
        },
        phoneNumber: {
          fieldName: 'phoneNumber',
          required: true,
          pattern: /^[0-9]{6,15}$/,
          labelKey: 'malaysia.travelInfo.fields.phoneNumber',
          defaultLabel: malaysiaLabels.personalInfo.phoneNumberLabel,
          helpText: malaysiaLabels.personalInfo.phoneNumberHelp,
          immediateSave: true,
        },
        email: {
          fieldName: 'email',
          required: true,
          format: 'email',
          labelKey: 'malaysia.travelInfo.fields.email',
          defaultLabel: malaysiaLabels.personalInfo.email,
          helpText: malaysiaLabels.personalInfo.emailHelp,
          placeholder: malaysiaLabels.personalInfo.emailPlaceholder,
          immediateSave: false,
        },
      },
    },

    // FUNDS SECTION
    funds: {
      enabled: true,
      icon: '💰',
      sectionKey: 'funds',
      titleKey: 'malaysia.travelInfo.sections.funds.title',
      defaultTitle: malaysiaLabels.funds.title,
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
      titleKey: 'malaysia.travelInfo.sections.travel.title',
      defaultTitle: malaysiaLabels.travelDetails.title,
      fields: {
        travelPurpose: {
          fieldName: 'travelPurpose',
          required: true,
          type: 'select',
          options: [
            { labelKey: 'malaysia.travelInfo.travel.travelPurposeOptions.TOURISM', defaultLabel: '旅游', value: 'TOURISM' },
            { labelKey: 'malaysia.travelInfo.travel.travelPurposeOptions.BUSINESS', defaultLabel: '商务', value: 'BUSINESS' },
            { labelKey: 'malaysia.travelInfo.travel.travelPurposeOptions.VISITING_RELATIVES', defaultLabel: '探亲访友', value: 'VISITING_RELATIVES' },
            { labelKey: 'malaysia.travelInfo.travel.travelPurposeOptions.TRANSIT', defaultLabel: '过境', value: 'TRANSIT' },
            { labelKey: 'malaysia.travelInfo.travel.travelPurposeOptions.OTHER', defaultLabel: '其他', value: 'OTHER' },
          ],
          allowCustom: true,
          customFieldName: 'customTravelPurpose',
          customLabel: malaysiaLabels.travelDetails.customTravelPurposeLabel,
          customPlaceholder: malaysiaLabels.travelDetails.customTravelPurposePlaceholder,
          labelKey: 'malaysia.travelInfo.fields.travelPurpose',
          defaultLabel: malaysiaLabels.travelDetails.travelPurpose,
          helpText: malaysiaLabels.travelDetails.travelPurposeHelp,
          smartDefault: 'TOURISM',
          immediateSave: false,
        },
        recentStayCountry: {
          fieldName: 'recentStayCountry',
          required: false,
          type: 'countrySelect',
          labelKey: 'malaysia.travelInfo.fields.recentStayCountry',
          defaultLabel: malaysiaLabels.travelDetails.recentStayCountry,
          helpText: malaysiaLabels.travelDetails.recentStayCountryHelp,
          immediateSave: true,
        },
        boardingCountry: {
          fieldName: 'boardingCountry',
          required: true,
          type: 'countrySelect',
          labelKey: 'malaysia.travelInfo.fields.boardingCountry',
          defaultLabel: malaysiaLabels.travelDetails.boardingCountry,
          helpText: malaysiaLabels.travelDetails.boardingCountryHelp,
          smartDefault: 'fromNationality',
          immediateSave: false,
        },
        arrivalFlightNumber: {
          fieldName: 'arrivalFlightNumber',
          required: true,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'malaysia.travelInfo.fields.arrivalFlightNumber',
          defaultLabel: malaysiaLabels.travelDetails.arrivalFlightNumber,
          helpText: malaysiaLabels.travelDetails.arrivalFlightNumberHelp,
          placeholder: malaysiaLabels.travelDetails.arrivalFlightNumberPlaceholder,
          immediateSave: false,
          uppercaseNormalize: true,
        },
        arrivalDate: {
          fieldName: 'arrivalDate',
          required: true,
          type: 'datetime',
          labelKey: 'malaysia.travelInfo.fields.arrivalDate',
          defaultLabel: malaysiaLabels.travelDetails.arrivalDate,
          helpText: malaysiaLabels.travelDetails.arrivalDateHelp,
          futureOnly: true,
          smartDefault: 'tomorrow',
          immediateSave: true,
        },
        departureFlightNumber: {
          fieldName: 'departureFlightNumber',
          required: false,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'malaysia.travelInfo.fields.departureFlightNumber',
          defaultLabel: malaysiaLabels.travelDetails.departureFlightNumber,
          helpText: malaysiaLabels.travelDetails.departureFlightNumberHelp,
          placeholder: malaysiaLabels.travelDetails.departureFlightNumberPlaceholder,
          immediateSave: false,
          uppercaseNormalize: true,
        },
        departureDate: {
          fieldName: 'departureDate',
          required: false,
          type: 'datetime',
          labelKey: 'malaysia.travelInfo.fields.departureDate',
          defaultLabel: malaysiaLabels.travelDetails.departureDate,
          helpText: malaysiaLabels.travelDetails.departureDateHelp,
          smartDefault: 'nextWeek',
          immediateSave: true,
        },
        isTransitPassenger: {
          fieldName: 'isTransitPassenger',
          required: false,
          type: 'boolean',
          labelKey: 'malaysia.travelInfo.fields.isTransitPassenger',
          defaultLabel: malaysiaLabels.travelDetails.isTransitPassenger,
          yesLabel: malaysiaLabels.travelDetails.transitYes,
          noLabel: malaysiaLabels.travelDetails.transitNo,
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
          customLabel: malaysiaLabels.travelDetails.customAccommodationType,
          labelKey: 'malaysia.travelInfo.fields.accommodationType',
          defaultLabel: malaysiaLabels.travelDetails.accommodationType,
          helpText: malaysiaLabels.travelDetails.accommodationTypeHelp,
          smartDefault: 'HOTEL',
          immediateSave: false,
        },
        province: {
          fieldName: 'province',
          required: true,
          type: 'location',
          level: 1,
          labelKey: 'malaysia.travelInfo.fields.province',
          defaultLabel: malaysiaLabels.travelDetails.province,
          helpText: malaysiaLabels.travelDetails.provinceHelp,
          placeholder: malaysiaLabels.travelDetails.provincePlaceholder,
          immediateSave: false,
        },
        district: {
          fieldName: 'district',
          required: true,
          type: 'location',
          level: 2,
          dependsOn: 'province',
          labelKey: 'malaysia.travelInfo.fields.district',
          defaultLabel: malaysiaLabels.travelDetails.district,
          helpText: malaysiaLabels.travelDetails.districtHelp,
          placeholder: malaysiaLabels.travelDetails.districtPlaceholder,
          immediateSave: false,
        },
        hotelAddress: {
          fieldName: 'hotelAddress',
          required: true,
          maxLength: 200,
          multiline: true,
          labelKey: 'malaysia.travelInfo.fields.hotelAddress',
          defaultLabel: malaysiaLabels.travelDetails.hotelAddress,
          helpText: malaysiaLabels.travelDetails.hotelAddressHelp,
          placeholder: malaysiaLabels.travelDetails.hotelAddressPlaceholder,
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
        messageKey: 'malaysia.travelInfo.validation.arrivalDateWithinWindow',
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

      // Labels for each state
      labels: {
        incomplete: '完成必填项',
        almostDone: '快完成了',
        ready: '继续',
      },

      // Default fallback if dynamic is disabled
      default: '继续',

      readyAction: {
        type: 'navigate',
        screen: 'MalaysiaEntryFlow',
      },
    },

    // Fallback submit button label
    submitButtonLabel: {
      key: 'malaysia.travelInfo.continue',
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
