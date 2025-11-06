// 入境通 - Passport Name Input Component
// Provides three separate fields for surname, optional middle name, and given name.
// Supports both fully-controlled usage (individual name parts) and a combined full name value.

import React, { useEffect, useMemo, useState } from 'react';
import {
  YStack,
  XStack,
  Input,
  Text as TamaguiText,
} from '../tamagui';
import {
  formatPassportFullName,
  normalizePassportNameParts,
  parsePassportFullName,
} from '../utils/passportNameUtils';

const PassportNameInput = ({
  label,
  surname,
  middleName,
  givenName,
  onSurnameChange,
  onMiddleNameChange,
  onGivenNameChange,
  value,
  onChangeText,
  onBlur,
  error,
  errorMessage,
  helpText,
  style,
  // Configurable labels
  surnameLabel = '姓',
  middleNameLabel = '中间名（可选）',
  givenNameLabel = '名',
  surnamePlaceholder = 'LI',
  middleNamePlaceholder = '可选',
  givenNamePlaceholder = 'MAOA',
  ...rest
}) => {
  const [surnameError, setSurnameError] = useState('');
  const [middleNameError, setMiddleNameError] = useState('');
  const [givenNameError, setGivenNameError] = useState('');

  const usesCombinedValue =
    !onSurnameChange && !onMiddleNameChange && !onGivenNameChange && typeof onChangeText === 'function';

  const parsedFromValue = useMemo(() => {
    if (!usesCombinedValue) {
      return { surname: '', middleName: '', givenName: '' };
    }
    return normalizePassportNameParts(parsePassportFullName(value || ''));
  }, [usesCombinedValue, value]);

  const [localSurname, setLocalSurname] = useState(parsedFromValue.surname);
  const [localMiddleName, setLocalMiddleName] = useState(parsedFromValue.middleName);
  const [localGivenName, setLocalGivenName] = useState(parsedFromValue.givenName);

  useEffect(() => {
    if (usesCombinedValue) {
      setLocalSurname(parsedFromValue.surname);
      setLocalMiddleName(parsedFromValue.middleName);
      setLocalGivenName(parsedFromValue.givenName);
    }
  }, [parsedFromValue, usesCombinedValue]);

  const currentSurname = usesCombinedValue ? localSurname : (surname || '');
  const currentMiddleName = usesCombinedValue ? localMiddleName : (middleName || '');
  const currentGivenName = usesCombinedValue ? localGivenName : (givenName || '');

  const propagateCombinedChange = (nextSurname, nextMiddleName, nextGivenName) => {
    if (typeof onChangeText === 'function') {
      const formatted = formatPassportFullName({
        surname: nextSurname,
        middleName: nextMiddleName,
        givenName: nextGivenName,
      });
      onChangeText(formatted);
    }
  };

  // Validation function to check if input contains only A-Z letters
  const validateLettersOnly = (text) => {
    const lettersOnlyRegex = /^[A-Za-z]*$/;
    return lettersOnlyRegex.test(text);
  };

  const renderNameField = ({
    labelText,
    value: fieldValue,
    onChange,
    setError,
    errorFlag,
    placeholderText,
  }) => (
    <YStack flex={1} alignItems="flex-start">
      <YStack minHeight={32} justifyContent="flex-start" marginBottom="$xs">
        <TamaguiText
          fontSize="$1"
          color="$textSecondary"
          fontWeight="600"
          numberOfLines={2}
        >
          {labelText}
        </TamaguiText>
      </YStack>
      <Input
        value={fieldValue}
        onChangeText={(text) => {
          if (validateLettersOnly(text)) {
            const normalized = text.toUpperCase();
            onChange(normalized);
            setError('');
          } else if (text.length > 0) {
            setError('仅限A-Z字母');
          } else {
            onChange(text);
            setError('');
          }
        }}
        onBlur={onBlur}
        placeholder={placeholderText}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        keyboardType="ascii-capable"
        height={48}
        borderWidth={1}
        borderColor={error || errorFlag ? '$danger' : '$borderColor'}
        backgroundColor="$background"
        fontSize="$2"
        color="$text"
        {...rest}
      />
    </YStack>
  );

  return (
    <YStack marginBottom="$md" style={style}>
      {label && (
        <TamaguiText fontSize="$2" color="$text" marginBottom="$xs">
          {label}
        </TamaguiText>
      )}

      <XStack gap="$sm" alignItems="flex-start">
        {renderNameField({
          labelText: surnameLabel,
          value: currentSurname,
          onChange: (text) => {
            if (onSurnameChange) {
              onSurnameChange(text);
            } else {
              setLocalSurname(text);
              propagateCombinedChange(text, currentMiddleName, currentGivenName);
            }
          },
          setError: setSurnameError,
          errorFlag: surnameError,
          placeholderText: surnamePlaceholder,
        })}

        {renderNameField({
          labelText: middleNameLabel,
          value: currentMiddleName,
          onChange: (text) => {
            if (onMiddleNameChange) {
              onMiddleNameChange(text);
            } else {
              setLocalMiddleName(text);
              propagateCombinedChange(currentSurname, text, currentGivenName);
            }
          },
          setError: setMiddleNameError,
          errorFlag: middleNameError,
          placeholderText: middleNamePlaceholder,
        })}

        {renderNameField({
          labelText: givenNameLabel,
          value: currentGivenName,
          onChange: (text) => {
            if (onGivenNameChange) {
              onGivenNameChange(text);
            } else {
              setLocalGivenName(text);
              propagateCombinedChange(currentSurname, currentMiddleName, text);
            }
          },
          setError: setGivenNameError,
          errorFlag: givenNameError,
          placeholderText: givenNamePlaceholder,
        })}
      </XStack>

      {error && errorMessage && (
        <TamaguiText fontSize="$1" color="$danger" marginTop="$xs">
          {errorMessage}
        </TamaguiText>
      )}
      {surnameError && (
        <TamaguiText fontSize="$1" color="$danger" marginTop="$xs">
          {surnameError}
        </TamaguiText>
      )}
      {middleNameError && (
        <TamaguiText fontSize="$1" color="$danger" marginTop="$xs">
          {middleNameError}
        </TamaguiText>
      )}
      {givenNameError && (
        <TamaguiText fontSize="$1" color="$danger" marginTop="$xs">
          {givenNameError}
        </TamaguiText>
      )}
      {!helpText && (
        <TamaguiText fontSize="$1" color="$textSecondary" marginTop="$xs">
          请填写汉语拼音姓名（例如：LI, MAOA 或 LI, MARIE, MAOA）- 仅限A-Z字母
        </TamaguiText>
      )}
    </YStack>
  );
};

export default PassportNameInput;
