/**
 * Thailand Location Helpers
 *
 * Utility functions for working with Thailand location data including
 * provinces, districts, and sub-districts. Handles multi-language matching
 * and normalization of location values.
 */

import { getDistrictsByProvince, getSubDistrictsByDistrictId } from '../../data/thailandLocations';

/**
 * Normalizes a location value for comparison by trimming whitespace and
 * converting to lowercase.
 *
 * @param {string|number|null|undefined} value - The value to normalize
 * @returns {string} The normalized value
 *
 * @example
 * normalizeLocationValue("  Bangkok  ")
 * // Returns: "bangkok"
 *
 * @example
 * normalizeLocationValue(null)
 * // Returns: ""
 */
export const normalizeLocationValue = (value) => {
  return (value || '').toString().trim().toLowerCase();
};

/**
 * Finds a district option by matching against English, Thai, and Chinese names.
 *
 * @param {string} provinceCode - The province code to search within
 * @param {string} targetValue - The district name to search for
 * @returns {Object|null} The matching district object or null if not found
 *
 * @example
 * findDistrictOption("10", "Bang Rak")
 * // Returns: { id: "1001", nameEn: "Bang Rak", nameTh: "บางรัก", nameZh: "邦拉", provinceCode: "10" }
 *
 * @example
 * findDistrictOption("10", "บางรัก")
 * // Returns: { id: "1001", nameEn: "Bang Rak", nameTh: "บางรัก", nameZh: "邦拉", provinceCode: "10" }
 */
export const findDistrictOption = (provinceCode, targetValue) => {
  if (!provinceCode || !targetValue) {
    return null;
  }

  const districts = getDistrictsByProvince(provinceCode);

  if (!Array.isArray(districts) || districts.length === 0) {
    return null;
  }

  const normalized = normalizeLocationValue(targetValue);

  return (
    districts.find((district) => {
      if (!district) {
return false;
}

      const nameEn = normalizeLocationValue(district.nameEn);
      const nameTh = normalizeLocationValue(district.nameTh);
      const nameZh = normalizeLocationValue(district.nameZh);

      return normalized === nameEn || normalized === nameTh || normalized === nameZh;
    }) || null
  );
};

/**
 * Finds a sub-district option by matching against English, Thai, and Chinese names.
 *
 * @param {string} districtId - The district ID to search within
 * @param {string} targetValue - The sub-district name to search for
 * @returns {Object|null} The matching sub-district object or null if not found
 *
 * @example
 * findSubDistrictOption("1001", "Silom")
 * // Returns: { id: "100101", nameEn: "Silom", nameTh: "สีลม", nameZh: "是隆", districtId: "1001" }
 *
 * @example
 * findSubDistrictOption("1001", "สีลม")
 * // Returns: { id: "100101", nameEn: "Silom", nameTh: "สีลม", nameZh: "是隆", districtId: "1001" }
 */
export const findSubDistrictOption = (districtId, targetValue) => {
  if (!districtId || !targetValue) {
    return null;
  }

  const subDistricts = getSubDistrictsByDistrictId(districtId);

  if (!Array.isArray(subDistricts) || subDistricts.length === 0) {
    return null;
  }

  const normalized = normalizeLocationValue(targetValue);

  return (
    subDistricts.find((subDistrict) => {
      if (!subDistrict) {
return false;
}

      const nameEn = normalizeLocationValue(subDistrict.nameEn);
      const nameTh = normalizeLocationValue(subDistrict.nameTh);
      const nameZh = normalizeLocationValue(subDistrict.nameZh);

      return normalized === nameEn || normalized === nameTh || normalized === nameZh;
    }) || null
  );
};

/**
 * Gets the localized name of a district based on the current locale.
 *
 * @param {Object} district - The district object
 * @param {string} locale - The locale code ('en', 'th', 'zh')
 * @returns {string} The localized district name
 *
 * @example
 * getLocalizedDistrictName({ nameEn: "Bang Rak", nameTh: "บางรัก", nameZh: "邦拉" }, "zh")
 * // Returns: "邦拉"
 */
export const getLocalizedDistrictName = (district, locale = 'en') => {
  if (!district) {
return '';
}

  const localeMap = {
    en: district.nameEn,
    th: district.nameTh,
    zh: district.nameZh,
  };

  return localeMap[locale] || district.nameEn || '';
};

/**
 * Gets the localized name of a sub-district based on the current locale.
 *
 * @param {Object} subDistrict - The sub-district object
 * @param {string} locale - The locale code ('en', 'th', 'zh')
 * @returns {string} The localized sub-district name
 *
 * @example
 * getLocalizedSubDistrictName({ nameEn: "Silom", nameTh: "สีลม", nameZh: "是隆" }, "zh")
 * // Returns: "是隆"
 */
export const getLocalizedSubDistrictName = (subDistrict, locale = 'en') => {
  if (!subDistrict) {
return '';
}

  const localeMap = {
    en: subDistrict.nameEn,
    th: subDistrict.nameTh,
    zh: subDistrict.nameZh,
  };

  return localeMap[locale] || subDistrict.nameEn || '';
};

export default {
  normalizeLocationValue,
  findDistrictOption,
  findSubDistrictOption,
  getLocalizedDistrictName,
  getLocalizedSubDistrictName,
};
