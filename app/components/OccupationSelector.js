// 入境通 - Occupation Selector Component
import React, { useMemo } from 'react';
import { BaseSearchableSelector } from './tamagui';
import { getOccupationOptions } from '../screens/thailand/constants';
import { useLocale } from '../i18n/LocaleContext';

const OccupationSelector = ({
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
  ...rest
}) => {
  // Get i18n-enabled occupation options
  const { t } = useLocale();
  const OCCUPATION_OPTIONS = useMemo(() => getOccupationOptions(t), [t]);
  
  // Default i18n values
  const defaultPlaceholder = placeholder || t('common.selectOccupation', { defaultValue: '请选择职业' });
  const defaultCustomLabel = customLabel || t('common.enterOccupation', { defaultValue: '请输入您的职业' });
  const defaultCustomPlaceholder = customPlaceholder || t('common.occupationExample', { defaultValue: '例如：ACCOUNTANT, ENGINEER 等' });
  const defaultCustomHelpText = customHelpText || t('common.occupationHelp', { defaultValue: '请用英文填写您的职业' });

  return (
    <BaseSearchableSelector
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={OCCUPATION_OPTIONS || []}
      placeholder={defaultPlaceholder}
      customValue={customValue}
      onCustomChange={onCustomChange}
      onCustomBlur={onCustomBlur}
      customLabel={defaultCustomLabel}
      customPlaceholder={defaultCustomPlaceholder}
      customHelpText={defaultCustomHelpText}
      showSearch={showSearch}
      searchPlaceholder={t('common.searchOccupation', { defaultValue: '搜索职业...' })}
      modalTitle={t('common.selectOccupation', { defaultValue: '选择职业' })}
      error={error}
      errorMessage={errorMessage}
      helpText={helpText}
      style={style}
      {...rest}
    />
  );
};

export default OccupationSelector;
