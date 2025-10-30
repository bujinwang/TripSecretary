// 入境通 - Region/Province Selector Component
// Dropdown selector for regions/provinces with bilingual display (English - Chinese)
// Supports different country data sources
//
// ⚠️ IMPORTANT: regionsData prop is REQUIRED
// This component is country-agnostic and does not have default data.

import React, { useState, useMemo } from 'react';
import { BaseSearchableSelector } from './tamagui';

const ProvinceSelector = ({
  label,
  value,
  onValueChange,
  placeholder = "请选择省份",
  error,
  errorMessage,
  helpText,
  style,
  showSearch = true,
  regionsData, // ⚠️ REQUIRED: Regions data for the destination country
  getDisplayNameFunc = null, // Custom display name function
  modalTitle = "选择省份", // Custom modal title
  searchPlaceholder = "搜索省份（中文或英文）", // Custom search placeholder
  ...rest
}) => {
  const [provinces, setProvinces] = useState([]);

  // Load provinces on mount
  React.useEffect(() => {
    // Validate regionsData is provided
    if (!regionsData) {
      console.error('❌ ProvinceSelector: regionsData prop is required but was not provided');
      setProvinces([]);
      return;
    }

    try {
      const dataSource = regionsData;

      if (Array.isArray(dataSource) && dataSource.length > 0) {
        setProvinces(dataSource);
      } else {
        console.warn('⚠️ Regions data is not a valid array:', dataSource);
        setProvinces([]);
      }
    } catch (error) {
      console.error('Error loading regions:', error);
      setProvinces([]);
    }
  }, [regionsData]);

  // Map provinces to BaseSearchableSelector format with bilingual labels
  const options = useMemo(() => {
    return provinces.map(province => ({
      label: `${province.name} - ${province.nameZh}`,
      value: province.code || province.id || '',
    }));
  }, [provinces]);

  // Custom display value function
  const getDisplayValue = (val) => {
    if (!val) return '';

    // Use custom display function if provided
    if (getDisplayNameFunc) {
      return getDisplayNameFunc(val);
    }

    // Default: find and format from regionsData
    const province = provinces.find(p => p.code === val || p.id === val);
    if (province) {
      return `${province.name} - ${province.nameZh}`;
    }

    return val;
  };

  // Custom filter function for bilingual search
  const filterOptions = (opts, search) => {
    if (!search) return opts;
    const lowerSearch = search.toLowerCase();
    return opts.filter(opt => {
      // Search in the bilingual label
      const label = opt.label || '';
      const value = opt.value || '';
      return label.toLowerCase().includes(lowerSearch) ||
             value.toLowerCase().includes(lowerSearch);
    });
  };

  return (
    <BaseSearchableSelector
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      getDisplayValue={getDisplayValue}
      filterOptions={filterOptions}
      showSearch={showSearch}
      searchPlaceholder={searchPlaceholder}
      modalTitle={modalTitle}
      error={error}
      errorMessage={errorMessage}
      helpText={helpText}
      style={style}
      {...rest}
    />
  );
};

export default ProvinceSelector;
