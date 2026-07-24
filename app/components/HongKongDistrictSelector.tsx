import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../theme';
import { hongkongRegions, getDistrictsByProvince } from '../data/hongkongLocations';
import { useLocale } from '../i18n/LocaleContext';

const normalize = (value?: string | null) => (value ?? '').toLowerCase().trim();

export interface HongKongRegion {
  id: string;
  nameZh: string;
  nameEn: string;
}

export interface HongKongDistrict {
  id: number | string;
  nameEn: string;
  nameZh: string;
  regionCode: string;
}

export interface HongKongSelection {
  district: string;
  districtZh: string;
  districtId: number | string;
  region: string | null;
}

export interface HongKongDistrictSelectorProps {
  label?: string;
  value?: string | null;
  province?: string | null;
  district?: string | null;
  districtId?: string | number | null;
  subDistrict?: string | null;
  subDistrictId?: string | number | null;
  postalCode?: string | null;
  onSelect?: (selection: HongKongSelection) => void;
  onProvinceSelect?: (provinceId: string) => void;
  onDistrictSelect?: (selection: HongKongSelection) => void;
  onSubDistrictSelect?: (selection: HongKongSelection) => void;
  onPostalCodeChange?: (postalCode: string) => void;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  helpText?: string;
  style?: StyleProp<ViewStyle>;
  showSearch?: boolean;
}

const HongKongDistrictSelector: React.FC<HongKongDistrictSelectorProps> = ({
  label,
  value,
  province,
  district,
  postalCode,
  onSelect,
  onProvinceSelect,
  onDistrictSelect,
  onSubDistrictSelect,
  onPostalCodeChange,
  placeholder = '請選擇香港地區 / Select Hong Kong District',
  error,
  errorMessage,
  helpText,
  style,
  showSearch = true,
}) => {
  const { language } = useLocale();
  const isChinese = language?.startsWith('zh') ?? false;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(() => value ?? district ?? '');

  const regions = useMemo(() => hongkongRegions as HongKongRegion[], []);

  const allDistricts = useMemo(
    () =>
      regions.flatMap(
        (region) => (getDistrictsByProvince(region.id) as HongKongDistrict[]) ?? [],
      ),
    [regions],
  );

  const districts = useMemo(() => {
    if (!selectedRegion) {
      return [] as HongKongDistrict[];
    }
    return (getDistrictsByProvince(selectedRegion) ?? []) as HongKongDistrict[];
  }, [selectedRegion]);

  const filteredDistricts = useMemo(() => {
    if (!Array.isArray(districts)) {
      return [];
    }
    const search = normalize(searchText);
    if (!search) {
      return districts;
    }

    return districts.filter((district) => {
      const nameEn = normalize(district?.nameEn);
      const nameZh = normalize(district?.nameZh);
      return nameEn.includes(search) || nameZh.includes(search);
    });
  }, [districts, searchText]);

  const getDisplayLabel = useCallback(
    (district?: HongKongDistrict | null) => {
      if (!district) {
        return '';
      }
      return isChinese
        ? `${district.nameZh} / ${district.nameEn}`
        : `${district.nameEn} / ${district.nameZh}`;
    },
    [isChinese],
  );

  const getRegionDisplayLabel = useCallback(
    (region?: HongKongRegion | null) => {
      if (!region) {
        return '';
      }
      return isChinese ? `${region.nameZh} / ${region.nameEn}` : `${region.nameEn} / ${region.nameZh}`;
    },
    [isChinese],
  );

  const currentDisplayValue = useMemo(() => {
    if (!selectedValue) {
      return '';
    }

    const normalizedValue = normalize(selectedValue);
    const matched = allDistricts.find((district) => {
      if (!district) {
        return false;
      }
      const nameEn = normalize(district.nameEn);
      const nameZh = normalize(district.nameZh);
      return nameEn === normalizedValue || nameZh === normalizedValue;
    });

    if (!matched) {
      return selectedValue ?? '';
    }
    return getDisplayLabel(matched);
  }, [allDistricts, selectedValue, getDisplayLabel]);

  const handleDistrictSelect = (district: HongKongDistrict) => {
    setIsModalVisible(false);
    setSearchText('');
    const region = selectedRegion;
    setSelectedRegion(null);

    const selection: HongKongSelection = {
      district: district.nameEn,
      districtZh: district.nameZh,
      districtId: district.id,
      region,
    };

    setSelectedValue(district.nameEn ?? district.nameZh ?? '');

    onSelect?.(selection);
    onDistrictSelect?.(selection);
    onSubDistrictSelect?.(selection);
  };

  const handleRegionSelect = (regionId: string) => {
    setSelectedRegion(regionId);
    setSearchText('');
    onProvinceSelect?.(regionId);
  };

  const handleBackToRegions = () => {
    setSelectedRegion(null);
    setSearchText('');
  };

  const renderRegions = () => (
    <ScrollView
      style={styles.list}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>請選擇地區 / Select Region</Text>
      </View>
      {regions.map((region) => (
        <TouchableOpacity
          key={region.id}
          style={styles.item}
          onPress={() => handleRegionSelect(region.id)}
        >
          <Text style={styles.itemText}>{getRegionDisplayLabel(region)}</Text>
          <Text style={styles.itemArrow}>→</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderDistricts = () => {
    if (filteredDistricts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchText
              ? '沒有符合搜索條件的地區 / No matching districts'
              : '未找到可用的地區 / No districts found'}
          </Text>
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
          if (!district) {
            return null;
          }
          const isSelected =
            normalize(selectedValue) === normalize(district.nameEn) ||
            normalize(selectedValue) === normalize(district.nameZh);

          return (
            <TouchableOpacity
              key={district.id}
              style={[styles.item, isSelected && styles.itemSelected]}
              onPress={() => handleDistrictSelect(district)}
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

  useEffect(() => {
    setSelectedValue(value ?? district ?? '');
  }, [value, district]);

  useEffect(() => {
    if (province) {
      setSelectedRegion(province);
    }
  }, [province]);

  useEffect(() => {
    if (typeof postalCode === 'string' && onPostalCodeChange) {
      onPostalCodeChange(postalCode);
    }
  }, [postalCode, onPostalCodeChange]);

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

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
          ]}
        >
          ▼
        </Text>
      </TouchableOpacity>

      {error && errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {helpText && !error ? <Text style={styles.helpText}>{helpText}</Text> : null}

      {isModalVisible ? (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => {
            setIsModalVisible(false);
            setSelectedRegion(null);
            setSearchText('');
          }}
        >
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                {selectedRegion ? (
                  <TouchableOpacity style={styles.backButton} onPress={handleBackToRegions}>
                    <Text style={styles.backButtonText}>← 返回</Text>
                  </TouchableOpacity>
                ) : null}
                <Text style={styles.modalTitle}>
                  {selectedRegion ? '選擇地區 / Select District' : '選擇地區 / Select Region'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setIsModalVisible(false);
                    setSelectedRegion(null);
                    setSearchText('');
                  }}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedRegion && showSearch ? (
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="搜索地區（中文或英文）/ Search district"
                    value={searchText}
                    onChangeText={setSearchText}
                    autoFocus
                  />
                </View>
              ) : null}

              {selectedRegion ? renderDistricts() : renderRegions()}
            </SafeAreaView>
          </View>
        </Modal>
      ) : null}
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
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
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
  instructionContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  instructionText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  item: {
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemSelected: {
    backgroundColor: '#F0F7FF',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    borderBottomColor: 'transparent',
  },
  itemText: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
  },
  itemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  itemArrow: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default HongKongDistrictSelector;

