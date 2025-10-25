// Thailand Sub-District Selector Component
// Displays sub-districts (tambon) for a given district and auto-provides postal codes

import React, { useEffect, useMemo, useState } from 'react';
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
import { getSubDistrictsByDistrictId } from '../data/thailandLocations';
import { useLocale } from '../i18n/LocaleContext';

const normalize = (value) => (value || '').toLowerCase().trim();

const SubDistrictSelector = ({
  label,
  districtId,
  value,
  selectedSubDistrictId,
  onSelect,
  placeholder = '请选择乡 / 街道',
  error,
  errorMessage,
  helpText,
  showSearch = true,
  style,
}) => {
  const { language } = useLocale();
  const isChinese = language?.startsWith('zh');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const subDistricts = useMemo(() => {
    if (!districtId) return [];
    return getSubDistrictsByDistrictId(districtId);
  }, [districtId]);

  useEffect(() => {
    setSearchText('');
  }, [districtId]);

  const filteredSubDistricts = useMemo(() => {
    if (!Array.isArray(subDistricts)) return [];
    const search = normalize(searchText);
    if (!search) return subDistricts;

    return subDistricts.filter((subDistrict) => {
      const nameEn = normalize(subDistrict?.nameEn);
      const nameTh = normalize(subDistrict?.nameTh);
      const nameZh = normalize(subDistrict?.nameZh);
      const postal = normalize(subDistrict?.postalCode);
      return (
        nameEn.includes(search) ||
        nameTh.includes(search) ||
        nameZh.includes(search) ||
        postal.includes(search)
      );
    });
  }, [subDistricts, searchText]);

  const getDisplayLabel = (subDistrict) => {
    if (!subDistrict) return '';
    const fallback = subDistrict.nameTh || subDistrict.nameZh || '';
    const secondary = isChinese
      ? subDistrict.nameZh || fallback
      : fallback || subDistrict.nameZh || '';
    const label = secondary ? `${subDistrict.nameEn} - ${secondary}` : subDistrict.nameEn;
    const postalDisplay = subDistrict.postalCode ? `（邮编：${subDistrict.postalCode}）` : '';
    return `${label}${postalDisplay}`;
  };

  const currentDisplayValue = useMemo(() => {
    if (!Array.isArray(subDistricts) || subDistricts.length === 0) return '';
    const normalizedValue = normalize(value);

    const matched = subDistricts.find((subDistrict) => {
      if (!subDistrict) return false;
      if (selectedSubDistrictId && subDistrict.id === selectedSubDistrictId) return true;
      const nameEn = normalize(subDistrict.nameEn);
      const nameTh = normalize(subDistrict.nameTh);
      const nameZh = normalize(subDistrict.nameZh);
      return (
        normalizedValue &&
        (nameEn === normalizedValue || nameTh === normalizedValue || nameZh === normalizedValue)
      );
    });

    if (!matched) return value || '';
    return getDisplayLabel(matched);
  }, [subDistricts, selectedSubDistrictId, value]);

  const handleSelect = (subDistrict) => {
    setIsModalVisible(false);
    setSearchText('');

    if (onSelect) {
      onSelect({
        id: subDistrict.id,
        nameEn: subDistrict.nameEn,
        nameTh: subDistrict.nameTh,
        nameZh: subDistrict.nameZh,
        postalCode: subDistrict.postalCode,
      });
    }
  };

  const renderContent = () => {
    if (!districtId) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>请先选择区（地区）</Text>
        </View>
      );
    }

    if (!Array.isArray(subDistricts) || subDistricts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>未找到可用的乡 / 街道</Text>
        </View>
      );
    }

    if (filteredSubDistricts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>没有符合搜索条件的乡 / 街道</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filteredSubDistricts.map((subDistrict) => {
          if (!subDistrict) return null;
          const isSelected =
            (selectedSubDistrictId && subDistrict.id === selectedSubDistrictId) ||
            normalize(value) === normalize(subDistrict.nameEn) ||
            normalize(value) === normalize(subDistrict.nameTh) ||
            normalize(value) === normalize(subDistrict.nameZh);

          return (
            <TouchableOpacity
              key={subDistrict.id}
              style={[styles.item, isSelected && styles.itemSelected]}
              onPress={() => handleSelect(subDistrict)}
            >
              <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                {getDisplayLabel(subDistrict)}
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
          !districtId && styles.selectorDisabled,
        ]}
        onPress={() => districtId && setIsModalVisible(true)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        activeOpacity={districtId ? 0.7 : 1}
      >
        <View style={styles.selectorTextContainer}>
          <Text
            style={[
              styles.selectorText,
              !currentDisplayValue && styles.selectorPlaceholder,
              error && styles.selectorTextError,
            ]}
          >
            {currentDisplayValue || placeholder}
          </Text>
        </View>
        <Text
          style={[
            styles.dropdownIcon,
            error && styles.dropdownIconError,
            !districtId && styles.dropdownIconDisabled,
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
                <Text style={styles.modalTitle}>选择乡 / 街道</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {showSearch && (
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="搜索乡 / 街道（名称或邮编）"
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
  selectorTextContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  selectorText: {
    ...typography.body1,
    color: colors.text,
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

export default SubDistrictSelector;
