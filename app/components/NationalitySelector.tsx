import React, { useEffect, useMemo, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { BaseSearchableSelector } from './tamagui';
import type { BaseSearchableSelectorProps, SearchableOption } from './tamagui';
import { getDestinationNationalities, getNationalityDisplayName } from '../data/nationalities';
import { useLocale } from '../i18n/LocaleContext';

interface RawNationality {
  code?: string;
  name?: string;
  flag?: string;
  icon?: string;
}

export interface NationalitySelectorProps
  extends Omit<
    BaseSearchableSelectorProps,
    'options' | 'getDisplayValue' | 'searchPlaceholder' | 'modalTitle' | 'onBlur' | 'onValueChange'
  > {
  label?: BaseSearchableSelectorProps['label'];
  value?: string | null;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  helpText?: string;
  style?: StyleProp<ViewStyle>;
  showSearch?: boolean;
  searchPlaceholder?: string;
  modalTitle?: string;
  optional?: boolean;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
}

const mapToOption = (record: RawNationality): SearchableOption | null => {
  const label = record.name ?? '';
  const value = record.code ?? '';

  if (!label || !value) {
    return null;
  }

  return {
    label,
    value,
    icon: record.flag ?? record.icon,
  };
};

const NationalitySelector: React.FC<NationalitySelectorProps> = ({
  label,
  value,
  onValueChange,
  placeholder,
  error,
  errorMessage,
  helpText,
  style,
  showSearch = true,
  searchPlaceholder,
  modalTitle,
  optional = false,
  onChange,
  onBlur,
  ...otherProps
}) => {
  const { t } = useLocale();

  const [options, setOptions] = useState<SearchableOption[]>([]);

  useEffect(() => {
    try {
      const result = getDestinationNationalities() as unknown;

      if (!Array.isArray(result)) {
        console.warn('[NationalitySelector] getDestinationNationalities did not return an array:', result);
        setOptions([]);
        return;
      }

      const mapped = result
        .map((item) => mapToOption(item as RawNationality))
        .filter((item): item is SearchableOption => Boolean(item));

      setOptions(mapped);
    } catch (err) {
      console.error('[NationalitySelector] Failed to load nationalities:', err);
      setOptions([]);
    }
  }, []);

  const defaultPlaceholder = useMemo(
    () => placeholder ?? t('common.selectNationality', { defaultValue: '请选择国籍' }),
    [placeholder, t],
  );

  const effectiveSearchPlaceholder = useMemo(
    () => searchPlaceholder ?? t('common.searchNationality', { defaultValue: '搜索国籍...' }),
    [searchPlaceholder, t],
  );

  const effectiveModalTitle = useMemo(
    () => modalTitle ?? t('common.selectNationality', { defaultValue: '选择国籍' }),
    [modalTitle, t],
  );

  const getDisplayValue = (val: string | null | undefined) => {
    if (!val) {
      return '';
    }
    return getNationalityDisplayName(val);
  };

  const displayLabel = useMemo(() => {
    if (!optional || !label) {
      return label;
    }

    if (typeof label === 'string') {
      return `${label}（可选）`;
    }

    if (typeof label === 'object' && label !== null && 'label' in label) {
      return {
        ...label,
        label: `${label.label ?? ''}（可选）`,
      };
    }

    return label;
  }, [label, optional]);

  const optionalHelpText = useMemo(() => {
    if (!optional) {
      return helpText;
    }
    return helpText ?? t('common.optionalField', { defaultValue: '此字段为可选项' });
  }, [helpText, optional, t]);

  const handleSelectionChange = (code: string) => {
    onValueChange?.(code);
    onChange?.(code);
    if (onBlur) {
      setTimeout(() => onBlur(code), 0);
    }
  };

  return (
    <BaseSearchableSelector
      label={displayLabel}
      value={value}
      onValueChange={handleSelectionChange}
      options={options}
      placeholder={defaultPlaceholder}
      getDisplayValue={(val, _custom, allOptions) =>
        getDisplayValue(val) || allOptions.find((item) => item.value === val)?.label || ''
      }
      showSearch={showSearch}
      searchPlaceholder={effectiveSearchPlaceholder}
      modalTitle={effectiveModalTitle}
      error={error}
      errorMessage={errorMessage}
      helpText={optionalHelpText}
      style={style}
      {...otherProps}
    />
  );
};

export default NationalitySelector;

