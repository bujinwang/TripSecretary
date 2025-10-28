// 入境通 - Region/Province Selector Component
// Dropdown selector for regions/provinces with bilingual display (English - Chinese)
// Supports different country data sources

import React, { useState, useMemo } from 'react';
import { BaseSearchableSelector } from './tamagui';
import { thailandProvinces, getProvinceDisplayNameBilingual } from '../data/thailandProvinces';

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
  regionsData = null, // Custom regions data for different countries
  getDisplayNameFunc = null, // Custom display name function
  modalTitle = "选择省份", // Custom modal title
  searchPlaceholder = "搜索省份（中文或英文）", // Custom search placeholder
  ...rest
}) => {
  const [provinces, setProvinces] = useState([]);

  // Load provinces on mount
  React.useEffect(() => {
    try {
      // Use custom regionsData if provided, otherwise fall back to thailandProvinces
      const dataSource = regionsData || thailandProvinces;

      if (Array.isArray(dataSource) && dataSource.length > 0) {
        setProvinces(dataSource);
      } else {
        console.warn('Regions data is not a valid array:', dataSource);
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
      value: province.code || '',
    }));
  }, [provinces]);

  // Custom display value function
  const getDisplayValue = (val) => {
    if (!val) return '';
    // Use custom display function if provided, otherwise use default Thailand function
    if (getDisplayNameFunc) {
      return getDisplayNameFunc(val);
    }
    return getProvinceDisplayNameBilingual(val);
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
