/**
 * Vietnam Location Data
 *
 * Provides location hierarchy data for Vietnam:
 * - Provinces/Cities (Tỉnh/Thành phố)
 * - Districts (Quận/Huyện)
 *
 * Data structure follows the LocationHierarchySelector format
 */

// Vietnam Provinces and Cities (63 in total, showing major ones)
export const vietnamProvinces = [
  // Northern Vietnam
  {
    id: 'HN',
    code: 'HN',
    name: 'Hanoi',
    nameEn: 'Hanoi',
    nameZh: '河内',
    nameVi: 'Hà Nội',
    nameLocal: 'Hà Nội',
    region: 'north',
  },
  {
    id: 'HP',
    code: 'HP',
    name: 'Hai Phong',
    nameEn: 'Hai Phong',
    nameZh: '海防',
    nameVi: 'Hải Phòng',
    nameLocal: 'Hải Phòng',
    region: 'north',
  },
  {
    id: 'QB',
    code: 'QB',
    name: 'Quang Ninh',
    nameEn: 'Quang Ninh',
    nameZh: '广宁',
    nameVi: 'Quảng Ninh',
    nameLocal: 'Quảng Ninh',
    region: 'north',
  },

  // Central Vietnam
  {
    id: 'DN',
    code: 'DN',
    name: 'Da Nang',
    nameEn: 'Da Nang',
    nameZh: '岘港',
    nameVi: 'Đà Nẵng',
    nameLocal: 'Đà Nẵng',
    region: 'central',
  },
  {
    id: 'HUE',
    code: 'HUE',
    name: 'Thua Thien Hue',
    nameEn: 'Thua Thien Hue',
    nameZh: '承天顺化',
    nameVi: 'Thừa Thiên Huế',
    nameLocal: 'Thừa Thiên Huế',
    region: 'central',
  },
  {
    id: 'QN',
    code: 'QN',
    name: 'Quang Nam',
    nameEn: 'Quang Nam',
    nameZh: '广南',
    nameVi: 'Quảng Nam',
    nameLocal: 'Quảng Nam',
    region: 'central',
  },
  {
    id: 'NT',
    code: 'NT',
    name: 'Nha Trang (Khanh Hoa)',
    nameEn: 'Nha Trang (Khanh Hoa)',
    nameZh: '芽庄（庆和）',
    nameVi: 'Nha Trang (Khánh Hòa)',
    nameLocal: 'Nha Trang (Khánh Hòa)',
    region: 'central',
  },

  // Southern Vietnam
  {
    id: 'HCM',
    code: 'HCM',
    name: 'Ho Chi Minh City',
    nameEn: 'Ho Chi Minh City',
    nameZh: '胡志明市',
    nameVi: 'Thành phố Hồ Chí Minh',
    nameLocal: 'Thành phố Hồ Chí Minh',
    region: 'south',
  },
  {
    id: 'VT',
    code: 'VT',
    name: 'Ba Ria-Vung Tau',
    nameEn: 'Ba Ria-Vung Tau',
    nameZh: '巴地头顿',
    nameVi: 'Bà Rịa-Vũng Tàu',
    nameLocal: 'Bà Rịa-Vũng Tàu',
    region: 'south',
  },
  {
    id: 'CT',
    code: 'CT',
    name: 'Can Tho',
    nameEn: 'Can Tho',
    nameZh: '芹苴',
    nameVi: 'Cần Thơ',
    nameLocal: 'Cần Thơ',
    region: 'south',
  },
  {
    id: 'PQ',
    code: 'PQ',
    name: 'Phu Quoc (Kien Giang)',
    nameEn: 'Phu Quoc (Kien Giang)',
    nameZh: '富国岛（坚江）',
    nameVi: 'Phú Quốc (Kiên Giang)',
    nameLocal: 'Phú Quốc (Kiên Giang)',
    region: 'south',
  },
];

// Vietnam Districts (Sample data for major cities)
const vietnamDistricts = [
  // Hanoi Districts
  {
    id: 'HN-HK',
    code: 'HK',
    nameEn: 'Hoan Kiem',
    nameZh: '还剑',
    nameVi: 'Hoàn Kiếm',
    nameLocal: 'Hoàn Kiếm',
    provinceCode: 'HN',
  },
  {
    id: 'HN-BD',
    code: 'BD',
    nameEn: 'Ba Dinh',
    nameZh: '巴亭',
    nameVi: 'Ba Đình',
    nameLocal: 'Ba Đình',
    provinceCode: 'HN',
  },
  {
    id: 'HN-DX',
    code: 'DX',
    nameEn: 'Dong Da',
    nameZh: '栋多',
    nameVi: 'Đống Đa',
    nameLocal: 'Đống Đa',
    provinceCode: 'HN',
  },
  {
    id: 'HN-HBT',
    code: 'HBT',
    nameEn: 'Hai Ba Trung',
    nameZh: '二征夫人',
    nameVi: 'Hai Bà Trưng',
    nameLocal: 'Hai Bà Trưng',
    provinceCode: 'HN',
  },
  {
    id: 'HN-TX',
    code: 'TX',
    nameEn: 'Tay Ho',
    nameZh: '西湖',
    nameVi: 'Tây Hồ',
    nameLocal: 'Tây Hồ',
    provinceCode: 'HN',
  },
  {
    id: 'HN-CG',
    code: 'CG',
    nameEn: 'Cau Giay',
    nameZh: '桥?',
    nameVi: 'Cầu Giấy',
    nameLocal: 'Cầu Giấy',
    provinceCode: 'HN',
  },

  // Ho Chi Minh City Districts
  {
    id: 'HCM-1',
    code: 'Q1',
    nameEn: 'District 1',
    nameZh: '第一郡',
    nameVi: 'Quận 1',
    nameLocal: 'Quận 1',
    provinceCode: 'HCM',
  },
  {
    id: 'HCM-2',
    code: 'Q2',
    nameEn: 'District 2 (Thu Duc)',
    nameZh: '第二郡（守德）',
    nameVi: 'Quận 2 (Thủ Đức)',
    nameLocal: 'Quận 2 (Thủ Đức)',
    provinceCode: 'HCM',
  },
  {
    id: 'HCM-3',
    code: 'Q3',
    nameEn: 'District 3',
    nameZh: '第三郡',
    nameVi: 'Quận 3',
    nameLocal: 'Quận 3',
    provinceCode: 'HCM',
  },
  {
    id: 'HCM-BT',
    code: 'BT',
    nameEn: 'Binh Thanh',
    nameZh: '平盛',
    nameVi: 'Bình Thạnh',
    nameLocal: 'Bình Thạnh',
    provinceCode: 'HCM',
  },
  {
    id: 'HCM-PN',
    code: 'PN',
    nameEn: 'Phu Nhuan',
    nameZh: '富润',
    nameVi: 'Phú Nhuận',
    nameLocal: 'Phú Nhuận',
    provinceCode: 'HCM',
  },
  {
    id: 'HCM-TB',
    code: 'TB',
    nameEn: 'Tan Binh',
    nameZh: '新平',
    nameVi: 'Tân Bình',
    nameLocal: 'Tân Bình',
    provinceCode: 'HCM',
  },

  // Da Nang Districts
  {
    id: 'DN-HC',
    code: 'HC',
    nameEn: 'Hai Chau',
    nameZh: '海洲',
    nameVi: 'Hải Châu',
    nameLocal: 'Hải Châu',
    provinceCode: 'DN',
  },
  {
    id: 'DN-TC',
    code: 'TC',
    nameEn: 'Thanh Khe',
    nameZh: '青溪',
    nameVi: 'Thanh Khê',
    nameLocal: 'Thanh Khê',
    provinceCode: 'DN',
  },
  {
    id: 'DN-SH',
    code: 'SH',
    nameEn: 'Son Tra',
    nameZh: '山茶',
    nameVi: 'Sơn Trà',
    nameLocal: 'Sơn Trà',
    provinceCode: 'DN',
  },
  {
    id: 'DN-NH',
    code: 'NH',
    nameEn: 'Ngu Hanh Son',
    nameZh: '五行山',
    nameVi: 'Ngũ Hành Sơn',
    nameLocal: 'Ngũ Hành Sơn',
    provinceCode: 'DN',
  },

  // Hai Phong Districts
  {
    id: 'HP-HY',
    code: 'HY',
    nameEn: 'Hong Bang',
    nameZh: '鸿庞',
    nameVi: 'Hồng Bàng',
    nameLocal: 'Hồng Bàng',
    provinceCode: 'HP',
  },
  {
    id: 'HP-LC',
    code: 'LC',
    nameEn: 'Le Chan',
    nameZh: '黎真',
    nameVi: 'Lê Chân',
    nameLocal: 'Lê Chân',
    provinceCode: 'HP',
  },
];

/**
 * Get districts by province code
 * @param {string} provinceCode - Province code (e.g., 'HN', 'HCM')
 * @returns {Array} Array of district objects
 */
export function getDistrictsByProvince(provinceCode) {
  if (!provinceCode) return [];
  return vietnamDistricts.filter((district) => district.provinceCode === provinceCode);
}

/**
 * Get province display name in bilingual format
 * @param {string} provinceCode - Province code
 * @returns {string} Province display name
 */
export function getProvinceDisplayName(provinceCode) {
  const province = vietnamProvinces.find((p) => p.code === provinceCode || p.id === provinceCode);
  if (!province) return '';
  return `${province.nameEn} - ${province.nameZh}`;
}

/**
 * Get district display name in bilingual format
 * @param {string} districtId - District ID
 * @returns {string} District display name
 */
export function getDistrictDisplayName(districtId) {
  const district = vietnamDistricts.find((d) => d.id === districtId);
  if (!district) return '';
  return `${district.nameEn} - ${district.nameZh}`;
}

export default {
  vietnamProvinces,
  vietnamDistricts,
  getDistrictsByProvince,
  getProvinceDisplayName,
  getDistrictDisplayName,
};
