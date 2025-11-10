import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { XStack, BaseCard, Text as TamaguiText } from './tamagui';

export interface GenderOption {
  value: string;
  translationKey?: string;
  defaultLabel?: string;
  label?: string;
}

export type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export interface GenderSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  t?: TranslationFn;
  options: GenderOption[];
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const GenderSelector: React.FC<GenderSelectorProps> = ({
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
        const fallbackLabel = option.defaultLabel ?? option.label ?? '';
        const label =
          t && option.translationKey
            ? t(option.translationKey, { defaultValue: fallbackLabel })
            : fallbackLabel;

        return (
          <BaseCard
            key={option.value}
            variant="flat"
            padding="md"
            pressable={!disabled}
            onPress={() => {
              if (!disabled) {
                onChange(option.value);
              }
            }}
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

