/**
 * GenderSelector Component
 *
 * Reusable gender/sex selector component with consistent styling.
 * Uses GENDER_OPTIONS from constants for flexibility across different screens.
 */

import React from 'react';
import {
  XStack,
  BaseCard,
  Text as TamaguiText,
} from './tamagui';

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
    <XStack gap="$sm" style={style}>
      {options.map((option) => {
        const isActive = value === option.value;
        const label = t ? t(option.translationKey, { defaultValue: option.defaultLabel }) : option.defaultLabel;

        return (
          <BaseCard
            key={option.value}
            variant="flat"
            padding="md"
            pressable={!disabled}
            onPress={() => !disabled && onChange(option.value)}
            flex={1}
            borderWidth={1.5}
            borderColor={isActive ? '$primary' : '$borderColor'}
            backgroundColor={isActive ? '$primaryLight' : '$card'}
            opacity={disabled ? 0.5 : 1}
            alignItems="center"
            justifyContent="center"
          >
            <TamaguiText
              fontSize="$2"
              color={disabled ? '$textSecondary' : isActive ? '$primary' : '$text'}
              fontWeight={isActive ? '600' : '500'}
            >
              {label}
            </TamaguiText>
          </BaseCard>
        );
      })}
    </XStack>
  );
};

export default GenderSelector;
