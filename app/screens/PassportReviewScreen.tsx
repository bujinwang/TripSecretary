/**
 * 出境通 - Passport Review Screen
 * Review and edit OCR-extracted passport data before saving
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useTranslation } from '../i18n/LocaleContext';
import { DataValidator } from '../utils/validation';
import UserDataService from '../services/data/UserDataService';
import type { PassportData, SerializablePassport } from '../types/data';
import {
  type PassportValidationResult,
  type RootStackScreenProps,
} from '../types/navigation';

const USER_ID_FALLBACK = 'user_001';

type PassportReviewScreenProps = RootStackScreenProps<'PassportReview'>;

type PassportFieldKey =
  | 'passportNumber'
  | 'fullName'
  | 'dateOfBirth'
  | 'expiryDate'
  | 'nationality'
  | 'issuingCountry'
  | 'gender';

type PassportFormState = Record<PassportFieldKey, string>;

type FieldValidationState = Partial<Record<PassportFieldKey, string>>;

type DataValidatorFieldResult = {
  isValid?: boolean;
  errors?: string[];
};

type DataValidatorPassportResult = {
  isValid: boolean;
  fields?: Record<string, DataValidatorFieldResult>;
};

const createInitialFormState = (passportData?: Partial<PassportData> | null): PassportFormState => ({
  passportNumber:
    (passportData?.passportNumber as string | undefined) ??
    (passportData as Record<string, unknown> | null | undefined)?.passportNo?.toString() ??
    '',
  fullName:
    (passportData?.fullName as string | undefined) ??
    (passportData as Record<string, unknown> | null | undefined)?.name?.toString() ??
    '',
  dateOfBirth:
    (passportData?.dateOfBirth as string | undefined) ??
    (passportData as Record<string, unknown> | null | undefined)?.dob?.toString() ??
    '',
  expiryDate:
    (passportData?.expiryDate as string | undefined) ??
    (passportData as Record<string, unknown> | null | undefined)?.expirationDate?.toString() ??
    '',
  nationality:
    (passportData?.nationality as string | undefined) ??
    (passportData as Record<string, unknown> | null | undefined)?.nationalityCode?.toString() ??
    '',
  issuingCountry:
    (passportData?.issuingCountry as string | undefined) ??
    (passportData as Record<string, unknown> | null | undefined)?.issuingCountry?.toString() ??
    '',
  gender:
    (passportData?.gender as string | undefined) ??
    (passportData as Record<string, unknown> | null | undefined)?.sex?.toString() ??
    '',
});

const PassportReviewScreen: React.FC<PassportReviewScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { passportData, confidence, method, validation } = route.params ?? {};

  const [editedData, setEditedData] = useState<PassportFormState>(createInitialFormState(passportData));
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<FieldValidationState>({});

  const confidenceScore = confidence?.overall ?? 0;
  const validationSummary: PassportValidationResult | null = validation ?? null;

  useEffect(() => {
    validateCurrentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedData]);

  const handleFieldChange = (field: PassportFieldKey, value: string): void => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateCurrentData = (): boolean => {
    const dataToValidate: Partial<PassportFormState> = {};
    (Object.keys(editedData) as PassportFieldKey[]).forEach((key) => {
      const value = editedData[key];
      if (value !== null && value !== undefined && value !== '') {
        dataToValidate[key] = value;
      }
    });

    if (Object.keys(dataToValidate).length === 0) {
      setValidationErrors({});
      return true;
    }

    const result = DataValidator.validatePassport(
      dataToValidate
    ) as DataValidatorPassportResult;

    const errors: FieldValidationState = {};
    if (result.fields) {
      (Object.entries(result.fields) as Array<[
        string,
        DataValidatorFieldResult,
      ]>).forEach(([fieldName, fieldResult]) => {
        if (!fieldResult?.isValid && fieldResult?.errors?.length) {
          const key = fieldName as PassportFieldKey;
          errors[key] = fieldResult.errors[0];
        }
      });
    }

    setValidationErrors(errors);
    return result.isValid;
  };

  const renderField = (
    fieldName: PassportFieldKey,
    label: string,
    placeholder: string,
    keyboardType: KeyboardTypeOptions = 'default',
    autoCapitalize: TextInputProps['autoCapitalize'] = 'none'
  ) => {
    const errorMessage = validationErrors[fieldName];
    const value = editedData[fieldName];

    return (
      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, errorMessage && styles.fieldLabelError]}>
          {label} {errorMessage ? '*' : ''}
        </Text>
        <TextInput
          style={[styles.fieldInput, errorMessage && styles.fieldInputError]}
          value={value}
          onChangeText={(text) => handleFieldChange(fieldName, text)}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      </View>
    );
  };

  const getConfidenceColor = useMemo(() => {
    const score = confidenceScore;
    if (score >= 0.8) {
      return colors.success;
    }
    if (score >= 0.6) {
      return colors.warning;
    }
    return colors.error;
  }, [confidenceScore]);

  const getConfidenceText = useMemo(() => {
    const score = confidenceScore;
    if (score >= 0.8) {
      return t('passportReview.confidence.high', 'High Confidence');
    }
    if (score >= 0.6) {
      return t('passportReview.confidence.medium', 'Medium Confidence');
    }
    return t('passportReview.confidence.low', 'Low Confidence - Please Review');
  }, [confidenceScore, t]);

  const handleSave = async (): Promise<void> => {
    if (!validateCurrentData()) {
      Alert.alert(
        t('passportReview.validation.title', 'Validation Error'),
        t('passportReview.validation.message', 'Please correct the errors before saving.'),
        [{ text: t('common.confirm', 'OK') }]
      );
      return;
    }

    setIsSaving(true);

    try {
      const userId = passportData?.userId ?? USER_ID_FALLBACK;
      const filteredDataEntries = (Object.entries(editedData) as Array<[
        PassportFieldKey,
        string,
      ]>).filter(([, value]) => value !== null && value !== undefined && value !== '');

      const filteredData = Object.fromEntries(filteredDataEntries) as Partial<PassportFormState>;

      const timestamp = new Date().toISOString();

      const passportPayload: Partial<PassportData> = {
        ...filteredData,
        id:
          (passportData as Record<string, unknown> | null | undefined)?.id?.toString() ??
          `passport_${Date.now()}`,
        userId,
        createdAt: passportData?.createdAt ?? timestamp,
        updatedAt: timestamp,
        ocrMethod: method,
        ocrConfidence: confidenceScore,
      };

      const savedPassport = await UserDataService.savePassport(passportPayload, userId, {
        skipValidation: true,
      });

      const serializedPassport =
        UserDataService.toSerializablePassport(savedPassport) ??
        (passportPayload as SerializablePassport | null);

      Alert.alert(
        t('passportReview.success.title', 'Success'),
        t('passportReview.success.message', 'Passport information saved successfully!'),
        [
          {
            text: t('passportReview.success.continue', 'Continue'),
            onPress: () =>
              navigation.navigate('SelectDestination', {
                passport: serializedPassport,
              }),
          },
        ]
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Passport save error:', message);
      Alert.alert(
        t('passportReview.error.title', 'Error'),
        t('passportReview.error.message', 'Failed to save passport information. Please try again.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = (): void => {
    Alert.alert(
      t('passportReview.skip.title', 'Skip Passport'),
      t(
        'passportReview.skip.message',
        'Are you sure you want to skip adding passport information? You can add it later in your profile.'
      ),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('passportReview.skip.confirm', 'Skip'),
          onPress: () => navigation.navigate('SelectDestination', { passport: null }),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} label={t('common.back', 'Back')} />
        <Text style={styles.headerTitle}>{t('passportReview.title', 'Review Passport Data')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.confidenceContainer}>
          <View style={styles.confidenceHeader}>
            <Text style={styles.confidenceLabel}>{t('passportReview.confidence.label', 'OCR Confidence')}</Text>
            <Text style={[styles.confidenceValue, { color: getConfidenceColor }]}>
              {Math.round(confidenceScore * 100)}%
            </Text>
          </View>
          <Text style={[styles.confidenceText, { color: getConfidenceColor }]}>{getConfidenceText}</Text>
          <Text style={styles.methodText}>
            {t('passportReview.method', 'Method')}: {method ?? 'local_ocr'}
          </Text>
        </View>

        {validationSummary && (!validationSummary.isValid || validationSummary.warnings.length > 0) && (
          <View style={styles.validationContainer}>
            {validationSummary.errors.length > 0 && (
              <View style={styles.errorSummary}>
                <Text style={styles.errorSummaryTitle}>
                  {t('passportReview.validation.errors', 'Errors to fix:')}
                </Text>
                {validationSummary.errors.map((errorMessage, index) => (
                  <Text key={index} style={styles.errorSummaryItem}>
                    • {errorMessage}
                  </Text>
                ))}
              </View>
            )}

            {validationSummary.warnings.length > 0 && (
              <View style={styles.warningSummary}>
                <Text style={styles.warningSummaryTitle}>
                  {t('passportReview.validation.warnings', 'Warnings:')}
                </Text>
                {validationSummary.warnings.map((warningMessage, index) => (
                  <Text key={index} style={styles.warningSummaryItem}>
                    • {warningMessage}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.fieldsContainer}>
          {renderField('passportNumber', t('passportReview.fields.passportNumber', 'Passport Number'), t('passportReview.fields.passportNumber.placeholder', 'e.g., E123456789'), 'default', 'characters')}
          {renderField('fullName', t('passportReview.fields.fullName', 'Full Name'), t('passportReview.fields.fullName.placeholder', 'As shown on passport'), 'default', 'words')}
          {renderField('dateOfBirth', t('passportReview.fields.dateOfBirth', 'Date of Birth'), 'YYYY-MM-DD', 'numeric')}
          {renderField('expiryDate', t('passportReview.fields.expiryDate', 'Expiration Date'), 'YYYY-MM-DD', 'numeric')}
          {renderField('nationality', t('passportReview.fields.nationality', 'Nationality'), t('passportReview.fields.nationality.placeholder', '3-letter country code (e.g., CHN)'), 'default', 'characters')}
          {renderField('issuingCountry', t('passportReview.fields.issuingCountry', 'Issuing Country'), t('passportReview.fields.issuingCountry.placeholder', '3-letter country code'), 'default', 'characters')}
          {renderField('gender', t('passportReview.fields.gender', 'Gender'), t('passportReview.fields.gender.placeholder', 'M or F'), 'default', 'characters')}
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 {t('passportReview.tips.title', 'Tips:')}</Text>
          <Text style={styles.tipsText}>
            {t(
              'passportReview.tips.body',
              '• Double-check dates and passport number\n• Ensure country codes are correct (3 letters)\n• All fields are required for immigration'
            )}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actionsContainer}>
        <Button
          title={t('passportReview.actions.save', 'Save & Continue')}
          onPress={handleSave}
          loading={isSaving}
          disabled={Object.keys(validationErrors).length > 0}
          style={styles.saveButton}
        />

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={isSaving}>
          <Text style={styles.skipButtonText}>{t('passportReview.actions.skip', 'Skip for Now')}</Text>
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
    width: spacing.lg,
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  confidenceContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confidenceLabel: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  confidenceValue: {
    ...typography.h2,
    fontWeight: '700',
  },
  confidenceText: {
    ...typography.body2,
    marginTop: spacing.xs,
  },
  methodText: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  validationContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorSummary: {
    marginBottom: spacing.sm,
  },
  errorSummaryTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.error,
  },
  errorSummaryItem: {
    ...typography.body2,
    color: colors.error,
    marginTop: spacing.xs,
  },
  warningSummary: {
    marginTop: spacing.sm,
  },
  warningSummaryTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.warning,
  },
  warningSummaryItem: {
    ...typography.body2,
    color: colors.warning,
    marginTop: spacing.xs,
  },
  fieldsContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fieldLabelError: {
    color: colors.error,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...typography.body1,
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
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsTitle: {
    ...typography.body2,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.text,
  },
  tipsText: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actionsContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    marginBottom: spacing.sm,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    ...typography.body2,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});

export default PassportReviewScreen;