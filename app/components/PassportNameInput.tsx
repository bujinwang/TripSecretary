import React, { useEffect, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { YStack, XStack, Input as TamaguiInput, Text as TamaguiText } from '../tamagui';
import {
  formatPassportFullName,
  normalizePassportNameParts,
  parsePassportFullName,
} from '../utils/passportNameUtils';

type TamaguiInputProps = ComponentProps<typeof TamaguiInput>;

export interface PassportNameInputProps {
  label?: string;
  surname?: string;
  middleName?: string;
  givenName?: string;
  onSurnameChange?: (value: string) => void;
  onMiddleNameChange?: (value: string) => void;
  onGivenNameChange?: (value: string) => void;
  value?: string;
  onChangeText?: (value: string) => void;
  onBlur?: (value?: string) => void;
  error?: boolean;
  errorMessage?: string;
  warning?: string;
  helpText?: string;
  style?: StyleProp<ViewStyle>;
  surnameLabel?: string;
  middleNameLabel?: string;
  givenNameLabel?: string;
  surnamePlaceholder?: string;
  middleNamePlaceholder?: string;
  givenNamePlaceholder?: string;
  placeholder?: string;
  isLastEdited?: boolean;
  inputProps?: Omit<TamaguiInputProps, 'value' | 'onChangeText' | 'onBlur'>;
}

interface RenderNameFieldArgs {
  labelText: string;
  value: string;
  onChange: (value: string) => void;
  setError: (value: string) => void;
  errorFlag: string;
  placeholderText: string;
}

const lettersOnlyRegex = /^[A-Za-z]*$/;

const PassportNameInput: React.FC<PassportNameInputProps> = ({
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
  warning,
  helpText,
  style,
  placeholder,
  isLastEdited = false,
  surnameLabel = '姓',
  middleNameLabel = '中间名（可选）',
  givenNameLabel = '名',
  surnamePlaceholder = 'LI',
  middleNamePlaceholder = '可选',
  givenNamePlaceholder = 'MAOA',
  inputProps,
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
    return normalizePassportNameParts(parsePassportFullName(value ?? ''));
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

  const currentSurname = usesCombinedValue ? localSurname : surname ?? '';
  const currentMiddleName = usesCombinedValue ? localMiddleName : middleName ?? '';
  const currentGivenName = usesCombinedValue ? localGivenName : givenName ?? '';

  const propagateCombinedChange = (nextSurname: string, nextMiddleName: string, nextGivenName: string) => {
    if (typeof onChangeText === 'function') {
      const formatted = formatPassportFullName({
        surname: nextSurname,
        middleName: nextMiddleName,
        givenName: nextGivenName,
      });
      onChangeText(formatted);
    }
  };

  const renderNameField = ({
    labelText,
    value: fieldValue,
    onChange,
    setError,
    errorFlag,
    placeholderText,
  }: RenderNameFieldArgs) => (
    <YStack flex={1} minWidth={0} alignItems="flex-start">
      <YStack minHeight={32} justifyContent="flex-start" marginBottom="$xs">
        <TamaguiText fontSize="$1" color="$textSecondary" fontWeight="600" numberOfLines={2}>
          {labelText}
        </TamaguiText>
      </YStack>
      <TamaguiInput
        value={fieldValue}
        onChangeText={(text) => {
          if (lettersOnlyRegex.test(text)) {
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
        onBlur={() => onBlur?.(fieldValue)}
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
        width="100%"
        {...inputProps}
      />
    </YStack>
  );

  return (
    <YStack
      marginBottom="$md"
      style={style}
      backgroundColor={isLastEdited ? '#f0f8ff' : undefined}
      borderRadius={isLastEdited ? 8 : undefined}
      padding={isLastEdited ? 8 : undefined}
    >
      {label ? (
        <TamaguiText fontSize="$2" color="$text" marginBottom="$xs">
          {label}
          {isLastEdited ? ' ✨' : ''}
        </TamaguiText>
      ) : null}

      <XStack gap="$sm" alignItems="flex-start" width="100%">
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
          placeholderText: placeholder ?? surnamePlaceholder,
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
          placeholderText: placeholder ?? givenNamePlaceholder,
        })}
      </XStack>

      {error && errorMessage ? (
        <TamaguiText fontSize="$1" color="$danger" marginTop="$xs">
          {errorMessage}
        </TamaguiText>
      ) : null}
      {warning && !error ? (
        <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
          {warning}
        </TamaguiText>
      ) : null}
      {surnameError ? (
        <TamaguiText fontSize="$1" color="$danger" marginTop="$xs">
          {surnameError}
        </TamaguiText>
      ) : null}
      {middleNameError ? (
        <TamaguiText fontSize="$1" color="$danger" marginTop="$xs">
          {middleNameError}
        </TamaguiText>
      ) : null}
      {givenNameError ? (
        <TamaguiText fontSize="$1" color="$danger" marginTop="$xs">
          {givenNameError}
        </TamaguiText>
      ) : null}
      {helpText ? (
        <TamaguiText fontSize="$1" color="$textSecondary" marginTop="$xs">
          {helpText}
        </TamaguiText>
      ) : (
        <TamaguiText fontSize="$1" color="$textSecondary" marginTop="$xs">
          请填写汉语拼音姓名（例如：LI, MAOA 或 LI, MARIE, MAOA）- 仅限A-Z字母
        </TamaguiText>
      )}
    </YStack>
  );
};

export default PassportNameInput;

