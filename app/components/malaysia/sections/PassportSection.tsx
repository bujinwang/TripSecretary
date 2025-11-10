// PassportSection.js
// Passport information form section for Malaysia Travel Info Screen
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';
import { PassportNameInput, NationalitySelector, DateTimeInput } from '../../index';
import InputWithUserTracking from '../../InputWithUserTracking';
import { colors, typography, spacing } from '../../../theme';
import GenderSelector, { type GenderOption } from '../../GenderSelector';

const genderOptions: GenderOption[] = [
  { value: 'M', defaultLabel: 'Male / Lelaki' },
  { value: 'F', defaultLabel: 'Female / Perempuan' },
];

type FieldCount = {
  filled: number;
  total: number;
};

type ValidationMap = Record<string, string | undefined>;

type HandleFieldChange = (
  field: string,
  value: string,
  setter?: (nextValue: string) => void,
) => void;

export interface MalaysiaPassportSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  fullName: string;
  nationality: string;
  passportNo: string;
  dob: string;
  expiryDate: string;
  sex: string;
  handleFieldChange: HandleFieldChange;
  setFullName: (value: string) => void;
  setNationality: (value: string) => void;
  setPassportNo: (value: string) => void;
  setDob: (value: string) => void;
  setExpiryDate: (value: string) => void;
  setSex: (value: string) => void;
  errors: ValidationMap;
  warnings: ValidationMap;
  lastEditedField?: string | null;
  userInteractionTracker?: unknown;
  t: (key: string, options?: Record<string, unknown>) => string;
  styles?: Partial<typeof styles> & Record<string, ViewStyle | TextStyle>;
}

const PassportSection: React.FC<MalaysiaPassportSectionProps> = ({
  isExpanded,
  onToggle,
  fieldCount,
  fullName,
  nationality,
  passportNo,
  dob,
  expiryDate,
  sex,
  handleFieldChange,
  setFullName,
  setNationality,
  setPassportNo,
  setDob,
  setExpiryDate,
  setSex,
  errors,
  warnings,
  lastEditedField,
  userInteractionTracker,
  t,
  styles: customStyles,
}) => {
  const sectionStyles = { ...styles, ...customStyles } as typeof styles;

  const translate = (key: string, defaultValue: string) =>
    (t && t(key, { defaultValue })) || defaultValue;

  const handleGenderChange = (next: string) => {
    handleFieldChange('sex', next, setSex);
  };

  return (
    <CollapsibleSection
      title={translate('malaysia.travelInfo.sections.passport', '📘 Passport Info / Maklumat Pasport')}
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      <PassportNameInput
        value={fullName}
        onChangeText={(value) => handleFieldChange('fullName', value, setFullName)}
        helpText={translate('malaysia.travelInfo.passport.helpText', 'Please fill in English / Sila isi dalam Bahasa Inggeris')}
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

      <View style={sectionStyles.fieldContainer}>
        <Text style={sectionStyles.fieldLabel}>Gender / Jantina</Text>
        <GenderSelector
          value={sex}
          onChange={handleGenderChange}
          options={genderOptions}
          style={sectionStyles.genderSelector}
        />
        {warnings.sex && !errors.sex && (
          <Text style={sectionStyles.genderWarning}>{warnings.sex}</Text>
        )}
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
  genderWarning: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.xs,
  },
  genderSelector: {
    width: '100%',
  },
});

export default PassportSection;
