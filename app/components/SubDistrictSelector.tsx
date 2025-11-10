import React, { useMemo } from 'react';
import { BaseSearchableSelector } from './tamagui';
import type { BaseSearchableSelectorProps, FilterOptionsFn, GetDisplayValueFn, SearchableOption } from './tamagui';
import { useLocale } from '../i18n/LocaleContext';

const normalize = (value?: string | null) => (value ?? '').toLowerCase().trim();

export interface SubDistrictRecord {
  id: string;
  nameEn: string;
  nameTh?: string;
  nameZh?: string;
  postalCode?: string;
  [key: string]: unknown;
}

interface SubDistrictOption extends SearchableOption {
  _subDistrictData: SubDistrictRecord;
}

export interface SubDistrictSelectorProps
  extends Omit<
    BaseSearchableSelectorProps,
    'options' | 'getDisplayValue' | 'filterOptions' | 'onValueChange' | 'searchPlaceholder' | 'modalTitle'
  > {
  districtId?: string | null;
  value?: string | null;
  selectedSubDistrictId?: string | null;
  onSelect?: (subDistrict: SubDistrictRecord) => void;
  getSubDistrictsFunc: (districtId: string) => SubDistrictRecord[] | null | undefined;
  placeholder?: string;
  searchPlaceholder?: string;
  modalTitle?: string;
}

const SubDistrictSelector: React.FC<SubDistrictSelectorProps> = ({
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
  getSubDistrictsFunc,
  searchPlaceholder = '搜索乡 / 街道（名称或邮编）',
  modalTitle = '选择乡 / 街道',
  ...rest
}) => {
  const { language } = useLocale();
  const isChinese = language?.startsWith('zh') ?? false;

  const subDistricts = useMemo<SubDistrictRecord[]>(() => {
    if (!districtId) {
      return [];
    }
    if (!getSubDistrictsFunc) {
      console.error('SubDistrictSelector: getSubDistrictsFunc prop is required but was not provided');
      return [];
    }
    const result = getSubDistrictsFunc(districtId);
    return Array.isArray(result) ? result : [];
  }, [districtId, getSubDistrictsFunc]);

  const getDisplayLabel = (subDistrict?: SubDistrictRecord | null) => {
    if (!subDistrict) {
      return '';
    }
    const fallback = subDistrict.nameTh ?? subDistrict.nameZh ?? '';
    const secondary = isChinese ? subDistrict.nameZh ?? fallback : fallback ?? subDistrict.nameZh ?? '';
    const labelText = secondary ? `${subDistrict.nameEn} - ${secondary}` : subDistrict.nameEn;
    const postalDisplay = subDistrict.postalCode ? `（邮编：${subDistrict.postalCode}）` : '';
    return `${labelText}${postalDisplay}`;
  };

  const options = useMemo<SubDistrictOption[]>(() => {
    return subDistricts.map((subDistrict) => ({
      label: getDisplayLabel(subDistrict),
      value: subDistrict.id,
      _subDistrictData: {
        id: subDistrict.id,
        nameEn: subDistrict.nameEn,
        nameTh: subDistrict.nameTh,
        nameZh: subDistrict.nameZh,
        postalCode: subDistrict.postalCode,
      },
    }));
  }, [subDistricts, isChinese]);

  const getDisplayValue: GetDisplayValueFn = (val) => {
    if (!val) {
      return value ?? '';
    }
    if (!Array.isArray(subDistricts) || subDistricts.length === 0) {
      return value ?? '';
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
        normalizedValue !== '' &&
        (nameEn === normalizedValue || nameTh === normalizedValue || nameZh === normalizedValue)
      );
    });

    if (!matched) {
      return value ?? '';
    }
    return getDisplayLabel(matched);
  };

  const handleValueChange = (subDistrictId: string) => {
    if (!onSelect) {
      return;
    }

    const option = options.find((opt) => opt.value === subDistrictId);
    if (option) {
      onSelect(option._subDistrictData);
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
    if (selectedSubDistrictId) {
      return selectedSubDistrictId;
    }

    const normalizedValue = normalize(value);
    const matched = subDistricts.find((subDistrict) => {
      const nameEn = normalize(subDistrict.nameEn);
      const nameTh = normalize(subDistrict.nameTh);
      const nameZh = normalize(subDistrict.nameZh);
      return (
        nameEn === normalizedValue ||
        nameTh === normalizedValue ||
        nameZh === normalizedValue
      );
    });

    return matched ? matched.id : value ?? '';
  }, [value, selectedSubDistrictId, subDistricts]);

  const effectivePlaceholder = districtId ? placeholder : '请先选择区（地区）';

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

export default SubDistrictSelector;

