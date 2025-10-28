// Thailand District Selector Component
// Displays districts for a given province with bilingual labels

import React, { useMemo, useState, useEffect } from 'react';
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
import { getDistrictsByProvince } from '../data/thailandLocations';
import { useLocale } from '../i18n/LocaleContext';

const normalize = (value) => (value || '').toLowerCase().trim();

const DistrictSelector = ({
  label,
  provinceCode,
  value,
  selectedDistrictId,
  onSelect,
  placeholder = '请选择区（地区）',
  error,
  errorMessage,
  helpText,
  style,
  showSearch = true,
}) => {
  const { language } = useLocale();
  const isChinese = language?.startsWith('zh');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const districts = useMemo(() => {
    if (!provinceCode) return [];
    return getDistrictsByProvince(provinceCode);
  }, [provinceCode]);

  useEffect(() => {
    // Reset search when province changes
    setSearchText('');
  }, [provinceCode]);

  const filteredDistricts = useMemo(() => {
    if (!Array.isArray(districts)) return [];
    const search = normalize(searchText);
    if (!search) return districts;

    return districts.filter((district) => {
      const nameEn = normalize(district?.nameEn);
      const nameTh = normalize(district?.nameTh);
      const nameZh = normalize(district?.nameZh);
      return nameEn.includes(search) || nameTh.includes(search) || nameZh.includes(search);
    });
  }, [districts, searchText]);

  const getDisplayLabel = (district) => {
    if (!district) return '';
    const fallback = district.nameTh || district.nameZh || '';
    const secondary = isChinese
      ? district.nameZh || fallback
      : fallback || district.nameZh || '';
    if (!secondary) {
      return district.nameEn;
    }
    return `${district.nameEn} - ${secondary}`;
  };

  const currentDisplayValue = useMemo(() => {
    if (!Array.isArray(districts) || districts.length === 0) return '';
    const normalizedValue = normalize(value);

    const matched = districts.find((district) => {
      if (!district) return false;
      if (selectedDistrictId && district.id === selectedDistrictId) return true;
      const nameEn = normalize(district.nameEn);
      const nameTh = normalize(district.nameTh);
      const nameZh = normalize(district.nameZh);
      return (
        normalizedValue &&
        (nameEn === normalizedValue || nameTh === normalizedValue || nameZh === normalizedValue)
      );
    });

    if (!matched) return value || '';
    return getDisplayLabel(matched);
  }, [districts, selectedDistrictId, value]);

  const handleSelect = (district) => {
    setIsModalVisible(false);
    setSearchText('');

    if (onSelect) {
      onSelect({
        id: district.id,
        nameEn: district.nameEn,
        nameTh: district.nameTh,
        nameZh: district.nameZh,
      });
    }
  };

  const renderContent = () => {
    if (!provinceCode) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>请先选择省份</Text>
        </View>
      );
    }

    if (!Array.isArray(districts) || districts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>未找到可用的区（地区）</Text>
        </View>
      );
    }

    if (filteredDistricts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>没有符合搜索条件的区（地区）</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filteredDistricts.map((district) => {
          if (!district) return null;
          const isSelected =
            (selectedDistrictId && district.id === selectedDistrictId) ||
            normalize(value) === normalize(district.nameEn) ||
            normalize(value) === normalize(district.nameTh) ||
            normalize(value) === normalize(district.nameZh);

          return (
            <TouchableOpacity
              key={district.id}
              style={[styles.item, isSelected && styles.itemSelected]}
              onPress={() => handleSelect(district)}
            >
              <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                {getDisplayLabel(district)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
          !provinceCode && styles.selectorDisabled,
        ]}
        onPress={() => provinceCode && setIsModalVisible(true)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        activeOpacity={provinceCode ? 0.7 : 1}
      >
        <Text
          style={[
            styles.selectorText,
            !currentDisplayValue && styles.selectorPlaceholder,
            error && styles.selectorTextError,
          ]}
        >
          {currentDisplayValue || placeholder}
        </Text>
        <Text
          style={[
            styles.dropdownIcon,
            error && styles.dropdownIconError,
            !provinceCode && styles.dropdownIconDisabled,
          ]}
        >
          ▼
        </Text>
      </TouchableOpacity>

      {error && errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      {helpText && !error && <Text style={styles.helpText}>{helpText}</Text>}

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
                <Text style={styles.modalTitle}>选择区（地区）</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {showSearch && (
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="搜索区（中文或英文）"
                    value={searchText}
                    onChangeText={setSearchText}
                    autoFocus
                  />
                </View>
              )}

              {renderContent()}
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  selectorError: {
    borderColor: colors.error,
  },
  selectorDisabled: {
    backgroundColor: colors.backgroundSecondary,
  },
  selectorText: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
  },
  selectorTextError: {
    color: colors.error,
  },
  selectorPlaceholder: {
    color: colors.textSecondary,
  },
  dropdownIcon: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
  },
  dropdownIconError: {
    color: colors.error,
  },
  dropdownIconDisabled: {
    color: colors.border,
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '80%',
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingBottom: spacing.md,
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
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body1,
    color: colors.text,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  item: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemSelected: {
    backgroundColor: '#F0F7FF',
    borderRadius: borderRadius.sm,
    borderBottomColor: 'transparent',
  },
  itemText: {
    ...typography.body1,
    color: colors.text,
  },
  itemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
});

export default DistrictSelector;
