// 入境通 - Travel Purpose Selector Component
import React, { useState, useMemo } from 'react';
import { BaseSearchableSelector } from './tamagui';
import {
  getBasicTravelPurposes,
  getJapanTravelPurposes,
  getThailandTravelPurposes,
  getTravelPurposeDisplayName,
  normalizeTravelPurpose
} from '../data/travelPurposes';

const TravelPurposeSelector = ({
  label,
  value,
  onValueChange,
  placeholder = "请选择旅行目的",
  error,
  errorMessage,
  helpText,
  style,
  showSearch = true,
  locale = 'zh',
  purposeType = 'basic', // 'basic', 'japan', 'thailand'
  // Custom input props when OTHER is selected
  otherValue,
  onOtherValueChange,
  ...rest
}) => {
  const [travelPurposes, setTravelPurposes] = useState([]);

  // Normalize locale (e.g., 'zh-CN' -> 'zh', 'en-US' -> 'en')
  const normalizedLocale = React.useMemo(() => {
    if (!locale) return 'en';
    const parts = locale.split('-');
    return parts[0]; // Return just the language code without country
  }, [locale]);

  // Load travel purposes on mount
  React.useEffect(() => {
    try {
      let purposes = [];
      switch (purposeType) {
        case 'japan':
          purposes = getJapanTravelPurposes(normalizedLocale);
          break;
        case 'thailand':
          purposes = getThailandTravelPurposes(normalizedLocale);
          break;
        default: // 'basic'
          purposes = getBasicTravelPurposes(normalizedLocale);
          break;
      }

      if (Array.isArray(purposes) && purposes.length > 0) {
        setTravelPurposes(purposes);
      } else {
        console.warn('getTravelPurposes did not return a valid array:', purposes);
        setTravelPurposes([]);
      }
    } catch (error) {
      console.error('Error getting travel purposes:', error);
      setTravelPurposes([]);
    }
  }, [purposeType, normalizedLocale]);

  // Map travel purposes to BaseSearchableSelector format
  const options = useMemo(() => {
    return travelPurposes.map(purpose => ({
      label: purpose.name || '',
      value: purpose.code || '',
    }));
  }, [travelPurposes]);

  // Custom display value function
  const getDisplayValue = (val, customVal) => {
    if (!val) return '';

    // If OTHER is selected and there's custom text, show the custom text
    if (val === 'OTHER' && customVal && onOtherValueChange) {
      return customVal;
    }

    return getTravelPurposeDisplayName(val, normalizedLocale);
  };

  // Wrap onValueChange to normalize the value
  const handleValueChange = (val) => {
    const normalizedValue = normalizeTravelPurpose(val);
    onValueChange(normalizedValue);
  };

  return (
    <BaseSearchableSelector
      label={label}
      value={value}
      onValueChange={handleValueChange}
      options={options}
      placeholder={placeholder}
      getDisplayValue={getDisplayValue}
      customValue={otherValue}
      onCustomChange={onOtherValueChange}
      customLabel={locale === 'zh' ? "请输入旅行目的详情" : "Please enter travel purpose details"}
      customPlaceholder={locale === 'zh' ? "请输入旅行目的详情" : "Please enter travel purpose details"}
      showSearch={showSearch}
      searchPlaceholder="搜索旅行目的..."
      modalTitle="选择旅行目的"
      error={error}
      errorMessage={errorMessage}
      helpText={helpText}
      style={style}
      {...rest}
    />
  );
};

export default TravelPurposeSelector;
