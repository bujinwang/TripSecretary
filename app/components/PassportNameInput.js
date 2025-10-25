// 入境通 - Passport Name Input Component
// Three separate fields for surname, middle name (optional), and given name

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

const PassportNameInput = ({
  label,
  surname,
  middleName,
  givenName,
  onSurnameChange,
  onMiddleNameChange,
  onGivenNameChange,
  onBlur,
  placeholder = "请输入您的全名",
  error,
  errorMessage,
  helpText,
  style,
  ...rest
}) => {
  const [surnameError, setSurnameError] = useState('');
  const [middleNameError, setMiddleNameError] = useState('');
  const [givenNameError, setGivenNameError] = useState('');

  // Validation function to check if input contains only A-Z letters
  const validateLettersOnly = (text) => {
    // Allow only A-Z letters (uppercase and lowercase)
    const lettersOnlyRegex = /^[A-Za-z]*$/;
    return lettersOnlyRegex.test(text);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>姓</Text>
          <TextInput
            style={[
              styles.input,
              error && styles.inputError,
              surnameError && styles.inputError,
            ]}
            value={surname}
            onChangeText={(text) => {
              if (validateLettersOnly(text)) {
                onSurnameChange(text.toUpperCase());
                setSurnameError('');
              } else if (text.length > 0) {
                setSurnameError('仅限A-Z字母');
              } else {
                onSurnameChange(text);
                setSurnameError('');
              }
            }}
            onBlur={onBlur}
            placeholder="LI"
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            keyboardType="ascii-capable"
            {...rest}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>中间名（可选）</Text>
          <TextInput
            style={[
              styles.input,
              error && styles.inputError,
              middleNameError && styles.inputError,
            ]}
            value={middleName}
            onChangeText={(text) => {
              if (validateLettersOnly(text)) {
                onMiddleNameChange(text.toUpperCase());
                setMiddleNameError('');
              } else if (text.length > 0) {
                setMiddleNameError('仅限A-Z字母');
              } else {
                onMiddleNameChange(text);
                setMiddleNameError('');
              }
            }}
            onBlur={onBlur}
            placeholder="可选"
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            keyboardType="ascii-capable"
            {...rest}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>名</Text>
          <TextInput
            style={[
              styles.input,
              error && styles.inputError,
              givenNameError && styles.inputError,
            ]}
            value={givenName}
            onChangeText={(text) => {
              if (validateLettersOnly(text)) {
                onGivenNameChange(text.toUpperCase());
                setGivenNameError('');
              } else if (text.length > 0) {
                setGivenNameError('仅限A-Z字母');
              } else {
                onGivenNameChange(text);
                setGivenNameError('');
              }
            }}
            onBlur={onBlur}
            placeholder="MAOA"
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            keyboardType="ascii-capable"
            {...rest}
          />
        </View>
      </View>

       {error && errorMessage && (
         <Text style={styles.errorText}>{errorMessage}</Text>
       )}
       {surnameError && (
         <Text style={styles.errorText}>{surnameError}</Text>
       )}
       {middleNameError && (
         <Text style={styles.errorText}>{middleNameError}</Text>
       )}
       {givenNameError && (
         <Text style={styles.errorText}>{givenNameError}</Text>
       )}
       {!helpText && (
         <Text style={styles.helpText}>
           请填写汉语拼音姓名（例如：LI, MAOA 或 LI, MARIE, MAOA）- 仅限A-Z字母
         </Text>
       )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
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
  inputError: {
    borderColor: colors.error,
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

export default PassportNameInput;