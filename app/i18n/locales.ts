// @ts-nocheck

import countryTranslations from './translations/index';
import { convertToTraditional } from './chineseConverter';

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const deepMergeTranslations = (base = {}, overrides = {}) => {
  if (!isPlainObject(base)) {
    return overrides !== undefined ? overrides : base;
  }

  const result = { ...base };

  Object.keys(overrides || {}).forEach((key) => {
    const baseValue = result[key];
    const overrideValue = overrides[key];

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMergeTranslations(baseValue, overrideValue);
    } else {
      result[key] = overrideValue;
    }
  });

  return result;
};

export const SUPPORTED_LANGUAGES = ['en', 'zh-CN', 'zh-TW', 'fr', 'de', 'es', 'ms', 'th', 'vi', 'ko', 'ja'];

// Progressive Entry Flow namespaces
export const PROGRESSIVE_FLOW_NAMESPACES = ['progressiveFlow', 'entryPack', 'notifications'];

// Language fallback configuration
export const LANGUAGE_FALLBACK = {
  'zh-TW': 'zh-CN',
  'zh-HK': 'zh-CN',
  'zh': 'zh-CN',
  'fr': 'en',
  'de': 'en',
  'es': 'en'
};
LANGUAGE_FALLBACK['th'] = 'en';
LANGUAGE_FALLBACK['vi'] = 'en';
LANGUAGE_FALLBACK['ko'] = 'en';
LANGUAGE_FALLBACK['ja'] = 'en';

const sgTravelInfoEn = {
  hero: {
    title: 'Singapore Entry Preparation Hub',
    subtitle: 'Complete passport, itinerary, and stay details in one place.',
    valuePropositions: {
      smartReminder: 'Smart reminders for the SG Arrival Card window',
      familyMode: 'One place to manage every family member',
      offlineSecurity: 'Offline-safe and securely stored on your device',
    },
    beginnerTip: 'Submit the SG Arrival Card within 3 days before arrival—we will remind you at the perfect time.',
  },
  sections: {
    passport: {
      title: 'Passport Information',
      subtitle: 'Ensure every detail matches your passport exactly.',
    },
    personal: {
      title: 'Personal Information',
      subtitle: 'Contact details and background information',
    },
    funds: {
      title: 'Proof of Funds',
      subtitle: 'Show how you can support your stay',
      introText: 'Singapore immigration may request to see sufficient cash, cards, or bank statements. Prepare different types just in case.',
      addCash: 'Add Cash',
      addCreditCard: 'Add Credit Card Photo',
      addBankBalance: 'Add Bank Balance',
      addBankCard: 'Add Bank Card',
      addDocument: 'Add Supporting Document',
      empty: 'No fund proof added yet. Create an entry first.',
      notProvided: 'Not provided yet',
      photoAttached: 'Photo attached',
      fundTypes: {
        cash: 'Cash',
        credit_card: 'Credit Card',
        bank_card: 'Bank Card',
        bank_balance: 'Bank Balance',
        document: 'Document',
        other: 'Other',
      },
    },
    travel: {
      title: 'Travel Details',
      subtitle: 'Flight, stay, and transit information',
      introText: 'Share your arrival plan, transport, and accommodation so ICA can process your declaration smoothly.',
      introIcon: '✈️',
      isTransitPassenger: 'Transit passenger',
      transitYes: 'Yes',
      transitNo: 'No',
      hotelAddressPlaceholder: 'Full address in Singapore (English)',
      provincePlaceholder: 'Select planning area',
      districtPlaceholder: 'Select district',
      subDistrictPlaceholder: 'Select sub-district',
      accommodationTypePlaceholder: 'Select accommodation type',
      accommodationTypeModalTitle: 'Accommodation Type',
    },
  },
  fields: {
    surname: { label: 'Surname / Family Name', placeholder: 'SURNAME' },
    middleName: { label: 'Middle Name (optional)', placeholder: 'MIDDLE' },
    givenName: { label: 'Given Name(s)', placeholder: 'GIVEN NAMES' },
    passportNo: { label: 'Passport Number', placeholder: 'E12345678' },
    nationality: { label: 'Nationality' },
    dob: { label: 'Date of Birth', placeholder: 'YYYY-MM-DD' },
    expiryDate: { label: 'Passport Expiry Date', placeholder: 'YYYY-MM-DD' },
    sex: {
      label: 'Sex',
      options: {
        female: 'Female',
        male: 'Male',
        undefined: 'Unspecified',
      },
    },
    visaNumber: { label: 'Visa Number (optional)', placeholder: 'e.g. Reference number' },
    occupation: { label: 'Occupation', placeholder: 'e.g. Product Manager' },
    cityOfResidence: { label: 'City of Residence', placeholder: 'e.g. SHANGHAI' },
    countryOfResidence: { label: 'Country of Residence' },
    phoneCode: { label: 'Country/Region Code', placeholder: '+65' },
    phoneNumber: { label: 'Mobile Number', placeholder: 'Reachable phone number' },
    email: { label: 'Email Address', placeholder: 'name@example.com' },
    travelPurpose: { label: 'Purpose of Visit' },
    recentStayCountry: { label: 'Country visited in last 30 days' },
    boardingCountry: { label: 'Country/region of departure' },
    arrivalFlightNumber: { label: 'Arrival Flight / Vessel Number', placeholder: 'SQ123' },
    arrivalDate: { label: 'Arrival Date', placeholder: 'YYYY-MM-DD' },
    departureFlightNumber: { label: 'Departure Flight Number', placeholder: 'SQ456' },
    departureDate: { label: 'Departure Date', placeholder: 'YYYY-MM-DD' },
    isTransitPassenger: { label: 'Transit passenger' },
    accommodationType: { label: 'Accommodation Type' },
    planningArea: { label: 'Planning Area / District' },
    postalCode: { label: 'Singapore Postal Code', placeholder: '123456' },
    hotelAddress: { label: 'Accommodation Address', placeholder: 'Full street address in Singapore' },
  },
  fieldHelp: {
    surname: 'Use uppercase letters exactly as shown on your passport.',
    middleName: 'Leave blank if your passport does not include a middle name.',
    givenName: 'Enter all given names exactly as printed in the passport.',
    passportNo: 'Letters and numbers only, no spaces.',
    nationality: 'Select the nationality printed on your passport.',
    dob: 'Use the format YYYY-MM-DD.',
    expiryDate: 'Passport must stay valid for at least 6 months when you arrive.',
    sex: 'Select the sex printed in your passport.',
    visaNumber: 'Optional. Provide the visa reference number if one was issued.',
    occupation: 'Describe your current occupation in English.',
    cityOfResidence: 'Enter the city where you currently live (uppercase recommended).',
    countryOfResidence: 'Choose the country where you live most of the time.',
    residentCountry: 'Choose the country where you live most of the time.',
    phoneCode: 'Include the international dialing code for your phone number.',
    phoneNumber: 'Provide a number that can receive calls or SMS overseas.',
    email: 'Use an email inbox you can access while traveling.',
    travelPurpose: 'Tell ICA why you are entering Singapore.',
    recentStayCountry: 'If you visited another country within 30 days, select it here.',
    boardingCountry: 'Country or region where you board the transport that arrives in Singapore.',
    arrivalFlightNumber: 'Enter the airline or vehicle code plus number, e.g. SQ305.',
    arrivalDate: 'Must be within 3 calendar days of submitting the SG Arrival Card.',
    departureFlightNumber: 'Optional but recommended to show onward travel.',
    departureDate: 'Provide the date you plan to leave Singapore.',
    isTransitPassenger: 'Turn on if you will remain within the transit area and not clear immigration.',
    accommodationType: 'Choose how you will stay in Singapore.',
    planningArea: 'Select the planning area or district of your stay.',
    postalCode: 'Singapore postal codes have 6 digits.',
    hotelAddress: 'Enter the full street address (in English).',
  },
  accommodationTypes: {
    HOTEL: 'Hotel / Resort',
    HOSTEL: 'Hostel / Guesthouse',
    AIRBNB: 'Homestay / Airbnb',
    FRIEND_FAMILY: 'Friends or relatives',
    OTHER: 'Other',
  },
};

const sgTravelInfoZh = {
  hero: {
    title: '新加坡入境准备中心',
    subtitle: '一次填好护照、行程与住宿信息',
    valuePropositions: {
      smartReminder: '智能提醒 SG Arrival Card 提交窗口',
      familyMode: '一家人一次管理，批量完成',
      offlineSecurity: '信息仅保存在本机，离线也能查看',
    },
    beginnerTip: '温馨提示：入境前3天内提交 SG Arrival Card，我们会在最佳时间提醒你。',
  },
  sections: {
    passport: {
      title: '护照信息',
      subtitle: '请严格按照护照上的信息填写',
    },
    personal: {
      title: '个人信息',
      subtitle: '联系方式与职业资料',
    },
    funds: {
      title: '资金证明',
      subtitle: '展示可用于此次行程的资金',
      introText: '新加坡移民局可能抽查现金、银行卡或银行流水，请提前准备多种方式。',
      addCash: '添加现金',
      addCreditCard: '添加信用卡照片',
      addBankBalance: '添加银行余额',
      addBankCard: '添加银行卡',
      addDocument: '添加辅助文件',
      empty: '尚未添加资金证明，请先新建条目。',
      notProvided: '尚未填写',
      photoAttached: '已附照片',
      fundTypes: {
        cash: '现金',
        credit_card: '信用卡',
        bank_card: '银行卡',
        bank_balance: '银行存款',
        document: '证明文件',
        other: '其他',
      },
    },
    travel: {
      title: '行程信息',
      subtitle: '航班、住宿与过境情况',
      introText: '提前告知航班与住宿，ICA 才能顺利处理你的申报。',
      introIcon: '✈️',
      isTransitPassenger: '是否为过境旅客',
      transitYes: '是',
      transitNo: '否',
      hotelAddressPlaceholder: '请输入在新加坡的详细地址',
      provincePlaceholder: '请选择规划区',
      districtPlaceholder: '请选择地区',
      subDistrictPlaceholder: '请选择街道/邮区',
      accommodationTypePlaceholder: '请选择住宿类型',
      accommodationTypeModalTitle: '住宿类型',
    },
  },
  fields: {
    surname: { label: '护照姓氏（SURNAME）', placeholder: '如 LI' },
    middleName: { label: '中间名（可选）', placeholder: '如 HUA' },
    givenName: { label: '护照名字（GIVEN NAME）', placeholder: '如 MING' },
    passportNo: { label: '护照号码', placeholder: '例如：E12345678' },
    nationality: { label: '国籍' },
    dob: { label: '出生日期', placeholder: 'YYYY-MM-DD' },
    expiryDate: { label: '护照有效期', placeholder: 'YYYY-MM-DD' },
    sex: {
      label: '性别',
      options: {
        female: '女性',
        male: '男性',
        undefined: '未指定',
      },
    },
    visaNumber: { label: '签证号码（如有）', placeholder: '如已获批请输入' },
    occupation: { label: '职业', placeholder: '请输入职业（英文）' },
    cityOfResidence: { label: '居住城市', placeholder: '请输入居住城市（英文）' },
    countryOfResidence: { label: '居住国家' },
    phoneCode: { label: '国家区号', placeholder: '+65' },
    phoneNumber: { label: '联系电话', placeholder: '请输入手机号' },
    email: { label: '电子邮箱', placeholder: 'name@example.com' },
    travelPurpose: { label: '访问目的' },
    recentStayCountry: { label: '近30天访问国家' },
    boardingCountry: { label: '登机/出发国家' },
    arrivalFlightNumber: { label: '入境航班号', placeholder: '如 SQ305' },
    arrivalDate: { label: '入境日期', placeholder: 'YYYY-MM-DD' },
    departureFlightNumber: { label: '离境航班号', placeholder: '如 SQ306' },
    departureDate: { label: '离境日期', placeholder: 'YYYY-MM-DD' },
    isTransitPassenger: { label: '是否过境旅客' },
    accommodationType: { label: '住宿类型' },
    planningArea: { label: '规划区 / 地区' },
    postalCode: { label: '邮政编码', placeholder: '例如：123456' },
    hotelAddress: { label: '详细地址', placeholder: '请输入在新加坡的详细地址' },
  },
  fieldHelp: {
    surname: '请按照护照上的拼写填写姓氏，建议使用大写字母。',
    middleName: '如果护照没有中间名，可留空。',
    givenName: '请填写护照上的名字，顺序与拼写需完全一致。',
    passportNo: '仅限字母或数字，不要输入空格或符号。',
    nationality: '请选择护照上显示的国籍。',
    dob: '格式：YYYY-MM-DD。',
    expiryDate: '入境时护照需至少剩余6个月有效期。',
    sex: '请选择护照上标注的性别。',
    visaNumber: '如已获签证，可填写参考号；无则留空。',
    occupation: '请使用英文描述当前职业或身份。',
    cityOfResidence: '填写常住城市，建议使用大写字母。',
    countryOfResidence: '请选择目前的居住国家/地区。',
    residentCountry: '请选择目前的居住国家/地区。',
    phoneCode: '请输入手机号码对应的国际区号。',
    phoneNumber: '填写可在境外接听的手机号，确保能接收短信/电话。',
    email: '请使用旅途中可以访问的邮箱。',
    travelPurpose: '告知 ICA 此次入境的主要目的。',
    recentStayCountry: '如30天内访问过其他国家，请在此选择。',
    boardingCountry: '填写最终搭乘进新加坡的航班/交通工具的出发地。',
    arrivalFlightNumber: '输入航空公司+航班号，例如 SQ305。',
    arrivalDate: '需在提交 SG Arrival Card 的3天窗口内。',
    departureFlightNumber: '建议填写，以方便说明离境计划。',
    departureDate: '填写计划离开新加坡的日期。',
    isTransitPassenger: '若仅在机场过境且不入境，请开启此选项。',
    accommodationType: '选择在新加坡的住宿方式。',
    planningArea: '选择住宿所在的规划区或地区。',
    postalCode: '新加坡邮编为6位数字，如不清楚可询问酒店。',
    hotelAddress: '请填写完整英文地址，方便移民官核对。',
  },
  accommodationTypes: {
    HOTEL: '酒店 / 度假村',
    HOSTEL: '旅舍 / 宾馆',
    AIRBNB: '民宿 / Airbnb',
    FRIEND_FAMILY: '朋友或亲戚家',
    OTHER: '其他',
  },
};
// Base translations object (will be extended with Traditional Chinese variants)
const baseTranslations = {
  en: {
    tabs: {
      home: 'Home',
      history: 'Archive',
      profile: 'Profile',
    },
    funds: {
      noInfoAvailable: 'No fund information available',
      cash: 'Cash',
    },
    photos: {
      fundProof: {
        title: 'Fund Proof Photo',
        tapToViewLargerImage: 'Tap to view larger image',
      },
    },
    fundItem: {
      types: {
        CASH: 'Cash',
        BANK_CARD: 'Bank Card',
        CREDIT_CARD: 'Credit Card',
        BANK_BALANCE: 'Bank Balance',
        INVESTMENT: 'Investment',
        DOCUMENT: 'Document',
      },
      detail: { notProvided: 'Not provided yet' },
    },
    profile: {
      header: 'Profile',
      user: {
        defaultName: 'Guest User',
        phone: 'Tel: {{phone}}',
      },
      sections: {
        myServices: 'My Services',
        settings: 'Settings & Help',
      },
      menu: {
        entryInfoHistory: {
          title: 'Entry Info History',
          subtitle: 'View completed trips and archived entry info',
        },
        backup: {
          title: 'Cloud Backup',
          subtitle: 'Last backup: {{time}}',
          defaultTime: 'Today',
        },
        language: {
          title: 'Language',
          subtitle: 'Current: {{language}}',
        },
        settings: { title: 'Settings' },
        help: { title: 'Help Center' },
        about: { title: 'About Us' },
        notifications: { title: 'Notification Settings' },
        notificationLogs: {
          title: 'Notification Logs',
          subtitle: 'View notification history and analytics',
        },
        exportData: {
          title: 'Export My Data',
          subtitle: 'Download entry pack data as JSON',
        },
      },
      personal: {
        title: 'Personal Information',
        subtitle: 'Update border details',
        collapsedHint: 'Tap to show personal information',
        gender: {
          male: 'Male',
          female: 'Female',
          undefined: 'Undefined',
          selectPrompt: 'Select gender',
        },
        fields: {
          dateOfBirth: {
            title: 'Date of Birth',
            subtitle: 'Date of Birth',
            placeholder: 'YYYY-MM-DD (auto formatted)',
            formatHint: 'Format: YYYY-MM-DD',
            hint: 'Use digits only',
          },
          gender: {
            title: 'Gender',
            subtitle: 'Gender',
            placeholder: 'MALE / FEMALE',
          },
          occupation: {
            title: 'Occupation',
            subtitle: 'Occupation',
            placeholder: 'Occupation',
          },
          countryRegion: {
            title: 'Country / Region',
            subtitle: 'Country / Region',
            placeholder: 'Select your country',
          },
          provinceCity: {
            title: 'City / Province',
            subtitle: 'City / Province',
            placeholder: 'Province / City',
          },
          phone: {
            title: 'Phone Number',
            subtitle: 'Phone',
            placeholder: '+86 1234567890',
          },
          email: {
            title: 'Email Address',
            subtitle: 'Email',
            placeholder: 'your@email.com',
          },
        },
        errors: {
          dateOfBirth: {
            incomplete: 'Please fill year, month, and day',
            yearRange: 'Year must be between 1900 and {{currentYear}}',
            monthRange: 'Month must be between 1 and 12',
            invalidDay: 'Invalid day for selected month',
            futureDate: 'Date cannot be in the future',
            unrealisticAge: 'Unrealistic age',
          },
        },
      },
      funding: {
        title: 'Funding Proof Checklist',
        subtitle: 'Show quickly at immigration',
        collapsedHint: 'Tap to show funding list',
        tip: {
          title: 'Sufficient funds',
          subtitle: 'Be ready to present at immigration',
          description: 'Prepare cash, cards, bank statements or documents as proof',
        },
        footerNote: 'Tap to view the funding list',
        common: { notFilled: 'Not filled' },
        selectType: 'Select Fund Item Type',
        selectTypeMessage: 'Choose the type of fund item to add',
        type: {
          cash: 'Cash',
          bankCard: 'Bank Card',
          document: 'Supporting Document',
          cancel: 'Cancel',
        },
        empty: 'No fund items yet. Tap below to add your first item.',
        addButton: 'Add Fund Item',
      },
      passport: {
        defaultType: 'Chinese Passport',
        title: 'My Passport',
        subtitle: 'Passport {{passportNo}} · Valid until {{expiry}}',
        fields: {
          fullName: {
            title: 'Full Name',
            subtitle: 'As in passport',
          },
          passportNo: 'Passport Number',
          'passportNo.short': 'Passport No.',
          nationality: 'Nationality',
          'nationality.short': 'Nationality',
          expiry: 'Expiry Date',
          'expiry.short': 'Valid Until',
        },
        updateButton: 'Update passport info',
        collapsedHint: 'Tap to expand passport details',
      },
      vip: {
        title: 'Upgrade to Premium',
        subtitle: 'Unlimited generations, priority',
        upgradeButton: 'Upgrade now',
      },
      editModal: {
        previous: '← Previous',
        next: 'Next →',
        done: 'Done',
      },
      export: {
        confirmTitle: 'Export Data',
        confirmMessage: 'Export your entry pack data as JSON?',
        cancel: 'Cancel',
        confirm: 'Export',
        errorTitle: 'Export Failed',
        errorMessage: 'Failed to export data. Please try again.',
        noDataTitle: 'No Data to Export',
        noDataMessage: 'No data found in your entry pack.',
        successTitle: 'Export Complete',
        successMessage: 'Your data has been exported.',
        ok: 'OK',
        share: 'Share',
        shareUnavailableTitle: 'Sharing Not Available',
        shareUnavailableMessage: 'Sharing is not available on this device.',
        shareTitle: 'Entry Pack Data Export',
        shareMessage: 'Here is my travel entry pack data',
        shareErrorTitle: 'Share Failed',
        shareErrorMessage: 'Unable to share the file.',
      },
      logout: 'Log out',
      version: 'Version {{version}}',
      common: { notFilled: 'Not filled' },
    },
    languages: {
      en: 'English',
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      fr: 'Français',
      de: 'Deutsch',
      es: 'Español',
      zh: '中文',
      ms: 'Bahasa Melayu',
    },
    ms: {
      languages: {
        en: '[ms] English',
        'zh-CN': '[ms] 简体中文',
        'zh-TW': '[ms] 繁體中文',
        fr: '[ms] Français',
        de: '[ms] Deutsch',
        es: '[ms] Español',
        zh: '[ms] 中文',
        ms: 'Bahasa Melayu',
      },
    },
    malaysia: {
      info: {
        headerTitle: 'Malaysia Entry Information',
        title: 'Malaysia Entry Guide',
        subtitle: 'Visa-free for 30 days for Chinese passport holders',
        sections: {
          visa: {
            title: '✓ Great News! Visa-Free Policy',
            items: [
              'Since December 1, 2023, Chinese passport visa-free for 30 days - spontaneous travel!',
              '• No visa application needed in advance',
              '• Valid for tourism, family visits, business purposes',
              '• New requirement: MDAC Digital Arrival Card must be submitted (submission time limit applies)',
            ],
          },
          onsite: {
            title: '⚠️ Entry Information',
            items: [
              '• MDAC has strict time limit: Submit too early = rejected, too late = can\'t make it',
              '• Time calculation error-prone: Must calculate by Malaysia time, timezone issues cause mistakes',
              '• PIN code easy to lose: Must show PIN upon entry, can\'t find email or lost screenshot is troublesome',
              '• CAPTCHA recognition difficult: Alphanumeric code unclear, multiple wrong attempts may get locked',
              '• High accuracy requirement: Any error in passport, flight, accommodation may affect entry',
            ],
          },
          appFeatures: {
            title: '✨ BorderBuddy Makes It Easy',
            items: [
              '• Zero anxiety: Auto-tracks itinerary, reminds you at the perfect time',
              '• Zero errors: Smart-fill MDAC, accurate information',
              '• Zero hassle: Enter once, we manage the entire process',
              '• PIN management: Auto-save PIN and confirmation email, quick display upon entry',
            ],
          },
        },
        continueButton: 'Understood, continue to checklist',
      },
      requirements: {
        headerTitle: 'Malaysia MDAC Checklist',
        introTitle: 'Confirm you have everything ready',
        introSubtitle: 'These items are required to submit the Malaysia Digital Arrival Card',
        items: {
          validPassport: {
            title: 'Passport validity',
            description: 'Passport valid at least 6 months with blank pages',
            details: 'Malaysia immigration requires your passport to remain valid >=6 months beyond your entry date. Renew before traveling if needed.',
          },
          submissionWindow: {
            title: 'Within 3-day window',
            description: 'MDAC only accepts submissions within 3 calendar days before arrival',
            details: 'Count calendar days based on Malaysia time (GMT+8). If it is too early the system will reject the request—set a reminder to submit once inside the window.',
          },
          contactableEmail: {
            title: 'Reachable email inbox',
            description: 'Able to receive the confirmation email and MDAC PIN',
            details: 'Use an email you can log into overseas. Check spam for messages from imigresen.gov.my and keep the PIN handy for arrival.',
          },
          travelDetails: {
            title: 'Flight & stay details',
            description: 'Have your flight number, arrival port, accommodation and phone ready',
            details: 'The form asks for airline, flight number, arrival airport, address in Malaysia, phone number (with country code), and purpose of visit.',
          },
          captchaReady: {
            title: 'Captcha ready',
            description: 'Able to type the letters/numbers shown before submitting',
            details: 'MDAC uses an alphanumeric CAPTCHA. If the code is unclear you can refresh it—complete submission within 5 minutes to avoid timeout.',
          },
        },
        status: {
          success: {
            title: 'Great! You can proceed.',
            subtitle: 'Next we will confirm your travel information.',
          },
          warning: {
            title: 'Please review each item',
            subtitle: 'Ensure you meet the MDAC prerequisites before continuing.',
          },
        },
        continueButton: 'Continue to travel information',
      },
      selection: {
        headerTitle: 'Malaysia MDAC Assistant',
        headerSubtitle: 'Choose how you want to complete the digital arrival card',
        recommendedBadge: 'Recommended',
        smartFlow: {
          title: '⚡ Guided assistant',
          subtitle: 'Step-by-step coach with autofill suggestions',
          highlights: [
            { title: 'Completion time', value: '8-12 min' },
            { title: 'Guided steps', value: '6 steps' },
            { title: 'Success rate', value: '98%' },
          ],
          features: [
            '• Autofill suggestions pulled from your entry pack',
            '• Captcha tips and PIN tracking reminders',
            '• Checklist to verify email confirmation is received',
          ],
          cta: 'Start guided submission ->',
        },
        webFlow: {
          title: '🌐 MDAC web form',
          subtitle: 'Official site inside the app',
          features: [
            '• Full MDAC website rendered in-app',
            '• Copy & paste from your entry pack without switching apps',
            '• Manual control — you submit each page yourself',
          ],
          cta: 'Open embedded MDAC site',
        },
        notes: {
          title: 'Submission reminders',
          items: [
            'Submit within 3 days before arriving in Malaysia (Malaysia time).',
            'Have your confirmation email and MDAC PIN ready for immigration.',
            'If traveling as a family, submit once per traveler — no group form yet.',
          ],
        },
      },
      guide: {
        headerTitle: 'MDAC Guided Submission',
        banner: {
          title: 'Use your entry pack to auto-fill MDAC',
          subtitle: 'We keep track so you won\'t miss key fields or the PIN email',
        },
        stepSectionTitle: 'Follow these steps',
        steps: [
          {
            title: 'Verify traveler information',
            subtitle: 'Compare with your passport before filling the form',
            details: [
              'Confirm English name, passport number, nationality, and expiry match exactly.',
              'Choose travel document type: Passport, then select "China" as nationality.',
              'Enter a reachable phone number with country code (e.g. +86 13800138000).',
            ],
          },
          {
            title: 'Fill travel details',
            subtitle: 'Use your stored itinerary for accuracy',
            details: [
              'Input arrival airport and flight number (e.g. KUL / MH389).',
              'Select arrival date/time within the 3-day window; double-check the calendar.',
              'Provide accommodation name and address or the contact of your host.',
            ],
          },
          {
            title: 'Submit and save confirmation',
            subtitle: 'CAPTCHA + PIN email are the last steps',
            details: [
              'Solve the alphanumeric CAPTCHA exactly as shown; refresh if unreadable.',
              'After submitting, capture the MDAC PIN shown on screen.',
              'Check your email (including spam) for the confirmation message and keep it for arrival.',
            ],
          },
        ],
        quickActions: {
          title: 'Quick tools',
          items: [
            {
              icon: '📧',
              title: 'Track your PIN email',
              description: 'Log which email account you used and confirm the message arrived.',
            },
            {
              icon: '📍',
              title: 'Copy stay details',
              description: 'Tap to copy hotel address/phone straight from your entry pack.',
            },
            {
              icon: '🔁',
              title: 'Resubmit easily',
              description: 'If plans change, reuse saved info to submit a new MDAC quickly.',
            },
          ],
        },
        primaryCta: 'Open MDAC web assistant',
        ctaHint: 'We will load the official site inside the app.',
      },
      webview: {
        headerTitle: 'MDAC Web Assistant',
        notice: 'Complete the official Malaysia Digital Arrival Card (MDAC) here. All data stays on your device.',
        loading: 'Loading official MDAC site...',
        openExternal: 'Open in browser',
        openFailedTitle: 'Unable to open link',
        openFailedBody: 'Please copy the URL and open it in your browser instead.',
      },
      result: {
        digitalBadge: 'Submit within 3 days',
        digitalTitle: 'Malaysia Digital Arrival Card (MDAC)',
        digitalHighlight: 'We help you submit MDAC using your saved passport and itinerary. Keep the PIN email ready for arrival.',
        digitalButton: 'Launch MDAC assistant',
      },
    },
    singapore: {
      info: {
        headerTitle: 'Singapore Entry Information',
        title: 'Singapore Entry Guide',
        subtitle: 'Visa-free for 30 days for Chinese passport holders',
        sections: {
          visa: {
            title: '✓ Great News! Visa-Free Policy',
            items: [
              'Since February 9, 2024, Chinese passport visa-free for 30 days - spontaneous travel!',
              '• No visa application needed in advance',
              '• Valid for tourism, family visits, business purposes',
              '• New requirement: SG Arrival Card must be submitted (submission time limit applies)',
            ],
          },
          onsite: {
            title: '⚠️ Entry Information',
            items: [
              '• SG Arrival Card has time limit: Submit too early = invalid, too late = can\'t make it',
              '• Time calculation error-prone: Must calculate by Singapore time, timezone issues cause mistakes',
              '• Confirmation code easy to lose: Must show upon entry, can\'t find email is troublesome',
              '• High accuracy requirement: Any error in passport, flight, accommodation may affect entry',
              '• Immigration checks strict: Documents incomplete or answers unclear may trigger secondary inspection',
            ],
          },
          appFeatures: {
            title: '✨ BorderBuddy Makes It Easy',
            items: [
              '• Zero anxiety: Auto-tracks itinerary, reminds you at the perfect time',
              '• Zero errors: Smart-fill SG Arrival Card, accurate information',
              '• Zero hassle: Enter once, we manage the entire process',
              '• Confirmation management: Auto-save confirmation code, quick display upon entry',
            ],
          },
        },
        continueButton: 'Got it, continue to the checklist',
      },
      requirements: {
        headerTitle: 'SG Arrival Card Checklist',
        introTitle: 'Confirm you meet these requirements',
        introSubtitle: 'Singapore only accepts arrivals with declarations completed inside the 3-day window',
        items: {
          validPassport: {
            title: 'Passport validity',
            description: 'Passport should be valid 6+ months beyond arrival',
            details: 'Singapore recommends at least 6 months validity. Renew or replace damaged passports before travel.',
          },
          submissionWindow: {
            title: 'Within 3-day submission window',
            description: 'Form opens 3 days before arrival (Singapore time, GMT+8)',
            details: 'Submitting earlier than the window will result in an error. Set a reminder to complete the SG Arrival Card once the clock reaches the window.',
          },
          travelDetails: {
            title: 'Travel & stay information',
            description: 'Flight, arrival terminal/border, lodging/contact, purpose of visit',
            details: 'Prepare your airline/ferry/bus details, stay address, and contact number in international format. Business travelers should list local sponsor info if available.',
          },
          familyGroups: {
            title: 'Group/family plan',
            description: 'Decide if you will submit individually or through family submission',
            details: 'Group submission supports up to 10 travelers. Have everyone\'s passport details ready and confirm that minors are included in a guardian\'s form.',
          },
          sgArrivalHistory: {
            title: 'Previous submissions',
            description: 'Remember SG Arrival Cards expire after a single entry',
            details: 'If you re-enter within a short period, submit a fresh declaration with updated travel details. Old entries cannot be reused.',
          },
        },
        status: {
          success: {
            title: 'Great! You can proceed.',
            subtitle: 'Next we will confirm your travel information.',
          },
          warning: {
            title: 'Review each checklist item',
            subtitle: 'Complete the prerequisites before moving on.',
          },
        },
        continueButton: 'Continue to travel information',
      },
      selection: {
        headerTitle: 'SG Arrival Card Assistant',
        headerSubtitle: 'Pick the workflow that suits you best',
        recommendedBadge: 'Recommended',
        smartFlow: {
          title: '⚡ Guided assistant',
          subtitle: 'Use your entry pack to breeze through the form',
          highlights: [
            { title: 'Completion time', value: '6-10 min' },
            { title: 'Group ready', value: 'Up to 10 pax' },
            { title: 'Success rate', value: '98%' },
          ],
          features: [
            '• Auto-suggests answers for passport, flight, and accommodation',
            '• Reminds you to add family members and review health declarations',
            '• Tracks confirmation emails and highlights what to show at immigration',
          ],
          cta: 'Start guided assistant ->',
        },
        webFlow: {
          title: '🌐 SG Arrival Card website',
          subtitle: 'Use the official form within the app',
          features: [
            '• Embedded official site with full features',
            '• Copy & paste from your entry pack without switching apps',
            '• Ideal if you already know the form and just need quick access',
          ],
          cta: 'Open embedded SG Arrival Card',
        },
        notes: {
          title: 'Submission reminders',
          items: [
            'One declaration per entry. Transit passengers without immigration clearance do not need to submit.',
            'Families can submit together but each traveler must be declared separately.',
            'Keep the confirmation email/SMS handy in case officers request to see it.',
          ],
        },
      },
      guide: {
        headerTitle: 'SG Arrival Card Guided Mode',
        banner: {
          title: 'Leverage stored info to auto-fill the declaration',
          subtitle: 'Step-by-step guidance with reminders for family submissions',
        },
        stepSectionTitle: 'Follow these steps',
        steps: [
          {
            title: 'Verify traveler details',
            subtitle: 'Make sure passport information matches exactly',
            details: [
              'Confirm full name (as in passport), passport number, nationality, and expiry date.',
              'Choose the correct traveler type (e.g. Foreign Visitor, Returning Resident).',
              'Provide a reachable email and mobile number, both required for status updates.',
            ],
          },
          {
            title: 'Fill arrival & stay information',
            subtitle: 'Use your itinerary for accurate answers',
            details: [
              'Enter arrival date/time and flight/ferry/bus number within the 3-day window.',
              'Select arrival checkpoint (e.g. Changi Airport Terminal 3, Tuas Checkpoint).',
              'Provide accommodation address or local contact information including postal code.',
            ],
          },
          {
            title: 'Health and declarations',
            subtitle: 'Complete health/travel history honestly',
            details: [
              'Declare recent travel history to high-risk areas when prompted.',
              'Answer health symptom questions accurately; bring supporting documents if needed.',
              'Submit and check for the confirmation email/SMS before boarding your flight.',
            ],
          },
        ],
        quickActions: {
          title: 'Quick tools',
          items: [
            {
              icon: '🕒',
              title: '72-hour reminder',
              description: 'We nudge you when the submission window opens based on your arrival date.',
            },
            {
              icon: '👪',
              title: 'Family helper',
              description: 'Duplicate saved info to add additional family members quickly.',
            },
            {
              icon: '📬',
              title: 'Confirmation tracker',
              description: 'Log which email/SMS received the approval so you can present it on arrival.',
            },
          ],
        },
        primaryCta: 'Open SG Arrival Card assistant',
        ctaHint: 'Loads the official ICA website inside the app.',
      },
      webview: {
        headerTitle: 'SG Arrival Card Web Assistant',
        notice: 'Complete the official SG Arrival Card here. BorderBuddy only keeps data locally on your device.',
        loading: 'Loading SG Arrival Card...',
        openExternal: 'Open in browser',
        openFailedTitle: 'Unable to open link',
        openFailedBody: 'Please copy the URL and open it manually in your browser.',
      },
      result: {
        digitalBadge: 'Submit within 3 days',
        digitalTitle: 'Singapore SG Arrival Card',
        digitalHighlight: 'Use your entry pack to declare before landing in Singapore. Keep the confirmation email/SMS ready at immigration.',
        digitalButton: 'Launch SG Arrival assistant',
      },
    },
    sg: {
      navigation: {
        submitButton: {
          default: 'Save & Continue',
          incomplete: 'Complete required information',
          almostDone: 'Almost there—review remaining fields',
          ready: 'Ready for SG Arrival submission',
        },
      },
      travelInfo: sgTravelInfoEn,
      result: {
        digitalBadge: 'Submit within 3 days',
        digitalTitle: 'Singapore SG Arrival Card',
        digitalHighlight:
          'Use your entry pack to declare before landing in Singapore. Keep the confirmation email/SMS ready at immigration.',
        digitalButton: 'Launch SG Arrival assistant',
      },
    },
    hongkong: {
      info: {
        headerTitle: 'Hong Kong Entry Information',
        title: 'Hong Kong Entry Guide',
        subtitle: 'Visa-free for 7 days for Chinese passport holders',
        sections: {
          visa: {
            title: '✓ Great News! Visa-Free Policy',
            items: [
              'Chinese passport visa-free for 7 days - spontaneous travel!',
              '• No visa application needed in advance',
              '• Valid for tourism, business, family visits',
              '• Extensions can be applied through Hong Kong Immigration if needed',
              '• Document options: Both passport and Mainland Travel Permit for Hong Kong are valid',
            ],
          },
          onsite: {
            title: '⚠️ Entry Information',
            items: [
              '• Short stay duration: Only 7 days, must leave on time or apply for extension',
              '• Immigration checks strict: May ask detailed questions about purpose, accommodation, funds',
              '• Document preparation required: Return ticket, hotel booking, funds proof all needed',
              '• Health declaration may required: Depending on current health policies',
              '• E-channels limited: First-time visitors must use manual counters, longer queues',
            ],
          },
          appFeatures: {
            title: '✨ BorderBuddy Makes It Easy',
            items: [
              '• Zero anxiety: Auto-reminds 7-day limit, no worries about overstay',
              '• Zero errors: Pre-filled travel information, immigration questions prepared',
              '• Zero hassle: Enter once, all documents organized',
              '• Document checklist: Comprehensive preparation list, no missing items',
            ],
          },
        },
        continueButton: 'Understood, continue to checklist',
      },
      requirements: {
        headerTitle: 'Hong Kong Entry Checklist',
        introTitle: 'Entry preparation checklist',
        introSubtitle: 'Fill in what you have and complete gradually',
        items: {
          validPassport: {
            title: 'Passport validity',
            description: 'Passport should be valid for at least 1 month beyond your stay',
            details: 'Hong Kong requires your passport to be valid beyond your intended stay. Check expiry date and renew if necessary.',
          },
          returnTicket: {
            title: 'Return or onward ticket',
            description: 'Confirmed booking for departure from Hong Kong',
            details: 'Immigration may ask to see proof of your return flight or onward journey. Have your e-ticket or booking confirmation ready.',
          },
          accommodation: {
            title: 'Accommodation proof',
            description: 'Hotel booking or host contact information',
            details: 'Bring hotel reservation confirmation or contact details of your host in Hong Kong, including address and phone number.',
          },
          sufficientFunds: {
            title: 'Sufficient funds',
            description: 'Cash, credit cards, or bank statements',
            details: 'You may need to demonstrate you have enough money for your stay. Bring cash, credit cards, or recent bank statements.',
          },
          healthDeclaration: {
            title: 'Health declaration',
            description: 'Complete if required by current health regulations',
            details: 'Check if health declarations or COVID-related documents are needed. Complete any required forms before arrival.',
          },
        },
        status: {
          info: {
            title: 'Start anytime',
            subtitle: 'We support progressive completion',
          },
        },
        startButton: 'Start filling',
      },
    },
    taiwan: {
      info: {
        headerTitle: 'Taiwan Entry Information',
        title: 'Taiwan Entry Guide',
        subtitle: 'Entry permit and Online Arrival Card required',
        sections: {
          visa: {
            title: '✓ Entry Permit Policy',
            items: [
              'Mainland Chinese must obtain Entry Permit (入台证) - online application, about 5 business days',
              '• Single-entry valid 3 months, stay up to 15 days',
              '• Multiple-entry valid 1 year, up to 15 days per visit',
              '• New requirement: Online Arrival Card must be completed',
            ],
          },
          onsite: {
            title: '⚠️ Entry Information',
            items: [
              '• Entry Permit expiration easy to miss: Valid for 3 months, must enter within period',
              '• Online Arrival Card complex: Personal info, flight details, accommodation all required',
              '• Email verification required: Must verify email before filling form, easy to miss',
              '• Document preparation cumbersome: Entry permit, passport, return ticket, accommodation, funds all required',
              '• Immigration interview possible: Purpose unclear or documents incomplete may trigger detailed questioning',
            ],
          },
          appFeatures: {
            title: '✨ BorderBuddy Makes It Easy',
            items: [
              '• Zero anxiety: Auto-reminds Entry Permit validity, no worries about expiration',
              '• Zero errors: Smart-fill Online Arrival Card, accurate information',
              '• Zero hassle: Enter once, auto-generate all forms',
              '• Document checklist: Comprehensive preparation list, no missing items',
            ],
          },
        },
        continueButton: 'Understood, continue to checklist',
      },
      requirements: {
        headerTitle: 'Taiwan Online Arrival Card Checklist',
        introTitle: 'Make sure you are ready',
        introSubtitle: 'You must finish email verification before filling the form',
        items: {
          validPassport: {
            title: 'Passport validity',
            description: 'Passport valid for your intended stay',
            details: 'Taiwan recommends at least 6 months validity. Replace damaged or expiring passports prior to travel.',
          },
          emailAccess: {
            title: 'Email inbox access',
            description: 'Able to receive a one-time verification code (OTP)',
            details: 'Use an email that you can log into immediately. The OTP expires quickly; keep the inbox open while submitting.',
          },
          submissionWindow: {
            title: 'Submit before arrival',
            description: 'Complete the form as soon as flights and accommodation are confirmed',
            details: 'Taiwan allows early submission, but update the card if any information changes (flight, hotel, contact).',
          },
          travelDetails: {
            title: 'Flight & stay details',
            description: 'Prepare accurate itinerary information',
            details: 'Have your airline, flight number, seat info (optional), accommodation or host address, and contact number ready.',
          },
          otpReady: {
            title: 'OTP ready',
            description: 'Phone or email inbox handy to read the verification code',
            details: 'The system sends a numeric OTP to your email. Enter it within a few minutes to unlock the form.',
          },
        },
        status: {
          info: {
            title: 'Great! Let\'s proceed.',
            subtitle: 'Next we will verify your travel details and help you fill the form.',
          },
        },
        continueButton: 'Continue to travel information',
      },
      selection: {
        headerTitle: 'Taiwan Arrival Card Assistant',
        headerSubtitle: 'Choose between guided mode or direct website access',
        recommendedBadge: 'Recommended',
        smartFlow: {
          title: '⚡ Guided assistant',
          subtitle: 'Uses your entry pack and tracks OTP progress',
          highlights: [
            { title: 'Completion time', value: '7-12 min' },
            { title: 'OTP steps', value: 'Email + code' },
            { title: 'Success rate', value: '97%' },
          ],
          features: [
            '• Autofill passport, flight, and hotel details from your entry pack',
            '• Reminds you to request and enter the verification code in time',
            '• Checklist to confirm you received the confirmation email',
          ],
          cta: 'Start guided assistant ->',
        },
        webFlow: {
          title: '🌐 Taiwan arrival website',
          subtitle: 'Open the official site inside the app',
          features: [
            '• Embedded website with OTP request button',
            '• Copy/paste from your entry pack without leaving the app',
            '• Ideal if you already know the process and just need quick access',
          ],
          cta: 'Open embedded Taiwan arrival card',
        },
        notes: {
          title: 'Submission reminders',
          items: [
            'Request the OTP only when you are ready to complete the form (it expires quickly).',
            'If you change flights or accommodation, submit an updated arrival card before boarding.',
            'Keep a screenshot or email confirmation to show immigration if requested.',
          ],
        },
      },
      guide: {
        headerTitle: 'Taiwan Arrival Card Guided Mode',
        banner: {
          title: 'Use your entry pack to pass the email verification quickly',
          subtitle: 'We walk you through requesting the OTP and filling each section',
        },
        stepSectionTitle: 'Follow these steps',
        steps: [
          {
            title: 'Request verification email',
            subtitle: 'Confirm your email inbox is ready',
            details: [
              'Enter your email and tap "Send Code" on the official site.',
              'Check your inbox (and spam) for a 6-digit OTP from the Taiwan immigration site.',
              'Paste the code within the time limit to unlock the form.',
            ],
          },
          {
            title: 'Fill traveler & arrival details',
            subtitle: 'Autofill from your entry pack for speed',
            details: [
              'Verify your passport number, nationality, and date of birth.',
              'Enter arrival flight number, date/time, and port of entry.',
              'Provide accommodation address/phone or host details in Taiwan.',
            ],
          },
          {
            title: 'Travel history & confirmation',
            subtitle: 'Answer the 14-day travel history questions accurately',
            details: [
              'Declare countries visited in the last 14 days and health status truthfully.',
              'Review the summary page carefully before submitting.',
              'Wait for the confirmation page/email and save a screenshot for arrival.',
            ],
          },
        ],
        quickActions: {
          title: 'Quick tools',
          items: [
            {
              icon: '✉️',
              title: 'OTP checker',
              description: 'Tick off once the verification email arrives so you don\'t miss it.',
            },
            {
              icon: '📄',
              title: 'Auto-fill clipboard',
              description: 'Copy passport/flight info with one tap while filling the form.',
            },
            {
              icon: '🔁',
              title: 'Resubmit helper',
              description: 'If plans change, reuse saved info to create a new arrival card quickly.',
            },
          ],
        },
        primaryCta: 'Open Taiwan arrival assistant',
        ctaHint: 'Loads the official arrival card site inside the app.',
      },
      webview: {
        headerTitle: 'Taiwan Arrival Card Web Assistant',
        notice: 'Request the verification email, enter the OTP, and complete the form here. All data stays on your device.',
        loading: 'Loading Taiwan arrival card...',
        openExternal: 'Open in browser',
        openFailedTitle: 'Unable to open link',
        openFailedBody: 'Please copy the URL and open it manually in your browser.',
      },
      result: {
        digitalBadge: 'Finish before landing',
        digitalTitle: 'Taiwan Online Arrival Card',
        digitalHighlight: 'We help manage the email verification and form submission. Keep the confirmation email for immigration.',
        digitalButton: 'Launch Taiwan assistant',
      },
    },
    login: {
      tagline: 'Cross-border entry • Seamless passage',
      benefits: {
        free: 'Completely free',
        noRegistration: 'No registration',
        instant: 'Instant use',
      },
      heroCard: {
        title: 'Fill once, travel everywhere',
        description: 'Passport, visa, entry forms—enter once, auto-generate for each country. Complete all entry prep in minutes before departure, save 90% of time.',
      },
      features: {
        digitalPack: 'Digital Entry Pack',
        voiceAssistant: 'Smart Voice Assistant',
        entryNavigation: 'Entry Navigation',
      },
      ctaTitle: 'Cross-border entry has never been so simple',
      ctaSubtitle: 'One-click form filling, enjoy seamless customs experience',
      buttonText: 'Get Started • Free',
      buttonSubtext: 'No signup, instant access',
      whisperText: '💬 Bored? You can chat with your assistant 😄',
      popularityText: '{{percent}}% smooth entry',
      hotlistLabel: 'Trending destinations',
      hotlistDescription: 'Popular picks this week',
    },
    common: {
      appName: 'BorderBuddy',
      enterCta: 'Enter For Free',
      footerMessage: 'Try BorderBuddy for free — AI handles your border paperwork',
      ok: 'OK',
      cancel: 'Cancel',
      confirm: 'Confirm',
      back: 'Back',
      view: 'View',
      unknown: 'Unknown',
      yes: 'Yes',
      no: 'No',
      error: 'Error',
      delete: 'Delete',
      buttons: {
        cancel: 'Cancel',
        share: 'Share',
      },
      images: {
        tapToEnlarge: 'Tap to enlarge',
      },
      reader: {
        font: {
          decrease: 'A-',
          increase: 'A+',
        },
      },
      privacy: {
        localStorage: 'All information is saved locally on your device only',
      },
    },
    tabs: {
      home: 'Home',
      history: 'Archive',
      profile: 'Profile',
    },
    screenTitles: {
      scanPassport: 'Scan Document',
      selectDestination: 'Select Destination',
      result: 'Entry Pack',
      copyWriteMode: 'Copy Write Mode',
    },
    copyWriteMode: {
      title: 'Copy Write Mode',
      subtitle: 'Reference this screen to fill out paper forms',
      description: 'Screen stays awake so you can copy at your pace',
      fontSizeLabel: 'Font Size:',
      instructionsTitle: 'Instructions',
      step1: '1. Copy each field onto the paper form',
      step2: '2. Move down the form top to bottom',
      step3: '3. Hand the completed forms to the officer',
      // Japan Forms
      japanLandingCard: 'Landing Card (Black Form)',
      japanCustomsDeclaration: 'Customs Declaration (Yellow Form)',
      // Canada E311 Form
      canadaPart1: 'Part 1: Traveler Information',
      canadaPart2: 'Part 2: Address Information',
      canadaPart3: 'Part 3: Travel Details',
      canadaPart4: 'Part 4: Customs Declaration (Check YES or NO)',
      // Field Labels
      familyName: 'Family Name',
      givenName: 'Given Name',
      lastName: 'Last Name',
      firstName: 'First Name',
      middleInitial: 'Initial',
      dateOfBirth: 'Date of Birth',
      nationality: 'Nationality',
      citizenship: 'Citizenship',
      passportNumber: 'Passport Number',
      flightNumber: 'Flight Number',
      purposeOfVisit: 'Purpose of Visit',
      addressInJapan: 'Address in Japan',
      name: 'Name',
      prohibitedItems: 'Prohibited Items?',
      cashOverLimit: 'Cash > ¥10,000?',
      commercialGoods: 'Commercial Goods?',
      totalValueOfGoods: 'Total Value of Goods',
      homeAddress: 'Home Address',
      postalCode: 'Postal/ZIP Code',
      airlineFlightNumber: 'Airline/Flight Number',
      arrivalDate: 'Arrival Date',
      arrivingFrom: 'Arriving From',
      purposeOfTrip: 'Purpose of Trip',
      currencyOverLimit: 'Currency/monetary instruments ≥ CAN$10,000?',
      commercialGoodsForResale: 'Commercial goods, samples, or goods for resale?',
      foodPlantsAnimals: 'Food, plants, animals, or related products?',
      visitedFarm: 'Visited a farm or been in contact with farm animals?',
      firearms: 'Firearms or weapons?',
      exceedsDutyFree: 'Goods exceed duty-free allowance?',
      // Instructions
      instructionFamilyName: 'Fill in surname from passport',
      instructionGivenName: 'Fill in given name from passport',
      instructionLastName: 'Fill in surname from passport (CAPITAL LETTERS)',
      instructionFirstName: 'Fill in given name from passport (CAPITAL LETTERS)',
      instructionMiddleInitial: 'Leave blank if no middle name',
      instructionDateOfBirth: 'Format: YYYYMMDD',
      instructionDateOfBirthDash: 'Format: YYYY-MM-DD',
      instructionNationality: 'Fill in nationality',
      instructionCitizenship: 'Fill in nationality (CAPITAL LETTERS)',
      instructionPassportNumber: 'Fill in passport number',
      instructionFlightNumber: 'e.g., CA981, CZ309',
      instructionFlightNumberCanada: 'e.g., AC088, CZ329',
      instructionPurposeOfVisit: 'Fill in TOURISM',
      instructionAddressInJapan: 'Fill in hotel name and address',
      instructionName: 'Fill in Chinese name',
      instructionProhibitedItems: 'If no prohibited items, fill NO',
      instructionTruthfulAnswer: 'Answer truthfully',
      instructionTotalValue: 'Fill in ¥0 unless you need to declare goods over ¥200,000',
      instructionCanadaAddress: 'Fill in address in Canada (hotel address)',
      instructionPostalCode: 'Hotel postal code (if known)',
      instructionDateFormat: 'Format: YYYY-MM-DD',
      instructionArrivingFrom: 'If connecting through USA, fill U.S.A.',
      instructionPurposeOptions: 'Options: Study / Personal / Business',
      instructionFoodItems: 'Including: fruits, meat, seeds, wood products, etc.',
      instructionGiftsLimit: 'Gifts over CAN$60 must be declared',
      // Tips
      tipsTitle: 'Important Tips',
      tipJapan1: 'Please use black or blue pen to fill out the form',
      tipJapan2: 'Handwriting should be clear and neat, avoid corrections',
      tipJapan3: 'Customs declaration section must be filled out truthfully',
      tipJapan4: 'After completing, hand to immigration officer for inspection',
      tipJapan5: 'Keep landing card stub until departure',
      tipCanada1: 'Please use CAPITAL LETTERS to fill in name and nationality',
      tipCanada2: 'Date format: YYYY-MM-DD (e.g., 2025-01-15)',
      tipCanada3: 'Customs declaration section must be filled out truthfully',
      tipCanada4: 'After completing, sign at the bottom of the form',
      tipCanada5: 'Children under 16 can be signed by parents',
      // Sample Card
      sampleTitleJapan: 'Landing Card and Declaration Form Sample',
      sampleTitleCanada: 'E311 Form Sample',
      sampleImageTitleJapan: 'Landing Card & Customs Declaration',
      sampleImageTitleCanada: 'E311 Declaration Card',
      sampleSubtitle: '(Paper form image example)',
      sampleDescription: 'Field order on form matches this page',
      // Bottom Tip
      bottomTipTitle: 'After copying, remember to check once',
      bottomTipDescription: 'Ensure name, passport number, flight number and other important information are correct',
      // Values and Placeholders
      valueLeaveBlank: '(Leave blank)',
      defaultChineseName: 'Zhang Wei',
    },
    home: {
      header: {
        title: 'BorderBuddy',
      },
      languageModal: {
        title: 'Select Language',
      },
      greeting: 'Hi, {{name}} 👋',
      welcomeText: 'Choose a destination to generate your entry pack',
      sections: {
        pending: '🛬 Upcoming trips',
        whereToGo: '🧭 Where do you want to go?',
      },
      passport: {
        type: 'Chinese Passport',
      },
      destinationNames: {
        jp: 'Japan',
        th: 'Thailand',
        hk: 'Hong Kong',
        tw: 'Taiwan',
        kr: 'South Korea',
        sg: 'Singapore',
        vn: 'Vietnam',
        my: 'Malaysia',
        us: 'United States',
      },
      destinations: {
        japan: { flightTime: '3 hours flight' },
        thailand: { flightTime: '3 hours flight' },
        hongKong: { flightTime: '1 hour flight' },
        taiwan: { flightTime: '2 hours flight' },
        korea: { flightTime: '2 hours flight' },
        singapore: { flightTime: '5 hours flight' },
        vietnam: { flightTime: '3.5 hours flight' },
        malaysia: { flightTime: '4 hours flight' },
        usa: { flightTime: '13 hours flight' },
      },
      visaBadges: {
        visaFree: 'Visa-free',
        visaOnArrival: 'Visa on arrival',
        eVisa: 'eVisa',
        eta: 'ETA',
        hkPermit: 'Home Return Permit',
        twEntryPermit: 'Taiwan Entry Permit',
        visaRequired: 'Visa required',
        unknown: 'To be confirmed',
      },
      pendingTrips: {
        departSuffix: 'Departure',
        cards: {
          jp: { title: 'Japan · Tokyo' },
          th: { title: 'Thailand · Bangkok' },
          us: { title: 'USA · New York' },
          kr: { title: 'South Korea · Seoul' },
          sg: { title: 'Singapore · Changi' },
          my: { title: 'Malaysia · Kuala Lumpur' },
          tw: { title: 'Taiwan · Taipei' },
          hk: { title: 'Hong Kong' },
        },
      },
      alerts: {
        notAvailableTitle: 'Coming soon',
        notAvailableBody: 'This destination is not available yet. Please stay tuned!',
        historyFoundTitle: 'Entry pack found',
        historyFoundBody: {
          pre: 'We found an entry pack for {{country}}:',
          flight: 'Flight',
          date: 'Date',
          hotel: 'Hotel',
          question: 'Use this entry pack?',
          regenerate: 'Generate again',
        },
      },
      history: {
        emptyTitle: 'No history yet',
        emptySubtitle: 'Your entry packs will appear here',
        cardTitle: '{{country}} Entry Pack',
      },
      actions: {
        leaveTrip: 'Cancel',
        archiveTrip: 'Archive',
        restoreTrip: 'Restore to Home',
        show: 'Show',
        hide: 'Hide',
        showSection: 'Show list',
        hideSection: 'Hide list',
      },
    },
    history: {
      headerTitle: 'Archive',
      filterButton: 'Filter ⌄',
      searchPlaceholder: 'Search destination or date…',
      timePrefix: 'Generated',
      passportPrefix: 'Passport',
      sections: {
        today: 'Today',
        yesterday: 'Yesterday',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        earlier: 'Earlier',
      },
      items: {
        hk: {
          title: 'Hong Kong Entry Pack',
          time: 'Today at 2:30 PM',
          passport: 'Chinese Passport E12345678',
        },
        th: {
          title: 'Thailand Entry Pack',
          time: 'Yesterday at 10:15 AM',
          passport: 'Chinese Passport E12345678',
        },
      },
      empty: {
        title: 'No history yet',
        subtitle: 'Your generated entry packs will appear here',
      },
      labels: {
        arrivalDate: 'Arrival date',
        submittedAt: 'Submitted at',
        createdAt: 'Created at',
      },
      left: {
        title: 'Left trips',
        helper: 'You can restore any trip back to Home whenever you need.',
        status: 'Left',
        movedAt: 'Moved here: {{date}}',
        completion: 'Completion {{percent}}%',
      },
      archived: {
        title: 'Archived trips',
        helper: 'Restore an archived trip when you need it again.',
        status: 'Archived',
        archivedAt: 'Archived on: {{date}}',
      },
      actions: {
        show: 'Show',
        hide: 'Hide',
        showSection: 'Show list',
        hideSection: 'Hide list',
        restoreTrip: 'Restore to Home',
        archiveTrip: 'Archive',
        archiveTitle: 'Archive this trip?',
        archiveMessage: 'The trip will move to "Archived" and can be restored later.',
        archiveConfirm: 'Confirm archive',
        archiveSuccess: '{{destination}} archived.',
        restoreSuccess: '{{destination}} restored to Home.',
        errorTitle: 'Action failed',
        errorMessage: 'Please try again later.',
      },
    },
    travelInfo: {
      header: { title: 'Travel Information', back: 'Back' },
      infoCard: { title: 'Traveling to {{destination}}', subtitle: 'Fill in your travel details' },
      sections: { flight: 'Flight Information', accommodation: 'Accommodation', trip: 'Trip Details', health: 'Health Declaration', usCustoms: 'US Customs Declaration', caCustoms: 'Canada Customs Declaration' },
      fields: {
        flightNumber: { label: 'Flight Number', placeholder: 'e.g. CA981' },
        arrivalDate: { label: 'Arrival Date', placeholder: 'YYYY-MM-DD', help: 'Must be within 72 hours' },
        hotelName: { label: 'Hotel Name', placeholder: 'Hotel name or address' },
        hotelAddress: { label: 'Hotel Address', placeholder: 'Full address' },
        contactPhone: { label: 'Contact Phone', placeholder: '+1234567890' },
        stayDuration: { label: 'Stay Duration (days)', placeholder: 'e.g. 7' },
        purpose: 'Purpose of Visit',
      },
      purposes: { tourism: 'Tourism', business: 'Business', visiting: 'Visiting Family', study: 'Study', work: 'Work' },
      yesNoQuestion: { fever: 'Have you had a fever recently?', usCash: 'Carrying over $10,000 USD?', usFood: 'Bringing food, plants, or animals?', caCurrency: 'Carrying over CAD $10,000?', caDuty: 'Bringing goods subject to duty?', caFirearms: 'Bringing firearms or weapons?', caCommercial: 'Bringing commercial goods?', caFood: 'Bringing food, plants, animals, or related products?' },
      arrivingFrom: { label: 'Arriving from', us: 'United States', other: 'Other Country' },
      hints: { caDuty: 'Including alcohol, tobacco, gifts exceeding exemption', caFood: 'Including meat, dairy, fruits, vegetables, seeds' },
      scanButtons: { ticket: 'Scan Ticket', hotel: 'Scan Booking' },
      generateButton: 'Generate Entry Pack',
      tips: { title: '💡 Tips', body: '• Have your flight ticket ready\n• Hotel booking confirmation\n• Be honest with customs declarations\n• Keep contact information handy' },
      alerts: {
        permissionPhotoTitle: 'Photo Permission Required',
        permissionPhotoBody: 'We need camera/photo access to scan documents',
        permissionDeniedAction: 'OK',
        ocrSuccessFlight: 'Flight info extracted!',
        ocrSuccessHotel: 'Hotel info extracted!',
        loginRequiredTitle: 'Login Required',
        loginRequiredBody: 'OCR feature requires login',
        loginButton: 'Login',
        manualEntryButton: 'Enter Manually',
        ocrFailTitle: 'Recognition Failed',
        ocrFailBody: 'Could not extract information',
        genericErrorTitle: 'Error',
        galleryError: 'Failed to open gallery',
        dateTooFarTitle: 'Date Too Far',
        dateTooFarBody: 'Arrival date must be within 72 hours ({{days}} days away)',
        datePastTitle: 'Invalid Date',
        datePastBody: 'Arrival date cannot be in the past',
      },
      duplicateModal: {
        title: 'Entry Pack Already Exists',
        message: 'We found an existing entry pack with the same flight information:',
        labels: { destination: 'Destination:', flight: 'Flight:', arrival: 'Arrival:', generated: 'Generated:' },
        arrivalSuffix: '{{date}} arrival',
        hint: 'Would you like to use the existing pack or generate a new one?',
        useExisting: 'Use Existing Pack',
        regenerate: 'Generate New Pack',
        cancel: 'Cancel',
      },
    },
    thailand: {
      entryGuide: {
        entryPack: {
          openButton: 'Open Entry Pack 📋',
        },
        title: 'Thailand Entry Guide (DMK Airport)',
        subtitle: 'Complete 8-step process from TDAC to hotel arrival',
        steps: {
          tdac: {
            title: 'TDAC Digital Arrival Card',
            titleZh: 'TDAC数字入境卡',
            description: 'Submit within 72 hours before arrival',
            descriptionZh: '抵达前72小时内提交',
            tips: [
              'Prepare passport, flight info, Thailand address',
              'Fill in English passport information',
              'Save QR code to phone gallery'
            ],
            tipsZh: [
              '准备护照、航班信息、泰国地址',
              '填写英文护照信息',
              '保存QR码到手机相册'
            ]
          },
          atm: {
            title: 'ATM Cash Withdrawal',
            titleZh: 'ATM取泰铢现金',
            description: 'Withdraw 3,000-5,000 THB at airport ATM',
            descriptionZh: '在机场ATM机取3,000-5,000泰铢',
            banks: [
              'Bangkok Bank (曼谷银行)',
              'Krungsri (泰国大城银行)',
              'Kasikorn Bank (开泰银行)'
            ],
            steps: [
              'Find ATM in arrival hall (1st floor)',
              'Choose English interface',
              'Enter PIN, select Savings account',
              'Withdraw 3,000-5,000 THB',
              'Fee: ~220 THB per transaction'
            ],
            stepsZh: [
              '找到ATM机（到达大厅1楼）',
              '选择英语界面',
              '输入密码，选择储蓄账户',
              '取款3,000-5,000泰铢',
              '手续费：约220泰铢/次'
            ],
            safety: [
              'Watch surroundings carefully',
              'Protect your PIN when entering',
              'Don\'t accept "help" from strangers',
              'Note ATM number if card is retained'
            ],
            safetyZh: [
              '注意周边环境安全',
              '保护密码输入安全',
              '不要接受陌生人"帮助"',
              '如ATM吞卡，记下ATM编号联系银行'
            ]
          },
          taxi: {
            title: 'Official Taxi to Hotel',
            titleZh: '官方出租车到酒店',
            description: 'Use BorderBuddy driver page for hotel address',
            descriptionZh: '使用入境通司机页面显示酒店地址',
            steps: [
              'Find Public Taxi counter (Gate 6 or 8)',
              'Show BorderBuddy "Driver Page" to staff',
              'Get queue number ticket',
              'Confirm driver uses meter',
              'Cost: 320-470 THB (meter + 50 airport fee + highway)'
            ],
            stepsZh: [
              '找官方Public Taxi柜台（6号门或8号门附近）',
              '向工作人员出示入境通"给司机看的页面"',
              '拿到排队号码单',
              '确认司机打表（Meter在跳字）',
              '费用：320-470泰铢（打表+50机场费+高速费）'
            ],
            payment: [
              'Prepare small bills (100, 50, 20 THB)',
              'Pay in cash (recommended)',
              'Ask for receipt if needed'
            ],
            paymentZh: [
              '准备小额钞票（100、50、20泰铢）',
              '现金支付（推荐）',
              '需要时索要收据'
            ]
          }
        },
        importantNotes: [
          'TDAC must be submitted within 72 hours before arrival',
          'ATM withdrawal fee ~220 THB, withdraw more to save fees',
          'Only use official Public Taxi, avoid unauthorized drivers',
          'BorderBuddy driver page shows bilingual hotel address'
        ],
        importantNotesZh: [
          '抵达前72小时内必须提交TDAC',
          'ATM取款手续费约220泰铢，一次多取节省费用',
          '只使用官方Public Taxi，避免黑车',
          '入境通司机页面显示泰文+英文酒店地址'
        ],
        entryPackHintOfficial: 'Passport, TDAC QR code, and fund proof ready for immigration officer.',
        entryPackHintPreview: 'Preview entry pack format (full version available after TDAC submission)'
      },
      info: {
        headerTitle: 'Thailand Entry Information',
        title: 'Thailand Entry Guide',
        subtitle: 'Visa-free for 30 days for Chinese passport holders',
        sections: {
          visa: {
            title: '✓ Great News! Visa-Free Policy',
            items: [
              'Chinese passport visa-free for 30 days - spontaneous travel!',
              '• No visa application needed in advance',
              '• Valid for tourism, family visits, business purposes',
              '• New requirement: TDAC Digital Arrival Card must be submitted (can submit up to 72 hours before arrival)',
            ],
          },
          onsite: {
            title: '⚠️ Entry Information',
            items: [
              '• TDAC submission timing: Can submit up to 72 hours before arrival, but must complete before arrival',
              '• QR code required: Must show TDAC QR code upon entry, can\'t find PDF is troublesome',
              '• High accuracy requirement: Any error in passport, flight, accommodation may affect entry',
              '• Immigration checks strict: Documents incomplete or answers unclear may trigger secondary inspection',
              '• Cloudflare verification: May encounter CAPTCHA challenges during submission',
            ],
          },
          appFeatures: {
            title: '✨ BorderBuddy Makes It Easy',
            items: [
              '• Zero anxiety: Auto-tracks itinerary, reminds you at the perfect time',
              '• Zero errors: Smart-fill TDAC, accurate information',
              '• Zero hassle: Enter once, we manage the entire process',
              '• QR code management: Auto-save TDAC QR code PDF, quick display upon entry',
            ],
          },
        },
        continueButton: 'Got it, continue to the checklist',
      },
      requirements: {
        headerTitle: 'Thailand Entry Checklist',
        introTitle: '以下是入境所需准备事项',
        introSubtitle: '这些信息可以先填着，慢慢补全',
        items: {
          validPassport: {
            title: 'Valid passport',
            description: 'Passport valid for at least 6 months with blank visa pages',
            details: 'Thai immigration requires your passport to remain valid for at least 6 months beyond your intended departure date.',
          },
          onwardTicket: {
            title: 'Return or onward ticket',
            description: 'Proof you will leave Thailand within 30 days',
            details: 'Print an e-ticket itinerary so you can show it during inspection.',
          },
          accommodation: {
            title: 'Proof of accommodation',
            description: 'Provide hotel or homestay booking or a local contact address',
            details: 'Use a cancellable hotel booking or a friend\'s address, and ensure the information is accurate.',
          },
          funds: {
            title: 'Sufficient funds',
            description: 'Carry at least 10,000 THB per person or equivalent cash and account proof',
            details: 'Officers may check cash or bank balance proofs. Prepare screenshots or statements and list your cash, cards, and balances in Chinese/English/Thai for quick presentation.',
          },
          healthCheck: {
            title: 'Health declaration',
            description: 'Confirm no fever or acute symptoms and cooperate with screening if needed',
            details: 'No mandatory vaccines currently, but if you feel unwell seek medical help in advance and bring an English diagnosis letter.',
          },
        },
        status: {
          info: {
            title: 'Start anytime',
            subtitle: 'We support progressive completion',
          },
        },
        startButton: 'Start filling',
      },
      travelInfo: {
        headerTitle: 'Thailand Entry Information',
        title: 'Fill in Thailand Entry Information',
        subtitle: 'Please provide the following information to complete the entry card generation',
        privacyNotice: 'All information is saved locally on your device only',
        loading: 'Loading data...',
        submitEntry: 'Prepare Entry Pack',
        viewStatus: 'View Preparation Status',
        readyToSubmit: 'Ready to submit',
        completionProgress: '{{percent}}% complete',
        completionHint: 'Complete all information to submit the entry card.',
        sections: {
          passport: 'Passport Information',
          personal: 'Personal Information',
          travel: 'Travel Information',
          accommodation: 'Accommodation Information',
          emergency: 'Emergency Contact',
        },
        scan: {
          ticketTitle: 'Scan Ticket',
          ticketMessage: 'Please select ticket image source',
          hotelTitle: 'Scan Hotel Booking',
          hotelMessage: 'Please select hotel booking confirmation image source',
          takePhoto: 'Take Photo',
          fromLibrary: 'Choose from Library',
          permissionTitle: 'Permission Required',
          cameraPermissionMessage: 'Camera permission is required to take photos for document scanning',
          libraryPermissionMessage: 'Photo library permission is required to select images',
          successTitle: 'Scan Successful',
          ticketSuccess: 'Flight information extracted and filled into form',
          hotelSuccess: 'Hotel information extracted and filled into form',
          ocrFailTitle: 'Recognition Failed',
          ocrFailMessage: 'Unable to extract information from image, please check image clarity or enter manually',
          retryButton: 'Retry',
          manualButton: 'Enter Manually',
          errorTitle: 'Scan Failed',
          errorMessage: 'An error occurred during scanning, please try again',
          flightChoiceTitle: 'Select Flight',
          flightChoiceMessage: 'Detected flight number {flightNumber}, please select which flight information to update',
          arrivalFlight: 'Arrival Flight',
          departureFlight: 'Departure Flight',
        },
        photo: {
          choose: 'Choose Photo',
          takePhoto: 'Take Photo',
          fromLibrary: 'Choose from Library',
          cancel: 'Cancel',
          cameraPermission: 'Camera Permission Required',
          cameraPermissionMessage: 'Please allow camera access in settings',
          libraryPermission: 'Photo Library Permission Required',
          libraryPermissionMessage: 'Please allow photo library access in settings',
          cameraError: 'Camera Error',
          cameraErrorMessage: 'Camera not supported in simulator, please use a real device or choose from photo library',
          chooseFailed: 'Failed to Choose Photo',
          chooseFailedMessage: 'Please try again',
        },
        lastEdited: 'Recently edited',
        sectionTitles: {
          passport: 'Passport Information',
          passportSubtitle: 'Thailand customs needs to verify your identity',
          personal: 'Personal Information',
          personalSubtitle: 'Let Thailand know more about you',
          funds: 'Proof of Funds',
          fundsSubtitle: 'Show your financial capability',
          travel: 'Travel Information',
          travelSubtitle: 'Your Thailand itinerary',
        },
        sectionIntros: {
          passport: '🛂 Customs officers will verify your passport information. Please ensure it matches your passport exactly. Don\'t worry, we\'ll help you format it!',
          personal: '👤 This information helps Thailand understand your background and contact you if needed.',
          funds: '💰 Show your financial capability to support your Thailand trip.',
          travel: '✈️ Tell Thailand your travel plans so they can prepare a warm welcome for you.',
        },
        fields: {
          fullName: {
            label: 'Full Name',
            help: 'Please enter in Pinyin (e.g., LI, MAO) - Do not enter Chinese characters',
          },
          passportName: {
            label: 'Name on Passport',
            help: 'Fill in English name as shown on passport, e.g.: LI, MAO (surname first, given name last)',
          },
          surname: {
            label: 'Surname',
            help: 'Enter surname as shown on passport (in English)',
          },
          middleName: {
            label: 'Middle Name',
            help: 'If any (optional)',
          },
          givenName: {
            label: 'Given Name',
            help: 'Enter given name as shown on passport (in English)',
          },
          nationality: {
            label: 'Nationality',
            help: 'Please select your nationality',
          },
          passportNo: {
            label: 'Passport Number',
            help: 'Passport number is usually 8-9 alphanumeric characters, will be automatically capitalized',
          },
          visaNumber: {
            label: 'Visa Number (if any)',
            help: 'If you have a visa, please enter visa number (letters or numbers only)',
          },
          dob: {
            label: 'Date of Birth',
            help: 'Format: YYYY-MM-DD',
          },
          expiryDate: {
            label: 'Passport Expiry Date',
            help: 'Format: YYYY-MM-DD',
          },
          sex: {
            label: 'Gender',
            options: {
              female: 'Female',
              male: 'Male',
              undefined: 'Undefined',
            },
          },
          occupation: {
            label: 'Occupation',
            help: 'Please enter your occupation (in English)',
          },
          cityOfResidence: {
            label: 'City of Residence',
            help: 'Please enter your city of residence (in English)',
          },
          residentCountry: {
            label: 'Country of Residence',
            help: 'Please select your country of residence',
          },
          phoneCode: {
            label: 'Country Code',
          },
          phoneNumber: {
            label: 'Phone Number',
            help: 'Please enter your phone number',
          },
          email: {
            label: 'Email',
            help: 'Please enter your email address',
          },
          arrivalDate: {
            label: 'Arrival Date',
            help: 'Format: YYYY-MM-DD',
          },
          flightNumber: {
            label: 'Flight Number',
            help: 'Please enter your flight number',
          },
          departureCity: {
            label: 'Departure City',
            help: 'Please enter your departure city (in English)',
          },
          purposeOfVisit: {
            label: 'Purpose of Visit',
            help: 'Please select your purpose of visit',
            options: {
              tourism: 'Tourism',
              business: 'Business',
              family: 'Family Visit',
              medical: 'Medical Treatment',
              other: 'Other',
            },
          },
          hotelName: {
            label: 'Hotel Name',
            help: 'Please enter your hotel name (in English)',
          },
          hotelAddress: {
            label: 'Hotel Address',
            help: 'Please enter your hotel address (in English)',
          },
          hotelPhone: {
            label: 'Hotel Phone',
            help: 'Please enter your hotel phone number',
          },
          emergencyName: {
            label: 'Emergency Contact Name',
            help: 'Please enter emergency contact name (in English)',
          },
          emergencyPhone: {
            label: 'Emergency Contact Phone',
            help: 'Please enter emergency contact phone number',
          },
          emergencyRelationship: {
            label: 'Relationship',
            help: 'Please enter relationship (in English)',
          },
        },
        photo: {
          choose: 'Choose Photo',
          takePhoto: 'Take Photo',
          fromLibrary: 'Choose from Library',
          cancel: 'Cancel',
          cameraPermission: 'Camera Permission Required',
          cameraPermissionMessage: 'Please allow camera access in settings',
          cameraError: 'Camera Error',
          cameraErrorMessage: 'Camera not supported in simulator, please use a real device or choose from library',
          libraryPermission: 'Photo Library Permission Required',
          libraryPermissionMessage: 'Please allow photo library access in settings',
          chooseFailed: 'Failed to Choose Photo',
          chooseFailedMessage: 'Please try again',
        },
        continueButton: 'Continue',
      },
      tdacWebView: {
        errorBoundary: {
          title: 'Something went wrong',
          message: 'An unexpected error occurred. Please try again.',
          tryAgain: 'Try Again',
          close: 'Close',
        },
        qrCodeHandler: {
          permissionTitle: 'Photo Album Permission Required',
          permissionMessage: 'Please allow access to photo album in settings',
          savingQR: 'Saving QR code...',
          savedToApp: 'QR code saved to App',
          savedToAlbum: 'QR code saved to photo album',
          tempFileCleanedSuccess: 'Temporary file cleaned up',
          tempFileCleanedError: 'Temporary file cleanup (error path)',
          tempFileCleanupFailed: 'Temporary file cleanup failed',
          saveAlbumFailed: 'Failed to save to photo album',
          entryInfoUpdated: 'Entry info updated successfully via WebView',
          entryInfoUpdateFailed: 'Failed to update entry info',
          recentSubmissionFlagSet: 'Recent submission flag set for EntryPackService',
          qrSavedSuccess: {
            title: '🎉 QR Code Saved!',
            message: 'QR code has been saved to:\n1. App (view in "My Trips")\n2. Phone Gallery\n\nShow to immigration upon entry!',
            viewQR: 'View QR Code',
            ok: 'OK',
          },
          saveFailed: {
            title: 'Save Failed',
            message: 'Unable to save QR code, please take a screenshot',
          },
        },
        helperModal: {
          title: 'Copy Helper',
          close: '✕ Close',
          instruction: 'Click ⚡ to try auto-fill, or click "Copy" to paste manually if it fails',
          sections: {
            personal: 'Personal Information',
            trip: 'Trip & Accommodation',
            accommodation: 'Accommodation',
          },
          healthDeclaration: {
            title: 'Step 4: Health Declaration',
            note: 'For health declaration section, please select Yes or No on the webpage according to your actual situation',
          },
          tips: {
            title: '💡 Remember After Completion:',
            items: '• You will receive a confirmation email after submission\n• The email contains a QR code\n• Save a screenshot of the QR code\n• Show the QR code and passport upon entry',
          },
        },
        qrCodeModal: {
          title: '🎫 TDAC Entry Card',
          close: '✕',
          hint: 'Show this QR code to immigration for quick entry',
          subHint: 'Show this QR code to immigration',
          nameLabel: 'Name:',
          passportLabel: 'Passport:',
          savedTimeLabel: 'Saved:',
          saveAgain: '📷 Save to Album Again',
        },
        dataComparisonModal: {
          title: '🔍 Data Comparison',
          subtitle: 'Entry Info vs TDAC Submission',
          close: '✕ Close',
          summary: {
            title: '📊 Summary',
            totalFields: 'Total Fields:',
            validMappings: 'Valid Mappings:',
            overallStatus: 'Overall Status:',
            valid: '✅ VALID',
            issues: '❌ ISSUES',
          },
          fieldMappings: {
            title: '🔄 Field Mappings',
            source: 'Source:',
            original: 'Original:',
            tdac: 'TDAC:',
            transform: 'Transform:',
            statusMapped: '✅',
            statusTransformed: '🔄',
            statusError: '❌',
          },
          payload: {
            title: '📋 Complete TDAC Payload',
          },
          actions: {
            refresh: '🔄 Refresh Comparison',
            export: '📋 Export Data',
            exported: '✅ Exported',
            exportedMessage: 'Comparison data copied to clipboard',
          },
        },
      },
      // TDACSelectionScreen translations
      selection: {
        heroEmoji: '🌟',
        heroTitle: 'Choose Submission Method',
        heroSubtitle: 'Complete Thailand Arrival Card Quickly',
        backButton: 'Back',
        lightning: {
          badge: 'Recommended',
          badgeIcon: '📱',
          icon: '⚡',
          title: 'Lightning Submit',
          subtitle: 'Fast Track · Smart Validation',
          benefits: {
            time: { icon: '⏱️', value: '5-8 sec', label: 'Lightning Fast' },
            success: { icon: '🎯', value: '95%+', label: 'High Success Rate' },
            speed: { icon: '🚀', value: '3x Faster', label: 'Than Traditional' }
          },
          summary: 'Save queue time, get confirmation immediately after submission.',
          cta: 'Use Lightning Submit'
        },
        stable: {
          icon: '🛡️',
          title: 'Stable Submit',
          subtitle: 'Stable Channel · Clearly Visible',
          benefits: {
            time: { icon: '⏱️', value: '24 sec', label: 'Stable Completion' },
            success: { icon: '🎯', value: '85%', label: 'Reliable Success Rate' }
          },
          summary: 'Suitable for travelers who want to see every step.',
          cta: 'Choose Stable Option'
        },
        smartTip: {
          icon: '💡',
          title: 'Smart Recommendation',
          text: 'Lightning Submit recommended; you can switch to stable option anytime if you need the full process.'
        },
        footer: {
          text: 'We will accompany you through the entire process to ensure smooth submission.'
        }
      },

      // ThailandEntryQuestionsScreen translations
      entryQuestions: {
        topBarTitle: 'Entry Questions',
        header: {
          title: 'ชุดคำถาม-คำตอบสำหรับเจ้าหน้าที่',
          subtitle: 'Immigration Questions & Answers',
          subtitleZh: 'Common Entry Questions and Answers',
          description: '📋 Pre-filled answers to common entry questions based on your travel information, ready to show immigration officers'
        },
        languageSelector: { label: 'Language:', zh: 'Chinese', en: 'English', th: 'Thai' },
        filter: { showRequired: 'Show Required Questions Only', showAll: 'Show All Questions', count: '({{count}} questions)' },
        question: { required: 'Required', answerLabel: 'Answer:', tipsLabel: '💡 Tips:', suggestedLabel: 'Other Optional Answers:' },
        footer: {
          icon: 'ℹ️',
          infoText: 'These answers are automatically generated based on your submitted entry information. If immigration officers ask other questions, please answer truthfully.',
          instructionsTitle: 'Usage Instructions:',
          instruction1: '1. Show this page to immigration officer as reference',
          instruction2: '2. Switch languages for easier communication',
          instruction3: '3. Required questions are marked with badges'
        },
        empty: { icon: '📭', text: 'No questions to display', hint: 'Please ensure your entry information is completely filled' },
        loading: 'Loading entry questions...',
        errors: { missingEntryPack: 'Missing entry pack information', loadFailed: 'Failed to load entry questions, please try again later' }
      },

      // Enhanced travelInfo translations
      travelInfoEnhanced: {
        sectionIntros: {
          passport: { icon: '🛂', text: 'Customs officers will verify your passport information. Please ensure it matches your passport exactly. Don\'t worry, we\'ll help you format it!' },
          personal: { icon: '👤', text: 'This information helps Thailand understand your background and contact you if needed.' },
          funds: { icon: '💰', text: 'Show your financial capability to support your Thailand trip.' },
          travel: { icon: '✈️', text: 'Tell Thailand your travel plans so they can prepare a warm welcome for you.' }
        },
        saveStatus: { pending: 'Waiting to save...', saving: 'Saving...', saved: 'Saved', error: 'Save failed', retry: 'Retry' },
        lastEdited: 'Last edited: {{time}}',
        progress: {
          ready: 'Ready for Thailand! 🌴',
          completion: '{{percent}}% complete',
          hints: {
            start: '🌟 First step, start by introducing yourself!',
            early: 'Great start! Thailand welcomes you 🌺',
            mid: 'Continue my Thailand preparation journey 🏖️',
            late: '🚀 Almost done, your Thailand trip is just around the corner!'
          },
          nextSteps: {
            passport: '💡 Start with passport information, tell Thailand who you are',
            personal: '👤 Fill in personal information, let Thailand know you better',
            funds: '💰 Show your proof of funds, Thailand wants to ensure you have a great time',
            travel: '✈️ Last step, share your travel plans!'
          }
        }
      },

      // Constants translations
      occupations: {
        SOFTWARE_ENGINEER: 'Software Engineer', STUDENT: 'Student', TEACHER: 'Teacher', DOCTOR: 'Doctor',
        ACCOUNTANT: 'Accountant', SALES_MANAGER: 'Sales Manager', RETIRED: 'Retired', ENGINEER: 'Engineer',
        CIVIL_SERVANT: 'Civil Servant', LAWYER: 'Lawyer', NURSE: 'Nurse', FREELANCER: 'Freelancer',
        BUSINESS_OWNER: 'Business Owner', HOMEMAKER: 'Homemaker', DESIGNER: 'Designer', OTHER: 'Other'
      },
      travelPurposes: {
        HOLIDAY: 'Holiday/Tourism', MEETING: 'Meeting', SPORTS: 'Sports', BUSINESS: 'Business',
        INCENTIVE: 'Incentive', CONVENTION: 'Convention/Conference', EDUCATION: 'Education',
        EMPLOYMENT: 'Employment', EXHIBITION: 'Exhibition', MEDICAL: 'Medical Treatment'
      },
      accommodationTypes: {
        HOTEL: 'Hotel', HOSTEL: 'Hostel', GUESTHOUSE: 'Guesthouse',
        RESORT: 'Resort', APARTMENT: 'Apartment', FRIEND: 'Friend\'s House'
      },
      // Form validation error messages
      validation: {
        // Required field errors
        required: {
          passportNo: 'Passport number is required',
          surname: 'Surname is required',
          givenName: 'Given name is required',
          nationality: 'Nationality is required',
          dob: 'Date of birth is required',
          expiryDate: 'Passport expiry date is required',
          sex: 'Gender/sex is required',
          occupation: 'Occupation is required',
          cityOfResidence: 'City of residence is required',
          residentCountry: 'Resident country is required',
          phoneNumber: 'Phone number is required',
          email: 'Email address is required',
          travelPurpose: 'Travel purpose is required',
          arrivalDate: 'Arrival date is required',
          departureDate: 'Departure date is required',
          arrivalFlightNumber: 'Arrival flight number is required',
          departureFlightNumber: 'Departure flight number is required',
          accommodationType: 'Accommodation type is required',
          province: 'Province is required',
          district: 'District is required',
          subDistrict: 'Sub-district is required',
          postalCode: 'Postal code is required',
          hotelAddress: 'Hotel/accommodation address is required',
          recentStayCountry: 'Recent stay country is required',
          boardingCountry: 'Boarding country is required',
        },

        // Format validation errors
        format: {
          passportNo: 'Passport number format is invalid (typically 8-9 alphanumeric characters)',
          email: 'Email address format is invalid (e.g., example@email.com)',
          phoneNumber: 'Phone number format is invalid (8-15 digits)',
          phoneCode: 'Phone code format is invalid (e.g., +86, +1)',
          postalCode: 'Postal code format is invalid',
          flightNumber: 'Flight number format is invalid (e.g., TG123, CZ456)',
          uppercaseRequired: 'Must be in UPPERCASE letters',
          alphanumericOnly: 'Only letters and numbers are allowed',
          numbersOnly: 'Only numbers are allowed',
        },

        // Length validation errors
        length: {
          passportNoTooShort: 'Passport number is too short (minimum {{min}} characters)',
          passportNoTooLong: 'Passport number is too long (maximum {{max}} characters)',
          phoneNumberTooShort: 'Phone number is too short (minimum {{min}} digits)',
          phoneNumberTooLong: 'Phone number is too long (maximum {{max}} digits)',
          nameTooShort: 'Name is too short (minimum {{min}} characters)',
          nameTooLong: 'Name is too long (maximum {{max}} characters)',
          textTooLong: 'Text exceeds maximum length of {{max}} characters',
        },

        // Date validation errors
        date: {
          invalid: 'Invalid date format',
          pastRequired: 'Date must be in the past',
          futureRequired: 'Date must be in the future',
          passportExpired: 'Passport has already expired',
          passportExpiringSoon: 'Passport expires within 6 months - may be rejected by immigration',
          dobTooRecent: 'Date of birth is too recent (must be at least {{minAge}} years old)',
          dobTooOld: 'Date of birth seems unrealistic (please check)',
          arrivalBeforeDeparture: 'Arrival date must be before departure date',
          departureBeforeArrival: 'Departure date must be after arrival date',
          arrivalTooFar: 'Arrival date is too far in the future ({{maxDays}} days maximum)',
          arrivalTooSoon: 'Arrival date is too soon (minimum {{minHours}} hours from now)',
          stayTooLong: 'Stay duration exceeds visa-free limit ({{maxDays}} days)',
        },

        // Specific field warnings (non-critical)
        warning: {
          nameNotUppercase: 'Name should be in UPPERCASE as shown on passport',
          nameMismatch: 'Name format may not match passport - please verify',
          passportExpiringWithin6Months: 'Passport expires in {{months}} months - some countries require 6+ months validity',
          emailUncommon: 'Email format is uncommon - please verify',
          phoneNumberShort: 'Phone number seems short - please verify',
          occupationOther: 'You selected "Other" - please enter your occupation in the custom field',
          cityNotRecognized: 'City not recognized - please verify spelling',
          missingFlightPhoto: 'Flight ticket photo not uploaded - recommended for faster processing',
          missingHotelPhoto: 'Hotel reservation photo not uploaded - recommended for verification',
          transitPassenger: 'You marked as transit passenger - accommodation details may not be required',
        },

        // Photo upload errors
        photo: {
          uploadFailed: 'Failed to upload photo - please try again',
          invalidFormat: 'Invalid photo format - please use JPG, PNG, or PDF',
          fileTooLarge: 'Photo file is too large (maximum {{maxSize}}MB)',
          permissionDenied: 'Camera/photo library permission denied - please enable in settings',
          cameraNotAvailable: 'Camera not available on this device',
          processingFailed: 'Failed to process photo - please try another photo',
        },

        // Location cascade errors
        location: {
          provinceRequired: 'Please select a province first',
          districtRequired: 'Please select a district',
          subDistrictRequired: 'Please select a sub-district',
          invalidProvince: 'Selected province is invalid',
          invalidDistrict: 'Selected district is invalid for this province',
          invalidSubDistrict: 'Selected sub-district is invalid for this district',
          loadingFailed: 'Failed to load location data - please try again',
        },

        // Network/Save errors
        save: {
          failed: 'Failed to save data - please check your connection',
          retrying: 'Retrying save... ({{attempt}}/{{max}})',
          offline: 'You are offline - data will be saved when connection is restored',
          conflict: 'Data conflict detected - please refresh and try again',
          timeout: 'Save timeout - please check your internet connection',
        },

        // TDAC submission errors
        submission: {
          missingRequiredFields: 'Please complete all required fields before submitting',
          invalidData: 'Some data is invalid - please check highlighted fields',
          networkError: 'Network error - please check your connection and try again',
          serverError: 'Server error - please try again later',
          cloudflareTimeout: 'Cloudflare verification timeout - please try again',
          submissionWindowClosed: 'Submission window has closed - please contact support',
          submissionWindowNotOpen: 'Submission window not yet open - please wait until {{openTime}}',
          duplicateSubmission: 'This entry has already been submitted',
          rateLimitExceeded: 'Too many attempts - please wait {{minutes}} minutes',
        },
      },
    },
    sg: {
      navigation: {
        submitButton: {
          default: '保存并继续',
          incomplete: '请先补全必填信息',
          almostDone: '已接近完成，请再检查一遍',
          ready: '准备就绪，可提交 SG Arrival 信息',
        },
      },
      travelInfo: sgTravelInfoZh,
      result: {
        digitalBadge: '抵达前3天提交',
        digitalTitle: '新加坡 SG Arrival Card',
        digitalHighlight: '利用通关包快速完成SG Arrival Card，请保留确认邮件或短信以备入境查验。',
        digitalButton: '启动SG Arrival助手',
      },
    },
    japan: {
      info: {
        headerTitle: 'Japan Entry Information',
        title: 'Japan Entry Guide',
        subtitle: 'Visa-free for 90 days for Chinese passport holders',
        sections: {
          visa: {
            title: '✓ Great News! Visa-Free Policy',
            items: [
              'Chinese passport holders can visit Japan visa-free for 90 days - spontaneous travel!',
              '• No visa application needed in advance',
              '• Valid for tourism, business, and visiting friends/relatives',
              '• Entry card and customs declaration must be completed upon arrival',
            ],
          },
          important: {
            title: '⚠️ Entry Requirements',
            items: [
              '• Forms must be completed in black or blue ink.',
              '• Handwriting must be clear and legible.',
              '• Answer all customs form questions truthfully.',
              '• Keep your entry card stub until departure.',
              '• Biometric scanning (fingerprint/facial) is required.',
            ],
          },
          appFeatures: {
            title: '✨ BorderBuddy Makes It Easy',
            items: [
              '• Zero anxiety: Automatic reminders for form filling and biometric steps.',
              '• Zero errors: Copy mode ensures accurate data transfer to paper forms.',
              '• Zero hassle: Detailed step-by-step guide covers the entire process.',
              '• Document checklist: Complete preparation list for immigration/customs.',
            ],
          },
        },
        continueButton: 'Got it, continue preparation',
      },
      requirements: {
        headerTitle: 'Japan Entry Checklist',
        introTitle: 'Entry Preparation Checklist',
        introSubtitle: 'Fill in what you have and complete gradually',
        items: {
          validVisa: {
            title: 'Valid Visa',
            description: 'Approved Japan tourist visa',
            details: 'Chinese citizens need to apply for a visa in advance. Confirm your visa is valid and has sufficient entries.',
          },
          validPassport: {
            title: 'Valid Passport',
            description: 'Passport valid for at least 6 months',
            details: 'Passport must be valid for at least 6 months beyond your planned departure date',
          },
          returnTicket: {
            title: 'Return Ticket',
            description: 'Confirmed return or onward journey ticket',
            details: 'Must have a clear departure plan showing you will leave Japan within 90 days',
          },
          sufficientFunds: {
            title: 'Sufficient Funds',
            description: 'Proof of funds for entire stay',
            details: 'Recommended to carry at least 100,000 yen or equivalent, or show credit cards/bank statements',
          },
          accommodation: {
            title: 'Accommodation Proof',
            description: 'Hotel booking or host contact information in Japan',
            details: 'Provide hotel reservation confirmation or detailed contact information of friends/relatives in Japan',
          },
        },
        status: {
          success: {
            title: 'Great! You can proceed.',
            subtitle: 'Next we will confirm your travel information.',
          },
          warning: {
            title: 'Check each checklist item',
            subtitle: 'Complete the prerequisites before continuing.',
          },
          info: {
            title: 'Start anytime',
            subtitle: 'We support progressive completion',
          },
        },
        startButton: 'Start Filling',
      },
      procedures: {
        headerTitle: 'Japan Entry Procedures',
        title: 'Japan Entry Guide',
        subtitle: 'Visa-free for 90 days for Chinese passport holders',
        helpSection: {
          title: '✨ BorderBuddy Makes It Easy',
          description: 'We help you prepare all required documents and guide you through each step of the Japan entry process.',
          subdescription: 'From filling out forms to biometric scanning, we\'ll be with you every step of the way.',
        },
        entrySteps: {
          title: 'Entry Process Steps',
          steps: [
            {
              title: 'Get Forms',
              description: 'Find entry card and customs declaration in arrival hall',
              details: 'Locate the "Entry Card" and "Customs Declaration" counters or automated dispensers in the arrival area.',
            },
            {
              title: 'Fill Entry Card',
              description: 'Complete the black entry card with black or blue pen',
              details: 'Carefully copy your information from your phone to the form. Use the copy mode for easy reference.',
            },
            {
              title: 'Fill Customs Declaration',
              description: 'Complete the yellow customs declaration form',
              details: 'Declare items honestly. Answer questions about prohibited items and commercial goods truthfully.',
            },
            {
              title: 'Immigration Check',
              description: 'Present passport and completed forms to immigration officer',
              details: 'Join the "Foreigner" lane. Hand your passport and entry card to the officer and answer simple questions.',
            },
            {
              title: 'Biometric Check',
              description: 'Complete fingerprint and facial recognition',
              details: 'Follow the officer\'s instructions for the biometric scanning process.',
            },
            {
              title: 'Customs Inspection',
              description: 'Collect luggage and proceed to customs inspection',
              details: 'Present your customs declaration. Use the green channel if nothing to declare, red channel for inspection if needed.',
            },
            {
              title: 'Entry Complete',
              description: 'Welcome to Japan!',
              details: 'Your entry pack is available anytime if you need to reference your information.',
            },
          ],
        },
        features: {
          title: 'App Features',
          items: [
            {
              icon: '📋',
              title: 'Form Assistant',
              description: 'Step-by-step guidance for all required forms',
            },
            {
              icon: '📱',
              title: 'Copy Mode',
              description: 'Large font display for easy form copying',
            },
            {
              icon: '🛂',
              title: 'Process Guide',
              description: 'Detailed walkthrough of each entry step',
            },
            {
              icon: '❓',
              title: 'Q&A Support',
              description: 'Common questions and helpful answers',
            },
          ],
        },
        importantNotes: {
          title: 'Important Notes',
          items: [
            '• Forms must be completed in black or blue ink',
            '• Handwriting should be clear and legible',
            '• Answer all questions truthfully on customs forms',
            '• Keep your entry card stub until departure',
            '• Biometric scanning is required for all visitors',
            '• Have your return ticket and accommodation details ready',
          ],
        },
        startButton: 'Start Preparation',
      },
      travelInfo: {
        headerTitle: 'Japan Entry Information',
        title: 'Fill in Japan Entry Information',
        subtitle: 'Please provide the following information to prepare for entry',
        privacyNote: '💾 All information is saved locally on your device only',
        loading: 'Loading...',
        sections: {
          passport: 'Passport Information',
          personal: 'Personal Information',
          funds: 'Funding Proof',
          travel: 'Travel Information',
        },
        fields: {
          passportName: 'Passport Name (English)',
          passportNamePlaceholder: 'Enter name as shown on passport',
          nationality: 'Nationality',
          nationalityPlaceholder: 'Select nationality',
          passportNumber: 'Passport Number',
          passportNumberPlaceholder: 'Enter passport number',
          passportNumberHelp: '6-12 alphanumeric characters',
          dateOfBirth: 'Date of Birth',
          dateOfBirthHelp: 'Select your date of birth',
          expiryDate: 'Passport Expiry Date',
          expiryDateHelp: 'Select passport expiration date',
          occupation: 'Occupation',
          occupationPlaceholder: 'Enter your occupation',
          cityOfResidence: 'City of Residence',
          cityOfResidencePlaceholder: 'Enter your city of residence',
          residentCountry: 'Country of Residence',
          residentCountryPlaceholder: 'Select country of residence',
          phoneCode: 'Country Code',
          phoneCodePlaceholder: '+86',
          phoneNumber: 'Phone Number',
          phoneNumberPlaceholder: 'Enter phone number',
          email: 'Email Address',
          emailPlaceholder: 'Enter email address',
          gender: 'Gender',
          genderMale: 'Male',
          genderFemale: 'Female',
          genderUndefined: 'Unspecified',
          travelPurpose: 'Purpose of Travel',
          travelPurposeTourism: 'Tourism',
          travelPurposeBusiness: 'Business',
          travelPurposeVisiting: 'Visiting Relatives',
          travelPurposeTransit: 'Transit',
          travelPurposeOther: 'Other',
          customTravelPurpose: 'Specify Purpose',
          customTravelPurposePlaceholder: 'Please specify your travel purpose',
          arrivalFlightNumber: 'Arrival Flight Number',
          arrivalFlightNumberPlaceholder: 'e.g., NH123',
          arrivalDate: 'Arrival Date',
          arrivalDateHelp: 'Select your arrival date',
          accommodationType: 'Accommodation Type',
          accommodationTypeHotel: 'Hotel',
          accommodationTypeRyokan: 'Ryokan',
          accommodationTypeFriend: "Friend's House",
          accommodationTypeAirbnb: 'Airbnb',
          accommodationTypeOther: 'Other',
          customAccommodationType: 'Specify Accommodation Type',
          customAccommodationTypePlaceholder: 'Please specify accommodation type',
          accommodationName: 'Accommodation Name',
          accommodationNamePlaceholder: 'Enter hotel/accommodation name',
          accommodationAddress: 'Accommodation Address',
          accommodationAddressPlaceholder: 'Enter full address in Japan',
          accommodationAddressHelp: 'e.g., 1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0002',
          accommodationPhone: 'Accommodation Phone',
          accommodationPhonePlaceholder: 'Enter accommodation phone number',
          lengthOfStay: 'Length of Stay (days)',
          lengthOfStayPlaceholder: 'Enter number of days',
        },
        placeholders: {
          fundsSection: 'Fund information fields will be implemented in a future task',
          travelSection: 'Travel information fields will be implemented in a future task',
        },
        funds: {
          emptyMessage: 'No fund items added yet. Add at least one fund item to show proof of funds.',
          addButton: 'Add Fund Item',
        },
        continueButton: 'View Entry Guide',
        errors: {
          loadingFailed: 'Error Loading Data',
          loadingFailedMessage: 'Failed to load existing data. You can still enter new information.',
          saveFailed: 'Failed to save data. Please try again.',
          completeAllFields: 'Please complete all required fields',
          invalidPassportNumber: 'Passport number must be 6-12 letters and numbers',
          invalidDateFormat: 'Invalid date format',
          invalidDate: 'Invalid date',
          expiryDateFuture: 'Passport expiry date must be in the future',
          dobPast: 'Date of birth must be in the past',
          invalidName: 'Name should contain only letters, spaces, hyphens, apostrophes, and periods',
          nameTooShort: 'Name must be at least 2 characters',
          selectNationality: 'Please select a nationality',
          invalidEmail: 'Invalid email format',
          invalidPhone: 'Invalid phone number format',
          occupationTooShort: 'Occupation must be at least 2 characters',
          invalidFlightNumber: 'Invalid flight number format (e.g., NH123)',
          arrivalDateFuture: 'Arrival date must be in the future',
          invalidAccommodationPhone: 'Invalid accommodation phone number format',
          invalidLengthOfStay: 'Length of stay must be a positive number',
          lengthOfStayTooLong: 'Length of stay cannot exceed 180 days',
        },
      },
    },
    result: {
      title: '{{flag}} {{country}} Entry Pack Ready',
      subtitle: 'All documents are ready to present at the airport',
      entryPack: {
        title: 'Entry Pack',
        subtitle: '{{subtitle}}',
        share: 'Share',
        fields: {
          traveler: 'Name',
          passportNo: 'Passport',
          flightNo: 'Flight',
          departureDate: 'Departure',
          arrivalDate: 'Arrival',
          accommodation: 'Hotel',
        },
        notFilled: 'Not filled',
        toBeConfirmed: 'To be confirmed',
        actions: {
          startGuide: 'Start Arrival Guide',
          editInfo: 'Edit Information',
        },
        lastUpdated: 'Last updated: {{time}}',
        subtitleParts: {
          departure: 'Departure {{date}}',
          arrival: 'Arrival {{date}}',
          flight: 'Flight {{flight}}',
          missing: 'Please complete travel details',
        },
        official: {
          title: '✅ Official Entry Pack',
          message: 'This entry pack contains the real TDAC QR code and PDF document. You can show this directly to Thai immigration officers.',
        },
      },
      historyBanner: {
        badge: 'Pending Trip',
        status: 'Auto-saved',
        description: 'Information saved in entry pack. Can be edited or shared anytime.',
        primaryCta: {
          title: 'Start Entry Guide',
          subtitle: 'Step-by-step · Large font available',
        },
        secondaryCta: {
          shareFamily: 'Share',
          editInfo: 'Edit',
        },
        footer: {
          title: '🛃 Final step: Present to customs',
          note: 'Copy mode is just one step in the process. Follow the guide after landing.',
        },
      },
      digitalInfo: {
        title: 'Online {{systemName}} required',
        button: 'Apply now',
        autoFill: '⚡ Auto-fill',
      },
      checkSection: {
        title: 'Need to check information?',
        viewForm: {
          title: 'View complete form',
          subtitle: '{{count}} items filled',
        },
        qaGuide: {
          title: 'Customs Q&A guide',
          subtitle: '{{count}} common questions',
        },
      },
      footer: 'Done! Return home',
      infoBox: 'Automatically saved to "History", view anytime',
      errors: {
        pdfFailed: 'Failed to generate PDF',
        downloadFailed: 'Download failed',
        shareFailed: 'Share failed',
        shareUnavailable: 'Sharing is not supported on this device',
        printFailed: 'Print failed',
      },
    },
    profile: {
      header: 'Profile',
      user: {
        phone: 'Phone: {{phone}}',
      },
      common: {
        notFilled: 'Not filled',
      },
      personal: {
        title: 'Personal Information',
        subtitle: 'Update border details',
        collapsedHint: 'Tap to expand personal information',
        fields: {
          dateOfBirth: {
            title: 'Date of Birth',
            subtitle: 'Date of Birth',
            placeholder: 'YYYY-MM-DD',
          },
          gender: {
            title: 'Gender',
            subtitle: 'Gender',
            placeholder: 'MALE / FEMALE',
          },
          occupation: {
            title: 'Occupation',
            subtitle: 'Occupation',
            placeholder: 'Occupation',
          },
          provinceCity: {
            title: 'City / Province',
            subtitle: 'Province / City of Residence',
            placeholder: 'Province / City',
          },
          countryRegion: {
            title: 'Country / Region',
            subtitle: 'Country / Region',
            placeholder: 'Country / Region',
          },
          phone: {
            title: 'Phone Number',
            subtitle: 'Phone',
            placeholder: '+86 1234567890',
          },
          email: {
            title: 'Email Address',
            subtitle: 'Email',
            placeholder: 'your@email.com',
          },
        },
      },
      funding: {
        title: 'Funding Proof Checklist',
        subtitle: 'Show quickly at immigration',
        collapsedHint: 'Tap to expand funding checklist',
        addButton: 'Add Fund Item',
        selectType: 'Select Fund Item Type',
        selectTypeMessage: 'Choose the type of fund item to add',
        empty: 'No fund items yet. Tap below to add your first item.',
        footerNote: 'Information syncs to your entry pack for immigration checks.',
        actions: {
          scanProof: 'Scan / Upload Funding Proof',
        },
        fields: {
          cashAmount: {
            title: 'Cash on hand',
            placeholder: 'e.g. 10,000 THB cash + 500 USD',
            sample: '10,000 THB equivalent cash (about ¥2,000)',
          },
          bankCards: {
            title: 'Bank cards & balances',
            placeholder: 'e.g.\nCMB Visa (****1234) · Balance 20,000 CNY',
            sample:
              'CMB Visa (****1234) · Balance 20,000 CNY\nICBC Debit (****8899) · Balance 15,000 CNY',
          },
          supportingDocs: {
            title: 'Supporting documents',
            placeholder: 'e.g. bank balance screenshots, transaction PDFs, statements',
            sample: 'Bank app screenshots and recent transaction PDFs saved',
          },
        },
      },
      fundItem: {
        create: {
          title: 'Add Fund Item',
          success: 'Fund item added successfully',
        },
        detail: {
          title: 'Fund Item Details',
          editTitle: 'Edit Fund Item',
          edit: 'Edit',
          delete: 'Delete',
          save: 'Save Changes',
          cancel: 'Cancel',
          manageAll: 'Manage All Funds',
          addPhoto: 'Add Photo',
          replacePhoto: 'Replace Photo',
          viewPhoto: 'Tap to view full size',
          noPhoto: 'No photo attached',
          photo: 'Photo',
          photoOptions: 'Choose an option',
          takePhoto: 'Take Photo',
          chooseFromLibrary: 'Choose from Library',
          photoHint: 'Pinch to zoom, drag to pan',
        },
        fields: {
          amount: 'Amount',
          currency: 'Currency',
          description: 'Description',
          descriptionPlaceholder: 'Add a description (optional)',
          type: 'Type',
          selectCurrency: 'Select Currency',
        },
        types: {
          CASH: 'Cash',
          BANK_CARD: 'Bank Card',
          DOCUMENT: 'Supporting Document',
        },
        deleteConfirm: {
          title: 'Delete Fund Item',
          message: 'Are you sure you want to delete this fund item?',
          confirm: 'Delete',
          cancel: 'Cancel',
        },
        validation: {
          amountRequired: 'Amount is required',
          amountInvalid: 'Amount must be a valid number',
          amountPositive: 'Amount must be greater than 0',
          currencyRequired: 'Currency is required',
          currencyFormat: 'Currency must be a 3-letter code',
        },
        errors: {
          loadFailed: 'Failed to load fund item details',
          updateFailed: 'Failed to save changes. Please try again.',
          deleteFailed: 'Failed to delete fund item. Please try again.',
          photoFailed: 'Failed to update photo. Please try again.',
          permissionTitle: 'Permission Required',
          permissionMessage: 'Please grant permission to access your photo library.',
          cameraPermissionMessage: 'Please grant permission to access your camera.',
        },
        success: {
          photoUpdated: 'Success',
          photoUpdatedMessage: 'Photo has been updated successfully.',
        },
        accessibility: {
          amountHint: 'Enter the amount of money for this fund item',
          currencyHint: 'Opens currency picker to select a currency',
          descriptionHint: 'Enter an optional description for this fund item',
          photoPreview: 'Fund item photo preview',
          photoPreviewHint: 'Double tap to view full size photo',
          addPhotoHint: 'Opens options to take a photo or choose from library',
          replacePhotoHint: 'Opens options to take a new photo or choose from library',
          saveHint: 'Saves your changes and returns to view mode',
          cancelHint: 'Discards your changes and returns to view mode',
          editHint: 'Opens edit mode to modify fund item details',
          deleteHint: 'Deletes this fund item after confirmation',
          manageAllHint: 'Navigates to the full fund management screen',
          closeModalHint: 'Closes the fund item detail modal',
          backHint: 'Returns to the previous screen',
          closeCurrencyPickerHint: 'Closes the currency picker',
          selectCurrencyHint: 'Selects this currency',
        },
      },
      passport: {
        title: 'My Passport',
        subtitle: '{{passportNo}} · Valid until {{expiry}}',
        collapsedHint: 'Tap to expand passport details',
        updateButton: 'Update passport info',
        fields: {
          passportNo: 'Passport Number',
          nationality: 'Nationality',
          expiry: 'Expiry Date',
          issueDate: 'Issue Date',
          issuePlace: 'Issue Place',
        },
      },
      vip: {
        title: 'Upgrade to Premium',
        subtitle: 'Unlimited generations, priority processing',
        upgradeButton: 'Upgrade now',
      },
      sections: {
        myServices: 'My Services',
        settings: 'Settings & Help',
      },
      menu: {
        documents: { title: 'My Documents', badge: '({{count}})' },
        history: { title: 'Generation History', badge: '({{count}})' },
        backup: {
          title: 'Cloud Backup',
          subtitle: 'Recent: {{time}}',
          defaultTime: 'Today',
        },
        language: {
          title: 'Language',
          subtitle: 'Current: {{language}}',
        },
        settings: { title: 'Settings' },
        help: { title: 'Help Center' },
        about: { title: 'About Us' },
        notifications: { title: 'Notification Settings' },
        notificationLogs: { title: 'Notification Logs', subtitle: 'View notification history and analytics' },
      },
      editModal: {
        save: 'Save',
      },
      logout: 'Log out',
      version: 'Version {{version}}',
    },
    generating: {
      title: 'Processing',
      message: 'AI is generating your entry pack',
      estimate: 'Estimated {{seconds}} seconds remaining...',
      stepsTitle: 'What we\'re doing:',
      steps: {
        verifyDocument: 'Verifying document info',
        checkExpiry: 'Checking expiry',
        generateForm: 'Generating {{country}} entry form',
        generateQA: 'Generating customs Q&A card',
        translate: 'Translating to local language',
      },
      errors: {
        title: 'Generation failed',
        message: 'Please try again later',
        retry: 'Retry',
        goBack: 'Go back',
      },
    },
    immigrationGuide: {
      openEntryPack: '打开通关包',
      back: 'Back',
      needHelp: 'Need Help',
      previousStep: 'Previous',
      completeEntry: 'Complete Entry, Return to Pack',
      openEntryPack: 'Open Entry Pack',
      previewEntryPack: 'Preview Entry Pack',
      modalClose: 'Close',
      entryCardSampleTitle: 'Entry Card Sample',
      customsDeclarationSampleTitle: 'Customs Declaration Sample',
      clickToViewLarge: 'Click to view large image',
      entryCardModalTitle: 'Japan Entry Card Sample',
      entryCardModalHint: 'Screenshot or zoom to view each field\'s example',
      biometricModalTitle: 'Japan Biometric Guide',
      biometricModalHint: 'Place your finger lightly on the scanner to complete collection',
      customsModalTitle: 'Japan Customs Declaration Sample',
      customsModalHint: 'Screenshot or zoom to view how to answer each question',
      helpMenu: {
        title: 'Need Help?',
        message: 'Please select the type of help you need:',
        findStaff: 'Find Staff',
        findStaffMessage: 'Please look for uniformed staff members',
        languageHelp: 'Language Help',
        languageHelpMessage: 'Staff members speak English and Japanese',
        medicalHelp: 'Medical Help',
        medicalHelpMessage: 'Please call airport medical emergency',
        cancel: 'Cancel',
        notice: 'Notice',
        emergency: 'Emergency',
      },
      japanSteps: {
        step1: {
          title: '📋 Step 1: Get Forms',
          description: 'Find entry card and customs declaration in arrival hall',
          instruction: 'Find counters marked \'Entry Card\' and \'Customs Declaration\' or automated dispensers',
          action: 'Next: Fill Entry Card',
        },
        step2: {
          title: '✍️ Step 2: Fill Entry Card',
          description: 'Fill out black entry card with black or blue pen',
          instruction: 'Carefully copy information from your phone to the form',
          action: 'Next: Customs Declaration',
          formPreviewTitle: '📋 Entry Card Sample',
          formPlaceholderText: 'Black Entry Card',
          formPlaceholderHint: 'Includes personal information, passport number,\\nflight info, accommodation address, etc.',
          viewFormButton: 'Fill Out Entry Form',
        },
        step3: {
          title: '📝 Step 3: Fill Customs Declaration',
          description: 'Fill out yellow customs declaration form',
          instruction: 'Declare items honestly, answer questions about prohibited items',
          action: 'Next: Immigration Check',
          formPreviewTitle: '📋 Customs Declaration Sample',
          formPlaceholderText: 'Yellow Customs Declaration',
          formPlaceholderHint: 'Includes item declarations,\\nprohibited items questions',
          imageHint: 'Tap to view full-size image before filling',
          viewFormButton: 'Fill Out Declaration',
        },
        step4: {
          title: '🏢 Step 4: Go to Immigration',
          description: 'Take your passport and completed forms to immigration counter',
          instruction: 'Find the "Foreigner" lane and queue up. When it\'s your turn, hand your passport and entry card to the officer. Smile and answer simple questions (purpose of visit, duration of stay, etc.)',
          action: 'Next: Biometric Check',
        },
        step5: {
          title: '👤 Step 5: Biometric Check',
          description: 'Fingerprint and facial recognition',
          instruction: 'Follow officer\'s instructions to complete biometric scan',
          action: 'Next: Customs Inspection',
          biometricNotice: '👆 Biometric Example',
          biometricCaption: 'Japan immigration fingerprint scanner',
          viewBiometricButton: 'View Biometric Guide',
        },
        step6: {
          title: '🛃 Step 6: Customs Inspection',
          description: 'After collecting luggage, proceed to customs inspection area',
          instruction: 'Hand your customs declaration form to the officer. If you checked "Yes" on any question or are asked by officer, use the red channel for inspection. If all answers are "No" and you have nothing to declare, use the green channel for quick exit',
          action: 'Complete Customs Check',
        },
        step7: {
          title: '✅ Step 7: Entry Complete',
          description: 'Entry pack for use when needed',
          instruction: 'If immigration officer asks questions or language difficulty, open entry pack to assist',
          action: 'Open Entry Pack',
        },
      },
    },
    notifications: {
      testingTools: {
        title: 'Notification Testing Tools',
        developmentOnly: 'Development Mode Only',
      },
      sections: {
        test: 'Test Notifications',
        actions: 'Actions',
        scheduled: 'Scheduled Notifications ({{count}})',
      },
      stats: {
        title: 'Notification Statistics',
        empty: 'No scheduled notifications',
      },
      actions: {
        viewLogs: 'View Notification Logs',
        cancelAll: 'Cancel All Notifications',
      },
    },
    notificationLog: {
      header: {
        title: 'Notification Logs',
        back: 'Back',
        filter: 'Filter',
      },
      tabs: {
        logs: 'Logs ({{count}})',
        analytics: 'Analytics',
        performance: 'Tools',
      },
      empty: {
        title: 'No notification logs found',
        subtitle: 'Logs will appear here as notifications are sent and interacted with',
      },
      analytics: {
        overall: {
          title: 'Overall Statistics',
          clickRate: 'Click Rate',
          scheduled: 'Scheduled',
          sent: 'Sent',
          clicked: 'Clicked',
        },
        byType: 'By Notification Type',
        timing: {
          title: 'Optimal Timing',
          bestHour: 'Best Hour',
          bestDay: 'Best Day',
          noData: 'No data',
        },
      },
      filterModal: {
        title: 'Filter Logs',
        cancel: 'Cancel',
        clear: 'Clear',
        apply: 'Apply Filters',
        labels: {
          eventType: 'Event Type',
          notificationType: 'Notification Type',
          entryPackId: 'Entry Pack ID',
          eventTypePlaceholder: 'e.g., scheduled, clicked, interacted',
          notificationTypePlaceholder: 'e.g., submissionWindow, urgentReminder',
          entryPackIdPlaceholder: 'Entry pack identifier',
        },
      },
      performance: {
        title: 'Performance Insights',
        viewRecommendations: 'View Recommendations',
        exportLogs: 'Export Logs',
        clearOldLogs: 'Clear Old Logs (30+ days)',
        clearAllLogs: 'Clear All Logs',
      },
    },
    gdpr: {
      export: {
        exported: {
          title: 'Export Complete',
          share: 'Share File',
        },
      },
      deletion: {
        dataItem: {
          willDelete: 'Will be deleted',
          noData: 'No data',
        },
        consequences: {
          accountDeactivated: 'Your account will be deactivated',
        },
      },
    },
    dest: {
      hongkong: {
        hdac: {
          selection: {
            aiValue: 'AI',
          },
        },
      },
      korea: {
        preview: {
          headerTitle: 'Entry Pack Preview',
          previewMode: 'Preview Mode',
          description: 'This is a preview of your entry pack. After applying for K-ETA it will include the full entry details.',
          continue: 'Continue updating info',
          applyKETA: 'Apply for K-ETA',
          ketaInfoTitle: 'K-ETA Electronic Travel Authorization',
        },
      },
      usa: {
        entryGuide: {
          title: 'US Entry Guide',
          titleZh: '美国入境指引',
        },
      },
      hongkong: { entryGuide: { title: 'Hong Kong Entry Guide', titleZh: '香港入境指引' } },
      singapore: { entryGuide: { title: 'Singapore Entry Guide', titleZh: '新加坡入境指引' } },
      malaysia: { entryGuide: { title: 'Malaysia Entry Guide', titleZh: '马来西亚入境指引' } },
      japan: { entryGuide: { title: 'Japan Entry Guide', titleZh: '日本入境指引' } },
      thailand: { entryGuide: { title: 'Thailand Entry Guide (TDAC)', titleZh: '泰国入境指引 (TDAC)' } },
      vietnam: { entryGuide: { title: 'Vietnam Entry Guide', titleZh: '越南入境指引' } },
    },
    tdac: {
      files: {
        loading: 'Loading saved files...',
        empty: {
          pdfs: 'No saved PDFs found',
          qr: 'No saved QR codes found',
        },
      },
    },
    screenTitles: {
      tdacFiles: 'Saved TDAC Files',
    },
  },
  zh: {
    languages: {
      en: 'English',
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      fr: 'Français',
      de: 'Deutsch',
      es: 'Español',
      zh: '中文',
      ms: 'Bahasa Melayu',
    },
    ms: {
      languages: {
        en: '[ms] English',
        'zh-CN': '[ms] 简体中文',
        'zh-TW': '[ms] 繁體中文',
        fr: '[ms] Français',
        de: '[ms] Deutsch',
        es: '[ms] Español',
        zh: '[ms] 中文',
        ms: 'Bahasa Melayu',
      },
    },
    login: {
      tagline: '跨境入境 • 畅通无阻',
      benefits: {
        free: '完全免费',
        noRegistration: '无需注册',
        instant: '即时使用',
      },
      heroCard: {
        title: '填一次，全球通行',
        description: '护照、签证、入境表格，一次录入，自动生成各国版本。出行前几分钟搞定所有入境准备，节省 90% 时间。',
      },
      features: {
        digitalPack: '数字入境包',
        voiceAssistant: '智能语音助手',
        entryNavigation: '入境导航',
      },
      ctaTitle: '跨境入境，从未如此简单',
      ctaSubtitle: '一键填写入境表格，畅享无缝通关体验',
      buttonText: '开始使用 · 免费',
      buttonSubtext: '无需注册，即刻体验',
      whisperText: '💬 无聊了还可以和秘书聊天 😄',
      popularityText: '🔥 {{percent}}% 顺畅入境',
      hotlistLabel: '热门目的地',
      hotlistDescription: '本周最受关注的旅行地',
    },
    common: {
      appName: '入境通 BorderBuddy',
      enterCta: '免费进入',
      footerMessage: '现在免费体验 BorderBuddy · AI 帮你搞定出入境',
      ok: '好的',
      cancel: '取消',
      confirm: '确认',
      back: '返回',
      view: '查看',
      unknown: '未知',
      yes: '是',
      no: '否',
      error: '错误',
      images: {
        tapToEnlarge: '点击放大',
      },
      reader: {
        font: {
          decrease: 'A-',
          increase: 'A+',
        },
      },
      buttons: {
        cancel: '取消',
        share: '分享',
      },
      privacy: {
        localStorage: '所有信息仅保存在您的手机本地',
      },
    },
    tabs: {
      home: '首页',
      history: '归档记录',
      profile: '我的',
    },
    fundItem: {
      types: {
        CASH: '现金',
        BANK_CARD: '银行卡',
        CREDIT_CARD: '信用卡',
        BANK_BALANCE: '银行余额',
        INVESTMENT: '投资',
        DOCUMENT: '文件',
      },
      detail: { notProvided: '暂未提供' },
    },
    profile: {
      header: '我的',
      user: {
        defaultName: '游客',
        phone: '电话：{{phone}}',
      },
      sections: {
        myServices: '我的服务',
        settings: '设置与帮助',
      },
      menu: {
        entryInfoHistory: {
          title: '入境信息历史',
          subtitle: '查看已完成的行程和归档的入境信息',
        },
        backup: {
          title: '云备份',
          subtitle: '上次备份：{{time}}',
          defaultTime: '今天',
        },
        language: {
          title: '语言',
          subtitle: '当前：{{language}}',
        },
        settings: { title: '设置' },
        help: { title: '帮助中心' },
        about: { title: '关于我们' },
        notifications: { title: '通知设置' },
        notificationLogs: {
          title: '通知日志',
          subtitle: '查看通知历史与分析',
        },
        exportData: {
          title: '导出我的数据',
          subtitle: '下载入境包数据（JSON）',
        },
      },
      personal: {
        title: '个人信息',
        subtitle: '更新边检所需信息',
        collapsedHint: '点击显示个人信息',
        gender: {
          male: '男',
          female: '女',
          undefined: '未指定',
          selectPrompt: '选择性别',
        },
        fields: {
          dateOfBirth: {
            title: '出生日期',
            subtitle: '出生日期',
            placeholder: 'YYYY-MM-DD（自动格式化）',
            formatHint: '格式：YYYY-MM-DD',
            hint: '仅输入数字',
          },
          gender: {
            title: '性别',
            subtitle: '性别',
            placeholder: '男 / 女',
          },
          occupation: {
            title: '职业',
            subtitle: '职业',
            placeholder: '职业',
          },
          countryRegion: {
            title: '国家/地区',
            subtitle: '国家/地区',
            placeholder: '选择您的国家',
          },
          provinceCity: {
            title: '城市/省份',
            subtitle: '城市/省份',
            placeholder: '省 / 市',
          },
          phone: {
            title: '手机号',
            subtitle: '电话',
            placeholder: '+86 1234567890',
          },
          email: {
            title: '邮箱地址',
            subtitle: '邮箱',
            placeholder: 'your@email.com',
          },
        },
        errors: {
          dateOfBirth: {
            incomplete: '请填写年份、月份和日期',
            yearRange: '年份需在 1900 到 {{currentYear}} 之间',
            monthRange: '月份需在 1 到 12 之间',
            invalidDay: '该月份的日期无效',
            futureDate: '日期不能晚于今天',
            unrealisticAge: '年龄不合理',
          },
        },
      },
      funding: {
        title: '资金证明清单',
        subtitle: '入境时快速出示',
        collapsedHint: '点击显示资金清单',
        tip: {
          title: '资金充足',
          subtitle: '入境检查时可快速出示',
          description: '准备现金、银行卡、银行流水或其他证明文件',
        },
        footerNote: '点击查看资金清单',
        common: { notFilled: '未填写' },
        selectType: '选择资金条目类型',
        selectTypeMessage: '选择要添加的资金条目类型',
        type: {
          cash: '现金',
          bankCard: '银行卡',
          document: '证明文件',
          cancel: '取消',
        },
        empty: '暂未添加资金条目。点击下方添加第一条。',
        addButton: '添加资金条目',
      },
      passport: {
        defaultType: '中国护照',
        title: '我的护照',
        subtitle: '护照 {{passportNo}} · 有效期至 {{expiry}}',
        fields: {
          fullName: {
            title: '英文姓名',
            subtitle: '与护照一致',
          },
          passportNo: '护照号码',
          'passportNo.short': '护照号',
          nationality: '国籍',
          'nationality.short': '国籍',
          expiry: '到期日期',
          'expiry.short': '有效至',
        },
        updateButton: '更新护照信息',
        collapsedHint: '点击展开护照详情',
      },
      vip: {
        title: '升级到高级版',
        subtitle: '无限生成，优先处理',
        upgradeButton: '立即升级',
      },
      editModal: {
        previous: '← 上一步',
        next: '下一步 →',
        done: '完成',
      },
      export: {
        confirmTitle: '导出数据',
        confirmMessage: '将您的入境包数据导出为 JSON？',
        cancel: '取消',
        confirm: '导出',
        errorTitle: '导出失败',
        errorMessage: '导出数据失败，请重试。',
        noDataTitle: '暂无可导出数据',
        noDataMessage: '您的入境包中未找到数据。',
        successTitle: '导出完成',
        successMessage: '您的数据已导出。',
        ok: '好的',
        share: '分享',
        shareUnavailableTitle: '无法分享',
        shareUnavailableMessage: '当前设备不支持分享功能。',
        shareTitle: '入境包数据导出',
        shareMessage: '这是我的入境包数据',
        shareErrorTitle: '分享失败',
        shareErrorMessage: '无法分享该文件。',
      },
      logout: '退出登录',
      version: '版本 {{version}}',
      common: { notFilled: '未填写' },
    },
    screenTitles: {
      scanPassport: '扫描证件',
      selectDestination: '选择目的地',
      result: '入境包',
      copyWriteMode: '抄写模式',
    },
    copyWriteMode: {
      title: '抄写模式',
      subtitle: '对照此屏幕填写纸质表格',
      description: '屏幕会保持常亮，方便您慢慢抄写',
      fontSizeLabel: '字体大小：',
      instructionsTitle: '使用说明',
      step1: '1. 按照屏幕内容抄写到纸质表格',
      step2: '2. 按照表格顺序从上往下填写',
      step3: '3. 填写完成后交给入境官员',
      // 日本表格
      japanLandingCard: '入境卡（黑色表格）',
      japanCustomsDeclaration: '海关申报单（黄色表格）',
      // 加拿大 E311 表格
      canadaPart1: '第一部分：旅客信息',
      canadaPart2: '第二部分：地址信息',
      canadaPart3: '第三部分：旅行详情',
      canadaPart4: '第四部分：海关申报（打勾 ✓ 或 ✗）',
      // 字段标签
      familyName: '姓',
      givenName: '名',
      lastName: '姓',
      firstName: '名',
      middleInitial: '中间名首字母',
      dateOfBirth: '出生日期',
      nationality: '国籍',
      citizenship: '国籍',
      passportNumber: '护照号码',
      flightNumber: '航班号',
      purposeOfVisit: '入境目的',
      addressInJapan: '住宿地址',
      name: '姓名',
      prohibitedItems: '是否有违禁品？',
      cashOverLimit: '携带现金超过10,000日元？',
      commercialGoods: '是否有商业物品？',
      totalValueOfGoods: '携带物品总价值',
      homeAddress: '家庭住址',
      postalCode: '邮编',
      airlineFlightNumber: '航班号',
      arrivalDate: '到达日期',
      arrivingFrom: '来自哪个国家',
      purposeOfTrip: '入境目的',
      currencyOverLimit: '携带现金超过$10,000加元？',
      commercialGoodsForResale: '携带商业物品、样品或用于转售的商品？',
      foodPlantsAnimals: '携带食品、植物、动物或相关产品？',
      visitedFarm: '近期访问过农场或接触过农场动物？',
      firearms: '携带枪支或武器？',
      exceedsDutyFree: '携带物品超过免税额度？',
      // 说明文字
      instructionFamilyName: '填写护照上的姓氏',
      instructionGivenName: '填写护照上的名字',
      instructionLastName: '填写护照上的姓（大写字母）',
      instructionFirstName: '填写护照上的名（大写字母）',
      instructionMiddleInitial: '如果没有中间名，留空',
      instructionDateOfBirth: '格式：年月日（YYYYMMDD）',
      instructionDateOfBirthDash: '格式：年-月-日（YYYY-MM-DD）',
      instructionNationality: '填写国籍',
      instructionCitizenship: '填写国籍（大写字母）',
      instructionPassportNumber: '填写护照号码',
      instructionFlightNumber: '例如：CA981, CZ309',
      instructionFlightNumberCanada: '例如：AC088, CZ329',
      instructionPurposeOfVisit: '填写 TOURISM',
      instructionAddressInJapan: '填写酒店名称和地址',
      instructionName: '填写中文姓名',
      instructionProhibitedItems: '如果没有违禁品，填 NO',
      instructionTruthfulAnswer: '如实回答',
      instructionTotalValue: '一般填写 ¥0（无需要申报的物品）',
      instructionCanadaAddress: '填写在加拿大的住址（酒店地址）',
      instructionPostalCode: '酒店的邮编（如果知道的话）',
      instructionDateFormat: '格式：年-月-日',
      instructionArrivingFrom: '如果从美国转机，填 U.S.A.',
      instructionPurposeOptions: '选项：Study / Personal / Business',
      instructionFoodItems: '包括：水果、肉类、种子、木制品等',
      instructionGiftsLimit: '礼品超过$60加元需申报',
      // 提示
      tipsTitle: '重要提示',
      tipJapan1: '请用黑色或蓝色笔填写表格',
      tipJapan2: '字迹要清晰工整，避免涂改',
      tipJapan3: '海关申报部分一定要如实填写',
      tipJapan4: '填写完成后，交给入境官员检查',
      tipJapan5: '保留入境卡副联直到离境',
      tipCanada1: '请用大写英文字母填写姓名和国籍',
      tipCanada2: '日期格式：年-月-日（例如：2025-01-15）',
      tipCanada3: '海关申报部分一定要如实填写',
      tipCanada4: '填写完成后，在表格底部签名',
      tipCanada5: '16岁以下的儿童可由父母代签',
      // 样本卡片
      sampleTitleJapan: '入境卡和申报单样式',
      sampleTitleCanada: 'E311 表格样式',
      sampleImageTitleJapan: '入境卡和海关申报单',
      sampleImageTitleCanada: 'E311 海关申报单',
      sampleSubtitle: '（纸质表格图片示例）',
      sampleDescription: '表格上的字段顺序与本页面一致',
      // 底部提示
      bottomTipTitle: '抄写完成后，记得检查一遍',
      bottomTipDescription: '确保姓名、护照号、航班号等重要信息正确',
      // 值和占位符
      valueLeaveBlank: '（留空）',
      defaultChineseName: '张伟',
    },
    home: {
      header: {
        title: '入境通',
      },
      greeting: '你好，{{name}} 👋',
      welcomeText: '选择目的地，生成您的通关包',
      sections: {
        pending: '🛬 即将出行',
        whereToGo: '🧭 想去哪里？',
      },
      passport: {
        type: '中国护照',
      },
      destinationNames: {
        jp: '日本',
        th: '泰国',
        hk: '香港',
        tw: '台湾',
        kr: '韩国',
        sg: '新加坡',
        vn: '越南',
        my: '马来西亚',
        us: '美国',
      },
      destinations: {
        japan: { flightTime: '3小时飞行' },
        thailand: { flightTime: '3小时飞行' },
        hongKong: { flightTime: '1小时飞行' },
        taiwan: { flightTime: '2小时飞行' },
        korea: { flightTime: '2小时飞行' },
        singapore: { flightTime: '5小时飞行' },
        vietnam: { flightTime: '3.5小时飞行' },
        malaysia: { flightTime: '4小时飞行' },
        usa: { flightTime: '13小时飞行' },
      },
      visaBadges: {
        visaFree: '免签',
        visaOnArrival: '落地签',
        eVisa: '电子签',
        eta: 'ETA',
        hkPermit: '港澳证',
        twEntryPermit: '入台证',
        visaRequired: '需签证',
        unknown: '待确认',
      },
      pendingTrips: {
        departSuffix: '出发',
        cards: {
          jp: { title: '日本 · 东京' },
          th: { title: '泰国 · 曼谷' },
          us: { title: '美国 · 纽约' },
          kr: { title: '韩国 · 首尔' },
          sg: { title: '新加坡 · 樟宜' },
          my: { title: '马来西亚 · 吉隆坡' },
          tw: { title: '台湾 · 台北' },
          hk: { title: '香港' },
        },
      },
      alerts: {
        notAvailableTitle: '敬请期待',
        notAvailableBody: '此目的地暂未开放，敬请期待！',
        historyFoundTitle: '找到通关包',
        historyFoundBody: {
          pre: '我们找到了您前往{{country}}的通关包：',
          flight: '航班',
          date: '日期',
          hotel: '酒店',
          question: '是否使用此通关包？',
          regenerate: '重新生成',
        },
      },
      history: {
        emptyTitle: '暂无历史记录',
        emptySubtitle: '您的通关包将显示在这里',
        cardTitle: '{{country}}通关包',
      },
      actions: {
        leaveTrip: '不去了',
        archiveTrip: 'Archiver',
        restoreTrip: 'Restore to Home',
        show: 'Afficher',
        hide: 'Masquer',
        showSection: 'Afficher la liste',
        hideSection: 'Masquer la liste',
      },
    },
    history: {
      headerTitle: '归档记录',
      filterButton: '筛选 ⌄',
      searchPlaceholder: '搜索目的地或日期…',
      timePrefix: '生成时间',
      passportPrefix: '护照',
      sections: {
        today: '今天',
        yesterday: '昨天',
        thisWeek: '本周',
        thisMonth: '本月',
        earlier: '更早',
      },
      items: {
        hk: {
          title: '香港通关包',
          time: '今天 下午2:30',
          passport: '中国护照 E12345678',
        },
        th: {
          title: '泰国通关包',
          time: '昨天 上午10:15',
          passport: '中国护照 E12345678',
        },
      },
      empty: {
        title: '暂无历史记录',
        subtitle: '您生成的通关包将显示在这里',
      },
      labels: {
        arrivalDate: '到达日期',
        submittedAt: '提交时间',
        createdAt: '创建时间',
      },
      left: {
        title: '已离开的行程',
        helper: '您可以随时将任何行程恢复到首页。',
        status: '已离开',
        movedAt: '移至此处：{{date}}',
        completion: '完成度 {{percent}}%',
      },
      archived: {
        title: '已归档的行程',
        helper: '当您需要时，可以恢复已归档的行程。',
        status: '已归档',
        archivedAt: '归档于：{{date}}',
      },
      actions: {
        show: '展开',
        hide: '收起',
        showSection: '展开列表',
        hideSection: '收起列表',
        restoreTrip: '恢复到首页',
        archiveTrip: '归档',
        archiveTitle: '归档此行程？',
        archiveMessage: '该行程将移至"已归档"，可以稍后恢复。',
        archiveConfirm: '确认归档',
        archiveSuccess: '{{destination}}已归档。',
        restoreSuccess: '{{destination}}已恢复到首页。',
        errorTitle: '操作失败',
        errorMessage: '请稍后再试。',
      },
    },
    travelInfo: {
      header: { title: '旅行信息', back: '返回' },
      infoCard: { title: '前往{{destination}}', subtitle: '填写您的旅行详情' },
      sections: { flight: '航班信息', accommodation: '住宿信息', trip: '行程详情', health: '健康申报', usCustoms: '美国海关申报', caCustoms: '加拿大海关申报' },
      fields: {
        flightNumber: { label: '航班号', placeholder: '例如: CA981' },
        arrivalDate: { label: '到达日期', placeholder: 'YYYY-MM-DD', help: '必须在72小时内' },
        hotelName: { label: '酒店名称', placeholder: '酒店名称或地址' },
        hotelAddress: { label: '酒店地址', placeholder: '完整地址' },
        contactPhone: { label: '联系电话', placeholder: '+1234567890' },
        stayDuration: { label: '停留天数', placeholder: '例如: 7' },
        purpose: '访问目的',
      },
      purposes: { tourism: '旅游', business: '商务', visiting: '探亲', study: '学习', work: '工作' },
      yesNoQuestion: { fever: '近期是否发烧？', usCash: '是否携带超过1万美元现金？', usFood: '是否携带食品、植物或动物？', caCurrency: '是否携带超过1万加元？', caDuty: '是否携带需纳税物品？', caFirearms: '是否携带枪支或武器？', caCommercial: '是否携带商业物品？', caFood: '是否携带食品、植物、动物或相关产品？' },
      arrivingFrom: { label: '来自', us: '美国', other: '其他国家' },
      hints: { caDuty: '包括酒精、烟草、超过免税额的礼品', caFood: '包括肉类、乳制品、水果、蔬菜、种子' },
      scanButtons: { ticket: '扫描机票', hotel: '扫描预订单' },
      generateButton: '生成通关包',
      tips: { title: '💡 提示', body: '• 准备好您的机票\n• 酒店预订确认\n• 诚实填写海关申报\n• 保留联系信息' },
      alerts: {
        permissionPhotoTitle: '需要照片权限',
        permissionPhotoBody: '我们需要相机/相册权限来扫描文档',
        permissionDeniedAction: '好的',
        ocrSuccessFlight: '航班信息已提取！',
        ocrSuccessHotel: '酒店信息已提取！',
        loginRequiredTitle: '需要登录',
        loginRequiredBody: 'OCR功能需要登录',
        loginButton: '登录',
        manualEntryButton: '手动输入',
        ocrFailTitle: '识别失败',
        ocrFailBody: '无法提取信息',
        genericErrorTitle: '错误',
        galleryError: '无法打开相册',
        dateTooFarTitle: '日期太远',
        dateTooFarBody: '到达日期必须在72小时内（距离{{days}}天）',
        datePastTitle: '无效日期',
        datePastBody: '到达日期不能是过去',
      },
      duplicateModal: {
        title: '通关包已存在',
        message: '我们找到了相同航班信息的通关包：',
        labels: { destination: '目的地:', flight: '航班:', arrival: '到达:', generated: '生成时间:' },
        arrivalSuffix: '{{date}}到达',
        hint: '您想使用现有通关包还是生成新的？',
        useExisting: '使用现有通关包',
        regenerate: '生成新通关包',
        cancel: '取消',
      },
    },
    immigrationGuide: {
      openEntryPack: '打开通关包',
      previewEntryPack: '预览通关包',
    },
    singapore: {
      info: {
        headerTitle: '新加坡入境信息',
        title: '新加坡入境指南',
        subtitle: '中国护照持有者免签30天',
        sections: {
          visa: {
            title: '✓ 好消息！免签政策',
            items: [
              '从2024年2月9日起，中国护照免签30天 - 说走就走！',
              '• 无需提前申请签证',
              '• 适用于旅游、探亲、商务等私人事务',
              '• 新要求：入境前需提交SG Arrival Card（有提交时间限制）',
            ],
          },
          onsite: {
            title: '⚠️ 入境须知',
            items: [
              '• SG Arrival Card有严格时间限制：提前提交会被拒绝，过晚提交来不及',
              '• 时间计算容易出错：需按新加坡时间计算，时差问题容易导致失误',
              '• 信息准确性要求高：护照、航班、住宿任何错误都可能影响入境',
              '• 家庭申报更复杂：多人信息容易遗漏或填错',
              '• 一次性使用：再次入境需重新提交，不能重复使用旧申报',
            ],
          },
          appFeatures: {
            title: '✨ 入境通帮您轻松搞定',
            items: [
              '• 零焦虑：自动追踪行程，在最佳时间提醒您',
              '• 零失误：智能填写，信息准确无误',
              '• 零操心：一次输入，自动管理整个流程',
              '• 家庭便利：支持家庭成员批量申报，省时省心',
            ],
          },
        },
        continueButton: '我已了解，继续确认材料',
      },
      requirements: {
        headerTitle: 'SG Arrival Card 准备清单',
        introTitle: '以下是入境所需准备事项',
        introSubtitle: '这些信息可以先填着，慢慢补全',
        items: {
          validPassport: {
            title: '护照有效期',
            description: '护照建议至少还有6个月有效期',
            details: '新加坡建议护照有效期不少于6个月，若即将到期请提前换发新护照。',
          },
          submissionWindow: {
            title: '3天内申报窗口',
            description: '按照新加坡时间（GMT+8）在抵达前3天内提交',
            details: '窗口未打开前提交会被系统拒绝，请在倒计时进入后再完成申报，可设置提醒防止错过。',
          },
          travelDetails: {
            title: '行程与住宿信息',
            description: '航班/船班/巴士号、入境口岸、住宿/联系人、访问目的',
            details: '准备包含国际区号的联系电话。商务访客可填写新加坡公司或邀请人的联系方式。',
          },
          familyGroups: {
            title: '家庭/随行成员安排',
            description: '确定是单独提交还是使用家庭申报',
            details: '家庭申报最多支持10人，需要逐一输入成员信息。请准备好儿童及随行人员的护照资料。',
          },
          sgArrivalHistory: {
            title: '入境记录',
            description: 'SG Arrival Card 仅限一次入境使用',
            details: '再次入境需要重新提交最新行程。旧的申报无法重复使用。',
          },
        },
        status: {
          success: {
            title: '太好了！您可以继续',
            subtitle: '接下来我们将确认您的旅行信息。',
          },
          warning: {
            title: '请先确认所有事项',
            subtitle: '我们支持递进式的完成清单',
          },
          info: {
            title: '随时开始填写',
            subtitle: '我们支持递进式的完成清单',
          },
        },
        startButton: '开始填写',
        continueButton: '继续填写行程信息',
      },
      selection: {
        headerTitle: 'SG Arrival Card 智能助手',
        headerSubtitle: '选择最适合你的申报方式',
        recommendedBadge: '推荐',
        smartFlow: {
          title: '⚡ 智能引导模式',
          subtitle: '利用通关包快速填写',
          highlights: [
            { title: '预计耗时', value: '6-10分钟' },
            { title: '家庭支持', value: '最多10人' },
            { title: '成功率', value: '98%' },
          ],
          features: [
            '• 自动带出护照、航班与住宿信息',
            '• 提醒添加家庭成员并核对健康申报',
            '• 记录确认邮件/短信，入境时快速出示',
          ],
          cta: '开始智能引导 ->',
        },
        webFlow: {
          title: '🌐 SG Arrival Card 官网',
          subtitle: '在应用内直接打开官方表单',
          features: [
            '• 内嵌官方页面，功能完整',
            '• 无需切换应用即可复制通关包信息',
            '• 熟悉流程的旅客可以快速完成提交',
          ],
          cta: '打开内嵌SG Arrival Card',
        },
        notes: {
          title: '温馨提醒',
          items: [
            '每次入境都需重新申报，纯过境且不入境的旅客可免提交。',
            '家庭申报需逐一填写成员信息，确保数据准确。',
            '请保留确认邮件/短信，以备入境官员查验。',
          ],
        },
      },
      guide: {
        headerTitle: 'SG Arrival Card 引导模式',
        banner: {
          title: '利用通关包信息自动填表',
          subtitle: '逐步提醒，适合携家人共同申报',
        },
        stepSectionTitle: '操作步骤',
        steps: [
          {
            title: '核对旅客信息',
            subtitle: '确保护照资料与表单完全一致',
            details: [
              '确认姓名拼写、护照号、国籍、有效期无误。',
              '选择正确的旅客类型（例如外国访客、居民返回）。',
              '填写可用的邮箱与手机号，以便接收通知。',
            ],
          },
          {
            title: '填写抵达与住宿信息',
            subtitle: '根据行程如实填写',
            details: [
              '输入抵达日期时间以及航班/船/巴士号，需在3天窗口内。',
              '选择抵达口岸（如樟宜机场 T3、兀兰关卡等）。',
              '提供住宿地址或当地联系人的详细信息，包括邮编。',
            ],
          },
          {
            title: '健康与旅行申报',
            subtitle: '如实填写健康状况与旅行史',
            details: [
              '如实申报近期是否访问高风险地区。',
              '准确回答健康症状问题，并保留相关证明。',
              '提交后请确认已收到邮件或短信通知。',
            ],
          },
        ],
        quickActions: {
          title: '快捷工具',
          items: [
            {
              icon: '🕒',
              title: '72小时提醒',
              description: '根据抵达日期提醒您何时可以提交。',
            },
            {
              icon: '👪',
              title: '家庭助手',
              description: '快速复制信息，方便为家人提交。',
            },
            {
              icon: '📬',
              title: '确认追踪',
              description: '记录收到确认邮件/短信的账号，入境时不慌。',
            },
          ],
        },
        primaryCta: '打开SG Arrival Card助手',
        ctaHint: '将在应用内加载ICA官方网站。',
      },
      webview: {
        headerTitle: 'SG Arrival Card 网页助手',
        notice: '在此完成新加坡数字入境卡，所有数据仅保存在本机。',
        loading: '正在加载SG Arrival Card...',
        openExternal: '使用浏览器打开',
        openFailedTitle: '无法打开链接',
        openFailedBody: '请复制网址后在浏览器中打开。',
      },
    },
    japan: {
      info: {
        headerTitle: '日本入境信息',
        title: '日本入境指南',
        subtitle: '中国护照持有人需提前办理签证',
        sections: {
          visa: {
            title: '⚠️ 签证要求',
            items: [
              '中国护照持有人需提前申请日本签证，目前暂无短期免签政策。',
              '• 常见签证类型为短期停留（旅游/商务/探亲），最长可停留90天。',
              '• 需通过日本驻华使领馆或指定的签证申请中心提交材料。',
              '• 办理需准备护照、行程、财力证明等，建议至少预留1周时间。',
            ],
          },
          important: {
            title: '⚠️ 入境须知',
            items: [
              '• 表格必须用黑色或蓝色笔填写。',
              '• 字迹要清晰易读。',
              '• 对海关表格的所有问题要如实回答。',
              '• 保留入境卡存根至离境。',
              '• 需要进行生物识别扫描（指纹/面部）。',
            ],
          },
          appFeatures: {
            title: '✨ 入境通帮您轻松搞定',
            items: [
              '• 零焦虑：自动提醒表格填写和生物识别步骤。',
              '• 零失误：复制模式确保数据准确转移到纸质表格。',
              '• 零操心：详细的逐步指南涵盖整个流程。',
              '• 文件清单：移民/海关的完整准备清单。',
            ],
          },
        },
        continueButton: '明白了，继续准备',
      },
      requirements: {
        headerTitle: '日本入境检查清单',
        introTitle: '入境准备清单',
        introSubtitle: '填写您有的内容，逐步完善',
        items: {
          validVisa: {
            title: '有效签证',
            description: '已批准的日本旅游签证',
            details: '中国公民需提前申请签证。确认您的签证有效且有足够入境次数。',
          },
          validPassport: {
            title: '有效护照',
            description: '护照有效期至少6个月',
            details: '护照必须在计划离境日期后6个月以上有效',
          },
          returnTicket: {
            title: '返程机票',
            description: '已确认的返程或后续行程机票',
            details: '必须有明确的离境计划，显示您将在90天内离开日本',
          },
          sufficientFunds: {
            title: '充足资金',
            description: '整个停留期间的资金证明',
            details: '建议携带至少10万日元或等值，或出示信用卡/银行对账单',
          },
          accommodation: {
            title: '住宿证明',
            description: '日本的酒店预订或房东联系方式',
            details: '提供酒店预订确认或日本朋友/亲戚的详细联系信息',
          },
        },
        status: {
          success: {
            title: '太好了！您可以继续。',
            subtitle: '接下来我们将确认您的旅行信息。',
          },
          warning: {
            title: '检查每个清单项目',
            subtitle: '在继续之前完成先决条件。',
          },
          info: {
            title: '随时开始填写',
            subtitle: '我们支持递进式的完成清单',
          },
        },
        startButton: '开始填写',
      },
      procedures: {
        headerTitle: '日本入境流程',
        title: '日本入境指南',
        subtitle: '中国护照持有者免签90天',
        helpSection: {
          title: '📝 入境通帮您做什么',
          description: '我们帮您填好入境卡和海关申报表，您只需在机场抄写！',
          subdescription: '不用担心填错，只需抄写我们准备好的内容',
        },
        entrySteps: {
          title: '🚶‍♂️ 入境步骤',
          steps: [
            {
              title: '抵达机场',
              description: '抵达日本机场入境大厅',
              details: '准备好护照和已填写的入境卡及海关申报表',
            },
            {
              title: '入境检查',
              description: '前往入境检查柜台',
              details: '提交护照和入境卡，接受官员检查并采集指纹',
            },
            {
              title: '海关申报',
              description: '前往海关检查区域',
              details: '提交海关申报表，申报携带物品，可能需要行李检查',
            },
            {
              title: '入境完成',
              description: '获得入境印章',
              details: '护照上获得入境印章，正式进入日本',
            },
          ],
        },
        features: {
          title: '✨ 入境通能为您做什么',
          items: [
            {
              icon: '📝',
              title: '自动填写',
              description: '我们填好入境卡和申报表，您只需抄写',
            },
            {
              icon: '📋',
              title: '信息录入',
              description: '一次输入旅行信息，系统自动填写所有表格',
            },
            {
              icon: '📱',
              title: '无需网络',
              description: '离线查看表格，机场无信号也能使用',
            },
            {
              icon: '💾',
              title: '记住信息',
              description: '保存详细信息，下次访日直接使用',
            },
          ],
        },
        importantNotes: {
          title: '⚠️ 重要提醒',
          items: [
            '• 入境卡和申报表必须用黑色或蓝色笔填写',
            '• 字迹要清晰，信息要准确',
            '• 申报表上的是非题要如实回答',
            '• 检查时要礼貌配合',
            '• 入境卡存根要保留到离境',
          ],
        },
        startButton: '开始准备入境资料包',
      },
      travelInfo: {
        headerTitle: '日本入境信息',
        title: '填写日本入境信息',
        subtitle: '请提供以下信息以完成入境准备',
        privacyNote: '💾 所有信息仅保存在您的手机本地',
        loading: '加载中...',
        sections: {
          passport: '护照信息',
          personal: '个人信息',
          funds: '资金证明',
          travel: '旅行信息',
        },
        fields: {
          passportName: '护照姓名（英文）',
          passportNamePlaceholder: '请输入护照上的英文姓名',
          nationality: '国籍',
          nationalityPlaceholder: '请选择国籍',
          passportNumber: '护照号码',
          passportNumberPlaceholder: '请输入护照号码',
          passportNumberHelp: '6-12位字母和数字组合',
          dateOfBirth: '出生日期',
          dateOfBirthHelp: '请选择您的出生日期',
          expiryDate: '护照有效期',
          expiryDateHelp: '请选择护照到期日期',
          occupation: '职业',
          occupationPlaceholder: '请输入您的职业',
          cityOfResidence: '居住城市',
          cityOfResidencePlaceholder: '请输入您的居住城市',
          residentCountry: '居住国家',
          residentCountryPlaceholder: '请选择居住国家',
          phoneCode: '区号',
          phoneCodePlaceholder: '+86',
          phoneNumber: '电话号码',
          phoneNumberPlaceholder: '请输入电话号码',
          email: '电子邮箱',
          emailPlaceholder: '请输入电子邮箱',
          gender: '性别',
          genderMale: '男性',
          genderFemale: '女性',
          genderUndefined: '未指定',
          travelPurpose: '旅行目的',
          travelPurposeTourism: '观光旅游',
          travelPurposeBusiness: '商务',
          travelPurposeVisiting: '亲属探访',
          travelPurposeTransit: '过境转机',
          travelPurposeOther: '其他',
          customTravelPurpose: '请说明旅行目的',
          customTravelPurposePlaceholder: '请输入您的旅行目的',
          arrivalFlightNumber: '抵达航班号',
          arrivalFlightNumberPlaceholder: '例如：NH123',
          arrivalDate: '抵达日期',
          arrivalDateHelp: '请选择您的抵达日期',
          accommodationType: '住宿类型',
          accommodationTypeHotel: '酒店',
          accommodationTypeRyokan: '日式旅馆',
          accommodationTypeFriend: '朋友家',
          accommodationTypeAirbnb: '民宿',
          accommodationTypeOther: '其他',
          customAccommodationType: '请说明住宿类型',
          customAccommodationTypePlaceholder: '请输入住宿类型',
          accommodationName: '住宿名称',
          accommodationNamePlaceholder: '请输入酒店/住宿名称',
          accommodationAddress: '住宿地址',
          accommodationAddressPlaceholder: '请输入日本的完整地址',
          accommodationAddressHelp: '例如：东京都涩谷区涩谷1-2-3 150-0002',
          accommodationPhone: '住宿电话',
          accommodationPhonePlaceholder: '请输入住宿电话号码',
          lengthOfStay: '预计停留天数',
          lengthOfStayPlaceholder: '请输入停留天数',
        },
        placeholders: {
          fundsSection: '资金证明字段将在后续任务中实现',
          travelSection: '旅行信息字段将在后续任务中实现',
        },
        funds: {
          emptyMessage: '尚未添加资金证明。请至少添加一项资金证明。',
          addButton: '添加资金证明',
        },
        continueButton: '查看入境指南',
        errors: {
          loadingFailed: '加载数据出错',
          loadingFailedMessage: '无法加载现有数据。您仍可以输入新信息。',
          saveFailed: '保存数据失败，请重试。',
          completeAllFields: '请完成所有必填字段',
          invalidPassportNumber: '护照号码必须是6-12位字母和数字',
          invalidDateFormat: '日期格式无效',
          invalidDate: '日期无效',
          expiryDateFuture: '护照有效期必须是未来日期',
          dobPast: '出生日期必须是过去日期',
          invalidName: '姓名只能包含字母、空格、连字符、撇号和句点',
          nameTooShort: '姓名至少需要2个字符',
          selectNationality: '请选择国籍',
          invalidEmail: '电子邮箱格式无效',
          invalidPhone: '电话号码格式无效',
          occupationTooShort: '职业至少需要2个字符',
          invalidFlightNumber: '航班号格式无效（例如：NH123）',
          arrivalDateFuture: '抵达日期必须是未来日期',
          invalidAccommodationPhone: '住宿电话号码格式无效',
          invalidLengthOfStay: '停留天数必须是正整数',
          lengthOfStayTooLong: '停留天数不能超过180天',
        },
      },
      result: {
        digitalBadge: '抵达前3天提交',
        digitalTitle: '新加坡 SG Arrival Card',
        digitalHighlight: '利用通关包快速完成SG Arrival Card，请保留确认邮件或短信以备入境查验。',
        digitalButton: '启动SG Arrival助手',
      },
    },

    taiwan: {
      info: {
        headerTitle: '台湾入境信息',
        title: '台湾入境指南',
        subtitle: '中国大陆护照需提前办理入台证',
        sections: {
          visa: {
            title: '✓ 签证政策',
            items: [
              '中国大陆护照需提前申请入台证，不可免签。',
              '• 单次入境停留最多15天，多次入境每年累计最多120天',
              '• 适用于旅游、探亲、商务等目的',
              '• 新要求：入境需提交电子入境卡（需验证码验证）',
            ],
          },
          onsite: {
            title: '⚠️ 入境须知',
            items: [
              '• 邮箱验证码环节容易卡顿：验证码有时效限制，邮件延迟可能导致填表中断',
              '• 信息准确性要求高：护照、航班、住宿信息任何错误都可能影响入境',
              '• 行程变动需重新提交：信息改变后必须更新，否则与实际不符可能被询问',
              '• 多个材料需准备齐全：入台证、电子入境卡、往返机票缺一不可',
              '• 超期停留后果严重：将影响今后入境申请和审批',
            ],
          },
          appFeatures: {
            title: '✨ 入境通帮您轻松搞定',
            items: [
              '• 零焦虑：行程确定后自动提醒填写，不用担心忘记',
              '• 零失误：智能填写电子入境卡，信息准确无误',
              '• 零操心：一次输入，自动管理整个流程',
              '• 验证码助手：快速获取和输入邮箱验证码，流畅完成提交',
            ],
          },
        },
        continueButton: '我已了解，继续确认材料',
      },
      requirements: {
        headerTitle: '台湾电子入境卡准备清单',
        introTitle: '请确认以下事项',
        introSubtitle: '邮箱验证码是进入表单的关键步骤',
        items: {
          validPassport: {
            title: '护照有效期',
            description: '护照需在停留期间保持有效',
            details: '建议至少保留6个月有效期，避免入境时被拒。',
          },
          emailAccess: {
            title: '可用邮箱',
            description: '能够即时接收验证码邮件',
            details: '准备好能快速登录的邮箱，验证码有效时间较短，请及时输入。',
          },
          submissionWindow: {
            title: '提前提交',
            description: '行程确定后即可填写，如有变动需重新提交',
            details: '台湾允许提前填写，但信息变动时请及时更新以免影响入境。',
          },
          travelDetails: {
            title: '行程与住宿信息',
            description: '航班、住宿或接待人、联络电话',
            details: '包括航空公司、航班号、住宿地址/邮编、联系电话等。',
          },
          otpReady: {
            title: '验证码准备',
            description: '可即时查看邮件验证码',
            details: '验证码通常为6位数字，请在有效时间内输入完成验证。',
          },
        },
        status: {
          success: {
            title: '准备完成！',
            subtitle: '接下来会使用通关包信息协助填写电子入境卡。',
          },
          warning: {
            title: '请先确认所有事项',
            subtitle: '我们支持递进式的完成清单',
          },
          info: {
            title: '随时开始填写',
            subtitle: '我们支持递进式的完成清单',
          },
        },
        startButton: '开始填写',
        continueButton: '继续填写行程信息',
      },
      selection: {
        headerTitle: '台湾电子入境卡助手',
        headerSubtitle: '选择智能引导或直接打开官网',
        recommendedBadge: '推荐',
        smartFlow: {
          title: '⚡ 智能引导模式',
          subtitle: '结合通关包并提醒验证码步骤',
          highlights: [
            { title: '预计耗时', value: '7-12分钟' },
            { title: '验证码步骤', value: '邮箱OTP' },
            { title: '成功率', value: '97%' },
          ],
          features: [
            '• 自动带出护照、航班、住宿信息',
            '• 提醒及时查看邮箱并输入验证码',
            '• 帮助记录确认邮件，入境时可快速出示',
          ],
          cta: '开始智能引导 ->',
        },
        webFlow: {
          title: '🌐 官网快速入口',
          subtitle: '在应用内直接打开台湾移民署网站',
          features: [
            '• 完整内嵌验证码与提交流程',
            '• 支持复制通关包信息快速粘贴',
            '• 熟悉流程的旅客可迅速完成提交',
          ],
          cta: '打开内嵌台湾电子入境卡',
        },
        notes: {
          title: '温馨提醒',
          items: [
            '只有准备好验证码时再点击发送，避免超时。',
            '若行程变动，请重新提交最新资料。',
            '保存成功页面或邮件截图，以备海关查验。',
          ],
        },
      },
      guide: {
        headerTitle: '台湾电子入境卡引导模式',
        banner: {
          title: '协助完成邮箱验证与填表',
          subtitle: '逐步提醒，确保不遗漏任何字段',
        },
        stepSectionTitle: '操作步骤',
        steps: [
          {
            title: '发送并获取验证码',
            subtitle: '保持邮箱开启，及时查看',
            details: [
              '在官网输入邮箱后点击发送验证码。',
              '在邮箱（含垃圾邮件夹）查收6位数验证码。',
              '在有效时间内输入验证码解锁表单。',
            ],
          },
          {
            title: '填写旅客与抵达信息',
            subtitle: '使用通关包中的资料快速填写',
            details: [
              '核对护照号码、国籍、生日等字段。',
              '填写航班号、抵达时间、入境口岸。',
              '输入住宿地址或接待人联系方式，包含邮递区号。',
            ],
          },
          {
            title: '旅行史与确认提交',
            subtitle: '如实填写14日内旅行史',
            details: [
              '选择过去14天曾到访的国家地区。',
              '确认健康与其他声明问题。',
              '提交后保留确认页面或邮件，入境时备用。',
            ],
          },
        ],
        quickActions: {
          title: '快捷工具',
          items: [
            {
              icon: '✉️',
              title: '验证码提醒',
              description: '记录验证码是否收到，避免遗漏。',
            },
            {
              icon: '📎',
              title: '一键复制资料',
              description: '随时复制护照/航班等信息粘贴到表单。',
            },
            {
              icon: '🔁',
              title: '再次提交助手',
              description: '行程变更时快速重新生成新的入境卡。',
            },
          ],
        },
        primaryCta: '打开台湾入境助手',
        ctaHint: '将在应用内加载台湾移民署网站。',
      },
      webview: {
        headerTitle: '台湾电子入境卡网页助手',
        notice: '在此发送验证码并填写电子入境卡，数据仅存于本机。',
        loading: '正在加载台湾电子入境卡...',
        openExternal: '使用浏览器打开',
        openFailedTitle: '无法打开链接',
        openFailedBody: '请复制网址后在浏览器中打开。',
      },
      result: {
        digitalBadge: '抵达前完成',
        digitalTitle: '台湾电子入境卡',
        digitalHighlight: '我们协助完成邮箱验证码与填表步骤，请保留确认邮件以备查验。',
        digitalButton: '启动台湾助手',
      },
    },
    hongkong: {
      info: {
        headerTitle: '香港入境信息',
        title: '香港入境指南',
        subtitle: '中国护照持有人免签停留7天',
        sections: {
          visa: {
            title: '✓ 好消息！免签政策',
            items: [
              '中国护照免签入境香港7天 - 说走就走！',
              '• 无需提前申请签证或注册',
              '• 适用于旅游、商务、探亲等目的',
              '• 停留不超过7天',
              '• 证件说明：护照或港澳通行证均可使用',
            ],
          },
          onsite: {
            title: '⚠️ 入境须知',
            items: [
              '• 返程机票必须出示：没有离境证明将无法通过边检',
              '• 住宿证明需真实有效：酒店预订可能被核实，虚假信息后果严重',
              '• 资金证明可能被抽查：准备不足可能被拒入境或遣返',
              '• 健康申报要求复杂：填写错误或遗漏可能导致入境延误',
              '• 多项材料需准备齐全：护照、机票、住宿、资金证明缺一不可',
            ],
          },
          appFeatures: {
            title: '✨ 入境通帮您轻松搞定',
            items: [
              '• 零焦虑：自动提醒准备所需材料，不用担心遗漏',
              '• 零失误：智能整理返程机票和住宿证明，信息准确无误',
              '• 零操心：一次输入，自动生成完整材料清单',
              '• 健康申报助手：简化健康申报流程，快速完成提交',
            ],
          },
        },
        continueButton: '我已了解，继续确认材料',
      },
      requirements: {
        headerTitle: '香港入境准备清单',
        introTitle: '以下是入境所需准备事项',
        introSubtitle: '这些信息可以先填着，慢慢补全',
        items: {
          validPassport: {
            title: '护照有效期',
            description: '护照有效期至少超过停留期1个月',
            details: '香港要求护照在预定停留期后仍有效。请检查护照有效期，必要时提前更换。',
          },
          returnTicket: {
            title: '返程或续程机票',
            description: '已确认的离港机票预订',
            details: '入境处可能要求查看返程或续程机票证明。请准备好电子机票或预订确认单。',
          },
          accommodation: {
            title: '住宿证明',
            description: '酒店预订或联系人信息',
            details: '携带酒店预订确认单，或香港联系人的详细信息，包括地址和电话号码。',
          },
          sufficientFunds: {
            title: '充足资金',
            description: '现金、信用卡或银行流水',
            details: '可能需要证明有足够资金支付停留期间的费用。准备现金、信用卡或近期银行对账单。',
          },
          healthDeclaration: {
            title: '健康申报',
            description: '根据现行健康规定填写（如有要求）',
            details: '检查是否需要健康申报或新冠相关文件。在抵达前完成所有必需的表格。',
          },
        },
        status: {
          info: {
            title: '随时开始填写',
            subtitle: '我们支持递进式的完成清单',
          },
        },
        startButton: '开始填写',
      },
    },
    malaysia: {
      info: {
        headerTitle: '马来西亚入境信息',
        title: '马来西亚入境指南',
        subtitle: '中国护照持有者免签30天',
        sections: {
          visa: {
            title: '✓ 好消息！免签政策',
            items: [
              '从2023年12月1日起，中国护照免签30天 - 说走就走！',
              '• 无需提前申请签证',
              '• 适用于旅游、探亲、商务等目的',
              '• 新要求：入境需提交MDAC数字入境卡（有提交时间限制）',
            ],
          },
          onsite: {
            title: '⚠️ 入境须知',
            items: [
              '• MDAC有严格时间限制：提前提交会被拒绝，过晚提交来不及',
              '• 时间计算容易出错：需按马来西亚时间计算，时差问题容易导致失误',
              '• PIN码容易丢失：入境时必须出示PIN码，邮件找不到或截图丢失会很麻烦',
              '• 验证码识别困难：字母数字验证码不清晰，输错几次可能被锁定',
              '• 信息准确性要求高：护照、航班、住宿任何错误都可能影响入境',
            ],
          },
          appFeatures: {
            title: '✨ 入境通帮您轻松搞定',
            items: [
              '• 零焦虑：自动追踪行程，在最佳时间提醒您',
              '• 零失误：智能填写MDAC，信息准确无误',
              '• 零操心：一次输入，自动管理整个流程',
              '• PIN码管理：自动保存PIN码和确认邮件，入境时快速出示',
            ],
          },
        },
        continueButton: '我已了解，继续确认材料',
      },
      requirements: {
        headerTitle: 'MDAC准备清单',
        introTitle: '请确认以下事项已经准备好',
        introSubtitle: '这些条件是成功提交马来西亚MDAC的前提',
        items: {
          validPassport: {
            title: '护照有效期',
            description: '护照至少还有6个月有效期并保留空白签证页',
            details: '马来西亚移民局要求护照在入境日起至少剩余6个月有效期，如不足请先更新护照再出行。',
          },
          submissionWindow: {
            title: '3天内申报窗口',
            description: 'MDAC仅接受抵达前3个自然日内的提交',
            details: '以马来西亚时间（GMT+8）计算，自然日0点刷新窗口，过早提交会被系统拒绝，请在窗口开启后再申报。',
          },
          contactableEmail: {
            title: '可用邮箱',
            description: '能够及时接收确认邮件与PIN码',
            details: '使用可在海外登录的邮箱，留意来自imigresen.gov.my的邮件，如未收到请查看垃圾箱并记录PIN码。',
          },
          travelDetails: {
            title: '完整的行程信息',
            description: '准备好航班号、入境口岸、住宿地址与联系电话',
            details: '表单需要填写航空公司、航班号、抵达机场、在马地址、联系电话（含区号）与访问目的，请提前整理好。',
          },
          captchaReady: {
            title: '验证码准备',
            description: '可以手动输入提交前的字母数字验证码',
            details: 'MDAC使用字母数字验证码，如看不清可刷新，提交需在几分钟内完成，避免因超时重新填写。',
          },
        },
        status: {
          success: {
            title: '已完成准备！',
            subtitle: '接下来填写行程信息即可提交MDAC。',
          },
          warning: {
            title: '请先确认所有事项',
            subtitle: '我们支持递进式的完成清单',
          },
          info: {
            title: '随时开始填写',
            subtitle: '我们支持递进式的完成清单',
          },
        },
        startButton: '开始填写',
        continueButton: '继续填写行程信息',
      },
      selection: {
        headerTitle: 'MDAC智能助手',
        headerSubtitle: '选择合适的申报方式',
        recommendedBadge: '推荐',
        smartFlow: {
          title: '⚡ 智能引导',
          subtitle: '结合通关包一步步完成',
          highlights: [
            { title: '预计耗时', value: '8-12分钟' },
            { title: '分步流程', value: '6个步骤' },
            { title: '成功率', value: '98%' },
          ],
          features: [
            '• 自动带出护照与行程信息，减少重复输入',
            '• 提醒输入验证码并记录PIN码',
            '• 引导检查确认邮件是否收到',
          ],
          cta: '开始智能引导 ->',
        },
        webFlow: {
          title: '🌐 MDAC网页',
          subtitle: '在应用内直接打开官网',
          features: [
            '• 原生MDAC网页嵌入，无需切换应用',
            '• 可直接复制粘贴通关包中的信息',
            '• 手动控制每一步，由您亲自提交',
          ],
          cta: '打开内嵌MDAC网页',
        },
        notes: {
          title: '温馨提醒',
          items: [
            '请在抵达前3天内（马来西亚时间）完成申报。',
            '入境时请准备好确认邮件或MDAC PIN码。',
            '多人出行需为每位旅客分别提交MDAC。',
          ],
        },
      },
      guide: {
        headerTitle: 'MDAC引导模式',
        banner: {
          title: '利用通关包自动填写MDAC',
          subtitle: '逐项提醒，不漏填关键信息',
        },
        stepSectionTitle: '操作步骤',
        steps: [
          {
            title: '核对旅客信息',
            subtitle: '填写前先确认护照资料无误',
            details: [
              '确认英文姓名、护照号、国籍、有效期与护照一致。',
              '证件类型选择Passport，国籍选择China / 中国。',
              '填写可接听的联系电话，包含国家区号（例如+86 13800138000）。',
            ],
          },
          {
            title: '填写行程详情',
            subtitle: '使用通关包里的行程数据',
            details: [
              '输入抵达机场与航班号（例如KUL / MH389）。',
              '选择抵达日期并确保在3天窗口内，留意日历选择。',
              '提供酒店名称与地址，或当地接待人的联系方式。',
            ],
          },
          {
            title: '提交并保存PIN码',
            subtitle: '验证码与确认邮件非常重要',
            details: [
              '正确输入字母数字验证码，若看不清可先刷新。',
              '提交成功后记录页面显示的MDAC PIN码。',
              '检查邮箱（含垃圾箱）确认收到邮件，入境时随身携带。',
            ],
          },
        ],
        quickActions: {
          title: '快捷工具',
          items: [
            {
              icon: '📧',
              title: '记录PIN邮件',
              description: '标记所使用的邮箱并确认邮件是否到达。',
            },
            {
              icon: '📍',
              title: '复制住宿信息',
              description: '点击即可复制酒店地址和电话，便于填写。',
            },
            {
              icon: '🔁',
              title: '便捷重新提交',
              description: '行程变动时可复用已保存信息快速再申报。',
            },
          ],
        },
        primaryCta: '打开MDAC网页助手',
        ctaHint: '将在应用内加载MDAC官方网站。',
      },
      webview: {
        headerTitle: 'MDAC网页助手',
        notice: '在此完成马来西亚数字入境卡（MDAC）官方表单，所有数据仅保留在本机。',
        loading: '正在加载MDAC官网...',
        openExternal: '使用浏览器打开',
        openFailedTitle: '无法打开链接',
        openFailedBody: '请复制网址后在浏览器中打开。',
      },
      result: {
        digitalBadge: '抵达前3天提交',
        digitalTitle: '马来西亚数字入境卡（MDAC）',
        digitalHighlight: '我们会根据已保存的护照与行程信息协助提交MDAC，请保管好PIN码邮件。',
        digitalButton: '启动MDAC助手',
      },
    },
    thailand: {
      entryGuide: {
        entryPack: {
          openButton: '打开通关包 📋',
        },
        title: '泰国入境指南（廊曼机场DMK）',
        subtitle: '从TDAC到酒店的完整8步骤流程',
        steps: {
          tdac: {
            title: 'TDAC数字入境卡',
            titleZh: 'TDAC数字入境卡',
            description: '抵达前72小时内提交',
            descriptionZh: '抵达前72小时内提交',
            tips: [
              '准备护照、航班信息、泰国地址',
              '填写英文护照信息',
              '保存QR码到手机相册'
            ],
            tipsZh: [
              '准备护照、航班信息、泰国地址',
              '填写英文护照信息',
              '保存QR码到手机相册'
            ]
          },
          atm: {
            title: 'ATM取泰铢现金',
            titleZh: 'ATM取泰铢现金',
            description: '在机场ATM机取3,000-5,000泰铢',
            descriptionZh: '在机场ATM机取3,000-5,000泰铢',
            banks: [
              'Bangkok Bank（曼谷银行）',
              'Krungsri（泰国大城银行）',
              'Kasikorn Bank（开泰银行）'
            ],
            steps: [
              '找到ATM机（到达大厅1楼）',
              '选择英语界面',
              '输入密码，选择储蓄账户',
              '取款3,000-5,000泰铢',
              '手续费：约220泰铢/次'
            ],
            stepsZh: [
              '找到ATM机（到达大厅1楼）',
              '选择英语界面',
              '输入密码，选择储蓄账户',
              '取款3,000-5,000泰铢',
              '手续费：约220泰铢/次'
            ],
            safety: [
              '注意周边环境安全',
              '保护密码输入安全',
              '不要接受陌生人"帮助"',
              '如ATM吞卡，记下ATM编号联系银行'
            ],
            safetyZh: [
              '注意周边环境安全',
              '保护密码输入安全',
              '不要接受陌生人"帮助"',
              '如ATM吞卡，记下ATM编号联系银行'
            ]
          },
          taxi: {
            title: '官方出租车到酒店',
            titleZh: '官方出租车到酒店',
            description: '使用入境通司机页面显示酒店地址',
            descriptionZh: '使用入境通司机页面显示酒店地址',
            steps: [
              '找官方Public Taxi柜台（6号门或8号门附近）',
              '向工作人员出示入境通"给司机看的页面"',
              '拿到排队号码单',
              '确认司机打表（Meter在跳字）',
              '费用：320-470泰铢（打表+50机场费+高速费）'
            ],
            stepsZh: [
              '找官方Public Taxi柜台（6号门或8号门附近）',
              '向工作人员出示入境通"给司机看的页面"',
              '拿到排队号码单',
              '确认司机打表（Meter在跳字）',
              '费用：320-470泰铢（打表+50机场费+高速费）'
            ],
            payment: [
              '准备小额钞票（100、50、20泰铢）',
              '现金支付（推荐）',
              '需要时索要收据'
            ],
            paymentZh: [
              '准备小额钞票（100、50、20泰铢）',
              '现金支付（推荐）',
              '需要时索要收据'
            ]
          }
        },
        importantNotes: [
          '抵达前72小时内必须提交TDAC',
          'ATM取款手续费约220泰铢，一次多取节省费用',
          '只使用官方Public Taxi，避免黑车',
          '入境通司机页面显示泰文+英文酒店地址'
        ],
        importantNotesZh: [
          '抵达前72小时内必须提交TDAC',
          'ATM取款手续费约220泰铢，一次多取节省费用',
          '只使用官方Public Taxi，避免黑车',
          '入境通司机页面显示泰文+英文酒店地址'
        ],
        entryPackHintOfficial: '护照、TDAC二维码与资金凭证一键展示给移民官。',
        entryPackHintPreview: '查看通关包格式（提交TDAC后可获得完整版）'
      },
      info: {
        headerTitle: '泰国入境信息',
        title: '泰国入境指南',
        subtitle: '中国护照持有者免签60天',
        sections: {
          visa: {
            title: '✓ 好消息！免签政策延长',
            items: [
              '自2024年3月1日起中泰互免签证，7月15日起延长至60天 - 说走就走！',
              '• 无需提前申请签证',
              '• 单次停留最长60天，可在泰国境内申请一次30天延期',
              '• 适用于旅游、探亲、短期商务等非工作目的',
            ],
          },
          onsite: {
            title: '⚠️ 入境须知',
            items: [
              '• 资金证明要求严格：移民官可能抽查现金或银行卡余额，准备不足可能被拒入境',
              '• 返程机票必须出示：没有离境证明将无法通过边检',
              '• 住宿信息需真实有效：酒店预订可能被电话核实，虚假信息后果严重',
              '• 指纹采集和问询：语言障碍可能导致沟通困难，影响入境判断',
              '• 多项材料需准备齐全：护照、机票、住宿、资金证明缺一不可',
            ],
          },
          appFeatures: {
            title: '✨ 入境通帮您轻松搞定',
            items: [
              '• 零焦虑：自动提醒准备所需材料，不用担心遗漏',
              '• 零失误：智能整理资金和住宿证明，信息准确无误',
              '• 零操心：一次输入，自动生成完整材料清单',
              '• 沟通助手：提供常见问题中英文参考，应对边检问询',
            ],
          },
        },
        continueButton: '我了解，继续确认要求',
      },
      requirements: {
        headerTitle: '泰国入境准备清单',
        introTitle: '以下是入境所需准备事项',
        introSubtitle: '这些信息可以先填着，慢慢补全',
        items: {
          validPassport: {
            title: '护照有效期',
            description: '护照有效期至少6个月',
            details: '泰国要求护照在入境时至少还有6个月有效期。请检查护照并必要时提前更换。',
          },
          onwardTicket: {
            title: '返程或续程机票',
            description: '已确认的离泰机票或续程证明',
            details: '移民官可能要求查看返程或前往第三国的机票。请准备好电子机票或预订确认单。',
          },
          accommodation: {
            title: '住宿证明',
            description: '酒店预订或泰国的详细地址',
            details: '携带酒店预订确认单，或朋友/亲戚在泰国的详细联系信息，包括地址和电话。',
          },
          funds: {
            title: '充足资金',
            description: '现金、信用卡或银行流水（至少1万泰铢/人或2万泰铢/家庭）',
            details: '移民官可能随机检查资金证明。建议准备现金、信用卡或近期银行对账单。',
          },
          healthCheck: {
            title: '健康申报',
            description: '根据现行健康规定填写（如有要求）',
            details: '检查是否需要健康申报或新冠相关文件。在抵达前完成所有必需的表格。',
          },
        },
        status: {
          info: {
            title: '随时开始填写',
            subtitle: '我们支持递进式的完成清单',
          },
        },
        startButton: '开始填写',
      },
      travelInfo: {
        headerTitle: '泰国入境信息',
        title: '填写泰国入境信息',
        subtitle: '请提供以下信息以完成入境卡生成',
        privacyNotice: '所有信息仅保存在您的手机本地',
        loading: '正在加载数据...',
        submitEntry: '准备入境包',
        viewStatus: '查看准备状态',
        readyToSubmit: '准备提交',
        completionProgress: '已完成 {{percent}}%',
        completionHint: '完成所有信息后可提交入境卡。',
        sections: {
          passport: '护照信息',
          personal: '个人信息',
          funds: '资金证明',
          travel: '行程信息',
          accommodation: '住宿信息',
          emergency: '紧急联系人',
        },
        scan: {
          ticketTitle: '扫描机票',
          ticketMessage: '请选择机票图片来源',
          hotelTitle: '扫描酒店预订',
          hotelMessage: '请选择酒店预订确认单图片来源',
          takePhoto: '拍照',
          fromLibrary: '从相册选择',
          permissionTitle: '需要权限',
          cameraPermissionMessage: '需要相机权限来拍照扫描文档',
          libraryPermissionMessage: '需要相册权限来选择图片',
          successTitle: '扫描成功',
          ticketSuccess: '机票信息已提取并填入表单',
          hotelSuccess: '酒店信息已提取并填入表单',
          ocrFailTitle: '识别失败',
          ocrFailMessage: '无法从图片中提取信息，请检查图片清晰度或手动输入',
          retryButton: '重试',
          manualButton: '手动输入',
          errorTitle: '扫描失败',
          errorMessage: '扫描过程中出现错误，请重试',
          flightChoiceTitle: '选择航班',
          flightChoiceMessage: '检测到航班号 {flightNumber}，请选择要更新的航班信息',
          arrivalFlight: '入境航班',
          departureFlight: '离境航班',
        },
        photo: {
          choose: '选择照片',
          takePhoto: '拍照',
          fromLibrary: '从相册选择',
          cancel: '取消',
          cameraPermission: '需要相机权限',
          cameraPermissionMessage: '请在设置中允许访问相机',
          libraryPermission: '需要相册权限',
          libraryPermissionMessage: '请在设置中允许访问相册',
          cameraError: '相机错误',
          cameraErrorMessage: '模拟器不支持相机功能，请使用真机测试或选择相册照片',
          chooseFailed: '选择照片失败',
          chooseFailedMessage: '请重试',
        },
        lastEdited: '最近编辑',
        sectionTitles: {
          passport: '护照信息',
          passportSubtitle: '泰国海关需要核实你的身份',
          personal: '个人信息',
          personalSubtitle: '让泰国更了解你',
          funds: '资金证明',
          fundsSubtitle: '展示你的经济能力',
          travel: '旅行信息',
          travelSubtitle: '你的泰国行程',
        },
        sectionIntros: {
          passport: '🛂 海关官员会核对你的护照信息，请确保与护照完全一致。别担心，我们会帮你格式化！',
          personal: '👤 这些信息帮助泰国了解你的背景，如有需要可以联系你。',
          funds: '💰 展示你的经济能力，证明可以支持泰国之旅。',
          travel: '✈️ 告诉泰国你的旅行计划，让他们为你准备好热情的欢迎。',
        },
        fields: {
          fullName: {
            label: '姓名',
            help: '请填写汉语拼音（例如：LI, MAO）- 不要输入中文字符',
          },
          passportName: {
            label: '护照上的姓名',
            help: '填写护照上显示的英文姓名，例如：LI, MAO（姓在前，名在后）',
          },
          surname: {
            label: '姓',
            help: '填写护照上显示的姓（英文）',
          },
          middleName: {
            label: '中间名',
            help: '如有（可选）',
          },
          givenName: {
            label: '名',
            help: '填写护照上显示的名（英文）',
          },
          nationality: {
            label: '国籍',
            help: '请选择您的国籍',
          },
          passportNo: {
            label: '护照号码',
            help: '护照号码通常是8-9位字母和数字的组合，输入时会自动转大写',
          },
          visaNumber: {
            label: '签证号（如有）',
            help: '如有签证，请填写签证号码（仅限字母或数字）',
          },
          dob: {
            label: '出生日期',
            help: '格式: YYYY-MM-DD',
          },
          expiryDate: {
            label: '护照有效期',
            help: '格式: YYYY-MM-DD',
          },
          sex: {
            label: '性别',
            options: {
              female: '女性',
              male: '男性',
              undefined: '未定义',
            },
          },
          occupation: {
            label: '职业',
            help: '请输入您的职业 (请使用英文)',
          },
          cityOfResidence: {
            label: '居住城市',
            help: '请输入您居住的城市 (请使用英文)',
          },
          residentCountry: {
            label: '居住国家',
            help: '请选择您居住的国家',
          },
          phoneCode: {
            label: '国家代码',
          },
          phoneNumber: {
            label: '电话号码',
            help: '请输入您的电话号码',
          },
          email: {
            label: '电子邮箱',
            help: '请输入您的电子邮箱地址',
          },
          arrivalDate: {
            label: '抵达日期',
            help: '格式: YYYY-MM-DD',
          },
          flightNumber: {
            label: '航班号',
            help: '请输入您的航班号',
          },
          departureCity: {
            label: '出发城市',
            help: '请输入您的出发城市 (请使用英文)',
          },
          purposeOfVisit: {
            label: '访问目的',
            help: '请选择您的访问目的',
            options: {
              tourism: '旅游',
              business: '商务',
              family: '探亲',
              medical: '医疗',
              other: '其他',
            },
          },
          hotelName: {
            label: '酒店名称',
            help: '请输入您的酒店名称 (请使用英文)',
          },
          hotelAddress: {
            label: '酒店地址',
            help: '请输入您的酒店地址 (请使用英文)',
          },
          hotelPhone: {
            label: '酒店电话',
            help: '请输入您的酒店电话号码',
          },
          emergencyName: {
            label: '紧急联系人姓名',
            help: '请输入紧急联系人姓名 (请使用英文)',
          },
          emergencyPhone: {
            label: '紧急联系人电话',
            help: '请输入紧急联系人电话号码',
          },
          emergencyRelationship: {
            label: '关系',
            help: '请输入关系 (请使用英文)',
          },
        },
        photo: {
          choose: '选择照片',
          takePhoto: '拍照',
          fromLibrary: '从相册选择',
          cancel: '取消',
          cameraPermission: '需要相机权限',
          cameraPermissionMessage: '请在设置中允许访问相机',
          cameraError: '相机错误',
          cameraErrorMessage: '模拟器不支持相机功能，请使用真机测试或选择相册照片',
          libraryPermission: '需要相册权限',
          libraryPermissionMessage: '请在设置中允许访问相册',
          chooseFailed: '选择照片失败',
          chooseFailedMessage: '请重试',
        },
        continueButton: '继续',
      },
      tdacWebView: {
        errorBoundary: {
          title: '出错了',
          message: '发生了意外错误，请重试。',
          tryAgain: '重试',
          close: '关闭',
        },
        qrCodeHandler: {
          permissionTitle: '需要相册权限',
          permissionMessage: '请在设置中允许访问相册',
          savingQR: '开始保存QR码...',
          savedToApp: 'QR码已保存到App',
          savedToAlbum: 'QR码已保存到相册',
          tempFileCleanedSuccess: '临时文件已清理',
          tempFileCleanedError: '临时文件已清理（错误路径）',
          tempFileCleanupFailed: '错误路径文件清理失败',
          saveAlbumFailed: '保存到相册失败',
          entryInfoUpdated: 'Entry info updated successfully via WebView',
          entryInfoUpdateFailed: '无法更新入境信息',
          recentSubmissionFlagSet: 'Recent submission flag set for EntryPackService',
          qrSavedSuccess: {
            title: '🎉 QR码已保存！',
            message: 'QR码已保存到:\n1. App内（可在"我的旅程"查看）\n2. 手机相册\n\n入境时向海关出示即可！',
            viewQR: '查看QR码',
            ok: '好的',
          },
          saveFailed: {
            title: '保存失败',
            message: '无法保存QR码，请截图保存',
          },
        },
        helperModal: {
          title: '复制助手',
          close: '✕ 关闭',
          instruction: '点击⚡尝试自动填充网页，失败则点"复制"手动粘贴',
          sections: {
            personal: 'Personal Information',
            trip: 'Trip & Accommodation',
            accommodation: 'Accommodation',
          },
          healthDeclaration: {
            title: 'Step 4: Health Declaration',
            note: '健康声明部分请根据实际情况在网页中选择 Yes 或 No',
          },
          tips: {
            title: '💡 完成后记得：',
            items: '• 提交后会收到确认邮件\n• 邮件中包含QR码\n• 截图保存QR码\n• 入境时出示QR码和护照',
          },
        },
        qrCodeModal: {
          title: '🎫 TDAC 入境卡',
          close: '✕',
          hint: '向海关出示此QR码即可快速入境',
          subHint: 'Show this QR code to immigration',
          nameLabel: '姓名 Name:',
          passportLabel: '护照号 Passport:',
          savedTimeLabel: '保存时间 Saved:',
          saveAgain: '📷 再次保存到相册',
        },
        dataComparisonModal: {
          title: '🔍 Data Comparison',
          subtitle: 'Entry Info vs TDAC Submission',
          close: '✕ Close',
          summary: {
            title: '📊 Summary',
            totalFields: 'Total Fields:',
            validMappings: 'Valid Mappings:',
            overallStatus: 'Overall Status:',
            valid: '✅ VALID',
            issues: '❌ ISSUES',
          },
          fieldMappings: {
            title: '🔄 Field Mappings',
            source: 'Source:',
            original: 'Original:',
            tdac: 'TDAC:',
            transform: 'Transform:',
            statusMapped: '✅',
            statusTransformed: '🔄',
            statusError: '❌',
          },
          payload: {
            title: '📋 Complete TDAC Payload',
          },
          actions: {
            refresh: '🔄 Refresh Comparison',
            export: '📋 Export Data',
            exported: '✅ Exported',
            exportedMessage: 'Comparison data copied to clipboard',
          },
        },
      },

      // TDACSelectionScreen 中文翻译
      selection: {
        heroEmoji: '🌟',
        heroTitle: '选择提交方式',
        heroSubtitle: '快速完成泰国入境卡',
        backButton: '返回',
        lightning: {
          badge: '推荐选择',
          badgeIcon: '📱',
          icon: '⚡',
          title: '闪电提交',
          subtitle: '快速通道 · 智能验证',
          benefits: {
            time: { icon: '⏱️', value: '5-8秒', label: '闪电完成' },
            success: { icon: '🎯', value: '95%+', label: '超高成功率' },
            speed: { icon: '🚀', value: '快3倍', label: '比传统方式' }
          },
          summary: '节省排队时间，提交后即可获得确认。',
          cta: '使用闪电提交'
        },
        stable: {
          icon: '🛡️',
          title: '稳妥提交',
          subtitle: '稳定通道 · 清晰可见',
          benefits: {
            time: { icon: '⏱️', value: '24秒', label: '稳定完成' },
            success: { icon: '🎯', value: '85%', label: '可靠成功率' }
          },
          summary: '适合想亲自查看每一步的旅客。',
          cta: '选择稳妥方案'
        },
        smartTip: {
          icon: '💡',
          title: '智能推荐',
          text: '推荐闪电提交；如需完整流程，可随时切换稳妥方案。'
        },
        footer: {
          text: '我们会陪您完成整个流程，确保顺利提交。'
        }
      },

      // ThailandEntryQuestionsScreen 中文翻译
      entryQuestions: {
        topBarTitle: '入境问题',
        header: {
          title: 'ชุดคำถาม-คำตอบสำหรับเจ้าหน้าที่',
          subtitle: 'Immigration Questions & Answers',
          subtitleZh: '入境常见问题及答案',
          description: '📋 基于您的旅行信息预填的常见入境问题答案，可向移民官员展示'
        },
        languageSelector: { label: '语言 / Language:', zh: '中文', en: 'English', th: 'ไทย' },
        filter: { showRequired: '仅显示必填问题', showAll: '显示全部问题', count: '({{count}} 个问题)' },
        question: { required: '必填', answerLabel: '答案 / Answer:', tipsLabel: '💡 提示:', suggestedLabel: '其他可选答案:' },
        footer: {
          icon: 'ℹ️',
          infoText: '这些答案基于您提交的入境信息自动生成。如移民官提出其他问题，请如实回答。',
          instructionsTitle: '使用说明：',
          instruction1: '1. 向移民官展示此页面作为参考',
          instruction2: '2. 可切换语言以便沟通',
          instruction3: '3. 必填问题已用徽章标记'
        },
        empty: { icon: '📭', text: '暂无可显示的问题', hint: '请确保您的入境信息已完整填写' },
        loading: '加载入境问题...',
        errors: { missingEntryPack: '缺少入境包信息', loadFailed: '加载入境问题失败，请稍后重试' }
      },

      // TravelInfoScreen 补充翻译
      travelInfoEnhanced: {
        sectionIntros: {
          passport: { icon: '🛂', text: '海关官员会核对你的护照信息，请确保与护照完全一致。别担心，我们会帮你格式化！' },
          personal: { icon: '👤', text: '这些信息帮助泰国了解你的背景，如有需要可以联系你。' },
          funds: { icon: '💰', text: '展示你的经济能力，证明可以支持泰国之旅。' },
          travel: { icon: '✈️', text: '告诉泰国你的旅行计划，让他们为你准备好热情的欢迎。' }
        },
        saveStatus: { pending: '等待保存...', saving: '正在保存...', saved: '已保存', error: '保存失败', retry: '重试' },
        lastEdited: '最近编辑：{{time}}',
        progress: {
          ready: '泰国准备就绪！🌴',
          completion: '完成度 {{percent}}%',
          hints: {
            start: '🌟 第一步，从介绍自己开始吧！',
            early: '好的开始！泰国欢迎你 🌺',
            mid: '继续我的泰国准备之旅 🏖️',
            late: '🚀 快要完成了，你的泰国之旅近在咫尺！'
          },
          nextSteps: {
            passport: '💡 从护照信息开始，告诉泰国你是谁',
            personal: '👤 填写个人信息，让泰国更了解你',
            funds: '💰 展示你的资金证明，泰国想确保你玩得开心',
            travel: '✈️ 最后一步，分享你的旅行计划吧！'
          }
        }
      },

      // 常量翻译
      occupations: {
        SOFTWARE_ENGINEER: '软件工程师', STUDENT: '学生', TEACHER: '教师', DOCTOR: '医生',
        ACCOUNTANT: '会计师', SALES_MANAGER: '销售经理', RETIRED: '退休人员', ENGINEER: '工程师',
        CIVIL_SERVANT: '公务员', LAWYER: '律师', NURSE: '护士', FREELANCER: '自由职业者',
        BUSINESS_OWNER: '企业主', HOMEMAKER: '家庭主妇', DESIGNER: '设计师', OTHER: '其他'
      },
      travelPurposes: {
        HOLIDAY: '度假/旅游', MEETING: '会议', SPORTS: '体育', BUSINESS: '商务',
        INCENTIVE: '奖励旅游', CONVENTION: '会展/大会', EDUCATION: '教育',
        EMPLOYMENT: '就业', EXHIBITION: '展览', MEDICAL: '医疗'
      },
      accommodationTypes: {
        HOTEL: '酒店', HOSTEL: '青年旅舍', GUESTHOUSE: '民宿',
        RESORT: '度假村', APARTMENT: '公寓', FRIEND: '朋友家'
      },

      // 表单验证错误信息
      validation: {
        // 必填字段错误
        required: {
          passportNo: '护照号码为必填项',
          surname: '姓氏为必填项',
          givenName: '名字为必填项',
          nationality: '国籍为必填项',
          dob: '出生日期为必填项',
          expiryDate: '护照有效期为必填项',
          sex: '性别为必填项',
          occupation: '职业为必填项',
          cityOfResidence: '居住城市为必填项',
          residentCountry: '常住国家为必填项',
          phoneNumber: '手机号码为必填项',
          email: '电子邮箱为必填项',
          travelPurpose: '旅行目的为必填项',
          arrivalDate: '到达日期为必填项',
          departureDate: '离境日期为必填项',
          arrivalFlightNumber: '入境航班号为必填项',
          departureFlightNumber: '离境航班号为必填项',
          accommodationType: '住宿类型为必填项',
          province: '省份为必填项',
          district: '区/县为必填项',
          subDistrict: '街道/镇为必填项',
          postalCode: '邮政编码为必填项',
          hotelAddress: '酒店/住宿地址为必填项',
          recentStayCountry: '最近停留国家为必填项',
          boardingCountry: '登机国家为必填项',
        },

        // 格式验证错误
        format: {
          passportNo: '护照号码格式无效（通常为8-9位字母数字组合）',
          email: '电子邮箱格式无效（例如：example@email.com）',
          phoneNumber: '手机号码格式无效（8-15位数字）',
          phoneCode: '电话区号格式无效（例如：+86、+1）',
          postalCode: '邮政编码格式无效',
          flightNumber: '航班号格式无效（例如：TG123、CZ456）',
          uppercaseRequired: '必须使用大写字母',
          alphanumericOnly: '只允许字母和数字',
          numbersOnly: '只允许数字',
        },

        // 长度验证错误
        length: {
          passportNoTooShort: '护照号码太短（最少{{min}}位）',
          passportNoTooLong: '护照号码太长（最多{{max}}位）',
          phoneNumberTooShort: '手机号码太短（最少{{min}}位）',
          phoneNumberTooLong: '手机号码太长（最多{{max}}位）',
          nameTooShort: '姓名太短（最少{{min}}位）',
          nameTooLong: '姓名太长（最多{{max}}位）',
          textTooLong: '文本超过最大长度{{max}}个字符',
        },

        // 日期验证错误
        date: {
          invalid: '日期格式无效',
          pastRequired: '日期必须是过去的日期',
          futureRequired: '日期必须是未来的日期',
          passportExpired: '护照已过期',
          passportExpiringSoon: '护照将在6个月内过期 - 可能被移民局拒绝',
          dobTooRecent: '出生日期太近（必须至少{{minAge}}岁）',
          dobTooOld: '出生日期似乎不合理（请检查）',
          arrivalBeforeDeparture: '到达日期必须在离境日期之前',
          departureBeforeArrival: '离境日期必须在到达日期之后',
          arrivalTooFar: '到达日期太遥远（最多{{maxDays}}天）',
          arrivalTooSoon: '到达日期太接近（最少距离{{minHours}}小时）',
          stayTooLong: '停留时长超过免签限制（{{maxDays}}天）',
        },

        // 特定字段警告（非关键）
        warning: {
          nameNotUppercase: '姓名应使用护照上显示的大写字母',
          nameMismatch: '姓名格式可能与护照不符 - 请核实',
          passportExpiringWithin6Months: '护照将在{{months}}个月后过期 - 部分国家要求6个月以上有效期',
          emailUncommon: '电子邮箱格式不常见 - 请核实',
          phoneNumberShort: '手机号码似乎太短 - 请核实',
          occupationOther: '您选择了"其他" - 请在自定义字段中输入您的职业',
          cityNotRecognized: '城市无法识别 - 请核实拼写',
          missingFlightPhoto: '未上传机票照片 - 建议上传以加快处理',
          missingHotelPhoto: '未上传酒店预订照片 - 建议上传以便核实',
          transitPassenger: '您已标记为过境旅客 - 住宿详情可能不需要填写',
        },

        // 照片上传错误
        photo: {
          uploadFailed: '照片上传失败 - 请重试',
          invalidFormat: '照片格式无效 - 请使用JPG、PNG或PDF',
          fileTooLarge: '照片文件太大（最大{{maxSize}}MB）',
          permissionDenied: '相机/相册权限被拒绝 - 请在设置中启用',
          cameraNotAvailable: '此设备无相机功能',
          processingFailed: '照片处理失败 - 请尝试其他照片',
        },

        // 地理位置级联错误
        location: {
          provinceRequired: '请先选择省份',
          districtRequired: '请选择区/县',
          subDistrictRequired: '请选择街道/镇',
          invalidProvince: '所选省份无效',
          invalidDistrict: '所选区/县对该省份无效',
          invalidSubDistrict: '所选街道/镇对该区/县无效',
          loadingFailed: '加载地理位置数据失败 - 请重试',
        },

        // 网络/保存错误
        save: {
          failed: '保存数据失败 - 请检查网络连接',
          retrying: '正在重试保存...（{{attempt}}/{{max}}）',
          offline: '您处于离线状态 - 数据将在连接恢复后保存',
          conflict: '检测到数据冲突 - 请刷新后重试',
          timeout: '保存超时 - 请检查互联网连接',
        },

        // TDAC提交错误
        submission: {
          missingRequiredFields: '请在提交前完成所有必填字段',
          invalidData: '部分数据无效 - 请检查高亮显示的字段',
          networkError: '网络错误 - 请检查连接后重试',
          serverError: '服务器错误 - 请稍后重试',
          cloudflareTimeout: 'Cloudflare验证超时 - 请重试',
          submissionWindowClosed: '提交窗口已关闭 - 请联系客服',
          submissionWindowNotOpen: '提交窗口尚未开启 - 请等待至{{openTime}}',
          duplicateSubmission: '此入境信息已提交过',
          rateLimitExceeded: '尝试次数过多 - 请等待{{minutes}}分钟',
        },
      },
    },
    result: {
      title: '{{flag}} {{country}}入境包已准备好',
      subtitle: '所有资料已整理，随时可在机场出示',
      entryPack: {
        title: '基本信息',
        subtitle: '{{subtitle}}',
        share: '分享',
        fields: {
          traveler: '姓名',
          passportNo: '护照',
          flightNo: '航班',
          departureDate: '出发',
          arrivalDate: '到达',
          accommodation: '酒店',
        },
        notFilled: '未填写',
        toBeConfirmed: '待确认',
        actions: {
          startGuide: '启动入境指南',
          editInfo: '更改资料',
        },
        lastUpdated: '最后更新：{{time}}',
        subtitleParts: {
          departure: '出发 {{date}}',
          arrival: '到达 {{date}}',
          flight: '航班 {{flight}}',
          missing: '请补齐行程信息',
        },
        official: {
          title: '✅ 正式通关包',
          message: '此通关包包含真实的TDAC二维码和PDF文档，可直接展示给泰国移民官。',
        },
      },
      historyBanner: {
        badge: '待入境旅程',
        status: '已自动保存',
        description: '信息已留存在入境包中，可随时修改或分享给亲友复核。',
        primaryCta: {
          title: '开始入境指引',
          subtitle: '逐步引导 · 大字显示',
        },
        secondaryCta: {
          shareFamily: '分享',
          editInfo: '编辑',
        },
        footer: {
          title: '🛃 最后一环：向海关出示通关包',
          note: '抄写模式只是整个流程中的一步，落地后按指引逐步完成即可。',
        },
      },
      digitalInfo: {
        title: '需要在线申请 {{systemName}}',
        button: '前往申请',
        autoFill: '⚡ 自动填写',
      },
      checkSection: {
        title: '需要检查信息？',
        viewForm: {
          title: '查看完整表格',
          subtitle: '已填写 {{count}} 项信息',
        },
        qaGuide: {
          title: '海关问答参考',
          subtitle: '{{count}}个常见问题',
        },
      },
      footer: '完成！返回首页',
      infoBox: '已自动保存到「历史记录」，随时可以查看',
      errors: {
        pdfFailed: '无法生成PDF',
        downloadFailed: '下载失败',
        shareFailed: '分享失败',
        shareUnavailable: '该设备不支持分享功能',
        printFailed: '打印失败',
      },
    },
    profile: {
      header: '我的',
      user: {
        phone: '电话：{{phone}}',
      },
      common: {
        notFilled: '未填写',
      },
      personal: {
        title: '个人信息',
        subtitle: '更新边检所需信息',
        collapsedHint: '点击展开个人信息',
        fields: {
          dateOfBirth: {
            title: '出生日期',
            subtitle: '出生日期',
            placeholder: 'YYYY-MM-DD',
          },
          gender: {
            title: '性别',
            subtitle: '性别',
            placeholder: '男 / 女',
          },
          occupation: {
            title: '职业',
            subtitle: '职业',
            placeholder: '职业',
          },
          provinceCity: {
            title: '城市 / 省份',
            subtitle: '居住的省份或城市',
            placeholder: '省份 / 城市',
          },
          countryRegion: {
            title: '国家 / 地区',
            subtitle: '国家 / 地区',
            placeholder: '选择您的国家/地区',
          },
          phone: {
            title: '电话号码',
            subtitle: '电话',
            placeholder: '+86 123456789',
          },
          email: {
            title: '电子邮箱',
            subtitle: '邮箱',
            placeholder: 'your@email.com',
          },
        },
      },
      funding: {
        title: '资金证明清单',
        subtitle: '在入境时快速出示',
        collapsedHint: '点击查看资金证明清单',
        tip: {
          title: '资金充足',
          subtitle: '每人至少携带等值 10,000 THB 或等效证明',
          description:
            '移民官可能检查现金或银行余额。请准备截图或账单，并列出现金、银行卡及余额以便快速核验。',
        },
        footerNote: '信息会同步到入境包以便检查。',
        actions: {
          scanProof: '扫描/上传资金证明',
        },
        fields: {
          cashAmount: {
            title: '随身现金',
            placeholder: '例如：10000 THB 现金 + 500 USD',
            sample: '等值 10000 THB 现金（约 ¥2000）',
          },
          bankCards: {
            title: '银行卡及余额',
            placeholder: '例如：\n招商 Visa(****1234) · 余额 20,000 CNY',
            sample:
              '招商 Visa(****1234) · 余额 20,000 CNY\n工行 借记(****8899) · 余额 15,000 CNY',
          },
          supportingDocs: {
            title: '证明文件',
            placeholder: '例如：App 截图、PDF 账单、银行证明',
            sample: '保存银行 App 截图及近期账单',
          },
        },
      },
      passport: {
        title: '我的护照',
        subtitle: '{{passportNo}} · 有效期至 {{expiry}}',
        collapsedHint: '点击展开详情',
        updateButton: '更新',
        fields: {
          passportNo: '护照号码',
          nationality: '国籍',
          expiry: '有效期',
          issueDate: '签发日期',
          issuePlace: '签发地',
        },
      },
      vip: {
        title: '升级到高级版',
        subtitle: '无限生成，优先处理',
        upgradeButton: '立即升级',
      },
      sections: { myServices: '我的服务', settings: '设置与帮助' },
      menu: {
        documents: { title: '我的文件', badge: '({{count}})' },
        history: { title: '历史记录', badge: '({{count}})' },
        backup: {
          title: '云备份',
          subtitle: '最近：{{time}}',
          defaultTime: '今天',
        },
        language: {
          title: '语言',
          subtitle: '当前：{{language}}',
        },
        settings: { title: '设置' },
        help: { title: '帮助中心' },
        about: { title: '关于' },
        notifications: { title: '通知' },
        notificationLogs: { title: '通知日志', subtitle: '查看通知历史与分析' },
        exportData: { title: '导出我的数据', subtitle: '下载入境包数据为 JSON' },
      },
      editModal: {
        save: '保存',
      },
      logout: '退出登录',
      version: '版本 {{version}}',
    },
    generating: {
      title: 'Traitement',
      message: 'L\'IA génère votre pack',
      estimate: 'Environ {{seconds}} secondes...',
      stepsTitle: 'En cours:',
      steps: { verifyDocument: 'Vérification document', checkExpiry: 'Vérification validité', generateForm: 'Génération formulaire {{country}}', generateQA: 'Génération Q&R douane', translate: 'Traduction' },
      errors: { title: 'Échec génération', message: 'Réessayer plus tard', retry: 'Réessayer', goBack: 'Retour' },
    },
    funds: {
      noInfoAvailable: '没有可用的资金信息',
      cash: '现金',
    },
    photos: {
      fundProof: {
        title: '资金证明照片',
        tapToViewLargerImage: '点击查看大图',
      },
    },
    notifications: {
      testingTools: {
        title: '通知测试工具',
        developmentOnly: '仅限开发模式',
      },
      sections: {
        test: '测试通知',
        actions: '操作',
        scheduled: '已安排的通知（{{count}}）',
      },
      stats: {
        title: '通知统计',
        empty: '暂无已安排通知',
      },
      actions: {
        viewLogs: '查看通知日志',
        cancelAll: '取消所有通知',
      },
    },
    notificationLog: {
      header: {
        title: '通知日志',
        back: '返回',
        filter: '筛选',
      },
      tabs: {
        logs: '日志（{{count}}）',
        analytics: '分析',
        performance: '工具',
      },
      empty: {
        title: '未找到通知日志',
        subtitle: '当通知被发送并产生互动时，这里会显示日志',
      },
      analytics: {
        overall: {
          title: '总体统计',
          clickRate: '点击率',
          scheduled: '已安排',
          sent: '已发送',
          clicked: '已点击',
        },
        byType: '按通知类型',
        timing: {
          title: '最佳时机',
          bestHour: '最佳小时',
          bestDay: '最佳日期',
          noData: '无数据',
        },
      },
      filterModal: {
        title: '筛选日志',
        cancel: '取消',
        clear: '清除',
        apply: '应用筛选',
        labels: {
          eventType: '事件类型',
          notificationType: '通知类型',
          entryPackId: '入境信息包 ID',
          eventTypePlaceholder: '例如：已安排、已点击、已互动',
          notificationTypePlaceholder: '例如：提交窗口、紧急提醒',
          entryPackIdPlaceholder: '入境信息包标识符',
        },
      },
      performance: {
        title: '性能洞察',
        viewRecommendations: '查看建议',
        exportLogs: '导出日志',
        clearOldLogs: '清除旧日志（30+ 天）',
        clearAllLogs: '清除所有日志',
      },
    },
    gdpr: {
      export: {
        exported: {
          title: '导出完成',
          share: '分享文件',
        },
      },
      deletion: {
        dataItem: {
          willDelete: '将被删除',
          noData: '无数据',
        },
        consequences: {
          accountDeactivated: '您的账户将被停用',
        },
      },
    },
    dest: {
      hongkong: {
        hdac: {
          selection: {
            aiValue: 'AI',
          },
        },
      },
      korea: {
        preview: {
          headerTitle: '入境信息包预览',
          previewMode: '预览模式',
          description: '这是您的入境信息包的预览。申请 K-ETA 后将包含完整的入境详情。',
          continue: '继续更新信息',
          applyKETA: '申请 K-ETA',
          ketaInfoTitle: 'K-ETA 电子旅行许可',
        },
      },
      usa: {
        entryGuide: {
          title: '美国入境指引',
          titleZh: '美国入境指引',
        },
      },
      hongkong: { entryGuide: { title: '香港入境指引', titleZh: '香港入境指引' } },
      singapore: { entryGuide: { title: '新加坡入境指引', titleZh: '新加坡入境指引' } },
      malaysia: { entryGuide: { title: '马来西亚入境指引', titleZh: '马来西亚入境指引' } },
      japan: { entryGuide: { title: '日本入境指引', titleZh: '日本入境指引' } },
      thailand: { entryGuide: { title: '泰国入境指引 (TDAC)', titleZh: '泰国入境指引 (TDAC)' } },
      vietnam: { entryGuide: { title: '越南入境指引', titleZh: '越南入境指引' } },
    },
    tdac: {
      files: {
        loading: '正在加载已保存的文件...',
        empty: {
          pdfs: '未找到已保存的 PDF',
          qr: '未找到已保存的二维码',
        },
      },
    },
    screenTitles: {
      tdacFiles: '已保存的 TDAC 文件',
    },
  },
};

// Generate Traditional Chinese variants from Simplified Chinese
const generateTraditionalChineseTranslations = () => {
  const traditionalBase = convertToTraditional(baseTranslations.zh, 'zh-TW');
  const traditionalCountries = countryTranslations['zh-TW'];
  return deepMergeTranslations(traditionalBase, traditionalCountries);
};

// Create final translations object with pre-computed Traditional Chinese
export const translations = {
  ...baseTranslations,
  'zh-CN': baseTranslations.zh,
  'zh-TW': generateTraditionalChineseTranslations(),
  fr: {
    common: {
      buttons: { cancel: 'Annuler', share: 'Partager' },
      back: 'Retour',
      confirm: 'Confirmer',
      delete: 'Supprimer',
      error: 'Erreur',
      images: { tapToEnlarge: "Appuyer pour agrandir" },
      reader: { font: { decrease: 'A-', increase: 'A+' } },
    },
    funds: { noInfoAvailable: 'Aucune information sur les fonds disponible', cash: 'Espèces' },
    photos: { fundProof: { title: 'Photo de preuve des fonds', tapToViewLargerImage: "Appuyer pour voir l’image en grand" } },
    notifications: {
      testingTools: { title: 'Outils de test de notifications', developmentOnly: 'Mode développement uniquement' },
      sections: { test: 'Tester les notifications', actions: 'Actions', scheduled: 'Notifications programmées ({{count}})' },
      stats: { title: 'Statistiques des notifications', empty: 'Aucune notification programmée' },
      actions: { viewLogs: 'Voir les journaux de notification', cancelAll: 'Annuler toutes les notifications' },
    },
    notificationLog: {
      header: { title: 'Journaux des notifications', back: 'Retour', filter: 'Filtrer' },
      tabs: { logs: 'Journaux ({{count}})', analytics: 'Analyses', performance: 'Outils' },
      empty: { title: 'Aucun journal de notification trouvé', subtitle: 'Les journaux apparaîtront ici lorsque des notifications sont envoyées et utilisées' },
      analytics: {
        overall: { title: 'Statistiques globales', clickRate: 'Taux de clics', scheduled: 'Programmées', sent: 'Envoyées', clicked: 'Cliquées' },
        byType: 'Par type de notification',
        timing: { title: 'Moment optimal', bestHour: 'Heure optimale', bestDay: 'Jour optimal', noData: 'Aucune donnée' },
      },
      filterModal: {
        title: 'Filtrer les journaux', cancel: 'Annuler', clear: 'Effacer', apply: 'Appliquer les filtres',
        labels: {
          eventType: "Type d’événement",
          notificationType: 'Type de notification',
          entryPackId: "Identifiant du pack d’entrée",
          eventTypePlaceholder: 'p.ex., programmées, cliquées, interagies',
          notificationTypePlaceholder: 'p.ex., fenêtre de dépôt, rappel urgent',
          entryPackIdPlaceholder: "Identifiant du pack d’entrée",
        },
      },
      performance: { title: 'Analyses de performance', viewRecommendations: 'Voir les recommandations', exportLogs: 'Exporter les journaux', clearOldLogs: 'Effacer les anciens journaux (30+ jours)', clearAllLogs: 'Effacer tous les journaux' },
    },
    gdpr: { export: { exported: { title: 'Export terminé', share: 'Partager le fichier' } }, deletion: { dataItem: { willDelete: 'Sera supprimé', noData: 'Aucune donnée' }, consequences: { accountDeactivated: 'Votre compte sera désactivé' } } },
    dest: {
      hongkong: { hdac: { selection: { aiValue: 'AI' } } },
      korea: { preview: { headerTitle: "Aperçu du pack d’entrée", previewMode: 'Mode aperçu', description: "Ceci est un aperçu de votre pack d’entrée. Après la demande de K‑ETA, il inclura tous les détails d’entrée.", continue: 'Continuer à mettre à jour les informations', applyKETA: 'Demander le K‑ETA', ketaInfoTitle: "Autorisation de voyage électronique K‑ETA" } },
      usa: { entryGuide: { title: 'US Entry Guide' } },
    },
  tdac: { files: { loading: 'Chargement des fichiers enregistrés...', empty: { pdfs: 'Aucun PDF enregistré trouvé', qr: 'Aucun QR code enregistré trouvé' } } },
  screenTitles: { tdacFiles: 'Fichiers TDAC enregistrés' },
    tabs: { home: 'Accueil', history: 'Archive', profile: 'Profil' },
  profile: {
      header: 'Profil',
      user: { defaultName: 'Utilisateur invité', phone: 'Tél: {{phone}}' },
      sections: { myServices: 'Mes services', settings: 'Paramètres et aide' },
      menu: {
        entryInfoHistory: { title: "Historique des infos d'entrée", subtitle: 'Voir les voyages terminés et les infos archivées' },
        backup: { title: 'Sauvegarde cloud', subtitle: 'Dernière sauvegarde : {{time}}', defaultTime: 'Aujourd\'hui' },
        language: { title: 'Langue', subtitle: 'Actuelle : {{language}}' },
        settings: { title: 'Paramètres' },
        help: { title: 'Centre d\'aide' },
        about: { title: 'À propos de nous' },
        notifications: { title: 'Paramètres de notification' },
        notificationLogs: { title: 'Journaux de notification', subtitle: 'Voir l\'historique des notifications et les analyses' },
        exportData: { title: 'Exporter mes données', subtitle: 'Télécharger les données du pack d\'entrée en JSON' },
      },
      personal: {
        title: 'Informations personnelles',
        subtitle: 'Mettez à jour les données pour le contrôle frontière',
        collapsedHint: 'Touchez pour afficher les informations personnelles',
        gender: { male: 'Homme', female: 'Femme', undefined: 'Non spécifié', selectPrompt: 'Sélectionner le sexe' },
        fields: {
          dateOfBirth: { title: 'Date de naissance', subtitle: 'Date de naissance', placeholder: 'AAAA-MM-JJ', formatHint: 'Format : AAAA-MM-JJ', hint: 'Chiffres uniquement' },
          gender: { title: 'Sexe', subtitle: 'Sexe', placeholder: 'HOMME / FEMME' },
          occupation: { title: 'Profession', subtitle: 'Profession', placeholder: 'Profession' },
          countryRegion: { title: 'Pays / Région', subtitle: 'Pays / Région', placeholder: 'Sélectionnez votre pays' },
          provinceCity: { title: 'Ville / Province', subtitle: 'Ville / Province', placeholder: 'Province / Ville' },
          phone: { title: 'Numéro de téléphone', subtitle: 'Téléphone', placeholder: '+33 123456789' },
          email: { title: 'Adresse e‑mail', subtitle: 'E‑mail', placeholder: 'name@example.com' },
        },
      },
      funding: {
        title: 'Check‑list justificatifs financiers',
        subtitle: "À présenter rapidement à l'immigration",
        collapsedHint: 'Touchez pour afficher la liste des justificatifs financiers',
        tip: { title: 'Fonds suffisants', subtitle: 'Être prêt à présenter à l’immigration', description: 'Préparez espèces, cartes, relevés bancaires ou documents comme justificatifs' },
        footerNote: 'Appuyez pour afficher la liste des justificatifs financiers',
        common: { notFilled: 'Non renseigné' },
        selectType: 'Sélectionner le type de justificatif',
        selectTypeMessage: 'Choisissez le type de justificatif à ajouter',
        type: { cash: 'Espèces', bankCard: 'Carte bancaire', document: 'Document justificatif', cancel: 'Annuler' },
        empty: 'Aucun justificatif pour l’instant. Touchez ci‑dessous pour ajouter le premier.',
        addButton: 'Ajouter un justificatif financier',
      },
      passport: {
        defaultType: 'Passeport chinois',
        title: 'Mon passeport',
        subtitle: "{{passportNo}} · Valide jusqu'à {{expiry}}",
        fields: {
          fullName: { title: 'Nom complet', subtitle: 'Comme sur le passeport' },
          passportNo: 'Numéro de passeport',
          'passportNo.short': 'N° de passeport',
          nationality: 'Nationalité',
          'nationality.short': 'Nationalité',
          expiry: 'Date d\'expiration',
          'expiry.short': 'Valide jusqu\'à',
        },
        updateButton: 'Mettre à jour les infos du passeport',
        collapsedHint: 'Touchez pour développer les détails du passeport',
      },
      vip: { title: 'Passer Premium', subtitle: 'Générations illimitées, priorité', upgradeButton: 'Mettre à niveau maintenant' },
      editModal: { previous: '← Précédent', next: 'Suivant →', done: 'Terminer' },
      export: {
        confirmTitle: 'Exporter les données',
        confirmMessage: 'Exporter vos données en JSON ?',
        cancel: 'Annuler',
        confirm: 'Exporter',
        errorTitle: 'Échec de l’export',
        errorMessage: 'Échec de l’export des données. Réessayez.',
        noDataTitle: 'Aucune donnée à exporter',
        noDataMessage: 'Aucune donnée trouvée dans votre pack.',
        successTitle: 'Export terminé',
        successMessage: 'Vos données ont été exportées.',
        ok: 'OK',
        share: 'Partager',
        shareUnavailableTitle: 'Partage indisponible',
        shareUnavailableMessage: 'Le partage n’est pas disponible sur cet appareil.',
        shareTitle: 'Export des données du pack d\'entrée',
        shareMessage: 'Voici les données de mon pack d\'entrée',
        shareErrorTitle: 'Échec du partage',
        shareErrorMessage: 'Impossible de partager le fichier.',
      },
      logout: 'Se déconnecter',
      version: 'Version {{version}}',
      common: { notFilled: 'Non renseigné' },
    },
    fundItem: {
      types: {
        CASH: 'Espèces',
        BANK_CARD: 'Carte bancaire',
        CREDIT_CARD: 'Carte de crédit',
        BANK_BALANCE: 'Solde bancaire',
        INVESTMENT: 'Investissement',
        DOCUMENT: 'Document',
      },
      detail: { notProvided: 'Non fourni' },
    },
  },
  de: {
    common: { buttons: { cancel: 'Abbrechen', share: 'Teilen' }, back: 'Zurück', confirm: 'Bestätigen', delete: 'Löschen', error: 'Fehler', images: { tapToEnlarge: 'Tippen zum Vergrößern' }, reader: { font: { decrease: 'A-', increase: 'A+' } } },
    funds: { noInfoAvailable: 'Keine Fondsinformationen verfügbar', cash: 'Bargeld' },
    photos: { fundProof: { title: 'Nachweisfoto der Mittel', tapToViewLargerImage: 'Tippen, um das Bild zu vergrößern' } },
    notifications: { testingTools: { title: 'Benachrichtigungs-Testwerkzeuge', developmentOnly: 'Nur Entwicklungsmodus' }, sections: { test: 'Benachrichtigungen testen', actions: 'Aktionen', scheduled: 'Geplante Benachrichtigungen ({{count}})' }, stats: { title: 'Benachrichtigungsstatistiken', empty: 'Keine geplanten Benachrichtigungen' }, actions: { viewLogs: 'Benachrichtigungsprotokolle anzeigen', cancelAll: 'Alle Benachrichtigungen löschen' } },
    notificationLog: { header: { title: 'Benachrichtigungsprotokolle', back: 'Zurück', filter: 'Filtern' }, tabs: { logs: 'Protokolle ({{count}})', analytics: 'Analysen', performance: 'Werkzeuge' }, empty: { title: 'Keine Benachrichtigungsprotokolle gefunden', subtitle: 'Protokolle erscheinen hier, sobald Benachrichtigungen gesendet und verwendet werden' }, analytics: { overall: { title: 'Gesamtstatistiken', clickRate: 'Klickrate', scheduled: 'Geplant', sent: 'Gesendet', clicked: 'Geklickt' }, byType: 'Nach Benachrichtigungstyp', timing: { title: 'Optimale Zeit', bestHour: 'Beste Stunde', bestDay: 'Bester Tag', noData: 'Keine Daten' } }, filterModal: { title: 'Protokolle filtern', cancel: 'Abbrechen', clear: 'Löschen', apply: 'Filter anwenden', labels: { eventType: 'Ereignistyp', notificationType: 'Benachrichtigungstyp', entryPackId: 'Einreisepaket-ID', eventTypePlaceholder: 'z. B. geplant, geklickt, interagiert', notificationTypePlaceholder: 'z. B. Einreichungsfenster, dringende Erinnerung', entryPackIdPlaceholder: 'Einreisepaket-Bezeichner' } }, performance: { title: 'Leistungsübersicht', viewRecommendations: 'Empfehlungen anzeigen', exportLogs: 'Protokolle exportieren', clearOldLogs: 'Alte Protokolle löschen (30+ Tage)', clearAllLogs: 'Alle Protokolle löschen' } },
    gdpr: { export: { exported: { title: 'Export abgeschlossen', share: 'Datei teilen' } }, deletion: { dataItem: { willDelete: 'Wird gelöscht', noData: 'Keine Daten' }, consequences: { accountDeactivated: 'Ihr Konto wird deaktiviert' } } },
    dest: { hongkong: { hdac: { selection: { aiValue: 'AI' } } }, korea: { preview: { headerTitle: 'Einreisepaket-Vorschau', previewMode: 'Vorschau-Modus', description: 'Dies ist eine Vorschau Ihres Einreisepakets. Nach der K‑ETA-Beantragung enthält es alle Einreisedetails.', continue: 'Informationen weiter aktualisieren', applyKETA: 'K‑ETA beantragen', ketaInfoTitle: 'Elektronische Reisegenehmigung K‑ETA' } }, usa: { entryGuide: { title: 'US Entry Guide' } } },
    tdac: { files: { loading: 'Gespeicherte Dateien werden geladen...', empty: { pdfs: 'Keine gespeicherten PDFs gefunden', qr: 'Keine gespeicherten QR-Codes gefunden' } } },
    screenTitles: { tdacFiles: 'Gespeicherte TDAC-Dateien' },
    tabs: { home: 'Start', history: 'Archiv', profile: 'Profil' },
    profile: {
      header: 'Profil',
      user: { defaultName: 'Gastbenutzer', phone: 'Tel.: {{phone}}' },
      sections: { myServices: 'Meine Dienste', settings: 'Einstellungen & Hilfe' },
      menu: {
        entryInfoHistory: { title: 'Einreiseinfo-Verlauf', subtitle: 'Abgeschlossene Reisen und archivierte Einreiseinfos ansehen' },
        backup: { title: 'Cloud-Backup', subtitle: 'Letztes Backup: {{time}}', defaultTime: 'Heute' },
        language: { title: 'Sprache', subtitle: 'Aktuell: {{language}}' },
        settings: { title: 'Einstellungen' },
        help: { title: 'Hilfecenter' },
        about: { title: 'Über uns' },
        notifications: { title: 'Benachrichtigungseinstellungen' },
        notificationLogs: { title: 'Benachrichtigungsprotokolle', subtitle: 'Verlauf und Analysen anzeigen' },
        exportData: { title: 'Meine Daten exportieren', subtitle: 'Einreisepaket als JSON herunterladen' },
      },
      personal: {
        title: 'Persönliche Informationen',
        subtitle: 'Grenzdaten aktualisieren',
        collapsedHint: 'Tippen, um persönliche Informationen anzuzeigen',
        gender: { male: 'Mann', female: 'Frau', undefined: 'Unbestimmt', selectPrompt: 'Geschlecht auswählen' },
        fields: {
          dateOfBirth: { title: 'Geburtsdatum', subtitle: 'Geburtsdatum', placeholder: 'JJJJ-MM-TT', formatHint: 'Format: JJJJ-MM-TT', hint: 'Nur Ziffern' },
          gender: { title: 'Geschlecht', subtitle: 'Geschlecht', placeholder: 'MANN / FRAU' },
          occupation: { title: 'Beruf', subtitle: 'Beruf', placeholder: 'Beruf' },
          countryRegion: { title: 'Land / Region', subtitle: 'Land / Region', placeholder: 'Land auswählen' },
          provinceCity: { title: 'Stadt / Provinz', subtitle: 'Stadt / Provinz', placeholder: 'Provinz / Stadt' },
          phone: { title: 'Telefonnummer', subtitle: 'Telefon', placeholder: '+49 123456789' },
          email: { title: 'E‑Mail‑Adresse', subtitle: 'E‑Mail', placeholder: 'name@example.com' },
        },
      },
      funding: {
        title: 'Checkliste Finanznachweise',
        subtitle: 'Schnell bei der Einreise vorzeigen',
        collapsedHint: 'Tippen, um die Liste der Finanznachweise anzuzeigen',
        tip: { title: 'Ausreichende Mittel', subtitle: 'Bereit für die Einreiseprüfung', description: 'Bargeld, Karten, Kontoauszüge oder Dokumente vorbereiten' },
        footerNote: 'Tippen, um die Finanzliste anzuzeigen',
        common: { notFilled: 'Nicht ausgefüllt' },
        selectType: 'Typ des Finanznachweises wählen',
        selectTypeMessage: 'Wählen Sie den hinzuzufügenden Typ',
        type: { cash: 'Bargeld', bankCard: 'Bankkarte', document: 'Nachweisdokument', cancel: 'Abbrechen' },
        empty: 'Noch keine Einträge. Tippen Sie unten, um den ersten hinzuzufügen.',
        addButton: 'Finanznachweis hinzufügen',
      },
      passport: {
        defaultType: 'Chinesischer Reisepass',
        title: 'Mein Reisepass',
        subtitle: 'Pass {{passportNo}} · Gültig bis {{expiry}}',
        fields: {
          fullName: { title: 'Vollständiger Name', subtitle: 'Wie im Reisepass' },
          passportNo: 'Reisepassnummer',
          'passportNo.short': 'Pass‑Nr.',
          nationality: 'Nationalität',
          'nationality.short': 'Nationalität',
          expiry: 'Ablaufdatum',
          'expiry.short': 'Gültig bis',
        },
        updateButton: 'Passinformationen aktualisieren',
        collapsedHint: 'Tippen, um Passdetails anzuzeigen',
      },
      vip: { title: 'Premium upgraden', subtitle: 'Unbegrenzte Generierungen, Priorität', upgradeButton: 'Jetzt upgraden' },
      editModal: { previous: '← Zurück', next: 'Weiter →', done: 'Fertig' },
      export: {
        confirmTitle: 'Daten exportieren',
        confirmMessage: 'Einreisepaket als JSON exportieren?',
        cancel: 'Abbrechen',
        confirm: 'Exportieren',
        errorTitle: 'Export fehlgeschlagen',
        errorMessage: 'Daten konnten nicht exportiert werden. Bitte erneut versuchen.',
        noDataTitle: 'Keine Daten zum Export',
        noDataMessage: 'Im Einreisepaket wurden keine Daten gefunden.',
        successTitle: 'Export abgeschlossen',
        successMessage: 'Ihre Daten wurden exportiert.',
        ok: 'OK',
        share: 'Teilen',
        shareUnavailableTitle: 'Teilen nicht verfügbar',
        shareUnavailableMessage: 'Teilen ist auf diesem Gerät nicht verfügbar.',
        shareTitle: 'Export des Einreisepakets',
        shareMessage: 'Hier sind die Daten meines Einreisepakets',
        shareErrorTitle: 'Teilen fehlgeschlagen',
        shareErrorMessage: 'Datei kann nicht geteilt werden.',
      },
      logout: 'Abmelden',
      version: 'Version {{version}}',
      common: { notFilled: 'Nicht ausgefüllt' },
    },
    fundItem: {
      types: {
        CASH: 'Bargeld',
        BANK_CARD: 'Bankkarte',
        CREDIT_CARD: 'Kreditkarte',
        BANK_BALANCE: 'Kontostand',
        INVESTMENT: 'Investition',
        DOCUMENT: 'Dokument',
      },
      detail: { notProvided: 'Nicht angegeben' },
    },
  },
  es: {
    common: { buttons: { cancel: 'Cancelar', share: 'Compartir' }, back: 'Atrás', confirm: 'Confirmar', delete: 'Eliminar', error: 'Error', images: { tapToEnlarge: 'Toca para ampliar' }, reader: { font: { decrease: 'A-', increase: 'A+' } } },
    funds: { noInfoAvailable: 'No hay información de fondos disponible', cash: 'Efectivo' },
    photos: { fundProof: { title: 'Foto de comprobante de fondos', tapToViewLargerImage: 'Toca para ver la imagen ampliada' } },
    notifications: { testingTools: { title: 'Herramientas de prueba de notificaciones', developmentOnly: 'Solo modo de desarrollo' }, sections: { test: 'Probar notificaciones', actions: 'Acciones', scheduled: 'Notificaciones programadas ({{count}})' }, stats: { title: 'Estadísticas de notificaciones', empty: 'No hay notificaciones programadas' }, actions: { viewLogs: 'Ver registros de notificaciones', cancelAll: 'Cancelar todas las notificaciones' } },
    notificationLog: { header: { title: 'Registros de notificaciones', back: 'Atrás', filter: 'Filtrar' }, tabs: { logs: 'Registros ({{count}})', analytics: 'Análisis', performance: 'Herramientas' }, empty: { title: 'No se encontraron registros de notificaciones', subtitle: 'Los registros aparecerán aquí cuando se envíen e interactúen con las notificaciones' }, analytics: { overall: { title: 'Estadísticas generales', clickRate: 'Tasa de clics', scheduled: 'Programadas', sent: 'Enviadas', clicked: 'Clicadas' }, byType: 'Por tipo de notificación', timing: { title: 'Momento óptimo', bestHour: 'Mejor hora', bestDay: 'Mejor día', noData: 'Sin datos' } }, filterModal: { title: 'Filtrar registros', cancel: 'Cancelar', clear: 'Limpiar', apply: 'Aplicar filtros', labels: { eventType: 'Tipo de evento', notificationType: 'Tipo de notificación', entryPackId: 'ID del paquete de entrada', eventTypePlaceholder: 'p. ej., programadas, clicadas, interactuadas', notificationTypePlaceholder: 'p. ej., ventana de envío, recordatorio urgente', entryPackIdPlaceholder: 'Identificador del paquete de entrada' } }, performance: { title: 'Información de rendimiento', viewRecommendations: 'Ver recomendaciones', exportLogs: 'Exportar registros', clearOldLogs: 'Borrar registros antiguos (30+ días)', clearAllLogs: 'Borrar todos los registros' } },
    gdpr: { export: { exported: { title: 'Exportación completada', share: 'Compartir archivo' } }, deletion: { dataItem: { willDelete: 'Se eliminará', noData: 'Sin datos' }, consequences: { accountDeactivated: 'Tu cuenta será desactivada' } } },
    dest: { hongkong: { hdac: { selection: { aiValue: 'AI' } } }, korea: { preview: { headerTitle: 'Vista previa del paquete de entrada', previewMode: 'Modo de vista previa', description: 'Esta es una vista previa de tu paquete de entrada. Después de solicitar K‑ETA incluirá todos los detalles de entrada.', continue: 'Continuar actualizando la información', applyKETA: 'Solicitar K‑ETA', ketaInfoTitle: 'Autorización electrónica de viaje K‑ETA' } }, usa: { entryGuide: { title: 'Guía de entrada de EE. UU.' } } },
    tdac: { files: { loading: 'Cargando archivos guardados...', empty: { pdfs: 'No se encontraron PDF guardados', qr: 'No se encontraron códigos QR guardados' } } },
    screenTitles: { tdacFiles: 'Archivos TDAC guardados' },
    tabs: { home: 'Inicio', history: 'Archivo', profile: 'Perfil' },
    profile: {
      header: 'Perfil',
      user: { defaultName: 'Usuario invitado', phone: 'Tel.: {{phone}}' },
      sections: { myServices: 'Mis servicios', settings: 'Ajustes y ayuda' },
      menu: {
        entryInfoHistory: { title: 'Historial de información de entrada', subtitle: 'Ver viajes completados e información archivada' },
        backup: { title: 'Copia de seguridad en la nube', subtitle: 'Última copia: {{time}}', defaultTime: 'Hoy' },
        language: { title: 'Idioma', subtitle: 'Actual: {{language}}' },
        settings: { title: 'Ajustes' },
        help: { title: 'Centro de ayuda' },
        about: { title: 'Sobre nosotros' },
        notifications: { title: 'Ajustes de notificaciones' },
        notificationLogs: { title: 'Registros de notificaciones', subtitle: 'Ver historial y análisis' },
        exportData: { title: 'Exportar mis datos', subtitle: 'Descargar datos del paquete como JSON' },
      },
      personal: {
        title: 'Información personal',
        subtitle: 'Actualiza los datos para el control fronterizo',
        collapsedHint: 'Toca para mostrar la información personal',
        gender: { male: 'Hombre', female: 'Mujer', undefined: 'No especificado', selectPrompt: 'Seleccionar sexo' },
        fields: {
          dateOfBirth: { title: 'Fecha de nacimiento', subtitle: 'Fecha de nacimiento', placeholder: 'AAAA-MM-DD', formatHint: 'Formato: AAAA-MM-DD', hint: 'Solo dígitos' },
          gender: { title: 'Sexo', subtitle: 'Sexo', placeholder: 'HOMBRE / MUJER' },
          occupation: { title: 'Ocupación', subtitle: 'Ocupación', placeholder: 'Ocupación' },
          countryRegion: { title: 'País / Región', subtitle: 'País / Región', placeholder: 'Selecciona tu país' },
          provinceCity: { title: 'Ciudad / Provincia', subtitle: 'Ciudad / Provincia', placeholder: 'Provincia / Ciudad' },
          phone: { title: 'Número de teléfono', subtitle: 'Teléfono', placeholder: '+34 123456789' },
          email: { title: 'Correo electrónico', subtitle: 'Correo', placeholder: 'name@example.com' },
        },
      },
      funding: {
        title: 'Lista de comprobantes de fondos',
        subtitle: 'Presentar rápidamente en inmigración',
        collapsedHint: 'Toca para mostrar la lista de comprobantes',
        tip: { title: 'Fondos suficientes', subtitle: 'Listo para presentar en inmigración', description: 'Prepara efectivo, tarjetas, extractos bancarios o documentos' },
        footerNote: 'Toca para ver la lista de fondos',
        common: { notFilled: 'Sin completar' },
        selectType: 'Seleccionar tipo de comprobante',
        selectTypeMessage: 'Elige el tipo de elemento a añadir',
        type: { cash: 'Efectivo', bankCard: 'Tarjeta bancaria', document: 'Documento', cancel: 'Cancelar' },
        empty: 'Aún no hay elementos. Toca abajo para añadir el primero.',
        addButton: 'Añadir comprobante de fondos',
      },
      passport: {
        defaultType: 'Pasaporte chino',
        title: 'Mi pasaporte',
        subtitle: 'Pasaporte {{passportNo}} · Válido hasta {{expiry}}',
        fields: {
          fullName: { title: 'Nombre completo', subtitle: 'Como en el pasaporte' },
          passportNo: 'Número de pasaporte',
          'passportNo.short': 'N.º de pasaporte',
          nationality: 'Nacionalidad',
          'nationality.short': 'Nacionalidad',
          expiry: 'Fecha de vencimiento',
          'expiry.short': 'Válido hasta',
        },
        updateButton: 'Actualizar información del pasaporte',
        collapsedHint: 'Toca para desplegar los detalles del pasaporte',
      },
      vip: { title: 'Pasar a Premium', subtitle: 'Generaciones ilimitadas, prioridad', upgradeButton: 'Actualizar ahora' },
      editModal: { previous: '← Anterior', next: 'Siguiente →', done: 'Listo' },
      export: {
        confirmTitle: 'Exportar datos',
        confirmMessage: '¿Exportar tus datos como JSON?',
        cancel: 'Cancelar',
        confirm: 'Exportar',
        errorTitle: 'Exportación fallida',
        errorMessage: 'No se pudo exportar. Inténtalo de nuevo.',
        noDataTitle: 'No hay datos para exportar',
        noDataMessage: 'No se encontraron datos en tu paquete.',
        successTitle: 'Exportación completa',
        successMessage: 'Tus datos han sido exportados.',
        ok: 'OK',
        share: 'Compartir',
        shareUnavailableTitle: 'Compartir no disponible',
        shareUnavailableMessage: 'Compartir no está disponible en este dispositivo.',
        shareTitle: 'Exportación de datos del paquete de entrada',
        shareMessage: 'Aquí están los datos de mi paquete de entrada',
        shareErrorTitle: 'Error al compartir',
        shareErrorMessage: 'No se puede compartir el archivo.',
      },
      logout: 'Cerrar sesión',
      version: 'Versión {{version}}',
      common: { notFilled: 'Sin completar' },
    },
    fundItem: {
      types: {
        CASH: 'Efectivo',
        BANK_CARD: 'Tarjeta bancaria',
        CREDIT_CARD: 'Tarjeta de crédito',
        BANK_BALANCE: 'Saldo bancario',
        INVESTMENT: 'Inversión',
        DOCUMENT: 'Documento',
      },
      detail: { notProvided: 'No proporcionado' },
    },
  },
  ko: {
    common: { buttons: { cancel: '취소', share: '공유' }, back: '뒤로', confirm: '확인', delete: '삭제', error: '오류' },
    tabs: { home: '홈', history: '기록', profile: '프로필' },
    profile: {
      header: '프로필',
      user: { defaultName: '게스트 사용자', phone: '전화: {{phone}}' },
      sections: { myServices: '내 서비스', settings: '설정 및 도움말' },
      menu: {
        entryInfoHistory: { title: '입국 정보 기록', subtitle: '완료된 여행 및 보관된 입국 정보 보기' },
        backup: { title: '클라우드 백업', subtitle: '최근 백업: {{time}}', defaultTime: '오늘' },
        language: { title: '언어', subtitle: '현재: {{language}}' },
        settings: { title: '설정' },
        help: { title: '고객센터' },
        about: { title: '회사 소개' },
        notifications: { title: '알림 설정' },
        notificationLogs: { title: '알림 로그', subtitle: '알림 내역 및 분석 보기' },
        exportData: { title: '내 데이터 내보내기', subtitle: '입국 패키지 데이터를 JSON으로 다운로드' },
      },
      personal: {
        title: '개인 정보',
        subtitle: '국경 통과 정보 업데이트',
        collapsedHint: '탭하여 개인 정보를 표시',
        gender: { male: '남성', female: '여성', undefined: '미지정', selectPrompt: '성별 선택' },
        fields: {
          dateOfBirth: { title: '생년월일', subtitle: '생년월일', placeholder: 'YYYY-MM-DD', formatHint: '형식: YYYY-MM-DD', hint: '숫자만 입력' },
          gender: { title: '성별', subtitle: '성별', placeholder: '남성 / 여성' },
          occupation: { title: '직업', subtitle: '직업', placeholder: '직업' },
          countryRegion: { title: '국가/지역', subtitle: '국가/지역', placeholder: '국가 선택' },
          provinceCity: { title: '도시/도', subtitle: '도시/도', placeholder: '도 / 시' },
          phone: { title: '전화번호', subtitle: '전화', placeholder: '+82 010-0000-0000' },
          email: { title: '이메일 주소', subtitle: '이메일', placeholder: 'name@example.com' },
        },
      },
      funding: {
        title: '자금 증빙 체크리스트',
        subtitle: '입국 심사에서 빠르게 제시',
        collapsedHint: '탭하여 자금 목록 표시',
        tip: { title: '충분한 자금', subtitle: '입국 심사 준비 완료', description: '현금, 카드, 은행 내역 또는 서류 준비' },
        footerNote: '자금 목록 보기',
        common: { notFilled: '미입력' },
        selectType: '자금 항목 유형 선택',
        selectTypeMessage: '추가할 자금 항목 유형을 선택하세요',
        type: { cash: '현금', bankCard: '은행 카드', document: '증빙 문서', cancel: '취소' },
        empty: '아직 항목이 없습니다. 아래에서 첫 항목을 추가하세요.',
        addButton: '자금 항목 추가',
      },
      passport: {
        defaultType: '중국 여권',
        title: '내 여권',
        subtitle: '여권 {{passportNo}} · {{expiry}}까지 유효',
        fields: {
          fullName: { title: '영문 이름', subtitle: '여권과 동일' },
          passportNo: '여권 번호',
          'passportNo.short': '여권 번호',
          nationality: '국적',
          'nationality.short': '국적',
          expiry: '만료일',
          'expiry.short': '만료',
        },
        updateButton: '여권 정보 업데이트',
        collapsedHint: '탭하여 여권 상세 보기',
      },
      vip: { title: '프리미엄으로 업그레이드', subtitle: '무제한 생성, 우선 처리', upgradeButton: '지금 업그레이드' },
      editModal: { previous: '← 이전', next: '다음 →', done: '완료' },
      export: {
        confirmTitle: '데이터 내보내기',
        confirmMessage: '입국 데이터 패키지를 JSON으로 내보내시겠습니까?',
        cancel: '취소',
        confirm: '내보내기',
        errorTitle: '내보내기 실패',
        errorMessage: '데이터 내보내기에 실패했습니다. 다시 시도하세요.',
        noDataTitle: '내보낼 데이터 없음',
        noDataMessage: '입국 패키지에서 데이터를 찾지 못했습니다.',
        successTitle: '내보내기 완료',
        successMessage: '데이터가 내보내졌습니다.',
        ok: '확인',
        share: '공유',
        shareUnavailableTitle: '공유 불가',
        shareUnavailableMessage: '이 기기에서는 공유를 사용할 수 없습니다.',
        shareTitle: '입국 데이터 패키지 내보내기',
        shareMessage: '내 입국 데이터 패키지입니다',
        shareErrorTitle: '공유 실패',
        shareErrorMessage: '파일을 공유할 수 없습니다.',
      },
      logout: '로그아웃',
      version: '버전 {{version}}',
      common: { notFilled: '미입력' },
    },
    fundItem: {
      types: {
        CASH: '현금',
        BANK_CARD: '은행 카드',
        CREDIT_CARD: '신용카드',
        BANK_BALANCE: '은행 잔액',
        INVESTMENT: '투자',
        DOCUMENT: '문서',
      },
      detail: { notProvided: '제공되지 않음' },
    },
  },
  ja: {
    common: { buttons: { cancel: 'キャンセル', share: '共有' }, back: '戻る', confirm: '確認', delete: '削除', error: 'エラー' },
    tabs: { home: 'ホーム', history: 'アーカイブ', profile: 'プロフィール' },
    profile: {
      header: 'プロフィール',
      user: { defaultName: 'ゲストユーザー', phone: '電話: {{phone}}' },
      sections: { myServices: 'マイサービス', settings: '設定とヘルプ' },
      menu: {
        entryInfoHistory: { title: '入国情報の履歴', subtitle: '完了した旅行と保存された入国情報を見る' },
        backup: { title: 'クラウドバックアップ', subtitle: '最終バックアップ: {{time}}', defaultTime: '今日' },
        language: { title: '言語', subtitle: '現在: {{language}}' },
        settings: { title: '設定' },
        help: { title: 'ヘルプセンター' },
        about: { title: '会社概要' },
        notifications: { title: '通知設定' },
        notificationLogs: { title: '通知ログ', subtitle: '通知履歴と分析を見る' },
        exportData: { title: 'マイデータをエクスポート', subtitle: '入国パックのデータをJSONでダウンロード' },
      },
      personal: {
        title: '個人情報',
        subtitle: '国境審査用の情報を更新',
        collapsedHint: 'タップして個人情報を表示',
        gender: { male: '男性', female: '女性', undefined: '未指定', selectPrompt: '性別を選択' },
        fields: {
          dateOfBirth: { title: '生年月日', subtitle: '生年月日', placeholder: 'YYYY-MM-DD', formatHint: '形式: YYYY-MM-DD', hint: '数字のみ入力' },
          gender: { title: '性別', subtitle: '性別', placeholder: '男性 / 女性' },
          occupation: { title: '職業', subtitle: '職業', placeholder: '職業' },
          countryRegion: { title: '国/地域', subtitle: '国/地域', placeholder: '国を選択' },
          provinceCity: { title: '都市/都道府県', subtitle: '都市/都道府県', placeholder: '都道府県 / 市区町村' },
          phone: { title: '電話番号', subtitle: '電話', placeholder: '+81 090-0000-0000' },
          email: { title: 'メールアドレス', subtitle: 'メール', placeholder: 'name@example.com' },
        },
      },
      funding: {
        title: '資金証明チェックリスト',
        subtitle: '入国審査で素早く提示',
        collapsedHint: 'タップして資金リストを表示',
        tip: { title: '十分な資金', subtitle: '入国審査の準備完了', description: '現金、カード、銀行残高または書類を準備' },
        footerNote: '資金リストを表示',
        common: { notFilled: '未入力' },
        selectType: '資金項目の種類を選択',
        selectTypeMessage: '追加する資金項目の種類を選択してください',
        type: { cash: '現金', bankCard: '銀行カード', document: '証明書類', cancel: 'キャンセル' },
        empty: 'まだ項目がありません。下から最初の項目を追加してください。',
        addButton: '資金項目を追加',
      },
      passport: {
        defaultType: '中国旅券',
        title: 'マイパスポート',
        subtitle: '旅券 {{passportNo}} · {{expiry}} まで有効',
        fields: {
          fullName: { title: '英字氏名', subtitle: '旅券と同じ' },
          passportNo: '旅券番号',
          'passportNo.short': '旅券番号',
          nationality: '国籍',
          'nationality.short': '国籍',
          expiry: '有効期限',
          'expiry.short': '有効期限',
        },
        updateButton: '旅券情報を更新',
        collapsedHint: 'タップして旅券の詳細を表示',
      },
      vip: { title: 'プレミアムにアップグレード', subtitle: '無制限生成・優先処理', upgradeButton: '今すぐアップグレード' },
      editModal: { previous: '← 前へ', next: '次へ →', done: '完了' },
      export: {
        confirmTitle: 'データをエクスポート',
        confirmMessage: '入国データパックをJSONでエクスポートしますか？',
        cancel: 'キャンセル',
        confirm: 'エクスポート',
        errorTitle: 'エクスポートに失敗',
        errorMessage: 'データのエクスポートに失敗しました。再試行してください。',
        noDataTitle: 'エクスポートするデータなし',
        noDataMessage: '入国パックにデータが見つかりませんでした。',
        successTitle: 'エクスポート完了',
        successMessage: 'データをエクスポートしました。',
        ok: 'OK',
        share: '共有',
        shareUnavailableTitle: '共有不可',
        shareUnavailableMessage: 'この端末では共有を利用できません。',
        shareTitle: '入国データパックのエクスポート',
        shareMessage: '私の入国データパックです',
        shareErrorTitle: '共有に失敗',
        shareErrorMessage: 'ファイルを共有できません。',
      },
      logout: 'ログアウト',
      version: 'バージョン {{version}}',
      common: { notFilled: '未入力' },
    },
    fundItem: {
      types: {
        CASH: '現金',
        BANK_CARD: '銀行カード',
        CREDIT_CARD: 'クレジットカード',
        BANK_BALANCE: '銀行残高',
        INVESTMENT: '投資',
        DOCUMENT: '書類',
      },
      detail: { notProvided: '未提供' },
    },
  },
  ms: {
    common: { buttons: { cancel: 'Batal', share: 'Kongsi' }, back: 'Kembali', confirm: 'Sahkan', delete: 'Padam', error: 'Ralat', images: { tapToEnlarge: 'Ketik untuk besarkan' }, reader: { font: { decrease: 'A-', increase: 'A+' } } },
    funds: { noInfoAvailable: 'Tiada maklumat dana tersedia', cash: 'Tunai' },
    photos: { fundProof: { title: 'Foto bukti dana', tapToViewLargerImage: 'Ketik untuk melihat imej yang lebih besar' } },
    notifications: { testingTools: { title: 'Alat ujian pemberitahuan', developmentOnly: 'Mod pembangunan sahaja' }, sections: { test: 'Uji pemberitahuan', actions: 'Tindakan', scheduled: 'Pemberitahuan berjadual ({{count}})' }, stats: { title: 'Statistik pemberitahuan', empty: 'Tiada pemberitahuan berjadual' }, actions: { viewLogs: 'Lihat log pemberitahuan', cancelAll: 'Batalkan semua pemberitahuan' } },
    notificationLog: { header: { title: 'Log pemberitahuan', back: 'Kembali', filter: 'Tapis' }, tabs: { logs: 'Log ({{count}})', analytics: 'Analitik', performance: 'Alat' }, empty: { title: 'Tiada log pemberitahuan ditemui', subtitle: 'Log akan muncul di sini apabila pemberitahuan dihantar dan digunakan' }, analytics: { overall: { title: 'Statistik keseluruhan', clickRate: 'Kadar klik', scheduled: 'Berjadual', sent: 'Dihantar', clicked: 'Diklik' }, byType: 'Mengikut jenis pemberitahuan', timing: { title: 'Masa optimum', bestHour: 'Jam terbaik', bestDay: 'Hari terbaik', noData: 'Tiada data' } }, filterModal: { title: 'Tapis log', cancel: 'Batal', clear: 'Kosongkan', apply: 'Guna penapis', labels: { eventType: 'Jenis acara', notificationType: 'Jenis pemberitahuan', entryPackId: 'ID pakej masuk', eventTypePlaceholder: 'contohnya: berjadual, diklik, berinteraksi', notificationTypePlaceholder: 'contohnya: tetingkap penyerahan, peringatan segera', entryPackIdPlaceholder: 'Pengecam pakej masuk' } }, performance: { title: 'Cerapan prestasi', viewRecommendations: 'Lihat cadangan', exportLogs: 'Eksport log', clearOldLogs: 'Kosongkan log lama (30+ hari)', clearAllLogs: 'Kosongkan semua log' } },
    gdpr: { export: { exported: { title: 'Eksport selesai', share: 'Kongsi fail' } }, deletion: { dataItem: { willDelete: 'Akan dipadam', noData: 'Tiada data' }, consequences: { accountDeactivated: 'Akaun anda akan dinyahaktifkan' } } },
    dest: { hongkong: { hdac: { selection: { aiValue: 'AI' } } }, korea: { preview: { headerTitle: 'Pratonton Pakej Masuk', previewMode: 'Mod pratonton', description: 'Ini ialah pratonton pakej masuk anda. Selepas memohon K‑ETA ia akan merangkumi semua butiran masuk.', continue: 'Teruskan mengemas kini maklumat', applyKETA: 'Mohon K‑ETA', ketaInfoTitle: 'K‑ETA Kebenaran Perjalanan Elektronik' } }, usa: { entryGuide: { title: 'Panduan Kemasukan AS' } } },
    tdac: { files: { loading: 'Memuatkan fail yang disimpan...', empty: { pdfs: 'Tiada PDF yang disimpan ditemui', qr: 'Tiada kod QR yang disimpan ditemui' } } },
    screenTitles: { tdacFiles: 'Fail TDAC yang disimpan' },
  },
};

// Merge country-specific translations from JSON files
// Use Object.keys() and filter to avoid triggering lazy getters
const countryLangKeys = Object.keys(countryTranslations).filter(
  (lang) => lang !== 'zh-TW' && lang !== 'zh'
);
countryLangKeys.forEach((lang) => {
  try {
    const base = translations[lang] || {};
    const countryData = countryTranslations[lang];
    // Only merge if countryData exists and is not a getter
    if (countryData && typeof countryData === 'object') {
      translations[lang] = deepMergeTranslations(base, countryData);
    }
  } catch (error) {
    console.error(`Error merging translations for ${lang}:`, error);
    // Continue with other languages even if one fails
  }
});

export const getLanguageLabel = (language) =>
  translations?.en?.languages?.[language] || language;

// Get translation with fallback mechanism
export const getTranslationWithFallback = (key, language, params = {}) => {
  const keys = key.split('.');
  let current = translations[language];
  
  // Try primary language first
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      current = null;
      break;
    }
  }
  
  // If not found, try fallback language
  if (!current && LANGUAGE_FALLBACK[language]) {
    const fallbackLang = LANGUAGE_FALLBACK[language];
    current = translations[fallbackLang];
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        current = null;
        break;
      }
    }
  }
  
  // Final fallback to English
  if (!current) {
    current = translations.en;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        current = key; // Return key if not found
        break;
      }
    }
  }
  
  // Handle string interpolation
  if (typeof current === 'string' && Object.keys(params).length > 0) {
    return current.replace(/\{\{(\w+)\}\}/g, (match, param) => params[param] || match);
  }
  
  return current;
};
