/**
 * BaseSearchableSelector Component
 *
 * Reusable searchable dropdown selector with modal picker.
 * Supports search, custom input mode, icons, and full Tamagui styling.
 *
 * Use this for: Nationality, Occupation, Province, TravelPurpose, etc.
 */

import React, { useState, useMemo } from 'react';
import { Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text as TamaguiText } from 'tamagui';
import { BaseCard } from './BaseCard';
import { BaseButton } from './BaseButton';
import { BaseInput as Input } from './BaseInput';

const BaseSearchableSelector = ({
  // Label and value
  label,
  value,
  onValueChange,

  // Options
  options = [],

  // Placeholder and display
  placeholder = "请选择",
  getDisplayValue,

  // Custom input mode (for "OTHER" option)
  customValue,
  onCustomChange,
  onCustomBlur,
  customLabel = "请输入自定义值",
  customPlaceholder = "请输入",
  customHelpText,

  // Search
  showSearch = true,
  searchPlaceholder = "搜索...",
  filterOptions,

  // Error and help
  error,
  errorMessage,
  helpText,

  // Modal
  modalTitle = "请选择",
  customModalTitle,

  // Styling
  style,

  // Other props
  ...rest
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Default filter function
  const defaultFilterOptions = (opts, search) => {
    if (!search) return opts;
    const lowerSearch = search.toLowerCase();
    return opts.filter(opt => {
      const label = opt.label || '';
      const val = opt.value || '';
      return label.toLowerCase().includes(lowerSearch) ||
             val.toLowerCase().includes(lowerSearch);
    });
  };

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    const filterFn = filterOptions || defaultFilterOptions;
    return filterFn(options, searchText);
  }, [options, searchText, filterOptions]);

  // Get current display value
  const getCurrentDisplayValue = () => {
    if (getDisplayValue) {
      return getDisplayValue(value, customValue, options);
    }

    if (!value) return '';

    // Handle "OTHER" case
    if (value === 'OTHER') {
      return customValue || '其他';
    }

    // Find in options
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const handleSelectOption = (option) => {
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
      if (onCustomBlur) {
        onCustomBlur();
      }
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
      {label && (
        <TamaguiText fontSize="$2" color="$text" marginBottom="$xs">
          {label}
        </TamaguiText>
      )}

      {/* Selector Button */}
      <BaseCard
        variant="flat"
        padding="md"
        pressable
        onPress={() => setIsModalVisible(true)}
        borderWidth={1}
        borderColor={error ? '$danger' : '$borderColor'}
        backgroundColor="$background"
        height={48}
        {...rest}
      >
        <XStack alignItems="center" justifyContent="space-between">
          <TamaguiText
            fontSize="$2"
            color={getCurrentDisplayValue() ? '$text' : '$textDisabled'}
            flex={1}
          >
            {getCurrentDisplayValue() || placeholder}
          </TamaguiText>
          <TamaguiText
            fontSize="$2"
            color={error ? '$danger' : '$textSecondary'}
          >
            ▼
          </TamaguiText>
        </XStack>
      </BaseCard>

      {/* Error/Help Text */}
      {error && errorMessage && (
        <TamaguiText fontSize="$1" color="$danger" marginTop="$xs">
          {errorMessage}
        </TamaguiText>
      )}
      {helpText && !error && (
        <TamaguiText fontSize="$1" color="$textSecondary" marginTop="$xs">
          {helpText}
        </TamaguiText>
      )}

      {/* Modal Picker */}
      {isModalVisible && (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent
          onRequestClose={handleModalClose}
        >
          <YStack
            flex={1}
            backgroundColor="rgba(0, 0, 0, 0.5)"
            justifyContent="flex-end"
          >
            <SafeAreaView style={{ flex: 1, justifyContent: 'flex-end' }}>
              <YStack
                backgroundColor="$card"
                borderTopLeftRadius="$lg"
                borderTopRightRadius="$lg"
                maxHeight="80%"
                paddingBottom="$md"
              >
                {/* Modal Header */}
                <XStack
                  paddingHorizontal="$lg"
                  paddingVertical="$md"
                  borderBottomWidth={1}
                  borderBottomColor="$borderColor"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <TamaguiText fontSize="$3" fontWeight="600" color="$text">
                    {showCustomInput ? (customModalTitle || customLabel) : modalTitle}
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

                {/* Custom Input Mode */}
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
                    {customHelpText && (
                      <TamaguiText fontSize="$1" color="$textSecondary">
                        {customHelpText}
                      </TamaguiText>
                    )}
                    <XStack gap="$sm">
                      <BaseButton
                        variant="outlined"
                        size="md"
                        flex={1}
                        onPress={() => setShowCustomInput(false)}
                      >
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
                    {/* Search Input */}
                    {showSearch && (
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
                    )}

                    {/* Options List */}
                    {filteredOptions.length > 0 ? (
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                      >
                        {filteredOptions.map((item, index) => {
                          if (!item) return null;

                          const isSelected = value === item.value;

                          return (
                            <BaseCard
                              key={item.value || `item-${index}`}
                              variant="flat"
                              padding="md"
                              pressable
                              onPress={() => handleSelectOption(item)}
                              backgroundColor={isSelected ? '$primaryLight' : 'transparent'}
                              borderRadius={0}
                            >
                              <XStack gap="$md" alignItems="center">
                                {item.icon && (
                                  <TamaguiText fontSize={24}>
                                    {item.icon}
                                  </TamaguiText>
                                )}
                                <YStack flex={1}>
                                  <TamaguiText
                                    fontSize="$2"
                                    fontWeight={isSelected ? '600' : '400'}
                                    color={isSelected ? '$primary' : '$text'}
                                  >
                                    {item.label || ''}
                                  </TamaguiText>
                                  {item.value && (
                                    <TamaguiText
                                      fontSize="$1"
                                      color={isSelected ? '$primary' : '$textSecondary'}
                                    >
                                      {item.value}
                                    </TamaguiText>
                                  )}
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
      )}
    </YStack>
  );
};

export default BaseSearchableSelector;
