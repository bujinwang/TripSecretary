/**
 * Japan Location Data
 *
 * Contains prefectures and cities data for Japan.
 * Used by the location data loader for Japan travel forms.
 */

/**
 * Japan Prefectures (47 prefectures)
 * Each prefecture has code, name, and Chinese name
 */
export const japanPrefectures = [
  { code: '01', id: '01', name: 'Hokkaido', nameZh: '北海道' },
  { code: '02', id: '02', name: 'Aomori', nameZh: '青森县' },
  { code: '03', id: '03', name: 'Iwate', nameZh: '岩手县' },
  { code: '04', id: '04', name: 'Miyagi', nameZh: '宫城县' },
  { code: '05', id: '05', name: 'Akita', nameZh: '秋田县' },
  { code: '06', id: '06', name: 'Yamagata', nameZh: '山形县' },
  { code: '07', id: '07', name: 'Fukushima', nameZh: '福岛县' },
  { code: '08', id: '08', name: 'Ibaraki', nameZh: '茨城县' },
  { code: '09', id: '09', name: 'Tochigi', nameZh: '栃木县' },
  { code: '10', id: '10', name: 'Gunma', nameZh: '群马县' },
  { code: '11', id: '11', name: 'Saitama', nameZh: '埼玉县' },
  { code: '12', id: '12', name: 'Chiba', nameZh: '千叶县' },
  { code: '13', id: '13', name: 'Tokyo', nameZh: '东京都' },
  { code: '14', id: '14', name: 'Kanagawa', nameZh: '神奈川县' },
  { code: '15', id: '15', name: 'Niigata', nameZh: '新潟县' },
  { code: '16', id: '16', name: 'Toyama', nameZh: '富山县' },
  { code: '17', id: '17', name: 'Ishikawa', nameZh: '石川县' },
  { code: '18', id: '18', name: 'Fukui', nameZh: '福井县' },
  { code: '19', id: '19', name: 'Yamanashi', nameZh: '山梨县' },
  { code: '20', id: '20', name: 'Nagano', nameZh: '长野县' },
  { code: '21', id: '21', name: 'Gifu', nameZh: '岐阜县' },
  { code: '22', id: '22', name: 'Shizuoka', nameZh: '静冈县' },
  { code: '23', id: '23', name: 'Aichi', nameZh: '爱知县' },
  { code: '24', id: '24', name: 'Mie', nameZh: '三重县' },
  { code: '25', id: '25', name: 'Shiga', nameZh: '滋贺县' },
  { code: '26', id: '26', name: 'Kyoto', nameZh: '京都府' },
  { code: '27', id: '27', name: 'Osaka', nameZh: '大阪府' },
  { code: '28', id: '28', name: 'Hyogo', nameZh: '兵库县' },
  { code: '29', id: '29', name: 'Nara', nameZh: '奈良县' },
  { code: '30', id: '30', name: 'Wakayama', nameZh: '和歌山县' },
  { code: '31', id: '31', name: 'Tottori', nameZh: '鸟取县' },
  { code: '32', id: '32', name: 'Shimane', nameZh: '岛根县' },
  { code: '33', id: '33', name: 'Okayama', nameZh: '冈山县' },
  { code: '34', id: '34', name: 'Hiroshima', nameZh: '广岛县' },
  { code: '35', id: '35', name: 'Yamaguchi', nameZh: '山口县' },
  { code: '36', id: '36', name: 'Tokushima', nameZh: '德岛县' },
  { code: '37', id: '37', name: 'Kagawa', nameZh: '香川县' },
  { code: '38', id: '38', name: 'Ehime', nameZh: '爱媛县' },
  { code: '39', id: '39', name: 'Kochi', nameZh: '高知县' },
  { code: '40', id: '40', name: 'Fukuoka', nameZh: '福冈县' },
  { code: '41', id: '41', name: 'Saga', nameZh: '佐贺县' },
  { code: '42', id: '42', name: 'Nagasaki', nameZh: '长崎县' },
  { code: '43', id: '43', name: 'Kumamoto', nameZh: '熊本县' },
  { code: '44', id: '44', name: 'Oita', nameZh: '大分县' },
  { code: '45', id: '45', name: 'Miyazaki', nameZh: '宫崎县' },
  { code: '46', id: '46', name: 'Kagoshima', nameZh: '鹿儿岛县' },
  { code: '47', id: '47', name: 'Okinawa', nameZh: '冲绳县' },
];

/**
 * Get cities by prefecture code
 * Returns cities for the specified prefecture
 *
 * @param {string} prefectureCode - Prefecture code (e.g., '13' for Tokyo)
 * @returns {Array} Array of cities in the prefecture
 */
export const getCitiesByPrefecture = (prefectureCode) => {
  // This is a simplified implementation
  // In a real app, you'd have a comprehensive database of cities
  // For now, return some major cities for each prefecture

  const citiesByPrefecture = {
    '13': [ // Tokyo
      { id: 'tokyo-shinjuku', nameEn: 'Shinjuku', nameZh: '新宿' },
      { id: 'tokyo-shibuya', nameEn: 'Shibuya', nameZh: '涩谷' },
      { id: 'tokyo-ginza', nameEn: 'Ginza', nameZh: '银座' },
      { id: 'tokyo-asakusa', nameEn: 'Asakusa', nameZh: '浅草' },
    ],
    '27': [ // Osaka
      { id: 'osaka-namba', nameEn: 'Namba', nameZh: '难波' },
      { id: 'osaka-umeda', nameEn: 'Umeda', nameZh: '梅田' },
      { id: 'osaka-shinsaibashi', nameEn: 'Shinsaibashi', nameZh: '心斋桥' },
    ],
    '26': [ // Kyoto
      { id: 'kyoto-kiyomizu', nameEn: 'Kiyomizu', nameZh: '清水' },
      { id: 'kyoto-gion', nameEn: 'Gion', nameZh: '祇园' },
      { id: 'kyoto-arashiyama', nameEn: 'Arashiyama', nameZh: '岚山' },
    ],
    '40': [ // Fukuoka
      { id: 'fukuoka-tenjin', nameEn: 'Tenjin', nameZh: '天神' },
      { id: 'fukuoka-hakata', nameEn: 'Hakata', nameZh: '博多' },
    ],
    '23': [ // Aichi (Nagoya)
      { id: 'nagoya-sakae', nameEn: 'Sakae', nameZh: '荣' },
      { id: 'nagoya-nakamura', nameEn: 'Nakamura', nameZh: '中村' },
    ],
    '14': [ // Kanagawa (Yokohama)
      { id: 'yokohama-minato', nameEn: 'Minato Mirai', nameZh: '港未来' },
      { id: 'yokohama-chinatown', nameEn: 'Chinatown', nameZh: '中华街' },
    ],
    '01': [ // Hokkaido (Sapporo)
      { id: 'sapporo-odori', nameEn: 'Odori', nameZh: '大通' },
      { id: 'sapporo-susukino', nameEn: 'Susukino', nameZh: '薄野' },
    ],
  };

  // Return cities for the prefecture, or empty array if not found
  return citiesByPrefecture[prefectureCode] || [];
};

/**
 * Get prefecture name by code
 * @param {string} code - Prefecture code
 * @returns {string} Prefecture name or code if not found
 */
export const getPrefectureName = (code) => {
  const prefecture = japanPrefectures.find(p => p.code === code);
  return prefecture ? prefecture.name : code;
};

/**
 * Get prefecture Chinese name by code
 * @param {string} code - Prefecture code
 * @returns {string} Prefecture Chinese name or code if not found
 */
export const getPrefectureNameZh = (code) => {
  const prefecture = japanPrefectures.find(p => p.code === code);
  return prefecture ? prefecture.nameZh : code;
};

export default {
  japanPrefectures,
  getCitiesByPrefecture,
  getPrefectureName,
  getPrefectureNameZh,
};