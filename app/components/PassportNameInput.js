// 入境通 - Passport Name Input Component
// Two separate fields for surname and given name

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
  const [givenName, setGivenName] = useState('');
  const [surnameError, setSurnameError] = useState('');
  const [givenNameError, setGivenNameError] = useState('');
  const isInternalUpdate = useRef(false);
  const lastValueRef = useRef('');
  const isUserTyping = useRef(false);
  const hasReceivedValidValue = useRef(false);

  // Validation function to check if input contains only valid Pinyin characters
  const validatePinyinInput = (text) => {
    // Allow only English letters, spaces, hyphens, apostrophes, and periods
    const pinyinRegex = /^[A-Za-z\s\-'.]*$/;
    return pinyinRegex.test(text);
  };

  // Parse combined value into surname and given name
  // Supports both "SURNAME, GIVENNAME" and "SURNAME GIVENNAME" formats
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
        // Try comma-separated format first (e.g., "ZHANG, WEI")
        if (value.includes(',')) {
          const parts = value.split(',').map(part => part.trim());
          if (parts.length === 2) {
            setSurname(parts[0]);
            setGivenName(parts[1]);
          } else if (parts.length === 1 && parts[0]) {
            setSurname(parts[0]);
            setGivenName('');
          } else {
            setSurname('');
            setGivenName('');
          }
        } else {
          // Try space-separated format (e.g., "ZHANG WEI")
          const spaceParts = value.trim().split(/\s+/);
          if (spaceParts.length >= 2) {
            setSurname(spaceParts[0]);
            setGivenName(spaceParts.slice(1).join(' '));
          } else if (spaceParts.length === 1 && spaceParts[0]) {
            // Single word - treat as surname
            setSurname(spaceParts[0]);
            setGivenName('');
          } else {
            setSurname('');
            setGivenName('');
          }
        }
      } else {
        setSurname('');
        setGivenName('');
      }
    }
  }, [value]);

  // Update combined value when individual parts change
  useEffect(() => {
    if (isInternalUpdate.current) {
      return;
    }

    const combined = [surname.trim(), givenName.trim()].filter(Boolean).join(', ');

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
  }, [surname, givenName, onChangeText]);

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
              // Validate input - only allow Pinyin characters
              if (validatePinyinInput(text)) {
                setSurname(text.toUpperCase());
                setSurnameError('');
              } else if (text.length > 0) {
                setSurnameError('请输入汉语拼音（仅限英文字符）');
              } else {
                setSurname(text);
                setSurnameError('');
              }
              // Clear typing flag after a short delay
              setTimeout(() => {
                isUserTyping.current = false;
              }, 100);
            }}
            placeholder="请输入姓氏"
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
              // Validate input - only allow Pinyin characters
              if (validatePinyinInput(text)) {
                setGivenName(text.toUpperCase());
                setGivenNameError('');
              } else if (text.length > 0) {
                setGivenNameError('请输入汉语拼音（仅限英文字符）');
              } else {
                setGivenName(text);
                setGivenNameError('');
              }
              // Clear typing flag after a short delay
              setTimeout(() => {
                isUserTyping.current = false;
              }, 100);
            }}
            placeholder="请输入名字"
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
       {givenNameError && (
         <Text style={styles.errorText}>{givenNameError}</Text>
       )}
       {!helpText && (
         <Text style={styles.helpText}>
           请填写汉语拼音姓名（例如：LI, MAO）- 不要输入中文字符
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
