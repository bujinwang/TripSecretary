import React, { useState } from 'react';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';
import { TextInput } from 'react-native';
import { YStack, Input as TamaguiInput, Text as TamaguiText } from '../tamagui';

export type MaskType = 'date-ymd';

export interface InputProps
  extends Omit<TextInputProps, 'style' | 'value' | 'onChangeText' | 'onBlur'> {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: (value: string) => void;
  error?: boolean;
  errorMessage?: string;
  helpText?: string;
  maskType?: MaskType;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  isLastEdited?: boolean;
  required?: boolean;
}

const Input = React.forwardRef<TextInput, InputProps>((props, ref) => {
  const {
    label,
    value,
    onChangeText,
    onBlur,
    placeholder,
    error,
    errorMessage,
    helpText,
    secureTextEntry = false,
    keyboardType = 'default',
    multiline = false,
    autoCapitalize = 'none',
    maskType,
    returnKeyType = 'next',
    onSubmitEditing,
    style,
    disabled = false,
    isLastEdited = false,
    required = false,
    ...rest
  } = props;

  const [isFocused, setIsFocused] = useState(false);

  const handleTextChange = (text: string) => {
    if (disabled) {
      return;
    }

    let formattedText = text;

    if (maskType === 'date-ymd') {
      const digits = text.replace(/[^0-9]/g, '');

      if (digits.length > 4) {
        formattedText = `${digits.substring(0, 4)}-${digits.substring(4)}`;
      }
      if (digits.length > 6) {
        formattedText = `${digits.substring(0, 4)}-${digits.substring(4, 6)}-${digits.substring(6)}`;
      }

      formattedText = formattedText.substring(0, 10);
    }

    onChangeText(formattedText);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.(value);
  };

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
          {required ? ' *' : ''}
          {isLastEdited ? ' ✨' : ''}
        </TamaguiText>
      ) : null}

      <TamaguiInput
        ref={ref}
        value={value}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        backgroundColor="$background"
        borderWidth={1}
        borderColor={error ? '$danger' : isFocused || isLastEdited ? '$primary' : '$borderColor'}
        height={multiline ? 100 : 48}
        paddingHorizontal="$md"
        paddingTop={multiline ? '$sm' : undefined}
        textAlignVertical={multiline ? 'top' : undefined}
        fontSize="$2"
        color="$text"
        editable={!disabled}
        opacity={disabled ? 0.6 : 1}
        {...rest}
      />

      {error && errorMessage ? (
        <TamaguiText fontSize="$1" color="$danger" marginTop="$xs">
          {errorMessage}
        </TamaguiText>
      ) : null}
      {helpText && !error ? (
        <TamaguiText fontSize="$1" color="$textSecondary" marginTop="$xs">
          {helpText}
        </TamaguiText>
      ) : null}
    </YStack>
  );
});

Input.displayName = 'Input';

export default Input;

