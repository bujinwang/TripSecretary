/**
 * PassportSection Component
 *
 * Displays passport information form section
 * for Thailand Travel Info Screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../../../theme';
import { NationalitySelector, PassportNameInput, DateTimeInput } from '../../../components';
import GenderSelector from '../../GenderSelector';
import { CollapsibleSection, FieldWarningIcon, InputWithValidation } from '../ThailandTravelComponents';
import { GENDER_OPTIONS } from '../../../screens/thailand/constants';

const PassportSection = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  // Form state
  surname,
  middleName,
  givenName,
  nationality,
  passportNo,
  visaNumber,
  dob,
  expiryDate,
  sex,
  // Setters
  setSurname,
  setMiddleName,
  setGivenName,
  setNationality,
  setPassportNo,
  setVisaNumber,
  setDob,
  setExpiryDate,
  setSex,
  // Validation
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField,
  // Actions
  debouncedSaveData,
  saveDataToSecureStorageWithOverride,
  setLastEditedAt,
  // Styles from parent (optional - can use inline styles if not provided)
  styles: parentStyles,
}) => {
  // Use parent styles if provided, otherwise use local styles
  const styles = parentStyles || localStyles;

  const handleGenderChange = async (newSex) => {
    setSex(newSex);
    // Save immediately to ensure gender is saved without requiring other field interaction
    try {
      await saveDataToSecureStorageWithOverride({ sex: newSex });
      setLastEditedAt(new Date());
    } catch (error) {
      console.error('Failed to save gender:', error);
    }
  };

  return (
    <CollapsibleSection
      title={t('thailand.travelInfo.sectionTitles.passport')}
      subtitle={t('thailand.travelInfo.sectionTitles.passportSubtitle')}
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      {/* Border Crossing Context for Personal Info */}
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionIntroIcon}>🛂</Text>
        <Text style={styles.sectionIntroText}>
          {t('thailand.travelInfo.sectionIntros.passport')}
        </Text>
      </View>

      <View style={styles.inputWithValidationContainer}>
        <View style={styles.inputLabelContainer}>
          <Text style={styles.inputLabel}>{t('thailand.travelInfo.fields.passportName.label')}</Text>
          <FieldWarningIcon hasWarning={!!warnings.fullName} hasError={!!errors.fullName} />
        </View>
        <PassportNameInput
          surname={surname}
          middleName={middleName}
          givenName={givenName}
          onSurnameChange={setSurname}
          onMiddleNameChange={setMiddleName}
          onGivenNameChange={setGivenName}
          onBlur={() => handleFieldBlur('fullName', [surname, middleName, givenName].filter(Boolean).join(', '))}
          helpText={t('thailand.travelInfo.fields.passportName.help')}
          error={!!errors.fullName}
          errorMessage={errors.fullName}
        />
        {warnings.fullName && !errors.fullName && (
          <Text style={styles.warningText}>{warnings.fullName}</Text>
        )}
      </View>

      <NationalitySelector
        label={t('thailand.travelInfo.fields.nationality.label')}
        value={nationality}
        onValueChange={(code) => {
          setNationality(code);
          debouncedSaveData();
        }}
        helpText={t('thailand.travelInfo.fields.nationality.help')}
        error={!!errors.nationality}
        errorMessage={errors.nationality}
      />

      <InputWithValidation
        label={t('thailand.travelInfo.fields.passportNo.label')}
        value={passportNo}
        onChangeText={setPassportNo}
        onBlur={() => handleFieldBlur('passportNo', passportNo)}
        helpText={t('thailand.travelInfo.fields.passportNo.help')}
        error={!!errors.passportNo}
        errorMessage={errors.passportNo}
        warning={!!warnings.passportNo}
        warningMessage={warnings.passportNo}
        required={true}
        autoCapitalize="characters"
        testID="passport-number-input"
      />

      <InputWithValidation
        label={t('thailand.travelInfo.fields.visaNumber.label')}
        value={visaNumber}
        onChangeText={(text) => setVisaNumber(text.toUpperCase())}
        onBlur={() => handleFieldBlur('visaNumber', visaNumber)}
        helpText={t('thailand.travelInfo.fields.visaNumber.help')}
        error={!!errors.visaNumber}
        errorMessage={errors.visaNumber}
        warning={!!warnings.visaNumber}
        warningMessage={warnings.visaNumber}
        optional={true}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        keyboardType="ascii-capable"
      />

      <DateTimeInput
        label={t('thailand.travelInfo.fields.dob.label')}
        value={dob}
        onChangeText={(newValue) => {
          setDob(newValue);
          handleFieldBlur('dob', newValue);
        }}
        mode="date"
        dateType="past"
        helpText={t('thailand.travelInfo.fields.dob.help')}
        error={!!errors.dob}
        errorMessage={errors.dob}
      />

      <DateTimeInput
        label={t('thailand.travelInfo.fields.expiryDate.label')}
        value={expiryDate}
        onChangeText={(newValue) => {
          setExpiryDate(newValue);
          handleFieldBlur('expiryDate', newValue);
        }}
        mode="date"
        dateType="future"
        helpText={t('thailand.travelInfo.fields.expiryDate.help')}
        error={!!errors.expiryDate}
        errorMessage={errors.expiryDate}
      />

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{t('thailand.travelInfo.fields.sex.label')}</Text>
        <GenderSelector
          value={sex}
          onChange={handleGenderChange}
          t={t}
          options={GENDER_OPTIONS}
        />
      </View>
    </CollapsibleSection>
  );
};

// Local styles (fallback if parent styles not provided)
const localStyles = StyleSheet.create({
  sectionIntro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  sectionIntroIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  sectionIntroText: {
    ...typography.body2,
    color: '#2C5AA0',
    flex: 1,
    lineHeight: 20,
  },
  inputWithValidationContainer: {
    marginBottom: spacing.md,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  inputLabel: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  warningText: {
    ...typography.caption,
    color: '#FF9500',
    marginTop: spacing.xs,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  optionButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  optionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default PassportSection;
