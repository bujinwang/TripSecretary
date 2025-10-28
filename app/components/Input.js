// 入境通 - Input Component
import React, { useState } from 'react';
import {
  YStack,
  Input as TamaguiInput,
  Text as TamaguiText,
} from '../tamagui';

const Input = React.forwardRef(({
  label,
  value,
  onChangeText,
  onBlur, // New prop for blur handling
  placeholder,
  error,
  errorMessage,
  helpText,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  autoCapitalize = 'none', // New prop for capitalization
  maskType, // New prop for masking
  returnKeyType = 'next', // Tab navigation support
  onSubmitEditing, // Called when return key pressed
  style,
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleTextChange = (text) => {
    let formattedText = text;

    if (maskType === 'date-ymd') {
      // Remove all non-digit characters
      const digits = text.replace(/[^0-9]/g, '');

      // Apply YYYY-MM-DD mask
      if (digits.length > 4) {
        formattedText = `${digits.substring(0, 4)}-${digits.substring(4)}`;
      }
      if (digits.length > 6) {
        formattedText = `${digits.substring(0, 4)}-${digits.substring(4, 6)}-${digits.substring(6)}`;
      }

      // Limit to 10 characters (YYYY-MM-DD)
      formattedText = formattedText.substring(0, 10);
    }

    onChangeText(formattedText);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(value);
    }
  };

  return (
    <YStack marginBottom="$md" style={style}>
      {label && (
        <TamaguiText fontSize="$2" color="$text" marginBottom="$xs">
          {label}
        </TamaguiText>
      )}

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
        borderColor={error ? '$danger' : isFocused ? '$primary' : '$borderColor'}
        height={multiline ? 100 : 48}
        paddingHorizontal="$md"
        paddingTop={multiline ? '$sm' : undefined}
        textAlignVertical={multiline ? 'top' : undefined}
        fontSize="$2"
        color="$text"
        {...rest}
      />

      {error && errorMessage && (
        <TamaguiText fontSize="$1" color="$danger" marginTop="$xs">
          {errorMessage}
        </TamaguiText>
      )}
      {helpText && !error && (
        <TamaguiText fontSize="$1" color="$textSecondary" marginTop="$xs">
          {helpText}
        </TamaguiText>
      )}
    </YStack>
  );
});

Input.displayName = 'Input';

export default Input;
