import { TravelInfoConfig } from '../types';

/**
 * Hong Kong Travel Info Configuration
 *
 * Structured for the shared EnhancedTravelInfoTemplate (V2).
 */

import { hongkongLabels, hongkongConfig } from '../../../config/labels/hongkong';
import {
  hongkongRegions,
  getDistrictsByProvince,
  getSubDistrictsByDistrictId,
} from '../../../data/hongkongLocations';

export const hongkongTravelInfoConfig: TravelInfoConfig = {
  destinationId: 'hk',
  name: 'Hong Kong',
  nameZh: '香港',
  flag: '🇭🇰',

  colors: {
    background: '#F5F7FB',
    primary: '#C62828',
  },

  screens: {
    current: 'HongKongTravelInfo',
    next: 'HongKongEntryFlow',
    previous: 'HongKongRequirements',
  },

  hero: {
    type: 'rich',
    title: '香港入境信息中心',
    titleEn: 'Hong Kong Entry Preparation Hub',
    subtitle: '一次准备护照、资金与行程资料，安心入境',
    subtitleEn: 'Keep passport, funds, and itinerary ready for smooth entry.',
    gradient: {
      colors: ['#C62828', '#EF5350'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    valuePropositions: [
      { icon: '🛃', text: '过关问询常见问题提前准备', textEn: 'Know what immigration officers may ask' },
      { icon: '💰', text: '资金证明、住宿凭证一站整理', textEn: 'Organise proof of funds & stay in one place' },
      { icon: '🕒', text: '7天免签停留倒计时提醒', textEn: 'Track the 7-day visa-free stay' },
    ],
    beginnerTip: {
      icon: '💡',
      text: '温馨提示：建议准备往返机票、住宿和资金资料，入境若被询问即可快速出示。',
      textEn: 'Tip: Prepare return tickets, accommodation, and funds documents to answer immigration checks quickly.',
    },
  },

  sections: {
    passport: {
      enabled: true,
      icon: hongkongLabels.passport.icon,
      sectionKey: 'passport',
      titleKey: 'hongkong.travelInfo.sections.passport.title',
      defaultTitle: hongkongLabels.passport.title,
      fields: {
        surname: {
          fieldName: 'surname',
          required: true,
          maxLength: 50,
          labelKey: 'hongkong.travelInfo.fields.surname',
          defaultLabel: '姓（护照）',
          uppercaseNormalize: true,
        },
        middleName: {
          fieldName: 'middleName',
          required: false,
          maxLength: 50,
          labelKey: 'hongkong.travelInfo.fields.middleName',
          defaultLabel: '中间名（如无可留空）',
          uppercaseNormalize: true,
        },
        givenName: {
          fieldName: 'givenName',
          required: true,
          maxLength: 50,
          labelKey: 'hongkong.travelInfo.fields.givenName',
          defaultLabel: '名（护照）',
          uppercaseNormalize: true,
        },
        passportNo: {
          fieldName: 'passportNo',
          required: true,
          pattern: /^[A-Z0-9]{5,20}$/,
          labelKey: 'hongkong.travelInfo.fields.passportNo',
          defaultLabel: hongkongLabels.passport.passportNo,
          helpText: hongkongLabels.passport.passportNoHelp,
          uppercaseNormalize: true,
        },
        nationality: {
          fieldName: 'nationality',
          required: true,
          type: 'countrySelect',
          labelKey: 'hongkong.travelInfo.fields.nationality',
          defaultLabel: hongkongLabels.passport.nationality,
          helpText: hongkongLabels.passport.nationalityHelp,
          immediateSave: true,
        },
        dob: {
          fieldName: 'dob',
          required: true,
          type: 'date',
          labelKey: 'hongkong.travelInfo.fields.dob',
          defaultLabel: hongkongLabels.passport.dob,
          helpText: hongkongLabels.passport.dobHelp,
          pastOnly: true,
          immediateSave: true,
        },
        expiryDate: {
          fieldName: 'expiryDate',
          required: true,
          type: 'date',
          labelKey: 'hongkong.travelInfo.fields.expiryDate',
          defaultLabel: hongkongLabels.passport.expiryDate,
          helpText: hongkongLabels.passport.expiryDateHelp,
          futureOnly: true,
          minMonthsValid: 1,
          immediateSave: true,
        },
        sex: {
          fieldName: 'sex',
          required: true,
          type: 'select',
          options: [
            { value: 'Male', defaultLabel: '男性' },
            { value: 'Female', defaultLabel: '女性' },
            { value: 'Undefined', defaultLabel: '未定义' },
          ],
          labelKey: 'hongkong.travelInfo.fields.sex',
          defaultLabel: hongkongLabels.passport.sex,
          immediateSave: true,
        },
        visaNumber: {
          fieldName: 'visaNumber',
          required: false,
          maxLength: 30,
          labelKey: 'hongkong.travelInfo.fields.visaNumber',
          defaultLabel: hongkongLabels.passport.visaNumber,
          helpText: hongkongLabels.passport.visaNumberHelp,
          uppercaseNormalize: true,
        },
      },
    },

    personal: {
      enabled: true,
      icon: hongkongLabels.personalInfo.icon,
      sectionKey: 'personal',
      titleKey: 'hongkong.travelInfo.sections.personal.title',
      defaultTitle: hongkongLabels.personalInfo.title,
      fields: {
        occupation: {
          fieldName: 'occupation',
          required: true,
          type: 'select',
          options: [
            { value: 'OFFICE', defaultLabel: '上班族' },
            { value: 'STUDENT', defaultLabel: '学生' },
            { value: 'SELF_EMPLOYED', defaultLabel: '自由职业' },
            { value: 'HOMEMAKER', defaultLabel: '全职家庭' },
            { value: 'RETIRED', defaultLabel: '退休' },
            { value: 'OTHER', defaultLabel: '其他' },
          ],
          allowCustom: true,
          customFieldName: 'customOccupation',
          customLabel: hongkongLabels.personalInfo.customOccupationLabel,
          customPlaceholder: hongkongLabels.personalInfo.customOccupationPlaceholder,
          labelKey: 'hongkong.travelInfo.fields.occupation',
          defaultLabel: hongkongLabels.personalInfo.occupation,
          helpText: hongkongLabels.personalInfo.occupationHelp,
        },
        cityOfResidence: {
          fieldName: 'cityOfResidence',
          required: true,
          maxLength: 80,
          labelKey: 'hongkong.travelInfo.fields.cityOfResidence',
          defaultLabel: hongkongLabels.personalInfo.cityOfResidence,
          helpText: hongkongLabels.personalInfo.cityOfResidenceHelp,
          uppercaseNormalize: hongkongConfig.personalInfo.uppercaseCity,
        },
        countryOfResidence: {
          fieldName: 'countryOfResidence',
          required: true,
          type: 'countrySelect',
          labelKey: 'hongkong.travelInfo.fields.countryOfResidence',
          defaultLabel: hongkongLabels.personalInfo.countryOfResidence,
          helpText: hongkongLabels.personalInfo.countryOfResidenceHelp,
          immediateSave: true,
        },
        phoneCode: {
          fieldName: 'phoneCode',
          required: true,
          type: 'phoneCode',
          labelKey: 'hongkong.travelInfo.fields.phoneCode',
          defaultLabel: hongkongLabels.personalInfo.phoneCodeLabel,
          helpText: hongkongLabels.personalInfo.phoneCodeHelp,
          default: '+86',
          immediateSave: true,
        },
        phoneNumber: {
          fieldName: 'phoneNumber',
          required: true,
          pattern: /^[0-9]{6,15}$/,
          labelKey: 'hongkong.travelInfo.fields.phoneNumber',
          defaultLabel: hongkongLabels.personalInfo.phoneNumberLabel,
          helpText: hongkongLabels.personalInfo.phoneNumberHelp,
        },
        email: {
          fieldName: 'email',
          required: false,
          type: 'email',
          labelKey: 'hongkong.travelInfo.fields.email',
          defaultLabel: hongkongLabels.personalInfo.email,
          helpText: hongkongLabels.personalInfo.emailHelp,
        },
      },
    },

    funds: {
      enabled: true,
      icon: hongkongLabels.funds.icon,
      sectionKey: 'funds',
      titleKey: 'hongkong.travelInfo.sections.funds.title',
      defaultTitle: hongkongLabels.funds.title,
      minRequired: 1,
      maxAllowed: 6,
      fundTypes: hongkongConfig.funds.fundTypes,
      allowPhoto: hongkongConfig.funds.showPhotos,
      labels: {
        addFundTitle: hongkongLabels.funds.addFundTitle,
        emptyTitle: hongkongLabels.funds.emptyTitle,
        emptyMessage: hongkongLabels.funds.emptyMessage,
      },
    },

    travel: {
      enabled: true,
      icon: hongkongLabels.travelDetails.icon,
      sectionKey: 'travel',
      titleKey: 'hongkong.travelInfo.sections.travel.title',
      defaultTitle: hongkongLabels.travelDetails.title,
      fields: {
        travelPurpose: {
          fieldName: 'travelPurpose',
          required: true,
          type: 'select',
          options: [
            { value: 'TOURISM', defaultLabel: '旅游' },
            { value: 'BUSINESS', defaultLabel: '商务' },
            { value: 'VISIT_FAMILY', defaultLabel: '探亲访友' },
            { value: 'TRANSIT', defaultLabel: '过境' },
            { value: 'OTHER', defaultLabel: '其他' },
          ],
          allowCustom: true,
          customFieldName: 'customTravelPurpose',
          customLabel: hongkongLabels.travelDetails.customTravelPurposeLabel,
          customPlaceholder: hongkongLabels.travelDetails.customTravelPurposePlaceholder,
          labelKey: 'hongkong.travelInfo.fields.travelPurpose',
          defaultLabel: hongkongLabels.travelDetails.travelPurpose,
          helpText: hongkongLabels.travelDetails.travelPurposeHelp,
        },
        recentStayCountry: {
          fieldName: 'recentStayCountry',
          required: false,
          type: 'countrySelect',
          labelKey: 'hongkong.travelInfo.fields.recentStayCountry',
          defaultLabel: hongkongLabels.travelDetails.recentStayCountry,
          helpText: hongkongLabels.travelDetails.recentStayCountryHelp,
          immediateSave: true,
        },
        boardingCountry: {
          fieldName: 'boardingCountry',
          required: true,
          type: 'countrySelect',
          labelKey: 'hongkong.travelInfo.fields.boardingCountry',
          defaultLabel: hongkongLabels.travelDetails.boardingCountry,
          helpText: hongkongLabels.travelDetails.boardingCountryHelp,
          immediateSave: true,
        },
        arrivalFlightNumber: {
          fieldName: 'arrivalFlightNumber',
          required: true,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'hongkong.travelInfo.fields.arrivalFlightNumber',
          defaultLabel: hongkongLabels.travelDetails.arrivalFlightNumber,
          helpText: hongkongLabels.travelDetails.arrivalFlightNumberHelp,
          placeholder: hongkongLabels.travelDetails.arrivalFlightNumberPlaceholder,
          uppercaseNormalize: true,
        },
        arrivalDate: {
          fieldName: 'arrivalDate',
          required: true,
          type: 'date',
          labelKey: 'hongkong.travelInfo.fields.arrivalDate',
          defaultLabel: hongkongLabels.travelDetails.arrivalDate,
          helpText: hongkongLabels.travelDetails.arrivalDateHelp,
          futureOnly: true,
        },
        departureFlightNumber: {
          fieldName: 'departureFlightNumber',
          required: false,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'hongkong.travelInfo.fields.departureFlightNumber',
          defaultLabel: hongkongLabels.travelDetails.departureFlightNumber,
          helpText: hongkongLabels.travelDetails.departureFlightNumberHelp,
          placeholder: hongkongLabels.travelDetails.departureFlightNumberPlaceholder,
          uppercaseNormalize: true,
        },
        departureDate: {
          fieldName: 'departureDate',
          required: false,
          type: 'date',
          labelKey: 'hongkong.travelInfo.fields.departureDate',
          defaultLabel: hongkongLabels.travelDetails.departureDate,
          helpText: hongkongLabels.travelDetails.departureDateHelp,
        },
        isTransitPassenger: {
          fieldName: 'isTransitPassenger',
          required: false,
          type: 'boolean',
          labelKey: 'hongkong.travelInfo.fields.isTransitPassenger',
          defaultLabel: hongkongLabels.travelDetails.isTransitPassenger,
          yesLabel: hongkongLabels.travelDetails.transitYes,
          noLabel: hongkongLabels.travelDetails.transitNo,
          default: false,
          immediateSave: true,
        },
        accommodationType: {
          fieldName: 'accommodationType',
          required: true,
          type: 'select',
          options: [
            { value: 'HOTEL', defaultLabel: '酒店' },
            { value: 'HOSTEL', defaultLabel: '旅馆/客栈' },
            { value: 'AIRBNB', defaultLabel: '民宿' },
            { value: 'FRIEND_FAMILY', defaultLabel: '朋友或亲戚家' },
            { value: 'OTHER', defaultLabel: '其他' },
          ],
          allowCustom: true,
          customFieldName: 'customAccommodationType',
          customLabel: hongkongLabels.travelDetails.customAccommodationType,
          labelKey: 'hongkong.travelInfo.fields.accommodationType',
          defaultLabel: hongkongLabels.travelDetails.accommodationType,
          helpText: hongkongLabels.travelDetails.accommodationTypeHelp,
        },
        province: {
          fieldName: 'province',
          required: true,
          type: 'select',
          labelKey: 'hongkong.travelInfo.fields.region',
          defaultLabel: hongkongLabels.travelDetails.province,
          helpText: hongkongLabels.travelDetails.provinceHelp,
        },
        district: {
          fieldName: 'district',
          required: true,
          type: 'select',
          labelKey: 'hongkong.travelInfo.fields.district',
          defaultLabel: hongkongLabels.travelDetails.district,
          helpText: hongkongLabels.travelDetails.districtHelp,
        },
        hotelAddress: {
          fieldName: 'hotelAddress',
          required: true,
          maxLength: 200,
          labelKey: 'hongkong.travelInfo.fields.hotelAddress',
          defaultLabel: hongkongLabels.travelDetails.hotelAddress,
          helpText: hongkongLabels.travelDetails.hotelAddressHelp,
        },
        hotelReservationPhoto: {
          fieldName: 'hotelReservationPhoto',
          required: false,
          type: 'photo',
          labelKey: 'hongkong.travelInfo.fields.hotelReservationPhoto',
          defaultLabel: hongkongLabels.travelDetails.hotelReservationPhoto,
          helpText: hongkongLabels.travelDetails.uploadHotelReservation,
        },
        flightTicketPhoto: {
          fieldName: 'flightTicketPhoto',
          required: false,
          type: 'photo',
          labelKey: 'hongkong.travelInfo.fields.flightTicketPhoto',
          defaultLabel: hongkongLabels.travelDetails.flightTicketPhoto,
          helpText: hongkongLabels.travelDetails.uploadFlightTicket,
        },
        departureFlightTicketPhoto: {
          fieldName: 'departureFlightTicketPhoto',
          required: false,
          type: 'photo',
          labelKey: 'hongkong.travelInfo.fields.departureFlightTicketPhoto',
          defaultLabel: hongkongLabels.travelDetails.departureFlightTicketPhoto,
          helpText: hongkongLabels.travelDetails.uploadDepartureFlightTicket,
        },
      },
      locationHierarchy: {
        levels: hongkongConfig.travelDetails.locationDepth,
        provincesData: hongkongRegions,
        getDistrictsFunc: getDistrictsByProvince,
        getSubDistrictsFunc: getSubDistrictsByDistrictId,
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
        minMonthsValid: 1,
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
      travelPurpose: {
        required: true,
      },
      arrivalDate: {
        required: true,
        futureOnly: true,
        messageKey: 'validation.arrivalDate.mustBeFuture',
      },
      province: {
        required: true,
        messageKey: 'validation.region.required',
      },
      district: {
        required: true,
        messageKey: 'validation.district.required',
      },
      accommodationType: {
        required: true,
        messageKey: 'validation.accommodationType.required',
      },
    },
  },

  completion: {
    minPercent: 75,
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
    hasWindow: false,
  },

  i18n: {
    namespace: 'hongkong.travelInfo',
    fallbackLanguage: 'zh-CN',
    labelSource: {
      passport: {
        // Title resolved via titleKey in section config
        subtitle: hongkongLabels.passport.subtitle,
        introText: hongkongLabels.passport.introText,
      },
      personal: {
        // Title resolved via titleKey in section config
        subtitle: hongkongLabels.personalInfo.subtitle,
        introText: hongkongLabels.personalInfo.introText,
      },
      funds: {
        // Title resolved via titleKey in section config
        subtitle: hongkongLabels.funds.subtitle,
        introText: hongkongLabels.funds.introText,
      },
      travel: {
        // Title resolved via titleKey in section config
        subtitle: hongkongLabels.travelDetails.subtitle,
        introText: hongkongLabels.travelDetails.introText,
      },
    },
  },
};

export default hongkongTravelInfoConfig;
