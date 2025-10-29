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
  placeholder = "请选择职业",
  error,
  errorMessage,
  helpText,
  style,
  showSearch = true,
  customLabel = "请输入您的职业",
  customPlaceholder = "例如：ACCOUNTANT, ENGINEER 等",
  customHelpText = "请用英文填写您的职业",
  ...rest
}) => {
  // Get i18n-enabled occupation options
  const { t } = useLocale();
  const OCCUPATION_OPTIONS = useMemo(() => getOccupationOptions(t), [t]);

  return (
    <BaseSearchableSelector
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={OCCUPATION_OPTIONS || []}
      placeholder={placeholder}
      customValue={customValue}
      onCustomChange={onCustomChange}
      onCustomBlur={onCustomBlur}
      customLabel={customLabel}
      customPlaceholder={customPlaceholder}
      customHelpText={customHelpText}
      showSearch={showSearch}
      searchPlaceholder="搜索职业..."
      modalTitle="选择职业"
      error={error}
      errorMessage={errorMessage}
      helpText={helpText}
      style={style}
      {...rest}
    />
  );
};

export default OccupationSelector;
