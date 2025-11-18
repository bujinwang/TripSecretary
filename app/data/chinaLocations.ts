export const chinaProvinces = [
  { id: 'BJ', code: 'BJ', nameEn: 'Beijing', nameZh: '北京市', region: 'north' },
  { id: 'SH', code: 'SH', nameEn: 'Shanghai', nameZh: '上海市', region: 'east' },
  { id: 'TJ', code: 'TJ', nameEn: 'Tianjin', nameZh: '天津市', region: 'north' },
  { id: 'CQ', code: 'CQ', nameEn: 'Chongqing', nameZh: '重庆市', region: 'west' },
  { id: 'GD', code: 'GD', nameEn: 'Guangdong', nameZh: '广东省', region: 'south' },
  { id: 'ZS', code: 'ZS', nameEn: 'Zhejiang', nameZh: '浙江省', region: 'east' },
  { id: 'JS', code: 'JS', nameEn: 'Jiangsu', nameZh: '江苏省', region: 'east' },
  { id: 'SD', code: 'SD', nameEn: 'Shandong', nameZh: '山东省', region: 'north' },
  { id: 'SC', code: 'SC', nameEn: 'Sichuan', nameZh: '四川省', region: 'west' },
  { id: 'HB', code: 'HB', nameEn: 'Hubei', nameZh: '湖北省', region: 'central' },
  { id: 'HN', code: 'HN', nameEn: 'Hunan', nameZh: '湖南省', region: 'central' },
  { id: 'HeB', code: 'HeB', nameEn: 'Hebei', nameZh: '河北省', region: 'north' },
  { id: 'HeN', code: 'HeN', nameEn: 'Henan', nameZh: '河南省', region: 'north' },
  { id: 'FJ', code: 'FJ', nameEn: 'Fujian', nameZh: '福建省', region: 'east' },
  { id: 'GX', code: 'GX', nameEn: 'Guangxi', nameZh: '广西壮族自治区', region: 'south' },
  { id: 'YN', code: 'YN', nameEn: 'Yunnan', nameZh: '云南省', region: 'west' },
  { id: 'SN', code: 'SN', nameEn: 'Shaanxi', nameZh: '陕西省', region: 'west' },
  { id: 'LN', code: 'LN', nameEn: 'Liaoning', nameZh: '辽宁省', region: 'north' },
  { id: 'JL', code: 'JL', nameEn: 'Jilin', nameZh: '吉林省', region: 'north' },
  { id: 'HLJ', code: 'HLJ', nameEn: 'Heilongjiang', nameZh: '黑龙江省', region: 'north' },
  { id: 'GZ', code: 'GZ', nameEn: 'Guizhou', nameZh: '贵州省', region: 'west' },
  { id: 'GS', code: 'GS', nameEn: 'Gansu', nameZh: '甘肃省', region: 'west' },
  { id: 'QH', code: 'QH', nameEn: 'Qinghai', nameZh: '青海省', region: 'west' },
  { id: 'NJ', code: 'NJ', nameEn: 'Ningxia', nameZh: '宁夏回族自治区', region: 'west' },
  { id: 'XZ', code: 'XZ', nameEn: 'Tibet', nameZh: '西藏自治区', region: 'west' },
  { id: 'XJ', code: 'XJ', nameEn: 'Xinjiang', nameZh: '新疆维吾尔自治区', region: 'west' },
  { id: 'HAIN', code: 'HAIN', nameEn: 'Hainan', nameZh: '海南省', region: 'south' },
  { id: 'SX', code: 'SX', nameEn: 'Shanxi', nameZh: '山西省', region: 'north' },
  { id: 'AH', code: 'AH', nameEn: 'Anhui', nameZh: '安徽省', region: 'east' },
  { id: 'JX', code: 'JX', nameEn: 'Jiangxi', nameZh: '江西省', region: 'east' },
]

const chinaCities = [
  { id: 'BJ-DC', code: 'DC', nameEn: 'Dongcheng', nameZh: '东城区', provinceCode: 'BJ' },
  { id: 'BJ-XC', code: 'XC', nameEn: 'Xicheng', nameZh: '西城区', provinceCode: 'BJ' },
  { id: 'SH-PD', code: 'PD', nameEn: 'Pudong', nameZh: '浦东新区', provinceCode: 'SH' },
  { id: 'SH-MH', code: 'MH', nameEn: 'Minhang', nameZh: '闵行区', provinceCode: 'SH' },
  { id: 'GD-GZ', code: 'GZ', nameEn: 'Guangzhou', nameZh: '广州市', provinceCode: 'GD' },
  { id: 'GD-SZ', code: 'SZ', nameEn: 'Shenzhen', nameZh: '深圳市', provinceCode: 'GD' },
  { id: 'SC-CD', code: 'CD', nameEn: 'Chengdu', nameZh: '成都市', provinceCode: 'SC' },
  { id: 'HB-WH', code: 'WH', nameEn: 'Wuhan', nameZh: '武汉市', provinceCode: 'HB' },
  { id: 'FJ-XM', code: 'XM', nameEn: 'Xiamen', nameZh: '厦门市', provinceCode: 'FJ' },
]

export function getDistrictsByProvince(provinceCode) {
  if (!provinceCode) return []
  return chinaCities.filter((c) => c.provinceCode === provinceCode)
}

export default { chinaProvinces, getDistrictsByProvince }