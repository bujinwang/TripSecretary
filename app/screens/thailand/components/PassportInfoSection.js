/**
 * PassportInfoSection Component
 *
 * Displays passport information including photo, name, passport number, nationality, etc.
 * Extracted from ImmigrationOfficerViewScreen for better maintainability
 */

import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { colors, spacing } from '../../../theme';

/**
 * Passport Information Section Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.passportData - Passport data object
 * @param {string} props.language - Display language ('english', 'thai', 'bilingual')
 * @param {Function} props.formatDateForDisplay - Date formatting function
 * @param {Function} props.t - Translation function
 */
const PassportInfoSection = ({ passportData, language, formatDateForDisplay, t }) => {
  /**
   * Safely get full name from passport data
   */
  const getFullName = () => {
    if (!passportData) return 'N/A';

    if (passportData.fullName) {
      return passportData.fullName;
    }

    const parts = [
      passportData.firstName,
      passportData.middleName,
      passportData.lastName,
    ].filter(Boolean);

    return parts.join(' ') || 'N/A';
  };

  const getLabel = (englishKey, thaiText) => {
    if (language === 'english') {
      return t(`progressiveEntryFlow.immigrationOfficer.presentation.${englishKey}`);
    } else if (language === 'thai') {
      return thaiText;
    } else {
      return `${thaiText} / ${t(`progressiveEntryFlow.immigrationOfficer.presentation.${englishKey}`)}`;
    }
  };

  const getSectionTitle = () => {
    return getLabel('passportInformation', 'ข้อมูลหนังสือเดินทาง');
  };

  return (
    <View style={styles.infoSection}>
      <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>

      {/* Passport photo if available */}
      {passportData?.photoUri && (
        <View style={styles.passportPhotoContainer}>
          <Image
            source={{ uri: passportData.photoUri }}
            style={styles.passportPhoto}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{getLabel('fullName', 'ชื่อเต็ม')}:</Text>
        <Text style={styles.infoValue}>{getFullName()}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>
          {getLabel('passportNumber', 'หมายเลขหนังสือเดินทาง')}:
        </Text>
        <Text style={[styles.infoValue, styles.passportNumber]}>
          {passportData?.passportNumber || 'N/A'}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{getLabel('nationality', 'สัญชาติ')}:</Text>
        <Text style={styles.infoValue}>{passportData?.nationality || 'N/A'}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{getLabel('dateOfBirth', 'วันเกิด')}:</Text>
        <Text style={styles.infoValue}>
          {formatDateForDisplay(passportData?.dateOfBirth)}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{getLabel('gender', 'เพศ')}:</Text>
        <Text style={styles.infoValue}>{passportData?.gender || 'N/A'}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>
          {getLabel('passportExpiry', 'วันหมดอายุหนังสือเดินทาง')}:
        </Text>
        <Text style={styles.infoValue}>
          {formatDateForDisplay(passportData?.expiryDate)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  passportPhotoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  passportPhoto: {
    width: 120,
    height: 150,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.white,
  },
  infoRow: {
    marginBottom: spacing.md,
  },
  infoLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
    opacity: 0.9,
  },
  infoValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  passportNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
    fontSize: 20,
  },
});

export default PassportInfoSection;
