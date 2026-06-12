/**
 * PassportInfoSection Component
 *
 * Displays passport information including photo, name, passport number, nationality, etc.
 * Extracted from ImmigrationOfficerViewScreen for better maintainability
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, spacing } from '../../../theme';
import OptimizedImage from '../../../components/OptimizedImage';
import { getFullName as getFullNameHelper, safeString } from '../helpers';

/**
 * Passport Information Section Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.passportData - Passport data object
 * @param {string} props.language - Display language ('english', 'thai', 'bilingual')
 * @param {Function} props.formatDateForDisplay - Date formatting function
 * @param {Function} props.t - Translation function
 */
interface PassportInfoSectionProps {
  passportData?: Record<string, unknown>;
  language: string;
  formatDateForDisplay: (date: string | undefined) => string;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const PassportInfoSection = ({ passportData, language, formatDateForDisplay, t }: PassportInfoSectionProps) => {
  /**
   * Safely get full name from passport data using centralized helper
   */
  const getFullName = () => {
    if (!passportData) {
return 'N/A';
}

    // If fullName is already provided, use it
    if (passportData.fullName) {
      return passportData.fullName as string;
    }

    // Otherwise construct from individual parts using helper
    // Note: Helper expects surname, middleName, givenName
    // but data might have firstName, middleName, lastName
    const nameData = {
      surname: (passportData.lastName || passportData.surname) as string | undefined | null,
      middleName: passportData.middleName as string | undefined | null,
      givenName: (passportData.firstName || passportData.givenName) as string | undefined | null,
    };

    return getFullNameHelper(nameData, 'N/A');
  };

  const getLabel = (englishKey: string, thaiText: string) => {
    if (language === 'english') {
      return t(`progressiveEntryFlow.immigrationOfficer.presentation.${englishKey}`);
    } else if (language === 'thai') {
      return thaiText;
    } else {
      return `${thaiText} / ${t(`progressiveEntryFlow.immigrationOfficer.presentation.${englishKey}`)}`;
    }
  };

  const getSectionTitle = () => getLabel('passportInformation', 'ข้อมูลหนังสือเดินทาง');

  return (
    <View style={styles.infoSection}>
      <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>

      {/* Passport photo if available */}
      {(passportData?.photoUri as string) && (
        <View style={styles.passportPhotoContainer}>
          <OptimizedImage
            uri={passportData!.photoUri as string}
            style={styles.passportPhoto}
            resizeMode="cover"
            lazy={false}
            placeholder="🛂"
            showLoadingText={false}
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
          {(passportData?.passportNumber as string) || 'N/A'}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{getLabel('nationality', 'สัญชาติ')}:</Text>
        <Text style={styles.infoValue}>{(passportData?.nationality as string) || 'N/A'}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{getLabel('dateOfBirth', 'วันเกิด')}:</Text>
        <Text style={styles.infoValue}>
          {formatDateForDisplay(passportData?.dateOfBirth as string | undefined)}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{getLabel('gender', 'เพศ')}:</Text>
        <Text style={styles.infoValue}>{(passportData?.gender as string) || 'N/A'}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>
          {getLabel('passportExpiry', 'วันหมดอายุหนังสือเดินทาง')}:
        </Text>
        <Text style={styles.infoValue}>
          {formatDateForDisplay(passportData?.expiryDate as string | undefined)}
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
