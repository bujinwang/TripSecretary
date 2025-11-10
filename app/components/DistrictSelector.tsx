import React, { useMemo } from 'react';
import { BaseSearchableSelector } from './tamagui';
import type { BaseSearchableSelectorProps, FilterOptionsFn, GetDisplayValueFn, SearchableOption } from './tamagui';
import { useLocale } from '../i18n/LocaleContext';

const normalize = (value?: string | null) => (value ?? '').toLowerCase().trim();

export interface DistrictRecord {
  id: string;
  nameEn: string;
  nameTh?: string;
  nameZh?: string;
  [key: string]: unknown;
}

interface DistrictOption extends SearchableOption {
  _districtData: DistrictRecord;
}

export interface DistrictSelectorProps
  extends Omit<
    BaseSearchableSelectorProps,
    'options' | 'getDisplayValue' | 'filterOptions' | 'onValueChange' | 'searchPlaceholder' | 'modalTitle'
  > {
  provinceCode?: string | null;
  value?: string | null;
  selectedDistrictId?: string | null;
  onSelect?: (district: DistrictRecord) => void;
  getDistrictsFunc: (provinceCode: string) => DistrictRecord[] | null | undefined;
  placeholder?: string;
  searchPlaceholder?: string;
  modalTitle?: string;
}

const DistrictSelector: React.FC<DistrictSelectorProps> = ({
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
  getDistrictsFunc,
  searchPlaceholder = '搜索区（中文或英文）',
  modalTitle = '选择区（地区）',
  ...rest
}) => {
  const { language } = useLocale();
  const isChinese = language?.startsWith('zh') ?? false;

  const districts = useMemo<DistrictRecord[]>(() => {
    if (!provinceCode) {
      return [];
    }
    if (!getDistrictsFunc) {
      console.error('DistrictSelector: getDistrictsFunc prop is required but was not provided');
      return [];
    }
    const result = getDistrictsFunc(provinceCode);
    return Array.isArray(result) ? result : [];
  }, [provinceCode, getDistrictsFunc]);

  const getDisplayLabel = (district?: DistrictRecord | null) => {
    if (!district) {
      return '';
    }
    const fallback = district.nameTh ?? district.nameZh ?? '';
    const secondary = isChinese ? district.nameZh ?? fallback : fallback ?? district.nameZh ?? '';
    if (!secondary) {
      return district.nameEn;
    }
    return `${district.nameEn} - ${secondary}`;
  };

  const options = useMemo<DistrictOption[]>(() => {
    return districts.map((district) => ({
      label: getDisplayLabel(district),
      value: district.id,
      _districtData: {
        id: district.id,
        nameEn: district.nameEn,
        nameTh: district.nameTh,
        nameZh: district.nameZh,
      },
    }));
  }, [districts, isChinese]);

  const getDisplayValue: GetDisplayValueFn = (val) => {
    if (!val) {
      return value ?? '';
    }
    if (!Array.isArray(districts) || districts.length === 0) {
      return value ?? '';
    }

    const normalizedValue = normalize(value);

    const matched = districts.find((district) => {
      if (!district) {
        return false;
      }
      if (selectedDistrictId && district.id === selectedDistrictId) {
        return true;
      }
      if (val && district.id === val) {
        return true;
      }
      const nameEn = normalize(district.nameEn);
      const nameTh = normalize(district.nameTh);
      const nameZh = normalize(district.nameZh);
      return (
        normalizedValue !== '' &&
        (nameEn === normalizedValue || nameTh === normalizedValue || nameZh === normalizedValue)
      );
    });

    if (!matched) {
      return value ?? '';
    }
    return getDisplayLabel(matched);
  };

  const handleValueChange = (districtId: string) => {
    if (!onSelect) {
      return;
    }

    const option = options.find((opt) => opt.value === districtId);
    if (option) {
      onSelect(option._districtData);
    }
  };

  const filterOptions: FilterOptionsFn = (opts, search) => {
    if (!search) {
      return opts;
    }
    const lowerSearch = search.toLowerCase();
    return opts.filter((opt) => {
      const label = opt.label ?? '';
      return label.toLowerCase().includes(lowerSearch);
    });
  };

  const selectorValue = useMemo(() => {
    if (selectedDistrictId) {
      return selectedDistrictId;
    }

    const normalizedValue = normalize(value);
    const matched = districts.find((district) => {
      const nameEn = normalize(district.nameEn);
      const nameTh = normalize(district.nameTh);
      const nameZh = normalize(district.nameZh);
      return (
        nameEn === normalizedValue ||
        nameTh === normalizedValue ||
        nameZh === normalizedValue
      );
    });

    return matched ? matched.id : value ?? '';
  }, [value, selectedDistrictId, districts]);

  const effectivePlaceholder = provinceCode ? placeholder : '请先选择省份';

  return (
    <BaseSearchableSelector
      label={label}
      value={selectorValue}
      onValueChange={handleValueChange}
      options={options}
      placeholder={effectivePlaceholder}
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

export default DistrictSelector;

