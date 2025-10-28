// Thailand District Selector Component
// Displays districts for a given province with bilingual labels

import React, { useMemo, useEffect } from 'react';
import { BaseSearchableSelector } from './tamagui';
import { getDistrictsByProvince } from '../data/thailandLocations';
import { useLocale } from '../i18n/LocaleContext';

const normalize = (value) => (value || '').toLowerCase().trim();

const DistrictSelector = ({
  label,
  provinceCode,
  value,
  selectedDistrictId,
  onSelect,
  placeholder = '请选择区（地区）',
  error,
  errorMessage,
  helpText,
  style,
  showSearch = true,
}) => {
  const { language } = useLocale();
  const isChinese = language?.startsWith('zh');

  const districts = useMemo(() => {
    if (!provinceCode) return [];
    return getDistrictsByProvince(provinceCode);
  }, [provinceCode]);

  const getDisplayLabel = (district) => {
    if (!district) return '';
    const fallback = district.nameTh || district.nameZh || '';
    const secondary = isChinese
      ? district.nameZh || fallback
      : fallback || district.nameZh || '';
    if (!secondary) {
      return district.nameEn;
    }
    return `${district.nameEn} - ${secondary}`;
  };

  // Map districts to BaseSearchableSelector format
  const options = useMemo(() => {
    return districts.map(district => ({
      label: getDisplayLabel(district),
      value: district.id,  // Use district.id as the value
      // Store full district data for onSelect callback
      _districtData: {
        id: district.id,
        nameEn: district.nameEn,
        nameTh: district.nameTh,
        nameZh: district.nameZh,
      },
    }));
  }, [districts, isChinese]);

  // Custom display value function
  const getDisplayValue = (val) => {
    if (!val) return value || '';
    if (!Array.isArray(districts) || districts.length === 0) return value || '';

    const normalizedValue = normalize(value);

    const matched = districts.find((district) => {
      if (!district) return false;
      if (selectedDistrictId && district.id === selectedDistrictId) return true;
      if (val && district.id === val) return true;
      const nameEn = normalize(district.nameEn);
      const nameTh = normalize(district.nameTh);
      const nameZh = normalize(district.nameZh);
      return (
        normalizedValue &&
        (nameEn === normalizedValue || nameTh === normalizedValue || nameZh === normalizedValue)
      );
    });

    if (!matched) return value || '';
    return getDisplayLabel(matched);
  };

  // Wrap onSelect to handle the callback signature
  const handleValueChange = (districtId) => {
    if (!onSelect) return;

    // Find the full district data from options
    const option = options.find(opt => opt.value === districtId);
    if (option && option._districtData) {
      onSelect(option._districtData);
    }
  };

  // Custom filter for bilingual search
  const filterOptions = (opts, search) => {
    if (!search) return opts;
    const lowerSearch = search.toLowerCase();
    return opts.filter(opt => {
      const label = opt.label || '';
      return label.toLowerCase().includes(lowerSearch);
    });
  };

  // Determine current value for BaseSearchableSelector
  const selectorValue = useMemo(() => {
    if (selectedDistrictId) return selectedDistrictId;

    // Try to match value to a district ID
    const normalizedValue = normalize(value);
    const matched = districts.find((district) => {
      const nameEn = normalize(district.nameEn);
      const nameTh = normalize(district.nameTh);
      const nameZh = normalize(district.nameZh);
      return nameEn === normalizedValue || nameTh === normalizedValue || nameZh === normalizedValue;
    });

    return matched ? matched.id : value;
  }, [value, selectedDistrictId, districts]);

  return (
    <BaseSearchableSelector
      label={label}
      value={selectorValue}
      onValueChange={handleValueChange}
      options={options}
      placeholder={!provinceCode ? '请先选择省份' : placeholder}
      getDisplayValue={getDisplayValue}
      filterOptions={filterOptions}
      showSearch={showSearch}
      searchPlaceholder="搜索区（中文或英文）"
      modalTitle="选择区（地区）"
      error={error}
      errorMessage={errorMessage}
      helpText={helpText}
      style={style}
    />
  );
};

export default DistrictSelector;
