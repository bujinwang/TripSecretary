import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Input from '../Input';
import { colors, typography, spacing } from '../../theme';

export interface OptionSelectorOption {
  value: string;
  label: string;
  icon?: string;
  tip?: string;
}

export interface OptionSelectorProps {
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  options: OptionSelectorOption[];
  value: string;
  selectedValue?: string;
  onSelect: (value: string) => void;
  customValue?: string;
  onCustomChange?: (value: string) => void;
  onCustomBlur?: () => void;
  customLabel?: string;
  customPlaceholder?: string;
  customHelpText?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const OptionSelector: React.FC<OptionSelectorProps> = ({
  label,
  labelStyle,
  options,
  value,
  selectedValue,
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
  const activeValue = selectedValue ?? value;

  const handleSelect = useCallback(
    (optionValue: string) => {
      if (disabled) {
        return;
      }
      onSelect(optionValue);
    },
    [disabled, onSelect],
  );

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
      <View style={styles.optionsGrid}>
        {options.map((option) => {
          const isActive = activeValue === option.value;
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
              accessibilityLabel={`${option.label}${
                option.tip ? ` - ${option.tip}` : ''
              }`}
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

      {activeValue === 'OTHER' && onCustomChange && (
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
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
    marginHorizontal: -spacing.xs,
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
    width: '31%',
    marginHorizontal: spacing.xs,
    marginBottom: spacing.md,
    minHeight: 80,
  },
  optionButtonActive: {
    backgroundColor: `${colors.primary}15`,
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
