/**
 * Vietnam Labels Configuration
 *
 * Vietnamese/Chinese bilingual labels for all form sections
 * Used by VietnamTravelInfoScreen with shared section components
 */

export const vietnamLabels = {
  // Screen title
  screenTitle: '越南入境信息表',
  screenTitleEn: 'Vietnam Entry Information',

  // Passport Section
  passport: {
    title: '护照信息 - Thông tin hộ chiếu',
    subtitle: '请准确填写护照上的信息',
    icon: '📘',
    introIcon: '🛂',
    introText: '请确保所有信息与您的护照完全一致',

    // Fields
    fullName: '护照上的姓名 - Họ và tên',
    fullNameHelp: '请按照护照上的顺序填写',
    nationality: '国籍 - Quốc tịch',
    nationalityHelp: '选择您的国籍',
    passportNo: '护照号码 - Số hộ chiếu',
    passportNoHelp: '输入您的护照号码',
    visaNumber: '签证号码（可选）- Số thị thực',
    visaNumberHelp: '如有签证请填写',
    dob: '出生日期 - Ngày sinh',
    dobHelp: '选择您的出生日期',
    expiryDate: '护照有效期 - Ngày hết hạn',
    expiryDateHelp: '选择护照到期日期',
    sex: '性别 - Giới tính',
  },

  // Personal Info Section
  personalInfo: {
    title: '个人信息 - Thông tin cá nhân',
    subtitle: '联系方式和职业信息',
    icon: '👤',
    introIcon: '📋',
    introText: '海关需要您的联系方式以便必要时联系',

    // Fields
    occupation: '职业 - Nghề nghiệp',
    occupationHelp: '选择您的职业',
    occupationPlaceholder: '请选择',
    customOccupationLabel: '其他职业 - Nghề khác',
    customOccupationPlaceholder: '请说明',
    cityOfResidence: '居住城市 - Thành phố cư trú',
    cityOfResidenceHelp: '填写您的居住城市',
    countryOfResidence: '居住国家 - Quốc gia cư trú',
    countryOfResidenceHelp: '选择您的居住国家',
    phoneLabel: '电话号码 - Số điện thoại',
    phoneCodeLabel: '国家代码 - Mã quốc gia',
    phoneCodeHelp: '选择国家代码',
    phoneNumberLabel: '电话号码 - Số điện thoại',
    phoneNumberHelp: '输入您的电话号码',
    email: '电子邮箱 - Email',
    emailHelp: '输入您的电子邮箱地址',
    emailPlaceholder: 'example@email.com',
  },

  // Funds Section
  funds: {
    title: '资金证明 - Chứng minh tài chính',
    subtitle: '旅游资金和支付方式',
    icon: '💰',
    introIcon: '💵',
    introText: '越南海关可能要求您出示足够的旅游资金证明',

    // Fund types
    addFundTitle: '添加资金证明 - Thêm chứng minh',
    cash: '现金 - Tiền mặt',
    creditCard: '信用卡 - Thẻ tín dụng',
    bankBalance: '银行存款 - Số dư ngân hàng',
    travelersCheque: '旅行支票 - Séc du lịch',
    other: '其他 - Khác',

    // Fund item labels
    amount: '金额 - Số tiền',
    currency: '币种 - Loại tiền',
    photo: '照片 - Ảnh',
    hasPhoto: '已上传 - Đã tải lên',
    noPhoto: '未上传 - Chưa tải lên',

    // Empty state
    emptyTitle: '暂无资金证明',
    emptyMessage: '点击上方按钮添加资金证明',
  },

  // Travel Details Section
  travelDetails: {
    title: '旅行详情 - Chi tiết chuyến đi',
    subtitle: '航班和住宿信息',
    icon: '✈️',
    introIcon: '✈️',
    introText: '海关需要了解您的旅行计划',

    // Travel Purpose
    travelPurpose: '访问目的 - Mục đích',
    travelPurposeHelp: '选择您访问越南的原因',
    travelPurposePlaceholder: '请选择',
    customTravelPurposeLabel: '其他目的 - Mục đích khác',
    customTravelPurposePlaceholder: '请说明',
    recentStayCountry: '近30天访问过的国家',
    recentStayCountryHelp: '选择您最近访问过的国家',
    boardingCountry: '登机国家 - Nơi xuất phát',
    boardingCountryHelp: '选择您登机的国家',

    // Arrival Flight
    arrivalFlightNumber: '入境航班号 - Số hiệu chuyến bay đến',
    arrivalFlightNumberHelp: '输入您的入境航班号',
    arrivalFlightNumberPlaceholder: '例如：VN123',
    arrivalDate: '入境日期 - Ngày đến',
    arrivalDateHelp: '选择您的入境日期',
    flightTicketPhoto: '机票照片 - Ảnh vé máy bay',
    uploadFlightTicket: '上传机票 - Tải lên vé',

    // Departure Flight
    departureFlightNumber: '离境航班号 - Số hiệu chuyến bay đi',
    departureFlightNumberHelp: '输入您的离境航班号',
    departureFlightNumberPlaceholder: '例如：VN456',
    departureDate: '离境日期 - Ngày đi',
    departureDateHelp: '选择您的离境日期',
    departureFlightTicketPhoto: '返程机票照片',
    uploadDepartureFlightTicket: '上传返程机票',

    // Accommodation
    isTransitPassenger: '是否为过境旅客？',
    transitYes: '是 - Có',
    transitNo: '否 - Không',
    accommodationType: '住宿类型 - Loại chỗ ở',
    accommodationTypeHelp: '选择您的住宿类型',
    customAccommodationType: '其他住宿类型',
    province: '省份/城市 - Tỉnh/Thành phố',
    provinceHelp: '选择省份或城市',
    provincePlaceholder: '请选择省份',
    district: '区/郡 - Quận/Huyện',
    districtHelp: '选择区或郡',
    districtPlaceholder: '请选择区',
    subDistrict: '坊/社 - Phường/Xã',
    subDistrictHelp: '选择坊或社',
    subDistrictPlaceholder: '请选择坊',
    postalCode: '邮政编码 - Mã bưu điện',
    hotelAddress: '酒店/住宿地址 - Địa chỉ khách sạn',
    hotelAddressHelp: '输入完整地址',
    hotelAddressPlaceholder: '输入地址',
    hotelReservationPhoto: '酒店预订单',
    uploadHotelReservation: '上传预订单',
  },

  // Progress and Actions
  progress: {
    overallProgress: '总体进度',
    completed: '已完成',
    remaining: '剩余',
    nextSteps: '下一步',
    saveAndContinue: '保存并继续',
    submit: '提交',
    draft: '保存草稿',
  },

  // Validation messages
  validation: {
    required: '此字段为必填项',
    invalidEmail: '请输入有效的电子邮箱地址',
    invalidPassport: '请输入有效的护照号码',
    invalidPhone: '请输入有效的电话号码',
    invalidDate: '请选择有效的日期',
    passportExpired: '护照已过期或即将过期',
    futureDate: '日期不能是未来',
    pastDate: '日期不能是过去',
  },

  // Success messages
  success: {
    saved: '数据已保存',
    submitted: '表单已提交',
  },

  // Error messages
  errors: {
    saveFailed: '保存失败，请重试',
    loadFailed: '加载数据失败',
    submitFailed: '提交失败，请重试',
  },
};

// Configuration for Vietnam-specific settings
export const vietnamConfig = {
  // Passport Section
  passport: {
    showVisaNumber: true,
    genderOptions: [
      { label: '男性 - Nam', value: 'M' },
      { label: '女性 - Nữ', value: 'F' },
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
    locationDepth: 2, // Vietnam uses Province + District (2 levels)
    showPostalCode: false, // Vietnam doesn't commonly use postal codes
    purposeType: 'basic', // Use basic travel purposes
    accommodationOptions: [
      { label: '酒店 - Khách sạn', value: 'HOTEL' },
      { label: '旅馆 - Nhà nghỉ', value: 'HOSTEL' },
      { label: '民宿 - Airbnb', value: 'AIRBNB' },
      { label: '朋友/亲戚家 - Nhà bạn/người thân', value: 'FRIEND_FAMILY' },
      { label: '其他 - Khác', value: 'OTHER' },
    ],
  },
};

export default {
  labels: vietnamLabels,
  config: vietnamConfig,
};
