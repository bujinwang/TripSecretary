// @ts-nocheck

import { taiwanLabels, taiwanConfig } from '../../../config/labels/taiwan';
import { taiwanCities } from '../../../data/taiwanLocations';

export const taiwanTravelInfoConfig = {
  destinationId: 'tw',
  name: 'Taiwan',
  nameZh: '台湾',
  flag: '🇹🇼',

  colors: {
    background: '#F5F7FB',
    primary: '#EF4444',
  },

  screens: {
    current: 'TaiwanTravelInfo',
    next: 'TaiwanEntryFlow',
    previous: 'TaiwanRequirements',
  },

  hero: {
    type: 'rich',
    titleKey: 'tw.travelInfo.hero.title',
    defaultTitle: 'Taiwan Entry Information Center',
    subtitleKey: 'tw.travelInfo.hero.subtitle',
    defaultSubtitle: 'Fill in passport, itinerary, and accommodation once, and travel to Formosa with peace of mind',
    gradient: {
      colors: ['#EF4444', '#F97316'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    valuePropositions: [
      { 
        icon: '🛂', 
        textKey: 'tw.travelInfo.hero.valuePropositions.0',
        defaultText: 'Entry permit & arrival card in one place'
      },
      { 
        icon: '🕒', 
        textKey: 'tw.travelInfo.hero.valuePropositions.1',
        defaultText: 'Smart reminder for 3-day arrival card window'
      },
      { 
        icon: '🔒', 
        textKey: 'tw.travelInfo.hero.valuePropositions.2',
        defaultText: 'Securely stored, works offline'
      },
    ],
    beginnerTip: {
      icon: '💡',
      textKey: 'tw.travelInfo.hero.beginnerTip',
      defaultText: 'Tip: Complete the online arrival card within 3 days before arrival—we\'ll remind you at the perfect time.',
    },
  },

  sections: {
    passport: {
      enabled: true,
      icon: taiwanLabels.passport.icon,
      sectionKey: 'passport',
      titleKey: 'taiwan.travelInfo.sections.passport.title',
      defaultTitle: taiwanLabels.passport.title,
      fields: {
        surname: {
          fieldName: 'surname',
          required: true,
          maxLength: 50,
          labelKey: 'taiwan.travelInfo.fields.surname',
          defaultLabel: '姓 - Surname',
          uppercaseNormalize: true,
        },
        middleName: {
          fieldName: 'middleName',
          required: false,
          maxLength: 50,
          labelKey: 'taiwan.travelInfo.fields.middleName',
          defaultLabel: '中間名 - Middle Name',
          uppercaseNormalize: true,
        },
        givenName: {
          fieldName: 'givenName',
          required: true,
          maxLength: 50,
          labelKey: 'taiwan.travelInfo.fields.givenName',
          defaultLabel: '名 - Given Name',
          uppercaseNormalize: true,
        },
        passportNo: {
          fieldName: 'passportNo',
          required: true,
          pattern: /^[A-Z0-9]{5,20}$/,
          labelKey: 'taiwan.travelInfo.fields.passportNo',
          defaultLabel: taiwanLabels.passport.passportNo,
          helpText: taiwanLabels.passport.passportNoHelp,
          uppercaseNormalize: true,
        },
        nationality: {
          fieldName: 'nationality',
          required: true,
          type: 'countrySelect',
          labelKey: 'taiwan.travelInfo.fields.nationality',
          defaultLabel: taiwanLabels.passport.nationality,
          immediateSave: true,
        },
        dob: {
          fieldName: 'dob',
          required: true,
          type: 'date',
          labelKey: 'taiwan.travelInfo.fields.dob',
          defaultLabel: taiwanLabels.passport.dob,
          pastOnly: true,
          immediateSave: true,
        },
        expiryDate: {
          fieldName: 'expiryDate',
          required: true,
          type: 'date',
          labelKey: 'taiwan.travelInfo.fields.expiryDate',
          defaultLabel: taiwanLabels.passport.expiryDate,
          futureOnly: true,
          minMonthsValid: 6,
          immediateSave: true,
        },
        sex: {
          fieldName: 'sex',
          required: true,
          type: 'select',
          options: taiwanConfig.passport.genderOptions,
          labelKey: 'taiwan.travelInfo.fields.sex',
          defaultLabel: taiwanLabels.passport.sex,
          immediateSave: true,
        },
        visaNumber: {
          fieldName: 'visaNumber',
          required: false,
          maxLength: 30,
          labelKey: 'taiwan.travelInfo.fields.visaNumber',
          defaultLabel: taiwanLabels.passport.visaNumber,
          uppercaseNormalize: true,
        },
      },
    },

    personal: {
      enabled: true,
      icon: taiwanLabels.personalInfo.icon,
      sectionKey: 'personal',
      titleKey: 'taiwan.travelInfo.sections.personal.title',
      defaultTitle: taiwanLabels.personalInfo.title,
      fields: {
        occupation: {
          fieldName: 'occupation',
          required: true,
          type: 'select',
          options: [
            { value: 'OFFICE', defaultLabel: '上班族 / Office' },
            { value: 'BUSINESS', defaultLabel: '商務人士 / Business' },
            { value: 'STUDENT', defaultLabel: '學生 / Student' },
            { value: 'HOMEMAKER', defaultLabel: '家庭主婦 / Homemaker' },
            { value: 'RETIRED', defaultLabel: '退休 / Retired' },
            { value: 'OTHER', defaultLabel: '其他 / Other' },
          ],
          allowCustom: true,
          customFieldName: 'customOccupation',
          customLabel: taiwanLabels.personalInfo.customOccupationLabel,
          customPlaceholder: taiwanLabels.personalInfo.customOccupationPlaceholder,
          labelKey: 'taiwan.travelInfo.fields.occupation',
          defaultLabel: taiwanLabels.personalInfo.occupation,
          helpText: taiwanLabels.personalInfo.occupationHelp,
        },
        cityOfResidence: {
          fieldName: 'cityOfResidence',
          required: true,
          maxLength: 80,
          labelKey: 'taiwan.travelInfo.fields.cityOfResidence',
          defaultLabel: '居住城市 - City of Residence',
          helpText: '輸入目前居住的城市',
          uppercaseNormalize: true,
        },
        countryOfResidence: {
          fieldName: 'countryOfResidence',
          required: true,
          type: 'countrySelect',
          labelKey: 'taiwan.travelInfo.fields.countryOfResidence',
          defaultLabel: taiwanLabels.personalInfo.countryOfResidence,
          helpText: taiwanLabels.personalInfo.countryOfResidenceHelp,
          immediateSave: true,
        },
        phoneCode: {
          fieldName: 'phoneCode',
          required: true,
          type: 'phoneCode',
          labelKey: 'taiwan.travelInfo.fields.phoneCode',
          defaultLabel: taiwanLabels.personalInfo.phoneCodeLabel,
          helpText: taiwanLabels.personalInfo.phoneCodeHelp,
          default: '+86',
          immediateSave: true,
        },
        phoneNumber: {
          fieldName: 'phoneNumber',
          required: true,
          pattern: /^[0-9]{6,15}$/,
          labelKey: 'taiwan.travelInfo.fields.phoneNumber',
          defaultLabel: taiwanLabels.personalInfo.phoneNumberLabel,
          helpText: taiwanLabels.personalInfo.phoneNumberHelp,
        },
        email: {
          fieldName: 'email',
          required: false,
          type: 'email',
          labelKey: 'taiwan.travelInfo.fields.email',
          defaultLabel: taiwanLabels.personalInfo.email,
          helpText: taiwanLabels.personalInfo.emailHelp,
        },
      },
    },

    funds: {
      enabled: false,
      sectionKey: 'funds',
      icon: taiwanLabels.funds.icon,
      titleKey: 'taiwan.travelInfo.sections.funds.title',
      defaultTitle: taiwanLabels.funds.title,
      labels: {
        addFundTitle: taiwanLabels.funds.addFundTitle,
        emptyTitle: taiwanLabels.funds.emptyTitle,
        emptyMessage: taiwanLabels.funds.emptyMessage,
      },
    },

    travel: {
      enabled: true,
      icon: taiwanLabels.travelDetails.icon,
      sectionKey: 'travel',
      titleKey: 'taiwan.travelInfo.sections.travel.title',
      defaultTitle: taiwanLabels.travelDetails.title,
      fields: {
        travelPurpose: {
          fieldName: 'travelPurpose',
          required: true,
          type: 'select',
          options: [
            { value: 'TOURISM', defaultLabel: '旅遊 / Tourism' },
            { value: 'BUSINESS', defaultLabel: '商務 / Business' },
            { value: 'VISIT_FAMILY', defaultLabel: '探親 / Visit Family' },
            { value: 'STUDY', defaultLabel: '研習 / Study' },
            { value: 'OTHER', defaultLabel: '其他 / Other' },
          ],
          allowCustom: true,
          customFieldName: 'customTravelPurpose',
          customLabel: taiwanLabels.travelDetails.customTravelPurposeLabel,
          customPlaceholder: taiwanLabels.travelDetails.customTravelPurposePlaceholder,
          labelKey: 'taiwan.travelInfo.fields.travelPurpose',
          defaultLabel: taiwanLabels.travelDetails.travelPurpose,
          helpText: taiwanLabels.travelDetails.travelPurposeHelp,
        },
        arrivalFlightNumber: {
          fieldName: 'arrivalFlightNumber',
          required: true,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'taiwan.travelInfo.fields.arrivalFlightNumber',
          defaultLabel: taiwanLabels.travelDetails.arrivalFlightNumber,
          helpText: taiwanLabels.travelDetails.arrivalFlightNumberHelp,
          placeholder: taiwanLabels.travelDetails.arrivalFlightNumberPlaceholder,
          uppercaseNormalize: true,
        },
        arrivalDate: {
          fieldName: 'arrivalDate',
          required: true,
          type: 'date',
          labelKey: 'taiwan.travelInfo.fields.arrivalDate',
          defaultLabel: taiwanLabels.travelDetails.arrivalDate,
          helpText: taiwanLabels.travelDetails.arrivalDateHelp,
          futureOnly: true,
        },
        stayDuration: {
          fieldName: 'stayDuration',
          required: true,
          type: 'number',
          labelKey: 'taiwan.travelInfo.fields.stayDuration',
          defaultLabel: taiwanLabels.travelDetails.stayDuration,
          helpText: taiwanLabels.travelDetails.stayDurationHelp,
        },
        accommodationType: {
          fieldName: 'accommodationType',
          required: true,
          type: 'select',
          options: taiwanConfig.travelDetails.accommodationOptions,
          allowCustom: true,
          customFieldName: 'customAccommodationType',
          customLabel: '自訂住宿類型',
          labelKey: 'taiwan.travelInfo.fields.accommodationType',
          defaultLabel: taiwanLabels.travelDetails.accommodationType,
          helpText: taiwanLabels.travelDetails.accommodationTypeHelp,
        },
        province: {
          fieldName: 'province',
          required: true,
          type: 'select',
          labelKey: 'taiwan.travelInfo.fields.city',
          defaultLabel: taiwanLabels.travelDetails.province,
          helpText: taiwanLabels.travelDetails.provinceHelp,
        },
        hotelAddress: {
          fieldName: 'hotelAddress',
          required: true,
          maxLength: 200,
          labelKey: 'taiwan.travelInfo.fields.hotelAddress',
          defaultLabel: taiwanLabels.travelDetails.hotelAddress,
          helpText: taiwanLabels.travelDetails.hotelAddressHelp,
        },
        contactNumber: {
          fieldName: 'contactNumber',
          required: false,
          pattern: /^[0-9+-]{6,20}$/,
          labelKey: 'taiwan.travelInfo.fields.contactNumber',
          defaultLabel: taiwanLabels.travelDetails.contactNumber,
        },
      },
      locationHierarchy: {
        levels: 1,
        provincesData: taiwanCities,
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
        messageKey: 'validation.city.required',
      },
      stayDuration: {
        required: true,
        messageKey: 'validation.stayDuration.required',
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
    namespace: 'taiwan.travelInfo',
    fallbackLanguage: 'zh-TW',
    labelSource: {
      passport: {
        title: taiwanLabels.passport.title,
        subtitle: taiwanLabels.passport.subtitle,
        introText: taiwanLabels.passport.introText,
      },
      personal: {
        title: taiwanLabels.personalInfo.title,
        subtitle: taiwanLabels.personalInfo.subtitle,
        introText: taiwanLabels.personalInfo.introText,
      },
      funds: {
        title: taiwanLabels.funds.title,
        subtitle: taiwanLabels.funds.subtitle,
        introText: taiwanLabels.funds.introText,
      },
      travel: {
        title: taiwanLabels.travelDetails.title,
        subtitle: taiwanLabels.travelDetails.subtitle,
        introText: taiwanLabels.travelDetails.introText,
      },
    },
  },
};

export default taiwanTravelInfoConfig;
