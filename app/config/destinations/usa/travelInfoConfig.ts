import { TravelInfoConfig } from '../types';

/**
 * United States Travel Info Configuration
 *
 * Structured for EnhancedTravelInfoTemplate (V2).
 */

import { usaStates } from '../../../data/usaLocations';

export const usaTravelInfoConfig: TravelInfoConfig = {
  destinationId: 'us',
  name: 'United States',
  nameZh: '美国',
  flag: '🇺🇸',

  colors: {
    background: '#F5F7FB',
    primary: '#1D4ED8',
  },

  screens: {
    current: 'USTravelInfo',
    next: 'USAEntryFlow',
    previous: 'USARequirements',
  },

  hero: {
    type: 'rich',
    title: '美国入境准备中心',
    titleEn: 'USA Entry Preparation Hub',
    subtitle: '一次整理护照、EVUS、住宿与资金资料',
    subtitleEn: 'Keep passport, EVUS, itinerary, and proof of funds ready in one place.',
    gradient: {
      colors: ['#1D4ED8', '#2563EB'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    valuePropositions: [
      { icon: '🛂', text: '护照与EVUS状态一目了然', textEn: 'Track passport & EVUS status easily' },
      { icon: '🧾', text: '海关申报信息提前准备', textEn: 'Prepare CBP declaration details ahead' },
      { icon: '🗽', text: '入境提问重点提醒', textEn: 'Get ready for common CBP questions' },
    ],
    beginnerTip: {
      icon: '💡',
      text: '温馨提醒：EVUS 每两年更新一次，入境前确认状态有效。',
      textEn: 'Tip: EVUS must be renewed every two years—check the status before you fly.',
    },
  },

  sections: {
    passport: {
      enabled: true,
      icon: '🛂',
      sectionKey: 'passport',
      titleKey: 'usa.travelInfo.sections.passport.title',
      defaultTitle: '护照信息',
      fields: {
        surname: {
          fieldName: 'surname',
          required: true,
          maxLength: 50,
          labelKey: 'usa.travelInfo.fields.surname',
          defaultLabel: '姓（拼音大写）',
          uppercaseNormalize: true,
        },
        middleName: {
          fieldName: 'middleName',
          required: false,
          maxLength: 50,
          labelKey: 'usa.travelInfo.fields.middleName',
          defaultLabel: '中间名（如无可留空）',
          uppercaseNormalize: true,
        },
        givenName: {
          fieldName: 'givenName',
          required: true,
          maxLength: 50,
          labelKey: 'usa.travelInfo.fields.givenName',
          defaultLabel: '名（拼音大写）',
          uppercaseNormalize: true,
        },
        passportNo: {
          fieldName: 'passportNo',
          required: true,
          pattern: /^[A-Z0-9]{5,20}$/,
          labelKey: 'usa.travelInfo.fields.passportNo',
          defaultLabel: '护照号码',
          helpText: '请确认与护照一致',
          uppercaseNormalize: true,
        },
        nationality: {
          fieldName: 'nationality',
          required: true,
          type: 'countrySelect',
          labelKey: 'usa.travelInfo.fields.nationality',
          defaultLabel: '国籍',
          immediateSave: true,
        },
        dob: {
          fieldName: 'dob',
          required: true,
          type: 'date',
          labelKey: 'usa.travelInfo.fields.dob',
          defaultLabel: '出生日期',
          pastOnly: true,
          immediateSave: true,
        },
        expiryDate: {
          fieldName: 'expiryDate',
          required: true,
          type: 'date',
          labelKey: 'usa.travelInfo.fields.expiryDate',
          defaultLabel: '护照有效期',
          helpText: '建议至少剩余6个月有效期',
          futureOnly: true,
          minMonthsValid: 6,
          immediateSave: true,
        },
        sex: {
          fieldName: 'sex',
          required: true,
          type: 'select',
          options: [
            { value: 'Male', defaultLabel: '男性' },
            { value: 'Female', defaultLabel: '女性' },
            { value: 'Undefined', defaultLabel: '其他' },
          ],
          labelKey: 'usa.travelInfo.fields.sex',
          defaultLabel: '性别',
          immediateSave: true,
        },
        evusStatus: {
          fieldName: 'evusStatus',
          required: false,
          type: 'select',
          options: [
            { value: 'valid', defaultLabel: 'EVUS 已更新' },
            { value: 'pending', defaultLabel: '已提交待审核' },
            { value: 'expired', defaultLabel: 'EVUS 已过期' },
          ],
          labelKey: 'usa.travelInfo.fields.evusStatus',
          defaultLabel: 'EVUS 状态',
          immediateSave: true,
        },
      },
    },

    personal: {
      enabled: true,
      icon: '👤',
      sectionKey: 'personal',
      titleKey: 'usa.travelInfo.sections.personal.title',
      defaultTitle: '个人信息',
      fields: {
        occupation: {
          fieldName: 'occupation',
          required: true,
          type: 'select',
          options: [
            { value: 'OFFICE', defaultLabel: '上班族' },
            { value: 'BUSINESS', defaultLabel: '商务人士' },
            { value: 'STUDENT', defaultLabel: '学生' },
            { value: 'HOMEMAKER', defaultLabel: '全职家庭' },
            { value: 'RETIRED', defaultLabel: '退休' },
            { value: 'OTHER', defaultLabel: '其他' },
          ],
          allowCustom: true,
          customFieldName: 'customOccupation',
          customLabel: '其他职业说明',
          labelKey: 'usa.travelInfo.fields.occupation',
          defaultLabel: '职业',
          helpText: '用于入境问询及表格填写',
        },
        employer: {
          fieldName: 'employer',
          required: false,
          maxLength: 100,
          labelKey: 'usa.travelInfo.fields.employer',
          defaultLabel: '雇主 / 单位名称（可选）',
        },
        cityOfResidence: {
          fieldName: 'cityOfResidence',
          required: true,
          maxLength: 80,
          labelKey: 'usa.travelInfo.fields.cityOfResidence',
          defaultLabel: '居住城市',
          uppercaseNormalize: true,
        },
        countryOfResidence: {
          fieldName: 'countryOfResidence',
          required: true,
          type: 'countrySelect',
          labelKey: 'usa.travelInfo.fields.countryOfResidence',
          defaultLabel: '居住国家/地区',
          immediateSave: true,
        },
        phoneCode: {
          fieldName: 'phoneCode',
          required: true,
          type: 'phoneCode',
          labelKey: 'usa.travelInfo.fields.phoneCode',
          defaultLabel: '联系电话区号',
          default: '+86',
          immediateSave: true,
        },
        phoneNumber: {
          fieldName: 'phoneNumber',
          required: true,
          pattern: /^[0-9]{6,15}$/,
          labelKey: 'usa.travelInfo.fields.phoneNumber',
          defaultLabel: '联系电话',
        },
        email: {
          fieldName: 'email',
          required: false,
          type: 'email',
          labelKey: 'usa.travelInfo.fields.email',
          defaultLabel: '电子邮箱（可选）',
        },
        emergencyContact: {
          fieldName: 'emergencyContact',
          required: false,
          maxLength: 100,
          labelKey: 'usa.travelInfo.fields.emergencyContact',
          defaultLabel: '紧急联系人姓名（可选）',
        },
      },
    },

    funds: {
      enabled: true,
      icon: '💰',
      sectionKey: 'funds',
      titleKey: 'usa.travelInfo.sections.funds.title',
      defaultTitle: '资金证明',
      minRequired: 1,
      maxAllowed: 6,
      fundTypes: ['cash', 'credit_card', 'bank_balance', 'other'],
      allowPhoto: true,
      labels: {
        addFundTitle: '添加资金证明',
        emptyTitle: '尚未添加资金证明',
        emptyMessage: '建议准备现金、信用卡或银行对账单，以备入境问询。',
      },
    },

    travel: {
      enabled: true,
      icon: '✈️',
      sectionKey: 'travel',
      titleKey: 'usa.travelInfo.sections.travel.title',
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
            { value: 'TRANSIT', defaultLabel: '过境' },
            { value: 'OTHER', defaultLabel: '其他' },
          ],
          allowCustom: true,
          customFieldName: 'customTravelPurpose',
          customLabel: '其他目的说明',
          labelKey: 'usa.travelInfo.fields.travelPurpose',
          defaultLabel: '访问目的',
        },
        arrivalCity: {
          fieldName: 'arrivalCity',
          required: true,
          maxLength: 80,
          labelKey: 'usa.travelInfo.fields.arrivalCity',
          defaultLabel: '入境口岸 / 抵达城市',
          helpText: '例如：洛杉矶 LAX 或 纽约 JFK',
        },
        arrivalFlightNumber: {
          fieldName: 'arrivalFlightNumber',
          required: true,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'usa.travelInfo.fields.arrivalFlightNumber',
          defaultLabel: '入境航班号',
          placeholder: '例如：CA987',
          uppercaseNormalize: true,
        },
        arrivalDate: {
          fieldName: 'arrivalDate',
          required: true,
          type: 'date',
          labelKey: 'usa.travelInfo.fields.arrivalDate',
          defaultLabel: '入境日期',
          futureOnly: true,
        },
        departureFlightNumber: {
          fieldName: 'departureFlightNumber',
          required: false,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'usa.travelInfo.fields.departureFlightNumber',
          defaultLabel: '离境航班号（可选）',
          uppercaseNormalize: true,
        },
        departureDate: {
          fieldName: 'departureDate',
          required: false,
          type: 'date',
          labelKey: 'usa.travelInfo.fields.departureDate',
          defaultLabel: '离境日期（可选）',
        },
        lengthOfStay: {
          fieldName: 'lengthOfStay',
          required: true,
          type: 'number',
          labelKey: 'usa.travelInfo.fields.lengthOfStay',
          defaultLabel: '预计停留天数',
          min: 1,
          max: 180,
          helpText: 'CBP 常会询问预计停留天数，可提前准备答案。',
        },
        accommodationType: {
          fieldName: 'accommodationType',
          required: true,
          type: 'select',
          options: [
            { value: 'HOTEL' },
            { value: 'FRIEND_FAMILY' },
            { value: 'RENTAL' },
            { value: 'OTHER' },
          ],
          allowCustom: true,
          customFieldName: 'customAccommodationType',
          customLabel: '其他住宿类型说明',
          labelKey: 'usa.travelInfo.fields.accommodationType',
          defaultLabel: '住宿类型',
        },
        province: {
          fieldName: 'province',
          required: true,
          type: 'select',
          labelKey: 'usa.travelInfo.fields.state',
          defaultLabel: '所在州',
          helpText: '选择住宿所在州，方便生成入境资料。',
        },
        hotelAddress: {
          fieldName: 'hotelAddress',
          required: true,
          maxLength: 200,
          labelKey: 'usa.travelInfo.fields.address',
          defaultLabel: '住宿地址（含邮编）',
          helpText: 'CBP 可能要求提供具体地址，建议提前准备。',
        },
        hotelContactNumber: {
          fieldName: 'hotelContactNumber',
          required: false,
          pattern: /^[0-9\-+()\s]{6,20}$/,
          labelKey: 'usa.travelInfo.fields.hotelContactNumber',
          defaultLabel: '住宿联系电话（可选）',
        },
        flightTicketPhoto: {
          fieldName: 'flightTicketPhoto',
          required: false,
          type: 'photo',
          labelKey: 'usa.travelInfo.fields.flightTicketPhoto',
          defaultLabel: '机票截图',
          helpText: '可上传往返机票截图，便于查验。',
        },
        hotelReservationPhoto: {
          fieldName: 'hotelReservationPhoto',
          required: false,
          type: 'photo',
          labelKey: 'usa.travelInfo.fields.hotelReservationPhoto',
          defaultLabel: '酒店/住宿预订单',
        },
      },
      locationHierarchy: {
        levels: 1,
        provincesData: usaStates,
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
      travelPurpose: {
        required: true,
      },
      arrivalFlightNumber: {
        required: true,
      },
      arrivalDate: {
        required: true,
        futureOnly: true,
        messageKey: 'validation.arrivalDate.mustBeFuture',
      },
      lengthOfStay: {
        required: true,
        min: 1,
        max: 180,
        messageKey: 'validation.lengthOfStay.range',
      },
      province: {
        required: true,
        messageKey: 'validation.state.required',
      },
      hotelAddress: {
        required: true,
        messageKey: 'validation.address.required',
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
      delay: 1100,
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
    namespace: 'usa.travelInfo',
    fallbackLanguage: 'zh-CN',
    labelSource: {
      passport: {
        title: '护照信息',
        subtitle: '确保护照与 EVUS 信息准确无误',
      },
      personal: {
        title: '个人信息',
        subtitle: '填写联系和紧急联络方式',
      },
      funds: {
        title: '资金证明',
        subtitle: '准备海关可能询问的资金证明',
      },
      travel: {
        title: '旅行信息',
        subtitle: '确认航班、住宿及停留安排',
      },
    },
  },
};

export default usaTravelInfoConfig;
