/**
 * GenderSelector Component
 *
 * Reusable gender/sex selector component with consistent styling.
 * Uses GENDER_OPTIONS from constants for flexibility across different screens.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

/**
 * GenderSelector component for selecting gender/sex
 *
 * @param {Object} props - Component props
 * @param {string} props.value - Currently selected gender value
 * @param {Function} props.onChange - Callback when gender changes (value) => void
 * @param {Function} props.t - Translation function for i18n
 * @param {Array} props.options - Array of gender options {value, translationKey, defaultLabel}
 * @param {Object} props.style - Additional styles for container
 * @param {boolean} props.disabled - Whether the selector is disabled
 */
const GenderSelector = ({
  value,
  onChange,
  t,
  options,
  style,
  disabled = false,
}) => {
  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isActive = value === option.value;
        const label = t ? t(option.translationKey, { defaultValue: option.defaultLabel }) : option.defaultLabel;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              isActive && styles.optionButtonActive,
              disabled && styles.optionButtonDisabled,
            ]}
            onPress={() => !disabled && onChange(option.value)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionText,
                isActive && styles.optionTextActive,
                disabled && styles.optionTextDisabled,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: colors.backgroundLight,
  },
  optionText: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '500',
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  optionTextDisabled: {
    color: colors.textSecondary,
  },
});

export default GenderSelector;
