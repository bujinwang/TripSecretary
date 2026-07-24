import React, { useMemo } from 'react';
import { BaseSearchableSelector } from './tamagui';
import type { BaseSearchableSelectorProps } from './tamagui';
import { getOccupationOptions } from '../screens/thailand/constants';
import { useLocale } from '../i18n/LocaleContext';

export interface OccupationSelectorProps
  extends Omit<BaseSearchableSelectorProps, 'options' | 'getDisplayValue' | 'searchPlaceholder' | 'modalTitle'> {
  value?: string | null;
  onValueChange: (value: string) => void;
  customValue?: string;
  onCustomChange?: (value: string) => void;
  onCustomBlur?: () => void;
  placeholder?: string;
  customLabel?: string;
  customPlaceholder?: string;
  customHelpText?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  modalTitle?: string;
}

const OccupationSelector: React.FC<OccupationSelectorProps> = ({
  label,
  value,
  onValueChange,
  customValue,
  onCustomChange,
  onCustomBlur,
  placeholder,
  error,
  errorMessage,
  helpText,
  style,
  showSearch = true,
  customLabel,
  customPlaceholder,
  customHelpText,
  searchPlaceholder,
  modalTitle,
  ...rest
}) => {
  const { t } = useLocale();
  const occupationOptions = useMemo(() => getOccupationOptions(t), [t]);

  const defaultPlaceholder = placeholder ?? t('common.selectOccupation', { defaultValue: '请选择职业' });
  const defaultCustomLabel = customLabel ?? t('common.enterOccupation', { defaultValue: '请输入您的职业' });
  const defaultCustomPlaceholder =
    customPlaceholder ?? t('common.occupationExample', { defaultValue: '例如：ACCOUNTANT, ENGINEER 等' });
  const defaultCustomHelpText = customHelpText ?? t('common.occupationHelp', { defaultValue: '请用英文填写您的职业' });
  const effectiveSearchPlaceholder =
    searchPlaceholder ?? t('common.searchOccupation', { defaultValue: '搜索职业...' });
  const effectiveModalTitle = modalTitle ?? t('common.selectOccupation', { defaultValue: '选择职业' });

  return (
    <BaseSearchableSelector
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={occupationOptions ?? []}
      placeholder={defaultPlaceholder}
      customValue={customValue}
      onCustomChange={onCustomChange}
      onCustomBlur={onCustomBlur}
      customLabel={defaultCustomLabel}
      customPlaceholder={defaultCustomPlaceholder}
      customHelpText={defaultCustomHelpText}
      showSearch={showSearch}
      searchPlaceholder={effectiveSearchPlaceholder}
      modalTitle={effectiveModalTitle}
      error={error}
      errorMessage={errorMessage}
      helpText={helpText}
      style={style}
      {...rest}
    />
  );
};

export default OccupationSelector;

