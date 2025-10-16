// 入境通 - Passport Name Input Component
// Three separate fields for surname, middle name (optional), and given name

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

const PassportNameInput = ({
  label,
  value,
  onChangeText,
  placeholder = "请输入您的全名",
  error,
  errorMessage,
  helpText,
  style,
  ...rest
}) => {
  const [surname, setSurname] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [givenName, setGivenName] = useState('');
  const [surnameError, setSurnameError] = useState('');
  const [middleNameError, setMiddleNameError] = useState('');
  const [givenNameError, setGivenNameError] = useState('');
  const isInternalUpdate = useRef(false);
  const lastValueRef = useRef('');
  const isUserTyping = useRef(false);
  const hasReceivedValidValue = useRef(false);

  // Validation function to check if input contains only A-Z letters
  const validateLettersOnly = (text) => {
    // Allow only A-Z letters (uppercase and lowercase)
    const lettersOnlyRegex = /^[A-Za-z]*$/;
    return lettersOnlyRegex.test(text);
  };

  // Parse combined value into surname, middle name, and given name
  // Supports formats: "SURNAME, MIDDLENAME, GIVENNAME" or "SURNAME MIDDLENAME GIVENNAME"
  useEffect(() => {
    console.log('PassportNameInput useEffect - value:', value, 'lastValueRef:', lastValueRef.current, 'isInternalUpdate:', isInternalUpdate.current);
    
    // Skip if this is an internal update (from our own onChange)
    if (isInternalUpdate.current) {
      return;
    }
    
    // Only update internal state if the value actually changed
    if (value !== lastValueRef.current) {
      // Don't clear existing data if receiving empty value AFTER we've already received valid data
      // This prevents the fields from clearing during re-renders or remounts
      if (!value && hasReceivedValidValue.current) {
        console.log('Ignoring empty value - already have valid data');
        return;
      }
      
      console.log('Updating internal state with new value:', value);
      lastValueRef.current = value;
      // Clear the typing flag when receiving external updates
      isUserTyping.current = false;
      
      if (value) {
        // Mark that we've received a valid value
        hasReceivedValidValue.current = true;
        // Try comma-separated format first (e.g., "ZHANG, M, WEI")
        if (value.includes(',')) {
          const parts = value.split(',').map(part => part.trim());
          if (parts.length === 3) {
            setSurname(parts[0]);
            setMiddleName(parts[1]);
            setGivenName(parts[2]);
          } else if (parts.length === 2) {
            setSurname(parts[0]);
            setMiddleName('');
            setGivenName(parts[1]);
          } else if (parts.length === 1 && parts[0]) {
            setSurname(parts[0]);
            setMiddleName('');
            setGivenName('');
          } else {
            setSurname('');
            setMiddleName('');
            setGivenName('');
          }
        } else {
          // Try space-separated format (e.g., "ZHANG M WEI")
          const spaceParts = value.trim().split(/\s+/);
          if (spaceParts.length >= 3) {
            setSurname(spaceParts[0]);
            setMiddleName(spaceParts[1]);
            setGivenName(spaceParts.slice(2).join(' '));
          } else if (spaceParts.length === 2) {
            setSurname(spaceParts[0]);
            setMiddleName('');
            setGivenName(spaceParts[1]);
          } else if (spaceParts.length === 1 && spaceParts[0]) {
            // Single word - treat as surname
            setSurname(spaceParts[0]);
            setMiddleName('');
            setGivenName('');
          } else {
            setSurname('');
            setMiddleName('');
            setGivenName('');
          }
        }
      } else {
        setSurname('');
        setMiddleName('');
        setGivenName('');
      }
    }
  }, [value]);

  // Update combined value when individual parts change
  useEffect(() => {
    if (isInternalUpdate.current) {
      return;
    }

    const parts = [surname.trim(), middleName.trim(), givenName.trim()].filter(Boolean);
    const combined = parts.join(', ');

    // Prevent accidental clearing when inputs re-mount without user interaction
    if (
      !isUserTyping.current &&
      (!combined || combined.trim() === '') &&
      lastValueRef.current &&
      lastValueRef.current.trim() !== ''
    ) {
      return;
    }

    if (combined !== lastValueRef.current) {
      isInternalUpdate.current = true;
      lastValueRef.current = combined;
      onChangeText(combined);

      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 50);
    }
  }, [surname, middleName, givenName, onChangeText]);

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
              isUserTyping.current = true;
              // Validate input - only allow A-Z letters
              if (validateLettersOnly(text)) {
                setSurname(text.toUpperCase());
                setSurnameError('');
              } else if (text.length > 0) {
                setSurnameError('仅限A-Z字母');
              } else {
                setSurname(text);
                setSurnameError('');
              }
              // Clear typing flag after a short delay
              setTimeout(() => {
                isUserTyping.current = false;
              }, 100);
            }}
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
              isUserTyping.current = true;
              // Validate input - only allow A-Z letters
              if (validateLettersOnly(text)) {
                setMiddleName(text.toUpperCase());
                setMiddleNameError('');
              } else if (text.length > 0) {
                setMiddleNameError('仅限A-Z字母');
              } else {
                setMiddleName(text);
                setMiddleNameError('');
              }
              // Clear typing flag after a short delay
              setTimeout(() => {
                isUserTyping.current = false;
              }, 100);
            }}
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
              isUserTyping.current = true;
              // Validate input - only allow A-Z letters
              if (validateLettersOnly(text)) {
                setGivenName(text.toUpperCase());
                setGivenNameError('');
              } else if (text.length > 0) {
                setGivenNameError('仅限A-Z字母');
              } else {
                setGivenName(text);
                setGivenNameError('');
              }
              // Clear typing flag after a short delay
              setTimeout(() => {
                isUserTyping.current = false;
              }, 100);
            }}
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
