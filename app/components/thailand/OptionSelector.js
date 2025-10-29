/**
 * OptionSelector Component
 *
 * A reusable component for rendering a grid of selectable options with icons.
 * Supports custom value input for "OTHER" option and accessibility features.
 */

import React from 'react';
import { YStack, XStack, Text as TamaguiText } from '../tamagui';
import Input from '../Input';

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
    <YStack width="100%" style={style}>
      <XStack flexWrap="wrap" marginBottom="$sm" marginHorizontal={-8}>
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <YStack
              key={option.value}
              alignItems="center"
              justifyContent="center"
              paddingVertical="$md"
              paddingHorizontal="$sm"
              borderRadius={12}
              backgroundColor={isActive ? '#3B82F615' : '$surface'}
              borderWidth={2}
              borderColor={isActive ? '$primary' : '$borderColor'}
              minWidth={100}
              width="31%"
              marginHorizontal={8}
              marginBottom="$md"
              minHeight={80}
              opacity={disabled ? 0.5 : 1}
              onPress={() => handleSelect(option.value)}
              pressStyle={{ opacity: 0.7 }}
              cursor={disabled ? 'not-allowed' : 'pointer'}
              accessibilityLabel={`${option.label}${option.tip ? ` - ${option.tip}` : ''}`}
              accessibilityRole="button"
            >
              {option.icon && (
                <TamaguiText fontSize={28} marginBottom="$xs">
                  {option.icon}
                </TamaguiText>
              )}
              <TamaguiText
                fontSize="$2"
                fontWeight={isActive ? '700' : '500'}
                color={isActive ? '$primary' : disabled ? '$textSecondary' : '$text'}
                textAlign="center"
              >
                {option.label}
              </TamaguiText>
              {option.tip && !isActive && (
                <TamaguiText fontSize="$1" color="$textSecondary" textAlign="center" marginTop="$xs">
                  {option.tip}
                </TamaguiText>
              )}
            </YStack>
          );
        })}
      </XStack>

      {value === 'OTHER' && onCustomChange && (
        <YStack marginTop="$md">
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
        </YStack>
      )}
    </YStack>
  );
};

export default OptionSelector;
