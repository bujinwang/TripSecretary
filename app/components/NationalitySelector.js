// 入境通 - Nationality Selector Component
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
import { getDestinationNationalities, getNationalityDisplayName } from '../data/nationalities';

const NationalitySelector = ({
  label,
  value,
  onValueChange,
  placeholder = "请选择国籍",
  error,
  errorMessage,
  helpText,
  style,
  showSearch = true,
  ...rest
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [nationalities, setNationalities] = useState([]);

  // Load nationalities on mount
  React.useEffect(() => {
    try {
      const result = getDestinationNationalities();
      if (Array.isArray(result) && result.length > 0) {
        setNationalities(result);
      } else {
        console.warn('getDestinationNationalities did not return a valid array:', result);
        setNationalities([]);
      }
    } catch (error) {
      console.error('Error getting nationalities:', error);
      setNationalities([]);
    }
  }, []);

  // Filter nationalities based on search text
  const filteredNationalities = React.useMemo(() => {
    if (!Array.isArray(nationalities)) return [];
    
    return nationalities.filter(nationality => {
      if (!nationality) return false;
      const name = nationality.name || '';
      const code = nationality.code || '';
      const search = searchText.toLowerCase();
      return name.toLowerCase().includes(search) || code.toLowerCase().includes(search);
    });
  }, [nationalities, searchText]);

  // Get current display value
  const getCurrentDisplayValue = () => {
    if (!value) return '';
    return getNationalityDisplayName(value);
  };

  const handleSelectNationality = (nationality) => {
    onValueChange(nationality.code);
    setIsModalVisible(false);
    setSearchText('');
  };

  const renderNationalityItem = ({ item }) => {
    if (!item) return null;
    
    return (
      <TouchableOpacity
        style={[
          styles.nationalityItem,
          value === item.code && styles.nationalityItemSelected
        ]}
        onPress={() => handleSelectNationality(item)}
      >
        <Text style={[
          styles.nationalityName,
          value === item.code && styles.nationalityNameSelected
        ]}>
          {item.name || ''}
        </Text>
        <Text style={[
          styles.nationalityCode,
          value === item.code && styles.nationalityCodeSelected
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
                <Text style={styles.modalTitle}>选择国籍</Text>
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
                    placeholder="搜索国籍..."
                    value={searchText}
                    onChangeText={setSearchText}
                    autoFocus
                  />
                </View>
              )}

              {nationalities.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>加载中...</Text>
                </View>
              ) : filteredNationalities.length > 0 ? (
                <ScrollView
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredNationalities.map((item, index) => {
                    if (!item) return null;
                    
                    return (
                      <TouchableOpacity
                        key={item.code || `item-${index}`}
                        style={[
                          styles.nationalityItem,
                          value === item.code && styles.nationalityItemSelected
                        ]}
                        onPress={() => handleSelectNationality(item)}
                      >
                        <Text style={[
                          styles.nationalityName,
                          value === item.code && styles.nationalityNameSelected
                        ]}>
                          {item.name || ''}
                        </Text>
                        <Text style={[
                          styles.nationalityCode,
                          value === item.code && styles.nationalityCodeSelected
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
                    {searchText ? '没有找到匹配的国籍' : '没有可用的国籍'}
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
  nationalityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nationalityItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  nationalityName: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
  },
  nationalityNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  nationalityCode: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  nationalityCodeSelected: {
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
});

export default NationalitySelector;