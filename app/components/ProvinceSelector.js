// 入境通 - Region/Province Selector Component
// Dropdown selector for regions/provinces with bilingual display (English - Chinese)
// Supports different country data sources

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
import { thailandProvinces, getProvinceDisplayNameBilingual } from '../data/thailandProvinces';

const ProvinceSelector = ({
  label,
  value,
  onValueChange,
  placeholder = "请选择省份",
  error,
  errorMessage,
  helpText,
  style,
  showSearch = true,
  regionsData = null, // Custom regions data for different countries
  getDisplayNameFunc = null, // Custom display name function
  modalTitle = "选择省份", // Custom modal title
  searchPlaceholder = "搜索省份（中文或英文）", // Custom search placeholder
  ...rest
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [provinces, setProvinces] = useState([]);

  // Load provinces on mount
  React.useEffect(() => {
    try {
      // Use custom regionsData if provided, otherwise fall back to thailandProvinces
      const dataSource = regionsData || thailandProvinces;

      if (Array.isArray(dataSource) && dataSource.length > 0) {
        setProvinces(dataSource);
      } else {
        console.warn('Regions data is not a valid array:', dataSource);
        setProvinces([]);
      }
    } catch (error) {
      console.error('Error loading regions:', error);
      setProvinces([]);
    }
  }, [regionsData]);

  // Filter provinces based on search text
  const filteredProvinces = React.useMemo(() => {
    if (!Array.isArray(provinces)) return [];
    
    return provinces.filter(province => {
      if (!province) return false;
      const name = province.name || '';
      const nameZh = province.nameZh || '';
      const code = province.code || '';
      const search = searchText.toLowerCase();
      return name.toLowerCase().includes(search) || 
             nameZh.includes(searchText) || 
             code.toLowerCase().includes(search);
    });
  }, [provinces, searchText]);

  // Get current display value
  const getCurrentDisplayValue = () => {
    if (!value) return '';
    // Use custom display function if provided, otherwise use default Thailand function
    if (getDisplayNameFunc) {
      return getDisplayNameFunc(value);
    }
    return getProvinceDisplayNameBilingual(value);
  };

  const handleSelectProvince = (province) => {
    onValueChange(province.code);
    setIsModalVisible(false);
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
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modalTitle}</Text>
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
                    placeholder={searchPlaceholder}
                    value={searchText}
                    onChangeText={setSearchText}
                    autoFocus
                  />
                </View>
              )}

              {provinces.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>加载中...</Text>
                </View>
              ) : filteredProvinces.length > 0 ? (
                <ScrollView
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredProvinces.map((item, index) => {
                    if (!item) return null;
                    
                    return (
                      <TouchableOpacity
                        key={item.code || `item-${index}`}
                        style={[
                          styles.provinceItem,
                          value === item.code && styles.provinceItemSelected
                        ]}
                        onPress={() => handleSelectProvince(item)}
                      >
                        <Text style={[
                          styles.provinceName,
                          value === item.code && styles.provinceNameSelected
                        ]}>
                          {item.name} - {item.nameZh}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchText ? '没有找到匹配的省份' : '没有可用的省份'}
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
  provinceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  provinceItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  provinceName: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
  },
  provinceNameSelected: {
    color: colors.primary,
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

export default ProvinceSelector;
