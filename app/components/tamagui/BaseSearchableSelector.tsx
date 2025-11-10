import React, { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Modal, ScrollView } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text as TamaguiText } from 'tamagui';
import type { BaseCardProps } from './BaseCard';
import { BaseCard } from './BaseCard';
import { BaseButton } from './BaseButton';
import { BaseInput as Input } from './BaseInput';

export interface SearchableOption {
  label: string;
  value: string;
  icon?: ReactNode;
}

export type LabelProp =
  | string
  | {
      label: string;
      help?: string;
    }
  | null;

export type GetDisplayValueFn = (
  value: string | null | undefined,
  customValue: string | undefined,
  options: SearchableOption[],
) => string;

export type FilterOptionsFn = (
  options: SearchableOption[],
  searchText: string,
) => SearchableOption[];

export interface BaseSearchableSelectorProps extends Partial<BaseCardProps> {
  label?: LabelProp;
  value?: string | null;
  onValueChange: (value: string) => void;
  options?: SearchableOption[];
  placeholder?: string;
  getDisplayValue?: GetDisplayValueFn;
  customValue?: string;
  onCustomChange?: (value: string) => void;
  onCustomBlur?: () => void;
  customLabel?: string;
  customPlaceholder?: string;
  customHelpText?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  filterOptions?: FilterOptionsFn;
  error?: boolean;
  errorMessage?: string;
  helpText?: string;
  modalTitle?: string;
  customModalTitle?: string;
  style?: StyleProp<ViewStyle>;
}

const defaultFilterOptions: FilterOptionsFn = (opts, search) => {
  if (!search) {
    return opts;
  }

  const lowerSearch = search.toLowerCase();
  return opts.filter((opt) => {
    const label = opt.label ?? '';
    const val = opt.value ?? '';
    return label.toLowerCase().includes(lowerSearch) || val.toLowerCase().includes(lowerSearch);
  });
};

const BaseSearchableSelector: React.FC<BaseSearchableSelectorProps> = ({
  label,
  value,
  onValueChange,
  options = [],
  placeholder = '请选择',
  getDisplayValue,
  customValue,
  onCustomChange,
  onCustomBlur,
  customLabel = '请输入自定义值',
  customPlaceholder = '请输入',
  customHelpText,
  showSearch = true,
  searchPlaceholder = '搜索...',
  filterOptions,
  error,
  errorMessage,
  helpText,
  modalTitle = '请选择',
  customModalTitle,
  style,
  variant = 'flat',
  padding = 'md',
  ...cardProps
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const normalizedLabel =
    typeof label === 'object' && label !== null && 'label' in label
      ? label.label
      : typeof label === 'string'
      ? label
      : null;

  const effectiveHelpText =
    helpText ||
    (typeof label === 'object' && label !== null && 'help' in label ? label.help ?? null : null);

  const sanitizedOptions = useMemo<SearchableOption[]>(
    () => options.filter((opt): opt is SearchableOption => Boolean(opt)),
    [options],
  );

  const filteredOptions = useMemo(() => {
    const filterFn = filterOptions ?? defaultFilterOptions;
    return filterFn(sanitizedOptions, searchText);
  }, [sanitizedOptions, searchText, filterOptions]);

  const getCurrentDisplayValue = () => {
    if (getDisplayValue) {
      return getDisplayValue(value, customValue, sanitizedOptions);
    }

    if (!value) {
      return '';
    }

    if (value === 'OTHER') {
      return customValue ?? '其他';
    }

    const option = sanitizedOptions.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  const handleSelectOption = (option: SearchableOption) => {
    if (option.value === 'OTHER') {
      setShowCustomInput(true);
    } else {
      onValueChange(option.value);
      handleModalClose();
    }
  };

  const handleCustomSubmit = () => {
    if (customValue && customValue.trim()) {
      onValueChange('OTHER');
      onCustomBlur?.();
    }
    handleModalClose();
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setShowCustomInput(false);
    setSearchText('');
  };

  return (
    <YStack marginBottom="$md" style={style}>
      {normalizedLabel ? (
        <TamaguiText fontSize="$2" color="$text" marginBottom="$xs">
          {normalizedLabel}
        </TamaguiText>
      ) : null}

      <BaseCard
        variant={variant}
        padding={padding}
        paddingHorizontal="$md"
        pressable
        onPress={() => setIsModalVisible(true)}
        borderWidth={1}
        borderColor={error ? '$danger' : '$borderColor'}
        backgroundColor="$background"
        height={48}
        {...cardProps}
      >
        <XStack alignItems="center" justifyContent="space-between" height="100%">
          <TamaguiText fontSize="$2" color={getCurrentDisplayValue() ? '$text' : '$textDisabled'} flex={1}>
            {getCurrentDisplayValue() || placeholder}
          </TamaguiText>
          <TamaguiText fontSize="$2" color={error ? '$danger' : '$textSecondary'}>
            ▼
          </TamaguiText>
        </XStack>
      </BaseCard>

      {error && errorMessage ? (
        <TamaguiText fontSize="$1" color="$danger" marginTop="$xs">
          {errorMessage}
        </TamaguiText>
      ) : null}
      {!error && effectiveHelpText ? (
        <TamaguiText fontSize="$1" color="$textSecondary" marginTop="$xs">
          {effectiveHelpText}
        </TamaguiText>
      ) : null}

      {isModalVisible ? (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent
          onRequestClose={handleModalClose}
        >
          <YStack flex={1} backgroundColor="rgba(0, 0, 0, 0.5)" justifyContent="flex-end">
            <SafeAreaView style={{ flex: 1, justifyContent: 'flex-end' }}>
              <YStack
                backgroundColor="$card"
                borderTopLeftRadius="$lg"
                borderTopRightRadius="$lg"
                maxHeight="80%"
                paddingBottom="$md"
              >
                <XStack
                  paddingHorizontal="$lg"
                  paddingVertical="$md"
                  borderBottomWidth={1}
                  borderBottomColor="$borderColor"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <TamaguiText fontSize="$3" fontWeight="600" color="$text">
                    {showCustomInput ? customModalTitle ?? customLabel : modalTitle}
                  </TamaguiText>
                  <BaseCard
                    variant="flat"
                    padding="sm"
                    pressable
                    onPress={handleModalClose}
                    borderRadius={20}
                  >
                    <TamaguiText fontSize="$3" color="$textSecondary">
                      ✕
                    </TamaguiText>
                  </BaseCard>
                </XStack>

                {showCustomInput ? (
                  <YStack padding="$lg" gap="$md">
                    <Input
                      value={customValue}
                      onChangeText={onCustomChange}
                      placeholder={customPlaceholder}
                      autoFocus
                      autoCapitalize="characters"
                      backgroundColor="$background"
                      borderWidth={1}
                      borderColor="$borderColor"
                      height={48}
                      paddingHorizontal="$md"
                      fontSize="$2"
                    />
                    {customHelpText ? (
                      <TamaguiText fontSize="$1" color="$textSecondary">
                        {customHelpText}
                      </TamaguiText>
                    ) : null}
                    <XStack gap="$sm">
                      <BaseButton variant="outlined" size="md" flex={1} onPress={() => setShowCustomInput(false)}>
                        返回
                      </BaseButton>
                      <BaseButton
                        variant="primary"
                        size="md"
                        flex={1}
                        onPress={handleCustomSubmit}
                        disabled={!customValue || !customValue.trim()}
                      >
                        确认
                      </BaseButton>
                    </XStack>
                  </YStack>
                ) : (
                  <>
                    {showSearch ? (
                      <YStack paddingHorizontal="$lg" paddingTop="$md" paddingBottom="$sm">
                        <Input
                          value={searchText}
                          onChangeText={setSearchText}
                          placeholder={searchPlaceholder}
                          autoFocus
                          backgroundColor="$background"
                          borderWidth={1}
                          borderColor="$borderColor"
                          height={48}
                          paddingHorizontal="$md"
                          fontSize="$2"
                        />
                      </YStack>
                    ) : null}

                    {filteredOptions.length > 0 ? (
                      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {filteredOptions.map((item, index) => {
                          if (!item) {
                            return null;
                          }

                          const isSelected = value === item.value;

                          return (
                            <BaseCard
                              key={item.value || `item-${index}`}
                              variant="flat"
                              paddingVertical="$md"
                              paddingHorizontal="$lg"
                              pressable
                              onPress={() => handleSelectOption(item)}
                              backgroundColor={isSelected ? '$primaryLight' : 'transparent'}
                              borderRadius={0}
                            >
                              <XStack gap="$md" alignItems="center" justifyContent="flex-start">
                                {item.icon ? (
                                  <TamaguiText fontSize={24}>{item.icon}</TamaguiText>
                                ) : null}
                                <YStack flex={1} justifyContent="center">
                                  <TamaguiText
                                    fontSize="$2"
                                    fontWeight={isSelected ? '600' : '400'}
                                    color={isSelected ? '$primary' : '$text'}
                                  >
                                    {item.label ?? ''}
                                  </TamaguiText>
                                  {item.value ? (
                                    <TamaguiText
                                      fontSize="$1"
                                      color={isSelected ? '$primary' : '$textSecondary'}
                                    >
                                      {item.value}
                                    </TamaguiText>
                                  ) : null}
                                </YStack>
                              </XStack>
                            </BaseCard>
                          );
                        })}
                      </ScrollView>
                    ) : (
                      <YStack padding="$xl" alignItems="center" justifyContent="center">
                        <TamaguiText fontSize="$2" color="$textSecondary" textAlign="center">
                          {searchText ? '没有找到匹配的选项' : '没有可用的选项'}
                        </TamaguiText>
                      </YStack>
                    )}
                  </>
                )}
              </YStack>
            </SafeAreaView>
          </YStack>
        </Modal>
      ) : null}
    </YStack>
  );
};

export default BaseSearchableSelector;

