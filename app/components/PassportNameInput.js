// 入境通 - Passport Name Input Component
// Provides three separate fields for surname, optional middle name, and given name.
// Supports both fully-controlled usage (individual name parts) and a combined full name value.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
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
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{labelText}</Text>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          errorFlag && styles.inputError,
        ]}
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
        placeholderTextColor={colors.textDisabled}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        keyboardType="ascii-capable"
        {...rest}
      />
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputRow}>
        {renderNameField({
          labelText: '姓',
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
          placeholderText: 'LI',
        })}

        {renderNameField({
          labelText: '中间名（可选）',
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
          placeholderText: '可选',
        })}

        {renderNameField({
          labelText: '名',
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
          placeholderText: 'MAOA',
        })}
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
