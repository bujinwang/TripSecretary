/**
 * 入境通 - GDPR Data Deletion Screen
 * Allows users to delete all their personal data (Right to be Forgotten)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useTranslation } from '../i18n/LocaleContext';
import SecureStorageService from '../services/security/SecureStorageService';
import KeyManagementService from '../services/security/KeyManagementService';

const GDPRDataDeletionScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [userId] = useState(route?.params?.userId || 'current_user'); // In real app, get from auth context

  const [dataSummary, setDataSummary] = useState({
    passport: false,
    personalInfo: false,
    entryData: false,
    travelHistory: false,
    totalItems: 0
  });

  const requiredConfirmationText = 'DELETE ALL MY DATA';

  useEffect(() => {
    loadDataSummary();
  }, []);

  const loadDataSummary = async () => {
    try {
      // Check what data exists for the user
      const summary = {
        passport: false,
        personalInfo: false,
        entryData: false,
        travelHistory: false,
        totalItems: 0
      };

      // Check passport data
      try {
        const passport = await SecureStorageService.getPassport(userId);
        summary.passport = !!passport;
        if (passport) summary.totalItems++;
      } catch (error) {
        console.log('No passport data found');
      }

      // Check personal info
      try {
        const personalInfo = await SecureStorageService.getPersonalInfo(userId);
        summary.personalInfo = !!personalInfo;
        if (personalInfo) summary.totalItems++;
      } catch (error) {
        console.log('No personal info found');
      }

      // Check funding proof (entry data)
      try {
        const fundingProof = await SecureStorageService.getFundingProof(userId);
        summary.entryData = !!fundingProof;
        if (fundingProof) summary.totalItems++;
      } catch (error) {
        console.log('No entry data found');
      }

      // Check travel history
      try {
        const travelHistory = await SecureStorageService.getTravelHistory(userId, 1000);
        summary.travelHistory = travelHistory.length > 0;
        summary.totalItems += travelHistory.length;
      } catch (error) {
        console.log('No travel history found');
      }

      setDataSummary(summary);
    } catch (error) {
      console.error('Failed to load data summary:', error);
      Alert.alert('Error', 'Failed to check your data');
    }
  };

  const handleDeleteAllData = async () => {
    if (confirmationText !== requiredConfirmationText) {
      Alert.alert('Confirmation Required', 'Please type the confirmation text exactly as shown');
      return;
    }

    Alert.alert(
      'Final Confirmation',
      'This action cannot be undone. All your data will be permanently deleted and you will be logged out of the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: performDeletion
        }
      ]
    );
  };

  const performDeletion = async () => {
    setIsDeleting(true);
    try {
      // Delete all user data from secure storage
      await SecureStorageService.deleteAllUserData(userId);

      // Delete encryption keys
      await KeyManagementService.deleteUserKeys(userId);

      // Clear any cached data
      // Note: In a real app, you might also need to:
      // - Delete data from cloud storage
      // - Clear AsyncStorage
      // - Clear cached files
      // - Notify backend services

      Alert.alert(
        'Data Deleted',
        'All your personal data has been permanently deleted. You will now be logged out.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to login screen and clear navigation stack
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Deletion failed:', error);
      Alert.alert(
        'Deletion Failed',
        'Some data could not be deleted. Please contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getDataTypeDescription = (type) => {
    const descriptions = {
      passport: 'Passport information and scanned documents',
      personalInfo: 'Personal contact details and profile information',
      entryData: 'Travel entry forms and funding proof',
      travelHistory: 'Travel history and destination records'
    };
    return descriptions[type] || type;
  };

  const canDelete = dataSummary.totalItems > 0 && confirmationText === requiredConfirmationText;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label="Back"
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>
          {t('gdpr.deletion.title', { defaultValue: 'Delete My Data' })}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Warning Section */}
        <View style={styles.warningSection}>
          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>
                {t('gdpr.deletion.warning.title', { defaultValue: 'Irreversible Action' })}
              </Text>
              <Text style={styles.warningText}>
                {t('gdpr.deletion.warning.description', {
                  defaultValue: 'Deleting your data is permanent and cannot be undone. You will lose access to all your saved information, travel history, and generated documents.'
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Data Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>
            {t('gdpr.deletion.summary.title', { defaultValue: 'Data to be Deleted' })}
          </Text>

          {Object.entries(dataSummary).map(([type, exists]) => {
            if (type === 'totalItems') return null;
            return (
              <View key={type} style={styles.dataItem}>
                <View style={styles.dataItemHeader}>
                  <Text style={styles.dataType}>
                    {t(`gdpr.deletion.dataTypes.${type}`, { defaultValue: type })}
                  </Text>
                  {exists ? (
                    <Text style={styles.willDelete}>Will be deleted</Text>
                  ) : (
                    <Text style={styles.noData}>No data</Text>
                  )}
                </View>
                <Text style={styles.dataDescription}>
                  {getDataTypeDescription(type)}
                </Text>
              </View>
            );
          })}

          <View style={styles.totalItems}>
            <Text style={styles.totalText}>
              {t('gdpr.deletion.summary.total', {
                count: dataSummary.totalItems,
                defaultValue: `Total items to delete: ${dataSummary.totalItems}`
              })}
            </Text>
          </View>
        </View>

        {/* Consequences Section */}
        <View style={styles.consequencesSection}>
          <Text style={styles.sectionTitle}>
            {t('gdpr.deletion.consequences.title', { defaultValue: 'What Happens Next' })}
          </Text>

          <View style={styles.consequenceCard}>
            <Text style={styles.consequenceItem}>• All your personal information will be permanently deleted</Text>
            <Text style={styles.consequenceItem}>• You will be logged out of the app</Text>
            <Text style={styles.consequenceItem}>• Your account will be deactivated</Text>
            <Text style={styles.consequenceItem}>• Generated documents will no longer be accessible</Text>
            <Text style={styles.consequenceItem}>• Travel history will be lost</Text>
          </View>
        </View>

        {/* Confirmation Section */}
        <View style={styles.confirmationSection}>
          <Text style={styles.sectionTitle}>
            {t('gdpr.deletion.confirmation.title', { defaultValue: 'Confirm Deletion' })}
          </Text>

          <View style={styles.confirmationCard}>
            <Text style={styles.confirmationText}>
              {t('gdpr.deletion.confirmation.instruction', {
                defaultValue: 'To confirm deletion, please type the following text:'
              })}
            </Text>

            <View style={styles.confirmationBox}>
              <Text style={styles.requiredText}>{requiredConfirmationText}</Text>
            </View>

            <TextInput
              style={styles.confirmationInput}
              value={confirmationText}
              onChangeText={setConfirmationText}
              placeholder="Type the confirmation text here"
              autoCapitalize="characters"
              autoCorrect={false}
            />

            {confirmationText && confirmationText !== requiredConfirmationText && (
              <Text style={styles.errorText}>
                Text does not match. Please type exactly as shown above.
              </Text>
            )}
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          <View style={styles.finalWarning}>
            <Text style={styles.finalWarningText}>
              {t('gdpr.deletion.finalWarning', {
                defaultValue: 'This action is irreversible. Make sure you have exported any important data before proceeding.'
              })}
            </Text>
          </View>

          <Button
            title={t('gdpr.deletion.action.button', { defaultValue: 'Delete All My Data' })}
            onPress={handleDeleteAllData}
            loading={isDeleting}
            disabled={!canDelete}
            style={[styles.deleteButton, !canDelete && styles.deleteButtonDisabled]}
            textStyle={styles.deleteButtonText}
          />

          <TouchableOpacity
            style={styles.exportReminder}
            onPress={() => navigation.navigate('GDPRDataExport')}
          >
            <Text style={styles.exportReminderText}>
              {t('gdpr.deletion.exportReminder', {
                defaultValue: 'Want to keep a copy? Export your data first →'
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>
            {t('gdpr.deletion.help.title', { defaultValue: 'Have Second Thoughts?' })}
          </Text>
          <Text style={styles.helpText}>
            {t('gdpr.deletion.help.text', {
              defaultValue: 'If you change your mind, you can simply exit this screen. Your data will remain safe and unchanged.'
            })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 50,
  },
  scrollView: {
    flex: 1,
  },
  warningSection: {
    padding: spacing.md,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  warningIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.error,
    marginBottom: spacing.xs,
  },
  warningText: {
    ...typography.body1,
    color: colors.error,
    lineHeight: 20,
  },
  summarySection: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  dataItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dataItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dataType: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  willDelete: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  noData: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  dataDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  totalItems: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  totalText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.error,
  },
  consequencesSection: {
    padding: spacing.md,
  },
  consequenceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  consequenceItem: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  confirmationSection: {
    padding: spacing.md,
  },
  confirmationCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmationText: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  confirmationBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.small,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  requiredText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.error,
    fontFamily: 'monospace',
  },
  confirmationInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.small,
    padding: spacing.sm,
    ...typography.body1,
    color: colors.text,
    backgroundColor: colors.white,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  actionSection: {
    padding: spacing.md,
  },
  finalWarning: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  finalWarningText: {
    ...typography.body1,
    color: colors.warning,
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: colors.error,
    marginBottom: spacing.md,
  },
  deleteButtonDisabled: {
    backgroundColor: colors.textDisabled,
    opacity: 0.5,
  },
  deleteButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  exportReminder: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  exportReminderText: {
    ...typography.body1,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  helpSection: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  helpTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  helpText: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default GDPRDataDeletionScreen;