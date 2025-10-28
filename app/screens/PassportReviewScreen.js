/**
 * 出境通 - Passport Review Screen
 * Review and edit OCR-extracted passport data before saving
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useTranslation } from '../i18n/LocaleContext';
import { DataValidator } from '../utils/validation';
import UserDataService from '../services/data/UserDataService';

const PassportReviewScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { passportData, confidence, method, validation } = route.params;

  const [editedData, setEditedData] = useState({
    passportNumber: passportData?.passportNumber || '',
    fullName: passportData?.fullName || '',
    dateOfBirth: passportData?.dateOfBirth || '',
    expirationDate: passportData?.expirationDate || '',
    nationality: passportData?.nationality || '',
    issuingCountry: passportData?.issuingCountry || '',
    gender: passportData?.gender || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Validate data on change
  useEffect(() => {
    validateCurrentData();
  }, [editedData]);

  const validateCurrentData = () => {
    // Filter out empty fields for progressive validation
    const dataToValidate = {};
    Object.entries(editedData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        dataToValidate[key] = value;
      }
    });

    // Only validate if there's data to validate
    if (Object.keys(dataToValidate).length === 0) {
      setValidationErrors({});
      return true; // Allow saving empty data for progressive filling
    }

    const result = DataValidator.validatePassport(dataToValidate);
    const errors = {};

    if (!result.isValid && result.fields) {
      Object.entries(result.fields).forEach(([fieldName, field]) => {
        if (!field.isValid && field.errors) {
          errors[fieldName] = field.errors[0]; // Show first error
        }
      });
    }

    setValidationErrors(errors);
    return result.isValid;
  };

  const handleFieldChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    console.log('=== PASSPORT SAVE DEBUG ===');
    console.log('editedData state:', editedData);
    console.log('dateOfBirth value:', editedData.dateOfBirth);
    console.log('nationality value:', editedData.nationality);

    if (!validateCurrentData()) {
      console.log('Frontend validation failed');
      Alert.alert(
        'Validation Error',
        'Please correct the errors before saving.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSaving(true);
    try {
      // Get current user ID (in real app, from auth context)
      const userId = 'current_user';

      // Filter out empty fields for progressive filling
      const filteredData = {};
      Object.entries(editedData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          filteredData[key] = value;
        }
      });

      // Save passport data securely
      const passportToSave = {
        ...filteredData,
        id: `passport_${Date.now()}`,
        userId,
        createdAt: new Date().toISOString(),
        ocrMethod: method,
        ocrConfidence: confidence?.overall || 0
      };

      console.log('passportToSave object:', passportToSave);
      console.log('About to call UserDataService.savePassport with options: { partial: true }');

      // Use partial validation for progressive filling
      await UserDataService.savePassport(passportToSave, userId, { partial: true });

      console.log('UserDataService.savePassport completed successfully');

      Alert.alert(
        'Success',
        'Passport information saved successfully!',
        [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('SelectDestination', {
              passport: passportToSave
            })
          }
        ]
      );

    } catch (error) {
      console.error('=== PASSPORT SAVE ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      Alert.alert('Error', 'Failed to save passport information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Passport',
      'Are you sure you want to skip adding passport information? You can add it later in your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => navigation.navigate('SelectDestination', {
            passport: null // No passport data
          })
        }
      ]
    );
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return colors.success;
    if (confidence >= 0.6) return colors.warning;
    return colors.error;
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence - Please Review';
  };

  const renderField = (fieldName, label, placeholder, keyboardType = 'default', autoCapitalize = 'none') => {
    const hasError = validationErrors[fieldName];
    const value = editedData[fieldName] || '';

    return (
      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, hasError && styles.fieldLabelError]}>
          {label} {hasError && '*'}
        </Text>
        <TextInput
          style={[styles.fieldInput, hasError && styles.fieldInputError]}
          value={value}
          onChangeText={(text) => handleFieldChange(fieldName, text)}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
        {hasError && (
          <Text style={styles.errorText}>{hasError}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label="Back"
        />
        <Text style={styles.headerTitle}>Review Passport Data</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* OCR Confidence Indicator */}
        <View style={styles.confidenceContainer}>
          <View style={styles.confidenceHeader}>
            <Text style={styles.confidenceLabel}>OCR Confidence</Text>
            <Text style={[styles.confidenceValue, { color: getConfidenceColor(confidence?.overall || 0) }]}>
              {Math.round((confidence?.overall || 0) * 100)}%
            </Text>
          </View>
          <Text style={[styles.confidenceText, { color: getConfidenceColor(confidence?.overall || 0) }]}>
            {getConfidenceText(confidence?.overall || 0)}
          </Text>
          <Text style={styles.methodText}>Method: {method}</Text>
        </View>

        {/* Validation Summary */}
        {validation && (!validation.isValid || validation.warnings.length > 0) && (
          <View style={styles.validationContainer}>
            {validation.errors.length > 0 && (
              <View style={styles.errorSummary}>
                <Text style={styles.errorSummaryTitle}>Errors to fix:</Text>
                {validation.errors.map((error, index) => (
                  <Text key={index} style={styles.errorSummaryItem}>• {error}</Text>
                ))}
              </View>
            )}

            {validation.warnings.length > 0 && (
              <View style={styles.warningSummary}>
                <Text style={styles.warningSummaryTitle}>Warnings:</Text>
                {validation.warnings.map((warning, index) => (
                  <Text key={index} style={styles.warningSummaryItem}>• {warning}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Passport Fields */}
        <View style={styles.fieldsContainer}>
          {renderField(
            'passportNumber',
            'Passport Number',
            'e.g., E123456789',
            'default',
            'characters'
          )}

          {renderField(
            'fullName',
            'Full Name',
            'As shown on passport',
            'default',
            'words'
          )}

          {renderField(
            'dateOfBirth',
            'Date of Birth',
            'YYYY-MM-DD',
            'numeric'
          )}

          {renderField(
            'expirationDate',
            'Expiration Date',
            'YYYY-MM-DD',
            'numeric'
          )}

          {renderField(
            'nationality',
            'Nationality',
            '3-letter country code (e.g., CHN)',
            'default',
            'characters'
          )}

          {renderField(
            'issuingCountry',
            'Issuing Country',
            '3-letter country code',
            'default',
            'characters'
          )}

          {renderField(
            'gender',
            'Gender',
            'M or F',
            'default',
            'characters'
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips:</Text>
          <Text style={styles.tipsText}>
            • Double-check dates and passport number{'\n'}
            • Ensure country codes are correct (3 letters){'\n'}
            • All fields are required for immigration
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Button
          title="Save & Continue"
          onPress={handleSave}
          loading={isSaving}
          disabled={Object.keys(validationErrors).length > 0}
          style={styles.saveButton}
        />

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isSaving}
        >
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
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
  confidenceContainer: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  confidenceLabel: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  confidenceValue: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  confidenceText: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  methodText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  validationContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  errorSummary: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorSummaryTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.error,
    marginBottom: spacing.xs,
  },
  errorSummaryItem: {
    ...typography.caption,
    color: colors.error,
    marginBottom: 2,
  },
  warningSummary: {
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningSummaryTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  warningSummaryItem: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: 2,
  },
  fieldsContainer: {
    padding: spacing.md,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fieldLabelError: {
    color: colors.error,
  },
  fieldInput: {
    ...typography.body1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    color: colors.text,
  },
  fieldInputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  tipsContainer: {
    backgroundColor: colors.primaryLight,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tipsTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tipsText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionsContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    marginBottom: spacing.md,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default PassportReviewScreen;