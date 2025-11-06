// 入境通 - Nationality Selector Component
import React, { useState, useMemo } from 'react';
import { BaseSearchableSelector } from './tamagui';
import { getDestinationNationalities, getNationalityDisplayName } from '../data/nationalities';
import { useLocale } from '../i18n/LocaleContext';

const NationalitySelector = ({
  label,
  value,
  onValueChange,
  placeholder,
  error,
  errorMessage,
  helpText,
  style,
  showSearch = true,
  ...rest
}) => {
  const { t } = useLocale();
  const defaultPlaceholder = placeholder || t('common.selectNationality', { defaultValue: '请选择国籍' });
  const [nationalities, setNationalities] = useState([]);

  // Load nationalities on mount
  React.useEffect(() => {
    try {
      const result = getDestinationNationalities();
      if (Array.isArray(result) && result.length > 0) {
        setNationalities(result);
      } else {
        console.warn('getDestinationNationalities did not return a valid array:', result);
        setNationalities([]);
      }
    } catch (error) {
      console.error('Error getting nationalities:', error);
      setNationalities([]);
    }
  }, []);

  // Map nationalities to BaseSearchableSelector format
  const options = useMemo(() => {
    return nationalities.map(nat => ({
      label: nat.name || '',
      value: nat.code || '',
      icon: nat.flag || nat.icon,
    }));
  }, [nationalities]);

  // Custom display value function
  const getDisplayValue = (val) => {
    if (!val) return '';
    return getNationalityDisplayName(val);
  };

  return (
    <BaseSearchableSelector
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={defaultPlaceholder}
      getDisplayValue={getDisplayValue}
      showSearch={showSearch}
      searchPlaceholder={t('common.searchNationality', { defaultValue: '搜索国籍...' })}
      modalTitle={t('common.selectNationality', { defaultValue: '选择国籍' })}
      error={error}
      errorMessage={errorMessage}
      helpText={helpText}
      style={style}
      {...rest}
    />
  );
};

export default NationalitySelector;