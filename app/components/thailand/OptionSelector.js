/**
 * OptionSelector Component
 *
 * A reusable component for rendering a grid of selectable options with icons.
 * Supports custom value input for "OTHER" option and accessibility features.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Input from '../Input';
import { colors, typography, spacing } from '../../theme';

/**
 * @typedef {Object} Option
 * @property {string} value - The option value
 * @property {string} label - The display label
 * @property {string} [icon] - Optional emoji icon
 * @property {string} [tip] - Optional tooltip text
 */

/**
 * OptionSelector - A grid of selectable button options
 *
 * @param {Object} props
 * @param {Option[]} props.options - Array of option objects
 * @param {string} props.value - Currently selected value
 * @param {function(string): void} props.onSelect - Callback when option is selected
 * @param {string} [props.customValue] - Value for custom input (when "OTHER" is selected)
 * @param {function(string): void} [props.onCustomChange] - Callback for custom value change
 * @param {function(): void} [props.onCustomBlur] - Callback when custom input loses focus
 * @param {string} [props.customLabel] - Label for custom input field
 * @param {string} [props.customPlaceholder] - Placeholder for custom input field
 * @param {string} [props.customHelpText] - Help text for custom input field
 * @param {Object} [props.style] - Additional styles for container
 * @param {boolean} [props.disabled] - Whether the selector is disabled
 */
const OptionSelector = ({
  options,
  value,
  onSelect,
  customValue = '',
  onCustomChange,
  onCustomBlur,
  customLabel = 'Please specify',
  customPlaceholder = 'Enter custom value',
  customHelpText,
  style,
  disabled = false,
}) => {
  const handleSelect = (optionValue) => {
    if (disabled) return;
    onSelect(optionValue);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.optionsGrid}>
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                isActive && styles.optionButtonActive,
                disabled && styles.optionButtonDisabled,
              ]}
              onPress={() => handleSelect(option.value)}
              disabled={disabled}
              accessibilityLabel={`${option.label}${option.tip ? ` - ${option.tip}` : ''}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive, disabled }}
            >
              {option.icon && (
                <Text style={styles.optionIcon} accessibilityLabel="">
                  {option.icon}
                </Text>
              )}
              <Text
                style={[
                  styles.optionText,
                  isActive && styles.optionTextActive,
                  disabled && styles.optionTextDisabled,
                ]}
              >
                {option.label}
              </Text>
              {option.tip && !isActive && (
                <Text style={styles.optionTip}>{option.tip}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {value === 'OTHER' && onCustomChange && (
        <View style={styles.customInputContainer}>
          <Input
            label={customLabel}
            value={customValue}
            onChangeText={onCustomChange}
            onBlur={onCustomBlur}
            placeholder={customPlaceholder}
            helpText={customHelpText}
            autoCapitalize="words"
            disabled={disabled}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  optionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    minWidth: 100,
    flex: 1,
    minHeight: 80,
  },
  optionButtonActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  optionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: colors.disabled,
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  optionText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  optionTextDisabled: {
    color: colors.textSecondary,
  },
  optionTip: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  customInputContainer: {
    marginTop: spacing.md,
  },
});

export default OptionSelector;
