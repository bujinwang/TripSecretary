// PersonalInfoSection.js
// Personal information form section for Malaysia Travel Info Screen
import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';
import { NationalitySelector } from '../../index';
import InputWithUserTracking from '../../InputWithUserTracking';
import { getPhoneCode } from '../../../data/phoneCodes';
import { colors, spacing } from '../../../theme';

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

export interface MalaysiaPersonalInfoSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  occupation: string;
  residentCountry: string;
  phoneCode: string;
  phoneNumber: string;
  email: string;
  handleFieldChange: HandleFieldChange;
  setOccupation: (value: string) => void;
  setResidentCountry: (value: string) => void;
  setPhoneCode: (value: string) => void;
  setPhoneNumber: (value: string) => void;
  setEmail: (value: string) => void;
  errors: ValidationMap;
  warnings: ValidationMap;
  lastEditedField?: string | null;
  userInteractionTracker?: unknown;
  t: (key: string, options?: Record<string, unknown>) => string;
  styles?: Partial<typeof baseStyles> & Record<string, ViewStyle>;
}

const PersonalInfoSection: React.FC<MalaysiaPersonalInfoSectionProps> = ({
  isExpanded,
  onToggle,
  fieldCount,
  occupation,
  residentCountry,
  phoneCode,
  phoneNumber,
  email,
  handleFieldChange,
  setOccupation,
  setResidentCountry,
  setPhoneCode,
  setPhoneNumber,
  setEmail,
  errors,
  warnings: _warnings,
  lastEditedField,
  userInteractionTracker,
  t,
  styles: customStyles,
}) => {
  const sectionStyles = React.useMemo(
    () => (customStyles ? ({ ...baseStyles, ...customStyles } as typeof baseStyles) : baseStyles),
    [customStyles],
  );

  return (
    <View style={sectionStyles.sectionCard}>
      <CollapsibleSection
        title={t('malaysia.travelInfo.sections.personal', {
          defaultValue: '👤 Personal Info / Maklumat Peribadi',
        })}
        isExpanded={isExpanded}
        onToggle={onToggle}
        fieldCount={fieldCount}
      >
      <InputWithUserTracking
        label="Occupation / Pekerjaan"
        value={occupation}
        onChangeText={(value) => handleFieldChange('occupation', value, setOccupation)}
        helpText="Enter your occupation (in English) / Masukkan pekerjaan anda (dalam Bahasa Inggeris)"
        error={!!errors.occupation}
        errorMessage={errors.occupation}
        autoCapitalize="words"
        fieldName="occupation"
        userInteractionTracker={userInteractionTracker}
        lastEditedField={lastEditedField}
      />

      <NationalitySelector
        label="Resident Country / Negara Kediaman"
        value={residentCountry}
        onValueChange={(code) => {
          handleFieldChange('residentCountry', code, setResidentCountry);
          setPhoneCode(getPhoneCode(code));
        }}
        helpText="Select resident country / Pilih negara kediaman"
        error={!!errors.residentCountry}
        errorMessage={errors.residentCountry}
      />

      <View style={sectionStyles.phoneInputContainer}>
        <View style={sectionStyles.phoneCodeWrapper}>
          <InputWithUserTracking
            label="Country Code / Kod Negara"
            value={phoneCode}
            onChangeText={(value) => handleFieldChange('phoneCode', value, setPhoneCode)}
            keyboardType="phone-pad"
            maxLength={5}
            error={!!errors.phoneCode}
            errorMessage={errors.phoneCode}
            fieldName="phoneCode"
            userInteractionTracker={userInteractionTracker}
            lastEditedField={lastEditedField}
          />
        </View>
        <View style={sectionStyles.phoneNumberWrapper}>
          <InputWithUserTracking
            label="Phone Number / Nombor Telefon"
            value={phoneNumber}
            onChangeText={(value) => handleFieldChange('phoneNumber', value, setPhoneNumber)}
            keyboardType="phone-pad"
            helpText="Enter phone number / Masukkan nombor telefon"
            error={!!errors.phoneNumber}
            errorMessage={errors.phoneNumber}
            fieldName="phoneNumber"
            userInteractionTracker={userInteractionTracker}
            lastEditedField={lastEditedField}
          />
        </View>
      </View>

        <InputWithUserTracking
          label="Email / E-mel"
          value={email}
          onChangeText={(value) => handleFieldChange('email', value, setEmail)}
          keyboardType="email-address"
          helpText="Enter email address / Masukkan alamat e-mel"
          error={!!errors.email}
          errorMessage={errors.email}
          fieldName="email"
          userInteractionTracker={userInteractionTracker}
          lastEditedField={lastEditedField}
        />
      </CollapsibleSection>
    </View>
  );
};

const baseStyles = StyleSheet.create({
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  phoneCodeWrapper: {
    width: 140,
    maxWidth: 180,
    flexShrink: 0,
  },
  phoneNumberWrapper: {
    flex: 1,
  },
});

export default PersonalInfoSection;
