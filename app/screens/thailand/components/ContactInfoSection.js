import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../../theme';

/**
 * ContactInfoSection Component
 * Displays contact information including phone, email, and Thai address
 * for immigration officer presentation mode
 */
const ContactInfoSection = ({ passportData, travelData, language, t }) => {
  return (
    <View style={styles.infoSection}>
      <Text style={styles.sectionTitle}>
        {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.contactInformation') :
         language === 'thai' ? 'ข้อมูลติดต่อ' :
         `ข้อมูลติดต่อ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.contactInformation')}`}
      </Text>

      <View style={styles.infoGroup}>
        <Text style={styles.groupTitle}>
          📞 {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.contactDetails') :
               language === 'thai' ? 'รายละเอียดการติดต่อ' :
               `รายละเอียดการติดต่อ / ${t('progressiveEntryFlow.immigrationOfficer.presentation.contactDetails')}`}
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.phoneInThailand') :
             language === 'thai' ? 'โทรศัพท์ในประเทศไทย' :
             `โทรศัพท์ในประเทศไทย / ${t('progressiveEntryFlow.immigrationOfficer.presentation.phoneInThailand')}`}:
          </Text>
          <Text style={[styles.infoValue, styles.phoneNumber]}>
            {passportData?.phoneNumber || travelData?.phoneNumber || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.email') :
             language === 'thai' ? 'อีเมล' :
             `อีเมล / ${t('progressiveEntryFlow.immigrationOfficer.presentation.email')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {passportData?.email || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'english' ? t('progressiveEntryFlow.immigrationOfficer.presentation.thaiAddress') :
             language === 'thai' ? 'ที่อยู่ในประเทศไทย' :
             `ที่อยู่ในประเทศไทย / ${t('progressiveEntryFlow.immigrationOfficer.presentation.thaiAddress')}`}:
          </Text>
          <Text style={styles.infoValue}>
            {travelData?.accommodationAddress || travelData?.address || 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  infoSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: spacing.sm,
  },
  infoGroup: {
    marginBottom: spacing.lg,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  phoneNumber: {
    fontFamily: 'monospace',
  },
});

export default ContactInfoSection;
