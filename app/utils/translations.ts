

// 翻译工具 - 将中文表格数据翻译成目的地语言

/**
 * 目的地语言映射
 */
export const DESTINATION_LANGUAGES = {
  hk: { code: 'zh-HK', name: '繁体中文', flag: '🇭🇰' },
  tw: { code: 'zh-TW', name: '繁体中文', flag: '🇹🇼' },
  th: { code: 'en-TH', name: 'English/ภาษาไทย', flag: '🇹🇭' },
  jp: { code: 'ja', name: '日本語', flag: '🇯🇵' },
  kr: { code: 'ko', name: '한국어', flag: '🇰🇷' },
  sg: { code: 'en', name: 'English', flag: '🇸🇬' },
  my: { code: 'en', name: 'English/Bahasa', flag: '🇲🇾' },
  us: { code: 'en', name: 'English', flag: '🇺🇸' },
  ca: { code: 'en', name: 'English/Français', flag: '🇨🇦' },
  gb: { code: 'en', name: 'English', flag: '🇬🇧' },
  au: { code: 'en', name: 'English', flag: '🇦🇺' },
  nz: { code: 'en', name: 'English', flag: '🇳🇿' },
};

/**
 * 表格字段翻译
 */
export const FIELD_TRANSLATIONS = {
  // 导航按钮
  back: {
    'zh-CN': '返回',
    'zh-HK': '返回',
    'zh-TW': '返回',
    'en': 'Back',
    'ja': '戻る',
    'ko': '뒤로',
  },
  
  // 页面标题和标签
  entryInformation: {
    'zh-CN': '入境信息',
    'zh-HK': '入境資訊',
    'zh-TW': '入境資訊',
    'en': 'Entry Information',
    'ja': '入国情報',
    'ko': '입국 정보',
  },
  keyInformation: {
    'zh-CN': '关键信息',
    'zh-HK': '關鍵資訊',
    'zh-TW': '關鍵資訊',
    'en': 'Key Information',
    'ja': '重要情報',
    'ko': '주요 정보',
  },
  additionalDetails: {
    'zh-CN': '其他信息',
    'zh-HK': '其他資訊',
    'zh-TW': '其他資訊',
    'en': 'Additional Details',
    'ja': 'その他の詳細',
    'ko': '추가 정보',
  },
  commonQuestions: {
    'zh-CN': '常见问题',
    'zh-HK': '常見問題',
    'zh-TW': '常見問題',
    'en': 'Common Questions',
    'ja': 'よくある質問',
    'ko': '자주 묻는 질문',
  },
  howLongStay: {
    'zh-CN': '停留多久？',
    'zh-HK': '停留多久？',
    'zh-TW': '停留多久？',
    'en': 'How long will you stay?',
    'ja': 'どのくらい滞在しますか？',
    'ko': '얼마나 머무르실 건가요？',
  },
  returnFlightDate: {
    'zh-CN': '返程航班日期？',
    'zh-HK': '返程航班日期？',
    'zh-TW': '返程航班日期？',
    'en': 'Return flight date?',
    'ja': '帰国便の日付は？',
    'ko': '귀국 항공편 날짜는？',
  },
  days: {
    'zh-CN': '天',
    'zh-HK': '天',
    'zh-TW': '天',
    'en': 'days',
    'ja': '日',
    'ko': '일',
  },
  scanForDetails: {
    'zh-CN': '扫码查看完整信息',
    'zh-HK': '掃碼查看完整資訊',
    'zh-TW': '掃碼查看完整資訊',
    'en': 'Scan for full details',
    'ja': 'スキャンして詳細を確認',
    'ko': '스캔하여 전체 정보 보기',
  },
  
  // 海关申报
  customsDeclaration: {
    'zh-CN': '海关申报',
    'zh-HK': '海關申報',
    'zh-TW': '海關申報',
    'en': 'Customs Declaration',
    'ja': '税関申告',
    'ko': '세관 신고',
  },
  arrivingFromCountry: {
    'zh-CN': '从哪个国家入境？',
    'zh-HK': '從哪個國家入境？',
    'zh-TW': '從哪個國家入境？',
    'en': 'Arriving from which country?',
    'ja': 'どの国から到着しますか？',
    'ko': '어느 나라에서 오시나요？',
  },
  currencyOverLimit: {
    'zh-CN': '携带现金超过$10,000加元？',
    'zh-HK': '攜帶現金超過$10,000加元？',
    'zh-TW': '攜帶現金超過$10,000加元？',
    'en': 'Currency ≥ CAN$10,000?',
    'ja': 'CAD$10,000以上の現金を所持？',
    'ko': 'CAD$10,000 이상 소지？',
  },
  exceedsDutyFree: {
    'zh-CN': '超过免税额度？',
    'zh-HK': '超過免稅額度？',
    'zh-TW': '超過免稅額度？',
    'en': 'Exceeds duty-free allowance?',
    'ja': '免税範囲を超えていますか？',
    'ko': '면세 한도 초과？',
  },
  hasFirearms: {
    'zh-CN': '携带枪支或武器？',
    'zh-HK': '攜帶槍支或武器？',
    'zh-TW': '攜帶槍支或武器？',
    'en': 'Firearms or weapons?',
    'ja': '銃器または武器を所持？',
    'ko': '총기 또는 무기 소지？',
  },
  hasCommercialGoods: {
    'zh-CN': '携带商业物品？',
    'zh-HK': '攜帶商業物品？',
    'zh-TW': '攜帶商業物品？',
    'en': 'Commercial goods?',
    'ja': '商業用品を所持？',
    'ko': '상업용 물품 소지？',
  },
  hasFoodAnimals: {
    'zh-CN': '携带食品/植物/动物？',
    'zh-HK': '攜帶食品/植物/動物？',
    'zh-TW': '攜帶食品/植物/動物？',
    'en': 'Food/plants/animals?',
    'ja': '食品・植物・動物を所持？',
    'ko': '음식/식물/동물 소지？',
  },
  
  // 基本信息
  fullName: {
    'zh-CN': '姓名',
    'zh-HK': '姓名',
    'zh-TW': '姓名',
    'en': 'Full Name',
    'ja': '氏名',
    'ko': '이름',
  },
  familyName: {
    'zh-CN': '姓',
    'en': 'Family Name / Surname',
    'ja': '姓',
    'ko': '성',
  },
  givenName: {
    'zh-CN': '名',
    'en': 'Given Name',
    'ja': '名',
    'ko': '이름',
  },
  passportNumber: {
    'zh-CN': '护照号码',
    'zh-HK': '護照號碼',
    'zh-TW': '護照號碼',
    'en': 'Passport Number',
    'ja': 'パスポート番号',
    'ko': '여권 번호',
  },
  nationality: {
    'zh-CN': '国籍',
    'zh-HK': '國籍',
    'zh-TW': '國籍',
    'en': 'Nationality',
    'ja': '国籍',
    'ko': '국적',
  },
  dateOfBirth: {
    'zh-CN': '出生日期',
    'zh-HK': '出生日期',
    'zh-TW': '出生日期',
    'en': 'Date of Birth',
    'ja': '生年月日',
    'ko': '생년월일',
  },
  gender: {
    'zh-CN': '性别',
    'zh-HK': '性別',
    'zh-TW': '性別',
    'en': 'Gender',
    'ja': '性別',
    'ko': '성별',
  },
  
  // 航班信息
  flightNumber: {
    'zh-CN': '航班号',
    'zh-HK': '航班號',
    'zh-TW': '航班號',
    'en': 'Flight Number',
    'ja': 'フライト番号',
    'ko': '항공편명',
  },
  arrivalDate: {
    'zh-CN': '到达日期',
    'zh-HK': '到達日期',
    'zh-TW': '到達日期',
    'en': 'Arrival Date',
    'ja': '到着日',
    'ko': '도착 날짜',
  },
  departureDate: {
    'zh-CN': '离境日期',
    'zh-HK': '離境日期',
    'zh-TW': '離境日期',
    'en': 'Departure Date',
    'ja': '出発日',
    'ko': '출발 날짜',
  },
  
  // 住宿信息
  hotelName: {
    'zh-CN': '酒店名称',
    'zh-HK': '酒店名稱',
    'zh-TW': '酒店名稱',
    'en': 'Hotel Name',
    'ja': 'ホテル名',
    'ko': '호텔 이름',
  },
  hotelAddress: {
    'zh-CN': '酒店地址',
    'zh-HK': '酒店地址',
    'zh-TW': '酒店地址',
    'en': 'Hotel Address',
    'ja': 'ホテル住所',
    'ko': '호텔 주소',
  },
  contactPhone: {
    'zh-CN': '联系电话',
    'zh-HK': '聯絡電話',
    'zh-TW': '聯絡電話',
    'en': 'Contact Phone',
    'ja': '連絡先電話',
    'ko': '연락처',
  },
  
  // 旅行目的
  purposeOfVisit: {
    'zh-CN': '访问目的',
    'zh-HK': '訪問目的',
    'zh-TW': '訪問目的',
    'en': 'Purpose of Visit',
    'ja': '訪問目的',
    'ko': '방문 목적',
  },
  tourism: {
    'zh-CN': '旅游',
    'zh-HK': '旅遊',
    'zh-TW': '旅遊',
    'en': 'Tourism',
    'ja': '観光',
    'ko': '관광',
  },
  business: {
    'zh-CN': '商务',
    'zh-HK': '商務',
    'zh-TW': '商務',
    'en': 'Business',
    'ja': 'ビジネス',
    'ko': '비즈니스',
  },
  visiting: {
    'zh-CN': '探亲访友',
    'zh-HK': '探親訪友',
    'zh-TW': '探親訪友',
    'en': 'Visiting Friends/Family',
    'ja': '親族訪問',
    'ko': '친지 방문',
  },
  study: {
    'zh-CN': '学习',
    'zh-HK': '學習',
    'zh-TW': '學習',
    'en': 'Study',
    'ja': '留学',
    'ko': '유학',
  },
  work: {
    'zh-CN': '工作',
    'zh-HK': '工作',
    'zh-TW': '工作',
    'en': 'Work',
    'ja': '就労',
    'ko': '취업',
  },
  
  // 常见值翻译
  male: {
    'zh-CN': '男',
    'zh-HK': '男',
    'zh-TW': '男',
    'en': 'Male',
    'ja': '男性',
    'ko': '남성',
  },
  female: {
    'zh-CN': '女',
    'zh-HK': '女',
    'zh-TW': '女',
    'en': 'Female',
    'ja': '女性',
    'ko': '여성',
  },
  china: {
    'zh-CN': '中国',
    'zh-HK': '中國',
    'zh-TW': '中國',
    'en': 'China',
    'ja': '中国',
    'ko': '중국',
  },
};

/**
 * 获取目的地的语言代码
 */
export function getDestinationLanguage(destinationId) {
  return DESTINATION_LANGUAGES[destinationId]?.code || 'en';
}

/**
 * 翻译字段名
 */
export function translateField(fieldKey, destinationId, targetLanguageOverride) {
  const langCode = targetLanguageOverride || getDestinationLanguage(destinationId);
  const translations = FIELD_TRANSLATIONS[fieldKey];
  
  if (!translations) {
return fieldKey;
}
  
  return translations[langCode] || translations['en'] || translations['zh-CN'] || fieldKey;
}

/**
 * 翻译表格数据
 */
export function translateFormData(formData, destinationId) {
  const langCode = getDestinationLanguage(destinationId);
  
  const translated = {};
  
  for (const [key, value] of Object.entries(formData)) {
    // 翻译字段名
    const translatedKey = translateField(key, destinationId);
    
    // 翻译值（如果是预定义的值）
    let translatedValue = value;
    if (typeof value === 'string' && FIELD_TRANSLATIONS[value.toLowerCase()]) {
      translatedValue = translateField(value.toLowerCase(), destinationId);
    }
    
    translated[translatedKey] = translatedValue;
  }
  
  return translated;
}

/**
 * 生成双语对照表
 * 用于海关问答卡
 */
export function generateBilingualQA(destinationId) {
  const commonQuestions = [
    {
      id: 'purpose',
      zh: '你来这里的目的是什么？',
      answer_zh: '旅游观光',
    },
    {
      id: 'duration',
      zh: '你打算停留多久？',
      answer_zh: '7天',
    },
    {
      id: 'hotel',
      zh: '你住在哪里？',
      answer_zh: '酒店名称和地址',
    },
    {
      id: 'return',
      zh: '你什么时候离开？',
      answer_zh: '返程日期',
    },
    {
      id: 'money',
      zh: '你带了多少现金？',
      answer_zh: '少于10000美元',
    },
  ];
  
  // 根据目的地添加目标语言
  const langCode = getDestinationLanguage(destinationId);
  
  // 这里可以调用翻译API或使用预定义的翻译
  // 暂时返回英文版本
  return commonQuestions.map(q => ({
    ...q,
    en: translateQuestionToEnglish(q.zh),
    answer_en: translateQuestionToEnglish(q.answer_zh),
  }));
}

function translateQuestionToEnglish(text) {
  // 简单的映射，实际应该调用翻译API
  const map = {
    '你来这里的目的是什么？': 'What is the purpose of your visit?',
    '旅游观光': 'Tourism / Sightseeing',
    '你打算停留多久？': 'How long do you plan to stay?',
    '7天': '7 days',
    '你住在哪里？': 'Where are you staying?',
    '酒店名称和地址': 'Hotel name and address',
    '你什么时候离开？': 'When are you leaving?',
    '返程日期': 'Return date',
    '你带了多少现金？': 'How much cash are you carrying?',
    '少于10000美元': 'Less than $10,000',
  };
  return map[text] || text;
}

export default {
  DESTINATION_LANGUAGES,
  FIELD_TRANSLATIONS,
  getDestinationLanguage,
  translateField,
  translateFormData,
  generateBilingualQA,
};
