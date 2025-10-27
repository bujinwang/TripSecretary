// PersonalInfoSection.js
// Personal information form section for Malaysia Travel Info Screen
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';
import { NationalitySelector } from '../../index';
import InputWithUserTracking from '../../InputWithUserTracking';
import { getPhoneCode } from '../../../data/phoneCodes';
import { spacing } from '../../../theme';

/**
 * Personal info section component for Malaysia Travel Info Screen
 * @param {Object} props - Component props
 * @returns {JSX.Element} Personal info section component
 */
const PersonalInfoSection = ({
  // Section state
  isExpanded,
  onToggle,
  fieldCount,

  // Form values
  occupation,
  residentCountry,
  phoneCode,
  phoneNumber,
  email,

  // Setters (using handleFieldChange from validation hook)
  handleFieldChange,
  setOccupation,
  setResidentCountry,
  setPhoneCode,
  setPhoneNumber,
  setEmail,

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
  return (
    <CollapsibleSection
      title={t('malaysia.travelInfo.sections.personal', { defaultValue: '👤 Personal Info / Maklumat Peribadi' })}
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

      <View style={styles.phoneInputContainer}>
        <View style={styles.phoneCodeWrapper}>
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
        <View style={styles.phoneNumberWrapper}>
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
  );
};

const styles = StyleSheet.create({
  phoneInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  phoneCodeWrapper: {
    flex: 0.3,
  },
  phoneNumberWrapper: {
    flex: 0.7,
  },
});

export default PersonalInfoSection;
