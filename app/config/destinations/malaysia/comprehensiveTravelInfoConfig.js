/**
 * Comprehensive Malaysia Travel Info Configuration
 *
 * Malaysia implementation of EnhancedTravelInfoTemplate V2.
 * Mirrors the Vietnam setup but with MDAC-specific copy and fields.
 */

import { malaysiaLabels, malaysiaConfig } from '../../labels/malaysia';
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
    type: 'rich',
    title: '马来西亚入境准备指南',
    titleEn: 'Malaysia Entry Preparation Guide',
    subtitle: '3分钟搞定 MDAC，安心入境！',
    subtitleEn: 'Complete MDAC in 3 minutes, stress-free entry!',
    gradient: {
      colors: ['#1D4ED8', '#1E3A8A'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    valuePropositions: [
      { icon: '⏱️', text: '3分钟填写', textEn: '3 minutes to complete' },
      { icon: '🛂', text: '自动提醒提交时间', textEn: 'Smart MDAC reminders' },
      { icon: '🔒', text: '离线保存，安心备份', textEn: 'Offline friendly, secure storage' },
    ],
    beginnerTip: {
      icon: '💡',
      text: 'MDAC 必须在抵达前3天内提交。我们会提醒最佳时间，确保不超时、不太早。',
      textEn: 'MDAC must be submitted within 3 days before arrival. We remind you at the perfect time.',
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
          defaultLabel: malaysiaLabels.passport.surnameLabel || '姓 - Surname',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        middleName: {
          fieldName: 'middleName',
          required: false,
          maxLength: 50,
          labelKey: 'malaysia.travelInfo.fields.middleName',
          defaultLabel: malaysiaLabels.passport.middleNameLabel || '中间名 - Middle Name',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        givenName: {
          fieldName: 'givenName',
          required: true,
          maxLength: 50,
          labelKey: 'malaysia.travelInfo.fields.givenName',
          defaultLabel: malaysiaLabels.passport.givenNameLabel || '名 - Given Name',
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
            { label: '上班族 - Office Worker', value: 'OFFICE' },
            { label: '自由职业 - Freelancer', value: 'FREELANCER' },
            { label: '学生 - Student', value: 'STUDENT' },
            { label: '个体户 - Self-employed', value: 'SELF_EMPLOYED' },
            { label: '家庭主妇 - Homemaker', value: 'HOMEMAKER' },
            { label: '退休 - Retired', value: 'RETIRED' },
            { label: '其他 - Other', value: 'OTHER' },
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
            { label: '旅游 - Tourism', value: 'TOURISM' },
            { label: '商务 - Business', value: 'BUSINESS' },
            { label: '探亲访友 - Visiting Relatives', value: 'VISITING_RELATIVES' },
            { label: '过境 - Transit', value: 'TRANSIT' },
            { label: '其他 - Other', value: 'OTHER' },
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
          level1: { key: 'malaysia.locations.state', default: '州/State' },
          level2: { key: 'malaysia.locations.district', default: '城市/地区' },
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
        message: '抵达日期需在未来30天内，以便符合 MDAC 提交时间。',
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
      dynamic: true,
      thresholds: {
        editing: 0.6,
        ready: 1.0,
      },
      labels: {
        default: '继续填写',
        editing: '准备差一点点，继续加油 💪',
        ready: '前往 MDAC 提交 🇲🇾',
      },
      readyAction: {
        type: 'navigate',
        screen: 'MalaysiaEntryFlow',
      },
    },
  },
};

export default malaysiaComprehensiveTravelInfoConfig;
