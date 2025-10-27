/**
 * Singapore Regions and Planning Areas
 * Source: Urban Redevelopment Authority (URA) Planning Regions
 *
 * Singapore is divided into 5 regions with 55 planning areas total.
 * For accommodation purposes, we list all major planning areas.
 */

export const singaporeRegions = [
  // Central Region (11 planning areas)
  { code: 'BISHAN', name: 'Bishan', nameZh: '碧山' },
  { code: 'BUKIT_MERAH', name: 'Bukit Merah', nameZh: '红山' },
  { code: 'BUKIT_TIMAH', name: 'Bukit Timah', nameZh: '武吉知马' },
  { code: 'DOWNTOWN_CORE', name: 'Downtown Core', nameZh: '市中心' },
  { code: 'GEYLANG', name: 'Geylang', nameZh: '芽笼' },
  { code: 'KALLANG', name: 'Kallang', nameZh: '加冷' },
  { code: 'MARINA_EAST', name: 'Marina East', nameZh: '滨海东' },
  { code: 'MARINA_SOUTH', name: 'Marina South', nameZh: '滨海南' },
  { code: 'MUSEUM', name: 'Museum', nameZh: '博物馆区' },
  { code: 'NEWTON', name: 'Newton', nameZh: '纽顿' },
  { code: 'NOVENA', name: 'Novena', nameZh: '诺维娜' },
  { code: 'ORCHARD', name: 'Orchard', nameZh: '乌节' },
  { code: 'OUTRAM', name: 'Outram', nameZh: '欧南' },
  { code: 'QUEENSTOWN', name: 'Queenstown', nameZh: '女皇镇' },
  { code: 'RIVER_VALLEY', name: 'River Valley', nameZh: '里峇峇利' },
  { code: 'ROCHOR', name: 'Rochor', nameZh: '梧槽' },
  { code: 'SINGAPORE_RIVER', name: 'Singapore River', nameZh: '新加坡河' },
  { code: 'SOUTHERN_ISLANDS', name: 'Southern Islands', nameZh: '南部岛屿' },
  { code: 'STRAITS_VIEW', name: 'Straits View', nameZh: '海峡景' },
  { code: 'TANGLIN', name: 'Tanglin', nameZh: '东陵' },
  { code: 'TOA_PAYOH', name: 'Toa Payoh', nameZh: '大巴窑' },

  // East Region (13 planning areas)
  { code: 'BEDOK', name: 'Bedok', nameZh: '勿洛' },
  { code: 'CHANGI', name: 'Changi', nameZh: '樟宜' },
  { code: 'CHANGI_BAY', name: 'Changi Bay', nameZh: '樟宜湾' },
  { code: 'MARINE_PARADE', name: 'Marine Parade', nameZh: '马林百列' },
  { code: 'PASIR_RIS', name: 'Pasir Ris', nameZh: '巴西立' },
  { code: 'PAYA_LEBAR', name: 'Paya Lebar', nameZh: '巴耶利峇' },
  { code: 'TAMPINES', name: 'Tampines', nameZh: '淡滨尼' },

  // North Region (7 planning areas)
  { code: 'CENTRAL_WATER_CATCHMENT', name: 'Central Water Catchment', nameZh: '中央集水区' },
  { code: 'LIM_CHU_KANG', name: 'Lim Chu Kang', nameZh: '林厝港' },
  { code: 'MANDAI', name: 'Mandai', nameZh: '万礼' },
  { code: 'SEMBAWANG', name: 'Sembawang', nameZh: '三巴旺' },
  { code: 'SIMPANG', name: 'Simpang', nameZh: '新邦' },
  { code: 'SUNGEI_KADUT', name: 'Sungei Kadut', nameZh: '双溪加株' },
  { code: 'WOODLANDS', name: 'Woodlands', nameZh: '兀兰' },
  { code: 'YISHUN', name: 'Yishun', nameZh: '义顺' },

  // North-East Region (7 planning areas)
  { code: 'ANG_MO_KIO', name: 'Ang Mo Kio', nameZh: '宏茂桥' },
  { code: 'HOUGANG', name: 'Hougang', nameZh: '后港' },
  { code: 'NORTH_EASTERN_ISLANDS', name: 'North-Eastern Islands', nameZh: '东北岛屿' },
  { code: 'PUNGGOL', name: 'Punggol', nameZh: '榜鹅' },
  { code: 'SELETAR', name: 'Seletar', nameZh: '实里达' },
  { code: 'SENGKANG', name: 'Sengkang', nameZh: '盛港' },
  { code: 'SERANGOON', name: 'Serangoon', nameZh: '实龙岗' },

  // West Region (11 planning areas)
  { code: 'BOON_LAY', name: 'Boon Lay', nameZh: '文礼' },
  { code: 'BUKIT_BATOK', name: 'Bukit Batok', nameZh: '武吉巴督' },
  { code: 'BUKIT_PANJANG', name: 'Bukit Panjang', nameZh: '武吉班让' },
  { code: 'CHOA_CHU_KANG', name: 'Choa Chu Kang', nameZh: '蔡厝港' },
  { code: 'CLEMENTI', name: 'Clementi', nameZh: '金文泰' },
  { code: 'JURONG_EAST', name: 'Jurong East', nameZh: '裕廊东' },
  { code: 'JURONG_WEST', name: 'Jurong West', nameZh: '裕廊西' },
  { code: 'PIONEER', name: 'Pioneer', nameZh: '先驱' },
  { code: 'TENGAH', name: 'Tengah', nameZh: '登加' },
  { code: 'TUAS', name: 'Tuas', nameZh: '大士' },
  { code: 'WESTERN_ISLANDS', name: 'Western Islands', nameZh: '西部岛屿' },
  { code: 'WESTERN_WATER_CATCHMENT', name: 'Western Water Catchment', nameZh: '西部集水区' },
];

/**
 * Get display name for a region in bilingual format (English - Chinese)
 * @param {string} code - Region code
 * @returns {string} Bilingual display name
 */
export const getRegionDisplayNameBilingual = (code) => {
  const region = singaporeRegions.find(r => r.code === code);
  if (!region) return code;
  return `${region.name} - ${region.nameZh}`;
};

/**
 * Get region name in English
 * @param {string} code - Region code
 * @returns {string} English name
 */
export const getRegionNameEnglish = (code) => {
  const region = singaporeRegions.find(r => r.code === code);
  return region ? region.name : code;
};

/**
 * Get region name in Chinese
 * @param {string} code - Region code
 * @returns {string} Chinese name
 */
export const getRegionNameChinese = (code) => {
  const region = singaporeRegions.find(r => r.code === code);
  return region ? region.nameZh : code;
};

export default {
  singaporeRegions,
  getRegionDisplayNameBilingual,
  getRegionNameEnglish,
  getRegionNameChinese,
};
