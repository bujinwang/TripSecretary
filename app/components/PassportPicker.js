/**
 * PassportPicker Component
 * Allows users to select a passport from their available passports for an entry
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { colors, typography, spacing } from '../theme';
import { useLocale } from '../i18n/LocaleContext';
import PassportDataService from '../services/data/PassportDataService';

const PassportPicker = ({ 
  userId, 
  selectedPassportId, 
  onPassportSelect, 
  style,
  disabled = false 
}) => {
  const { t } = useLocale();
  const [passports, setPassports] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPassport, setSelectedPassport] = useState(null);

  useEffect(() => {
    loadPassports();
  }, [userId]);

  useEffect(() => {
    // Find the selected passport from the list
    if (selectedPassportId && passports.length > 0) {
      const passport = passports.find(p => p.id === selectedPassportId);
      setSelectedPassport(passport);
    }
  }, [selectedPassportId, passports]);

  const loadPassports = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const userPassports = await PassportDataService.getAllPassports(userId);
      setPassports(userPassports);

      // If no passport is selected but we have passports, select the most recent one
      if (!selectedPassportId && userPassports.length > 0) {
        const mostRecent = userPassports[0]; // Already sorted by updated_at DESC
        setSelectedPassport(mostRecent);
        onPassportSelect?.(mostRecent);
      }
    } catch (error) {
      console.error('Failed to load passports:', error);
      Alert.alert(
        t('error.title', { defaultValue: 'Error' }),
        t('passportPicker.loadError', { 
          defaultValue: 'Failed to load passports. Please try again.' 
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePassportSelect = (passport) => {
    setSelectedPassport(passport);
    setIsModalVisible(false);
    onPassportSelect?.(passport);
  };

  const formatPassportDisplay = (passport) => {
    if (!passport) return t('passportPicker.noPassport', { defaultValue: 'No passport selected' });
    
    const name = passport.fullName || 'Unknown';
    const number = passport.passportNumber || 'Unknown';
    const maskedNumber = number.length > 4 
      ? `${number.slice(0, 2)}***${number.slice(-2)}`
      : number;
    
    return `${name} (${maskedNumber})`;
  };

  const renderPassportItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.passportItem,
        selectedPassport?.id === item.id && styles.selectedPassportItem
      ]}
      onPress={() => handlePassportSelect(item)}
    >
      <View style={styles.passportInfo}>
        <Text style={styles.passportName}>{item.fullName || 'Unknown'}</Text>
        <Text style={styles.passportNumber}>
          {t('passportPicker.passportNumber', { defaultValue: 'Passport' })}: {item.passportNumber || 'Unknown'}
        </Text>
        <Text style={styles.passportNationality}>
          {t('passportPicker.nationality', { defaultValue: 'Nationality' })}: {item.nationality || 'Unknown'}
        </Text>
        {item.expiryDate && (
          <Text style={styles.passportExpiry}>
            {t('passportPicker.expires', { defaultValue: 'Expires' })}: {item.expiryDate}
          </Text>
        )}
      </View>
      {selectedPassport?.id === item.id && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.loadingText}>
          {t('passportPicker.loading', { defaultValue: 'Loading passports...' })}
        </Text>
      </View>
    );
  }

  if (passports.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.noPassportsText}>
          {t('passportPicker.noPassports', { defaultValue: 'No passports found' })}
        </Text>
      </View>
    );
  }

  // If only one passport, show it directly without picker
  if (passports.length === 1) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.label}>
          {t('passportPicker.selectedPassport', { defaultValue: 'Selected Passport' })}
        </Text>
        <View style={styles.singlePassportContainer}>
          <Text style={styles.singlePassportText}>
            {formatPassportDisplay(passports[0])}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>
        {t('passportPicker.selectPassport', { defaultValue: 'Select Passport' })}
      </Text>
      
      <TouchableOpacity
        style={[styles.pickerButton, disabled && styles.disabledButton]}
        onPress={() => !disabled && setIsModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[styles.pickerButtonText, disabled && styles.disabledText]}>
          {formatPassportDisplay(selectedPassport)}
        </Text>
        <Text style={[styles.pickerArrow, disabled && styles.disabledText]}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t('passportPicker.selectPassport', { defaultValue: 'Select Passport' })}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={passports}
            keyExtractor={(item) => item.id}
            renderItem={renderPassportItem}
            style={styles.passportList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    padding: spacing.md,
  },
  noPassportsText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    padding: spacing.md,
  },
  singlePassportContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  singlePassportText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  pickerButton: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.background.disabled,
    borderColor: colors.border.disabled,
  },
  pickerButtonText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    flex: 1,
  },
  disabledText: {
    color: colors.text.disabled,
  },
  pickerArrow: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
  },
  passportList: {
    flex: 1,
  },
  passportItem: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    alignItems: 'center',
  },
  selectedPassportItem: {
    backgroundColor: colors.background.accent,
  },
  passportInfo: {
    flex: 1,
  },
  passportName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  passportNumber: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  passportNationality: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  passportExpiry: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  selectedText: {
    color: colors.background.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});

export default PassportPicker;