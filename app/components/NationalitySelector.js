// 入境通 - Nationality Selector Component
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
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

  // Get all nationalities for selection
  const nationalities = getDestinationNationalities();

  // Filter nationalities based on search text
  const filteredNationalities = nationalities.filter(nationality =>
    nationality.name.toLowerCase().includes(searchText.toLowerCase()) ||
    nationality.code.toLowerCase().includes(searchText.toLowerCase())
  );

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

  const renderNationalityItem = ({ item }) => (
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
        {item.name}
      </Text>
      <Text style={[
        styles.nationalityCode,
        value === item.code && styles.nationalityCodeSelected
      ]}>
        {item.code}
      </Text>
    </TouchableOpacity>
  );

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

            <FlatList
              data={filteredNationalities}
              renderItem={renderNationalityItem}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
            />
          </SafeAreaView>
        </View>
      </Modal>
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
});

export default NationalitySelector;