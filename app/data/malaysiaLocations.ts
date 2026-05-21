/**
 * Malaysia Location Data
 * States and major cities/districts (2-level hierarchy)
 */

export const malaysiaStates = [
  // Peninsular Malaysia
  { id: 'JHR', code: 'JHR', name: 'Johor', nameEn: 'Johor', nameZh: '柔佛', nameLocal: 'Johor', nameMs: 'Johor' },
  { id: 'KDH', code: 'KDH', name: 'Kedah', nameEn: 'Kedah', nameZh: '吉打', nameLocal: 'Kedah', nameMs: 'Kedah' },
  { id: 'KTN', code: 'KTN', name: 'Kelantan', nameEn: 'Kelantan', nameZh: '吉兰丹', nameLocal: 'Kelantan', nameMs: 'Kelantan' },
  { id: 'KUL', code: 'KUL', name: 'Kuala Lumpur', nameEn: 'Kuala Lumpur', nameZh: '吉隆坡', nameLocal: 'Kuala Lumpur', nameMs: 'Kuala Lumpur' },
  { id: 'LBN', code: 'LBN', name: 'Labuan', nameEn: 'Labuan', nameZh: '纳闽', nameLocal: 'Labuan', nameMs: 'Labuan' },
  { id: 'MLK', code: 'MLK', name: 'Malacca', nameEn: 'Malacca', nameZh: '马六甲', nameLocal: 'Melaka', nameMs: 'Melaka' },
  { id: 'NSN', code: 'NSN', name: 'Negeri Sembilan', nameEn: 'Negeri Sembilan', nameZh: '森美兰', nameLocal: 'Negeri Sembilan', nameMs: 'Negeri Sembilan' },
  { id: 'PHG', code: 'PHG', name: 'Pahang', nameEn: 'Pahang', nameZh: '彭亨', nameLocal: 'Pahang', nameMs: 'Pahang' },
  { id: 'PNG', code: 'PNG', name: 'Penang', nameEn: 'Penang', nameZh: '槟城', nameLocal: 'Pulau Pinang', nameMs: 'Pulau Pinang' },
  { id: 'PRK', code: 'PRK', name: 'Perak', nameEn: 'Perak', nameZh: '霹雳', nameLocal: 'Perak', nameMs: 'Perak' },
  { id: 'PLS', code: 'PLS', name: 'Perlis', nameEn: 'Perlis', nameZh: '玻璃市', nameLocal: 'Perlis', nameMs: 'Perlis' },
  { id: 'PJY', code: 'PJY', name: 'Putrajaya', nameEn: 'Putrajaya', nameZh: '布城', nameLocal: 'Putrajaya', nameMs: 'Putrajaya' },
  { id: 'SGR', code: 'SGR', name: 'Selangor', nameEn: 'Selangor', nameZh: '雪兰莪', nameLocal: 'Selangor', nameMs: 'Selangor' },
  { id: 'TRG', code: 'TRG', name: 'Terengganu', nameEn: 'Terengganu', nameZh: '登嘉楼', nameLocal: 'Terengganu', nameMs: 'Terengganu' },
  // East Malaysia
  { id: 'SBH', code: 'SBH', name: 'Sabah', nameEn: 'Sabah', nameZh: '沙巴', nameLocal: 'Sabah', nameMs: 'Sabah' },
  { id: 'SWK', code: 'SWK', name: 'Sarawak', nameEn: 'Sarawak', nameZh: '砂拉越', nameLocal: 'Sarawak', nameMs: 'Sarawak' },
];

const malaysiaDistricts = [
  // Kuala Lumpur districts
  { id: 'KUL-1', code: 'KLCC', nameEn: 'KLCC', nameZh: 'KLCC', nameLocal: 'KLCC', stateCode: 'KUL' },
  { id: 'KUL-2', code: 'BUKITBINTANG', nameEn: 'Bukit Bintang', nameZh: '武吉免登', nameLocal: 'Bukit Bintang', stateCode: 'KUL' },
  { id: 'KUL-3', code: 'CHERAS', nameEn: 'Cheras', nameZh: '蕉赖', nameLocal: 'Cheras', stateCode: 'KUL' },
  { id: 'KUL-4', code: 'BANGSAR', nameEn: 'Bangsar', nameZh: '孟沙', nameLocal: 'Bangsar', stateCode: 'KUL' },
  // Penang districts
  { id: 'PNG-1', code: 'GEORGETOWN', nameEn: 'Georgetown', nameZh: '乔治市', nameLocal: 'Georgetown', stateCode: 'PNG' },
  { id: 'PNG-2', code: 'BUTALINGGI', nameEn: 'Batu Feringgi', nameZh: '峇都丁宜', nameLocal: 'Batu Feringgi', stateCode: 'PNG' },
  // Johor districts
  { id: 'JHR-1', code: 'JOHORBAHRU', nameEn: 'Johor Bahru', nameZh: '新山', nameLocal: 'Johor Bahru', stateCode: 'JHR' },
  { id: 'JHR-2', code: 'ISKANDAR', nameEn: 'Iskandar Puteri', nameZh: '依斯干达公主城', nameLocal: 'Iskandar Puteri', stateCode: 'JHR' },
  // Selangor districts
  { id: 'SGR-1', code: 'PETALING', nameEn: 'Petaling Jaya', nameZh: '八打灵再也', nameLocal: 'Petaling Jaya', stateCode: 'SGR' },
  { id: 'SGR-2', code: 'SHAHALAM', nameEn: 'Shah Alam', nameZh: '莎阿南', nameLocal: 'Shah Alam', stateCode: 'SGR' },
  { id: 'SGR-3', code: 'SUBANG', nameEn: 'Subang Jaya', nameZh: '梳邦再也', nameLocal: 'Subang Jaya', stateCode: 'SGR' },
];

export function getDistrictsByState(stateCode) {
  if (!stateCode) {
return [];
}
  return malaysiaDistricts.filter(d => d.stateCode === stateCode).map(d => ({
    ...d,
    name: d.nameEn,
    provinceCode: d.stateCode,
  }));
}

export function getStateDisplayName(stateCode) {
  const state = malaysiaStates.find(s => s.code === stateCode || s.id === stateCode);
  return state ? `${state.nameEn} - ${state.nameZh}` : '';
}

export function getDistrictDisplayName(districtId) {
  const district = malaysiaDistricts.find(d => d.id === districtId);
  return district ? `${district.nameEn} - ${district.nameZh}` : '';
}

export default {
  malaysiaStates,
  malaysiaDistricts,
  getDistrictsByState,
  getStateDisplayName,
  getDistrictDisplayName,
};
