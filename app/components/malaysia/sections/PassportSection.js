// PassportSection.js
// Passport information form section for Malaysia Travel Info Screen
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';
import { PassportNameInput, NationalitySelector, DateTimeInput } from '../../index';
import InputWithUserTracking from '../../InputWithUserTracking';
import { colors, typography, spacing } from '../../../theme';

const GENDER_OPTIONS = [
  { value: 'M', labelEn: 'Male', labelMs: 'Lelaki' },
  { value: 'F', labelEn: 'Female', labelMs: 'Perempuan' },
];

/**
 * Passport section component for Malaysia Travel Info Screen
 * @param {Object} props - Component props
 * @returns {JSX.Element} Passport section component
 */
const PassportSection = ({
  // Section state
  isExpanded,
  onToggle,
  fieldCount,

  // Form values
  fullName,
  nationality,
  passportNo,
  dob,
  expiryDate,
  sex,

  // Setters (using handleFieldChange from validation hook)
  handleFieldChange,
  setFullName,
  setNationality,
  setPassportNo,
  setDob,
  setExpiryDate,
  setSex,

  // Validation
  errors,
  warnings,
  lastEditedField,

  // User interaction
  userInteractionTracker,

  // i18n
  t,

  // Styles
  styles: customStyles,
}) => {
  const renderGenderOptions = () => {
    return (
      <View style={styles.genderOptions}>
        {GENDER_OPTIONS.map((gender) => (
          <TouchableOpacity
            key={gender.value}
            style={[
              styles.genderOption,
              sex === gender.value && styles.genderOptionSelected
            ]}
            onPress={() => handleFieldChange('sex', gender.value, setSex)}
          >
            <View style={[
              styles.genderRadio,
              sex === gender.value && styles.genderRadioSelected
            ]}>
              {sex === gender.value && <View style={styles.genderRadioInner} />}
            </View>
            <Text style={[
              styles.genderLabel,
              sex === gender.value && styles.genderLabelSelected
            ]}>
              {gender.labelEn} / {gender.labelMs}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <CollapsibleSection
      title={t('malaysia.travelInfo.sections.passport', { defaultValue: '📘 Passport Info / Maklumat Pasport' })}
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      <PassportNameInput
        value={fullName}
        onChangeText={(value) => handleFieldChange('fullName', value, setFullName)}
        helpText="Please fill in English / Sila isi dalam Bahasa Inggeris"
        error={!!errors.fullName}
        errorMessage={errors.fullName}
      />

      <NationalitySelector
        label="Nationality / Warganegara"
        value={nationality}
        onValueChange={(code) => handleFieldChange('nationality', code, setNationality)}
        helpText="Select your nationality / Pilih kewarganegaraan anda"
        error={!!errors.nationality}
        errorMessage={errors.nationality}
      />

      <InputWithUserTracking
        label="Passport No / No Pasport"
        value={passportNo}
        onChangeText={(value) => handleFieldChange('passportNo', value, setPassportNo)}
        helpText="Enter passport number / Masukkan nombor pasport"
        error={!!errors.passportNo}
        errorMessage={errors.passportNo}
        autoCapitalize="characters"
        fieldName="passportNo"
        userInteractionTracker={userInteractionTracker}
        lastEditedField={lastEditedField}
      />

      <DateTimeInput
        label="Date of Birth / Tarikh Lahir"
        value={dob}
        onChangeText={(value) => handleFieldChange('dob', value, setDob)}
        mode="date"
        dateType="past"
        helpText="Select date of birth / Pilih tarikh lahir"
        error={!!errors.dob}
        errorMessage={errors.dob}
      />

      <DateTimeInput
        label="Passport Expiry / Tamat Pasport"
        value={expiryDate}
        onChangeText={(value) => handleFieldChange('expiryDate', value, setExpiryDate)}
        mode="date"
        dateType="future"
        helpText="Select expiry date / Pilih tarikh tamat"
        error={!!errors.expiryDate}
        errorMessage={errors.expiryDate}
      />

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Gender / Jantina</Text>
        {renderGenderOptions()}
      </View>
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  genderRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderRadioSelected: {
    borderColor: colors.primary,
  },
  genderRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  genderLabel: {
    ...typography.body2,
    color: colors.text,
  },
  genderLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default PassportSection;
