/**
 * Taiwan Labels Configuration
 * Chinese (Simplified) labels for travel info sections
 */

export const taiwanLabels = {
  screenTitle: '臺灣入境資訊表',
  screenTitleEn: 'Taiwan Entry Information',

  passport: {
    title: '护照信息',
    subtitle: '请填写与护照完全一致的信息',
    icon: '📘',
    introIcon: '🛂',
    introText: '請確保所有資訊與護照完全一致，入境時將逐項核對。',
    fullName: '護照姓名 - Full Name',
    nationality: '國籍 - Nationality',
    passportNo: '護照號碼 - Passport Number',
    passportNoHelp: '僅限英文字母與數字，請確認無空格。',
    visaNumber: '入臺證號碼（可選）- Entry Permit Number (Optional)',
    dob: '出生日期 - Date of Birth',
    expiryDate: '護照有效期 - Passport Expiry Date',
    sex: '性別 - Gender',
  },

  personalInfo: {
    title: '个人信息',
    subtitle: '联系方式和居住信息',
    icon: '👤',
    introIcon: '📋',
    introText: '臺灣移民署可能會聯繫您，請確保聯絡方式正確。',
    occupation: '職業 - Occupation',
    occupationHelp: '選擇或輸入您的職業',
    occupationPlaceholder: '請選擇',
    customOccupationLabel: '其他職業 - Other',
    customOccupationPlaceholder: '請輸入職業名稱',
    countryOfResidence: '居住國家 - Country/Region',
    countryOfResidenceHelp: '選擇您目前的居住國家或地區',
    phoneCodeLabel: '國碼 - Country Code',
    phoneCodeHelp: '選擇電話國碼',
    phoneNumberLabel: '聯絡電話 - Phone Number',
    phoneNumberHelp: '必須可接收簡訊以確認申報',
    email: '電子郵件 - Email',
    emailHelp: '用於接收台灣入境確認通知',
  },

  funds: {
    title: '资金证明',
    subtitle: '台湾入境通常不查验，但建议准备',
    icon: '💰',
    introIcon: '💴',
    introText: '建議準備足夠旅遊資金或信用卡，以備不時之需。',
    addFundTitle: '新增資金證明',
    emptyTitle: '尚未新增資金證明',
    emptyMessage: '如需添加，可點擊上方按鈕。',
  },

  travelDetails: {
    title: '旅行信息',
    subtitle: '航班和住宿信息',
    icon: '✈️',
    introIcon: '🛬',
    introText: '請準備航班與住宿資訊以便快速通關。',
    travelPurpose: '旅行目的 - Purpose of Visit',
    travelPurposeHelp: '選擇此次前往臺灣的目的',
    customTravelPurposeLabel: '其他目的',
    customTravelPurposePlaceholder: '請輸入自訂目的',
    arrivalFlightNumber: '抵達航班 / 船班 - Arrival Flight/Ship Number',
    arrivalFlightNumberHelp: '輸入抵達臺灣的航班或航線號碼',
    arrivalFlightNumberPlaceholder: '例如 CI201 / BR716',
    arrivalDate: '抵達日期 - Arrival Date',
    arrivalDateHelp: '須在抵達前 3 天內提交線上入境卡',
    stayDuration: '停留天數 - Duration of Stay',
    stayDurationHelp: '輸入預計在臺停留天數',
    accommodationType: '住宿型態 - Accommodation Type',
    accommodationTypeHelp: '選擇在臺期間的住宿類型',
    province: '所在地區 - City/County',
    provinceHelp: '選擇住宿所在的縣市',
    hotelAddress: '住宿地址 - Accommodation Address',
    hotelAddressHelp: '請輸入完整住宿地址或接待人資訊',
    contactNumber: '台灣聯絡電話（可選）- Local Contact Number (Optional)',
  },
};

export const taiwanConfig = {
  passport: {
    showVisaNumber: true,
    genderOptions: [
      { label: '男性 - Male', value: 'M' },
      { label: '女性 - Female', value: 'F' },
      { label: '其他 - Other', value: 'X' },
    ],
  },
  personalInfo: {
    uppercaseCity: true,
    uppercaseOccupation: true,
  },
  funds: {
    fundTypes: ['cash', 'credit_card', 'bank_balance'],
    showPhotos: false,
  },
  travelDetails: {
    showTravelPurpose: true,
    showArrivalFlight: true,
    showDepartureFlight: false,
    showAccommodation: true,
    showStayDuration: true,
    locationDepth: 1,
    showPostalCode: false,
    purposeType: 'basic',
    accommodationOptions: [
      { label: '飯店 / Hotel', value: 'HOTEL' },
      { label: '民宿 / Guesthouse', value: 'GUESTHOUSE' },
      { label: '朋友 / 親戚家', value: 'FRIENDS_FAMILY' },
      { label: '商務住宿 / Business', value: 'BUSINESS' },
      { label: '其他 / Other', value: 'OTHER' },
    ],
  },
};

export default { labels: taiwanLabels, config: taiwanConfig };
