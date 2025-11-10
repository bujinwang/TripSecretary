// @ts-nocheck

/**
 * Singapore Travel Info Configuration
 *
 * Structured to work with the shared TravelInfo templates (V1/V2).
 */

import { singaporeLabels, singaporeConfig } from '../../../config/labels/singapore';
import { singaporeRegions } from '../../../data/singaporeRegions';

export const singaporeTravelInfoConfig = {
  destinationId: 'sg',
  name: 'Singapore',
  nameZh: '新加坡',
  flag: '🇸🇬',

  colors: {
    background: '#F5F7FB',
    primary: '#F97316',
  },

  screens: {
    current: 'SingaporeTravelInfo',
    next: 'SingaporeEntryFlow',
    previous: 'SingaporeRequirements',
  },

  hero: {
    type: 'rich',
    titleKey: 'sg.travelInfo.hero.title',
    defaultTitle: '新加坡入境信息中心',
    subtitleKey: 'sg.travelInfo.hero.subtitle',
    defaultSubtitle: '一次填好护照、行程与住宿信息',
    gradient: {
      colors: ['#F97316', '#FB923C'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    valuePropositions: [
      {
        icon: '⚡',
        textKey: 'sg.travelInfo.hero.valuePropositions.smartReminder',
        defaultText: '智能提醒提交 SG Arrival Card',
      },
      {
        icon: '👨‍👩‍👧',
        textKey: 'sg.travelInfo.hero.valuePropositions.familyMode',
        defaultText: '家庭成员信息一站式管理',
      },
      {
        icon: '🔒',
        textKey: 'sg.travelInfo.hero.valuePropositions.offlineSecurity',
        defaultText: '信息离线保存，可随时查看',
      },
    ],
    beginnerTip: {
      icon: '💡',
      textKey: 'sg.travelInfo.hero.beginnerTip',
      defaultText: '温馨提示：入境前3天内提交 SG Arrival Card，最佳时间我们会提醒您。',
    },
  },

  sections: {
    passport: {
      enabled: true,
      icon: singaporeLabels.passport.icon,
      sectionKey: 'passport',
      titleKey: 'sg.travelInfo.sections.passport.title',
      defaultTitle: singaporeLabels.passport.title,
      fields: {
        surname: {
          fieldName: 'surname',
          required: true,
          maxLength: 50,
          labelKey: 'sg.travelInfo.fields.surname.label',
          defaultLabel: singaporeLabels.passport.fullName,
          helpText: singaporeLabels.passport.fullNameHelp,
          uppercaseNormalize: true,
        },
        middleName: {
          fieldName: 'middleName',
          required: false,
          maxLength: 50,
          labelKey: 'sg.travelInfo.fields.middleName.label',
          defaultLabel: '护照中间名 - Middle Name',
          uppercaseNormalize: true,
        },
        givenName: {
          fieldName: 'givenName',
          required: true,
          maxLength: 50,
          labelKey: 'sg.travelInfo.fields.givenName.label',
          defaultLabel: '护照名字 - Given Name',
          uppercaseNormalize: true,
        },
        passportNo: {
          fieldName: 'passportNo',
          required: true,
          pattern: /^[A-Z0-9]{5,20}$/,
          labelKey: 'sg.travelInfo.fields.passportNo.label',
          defaultLabel: singaporeLabels.passport.passportNo,
          helpText: singaporeLabels.passport.passportNoHelp,
          uppercaseNormalize: true,
        },
        nationality: {
          fieldName: 'nationality',
          required: true,
          type: 'countrySelect',
          labelKey: 'sg.travelInfo.fields.nationality.label',
          defaultLabel: singaporeLabels.passport.nationality,
          helpText: singaporeLabels.passport.nationalityHelp,
          immediateSave: true,
        },
        dob: {
          fieldName: 'dob',
          required: true,
          type: 'date',
          labelKey: 'sg.travelInfo.fields.dob.label',
          defaultLabel: singaporeLabels.passport.dob,
          helpText: singaporeLabels.passport.dobHelp,
          pastOnly: true,
          immediateSave: true,
        },
        expiryDate: {
          fieldName: 'expiryDate',
          required: true,
          type: 'date',
          labelKey: 'sg.travelInfo.fields.expiryDate.label',
          defaultLabel: singaporeLabels.passport.expiryDate,
          helpText: singaporeLabels.passport.expiryDateHelp,
          futureOnly: true,
          minMonthsValid: 6,
          immediateSave: true,
        },
        sex: {
          fieldName: 'sex',
          required: true,
          type: 'select',
          options: singaporeConfig.passport.genderOptions,
          labelKey: 'sg.travelInfo.fields.sex.label',
          defaultLabel: singaporeLabels.passport.sex,
          immediateSave: true,
        },
        visaNumber: {
          fieldName: 'visaNumber',
          required: false,
          maxLength: 30,
          labelKey: 'sg.travelInfo.fields.visaNumber.label',
          defaultLabel: singaporeLabels.passport.visaNumber,
          helpText: singaporeLabels.passport.visaNumberHelp,
          uppercaseNormalize: true,
        },
      },
    },

    personal: {
      enabled: true,
      icon: singaporeLabels.personalInfo.icon,
      sectionKey: 'personal',
      titleKey: 'sg.travelInfo.sections.personal.title',
      defaultTitle: singaporeLabels.personalInfo.title,
      fields: {
        occupation: {
          fieldName: 'occupation',
          required: true,
          type: 'select',
          options: [
            { value: 'OFFICE', defaultLabel: '上班族 / Office' },
            { value: 'STUDENT', defaultLabel: '学生 / Student' },
            { value: 'SELF_EMPLOYED', defaultLabel: '自由职业 / Self-employed' },
            { value: 'HOMEMAKER', defaultLabel: '全职家庭 / Homemaker' },
            { value: 'RETIRED', defaultLabel: '退休 / Retired' },
            { value: 'OTHER', defaultLabel: '其他 / Other' },
          ],
          allowCustom: true,
          customFieldName: 'customOccupation',
          customLabel: singaporeLabels.personalInfo.customOccupationLabel,
          customPlaceholder: singaporeLabels.personalInfo.customOccupationPlaceholder,
          labelKey: 'sg.travelInfo.fields.occupation.label',
          defaultLabel: singaporeLabels.personalInfo.occupation,
          helpText: singaporeLabels.personalInfo.occupationHelp,
        },
        cityOfResidence: {
          fieldName: 'cityOfResidence',
          required: true,
          maxLength: 80,
          labelKey: 'sg.travelInfo.fields.cityOfResidence.label',
          defaultLabel: singaporeLabels.personalInfo.cityOfResidence,
          helpText: singaporeLabels.personalInfo.cityOfResidenceHelp,
          uppercaseNormalize: true,
        },
        countryOfResidence: {
          fieldName: 'countryOfResidence',
          required: true,
          type: 'countrySelect',
          labelKey: 'sg.travelInfo.fields.countryOfResidence.label',
          defaultLabel: singaporeLabels.personalInfo.countryOfResidence,
          helpText: singaporeLabels.personalInfo.countryOfResidenceHelp,
          immediateSave: true,
        },
        phoneCode: {
          fieldName: 'phoneCode',
          required: true,
          type: 'phoneCode',
          labelKey: 'sg.travelInfo.fields.phoneCode.label',
          defaultLabel: singaporeLabels.personalInfo.phoneCodeLabel,
          helpText: singaporeLabels.personalInfo.phoneCodeHelp,
          default: '+65',
          immediateSave: true,
        },
        phoneNumber: {
          fieldName: 'phoneNumber',
          required: true,
          pattern: /^[0-9]{6,15}$/,
          labelKey: 'sg.travelInfo.fields.phoneNumber.label',
          defaultLabel: singaporeLabels.personalInfo.phoneNumberLabel,
          helpText: singaporeLabels.personalInfo.phoneNumberHelp,
        },
        email: {
          fieldName: 'email',
          required: false,
          type: 'email',
          labelKey: 'sg.travelInfo.fields.email.label',
          defaultLabel: singaporeLabels.personalInfo.email,
          helpText: singaporeLabels.personalInfo.emailHelp,
        },
      },
    },

    funds: {
      enabled: true,
      icon: singaporeLabels.funds.icon,
      sectionKey: 'funds',
      titleKey: 'sg.travelInfo.sections.funds.title',
      defaultTitle: singaporeLabels.funds.title,
      minRequired: 1,
      maxAllowed: 6,
      fundTypes: singaporeConfig.funds.fundTypes,
      allowPhoto: singaporeConfig.funds.showPhotos,
      labels: {
        addFundTitle: singaporeLabels.funds.addFundTitle,
        emptyTitle: singaporeLabels.funds.emptyTitle,
        emptyMessage: singaporeLabels.funds.emptyMessage,
      },
    },

    travel: {
      enabled: true,
      icon: singaporeLabels.travelDetails.icon,
      sectionKey: 'travel',
      titleKey: 'sg.travelInfo.sections.travel.title',
      defaultTitle: singaporeLabels.travelDetails.title,
      fields: {
        travelPurpose: {
          fieldName: 'travelPurpose',
          required: true,
          type: 'select',
          options: [
            { value: 'TOURISM', defaultLabel: '旅游 / Tourism' },
            { value: 'BUSINESS', defaultLabel: '商务 / Business' },
            { value: 'VISIT_FAMILY', defaultLabel: '探亲 / Visit Family' },
            { value: 'MEDICAL', defaultLabel: '医疗 / Medical' },
            { value: 'OTHER', defaultLabel: '其他 / Other' },
          ],
          allowCustom: true,
          customFieldName: 'customTravelPurpose',
          customLabel: singaporeLabels.travelDetails.customTravelPurposeLabel,
          customPlaceholder: singaporeLabels.travelDetails.customTravelPurposePlaceholder,
          labelKey: 'sg.travelInfo.fields.travelPurpose.label',
          defaultLabel: singaporeLabels.travelDetails.travelPurpose,
          helpText: singaporeLabels.travelDetails.travelPurposeHelp,
        },
        recentStayCountry: {
          fieldName: 'recentStayCountry',
          required: false,
          type: 'countrySelect',
          labelKey: 'sg.travelInfo.fields.recentStayCountry.label',
          defaultLabel: singaporeLabels.travelDetails.recentStayCountry,
          helpText: singaporeLabels.travelDetails.recentStayCountryHelp,
          immediateSave: true,
        },
        boardingCountry: {
          fieldName: 'boardingCountry',
          required: true,
          type: 'countrySelect',
          labelKey: 'sg.travelInfo.fields.boardingCountry.label',
          defaultLabel: singaporeLabels.travelDetails.boardingCountry,
          helpText: singaporeLabels.travelDetails.boardingCountryHelp,
          immediateSave: true,
        },
        arrivalFlightNumber: {
          fieldName: 'arrivalFlightNumber',
          required: true,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'sg.travelInfo.fields.arrivalFlightNumber.label',
          defaultLabel: singaporeLabels.travelDetails.arrivalFlightNumber,
          helpText: singaporeLabels.travelDetails.arrivalFlightNumberHelp,
          placeholder: singaporeLabels.travelDetails.arrivalFlightNumberPlaceholder,
          uppercaseNormalize: true,
        },
        arrivalDate: {
          fieldName: 'arrivalDate',
          required: true,
          type: 'date',
          labelKey: 'sg.travelInfo.fields.arrivalDate.label',
          defaultLabel: singaporeLabels.travelDetails.arrivalDate,
          helpText: singaporeLabels.travelDetails.arrivalDateHelp,
          futureOnly: true,
        },
        departureFlightNumber: {
          fieldName: 'departureFlightNumber',
          required: false,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'sg.travelInfo.fields.departureFlightNumber.label',
          defaultLabel: singaporeLabels.travelDetails.departureFlightNumber,
          helpText: singaporeLabels.travelDetails.departureFlightNumberHelp,
          placeholder: singaporeLabels.travelDetails.departureFlightNumberPlaceholder,
          uppercaseNormalize: true,
        },
        departureDate: {
          fieldName: 'departureDate',
          required: false,
          type: 'date',
          labelKey: 'sg.travelInfo.fields.departureDate.label',
          defaultLabel: singaporeLabels.travelDetails.departureDate,
          helpText: singaporeLabels.travelDetails.departureDateHelp,
        },
        isTransitPassenger: {
          fieldName: 'isTransitPassenger',
          required: false,
          type: 'boolean',
          labelKey: 'sg.travelInfo.fields.isTransitPassenger.label',
          defaultLabel: singaporeLabels.travelDetails.isTransitPassenger,
          yesLabel: singaporeLabels.travelDetails.transitYes,
          noLabel: singaporeLabels.travelDetails.transitNo,
          default: false,
          immediateSave: true,
        },
        accommodationType: {
          fieldName: 'accommodationType',
          required: true,
          type: 'select',
          options: singaporeConfig.travelDetails.accommodationOptions,
          allowCustom: true,
          customFieldName: 'customAccommodationType',
          customLabel: singaporeLabels.travelDetails.customAccommodationType,
          labelKey: 'sg.travelInfo.fields.accommodationType.label',
          defaultLabel: singaporeLabels.travelDetails.accommodationType,
          helpText: singaporeLabels.travelDetails.accommodationTypeHelp,
        },
        province: {
          fieldName: 'province',
          required: true,
          type: 'select',
          labelKey: 'sg.travelInfo.fields.planningArea.label',
          defaultLabel: singaporeLabels.travelDetails.province,
          helpText: singaporeLabels.travelDetails.provinceHelp,
        },
        postalCode: {
          fieldName: 'postalCode',
          required: false,
          maxLength: 10,
          labelKey: 'sg.travelInfo.fields.postalCode.label',
          defaultLabel: singaporeLabels.travelDetails.postalCode,
        },
        hotelAddress: {
          fieldName: 'hotelAddress',
          required: true,
          maxLength: 200,
          labelKey: 'sg.travelInfo.fields.hotelAddress.label',
          defaultLabel: singaporeLabels.travelDetails.hotelAddress,
          helpText: singaporeLabels.travelDetails.hotelAddressHelp,
        },
      },
      locationHierarchy: {
        levels: 1,
        provincesData: singaporeRegions,
      },
    },
  },

  validation: {
    passport: {
      passportNo: {
        required: true,
        pattern: /^[A-Z0-9]{5,20}$/,
        messageKey: 'validation.passportNo.invalid',
      },
      expiryDate: {
        required: true,
        minMonthsValid: 6,
        messageKey: 'validation.expiryDate.tooSoon',
      },
      nationality: {
        required: true,
      },
    },
    personal: {
      phoneNumber: {
        required: true,
        pattern: /^[0-9]{6,15}$/,
        messageKey: 'validation.phoneNumber.invalid',
      },
      email: {
        required: false,
        format: 'email',
        messageKey: 'validation.email.invalid',
      },
    },
    travel: {
      arrivalDate: {
        required: true,
        futureOnly: true,
        messageKey: 'validation.arrivalDate.mustBeFuture',
      },
      province: {
        required: true,
        messageKey: 'validation.planningArea.required',
      },
      accommodationType: {
        required: true,
        messageKey: 'validation.accommodationType.required',
      },
    },
  },

  completion: {
    minPercent: 80,
    requiredSections: ['passport', 'travel'],
  },

  features: {
    autoSave: {
      enabled: true,
      delay: 1200,
    },
    saveStatusIndicator: true,
    lastEditedTimestamp: true,
    privacyNotice: true,
    backgroundAutoSave: true,
  },

  submission: {
    hasWindow: true,
    windowHours: 72,
    reminderHours: 24,
  },

  i18n: {
    namespace: 'sg.travelInfo',
    fallbackLanguage: 'en',
    labelSource: {
      passport: {
        title: singaporeLabels.passport.title,
        subtitle: singaporeLabels.passport.subtitle,
        introText: singaporeLabels.passport.introText,
      },
      personal: {
        title: singaporeLabels.personalInfo.title,
        subtitle: singaporeLabels.personalInfo.subtitle,
        introText: singaporeLabels.personalInfo.introText,
      },
      funds: {
        title: singaporeLabels.funds.title,
        subtitle: singaporeLabels.funds.subtitle,
        introText: singaporeLabels.funds.introText,
      },
      travel: {
        title: singaporeLabels.travelDetails.title,
        subtitle: singaporeLabels.travelDetails.subtitle,
        introText: singaporeLabels.travelDetails.introText,
      },
    },
  },
};

export default singaporeTravelInfoConfig;
