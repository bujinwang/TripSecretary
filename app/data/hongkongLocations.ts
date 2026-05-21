/**
 * Hong Kong administrative divisions (Region → District)
 * Hong Kong has 18 districts organized into 3 main regions
 */

// Hong Kong Regions (3 main regions)
export const hongkongRegions = [
  {
    id: 'HONG_KONG_ISLAND',
    code: 'HKI',
    name: 'Hong Kong Island',
    nameEn: 'Hong Kong Island',
    nameZh: '香港岛',
    nameLocal: '香港島',
  },
  {
    id: 'KOWLOON',
    code: 'KLN',
    name: 'Kowloon',
    nameEn: 'Kowloon',
    nameZh: '九龙',
    nameLocal: '九龍',
  },
  {
    id: 'NEW_TERRITORIES',
    code: 'NT',
    name: 'New Territories',
    nameEn: 'New Territories',
    nameZh: '新界',
    nameLocal: '新界',
  },
];

// Hong Kong Districts (18 districts organized by region)
const hongkongDistricts = {
  "HONG_KONG_ISLAND": [
    {
      "id": 1,
      "nameEn": "Central and Western",
      "nameZh": "中西区",
      "postalCode": ""
    },
    {
      "id": 2,
      "nameEn": "Wan Chai",
      "nameZh": "湾仔区",
      "postalCode": ""
    },
    {
      "id": 3,
      "nameEn": "Eastern",
      "nameZh": "东区",
      "postalCode": ""
    },
    {
      "id": 4,
      "nameEn": "Southern",
      "nameZh": "南区",
      "postalCode": ""
    }
  ],
  "KOWLOON": [
    {
      "id": 5,
      "nameEn": "Yau Tsim Mong",
      "nameZh": "油尖旺区",
      "postalCode": ""
    },
    {
      "id": 6,
      "nameEn": "Sham Shui Po",
      "nameZh": "深水埗区",
      "postalCode": ""
    },
    {
      "id": 7,
      "nameEn": "Kowloon City",
      "nameZh": "九龙城区",
      "postalCode": ""
    },
    {
      "id": 8,
      "nameEn": "Wong Tai Sin",
      "nameZh": "黄大仙区",
      "postalCode": ""
    },
    {
      "id": 9,
      "nameEn": "Kwun Tong",
      "nameZh": "观塘区",
      "postalCode": ""
    }
  ],
  "NEW_TERRITORIES": [
    {
      "id": 10,
      "nameEn": "Tsuen Wan",
      "nameZh": "荃湾区",
      "postalCode": ""
    },
    {
      "id": 11,
      "nameEn": "Tuen Mun",
      "nameZh": "屯门区",
      "postalCode": ""
    },
    {
      "id": 12,
      "nameEn": "Yuen Long",
      "nameZh": "元朗区",
      "postalCode": ""
    },
    {
      "id": 13,
      "nameEn": "North",
      "nameZh": "北区",
      "postalCode": ""
    },
    {
      "id": 14,
      "nameEn": "Tai Po",
      "nameZh": "大埔区",
      "postalCode": ""
    },
    {
      "id": 15,
      "nameEn": "Sha Tin",
      "nameZh": "沙田区",
      "postalCode": ""
    },
    {
      "id": 16,
      "nameEn": "Sai Kung",
      "nameZh": "西贡区",
      "postalCode": ""
    },
    {
      "id": 17,
      "nameEn": "Kwai Tsing",
      "nameZh": "葵青区",
      "postalCode": ""
    },
    {
      "id": 18,
      "nameEn": "Islands",
      "nameZh": "离岛区",
      "postalCode": ""
    }
  ]
};

// Sub-districts are not used in Hong Kong (simpler structure)
// Return empty array for compatibility with Thailand's API
export const hongkongSubDistricts = {};

/**
 * Get districts by region (province in Thailand's terminology)
 * @param {string} regionCode - Region code/ID (HONG_KONG_ISLAND, KOWLOON, NEW_TERRITORIES)
 * @returns {Array} - Array of district objects with proper structure
 */
export function getDistrictsByProvince(regionCode) {
  if (!regionCode) {
return [];
}
  const normalizedRegion = regionCode.toUpperCase().replace(/\s+/g, '_');
  const districts = hongkongDistricts[normalizedRegion] || [];

  // Add regionCode and proper structure for LocationHierarchySelector
  return districts.map((district) => ({
    ...district,
    code: `HK-${district.id}`,
    name: district.nameEn,
    nameLocal: district.nameZh,
    regionCode: normalizedRegion,
  }));
}

/**
 * Get sub-districts by district ID
 * Hong Kong doesn't have sub-districts, return empty array for compatibility
 * @param {number} districtId - District ID
 * @returns {Array} - Empty array (no sub-districts in Hong Kong)
 */
export function getSubDistrictsByDistrictId(districtId) {
  // Hong Kong doesn't have sub-districts
  return [];
}

/**
 * Get region display name in bilingual format
 * @param {string} regionCode - Region code
 * @returns {string} Region display name
 */
export function getRegionDisplayName(regionCode) {
  const region = hongkongRegions.find((r) => r.code === regionCode || r.id === regionCode);
  if (!region) {
return '';
}
  return `${region.nameEn} - ${region.nameZh}`;
}

/**
 * Get district display name in bilingual format
 * @param {number|string} districtId - District ID
 * @returns {string} District display name
 */
export function getDistrictDisplayName(districtId) {
  // Search through all regions for the district
  for (const regionKey in hongkongDistricts) {
    const district = hongkongDistricts[regionKey].find((d) => d.id.toString() === districtId.toString());
    if (district) {
      return `${district.nameEn} - ${district.nameZh}`;
    }
  }
  return '';
}

export default {
  hongkongRegions,
  hongkongDistricts,
  hongkongSubDistricts,
  getDistrictsByProvince,
  getSubDistrictsByDistrictId,
  getRegionDisplayName,
  getDistrictDisplayName,
};
