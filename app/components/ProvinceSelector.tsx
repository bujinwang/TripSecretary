import React, { useMemo } from 'react';
import { BaseSearchableSelector } from './tamagui';
import type { BaseSearchableSelectorProps, FilterOptionsFn, GetDisplayValueFn, SearchableOption } from './tamagui';

export interface RegionRecord {
  id?: string;
  code?: string;
  name: string;
  nameZh: string;
  [key: string]: unknown;
}

export interface ProvinceSelectorProps
  extends Omit<BaseSearchableSelectorProps, 'options' | 'getDisplayValue' | 'filterOptions' | 'onValueChange'> {
  value?: string | null;
  onValueChange: (value: string) => void;
  regionsData: RegionRecord[];
  getDisplayNameFunc?: ((value: string) => string) | null;
  placeholder?: string;
  modalTitle?: string;
  searchPlaceholder?: string;
}

const ProvinceSelector: React.FC<ProvinceSelectorProps> = ({
  label,
  value,
  onValueChange,
  placeholder = '请选择省份',
  error,
  errorMessage,
  helpText,
  style,
  showSearch = true,
  regionsData,
  getDisplayNameFunc = null,
  modalTitle = '选择省份',
  searchPlaceholder = '搜索省份（中文或英文）',
  ...rest
}) => {
  const provinces = useMemo<RegionRecord[]>(() => {
    if (!regionsData) {
      console.error('ProvinceSelector: regionsData prop is required but was not provided');
      return [];
    }

    if (!Array.isArray(regionsData)) {
      console.warn('ProvinceSelector: regionsData is not a valid array:', regionsData);
      return [];
    }

    return regionsData;
  }, [regionsData]);

  const options = useMemo<SearchableOption[]>(() => {
    return provinces.map((province) => ({
      label: `${province.name} - ${province.nameZh}`,
      value: String(province.code ?? province.id ?? ''),
    }));
  }, [provinces]);

  const getDisplayValue: GetDisplayValueFn = (val) => {
    if (!val) {
      return '';
    }

    if (getDisplayNameFunc) {
      return getDisplayNameFunc(val);
    }

    const province = provinces.find((p) => p.code === val || p.id === val);
    if (province) {
      return `${province.name} - ${province.nameZh}`;
    }

    return val;
  };

  const filterOptions: FilterOptionsFn = (opts, search) => {
    if (!search) {
      return opts;
    }
    const lowerSearch = search.toLowerCase();
    return opts.filter((opt) => {
      const label = opt.label ?? '';
      const optionValue = opt.value ?? '';
      return label.toLowerCase().includes(lowerSearch) || optionValue.toLowerCase().includes(lowerSearch);
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

