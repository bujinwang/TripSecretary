// @ts-nocheck

/**
 * Hong Kong Labels Configuration
 *
 * Chinese (Simplified) labels for all form sections
 * Used by HongKongTravelInfoScreen with shared section components
 */

export const hongkongLabels = {
  // Screen title
  screenTitle: '香港入境信息表',
  screenTitleEn: 'Hong Kong Entry Information',

  // Passport Section
  passport: {
    title: '护照信息',
    subtitle: '請準確填寫護照上的信息',
    icon: '📘',
    introIcon: '🛂',
    introText: '請確保所有信息與您的護照完全一致',

    // Fields
    fullName: '護照上的姓名 - Full Name (as in passport)',
    fullNameHelp: '請按照護照上的順序填寫',
    nationality: '國籍 - Nationality',
    nationalityHelp: '選擇您的國籍',
    passportNo: '護照號碼 - Passport Number',
    passportNoHelp: '輸入您的護照號碼',
    visaNumber: '簽證號碼（可選）- Visa Number (Optional)',
    visaNumberHelp: '如有簽證請填寫',
    dob: '出生日期 - Date of Birth',
    dobHelp: '選擇您的出生日期',
    expiryDate: '護照有效期 - Passport Expiry Date',
    expiryDateHelp: '選擇護照到期日期',
    sex: '性別 - Gender',
  },

  // Personal Info Section
  personalInfo: {
    title: '个人信息',
    subtitle: '聯繫方式和職業信息',
    icon: '👤',
    introIcon: '📋',
    introText: '海關需要您的聯繫方式以便必要時聯繫',

    // Fields
    occupation: '職業 - Occupation',
    occupationHelp: '選擇您的職業',
    occupationPlaceholder: '請選擇',
    customOccupationLabel: '其他職業 - Other Occupation',
    customOccupationPlaceholder: '請說明',
    cityOfResidence: '居住城市 - City of Residence',
    cityOfResidenceHelp: '填寫您的居住城市',
    countryOfResidence: '居住國家 - Country of Residence',
    countryOfResidenceHelp: '選擇您的居住國家',
    phoneLabel: '電話號碼 - Phone Number',
    phoneCodeLabel: '國家代碼 - Country Code',
    phoneCodeHelp: '選擇國家代碼',
    phoneNumberLabel: '電話號碼 - Phone Number',
    phoneNumberHelp: '輸入您的電話號碼',
    email: '電子郵箱 - Email',
    emailHelp: '輸入您的電子郵箱地址',
    emailPlaceholder: 'example@email.com',
  },

  // Funds Section
  funds: {
    title: '资金证明',
    subtitle: '旅遊資金和支付方式',
    icon: '💰',
    introIcon: '💵',
    introText: '香港海關可能要求您出示足夠的旅遊資金證明',

    // Fund types
    addFundTitle: '添加資金證明 - Add Proof of Funds',
    cash: '現金 - Cash',
    creditCard: '信用卡 - Credit Card',
    bankBalance: '銀行存款 - Bank Balance',
    travelersCheque: '旅行支票 - Traveller\'s Cheque',
    other: '其他 - Other',

    // Fund item labels
    amount: '金額 - Amount',
    currency: '幣種 - Currency',
    photo: '照片 - Photo',
    hasPhoto: '已上傳 - Uploaded',
    noPhoto: '未上傳 - Not Uploaded',

    // Empty state
    emptyTitle: '暫無資金證明',
    emptyMessage: '點擊上方按鈕添加資金證明',
  },

  // Travel Details Section
  travelDetails: {
    title: '旅行详情',
    subtitle: '航班和住宿信息',
    icon: '✈️',
    introIcon: '✈️',
    introText: '海關需要了解您的旅行計劃',

    // Travel Purpose
    travelPurpose: '訪問目的 - Purpose of Visit',
    travelPurposeHelp: '選擇您訪問香港的原因',
    travelPurposePlaceholder: '請選擇',
    customTravelPurposeLabel: '其他目的 - Other Purpose',
    customTravelPurposePlaceholder: '請說明',
    recentStayCountry: '近30天訪問過的國家',
    recentStayCountryHelp: '選擇您最近訪問過的國家',
    boardingCountry: '登機國家 - Boarding Country',
    boardingCountryHelp: '選擇您登機的國家',

    // Arrival Flight
    arrivalFlightNumber: '入境航班號 - Arrival Flight Number',
    arrivalFlightNumberHelp: '輸入您的入境航班號',
    arrivalFlightNumberPlaceholder: '例如：CX123',
    arrivalDate: '入境日期 - Arrival Date',
    arrivalDateHelp: '選擇您的入境日期',
    flightTicketPhoto: '機票照片 - Flight Ticket Photo',
    uploadFlightTicket: '上傳機票 - Upload Ticket',

    // Departure Flight
    departureFlightNumber: '離境航班號 - Departure Flight Number',
    departureFlightNumberHelp: '輸入您的離境航班號',
    departureFlightNumberPlaceholder: '例如：CX456',
    departureDate: '離境日期 - Departure Date',
    departureDateHelp: '選擇您的離境日期',
    departureFlightTicketPhoto: '返程機票照片',
    uploadDepartureFlightTicket: '上傳返程機票',

    // Accommodation
    isTransitPassenger: '是否為過境旅客？',
    transitYes: '是 - Yes',
    transitNo: '否 - No',
    accommodationType: '住宿類型 - Accommodation Type',
    accommodationTypeHelp: '選擇您的住宿類型',
    customAccommodationType: '其他住宿類型',
    province: '地區 - Region',
    provinceHelp: '選擇地區',
    provincePlaceholder: '請選擇地區',
    district: '區域 - District',
    districtHelp: '選擇區域',
    districtPlaceholder: '請選擇區域',
    subDistrict: '街道 - Street',
    subDistrictHelp: '選擇街道',
    subDistrictPlaceholder: '請選擇街道',
    postalCode: '郵政編碼 - Postal Code',
    hotelAddress: '酒店/住宿地址 - Hotel/Accommodation Address',
    hotelAddressHelp: '輸入完整地址',
    hotelAddressPlaceholder: '輸入地址',
    hotelReservationPhoto: '酒店預訂單',
    uploadHotelReservation: '上傳預訂單',
  },

  // Progress and Actions
  progress: {
    overallProgress: '總體進度',
    completed: '已完成',
    remaining: '剩餘',
    nextSteps: '下一步',
    saveAndContinue: '保存並繼續',
    submit: '提交',
    draft: '保存草稿',
  },

  // Validation messages
  validation: {
    required: '此字段為必填項',
    invalidEmail: '請輸入有效的電子郵箱地址',
    invalidPassport: '請輸入有效的護照號碼',
    invalidPhone: '請輸入有效的電話號碼',
    invalidDate: '請選擇有效的日期',
    passportExpired: '護照已過期或即將過期',
    futureDate: '日期不能是未來',
    pastDate: '日期不能是過去',
  },

  // Success messages
  success: {
    saved: '數據已保存',
    submitted: '表單已提交',
  },

  // Error messages
  errors: {
    saveFailed: '保存失敗，請重試',
    loadFailed: '加載數據失敗',
    submitFailed: '提交失敗，請重試',
  },
};

// Configuration for Hong Kong-specific settings
export const hongkongConfig = {
  // Passport Section
  passport: {
    showVisaNumber: true,
    genderOptions: [
      { label: '男性 - Male', value: 'Male' },
      { label: '女性 - Female', value: 'Female' },
      { label: '未定義 - Undefined', value: 'Undefined' },
    ],
  },

  // Personal Info Section
  personalInfo: {
    uppercaseCity: true,
    uppercaseOccupation: true,
  },

  // Funds Section
  funds: {
    fundTypes: ['cash', 'credit_card', 'bank_balance', 'travelers_cheque', 'other'],
    showPhotos: true,
  },

  // Travel Details Section
  travelDetails: {
    showTravelPurpose: true,
    showRecentStayCountry: true,
    showBoardingCountry: true,
    showArrivalFlight: true,
    showDepartureFlight: true,
    showAccommodation: true,
    showFlightTicketPhoto: true,
    showDepartureFlightTicketPhoto: true,
    showTransitPassenger: true,
    showHotelReservationPhoto: true,
    locationDepth: 2, // Hong Kong uses Region + District (2 levels)
    showPostalCode: false, // Hong Kong doesn't use postal codes
    purposeType: 'basic', // Use basic travel purposes
    accommodationOptions: [
      { label: '酒店 - Hotel', value: 'HOTEL' },
      { label: '旅館 - Hostel', value: 'HOSTEL' },
      { label: '民宿 - Airbnb', value: 'AIRBNB' },
      { label: '朋友/親戚家 - Friend/Family', value: 'FRIEND_FAMILY' },
      { label: '其他 - Other', value: 'OTHER' },
    ],
  },
};

export default {
  labels: hongkongLabels,
  config: hongkongConfig,
};
