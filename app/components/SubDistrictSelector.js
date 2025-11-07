// Sub-District Selector Component
// Displays sub-districts (tambon) for a given district with postal codes
//
// ⚠️ IMPORTANT: getSubDistrictsFunc prop is REQUIRED
// This component is country-agnostic and does not have default data.

import React, { useMemo } from 'react';
import { BaseSearchableSelector } from './tamagui';
import { useLocale } from '../i18n/LocaleContext';

const normalize = (value) => (value || '').toLowerCase().trim();

const SubDistrictSelector = ({
  label,
  districtId,
  value,
  selectedSubDistrictId,
  onSelect,
  placeholder = '请选择乡 / 街道',
  error,
  errorMessage,
  helpText,
  showSearch = true,
  style,
  getSubDistrictsFunc, // ⚠️ REQUIRED: Function to get sub-districts for a district
}) => {
  const { language } = useLocale();
  const isChinese = language?.startsWith('zh');

  const subDistricts = useMemo(() => {
    if (!districtId) {
return [];
}
    if (!getSubDistrictsFunc) {
      console.error('❌ SubDistrictSelector: getSubDistrictsFunc prop is required but was not provided');
      return [];
    }
    return getSubDistrictsFunc(districtId);
  }, [districtId, getSubDistrictsFunc]);

  const getDisplayLabel = (subDistrict) => {
    if (!subDistrict) {
return '';
}
    const fallback = subDistrict.nameTh || subDistrict.nameZh || '';
    const secondary = isChinese
      ? subDistrict.nameZh || fallback
      : fallback || subDistrict.nameZh || '';
    const label = secondary ? `${subDistrict.nameEn} - ${secondary}` : subDistrict.nameEn;
    const postalDisplay = subDistrict.postalCode ? `（邮编：${subDistrict.postalCode}）` : '';
    return `${label}${postalDisplay}`;
  };

  // Map sub-districts to BaseSearchableSelector format
  const options = useMemo(() => {
    return subDistricts.map(subDistrict => ({
      label: getDisplayLabel(subDistrict),
      value: subDistrict.id,
      // Store full sub-district data for onSelect callback
      _subDistrictData: {
        id: subDistrict.id,
        nameEn: subDistrict.nameEn,
        nameTh: subDistrict.nameTh,
        nameZh: subDistrict.nameZh,
        postalCode: subDistrict.postalCode,
      },
    }));
  }, [subDistricts, isChinese]);

  // Custom display value function
  const getDisplayValue = (val) => {
    if (!val) {
return value || '';
}
    if (!Array.isArray(subDistricts) || subDistricts.length === 0) {
return value || '';
}

    const normalizedValue = normalize(value);

    const matched = subDistricts.find((subDistrict) => {
      if (!subDistrict) {
return false;
}
      if (selectedSubDistrictId && subDistrict.id === selectedSubDistrictId) {
return true;
}
      if (val && subDistrict.id === val) {
return true;
}
      const nameEn = normalize(subDistrict.nameEn);
      const nameTh = normalize(subDistrict.nameTh);
      const nameZh = normalize(subDistrict.nameZh);
      return (
        normalizedValue &&
        (nameEn === normalizedValue || nameTh === normalizedValue || nameZh === normalizedValue)
      );
    });

    if (!matched) {
return value || '';
}
    return getDisplayLabel(matched);
  };

  // Wrap onSelect to handle the callback signature
  const handleValueChange = (subDistrictId) => {
    if (!onSelect) {
return;
}

    // Find the full sub-district data from options
    const option = options.find(opt => opt.value === subDistrictId);
    if (option && option._subDistrictData) {
      onSelect(option._subDistrictData);
    }
  };

  // Custom filter for bilingual search (including postal codes)
  const filterOptions = (opts, search) => {
    if (!search) {
return opts;
}
    const lowerSearch = search.toLowerCase();
    return opts.filter(opt => {
      const label = opt.label || '';
      return label.toLowerCase().includes(lowerSearch);
    });
  };

  // Determine current value for BaseSearchableSelector
  const selectorValue = useMemo(() => {
    if (selectedSubDistrictId) {
return selectedSubDistrictId;
}

    // Try to match value to a sub-district ID
    const normalizedValue = normalize(value);
    const matched = subDistricts.find((subDistrict) => {
      const nameEn = normalize(subDistrict.nameEn);
      const nameTh = normalize(subDistrict.nameTh);
      const nameZh = normalize(subDistrict.nameZh);
      return nameEn === normalizedValue || nameTh === normalizedValue || nameZh === normalizedValue;
    });

    return matched ? matched.id : value;
  }, [value, selectedSubDistrictId, subDistricts]);

  return (
    <BaseSearchableSelector
      label={label}
      value={selectorValue}
      onValueChange={handleValueChange}
      options={options}
      placeholder={!districtId ? '请先选择区（地区）' : placeholder}
      getDisplayValue={getDisplayValue}
      filterOptions={filterOptions}
      showSearch={showSearch}
      searchPlaceholder="搜索乡 / 街道（名称或邮编）"
      modalTitle="选择乡 / 街道"
      error={error}
      errorMessage={errorMessage}
      helpText={helpText}
      style={style}
    />
  );
};

export default SubDistrictSelector;
