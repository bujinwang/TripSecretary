// 入境通 - Travel Purpose Selector Component
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import {
  getBasicTravelPurposes,
  getTravelPurposeDisplayName,
  normalizeTravelPurpose
} from '../data/travelPurposes';

const TravelPurposeSelector = ({
  label,
  value,
  onValueChange,
  placeholder = "请选择旅行目的",
  error,
  errorMessage,
  helpText,
  style,
  showSearch = true,
  locale = 'zh',
  purposeType = 'basic', // 'basic', 'japan', 'thailand'
  // New props for custom input when OTHER is selected
  otherValue,
  onOtherValueChange,
  ...rest
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [travelPurposes, setTravelPurposes] = useState([]);
  const [showOtherInput, setShowOtherInput] = useState(false);

  // Load travel purposes on mount
  React.useEffect(() => {
    try {
      let purposes = [];
      switch (purposeType) {
        case 'japan':
          purposes = getBasicTravelPurposes(locale).concat([
            { code: 'TRANSIT', name: getTravelPurposeDisplayName('TRANSIT', locale) },
            { code: 'OTHER', name: getTravelPurposeDisplayName('OTHER', locale) }
          ]);
          break;
        case 'thailand':
          purposes = [
            { code: 'HOLIDAY', name: getTravelPurposeDisplayName('HOLIDAY', locale) },
            { code: 'BUSINESS', name: getTravelPurposeDisplayName('BUSINESS', locale) },
            { code: 'MEETING', name: getTravelPurposeDisplayName('MEETING', locale) },
            { code: 'SPORTS', name: getTravelPurposeDisplayName('SPORTS', locale) },
            { code: 'INCENTIVE', name: getTravelPurposeDisplayName('INCENTIVE', locale) },
            { code: 'CONVENTION', name: getTravelPurposeDisplayName('CONVENTION', locale) },
            { code: 'EDUCATION', name: getTravelPurposeDisplayName('EDUCATION', locale) },
            { code: 'EMPLOYMENT', name: getTravelPurposeDisplayName('EMPLOYMENT', locale) },
            { code: 'EXHIBITION', name: getTravelPurposeDisplayName('EXHIBITION', locale) },
            { code: 'MEDICAL', name: getTravelPurposeDisplayName('MEDICAL', locale) },
            { code: 'TRANSIT', name: getTravelPurposeDisplayName('TRANSIT', locale) },
            { code: 'OTHER', name: getTravelPurposeDisplayName('OTHER', locale) }
          ];
          break;
        default: // 'basic'
          purposes = getBasicTravelPurposes(locale);
          break;
      }

      if (Array.isArray(purposes) && purposes.length > 0) {
        setTravelPurposes(purposes);
      } else {
        console.warn('getTravelPurposes did not return a valid array:', purposes);
        setTravelPurposes([]);
      }
    } catch (error) {
      console.error('Error getting travel purposes:', error);
      setTravelPurposes([]);
    }
  }, [purposeType, locale]);

  // Initialize showOtherInput state based on current value
  // Only manage internal input if parent provides the necessary props
  React.useEffect(() => {
    if (value === 'OTHER' && onOtherValueChange) {
      setShowOtherInput(true);
    } else {
      setShowOtherInput(false);
    }
  }, [value, onOtherValueChange]);

  // Filter travel purposes based on search text
  const filteredTravelPurposes = React.useMemo(() => {
    if (!Array.isArray(travelPurposes)) return [];

    return travelPurposes.filter(purpose => {
      if (!purpose) return false;
      const name = purpose.name || '';
      const code = purpose.code || '';
      const search = searchText.toLowerCase();
      return name.toLowerCase().includes(search) || code.toLowerCase().includes(search);
    });
  }, [travelPurposes, searchText]);

  // Get current display value
  const getCurrentDisplayValue = () => {
    if (!value) return '';

    // If OTHER is selected and there's custom text, show the custom text
    // Only do this if otherValue prop is provided (meaning parent handles custom input)
    if (value === 'OTHER' && otherValue && onOtherValueChange) {
      return otherValue;
    }

    return getTravelPurposeDisplayName(value, locale);
  };

  const handleSelectTravelPurpose = (purpose) => {
    const normalizedValue = normalizeTravelPurpose(purpose.code);
    onValueChange(normalizedValue);

    // Show input box if OTHER is selected and parent supports custom input
    if (normalizedValue === 'OTHER' && onOtherValueChange) {
      setShowOtherInput(true);
    } else {
      setShowOtherInput(false);
    }

    setIsModalVisible(false);
    setSearchText('');
  };

  const renderTravelPurposeItem = ({ item }) => {
    if (!item) return null;

    return (
      <TouchableOpacity
        style={[
          styles.purposeItem,
          value === item.code && styles.purposeItemSelected
        ]}
        onPress={() => handleSelectTravelPurpose(item)}
      >
        <Text style={[
          styles.purposeName,
          value === item.code && styles.purposeNameSelected
        ]}>
          {item.name || ''}
        </Text>
        <Text style={[
          styles.purposeCode,
          value === item.code && styles.purposeCodeSelected
        ]}>
          {item.code || ''}
        </Text>
      </TouchableOpacity>
    );
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

      {/* Input box for custom purpose when OTHER is selected */}
      {/* Only show if parent provides the necessary props for handling custom input */}
      {showOtherInput && value === 'OTHER' && onOtherValueChange && (
        <TextInput
          style={[
            styles.otherInput,
            error && styles.otherInputError
          ]}
          placeholder={locale === 'zh' ? "请输入旅行目的详情" : "Please enter travel purpose details"}
          value={otherValue || ''}
          onChangeText={onOtherValueChange}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      )}

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
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>选择旅行目的</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {showSearch && (
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="搜索旅行目的..."
                    value={searchText}
                    onChangeText={setSearchText}
                    autoFocus
                  />
                </View>
              )}

              {travelPurposes.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>加载中...</Text>
                </View>
              ) : filteredTravelPurposes.length > 0 ? (
                <ScrollView
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredTravelPurposes.map((item, index) => {
                    if (!item) return null;

                    return (
                      <TouchableOpacity
                        key={item.code || `item-${index}`}
                        style={[
                          styles.purposeItem,
                          value === item.code && styles.purposeItemSelected
                        ]}
                        onPress={() => handleSelectTravelPurpose(item)}
                      >
                        <Text style={[
                          styles.purposeName,
                          value === item.code && styles.purposeNameSelected
                        ]}>
                          {item.name || ''}
                        </Text>
                        <Text style={[
                          styles.purposeCode,
                          value === item.code && styles.purposeCodeSelected
                        ]}>
                          {item.code || ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchText ? '没有找到匹配的旅行目的' : '没有可用的旅行目的'}
                  </Text>
                </View>
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
  purposeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  purposeItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  purposeName: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
  },
  purposeNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  purposeCode: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  purposeCodeSelected: {
    color: colors.primary,
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
  otherInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    minHeight: 60,
    ...typography.body1,
    color: colors.text,
    textAlignVertical: 'top',
  },
  otherInputError: {
    borderColor: colors.error,
  },
});

export default TravelPurposeSelector;
