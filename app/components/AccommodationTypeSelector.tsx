import React, { useMemo } from 'react';
import {
  BaseSearchableSelector,
  BaseCard,
  YStack,
  XStack,
  Text as TamaguiText,
} from './tamagui';
import type { BaseSearchableSelectorProps, SearchableOption } from './tamagui';

export interface AccommodationTypeSelectorProps
  extends Omit<BaseSearchableSelectorProps, 'options' | 'getDisplayValue'> {
  options: SearchableOption[];
  variant?: 'modal' | 'quickSelect';
}

const AccommodationTypeSelector: React.FC<AccommodationTypeSelectorProps> = ({
  label,
  value,
  options,
  onValueChange,
  variant = 'modal',
  placeholder = 'Select accommodation type',
  error,
  errorMessage,
  helpText,
  style,
  modalTitle = 'Select accommodation type',
  showSearch = false,
  searchPlaceholder = 'Search accommodation types...',
  ...rest
}) => {
  const sanitizedOptions = useMemo(
    () => options.filter((opt): opt is SearchableOption => Boolean(opt?.value)),
    [options],
  );

  const normalizedLabel =
    typeof label === 'object' && label !== null && 'label' in label
      ? label.label
      : typeof label === 'string'
      ? label
      : null;

  const effectiveHelpText =
    helpText ||
    (typeof label === 'object' && label !== null && 'help' in label ? label.help ?? null : null);

  if (variant === 'quickSelect') {
    return (
      <YStack marginBottom="$md" style={style}>
        {normalizedLabel ? (
          <TamaguiText fontSize="$2" color="$text" marginBottom="$xs">
            {normalizedLabel}
          </TamaguiText>
        ) : null}

        <XStack gap="$sm" flexWrap="wrap">
          {sanitizedOptions.map((option) => {
            const optionLabel = option.label ?? option.value;
            const isActive = option.value === value;

            return (
              <BaseCard
                key={option.value}
                variant="flat"
                pressable
                onPress={() => onValueChange(option.value)}
                width="48%"
                marginBottom="$sm"
                padding="$md"
                borderWidth={1.5}
                borderColor={isActive ? '$primary' : '$borderColor'}
                backgroundColor={isActive ? '$primaryLight' : '$card'}
              >
                <XStack alignItems="center" justifyContent="center" gap="$xs">
                  {option.icon ? (
                    <TamaguiText fontSize={20} color={isActive ? '$primary' : '$text'}>
                      {option.icon}
                    </TamaguiText>
                  ) : null}
                  <TamaguiText
                    fontSize="$2"
                    textAlign="center"
                    fontWeight={isActive ? '600' : '500'}
                    color={isActive ? '$primary' : '$text'}
                  >
                    {optionLabel}
                  </TamaguiText>
                </XStack>
              </BaseCard>
            );
          })}
        </XStack>

        {error && errorMessage ? (
          <TamaguiText fontSize="$1" color="$danger" marginTop="$xs">
            {errorMessage}
          </TamaguiText>
        ) : !error && effectiveHelpText ? (
          <TamaguiText fontSize="$1" color="$textSecondary" marginTop="$xs">
            {effectiveHelpText}
          </TamaguiText>
        ) : null}
      </YStack>
    );
  }

  return (
    <BaseSearchableSelector
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={sanitizedOptions}
      placeholder={placeholder}
      showSearch={showSearch}
      searchPlaceholder={searchPlaceholder}
      modalTitle={modalTitle}
      error={error}
      errorMessage={errorMessage}
      helpText={helpText}
      style={style}
      {...rest}
    />
  );
};

export default AccommodationTypeSelector;
