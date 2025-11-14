/**
 * 入境通 - GDPR Data Export Screen
 * Allows users to export all their personal data for GDPR compliance
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useTranslation } from '../i18n/LocaleContext';
import { ModelUtils } from '../models';
import SecureStorageService from '../services/security/SecureStorageService';

const GDPRDataExportScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [userId] = useState(route?.params?.userId || 'current_user'); // In real app, get from auth context

  const [dataSummary, setDataSummary] = useState({
    passport: false,
    personalInfo: false,
    entryData: false,
    travelHistory: false,
    totalItems: 0
  });

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
        if (passport) {
summary.totalItems++;
}
      } catch (error) {
        console.log('No passport data found');
      }

      // Check personal info
      try {
        const personalInfo = await SecureStorageService.getPersonalInfo(userId);
        summary.personalInfo = !!personalInfo;
        if (personalInfo) {
summary.totalItems++;
}
      } catch (error) {
        console.log('No personal info found');
      }

      // Check funding proof (entry data)
      try {
        const fundingProof = await SecureStorageService.getFundingProof(userId);
        summary.entryData = !!fundingProof;
        if (fundingProof) {
summary.totalItems++;
}
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

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Export all user data
      const data = await ModelUtils.exportAllUserData(userId);

      // Add metadata
      const completeExport = {
        ...data,
        metadata: {
          exportType: 'GDPR_DATA_EXPORT',
          requestedBy: userId,
          exportedAt: new Date().toISOString(),
          appVersion: '1.0.0',
          compliance: 'GDPR_Article_20', // Right to data portability
          dataSummary: dataSummary
        }
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(completeExport, null, 2);

      // Save to file
      const filename = `tripsecretary_data_export_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + filename;

      const exportFile = new FileSystem.File(fileUri);
      await exportFile.write(jsonString);

      setExportData({
        fileUri,
        filename,
        size: jsonString.length,
        exportedAt: new Date().toISOString()
      });

      Alert.alert(
        'Export Complete',
        `Your data has been exported to ${filename}`,
        [
          { text: 'OK' },
          {
            text: 'Share File',
            onPress: () => handleShareFile(fileUri)
          }
        ]
      );
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Unable to export your data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareFile = async (fileUri) => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing not available', 'File sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Share your TripSecretary data export'
      });
    } catch (error) {
      console.error('Failed to share file:', error);
      Alert.alert('Share Failed', 'Unable to share the exported file');
    }
  };

  const handleViewExportedData = () => {
    if (!exportData) {
return;
}

    // Navigate to a data viewer screen (would need to be implemented)
    Alert.alert('View Data', 'Data viewer not yet implemented. File saved to: ' + exportData.filename);
  };

  const getDataTypeDescription = (type) => {
    const descriptions = {
      passport: 'Passport information (number, name, expiry, etc.)',
      personalInfo: 'Personal details (contact info, occupation, address)',
      entryData: 'Travel entry data (funding proof, immigration details)',
      travelHistory: 'Travel history and destination records'
    };
    return descriptions[type] || type;
  };

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
          {t('gdpr.export.title', { defaultValue: 'Export My Data' })}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {t('gdpr.export.info.title', { defaultValue: 'GDPR Data Export' })}
            </Text>
            <Text style={styles.infoText}>
              {t('gdpr.export.info.description', {
                defaultValue: 'Under GDPR Article 20, you have the right to receive a copy of all your personal data in a machine-readable format. This export includes all information stored in TripSecretary.'
              })}
            </Text>
          </View>
        </View>

        {/* Data Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>
            {t('gdpr.export.summary.title', { defaultValue: 'Data Summary' })}
          </Text>

          {Object.entries(dataSummary).map(([type, exists]) => {
            if (type === 'totalItems') {
return null;
}
            return (
              <View key={type} style={styles.dataItem}>
                <View style={styles.dataItemHeader}>
                  <Text style={styles.dataType}>
                    {t(`gdpr.export.dataTypes.${type}`, { defaultValue: type })}
                  </Text>
                  <View style={[styles.statusIndicator, exists && styles.statusActive]} />
                </View>
                <Text style={styles.dataDescription}>
                  {getDataTypeDescription(type)}
                </Text>
              </View>
            );
          })}

          <View style={styles.totalItems}>
            <Text style={styles.totalText}>
              {t('gdpr.export.summary.total', {
                count: dataSummary.totalItems,
                defaultValue: `Total items: ${dataSummary.totalItems}`
              })}
            </Text>
          </View>
        </View>

        {/* Export Section */}
        <View style={styles.exportSection}>
          <Text style={styles.sectionTitle}>
            {t('gdpr.export.action.title', { defaultValue: 'Export Data' })}
          </Text>

          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              {t('gdpr.export.warning', {
                defaultValue: 'The exported file contains sensitive information. Keep it secure and do not share with untrusted parties.'
              })}
            </Text>
          </View>

          {!exportData ? (
            <Button
              title={t('gdpr.export.action.button', { defaultValue: 'Export My Data' })}
              onPress={handleExportData}
              loading={isExporting}
              style={styles.exportButton}
              icon={<Text style={styles.buttonIcon}>📤</Text>}
            />
          ) : (
            <View style={styles.exportedCard}>
              <Text style={styles.exportedTitle}>✅ {t('gdpr.export.exported.title')}</Text>
              <Text style={styles.exportedInfo}>
                File: {exportData.filename}
              </Text>
              <Text style={styles.exportedInfo}>
                Size: {Math.round(exportData.size / 1024)} KB
              </Text>
              <Text style={styles.exportedInfo}>
                Exported: {new Date(exportData.exportedAt).toLocaleString()}
              </Text>

              <View style={styles.exportedActions}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => handleShareFile(exportData.fileUri)}
                >
                  <Text style={styles.shareButtonText}>{t('gdpr.export.exported.share')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={handleViewExportedData}
                >
                  <Text style={styles.viewButtonText}>View Data</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>
            {t('gdpr.export.help.title', { defaultValue: 'Need Help?' })}
          </Text>
          <Text style={styles.helpText}>
            {t('gdpr.export.help.text', {
              defaultValue: 'If you have questions about your data or need assistance, contact our privacy team at privacy@borderbuddy.com'
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
  infoSection: {
    padding: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body1,
    color: colors.textSecondary,
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
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.error,
  },
  statusActive: {
    backgroundColor: colors.success,
  },
  dataDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  totalItems: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  totalText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.primary,
  },
  exportSection: {
    padding: spacing.md,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  warningText: {
    ...typography.body1,
    color: colors.warning,
    flex: 1,
    lineHeight: 20,
  },
  exportButton: {
    width: '100%',
  },
  buttonIcon: {
    fontSize: 20,
  },
  exportedCard: {
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.success,
  },
  exportedTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.success,
    marginBottom: spacing.sm,
  },
  exportedInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  exportedActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  shareButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.small,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  shareButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '600',
  },
  viewButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.small,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewButtonText: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
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

export default GDPRDataExportScreen;
