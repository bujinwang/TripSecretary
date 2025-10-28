// 入境通 - Accommodation Type Selector Component
import React from 'react';
import { BaseSearchableSelector } from './tamagui';

const AccommodationTypeSelector = ({
  label,
  value,
  options = [],
  onValueChange,
  placeholder = 'Select accommodation type',
  error,
  errorMessage,
  helpText,
  style,
  modalTitle = 'Select accommodation type',
  showSearch = false,
  searchPlaceholder = 'Search accommodation types...',
  ...rest
}) => {

  return (
    <BaseSearchableSelector
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
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

export default AccommodationTypeSelector;
