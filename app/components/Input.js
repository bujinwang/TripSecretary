// 入境通 - Input Component
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

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
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TextInput
        ref={ref}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          multiline && styles.inputMultiline,
        ]}
        value={value}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textDisabled}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        {...rest}
      />
      
      {error && errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
      {helpText && !error && (
        <Text style={styles.helpText}>{helpText}</Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    height: 48,
    paddingHorizontal: spacing.md,
    ...typography.body1,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputMultiline: {
    height: 100,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  helpText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default Input;
