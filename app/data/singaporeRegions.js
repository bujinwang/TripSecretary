/**
 * Singapore Regions and Planning Areas
 * Source: Urban Redevelopment Authority (URA) Planning Regions
 *
 * Singapore is divided into 5 regions with 55 planning areas total.
 * For accommodation purposes, we list all major planning areas.
 *
 * Structure compatible with LocationHierarchySelector (single-level hierarchy)
 */

export const singaporeRegions = [
  // Central Region (21 planning areas)
  { id: 'BISHAN', code: 'BISHAN', name: 'Bishan', nameEn: 'Bishan', nameZh: '碧山', nameLocal: '碧山' },
  { id: 'BUKIT_MERAH', code: 'BUKIT_MERAH', name: 'Bukit Merah', nameEn: 'Bukit Merah', nameZh: '红山', nameLocal: '红山' },
  { id: 'BUKIT_TIMAH', code: 'BUKIT_TIMAH', name: 'Bukit Timah', nameEn: 'Bukit Timah', nameZh: '武吉知马', nameLocal: '武吉知马' },
  { id: 'DOWNTOWN_CORE', code: 'DOWNTOWN_CORE', name: 'Downtown Core', nameEn: 'Downtown Core', nameZh: '市中心', nameLocal: '市中心' },
  { id: 'GEYLANG', code: 'GEYLANG', name: 'Geylang', nameEn: 'Geylang', nameZh: '芽笼', nameLocal: '芽笼' },
  { id: 'KALLANG', code: 'KALLANG', name: 'Kallang', nameEn: 'Kallang', nameZh: '加冷', nameLocal: '加冷' },
  { id: 'MARINA_EAST', code: 'MARINA_EAST', name: 'Marina East', nameEn: 'Marina East', nameZh: '滨海东', nameLocal: '滨海东' },
  { id: 'MARINA_SOUTH', code: 'MARINA_SOUTH', name: 'Marina South', nameEn: 'Marina South', nameZh: '滨海南', nameLocal: '滨海南' },
  { id: 'MUSEUM', code: 'MUSEUM', name: 'Museum', nameEn: 'Museum', nameZh: '博物馆区', nameLocal: '博物馆区' },
  { id: 'NEWTON', code: 'NEWTON', name: 'Newton', nameEn: 'Newton', nameZh: '纽顿', nameLocal: '纽顿' },
  { id: 'NOVENA', code: 'NOVENA', name: 'Novena', nameEn: 'Novena', nameZh: '诺维娜', nameLocal: '诺维娜' },
  { id: 'ORCHARD', code: 'ORCHARD', name: 'Orchard', nameEn: 'Orchard', nameZh: '乌节', nameLocal: '乌节' },
  { id: 'OUTRAM', code: 'OUTRAM', name: 'Outram', nameEn: 'Outram', nameZh: '欧南', nameLocal: '欧南' },
  { id: 'QUEENSTOWN', code: 'QUEENSTOWN', name: 'Queenstown', nameEn: 'Queenstown', nameZh: '女皇镇', nameLocal: '女皇镇' },
  { id: 'RIVER_VALLEY', code: 'RIVER_VALLEY', name: 'River Valley', nameEn: 'River Valley', nameZh: '里峇峇利', nameLocal: '里峇峇利' },
  { id: 'ROCHOR', code: 'ROCHOR', name: 'Rochor', nameEn: 'Rochor', nameZh: '梧槽', nameLocal: '梧槽' },
  { id: 'SINGAPORE_RIVER', code: 'SINGAPORE_RIVER', name: 'Singapore River', nameEn: 'Singapore River', nameZh: '新加坡河', nameLocal: '新加坡河' },
  { id: 'SOUTHERN_ISLANDS', code: 'SOUTHERN_ISLANDS', name: 'Southern Islands', nameEn: 'Southern Islands', nameZh: '南部岛屿', nameLocal: '南部岛屿' },
  { id: 'STRAITS_VIEW', code: 'STRAITS_VIEW', name: 'Straits View', nameEn: 'Straits View', nameZh: '海峡景', nameLocal: '海峡景' },
  { id: 'TANGLIN', code: 'TANGLIN', name: 'Tanglin', nameEn: 'Tanglin', nameZh: '东陵', nameLocal: '东陵' },
  { id: 'TOA_PAYOH', code: 'TOA_PAYOH', name: 'Toa Payoh', nameEn: 'Toa Payoh', nameZh: '大巴窑', nameLocal: '大巴窑' },

  // East Region (7 planning areas)
  { id: 'BEDOK', code: 'BEDOK', name: 'Bedok', nameEn: 'Bedok', nameZh: '勿洛', nameLocal: '勿洛' },
  { id: 'CHANGI', code: 'CHANGI', name: 'Changi', nameEn: 'Changi', nameZh: '樟宜', nameLocal: '樟宜' },
  { id: 'CHANGI_BAY', code: 'CHANGI_BAY', name: 'Changi Bay', nameEn: 'Changi Bay', nameZh: '樟宜湾', nameLocal: '樟宜湾' },
  { id: 'MARINE_PARADE', code: 'MARINE_PARADE', name: 'Marine Parade', nameEn: 'Marine Parade', nameZh: '马林百列', nameLocal: '马林百列' },
  { id: 'PASIR_RIS', code: 'PASIR_RIS', name: 'Pasir Ris', nameEn: 'Pasir Ris', nameZh: '巴西立', nameLocal: '巴西立' },
  { id: 'PAYA_LEBAR', code: 'PAYA_LEBAR', name: 'Paya Lebar', nameEn: 'Paya Lebar', nameZh: '巴耶利峇', nameLocal: '巴耶利峇' },
  { id: 'TAMPINES', code: 'TAMPINES', name: 'Tampines', nameEn: 'Tampines', nameZh: '淡滨尼', nameLocal: '淡滨尼' },

  // North Region (8 planning areas)
  { id: 'CENTRAL_WATER_CATCHMENT', code: 'CENTRAL_WATER_CATCHMENT', name: 'Central Water Catchment', nameEn: 'Central Water Catchment', nameZh: '中央集水区', nameLocal: '中央集水区' },
  { id: 'LIM_CHU_KANG', code: 'LIM_CHU_KANG', name: 'Lim Chu Kang', nameEn: 'Lim Chu Kang', nameZh: '林厝港', nameLocal: '林厝港' },
  { id: 'MANDAI', code: 'MANDAI', name: 'Mandai', nameEn: 'Mandai', nameZh: '万礼', nameLocal: '万礼' },
  { id: 'SEMBAWANG', code: 'SEMBAWANG', name: 'Sembawang', nameEn: 'Sembawang', nameZh: '三巴旺', nameLocal: '三巴旺' },
  { id: 'SIMPANG', code: 'SIMPANG', name: 'Simpang', nameEn: 'Simpang', nameZh: '新邦', nameLocal: '新邦' },
  { id: 'SUNGEI_KADUT', code: 'SUNGEI_KADUT', name: 'Sungei Kadut', nameEn: 'Sungei Kadut', nameZh: '双溪加株', nameLocal: '双溪加株' },
  { id: 'WOODLANDS', code: 'WOODLANDS', name: 'Woodlands', nameEn: 'Woodlands', nameZh: '兀兰', nameLocal: '兀兰' },
  { id: 'YISHUN', code: 'YISHUN', name: 'Yishun', nameEn: 'Yishun', nameZh: '义顺', nameLocal: '义顺' },

  // North-East Region (7 planning areas)
  { id: 'ANG_MO_KIO', code: 'ANG_MO_KIO', name: 'Ang Mo Kio', nameEn: 'Ang Mo Kio', nameZh: '宏茂桥', nameLocal: '宏茂桥' },
  { id: 'HOUGANG', code: 'HOUGANG', name: 'Hougang', nameEn: 'Hougang', nameZh: '后港', nameLocal: '后港' },
  { id: 'NORTH_EASTERN_ISLANDS', code: 'NORTH_EASTERN_ISLANDS', name: 'North-Eastern Islands', nameEn: 'North-Eastern Islands', nameZh: '东北岛屿', nameLocal: '东北岛屿' },
  { id: 'PUNGGOL', code: 'PUNGGOL', name: 'Punggol', nameEn: 'Punggol', nameZh: '榜鹅', nameLocal: '榜鹅' },
  { id: 'SELETAR', code: 'SELETAR', name: 'Seletar', nameEn: 'Seletar', nameZh: '实里达', nameLocal: '实里达' },
  { id: 'SENGKANG', code: 'SENGKANG', name: 'Sengkang', nameEn: 'Sengkang', nameZh: '盛港', nameLocal: '盛港' },
  { id: 'SERANGOON', code: 'SERANGOON', name: 'Serangoon', nameEn: 'Serangoon', nameZh: '实龙岗', nameLocal: '实龙岗' },

  // West Region (12 planning areas)
  { id: 'BOON_LAY', code: 'BOON_LAY', name: 'Boon Lay', nameEn: 'Boon Lay', nameZh: '文礼', nameLocal: '文礼' },
  { id: 'BUKIT_BATOK', code: 'BUKIT_BATOK', name: 'Bukit Batok', nameEn: 'Bukit Batok', nameZh: '武吉巴督', nameLocal: '武吉巴督' },
  { id: 'BUKIT_PANJANG', code: 'BUKIT_PANJANG', name: 'Bukit Panjang', nameEn: 'Bukit Panjang', nameZh: '武吉班让', nameLocal: '武吉班让' },
  { id: 'CHOA_CHU_KANG', code: 'CHOA_CHU_KANG', name: 'Choa Chu Kang', nameEn: 'Choa Chu Kang', nameZh: '蔡厝港', nameLocal: '蔡厝港' },
  { id: 'CLEMENTI', code: 'CLEMENTI', name: 'Clementi', nameEn: 'Clementi', nameZh: '金文泰', nameLocal: '金文泰' },
  { id: 'JURONG_EAST', code: 'JURONG_EAST', name: 'Jurong East', nameEn: 'Jurong East', nameZh: '裕廊东', nameLocal: '裕廊东' },
  { id: 'JURONG_WEST', code: 'JURONG_WEST', name: 'Jurong West', nameEn: 'Jurong West', nameZh: '裕廊西', nameLocal: '裕廊西' },
  { id: 'PIONEER', code: 'PIONEER', name: 'Pioneer', nameEn: 'Pioneer', nameZh: '先驱', nameLocal: '先驱' },
  { id: 'TENGAH', code: 'TENGAH', name: 'Tengah', nameEn: 'Tengah', nameZh: '登加', nameLocal: '登加' },
  { id: 'TUAS', code: 'TUAS', name: 'Tuas', nameEn: 'Tuas', nameZh: '大士', nameLocal: '大士' },
  { id: 'WESTERN_ISLANDS', code: 'WESTERN_ISLANDS', name: 'Western Islands', nameEn: 'Western Islands', nameZh: '西部岛屿', nameLocal: '西部岛屿' },
  { id: 'WESTERN_WATER_CATCHMENT', code: 'WESTERN_WATER_CATCHMENT', name: 'Western Water Catchment', nameEn: 'Western Water Catchment', nameZh: '西部集水区', nameLocal: '西部集水区' },
];

/**
 * Get display name for a region in bilingual format (English - Chinese)
 * @param {string} code - Region code
 * @returns {string} Bilingual display name
 */
export const getRegionDisplayNameBilingual = (code) => {
  const region = singaporeRegions.find(r => r.code === code);
  if (!region) {
return code;
}
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
