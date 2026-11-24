import React, { useMemo, useState } from 'react';
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
import { singaporeRegions } from '../data/singaporeRegions';
import { useLocale } from '../i18n/LocaleContext';

const normalize = (value?: string | null) => (value ?? '').toLowerCase().trim();

export interface SingaporeRegion {
  code: string;
  name: string;
  nameZh?: string;
}

export interface SingaporeRegionSelection {
  code: string;
  name: string;
  nameZh?: string;
}

export interface SingaporeDistrictSelectorProps {
  label?: string;
  value?: string | null;
  onSelect?: (region: SingaporeRegionSelection) => void;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  helpText?: string;
  style?: StyleProp<ViewStyle>;
  showSearch?: boolean;
}

const SingaporeDistrictSelector: React.FC<SingaporeDistrictSelectorProps> = ({
  label,
  value,
  onSelect,
  placeholder = 'Select Planning Area',
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
  const [isFocused, setIsFocused] = useState(false);

  const filteredRegions = useMemo(() => {
    const search = normalize(searchText);
    if (!search) {
      return singaporeRegions;
    }

    return singaporeRegions.filter((region) => {
      const nameEn = normalize(region?.name);
      const nameZh = normalize(region?.nameZh);
      return nameEn.includes(search) || nameZh.includes(search);
    });
  }, [searchText]);

  const getDisplayLabel = (region?: SingaporeRegion | null) => {
    if (!region) {
      return '';
    }
    if (region.nameZh) {
      return isChinese ? `${region.nameZh} / ${region.name}` : `${region.name} / ${region.nameZh}`;
    }
    return region.name;
  };

  const currentDisplayValue = useMemo(() => {
    const normalizedValue = normalize(value);
    if (!normalizedValue) {
      return '';
    }

    const matched = singaporeRegions.find((region) => {
      if (!region) {
        return false;
      }
      const nameEn = normalize(region.name);
      const nameZh = normalize(region.nameZh);
      const code = normalize(region.code);
      return nameEn === normalizedValue || nameZh === normalizedValue || code === normalizedValue;
    });

    if (!matched) {
      return value ?? '';
    }
    return getDisplayLabel(matched);
  }, [value]);

  const handleSelect = (region: SingaporeRegion) => {
    setIsModalVisible(false);
    setSearchText('');
    onSelect?.({
      code: region.code,
      name: region.name,
      nameZh: region.nameZh,
    });
  };

  const renderContent = () => {
    if (filteredRegions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No planning areas match your search</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filteredRegions.map((region) => {
          if (!region) {
            return null;
          }
          const isSelected =
            normalize(value) === normalize(region.name) ||
            normalize(value) === normalize(region.nameZh) ||
            normalize(value) === normalize(region.code);

          return (
            <TouchableOpacity
              key={region.code}
              style={[styles.item, isSelected && styles.itemSelected]}
              onPress={() => handleSelect(region)}
            >
              <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                {getDisplayLabel(region)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

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
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Planning Area</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {showSearch ? (
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search (English or Chinese)"
                    value={searchText}
                    onChangeText={setSearchText}
                    autoFocus
                  />
                </View>
              ) : null}

              {renderContent()}
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

export default SingaporeDistrictSelector;

