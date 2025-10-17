// Travel purposes for TripSecretary
// Standardized travel purpose options with internationalization support

export const TRAVEL_PURPOSES = {
  // Basic travel purposes (matching the image provided)
  'TOURISM': {
    en: 'Tourism',
    zh: '旅游',
    ja: '観光',
    th: 'ท่องเที่ยว',
    ko: '관광'
  },
  'BUSINESS': {
    en: 'Business',
    zh: '商务',
    ja: 'ビジネス',
    th: 'ธุรกิจ',
    ko: '비즈니스'
  },
  'VISITING_RELATIVES': {
    en: 'Visiting Relatives',
    zh: '探亲访友',
    ja: '親族訪問',
    th: 'เยี่ยมญาติ',
    ko: '친척 방문'
  },

  // Additional purposes for completeness
  'TRANSIT': {
    en: 'Transit',
    zh: '过境转机',
    ja: 'トランジット',
    th: 'เปลี่ยนเครื่อง',
    ko: '환승'
  },
  'OTHER': {
    en: 'Other',
    zh: '其他',
    ja: 'その他',
    th: 'อื่นๆ',
    ko: '기타'
  },

  // Thailand-specific purposes (from TDAC API)
  'HOLIDAY': {
    en: 'Holiday',
    zh: '度假旅游',
    ja: '休暇',
    th: 'วันหยุด',
    ko: '휴가'
  },
  'MEETING': {
    en: 'Meeting',
    zh: '会议',
    ja: '会議',
    th: 'การประชุม',
    ko: '회의'
  },
  'SPORTS': {
    en: 'Sports',
    zh: '体育活动',
    ja: 'スポーツ',
    th: 'กีฬา',
    ko: '스포츠'
  },
  'INCENTIVE': {
    en: 'Incentive',
    zh: '奖励旅游',
    ja: 'インセンティブ',
    th: 'สิ่งจูงใจ',
    ko: '인센티브'
  },
  'CONVENTION': {
    en: 'Convention',
    zh: '会议展览',
    ja: 'コンベンション',
    th: 'การประชุม',
    ko: '컨벤션'
  },
  'EDUCATION': {
    en: 'Education',
    zh: '教育学习',
    ja: '教育',
    th: 'การศึกษา',
    ko: '교육'
  },
  'EMPLOYMENT': {
    en: 'Employment',
    zh: '工作就业',
    ja: '雇用',
    th: 'การจ้างงาน',
    ko: '고용'
  },
  'EXHIBITION': {
    en: 'Exhibition',
    zh: '展览展会',
    ja: '展示会',
    th: 'นิทรรศการ',
    ko: '전시회'
  },
  'MEDICAL': {
    en: 'Medical',
    zh: '医疗',
    ja: '医療',
    th: 'การแพทย์',
    ko: '의료'
  }
};

// Helper functions
export const getTravelPurposeDisplayName = (code, locale = 'en') => {
  const purpose = TRAVEL_PURPOSES[code];
  if (!purpose) return code;

  return purpose[locale] || purpose.en || code;
};

export const getTravelPurposeCode = (displayName, locale = 'en') => {
  const entry = Object.entries(TRAVEL_PURPOSES).find(([code, translations]) => {
    return translations[locale] === displayName || translations.en === displayName;
  });
  return entry ? entry[0] : displayName;
};

export const getAllTravelPurposes = (locale = 'en') => {
  return Object.entries(TRAVEL_PURPOSES).map(([code, translations]) => ({
    code,
    name: translations[locale] || translations.en,
    displayName: `${translations[locale] || translations.en} (${code})`
  }));
};

export const getBasicTravelPurposes = (locale = 'en') => {
  // Return the basic purposes including Transit and Other
  const basicCodes = ['TOURISM', 'BUSINESS', 'VISITING_RELATIVES', 'TRANSIT', 'OTHER'];

  return basicCodes.map(code => ({
    code,
    name: TRAVEL_PURPOSES[code][locale] || TRAVEL_PURPOSES[code].en,
    displayName: `${TRAVEL_PURPOSES[code][locale] || TRAVEL_PURPOSES[code].en} (${code})`
  }));
};

export const getJapanTravelPurposes = (locale = 'en') => {
  // Return purposes for Japan entry - simplified list
  const japanCodes = ['TOURISM', 'BUSINESS', 'VISITING_RELATIVES', 'TRANSIT', 'OTHER'];

  return japanCodes.map(code => ({
    code,
    name: TRAVEL_PURPOSES[code][locale] || TRAVEL_PURPOSES[code].en,
    displayName: `${TRAVEL_PURPOSES[code][locale] || TRAVEL_PURPOSES[code].en} (${code})`
  }));
};

export const getThailandTravelPurposes = (locale = 'en') => {
  // Return purposes for Thailand TDAC API
  const thailandCodes = ['HOLIDAY', 'BUSINESS', 'MEETING', 'SPORTS', 'INCENTIVE', 'CONVENTION', 'EDUCATION', 'EMPLOYMENT', 'EXHIBITION', 'MEDICAL', 'TRANSIT', 'OTHER'];

  return thailandCodes.map(code => ({
    code,
    name: TRAVEL_PURPOSES[code][locale] || TRAVEL_PURPOSES[code].en,
    displayName: `${TRAVEL_PURPOSES[code][locale] || TRAVEL_PURPOSES[code].en} (${code})`
  }));
};

// Map legacy purpose values to new standardized codes
export const normalizeTravelPurpose = (legacyPurpose) => {
  if (!legacyPurpose) return 'TOURISM';

  const normalized = legacyPurpose.toUpperCase().replace(/[\s\-_]/g, '');

  const legacyMapping = {
    'TOURISM': 'TOURISM',
    'BUSINESS': 'BUSINESS',
    'VISITINGRELATIVES': 'VISITING_RELATIVES',
    'VISITING': 'VISITING_RELATIVES',
    'RELATIVES': 'VISITING_RELATIVES',
    'TRANSIT': 'TRANSIT',
    'OTHER': 'OTHER',
    'HOLIDAY': 'HOLIDAY',
    'MEETING': 'MEETING',
    'SPORTS': 'SPORTS',
    'INCENTIVE': 'INCENTIVE',
    'CONVENTION': 'CONVENTION',
    'EDUCATION': 'EDUCATION',
    'EMPLOYMENT': 'EMPLOYMENT',
    'EXHIBITION': 'EXHIBITION',
    'MEDICAL': 'MEDICAL',
    '旅游': 'TOURISM',
    '商务': 'BUSINESS',
    '探亲访友': 'VISITING_RELATIVES',
    '探亲': 'VISITING_RELATIVES',
    '访友': 'VISITING_RELATIVES',
    '过境转机': 'TRANSIT',
    '转机': 'TRANSIT',
    '其他': 'OTHER',
    '度假旅游': 'HOLIDAY',
    '度假': 'HOLIDAY',
    '会议': 'MEETING',
    '体育活动': 'SPORTS',
    '体育': 'SPORTS',
    '奖励旅游': 'INCENTIVE',
    '会议展览': 'CONVENTION',
    '教育学习': 'EDUCATION',
    '教育': 'EDUCATION',
    '工作就业': 'EMPLOYMENT',
    '工作': 'EMPLOYMENT',
    '展览展会': 'EXHIBITION',
    '医疗': 'MEDICAL',
  };

  return legacyMapping[normalized] || 'OTHER';
};

export default TRAVEL_PURPOSES;