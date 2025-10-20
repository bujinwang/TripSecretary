/**
 * China Province Validator
 * Provides helpers for validating and normalizing Chinese province-level inputs.
 */

const normalize = (value = '') =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export const CHINA_PROVINCES = [
  { code: 'ANHUI', displayName: 'Anhui', aliases: ['anhui', 'anhui province'] },
  { code: 'BEIJING', displayName: 'Beijing', aliases: ['beijing', 'beijing municipality', 'beijing city'] },
  { code: 'CHONGQING', displayName: 'Chongqing', aliases: ['chongqing', 'chongqing municipality', 'chongqing city'] },
  { code: 'FUJIAN', displayName: 'Fujian', aliases: ['fujian', 'fujian province'] },
  { code: 'GANSU', displayName: 'Gansu', aliases: ['gansu', 'gansu province'] },
  { code: 'GUANGDONG', displayName: 'Guangdong', aliases: ['guangdong', 'guangdong province'] },
  { code: 'GUANGXI', displayName: 'Guangxi', aliases: ['guangxi', 'guangxi zhuang autonomous region'] },
  { code: 'GUIZHOU', displayName: 'Guizhou', aliases: ['guizhou', 'guizhou province'] },
  { code: 'HAINAN', displayName: 'Hainan', aliases: ['hainan', 'hainan province'] },
  { code: 'HEBEI', displayName: 'Hebei', aliases: ['hebei', 'hebei province'] },
  { code: 'HEILONGJIANG', displayName: 'Heilongjiang', aliases: ['heilongjiang', 'heilongjiang province'] },
  { code: 'HENAN', displayName: 'Henan', aliases: ['henan', 'henan province'] },
  { code: 'HUBEI', displayName: 'Hubei', aliases: ['hubei', 'hubei province'] },
  { code: 'HUNAN', displayName: 'Hunan', aliases: ['hunan', 'hunan province'] },
  { code: 'JIANGSU', displayName: 'Jiangsu', aliases: ['jiangsu', 'jiangsu province'] },
  { code: 'JIANGXI', displayName: 'Jiangxi', aliases: ['jiangxi', 'jiangxi province'] },
  { code: 'JILIN', displayName: 'Jilin', aliases: ['jilin', 'jilin province'] },
  { code: 'LIAONING', displayName: 'Liaoning', aliases: ['liaoning', 'liaoning province'] },
  {
    code: 'INNER_MONGOLIA',
    displayName: 'Inner Mongolia',
    aliases: ['inner mongolia', 'inner mongolia autonomous region', 'nei mongol', 'nei mongol autonomous region'],
  },
  { code: 'NINGXIA', displayName: 'Ningxia', aliases: ['ningxia', 'ningxia hui autonomous region'] },
  { code: 'QINGHAI', displayName: 'Qinghai', aliases: ['qinghai', 'qinghai province'] },
  { code: 'SHAANXI', displayName: 'Shaanxi', aliases: ['shaanxi', 'shaanxi province'] },
  { code: 'SHANDONG', displayName: 'Shandong', aliases: ['shandong', 'shandong province'] },
  { code: 'SHANGHAI', displayName: 'Shanghai', aliases: ['shanghai', 'shanghai municipality', 'shanghai city'] },
  { code: 'SHANXI', displayName: 'Shanxi', aliases: ['shanxi', 'shanxi province'] },
  { code: 'SICHUAN', displayName: 'Sichuan', aliases: ['sichuan', 'sichuan province'] },
  { code: 'TIANJIN', displayName: 'Tianjin', aliases: ['tianjin', 'tianjin municipality', 'tianjin city'] },
  {
    code: 'TIBET',
    displayName: 'Tibet',
    aliases: ['tibet', 'tibet autonomous region', 'xizang', 'xizang autonomous region'],
  },
  {
    code: 'XINJIANG',
    displayName: 'Xinjiang',
    aliases: ['xinjiang', 'xinjiang uyghur autonomous region', 'xinjiang uygur autonomous region'],
  },
  { code: 'YUNNAN', displayName: 'Yunnan', aliases: ['yunnan', 'yunnan province'] },
  { code: 'ZHEJIANG', displayName: 'Zhejiang', aliases: ['zhejiang', 'zhejiang province'] },
  {
    code: 'HONG_KONG',
    displayName: 'Hong Kong',
    aliases: ['hong kong', 'hong kong sar', 'hong kong special administrative region'],
  },
  {
    code: 'MACAO',
    displayName: 'Macau',
    aliases: ['macau', 'macao', 'macau sar', 'macao sar', 'macau special administrative region', 'macao special administrative region'],
  },
  { code: 'TAIWAN', displayName: 'Taiwan', aliases: ['taiwan', 'taiwan province'] },
];

/**
 * Find the province definition that matches the provided input.
 * @param {string} value - User provided province text.
 * @returns {object|null} Province definition when matched.
 */
export const findChinaProvince = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const normalizedValue = normalize(value);

  return CHINA_PROVINCES.find((province) =>
    province.aliases.some((alias) => normalize(alias) === normalizedValue)
  ) || null;
};

/**
 * Check whether the provided value represents a valid Chinese province-level division.
 * @param {string} value - User provided province text.
 * @returns {boolean}
 */
export const isValidChinaProvince = (value) => !!findChinaProvince(value);

/**
 * Normalize a Chinese province input to its display name when possible.
 * @param {string} value - User provided province text.
 * @returns {string} Canonical display name or the original value.
 */
export const normalizeChinaProvinceName = (value) => {
  const match = findChinaProvince(value);
  return match ? match.displayName : (value || '');
};

export default {
  CHINA_PROVINCES,
  findChinaProvince,
  isValidChinaProvince,
  normalizeChinaProvinceName,
};
