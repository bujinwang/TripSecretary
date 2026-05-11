import { TravelInfoConfig } from '../types';

/**
 * Japan Travel Info Configuration
 *
 * Mirrors the Malaysia enhanced template structure so the shared
 * TravelInfo templates can auto-render Japan's form.
 */

import { japanPrefectures, getCitiesByPrefecture } from '../../../data/japanLocations';

export const japanTravelInfoConfig: TravelInfoConfig = {
  destinationId: 'jp',
  name: 'Japan',
  nameZh: '日本',
  flag: '🇯🇵',

  colors: {
    background: '#F5F7FA',
    primary: '#DC2626',
  },

  screens: {
    current: 'JapanTravelInfo',
    next: 'JapanEntryFlow',
    previous: 'JapanRequirements',
  },

  hero: {
    type: 'rich',
    titleKey: 'jp.travelInfo.hero.title',
    defaultTitle: '日本入境信息中心',
    title: 'Japan Entry Information Center',
    subtitleKey: 'jp.travelInfo.hero.subtitle',
    defaultSubtitle: '填写一次，随时查看与更新',
    subtitle: 'Fill out once, view and update anytime',
    gradient: {
      colors: ['#DC2626', '#7C2D12'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    valuePropositions: [
      { 
        icon: '🛂', 
        textKey: 'jp.travelInfo.hero.valuePropositions.0',
        defaultText: '护照信息一次备份',
        text: 'Passport information one-time backup'
      },
      { 
        icon: '✈️', 
        textKey: 'jp.travelInfo.hero.valuePropositions.1',
        defaultText: '航班住宿集中管理',
        text: 'Flight and accommodation centralized management'
      },
      { 
        icon: '🔒', 
        textKey: 'jp.travelInfo.hero.valuePropositions.2',
        defaultText: '离线可用，自动保存',
        text: 'Available offline, auto-save'
      },
    ],
    beginnerTip: {
      icon: '💡',
      textKey: 'jp.travelInfo.hero.beginnerTip',
      defaultText: '小贴士：提前准备好住宿和航班信息，入境时最快速。',
      text: 'Tip: Prepare accommodation and flight information in advance for the fastest entry.',
    },
  },

  sections: {
    passport: {
      enabled: true,
      icon: '📘',
      sectionKey: 'passport',
      titleKey: 'jp.travelInfo.sections.passport.title',
      defaultTitle: '护照信息',
      fields: {
        surname: {
          fieldName: 'surname',
          required: true,
          maxLength: 50,
          labelKey: 'jp.travelInfo.fields.surname',
          defaultLabel: '姓',
          helpText: '请严格按照护照上的拼写填写。',
          uppercaseNormalize: true,
        },
        middleName: {
          fieldName: 'middleName',
          required: false,
          maxLength: 50,
          labelKey: 'jp.travelInfo.fields.middleName',
          defaultLabel: '中间名（选填）',
          uppercaseNormalize: true,
        },
        givenName: {
          fieldName: 'givenName',
          required: true,
          maxLength: 50,
          labelKey: 'jp.travelInfo.fields.givenName',
          defaultLabel: '名',
          uppercaseNormalize: true,
        },
        passportNo: {
          fieldName: 'passportNo',
          required: true,
          pattern: /^[A-Z0-9]{5,20}$/i,
          labelKey: 'jp.travelInfo.fields.passportNo',
          defaultLabel: '护照号码',
          helpText: '只支持英文字母与数字，请检查无空格。',
          uppercaseNormalize: true,
        },
        nationality: {
          fieldName: 'nationality',
          required: true,
          type: 'countrySelect',
          labelKey: 'jp.travelInfo.fields.nationality',
          defaultLabel: '国籍',
          immediateSave: true,
        },
        dob: {
          fieldName: 'dob',
          required: true,
          type: 'date',
          labelKey: 'jp.travelInfo.fields.dob',
          defaultLabel: '出生日期',
          pastOnly: true,
          immediateSave: true,
        },
        expiryDate: {
          fieldName: 'expiryDate',
          required: true,
          type: 'date',
          labelKey: 'jp.travelInfo.fields.expiryDate',
          defaultLabel: '护照有效期',
          futureOnly: true,
          minMonthsValid: 6,
          immediateSave: true,
        },
        sex: {
          fieldName: 'sex',
          required: true,
          type: 'select',
          options: [
            { value: 'M', defaultLabel: '男' },
            { value: 'F', defaultLabel: '女' },
            { value: 'X', defaultLabel: '其他' },
          ],
          labelKey: 'jp.travelInfo.fields.sex',
          defaultLabel: '性别',
          immediateSave: true,
        },
        visaNumber: {
          fieldName: 'visaNumber',
          required: false,
          maxLength: 30,
          labelKey: 'jp.travelInfo.fields.visaNumber',
          defaultLabel: '签证号码（选填）',
          uppercaseNormalize: true,
        },
      },
    },

    personal: {
      enabled: true,
      icon: '👤',
      sectionKey: 'personal',
      titleKey: 'jp.travelInfo.sections.personal.title',
      defaultTitle: '个人资料',
      fields: {
        occupation: {
          fieldName: 'occupation',
          required: true,
          type: 'select',
          options: [
            { value: 'OFFICE', defaultLabel: '上班族' },
            { value: 'STUDENT', defaultLabel: '学生' },
            { value: 'SELF_EMPLOYED', defaultLabel: '自由职业者' },
            { value: 'HOMEMAKER', defaultLabel: '家庭主妇/主夫' },
            { value: 'RETIRED', defaultLabel: '退休人员' },
            { value: 'OTHER', defaultLabel: '其他' },
          ],
          allowCustom: true,
          customFieldName: 'customOccupation',
          customLabel: '自定义职业',
          customPlaceholder: '请输入职业描述',
          labelKey: 'jp.travelInfo.fields.occupation',
          defaultLabel: '职业',
        },
        cityOfResidence: {
          fieldName: 'cityOfResidence',
          required: true,
          maxLength: 80,
          labelKey: 'jp.travelInfo.fields.cityOfResidence',
          defaultLabel: '居住城市',
          uppercaseNormalize: true,
        },
        countryOfResidence: {
          fieldName: 'countryOfResidence',
          required: true,
          type: 'countrySelect',
          labelKey: 'jp.travelInfo.fields.countryOfResidence',
          defaultLabel: '居住国家',
          immediateSave: true,
        },
        phoneCode: {
          fieldName: 'phoneCode',
          required: true,
          type: 'phoneCode',
          labelKey: 'jp.travelInfo.fields.phoneCode',
          defaultLabel: '电话区号',
          default: '+81',
          immediateSave: true,
        },
        phoneNumber: {
          fieldName: 'phoneNumber',
          required: true,
          pattern: /^[0-9]{6,15}$/,
          labelKey: 'jp.travelInfo.fields.phoneNumber',
          defaultLabel: '电话号码',
          helpText: '仅数字，无空格或符号。',
        },
        email: {
          fieldName: 'email',
          required: false,
          type: 'email',
          labelKey: 'jp.travelInfo.fields.email',
          defaultLabel: '邮箱（选填）',
        },
      },
    },

    funds: {
      enabled: true,
      icon: '💰',
      sectionKey: 'funds',
      titleKey: 'jp.travelInfo.sections.funds.title',
      defaultTitle: '资金证明',
      minRequired: 1,
      maxAllowed: 6,
      fundTypes: ['cash', 'credit_card', 'bank_balance'],
      labels: {
        addFundTitle: '新增资金类型',
        emptyTitle: '尚未添加资产证明',
        emptyMessage: '入境时需证明有足够资金，至少添加一项资产证明。',
      },
    },

    travel: {
      enabled: true,
      icon: '✈️',
      sectionKey: 'travel',
      titleKey: 'jp.travelInfo.sections.travel.title',
      defaultTitle: '旅行信息',
      fields: {
        travelPurpose: {
          fieldName: 'travelPurpose',
          required: true,
          type: 'select',
          options: [
            { value: 'TOURISM', defaultLabel: '旅游' },
            { value: 'BUSINESS', defaultLabel: '商务' },
            { value: 'VISIT_FAMILY', defaultLabel: '探亲访友' },
            { value: 'STUDY', defaultLabel: '短期学习' },
            { value: 'OTHER', defaultLabel: '其他' },
          ],
          allowCustom: true,
          customFieldName: 'customTravelPurpose',
          customLabel: '自定义旅行目的',
          customPlaceholder: '请输入您的旅行目的',
          labelKey: 'jp.travelInfo.fields.travelPurpose',
          defaultLabel: '旅行目的',
        },
        arrivalFlightNumber: {
          fieldName: 'arrivalFlightNumber',
          required: true,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'jp.travelInfo.fields.arrivalFlightNumber',
          defaultLabel: '入境航班号',
          placeholder: '例如 JL123',
          uppercaseNormalize: true,
        },
        arrivalDate: {
          fieldName: 'arrivalDate',
          required: true,
          type: 'date',
          labelKey: 'jp.travelInfo.fields.arrivalDate',
          defaultLabel: '入境日期',
          futureOnly: true,
        },
        departureFlightNumber: {
          fieldName: 'departureFlightNumber',
          required: false,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'jp.travelInfo.fields.departureFlightNumber',
          defaultLabel: '出境航班号',
          placeholder: '例如 NH820',
          uppercaseNormalize: true,
          countable: false,
        },
        departureDate: {
          fieldName: 'departureDate',
          required: false,
          type: 'date',
          labelKey: 'jp.travelInfo.fields.departureDate',
          defaultLabel: '出境日期',
          countable: false,
        },
        accommodationType: {
          fieldName: 'accommodationType',
          required: true,
          type: 'select',
          options: [
            { value: 'HOTEL', defaultLabel: '酒店' },
            { value: 'HOSTEL', defaultLabel: '青年旅社' },
            { value: 'AIRBNB', defaultLabel: '民宿' },
            { value: 'FAMILY', defaultLabel: '亲友家' },
            { value: 'OTHER', defaultLabel: '其他' },
          ],
          allowCustom: true,
          customFieldName: 'customAccommodationType',
          customLabel: '自定义住宿类型',
          labelKey: 'jp.travelInfo.fields.accommodationType',
          defaultLabel: '住宿类型',
        },
        province: {
          fieldName: 'province',
          required: true,
          type: 'select',
          labelKey: 'jp.travelInfo.fields.prefecture',
          defaultLabel: '都道府县',
        },
        district: {
          fieldName: 'district',
          required: false,
          type: 'select',
          labelKey: 'jp.travelInfo.fields.city',
          defaultLabel: '城市',
          countable: false,
        },
        postalCode: {
          fieldName: 'postalCode',
          required: false,
          maxLength: 10,
          labelKey: 'jp.travelInfo.fields.postalCode',
          defaultLabel: '邮编',
          countable: false,
        },
        hotelAddress: {
          fieldName: 'hotelAddress',
          required: true,
          maxLength: 200,
          labelKey: 'jp.travelInfo.fields.hotelAddress',
          defaultLabel: '住宿地址',
        },
      },
      locationHierarchy: {
        levels: 2,
        provincesData: japanPrefectures,
        getDistrictsFunc: getCitiesByPrefecture,
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
        messageKey: 'validation.prefecture.required',
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
    hasWindow: false,
    windowHours: null,
    reminderHours: null,
  },

  i18n: {
    namespace: 'jp.travelInfo',
    fallbackLanguage: 'en',
    labelSource: {
      passport: {
        title: '护照信息',
        subtitle: '护照详细信息',
        introText: '请确保与护照完全一致，入境时会核对。',
      },
      personal: {
        title: '个人资料',
        subtitle: '联系与职业详情',
        introText: '保持联系方式畅通，方便日本官方联系。',
      },
      funds: {
        title: '资金证明',
        subtitle: '旅行资金证明',
        introText: '建议至少准备 10 万日元等值资金作为旅行保障。',
      },
      travel: {
        title: '旅行信息',
        subtitle: '航班与住宿信息',
        introText: '提前确认航班与住宿，有助于快速通关。',
      },
    },
  },
};

export default japanTravelInfoConfig;
