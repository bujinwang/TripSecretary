// 入境通 - Occupation Selector Component
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../theme';
import { getOccupationOptions } from '../screens/thailand/constants';
import { useLocale } from '../i18n/LocaleContext';

const OccupationSelector = ({
  label,
  value,
  onValueChange,
  customValue,
  onCustomChange,
  onCustomBlur,
  placeholder = "请选择职业",
  error,
  errorMessage,
  helpText,
  style,
  showSearch = true,
  customLabel = "请输入您的职业",
  customPlaceholder = "例如：ACCOUNTANT, ENGINEER 等",
  customHelpText = "请用英文填写您的职业",
  ...rest
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Get i18n-enabled occupation options
  const { t } = useLocale();
  const OCCUPATION_OPTIONS = useMemo(() => getOccupationOptions(t), [t]);

  // Filter occupations based on search text
  const filteredOccupations = useMemo(() => {
    if (!Array.isArray(OCCUPATION_OPTIONS)) return [];

    return OCCUPATION_OPTIONS.filter(occupation => {
      if (!occupation) return false;
      const label = occupation.label || '';
      const occupationValue = occupation.value || '';
      const search = searchText.toLowerCase();
      return label.toLowerCase().includes(search) ||
             occupationValue.toLowerCase().includes(search);
    });
  }, [searchText, OCCUPATION_OPTIONS]);

  // Get current display value
  const getCurrentDisplayValue = () => {
    if (!value) return '';

    // If it's a custom occupation (OTHER selected)
    if (value === 'OTHER') {
      return customValue || '其他';
    }

    // Find the occupation in the options
    const occupation = OCCUPATION_OPTIONS.find(opt => opt.value === value);
    return occupation ? occupation.label : value;
  };

  const handleSelectOccupation = (occupation) => {
    if (occupation.value === 'OTHER') {
      // Show custom input instead of closing modal
      setShowCustomInput(true);
    } else {
      onValueChange(occupation.value);
      setIsModalVisible(false);
      setShowCustomInput(false);
      setSearchText('');
    }
  };

  const handleCustomSubmit = () => {
    if (customValue && customValue.trim()) {
      onValueChange('OTHER');
      if (onCustomBlur) {
        onCustomBlur();
      }
    }
    setIsModalVisible(false);
    setShowCustomInput(false);
    setSearchText('');
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setShowCustomInput(false);
    setSearchText('');
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.selector,
          isFocused && styles.selectorFocused,
          error && styles.selectorError,
        ]}
        onPress={() => setIsModalVisible(true)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        activeOpacity={0.7}
        {...rest}
      >
        <Text style={[
          styles.selectorText,
          !getCurrentDisplayValue() && styles.selectorPlaceholder,
          error && styles.selectorTextError
        ]}>
          {getCurrentDisplayValue() || placeholder}
        </Text>
        <Text style={[
          styles.dropdownIcon,
          error && styles.dropdownIconError
        ]}>
          ▼
        </Text>
      </TouchableOpacity>

      {error && errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
      {helpText && !error && (
        <Text style={styles.helpText}>{helpText}</Text>
      )}

      {isModalVisible && (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent
          onRequestClose={handleModalClose}
        >
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {showCustomInput ? customLabel : '选择职业'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleModalClose}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {showCustomInput ? (
                <View style={styles.customInputContainer}>
                  <TextInput
                    style={styles.customInput}
                    placeholder={customPlaceholder}
                    value={customValue}
                    onChangeText={onCustomChange}
                    autoFocus
                    autoCapitalize="characters"
                  />
                  {customHelpText && (
                    <Text style={styles.customHelpText}>{customHelpText}</Text>
                  )}
                  <View style={styles.customButtonContainer}>
                    <TouchableOpacity
                      style={styles.customCancelButton}
                      onPress={() => setShowCustomInput(false)}
                    >
                      <Text style={styles.customCancelButtonText}>返回</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.customSubmitButton,
                        (!customValue || !customValue.trim()) && styles.customSubmitButtonDisabled
                      ]}
                      onPress={handleCustomSubmit}
                      disabled={!customValue || !customValue.trim()}
                    >
                      <Text style={styles.customSubmitButtonText}>确认</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  {showSearch && (
                    <View style={styles.searchContainer}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="搜索职业..."
                        value={searchText}
                        onChangeText={setSearchText}
                        autoFocus
                      />
                    </View>
                  )}

                  {filteredOccupations.length > 0 ? (
                    <ScrollView
                      style={styles.list}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {filteredOccupations.map((item, index) => {
                        if (!item) return null;

                        return (
                          <TouchableOpacity
                            key={item.value || `item-${index}`}
                            style={[
                              styles.occupationItem,
                              value === item.value && styles.occupationItemSelected
                            ]}
                            onPress={() => handleSelectOccupation(item)}
                          >
                            <Text style={styles.occupationIcon}>{item.icon}</Text>
                            <View style={styles.occupationTextContainer}>
                              <Text style={[
                                styles.occupationLabel,
                                value === item.value && styles.occupationLabelSelected
                              ]}>
                                {item.label || ''}
                              </Text>
                              <Text style={[
                                styles.occupationValue,
                                value === item.value && styles.occupationValueSelected
                              ]}>
                                {item.value || ''}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        {searchText ? '没有找到匹配的职业' : '没有可用的职业'}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </SafeAreaView>
          </View>
        </Modal>
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
  selector: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    height: 48,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorFocused: {
    borderColor: colors.primary,
  },
  selectorError: {
    borderColor: colors.error,
  },
  selectorText: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
  },
  selectorPlaceholder: {
    color: colors.textDisabled,
  },
  selectorTextError: {
    color: colors.error,
  },
  dropdownIcon: {
    ...typography.body1,
    color: colors.textSecondary,
    fontSize: 12,
  },
  dropdownIconError: {
    color: colors.error,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayDark,
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: 100,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    ...typography.body1,
    color: colors.textSecondary,
    fontSize: 18,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    height: 40,
    paddingHorizontal: spacing.md,
    ...typography.body1,
    color: colors.text,
  },
  list: {
    flex: 1,
  },
  occupationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  occupationItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  occupationIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  occupationTextContainer: {
    flex: 1,
  },
  occupationLabel: {
    ...typography.body1,
    color: colors.text,
  },
  occupationLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  occupationValue: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  occupationValueSelected: {
    color: colors.primary,
  },
  customInputContainer: {
    padding: spacing.lg,
  },
  customInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    height: 48,
    paddingHorizontal: spacing.md,
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  customHelpText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  customButtonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  customCancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCancelButtonText: {
    ...typography.body1,
    color: colors.text,
  },
  customSubmitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSubmitButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  customSubmitButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default OccupationSelector;
